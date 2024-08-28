from django.core.exceptions import ValidationError
from .models import AppUser
from friends.models import Friend
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
from django.conf import settings
from django.utils.timezone import utc
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os

def get_friend_count(user):
	from_user_count = Friend.objects.filter(from_user=user, status=Friend.ACCEPTED).count()
	to_user_count = Friend.objects.filter(to_user=user, status=Friend.ACCEPTED).count()
	return from_user_count + to_user_count


def set_nickname(request):
	nickname = request.data.get('nickname')
	user = request.user
	if AppUser.objects.filter(nickname__iexact=nickname).exclude(pk=user.pk).exists():
		return Response({"error": "This nickname is already in use."}, status=status.HTTP_400_BAD_REQUEST)

	if not nickname:
		user.nickname = user.username

	else:
		user.nickname = nickname
	user.save()
	return Response({"message": "Nickname set successfully"}, status=status.HTTP_200_OK)


def upload_avatar(request):
	try:
		user = request.user
		file = request.FILES.get('image')

		if file.size == 0:
			return Response({'error': 'File is empty'}, status=status.HTTP_400_BAD_REQUEST)
		elif not file.content_type.startswith('image'):
			return Response({'error': 'Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed.'}, status=status.HTTP_400_BAD_REQUEST)

		#user.avatar = file
		#user.save()

		extension = file.name.split('.')[-1]
		filename = f"{user.username}.{extension}"
		filepath = os.path.join('avatars', filename)
		counter = 1

		while default_storage.exists(os.path.join(settings.MEDIA_ROOT, filepath)):
			filename: str = f"{user.username}_{counter}.{extension}"
			filepath = os.path.join('avatars', filename)
			counter += 1

		user.avatar.save(filepath, ContentFile(file.read()), save=True)

		print("user avatar:", user.avatar)
		return Response({'message': 'Avatar updated successfully.'}, status=status.HTTP_200_OK)

	except Exception as e:
		return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)


# def get_token_expiry_times():
# 	access_token_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
# 	refresh_token_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']

# 	access_token_expiry = (datetime.utcnow() + access_token_lifetime).replace(tzinfo=utc)
# 	refresh_token_expiry = (datetime.utcnow() + refresh_token_lifetime).replace(tzinfo=utc)

# 	return access_token_expiry, refresh_token_expiry
