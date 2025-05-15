import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginWithLoader from "./components/LoginWithLoader";
import UserDetails from "./components/UserDetails";
import EmployeeDashboard from "./components/E-Dashboard";
import AdminDashboard from "./components/A-Dashboard";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginWithLoader />} />
        <Route path="/user-details" element={<UserDetails />} />
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
