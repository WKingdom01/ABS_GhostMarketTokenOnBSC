const web3 = require('web3');

const HDWalletProvider = require('@truffle/hdwallet-provider');

const {
  INFURA_PROJECT_ID,
  LOCAL_TEST_MNEMONIC,
  RINKEBY_PRIVATE_KEYS,
  ROPSTEN_PRIVATE_KEYS,
  BSC_MAINNET_PRIVATE_KEY,
  BSC_TESTNET_PRIVATE_KEY,
  BSCSCAN_MAINNET_API_KEY,
  BSCSCAN_TESTNET_API_KEY } = require('./.secrets.json');
/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * trufflesuite.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

// const HDWalletProvider = require('@truffle/hdwallet-provider');
// const infuraKey = "fj4jll3k.....";
//
//const fs = require('fs');
//const mnemonic = fs.readFileSync(".secret").toString().trim();

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    test: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (default: none)
      network_id: "*",
    },
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 7545,            // Standard Ethereum port (default: none)
      network_id: "*",
      gas: 6000000,
      gasPrice: 10,
    },
    rinkeby: {
      provider: function () {
        return new HDWalletProvider({
          privateKeys: RINKEBY_PRIVATE_KEYS,
          providerOrUrl: "https://rinkeby.infura.io/v3/" + INFURA_PROJECT_ID,
          numberOfAddresses: 2,
          derivationPath: "m/44'/60'/0'/0"
        })
      },
      network_id: 4,
      networkCheckTimeout: 10000,
      skipDryRun: false
    },
    ropsten: {
      provider: function () {
        return new HDWalletProvider({
          privateKeys: ROPSTEN_PRIVATE_KEYS,
          providerOrUrl: "https://rinkeby.infura.io/v3/" + INFURA_PROJECT_ID,
          numberOfAddresses: 2,
          derivationPath: "m/44'/60'/0'/0"
        })
      },
      network_id: 3,
      networkCheckTimeout: 10000,
      skipDryRun: false
    },
    bsctestnet: {
      provider: function () {
        return new HDWalletProvider(
          BSC_TESTNET_PRIVATE_KEY,
          "https://data-seed-prebsc-2-s1.binance.org:8545/"
          // alternative RPC
          //"https://data-seed-prebsc-1-s3.binance.org:8545"
        );
      },
      network_id: "97",
      gas: 10000000,
      gasPrice: 10000000000,
    },
    bscmainnet: {
      provider: function () {
        return new HDWalletProvider(
          BSC_MAINNET_PRIVATE_KEY,
          "https://bsc-dataseed.binance.org/"
          // alternative RPC
          //"https://bsc-dataseed1.defibit.io/"
        );
      },
      network_id: "56",
      gas: 10000000,
      gasPrice: 10000000000,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.4",    // Fetch exact version from solc-bin (default: truffle's version)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 1337
        }
      }
    }
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    bscscan: BSCSCAN_TESTNET_API_KEY
  }
};
