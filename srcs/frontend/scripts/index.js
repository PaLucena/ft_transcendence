import { Home } from './Home.js';
import { Login } from './Login.js';
import { Signup } from './Signup.js';
import { Play } from './Play.js';
import { Chat } from './Chat.js';
import { NotFound } from './NotFound.js';
import { Friends } from './Friends.js';
import { Profile } from './Profile.js';
import { Auth } from './Auth.js';

// Экспортируем функции
export function navigateTo(url) {
  window.history.pushState({}, "", url);
  router();
}

export function navigateToOnBootup() {
  if (window.location.pathname === "/") {
    navigateTo("/login");
  } else {
    router();
  }
}

// Роутер инициализация
import { router } from './router.js';

window.addEventListener("DOMContentLoaded", navigateToOnBootup);
window.addEventListener("popstate", router);

document.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    event.preventDefault();
    navigateTo(event.target.href);
  }
});
