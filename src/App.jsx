import { useEffect, useState } from "react";
import "./index.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./components/login";
import SignUp from "./components/register";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Profile from "./components/page";
import { auth } from "./components/firebase";
import HomePage from "./components/page";
import CartPage from "./components/compare/compare";
import ScanPage from "./components/scan/scan";
import BellPage from "./components/notifications/notifications";
import UserPage from "./components/user/user";
import EditPage from "./components/Edit/edit";
import ComparePage from "./components/compare/compare";
import AskAi from "./components/ask-ai/askai";
import ScannerPage from "./components/ocr/ocr";
import OCRUser from "./components/ocr/ocruser";
import Layout from "./components/bottomnav/layout"; // Import Layout
import BarcodeScan from "./components/barcode/barcode"; // Import BarcodeScan
import OCRUsers from "./components/ocr/ocrusers";
import UserDetailsText from "./components/ocr/data";
import BarcodeOne from "./components/barcode/barcode1";
import ForgetPassword from "./components/forgetpassword";


function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="App">
        <div className="auth-wrapper">
          <div className="auth-inner">
            <Routes>
              {/* Authentication Routes */}
              <Route path="/" element={user ? <Navigate to="/home" /> : <Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<SignUp />} />
              <Route path="/profile" element={<Profile />} />

              {/* Wrap all pages inside Layout to include BottomNav */}
              <Route path="/" element={<Layout />}>
                <Route path="home" element={<HomePage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="scan" element={<ScanPage />} />
                <Route path="notifications" element={<BellPage />} />
                <Route path="user" element={<UserPage />} />
                <Route path="edit" element={<EditPage />} />
                <Route path="compare" element={<ComparePage />} />
                <Route path="askai" element={<AskAi />} />
                <Route path="ocr" element={<ScannerPage />} />
                <Route path="ocruser" element={<OCRUser />} /> {/* Add OCRUser route */}
                <Route path="data" element={<UserDetailsText />} />
                <Route path="ocrusers" element={<OCRUsers />} /> {/* Add Barcode Scanner route */}
                <Route path="barcode" element={<BarcodeScan />} /> {/* ✅ Added Barcode Scanner */}
                <Route path="barcode1" element={<BarcodeOne />} /> {/* ✅ Added Barcode Scanner */}
                <Route path="forgetpassword" element={<ForgetPassword />} />
              </Route>
            </Routes>
            <ToastContainer />
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
