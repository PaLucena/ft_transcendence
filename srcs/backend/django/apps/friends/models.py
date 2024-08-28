from django.db import models
from user.models import AppUser


class Friend(models.Model):
    PENDING = 0
    ACCEPTED = 1

    from_user = models.ForeignKey(
        AppUser, on_delete=models.CASCADE, related_name="friendship_creator", null=True
    )
    to_user = models.ForeignKey(
        AppUser, on_delete=models.CASCADE, related_name="friendship_receiver", null=True
    )
    status = models.IntegerField(default=PENDING)

    class Meta:
        unique_together = ("from_user", "to_user")
