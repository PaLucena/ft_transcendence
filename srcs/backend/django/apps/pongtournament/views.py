from django.http import JsonResponse
from rest_framework.decorators import api_view
import asyncio
from .tournament_manager import TournamentManager
from user.decorators import default_authentication_required
from rest_framework.response import Response
from rest_framework import status
from pongtournament.tournament_manager import TournamentManager


@api_view(["POST"])
@default_authentication_required
def tournament(request):
    if request.method == "POST":

        clean_tournaments()
        # auto_tournament(request)  #  players 1 to 8

        # new_tournament(request)
        # get_tournaments()

        return JsonResponse({"process finished": "ok"}, status=200)

    return JsonResponse({"error": "Method not allowed."}, status=405)


def clean_tournaments():
    manager = TournamentManager()
    manager.clean_tournaments()
    return JsonResponse({"message": "Tournaments cleaned."})


def auto_tournament(request):
    creator_id = request.user.id
    manager = TournamentManager()

    test_tournament = manager.create_tournament(creator_id, "nombre", is_private=False)
    if not test_tournament:
        print("Error creating tournament.")  # DEBUG
        return JsonResponse({"error": "Error creating tournament."}, status=500)
    manager.join_tournament(test_tournament.id, 2)
    manager.join_tournament(test_tournament.id, 3)
    manager.join_tournament(test_tournament.id, 4)
    manager.join_tournament(test_tournament.id, 5)
    manager.join_tournament(test_tournament.id, 6)
    manager.join_tournament(test_tournament.id, 7)
    manager.join_tournament(test_tournament.id, 8)

    print("Tournament participants: ", test_tournament.participants)  # DEBUG
    asyncio.run(manager.start_tournament(test_tournament.id, creator_id))


def new_tournament(request):
    creator = request.user
    manager = TournamentManager()

    new = manager.create_tournament(creator, "nombre", is_private=True, password="1234")
    if not new:
        print("Error creating tournament.")  # DEBUG
        return JsonResponse({"error": "Error creating tournament."}, status=500)

    return JsonResponse({"message": "Tournament created successfully."}, status=201)


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
