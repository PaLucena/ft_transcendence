// Initialize WebSocket connection
let socket = new WebSocket(`wss://${window.location.host}/ws/clicks/`);

// Function to handle WebSocket open
socket.onopen = function(event) {
    console.log("WebSocket connection established.");
    // Start periodic polling every 5 seconds
    setInterval(getCountUpdate, 100);  // Adjust interval as needed
};

// Function to handle WebSocket messages
socket.onmessage = function(event) {
    let data = JSON.parse(event.data);
    console.log("Count value:", data.count);

    // Update the count in the HTML
    document.getElementById('contador').innerText = data.count;
};

// Function to request count update
function getCountUpdate() {
    // Check WebSocket state before sending
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({'action': 'get_count'}));
    } else {
        console.error('WebSocket not open.');
    }
}
