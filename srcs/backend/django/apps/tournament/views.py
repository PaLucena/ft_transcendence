import re
from rest_framework.decorators import api_view
from rest_framework import status
from django.db.models import Q
from sympy import public
from srcs.backend.django.apps import tournament
from .models import AppUser
from .models import Tournament, UserStats
from rest_framework.response import Response
from user.decorators import default_authentication_required
import random

@api_view (["POST"])
@default_authentication_required
def create_tournament(request):
	try:
		name = request.data.get('name')
		creator = request.user
		type = request.data.get('type')
		if type==Tournament.PRIVATE:
			pending_invitations = request.data.getlist('participants')
			invitation_code = str(random.randint(1000, 9999))

		if len(pending_invitations) > 7:
			return Response({"error": "Too many participants in the invitation list"}, status=status.HTTP_400_BAD_REQUEST)
		
		pending_invitations.append(creator)
		tournament = Tournament.objects.create(
			name=name,
			creator=creator,
			type=type,
			pending_invitations=pending_invitations
		)

		#start countdown 10 min

		return Response({"message": "Created successfully"}, status=status.HTTP_200_OK)

	except Exception as e:
	        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


#call blockchain to save data when the tournament is complete
@api_view (["POST"])
@default_authentication_required
def close_tournament(request, tournament_id):
	try:
		user = request.user
		tournament = Tournament.objects.filter(pk=tournament_id)

		if (user == tournament.creator):
			return Response({"error": "You can't close this tournament."}, status=status.HTTP_403_FORBIDDEN)

		#here
	except Exception as e:
		return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)


@api_view(["POST"])
@default_authentication_required
def display_tournaments(request):
	try:
		user = request.user
		public_tournaments = Tournament.objects.filter(
			type=Tournament.PUBLIC, is_active=False)
		private_tournaments = Tournament.objects.filter(
			pending_invitations=user, type=Tournament.PRIVATE, is_active=False)
		
		response_data = {
			'public_tournaments': public_tournaments,
			'private_tournaments': private_tournaments
		}

		return Response(response_data, status=status.HTTP_200_OK)

	except Exception as e:
		return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@default_authentication_required
def join_tournament(request, tournament_id):
	try:
		user = request.user
		tournament = Tournament.objects.filter(pk=tournament_id)
		if tournament.type == Tournament.PRIVATE:
			if user not in tournament.pending_invitations.all():
				return Response({"error": "You are not invited to this tournament."}, status=status.HTTP_403_FORBIDDEN)
			code = request.data.get('code', '').strip()
			if code != tournament.invitation_code:
				return Response({"error": "Invalid invitation code."}, status=status.HTTP_403_FORBIDDEN)
			tournament.participants.add(user)

		elif tournament.type == Tournament.PUBLIC and len(tournament.participants) < 8:
			tournament.participants.add(user)

		return Response({"success": "You have joined the tournament."}, status=status.HTTP_200_OK)
	
	except Exception as e:
		return Response({"Oops! Tournament is closed or doesn't exist!"}, status=status.HTTP_400_BAD_REQUEST)