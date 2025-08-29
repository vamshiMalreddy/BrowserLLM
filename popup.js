// Initialize chat history and settings
let chatHistory = [];
let apiToken = '';

// Function to get AI response
async function getAIResponse(userInput, context = '') {
  if (!apiToken) {
    throw new Error('Please set up your Hugging Face API token in settings');
  }

  const prompt = context 
    ? `Context: ${context}\n\nHuman: ${userInput}\nAssistant: Let me help you understand this context and answer your question.`
    : `Human: ${userInput}\nAssistant:`;

  try {
    // First try with Mistral model
    const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false
        }
      })
    });

    if (!response.ok) {
      // If first model fails, try backup model
      const backupResponse = await fetch('https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            top_p: 0.95,
            return_full_text: false
          }
        })
      });

      if (!backupResponse.ok) {
        throw new Error(`API Error: ${backupResponse.status} ${backupResponse.statusText}`);
      }

      const backupData = await backupResponse.json();
      return processModelResponse(backupData);
    }

    const data = await response.json();
    return processModelResponse(data);
  } catch (error) {
    console.error('API Error:', error);
    if (error.message.includes('API Error: 401')) {
      throw new Error('Invalid API token. Please check your token in settings.');
    } else if (error.message.includes('API Error: 404')) {
      throw new Error('Model is currently loading. Please try again in a few seconds.');
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
}

// Helper function to process model response
function processModelResponse(data) {
  if (Array.isArray(data) && data[0] && typeof data[0] === 'string') {
    return data[0];
  } else if (Array.isArray(data) && data[0]?.generated_text) {
    return data[0].generated_text;
  } else if (typeof data === 'object' && data.generated_text) {
    return data.generated_text;
  }
  throw new Error('Unexpected API response format');
}

// Function to add message to chat
function addMessageToChat(role, content, isError = false) {
  const chat = document.getElementById('chat');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role.toLowerCase() === 'you' ? 'user-message' : 'ai-message'}`;
  
  // For system messages containing page context, add a collapsible view
  if (role === 'System' && content.includes('Page Context')) {
    const shortContent = content.split('\n')[0]; // Show only the first line
    messageDiv.innerHTML = `
      <b>${role}:</b> 
      <span class="context-preview">${shortContent}</span>
      <button class="toggle-context" onclick="this.parentElement.classList.toggle('expanded')">Show more</button>
      <div class="full-context">${content}</div>
    `;
    messageDiv.className += ' collapsible-context';
  } else {
    messageDiv.innerHTML = `<b>${role}:</b> ${content}`;
  }
  
  chat.appendChild(messageDiv);
  chat.scrollTop = chat.scrollHeight;
}

// Load settings and chat history when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  // Load API token
  const result = await chrome.storage.local.get(['huggingFaceToken', 'chatHistory']);
  if (result.huggingFaceToken) {
    apiToken = result.huggingFaceToken;
    document.getElementById('api-key-input').value = apiToken;
  }

  // Load chat history
  if (result.chatHistory) {
    chatHistory = result.chatHistory;
    const chat = document.getElementById('chat');
    chat.innerHTML = ''; // Clear default message
    chatHistory.forEach(msg => {
      addMessageToChat(msg.role, msg.content);
    });
  }

  // Settings panel toggle
  const settingsToggle = document.getElementById('settings-toggle');
  const settingsPanel = document.getElementById('settings-panel');
  settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('visible');
  });

  // Save token button
  document.getElementById('save-token').addEventListener('click', () => {
    const newToken = document.getElementById('api-key-input').value.trim();
    if (newToken) {
      apiToken = newToken;
      chrome.storage.local.set({ huggingFaceToken: apiToken });
      settingsPanel.classList.remove('visible');
      addMessageToChat('System', 'API token saved.');
    }
  });

  // Quick action buttons
  document.querySelectorAll('.quick-action-btn').forEach(button => {
    button.addEventListener('click', () => {
      const question = button.getAttribute('data-question');
      document.getElementById('user-input').value = question;
      sendMessage();
    });
  });

  // Hugging Face link
  document.getElementById('hf-link').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://huggingface.co/settings/tokens' });
  });

  // Extract content button
  document.getElementById('extract-btn').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject content script first
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['contentScript.js']
      });

      // Then try to get content
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract_content' });
      
      if (response && !response.error) {
        const contextMsg = {
          role: 'System',
          content: `Page Context - Title: ${response.title}\nURL: ${response.url}\nContent: ${response.text.substring(0, 500)}...`
        };
        chatHistory.push(contextMsg);
        addMessageToChat(contextMsg.role, contextMsg.content);
        chrome.storage.local.set({ chatHistory });
      } else {
        throw new Error(response?.error || 'Could not extract content.');
      }
    } catch (error) {
      console.error('Extraction error:', error);
      addMessageToChat('Error', error.message, true);
    }
  });

  // Clear history button
  document.getElementById('clear-btn').addEventListener('click', () => {
    chatHistory = [];
    chrome.storage.local.set({ chatHistory: [] });
    document.getElementById('chat').innerHTML = 'Chat history cleared.';
  });
});

// Function to send message
async function sendMessage() {
  const input = document.getElementById('user-input');
  const userText = input.value.trim();
  if (!userText) return;

  // Add user message to history and display
  const userMsg = { role: 'You', content: userText };
  chatHistory.push(userMsg);
  addMessageToChat(userMsg.role, userMsg.content);
  input.value = '';

  // Show loading message
  const loadingId = 'ai-loading-' + Date.now();
  addMessageToChat('AI', `<span id='${loadingId}'>Thinking...</span>`);

  try {
    // Get the last system message (context) if it exists
    const lastContext = chatHistory.filter(msg => msg.role === 'System').pop();
    
    // Get AI response
    const aiResponse = await getAIResponse(userText, lastContext?.content);
    
    // Clean up the response
    const cleanResponse = aiResponse
      .replace(/^(Assistant|Human):\s*/gi, '')
      .replace(/^\s*\n/gm, '')
      .trim();
    
    // Add AI response to history
    const aiMsg = { role: 'AI', content: cleanResponse };
    chatHistory.push(aiMsg);
    
    // Save updated history
    chrome.storage.local.set({ chatHistory });

    // Replace loading message
    const loadingElem = document.getElementById(loadingId);
    if (loadingElem) {
      loadingElem.parentNode.innerHTML = cleanResponse;
    }
  } catch (err) {
    console.error('Error:', err);
    const loadingElem = document.getElementById(loadingId);
    if (loadingElem) {
      loadingElem.parentNode.innerHTML = `Error: ${err.message}`;
    }
  }
}

// Add click event listener to send button
document.getElementById('send-btn').addEventListener('click', sendMessage);

// Add enter key event listener to input field
document.getElementById('user-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
}); 