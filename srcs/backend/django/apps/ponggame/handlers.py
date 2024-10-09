import json
import time


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


async def handle_quit(consumer, player):
    if player == 1:
        consumer.game_logic.forfeit = 1
    elif player == 2:
        consumer.game_logic.forfeit = 2
    consumer.game_logic.game_state = "game_over"


async def handle_move(consumer, player_id, direction):
    consumer.game_logic.move_paddle(player_id, direction)


async def handle_resize(consumer):
    await send_positions(
        consumer.channel_layer,
        consumer.room_name,
        consumer.game_logic
    )


async def send_game_state(channel_layer, room_group_name, game_logic):
    countdown = 0
    if game_logic.game_state == "countdown" or game_logic.game_state == "waiting":
        left = game_logic.countdown
        fps = game_logic.FPS
        countdown = int(left / fps)
    game_state = {
        'type': 'game_state',
        'state': game_logic.game_state,
        'winner': game_logic.winner,
        'forfeit': game_logic.forfeit,
        'countdown': countdown,
    }
    await channel_layer.group_send(
        room_group_name,
        {
            'type': 'game_message',
            'message': game_state
        }
    )


async def send_game_over(channel_layer, room_group_name):
    game_over = {
        'type': 'game_over',
    }
    await channel_layer.group_send(
        room_group_name,
        {
            'type': 'game_message',
            'message': game_over
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
            'timestamp': time.time(),
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
