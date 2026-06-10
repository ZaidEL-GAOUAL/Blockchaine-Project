// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../lib/openzeppelin-contracts-upgradeable/lib/openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "../lib/openzeppelin-contracts-upgradeable/lib/openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "../lib/openzeppelin-contracts-upgradeable/lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * Contract part - NFT
 *
 * Each ticket category of an event is one ERC-721 contract. Tickets are
 * either bought directly with ETH (`buy`) or minted for free by the
 * platform that owns the contract (`mint`, e.g. after a card payment).
 */
contract Ticket is ERC721URIStorage, ERC721Enumerable, Ownable {
    /// Auto-incrementing id of the next token to mint (first token is 0).
    uint256 private _nextTokenId;
    
    /// Hard cap on the number of tickets this contract can ever mint.
    uint256 public immutable maxSupply;
    
    /// Price of ONE ticket, in wei.
    uint256 public price;
    
    /// Metadata URI shared by every ticket of this category (looks like ipfs://…).
    string public ticketURI;

    /**
     * EXERCISE 1 — Constructor
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        string memory ticketURI_,
        uint256 price_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        // Initialisation des variables d'état avec les paramètres du constructeur
        maxSupply = maxSupply_;
        ticketURI = ticketURI_;
        price = price_;
    }

    /**
     * EXERCISE 3 — Public purchase
     */
    function buy(uint256 quantity) external payable returns (uint256[] memory) {
        // Vérifie que le montant en ETH envoyé est exactement égal au prix total
        require(msg.value == quantity * price, "Incorrect ETH amount");
        
        // Délègue la création des tokens à la fonction _mintBatch
        return _mintBatch(msg.sender, quantity);
    }

    /**
     * EXERCISE 4 — Platform mint
     * Note: J'ai ajouté le modifier `onlyOwner` à la signature de la fonction.
     */
    function mint(address to, uint256 quantity)
        external
        onlyOwner
        returns (uint256[] memory)
    {
        // Délègue la création des tokens à la fonction _mintBatch
        return _mintBatch(to, quantity);
    }

    /**
     * EXERCISE 2 — Batch minting (shared by `buy` and `mint`)
     */
    function _mintBatch(address to, uint256 quantity)
        private
        returns (uint256[] memory)
    {
        // Vérifie que la quantité est positive
        require(quantity > 0, "Quantity must be positive");
        
        // Vérifie que la limite de tickets (maxSupply) ne sera pas dépassée
        require(_nextTokenId + quantity <= maxSupply, "Sold out");

        uint256[] memory mintedIds = new uint256[](quantity);

        // Boucle pour minter chaque token un par un
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId; // On prend l'ID actuel
            _nextTokenId++;                 // On incrémente pour le prochain

            _safeMint(to, tokenId);         // On crée le NFT pour l'adresse cible
            _setTokenURI(tokenId, ticketURI); // On attache les métadonnées (IPFS)
            
            mintedIds[i] = tokenId;         // On stocke l'ID dans notre tableau de retour
        }

        return mintedIds;
    }

    /**
     * EXERCISE 5 — Withdraw proceeds
     */
    function withdraw() external onlyOwner {
        // Récupère tout le solde en ETH (wei) détenu par le contrat
        uint256 balance = address(this).balance;
        
        // Transfert bas-niveau (recommandé) vers le propriétaire du contrat
        (bool success, ) = payable(owner()).call{value: balance}("");
        
        // Revert si le transfert échoue
        require(success, "Withdraw failed");
    }

    /**
     * EXERCISE 6 — Enumerate someone's tickets
     */
    function ticketsOf(address account) external view returns (uint256[] memory) {
        // Récupère le nombre total de tickets possédés par l'utilisateur
        uint256 balance = balanceOf(account);
        
        uint256[] memory tokenIds = new uint256[](balance);

        // Boucle pour récupérer chaque ID de ticket de l'utilisateur
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(account, i);
        }

        return tokenIds;
    }

    // ------------------------------------------------------------------
    // Boilerplate — required because ERC721URIStorage and ERC721Enumerable
    // both extend ERC721, so Solidity needs explicit overrides.
    // Do not modify anything below this line.
    // ------------------------------------------------------------------

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