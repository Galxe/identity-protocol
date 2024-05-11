import { babyzk } from "@/babyzk";
import { Credential, SignatureMetadata, VerificationStackEnum } from "@/credential/credential";

/**
 * An abstract class for an issuer.
 */
export abstract class Issuer {
  abstract sign(
    cred: Credential,
    signatureOptions: { sigID: bigint; expiredAt: bigint; identityCommitment: bigint }
  ): void;
}

/**
 * An issuer that uses babyzk verificatin stack to sign credentials.
 */
export class BabyzkIssuer extends Issuer {
  constructor(public signingKey: Uint8Array, public issuerID: bigint, public chainID: bigint) {
    super();
  }

  /**
   * signs a credential with the provided signature options.
   * @param cred the credential to sign
   * @param signatureOptions the signature options
   */
  public sign(cred: Credential, signatureOptions: { sigID: bigint; expiredAt: bigint; identityCommitment: bigint }) {
    cred.sign(
      babyzk,
      this.signingKey,
      new SignatureMetadata(
        VerificationStackEnum.BabyZK,
        signatureOptions.sigID,
        signatureOptions.expiredAt,
        signatureOptions.identityCommitment,
        this.issuerID,
        this.chainID,
        babyzk.toPubKey(this.signingKey)
      )
    );
  }
}
