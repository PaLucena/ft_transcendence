from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import UserStats
from django.utils.html import format_html

class UserStatsAdmin(admin.ModelAdmin):
	list_display = ('user', 'games_played', 'games_played', 'games_lost')

admin.site.register(UserStats, UserStatsAdmin)