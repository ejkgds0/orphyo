from django.shortcuts import render

import json
from django.conf import settings
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Track, Playlist, PlaylistTrack

from django.contrib.auth.decorators import login_required

User = get_user_model()  # CustomUser


@csrf_exempt
def api_signup(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Use POST'}, status=405)
    try:
        data = json.loads(request.body)
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')

        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'Email already registered'}, status=400)
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists'}, status=400)

        user = User.objects.create_user(email=email, username=username, password=password)
        return JsonResponse({'status': 'ok'})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)


@csrf_exempt
def api_login(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Use POST'}, status=405)
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')

        # Так как USERNAME_FIELD = 'email', аутентифицируем по email
        user = authenticate(request, email=email, password=password)
        if user is None:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)

        login(request, user)
        return JsonResponse({'status': 'ok'})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)


@csrf_exempt
def api_logout(request):
    if request.method == 'POST':
        logout(request)
        return JsonResponse({'message': 'Logged out successfully'})
    return JsonResponse({'error': 'Invalid request method'}, status=400)


@csrf_exempt
def save_playlist(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Use POST'}, status=405)

    user = request.user
    if not user.is_authenticated:
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    try:
        data = json.loads(request.body)
        tracks = data.get('tracks', [])
        if not tracks:
            return JsonResponse({'error': 'No tracks provided'}, status=400)

        playlist = Playlist.objects.create(user=user)

        for idx, t in enumerate(tracks, start=1):
            name = t.get('track') or t.get('name')
            artist = t.get('artist')
            tag = t.get('tag', '')
            duration = t.get('duration', 0)

            track_obj, _ = Track.objects.get_or_create(
                track=name,
                artist=artist,
                tag=tag,
                duration=duration
            )
            PlaylistTrack.objects.create(
                playlist=playlist,
                track=track_obj,
                order=idx
            )

        # Оставляем только 10 последних плейлистов
        #recent = Playlist.objects.filter(user=user).order_by('-created_at')
        #for old in recent[10:]:
        #   old.delete()

        return JsonResponse({'status': 'ok', 'playlist_id': playlist.id})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def api_user_status(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'authenticated': True,
            'username': request.user.username,
        })
    else:
        return JsonResponse({'authenticated': False})
    
@login_required
def api_my_playlists(request):
    user = request.user
    qs = Playlist.objects.filter(user=user).order_by('-created_at')
    data = []
    for pl in qs:
        # собираем треки
        items = pl.items.select_related('track').order_by('order')
        tracks = [{
            'track': it.track.track,
            'artist': it.track.artist,
            'duration': it.track.duration
        } for it in items]
        data.append({
            'id': pl.id,
            'created_at': pl.created_at,
            'tracks': tracks
        })
    return JsonResponse({'playlists': data})
