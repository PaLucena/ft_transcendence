from rest_framework.decorators import api_view
from rest_framework import status
from django.db.models import Q
from user.models import AppUser
from .models import Tournament, Match
from rest_framework.response import Response
from user.decorators import default_authentication_required
import random
from blockchain.views import create_tournament as bc_create_tournament
from .tournament_config import next_match_dependencies, required_matches, assignments

# when private tournamnt is craeted, the creator gets the invitation code
@api_view (["GET"])
@default_authentication_required
def get_code(request, tournament_id):
	try:
		user = request.user
		tournament = Tournament.objects.get(pk=tournament_id)
		if user == tournament.creator:
			return Response({"code": tournament.invitation_code}, status=status.HTTP_200_OK)
		else:
			return Response({"error": "Code not available."}, status=status.HTTP_400_BAD_REQUEST)
	except Exception as e:
		return Response({"error": "Code not available."}, status=status.HTTP_400_BAD_REQUEST)


@api_view (["POST"])
@default_authentication_required
def create_tournament(request):
	try:
		creator = request.user
		name = request.data.get('name')
		nickname = request.data.get('nickname')
		type = request.data.get('type')
		invitation_code = None

		if Tournament.objects.filter(name=name).exists():
			return Response({"error": "Tournament name is already taken."}, status=status.HTTP_400_BAD_REQUEST)
		if AppUser.objects.filter(nickname=nickname).exists():
			return Response({"error": "Nickname is already taken."}, status=status.HTTP_400_BAD_REQUEST)

		creator.nickname = nickname
		creator.save()

		if type == Tournament.PRIVATE:
			private_tournament_count = Tournament.objects.filter(creator=creator, type=Tournament.PRIVATE).count()
			if private_tournament_count >= 3:
				return Response({"error": "You can only create up to 3 private tournaments."}, status=status.HTTP_400_BAD_REQUEST)
			invitation_code = str(random.randint(1000, 9999))

		tournament = Tournament.objects.create(
			name=name,
			creator=creator,
			type=type,
			invitation_code=invitation_code
		)

		tournament.participants.add(creator)
		#start countdown 10 min

		return Response({"message": "Created successfully"}, status=status.HTTP_200_OK)

	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


