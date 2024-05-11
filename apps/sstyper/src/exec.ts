import { exec } from "child_process";
import { promisify } from "util";
import { Logger } from "tslog";
import { mkdir } from "./file";

const logger = new Logger({ name: "exec" });

// Convert exec into a Promise-based function
const execAsync = promisify(exec);

export async function compileCircuit(
  workDir: string,
  filename: string,
  outputDir: string = "artifacts"
): Promise<number> {
  try {
    await mkdir(`${workDir}/${outputDir}`);
    const command = `circom ${workDir}/${filename} --r1cs --wasm --sym -o ${workDir}/${outputDir} -l ./`;
    const { stdout, stderr } = await execAsync(command);

    // If the command prints anything to stderr, you might want to log it or throw an error
    if (stderr) {
      logger.warn(`Compile circuit warning: ${stderr}`);
    }

    logger.info("Circuit compiled successfully");
    logger.debug(stdout);
    // find out the number of constraints in the circuit
    const constraints = stdout.match(/wires: (\d+)/);
    return constraints ? parseInt(constraints[1]) : 0;
  } catch (error) {
    logger.error(`Error compiling circuit: ${error}`);
    throw error;
  }
}

export async function mv(from: string, to: string) {
  try {
    const command = `mv ${from} ${to}`;
    const { stdout, stderr } = await execAsync(command);

    // If the command prints anything to stderr, you might want to log it or throw an error
    if (stderr) {
      logger.warn(`Move file warning: ${stderr}`);
    }

    logger.info("File moved successfully");
    logger.debug(stdout);
  } catch (error) {
    logger.error(`Error moving file: ${error}`);
    throw error;
  }
}
