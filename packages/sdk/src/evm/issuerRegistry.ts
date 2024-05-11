import { BigNumberish, BytesLike, Overrides } from "ethers";
import {
  IssuerRegistry as IssuerRegistryContract,
  IssuerRegistry__factory,
} from "@galxe-identity-protocol/evm-contracts";
import { Base, Options, Transaction } from "@/evm/base";

// SignatureStateStruct represents the signature state struct from Solidity in TypeScript.
export interface SignatureStateStruct {
  root: BytesLike;
  treeURI: string;
}

// Enum for the status of a public key.
export enum PublicKeyStatus {
  UNINITIALIZED,
  REVOKED,
  ACTIVE,
}

// Represents the issuer struct from Solidity in TypeScript.
export interface Issuer {
  // The name of the issuer.
  name: string;
  // The admin of the issuer, who can add or revoke public keys.
  // In Solidity, `address` is used for Ethereum addresses. In TypeScript, these can be represented as strings.
  admin: string;
}

/**
 * IssuerRegistry is a contract that manages issuers, their public keys, and signature states.
 */
export class IssuerRegistry extends Base<IssuerRegistryContract> {
  constructor(address: string, options?: Options) {
    const { signerOrProvider } = options || {};
    const factory = new IssuerRegistry__factory();
    const contract = factory.attach(address) as IssuerRegistryContract;
    super(contract, signerOrProvider);
  }

  /**
   * registerIssuer registers a new issuer
   * @notice the issuerId is the address of the caller, so 1 address can only have 1 issuer.
   * @param name name of the issuer
   * @param verificationStackId id of the verification stack
   * @param publicKeyId public key id
   * @param publicKeyRaw raw public key
   * @param overrides overrides options
   * @returns promise of the transaction
   */
  public async registerIssuer(
    name: string,
    verificationStackId: BigNumberish,
    publicKeyId: BigNumberish,
    publicKeyRaw: BytesLike,
    overrides?: Overrides
  ): Promise<Transaction<bigint>> {
    const tx = await this.contract.registerIssuer(
      name,
      verificationStackId,
      publicKeyId,
      publicKeyRaw,
      overrides ?? {}
    );
    return new Transaction(tx, async () => BigInt(tx.from));
  }

