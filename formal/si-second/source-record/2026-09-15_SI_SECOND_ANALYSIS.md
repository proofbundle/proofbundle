# 2026-09-15 SI second: claim audit, build record, repairs

## Provenance and labels

- **Source text**: the material pasted into chat on 2026-09-15, ending "What's left is motion."
- **SI definition details**: recalled from the SI Brochure, 9th edition (2019). The brochure was not fetched in this session.
- **Machine results**: Lean 4.34.0 (commit 293d5d0), Lake 5.0.0, run in this session. Full output: `2026-09-15_BUILD_LOG.txt`. Reproduce with `2026-09-15_BUILD.sh`.

Labels: **[source]** stated in the source text. **[recalled]** from the SI Brochure or standard physics or mathematics, not fetched this session. **[checked]** machine-checked in this session; file and declaration named. **[inference]** reasoning from labelled premises. **[interpretation]** a reading the evidence does not settle.

## 1. What is possible here

### Built and checked in this session

1. **The definition of the second as a checkable record** (kernel). A record passes `IsSecond` when it names caesium-133; a transition between the two ground-state hyperfine levels, in either order; each of four conditions (at rest, no static fields, no thermal radiation, isolated) either held at its limit or corrected with a listed correction; and a declared period count equal to 9 192 631 770. The count is held in a binary type defined in the file. No library number type is used. Nothing asserts that an atom or laboratory exists. [checked]
2. **What the check means in ordinary integers** (ledger). `IsDuration n r` holds exactly when the record meets the definition's form and declares n × 9 192 631 770 periods. This rests on proofs that the kernel's binary addition and multiplication equal integer addition and multiplication, and that distinct binary terms write distinct integers. [checked: `isDuration_iff_count`, `Pos.toNat_mul`, `Pos.toNat_inj`]
3. **A clock driven by an external tick** (ledger). After k ticks, seconds × ticksPerSecond + phase = k, and phase < ticksPerSecond, so seconds and phase are the quotient and remainder of the tick count. Instantiated with 9 192 631 770 ticks per second. The proofs cover counting only; whether ticks are evenly spaced is outside them. [checked: `run_total`, `run_phase_lt`, `caesium_run_total`, `caesium_run_phase_lt`]
4. **The part of sealing Lean can prove without a hash library.** The serialization of the binary type is prefix-free, so a count concatenated with other fields reads back uniquely. [checked: `Pos.encode_append_inj`]
5. **Evidence for each defect in the source sketches.** [checked: `2026-09-15_SOURCE_SKETCH_*.lean`, `2026-09-15_UNARY_DEPTH_PROBE.py`]

Every declaration in both modules, including those Lean generates, depends on no axioms: no propext, no Quot.sound, no Classical.choice, no sorryAx. No `omega`, `simp`, or `native_decide`. [checked: audit, 461 kernel + 82 ledger constants]

### Possible, not built in this session

| Item | Missing dependency |
|---|---|
| F\* implementation with fixed-width integers | F\* toolchain not installed in this container |
| EverCrypt seal (SHA-256 + Ed25519 over the record) | HACL\*/EverCrypt not installed in this container |
| Hashing inside Lean with your axiom-free SHA-256 | That artifact is not present in this session |
| Record-level serialization with a proof that distinct records give distinct symbol strings | Not written; `Pos.encode_append_inj` is its base case |
| Decimal carrier with unit exponents for h, e, k | Not written |

### Not possible in any proof assistant

- That a declared count corresponds to periods of a real caesium-133 atom under the stated conditions. That is a measurement claim. In the kernel it is the content of a `Realization` value supplied from outside. [inference]
- Holding 9 192 631 770 in a kernel with no number type. The carrier-free judgment is equivalent to three two-valued choices and has the same content as a copy under any other name. [checked: `bareIsSecond_iff`, `bare_same_content`]

## 2. Check results

