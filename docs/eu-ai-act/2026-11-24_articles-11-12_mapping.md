# 2026-11-24 regulation (eu) 2024/1689, articles 11 and 12: what proofbundle provides, paragraph by paragraph

written by claude-opus-5-5 on 2026-11-24. status: prenormative. not legal advice.

## source text and its custody

the article text this mapping reads from was fetched from eur-lex on 2026-11-24 (`docs/eu-ai-act/source/2026-11-24_eurlex_OJ_L_202401689_en.html`, 1,264,461 bytes, sha256 `1cae18c340d7fa1d725a347379a745334cc8244a5ff7777520bbd9c30a235484`) and extracted to plain text beside it: article 11 (sha256 `c70d8e93…a82`), article 12 (`0e16839c…20c`), article 19 (`c758ad2c…966`), article 26 (`7992c784…010`) and annex iv (`9cf17955…218`). every quotation below is from those files.

the oj text is the 2024 regulation as published. the digital omnibus on ai, adopted in 2026, moved the application date of the high-risk obligations, articles 11 and 12 among them, to 2 december 2027 for stand-alone annex iii systems and 2 august 2028 for systems embedded in annex i products; it did not rewrite the two articles. the consolidated text is not in this folder and should be added when eur-lex publishes it.

## what proofbundle is in the regulation's terms

proofbundle is not an ai system and is not itself subject to articles 11 and 12. those articles bind the provider of a high-risk ai system (article 16) and, through articles 19 and 26(6), the keeping of its logs by providers and deployers. proofbundle is tooling a provider or deployer can use to produce and keep the evidence those articles call for. using it does not make any system compliant, does not substitute for a conformity assessment under article 43, and is not a harmonised standard under article 40. where this document says "provides", it means the mechanism exists in this repository and has been run; where it says "supports", the provider still has to do the work; where it says "outside", proofbundle has no part in it.

## article 11, technical documentation

| text | proofbundle | standing |
|---|---|---|
| 11(1) "drawn up before that system is placed on the market or put into service and shall be kept up-to date" | every document sealed through the client or `tools/pb-act` gets a sha256, sha3-384 and blake3 digest, a hash-chained record and an opentimestamps (bitcoin) and rfc 3161 attestation. those fix that a given version existed no later than the attested time, and the chain orders later versions after it. | provides evidence of when each version existed and that none was altered afterwards. whether the content was drawn up before placing on the market is the provider's act; the timestamps make it checkable. |
| 11(1) "demonstrate that the high-risk ai system complies with the requirements set out in this section" | nothing. compliance with articles 8 to 15 is a property of the ai system and its development process. | outside. |
| 11(1) "contain, at a minimum, the elements set out in annex iv" | the client can hold each annex iv element as a separately sealed artifact with its own digest, so a national authority can be handed the set with a manifest whose root covers every element. | supports. the provider writes the elements. |
| 11(1) smes "in a simplified manner" using the commission's form | no form has been checked here. | outside until the commission form exists and is mapped. |
| 11(2) one set of documentation for annex i section a products | same mechanism; one manifest may cover the ai act elements and the sectoral ones. | supports. |
| 11(3) delegated acts amending annex iv | an amendment changes the element list; the sealed manifest records which version of annex iv a documentation set was built against. | supports, once the list version is recorded in the manifest (not yet a field). |

## article 12, record-keeping

| text | proofbundle | standing |
|---|---|---|
| 12(1) "shall technically allow for the automatic recording of events (logs) over the lifetime of the system" | `tools/pb-act` records each action automatically at the moment it happens: the signed intent, the verifier's single verdict from the 46-code enum in `src/verdict/verdict.mjs`, the command, the output bytes as written, their digests, the exit code, the verifier's countersignature, and the link to the previous record in the agent's chain and the global chain. the ledger is append-only ndjson; each record is also its own file, stamped. | provides the recording mechanism for actions taken through it. an ai system logs automatically only if its actions are routed through the gate; the provider has to wire that in. |
| 12(2) logging "appropriate to the intended purpose" for (a) identifying risk situations or substantial modification, (b) post-market monitoring under article 72, (c) monitoring operation under article 26(5) | every record carries a verdict, so refusals (POLICY_DENIED, INVALID_SIGNATURE, LINEAGE_INVALID, DIGEST_MISMATCH and the rest) are themselves logged events that can be queried; the chain lets a monitor prove no record was removed between two checks. | supports. what counts as a risk event for a given system is the provider's definition. |
| 12(3)(a) for annex iii point 1(a) systems, "the period of each use … (start date and time and end date and time of each use)" | each run record holds the intent time (utc and a monotonic counter), the determination time and the elapsed nanoseconds of execution. | provides start, determination and duration per action; "use" as a session boundary has to be defined by the provider. |
| 12(3)(b) "the reference database against which input data has been checked" | a read or copy record binds the exact bytes of every input file by three digests. a reference database identified by file and digest is recorded that way. | supports. |
| 12(3)(c) "the input data for which the search has led to a match" | same: inputs are bound by digest; match semantics belong to the system. | supports. |
| 12(3)(d) "the identification of the natural persons involved in the verification of the results, as referred to in article 14(5)" | agent identities are keys in a registry; a human verifier can be given a key the same way, and their countersignature then identifies them in the record. | supports. no human identities are registered today. |

## articles 19 and 26(6), keeping the logs

article 19(1) requires providers to keep the article 12(1) logs "for a period appropriate to the intended purpose … of at least six months"; article 26(6) puts the same six-month floor on deployers for logs under their control. proofbundle never deletes: the gate refuses deleting commands outright, and records are appended, never rewritten. that meets a floor; it does not implement a retention end, and data-protection law may require one (article 19(1) itself defers to union law on personal data). a retention policy with a sealed, logged expiry is not built.

## what has been run to back these statements

the cryptography the records rest on is the repository's own from-scratch code, run against published nist acvp sample vectors on 2026-11-24: results in `conformance/nist-acvp-extended/`, with every group either run (pass and fail counts) or listed as not run with its reason. the action gate's own checks (live output, refusal of deletes, unregistered agents, overwrite refusal, byte-exact output capture, tamper detection on recomputation) were run on 2026-11-24 and are in the operator's ops-logs folder for that day. neither is cavp validation, fips 140 certification, or a conformity assessment.
