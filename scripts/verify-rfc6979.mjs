import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from '../crypto/hash.mjs';
import {ecdsaSign} from '../crypto/ecdsa.mjs';
const fixture=JSON.parse(fs.readFileSync('vectors/rfc6979.json','utf8'));
let passed=0;for(const v of fixture.vectors){const key=Uint8Array.from(v.private_key.match(/../g),x=>parseInt(x,16)),actual=ecdsaSign(key,new TextEncoder().encode(v.message),v.curve).raw;assert.equal(Buffer.from(actual).toString('hex').toUpperCase(),v.r+v.s);passed++;}
const receipt={schema:'ProofBundleConformanceReceipt/v1',executed_at:new Date().toISOString(),suite:'RFC6979 published signatures',passed,failed:0,fixture_source:fixture.source_url,fixture_source_sha256:fixture.source_sha256,implementation_sha256:createHash('sha256').update(fs.readFileSync('crypto/ecdsa.mjs')).digest('hex'),fixture_sha256:createHash('sha256').update(fs.readFileSync('vectors/rfc6979.json')).digest('hex')};
fs.writeFileSync('reports/native-repair-20261013/rfc6979.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
