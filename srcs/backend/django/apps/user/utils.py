from .models import AppUser
from friends.models import Friend
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.utils.timezone import utc
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import uuid


def get_friend_count(user):
	from_user_count = Friend.objects.filter(from_user=user, status=Friend.ACCEPTED).count()
	to_user_count = Friend.objects.filter(to_user=user, status=Friend.ACCEPTED).count()
	return from_user_count + to_user_count


def upload_avatar(request):
	try:
		user = request.user
		file = request.FILES.get('avatar')

		if not file:
			return {'error': 'No file uploaded'}
		if file.size == 0:
			return {'error': 'File is empty'}
		if not file.content_type.startswith('image'):
			return {'error': 'Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed.'}

		extension = file.name.split('.')[-1]
		filename = f"{user.username}_{uuid.uuid4().hex}.{extension}"

		if user.avatar and user.avatar.name != "default/default.jpg":
			old_avatar_path = os.path.join(settings.MEDIA_ROOT, user.avatar.name)
			if os.path.exists(old_avatar_path):
				os.remove(old_avatar_path)
		try:
			user.avatar.save(filename, ContentFile(file.read()), save=True)
		except Exception as e:
			return {'error': f'File upload failed: {str(e)}'}

		return None

	except Exception as e:
		return {'error': str(e)}
