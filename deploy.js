const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying by:", deployer.address);

  const totalSupply = ethers.utils.parseUnits("1000000000", 18); // 1,000,000,000
  const Letcoin = await ethers.getContractFactory("Letcoin");
  const token = await Letcoin.deploy(totalSupply);
  await token.deployed();
  console.log("Letcoin at:", token.address);

  // presale params for Letcoin
  // tokensPerBNB scaled by 1e18 for correct smallest-units math
  const price = ethers.utils.parseUnits("56000", 18); // 56,000 LEC per 1 BNB
  const now = Math.floor(Date.now() / 1000);
  const start = now + 30; // start in 30s
  const end = now + 30 * 24 * 3600; // 30 days
  const softCap = ethers.utils.parseEther("0"); // open (0)
  const hardCap = ethers.utils.parseEther("5000000"); // 5,000,000 BNB
  const min = ethers.utils.parseEther("0"); // no min
  const max = hardCap; // no per-wallet cap (effectively hardcap)
  const multisig = process.env.MULTISIG_ADDRESS || "0x5fAE5Cca396C9A8e1F2a9bfCaBd72E9eF2530613".replace(/\'/g, "");

  const Presale = await ethers.getContractFactory("Presale");
  const presale = await Presale.deploy(
    token.address,
    price,
    start,
    end,
    softCap,
    hardCap,
    min,
    max,
    multisig,
    false // whitelist disabled
  );
  await presale.deployed();
  console.log("Presale at:", presale.address);

  // tokensNeeded = hardCap * price / 1e18  => results in token smallest units
  const tokensNeeded = hardCap.mul(price).div(ethers.utils.parseEther("1"));
  await token.transfer(presale.address, tokensNeeded);
  console.log("Transferred tokens to presale:", tokensNeeded.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
