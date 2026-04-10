from rest_framework import serializers
from .models import Tournament, Team, Player
from .supabase_client import upload_image_to_supabase


class TeamSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False, write_only=True)
    logo_url = serializers.ReadOnlyField(source='logo')

    class Meta:
        model = Team
        fields = ['id', 'tournament', 'name', 'logo', 'logo_url', 'created_at']

    def create(self, validated_data):
        logo_file = validated_data.pop('logo', None)
        if logo_file:
            validated_data['logo'] = upload_image_to_supabase(logo_file, "team_logos")
        return super().create(validated_data)

    def update(self, instance, validated_data):
        logo_file = validated_data.pop('logo', None)
        if logo_file:
            validated_data['logo'] = upload_image_to_supabase(logo_file, "team_logos")
        return super().update(instance, validated_data)


class PlayerSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(required=False, write_only=True)
    photo_url = serializers.ReadOnlyField(source='photo')

    class Meta:
        model = Player
        fields = [
            'id', 'tournament', 'name', 'photo', 'photo_url',
            'jersey_number', 'age', 'phone', 'nationality',
            'batting_hand', 'bowling_hand', 'role',
            'auction_status', 'sold_price', 'sold_to',
            'created_at',
        ]

    def create(self, validated_data):
        photo_file = validated_data.pop('photo', None)
        if photo_file:
            validated_data['photo'] = upload_image_to_supabase(photo_file, "players")
        return super().create(validated_data)

    def update(self, instance, validated_data):
        photo_file = validated_data.pop('photo', None)
        if photo_file:
            validated_data['photo'] = upload_image_to_supabase(photo_file, "players")
        return super().update(instance, validated_data)


class PlayerAuctionStatusSerializer(serializers.ModelSerializer):
    """Lightweight serializer for updating auction status only."""
    class Meta:
        model = Player
        fields = ['id', 'auction_status', 'sold_price', 'sold_to']


class TournamentSerializer(serializers.ModelSerializer):
    club_logo = serializers.ImageField(required=False, write_only=True)
    club_logo_url = serializers.ReadOnlyField(source='club_logo')
    player_count = serializers.SerializerMethodField()
    team_count = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = [
            'id', 'name', 'year', 'club_name',
            'club_logo', 'club_logo_url', 'team_total_budget', 'max_players_per_team',
            'player_count', 'team_count', 'created_at',
        ]

    def create(self, validated_data):
        logo_file = validated_data.pop('club_logo', None)
        if logo_file:
            validated_data['club_logo'] = upload_image_to_supabase(logo_file, "logos")
        return super().create(validated_data)

    def update(self, instance, validated_data):
        logo_file = validated_data.pop('club_logo', None)
        if logo_file:
            validated_data['club_logo'] = upload_image_to_supabase(logo_file, "logos")
        return super().update(instance, validated_data)

    def get_player_count(self, obj):
        return obj.players.count()

    def get_team_count(self, obj):
        return obj.teams.count()


class TournamentDetailSerializer(TournamentSerializer):
    players = PlayerSerializer(many=True, read_only=True)
    teams = TeamSerializer(many=True, read_only=True)

    class Meta(TournamentSerializer.Meta):
        fields = TournamentSerializer.Meta.fields + ['players', 'teams']
