/*
    SWR EXPERIMENTALSTUDIO 08/2023
    Maurice Oeser

    FREEDOM COLLECTIVE - Davor Vincze
    Soundfile Controler MSync
    
    Client
*/

let currentScene = 0;
let isPlaying = false;
const connectionStatus = document.getElementById('connectionStatus');
const videoHint = document.getElementById('video_tab_hint');

const avatarSecretary = document.getElementById('waitavatar_secretary');
const avatarSzusi = document.getElementById('waitavatar_szusi');
const avatarFan = document.getElementById('waitavatar_fan');
const avatarKarl = document.getElementById('waitavatar_karl');
const avatarAndre = document.getElementById('waitavatar_andre');

const WAIT_AVATARS = [avatarSecretary, avatarSzusi, avatarFan, avatarKarl, avatarAndre];

let onWaitScreen = false;
let avatarIndex = 0;
let lastAvatarIndex = -1;
let avatarTimeout;

function setOnWaitScreen(state)
{
    if(state == onWaitScreen)
        return;

    onWaitScreen = state;

    if(onWaitScreen)
    {
        showNextAvatar();
        avatarTimeout = setInterval(showNextAvatar, 12000);
    }

    else
    {
        clearInterval(avatarTimeout);

        for(let ava of WAIT_AVATARS)
        {
            ava.classList.remove('screen-avatar-active');
        }
    }
}

function showNextAvatar()
{
    WAIT_AVATARS[avatarIndex].classList.add('screen-avatar-active');

    if(lastAvatarIndex != -1)
    {
        WAIT_AVATARS[lastAvatarIndex].classList.remove('screen-avatar-active');
    }

    lastAvatarIndex = avatarIndex;
    avatarIndex = (avatarIndex + 1) % WAIT_AVATARS.length;

}



/*
Debug Flag, wenn activ wird die DBG() Funktion ausgeführt, so kann man schnell global 
alle console.logs() aktivieren bzw. deaktivieren
*/
const bDBG = true;

//const debugHeader = document.getElementById('debug'); // nur zum debuggen, TODO: Löschen
const progress = document.getElementById('progress');
const connectBtn = document.getElementById('connect_btn_container');
const incomingchat = document.getElementById('incomingchat');
const content = document.getElementById('content');
const chatcontent = document.getElementById('chatcontent');
const chatscreen = document.getElementById('chatscreen');
const videoscreen = document.getElementById('videoscreen');
const waitscreen = document.getElementById('waitscreen');
const pulses = document.getElementsByClassName('pulse');
const pulses_play = document.getElementsByClassName('pulse_play');

const video_1 = document.getElementById('video_1');
const video_2 = document.getElementById('video_2');

const VIDEO_SOURCES_POSES = 
[
    'scaled_Alle_Dach_video.mp4',
    'scaled_Andrei_1_video.mp4',
    'scaled_Andrei_2_video.mp4',
    'scaled_Andrei_Foyer_Nebel_video.mp4',
    'scaled_Andrei_Zwischendach_1_video.mp4',
    'scaled_Andrei_Zwischendach_2_video.mp4',
    'scaled_Fan_1_video.mp4',
    'scaled_Fan_2_video.mp4',
    'scaled_Karl_1_video.mp4',
    'scaled_Karl_2_video.mp4',
    'scaled_Opponent_Markus_1_video.mp4',
    'scaled_Opponent_Martin_1_video.mp4',
    'scaled_Opponent_Martin_2_video.mp4',
    'scaled_Secretary_1_video.mp4',
    'scaled_Secretary_2_video.mp4',
    'scaled_Secretary_3_video.mp4',
    'scaled_Zsuzsi_1_video.mp4',
    'scaled_Zsuzsi_4_video.mp4'
];


const VIDEO_SOURCES_DACH = 
[
    'scaled_Dach_1_video.mp4',
    'scaled_Dach_3_video.mp4',
    'scaled_Dach_4_video.mp4',
]



let numVideosInScene = VIDEO_SOURCES_POSES.length;

videoscreen.addEventListener('click', () => {
    playVideo();
    videoHint.style.display = "none";
})






/*
    Prevent the user screen from turning off.
    Either by wakeLock API or if not supported (Firefox) by NoSleep.js => which might be buggy, have to check
*/
const noSleep = new NoSleep();
let wakeLock = null;

