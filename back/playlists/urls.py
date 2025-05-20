from django.urls import path
from . import views

urlpatterns = [
    path('signup/',  views.api_signup,    name='api_signup'),
    path('login/',   views.api_login,     name='api_login'),
    path('logout/',  views.api_logout,    name='api_logout'),
    path('save-playlist/', views.save_playlist, name='save_playlist'),
    path('user-status/', views.api_user_status, name='api_user_status'),
    path('my-playlists/', views.api_my_playlists, name='api_my_playlists'),
]