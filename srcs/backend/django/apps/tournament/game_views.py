#from adrf.viewsets import APIViewSet
from rest_framework.response import Response
from rest_framework import status
from ponggame.game_manager import game_manager
from rest_framework.decorators import action
from blockchain.views import record_match as bc_record_match
import asyncio

# class MatchViewSet(APIViewSet):

#     @action(detail=False, methods=['post'])
#     async def start_local_match(self, request):
#         try:
#             user = request.user
#             user_id = user.pk
#             match_id = generate_unique_match_id()

#             # Schedule the start_match coroutine to run in the background
#             asyncio.create_task(game_manager.start_match(
#                 tournament_id=0,
#                 match_id=match_id,
#                 player_1_id=user_id,
#                 player_2_id=0,  # AI opponent
#                 controls_mode='local'
#             ))

#             # Return an immediate response to the frontend
#             return Response({'message': 'Match started in the background'}, status=status.HTTP_200_OK)
#         except Exception as e:
#             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# def generate_unique_match_id():
# 	last_match = Match.objects.latest('id')
# 	return last_match.id + 1 if last_match else 1