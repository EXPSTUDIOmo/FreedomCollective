/*
   MSync
   SWR EXPERIMENTALSTUDIO 
   Maurice Oeser
   2023

   Davor Vincze - FLUCHT

   Smartphone Soundfile Controler

   ermöglicht es Soundfiles synchron auf den Handys des Publikums abzuspielen und zu steuern
*/


// **************** Server setup ****************************
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const https = require('https');
const http = require('http');
const httpServer = http.createServer(app);


const { Server } = require("socket.io");
const io = new Server(httpServer);

app.use((req, res, next) => {
  res.setHeader('Accept-Ranges', 'bytes');
  next();
});

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/adminpanel', (req, res) => {
  res.sendFile(__dirname + '/public/adminpanel.html');
});

app.get('/max/admin/ping', (req, res) => {
  let data = 'ping ';
  data += `clients: ${clients.length} `;
  data += `scene: ${currentScene} `;
  data += `time: ${isPlaying ? Date.now() - lastStartTime : 0}`;
  res.send(data);
});

app.get('/max/admin/scene/1', (req, res) => {
  loadScene(1);
  res.send('start 1');
});

app.get('/max/admin/scene/2', (req, res) => {
  loadScene(2);
  res.send('start 2');
});

app.get('/max/admin/scene/3', (req, res) => {
  loadScene(3);
  res.send('start 3');
});

app.get('/max/admin/stop', (req, res) => {
  stopPlayback();
  res.send('stop');
});


httpServer.listen(8080, () => {
  console.log('Server running on port 8080');
});





// ==========================================================

/*
  Voice-Counter, der entscheidet welche Stimme das nächste sich verbindene Handy bekommt
*/
let voiceCounter = 0;
const numMaxVoices = 8;

function getNextVoice()
{
  voiceCounter = (voiceCounter + 1) % numMaxVoices;
  return voiceCounter;
}




// ******************* State control ********************************

let clients = []; // list of all connected clients
let admins = []; // list of connected admins
let lastStartTime= 0; // if we are currently playing, time of last started soundfile
let currentScene = 0;
let isPlaying = false;







// ********************** Socket.IO *************************
io.on('connection', (socket) => {

  if(socket.handshake.query.admin === 'true')
  {
    addAdmin(socket);
  }

  else
  {
    addClient(socket);
  }
});


function addAdmin(socket)
{
  admins.push(socket);

  socket.on('disconnect', () => {
    admins.splice(clients.indexOf(socket), 1);
  });

  socket.emit('connected');
  sendStateToAdmins(socket);

  socket.on('admin_stop', () => {
    stopPlayback();
    sendStateToAdmins(socket);
   })
  
   socket.on('admin_scene_1', () => {
    loadScene(1);
    sendStateToAdmins(socket);
   })
  
   socket.on('admin_scene_2', () => {
    loadScene(2);
    sendStateToAdmins(socket);
   })
  
   socket.on('admin_scene_3', () => {
    loadScene(3);
    sendStateToAdmins(socket);
   })

   socket.on('ping', () => {
    socket.emit('pong');
 })
}


function sendStateToAdmins(socket)
{
  let serverState = {
    playing: isPlaying,
    scene: currentScene
  }

  for(let admin of admins)
  {
    admin.emit('state', serverState);
  }
  
}


function addClient(socket)
{
  socket.voice = getNextVoice(); 
  socket.emit('connected', {voice: socket.voice});
  clients.push(socket);

  socket.on('disconnect', () => {
    clients.splice(clients.indexOf(socket), 1);
  });

  socket.on('activate', () => {
    let timeToJump = isPlaying ? (Date.now() - lastStartTime) / 1000 : 0; 
    socket.emit("activation", { playing: isPlaying, scene: currentScene, time: timeToJump});
    })

 socket.on('ping', () => {
    socket.emit('pong');
 })

}


function wakeClients()
{
  for(let client of clients)
  {
    client.emit('pong');
  }
}


setInterval(wakeClients, 5000);



let STOP_INTERVAL;
let RETRIGGER_INTERVAL;

function setPlayState(state)
{
  isPlaying = state;

  if(state === true)
  {
    clearInterval(STOP_INTERVAL);
    clearInterval(RETRIGGER_INTERVAL);
    RETRIGGER_INTERVAL = setInterval(reassureClientPlayback, 2000);
  }

  else
  {
    clearInterval(RETRIGGER_INTERVAL);
    clearInterval(STOP_INTERVAL);
    STOP_INTERVAL = setInterval(keepClientsSilent, 2000);
  }
}

setPlayState(false); // activates the "quiet silence" function that makes sure no one plays anything before its time


function keepClientsSilent()
{
  io.emit('stop');
}


function reassureClientPlayback()
{
  let timeToJump = isPlaying ? (Date.now() - lastStartTime) / 1000 : 0; 
  io.emit("activation", { playing: isPlaying, scene: currentScene, time: timeToJump});
}

// ================================= Client Control =========================

function loadScene(scene)
{

  currentScene = scene;
  
  if(scene === 0)
  {
    setPlayState(false);
  }

  else
  {
    lastStartTime = Date.now();
    setPlayState(true);
  }

  io.emit('start', scene);
}



function stopPlayback()
{
  setPlayState(false);
  currentScene = 0;
  io.emit('stop');
}


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
