import fs from "fs";
import path from "path";

import { describe, expect, assert, it } from "vitest";

import { prepare, bn128_R } from "@/crypto/babyzk/deps";
import * as credType from "@/credential/credType";
import { AggregationMode as AggMode, Aggregation, IntrinsicPublicSignal } from "@/credential/credential";
import {
  exampleCredTestContext,
  exampleCredTypeStr,
  exampleRevocableCredTypeStr,
  exampleStatementList,
} from "@/testutils";
import { CredError, ErrorName } from "@/errors";

import { genCircuit, genCircuitInput } from "./circuit";
import { genVerifierSolidity } from "./onchain_verifier";

// run prepare() before running the tests.
// @ts-expect-error: it actually works.
await prepare();

describe("genCircuit", () => {
  it("generates correct code for unit type", async () => {
    const credTypeStr = ";";
    const tpRst = credType.parseCredType(credTypeStr);
    assert(tpRst.ok);
    const tp = tpRst.value;
    tp.typeID = BigInt("1");
    const code = genCircuit(tp).code;
    expect(code).toEqual(unitTypeCircomCode);
  });

  it("generates correct code when there is no public operation signal", async () => {
    const credTypeStr = "followed:bool;";
    const tpRst = credType.parseCredType(credTypeStr);
    assert(tpRst.ok);
    const tp = tpRst.value;
    tp.typeID = BigInt("778");
    const code = genCircuit(tp);
    // just check last 2 lines, including the last empty line
    expect(code.code.split("\n").slice(-2).join("\n")).toEqual(`component main = Main();\n`);
    tp.revocable = 16;
    const revocableCode = genCircuit(tp);
    expect(revocableCode.code.split("\n").slice(-2).join("\n")).toEqual(`component main = Main();\n`);
  });

  it("generates circom code and correct signal definitions", async () => {
    const ipsIndexMap = new Map([
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
      [5, 5],
      [6, 6],
      [7, 7],
    ]);
    const revocableIpsIndexMap = new Map(ipsIndexMap);
    revocableIpsIndexMap.set(IntrinsicPublicSignal.SigRevocationSmtRoot, 8);
    const intrinsicSignals = [
      {
        name: "out_type",
        ceiling: 1n << 160n,
      },
      {
        name: "out_context",
        ceiling: 1n << 160n,
      },
      {
        name: "out_nullifier",
        ceiling: bn128_R,
      },
      {
        name: "out_external_nullifier",
        ceiling: 1n << 160n,
      },
      {
        name: "out_reveal_identity",
        ceiling: 1n << 248n,
      },
      {
        name: "out_expiration_lb",
        ceiling: 1n << 64n,
      },
      {
        name: "out_key_id",
        ceiling: bn128_R,
      },
      {
        name: "out_id_equals_to",
        ceiling: 1n << 249n,
      },
    ];
    const tests = [
      {
        TestCaseName: "non-revocable",
        input: exampleCredTypeStr,
        output: {
          code: exampleCredCircuit,
          intrinsicSignalIndexMap: ipsIndexMap,
          publicSignalDefs: [
            ...intrinsicSignals,
            {
              name: "out_token_balance_lb_msb",
              ceiling: 1n << 128n,
            },
            {
              name: "out_token_balance_lb_lsb",
              ceiling: 1n << 128n,
            },
            {
              name: "out_token_balance_ub_msb",
              ceiling: 1n << 128n,
            },
            {
              name: "out_token_balance_ub_lsb",
              ceiling: 1n << 128n,
            },
            {
              name: "out_birthday_lb",
              ceiling: 1n << 64n,
            },
            {
              name: "out_birthday_ub",
              ceiling: 1n << 64n,
            },
            {
              name: "out_status_eq0",
              ceiling: 1n << BigInt(8 + 1),
            },
            {
              name: "out_status_eq1",
              ceiling: 1n << BigInt(8 + 1),
            },
            {
              name: "out_followed",
              ceiling: 4n,
            },
          ],
          aggregations: [
            new Aggregation({
              destName: "agg_out_id_equals_to",
              destType: "mapping(uint248 => uint8)",
              srcNames: ["out_id_equals_to"],
              mode: AggMode.MergeUnlessEq,
            }),
            new Aggregation({
              destName: "agg_token_balance_lb",
              destType: "uint256",
              srcNames: ["out_token_balance_lb_msb", "out_token_balance_lb_lsb"],
              mode: AggMode.TakeGreaterUint256,
            }),
            new Aggregation({
              destName: "agg_token_balance_ub",
              destType: "uint256",
              srcNames: ["out_token_balance_ub_msb", "out_token_balance_ub_lsb"],
              mode: AggMode.TakeLessUint256,
            }),
            new Aggregation({
              destName: "agg_birthday_lb",
              destType: "uint64",
              srcNames: ["out_birthday_lb"],
              mode: AggMode.TakeGreater,
            }),
            new Aggregation({
              destName: "agg_birthday_ub",
              destType: "uint64",
              srcNames: ["out_birthday_ub"],
              mode: AggMode.TakeLess,
            }),
            new Aggregation({
              destName: "agg_status",
              destType: "mapping(uint8 => uint8)",
              srcNames: ["out_status_eq0"],
              mode: AggMode.MergeUnlessEq,
            }),
            new Aggregation({
              destName: "agg_status",
              destType: "mapping(uint8 => uint8)",
              srcNames: ["out_status_eq1"],
              mode: AggMode.MergeUnlessEq,
            }),
            new Aggregation({
              destName: "agg_followed",
              destType: "uint8",
              srcNames: ["out_followed"],
              mode: AggMode.SetIfRevealed,
            }),
            new Aggregation({
              destName: "agg_expiration_lb",
              destType: "uint64",
              srcNames: ["out_expiration_lb"],
              mode: AggMode.TakeGreater,
            }),
          ],
        },
      },
      {
        TestCaseName: "revocable",
        input: exampleRevocableCredTypeStr,
        output: {
          code: exampleRevocableCredCircuit,
          intrinsicSignalIndexMap: revocableIpsIndexMap,
          publicSignalDefs: [
            ...intrinsicSignals,
            {
              // additional signals for revocable
              name: "out_sig_revocation_smt_root",
              ceiling: bn128_R,
            },
            {
              name: "out_token_balance_lb_msb",
              ceiling: 1n << 128n,
            },
            {
              name: "out_token_balance_lb_lsb",
              ceiling: 1n << 128n,
            },
            {
              name: "out_token_balance_ub_msb",
              ceiling: 1n << 128n,
            },
            {
              name: "out_token_balance_ub_lsb",
              ceiling: 1n << 128n,
            },
            {
              name: "out_birthday_lb",
              ceiling: 1n << 64n,
            },
            {
              name: "out_birthday_ub",
              ceiling: 1n << 64n,
            },
            {
              name: "out_status_eq0",
              ceiling: 1n << BigInt(8 + 1),
            },
            {
              name: "out_status_eq1",
              ceiling: 1n << BigInt(8 + 1),
            },
            {
              name: "out_followed",
              ceiling: 4n,
            },
          ],
          aggregations: [
            new Aggregation({
              destName: "agg_out_id_equals_to",
              destType: "mapping(uint248 => uint8)",
              srcNames: ["out_id_equals_to"],
              mode: AggMode.MergeUnlessEq,
            }),
            new Aggregation({
              destName: "agg_token_balance_lb",
              destType: "uint256",
              srcNames: ["out_token_balance_lb_msb", "out_token_balance_lb_lsb"],
              mode: AggMode.TakeGreaterUint256,
            }),
            new Aggregation({
              destName: "agg_token_balance_ub",
              destType: "uint256",
              srcNames: ["out_token_balance_ub_msb", "out_token_balance_ub_lsb"],
              mode: AggMode.TakeLessUint256,
            }),
            new Aggregation({
              destName: "agg_birthday_lb",
              destType: "uint64",
              srcNames: ["out_birthday_lb"],
              mode: AggMode.TakeGreater,
            }),
            new Aggregation({
              destName: "agg_birthday_ub",
              destType: "uint64",
              srcNames: ["out_birthday_ub"],
              mode: AggMode.TakeLess,
            }),
            new Aggregation({
              destName: "agg_status",
              destType: "mapping(uint8 => uint8)",
              srcNames: ["out_status_eq0"],
              mode: AggMode.MergeUnlessEq,
            }),
            new Aggregation({
              destName: "agg_status",
              destType: "mapping(uint8 => uint8)",
              srcNames: ["out_status_eq1"],
              mode: AggMode.MergeUnlessEq,
            }),
            new Aggregation({
              destName: "agg_followed",
              destType: "uint8",
              srcNames: ["out_followed"],
              mode: AggMode.SetIfRevealed,
            }),
            new Aggregation({
              destName: "agg_expiration_lb",
              destType: "uint64",
              srcNames: ["out_expiration_lb"],
              mode: AggMode.TakeGreater,
            }),
            new Aggregation({
              destName: "sig_smt_root",
              destType: "uint256",
              srcNames: ["out_sig_revocation_smt_root"],
              mode: AggMode.SetToNewValue,
            }),
          ],
        },
      },
    ];
    for (const test of tests) {
      const tpRst = credType.parseCredType(test.input);
      assert(tpRst.ok);
      const tp = tpRst.value;
      tp.typeID = BigInt("778");
      expect(genCircuit(tp), test.TestCaseName).toEqual(test.output);
    }
  });
});

