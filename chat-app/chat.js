// Get DOM elements
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const messageList = document.getElementById("messageList");
const userList = document.getElementById("userList");
const usernameInput = document.getElementById("username");
const timerSetup = document.getElementById("timerSetup");
const chatContainer = document.getElementById("chatContainer");
const chatDuration = document.getElementById("chatDuration");
const startChatButton = document.getElementById("startChat");
const chatTimer = document.getElementById("chatTimer");
const selectedUserName = document.getElementById("selectedUserName");
const headerInfo = document.querySelector(".header-info h2");
const closeTimerSetup = document.getElementById("closeTimerSetup");
const extendChatDialog = document.getElementById("extendChatDialog");
const extendTimeDialog = document.getElementById("extendTimeDialog");
const feedbackDialog = document.getElementById("feedbackDialog");
const extendYesButton = document.getElementById("extendYes");
const extendNoButton = document.getElementById("extendNo");
const extendDuration = document.getElementById("extendDuration");
const confirmExtendButton = document.getElementById("confirmExtend");
const endChatButton = document.getElementById("endChatButton");

// Timer variables
let chatEndTime = null;
let timerInterval = null;
let isChatActive = false;
let selectedUser = null;

// Store username
let username = "";

// Store connected users
let connectedUsers = UserStorage.getAllUsers();

// Track message timestamps and response times
let lastMessageTime = null;
let responseTimes = [];
let averageResponseTime = 0;

// Store user response times
const userResponseTimes = new Map();

// Track user kindness scores
const userKindnessScores = new Map();

// Store conversation quality scores
const conversationQuality = new Map();

// Initialize the UI with stored data
function initializeFromStorage() {
  // Load and display stored messages
  const messages = MessageStorage.getAllMessages();
  messages.forEach((msg) => {
    addMessageToUI(msg.text, msg.isSent, msg.responseTime);
  });

  // Load and display stored users
  const users = UserStorage.getAllUsers();
  users.forEach((user) => {
    addUser(user);

    // Load user kindness scores
    const scores = KindnessStorage.getKindnessScores(user);
    scores.forEach((score) => updateUserKindness(user, score));

    // Load user response times
    const times = ResponseTimeStorage.getResponseTimes(user);
    if (times && times.length > 0) {
      updateUserResponseTime(user, times[times.length - 1]); // Update with most recent time
    }
  });
}

// Handle username input
usernameInput.addEventListener("change", (e) => {
  username = e.target.value;
  if (username) {
    addUser(username);
    UserStorage.saveUser(username);
  }
});

// Handle sending messages
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

function calculateResponseTime() {
  if (lastMessageTime) {
    const currentTime = Date.now();
    const responseTime = (currentTime - lastMessageTime) / 1000; // Convert to seconds
    responseTimes.push(responseTime);

    // Calculate average response time
    averageResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    return responseTime;
  }
  return null;
}

function formatMinutesForBox(seconds) {
  const minutes = (seconds / 60).toFixed(1);
  return minutes;
}

function getResponseTimeClass(responseTime) {
  if (responseTime <= 60) return "response-time-fast";
  if (responseTime <= 300) return "response-time-medium";
  return "response-time-slow";
}

function updateUserResponseTime(username, responseTime) {
  ResponseTimeStorage.saveResponseTime(username, responseTime);

  // Update the visual indicator
  const userDiv = document.querySelector(
    `.user-item[data-username="${username}"]`
  );
  if (!userDiv) return;

  const times = ResponseTimeStorage.getResponseTimes(username);
  if (!times || times.length === 0) return;

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const responseTimeBox = userDiv.querySelector(".response-time-box");

  if (responseTimeBox) {
    responseTimeBox.textContent = formatMinutesForBox(avgTime);
    responseTimeBox.className = `response-time-box ${getResponseTimeClass(
      avgTime
    )}`;
  }
}

function getKindnessEmoji(score) {
  if (score > 0.5) return "😊"; // Very kind
  if (score > 0) return "🙂"; // Kind
  if (score === 0) return "😐"; // Neutral
  if (score > -0.5) return "🙁"; // Unkind
  return "😠"; // Very unkind
}

function updateUserKindness(username, kindnessScore) {
  KindnessStorage.saveKindnessScore(username, kindnessScore);

  // Update the visual indicator
  updateUserKindnessDisplay(username);
}

