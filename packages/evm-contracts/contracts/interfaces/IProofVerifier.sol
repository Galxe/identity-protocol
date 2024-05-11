// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/// @title IProofVerifier
/// @dev Interface for static verification of zero-knowledge proofs.
interface IProofVerifier {
    /// @notice Retrieves the verification keys.
    /// @dev This function is used to get the verification keys that are necessary for verifying proofs.
    /// @return An array of `uint` representing the verification keys.
    function getVerificationKeys() external view returns (uint256[] memory);

    /// @dev Checks if the public signals are aliased. Aliased signals should never be used in proofs.
    ///      This is useful when using proof aggregators that does not check for signal aliasing.
    /// @param _pubSignals An array of `uint` representing the public signals.
    /// @return A boolean value indicating if any public signal is aliased (`true`) or not (`false`).
    function isAliased(uint256[] calldata _pubSignals) external view returns (bool);

    /// @dev This function takes a cryptographic proof and public signals to verify the proof's validity.
    /// @notice It verifies the proof and check if public signals were aliased.
    /// @param _proofs An array of `uint` representing the proof.
    /// @param _pubSignals An array of `uint` representing the public signals.
    /// @return A boolean value indicating whether the proof is valid (`true`) or not (`false`).
    function verifyProof(uint256[] calldata _proofs, uint256[] calldata _pubSignals) external view returns (bool);
}
