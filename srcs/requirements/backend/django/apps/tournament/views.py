from rest_framework.decorators import api_view
from rest_framework import status
from django.contrib.auth.decorators import login_required
from srcs.requirements.backend.django.apps import user
from srcs.requirements.backend.django.apps.user.models import AppUser
from .models import Tournament, UserStats
from rest_framework.response import Response

@api_view (["POST"])
@login_required
def create_tournament(request):
	try:
		creator = request.user
		name = request.data.get('name')
		type = request.data.get('type')
		participants = request.data.getlist('participants') if type==Tournament.PRIVATE else []
		
		tournament = Tournament.objects.create(
			creator=creator,
			name=name,
			type=type
		)

		return Response('')

	except Exception as e:
	        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


#call blockchain to save data when the tournament is complete
@api_view (["POST"])
@login_required
def close_tournament(request):
	try:
		user = request.user

	except Exception as e:
		return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)


@login_required
@api_view(["POST"])
def join_tournament(request, tournament_id):