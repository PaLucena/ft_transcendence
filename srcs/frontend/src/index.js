import './styles/main.scss';
import 'bootstrap/dist/css/bootstrap.min.css';

import { router, navigateTo, navigateToOnBootup } from './scripts/router/router';

window.addEventListener("DOMContentLoaded", navigateToOnBootup);
window.addEventListener("popstate", router);


document.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    event.preventDefault();
    navigateTo(event.target.href);
  }
});

