# GPXGrace.v → GPXDiachronic.v

Names and comments changed. No theorem statement changed. The file closes with
the same 18 theorems before and after the rename, verified by compiling both.

Reason: the module's mechanism is a scoped, attributed, time-bounded, revocable
override that sits above the meet and never enters it. "Grace", "mercy", and
"pardon" describe an intent rather than the mechanism, and invite a reader to
assume the override can produce a pass, which the theorems explicitly forbid.

## Types and constructors

| before | after |
|---|---|
| `SGraced` | `SOverridden` |
| `Grant` | `Override` |
| `mkGrant` | `mkOverride` |
| `gr_grantor` | `ov_issuer` |
| `gr_axis` | `ov_axis` |
| `gr_reason` | `ov_reason` |
| `gr_window` | `ov_window` |
| `j_grant` | `j_override` |

## Functions

| before | after |
|---|---|
| `grant_grace` | `apply_override` |
| `revoke_grace` | `revoke_override` |

## Theorems

| before | after |
|---|---|
| `graced_is_not_pass` | `overridden_is_not_pass` |
| `graced_ranks_below_pass` | `overridden_ranks_below_pass` |
| `graced_ranks_above_fail` | `overridden_ranks_above_fail` |
| `grace_preserves_raw` | `override_preserves_raw` |
| `grace_revocable` | `override_revocable` |
| `grace_never_automatic` | `override_never_automatic` |
| `grace_cannot_launder` | `override_cannot_produce_pass` |
| `grace_scoped` | `override_scoped` |
| `grace_expires` | `override_expires` |
| `grace_not_yet_active` | `override_not_yet_active` |
| `meet_unchanged_by_grace` | `meet_unchanged_by_override` |
| `grace_does_not_weaken_meet` | `override_does_not_weaken_meet` |
| `grace_does_not_accumulate` | `override_does_not_accumulate` |
| `audit_exposes_grantor` | `audit_exposes_issuer` |
| `ungraced_has_no_grantor` | `absent_override_has_no_issuer` |

Unchanged: `standing_of`, `standing_rank`, `raw`, `effective`, `audit`,
`revoke_preserves_raw`, `raw_always_recoverable`, `audit_exposes_raw`.

## Build

`_CoqProject` and `Makefile` updated. `make check` prints:

    GPXBoundary      closed=42 non-closed=0
    GPXTemporal      closed=23 non-closed=0
    GPXDiachronic    closed=18 non-closed=0
    --- forbidden axioms (must be empty) ---
      none
