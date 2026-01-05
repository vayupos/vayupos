// src/slices/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,        // { id, name, email, role, ... }
  token: null,       // access token / JWT
  status: "idle",    // "idle" | "loading" | "succeeded" | "failed"
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.status = "succeeded";
      state.error = null;
    },
    setAuthLoading: (state) => {
      state.status = "loading";
      state.error = null;
    },
    setAuthError: (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
    },
  },
});

export const { setCredentials, setAuthLoading, setAuthError, logout } =
  authSlice.actions;

export default authSlice.reducer;
