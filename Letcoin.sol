// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Letcoin is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("Letcoin", "LEC") {
        _mint(msg.sender, initialSupply);
    }

    // Owner can recover tokens mistakenly sent to contract
    function rescueTokens(address tokenAddr, address to, uint256 amount) external onlyOwner {
        IERC20(tokenAddr).transfer(to, amount);
    }
}