| File | Role | Result |
|---|---|---|
| `2026-09-15_SI_SECOND_KERNEL.lean` | Definition layer | Builds; 461 constants; 0 with axioms; forbidden-word scan clean |
| `2026-09-15_SI_SECOND_LEDGER.lean` | Integer meaning; clock | Builds; 82 constants; 0 with axioms |
| `2026-09-15_SI_SECOND_AUDIT.lean` | Audit of all constants | Exit 0 |
| `2026-09-15_SOURCE_SKETCH_DEFECTS.lean` | Defects 1–7 | Compiles; 10 of 10 checks with no axioms; Lean's unused-variable linter flags `n` in `duration` |
| `2026-09-15_SOURCE_SKETCH_SORRY.lean` | Status of `sorry` | Axiom report lists `sorryAx` |
| `2026-09-15_SOURCE_SKETCH_PARSE_FAILURE.lean` | `from` as a field name | Parse error at `from`, exit 1 |
| `2026-09-15_UNARY_DEPTH_PROBE.py` | Unary numeral | See C8 |

Timing in the logged run: kernel and ledger build 1.65 s wall from an empty `.lake` directory; audit 1.29 s. The first Lake run in this container took 61.9 s including Lake's own setup.

Where the natural-number type appears in the kernel [checked]:

- 172 of 461 kernel constants name it directly. All 172 match Lean-generated name patterns (size functions, constructor indices, enum `ofNat`, `noConfusion`, derived equality for enumeration types). 0 are hand-written. None of the 53 hand-written kernel declaration names matches those patterns, so the split cannot hide a hand-written use.
- `caesiumPeriodsPerSecond`, `lightSpeedMetresPerSecond`, `Pos.mul`, `periodsFor`, `IsSecond`, `IsDuration`, `MeetsDefinitionForm`, and `NoCarrier.BareIsSecond` do not reach it through any chain of referenced constants.
- `decIsSecond`, `formOnlyRecord_isSecond`, and `Pos.encode_append_inj` do reach it, through Lean's derived equality and `noConfusion` for enumeration types.

## 3. Claim audit

**C1. "Possible as a verified software clock slaved to an external tick; not possible as the stack inventing the SI second."**
Holds. [source; inference] Built as items 1–4 in section 1.

**C2. "The unit is defined in its own inverse … the apparent circularity is the lock looking at itself."**
Repaired. The definition fixes the numerical value of a physical quantity, ΔνCs, at 9 192 631 770 when expressed in Hz, which equals s⁻¹. [recalled] Solving for the unit gives 1 s = 9 192 631 770 / ΔνCs: the duration of 9 192 631 770 periods of that radiation. [inference] The atom supplies ΔνCs, the numeral is chosen, and the second is the unknown. "Hz = s⁻¹" is a unit relation, not a separate definition the second depends on. No part is circular. The source text's "the non-circular part is physical" is right; "the circular part is metrological" is not. "Frequency and time are two names for the same generator" is removed: its checkable content is that the units of time and frequency are reciprocal, which Hz = s⁻¹ already states.

**C3. "Unperturbed is already false inside the atom" (finite nuclear size; Bohr–Weisskopf effect belongs in the remainder).**
Repaired; category error. The definition names the transition of the caesium-133 atom, not of a model of it. "Unperturbed" restricts external influences. [recalled] Finite nuclear size is part of that atom. It shifts the real transition relative to a point-nucleus calculation, which matters when atomic-structure theory is compared with the measured frequency, not when a clock is realized. [recalled] No realization applies a nuclear-size correction. The source text contradicts itself: it says the conditions "do not say point nucleus", then adds `pointNucleusLimit` to the conditions. Repair: `pointNucleusLimit` and `bohrWeisskopf` removed; the kernel's `Effect` documents the omission. A theory-versus-measurement record, if wanted, is a separate record about calculations, not a realization correction.

**C4. "The filter itself is a limit object; the second is a count toward a witness that cannot sit exactly where the sentence puts it."**
Holds for the external conditions: zero field, zero-temperature radiation, and zero motion are limits reached by evaluated corrections with uncertainties. [recalled] Does not hold for the atom (C3). Kept as `Report.correctedToLimit` plus a listed `Correction` carrying an uncertainty.

**C5. First sketch, "None of that needs axiom."** Status by part:

