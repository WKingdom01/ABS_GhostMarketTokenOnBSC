# GhostMarket NFT ERC721 & ERC1155 Contracts
## Deployed Contracts:

#### GhostMarketERC721
https://bscscan.com/address/0xf41db445d7eaf45536985ce185ce131fa4b42e68

#### GhostMarketERC1155
https://bscscan.com/address/0x44c5ce28c29934b71a2a0447745d551dfc7b5133

#### ProxyAdmin
https://bscscan.com/address/0xdcdab251151c345ad527851eca783521ea3209e0

#### TransparentUpgradeableProxy
https://bscscan.com/address/0x26d583e2cda958b13cc319fad124aa729f8a196e

#### TransparentUpgradeableProxy
https://bscscan.com/address/0xe98e9d752d6104ada0520988cd1834035762c8c7

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



