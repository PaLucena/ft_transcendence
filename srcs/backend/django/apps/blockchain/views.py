from django.http import JsonResponse
from .blockchain_service import bc_create_tournament, bc_record_match, bc_get_tournament, bc_get_match
from .blockchain_service import bc_get_player_tournaments, bc_get_player_matches, bc_get_face2face
from .blockchain_service import bc_load_test_data, bc_get_all_tournaments_ids
import json


def create_tournament(data):
    try:
        tournament_id = data.get('tournament_id')
        player_ids = data.get('player_ids')
        if not (tournament_id and player_ids):
            return JsonResponse({'error': 'Invalid input'}, status=400)
        tx_hash = bc_create_tournament(tournament_id, player_ids)
        return JsonResponse({
            'message': 'Tournament created successfully',
            'tx_hash': tx_hash.hex()
        }, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def record_match(data):
        tourn_id = data.get('tournament_id')
        match_id = data.get('match_id')
        p1_id = data.get('player_1_id')
        p2_id = data.get('player_2_id')
        p1_sc = data.get('player_1_goals')
        p2_sc = data.get('player_2_goals')
        win_id = data.get('winner_id')
        p1_mH = data.get('player_1_max_hits')
        p2_mH = data.get('player_2_max_hits')
        mT = data.get('match_total_time')
        fF = data.get('forfeit')

        required_keys = ['tournament_id', 'match_id', 'player_1_id', 'player_2_id', 'player_1_goals', 'player_2_goals',
                         'player_1_max_hits', 'player_2_max_hits', 'match_total_time', 'forfeit', 'winner_id']
        if not all(key in data for key in required_keys):
            return JsonResponse({'error': 'Invalid input'}, status=400)

        try:
            tx_hash = bc_record_match(tourn_id, match_id, p1_id, p2_id, p1_sc, p2_sc, p1_mH, p2_mH, mT, fF, win_id)
            return JsonResponse({
                'message': 'Match recorded successfully',
                'tx_hash': tx_hash.hex()
            }, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


def get_tournament(request, tournament_id):
    try:
        matches = bc_get_tournament(tournament_id)
        return (matches)
    except Exception as e:
        return ("error")


def get_all_tournaments_ids(request):
    try:
        tournaments_ids = bc_get_all_tournaments_ids()
        return JsonResponse({'tournaments_ids': tournaments_ids})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def get_match(request, match_id):
    try:
        match = bc_get_match(match_id)
        return JsonResponse({'match': match})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def get_player_tournaments(request, player_id):
    try:
        tournaments = bc_get_player_tournaments(player_id)
        return (tournaments)
    except Exception as e:
        return ("error")


def get_player_matches(request, player_id):
    try:
        matches = bc_get_player_matches(player_id)
        return (matches)
    except Exception as e:
        return ("error")


def get_face2face(request, player1_id, player2_id):
    try:
        matches = bc_get_face2face(player1_id, player2_id)
        return (matches)
    except Exception as e:
        return ("error")


def load_test_data(request):
    try:
        tx_hash = bc_load_test_data()
        return JsonResponse({
            'message': 'Tournaments recorded successfully',
            'tx_hash': tx_hash.hex()
        }, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
