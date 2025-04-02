import { useEffect, useState, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useNavigate, useLocation } from "react-router-dom";
import { getFirestore, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import "./barcode1.css";

const BarcodeScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [productName, setProductName] = useState(""); // State for product name
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(() => {
    const savedMuteState = localStorage.getItem('barcodeScannerMuted');
    return savedMuteState === 'true';
  });
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(() => {
    const savedVibrationState = localStorage.getItem('barcodeScannerVibration');
    return savedVibrationState !== 'false';
  });
  const codeReader = new BrowserMultiFormatReader();
  const navigate = useNavigate();
  const location = useLocation();
  const { barcodeId, aiResponse } = location.state || {}; // Retrieve barcodeId and aiResponse from state
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio("/Barcode-scanner-beep-sound.mp3");
    audioRef.current.volume = isMuted ? 0 : 0.3;

    codeReader
      .getVideoInputDevices()
      .then((videoInputDevices) => {
        if (videoInputDevices.length > 0) {
          // Find the back camera
          const backCamera = videoInputDevices.find((device) =>
            device.label.toLowerCase().includes("back")
          );

          // Use the back camera if available, otherwise default to the first camera
          const selectedDevice = backCamera
            ? backCamera.deviceId
            : videoInputDevices[0].deviceId;

          startScanner(selectedDevice);
        } else {
          setError("No camera found!");
        }
      })
      .catch((err) => setError("Error accessing camera: " + err));

    return () => {
      codeReader.reset(); // Reset the scanner on component unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
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

  const vibrate = () => {
    if (isVibrationEnabled && window.navigator.vibrate) {
      // Stronger vibration pattern: 100ms on, 50ms off, 100ms on
      window.navigator.vibrate([100, 50, 100]);
    }
  };

  const vibrateSuccess = () => {
    if (isVibrationEnabled && window.navigator.vibrate) {
      // Success vibration pattern: 200ms on, 100ms off, 200ms on, 100ms off, 200ms on
      // Longer duration for better compatibility with iOS
      window.navigator.vibrate([200, 100, 200, 100, 200]);
    }
  };

  const toggleVibration = () => {
    const newVibrationState = !isVibrationEnabled;
    setIsVibrationEnabled(newVibrationState);
    localStorage.setItem('barcodeScannerVibration', newVibrationState);
  };

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    localStorage.setItem('barcodeScannerMuted', newMuteState);
    if (audioRef.current) {
      audioRef.current.volume = newMuteState ? 0 : 0.3;
    }
  };

  const startScanner = (videoInputId) => {
    codeReader
      .decodeFromVideoDevice(videoInputId, "video", (result, err) => {
        if (result) {
          setScanResult(result.text); // Set the scanned barcode result
          playBeepSound(); // Play sound when barcode is scanned
          vibrateSuccess(); // Use stronger vibration for successful scan
          codeReader.reset(); // Stop the scanner after a successful scan
        }
        if (err) {
          console.warn("Scanning error:", err);
        }
      })
      .catch((err) => setError("Camera initialization failed: " + err));
  };

  const handleSaveToFirebase = async () => {
    if (!scanResult) {
      alert("No barcode scanned!");
      return;
    }

    if (!productName) {
      alert("Please enter a product name!");
      return;
    }

    const db = getFirestore();
    const barcodeRef = doc(db, "Barcodes", barcodeId);

    try {
      // Update the ScannedCode, ProductName, and Timestamp fields in Firestore
      await updateDoc(barcodeRef, {
        scannedCode: scanResult, // Update with the scanned barcode
        productName: productName, // Add the product name
        timestamp: serverTimestamp(), // Add the server-generated timestamp
      });

      playBeepSound(); // Play sound when saving to Firebase
      vibrateSuccess(); // Use stronger vibration for successful save
      alert("Scanned code, product name, and timestamp updated successfully in Firebase!");

      // Redirect to OCRUser and OCRUsers pages with the AI response
      navigate("/ocruser", {
        state: {
          aiResponse: aiResponse, // Pass the AI response to the OCRUsers page
        },
      });

      // Navigate to OCRUser page (optional, if needed separately)
      navigate("/ocrusers", {
        state: {
          aiResponse: aiResponse, // Pass the AI response to the OCRUser page
        },
      });
    } catch (error) {
      console.error("Error updating scanned code in Firebase:", error);
      alert("Failed to update the scanned code. Please try again.");
    }
  };

  return (
    <div className="scanner-container">
      <div className="scanner-header">
        <h2 style={{margin:'0px',backgroundColor:"transparent"}}>Scan a Barcode</h2>
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

      {error && <p className="error-message">{error}</p>}

      {!scanResult ? (
        <div>
          <video id="video" className="scanner-box"></video>
        </div>
      ) : (
        <div className="scan-result">
          <h3>Scanned Code:</h3>
          <p>{scanResult}</p>
          <div className="product-name-input">
            <h3>Enter Product Name:</h3>
            <input
              type="text"
              placeholder="Enter product name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="product-name-field"
            />
          </div>
          <button onClick={handleSaveToFirebase} className="save-button">
            Save to Firebase
          </button>
          <button
            onClick={() => {
              setScanResult(null); // Reset the scan result to scan again
              setProductName(""); // Reset the product name
              window.location.reload(); // Reload the page to restart scanning
            }}
            className="scan-again-btn"
          >
            Scan Again
          </button>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;