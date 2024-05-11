import * as credType from "@/credential/credType";
import { babyzk } from "@/babyzk";
import { Credential, Header, Body, SignatureMetadata, VerificationStackEnum } from "@/credential/credential";
import { ScalarValue, BoolValue, PropValue } from "@/credential/claimValue";
import { PropType, ScalarType, BoolType, PropHashEnum } from "@/credential/claimType";
import { ScalarStatement, PropStatement, BoolStatement, StatementList } from "@/credential/statement";
import { unwrap } from "@/errors";
import { decodeFromHex, computeExternalNullifier } from "@/utils";
import {  poseidon } from "@/crypto/babyzk/deps";
import { ethers } from "ethers";
import { SMT } from "@/crypto/smt";
import ganache from "ganache";

// prepare babyzk
//@ts-expect-error WIP incorrect test ts setup, Top-level await is actually supported during tests.
await babyzk.prepare();

export const exampleCredTypeStr = "token_balance:uint<256>;birthday:uint<64>;status:prop<8,c,2>;followed:bool;";
export const exampleRevocableCredTypeStr =
  "@revocable(16);token_balance:uint<256>;birthday:uint<64>;status:prop<8,c,2>;followed:bool;";
const expiration = BigInt(100);
const userID = BigInt(9);
const issuerID = BigInt(456);
const sigID = BigInt(999);
const signerSk = decodeFromHex("0xfd60ceb442aca7f74d2e56c1f0e93507798e8a6e02c4cd1a5585a36167fa7b03");
const signerPk = babyzk.toPubKey(signerSk);
const keyID = babyzk.toKeyID(signerPk);
const identitySecret = BigInt(456);
const internalNullifier = BigInt(123);
const identityCommitment = poseidon([identitySecret, internalNullifier]);
const externalNullifier = computeExternalNullifier("example cred verification");

export interface CredTestContext {
  cred: Credential;
  signerSk: Uint8Array;
  signerPublicKey: Uint8Array;
  sigID: bigint;
  keyID: bigint;
  identityCommitment: bigint;
  identitySecret: bigint;
  internalNullifier: bigint;
  externalNullifier: bigint;
  issuerID: bigint;
  expiration: bigint;
  expectedIDEqualsToOut: bigint;
  smt?: SMT;
}

export function exampleUnsignedCred(revocable = false) {
  const tpStr = revocable ? exampleRevocableCredTypeStr : exampleCredTypeStr;
  const tp = unwrap(credType.parseCredType(tpStr));
  const typeID = BigInt(778);
  tp.typeID = typeID;
  const contextID = BigInt(666);
  const header = new Header(BigInt(1), typeID, contextID, userID);
  const claimValues = [
    new ScalarValue(tp.claims[0]?.type as ScalarType, BigInt(100)),
    new ScalarValue(tp.claims[1]?.type as ScalarType, BigInt(200)),
    new PropValue(tp.claims[2]?.type as PropType, "middle-class", BigInt(2)),
    new BoolValue(true),
  ];
  const body = new Body(tp, claimValues);
  const cred = new Credential(header, body);
  return cred;
}

export function exampleStatementList() {
  return new StatementList(expiration - 1n, userID, [
    new ScalarStatement(new ScalarType(256), 50n, 101n),
    new ScalarStatement(new ScalarType(64), 199n, 201n),
    new PropStatement(new PropType(8, PropHashEnum.Custom, 2), [3n, 4n]),
    new BoolStatement(new BoolType(), true),
  ]);
}

export function exampleSignedCred(revocable = false) {
  const cred = exampleUnsignedCred(revocable);
  const sigMetadata = new SignatureMetadata(
    VerificationStackEnum.BabyZK,
    sigID,
    expiration,
    identityCommitment,
    issuerID,
    BigInt(0),
    signerPk
  );
  cred.sign(babyzk, signerSk, sigMetadata);
  return cred;
}

export function exampleCredTestContext(revocable = false): CredTestContext {
  const cred = exampleSignedCred(revocable);
  return {
    cred,
    signerSk,
    sigID,
    signerPublicKey: signerPk,
    keyID,
    identityCommitment,
    identitySecret,
    internalNullifier,
    externalNullifier,
    issuerID,
    expiration,
    expectedIDEqualsToOut: 9n * 2n + 1n,
    smt: revocable ? new SMT(16) : undefined,
  };
}

export async function etherProvider() {
  // const provider = new ethers.providers.Web3Provider(ganache.provider());
  const provider = new ethers.BrowserProvider(ganache.provider({ miner: { blockTime: 0 } }));
  const accounts = await provider.listAccounts();

  return {
    provider,
    accounts,
  };
}
