from django.contrib import admin
from .models import Tournament

class TourunamentAdmin(admin.ModelAdmin):
	list_display = ('id', 'name', 'type', 'creator', 'created_at', 'get_participants', 'invitation_code', 'is_active')

	def get_participants(self, obj):
		return ", ".join([f"{p.id} - {p.nickname} {(p.username)} " for p in obj.participants.all()])

	get_participants.short_description = 'Participants'

admin.site.register(Tournament, TourunamentAdmin)