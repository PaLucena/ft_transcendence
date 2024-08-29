from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from asgiref.sync import sync_to_async
import asyncio
from .models import Match
from user.decorators import default_authentication_required
from user.models import AppUser
from blockchain.views import record_match as bc_record_match
from ponggame.game_manager import game_manager


@api_view(["POST"])
@default_authentication_required
def start_local_match(request):
	try:
		user = request.user
		user_id =  user.pk
		match_id = generate_unique_match_id()

		# Start the match using the GameManager's start_match method
		result = asyncio.run(game_manager.start_match(
			tournament_id=0,
			match_id=match_id,
			player_1_id=user_id,
			player_2_id=0,  # AI opponent
			controls_mode='local'
		))

		return Response(result, status=status.HTTP_200_OK)
	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def generate_unique_match_id():
	last_match = Match.objects.latest('id')
	return last_match.id + 1 if last_match else 1