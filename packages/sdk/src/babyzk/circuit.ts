import { render as renderCircomCode } from "@/babyzk/templates/circom_template";
import { CredType } from "@/credential/credType";
import { StatementList, ScalarStatement, BoolStatement, PropStatement } from "@/credential/statement";
import {
  Credential,
  CircuitInput,
  IdentityOwner,
  VerificationStackEnum,
  Circuit,
  PublicSignalDef,
  AggregationMode as AggMode,
  Aggregation,
  IntrinsicPublicSignal,
} from "@/credential/credential";
import type { IntrinsicSignalIndexMap } from "@/credential/credential";
import { CredError, ErrorName } from "@/errors";
import { eddsa, poseidon } from "@/crypto/babyzk/deps";
import { ClaimDef, ClaimTypeEnum, PropType } from "@/credential/claimType";
import { split256 } from "@/utils";
import { bn128_R } from "@/crypto/babyzk/deps";
import { SMTProof, UnrevokedProofCircomInput } from "@/crypto/smt";
import { genFieldDef } from "./templates/fielddef";
import { pubKeySerde } from "./serde";

/**
 * The maximum depth of the SMT tree.
 */
const CIRCOM_MAX_SMT_DEPTH = 256;
/**
 * The minimum depth of the SMT tree.
 */
const CIRCOM_MIN_SMT_DEPTH = 2;

/**
 * Generate circom circuit from credential type
 **/
export function genCircuit(cred: CredType): Circuit {
  if (!cred.claims) {
    throw new CredError(ErrorName.InternalError, `Credential type is not defined: ${cred.claims}`);
  }
  if (cred.revocable && (cred.revocable > CIRCOM_MAX_SMT_DEPTH || cred.revocable < CIRCOM_MIN_SMT_DEPTH)) {
    throw new CredError(
      ErrorName.InvalidParameter,
      `revocable depth ${cred.revocable} is not in range [${CIRCOM_MIN_SMT_DEPTH}, ${CIRCOM_MAX_SMT_DEPTH}]`
    );
  }
  const { code, defs } = renderCircomCode(cred.claims, cred.typeID, cred.revocable);
  //// Prepare output signals.
  const intrinsicOutputSignalDefs = prepareIntrinsicOutputSignal(cred.revocable != null);
  // Prepare the list of all signals.
  // order: [predefined intrinsic signals, claim signals]
  const allSignals = [...intrinsicOutputSignalDefs, ...defs.defs.flatMap(def => def.outputSignals)];
  if (allSignals.length > 256) {
    throw new CredError(ErrorName.UnsupportableType, `too many signals: ${allSignals.length}`);
  }
  // Prepare the aggregation list of all signals.
  const claimAggregations: Aggregation[] = defs.defs.flatMap(def => def.aggregations());
  const aggregations: Aggregation[] = [
    // add id equals to aggregation, merge the unequal values set,
    // or take the only value if they are equal.
    new Aggregation({
      destName: "agg_out_id_equals_to",
      destType: "mapping(uint248 => uint8)",
      srcNames: ["out_id_equals_to"],
      mode: AggMode.MergeUnlessEq,
    }),
    ...claimAggregations,
    // add expiration aggregation, always take the greater value.
    new Aggregation({
      destName: "agg_expiration_lb",
      destType: "uint64",
      srcNames: ["out_expiration_lb"],
      mode: AggMode.TakeGreater,
    }),
  ];
  // add revocation aggregation, always update to the new value.
  if (cred.revocable) {
    aggregations.push(
      new Aggregation({
        destName: "sig_smt_root",
        destType: "uint256",
        srcNames: ["out_sig_revocation_smt_root"],
        mode: AggMode.SetToNewValue,
      })
    );
  }
  // signal index map for babyzk circuit is fixed.
  const ipsMap: IntrinsicSignalIndexMap = new Map([
    [IntrinsicPublicSignal.Type, 0],
    [IntrinsicPublicSignal.Context, 1],
    [IntrinsicPublicSignal.Nullifier, 2],
    [IntrinsicPublicSignal.ExternalNullifier, 3],
    [IntrinsicPublicSignal.RevealIdentity, 4],
    [IntrinsicPublicSignal.ExpirationLb, 5],
    [IntrinsicPublicSignal.KeyId, 6],
    [IntrinsicPublicSignal.IdEqualsTo, 7],
  ]);
  if (cred.revocable) {
    ipsMap.set(IntrinsicPublicSignal.SigRevocationSmtRoot, 8);
  }
  return new Circuit({ code, publicSignalDefs: allSignals, intrinsicSignalIndexes: ipsMap, aggregations });
}

