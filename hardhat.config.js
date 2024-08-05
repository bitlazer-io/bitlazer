require('@nomicfoundation/hardhat-toolbox')
require('@openzeppelin/hardhat-upgrades')
require('@nomiclabs/hardhat-ethers')
require('solidity-coverage')

// ETHEREUM_PRIVATE_KEY default is just a random empty key
const ETHEREUM_PRIVATE_KEY =
  process.env['ETHEREUM_PRIVATE_KEY'] || '0xf289ba7bc170a8bb1351c00cc8ea202628cc3e52e556d16decbde6ff8baeac5e'

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.24',
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    allowUnlimitedContractSize: true,
  },
  networks: {
    hardhat: {
      chainId: 1337,
      // accounts: accounts
    },
    local: {
      url: 'http://127.0.0.1:8545/',
    },
    // https://chainlist.org/chain/11155111
    sepolia: {
      url: 'https://ethereum-sepolia.publicnode.com',
      chainId: 11155111,
      accounts: [ETHEREUM_PRIVATE_KEY],
    },
    ethereum: {
      url: 'https://eth.llamarpc.com',
      chainId: 1,
      accounts: [ETHEREUM_PRIVATE_KEY],
    },
    // https://chainlist.org/chain/421614
    'arbitrum-sepolia': {
      url: 'https://sepolia-rollup.arbitrum.io/rpc',
      chainId: 421614,
      accounts: [ETHEREUM_PRIVATE_KEY],
    },
    arbitrum: {
      url: 'https://arb1.arbitrum.io/rpc',
      chainId: 42161,
      accounts: [ETHEREUM_PRIVATE_KEY],
    },
  },
}
