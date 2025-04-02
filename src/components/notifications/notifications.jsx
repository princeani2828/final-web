import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase"; // Import Firestore instance
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./notifications.css";

const Notifications = () => {
    const [history, setHistory] = useState([]);
    const [currentUserEmail, setCurrentUserEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedResponses, setSelectedResponses] = useState([]);
    const navigate = useNavigate();

    // Get current user's email
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserEmail(user.email);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Fetch all OCR data and filter by user's email
    useEffect(() => {
        const fetchAllOCRData = async () => {
            if (!currentUserEmail) return;

            try {
                setLoading(true);
                // Get first 10 OCR data entries
                const q = query(
                    collection(db, "ocrData"),
                    orderBy("createdAt", "desc"),
                    limit(10)  // Limit to 10 entries
                );
                
                const querySnapshot = await getDocs(q);
                const allData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Filter data for current user's email
                const userData = allData.filter(item => item.userEmail === currentUserEmail);
                
                setHistory(userData);
            } catch (error) {
                console.error("Error fetching OCR data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllOCRData();
    }, [currentUserEmail]);

    const handleReanalyze = (aiResponse) => {
        navigate("/ocrusers", { state: { aiResponse } });
    };

    const handleCheckboxChange = (item) => {
        setSelectedResponses(prev => {
            const isSelected = prev.some(selected => selected.id === item.id);
            if (isSelected) {
                return prev.filter(selected => selected.id !== item.id);
            } else {
                if (prev.length >= 5) {
                    alert("You can only compare up to 5 products at a time.");
                    return prev;
                }
                return [...prev, item];
            }
        });
    };

    const handleCompare = () => {
        if (selectedResponses.length < 2) {
            alert("Please select at least 2 products to compare");
            return;
        }
        navigate("/compare", { 
            state: { 
                selectedProducts: selectedResponses.map(item => ({
                    aiResponse: item.aiResponse,
                    timestamp: item.timestamp,
                    scannedImages: item.scannedImages,
                    userEmail: item.userEmail
                }))
            } 
        });
    };

    if (loading) {
        return (
            <div className="notifications">
                <h2>Your OCR History</h2>
                <p className="loading">Loading your OCR history...</p>
            </div>
        );
    }

    return (
        <div className="notifications">
            <h2>Your OCR History</h2>
            {currentUserEmail ? (
                <>
                    <div className="history-container">
                        {history.length > 0 ? (
                            history.map((item) => (
                                <div key={item.id} className="history-item">
                                    <div className="history-content">
                                        <div className="history-header">
                                            <div className="header-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedResponses.some(selected => selected.id === item.id)}
                                                    onChange={() => handleCheckboxChange(item)}
                                                    className="response-checkbox"
                                                />
                                                <span className="user-email">Email: {item.userEmail}</span>
                                            </div>
                                            <span className="timestamp">
                                                {new Date(item.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        {item.scannedImages && Object.keys(item.scannedImages).length > 0 && (
                                            <div className="scanned-images">
                                                <h3>Scanned Images:</h3>
                                                <div className="image-grid">
                                                    {item.scannedImages.ingredients && (
                                                        <div className="image-container">
                                                            <div className="image-wrapper">
                                                                <img 
                                                                    src={item.scannedImages.ingredients} 
                                                                    alt="Ingredients" 
                                                                    className="history-image"
                                                                    onClick={() => window.open(item.scannedImages.ingredients, '_blank')}
                                                                />
                                                                <div className="image-overlay">
                                                                    <span className="image-label">Ingredients</span>
                                                                    <span className="view-full">Click to view full size</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {item.scannedImages.nutrition && (
                                                        <div className="image-container">
                                                            <div className="image-wrapper">
                                                                <img 
                                                                    src={item.scannedImages.nutrition} 
                                                                    alt="Nutrition" 
                                                                    className="history-image"
                                                                    onClick={() => window.open(item.scannedImages.nutrition, '_blank')}
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
                                        <div className="ai-response">
                                            <h3>Analysis Results:</h3>
                                            {item.aiResponse.split('\n').map((line, index) => (
                                                <p key={index}>{line}</p>
                                            ))}
                                        </div>
                                        <div className="button-container">
                                            <button 
                                                className="reanalyze-button"
                                                onClick={() => handleReanalyze(item.aiResponse)}
                                            >
                                                Reanalyze
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-history">No OCR history found for your account</p>
                        )}
                    </div>
                    {selectedResponses.length > 0 && (
                        <div className="compare-section">
                            <p className="selected-count">
                                {selectedResponses.length} product{selectedResponses.length !== 1 ? 's' : ''} selected
                            </p>
                            <button 
                                className="compare-button"
                                onClick={handleCompare}
                                disabled={selectedResponses.length < 2}
                            >
                                Compare Selected Products
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <p className="no-history">Please sign in to view your OCR history</p>
            )}
        </div>
    );
};

export default Notifications;