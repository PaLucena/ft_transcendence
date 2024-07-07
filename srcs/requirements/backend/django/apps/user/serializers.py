from .models import AppUser
from rest_framework.serializers import ModelSerializer
from rest_framework.authtoken.models import Token

#to send data from database to user
class UserSerializerClass(ModelSerializer):
	class Meta:
		model = AppUser
		fields = ['id', 'username', 'email', 'password']

	def save(self, **kwargs):

		new_user= AppUser.objects.create_user(
			username = self.validated_data['username'],
			email = self.validated_data['email'],
			password = self.validated_data['password'],
		)

		new_user.save()

		new_token = Token.objects.create(user=new_user)