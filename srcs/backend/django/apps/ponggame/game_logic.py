import math
import random
import asyncio
import time


class GameLogic:
    # Game measurements
    TABLE_HEIGHT = 680
    TABLE_WIDTH = 1200
    MID_Y = TABLE_HEIGHT / 2
    MID_X = TABLE_WIDTH / 2
    PAD_HEIGHT = 110
    PAD_WIDTH = 20
    PAD_MID_HEIGHT = PAD_HEIGHT / 2
    PAD_MARGIN = 90
    PAD_SPEED = 4
    BALL_RADIUS = 24
    BALL_SPEED_INIT = 6
    BALL_SPEED_INC = 0.5
    COUNTDOWN = 3
    GOAL_MARGIN = 25
    GOALS_TO_WIN = 6
    GOALS_DIFF = 2
    FPS = 64

    # Initial positions
    pad_1_x = PAD_MARGIN
    pad_1_y = MID_Y
    pad_2_x = TABLE_WIDTH - PAD_MARGIN
    pad_2_y = MID_Y
    ball_x = MID_X
    ball_y = MID_Y
    ball_dir_x = -1 if random.uniform(-1, 1) <= 0.5 else 1
    ball_dir_y = -1 if random.uniform(-1, 1) <= 0.5 else 1
    ball_vel_x = BALL_SPEED_INIT
    ball_vel_y = BALL_SPEED_INIT

    count_down = 0

    frame_duration = 1 / FPS

    player_1_name = "Pepito"
    player_2_name = "Jaimito"
    theme = "default"

    def __init__(self):
        self.reset_game()
        self.game_state = "ready"
        self.player_1_ready = False
        self.player_2_ready = False
        self.player_1_score = 0
        self.player_2_score = 0

    def players_ready(self):
        return self.player_1_ready and self.player_2_ready

    def move_ball(self):
        self.ball_x += self.ball_vel_x * self.ball_dir_x
        self.ball_y += self.ball_vel_y * self.ball_dir_y

    def move_paddle(self, player, direction):
        if player == 1:
            self.pad_1_y += direction * self.PAD_SPEED
            if self.pad_1_y - self.PAD_MID_HEIGHT < self.GOAL_MARGIN:
                self.pad_1_y = self.PAD_MID_HEIGHT + self.GOAL_MARGIN
            if self.pad_1_y + self.PAD_MID_HEIGHT > self.TABLE_HEIGHT - self.GOAL_MARGIN:
                self.pad_1_y = self.TABLE_HEIGHT - self.PAD_MID_HEIGHT - self.GOAL_MARGIN
        else:
            self.pad_2_y += direction * self.PAD_SPEED
            if self.pad_2_y - self.PAD_HEIGHT / 2 < self.GOAL_MARGIN:
                self.pad_2_y = self.PAD_HEIGHT / 2 + self.GOAL_MARGIN
            if self.pad_2_y + self.PAD_HEIGHT / 2 > self.TABLE_HEIGHT - self.GOAL_MARGIN:
                self.pad_2_y = self.TABLE_HEIGHT - self.PAD_HEIGHT / 2 - self.GOAL_MARGIN

    def check_collision(self):
        # Check collision with walls
        if self.ball_y - self.BALL_RADIUS <= 0 or self.ball_y + self.BALL_RADIUS >= self.TABLE_HEIGHT:
            self.ball_dir_y *= -1
        # Check collision with pads
        if (self.pad_1_x >= self.ball_x - self.BALL_RADIUS >= self.pad_1_x - self.PAD_WIDTH and
                self.pad_1_y - self.PAD_HEIGHT / 2 <= self.ball_y <= self.pad_1_y + self.PAD_HEIGHT / 2 and
                self.ball_dir_x < 0):
            self.new_angle(1)
            self.ball_vel_y += self.BALL_SPEED_INC
            self.ball_vel_x += self.BALL_SPEED_INC
        elif (self.pad_2_x <= self.ball_x + self.BALL_RADIUS <= self.pad_2_x + self.PAD_WIDTH and
              self.pad_2_y - self.PAD_HEIGHT / 2 <= self.ball_y <= self.pad_2_y + self.PAD_HEIGHT / 2 and
              self.ball_dir_x > 0):
            self.new_angle(2)
            self.ball_vel_y += self.BALL_SPEED_INC
            self.ball_vel_x += self.BALL_SPEED_INC

    def new_angle(self, pad):
        if pad == 1:
            impact_point = self.ball_y - self.pad_1_y
        else:
            impact_point = self.ball_y - self.pad_2_y

        relative_intersect = impact_point / (self.PAD_HEIGHT / 2)
        bounce_angle = relative_intersect * math.radians(60)  # Max bounce angle is 60 degrees

        self.ball_dir_x = -self.ball_dir_x
        self.ball_dir_y = math.sin(bounce_angle)

    def check_goal(self):
        if self.ball_x < self.GOAL_MARGIN:
            self.player_2_score += 1
            return 2
        if self.ball_x > self.TABLE_WIDTH - self.GOAL_MARGIN:
            self.player_1_score += 1
            return 1
        return 0

    def reset_game(self):
        self.ball_x = self.MID_X
        self.ball_y = self.MID_Y
        self.ball_vel_x = self.BALL_SPEED_INIT
        self.ball_vel_y = self.BALL_SPEED_INIT
        self.ball_dir_x = -1 if random.uniform(-1, 1) <= 0.5 else 1
        self.ball_dir_y = -1 if random.uniform(-1, 1) <= 0.5 else 1

    def end_game(self):
        if self.player_1_score >= self.GOALS_TO_WIN and self.player_1_score - self.player_2_score >= self.GOALS_DIFF:
            return True
        if self.player_2_score >= self.GOALS_TO_WIN and self.player_2_score - self.player_1_score >= self.GOALS_DIFF:
            return True
        return False

    def print_positions(self):
        print(f"Ball: ({self.ball_x}, {self.ball_y})")
        print(f"Pad 1: ({self.pad_1_x}, {self.pad_1_y})")
        print(f"Pad 2: ({self.pad_2_x}, {self.pad_2_y})")
        print(f"Score: {self.player_1_score} - {self.player_2_score}")

    def init_game(self):
        test_counter = 0
        while not self.players_ready() and test_counter < 15:
            print("Waiting for players to be ready...")
            asyncio.sleep(1)
            test_counter += 1
        if test_counter < 15:
            self.game_state = "ready"
            return True
        else:
            return False

    def set_countdown(self):
        self.count_down = (self.COUNTDOWN + 1) * self.FPS

    async def game_loop(self):
        start_time = time.time()

        if self.game_state == "playing":
            self.move_ball()
            self.check_collision()
            goal = self.check_goal()
            if goal:
                if self.end_game():
                    self.game_state = "game_over"
                else:
                    self.game_state = "scored"
                    self.set_countdown()
                    self.reset_game()
        elif self.game_state == "countdown":
            if self.count_down > self.FPS:
                self.count_down -= 1
            else:
                self.game_state = "playing"
        elapsed_time = time.time() - start_time
        await asyncio.sleep(max(0, self.frame_duration - elapsed_time))
