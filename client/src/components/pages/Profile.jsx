import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { FaUserEdit, FaPhone, FaEnvelope, FaUserCircle } from "react-icons/fa";

const Profile = () => {
  const { user, logout, setUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get("/auth/profile"); // Assuming your profile route is /auth/profile // Update context with the full user object received from the backend
        if (response.data && response.data.user) {
          setUser(response.data.user);
          setFormData({
            name: response.data.user.name || "",
            phone: response.data.user.phone || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch user profile data:", error);
      }
    }; // Only fetch if the user object exists (i.e., they are logged in)
    if (user && !user.name) {
      fetchUserProfile();
    } else if (user) {
      // Initialize form data if name/phone is already present in context
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
      });
    }
  }, [user, setUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await api.put(`/users/${user.user_id}`, formData); // Directly update context
      setUser({ ...user, ...formData });
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (error) {
      console.error("Update failed", error.response || error);
      setMessage({
        type: "danger",
        text: `Update Failed: ${error.response?.data?.error || "Server error"}`,
      });
    } finally {
      setLoading(false);
    }
  };
  if (!user)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    ); // Function to determine initial/avatar background color

  const getAvatarColor = (name) => {
    if (!name) return "#CCC";
    const hash = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ["#FF4B2B", "#FF416C", "#1abc9c", "#3498db", "#9b59b6"];
    return colors[hash % colors.length];
  };

  return (
    <div className="auth-wrapper">
      {" "}
      <div className="auth-container m-5">
        {" "}
        {/* Profile Content - using a simplified form-container structure */}{" "}
        <div
          className="form-container sign-in-container"
          style={{ width: "100%", position: "relative" }}
        >
          {" "}
          <form className="auth-form" style={{ padding: "30px 40px" }}>
            {" "}
            {/* --- AVATAR & INFO --- */}{" "}
            <div
              className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 text-white fw-bold"
              style={{
                width: "100px",
                height: "100px",
                fontSize: "3rem",
                background: getAvatarColor(user.name),
                boxShadow: "0 0 0 5px rgba(255, 255, 255, 0.8)",
              }}
            >
              {" "}
              {user.name ? (
                user.name[0].toUpperCase()
              ) : (
                <FaUserCircle style={{ fontSize: "3rem" }} />
              )}{" "}
            </div>{" "}
            <h3 className="fw-bold text-dark mb-1">{user.name || "User"}</h3>{" "}
            {message && (
              <div
                className={`alert alert-${message.type} text-center w-100 my-3`}
              >
                {message.text}{" "}
              </div>
            )}{" "}
            <div className="d-flex justify-content-between align-items-center w-100 my-4 pt-2 border-top">
              {" "}
              <h5 className="mb-0 text-secondary">
                {" "}
                <FaUserEdit className="me-2 text-primary" size={16} /> User
                Details{" "}
              </h5>{" "}
              {!isEditing && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm rounded-pill px-4 fw-bold"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile{" "}
                </button>
              )}{" "}
            </div>
            {/* --- FORM FIELDS --- */}{" "}
            <div className="w-100">
              {/* Full Name Field */}{" "}
              <div className="mb-3">
                {" "}
                <label className="form-label text-muted small fw-bold w-100 text-start ps-3">
                  Full Name
                </label>{" "}
                <input
                  type="text"
                  className={`auth-input ${
                    isEditing ? "" : "auth-input-display"
                  }`} // Use auth-input-display for non-editing
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />{" "}
              </div>
              {/* Phone Field */}{" "}
              <div className="mb-3">
                {" "}
                <label className="form-label text-muted small fw-bold d-flex align-items-center w-100 text-start ps-3">
                  {" "}
                  <FaPhone className="me-2" size={12} /> Phone{" "}
                </label>{" "}
                <input
                  type="text"
                  className={`auth-input ${
                    isEditing ? "" : "auth-input-display"
                  }`}
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={isEditing ? "Enter phone number" : "Not set"}
                />{" "}
              </div>{" "}
              {/* Email Field (Read-Only) - Use the new custom class */}{" "}
              <div className="mb-3">
                {" "}
                <label className="form-label text-muted small fw-bold d-flex align-items-center w-100 text-start ps-3">
                  {" "}
                  <FaEnvelope className="me-2" size={12} /> Email (Read-Only){" "}
                </label>{" "}
                <div className="auth-input-display">{user.email} </div>{" "}
              </div>{" "}
            </div>
            {/* --- BUTTONS --- */}{" "}
            {isEditing && (
              <div className="d-flex justify-content-end gap-3 mt-4 w-100">
                {" "}
                <button
                  type="button"
                  className="auth-btn ghost" // Using ghost for cancel
                  onClick={() => {
                    setIsEditing(false);
                    setMessage(null);
                    setFormData({
                      name: user.name || "",
                      phone: user.phone || "",
                    });
                  }}
                >
                  Cancel{" "}
                </button>{" "}
                <button
                  type="button"
                  className="auth-btn"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {" "}
                  {loading ? "Saving..." : "Save Changes"}{" "}
                </button>{" "}
              </div>
            )}
            <hr className="my-5 w-100" />
            {/* Sign Out Button */}{" "}
            <button
              onClick={logout}
              className="auth-btn"
              style={{
                backgroundColor: "#FF4B2B",
                borderColor: "#FF4B2B",
                width: "40%",
                padding: "12px 45px",
              }}
            >
              Sign Out{" "}
            </button>{" "}
          </form>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
};

export default Profile;
