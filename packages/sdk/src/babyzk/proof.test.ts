import path from "path";
import * as fs from "fs";

import { describe, expect, it } from "vitest";
import { genCircuit, genCircuitInput } from "./circuit";
import { exampleCredTestContext, exampleStatementList } from "../testutils";
import { genProof, verifyProofRaw } from "./proof";
import { convertToEvmCalldata } from "./onchain_verifier";
import { prepare } from "@/crypto/babyzk/deps";

// run prepare() before running the tests.
// @ts-expect-error WIP incorrect test ts setup, Top-level await is actually supported during tests.
await prepare();

describe("babyzk proof", () => {
  it("generates proof and the proof and be verified for non-revocable", async () => {
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
      BigInt(0), // the pseudonymous address
      credCtx.externalNullifier,
      statements
    );
    const dir = path.resolve(__dirname, "../testutils");
    const proof = await genProof(`${dir}/example.wasm`, `${dir}/example.zkey`, input);
    const publicSignalDefs = genCircuit(credCtx.cred.body.tp).publicSignalDefs;
    const publicSignalMap = proof.publicSignals.reduce((acc: { [x: string]: string }, cur: string, idx: number) => {
      acc[publicSignalDefs[idx]?.name as string] = cur;
      return acc;
    }, {} as Record<string, string>);

    expect(publicSignalMap).toEqual({
      out_id_equals_to: credCtx.expectedIDEqualsToOut.toString(),
      out_key_id: credCtx.keyID.toString(),
      out_nullifier: "849760699622323138423214777646360676343533388377892699649686780211564373610",
      out_followed: "0",
      out_status_eq0: "6",
      out_status_eq1: "8",
      out_type: "778",
      out_context: "666",
      out_external_nullifier: "499624985322695799482841591270479138186369447061",
      out_reveal_identity: "0",
      out_expiration_lb: "99",
      out_token_balance_lb_msb: "0",
      out_token_balance_lb_lsb: "50",
      out_token_balance_ub_msb: "0",
      out_token_balance_ub_lsb: "101",
      out_birthday_lb: "199",
      out_birthday_ub: "201",
    });
    const callData = convertToEvmCalldata(proof);
    expect(callData).toEqual({
      proofs: [
        proof.proof.pi_a[0],
        proof.proof.pi_a[1],
        proof.proof.pi_b[0][1],
        proof.proof.pi_b[0][0],
        proof.proof.pi_b[1][1],
        proof.proof.pi_b[1][0],
        proof.proof.pi_c[0],
        proof.proof.pi_c[1],
      ],
      publicSignals: proof.publicSignals,
    });
    const vkey = JSON.parse(fs.readFileSync(`${dir}/example.vkey.json`, "utf-8"));
    expect(await verifyProofRaw(vkey, proof)).toBe(true);
    // tamper-proof example
    proof.publicSignals[0] = BigInt(99999).toString();
    expect(await verifyProofRaw(vkey, proof)).toBe(false);
  });

  // TODO: code dup
  it("generates proof and the proof and be verified for revocable credential", async () => {
    const credCtx = exampleCredTestContext(true);
    const statements = exampleStatementList();
    const checkResult = statements.checkBody(credCtx.cred.body);
    if (!checkResult.ok) {
      throw checkResult.error;
    }
    const smt = credCtx.smt;
    if (!smt) {
      throw new Error("smt is not prepared");
    }
    await smt.add(1n);
    const unrevokedProof = await smt.generateUnrevokedProof(credCtx.sigID);
    const input = genCircuitInput(
      credCtx.cred,
      {
        identitySecret: credCtx.identitySecret,
        internalNullifier: credCtx.internalNullifier,
      },
      BigInt(0), // the pseudonymous address
      credCtx.externalNullifier,
      statements,
      unrevokedProof
    );
    const dir = path.resolve(__dirname, "../testutils");
    const proof = await genProof(`${dir}/example_revocable.wasm`, `${dir}/example_revocable.zkey`, input);
    const publicSignalDefs = genCircuit(credCtx.cred.body.tp).publicSignalDefs;
    const publicSignalMap = proof.publicSignals.reduce((acc: { [x: string]: string }, cur: string, idx: number) => {
      acc[publicSignalDefs[idx]?.name as string] = cur;
      return acc;
    }, {} as Record<string, string>);
    expect(publicSignalMap).toEqual({
      out_id_equals_to: credCtx.expectedIDEqualsToOut.toString(),
      out_key_id: credCtx.keyID.toString(),
      out_nullifier: "849760699622323138423214777646360676343533388377892699649686780211564373610",
      out_followed: "0",
      out_status_eq0: "6",
      out_status_eq1: "8",
      out_type: "778",
      out_context: "666",
      out_external_nullifier: "499624985322695799482841591270479138186369447061",
      out_reveal_identity: "0",
      out_expiration_lb: "99",
      out_token_balance_lb_msb: "0",
      out_token_balance_lb_lsb: "50",
      out_token_balance_ub_msb: "0",
      out_token_balance_ub_lsb: "101",
      out_birthday_lb: "199",
      out_birthday_ub: "201",
      out_sig_revocation_smt_root: "1243904711429961858774220647610724273798918457991486031567244100767259239747",
    });
    const callData = convertToEvmCalldata(proof);
    expect(callData).toEqual({
      proofs: [
        proof.proof.pi_a[0],
        proof.proof.pi_a[1],
        proof.proof.pi_b[0][1],
        proof.proof.pi_b[0][0],
        proof.proof.pi_b[1][1],
        proof.proof.pi_b[1][0],
        proof.proof.pi_c[0],
        proof.proof.pi_c[1],
      ],
      publicSignals: proof.publicSignals,
    });
    const vkey = JSON.parse(fs.readFileSync(`${dir}/example_revocable.vkey.json`, "utf-8"));
    expect(await verifyProofRaw(vkey, proof)).toBe(true);
    // tamper-proof example
    proof.publicSignals[0] = BigInt(99999).toString();
    expect(await verifyProofRaw(vkey, proof)).toBe(false);
  });
});
