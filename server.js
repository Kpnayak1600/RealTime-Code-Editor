const express = require('express'); // import express
const app = express();   // call express
const http = require('http');  // import http -> it in built in node
const path = require('path');
const { Server } = require('socket.io');   // import Server class from socket.io library
const ACTIONS = require('./src/Actions');


const server = http.createServer(app);  // create http server by passing object of express() to http.createServer
const io = new Server(server); // creating instance of Server classs(imported from socket.io) by passing 
// instance of express Server to Server classs(imported from socket.io)


//// for hosting i.e production
// app.use(express.static('build'));
// app.use((req, res, next) => {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });



const userSocketMap = {};
function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(  // io.socket.adapter.rooms -> it denotes all
        // the rooms present in our adapter(i.e rooms that is created) 
        // io.sockets.adapter.rooms.get(roomId) -> it will give a room from adapter which has id roomId(mentioned in get function)
        // io.sockets.adapter.rooms.get(roomId) return a map and we need to convert this map in array so we will use 
        // Array.from and since now we have array so we will use map() (used for array itteration in javascript)
        // thus we will get all the socketId(each username is associated with a socketId, which is given by socket.io)
        // present in this roomId.
        // from this function we also return all the username , and for it we will return userScoketMap(written)
        // above as in usersocketMap object we have mapped username with it's SocketId.
        (socketId) => {
            return {
                socketId,  // coming from this function 
                username: userSocketMap[socketId], // see above userScoketMap = {}-> username stored here
            };
        }
    );
}



// this function trigger whenever socket connection is eastablished with client from server send argument of this 
// function is containg socket of client
io.on('connection', (socket) => {
    console.log('socket connected', socket.id);
    // listening JOIN evet coming from client socket
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        // mapping socket.id with respective username -> userScoketMap is an object so to map we use 
        //key-value pair see above
        userSocketMap[socket.id] = username;
        socket.join(roomId); // this line means if roomId phle se h to is socket ko useme add kro nhi to new room bna
        const clients = getAllConnectedClients(roomId); // ager kissi room mai phle se jitne log h unsb ko ek 
        // notification bhejna ki this usnername has joined for that we get all the SocketId(since each socketId
        // represent a unique username ) present in this room id with the help of getAllConnectedClients(roomId)
        // function -> logic written above 
        // here clients is a object as getAllConnectedClients method will return object
        // clients object contains mapping of each socketId with its uesrname -> do console(clients) and see
        //console.log(clients);
        clients.forEach(({ socketId }) => {// since we clients is an array and we to notify each socketId(username associated with it) so we will
            // use forEach itteration 
            // Note clients also contains soketId ans username which has joined and we don't want to send notificaion
            // " someone joined" to him and this case will be handle at client side
            io.to(socketId).emit(ACTIONS.JOINED, {     // io.to() -> from server to client notification send krega
                // io.to(socketId) -> notification send to the client whose socketId(uniquely identify 
                // client(username) at  server side) is mentioned
                // .emit(ACTIONS.JOINED) -> let's name this event (i.e sending notification from server to client) as 
                // ACTION.JOINED since it handle the situation when someone join or new room created when roomId is not
                // present in io.socket.adapter.rooms
                // we will send data form server to client -> clients,username, socket.id
                clients, // list of all the username present in the given roomId(coming from 
                // Socket.on(ACTIONS.JOIN, ({ roomId, username })) -> this will use to update Avtar section on 
                // client side
                username, // name of current username who want to join given roomId , username and roomid coming 
                // from socket.on(ACTIONS.JOIN, ({ roomId, username }) -> this will used to handle the case 
                // we don't wanna to send notification to user who is joining we want to send notification to 
                // only that user who is present in room at client side
                socketId: socket.id, // socketId of username who want to join socket.id coming from 
                // userSocketMap[socket.id] = username;   -> used to sync code between new user and user already 
                // present in room
            });
        });
    });

    // listening the CODE_CHANGE event coming from client socket
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });// we are sending code from server to client 
        // since we don't need to send code to the client who has updated it i have used socet.in , if i need to 
        // send the code also to the client who edited it i will use io.to 
        // note if we use io.to here instead of socket.in then also my code fill work without showing any error
        // but give abonormal result you can try 🙂, yhan ho ye rha h ki ho user type krega server pe jayega aur 
        // wo wapas fir server se client pe aa jayega and hence jo client likhega wo ulta likhayega
        // emit ->means we are sending event ACTIONS.CODE_CHANGE to the server along with code
    });

    socket.on(ACTIONS.SEND_MESSAGE, ({ roomId, message }) => {
        socket.in(roomId).emit(ACTIONS.SEND_MESSAGE, { message });
    });

    // listening the SYNC_CODE event coming from client socket
    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code }); // sending code to the code to the newly added user  
    });


    socket.on('disconnecting', () => {  // if browser is closed or leave button is pressed then we need to send 
        // notification to all the clients present the room that this user left and also we need to update the
        // Avatar section on clients interface
        // socket.on() -> it is a socket listener and we need to pass disonnecting listener to it. disconnecting
        // listner completly socket disconnect hone se phle ye jo life cycle hook h wo mil jati h ,basically 
        // jv browser band ho jata h ya dusre page pe koi chla jaye (means leave kr de by going home page from 
        // eidtorpage) to sockent connection server pe disconneting listner bhej deta h
        const rooms = [...socket.rooms];  // get all the rooms of the user who wannt to disconnect (in my case
        // each  user are assoicated with only one room 🙂) for this we  use socket.rooms-> this will return a 
        // map so conver it to array [...socket.rooms] or we can use Array.from(socket.rooms)
        rooms.forEach((roomId) => {   // use forEach to traverse each rooms one by one
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, { // for each room we want to notify two things . 
                // 1 sendig notificaton to all the remaining clients/username of room that someone left
                // 2 updating the Avtar section at server side
                // .emit(ACTIONS.DISCONNECTED) -> let's name this event (i.e sending notification from server to client) 
                // as ACTION.DISCONNECTED since it handle the situation when someone left the room
                // we will send data from server to client -> socket.id and userScoketMap[socket.id] 
                socketId: socket.id,    // to send notification to to all the remaining clients/username of room
                //  that someone left
                username: userSocketMap[socket.id], // updating the Avtar section at client side
            });
        });
        delete userSocketMap[socket.id];  // from userSocketMap (as it is an object with contains mapped soket.id 
        // with username) delete socket.id of user who want to leave
        socket.leave(); // leave() is offically a method to leave the room . socket refers to client who want to 
        // leave the room
    });
    socket.on("typing", ({ username }) => {
        socket.broadcast.emit("typing", { username: username });
        //console.log('Server:', username);
    });
});




// listening the server at port 
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
