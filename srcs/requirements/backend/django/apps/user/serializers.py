from django.core import serializers
from rest_framework import serializers
from .models import AppUser
from rest_framework.serializers import ModelSerializer
from rest_framework.authtoken.models import Token
from django.core.files.images import get_image_dimensions
#to send data from database to user

class UserSerializerClass(ModelSerializer):
	confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
	#avatar = serializers.ImageField(allow_null=True, required=False, use_url=True)
	
	class Meta:
		model = AppUser
		fields = ['id', 'username', 'email', 'password', 'nickname', 'confirm_password', 'avatar']
		extra_kwargs = {
			'password': {'write_only': True}
		}

	def validate_email(self, value):
		if AppUser.objects.filter(email__iexact=value).exists():
			raise serializers.ValidationError({"error": "This email is already in use."})
		return value

	def validate_nickname(self, value):
		if AppUser.objects.filter(nickname__iexact=value).exists():
			raise serializers.ValidationError({"error": "This nickname is already in use."})
		return value

	def validate_avatar(self, value):
		print("CONTENT TYPE:", value.content_type)
		if value:
			if not value.content_type.startswith('image'):
				raise serializers.ValidationError("Only image files are allowed.")
			if value.size > 5 * 1024 * 1024:  # Limit file size to 5 MB
				raise serializers.ValidationError("Avatar size must not exceed 5 MB.")
		return value

	def validate(self, data) -> None:
		if data['password'] != data['confirm_password']:
			raise serializers.ValidationError({"error": "Passwords don't match."})
		return data

	def save(self, **kwargs):
		validated_data = {key: value for key, value in self.validated_data.items() if key != 'confirm_password'}
		print("validated_data :", validated_data)
		#avatar = validated_data.get('avatar', None)

		new_user= AppUser.objects.create_user(
			username = self.validated_data['username'],
			email = self.validated_data['email'],
			password = self.validated_data['password'],
			nickname = self.validated_data['nickname'],
			avatar = self.validated_data['avatar'],
		)

		new_user.save()

		new_token = Token.objects.create(user=new_user)