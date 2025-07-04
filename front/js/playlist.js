document.addEventListener("DOMContentLoaded", function() {
    loadCSVData();  // Загружаем данные после загрузки страницы
    loadSelectedTags();  // Загрузка выбранных тегов из localStorage
});

let df = [];  // Глобальная переменная для данных из CSV
let categories = {};  // Глобальная переменная для категорий и тегов
let selectedTags = new Set();  // Набор для хранения выбранных тегов
let currentAlbum = [];   // Сюда сохранять последний сгенерированный плейлист
let hasSaved = false;    // флаг: уже сохранили?

// Функция для загрузки CSV
function loadCSVData() {
    Papa.parse("assets/df.csv", {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            console.log("Загруженные данные:", results.data);
            df = results.data;  // Сохраняем данные в переменную df
            processData(df);  // Обрабатываем данные
            //generateAlbum();  // Вызываем функцию генерации плейлиста после загрузки данных

            // если пришли с главной страницей — генерируем новый
            if (sessionStorage.getItem('orphyo:shouldGenerate') === '1') {
                generateAlbum();
                sessionStorage.removeItem('orphyo:shouldGenerate');
            }
            // если уже был сгенерирован альбом — отрисовываем его
            else if (sessionStorage.getItem('orphyo:lastAlbum')) {
                const saved = JSON.parse(sessionStorage.getItem('orphyo:lastAlbum'));
                currentAlbum = saved;
                hasSaved = true;       // чтобы кнопка Save стала неактивной
                displayAlbum(currentAlbum);
            }
            // иначе — оставляем Loading
        },
        error: function(error) {
            console.error("Ошибка при загрузке CSV:", error);
        }
    });
}

// Функция для обработки данных и группировки по категориям
function processData(data) {
    categories = {};  // Сброс категорий

    data.forEach(item => {
        const category = item.category || 'Unknown Category';

        if (!categories[category]) {
            categories[category] = [];
        }
        if (!categories[category].includes(item.tag)) {
            categories[category].push(item.tag);
        }
    });

    console.log("Группировка категорий завершена:", categories);
}


// Функция для генерации альбома с выбранными тегами
function generateAlbum() {
    const selectedTagsArray = JSON.parse(localStorage.getItem('selectedTags') || '[]');  // Загружаем выбранные теги из localStorage

    // Фильтруем треки по выбранным тегам
    const filteredTracks = df.filter(track => {
        return selectedTagsArray.some(tag => track.tag === tag);
    });

    // Логируем фильтрованные треки
    console.log("Отфильтрованные треки:", filteredTracks);

    // Ограничиваем количество треков до 5 случайных
    const randomTracks = getRandomTracks(filteredTracks, 5);

    // Отображаем треки
    displayAlbum(randomTracks);

    // Сохраняем в переменную и сбрасываем флаг
    currentAlbum = randomTracks;
    hasSaved = false;

    sessionStorage.setItem('orphyo:lastAlbum', JSON.stringify(currentAlbum));

    displayAlbum(currentAlbum);
}

// Функция для случайного выбора треков
function getRandomTracks(tracks, trackCount) {
    const randomTracks = [];
    const availableTracks = [...tracks]; // Создаем копию массива для случайного выбора

    // Генерируем случайные песни, пока не достигнем нужного количества
    while (randomTracks.length < trackCount && availableTracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableTracks.length);
        const track = availableTracks.splice(randomIndex, 1)[0];  // Удаляем выбранный трек из массива
        randomTracks.push(track);  // Добавляем трек в список случайных
    }

    return randomTracks;
}

