import { useEffect, useState, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "./barcode.css";

const BarcodeScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeHistory, setBarcodeHistory] = useState([]);
  const [matchedBarcode, setMatchedBarcode] = useState(null);
  const [scannedHistory, setScannedHistory] = useState([]);
  const [isMuted, setIsMuted] = useState(() => {
    // Initialize mute state from localStorage
    const savedMuteState = localStorage.getItem('barcodeScannerMuted');
    return savedMuteState === 'true';
  });
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(() => {
    const savedVibrationState = localStorage.getItem('barcodeScannerVibration');
    return savedVibrationState !== 'false';
  });
  const videoRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const audioRef = useRef(null);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio("/Barcode-scanner-beep-sound.mp3");
    audioRef.current.volume = isMuted ? 0 : 0.3; // Set initial volume based on mute state

    const fetchBarcodeHistory = async () => {
      try {
        const db = getFirestore();
        const barcodesCollection = collection(db, "Barcodes");
        const q = query(
          barcodesCollection,
          orderBy("timestamp", "desc"),
          limit()
        );
        const barcodesSnapshot = await getDocs(q);
        const barcodesData = barcodesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBarcodeHistory(barcodesData);
      } catch (error) {
        console.error("Error fetching barcode history:", error);
        setError("Failed to load barcode history");
      }
    };

    fetchBarcodeHistory();

    return () => {
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

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    // Save mute state to localStorage
    localStorage.setItem('barcodeScannerMuted', newMuteState);
    if (audioRef.current) {
      audioRef.current.volume = newMuteState ? 0 : 0.3;
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

  useEffect(() => {
    const initializeScanner = async () => {
      try {
        const videoInputDevices = await codeReader.current.getVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          setError("No camera found! Please ensure you have a camera connected.");
          setIsLoading(false);
          return;
        }

        let backCamera = videoInputDevices.find((device) =>
          device.label.toLowerCase().includes("back")
        );

        let selectedDevice = backCamera
          ? backCamera.deviceId
          : videoInputDevices[0].deviceId;

        await startScanner(selectedDevice);
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          setError("Camera access denied. Please allow camera access in your browser settings.");
        } else {
          setError("Error accessing camera: " + err.message);
        }
        setIsLoading(false);
      }
    };

    initializeScanner();

    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
      if (videoRef.current) {
        const stream = videoRef.current.srcObject;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, []);

  const startScanner = async (videoInputId) => {
    try {
      setIsScanning(true);
      await codeReader.current.decodeFromVideoDevice(
        videoInputId,
        "video",
        (result, err) => {
          if (result) {
            const scannedCode = result.text;
            setScanResult(scannedCode);
            playBeepSound(); // Play sound when barcode is scanned
            vibrateSuccess(); // Use stronger vibration for successful scan
            setScannedHistory([{ 
              code: scannedCode, 
              timestamp: new Date().toLocaleString(),
              status: "Checking..."
            }]);
            checkBarcodeInDatabase(scannedCode);
            codeReader.current.reset();
            setIsScanning(false);
          }
          if (err && !(err instanceof Error)) {
            console.warn("Scanning error:", err);
          }
        }
      );
      setIsLoading(false);
    } catch (err) {
      setError("Failed to start scanner: " + err.message);
      setIsLoading(false);
      setIsScanning(false);
    }
  };

  const checkBarcodeInDatabase = (scannedBarcode) => {
    setIsLoading(true);
    setMatchedBarcode(null);

    const matched = barcodeHistory.find(
      item => item.scannedCode === scannedBarcode
    );

    if (matched) {
      console.log("Match found:", matched);
      setMatchedBarcode(matched);
      setScannedHistory([{
        code: scannedBarcode,
        timestamp: new Date().toLocaleString(),
        status: "Found"
      }]);
    } else {
      setScannedHistory([{
        code: scannedBarcode,
        timestamp: new Date().toLocaleString(),
        status: "Not Found"
      }]);
    }
    setIsLoading(false);
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setMatchedBarcode(null);
    setError(null);
    setIsLoading(true);
    setIsScanning(false);
    window.location.reload();
  };

  const sendToOCRUser = () => {
    if (matchedBarcode && matchedBarcode.aiResponse) {
      navigate("/ocrusers", { state: { aiResponse: matchedBarcode.aiResponse } });
    }
  };

  return (
    <div className="scanner-container">
      <div className="scanner-header">
        <h2>Scan a Barcode</h2>
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

      <div className="scanner-wrapper">
        <video 
          id="video" 
          className="scanner-box"
          ref={videoRef}
          playsInline
        ></video>
      </div>

      {scannedHistory.length > 0 && (
        <div className="scanned-history">
          <h3>Current Scan</h3>
          <div className="table-container">
            <table className="scan-table">
              <thead>
                <tr>
                  <th>Barcode</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  className={scannedHistory[0].status === "Found" ? "found" : scannedHistory[0].status === "Not Found" ? "not-found" : "checking"}
                >
                  <td>{scannedHistory[0].code}</td>
                  <td>
                    <button 
                      className="scan-again-btn"
                      onClick={() => checkBarcodeInDatabase(scannedHistory[0].code)}
                      style={{ padding: '5px 10px', fontSize: '0.9em' }}
                    >
                      Check Product
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {matchedBarcode && (
        <div className="matched-barcode-data">
          <p><strong>Product Name:</strong> {matchedBarcode.productName}</p>
          <p><strong>Ingredient and Nutritional info :</strong></p>
          <p>{matchedBarcode.aiResponse}</p>
          <button onClick={sendToOCRUser} className="ocr-btn">
  Send to OCR User
</button>
        </div>
      )}

      

      <button
        onClick={handleScanAgain}
        className="scan-again-btn"
      >
        Scan Again
      </button>
      {scanResult && !matchedBarcode && (
        <div className="no-match-container">
          <a className="ocrlink" href="/ocr">Try OCR Instead</a>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;