// lib/store.ts
export type RootState = ReturnType<AppStore['getState']>;
import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import authReducer from './slices/authSlice';
export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
    },
    devTools: process.env.NODE_ENV !== 'production',
  });

type Store = ReturnType<typeof makeStore>;

export type AppStore = ReturnType<typeof makeStore>;
export type AppState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const wrapper = createWrapper<Store>(makeStore);
