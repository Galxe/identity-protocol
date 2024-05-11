import { credType, errors, babyzk, utils } from "@galxe-identity-protocol/sdk";
import { Logger } from "tslog";
import { saveToFile, rmdir, exists } from "./file";
import { compileCircuit, mv } from "./exec";
import { randomAsciiString, randomHex } from "./crypto";

import { zKey } from "snarkjs";
import path from "path";
import bfj from "bfj";
import { utils as ffutils } from "ffjavascript";

const logger = new Logger({ name: "setupType" });

async function trustedSetupInit(wordDir: string, r1csFileName: string, ptauFilePath: string) {
  const initKeyPath = path.join(wordDir, "circuit_0000.zkey");
  const r1csFilePath = path.join(wordDir, r1csFileName);
  await zKey.newZKey(r1csFilePath, ptauFilePath, initKeyPath, logger);
  logger.info(`Init key generated at ${initKeyPath}`);
  const p2c1ZkeyPath = path.join(wordDir, "circuit_0001.zkey");
  await zKey.contribute(initKeyPath, p2c1ZkeyPath, "p2_C1", randomAsciiString(512), logger);
  logger.info(`p2c1 key generated at ${p2c1ZkeyPath}`);
  const finalZkeyPath = path.join(wordDir, "circuit_final.zkey");
  // 1 party beacon does not matter.
  const beaconHash = randomHex(250);
  await zKey.beacon(p2c1ZkeyPath, finalZkeyPath, "final beacon phase2", beaconHash, 10, logger);
  logger.info(`Final key generated at ${finalZkeyPath}`);

  const vKey = await zKey.exportVerificationKey(finalZkeyPath, logger);
  logger.info(`Verification key exported`);

  await bfj.write(path.join(wordDir, "circuit.vkey.json"), ffutils.stringifyBigInts(vKey), { space: 1 });
  return vKey;
}

const unwrap = errors.unwrap;

export async function setupType(
  name: string,
  typedef: string,
  creator: string,
  outputDir: string,
  forceTypeId?: number
) {
  if (outputDir.endsWith("/")) {
    outputDir = outputDir.slice(0, -1);
  }
  const type = unwrap(credType.parseCredType(typedef));
  type.typeID = forceTypeId !== undefined ? BigInt(forceTypeId) : credType.computeTypeID(creator, name);
  logger.info(`Type ID: ${type.typeID.toString()}`);
  logger.info(`Type: ${utils.JSONStringifyBigInts(type)}`);

  const circuit = babyzk.genCircuit(type);
  const circuitFileName = "circuit.circom";

  // save circuit to outputDir/circuit.circom
  await saveToFile(circuit.code, outputDir, circuitFileName);

  const circomOutput = "artifacts";
  // compile the circuit to outputDir
  const numConstraints = await compileCircuit(outputDir, circuitFileName, circomOutput);
  if (numConstraints === 0) {
    throw new Error("No constraints found in the circuit");
  }

  // find the smallest power of 2 that is greater than or equal to numConstraints
  const exp = Math.ceil(Math.log2(numConstraints));
  logger.info(`Number of constraints: ${numConstraints}`);
  const ptauId = exp.toString().padStart(2, "0");
  const ptauFile = `./ptaus/powersOfTau28_hez_final_${ptauId}.ptau`;
  if (!(await exists(ptauFile))) {
    throw new Error(`Powers of tau file not found: ${ptauFile}`);
  }
  logger.info(`Using ptau file: ${ptauFile}`);

  const vkey = await trustedSetupInit(path.join(outputDir, circomOutput), "circuit.r1cs", ptauFile);
  logger.info(`Verification key: ${utils.JSONStringifyBigInts(vkey)}`);

  // now use the compiled circuit's verification key to generate the verifier contract code
  const code = babyzk.genOnChainVerifierCode(circuit, vkey);
  logger.info(`Verifier contract code generated`);
  await saveToFile(code, outputDir, "verifier.sol");

  // move useful files from artifacts to outputDir
  await mv(`${outputDir}/${circomOutput}/circuit_final.zkey`, `${outputDir}/circuit_final.zkey`);
  await mv(`${outputDir}/${circomOutput}/circuit.vkey.json`, `${outputDir}/circuit.vkey.json`);
  await mv(`${outputDir}/${circomOutput}/circuit_js/circuit.wasm`, `${outputDir}/circom.wasm`);
  await rmdir(`${outputDir}/${circomOutput}`);
}
