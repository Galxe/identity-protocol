/* eslint-disable */
import { ChannelCredentials, Client, makeGenericClientConstructor, Metadata } from "@grpc/grpc-js";
import type {
  CallOptions,
  ClientOptions,
  ClientUnaryCall,
  handleUnaryCall,
  ServiceError,
  UntypedServiceImplementation,
} from "@grpc/grpc-js";
import Long from "long";
import _m0 from "protobufjs/minimal.js";

export enum ClaimTypeEnum {
  CLAIM_TYPE_ENUM_UNSPECIFIED = 0,
  CLAIM_TYPE_ENUM_SCALAR = 1,
  CLAIM_TYPE_ENUM_PROPERTY = 2,
  CLAIM_TYPE_ENUM_BOOLEAN = 3,
  UNRECOGNIZED = -1,
}

export function claimTypeEnumFromJSON(object: any): ClaimTypeEnum {
  switch (object) {
    case 0:
    case "CLAIM_TYPE_ENUM_UNSPECIFIED":
      return ClaimTypeEnum.CLAIM_TYPE_ENUM_UNSPECIFIED;
    case 1:
    case "CLAIM_TYPE_ENUM_SCALAR":
      return ClaimTypeEnum.CLAIM_TYPE_ENUM_SCALAR;
    case 2:
    case "CLAIM_TYPE_ENUM_PROPERTY":
      return ClaimTypeEnum.CLAIM_TYPE_ENUM_PROPERTY;
    case 3:
    case "CLAIM_TYPE_ENUM_BOOLEAN":
      return ClaimTypeEnum.CLAIM_TYPE_ENUM_BOOLEAN;
    case -1:
    case "UNRECOGNIZED":
    default:
      return ClaimTypeEnum.UNRECOGNIZED;
  }
}

