import { Component } from '../Component.js';
import { Navbar } from '../../components/Navbar/Navbar.js';
import { ChatBtn } from '../../components/ChatBtn/ChatBtn.js';
import { routes } from '../router.js';

 export default async function renderStaticComponents() {
    const navbarContainer = document.getElementById('navbar');
    const chatbtnContainer = document.getElementById('chatbtn');

    const currentPath = window.location.pathname;
    const noNavbarRoutes = ["/login", "/signup", "/404"];

    const isValidRoute = Object.keys(routes).some(route => {
        const routeRegex = new RegExp(`^${route.replace(/:\w+/g, '[^/]+')}/?$`);
        console.log(`Testing route: ${route}, Regex: ${routeRegex}, Path: ${currentPath}`);
        return routeRegex.test(currentPath);
    });

    console.log(`isValidRoute: ${isValidRoute}`);

    if (isValidRoute && !noNavbarRoutes.includes(currentPath)) {
        if (navbarContainer && !navbarContainer.innerHTML.trim()) {
            await Component.renderComponent(Navbar, 'navbar');
        }
        if (chatbtnContainer && !chatbtnContainer.innerHTML.trim()) {
            await Component.renderComponent(ChatBtn, 'chatbtn');
        }
    }
}
