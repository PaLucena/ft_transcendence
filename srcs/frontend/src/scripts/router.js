import { Home } from './Home.js';
import { Login } from './Login.js';
import { Play } from './Play.js';
import { Signup } from './Signup.js';
import { Chat } from './Chat.js';
import { NotFound } from './NotFound.js';
import { Friends } from './Friends.js';
import { Profile } from './Profile.js';
import { Auth } from './Auth.js';

const routes = {
  "/404": NotFound,
  "/": Home,
  "/login": Login,
  "/signup": Signup,
  "/play": Play,
  "/friends": Friends,
  "/profile": Profile,
  "/auth": Auth,
  "/chat": Chat,
  "/chat/:chatId": Chat,
};

function extractParams(route, path) {
  const params = {};
  const routeParts = route.split('/');
  const pathParts = path.split('/');


  routeParts.forEach((part, index) => {
    if (part.startsWith(':')) {
      const paramName = part.slice(1);
      params[paramName] = pathParts[index];
    }
  });

  return params;
}

export async function router() {
  const path = window.location.pathname;

  let matchedRoute = null;
  let matchedParams = {};

  Object.keys(routes).forEach(route => {
    const routeRegex = new RegExp(`^${route.replace(/:\w+/g, '[^/]+')}$`);
    if (routeRegex.test(path)) {
      matchedRoute = route;
      matchedParams = extractParams(route, path);
    }
  });

  console.log(matchedRoute);
  console.log(matchedParams);
  const RouteClass = matchedRoute ? routes[matchedRoute] : routes["/404"];
  const page = new RouteClass(matchedParams);
  const html = await page.render();
  document.getElementById("container").innerHTML = html;

  page.init();
}
