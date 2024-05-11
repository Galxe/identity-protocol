import { describe, expect, it } from "vitest";
import { SMT } from "./smt";

describe("smt", () => {
  it("a smt tree of height 16, 1, 2, 3 revoked", async () => {
    const tree = new SMT(16);
    await tree.add(1n);
    await tree.add(2n);
    await tree.add(3n);
    // cannot generate proof for revoked signature
    expect(async () => await tree.generateUnrevokedProof(1n)).rejects.toThrowError("Signature 1 is revoked");

    const proof = await tree.generateUnrevokedProof(4n);
    expect(proof.toJSON()).toEqual({
      fnc: 1,
      isOld0: false,
      key: "4",
      oldKey: "2",
      oldValue: "1",
      root: "163251207993126138516945274618764134387528494008891779053836461365324174406",
      siblings: [
        "8057104605261804259556064630191715588213644061456435728232846348655702084405",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0",
      ],
      value: "1",
    });
    expect(proof.toCircomInput()).toEqual({
      sig_revocation_smt_root: 163251207993126138516945274618764134387528494008891779053836461365324174406n,
      sig_revocation_smt_old_key: 2n,
      sig_revocation_smt_old_value: 1n,
      sig_revocation_smt_is_old0: 0n,
      sig_revocation_smt_value: 1n,
      sig_revocation_smt_siblings: [
        8057104605261804259556064630191715588213644061456435728232846348655702084405n,
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
    });
  });

  // we should be able to optimize out some private inputs: the value
  // and oldValue, because they are always 1 in signature revocation tree.
  // but we don't do that yet.
  it("a smt tree of height 8, value is always 1", async () => {
    const tree = new SMT(8);
    await tree.add(128n);

    for (let i = 0; i < 100; i++) {
      const proof = await tree.generateUnrevokedProof(BigInt(i));
      expect(proof.value).toEqual(1n);
      expect(proof.oldValue).toEqual(1n);
    }
  });
});
