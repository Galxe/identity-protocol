// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { ITypeRegistry, CredentialType, CredentialTypeMiscConfig } from "./interfaces/ITypeRegistry.sol";
import { IProofVerifier } from "./interfaces/IProofVerifier.sol";
import { IPublicSignalGetter } from "./interfaces/IPublicSignalGetter.sol";

/**
 * @title TypeRegistry
 * @dev A contract that allows the registration of credential types.
 *      Credential types are unique per creator and type name.
 * @notice Getters in this contract does not do any parameter validation,
 *         so callers should validate the inputs and outputs and uninitialized values will be zero.
 */
contract TypeRegistry is ITypeRegistry, Ownable {
    error TypeAlreadyExists();
    error TypeDoesNotExist();
    error InvalidTypeName();
    error NotTypeOwner();

    /// @dev mapping from typeID to CredentialType.
    mapping(uint160 typeId => CredentialType credType) private _credTypes;

    /// @dev mapping from typeID to its verification stack's verifier.
    /// @dev verifier typeID => verificationStackID => verifier
    mapping(uint160 typeId => mapping(uint8 veriStackId => IProofVerifier verifier)) private _verifiers;

    /// @dev mapping from typeID to its verification stack's intrinsic value .
    /// @dev verifier typeID => verificationStackID => verifier
    mapping(uint160 typeId => mapping(uint8 veriStackId => IPublicSignalGetter psGetter)) private _psGetters;

    /// @param admin admin of the contract
    constructor(address admin) {
        transferOwnership(admin);
    }

    /// @notice set a primitive type, only callable by the admin.
    /// @param typeId the type id of the primitive type
    /// @param name name of the type
    /// @param definition definition string
    /// @param description description of the type
    /// @param resourceURI mutable resource URI of the type
    /// @param config misc config for the type
    function setPrimitiveType(
        uint160 typeId,
        string calldata name,
        string calldata definition,
        string calldata description,
        string calldata resourceURI,
        CredentialTypeMiscConfig calldata config
    ) external override onlyOwner {
        // check if the type is already set by others.
        // primitive type will have its creator as 0x0.
        if (bytes(_credTypes[typeId].name).length != 0) {
            revert TypeAlreadyExists();
        }
        if (bytes(name).length == 0) {
            revert InvalidTypeName();
        }
        // save type info
        _credTypes[typeId] = CredentialType({
            revocable: config.revocable,
            admin: address(0),
            name: name,
            definition: definition,
            description: description,
            resourceURI: resourceURI
        });
        emit TypeRegistered(typeId, address(0), name, definition, description, resourceURI);
        // add verifier and public signal getter
        _verifiers[typeId][config.verificationStackId] = config.verifier;
        emit TypeVerifierUpdated(typeId, config.verificationStackId, address(config.verifier));
        _psGetters[typeId][config.verificationStackId] = config.publicSignalGetter;
        emit TypePublicSignalGetterUpdated(typeId, config.verificationStackId, address(config.publicSignalGetter));
    }

    /// @dev register a new type by msg.sender
    /// @param name type name
    /// @param definition type definition string, immutable
    /// @param description description of the type, immutable
    /// @param resourceURI resource URI of the type, mutable
    /// @return typeID of the registered type
    function registerType(
        bool revocable,
        string calldata name,
        string calldata definition,
        string calldata description,
        string calldata resourceURI
    ) external override returns (uint160) {
        return _registerType(revocable, name, definition, description, resourceURI);
    }

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
    ) external override returns (uint160) {
        uint160 typeId = _registerType(revocable, name, definition, description, resourceURI);
        // add verifier and public signal getter
        _verifiers[typeId][verificationStackId] = verifier;
        emit TypeVerifierUpdated(typeId, verificationStackId, address(verifier));
        _psGetters[typeId][verificationStackId] = publicSignalGetter;
        emit TypePublicSignalGetterUpdated(typeId, verificationStackId, address(publicSignalGetter));
        return typeId;
    }

    /// @dev register a new type by msg.sender
    /// @param name type name
    /// @param definition type definition string, immutable
    /// @param description description of the type, immutable
    /// @param resourceURI resource URI of the type, mutable
    /// @return typeID of the registered type
    function _registerType(
        bool revocable,
        string calldata name,
        string calldata definition,
        string calldata description,
        string calldata resourceURI
    ) internal returns (uint160) {
        uint160 credTypeID = _calcTypeID(msg.sender, name);
        if (bytes(_credTypes[credTypeID].name).length != 0) {
            revert TypeAlreadyExists();
        }
        if (bytes(name).length == 0) {
            revert InvalidTypeName();
        }
        CredentialType memory credType = CredentialType({
            revocable: revocable,
            admin: msg.sender,
            name: name,
            definition: definition,
            description: description,
            resourceURI: resourceURI
        });
        _credTypes[credTypeID] = credType;
        emit TypeRegistered(
            credTypeID,
            credType.admin,
            credType.name,
            credType.definition,
            credType.description,
            credType.resourceURI
        );
        return credTypeID;
    }

    /// @dev check if the type is fully initialized for the given verification stack.
    /// @param typeId id of the type
    /// @param verificationStackId id the verification stack
    function isTypeFullyInitializedForStack(
        uint160 typeId,
        uint8 verificationStackId
    ) external view override returns (bool) {
        return
            _typeExists(typeId) &&
            _verifiers[typeId][verificationStackId] != IProofVerifier(address(0)) &&
            _psGetters[typeId][verificationStackId] != IPublicSignalGetter(address(0));
    }

    /// @dev transfer the ownership of a type.
    /// @param typeId type id of the type
    /// @param newAdmin address of the new admin
    function transferTypeAdmin(uint160 typeId, address newAdmin) external override onlyTypeOwner(typeId) {
        if (_credTypes[typeId].admin == address(0)) {
            // primitive type doesn't have an admin, so the owner can't transfer it.
            return;
        }
        _credTypes[typeId].admin = newAdmin;
        emit TypeAdminTransferred(typeId, msg.sender, newAdmin);
    }

    /// @dev update the resource URI of a type
    /// @param typeId of the type
    /// @param uri new resource URI
    /// TODO: resource URI specifcation: support multiple verification stack.
    function updateTypeResourceURI(uint160 typeId, string calldata uri) external override onlyTypeOwner(typeId) {
        emit TypeResourceURIUpdated(typeId, _credTypes[typeId].resourceURI, uri);
        _credTypes[typeId].resourceURI = uri;
    }

    /// @dev update the verifier for a type
    function updateTypeVerifier(
        uint160 typeId,
        uint8 verificationStackId,
        IProofVerifier verifier
    ) external override onlyTypeOwner(typeId) {
        _verifiers[typeId][verificationStackId] = verifier;
        emit TypeVerifierUpdated(typeId, verificationStackId, address(verifier));
    }

    /// @dev update the public signal getter for a type
    /// @param typeId id of the type
    /// @param verificationStackId id of the verification stack
    /// @param getter the address of the public signal getter
    function updateTypePublicSignalGetter(
        uint160 typeId,
        uint8 verificationStackId,
        IPublicSignalGetter getter
    ) external override onlyTypeOwner(typeId) {
        _psGetters[typeId][verificationStackId] = getter;
        emit TypePublicSignalGetterUpdated(typeId, verificationStackId, address(getter));
    }

    /// @dev get the type for the given typeID
    function getType(uint160 _id) external view override returns (CredentialType memory) {
        return _credTypes[_id];
    }

    /// @dev Retrieve the admin of a type
    /// @param typeId type id of the type
    /// @return address of the admin of the type
    function getTypeAdmin(uint160 typeId) external view override returns (address) {
        /// uninitialized type, return 0x0
        if (!_typeExists(typeId)) {
            return address(0);
        }
        if (_credTypes[typeId].admin != address(0)) {
            return _credTypes[typeId].admin;
        }
        return owner();
    }

    /// @dev check if the type is revocable
    function isRevocable(uint160 typeId) external view override returns (bool) {
        return _credTypes[typeId].revocable;
    }

    /// @dev get the verifier for the given typeID and verificationStackID.
    function getVerifier(uint160 typeId, uint8 verificationStackId) external view override returns (IProofVerifier) {
        return _verifiers[typeId][verificationStackId];
    }

    /// @param typeId type id of the type
    /// @param verificationStackId verification stack id
    function getPublicSignalGetter(
        uint160 typeId,
        uint8 verificationStackId
    ) external view override returns (IPublicSignalGetter) {
        return _psGetters[typeId][verificationStackId];
    }

    /// @dev calculate the typeID of a type
    function calcTypeID(address creator, string calldata name) external pure override returns (uint160) {
        return _calcTypeID(creator, name);
    }

    /// @dev calculate the typeID of a type
    function _calcTypeID(address creator, string calldata name) private pure returns (uint160) {
        return uint160(uint256(keccak256(abi.encodePacked(creator, name))));
    }

    /// @dev check if the type exists
    function _typeExists(uint160 typeId) private view returns (bool) {
        return bytes(_credTypes[typeId].name).length != 0;
    }

    /// @dev check if the caller is the owner of the type
    function _onlyTypeOwner(uint160 typeId) private view {
        if (!_typeExists(typeId)) {
            revert TypeDoesNotExist();
        }
        // primitive type will have its creator as 0x0, so only the admin can update it.
        if (_credTypes[typeId].admin == address(0)) {
            if (msg.sender != owner()) {
                revert NotTypeOwner();
            }
            return;
        }
        if (_credTypes[typeId].admin != msg.sender) {
            revert NotTypeOwner();
        }
    }

    modifier onlyTypeOwner(uint160 typeId) {
        _onlyTypeOwner(typeId);
        _;
    }
}
