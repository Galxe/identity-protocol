"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sdk = require("@/index");
var ethers_1 = require("ethers");
var util_1 = require("@/e2e/util");
var galxe_protocol_contracts_1 = require("@galxe-identity-protocol/evm-contracts");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
globalThis.galxe = sdk;
var provider = new ethers_1.ethers.JsonRpcProvider("http://127.0.0.1:8545");
var accounts = await provider.listAccounts();
var contractDeployer = accounts[0];
var contextRegistryContractAddress = await (0, util_1.deployContract)(
  galxe_protocol_contracts_1.factories.contracts.ContextRegistry__factory.abi,
  galxe_protocol_contracts_1.factories.contracts.ContextRegistry__factory.bytecode,
  contractDeployer
);
console.log("contextRegistry\u5408\u7EA6\u5730\u5740: ".concat(contextRegistryContractAddress));
