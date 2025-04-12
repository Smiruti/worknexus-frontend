import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import profilePic from "../assets/profile-pic.jpg";
import { useNavigate } from "react-router-dom";

const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("checkin");
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [userEmail, setUserEmail] = useState("");
    const [userData, setUserData] = useState(null);
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [leaveDate, setLeaveDate] = useState("");
    const [leaveReason, setLeaveReason] = useState("");
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [tasks, setTasks] = useState([]);

    // Work Sheet state
    const [workDate, setWorkDate] = useState("");
    const [workTitle, setWorkTitle] = useState("");
    const [workDescription, setWorkDescription] = useState("");
    const [workStartTime, setWorkStartTime] = useState("");
    const [workEndTime, setWorkEndTime] = useState("");

    // Work History state
    const [workHistory, setWorkHistory] = useState([]);
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");
    const [selectedWorkHistory, setSelectedWorkHistory] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        const email = localStorage.getItem("userEmail");
        if (!email) {
            alert("No user email found. Please log in again.");
            navigate("/");
            return;
        }
        setUserEmail(email);

        const fetchData = async () => {
            try {
                // Fetch user data
                const userResponse = await axios.get(`http://localhost:8181/user/find-by-email?email=${email}`);
                setUserData(userResponse.data);

                if (userResponse.data.role !== "EMPLOYEE") {
                    navigate("/admin-dashboard");
                    return;
                }

                // Fetch today's attendance
                await fetchTodayAttendance(email);

                // Fetch leave history
                await fetchLeaveHistory(email);

                // Fetch work history
                await fetchWorkHistory(email);

                // Fetch assigned tasks
                await fetchTasks(userResponse.data.id);

                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                navigate("/");
            }
        };

        fetchData();
    }, [navigate]);

    const fetchTodayAttendance = async (email) => {
        try {
            const response = await axios.get(`http://localhost:8181/attendance/view/${email}`);
            const today = new Date().toISOString().split('T')[0];
            const todayRecord = response.data.find(record =>
                record.attendanceDate === today
            );

            setTodayAttendance(todayRecord);

            if (todayRecord) {
                if (todayRecord.clockIn && !todayRecord.clockOut) {
                    setAttendanceStatus("PRESENT");
                } else if (todayRecord.clockIn && todayRecord.clockOut) {
                    setAttendanceStatus("COMPLETED");
                } else {
                    setAttendanceStatus(null);
                }
            } else {
                setAttendanceStatus(null);
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
            setAttendanceStatus(null);
        }
    };

    const fetchLeaveHistory = async (email) => {
        try {
            const response = await axios.get(`http://localhost:8181/leave/user/${email}`);
            setLeaveHistory(response.data);
        } catch (error) {
            console.error("Error fetching leave history:", error);
        }
    };

    const fetchWorkHistory = async (email) => {
        try {
            const response = await axios.get(`http://localhost:8181/work-history/user/${email}`);
            setWorkHistory(response.data);
        } catch (error) {
            console.error("Error fetching work history:", error);
        }
    };

    const fetchTasks = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:8181/task/employee/${userId}`);
            setTasks(response.data);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

    const fetchFilteredWorkHistory = async () => {
        try {
            const response = await axios.get(`http://localhost:8181/work-history/user/${userEmail}/filter`, {
                params: {
                    startDate: filterStartDate,
                    endDate: filterEndDate
                }
            });
            setWorkHistory(response.data);
        } catch (error) {
            console.error("Error fetching filtered work history:", error);
        }
    };

    const clockIn = async () => {
        if (!userEmail) return;

        try {
            const response = await axios.post(`http://localhost:8181/attendance/clock-in?email=${userEmail}`);
            setAttendanceStatus("PRESENT");
            setTodayAttendance(response.data);
            alert(`Clocked in successfully at ${new Date(response.data.clockIn).toLocaleTimeString()}`);
        } catch (error) {
            console.error("Error clocking in:", error);
            alert(error.response?.data || "Error clocking in");
        }
    };

    const clockOut = async () => {
        if (!userEmail) return;

        try {
            const response = await axios.post(`http://localhost:8181/attendance/clock-out?email=${userEmail}`);
            setAttendanceStatus("COMPLETED");
            setTodayAttendance(response.data);
            alert(`Clocked out successfully at ${new Date(response.data.clockOut).toLocaleTimeString()}`);
        } catch (error) {
            console.error("Error clocking out:", error);
            alert(error.response?.data || "Error clocking out");
        }
    };

    const updateTaskStatus = async (taskId, status) => {
        try {
            const response = await axios.put(`http://localhost:8181/task/update-status`, null, {
                params: {
                    taskId: taskId,
                    status: status,
                    userId: userData.id
                }
            });

            if (response.data === "Task status updated successfully") {
                await fetchTasks(userData.id);
            } else {
                alert(response.data);
            }
        } catch (error) {
            console.error("Error updating task status:", error);
            alert(error.response?.data || "Error updating task status");
        }
    };

    const submitLeaveRequest = async (e) => {
        e.preventDefault();
        if (!leaveDate || !leaveReason) {
            alert("Please fill in all fields");
            return;
        }

        try {
            await axios.post("http://localhost:8181/leave/request", null, {
                params: {
                    email: userEmail,
                    leaveDate: leaveDate,
                    reason: leaveReason
                }
            });
            alert("Leave request submitted successfully!");
            setLeaveDate("");
            setLeaveReason("");
            const userResponse = await axios.get(`http://localhost:8181/user/find-by-email?email=${userEmail}`);
            setUserData(userResponse.data);
            await fetchLeaveHistory(userEmail);
        } catch (error) {
            console.error("Error submitting leave request:", error);
            alert(error.response?.data || "Error submitting leave request");
        }
    };

    const submitWorkSheet = async (e) => {
        e.preventDefault();
        if (!workDate || !workTitle || !workDescription || !workStartTime || !workEndTime) {
            alert("Please fill in all fields");
            return;
        }

        try {
            await axios.post("http://localhost:8181/work-history/add", null, {
                params: {
                    email: userEmail,
                    date: workDate,
                    title: workTitle,
                    description: workDescription,
                    startTime: workStartTime,
                    endTime: workEndTime
                }
            });
            alert("Work sheet submitted successfully!");
            setWorkDate("");
            setWorkTitle("");
            setWorkDescription("");
            setWorkStartTime("");
            setWorkEndTime("");
            await fetchWorkHistory(userEmail);
        } catch (error) {
            console.error("Error submitting work sheet:", error);
            alert(error.response?.data || "Error submitting work sheet");
        }
    };

    const handleViewWorkHistory = (work) => {
        setSelectedWorkHistory(work);
        setIsEditMode(false);
    };

    const handleEditWorkHistory = (work) => {
        setSelectedWorkHistory(work);
        setIsEditMode(true);
        setWorkDate(work.date);
        setWorkTitle(work.title);
        setWorkDescription(work.description);
        setWorkStartTime(work.startTime);
        setWorkEndTime(work.endTime);
    };

    const updateWorkHistory = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:8181/work-history/update/${selectedWorkHistory.id}`, null, {
                params: {
                    date: workDate,
                    title: workTitle,
                    description: workDescription,
                    startTime: workStartTime,
                    endTime: workEndTime
                }
            });
            alert("Work history updated successfully!");
            setSelectedWorkHistory(null);
            setIsEditMode(false);
            await fetchWorkHistory(userEmail);
        } catch (error) {
            console.error("Error updating work history:", error);
            alert(error.response?.data || "Error updating work history");
        }
    };

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <nav className="navbar navbar-expand-lg navbar-dark px-3" style={{ backgroundColor: "#004AAD" }}>
                <div className="container-fluid d-flex justify-content-between">
                    <div className="navbar-brand fw-bold">Employee Dashboard</div>
                    <div className="d-flex align-items-center">
                        <p className="text-white mx-2 mb-0">{userData.name || "Employee"}</p>
                        <img
                            src={userData.profilePicUrl || profilePic}
                            alt="Profile"
                            className="rounded-circle"
                            style={{ width: "40px", height: "40px", objectFit: "cover", cursor: "pointer" }}
                        />
                    </div>
                </div>
            </nav>

            <div className="container mt-4 text-center">
                <h1>Welcome {userData.name || "Employee"}</h1>
                <div className="d-flex justify-content-center mt-3 flex-wrap">
                    <button
                        className={`btn me-2 mb-2 ${activeTab === "checkin" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setActiveTab("checkin")}
                    >
                        Check-In / Check-Out
                    </button>
                    <button
                        className={`btn me-2 mb-2 ${activeTab === "tasks" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setActiveTab("tasks")}
                    >
                        Assigned Tasks
                    </button>
                    <button
                        className={`btn me-2 mb-2 ${activeTab === "worksheet" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setActiveTab("worksheet")}
                    >
                        Work Sheet
                    </button>
                    <button
                        className={`btn me-2 mb-2 ${activeTab === "workhistory" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setActiveTab("workhistory")}
                    >
                        Work History
                    </button>
                    <button
                        className={`btn me-2 mb-2 ${activeTab === "leave" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setActiveTab("leave")}
                    >
                        Leave Request
                    </button>
                    <button
                        className={`btn me-2 mb-2 ${activeTab === "logout" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => {
                            localStorage.removeItem("userEmail");
                            navigate("/");
                        }}
                    >
                        Logout
                    </button>
                </div>

                {activeTab === "checkin" && (
                    <div className="card mt-4 mx-auto shadow-lg" style={{ maxWidth: "400px" }}>
                        <div className="card-body text-center">
                            <h5 className="card-title fw-bold">Check-In / Check-Out</h5>
                            <button
                                className="btn btn-success w-100 mb-2"
                                onClick={clockIn}
                                disabled={attendanceStatus === "PRESENT" || attendanceStatus === "COMPLETED"}
                            >
                                Check In
                            </button>
                            <button
                                className="btn btn-danger w-100"
                                onClick={clockOut}
                                disabled={!attendanceStatus || attendanceStatus === "COMPLETED"}
                            >
                                Check Out
                            </button>
                            {attendanceStatus && (
                                <div className="mt-3">
                                    <p>Status:
                                        <span className={`badge ${attendanceStatus === "PRESENT" ? "bg-success" :
                                            attendanceStatus === "COMPLETED" ? "bg-primary" : "bg-secondary"
                                            } ms-2`}>
                                            {attendanceStatus}
                                        </span>
                                    </p>
                                    {todayAttendance?.clockIn && (
                                        <p>Clock In: {new Date(todayAttendance.clockIn).toLocaleTimeString()}</p>
                                    )}
                                    {todayAttendance?.clockOut && (
                                        <p>Clock Out: {new Date(todayAttendance.clockOut).toLocaleTimeString()}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "tasks" && (
                    <div className="mt-4">
                        <div className="card shadow-lg">
                            <div className="card-body">
                                <h5 className="card-title fw-bold text-center mb-4">Assigned Tasks</h5>

                                <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                                    <table className="table table-hover">
                                        <thead className="table-light sticky-top">
                                            <tr>
                                                <th>Title</th>
                                                <th>Assigned By</th>
                                                <th>Details</th>
                                                <th>Assigned Date</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.length > 0 ? (
                                                tasks.map(task => (
                                                    <tr key={task.id}>
                                                        <td>{task.title}</td>
                                                        <td>{task.assignedBy?.name || 'Admin'}</td>
                                                        <td className="text-truncate" style={{ maxWidth: "200px" }} title={task.details}>
                                                            {task.details}
                                                        </td>
                                                        <td>{new Date(task.assignedDate).toLocaleDateString()}</td>
                                                        <td>
                                                            <span className={`badge ${task.status === "COMPLETED" ? "bg-success" : "bg-warning"
                                                                }`}>
                                                                {task.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {task.status === "IN_PROGRESS" && (
                                                                <button
                                                                    className="btn btn-sm btn-success"
                                                                    onClick={() => updateTaskStatus(task.id, "COMPLETED")}
                                                                >
                                                                    Mark Complete
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-4">
                                                        <i className="bi bi-list-task text-muted" style={{ fontSize: "2rem" }}></i>
                                                        <p className="mt-2">No tasks assigned</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "leave" && (
                    <div className="mt-4">
                        <div className="alert alert-info mb-4 mt-5" style={{ maxWidth: "528px" }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <h6 className="mb-0">Your Leave Balance</h6>
                                <p className="display-6 mb-0">{userData.leaveBalance} days</p>
                            </div>
                        </div>

                        <div className="row justify-content-center">
                            <div className="col-md-5 mb-4 mb-md-0">
                                <div className="card h-100 shadow-lg">
                                    <div className="card-body">
                                        <h6 className="card-title fw-bold text-center mb-3">Submit Leave Request</h6>
                                        <form onSubmit={submitLeaveRequest}>
                                            <div className="mb-3 text-start">
                                                <label htmlFor="leaveDate" className="form-label">Leave Date</label>
                                                <input
                                                    type="date"
                                                    className="form-control shadow-none"
                                                    id="leaveDate"
                                                    value={leaveDate}
                                                    onChange={(e) => setLeaveDate(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3 text-start">
                                                <label htmlFor="leaveReason" className="form-label">Reason</label>
                                                <textarea
                                                    className="form-control shadow-none"
                                                    id="leaveReason"
                                                    rows="3"
                                                    value={leaveReason}
                                                    onChange={(e) => setLeaveReason(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <button type="submit" className="btn btn-primary w-100">
                                                Submit Request
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-7">
                                <div className="card h-100 shadow-lg">
                                    <div className="card-body">
                                        <h6 className="card-title fw-bold text-center mb-3">Your Leave History</h6>
                                        <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
                                            <table className="table table-hover">
                                                <thead className="table-light sticky-top">
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Reason</th>
                                                        <th>Status</th>
                                                        <th>Requested On</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {leaveHistory.length > 0 ? (
                                                        leaveHistory.map(request => (
                                                            <tr key={request.id}>
                                                                <td>{new Date(request.leaveDate).toLocaleDateString()}</td>
                                                                <td className="text-truncate" style={{ maxWidth: "150px" }} title={request.reason}>
                                                                    {request.reason}
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${request.status === "APPROVED" ? "bg-success" :
                                                                        request.status === "REJECTED" ? "bg-danger" : "bg-warning"
                                                                        }`}>
                                                                        {request.status}
                                                                    </span>
                                                                </td>
                                                                <td>{new Date(request.requestDate).toLocaleDateString()}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" className="text-center py-4">
                                                                <i className="bi bi-calendar-x text-muted" style={{ fontSize: "2rem" }}></i>
                                                                <p className="mt-2">No leave requests found</p>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "worksheet" && (
                    <div className="row justify-content-center mt-4">
                        <div className="col-md-8">
                            <div className="card shadow-lg">
                                <div className="card-body">
                                    <h5 className="card-title fw-bold text-center mb-4">Daily Work Sheet</h5>
                                    <form onSubmit={submitWorkSheet}>
                                        <div className="row mb-3">
                                            <div className="col-md-6 text-start">
                                                <label className="form-label">Date</label>
                                                <input
                                                    type="date"
                                                    className="form-control shadow-none"
                                                    value={workDate}
                                                    onChange={(e) => setWorkDate(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3 text-start">
                                                <label className="form-label">Title</label>
                                                <input
                                                    type="text"
                                                    className="form-control shadow-none"
                                                    value={workTitle}
                                                    onChange={(e) => setWorkTitle(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="row mb-3">
                                            <div className="col-md-6 text-start">
                                                <label className="form-label">Start Time</label>
                                                <input
                                                    type="time"
                                                    className="form-control"
                                                    value={workStartTime}
                                                    onChange={(e) => setWorkStartTime(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6 text-start">
                                                <label className="form-label">End Time</label>
                                                <input
                                                    type="time"
                                                    className="form-control"
                                                    value={workEndTime}
                                                    onChange={(e) => setWorkEndTime(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-3 text-start">
                                            <label className="form-label">Description</label>
                                            <textarea
                                                className="form-control shadow-none"
                                                rows="5"
                                                value={workDescription}
                                                onChange={(e) => setWorkDescription(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <button type="submit" className="btn btn-primary w-100">
                                            Submit Work Sheet
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "workhistory" && (
                    <div className="mt-4">
                        <div className="card shadow-lg">
                            <div className="card-body">
                                <h5 className="card-title fw-bold text-center mb-4">Work History</h5>

                                {/* Filter Section */}
                                <div className="row mb-3">
                                    <div className="col-md-3 text-start">
                                        <label className="form-label ">Start Date</label>
                                        <input
                                            type="date"
                                            className="form-control shadow-none"
                                            value={filterStartDate}
                                            onChange={(e) => setFilterStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-3 text-start">
                                        <label className="form-label">End Date</label>
                                        <input
                                            type="date"
                                            className="form-control shadow-none"
                                            value={filterEndDate}
                                            onChange={(e) => setFilterEndDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-2 d-flex align-items-end">
                                        <button
                                            className="btn btn-primary w-100"
                                            onClick={fetchFilteredWorkHistory}
                                        >
                                            Filter
                                        </button>
                                    </div>
                                </div>

                                {/* Work History Table */}
                                <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                                    <table className="table table-hover">
                                        <thead className="table-light sticky-top">
                                            <tr>
                                                <th>Date</th>
                                                <th>Title</th>
                                                <th>Duration</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {workHistory.length > 0 ? (
                                                workHistory.map(work => (
                                                    <tr key={work.id}>
                                                        <td>{new Date(work.date).toLocaleDateString()}</td>
                                                        <td>{work.title}</td>
                                                        <td>
                                                            {work.startTime} - {work.endTime}
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-info me-2"
                                                                onClick={() => handleViewWorkHistory(work)}
                                                            >
                                                                View
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-warning"
                                                                onClick={() => handleEditWorkHistory(work)}
                                                            >
                                                                Edit
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-4">
                                                        <i className="bi bi-calendar-x text-muted" style={{ fontSize: "2rem" }}></i>
                                                        <p className="mt-2">No work history found</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* View Modal */}
                        {selectedWorkHistory && !isEditMode && (
                            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Work Details</h5>
                                            <button
                                                type="button"
                                                className="btn-close"
                                                onClick={() => setSelectedWorkHistory(null)}
                                            ></button>
                                        </div>
                                        <div className="modal-body">
                                            <p><strong>Date:</strong> {new Date(selectedWorkHistory.date).toLocaleDateString()}</p>
                                            <p><strong>Title:</strong> {selectedWorkHistory.title}</p>
                                            <p><strong>Time:</strong> {selectedWorkHistory.startTime} - {selectedWorkHistory.endTime}</p>
                                            <p><strong>Description:</strong></p>
                                            <p>{selectedWorkHistory.description}</p>
                                        </div>
                                        <div className="modal-footer">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setSelectedWorkHistory(null)}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Edit Modal */}
                        {selectedWorkHistory && isEditMode && (
                            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Edit Work History</h5>
                                            <button
                                                type="button"
                                                className="btn-close"
                                                onClick={() => {
                                                    setSelectedWorkHistory(null);
                                                    setIsEditMode(false);
                                                }}
                                            ></button>
                                        </div>
                                        <div className="modal-body">
                                            <form onSubmit={updateWorkHistory}>
                                                <div className="mb-3">
                                                    <label className="form-label">Date</label>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={workDate}
                                                        onChange={(e) => setWorkDate(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label">Title</label>
                                                    <input
                                                        type="text"
                                                        className="form-control shadow-none"
                                                        value={workTitle}
                                                        onChange={(e) => setWorkTitle(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="row mb-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label">Start Time</label>
                                                        <input
                                                            type="time"
                                                            className="form-control"
                                                            value={workStartTime}
                                                            onChange={(e) => setWorkStartTime(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label">End Time</label>
                                                        <input
                                                            type="time"
                                                            className="form-control"
                                                            value={workEndTime}
                                                            onChange={(e) => setWorkEndTime(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label">Description</label>
                                                    <textarea
                                                        className="form-control shadow-none"
                                                        rows="5"
                                                        value={workDescription}
                                                        onChange={(e) => setWorkDescription(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <button type="submit" className="btn btn-primary w-100">
                                                    Update Work History
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default EmployeeDashboard;