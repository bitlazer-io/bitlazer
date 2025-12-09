# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Installation & Setup
- `pnpm install` - Install root dependencies (requires Node 20 and pnpm 9.x)
- `pnpm -C frontend install` - Install frontend dependencies
- Note: Only pnpm is allowed (enforced by preinstall script)

### Smart Contract Development
- `pnpm contracts:compile` - Compile Solidity contracts using Hardhat
- `pnpm contracts:build` - Compile contracts AND generate TypeScript ABIs for frontend
- `pnpm abi:generate` - Generate TypeScript ABI files from compiled contracts (run after compile)
- `pnpm contracts:test` - Run all contract tests using Hardhat
- `pnpm coverage` - Generate test coverage report for contracts
- `hardhat test test/lBTC.js` - Run a single test file
- `hardhat test --grep "pattern"` - Run tests matching a pattern

### Solidity Code Quality
- `pnpm solhint` - Lint Solidity contracts (uses `.solhint.json`)
- `pnpm fmtsol` - Format Solidity files with Prettier + prettier-plugin-solidity
- `pnpm fmtsol:check` - Check Solidity formatting without modifying files
- `pnpm fmt` - Format test files with Prettier

### Frontend Development
- `pnpm -C frontend dev` - Start Vite development server (default: http://localhost:3000)
- `pnpm -C frontend build` - Build production frontend bundle
- `pnpm -C frontend preview` - Preview production build locally
- `pnpm -C frontend lint` - Run ESLint on frontend TypeScript/React files
- `pnpm -C frontend lint:fix` - Auto-fix ESLint issues
- `pnpm -C frontend format` - Format frontend code with Prettier
- `pnpm -C frontend test` - Run frontend tests with Vitest
- `pnpm -C frontend test:watch` - Run Vitest in watch mode

### Network Scripts
- `pnpm scripts:wrap-1lbtc` - Wrap 1 LBTC on Arbitrum Sepolia testnet

## Architecture Overview

### Project Type
Bitlazer is a Bitcoin Layer 3 (L3) blockchain built on Arbitrum Orbitrum technology. It enables WBTC bridging to native L3 currency, supports Bitcoin payments, and provides a scalable smart contracts ecosystem.

### Repository Structure
```
bitlazer/
├── contracts/              # Solidity smart contracts (*.sol)
├── test/                   # Hardhat contract tests (Mocha/Chai)
├── scripts/                # Deployment and utility scripts
│   └── generate-abi.js     # Generates TypeScript ABIs for frontend
├── frontend/               # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── web3/           # Web3 integration utilities
│   │   ├── hooks/          # React hooks (including contract hooks)
│   │   ├── services/       # API and service layer
│   │   ├── stores/         # Zustand state management
│   │   └── assets/abi/     # Auto-generated contract ABIs (*.tsx)
│   └── package.json        # Separate frontend dependencies
├── artifacts/              # Compiled contract artifacts (generated)
├── cache/                  # Hardhat cache (generated)
└── hardhat.config.js       # Hardhat configuration with network settings
```

### Core Smart Contracts
- **lBTC.sol** (contract name: `lzrBTC`) - Liquid BTC token; main wrapped BTC contract with mint/burn and decimal conversion (8→18)
- **stakelBTC.sol** (contract name: `StakeLBTC`) - BTC staking mechanism
- **stakedBTCAdapter.sol** (contract name: `StakeAdapter`) - Adapter pattern for staking implementations
- **sZBTC.sol** (contract name: `SZBTC`) - Staked ZBTC rewards token
- **WBTC.sol** - Wrapped BTC standard ERC-20 implementation

All contracts use OpenZeppelin upgradeable patterns and security guards (ReentrancyGuard, AccessControl, Ownable).

### Technology Stack

#### Smart Contracts
- **Hardhat 2.x** - Development environment
- **Solidity 0.8.24** - Smart contract language
- **OpenZeppelin Contracts 4.9.6** - Security standards and upgradeable patterns
- **Ethers.js v5** - Blockchain interactions
- **TypeChain** - TypeScript bindings generation
- **Mocha/Chai** - Test framework

#### Frontend
- **React 18** with TypeScript
- **Vite 5** - Build tool and dev server
- **Wagmi 2.x + Web3Modal 5.x** - Web3 wallet connection
- **Ethers.js v5** - Contract interactions (note: uses v5, not v6)
- **TanStack Query** - Data fetching and caching
- **Zustand** - State management
- **Material-UI (@mui/material)** - UI components
- **Tailwind CSS 3** - Utility-first styling
- **React Router 6** - Client-side routing
- **React Hook Form** - Form management
- **Vitest** - Unit testing

### Key Architectural Patterns

#### Contract Architecture
- **Upgradeable Contracts**: All main contracts use OpenZeppelin's UUPS proxy pattern with `initializer` functions
- **Decimal Conversion**: lzrBTC handles 8-decimal WBTC ↔ 18-decimal lzrBTC conversion with dust collection
- **Access Control**: Multi-role system using `AccessControlUpgradeable` and `OwnableUpgradeable`
- **Pausable Operations**: Owner can pause minting/burning and extra holder balance features
- **Staking Rewards**: sZBTC can be burned to increase lzrBTC holder balance for enhanced withdrawals

#### Frontend-Contract Integration
- ABIs are auto-generated from compiled contracts via `scripts/generate-abi.js`
- Generated ABIs live in `frontend/src/assets/abi/` as TypeScript files with Viem `Abi` type
- Contract file names ≠ contract names (e.g., `lBTC.sol` → `lzrBTC` contract → `lzrBTC.tsx` ABI)
- Always run `pnpm contracts:build` after contract changes to update frontend ABIs

#### Testing Strategy
- **Contract Tests**: Hardhat tests in `test/` using Mocha/Chai with `@nomicfoundation/hardhat-chai-matchers`
- **Frontend Tests**: Vitest tests for utilities and components
- Tests verify upgradeable proxy deployment, ownership transfers, pause mechanisms, mint/burn with decimal conversions, and dust collection

### Network Configuration (Hardhat)
The project supports multiple networks defined in `hardhat.config.js`:
- **hardhat** (local, chainId 1337)
- **local** (http://127.0.0.1:8545/)
- **sepolia** (Ethereum testnet)
- **ethereum** (mainnet)
- **arbitrum-sepolia** (Arbitrum testnet, chainId 421614)
- **arbitrum** (Arbitrum mainnet, chainId 42161)

All networks except local/hardhat require `ETHEREUM_PRIVATE_KEY` environment variable.

#### Deployed Contracts
**Arbitrum Mainnet:**
- WBTC: `0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f`
- lzrBTC: `0x0c978B2F8F3A0E399DaF5C41e4776757253EE5Df`
- LZR: `0xB80FcFC1488dE673fe4cA1ee0a38FF4Bd85A570e`

**Arbitrum Sepolia Testnet:**
- WBTC: `0xa655cc81abD4A475fba7E8Ef4511A9e7bcbd1688`
- TBTC: `0xd7c8e18B464E5ff9f968c8CAB8DED2F0DEBF52c8`
- ABTC: `0x418840Ca602B0fd492A79252e07e3B0cc797E2D9`
- lzrBTC: `0x9787F9E130B82A2F45C9690884f5585f471C463E`

### Development Workflow

#### Contract Development Flow
1. Edit contracts in `contracts/`
2. Compile: `pnpm contracts:compile`
3. Run tests: `pnpm contracts:test`
4. Generate ABIs for frontend: `pnpm abi:generate` (or use `pnpm contracts:build` for steps 2+4)
5. Lint: `pnpm solhint` and `pnpm fmtsol:check`
6. Format: `pnpm fmtsol`

#### Frontend Development Flow
1. Ensure ABIs are up-to-date: `pnpm contracts:build`
2. Start dev server: `pnpm -C frontend dev`
3. Make changes in `frontend/src/`
4. Lint: `pnpm -C frontend lint`
5. Format: `pnpm -C frontend format`
6. Test: `pnpm -C frontend test`

#### Pre-commit Checks
Husky hooks run `pnpm fmtsol` and `pnpm compile-contracts` before commits to ensure code quality.

### Code Style
- **Solidity**: Prettier with `prettier-plugin-solidity`; 2-space indentation; PascalCase for contracts
- **TypeScript/React**: Prettier + ESLint 8; 2-space indentation; camelCase for variables/functions; PascalCase for components/types
- **Commit Messages**: Use conventional commit format (feat:, fix:, refactor:, chore:, etc.)

### Important Notes
- **Contract naming mismatch**: File `lBTC.sol` contains contract `lzrBTC`, not `lBTC`
- **Ethers.js version**: Frontend uses Ethers.js v5, not v6 (different API)
- **ABI generation**: Must run after every contract change for frontend to access latest interfaces
- **Decimal conversion**: WBTC uses 8 decimals, lzrBTC uses 18 decimals; conversion is handled in contract with dust collection
- **Upgradeable pattern**: All main contracts use UUPS proxies; use `@openzeppelin/hardhat-upgrades` for deployment
- **Node/pnpm versions**: Strictly requires Node 20 and pnpm 9.x (enforced by package.json engines and preinstall script)
