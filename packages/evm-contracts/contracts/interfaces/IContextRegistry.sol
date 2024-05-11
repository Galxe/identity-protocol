// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/// @title Context Registry Interface
interface IContextRegistry {
    // Events
    event ContextRegistered(uint160 indexed contextId, string context);

    /// @dev registerContext registers a new context and returns the contextId
    function registerContext(string calldata context) external returns (uint160);

    /// @dev getContext returns the context for the given contextId
    function getContext(uint160 contextId) external returns (string memory);

    /// @dev calculate the contextID for a given context string
    function calculateContextID(string calldata context) external pure returns (uint160);
}
