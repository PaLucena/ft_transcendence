import './styles/main.scss';
import { router, navigateTo, navigateToOnBootup, hello } from './scripts/router/router';

window.addEventListener("DOMContentLoaded", navigateToOnBootup);
window.addEventListener("popstate", router);

hello();

document.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    event.preventDefault();
    navigateTo(event.target.href);
  }
});

