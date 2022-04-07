// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import "@openzeppelin/contracts/utils/math/SafeMath.sol";
contract Multisender is Ownable {
    using SafeERC20 for IERC20;
    // using SafeMath for uint256;
    uint16 public limit_contributors = 150;
     
    event Multisended(uint256 total, address tokenAddress);
    event ClaimedTokens(address token, address owner, uint256 balance);
    event ClaimedNative(address owner, uint256 balance);

    fallback() external payable {}

    receive() external payable {}
    function approve(address token, uint256 _amount) public {
        IERC20(token).approve(msg.sender, _amount);
        IERC20(token).approve(address(this), _amount);
    }
    function multisendToken(address token, address[] memory _contributors, uint256[] memory _balances) public payable {
        IERC20 erc20token = IERC20(token);
        uint256 allowance = erc20token.allowance(msg.sender, address(this));
        require(allowance > 0, "You not approve your token !");
        require(_contributors.length <= limit_contributors, "a mount of contributors over limit !");
        uint256 total = 0;
        uint8 i = 0;
       
        for (i; i < _contributors.length; i++) {
            erc20token.transferFrom(msg.sender, _contributors[i], _balances[i]);
            total += _balances[i];
        }
        require(allowance >= total, "not enough token for send !");
        if (allowance > total*201/200) {
            erc20token.transferFrom(msg.sender, address(this), total*1/200);
        }

        emit Multisended(total, token);
    }
    
    function multisendEther(address[] memory _contributors, uint256[] memory _balances) public payable {
        require(_contributors.length <= limit_contributors, "a mount of contributors over limit !");
        uint256 total = 0;
        uint8 i = 0;
        for (i; i < _contributors.length; i++) {
            payable(address(_contributors[i])).transfer(_balances[i]);
            total += _balances[i];
        }
        require(msg.value >= total, "not enough ether for send !");
        if (msg.value > total*201/200) {
              payable(address(this)).transfer(total*1/200);
        }
        emit Multisended(total, address(0));
    }

    function claimTokens(address _token) public onlyOwner {
        IERC20 erc20token = IERC20(_token);
        uint256 balance = erc20token.balanceOf(address(this));
        require(balance > 0, "not have token for claim !");
        erc20token.transfer(owner(), balance);
        emit ClaimedTokens(_token, owner(), balance);
    }

     function claimNative() public onlyOwner {    
        require(address(this).balance > 0, "not have ether for claim !");
        payable(owner()).transfer(address(this).balance);
        emit ClaimedNative(owner(), address(this).balance);
    }
}