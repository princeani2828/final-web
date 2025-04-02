import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./edit.css";

function EditProfile() {
  const [formData, setFormData] = useState({});
  const [updating, setUpdating] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;

      try {
        const docRef = doc(db, "Users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFormData(docSnap.data());
        } else {
          console.log("No User Data Found In Firestore");
        }
      } catch (error) {
        console.error("Error Fetching User Data:", error);
      }
    };

    fetchUserData();
  }, []);

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
    if (name === "postPrandialBloodSugar" && value > 600) {
      setErrors((prev) => ({ ...prev, postPrandialBloodSugar: "Max Postprandial Blood Sugar is 600 mg/dL" }));
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
        postPrandialBloodSugar: "",
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

  const handleUpdate = async () => {
    if (!auth.currentUser) return;
    setUpdating(true);

    try {
      const userRef = doc(db, "Users", auth.currentUser.uid);
      await updateDoc(userRef, formData);
      console.log("User Details Updated Successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Error Updating User Details:", error);
    } finally {
      setUpdating(false);
    }
  };

  const validateInput = (key, value) => {
    if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return false;
    }
    if ((key === "password" || key === "firstName" || key === "lastName") && value.trim() === "") {
      return false;
    }
    if ((key === "age" || key === "bmi" || key === "hba1c" || key === "weight" || key === "height" || key === "fastingBloodSugar" || key === "postPrandialBloodSugar" || key === "bloodPressure" || key === "waterIntake") && isNaN(value)) {
      return false;
    }
    return true;
  };

  return (
    <div className="edit-profile-container">
      <h1 className="stylish-text">Edit Profile</h1>
      <div className="user-details">
        {["firstName", "lastName", "diabetesType", "bmi", "sugarAlternatives", "gender", "activityLevel", "sugarSensitivity", "allergies", "weight", "hba1c", "email", "height", "fastingBloodSugar", "mealPreference", "password", "age", "waterIntake", "bloodPressure", "postprandialBloodSugar"]
          .map((key) => (
            <div key={key} className="form-group">
              <label>{key.charAt(0).toUpperCase() + key.slice(1)}:</label>
              {key === "diabetesType" || key === "gender" || key === "activityLevel" || key === "mealPreference" || key === "sugarSensitivity" ? (
                <select
                  name={key}
                  value={formData[key] || ""}
                  onChange={(e) => {
                    if (validateInput(key, e.target.value)) {
                      handleChange(e);
                    }
                  }}
                  className="input-field"
                >
                  {key === "diabetesType" && (
                    <>
                      <option value="">Select Diabetes Type</option>
                      <option value="Type 1">Type 1</option>
                      <option value="Type 2">Type 2</option>
                      <option value="Gestational">Gestational</option>
                      <option value="Prediabetes">Prediabetes</option>
                      <option value="Nill">Nill</option>
                    </>
                  )}
                  {key === "gender" && (
                    <>
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </>
                  )}
                  {key === "activityLevel" && (
                    <>
                      <option value="">Activity Level</option>
                      <option value="Sedentary">Sedentary</option>
                      <option value="Moderately Active">Moderately Active</option>
                      <option value="Active">Active</option>
                      <option value="Highly Active">Highly Active</option>
                    </>
                  )}
                  {key === "mealPreference" && (
                    <>
                      <option value="">Meal Preference</option>
                      <option value="Veg">Veg</option>
                      <option value="NonVeg">NonVeg</option>
                      <option value="Anything">Anything</option>
                    </>
                  )}
                  {key === "sugarSensitivity" && (
                    <>
                      <option value="">Sugar Sensitivity Level</option>
                      <option value="Mild">Mild</option>
                      <option value="Moderate">Moderate</option>
                      <option value="High">High</option>
                    </>
                  )}
                </select>
              ) : (
                <input
                  type="text"
                  name={key}
                  value={formData[key] || ""}
                  onChange={(e) => {
                    if (validateInput(key, e.target.value)) {
                      handleChange(e);
                    }
                  }}
                  className="input-field"
                />
              )}
              {errors[key] && <span className="error">{errors[key]}</span>}
            </div>
          ))}
      </div>
      <button className="btn save-button" onClick={handleUpdate} disabled={updating}>
        {updating ? "Updating..." : "Save Changes"}
      </button>
      <button className="btn cancel-button" onClick={() => navigate("/profile")}>
        Cancel
      </button>
    </div>
  );
}

export default EditProfile;