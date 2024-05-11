import { beforeAll, describe, expect, it } from "vitest";
import * as credType from "./credType";
import * as credential from "./credential";
import { unit, scalar, scalar256, boolean, property } from "./primitiveTypes";
import { unwrap } from "../errors";
import { babyzk } from "../babyzk";
import { decodeFromHex } from "@/utils";
import { TypeSpec } from "./credTypeUtils";

const skStr = "0xfd60ceb442aca7f74d2e56c1f0e93507798e8a6e02c4cd1a5585a36167fa7b03";

describe("primitive types", () => {
  beforeAll(async () => {
    await babyzk.prepare();
  });
  it("should able to create and sign primitive type", async () => {
    const cases: { spec: TypeSpec; body: credential.MarshaledBody }[] = [
      { spec: unit, body: {} },
      { spec: scalar, body: { val: "111" } },
      { spec: scalar256, body: { val: "222" } },
      { spec: boolean, body: { val: "1" } },
      { spec: property, body: { val: { str: "hahahah", value: "777" } } },
    ];
    for (const tpBody of cases) {
      const tp = unwrap(credType.createTypeFromSpec(tpBody.spec));
      const cred = unwrap(
        credential.Credential.create(
          {
            type: tp,
            contextID: 11n,
            userID: 22n,
          },
          tpBody.body
        )
      );
      const pk = decodeFromHex(skStr);
      const pubkey = babyzk.toPubKey(pk);
      cred.sign(
        babyzk,
        pk,
        new credential.SignatureMetadata(credential.VerificationStackEnum.BabyZK, 1n, 0n, 0n, 0n, 0n, pubkey)
      );
      expect(cred.isSigned()).toBe(true);
    }
  });
});
