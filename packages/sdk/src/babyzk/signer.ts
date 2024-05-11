import { EdDSAPrivKey, eddsa } from "@/crypto/babyzk/deps";
import { HashValue, RawPublicKey, RawSignature } from "@/credential/credential";
import { pubKeySerde } from "./serde";

/**
 * A signer for EdDSA Poseidon.
 */
export class Signer {
  /**
   * Creates a signer.
   * @param sk The private key.
   * @returns A signer.
   */
  constructor(private sk: EdDSAPrivKey) {
    this.sk = sk;
  }

  /**
   * Signs a hash value.
   */
  public sign(hash: HashValue): RawSignature {
    if (typeof hash !== "bigint") {
      throw new Error("For babyzk, hash must be a bigint");
    }
    return eddsa.packSignature(eddsa.signPoseidon(this.sk, hash as bigint));
  }
}

/**
 * A verifier for EdDSA Poseidon.
 */
export class Verifier {
  /**
   * Verifies a signature.
   * @param hash The hash value.
   * @param sigRaw The packed signature format.
   * @param pubKey The public key.
   * @returns True if the signature is valid.
   */
  public verify(hash: bigint, sigRaw: RawSignature, pubKey: RawPublicKey): boolean {
    const sig = eddsa.unpackSignature(sigRaw);
    const pk = pubKeySerde.deserialize(pubKey);
    return eddsa.verifyPoseidon(hash, sig, pk);
  }
}
