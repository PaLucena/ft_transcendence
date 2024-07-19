from django.db import models
from ..user.models import AppUser

class UserStats(models.Model):
    user = models.OneToOneField(AppUser, on_delete=models.CASCADE, related_name='stats')
    games_played = models.PositiveIntegerField(default=0)
    games_played = models.PositiveIntegerField(default=0)
    games_lost = models.PositiveIntegerField(default=0)
    winning_streak = models.PositiveIntegerField(default=0)
    losing_streak = models.PositiveIntegerField(default=0)
    highest_score = models.PositiveIntegerField(default=0)
    #average_score = models.FloatField(default=0.0)
    #win_rate = models.FloatField(default=0.0)
    #last_game_date = models.DateTimeField(null=True, blank=True)
    #achievements = models.TextField(null=True, blank=True)