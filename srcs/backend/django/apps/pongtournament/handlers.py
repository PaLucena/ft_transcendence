import asyncio
import time

from blockchain.views import record_match
from ponggame.game_manager import game_manager
from .tournament_manager import (
    TournamentManager,
    match_to_uint,
    solve_first_round,
    solve_second_round,
    solve_third_round,
    solve_fourth_round,
    solve_final_round
)


async def handle_send_tournaments_list(channel_layer):
    t_manager = TournamentManager()
    public_tournaments = t_manager.get_tournaments_by_privacy(is_private=False)
    private_tournaments = t_manager.get_tournaments_by_privacy(is_private=True)

    await channel_layer.group_send(
        "main_room",
        {
            "type": "send_tournaments_list",
            "public_tournaments": public_tournaments,
            "private_tournaments": private_tournaments,
        },
    )


async def handle_send_tournament_data(channel_layer, tournament_id):
    manager = TournamentManager()
    tournament_data = manager.get_tournament_data(tournament_id)

    await channel_layer.group_send(
        tournament_id,
        {
            "type": "send_tournament_data",
            "tournament_id": tournament_id,
            "tournament_name": tournament_data["name"],
            "current_phase": tournament_data["current_phase"],
            "participants": tournament_data["participants"],
            "participants_data": tournament_data["participants_data"],
            "players": tournament_data["players"],
        },
    )


async def handle_send_closed_tournament(channel_layer, tournament_id):
    await channel_layer.group_send(
        tournament_id, {
            "type": "send_closed_tournament",
        }
    )


async def handle_send_leave_tournament(channel_layer, tournament_id, tournament_name, channel_name):
    await channel_layer.send(
        channel_name, {
            "type": "send_leave_tournament",
            "tournament_id": tournament_id,
            "tournament_name": tournament_name
        }
    )


async def handle_send_deleted_tournament(channel_layer, tournament_id, tournament_name):
    await channel_layer.group_send(
        tournament_id, {
            "type": "send_deleted_tournament",
            "tournament_id": tournament_id,
            "tournament_name": tournament_name
        }
    )


async def handle_send_end_tournament(channel_layer, tournament):
    tournament_data = tournament.tournament_data()
    try:
        for participant_id in tournament.participants:
            if participant_id != 0:
                await channel_layer.group_send(
                    f"user_{participant_id}", {
                        "type": "send_end_tournament",
                        "tournament_id": tournament.id,
                        "tournament_name": tournament.name,
                        "winner": tournament_data["winner"],
                    },
                )
    except Exception as e:
        print("Error sending end tournament: ", str(e))


async def handle_send_start_match(channel_layer, tournament_id, players_ids):
    try:
        for player_id in players_ids:
            if player_id != 0:
                if tournament_id != 0:
                    await channel_layer.group_send(
                        f"user_{player_id}", {
                            "type": "send_start_match",
                            "sub_type": "start_match",
                            "tournament_id": tournament_id,
                        }
                    )
                else:
                    await channel_layer.group_send(
                        f"user_{player_id}", {
                            "type": "send_start_match",
                            "sub_type": "start_single_match",
                            "tournament_id": tournament_id,
                        }
                    )
    except Exception as e:
        print("Error sending start match: ", str(e))


async def handle_start_single_match(consumer, message):
    try:
        user = consumer.user
        player_1_id = user.id
        player_2_id = message["player_2_id"]
        controls_mode = message["controls_mode"]

        if game_manager.get_game_room_by_player(player_1_id):
            raise ValueError("User already has an active match.")

        if TournamentManager().get_player_active_tournament(player_1_id):
            raise ValueError("User already has an active tournament.")

        if player_2_id is None or controls_mode is None:
            raise ValueError("Missing required fields: player_2_id or controls_mode")

        if controls_mode == "remote":
            await handle_send_start_match(consumer.channel_layer, 0, [player_1_id, player_2_id])

        asyncio.create_task(handle_solve_single_match(player_1_id, player_2_id, controls_mode))

        if controls_mode != "remote":
            await handle_send_start_match(consumer.channel_layer, 0, [player_1_id])

    except Exception as e:
        await consumer.send_error(str(e))


async def handle_solve_single_match(player_1_id, player_2_id, controls_mode):
    timestamp = int(time.time())
    formated_time = time.strftime("%y%m%d%H%M%S", time.localtime(timestamp))

    result = await game_manager.start_match(
        tournament_id=0,
        match_id=f"{formated_time}{player_1_id}",
        player_1_id=player_1_id,
        player_2_id=player_2_id,
        controls_mode=controls_mode,
    )

    data = match_to_uint(result)
    record_match(data)


