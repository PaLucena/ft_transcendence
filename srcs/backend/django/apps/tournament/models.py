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
	player_ids = models.JSONField(default=list)
	#invitation_time_out =  models.DateTimeField(default=lambda: timezone.now() + timedelta(minutes=10))
	#pending_invitations = models.ManyToManyField(AppUser, related_name='pending', default=list)


class Match(models.Model):
	tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, null=True)
	match_id = models.IntegerField(null=True)
	player1 = models.IntegerField(null=True)
	player2 = models.IntegerField(null=True)
	winner = models.IntegerField(null=True)
	loser = models.IntegerField(null=True)
	can_create_match = models.BooleanField(default=True)

	class Meta:
		unique_together = ('tournament', 'match_id')