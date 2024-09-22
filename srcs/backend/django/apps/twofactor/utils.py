from django_otp.plugins.otp_totp.models import TOTPDevice
from user.models import AppUser as userModel

def Has2faEnabled(username):
	print(f"user in util is {username}")
	try:
		user = userModel.objects.get(username=username)
		if user == None:
			return False
		device = TOTPDevice.objects.get(user=user, confirmed=True)
		return True
	except userModel.DoesNotExist:
		return False
	except TOTPDevice.DoesNotExist:
		return False