from django.contrib import admin
from .models import Tournament, Match

class MatchAdmin(admin.ModelAdmin):
	model = Match
	extra = 1  # How many empty forms to display by default in the admin
	list_display= ('match_id', 'player1', 'player2', 'winner', 'loser', 'controls_mode')


class TourunamentAdmin(admin.ModelAdmin):
	list_display = ('id', 'name', 'type', 'creator', 'created_at', 'get_participants', 'invitation_code', 'is_active')

	def get_participants(self, obj):
		return ", ".join([f"{p.id} - {(p.username)} " for p in obj.participants.all()])

	get_participants.short_description = 'Participants'

admin.site.register(Tournament, TourunamentAdmin)
admin.site.register(Match, MatchAdmin)