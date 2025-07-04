// src/features/auth/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const loadState = () => {
  try {
    const serializedState = localStorage.getItem('auth');
    if (serializedState === null) {
      return undefined;
    }
    const storedState = JSON.parse(serializedState);
    return {
      ...storedState,
      isLoading: false,
      error: null,
      isRegistering: false,
      registerError: null,
      registerSuccess: false,
    };
  } catch (err) {
    console.error("Error loading state from localStorage:", err);
    return undefined;
  }
};

const saveState = (state) => {
  try {
    const stateToPersist = {
      isLoggedIn: state.isLoggedIn,
      user: state.user,
      token: state.token,
      registeredUsers: state.registeredUsers,
    };
    const serializedState = JSON.stringify(stateToPersist);
    localStorage.setItem('auth', serializedState);
  } catch (err) {
    console.error("Error saving state to localStorage:", err);
  }
};

const initialState = loadState() || {
  isLoggedIn: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isRegistering: false,
  registerError: null,
  registerSuccess: false,
  registeredUsers: [],
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.isLoggedIn = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      saveState(state);
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.isLoggedIn = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
      const currentState = loadState() || {};
      saveState({
        ...currentState,
        isLoggedIn: false,
        user: null,
        token: null,
        registeredUsers: state.registeredUsers
      });
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.user = null;
      state.token = null;
      state.error = null;
      const currentState = loadState() || {};
      saveState({
        ...currentState,
        isLoggedIn: false,
        user: null,
        token: null,
        registeredUsers: state.registeredUsers
      });
      state.isRegistering = false;
      state.registerError = null;
      state.registerSuccess = false;
    },
    registerStart: (state) => {
      state.isRegistering = true;
      state.registerError = null;
      state.registerSuccess = false;
    },
    registerSuccess: (state) => {
      state.isRegistering = false;
      state.registerSuccess = true;
      state.registerError = null;
      saveState(state);
    },
    registerFailure: (state, action) => {
      state.isRegistering = false;
      state.registerSuccess = false;
      state.registerError = action.payload;
      saveState(state);
    },
    resetRegisterState: (state) => {
      state.isRegistering = false;
      state.registerError = null;
      state.registerSuccess = false;
    },
    addRegisteredUser: (state, action) => {
      const { username, password } = action.payload;
      const userExists = state.registeredUsers.some(user => user.username === username);
      if (!userExists) {
        state.registeredUsers.push({ username, password });
        saveState(state);
      }
    }
  },
});

export const { loginStart, loginSuccess, loginFailure, logout,
               registerStart, registerSuccess, registerFailure, resetRegisterState,
               addRegisteredUser
             } = authSlice.actions;

export default authSlice.reducer;