#!/usr/bin/env bash
if [ $1 ]; then
 truffle test --network $1 test/GhostmarketERC721.test.js test/TestGhostMarketERC721_V2.sol
 echo "using given network"
else
 echo "using local test node"
 truffle test --network test test/GhostmarketERC721.test.js test/TestGhostMarketERC721_V2.sol
fi