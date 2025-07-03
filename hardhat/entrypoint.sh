#!/bin/sh

# This script is used to start the Hardhat node and run the deployment script.
npx hardhat node --hostname 0.0.0.0 &

sleep 5

# run the deployment script
npx hardhat run scripts/deploy.js --network localhost

# run the tests
npx hardhat coverage

# Keep the container running
tail -f /dev/null