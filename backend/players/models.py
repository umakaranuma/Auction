from django.db import models


class Tournament(models.Model):
    name = models.CharField(max_length=200)
    year = models.CharField(max_length=50, blank=True, default='')
    club_name = models.CharField(max_length=200, blank=True, default='')
    club_logo = models.ImageField(upload_to='logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.year})"

    class Meta:
        db_table = 'tournaments'


class Player(models.Model):
    BATTING_CHOICES = [
        ('Right Hand', 'Right Hand'),
        ('Left Hand', 'Left Hand'),
    ]
    BOWLING_CHOICES = [
        ('Right Arm', 'Right Arm'),
        ('Left Arm', 'Left Arm'),
    ]
    ROLE_CHOICES = [
        ('Batsman', 'Batsman'),
        ('Bowler', 'Bowler'),
        ('Wicket Keeper', 'Wicket Keeper'),
        ('Batting All Rounder', 'Batting All Rounder'),
        ('Bowling All Rounder', 'Bowling All Rounder'),
    ]

    tournament = models.ForeignKey(
        Tournament, on_delete=models.CASCADE, related_name='players'
    )
    name = models.CharField(max_length=200)
    photo = models.ImageField(upload_to='players/', blank=True, null=True)
    jersey_number = models.CharField(max_length=10, blank=True, default='')
    age = models.CharField(max_length=10, blank=True, default='')
    phone = models.CharField(max_length=30, blank=True, default='')
    nationality = models.CharField(max_length=100, blank=True, default='')
    batting_hand = models.CharField(
        max_length=20, choices=BATTING_CHOICES, default='Right Hand'
    )
    bowling_hand = models.CharField(
        max_length=20, choices=BOWLING_CHOICES, default='Right Arm'
    )
    role = models.CharField(
        max_length=30, choices=ROLE_CHOICES, blank=True, default=''
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'players'
        ordering = ['-created_at']
