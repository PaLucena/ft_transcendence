from django.contrib import admin
from rtchat.models import ChatGroup, GroupMessage, Block, Invite

class InviteAdmin(admin.ModelAdmin):
    list_display = ("sender", "receiver", "is_accepted", "is_cancelled")

admin.site.register(ChatGroup)
admin.site.register(GroupMessage)
admin.site.register(Block)
admin.site.register(Invite, InviteAdmin)

