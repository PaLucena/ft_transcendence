import { Navbar } from "../../components/Navbar/Navbar.js";
import { ChatModal } from '../../components/ChatModal/ChatModal.js';

export const staticComponents = [
    { ComponentClass: Navbar, containerId: 'navbar', routesToExclude: ["/login", "/signup", "/auth", "/404", "/pong"] },
    { ComponentClass: ChatModal, containerId: 'chat_modal', routesToExclude: ["/login", "/signup", "/auth", "/404"] },
];
