from django.contrib import admin
from friends.models import Friend


class FriendAdmin(admin.ModelAdmin):
    list_display = ("to_user", "from_user", "id", "status")


admin.site.register(Friend, FriendAdmin)
