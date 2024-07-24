FROM node:20

WORKDIR /app

COPY /hardhat/package*.json ./

RUN npm install

COPY ./hardhat/ .

RUN  chmod +x init_hardhat.sh

RUN mkdir "blockchain_shared"

EXPOSE 8545

CMD ["sh", "./init_hardhat.sh"]
