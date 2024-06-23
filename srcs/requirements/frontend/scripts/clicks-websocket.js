function connectWebSocket() {
	const socket = new WebSocket('ws://api/ws/counter/'); // URL del endpoint WebSocket

	socket.onopen = function(event) {
		console.log('WebSocket connection established.');
		// Opcional: Puedes enviar mensajes al servidor al establecer la conexión si es necesario
		// socket.send(JSON.stringify({ action: 'get_count' }));
	};

	socket.onmessage = function(event) {
		const data = JSON.parse(event.data);
		if (data.action === 'update_count') {
			document.getElementById('contador').textContent = data.count;
		}
	};

	socket.onclose = function(event) {
		console.log('WebSocket connection closed.');
		// Puedes intentar reconectar aquí si es necesario
		// connectWebSocket();
	};

	socket.onerror = function(error) {
		console.error('WebSocket error:', error);
	};
}

// Llamar a la función para iniciar la conexión WebSocket al cargar la página
document.addEventListener('DOMContentLoaded', function() {
	connectWebSocket();
});