# GhostMarket NFT ERC721 & ERC1155 Contracts
## Audit

Coming soon...
## Technical Information

Upgradable ERC721 & ERC1155 Contract.

Using OpenZeppelin contracts.
### Compiling contracts
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
truffle deploy --network <MAINNET_NAME>
```

## Testing

tests can be run with:

```
./runGhostMarketERC721_tests.sh
```

default network is `test` or a network parameter can be added

```
./runGhostMarketERC721_tests.sh bsctestnet
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



