
// Fancy LET-COIN Presale (simulation-ready)
const DEFAULT_RATE = 56000;
const DEFAULT_HARDCAP = 5000000;
const DEFAULT_DAYS = 90;
const BSC_ETH_RECEIVER = "0x5fAE5Cca396C9A8e1F2a9bfCaBd72E9eF2530613";
const SOL_RECEIVER = "AHm9uUXj47qj7krfHq5VCKt7BAJPC2Uu3kPRGj37Lage";

let provider=null, signer=null, connectedAddress=null, web3Modal=null;

function initWeb3Modal(){
  const providerOptions = {
    walletconnect: { package: window.WalletConnectProvider.default, options:{ rpc:{1:"https://mainnet.infura.io/v3/",56:"https://bsc-dataseed.binance.org/"}} }
  };
  web3Modal = new window.Web3Modal.default({ cacheProvider:false, providerOptions });
}

window.addEventListener('load', ()=>{
  initWeb3Modal();
  document.getElementById('connectBtn').addEventListener('click', onConnect);
  document.getElementById('payAmount').addEventListener('input', recalc);
  document.getElementById('network').addEventListener('change', recalc);
  document.getElementById('buyBtn').addEventListener('click', openConfirmModal);
  document.getElementById('cancelBtn').addEventListener('click', ()=>document.getElementById('confirmModal').style.display='none');
  document.getElementById('confirmBtn').addEventListener('click', confirmBuy);
  loadSettings();
  startCountdown(getPresaleDays());
});

async function onConnect(){
  try{
    const instance = await web3Modal.connect();
    provider = new ethers.providers.Web3Provider(instance);
    signer = provider.getSigner();
    connectedAddress = await signer.getAddress();
    document.getElementById('connectedInfo').innerText = 'متصل: '+connectedAddress.slice(0,8)+'...';
  }catch(e){
    const sol = prompt('أدخل عنوان محفظتك (Solana أو لصق العنوان)');
    if(sol){ connectedAddress = sol; document.getElementById('connectedInfo').innerText='متصل: '+connectedAddress.slice(0,10)+'...'; }
  }
}

function getRate(){ return parseFloat(localStorage.getItem('let_rate')||DEFAULT_RATE); }
function getPresaleDays(){ return parseInt(localStorage.getItem('let_days')||DEFAULT_DAYS); }
function getHardcap(){ return parseFloat(localStorage.getItem('let_hardcap')||DEFAULT_HARDCAP); }
function getReceiver(net){ if(net==='sol') return localStorage.getItem('let_receiver_sol')||SOL_RECEIVER; return localStorage.getItem('let_receiver')||BSC_ETH_RECEIVER; }

function loadSettings(){
  document.getElementById('rate').innerText = getRate().toLocaleString() + " LET = 1 BNB";
  document.getElementById('hardcap').innerText = '$'+getHardcap().toLocaleString();
}

function recalc(){
  const pay = parseFloat(document.getElementById('payAmount').value)||0;
  const rate = getRate();
  const letAmount = Math.floor(pay * rate);
  document.getElementById('letAmount').innerText = letAmount.toLocaleString();
  const fee = Math.max(0.0002, pay*0.01).toFixed(6);
  document.getElementById('feeEstimate').innerText = fee+' (تقريبي)';
}

// modal + records
function openConfirmModal(){
  const pay = parseFloat(document.getElementById('payAmount').value)||0;
  if(pay<=0) return alert('أدخل مبلغ صالح');
  const net = document.getElementById('network').value;
  const letAmount = Math.floor(pay * getRate());
  const fee = Math.max(0.0002, pay*0.01);
  const receiver = getReceiver(net);
  const buyer = connectedAddress||'not-connected';
  const details = `شبكة: ${net}<br/>مبلغ: ${pay}<br/>كمية LET متوقعة: ${letAmount.toLocaleString()}<br/>رسوم تقديرية: ${fee.toFixed(6)}<br/>عنوان الاستلام: ${receiver}<br/>المحفظة: ${buyer}`;
  document.getElementById('modalDetails').innerHTML = details;
  window._pending = { network:net, payAmount:pay, letAmount, feeEstimate:fee, receiver, buyer };
  document.getElementById('confirmModal').style.display='flex';
}

