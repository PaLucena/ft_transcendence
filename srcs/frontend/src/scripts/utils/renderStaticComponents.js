import { Component } from '../Component.js';
import { Navbar } from "../../components/Navbar/Navbar.js";
import { ChatModal } from '../../components/ChatModal/ChatModal.js';
import { routes } from '../router.js';

export async function renderStaticComponents() {
    const currentPath = window.location.pathname.replace(/\/+$/, '');
    const isValidRoute = Object.keys(routes).some(route => {
        const routeRegex = new RegExp(`^${route.replace(/:\w+/g, '[^/]+')}/?$`);
        return routeRegex.test(currentPath);
    });

    for (const { ComponentClass, containerId, routesToExclude } of staticComponents) {
        const container = document.getElementById(containerId);
        const shouldRender = isValidRoute && !routesToExclude.some(route => {
            const routeRegex = new RegExp(`^${route.replace(/:\w+/g, '[^/]+')}/?$`);
            return routeRegex.test(currentPath);
        });

        if (container) {
            if (shouldRender) {
                if (!container.innerHTML.trim()) {
                    await Component.renderComponent(ComponentClass, containerId);
                }
            } else {
                container.innerHTML = '';
            }
        } else {
            console.warn(`Container with id "${containerId}" not found.`);
        }
    }
}

export const staticComponents = [
    { ComponentClass: Navbar, containerId: 'navbar', routesToExclude: ["/login", "/signup", "/auth", "/404", "/pong"] },
    { ComponentClass: ChatModal, containerId: 'chat_modal', routesToExclude: ["/login", "/signup", "/auth", "/404"] },
];

