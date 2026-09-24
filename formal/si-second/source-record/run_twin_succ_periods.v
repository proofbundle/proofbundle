From Coq Require Import String.
From SIC Require Import SI_SECOND_CHECKER_2026_09_15.
Definition input : String.string := "{""atRest"":""correctedToLimit"",""corrections"":[{""effect"":""motion"",""shift"":""zero"",""uncertainty"":""zero""},{""effect"":""staticFields"",""shift"":""zero"",""uncertainty"":""zero""},{""effect"":""thermalRadiation"",""shift"":""zero"",""uncertainty"":""zero""},{""effect"":""collisions"",""shift"":""zero"",""uncertainty"":""zero""}],""isolated"":""correctedToLimit"",""noStaticFields"":""correctedToLimit"",""noThermalRadiation"":""correctedToLimit"",""periods"":""110110111011011000110111110001000."",""species"":""caesium133"",""sublevels"":""zeroToZero"",""transition"":{""levelA"":""fThree"",""levelB"":""fFour""}}"%string.
Eval vm_compute in check input.
Definition result := Eval vm_compute in check input.
Print result.
Lemma result_is_check_input : result = check input.
Proof. reflexivity. Qed.
Print Assumptions result_is_check_input.
