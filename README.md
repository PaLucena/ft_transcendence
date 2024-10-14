# ft_transcendence

ft_transcendence is a full-stack web application built for the 42 programming school curriculum. It features a multiplayer online game with real-time chat, tournament tracking using blockchain, AI opponents, and user management. The application is designed using a microservices architecture, entirely containerized with Docker for easy deployment and scalability.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [Usage](#usage)
- [Docker Management](#docker-management)
- [Contributing](#contributing)
- [License](#license)
- [Collaborators](#collaborators)

## Features

- **Backend Framework:** The backend is built using Django, providing a scalable and maintainable architecture.
- **Frontend Framework:** Bootstrap is used for a responsive and mobile-friendly interface.
- **Database Integration:** PostgreSQL is used to handle all persistent data storage, including user accounts, tournaments, and game data.
- **Blockchain Integration:** Tournament data is stored on a blockchain for secure and verifiable records of results and participants.
- **User Management:** Includes standard user management features like registration, login, and authentication using the **42 API** for remote authentication.
- **Multiplayer Game:** Players can compete in real-time, with remote matchmaking functionality.
- **AI Opponent:** The game features an AI opponent for users to play against if no human players are available.
- **Live Chat:** Integrated real-time chat functionality allows players to communicate during the game.
- **Microservices Architecture:** The application is structured into modular microservices, enhancing scalability and maintainability.
- **Dockerized:** The entire project is containerized with Docker, making deployment simple and consistent across environments.
- **Cross-Browser Compatibility:** The app works seamlessly across modern browsers, ensuring a smooth user experience.
- **Multilingual Support:** The interface supports multiple languages, allowing users to switch between them effortlessly.
- **Redis Integration:** Redis is used for caching and managing real-time events such as the live chat and game updates.

## Tech Stack

- **Backend:**
	- Django (Python)
	- PostgreSQL (Database)
	- REST APIs
	- Redis (for caching and real-time data)
	- Blockchain (for tournament data)
- **Frontend:**
	- Bootstrap (CSS framework)
	- JavaScript (ES6+)
	- HTML5 / CSS3
- **Authentication:**
	 API for OAuth-based remote authentication
- **Microservices:**
	- Docker for containerization
	- Redis for real-time functionality

## Setup

### Prerequisites

	- Unix-based operating system

	Ensure the following are installed on your machine:
	- Docker
	- Docker Compose

### Installation

1. Clone the repository:
	```bash
	git clone https://github.com/your_username/ft_transcendence.git
	cd ft_transcendence
	```

2. Set up environment variables:
	reate a `.env` file based on the `.env.example` file and configure it with your environment details, including your 42 API credentials, PostgreSQL, Redis, and blockchain configurations.

3. Build and run the application using Docker Compose through Makeflie:
	```bash
	make
	```

	This will start all necessary services, including the backend (Django), PostgreSQL, Redis, and any additional microservices.

### Blockchain Setup

	To enable blockchain integration for tournament data storage, ensure that your blockchain node or service is properly configured. Update the relevant environment variables in the `.env` file for the blockchain connection.

## Usage

1. **User Registration & Login:**
	Users can register and log in using the in-app authentication system, or via the 42 API for OAuth-based authentication.

2. **Game Play:**
	- Players can challenge each other to real-time multiplayer matches.
	- If no human players are available, users can play against an AI opponent.

3. **Live Chat:**
	ayers can use the integrated real-time chat to communicate during games.

4. **Tournaments:**
	- Players can join and participate in tournaments, with all results stored securely on the blockchain.
	- The tournament history is verifiable through the blockchain.

5. **Multilingual Support:**
	Users can change the interface language from the settings menu.

## Docker Management

- **Stopping the services:**
	```bash
	make clean
	```
- **Rebuilding the containers after code changes:**
	```bash
	make re
	```
- **Watch container logs:**
	```bash
	make logs
	```

## Contributing

We welcome contributions! If you'd like to contribute, please follow these steps:

1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature-xyz`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature-xyz`).
5. Open a pull request for review.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Collaborators

- [Gabriela Krusta](https://github.com/gkrusta)
- [Davyd Bredykhin](https://github.com/BredyByte)
- [Enrique Algar Ceular](https://github.com/ealgar-c)
- [Pablo Vilchez Rodriguez](https://github.com/pablovilchez)

