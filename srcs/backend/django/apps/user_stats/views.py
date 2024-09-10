from rest_framework.decorators import api_view
from rest_framework import status
from user.models import AppUser
from rest_framework.response import Response
from user.decorators import default_authentication_required
from blockchain.views import get_player_matches as bc_get_player_matches
from blockchain.views import get_face2face as bc_get_face2face
from friends.views import get_friendship_status

@api_view(["GET"])
@default_authentication_required
def player_statistics(request, username):
	try:
		user = AppUser.objects.get(username=username)
		player_id = user.pk
		matches_response = bc_get_player_matches(request, player_id)

		if matches_response == "error":
			return Response({'error': 'Could not retrieve player matches'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

		stats = calculate_player_statistics(matches_response, player_id)

		return Response(stats, status=status.HTTP_200_OK)
	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# call this if player and his friend have matches in common
@api_view(["GET"])
@default_authentication_required
def player_comparison(request, username):
	try:
		user = request.user
		player_id = user.id
		viewed_user = AppUser.objects.get(username=username)
		viewed_player_id = viewed_user.id

		if get_friendship_status(user, viewed_user) != "accepted":
			print("USER 1: ", user)
			print("USER 2: ", viewed_user)
			return Response({'error': 'You can only compare statistics with friends.'}, status=status.HTTP_403_FORBIDDEN)

		matches_response = bc_get_face2face(request, player_id, viewed_player_id)

		if matches_response == "error":
			return Response({'error': 'Could not retrieve face-to-face matches.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
		
		if matches_response == []:
			return Response({'error': 'You have no matches in common.'}, status=status.HTTP_400_BAD_REQUEST)

		comparison_stats = calculate_face2face_statistics(matches_response, player_id, viewed_player_id)

		return Response(comparison_stats, status=status.HTTP_200_OK)
	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def calculate_player_statistics(matches, player_id):

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
		tournament_id = match[0]
		match_id = match[1]
		player_1_id = match[2]
		player_2_id = match[3]
		player_1_goals = match[4]
		player_2_goals = match[5]
		winner_id = match[6]

		if player_1_id == player_id:
			player_goals = player_1_goals
			opponent_goals = player_2_goals
		elif player_2_id == player_id:
			player_goals = player_2_goals
			opponent_goals = player_1_goals
		else:
			continue

		total_goals += player_goals

		if winner_id == player_id:
			stats['wins'] += 1
		else:
			stats['losses'] += 1

		if player_goals > stats['highest_score']:
			stats['highest_score'] = player_goals

	if stats['total_matches'] > 0:
		stats['average_score'] = total_goals / stats['total_matches']

	stats['total_goals'] = total_goals

	return stats


def calculate_face2face_statistics(matches, player1_id, player2_id):
	comparison_stats = {
		'total_matches': len(matches),
		'player1_wins': 0,
		'player2_wins': 0,
		'player1_total_goals': 0,
		'player2_total_goals': 0,
		'player1_average_goals_per_match': 0,
		'player2_average_goals_per_match': 0,
		'player1_win_percentage': 0,
		'player2_win_percentage': 0,
	}

	for match in matches:
		tournament_id = match[0]
		match_id = match[1]
		player_1_id = match[2]
		player_2_id = match[3]
		player_1_goals = match[4]
		player_2_goals = match[5]
		winner_id = match[6]

		if player_1_id == player1_id:
			comparison_stats['player1_total_goals'] += player_1_goals
			comparison_stats['player2_total_goals'] += player_2_goals

		elif player_2_id == player1_id:
			comparison_stats['player1_total_goals'] += player_2_goals
			comparison_stats['player2_total_goals'] += player_1_goals

		if winner_id == player1_id:
			comparison_stats['player1_wins'] += 1
		elif winner_id == player2_id:
			comparison_stats['player2_wins'] += 1

	total_matches = comparison_stats['total_matches']

	if total_matches > 0:
		comparison_stats['player1_average_goals_per_match'] = round(comparison_stats['player1_total_goals'] / total_matches, 2)
		comparison_stats['player2_average_goals_per_match'] = round(comparison_stats['player2_total_goals'] / total_matches, 2)
		
		comparison_stats['player1_win_percentage'] = round((comparison_stats['player1_wins'] / total_matches) * 100, 2)
		comparison_stats['player2_win_percentage'] = round((comparison_stats['player2_wins'] / total_matches) * 100, 2)

	return comparison_stats
