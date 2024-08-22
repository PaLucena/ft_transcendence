To execute the game from backend, run the following command in python shell:

import asyncio
from ponggame.game_manager import GameManager

game = GameManager()
result = asyncio.run(game.start_match(2, 3, "duo"))
print(result)