function getUserAverageKindness(username) {
  const scores = KindnessStorage.getKindnessScores(username);
  if (!scores || scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function updateUserKindnessDisplay(username) {
  const userDiv = document.querySelector(
    `.user-item[data-username="${username}"]`
  );
  if (!userDiv) return;

  const avgKindness = getUserAverageKindness(username);
  const kindnessBox = userDiv.querySelector(".kindness-box");
  kindnessBox.style.backgroundColor = getKindnessColor(avgKindness);
  kindnessBox.textContent = getKindnessEmoji(avgKindness);
}

// Initialize chat timer
function startChatTimer(minutes) {
  const endTime = Date.now() + minutes * 60 * 1000;
  chatEndTime = endTime;
  isChatActive = true;

  updateTimerDisplay();

  timerInterval = setInterval(() => {
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const now = Date.now();
  const timeLeft = chatEndTime - now;

  if (timeLeft <= 0) {
    endChat();
    return;
  }

  const minutes = Math.floor(timeLeft / (60 * 1000));
  const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
  chatTimer.innerHTML = `<span class="timer-display">Time Remaining: ${minutes}:${seconds
    .toString()
    .padStart(2, "0")}</span>`;
}

function addUser(name) {
  if (!connectedUsers.has(name)) {
    connectedUsers.add(name);
    UserStorage.saveUser(name);

    const userDiv = document.createElement("div");
    userDiv.className = "user-item";
    userDiv.setAttribute("data-username", name);

    // Create the main user info section (status and name)
    const userInfoSection = document.createElement("div");
    userInfoSection.className = "user-info-section";
    userInfoSection.innerHTML = `
      <div class="user-status"></div>
      <div class="user-name">${name}</div>
    `;

    // Create the metrics section
    const userMetrics = document.createElement("div");
    userMetrics.className = "user-metrics";
    userMetrics.innerHTML = `
      <div class="metric-container">
        <div class="metric-title">Kindness</div>
        <span class="kindness-box">😐</span>
      </div>
      <div class="metric-container">
        <div class="metric-title">Response Time</div>
        <span class="response-time-box">-</span>
      </div>
    `;

    userDiv.appendChild(userInfoSection);
    userDiv.appendChild(userMetrics);

    // Add click handler for user selection
    userDiv.addEventListener("click", () => {
      if (name === username) return; // Can't chat with yourself
      selectUser(name, userDiv);
    });

    userList.appendChild(userDiv);

    // Initialize metrics if there are stored values
    const times = ResponseTimeStorage.getResponseTimes(name);
    if (times && times.length > 0) {
      updateUserResponseTime(name, times[times.length - 1]);
    }

    const scores = KindnessStorage.getKindnessScores(name);
    if (scores && scores.length > 0) {
      updateUserKindness(name, scores[scores.length - 1]);
    }
  }
}

function selectUser(name, userDiv) {
  // Remove selection from previously selected user
  const previousSelection = userList.querySelector(".user-item.selected");
  if (previousSelection) {
    previousSelection.classList.remove("selected");
  }

  // Select new user
  userDiv.classList.add("selected");
  selectedUser = name;

  // Update timer prompt with selected user's name
  selectedUserName.textContent = name;

  // Reset duration input
  chatDuration.value = "";

  // Show timer setup
  timerSetup.style.display = "flex";
}

// Handle close button click
closeTimerSetup.addEventListener("click", () => {
  timerSetup.style.display = "none";

  // Remove selection from user
  const selectedUserDiv = userList.querySelector(".user-item.selected");
  if (selectedUserDiv) {
    selectedUserDiv.classList.remove("selected");
  }
  selectedUser = null;
});

// Handle chat start
startChatButton.addEventListener("click", () => {
  const duration = parseInt(chatDuration.value);
  if (duration && duration > 0) {
    timerSetup.style.display = "none";

    // Enable chat interface
    messageInput.disabled = false;
    sendButton.disabled = false;

    // Update header
    headerInfo.textContent = `Chatting with ${selectedUser}`;
    chatTimer.style.display = "block";
    endChatButton.style.display = "block";

    // Clear previous messages
    messageList.innerHTML = "";

    // Start the timer
    startChatTimer(duration);
  }
});

// Handle end chat button click
endChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to end this chat?")) {
    clearInterval(timerInterval);
    isChatActive = false;
    endChatButton.style.display = "none";
    showFeedbackDialog();
  }
});

function endChat() {
  clearInterval(timerInterval);
  isChatActive = false;
  endChatButton.style.display = "none";

  // Show extend chat dialog
  extendChatDialog.style.display = "flex";
}

// Handle extend chat responses
extendYesButton.addEventListener("click", () => {
  extendChatDialog.style.display = "none";
  extendTimeDialog.style.display = "flex";
});

extendNoButton.addEventListener("click", () => {
  extendChatDialog.style.display = "none";
  showFeedbackDialog();
});

confirmExtendButton.addEventListener("click", () => {
  const duration = parseInt(extendDuration.value);
  if (duration && duration > 0) {
    extendTimeDialog.style.display = "none";
    startChatTimer(duration);

    // Re-enable chat interface
    messageInput.disabled = false;
    sendButton.disabled = false;
    chatTimer.style.display = "block";
    isChatActive = true;
  }
});

function showFeedbackDialog() {
  feedbackDialog.style.display = "flex";

  // Add click handlers for emoji buttons
  const emojiButtons = document.querySelectorAll(".emoji-button");
  emojiButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove previous selection
      emojiButtons.forEach((btn) => btn.classList.remove("selected"));

      // Select clicked button
      button.classList.add("selected");

      // Store conversation quality
      const quality = parseInt(button.dataset.value);
      conversationQuality.set(selectedUser, quality);

      // Close dialog and reset chat
      setTimeout(() => {
        feedbackDialog.style.display = "none";
        resetChat();
      }, 500);
    });
  });
}

