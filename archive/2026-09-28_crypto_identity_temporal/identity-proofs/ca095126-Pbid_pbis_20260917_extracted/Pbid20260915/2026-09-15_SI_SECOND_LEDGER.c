// Lean compiler output
// Module: «2026-09-15_SI_SECOND_LEDGER»
// Imports: public import Init public meta import Init public import «2026-09-15_SI_SECOND_KERNEL»
#include <lean/lean.h>
#if defined(__clang__)
#pragma clang diagnostic ignored "-Wunused-parameter"
#pragma clang diagnostic ignored "-Wunused-label"
#elif defined(__GNUC__) && !defined(__CLANG__)
#pragma GCC diagnostic ignored "-Wunused-parameter"
#pragma GCC diagnostic ignored "-Wunused-label"
#pragma GCC diagnostic ignored "-Wunused-but-set-variable"
#endif
#ifdef __cplusplus
extern "C" {
#endif
extern lean_object* lp_si__second_SISecond_caesiumPeriodsPerSecond;
lean_object* lean_nat_mul(lean_object*, lean_object*);
lean_object* lean_nat_add(lean_object*, lean_object*);
uint8_t lean_nat_dec_eq(lean_object*, lean_object*);
lean_object* lean_nat_to_int(lean_object*);
lean_object* l_Nat_reprFast(lean_object*);
lean_object* lean_string_length(lean_object*);
lean_object* lean_nat_sub(lean_object*, lean_object*);
LEAN_EXPORT lean_object* lp_si__second_SISecond_Pos_toNat(lean_object*);
LEAN_EXPORT lean_object* lp_si__second_SISecond_Pos_toNat___boxed(lean_object*);
LEAN_EXPORT lean_object* lp_si__second_SISecond_Pos_carry(uint8_t);
LEAN_EXPORT lean_object* lp_si__second_SISecond_Pos_carry___boxed(lean_object*);
LEAN_EXPORT uint8_t lp_si__second_SISecond_instDecidableEqClockState_decEq(lean_object*, lean_object*);
LEAN_EXPORT lean_object* lp_si__second_SISecond_instDecidableEqClockState_decEq___boxed(lean_object*, lean_object*);
LEAN_EXPORT uint8_t lp_si__second_SISecond_instDecidableEqClockState(lean_object*, lean_object*);
LEAN_EXPORT lean_object* lp_si__second_SISecond_instDecidableEqClockState___boxed(lean_object*, lean_object*);
static const lean_string_object lp_si__second_SISecond_instReprClockState_repr___redArg___closed__0_value = {.m_header = {.m_rc = 0, .m_cs_sz = 0, .m_other = 0, .m_tag = 249}, .m_size = 3, .m_capacity = 3, .m_length = 2, .m_data = "{ "};
static const lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__0 = (const lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__0_value;
static const lean_string_object lp_si__second_SISecond_instReprClockState_repr___redArg___closed__1_value = {.m_header = {.m_rc = 0, .m_cs_sz = 0, .m_other = 0, .m_tag = 249}, .m_size = 8, .m_capacity = 8, .m_length = 7, .m_data = "seconds"};
static const lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__1 = (const lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__1_value;
static const lean_ctor_object lp_si__second_SISecond_instReprClockState_repr___redArg___closed__2_value = {.m_header = {.m_rc = 0, .m_cs_sz = sizeof(lean_ctor_object) + sizeof(void*)*1 + 0, .m_other = 1, .m_tag = 3}, .m_objs = {((lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__1_value)}};
static const lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__2 = (const lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__2_value;
static const lean_ctor_object lp_si__second_SISecond_instReprClockState_repr___redArg___closed__3_value = {.m_header = {.m_rc = 0, .m_cs_sz = sizeof(lean_ctor_object) + sizeof(void*)*2 + 0, .m_other = 2, .m_tag = 5}, .m_objs = {((lean_object*)(((size_t)(0) << 1) | 1)),((lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__2_value)}};
static const lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__3 = (const lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__3_value;
static const lean_string_object lp_si__second_SISecond_instReprClockState_repr___redArg___closed__4_value = {.m_header = {.m_rc = 0, .m_cs_sz = 0, .m_other = 0, .m_tag = 249}, .m_size = 5, .m_capacity = 5, .m_length = 4, .m_data = " := "};
static const lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__4 = (const lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__4_value;
static const lean_ctor_object lp_si__second_SISecond_instReprClockState_repr___redArg___closed__5_value = {.m_header = {.m_rc = 0, .m_cs_sz = sizeof(lean_ctor_object) + sizeof(void*)*1 + 0, .m_other = 1, .m_tag = 3}, .m_objs = {((lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__4_value)}};
static const lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__5 = (const lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__5_value;
static const lean_ctor_object lp_si__second_SISecond_instReprClockState_repr___redArg___closed__6_value = {.m_header = {.m_rc = 0, .m_cs_sz = sizeof(lean_ctor_object) + sizeof(void*)*2 + 0, .m_other = 2, .m_tag = 5}, .m_objs = {((lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__3_value),((lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__5_value)}};
static const lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__6 = (const lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__6_value;
static lean_once_cell_t lp_si__second_SISecond_instReprClockState_repr___redArg___closed__7_once = LEAN_ONCE_CELL_INITIALIZER;
static lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__7;
static const lean_string_object lp_si__second_SISecond_instReprClockState_repr___redArg___closed__8_value = {.m_header = {.m_rc = 0, .m_cs_sz = 0, .m_other = 0, .m_tag = 249}, .m_size = 2, .m_capacity = 2, .m_length = 1, .m_data = ","};
static const lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__8 = (const lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__8_value;
static const lean_ctor_object lp_si__second_SISecond_instReprClockState_repr___redArg___closed__9_value = {.m_header = {.m_rc = 0, .m_cs_sz = sizeof(lean_ctor_object) + sizeof(void*)*1 + 0, .m_other = 1, .m_tag = 3}, .m_objs = {((lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__8_value)}};
static const lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__9 = (const lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__9_value;
static const lean_string_object lp_si__second_SISecond_instReprClockState_repr___redArg___closed__10_value = {.m_header = {.m_rc = 0, .m_cs_sz = 0, .m_other = 0, .m_tag = 249}, .m_size = 6, .m_capacity = 6, .m_length = 5, .m_data = "phase"};
static const lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__10 = (const lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__10_value;
static const lean_ctor_object lp_si__second_SISecond_instReprClockState_repr___redArg___closed__11_value = {.m_header = {.m_rc = 0, .m_cs_sz = sizeof(lean_ctor_object) + sizeof(void*)*1 + 0, .m_other = 1, .m_tag = 3}, .m_objs = {((lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__10_value)}};
static const lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__11 = (const lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__11_value;
static lean_once_cell_t lp_si__second_SISecond_instReprClockState_repr___redArg___closed__12_once = LEAN_ONCE_CELL_INITIALIZER;
static lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__12;
static const lean_string_object lp_si__second_SISecond_instReprClockState_repr___redArg___closed__13_value = {.m_header = {.m_rc = 0, .m_cs_sz = 0, .m_other = 0, .m_tag = 249}, .m_size = 3, .m_capacity = 3, .m_length = 2, .m_data = " }"};
static const lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__13 = (const lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__13_value;
static lean_once_cell_t lp_si__second_SISecond_instReprClockState_repr___redArg___closed__14_once = LEAN_ONCE_CELL_INITIALIZER;
static lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__14;
static lean_once_cell_t lp_si__second_SISecond_instReprClockState_repr___redArg___closed__15_once = LEAN_ONCE_CELL_INITIALIZER;
static lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__15;
static const lean_ctor_object lp_si__second_SISecond_instReprClockState_repr___redArg___closed__16_value = {.m_header = {.m_rc = 0, .m_cs_sz = sizeof(lean_ctor_object) + sizeof(void*)*1 + 0, .m_other = 1, .m_tag = 3}, .m_objs = {((lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__0_value)}};
static const lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__16 = (const lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__16_value;
static const lean_ctor_object lp_si__second_SISecond_instReprClockState_repr___redArg___closed__17_value = {.m_header = {.m_rc = 0, .m_cs_sz = sizeof(lean_ctor_object) + sizeof(void*)*1 + 0, .m_other = 1, .m_tag = 3}, .m_objs = {((lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__13_value)}};
static const lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg___closed__17 = (const lean_object*)&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__17_value;
LEAN_EXPORT lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg(lean_object*);
LEAN_EXPORT lean_object* lp_si__second_SISecond_instReprClockState_repr(lean_object*, lean_object*);
LEAN_EXPORT lean_object* lp_si__second_SISecond_instReprClockState_repr___boxed(lean_object*, lean_object*);
static const lean_closure_object lp_si__second_SISecond_instReprClockState___closed__0_value = {.m_header = {.m_rc = 0, .m_cs_sz = sizeof(lean_closure_object) + sizeof(void*)*0, .m_other = 0, .m_tag = 245}, .m_fun = (void*)lp_si__second_SISecond_instReprClockState_repr___boxed, .m_arity = 2, .m_num_fixed = 0, .m_objs = {} };
static const lean_object* lp_si__second_SISecond_instReprClockState___closed__0 = (const lean_object*)&lp_si__second_SISecond_instReprClockState___closed__0_value;
LEAN_EXPORT const lean_object* lp_si__second_SISecond_instReprClockState = (const lean_object*)&lp_si__second_SISecond_instReprClockState___closed__0_value;
LEAN_EXPORT lean_object* lp_si__second_SISecond_step(lean_object*, lean_object*);
LEAN_EXPORT lean_object* lp_si__second_SISecond_step___boxed(lean_object*, lean_object*);
static const lean_ctor_object lp_si__second_SISecond_run___closed__0_value = {.m_header = {.m_rc = 0, .m_cs_sz = sizeof(lean_ctor_object) + sizeof(void*)*2 + 0, .m_other = 2, .m_tag = 0}, .m_objs = {((lean_object*)(((size_t)(0) << 1) | 1)),((lean_object*)(((size_t)(0) << 1) | 1))}};
static const lean_object* lp_si__second_SISecond_run___closed__0 = (const lean_object*)&lp_si__second_SISecond_run___closed__0_value;
LEAN_EXPORT lean_object* lp_si__second_SISecond_run(lean_object*, lean_object*);
LEAN_EXPORT lean_object* lp_si__second_SISecond_run___boxed(lean_object*, lean_object*);
static lean_once_cell_t lp_si__second_SISecond_caesiumTicksPerSecond___closed__0_once = LEAN_ONCE_CELL_INITIALIZER;
static lean_object* lp_si__second_SISecond_caesiumTicksPerSecond___closed__0;
LEAN_EXPORT lean_object* lp_si__second_SISecond_caesiumTicksPerSecond;
LEAN_EXPORT lean_object* lp_si__second_SISecond_Pos_toNat(lean_object* v_x_1_){
_start:
{
switch(lean_obj_tag(v_x_1_))
{
case 0:
{
lean_object* v___x_2_; 
v___x_2_ = lean_unsigned_to_nat(1u);
return v___x_2_;
}
case 1:
{
lean_object* v_a_3_; lean_object* v___x_4_; lean_object* v___x_5_; lean_object* v___x_6_; 
v_a_3_ = lean_ctor_get(v_x_1_, 0);
v___x_4_ = lean_unsigned_to_nat(2u);
v___x_5_ = lp_si__second_SISecond_Pos_toNat(v_a_3_);
v___x_6_ = lean_nat_mul(v___x_4_, v___x_5_);
lean_dec(v___x_5_);
return v___x_6_;
}
default: 
{
lean_object* v_a_7_; lean_object* v___x_8_; lean_object* v___x_9_; lean_object* v___x_10_; lean_object* v___x_11_; lean_object* v___x_12_; 
v_a_7_ = lean_ctor_get(v_x_1_, 0);
v___x_8_ = lean_unsigned_to_nat(2u);
v___x_9_ = lp_si__second_SISecond_Pos_toNat(v_a_7_);
v___x_10_ = lean_nat_mul(v___x_8_, v___x_9_);
lean_dec(v___x_9_);
v___x_11_ = lean_unsigned_to_nat(1u);
v___x_12_ = lean_nat_add(v___x_10_, v___x_11_);
lean_dec(v___x_10_);
return v___x_12_;
}
}
}
}
LEAN_EXPORT lean_object* lp_si__second_SISecond_Pos_toNat___boxed(lean_object* v_x_13_){
_start:
{
lean_object* v_res_14_; 
v_res_14_ = lp_si__second_SISecond_Pos_toNat(v_x_13_);
lean_dec(v_x_13_);
return v_res_14_;
}
}
LEAN_EXPORT lean_object* lp_si__second_SISecond_Pos_carry(uint8_t v_x_15_){
_start:
{
if (v_x_15_ == 0)
{
lean_object* v___x_16_; 
v___x_16_ = lean_unsigned_to_nat(0u);
return v___x_16_;
}
else
{
lean_object* v___x_17_; 
v___x_17_ = lean_unsigned_to_nat(1u);
return v___x_17_;
}
}
}
LEAN_EXPORT lean_object* lp_si__second_SISecond_Pos_carry___boxed(lean_object* v_x_18_){
_start:
{
uint8_t v_x_24__boxed_19_; lean_object* v_res_20_; 
v_x_24__boxed_19_ = lean_unbox(v_x_18_);
v_res_20_ = lp_si__second_SISecond_Pos_carry(v_x_24__boxed_19_);
return v_res_20_;
}
}
LEAN_EXPORT uint8_t lp_si__second_SISecond_instDecidableEqClockState_decEq(lean_object* v_x_21_, lean_object* v_x_22_){
_start:
{
lean_object* v_seconds_23_; lean_object* v_phase_24_; lean_object* v_seconds_25_; lean_object* v_phase_26_; uint8_t v___x_27_; 
v_seconds_23_ = lean_ctor_get(v_x_21_, 0);
v_phase_24_ = lean_ctor_get(v_x_21_, 1);
v_seconds_25_ = lean_ctor_get(v_x_22_, 0);
v_phase_26_ = lean_ctor_get(v_x_22_, 1);
v___x_27_ = lean_nat_dec_eq(v_seconds_23_, v_seconds_25_);
if (v___x_27_ == 0)
{
return v___x_27_;
}
else
{
uint8_t v___x_28_; 
v___x_28_ = lean_nat_dec_eq(v_phase_24_, v_phase_26_);
return v___x_28_;
}
}
}
LEAN_EXPORT lean_object* lp_si__second_SISecond_instDecidableEqClockState_decEq___boxed(lean_object* v_x_29_, lean_object* v_x_30_){
_start:
{
uint8_t v_res_31_; lean_object* v_r_32_; 
v_res_31_ = lp_si__second_SISecond_instDecidableEqClockState_decEq(v_x_29_, v_x_30_);
lean_dec_ref(v_x_30_);
lean_dec_ref(v_x_29_);
v_r_32_ = lean_box(v_res_31_);
return v_r_32_;
}
}
LEAN_EXPORT uint8_t lp_si__second_SISecond_instDecidableEqClockState(lean_object* v_x_33_, lean_object* v_x_34_){
_start:
{
uint8_t v___x_35_; 
v___x_35_ = lp_si__second_SISecond_instDecidableEqClockState_decEq(v_x_33_, v_x_34_);
return v___x_35_;
}
}
LEAN_EXPORT lean_object* lp_si__second_SISecond_instDecidableEqClockState___boxed(lean_object* v_x_36_, lean_object* v_x_37_){
_start:
{
uint8_t v_res_38_; lean_object* v_r_39_; 
v_res_38_ = lp_si__second_SISecond_instDecidableEqClockState(v_x_36_, v_x_37_);
lean_dec_ref(v_x_37_);
lean_dec_ref(v_x_36_);
v_r_39_ = lean_box(v_res_38_);
return v_r_39_;
}
}
static lean_object* _init_lp_si__second_SISecond_instReprClockState_repr___redArg___closed__7(void){
_start:
{
lean_object* v___x_53_; lean_object* v___x_54_; 
v___x_53_ = lean_unsigned_to_nat(11u);
v___x_54_ = lean_nat_to_int(v___x_53_);
return v___x_54_;
}
}
static lean_object* _init_lp_si__second_SISecond_instReprClockState_repr___redArg___closed__12(void){
_start:
{
lean_object* v___x_61_; lean_object* v___x_62_; 
v___x_61_ = lean_unsigned_to_nat(9u);
v___x_62_ = lean_nat_to_int(v___x_61_);
return v___x_62_;
}
}
static lean_object* _init_lp_si__second_SISecond_instReprClockState_repr___redArg___closed__14(void){
_start:
{
lean_object* v___x_64_; lean_object* v___x_65_; 
v___x_64_ = ((lean_object*)(lp_si__second_SISecond_instReprClockState_repr___redArg___closed__0));
v___x_65_ = lean_string_length(v___x_64_);
return v___x_65_;
}
}
static lean_object* _init_lp_si__second_SISecond_instReprClockState_repr___redArg___closed__15(void){
_start:
{
lean_object* v___x_66_; lean_object* v___x_67_; 
v___x_66_ = lean_obj_once(&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__14, &lp_si__second_SISecond_instReprClockState_repr___redArg___closed__14_once, _init_lp_si__second_SISecond_instReprClockState_repr___redArg___closed__14);
v___x_67_ = lean_nat_to_int(v___x_66_);
return v___x_67_;
}
}
LEAN_EXPORT lean_object* lp_si__second_SISecond_instReprClockState_repr___redArg(lean_object* v_x_72_){
_start:
{
lean_object* v_seconds_73_; lean_object* v_phase_74_; lean_object* v___x_76_; uint8_t v_isShared_77_; uint8_t v_isSharedCheck_109_; 
v_seconds_73_ = lean_ctor_get(v_x_72_, 0);
v_phase_74_ = lean_ctor_get(v_x_72_, 1);
v_isSharedCheck_109_ = !lean_is_exclusive(v_x_72_);
if (v_isSharedCheck_109_ == 0)
{
v___x_76_ = v_x_72_;
v_isShared_77_ = v_isSharedCheck_109_;
goto v_resetjp_75_;
}
else
{
lean_inc(v_phase_74_);
lean_inc(v_seconds_73_);
lean_dec(v_x_72_);
v___x_76_ = lean_box(0);
v_isShared_77_ = v_isSharedCheck_109_;
goto v_resetjp_75_;
}
v_resetjp_75_:
{
lean_object* v___x_78_; lean_object* v___x_79_; lean_object* v___x_80_; lean_object* v___x_81_; lean_object* v___x_82_; lean_object* v___x_84_; 
v___x_78_ = ((lean_object*)(lp_si__second_SISecond_instReprClockState_repr___redArg___closed__5));
v___x_79_ = ((lean_object*)(lp_si__second_SISecond_instReprClockState_repr___redArg___closed__6));
v___x_80_ = lean_obj_once(&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__7, &lp_si__second_SISecond_instReprClockState_repr___redArg___closed__7_once, _init_lp_si__second_SISecond_instReprClockState_repr___redArg___closed__7);
v___x_81_ = l_Nat_reprFast(v_seconds_73_);
v___x_82_ = lean_alloc_ctor(3, 1, 0);
lean_ctor_set(v___x_82_, 0, v___x_81_);
if (v_isShared_77_ == 0)
{
lean_ctor_set_tag(v___x_76_, 4);
lean_ctor_set(v___x_76_, 1, v___x_82_);
lean_ctor_set(v___x_76_, 0, v___x_80_);
v___x_84_ = v___x_76_;
goto v_reusejp_83_;
}
else
{
lean_object* v_reuseFailAlloc_108_; 
v_reuseFailAlloc_108_ = lean_alloc_ctor(4, 2, 0);
lean_ctor_set(v_reuseFailAlloc_108_, 0, v___x_80_);
lean_ctor_set(v_reuseFailAlloc_108_, 1, v___x_82_);
v___x_84_ = v_reuseFailAlloc_108_;
goto v_reusejp_83_;
}
v_reusejp_83_:
{
uint8_t v___x_85_; lean_object* v___x_86_; lean_object* v___x_87_; lean_object* v___x_88_; lean_object* v___x_89_; lean_object* v___x_90_; lean_object* v___x_91_; lean_object* v___x_92_; lean_object* v___x_93_; lean_object* v___x_94_; lean_object* v___x_95_; lean_object* v___x_96_; lean_object* v___x_97_; lean_object* v___x_98_; lean_object* v___x_99_; lean_object* v___x_100_; lean_object* v___x_101_; lean_object* v___x_102_; lean_object* v___x_103_; lean_object* v___x_104_; lean_object* v___x_105_; lean_object* v___x_106_; lean_object* v___x_107_; 
v___x_85_ = 0;
v___x_86_ = lean_alloc_ctor(6, 1, 1);
lean_ctor_set(v___x_86_, 0, v___x_84_);
lean_ctor_set_uint8(v___x_86_, sizeof(void*)*1, v___x_85_);
v___x_87_ = lean_alloc_ctor(5, 2, 0);
lean_ctor_set(v___x_87_, 0, v___x_79_);
lean_ctor_set(v___x_87_, 1, v___x_86_);
v___x_88_ = ((lean_object*)(lp_si__second_SISecond_instReprClockState_repr___redArg___closed__9));
v___x_89_ = lean_alloc_ctor(5, 2, 0);
lean_ctor_set(v___x_89_, 0, v___x_87_);
lean_ctor_set(v___x_89_, 1, v___x_88_);
v___x_90_ = lean_box(1);
v___x_91_ = lean_alloc_ctor(5, 2, 0);
lean_ctor_set(v___x_91_, 0, v___x_89_);
lean_ctor_set(v___x_91_, 1, v___x_90_);
v___x_92_ = ((lean_object*)(lp_si__second_SISecond_instReprClockState_repr___redArg___closed__11));
v___x_93_ = lean_alloc_ctor(5, 2, 0);
lean_ctor_set(v___x_93_, 0, v___x_91_);
lean_ctor_set(v___x_93_, 1, v___x_92_);
v___x_94_ = lean_alloc_ctor(5, 2, 0);
lean_ctor_set(v___x_94_, 0, v___x_93_);
lean_ctor_set(v___x_94_, 1, v___x_78_);
v___x_95_ = lean_obj_once(&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__12, &lp_si__second_SISecond_instReprClockState_repr___redArg___closed__12_once, _init_lp_si__second_SISecond_instReprClockState_repr___redArg___closed__12);
v___x_96_ = l_Nat_reprFast(v_phase_74_);
v___x_97_ = lean_alloc_ctor(3, 1, 0);
lean_ctor_set(v___x_97_, 0, v___x_96_);
v___x_98_ = lean_alloc_ctor(4, 2, 0);
lean_ctor_set(v___x_98_, 0, v___x_95_);
lean_ctor_set(v___x_98_, 1, v___x_97_);
v___x_99_ = lean_alloc_ctor(6, 1, 1);
lean_ctor_set(v___x_99_, 0, v___x_98_);
lean_ctor_set_uint8(v___x_99_, sizeof(void*)*1, v___x_85_);
v___x_100_ = lean_alloc_ctor(5, 2, 0);
lean_ctor_set(v___x_100_, 0, v___x_94_);
lean_ctor_set(v___x_100_, 1, v___x_99_);
v___x_101_ = lean_obj_once(&lp_si__second_SISecond_instReprClockState_repr___redArg___closed__15, &lp_si__second_SISecond_instReprClockState_repr___redArg___closed__15_once, _init_lp_si__second_SISecond_instReprClockState_repr___redArg___closed__15);
v___x_102_ = ((lean_object*)(lp_si__second_SISecond_instReprClockState_repr___redArg___closed__16));
v___x_103_ = lean_alloc_ctor(5, 2, 0);
lean_ctor_set(v___x_103_, 0, v___x_102_);
lean_ctor_set(v___x_103_, 1, v___x_100_);
v___x_104_ = ((lean_object*)(lp_si__second_SISecond_instReprClockState_repr___redArg___closed__17));
v___x_105_ = lean_alloc_ctor(5, 2, 0);
lean_ctor_set(v___x_105_, 0, v___x_103_);
lean_ctor_set(v___x_105_, 1, v___x_104_);
v___x_106_ = lean_alloc_ctor(4, 2, 0);
lean_ctor_set(v___x_106_, 0, v___x_101_);
lean_ctor_set(v___x_106_, 1, v___x_105_);
v___x_107_ = lean_alloc_ctor(6, 1, 1);
lean_ctor_set(v___x_107_, 0, v___x_106_);
lean_ctor_set_uint8(v___x_107_, sizeof(void*)*1, v___x_85_);
return v___x_107_;
}
}
}
}
LEAN_EXPORT lean_object* lp_si__second_SISecond_instReprClockState_repr(lean_object* v_x_110_, lean_object* v_prec_111_){
_start:
{
lean_object* v___x_112_; 
v___x_112_ = lp_si__second_SISecond_instReprClockState_repr___redArg(v_x_110_);
return v___x_112_;
}
}
LEAN_EXPORT lean_object* lp_si__second_SISecond_instReprClockState_repr___boxed(lean_object* v_x_113_, lean_object* v_prec_114_){
_start:
{
lean_object* v_res_115_; 
v_res_115_ = lp_si__second_SISecond_instReprClockState_repr(v_x_113_, v_prec_114_);
lean_dec(v_prec_114_);
return v_res_115_;
}
}
LEAN_EXPORT lean_object* lp_si__second_SISecond_step(lean_object* v_ticksPerSecond_118_, lean_object* v_s_119_){
_start:
{
lean_object* v_seconds_120_; lean_object* v_phase_121_; lean_object* v___x_123_; uint8_t v_isShared_124_; uint8_t v_isSharedCheck_136_; 
v_seconds_120_ = lean_ctor_get(v_s_119_, 0);
v_phase_121_ = lean_ctor_get(v_s_119_, 1);
v_isSharedCheck_136_ = !lean_is_exclusive(v_s_119_);
if (v_isSharedCheck_136_ == 0)
{
v___x_123_ = v_s_119_;
v_isShared_124_ = v_isSharedCheck_136_;
goto v_resetjp_122_;
}
else
{
lean_inc(v_phase_121_);
lean_inc(v_seconds_120_);
lean_dec(v_s_119_);
v___x_123_ = lean_box(0);
v_isShared_124_ = v_isSharedCheck_136_;
goto v_resetjp_122_;
}
v_resetjp_122_:
{
lean_object* v___x_125_; lean_object* v___x_126_; uint8_t v___x_127_; 
v___x_125_ = lean_unsigned_to_nat(1u);
v___x_126_ = lean_nat_add(v_phase_121_, v___x_125_);
lean_dec(v_phase_121_);
v___x_127_ = lean_nat_dec_eq(v___x_126_, v_ticksPerSecond_118_);
if (v___x_127_ == 0)
{
lean_object* v___x_129_; 
if (v_isShared_124_ == 0)
{
lean_ctor_set(v___x_123_, 1, v___x_126_);
v___x_129_ = v___x_123_;
goto v_reusejp_128_;
}
else
{
lean_object* v_reuseFailAlloc_130_; 
v_reuseFailAlloc_130_ = lean_alloc_ctor(0, 2, 0);
lean_ctor_set(v_reuseFailAlloc_130_, 0, v_seconds_120_);
lean_ctor_set(v_reuseFailAlloc_130_, 1, v___x_126_);
v___x_129_ = v_reuseFailAlloc_130_;
goto v_reusejp_128_;
}
v_reusejp_128_:
{
return v___x_129_;
}
}
else
{
lean_object* v___x_131_; lean_object* v___x_132_; lean_object* v___x_134_; 
lean_dec(v___x_126_);
v___x_131_ = lean_nat_add(v_seconds_120_, v___x_125_);
lean_dec(v_seconds_120_);
v___x_132_ = lean_unsigned_to_nat(0u);
if (v_isShared_124_ == 0)
{
lean_ctor_set(v___x_123_, 1, v___x_132_);
lean_ctor_set(v___x_123_, 0, v___x_131_);
v___x_134_ = v___x_123_;
goto v_reusejp_133_;
}
else
{
lean_object* v_reuseFailAlloc_135_; 
v_reuseFailAlloc_135_ = lean_alloc_ctor(0, 2, 0);
lean_ctor_set(v_reuseFailAlloc_135_, 0, v___x_131_);
lean_ctor_set(v_reuseFailAlloc_135_, 1, v___x_132_);
v___x_134_ = v_reuseFailAlloc_135_;
goto v_reusejp_133_;
}
v_reusejp_133_:
{
return v___x_134_;
}
}
}
}
}
LEAN_EXPORT lean_object* lp_si__second_SISecond_step___boxed(lean_object* v_ticksPerSecond_137_, lean_object* v_s_138_){
_start:
{
lean_object* v_res_139_; 
v_res_139_ = lp_si__second_SISecond_step(v_ticksPerSecond_137_, v_s_138_);
lean_dec(v_ticksPerSecond_137_);
return v_res_139_;
}
}
LEAN_EXPORT lean_object* lp_si__second_SISecond_run(lean_object* v_ticksPerSecond_142_, lean_object* v_x_143_){
_start:
{
lean_object* v_zero_144_; uint8_t v_isZero_145_; 
v_zero_144_ = lean_unsigned_to_nat(0u);
v_isZero_145_ = lean_nat_dec_eq(v_x_143_, v_zero_144_);
if (v_isZero_145_ == 1)
{
lean_object* v___x_146_; 
v___x_146_ = ((lean_object*)(lp_si__second_SISecond_run___closed__0));
return v___x_146_;
}
else
{
lean_object* v_one_147_; lean_object* v_n_148_; lean_object* v___x_149_; lean_object* v___x_150_; 
v_one_147_ = lean_unsigned_to_nat(1u);
v_n_148_ = lean_nat_sub(v_x_143_, v_one_147_);
v___x_149_ = lp_si__second_SISecond_run(v_ticksPerSecond_142_, v_n_148_);
lean_dec(v_n_148_);
v___x_150_ = lp_si__second_SISecond_step(v_ticksPerSecond_142_, v___x_149_);
return v___x_150_;
}
}
}
LEAN_EXPORT lean_object* lp_si__second_SISecond_run___boxed(lean_object* v_ticksPerSecond_151_, lean_object* v_x_152_){
_start:
{
lean_object* v_res_153_; 
v_res_153_ = lp_si__second_SISecond_run(v_ticksPerSecond_151_, v_x_152_);
lean_dec(v_x_152_);
lean_dec(v_ticksPerSecond_151_);
return v_res_153_;
}
}
static lean_object* _init_lp_si__second_SISecond_caesiumTicksPerSecond___closed__0(void){
_start:
{
lean_object* v___x_154_; lean_object* v___x_155_; 
v___x_154_ = lp_si__second_SISecond_caesiumPeriodsPerSecond;
v___x_155_ = lp_si__second_SISecond_Pos_toNat(v___x_154_);
return v___x_155_;
}
}
static lean_object* _init_lp_si__second_SISecond_caesiumTicksPerSecond(void){
_start:
{
lean_object* v___x_156_; 
v___x_156_ = lean_obj_once(&lp_si__second_SISecond_caesiumTicksPerSecond___closed__0, &lp_si__second_SISecond_caesiumTicksPerSecond___closed__0_once, _init_lp_si__second_SISecond_caesiumTicksPerSecond___closed__0);
return v___x_156_;
}
}
lean_object* initialize_Init(uint8_t builtin);
lean_object* initialize_Init(uint8_t builtin);
lean_object* initialize_si__second_002026_x2d09_x2d15__SI__SECOND__KERNEL(uint8_t builtin);
void lean_initialize_runtime_module();
static bool _G_initialized = false;
LEAN_EXPORT lean_object* initialize_si__second_002026_x2d09_x2d15__SI__SECOND__LEDGER(uint8_t builtin) {
lean_object * res;
if (_G_initialized) return lean_io_result_mk_ok(lean_box(0));
_G_initialized = true;
lean_initialize_runtime_module();
res = initialize_Init(builtin);
if (lean_io_result_is_error(res)) return res;
lean_dec_ref(res);
res = initialize_Init(builtin);
if (lean_io_result_is_error(res)) return res;
lean_dec_ref(res);
res = initialize_si__second_002026_x2d09_x2d15__SI__SECOND__KERNEL(builtin);
if (lean_io_result_is_error(res)) return res;
lean_dec_ref(res);
lp_si__second_SISecond_caesiumTicksPerSecond = _init_lp_si__second_SISecond_caesiumTicksPerSecond();
lean_mark_persistent(lp_si__second_SISecond_caesiumTicksPerSecond);
return lean_io_result_mk_ok(lean_box(0));
}
#ifdef __cplusplus
}
#endif
