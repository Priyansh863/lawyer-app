// lib/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// types/user.ts
export enum EAccountType {
    user = 'user',
    Admin = 'admin',
    lawyer = 'lawyer',
    client = 'client',
  }
  
  export interface IUser {
    _id?: string;
    account_type: EAccountType;
    user_name?: string;
    about?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    password?: string;
    profile_image?: string;
    additional_images?: string[];
    phone?: string;
    is_active: number;
    rating_updated_for_self?: boolean;
    rating_updated_for_others?: boolean;
    is_verified: number;
    is_profile_completed: number;
    fcm_token?: string;
    created_at?: string;
    updated_at?: string;
  }
  
interface AuthState {
  user: IUser | null;
  loading: boolean;
  error: string | null;
  token: string | null;
}

const initialState: AuthState = {
    user: typeof window !== 'undefined' && localStorage.getItem('user') 
        ? JSON.parse(localStorage.getItem('user') || 'null') 
        : null,
    loading: false,
    error: null,
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<IUser>) {
      state.user = action.payload;
      state.error = null;
    },
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    updateUserData(state, action: PayloadAction<Partial<IUser>>) {
        if (state.user) {
            state.user = { ...state.user, ...action.payload };
        }
    },
  },
});

export const { setUser, setToken, logout, setLoading, setError,updateUserData } = authSlice.actions;
export default authSlice.reducer;
