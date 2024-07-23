import random
from django.core.management.base import BaseCommand
from user.models import AppUser
from faker import Faker

class Command(BaseCommand):
	help = 'Create 8 random users'

	def handle(self, *args, **kwargs):
		fake = Faker()
		for _ in range(8):
			username = fake.user_name()
			email = fake.email()
			nickname = fake.first_name()
			user = AppUser.objects.create_user(
				username=username,
				email=email,
				password='123',
				nickname=nickname,
				avatar='default/default.jpg',
				last_seen=fake.date_time_this_year(),
				online="offline",
				image_link=fake.url(),
				id_deleted=False
			)
			self.stdout.write(self.style.SUCCESS(f'User {username} created'))