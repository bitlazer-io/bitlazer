# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Contract Commands
- `pnpm contracts:compile` - Compile Solidity contracts using Hardhat
- `pnpm contracts:build` - Compile contracts and generate ABI files
- `pnpm abi:generate` - Generate ABI files from compiled contracts
- `pnpm contracts:test` - Run contract tests using Hardhat
- `pnpm coverage` - Generate test coverage reports

### Frontend Commands
- `cd frontend && pnpm dev` - Start frontend development server with Vite
- `cd frontend && pnpm build` - Build production frontend bundle
- `cd frontend && pnpm lint` - Run ESLint on TypeScript/React files
- `cd frontend && pnpm lint:fix` - Fix ESLint issues automatically
- `cd frontend && pnpm format` - Format code using Prettier
- `cd frontend && pnpm preview` - Preview production build locally

### Solidity Code Quality
- `pnpm solhint` - Run Solidity linter on contracts
- `pnpm fmt` - Format test files using Prettier
- `pnpm fmtsol` - Format Solidity contracts using Prettier
- `pnpm fmtsol:check` - Check Solidity formatting without making changes

### Testing
- `pnpm contracts:test` - Run Hardhat contract tests
- `pnpm coverage` - Generate Solidity contract test coverage
- Frontend testing: Check frontend/package.json for available test scripts

## Architecture Overview

### Project Structure
This is a Bitcoin Layer 3 (L3) project built on Arbitrum Orbitrum technology, consisting of:

```
bitlazer/
├── contracts/              # Solidity smart contracts
│   ├── lBTC.sol            # Liquid BTC token contract
│   ├── stakelBTC.sol       # BTC staking contract
│   ├── stakedBTCAdapter.sol # Staking adapter implementation
│   ├── sZBTC.sol           # Staked ZBTC contract
│   └── WBTC.sol            # Wrapped BTC contract
├── frontend/               # React frontend application
├── scripts/                # Deployment and utility scripts
├── test/                   # Contract test files
├── artifacts/              # Compiled contract artifacts
└── docs/                   # Project documentation
```

### Tech Stack Core

#### Smart Contracts
- **Hardhat** development environment for Ethereum contracts
- **Solidity** smart contract programming language
- **OpenZeppelin** contracts for security and standards
- **TypeChain** for TypeScript contract bindings
- **Ethers.js v5** for blockchain interaction

#### Frontend
- **React 18** with TypeScript for the user interface
- **Vite** as build tool and development server
- **Tailwind CSS** for styling
- **Material-UI (@mui/material)** for UI components
- **Wagmi** and **Web3Modal** for Web3 wallet integration
- **TanStack Query** for data fetching and caching
- **React Router** for client-side routing

### Key Architectural Patterns

#### Smart Contract Architecture
- **ERC-20 Token Standards** for WBTC, lBTC, and other token contracts
- **Staking Mechanisms** with adapter pattern for flexible staking implementations
- **Upgradeable Contracts** using OpenZeppelin's upgradeable patterns
- **Security** with ReentrancyGuard and access control mechanisms

#### Frontend Architecture
- **React Hook Form** for form state management
- **React Router DOM** for navigation
- **Wagmi/Web3Modal** for wallet connectivity and blockchain interactions
- **Ethers.js** for smart contract interactions
- **TypeScript** strict mode for type safety

#### Development Patterns
- **Hardhat Network** for local blockchain development
- **Test-Driven Development** with Mocha and Chai for contract testing
- **Gas Optimization** reporting with hardhat-gas-reporter
- **Code Coverage** analysis for contract security

### Network Configuration

#### Deployed Contracts (Arbitrum Mainnet)
- WBTC: `0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f`
- lzrBTC: `0x0c978B2F8F3A0E399DaF5C41e4776757253EE5Df`

#### Test Contracts (Arbitrum Sepolia)
- WBTC: `0xa655cc81abD4A475fba7E8Ef4511A9e7bcbd1688`
- TBTC: `0xd7c8e18B464E5ff9f968c8CAB8DED2F0DEBF52c8`
- ABTC: `0x418840Ca602B0fd492A79252e07e3B0cc797E2D9`
- lzrBTC: `0x9787F9E130B82A2F45C9690884f5585f471C463E`

### Key Integration Points

#### Contract Development
- Hardhat configuration in `hardhat.config.js`
- Contract compilation outputs to `artifacts/` directory
- ABI generation script for frontend integration
- Gas reporting and coverage analysis for optimization

#### Frontend Integration
- Web3 wallet connection through Wagmi and Web3Modal
- Contract interaction using Ethers.js v5
- TypeScript types generated from contract ABIs
- Responsive design with Tailwind CSS and Material-UI

#### Development Workflow
- Husky pre-commit hooks for code quality
- Prettier and ESLint for consistent code formatting
- Solhint for Solidity code analysis
- pnpm for package management

### Performance Considerations
- Vite for fast frontend development and optimized builds
- Contract bytecode optimization in Hardhat
- Gas-efficient Solidity patterns
- Frontend code splitting and lazy loading

### Security Practices
- OpenZeppelin security contracts and patterns
- ReentrancyGuard for state-changing functions
- Access control mechanisms for administrative functions
- Comprehensive test coverage for critical contract functions

This is a Bitcoin Layer 3 project focused on bridging WBTC and enabling Bitcoin payments with smart contract capabilities. The platform combines Arbitrum's L3 technology with Bitcoin's security, creating a scalable ecosystem for Bitcoin-based DeFi applications. When working on features, follow the established contract patterns for security and the React/TypeScript patterns for frontend development.

## Git Commit Guidelines

- Do not include "Generated with Claude Code" or "Co-Authored-By: Claude" in commit messages  
- Keep commit messages concise and descriptive
- Use conventional commit format when appropriate (fix:, feat:, chore:, etc.)