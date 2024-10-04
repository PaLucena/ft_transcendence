from .tournament_manager import TournamentManager


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
    next_state = tournament_data["next_state"]
    participants = tournament_data["participants"]
    participants_data = tournament_data["participants_data"]
    players = tournament_data["players"]

    await channel_layer.group_send(
        tournament_room,
        {
            "type": "tournament_room_update",
            "participants": participants,
            "participants_data": participants_data,
            "players": players,
            "tournament_id": tournament_room,
            "next_state": next_state,
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

    try:
        await manager.start_tournament(tournament_id, consumer.user_id)
        await manager.solve_first_round(tournament_id)
        await manager.solve_second_round(tournament_id)
        await manager.solve_third_round(tournament_id)
        await manager.solve_fourth_round(tournament_id)
        await manager.solve_final_round(tournament_id)

        await handle_end_tournament(consumer, tournament_id)
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
        await manager.delete_tournament(tournament_id)
    except Exception as e:
        await consumer.send_error(str(e))


async def handle_clean_tournaments(channel_layer):
    manager = TournamentManager()
    manager.clean_tournaments()
    await send_main_room(channel_layer)


async def handle_notify_match_start(channel_layer, player_id, match_id, opponent_name):
    try:
        message = {
            "type": "match_start_notification",
            "match_id": match_id,
            "message": f"Your match against {opponent_name} is starting, please join.",
        }
        await channel_layer.group_send(f"user_{player_id}", message)

    except Exception as e:
        print(f"Error notifying player {player_id} about match {match_id}: {e}")
