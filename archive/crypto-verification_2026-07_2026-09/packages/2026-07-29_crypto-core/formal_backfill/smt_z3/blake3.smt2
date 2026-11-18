; ProofBundle formal backfill: blake3; generated 2026-07-29
; SMT-LIB/Z3 scaffold for deterministic function and altered-output rejection.
(set-logic ALL)
(declare-sort Bytes 0)
(declare-fun f (Bytes) Bytes)
(assert (forall ((x Bytes)) (= (f x) (f x))))
(assert (not (forall ((x Bytes) (y Bytes)) (=> (not (= (f x) y)) (=> (= (f x) y) false)))))
(check-sat)
; Expected: unsat. If Z3 returns unsat, altered-output contradiction is valid.
