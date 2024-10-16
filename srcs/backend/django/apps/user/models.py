from tkinter import CASCADE
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.crypto import get_random_string

class AppUser(AbstractUser):
    avatar = models.FileField(upload_to="avatars/", default="default/default.jpg", null=True, blank=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    is_online = models.BooleanField(default=False)
    image_link = models.URLField(null=True, blank=True)
    id_deleted = models.BooleanField(default=False)
    created = models.DateTimeField(auto_now_add=True, auto_now=False)
    api42auth = models.BooleanField(default=False)
    language = models.CharField(
            max_length=20,
            choices=[('EN', 'English'), ('ES', 'Spanish'), ('LV', 'Latvian')],
            default='EN'
        )

    def anonymize(self):
        unique_suffix = get_random_string(length=6)
        self.email = f"deleted_user_{self.id}@example.com"
        self.set_unusable_password()
        self.username = f"deleted_user_{self.id}"
        self.avatar = None
        self.last_seen = None
        self.is_online = False
        self.image_link = None
        self.games_played = 0
        self.games_won = 0
        self.games_lost = 0
        self.save()

    def __str__(self):
        return self.username


class Match(models.Model):
    user = models.ForeignKey(
        AppUser, on_delete=models.CASCADE, related_name="match_as_user", null=True
    )
    opponent = models.ForeignKey(
        AppUser, on_delete=models.CASCADE, related_name="match_as_opponent", null=True
    )
    user_score = models.IntegerField(null=True)
    opponent_score = models.IntegerField(null=True)
    date = models.DateTimeField(auto_now_add=True, auto_now=False)
