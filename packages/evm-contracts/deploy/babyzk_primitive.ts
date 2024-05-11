import { bufferToHex, keccak256 } from "ethereumjs-util";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const salt = "Galxe Identity Protocol v1.0";
const saltHex = bufferToHex(keccak256(Buffer.from(salt)));

const f: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("deployer: %s", deployer);

  const primitiveTypes = ["Boolean", "Passport", "Property", "Scalar", "Scalar256", "Unit"];
  for (const primitiveType of primitiveTypes) {
    const contract = `BabyZKGroth16${primitiveType}Verifier`;
    const verifier = await deploy(contract, {
      from: deployer,
      log: true,
      skipIfAlreadyDeployed: true,
      deterministicDeployment: saltHex,
    });
    console.log("deployed %s contract at address: %s", contract, verifier.address);
  }
};

f.tags = ["BabyZKPrimitive"];
export default f;
