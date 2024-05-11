// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { IIssuerRegistry } from "./IIssuerRegistry.sol";
import { ITypeRegistry } from "./ITypeRegistry.sol";

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
    UNKNOWN_ERROR
}

/// @title IBabyzkStatefulVerifier
/// @notice Interface for the BabyzkStatefulVerifier contract which handles on-chain stateful verification of zero-knowledge proofs.
interface IStatefulVerifier {
    /// @notice Emitted when the TypeRegistry is updated.
    /// @param oldTypeRegistry The address of the old TypeRegistry.
    /// @param newTypeRegistry The address of the new TypeRegistry.
    event TypeRegistryUpdated(ITypeRegistry oldTypeRegistry, ITypeRegistry newTypeRegistry);

    /// @notice Emitted when the IssuerRegistry is updated.
    /// @param oldIssuerRegistry The address of the old IssuerRegistry.
    /// @param newIssuerRegistry The address of the new IssuerRegistry.
    event IssuerRegistryUpdated(IIssuerRegistry oldIssuerRegistry, IIssuerRegistry newIssuerRegistry);

    /// @notice Performs static verification of zero-knowledge proofs.
    /// @param typeId The type ID of the proof to verify.
    /// @param contextId The context ID of the proof to verify.
    /// @param keyId The key ID associated with the proof.
    /// @param proofs An array containing the proof data.
    /// @param publicSignals An array containing the public signals data.
    /// @return A value from the VerifyResult enum representing the verification result.
    function verifyProofStatic(
        uint160 typeId,
        uint160 contextId,
        uint256 keyId,
        uint256[] calldata proofs,
        uint256[] calldata publicSignals
    ) external view returns (VerifyResult);

    /// @notice Performs full verification of zero-knowledge proofs, including issuer public key activity and revocation checks.
    /// @param typeId The type ID of the proof to verify.
    /// @param contextId The context ID of the proof to verify.
    /// @param issuerId The issuer ID associated with the proof.
    /// @param proofs An array containing the proof data.
    /// @param publicSignals An array containing the public signals data.
    /// @return A value from the VerifyResult enum representing the verification result.
    function verifyProofFull(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId,
        uint256[] calldata proofs,
        uint256[] calldata publicSignals
    ) external view returns (VerifyResult);

    /// @notice Returns the current TypeRegistry address.
    /// @return The address of the TypeRegistry.
    function getTypeRegistry() external view returns (ITypeRegistry);

    /// @notice Returns the current IssuerRegistry address.
    /// @return The address of the IssuerRegistry.
    function getIssuerRegistry() external view returns (IIssuerRegistry);
}
