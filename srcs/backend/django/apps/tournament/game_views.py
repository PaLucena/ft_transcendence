from urllib import request

from django.core.exceptions import ObjectDoesNotExist
from adrf.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ponggame.game_manager import game_manager
from blockchain.views import record_match as bc_record_match
import asyncio
from user.models import AppUser
from .models import Match, Tournament
from asgiref.sync import sync_to_async
from user.authenticate import DefaultAuthentication
from .match_logic import format_match_for_bc


class BaseMatch(APIView):
	authentication_classes = [DefaultAuthentication]
	
	async def post(self, request):
		try:
			user = request.user
			user_id = user.pk
			player_2_id = self.get_player2_id(request)
			tournament = await sync_to_async(ensure_private_tournament_exists)()
			match_id = await sync_to_async(generate_unique_match_id)(tournament)
	
			await sync_to_async(Match.objects.create)(
				tournament=tournament,
				match_id=match_id,
			)

			# run in the background
			asyncio.create_task(self.handle_match_and_record(user_id, player_2_id, match_id))

			return Response({'message': 'Match started!'}, status=status.HTTP_200_OK)
		except ValueError as ve:
			return Response({'error': str(ve)}, status=status.HTTP_400_BAD_REQUEST)
		except Exception as e:
			return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

	async def handle_match_and_record(self, user_id, player_2_id, match_id):
		try:
			result = await game_manager.start_match(
				tournament_id=0,
				match_id=match_id,
				player_1_id=user_id,
				player_2_id=player_2_id,
				controls_mode=self.get_controls_mode()
			)
			print("SAVING MATCH 1:: ", result)
			await sync_to_async(bc_record_match)(format_match_for_bc(result))
			print("SAVING MATCH 2:: ", result)
		except Exception as e:
			print(f"Error handling match result: {e}")


def generate_unique_match_id(tournament):
	last_match = Match.objects.filter(tournament=tournament).order_by('match_id').last()
	return last_match.match_id + 1 if last_match else 1


def ensure_private_tournament_exists():
	try:
		tournament = Tournament.objects.get(id=0)
	except Tournament.DoesNotExist:
		tournament = Tournament(
			id=0,
			name='Private Matches',
			type=Tournament.PUBLIC,
			creator=None
		)
		tournament.save()
	return tournament


class LocalMatch(BaseMatch):
	def get_controls_mode(self):
		return 'local'

	def get_player2_id(self, request):
		return 0


class AiMatch(BaseMatch):
	def get_controls_mode(self):
		return 'AI'

	def get_player2_id(self, request):
		return 0


class RemoteMatch(BaseMatch):
	def get_controls_mode(self):
		return 'remote'

	def get_player2_id(self, request):
		# player_2_id has to be passed in the request data for remote matches
		player_2_username = request.data.get('player_2_username', 0)
		
		if not player_2_username:
			raise ValueError("Player 2 ID must be provided for a remote match.")
    
		try:
			player_2 = AppUser.objects.get(username=player_2_username)
		except ObjectDoesNotExist:
			raise ValueError(f"Invited user does not exist.")

		return player_2.id