#return list of first 4 available matches
@api_view (["POST"])
@default_authentication_required
def close_tournament(request, tournament_id):
	try:
		user = request.user
		tournament = Tournament.objects.get(pk=tournament_id)
		participant_count = tournament.participants.count()
		matches = []

		if (user != tournament.creator) or participant_count < 2:
			return Response({"error": "You can't close this tournament."}, status=status.HTTP_403_FORBIDDEN)

		player_ids = list(tournament.participants.values_list('pk', flat=True))

		while len(player_ids) < 8:
			player_ids.append(0)

		try:
			data = {
				'tournament_id': tournament_id,
				'player_ids': player_ids
			}
			bc_response = bc_create_tournament(data)

			if bc_response.status_code == 200:
				tournament.player_ids = player_ids
				tournament.is_active = True
				matches = create_initial_matches(tournament)
				available_matches = [format_match(match) for match in matches]
				return Response(available_matches,
					status=status.HTTP_200_OK)

			else:
				return Response({"error": "Blockchain process failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

		except Exception as e:
			return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
	except Exception as e:
		return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@default_authentication_required
def display_tournaments(request):
	try:
		user = request.user
		public_tournaments = Tournament.objects.filter(
			type=Tournament.PUBLIC, is_active=False)
		private_tournaments = Tournament.objects.filter(
			type=Tournament.PRIVATE, is_active=False)
		
		def serialize_tournament(tournament):
			return {
				'name': tournament.name,
				'id': tournament.id,
				'players': [
					{
						'nickname': 'you' if player == user else player.nickname,
	  					'avatar': player.avatar.url
					} 
					for player in tournament.participants.all()
				]
			}
		response_data = {
			'public_tournaments': [serialize_tournament(tournament) for tournament in public_tournaments],
			'private_tournaments': [serialize_tournament(tournament) for tournament in private_tournaments]
		}

		return Response(response_data, status=status.HTTP_200_OK)

	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@default_authentication_required
def join_tournament(request, tournament_id):
	try:
		user = request.user
		tournament = Tournament.objects.get(pk=tournament_id)
		if tournament.participants.count() > 7:
			return Response({"Oops! Tournament is full!"}, status=status.HTTP_400_BAD_REQUEST)

		if tournament.type == Tournament.PRIVATE:
			code = request.data.get('code', '').strip()
			if code != tournament.invitation_code:
				return Response({"error": "Invalid invitation code."}, status=status.HTTP_403_FORBIDDEN)
			if user in tournament.participants.all():
				return Response({"error": "You are already in."}, status=status.HTTP_400_BAD_REQUEST)
			tournament.participants.add(user)

		elif tournament.type == Tournament.PUBLIC:
			if user in tournament.participants.all():
				return Response({"error": "You are already in."}, status=status.HTTP_400_BAD_REQUEST)
			tournament.participants.add(user)

		return Response({"success": "You have joined the tournament."}, status=status.HTTP_200_OK)
	
	except Exception as e:
		return Response({"Oops! Tournament is closed or doesn't exist!"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@default_authentication_required
def remove_participation(request, tournament_id):
	try:
		user = request.user
		tournament = Tournament.objects.get(pk=tournament_id)
		if tournament.is_active == True:
			return Response({"Oops! Tournament is closed!"}, status=status.HTTP_400_BAD_REQUEST)
		if user in tournament.participants.all():
			tournament.participants.remove(user)
			if user == tournament.creator:
				if tournament.participants.count() != 0:
					tournament.creator = tournament.participants.first()

			if tournament.participants.count() == 0:
				tournament.delete()
				return Response({"message": "You were the last participant, so the tournament has been deleted."}, status=status.HTTP_200_OK)
			
		return Response({"success": "You have been removed from the tournament."}, status=status.HTTP_200_OK)

	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# -- match logic --
# checks if the next match can be assigned based on the outcome of the current match.
@api_view(["POST"])
@default_authentication_required
def assign_next_match(tournament, finished_match_data):
	finished_match_id = finished_match_data.get('match_id')
	tournament = finished_match_data.get('tournament_id')
	next_possible_matches = next_match_dependencies.get(finished_match_id, [])
	next_matches = []

	finished_match = Match.objects.get(match_id=finished_match_id, tournament=tournament)
	if finished_match:
		finished_match_data = set_winner_and_loser(finished_match_data, finished_match)
		print("finished_match_data: ", finished_match_data)
		bc_record_match(finished_match_data)

	for next_match_id in next_possible_matches:
		if can_assign_match(tournament, next_match_id) and not Match.objects.filter(match_id=next_match_id).exists():
			match, created = Match.objects.create(
				tournament=tournament,
				match_id=next_match_id
			)
			if auto_advance_match(tournament, match):
				next_matches.append(assign_match_players(tournament, match.match_id))

	if finished_match_id == 14: # needs change
		tournament_cleanup(tournament)

	return next_matches


def set_winner_and_loser(finished_match_data, finished_match):
	player1_id = finished_match_data.get('player_1_id')
	player2_id = finished_match_data.get('player_2_id')
	player1_goals = finished_match_data.get('player_1_goals')
	player2_goals = finished_match_data.get('player_2_goals')

	finished_match.player1 = player1_id
	finished_match.player2 = player2_id

	if player1_goals > player2_goals:
		finished_match.winner = player1_id
		finished_match.loser = player2_id

	elif player1_goals < player2_goals:
		finished_match.winner = player2_id
		finished_match.loser = player1_id

	else:
		finished_match.winner = -1
		finished_match.loser = -1

	finished_match.save()
	finished_match_data['winner_id'] = finished_match.winner

	return finished_match_data


def auto_advance_match(tournament, new_match):
	auto_finish_match = 0
	potential_winner = None
	potential_loser= None

	for required_match_id in required_matches[new_match.match_id]:
		match = Match.objects.filter(tournament=tournament, match_id=required_match_id).first()
		
		if match.winner == -1 and match.loser == -1:
			auto_finish_match += 1
		
		elif match.winner != -1 and match.loser != -1:
			potential_winner = match.winner
			potential_loser = match.loser
			continue

	if auto_finish_match == 0:
		return True

	if auto_finish_match == 1:
		new_match.winner = potential_winner
		new_match.loser = potential_loser

	elif auto_finish_match == 2:
		new_match.winner = -1
		new_match.loser = -1

	new_match.save()
	return False


def can_assign_match(tournament, match):
	for required_match_id in required_matches[match]:
		match = Match.objects.filter(tournament=tournament, match_id=required_match_id).first()

		if not match or match.winner is None:
			return False
	return True


def assign_match_players(tournament, match):
	assignment = assignments[match.match_id]

	player1_role = list(assignment['player1'].key())[0]
	player1_match_id = assignment['player1'][player1_role]
	player1_match = Match.objects.get(tournament=tournament, match_id=player1_match_id)
	match.player1 = getattr(player1_match, player1_role)

	player2_role = list(assignment['player2'].key())[0]
	player2_match_id = assignment['player2'][player2_role]
	player2_match = Match.objects.get(tournament=tournament, match_id=player2_match_id)
	match.player2 = getattr(player2_match, player2_role)

	match.save()
	return match


# tp assign first 4 matches
def create_initial_matches(tournament):
	players = tournament.player_ids
	real_players = [pid for pid in players if pid > 0]
	ai_players = [pid for pid in players if pid == 0]
	match_id = 1
	matches = []

	if len(ai_players) >= 4:
		while match_id <= 4:
			if real_players:
				player1 = real_players.pop(0)
			else:
				player1 = ai_players.pop(0)
			player2 = ai_players.pop(0)

			match = Match.objects.create(
				tournament=tournament,
				match_id=match_id,
				player1=player1,
				player2=player2
			)
			match_id += 1

	if len(ai_players) < 4:
		while match_id <= 4:
			if ai_players:
				player1 = ai_players.pop(0)
			else:
				player1 = real_players.pop(0)
			player2 = real_players.pop(0)

			match = Match.objects.create(
				tournament=tournament,
				match_id=match_id,
				player1=player1,
				player2=player2
			)
			match_id += 1
			matches.append(match)

		available_matches = [format_match(match) for match in matches]

	return available_matches


def format_match(match):
	return {
		'tournament_id': match.tournament.id,
		'match_id': match.match_id,
		'player_1_id': match.player1 if match.player1 else None,
		'player_2_id': match.player2 if match.player2 else None,
	}


def tournament_cleanup(tournament):
	Match.objects.filter(tournament=tournament).delete()
	tournament.delete()
