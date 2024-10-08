import asyncio
import time

from blockchain.views import record_match
from ponggame.game_manager import game_manager
from .tournament_manager import TournamentManager, match_to_uint


async def send_main_room(channel_layer):
    manager = TournamentManager()
    public_tournaments = manager.get_tournaments_by_privacy(is_private=False)
    private_tournaments = manager.get_tournaments_by_privacy(is_private=True)
    await channel_layer.group_send(
        "main_room",
        {
            "type": "main_room_update",
            "public_tournaments": public_tournaments,
            "private_tournaments": private_tournaments,
        },
    )


async def send_tournament_room(channel_layer, tournament_room):
    manager = TournamentManager()
    tournament_data = manager.get_tournament_data(tournament_room)
    current_phase = tournament_data["current_phase"]
    participants = tournament_data["participants"]
    participants_data = tournament_data["participants_data"]
    players = tournament_data["players"]
    tournament_name = tournament_data["name"]

    await channel_layer.group_send(
        tournament_room,
        {
            "type": "tournament_room_update",
            "participants": participants,
            "participants_data": participants_data,
            "players": players,
            "current_phase": current_phase,
            "tournament_id": tournament_room,
            "tournament_name": tournament_name,
        },
    )


async def send_left_tournament(channel_layer, tournament_id, tournament_name, channel_name):
    await channel_layer.send(
        channel_name, {
            "type": "notify_left_tournament",
            "tournament_id": tournament_id,
            "tournament_name": tournament_name
        }
    )


async def send_deleted_tournament(channel_layer, tournament_id, tournament_name):
    await channel_layer.group_send(
        tournament_id, {
            "type": "notify_deleted_tournament",
            "tournament_id": tournament_id,
            "tournament_name": tournament_name
        }
    )


async def send_end_tournament(channel_layer, tournament_id, tournament_name, winner):
    await channel_layer.group_send(
        tournament_id, {
            "type": "notify_end_tournament",
            "tournament_id": tournament_id,
            "tournament_name": tournament_name,
            "winner": winner,
        },
    )


async def send_start_match(consumer, tournament_id):
    await consumer.channel_layer.group_send(
        tournament_id, {
            "type": "send_start_match",
            "tournament_id": tournament_id,
        }
    )


async def handle_start_single_match(consumer, message):
    try:
        user = consumer.user
        tournament_id = 0
        player_1_id = user.id
        player_2_id = 0
        controls_mode = message["controls_mode"]

        if game_manager.get_game_room_by_player(player_1_id) is not None:
            raise ValueError("User already has an active match.")

        if TournamentManager().get_player_active_tournament(player_1_id) is not None:
            raise ValueError("User already has an active tournament.")

        timestamp = int(time.time())
        formated_time = time.strftime("%y%m%d%H%M%S", time.localtime(timestamp))
        match_id = f"{formated_time}{user.id}"

        if player_2_id is None or controls_mode is None:
            raise ValueError("Missing required fields: player_2_id or controls_mode")

        result = await game_manager.start_match(
            tournament_id=tournament_id,
            match_id=match_id,
            player_1_id=player_1_id,
            player_2_id=player_2_id,
            controls_mode=controls_mode,
        )

        data = match_to_uint(result)
        record_match(data)

    except Exception as e:
        await consumer.send_error(str(e))


async def handle_create_tournament(consumer, message):
    manager = TournamentManager()

    try:
        creator = consumer.user_id
        name = message["name"]
        is_private = message["is_private"]
        password = message["password"]

        print("Password (handle_create_tournament): ", password)
        new = manager.create_tournament(consumer, creator, name, is_private, password)
        if new is not None:
            await consumer.add_to_tournament_group(f"{new.id}")
            await send_main_room(consumer.channel_layer)

        else:
            await consumer.send_error("User already has an active tournament.")

    except Exception as e:
        await consumer.send_error(str(e))


