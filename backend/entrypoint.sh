#!/bin/sh

echo "Backend entrypoint start"

sleep 15

# Timer di 60 secondi
MAX_WAIT=60
SECONDS_PASSED=0

while [ ! -f "/app/shared/deployedContracts.json" ] && [ $SECONDS_PASSED -lt $MAX_WAIT ]; do
    echo "⚠️ No ABI found in /app/shared/abis. Waiting..."
    sleep 5
    SECONDS_PASSED=$((SECONDS_PASSED + 5))
done

if [ -f "/app/shared/deployedContracts.json" ]; then
    echo "📦 Copying ABIs..."
    mkdir -p /app/src/utils/abis
    cp /app/shared/abis/*.json /app/src/utils/abis/
    cp /app/shared/deployedContracts.json /app/src/utils/deployedContracts.json
else
    echo "❌ Timeout: No ABI found after $MAX_WAIT seconds."
fi

sleep 15

npm run dev