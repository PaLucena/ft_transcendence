# from django.db import models
# from user.models import AppUser
# from django.utils import timezone

# class UserStats(models.Model):
# 	user = models.OneToOneField(AppUser, on_delete=models.CASCADE, related_name='stats')
# 	games_played = models.PositiveIntegerField(default=0)
# 	games_won = models.PositiveIntegerField(default=0)
# 	games_lost = models.PositiveIntegerField(default=0)
# 	winning_streak = models.PositiveIntegerField(default=0)
# 	losing_streak = models.PositiveIntegerField(default=0)
# 	highest_score = models.PositiveIntegerField(default=0)
# 	average_score = models.FloatField(default=0.0)
# 	win_rate = models.FloatField(default=0.0)
# 	last_game_date = models.DateTimeField(null=True, blank=True)


# 	def update_stats(self, won, score):
# 		if won:
# 			self.winning_streak += 1
# 			self.games_won += 1
# 			self.losing_streak = 0
# 		else:
# 			self.losing_streak += 1
# 			self.games_lost += 1
# 			self.winning_streak = 0
# 		self.games_played += 1
# 		self.average_score = (score + self.average_score * (self.games_played - 1)) / self.games_played
# 		self.win_rate = (self.games_won / self.games_played) * 100
# 		self.last_game_date = timezone.now()
# 		self.save()