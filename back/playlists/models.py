from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
    Group,
    Permission
)


# Менеджер для создания пользователей и суперпользователей
class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None):
        if not email:
            raise ValueError("Email обязателен")
        if not username:
            raise ValueError("Username обязателен")

        email = self.normalize_email(email)
        user = self.model(email=email, username=username)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password):
        user = self.create_user(email, username, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


# Модель пользователя
class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=50)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    # Явное определение с уникальными related_name
    groups = models.ManyToManyField(
        Group,
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='custom_user_groups',  # Уникальное имя
        related_query_name='custom_user',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='custom_user_permissions',  # Уникальное имя
        related_query_name='custom_user',
    )

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username
    

# Модель трека
class Track(models.Model):
    track = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    tag = models.CharField(max_length=100)
    duration = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.track} - {self.artist}"


# Модель плейлиста, связанная с пользователем
class Playlist(models.Model):
    user = models.ForeignKey(
        'playlists.CustomUser',
        on_delete=models.CASCADE,
        related_name='playlists'
    )                                           # владелец плейлиста
    created_at = models.DateTimeField(auto_now_add=True)  
                                                # дата и время генерации

    class Meta:
        ordering = ['-created_at']               # последние сначала

    def __str__(self):
        return f"Playlist {self.id} for {self.user.username} at {self.created_at}"



# Связующая модель между плейлистом и треками
class PlaylistTrack(models.Model):
    playlist = models.ForeignKey(
        Playlist,
        on_delete=models.CASCADE,
        related_name='items'
    )
    track = models.ForeignKey(
        Track,
        on_delete=models.CASCADE
    )
    order = models.PositiveIntegerField()

    class Meta:
        unique_together = ('playlist', 'order')
        ordering = ['order']

    def __str__(self):
        return f"{self.order}. {self.track.track}"