import * as pb from "@/grpc/issuer/v1/issuer.js";

import { credential, claimValue, claimType } from "@galxe-identity-protocol/sdk";

export function unmarshalHeader(header: pb.Header): credential.Header {
  return new credential.Header(BigInt(header.version), BigInt(header.type), BigInt(header.context), BigInt(header.id));
}

export function unmarshalBody(body: pb.Body): credential.Body {
  const pbCredType = body.tp!;
  var revocable = 0;
  if (pbCredType.revocable != null) {
    revocable = +pbCredType.revocable!;
  }
  const typeID = BigInt(pbCredType.typeId);
  const claimDefs = pbCredType.claims.map(cd => unmarshalClaimDef(cd));

  return new credential.Body(
    {
      claims: claimDefs,
      revocable: revocable,
      typeID: typeID,
    },
    body.values!.map((cv, idx) => unmarshalClaimValue(cv, claimDefs[idx]!))
  );
}

function unmarshalClaimDef(cd: pb.ClaimDef): claimType.ClaimDef {
  const pbClaimType = cd.claimType!;

  pbClaimType.propertyType?.nEqualChecks;

  if (pbClaimType.booleanType != null) {
    return {
      name: cd.name!,
      type: new claimType.BoolType(),
    };
  } else if (pbClaimType.scalarType != null) {
    return {
      name: cd.name!,
      type: new claimType.ScalarType(+pbClaimType.scalarType.width),
    };
  } else if (pbClaimType.propertyType != null) {
    return {
      name: cd.name!,
      type: new claimType.PropType(
        +pbClaimType.propertyType.width,
        unmarshalPropHashEnum(pbClaimType.propertyType.hashAlgorithm),
        pbClaimType.propertyType.nEqualChecks ? +pbClaimType.propertyType.nEqualChecks : undefined
      ),
    };
  } else {
    throw "invalid claim def";
  }
}
function unmarshalPropHashEnum(pt: pb.PropHashEnum): claimType.PropHashEnum {
  switch (pt) {
    case pb.PropHashEnum.PROP_HASH_ENUM_CUSTOM:
      return claimType.PropHashEnum.Custom;
    case pb.PropHashEnum.PROP_HASH_ENUM_KECCAK256:
      return claimType.PropHashEnum.Keccak256;
    case pb.PropHashEnum.PROP_HASH_ENUM_POSEIDON:
      return claimType.PropHashEnum.Poseidon;
    default:
      throw "invalid prop hash enum";
  }
}

function unmarshalClaimValue(cv: pb.ClaimValue, claimDef: claimType.ClaimDef): claimValue.ClaimValue {
  if (cv.boolValue != null) {
    return new claimValue.BoolValue(cv.boolValue.value);
  } else if (cv.scalarValue != null) {
    return new claimValue.ScalarValue(claimDef.type as claimType.ScalarType, BigInt(cv.scalarValue.value));
  } else if (cv.propertyValue != null) {
    return new claimValue.PropValue(
      claimDef.type as claimType.PropType,
      cv.propertyValue.value,
      cv.propertyValue.hash ? BigInt(cv.propertyValue.hash) : undefined
    );
  } else {
    throw "invalid claim value";
  }
}
