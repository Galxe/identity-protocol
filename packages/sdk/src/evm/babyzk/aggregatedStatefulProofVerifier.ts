import { BigNumberish, Overrides } from "ethers";
import {
  AggregatedBabyzkStatefulVerifier as AggregatedBabyzkStatefulVerifierContract,
  AggregatedBabyzkStatefulVerifier__factory,
} from "@galxe-identity-protocol/evm-contracts";
import { Base, Options, Transaction } from "@/evm/base";
import { VerifyResult } from "./enum";
import { BytesLike } from "ethers";

export interface ProofReference {
  submissionId: BytesLike;
  merkleProof: BytesLike[];
  location: number;
}

/**
 * BabyzkStatefulVerifier is a contract for on-chain stateful verification of zero-knowledge proofs.
 */
export class AggregatedBabyzkStatefulVerifier extends Base<AggregatedBabyzkStatefulVerifierContract> {
  constructor(address: string, options?: Options) {
    const { signerOrProvider } = options || {};
    const factory = new AggregatedBabyzkStatefulVerifier__factory();
    const contract = factory.attach(address) as AggregatedBabyzkStatefulVerifierContract;
    super(contract, signerOrProvider);
  }

  /**
   * Performs static verification of zero-knowledge proofs.
   * @param typeId The type ID associated with the proof.
   * @param contextId The context ID associated with the proof.
   * @param keyId The public key ID used for the proof.
   * @param circuitId The circuit ID for proof aggregator.
   * @param publicSignals The array of public signals.
   * @param overrides Optional overrides for the transaction.
   * @returns A promise of the verification result.
   */
  public async verifyProofStatic(
    typeId: BigNumberish,
    contextId: BigNumberish,
    keyId: BigNumberish,
    circuitId: BigNumberish,
    publicSignals: BigNumberish[],
    proofReference?: ProofReference
  ): Promise<VerifyResult> {
    if (typeof proofReference !== "undefined") {
      const tx = await this.contract.verifyProofStaticFromMultiProof(
        typeId,
        contextId,
        keyId,
        circuitId,
        publicSignals,
        proofReference
      );
      return Number(tx) as VerifyResult;
    }

    const tx = await this.contract.verifyProofStatic(typeId, contextId, keyId, circuitId, publicSignals);
    return Number(tx) as VerifyResult;
  }

  /**
   * Performs full verification of zero-knowledge proofs, including public key activity and revocation checks.
   * @param typeId The type ID associated with the proof.
   * @param contextId The context ID associated with the proof.
   * @param issuerId The issuer ID associated with the proof.
   * @param circuitId The circuit ID for proof aggregator.
   * @param publicSignals The array of public signals.
   * @param overrides Optional overrides for the transaction.
   * @returns A promise of the verification result.
   */
  public async verifyProofFull(
    typeId: BigNumberish,
    contextId: BigNumberish,
    issuerId: BigNumberish,
    circuitId: BigNumberish,
    publicSignals: BigNumberish[],
    proofReference?: ProofReference
  ): Promise<VerifyResult> {
    if (typeof proofReference !== "undefined") {
      const tx = await this.contract.verifyProofFullFromMultiProof(
        typeId,
        contextId,
        issuerId,
        circuitId,
        publicSignals,
        proofReference
      );
      return Number(tx) as VerifyResult;
    }
    const tx = await this.contract.verifyProofFull(typeId, contextId, issuerId, circuitId, publicSignals);
    return Number(tx) as VerifyResult;
  }

  /**
   * Updates the TypeRegistry contract address.
   * @param newTypeRegistry The new TypeRegistry contract address.
   * @param overrides Optional overrides for the transaction.
   * @returns A promise of the transaction.
   */
  public async updateTypeRegistry(newTypeRegistry: string, overrides?: Overrides): Promise<Transaction<void>> {
    const tx = await this.contract.updateTypeRegistry(newTypeRegistry, overrides ?? {});
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * Updates the IssuerRegistry contract address.
   * @param newIssuerRegistry The new IssuerRegistry contract address.
   * @param overrides Optional overrides for the transaction.
   * @returns A promise of the transaction.
   */
  public async updateIssuerRegistry(newIssuerRegistry: string, overrides?: Overrides): Promise<Transaction<void>> {
    const tx = await this.contract.updateIssuerRegistry(newIssuerRegistry, overrides ?? {});
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * Updates the UpaVerifier contract address.
   * @param newUpaVerifier The new UpaVerifier contract address.
   * @param overrides Optional overrides for the transaction.
   * @returns A promise of the transaction.
   */
  public async updateUpaVerifier(newUpaVerifier: string, overrides?: Overrides): Promise<Transaction<void>> {
    const tx = await this.contract.updateUpaVerifier(newUpaVerifier, overrides ?? {});
    return new Transaction<void>(tx, async () => undefined);
  }

  /**
   * Retrieves the TypeRegistry contract address.
   * @returns A promise of the TypeRegistry contract address.
   */
  public async getTypeRegistry(): Promise<string> {
    return await this.contract.getTypeRegistry();
  }

  /**
   * Retrieves the IssuerRegistry contract address.
   * @returns A promise of the IssuerRegistry contract address.
   */
  public async getIssuerRegistry(): Promise<string> {
    return await this.contract.getIssuerRegistry();
  }

  /**
   * Retrieves the UpaVerifier contract address.
   * @returns A promise of the UpaVerifier contract address.
   */
  public async getUpaVerifier(): Promise<string> {
    return await this.contract.getUpaVerifier();
  }
}
