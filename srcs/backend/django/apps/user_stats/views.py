from rest_framework.decorators import api_view
from rest_framework import status
from user.models import AppUser
from rest_framework.response import Response
from user.decorators import default_authentication_required
from blockchain.views import get_player_tournaments as bc_get_player_tournaments
from blockchain.views import get_tournament as bc_get_tournament
from blockchain.views import get_player_matches as bc_get_player_matches

@api_view(["POST"])
@default_authentication_required
def player_statistics(request, username):
	try:
		user = AppUser.objects.get(username=username)
		player_id = user.pk
		stats = get_player_statistics(player_id)
		return Response(stats, status=status.HTTP_200_OK)
	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_player_statistics(player_id):
	tournaments = bc_get_player_tournaments(player_id)
	tournament_ids = [t['tournament_id'] for t in tournaments['tournaments']]

	matches = []
	for tournament_id in tournament_ids:
		tournament_matches = bc_get_tournament(tournament_id)
		for match in tournament_matches['matches']:
			if match['player_1_id'] == player_id or match['player_2_id'] == player_id:
				matches.append(match)

	stats = {
		'total_matches': len(matches),
		'wins': 0,
		'losses': 0,
		'average_score': 0,
		'highest_score': 0,
		'total_goals': 0,
	}

	total_goals = 0
	for match in matches:
		player_goals = match['player_1_goals'] if match['player_1_id'] == player_id else match['player_2_goals']
		opponent_goals = match['player_2_goals'] if match['player_1_id'] == player_id else match['player_1_goals']

		total_goals += player_goals

		if player_goals > opponent_goals:
			stats['wins'] += 1
		else:
			stats['losses'] += 1

		if player_goals > stats['highest_score']:
			stats['highest_score'] = player_goals

	stats['average_score'] = total_goals / len(matches) if matches else 0
	stats['total_goals'] = total_goals

	return stats


#will be called after every match to update user data
# @login_required
# @api_view(["POST"])
# def user_stats_update(request):
# 	try:
# 		player_1_data = request.data.get(['player_1'])
# 		player_2_data = request.data.get(['player_2'])

# 		if not player_1_data or not player_2_data:
# 			return Response({'error': 'Missing player data'}, status=status.HTTP_400_BAD_REQUEST)

# 		player_1 = AppUser.objects.filter(pk=player_1.user_id)
# 		player_2 = AppUser.objects.filter(pk=player_2.user_id)

# 		stats_1 = UserStats.objects.filter(user=player_1)
# 		stats_2 = UserStats.objects.filter(user=player_2)
# 		stats_1.update_stats(player_1['won'], player_1['score'])
# 		stats_2.update_stats(player_2['won'], player_2['score'])

# 		return Response({'message': 'Statistics updated successfully.'}, status=status.HTTP_200_OK)

# 	except Exception as e:
# 		return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)


# #user requests to see it's statistics
# @login_required
# @api_view(["GET"])
# def show_stats(request):
# 	try:
# 		user = request.user
# 		stats = UserStats.objects.get(user=user)

# 		data = {
# 			"games_played": stats.games_played,
# 			"games_won": stats.games_won,
# 			"games_lost": stats.games_lost,
# 			"winning_streak": stats.winning_streak,
# 			"losing_streak": stats.losing_streak,
# 			"highest_score": stats.highest_score,
# 			"average_score": stats.average_score,
# 			"win_rate": stats.win_rate,
# 		}
		
# 		return Response(data, status=status.HTTP_200_OK)
# 	except UserStats.DoesNotExist:
# 		return Response({'error': 'User statistics not found'}, status=status.HTTP_404_NOT_FOUND)
	

