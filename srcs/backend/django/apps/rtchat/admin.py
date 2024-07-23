from django.contrib import admin
from rtchat.models import ChatGroup, GroupMessage, Block

admin.site.register(ChatGroup)
admin.site.register(GroupMessage)
admin.site.register(Block)
