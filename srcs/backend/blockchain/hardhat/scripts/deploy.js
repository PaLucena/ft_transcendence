const fs = require("fs");
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    const Pong = await ethers.getContractFactory("PongTournament");
    const pong = await Pong.deploy();

    const address = await pong.getAddress();
    console.log("Pong deployed to:", address);

    const accounts = await ethers.getSigners();
    const owner = accounts[0];

    console.log("Owner address:", owner.address);
    console.log("Owner private key:", process.env.BC_PRIVATE_KEY);

    const contract_data = {
        address: address,
        abi: pong.interface.format(ethers.utils.FormatTypes.json)
    };
    fs.writeFileSync("blockchain_shared/pong_contract.json", JSON.stringify(contract_data, null, 2));
}

main().catch(console.error);