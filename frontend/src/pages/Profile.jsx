import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Lock,
} from "lucide-react";
import api from "../api/axios";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [userId, setUserId] = useState(null);

  // Fetch current user from backend
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const res = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user = res.data;
        setUserId(user.id); // important for PUT /users/{user_id}

        const joined = new Date(
          user.created_at || Date.now()
        ).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        const data = {
          name: user.full_name || user.username || "User",
          phone: user.phone_number || "",
          email: user.email || "",
          address: "", // map backend address here if you later add it
          joinedDate: joined,
        };

        setProfileData(data);
        setEditData(data);

        // optional sync to localStorage
        localStorage.setItem("userName", data.name);
        localStorage.setItem("userNumber", data.phone);
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("userJoinedDate", data.joinedDate);
      } catch (err) {
        console.error("GET /auth/me error:", err?.response?.data || err);
      }
    };

    fetchMe();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...profileData });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({ ...profileData });
  };

  // Now updates BOTH backend and frontend
  const handleSave = async () => {
    if (!userId) {
      alert("User ID not loaded yet.");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");

      // Adjust field names to match your UserUpdate schema
      const body = {
        full_name: editData.name,
        email: editData.email,
        phone_number: editData.phone,
        // add other allowed fields from UserUpdate if needed
      };

      await api.put(`/users/${userId}`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // if backend ok, update frontend state + localStorage
      setProfileData(editData);

      localStorage.setItem("userName", editData.name);
      localStorage.setItem("userNumber", editData.phone);
      localStorage.setItem("userEmail", editData.email);
      localStorage.setItem("userAddress", editData.address || "");

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("UPDATE USER ERROR:", err?.response?.data || err);
      alert(
        err?.response?.data?.detail ||
          "Failed to update profile. Please try again."
      );
    }
  };

  const handlePasswordChange = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      alert("Please fill all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");

      // Backend expects query params: old_password, new_password
      await api.post(
        "/auth/change-password",
        null,
        {
          params: {
            old_password: passwordData.currentPassword,
            new_password: passwordData.newPassword,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        err?.response?.data || err.message
      );
      alert(
        err?.response?.data?.detail ||
          "Failed to change password. Please check current password."
      );
    }
  };

  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background p-3 sm:p-4 lg:p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Profile
          </h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 lg:p-8">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-3xl sm:text-4xl font-bold text-primary-foreground">
                {getInitials(profileData.name)}
              </span>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                {profileData.name}
              </h2>
              <p className="text-muted-foreground mb-3">{profileData.phone}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center sm:justify-start">
                <Calendar size={16} />
                <span>Joined {profileData.joinedDate}</span>
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Edit2 size={16} />
                Edit Profile
              </button>
            )}
          </div>

          {/* Profile Details */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label htmlFor="profile-name" className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <User size={16} />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    id="profile-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-teal-600"
                  />
                ) : (
                  <p className="text-foreground px-4 py-2.5">
                    {profileData.name}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="profile-phone" className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Phone size={16} />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    id="profile-phone"
                    type="text"
                    name="phone"
                    autoComplete="tel"
                    value={editData.phone}
                    onChange={(e) =>
                      setEditData({ ...editData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-teal-600"
                  />
                ) : (
                  <p className="text-foreground px-4 py-2.5">
                    {profileData.phone}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="profile-email" className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Mail size={16} />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    id="profile-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={editData.email}
                    onChange={(e) =>
                      setEditData({ ...editData, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-teal-600"
                    placeholder="your.email@example.com"
                  />
                ) : (
                  <p className="text-foreground px-4 py-2.5">
                    {profileData.email || "Not set"}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="profile-address" className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <MapPin size={16} />
                  Address
                </label>
                {isEditing ? (
                  <input
                    id="profile-address"
                    type="text"
                    name="address"
                    autoComplete="street-address"
                    value={editData.address}
                    onChange={(e) =>
                      setEditData({ ...editData, address: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-teal-600"
                    placeholder="Enter your address"
                  />
                ) : (
                  <p className="text-foreground px-4 py-2.5">
                    {profileData.address || "Not set"}
                  </p>
                )}
              </div>
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex-1 sm:flex-none"
                >
                  <Save size={16} />
                  Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-muted text-foreground rounded-lg hover:bg-secondary transition-colors flex-1 sm:flex-none"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            )}

            {/* Change Password Button */}
            {!isEditing && (
              <div className="pt-6 border-t border-border">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-lg hover:bg-secondary transition-colors"
                >
                  <Lock size={16} />
                  Change Password
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 max-w-md w-full border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                Change Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="profile-current-password" className="block text-sm font-medium text-muted-foreground mb-2">
                  Current Password
                </label>
                <input
                  id="profile-current-password"
                  type="password"
                  name="currentPassword"
                  autoComplete="current-password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-teal-600"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label htmlFor="profile-new-password" className="block text-sm font-medium text-muted-foreground mb-2">
                  New Password
                </label>
                <input
                  id="profile-new-password"
                  type="password"
                  name="newPassword"
                  autoComplete="new-password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-teal-600"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label htmlFor="profile-confirm-password" className="block text-sm font-medium text-muted-foreground mb-2">
                  Confirm New Password
                </label>
                <input
                  id="profile-confirm-password"
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-teal-600"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePasswordChange}
                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Update Password
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
