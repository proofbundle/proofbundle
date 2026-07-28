Require Import Reals.
Require Import Lra.
Open Scope R_scope.

Section BridgePaper.

Theorem sub_equipoise_threshold : forall LFN LFP : R,
  LFN > LFP -> LFP > 0 -> LFP / (LFN + LFP) < /2.
Proof.
  intros LFN LFP Hgt Hpos.
  assert (LFN + LFP > 0) by lra.
  apply (Rmult_lt_reg_r (LFN + LFP)).
  lra.
Qed.

Theorem decision_threshold_shift : forall alpha beta : R,
  alpha > beta -> beta > 0 -> /2 < alpha / (alpha + beta).
Proof.
  intros alpha beta Hgt Hpos.
  assert (alpha + beta > 0) by lra.
  apply (Rmult_lt_reg_r (alpha + beta)).
  lra.
Qed.

Theorem danger_zone : forall LFN LFP alpha beta : R,
  LFN > LFP -> LFP > 0 -> alpha > beta -> beta > 0 ->
  LFP / (LFN + LFP) < alpha / (alpha + beta).
Proof.
  intros.
  eapply Rlt_trans.
  - apply sub_equipoise_threshold; eauto.
  - apply decision_threshold_shift; eauto.
Qed.

End BridgePaper.
