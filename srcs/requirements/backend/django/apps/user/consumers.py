from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils.timezone import now
from asgiref.sync import sync_to_async
import json

class UserStatus(AsyncWebsocketConsumer):
	async def connect(self):
		user = self.scope['user']
		if self.user.is_authenticated and self.user.is_active:
			await self.channel_layer.group_add("online_user", self.channel_name)
			await self.accept()
			await self.update_user_status(user, "online")
			self.send(text_data=json.dumps({
				'type':'connected',
				'message':'hello'
			}))
	def receive(self, text_data):
		

	async def disconnect(self) -> None:
		user = self.scope['user']
		if self.user.is_authenticated:
			await self.channel_layer.group_discard("online_users", self.channel_name)
			await self.update_user_status(user, "offline")
	
	async def update_user_status(self, user, status):
		def sync_update_user_status():
			user.online = status
			#user.last_seen = now()
			user.save()
			print(f"Update status of {self.user.username} to {status}")

		await sync_to_async(sync_update_user_status)()