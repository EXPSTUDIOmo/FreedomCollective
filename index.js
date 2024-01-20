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

const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/freedom-collective.de/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/freedom-collective.de/fullchain.pem')
};

http.createServer(app).listen(3001, () => {
  console.log('Server running on port 3001');
});

const { Server } = require("socket.io");
const io = new Server(httpServer);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
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
let lastStartTime= 0; // if we are currently playing, time of last started soundfile
let currentScene = 0;
let isPlaying = false;






// ********************** Socket.IO *************************
io.on('connection', (socket) => {

  console.log("new user");

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

 socket.on('admin_start', () => {
  loadScene(1);
 })

});











// ======================= OSC ADMIN CONTROL (from Max) =======================

const OSCserver = require('node-osc').Server;
const OSCClient = require('node-osc').Client;

const oscToMax = new OSCClient('127.0.0.1', 5555); // TODO evtl. dynamisch wenn nicht auf gleichem Rechner wie Max

let oscServer = new OSCserver(3333, '0.0.0.0', () => {
  console.log('*** OSC CONNECTION STARTED AND LISTENING ON PORT 3333 ***');
});


// message handling
oscServer.on('message', function (msg) {

  let AP = msg[0]; // AdressPattern

  switch(AP)
  {
    case '/start':   
      let sceneToLoad = msg[1];
      loadScene(sceneToLoad);
      oscToMax.send('/server', `started scene ${sceneToLoad}`);
      break;
    
    case '/stop':
      stopPlayback();
      oscToMax.send('/server', "stopped");
      break;

    case '/colorall':
      let R = msg[1];
      let G = msg[2];
      let B = msg[3];
      setClientColors(R,G,B);
      break;

    case '/users':
      oscToMax.send("/users", clients.length);
      break;

    case '/mode':
      let mode = msg[1];
      setMode(mode);
      break;

    case '/organ':
      let voice = msg[1];
      let pitch = msg[2];
      let velocity = msg[3];
      playOrgan(voice, pitch, velocity);
      break;
  }
});






// ================================= Client Control =========================

function loadScene(scene)
{

  currentScene = scene;
  
  if(scene === 0)
  {
    isPlaying = false;
  }

  else
  {
    lastStartTime = Date.now();
    isPlaying = true;
  }

  io.emit('start', scene);
}



function stopPlayback()
{
  isPlaying = false;
  currentScene = 0;
  io.emit('stop');
}


function setMode(mode)
{ 
  console.log("mode", mode);
  io.emit('mode', mode);
}


function setClientColors(R,G,B)
{
  io.emit('color', R,G,B);
}


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
