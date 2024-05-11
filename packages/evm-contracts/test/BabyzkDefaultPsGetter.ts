import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("BabyzkDefaultPsGetter", function () {
  async function deployPsGetter() {
    const [owner, otherAccount] = await ethers.getSigners();

    const PsGetter = await ethers.getContractFactory("BabyzkDefaultPsGetter");
    const psGetter = await PsGetter.deploy();
    return { psGetter, owner, otherAccount };
  }

  beforeEach(async function () {
    Object.assign(this, await loadFixture(deployPsGetter));
  });

  it("should get correct public signals", async function () {
    const signals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const names = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = 0; i < names.length; i++) {
      expect(await this.psGetter.getPublicSignal(names[i], signals)).is.eq(values[i]);
    }
  });
});
