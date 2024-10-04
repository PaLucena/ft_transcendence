import json

from channels.generic.websocket import AsyncWebsocketConsumer

from .handlers import (
    send_main_room,
    send_tournament_room,
    handle_create_tournament,
    handle_join_tournament,
    handle_leave_tournament,
    handle_start_tournament,
    handle_clean_tournaments,
)


class TournamentConsumer(AsyncWebsocketConsumer):
    def __init__(self):
        super().__init__()
        self.user = None
        self.user_name = None
        self.user_id = None
        self.main_room = "main_room"
        self.tournament_room = None

    async def connect(self):
        self.user = self.scope["user"]
        self.user_name = self.user.username
        self.user_id = self.user.id

        await self.channel_layer.group_add(self.main_room, self.channel_name)

        await self.accept()
        await send_main_room(self.channel_layer)
        if self.tournament_room:
            await send_tournament_room(self.channel_layer, self.tournament_room)

    async def disconnect(self, close_code):
        if self.tournament_room:
            await self.remove_from_tournament_group()

        await self.channel_layer.group_discard(self.main_room, self.channel_name)
        print(f"User {self.user_name} disconnected.")  # DEBUG

    async def receive(self, text_data=None, bytes_data=None):
        message = json.loads(text_data)

        if message["type"] == "create_tournament":
            await handle_create_tournament(self, message)

        elif message["type"] == "join_tournament":
            await handle_join_tournament(self, message)

        elif message["type"] == "join_tournament_room":
            await handle_join_tournament(self, message)

        elif message["type"] == "leave_tournament":
            await handle_leave_tournament(self, message)

        elif message["type"] == "start_tournament":
            await handle_start_tournament(self, message)

        elif message["type"] == "required_update":
            await send_main_room(self.channel_layer)

        elif message["type"] == "clean_tournaments":
            await handle_clean_tournaments(self.channel_layer)

    async def send_error(self, message):
        await self.send(text_data=json.dumps({"type": "error", "message": message}))

    async def main_room_update(self, event):
        public_tournaments = event["public_tournaments"]
        private_tournaments = event["private_tournaments"]
        await self.send(
            text_data=json.dumps(
                {
                    "type": "main_room_update",
                    "public_tournaments": public_tournaments,
                    "private_tournaments": private_tournaments,
                    "player_id": self.user_id,
                }
            )
        )

    async def tournament_room_update(self, event):
        participants = event["participants"]
        state = event["state"]
        await self.send(
            text_data=json.dumps(
                {
                    "type": "tournament_room_update",
                    "participants": participants,
                    "participants_data": event["participants_data"],
                    "state": state,
                    "tournament_id": event["tournament_id"],
                }
            )
        )

    async def send_successfully_joined(self, tournament_id):
        await self.send(
            text_data=json.dumps(
                {"type": "successfully_joined", "tournament_id": tournament_id}
            )
        )

    async def notify_match_start(self, event):
        match_id = event["match_id"]
        message = event["message"]

        await self.send(
            text_data=json.dumps(
                {"type": "match_start", "match_id": match_id, "message": message}
            )
        )

    async def notify_end_tournament(self, event):
        tournament_id = event["tournament_id"]
        results = event["results"]

        await self.send(
            text_data=json.dumps(
                {
                    "type": "tournament_ended",
                    "tournament_id": tournament_id,
                    "results": results,
                }
            )
        )

    async def notify_cancel_tournament(self, event):
        tournament_id = event["tournament_id"]
        await self.send(
            text_data=json.dumps(
                {"type": "tournament_cancelled", "tournament_id": tournament_id}
            )
        )

    async def add_to_tournament_group(self, tournament_room):
        if not self.tournament_room:
            self.tournament_room = tournament_room
            await self.channel_layer.group_add(self.tournament_room, self.channel_name)
            print("User ", self.user_name, " added to ", self.tournament_room)
            await send_tournament_room(self.channel_layer, self.tournament_room)

        else:
            print("User ", self.user_name, " already in a tournament.")

    async def remove_from_tournament_group(self):
        if self.tournament_room:
            await self.channel_layer.group_discard(
                self.tournament_room, self.channel_name
            )
            print(
                "User ", self.user_name, " removed from ", self.tournament_room
            )  # DEBUG
            self.tournament_room = None
        else:
            print("User ", self.user_name, " not in any tournament.")

    async def close_tournament_group(self):
        if self.tournament_room:
            await self.channel_layer.group_discard(
                self.tournament_room, self.channel_name
            )
            print("User ", self.user_name, " closed ", self.tournament_room)
