import { Eta } from "@/site-packages/eta/browser.js";
import { ClaimDef } from "@/credential/claimType";
import { FieldDefList, genFieldDef } from "./fielddef";
import { formatCode } from "./utils";

interface CircomCodeAndDefs {
  code: string;
  defs: FieldDefList;
}

/**
 * render generates the circom code for a credential type.
 */
export function render(claimDefs: ClaimDef[], typeID: bigint, revocable: number | null): CircomCodeAndDefs {
  const eta = new Eta({
    autoEscape: false,
  });
  const defs = new FieldDefList(claimDefs.map(genFieldDef));
  const circomLibs = eta.renderString(libs, { useRevocable: revocable != null });
  const bodyHasher = eta.renderString(bodyHasherTemplate, {
    defs,
  });

  const code = eta.renderString(typedCircomCircuit, {
    circomLibs,
    bodyHasher,
    defs,
    typeID,
    revocable,
  });

  return {
    code: formatCode(code),
    defs,
  };
}

const typedCircomCircuit = `
pragma circom 2.1.5;

<% = it.circomLibs %>

<% = it.bodyHasher %>

template Main() {
  // headers
  signal input version;
  signal input type;
  signal input context;
  signal input id;

  // signature metadata
  signal input sig_verification_stack;
  signal input sig_id;
  signal input sig_expired_at;
  signal input sig_identity_commitment;

  // signature
  signal input sig_pubkey_x;
  signal input sig_pubkey_y;
  signal input sig_s;
  signal input sig_r8_x;
  signal input sig_r8_y;

  // verification input
  signal input identity_secret;
  signal input internal_nullifier;
  signal input external_nullifier;
  // identity result
  signal input revealing_identity;
  // HMAC from poseidon(identity_secret, external_nullifier, revealing_identity)
  signal input revealing_identity_hmac;

  // primitive control signals
  signal input expiration_lb;
  signal input id_equals_to;

  <% if (it.revocable) { %>
  // revocable signature
  var sig_bit_length = <%= it.revocable %>;
  signal input sig_revocation_smt_root;
  signal input sig_revocation_smt_siblings[sig_bit_length];
  signal input sig_revocation_smt_old_key;
  signal input sig_revocation_smt_old_value;
  signal input sig_revocation_smt_is_old0;
  signal input sig_revocation_smt_value;
  <% } %>

  // intrinsic output signals
  signal output out_type;
  signal output out_context;
  signal output out_nullifier;
  signal output out_external_nullifier;
  signal output out_revealing_identity;
  signal output out_expiration_lb;
  signal output out_key_id;
  signal output out_id_equals_to;
  <% if (it.revocable) { _%>
  signal output out_sig_revocation_smt_root;
  <% } %>

  // defs
  <% it.defs.inputs().forEach(function(v){ _%>
  signal input <%= v %>;
  <% }) _%>
  <% it.defs.ops().forEach(function(v){ _%>
  signal input <%= v %>;
  <% }) _%>
  <% it.defs.outputs().forEach(function(v){ _%>
  signal output <%= v %>;
  <% }) %>

  // basic checks
  version === 1;  // protocol version 1
  sig_verification_stack === 1;  // babyzk
  type === <%=it.typeID%>;

  // redirect intrinsic signals to output
  out_type <== type;
  out_context <== context;
  out_external_nullifier <== external_nullifier;
  out_revealing_identity <== revealing_identity;
  out_expiration_lb <== expiration_lb;
  <% if (it.revocable) { _%>
  out_sig_revocation_smt_root <== sig_revocation_smt_root;
  <% } %>

  component all_metadata_hasher = AllMetadataHasher();
  all_metadata_hasher.version <== version;
  all_metadata_hasher.type <== type;
  all_metadata_hasher.context <== context;
  all_metadata_hasher.id <== id;
  all_metadata_hasher.verification_stack <== sig_verification_stack;
  all_metadata_hasher.signature_id <== sig_id;
  all_metadata_hasher.expired_at <== sig_expired_at;
  all_metadata_hasher.identity_commitment <== sig_identity_commitment;

  component body_hasher = BodyHasher();
  <% it.defs.inputs().forEach(function(v){ _%>
  body_hasher.<%= v %> <== <%= v %>;
  <% }) %>

  component cred_hasher = CredHasher();
  cred_hasher.metadata_hash <== all_metadata_hasher.out;
  cred_hasher.body_hash <== body_hasher.out;

  component eddsa = EdDSAPoseidonVerifier();
  eddsa.enabled <== 1;
  eddsa.M <== cred_hasher.out;
  eddsa.Ax <== sig_pubkey_x;
  eddsa.Ay <== sig_pubkey_y;
  eddsa.R8x <== sig_r8_x;
  eddsa.R8y <== sig_r8_y;
  eddsa.S <== sig_s;

  // verification output
  component key_id_hasher = Poseidon(2);
  key_id_hasher.inputs[0] <== sig_pubkey_x;
  key_id_hasher.inputs[1] <== sig_pubkey_y;
  out_key_id <== key_id_hasher.out;

  // primitive controls
  component expiration_gte = GreaterEqThan(64);
  expiration_gte.in[0] <== sig_expired_at;
  expiration_gte.in[1] <== expiration_lb;
  expiration_gte.out === 1;
  component id_check = PropertyEqualityChecker(1);
  id_check.in <== id;
  id_check.equals_to[0] <== id_equals_to;
  out_id_equals_to <== id_check.out[0];

  component is_id_valid = Poseidon(2);
  is_id_valid.inputs[0] <== identity_secret;
  is_id_valid.inputs[1] <== internal_nullifier;
  is_id_valid.out === sig_identity_commitment;

  component nullifier_hasher = Poseidon(2);
  nullifier_hasher.inputs[0] <== internal_nullifier;
  nullifier_hasher.inputs[1] <== external_nullifier;
  out_nullifier <== nullifier_hasher.out;

  component revealing_identity_hmac_check = Poseidon(3);
  revealing_identity_hmac_check.inputs[0] <== identity_secret;
  revealing_identity_hmac_check.inputs[1] <== external_nullifier;
  revealing_identity_hmac_check.inputs[2] <== revealing_identity;
  revealing_identity_hmac_check.out === revealing_identity_hmac;

  <% if (it.revocable) { _%>
  component not_revoked_check = NotRevokedChecker(sig_bit_length);
  not_revoked_check.sig_id <== sig_id;
  not_revoked_check.root <== sig_revocation_smt_root;
  for (var i = 0; i < sig_bit_length; i++) {
    not_revoked_check.siblings[i] <== sig_revocation_smt_siblings[i];
  }
  not_revoked_check.old_key <== sig_revocation_smt_old_key;
  not_revoked_check.old_value <== sig_revocation_smt_old_value;
  not_revoked_check.is_old0 <== sig_revocation_smt_is_old0;
  not_revoked_check.value <== sig_revocation_smt_value;
  <% } %>

  <%- it.defs.codes().forEach(function(v){ _%>
  <%=v%>
  <%_ }) _%>
}

component main = Main();`;

