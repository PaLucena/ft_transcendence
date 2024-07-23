from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .blockchain_service import bc_create_tournament, bc_record_match, bc_get_tournament, bc_get_match, bc_get_player_tournaments
import json


@csrf_exempt
def create_tournament(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        tournament_id = data.get('tournament_id')
        player_ids = data.get('player_ids')
        if not (tournament_id and player_ids):
            return JsonResponse({'error': 'Invalid input'}, status=400)

        try:
            tx_hash = bc_create_tournament(tournament_id, player_ids)
            return JsonResponse({'tx_hash': tx_hash.hex()})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def record_match(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        tournament_id = data.get('tournament_id')
        match_id = data.get('match_id')
        player1_id = data.get('player1_id')
        player2_id = data.get('player2_id')
        player1_score = data.get('player1_score')
        player2_score = data.get('player2_score')
        winner_id = data.get('winner_id')
        if not (tournament_id and match_id and player1_id and player2_id and player1_score and player2_score and winner_id):
            return JsonResponse({'error': 'Invalid input'}, status=400)

        try:
            tx_hash = bc_record_match(tournament_id, match_id, player1_id, player2_id, player1_score, player2_score, winner_id)
            return JsonResponse({'tx_hash': tx_hash.hex()})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


def get_tournament(request, tournament_id):
    try:
        matches = bc_get_tournament(tournament_id)
        return JsonResponse({'matches': matches})
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
        return JsonResponse({'tournaments': tournaments})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
