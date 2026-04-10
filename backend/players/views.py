from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Tournament, Team, Player
from .supabase_client import delete_image_from_supabase
from .serializers import (
    TournamentSerializer,
    TournamentDetailSerializer,
    TeamSerializer,
    PlayerSerializer,
    PlayerAuctionStatusSerializer,
)


class TournamentViewSet(viewsets.ModelViewSet):
    queryset = Tournament.objects.all()
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TournamentDetailSerializer
        return TournamentSerializer

    @action(detail=True, methods=['post'], url_path='reset-auction')
    def reset_auction(self, request, pk=None):
        """Reset all players in this tournament back to pending."""
        tournament = self.get_object()
        tournament.players.all().update(
            auction_status='pending', sold_price=None, sold_to=''
        )
        return Response({'status': 'auction reset'})

    @action(detail=True, methods=['post'], url_path='clear-players')
    def clear_players(self, request, pk=None):
        """Delete all players in this tournament and their images in Supabase."""
        tournament = self.get_object()
        players = tournament.players.all()
        
        # Collect all photo URLs to delete from Supabase
        photo_urls = [p.photo for p in players if p.photo]
        
        if photo_urls:
            # Batch delete photos from Supabase
            from .supabase_client import get_supabase_client, os
            supabase = get_supabase_client()
            bucket_name = os.getenv("SUPABASE_BUCKET", "cricket")
            
            # Extract paths
            paths = []
            for url in photo_urls:
                parts = url.split(f"/{bucket_name}/")
                if len(parts) >= 2:
                    paths.append(parts[1])
            
            if paths:
                try:
                    supabase.storage.from_(bucket_name).remove(paths)
                except Exception as e:
                    print(f"[SUPABASE CLEAR ALL ERROR] {e}")

        # Delete from database
        players.delete()
        
        return Response({'status': 'all players cleared and images removed'})


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = super().get_queryset()
        tournament_id = self.request.query_params.get('tournament')
        if tournament_id:
            qs = qs.filter(tournament_id=tournament_id)
        return qs


class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = super().get_queryset()
        tournament_id = self.request.query_params.get('tournament')
        if tournament_id:
            qs = qs.filter(tournament_id=tournament_id)
        auction_status = self.request.query_params.get('auction_status')
        if auction_status:
            qs = qs.filter(auction_status=auction_status)
        return qs

    def perform_destroy(self, instance):
        # Delete photo from Supabase if it exists
        if instance.photo:
            delete_image_from_supabase(instance.photo)
        instance.delete()

    @action(detail=True, methods=['patch'], url_path='auction-status')
    def auction_status(self, request, pk=None):
        """Update a player's auction status (sold/unsold/pending)."""
        player = self.get_object()
        serializer = PlayerAuctionStatusSerializer(
            player, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Return full player data
        full_serializer = PlayerSerializer(player, context={'request': request})
        return Response(full_serializer.data)
