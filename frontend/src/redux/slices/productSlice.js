// src/slices/productSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  list: [],        // menu / products from backend
  status: "idle",  // "idle" | "loading" | "succeeded" | "failed"
  error: null,
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.list = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    setProductsLoading: (state) => {
      state.status = "loading";
      state.error = null;
    },
    setProductsError: (state, action) => {
      state.status = "failed";
      state.error = action.payload;
    },
    clearProducts: (state) => {
      state.list = [];
      state.status = "idle";
      state.error = null;
    },
  },
});

export const {
  setProducts,
  setProductsLoading,
  setProductsError,
  clearProducts,
} = productSlice.actions;

export default productSlice.reducer;
