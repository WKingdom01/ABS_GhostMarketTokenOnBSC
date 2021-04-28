#!/bin/sh
# hack solution:
# modified the ERC721PresetMinterPauserAutoIdUpgradeable contract of openzeppelin
# to get the current nft id from the internal counter function
# you need to run this script once AFTER installing/updating node packeges and before compiling the contracts
cp ERC721PresetMinterPauserAutoIdUpgradeable.sol node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/presets/ERC721PresetMinterPauserAutoIdUpgradeable.sol