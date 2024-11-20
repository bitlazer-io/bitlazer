// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SZBTC is ERC20, Ownable {
    address public immutable zBTC;

    modifier onlyZBTC() {
        require(msg.sender == zBTC, "Caller is not the zBTC contract");
        _;
    }

    constructor(
        address _owner,
        address _zBTC,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        // Transfer ownership to the provided _owner address
        _transferOwnership(_owner);
        zBTC = _zBTC;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyZBTC {
        _burn(from, amount);
    }
}
