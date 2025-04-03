import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {
  const [showOtpField, setShowOtpField] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (email.trim() === "") {
      alert("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8181/auth/send-otp", null, {
        params: { email },
      });

      alert(response.data);
      setShowOtpField(true);
    } catch (error) {
      alert("Failed to send OTP. Please try again.");
      console.error("Error sending OTP:", error);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.trim() === "") {
      alert("Please enter the OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8181/auth/verify-otp", null, {
        params: { email, otp },
      });

      alert(response.data);
      if (response.data.includes("OTP verified")) {
        navigate("/user-details"); // Redirect to UserDetails component
      }
    } catch (error) {
      alert("Invalid OTP. Please try again.");
      console.error("Error verifying OTP:", error);
    }
    setLoading(false);
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow-lg" style={{ maxWidth: "400px", width: "100%" }}>
        <h3 className="text-center mb-4">LOGIN</h3>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {!showOtpField ? (
          <button className="btn btn-primary w-100" onClick={handleSendOtp} disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        ) : (
          <>
            <div className="mb-3">
              <label className="form-label">Enter OTP</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-success w-100" onClick={handleVerifyOtp} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