describe("genCircuitInput", () => {
  it("generates circuit input JSON for non-revocable", async () => {
    const credCtx = exampleCredTestContext();
    const statements = exampleStatementList();
    const checkResult = statements.checkBody(credCtx.cred.body);
    if (!checkResult.ok) {
      throw checkResult.error;
    }
    const input = genCircuitInput(
      credCtx.cred,
      {
        identitySecret: credCtx.identitySecret,
        internalNullifier: credCtx.internalNullifier,
      },
      BigInt(0),
      credCtx.internalNullifier,
      statements
    );
    expect(input).toEqual({
      version: 1n,
      type: 778n,
      context: 666n,
      id: 9n,
      birthday: 200n,
      birthday_lb: 199n,
      birthday_ub: 201n,
      status: 2n,
      status_eq_check0: 3n,
      status_eq_check1: 4n,
      token_balance_lsb: 100n,
      token_balance_msb: 0n,
      token_balance_lb_lsb: 50n,
      token_balance_lb_msb: 0n,
      token_balance_ub_lsb: 101n,
      token_balance_ub_msb: 0n,
      followed: 1n,
      followed_hide: 1n,
      expiration_lb: 99n,
      external_nullifier: 123n,
      id_equals_to: 9n,
      identity_secret: 456n,
      internal_nullifier: 123n,
      sig_pubkey_x: 10935976254715983394447744096265714717870934524635637248370950153474343295514n,
      sig_pubkey_y: 21449197704781574712824537353967502900551773215156358185119076113194443933018n,
      revealing_identity: 0n,
      revealing_identity_hmac: 16822110390837728147429094470193327627801082365378499438248053588413953983409n,
      sig_expired_at: 100n,
      sig_id: 999n,
      sig_identity_commitment: 4927655655099699900486263475166215352995660764281559606704696990727390837743n,
      sig_verification_stack: 1n,
      sig_r8_x: 11064998291044762246494683198643383018105307199794439230591644014000669829342n,
      sig_r8_y: 20810664658674404409290502999118637040954627050239530443180721964006855528403n,
      sig_s: 2253618474220632517706812358977631096673371252489160696092062487425763031780n,
    });
  });

  it("generates circuit input JSON for revocable", async () => {
    const credCtx = exampleCredTestContext(true);
    const statements = exampleStatementList();
    const checkResult = statements.checkBody(credCtx.cred.body);
    if (!checkResult.ok) {
      throw checkResult.error;
    }
    expect(() =>
      genCircuitInput(
        credCtx.cred,
        {
          identitySecret: credCtx.identitySecret,
          internalNullifier: credCtx.internalNullifier,
        },
        BigInt(0),
        credCtx.internalNullifier,
        statements
      )
    ).toThrowError(new CredError(ErrorName.InvalidParameter, "revocable credential requires a unrevoked proof"));
    assert(credCtx.smt);
    await credCtx.smt.add(1n);
    await credCtx.smt.add(2n);
    const unrevokedProof = await credCtx.smt.generateUnrevokedProof(credCtx.sigID);
    const input = genCircuitInput(
      credCtx.cred,
      {
        identitySecret: credCtx.identitySecret,
        internalNullifier: credCtx.internalNullifier,
      },
      BigInt(0),
      credCtx.internalNullifier,
      statements,
      unrevokedProof
    );
    expect(input).toEqual({
      version: 1n,
      type: 778n,
      context: 666n,
      id: 9n,
      birthday: 200n,
      birthday_lb: 199n,
      birthday_ub: 201n,
      status: 2n,
      status_eq_check0: 3n,
      status_eq_check1: 4n,
      token_balance_lsb: 100n,
      token_balance_msb: 0n,
      token_balance_lb_lsb: 50n,
      token_balance_lb_msb: 0n,
      token_balance_ub_lsb: 101n,
      token_balance_ub_msb: 0n,
      followed: 1n,
      followed_hide: 1n,
      expiration_lb: 99n,
      external_nullifier: 123n,
      id_equals_to: 9n,
      identity_secret: 456n,
      internal_nullifier: 123n,
      sig_pubkey_x: 10935976254715983394447744096265714717870934524635637248370950153474343295514n,
      sig_pubkey_y: 21449197704781574712824537353967502900551773215156358185119076113194443933018n,
      revealing_identity: 0n,
      revealing_identity_hmac: 16822110390837728147429094470193327627801082365378499438248053588413953983409n,
      sig_expired_at: 100n,
      sig_id: 999n,
      sig_identity_commitment: 4927655655099699900486263475166215352995660764281559606704696990727390837743n,
      sig_verification_stack: 1n,
      sig_r8_x: 11064998291044762246494683198643383018105307199794439230591644014000669829342n,
      sig_r8_y: 20810664658674404409290502999118637040954627050239530443180721964006855528403n,
      sig_s: 2253618474220632517706812358977631096673371252489160696092062487425763031780n,
      sig_revocation_smt_is_old0: 0n,
      sig_revocation_smt_old_key: 1n,
      sig_revocation_smt_old_value: 1n,
      sig_revocation_smt_root: 9220080741346732077761937086906424158127436067285707451617929752656488335401n,
      sig_revocation_smt_siblings: [
        4413308851819825379795718466699111712701090792862989389974231140330455156443n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
        0n,
      ],
      sig_revocation_smt_value: 1n,
    });
    // console.log(JSONStringifyBigInts(input));
  });
});

