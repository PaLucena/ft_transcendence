from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.choices import BlankChoiceIterator
from django.core.exceptions import ValidationError

class AppUser(AbstractUser):
	nickname = models.CharField(max_length=100, null=True, blank=True, unique=True)
	avatar = models.FileField(upload_to='avatars/', default='avatars/default.jpg', null=True, blank=True)
	last_seen = models.DateTimeField(null=True, blank=True)
	online = models.CharField(max_length=100, default="offline")
	image_link = models.URLField(null=True, blank=True)
	games_played = models.IntegerField(default=0)
	games_won = models.IntegerField(default=0)
	games_lost = models.IntegerField(default=0)
	score = models.IntegerField(default=0)
	# #updated = models.DateTimeField(auto_now=True)
	# #created = models.DateTimeField(auto_now_add=True)
	
	def __str__(self):
		return self.username