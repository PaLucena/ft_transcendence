from rest_framework.decorators import api_view
from rest_framework import status
from django.contrib.auth.decorators import login_required
from user.models import AppUser
from .models import UserStats
from rest_framework.response import Response
from blockchain.views import get_player_tournaments as bc_get_player_tournaments
from blockchain.views import get_player_matches as bc_get_player_matches


# expected from blockchain smth like this
# {
#     "player1": {
#         "user_id": 2,
#         "won": true,
#         "score": 150
#     },
#     "player2": {
#         "user_id": 3,
#         "won": false,
#         "score": 120
#     }
# }

#will be called after every match to update user data
@login_required
@api_view(["POST"])
def user_stats_update(request):
	try:
		player_1_data = request.data.get(['player_1'])
		player_2_data = request.data.get(['player_2'])

		if not player_1_data or not player_2_data:
			return Response({'error': 'Missing player data'}, status=status.HTTP_400_BAD_REQUEST)

		player_1 = AppUser.objects.filter(pk=player_1.user_id)
		player_2 = AppUser.objects.filter(pk=player_2.user_id)

		stats_1 = UserStats.objects.filter(user=player_1)
		stats_2 = UserStats.objects.filter(user=player_2)
		stats_1.update_stats(player_1['won'], player_1['score'])
		stats_2.update_stats(player_2['won'], player_2['score'])

		return Response({'message': 'Statistics updated successfully.'}, status=status.HTTP_200_OK)

	except Exception as e:
		return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)


#user requests to see it's statistics
@login_required
@api_view(["GET"])
def show_stats(request):
	try:
		user = request.user
		stats = UserStats.objects.get(user=user)

		data = {
			"games_played": stats.games_played,
			"games_won": stats.games_won,
			"games_lost": stats.games_lost,
			"winning_streak": stats.winning_streak,
			"losing_streak": stats.losing_streak,
			"highest_score": stats.highest_score,
			"average_score": stats.average_score,
			"win_rate": stats.win_rate,
		}
		
		return Response(data, status=status.HTTP_200_OK)
	except UserStats.DoesNotExist:
		return Response({'error': 'User statistics not found'}, status=status.HTTP_404_NOT_FOUND)
	
