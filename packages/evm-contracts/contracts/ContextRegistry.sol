// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { IContextRegistry } from "./interfaces/IContextRegistry.sol";

/// @notice ContextRegistry is a contract that allows the registration of contexts.
/// Contexts are strings that represent a specific context for credentials. They
/// are ownerless and can be registered and used by anyone.
contract ContextRegistry is IContextRegistry {
    error AlreadyExists();

    // The global mapping between contexts and their contextID.
    mapping(uint160 contextId => string context) private _registry;

    /// @dev register a new context
    function registerContext(string calldata context) external override returns (uint160) {
        uint160 contextID = _getContextID(context);
        if (bytes(_registry[contextID]).length != 0) {
            revert AlreadyExists();
        }
        _registry[contextID] = context;
        emit ContextRegistered(contextID, context);
        return contextID;
    }

    /// @dev get the context for the given contextID
    function getContext(uint160 contextId) external view override returns (string memory) {
        return _registry[contextId];
    }

    /// @dev calculate the contextID for a given context string
    function calculateContextID(string calldata context) external pure override returns (uint160) {
        return _getContextID(context);
    }

    /**
     * ContextID is the lower 160 bits of the keccak256 hash of the context string.
     * @param context The context string to get the contextID for.
     */
    function _getContextID(string calldata context) private pure returns (uint160) {
        return uint160(uint256(keccak256(abi.encodePacked(context))));
    }
}
