from .tournament_manager import TournamentManager

async def send_main_room(channel_layer):
    manager = TournamentManager()
    public_tournaments = manager.get_tournaments_by_privacy(is_private=False)
    private_tournaments = manager.get_tournaments_by_privacy(is_private=True)
    await channel_layer.group_send(
        'main_room',
        {
            'type': 'main_room_update',
            'public_tournaments': public_tournaments,
            'private_tournaments': private_tournaments
        }
    )




async def send_tournament_room(channel_layer, tournament_room):
    manager = TournamentManager()
    tournament_data = manager.get_tournament_data(tournament_room)
    state = tournament_data['state']
    participants = tournament_data['participants']
    players_data = tournament_data['players_data']
    await channel_layer.group_send(
        tournament_room,
        {
            'type': 'tournament_room_update',
            'participants': participants,
            'players_data': players_data,
            'state': state
        }
    )


async def send_deleted_tournament(channel_layer):
    await channel_layer.group_send(
        'main_room',
        {
            'type': 'deleted_tournament',
        }
    )


async def handle_create_tournament(consumer, message):
    manager = TournamentManager()

    try:
        creator = consumer.user_id
        name = message['name']
        is_private = message['is_private']
        password = message['password']

        new = manager.create_tournament(creator, name, is_private, password)
        print("llega hasta aqui")
        if new is not None:
            await consumer.add_to_tournament_group(f"{new.id}")
            print("entrando al torneo")
            await send_main_room(consumer.channel_layer)

        else:
            await consumer.send_error("User already has an active tournament.")

    except Exception as e:
        await consumer.send_error(str(e))


async def handle_join_tournament(consumer, message):
    manager = TournamentManager()
    tournament_id = message['tournament_id']
    tournament_room = f"{tournament_id}"
    password = message['password']

    try:
        if manager.join_tournament(consumer, tournament_id, password):
            await consumer.channel_layer.group_add(tournament_room, consumer.channel_name)
            await send_tournament_room(consumer.channel_layer, tournament_room)
        else:
            await consumer.send_error("Failed to join tournament.")
    except Exception as e:
        await consumer.send_error(str(e))


async def handle_leave_tournament(consumer, message):
    manager = TournamentManager()
    tournament_id = message['tournament_id']

    try:
        if manager.leave_tournament(tournament_id, consumer.user_id):
            await consumer.remove_from_tournament_group()
        else:
            raise Exception("Failed to leave tournament.")
    except Exception as e:
        await consumer.send_error(str(e))


async def handle_start_tournament(consumer, message):
    manager = TournamentManager()
    tournament_id = message['tournament_id']
    user = message['user']

    try:
        await manager.start_tournament(tournament_id, user)
        await send_tournament_room(consumer.channel_layer, message['tournament_room'])
    except Exception as e:
        await consumer.send_error(str(e))


async def handle_end_tournament(channel_layer, message):
    try:
        manager = TournamentManager()
        tournament_id = message['tournament_id']
        await manager.end_tournament(tournament_id, channel_layer)
        await send_main_room(channel_layer)

    except Exception as e:
        await channel_layer.group_send(
            'tournament_room',
            {
                'type': 'error',
                'target id': message['user'].id,
                'message': str(e)
            }
        )


async def handle_clean_tournaments(channel_layer):
    manager = TournamentManager()
    manager.clean_tournaments()
    await send_main_room(channel_layer)


async def handle_notify_match_start(channel_layer, player_id, match_id, opponent_name):
    try:
        message = {
            'type': 'match_start_notification',
            'match_id': match_id,
            'message': f"Your match against {opponent_name} is starting, please join."
        }
        await channel_layer.group_send(f"user_{player_id}", message)

    except Exception as e:
        print(f"Error notifying player {player_id} about match {match_id}: {e}")