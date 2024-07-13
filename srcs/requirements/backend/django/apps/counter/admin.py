from django.contrib import admin
from .models import Click

# Register your models here.
class ClickAdmin(admin.ModelAdmin):
	list_display = ['id', 'count']

admin.site.register(Click, ClickAdmin)