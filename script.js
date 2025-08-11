// Simple Letcoin presale frontend script (ethers v6)
const connectBtn = document.getElementById('connectBtn');
const buyBtn = document.getElementById('buyBtn');
const presaleAddressInput = document.getElementById('presaleAddress');
const amountInput = document.getElementById('amount');

let provider = null;
let signer = null;
let userAddress = null;

// Countdown: 30 days from deploy (will be updated dynamically; default: 30 days from now)
const endTime = Date.now() + 30 * 24 * 3600 * 1000; // 30 days from now (ms)
function updateTimer() {
  const now = Date.now();
  let diff = Math.max(0, endTime - now);
  const days = Math.floor(diff / (24*3600*1000)); diff %= 24*3600*1000;
  const hours = Math.floor(diff / (3600*1000)); diff %= 3600*1000;
  const mins = Math.floor(diff / (60*1000)); diff %= 60*1000;
  const secs = Math.floor(diff/1000);
  document.getElementById('timer').innerText = `${days}d : ${hours}h : ${mins}m : ${secs}s`;
}
setInterval(updateTimer, 1000);
updateTimer();

async function connectWallet() {
  if (!window.ethereum) return alert('ثبت MetaMask أو محفظة متوافقة أولاً');
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();
  connectBtn.innerText = userAddress.substring(0,6) + '...' + userAddress.slice(-4);
}

async function buyToken() {
  if (!signer) return alert('اتصل بالمحفظة أولاً');
  const presaleAddr = presaleAddressInput.value.trim();
  if (!presaleAddr) return alert('ضع عنوان عقد الاكتتاب في الحقل أعلى');
  const amountStr = amountInput.value.trim();
  if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) return alert('أدخل مبلغ صحيح بالـBNB');
  const value = ethers.parseEther(amountStr);
  try {
    // send BNB to presale contract
    const tx = await signer.sendTransaction({ to: presaleAddr, value });
    alert('تم إرسال المعاملة، الرجاء الانتظار لتأكيدها. TxHash: ' + tx.hash);
    await tx.wait();
    alert('انتهت المعاملة بنجاح!');
  } catch (e) {
    console.error(e);
    alert('فشل إرسال المعاملة: ' + (e && e.message ? e.message : e));
  }
}

connectBtn.addEventListener('click', connectWallet);
buyBtn.addEventListener('click', buyToken);

// Helpful: prefill contract address with funds receiver as placeholder (optional)
presaleAddressInput.placeholder = '0x... (انسخ عنوان عقد Presale بعد النشر)';
