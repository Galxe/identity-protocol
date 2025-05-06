#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Initializing the repository..."
corepack enable
corepack install
pnpm build

echo "Navigating to the apps/tutorial folder and installing dependencies..."
cd apps/tutorial
pnpm install

echo "Ensure the .env file contains the ZKVERIFY_SIGNER_PK variable with the appropriate private key."
echo "You can edit the .env file to add or update this value as needed."
echo

read -p "Press Enter to continue if you have updated the .env file with ZKVERIFY_SIGNER_PK..."

echo "Running the useZkVerify script..."
npm run useZkVerify
