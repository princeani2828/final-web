import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import "./user.css";

function Profile() {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const navigate = useNavigate(); // Initialize useNavigate

  const fetchUserData = async () => {
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        console.log("User Is Not Logged In");
        navigate("/login"); // Redirect to login page if not logged in
        setLoading(false);
        return;
      }

      console.log("User:", user);

      try {
        const docRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserDetails(docSnap.data());
          setFormData(docSnap.data());
          console.log("User Data:", docSnap.data());
        } else {
          console.log("No User Data Found In Firestore");
        }
      } catch (error) {
        console.error("Error Fetching User Data:", error);
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
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

  const handleUpdate = async () => {
    if (!auth.currentUser) return;
    setUpdating(true);

    try {
      const userRef = doc(db, "Users", auth.currentUser.uid);
      await updateDoc(userRef, formData);
      setUserDetails(formData);
      setEditMode(false);
      console.log("User Details Updated Successfully!");
    } catch (error) {
      console.error("Error Updating User Details:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = "/login";
      console.log("User Logged Out Successfully!");
    } catch (error) {
      console.error("Error Logging Out:", error.message);
    }
  };

  const handleHomeRedirect = () => {
    navigate("/"); // Redirect to home page
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="profile-container">
      {userDetails ? (
        <>
          <div className="profile-picture-container">
            {userDetails.photo && (
              <img src={userDetails.photo} className="profile-picture" alt="User Profile" />
            )}
          </div>
          {!editMode && (
            <h1 className="stylish-text">
              Welcome {capitalizeFirstLetter(userDetails.firstName) || "User"} 
            </h1>
          )}

          <div className="user-details">
            <div className="form-group">
              <label>First Name:</label>
              {editMode ? (
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName || ""}
                  onChange={handleChange}
                  className="input-field"
                />
              ) : (
                <p>{capitalizeFirstLetter(userDetails.firstName)}</p>
              )}
              {errors.firstName && <span className="error">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <label>Last Name:</label>
              {editMode ? (
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName || ""}
                  onChange={handleChange}
                  className="input-field"
                />
              ) : (
                <p>{capitalizeFirstLetter(userDetails.lastName)}</p>
              )}
              {errors.lastName && <span className="error">{errors.lastName}</span>}
            </div>
            <div className="form-group">
              <label>Diabetes Type:</label>
              {editMode ? (
                <select name="diabetesType" value={formData.diabetesType || ""} onChange={handleChange} className="input-field">
                  <option value="">Select Diabetes Type</option>
                  <option value="Type 1">Type 1</option>
                  <option value="Type 2">Type 2</option>
                  <option value="Gestational">Gestational</option>
                  <option value="Prediabetes">Prediabetes</option>
                  <option value="Nill">Nill</option>
                </select>
              ) : (
                <p>{userDetails.diabetesType}</p>
              )}
            </div>
            <div className="form-group">
              <label>Gender:</label>
              {editMode ? (
                <select name="gender" value={formData.gender || ""} onChange={handleChange} className="input-field">
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p>{userDetails.gender}</p>
              )}
            </div>
            <div className="form-group">
              <label>Lifestyle:</label>
              {editMode ? (
                <select name="lifestyle" value={formData.lifestyle || ""} onChange={handleChange} className="input-field">
                  <option value="">Activity Level</option>
                  <option value="Sedentary">Sedentary</option>
                  <option value="Moderately Active">Moderately Active</option>
                  <option value="Active">Active</option>
                  <option value="Highly Active">Highly Active</option>
                </select>
              ) : (
                <p>{userDetails.lifestyle}</p>
              )}
            </div>
            <div className="form-group">
              <label>Meal Preference:</label>
              {editMode ? (
                <select name="mealPreference" value={formData.mealPreference || ""} onChange={handleChange} className="input-field">
                  <option value="">Meal Preference</option>
                  <option value="Veg">Veg</option>
                  <option value="NonVeg">NonVeg</option>
                  <option value="Anything">Anything</option>
                </select>
              ) : (
                <p>{userDetails.mealPreference}</p>
              )}
            </div>
            <div className="form-group">
              <label>Sugar Sensitivity:</label>
              {editMode ? (
                <select name="sugarSensitivity" value={formData.sugarSensitivity || ""} onChange={handleChange} className="input-field">
                  <option value="">Sugar Sensitivity Level</option>
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              ) : (
                <p>{userDetails.sugarSensitivity}</p>
              )}
            </div>
            {Object.entries(userDetails).map(([key, value]) => (
              key !== "photo" && key !== "firstName" && key !== "lastName" && key !== "diabetesType" && key !== "gender" && key !== "lifestyle" && key !== "mealPreference" && key !== "sugarSensitivity" && (
                <div key={key} className="form-group">
                  <label>{capitalizeFirstLetter(key)}:</label>
                  {editMode ? (
                    <input
                      type="text"
                      name={key}
                      value={formData[key] || ""}
                      onChange={handleChange}
                      className="input-field"
                    />
                  ) : (
                    <p>{value}</p>
                  )}
                  {errors[key] && <span className="error">{errors[key]}</span>}
                </div>
              )
            ))}
          </div>
          <button className="btn home-button" onClick={handleHomeRedirect}>
            Home
          </button>
          {editMode ? (
            <button className="btn update-button" onClick={handleUpdate} disabled={updating}>
              {updating ? "Updating..." : "Save Changes"}
            </button>
          ) : (
            <button className="btn edit-button" onClick={() => setEditMode(true)}>
              Edit Profile
            </button>
          )}

          <button className="btn logout-button" onClick={handleLogout}>
            Logout
          </button>

        </>
      ) : (
        <p>No User Data Found.</p>
      )}
    </div>
  );
}

export default Profile;