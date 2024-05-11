// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { IIssuerRegistry, Issuer, PublicKey, PublicKeyStatus, SignatureState } from "./interfaces/IIssuerRegistry.sol";

// IssuerRegistry is a contract that manages the issuers and their public keys and signature state.
contract IssuerRegistry is IIssuerRegistry {
    error IssuerAlreadyExists();
    error IssuerNotExists();
    error PublicKeyNotExists();
    error PublicKeyAlreadyExists();
    error NotIssuerOwner(address owner);
    error NotOwner();
    error InvalidName();

    /// @dev all issuers, isser id = uint256(caller)
    // mapping issuer id to issuer.
    mapping(uint256 isserId => Issuer issuer) private _issuers;

    // (issuerId, publickeyId) => PublicKey
    mapping(uint256 issuerId => mapping(uint256 publicKeyId => PublicKey publicKey)) private _issuerPublicKeys;

    // mapping of hash(credentialType, contextId, issuerId) => SignatureState.
    mapping(uint256 credHashValue => SignatureState sigStatus) private _revocableSigStates;

    /// @dev only issuer owner can call this function
    modifier onlyIssuerAdmin(uint256 issuerId) {
        _onlyIssuerAdmin(issuerId);
        _;
    }

    /// @dev only issuer owner can call this function
    function _onlyIssuerAdmin(uint256 issuerId) private view {
        if (!_issuerExists(issuerId)) {
            revert IssuerNotExists();
        }
        if (msg.sender != _issuers[issuerId].admin) {
            revert NotIssuerOwner(_issuers[issuerId].admin);
        }
    }

    /// @dev register a new issuer
    // @notice the issuerId is the address of the caller, so 1 address can only have 1 issuer.
    function registerIssuer(
        string calldata name,
        uint8 verificationStackId,
        uint256 publicKeyId,
        bytes calldata publicKeyRaw
    ) external override returns (uint256) {
        uint256 issuerId = uint256(uint160(msg.sender));
        // register new issuer
        _registerNewIssuer(issuerId, name);
        // add public key
        _setPublicKey(issuerId, verificationStackId, publicKeyId, publicKeyRaw);
        // transfer ownership
        return issuerId;
    }

    /// @dev transfer the admin of the issuer
    function transferIssuerAdmin(uint256 issuerId, address newOwner) external override onlyIssuerAdmin(issuerId) {
        _issuers[issuerId].admin = newOwner;
        emit IssuerAdminTransferred(issuerId, msg.sender, newOwner);
    }

    /// @dev add a new public key to the issuer.
    // @param issuerId the id of the issuer
    // @param verificationStackId the id of the verification stack
    // @param publicKeyId the id of the public key
    // @param publicKeyRaw the raw public key
    // @notice only the issuer admin can call this function
    // @notice the public key can only be added once, if incorrect, use a new key.
    function addPublicKey(
        uint256 issuerId,
        uint8 verificationStackId,
        uint256 publicKeyId,
        bytes calldata publicKeyRaw
    ) external override onlyIssuerAdmin(issuerId) {
        if (_publicKeyExists(issuerId, publicKeyId)) {
            revert PublicKeyAlreadyExists();
        }
        _setPublicKey(issuerId, verificationStackId, publicKeyId, publicKeyRaw);
    }

    /// @dev update the status of the public key.
    function updatePublicKeyStatus(
        uint256 issuerId,
        uint256 publicKeyId,
        PublicKeyStatus status
    ) external override onlyIssuerAdmin(issuerId) {
        if (!_publicKeyExists(issuerId, publicKeyId)) {
            revert PublicKeyNotExists();
        }

        _issuerPublicKeys[issuerId][publicKeyId].status = status;
        emit PublicKeyStatusUpdated(issuerId, publicKeyId, status);
    }

    /// @dev update the status of the public key.
    function updatePublicKeyVerificationStack(
        uint256 issuerId,
        uint256 publicKeyId,
        uint8 verificationStackId,
        bool enabled
    ) external override onlyIssuerAdmin(issuerId) {
        if (!_publicKeyExists(issuerId, publicKeyId)) {
            revert PublicKeyNotExists();
        }

        _issuerPublicKeys[issuerId][publicKeyId].enabledVerificationStacks[verificationStackId] = enabled;
        emit PublicKeyVerificationStackUpdated(issuerId, publicKeyId, verificationStackId, enabled);
    }

    /// @dev set the signature state URI
    function updateSignatureStateURI(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId,
        string calldata treeURI
    ) external override onlyIssuerAdmin(issuerId) {
        uint256 key = _calculateCredentialHash(typeId, contextId, issuerId);
        _revocableSigStates[key].treeURI = treeURI;
        emit SignatureStateURIUpdated(typeId, contextId, issuerId, treeURI);
    }

    /// @dev set the signature state root
    function updateSignatureState(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId,
        bytes32 root
    ) external override onlyIssuerAdmin(issuerId) {
        uint256 key = _calculateCredentialHash(typeId, contextId, issuerId);
        _revocableSigStates[key].root = root;
        emit SignatureStateRootUpdated(typeId, contextId, issuerId, root);
    }

    /// @dev set both the signature state URI and root.
    function setSignatureState(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId,
        string calldata treeURI,
        bytes32 root
    ) external override onlyIssuerAdmin(issuerId) {
        uint256 key = _calculateCredentialHash(typeId, contextId, issuerId);
        _revocableSigStates[key] = SignatureState({ treeURI: treeURI, root: root });
        emit SignatureStateURIUpdated(typeId, contextId, issuerId, treeURI);
        emit SignatureStateRootUpdated(typeId, contextId, issuerId, root);
    }

    /// @dev calculate the hash of the credential, which is the key of the revocableSigStates.
    function _calculateCredentialHash(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId
    ) private pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(typeId, contextId, issuerId)));
    }

    /// @dev register a new issuer
    // @param issuerId the id of the issuer
    // @param name the name of the issuer
    function _registerNewIssuer(uint256 issuerId, string calldata name) private {
        if (bytes(name).length == 0) {
            revert InvalidName();
        }
        if (_issuerExists(issuerId)) {
            revert IssuerAlreadyExists();
        }

        _issuers[issuerId] = Issuer({ name: name, admin: msg.sender });
        emit IssuerRegistered(issuerId, name);
        emit IssuerAdminTransferred(issuerId, address(0), msg.sender);
    }

    /// @dev add a new public key to the issuer
    // @param issuerId the id of the issuer
    // @param verificationStackId the id of the verification stack
    // @param publicKeyId the id of the public key
    // @param publicKeyRaw the raw public key
    function _setPublicKey(
        uint256 issuerId,
        uint8 verificationStackId,
        uint256 publicKeyId,
        bytes calldata publicKeyRaw
    ) private {
        mapping(uint256 => PublicKey) storage keys = _issuerPublicKeys[issuerId];
        keys[publicKeyId].enabledVerificationStacks[verificationStackId] = true;
        keys[publicKeyId].status = PublicKeyStatus.ACTIVE;
        keys[publicKeyId].raw = publicKeyRaw;

        emit PublicKeyStatusUpdated(issuerId, publicKeyId, PublicKeyStatus.ACTIVE);
        emit PublicKeyVerificationStackUpdated(issuerId, publicKeyId, verificationStackId, true);
    }

    /// @dev return the issuer, if not exists, revert.
    function getIssuer(uint256 issuerId) external view override returns (Issuer memory) {
        if (!_issuerExists(issuerId)) {
            revert IssuerNotExists();
        }
        return _issuers[issuerId];
    }

    /// @dev return the public key, if not exists, revert.
    function getPublicKeyRaw(uint256 issuerId, uint256 publicKeyId) external view override returns (bytes memory) {
        if (!_publicKeyExists(issuerId, publicKeyId)) {
            revert PublicKeyNotExists();
        }
        return _issuerPublicKeys[issuerId][publicKeyId].raw;
    }

    /// @dev return if public key is active. If public key is not exists, return false.
    function isPublicKeyActive(uint256 issuerId, uint256 publicKeyId) external view override returns (bool) {
        if (!_publicKeyExists(issuerId, publicKeyId)) {
            return false;
        }
        return _issuerPublicKeys[issuerId][publicKeyId].status == PublicKeyStatus.ACTIVE;
    }

    /// @dev return if public key is active for the verification stack. If public key is not exists, return false.
    function isPublicKeyActiveForStack(
        uint256 issuerId,
        uint256 publicKeyId,
        uint8 verificationStackId
    ) external view override returns (bool) {
        if (!_publicKeyExists(issuerId, publicKeyId)) {
            return false;
        }
        return
            _issuerPublicKeys[issuerId][publicKeyId].enabledVerificationStacks[verificationStackId] &&
            _issuerPublicKeys[issuerId][publicKeyId].status == PublicKeyStatus.ACTIVE;
    }

    /// @dev return the status of the public key, if not exists, returns UNINITIALIZED.
    function getSignatureState(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId
    ) external view override returns (SignatureState memory) {
        return _revocableSigStates[_calculateCredentialHash(typeId, contextId, issuerId)];
    }

    /// @dev return the status of the public key, if not exists, returns empty string.
    function getSignatureStateURI(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId
    ) external view override returns (string memory) {
        return _revocableSigStates[_calculateCredentialHash(typeId, contextId, issuerId)].treeURI;
    }

    /// @dev return the root of the signature state, if not exists, returns empty bytes.
    function getSignatureStateRoot(
        uint160 typeId,
        uint160 contextId,
        uint256 issuerId
    ) external view override returns (bytes32) {
        return _revocableSigStates[_calculateCredentialHash(typeId, contextId, issuerId)].root;
    }

    /// @dev internal function to check if the public key exists.
    function _publicKeyExists(uint256 issuerId, uint256 publicKeyId) internal view returns (bool) {
        return _issuerPublicKeys[issuerId][publicKeyId].status != PublicKeyStatus.UNINITIALIZED;
    }

    /// @dev internal function to check if the issuer exists.
    function _issuerExists(uint256 issuerId) internal view returns (bool) {
        return bytes(_issuers[issuerId].name).length != 0;
    }
}
