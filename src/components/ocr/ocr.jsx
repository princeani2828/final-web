import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import "./ocr.css";
import OCRInput from "./ocrinput"; // Import the new component
import { HiOutlineChevronUpDown } from "react-icons/hi2";

export default function IntegratedScanAI() {
  const webcamRef = useRef(null);
  const audioRef = useRef(null);
  const aiResponseAudioRef = useRef(null);
  const [images, setImages] = useState([]);
  const [scannedText, setScannedText] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(true);
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [buttonText, setButtonText] = useState("Capture Ingredient");
  const [isHelpExpanded, setIsHelpExpanded] = useState(false); // State for Help Us button
  const [isMuted, setIsMuted] = useState(() => {
    const savedMuteState = localStorage.getItem('ocrScannerMuted');
    return savedMuteState === 'true';
  });
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(() => {
    const savedVibrationState = localStorage.getItem('ocrScannerVibration');
    return savedVibrationState !== 'false';
  });
  const [isAIResponseReady, setIsAIResponseReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAIResponseReady(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);
  // Add countdown timer effect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setLoading(false);
      setButtonText(
        images.length === 0
          ? "Capture Ingredient"
          : images.length === 1
            ? "Capture Nutritional Info"
            : "Restart"
      );
    }
    return () => clearInterval(timer);
  }, [countdown, images.length]);

  // Add useEffect for fetching user data
  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio("/beep-6-96243.mp3");
    audioRef.current.volume = isMuted ? 0 : 0.3;

    // Initialize AI response audio
    aiResponseAudioRef.current = new Audio("");
    aiResponseAudioRef.current.volume = isMuted ? 0 : 0.3;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (aiResponseAudioRef.current) {
        aiResponseAudioRef.current.pause();
        aiResponseAudioRef.current = null;
      }
    };
  }, []);

  const playBeepSound = () => {
    if (audioRef.current && !isMuted) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        console.log("Error playing sound:", error);
        audioRef.current.load();
        audioRef.current.play().catch(e => console.log("Failed to play sound after reload:", e));
      });
    }
  };

  const playAIResponseSound = () => {
    if (aiResponseAudioRef.current && !isMuted) {
      aiResponseAudioRef.current.currentTime = 0;
      aiResponseAudioRef.current.play().catch(error => {
        console.log("Error playing AI response sound:", error);
        aiResponseAudioRef.current.load();
        aiResponseAudioRef.current.play().catch(e => console.log("Failed to play AI response sound after reload:", e));
      });
    }
  };

  const vibrateAIResponse = () => {
    if (isVibrationEnabled && window.navigator.vibrate) {
      // Success vibration pattern: 150ms on, 50ms off, 150ms on, 50ms off, 150ms on
      window.navigator.vibrate([150, 50, 150, 50, 150]);
    }
  };

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    localStorage.setItem('ocrScannerMuted', newMuteState);
    if (audioRef.current) {
      audioRef.current.volume = newMuteState ? 0 : 0.3;
    }
  };

  const toggleVibration = () => {
    const newVibrationState = !isVibrationEnabled;
    setIsVibrationEnabled(newVibrationState);
    localStorage.setItem('ocrScannerVibration', newVibrationState);
  };

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

  const captureImage = async () => {
    if (!webcamRef.current) return;
    setLoading(true);
    playBeepSound();

    const imgSrc = webcamRef.current.getScreenshot();
    const newImages = [...images, imgSrc];
    setImages(newImages);

    if (newImages.length === 2) {
      setShowWebcam(false);
      await fetchAIResponse(newImages);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setLoading(true);
      playBeepSound();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imgSrc = reader.result;
        const newImages = [...images, imgSrc];
        setImages(newImages);
        if (newImages.length === 2) {
          setShowWebcam(false);
          await fetchAIResponse(newImages);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchAIResponse = async (imgSrcs) => {
    setLoading(true);
    setCountdown(5); // 3 seconds countdown for AI processing
    setButtonText("Processing...");

    try {
      const genAI = new GoogleGenerativeAI("AIzaSyC1PmlFxhrzSo5cYJj6QhBJqmVYNKw4cv0");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const results = await Promise.all(
        imgSrcs.map(async (imgSrc, index) => {
          const base64Data = imgSrc.split(",")[1];
          const promptText =
            index === 0
              ? "Read only the ingredient part from this image."
              : "Read only the nutritional information part from this image.";
          const result = await model.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: promptText,
                  },
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
        })
      );

      setAiResponse(results.join("\n"));

      const ocrResults = await Promise.all(
        imgSrcs.map((imgSrc) =>
          Tesseract.recognize(imgSrc, "eng").then(({ data: { text } }) => text.trim())
        )
      );
      setScannedText(ocrResults.join("\n"));

      // Play AI response sound when AI response is generated
      playAIResponseSound();
      vibrateAIResponse();
      setIsAIResponseReady(true);
      setCountdown(0); // Remove countdown when AI response is generated
      setButtonText("AI Analysis Ready"); // Update button text
    } catch (error) {
      console.error(error);
      setAiResponse("Error extracting information.");
      setIsAIResponseReady(false);
      setCountdown(0); // Remove countdown on error
      setButtonText("Capture Ingredient"); // Reset button text
    }
  };

  const handleCaptureButtonClick = () => {
    if (images.length >= 2) {
      handleReset();
    } else {
      setShowWebcam(true);
      captureImage();
    }
  };

  const handleReset = () => {
    setImages([]);
    setScannedText("");
    setAiResponse("");
    setShowWebcam(true);
    setCountdown(0);
    setButtonText("Capture Ingredient");
    setIsAIResponseReady(false);
  };

  const handleRedirect = () => {
    navigate("/ocrusers", { state: { aiResponse } });
  };

  return (
    <div className="app-container">
      <div className="ocr-header">
        <h1
          className="header"
          data-text={showUserProfile ? "User Health Profile Details" : "AI-Enhanced OCR"}
        >
          {showUserProfile ? "User Health Profile Details" : "AI-Enhanced OCR"}
        </h1>
        <div className="control-buttons">
          <button
            onClick={toggleVibration}
            className={`control-button ${isVibrationEnabled ? 'enabled' : 'disabled'}`}
            title={isVibrationEnabled ? "Disable vibration" : "Enable vibration"}
          >
            {isVibrationEnabled ? "📳" : "📴"}
          </button>
          <button
            onClick={toggleMute}
            className={`control-button ${isMuted ? 'muted' : ''}`}
            title={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>
      <div className="main-content">
        {user && userDetails ? (
          <div className="ocr-user-details">
            <button
              className={`profile-button ${showUserProfile ? "expanded" : ""}`}
              onClick={() => setShowUserProfile(!showUserProfile)}
            >
              <div className="profile-button-content">
                <div className="profile-avatar">
                  {userDetails.firstName?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="profile-name">
                  {userDetails.firstName} {userDetails.lastName}
                </div>
                <HiOutlineChevronUpDown size={19} />
              </div>
              <div className={`profile-details ${showUserProfile ? "show" : ""}`}>
                <div className="health-parameters">
                  <p>
                    <strong>Age:</strong> {userDetails.age}
                  </p>
                  <p>
                    <strong>Gender:</strong> {userDetails.gender}
                  </p>
                  <p>
                    <strong>BMI:</strong> {userDetails.bmi}
                  </p>
                  <p>
                    <strong>Diabetes Type:</strong> {userDetails.diabetesType}
                  </p>
                  <p>
                    <strong>Fasting Blood Sugar Level:</strong> {userDetails.fastingBloodSugar}
                  </p>
                  <p>
                    <strong>Postprandial Blood Sugar Level:</strong> {userDetails.postprandialBloodSugar}
                  </p>
                  <p>
                    <strong>Allergies:</strong> {userDetails.allergies || "None"}
                  </p>
                  <p>
                    <strong>Meal Preference:</strong>{" "}
                    {userDetails.mealPreference || "None"}
                  </p>
                  <p>
                    <strong>Blood Pressure:</strong>{" "}
                    {userDetails.bloodPressure || "Not provided"}
                  </p>
                  <p>
                    <strong>Blood Pressure Type:</strong> {userDetails.bloodPressureType || "None"}
                  </p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <p className="ocr-loading-text">Loading user health profile...</p>
        )}

        <div
          className="ocr-main-content"
          style={{ display: showUserProfile ? "none" : "block" }}
        >
          {showWebcam && (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="webcam"
              videoConstraints={{
                facingMode: "environment",
              }}
            />
          )}
          <br />
          <div className="together">
            <button
              onClick={handleCaptureButtonClick}
              disabled={loading}
              className="capture-button"
            >
              {loading
                ? `${buttonText} (${countdown}s)`
                : images.length === 0
                  ? "Capture Ingredient"
                  : images.length === 1
                    ? "Capture Nutritional Info"
                    : "Restart"}
            </button>
            <br />
            <label className="upload-button">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={loading}
              />
              {loading ? `Processing... (${countdown}s)` : "Choose File"}
            </label>
          </div>

          {images.length > 0 && (
            <div>
              <h2>Captured Images</h2>
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Captured ${index + 1}`}
                  className="preview-image"
                />
              ))}
            </div>
          )}

          <OCRInput
            scannedText={scannedText}
            aiResponse={aiResponse}
            scannedImages={images}
          />
          <button
            onClick={handleRedirect}
            className="redirect-button result-button"
            disabled={!isAIResponseReady} // Enable after 4 sec
          >
            AI Analysis
          </button>
          <button
            onClick={async () => {
              const db = getFirestore();
              const barcodeId = `${Date.now()}`; // Generate a unique ID for the barcode
              const scannedCode = ""; // Initially empty scanned code

              try {
                // Save the barcodeId and aiResponse to Firestore with an empty scannedCode
                await setDoc(doc(db, "Barcodes", barcodeId), {
                  barcodeId,
                  scannedCode, // Initially empty
                  aiResponse,  // Save the AI response
                });

                // Navigate to the BarcodeScanner page with the barcodeId and aiResponse
                navigate("/barcode1", { state: { barcodeId, aiResponse } });
              } catch (error) {
                console.error("Error saving initial data to Firebase:", error);
              }
            }}
            className={`help-us-button ${isHelpExpanded ? "expanded" : ""}`}
            disabled={!isAIResponseReady}
          >
            {isHelpExpanded ? "Add the barcode for us" : "Help Us By Adding Barcode"}
          </button>
        </div>
      </div>
    </div>
  );
}