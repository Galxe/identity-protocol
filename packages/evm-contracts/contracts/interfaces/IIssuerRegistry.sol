// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/// @dev The status of the public key, only active public key can be used for verification.
enum PublicKeyStatus {
    UNINITIALIZED,
    REVOKED,
    ACTIVE
}

/// @dev The public key struct
struct PublicKey {
    /// @dev the verification stack id that the public key is enabled for.
    mapping(uint8 => bool) enabledVerificationStacks;
    /// @dev the status of the public key
    PublicKeyStatus status;
    /// @dev the raw bytes of the public key. Not used in the contract, only for off-chain usage.
    /// The spec for marshalling the public key is defined by the issuer.
    bytes raw;
}

/// @dev The revoked signature ID in a sparsed merkle tree.
struct SignatureState {
    /// @dev the root hash of the sparsed merkle tree.
    bytes32 root;
    /// @dev uri to the sparsed merkle tree, representing the revoked signature ids.
    string treeURI;
}

/// @dev The issuer struct
struct Issuer {
    /// @dev the name of the issuer
    string name;
    /// @dev the admin of the issuer, who can add or revoke public keys.
    address admin;
}

/// @title IIssuerRegistry
/// @dev The interface for the issuer registry contract.
interface IIssuerRegistry {
    /// @notice Emitted when a new issuer is registered in the registry.
    /// @param issuerId Unique identifier for the newly registered issuer.
    /// @param name Name of the issuer registered.
    event IssuerRegistered(uint256 indexed issuerId, string name);

    /// @notice Emitted when an issuer's administrative role is transferred to a new address.
    /// @param issuerId ID of issuer whose admin is being transferred.
    /// @param oldAdmin Address of the current admin being replaced.
    /// @param newAdmin Address of the new admin taking over.
    event IssuerAdminTransferred(uint256 indexed issuerId, address indexed oldAdmin, address indexed newAdmin);

    /// @notice Emitted when the status of a public key is updated.
    /// @param issuerId ID for the issuer to whom the public key belongs.
    /// @param publicKeyId ID for the public key being updated.
    /// @param status New status of the public key.
    event PublicKeyStatusUpdated(uint256 indexed issuerId, uint256 indexed publicKeyId, PublicKeyStatus status);

    /// @notice Emitted when the verification stack for a public key is updated.
    /// @param issuerId Unique identifier for the issuer to whom the public key belongs.
    /// @param publicKeyId Unique identifier for the public key.
    /// @param verificationStackId Identifier for the verification stack being updated.
    /// @param enabled Boolean indicating whether the stack is enabled or disabled for the public key.
    event PublicKeyVerificationStackUpdated(
        uint256 indexed issuerId,
        uint256 indexed publicKeyId,
        uint256 indexed verificationStackId,
        bool enabled
    );

    /// @notice Emitted when the signature state URI is updated for a specific type and context.
    /// @param typeId Type identifier for the signature state being updated.
    /// @param contextID Context identifier for the signature state being updated.
    /// @param issuerId Issuer identifier related to the signature state.
    /// @param newTreeURI New URI for the signature state tree.
    event SignatureStateURIUpdated(
        uint160 indexed typeId,
        uint160 indexed contextID,
        uint256 indexed issuerId,
        string newTreeURI
    );

    /// @notice Emitted when the signature state root is updated for a specific type and context.
    /// @param typeId Type identifier for the signature state being updated.
    /// @param contextID Context identifier for the signature state being updated.
    /// @param issuerId Issuer identifier related to the signature state.
    /// @param newRoot New root hash for the signature state tree.
    event SignatureStateRootUpdated(
        uint160 indexed typeId,
        uint160 indexed contextID,
        uint256 indexed issuerId,
        bytes32 newRoot
    );

    /// @dev Registers a new issuer along with their first public key and enabled verification stack.
    /// @param name Name of the issuer to register.
    /// @param verificationStackId Identifier for the verification stack.
    /// @param publicKeyId  Identifier for the issuer's public key.
    /// @param publicKeyRaw The raw public key data.
    /// @return The unique identifier for the newly registered issuer.
    function registerIssuer(
        string calldata name,
        uint8 verificationStackId,
        uint256 publicKeyId,
        bytes calldata publicKeyRaw
    ) external returns (uint256);

    /// @dev Transfers the administrative role of an issuer to a new owner.
    /// @param issuerId Unique identifier for the issuer.
    /// @param newOwner Address of the new administrator.
    function transferIssuerAdmin(uint256 issuerId, address newOwner) external;

