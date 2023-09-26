// contains all event that will send from client socket to server socket
const ACTIONS = {
    JOIN: 'join',   // we will send JOIN event from client socket to server socket
    JOINED: 'joined',  // we will send JOINED event from server socket to client socket to confirm that 
    //                    they are joined
    DISCONNECTED: 'disconnected',  // to check client socket disconnect from server or not
    CODE_CHANGE: 'code-change',  // if editor pe koi code change hua to send that change from client socket 
    //                   to server so that from server other client k editor pe changes to rerender krane hai
    SYNC_CODE: 'sync-code', // 
    LEAVE: 'leave',  // if any client socket disconnet then leave message send on server to reflect this message
    //               to other client socket
    SEND_MESSAGE: "send-message",
};

module.exports = ACTIONS;  // module.exports kiya as we will use this file on our server side too
