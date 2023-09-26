import React, { useState, useEffect } from 'react';
import { v4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Loader from "../components/Loader";
const Home = () => {
    const navigate = useNavigate();

    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');
    const createNewRoom = (e) => {
        e.preventDefault();
        const id = v4();
        setRoomId(id);
        toast.success('Created a new room');
    };

    // to add loader before going to home page
    const [Loading, setLoading] = useState(true);
    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 3000)

    }, []);

    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error('ROOM ID & username is required');
            return;
        }

        // Redirect
        navigate(`/editor/${roomId}`, {
            state: {
                username,
            },
        });
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {  // e.code return key pressed on keyboard , so if key pressed was enter 
            joinRoom();    // then call joinRoom function
        }
    };
    if (Loading) {
        return <Loader />;
    } else {
        return (
            <div className="homePageWrapper">
                <div className="formWrapper">
                    <img
                        className="homePageLogo"
                        src="/code-sync.png"
                        alt="code-sync-logo"
                    />
                    <h4 className="mainLabel">Paste invitation ROOM ID</h4>
                    <div className="inputGroup">
                        <input
                            type="text"
                            className="inputBox"
                            placeholder="ROOM ID"
                            value={roomId}            // to set room id value in input field
                            onChange={(e) => setRoomId(e.target.value)}   // set the input field value to setRoomId(useState hook) 
                            onKeyUp={handleInputEnter}   // handleInputEnter function ->to join by pressing enter key 
                        />
                        <input
                            type="text"
                            className="inputBox"
                            placeholder="USERNAME"
                            value={username}    // to set username in input field
                            onChange={(e) => setUsername(e.target.value)}  // set the field value to 
                            onKeyUp={handleInputEnter}// handleInputEnter function ->to join by pressing enter key 
                        />
                        <button className="btn joinBtn" onClick={joinRoom}>
                            Join
                        </button>
                        <span className="createInfo">
                            If you don't have an invite then create &nbsp;
                            <a
                                onClick={createNewRoom}
                                href="#sb"
                                className="createNewBtn"
                            >
                                new room
                            </a>
                        </span>
                    </div>
                </div>
                <footer>
                    <h4>
                        Built with 💛 &nbsp; by &nbsp;
                        <a href="#sp">kpnayak</a>
                    </h4>
                </footer>
            </div>
        );
    }
};

export default Home;
