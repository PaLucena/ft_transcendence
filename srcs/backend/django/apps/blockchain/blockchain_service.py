import json
import os
from web3 import Web3

# Connect to provider
w3 = Web3(Web3.HTTPProvider('http://blockchain:8545'))

if not w3.is_connected():
    raise Exception("Can't connect to blockchain")

# Set owner account
PRIVATE_KEY = os.getenv('BC_PRIVATE_KEY')
w3.eth.default_account = os.getenv('BC_OWNER_ADDRESS')

# ABI and contract address
contract_file_path = './blockchain_shared/pong_contract.json'
with open(contract_file_path, 'r') as file:
    contract_data = json.load(file)
CONTRACT_ADDRESS = contract_data['address']
CONTRACT_ABI = contract_data['abi']

# Contract instance
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)


def bc_create_tournament(tournament_id, player_ids):
    tx = contract.functions.createTournament(tournament_id, player_ids).build_transaction({
        'from': w3.eth.default_account,
        'nonce': w3.eth.get_transaction_count(w3.eth.default_account),
        'gas': 2000000,
        'gasPrice': w3.to_wei('20', 'gwei')
    })
    signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
    return tx_hash


def bc_record_match(tournament_id, match_id, player1_id, player2_id, player1_score, player2_score, winner_id):
    tx = contract.functions.recordMatch(tournament_id, match_id, player1_id, player2_id, player1_score, player2_score, winner_id).build_transaction({
        'from': w3.eth.default_account,
        'nonce': w3.eth.get_transaction_count(w3.eth.default_account),
        'gas': 2000000,
        'gasPrice': w3.to_wei('20', 'gwei')
    })
    signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
    return tx_hash


def bc_get_tournament(tournament_id):
    matches = contract.functions.getTournament(tournament_id).call()
    return matches


def bc_get_match(match_id):
    match = contract.functions.getMatch(match_id).call()
    return match


def bc_get_player_tournaments(player_id):
    tournaments = contract.functions.getPlayerTournaments(player_id).call()
    return tournaments
