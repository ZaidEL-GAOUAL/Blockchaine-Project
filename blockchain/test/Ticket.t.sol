// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Ticket} from "../src/Ticket.sol";

contract TicketTest is Test {
    Ticket private ticket;

    address private owner = address(1);
    address private buyer = address(2);
    address private otherBuyer = address(3);

    uint256 private constant MAX_SUPPLY = 5;
    uint256 private constant PRICE = 0.01 ether;
    string private constant URI = "ipfs://ticket-metadata";

    function setUp() public {
        vm.prank(owner);
        ticket = new Ticket("Concert Ticket", "TICK", MAX_SUPPLY, URI, PRICE);

        vm.deal(buyer, 1 ether);
        vm.deal(otherBuyer, 1 ether);
    }

    function testConstructorStoresTicketCategoryData() public view {
        assertEq(ticket.name(), "Concert Ticket");
        assertEq(ticket.symbol(), "TICK");
        assertEq(ticket.maxSupply(), MAX_SUPPLY);
        assertEq(ticket.price(), PRICE);
        assertEq(ticket.ticketURI(), URI);
        assertEq(ticket.owner(), owner);
    }

    function testBuyerCanBuyTicketsWithExactEth() public {
        vm.prank(buyer);
        uint256[] memory ids = ticket.buy{value: 0.02 ether}(2);

        assertEq(ids.length, 2);
        assertEq(ids[0], 0);
        assertEq(ids[1], 1);
        assertEq(ticket.balanceOf(buyer), 2);
        assertEq(ticket.ownerOf(0), buyer);
        assertEq(ticket.tokenURI(0), URI);
    }

    function testBuyRejectsWrongEthAmount() public {
        vm.prank(buyer);
        vm.expectRevert("Incorrect ETH amount");
        ticket.buy{value: 0.01 ether}(2);
    }

    function testBuyRejectsZeroQuantity() public {
        vm.prank(buyer);
        vm.expectRevert("Quantity must be positive");
        ticket.buy{value: 0}(0);
    }

    function testCannotMintAboveMaxSupply() public {
        vm.prank(buyer);
        ticket.buy{value: 0.05 ether}(5);

        vm.prank(otherBuyer);
        vm.expectRevert("Sold out");
        ticket.buy{value: 0.01 ether}(1);
    }

    function testOwnerCanMintAfterCardPayment() public {
        vm.prank(owner);
        uint256[] memory ids = ticket.mint(otherBuyer, 3);

        assertEq(ids.length, 3);
        assertEq(ticket.balanceOf(otherBuyer), 3);
        assertEq(ticket.ownerOf(0), otherBuyer);
    }

    function testOnlyOwnerCanMint() public {
        vm.prank(buyer);
        vm.expectRevert();
        ticket.mint(buyer, 1);
    }

    function testWithdrawSendsFundsToOwner() public {
        vm.prank(buyer);
        ticket.buy{value: 0.03 ether}(3);

        uint256 ownerBalanceBefore = owner.balance;

        vm.prank(owner);
        ticket.withdraw();

        assertEq(address(ticket).balance, 0);
        assertEq(owner.balance, ownerBalanceBefore + 0.03 ether);
    }

    function testTicketsOfReturnsOwnedTokenIds() public {
        vm.prank(buyer);
        ticket.buy{value: 0.03 ether}(3);

        uint256[] memory ids = ticket.ticketsOf(buyer);

        assertEq(ids.length, 3);
        assertEq(ids[0], 0);
        assertEq(ids[1], 1);
        assertEq(ids[2], 2);
    }
}
