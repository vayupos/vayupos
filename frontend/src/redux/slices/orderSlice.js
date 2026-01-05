// src/slices/orderSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentOrder: null,  // { id, items, total, status, ... }
  history: [],         // past orders if you want
  status: "idle",
  error: null,
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    addOrderToHistory: (state, action) => {
      state.history.push(action.payload);
    },
    setOrdersLoading: (state) => {
      state.status = "loading";
      state.error = null;
    },
    setOrdersError: (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    },
  },
});

export const {
  setCurrentOrder,
  clearCurrentOrder,
  addOrderToHistory,
  setOrdersLoading,
  setOrdersError,
} = orderSlice.actions;

export default orderSlice.reducer;
