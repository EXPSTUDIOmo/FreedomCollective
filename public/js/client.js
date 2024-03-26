/*
    SWR EXPERIMENTALSTUDIO 08/2023
    Maurice Oeser

    FREEDOM COLLECTIVE - Davor Vincze
*/


let currentScene = 0;
let isPlaying = false;

const connectionStatus = document.getElementById('connectionStatus');
const videoHint = document.getElementById('video_tab_hint');
const videoScreen = document.getElementById('videoscreen');

const avatarSecretary = document.getElementById('waitavatar_secretary');
const avatarSzusi = document.getElementById('waitavatar_szusi');
const avatarFan = document.getElementById('waitavatar_fan');
const avatarKarl = document.getElementById('waitavatar_karl');
const avatarAndre = document.getElementById('waitavatar_andre');


const videomask = document.getElementById('videomask');
const vm_name = document.getElementById('vm_name');
const vm_prof = document.getElementById('vm_prof'); 
const vm_status_value = document.getElementById('vm_status_value');
const vm_health_value = document.getElementById('vm_health_value');
const vm_slogan_value = document.getElementById('vm_slogan_value');
const vm_health_subtext = document.getElementById('vm_health_subtext');


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
    'scaled_Zsuzsi_1_video.mp4',
    'scaled_Fan_1_video.mp4',
    'scaled_Karl_2_video.mp4',
    'scaled_Andrei_2_video.mp4',
];


const VIDEO_SOURCES_DACH = 
[
    'scaled_Dach_1_video.mp4',
    'scaled_Dach_3_video.mp4',
    'scaled_Dach_4_video.mp4',
    'scaled_Dach_5_video.mp4',
    'scaled_Dach_6_video.mp4'
]

let VIDEOS_SCENE_1 = [];
let VIDEOS_SCENE_3 = [];

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


let dummyCounter = 0;

socket.on('pong', () => {
    dummyCounter += 1;
})



socket.on('activation', (state) => {

    if(currentScene == state.scene || !isConnected)
        return;

    preloadVideo(state.scene);
    loadScene(state.scene, state.time);
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

    stopAllSound();
});

socket.on('silent', () => {
    console.log("silent");
});

function loadScene(scene, time = 0)
{
    if(currentScene == scene || !isConnected)
        return;

    currentScene = scene;
    stopAllSound();

    if(inFadeAnimation)
    {
        content.classList.remove('fadeOutContent');
        clearTimeout(fadeOutTimeOut);
        clearTimeout(fadeInTimeOut);
        clearTimeout(chatFadeTimeout);
        inFadeAnimation = false;
    }

    switch(scene)
    {
        case 0:
            showWaitScreen();
            stopAllSound();
            stopVideos();
            resetChat();
            IsInChat = false;
            isPlaying = false;
            videomask.style.display = "none";
            break;
            
        case 1:
            preloadVideo(1);
            numVideosInScene = VIDEO_SOURCES_POSES.length;
            waitscreen.style.display = "none";
            chatscreen.style.display = "none";
            incomingchat.style.display = "none";
            showVideoScreen();
            IsInChat = false;
            playVideo();
            playSound(0, time);
            isPlaying = true;
            videomask.style.display = "block";
            break;
        case 2:
            waitscreen.style.display = "none";
            videoscreen.style.display = "none";
            chatscreen.style.display = "none";
            resetChat();
            preloadVideo(3);
            showIncomingChat();
            displayChat(time);
            playSound(1, time);
            isPlaying = true;
            videomask.style.display = "none";
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
            videomask.style.display = "none";
            break;
        default:
            break;
    }

    
}

let inFadeAnimation = false;
let fadeOutTimeOut;
let fadeInTimeOut;