describe("genSolidity", () => {
  it("generates solidity codes", async () => {
    const dir = path.resolve(__dirname, "../testutils");

    const tests = [
      {
        name: "unrevocable",
        input: {
          typeDef: exampleCredTypeStr,
          vkey: JSON.parse(fs.readFileSync(`${dir}/example.vkey.json`, "utf-8")),
        },
        output: {
          verifierCode: exampleGroth16VerifierCode,
        },
      },
      {
        name: "revocable",
        input: {
          typeDef: exampleRevocableCredTypeStr,
          vkey: JSON.parse(fs.readFileSync(`${dir}/example_revocable.vkey.json`, "utf-8")),
        },
        output: {
          verifierCode: exampleRevocableGroth16VerifierCode,
        },
      },
    ];
    for (const test of tests) {
      const tpRst = credType.parseCredType(test.input.typeDef);
      assert(tpRst.ok);
      const tp = tpRst.value;
      tp.typeID = BigInt("778");
      const circuit = genCircuit(tp);
      // aggregator unused yet.
      // expect(circuit.genSolidityAggregation(), test.name).toEqual(test.output.aggregateCode);
      // expect(circuit.genSolidityValidate(), test.name).toEqual(test.output.validateCode);
      // expect(circuit.genSolidityDeclaration(), test.name).toEqual(test.output.declarationCode);
      expect(genVerifierSolidity(circuit, test.input.vkey), test.name).toEqual(test.output.verifierCode);
    }
  });
});

