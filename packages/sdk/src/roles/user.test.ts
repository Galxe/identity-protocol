import fs from "fs";
import path from "path";

import { describe, expect, it } from "vitest";
import { prepare, isPrepared } from "@/crypto/babyzk/deps";
import { poseidonBigInts } from "@/crypto/hash";
import * as credType from "@/credential/credType";
import * as credential from "@/credential/credential";
import * as claimType from "@/credential/claimType";
import { unit, scalar, scalar256, boolean, property } from "@/credential/primitiveTypes";
import { unwrap } from "@/errors";
import * as utils from "@/utils";
import { decodeFromHex } from "@/utils";
import { TypeSpec } from "@/credential/credTypeUtils";

import { babyzk } from "@/babyzk";

import { User } from "./user";
import { BabyzkIssuer } from "./issuer";
import * as statement from "@/credential/statement";

const skStr = "0xfd60ceb442aca7f74d2e56c1f0e93507798e8a6e02c4cd1a5585a36167fa7b03";

// @ts-expect-error WIP incorrect test ts setup, Top-level await is actually supported during tests.
await prepare();

// TODO: move issuer to a separate test file
describe("user and issuer class", () => {
  it("can add identity slice", async () => {
    expect(isPrepared()).toBe(true);
    const u = new User();
    const evmIdSlice = u.createNewIdentitySlice("evm");
    const userIdc = User.computeIdentityCommitment(evmIdSlice);
    expect(u.getIdentitySliceByIdc(userIdc)).toEqual(evmIdSlice);
  });

  it("user and issuer class can generate proof", async () => {
    const artifactsDir = path.resolve(__dirname, "../testutils/artifacts");
    const cases: {
      spec: TypeSpec;
      body: credential.MarshaledBody;
      statements: statement.Statement[];
      artifacts: { wasmUri: string; zKeyUri: string; vkey: string };
    }[] = [
      {
        spec: unit,
        body: {},
        statements: [],
        artifacts: {
          wasmUri: `${artifactsDir}/unit/circom.wasm`,
          zKeyUri: `${artifactsDir}/unit/circuit_final.zkey`,
          vkey: `${artifactsDir}/unit/circuit.vkey.json`,
        },
      },
      {
        spec: scalar,
        body: { val: "111" },
        statements: [new statement.ScalarStatement(new claimType.ScalarType(248), 100n, 5000n)],
        artifacts: {
          wasmUri: `${artifactsDir}/scalar/circom.wasm`,
          zKeyUri: `${artifactsDir}/scalar/circuit_final.zkey`,
          vkey: `${artifactsDir}/scalar/circuit.vkey.json`,
        },
      },
      {
        spec: scalar256,
        body: { val: "222" },
        statements: [new statement.ScalarStatement(new claimType.ScalarType(256), 200n, 5000n)],
        artifacts: {
          wasmUri: `${artifactsDir}/scalar256/circom.wasm`,
          zKeyUri: `${artifactsDir}/scalar256/circuit_final.zkey`,
          vkey: `${artifactsDir}/scalar256/circuit.vkey.json`,
        },
      },
      {
        spec: boolean,
        body: { val: "1" },
        statements: [new statement.BoolStatement(new claimType.BoolType(), true)],
        artifacts: {
          wasmUri: `${artifactsDir}/boolean/circom.wasm`,
          zKeyUri: `${artifactsDir}/boolean/circuit_final.zkey`,
          vkey: `${artifactsDir}/boolean/circuit.vkey.json`,
        },
      },
      {
        spec: property,
        body: { val: { str: "hahahah", value: "777" } },
        statements: [
          new statement.PropStatement(new claimType.PropType(248, claimType.PropHashEnum.Custom, 1), [777n]),
        ],
        artifacts: {
          wasmUri: `${artifactsDir}/property/circom.wasm`,
          zKeyUri: `${artifactsDir}/property/circuit_final.zkey`,
          vkey: `${artifactsDir}/property/circuit.vkey.json`,
        },
      },
    ];
    const u = new User();
    const evmIdSlice = u.createNewIdentitySlice("evm");
    const userIdc = User.computeIdentityCommitment(evmIdSlice);
    for (const tc of cases) {
      const tp = unwrap(credType.createTypeFromSpec(tc.spec));
      const cred = unwrap(
        credential.Credential.create(
          {
            type: tp,
            contextID: 11n,
            userID: 22n,
          },
          tc.body
        )
      );
      const pk = decodeFromHex(skStr);
      const myIssuer = new BabyzkIssuer(pk, 1n, 1n);
      myIssuer.sign(cred, {
        sigID: BigInt(100),
        expiredAt: BigInt(Math.ceil(new Date().getTime() / 1000) + 7 * 24 * 60 * 60), // assuming the credential will be expired after 7 days
        identityCommitment: userIdc,
      });
      expect(cred.isSigned()).toBe(true);

      // proof generation
      const externalNullifier = utils.computeExternalNullifier("test nullifier");
      const proofGenGadgets = await User.loadProofGenGadgetsFromFile(tc.artifacts.wasmUri, tc.artifacts.zKeyUri);
      // Finally, let's generate the proof.
      const proof = await u.genBabyzkProof(
        userIdc,
        cred,
        // proof generation options
        {
          expiratedAtLowerBound: BigInt(Math.ceil(new Date().getTime() / 1000) + 3 * 24 * 60 * 60),
          externalNullifier: externalNullifier,
          equalCheckId: BigInt(0),
          pseudonym: BigInt("0xdeadbeef"),
        },
        proofGenGadgets,
        tc.statements
      );
      // proof matches the verification key
      const vkey = JSON.parse(fs.readFileSync(tc.artifacts.vkey, "utf-8"));
      const proofOk = await babyzk.verifyProofRaw(vkey, proof);
      expect(proofOk).toBe(true);
    }
  });

  it("generated proof has correct public signals", async () => {
    const artifactsDir = path.resolve(__dirname, "../testutils/artifacts");
    const u = new User();
    const evmIdSlice = u.createNewIdentitySlice("evm");
    const userIdc = User.computeIdentityCommitment(evmIdSlice);
    const tp = unwrap(credType.createTypeFromSpec(unit));
    const contextId = 11n;
    const userId = 22n;
    const expiredAtLowerBound = "1";
    const externalNullifier = "2";
    const equalCheckId = "3";
    const pseudonym = "4";
    const cred = unwrap(
      credential.Credential.create(
        {
          type: tp,
          contextID: contextId,
          userID: userId,
        },
        {}
      )
    );
    const pk = decodeFromHex(skStr);
    const myIssuer = new BabyzkIssuer(pk, 1n, 1n);
    myIssuer.sign(cred, {
      sigID: BigInt(100),
      expiredAt: BigInt(1715899510),
      identityCommitment: userIdc,
    });
    expect(cred.isSigned()).toBe(true);

    // proof generation
    const proofGenGadgets = await User.loadProofGenGadgetsFromFile(
      `${artifactsDir}/unit/circom.wasm`,
      `${artifactsDir}/unit/circuit_final.zkey`
    );
    // Finally, let's generate the proof.
    const proof = await u.genBabyzkProof(
      userIdc,
      cred,
      {
        expiratedAtLowerBound: BigInt(expiredAtLowerBound),
        externalNullifier: BigInt(externalNullifier),
        equalCheckId: BigInt(equalCheckId),
        pseudonym: BigInt(pseudonym),
      },
      proofGenGadgets,
      []
    );
    // proof matches the verification key
    const vkey = JSON.parse(fs.readFileSync(`${artifactsDir}/unit/circuit.vkey.json`, "utf-8"));
    const proofOk = await babyzk.verifyProofRaw(vkey, proof);
    expect(proofOk).toBe(true);

    // calculate out_id_equals_to (prop<248, c, 1>). Since the least significant bit designates equality,
    // we need to shift the value by 1 bit to the left.
    const idEqualsTo = BigInt(equalCheckId) << 1n;

    expect(proof.publicSignals).toStrictEqual([
      // Type
      tp.typeID.toString(),
      // Context
      contextId.toString(),
      // Nullifier
      poseidonBigInts([evmIdSlice.internalNullifier, BigInt(externalNullifier)]).toString(),
      // ExternalNullifier
      externalNullifier,
      // RevealIdentity
      pseudonym,
      // ExpirationLb
      expiredAtLowerBound,
      // KeyId
      "1743582416365651167392966598529843347617363862106697818328310770809664607117",
      // IdEqualsTo
      idEqualsTo.toString(),
    ]);
  });
});
