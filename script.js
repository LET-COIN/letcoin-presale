
// LET-COIN Presale frontend (simulation-ready)
// - Read-only wallet connect (ethers.js + Web3Modal)
// - Solana: basic address input (no solana wallet connect library included to keep simple)
// - Price calc, modal confirm, localStorage records, CSV download on admin page
// - Real transaction code marked as TODO and commented

const DEFAULT_RATE = 56000; // LET per 1 BNB
const DEFAULT_HARDCAP = 5000000; // $
const DEFAULT_PRESALE_DAYS = 90;
const BSC_ETH_RECEIVER = "0x5fAE5Cca396C9A8e1F2a9bfCaBd72E9eF2530613";
const SOL_RECEIVER = "AHm9uUXj47qj7krfHq5VCKt7BAJPC2Uu3kPRGj37Lage";

let provider = null;
let signer = null;
let connectedAddress = null;
let web3Modal = null;

function initWeb3Modal(){
  const providerOptions = {
    walletconnect: {
      package: window.WalletConnectProvider.default,
      options: {
        rpc: {
          1: "https://mainnet.infura.io/v3/",
          56: "https://bsc-dataseed.binance.org/"
        }
      }
    }
  };
  web3Modal = new window.Web3Modal.default({ cacheProvider: false, providerOptions });
}

window.addEventListener('load', () => {
  initWeb3Modal();
  document.getElementById('connectBtn').addEventListener('click', onConnect);
  document.getElementById('payAmount').addEventListener('input', recalc);
  document.getElementById('network').addEventListener('change', recalc);
  document.getElementById('buyBtn').addEventListener('click', openConfirmModal);
  document.getElementById('cancelBtn').addEventListener('click', ()=>{document.getElementById('confirmModal').style.display='none';});
  document.getElementById('confirmBtn').addEventListener('click', confirmBuy);

  if (document.getElementById('saveSettings')){
    document.getElementById('saveSettings').addEventListener('click', saveAdminSettings);
    document.getElementById('downloadCsv').addEventListener('click', downloadCSV);
    document.getElementById('clearStorage').addEventListener('click', clearRecords);
    loadAdminSettings();
  }

  loadSettingsToUI();
  recalc();
});

async function onConnect(){
  try {
    const instance = await web3Modal.connect();
    provider = new ethers.providers.Web3Provider(instance);
    signer = provider.getSigner();
    connectedAddress = await signer.getAddress();
    document.getElementById('connectedInfo').innerText = 'Connected: ' + connectedAddress.slice(0,6) + '...' ;
  } catch (e) {
    const sol = prompt('أدخل عنوان محفظتك (أو الصق عنوان Solana إذا تستخدم SOL)');
    if (sol) {
      connectedAddress = sol;
      document.getElementById('connectedInfo').innerText = 'Connected: ' + connectedAddress.slice(0,8) + '...';
    }
  }
}

function getRate(){ return parseFloat(localStorage.getItem('let_rate') || DEFAULT_RATE); }
function getHardcap(){ return parseFloat(localStorage.getItem('let_hardcap') || DEFAULT_HARDCAP); }
function getPresaleDays(){ return parseInt(localStorage.getItem('let_days') || DEFAULT_PRESALE_DAYS); }
function getReceiver(network){ if(network==='sol') return localStorage.getItem('let_receiver_sol') || SOL_RECEIVER; return localStorage.getItem('let_receiver') || BSC_ETH_RECEIVER; }

function loadSettingsToUI(){
  document.getElementById('rate').innerText = getRate().toLocaleString() + " LET = 1 BNB";
  document.getElementById('hardcap').innerText = '$' + getHardcap().toLocaleString();
  document.getElementById('duration').innerText = (getPresaleDays()/30).toFixed(0) + " أشهر";
}

function recalc(){
  const pay = parseFloat(document.getElementById('payAmount').value) || 0;
  const net = document.getElementById('network').value;
  const rate = getRate();
  let letAmount = Math.floor(pay * rate);
  document.getElementById('letAmount').innerText = letAmount.toLocaleString();
  const fee = Math.max(0.0002, pay*0.01).toFixed(6);
  document.getElementById('feeEstimate').innerText = fee + ' (تقريبي)';
}

