from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import AppUser, Friend, Match
from django.utils.html import format_html

class AppUserAdmin(UserAdmin):
	model = AppUser
	list_display = ['username', 'email', 'id', 'nickname', 'online', 'avatar', 'display_avatar', 'api42auth']
	fieldsets = UserAdmin.fieldsets + (
		(None, {'fields': ('nickname', 'online', 'avatar')}),
	)
	add_fieldsets = UserAdmin.add_fieldsets + (
		(None, {'fields': ('nickname', 'online', 'avatar')}),
	)

	def display_avatar(self, obj):
		if obj.avatar:
			return format_html('<img src="{}" style="width: 45px; height:45px;" />', obj.avatar.url)
		else:
			return "No avatar"
		display_avatar.short_description = 'Avatar'


class FriendAdmin(admin.ModelAdmin):
    list_display = ('to_user', 'from_user', 'id', 'status')

class MatchAdmin(admin.ModelAdmin):
    list_display = ('user', 'opponent', 'id', 'user_score', 'opponent_score', 'date')

admin.site.register(Friend, FriendAdmin)
admin.site.register(AppUser, AppUserAdmin)
admin.site.register(Match, MatchAdmin)