const requestWakeLock = async () => {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
}





/*
    ==============================================================
    ======================= SOCKET.IO ============================
    ==============================================================
*/

const socket = io({
    reconnection: true,        
    reconnectionAttempts: Infinity, 
    reconnectionDelay: 1000,   
    reconnectionDelayMax: 5000,
    timeout: 20000,  
    query: {
        admin: false
    }});


socket.on('connected', (state) => {
    loadSounds(state.voice);
    connectionStatus.innerHTML = "CONNECTED";
});

let pingTimeout;

function ping()
{
   
}

let dummyCounter = 0;
socket.on('pong', () => {
    SOUNDS[3].play();
    dummyCounter += 1;
})

function pingFailed()
{
    // TODO what to do if ping failed
    DBG("PING FAILED! CONNECTION DISTURBED!");
    
}

socket.on('activation', (state) => {

    if(currentScene == state.scene || !isConnected)
        return;

    preloadVideo(currentScene);
    loadScene(currentScene, state.time);
    
});

socket.on('disconnect', (data) => {
    isConnected = false;
    connectionStatus.innerHTML = "DISCONNECTED! <p class='text-2xl'>Try reloading the page</p>";
});   

socket.on('start', (scene) => {
    loadScene(scene);
});

socket.on('stop', () => {

    if(currentScene != 0)
        loadScene(0);
});



function loadScene(scene, time = 0)
{
    if(currentScene == scene)
        return;

    currentScene = scene;

    switch(scene)
    {
        case 0:
            showWaitScreen();
            stopAllSound();
            numVideosInScene = VIDEO_SOURCES_POSES.length;
            stopVideos();
            resetChat();
            IsInChat = false;
            isPlaying = false;
            break;
        case 1:
            waitscreen.style.display = "none";
            chatscreen.style.display = "none";
            incomingchat.style.display = "none";
            showVideoScreen();
            IsInChat = false;
            playVideo();
            playSound(0, time);
            isPlaying = true;
            break;
        case 2:
            waitscreen.style.display = "none";
            videoscreen.style.display = "none";
            chatscreen.style.display = "none";
            preloadVideo(3);
            showIncomingChat();
            displayChat(time);
            playSound(1, time);
            isPlaying = true;
            break;
        case 3:
            waitscreen.style.display = "none";
            chatscreen.style.display = "none";
            incomingchat.style.display = "none";
            preloadVideo(3);
            showVideoScreen();
            IsInChat = false;
            numVideosInScene = VIDEO_SOURCES_DACH.length;
            playSound(2, time);
            playVideo();
            isPlaying = true;
            break;
        default:
            break;
    }

    
}

let inFadeAnimation = false;

function showWaitScreen()
{
    if(isPlaying)
    {
        inFadeAnimation = true;
        content.classList.add('fadeOutContent');

        setTimeout(() => {
            videoscreen.style.display = "none";
            incomingchat.style.display = "none";
            chatscreen.style.display = "none";
            waitscreen.style.display = "flex";
            setOnWaitScreen(true);
            content.classList.remove('fadeOutContent');
            inFadeAnimation = false;
        }, 3800);
    }

    else if(!isPlaying && !inFadeAnimation)
    {
        videoscreen.style.display = "none";
        incomingchat.style.display = "none";
        chatscreen.style.display = "none";
        waitscreen.style.display = "flex";
    
        setOnWaitScreen(true);
    }
   
}


function showVideoScreen()
{
    videoscreen.style.display = "flex";
    videoHint.style.display = "block";
    videoHint.classList.add('video_hint_anim');

    setTimeout(() => {
        videoHint.classList.remove('video_hint_anim');
    }, 4100);

}


/*
    ==============================================================
    =========================== AUDIO ============================
    ==============================================================
*/

let SOUNDS = [];


function playSound(sound, time = 0)
{
    SOUNDS[sound].play();
    SOUNDS[sound].seek(time);
}

let currentlyActivePlayer = 1;
let currentVideo = 0;

