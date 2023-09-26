
// Here, we will do all the stuff related with initialisatin of socket at client side 


// import io(basically it is a function) instance from socket.io-client which is used to initialise socket at client side
import { io } from 'socket.io-client';

// initialising socket io see documentation
export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempt: 'Infinity',
        timeout: 10000,
        transports: ['websocket'],
    };
    // now initSocket function return the instance of client socket, whenever we need client socket we will
    // call theis initSocket funtion and send data to server
    return io(process.env.REACT_APP_BACKEND_URL, options);
};
