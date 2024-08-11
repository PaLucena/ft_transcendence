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
	participants = models.ManyToManyField(AppUser, related_name='participants', default=list) #if deleting, needs to marked as "deleted user"
	invitation_time_out =  models.DateTimeField(default=lambda: timezone.now() + timedelta(minutes=10))
	type = models.CharField(max_length=10, choices=TOURNAMENT_TYPES, default=PUBLIC)
	invitation_code = models.CharField(max_length=10, null=True, blank=True)
	is_active = models.BooleanField(default=False)
	#pending_invitations = models.ManyToManyField(AppUser, related_name='pending', default=list)