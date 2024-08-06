// this function is called after the user has successfully logged in and closed when logged out.
// used for online/offline status.

let socket;

export function initUserWebSocket() {
	socket = new WebSocket(`wss://${window.location.host}/ws/status/`);

	socket.onopen = (e) => {
		console.log("[open] Connection established");
		socket.send(JSON.stringify({ 'message': 'Hello Server!' }));
	};

	socket.onclose = (event) => {
		if (event.wasClean) {
			console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
		} else {
			console.error('[close] Connection died');
		}
	};

	socket.onerror = (error) => {
		console.error(`[error] ${error.message}`);
	};
}
// call from logout
export function closeUserWebSocket() {
	if (socket) {
		socket.close();
		socket = null;
	}
}