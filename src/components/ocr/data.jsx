import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function UserDetails() {
    const [user, setUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);

    useEffect(() => {
        fetchUserData();
    }, []);

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

    return (
        <div className="user-details-container">
            <h1>User Details</h1>
            {user && userDetails ? (
                <div className="user-details">
                    <p><strong>Name:</strong> {userDetails.firstName} {userDetails.lastName}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Gender:</strong> {userDetails.gender}</p>
                    <p><strong>Age:</strong> {userDetails.age}</p>
                    <p><strong>Height:</strong> {userDetails.height} cm</p>
                    <p><strong>Weight:</strong> {userDetails.weight} kg</p>
                    <p><strong>BMI:</strong> {userDetails.bmi}</p>
                    <p><strong>Activity Level:</strong> {userDetails.activityLevel}</p>
                    <p><strong>Diabetes Type:</strong> {userDetails.diabetesType}</p>
                    <p><strong>Sugar Sensitivity:</strong> {userDetails.sugarSensitivity}</p>
                    <p><strong>Allergies:</strong> {userDetails.allergies || "None"}</p>
                    <p><strong>Dietary Preference:</strong> {userDetails.dietaryPreference || "None"}</p>
                    <p><strong>Food Avoidances:</strong> {userDetails.foodAvoidances || "None"}</p>
                    <p><strong>Medications:</strong> {userDetails.medications || "None"}</p>
                    <p><strong>Water Intake:</strong> {userDetails.waterIntake || "Not provided"}</p>
                    <p><strong>Blood Pressure:</strong> {userDetails.bloodPressure || "Not provided"}</p>
                    <p><strong>Fasting Blood Sugar:</strong> {userDetails.fastingBloodSugar || "Not provided"}</p>
                    <p><strong>HbA1c:</strong> {userDetails.hba1c || "Not provided"}</p>
                    <p><strong>Postprandial Blood Sugar:</strong> {userDetails.postprandialBloodSugar || "Not provided"}</p>
                    <p><strong>Preferred Sugar Alternatives:</strong> {userDetails.sugarAlternatives || "None"}</p>
                    <p><strong>Meal Preference:</strong> {userDetails.mealPreference || "None"}</p>
                </div>
            ) : (
                <p>Loading user details...</p>
            )}
        </div>
    );
}
