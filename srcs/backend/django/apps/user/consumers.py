from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils.timezone import now
from asgiref.sync import sync_to_async
import json

class UserStatus(AsyncWebsocketConsumer):
	async def connect(self):
		user = self.scope['user']
		print("User:", self.scope['user'])
		#if user.is_authenticated and user.is_active:
		await self.channel_layer.group_add("online_users", self.channel_name)
		await self.accept()
		await self.update_user_status(user, "online")
		
	async def disconnect(self, close_code) -> None:
		user = self.scope['user']
		if user.is_authenticated:
			await self.channel_layer.group_discard("online_users", self.channel_name)
			await self.update_user_status(user, "offline")
	
	async def update_user_status(self, user, status):
		def sync_update_user_status():
			user.online = status
			#user.last_seen = now()
			user.save()
			print(f"Update status of {user.username} to {status}")

		await sync_to_async(sync_update_user_status)()