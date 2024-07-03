from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import AppUser

class AppUserAdmin(UserAdmin):
	model = AppUser
	list_display = ['username', 'email', 'id', 'nickname', 'online']
	fieldsets = UserAdmin.fieldsets + (
		(None, {'fields': ('nickname', 'online')}),
	)
	add_fieldsets = UserAdmin.add_fieldsets + (
		(None, {'fields': ('nickname', 'online')}),
	)

admin.site.register(AppUser, AppUserAdmin)