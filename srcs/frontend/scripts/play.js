const socket = new WebSocket(`wss://${window.location.host}/ws/status/`);

socket.onopen = function(e) {
	console.log("[open] Connection established");
	socket.send(JSON.stringify({ 'message': 'Hello Server!' }));
	//setInterval(null, 3600)
};

socket.onmessage = function(event) {
	console.log(`[message] Data received from server: ${event.data}`);
};

socket.onclose = function(event) {
	if (event.wasClean) {
		console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
	} else {
		console.error('[close] Connection died');
	}
};

socket.onerror = function(error) {
	console.error(`[error] ${error.message}`);
};

function oneVSoneBtn() {
	document.getElementById("btns").style.display = "none";
	document.getElementById("dropdownOne").style.display = "block";
}

function tournamentBtn() {
	document.getElementById("btns").style.display = "none";
	document.getElementById("dropdownTwo").style.display = "block";
}

function	hideDropdown() {
	document.getElementById("dropdownOne").style.display = "none";
	document.getElementById("dropdownTwo").style.display = "none";
	document.getElementById("btns").style.display = "block";
}