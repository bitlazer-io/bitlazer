// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

// Info of each user.
struct UserInfo {
    uint256 amount; // How many LP tokens the user has provided.
    uint256 rewardDebt; // Reward debt. See explanation below.
}

interface IStakedLZRChef {
    function enterStakingForAdapter(uint256 pid, uint256 amount, address sender) external;
    function enterStakingForNativeAdapter(uint256 pid, uint256 amount, address sender) external;
    function leaveStakingForAdapter(uint256 pid, uint256 amount, address sender) external;
    function leaveStakingForNativeAdapter(uint256 pid, uint256 amount, address sender) external;
    function leaveStaking(uint256 amount) external;
    function updateCakePerBlockAsAdapter(uint256 amount) external;
    function userInfo(uint256 pid, address user) external view returns (UserInfo memory);
    function cakePerBlock() external view returns (uint256);
    function pendingCake(uint256 pid, address user) external view returns (uint256);
    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) external;
}

/// @title T3RN Staking Adapter for ERC-20 LZR on Arbitrum One
contract StakeAdapter is Initializable, ERC20Upgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    IERC20Upgradeable public stakingToken;
    IERC20Upgradeable public trnToken;
    IStakedLZRChef public masterChef;
    uint256 public constant STAKING_PID = 1;
    uint256 public totalAllocPointTarget; // 100% = 10000 points
    uint256 public targetApyBps;
    uint256 public blocksPerYear;

    bool public halted;
    bool public skippingAutoApyAdjustment;

    uint256 public minBond;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 rewards, uint256 totalUnstaked);
    event APYAdjusted(uint256 newRate);
    event Halted();
    event Unhalted();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    modifier onlyWhenActive() {
        require(!halted, "Staking halted");
        _;
    }

    function initialize(
        address _stakingToken,
        address _masterChef,
        address _rewardController,
        address _trnAddress
    ) public initializer {
        require(_stakingToken != address(0), "Invalid staking token");
        require(_masterChef != address(0), "Invalid masterChef");
        require(_rewardController != address(0), "Invalid reward controller");

        __ERC20_init("LZRStakedBTC", "LZRStakedBTC");
        __Ownable_init();
        __ReentrancyGuard_init();

        trnToken = IERC20Upgradeable(_trnAddress);
        stakingToken = IERC20Upgradeable(_stakingToken);
        masterChef = IStakedLZRChef(_masterChef);

        targetApyBps = 80; // 80% default
        blocksPerYear = 2628000; // Ethereum: 12 seconds per block * 60 blocks per hour * 24 hours per day * 365 days per year
        totalAllocPointTarget = 10000; // 100% allocation
        minBond = 0; // Default to no min bond

        // Safe approve may not return bool in upgradeable context — rely on no-revert
        stakingToken.approve(_masterChef, type(uint256).max);
    }

    function setTrnToken(address _trnAddress) external onlyOwner {
        trnToken = IERC20Upgradeable(_trnAddress);
    }

    function setMinBond(uint256 _minBond) external onlyOwner {
        minBond = _minBond;
    }

    function getBlockNumber() external view returns (uint256) {
        return block.number;
    }

    function getUserBalance(address _sender) external view returns (uint256) {
        return masterChef.userInfo(STAKING_PID, _sender).amount;
    }

    function unstakeFor(uint256 amount, address _user, bool _keepForRestake) internal {
        uint256 balanceBefore = this.getUserBalance(_user);
        // Ugly rounding to avoid dust issues on the UI's rounding side
        if (balanceBefore < amount && amount - balanceBefore < 1e12) {
            amount = balanceBefore; // Withdraw all if below dust
        } else if (balanceBefore < 1e12) {
            amount = balanceBefore;
        } else if (amount < 1e12) {
            revert("Amount below dust threshold");
        } else if (amount > balanceBefore && amount - balanceBefore > 1e12) {
            amount = balanceBefore; // Withdraw all if below dust
        }
        if (address(trnToken) != address(0)) {
            require(balanceOf(_user) >= amount, "Insufficient balance");
        }
        uint256 rewards = masterChef.pendingCake(STAKING_PID, _user);
        if (address(trnToken) == address(0)) {
            masterChef.leaveStakingForNativeAdapter(STAKING_PID, amount, _user);
        } else {
            masterChef.leaveStakingForAdapter(STAKING_PID, amount, _user);
        }

        uint256 balanceAfter = this.getUserBalance(_user);
        uint256 actuallyUnstaked = balanceBefore - balanceAfter;
        _burn(_user, actuallyUnstaked);
        // Handle the ERC-20 rewards payout
        if (rewards > 0 && address(trnToken) != address(0)) {
            // If LZR is ERC20, transfer the rewards
            IERC20Upgradeable(trnToken).transfer(_user, rewards);
        }
        uint256 totalToSend = rewards + actuallyUnstaked;
        if (totalToSend > 0 && address(trnToken) == address(0)) {
            _burn(address(masterChef), actuallyUnstaked);
            // If LZR is native, we will send it back to the user
            // Check contract has enough balance to burn and re-pay the user
            if (_keepForRestake) {
                // If we are keeping the rewards for restake, we don't send them back
                totalToSend = rewards; // Only send rewards amount
            }
            require(address(this).balance >= totalToSend, "Insufficient balance for rewards");
            // If LZR is native, send directly back to the user
            bool sent = false;
            assembly {
                sent := call(21000, _user, totalToSend, 0, 0, 0, 0)
            }
            require(sent, "Failed to send native rewards");
        }

        // See if we're below dust now
        if (balanceAfter < 1e12) {
            actuallyUnstaked += balanceAfter; // Add remaining balance to unstaked amount
            _burn(_user, balanceAfter); // Burn the remaining balance
            if (address(trnToken) == address(0)) {
                _burn(address(masterChef), balanceAfter); // Burn the remaining balance
                masterChef.leaveStakingForNativeAdapter(STAKING_PID, balanceAfter, _user);
            } else {
                masterChef.leaveStakingForAdapter(STAKING_PID, balanceAfter, _user);
            }
            // Verify both balances are zero
            require(balanceOf(_user) == 0, "Balance mismatch after unstake");
            require(this.getUserBalance(_user) == 0, "User balance mismatch after unstake");
        } else {
            require(balanceOf(_user) == this.getUserBalance(_user), "Balance mismatch after unstake");
        }

        _autoAdjustApy();

        emit Unstaked(_user, actuallyUnstaked, rewards, totalToSend);
    }

    function getNativeBalance(address account) external view returns (uint256) {
        return account.balance;
    }

    function stakeableBalance(address account) external view returns (uint256) {
        // Returns the staked balance of the user
        if (address(trnToken) == address(0)) {
            return account.balance > 1e18 ? account.balance - 1e18 : 0; // Leave 1 LZR dust threshold
        }
        return trnToken.balanceOf(account); // For ERC20 TRN, return the balance directly
    }

    function stake(uint256 amount) external payable nonReentrant onlyWhenActive {
        require(amount > 0, "Zero amount");
        // Ensure minimum bond if required
        require(amount >= minBond, "Amount below minimum bond");
        uint256 balanceBefore = this.getUserBalance(msg.sender);
        if (address(trnToken) == address(0)) {
            require(msg.value == amount, "Amount must match native value");
        }

        require(this.stakeableBalance(msg.sender) >= 0, "Insufficient stakeable balance");

        uint256 currentStaked = balanceBefore;
        // If Balance is above 0, try to exit from staking first, and re-enter with the added amount
        if (currentStaked > 0) {
            unstakeFor(currentStaked, msg.sender, true);
        }

        currentStaked += amount;

        // Assume the unstake was successful and we have the correct balance. At this point, we can stake the new amount.
        // Assume always starting from the clean state of 0 staked balance.
        require(balanceOf(msg.sender) == 0, "User balance must be zero before staking");

        if (address(trnToken) == address(0)) {
            // For native - this will be transferred to the masterChef
            _mint(address(masterChef), currentStaked);
            masterChef.enterStakingForNativeAdapter(STAKING_PID, currentStaked, msg.sender);
        } else {
            masterChef.enterStakingForAdapter(STAKING_PID, currentStaked, msg.sender);
        }

        _mint(msg.sender, currentStaked);
        _autoAdjustApy();

        uint256 balanceAfter = this.getUserBalance(msg.sender);
        uint256 actuallyStaked = balanceAfter - balanceBefore;
        require(balanceOf(msg.sender) == this.getUserBalance(msg.sender), "Balance mismatch after unstake");
        emit Staked(msg.sender, actuallyStaked);
    }

    function unstake(uint256 amount) external payable nonReentrant onlyWhenActive {
        unstakeFor(amount, msg.sender, false);
    }

    function halt() external onlyOwner {
        halted = true;
        emit Halted();
    }

    function unhalt() external onlyOwner {
        halted = false;
        emit Unhalted();
    }

    function skipAutoApyAdjustment(bool _skip) external onlyOwner {
        skippingAutoApyAdjustment = _skip;
    }

    function getApy() external view returns (uint256) {
        uint256 totalStakedAmount = totalSupply();
        if (totalStakedAmount == 0) return 0;

        uint256 rewardPerBlock = masterChef.cakePerBlock();

        // Annual rewards in TRN
        uint256 annualReward = rewardPerBlock * blocksPerYear;

        // APY = annual reward / total staked
        return (annualReward * 100) / totalStakedAmount; // APY in basis points
    }

    function emergencyBurn(uint256 amount, address _user) external onlyOwner {
        require(amount > 0, "Zero amount");
        _burn(_user, amount);
    }

    function _autoAdjustApy() internal {
        if (halted) return; // Skip if halted
        if (skippingAutoApyAdjustment) return; // Skip if auto adjustment is skipped
        uint256 totalStaked = totalSupply();
        if (totalStaked == 0) return;

        uint256 annualReward = (totalStaked * targetApyBps) / 100;
        uint256 newPerBlock = annualReward / blocksPerYear;

        masterChef.updateCakePerBlockAsAdapter(newPerBlock);
        emit APYAdjusted(newPerBlock);
    }

    function migrateStakingChef(address newChef) external onlyOwner {
        require(newChef != address(0), "Invalid new chef address");
        masterChef = IStakedLZRChef(newChef);
    }

    function pendingReward(address _user) external view returns (uint256) {
        return masterChef.pendingCake(STAKING_PID, _user);
    }

    // Call this function to adjust govTRN after emergency withdraw via StakedTRNChef
    function adjustStakeLZRAfterStakingEmergencyWithdraw() external nonReentrant onlyWhenActive {
        uint256 amount = 0;
        if (address(trnToken) == address(0)) {
            amount = this.getUserBalance(msg.sender);
        } else {
            amount = balanceOf(msg.sender);
        }
        require(amount > 0, "Zero amount");
        uint256 stakedBalance = this.getUserBalance(msg.sender);
        if (stakedBalance > amount) {
            revert("Insufficient staked balance");
        }
        // Burn the user's govLZR
        _burn(msg.sender, amount);
        // Mint stakedLZR to the user
        _mint(msg.sender, stakedBalance);
    }

    function adjustApyTarget(uint256 _targetApyBps, uint256 _blocksPerYear) external onlyOwner {
        targetApyBps = _targetApyBps;
        blocksPerYear = _blocksPerYear;
        _autoAdjustApy(); // force immediate update
    }

    function setTotalAllocPointTarget(uint256 _target) external onlyOwner {
        totalAllocPointTarget = _target;
    }

    // Optional placeholder if you don't yet track other TVL
    function maxTotalStakedAcrossAllPools() public view returns (uint256) {
        return totalSupply(); // for now assume we're the only pool
    }

    // Emergency withdraw function to recover tokens
    function emergencyWithdraw(uint256 amount, bool _shouldBurn) external onlyOwner {
        require(amount > 0, "Zero amount");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        if (_shouldBurn) {
            _burn(msg.sender, amount);
        }

        if (address(trnToken) == address(0)) {
            // If LZR is native, send directly
            (bool sent, ) = msg.sender.call{value: amount}("");
            require(sent, "Failed to send native tokens");
        } else {
            // If LZR is ERC20, transfer the tokens
            IERC20Upgradeable(trnToken).transferFrom(address(this), msg.sender, amount);
        }
    }

    // Receive function to accept native tokens
    receive() external payable {}

    // Revert on fallback to prevent accidental calls
    fallback() external payable {
        revert("GOV#4");
    }
}
