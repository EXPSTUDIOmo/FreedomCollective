const ADMIN_PASSWORD = 'admin'; // Replace with your chosen password

// window.onload = function() {
//     const enteredPassword = prompt('Please enter the admin password:');
//     if (enteredPassword !== ADMIN_PASSWORD) {
//         alert('Incorrect password!');
//         window.location = '/'; // Redirect to homepage or another page
//     }
// };



const socket = io({
    reconnection: true,        
    reconnectionAttempts: Infinity, 
    reconnectionDelay: 1000,   
    reconnectionDelayMax: 5000,
    timeout: 20000,           });


socket.on('connected', (state) => {
    console.log("connected to admin server");
});



document.getElementById('startbtn').onclick = () => {
    socket.emit('admin_start');
};