- `ν_lock : ℕ := ΔνCs` is a default, not a constraint. A record with `ν_lock := 1` is a valid value. [checked: defect 1]
- `Filter` fields typed `Prop` hold statements, not evidence. All-`False` is a valid value. [checked: defect 2]
- `HyperfineWitness` numbers are unconstrained. [checked: defect 3]
- ℚ and ℝ fields need Mathlib. Whether ℝ-typed fields add axioms to the report was not checked: Mathlib was not installed (container has 3 GB RAM). The rebuilt kernel has no ℝ, so the question does not arise for the built files.
- `mF = 0` belongs to realization, not definition: with no external field, the sublevels inside each hyperfine level have the same energy. [recalled] Moved to `Realization.sublevels` and proved not to affect the result. [checked: `sublevels_irrelevant`]
- `height` in the remainder: the SI second is a unit of proper time, realized locally; referring a local result to a reference surface belongs to forming a time scale. [recalled] Removed from corrections; documented in `Effect`.

**C6. Second sketch, "The only sorry above is the literal expansion of the bit-word. That is data, not an axiom."**

- False in Lean: `sorry` elaborates to `sorryAx`, which the axiom report lists. [checked: SORRY file] "Fill it and the kernel is closed" is true once filled.
- Fields named `from` do not parse. [checked: PARSE_FAILURE file]
- `duration n c` does not depend on `n`. [checked: defect 4; Lean's linter also flags it]
- Word equality is spelling equality: a leading zero keeps the value and makes `isSecond` fail. [checked: defect 5] Repair: a binary type with no zero and no padding, where each positive integer has exactly one term.
- The line carries a direction the definition does not have. [checked: defect 6; `bare_rejects_reverse` for the judgment-only version] Repair: `Transition` checks only that the two levels differ. [checked: `reversedTransition_isSecond`, `sameLevel_rejected`]
- "Each correction is more ticks, not ℝ": a tick count is a whole number of at least one. [checked: defect 7] Realization corrections are signed and far smaller than one period per second; the largest are near 10⁻¹³ of the frequency and uncertainties near 10⁻¹⁶. [recalled] Repair: `Shift` (zero, or sign × mantissa × 10^(−exponent)) and `Magnitude` for the uncertainty.

**C7. Species.**
No sketch records the species; any two-level line with the right count passes. [inference from the sketch text] Repair: `Species` field; other species rejected. [checked: `otherSpecies_rejected`]

**C8. Unary numeral, "Filling ΔνCs is clerical … ugly on purpose."**
Not achievable in practice. [checked: probe]

| Settings | Depth | Result |
|---|---|---|
| Default | 100 | Accepted, 0.17 s |
| Default | 1 000 | Rejected: maximum recursion depth |
| Default | 100 000 | Rejected: maximum recursion depth |
| Recursion limit 10⁸ | 10 000 | Accepted, 1.81 s |
| Recursion limit 10⁸ | 100 000 | Stopped by the default heartbeat limit after 22.77 s |
| Recursion limit 10⁸ | 1 000 000 | Aborted: stack overflow |

The full numeral is 9 192 631 769 levels: about 64.3 GB of source at 7 bytes per level, four orders of magnitude past the observed stack overflow. Not tested: heartbeat limit and thread stack raised together. The size figure does not depend on them. A check `p = ΔνCs` against a count produced by tallying would also require comparing two unary terms of that size. [inference]

**C9. Carrier-free judgment, "IsSecond lo hi unperturbed is the second."**
Compiles. It is equivalent to three two-valued choices each taking one value, and has the same content as the same constructors under any other name. [checked: `bareIsSecond_iff`, `bare_same_content`] The source text's conclusion holds: without a carrier the integer is not formalized, only the shape. [checked]

**C10. "No Nat" as a property of the file.**
Holds for hand-written declarations. Does not hold for the environment: Lean generates helper declarations for every inductive type, and those name the natural-number type. [checked: 172 generated, 0 hand-written] The measurable form of the goal holds: the integer and the definition predicates never reach that type. [checked: reachability list]

**C11. "Same pattern for h, e, k, N_A. Those numerals are locks."**
Holds for the integer-valued defining constants: ΔνCs = 9 192 631 770, c = 299 792 458, N_A = 602 214 076 × 10¹⁵, K_cd = 683. Does not hold for h, e, k: their fixed values are decimal fractions (6.626 070 15 × 10⁻³⁴, 1.602 176 634 × 10⁻¹⁹, 1.380 649 × 10⁻²³) in units built from several base units, so they need a decimal carrier and unit exponents. [recalled; inference]

**C12. "PhysLean's axiom was existence of a pair."**
Not checked: the PhysLean repository was not inspected in this session. Kept as the source text's claim. The design rule drawn from it, assert no existence and let values be supplied, is implemented. [checked: kernel contains no existence statement; audit reports no axioms]

**C13. "Classical calculus needs … (1) in that field to mean one unit of the parameter. That (1) was the SI second smuggled in as a field unit."**
Repaired; category error. The real number 1 is the multiplicative identity of the field; units attach to quantities, not to the field. Changing the unit of time multiplies time readings by a positive constant, and derivatives change by the corresponding factor through the chain rule. [recalled] A derivative with respect to time can be defined with no unit chosen: for a quantity varying along a time line, it is a linear map from time differences to quantity differences, and choosing a unit chooses a number to represent that map. [recalled] Calculus needs the continuum, an ordered complete line, not a unit. Consequences:

- "Calculus is the theory of limits on a line with a unit" becomes "… on a line." The unit is not required.
- What the kernel cut removed from calculus is the continuum, which the kernel refused (no ℝ). Removing the numeral removes readings in seconds, not derivatives.
- The later retraction ("it isn't calculus") correctly drops the name "rewritten calculus" for comparison of counts, but rests on the same premise.
- Physics layers can keep ℝ and do calculus without any unit; the SI numeral enters when a result is expressed in seconds. [inference]

**C14. "What's left is motion … Time is the decision to treat that particular motion as the measure of the rest."**
[interpretation] It does not follow from the kernel cut: a file without a number type shows what that file contains, not what time is. It also takes the unit of time for time. The SI defines a unit, not the quantity. The historical part, that clocks have always been processes agreed to be trusted (Earth's rotation, pendulums, quartz, atoms), is accurate. [recalled] "Geometry gives you proper time; it does not give you a tick" holds if "tick" means unit: spacetime geometry fixes ratios of proper times along worldlines, and the unit is a convention. [recalled]

## 4. Modification record

Changes from the source text's sketches to the built files.

| # | Change | Reason | Location |
|---|---|---|---|
| M1 | Unary and list-of-bits carriers → canonical positive binary `Pos` (`one`, `twice`, `twicePlusOne`) | C6 padding defect; C8 size | Kernel §1 |
| M2 | 9 192 631 770 generated by program as a 34-digit `Pos` term, round-tripped in Python, checked against the decimal literal in Lean | Remove hand-transcription risk | Kernel §2; `caesiumPeriodsPerSecond_value` |
| M3 | `lightSpeedMetresPerSecond` = 299 792 458 added as data and checked; no length record | Source text names c for the metre | Kernel §2; `lightSpeedMetresPerSecond_value` |
| M4 | `pointNucleusLimit` and `bohrWeisskopf` removed | C3 | Kernel `Effect` doc |
| M5 | `height` removed from corrections | C5 | Kernel `Effect` doc |
| M6 | `mF = 0` moved from definition to `Realization.sublevels` | C5; proved irrelevant | `sublevels_irrelevant` |
| M7 | Direction removed from the transition | C6 defect 6 | `Transition`, `MeetsDefinitionForm` |
| M8 | `Species` field added | C7 | `Realization.species` |
| M9 | `Prop`-field filter and two-constructor filter → per-condition `Report` for four named conditions; "corrected" requires a listed correction for that effect | C5 defect 2; the dirty/unperturbed split could not record a correction | `Report`, `Addressed`, `Listed` |
| M10 | Remainder of ticks or ℝ → `Correction` with `Effect`, signed decimal `Shift`, decimal `Magnitude` uncertainty | C6 defect 7 | Kernel §4 |
| M11 | `duration` now uses `n`: requires n × 9 192 631 770 periods, with multiplication proved correct | C6 defect 4 | `IsDuration`, `isDuration_iff_count` |
| M12 | Default-valued `ν_lock` field removed; the integer is a definition the check compares against | C5 defect 1 | `periodsFor` |
| M13 | `sorry` → filled term | C6 | Kernel §2 |
| M14 | Clock added as Lean code (source text's step 2); Lean used in place of F\* | F\* not installed | Ledger |
| M15 | Prefix-free serialization of `Pos` with proof added (Lean-provable part of step 3) | Seal binds bytes | `Pos.encode`, `Pos.encode_append_inj` |
| M16 | `set_option genInjectivity false` in kernel and ledger | First audit run found 8 generated injectivity equations (7 kernel, 1 ledger) depending on propext; nothing used them; audit now reports 0 | Kernel and ledger headers |
| M17 | Carrier-free judgment kept, renamed only, with proofs of what it contains | C9 | `NoCarrier` |

Changes made during this session to files delivered to you mid-session:

- The interim `2026-09-15_SI_SECOND_LEDGER.lean` did not compile (three rewrite-order errors). Repaired: two proof steps shortened, and explicit arguments given to `Nat.add_one_mul` and `two_mul_mul` so the rewrite cannot match the literal 2 as 1 + 1 on the wrong side. `step_total` given explicit arguments as a precaution.
- The interim kernel and ledger lacked M16.
- The interim kernel header claimed no axioms for every declaration before that was true. Corrected, and reworded so the forbidden-word scan passes on comment text.

The final files supersede the interim ones. Compare against `2026-09-15_MANIFEST.txt`.

## 5. Remaining weaknesses, open risks, verification burdens

1. **Physical content is outside every check.** `IsSecond` checks the form of a claim. A record with correct form and false data passes. The four conditions and their mapping to the definition's words are a reading of the brochure, recalled, not quoted. Burden: fetch the SI Brochure 9th edition and the mise en pratique for the second; check the conditions and the proper-time statement against the text.
2. **The four-condition reading may be incomplete.** Realizations also correct effects the definition does not name (for example cavity-related and microwave-related shifts). These go under `otherEffect`, which the check does not require. Whether any should be mandatory is a policy decision not settled here.
3. **Correction values are recorded, not used.** The kernel does not sum corrections, compare uncertainties to a budget, or check signs. A record listing a correction with a wrong value passes.
4. **Decision procedures reach the natural-number type** through Lean's derived enum equality and `noConfusion`. If the requirement is that no checking path passes through that type, hand-written equality is needed for every enum type, and generated `noConfusion` for enums would still use it. Not attempted.
5. **Serialization covers one field type.** The seal needs serialization for whole records (enums, lists, decimal values) with the same property, then a hash and a signature. None of those exist here.
6. **The clock uses unbounded integers.** A fixed-width implementation needs overflow bounds: a single 64-bit count of caesium periods wraps after 2 006 688 023 s, about 63.6 years [checked: `raw64_caesium_count_wrap_seconds`]; the split state keeps phase below 2³⁴ [checked: `caesium_phase_fits_34_bits`]. No fixed-width implementation or refinement proof exists.
7. **The clock proof says nothing about missed, doubled, or late ticks.** A dropped edge is indistinguishable from a slower source. Detecting that needs a second time source and a comparison record.
8. **Probe limits are for this container** (1 CPU, 3 GB RAM). Heartbeat limit and thread stack were not raised together.
9. **Toolchain dependence.** Which core lemmas carry propext varies by Lean version; in 4.34.0, `Nat.add_mul`, `Nat.mul_assoc`, `Nat.right_distrib`, and the div/mod lemmas carry it, while `Nat.add_one_mul` and `Nat.left_distrib` do not. A toolchain change can introduce axioms with no source change. Rerun the audit on any toolchain change.
10. **Not checked:** whether ℝ-typed fields in the first sketch add axioms (Mathlib not installed); PhysLean's actual declarations (repository not inspected); SI Brochure wording (not fetched).
11. **The audit's generated/hand-written split uses name patterns.** Checked against the 53 hand-written kernel names, none of which match. A future hand-written name containing a pattern would be misfiled; re-run the name check with any kernel change.
