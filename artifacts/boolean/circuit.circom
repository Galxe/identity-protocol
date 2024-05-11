
pragma circom 2.1.5;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/eddsaposeidon.circom";

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
}

template BodyHasher() {
  signal input val;
  signal output out;

  component hasher = Poseidon(1);
  hasher.inputs[0] <== val;
  out <== hasher.out;
}

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

  // intrinsic output signals
  signal output out_type;
  signal output out_context;
  signal output out_nullifier;
  signal output out_external_nullifier;
  signal output out_revealing_identity;
  signal output out_expiration_lb;
  signal output out_key_id;
  signal output out_id_equals_to;

  // defs
  signal input val;
  signal input val_hide;
  signal output out_val;

  // basic checks
  version === 1;  // protocol version 1
  sig_verification_stack === 1;  // babyzk
  type === 2;

  // redirect intrinsic signals to output
  out_type <== type;
  out_context <== context;
  out_external_nullifier <== external_nullifier;
  out_revealing_identity <== revealing_identity;
  out_expiration_lb <== expiration_lb;

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
  body_hasher.val <== val;

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

  component val_check = BooleanChecker();
  val_check.in <== val;
  val_check.hide <== val_hide;
  out_val <== val_check.out;
}

component main = Main();
