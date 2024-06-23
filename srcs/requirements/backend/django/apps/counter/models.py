from django.db import models

class Click(models.Model):
	count = models.IntegerField(default=0)

	class Meta:
		db_table = 'counter_table'

	@classmethod
	def increment(cls):
		click = cls.objects.get(id=1)
		click.count += 1
		click.save()
	@classmethod
	def reset(cls):
		click = cls.objects.get(id=1)
		click.count = 0
		click.save()

