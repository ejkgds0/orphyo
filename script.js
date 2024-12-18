document.addEventListener("DOMContentLoaded", function() {
    loadCSVData();  // Загружаем данные после загрузки страницы
    loadSelectedTags();  // Загрузка выбранных тегов из localStorage
});

let df = [];  // Глобальная переменная для данных из CSV
let categories = {};  // Глобальная переменная для категорий и тегов
let selectedTags = new Set();  // Набор для хранения выбранных тегов

// Функция для загрузки CSV
function loadCSVData() {
    Papa.parse("df.csv", {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            console.log("\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043d\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435:", results.data);
            df = results.data;  // Сохраняем данные
            processData(df);
        },
        error: function(error) {
            console.error("\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0435 CSV:", error);
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

    console.log("\u0413\u0440\u0443\u043f\u043f\u0438\u0440\u043e\u0432\u043a\u0430 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0439 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0430:", categories);
}

// Открытие/закрытие окна с тегами для выбранной категории
function toggleCategoryWindow(category) {
    const categoryWindow = document.getElementById('categoryWindow');
    const categoryContent = document.getElementById('categoryContent');

    if (categoryWindow.style.display === 'block' && categoryContent.getAttribute('data-category') === category) {
        categoryWindow.style.display = 'none';
        categoryContent.innerHTML = '';
        categoryContent.removeAttribute('data-category');
    } else {
        categoryWindow.style.display = 'block';
        categoryContent.innerHTML = '';
        categoryContent.setAttribute('data-category', category);

        categories[category].forEach(tag => {
            const tagDiv = document.createElement('div');
            tagDiv.classList.add('tags');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = tag;
            checkbox.classList.add('tag-checkbox');
            checkbox.checked = selectedTags.has(tag); // Восстанавливаем состояние

            checkbox.addEventListener('change', function () {
                handleCheckboxChange(tag, this.checked);
            });

            const label = document.createElement('label');
            label.setAttribute('for', tag);
            label.textContent = tag;

            tagDiv.appendChild(checkbox);
            tagDiv.appendChild(label);

            categoryContent.appendChild(tagDiv);
        });
    }
}

// Функция для обработки состояния чекбоксов
function handleCheckboxChange(tag, isChecked) {
    if (isChecked) {
        if (selectedTags.size >= 5) {
            alert("Sorry, you may select only up to 5 tags <3");
            document.getElementById(tag).checked = false;
            return;
        }
        selectedTags.add(tag);
    } else {
        selectedTags.delete(tag);
    }

    // Сохраняем выбранные теги в localStorage
    localStorage.setItem('selectedTags', JSON.stringify(Array.from(selectedTags)));
    console.log("Выбранные теги:", Array.from(selectedTags));
}

