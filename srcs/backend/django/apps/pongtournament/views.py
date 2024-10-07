import time

from django.http import JsonResponse
from rest_framework.decorators import api_view
import asyncio
from user.decorators import default_authentication_required
from rest_framework.response import Response
from rest_framework import status
from pongtournament.tournament_manager import TournamentManager

from ponggame.game_manager import game_manager
from blockchain.views import record_match


@api_view(["POST"])
@default_authentication_required
def tournament(request):
    if request.method == "POST":
        clean_tournaments()
        return JsonResponse({"process finished": "ok"}, status=200)
    return JsonResponse({"error": "Method not allowed."}, status=405)


def clean_tournaments():
    manager = TournamentManager()
    manager.clean_tournaments()
    return JsonResponse({"message": "Tournaments cleaned."})


def get_tournaments():
    manager = TournamentManager()
    public_tournaments = manager.get_tournaments_by_privacy(is_private=False)
    print("Public tournaments: ", public_tournaments)  # DEBUG
    private_tournaments = manager.get_tournaments_by_privacy(is_private=True)
    print("Private tournaments: ", private_tournaments)  # DEBUG

    return JsonResponse({"ok": "ok"}, status=200)


@api_view(["GET"])
@default_authentication_required
def get_tournament_room_data(request, tournament_id):
    try:
        manager = TournamentManager()
        tournament_data = manager.get_tournament_data(tournament_id)

        participants_data = tournament_data["participants_data"]
        creator_id = tournament_data["creator"]
        current_id = request.user.id
        participants = tournament_data["participants"]
        players = tournament_data["players"]
        tournament_name = tournament_data["name"]
        tournament_phase = tournament_data["current_phase"]

        if current_id not in participants:
            return Response(
                {"detail": "You are not a participant in this tournament."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            {
                "participants_data": participants_data,
                "creator_id": creator_id,
                "current_id": current_id,
                "tournament_name": tournament_name,
                "participants": participants,
                "players": players,
                "current_phase": tournament_phase,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@default_authentication_required
def get_active_tournaments(request):
    try:
        manager = TournamentManager()
        public_tournaments = manager.get_tournaments_by_privacy(is_private=False)
        private_tournaments = manager.get_tournaments_by_privacy(is_private=True)
        player_id = request.user.id
        return Response(
            {
                "public_tournaments": public_tournaments,
                "private_tournaments": private_tournaments,
                "player_id": player_id,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {"detail": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@default_authentication_required
def new_single_match(request):
    try:
        user = request.user
        tournament_id = 0
        player_1_id = user.id
        player_2_id = request.data.get("player_2_id")
        match_id = get_unique_match_id(user.id)
        controls_mode = request.data.get("controls_mode")

        if player_2_id is None or controls_mode is None:
            raise ValueError("Missing required fields: player_2_id or controls_mode")

        asyncio.run(handle_and_record_single_match(
            tournament_id,
            match_id,
            player_1_id,
            player_2_id,
            controls_mode,
        ))

        return Response({"match_id": match_id}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


def get_unique_match_id(user_id):
    timestamp = int(time.time())
    formated_time = time.strftime("%y%m%d%H%M%S", time.localtime(timestamp))
    tournament_id = f"{formated_time}{user_id}"
    return tournament_id


async def handle_and_record_single_match(tournament_id, match_id, player_1_id, player_2_id, controls_mode):
    try:
        result = await game_manager.start_match(
            tournament_id=tournament_id,
            match_id=match_id,
            player_1_id=player_1_id,
            player_2_id=player_2_id,
            controls_mode=controls_mode,
        )
        data = TournamentManager.match_to_uint(TournamentManager, result)
        record_match(data)
    except Exception as e:
        print(f"Error handling match result: {e}")