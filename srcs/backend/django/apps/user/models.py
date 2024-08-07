from tkinter import CASCADE
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils.crypto import get_random_string

class AppUser(AbstractUser):
	nickname = models.CharField(max_length=100, null=True, blank=True, unique=True)
	avatar = models.FileField(upload_to='avatars/', default='default/default.jpg', null=True, blank=True)
	last_seen = models.DateTimeField(null=True, blank=True)
	online = models.CharField(max_length=100, default="offline")
	image_link = models.URLField(null=True, blank=True)
	id_deleted = models.BooleanField(default=False)
	created = models.DateTimeField(auto_now_add=True, auto_now=False)
	api42auth = models.BooleanField(default=False)

	def anonymize(self):
		unique_suffix = get_random_string(length=6)
		self.email = f"deleted_user_{self.id}@example.com"
		self.set_unusable_password()
		self.username = f"deleted_user_{self.id}"
		self.nickname = f"Deleted User {unique_suffix}"
		self.avatar = None
		self.last_seen = None
		self.online = "offline"
		self.image_link = None
		self.games_played = 0
		self.games_won = 0
		self.games_lost = 0
		self.save()

	def __str__(self):
		return self.username


class Friend(models.Model):
	PENDING = 0
	ACCEPTED = 1

	from_user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='friendship_creator', null=True) #user.friendship_creator.all()
	to_user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='friendship_receiver', null=True) #user.friendship_receiver.all()
	status = models.IntegerField(default=PENDING)

	class Meta:
		unique_together = ('from_user', 'to_user')

class Match(models.Model):
	user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='match_as_user', null=True)
	opponent = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='match_as_opponent', null=True)
	user_score = models.IntegerField(null=True)
	opponent_score = models.IntegerField(null=True)
	date = models.DateTimeField(auto_now_add=True, auto_now=False)
