import { AddressLike, Overrides, BigNumberish } from "ethers";
import { TypeRegistry as TypeRegistryContract, TypeRegistry__factory } from "@galxe-identity-protocol/evm-contracts";
import { Base, Options, Transaction } from "@/evm/base";
import { ProofVerifier } from "@/evm/proofVerifier";
import { PublicSignalGetter } from "@/evm/publicSignalGetter";

import { computeTypeID } from "@/credential/credType";

// Credential type struct from Solidity in TypeScript.
export interface CredentialType {
  revocable: boolean;
  admin: string;
  name: string;
  definition: string;
  description: string;
  resourceURI: string;
}

export interface CredentialTypeMiscConfig {
  revocable: boolean;
  verificationStackId: BigNumberish;
  verifier: AddressLike; // Address of the verifier contract.
  publicSignalGetter: AddressLike; // Address of the public signal getter contract.
}

/**
 * TypeRegistry manages credential types, their registration, and associated verification stacks.
 */
export class TypeRegistry extends Base<TypeRegistryContract> {
  constructor(address: string, options?: Options) {
    const { signerOrProvider } = options || {};
    const factory = new TypeRegistry__factory();
    const contract = factory.attach(address) as TypeRegistryContract;
    super(contract, signerOrProvider);
  }

  /**
   * transfers ownership of a type to a new owner.
   * @param typeId id of the type
   * @param newOwner the new owner
   * @param overrides Transactio overrides
   * @returns void
   */
  public async transferTypeAdmin(
    typeId: BigNumberish,
    newOwner: AddressLike,
    overrides?: Overrides
  ): Promise<Transaction<void>> {
    const tx = await this.contract.transferTypeAdmin(typeId, newOwner, overrides ?? {});
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * Registers a primitive type with the registry.
   * @param typeId Unique identifier for the type.
   * @param name Name of the type.
   * @param definition Immutable definition string of the type.
   * @param description Description of the type.
   * @param resourceURI URI for resources related to the type.
   * @param config Miscellaneous configuration for the type.
   * @param overrides Transaction overrides.
   */
  public async setPrimitiveType(
    typeId: BigNumberish,
    name: string,
    definition: string,
    description: string,
    resourceURI: string,
    config: CredentialTypeMiscConfig,
    overrides?: Overrides
  ): Promise<Transaction<void>> {
    const tx = await this.contract.setPrimitiveType(
      typeId,
      name,
      definition,
      description,
      resourceURI,
      {
        revocable: config.revocable,
        verificationStackId: config.verificationStackId,
        verifier: config.verifier,
        publicSignalGetter: config.publicSignalGetter,
      },
      overrides ?? {}
    );
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * Registers a new type with an optional verifier and public signal getter.
   * @param revocable Indicates if the type is revocable.
   * @param name Name of the type.
   * @param definition Definition string of the type.
   * @param description Description of the type.
   * @param resourceURI Resource URI of the type.
   * @param verificationStackId Optional ID of the verification stack.
   * @param verifier Optional verifier for the type.
   * @param publicSignalGetter Optional public signal getter for the type.
   * @param overrides Transaction overrides.
   */
  public async registerType1Step(
    revocable: boolean,
    name: string,
    definition: string,
    description: string,
    resourceURI: string,
    verificationStackId: BigNumberish,
    verifier: AddressLike,
    publicSignalGetter: AddressLike,
    overrides?: Overrides
  ): Promise<Transaction<bigint>> {
    const tx = await this.contract.registerType1Step(
      revocable,
      name,
      definition,
      description,
      resourceURI,
      verificationStackId,
      verifier,
      publicSignalGetter,
      overrides ?? {}
    );
    return new Transaction(tx, async () => computeTypeID(tx.from, name));
  }

  /**
   * Updates the resource URI of a type.
   * @param typeId Unique identifier of the type.
   * @param uri New resource URI.
   * @param overrides Transaction overrides.
   */
  public async updateTypeResourceURI(
    typeId: BigNumberish,
    uri: string,
    overrides?: Overrides
  ): Promise<Transaction<void>> {
    const tx = await this.contract.updateTypeResourceURI(typeId, uri, overrides ?? {});
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * Updates the verifier for a type and verification stack.
   * @param typeId Unique identifier of the type.
   * @param verificationStackId ID of the verification stack.
   * @param verifier Address of the new verifier contract.
   * @param overrides Transaction overrides.
   */
  public async updateTypeVerifier(
    typeId: BigNumberish,
    verificationStackId: BigNumberish,
    verifier: AddressLike,
    overrides?: Overrides
  ): Promise<Transaction<void>> {
    const tx = await this.contract.updateTypeVerifier(typeId, verificationStackId, verifier, overrides ?? {});
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * Updates the public signal getter for a type and verification stack.
   * @param typeId Unique identifier of the type.
   * @param verificationStackId ID of the verification stack.
   * @param publicSignalGetter Address of the new public signal getter contract.
   * @param overrides Transaction overrides.
   */
  public async updateTypePublicSignalGetter(
    typeId: BigNumberish,
    verificationStackId: BigNumberish,
    publicSignalGetter: AddressLike,
    overrides?: Overrides
  ): Promise<Transaction<void>> {
    const tx = await this.contract.updateTypePublicSignalGetter(
      typeId,
      verificationStackId,
      publicSignalGetter,
      overrides ?? {}
    );
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * Retrieves detailed information about a registered type.
   * @param typeId The unique identifier of the type.
   * @returns The detailed information of the type including its name, definition, description, and resource URI.
   */
  public async getType(typeId: BigNumberish): Promise<CredentialType> {
    const typeInfo = await this.contract.getType(typeId);
    return {
      revocable: typeInfo.revocable,
      admin: typeInfo.admin,
      name: typeInfo.name,
      definition: typeInfo.definition,
      description: typeInfo.description,
      resourceURI: typeInfo.resourceURI,
    };
  }

  /**
   * Retrieves the admin a registered.
   * @param typeId The unique identifier of the type.
   * @returns The miscellaneous configuration of the type including its revocability, verification stack ID, verifier, and public signal getter.
   */
  public async getTypeAdmin(typeId: BigNumberish): Promise<AddressLike> {
    return await this.contract.getTypeAdmin(typeId);
  }

  /**
   * Checks if the specified type is revocable.
   * @param typeId The unique identifier of the type.
   * @returns A boolean indicating whether the type is revocable.
   */
  public async isRevocable(typeId: BigNumberish): Promise<boolean> {
    return await this.contract.isRevocable(typeId);
  }

  /**
   * Retrieves the verifier contract address for a given type and verification stack.
   * @param typeId The unique identifier of the type.
   * @param verificationStackId The ID of the verification stack.
   * @returns The ProofVerifier interface for the specified type and stack.
   */
  public async getVerifier(typeId: BigNumberish, verificationStackId: BigNumberish): Promise<ProofVerifier> {
    const addr = await this.contract.getVerifier(typeId, verificationStackId);
    return new ProofVerifier(addr, { signerOrProvider: this.signerOrProvider });
  }

  /**
   * Retrieves the public signal getter contract address for a given type and verification stack.
   * @param typeId The unique identifier of the type.
   * @param verificationStackId The ID of the verification stack.
   * @returns The PublicSignalGetter interface for the specified type and stack.
   */
  public async getPublicSignalGetter(
    typeId: BigNumberish,
    verificationStackId: BigNumberish
  ): Promise<PublicSignalGetter> {
    const addr = await this.contract.getPublicSignalGetter(typeId, verificationStackId);
    return new PublicSignalGetter(addr, { signerOrProvider: this.signerOrProvider });
  }

  /**
   * Checks if a type with a specific verification stack is fully initialized.
   * @param typeId The unique identifier of the type.
   * @param verificationStackId The ID of the verification stack.
   * @returns A boolean indicating whether the type and stack are fully initialized.
   */
  public async isTypeFullyInitializedForStack(
    typeId: BigNumberish,
    verificationStackId: BigNumberish
  ): Promise<boolean> {
    return await this.contract.isTypeFullyInitializedForStack(typeId, verificationStackId);
  }

  /**
   * Calculates the type ID based on the creator address and the type name. Useful for predicting the type ID before registration.
   * @param creator Address of the creator of the type.
   * @param name Name of the type.
   * @returns The calculated type ID.
   */
  public async calcTypeID(creator: string, name: string): Promise<bigint> {
    return await this.contract.calcTypeID(creator, name);
  }
}
