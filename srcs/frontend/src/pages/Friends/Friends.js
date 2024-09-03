import { Component } from '../../scripts/Component.js';
import { Navbar } from '../../components/Navbar/Navbar.js';
import { navigateTo } from '../../scripts/Router.js';
import { FriendsLoader } from './FriendsLoader.js';
import { FriendsRenderer } from './FriendsRenderer.js';
import { UISetup } from './UISetup.js';


export class Friends extends Component {
	constructor(params = {}) {
		console.log('Friends Constructor');
		super('/pages/Friends/friends.html', params)

		this.filter = this.params.filter || 'all';

		this.friendsRenderer = new FriendsRenderer(this);
        this.friendsLoader = new FriendsLoader(this);
        this.uiSetup = new UISetup(this);
		//Navbar.focus();
	}
	
	destroy() {
		console.log('Friends Custom destroy');
		
		this.removeAllEventListeners();
		this.uiSetup.removeOnlineUpdateListeners();
		this.uiSetup.removeSearchFormEvents();
	}
	
	async init() {
		await Navbar.focus();
		await this.friendsLoader.loadFriendsData();
		this.uiSetup.setupSearchInputEvent();
		this.uiSetup.setupSearchForm();
		this.uiSetup.setupFilterButtons();
		this.uiSetup.setupFriendButtons();
		this.goToProfile();
	}

	goToProfile() {
        const users = document.querySelectorAll('[id^="userBtn-"]');

        users.forEach(user => {
            this.addEventListener(user, 'click', () => {
                const username = user.id.slice(8);
                
				navigateTo(`/profile/${username}`);
            });
        });
    }
}