function openConfirmModal(){
  const pay = parseFloat(document.getElementById('payAmount').value) || 0;
  if (pay <= 0) return alert('أدخل مبلغ صالح');
  const net = document.getElementById('network').value;
  const letAmount = Math.floor(pay * getRate());
  const fee = Math.max(0.0002, pay*0.01);
  const receiver = getReceiver(net);
  const buyer = connectedAddress || 'not-connected';

  const details = `شبكة: ${net}<br/>مبلغ: ${pay}<br/>كمية LET متوقعة: ${letAmount.toLocaleString()}<br/>رسوم تقديرية: ${fee.toFixed(6)}<br/>عنوان الاستلام: ${receiver}<br/>المحفظة: ${buyer}`;
  document.getElementById('modalDetails').innerHTML = details;
  window._pending = { network: net, payAmount: pay, letAmount, feeEstimate: fee, receiver, buyer };
  document.getElementById('confirmModal').style.display='flex';
}

function confirmBuy(){
  const data = window._pending;
  if (!data) return;
  const timestamp = new Date().toISOString();
  const record = {
    timestamp,
    network: data.network,
    payAmount: data.payAmount,
    letAmount: data.letAmount,
    feeEstimate: data.feeEstimate,
    buyer: data.buyer,
    receiver: data.receiver
  };
  const key = 'let_presale_records';
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push(record);
  localStorage.setItem(key, JSON.stringify(existing));

  document.getElementById('confirmModal').style.display='none';
  document.getElementById('result').style.display='block';
  document.getElementById('receipt').innerHTML = `
    <p>تمت المحاكاة بنجاح: ${timestamp}</p>
    <p>شبكة: ${record.network}</p>
    <p>عدد LET المحجوزة: ${record.letAmount.toLocaleString()}</p>
    <p>المحفظة: ${record.buyer}</p>
    <p>عنوان الاستلام: ${record.receiver}</p>
  `;
}

function saveAdminSettings(){
  localStorage.setItem('let_rate', document.getElementById('adminRate').value);
  localStorage.setItem('let_hardcap', document.getElementById('adminHardcap').value);
  localStorage.setItem('let_days', document.getElementById('adminDuration').value);
  localStorage.setItem('let_receiver', document.getElementById('adminReceiver').value);
  localStorage.setItem('let_receiver_sol', document.getElementById('adminReceiverSol').value);
  alert('Saved locally in this browser.');
  loadSettingsToUI();
}

function downloadCSV(){
  const arr = JSON.parse(localStorage.getItem('let_presale_records') || '[]');
  if (!arr.length) return alert('لا توجد سجلات للتحميل');
  const csvRows = [['timestamp','buyer','network','payAmount','letAmount','feeEstimate','receiver'], ...arr.map(r => [r.timestamp,r.buyer,r.network,r.payAmount,r.letAmount,r.feeEstimate,r.receiver])];
  const csvContent = csvRows.map(e => e.join(',')).join('\\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'let_presale_records.csv'; a.click(); URL.revokeObjectURL(url);
}

function clearRecords(){
  if(confirm('مسح كل السجلات من هذا المتصفح؟')){
    localStorage.removeItem('let_presale_records');
    alert('تم المسح');
  }
}

function loadAdminSettings(){
  document.getElementById('adminRate').value = localStorage.getItem('let_rate') || DEFAULT_RATE;
  document.getElementById('adminHardcap').value = localStorage.getItem('let_hardcap') || DEFAULT_HARDCAP;
  document.getElementById('adminDuration').value = localStorage.getItem('let_days') || DEFAULT_PRESALE_DAYS;
  document.getElementById('adminReceiver').value = localStorage.getItem('let_receiver') || BSC_ETH_RECEIVER;
  document.getElementById('adminReceiverSol').value = localStorage.getItem('let_receiver_sol') || SOL_RECEIVER;
}
