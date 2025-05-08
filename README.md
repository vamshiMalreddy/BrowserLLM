# BrowserLLM - AI Chat Assistant Chrome Extension

A powerful Chrome extension that brings AI-powered chat capabilities directly into your browser. Interact with webpage content, get summaries, and ask questions about any web page you're viewing.

## Features

- 🤖 AI-powered chat interface using Hugging Face models
- 📄 Webpage content extraction and analysis
- 💬 Interactive chat with context awareness
- 🔄 Automatic model fallback system
- ⚡ Quick action buttons for common queries
- 🎨 Modern, responsive UI with collapsible context views
- ⚙️ Configurable settings with API token management
- 💾 Persistent chat history

## Installation

1. Clone this repository:
```bash
git clone https://github.com/vamshiMalreddy/BrowserLLM.git
```

2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the cloned repository folder

## Setup

1. Get your Hugging Face API token:
   - Visit [Hugging Face Settings](https://huggingface.co/settings/tokens)
   - Create a new token with read access
   
2. Configure the extension:
   - Click the extension icon in Chrome
   - Click the ⚙️ (settings) icon
   - Enter your Hugging Face API token
   - Click "Save Token"

## Usage

1. **Extract Page Content**
   - Navigate to any webpage
   - Click the extension icon
   - Click "Extract Content" to load the page context

2. **Quick Actions**
   - Use pre-defined questions:
     - "What does this page talk about?"
     - "Can you summarize the main points?"
     - "Extract key data points"

3. **Custom Questions**
   - Type your question in the input field
   - Press Enter or click Send
   - The AI will respond based on the page context

## Technical Details

The extension uses two Hugging Face models:
- Primary: Mistral-7B-Instruct-v0.1
- Fallback: Zephyr-7b-beta

Features:
- Token limit: 500 tokens for detailed responses
- Automatic error handling and model fallback
- Context-aware conversations
- Persistent storage for settings and chat history

## Development

The extension is built using:
- HTML/CSS for the UI
- Vanilla JavaScript for functionality
- Chrome Extension Manifest V3
- Hugging Face API for AI capabilities

Key files:
- `popup.html` - Main extension interface
- `popup.js` - Core functionality and API integration
- `manifest.json` - Extension configuration
- `contentScript.js` - Webpage content extraction

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built using Hugging Face's powerful language models
- Inspired by the need for contextual AI assistance while browsing 