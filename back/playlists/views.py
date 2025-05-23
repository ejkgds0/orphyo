from django.shortcuts import render

import json
from django.conf import settings
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Track, Playlist, PlaylistTrack

from django.contrib.auth.decorators import login_required

from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required


User = get_user_model()  # CustomUser


#Регистарция
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


# Вход
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


# Выход
@csrf_exempt
def api_logout(request):
    if request.method == 'POST':
        logout(request)
        return JsonResponse({'message': 'Logged out successfully'})
    return JsonResponse({'error': 'Invalid request method'}, status=400)


# Сохранение плейлиста
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
        avatar_url = request.build_absolute_uri(request.user.avatar.url) if request.user.avatar else None
        return JsonResponse({
            'authenticated': True,
            'username': request.user.username,
            'avatar_url': avatar_url
        })
    return JsonResponse({'authenticated': False})

# Сохраненные плейлисты  
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


# Удаление плейлистов
@csrf_exempt
@require_http_methods(["DELETE"])
@login_required
def api_delete_playlists(request):
    """
    Удаляет все плейлисты текущего пользователя с указанными ID.
    Ожидает JSON: { "ids": [1,2,3] }
    """
    try:
        payload = json.loads(request.body)
        ids = payload.get("playlist_ids", [])
        # Удаляем только те, что принадлежат текущему пользователю
        Playlist.objects.filter(user=request.user, id__in=ids).delete()
        return JsonResponse({"deleted": ids})
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    

# Смена ника
@csrf_exempt
@require_http_methods(["POST"])
@login_required
def api_change_username(request):
    try:
        data = json.loads(request.body)
        new_nick = data.get("username", "").strip()
        if not new_nick:
            return JsonResponse({"error": "Username cannot be empty"}, status=400)
        if User.objects.filter(username=new_nick).exclude(id=request.user.id).exists():
            return JsonResponse({"error": "Username already taken"}, status=400)
        request.user.username = new_nick
        request.user.save()
        return JsonResponse({"status": "ok", "username": new_nick})
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

# Смена пароля
@csrf_exempt
@require_http_methods(["POST"])
@login_required
def api_change_password(request):
    try:
        data = json.loads(request.body)
        old = data.get("old_password", "")
        new  = data.get("new_password", "")
        if not request.user.check_password(old):
            return JsonResponse({"error": "Wrong current password"}, status=400)
        if len(new) < 6:
            return JsonResponse({"error": "New password too short"}, status=400)
        request.user.set_password(new)
        request.user.save()
        # разлогиним, чтобы пользователь заново вошел
        logout(request)
        return JsonResponse({"status": "ok"})
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

# Смена аватара
@csrf_exempt
@require_http_methods(["POST"])
@login_required
def api_change_avatar(request):
    avatar = request.FILES.get("avatar")
    if not avatar:
        return JsonResponse({"error": "No file uploaded"}, status=400)
    if request.user.avatar:
        request.user.avatar.delete(save=False)
    request.user.avatar = avatar
    request.user.save()
    # Здесь точно должно быть:
    return JsonResponse({
        "status": "ok",
        "avatar_url": request.user.avatar.url
    })