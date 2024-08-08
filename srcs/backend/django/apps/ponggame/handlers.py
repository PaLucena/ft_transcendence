import asyncio
import json


async def handle_start(self):
    if self.game_logic.game_state == 'ready':
        await set_game_state(self, 'countdown')
        self.game_logic.set_countdown()
        if self.game_task is None:
            self.game_task = asyncio.create_task(start_game(self))


async def handle_quit(self):
    await set_game_state(self, 'game_over')


async def handle_move(self, player_id, direction):
    self.game_logic.move_paddle(player_id, direction)
    await send_positions(self)


async def start_game(self):
    try:
        while self.game_logic.game_state == 'playing' or self.game_logic.game_state == 'countdown':
            await self.game_logic.game_loop()
            await send_positions(self)
            await send_game_state(self)
            if self.game_logic.game_state == 'scored':
                await send_score(self)
                await set_game_state(self, 'countdown')
    except asyncio.CancelledError:
        print("Game task was cancelled!")


async def set_game_state(self, state):
    self.game_logic.game_state = state
    await send_game_state(self)


async def send_config(self):
    config = {
        'type': 'config',
        'player_1_name': self.game_logic.player_1_name,
        'player_2_name': self.game_logic.player_2_name,
        'goals_to_win': self.game_logic.GOALS_TO_WIN,
        'goals_diff': self.game_logic.GOALS_DIFF,
    }
    await self.send(text_data=json.dumps(config))


async def send_game_state(self):
    game_state = {
        'type': 'game_state',
        'state': self.game_logic.game_state,
        'countdown': int(self.game_logic.count_down / self.game_logic.FPS),
    }
    await self.send(text_data=json.dumps(game_state))


async def send_positions(self):
    positions = {
        'type': 'positions',
        'ball_x': self.game_logic.ball_x - self.game_logic.BALL_RADIUS / 2,
        'ball_y': self.game_logic.ball_y - self.game_logic.BALL_RADIUS / 2,
        'pad_1_x': self.game_logic.pad_1_x - self.game_logic.PAD_WIDTH,
        'pad_1_y': self.game_logic.pad_1_y - self.game_logic.PAD_HEIGHT / 2,
        'pad_2_x': self.game_logic.pad_2_x,
        'pad_2_y': self.game_logic.pad_2_y - self.game_logic.PAD_HEIGHT / 2,
    }
    await self.send(text_data=json.dumps(positions))


async def send_score(self):
    score = {
        'type': 'score',
        'score_1': self.game_logic.player_1_score,
        'score_2': self.game_logic.player_2_score,
    }
    await self.send(text_data=json.dumps(score))


async def change_theme(self, theme):
    if theme == "default":
        retro_theme = {
            'type': 'theme',
            'color_background': '#fff',
            'container_border_radius': '0',
            'board_border_radius': '0',
            'gradient_start': '#000',
            'gradient_end': '#000',
            'ball_border_radius': '0',
            'ball_color_theme': '#ffffffff',
            'color_p1': '#fff',
            'color_p2': '#fff',
            'paddle_border_radius': '0',
            'paddle_color': '#ffffffff',
        }
        self.game_logic.theme = 'dark'
        await self.send(text_data=json.dumps(retro_theme))
    else:
        default_theme = {
            'type': 'theme',
            'color_background': '#192e2f',
            'container_border_radius': '30px',
            'board_border_radius': '20px',
            'gradient_start': '#26465388',
            'gradient_end': '#E76F5155',
            'ball_border_radius': '50%',
            'ball_color_theme': '#00000000',
            'color_p1': '#2A9D8F',
            'color_p2': '#F4A261',
            'paddle_border_radius': '10px',
            'paddle_color': '#00000000',
        }
        self.game_logic.theme = 'default'
        await self.send(text_data=json.dumps(default_theme))
