import { Navbar } from "../../components/Navbar/Navbar.js";
import { ChatBtn } from '../../components/ChatBtn/ChatBtn.js';

export const staticComponents = [
    { ComponentClass: Navbar, containerId: 'navbar', routesToExclude: ["/login", "/signup", "/404"] },
    { ComponentClass: ChatBtn, containerId: 'chatbtn', routesToExclude: ["/login", "/signup", "/404"] },
];
