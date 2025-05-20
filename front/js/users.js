document.addEventListener('DOMContentLoaded', () => {
  initUserProfile();
  loadMyPlaylists();

  // Инициализация настройки кнопки настроек
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  settingsBtn.addEventListener('click', e => {
    e.preventDefault();
    settingsModal.classList.toggle('hidden');
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
