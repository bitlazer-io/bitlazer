// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./sZBTC.sol";

contract ZBTC is
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

    function pauseExtraHolderBalance() public onlyOwner {
        pausedExtraHolderBalance = true;
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
        _mint(msg.sender, amount);
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
        // Return WBTC to original holder
        WBTC.safeTransfer(msg.sender, amount);
    }
}