const exampleCredCircuit = `
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
  signal input token_balance_msb;
  signal input token_balance_lsb;
  signal input birthday;
  signal input status;
  signal input followed;
  signal output out;

  component hasher = Poseidon(5);
  hasher.inputs[0] <== token_balance_msb;
  hasher.inputs[1] <== token_balance_lsb;
  hasher.inputs[2] <== birthday;
  hasher.inputs[3] <== status;
  hasher.inputs[4] <== followed;
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
  signal input token_balance_msb;
  signal input token_balance_lsb;
  signal input birthday;
  signal input status;
  signal input followed;
  signal input token_balance_lb_msb;
  signal input token_balance_lb_lsb;
  signal input token_balance_ub_msb;
  signal input token_balance_ub_lsb;
  signal input birthday_lb;
  signal input birthday_ub;
  signal input status_eq_check0;
  signal input status_eq_check1;
  signal input followed_hide;
  signal output out_token_balance_lb_msb;
  signal output out_token_balance_lb_lsb;
  signal output out_token_balance_ub_msb;
  signal output out_token_balance_ub_lsb;
  signal output out_birthday_lb;
  signal output out_birthday_ub;
  signal output out_status_eq0;
  signal output out_status_eq1;
  signal output out_followed;

  // basic checks
  version === 1;  // protocol version 1
  sig_verification_stack === 1;  // babyzk
  type === 778;

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
  body_hasher.token_balance_msb <== token_balance_msb;
  body_hasher.token_balance_lsb <== token_balance_lsb;
  body_hasher.birthday <== birthday;
  body_hasher.status <== status;
  body_hasher.followed <== followed;

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

  component token_balance_range_check = Scalar256RangeChecker();
  token_balance_range_check.in_msb <== token_balance_msb;
  token_balance_range_check.in_lsb <== token_balance_lsb;
  token_balance_range_check.lower_bound_msb <== token_balance_lb_msb;
  token_balance_range_check.lower_bound_lsb <== token_balance_lb_lsb;
  token_balance_range_check.upper_bound_msb <== token_balance_ub_msb;
  token_balance_range_check.upper_bound_lsb <== token_balance_ub_lsb;
  out_token_balance_lb_msb <== token_balance_lb_msb;
  out_token_balance_lb_lsb <== token_balance_lb_lsb;
  out_token_balance_ub_msb <== token_balance_ub_msb;
  out_token_balance_ub_lsb <== token_balance_ub_lsb;

  component birthday_range_check = ScalarRangeChecker(64);
  birthday_range_check.in <== birthday;
  birthday_range_check.lower_bound <== birthday_lb;
  birthday_range_check.upper_bound <== birthday_ub;
  out_birthday_lb <== birthday_lb;
  out_birthday_ub <== birthday_ub;

  component status_eq_check = PropertyEqualityChecker(2);
  status_eq_check.in <== status;
  status_eq_check.equals_to[0] <== status_eq_check0;
  status_eq_check.equals_to[1] <== status_eq_check1;
  out_status_eq0 <== status_eq_check.out[0];
  out_status_eq1 <== status_eq_check.out[1];

  component followed_check = BooleanChecker();
  followed_check.in <== followed;
  followed_check.hide <== followed_hide;
  out_followed <== followed_check.out;
}

component main = Main();
`;

const exampleRevocableCredCircuit = `
pragma circom 2.1.5;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/eddsaposeidon.circom";
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
  signal input token_balance_msb;
  signal input token_balance_lsb;
  signal input birthday;
  signal input status;
  signal input followed;
  signal output out;

  component hasher = Poseidon(5);
  hasher.inputs[0] <== token_balance_msb;
  hasher.inputs[1] <== token_balance_lsb;
  hasher.inputs[2] <== birthday;
  hasher.inputs[3] <== status;
  hasher.inputs[4] <== followed;
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

    // revocable signature
  var sig_bit_length = 16;
  signal input sig_revocation_smt_root;
  signal input sig_revocation_smt_siblings[sig_bit_length];
  signal input sig_revocation_smt_old_key;
  signal input sig_revocation_smt_old_value;
  signal input sig_revocation_smt_is_old0;
  signal input sig_revocation_smt_value;

  // intrinsic output signals
  signal output out_type;
  signal output out_context;
  signal output out_nullifier;
  signal output out_external_nullifier;
  signal output out_revealing_identity;
  signal output out_expiration_lb;
  signal output out_key_id;
  signal output out_id_equals_to;
  signal output out_sig_revocation_smt_root;

  // defs
  signal input token_balance_msb;
  signal input token_balance_lsb;
  signal input birthday;
  signal input status;
  signal input followed;
  signal input token_balance_lb_msb;
  signal input token_balance_lb_lsb;
  signal input token_balance_ub_msb;
  signal input token_balance_ub_lsb;
  signal input birthday_lb;
  signal input birthday_ub;
  signal input status_eq_check0;
  signal input status_eq_check1;
  signal input followed_hide;
  signal output out_token_balance_lb_msb;
  signal output out_token_balance_lb_lsb;
  signal output out_token_balance_ub_msb;
  signal output out_token_balance_ub_lsb;
  signal output out_birthday_lb;
  signal output out_birthday_ub;
  signal output out_status_eq0;
  signal output out_status_eq1;
  signal output out_followed;

  // basic checks
  version === 1;  // protocol version 1
  sig_verification_stack === 1;  // babyzk
  type === 778;

  // redirect intrinsic signals to output
  out_type <== type;
  out_context <== context;
  out_external_nullifier <== external_nullifier;
  out_revealing_identity <== revealing_identity;
  out_expiration_lb <== expiration_lb;
  out_sig_revocation_smt_root <== sig_revocation_smt_root;

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
  body_hasher.token_balance_msb <== token_balance_msb;
  body_hasher.token_balance_lsb <== token_balance_lsb;
  body_hasher.birthday <== birthday;
  body_hasher.status <== status;
  body_hasher.followed <== followed;

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

  component token_balance_range_check = Scalar256RangeChecker();
  token_balance_range_check.in_msb <== token_balance_msb;
  token_balance_range_check.in_lsb <== token_balance_lsb;
  token_balance_range_check.lower_bound_msb <== token_balance_lb_msb;
  token_balance_range_check.lower_bound_lsb <== token_balance_lb_lsb;
  token_balance_range_check.upper_bound_msb <== token_balance_ub_msb;
  token_balance_range_check.upper_bound_lsb <== token_balance_ub_lsb;
  out_token_balance_lb_msb <== token_balance_lb_msb;
  out_token_balance_lb_lsb <== token_balance_lb_lsb;
  out_token_balance_ub_msb <== token_balance_ub_msb;
  out_token_balance_ub_lsb <== token_balance_ub_lsb;

  component birthday_range_check = ScalarRangeChecker(64);
  birthday_range_check.in <== birthday;
  birthday_range_check.lower_bound <== birthday_lb;
  birthday_range_check.upper_bound <== birthday_ub;
  out_birthday_lb <== birthday_lb;
  out_birthday_ub <== birthday_ub;

  component status_eq_check = PropertyEqualityChecker(2);
  status_eq_check.in <== status;
  status_eq_check.equals_to[0] <== status_eq_check0;
  status_eq_check.equals_to[1] <== status_eq_check1;
  out_status_eq0 <== status_eq_check.out[0];
  out_status_eq1 <== status_eq_check.out[1];

  component followed_check = BooleanChecker();
  followed_check.in <== followed;
  followed_check.hide <== followed_hide;
  out_followed <== followed_check.out;
}

component main = Main();
`;

