import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { ZERO_ADDRESS } from "./util";

const stackId = 1;

const unrevocableType = {
  typeInfo: {
    typeId: 778,
    contextId: 666,
    publicKeyId: 1743582416365651167392966598529843347617363862106697818328310770809664607117n,
    name: "test unrevocable type",
    definition: "test unrevocable type definition",
    description: "test unrevocable type description",
    resourceUri: "ipfs://unrevocable",
    revocable: false,
  },
  proofs: [
    "17287865311066985283733208542516157961701724530658897303094041758582666454951",
    "16405217597499890447358208038784999082513976172901293744992488924552119467272",
    "17511724199377222514490750746829007629419810902896498259755015850482012584259",
    "5869714225445181399954162051213302620533047632865444788009058022334438344266",
    "1959355861754469298520794265257933597158410331539646277590065438413068926603",
    "19096918162369271605029848542376504228494702827220185035973104444317503726627",
    "216728479657378818913675440640775678141064487658099071457103103208212781875",
    "19402394114196496340294975308511152383663754622436148789178605935857963282953",
  ],
  publicSignals: [
    "778",
    "666",
    "849760699622323138423214777646360676343533388377892699649686780211564373610",
    "499624985322695799482841591270479138186369447061",
    "0",
    "4079407824",
    "1743582416365651167392966598529843347617363862106697818328310770809664607117",
    "19",
    "0",
    "50",
    "0",
    "101",
    "199",
    "201",
    "6",
    "8",
    "0",
  ],
};

const revocableType = {
  typeInfo: {
    typeId: 778,
    contextId: 666,
    publicKeyId: 1743582416365651167392966598529843347617363862106697818328310770809664607117n,
    name: "test revocable type",
    definition: "test revocable type definition",
    description: "test revocable type description",
    resourceUri: "ipfs://revocable",
    revocable: true,
  },
  proofs: [
    "11257167836791023033685626118251722795590086285861503011138783367418388774817",
    "20896536297399464379561834869019610649840627342166291895910626779271251366437",
    "16990391134421136165810966166456369959274405114292967764114734352894094711024",
    "16595182854684234847099456831264849898355256359984025768577697973168597854235",
    "3829988524325219120970975891226103905518493048031001585475061597268934763845",
    "5271886994701011122763779536702041955318726357955841646783674030824164244943",
    "16737669457239861109117754448841627495369232887321049467500167011765859094656",
    "5842809538993923510294667222397398783167692776967111075719245483847740309306",
  ],
  publicSignals: [
    "778",
    "666",
    "849760699622323138423214777646360676343533388377892699649686780211564373610",
    "499624985322695799482841591270479138186369447061",
    "0",
    "4079407824",
    "1743582416365651167392966598529843347617363862106697818328310770809664607117",
    "19",
    "1243904711429961858774220647610724273798918457991486031567244100767259239747",
    "0",
    "50",
    "0",
    "101",
    "199",
    "201",
    "6",
    "8",
    "0",
  ],
};

