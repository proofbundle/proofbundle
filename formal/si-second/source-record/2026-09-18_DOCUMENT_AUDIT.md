# 2026-09-18 Audit of "Reports and Facts", and what the formalization now proves

## Provenance and labels

- **Document**: "Reports and Facts — A reference on measurement, records, and the inferences that connect them", supplied in this session, 33 parts plus appendix and colophon. Referred to below by its own part and section numbers.
- **Machine results**: Lean 4.34.0, container clock 2026-09-19T00:31Z UTC (your civil date 18 September; the container runs on UTC and the file names use the civil date). Logs named in each entry.
- Labels: **[document]** stated there. **[recalled]** standard physics, metrology or mathematics, not fetched in this session. **[checked]** machine-checked or arithmetic I performed here. **[inference]** reasoning from the above.

## 1. What the document gets right, checked rather than assumed

I recomputed the numerical claims that carry weight. All of the following are correct as stated [checked, by arithmetic; the physical inputs are recalled]:

- Satellite clock rates: +45 µs/day gravitational, −7 µs/day kinematic, net +38 µs/day; 38 µs of clock error is 11.4 km of ranging error (Part III §11).
- Scale offsets: TAI − UTC = 37 s, GPS − UTC = 18 s, TAI − GPS = 19 s; the three are mutually consistent (Part II §8).
- Base-rate example: 99 true positives against 9,999 false, 10,098 positive verdicts, 0.98 % correct (Part XXVI §170).
- Rare events: the probability of at least one occurrence reaches 1 − e⁻¹ ≈ 63 % when rate × trials = 1 (Part XIX §120).
- Queueing: with waiting time proportional to ρ/(1−ρ), the wait equals the service time at 50 % utilization and is 99 times it at 99 % (Part XIX §124).
- Coordinate precision: a degree of latitude is ≈ 111 km, so the fifth decimal is ≈ 1.1 m and the seventh ≈ 1.1 cm (Part XXV §167).

The treatment of formal verification (Part XV §94) is also accurate and applies to our own artifact: a verified system may fail because the specification did not capture a requirement.

## 2. Findings

**F1. The definition of the second is the pre-2019 one.** Part I §1 gives the second as the duration of 9,192,631,770 periods of the caesium radiation, dated to 1967, with clarifications in 1997 and after. The 2019 SI defines the second by fixing the numerical value of the caesium frequency ΔνCs at 9 192 631 770 when expressed in Hz, which equals s⁻¹ [recalled]. The realized second is the same; the logical form is not. The fixed-constant form separates definition from realization more sharply than the document's own Part I §2 manages, because the defining constant is stipulated and every apparatus is then evaluated against it.

By the document's own taxonomy (Part XXXII §216), this is a category-one claim, "true by adoption" — the class it declares most reliable. Its one dated statement sits in its strongest category. **Repair**: state the 2019 form, and note that the 1967 wording survives as the explicit-form equivalent.

**F2. Gravitational redshift is placed in the wrong budget.** Part I §2 lists the redshift among the sources of a standard's failure to realize the definition, beside the Doppler and blackbody terms. The SI second is a unit of proper time realized locally; the redshift term enters when a local realization is referred to a reference surface in order to contribute to a time scale [recalled]. The document separates ensemble steering into §4, so the placement contradicts its own structure. **Repair**: move the term to the referral step. This is the same correction applied to our kernel earlier, where it is recorded as M5.

**F3. The Allan deviation is described imprecisely.** Part I §3 says it expresses "the expected difference between successive averages of the clock's frequency". It is the square root of one half the expected squared difference of adjacent fractional-frequency averages [recalled]. Without the square and the factor of one half, the quantity described is not the one whose log-log slopes carry the noise-type diagnosis the same paragraph relies on. The remark that flicker noise "has infinite variance in the limit" is loose in the same way: the sample variance of frequency fails to converge as the sample count grows for flicker and random-walk frequency noise, and the Allan variance itself diverges for steeper processes.

**F4. An asymmetry is stated as a symmetry.** Part XXIV §157 says verification "anchors forward from the moment of verification and never backward". Part VIII §36 says an instrument found out of tolerance "casts doubt retrospectively on every measurement made since the previous calibration". Both are right, and the general rule is asymmetric: a failed check propagates backward as doubt, a passed check does not propagate backward as assurance. As written, §157 forbids the inference §36 correctly makes. **Repair**: state the asymmetry.

**F5. The three load-bearing prescriptions are given without their conditions.** This is not an error; it is the gap the formalization now fills.

