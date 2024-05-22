import { bufferToHex, keccak256 } from "ethereumjs-util";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const salt = "Galxe Identity Protocol v1.0";
const admin = "0xa5E5EA38cF3bD36475596858AC7546d17752E4A7";
const saltHex = bufferToHex(keccak256(Buffer.from(salt)));

const f: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("deployer: %s", deployer);

  const chainId = await getChainId();
  console.log("chain id: %s", chainId);

  // deploy aggregated verifier only if on sepolia
  let upaVerifierAddr = "";
  if (chainId == "11155111") {
    // nebra v1.1 verifier
    upaVerifierAddr = "0x8bdEa1842afb8Be3b46d8fE8D6d110eDE057d7c7";
  }

  // 1. type registry
  const typeReg = await deploy("TypeRegistry", {
    from: deployer,
    args: [admin],
    log: true,
    skipIfAlreadyDeployed: true,
    deterministicDeployment: saltHex,
  });
  console.log("deployed TypeRegistry contract at address: %s", typeReg.address);

  // 2. context registry
  const ctxReg = await deploy("ContextRegistry", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
    deterministicDeployment: saltHex,
  });
  console.log("deployed ContextRegistry contract at address: %s", ctxReg.address);

  // 3. issuer registry
  const issuerReg = await deploy("IssuerRegistry", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
    deterministicDeployment: saltHex,
  });
  console.log("deployed IssuerRegistry contract at address: %s", issuerReg.address);

  // 4. default public signal getter
  const psGetter = await deploy("BabyzkDefaultPsGetter", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
    deterministicDeployment: saltHex,
  });
  console.log("deployed BabyzkDefaultPsGetter contract at address: %s", psGetter.address);

  // 5. deploy stateful verifier
  const verifier = await deploy("BabyzkStatefulVerifier", {
    from: deployer,
    args: [typeReg.address, issuerReg.address, admin],
    log: true,
    skipIfAlreadyDeployed: true,
    deterministicDeployment: saltHex,
  });
  console.log("deployed BabyzkStatefulVerifier contract at address: %s", verifier.address);

  // 6. deploy aggregated stateful verifier
  if (upaVerifierAddr == "") {
    console.log("no UpaVerifier addr configured. Skipping AggregatedBabyzkStatefulVerifier deployment");
  } else {
    const aggVerifier = await deploy("AggregatedBabyzkStatefulVerifier", {
      from: deployer,
      args: [upaVerifierAddr, typeReg.address, issuerReg.address, deployer],
      log: true,
      skipIfAlreadyDeployed: true,
      deterministicDeployment: saltHex,
    });
    console.log("deployed AggregatedBabyzkStatefulVerifier contract at address: %s", aggVerifier.address);
  }
};

f.tags = ["GalxeIdentityProtocol"];
export default f;
