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

  // Модалка настроек
  const actionModal    = document.getElementById('actionModal');
  const modalTitle     = actionModal.querySelector('.action-modal__title');
  const modalBody      = actionModal.querySelector('.action-modal__body');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalSaveBtn   = document.getElementById('modalSaveBtn');

    function openActionModal(title, renderBodyFn, onSaveFn) {
    // закрыть settings
    settingsModal.classList.add('hidden');

    // заголовок и контент
    modalTitle.textContent = title;
    modalBody.innerHTML = '';
    renderBodyFn(modalBody);
    modalSaveBtn.disabled = true;

    // найдём инпут внутри modalBody
    const input = modalBody.querySelector('input');
    if (input) {
      input.addEventListener('input', () => {
        modalSaveBtn.disabled = !input.value.trim();
      });
    }

    // показать модалку
    actionModal.classList.remove('hidden');

    // кнопка Cancel
    modalCancelBtn.onclick = () => {
      actionModal.classList.add('hidden');
    };
    // кнопка Save
    modalSaveBtn.onclick = async (event) => {
      event.preventDefault();
      await onSaveFn();
      actionModal.classList.add('hidden');
    };
  }

  // Привязываем три кнопки в Settings к модалке:
  document.getElementById('changeNickBtn').addEventListener('click', () => {
    openActionModal('Change nickname', renderNicknameForm, submitNicknameChange);
  });
  document.getElementById('changePasswordBtn').addEventListener('click', () => {
    openActionModal('Change password', renderPasswordForm, submitPasswordChange);
  });
  document.getElementById('changeAvatarBtn').addEventListener('click', () => {
    openActionModal('Change profile picture', renderAvatarForm, submitAvatarChange);
  });


  // Удаление аккаунта
  const deleteAccountBtn      = document.getElementById('deleteAccountBtn');
  const confirmModal          = document.getElementById('confirmDeleteModal');
  const finalModal            = document.getElementById('finalDeleteModal');
  const deleteYesBtn          = document.getElementById('deleteYesBtn');
  const deleteNoBtn           = document.getElementById('deleteNoBtn');
  const confirmFinalBtn       = document.getElementById('confirmDeleteFinalBtn');
  const cancelFinalBtn        = document.getElementById('cancelDeleteFinalBtn');
  const deleteInput           = document.getElementById('deleteConfirmInput');
  const deleteFeedback        = document.getElementById('deleteFeedback');
  const CONFIRM_PHRASE        = 'delete my account';

  
  // 1) Первое окошко подтверждения
  deleteAccountBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
    confirmModal.classList.remove('hidden');
  });

  // 2) No
  deleteNoBtn.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    settingsModal.classList.add('hidden');
  });

  // 3) Yes --> открывается второе
  deleteYesBtn.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    // сбросить старые значения
    deleteInput.value = '';
    deleteFeedback.classList.add('hidden');
    finalModal.classList.remove('hidden');
    deleteInput.focus();
  });

  // 4) Второе окошко — Cancel
  cancelFinalBtn.addEventListener('click', () => {
    finalModal.classList.add('hidden');
    deleteInput.value = '';
    deleteFeedback.classList.add('hidden');
  });

  // 5) Второе окошко — Confirm
  confirmFinalBtn.addEventListener('click', async () => {
    const val = deleteInput.value.trim();
    if (val !== CONFIRM_PHRASE) {
      // неправильная фраза
      deleteFeedback.classList.remove('hidden');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/delete-account/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true })
      });
      if (res.ok) {
        // аккаунт удален — редирект 
        window.location.href = 'login.html';
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      deleteFeedback.classList.remove('hidden');
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
      document.getElementById('usernameDisplay').textContent = data.username;
      // Обновляем аватар
      const avatarDiv = document.querySelector('.avatar');
      if (data.avatar_url) {
        avatarDiv.style.backgroundImage = `url(${data.avatar_url}?t=${Date.now()})`;
      }
    } else {
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


// ========== Функции для модал. окна настроек ==========

// Смена ника
function renderNicknameForm(container) {
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'New nickname';
  input.id = 'newNicknameInput';
  input.style.fontFamily = "Antic Didone";
  input.style.width = '100%';
  input.style.padding = '0.5rem';
  container.appendChild(input);
}

async function submitNicknameChange() {
  const newNick = document.getElementById('newNicknameInput').value.trim();
  if (!newNick) {
    alert('Please enter a nickname.');
    return;
  }
  const res = await fetch('http://127.0.0.1:8000/api/change-username/', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: newNick }),
  });
  if (res.ok) {
    document.getElementById('usernameDisplay').textContent = newNick;
  } else {
    alert('Error changing nickname');
  }
}

