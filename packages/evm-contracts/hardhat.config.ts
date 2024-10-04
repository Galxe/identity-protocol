import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import { config as dotenvConfig } from "dotenv";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import { resolve } from "path";
import "solidity-coverage";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

// Ensure that we have all the environment variables we need.
let privateKey: string = process.env.PRIVATE_KEY || "";
if (!privateKey) {
  console.warn("No private key provided. This may be okay if you're only using a local network.");
  privateKey = "0x" + "ff".repeat(32);
}

// somehow can't get hardhat verify to work... use this to bypass.
let verifyApiKey = "";
switch (process.env.NETWORK) {
  case "mainnet":
    console.log("etherscan apiKey");
    verifyApiKey = process.env.ETHERSCAN_API_KEY || "";
    break;
  case "bsc":
    console.log("bscscan apiKey");
    verifyApiKey = process.env.BSCSCAN_API_KEY || "";
    break;
  case "polygon":
    console.log("polygonscan apiKey");
    verifyApiKey = process.env.POLYGONSCAN_API_KEY || "";
    break;
  case "sepolia":
    console.log("etherscan apiKey");
    verifyApiKey = process.env.ETHERSCAN_API_KEY || "";
    break;
  default:
    verifyApiKey = "";
    break;
}

console.log("verifyApiKey: %s", verifyApiKey.substring(0, 4) + "..." + verifyApiKey.slice(-4));
// turns out verify will try to use the envvar if it's set, so we need to delete it.
delete process.env.ETHERSCAN_API_KEY;

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: verifyApiKey,
  },
  gasReporter: {
    currency: "USD",
    enabled: !!process.env.REPORT_GAS,
    excludeContracts: [],
    src: "./contracts",
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: "https://rpc.ankr.com/eth_sepolia",
      chainId: 11155111,
      accounts: [privateKey],
    },
    goerli: {
      url: "https://rpc.ankr.com/eth_goerli",
      chainId: 5,
      accounts: [privateKey],
    },
    bsc: {
      url: "https://bsc-dataseed1.binance.org",
      chainId: 56,
      accounts: [privateKey],
    },
    polygon: {
      url: "https://rpc.ankr.com/polygon",
      chainId: 137,
      accounts: [privateKey],
    },
    mainnet: {
      url: "https://eth.llamarpc.com",
      chainId: 1,
      accounts: [privateKey],
    },
    gravity: {
      url: "https://rpc.gravity.xyz",
      chainId: 1625,
      accounts: [privateKey],
      verify: {
        etherscan: {
          apiKey: "no-op", // verification on conduit does not require an API key, but hardhat etherscan-verify does.
          apiUrl: "https://explorer.gravity.xyz/api",
        },
      },
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.23",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
      // viaIR: true,
    },
  },
  typechain: {
    // outDir: "types",
    target: "ethers-v6",
  },
  namedAccounts: {
    deployer: 0,
  },
};

export default config;
