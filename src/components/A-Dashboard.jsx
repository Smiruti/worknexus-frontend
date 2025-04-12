import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import profilePic from "../assets/profile-pic.jpg";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("attendance");
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [employeesStatus, setEmployeesStatus] = useState([]);
    const [userEmail, setUserEmail] = useState("");
    const [userData, setUserData] = useState(null);
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Task-related states
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState({
        title: '',
        details: '',
        assignedTo: ''
    });
    const [employees, setEmployees] = useState([]);

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

                if (userResponse.data.role !== "ADMIN") {
                    navigate("/employee-dashboard");
                    return;
                }

                // Fetch today's attendance
                await fetchTodayAttendance(email);

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

    // Fetch leave requests from API
    useEffect(() => {
        if (activeTab === "leave") {
            axios.get("http://localhost:8181/leave/all")
                .then(response => setLeaveRequests(response.data))
                .catch(error => console.error("Error fetching leave requests:", error));
        }
    }, [activeTab]);

    // Fetch employees status
    useEffect(() => {
        if (activeTab === "employees") {
            axios.get("http://localhost:8181/attendance/today-status")
                .then(response => setEmployeesStatus(response.data))
                .catch(error => console.error("Error fetching employees status:", error));
        }
    }, [activeTab]);

    // Fetch tasks and employees when tasks tabs are active
    useEffect(() => {
        if ((activeTab === "create-task" || activeTab === "view-tasks") && userData?.id) {
            // Fetch all tasks assigned by this admin
            axios.get(`http://localhost:8181/task/admin/${userData.id}`)
                .then(response => setTasks(response.data))
                .catch(error => console.error("Error fetching tasks:", error));

            // Fetch all employees
            axios.get("http://localhost:8181/user/all")
                .then(response => {
                    const employees = response.data.filter(user => user.role === "EMPLOYEE");
                    setEmployees(employees);
                })
                .catch(error => console.error("Error fetching employees:", error));
        }
    }, [activeTab, userData]);

    // Activate Attendance
    const activateAttendance = async () => {
        try {
            await axios.get("http://localhost:8181/attendance/create-daily");
            alert("Attendance activated successfully!");
            await fetchTodayAttendance(userEmail);
        } catch (error) {
            console.error("Error activating attendance:", error);
            alert(error.response?.data || "Error activating attendance");
        }
    };

    // Clock In
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

    // Clock Out
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

    // Approve Leave Request
    const approveLeave = async (leaveId) => {
        try {
            await axios.post(`http://localhost:8181/leave/approve/${leaveId}?adminEmail=${userEmail}`);
            alert("Leave request approved successfully!");
            setLeaveRequests(leaveRequests.map(request =>
                request.id === leaveId ? { ...request, status: "APPROVED" } : request
            ));
        } catch (error) {
            console.error("Error approving leave request:", error);
            alert(error.response?.data || "Error approving leave request");
        }
    };

    // Reject Leave Request
    const rejectLeave = async (leaveId) => {
        try {
            await axios.post(`http://localhost:8181/leave/reject/${leaveId}?adminEmail=${userEmail}`);
            alert("Leave request rejected successfully!");
            setLeaveRequests(leaveRequests.map(request =>
                request.id === leaveId ? { ...request, status: "REJECTED" } : request
            ));
        } catch (error) {
            console.error("Error rejecting leave request:", error);
            alert(error.response?.data || "Error rejecting leave request");
        }
    };

    // Create new task
    const createTask = async () => {
        try {
            const response = await axios.post(
                `http://localhost:8181/task/create?title=${encodeURIComponent(newTask.title)}&details=${encodeURIComponent(newTask.details)}&assignedToId=${newTask.assignedTo}&assignedById=${userData.id}`
            );

            setTasks([...tasks, response.data]);
            setNewTask({
                title: '',
                details: '',
                assignedTo: ''
            });
            alert('Task created successfully!');
            setActiveTab("view-tasks");
        } catch (error) {
            console.error("Error creating task:", error);
            alert(error.response?.data || "Error creating task");
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
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark px-3" style={{ backgroundColor: "#004AAD" }}>
                <div className="container-fluid d-flex justify-content-between">
                    <div className="navbar-brand fw-bold">Admin Dashboard</div>
                    <div className="d-flex align-items-center">
                        <p className="text-white mx-2 mb-0">{userData.name || "Admin"}</p>
                        <img
                            src={userData.profilePicUrl || profilePic}
                            alt="Profile"
                            className="rounded-circle"
                            style={{ width: "40px", height: "40px", objectFit: "cover", cursor: "pointer" }}
                        />
                    </div>
                </div>
            </nav>

            {/* Dashboard Content */}
            <div className="container mt-4 text-center">
                <h1>Welcome {userData.name || "Admin"}</h1>
                <div className="d-flex justify-content-center mt-3 flex-wrap">
                    <button
                        className={`btn me-2 mb-2 ${activeTab === "attendance" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setActiveTab("attendance")}
                    >
                        Attendance
                    </button>
                    <button
                        className={`btn me-2 mb-2 ${activeTab === "checkin" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setActiveTab("checkin")}
                    >
                        Check-In / Check-Out
                    </button>
                    <button
                        className={`btn me-2 mb-2 ${activeTab === "employees" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setActiveTab("employees")}
                    >
                        Employees Status
                    </button>
                    <button
                        className={`btn me-2 mb-2 ${activeTab === "create-task" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setActiveTab("create-task")}
                    >
                        Create Task
                    </button>
                    <button
                        className={`btn me-2 mb-2 ${activeTab === "view-tasks" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setActiveTab("view-tasks")}
                    >
                        View Tasks
                    </button>
                    <button
                        className={`btn me-2 mb-2 ${activeTab === "leave" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setActiveTab("leave")}
                    >
                        Leave Requests
                    </button>
                    <button
                        className={`btn mb-2 ${activeTab === "logout" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => {
                            localStorage.removeItem("userEmail");
                            navigate("/");
                        }}
                    >
                        Logout
                    </button>
                </div>

                {/* Attendance Card */}
                {activeTab === "attendance" && (
                    <div className="card mt-4 mx-auto shadow-lg" style={{ maxWidth: "400px" }}>
                        <div className="card-body text-center">
                            <h5 className="card-title fw-bold">Attendance</h5>
                            <p>Click here to activate attendance</p>
                            <button
                                className="btn btn-success w-100"
                                onClick={activateAttendance}
                            >
                                Activate Attendance
                            </button>
                        </div>
                    </div>
                )}

                {/* Check-In / Check-Out Card */}
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

                {/* Employees Status Card */}
                {activeTab === "employees" && (
                    <div className="card mt-4 mx-auto shadow-lg" style={{ maxWidth: "1000px" }}>
                        <div className="card-body">
                            <h5 className="card-title fw-bold text-center">Today's Employees Status</h5>
                            <div className="table-responsive">
                                <table className="table table-bordered">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Attendance Date</th>
                                            <th>Status</th>
                                            <th>Clock In</th>
                                            <th>Clock Out</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employeesStatus.length > 0 ? (
                                            employeesStatus.map(employee => (
                                                <tr key={employee.id}>
                                                    <td>{employee.user?.name || "N/A"}</td>
                                                    <td>{employee.user?.email || "N/A"}</td>
                                                    <td>{new Date(employee.attendanceDate).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className={`badge ${employee.status === "PRESENT" ? "bg-success" :
                                                            employee.status === "ABSENT" ? "bg-danger" : "bg-warning"
                                                            }`}>
                                                            {employee.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {employee.clockIn ?
                                                            new Date(employee.clockIn).toLocaleTimeString() :
                                                            "N/A"}
                                                    </td>
                                                    <td>
                                                        {employee.clockOut ?
                                                            new Date(employee.clockOut).toLocaleTimeString() :
                                                            "N/A"}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center">No attendance records found for today</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Task Card */}
                {activeTab === "create-task" && (
                    <div className="card mt-4 mx-auto shadow-lg" style={{ maxWidth: "800px" }}>
                        <div className="card-body">
                            <h5 className="card-title fw-bold text-center mb-4">Create New Task</h5>
                            <div className="row g-3">
                                <div className="col-md-6 text-start">
                                    <label htmlFor="taskTitle" className="form-label">Task Title</label>
                                    <input
                                        type="text"
                                        className="form-control shadow-none"
                                        id="taskTitle"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        placeholder="Enter task title"
                                    />
                                </div>
                                <div className="col-md-6 text-start">
                                    <label htmlFor="assignedTo" className="form-label">Assign To</label>
                                    <select
                                        className="form-select shadow-none"
                                        id="assignedTo"
                                        value={newTask.assignedTo}
                                        onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map(employee => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12 text-start">
                                    <label htmlFor="taskDetails" className="form-label">Task Details</label>
                                    <textarea
                                        className="form-control shadow-none"
                                        id="taskDetails"
                                        rows="5"
                                        value={newTask.details}
                                        onChange={(e) => setNewTask({ ...newTask, details: e.target.value })}
                                        placeholder="Enter task details"
                                    ></textarea>
                                </div>
                                <div className="col-12 text-end">
                                    <button
                                        className="btn btn-success me-2"
                                        onClick={createTask}
                                        disabled={!newTask.title || !newTask.assignedTo || !newTask.details}
                                    >
                                        Create Task
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Tasks Card */}
                {activeTab === "view-tasks" && (
                    <div className="card mt-4 mx-auto shadow-lg" style={{ maxWidth: "1000px" }}>
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="card-title fw-bold mb-0">Assigned Tasks</h5>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Title</th>
                                            <th>Details</th>
                                            <th>Assigned To</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tasks.length > 0 ? (
                                            tasks.map(task => (
                                                <tr key={task.id}>
                                                    <td>{task.title}</td>
                                                    <td>{task.details}</td>
                                                    <td>
                                                        {task.assignedTo?.name || 'N/A'}
                                                    </td>
                                                    <td>{new Date(task.assignedDate).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className={`badge ${task.status === 'COMPLETED' ? 'bg-success' :
                                                                task.status === 'IN_PROGRESS' ? 'bg-warning' : 'bg-secondary'
                                                            }`}>
                                                            {task.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center">No tasks assigned yet</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leave Requests Card */}
                {activeTab === "leave" && (
                    <div className="card mt-4 mx-auto shadow-lg" style={{ maxWidth: "1000px" }}>
                        <div className="card-body">
                            <h5 className="card-title fw-bold text-center">Leave Requests</h5>
                            <div className="table-responsive">
                                <table className="table table-bordered">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Leave Date</th>
                                            <th>Status</th>
                                            <th>Request Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaveRequests.length > 0 ? (
                                            leaveRequests.map(request => (
                                                <tr key={request.id}>
                                                    <td>{request.user?.name || "N/A"}</td>
                                                    <td>{request.user?.email || "N/A"}</td>
                                                    <td>{new Date(request.leaveDate).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className={`badge ${request.status === "APPROVED" ? "bg-success" :
                                                            request.status === "REJECTED" ? "bg-danger" : "bg-warning"
                                                            }`}>
                                                            {request.status}
                                                        </span>
                                                    </td>
                                                    <td>{new Date(request.requestDate).toLocaleString()}</td>
                                                    <td>
                                                        {request.status === "PENDING" ? (
                                                            <>
                                                                <button
                                                                    className="btn btn-success btn-sm me-2"
                                                                    onClick={() => approveLeave(request.id)}
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => rejectLeave(request.id)}
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="text-muted">Processed</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center">No leave requests found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AdminDashboard;