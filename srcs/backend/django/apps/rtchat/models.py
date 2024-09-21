from tkinter import CASCADE
from django.db import models
from user.models import AppUser
import shortuuid
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone


class ChatGroup(models.Model):
    group_name = models.CharField(max_length=128, unique=True, blank=True)
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


class InviteRoom(models.Model):
    group_name = models.CharField(max_length=128, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_accepted = models.BooleanField(default=False)
    is_cancelled = models.BooleanField(default=False)

    def has_expired(self):
        return timezone.now() > self.expires_at

    def start_game(self):
        if self.is_accepted and not self.has_expired():
            pass

    def cancel_invite(self):
        self.is_cancelled = True
        self.save()

    def accept_invite(self):
        self.is_accepted = True
        self.save()

    def __str__(self):
        return self.group_name


class InviteUser(models.Model):
    STATUS_CHOICES = [
        (0, "Waiting"),
        (1, "Accepted"),
        (-1, "Rejected"),
    ]

    invite_room = models.ForeignKey(
        InviteRoom, related_name="invite_users", on_delete=models.CASCADE
    )
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE)
    status = models.IntegerField(choices=STATUS_CHOICES, default=0)

    def accept_invite(self):
        if not self.invite_room.has_expired():
            self.status = 1
            self.save()

    def reject_invite(self):
        self.status = -1
        self.save()

    def __str__(self):
        return f"{self.user.username} - {self.get_status_display()}"

    class Meta:
        unique_together = ("invite_room", "user")


def generate_group_name(instance):
    if not instance.group_name:
        instance.group_name = shortuuid.uuid()


@receiver(pre_save, sender=InviteRoom)
def set_group_name_for_invite(sender, instance, **kwargs):
    generate_group_name(instance)


@receiver(pre_save, sender=ChatGroup)
def set_group_name_for_chatgroup(sender, instance, **kwargs):
    generate_group_name(instance)