function preloadVideo(scene)
{

    if(scene === 1 || scene === 0)
    {
        video_1.src = `/Videos/${VIDEO_SOURCES_POSES[0]}`;
    }

    else
    {
        video_1.src = `/Videos/${VIDEO_SOURCES_DACH[0]}`;
    }

    currentVideo = 0;
    currentlyActivePlayer = 0;
}

function playVideo()
{
    currentVideo = (currentVideo + 1) %  numVideosInScene;

    if(currentlyActivePlayer === 0)
    {
        video_1.play();
        video_1.classList.remove('hidden');
        
        video_2.classList.add('hidden');
        video_2.src = currentScene === 1 ? `/Videos/${VIDEO_SOURCES_POSES[currentVideo]}` : `/Videos/${VIDEO_SOURCES_DACH[currentVideo]}`;

        currentlyActivePlayer = 1;
    }

    else
    {
        video_2.play();
        video_2.classList.remove('hidden');
        
        video_1.classList.add('hidden');
        video_1.src = currentScene === 1 ? `/Videos/${VIDEO_SOURCES_POSES[currentVideo]}` : `/Videos/${VIDEO_SOURCES_DACH[currentVideo]}`;

        currentlyActivePlayer = 0;
    }

    
}

function stopVideos()
{
    video_1.pause();
    video_2.pause();
}


function stopAllSound()
{
    for(let i = 0; i < SOUNDS.length; ++i)
    {
        SOUNDS[i].stop();
    }
}

let loadTimeout;

function loadSounds(voiceid)
{

    SOUNDS[0] = new Howl({
        src: [`Samples/PNO/PNO_H_${voiceid+1}.mp3`],
        onload: function() {
            incrementSFLoaded();
           }
      }); 


    SOUNDS[1] = new Howl({
        src: [`Samples/NOT/NOT_H_${voiceid+1}.mp3`],
        onload: function() {
            incrementSFLoaded();
           }
    }); 

    SOUNDS[2] = new Howl({
        src: [`Samples/FLT/FLT_H_${voiceid+1}.mp3`],
        onload: function() {
            incrementSFLoaded();
           }
    }); 

    SOUNDS[3] = new Howl({
        src: [`Samples/freedom-collective.mp3`],
        html5: true,
        false: true,
        onload: function() {
            incrementSFLoaded();
           }
    }); 
}



function unmuteWebAudio()
{
    // Create an audio context instance if WebAudio is supported
    let context = (window.AudioContext || window.webkitAudioContext) ?
    new (window.AudioContext || window.webkitAudioContext)() : null;

    // Decide on some parameters
    let allowBackgroundPlayback = false; // default false, recommended false
    let forceIOSBehavior = false; // default false, recommended false
    // Pass it to unmute if the context exists... ie WebAudio is supported
    if (context)
    {
        // If you need to be able to disable unmute at a later time, you can use the returned handle's dispose() method
        // if you don't need to do that (most folks won't) then you can simply ignore the return value
        let unmuteHandle = unmute(context, allowBackgroundPlayback, forceIOSBehavior);

        // ... at some later point you wish to STOP unmute control
        unmuteHandle.dispose();
        unmuteHandle = null;
    }
}



const SoundfilesToLoad = 4;
let soundfilesLoaded = 0;

function incrementSFLoaded()
{
    soundfilesLoaded++;

    if(soundfilesLoaded === SoundfilesToLoad)
    {
        document.getElementById('loading_container').style.display = "none";
        connectBtn.style.display = "block";
    }
}



// function loadSound(url, retryCount = 0) {
//     const maxRetries = 5; // Set a max number of retries to avoid infinite loops
//     const audio = new Audio(url);
   
//     audio.addEventListener('error', () => {
//         console.error(`Error loading sound file: ${url}`);

//         if (retryCount < maxRetries) {
//             console.log(`Attempting to reload sound file. Retry ${retryCount + 1}`);
//             loadSound(url, retryCount + 1); // Retry loading the sound
//         } else {
//             location.reload();
//             console.error("ERROR LOADING SOUNDFILES");
//             // Handle the failure, perhaps by notifying the user or disabling sound-related functionality
//         }
//     });

//     audio.addEventListener('canplaythrough', () => {
//         // The entire audio is likely to play without interruption
//         incrementSFLoaded();
//     });

//     audio.load();
//     return audio;
// }





