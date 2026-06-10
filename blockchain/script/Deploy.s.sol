// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/Ticket.sol"; // On importe ton contrat

contract DeployScript is Script {
    function run() external {
        // On récupère la clé privée depuis le fichier .env (utile pour déployer en toute sécurité)
        // Si tu testes en local avec Anvil, tu utiliseras une des clés privées générées automatiquement.
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Début de l'enregistrement de la transaction de déploiement
        vm.startBroadcast(deployerPrivateKey);

        // --- Paramètres de test pour ton événement ---
        // Tes camarades du back/front te fourniront ces données plus tard dynamiquement via l'API.
        // Pour l'instant, on met des valeurs "mock" (factices) pour tester.
        string memory name = "Concert Sorbonne";
        string memory symbol = "SRBN";
        uint256 maxSupply = 1000;
        
        // C'est ici que tu mettras le lien IPFS généré par Pinata plus tard (Exercice sur le stockage)
        string memory ticketURI = "ipfs://QmFakeHashForNow..."; 
        
        // Prix d'un billet (0.01 ETH)
        uint256 price = 0.01 ether; 

        // Déploiement du contrat de catégorie de billet
        Ticket ticketContract = new Ticket(
            name, 
            symbol, 
            maxSupply, 
            ticketURI, 
            price
        );

        // Fin de l'enregistrement de la transaction
        vm.stopBroadcast();

        // On affiche l'adresse du contrat déployé dans le terminal
        console.log("=========================================");
        console.log("Contrat Ticket deploye a l'adresse :", address(ticketContract));
        console.log("=========================================");
    }
}