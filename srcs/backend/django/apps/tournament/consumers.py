from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.core.exceptions import ObjectDoesNotExist
from tournament.models import Tournament
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async, async_to_sync
from .match_logic import format_match, assign_next_match
import asyncio
from ponggame.game_manager import game_manager


class TournamentConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.tournament_name = self.scope["url_route"]["kwargs"]["tournament_name"]
        self.tournamentroom_name = f"tournament_{self.tournament_name}"
        self.userroom_name = f"channel_{self.scope.get('user')}"

        try:
            await self.accept()
            await self.channel_layer.group_add(
                self.tournamentroom_name, self.channel_name
            )
            await self.channel_layer.group_add(
                self.userroom_name, self.channel_name
            )
            await self.send_tournament_users_list(self.tournament_name)

        except Exception as e:
            await self.channel_layer.group_discard(
                self.tournamentroom_name, self.channel_name
            )
            await self.send_error(500, f"Failed to connect: {str(e)}")
            await self.close()

    async def disconnect(self, close_code):
        try:
            await self.channel_layer.group_discard(
                self.tournamentroom_name, self.channel_name
            )
            await self.send_tournament_users_list(self.tournament_name)

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
            await self.send_error(
                500, f"Failed to send tournament users list: {str(e)}"
            )

    async def update_tournament_users_list(self, event):
        try:
            await self.send_json({"tournament_users": event["tournament_users"]})
        except Exception as e:
            await self.send_error(
                500, f"Failed to update tournament users list: {str(e)}"
            )

    @database_sync_to_async
    def get_tournament_users(self, tournament_name):
        try:
            tournament = Tournament.objects.get(name=tournament_name)
            participants = tournament.participants.all()
            return [
                {
                    "nickname": participant.nickname,
                    "avatar": participant.avatar.url if participant.avatar else None,
                }
                for participant in participants
            ]
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

    @staticmethod
    async def send_goto_game(userId1_room, userId2_room):
        event = {
            "type": "goto_game",
            "goto_game": True,
        }
        await self.channel_layer.group_send(userId1_room, event)
        await self.channel_layer.group_send(userId2_room, event)


    async def goto_game(self):
        await self.send_json(
            {
                "goto_game": True,
            }
        )


    #a method to start all matches when triggered
    async def start_matches(self, event):
        print("AAAAAAAAAAAAAAAAAAWEFAWEFAWFAWFA")
        tournament_id = event["tournament_id"]
        matches = event["matches"]
        print("4 FIRST MATCHES RECEIVED: ", matches, flush=True)
        tournament = await sync_to_async(Tournament.objects.get)(pk=tournament_id)
        results = await self.start_all_matches(tournament, matches)

        await self.send_json({
            "message": f"All matches for tournament {tournament_id} finished",
            "results": results
        })

    async def start_all_matches(self, tournament, matches):
        results = []
        match_tasks = [
            game_manager.start_match(
                match['tournament_id'],
                match['match_id'],
                match['player_1_id'],
                match['player_2_id'],
                match['controls_mode']
            )
            for match in matches
        ]

        for task in asyncio.as_completed(match_tasks):
            result = await task
            match_id = result['match_id']
            results.append(result)

            next_matches = await sync_to_async(assign_next_match, thread_sensitive=False)(
                tournament, match_id, result
            )

            while next_matches:
                formatted_next_matches = [format_match(m) for m in next_matches]
                new_results = await self.start_all_matches(tournament, formatted_next_matches)
                results.extend(new_results)
                next_matches = []
                for new_result in new_results:
                    next_matches.extend(
                        await sync_to_async(assign_next_match, thread_sensitive=False)(
                            tournament, new_result['match_id'], result
                        )
                    )

        return results