/*
    Activation Funktion, wenn user connect button klickt.
    Browser muten Audio-Kontext bis der user eine Aktion auf der Webseite durchführt.
    Daher beginnt Audio-Logik erst nachdem user sich "activated" hat

*/
let isConnected = false;
connectBtn.onclick = () =>
{
    if(isConnected)
        return;

    unmuteWebAudio();
   



    goFullscreen();
    socket.emit("activate");
    // document.getElementById('connect_btn').style.color = "green";
    document.getElementById('connect_btn').innerHTML = "&#10003";
    pulses[0].style.animationIterationCount = "1";
    pulses[1].style.animationIterationCount = "1";

    setTimeout(() => {
        document.getElementById('connect_btn').classList.add('grow');
    }, 750);

    isConnected = true;

    setTimeout(() => {
        document.getElementById('startscreen').style.display = "none";
        document.getElementById('content').style.display = "flex";
        setOnWaitScreen(true);
    }, 1200)

    // wakelock
    if ('wakeLock' in navigator) {
        requestWakeLock();
    } else {

        if(detectMobile())
        {
            enableNoSleep();
        }
            
    }
}


function goFullscreen()
{
    if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) { /* Firefox */
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { /* IE/Edge */
            document.documentElement.msRequestFullscreen();
        }
        else
        {
            console.log("NO FULLSCREEN SUPPORT");
        }
    }


    // var requestFullScreen = document.documentElement.requestFullscreen || document.documentElement.mozRequestFullScreen || document.documentElement.webkitRequestFullscreen || document.documentElement.msRequestFullscreen;
    // requestFullScreen.call(document.documentElement);
}

function detectMobile() {
    const ua = navigator.userAgent;
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        return true;
    } else {
        return false;
    }
}


function enableNoSleep()
{
    noSleep.enable();
}



/*
    Interaction 
*/

/*
    LOGIC Flags
*/

let IsInChat = false;


// DEBUG
// document.getElementById('waitscreen').style.display = "none";
// document.getElementById('startscreen').style.display = "none";
// document.getElementById('content').style.display = "flex";
// document.getElementById('chatscreen').style.display = "none";


function showIncomingChat()
{
    document.getElementById('incomingchat').style.display = "flex";
}


function hideChat()
{
    document.getElementById('chatscreen').style.display = "none";
    document.getElementById('waitscreen').style.display = "flex";
}

incomingchat.addEventListener('click', () => {
    document.getElementById('incomingchat').style.display = "none";
    document.getElementById('chatscreen').style.display = "block";
    IsInChat = true;
});




let ChatTimeouts = [];
let chatMessageIndex = 0;
let waitTime = 0;
let lastMessage;


function resetChat()
{
    chatMessageIndex = 0;

    for(let timeout of ChatTimeouts)
    {
        clearTimeout(timeout);
    }

    chatcontent.innerHTML = "";
    ChatTimeouts = [];
    waitTime = 0;
}

function createChatMessage(side, repost, msg)
{
    let chatmsg = document.createElement('div');
    chatmsg.classList.add('chatmessage');


    if(!repost)
    {
        let header = document.createElement('h1');
        header.classList.add('text-white');
        header.classList.add('text-1xl');
        header.classList.add('ml-2');
        header.textContent = side == 'left' ? 'ZSUZSI' : 'KARL';
        chatmsg.appendChild(header);
    }

    let chatbubble = document.createElement('div');
    chatbubble.classList.add('bg-white'); 

   
    let text = document.createElement('p');
    text.innerHTML = msg;
    text.classList.add('text-black');
    text.classList.add('text-1xl');
    
    if(side === 'left')
    {
        chatmsg.classList.add('mb-3');
        chatbubble.classList.add('chatbubble_a');
    }
    
    else
    {
        chatmsg.classList.add('mr-2');
        chatmsg.classList.add('ml-auto');
        chatbubble.classList.add('chatbubble_b');
        
    }

    chatbubble.appendChild(text);


    chatmsg.appendChild(chatbubble);

    return chatmsg;
}

function postChatMessage(msg)
{
    chatcontent.appendChild(msg);
    chatcontent.scrollTop = chatcontent.scrollHeight;
}

