import { Login } from '../../pages/Login/Login';
import { Home } from '../../pages/Home/Home';
// import { Play } from '../../pages/Play/Play.js';
// import { Signup } from '../../pages/Signup/Signup.js';
// import { Chat } from '../../pages/Chat/Chat.js';
// import { NotFound } from '../../pages/NotFound/NotFound.js';
// import { Friends } from '../../pages/Friends/Friends.js';
import { Profile } from '../../pages/Profile/Profile';
// import { Auth } from '../../pages/Auth/Auth.js';

export function hello() {
  console.log("HY tehre!!")
}

const routes = {
  "/profile": Profile,
  "/": Home,
  "/login": Login,
  // "/404": NotFound,
  // "/signup": Signup,
  // "/play": Play,
  // "/friends": Friends,
  // "/auth": Auth,
  // "/chat": Chat,
  // "/chat/:chatId": Chat,
};

export default async function router() {
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

  // console.log(matchedRoute);
  // console.log(matchedParams);
  // const RouteClass = matchedRoute ? routes[matchedRoute] : routes["/404"];
  // const page = new RouteClass(matchedParams);
  // const html = await page.render();
  // document.getElementById("container").innerHTML = html;

  // page.init();

  console.log("Matched route:", matchedRoute);
  console.log("Matched params:", matchedParams);

  const RouteClass = matchedRoute ? routes[matchedRoute] : null;

  if (typeof RouteClass === 'function') {
    try {
      const page = new RouteClass(matchedParams);
      const html = await page.render();
      document.getElementById("root").innerHTML = html;
      page.init();
    } catch (error) {
      console.error('Error during rendering:', error);
    }
  } else {
    console.error('RouteClass is not a constructor or is null:', RouteClass);
    document.getElementById("root").innerHTML = "<h1>404 Not Found</h1>";
  }
}

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
