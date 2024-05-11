import { defineConfig, configDefaults } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  test: {
    // Vitest test options based on your requirements
    testTimeout: 10000, // 10 seconds
    // Uncomment below if you need browser tests with specific settings
    // browser: {
    //   enabled: true,
    //   name: 'chrome',
    // },

    // Because of the usage of worker_threads, we need to use forks
    pool: "forks",
    poolOptions: {
      // parallel testing is enabled
      forks: {
        singleFork: false,
      },
    },
    // on-chain tests will be moved to other project.
    exclude: [...configDefaults.exclude],
  },
  // Ensure Vitest understands TypeScript
  plugins: [tsconfigPaths()],
});
