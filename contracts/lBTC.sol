// contracts/ERC20Mock.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract lBTC is ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public owner;

    mapping(address => IERC20) public supportedWrappers;
    mapping(address => mapping(address => uint256)) internal holderBalances;

    constructor(address _owner, string memory name, string memory symbol) ERC20(name, symbol) {
        owner = _owner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function setWBTCAddress(address _WBTC) public onlyOwner {
        supportedWrappers[_WBTC] = IERC20(_WBTC);
    }

    function getWBTCAddress(address _WBTC) public view returns (address) {
        return address(supportedWrappers[_WBTC]);
    }

    function mint(uint256 amount, address _WBTC) nonReentrant public {
        IERC20 WBTC = supportedWrappers[_WBTC];
        require(WBTC != IERC20(address(0)), "Wrapper not supported");
        holderBalances[msg.sender][_WBTC] += amount;
        _mint(msg.sender, amount);
        WBTC.safeTransferFrom(msg.sender, address(this), amount);
    }

    function burn(uint256 amount, address _WBTC) nonReentrant public {
        IERC20 WBTC = supportedWrappers[_WBTC];
        require(WBTC != IERC20(address(0)), "Wrapper not supported");
        require(holderBalances[msg.sender][_WBTC] >= amount, "Insufficient balance in the wrapper holding");
        // Ensured that the user has enough balance in the wrapper holding so shouldn't fail
        holderBalances[msg.sender][_WBTC] -= amount;
        _burn(msg.sender, amount);
        WBTC.transfer(msg.sender, amount);
    }

    function getHolderBalance(address _holder, address _WBTC) public view returns (uint256) {
        return holderBalances[_holder][_WBTC];
    }
}
