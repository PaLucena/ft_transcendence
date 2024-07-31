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
