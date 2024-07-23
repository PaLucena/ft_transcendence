#!/bin/sh

# Compile contracts
npx hardhat compile

# Start a local node
npx hardhat node &
HARDHAT_NODE_PID=$!

# Wait for the node to start
sleep 5

# Deploy the contract running the deploy script
npx hardhat run scripts/deploy.js --network localhost

# Stop the local node
wait $HARDHAT_NODE_PID