function displayChat(time = 0)
{
    chatStartOffset = time;
    scheduleChatMessage(0, 'new', 'left', false, 'Miss you babe 😘');
    scheduleChatMessage(7, 'new', 'right', false, '<div class="dots"></div>');
    scheduleChatMessage(7, 'update', 'right', false, 'Zsuzsi?');
    scheduleChatMessage(10, 'new', 'left', false, '<div class="dots"></div>');
    scheduleChatMessage(4, 'update', 'left', false, 'Last night was so 🐽 💦 😹 😻 ❤️‍🔥');
    scheduleChatMessage(4, 'new', 'right', false, '<div class="dots"></div>');
    scheduleChatMessage(3, 'update', 'right', false, 'Ermmm…');
    scheduleChatMessage(2, 'new', 'left', false, '<div class="dots"></div>');
    scheduleChatMessage(2, 'update','left', false, 'Why so cold?');
    scheduleChatMessage(3, 'new', 'left', true, ' r u w her?');
    scheduleChatMessage(3, 'new', 'right', false, '<div class="dots"></div>');
    scheduleChatMessage(1, 'update', 'right', false, 'Yes');
    scheduleChatMessage(3, 'new', 'left', false, '<div class="dots"></div>');
    scheduleChatMessage(2, 'update', 'left', false, 'Love you babe ❤️');
    scheduleChatMessage(3, 'new', 'right', false, '<div class="dots"></div>');
    scheduleChatMessage(7, 'update', 'right', false, 'Can’t wait to see you!');
    scheduleChatMessage(5, 'new', 'left', false, '<div class="dots"></div>');
    scheduleChatMessage(3, 'update', 'left', false, 'Get rid of her and come here at once 🧜🏻‍♂️ 🧜🏻‍♂️ 🧜🏻‍♂️');
    scheduleChatMessage(5, 'new', 'right', false, '<div class="dots"></div>');
    scheduleChatMessage(7, 'update', 'right', false, 'According to the scientific research, people using emoticons are emotionally unbalanced');
    scheduleChatMessage(4, 'new', 'left', false, 'Wtf!!');
    scheduleChatMessage(5, 'new', 'right', false, '<div class="dots"></div>');
    scheduleChatMessage(4, 'update', 'right', false, 'This is Fan, by the way. Karl forgot his phone 😾');
    scheduleChatMessage(5, 'new', 'left', false, '<div class="dots"></div>');
    scheduleChatMessage(6, 'update', 'left', false, '&nbsp');
    scheduleChatMessage(3, 'new', 'left', true,  '&nbsp;&nbsp;&nbsp;&nbsp;');
    scheduleChatMessage(1, 'new', 'left', true,  '&nbsp;&nbsp;&nbsp;&nbsp;');
    scheduleChatMessage(2, 'new', 'left', true, '<div class="dots"></div>');
    scheduleChatMessage(5, 'update', 'left', true, 'Oh');
    scheduleChatMessage(4, 'new', 'left', true, 'Damn');
    scheduleChatMessage(2, 'new', 'left', true, '<div class="dots"></div>');
    scheduleChatMessage(4, 'update', 'left', true, 'I thought I was typing Alex…');
    scheduleChatMessage(5, 'new', 'right', false, '🖕🏻!!!');
}


let chatStartOffset = 0;

function scheduleChatMessage(time, type, side, report, msg)
{
    waitTime += time;
    let realWaitTime = Math.max(0,waitTime - chatStartOffset);

    if(type == 'new')
    {
        let newMsg = createChatMessage(side, report, msg);

        ChatTimeouts[chatMessageIndex] = setTimeout(() => {
            postChatMessage(newMsg);
        }, realWaitTime * 1000);
        chatMessageIndex++;
        lastMessage = newMsg;
        
    }

    else
    {
        ChatTimeouts[chatMessageIndex] = setTimeout(() => { 
            let lastDiv = document.querySelector('#chatcontent > div:last-child');
            let p = lastDiv.querySelector('p');
            p.innerHTML = msg;
            chatcontent.scrollTop = chatcontent.scrollHeight;
        }, realWaitTime * 1000);
        chatMessageIndex++;
    }

    
}



/*
    UTILITY FUNCTIONS
*/

function DBG(msg)
{
    if(bDBG)
    {
        console.log(msg);
        //debugHeader.textContent = msg;
    }
     
}


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}










