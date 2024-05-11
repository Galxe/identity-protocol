// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { IPublicSignalGetter } from "../interfaces/IPublicSignalGetter.sol";

contract BabyzkDefaultPsGetter is IPublicSignalGetter {
    /// @dev Implements the getPublicSignal function from the IPublicSignalGetter interface.
    /// @param name The signal name, represented as the given enum (converted to uint8).
    /// @param publicSignals The public signals, as an array of uints.
    /// @return The public signal associated with the given name.
    function getPublicSignal(uint8 name, uint256[] calldata publicSignals) external pure override returns (uint256) {
        // Because in babyzk's circom circuit, the index of the public signals is the same as the enum value of the signal name,
        // we can simply return the public signal at the index of the signal name.
        // This is deliberately done to make the circuit easier to understand and to avoid the need for a more complex getter.
        // However, in a more complex circuit, the order of public signals can be different from the enum values.
        // In those cases, type designers can use a custom public signal getter to return the correct public signal.
        return publicSignals[name];
    }
}
