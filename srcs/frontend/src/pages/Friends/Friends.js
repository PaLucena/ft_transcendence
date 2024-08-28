import { Component } from '../../scripts/Component.js';
import { FriendsLoader } from './FriendsLoader.js';
import { FriendsRenderer } from './FriendsRenderer.js';
import { UISetup } from './UISetup.js';

export class Friends extends Component {
	constructor() {
		console.log('Friends Constructor');
		super('/pages/Friends/friends.html')

		this.friendsRenderer = new FriendsRenderer(this);
        this.friendsLoader = new FriendsLoader(this);
        this.uiSetup = new UISetup(this);
	}

	destroy() {
		console.log('Friends Custom destroy');

		this.removeAllEventListeners();
	}

	async init() {

	}
}
