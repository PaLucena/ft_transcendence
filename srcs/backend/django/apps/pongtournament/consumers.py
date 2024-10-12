import asyncio
import json

from channels.generic.websocket import AsyncWebsocketConsumer

from .handlers import (
    handle_send_tournaments_list,
    handle_send_tournament_data,
    handle_start_single_match,
    handle_create_tournament,
    handle_join_tournament,
    handle_back_to_game,
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
        self.user_room = None
        self.main_room = "main_room"
        self.tournament_room = None


    async def connect(self):
        self.user = self.scope["user"]
        self.user_id = self.user.id
        self.user_room = f"user_{self.user_id}"
        self.user_name = self.user.username

        await self.channel_layer.group_add(self.main_room, self.channel_name)
        await self.channel_layer.group_add(self.user_room, self.channel_name)

        await self.accept()
        await handle_send_tournaments_list(self.channel_layer)
        if self.tournament_room:
            await handle_send_tournament_data(self.channel_layer, self.tournament_room)


    async def disconnect(self, close_code):
        if self.tournament_room:
            await self.remove_from_tournament_group()

        await self.channel_layer.group_discard(self.main_room, self.channel_name)


    async def receive(self, text_data=None, bytes_data=None):
        message = json.loads(text_data)

        if message["type"] == "start_single_match":
            await handle_start_single_match(self, message)

        elif message["type"] == "create_tournament":
            await handle_create_tournament(self, message)

        elif message["type"] == "join_tournament":
            await handle_join_tournament(self, message)

        elif message["type"] == "join_tournament_room":
            await handle_join_tournament(self, message)

        elif message["type"] == "leave_tournament":
            await handle_leave_tournament(self, message)

        elif message["type"] == "start_tournament":
            asyncio.create_task(handle_start_tournament(self, message))

        elif message["type"] == "back_to_game":
            await handle_back_to_game(self)

        elif message["type"] == "required_update":
            await handle_send_tournaments_list(self.channel_layer)

        elif message["type"] == "clean_tournaments":
            await handle_clean_tournaments(self.channel_layer)


    async def send_error(self, message):
        await self.send(text_data=json.dumps({"type": "error", "message": message}))


    async def send_tournaments_list(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "tournaments_list",
                    "player_id": self.user_id,
                    "t_public": event["public_tournaments"],
                    "t_private": event["private_tournaments"],
                }
            )
        )


    async def send_tournament_data(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "tournament_data",
                    "user_id": self.user_id,
                    "tournament_id": event["tournament_id"],
                    "tournament_name": event["tournament_name"],
                    "current_phase": event["current_phase"],
                    "participants": event["participants"],
                    "participants_data": event["participants_data"],
                    "players": event["players"],
                }
            )
        )


    async def send_successfully_joined(self, tournament_id):
        await self.send(
            text_data=json.dumps(
                {"type": "successfully_joined", "tournament_id": tournament_id}
            )
        )


    async def send_start_match(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "start_match",
                    "sub_type": event["sub_type"],
                    "tournament_id": event["tournament_id"],
                }
            )
        )


    async def send_closed_tournament(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "closed_tournament",
                }
            )
        )


    async def send_deleted_tournament(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "deleted_tournament",
                    "tournament_id": event["tournament_id"],
                    "tournament_name": event["tournament_name"],
                }
            )
        )
        self.tournament_room = None


    async def send_end_tournament(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "end_tournament",
                    "tournament_id": event["tournament_id"],
                    "tournament_name": event["tournament_name"],
                    "winner": event["winner"],
                }
            )
        )


    async def send_leave_tournament(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "leave_tournament",
                    "tournament_id": event["tournament_id"],
                    "tournament_name": event["tournament_name"],
                }
            )
        )


    async def send_reload_play(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "reload_play",
                }
            )
        )


    async def send_eliminated_players(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "eliminated_players",
                    "tournament_name": event["tournament_name"],
                }
            )
        )


    async def add_to_tournament_group(self, tournament_room):
        if not self.tournament_room:
            self.tournament_room = tournament_room
            await self.channel_layer.group_add(self.tournament_room, self.channel_name)
            await handle_send_tournament_data(self.channel_layer, self.tournament_room)

        else:
            print("User ", self.user_name, " already in a tournament.")


    async def remove_from_tournament_group(self, tournament_room=None):
        if tournament_room:
            await self.channel_layer.group_discard(tournament_room, self.channel_name)
            self.tournament_room = None
        else:
            print("User ", self.user_name, " not in any tournament.")

