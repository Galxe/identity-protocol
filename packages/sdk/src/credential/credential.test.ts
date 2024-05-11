import { describe, expect, it } from "vitest";
import { parseCredType } from "./credType";
import { babyzk } from "../babyzk";
import { Credential, Header, Body, SignatureMetadata, VerificationStackEnum } from "./credential";
import { PropType, ScalarType } from "./claimType";
import { ScalarValue, BoolValue, PropValue } from "./claimValue";
import { unwrap } from "../errors";
import { decodeFromHex } from "../utils";

// prepare babyzk
// @ts-expect-error WIP incorrect test ts setup, Top-level await is actually supported during tests.
await babyzk.prepare();

const tpStr = "token_balance:uint<256>;birthday:uint<64>;status:prop<8,c>;followed:bool;";
const typeID = BigInt(778);
const skStr = "0xfd60ceb442aca7f74d2e56c1f0e93507798e8a6e02c4cd1a5585a36167fa7b03";

function exampleUnsignedCred(withAttachment = false) {
  const tp = unwrap(parseCredType(tpStr));
  tp.typeID = typeID;
  const contextID = BigInt(666);
  const userID = BigInt(9);
  const header = new Header(BigInt(1), typeID, contextID, userID);
  const claimValues = [
    new ScalarValue(tp.claims[0]?.type as ScalarType, BigInt(100)),
    new ScalarValue(tp.claims[1]?.type as ScalarType, BigInt(200)),
    new PropValue(tp.claims[2]?.type as PropType, "middle-class", BigInt(2)),
    new BoolValue(true),
  ];
  const body = new Body(tp, claimValues);
  const cred = new Credential(header, body);
  if (withAttachment) {
    cred.attachments["1"] = "uno";
    cred.attachments["2"] = "two";
  }
  return cred;
}

function exampleSignedCred(withAttachment = false) {
  const cred = exampleUnsignedCred(withAttachment);
  const expiration = BigInt(100);
  const identityCommitment = BigInt(123);
  const issuerID = BigInt(456);
  const sk = decodeFromHex(skStr);
  const pk = babyzk.toPubKey(sk);
  const sigMetadata = new SignatureMetadata(
    VerificationStackEnum.BabyZK,
    BigInt(999),
    expiration,
    identityCommitment,
    issuerID,
    BigInt(0),
    pk
  );
  cred.sign(babyzk, sk, sigMetadata);
  return cred;
}

describe("credential signature", () => {
  it("should sign and verify, when no attachments", async () => {
    const cred = exampleSignedCred();
    expect(cred.verify(babyzk)).toEqual(true);
  });
  it("should sign verify, with attachments", async () => {
    const cred = exampleSignedCred(true);
    expect(cred.verify(babyzk, 0, true)).toEqual(true);
  });
  it("should catch, modified body", async () => {
    const cred = exampleSignedCred();
    cred.body.values[0] = new ScalarValue(new ScalarType(96), BigInt(101));
    expect(cred.verify(babyzk, 0, true)).toEqual(false);
  });
  it("should catch, modified attachments", async () => {
    const cred = exampleSignedCred();
    cred.attachments["1"] = "one";
    expect(cred.verify(babyzk, 0, true)).toEqual(false);
  });
  it("should let it go, modified attachments, but don't care", async () => {
    const cred = exampleSignedCred();
    cred.attachments["1"] = "one";
    expect(cred.verify(babyzk, 0, false)).toEqual(true);
  });
});

