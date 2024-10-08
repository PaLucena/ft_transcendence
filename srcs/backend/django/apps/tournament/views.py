from rest_framework.decorators import api_view
from rest_framework import status
from django.db.models import Q
from user.models import AppUser
from .models import Tournament, Match
from rest_framework.response import Response
from user.decorators import default_authentication_required
import random
from blockchain.views import create_tournament as bc_create_tournament
from .match_logic import create_initial_matches
from user.utils import set_nickname

from ponggame.game_manager import game_manager
from asgiref.sync import sync_to_async
import asyncio

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
		type = request.data.get('type')
		invitation_code = None

		if Tournament.objects.filter(name=name).exists():
			return Response({"error": "Tournament name is already taken."}, status=status.HTTP_400_BAD_REQUEST)

		clean_name = name.replace('_', '')
		if not name or not clean_name.isalnum():
			return Response({"error": "Tournament name can only contain letters, numbers, and underscores."}, status=status.HTTP_400_BAD_REQUEST)

		nickname_response = set_nickname(request)
		if nickname_response.status_code != status.HTTP_200_OK:
			return nickname_response

		active_tournaments = Tournament.objects.filter(creator=creator)
		if active_tournaments.exists():
			return Response({"error": "You can only create one tournament at a time."}, status=status.HTTP_400_BAD_REQUEST)
		
		if type == Tournament.PRIVATE:
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


#return list of first available matches
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
@api_view (["POST"])
@default_authentication_required
def close_tournament(request, tournament_id):
	try:
		user = request.user
		tournament = Tournament.objects.get(pk=tournament_id)
		participant_count = tournament.participants.count()
		matches = []
		if user != tournament.creator:
			return Response({"error": "You can not close tournament!"}, status=status.HTTP_403_FORBIDDEN)
		if participant_count < 2:
			return Response({"error": "To close tournament minimum 2 players are required!"}, status=status.HTTP_403_FORBIDDEN)

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
				tournament.save()
				available_matches = create_initial_matches(tournament)
				
				print("BEFORE")
				print("Tournament creator: ", tournament.creator)

				async_to_sync(get_channel_layer().group_send)(
					f"tournament_{tournament.name}",
					{
						"type": "start_matches",
						"tournament_id": tournament_id,
						"matches": available_matches
					}
				)

				print("AFTER")
				return Response({"message": "Tournament starting."},
					status=status.HTTP_200_OK)

			else:
				return Response({"error": "Blockchain process failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

		except Exception as e:
			return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
	except Exception as e:
		return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@default_authentication_required
def get_tournament_creator(request, tournament_id):
	try:
		user = request.user
		tournament = Tournament.objects.get(pk=tournament_id)
		response = False

		if user == tournament.creator:
			response = True

		return Response(response, status=status.HTTP_200_OK)
	except Tournament.DoesNotExist:
		return Response({"error": "Tournament not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@default_authentication_required
def display_tournaments(request):
	try:
		user = request.user
		public_tournaments = Tournament.objects.filter(
			type=Tournament.PUBLIC, is_active=False).exclude(id=0)
		private_tournaments = Tournament.objects.filter(
			type=Tournament.PRIVATE, is_active=False).exclude(id=0)
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

		nickname_response = set_nickname(request)
		if nickname_response.status_code != status.HTTP_200_OK:
			return nickname_response
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
					tournament.save()

			if tournament.participants.count() == 0:
				tournament.delete()
				return Response({"message": "You were the last participant, so the tournament has been deleted."}, status=status.HTTP_200_OK)
			
		return Response({"success": "You have been removed from the tournament."}, status=status.HTTP_200_OK)

	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@default_authentication_required
def tournament_bracket(request, tournament_id):
    try:
        tournament = Tournament.objects.get(pk=tournament_id)
        bracket_data = get_tournament_bracket(tournament)
        return Response({'bracket': bracket_data}, status=status.HTTP_200_OK)
    except Tournament.DoesNotExist:
        return Response({"error": "Tournament not found."}, status=status.HTTP_404_NOT_FOUND)


#to show tournament bracket
def get_tournament_bracket(tournament):
	bracket_data = []
	matches = Match.objects.filter(tournament=tournament).order_by('match_id')

	for match in matches:
		if match.player1 == 0:
			player1_nickname = "AI"
		elif match.player1 == -1:
			player1_nickname = "Did not participate"
		else:
			player1 = AppUser.objects.filter(pk=match.player1).first()
			player1_nickname = player1.nickname if player1 else "None"

		if match.player2 == 0:
			player2_nickname = "AI"
		elif match.player2 == -1:
			player2_nickname = "Did not participate"
		else:
			player2 = AppUser.objects.filter(pk=match.player2).first()
			player2_nickname = player2.nickname if player2 else "None"

		match_data = {
			'match_id': match.match_id,
			'player1_nickname': player1_nickname,
			'player2_nickname': player2_nickname,
		}
		bracket_data.append(match_data)

	return bracket_data