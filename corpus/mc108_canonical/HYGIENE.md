# mc108 — naming and count defects, and the canonical fix

Every number below is from a compile I ran here: Coq 8.18.0, Ubuntu 24.04, all
88 files from `mc108_custody.zip`.

    COMPILE            41 / 88 RC0     — reproduces the independent audit exactly
    PRINT ASSUMPTIONS  473 closed      — reproduces the independent audit exactly

The audit is confirmed. What follows is about the naming and the ledger, not the
proofs.

---

## 1. The published theorem count is inflated by 526

`mc108_README.md` headlines **895 theorems**. Summing `theorems_closed` in
`mc108_MANIFEST.tsv` gives 891. A clean `Print Assumptions` over those same 22
files gives **365**.

Cause, reproduced: nine of those files already contain their own
`Print Assumptions` lines in the source. The counting script compiled the file —
producing that built-in output — and then appended its own sweep and counted the
whole log. Every affected file is exactly doubled:

    file    MANIFEST   clean   own PA lines
    f026          86      43             43
    f027          20      10             10
    f029          44      22             22
    f037          32      16             16
    f041          40      20             20
    f058          80      43             37
    f065          80      40             40
    f076          40      20             20
    f079          78      40             38

I hit the identical bug on my first pass and got 857 before stripping the
built-in lines. The fix is one filter:

    grep -v '^[[:space:]]*Print Assumptions' "$f.v" > tmp.v

Two outliers are not doubling. `f036` is listed at 276; it emits 151 built-in
`Closed` lines but **0** statements close when `Print Assumptions` is run by name
on a stripped copy — its 149 theorems sit inside closed Sections, so the built-in
output is not attributable to the names it exports. `f089` is listed at 4 and
closes 0. Both need looking at before either number is published again.

## 2. Three file counts in one README

    headline                   23 files
    framework breakdown        24 files   (3 + 8 + 6 + 1 + 2 + 4)
    MANIFEST.tsv               22 rows

## 3. The naming picked helper lemmas over principal results

The convention is right. The theorem selection was not — it took whatever
appeared first, so files are named after scaffolding:

    f037  named  dim_eqb_refl                  should be  T13_dimensional_independence
    f065  named  reach_n_mono                  should be  T1_DAG_acyclicity
    f079  named  reach_n_mono                  should be  T1_DAG_acyclicity
    f026  named  recoverability_decidable      should be  lyapunov_stability
    f058  named  recoverability_decidable      should be  lyapunov_stability
    f035  named  conjunctive_blocking          should be  full_independence
    f036  named  consciousnessattribution      should be  t15_failure_meet_localized

`recoverability_decidable` is f039's principal theorem, filed under
`operator_algebra`. Naming f026 and f058 after it put a foreign theorem's name on
two `recovery` files — a cross-framework collision on a theorem belonging to
neither.

## 4. Identifier casing and separators were destroyed

    consciousness__exclusion_class_blocks_attributionm__   attributionM lowercased, M glued on
    crypto_provenance__formalcandidates__                  formal_candidates, separator lost
    crypto_provenance__continuitysuppressionguard__        continuity_suppression_guard
    recovery__consciousnessattribution__                   consciousness_attribution

A name that cannot be grepped back to the identifier it came from is not a name.
The fix is to snake_case on the camel boundary rather than lowercasing the whole
string:

    re.sub(r'(?<=[a-z0-9])(?=[A-Z])', '_', ident).lower()

## 5. Verified status was not in the path

`mc108_README.md` describes the tree as "verified-clean core" and then contains
`f021`, which has zero statements, and `f036` and `f089`, which close zero. A
reader has to consult a separate TSV to learn that. Status belongs in the path,
where it cannot drift from the file.

---

## The canonical scheme

    <status>/<framework>/<framework>__<principal_theorem>__<sha8>.v

    01_proved             22   compiles, ≥1 statement, zero axiom dependencies
    02_axiom_dependent    18   compiles, ≥1 statement depends on an axiom
    03_no_statements       1   compiles, exports nothing
    04_uncompiled         47   no .vo produced

Principal theorem is taken from the `PRINCIPAL THEOREM` column you curated in
`mc108_RENAME_MAP_v2.md`, falling back to the last `Theorem` in the file — proofs
build toward their conclusion, so the last one is the result, not the first.

`sha8` is the first eight hex of the file's sha256. It disambiguates duplicate
families without inventing `_b` `_c` `_d` suffixes, which carry no information
and sort wrong. There are zero filename collisions across all 88.

Duplicate families now sit side by side and read as duplicates:

    01_proved/authorization/authorization__t1_dag_acyclicity__f4f759e3.v      was f065
    01_proved/authorization/authorization__t1_dag_acyclicity__8776277e.v      was f079

The three that matter, in one place:

    04_uncompiled/operator_algebra/operator_algebra__demo20_gress_attested__1cd3f1ff.v    was f022
    04_uncompiled/operator_algebra/operator_algebra__gress_is_core_candidate__9d304add.v  was f048
    04_uncompiled/operator_algebra/operator_algebra__gress_core_eligible_demo__b8f76552.v was f056

## Applying it

    cd <dir with the fNNN.v files>
    /path/to/apply_rename.sh

It verifies each file's sha256 against `RENAME.tsv` before moving, refuses on
mismatch, uses `git mv` inside a repo, and deletes nothing. Four files needed a
principal name by hand — `f021` `f025` `f086` `f092` — and are marked in the TSV;
change them there and re-run.

## On the BOM theory

Wrong. I checked all 88 files: no byte-order marks, and one non-ASCII character
in a comment in `f046.v`. The 47 failures here are not encoding damage. Your
README already says it correctly — the AppleDouble corruption was in a specific
zip, not in these sources. The line-1 lexer errors in the 2026-07-02 log came
from that damaged copy, not from this tree.
