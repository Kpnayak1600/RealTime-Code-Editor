import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/theme/3024-day.css';
import 'codemirror/theme/3024-night.css';
import 'codemirror/theme/eclipse.css';
import 'codemirror/theme/material.css';
import 'codemirror/theme/rubyblue.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/css/css';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';
const Editor = ({ socketRef, roomId, onCodeChange, username }) => {
    const editorRef = useRef(null);
    const modeOptions = {
        javascript: { name: 'javascript', json: true },
        python: { name: 'python' },
        cplusplus: { name: 'text/x-c++src' },
        java: { name: 'text/x-java' },
        xml: { name: 'xml' },
    };
    const themeOptions = [
        'dracula',
        '3024-day',
        '3024-night',
        'eclipse',
        'material',
        'rubyblue',
    ];

    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(  // why editorRef.current used created?
                // whatever we type on our editor need to be captured so that code can be sent to the server in
                // order to sync code editor of all the clients presnent in a room and to capture code i need to
                // add event listner to our code editor .
                // to add event listner to code editor we need a reference which refer the code editor
                // we will use here editorRef.current as a reference for the code editor which is a useRef hook.
                // we used useRef() hook as => useRef used to store data jiske change hone se component rerender 
                // nhi hota h but incase of useState if out data change the component rerender ho jate h
                document.getElementById('realtimeEditor'),
                {
                    value: "write your code here",
                    mode: modeOptions.javascript,
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );

            editorRef.current.on('change', (instance, changes) => {//On() -> Various CodeMirror-related objects emit 
                //events, which allow client code to react to various situations. Handlers for such events 
                //can be registered with the on and off methods on the objects that the event fires on.
                // change Listner -> "change" (instance: CodeMirror, changeObj: object)
                // The changes is an object that contains following keys-value pair =>{from, to, text, removed, origin} 
                // to see object of changes do console.log(chages);
                const { origin } = changes; // destructuring changes object and getting key origin(origin ki value h what
                // action is done ) we have taken it as it will helps us to when to send code to server 
                const code = instance.getValue();  // give the content present in codemirror
                onCodeChange(code); // help in code sync see code Sync event in EditorPage.js
                if (origin !== 'setValue') {
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, { // emit use to send an event to the server , in 
                        //her in this  funtion we are sending a CODE_CHANGE event to the server with some data like roomId,code
                        roomId,// roomId of user who are or upadting the code on editor
                        code, // code for sync
                    });

                    editorRef.current.on('keyup', () => {

                        socketRef.current.emit("typing", {
                            username,
                        });

                        setTimeout(() => {
                            socketRef.current.emit("typing", {

                                username: "",
                            });

                        }, 1000)
                    })
                }
                // socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                //     if (code !== null) {
                //         editorRef.current.setValue(code);
                //     }
                // });
                // above commented code which listening the CODE_CHANGE event coming from server will not wrok 
                // inside this useEffect as component is render before the conection is being created by server
                // and hence listening the CODE_CHANGE event is not triggerd again even after connection from serve
                // is made so to handle it we will create another useEffect and their i will pass socketRef.current
                // as paramter i.e it check wether connection from socket is made or not and then it will work find
                // see below this useEffect we have made another useEffect to handle this.
            });
        }
        init();
    }, []);

    useEffect(() => {
        if (socketRef.current) {// if connection is made
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => { // then Listen the CODE_CHANGE event
                if (code !== null) { // if code empty then don't update editor value
                    editorRef.current.setValue(code); // setValue is CodeMirror to set data in code editor
                }
            });
        }
        return () => {// we need to disconnect socket connection as we are making connection 
            // with server socket from this userRef hook(or this EditorPage.js)
            socketRef.current.off(ACTIONS.CODE_CHANGE);// we are listening ACTIONS.CODE_CHANGE by on so we need to off it
        };
    }, [socketRef.current]); // this ensure that this useEffect hook is called only when connection form server is made

    const handleModeChange = (e) => {
        const mode = e.target.value;
        editorRef.current.setOption('mode', modeOptions[mode]);
    };

    const handleThemeChange = (e) => {
        const theme = e.target.value;
        editorRef.current.setOption('theme', theme);
    };

    const handleRunCode = () => {
        const code = editorRef.current.getValue();
        switch (editorRef.current.getOption("mode").name) {
            case "javascript":
                try {
                    eval(code);
                } catch (e) {
                    console.error(e);
                }
                break;
            case "python":
                // Execute the Python code using a runtime environment

                break;
            case "text/x-c++src":
                // Execute the C++ code using a runtime environment

                break;
            case "text/x-java":
                // Execute the Java code using a runtime environment

                break;
            case "xml":
                // Execute the XML code using a runtime environment

                break;
            default:
                break;
        }
    };

    return (
        <>
            <div className="seBox">
                <div>
                    <label htmlFor="mode-select" className="seLang">Language:</label>
                    <select id="mode-select" onChange={handleModeChange}>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="cplusplus">C++</option>
                        <option value="java">Java</option>
                        <option value="xml">XML</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="theme-select" className="seLang">Theme:</label>
                    <select id="theme-select" onChange={handleThemeChange}>
                        {themeOptions.map((theme) => (
                            <option key={theme} value={theme}>
                                {theme}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <textarea id="realtimeEditor"></textarea>
            {/* <button onClick={handleRunCode}>Run</button> */}
        </>);
};
export default Editor;
