import { useState, useRef, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import Webcam from "react-webcam";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useLocation } from "react-router-dom";
import "./compare.css";
import { HiOutlineChevronUpDown } from "react-icons/hi2";

export default function Compare() {
    const location = useLocation();
    const selectedProducts = location.state?.selectedProducts || [];
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [comparisonResult, setComparisonResult] = useState(null);
    const [capturedImages, setCapturedImages] = useState([]);
    const [processingTimes, setProcessingTimes] = useState({
        capture: 0,
        upload: 0,
        analysis: 0,
        comparison: 0
    });
    const [remainingTime, setRemainingTime] = useState(0);
    const webcamRef = useRef(null);
    const fileInputRef = useRef(null);
    const timerRef = useRef(null);
    const [showUserProfile, setShowUserProfile] = useState(false);

    useEffect(() => {
        fetchUserData();
        if (selectedProducts.length > 0) {
            processSelectedProducts();
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [selectedProducts]);

    const fetchUserData = () => {
        const auth = getAuth();
        const db = getFirestore();

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
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

    const processSelectedProducts = async () => {
        setIsLoading(true);
        startCountdown(15); // Estimated 15 seconds for processing

        try {
            // Process the selected products directly from notifications
            const processedProducts = selectedProducts.map(product => ({
                ...product,
                images: product.scannedImages ? [
                    product.scannedImages.ingredients || '',
                    product.scannedImages.nutrition || ''
                ] : ['', ''],
                analysis: {
                    ingredients: product.aiResponse,
                    nutrition: product.aiResponse
                }
            }));

            setProducts(processedProducts);
            setProcessingTimes(prev => ({
                ...prev,
                analysis: Date.now()
            }));
        } catch (error) {
            console.error("Error processing selected products:", error);
        } finally {
            setIsLoading(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const startCountdown = (duration) => {
        setRemainingTime(duration);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (ms) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const captureImage = async () => {
        if (products.length >= 5) {
            alert("You can only compare up to 5 products.");
            return;
        }
        const startTime = Date.now();
        const imgSrc = webcamRef.current.getScreenshot();
        setCapturedImages((prev) => [...prev, imgSrc]);

        if (capturedImages.length === 1) {
            await processProduct(capturedImages[0], imgSrc);
            setCapturedImages([]);
            setProcessingTimes(prev => ({
                ...prev,
                capture: Date.now() - startTime
            }));
        }
    };

    const handleFileChange = async (event) => {
        if (products.length >= 5) {
            alert("You can only compare up to 5 products.");
            return;
        }

        const startTime = Date.now();
        const files = event.target.files;
        if (files.length >= 2) {
            const reader1 = new FileReader();
            const reader2 = new FileReader();

            reader1.onload = (e) => {
                const imgSrc1 = e.target.result;
                reader2.onload = async (e) => {
                    const imgSrc2 = e.target.result;
                    await processProduct(imgSrc1, imgSrc2);
                    setProcessingTimes(prev => ({
                        ...prev,
                        upload: Date.now() - startTime
                    }));
                };
                reader2.readAsDataURL(files[1]);
            };
            reader1.readAsDataURL(files[0]);
        } else {
            alert("Please select two images.");
        }
    };

    const processProduct = async (imageData1, imageData2) => {
        setIsLoading(true);
        const startTime = Date.now();
        startCountdown(15); // Estimated 15 seconds for processing

        try {
            const genAI = new GoogleGenerativeAI("AIzaSyC1PmlFxhrzSo5cYJj6QhBJqmVYNKw4cv0");
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            // Analyze ingredients
            const ingredientsResult = await analyzeImage(model, imageData1, "ingredients");
            // Analyze nutritional information
            const nutritionResult = await analyzeImage(model, imageData2, "nutrition");

            const newProduct = {
                timestamp: new Date().toISOString(),
                scannedImages: {
                    ingredients: imageData1,
                    nutrition: imageData2
                },
                aiResponse: ingredientsResult + "\n\n" + nutritionResult,
                analysis: {
                    ingredients: ingredientsResult,
                    nutrition: nutritionResult
                }
            };

            setProducts((prev) => [...prev, newProduct]);
            setProcessingTimes(prev => ({
                ...prev,
                analysis: Date.now() - startTime
            }));
        } catch (error) {
            console.error("Error processing product:", error);
        } finally {
            setIsLoading(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const analyzeImage = async (model, imageData, type) => {
        const base64Data = imageData.split(",")[1];
        const userHealthProfile = `
User Health Profile:
- Activity Level: ${userDetails?.activityLevel || "Not provided"}
- Diabetes Type: ${userDetails?.diabetesType || "Not provided"}
- Sugar Sensitivity: ${userDetails?.sugarSensitivity || "Not provided"}
- Allergies: ${userDetails?.allergies || "None"}
- Dietary Preference: ${userDetails?.dietaryPreference || "None"}
- Food Avoidances: ${userDetails?.foodAvoidances || "None"}
- Medications: ${userDetails?.medications || "None"}
- Water Intake: ${userDetails?.waterIntake || "Not provided"}
- Blood Pressure: ${userDetails?.bloodPressure || "Not provided"}
- Fasting Blood Sugar: ${userDetails?.fastingBloodSugar || "Not provided"}
- HbA1c: ${userDetails?.hba1c || "Not provided"}
- Postprandial Blood Sugar: ${userDetails?.postprandialBloodSugar || "Not provided"}
- Preferred Sugar Alternatives: ${userDetails?.sugarAlternatives || "None"}
- Meal Preference: ${userDetails?.mealPreference || "None"}
- BMI: ${userDetails?.bmi || "Not provided"}
- Height: ${userDetails?.height || "Not provided"} cm
- Weight: ${userDetails?.weight || "Not provided"} kg
- Age: ${userDetails?.age || "Not provided"}
- Gender: ${userDetails?.gender || "Not provided"}`;

        const promptText = type === "ingredients" 
            ? `First, extract and list all ingredients from this image. Then analyze considering FSSAI standards and the following user health profile:

${userHealthProfile}

Please provide:
1. First, list all ingredients found in the image
2. Then provide exactly 2 sentences:
   - First sentence: FSSAI compliance status and safety assessment
   - Second sentence: Key safety concerns based on user's health profile

Keep the analysis clear and concise.`

            : `First, extract and list all nutritional information from this image. Then analyze considering FSSAI standards and the following user health profile:

${userHealthProfile}

Please provide:
1. First, list all nutritional values found in the image
2. Then provide exactly 2 sentences:
   - First sentence: FSSAI compliance status and nutritional assessment
   - Second sentence: Health impact based on user's health profile

Keep the analysis clear and concise.`;

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: promptText },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: base64Data,
                            },
                        },
                    ],
                },
            ],
        });

        return result.response.text();
    };

    const generateComparison = async () => {
        if (products.length < 2) return;

        const startTime = Date.now();
        startCountdown(10);

        const comparisonData = products.map((product, index) => ({
            productNumber: index + 1,
            ingredients: product.analysis?.ingredients || product.aiResponse,
            nutrition: product.analysis?.nutrition || product.aiResponse
        }));

        const userHealthProfile = `
User Health Profile:
- Activity Level: ${userDetails?.activityLevel || "Not provided"}
- Diabetes Type: ${userDetails?.diabetesType || "Not provided"}
- Sugar Sensitivity: ${userDetails?.sugarSensitivity || "Not provided"}
- Allergies: ${userDetails?.allergies || "None"}
- Dietary Preference: ${userDetails?.dietaryPreference || "None"}
- Food Avoidances: ${userDetails?.foodAvoidances || "None"}
- Medications: ${userDetails?.medications || "None"}
- Water Intake: ${userDetails?.waterIntake || "Not provided"}
- Blood Pressure: ${userDetails?.bloodPressure || "Not provided"}
- Fasting Blood Sugar: ${userDetails?.fastingBloodSugar || "Not provided"}
- HbA1c: ${userDetails?.hba1c || "Not provided"}
- Postprandial Blood Sugar: ${userDetails?.postprandialBloodSugar || "Not provided"}
- Preferred Sugar Alternatives: ${userDetails?.sugarAlternatives || "None"}
- Meal Preference: ${userDetails?.mealPreference || "None"}
- BMI: ${userDetails?.bmi || "Not provided"}
- Height: ${userDetails?.height || "Not provided"} cm
- Weight: ${userDetails?.weight || "Not provided"} kg
- Age: ${userDetails?.age || "Not provided"}
- Gender: ${userDetails?.gender || "Not provided"}`;

        const comparisonPrompt = `Compare these ${products.length} products considering FSSAI standards and the following user health profile:

${userHealthProfile}

Products to Compare:
${comparisonData.map(product => `
Product ${product.productNumber}:
Analysis:
${product.ingredients}
${product.nutrition}
`).join('\n')}

Please provide exactly 1 sentence stating which product is the best choice and why, considering:
1. FSSAI compliance
2. User's health conditions
3. Nutritional value
4. Safety concerns
5. Dietary restrictions
Say one product which is better than other product give it in a 1 sentence any one from all of the other product.

Keep the response clear and concise.`;

        const genAI = new GoogleGenerativeAI("AIzaSyC1PmlFxhrzSo5cYJj6QhBJqmVYNKw4cv0");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        try {
            const result = await model.generateContent(comparisonPrompt);
            setComparisonResult(result.response.text());
            setProcessingTimes(prev => ({
                ...prev,
                comparison: Date.now() - startTime
            }));
        } catch (error) {
            console.error("Error generating comparison:", error);
        } finally {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const getScanButtonText = () => {
        if (products.length >= 5) {
            return "Maximum Products Reached (5)";
        }
        
        if (capturedImages.length === 0) {
            return `Scan Product ${products.length + 1} - Ingredients`;
        } else if (capturedImages.length === 1) {
            return `Scan Product ${products.length + 1} - Nutrition`;
        }
    };

    const getNextStepText = () => {
        if (products.length >= 5) {
            return "Maximum products reached";
        }
        
        if (capturedImages.length === 0) {
            return "Next: Scan ingredients list";
        } else if (capturedImages.length === 1) {
            return "Next: Scan nutrition information";
        } else if (capturedImages.length === 2) {
            return "Processing product...";
        }
    };

    const getComparisonMessage = () => {
        if (products.length === 0) {
            return "Scan at least 2 products to compare";
        } else if (products.length === 1) {
            return "Scan one more product to start comparison";
        } else if (products.length >= 2 && products.length < 5) {
            return `You can compare ${products.length} products or scan more (up to 5)`;
        } else {
            return "Maximum products reached. You can now compare all products.";
        }
    };

    return (
        <div className="compare-wrapper">
            <div className="compare-header">
                <h1>Product Comparison</h1>
                <p>Compare up to 5 products based on FSSAI standards and your health profile</p>
            </div>

            {user && userDetails ? (
                <div className="compare-user-details">
                    <button 
                        className={`profile-button ${showUserProfile ? 'expanded' : ''}`}
                        onClick={() => setShowUserProfile(!showUserProfile)}
                    >
                        <div className="profile-button-content">
                            <div className="profile-avatar">
                                {userDetails.firstName?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="profile-name">
                                {userDetails.firstName} {userDetails.lastName}
                            </div>
                            <HiOutlineChevronUpDown size={19}/>
                        </div>
                        <div className={`profile-details ${showUserProfile ? 'show' : ''}`}>
                            <div className="health-parameters">
                                <p><strong>Age:</strong> {userDetails.age}</p>
                                <p><strong>Gender:</strong> {userDetails.gender}</p>
                                <p><strong>BMI:</strong> {userDetails.bmi}</p>
                                <p><strong>Activity Level:</strong> {userDetails.activityLevel}</p>
                                <p><strong>Diabetes Type:</strong> {userDetails.diabetesType}</p>
                                <p><strong>Allergies:</strong> {userDetails.allergies || "None"}</p>
                                <p><strong>Dietary Preference:</strong> {userDetails.dietaryPreference || "None"}</p>
                                <p><strong>Health Conditions:</strong> {userDetails.medications || "None"}</p>
                                <p><strong>Blood Pressure:</strong> {userDetails.bloodPressure || "Not provided"}</p>
                                <p><strong>Blood Sugar:</strong> {userDetails.fastingBloodSugar || "Not provided"}</p>
                            </div>
                        </div>
                    </button>
                </div>
            ) : (
                <p className="compare-loading-text">Loading user health profile...</p>
            )}

            <div className="compare-camera-section" style={{ display: showUserProfile ? 'none' : 'flex' }}>
                <div className="camera-container">
                    <Webcam 
                        ref={webcamRef} 
                        screenshotFormat="image/png" 
                        className="compare-camera-view"
                        videoConstraints={{
                            facingMode: "environment"
                        }}
                    />
                    {capturedImages.length > 0 && (
                        <div className="captured-preview">
                            <div className="preview-grid">
                                <div className="preview-item">
                                    <div className="preview-header">Ingredients</div>
                                    <img 
                                        src={capturedImages[0]} 
                                        alt="Ingredients Preview" 
                                        className="preview-image" 
                                    />
                                </div>
                                {capturedImages.length > 1 && (
                                    <div className="preview-item">
                                        <div className="preview-header">Nutrition</div>
                                        <img 
                                            src={capturedImages[1]} 
                                            alt="Nutrition Preview" 
                                            className="preview-image" 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="compare-scan-controls">
                    <button className="compare-scan-button" onClick={captureImage} disabled={products.length >= 5}>
                        {getScanButtonText()}
                        {processingTimes.capture > 0 && <span className="compare-time-indicator"> ({formatTime(processingTimes.capture)})</span>}
                    </button>
                    <div className="compare-next-step">
                        {getNextStepText()}
                    </div>
                    <div className="comparison-message">
                        {getComparisonMessage()}
                    </div>
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple style={{ display: "none" }} />
                <button className="compare-scan-button" onClick={() => fileInputRef.current.click()}>
                    Choose Files
                    {processingTimes.upload > 0 && <span className="compare-time-indicator"> ({formatTime(processingTimes.upload)})</span>}
                </button>
            </div>

            {isLoading ? (
                <div className="compare-loading-container">
                    <p className="compare-loading-text">Processing...</p>
                    <div className="compare-time-remaining">
                        Estimated time remaining: {remainingTime}s
                    </div>
                </div>
            ) : (
                <div className="compare-products-display">
                    {products.map((product, index) => (
                        <div key={index} className="compare-product-container">
                            <div className="product-card">
                                <div className="product-header">
                                    <h3>Product {index + 1}</h3>
                                    <span className="timestamp">
                                        {new Date(product.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                {product.scannedImages && Object.keys(product.scannedImages).length > 0 && (
                                    <div className="product-images">
                                        <div className="image-grid">
                                            {product.scannedImages.ingredients && (
                                                <div className="image-container">
                                                    <div className="image-wrapper">
                                                        <img 
                                                            src={product.scannedImages.ingredients} 
                                                            alt="Ingredients" 
                                                            className="product-image"
                                                            onClick={() => window.open(product.scannedImages.ingredients, '_blank')}
                                                        />
                                                        <div className="image-overlay">
                                                            <span className="image-label">Ingredients</span>
                                                            <span className="view-full">Click to view full size</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {product.scannedImages.nutrition && (
                                                <div className="image-container">
                                                    <div className="image-wrapper">
                                                        <img 
                                                            src={product.scannedImages.nutrition} 
                                                            alt="Nutrition" 
                                                            className="product-image"
                                                            onClick={() => window.open(product.scannedImages.nutrition, '_blank')}
                                                        />
                                                        <div className="image-overlay">
                                                            <span className="image-label">Nutrition</span>
                                                            <span className="view-full">Click to view full size</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className="product-content">
                                    <h3>Analysis Results:</h3>
                                    {product.aiResponse.split('\n').map((line, lineIndex) => (
                                        <p key={lineIndex}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {products.length >= 2 && (
                <button onClick={generateComparison} className="compare-scan-button">
                    Compare Products ({products.length}/5)
                    {remainingTime > 0 && <span className="compare-time-remaining"> ({remainingTime}s remaining)</span>}
                </button>
            )}

            {comparisonResult && (
                <div className="comparison-result">
                    <h2>Best Product Recommendation</h2>
                    <div className="compare-recommendation-box">
                        <p className="recommendation-text">{comparisonResult}</p>
                    </div>
                </div>
            )}
        </div>
    );
}