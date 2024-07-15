from django.db import models
from django.contrib.auth.models import AbstractUser
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
	friends = models.ManyToManyField("AppUser", blank=True)

	def __str__(self):
		return self.username
	
	class Meta:
		db_table = 'user_appuser'

class Friend(models.Model):
	PENDING = 0
	ACCEPTED = 1

	from_user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='friendship_creator') #user.friendship_creator.all()
	to_user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='friendship_receiver') #user.friendship_receiver.all()
	status = models.IntegerField(default=PENDING)

	class Meta:
		unique_together = ('from_user', 'to_user')

# class Match(models.Model):
# 	user = models.ForeignKey(AppUser, on_delete=models.CASCADE)
# 	opponent = models.ForeignKey(AppUser)
# 	user_score = models.IntegerField(null=True)
# 	opponent_score = models.IntegerField(null=True)
	