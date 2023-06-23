import React, { Component } from 'react';
import welcomeImage from './assets/welcome.png';
import mainScreenImage from './assets/mainscreen.png';

export default class Chat extends Component {
    constructor(props) {
        super(props);
        this.state = {
            messages: [],
            inputText: '',
            recipient: '',
            firstName: '',
            lastName: '',
            isFirstTime: true,
            lastRenderedMessageIndex: -1
        };
    }

    componentDidMount() {
        this.interval = setInterval(this.fetchMessages, 10000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    handleInputChange = (event) => {
        this.setState({ inputText: event.target.value });
    };

    handleRecipientChange = (event) => {
        this.setState({ recipient: event.target.value });
    };

    handleFirstNameChange = (event) => {
        const lowercaseValue = event.target.value.toLowerCase();
        this.setState({ firstName: lowercaseValue });
    };

    handleLastNameChange = (event) => {
        const lowercaseValue = event.target.value.toLowerCase();
        this.setState({ lastName: lowercaseValue });
        
    };

    handleSendMessage = () => {
        const { inputText, recipient, firstName, lastName } = this.state;
        if (inputText.trim() !== '' && recipient.trim() !== '') {
            const message = {
                sender: `${firstName} ${lastName}`,
                recipient,
                message: inputText
            };

            // Call Azure function here with the message object
            // Example code using fetch:
            fetch('https://tott-function-app.azurewebsites.net/api/deliver_messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log('Azure function response:', data);
                    // Handle response if needed
                })
                .catch((error) => {
                    console.error('Azure function call failed:', error);
                    // Handle error if needed
                });

            this.setState({
                messages: [
                    ...this.state.messages,
                    { sender: 'User', recipient, text: inputText }
                ],
                inputText: ''
            });
        }
    };

    fetchMessages = () => {
        const { recipient, firstName, lastName, lastRenderedMessageIndex } =
            this.state;
        const finalName = `${firstName.trim()} ${lastName.trim()}`;

        if (finalName.trim() !== '') {
            const url = `https://tott-function-app.azurewebsites.net/api/recieve_message?full_name=${encodeURIComponent(
                finalName
            )}`;
            fetch(url)
                .then((response) => response.json())
                .then((data) => {
                    console.log('Message response:', data);
                    const message = data.message;

                    if (message) {
                        const { messages } = this.state;
                        const lastMessageIndex = messages.length - 1;

                        if (
                            lastMessageIndex >= 0 &&
                            lastRenderedMessageIndex < lastMessageIndex
                        ) {
                            // Check if the last rendered message index is less than the last message index
                            // If yes, update the last rendered message index to the last message index
                            this.setState({ lastRenderedMessageIndex: lastMessageIndex });
                        }

                        this.setState((prevState) => ({
                            messages: [
                                ...prevState.messages,
                                { sender: 'Someone', recipient, text: message }
                            ]
                        }));
                    }
                })
                .catch((error) => {
                    console.error('Message retrieval failed:', error);
                });
        }
    };

    playTextToSpeech = (text) => {
        const speechUtterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(speechUtterance);
    };

    handleStartChat = () => {
        this.setState({ isFirstTime: false });
    };

    renderMessages = () => {
        const { messages, lastRenderedMessageIndex } = this.state;
        const renderedMessages = [];

        for (
            let i = lastRenderedMessageIndex + 1;
            i < messages.length;
            i++
        ) {
            const currentMessage = messages[i];
            const nextMessage = messages[i + 1];

            const messageContent = (
                <div style={{ fontSize: '30px', textAlign: 'center' }}>
                    <strong>{currentMessage.sender}: </strong>
                    {currentMessage.text}
                </div>
            );

            // const speakerIcon = (
            //     <span
            //         style={{ cursor: 'pointer' }}
            //         onClick={() => this.playTextToSpeech(currentMessage.text)}
            //         role="img"
            //         aria-label="Speaker"
            //     >
            //         🔊
            //     </span>
            // );

            if (currentMessage.sender === 'Someone') {
                renderedMessages.push(
                    <div
                        key={i}
                        style={{
                            backgroundColor: 'white',
                            padding: '8px',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            marginLeft: 'unset',
                            maxWidth: '70%',
                            margin: 'auto',
                            position: 'absolute',
                            top: '300px',
                            left: '15%',
                            right: '15%'
                        }}
                    >
                        {/* {speakerIcon} */}
                        {messageContent}
                    </div>
                );
            } else if (nextMessage && currentMessage.text !== nextMessage.text) {
                renderedMessages.push(
                    <div
                        key={i}
                        style={{
                            backgroundColor: '#EFEFEF',
                            padding: '8px',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            marginLeft: 'auto',
                            maxWidth: '70%',
                            margin: 'auto',
                            position:'absolute',
                            top:'300px',
                            left:'15%',
                            right:'15%'
                        }}
                    >
                        {/* {speakerIcon} */}
                        {messageContent}
                    </div>
                );
            }
        }

        return renderedMessages;
    };

    render() {
        const {
            inputText,
            recipient,
            firstName,
            lastName,
            isFirstTime
        } = this.state;

        if (isFirstTime) {
            return (
                <div
                    style={{
                        backgroundImage: `url(${welcomeImage})`,
                        backgroundSize: 'cover',
                        height: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {/* <h1>Welcome to the Chat Interface</h1> */}
                    {/* <p>Please provide your first name and last name:</p> */}
                    <input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={this.handleFirstNameChange}
                        style={{ width: '50%', position: 'absolute', bottom: '200px', left: '25%', right: '25%', paddingTop: '10px', paddingBottom: '10px', fontSize: '17px', border: 'none', borderRadius: '2px','textAlign':"center" }}
                    />
                    <input
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={this.handleLastNameChange}
                        style={{ width: '50%', position: 'absolute', bottom: '150px', left: '25%', right: '25%', paddingTop: '10px', paddingBottom: '10px', fontSize: '17px', border: 'none', borderRadius: '2px', 'textAlign': "center" }}
                    />
                    <button onClick={this.handleStartChat} style={{ position: 'absolute', bottom: '100px', left: '45%', right: 'auto', width: 'fit-content', fontSize: '25px', height: '44px', backgroundColor: '#4267B3', color: 'white', border: 'none', borderRadius: '5px' }} >Start Chat</button>
                </div>
            );
        }

        return (
            <div
                style={{
                    backgroundImage: `url(${mainScreenImage})`,
                    backgroundSize: 'cover',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                {/* <h1>Chat Interface</h1> */}
                <div
                    style={{
                        width: '90%',
                        maxHeight: '500px',
                        overflowY: 'auto',
                        marginBottom: '10px'
                    }}
                >
                    {this.renderMessages()}
                </div>

                <div style={{ width: '90%' }}>
                    {/* <span>Send Message to:</span> */}
                    <input
                        type="text"
                        placeholder="Recipient"
                        value={recipient}
                        onChange={this.handleRecipientChange}
                        style={{ width: '90%', position: 'absolute', bottom: '50px', left: '5%', right: '5%', paddingTop: '10px', paddingBottom: '10px', fontSize: '17px' }}
                    />
                </div>
                <div style={{ width: '90%', marginTop: '10px' }}>
                    <input
                        type="text"
                        placeholder="Message"
                        value={inputText}
                        onChange={this.handleInputChange}
                        style={{ width: '90%', position: 'absolute', bottom: '100px', left: '5%', right: '5%', paddingTop: '10px', paddingBottom: '10px', fontSize: '17px' }}
                    />
                    <button style={{ position: 'absolute', bottom: '100px', left: '96%', right: '4%', width: 'fit-content', fontSize: '15px', height: '44px', backgroundColor: '#4267B3', color: 'white', border: 'none', borderRadius: '5px' }} onClick={this.handleSendMessage}>Send</button>
                </div>
            </div>
        );
    }
}