describe("BabyzkStatefulVerifier", () => {
  async function deployVerifier() {
    const [owner, otherAccount] = await ethers.getSigners();

    const UnrevocableProofVerifier = await ethers.getContractFactory("BabyZKGroth16Verifier");
    const unrevocableProofVerifier = await UnrevocableProofVerifier.deploy();

    const RevocableProofVerifier = await ethers.getContractFactory("BabyZKGroth16RevocableVerifier");
    const revocableProofVerifier = await RevocableProofVerifier.deploy();

    const TypeRegistry = await ethers.getContractFactory("TypeRegistry");
    const typeRegistry = await TypeRegistry.deploy(owner);

    const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
    const issuerRegistry = await IssuerRegistry.deploy();

    const PsGetter = await ethers.getContractFactory("BabyzkDefaultPsGetter");
    const psGetter = await PsGetter.deploy();

    const StatefulVerifier = await ethers.getContractFactory("BabyzkStatefulVerifier");
    const verifier = await StatefulVerifier.deploy(typeRegistry, issuerRegistry, owner);

    return {
      verifier,
      psGetter,
      unrevocableProofVerifier,
      revocableProofVerifier,
      typeRegistry,
      issuerRegistry,
      owner,
      otherAccount,
    };
  }

  beforeEach(async function () {
    Object.assign(this, await loadFixture(deployVerifier));
  });

  it("should get stack id 1", async function () {
    expect(await this.verifier.STACK_ID()).to.equal(stackId);
  });

  it("should get owner", async function () {
    expect(await this.verifier.owner()).to.equal(this.owner.address);
  });

  for (const { typeInfo, proofs, publicSignals } of [unrevocableType, revocableType]) {
    const op = typeInfo.revocable ? "revocable" : "unrevocable";
    describe(`verifyProofStatic - ${op}`, () => {
      it("should return uninitialized when type not registered", async function () {
        expect(
          await this.verifier.verifyProofStatic(
            typeInfo.typeId,
            typeInfo.contextId,
            typeInfo.publicKeyId,
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          ),
        ).to.eq(1);
      });

      describe("when type registered", () => {
        beforeEach(async function () {
          await this.typeRegistry.setPrimitiveType(
            typeInfo.typeId,
            typeInfo.name,
            typeInfo.definition,
            typeInfo.description,
            typeInfo.resourceUri,
            [
              typeInfo.revocable,
              stackId,
              typeInfo.revocable ? this.revocableProofVerifier : this.unrevocableProofVerifier,
              this.psGetter,
            ],
          );
        });

        it("should return type id mismatch when type id mismatch", async function () {
          expect(
            await this.verifier.verifyProofStatic(
              typeInfo.typeId,
              typeInfo.contextId,
              typeInfo.publicKeyId,
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            ),
          ).to.eq(2);
        });

        it("should return context id mismatch when context id mismatch", async function () {
          expect(
            await this.verifier.verifyProofStatic(
              typeInfo.typeId,
              typeInfo.contextId,
              typeInfo.publicKeyId,
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
              [typeInfo.typeId, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            ),
          ).to.eq(3);
        });

        it("should return public key id mismatch when public key id mismatch", async function () {
          expect(
            await this.verifier.verifyProofStatic(
              typeInfo.typeId,
              typeInfo.contextId,
              typeInfo.publicKeyId,
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
              [typeInfo.typeId, typeInfo.contextId, 3, 4, 5, 6, 7, 8, 9, 10],
            ),
          ).to.eq(4);
        });

        it("should return expired when proof expired", async function () {
          // 5 is expiration time
          const expiredTime = 1712652336;
          expect(
            await this.verifier.verifyProofStatic(
              typeInfo.typeId,
              typeInfo.contextId,
              typeInfo.publicKeyId,
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
              [typeInfo.typeId, typeInfo.contextId, 3, 4, 5, BigInt(expiredTime), typeInfo.publicKeyId, 8, 9, 10],
            ),
          ).to.eq(7);
        });

        it("should return invalid proof when proof invalid", async function () {
          const invalidProof = proofs.map((p, i) => (i === 2 ? 0 : p));
          expect(
            await this.verifier.verifyProofStatic(
              typeInfo.typeId,
              typeInfo.contextId,
              typeInfo.publicKeyId,
              invalidProof,
              publicSignals,
            ),
          ).to.eq(6);
        });

        it("should return success when proof valid", async function () {
          expect(
            await this.verifier.verifyProofStatic(
              typeInfo.typeId,
              typeInfo.contextId,
              typeInfo.publicKeyId,
              proofs,
              publicSignals,
            ),
          ).to.eq(0);
        });
      });
    });

    describe(`verifyProofFull - ${op}`, () => {
      it("should return uninitialized when type not registered", async function () {
        expect(
          await this.verifier.verifyProofFull(
            typeInfo.typeId,
            typeInfo.contextId,
            1,
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          ),
        ).to.eq(1);
      });
      let issuerId: string;
      describe("when type registered", () => {
        beforeEach(async function () {
          // add type
          await this.typeRegistry.setPrimitiveType(
            typeInfo.typeId,
            typeInfo.name,
            typeInfo.definition,
            typeInfo.description,
            typeInfo.resourceUri,
            [
              typeInfo.revocable,
              stackId,
              typeInfo.revocable ? this.revocableProofVerifier : this.unrevocableProofVerifier,
              this.psGetter,
            ],
          );

          // add issuer
          await this.issuerRegistry.registerIssuer("issuer name", stackId, typeInfo.publicKeyId, "0x1234");
          issuerId = this.owner.address;

          if (typeInfo.revocable) {
            // set signature stateÇ
            await this.issuerRegistry.setSignatureState(
              typeInfo.typeId,
              typeInfo.contextId,
              issuerId,
              "tree uri",
              "0x02c0066e10a72abd2b33c3b214cb3e81bcb1b6e30961cd23c202b18673bf2543",
            );
          }
        });

        it("should return type id mismatch when type id mismatch", async function () {
          expect(
            await this.verifier.verifyProofFull(
              typeInfo.typeId,
              typeInfo.contextId,
              issuerId,
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            ),
          ).to.eq(2);
        });

        it("should return context id mismatch when context id mismatch", async function () {
          expect(
            await this.verifier.verifyProofFull(
              typeInfo.typeId,
              typeInfo.contextId,
              issuerId,
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
              [typeInfo.typeId, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            ),
          ).to.eq(3);
        });

        it("should return public key id inactive", async function () {
          const issuerId = 1;
          expect(
            await this.verifier.verifyProofFull(typeInfo.typeId, typeInfo.contextId, issuerId, proofs, publicSignals),
          ).to.eq(4);
        });

        it("should return expired when proof expired", async function () {
          // 5 is expiration time
          const expiredTime = 1712652336;
          const invalidPublicSignals = publicSignals.map((s, i) => (i === 5 ? BigInt(expiredTime) : s));
          expect(
            await this.verifier.verifyProofFull(
              typeInfo.typeId,
              typeInfo.contextId,
              issuerId,
              proofs,
              invalidPublicSignals,
            ),
          ).to.eq(7);
        });

        if (typeInfo.revocable) {
          it("should return smt root mismatch", async function () {
            const invalidPublicSignals = publicSignals.map((s, i) => (i === 8 ? BigInt(999) : s));
            expect(
              await this.verifier.verifyProofFull(
                typeInfo.typeId,
                typeInfo.contextId,
                issuerId,
                proofs,
                invalidPublicSignals,
              ),
            ).to.eq(5);
          });
        }
        it("should return invalid proof when proof invalid", async function () {
          const invalidProof = proofs.map((p, i) => (i === 2 ? 0 : p));
          expect(
            await this.verifier.verifyProofFull(
              typeInfo.typeId,
              typeInfo.contextId,
              issuerId,
              invalidProof,
              publicSignals,
            ),
          ).to.eq(6);
        });

        it("should return success when proof valid", async function () {
          expect(
            await this.verifier.verifyProofFull(typeInfo.typeId, typeInfo.contextId, issuerId, proofs, publicSignals),
          ).to.eq(0);
        });
      });
    });
  }

  describe("Type registry", () => {
    it("should get type registry", async function () {
      expect(await this.verifier.getTypeRegistry()).to.equal(this.typeRegistry);
    });

    it("should revert when trying to update type registry by non-owner", async function () {
      await expect(this.verifier.connect(this.otherAccount).updateTypeRegistry(ZERO_ADDRESS)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("should revert when trying to update type registry to zero address", async function () {
      await expect(this.verifier.updateTypeRegistry(ZERO_ADDRESS)).to.be.revertedWithCustomError(
        this.verifier,
        "InvalidArgument",
      );
    });

    it("should update type registry", async function () {
      const newTypeRegistry = "0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97";

      await this.verifier.updateTypeRegistry(newTypeRegistry);

      expect(await this.verifier.getTypeRegistry()).to.equal(newTypeRegistry);
    });
  });

  describe("Issuer registry", () => {
    it("should get issuer registry", async function () {
      expect(await this.verifier.getIssuerRegistry()).to.equal(this.issuerRegistry);
    });

    it("should revert when trying to set issuer registry by non-owner", async function () {
      await expect(this.verifier.connect(this.otherAccount).updateIssuerRegistry(ZERO_ADDRESS)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("should revert when trying to set issuer registry to zero address", async function () {
      await expect(this.verifier.updateIssuerRegistry(ZERO_ADDRESS)).to.be.revertedWithCustomError(
        this.verifier,
        "InvalidArgument",
      );
    });

    it("should set issuer registry", async function () {
      const newIssuerRegistry = "0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97";

      await this.verifier.updateIssuerRegistry(newIssuerRegistry);

      expect(await this.verifier.getIssuerRegistry()).to.equal(newIssuerRegistry);
    });
  });
});
