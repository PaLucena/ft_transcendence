from rest_framework.decorators import api_view
from rest_framework import status
from django.contrib.auth.decorators import login_required
from srcs.requirements.backend.django.apps.user.models import AppUser
from .models import UserStats
from rest_framework.response import Response

@api_view (["POST"])
@login_required
def create_tournament(request):
	user = request.user
	name = request.data.get('name')
	friends = request.data.getlist('friends')

	return Response('')


#call blockchain to save data when the tournamnet is complete
@api_view (["POST"])
@login_required
def close_tournament(request):
	try:
		user = request.user

	except Exception as e:
		return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)
