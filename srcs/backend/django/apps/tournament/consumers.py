from channels.generic.websocket import AsyncWebsocketConsumer

class TournamentConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.tournament_name = self.scope['url_route']['kwargs']['tournament_name']
		self.tournamentroom_name = f'tournament_{self.tournament_name}'
		print("self.tournament_name", self.tournament_name)
		try:
			await self.accept()

			await self.channel_layer.group_add(
				self.tournamentroom_name,
				self.channel_name
			)
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
			print("DISCONNECTED")
			
		except Exception as e:
			await self.send_error(500, f"Failed to discard from group: {str(e)}")
