from rest_framework import serializers
from .models import Tournament, Team, Player


class TeamSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ['id', 'tournament', 'name', 'logo', 'logo_url', 'created_at']
        extra_kwargs = {
            'logo': {'write_only': True, 'required': False},
        }

    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class PlayerSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = [
            'id', 'tournament', 'name', 'photo', 'photo_url',
            'jersey_number', 'age', 'phone', 'nationality',
            'batting_hand', 'bowling_hand', 'role',
            'auction_status', 'sold_price', 'sold_to',
            'created_at',
        ]
        extra_kwargs = {
            'photo': {'write_only': True, 'required': False},
        }

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None


class PlayerAuctionStatusSerializer(serializers.ModelSerializer):
    """Lightweight serializer for updating auction status only."""
    class Meta:
        model = Player
        fields = ['id', 'auction_status', 'sold_price', 'sold_to']


class TournamentSerializer(serializers.ModelSerializer):
    club_logo_url = serializers.SerializerMethodField()
    player_count = serializers.SerializerMethodField()
    team_count = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = [
            'id', 'name', 'year', 'club_name',
            'club_logo', 'club_logo_url', 'player_count', 'team_count', 'created_at',
        ]
        extra_kwargs = {
            'club_logo': {'write_only': True, 'required': False},
        }

    def get_club_logo_url(self, obj):
        if obj.club_logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.club_logo.url)
            return obj.club_logo.url
        return None

    def get_player_count(self, obj):
        return obj.players.count()

    def get_team_count(self, obj):
        return obj.teams.count()


class TournamentDetailSerializer(TournamentSerializer):
    players = PlayerSerializer(many=True, read_only=True)
    teams = TeamSerializer(many=True, read_only=True)

    class Meta(TournamentSerializer.Meta):
        fields = TournamentSerializer.Meta.fields + ['players', 'teams']