describe("Credential serialization", () => {
  it("should do JSON marshal unmarshal unsigned, no attachments", async () => {
    const expected = `{
  "header": {
    "version": "1",
    "type": "778",
    "context": "666",
    "id": "9"
  },
  "body": {
    "token_balance": "100",
    "birthday": "200",
    "status": {
      "str": "middle-class",
      "value": "2"
    },
    "followed": "true"
  },
  "signatures": []
}`;
    const cred = exampleUnsignedCred();
    expect(cred.marshal(2)).toEqual(expected);
    // unmarshal back
    const tp = unwrap(parseCredType(tpStr));
    tp.typeID = typeID;
    expect(unwrap(Credential.unmarshal(tp, expected))).toEqual(cred);
  });

  it("should do JSON marshal unmarshal unsigned, with attachments", async () => {
    const expected = `{
  "header": {
    "version": "1",
    "type": "778",
    "context": "666",
    "id": "9"
  },
  "body": {
    "token_balance": "100",
    "birthday": "200",
    "status": {
      "str": "middle-class",
      "value": "2"
    },
    "followed": "true"
  },
  "signatures": [],
  "attachments": {
    "1": "uno",
    "2": "two"
  }
}`;
    const cred = exampleUnsignedCred(true);
    expect(cred.marshal(2)).toEqual(expected);
    // unmarshal back
    const tp = unwrap(parseCredType(tpStr));
    tp.typeID = typeID;
    expect(unwrap(Credential.unmarshal(tp, expected))).toEqual(cred);
  });

  it("JSON marshal unmarshal signed, with no attachments", async () => {
    const expected = `{
  "header": {
    "version": "1",
    "type": "778",
    "context": "666",
    "id": "9"
  },
  "body": {
    "token_balance": "100",
    "birthday": "200",
    "status": {
      "str": "middle-class",
      "value": "2"
    },
    "followed": "true"
  },
  "signatures": [
    {
      "metadata": {
        "verification_stack": 1,
        "signature_id": "999",
        "expired_at": "100",
        "identity_commitment": "123",
        "issuer_id": "456",
        "chain_id": "0",
        "public_key": "GtrdrhiIorbpEkCJb15QN5UgE392xCR1Uhet4A+LLRhaBakE10XuJGktkc90Ql1CcYF+ZOYwEVRp8/KJ0NBrLw=="
      },
      "signature": "iCmO5KmV7UNFQ2hCf8zTZaCD+2qq7bdgrKhCcyhXwZFBRcQCecq0zoWBvKiuIe8iAJJpwehV86cJE8jBHbfDAw=="
    }
  ]
}`;
    const cred2 = exampleSignedCred();
    expect(cred2.marshal(2)).toEqual(expected);
    // unmarshal back
    const tp = unwrap(parseCredType(tpStr));
    tp.typeID = typeID;
    expect(unwrap(Credential.unmarshal(tp, expected))).toEqual(cred2);
  });

  it("JSON marshal unmarshal signed, with no attachments", async () => {
    const expected = `{
  "header": {
    "version": "1",
    "type": "778",
    "context": "666",
    "id": "9"
  },
  "body": {
    "token_balance": "100",
    "birthday": "200",
    "status": {
      "str": "middle-class",
      "value": "2"
    },
    "followed": "true"
  },
  "signatures": [
    {
      "metadata": {
        "verification_stack": 1,
        "signature_id": "999",
        "expired_at": "100",
        "identity_commitment": "123",
        "issuer_id": "456",
        "chain_id": "0",
        "public_key": "GtrdrhiIorbpEkCJb15QN5UgE392xCR1Uhet4A+LLRhaBakE10XuJGktkc90Ql1CcYF+ZOYwEVRp8/KJ0NBrLw=="
      },
      "signature": "iCmO5KmV7UNFQ2hCf8zTZaCD+2qq7bdgrKhCcyhXwZFBRcQCecq0zoWBvKiuIe8iAJJpwehV86cJE8jBHbfDAw==",
      "attachmentsSignature": "y91p415cC0G0OeLawJtUwPXzsz7CjkB+atP4xAHb15LyJM8zpZuESPQTrB/NAXaYBD/9M9iCT59VRqaq7wzzBQ=="
    }
  ],
  "attachments": {
    "1": "uno",
    "2": "two"
  }
}`;
    const cred2 = exampleSignedCred(true);
    expect(cred2.marshal(2)).toEqual(expected);
    // unmarshal back
    const tp = unwrap(parseCredType(tpStr));
    tp.typeID = typeID;
    expect(unwrap(Credential.unmarshal(tp, expected))).toEqual(cred2);
  });
});
