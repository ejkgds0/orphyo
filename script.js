let df = [];  // Глобальная переменная для хранения данных

// Функция для загрузки CSV
function loadCSVData() {
    // Используем PapaParse для загрузки CSV
    Papa.parse("df.csv", {
        download: true,  // Указываем, что мы хотим скачать файл
        header: true,    // Читаем заголовки в CSV
        dynamicTyping: true, // Автоматически преобразуем типы данных
        complete: function(results) {
            // Выводим данные, чтобы убедиться, что все загрузилось
            console.log(results.data);  // Это будет массив объектов с данными
            df = results.data;  // Сохраняем данные в глобальную переменную
            processData(df);
        },
        error: function(error) {
            console.error("Ошибка при загрузке CSV:", error);
        }
    });
}



// Функция для обработки данных
function processData(data) {
    console.log('Обрабатываем данные:', data);
    const categories = {};

    // Группируем данные по категориям
    data.forEach(item => {
        // Проверяем, что категория существует и не пуста
        const category = item.category ? item.category : 'Unknown Category';

        if (!categories[category]) {
            categories[category] = [];
        }
        if (!categories[category].includes(item.tag)) {
            categories[category].push(item.tag);
        }
    });

    // Удаляем категорию "Unknown Category" или пустые категории, если они появились
    delete categories['Unknown Category'];

    console.log(categories);  // Проверим, что категории и теги сформированы правильно
    displayTags(categories);
}


let selectedTagCount = 0; // изначально выбрано тегов

// Функция для отображения категорий и тегов на странице с возможностью скрывать/показывать теги
function displayTags(categories) {
    const container = document.getElementById('categories-container');
    container.innerHTML = ''; // Очищаем контейнер перед добавлением новых элементов

    // Перебираем все категории и добавляем их на страницу
    for (const category in categories) {
        const categoryDiv = document.createElement('div');
        
        // Создаем заголовок для категории
        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = category;  // Название категории

        // Добавляем обработчик клика на заголовок категории
        categoryTitle.addEventListener('click', () => {
            const tagList = categoryDiv.querySelector('.tags');
            tagList.style.display = (tagList.style.display === 'none') ? 'block' : 'none'; // Переключение видимости
        });

        categoryDiv.appendChild(categoryTitle);

        // Создаем контейнер для тегов
        const tagList = document.createElement('div');
        tagList.classList.add('tags');
        tagList.style.display = 'none'; // Сначала скрыто

        // Перебираем теги внутри каждой категории
        categories[category].forEach(tag => {
            const tagLabel = document.createElement('label');
            const tagCheckbox = document.createElement('input');
            tagCheckbox.type = 'checkbox';
            tagCheckbox.value = tag;
            
            // Добавляем обработчик для изменения выбора чекбокса
            tagCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    selectedTagCount++;
                } else {
                    selectedTagCount--;
                }

                // Если количество выбранных тегов больше 5, снимаем выбор с последнего
                if (selectedTagCount > 5) {
                    alert('You can select up to 5 tags only.');
                    this.checked = false;  // Снимаем выбор с текущего чекбокса
                    selectedTagCount--;  // Уменьшаем счетчик
                }
            });

            tagLabel.appendChild(tagCheckbox);
            tagLabel.appendChild(document.createTextNode(tag));
            tagList.appendChild(tagLabel);
        });

        categoryDiv.appendChild(tagList);
        container.appendChild(categoryDiv);
    }
}



// Функция для генерации альбома с случайными песнями
function generateAlbum() {
    const selectedTags = [];
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');

    checkboxes.forEach(checkbox => {
        selectedTags.push(checkbox.value);
    });

    // Проверяем, выбрал ли пользователь хотя бы 1 тег
    if (selectedTags.length < 1) {
        alert('Please select at least one tag.');
        return;
    }

    /// Фильтруем песни по выбранным тегам
    const filteredTracks = df.filter(track => {
        return selectedTags.some(tag => track.tag === tag);
    });

    // Проверяем, сколько песен мы нашли
    let trackCount = filteredTracks.length;
    if (trackCount < 1) {
        alert('Not enough tracks found. Please select more tags or expand your selection.');
        return;
    }

    // Если песен меньше 2, генерируем только 1 песню
    if (trackCount < 2) {
        trackCount = 1;
    }
    // Если песен меньше 3, генерируем 2 песни
    else if (trackCount < 3) {
        trackCount = 2;
    }
    // Если песен больше или равно 3, генерируем до 5 песен
    else if (trackCount > 3) {
        trackCount = Math.min(trackCount, 5);
    }

    // Генерируем случайные песни
    const randomTracks = getRandomTracks(filteredTracks, trackCount);

    // Отображаем случайные треки
    displayAlbum(randomTracks);
}



// Функция для получения случайных песен
function getRandomTracks(tracks, trackCount) {
    const randomTracks = [];
    
    // Генерируем случайные песни, пока не достигнем нужного количества
    while (randomTracks.length < trackCount) {
        const randomIndex = Math.floor(Math.random() * tracks.length);
        const track = tracks[randomIndex];
        if (!randomTracks.includes(track)) {
            randomTracks.push(track);
        }
    }

    return randomTracks;
}



// Функция для отображения альбома
function displayAlbum(tracks) {
    const albumList = document.getElementById('album-list');
    albumList.innerHTML = '';  // Очищаем текущий список

    tracks.forEach(track => {
        const trackDiv = document.createElement('div');
        trackDiv.classList.add('track');

        const trackName = document.createElement('h4');
        trackName.textContent = track.track;

        const artistName = document.createElement('p');
        artistName.textContent = `Artist: ${track.artist}`;

        let trackDuration = document.createElement('p');

        if (track.duration > 0) {  // Только показывает длительность если не 0
            trackDuration.textContent = `Duration: ${track.duration} seconds`;
            trackDiv.appendChild(trackDuration);
        } else {
            trackDuration.style.display = 'none';  // Прячет длитильность (как элемент) если 0
        }


        trackDiv.appendChild(trackName);
        trackDiv.appendChild(artistName);
        trackDiv.appendChild(trackDuration);

        albumList.appendChild(trackDiv);
    });
}

// Добавляем обработчик на кнопку "Generate"
document.getElementById('generate').addEventListener('click', generateAlbum);

// Загружаем данные при запуске страницы
window.onload = function() {
    loadCSVData();
};

