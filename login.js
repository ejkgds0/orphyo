// Получаем элементы для работы с формами
const loginContainer = document.getElementById('login-container'); // Контейнер для формы входа
const signupContainer = document.getElementById('signup-container'); // Контейнер для формы регистрации

// Функция для отображения формы регистрации
function showSignup() {
    loginContainer.style.display = 'none'; // Скрываем форму входа
    signupContainer.style.display = 'block'; // Показываем форму регистрации
}

// Функция для отображения формы входа
function showLogin() {
    signupContainer.style.display = 'none'; // Скрываем форму регистрации
    loginContainer.style.display = 'block'; // Показываем форму входа
}
