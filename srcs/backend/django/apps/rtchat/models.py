from tkinter import CASCADE
from django.db import models
from user.models import AppUser
import shortuuid
from django.db.models.signals import pre_save
from django.dispatch import receiver
from channels.db import database_sync_to_async


class ChatGroup(models.Model):
    group_name = models.CharField(max_length=128, unique=True, blank=True)
    users_online = models.ManyToManyField(
        AppUser, related_name="online_in_groups", blank=True
    )
    members = models.ManyToManyField(AppUser, related_name="chat_group", blank=True)
    is_private = models.BooleanField(default=False)

    def __str__(self):
        return self.group_name


class GroupMessage(models.Model):
    group = models.ForeignKey(
        ChatGroup, related_name="chat_messages", on_delete=models.CASCADE
    )
    author = models.ForeignKey(AppUser, on_delete=models.CASCADE)
    body = models.CharField(max_length=300)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.author.username} : {self.body}"

    class Meta:
        ordering = ["-created"]


class Block(models.Model):
    blocker = models.ForeignKey(
        AppUser, related_name="blocker", on_delete=models.CASCADE
    )
    blocked = models.ForeignKey(
        AppUser, related_name="blocked", on_delete=models.CASCADE
    )
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("blocker", "blocked")

    def __str__(self):
        return f"{self.blocker} blocked {self.blocked}"

    @staticmethod
    @database_sync_to_async
    def is_blocked(blocker, blocked):
        return Block.objects.filter(blocker=blocker, blocked=blocked).exists()


@receiver(pre_save, sender=ChatGroup)
def set_group_name(sender, instance, **kwargs):
    if not instance.group_name:
        instance.group_name = shortuuid.uuid()
