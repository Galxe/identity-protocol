import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { calContextID } from "./util";

const contextName = "test context";

describe("ContextRegistry", function () {
  async function deployRegistry() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("ContextRegistry");
    const registry = await Registry.deploy();
    return { registry, owner, otherAccount };
  }

  beforeEach(async function () {
    Object.assign(this, await loadFixture(deployRegistry));
  });

  it("should return an empty string for context ID 0", async function () {
    expect(await this.registry.getContext(0)).to.equal("");
  });

  it("should calculate the correct context ID", async function () {
    expect(await this.registry.calculateContextID(contextName)).to.equal(calContextID(contextName));
  });

  it("should register a context and retrieve it correctly", async function () {
    const expectContextID = calContextID(contextName);

    await expect(this.registry.registerContext(contextName))
      .to.emit(this.registry, "ContextRegistered")
      .withArgs(expectContextID, contextName);

    expect(await this.registry.getContext(expectContextID)).to.equal(contextName);
  });

  it("should revert when trying to register an already existing context", async function () {
    await this.registry.registerContext(contextName);

    await expect(this.registry.registerContext(contextName)).to.be.revertedWithCustomError(
      this.registry,
      "AlreadyExists",
    );
  });
});
