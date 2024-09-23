from django.contrib import admin
from rtchat.models import ChatGroup, GroupMessage, Block, InviteRoom, InviteUser


class InviteUserInline(admin.TabularInline):
    model = InviteUser
    extra = 0


class InviteRoomAdmin(admin.ModelAdmin):
    list_display = (
        "group_name",
        "created_at",
        "expires_at",
        "is_accepted",
        "is_cancelled",
        "author",
    )
    search_fields = ("group_name",)
    inlines = [InviteUserInline]
    list_filter = ("is_accepted", "is_cancelled")


class InviteUserAdmin(admin.ModelAdmin):
    list_display = ("invite_room", "user", "status")
    list_filter = ("status",)
    search_fields = ("invite_room__group_name", "user__username")


admin.site.register(ChatGroup)
admin.site.register(GroupMessage)
admin.site.register(Block)
admin.site.register(InviteRoom, InviteRoomAdmin)
admin.site.register(InviteUser, InviteUserAdmin)