/**
 * Prepare public signals based on the field definitions.
 */
function prepareIntrinsicOutputSignal(isRevocable: boolean): PublicSignalDef[] {
  // all intrinsic output signal definitions will be shown first in the circuit.
  // so based on the circom compiler's setting, the order of the signals will be:
  const signals: PublicSignalDef[] = [
    { name: "out_type", ceiling: 1n << 160n },
    { name: "out_context", ceiling: 1n << 160n },
    { name: "out_nullifier", ceiling: bn128_R },
    { name: "out_external_nullifier", ceiling: 1n << 160n },
    { name: "out_reveal_identity", ceiling: 1n << 248n },
    { name: "out_expiration_lb", ceiling: 1n << 64n },
    { name: "out_key_id", ceiling: bn128_R },
    { name: "out_id_equals_to", ceiling: 1n << 249n },
  ];
  // 1 additional public signal for revocable credential
  if (isRevocable) {
    signals.push({ name: "out_sig_revocation_smt_root", ceiling: bn128_R });
  }
  return signals;
}

/**
 * CircomCircuitInput is the input to the circom circuit.
 * This type defines the intrinsic fields required by the circuit.
 */
export type CircomCircuitInput = CircuitInput & {
  version: bigint;
  type: bigint;
  context: bigint;
  id: bigint;

  sig_verification_stack: bigint;
  sig_id: bigint;
  sig_expired_at: bigint;
  sig_identity_commitment: bigint;

  sig_pubkey_x: bigint;
  sig_pubkey_y: bigint;
  sig_s: bigint;
  sig_r8_x: bigint;
  sig_r8_y: bigint;

  identity_secret: bigint;
  internal_nullifier: bigint;
  external_nullifier: bigint;

  expiration_lb: bigint;
  id_equals_to: bigint;

  revealing_identity: bigint;
  revealing_identity_hmac: bigint;

  sig_revocation_smt_root?: bigint;
  sig_revocation_smt_siblings?: bigint[];
  sig_revocation_smt_old_key?: bigint;
  sig_revocation_smt_old_value?: bigint;
  sig_revocation_smt_is_old0?: bigint;
  sig_revocation_smt_value?: bigint;
};

