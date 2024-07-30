import json
import os
from web3 import Web3


# Connect to provider
w3 = Web3(Web3.HTTPProvider('http://blockchain:8545'))

if not w3.is_connected():
    raise Exception("Can't connect to blockchain")

# Set owner account
private_key = os.getenv('BC_PRIVATE_KEY')
w3.eth.default_account = os.getenv('BC_OWNER_ADDRESS')

# ABI and contract address
contract_file_path = '../../blockchain_shared/pong_contract.json'
with open(contract_file_path, 'r') as file:
    contract_data = json.load(file)
CONTRACT_ADDRESS = contract_data['address']
CONTRACT_ABI = contract_data['abi']

# Contract instance
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)
