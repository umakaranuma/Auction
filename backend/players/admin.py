from django.contrib import admin
from .models import Tournament, Player


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ['name', 'year', 'club_name', 'created_at']
    search_fields = ['name', 'club_name']


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ['name', 'tournament', 'role', 'jersey_number', 'batting_hand', 'bowling_hand']
    list_filter = ['tournament', 'role', 'batting_hand', 'bowling_hand']
    search_fields = ['name', 'phone']
