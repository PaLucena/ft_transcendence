require("@nomicfoundation/hardhat-toolbox")

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.0",
    networks: {
        hardhat: {
            accounts: {
              mnemonic: "test test test test test test test test test test test junk",
              count: 10
            }
        }
    }
};
