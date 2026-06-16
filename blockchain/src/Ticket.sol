// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * One ticket category is represented by one ERC721 contract.
 *
 * Buyers can pay with ETH through buy(). The platform owner can also mint
 * tickets after an off-chain card payment through mint().
 */
contract Ticket is ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;

    uint256 public immutable maxSupply;
    uint256 public price;
    string public ticketURI;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        string memory ticketURI_,
        uint256 price_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        maxSupply = maxSupply_;
        ticketURI = ticketURI_;
        price = price_;
    }

    function buy(uint256 quantity) external payable returns (uint256[] memory) {
        require(msg.value == quantity * price, "Incorrect ETH amount");
        return _mintBatch(msg.sender, quantity);
    }

    function mint(address to, uint256 quantity)
        external
        onlyOwner
        returns (uint256[] memory)
    {
        return _mintBatch(to, quantity);
    }

    function _mintBatch(address to, uint256 quantity)
        private
        returns (uint256[] memory)
    {
        require(quantity > 0, "Quantity must be positive");
        require(_nextTokenId + quantity <= maxSupply, "Sold out");

        uint256[] memory mintedIds = new uint256[](quantity);

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;

            _safeMint(to, tokenId);
            _setTokenURI(tokenId, ticketURI);
            mintedIds[i] = tokenId;
        }

        return mintedIds;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success,) = payable(owner()).call{value: balance}("");
        require(success, "Withdraw failed");
    }

    function ticketsOf(address account) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(account);
        uint256[] memory tokenIds = new uint256[](balance);

        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(account, i);
        }

        return tokenIds;
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
