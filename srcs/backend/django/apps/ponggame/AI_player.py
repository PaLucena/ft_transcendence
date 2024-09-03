import time


class AiPlayer:
    def __init__(self, game):
        self.game = game

        # Board
        self.BOARD_START = 0 + self.game.BALL_RADIUS
        self.BOARD_END = self.game.TABLE_WIDTH - self.game.BALL_RADIUS

        # Last seen data
        self.ball_x = 0
        self.ball_y = 0
        self.ball_vel_x = 0
        self.ball_vel_y = 0
        self.ball_dir_x = 0
        self.ball_dir_y = 0
        self.ia_y = 0
        self.ia_side = self.game.ai_side
        self.opponent_y = 0

        # Calculating next move
        self.distance_x = 0
        self.collision_y = self.game.TABLE_HEIGHT / 2
        self.target_point = 0
        self.new_position = 0
        self.col_x_time = 0

        self.loop_count = 0
        self.new_ball_dir_x = 0


    def ai_turn(self, new_direction):
        if new_direction:
            self.loop_count = 0
            self.new_ball_dir_x = self.game.ball_dir_x
        if self.loop_count % self.game.FPS == 0:
            self.data_update()
        self.think()
        self.move()
        self.loop_count += 1


    def data_update(self):
        self.ball_x = self.game.ball_x
        self.ball_y = self.game.ball_y
        self.ball_vel_x = self.game.ball_vel_x
        self.ball_vel_y = self.game.ball_vel_y * self.game.ball_dir_y
        self.ball_dir_x = self.game.ball_dir_x
        self.ball_dir_y = self.game.ball_dir_y
        if self.ia_side == 1:
            self.ia_y = self.game.pad_1_y
            self.opponent_y = self.game.pad_2_y
        else:
            self.ia_y = self.game.pad_2_y
            self.opponent_y = self.game.pad_1_y
        # print(f"AI read time: {time.time() - self.game.start_time:.3f}") # DEBUG


    def move(self):
        distance = self.ia_y - self.new_position
        if distance < 0 and distance < -self.game.PADDLE_SPEED:
            self.game.move_paddle(self.ia_side, 1)
            self.ia_y += self.game.PADDLE_SPEED
        elif distance > 0 and distance > self.game.PADDLE_SPEED:
            self.game.move_paddle(self.ia_side, -1)
            self.ia_y -= self.game.PADDLE_SPEED


    def think(self):
        if (((self.ia_side == 1 and self.ball_dir_x < 0) or
                (self.ia_side == 2 and self.ball_dir_x > 0)) and
                self.game.game_state == "playing"):
            self.calc_collision_point()
            self.calc_target_point()
            self.calc_new_position()
            # self.print_data() # DEBUG
        else:
            self.new_position = self.game.TABLE_HEIGHT / 2


    def calc_collision_point(self):
        if self.ia_side == 2:
            self.distance_x = (self.game.TABLE_WIDTH - self.game.GOAL_TAB_MARGIN
                               - self.ball_x - self.game.BALL_RADIUS)
        else:
            self.distance_x = self.ball_x - self.game.GOAL_TAB_MARGIN - self.game.BALL_RADIUS
        self.col_x_time = self.distance_x / abs(self.ball_vel_x)
        self.collision_y = self.ball_y + self.ball_vel_y * self.col_x_time
        while self.collision_y < self.BOARD_START or self.collision_y > self.BOARD_END:
            if self.collision_y < self.BOARD_START:
                self.collision_y = (self.collision_y - self.game.BALL_RADIUS) * -1
            else:
                self.collision_y = 2 * self.BOARD_END - self.collision_y


    def calc_target_point(self):
        pass


    def calc_new_position(self):
        self.new_position = self.collision_y


    def print_data(self):
        print("Ball: ", self.ball_x, self.ball_y)
        print("Velocity: ", self.ball_vel_x, self.ball_vel_y)
        print("IA position: ", self.ia_y)
        print("Opponent position: ", self.opponent_y)
        print("Distance in X to AI: ", self.distance_x)
        print("Time to collision: ", self.col_x_time)
        print("Collision point in Y: ", self.collision_y)
        print("Target point: ", self.target_point)
        print("Position to reach: ", self.new_position)
        print("\n")
