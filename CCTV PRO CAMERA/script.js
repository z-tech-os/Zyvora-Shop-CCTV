let peer, localStream, remoteStream, recorder, chunks=[], isRec=false;

let laptopId = 'bestie-' + Math.floor(1000+Math.random()*9000);

let wakeLock=null, blackMode=false;


async function keepScreenOn(){

try{

if('wakeLock' in navigator){

wakeLock=await navigator.wakeLock.request('screen');

document.getElementById('wakeBadge').textContent='Screen: Kept ON';

document.getElementById('wakeBadge').style.background='#0a84ff';

}

}catch(e){}

}


function beLaptop(){

document.getElementById('laptopBox').style.display='block';

document.getElementById('phoneBox').style.display='none';

peer=new Peer(laptopId);

peer.on('open', id=>{

document.getElementById('myIdText').textContent=id;

document.getElementById('qrcodeBox').innerHTML='';

new QRCode(document.getElementById('qrcodeBox'), {

text:id,

width:200,

height:200,

colorDark:"#000",

colorLight:"#fff"

});

document.getElementById('status').textContent='✅ QR Ready';

});


peer.on('call', call=>{

call.answer();

call.on('stream', stream=>{

remoteStream=stream;

document.getElementById('remoteVideo').srcObject=stream;

document.getElementById('liveText').textContent='● LIVE - 1:1 Square';

document.getElementById('liveText').style.color='red';

document.getElementById('recBtn').disabled=false;

document.getElementById('qrArea').style.display='none';

});

});

}


async function bePhone(){

document.getElementById('laptopBox').style.display='none';

document.getElementById('phoneBox').style.display='block';

try{

// BATTERY OPTIMIZATION - Low FPS, Low res, saves battery

localStream=await navigator.mediaDevices.getUserMedia({

video:{

width:{ideal:480},

height:{ideal:480},

aspectRatio:1,

facingMode:'environment',

frameRate:{ideal:10, max:12}

},

audio:{

echoCancellation:true,

noiseSuppression:true,

sampleRate:16000

}

});

document.getElementById('localVideo').srcObject=localStream;

peer=new Peer();

peer.on('open', ()=>{

document.getElementById('phoneStatus').textContent='Ready - Battery saver ON';

});

keepScreenOn();

document.getElementById('stealthBtn').style.display='block';

// Keep trying to keep awake

setInterval(()=>{

if(document.visibilityState==='visible' && !wakeLock){

keepScreenOn();

}

}, 5000);

}catch(e){

alert(e.message);

}

}


function connectPhone(){

const rid=document.getElementById('remoteId').value.trim();

if(!rid) return alert('Type Laptop ID');

document.getElementById('phoneStatus').textContent='Connecting...';

peer.call(rid, localStream);

document.getElementById('phoneStatus').textContent='✅ CONNECTED - You can now make screen black';

document.getElementById('phoneConnectArea').style.display='none';

}


// BLACK SCREEN MODE - Makes phone look OFF but still streaming

function toggleBlack(){

const b=document.getElementById('blackScreen');

blackMode=!blackMode;

if(blackMode){

b.classList.add('on');

document.getElementById('wakeBadge').textContent='Screen: BLACK (Saving battery)';

// Lower brightness if possible

if('getBrightness' in navigator){}

// Update time every second so you know it's alive

window.blackTimer=setInterval(()=>{

document.getElementById('blackTime').textContent=new Date().toLocaleTimeString()+' - Streaming...';

},1000);

}else{

b.classList.remove('on');

document.getElementById('wakeBadge').textContent='Screen: Normal';

clearInterval(window.blackTimer);

}

}


function startRec(){

chunks=[];

recorder=new MediaRecorder(remoteStream, {mimeType:'video/webm'});

recorder.ondataavailable=e=>{

if(e.data.size>0) chunks.push(e.data);

};

recorder.onstop=()=>{

const blob=new Blob(chunks,{type:'video/webm'});

const url=URL.createObjectURL(blob);

const div=document.createElement('div');

div.className='clipItem';

div.innerHTML=`<video src="${url}" controls style="width:100%;border-radius:8px;aspect-ratio:1/1;object-fit:cover"></video>

<p><small>${new Date().toLocaleTimeString()} • ${(blob.size/1024/1024).toFixed(2)} MB</small></p>

<button class="downBtn" onclick="let a=document.createElement('a');a.href='${url}';a.download='SHOP-'+Date.now()+'.webm';a.click()">
⬇️ Save
</button>

<button class="delBtn" onclick="if(confirm('Delete?')){URL.revokeObjectURL('${url}');this.closest('.clipItem').remove()}">
🗑️ Delete
</button>`;

document.getElementById('clips').prepend(div);

};

recorder.start();

isRec=true;

document.getElementById('recBtn').disabled=true;

document.getElementById('stopBtn').disabled=false;

document.getElementById('liveText').textContent='● REC';

}


function stopRec(){

if(recorder&&isRec){

recorder.stop();

isRec=false;

document.getElementById('recBtn').disabled=false;

document.getElementById('stopBtn').disabled=true;

document.getElementById('liveText').textContent='● LIVE';

}

}