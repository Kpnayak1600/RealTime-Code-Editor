import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';

const EditorPage = () => {
    const [Loading, SetLoading] = useState(true);
    const socketRef = useRef(null); //hook used to store data jiske change hone se component rerender nhi hota h
    // but incase of useState if out data change the component rerender ho jate h
    const codeRef = useRef(null);
    const location = useLocation();  // see about this hooks
    const { roomId } = useParams(); // useParams hooks use to get id from url -> at App.js we use editor/roomId
    // route and hence here too i uesed roomId name must be same
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);  // useState hook to store the details(socket.id and username) of 
    // client who is joined which will be used to create Avatar see Client components
    let ding = new Audio('/ding.mp3');
    if (Loading) {
        ding.play();
        SetLoading(false);
    }
    // initialising client socket -> initialise once one when time when component render
    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();  // whenever you use useRef then we need to use current since
            // socketRef is useRef() instance so use socketRef.current  
            // initSocket() function to initalise client socket created inn soket.js file , and we know ki 
            // initSocket() return krega  instance of client socket, whenever we need client socket we will call this 
            // initSocket funtion and send data to server and this line is the responsible for connection between 
            // server socket and client socket
            // we use here await as init() ko hmne async bnaya h
            socketRef.current.on('connect_error', (err) => handleErrors(err)); // if any error occur while 
            // connecting then there is a special type of string to handle error -> 'connect_error'
            socketRef.current.on('connect_failed', (err) => handleErrors(err)); // if due to some reason
            // connection failed then there is special type of string to handle -> 'connect_failed'

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/'); // move to home page -> this is a instance of useNavigate() hook which we 
                // used in home.js to redirect to EditorPage.js
            }
            // emit use to send an event to the server , in below funtion we are sending a join event to the 
            // server in order to join client socket with server socket
            // here we are writing ACTIONS.JOIN instead of JOIN -> we can write JOIN here too but let organise
            // all event by creating a Acton.js file to sotre all event which we will pass from client socket to 
            // server socket
            socketRef.current.emit(ACTIONS.JOIN, {
                // sending roomId and username form client socket to server socket
                roomId,
                username: location.state?.username,  // form home.js we redirect to this page through navigate
                // and we have also send state that contains username to get that value we use location.state , if navigate ka
                // state username property ni send kr rha to avoid throwing error we can do ?.username this 
                // is javascript syntax
            });

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) { // we don't wanna to send notification to user
                        // who is joining we want to send notification to only that user who is present in room
                        let Join = new Audio('/Join.mp3');
                        toast.success(`${username} joined the room.`);
                        Join.play();
                    }
                    setClients(clients); // useState hook to store the details(socket.id and username) of all client 
                    //present in room (which is used to create Avatar see client component) since one new user joined
                    // it needs to be updated
                    socketRef.current.emit(ACTIONS.SYNC_CODE, { // as soon as a new user join the room we have to 
                        // sync its editor with user's code editor who already present in the room for it we will
                        // send SYNC_CODE event from client to server and we pass the code(which is already 
                        // present on receiver editor) but problem is that how we can access code present
                        // on Editor(chile component of EditorPage) for it we will use function see onCodeChange()
                        // pass as the props to Editor component  
                        code: codeRef.current, // code to be sync
                        socketId,   // sockentid of user  who has joined
                    });
                }
            );

            //Listening For Typing
            socketRef.current.on("typing", ({ username }) => {
                if (username) {
                    document.getElementById('type').innerHTML = `${username} is typing...`;
                    console.log(`${username} is typing`);
                }
                else {
                    document.getElementById('type').innerHTML = '';
                    console.log(username);
                }
            });


            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    let Left = new Audio('/Left.mp3');
                    toast.success(`${username} left the room.`);
                    Left.play();
                    setClients((prev) => {// useState hook to store the details(socket.id and username) of all client 
                        //presnet in rooom (which is used to create Avatar see client component) since one user left
                        // it needs to be updated
                        return prev.filter(  // filter is a itterator 
                            (client) => client.socketId !== socketId // add only those in client array whose socket.id
                            // didn't matched socketId coming from server(as user associated with this id has left the
                            // room)
                        );
                    });
                }
            );

            //Listening for message
            socketRef.current.on(ACTIONS.SEND_MESSAGE, ({ message }) => {
                const chatWindow = document.getElementById("chatWindow");
                var currText = chatWindow.value;
                currText += message;
                chatWindow.value = currText;
                chatWindow.scrollTop = chatWindow.scrollHeight;
            });
        };
        init();
        // we need to clear the listner other memory leak issue will occur -> we clear listner under cleaning function
        // useRef() hook k iniside se agr koi function return krte  ho to wo hota h cleaning function(means jaise 
        // hin component unmount ho jayega to ye jo cleaning function h wo call ho jayegi) and here we 
        // clear of listners
        return () => {
            socketRef.current.disconnect(); // we need to disconnect socket connection as we are making connection 
            // with server socket from this userRef hook(or this EditorPage.js)
            socketRef.current.off(ACTIONS.JOINED);  // we are listening ACTIONS.JOINED by on so we need to off it 
            socketRef.current.off(ACTIONS.DISCONNECTED);// we are listening ACTIONS.DISCONNECTED by on so we need to off it
            socketRef.current.off(ACTIONS.SEND_MESSAGE);// we are listening ACTIONS.SEND_MESSAGE by on so we need to off it
        };
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    function leaveRoom() {

        reactNavigator('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }
    const sendMessage = () => {
        if (document.getElementById("inputBox").value === "") return;
        var message = `> ${location.state.username}:\n${document.getElementById("inputBox").value
            }\n`;
        const chatWindow = document.getElementById("chatWindow");
        var currText = chatWindow.value;
        currText += message;
        chatWindow.value = currText;
        chatWindow.scrollTop = chatWindow.scrollHeight;
        document.getElementById("inputBox").value = "";
        socketRef.current.emit(ACTIONS.SEND_MESSAGE, { roomId, message });
    };
    const handleInputEnter = (key) => {
        if (key.code === "Enter") {
            sendMessage();
        }
    };
    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img
                            className="logoImage"
                            src="/code-sync.png"
                            alt="logo"
                        />
                    </div>
                    <div id="type"></div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="editorWrap">
                <Editor
                    socketRef={socketRef}     // to make call of code change event from client(edtior.js) to server
                    username={location.state?.username}
                    roomId={roomId}
                    onCodeChange={(code) => {  // code coming from Editor is update to codeRef.current as codRef.current
                        // is to sync the code betweeen the user who are joing the room with edior of usr already present in the room
                        codeRef.current = code;
                    }}
                />
            </div>
            <div className="chatWrap">
                <textarea
                    id="chatWindow"
                    className="chatArea textarea-style"
                    placeholder="Chat messages will appear here"
                    disabled
                ></textarea>
                <div className="sendChatWrap">
                    <input
                        id="inputBox"
                        type="text"
                        placeholder="Type your message here"
                        className="inputField"
                        onKeyUp={handleInputEnter}
                    ></input>
                    <button className="btn sendBtn" onClick={sendMessage}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );

};

export default EditorPage;
