# Ghost Market NFT Contract
## Audit

Coming soon...
## Technical Information

Upgradable ERC721 Contract.

Using OpenZeppelin contracts.

## *current hack solution*
modified the ERC721PresetMinterPauserAutoIdUpgradeable contract of openzeppelin
in order to get the current nft id from the internal counter function

you need to run this script once: AFTER installing/updating node packeges and before compiling the contracts
```
sh hack.sh
```
### compiling contracts
```
truffle compile --all
```
### Deploying Proxy

Using Truffle to deploying Proxy
```
contracts/Migrations.sol
```
Contracts can be deployed with
```
truffle deploy --network <network_name>
```
For local deployment ganache must be started and private keys saved into

```
.secrets.json
```

local deployment:
```
truffle deploy --network development
```

testnet deployment:
```
truffle deploy --network <TESTNET_NAME>
```

mainnet deployment:
```
truffle deploy --network mainnet
```

## Testing

tests can be run with:
```
truffle test --network test
```
and 

```
runGhostMarketERC721_tests.sh
```
### running individual tests

choose a test file
```
truffle test/<testname>.js
```

with the .only flag individual test can be run  
```
it.only("should run this test") async function () {
  ...
}
```



