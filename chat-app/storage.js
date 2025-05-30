// Keys for localStorage
const STORAGE_KEYS = {
  MESSAGES: "chat_messages",
  USERS: "chat_users",
  RESPONSE_TIMES: "chat_response_times",
  KINDNESS_SCORES: "chat_kindness_scores",
  CONVERSATION_QUALITY: "chat_conversation_quality",
};

// Track changes since last export
let changesSinceLastExport = {
  responseTimes: 0,
  kindnessScores: 0,
  conversationQuality: 0,
};

// Track analytics data for current session
let currentSessionData = {
  responseTimes: {},
  kindnessScores: {},
  conversationQuality: {},
  users: new Set(),
};

// Storage utility functions
const Storage = {
  // Save data to localStorage
  save: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  },

  // Load data from localStorage
  load: (key, defaultValue = null) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return defaultValue;
    }
  },

  // Clear all chat data
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },

  // Export data to text file
  exportToFile: (data, filename) => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "text/plain",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting file:", error);
    }
  },

  // Export analytics data (response times and kindness scores only)
  exportAnalytics: () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const formattedData = {
        timestamp: new Date().toISOString(),
        users: {},
      };

      Array.from(currentSessionData.users).forEach((username) => {
        formattedData.users[username] = {
          responseTimeAvg: ResponseTimeStorage.getAverageResponseTime(username),
          kindnessAvg: KindnessStorage.getAverageKindness(username),
          qualityAvg: ConversationQualityStorage.getAverageQuality(username),
        };
      });

      Storage.exportToFile(formattedData, `chat_analytics_${timestamp}.txt`);
    } catch (error) {
      console.error("Error exporting analytics data:", error);
    }
  },
};

// Message storage (no auto-export)
const MessageStorage = {
  saveMessage: (message) => {
    const messages = Storage.load(STORAGE_KEYS.MESSAGES, []);
    messages.push({
      ...message,
      timestamp: Date.now(),
    });
    Storage.save(STORAGE_KEYS.MESSAGES, messages);
  },

  getAllMessages: () => {
    return Storage.load(STORAGE_KEYS.MESSAGES, []);
  },

  clearMessages: () => {
    Storage.save(STORAGE_KEYS.MESSAGES, []);
  },
};

// User storage (no auto-export)
const UserStorage = {
  saveUser: (username) => {
    // Add to session data
    currentSessionData.users.add(username);

    // Also save to localStorage for persistence during session
    const users = Storage.load(STORAGE_KEYS.USERS, []);
    if (!users.includes(username)) {
      users.push(username);
      Storage.save(STORAGE_KEYS.USERS, users);
    }
  },

  getAllUsers: () => {
    return currentSessionData.users;
  },

  clearUsers: () => {
    currentSessionData.users.clear();
    Storage.save(STORAGE_KEYS.USERS, []);
  },
};

// Response time storage
const ResponseTimeStorage = {
  saveResponseTime: (username, time) => {
    // Store in current session data
    if (!currentSessionData.responseTimes[username]) {
      currentSessionData.responseTimes[username] = [];
    }
    // Convert to minutes and cap at 99
    const timeInMinutes = Math.min(99, Math.round(time / 60));
    currentSessionData.responseTimes[username].push(timeInMinutes);
  },

  getResponseTimes: (username) => {
    return currentSessionData.responseTimes[username] || [];
  },

  getAverageResponseTime: (username) => {
    const times = ResponseTimeStorage.getResponseTimes(username);
    if (!times || times.length === 0) return 0;
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    // Ensure the average is also capped at 99
    return Math.min(99, Math.round(avg));
  },

  clearResponseTimes: () => {
    currentSessionData.responseTimes = {};
  },
};

// Kindness score storage
const KindnessStorage = {
  saveKindnessScore: (username, score) => {
    // Store in current session data
    if (!currentSessionData.kindnessScores[username]) {
      currentSessionData.kindnessScores[username] = [];
    }
    // Normalize score to 1-5 range
    const normalizedScore = Math.max(
      1,
      Math.min(5, Math.round(score * 2.5 + 3))
    );
    currentSessionData.kindnessScores[username].push(normalizedScore);
  },

  getKindnessScores: (username) => {
    return currentSessionData.kindnessScores[username] || [];
  },

  getAverageKindness: (username) => {
    const scores = KindnessStorage.getKindnessScores(username);
    if (!scores || scores.length === 0) return 3; // Default to neutral
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(avg);
  },

  clearKindnessScores: () => {
    currentSessionData.kindnessScores = {};
  },
};

// Conversation quality storage
const ConversationQualityStorage = {
  saveQualityRating: (username, rating) => {
    if (!currentSessionData.conversationQuality[username]) {
      currentSessionData.conversationQuality[username] = [];
    }
    // Ensure rating is 1-5
    const normalizedRating = Math.max(1, Math.min(5, Math.round(rating)));
    currentSessionData.conversationQuality[username].push(normalizedRating);
    changesSinceLastExport.conversationQuality++;
  },

  getQualityRatings: (username) => {
    return currentSessionData.conversationQuality[username] || [];
  },

  getAverageQuality: (username) => {
    const ratings = ConversationQualityStorage.getQualityRatings(username);
    if (!ratings || ratings.length === 0) return 3; // Default to neutral
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return Math.round(avg);
  },

  clearQualityRatings: () => {
    currentSessionData.conversationQuality = {};
  },
};

// Save analytics when the window is about to close
window.addEventListener("beforeunload", () => {
  // Only export if there's data to save
  if (currentSessionData.users.size > 0) {
    Storage.exportAnalytics();
  }
});
