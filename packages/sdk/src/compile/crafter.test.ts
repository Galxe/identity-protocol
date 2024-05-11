import { describe, expect, it } from "vitest";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { compileByCrafter, CrafterCompileCircomResponseData } from "@/compile/crafter";
import { CompileError, ErrorName } from "@/errors";

describe("circom", () => {
  const tid = "123";
  const name = "circom cred";
  const circom = "pragma circom 2.1.5;";

  it("compile success", async () => {
    const mock = new MockAdapter(axios);
    const mockData = {
      circom: "ipfs://galxe-protocol/123/circom/credential.circom",
      verificationKey: "ipfs://galxe-protocol/123/circom/verification_key.json",
      wasm: "ipfs://galxe-protocol/123/circom/credential.wasm",
      zkey: "ipfs://galxe-protocol/123/circom/credential_final.zkey",
    };
    mock
      .onPost("/compile/circom", {
        typeId: tid,
        typeName: name,
        typeCircom: circom,
      })
      .reply(200, {
        code: 1,
        data: mockData,
      });

    const rst = await compileByCrafter<CrafterCompileCircomResponseData>("/compile/circom", {
      typeId: tid,
      typeName: name,
      typeCircom: circom,
    });
    expect(rst).deep.equal(mockData);
  });

  it("compile error", async () => {
    const mock = new MockAdapter(axios);
    mock
      .onPost("/compile/circom", {
        typeId: tid,
        typeName: name,
        typeCircom: circom,
      })
      .reply(200, {
        code: 0,
        error: "invalid circom",
      });

    await expect(
      compileByCrafter<CrafterCompileCircomResponseData>("/compile/circom", {
        typeId: tid,
        typeName: name,
        typeCircom: circom,
      })
    ).rejects.toThrowError(new CompileError(ErrorName.CompileFailed, "invalid circom"));
  });

  it("compile response error", async () => {
    const mock = new MockAdapter(axios);
    mock
      .onPost("/compile/circom", {
        typeId: tid,
        typeName: name,
        typeCircom: circom,
      })
      .reply(500, "internal server error");

    await expect(
      compileByCrafter<CrafterCompileCircomResponseData>("/compile/circom", {
        typeId: tid,
        typeName: name,
        typeCircom: circom,
      })
    ).rejects.toThrowError(new CompileError(ErrorName.CompileFailed, "crafter server error: internal server error"));
  });
});

describe("solidity", () => {
  const tid = "123";
  const solidity =
    "pragma solidity >=0.4.22 <0.9.0;\n\ncontract BabyZKGroth16Verifier {\n    uint storedData;\n\n    function set(uint x) public {\n        storedData = x;\n    }\n\n    function get() public view returns (uint) {\n        return storedData;\n    }\n}\n";

  it("compile solidity success", async () => {
    const mock = new MockAdapter(axios);
    const mockData = {
      solidity: "ipfs://galxe-protocol/123/solidity/verifier.circom",
      abi: "ipfs://galxe-protocol/123/solidity/verifier_abi.json",
    };
    mock
      .onPost("/compile/solidity", {
        typeId: tid,
        verifierSolidity: solidity,
      })
      .reply(200, {
        code: 1,
        data: mockData,
      });

    const rst = await compileByCrafter<CrafterCompileCircomResponseData>("/compile/solidity", {
      typeId: tid,
      verifierSolidity: solidity,
    });
    expect(rst).deep.equal(mockData);
  });

  it("compile solidity error", async () => {
    const mock = new MockAdapter(axios);
    mock
      .onPost("/compile/solidity", {
        typeId: tid,
        verifierSolidity: solidity,
      })
      .reply(200, {
        code: 0,
        error: "invalid solidity",
      });

    await expect(
      compileByCrafter<CrafterCompileCircomResponseData>("/compile/solidity", {
        typeId: tid,
        verifierSolidity: solidity,
      })
    ).rejects.toThrowError(new CompileError(ErrorName.CompileFailed, "invalid solidity"));
  });

  it("compile solidity response error", async () => {
    const mock = new MockAdapter(axios);
    mock
      .onPost("/compile/solidity", {
        typeId: tid,
        verifierSolidity: solidity,
      })
      .reply(500, "internal server error");

    await expect(
      compileByCrafter<CrafterCompileCircomResponseData>("/compile/solidity", {
        typeId: tid,
        verifierSolidity: solidity,
      })
    ).rejects.toThrowError(new CompileError(ErrorName.CompileFailed, "crafter server error: internal server error"));
  });
});
