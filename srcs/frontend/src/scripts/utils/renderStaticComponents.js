import { Component } from '../Component.js';
import { staticComponents } from './staticComponents.js';
import { routes } from '../router.js';

export default async function renderStaticComponents() {
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

