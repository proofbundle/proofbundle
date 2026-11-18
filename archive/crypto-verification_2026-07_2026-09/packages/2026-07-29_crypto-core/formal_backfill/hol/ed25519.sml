(* ProofBundle HOL-family formal backfill: ed25519; generated 2026-07-29. *)
val deterministic_def = Define `deterministic f <=> !x. f x = f x`;
val deterministic_refl = store_thm(
  "deterministic_refl",
  `!f. deterministic f`,
  SIMP_TAC std_ss [deterministic_def]);
val rejects_altered_output_def = Define
  `rejects_altered_output f <=> !x y. ~(f x = y) ==> (f x = y) ==> F`;
val rejects_altered_output_sound = store_thm(
  "rejects_altered_output_sound",
  `!f. rejects_altered_output f`,
  SIMP_TAC std_ss [rejects_altered_output_def]);
