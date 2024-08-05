import { Component } from '../Component.js';
import { Navbar } from '../../components/Navbar/Navbar.js';
import { ChatBtn } from '../../components/ChatBtn/ChatBtn.js';


export async function renderNoRouterComponents() {
    await Component.renderComponent(Navbar, 'navbar')
    await Component.renderComponent(ChatBtn, 'chatbtn')
}