const exampleGroth16VerifierCode = `
// SPDX-License-Identifier: GPL-3.0
/*
    Copyright (c) 2021 0KIMS association.
    Copyright (c) [2024] Galxe.com.

    Modifications to this file are part of the Galxe Identity Protocol SDK,
    which is built using the snarkJS template and is subject to the GNU
    General Public License v3.0.

    snarkJS is free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.8.4 <0.9.0;

contract BabyZKGroth16Verifier {
    error AliasedPublicSignal();

    // Scalar field size
    uint256 constant r   = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
    uint256 constant alphay  = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
    uint256 constant betax1  = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
    uint256 constant betax2  = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
    uint256 constant betay1  = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
    uint256 constant betay2  = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 13382824629081054131218833335176402998433623280720282474363094935338262422270;
    uint256 constant deltax2 = 14992997694787798298970128428651735156878746405574581777463392851219891893781;
    uint256 constant deltay1 = 804122157291260134274964543508763620825033741658958140658682496549278923901;
    uint256 constant deltay2 = 20795590244823410398603606172994427921866842716949936464446009005497705344370;

    uint256 constant IC0x = 19764436097581810314981626268114476419304968023360522705050759260578697031462;
    uint256 constant IC0y = 8451221249198589510842464045063602196787955791157681746389594127570869984928;
    uint256 constant IC1x = 21274084361069811495645657261374711891271996424091601874260232553721691430414;
    uint256 constant IC1y = 18000760790522873766821443416445254770267418552173774295864206456854759299925;
    uint256 constant IC2x = 15406250183619285448547045124806907366410436301666555537778268068652090454826;
    uint256 constant IC2y = 16536866637232299722780757345722186540586417773472679268766516998907360267632;
    uint256 constant IC3x = 18374705184999687319171921539828416791438685495665607649793873489922597027600;
    uint256 constant IC3y = 1324933125121386374556026239019389403336018576970746564093745069887950534538;
    uint256 constant IC4x = 21457380141608127838031972036608507773411663714612203367705414415111561961277;
    uint256 constant IC4y = 16018892444415488221673569328605540820594796341281504466704561641863116563640;
    uint256 constant IC5x = 4410962418506163125770089415721869910260536222460700836340037001025748261657;
    uint256 constant IC5y = 12196544090537868588257394514303562289870399093465372249911888281222653317102;
    uint256 constant IC6x = 16355683075872354209267838353583450687199376651860741592253396291886816543862;
    uint256 constant IC6y = 8050682799666257391554605850006270160377444038524969785464126797015352749651;
    uint256 constant IC7x = 15130082049987335261186284021682267001157753150054785745432629861697791280041;
    uint256 constant IC7y = 11409658019373236419032912460491744865103271076229735296217123384950365303683;
    uint256 constant IC8x = 9239095888561578936225914783731536081988128122942802873108497080576303816484;
    uint256 constant IC8y = 19627935081539557575283341840595370652002756337934390012485590940687364697288;
    uint256 constant IC9x = 1544399278273077596304550000514283833778290595157696898003276405603026075525;
    uint256 constant IC9y = 12446151319216301189634940789701302821473889204933697496346243428390391624249;
    uint256 constant IC10x = 4936749834027810796851373254552130530859646770418885520111981651453231423245;
    uint256 constant IC10y = 4695807811926245815954974360257940071643216870360652435028803223339780553170;
    uint256 constant IC11x = 4386575281807163938236728588139510785832125338080551306676099982544329826031;
    uint256 constant IC11y = 21854523620979501974914214769323826893815395641321488249328265610525413876169;
    uint256 constant IC12x = 17087426415995636070231091668322859160271781381287693465566270886052258684849;
    uint256 constant IC12y = 21281749810427109997695417984136831170564875549572164580740725078883719443756;
    uint256 constant IC13x = 4694568533132038325785559030661195239336100288714016265423550859067921485661;
    uint256 constant IC13y = 13379560590872257908754863449011215932119472869546011755200122317649852454611;
    uint256 constant IC14x = 10550810178264882050197120045435651255510437946929704560960055862934233593614;
    uint256 constant IC14y = 9782748714520027917613119514237169222361657844606804275223173790586411176386;
    uint256 constant IC15x = 5914524855691587775724793258915080995144157669338156007826407442379152618637;
    uint256 constant IC15y = 12397453008182332797283780921871184363383883818158138717833932109963434050176;
    uint256 constant IC16x = 16837586497481772092479543877979949414951845091405932961149069997036601470834;
    uint256 constant IC16y = 16144891566083854639395947018697451368349959925473031654640966655021187669246;
    uint256 constant IC17x = 10567482486088980042721003523293196249588750547058227520825109679160089820321;
    uint256 constant IC17y = 18477812318770410046283056381658040574361828280620497289914213363727644682160;
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    uint16 constant proofLength = 8;
    uint32 constant pubSignalLength = 17;

    /// @dev returns the verification keys in the order that the verifier expects them:
    /// alpha, beta, gamma, delta, ICs..
    function getVerificationKeys() public pure returns (uint[] memory) {
        uint[] memory vks = new uint[](16 + pubSignalLength * 2);
        vks[0] = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
        vks[1] = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
        vks[2] = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
        vks[3] = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
        vks[4] = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
        vks[5] = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
        vks[6] = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
        vks[7] = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
        vks[8] = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
        vks[9] = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
        vks[10] = 13382824629081054131218833335176402998433623280720282474363094935338262422270;
        vks[11] = 14992997694787798298970128428651735156878746405574581777463392851219891893781;
        vks[12] = 804122157291260134274964543508763620825033741658958140658682496549278923901;
        vks[13] = 20795590244823410398603606172994427921866842716949936464446009005497705344370;
        vks[14] = 19764436097581810314981626268114476419304968023360522705050759260578697031462;
        vks[15] = 8451221249198589510842464045063602196787955791157681746389594127570869984928;
        vks[16] = 21274084361069811495645657261374711891271996424091601874260232553721691430414;
        vks[17] = 18000760790522873766821443416445254770267418552173774295864206456854759299925;
        vks[18] = 15406250183619285448547045124806907366410436301666555537778268068652090454826;
        vks[19] = 16536866637232299722780757345722186540586417773472679268766516998907360267632;
        vks[20] = 18374705184999687319171921539828416791438685495665607649793873489922597027600;
        vks[21] = 1324933125121386374556026239019389403336018576970746564093745069887950534538;
        vks[22] = 21457380141608127838031972036608507773411663714612203367705414415111561961277;
        vks[23] = 16018892444415488221673569328605540820594796341281504466704561641863116563640;
        vks[24] = 4410962418506163125770089415721869910260536222460700836340037001025748261657;
        vks[25] = 12196544090537868588257394514303562289870399093465372249911888281222653317102;
        vks[26] = 16355683075872354209267838353583450687199376651860741592253396291886816543862;
        vks[27] = 8050682799666257391554605850006270160377444038524969785464126797015352749651;
        vks[28] = 15130082049987335261186284021682267001157753150054785745432629861697791280041;
        vks[29] = 11409658019373236419032912460491744865103271076229735296217123384950365303683;
        vks[30] = 9239095888561578936225914783731536081988128122942802873108497080576303816484;
        vks[31] = 19627935081539557575283341840595370652002756337934390012485590940687364697288;
        vks[32] = 1544399278273077596304550000514283833778290595157696898003276405603026075525;
        vks[33] = 12446151319216301189634940789701302821473889204933697496346243428390391624249;
        vks[34] = 4936749834027810796851373254552130530859646770418885520111981651453231423245;
        vks[35] = 4695807811926245815954974360257940071643216870360652435028803223339780553170;
        vks[36] = 4386575281807163938236728588139510785832125338080551306676099982544329826031;
        vks[37] = 21854523620979501974914214769323826893815395641321488249328265610525413876169;
        vks[38] = 17087426415995636070231091668322859160271781381287693465566270886052258684849;
        vks[39] = 21281749810427109997695417984136831170564875549572164580740725078883719443756;
        vks[40] = 4694568533132038325785559030661195239336100288714016265423550859067921485661;
        vks[41] = 13379560590872257908754863449011215932119472869546011755200122317649852454611;
        vks[42] = 10550810178264882050197120045435651255510437946929704560960055862934233593614;
        vks[43] = 9782748714520027917613119514237169222361657844606804275223173790586411176386;
        vks[44] = 5914524855691587775724793258915080995144157669338156007826407442379152618637;
        vks[45] = 12397453008182332797283780921871184363383883818158138717833932109963434050176;
        vks[46] = 16837586497481772092479543877979949414951845091405932961149069997036601470834;
        vks[47] = 16144891566083854639395947018697451368349959925473031654640966655021187669246;
        vks[48] = 10567482486088980042721003523293196249588750547058227520825109679160089820321;
        vks[49] = 18477812318770410046283056381658040574361828280620497289914213363727644682160;
        return vks;
    }

    /// @dev return true if the public signal is aliased
    function isAliased(uint[] calldata _pubSignals) public pure returns (bool) {
        // Alias check
        if (_pubSignals[0] >= 1461501637330902918203684832716283019655932542976) { return true; }
        if (_pubSignals[1] >= 1461501637330902918203684832716283019655932542976) { return true; }
        if (_pubSignals[2] >= 21888242871839275222246405745257275088548364400416034343698204186575808495617) { return true; }
        if (_pubSignals[3] >= 1461501637330902918203684832716283019655932542976) { return true; }
        if (_pubSignals[4] >= 452312848583266388373324160190187140051835877600158453279131187530910662656) { return true; }
        if (_pubSignals[5] >= 18446744073709551616) { return true; }
        if (_pubSignals[6] >= 21888242871839275222246405745257275088548364400416034343698204186575808495617) { return true; }
        if (_pubSignals[7] >= 904625697166532776746648320380374280103671755200316906558262375061821325312) { return true; }
        if (_pubSignals[8] >= 340282366920938463463374607431768211456) { return true; }
        if (_pubSignals[9] >= 340282366920938463463374607431768211456) { return true; }
        if (_pubSignals[10] >= 340282366920938463463374607431768211456) { return true; }
        if (_pubSignals[11] >= 340282366920938463463374607431768211456) { return true; }
        if (_pubSignals[12] >= 18446744073709551616) { return true; }
        if (_pubSignals[13] >= 18446744073709551616) { return true; }
        if (_pubSignals[14] >= 512) { return true; }
        if (_pubSignals[15] >= 512) { return true; }
        if (_pubSignals[16] >= 4) { return true; }
        return false;
    }

    function verifyProof(uint[] calldata _proofs, uint[] calldata _pubSignals) public view returns (bool) {
        // Check Argument
        require(_proofs.length == proofLength, "Invalid proof");
        require(_pubSignals.length == pubSignalLength, "Invalid public signal");
        if (isAliased(_pubSignals)) { return false; }
        assembly {
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination it.vkey.vk_x
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // it.vkey.vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))

                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)

                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate all evaluations
            let isValid := checkPairing(_proofs.offset, add(_proofs.offset, 64), add(_proofs.offset, 192), _pubSignals.offset, pMem)

            mstore(0, isValid)
            return(0, 0x20)
        }
    }
}
`;

