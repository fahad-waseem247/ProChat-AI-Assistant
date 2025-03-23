const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Replace with your Google Gemini API Key
const API_KEY = "Replace with your Google Gemini API Key";
const MAX_RESPONSE_LENGTH = 300; // Limit response to 300 characters

// Auto-resize textarea
userInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = `${this.scrollHeight}px`;
});

// Function to format response
function formatResponse(text) {
    // Trim to max length
    if (text.length > MAX_RESPONSE_LENGTH) {
        text = text.substring(0, MAX_RESPONSE_LENGTH) + "...";
    }
    
    // Split into paragraphs and clean up
    const paragraphs = text.split("\n").filter(p => p.trim() !== "");
    return paragraphs.map(p => p.trim()).join("\n");
}

// Function to add message to chatbox
function addMessage(message, isUser = false) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("chat", isUser ? "outgoing" : "incoming");
    
    // Format message if it's from the bot
    const formattedMessage = isUser ? message : formatResponse(message);
    messageDiv.innerHTML = isUser 
        ? `<p>${formattedMessage}</p>` 
        : `<span class="material-icons">smart_toy</span><p>${formattedMessage}</p>`;
    
    chatbox.appendChild(messageDiv);
    chatbox.scrollTop = chatbox.scrollHeight; // Auto-scroll to bottom
}

// Function to call Google Gemini API
async function getGeminiResponse(message) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: message
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Check if candidates exist in the response
        if (!data.candidates || !data.candidates.length) {
            throw new Error("No valid response from API");
        }

        return data.candidates[0].content.parts[0].text; // Extract the response text
    } catch (error) {
        throw error; // Re-throw error to handle in the caller function
    }
}

// Event listener for Send button
sendBtn.addEventListener("click", async () => {
    const message = userInput.value.trim();
    if (message === "") return;

    // Add user message to chatbox
    addMessage(message, true);
    userInput.value = ""; // Clear input
    userInput.style.height = "auto"; // Reset textarea height

    // Show "Thinking..." while waiting for response
    addMessage("Thinking...");

    try {
        // Get response from Gemini API
        const botResponse = await getGeminiResponse(message);
        
        // Remove "Thinking..." and add actual response
        chatbox.lastChild.remove();
        addMessage(botResponse);
    } catch (error) {
        chatbox.lastChild.remove();
        addMessage("Sorry, something went wrong! Check your API key or try again later.");
        console.error("Error:", error);
    }
});

// Allow sending message with Enter key
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});