import json
from web3 import Web3
from app.domain.ports import ContractDeployer
from app.config import settings

class Web3ContractDeployer(ContractDeployer):
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.rpc_url))
        self.account = self.w3.eth.account.from_key(settings.deployer_private_key)

    async def deploy_ticket_contract(self, *, name: str, symbol: str, max_supply: int, price_wei: int) -> str:
        # 1. Charger ton ABI et Bytecode (tu devras mettre le fichier .json dans le backend)
        with open("../blockchain/out/Ticket.sol/Ticket.json") as f:
            truffle_artifact = json.load(f)
            abi = truffle_artifact['abi']
            bytecode = truffle_artifact['bytecode']['object']

        # 2. Préparer le contrat
        Contract = self.w3.eth.contract(abi=abi, bytecode=bytecode)

        # 3. Construire la transaction
        tx = Contract.constructor(name, symbol, max_supply, "ipfs://fake...", price_wei).build_transaction({
            'from': self.account.address,
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'gas': 2000000,
            'gasPrice': self.w3.eth.gas_price
        })

        # 4. Signer et envoyer
        signed_tx = self.w3.eth.account.sign_transaction(tx, settings.deployer_private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        return tx_receipt.contractAddress