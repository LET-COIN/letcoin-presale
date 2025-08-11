// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Presale is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    IERC20 public token;
    uint256 public tokensPerBNB; // tokens per 1 BNB, but scaled by 1e18 (use parseUnits in deploy)
    uint256 public startTime;
    uint256 public endTime;
    uint256 public softCap; // in wei
    uint256 public hardCap; // in wei
    uint256 public minContribution;
    uint256 public maxContribution;
    address public fundsReceiver; // multisig or wallet, receiver after finalize
    bool public finalized;
    bool public whitelistEnabled;

    mapping(address => bool) public whitelist;
    mapping(address => uint256) public contributions;
    uint256 public totalCollected;

    event Contributed(address indexed buyer, uint256 amount);
    event Refunded(address indexed buyer, uint256 amount);
    event Finalized(uint256 totalCollected);

    constructor(
        address _token,
        uint256 _tokensPerBNB,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _softCap,
        uint256 _hardCap,
        uint256 _minContribution,
        uint256 _maxContribution,
        address _fundsReceiver,
        bool _whitelistEnabled
    ) {
        require(_token != address(0), "token 0");
        require(_fundsReceiver != address(0), "funds receiver 0");
        require(_startTime < _endTime, "bad times");
        token = IERC20(_token);
        tokensPerBNB = _tokensPerBNB;
        startTime = _startTime;
        endTime = _endTime;
        softCap = _softCap;
        hardCap = _hardCap;
        minContribution = _minContribution;
        maxContribution = _maxContribution;
        fundsReceiver = _fundsReceiver;
        whitelistEnabled = _whitelistEnabled;
    }

    modifier onlyWhileOpen() {
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Not open");
        _;
    }

    receive() external payable {
        contribute();
    }

    function contribute() public payable nonReentrant onlyWhileOpen {
        require(msg.value >= minContribution, "Below min");
        require(contributions[msg.sender] + msg.value <= maxContribution, "Above max");
        require(totalCollected + msg.value <= hardCap, "Hardcap reached");
        if (whitelistEnabled) {
            require(whitelist[msg.sender], "Not whitelisted");
        }
        contributions[msg.sender] += msg.value;
        totalCollected += msg.value;
        emit Contributed(msg.sender, msg.value);
    }

    // calculate tokens to claim for an address (returns token amount in token smallest units)
    function tokensToClaim(address who) public view returns (uint256) {
        // tokens = contributedWei * tokensPerBNB / 1e18
        return (contributions[who] * tokensPerBNB) / 1 ether;
    }

    // claim tokens after successful finalize
    function claimTokens() external nonReentrant {
        require(finalized, "Not finalized");
        require(totalCollected >= softCap, "Goal not reached");
        uint256 contributed = contributions[msg.sender];
        require(contributed > 0, "No contribution");
        contributions[msg.sender] = 0;
        uint256 tokenAmount = (contributed * tokensPerBNB) / 1 ether;
        token.safeTransfer(msg.sender, tokenAmount);
    }

    // Refund if failed
    function refund() external nonReentrant {
        require(block.timestamp > endTime, "Sale not ended");
        require(totalCollected < softCap, "Softcap reached");
        uint256 contributed = contributions[msg.sender];
        require(contributed > 0, "No contribution");
        contributions[msg.sender] = 0;
        payable(msg.sender).transfer(contributed);
        emit Refunded(msg.sender, contributed);
    }

    function finalize() external onlyOwner {
        require(block.timestamp > endTime || totalCollected >= hardCap, "Not finished");
        require(!finalized, "Already");
        finalized = true;
        if (totalCollected >= softCap) {
            // forward funds to multisig/receiver
            (bool ok, ) = fundsReceiver.call{value: address(this).balance}("");
            require(ok, "Transfer failed");
        }
        emit Finalized(totalCollected);
    }

    // whitelist management
    function setWhitelist(address[] calldata addrs, bool allowed) external onlyOwner {
        for (uint i = 0; i < addrs.length; i++) {
            whitelist[addrs[i]] = allowed;
        }
    }

    function setWhitelistEnabled(bool v) external onlyOwner {
        whitelistEnabled = v;
    }

    // owner can withdraw leftover tokens (e.g., for unsold tokens)
    function rescueUnsoldTokens(address to) external onlyOwner {
        require(finalized, "Not finalized");
        uint256 bal = token.balanceOf(address(this));
        if (bal > 0) token.safeTransfer(to, bal);
    }

    // update basic params (careful)
    function updateTimes(uint256 _start, uint256 _end) external onlyOwner {
        require(_start < _end, "bad times");
        startTime = _start;
        endTime = _end;
    }
}
