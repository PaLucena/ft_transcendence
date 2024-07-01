from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
	username = models.CharField(max_length=50, unique=True)
	email = models.EmailField(max_length=50, unique=True)
	password = models.CharField(max_length=50)
	name = models.CharField(max_length=50, unique=True)
	#avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
	#updated = models.DateTimeField(auto_now=True)
	#created = models.DateTimeField(auto_now_add=True)
	last_seen = models.DateTimeField(null=True, blank=True)
	online = models.CharField(max_length=10, default="offline")

	def __str__(self):
		return self.name