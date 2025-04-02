"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import "./register.css";

function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    diabetesType: "",
    hba1c: "",
    fastingBloodSugar: "",
    postprandialBloodSugar: "",
    bloodPressure: "",
    bloodPressureType: "",
    allergies: "",
    lifestyle: "",
    waterIntake: "",
    sugarAlternatives: "",
    foodAvoidances: "",
    mealPreference: "",
    sugarSensitivity: "",
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    hba1c: "",
    fastingBloodSugar: "",
    postprandialBloodSugar: "",
    bloodPressure: "",
  });

  const navigate = useNavigate(); // Initialize useNavigate

  const getBloodPressureType = (pressure) => {
    if (!pressure) return "";
    const [systolic, diastolic] = pressure.split("/").map(Number);

    if (systolic < 120 && diastolic < 80) return "Normal";
    if (systolic >= 120 && systolic < 130 && diastolic < 80) return "Elevated";
    if ((systolic >= 130 && systolic < 140) || (diastolic >= 80 && diastolic < 90)) return "Hypertension Stage 1";
    if ((systolic >= 140 && systolic < 180) || (diastolic >= 90 && diastolic < 120)) return "Hypertension Stage 2";
    if (systolic >= 180 || diastolic >= 120) return "Hypertensive Crisis";

    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // String validation for name fields
    if ((name === "firstName" || name === "lastName") && /\d/.test(value)) {
      setErrors((prev) => ({ ...prev, [name]: "Only letters are allowed" }));
      return;
    }

    // Max limit validation
    if (name === "hba1c" && value > 20) {
      setErrors((prev) => ({ ...prev, hba1c: "Max HbA1c level is 20%" }));
      return;
    }
    if (name === "fastingBloodSugar" && value > 400) {
      setErrors((prev) => ({ ...prev, fastingBloodSugar: "Max Fasting Blood Sugar is 400 mg/dL" }));
      return;
    }
    if (name === "postprandialBloodSugar" && value > 600) {
      setErrors((prev) => ({ ...prev, postprandialBloodSugar: "Max Postprandial Blood Sugar is 600 mg/dL" }));
      return;
    }
    if (name === "bloodPressure") {
      const [systolic, diastolic] = value.split("/").map(Number);
      if (systolic > 200 || diastolic > 120) {
        setErrors((prev) => ({ ...prev, bloodPressure: "Max Blood Pressure is 200/120 mmHg" }));
        return;
      }
      const bpType = getBloodPressureType(value);
      setFormData((prev) => ({
        ...prev,
        bloodPressureType: bpType,
      }));
    }

    // Reset diabetic-related fields if diabetesType is "Nill"
    if (name === "diabetesType" && value === "Nill") {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
        hba1c: "",
        fastingBloodSugar: "",
        postprandialBloodSugar: "",
        bloodPressure: "",
        bloodPressureType: "",
      }));
    } else {
      // Reset errors if valid
      setErrors((prev) => ({ ...prev, [name]: "" }));

      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const calculateBMI = () => {
    const heightInMeters = formData.height / 100;
    const bmi = formData.weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      if (user) {
        const bmi = calculateBMI();
        await setDoc(doc(db, "Users", user.uid), {
          ...formData,
          bmi,
          email: user.email,
        });
      }

      toast.success("Registration successful!", { position: "top-center" });
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.message, { position: "bottom-center" });
    }
  };

  const handleLoginRedirect = () => {
    navigate("/login"); // Redirect to login page
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2>Sign Up</h2>

        {/* Basic Information */}
        <section className="form-section">
          <h3>Basic Information</h3>
          <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" required />
          {errors.firstName && <span className="error">{errors.firstName}</span>}  
          <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" required />        
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
          <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required />
          <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Age" required />

          <select name="gender" value={formData.gender} onChange={handleChange} required>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <input type="number" name="height" value={formData.height} onChange={handleChange} placeholder="Height (cm)" required />
          <input type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="Weight (kg)" required />
        </section>

        {/* Medical and Health Details */}
        <section className="form-section">
          <h3>Medical and Health Details</h3>
          <select name="diabetesType" value={formData.diabetesType} onChange={handleChange} required>
            <option value="">Select Diabetes Type</option>
            <option value="Type 1">Type 1</option>
            <option value="Type 2">Type 2</option>
            <option value="Gestational">Gestational</option>
            <option value="Prediabetes">Prediabetes</option>
            <option value="Nil">Nil</option>
          </select>

          <input type="number" name="hba1c" value={formData.hba1c} onChange={handleChange} placeholder="HbA1c Level (%)" step="0.1" />
          <input type="text" name="bloodPressure" value={formData.bloodPressure} onChange={handleChange} placeholder="Blood Pressure (e.g., 120/80)" />
          <input type="text" name="bloodPressureType" value={formData.bloodPressureType} readOnly placeholder="Blood Pressure Type" />
          <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} placeholder="Known Allergies" />

          <input type="number" name="fastingBloodSugar" value={formData.fastingBloodSugar} onChange={handleChange} placeholder="Fasting Blood Sugar (mg/dL)" />
          <input type="number" name="postprandialBloodSugar" value={formData.postprandialBloodSugar} onChange={handleChange} placeholder="Postprandial Blood Sugar (mg/dL)" />
        </section>

        {/* Lifestyle and Activity */}
        <section className="form-section">
          <h3>Lifestyle and Activity</h3>
          <select name="lifestyle" value={formData.lifestyle} onChange={handleChange}>
            <option value="">Activity Level</option>
            <option value="Sedentary">Sedentary</option>
            <option value="Moderately Active">Moderately Active</option>
            <option value="Active">Active</option>
            <option value="Highly Active">Highly Active</option>
          </select>
          
          <input type="text" name="waterIntake" value={formData.waterIntake} onChange={handleChange} placeholder="Water Intake (liters/day)" />
        </section>
        {/* Food Preferences and Sensitivities */}
        <section className="form-section">
          <h3>Food Preferences and Sensitivities</h3>
          <select name="mealPreference" value={formData.mealPreference} onChange={handleChange}>
            <option value="">Meal Preference</option>
            <option value="Veg">Veg</option>
            <option value="NonVeg">NonVeg</option>
            <option value="Anything">Anything</option>
          </select>
          <select name="sugarSensitivity" value={formData.sugarSensitivity} onChange={handleChange}>
            <option value="">Sugar Sensitivity Level</option>
            <option value="Mild">Mild</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
          </select>
          <input type="text" name="sugarAlternatives" value={formData.sugarAlternatives} onChange={handleChange} placeholder="Preferred Sugar Alternative" />
          <input type="text" name="foodAvoidances" value={formData.foodAvoidances} onChange={handleChange} placeholder="Specific Food Avoidance" />

        </section>

        <button type="submit" className="submit-btn">Sign Up</button>
      </form>
      <div className="login-redirect">
        Already have an account? <span className="login-link" onClick={handleLoginRedirect} style={{ color: "#6D9D39" }}>Log In</span>
      </div>
    </div>
  );
}

export default Register;