document.addEventListener("DOMContentLoaded", function() {
    loadCSVData();  // Загружаем данные после загрузки страницы
});

let df = [];  // Глобальная переменная для данных из CSV
let categories = {};  // Глобальная переменная для категорий и тегов
let selectedTagCount = 0;  // Счётчик выбранных тегов

// Функция для загрузки CSV
function loadCSVData() {
    Papa.parse("df.csv", {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            console.log("Загруженные данные:", results.data);
            df = results.data;  // Сохраняем данные
            processData(df);
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

// Открытие/закрытие окна с тегами для выбранной категории
function toggleCategoryWindow(category) {
    const categoryWindow = document.getElementById('categoryWindow');
    const categoryContent = document.getElementById('categoryContent');
    
    // Если окно открыто, проверяем, был ли уже выбран этот category
    if (categoryWindow.style.display === 'block' && categoryContent.getAttribute('data-category') === category) {
        // Если окно открыто и выбрана та же категория, скрываем окно
        categoryWindow.style.display = 'none';
        categoryContent.innerHTML = ''; // Очищаем контейнер
        categoryContent.removeAttribute('data-category'); // Убираем атрибут категории
    } else {
        // Если окно скрыто или выбрана новая категория, показываем окно
        categoryWindow.style.display = 'block';
        categoryContent.innerHTML = '';  // Очищаем контейнер с тегами
        categoryContent.setAttribute('data-category', category); // Сохраняем текущую категорию

        // Добавляем чекбоксы для выбранной категории
        categories[category].forEach(tag => {
            const tagDiv = document.createElement('div');
            tagDiv.classList.add('tags');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = tag;
            checkbox.classList.add('tag-checkbox');
            
            const label = document.createElement('label');
            label.setAttribute('for', tag);
            label.textContent = tag;
            
            // Добавляем обработчик для отслеживания выбора чекбоксов
            checkbox.addEventListener('change', handleCheckboxChange);

            tagDiv.appendChild(checkbox);
            tagDiv.appendChild(label);
            
            categoryContent.appendChild(tagDiv);
        });
    }
}

// Функция для обработки изменения состояния чекбоксов
function handleCheckboxChange() {
    const checkedCheckboxes = document.querySelectorAll('.tag-checkbox:checked');
    
    if (checkedCheckboxes.length > 5) {
        alert("Sorry, you may select only up to 5 tags <3");
        // Снимаем последний отмеченный чекбокс, если их больше 5
        this.checked = false;
    }
}

