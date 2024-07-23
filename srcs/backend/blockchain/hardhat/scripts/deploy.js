const fs = require("fs");
const hre = require("hardhat");
const path = require('path');
const { ethers } = hre;

async function main() {
    const Pong = await ethers.getContractFactory("PongTournament");
    const pong = await Pong.deploy();
    const address = await pong.getAddress();
    console.log("Contract deployed to address:", address);

    const contractName = 'PongTournament';
    const artifactsPath = path.join('artifacts', 'contracts', `${contractName}.sol`, `${contractName}.json`);
    const artifact = fs.readFileSync(artifactsPath, 'utf8');
    const { abi } = JSON.parse(artifact);

    const contract_data = {
        address: address,
        abi: JSON.stringify(abi, null, 2)
    };
    fs.writeFileSync("blockchain_shared/pong_contract.json", JSON.stringify(contract_data, null, 2));
}

main().catch(console.error);