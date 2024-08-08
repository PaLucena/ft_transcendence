from django.core.exceptions import ValidationError
from .models import AppUser, Friend
from rest_framework.response import Response
from rest_framework import status


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
	return Response({"message": "logout was successful"}, status=status.HTTP_200_OK)


def upload_avatar(request):
	try:
		user = request.user
		file = request.FILES.get('image')

		if file.size == 0:
			return Response({'error': 'File is empty'}, status=status.HTTP_400_BAD_REQUEST)
		elif not file.content_type.startswith('image'):
			return Response({'error': 'Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed.'}, status=status.HTTP_400_BAD_REQUEST)

		user.avatar = file
		user.save()
		print("user avatar:", user.avatar)
		return Response({'message': 'Avatar updated successfully.'}, status=status.HTTP_200_OK)

	except Exception as e:
		return Response({"error": str(e)}, status=status.HTTP_409_CONFLICT)