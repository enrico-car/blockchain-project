#!/bin/sh

# This script is used in order to copy the ABIs and the addresses of the
# contracts deployed by hardhat

echo "Backend entrypoint start"

sleep 15

MAX_WAIT=60
SECONDS_PASSED=0

# copy the deployed contracts json that contains the addresses in the backend folder
while [ ! -f "/app/shared/deployedContracts.json" ] && [ $SECONDS_PASSED -lt $MAX_WAIT ]; do
    echo "⚠️ No contract address found in /app/shared/. Waiting..."
    sleep 5
    SECONDS_PASSED=$((SECONDS_PASSED + 5))
done

SECONDS_PASSED=0
# copy the list of wallets addresses (only public key)
while [ ! -f "/app/shared/wallets.json" ] && [ $SECONDS_PASSED -lt $MAX_WAIT ]; do
    echo "⚠️ No wallet found in /app/shared/. Waiting..."
    sleep 5
    SECONDS_PASSED=$((SECONDS_PASSED + 5))
done

# copy the ABIs only if the deployed contracts json has been copied succesfully
if [ -f "/app/shared/deployedContracts.json" ]; then
    echo "✅ Copying ABIs..."
    mkdir -p /app/src/utils/abis

    cp /app/shared/abis/*.json /app/src/utils/abis/
    cp /app/shared/deployedContracts.json /app/src/utils/deployedContracts.json

    if [ -f "/app/shared/wallets.json" ]; then
        echo "✅ Copying Wallets..."
        cp /app/shared/wallets.json /app/src/utils/wallets.json
    else
        echo "⚠️ No wallets.json found."
    fi
else
    echo "❌ Timeout: No ABI found after $MAX_WAIT seconds."
fi

sleep 15

# after copying all the needed data, start the backend
npm run dev