from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from user.models import AppUser
from asgiref.sync import sync_to_async
import json
class NotificationsConsumer(AsyncJsonWebsocketConsumer):
	async def connect(self):
		self.user = self.scope.get("user")
		self.group_name = f"{self.user.username}-notifications"
		await self.accept()

		if self.user is None or not self.user.is_authenticated:
			await self.send_error(401, "User is not authenticated.")
			await self.close()
			return
		try:
			await self.channel_layer.group_add(self.group_name, self.channel_name)
		except Exception as e:
			await self.channel_layer.group_discard(self.group_name, self.channel_name)
			await self.send_error(500, f"Failed to connect: {str(e)}")
			await self.close()

	async def disconnect(self, close_code):
		try:
			await self.channel_layer.group_discard(self.group_name, self.channel_name)
		except Exception as e:
			await self.send_error(500, f"Failed to discard user from group: {str(e)}")

	async def receive(self, text_data):
		try:
			content_data = json.loads(text_data)
			print(f"a message for {content_data['to_user']} just arrived") # ?? DEBUG
		except Exception as e:
			await self.send_error(500, f"Failed to receive message from user {self.user.username}: {str(e)}")
		
	async def send_error(self, code, message):
		await self.send_json(
			{
				"error": True,
				"errorCode": code,
				"errorMessage": message,
			}
		)
