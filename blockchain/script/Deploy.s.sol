// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {Ticket} from "../src/Ticket.sol";

contract Deploy is Script {
    function run() external returns (Ticket ticket) {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");

        string memory name = vm.envOr("TICKET_NAME", string("Demo Ticket"));
        string memory symbol = vm.envOr("TICKET_SYMBOL", string("DTIX"));
        uint256 maxSupply = vm.envOr("MAX_SUPPLY", uint256(100));
        string memory ticketURI = vm.envOr("TICKET_URI", string("ipfs://metadata"));
        uint256 priceWei = vm.envOr("PRICE_WEI", uint256(0.01 ether));

        vm.startBroadcast(privateKey);
        ticket = new Ticket(name, symbol, maxSupply, ticketURI, priceWei);
        vm.stopBroadcast();

        console2.log("Ticket contract deployed at:", address(ticket));
    }
}