    /// @dev Adds a new public key for an issuer and enables it for a specified verification stack.
    /// @param issuerId Unique identifier for the issuer.
    /// @param verificationStackId Identifier for the verification stack.
    /// @param publicKeyId Unique identifier for the new public key.
    /// @param publicKeyRaw The raw public key data.
    function addPublicKey(
        uint256 issuerId,
        uint8 verificationStackId,
        uint256 publicKeyId,
        bytes calldata publicKeyRaw
    ) external;

    /// @dev Updates the status (active/revoked) of an issuer's public key.
    /// @param issuerId Unique identifier for the issuer.
    /// @param publicKeyId Unique identifier for the public key.
    /// @param status New status for the public key.
    // only the issuer admin can call this function
    function updatePublicKeyStatus(uint256 issuerId, uint256 publicKeyId, PublicKeyStatus status) external;

    /// @dev Updates the verification stack association for an issuer's public key.
    /// @param issuerId Unique identifier for the issuer.
    /// @param publicKeyId Unique identifier for the public key.
    /// @param verificationStackId New verification stack identifier for the public key.
    /// @param enabled Boolean indicating whether the stack is enabled for the public key.
    function updatePublicKeyVerificationStack(
        uint256 issuerId,
        uint256 publicKeyId,
        uint8 verificationStackId,
        bool enabled
    ) external;

    /// @dev Updates the signature state URI for a given type and context.
    /// @param typeId Type identifier.
    /// @param contextId Context identifier.
    /// @param issuerId Unique identifier for the issuer.
    /// @param treeURI New URI for the signature state.
    function updateSignatureStateURI(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId,
        string calldata treeURI
    ) external;

    /// @dev Updates the signature SMT root for a given type, context and issuer.
    /// @param typeId Type identifier.
    /// @param contextId Context identifier.
    /// @param issuerId Unique identifier for the issuer.
    /// @param root New root hash for the revoked SMT.
    function updateSignatureState(uint160 typeId, uint160 contextId, uint256 issuerId, bytes32 root) external;

    /// @dev Sets both the signature SMT URI and root for a given type, context and issuer.
    /// @param typeId Type identifier.
    /// @param contextId Context identifier.
    /// @param issuerId Unique identifier for the issuer.
    /// @param treeURI New URI for the signature state.
    /// @param root New root hash for the signature state.
    function setSignatureState(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId,
        string calldata treeURI,
        bytes32 root
    ) external;

    /// @dev Retrieves the issuer data, reverts if the issuer does not exist.
    /// @param issuerId Unique identifier for the issuer.
    /// @return Issuer data structure containing issuer details.
    function getIssuer(uint256 issuerId) external view returns (Issuer memory);

    /// @dev Retrieves the raw public key data for an issuer's public key.
    /// @param issuerId Unique identifier for the issuer.
    /// @param publicKeyId Unique identifier for the public key.
    /// @return The raw public key data.
    function getPublicKeyRaw(uint256 issuerId, uint256 publicKeyId) external view returns (bytes memory);

    /// @dev Checks if an issuer's public key is active.
    /// @param issuerId Unique identifier for the issuer.
    /// @param publicKeyId Unique identifier for the public key.
    /// @return True if the public key is active, false otherwise.
    function isPublicKeyActive(uint256 issuerId, uint256 publicKeyId) external view returns (bool);

    /// @dev Checks if an issuer's public key is active and enabled for a specific verification stack.
    /// @param issuerId Unique identifier for the issuer.
    /// @param publicKeyId Unique identifier for the public key.
    /// @param verificationStackId Identifier for the verification stack.
    /// @return True if the public key is active and enabled for the stack, false otherwise.
    function isPublicKeyActiveForStack(
        uint256 issuerId,
        uint256 publicKeyId,
        uint8 verificationStackId
    ) external view returns (bool);

    /// @dev Retrieves the signature state for a given type, context and issuer.
    /// @param typeId Type identifier.
    /// @param contextId Context identifier.
    /// @param issuerId Unique identifier for the issuer.
    /// @return The signature state.
    function getSignatureState(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId
    ) external view returns (SignatureState memory);

    /// @dev Retrieves the signature state URI for a given type, context and issuer.
    /// @param typeId Type identifier.
    /// @param contextId Context identifier.
    /// @param issuerId Unique identifier for the issuer.
    /// @return The URI of the signature state.
    function getSignatureStateURI(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId
    ) external view returns (string memory);

    /// @dev Retrieves the signature state root for a given type, context and issuer.
    /// @param typeId Type identifier.
    /// @param contextId Context identifier.
    /// @param issuerId Unique identifier for the issuer.
    /// @return The root hash of the signature state.
    function getSignatureStateRoot(uint160 typeId, uint160 contextId, uint256 issuerId) external view returns (bytes32);
}
