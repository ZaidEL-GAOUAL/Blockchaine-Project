// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Ticket.sol";

contract TicketTest is Test {
    Ticket public ticket;
    
    // On crée quelques adresses fictives pour simuler des utilisateurs
    address public owner = address(1);
    address public buyer1 = address(2);
    address public buyer2 = address(3);

    uint256 public constant MAX_SUPPLY = 100;
    uint256 public constant TICKET_PRICE = 0.01 ether;
    string public constant TICKET_URI = "ipfs://QmMyFakeHash...";

    // Cette fonction est lancée avant CHAQUE test (pour repartir à zéro)
    function setUp() public {
        // On dit à Forge que les prochaines actions sont faites par le "owner"
        vm.startPrank(owner);
        
        ticket = new Ticket(
            "Concert Sorbonne",
            "SRBN",
            MAX_SUPPLY,
            TICKET_URI,
            TICKET_PRICE
        );
        
        vm.stopPrank();
        
        // On donne de l'argent (10 ETH) à nos acheteurs fictifs pour qu'ils puissent tester
        vm.deal(buyer1, 10 ether);
        vm.deal(buyer2, 10 ether);
    }

    // 1. Test du constructeur (Exercice 1)
    function test_InitialState() public view {
        assertEq(ticket.name(), "Concert Sorbonne");
        assertEq(ticket.symbol(), "SRBN");
        assertEq(ticket.maxSupply(), MAX_SUPPLY);
        assertEq(ticket.price(), TICKET_PRICE);
        assertEq(ticket.ticketURI(), TICKET_URI);
    }

    // 2. Test d'un achat classique en ETH (Exercice 2 et 3)
    function test_BuyTickets() public {
        vm.startPrank(buyer1); // C'est buyer1 qui agit
        
        // Il achète 2 billets, il doit donc envoyer 0.02 ETH
        uint256[] memory mintedIds = ticket.buy{value: 0.02 ether}(2);
        
        // Vérifications
        assertEq(mintedIds.length, 2);
        assertEq(ticket.balanceOf(buyer1), 2);
        assertEq(ticket.ownerOf(0), buyer1);
        assertEq(ticket.ownerOf(1), buyer1);
        
        vm.stopPrank();
    }

    // 3. Test d'échec : pas assez d'ETH envoyé (Exercice 3)
    function test_FailBuyIncorrectEth() public {
        vm.prank(buyer1);
        
        // On s'attend à ce que la transaction "revert" avec un message d'erreur
        vm.expectRevert("Incorrect ETH amount");
        // Il essaie d'acheter 2 billets mais n'envoie le prix que d'un seul
        ticket.buy{value: 0.01 ether}(2); 
    }

    // 4. Test du mint par l'API (gratuit, mais réservé au owner - Exercice 4)
    function test_MintByPlatform() public {
        vm.prank(owner); // L'API / le proprio agit
        
        // Il donne 3 billets à buyer2 gratuitement
        uint256[] memory mintedIds = ticket.mint(buyer2, 3);
        
        assertEq(mintedIds.length, 3);
        assertEq(ticket.balanceOf(buyer2), 3);
        assertEq(ticket.ownerOf(0), buyer2);
    }

    // 5. Test d'échec : un inconnu essaie de minter gratuitement (Exercice 4)
    function test_FailMintByNonOwner() public {
        vm.prank(buyer1); // Un simple utilisateur essaie de tricher
        
        // On s'attend à une erreur propre à OpenZeppelin (OwnableUnauthorizedAccount)
        vm.expectRevert(); 
        ticket.mint(buyer1, 1);
    }

    // 6. Test du retrait des fonds (Exercice 5)
    function test_Withdraw() public {
        // Buyer1 achète 5 billets (0.05 ETH vont dans le contrat)
        vm.prank(buyer1);
        ticket.buy{value: 0.05 ether}(5);
        
        uint256 initialOwnerBalance = owner.balance;
        
        // Le owner retire l'argent
        vm.prank(owner);
        ticket.withdraw();
        
        // Le contrat doit être vide, et le owner doit être plus riche de 0.05 ETH
        assertEq(address(ticket).balance, 0);
        assertEq(owner.balance, initialOwnerBalance + 0.05 ether);
    }

    // 7. Test de la liste des tickets d'un utilisateur (Exercice 6)
    function test_TicketsOf() public {
        vm.prank(buyer1);
        ticket.buy{value: 0.03 ether}(3); // buyer1 achète 3 tickets
        
        uint256[] memory userTickets = ticket.ticketsOf(buyer1);
        
        // Vérifie qu'il en a bien 3 et que ce sont les ID 0, 1 et 2
        assertEq(userTickets.length, 3);
        assertEq(userTickets[0], 0);
        assertEq(userTickets[1], 1);
        assertEq(userTickets[2], 2);
    }
}