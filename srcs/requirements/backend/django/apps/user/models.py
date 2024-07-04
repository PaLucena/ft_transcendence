from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.choices import BlankChoiceIterator
from django.core.exceptions import ValidationError

class AppUser(AbstractUser):
	#username = models.CharField(max_length=50, unique=True)
	#email = models.EmailField(max_length=50, unique=True)
	#password = models.CharField(max_length=50)
	nickname = models.CharField(max_length=100, null=True, blank=True)
	avatar = models.ImageField(upload_to='media/', default='media/default.jpg', null=True, blank=True)
	# #updated = models.DateTimeField(auto_now=True)
	# #created = models.DateTimeField(auto_now_add=True)
	last_seen = models.DateTimeField(null=True, blank=True)
	online = models.CharField(max_length=100, default="offline")

	def clean(self):
		if AppUser.objects.filter(nickname__iexact=self.nickname).exclude(pk=self.pk).exists():
			raise ValidationError({'nickname': "This nickname is already in use."})
	
	def __str__(self):
		return self.username