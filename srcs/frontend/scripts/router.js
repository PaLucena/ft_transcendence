class Page {
    constructor(route, params = {}) {
        this.route = route;
        this.params = params;
    }

    async render() {
      try {
        const html = await fetch(this.route).then(data => data.text());
        return html;
      } catch (error) {
        console.error("Error on loading page", error);
        return "<h2>Error on loading page</h2>";
      }
    }

    init() {
        // Function for init url
    }
}

class NotFound extends Page {
    constructor() {
      super("/pages/404.html");
    }
}

class Home extends Page {
    constructor() {
      super("/index.html");
    }
}

class Login extends Page {
    constructor() {
      super("/pages/login.html");
    }

    async render() {
      const html = await super.render();
      return html;
    }

    init() {
        this.initForm();
    }

    initForm() {
        const loginForm = document.querySelector("#loginForm");

        loginForm.addEventListener("submit", function(event) {
            event.preventDefault();

            const formData = new FormData(event.target);
            const jsonData = {};

            formData.forEach((value, key) => {
                jsonData[key] = value;
            });

            fetch("/api/login/", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonData)
            })
            .then(response => {
                if (response.status === 200)
                    return response.json();
                else { //TODO: Aqui tengo que manejar los códigos de error
                    return response.json().then(errData => {
                        console.error("Error ${response.status}:", errData);
                        throw new Error("Error ${response.status}");
                    });
                }
            })
            .then(data => {
                console.log("Login successful", data);
                localStorage.setItem("token", data.token);
                localStorage.setItem("avatar", getBase64Img(data.user.avatar));
                navigateTo("/play");
            })
            .catch((error) => {
                console.error("Login error: ", error);
            })
        })
    }
}

class Signup extends Page {
    constructor() {
      super("/pages/signup.html");
    }

    async render() {
      const html = await super.render();
      return html;
    }

    init() {
        this.initForm();
    }

    initForm() {
      const signupForm = document.querySelector("#signupForm");

      if (signupForm) {
        signupForm.addEventListener("submit", function(event) {
          event.preventDefault();

          const formData = new FormData(event.target);
          let jsonData = {};

          formData.forEach((value, key) => {
            jsonData[key] = value;
          });

          fetch("/api/signup/", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
          })
          .then(response => {
            if (response.status === 201)
              return response.json();
            else {
              return response.json().then(errData => {
                console.error(`Error ${response.status}:`, errData);
                throw new Error(`Error ${response.status}`);
              });
            }
          })
          .then(data => {
            console.log("Success", data);
            localStorage.setItem("token", data.token);
            navigateTo("/play");
          })
          .catch(error => {
            console.error("Error: ", error);
          });
        });
      }
    }
}

class Play extends Page {
    constructor() {
        super("/pages/play.html")
    }

    async render() {
        const html = await super.render();
        return html;
    }

    init() {
        applyNavbar();
        applyChat();
    }
}

class Friends extends Page {
    constructor() {
        super("/pages/friends.html")
    }

    async render() {
        const html = await super.render();
        return html;
    }

    init() {
        applyNavbar();
        applyChat();
    }
}

class Profile extends Page {
    constructor() {
        super("/pages/profile.html")
    }

    async render() {
        const html = await super.render();
        return html;
    }

    init() {
        applyNavbar();
        applyChat();
    }
}

class Auth extends Page {
    constructor() {
        super("/pages/auth.html")
    }

    async render() {
        const html = await super.render();
        return html;
    }

    init() {
        getApiToken()
    }
}

class Chat extends Page {
    constructor() {
        super("/pages/chat.html")
    }

    async render() {
        const html = await super.render();
        return html;
    }

    init() {
        initChat(this.params.chatId);
    }
}

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
    const routeParts = route.split('/');
    const pathParts = path.split('/');

    const params = {};

    routeParts.forEach((part, index) => {
        if (part.startsWith(':')) {
            const paramName = part.slice(1);
            params[paramName] = pathParts[index];
        }
    });

    return params;
}

async function router() {
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


function navigateTo(url) {
    window.history.pushState({}, "", url);
    router();
}

function navigateToOnBootup() {
    if (window.location.pathname === "/") {
        navigateTo("/login");
    } else {
        router();
    }
}

window.addEventListener("DOMContentLoaded", navigateToOnBootup);
window.addEventListener("popstate", router);

document.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
        event.preventDefault();
        navigateTo(event.target.href);
    }
});
