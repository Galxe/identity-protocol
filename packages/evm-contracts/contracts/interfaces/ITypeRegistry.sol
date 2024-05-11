// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { IProofVerifier } from "./IProofVerifier.sol";
import { IPublicSignalGetter } from "./IPublicSignalGetter.sol";

/// @title Credential Type
/// @dev Defines the structure of a credential type.
struct CredentialType {
    // @dev This flag indicates if the credential type support revocation.
    bool revocable;
    // @dev The address of the admin of the credential type, initially set to the creator.
    address admin;
    // @dev Provides a human-readable identifier for the credential.
    string name;
    // @dev The type specification of Galxe Identity Credential Type Schema.
    string definition;
    // @dev Additional context or information about the type.
    string description;
    // @dev A URI to an external JSON file of more information about the credential.
    // See whitepaper for the JSON schema specification.
    string resourceURI;
}

/// @title Credential Type Config, miscellanous.
/// @notice To save stack space, we use this struct to store the verifier and public signal getter.
struct CredentialTypeMiscConfig {
    bool revocable;
    uint8 verificationStackId;
    IProofVerifier verifier;
    IPublicSignalGetter publicSignalGetter;
}

/// @title Interface for Type Registration Contract
/// @notice This interface defines the functions for registering and managing types by users.
interface ITypeRegistry {
    /// @dev Emitted when a new type is registered
    /// @param typeID Unique identifier for the registered type
    /// @param admin Address of the admin of the type.
    /// @param name Name of the type
    /// @param definition Immutable definition of the type
    /// @param description Immutable description of the type
    /// @param resourceURI Mutable resource URI for the type
    event TypeRegistered(
        uint160 indexed typeID,
        address indexed admin,
        string name,
        string definition,
        string description,
        string resourceURI
    );

    /// @dev Emitted when the resource URI of a type is updated
    /// @param typeID Unique identifier for the type being updated
    /// @param oldResourceURI The previous resource URI
    /// @param newResourceURI The new resource URI
    event TypeResourceURIUpdated(uint160 indexed typeID, string oldResourceURI, string newResourceURI);

    /// @dev Emitted when a proof verifier is updated for a type
    /// @param typeID type id
    /// @param verificationStackID verification stack id
    /// @param verifier address of the verifier
    event TypeVerifierUpdated(uint160 indexed typeID, uint8 indexed verificationStackID, address indexed verifier);

    /// @dev Emitted when the intrinsic signal indexes are updated for a type
    /// @param typeID type id
    /// @param verificationStackID verification stack id
    /// @param publicSignalGetter  address of the public signal getter
    event TypePublicSignalGetterUpdated(
        uint160 indexed typeID,
        uint8 indexed verificationStackID,
        address indexed publicSignalGetter
    );

    /// @dev Emitted when the admin of a type is transferred
    /// @param typeID type id
    /// @param oldAdmin address of the old admin
    /// @param newAdmin address of the new admin
    event TypeAdminTransferred(uint160 indexed typeID, address indexed oldAdmin, address indexed newAdmin);

    /// @dev transfer the ownership of a type.
    /// @param typeId type id of the type
    /// @param newAdmin address of the new admin
    function transferTypeAdmin(uint160 typeId, address newAdmin) external;

    /// @notice set a primitive type, only callable by the admin.
    /// @param typeId the type id of the primitive type
    /// @param name name of the type
    /// @param definition definition string
    /// @param description Description of the type
    /// @param resourceURI Mutable resource URI of the type
    /// @param config revocable, verifier and public signal getter.
    function setPrimitiveType(
        uint160 typeId,
        string calldata name,
        string calldata definition,
        string calldata description,
        string calldata resourceURI,
        CredentialTypeMiscConfig calldata config
    ) external;

    /// @notice Register a new type by `msg.sender`
    /// @param name Type name
    /// @param definition Immutable type definition string
    /// @param description Description of the type
    /// @param resourceURI Mutable resource URI of the type
    /// @return typeID Unique identifier of the registered type
    function registerType(
        bool revocable,
        string calldata name,
        string calldata definition,
        string calldata description,
        string calldata resourceURI
    ) external returns (uint160);

    /// @notice Register a new type by `msg.sender` with verifier and public signal getter set for a specific verification stack.
    /// @param name Type name
    /// @param definition Immutable type definition string
    /// @param description Description of the type
    /// @param resourceURI Mutable resource URI of the type
    /// @param verifier verifier for the type
    /// @param publicSignalGetter public signal getter for the type
    /// @return typeID Unique identifier of the registered type
    function registerType1Step(
        bool revocable,
        string calldata name,
        string calldata definition,
        string calldata description,
        string calldata resourceURI,
        uint8 verificationStackId,
        IProofVerifier verifier,
        IPublicSignalGetter publicSignalGetter
    ) external returns (uint160);

    /// @notice Update the resource URI of a type
    /// @dev Can only be called by the type owner (`msg.sender`)
    /// @param _id ID of the type to update
    /// @param _resourceURI New resource URI for the type
    function updateTypeResourceURI(uint160 _id, string calldata _resourceURI) external;

    /// @dev update the verifier for a type
    function updateTypeVerifier(uint160 typeId, uint8 verificationStackId, IProofVerifier verifier) external;

    /// @dev update the verifier for a type
    function updateTypePublicSignalGetter(
        uint160 typeId,
        uint8 verificationStackId,
        IPublicSignalGetter getter
    ) external;

    /// @param typeId type id of the type
    /// @param verificationStackId verification stack id
    function getVerifier(uint160 typeId, uint8 verificationStackId) external view returns (IProofVerifier);

    /// @param typeId type id of the type
    /// @param verificationStackId verification stack id
    function getPublicSignalGetter(
        uint160 typeId,
        uint8 verificationStackId
    ) external view returns (IPublicSignalGetter);

    /// @dev check if the type is fully initialized for the given verification stack.
    /// @param typeId id of the type
    /// @param verificationStackId id the verification stack
    function isTypeFullyInitializedForStack(uint160 typeId, uint8 verificationStackId) external view returns (bool);

    /// @dev Retrieve details of a type for the given typeID
    /// @param _id ID of the type to retrieve
    /// @return A `CredentialType` struct containing details of the type
    function getType(uint160 _id) external view returns (CredentialType memory);

    /// @dev Retrieve the admin of a type
    /// @param typeId type id of the type
    /// @return address of the admin of the type
    function getTypeAdmin(uint160 typeId) external view returns (address);

    /// @dev check if the type is revocable
    function isRevocable(uint160 typeId) external view returns (bool);

    /// @notice Calculate the typeID of a type, typeID is keccak256(creator, name) in uint160.
    /// @param creator Address of the type creator
    /// @param name Name of the type
    /// @return The calculated typeID based on the creator address and type name
    function calcTypeID(address creator, string calldata name) external pure returns (uint160);
}
