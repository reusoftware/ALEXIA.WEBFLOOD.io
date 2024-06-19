document.addEventListener('DOMContentLoaded', () => {
    let socket;
    let isConnected = false;
    let packetIdNum = 0;
    let currentUsername = '';
    let userList = [];
    let reconnectInterval = 10000; // 10 seconds for reconnect attempts
    let reconnectTimeout;

    let captchaUrls = "";
    let captchaImg, captchaTextbox, sendCaptchaButton;

    const loginButton = document.getElementById('loginButton');
    const joinRoomButton = document.getElementById('joinRoomButton');
    const leaveRoomButton = document.getElementById('leaveRoomButton');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const statusDiv = document.getElementById('status');
    const statusCount = document.getElementById('count');
    const joinlog = document.getElementById('joinlog');
    const chatbox = document.getElementById('chatbox');
    const usernameInput = document.getElementById('username');
    const userListbox = document.getElementById('userListbox');
    const debugBox = document.getElementById('debugBox');
    const messageInput = document.getElementById('message');
    const targetInput = document.getElementById('target');
    const roomListbox = document.getElementById('roomlistbox');

    loginButton.addEventListener('click', async () => {
        const username = usernameInput.value;
        const password = document.getElementById('password').value;
        currentUsername = username;
        await connectWebSocket(username, password);
    });

    joinRoomButton.addEventListener('click', async () => {
        const room = document.getElementById('room').value;
        await joinRoom(room);
    });

    leaveRoomButton.addEventListener('click', async () => {
        const room = document.getElementById('room').value;
        await leaveRoom(room);
    });

    sendMessageButton.addEventListener('click', async () => {
        const message = messageInput.value;
        await sendMessage(message);
    });

    function addCaptchaButtonListener() {
        sendCaptchaButton.addEventListener('click', async () => {
            console.log('send captcha');
            const captchaValue = captchaTextbox.value;
            await sendCaptcha(captchaValue, captchaUrls);
        });
    }

    function addMessageToChatbox(username, message, avatarUrl) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');

        const avatarElement = document.createElement('img');
        avatarElement.classList.add('avatar');
        avatarElement.src = avatarUrl;

        const usernameElement = document.createElement('span');
        usernameElement.classList.add('username');
        usernameElement.textContent = username;

        const textElement = document.createElement('span');
        textElement.classList.add('text');
        textElement.textContent = message;

        messageElement.appendChild(avatarElement);
        messageElement.appendChild(usernameElement);
        messageElement.appendChild(textElement);

        chatbox.appendChild(messageElement);
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    roomListbox.addEventListener('change', async () => {
        const selectedRoom = roomListbox.value;
        if (selectedRoom) {
            await joinRoom(selectedRoom);
        }
    });

    async function connectWebSocket(username, password) {
        statusDiv.textContent = 'Connecting to server...';
        socket = new WebSocket('wss://chatp.net:5333/server');

        socket.onopen = async () => {
            isConnected = true;
            statusDiv.textContent = 'Connected to server';
            clearTimeout(reconnectTimeout);

            const loginMessage = {
                username: username,
                password: password,
                handler: 'login',
                id: generatePacketID()
            };
            console.log('Sending login message:', loginMessage);
            await sendMessageToSocket(loginMessage);
        };

        socket.onmessage = (event) => {
            console.log('Received message:', event.data);
            processReceivedMessage(event.data);
        };

        socket.onclose = () => {
            isConnected = false;
            statusDiv.textContent = 'Disconnected from server';
            attemptReconnect(username, password);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            statusDiv.textContent = 'WebSocket error. Check console for details.';
            attemptReconnect(username, password);
        };
    }

    async function attemptReconnect(username, password) {
        if (!isConnected) {
            statusDiv.textContent = 'Attempting to reconnect...';
            reconnectTimeout = setTimeout(() => connectWebSocket(username, password), reconnectInterval);
        }
    }

    async function joinRoom(roomName) {
        if (isConnected) {
            const joinMessage = {
                handler: 'room_join',
                id: generatePacketID(),
                name: roomName
            };
            await sendMessageToSocket(joinMessage);
            await fetchUserList(roomName);

            const room = document.getElementById('room').value;
            if (sendWelcomeMessages) {
                const welcomeMessage = `Hello world, I'm a web bot! Welcome, ${currentUsername}!`;
                await sendMessage(welcomeMessage);
            }
        } else {
            statusDiv.textContent = 'Not connected to server';
        }
    }

    function rejoinRoomIfNecessary() {
        const room = document.getElementById('room').value;
        if (room) {
            joinRoom(room);
        }
    }

    async function leaveRoom(roomName) {
        if (isConnected) {
            const leaveMessage = {
                handler: 'room_leave',
                id: generatePacketID(),
                name: roomName
            };
            await sendMessageToSocket(leaveMessage);
            joinlog.textContent = `You left the room: ${roomName}`;
        } else {
            statusDiv.textContent = 'Not connected to server';
        }
    }

    async function sendMessage(message) {
        if (isConnected) {
            const messageData = {
                handler: 'room_message',
                type: 'text',
                id: generatePacketID(),
                body: message,
                room: document.getElementById('room').value,
                url: '',
                length: '0'
            };
            await sendMessageToSocket(messageData);
        } else {
            statusDiv.textContent = 'Not connected to server';
        }
    }

    async function sendCaptcha(captcha, captchaUrl) {
        if (isConnected) {
            const messageData = {
                handler: 'room_join_captcha',
                id: generatePacketID(),
                name: document.getElementById('room').value,
                password: '',
                c_code: captcha,
                c_id: '',
                captcha_url: captchaUrl
            };

            console.log('Sending captcha:', messageData);

            await sendMessageToSocket(messageData);
        } else {
            statusDiv.textContent = 'Not connected to server';
            console.log('Not connected to server');
        }
    }

    function handleCaptcha(messageObj) {
        const captchaUrl = messageObj.captcha_url;

        captchaImg = document.createElement('img');
        captchaImg.src = captchaUrl;
        captchaImg.style.maxWidth = '200px';
        captchaUrls = captchaUrl;

        captchaTextbox = document.createElement('input');
        captchaTextbox.type = 'text';
        captchaTextbox.placeholder = 'Enter Captcha';

        sendCaptchaButton = document.createElement('button');
        sendCaptchaButton.textContent = 'Send Captcha';

        chatbox.innerHTML = '';
        chatbox.appendChild(captchaImg);
        chatbox.appendChild(captchaTextbox);
        chatbox.appendChild(sendCaptchaButton);
        chatbox.scrollTop = chatbox.scrollHeight;

        addCaptchaButtonListener();
    }

    async function chat(to, body) {
        const packetID = generatePacketID();
        const message = {
            handler: 'chat_message',
            type: 'text',
            id: packetID,
            body: body,
            to: to,
            url: '',
            length: '0'
        };
        await sendMessageToSocket(message);
    }

    async function sendMessageToSocket(message) {
        return new Promise((resolve, reject) => {
            if (isConnected && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(message));
                resolve();
            } else {
                reject(new Error('WebSocket is not connected or not open'));
            }
        });
    }

    function generatePacketID() {
        packetIdNum += 1;
        return `R.U.BULAN©pinoy-2023®#${packetIdNum.toString().padStart(3, '0')}`;
    }

    function processReceivedMessage(message) {
        console.log('Received message:', message);
        debugBox.value += `${message}\n`;

        try {
            const jsonDict = JSON.parse(message);

            if (jsonDict) {
                const handler = jsonDict.handler;

                if (handler === 'login_event') {
                    handleLoginEvent(jsonDict);
                } else if (handler === 'room_event') {
                    handleRoomEvent(jsonDict);
                } else if (handler === 'chat_message') {
                    //   displayChatMessage(jsonDict);
                } else if (handler === 'presence') {
                    onUserProfileUpdates(jsonDict);
                } else if (handler === 'group_invite') {
                    onMucInvitation(jsonDict.inviter, jsonDict.name, 'private');
                } else if (handler === 'user_online' || handler === 'user_offline') {
                    onUserPresence(jsonDict);
                } else if (handler === 'muc_announcement') {
                    handleRoomAnnouncements(jsonDict);
                } else if (handler === 'room_announcement') {
                    handleRoomAnnouncements(jsonDict);
                } else if (handler === 'room_join_captcha') {
                    handleCaptcha(jsonDict);
                }
            }
        } catch (e) {
            console.error('Error processing received message:', e);
        }
    }

    async function fetchUserList(roomName) {
        if (isConnected) {
            const userListMessage = {
                handler: 'user_list',
                id: generatePacketID(),
                name: roomName
            };

            await sendMessageToSocket(userListMessage);
        } else {
            statusDiv.textContent = 'Not connected to server';
        }
    }

    function handleLoginEvent(messageObj) {
        const status = messageObj.status;

        if (status === 'success') {
            statusDiv.textContent = 'Login successful!';
        } else {
            statusDiv.textContent = 'Login failed!';
        }
    }

    function handleRoomEvent(messageObj) {
        const status = messageObj.status;

        if (status === 'success') {
            statusDiv.textContent = 'Room joined successfully!';
            joinlog.textContent = 'Room joined successfully!';
            addMessageToChatbox('System', 'You have joined the room', '');
        } else {
            statusDiv.textContent = 'Room joining failed!';
            joinlog.textContent = 'Room joining failed!';
        }
    }

    function onUserProfileUpdates(messageObj) {
        console.log('User profile updates:', messageObj);
    }

    function onMucInvitation(inviter, roomName, roomType) {
        console.log('MUC invitation:', { inviter, roomName, roomType });
    }

    function onUserPresence(messageObj) {
        console.log('User presence:', messageObj);
    }

    function handleRoomAnnouncements(messageObj) {
        console.log('Room announcements:', messageObj);
    }
});
