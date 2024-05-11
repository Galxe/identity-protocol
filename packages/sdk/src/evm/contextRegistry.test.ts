import { ContextRegistry__factory } from "@galxe-identity-protocol/evm-contracts";
import { ContextRegistry } from "./contextRegistry";
import { Signer } from "ethers";

import { describe, expect, it, beforeEach } from "vitest";
import { etherProvider } from "../testutils";

describe("ContextRegsitry", () => {
  let registry: ContextRegistry;
  let sender: Signer;

  beforeEach(async () => {
    const { accounts } = await etherProvider();
    sender = accounts[0] as Signer;
    const factory = new ContextRegistry__factory(sender);
    const ctxReg = await factory.deploy();
    registry = new ContextRegistry(await ctxReg.getAddress(), { signerOrProvider: sender });
  });

  describe("register context", () => {
    it("successful", async () => {
      const tx = await registry.registerContext("context");
      await tx.wait();
    });

    it("revert due to pre-existing context", async () => {
      const tx = await registry.registerContext("context");
      await tx.wait();

      expect(async () => {
        const dupContextTx = await registry.registerContext("context");
        await dupContextTx.wait();
      }).rejects.toThrow();
    });
  });

  describe("get context", () => {
    it("non-existing context", async () => {
      const emptyContext = await registry.getContext(0n);
      expect(emptyContext).equal("");
    });

    it("existing context", async () => {
      const tx = await registry.registerContext("context");
      const cid = await tx.wait();
      const context = await registry.getContext(cid);
      expect(context).equal("context");
    });
  });

  describe("calculate context ID", () => {
    it("successful", async () => {
      const contextID = await registry.calculateContextID("context");
      expect(contextID).equal(225292089491028336995226647635233634861439885511n);
    });
  });
});
