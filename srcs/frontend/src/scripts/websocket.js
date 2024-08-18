// this function is called after the user has successfully logged in and closed when logged out.
// used for online/offline status.

export let usersocket;

export function initUserWebSocket() {
	usersocket = new WebSocket(`wss://${window.location.host}/ws/status/`);

	usersocket.onopen = (e) => {
		console.log("[open] Connection established");
		usersocket.send(JSON.stringify({ 'message': 'Hello Server!' }));
	};

	usersocket.onclose = (event) => {
		if (event.wasClean) {
			console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
		} else {
			console.error('[close] Connection died');
		}
	};

	usersocket.onerror = (error) => {
		console.error(`[error] ${error.message}`);
		//setTimeout(initUserWebSocket, 2000);
	};
}
// call from logout
export function closeUserWebSocket() {
	if (usersocket) {
		usersocket.close();
		usersocket = null;
	}
}