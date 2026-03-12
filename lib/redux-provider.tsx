'use client';

import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { makeStore } from './store';
import { setUser, setToken } from './slices/authSlice';

const store = makeStore();

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  // Hydrate Redux store from localStorage on client-side mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          store.dispatch(setUser(user));
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      }
      
      if (token) {
        store.dispatch(setToken(token));
      }
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}