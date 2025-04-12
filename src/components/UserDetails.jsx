import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";

const UserDetails = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        id: "",
        name: "",
        email: "",
        mobile: "",
        role: "EMPLOYEE",
    });

    useEffect(() => {
        const storedEmail = localStorage.getItem("userEmail");
        if (!storedEmail) {
            alert("No user email found. Please log in again.");
            return;
        }

        axios
            .get(`http://localhost:8181/user/find-by-email`, {
                params: { email: storedEmail },
            })
            .then((response) => {
                setUser(response.data);
            })
            .catch((error) => console.error("Error fetching user data:", error));
    }, []);

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await axios.put("http://localhost:8181/user/update-details", null, {
                params: { id: user.id, name: user.name, mobile: user.mobile },
            });

            await axios.put("http://localhost:8181/user/update-role", null, {
                params: { id: user.id, role: user.role },
            });

            alert("User details updated successfully");

            // Redirect based on user role
            if (user.role === "ADMIN") {
                navigate("/admin-dashboard");
            } else {
                navigate("/employee-dashboard");
            }
        } catch (error) {
            console.error("Error updating user details", error);
            alert("Failed to update user details");
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
            <div className="w-100" style={{ maxWidth: "500px" }}>
                <h2 className="text-center mb-4">User Details</h2>
                <form onSubmit={handleSubmit} className="card p-4 shadow-lg">
                    <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input
                            type="text"
                            className="form-control shadow-none"
                            name="name"
                            value={user.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Email (Read-only)</label>
                        <input type="email" className="form-control shadow-none" value={user.email} disabled />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Mobile</label>
                        <input
                            type="text"
                            className="form-control shadow-none"
                            name="mobile"
                            value={user.mobile}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Role</label>
                        <select className="form-select" name="role" value={user.role} onChange={handleChange}>
                            <option value="EMPLOYEE">EMPLOYEE</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary w-100">
                        Update Details
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserDetails;