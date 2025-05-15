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
                localStorage.setItem("userEmail", email);
                navigate("/user-details");
            }
        } catch (error) {
            alert("Invalid OTP. Please try again.");
            console.error("Error verifying OTP:", error);
        }
        setLoading(false);
    };

    return (
        <>
            {/* Navbar */}
            <nav className="navbar navbar-dark p-3" style={{ backgroundColor: "#004AAD" }}>
                <div className="container-fluid">
                    <span className="navbar-brand mb-0 h1 mx-auto">WorkNexus</span>
                </div>
            </nav>

            {/* Login Card */}
            <div
                className="container d-flex justify-content-center align-items-center"
                style={{ minHeight: "calc(100vh - 56px)" }} // Adjusting for navbar height (typically ~56px)
            >
                <div className="card p-4 shadow-lg" style={{ maxWidth: "400px", width: "100%" }}>
                    <h3 className="text-center mb-4">LOGIN</h3>
                    {/* Email input */}
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control shadow-none"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    {/* OTP Section */}
                    {!showOtpField ? (
                        <button className="btn btn-primary w-100 d-flex justify-content-center align-items-center" onClick={handleSendOtp} disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Sending OTP...
                                </>
                            ) : (
                                "Send OTP"
                            )}
                        </button>

                    ) : (
                        <>
                            <div className="mb-3">
                                <label className="form-label">Enter OTP</label>
                                <input
                                    type="text"
                                    className="form-control shadow-none"
                                    placeholder="Enter OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                            </div>
                            <button className="btn btn-success w-100 d-flex justify-content-center align-items-center" onClick={handleVerifyOtp} disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify OTP"
                                )}
                            </button>

                        </>
                    )}
                </div>
            </div>

        </>
    );
};

export default Login;