// Функция для отображения альбома
function displayAlbum(tracks) {
    const albumList = document.getElementById('album-list');
    albumList.innerHTML = ''; // Очищаем текущий список

    tracks.forEach(track => {
        const songItem = document.createElement('li');
        songItem.classList.add('song-item');  // Применяем стиль из CSS

        // Создаем кликабельную ссылку на трек
        const trackLink = document.createElement('a');
        trackLink.href = `https://www.last.fm/ru/music/${encodeURIComponent(track.artist)}/_/${encodeURIComponent(track.track)}`;
        trackLink.textContent = track.track;
        trackLink.target = '_blank'; // Открываем ссылку в новой вкладке

        // Название
        const trackName = document.createElement('h4');
        trackName.appendChild(trackLink);

        // Исполнитель
        const artistName = document.createElement('p');
        artistName.textContent = `Artist: ${track.artist}`;

        let trackDuration = document.createElement('p');

        if (track.duration > 0) { // Отображаем продолжительность только если она больше нуля
            trackDuration.textContent = `Duration: ${track.duration} seconds`;
            songItem.appendChild(trackDuration);  // Добавляем duration в songItem
        }

        songItem.appendChild(trackName);
        songItem.appendChild(artistName);
        songItem.appendChild(trackDuration);

        // Навешиваем обработчики событий для отображения тегов
        songItem.addEventListener('mouseenter', function() {
            showTags(track, songItem);
        });
        songItem.addEventListener('mouseleave', hideTags);

        albumList.appendChild(songItem);  // Добавляем songItem в albumList
    });
}


// Функция для отображения тегов
function showTags(track, songItem) {
    const tagPopup = document.getElementById('tag-popup');
    const tagList = document.getElementById('tag-list');

    // Очищаем список тегов
    tagList.innerHTML = '';

    // Добавляем тег, относящийся к песне
    if (track.tag) {
        const listItem = document.createElement('li');
        listItem.textContent = track.tag;
        tagList.appendChild(listItem);
    } else {
        const noTagsItem = document.createElement('li');
        noTagsItem.textContent = 'No tags available';
        tagList.appendChild(noTagsItem);
    }

    // Отображаем всплывающее окно с тегами
    const rect = songItem.getBoundingClientRect();
    tagPopup.style.top = `${rect.top + window.scrollY}px`; // Учитываем прокрутку страницы
    tagPopup.style.left = `${rect.right + 5}px`; // Сдвигаем немного вправо
    tagPopup.style.display = 'block';
}

// Скрыть теги при уходе курсора
function hideTags() {
    const tagPopup = document.getElementById('tag-popup');
    tagPopup.style.display = 'none';
}

// Функция для загрузки выбранных тегов из localStorage
function loadSelectedTags() {
    const selectedTagsArray = JSON.parse(localStorage.getItem('selectedTags') || '[]');
    selectedTags = new Set(selectedTagsArray);  // Восстанавливаем набор выбранных тегов
}

// Получение CSRF-токена из куки
function getCookie(name) {
    let cookieValue = null;
    document.cookie.split(';').forEach(cookie => {
        const [k,v] = cookie.trim().split('=');
        if (k === name) cookieValue = decodeURIComponent(v);
    });
    return cookieValue;
}

// Функция для сохранения сгенерированного плейлиста на бекенд
function saveGeneratedPlaylist(tracks) {
  return fetch('http://127.0.0.1:8000/api/save-playlist/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    credentials: 'include',
    body: JSON.stringify({ tracks })
  })
  .then(res => {
    if (!res.ok) throw new Error('Save failed');
    return res.json();
  });
}

// в обработчике кнопки:
document.getElementById("savePlaylistButton").addEventListener("click", function () {
  if (hasSaved) {
    alert("Playlist has already been saved.");
    return;
  }
  if (currentAlbum.length === 0) {
    alert("No tracks to save!");
    return;
  }

  saveGeneratedPlaylist(currentAlbum)
    .then(data => {
      alert("Playlist saved!");
      hasSaved = true;
      // тот же плейлист БЕЗ СБРОСА
      displayAlbum(currentAlbum);
    })
    .catch(err => {
      console.error(err);
      alert("Error saving playlist. Please login first!");
    });
});