- Part III §12 says never to derive an ordering from timestamps, and gives no condition under which timestamps do order events.
- Part VI §23 requires that a claim of absence carry a statement of scope, and does not state the premise that converts absence-within-scope into absence.
- Part V §19 says the converse of counter monotonicity "does not hold", without exhibiting what fails.

## 3. What the formalization now proves

New module `2026-09-18_REPORT_TO_FACT.lean`, importing the ledger and through it the kernel, no other library. 162 constants in its namespace, none depending on any axiom; `leanchecker` replays it at exit 0, with a negative control at exit 1. Logs: `2026-09-18_REPORT_TO_FACT_COMPILE_PRINT_AXIOMS.log`, `2026-09-18_ALL_CONSTANTS_SCAN.log`, `2026-09-18_LEANCHECKER.log`.

| Document claim | Theorem | What the theorem adds |
|---|---|---|
| §12, §§13–14: timestamps do not establish order | `order_determined` | The condition: if the readings differ by more than twice the bound, every pair of instants consistent with them is in the reading order |
| the same | `order_not_determined` | Sharpness: inside twice the bound, instants exist that fit both readings and run opposite to them |
| §23: absence needs a scope | `absence_underdetermines_world` | Two worlds differing in what occurred produce the same record, when coverage is partial |
| the same | `absence_with_coverage` | The missing premise, stated as a hypothesis: with coverage of the item, absence in the record does determine absence in the world |
| §19: the converse of counter monotonicity fails | `counter_monotone` | Soundness: any counter increasing along the edges increases along the whole causal order |
| the same | `counter_order_is_not_causal_order` | Two counters, both satisfying the edge conditions, ordering the same concurrent pair oppositely |
| the same | `concurrent_events` | The pair really is concurrent: no causal path either way, proved from the fact that this execution's order never crosses processes |
| §24: attempt is not outcome | `report_underdetermines_outcome` | Two runs with the same report and different state |
| §218: the step from report to fact is an inference | `verdict_depends_only_on_checked` | The kernel's verdict is a function of eight fields; anything else in the record is outside it |
| the same, applied to us | `verdict_blind_to_reported_values` | Changing every reported correction value cannot change the verdict, provided the same effects are listed |
| the same | `impossible_budget_accepted` | A record whose four corrections each report a shift of one part in ten — about fourteen orders of magnitude beyond any real caesium correction — is accepted |

The last three convert a caveat into a theorem. Earlier I reported as a weakness that "correction values are recorded, not used". That is now a proved property of the kernel with an exhibited instance, which is the right standing for it: the limit is in the specification, not in the implementation, and it is now stated where a reader will find it.

## 4. The timestamp rule, stated plainly

Let a reading be within `b` of the instant it was taken, where `b` covers clock offset and synchronization error. Then:

- readings separated by more than `2b` order their instants, in the reading order;
- readings separated by `2b` or less do not order their instants at all.

For the second case the module exhibits the witness rather than asserting it: with `b` = 5, readings 10 and 12 are consistent with instants 15 and 7. The reading order is 10 before 12; the instant order is 7 before 15. Both orders survive the same evidence.

This is the formal content of the document's advice, and it is more useful than the advice, because it says when timestamps may be used rather than only that they usually may not. It also gives the quantity an engineer must obtain before ordering anything by timestamp: not the clock's precision, but a bound on its error, which is the distinction the document draws in Part I §3 and Part IV §14.

## 5. Remaining weaknesses and verification burdens

1. **The audit is not a line-by-line review.** I checked the numerical claims listed in section 1 and the claims that bear on the artifact. The document's empirical claims — memory reconstruction, calibration, encoding accuracy — are recorded here as they stand and were not traced to sources, which the document itself flags as its main deficiency (§217).
2. **The SI Brochure was not fetched in this session.** F1, F2 and F3 rest on recall. They agree with the repairs already applied to the kernel, which were made on the same basis.
3. **The bound in section 4 is assumed, not measured.** The theorems say what follows from `Within bound reading instant`. Obtaining a true bound for a real clock is the whole difficulty, and no theorem supplies it.
4. **The causal-order result is for one execution** with two processes and no messages. Message edges, Lamport clocks constructed rather than assumed, and vector clocks characterizing the order exactly are not formalized.
5. **`counter_monotone` takes the edge conditions as hypotheses.** It does not construct a counter from an execution, so it proves soundness of any such counter, not that the standard algorithm produces one.
6. **No second checker for this module.** The witness JSON has an independent Coq checker; these theorems have only Lean. A Coq mirror of `order_determined` and `order_not_determined` would be the direct next step, since both are pure arithmetic and would port without the parsing machinery.
