// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract StakeLBTC is ERC20Upgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable {
    uint256 public totalStaked;
    uint256 public totalStakers;

    mapping(address => address) private holders; // Linked list of holders
    address private firstHolder;
    address private lastHolder;

    bytes32 public version;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    modifier onlyOwner() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only owner can call this function");
        _;
    }

    function initialize(address _owner, string memory name, string memory symbol) public initializer {
        __ERC20_init(name, symbol);

        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        __AccessControl_init();
        __ReentrancyGuard_init();
    }

    function setVersion(bytes32 _version) external onlyOwner {
        version = _version;
    }

    function charge(uint256 amount) public payable {
        require(msg.value == amount, "Amount argument must be equal to attached native value");
        require(amount > 0, "Amount must be greater than 0");

        uint256 contractBalance = address(this).balance;
        require(contractBalance >= amount, "Insufficient contract balance");

        // Distribute the charged amount proportionally to all stakers as additional LP tokens
        address currentHolder = firstHolder;
        while (currentHolder != address(0)) {
            uint256 userStake = balanceOf(currentHolder);
            uint256 reward = (amount * userStake) / totalStaked;

            _mint(currentHolder, reward); // Mint additional LP tokens as rewards
            currentHolder = holders[currentHolder]; // Move to the next holder in the list
        }
    }

    receive() external payable {}

    fallback() external payable {}

    function mint(address account, uint256 amount) internal {
        _mint(account, amount);
        _addHolder(account); // Add the account to the holders list if not already present
    }

    function burn(address account, uint256 amount) internal {
        _burn(account, amount);
        if (balanceOf(account) == 0) {
            _removeHolder(account); // Remove the account from the holders list if balance is zero
        }
    }

    function stake(uint256 amount) public payable {
        require(msg.value == amount, "Amount argument must be equal to attached native value");
        require(amount > 0, "Amount must be greater than 0");

        totalStaked += amount;

        mint(msg.sender, amount); // Mint corresponding LP tokens to the staker
    }

    function unstake(uint256 amount) public nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance to unstake");

        totalStaked -= amount;

        burn(msg.sender, amount); // Burn the corresponding LP tokens

        // Ensure all state changes are done before transferring funds to prevent reentrancy
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send Native currency");
    }

    function _addHolder(address account) internal {
        if (
            balanceOf(account) > 0 && holders[account] == address(0) && account != firstHolder && account != lastHolder
        ) {
            if (firstHolder == address(0)) {
                // This is the first holder
                firstHolder = account;
                lastHolder = account;
            } else {
                // Add to the end of the linked list
                holders[lastHolder] = account;
                lastHolder = account;
            }
            totalStakers += 1; // Increment total stakers when a new holder is added
        }
    }

    function _removeHolder(address account) internal {
        if (firstHolder == account) {
            // Account is the first holder
            firstHolder = holders[account];
            if (firstHolder == address(0)) {
                lastHolder = address(0); // No more holders left
            }
        } else {
            // Traverse the list to find the previous holder
            address currentHolder = firstHolder;
            while (currentHolder != address(0) && holders[currentHolder] != account) {
                currentHolder = holders[currentHolder];
            }
            if (currentHolder != address(0)) {
                holders[currentHolder] = holders[account];
                if (lastHolder == account) {
                    lastHolder = currentHolder; // Update the last holder if necessary
                }
            }
        }

        // Remove from the list
        delete holders[account];
        totalStakers -= 1; // Decrement total stakers when a holder is removed
    }

    function readHolders() public view returns (address[] memory) {
        address[] memory holderArray = new address[](totalStakers);
        address currentHolder = firstHolder;
        uint256 index = 0;

        while (currentHolder != address(0)) {
            holderArray[index] = currentHolder;
            currentHolder = holders[currentHolder];
            index += 1;
        }

        return holderArray;
    }
}
