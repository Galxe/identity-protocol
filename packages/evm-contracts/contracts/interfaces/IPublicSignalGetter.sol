// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/// @title Intrinsic Signal enum
enum IntrinsicSignalName {
    TYPE,
    CONTEXT,
    NULLIFIER,
    EXTERNAL_NULLIFIER,
    REVEAL_IDENTITY,
    EXPIRATION_LB,
    KEY_ID,
    ID_EQUALS_TO,
    SIG_REVOCATION_SMT_ROOT
}

/// @title Public Signal Getter Interface
/// @dev Public signals (inputs) are represented as an array of uints in galxe identity protocol.
///      To find the public signal for a given signal name, type designer should set a contract
///      in the type registry that implements this interface.
interface IPublicSignalGetter {
    /// @dev get the public signal for the signal name, represented as the given enum (represented as uint8), based on the public signals.
    /// @notice Implementation must be able to handle intrinsic signals, defiend in IntrinsicSignalName enum.
    ///         Type-specific signals support is optional.
    /// @param name The signal name, represented as the given enum (converted to uint8).
    /// @param publicSignals The public signals.
    function getPublicSignal(uint8 name, uint256[] calldata publicSignals) external view returns (uint256);
}
