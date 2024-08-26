from django.utils.text import slugify
from user.models import AppUser
import random

AI_NICKNAMES = ['AI_pablo', 'AI_davyd', 'AI_enrique', 'AI_gabriela', 'AI_lucena', 'AI_sara']
AI_IMAGES = [
    'ai_images/ai1.jpg',
    'ai_images/ai2.jpg',
    'ai_images/ai3.jpg',
    'ai_images/ai4.jpg',
    'ai_images/ai5.jpg',
    'ai_images/ai6.jpg'
]


def generate_unique_username(base_username):
	username = base_username
	counter = 1
	while AppUser.objects.filter(username=username).exists():
		username = f"{base_username}_{counter}"
		counter += 1
	return username

def add_ai_players(tournament, current_player_count):
	while (current_player_count < 8):
		nickname = random.choice(AI_NICKNAMES)
		avatar = random.choice(AI_IMAGES)

		while AppUser.objects.filter(nickname=nickname).exists():
			nickname = random.choice(AI_NICKNAMES)
		base_username = slugify(f'{nickname.lower()}')
		unique_username = generate_unique_username(base_username)

		ai_user = AppUser.objects.create_user(
			username=unique_username,
			nickname=nickname,
			password=None,
			avatar=avatar,
			is_ia=True
		)

		ai_user.is_active = False
		ai_user.save()
		tournament.participants.add(ai_user)
		current_player_count += 1
