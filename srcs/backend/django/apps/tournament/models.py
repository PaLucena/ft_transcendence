from django.db import models
from django.forms import CharField
from user.models import AppUser
from django.utils import timezone
from datetime import timedelta

class Tournament(models.Model):
	PUBLIC = 'public'
	PRIVATE = 'private'
	TOURNAMENT_TYPES = [
		(PUBLIC, 'Public'),
		(PRIVATE, 'Private'),
	]

	name = models.CharField(max_length=100, blank=False)
	creator = models.ForeignKey(AppUser, on_delete=models.SET_NULL, blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)
	participants = models.ManyToManyField(AppUser, related_name='participants') #if deleting, needs to marked as "deleted user"
	type = models.CharField(max_length=10, choices=TOURNAMENT_TYPES, default=PUBLIC)
	invitation_code = models.CharField(max_length=10, null=True, blank=True)
	is_active = models.BooleanField(default=False)
	#invitation_time_out =  models.DateTimeField(default=lambda: timezone.now() + timedelta(minutes=10))
	#pending_invitations = models.ManyToManyField(AppUser, related_name='pending', default=list)


class Match(models.Model):
	player_1 = models.ForeignKey(AppUser, related_name='player_1', on_delete=models.SET_NULL, null=True, blank=True)
	player_2 = models.ForeignKey(AppUser, related_name='player_2', on_delete=models.SET_NULL, null=True, blank=True)
	player_1_score = models.IntegerField(null=True)
	player_2_score = models.IntegerField(null=True)
	winner =  models.ForeignKey(AppUser, related_name='winner', on_delete=models.SET_NULL, null=True, blank=True)