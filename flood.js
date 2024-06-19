   document.addEventListener('DOMContentLoaded', () => {
 let socket;
    let isConnected = false;
    let packetIdNum = 0;
    let sendWelcomeMessages = false;
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
let quizInterval;
//const quizIntervalTime = 10000; // Time in milliseconds (10 seconds for this example)
const quizIntervalTime = 20000; // Time in milliseconds (10 seconds for this example)
 
    const loginButton = document.getElementById('loginButton');
    const joinRoomButton = document.getElementById('joinRoomButton');
    const leaveRoomButton = document.getElementById('leaveRoomButton');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const statusDiv = document.getElementById('status');
    const statusCount = document.getElementById('count');
  const joinlog = document.getElementById('joinlog');
      // const chatbox = document.getElementById('chatbox');
let chatbox = document.getElementById('chatbox');
    const welcomeCheckbox = document.getElementById('welcomeCheckbox');
   const spinCheckbox = document.getElementById('spinCheckbox');
    const roomListbox = document.getElementById('roomListbox');
     const usernameInput = document.getElementById('username');
 const userListbox = document.getElementById('userListbox');
    const debugBox = document.getElementById('debugBox');
    const emojiList = document.getElementById('emojiList');
    const messageInput = document.getElementById('message');
 
  const targetInput = document.getElementById('target');
    const banButton = document.getElementById('banButton');
    const kickButton = document.getElementById('kickButton');
const memButton = document.getElementById('memButton');
const adminButton = document.getElementById('adminButton');
const ownerButton = document.getElementById('ownerButton');
const noneButton = document.getElementById('noneButton');
 const masterInput = document.getElementById('master');
   const activateQuizCheckbox = document.getElementById('activateQuizCheckbox');
 let currentQuestionIndex = 0;
        let attempts = 0;
        const maxAttempts = 5;
        const scores = [100, 200, 300, 400, 500];  // Scores for each attempt
let userScores = {}; // To keep track of user scores
let currentAnswer = null; // Current correct answer

//==============

//Start With 'p'~paper#Start With 'p'~power# start with 'o'~our# start with 'u'~usual# start 
//===================

noneButton.addEventListener('click', async () => {
        const target = targetInput.value;
        await setRole(target, 'none');
    });
ownerButton.addEventListener('click', async () => {
        const target = targetInput.value;
        await setRole(target, 'owner');
    });
adminButton.addEventListener('click', async () => {
        const target = targetInput.value;
        await setRole(target, 'admin');
    });
 memButton.addEventListener('click', async () => {
        const target = targetInput.value;
        await setRole(target, 'member');
    });



kickButton.addEventListener('click', async () => {

 const target = targetInput.value;
    await kickUser(target);

});


    banButton.addEventListener('click', async () => {
        const target = targetInput.value;
        await setRole(target, 'outcast');
    });

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
  const questionAnswerInput = document.getElementById('questionAnswerInput').value.trim();

activateQuizCheckbox.addEventListener('change', function() {
        if (this.checked) {
            console.log('Check activated');
            activateQuiz();
}else{
deactivateQuiz();
        }




    });





// Function to parse the question list and generate quiz questions array
function parseQuestionList(questionList) {
    // Split the question list by '#' character to get individual lines
    const lines =questionList.split('#');
    const quizQuestions = [];

    // Loop through each line in the question list
    for (const line of lines) {
        // Split the line by '~' to separate question and answer
        const [prompt, answer] = line.split('~');

        // Extract the prompt by removing the "Start With" part and trimming any leading/trailing spaces
        const extractedPrompt = prompt.replace("Start With ", "").trim();

        // Construct the question object and add it to the quizQuestions array
        const questionObj = {
            question: `${extractedPrompt}(${scrambleSentence(answer)})`, // Generate scrambled question
            answer: answer.trim() // Trim any leading/trailing spaces from the answer
        };
        quizQuestions.push(questionObj);
    }

    return quizQuestions;
}

// Example question list
const questionList =questionAnswerInput.value ;

// Generate quiz questions array from the question list
const quizQuestions = parseQuestionList(questionList);
console.log(quizQuestions);

function scrambleSentence(sentence) {
    const words = sentence.split(' ');
    const scrambledWords = words.map(word => {
        const characters = word.split('');
        const shuffledCharacters = shuffleArray(characters);
        return shuffledCharacters.join('');
    });
    return scrambledWords.join(' ');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function scrambleWord(word) {
    const characters = word.split('');
    const shuffledCharacters = shuffleArray(characters);
    return shuffledCharacters.join('');
}

// Function to generate scrambled questions and answers
function generateScrambledQuestionsAndAnswers(quizQuestions) {
    const scrambledQuestions = [];
    for (const questionObj of quizQuestions) {
        const { question, answer } = questionObj;
        const scrambledAnswer = scrambleWord(answer);
        scrambledQuestions.push({ question, scrambledAnswer });
    }
    return scrambledQuestions;
}

async function startQuizWithTimer() {
    currentQuestionIndex = 0;

    // Generate scrambled questions and answers
    const scrambledQuestions = generateScrambledQuestionsAndAnswers(quizQuestions);

    while (currentQuestionIndex < scrambledQuestions.length) {
        const { question, scrambledAnswer } = scrambledQuestions[currentQuestionIndex];

        // Construct the message to send to the chat
        const message = `Question: ${question} (Answer: ${scrambledAnswer})`;

        // Send the message to the chat
        await sendMessage(message);

        attempts = 0;
        let answeredCorrectly = false;

        while (attempts < maxAttempts && !answeredCorrectly) {
            // Wait for 20 seconds for user to answer
            await new Promise(resolve => setTimeout(resolve, 20000));

            // Check if the question was answered correctly
            if (answeredCorrectly) {
                break;
            }

            attempts++;
        }

        // If no correct answer was received after maxAttempts, reveal the correct answer
        if (!answeredCorrectly) {
            await sendMessage(`No correct answer received. The correct answer is: ${scrambledAnswer}`);
        }

        currentQuestionIndex++;
    }

    await sendMessage('Quiz finished!');
}

// Function to calculate score based on attempts
function getScore(attempts) {
    switch (attempts) {
        case 0: return 500;
        case 1: return 200;
        case 2: return 100;
        case 3: return 50;
        case 4: return 10;
        default: return 0;
    }
}


//======================================



// Function to handle form submission
//document.getElementById('quizForm').addEventListener('submit', async function(event) {
  //  event.preventDefault(); // Prevent the default form submission

    const questionAnswerInput = document.getElementById('questionAnswerInput').value.trim();
    if (questionAnswerInput) {
        // Split the input into questions and answers
        const lines = questionAnswerInput.split('\n');
        const scrambledLines = lines.map(line => {
            const [question, answer] = line.split('~').map(item => item.trim());
            const scrambledQuestion = scrambleSentence(question);
            const scrambledAnswer = scrambleSentence(answer);
            return `Question: ${scrambledQuestion}\nAnswer: ${scrambledAnswer}`;
        });

        // Post the scrambled questions and answers to the chatroom
        for (const line of scrambledLines) {
            await sendMessage(line);
        }
    } else {
        // Inform the user if the input is empty
        alert('Please enter your questions and answers.');
    }
});


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


  
    welcomeCheckbox.addEventListener('change', () => {
        sendWelcomeMessages = welcomeCheckbox.checked;
    });
spinCheckbox.addEventListener('change', () => {
        sendspinMessages = spinCheckbox.checked;
    });
    roomListbox.addEventListener('change', async () => {
        const selectedRoom = roomListbox.value;
        if (selectedRoom) {
            await joinRoom(selectedRoom);
        }
    });

    emojiList.addEventListener('click', (event) => {
        if (event.target.classList.contains('emoji-item')) {
            const emoji = event.target.textContent;
            messageInput.value += emoji;
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
            await chat('syntax-error', 'your message here');
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
//  joinlog.textContent = `you join the  ${roomName }`;
       if (sendWelcomeMessages) {
            const goodbyeMessage = `Bye ${userName}!`;
            await sendMessage(goodbyeMessage);
        }

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



 const masterUsernames = masterInput.value.split('#').map(username => username.trim());

    if (masterUsernames.includes(from)) {

    



}
// Dim obj2 As Object = New With {Key .handler = "profile_other", Key .id = Me.PacketID, Key .type = username}

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
