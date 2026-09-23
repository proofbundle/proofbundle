-- SPDX-License-Identifier: GPL-3.0-or-later
import ProofBundle.Loop
import ProofBundle.AgentPromptLaw

open ProofBundle.Loop

#print axioms loopFull_reciprocal
#print axioms loopFull_shell
#print axioms loopFull_closed
#print axioms loopFull_broadcast
#print axioms loopFull_full
#print axioms htmlPrefix_not_full
#print axioms htmlPrefix_not_closed
#print axioms htmlPrefix_not_reciprocal
#print axioms htmlPrefix_has_ingress
#print axioms htmlPrefix_missing_reenter
#print axioms faithful_preserves
#print axioms unfaithful_never_preserves
#print axioms machine_eq_loop
#print axioms machine_full
#print axioms identify_id
#print axioms payloadId_both
#print axioms payloadId_fail_left
#print axioms payloadId_fail_right
#print axioms hook_loop_true
#print axioms hook_html_false

open ProofBundle.AgentPromptLaw

#print axioms evidence_classes_distinct
#print axioms sameSurface_refl
#print axioms different_session_not_same
#print axioms pending_head_not_complete
#print axioms complete_queue_has_no_pending
#print axioms paper_receipts_are_insufficient
#print axioms admissible_requires_target_match
#print axioms admissible_requires_result_verification
#print axioms direct_result_admissible
#print axioms future_pledge_prohibited
#print axioms presence_signal_prohibited
#print axioms unverified_completion_prohibited
#print axioms mira_engine_not_interface
#print axioms mira_engine_not_database
#print axioms hard_ban_supersedes_ordinary
#print axioms invalid_output_supersedes_ordinary
#print axioms bridge_supersedes_hard_ban