function showWaitScreen()
{
    if(isPlaying)
    {
        inFadeAnimation = true;
        content.classList.add('fadeOutContent');

        fadeOutTimeOut = setTimeout(() => {
            videoscreen.style.display = "none";
            video_1.classList.add('hidden');
            video_2.classList.add('hidden');
            incomingchat.style.display = "none";
            chatscreen.style.display = "none";
            waitscreen.style.display = "flex";
            setOnWaitScreen(true);
            
        }, 2200);

        fadeInTimeOut = setTimeout(() => {
            content.classList.remove('fadeOutContent');
            inFadeAnimation = false;
        }, 4500);
    }

    else if(!isPlaying && !inFadeAnimation)
    {
        videoscreen.style.display = "none";
        video_1.classList.add('hidden');
        video_2.classList.add('hidden');
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
    SOUNDS[sound].seek(time);
    SOUNDS[sound].play();
}

let currentlyActivePlayer = 1;
let currentVideo = 0;

function preloadVideo(scene)
{
    if(scene === 1 || scene === 0)
    {
        video_1.src = `https://freedomcdn.fra1.cdn.digitaloceanspaces.com/${VIDEO_SOURCES_POSES[0]}`;
    }

    else
    {
        video_1.src = `https://freedomcdn.fra1.cdn.digitaloceanspaces.com/${VIDEO_SOURCES_DACH[0]}`;
    }

    currentVideo = 0;
    currentlyActivePlayer = 0;
}




video_1.onwaiting = function() {
    document.getElementById('video_loading').style.display = 'block';
  };

video_1.onplaying = function() {
    document.getElementById('video_loading').style.display = 'none';
  };

video_2.onwaiting = function() {
    document.getElementById('video_loading').style.display = 'block';
  };
  
video_2.onplaying = function() {
    document.getElementById('video_loading').style.display = 'none';
  };


function playVideo() {

    // Determine the video elements based on the currently active player
    let currentVideoElement = currentlyActivePlayer === 0 ? video_1 : video_2;
    let nextVideoElement = currentlyActivePlayer === 0 ? video_2 : video_1;

    if(!isPlayingVideo)
    {
        currentVideoElement.classList.remove('hidden');
    }

    currentVideoElement.play().then(() => {
        
    loadVideoMask(currentVideoElement.src);

    isPlayingVideo = true;

    requestAnimationFrame(() => {
        currentVideoElement.classList.remove('hidden');
        repositionVideoMask(currentlyActivePlayer);
        nextVideoElement.classList.add('hidden');
        nextVideoElement.pause();
    });
    
    let nextVideoIndex = (currentVideo + 1) % numVideosInScene;
    let nextVideoSrc = currentScene === 1 ? `https://freedomcdn.fra1.cdn.digitaloceanspaces.com/${VIDEO_SOURCES_POSES[nextVideoIndex]}` : `https://freedomcdn.fra1.cdn.digitaloceanspaces.com/${getRandomDachVideo()}`;
    nextVideoElement.src = nextVideoSrc;
    nextVideoElement.load(); // Start loading the next video

    // Update variables for the next cycle
    currentVideo = nextVideoIndex;
    currentlyActivePlayer = currentlyActivePlayer === 0 ? 1 : 0;

    }).catch(prepareNextVideoOnError);
}


let checkedVideoPos = false;

function repositionVideoMask(player)
{
    // let videoElement = player == 1 ? video_1 : video_2;
    // let offset = videoElement.offsetTop;
    // let offsetBot = videoScreen.offsetHeight - videoElement.offsetTop - videoElement.offsetHeight;

    // document.getElementById('vm_header').style.top = `${offset + 50}px`;
    // document.getElementById('vm_footer').style.bottom = `${offsetBot + 65}px`;

}

function loadVideoMask(videoName)
{

    videoName = videoName.substring(videoName.lastIndexOf('/')+1);

    if(videoName == "scaled_Zsuzsi_1_video.mp4")
    {
        vm_name.textContent = "ZSUZSI";
        vm_prof.textContent = "Surgeon";
        vm_status_value.textContent = "Metaverse Medical Faculty Graduate";
        vm_health_value.textContent = "200";
        vm_health_subtext.style.fontSize = "0.7rem";
        vm_health_subtext.textContent = "(Hey, I’m a doctor… 🦄)";
        vm_slogan_value.textContent = "Generosity";
    }
    

    else if(videoName == "scaled_Fan_1_video.mp4")
    {
        vm_name.textContent = "FAN";
        vm_prof.textContent = "Nutritionist";
        vm_status_value.textContent = "No citizenship";
        vm_health_value.textContent = "91";
        vm_health_subtext.style.fontSize = "0.8rem";
        vm_health_subtext.textContent = "(Nano chipped)";
        vm_slogan_value.textContent = "Respect don’t expect";
    }

    else if(videoName == "scaled_Karl_2_video.mp4")
    {
        vm_name.textContent = "KARL";
        vm_prof.textContent = "Coach";
        vm_status_value.textContent = "Proud Member of the Coaching Federation";
        vm_health_value.textContent = "35";
        vm_health_subtext.style.fontSize = "0.8rem";
        vm_health_subtext.textContent = "(Nano chipped)";
        vm_slogan_value.textContent = "Endless victory";
    }

    else if(videoName == "scaled_Andrei_2_video.mp4")
    {
        vm_name.textContent = "ANDREI";
        vm_prof.textContent = "Fighter";
        vm_status_value.innerHTML = "No citizenship,<br>No coaching contracts";
        vm_health_value.textContent = "98";
        vm_health_subtext.style.fontSize = "0.8rem";
        vm_health_subtext.textContent = "(Nano chipped)";
        vm_slogan_value.textContent = "Expect the unexpected";
    }
    
}

function prepareNextVideoOnError()
{
    let currentVideoElement = currentlyActivePlayer === 0 ? video_1 : video_2;
    let nextVideoElement = currentlyActivePlayer === 0 ? video_2 : video_1;
    let nextVideoIndex = (currentVideo + 1) % numVideosInScene;
    let nextVideoSrc = currentScene === 1 ? `/Videos/${VIDEO_SOURCES_POSES[nextVideoIndex]}` : `/Videos/${getRandomDachVideo()}`;
    nextVideoElement.src = nextVideoSrc;
    nextVideoElement.load(); // Start loading the next video
    // Update variables for the next cycle
    currentVideo = nextVideoIndex;
    currentlyActivePlayer = currentlyActivePlayer === 0 ? 1 : 0;
}

let lastDachVideo = -1;
function getRandomDachVideo()
{
    let index = Math.floor(Math.random() * VIDEO_SOURCES_DACH.length);

    if(index === lastDachVideo)
    {
        index = (index + 1) % VIDEO_SOURCES_DACH.length;
    }

    let video = VIDEO_SOURCES_DACH[index];
    lastDachVideo = index;

    return video;
}


let isPlayingVideo = false;

function stopVideos()
{
    video_1.pause();
    video_2.pause();
    isPlayingVideo = false;
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

    loadSound(0, `https://freedomcdn.fra1.digitaloceanspaces.com/PNO_H_${voiceid+1}.mp3`);
    loadSound(1, `https://freedomcdn.fra1.digitaloceanspaces.com/NOT_H_${voiceid+1}.mp3`);
    loadSound(2, `https://freedomcdn.fra1.digitaloceanspaces.com/FLT_H_${voiceid+1}.mp3`);
}



function loadSound(index, url, retries = 0, maxRetries = 3) {
    SOUNDS[index] = new Howl({
        src: [url],
        html5: true,
        onload: function() {
            incrementSFLoaded();
        },
        onloaderror: function(soundId, error) {
            
            if (retries < maxRetries) {
                loadSound(index, url, retries + 1, maxRetries); 
            } else {
               
                window.location.reload();
            }
        }
    });
}





const SoundfilesToLoad = 3;
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

    isConnected = true;
    goFullscreen();
    socket.emit("activate");
    // document.getElementById('connect_btn').style.color = "green";
    document.getElementById('connect_btn').innerHTML = "&#10003";
    pulses[0].style.animationIterationCount = "1";
    pulses[1].style.animationIterationCount = "1";

    setTimeout(() => {
        document.getElementById('connect_btn').classList.add('grow');
    }, 750);

    

    setTimeout(() => {
        document.getElementById('startscreen').style.display = "none";
        document.getElementById('content').style.display = "flex";
        setOnWaitScreen(true);
        repositionVideoMask(currentlyActivePlayer);
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
    }
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
let chatFadeTimeout;

function resetChat()
{

    if(inFadeAnimation)
    {
        chatFadeTimeout = setTimeout(() => {
            chatMessageIndex = 0;

        for(let timeout of ChatTimeouts)
        {
            clearTimeout(timeout);
        }

        chatcontent.innerHTML = "";
        ChatTimeouts = [];
        waitTime = 0;
        }, 2000);
    }
    
    else
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
}

function createChatMessage(side, repost, msg)
{
    let chatmsg = document.createElement('div');
    chatmsg.classList.add('chatmessage');


    if(!repost)
    {
        let header = document.createElement('h1');
        header.classList.add('white-text');
        header.classList.add('text-1xl');
        header.classList.add('ml-2');
        header.textContent = side == 'left' ? 'ZSUZSI' : 'KARL';
        chatmsg.appendChild(header);
    }

    let chatbubble = document.createElement('div');
    chatbubble.classList.add('white-background'); 

   
    let text = document.createElement('p');
    text.innerHTML = msg;
    text.classList.add('black-text');
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
    scheduleChatMessage(6, 'update', 'left', false, 'Last night was so 🐽 💦 😹 😻 ❤️‍🔥');
    scheduleChatMessage(6, 'new', 'right', false, '<div class="dots"></div>');
    scheduleChatMessage(5, 'update', 'right', false, 'Ermmm…');
    scheduleChatMessage(4, 'new', 'left', false, '<div class="dots"></div>');
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
    scheduleChatMessage(4, 'new', 'right', false, '<div class="dots"></div>');
    scheduleChatMessage(10, 'update', 'right', false, 'According to the scientific research, people using emoticons are emotionally unbalanced');
    scheduleChatMessage(5, 'new', 'left', false, 'Wtf!!');
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





