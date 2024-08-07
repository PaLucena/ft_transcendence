from rest_framework import exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

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
			except TokenError:
				pass

		if not validated_token and refresh_token:
			try:
				refresh = RefreshToken(refresh_token)
				new_access_token = str(refresh.access_token)
				validated_token = self.jwt_auth.get_validated_token(new_access_token)
				request.COOKIES['access_token'] = new_access_token
			except (TokenError, InvalidToken) as e:
				raise exceptions.AuthenticationFailed('Invalid token: %s' % e)

		if not validated_token:
			raise exceptions.AuthenticationFailed('Invalid token and no refresh token provided')

		user = self.jwt_auth.get_user(validated_token)
		request.user = user
		print("USER: ", user)
		print("USER: ", request.user)
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