import { Proof, InMemoryDB, Merkletree, Hash, verifyProof, str2Bytes, ITreeStorage } from "@iden3/js-merkletree";
import { ErrorName, CredError } from "@/errors";

export interface UnrevokedProofCircomInput {
  sig_revocation_smt_root: bigint;
  sig_revocation_smt_old_key: bigint;
  sig_revocation_smt_old_value: bigint;
  sig_revocation_smt_is_old0: bigint;
  sig_revocation_smt_value: bigint;
  sig_revocation_smt_siblings: bigint[];
}

/**
 * SMTProof represents a proof of a signature in the SMT.
 *
 * Known issues:
 * 1. This proof is supposed to be a generic SMT proof, but it is currently coupled with
 * the circuit implementation in circom. Although we should be replicate the smt proof
 * verification logic in other proof systems other than circom, but this is not done yet.
 * 2. We should be able to optimize out some private inputs: values.
 */
export class SMTProof {
  root: bigint;
  oldKey: bigint;
  oldValue: bigint;
  isOld0: boolean;
  key: bigint;
  value: bigint;
  fnc: number;
  siblings: bigint[];
  _raw?: Proof;

  constructor(
    root: bigint,
    oldKey: bigint,
    oldValue: bigint,
    isOld0: boolean,
    key: bigint,
    value: bigint,
    fnc: number,
    siblings: bigint[],
    rawProof?: Proof
  ) {
    this.root = root;
    this.oldKey = oldKey;
    this.oldValue = oldValue;
    this.isOld0 = isOld0;
    this.key = key;
    this.value = value;
    this.fnc = fnc;
    this.siblings = siblings;
    this._raw = rawProof;
  }

  public toJSON() {
    return {
      root: this.root.toString(),
      oldKey: this.oldKey.toString(),
      oldValue: this.oldValue.toString(),
      isOld0: this.isOld0,
      key: this.key.toString(),
      value: this.value.toString(),
      fnc: this.fnc,
      siblings: this.siblings.map(s => s.toString()),
    };
  }

  public toCircomInput(): UnrevokedProofCircomInput {
    return {
      sig_revocation_smt_root: this.root,
      sig_revocation_smt_old_key: this.oldKey,
      sig_revocation_smt_old_value: this.oldValue,
      sig_revocation_smt_is_old0: this.isOld0 ? 1n : 0n,
      sig_revocation_smt_value: this.value,
      sig_revocation_smt_siblings: this.siblings,
    };
  }

  static fromJSON(obj: {
    root: bigint | string;
    oldKey: bigint | string;
    oldValue: bigint | string;
    isOld0: boolean;
    key: bigint | string;
    value: bigint | string;
    fnc: number;
    siblings: string[];
  }): SMTProof {
    return new SMTProof(
      BigInt(obj.root),
      BigInt(obj.oldKey),
      BigInt(obj.oldValue),
      obj.isOld0,
      BigInt(obj.key),
      BigInt(obj.value),
      obj.fnc,
      obj.siblings.map((s: string) => BigInt(s))
    );
  }
}

/**
 * SMT is a sparse merkle tree that stores the revocation status of signatures.
 * It is used to revoke signatures in a credential.
 * When a signature is revoked, the corresponding leaf in the SMT is set to 1.
 */
export class SMT {
  private mt: Merkletree;

  constructor(maxLevel: number, store: ITreeStorage | null = null) {
    if (store == null) {
      store = new InMemoryDB(str2Bytes(""));
    }
    this.mt = new Merkletree(store, true, maxLevel);
  }

  get height(): number {
    return this.mt.maxLevels;
  }

  async add(signatureID: bigint) {
    if (signatureID < 1n || signatureID > BigInt(1) << BigInt(this.height)) {
      throw new CredError(ErrorName.InvalidSignatureID, `Invalid signature ID: ${signatureID}`);
    }
    await this.mt.add(signatureID, BigInt(1));
  }

  async delete(signatureID: bigint) {
    await this.mt.delete(signatureID);
  }

  async root(): Promise<bigint> {
    return (await this.mt.root()).bigInt();
  }

  async generateUnrevokedProof(signatureID: bigint): Promise<SMTProof> {
    const v = await this.mt.generateCircomVerifierProof(signatureID, await this.mt.root());
    if (v.fnc != 1) {
      throw new CredError(ErrorName.SignatureRevoked, `Signature ${signatureID} is revoked`);
    }
    return new SMTProof(
      v.root.bigInt(),
      v.oldKey.bigInt(),
      v.oldValue.bigInt(),
      v.isOld0,
      v.key.bigInt(),
      v.value.bigInt(),
      v.fnc,
      v.siblings.map(s => s.bigInt())
    );
  }

  async verifiyProof(proof: SMTProof): Promise<boolean> {
    if (!proof._raw) {
      throw new CredError(ErrorName.Unimplemented, "Verify circom proof is not supported yet");
    }
    return await verifyProof(Hash.fromBigInt(proof.root), proof._raw, proof.key, proof.value);
  }
}
