import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ocruser.css";

export default function OCRUsers() {
    const location = useLocation();
    const navigate = useNavigate();
    const { aiResponse } = location.state || { aiResponse: "No AI response available" };
    const [promptResponses, setPromptResponses] = useState(["", "", "", ""]);
    const [selectedOption, setSelectedOption] = useState("FSSAI");
    const [hasValidContent, setHasValidContent] = useState(false);

    useEffect(() => {
        // Check if the text contains ingredient or nutritional information
        const checkContent = () => {
            const lowerText = aiResponse.toLowerCase();
            const hasIngredient = lowerText.includes('ingredient');
            const hasNutritional = lowerText.includes('nutritional') || lowerText.includes('nutrition');
            setHasValidContent(hasIngredient || hasNutritional);
        };

        checkContent();
    }, [aiResponse]);

    useEffect(() => {
        async function fetchPromptResponses() {
            if (!hasValidContent) {
                setPromptResponses(["Nil", "Nil", "Nil", "Nil"]);
                return;
            }

            try {
                const { GoogleGenerativeAI } = await import("@google/generative-ai");
                const genAI = new GoogleGenerativeAI("AIzaSyDCvz2XzpESIWiSJE2dxsMrOy2t4olGA1o");
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                const prompts = [
                    `### **FSSAI Approval Status for Ingredient: "${aiResponse}"**\n\nProvide the FSSAI approval status in one word max.\n- Approved / Restricted / Banned\n- Include regulation number if available.\n- Ensure 95% accuracy strictly based on verified sources.`,
                    `### **Safety Score Evaluation for Ingredient: give score only if FSSAI approval status is approved. Give the answer in one word. "${aiResponse}"**\n\nGive a safety score (1-10) in one word max with consider with FSSAI Standard and Health risk.\n- Justify briefly with sources if possible.\n- Ensure 95% accuracy strictly based on verified sources like FSSAI site:fssai.gov.in.`,
                    `### **Final Verdict on Ingredient: "${aiResponse}"**\n\nSay Safe / Moderate / Unsafe  based on FSSAI standard and Regulation  in one sentences max.\n- Safe / Moderate / Unsafe based on regulations.\n- Ensure 95% accuracy strictly based on verified sources.`,
                    `### **Comprehensive Ingredient Analysis: "${aiResponse}"**\n\nProvide a concise analysis in two sentences max.\n- Mention definition, risks, benefits, and status.\n- Ensure 95% accuracy strictly based on verified sources..\n`
                ];

                const responses = await Promise.all(prompts.map(prompt => model.generateContent(prompt)));

                const extractedResponses = responses.map(res => 
                    res.response?.candidates?.[0]?.content?.parts?.[0]?.text || "No response available"
                );
                
                setPromptResponses(extractedResponses);
            } catch (error) {
                console.error("Error fetching AI response:", error);
                setPromptResponses(["Error retrieving information.", "Error retrieving information.", "Error retrieving information.", "Error retrieving information."]);
            }
        }

        fetchPromptResponses();
    }, [aiResponse, hasValidContent]);

    const formatResponse = (response, index, title) => (
        <div key={index} className="response-section">
            <h3>{title} {index + 1}</h3>
            <p>{response}</p>
        </div>
    );

    const handleFSSAIButtonClick = () => {
        setSelectedOption("FSSAI");
        navigate("/ocrusers", { state: { aiResponse } });
    };

    const handleUserButtonClick = () => {
        setSelectedOption("User");
        navigate("/ocrusers", { state: { aiResponse } });
    };

    return (
        <div className="ocr-user-container">
            <div className="button-container">
                <button 
                    className={`theme-button ${selectedOption === "FSSAI" ? "active" : ""} hidden`}
                    onClick={handleFSSAIButtonClick}
                >
                    <span className="button-icon">🔍</span>
                    FSSAI Based Analysis
                </button>
                <button 
                    className={`theme-button ${selectedOption === "User" ? "active" : ""}`}
                    onClick={handleUserButtonClick}
                >
                    <span className="button-icon">👤</span>
                    Click Here For User Profile Based Analysis
                </button>
            </div>
            {/* <OCRInput aiResponse={aiResponse} /> */}
            <div className="ai-explanations">
                <h2 className="section-title">FSSAI Based Analysis</h2>
                {!hasValidContent ? (
                    <p className="no-content-message">No ingredient or nutritional information found in the scanned text.</p>
                ) : promptResponses.some(response => response) ? (
                    <>
                        {formatResponse(promptResponses[0], 0, "FSSAI Approval Status:")}
                        {formatResponse(promptResponses[1], 1, "Safety Score Evaluation")}
                        {formatResponse(promptResponses[2], 2, "Final Verdict")}
                        {formatResponse(promptResponses[3], 3, "Comprehensive Analysis")}
                    </>
                ) : (
                    <p className="loading-text">Loading...</p>
                )}
            </div>
        </div>
    );
}