// generate circuit input from credential for the n-th signature (verification stack).
export function genCircuitInput(
  cred: Credential,
  owner: IdentityOwner,
  pseudonym: bigint,
  extNullifier: bigint,
  statements: StatementList,
  unrevokedProof?: SMTProof,
  n?: number
): CircomCircuitInput {
  if (n === undefined) {
    n = 0;
  }
  let unrevokedProofCircomInput: UnrevokedProofCircomInput | undefined = undefined;
  // revocable credential: proof must be provided.
  if (cred.body.tp.revocable) {
    if (unrevokedProof === undefined) {
      throw new CredError(ErrorName.InvalidParameter, "revocable credential requires a unrevoked proof");
    }
    unrevokedProofCircomInput = unrevokedProof.toCircomInput();
  }
  // check if n-th signature exists
  if (!cred.signatures[n]) {
    throw new CredError(ErrorName.InvalidParameter, `signature ${n} is not defined`);
  }
  const sig = cred.signatures[n];
  if (sig == undefined) {
    throw new CredError(ErrorName.InvalidParameter, `signature ${n} is not defined`);
  }
  // check if the signature is babyzk
  if (sig.metadata.verificationStack !== VerificationStackEnum.BabyZK) {
    throw new CredError(ErrorName.InvalidParameter, `signature ${n} is not babyzk`);
  }
  const checkResult = statements.checkBody(cred.body);
  if (!checkResult.ok) {
    throw checkResult.error;
  }
  // JSON fields for metadata.
  const pubkey = pubKeySerde.deserialize(sig.metadata.publicKey);
  const header = cred.header;
  const eddsaSig = eddsa.unpackSignature(sig.signature);
  const hmac = poseidon([owner.identitySecret, extNullifier, pseudonym]);
  const rv: CircomCircuitInput = {
    version: header.version,
    type: header.type,
    context: header.context,
    id: header.id,

    sig_verification_stack: BigInt(sig.metadata.verificationStack),
    sig_id: sig.metadata.signatureID,
    sig_expired_at: sig.metadata.expiredAt,
    sig_identity_commitment: sig.metadata.identityCommitment,

    sig_pubkey_x: pubkey[0],
    sig_pubkey_y: pubkey[1],
    sig_s: eddsaSig.S,
    sig_r8_x: eddsaSig.R8[0],
    sig_r8_y: eddsaSig.R8[1],

    identity_secret: owner.identitySecret,
    internal_nullifier: owner.internalNullifier,
    external_nullifier: extNullifier,

    id_equals_to: statements.idEqualsTo.equalsTo[0] as bigint,
    expiration_lb: statements.expirationLb.lowerBound,

    revealing_identity: pseudonym,
    revealing_identity_hmac: hmac,

    ...unrevokedProofCircomInput,
  };

  // JSON fields for claim values.
  cred.body.values.forEach((claimValue, i) => {
    const signals = genFieldDef(cred.body.tp.claims[i] as ClaimDef).inputSignals;
    if (signals.length !== claimValue.value().length) {
      throw new CredError(
        ErrorName.InternalError,
        `claim value ${i} has ${claimValue.value().length} signals, expected ${signals.length}`
      );
    }
    claimValue.value().forEach((v, j) => {
      rv[signals[j] as string] = v;
    });
  });

  // JSON fields for statements.
  // TODO:
  // Bad design: implicitly assume the order of op signals.
  // Need to refactor the code to make it more robust.
  statements.statements.forEach((stmt, i) => {
    const defSignals = genFieldDef(cred.body.tp.claims[i] as ClaimDef);
    const signals = defSignals.opPrivateSignals;
    switch (stmt.tp.tp) {
      case ClaimTypeEnum.Scalar:
        switch (stmt.tp.width) {
          case 256: {
            const { msb: lb_msb, lsb: lb_lsb } = split256((stmt as ScalarStatement).lowerBound);
            const { msb: up_msb, lsb: up_lsb } = split256((stmt as ScalarStatement).upperBound);
            if (signals.length !== 4) {
              throw new CredError(ErrorName.InternalError, `uint256 statement ${i} has ${signals.length} signals`);
            }
            rv[signals[0] as string] = lb_msb;
            rv[signals[1] as string] = lb_lsb;
            rv[signals[2] as string] = up_msb;
            rv[signals[3] as string] = up_lsb;
            break;
          }
          default: {
            if (signals.length !== 2) {
              throw new CredError(ErrorName.InternalError, `scalar statement ${i} has ${signals.length} signals`);
            }
            rv[signals[0] as string] = (stmt as ScalarStatement).lowerBound;
            rv[signals[1] as string] = (stmt as ScalarStatement).upperBound;
          }
        }
        break;
      case ClaimTypeEnum.Property: {
        const propDef = stmt.tp as PropType;
        if (signals.length !== propDef.nEqualChecks) {
          throw new CredError(
            ErrorName.InternalError,
            `property statement ${i} has ${signals.length} signals, expected ${propDef.nEqualChecks}`
          );
        }
        for (let i = 0; i < propDef.nEqualChecks; i++) {
          rv[signals[i] as string] = (stmt as PropStatement).equalsTo[i] as bigint;
        }
        break;
      }
      case ClaimTypeEnum.Boolean:
        if (signals.length !== 1) {
          throw new CredError(ErrorName.InternalError, `bool statement ${i} has ${signals.length} signals`);
        }
        rv[signals[0] as string] = BigInt((stmt as BoolStatement).reveal ? 1 : 0);
        break;
      default:
        throw new CredError(ErrorName.InvalidParameter, `unknown claim type ${stmt.tp.tp}`);
    }
  });

  return rv;
}