// Смена пароля
function renderPasswordForm(container) {
  const cur = document.createElement('input');
  cur.type = 'password';
  cur.placeholder = 'Current password';
  cur.id = 'currentPassword';
  cur.style.fontFamily = "Antic Didone";
  cur.style.width = '100%';
  cur.style.padding = '0.5rem';
  cur.style.marginBottom = '0.5rem';

  const neu = document.createElement('input');
  neu.type = 'password';
  neu.placeholder = 'New password';
  neu.id = 'newPassword';
  neu.style.fontFamily = "Antic Didone";
  neu.style.width = '100%';
  neu.style.padding = '0.5rem';

  container.append(cur, neu);
}

async function submitPasswordChange() {
  const current = document.getElementById('currentPassword').value;
  const newPass = document.getElementById('newPassword').value;
  if (!current || !newPass) {
    alert('Fill both fields.');
    return;
  }
  const res = await fetch('http://127.0.0.1:8000/api/change-password/', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ old_password: current, new_password: newPass }),
  });
  if (!res.ok) {
    alert('Error changing password');
  }
}

// Смена аватара
function renderAvatarForm(container) {
  // Создаем элементы с классами
  const wrapper = document.createElement('div');
  wrapper.className = 'file-upload-wrapper';
  
  const input = document.createElement('input');
  input.className = 'file-input';
  input.type = 'file';
  input.accept = 'image/*';
  input.id = 'avatarFileInput';

  const textContent = document.createElement('div');
  textContent.className = 'file-text-content';

  const mainText = document.createElement('span');
  mainText.className = 'file-main-text';
  mainText.textContent = 'CHOOSE FILE';

  const hint = document.createElement('span');
  hint.className = 'file-hint-text';
  hint.textContent = 'Click to select profile pic';

  const preview = document.createElement('img');
  preview.className = 'file-preview';
  preview.id = 'avatarPreview';

  // Собираем структуру
  textContent.appendChild(mainText);
  textContent.appendChild(hint);
  wrapper.appendChild(textContent);
  wrapper.appendChild(input);
  container.append(wrapper, preview);

  // Обработчики событий
  input.addEventListener('change', () => {
    if (input.files && input.files[0]) {
      preview.src = URL.createObjectURL(input.files[0]);
      mainText.textContent = 'SELECTED: ' + input.files[0].name;
      wrapper.classList.add('file-selected');
      hint.textContent = 'Click to change selection';
    }
  });
}


async function submitAvatarChange() {
  const fileInput = document.getElementById('avatarFileInput');
  if (!fileInput.files.length) {
    alert('Please select a file.');
    return;
  }

  const formData = new FormData();
  formData.append('avatar', fileInput.files[0]);

  const res = await fetch('http://127.0.0.1:8000/api/change-avatar/', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    alert('Error uploading avatar');
    return;
  }

  const data = await res.json();
  const avatarUrl = data.avatar_url;  // "/media/avatars/photo.jpg"
  const fullUrl = `http://127.0.0.1:8000${avatarUrl}?t=${Date.now()}`;

  // Вместо innerHTML — напрямую в background
  const avatarDiv = document.querySelector('.avatar');
  avatarDiv.style.backgroundImage = `url('${fullUrl}?t=${Date.now()}')`;

  // Обновляем превью внутри модалки, если нужно
  const preview = document.getElementById('avatarPreview');
  if (preview) preview.src = fullUrl + '?t=' + Date.now();
}


// ========== Функция управления режимом удаления ==========
// Удаление плейлистов, новые переменные
let deleteMode = false;
let selectedPlaylists = new Set();

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


