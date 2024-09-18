from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.core.exceptions import ObjectDoesNotExist
from tournament.models import Tournament
from channels.db import database_sync_to_async

class TournamentConsumer(AsyncJsonWebsocketConsumer):
	async def connect(self):
		self.tournament_name = self.scope['url_route']['kwargs']['tournament_name']
		self.tournamentroom_name = f'tournament_{self.tournament_name}'

		try:
			await self.accept()
			await self.channel_layer.group_add(self.tournamentroom_name, self.channel_name)
			await self.send_tournament_users_list(self.tournament_name)
			print("CONNECTED")
		
		except Exception as e:
			await self.channel_layer.group_discard(self.tournamentroom_name, self.channel_name)
			await self.send_error(500, f"Failed to connect: {str(e)}")
			await self.close()


	async def disconnect(self, close_code):
		try:
			await self.channel_layer.group_discard(
				self.tournamentroom_name,
				self.channel_name
			)
			await self.send_tournament_users_list(self.tournament_name)
			print("DISCONNECTED")
			
		except Exception as e:
			await self.send_error(500, f"Failed to discard from group: {str(e)}")

	async def send_tournament_users_list(self, tournament_name):
		try:
			tournament_users = await self.get_tournament_users(tournament_name)
			
			if tournament_users is None:
				await self.send_error(404, f"Tournament '{tournament_name}' not found")
				return
			
			event = {
				"type": "update_tournament_users_list",
				"tournament_users": tournament_users,
			}
			await self.channel_layer.group_send(self.tournamentroom_name, event)
		except Exception as e:
			await self.send_error(500, f"Failed to send tournament users list: {str(e)}")


	async def update_tournament_users_list(self, event):
		try:
			await self.send_json({"tournament_users": event["tournament_users"]})
		except Exception as e:
			await self.send_error(500, f"Failed to update tournament users list: {str(e)}")


	@database_sync_to_async
	def get_tournament_users(self, tournament_name):
		try:
			tournament = Tournament.objects.get(name=tournament_name)
			participants = tournament.participants.all()
			return list(participants.values_list("nickname", "avatar"))

		except ObjectDoesNotExist:
			return None

	async def send_error(self, code, message):
		await self.send_json(
			{
				"error": True,
				"errorCode": code,
				"errorMessage": message,
			}
		)
