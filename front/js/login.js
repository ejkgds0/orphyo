// Получаем элементы для работы с формами
const loginContainer = document.getElementById('login-container'); // Контейнер для формы входа
const signupContainer = document.getElementById('signup-container'); // Контейнер для формы регистрации
const goBackWrapper = document.getElementById('go-back-wrapper'); // Контейнер для кнопки "GO BACK"

// Функция для отображения формы регистрации
function showSignup() {
    loginContainer.style.display = 'none'; // Скрываем форму входа
    signupContainer.style.display = 'block'; // Показываем форму регистрации
    goBackWrapper.style.display = 'block'; // Показываем кнопку "GO BACK"
}

// Функция для отображения формы входа
function showLogin() {
    signupContainer.style.display = 'none'; // Скрываем форму регистрации
    loginContainer.style.display = 'block'; // Показываем форму входа
    goBackWrapper.style.display = 'none'; // Скрываем кнопку "GO BACK"
}


document.addEventListener('DOMContentLoaded', () => {
  // Перехват формы входа
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();

    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'ok') {
        console.log('Login successful!');
        window.location.href = 'users.html';
      } else {
        alert('Login error: ' + (data.error || 'Incorrect data'));
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    }
  });

  // Перехват формы регистрации
  const signupForm = document.getElementById('signup-form');
  signupForm.addEventListener('submit', async e => {
    e.preventDefault();

    const username = signupForm.username.value;
    const email = signupForm.email.value;
    const password = signupForm.password.value;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'ok') {
        alert('Registration successful! Now log in.');
        showLogin();
      } else {
        alert('Registration error: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    }
  });
});
