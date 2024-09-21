from rest_framework import exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .models import AppUser
from twofactor.utils import Has2faEnabled  # Import the 2FA checking function

class DefaultAuthentication:

	def __init__(self):
		self.jwt_auth = JWTAuthentication()

	def authenticate(self, request):
		access_token = request.COOKIES.get('access_token')
		refresh_token = request.COOKIES.get('refresh_token')
		validated_token = None

		if access_token:
			try:
				validated_token = self.jwt_auth.get_validated_token(access_token)
			except Exception as e:
				if refresh_token:
					try:
						refresh = RefreshToken(refresh_token)
						new_access_token = str(refresh.access_token)
						validated_token = self.jwt_auth.get_validated_token(new_access_token)
						request.COOKIES['access_token'] = new_access_token
					except (TokenError, InvalidToken) as e:
						raise exceptions.AuthenticationFailed(f'Invalid refresh token: {e}')
				else:
					raise exceptions.AuthenticationFailed('No refresh token provided')

		else:
			raise exceptions.AuthenticationFailed('No access token provided')
			#return redirect('login')

		user = self.jwt_auth.get_user(validated_token)

		if not AppUser.objects.filter(pk=user.pk).exists():
			raise exceptions.AuthenticationFailed('User does not exist')

		if Has2faEnabled(user.username):
			twofactor_access_token = request.COOKIES.get('twofactor_access_token')
			twofactor_refresh_token = request.COOKIES.get('twofactor_refresh_token')

			if twofactor_access_token:
				try:
					validated_token = self.jwt_auth.get_validated_token(twofactor_access_token)
				except Exception as e:
					if twofactor_refresh_token:
						try:
							twofactor_refresh = RefreshToken(twofactor_refresh_token)
							new_twofactor_access_token = str(twofactor_refresh.access_token)
							validated_token = self.jwt_auth.get_validated_token(new_twofactor_access_token)
							request.COOKIES['twofactor_access_token'] = new_twofactor_access_token
						except (TokenError, InvalidToken) as e:
							raise exceptions.AuthenticationFailed(f'Invalid 2FA refresh token: {e}')
					else:
						raise exceptions.AuthenticationFailed('No 2FA refresh token provided')
			else:
				raise exceptions.AuthenticationFailed('No 2FA access token provided')


		request.user = user

		return user, request.COOKIES.get('access_token')


	def authenticate_header(self, request):
		"""
		Return the value of the WWW-Authenticate header in response to a
		request that was not authenticated.
		"""
		return 'Authentication realm="api"'

	# def refresh_access_token(self, refresh_token):
	# 	try:
	# 		refresh = RefreshToken(refresh_token)
	# 		new_access_token = str(refresh.access_token)
	# 		# Blacklist the old refresh token
	# 		refresh.blacklist()
	# 		return new_access_token
	# 	except TokenError as e:
	# 		print(f"Token error: {e}")
	# 		return None
