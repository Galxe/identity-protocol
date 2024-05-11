import { IssuerRegistry__factory } from "@galxe-identity-protocol/evm-contracts";
import { Signer, ZeroHash } from "ethers";
import { beforeEach, describe, expect, it } from "vitest";
import { IssuerRegistry, PublicKeyStatus } from "./issuerRegistry";
import { etherProvider } from "../testutils";

describe("IssuerRegistry", () => {
  let user: Signer;
  let sender: Signer;
  let registry: IssuerRegistry;

  beforeEach(async () => {
    const { accounts } = await etherProvider();
    sender = accounts[0] as Signer;
    user = accounts[1] as Signer;
    const factory = new IssuerRegistry__factory(sender);
    const registryContract = await factory.deploy();
    registry = new IssuerRegistry(await registryContract.getAddress(), { signerOrProvider: sender });
  });

  describe("register issuer", () => {
    it("successful", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      await tx.wait();
    });

    it("same sender cannot issue twice", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      await tx.wait();

      expect(async () => {
        const dupTx = await registry.registerIssuer("Issuer2", 1n, 1n, "0x1234");
        await dupTx.wait();
      }).rejects.toThrow();
    });
  });

  describe("transfer issuer admin", () => {
    it("successful", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      await registry.transferIssuerAdmin(issuerId, await user.getAddress());
    });

    it("revert due to non-admin", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();

      expect(async () => {
        await registry.connect(user).transferIssuerAdmin(issuerId, await user.getAddress());
      }).rejects.toThrow();
    });
  });

  describe("add public key", () => {
    it("successful", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      await registry.addPublicKey(issuerId, 1n, 2n, "0x0000");
    });

    it("revert due to already exist", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();

      expect(async () => {
        await registry.addPublicKey(issuerId, 1n, 1n, "0x0000");
      }).rejects.toThrow();
    });

    it("revert due to non-admin", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();

      expect(async () => {
        await registry.connect(user).addPublicKey(issuerId, 1n, 2n, "0x0000");
      }).rejects.toThrow();
    });
  });

  describe("update public key status", () => {
    it("successful", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      await registry.updatePublicKeyStatus(issuerId, 1n, PublicKeyStatus.REVOKED);
    });

    it("revert due to non-exist", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();

      expect(async () => {
        await registry.updatePublicKeyStatus(issuerId, 2n, PublicKeyStatus.REVOKED);
      }).rejects.toThrow();
    });

    it("revert due to non-admin", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();

      expect(async () => {
        await registry.connect(user).updatePublicKeyStatus(issuerId, 1n, PublicKeyStatus.REVOKED);
      }).rejects.toThrow();
    });
  });

  describe("update public key verification stack ID", () => {
    it("successful", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      await registry.updatePublicKeyVerificationStack(issuerId, 1n, 2n, true);
    });

    it("revert due to non-exist", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();

      expect(async () => {
        await registry.updatePublicKeyVerificationStack(issuerId, 2n, 1n, true);
      }).rejects.toThrow();
    });

    it("revert due to non-admin", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();

      expect(async () => {
        await registry.connect(user).updatePublicKeyVerificationStack(issuerId, 1n, 2n, true);
      }).rejects.toThrow();
    });
  });

  describe("update signature state uri", () => {
    it("successful", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      await registry.updateSignatureStateURI(1n, 1n, issuerId, "https://abc.xyz");
    });

    it("revert due to non-admin", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();

      expect(async () => {
        await registry.connect(user).updateSignatureStateURI(1n, 1n, issuerId, "https://abc.xyz");
      }).rejects.toThrow();
    });
  });

  describe("update signature state", () => {
    it("successful", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      await registry.updateSignatureState(
        1n,
        1n,
        issuerId,
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    });

    it("revert due to non-admin", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();

      expect(async () => {
        await registry
          .connect(user)
          .updateSignatureState(1n, 1n, issuerId, "0x0000000000000000000000000000000000000000000000000000000000000000");
      }).rejects.toThrow();
    });
  });

  describe("set signature state", () => {
    it("successful", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      await registry.setSignatureState(
        1n,
        1n,
        issuerId,
        "https://abc.xyz",
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    });

    it("revert due to non-admin", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();

      expect(async () => {
        await registry
          .connect(user)
          .setSignatureState(
            1n,
            1n,
            issuerId,
            "https://abc.xyz",
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          );
      }).rejects.toThrow();
    });
  });

  describe("get issuer", () => {
    it("successful", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      const issuer1 = await registry.getIssuer(issuerId);
      expect(issuer1.name).equal("Issuer1");
      expect(issuer1.admin).equal(await sender.getAddress());
    });

    it("revert due to non-exist issuer", async () => {
      expect(async () => {
        await registry.getIssuer(1n);
      }).rejects.toThrow();
    });
  });

  describe("get public key raw", () => {
    it("successful", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      const publicKey = await registry.getPublicKeyRaw(issuerId, 1n);
      expect(publicKey).equal("0x0000");
    });

    it("revert due to non-exist public key", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();

      expect(async () => {
        await registry.getPublicKeyRaw(issuerId, 2n);
      }).rejects.toThrow();
    });
  });

  describe("is public key active", () => {
    it("successful", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      let isActive = await registry.isPublicKeyActive(issuerId, 1n);
      expect(isActive).equal(true);

      await registry.updatePublicKeyStatus(issuerId, 1n, PublicKeyStatus.REVOKED);
      isActive = await registry.isPublicKeyActive(issuerId, 1n);
      expect(isActive).equal(false);
    });

    it("not active due to non-exist public key", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();

      const isActive = await registry.isPublicKeyActive(issuerId, 2n);
      expect(isActive).equal(false);
    });
  });

  describe("is public key active for stack", () => {
    it("successful", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      let isActive = await registry.isPublicKeyActiveForStack(issuerId, 1n, 1n);
      expect(isActive).equal(true);

      await registry.updatePublicKeyStatus(issuerId, 1n, PublicKeyStatus.REVOKED);
      isActive = await registry.isPublicKeyActiveForStack(issuerId, 1n, 1n);
      expect(isActive).equal(false);
    });

    it("not active due to non-exist public key", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();

      const isActive = await registry.isPublicKeyActiveForStack(issuerId, 2n, 1n);
      expect(isActive).equal(false);
    });
  });

  describe("get signature state", () => {
    it("non exist", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      const state = await registry.getSignatureState(1n, 1n, issuerId);
      expect(state.root).equal(ZeroHash);
      expect(state.treeURI).equal("");
    });

    it("exist", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      await registry.setSignatureState(
        1n,
        1n,
        issuerId,
        "https://abc.xyz",
        "0x0000000000000000000000000000000000000000000000000000000000000001"
      );
      const state = await registry.getSignatureState(1n, 1n, issuerId);
      console.log(state);
      expect(state.root).equal("0x0000000000000000000000000000000000000000000000000000000000000001");
      expect(state.treeURI).equal("https://abc.xyz");
    });
  });

  describe("get signature state URI", () => {
    it("non exist", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      const uri = await registry.getSignatureStateURI(1n, 1n, issuerId);
      expect(uri).equal("");
    });

    it("exist", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      await registry.setSignatureState(
        1n,
        1n,
        issuerId,
        "https://abc.xyz",
        "0x0000000000000000000000000000000000000000000000000000000000000001"
      );
      const uri = await registry.getSignatureStateURI(1n, 1n, issuerId);
      expect(uri).equal("https://abc.xyz");
    });
  });

  describe("get signature state root", () => {
    it("non exist", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      const root = await registry.getSignatureStateRoot(1n, 1n, issuerId);
      expect(root).equal(ZeroHash);
    });

    it("exist", async () => {
      const tx = await registry.registerIssuer("Issuer1", 1n, 1n, "0x0000");
      const issuerId = await tx.wait();
      await registry.setSignatureState(
        1n,
        1n,
        issuerId,
        "https://abc.xyz",
        "0x0000000000000000000000000000000000000000000000000000000000000001"
      );
      const root = await registry.getSignatureStateRoot(1n, 1n, issuerId);
      expect(root).equal("0x0000000000000000000000000000000000000000000000000000000000000001");
    });
  });
});