  /**
   * transferIssuerAdmin transfers the ownership of an issuer
   * @param issuerId id of the issuer
   * @param newOwner the address of the new owner
   * @param overrides optional overrides
   * @returns promise of the transaction
   */
  public async transferIssuerAdmin(
    issuerId: BigNumberish,
    newOwner: string,
    overrides?: Overrides
  ): Promise<Transaction<void>> {
    const tx = await this.contract.transferIssuerAdmin(issuerId, newOwner, overrides ?? {});
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * addPublicKey adds a new public key to an issuer. Only the issuer can add a public key.
   * @param issuerId id of the issuer
   * @param verificationStackId verification stack id
   * @param publicKeyId public key id
   * @param publicKeyRaw public key raw bytes
   * @param overrides optional overrides
   * @returns promise of the transaction
   */
  public async addPublicKey(
    issuerId: BigNumberish,
    verificationStackId: BigNumberish,
    publicKeyId: BigNumberish,
    publicKeyRaw: BytesLike,
    overrides?: Overrides
  ): Promise<Transaction<void>> {
    const tx = await this.contract.addPublicKey(
      issuerId,
      verificationStackId,
      publicKeyId,
      publicKeyRaw,
      overrides ?? {}
    );
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * updatePublicKeyStatus updates the status of a public key
   * @param issuerId the id of the issuer
   * @param publicKeyId public key id
   * @param status the enum status of the public key
   * @param overrides the optional overrides
   * @returns promise of the transaction
   */
  public async updatePublicKeyStatus(
    issuerId: BigNumberish,
    publicKeyId: BigNumberish,
    status: PublicKeyStatus,
    overrides?: Overrides
  ): Promise<Transaction<void>> {
    const tx = await this.contract.updatePublicKeyStatus(issuerId, publicKeyId, status, overrides ?? {});
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * updatePublicKeyVerificationStack updates the verification stack of a public key
   * @param issuerId the id of the issuer
   * @param publicKeyId public key id
   * @param verificationStackId the id of the verification stack
   * @param enabled whether the verification stack is enabled or not
   * @param overrides the optional overrides
   * @returns promise of the transaction
   */
  public async updatePublicKeyVerificationStack(
    issuerId: BigNumberish,
    publicKeyId: BigNumberish,
    verificationStackId: BigNumberish,
    enabled: boolean,
    overrides?: Overrides
  ): Promise<Transaction<void>> {
    const tx = await this.contract.updatePublicKeyVerificationStack(
      issuerId,
      publicKeyId,
      verificationStackId,
      enabled,
      overrides ?? {}
    );
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * updateSignatureStateURI updates the URI of a signature state
   * @param typeId the id of the type
   * @param contextId the id of the context
   * @param issuerId the id of the issuer
   * @param treeURI the new URI of the signature state
   * @param overrides the optional overrides
   * @returns promise of the transaction
   */
  public async updateSignatureStateURI(
    typeId: BigNumberish,
    contextId: BigNumberish,
    issuerId: BigNumberish,
    treeURI: string,
    overrides?: Overrides
  ): Promise<Transaction<void>> {
    const tx = await this.contract.updateSignatureStateURI(typeId, contextId, issuerId, treeURI, overrides ?? {});
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * updateSignatureState updates the root of a signature state
   * @param typeId the id of the type
   * @param contextId the id of the context
   * @param issuerId the id of the issuer
   * @param root the new root of the signature state
   * @param overrides the optional overrides
   * @returns promise of the transaction
   */
  public async updateSignatureState(
    typeId: BigNumberish,
    contextId: BigNumberish,
    issuerId: BigNumberish,
    root: BytesLike,
    overrides?: Overrides
  ): Promise<Transaction<void>> {
    const tx = await this.contract.updateSignatureState(typeId, contextId, issuerId, root, overrides ?? {});
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * setSignatureState sets the URI and root of a signature state
   * @param typeId the id of the type
   * @param contextId the id of the context
   * @param issuerId the id of the issuer
   * @param treeURI the URI of the signature state
   * @param root the root of the signature state
   * @param overrides the optional overrides
   * @returns promise of the transaction
   */
  public async setSignatureState(
    typeId: BigNumberish,
    contextId: BigNumberish,
    issuerId: BigNumberish,
    treeURI: string,
    root: BytesLike,
    overrides?: Overrides
  ): Promise<Transaction<void>> {
    const tx = await this.contract.setSignatureState(typeId, contextId, issuerId, treeURI, root, overrides ?? {});
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * getIssuer retrieves the issuer information by issuer ID
   * @param issuerId the id of the issuer
   * @returns promise of the issuer information
   */
  public async getIssuer(issuerId: BigNumberish): Promise<Issuer> {
    return await this.contract.getIssuer(issuerId);
  }

  /**
   * getPublicKeyRaw retrieves the raw public key by issuer ID and public key ID
   * @param issuerId the id of the issuer
   * @param publicKeyId the id of the public key
   * @returns promise of the raw public key
   */
  public async getPublicKeyRaw(issuerId: BigNumberish, publicKeyId: BigNumberish): Promise<string> {
    return await this.contract.getPublicKeyRaw(issuerId, publicKeyId);
  }

  /**
   * isPublicKeyActive checks if a public key is active by issuer ID and public key ID
   * @param issuerId the id of the issuer
   * @param publicKeyId the id of the public key
   * @returns promise of the boolean indicating if the public key is active
   */
  public async isPublicKeyActive(issuerId: BigNumberish, publicKeyId: BigNumberish): Promise<boolean> {
    return await this.contract.isPublicKeyActive(issuerId, publicKeyId);
  }

  /**
   * isPublicKeyActiveForStack checks if a public key is active for a specific verification stack by issuer ID, public key ID, and verification stack ID
   * @param issuerId the id of the issuer
   * @param publicKeyId the id of the public key
   * @param verificationStackId the id of the verification stack
   * @returns promise of the boolean indicating if the public key is active for the verification stack
   */
  public async isPublicKeyActiveForStack(
    issuerId: BigNumberish,
    publicKeyId: BigNumberish,
    verificationStackId: BigNumberish
  ): Promise<boolean> {
    return await this.contract.isPublicKeyActiveForStack(issuerId, publicKeyId, verificationStackId);
  }

  /**
   * getSignatureState returns the status of the public key
   * @param typeId the id of the type
   * @param contextId the id of the context
   * @param issuerId the id of the issuer
   * @returns promise of the status of the public key
   */
  public async getSignatureState(
    typeId: BigNumberish,
    contextId: BigNumberish,
    issuerId: BigNumberish
  ): Promise<SignatureStateStruct> {
    return await this.contract.getSignatureState(typeId, contextId, issuerId);
  }

  /**
   * getSignatureStateURI retrieves the URI of a signature state by type ID, context ID, and issuer ID
   * @param typeId the id of the type
   * @param contextId the id of the context
   * @param issuerId the id of the issuer
   * @returns promise of the URI of the signature state
   */
  public async getSignatureStateURI(
    typeId: BigNumberish,
    contextId: BigNumberish,
    issuerId: BigNumberish
  ): Promise<string> {
    return await this.contract.getSignatureStateURI(typeId, contextId, issuerId);
  }

  /**
   * getSignatureStateRoot retrieves the root of a signature state by type ID, context ID, and issuer ID
   * @param typeId the id of the type
   * @param contextId the id of the context
   * @param issuerId the id of the issuer
   * @returns promise of the root of the signature state
   */
  public async getSignatureStateRoot(
    typeId: BigNumberish,
    contextId: BigNumberish,
    issuerId: BigNumberish
  ): Promise<string> {
    return await this.contract.getSignatureStateRoot(typeId, contextId, issuerId);
  }
}