function resetChat() {
  // Disable chat interface
  messageInput.disabled = true;
  sendButton.disabled = true;

  // Remove user selection
  const selectedUserDiv = userList.querySelector(".user-item.selected");
  if (selectedUserDiv) {
    selectedUserDiv.classList.remove("selected");
  }
  selectedUser = null;

  // Update header
  headerInfo.textContent = "Select a user to start chatting";
  chatTimer.style.display = "none";
  endChatButton.style.display = "none";

  // Clear messages
  messageList.innerHTML = "";
}

// Modify sendMessage to check if chat is active
function sendMessage() {
  const message = messageInput.value.trim();
  if (message && username) {
    if (!isChatActive) {
      addMessage("Chat time is over. You can no longer send messages.", false);
      messageInput.value = "";
      return;
    }

    // Calculate response time if there was a previous message
    const responseTime = isChatActive ? calculateResponseTime() : null;
    if (responseTime !== null) {
      updateUserResponseTime(username, responseTime);
    }

    // Add the message with response time if it exists
    addMessage(message, true, responseTime);
    messageInput.value = "";

    // Update last message time
    lastMessageTime = Date.now();

    // Simulate received message (in a real app, this would come from the server)
    setTimeout(() => {
      if (!isChatActive) return; // Don't send response if chat is over

      const simulatedResponseTime = calculateResponseTime();
      if (simulatedResponseTime !== null) {
        updateUserResponseTime("Bot", simulatedResponseTime);
      }
      addMessage(
        `This is a simulated response to: ${message}`,
        false,
        simulatedResponseTime
      );
      lastMessageTime = Date.now();
    }, 1000);
  }
}

function addMessageToUI(text, isSent, responseTime = null) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isSent ? "sent" : "received"}`;

  // Create message content wrapper
  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.textContent = text;
  messageDiv.appendChild(contentDiv);

  // Add kindness analysis
  const kindnessAnalysis = analyzeKindness(text);
  const kindnessDiv = document.createElement("div");
  kindnessDiv.className = "kindness-indicator";

  const kindnessDot = document.createElement("span");
  kindnessDot.className = "kindness-dot";
  kindnessDot.style.backgroundColor = getKindnessColor(kindnessAnalysis.score);

  const kindnessText = document.createElement("span");
  kindnessText.textContent = getKindnessDescription(kindnessAnalysis.score);

  kindnessDiv.appendChild(kindnessDot);
  kindnessDiv.appendChild(kindnessText);
  messageDiv.appendChild(kindnessDiv);

  messageList.appendChild(messageDiv);
  messageList.scrollTop = messageList.scrollHeight;
}

function addMessage(text, isSent, responseTime = null) {
  // Add message to UI
  addMessageToUI(text, isSent, responseTime);

  // Store message
  MessageStorage.saveMessage({
    text,
    isSent,
    responseTime,
    timestamp: Date.now(),
  });

  // Update user's average kindness (if it's not the bot)
  if (isSent) {
    const kindnessAnalysis = analyzeKindness(text);
    updateUserKindness(username, kindnessAnalysis.score);
  }
}

// Initialize demo users with random kindness scores
["Alice", "Bob", "Charlie"].forEach((name) => {
  addUser(name);
  // Simulate some random response times for initial users
  const randomTimes = Array.from({ length: 3 }, () => Math.random() * 400);
  randomTimes.forEach((time) => updateUserResponseTime(name, time));

  // Simulate random kindness scores
  const randomScores = Array.from({ length: 3 }, () => Math.random() * 2 - 1);
  randomScores.forEach((score) => updateUserKindness(name, score));
});

// Add bot user
addUser("Bot");

// Initialize the UI with stored data
initializeFromStorage();
