import { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function Home() {
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [account, setAccount] = useState();
  const [presaleAddr, setPresaleAddr] = useState("");
  const [contrib, setContrib] = useState("");

  useEffect(() => {
    if (window.ethereum) {
      const prov = new ethers.BrowserProvider(window.ethereum);
      setProvider(prov);
    }
  }, []);

  async function connect() {
    if (!provider) return alert("Install MetaMask or compatible wallet");
    await provider.send("eth_requestAccounts", []);
    const s = await provider.getSigner();
    setSigner(s);
    const a = await s.getAddress();
    setAccount(a);
  }

  async function contribute() {
    if (!signer) return alert("Connect first");
    if (!presaleAddr) return alert("Set Presale contract address");
    const val = ethers.parseEther(contrib || "0");
    const tx = await signer.sendTransaction({ to: presaleAddr, value: val });
    await tx.wait();
    alert("Contributed " + contrib + " BNB to Letcoin presale!");
  }

  return (
    <div style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <header>
        <h1>Letcoin (LEC) — Presale</h1>
        <p>Total supply: 1,000,000,000 LEC • Price: 56,000 LEC / 1 BNB • Hardcap: 5,000,000 BNB</p>
      </header>
      {!account ? <button onClick={connect}>Connect Wallet</button> : <div>Connected: {account}</div>}
      <div style={{ marginTop: 20 }}>
        <input placeholder="Presale contract address" value={presaleAddr} onChange={(e)=>setPresaleAddr(e.target.value)} style={{ width: 400 }} />
      </div>
      <div style={{ marginTop: 10 }}>
        <input placeholder="Amount in BNB" value={contrib} onChange={(e)=>setContrib(e.target.value)} />
        <button onClick={contribute} style={{ marginLeft: 8 }}>Contribute</button>
      </div>
      <section style={{ marginTop: 20 }}>
        <h3>Important</h3>
        <ul>
          <li>Soft cap: 0 (open presale).</li>
          <li>Whitelist: disabled. Anyone can participate.</li>
          <li>Make sure to test on BSC Testnet before mainnet deployment.</li>
        </ul>
      </section>
    </div>
  );
}