function confirmBuy(){
  const data = window._pending; if(!data) return;
  const ts = new Date().toISOString();
  const rec = { timestamp:ts, network:data.network, payAmount:data.payAmount, letAmount:data.letAmount, feeEstimate:data.feeEstimate, buyer:data.buyer, receiver:data.receiver };
  const key='let_presale_records'; const ex = JSON.parse(localStorage.getItem(key)||'[]'); ex.push(rec); localStorage.setItem(key, JSON.stringify(ex));
  document.getElementById('confirmModal').style.display='none'; document.getElementById('result').style.display='block';
  document.getElementById('receipt').innerHTML = `<p>تمت المحاكاة: ${ts}</p><p>شبكة: ${rec.network}</p><p>عدد LET: ${rec.letAmount.toLocaleString()}</p><p>المحفظة: ${rec.buyer}</p><p>المستلم: ${rec.receiver}</p>`;
}

// admin functions
function saveAdminSettings(){ localStorage.setItem('let_rate', document.getElementById('adminRate').value); localStorage.setItem('let_hardcap', document.getElementById('adminHardcap').value); localStorage.setItem('let_days', document.getElementById('adminDuration').value); localStorage.setItem('let_receiver', document.getElementById('adminReceiver').value); localStorage.setItem('let_receiver_sol', document.getElementById('adminReceiverSol').value); alert('تم الحفظ محلياً'); loadSettings(); }
function downloadCSV(){ const arr = JSON.parse(localStorage.getItem('let_presale_records')||'[]'); if(!arr.length) return alert('لا سجلات'); const rows=[['timestamp','buyer','network','payAmount','letAmount','feeEstimate','receiver'], ...arr.map(r=>[r.timestamp,r.buyer,r.network,r.payAmount,r.letAmount,r.feeEstimate,r.receiver])]; const csv=rows.map(r=>r.join(',')).join('\\n'); const b=new Blob([csv],{type:'text/csv'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download='let_presale_records.csv'; a.click(); URL.revokeObjectURL(u); }
function clearRecords(){ if(confirm('مسح كل السجلات؟')){ localStorage.removeItem('let_presale_records'); alert('تم المسح'); } }
function loadAdminSettings(){ document.getElementById('adminRate').value=localStorage.getItem('let_rate')||DEFAULT_RATE; document.getElementById('adminHardcap').value=localStorage.getItem('let_hardcap')||DEFAULT_HARDCAP; document.getElementById('adminDuration').value=localStorage.getItem('let_days')||DEFAULT_DAYS; document.getElementById('adminReceiver').value=localStorage.getItem('let_receiver')||BSC_ETH_RECEIVER; document.getElementById('adminReceiverSol').value=localStorage.getItem('let_receiver_sol')||SOL_RECEIVER; loadSettings(); }

// countdown
function startCountdown(days){
  const end = new Date(); end.setDate(end.getDate() + days);
  const iv = setInterval(()=>{
    const now=new Date(); const diff=end-now; if(diff<=0){ clearInterval(iv); document.getElementById('days').innerText='0'; document.getElementById('hours').innerText='00'; document.getElementById('minutes').innerText='00'; document.getElementById('seconds').innerText='00'; return; }
    const d=Math.floor(diff/86400000); const h=Math.floor((diff%86400000)/3600000); const m=Math.floor((diff%3600000)/60000); const s=Math.floor((diff%60000)/1000);
    document.getElementById('days').innerText=d; document.getElementById('hours').innerText=String(h).padStart(2,'0'); document.getElementById('minutes').innerText=String(m).padStart(2,'0'); document.getElementById('seconds').innerText=String(s).padStart(2,'0');
  },1000);
}
