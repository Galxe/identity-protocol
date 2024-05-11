import { defineConfig } from "tsup";
import type { Options, Format } from "tsup";
import { polyfillNode } from "esbuild-plugin-polyfill-node";

// Ensure that these option fields are not undefined
type MandatoryOptions = Options & {
  outDir: string;
  platform: string;
  format: Format | Format[];
};

// Default config, used as a base template
const DEFAULT_CONFIG: Options = {
  bundle: true,
  clean: true,
  dts: true,
  minify: true,
  entry: ["src/index.ts"],
  skipNodeModulesBundle: true,
  sourcemap: true,
  splitting: true,
  target: "es2022",
  // typechain generated types are somehow pretty funky, bundle them together
  noExternal: ["@galxe-identity-protocol/evm-contracts"],
};

// Common.js config
const COMMON_CONFIG: MandatoryOptions = {
  ...DEFAULT_CONFIG,
  format: "cjs",
  outDir: "dist/common",
  platform: "browser",
};

// ESM config
const ESM_CONFIG: MandatoryOptions = {
  ...DEFAULT_CONFIG,
  entry: ["src/**/*.ts", "!src/**/*.test.*", "!src/testutils"], // Include all files but tests, better tree-shaking
  format: "esm",
  outDir: "dist/esm",
  platform: "browser",
};

// All bundled config
const ALL_BUNDLED: MandatoryOptions = {
  ...DEFAULT_CONFIG,
  splitting: true,
  sourcemap: false,
  target: "es2020",
  dts: true,
  clean: true,
  esbuildPlugins: [polyfillNode({})],
  define: {
    global: "global",
    process: "process",
    Buffer: "Buffer",
  },
  format: ["cjs"],
  outDir: "dist/bundled",
  platform: "browser",
  noExternal: [
    "@galxe-identity-protocol/evm-contracts",
    "ethers",
    "snarkjs",
    "@iden3/js-merkletree",
    "@iden3/js-crypto",
  ],
};

// Browser config
const BROWSER_CONFIG: MandatoryOptions = {
  ...DEFAULT_CONFIG,
  name: "browser",
  platform: "browser",
  globalName: "gidp",
  format: ["iife"],
  outDir: "./dist/browser",
  skipNodeModulesBundle: false,
  bundle: true,
  splitting: false,
  sourcemap: true,
  esbuildPlugins: [
    polyfillNode({
      polyfills: {
        fs: true,
        crypto: true,
      },
    }),
  ],
};

export default defineConfig([COMMON_CONFIG, ESM_CONFIG, BROWSER_CONFIG, ALL_BUNDLED]);
