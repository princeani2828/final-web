import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import "./ocruser.css";

export default function OCRUsers() {
    const location = useLocation();
    const navigate = useNavigate();
    const { aiResponse } = location.state || { aiResponse: "No AI response available" }; // Keep this for logic but hide it from the UI
    const [promptResponses, setPromptResponses] = useState(["", "", "", "", ""]);
    const [selectedOption, setSelectedOption] = useState("FSSAI");
    const [userDetails, setUserDetails] = useState(null);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = () => {
        const auth = getAuth();
        const db = getFirestore();

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRef = doc(db, "Users", user.uid);
                try {
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        setUserDetails(userDoc.data());
                    }
                } catch (error) {
                    console.error("Error fetching user details:", error);
                }
            }
        });
    };

    useEffect(() => {
        async function fetchPromptResponses() {
            try {
                const { GoogleGenerativeAI } = await import("@google/generative-ai");
                const genAI = new GoogleGenerativeAI("AIzaSyDCvz2XzpESIWiSJE2dxsMrOy2t4olGA1o");
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const prompts = [
                    `### **User Usage Approval based on allergies in Ingredient: "${aiResponse}"** - Provide the User approval status as Approved, Restricted, or Notusable   in one word only add a comma after that  then give reason in 5 words, considering the user's health profile only  Allergies (${userDetails.allergies || "None"}), ensuring strict adherence to verified health sources.`,
                
                    `### **Safety Score Evaluation for Ingredient: "${aiResponse}"** - Provide a one word is it safe or unsafe the give reason in 7 words max  response stating whether the ingredient is Safe or Unsafe in one word , briefly justifying in one sentnace  if possible, and ensuring 95% accuracy strictly based on  considering the user's health profile including Activity Level (${userDetails.activityLevel || "Not provided"}), Diabetes Type (${userDetails.diabetesType || "Not provided"}), Sugar Sensitivity (${userDetails.sugarSensitivity || "Not provided"}), Allergies (${userDetails.allergies || "None"}), Dietary Preference (${userDetails.dietaryPreference || "None"}), Food Avoidances (${userDetails.foodAvoidances || "None"}), Medications (${userDetails.medications || "None"}), Water Intake (${userDetails.waterIntake || "Not provided"}), Blood Pressure (${userDetails.bloodPressure || "Not provided"}), Fasting Blood Sugar (${userDetails.fastingBloodSugar || "Not provided"}), HbA1c (${userDetails.hba1c || "Not provided"}), Postprandial Blood Sugar (${userDetails.postprandialBloodSugar || "Not provided"}), Preferred Sugar Alternatives (${userDetails.sugarAlternatives || "None"}), and Meal Preference (${userDetails.mealPreference || "None"}), ensuring all dietary insights align with verified health sources.`,
                
                    `### **Final Verdict on Ingredient: "${aiResponse}"** - Provide a 20 words  max conclusive analysis mentioning the ingredient's safety status and regulation basis with 95% accuracy strictly based on verified sources, considering the user's health profile including Activity Level (${userDetails.activityLevel || "Not provided"}), Diabetes Type (${userDetails.diabetesType || "Not provided"}), Sugar Sensitivity (${userDetails.sugarSensitivity || "Not provided"}), Allergies (${userDetails.allergies || "None"}), Dietary Preference (${userDetails.dietaryPreference || "None"}), Food Avoidances (${userDetails.foodAvoidances || "None"}), Medications (${userDetails.medications || "None"}), Water Intake (${userDetails.waterIntake || "Not provided"}), Blood Pressure (${userDetails.bloodPressure || "Not provided"}), Fasting Blood Sugar (${userDetails.fastingBloodSugar || "Not provided"}), HbA1c (${userDetails.hba1c || "Not provided"}), Postprandial Blood Sugar (${userDetails.postprandialBloodSugar || "Not provided"}), Preferred Sugar Alternatives (${userDetails.sugarAlternatives || "None"}), and Meal Preference (${userDetails.mealPreference || "None"}), strictly referencing verified health sources.`,
                
                    `### **Comprehensive Analysis for Ingredient: "${aiResponse}"** - In 35 words max  ,  provide a thorough evaluation by considering , safety rank, and user-specific health parameters including Activity Level (${userDetails.activityLevel || "Not provided"}), Diabetes Type (${userDetails.diabetesType || "Not provided"}), Sugar Sensitivity (${userDetails.sugarSensitivity || "Not provided"}), Allergies (${userDetails.allergies || "None"}), Dietary Preference (${userDetails.dietaryPreference || "None"}), Food Avoidances (${userDetails.foodAvoidances || "None"}), Medications (${userDetails.medications || "None"}), Water Intake (${userDetails.waterIntake || "Not provided"}), Blood Pressure (${userDetails.bloodPressure || "Not provided"}), Fasting Blood Sugar (${userDetails.fastingBloodSugar || "Not provided"}), HbA1c (${userDetails.hba1c || "Not provided"}), Postprandial Blood Sugar (${userDetails.postprandialBloodSugar || "Not provided"}), Preferred Sugar Alternatives (${userDetails.sugarAlternatives || "None"}), and Meal Preference (${userDetails.mealPreference || "None"}), ensuring a holistic conclusion strictly based on verified health sources also provide all the Sources after that regulations while offering personalized dietary recommendations .`
                ];
                

                // Send five parallel requests
                const responses = await Promise.all(prompts.map(prompt => model.generateContent(prompt)));

                // Extract text responses
                const extractedResponses = responses.map(res => 
                    res.response?.candidates?.[0]?.content?.parts?.[0]?.text || "No response available"
                );
                
                setPromptResponses(extractedResponses);
            } catch (error) {
                console.error("Error fetching AI response:", error);
                setPromptResponses(["Error retrieving information.", "Error retrieving information.", "Error retrieving information.", "Error retrieving information.", "Error retrieving information."]);
            }
        }

        if (userDetails) {
            fetchPromptResponses();
        }
    }, [aiResponse, userDetails]);

    const formatResponse = (response, index, title) => (
        <div key={index} className="response-section">
            <h3>{title} {index + 1}</h3>
            <p>{response}</p>
        </div>
    );

    const handleFSSAIButtonClick = () => {
        setSelectedOption("FSSAI");
        navigate("/ocruser", { state: { aiResponse } });
    };

    return (
        <div className="ocr-user-container">
            <div className="button-container">
                <button 
                    className={`theme-button ${selectedOption === "FSSAI" ? "active" : ""}`}
                    onClick={handleFSSAIButtonClick}
                >
                    <span className="button-icon">🔍</span>
                    Click Here For FSSAI Based Analysis
                </button>
                <button 
                    className={`theme-button ${selectedOption === "User" ? "active" : ""} hidden`}
                    onClick={() => setSelectedOption("User")}
                >
                    <span className="button-icon">👤</span>
                    User Profile
                </button>
            </div>
            {/* Removed OCRInput that uses aiResponse */}
            {/* <OCRInput aiResponse={aiResponse} /> */}
            <div className="ai-explanations">
                <h2 className="section-title">User Based Analysis</h2>
                {promptResponses.some(response => response) ? (
                    <>
                        {formatResponse(promptResponses[0], 0, "User Allergy based Status:")}
                        {formatResponse(promptResponses[1], 1, "Safety rank Evaluation")}
                        {formatResponse(promptResponses[2], 2, "Final Verdict based on user profile")}
                        {formatResponse(promptResponses[3], 3, "Comprehensive Analysis based on user profile")}
                    </>
                ) : (
                    <p className="loading-text">Loading...</p>
                )}
            </div>
        </div>
    );
}