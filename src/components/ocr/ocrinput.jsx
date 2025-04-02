import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase"; // Import Firestore instance
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function OCRInput({ aiResponse = '', scannedImages = [] }) {
  const [userEmail, setUserEmail] = useState('');
  const containerStyle = {
    minHeight: '300px',
    overflowY: 'scroll',
    border: '1px solid #ccc',
    padding: '10px',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };
  const result = {
    padding: '10px'
  }

  const renderList = (response) => {
    const items = response.split('\n');
    return (
      <ol>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ol>
    );
  };

  // Get user's email when component mounts
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      }
    });
    return () => unsubscribe();
  }, []);

  // Store OCR data with user's email and images
  useEffect(() => {
    const storeAiResponse = async () => {
      if (aiResponse && userEmail) {
        try {
          // Create an object to store the images
          const imageData = {};
          
          // Store ingredients image if available
          if (scannedImages[0]) {
            imageData.ingredients = scannedImages[0];
          }
          
          // Store nutrition image if available
          if (scannedImages[1]) {
            imageData.nutrition = scannedImages[1];
          }

          const ocrData = {
            aiResponse,
            createdAt: new Date(),
            userEmail: userEmail,
            timestamp: new Date().toISOString(),
            scannedImages: imageData
          };

          console.log("Storing OCR data with images:", ocrData);
          await addDoc(collection(db, "ocrData"), ocrData);
          console.log("OCR data stored successfully with images");
        } catch (error) {
          console.error("Error storing OCR data:", error);
        }
      }
    };

    storeAiResponse();
  }, [aiResponse, userEmail, scannedImages]);

  return (
    <div style={result}>
      <h2>Nutritional information and Ingredients:</h2>
      {aiResponse ? (
        <div style={containerStyle}>
          {renderList(aiResponse)}
        </div>
      ) : null}
    </div>
  );
}

OCRInput.propTypes = {
  aiResponse: PropTypes.string,
  scannedImages: PropTypes.arrayOf(PropTypes.string)
};