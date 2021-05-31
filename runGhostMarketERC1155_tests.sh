#!/usr/bin/env bash

if [ $1 ]; then
 truffle test --network $1 test/GhostmarketERC1155.test.js test/TestGhostmarketERC1155_V2.sol
 echo "using given network"
else
 echo "using local test node"
 truffle test --network test test/GhostmarketERC1155.test.js test/TestGhostmarketERC1155_V2.sol
fi