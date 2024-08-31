import { Component } from '../../scripts/Component.js';
import { Navbar } from '../../components/Navbar/Navbar.js';
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
	}
	
	destroy() {
		console.log('Friends Custom destroy');
		
		this.removeAllEventListeners();
		this.uiSetup.removeOnlineUpdateListeners();
	}
	
	async init() {
		await this.friendsLoader.loadFriendsData();
		this.uiSetup.setupFilterButtons();
		this.uiSetup.setupFriendButtons();
	}
}
