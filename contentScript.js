// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract_content') {
    try {
      // Get page title
      const title = document.title;
      
      // Get page URL
      const url = window.location.href;
      
      // Get main content
      // First try to get article content
      let content = document.querySelector('article');
      
      // If no article, try main content
      if (!content) {
        content = document.querySelector('main');
      }
      
      // If no main, get body content
      if (!content) {
        content = document.body;
      }
      
      // Clean up the text content
      const text = content.innerText
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
        .trim();
      
      sendResponse({
        title: title,
        url: url,
        text: text,
        error: null
      });
    } catch (error) {
      sendResponse({
        error: 'Failed to extract content: ' + error.message
      });
    }
  }
  return true; // Required for async response
}); 