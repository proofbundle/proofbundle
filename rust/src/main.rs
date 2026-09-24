// SPDX-License-Identifier: GPL-3.0-or-later
use anyhow::{bail, Context, Result};
use clap::{Parser, Subcommand};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::{fs::{self, File}, io::{BufReader, Read}, path::{Path, PathBuf}, time::{SystemTime, UNIX_EPOCH}};
use tiny_http::{Header, Response, Server, StatusCode};
use walkdir::WalkDir;

#[derive(Parser)]
#[command(name="proofbundle", version, about="Native artifact custody, registry audit, and web runtime")]
struct Cli { #[command(subcommand)] command: Command }

#[derive(Subcommand)]
enum Command {
    Selftest,
    Hash { #[arg(required=true)] files: Vec<PathBuf> },
    Index { path: PathBuf, #[arg(short,long)] out: Option<PathBuf> },
    VerifyIndex { index: PathBuf, #[arg(long)] root: Option<PathBuf> },
    Registry { #[arg(default_value="ALGORITHM_REGISTRY.json")] path: PathBuf },
    Serve { #[arg(default_value=".")] root: PathBuf, #[arg(long,default_value="127.0.0.1:8080")] listen: String },
}

#[derive(Debug,Serialize,Deserialize)]
struct Artifact { path:String, bytes:u64, sha256:String, modified_unix:Option<u64> }
#[derive(Debug,Serialize,Deserialize)]
struct Index { schema:String, generated_unix:u64, root:String, artifacts:Vec<Artifact> }

fn sha256_file(path:&Path)->Result<(String,u64)> { let f=File::open(path).with_context(||format!("open {}",path.display()))?; let mut r=BufReader::new(f); let mut h=Sha256::new(); let mut b=[0u8;1024*1024]; let mut n=0u64; loop { let got=r.read(&mut b)?; if got==0 {break} h.update(&b[..got]); n+=got as u64; } Ok((hex::encode(h.finalize()),n)) }
fn modified(path:&Path)->Option<u64>{fs::metadata(path).ok()?.modified().ok()?.duration_since(UNIX_EPOCH).ok().map(|d|d.as_secs())}
fn make_index(root:&Path)->Result<Index>{let mut artifacts=Vec::new();for e in WalkDir::new(root).follow_links(false){let e=e?;if e.file_type().is_file(){let p=e.path();let (sha256,bytes)=sha256_file(p)?;artifacts.push(Artifact{path:p.strip_prefix(root).unwrap_or(p).to_string_lossy().replace('\\',"/"),bytes,sha256,modified_unix:modified(p)});}}artifacts.sort_by(|a,b|a.path.cmp(&b.path));Ok(Index{schema:"PB-ARTIFACT-INDEX-1".into(),generated_unix:SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs(),root:root.canonicalize()?.display().to_string(),artifacts})}
fn verify_index(path:&Path,root:Option<&Path>)->Result<()> {let idx:Index=serde_json::from_reader(File::open(path)?)?;if idx.schema!="PB-ARTIFACT-INDEX-1"{bail!("unsupported schema {}",idx.schema)}let base=root.map(PathBuf::from).unwrap_or_else(||PathBuf::from(&idx.root));let mut bad=0;for a in &idx.artifacts{let p=base.join(&a.path);match sha256_file(&p){Ok((h,n)) if h==a.sha256&&n==a.bytes=>{},Ok((h,n))=>{eprintln!("MISMATCH {} bytes={}/{} sha256={}/{}",a.path,n,a.bytes,h,a.sha256);bad+=1},Err(e)=>{eprintln!("MISSING {}: {e}",a.path);bad+=1}}}if bad>0{bail!("{} artifact(s) failed verification",bad)}println!("VERIFIED {} artifacts",idx.artifacts.len());Ok(())}
fn registry(path:&Path)->Result<()> {let v:Value=serde_json::from_reader(File::open(path)?)?;let rows=v.as_array().or_else(||v.get("algorithms")?.as_array()).context("registry must be an array or contain algorithms[]")?;let mut ids=std::collections::BTreeSet::new();for (i,r) in rows.iter().enumerate(){let id=r.get("id").or_else(||r.get("algorithm_id")).and_then(Value::as_str).with_context(||format!("row {i} has no id"))?;if !ids.insert(id){bail!("duplicate algorithm id {id}")}}println!("VALID {} unique algorithm records",rows.len());Ok(())}
fn content_type(p:&Path)->&'static str{match p.extension().and_then(|x|x.to_str()).unwrap_or(""){"html"=>"text/html; charset=utf-8","css"=>"text/css; charset=utf-8","js"|"mjs"=>"text/javascript; charset=utf-8","json"=>"application/json","svg"=>"image/svg+xml","png"=>"image/png","md"=>"text/markdown; charset=utf-8",_=>"application/octet-stream"}}
fn serve(root:&Path,listen:&str)->Result<()> {let root=root.canonicalize()?;let server=Server::http(listen).map_err(|e|anyhow::anyhow!(e.to_string()))?;println!("ProofBundle listening on http://{listen}");for req in server.incoming_requests(){let url=req.url().split('?').next().unwrap_or("/");if url=="/healthz"{let _=req.respond(Response::from_string("ok\n"));continue}let rel=url.trim_start_matches('/');let mut p=root.join(if rel.is_empty(){"index.html"}else{rel});if p.is_dir(){p=p.join("index.html")}if !p.starts_with(&root){let _=req.respond(Response::empty(StatusCode(403)));continue}match fs::read(&p){Ok(body)=>{let h=Header::from_bytes("Content-Type",content_type(&p)).unwrap();let _=req.respond(Response::from_data(body).with_header(h));},Err(_)=>{let _=req.respond(Response::from_string("not found\n").with_status_code(404));}}}Ok(())}
fn main()->Result<()> {match Cli::parse().command{Command::Selftest=>{let got=hex::encode(Sha256::digest(b"abc"));if got!="ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"{bail!("SHA-256 KAT failed")}println!("PASS SHA-256 KAT")},Command::Hash{files}=>for p in files{let(h,n)=sha256_file(&p)?;println!("{}  {}  {}",h,n,p.display())},Command::Index{path,out}=>{let idx=make_index(&path)?;let json=serde_json::to_string_pretty(&idx)?;if let Some(p)=out{fs::write(&p,json+"\n")?;println!("INDEXED {} artifacts -> {}",idx.artifacts.len(),p.display())}else{println!("{json}")}},Command::VerifyIndex{index,root}=>verify_index(&index,root.as_deref())?,Command::Registry{path}=>registry(&path)?,Command::Serve{root,listen}=>serve(&root,&listen)?}Ok(())}
