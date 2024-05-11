import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { ZERO_ADDRESS, calCredTypeID } from "./util";

const stackId = 1;
const name = "test type";
const definition = "test type definition";
const description = "test type description";
const resourceUri = "ipfs://test";
const verifier = "0x97E71b1c1CC0a4E024460171ac94332E5c1AD94e";
const publicSignalGetter = "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE";

describe("TypeRegistry", () => {
  async function deployRegistry() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("TypeRegistry");
    const registry = await Registry.deploy(owner);
    return { registry, owner, otherAccount };
  }

  beforeEach(async function () {
    Object.assign(this, await loadFixture(deployRegistry));
  });

  it("Owner", async function () {
    expect(await this.registry.owner()).to.equal(this.owner.address);
  });

  it("Calculate type ID", async function () {
    const typeName = "test";
    expect(await this.registry.calcTypeID(this.owner, typeName)).to.equal(calCredTypeID(this.owner.address, typeName));
  });

  describe("Unregistered type", function () {
    const unregisteredTypeId = 1;

    it("Empty type", async function () {
      expect(await this.registry.getType(unregisteredTypeId)).to.deep.equal([false, ZERO_ADDRESS, "", "", "", ""]);
    });

    it("Empty admin address", async function () {
      expect(await this.registry.getTypeAdmin(unregisteredTypeId)).to.equal(ZERO_ADDRESS);
    });

    it("Unrevokeable", async function () {
      expect(await this.registry.isRevocable(unregisteredTypeId)).to.equal(false);
    });

    it("Empty verifier", async function () {
      expect(await this.registry.getVerifier(unregisteredTypeId, stackId)).to.equal(ZERO_ADDRESS);
    });

    it("Empty PublicSignalGetter", async function () {
      expect(await this.registry.getPublicSignalGetter(unregisteredTypeId, stackId)).to.equal(ZERO_ADDRESS);
    });

    it("Should revert when update", async function () {
      await expect(
        this.registry.updateTypeResourceURI(unregisteredTypeId, "ipfs://test"),
      ).to.be.revertedWithCustomError(this.registry, "TypeDoesNotExist");

      await expect(
        this.registry.updateTypeVerifier(unregisteredTypeId, stackId, verifier),
      ).to.be.revertedWithCustomError(this.registry, "TypeDoesNotExist");

      await expect(
        this.registry.updateTypePublicSignalGetter(unregisteredTypeId, stackId, publicSignalGetter),
      ).to.be.revertedWithCustomError(this.registry, "TypeDoesNotExist");

      await expect(
        this.registry.transferTypeAdmin(unregisteredTypeId, this.otherAccount.address),
      ).to.be.revertedWithCustomError(this.registry, "TypeDoesNotExist");
    });
  });

  describe("Register type", function () {
    describe("Primitive type", function () {
      it("Should revert with not owner", async function () {
        await expect(
          this.registry
            .connect(this.otherAccount)
            .setPrimitiveType(1, name, definition, description, resourceUri, [
              false,
              stackId,
              verifier,
              publicSignalGetter,
            ]),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should revert with empty name", async function () {
        await expect(
          this.registry.setPrimitiveType(1, "", definition, description, resourceUri, [
            false,
            stackId,
            verifier,
            publicSignalGetter,
          ]),
        ).to.be.revertedWithCustomError(this.registry, "InvalidTypeName");
      });

      it("Should set primitive type success", async function () {
        const typeId = 1;
        const revocable = false;

        await expect(
          this.registry.setPrimitiveType(typeId, name, definition, description, resourceUri, [
            revocable,
            stackId,
            verifier,
            publicSignalGetter,
          ]),
        )
          .to.emit(this.registry, "TypeRegistered")
          .withArgs(typeId, ZERO_ADDRESS, name, definition, description, resourceUri)
          .to.emit(this.registry, "TypeVerifierUpdated")
          .withArgs(typeId, stackId, verifier)
          .to.emit(this.registry, "TypePublicSignalGetterUpdated")
          .withArgs(typeId, stackId, publicSignalGetter);

        expect(await this.registry.getType(typeId)).to.deep.equal([
          revocable,
          ZERO_ADDRESS,
          name,
          definition,
          description,
          resourceUri,
        ]);
      });

      describe("Valid primitive type", function () {
        const typeId = 1;
        const revocable = true;

        beforeEach(async function () {
          await this.registry.setPrimitiveType(typeId, name, definition, description, resourceUri, [
            revocable,
            stackId,
            verifier,
            publicSignalGetter,
          ]);
        });

        it("Get type", async function () {
          expect(await this.registry.getType(typeId)).to.deep.equal([
            revocable,
            ZERO_ADDRESS,
            name,
            definition,
            description,
            resourceUri,
          ]);
        });

        it("Type admin", async function () {
          expect(await this.registry.getTypeAdmin(typeId)).to.equal(this.owner.address);
        });

        it("Revocable", async function () {
          expect(await this.registry.isRevocable(typeId)).to.equal(revocable);
        });

        it("Verifier", async function () {
          expect(await this.registry.getVerifier(typeId, stackId)).to.equal(verifier);
        });

        it("PublicSignalGetter", async function () {
          expect(await this.registry.getPublicSignalGetter(typeId, stackId)).to.equal(publicSignalGetter);
        });

        it("Should revert with not owner", async function () {
          await expect(
            this.registry.connect(this.otherAccount).transferTypeAdmin(typeId, this.otherAccount.address),
          ).to.be.revertedWithCustomError(this.registry, "NotTypeOwner");

          // updateTypeResourceURI
          await expect(
            this.registry.connect(this.otherAccount).updateTypeResourceURI(typeId, "ipfs://test"),
          ).to.be.revertedWithCustomError(this.registry, "NotTypeOwner");

          // updateTypeVerifier
          await expect(
            this.registry.connect(this.otherAccount).updateTypeVerifier(typeId, stackId, this.otherAccount.address),
          ).to.be.revertedWithCustomError(this.registry, "NotTypeOwner");

          // updateTypePublicSignalGetter
          await expect(
            this.registry
              .connect(this.otherAccount)
              .updateTypePublicSignalGetter(typeId, stackId, this.otherAccount.address),
          ).to.be.revertedWithCustomError(this.registry, "NotTypeOwner");
        });

        it("Should updateResourceURI success", async function () {
          const newResourceUri = "ipfs://test2";
          await expect(this.registry.updateTypeResourceURI(typeId, newResourceUri))
            .to.emit(this.registry, "TypeResourceURIUpdated")
            .withArgs(typeId, resourceUri, newResourceUri);
          expect(await this.registry.getType(typeId)).to.deep.equal([
            revocable,
            ZERO_ADDRESS,
            name,
            definition,
            description,
            newResourceUri,
          ]);
        });

        it("Should update verifier success", async function () {
          const newVerifier = "0xE2e6e877F216047f09c086704A0C8D21D70bC3ba";
          await expect(this.registry.updateTypeVerifier(typeId, stackId, newVerifier))
            .to.emit(this.registry, "TypeVerifierUpdated")
            .withArgs(typeId, stackId, newVerifier);
          expect(await this.registry.getVerifier(typeId, stackId)).to.equal(newVerifier);
        });

        it("Should update PublicSignalGetter success", async function () {
          const newPublicSignalGetter = "0x49aC5339b56c0aAD29587dD9c1c511859dA96b14";
          await expect(this.registry.updateTypePublicSignalGetter(typeId, stackId, newPublicSignalGetter))
            .to.emit(this.registry, "TypePublicSignalGetterUpdated")
            .withArgs(typeId, stackId, newPublicSignalGetter);
          expect(await this.registry.getPublicSignalGetter(typeId, stackId)).to.equal(newPublicSignalGetter);
        });

        it("Shouldn't transfer type admin success", async function () {
          await this.registry.transferTypeAdmin(typeId, this.otherAccount.address);
          expect(await this.registry.getTypeAdmin(typeId)).to.equal(this.owner.address);
        });

        it("Should revert with same type id", async function () {
          await expect(
            this.registry.setPrimitiveType(typeId, name, definition, description, resourceUri, [
              revocable,
              stackId,
              verifier,
              publicSignalGetter,
            ]),
          ).to.be.revertedWithCustomError(this.registry, "TypeAlreadyExists");
        });
      });
    });

    describe("Custom type", function () {
      it("Should revert with empty name", async function () {
        await expect(
          this.registry.registerType(false, "", definition, description, resourceUri),
        ).to.be.revertedWithCustomError(this.registry, "InvalidTypeName");

        await expect(
          this.registry.registerType1Step(
            false,
            "",
            definition,
            description,
            resourceUri,
            stackId,
            verifier,
            publicSignalGetter,
          ),
        ).to.be.revertedWithCustomError(this.registry, "InvalidTypeName");
      });

      it("Should register type success", async function () {
        const typeId = calCredTypeID(this.owner.address, name);
        const revocable = false;
        const typeAdmin = this.owner.address;

        await expect(this.registry.registerType(revocable, name, definition, description, resourceUri))
          .to.emit(this.registry, "TypeRegistered")
          .withArgs(typeId, typeAdmin, name, definition, description, resourceUri);

        expect(await this.registry.getType(typeId)).to.deep.equal([
          revocable,
          typeAdmin,
          name,
          definition,
          description,
          resourceUri,
        ]);
      });

      it("Should register type 1 step success", async function () {
        const typeId = calCredTypeID(this.owner.address, name);
        const revocable = false;
        const typeAdmin = this.owner.address;

        await expect(
          this.registry.registerType1Step(
            revocable,
            name,
            definition,
            description,
            resourceUri,
            stackId,
            verifier,
            publicSignalGetter,
          ),
        )
          .to.emit(this.registry, "TypeRegistered")
          .withArgs(typeId, typeAdmin, name, definition, description, resourceUri)
          .to.emit(this.registry, "TypeVerifierUpdated")
          .withArgs(typeId, stackId, verifier)
          .to.emit(this.registry, "TypePublicSignalGetterUpdated")
          .withArgs(typeId, stackId, publicSignalGetter);

        expect(await this.registry.getType(typeId)).to.deep.equal([
          revocable,
          typeAdmin,
          name,
          definition,
          description,
          resourceUri,
        ]);
      });

      describe("Valid primitive type", function () {
        const revocable = false;
        let typeId: bigint;
        let typeAdmin: string;

        beforeEach(async function () {
          await this.registry.registerType1Step(
            revocable,
            name,
            definition,
            description,
            resourceUri,
            stackId,
            verifier,
            publicSignalGetter,
          );
          typeId = calCredTypeID(this.owner.address, name);
          typeAdmin = this.owner.address;
        });

        it("Get type", async function () {
          expect(await this.registry.getType(typeId)).to.deep.equal([
            revocable,
            typeAdmin,
            name,
            definition,
            description,
            resourceUri,
          ]);
        });

        it("Type admin", async function () {
          expect(await this.registry.getTypeAdmin(typeId)).to.equal(typeAdmin);
        });

        it("Revocable", async function () {
          expect(await this.registry.isRevocable(typeId)).to.equal(revocable);
        });

        it("Verifier", async function () {
          expect(await this.registry.getVerifier(typeId, stackId)).to.equal(verifier);
        });

        it("PublicSignalGetter", async function () {
          expect(await this.registry.getPublicSignalGetter(typeId, stackId)).to.equal(publicSignalGetter);
        });

        it("Should revert with not owner", async function () {
          await expect(
            this.registry.connect(this.otherAccount).transferTypeAdmin(typeId, this.otherAccount.address),
          ).to.be.revertedWithCustomError(this.registry, "NotTypeOwner");

          // updateTypeResourceURI
          await expect(
            this.registry.connect(this.otherAccount).updateTypeResourceURI(typeId, "ipfs://test"),
          ).to.be.revertedWithCustomError(this.registry, "NotTypeOwner");

          // updateTypeVerifier
          await expect(
            this.registry.connect(this.otherAccount).updateTypeVerifier(typeId, stackId, this.otherAccount.address),
          ).to.be.revertedWithCustomError(this.registry, "NotTypeOwner");

          // updateTypePublicSignalGetter
          await expect(
            this.registry
              .connect(this.otherAccount)
              .updateTypePublicSignalGetter(typeId, stackId, this.otherAccount.address),
          ).to.be.revertedWithCustomError(this.registry, "NotTypeOwner");
        });

        it("Should updateResourceURI success", async function () {
          const newResourceUri = "ipfs://test2";
          await expect(this.registry.updateTypeResourceURI(typeId, newResourceUri))
            .to.emit(this.registry, "TypeResourceURIUpdated")
            .withArgs(typeId, resourceUri, newResourceUri);
          expect(await this.registry.getType(typeId)).to.deep.equal([
            revocable,
            typeAdmin,
            name,
            definition,
            description,
            newResourceUri,
          ]);
        });

        it("Should update verifier success", async function () {
          const newVerifier = "0xE2e6e877F216047f09c086704A0C8D21D70bC3ba";
          await expect(this.registry.updateTypeVerifier(typeId, stackId, newVerifier))
            .to.emit(this.registry, "TypeVerifierUpdated")
            .withArgs(typeId, stackId, newVerifier);
          expect(await this.registry.getVerifier(typeId, stackId)).to.equal(newVerifier);
        });

        it("Should update PublicSignalGetter success", async function () {
          const newPublicSignalGetter = "0x49aC5339b56c0aAD29587dD9c1c511859dA96b14";
          await expect(this.registry.updateTypePublicSignalGetter(typeId, stackId, newPublicSignalGetter))
            .to.emit(this.registry, "TypePublicSignalGetterUpdated")
            .withArgs(typeId, stackId, newPublicSignalGetter);
          expect(await this.registry.getPublicSignalGetter(typeId, stackId)).to.equal(newPublicSignalGetter);
        });

        it("Should transfer type admin success", async function () {
          await this.registry.transferTypeAdmin(typeId, this.otherAccount.address);
          expect(await this.registry.getTypeAdmin(typeId)).to.equal(this.otherAccount.address);
        });

        it("Should revert with same type id", async function () {
          await expect(
            this.registry.registerType1Step(
              revocable,
              name,
              definition,
              description,
              resourceUri,
              stackId,
              verifier,
              publicSignalGetter,
            ),
          ).to.be.revertedWithCustomError(this.registry, "TypeAlreadyExists");
        });
      });
    });
  });
});
