const ADMIN_PASSWORD = 'masterchief'; // Replace with your chosen password

window.onload = function() {
    const enteredPassword = prompt('Please enter the admin password:');
    if (enteredPassword !== ADMIN_PASSWORD) {
        alert('Incorrect password!');
        window.location = '/'; // Redirect to homepage or another page
    }
};

const currentPlaystate = document.getElementById('currentPlaystate');
const currentScene = document.getElementById('currentScene');
const connectionstatus = document.getElementById('connectionstatus');


const socket = io({
    reconnection: true,        
    reconnectionAttempts: Infinity, 
    reconnectionDelay: 1000,   
    reconnectionDelayMax: 5000,
    timeout: 20000,  
    query: {
        admin: true
    }
});


socket.on('connected', () => {
    resetPingTimeout();
});

socket.on('state', (serverState) => {
    currentPlaystate.innerText = serverState.playing;
    currentScene.innerText = serverState.scene;
})

socket.on('pong', () => {
    resetPingTimeout();
})

let adminPingTimeout;

function resetPingTimeout()
{
    connectionstatus.innerText = "CONNECTED";
    connectionstatus.style.color = "green";
    
    clearTimeout(adminPingTimeout);

    adminPingTimeout = setTimeout(() => {
        connectionstatus.innerText = "DISCONNECTED";
        connectionstatus.style.color = "red";
    }, 4000);
}

let adminPing;

adminPing = setInterval(() =>{
    socket.emit('ping');
}, 2000);






document.getElementById('stopbtn').onclick = () => {
    socket.emit('admin_stop');
};


document.getElementById('scene1btn').onclick = () => {
    socket.emit('admin_scene_1');
};


document.getElementById('scene2btn').onclick = () => {
    socket.emit('admin_scene_2');
};

document.getElementById('scene3btn').onclick = () => {
    socket.emit('admin_scene_3');
};

