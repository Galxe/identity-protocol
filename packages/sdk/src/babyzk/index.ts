import { VerificationStack, RawPublicKey } from "@/credential/credential";
import { eddsa, newEdDSAPrivateKey, poseidon, prepare } from "@/crypto/babyzk/deps";

import type { PrivKey, PubKey, Signature, Point, VKey, WholeProof } from "./types";
import { genCircuit, genCircuitInput } from "./circuit";
import { genVerifierSolidity, defaultPublicSignalGetter } from "./onchain_verifier";
import { Hasher } from "./hasher";
import { Signer, Verifier } from "./signer";
import { genIdentityCommitment } from "./identity";
import { genProof, verifyProofRaw } from "./proof";
import { pubKeySerde } from "./serde";

// re-export
export type { PrivKey, PubKey, Signature, Point, VKey, WholeProof };

/**
 * BabyZK verification stack.
 * The initial zero-knowledge verification stack we have integrated is named "BabyZK". This stack employs the subsequent algorithms and parameters:
 *
 * - **Curve**: BN254. All the following algorithms are using this curve.
 * - **Hash**: Poseidon.
 * - **Digest:** The digest is derived from the Poseidon hash of `poseidon(header, signature metadata)` and `poseidon(body)`.
 *   Initially, the header and signature metadata are cohesively hashed, according to the canonical sequence of header
 *   fields followed by signature metadata fields. Subsequently, the fields within the body are hashed in the type definition order.
 *   Finally we take the Poseidon hash of the two hash values.
 * - **Signature**:  EdDSA Poseidon
 * - **Identity commitment schema:** a 2-input poseidon hash of BN254 curve of two fields: `identity secret`   and `internal nullifier` , in this specified order.
 * - **Circuit language**: Circom
 * - **Proof system**: Groth16, powered by SnarkJS
 * - **Limits**: The total number of signals of fields in the body must be less than 256.
 *   For body types encompassing more than 16 signals—such as 9 `uint256` fields or 20 `bool`—the fields are segmented into groups of 16 and individually hashed.
 *   The final step is hashing results from these group hashes. This approach is necessitated by Poseidon's constraint of 16 signals.
 *   Given the further restriction that there can't exceed 256 fields, this hashing methodology can be implemented through a two-layer hashing structure.
 */
export const babyzk: VerificationStack<PrivKey, WholeProof, VKey> = {
  // prepare (build) this proof stack
  prepare,

  // identity commitment related
  genIdentityCommitment,

  // private key related
  genRandomPrivateKey: (): PrivKey => {
    return newEdDSAPrivateKey();
  },
  toPubKey: (sk: PrivKey): RawPublicKey => pubKeySerde.serialize(eddsa.prv2pub(sk)),
  toKeyID: (rawPk: RawPublicKey): bigint => {
    const pk: PubKey = pubKeySerde.deserialize(rawPk);
    return poseidon([pk[0], pk[1]]);
  },
  createSigner: (sk: PrivKey) => new Signer(sk),

  // hash and signature related
  getHasher: () => new Hasher(),
  getVerifier: () => new Verifier(),

  // circuit related
  genCircuit,
  genCircuitInput,

  // proof related
  genProof,
  verifyProofRaw,

  // contract related
  genOnChainVerifierCode: genVerifierSolidity,
  defaultPublicSignalGetter,
};
