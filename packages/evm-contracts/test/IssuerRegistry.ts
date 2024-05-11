import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { encodeBytes32String } from "ethers";
import { ethers } from "hardhat";

import { ZERO_ADDRESS } from "./util";

const stackId = 1;
const publicKeyId = 2;
const publicKeyRaw = "0x1234";
const typeId = 10;
const contextId = 20;
const treeUri = "ipfs://test";
const stateRoot = encodeBytes32String("root");

describe("IssuerRegistry", () => {
  async function deployRegistry() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("IssuerRegistry");
    const registry = await Registry.deploy();
    return { registry, owner, otherAccount };
  }

  beforeEach(async function () {
    Object.assign(this, await loadFixture(deployRegistry));
  });

  describe("unregistered issuer", () => {
    it("getIssuer", async function () {
      await expect(this.registry.getIssuer(1)).to.be.revertedWithCustomError(this.registry, "IssuerNotExists");
    });

    it("getPublicKeyRaw", async function () {
      await expect(
        this.registry.getPublicKeyRaw(BigInt(this.owner.address), publicKeyId),
      ).to.be.revertedWithCustomError(this.registry, "PublicKeyNotExists");
    });

    it("isPublicKeyActiveForStack", async function () {
      expect(await this.registry.isPublicKeyActiveForStack(BigInt(this.owner.address), publicKeyId, stackId)).is.false;
    });

    it("isPublicKeyActive", async function () {
      expect(await this.registry.isPublicKeyActive(BigInt(this.owner.address), publicKeyId)).is.false;
    });

    it("updateSignatureStateURI", async function () {
      await expect(
        this.registry.updateSignatureStateURI(typeId, contextId, BigInt(this.owner.address), treeUri),
      ).to.be.revertedWithCustomError(this.registry, "IssuerNotExists");
    });

    it("updateSignatureState", async function () {
      await expect(
        this.registry.updateSignatureState(typeId, contextId, BigInt(this.owner.address), stateRoot),
      ).to.be.revertedWithCustomError(this.registry, "IssuerNotExists");
    });

    it("setSignatureState", async function () {
      await expect(
        this.registry.setSignatureState(typeId, contextId, BigInt(this.owner.address), treeUri, stateRoot),
      ).to.be.revertedWithCustomError(this.registry, "IssuerNotExists");
    });
  });

  it("should revert when name is empty", async function () {
    await expect(this.registry.registerIssuer("", stackId, publicKeyId, publicKeyRaw)).to.be.revertedWithCustomError(
      this.registry,
      "InvalidName",
    );
  });

  it("should register an issuer and retrieve it correctly", async function () {
    const issuerName = "test issuer";
    const issuerId = BigInt(this.owner.address);
    await expect(this.registry.registerIssuer(issuerName, stackId, publicKeyId, publicKeyRaw))
      .to.emit(this.registry, "IssuerRegistered")
      .withArgs(issuerId, issuerName)
      .to.emit(this.registry, "IssuerAdminTransferred")
      .withArgs(issuerId, ZERO_ADDRESS, this.owner)
      .to.emit(this.registry, "PublicKeyStatusUpdated")
      .withArgs(issuerId, publicKeyId, 2)
      .to.emit(this.registry, "PublicKeyVerificationStackUpdated")
      .withArgs(issuerId, publicKeyId, stackId, true);
  });

  describe("valid issuer", () => {
    const issuerName = "test issuer";
    let issuerId: bigint;
    beforeEach(async function () {
      await this.registry.registerIssuer(issuerName, stackId, publicKeyId, publicKeyRaw);
      issuerId = BigInt(this.owner.address);
    });

    it("should return the correct issuer info", async function () {
      expect(await this.registry.getIssuer(issuerId)).deep.eq([issuerName, this.owner.address]);
    });

    it("should revert for unregistered public key", async function () {
      await expect(this.registry.getPublicKeyRaw(issuerId, 3)).to.be.revertedWithCustomError(
        this.registry,
        "PublicKeyNotExists",
      );
    });

    it("should return the correct public key", async function () {
      expect(await this.registry.getPublicKeyRaw(issuerId, publicKeyId)).eq(publicKeyRaw);
    });

    it("should active", async function () {
      expect(await this.registry.isPublicKeyActive(issuerId, publicKeyId)).is.true;
    });

    it("should active for stack", async function () {
      expect(await this.registry.isPublicKeyActiveForStack(issuerId, publicKeyId, stackId)).is.true;
    });

    it("shouldn't active for other stack", async function () {
      expect(await this.registry.isPublicKeyActiveForStack(issuerId, publicKeyId, 2)).is.false;
    });

    it("should revert when trying to register an already existing issuer", async function () {
      await expect(
        this.registry.registerIssuer(issuerName, stackId, publicKeyId, publicKeyRaw),
      ).to.be.revertedWithCustomError(this.registry, "IssuerAlreadyExists");
    });

    describe("public key", () => {
      it("should revert when public key is already exists", async function () {
        await expect(
          this.registry.addPublicKey(issuerId, stackId, publicKeyId, publicKeyRaw),
        ).to.be.revertedWithCustomError(this.registry, "PublicKeyAlreadyExists");
      });

      it("should revert for unregistered issuer", async function () {
        await expect(
          this.registry.addPublicKey(
            2, // not exist issuer
            stackId,
            publicKeyId,
            publicKeyRaw,
          ),
        ).to.be.revertedWithCustomError(this.registry, "IssuerNotExists");
      });

      it("should revert when not owner", async function () {
        await expect(
          this.registry.connect(this.otherAccount).addPublicKey(issuerId, stackId, publicKeyId, publicKeyRaw),
        ).to.be.revertedWithCustomError(this.registry, "NotIssuerOwner");
      });

      it("should revert when update verification stack with other address", async function () {
        await expect(
          this.registry.connect(this.otherAccount).updatePublicKeyVerificationStack(issuerId, publicKeyId, 2, true),
        ).to.be.revertedWithCustomError(this.registry, "NotIssuerOwner");
      });

      it("should revert when update verification stack with not exist public key", async function () {
        const newPublicKeyId = 3;
        await expect(
          this.registry.updatePublicKeyVerificationStack(issuerId, newPublicKeyId, 2, true),
        ).to.be.revertedWithCustomError(this.registry, "PublicKeyNotExists");
      });

      it("should update verification stack success", async function () {
        const newStackId = 2;
        await expect(this.registry.updatePublicKeyVerificationStack(issuerId, publicKeyId, newStackId, true))
          .to.emit(this.registry, "PublicKeyVerificationStackUpdated")
          .withArgs(issuerId, publicKeyId, newStackId, true);

        expect(await this.registry.isPublicKeyActiveForStack(issuerId, publicKeyId, newStackId)).is.true;
      });

      it("should disabled verification stack success", async function () {
        const newStackId = 2;
        await expect(this.registry.updatePublicKeyVerificationStack(issuerId, publicKeyId, newStackId, false))
          .to.emit(this.registry, "PublicKeyVerificationStackUpdated")
          .withArgs(issuerId, publicKeyId, newStackId, false);

        expect(await this.registry.isPublicKeyActiveForStack(issuerId, publicKeyId, newStackId)).is.false;
      });

      it("should add public key", async function () {
        const newPublicKeyId = 3;
        const newPublicKeyRaw = "0x5678";
        await expect(this.registry.addPublicKey(issuerId, stackId, newPublicKeyId, newPublicKeyRaw))
          .to.emit(this.registry, "PublicKeyStatusUpdated")
          .withArgs(issuerId, newPublicKeyId, 2)
          .to.emit(this.registry, "PublicKeyVerificationStackUpdated")
          .withArgs(issuerId, newPublicKeyId, stackId, true);
      });

      it("should revert when update status with other address", async function () {
        await expect(
          this.registry.connect(this.otherAccount).updatePublicKeyStatus(
            issuerId,
            publicKeyId,
            1, // revoked
          ),
        ).to.be.revertedWithCustomError(this.registry, "NotIssuerOwner");
      });

      it("should revert when update status with not exist public key", async function () {
        const newPublicKeyId = 3;

        await expect(
          this.registry.updatePublicKeyStatus(
            issuerId,
            newPublicKeyId,
            1, // revoked
          ),
        ).to.be.revertedWithCustomError(this.registry, "PublicKeyNotExists");
      });

      it("should update status", async function () {
        await expect(
          this.registry.updatePublicKeyStatus(
            issuerId,
            publicKeyId,
            1, // revoked
          ),
        )
          .to.emit(this.registry, "PublicKeyStatusUpdated")
          .withArgs(issuerId, publicKeyId, 1);

        expect(await this.registry.isPublicKeyActive(issuerId, publicKeyId)).is.false;
      });
    });

    describe("signature state", () => {
      it("should return emtpy signature state", async function () {
        expect(await this.registry.getSignatureStateURI(typeId, contextId, issuerId)).to.eq("");

        expect(await this.registry.getSignatureStateRoot(typeId, contextId, issuerId)).to.eq(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        );

        expect(await this.registry.getSignatureState(typeId, contextId, issuerId)).to.deep.eq([
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "",
        ]);
      });

      it("should revert when update signature state with other address", async function () {
        await expect(
          this.registry.connect(this.otherAccount).setSignatureState(typeId, contextId, issuerId, treeUri, stateRoot),
        ).to.be.revertedWithCustomError(this.registry, "NotIssuerOwner");
      });

      const newTreeUri = "ipfs://new";
      const newStateRoot = encodeBytes32String("newRoot");

      it("should update signature state uri success", async function () {
        await expect(this.registry.updateSignatureStateURI(typeId, contextId, issuerId, newTreeUri))
          .to.emit(this.registry, "SignatureStateURIUpdated")
          .withArgs(typeId, contextId, issuerId, newTreeUri);

        expect(await this.registry.getSignatureStateURI(typeId, contextId, issuerId)).eq(newTreeUri);
      });

      it("should update signature state root success", async function () {
        await expect(this.registry.updateSignatureState(typeId, contextId, issuerId, newStateRoot))
          .to.emit(this.registry, "SignatureStateRootUpdated")
          .withArgs(typeId, contextId, issuerId, newStateRoot);

        expect(await this.registry.getSignatureStateRoot(typeId, contextId, issuerId)).eq(newStateRoot);
      });

      it("should set signature state success", async function () {
        const newTreeUri = "ipfs://new2";
        const newStateRoot = encodeBytes32String("newRoot2");
        await expect(this.registry.setSignatureState(typeId, contextId, issuerId, newTreeUri, newStateRoot))
          .to.emit(this.registry, "SignatureStateURIUpdated")
          .withArgs(typeId, contextId, issuerId, newTreeUri)
          .to.emit(this.registry, "SignatureStateRootUpdated")
          .withArgs(typeId, contextId, issuerId, newStateRoot);

        expect(await this.registry.getSignatureState(typeId, contextId, issuerId)).to.deep.eq([
          newStateRoot,
          newTreeUri,
        ]);
      });
    });

    it("should revert not owner", async function () {
      await expect(
        this.registry.connect(this.otherAccount).transferIssuerAdmin(issuerId, this.otherAccount.address),
      ).to.be.revertedWithCustomError(this.registry, "NotIssuerOwner");
    });

    it("should transfer admin", async function () {
      await expect(this.registry.transferIssuerAdmin(issuerId, this.otherAccount.address))
        .to.emit(this.registry, "IssuerAdminTransferred")
        .withArgs(issuerId, this.owner.address, this.otherAccount.address);

      expect(await this.registry.getIssuer(issuerId)).to.deep.eq([issuerName, this.otherAccount.address]);
    });
  });
});
