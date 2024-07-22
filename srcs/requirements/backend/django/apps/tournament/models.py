from django.db import models
from ..user.models import AppUser
from django.utils import timezone
from datetime import timedelta

class Tournament(models.Model):
	name = models.CharField(max_length=100, blank=False)
	created_at = models.DateTimeField(auto_now_add=True)
	creator = models.ForeignKey(AppUser, on_delete=models.CASCADE)
	participants = models.ManyToManyField(AppUser, related_name='participants') #if deleting, needs to marked as "deleted user"
	invitation_time_out =  models.DateTimeField(default=lambda: timezone.now() + timedelta(minutes=10))
	is_active = models.BooleanField(default=False)
