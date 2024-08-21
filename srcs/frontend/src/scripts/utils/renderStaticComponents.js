import { Component } from '../Component.js';
import { Navbar } from "../../components/Navbar/Navbar.js";
import { ChatModal } from '../../components/ChatModal/ChatModal.js';
import { routes } from '../router.js';

const navbarInstance = new Navbar();
const chatModalInstance = new ChatModal();

export async function renderStaticComponents() {
    const currentPath = window.location.pathname.replace(/\/+$/, '');
    const isValidRoute = Object.keys(routes).some(route => {
        const routeRegex = new RegExp(`^${route.replace(/:\w+/g, '[^/]+')}/?$`);
        return routeRegex.test(currentPath);
    });

    const staticComponents = [
        { instance: navbarInstance, containerId: 'navbar', routesToExclude: ["/login", "/signup", "/auth", "/404", "/pong"] },
        { instance: chatModalInstance, containerId: 'chat_modal', routesToExclude: ["/login", "/signup", "/auth", "/404"] },
    ];

    for (const { instance, containerId, routesToExclude } of staticComponents) {
        const container = document.getElementById(containerId);
        const shouldRender = isValidRoute && !routesToExclude.some(route => {
            const routeRegex = new RegExp(`^${route.replace(/:\w+/g, '[^/]+')}/?$`);
            return routeRegex.test(currentPath);
        });

        if (container) {
            if (shouldRender) {
                if (!container.innerHTML.trim()) {
                    await Component.renderComponent(instance, containerId);
                }
            } else {
                if (typeof instance.destroy === 'function') {
                    instance.destroy();
                }
                container.innerHTML = '';
            }
        } else {
            console.warn(`Container with id "${containerId}" not found.`);
        }
    }
}
