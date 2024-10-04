// slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: null, // เก็บ token หลังจากผู้ใช้เข้าสู่ระบบ
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
    },
  },
});

export const { setToken, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
