from . import w3, contract, private_key


def bc_create_tournament(tournament_id, player_ids):
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


def bc_record_match(tourn_id, match_id, p1_id, p2_id, p1_sc, p2_sc, win_id):
    tx = contract.functions.recordMatch(tourn_id, match_id, p1_id, p2_id, p1_sc, p2_sc, win_id).build_transaction({
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
    matches = contract.functions.getTournament(tournament_id).call()
    return matches


def bc_get_all_tournaments_ids():
    tournaments_ids = contract.functions.getAllTournamentsIds().call()
    return tournaments_ids


def bc_get_match(match_id):
    match = contract.functions.getMatch(match_id).call()
    return match


def bc_get_player_tournaments(player_id):
    tournaments = contract.functions.getPlayerTournaments(player_id).call()
    return tournaments


def bc_get_player_matches(player_id):
    matches = contract.functions.getPlayerMatches(player_id).call()
    return matches


def bc_get_face2face(player1_id, player2_id):
    matches = contract.functions.getFace2Face(player1_id, player2_id).call()
    return matches


def bc_load_test_data():
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