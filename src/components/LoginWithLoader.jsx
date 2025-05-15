import React, { useEffect, useState } from "react";
import Login from "./Login";
import "../styles/Loader.css"; // Custom CSS for loader

const LoginWithLoader = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500); // 1.5 seconds

        return () => clearTimeout(timer);
    }, []);

    return loading ? (
        <div className="loader-container">
            <h1 className="loader-title">WORKNEXUS</h1>
            <div className="progress-bar-container">
                <div className="progress-bar-fill"></div>
            </div>
        </div>
    ) : (
        <Login />
    );
};

export default LoginWithLoader;
