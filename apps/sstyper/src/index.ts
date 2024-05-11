#!/usr/bin/env ts-node

import yargs from "yargs/yargs";
import type { Argv } from "yargs";
import { hideBin } from "yargs/helpers";

import { setupType } from "./setupType";

export function setupTypeCommand(yargs: Argv) {
  return yargs.command(
    "setup-type [name] [typedef] [creator-address-hex] [outputDir] [forceTypeId]",
    "Sets up a type based on provided parameters",
    yargs => {
      return yargs
        .option("name", {
          describe: "Name of the type",
          type: "string",
          demandOption: true,
        })
        .option("typedef", {
          describe: "Type definition",
          type: "string",
          demandOption: true,
        })
        .option("creator", {
          describe: "Creator of the type",
          type: "string",
          demandOption: true,
        })
        .option("outputDir", {
          describe: "Output directory for the generated files",
          type: "string",
          demandOption: true,
        })
        .option("forceTypeId", {
          describe: "Force a specific type ID",
          type: "number",
          demandOption: false,
        });
    },
    async argv => {
      const { name, typedef, creator, outputDir, forceTypeId } = argv;
      try {
        await setupType(name, typedef, creator, outputDir, forceTypeId);
        console.log("Type setup completed successfully.");
      } catch (error) {
        console.error("Failed to setup type:", error);
      }
    }
  );
}

async function main() {
  const cmd = yargs(hideBin(process.argv))
    .scriptName("gidp-sstyper")
    .usage("Usage: $0 <cmd> [options]")
    // .options({
    //   envfile: {
    //     default: ".env",
    //     describe: "path to the .env file",
    //   },
    // })
    .demandCommand(1, "You need at least one command before moving on")
    .strictCommands()
    .version("version", "0.0.1")
    .help();

  setupTypeCommand(cmd);
  await cmd.parse();
  process.exit(0);
}

main();