async def handle_join_tournament(consumer, message):
    manager = TournamentManager()
    tournament_id = message["tournament_id"]
    tournament_room = f"{tournament_id}"
    tournament = manager.get_tournament_data(tournament_id)

    if message["type"] == "join_tournament_room":
        try:
            await consumer.send_successfully_joined(tournament_id)
            await send_tournament_room(consumer.channel_layer, tournament_room)
        except Exception as e:
            await consumer.send_error(str(e))
    else:
        password = message["password"]

        try:
            if manager.join_tournament(consumer, tournament_id, password):
                await consumer.channel_layer.group_add(
                    tournament_room, consumer.channel_name
                )
                await send_main_room(consumer.channel_layer)
                await consumer.send_successfully_joined(tournament_id)
                await send_tournament_room(consumer.channel_layer, tournament_room)
            else:
                await consumer.send_error("Failed to join tournament.")
        except Exception as e:
            await consumer.send_error(str(e))


async def handle_leave_tournament(consumer, message):
    manager = TournamentManager()
    tournament_id = message["tournament_id"]
    tournament = manager.get_tournament_data(tournament_id)
    tournament_room = f"{tournament_id}"
    tournament_name = tournament["name"]

    try:
        if consumer.user_id == tournament["creator"]:
            await send_deleted_tournament(consumer.channel_layer, tournament_id, tournament_name)
            manager.delete_tournament(tournament_id)
        elif manager.leave_tournament(tournament_id, consumer.user_id):
            await send_left_tournament(consumer.channel_layer, tournament_id, tournament_name, consumer.channel_name)
            await consumer.remove_from_tournament_group(tournament_id)
            await send_tournament_room(consumer.channel_layer, tournament_room)
        else:
            raise Exception("Failed to leave tournament.")
        await send_main_room(consumer.channel_layer)
    except Exception as e:
        await consumer.send_error(str(e))


async def handle_start_tournament(consumer, message):
    manager = TournamentManager()
    tournament_id = message["tournament_id"]
    sleep_time = 5

    try:
        await manager.start_tournament(tournament_id, consumer.user_id)
        await send_tournament_room(consumer.channel_layer, f"{tournament_id}")
        await asyncio.sleep(sleep_time)
        await send_start_match(consumer, tournament_id)
        await manager.solve_first_round(tournament_id)
        await asyncio.sleep(sleep_time)
        await send_start_match(consumer, tournament_id)
        await send_tournament_room(consumer.channel_layer, f"{tournament_id}")
        await asyncio.sleep(sleep_time)
        await send_start_match(consumer, tournament_id)
        await manager.solve_second_round(tournament_id)
        await send_tournament_room(consumer.channel_layer, f"{tournament_id}")
        await asyncio.sleep(sleep_time)
        await send_start_match(consumer, tournament_id)
        await manager.solve_third_round(tournament_id)
        await send_tournament_room(consumer.channel_layer, f"{tournament_id}")
        await asyncio.sleep(sleep_time)
        await send_start_match(consumer, tournament_id)
        await manager.solve_fourth_round(tournament_id)
        await send_tournament_room(consumer.channel_layer, f"{tournament_id}")
        await asyncio.sleep(sleep_time)
        await send_start_match(consumer, tournament_id)
        await manager.solve_final_round(tournament_id)

        await handle_end_tournament(consumer, tournament_id)
    except Exception as e:
        await consumer.send_error(str(e))


async def handle_ended_round(consumer, message):
    manager = TournamentManager()
    tournament_id = message["tournament_id"]
    round_number = message["round_number"]

    try:
        await manager.solve_middle_round(tournament_id, round_number)
        await send_tournament_room(consumer.channel_layer, f"{tournament_id}")
    except Exception as e:
        await consumer.send_error(str(e))


async def handle_end_tournament(consumer, tournament_id):
    manager = TournamentManager()
    tournament = manager.get_tournament_data(tournament_id)
    t_name = tournament["name"]
    t_winner = tournament["winner"]

    try:
        await send_end_tournament(consumer.channel_layer, tournament_id, t_name, t_winner)
        await send_main_room(consumer.channel_layer)
        await manager.save_tournament(tournament_id)
        manager.delete_tournament(tournament_id)
    except Exception as e:
        await consumer.send_error(str(e))


async def handle_clean_tournaments(channel_layer):
    manager = TournamentManager()
    manager.clean_tournaments()
    await send_main_room(channel_layer)

