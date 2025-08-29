// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./sZBTC.sol";

contract lzrBTC is
    ReentrancyGuardUpgradeable,
    AccessControlUpgradeable,
    ERC20Upgradeable,
    OwnableUpgradeable
{
    using SafeERC20 for IERC20;

    bool public paused;
    bool public pausedExtraHolderBalance;

    SZBTC public sZBTC;
    IERC20 public WBTC;

    bool public isWBTCSet;
    bool public __apply8To18DecimalsConversion;

    address dustCollector;

    event DustCollected(address indexed dustCollector, uint256 dust);
    event NativeReceived(address indexed sender, uint256 value);

    function initialize(
        string memory name,
        string memory symbol,
        address _owner
    ) public initializer {
        require(_owner != address(0), "Owner cannot be 0 address");
        __ERC20_init(name, symbol);
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        __ReentrancyGuard_init();
        _transferOwnership(_owner);
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function pause() public onlyOwner {
        paused = true;
    }

    function unpause() public onlyOwner {
        paused = false;
    }

    fallback() external payable {
        revert("Fallback function not allowed");
    }

    receive() external payable {
        emit NativeReceived(msg.sender, msg.value);
    }

    function apply8To18DecimalsConversion() public onlyOwner {
        __apply8To18DecimalsConversion = true;
    }

    function pauseExtraHolderBalance() public onlyOwner {
        pausedExtraHolderBalance = true;
    }

    function setDustCollector(address _dustCollector) public onlyOwner {
        dustCollector = _dustCollector;
    }

    function unpauseExtraHolderBalance() public onlyOwner {
        pausedExtraHolderBalance = false;
    }

    function setWBTCAddress(address _WBTC) public onlyOwner {
        require(!isWBTCSet, "WBTC already set");
        WBTC = IERC20(_WBTC);
        isWBTCSet = true;
    }

    function setSZBTCAddress(address _sZBTC) public onlyOwner {
        sZBTC = SZBTC(_sZBTC);
    }

    function mint(uint256 amount) public nonReentrant {
        require(!paused, "Contract paused");
        // Convert WBTC amount (8 decimals) to lzrBTC (18 decimals) with 1000x multiplier
        // 1 satoshi (1 WBTC unit) = 1000 lzrBTC tokens
        // 1 WBTC unit needs to become 1000 * 10^18 lzrBTC units = 10^21 lzrBTC units
        // So conversion factor = 10^21
        uint256 mintAmount = __apply8To18DecimalsConversion
            ? amount * 10 ** 21  // 1 satoshi = 1000 lzrBTC tokens
            : amount;
        _mint(msg.sender, mintAmount);
        WBTC.safeTransferFrom(msg.sender, address(this), amount);
    }

    // If sufficient balance of sZBTC is not available, this function will fail
    // Otherwise, add the extra balance to the holder's balance in order to allow the extra stake accumulated to l3 withdrawals
    function addExtraHolderBalance(uint256 amount) public nonReentrant {
        require(!pausedExtraHolderBalance, "Extra holder balance paused");
        uint256 sZBTCBalance = sZBTC.balanceOf(msg.sender);
        require(sZBTCBalance >= amount, "Insufficient sZBTC balance");
        // Burn the sZBTC
        sZBTC.burn(msg.sender, amount);
        // Mint the lBTC to the holder
        _mint(msg.sender, amount);
    }

    function burn(uint256 amount) public nonReentrant {
        require(!paused, "Contract paused");
        _burn(msg.sender, amount);
        // Convert lzrBTC amount back to WBTC
        // amount is in lzrBTC units (18 decimals), need to convert to WBTC units (8 decimals)
        // 1000 * 10^18 lzrBTC units = 1 WBTC unit (1 satoshi)
        // burnAmount = amount / 10^21 to get WBTC units
        uint256 burnAmount = __apply8To18DecimalsConversion
            ? (amount / 10 ** 21)  // 1000 lzrBTC tokens = 1 satoshi
            : amount;
        uint256 dust = __apply8To18DecimalsConversion
            ? amount - burnAmount * 10 ** 21
            : 0;
        if (dust > 0 && dustCollector != address(0)) {
            emit DustCollected(dustCollector, dust);
            // Transfer dust to the dust collector
            _mint(dustCollector, dust);
        }
        WBTC.safeTransfer(msg.sender, burnAmount);
    }

    uint256[48] private __gap;
}
