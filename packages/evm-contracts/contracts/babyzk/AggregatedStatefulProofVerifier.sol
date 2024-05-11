// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { IPublicSignalGetter, IntrinsicSignalName } from "../interfaces/IPublicSignalGetter.sol";
import { IProofVerifier } from "../interfaces/IProofVerifier.sol";
import { IIssuerRegistry } from "../interfaces/IIssuerRegistry.sol";
import { ITypeRegistry } from "../interfaces/ITypeRegistry.sol";
import { IAggregatedStatefulVerifier, VerifyResult } from "../interfaces/IAggregatedStatefulVerifier.sol";
import { IUpaVerifier, ProofReference } from "../interfaces/IUpaVerifier.sol";

/// @title AggregatedBabyzkStatefulVerifier
/// @notice
/// @dev AggregatedBabyzkStatefulVerifier is a contract that does on-chain stateful verification of zero-knowledge proofs.
contract AggregatedBabyzkStatefulVerifier is IAggregatedStatefulVerifier, Ownable {
    error InvalidArgument(string message);

    // constants
    uint8 public constant STACK_ID = 1;

    /// @dev aggregated proof verifier
    IUpaVerifier private _upaVerifier;

    /// @dev type registry
    ITypeRegistry private _typeRegistry;

    /// @dev issuer registry
    IIssuerRegistry private _issuerRegistry;

    /// @dev BabyzkVerifier constructor
    /// @param typeRegistry type registry contract
    /// @param issuerRegistry issuer registry contract
    constructor(IUpaVerifier upaVerifier, ITypeRegistry typeRegistry, IIssuerRegistry issuerRegistry, address admin) {
        _upaVerifier = upaVerifier;
        _typeRegistry = typeRegistry;
        _issuerRegistry = issuerRegistry;
        transferOwnership(admin);
    }

    /// @dev static verification of zero-knowledge proofs that only checks if the proof is valid.
    /// @dev Code duplication is deliberate for clear separation of concerns.
    function verifyProofStatic(
        uint160 typeId,
        uint160 contextId,
        uint256 keyId,
        uint256 circuitId,
        uint256[] calldata publicSignals
    ) external view override returns (VerifyResult) {
        // static validation
        VerifyResult staticValidationResult = _staticValidation(typeId, contextId, keyId, publicSignals);
        if (staticValidationResult != VerifyResult.OK) {
            return staticValidationResult;
        }

        // verify public signals against circuit ID on upa verifier.
        bool verified = _upaVerifier.isVerified(circuitId, publicSignals);
        if (!verified) {
            return VerifyResult.PROOF_INVALID;
        }

        // checks if the public signals are aliased. Proof aggregators do not check for signal aliasing.
        IProofVerifier verifier = _typeRegistry.getVerifier(typeId, STACK_ID);
        if (verifier.isAliased(publicSignals)) {
            return VerifyResult.ALIASED_SIGNAL;
        }

        return VerifyResult.OK;
    }

    /// @dev static verification of zero-knowledge proofs that only checks if the proof is valid.
    /// @dev `proofReference` is needed to check proofs that were part of a multi-proof submission.
    /// @dev Code duplication is deliberate for clear separation of concerns.
    function verifyProofStaticFromMultiProof(
        uint160 typeId,
        uint160 contextId,
        uint256 keyId,
        uint256 circuitId,
        uint256[] calldata publicSignals,
        ProofReference calldata proofReference
    ) external view override returns (VerifyResult) {
        // static validation
        VerifyResult staticValidationResult = _staticValidation(typeId, contextId, keyId, publicSignals);
        if (staticValidationResult != VerifyResult.OK) {
            return staticValidationResult;
        }

        // verify public signals against circuit ID on upa verifier.
        bool verified = _upaVerifier.isVerified(circuitId, publicSignals, proofReference);
        if (!verified) {
            return VerifyResult.PROOF_INVALID;
        }

        // checks if the public signals are aliased. Proof aggregators do not check for signal aliasing.
        IProofVerifier verifier = _typeRegistry.getVerifier(typeId, STACK_ID);
        if (verifier.isAliased(publicSignals)) {
            return VerifyResult.ALIASED_SIGNAL;
        }

        return VerifyResult.OK;
    }

    function _staticValidation(
        uint160 typeId,
        uint160 contextId,
        uint256 keyId,
        uint256[] calldata publicSignals
    ) internal view returns (VerifyResult) {
        if (!_typeRegistry.isTypeFullyInitializedForStack(typeId, STACK_ID)) {
            return VerifyResult.TYPE_UNINITIALIZED;
        }

        IPublicSignalGetter psGetter = _typeRegistry.getPublicSignalGetter(typeId, STACK_ID);

        // type matches
        if (typeId != psGetter.getPublicSignal(uint8(IntrinsicSignalName.TYPE), publicSignals)) {
            return VerifyResult.TYPE_ID_MISMATCH;
        }

        // context matches
        if (contextId != psGetter.getPublicSignal(uint8(IntrinsicSignalName.CONTEXT), publicSignals)) {
            return VerifyResult.CONTEXT_ID_MISMATCH;
        }

        // keyID matches
        if (keyId != psGetter.getPublicSignal(uint8(IntrinsicSignalName.KEY_ID), publicSignals)) {
            return VerifyResult.PUBKEY_INACTIVE;
        }

        // proof is valid only if its expiration lower bound is not exceeded.
        {
            uint256 expiration = psGetter.getPublicSignal(uint8(IntrinsicSignalName.EXPIRATION_LB), publicSignals);
            if (expiration < block.timestamp) {
                return VerifyResult.EXPIRED;
            }
        }

        return VerifyResult.OK;
    }

    /// @dev Stateful verification of zero-knowledge proofs that checks
    ///      if the proof is valid and the issuer public key is active, and
    ///      for revocation checks if the the smt root matches.
    /// @dev The trust relationship between the credential and issuer is binded by
    ///      the public key ID:
    ///      credential <--- signed by ---- publikc key <--- authroized by ---- issuer
    ///      As long as the issuer set the public key ID to be active, the credential is trusted by the issuer,
    ///      However, note that it does not mean that the credential is directly generated by the issuer.
    function verifyProofFull(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId,
        uint256 circuitId,
        uint256[] calldata publicSignals
    ) external view override returns (VerifyResult) {
        VerifyResult fullValidationResult = _fullValidation(typeId, contextId, issuerId, publicSignals);
        if (fullValidationResult != VerifyResult.OK) {
            return fullValidationResult;
        }

        // verify public signals against circuit ID on upa verifier.
        bool verified = _upaVerifier.isVerified(circuitId, publicSignals);
        if (!verified) {
            return VerifyResult.PROOF_INVALID;
        }

        // checks if the public signals are aliased. Proof aggregators do not check for signal aliasing.
        IProofVerifier verifier = _typeRegistry.getVerifier(typeId, STACK_ID);
        if (verifier.isAliased(publicSignals)) {
            return VerifyResult.ALIASED_SIGNAL;
        }

        return VerifyResult.OK;
    }

    /// @dev Stateful verification of zero-knowledge proofs that checks
    ///      if the proof is valid and the issuer public key is active, and
    ///      for revocation checks if the the smt root matches.
    /// @dev `proofReference` is needed to check proofs that were part of a multi-proof submission.
    /// @dev The trust relationship between the credential and issuer is binded by
    ///      the public key ID:
    ///      credential <--- signed by ---- publikc key <--- authroized by ---- issuer
    ///      As long as the issuer set the public key ID to be active, the credential is trusted by the issuer,
    ///      However, note that it does not mean that the credential is directly generated by the issuer.
    function verifyProofFullFromMultiProof(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId,
        uint256 circuitId,
        uint256[] calldata publicSignals,
        ProofReference calldata proofReference
    ) external view override returns (VerifyResult) {
        VerifyResult fullValidationResult = _fullValidation(typeId, contextId, issuerId, publicSignals);
        if (fullValidationResult != VerifyResult.OK) {
            return fullValidationResult;
        }

        // verify public signals against circuit ID on upa verifier.
        bool verified = _upaVerifier.isVerified(circuitId, publicSignals, proofReference);
        if (!verified) {
            return VerifyResult.PROOF_INVALID;
        }

        // checks if the public signals are aliased. Proof aggregators do not check for signal aliasing.
        IProofVerifier verifier = _typeRegistry.getVerifier(typeId, STACK_ID);
        if (verifier.isAliased(publicSignals)) {
            return VerifyResult.ALIASED_SIGNAL;
        }

        return VerifyResult.OK;
    }

    function _fullValidation(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId,
        uint256[] calldata publicSignals
    ) internal view returns (VerifyResult) {
        if (!_typeRegistry.isTypeFullyInitializedForStack(typeId, STACK_ID)) {
            return VerifyResult.TYPE_UNINITIALIZED;
        }

        IPublicSignalGetter psGetter = _typeRegistry.getPublicSignalGetter(typeId, STACK_ID);

        // type matches
        if (typeId != psGetter.getPublicSignal(uint8(IntrinsicSignalName.TYPE), publicSignals)) {
            return VerifyResult.TYPE_ID_MISMATCH;
        }

        // context matches
        if (contextId != psGetter.getPublicSignal(uint8(IntrinsicSignalName.CONTEXT), publicSignals)) {
            return VerifyResult.CONTEXT_ID_MISMATCH;
        }

        // proof is valid only if the issuer public key is still active.
        {
            uint256 keyId = psGetter.getPublicSignal(uint8(IntrinsicSignalName.KEY_ID), publicSignals);
            if (!_issuerRegistry.isPublicKeyActiveForStack(issuerId, keyId, STACK_ID)) {
                return VerifyResult.PUBKEY_INACTIVE;
            }
        }

        // proof is valid only if its expiration lower bound is not exceeded.
        {
            uint256 expiration = psGetter.getPublicSignal(uint8(IntrinsicSignalName.EXPIRATION_LB), publicSignals);
            if (expiration < block.timestamp) {
                return VerifyResult.EXPIRED;
            }
        }

        // proof is valid only if the smt root matches for revocable credentials.
        if (_typeRegistry.isRevocable(typeId)) {
            uint256 root = psGetter.getPublicSignal(uint8(IntrinsicSignalName.SIG_REVOCATION_SMT_ROOT), publicSignals);
            uint256 currentRoot = uint256(_issuerRegistry.getSignatureStateRoot(typeId, contextId, issuerId));
            if (currentRoot != root) {
                return VerifyResult.SIG_REVOCATION_SMT_ROOT_MISMATCH;
            }
        }

        return VerifyResult.OK;
    }

    /// @dev return the type registry
    function getTypeRegistry() external view override returns (ITypeRegistry) {
        return _typeRegistry;
    }

    /// @dev update the type registry
    function updateTypeRegistry(ITypeRegistry typeRegistry) external onlyOwner {
        if (typeRegistry == ITypeRegistry(address(0))) {
            revert InvalidArgument("typeRegistry is zero address");
        }
        emit TypeRegistryUpdated(_typeRegistry, typeRegistry);
        _typeRegistry = typeRegistry;
    }

    /// @dev return the issuer registry
    function getIssuerRegistry() external view override returns (IIssuerRegistry) {
        return _issuerRegistry;
    }

    /// @dev update the issuer registry
    function updateIssuerRegistry(IIssuerRegistry issuerRegistry) external onlyOwner {
        if (issuerRegistry == IIssuerRegistry(address(0))) {
            revert InvalidArgument("issuerRegistry is zero address");
        }
        emit IssuerRegistryUpdated(_issuerRegistry, issuerRegistry);
        _issuerRegistry = issuerRegistry;
    }

    /// @dev return the upa verifier
    function getUpaVerifier() external view override returns (IUpaVerifier) {
        return _upaVerifier;
    }

    /// @dev update the upa verifier
    function updateUpaVerifier(IUpaVerifier upaVerifier) external onlyOwner {
        if (upaVerifier == IUpaVerifier(address(0))) {
            revert InvalidArgument("upaVerifier is zero address");
        }
        emit UpaVerifierUpdated(_upaVerifier, upaVerifier);
        _upaVerifier = upaVerifier;
    }
}
