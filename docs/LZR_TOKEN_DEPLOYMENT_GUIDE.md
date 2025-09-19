# LZR Token Deployment Guide

A comprehensive step-by-step guide to create and deploy the LZR token for the Bitlazer ecosystem.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Planning Phase](#planning-phase)
4. [Development Environment Setup](#development-environment-setup)
5. [Token Contract Development](#token-contract-development)
6. [Deployment Strategy](#deployment-strategy)
7. [Marketing & Launch Strategy](#marketing--launch-strategy)
8. [Post-Launch Operations](#post-launch-operations)

## Overview

The LZR token is the native governance and utility token for the Bitlazer ecosystem, designed to:
- Provide governance rights for protocol decisions
- Enable dual yield staking (Bitcoin + LZR rewards)
- Power the grants program for ecosystem developers
- Offer fee discounts on cross-chain bridge operations
- Incentivize early builders and active contributors
- Support the L3 network bootstrap process

### Token Economics Overview
- **Name**: Lazer Token
- **Symbol**: LZR
- **Type**: ERC-20 (Arbitrum One integration)
- **Network**: Bitlazer L3 (Chain ID: 14235)
- **Arbitrum One Contract**: `0xB80FcFC1488dE673fe4cA1ee0a38FF4Bd85A570e`
- **Bridge Integration**: Works with existing lzrBTC staking mechanism
- **Total Supply**: 1,000,000,000 LZR (aligned with roadmap)
- **Use Cases**: Governance, Dual Yield Staking, Bridge Fees, Developer Grants

## Prerequisites

### Technical Requirements
- Node.js (v18 or higher)
- Basic understanding of blockchain concepts
- Familiarity with smart contracts
- Wallet with testnet funds

### Tools You'll Need
- **Development**: Hardhat, Remix IDE, or Foundry
- **Wallets**: MetaMask (with Bitlazer network added)
- **Network Setup**: Bitlazer L3 configuration (Chain ID: 14235)
- **Testing**: lzrBTC tokens for testing staking integration
- **Deployment**: Deployment scripts and Caldera explorer verification

## Planning Phase

### 1. Define Tokenomics

```
Total Supply: 1,000,000,000 LZR (1 Billion)

Distribution (Based on Bitlazer Roadmap):
- Early Builders: 20% (200M LZR) - 4-year vesting (per roadmap)
- Developer Grants: 15% (150M LZR) - Ecosystem growth program
- Network Bootstrap: 25% (250M LZR) - L3 validator incentives
- Dual Yield Staking: 20% (200M LZR) - Bitcoin + LZR rewards
- Bridge Liquidity: 10% (100M LZR) - Cross-chain operations
- Treasury/DAO: 10% (100M LZR) - Community controlled
```

### 2. Choose Blockchain Network

#### Option A: Bitlazer L3 Network (Primary)
- **Chain ID**: 14235
- **RPC**: https://bitlazer.calderachain.xyz/http
- **Explorer**: https://bitlazer.calderaexplorer.xyz/
- **Pros**: Native integration, ultra-low fees, optimized for Bitcoin operations
- **Cons**: Newer network, requires bridging from Arbitrum

#### Option B: Arbitrum One (Bridge Integration)
- **Existing Contracts**: WBTC (0x2f2a...), lzrBTC (0x0c97...)
- **Pros**: Established ecosystem, existing liquidity, direct integration
- **Cons**: Higher gas costs than L3

#### Option C: Multi-Chain Deployment
- **Primary**: Bitlazer L3 for native operations
- **Secondary**: Arbitrum One for liquidity and bridging
- **Future**: Potential expansion to other EVM chains

### 3. Define Token Features

```solidity
Core Features:
- Standard ERC-20 functionality
- Burnable tokens
- Pausable transfers (emergency use)
- Access control (roles-based)
- Permit functionality (gasless approvals)

Additional Features:
- Staking integration
- Governance voting power
- Fee discount mechanism
- Multi-signature wallet integration
```

## Development Environment Setup

### 1. Install Required Tools

```bash
# Install Node.js and npm
# Visit nodejs.org and download Node.js v18+

# Install Hardhat
npm install -g hardhat

# Install other tools
npm install -g @openzeppelin/contracts
npm install -g dotenv
```

### 2. Initialize Project

```bash
# Create new directory
mkdir lzr-token-deployment
cd lzr-token-deployment

# Initialize Hardhat project
npx hardhat init

# Install dependencies
npm install @openzeppelin/contracts @nomiclabs/hardhat-ethers ethers dotenv
```

### 3. Environment Configuration

Create `.env` file:
```bash
PRIVATE_KEY=your_wallet_private_key_here
INFURA_API_KEY=your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
BITLAZER_RPC_URL=https://bitlazer.calderachain.xyz/http
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
# Integration with existing contracts
LZRBTC_CONTRACT=0x0c978B2F8F3A0E399DaF5C41e4776757253EE5Df
WBTC_CONTRACT=0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f
```

## Token Contract Development

### 1. Basic LZR Token Contract

Create `contracts/LZRToken.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract LZRToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ERC20Permit {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 Billion tokens
    
    // Integration with existing lzrBTC staking
    address public immutable lzrBTCContract;
    mapping(address => uint256) public stakingMultipliers;
    
    // Dual yield tracking
    mapping(address => uint256) public bitcoinRewards;
    mapping(address => uint256) public lzrRewards;
    
    constructor(
        address defaultAdmin,
        address _lzrBTCContract
    ) ERC20("Lazer Token", "LZR") ERC20Permit("Lazer Token") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        
        lzrBTCContract = _lzrBTCContract;
        
        // Mint initial supply to deployer for distribution
        _mint(defaultAdmin, TOTAL_SUPPLY);
    }
    
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= TOTAL_SUPPLY, "Exceeds total supply");
        _mint(to, amount);
    }
    
    // Set staking multiplier for addresses (like Garden Finance)
    function setStakingMultiplier(address user, uint256 multiplier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        stakingMultipliers[user] = multiplier;
    }
    
    // Get effective balance with multiplier
    function getEffectiveBalance(address user) external view returns (uint256) {
        uint256 balance = balanceOf(user);
        uint256 multiplier = stakingMultipliers[user];
        
        if (multiplier > 0) {
            return balance * multiplier / 10000; // multiplier in basis points
        }
        return balance;
    }
    
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override(ERC20, ERC20Pausable)
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}
```

### 2. Staking Contract (Garden Finance Style)

Create `contracts/LZRStaking.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LZRStaking is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable lzrToken;
    
    struct StakeInfo {
        uint256 amount;
        uint256 multiplier; // basis points (10000 = 1x)
        uint256 stakeTime;
        uint256 lockPeriod; // in seconds
    }
    
    mapping(address => StakeInfo) public stakes;
    
    // Multiplier tiers based on stake amount
    uint256[] public stakeTiers = [0, 5000, 20000, 50000, 100000]; // in tokens
    uint256[] public multipliers = [10000, 12000, 15000, 20000, 25000]; // basis points
    
    event Staked(address indexed user, uint256 amount, uint256 multiplier);
    event Unstaked(address indexed user, uint256 amount);
    
    constructor(address _lzrToken) {
        lzrToken = IERC20(_lzrToken);
    }
    
    function stake(uint256 amount, uint256 lockPeriod) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(lockPeriod >= 30 days, "Minimum lock period is 30 days");
        
        lzrToken.safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 multiplier = calculateMultiplier(amount, lockPeriod);
        
        stakes[msg.sender] = StakeInfo({
            amount: amount,
            multiplier: multiplier,
            stakeTime: block.timestamp,
            lockPeriod: lockPeriod
        });
        
        emit Staked(msg.sender, amount, multiplier);
    }
    
    function calculateMultiplier(uint256 amount, uint256 lockPeriod) public view returns (uint256) {
        uint256 baseMultiplier = 10000; // 1x
        
        // Amount-based multiplier
        for (uint i = stakeTiers.length - 1; i > 0; i--) {
            if (amount >= stakeTiers[i] * 1e18) {
                baseMultiplier = multipliers[i];
                break;
            }
        }
        
        // Time-based bonus
        uint256 timeBonus = (lockPeriod / 30 days) * 500; // 5% per month
        return baseMultiplier + timeBonus;
    }
    
    function unstake() external nonReentrant {
        StakeInfo memory userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");
        require(
            block.timestamp >= userStake.stakeTime + userStake.lockPeriod,
            "Still in lock period"
        );
        
        delete stakes[msg.sender];
        lzrToken.safeTransfer(msg.sender, userStake.amount);
        
        emit Unstaked(msg.sender, userStake.amount);
    }
    
    function getEffectiveStake(address user) external view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        return userStake.amount * userStake.multiplier / 10000;
    }
}
```

### 3. Deployment Script

Create `scripts/deploy.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    
    // Deploy LZR Token
    const LZRToken = await ethers.getContractFactory("LZRToken");
    const lzrToken = await LZRToken.deploy(deployer.address);
    await lzrToken.deployed();
    
    console.log("LZR Token deployed to:", lzrToken.address);
    
    // Deploy Staking Contract
    const LZRStaking = await ethers.getContractFactory("LZRStaking");
    const lzrStaking = await LZRStaking.deploy(lzrToken.address);
    await lzrStaking.deployed();
    
    console.log("LZR Staking deployed to:", lzrStaking.address);
    
    // Grant minter role to staking contract if needed
    await lzrToken.grantRole(await lzrToken.MINTER_ROLE(), lzrStaking.address);
    
    console.log("Setup complete!");
    console.log("LZR Token:", lzrToken.address);
    console.log("LZR Staking:", lzrStaking.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

## Deployment Strategy

### Phase 1: Testnet Deployment

#### Bitlazer L3 Testnet Deployment
```bash
# Add Bitlazer network to Hardhat config
# hardhat.config.js:
bitlazer: {
  url: "https://bitlazer.calderachain.xyz/http",
  chainId: 14235,
  accounts: [process.env.PRIVATE_KEY]
}

# Deploy to Bitlazer L3
npx hardhat run scripts/deploy.js --network bitlazer

# Verify on Caldera explorer
npx hardhat verify --network bitlazer CONTRACT_ADDRESS
```

#### Testing Checklist
- [ ] Token minting works correctly
- [ ] Transfers function properly
- [ ] Staking mechanism operates as expected
- [ ] Multipliers calculate correctly
- [ ] Access controls are enforced

### Phase 2: Mainnet Deployment

#### Security Audit
- Conduct thorough code review
- Get professional audit (recommended: OpenZeppelin, ConsenSys Diligence)
- Test on testnets extensively
- Set up monitoring and alerts

#### Mainnet Launch
```bash
# Deploy to Bitlazer L3 Mainnet
npx hardhat run scripts/deploy.js --network bitlazer

# Deploy bridge contract to Arbitrum One for liquidity
npx hardhat run scripts/deploy-bridge.js --network arbitrum

# Verify contracts
npx hardhat verify --network bitlazer CONTRACT_ADDRESS CONSTRUCTOR_ARGS
```

### Phase 3: Alternative Networks

#### Solana Deployment (Optional)
Using pump.fun or manual deployment:

1. **Using pump.fun**: 
   - Visit https://pump.fun
   - Click "Create coin"
   - Upload token metadata
   - Set initial parameters
   - Launch with bonding curve

2. **Manual Solana Deployment**:
   - Install Solana CLI
   - Create SPL token
   - Set up metadata
   - Deploy to mainnet

## Marketing & Launch Strategy

### 1. Pre-Launch (4-6 weeks)

#### Community Building
- **Discord/Telegram**: Create official channels
- **Twitter/X**: Build following using tools like TweetHunter
- **Medium**: Publish tokenomics and roadmap
- **Documentation**: Complete technical docs

#### Tools for Growth
- **Kaito.ai**: AI-powered crypto marketing analytics
- **TweetHunter**: Twitter growth automation
- **RiseKarma**: Community engagement platform

### 2. Launch Phase (Weeks 1-2)

#### Liquidity Provision
```javascript
// Example Uniswap V3 liquidity addition
const liquidity = {
    token0: LZR_TOKEN_ADDRESS,
    token1: USDC_ADDRESS, // or ETH
    fee: 3000, // 0.3%
    amount0: ethers.utils.parseEther("100000"), // 100k LZR
    amount1: ethers.utils.parseUnits("10000", 6), // $10k USDC
}
```

#### Distribution Strategy
- **Airdrop**: 5% to early community members
- **Liquidity Mining**: 10% over first 6 months
- **Staking Rewards**: Start with 20% APY

### 3. Growth Phase (Months 1-6)

#### Ecosystem Integration
- Integrate with existing lzrBTC staking (0x0c978B2F8F3A0E399DaF5C41e4776757253EE5Df)
- Add LZR as fee token for bridge operations
- Implement grants program distribution mechanism
- Launch early builder reward system (20% allocation)
- Partner with Arbitrum ecosystem protocols

#### Marketing Activities
- **Influencer Partnerships**: Crypto Twitter KOLs
- **AMAs**: Regular community sessions
- **Content Marketing**: Technical articles, tutorials
- **Yield Farming**: Incentivize liquidity provision

## Post-Launch Operations

### 1. Monitoring & Analytics

#### Key Metrics to Track
- Total Supply & Circulating Supply
- Holder Count & Distribution
- Trading Volume & Liquidity
- Staking Participation Rate
- Governance Participation

#### Tools for Monitoring
- **Dune Analytics**: Custom dashboards
- **DeFiPulse**: TVL tracking
- **CoinGecko/CoinMarketCap**: Listings and data

### 2. Governance Implementation

```solidity
// Governance integration example
contract LZRGovernance {
    function propose(string memory description, bytes memory data) external {
        require(lzrToken.balanceOf(msg.sender) >= PROPOSAL_THRESHOLD, "Insufficient LZR");
        // Create proposal logic
    }
    
    function vote(uint256 proposalId, bool support) external {
        uint256 votingPower = lzrStaking.getEffectiveStake(msg.sender);
        require(votingPower > 0, "No voting power");
        // Voting logic
    }
}
```

### 3. Treasury Management

#### Revenue Sources
- Transaction fees from protocol
- Trading fees from DEX pairs
- Partnership revenue
- NFT marketplace fees

#### Treasury Allocation
- 40% Development & Operations
- 30% Marketing & Growth
- 20% Community Rewards
- 10% Emergency Fund

### 4. Continuous Development

#### Roadmap Items
- **Q1**: Token launch, basic staking
- **Q2**: Governance implementation, mobile app
- **Q3**: Cross-chain expansion, advanced features
- **Q4**: DAO transition, ecosystem growth

#### Technical Improvements
- Gas optimization
- Multi-chain deployment
- Advanced staking features
- Integration with lending protocols

## Risk Management

### Technical Risks
- Smart contract vulnerabilities
- Oracle manipulation
- Front-running attacks
- Gas price volatility

### Market Risks
- Token price volatility
- Liquidity constraints
- Regulatory changes
- Competitive pressure

### Mitigation Strategies
- Professional audits
- Bug bounty programs
- Gradual feature rollouts
- Insurance coverage
- Legal compliance review

## Resources & Tools

### Development
- **Hardhat**: https://hardhat.org/
- **OpenZeppelin**: https://openzeppelin.com/
- **Remix IDE**: https://remix.ethereum.org/

### Testing
- **Bitlazer L3 Mainnet**: https://bitlazer.calderaexplorer.xyz/
- **Arbitrum One**: https://arbiscan.io/
- **Arbitrum Sepolia**: https://sepolia-rollup.arbitrum.io/

### Marketing
- **Kaito.ai**: AI-powered crypto marketing
- **TweetHunter**: Twitter growth tools
- **RiseKarma**: Community engagement

### Analytics
- **Dune Analytics**: Custom dashboards
- **DeBank**: Portfolio tracking
- **Nansen**: On-chain analytics

## Integration with Bitlazer Ecosystem

### Grants Program Integration
The LZR token powers the Bitlazer grants program:
- **Application Portal**: bitlazer.io/ecosystem
- **Grant Distribution**: 15% of total supply (150M LZR)
- **Evaluation Criteria**: Innovation, ecosystem impact, feasibility
- **Benefits**: Financial support + community engagement

### Network Configuration
Add Bitlazer L3 to your wallet:
```javascript
const bitlazerNetwork = {
  chainId: '0x379B', // 14235 in hex
  chainName: 'Bitlazer',
  nativeCurrency: {
    name: 'lzrBTC',
    symbol: 'lzrBTC',
    decimals: 18
  },
  rpcUrls: ['https://bitlazer.calderachain.xyz/http'],
  blockExplorerUrls: ['https://bitlazer.calderaexplorer.xyz/']
}
```

### Dual Yield Staking Integration
LZR token integrates with existing lzrBTC staking:
```solidity
// Enhanced staking with both Bitcoin and LZR rewards
function stakeLZRWithBTCRewards(uint256 amount) external {
    // Stake LZR tokens
    lzrToken.transferFrom(msg.sender, address(this), amount);
    
    // Calculate Bitcoin rewards from network activity
    uint256 btcRewards = calculateNetworkRewards(amount);
    
    // Distribute dual rewards
    distributeBitcoinRewards(msg.sender, btcRewards);
    distributeLZRRewards(msg.sender, amount);
}
```

## Conclusion

This guide provides a comprehensive framework for deploying the LZR token within the Bitlazer ecosystem. The token leverages the existing L3 infrastructure, integrates with lzrBTC staking, and supports the grants program for ecosystem growth.

### Next Steps
1. Review tokenomics alignment with Bitlazer roadmap
2. Set up Bitlazer L3 development environment
3. Test integration with existing lzrBTC contracts
4. Implement grants program distribution mechanism
5. Deploy dual yield staking features
6. Launch early builder rewards (20% allocation)
7. Execute ecosystem growth strategy

For questions or support, refer to the [Bitlazer documentation](https://bitlazer.gitbook.io/bitlazer) or apply for grants at bitlazer.io/ecosystem.

---

*This guide is for educational purposes. Always conduct thorough testing and security audits before mainnet deployment. Consider legal and regulatory requirements in your jurisdiction.*