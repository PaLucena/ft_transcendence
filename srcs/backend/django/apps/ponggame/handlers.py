import json


async def handle_player_ready(consumer, player):
    if player == 1:
        consumer.game_logic.player_1_ready = True
    elif player == 2:
        consumer.game_logic.player_2_ready = True

    await consumer.send(text_data=json.dumps({
        'type': 'game_state',
        'state': 'player_ready',
        'player': player
    }))


async def handle_quit(consumer):
    consumer.game_logic.game_state = "game_over"
    await consumer.send_game_state()


async def handle_move(consumer, player_id, direction):
    consumer.game_logic.move_paddle(player_id, direction)
    await consumer.send_positions()


async def handle_resize(consumer):
    await consumer.send_positions()


async def send_config(consumer):
    await consumer.send(text_data=json.dumps({
        'type': 'config',
        'controls_mode': consumer.controls_mode,
        'controls_side': consumer.controls_side,
        'player_1_name': consumer.room.get_players()[0],
        'player_2_name': consumer.room.get_players()[1],
        'goals_to_win': consumer.game_logic.GOALS_TO_WIN,
        'goals_diff': consumer.game_logic.GOALS_DIFFERENCE,
    }))


async def send_game_state(channel_layer, room_group_name, game_logic):
    countdown = 0
    if game_logic.game_state == "countdown":
        left = game_logic.countdown
        fps = game_logic.FPS
        countdown = int(left / fps)
    game_state = {
        'type': 'game_state',
        'state': game_logic.game_state,
        'countdown': countdown,
    }
    await channel_layer.group_send(
        room_group_name,
        {
            'type': 'game_message',
            'message': game_state
        }
    )


async def send_positions(channel_layer, room_group_name, game_logic):
    try:
        positions = {
            'type': 'positions',
            'ball_x': game_logic.ball_x - game_logic.BALL_RADIUS / 2,
            'ball_y': game_logic.ball_y - game_logic.BALL_RADIUS / 2,
            'pad_1_x': game_logic.pad_1_x - game_logic.PADDLE_WIDTH,
            'pad_1_y': game_logic.pad_1_y - game_logic.PADDLE_HEIGHT / 2,
            'pad_2_x': game_logic.pad_2_x,
            'pad_2_y': game_logic.pad_2_y - game_logic.PADDLE_HEIGHT / 2,
        }
        await channel_layer.group_send(
            room_group_name,
            {
                'type': 'game_message',
                'message': positions
            }
        )
    except Exception as e:
        print(f"Error in send: {e}")


async def send_score(channel_layer, room_group_name, game_logic):
    score = {
        'type': 'score',
        'score_1': game_logic.player_1_goals,
        'score_2': game_logic.player_2_goals,
    }
    await channel_layer.group_send(
        room_group_name,
        {
            'type': 'game_message',
            'message': score
        }
    )
