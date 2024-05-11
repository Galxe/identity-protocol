// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { IIssuerRegistry } from "./IIssuerRegistry.sol";
import { ITypeRegistry } from "./ITypeRegistry.sol";
import { ProofReference, IUpaVerifier } from "./IUpaVerifier.sol";

/// @title VerifyResult
/// @notice Enum representing the possible results of a proof verification.
/// Only the OK result indicates a successful verification.
enum VerifyResult {
    OK,
    TYPE_UNINITIALIZED,
    TYPE_ID_MISMATCH,
    CONTEXT_ID_MISMATCH,
    PUBKEY_INACTIVE,
    SIG_REVOCATION_SMT_ROOT_MISMATCH,
    PROOF_INVALID,
    EXPIRED,
    ALIASED_SIGNAL,
    UNKNOWN_ERROR
}

/// @title IAggregatedStatefulVerifier
/// @notice Interface for the AggregatedStatefulVerifier contract which handles on-chain stateful verification of zero-knowledge proofs
/// with proof aggregator.
interface IAggregatedStatefulVerifier {
    /// @notice Emitted when the TypeRegistry is updated.
    /// @param oldTypeRegistry The address of the old TypeRegistry.
    /// @param newTypeRegistry The address of the new TypeRegistry.
    event TypeRegistryUpdated(ITypeRegistry oldTypeRegistry, ITypeRegistry newTypeRegistry);

    /// @notice Emitted when the IssuerRegistry is updated.
    /// @param oldIssuerRegistry The address of the old IssuerRegistry.
    /// @param newIssuerRegistry The address of the new IssuerRegistry.
    event IssuerRegistryUpdated(IIssuerRegistry oldIssuerRegistry, IIssuerRegistry newIssuerRegistry);

    /// @notice Emitted when the UpaVerifier is updated.
    /// @param oldUpaVerifier The address of the old UpaVerifier.
    /// @param newUpaVerifier The address of the new UpaVerifier.
    event UpaVerifierUpdated(IUpaVerifier oldUpaVerifier, IUpaVerifier newUpaVerifier);

    /// @notice Performs static verification of zero-knowledge proofs.
    /// @param typeId The type ID of the proof to verify.
    /// @param contextId The context ID of the proof to verify.
    /// @param keyId The key ID associated with the proof.
    /// @param circuitId The circuit ID for proof aggregator.
    /// @param publicSignals An array containing the public signals data.
    /// @return A value from the VerifyResult enum representing the verification result.
    function verifyProofStatic(
        uint160 typeId,
        uint160 contextId,
        uint256 keyId,
        uint256 circuitId,
        uint256[] calldata publicSignals
    ) external view returns (VerifyResult);

    /// @notice Performs static verification of zero-knowledge proofs.
    /// @param typeId The type ID of the proof to verify.
    /// @param contextId The context ID of the proof to verify.
    /// @param keyId The key ID associated with the proof.
    /// @param circuitId The circuit ID for proof aggregator.
    /// @param publicSignals An array containing the public signals data.
    /// @param proofReference Reference to proofs that were part of a multi-proof submission.
    /// @return A value from the VerifyResult enum representing the verification result.
    function verifyProofStaticFromMultiProof(
        uint160 typeId,
        uint160 contextId,
        uint256 keyId,
        uint256 circuitId,
        uint256[] calldata publicSignals,
        ProofReference calldata proofReference
    ) external view returns (VerifyResult);

    /// @notice Performs full verification of zero-knowledge proofs, including issuer public key activity and revocation checks.
    /// @param typeId The type ID of the proof to verify.
    /// @param contextId The context ID of the proof to verify.
    /// @param issuerId The issuer ID associated with the proof.
    /// @param circuitId The circuit ID for proof aggregator.
    /// @param publicSignals An array containing the public signals data.
    /// @return A value from the VerifyResult enum representing the verification result.
    function verifyProofFull(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId,
        uint256 circuitId,
        uint256[] calldata publicSignals
    ) external view returns (VerifyResult);

    /// @notice Performs full verification of zero-knowledge proofs, including issuer public key activity and revocation checks.
    /// @param typeId The type ID of the proof to verify.
    /// @param contextId The context ID of the proof to verify.
    /// @param issuerId The issuer ID associated with the proof.
    /// @param circuitId The circuit ID for proof aggregator.
    /// @param publicSignals An array containing the public signals data.
    /// @param proofReference Reference to proofs that were part of a multi-proof submission.
    /// @return A value from the VerifyResult enum representing the verification result.
    function verifyProofFullFromMultiProof(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId,
        uint256 circuitId,
        uint256[] calldata publicSignals,
        ProofReference calldata proofReference
    ) external view returns (VerifyResult);

    /// @notice Returns the current TypeRegistry address.
    /// @return The address of the TypeRegistry.
    function getTypeRegistry() external view returns (ITypeRegistry);

    /// @notice Returns the current IssuerRegistry address.
    /// @return The address of the IssuerRegistry.
    function getIssuerRegistry() external view returns (IIssuerRegistry);

    /// @notice Returns the current UpaVerifier address.
    /// @return The address of the UpaVerifier.
    function getUpaVerifier() external view returns (IUpaVerifier);
}
