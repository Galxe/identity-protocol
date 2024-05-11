import { promises as fs } from "fs";
import path from "path";

export async function mkdir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function saveToFile(content: string, outputDir: string, filename: string) {
  // create the output directory if it doesn't exist
  await fs.mkdir(outputDir, { recursive: true });
  const circuitPath = path.join(outputDir, filename);
  await fs.writeFile(circuitPath, content);
}

export async function rmdir(dir: string) {
  await fs.rm(dir, { recursive: true, force: true });
}

export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
