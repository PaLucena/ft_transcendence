import json
import os
from typing import Optional

from web3 import Web3
from web3.contract import Contract

w3: Optional[Web3] = None
contract: Optional[Contract] = None
private_key: Optional[str] = None

def connect_to_blockchain():
    global w3, contract, private_key

    if w3 is not None and w3.is_connected():
        return

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


def bc_create_tournament(tournament_id, player_ids):
    global w3, contract, private_key
    connect_to_blockchain()
    tx = contract.functions.createTournament(tournament_id, player_ids).build_transaction({
        'from': w3.eth.default_account,
        'nonce': w3.eth.get_transaction_count(w3.eth.default_account),
        'gas': 2000000,
        'gasPrice': w3.to_wei('20', 'gwei')
    })
    signed_tx = w3.eth.account.sign_transaction(tx, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
    return tx_hash


def bc_record_match(tourn_id, match_id, p1_id, p2_id, p1_sc, p2_sc, p1_mh, p2_mh, mt, ff, win_id):
    global w3, contract, private_key
    connect_to_blockchain()
    tx = contract.functions.recordMatch(tourn_id, match_id, p1_id, p2_id, p1_sc, p2_sc, p1_mh, p2_mh, mt, ff, win_id).build_transaction({
        'from': w3.eth.default_account,
        'nonce': w3.eth.get_transaction_count(w3.eth.default_account),
        'gas': 2000000,
        'gasPrice': w3.to_wei('20', 'gwei')
    })
    signed_tx = w3.eth.account.sign_transaction(tx, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
    return tx_hash


def bc_get_tournament(tournament_id):
    global contract
    connect_to_blockchain()
    matches = contract.functions.getTournament(tournament_id).call()
    return matches


def bc_get_all_tournaments_ids():
    global contract
    connect_to_blockchain()
    tournaments_ids = contract.functions.getAllTournamentsIds().call()
    return tournaments_ids


def bc_get_match(match_id):
    global contract
    connect_to_blockchain()
    match = contract.functions.getMatch(match_id).call()
    return match


def bc_get_player_tournaments(player_id):
    global contract
    connect_to_blockchain()
    tournaments = contract.functions.getPlayerTournaments(player_id).call()
    return tournaments


def bc_get_player_matches(player_id):
    global contract
    connect_to_blockchain()
    matches = contract.functions.getPlayerMatches(player_id).call()
    return matches


def bc_get_face2face(player1_id, player2_id):
    global contract
    connect_to_blockchain()
    matches = contract.functions.getFace2Face(player1_id, player2_id).call()
    return matches


def bc_load_test_data():
    global w3, contract, private_key
    connect_to_blockchain()
    tx = contract.functions.loadTestData().build_transaction({
        'from': w3.eth.default_account,
        'nonce': w3.eth.get_transaction_count(w3.eth.default_account),
        'gas': 30000000,
        'gasPrice': w3.to_wei('20', 'gwei')
    })
    signed_tx = w3.eth.account.sign_transaction(tx, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    w3.eth.wait_for_transaction_receipt(tx_hash)
    return tx_hash