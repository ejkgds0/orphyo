from django.contrib import admin

# Register your models here.

from .models import CustomUser, Track, Playlist, PlaylistTrack

admin.site.register(CustomUser)
admin.site.register(Track)
admin.site.register(Playlist)
admin.site.register(PlaylistTrack)