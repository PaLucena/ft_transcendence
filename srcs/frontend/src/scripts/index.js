import { router, navigateTo, navigateToOnBootup } from './router/router.js';

window.addEventListener("DOMContentLoaded", navigateToOnBootup);
window.addEventListener("popstate", router);

document.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    event.preventDefault();
    navigateTo(event.target.href);
  }
});
