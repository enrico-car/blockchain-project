#!/bin/sh

npx hardhat node --hostname 0.0.0.0 &

sleep 5

npx hardhat run scripts/deploy.js --network localhost

npx hardhat coverage

tail -f /dev/null