const exampleRevocableGroth16VerifierCode = `
// SPDX-License-Identifier: GPL-3.0
/*
    Copyright (c) 2021 0KIMS association.
    Copyright (c) [2024] Galxe.com.

    Modifications to this file are part of the Galxe Identity Protocol SDK,
    which is built using the snarkJS template and is subject to the GNU
    General Public License v3.0.

    snarkJS is free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.8.4 <0.9.0;

contract BabyZKGroth16Verifier {
    error AliasedPublicSignal();

    // Scalar field size
    uint256 constant r   = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
    uint256 constant alphay  = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
    uint256 constant betax1  = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
    uint256 constant betax2  = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
    uint256 constant betay1  = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
    uint256 constant betay2  = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 1882364706458503005232475951038199065763410901527756464187180105229112396841;
    uint256 constant deltax2 = 13982707264366558261146595797542785363281966817985917957620993113155283930842;
    uint256 constant deltay1 = 3160664283412126522362163156335042446690680033366115964460170810315877756859;
    uint256 constant deltay2 = 3361216318719617247167450609233098257971537409972105379556292018008174242993;

    uint256 constant IC0x = 16344271723525745330089406167718673831229607420873253431918787878218777643278;
    uint256 constant IC0y = 19068357211030992922788254345123980117959234850319825677618292842457691405030;
    uint256 constant IC1x = 6014118828353164019223759243643946490962455888512110113738628213575528401078;
    uint256 constant IC1y = 952560696260176513599650249066337469280887181447382521840961688826023614065;
    uint256 constant IC2x = 18014663056359008200385623839092936993447069832043874378189731939631495230189;
    uint256 constant IC2y = 16795844646742494465437498259853472142944507173403737817366815256427780734236;
    uint256 constant IC3x = 14373415734035609721810433489583741151275932240655064686290661196403337233503;
    uint256 constant IC3y = 1711037313693371500679228513798872233623076292082332844479396590369924301500;
    uint256 constant IC4x = 4377713024822627456391534429519105229432261544520581999724742076362647481991;
    uint256 constant IC4y = 3654939157182750025626238971442334937379360345622454301685395907715915786528;
    uint256 constant IC5x = 12434842560341427381091009848886966190317018431571186985212767913582793091033;
    uint256 constant IC5y = 960689068374467506525486367991002349267374064041230446260392423587028682797;
    uint256 constant IC6x = 16116740122579596964080959678026860764868509051069170613097150798900574800120;
    uint256 constant IC6y = 18625490230063446491898055124160076553956874307937109426236634069554743739504;
    uint256 constant IC7x = 3328183361741286394228024661246306080676729522823836540770459393800572206293;
    uint256 constant IC7y = 7727929394925246597242379189968256067843999732477725082090107983219972969086;
    uint256 constant IC8x = 13472499580349749560725914977774410001141081275760218439463081236979741688008;
    uint256 constant IC8y = 19530618553320463860467186577796936833360983842014858203085348959353732645230;
    uint256 constant IC9x = 17498277990495913709037423552919656338979160919293909339937141462684017956196;
    uint256 constant IC9y = 6257656821019173674606933263592807142929692127931766385726132437188595517970;
    uint256 constant IC10x = 9904744704295542451075353263976479631548333459739603579416762901546454395958;
    uint256 constant IC10y = 16865653462242999988333261656181644976255484812213305768443543308570775445853;
    uint256 constant IC11x = 17276930714424563938521830782032618868277725616148136077827171096394434413630;
    uint256 constant IC11y = 17596926818845562345130858017563587378698929254267990545207760627791567992437;
    uint256 constant IC12x = 10690041012906057134648963944616475397467203110933997351171385905107603786178;
    uint256 constant IC12y = 2426599412031276779556285272336062830283714413559998841981451603513647891427;
    uint256 constant IC13x = 14677712908659821988951510335729733019134170755054403947488039668179369204015;
    uint256 constant IC13y = 17861018456699773219339698494130023475752223596270757350019479155022095189599;
    uint256 constant IC14x = 4059590728914927822667888753564200978294911732087844349849756028359048383529;
    uint256 constant IC14y = 11851363417295131201057968329773341445724280888705510695977394342536126807843;
    uint256 constant IC15x = 7994873373382848775309022009493019090315919998684705676392084020203450953676;
    uint256 constant IC15y = 18423877133953363736951056196478183204211849265221023917424661421126345305172;
    uint256 constant IC16x = 19381774082078471354145054015992261706028134987966526644430415687337728636125;
    uint256 constant IC16y = 3041262511371001224328973897499583386865775708418990603668899165883122322535;
    uint256 constant IC17x = 15576831529985557090169220347479648025003475911133392527968808385164396707157;
    uint256 constant IC17y = 20786553444063989335647215616824231285883907234229069851003359096848464931780;
    uint256 constant IC18x = 10242101596772973919673378396182430798758626758072900422483984912622144535264;
    uint256 constant IC18y = 20964342351907694552983231154762237386081339332634359708567530724290111337773;
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    uint16 constant proofLength = 8;
    uint32 constant pubSignalLength = 18;

    /// @dev returns the verification keys in the order that the verifier expects them:
    /// alpha, beta, gamma, delta, ICs..
    function getVerificationKeys() public pure returns (uint[] memory) {
        uint[] memory vks = new uint[](16 + pubSignalLength * 2);
        vks[0] = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
        vks[1] = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
        vks[2] = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
        vks[3] = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
        vks[4] = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
        vks[5] = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
        vks[6] = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
        vks[7] = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
        vks[8] = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
        vks[9] = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
        vks[10] = 1882364706458503005232475951038199065763410901527756464187180105229112396841;
        vks[11] = 13982707264366558261146595797542785363281966817985917957620993113155283930842;
        vks[12] = 3160664283412126522362163156335042446690680033366115964460170810315877756859;
        vks[13] = 3361216318719617247167450609233098257971537409972105379556292018008174242993;
        vks[14] = 16344271723525745330089406167718673831229607420873253431918787878218777643278;
        vks[15] = 19068357211030992922788254345123980117959234850319825677618292842457691405030;
        vks[16] = 6014118828353164019223759243643946490962455888512110113738628213575528401078;
        vks[17] = 952560696260176513599650249066337469280887181447382521840961688826023614065;
        vks[18] = 18014663056359008200385623839092936993447069832043874378189731939631495230189;
        vks[19] = 16795844646742494465437498259853472142944507173403737817366815256427780734236;
        vks[20] = 14373415734035609721810433489583741151275932240655064686290661196403337233503;
        vks[21] = 1711037313693371500679228513798872233623076292082332844479396590369924301500;
        vks[22] = 4377713024822627456391534429519105229432261544520581999724742076362647481991;
        vks[23] = 3654939157182750025626238971442334937379360345622454301685395907715915786528;
        vks[24] = 12434842560341427381091009848886966190317018431571186985212767913582793091033;
        vks[25] = 960689068374467506525486367991002349267374064041230446260392423587028682797;
        vks[26] = 16116740122579596964080959678026860764868509051069170613097150798900574800120;
        vks[27] = 18625490230063446491898055124160076553956874307937109426236634069554743739504;
        vks[28] = 3328183361741286394228024661246306080676729522823836540770459393800572206293;
        vks[29] = 7727929394925246597242379189968256067843999732477725082090107983219972969086;
        vks[30] = 13472499580349749560725914977774410001141081275760218439463081236979741688008;
        vks[31] = 19530618553320463860467186577796936833360983842014858203085348959353732645230;
        vks[32] = 17498277990495913709037423552919656338979160919293909339937141462684017956196;
        vks[33] = 6257656821019173674606933263592807142929692127931766385726132437188595517970;
        vks[34] = 9904744704295542451075353263976479631548333459739603579416762901546454395958;
        vks[35] = 16865653462242999988333261656181644976255484812213305768443543308570775445853;
        vks[36] = 17276930714424563938521830782032618868277725616148136077827171096394434413630;
        vks[37] = 17596926818845562345130858017563587378698929254267990545207760627791567992437;
        vks[38] = 10690041012906057134648963944616475397467203110933997351171385905107603786178;
        vks[39] = 2426599412031276779556285272336062830283714413559998841981451603513647891427;
        vks[40] = 14677712908659821988951510335729733019134170755054403947488039668179369204015;
        vks[41] = 17861018456699773219339698494130023475752223596270757350019479155022095189599;
        vks[42] = 4059590728914927822667888753564200978294911732087844349849756028359048383529;
        vks[43] = 11851363417295131201057968329773341445724280888705510695977394342536126807843;
        vks[44] = 7994873373382848775309022009493019090315919998684705676392084020203450953676;
        vks[45] = 18423877133953363736951056196478183204211849265221023917424661421126345305172;
        vks[46] = 19381774082078471354145054015992261706028134987966526644430415687337728636125;
        vks[47] = 3041262511371001224328973897499583386865775708418990603668899165883122322535;
        vks[48] = 15576831529985557090169220347479648025003475911133392527968808385164396707157;
        vks[49] = 20786553444063989335647215616824231285883907234229069851003359096848464931780;
        vks[50] = 10242101596772973919673378396182430798758626758072900422483984912622144535264;
        vks[51] = 20964342351907694552983231154762237386081339332634359708567530724290111337773;
        return vks;
    }

    /// @dev return true if the public signal is aliased
    function isAliased(uint[] calldata _pubSignals) public pure returns (bool) {
        // Alias check
        if (_pubSignals[0] >= 1461501637330902918203684832716283019655932542976) { return true; }
        if (_pubSignals[1] >= 1461501637330902918203684832716283019655932542976) { return true; }
        if (_pubSignals[2] >= 21888242871839275222246405745257275088548364400416034343698204186575808495617) { return true; }
        if (_pubSignals[3] >= 1461501637330902918203684832716283019655932542976) { return true; }
        if (_pubSignals[4] >= 452312848583266388373324160190187140051835877600158453279131187530910662656) { return true; }
        if (_pubSignals[5] >= 18446744073709551616) { return true; }
        if (_pubSignals[6] >= 21888242871839275222246405745257275088548364400416034343698204186575808495617) { return true; }
        if (_pubSignals[7] >= 904625697166532776746648320380374280103671755200316906558262375061821325312) { return true; }
        if (_pubSignals[8] >= 21888242871839275222246405745257275088548364400416034343698204186575808495617) { return true; }
        if (_pubSignals[9] >= 340282366920938463463374607431768211456) { return true; }
        if (_pubSignals[10] >= 340282366920938463463374607431768211456) { return true; }
        if (_pubSignals[11] >= 340282366920938463463374607431768211456) { return true; }
        if (_pubSignals[12] >= 340282366920938463463374607431768211456) { return true; }
        if (_pubSignals[13] >= 18446744073709551616) { return true; }
        if (_pubSignals[14] >= 18446744073709551616) { return true; }
        if (_pubSignals[15] >= 512) { return true; }
        if (_pubSignals[16] >= 512) { return true; }
        if (_pubSignals[17] >= 4) { return true; }
        return false;
    }

    function verifyProof(uint[] calldata _proofs, uint[] calldata _pubSignals) public view returns (bool) {
        // Check Argument
        require(_proofs.length == proofLength, "Invalid proof");
        require(_pubSignals.length == pubSignalLength, "Invalid public signal");
        if (isAliased(_pubSignals)) { return false; }
        assembly {
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination it.vkey.vk_x
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // it.vkey.vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))

                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)

                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate all evaluations
            let isValid := checkPairing(_proofs.offset, add(_proofs.offset, 64), add(_proofs.offset, 192), _pubSignals.offset, pMem)

            mstore(0, isValid)
            return(0, 0x20)
        }
    }
}
`;

const unitTypeCircomCode = `
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
  signal output out;

  out <== 0;
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

  // basic checks
  version === 1;  // protocol version 1
  sig_verification_stack === 1;  // babyzk
  type === 1;

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

  }

component main = Main();
`;
