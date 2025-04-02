import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiOutlineSend } from "react-icons/ai";
import { FiUpload, FiX } from "react-icons/fi";
import "./askai.css";

const AskAI = () => {
    const [messages, setMessages] = useState([
        {
            text: "Welcome to HealthSnap Chatbot! 👋\n\nI'm your specialized food label analysis assistant. I can help you with:\n• Analyzing food labels and ingredients\n• Checking nutritional information\n• Verifying FSSAI compliance\n• Identifying allergens and health concerns\n• Comparing food products\n\nJust ask me questions or upload a food label image!",
            sender: "ai"
        }
    ]);
    const [userInput, setUserInput] = useState("");
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fileUploaded, setFileUploaded] = useState(false);
    const [fileName, setFileName] = useState("");
    const [uploadError, setUploadError] = useState("");
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    // Load chat history from localStorage on component mount
    useEffect(() => {
        const savedMessages = localStorage.getItem('chatHistory');
        if (savedMessages) {
            const parsedMessages = JSON.parse(savedMessages);
            setMessages(parsedMessages);
        }
    }, []);

    // Save chat history to localStorage whenever messages change
    useEffect(() => {
        localStorage.setItem('chatHistory', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const fetchAIResponse = async () => {
        if (loading || (!userInput.trim() && !image)) return;

        const userMessage = { text: userInput || "Food label image uploaded", sender: "user", image };
        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);
        setUserInput("");
        setImage(null);
        setFileUploaded(false);
        setFileName("");
        setUploadError("");

        try {
            const genAI = new GoogleGenerativeAI("AIzaSyDCvz2XzpESIWiSJE2dxsMrOy2t4olGA1o");
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            // Create context from recent messages (last 5 exchanges)
            const recentMessages = messages.slice(-10).map(msg => 
                `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
            ).join('\n');

            const systemPrompt = `You are a specialized Food & Nutrition Assistant for HealthSnap, focused on analyzing food labels and providing detailed nutritional information. Your expertise includes:

1. Food Label Analysis:
   - Detailed analysis of ingredients lists
   - Nutritional information breakdown
   - FSSAI compliance verification
   - Allergen identification
   - Health impact assessment

2. Product Comparison:
   - Compare nutritional values
   - Evaluate ingredient quality
   - Assess health benefits/risks
   - Suggest healthier alternatives

3. Health & Safety:
   - Identify potential health concerns
   - Highlight beneficial ingredients
   - Flag harmful additives
   - Provide dietary recommendations

4. Project-Specific Knowledge:
   - Understanding of HealthSnap's food analysis system
   - Familiarity with FSSAI guidelines
   - Knowledge of common food additives
   - Expertise in nutritional labeling

Keep responses:
- Clear and structured
- Focused on food safety and nutrition
- Based on scientific evidence
- Practical and actionable
- Easy to understand
- Contextually relevant to the conversation

Previous conversation context:
${recentMessages}

If the question is not related to food or nutrition, politely redirect the user to ask food-related questions.`;

            const parts = [
                { text: systemPrompt },
                { text: "User's question: " + userInput }
            ];

            if (image) {
                const base64 = await convertImageToBase64(image);
                parts.push({
                    inlineData: { mimeType: image.type, data: base64.split(",")[1] },
                });
            }

            const result = await model.generateContent({
                contents: [{ role: "user", parts }],
            });

            const aiResponse = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to respond.";
            setMessages((prev) => [...prev, { text: aiResponse, sender: "ai" }]);
        } catch (error) {
            console.error("Error fetching AI response:", error);
            setMessages((prev) => [...prev, { 
                text: "I apologize, but I encountered an error. Please try asking your food-related question again.", 
                sender: "ai" 
            }]);
        }
        setLoading(false);
    };

    const clearChatHistory = () => {
        setMessages([{
            text: "Welcome to HealthSnap Chatbot! 👋\n\nI'm your specialized food label analysis assistant. I can help you with:\n• Analyzing food labels and ingredients\n• Checking nutritional information\n• Verifying FSSAI compliance\n• Identifying allergens and health concerns\n• Comparing food products\n\nJust ask me questions or upload a food label image!",
            sender: "ai"
        }]);
        localStorage.removeItem('chatHistory');
    };

    const convertImageToBase64 = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
        });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        setUploadError("");
        
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setUploadError("File size should be less than 5MB");
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                setUploadError("Please upload an image file");
                return;
            }

            setImage(file);
            setFileName(file.name);
            setFileUploaded(true);
        }
    };

    const removeFile = () => {
        setImage(null);
        setFileName("");
        setFileUploaded(false);
        setUploadError("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            fetchAIResponse();
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h2>HealthSnap Food Assistant</h2>
            </div>
            <div className="title-container">
                <p className="title">Your smart companion for food label analysis and nutritional guidance</p>
                <button className="clear-chat" onClick={clearChatHistory}>
                    Clear Chat
                </button>
            </div>

            <div className="chat-box">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                        {msg.image && <img src={URL.createObjectURL(msg.image)} alt="Food Label" className="chat-image" />}
                        {msg.text}
                    </div>
                ))}
                {loading && (
                    <div className="loading">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                )}
                <div ref={chatEndRef}></div>
            </div>

            <div className="chat-input">
                <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about food labels, ingredients, or upload a food label image..."
                    disabled={loading}
                />
                <div className="together">
                    <label className={`upload-button ${fileUploaded ? 'file-uploaded' : ''}`}>
                        <FiUpload className="file-icon" />
                        <span className="file-label">
                            {fileUploaded ? (
                                <>
                                    <span className="file-name">{fileName}</span>
                                    <FiX 
                                        className="remove-file" 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            removeFile();
                                        }}
                                    />
                                </>
                            ) : (
                                "Add Label"
                            )}
                        </span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden-file-input"
                            disabled={loading}
                        />
                    </label>
                    {uploadError && <span className="upload-error">{uploadError}</span>}
                    <AiOutlineSend 
                        className="send-icon" 
                        onClick={fetchAIResponse}
                        style={{ 
                            opacity: loading ? 0.5 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default AskAI;