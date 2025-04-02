"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./scan.css";

function ScannerApp() {
  const [activeScanner, setActiveScanner] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeScanner === "barcode") {
      console.log("Navigating to Barcode Scanner...");
      navigate("/barcode");
    } else if (activeScanner === "ocr") {
      console.log("Navigating to OCR Scanner...");
      navigate("/ocr");
    }
  }, [activeScanner, navigate]);

  const handleScannerSelect = (type) => {
    console.log(`Scanner Selected: ${type}`);
    setActiveScanner(type);
  };

  return (
    <div className="main">
    <h1>Quick Scan, Precise Results</h1>
    <div className="scanner-container">
      <div className="scanner-option-wrapper">
        {/* Barcode Scanner Option */}
        <div
          className={`scanner-option ${activeScanner === "barcode" ? "active" : ""}`}
          onClick={() => handleScannerSelect("barcode")}
        >
          <div className="scanner-title">Barcode Reader</div>
          <div className="barcodeimg"></div>
          <div className="greyTxt">Quick & Easy, but Less Accurate</div>
          
        </div>

        {/* OCR Scanner Option */}
        <div
          className={`scanner-option ${activeScanner === "ocr" ? "active" : ""}`}
          onClick={() => handleScannerSelect("ocr")}
        >
          <div className="scanner-title">OCR Scanner</div>
          <div className="ocrimg"></div>
          <div className="greyTxt">Slower but More Accurate (90%)</div>
        </div>

      </div>
    </div>
    </div>
  );
}

export default ScannerApp;