export function claimTypeEnumToJSON(object: ClaimTypeEnum): string {
  switch (object) {
    case ClaimTypeEnum.CLAIM_TYPE_ENUM_UNSPECIFIED:
      return "CLAIM_TYPE_ENUM_UNSPECIFIED";
    case ClaimTypeEnum.CLAIM_TYPE_ENUM_SCALAR:
      return "CLAIM_TYPE_ENUM_SCALAR";
    case ClaimTypeEnum.CLAIM_TYPE_ENUM_PROPERTY:
      return "CLAIM_TYPE_ENUM_PROPERTY";
    case ClaimTypeEnum.CLAIM_TYPE_ENUM_BOOLEAN:
      return "CLAIM_TYPE_ENUM_BOOLEAN";
    case ClaimTypeEnum.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export enum PropHashEnum {
  PROP_HASH_ENUM_UNSPECIFIED = 0,
  PROP_HASH_ENUM_POSEIDON = 1,
  PROP_HASH_ENUM_KECCAK256 = 2,
  PROP_HASH_ENUM_CUSTOM = 3,
  UNRECOGNIZED = -1,
}

export function propHashEnumFromJSON(object: any): PropHashEnum {
  switch (object) {
    case 0:
    case "PROP_HASH_ENUM_UNSPECIFIED":
      return PropHashEnum.PROP_HASH_ENUM_UNSPECIFIED;
    case 1:
    case "PROP_HASH_ENUM_POSEIDON":
      return PropHashEnum.PROP_HASH_ENUM_POSEIDON;
    case 2:
    case "PROP_HASH_ENUM_KECCAK256":
      return PropHashEnum.PROP_HASH_ENUM_KECCAK256;
    case 3:
    case "PROP_HASH_ENUM_CUSTOM":
      return PropHashEnum.PROP_HASH_ENUM_CUSTOM;
    case -1:
    case "UNRECOGNIZED":
    default:
      return PropHashEnum.UNRECOGNIZED;
  }
}

export function propHashEnumToJSON(object: PropHashEnum): string {
  switch (object) {
    case PropHashEnum.PROP_HASH_ENUM_UNSPECIFIED:
      return "PROP_HASH_ENUM_UNSPECIFIED";
    case PropHashEnum.PROP_HASH_ENUM_POSEIDON:
      return "PROP_HASH_ENUM_POSEIDON";
    case PropHashEnum.PROP_HASH_ENUM_KECCAK256:
      return "PROP_HASH_ENUM_KECCAK256";
    case PropHashEnum.PROP_HASH_ENUM_CUSTOM:
      return "PROP_HASH_ENUM_CUSTOM";
    case PropHashEnum.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface PingRequest {
}

export interface PingResponse {
}

export interface ClaimType {
  scalarType?: ClaimType_ScalarType | undefined;
  propertyType?: ClaimType_PropertyType | undefined;
  booleanType?: ClaimType_BooleanType | undefined;
}

export interface ClaimType_ScalarType {
  width: string;
}

export interface ClaimType_PropertyType {
  width: string;
  hashAlgorithm: PropHashEnum;
  nEqualChecks?: string | undefined;
}

export interface ClaimType_BooleanType {
  value: boolean;
}

export interface ClaimDef {
  name: string;
  claimType?: ClaimType | undefined;
}

export interface CredType {
  claims: ClaimDef[];
  revocable?: string | undefined;
  typeId: string;
}

export interface ClaimValue {
  scalarValue?: ClaimValue_ScalarValue | undefined;
  propertyValue?: ClaimValue_PropertyValue | undefined;
  boolValue?: ClaimValue_BoolValue | undefined;
}

export interface ClaimValue_ScalarValue {
  value: string;
}

export interface ClaimValue_PropertyValue {
  value: string;
  hash?: string | undefined;
}

export interface ClaimValue_BoolValue {
  value: boolean;
}

export interface Header {
  version: string;
  type: string;
  context: string;
  id: string;
}

export interface Body {
  tp?: CredType | undefined;
  values: ClaimValue[];
}

export interface AttachmentSet {
  attachments: { [key: string]: string };
}

export interface AttachmentSet_AttachmentsEntry {
  key: string;
  value: string;
}

export interface GenerateSignedCredentialRequest {
  header?: Header | undefined;
  body?: Body | undefined;
  attachments?: AttachmentSet | undefined;
  chainId: string;
  identityCommitment: string;
  expiredAt: string;
}

export interface GenerateSignedCredentialResponse {
  signedCred: string;
}

function createBasePingRequest(): PingRequest {
  return {};
}

export const PingRequest = {
  encode(_: PingRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PingRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePingRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): PingRequest {
    return {};
  },

  toJSON(_: PingRequest): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<PingRequest>, I>>(base?: I): PingRequest {
    return PingRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<PingRequest>, I>>(_: I): PingRequest {
    const message = createBasePingRequest();
    return message;
  },
};

function createBasePingResponse(): PingResponse {
  return {};
}

export const PingResponse = {
  encode(_: PingResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PingResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePingResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): PingResponse {
    return {};
  },

  toJSON(_: PingResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<PingResponse>, I>>(base?: I): PingResponse {
    return PingResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<PingResponse>, I>>(_: I): PingResponse {
    const message = createBasePingResponse();
    return message;
  },
};

function createBaseClaimType(): ClaimType {
  return { scalarType: undefined, propertyType: undefined, booleanType: undefined };
}

export const ClaimType = {
  encode(message: ClaimType, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.scalarType !== undefined) {
      ClaimType_ScalarType.encode(message.scalarType, writer.uint32(10).fork()).ldelim();
    }
    if (message.propertyType !== undefined) {
      ClaimType_PropertyType.encode(message.propertyType, writer.uint32(18).fork()).ldelim();
    }
    if (message.booleanType !== undefined) {
      ClaimType_BooleanType.encode(message.booleanType, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClaimType {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClaimType();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.scalarType = ClaimType_ScalarType.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.propertyType = ClaimType_PropertyType.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.booleanType = ClaimType_BooleanType.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ClaimType {
    return {
      scalarType: isSet(object.scalarType) ? ClaimType_ScalarType.fromJSON(object.scalarType) : undefined,
      propertyType: isSet(object.propertyType) ? ClaimType_PropertyType.fromJSON(object.propertyType) : undefined,
      booleanType: isSet(object.booleanType) ? ClaimType_BooleanType.fromJSON(object.booleanType) : undefined,
    };
  },

  toJSON(message: ClaimType): unknown {
    const obj: any = {};
    if (message.scalarType !== undefined) {
      obj.scalarType = ClaimType_ScalarType.toJSON(message.scalarType);
    }
    if (message.propertyType !== undefined) {
      obj.propertyType = ClaimType_PropertyType.toJSON(message.propertyType);
    }
    if (message.booleanType !== undefined) {
      obj.booleanType = ClaimType_BooleanType.toJSON(message.booleanType);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ClaimType>, I>>(base?: I): ClaimType {
    return ClaimType.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ClaimType>, I>>(object: I): ClaimType {
    const message = createBaseClaimType();
    message.scalarType = (object.scalarType !== undefined && object.scalarType !== null)
      ? ClaimType_ScalarType.fromPartial(object.scalarType)
      : undefined;
    message.propertyType = (object.propertyType !== undefined && object.propertyType !== null)
      ? ClaimType_PropertyType.fromPartial(object.propertyType)
      : undefined;
    message.booleanType = (object.booleanType !== undefined && object.booleanType !== null)
      ? ClaimType_BooleanType.fromPartial(object.booleanType)
      : undefined;
    return message;
  },
};

function createBaseClaimType_ScalarType(): ClaimType_ScalarType {
  return { width: "0" };
}

export const ClaimType_ScalarType = {
  encode(message: ClaimType_ScalarType, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.width !== "0") {
      writer.uint32(8).int64(message.width);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClaimType_ScalarType {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClaimType_ScalarType();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.width = longToString(reader.int64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ClaimType_ScalarType {
    return { width: isSet(object.width) ? globalThis.String(object.width) : "0" };
  },

  toJSON(message: ClaimType_ScalarType): unknown {
    const obj: any = {};
    if (message.width !== "0") {
      obj.width = message.width;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ClaimType_ScalarType>, I>>(base?: I): ClaimType_ScalarType {
    return ClaimType_ScalarType.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ClaimType_ScalarType>, I>>(object: I): ClaimType_ScalarType {
    const message = createBaseClaimType_ScalarType();
    message.width = object.width ?? "0";
    return message;
  },
};

function createBaseClaimType_PropertyType(): ClaimType_PropertyType {
  return { width: "0", hashAlgorithm: 0, nEqualChecks: undefined };
}

export const ClaimType_PropertyType = {
  encode(message: ClaimType_PropertyType, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.width !== "0") {
      writer.uint32(8).int64(message.width);
    }
    if (message.hashAlgorithm !== 0) {
      writer.uint32(16).int32(message.hashAlgorithm);
    }
    if (message.nEqualChecks !== undefined) {
      writer.uint32(24).int64(message.nEqualChecks);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClaimType_PropertyType {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClaimType_PropertyType();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.width = longToString(reader.int64() as Long);
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.hashAlgorithm = reader.int32() as any;
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.nEqualChecks = longToString(reader.int64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ClaimType_PropertyType {
    return {
      width: isSet(object.width) ? globalThis.String(object.width) : "0",
      hashAlgorithm: isSet(object.hashAlgorithm) ? propHashEnumFromJSON(object.hashAlgorithm) : 0,
      nEqualChecks: isSet(object.nEqualChecks) ? globalThis.String(object.nEqualChecks) : undefined,
    };
  },

  toJSON(message: ClaimType_PropertyType): unknown {
    const obj: any = {};
    if (message.width !== "0") {
      obj.width = message.width;
    }
    if (message.hashAlgorithm !== 0) {
      obj.hashAlgorithm = propHashEnumToJSON(message.hashAlgorithm);
    }
    if (message.nEqualChecks !== undefined) {
      obj.nEqualChecks = message.nEqualChecks;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ClaimType_PropertyType>, I>>(base?: I): ClaimType_PropertyType {
    return ClaimType_PropertyType.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ClaimType_PropertyType>, I>>(object: I): ClaimType_PropertyType {
    const message = createBaseClaimType_PropertyType();
    message.width = object.width ?? "0";
    message.hashAlgorithm = object.hashAlgorithm ?? 0;
    message.nEqualChecks = object.nEqualChecks ?? undefined;
    return message;
  },
};

function createBaseClaimType_BooleanType(): ClaimType_BooleanType {
  return { value: false };
}

export const ClaimType_BooleanType = {
  encode(message: ClaimType_BooleanType, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.value !== false) {
      writer.uint32(8).bool(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClaimType_BooleanType {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClaimType_BooleanType();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.value = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ClaimType_BooleanType {
    return { value: isSet(object.value) ? globalThis.Boolean(object.value) : false };
  },

  toJSON(message: ClaimType_BooleanType): unknown {
    const obj: any = {};
    if (message.value !== false) {
      obj.value = message.value;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ClaimType_BooleanType>, I>>(base?: I): ClaimType_BooleanType {
    return ClaimType_BooleanType.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ClaimType_BooleanType>, I>>(object: I): ClaimType_BooleanType {
    const message = createBaseClaimType_BooleanType();
    message.value = object.value ?? false;
    return message;
  },
};

function createBaseClaimDef(): ClaimDef {
  return { name: "", claimType: undefined };
}

export const ClaimDef = {
  encode(message: ClaimDef, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.claimType !== undefined) {
      ClaimType.encode(message.claimType, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClaimDef {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClaimDef();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.claimType = ClaimType.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ClaimDef {
    return {
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      claimType: isSet(object.claimType) ? ClaimType.fromJSON(object.claimType) : undefined,
    };
  },

  toJSON(message: ClaimDef): unknown {
    const obj: any = {};
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.claimType !== undefined) {
      obj.claimType = ClaimType.toJSON(message.claimType);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ClaimDef>, I>>(base?: I): ClaimDef {
    return ClaimDef.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ClaimDef>, I>>(object: I): ClaimDef {
    const message = createBaseClaimDef();
    message.name = object.name ?? "";
    message.claimType = (object.claimType !== undefined && object.claimType !== null)
      ? ClaimType.fromPartial(object.claimType)
      : undefined;
    return message;
  },
};

function createBaseCredType(): CredType {
  return { claims: [], revocable: undefined, typeId: "" };
}

export const CredType = {
  encode(message: CredType, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.claims) {
      ClaimDef.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.revocable !== undefined) {
      writer.uint32(16).int64(message.revocable);
    }
    if (message.typeId !== "") {
      writer.uint32(26).string(message.typeId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CredType {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCredType();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.claims.push(ClaimDef.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.revocable = longToString(reader.int64() as Long);
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.typeId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): CredType {
    return {
      claims: globalThis.Array.isArray(object?.claims) ? object.claims.map((e: any) => ClaimDef.fromJSON(e)) : [],
      revocable: isSet(object.revocable) ? globalThis.String(object.revocable) : undefined,
      typeId: isSet(object.typeId) ? globalThis.String(object.typeId) : "",
    };
  },

  toJSON(message: CredType): unknown {
    const obj: any = {};
    if (message.claims?.length) {
      obj.claims = message.claims.map((e) => ClaimDef.toJSON(e));
    }
    if (message.revocable !== undefined) {
      obj.revocable = message.revocable;
    }
    if (message.typeId !== "") {
      obj.typeId = message.typeId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<CredType>, I>>(base?: I): CredType {
    return CredType.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<CredType>, I>>(object: I): CredType {
    const message = createBaseCredType();
    message.claims = object.claims?.map((e) => ClaimDef.fromPartial(e)) || [];
    message.revocable = object.revocable ?? undefined;
    message.typeId = object.typeId ?? "";
    return message;
  },
};

function createBaseClaimValue(): ClaimValue {
  return { scalarValue: undefined, propertyValue: undefined, boolValue: undefined };
}

export const ClaimValue = {
  encode(message: ClaimValue, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.scalarValue !== undefined) {
      ClaimValue_ScalarValue.encode(message.scalarValue, writer.uint32(10).fork()).ldelim();
    }
    if (message.propertyValue !== undefined) {
      ClaimValue_PropertyValue.encode(message.propertyValue, writer.uint32(18).fork()).ldelim();
    }
    if (message.boolValue !== undefined) {
      ClaimValue_BoolValue.encode(message.boolValue, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClaimValue {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClaimValue();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.scalarValue = ClaimValue_ScalarValue.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.propertyValue = ClaimValue_PropertyValue.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.boolValue = ClaimValue_BoolValue.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ClaimValue {
    return {
      scalarValue: isSet(object.scalarValue) ? ClaimValue_ScalarValue.fromJSON(object.scalarValue) : undefined,
      propertyValue: isSet(object.propertyValue) ? ClaimValue_PropertyValue.fromJSON(object.propertyValue) : undefined,
      boolValue: isSet(object.boolValue) ? ClaimValue_BoolValue.fromJSON(object.boolValue) : undefined,
    };
  },

  toJSON(message: ClaimValue): unknown {
    const obj: any = {};
    if (message.scalarValue !== undefined) {
      obj.scalarValue = ClaimValue_ScalarValue.toJSON(message.scalarValue);
    }
    if (message.propertyValue !== undefined) {
      obj.propertyValue = ClaimValue_PropertyValue.toJSON(message.propertyValue);
    }
    if (message.boolValue !== undefined) {
      obj.boolValue = ClaimValue_BoolValue.toJSON(message.boolValue);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ClaimValue>, I>>(base?: I): ClaimValue {
    return ClaimValue.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ClaimValue>, I>>(object: I): ClaimValue {
    const message = createBaseClaimValue();
    message.scalarValue = (object.scalarValue !== undefined && object.scalarValue !== null)
      ? ClaimValue_ScalarValue.fromPartial(object.scalarValue)
      : undefined;
    message.propertyValue = (object.propertyValue !== undefined && object.propertyValue !== null)
      ? ClaimValue_PropertyValue.fromPartial(object.propertyValue)
      : undefined;
    message.boolValue = (object.boolValue !== undefined && object.boolValue !== null)
      ? ClaimValue_BoolValue.fromPartial(object.boolValue)
      : undefined;
    return message;
  },
};

function createBaseClaimValue_ScalarValue(): ClaimValue_ScalarValue {
  return { value: "" };
}

export const ClaimValue_ScalarValue = {
  encode(message: ClaimValue_ScalarValue, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.value !== "") {
      writer.uint32(10).string(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClaimValue_ScalarValue {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClaimValue_ScalarValue();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.value = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ClaimValue_ScalarValue {
    return { value: isSet(object.value) ? globalThis.String(object.value) : "" };
  },

  toJSON(message: ClaimValue_ScalarValue): unknown {
    const obj: any = {};
    if (message.value !== "") {
      obj.value = message.value;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ClaimValue_ScalarValue>, I>>(base?: I): ClaimValue_ScalarValue {
    return ClaimValue_ScalarValue.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ClaimValue_ScalarValue>, I>>(object: I): ClaimValue_ScalarValue {
    const message = createBaseClaimValue_ScalarValue();
    message.value = object.value ?? "";
    return message;
  },
};

function createBaseClaimValue_PropertyValue(): ClaimValue_PropertyValue {
  return { value: "", hash: undefined };
}

export const ClaimValue_PropertyValue = {
  encode(message: ClaimValue_PropertyValue, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.value !== "") {
      writer.uint32(10).string(message.value);
    }
    if (message.hash !== undefined) {
      writer.uint32(18).string(message.hash);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClaimValue_PropertyValue {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClaimValue_PropertyValue();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.value = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.hash = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ClaimValue_PropertyValue {
    return {
      value: isSet(object.value) ? globalThis.String(object.value) : "",
      hash: isSet(object.hash) ? globalThis.String(object.hash) : undefined,
    };
  },

  toJSON(message: ClaimValue_PropertyValue): unknown {
    const obj: any = {};
    if (message.value !== "") {
      obj.value = message.value;
    }
    if (message.hash !== undefined) {
      obj.hash = message.hash;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ClaimValue_PropertyValue>, I>>(base?: I): ClaimValue_PropertyValue {
    return ClaimValue_PropertyValue.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ClaimValue_PropertyValue>, I>>(object: I): ClaimValue_PropertyValue {
    const message = createBaseClaimValue_PropertyValue();
    message.value = object.value ?? "";
    message.hash = object.hash ?? undefined;
    return message;
  },
};

function createBaseClaimValue_BoolValue(): ClaimValue_BoolValue {
  return { value: false };
}

export const ClaimValue_BoolValue = {
  encode(message: ClaimValue_BoolValue, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.value !== false) {
      writer.uint32(8).bool(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClaimValue_BoolValue {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClaimValue_BoolValue();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.value = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ClaimValue_BoolValue {
    return { value: isSet(object.value) ? globalThis.Boolean(object.value) : false };
  },

  toJSON(message: ClaimValue_BoolValue): unknown {
    const obj: any = {};
    if (message.value !== false) {
      obj.value = message.value;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ClaimValue_BoolValue>, I>>(base?: I): ClaimValue_BoolValue {
    return ClaimValue_BoolValue.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ClaimValue_BoolValue>, I>>(object: I): ClaimValue_BoolValue {
    const message = createBaseClaimValue_BoolValue();
    message.value = object.value ?? false;
    return message;
  },
};

function createBaseHeader(): Header {
  return { version: "0", type: "", context: "", id: "" };
}

export const Header = {
  encode(message: Header, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.version !== "0") {
      writer.uint32(8).uint64(message.version);
    }
    if (message.type !== "") {
      writer.uint32(18).string(message.type);
    }
    if (message.context !== "") {
      writer.uint32(26).string(message.context);
    }
    if (message.id !== "") {
      writer.uint32(34).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Header {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHeader();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.version = longToString(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.type = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.context = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Header {
    return {
      version: isSet(object.version) ? globalThis.String(object.version) : "0",
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      context: isSet(object.context) ? globalThis.String(object.context) : "",
      id: isSet(object.id) ? globalThis.String(object.id) : "",
    };
  },

  toJSON(message: Header): unknown {
    const obj: any = {};
    if (message.version !== "0") {
      obj.version = message.version;
    }
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.context !== "") {
      obj.context = message.context;
    }
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Header>, I>>(base?: I): Header {
    return Header.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Header>, I>>(object: I): Header {
    const message = createBaseHeader();
    message.version = object.version ?? "0";
    message.type = object.type ?? "";
    message.context = object.context ?? "";
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseBody(): Body {
  return { tp: undefined, values: [] };
}

export const Body = {
  encode(message: Body, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.tp !== undefined) {
      CredType.encode(message.tp, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.values) {
      ClaimValue.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Body {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.tp = CredType.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.values.push(ClaimValue.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Body {
    return {
      tp: isSet(object.tp) ? CredType.fromJSON(object.tp) : undefined,
      values: globalThis.Array.isArray(object?.values) ? object.values.map((e: any) => ClaimValue.fromJSON(e)) : [],
    };
  },

  toJSON(message: Body): unknown {
    const obj: any = {};
    if (message.tp !== undefined) {
      obj.tp = CredType.toJSON(message.tp);
    }
    if (message.values?.length) {
      obj.values = message.values.map((e) => ClaimValue.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Body>, I>>(base?: I): Body {
    return Body.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Body>, I>>(object: I): Body {
    const message = createBaseBody();
    message.tp = (object.tp !== undefined && object.tp !== null) ? CredType.fromPartial(object.tp) : undefined;
    message.values = object.values?.map((e) => ClaimValue.fromPartial(e)) || [];
    return message;
  },
};

function createBaseAttachmentSet(): AttachmentSet {
  return { attachments: {} };
}

export const AttachmentSet = {
  encode(message: AttachmentSet, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    Object.entries(message.attachments).forEach(([key, value]) => {
      AttachmentSet_AttachmentsEntry.encode({ key: key as any, value }, writer.uint32(10).fork()).ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AttachmentSet {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAttachmentSet();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          const entry1 = AttachmentSet_AttachmentsEntry.decode(reader, reader.uint32());
          if (entry1.value !== undefined) {
            message.attachments[entry1.key] = entry1.value;
          }
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): AttachmentSet {
    return {
      attachments: isObject(object.attachments)
        ? Object.entries(object.attachments).reduce<{ [key: string]: string }>((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {})
        : {},
    };
  },

  toJSON(message: AttachmentSet): unknown {
    const obj: any = {};
    if (message.attachments) {
      const entries = Object.entries(message.attachments);
      if (entries.length > 0) {
        obj.attachments = {};
        entries.forEach(([k, v]) => {
          obj.attachments[k] = v;
        });
      }
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<AttachmentSet>, I>>(base?: I): AttachmentSet {
    return AttachmentSet.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<AttachmentSet>, I>>(object: I): AttachmentSet {
    const message = createBaseAttachmentSet();
    message.attachments = Object.entries(object.attachments ?? {}).reduce<{ [key: string]: string }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = globalThis.String(value);
        }
        return acc;
      },
      {},
    );
    return message;
  },
};

function createBaseAttachmentSet_AttachmentsEntry(): AttachmentSet_AttachmentsEntry {
  return { key: "", value: "" };
}

export const AttachmentSet_AttachmentsEntry = {
  encode(message: AttachmentSet_AttachmentsEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== "") {
      writer.uint32(18).string(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AttachmentSet_AttachmentsEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAttachmentSet_AttachmentsEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.key = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.value = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): AttachmentSet_AttachmentsEntry {
    return {
      key: isSet(object.key) ? globalThis.String(object.key) : "",
      value: isSet(object.value) ? globalThis.String(object.value) : "",
    };
  },

  toJSON(message: AttachmentSet_AttachmentsEntry): unknown {
    const obj: any = {};
    if (message.key !== "") {
      obj.key = message.key;
    }
    if (message.value !== "") {
      obj.value = message.value;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<AttachmentSet_AttachmentsEntry>, I>>(base?: I): AttachmentSet_AttachmentsEntry {
    return AttachmentSet_AttachmentsEntry.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<AttachmentSet_AttachmentsEntry>, I>>(
    object: I,
  ): AttachmentSet_AttachmentsEntry {
    const message = createBaseAttachmentSet_AttachmentsEntry();
    message.key = object.key ?? "";
    message.value = object.value ?? "";
    return message;
  },
};

function createBaseGenerateSignedCredentialRequest(): GenerateSignedCredentialRequest {
  return {
    header: undefined,
    body: undefined,
    attachments: undefined,
    chainId: "0",
    identityCommitment: "",
    expiredAt: "",
  };
}

export const GenerateSignedCredentialRequest = {
  encode(message: GenerateSignedCredentialRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.header !== undefined) {
      Header.encode(message.header, writer.uint32(10).fork()).ldelim();
    }
    if (message.body !== undefined) {
      Body.encode(message.body, writer.uint32(18).fork()).ldelim();
    }
    if (message.attachments !== undefined) {
      AttachmentSet.encode(message.attachments, writer.uint32(26).fork()).ldelim();
    }
    if (message.chainId !== "0") {
      writer.uint32(32).uint64(message.chainId);
    }
    if (message.identityCommitment !== "") {
      writer.uint32(42).string(message.identityCommitment);
    }
    if (message.expiredAt !== "") {
      writer.uint32(50).string(message.expiredAt);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GenerateSignedCredentialRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGenerateSignedCredentialRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.header = Header.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.body = Body.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.attachments = AttachmentSet.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.chainId = longToString(reader.uint64() as Long);
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.identityCommitment = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.expiredAt = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GenerateSignedCredentialRequest {
    return {
      header: isSet(object.header) ? Header.fromJSON(object.header) : undefined,
      body: isSet(object.body) ? Body.fromJSON(object.body) : undefined,
      attachments: isSet(object.attachments) ? AttachmentSet.fromJSON(object.attachments) : undefined,
      chainId: isSet(object.chainId) ? globalThis.String(object.chainId) : "0",
      identityCommitment: isSet(object.identityCommitment) ? globalThis.String(object.identityCommitment) : "",
      expiredAt: isSet(object.expiredAt) ? globalThis.String(object.expiredAt) : "",
    };
  },

  toJSON(message: GenerateSignedCredentialRequest): unknown {
    const obj: any = {};
    if (message.header !== undefined) {
      obj.header = Header.toJSON(message.header);
    }
    if (message.body !== undefined) {
      obj.body = Body.toJSON(message.body);
    }
    if (message.attachments !== undefined) {
      obj.attachments = AttachmentSet.toJSON(message.attachments);
    }
    if (message.chainId !== "0") {
      obj.chainId = message.chainId;
    }
    if (message.identityCommitment !== "") {
      obj.identityCommitment = message.identityCommitment;
    }
    if (message.expiredAt !== "") {
      obj.expiredAt = message.expiredAt;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GenerateSignedCredentialRequest>, I>>(base?: I): GenerateSignedCredentialRequest {
    return GenerateSignedCredentialRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GenerateSignedCredentialRequest>, I>>(
    object: I,
  ): GenerateSignedCredentialRequest {
    const message = createBaseGenerateSignedCredentialRequest();
    message.header = (object.header !== undefined && object.header !== null)
      ? Header.fromPartial(object.header)
      : undefined;
    message.body = (object.body !== undefined && object.body !== null) ? Body.fromPartial(object.body) : undefined;
    message.attachments = (object.attachments !== undefined && object.attachments !== null)
      ? AttachmentSet.fromPartial(object.attachments)
      : undefined;
    message.chainId = object.chainId ?? "0";
    message.identityCommitment = object.identityCommitment ?? "";
    message.expiredAt = object.expiredAt ?? "";
    return message;
  },
};

function createBaseGenerateSignedCredentialResponse(): GenerateSignedCredentialResponse {
  return { signedCred: "" };
}

export const GenerateSignedCredentialResponse = {
  encode(message: GenerateSignedCredentialResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.signedCred !== "") {
      writer.uint32(10).string(message.signedCred);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GenerateSignedCredentialResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGenerateSignedCredentialResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.signedCred = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GenerateSignedCredentialResponse {
    return { signedCred: isSet(object.signedCred) ? globalThis.String(object.signedCred) : "" };
  },

  toJSON(message: GenerateSignedCredentialResponse): unknown {
    const obj: any = {};
    if (message.signedCred !== "") {
      obj.signedCred = message.signedCred;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GenerateSignedCredentialResponse>, I>>(
    base?: I,
  ): GenerateSignedCredentialResponse {
    return GenerateSignedCredentialResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GenerateSignedCredentialResponse>, I>>(
    object: I,
  ): GenerateSignedCredentialResponse {
    const message = createBaseGenerateSignedCredentialResponse();
    message.signedCred = object.signedCred ?? "";
    return message;
  },
};

export type IssuerServiceService = typeof IssuerServiceService;
export const IssuerServiceService = {
  ping: {
    path: "/issuer.v1.IssuerService/Ping",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: PingRequest) => Buffer.from(PingRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => PingRequest.decode(value),
    responseSerialize: (value: PingResponse) => Buffer.from(PingResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => PingResponse.decode(value),
  },
  generateSignedCredential: {
    path: "/issuer.v1.IssuerService/GenerateSignedCredential",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GenerateSignedCredentialRequest) =>
      Buffer.from(GenerateSignedCredentialRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GenerateSignedCredentialRequest.decode(value),
    responseSerialize: (value: GenerateSignedCredentialResponse) =>
      Buffer.from(GenerateSignedCredentialResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GenerateSignedCredentialResponse.decode(value),
  },
} as const;

export interface IssuerServiceServer extends UntypedServiceImplementation {
  ping: handleUnaryCall<PingRequest, PingResponse>;
  generateSignedCredential: handleUnaryCall<GenerateSignedCredentialRequest, GenerateSignedCredentialResponse>;
}

export interface IssuerServiceClient extends Client {
  ping(request: PingRequest, callback: (error: ServiceError | null, response: PingResponse) => void): ClientUnaryCall;
  ping(
    request: PingRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: PingResponse) => void,
  ): ClientUnaryCall;
  ping(
    request: PingRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: PingResponse) => void,
  ): ClientUnaryCall;
  generateSignedCredential(
    request: GenerateSignedCredentialRequest,
    callback: (error: ServiceError | null, response: GenerateSignedCredentialResponse) => void,
  ): ClientUnaryCall;
  generateSignedCredential(
    request: GenerateSignedCredentialRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GenerateSignedCredentialResponse) => void,
  ): ClientUnaryCall;
  generateSignedCredential(
    request: GenerateSignedCredentialRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GenerateSignedCredentialResponse) => void,
  ): ClientUnaryCall;
}

export const IssuerServiceClient = makeGenericClientConstructor(
  IssuerServiceService,
  "issuer.v1.IssuerService",
) as unknown as {
  new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): IssuerServiceClient;
  service: typeof IssuerServiceService;
  serviceName: string;
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function longToString(long: Long) {
  return long.toString();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isObject(value: any): boolean {
  return typeof value === "object" && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
