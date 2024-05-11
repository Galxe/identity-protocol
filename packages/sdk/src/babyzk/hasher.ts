import { poseidon } from "@/crypto/babyzk/deps";
import { Header, Body, Credential, SignatureMetadata, HashValue } from "@/credential/credential";

/**
 * BabyZK stack's hasher, providing hash functions for hash credential.
 *
 */
export class Hasher {
  /**
   * Hash a credential.
   * @param cred The credential to be hashed.
   * @param sigMetadata The signature metadata.
   * @returns The hash value.
   */
  public hash(cred: Credential, sigMetadata: SignatureMetadata): HashValue {
    const metadataHash = this.hashMetadata(cred.header, sigMetadata);
    const bodyHash = this.hashBody(cred.body);
    return poseidon([metadataHash, bodyHash]);
  }

  /**
   * Hash a header and signature metadata.
   * @param header The header.
   * @param s The signature metadata.
   * @returns The poseidon hash value.
   */
  private hashMetadata(header: Header, s: SignatureMetadata): bigint {
    return poseidon([
      header.version,
      header.type,
      header.context,
      header.id,
      s.verificationStack,
      s.signatureID,
      s.expiredAt,
      s.identityCommitment,
    ]);
  }

  /**
   * hash the body part of a credential
   * @param body the body of the credential
   * @returns the poseidon hash of the body
   */
  private hashBody(body: Body): bigint {
    const values = body.values.map(v => v.value());
    const flatValues = ([] as bigint[]).concat(...values);
    if (flatValues.length === 0) {
      return BigInt(0);
    }
    return poseidon(flatValues);
  }
}