async def handle_create_tournament(consumer, message):
    manager = TournamentManager()

    try:
        creator = consumer.user_id
        name = message["name"]
        is_private = message["is_private"]
        password = message["password"]

        new = manager.create_tournament(consumer, creator, name, is_private, password)
        if new:
            await consumer.add_to_tournament_group(new.id)
            await handle_send_tournaments_list(consumer.channel_layer)

        else:
            await consumer.send_error("User already has an active game or tournament.")

    except Exception as e:
        await consumer.send_error(str(e))


async def handle_join_tournament(consumer, message):
    manager = TournamentManager()
    tournament_id = message["tournament_id"]
    tournament_room = f"{tournament_id}"

    if message["type"] == "join_tournament_room":
        try:
            await consumer.send_successfully_joined(tournament_id)
            await handle_send_tournament_data(consumer.channel_layer, tournament_room)
        except Exception as e:
            await consumer.send_error("Permission denied to join the tournament.")
    else:
        password = message["password"]

        try:
            if manager.join_tournament(consumer, tournament_id, password):
                await consumer.channel_layer.group_add(
                    tournament_room, consumer.channel_name
                )
                await handle_send_tournaments_list(consumer.channel_layer)
                await consumer.send_successfully_joined(tournament_id)
                await handle_send_tournament_data(consumer.channel_layer, tournament_room)
            else:
                await consumer.send_error("Permission denied to join the tournament.")
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
            await handle_send_deleted_tournament(consumer.channel_layer, tournament_id, tournament_name)
            manager.delete_tournament(tournament_id)
        elif manager.leave_tournament(tournament_id, consumer.user_id):
            await handle_send_leave_tournament(consumer.channel_layer, tournament_id, tournament_name, consumer.channel_name)
            await consumer.remove_from_tournament_group(tournament_id)
            await handle_send_tournament_data(consumer.channel_layer, tournament_room)
        else:
            raise Exception("Failed to leave tournament.")
        await handle_send_tournaments_list(consumer.channel_layer)
    except Exception as e:
        await consumer.send_error(str(e))


async def handle_start_tournament(consumer, message):
    manager = TournamentManager()
    tournament = manager.get_tournament_by_id(message["tournament_id"])
    channel_layer = consumer.channel_layer
    sleep_time = 3

    try:
        await manager.start_tournament(tournament.id, consumer.user_id)
        await handle_send_closed_tournament(channel_layer, tournament.id)
        await handle_send_tournaments_list(channel_layer)
        await handle_send_tournament_data(channel_layer, f"{tournament.id}")

        await asyncio.sleep(sleep_time)
        await handle_send_start_match(channel_layer, tournament.id, tournament.players)
        await solve_first_round(tournament)
        await handle_send_tournaments_list(channel_layer)
        await handle_send_tournament_data(channel_layer, f"{tournament.id}")

        await asyncio.sleep(sleep_time)
        await handle_send_start_match(channel_layer, tournament.id, tournament.players)
        await solve_second_round(tournament)
        await handle_send_tournaments_list(channel_layer)
        await handle_send_tournament_data(channel_layer, f"{tournament.id}")

        await asyncio.sleep(sleep_time)
        await handle_send_start_match(channel_layer, tournament.id, tournament.loser_bracket)
        await solve_third_round(tournament)
        await handle_send_tournaments_list(channel_layer)
        await handle_send_tournament_data(channel_layer, f"{tournament.id}")

        await asyncio.sleep(sleep_time)
        await handle_send_start_match(channel_layer, tournament.id, tournament.winner_bracket)
        await solve_fourth_round(tournament)
        await handle_send_tournaments_list(channel_layer)
        await handle_send_tournament_data(channel_layer, f"{tournament.id}")

        await asyncio.sleep(sleep_time)
        await handle_send_start_match(channel_layer, tournament.id, tournament.winner_bracket)
        await solve_final_round(tournament)

        await handle_end_tournament(channel_layer, manager, tournament)
    except Exception as e:
        await consumer.send_error(str(e))


async def handle_back_to_game(consumer):
    user_id = consumer.user_id

    try:
        if game_manager.is_player_in_game(user_id):
            await consumer.channel_layer.send(
                consumer.channel_name,
                {
                    "type": "send_start_match",
                    "sub_type": "back_to_game",
                    "tournament_id": 0,
                }
            )
        else:
            raise Exception("The game has already ended.")
    except Exception as e:
        await consumer.send_error(str(e))
        await consumer.channel_layer.send(
            consumer.channel_name,
            {
                "type": "send_reload_play",
            }
        )


async def handle_end_tournament(channel_layer, manager, tournament):
    try:
        await handle_send_end_tournament(channel_layer, tournament)
        await manager.save_tournament(tournament.id)
        manager.delete_tournament(tournament.id)
        await handle_send_tournaments_list(channel_layer)
    except Exception as e:
        print("Error ending tournament: ", str(e))


async def handle_clean_tournaments(channel_layer):
    manager = TournamentManager()
    manager.clean_tournaments()
    await handle_send_tournaments_list(channel_layer)

