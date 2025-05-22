document.addEventListener('DOMContentLoaded', () => {
  initUserProfile();
  loadMyPlaylists();

  // Инициализация настройки кнопки настроек
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const deletePlaylistsBtn = document.getElementById('deletePlaylistsBtn'); // ID кнопки "Delete playlists"
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  settingsBtn.addEventListener('click', e => {
    e.preventDefault();
    settingsModal.classList.toggle('hidden');
  });

  deletePlaylistsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');       // Закрываем настройки
    enterDeleteMode();                           // Включаем режим удаления
  });

  // Обработчик кнопок CANCEL/ DELETE
  cancelDeleteBtn.addEventListener('click', () => {
    console.log('Cancel clicked');
    exitDeleteMode();
  });

  confirmDeleteBtn.addEventListener('click', async () => {
    if (selectedPlaylists.size === 0) return;

    const res = await fetch('http://127.0.0.1:8000/api/delete-playlists/', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playlist_ids: Array.from(selectedPlaylists) }),
    });

    if (res.ok) {
      exitDeleteMode();
      await loadMyPlaylists();
    } else {
      alert('Error deleting playlists');
    }
  });
});

// Функция использования никнейма
async function initUserProfile() {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/user-status/', {
      credentials: 'include'
    });
    const data = await res.json();
    if (data.authenticated) {
      // Вставляем username в профиль
      document.getElementById('usernameDisplay').textContent = data.username;
    } else {
      // Если не залогинен — перенаправляем на логин
      window.location.href = 'login.html';
    }
  } catch (err) {
    console.error('Error receiving user request:', err);
  }
}

// Функция загрузки сохраненного плейлиста
async function loadMyPlaylists() {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/my-playlists/', {
      credentials: 'include'
    });
    const json = await res.json();
    const container = document.getElementById('playlistsContainer');

    if (!res.ok) {
      container.innerHTML = '<p>Error loading playlists</p>';
      return;
    }
    const playlists = json.playlists || [];

    if (playlists.length === 0) {
      container.innerHTML = '<p>No playlists yet.</p>';
      return;
    }

    playlists.forEach(pl => {
      const card = document.createElement('div');
      card.className = 'card';

      // ID плейлиста для последующего использования
      card.dataset.playlistId = pl.id;

      // Крестик удаления (изначально скрыт)
      const deleteIcon = document.createElement('img');
      deleteIcon.src = 'assets/iks.png'; // путь к иконке
      deleteIcon.className = 'delete-icon hidden';
      deleteIcon.addEventListener('click', (e) => {
        e.stopPropagation(); // предотврати всплытие события
        toggleSelectPlaylist(card);
      });
      card.appendChild(deleteIcon);

      // Заголовок с датой
      const header = document.createElement('div');
      header.className = 'card-header';
      header.textContent = new Date(pl.created_at).toLocaleString();
      card.append(header);

      // Список треков
      const ul = document.createElement('ul');
      ul.className = 'card-body';

      pl.tracks.forEach(track => {
        const li = document.createElement('li');
        li.className = 'song-item';

        // Заголовок трека
        const title = document.createElement('h4');

        const trackLink = document.createElement('a');
        trackLink.href = `https://www.last.fm/ru/music/${encodeURIComponent(track.artist)}/_/${encodeURIComponent(track.track)}`;
        trackLink.textContent = track.track;
        trackLink.target = '_blank';
        trackLink.className = 'track-link';


        title.appendChild(trackLink);
        li.appendChild(title);

        // Блок с информацией
        const songInfo = document.createElement('div');
        songInfo.className = 'song-info';

        // Исполнитель
        const artist = document.createElement('p');
        artist.textContent = `Artist: ${track.artist}`;
        songInfo.append(artist);

        // Длительность (добавляем только если > 0)
        if (track.duration > 0) {
          const duration = document.createElement('p');
          duration.textContent = `Duration: ${formatDuration(track.duration)} minuters`;
          songInfo.append(duration);
        }

        li.append(songInfo);
        ul.append(li);
      }); // Закрытие pl.tracks.forEach

      card.append(ul);
      container.append(card);
    }); // Закрытие playlists.forEach

  } catch (e) {
    console.error(e);
  }
}

// Длительность в минутах
function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

// Выход из аккаунта
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/logout/', {
      method: 'POST',
      credentials: 'include',
    });

    if (res.ok) {
      window.location.href = 'login.html';
    } else {
      console.error('Logout failed');
    }
  } catch (err) {
    console.error('Logout error:', err);
  }
});

// Удаление плейлистов, новые переменные
let deleteMode = false;
let selectedPlaylists = new Set();

// Функция управления режимом удаления
// Вход с режим удаления
function enterDeleteMode() {
  deleteMode = true;
  document.getElementById('deleteModePanel').classList.remove('hidden');

  document.querySelectorAll('.card').forEach(card => {
    let deleteIcon = card.querySelector('.delete-icon');

    // Если иконки ещё нет — создаём и добавляем
    if (!deleteIcon) {
      deleteIcon = document.createElement('img');
      deleteIcon.src = 'assets/iks.png';
      deleteIcon.className = 'delete-icon';
      deleteIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSelectPlaylist(card);
      });
      card.appendChild(deleteIcon);
    }

    // Показываем крестик
    deleteIcon.classList.remove('hidden');
  });
}

// Выход из режима удаления
function exitDeleteMode() {
  deleteMode = false;
  selectedPlaylists.clear();
  document.getElementById('deleteModePanel').classList.add('hidden');

  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.classList.remove('selected-for-deletion');
    const icon = card.querySelector('.delete-icon');
    if (icon) icon.classList.add('hidden');
  });
}

// Функция выборки плейлистов
function toggleSelectPlaylist(card) {
  card.classList.toggle('selected-for-deletion');

  const id = card.dataset.playlistId;
  if (card.classList.contains('selected-for-deletion')) {
    selectedPlaylists.add(id);
  } else {
    selectedPlaylists.delete(id);
  }
}
