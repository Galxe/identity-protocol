import { TypeRegistry__factory } from "@galxe-identity-protocol/evm-contracts";
import { Signer, ZeroAddress } from "ethers";
import { beforeEach, describe, it, expect } from "vitest";
import { TypeRegistry } from "./typeRegistry";
import { etherProvider } from "../testutils";

describe("TypeRegistry", () => {
  let user: Signer;
  let sender: Signer;
  let registry: TypeRegistry;

  beforeEach(async () => {
    const { accounts } = await etherProvider();
    sender = accounts[0] as Signer;
    user = accounts[1] as Signer;

    const factory = new TypeRegistry__factory(sender);
    const registryContract = await factory.deploy(sender.getAddress());
    registry = new TypeRegistry(await registryContract.getAddress(), { signerOrProvider: sender });
  });

  describe("set primitive type", () => {
    it("successful", async () => {
      const tx = await registry.setPrimitiveType(1n, "type1", "def1", "desc1", "uri1", {
        revocable: false,
        verificationStackId: 1n,
        verifier: user.getAddress(),
        publicSignalGetter: user.getAddress(),
      });
      await tx.wait();
    });

    it("revert due to empty type name", async () => {
      expect(async () => {
        const tx = await registry.setPrimitiveType(1n, "", "def1", "desc1", "uri1", {
          revocable: false,
          verificationStackId: 1n,
          verifier: user.getAddress(),
          publicSignalGetter: user.getAddress(),
        });
        await tx.wait();
      }).rejects.toThrow();
    });

    it("revert due to pre-existing type", async () => {
      const tx = await registry.setPrimitiveType(1n, "type1", "def1", "desc1", "uri1", {
        revocable: false,
        verificationStackId: 1n,
        verifier: user.getAddress(),
        publicSignalGetter: user.getAddress(),
      });
      await tx.wait();

      expect(async () => {
        const dupTypeTx = await registry.setPrimitiveType(1n, "type1", "def1", "desc1", "uri1", {
          revocable: false,
          verificationStackId: 1n,
          verifier: user.getAddress(),
          publicSignalGetter: user.getAddress(),
        });
        await dupTypeTx.wait();
      }).rejects.toThrow();
    });
  });

  describe("register type 1 step", () => {
    it("successful", async () => {
      const tx = await registry.registerType1Step(
        true,
        "name1",
        "def1",
        "desc1",
        "uri1",
        1n,
        user.getAddress(),
        user.getAddress()
      );
      await tx.wait();
    });

    it("revert due to empty type name", async () => {
      expect(async () => {
        const tx = await registry.registerType1Step(
          true,
          "",
          "def1",
          "desc1",
          "uri1",
          1n,
          user.getAddress(),
          user.getAddress()
        );
        await tx.wait();
      }).rejects.toThrow();
    });

    it("revert due to pre-existing type", async () => {
      const tx = await registry.registerType1Step(
        true,
        "name1",
        "def1",
        "desc1",
        "uri1",
        1n,
        user.getAddress(),
        user.getAddress()
      );
      await tx.wait();

      expect(async () => {
        const dupTypeTx = await registry.registerType1Step(
          true,
          "name1",
          "def1",
          "desc1",
          "uri1",
          1n,
          user.getAddress(),
          user.getAddress()
        );
        await dupTypeTx.wait();
      }).rejects.toThrow();
    });
  });

  describe("is type fully initialized for stack", () => {
    it("returns false for unregistered type", async () => {
      expect(await registry.isTypeFullyInitializedForStack(1, 1)).equal(false);
    });

    it("returns true for registered type", async () => {
      const tx = await registry.setPrimitiveType(1n, "type1", "def1", "desc1", "uri1", {
        revocable: false,
        verificationStackId: 1n,
        verifier: user.getAddress(),
        publicSignalGetter: user.getAddress(),
      });
      await tx.wait();

      expect(await registry.isTypeFullyInitializedForStack(1n, 1n)).equal(true);
    });

    it("returns false for type with missing verifier", async () => {
      const tx = await registry.setPrimitiveType(1n, "type1", "def1", "desc1", "uri1", {
        revocable: false,
        verificationStackId: 1n,
        verifier: ZeroAddress,
        publicSignalGetter: user.getAddress(),
      });
      await tx.wait();

      expect(await registry.isTypeFullyInitializedForStack(1n, 1n)).equal(false);
    });

    it("returns false for type with missing public signal getter", async () => {
      const tx = await registry.setPrimitiveType(1n, "type1", "def1", "desc1", "uri1", {
        revocable: false,
        verificationStackId: 1n,
        verifier: user.getAddress(),
        publicSignalGetter: ZeroAddress,
      });
      await tx.wait();

      expect(await registry.isTypeFullyInitializedForStack(1n, 1n)).equal(false);
    });
  });

  describe("transfer type admin", () => {
    it("successful", async () => {
      const tx1 = await registry.registerType1Step(
        true,
        "name1",
        "def1",
        "desc1",
        "uri1",
        1n,
        user.getAddress(),
        user.getAddress()
      );
      const typeID = await tx1.wait();

      const tx2 = await registry.transferTypeAdmin(typeID, user.getAddress());
      await tx2.wait();
    });

    it("revert due to zero address", async () => {
      expect(async () => {
        const tx = await registry.transferTypeAdmin(1n, ZeroAddress);
        await tx.wait();
      }).rejects.toThrow();
    });

    it("revert due to non-admin", async () => {
      const tx = await registry.registerType1Step(
        true,
        "name1",
        "def1",
        "desc1",
        "uri1",
        1n,
        user.getAddress(),
        user.getAddress()
      );
      const typeID = await tx.wait();

      expect(async () => {
        const tx2 = await registry.connect(user).transferTypeAdmin(typeID, user.getAddress());
        await tx2.wait();
      }).rejects.toThrow();
    });
  });

  describe("update type resource URI", () => {
    it("successful", async () => {
      const tx = await registry.registerType1Step(
        true,
        "name1",
        "def1",
        "desc1",
        "uri1",
        1n,
        user.getAddress(),
        user.getAddress()
      );
      const typeID = await tx.wait();

      const tx2 = await registry.updateTypeResourceURI(typeID, "uri1");
      await tx2.wait();
    });

    it("revert due to unregistered type", async () => {
      expect(async () => {
        const tx = await registry.updateTypeResourceURI(1n, "uri1");
        await tx.wait();
      }).rejects.toThrow();
    });

    it("revert due to non-admin", async () => {
      const tx = await registry.registerType1Step(
        true,
        "name1",
        "def1",
        "desc1",
        "uri1",
        1n,
        user.getAddress(),
        user.getAddress()
      );
      const typeID = await tx.wait();

      expect(async () => {
        const tx = await registry.connect(user).updateTypeResourceURI(typeID, "uri1");
        await tx.wait();
      }).rejects.toThrow();
    });
  });

  describe("update type verifier", () => {
    it("successful", async () => {
      const tx = await registry.registerType1Step(
        true,
        "name1",
        "def1",
        "desc1",
        "uri1",
        1n,
        user.getAddress(),
        user.getAddress()
      );
      const typeID = await tx.wait();

      const tx2 = await registry.updateTypeVerifier(typeID, 1n, user.getAddress());
      await tx2.wait();
    });

    it("revert due to unregistered type", async () => {
      expect(async () => {
        const tx = await registry.updateTypeVerifier(1n, 1n, user.getAddress());
        await tx.wait();
      }).rejects.toThrow();
    });

    it("revert due to non-admin", async () => {
      const tx = await registry.registerType1Step(
        true,
        "name1",
        "def1",
        "desc1",
        "uri1",
        1n,
        user.getAddress(),
        user.getAddress()
      );
      const typeID = await tx.wait();

      expect(async () => {
        const tx = await registry.connect(user).updateTypeVerifier(typeID, 1n, user.getAddress());
        await tx.wait();
      }).rejects.toThrow();
    });
  });

  describe("update type public signal getter", () => {
    it("successful", async () => {
      const tx = await registry.registerType1Step(
        true,
        "name1",
        "def1",
        "desc1",
        "uri1",
        1n,
        user.getAddress(),
        user.getAddress()
      );
      const typeID = await tx.wait();

      const tx2 = await registry.updateTypePublicSignalGetter(typeID, 1n, user.getAddress());
      await tx2.wait();
    });

    it("revert due to unregistered type", async () => {
      expect(async () => {
        const tx = await registry.updateTypePublicSignalGetter(1n, 1n, user.getAddress());
        await tx.wait();
      }).rejects.toThrow();
    });

    it("revert due to non-admin", async () => {
      const tx = await registry.registerType1Step(
        true,
        "name1",
        "def1",
        "desc1",
        "uri1",
        1n,
        user.getAddress(),
        user.getAddress()
      );
      const typeID = await tx.wait();

      expect(async () => {
        const tx = await registry.connect(user).updateTypePublicSignalGetter(typeID, 1n, user.getAddress());
        await tx.wait();
      }).rejects.toThrow();
    });
  });

  describe("get type", () => {
    it("unregistered type", async () => {
      const tp = await registry.getType(1);
      expect(tp.name).equal("");
      expect(await registry.isTypeFullyInitializedForStack(1, 1)).equal(false);
    });

    it("registered type", async () => {
      const tx = await registry.registerType1Step(
        true,
        "name1",
        "def1",
        "desc1",
        "uri1",
        1n,
        user.getAddress(),
        user.getAddress()
      );
      const typeID = await tx.wait();

      const tp = await registry.getType(typeID);
      expect(tp.name).equal("name1");
      expect(tp.definition).equal("def1");
      expect(tp.description).equal("desc1");
      expect(tp.resourceURI).equal("uri1");
      expect(tp.revocable).equal(true);

      expect(tp.admin).equal(await sender.getAddress());
    });
  });

  describe("get type admin", () => {
    it("unregistered type", async () => {
      expect(await registry.getTypeAdmin(1n)).equal(ZeroAddress);
    });

    it("registered type", async () => {
      const tx = await registry.registerType1Step(
        true,
        "name1",
        "def1",
        "desc1",
        "uri1",
        1n,
        user.getAddress(),
        user.getAddress()
      );
      const typeID = await tx.wait();

      expect(await registry.getTypeAdmin(typeID)).equal(await sender.getAddress());
    });
  });

  describe("is revocable", () => {
    it("unregistered type", async () => {
      expect(await registry.isRevocable(1)).equal(false);
    });

    it("registered type", async () => {
      const tx = await registry.registerType1Step(
        true,
        "name1",
        "def1",
        "desc1",
        "uri1",
        1n,
        user.getAddress(),
        user.getAddress()
      );
      const typeID = await tx.wait();

      expect(await registry.isRevocable(typeID)).equal(true);
    });
  });

  describe("is type fully initialized for stack", () => {
    it("returns false for unregistered type", async () => {
      expect(await registry.isTypeFullyInitializedForStack(1, 1)).equal(false);
    });

    it("returns true for registered type", async () => {
      const tx = await registry.registerType1Step(
        true,
        "name1",
        "def1",
        "desc1",
        "uri1",
        1n,
        user.getAddress(),
        user.getAddress()
      );
      const typeID = await tx.wait();
      expect(await registry.isTypeFullyInitializedForStack(typeID, 1n)).equal(true);
    });
  });
});
