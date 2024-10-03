import { userSocket } from "./UserWebsocket.js";
import { pongTournamentSocket } from "../../pages/Tournament/PongTournamentSocket.js";

export function closeGlobalSockets() {
	userSocket.closeWebSocket();
	pongTournamentSocket.closeWebSocket();
}

export function initGlobalSockets() {
	userSocket.initWebSocket();
	pongTournamentSocket.initWebSocket();
}