const libs = `
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/eddsaposeidon.circom";
<% if (it.useRevocable) { %>
include "circomlib/circuits/smt/smtverifier.circom";
include "circomlib/circuits/gates.circom";

// check credential is not revoked by proving that 
// the signature id is not in the revocation merkle tree.
template NotRevokedChecker(N) {
  assert(N <= 248);

  signal input root;
  signal input siblings[N];
  signal input old_key;
  signal input old_value;
  signal input is_old0;
  signal input sig_id;
  signal input value;

  component is_sig_id_zero = IsZero();
  is_sig_id_zero.in <== sig_id;
  component is_root_zero = IsZero();
  is_root_zero.in <== root;

  component smt = SMTVerifier(N);

  // skip verification if sig_id is 0 or root is 0
  component enable = NOR();
  enable.a <== is_sig_id_zero.out;
  enable.b <== is_root_zero.out;
  smt.enabled <== enable.out;
  smt.root <== root;
  for (var i = 0; i < N; i++) {
    smt.siblings[i] <== siblings[i];
  }
  smt.oldKey <== old_key;
  smt.oldValue <== old_value;
  smt.isOld0 <== is_old0;
  smt.key <== sig_id;
  smt.value <== value;
  smt.fnc <== 1;
}
<% } %>

// boolean type field only support hiding or revealing the value.
// The least significant bit represents if the value is hidden or not,
// where 1 means revealed and 0 means hidden.
template BooleanChecker() {
  signal input in;
  signal input hide;
  signal output out;

  component reveal = IsZero();
  reveal.in <== hide;
  out <== in * reveal.out * 2 + reveal.out;
}

// property checker allows caller to prove that input signal's
// equality to a set of values. The result is using the same
// compression schema as id_equals_to:
// The least significant bit is the result of the equality check,
// where 1 means equal and 0 means not equal, and
// the remaining bits are the input signal itself.
template PropertyEqualityChecker(n) {
  signal input in;
  signal input equals_to[n];
  signal output out[n];

  component is_equals[n];
  for (var i = 0; i < n; i++) {
     is_equals[i] = IsEqual();
     is_equals[i].in[0] <== in;
     is_equals[i].in[1] <== equals_to[i];
     out[i] <== is_equals[i].out + equals_to[i] * 2;
  }
}

// ScalarRangeChecker checks if input signal is within the range of [lower_bound, upper_bound], both inclusive.
// There is no output signal. If the input signal is within the range, the circuit will pass, otherwise it will fail.
// NOTE: must do range checks on lower_bound and upper_bound fields
// to make sure that they are within the range of [0, 2**n - 1].
template ScalarRangeChecker(n) {
  signal input in;
  signal input lower_bound;
  signal input upper_bound;

  component lower_bound_checker = GreaterEqThan(n);
  component upper_bound_checker = LessEqThan(n);

  lower_bound_checker.in[0] <== in;
  lower_bound_checker.in[1] <== lower_bound;
  lower_bound_checker.out === 1;
  upper_bound_checker.in[0] <== in;
  upper_bound_checker.in[1] <== upper_bound;
  upper_bound_checker.out === 1;
}

// Scalar256RangeChecker checks if uint256 signal is
// within the range of [lower_bound, upper_bound], both inclusive.
// The uint256 value and bounds are represented as two 128-bit signal.
// NOTE: must do range checks on lower_bound_* and upper_bound_* fields
// to make sure that they are within the range of uint128.
template Scalar256RangeChecker() {
  signal input in_msb;
  signal input in_lsb;
  signal input lower_bound_msb;
  signal input lower_bound_lsb;
  signal input upper_bound_msb;
  signal input upper_bound_lsb;

  component lb_msb_eq = IsEqual();
  component lb_msb_checker = GreaterThan(128);
  component lb_lsb_checker = GreaterEqThan(128);
  // value's msb is greater or equal than lower_bound's msb
  lb_msb_checker.in[0] <== in_msb;
  lb_msb_checker.in[1] <== lower_bound_msb;
  lb_msb_eq.in[0] <== in_msb;
  lb_msb_eq.in[1] <== lower_bound_msb;
  // value's lsb is greater or equal than lower_bound's lsb
  lb_lsb_checker.in[0] <== in_lsb;
  lb_lsb_checker.in[1] <== lower_bound_lsb;
  // either value's msb is greater or msb is equal and lsb is greater or equal
  lb_msb_checker.out + lb_msb_eq.out * lb_lsb_checker.out === 1;

  component up_msb_eq = IsEqual();
  component up_msb_checker = LessThan(128);
  component up_lsb_checker = LessEqThan(128);
  // value's msb is less or equal than upper_bound's msb
  up_msb_checker.in[0] <== in_msb;
  up_msb_checker.in[1] <== upper_bound_msb;
  up_msb_eq.in[0] <== in_msb;
  up_msb_eq.in[1] <== upper_bound_msb;
  // value's lsb is less or equal than upper_bound's lsb
  up_lsb_checker.in[0] <== in_lsb;
  up_lsb_checker.in[1] <== upper_bound_lsb;
  // either value's msb is less or is equal and lsb is less or equal
  up_msb_checker.out + up_msb_eq.out * up_lsb_checker.out === 1;
}

template AllMetadataHasher() {
  signal input version;
  signal input type;
  signal input context;
  signal input id;
  signal input verification_stack;
  signal input signature_id;
  signal input expired_at;
  signal input identity_commitment;

  signal output out;

  component hasher = Poseidon(8);
  hasher.inputs[0] <== version;
  hasher.inputs[1] <== type;
  hasher.inputs[2] <== context;
  hasher.inputs[3] <== id;
  hasher.inputs[4] <== verification_stack;
  hasher.inputs[5] <== signature_id;
  hasher.inputs[6] <== expired_at;
  hasher.inputs[7] <== identity_commitment;
  out <== hasher.out;
}

template CredHasher() {
  signal input metadata_hash;
  signal input body_hash;

  signal output out;

  component hasher = Poseidon(2);
  hasher.inputs[0] <== metadata_hash;
  hasher.inputs[1] <== body_hash;
  out <== hasher.out;
}`;

const bodyHasherTemplate = `
template BodyHasher() {
  <% it.defs.inputs().forEach(function(v){ _%>
  signal input <%= v %>;
  <% }) _%>
  signal output out;

<% if (it.defs.inputs().length > 0) { %>
  component hasher = Poseidon(<%= it.defs.inputs().length %>);
  <% it.defs.inputs().forEach(function(v, i){ _%>
  hasher.inputs[<%= i %>] <== <%= v %>;
  <% }) _%>
  out <== hasher.out;
<% } else { %>
  out <== 0;
<% } _%>
}
`;
