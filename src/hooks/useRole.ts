import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';
import { User } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// HARDCODED USERS
const VALID_USERS: Record<string, { role: 'admin' | 'staff', email: string }> = {
  'ADMIN': { role: 'admin', email: 'admin@mokshajewels.com' },
  'C1': { role: 'staff', email: 'c1@mokshajewels.com' },
  'C2': { role: 'staff', email: 'c2@mokshajewels.com' },
  'C3': { role: 'staff', email: 'c3@mokshajewels.com' },
  'C4': { role: 'staff', email: 'c4@mokshajewels.com' },
  'C5': { role: 'staff', email: 'c5@mokshajewels.com' },
  'C6': { role: 'staff', email: 'c6@mokshajewels.com' },
  'C7': { role: 'staff', email: 'c7@mokshajewels.com' },
  'C8': { role: 'staff', email: 'c8@mokshajewels.com' },
  'C9': { role: 'staff', email: 'c9@mokshajewels.com' },
  'C10': { role: 'staff', email: 'c10@mokshajewels.com' },
};

export const HARDCODED_PASSWORD = 'Gpajtdmw';

export function useRole() {
  const [role, setRoleState] = useState<'admin' | 'staff' | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshRole = useCallback(async () => {
    try {
      setLoading(true);
      let savedUserJson = null;
      
      if (Platform.OS === 'web') {
        savedUserJson = localStorage.getItem('mock_user');
      } else {
        savedUserJson = await SecureStore.getItemAsync('mock_user');
      }

      if (savedUserJson) {
        const mockUser = JSON.parse(savedUserJson);
        setUser(mockUser);
        setRoleState(mockUser.role);
      } else {
        setUser(null);
        setRoleState(null);
      }
    } catch (err) {
      console.error('[useRole] refreshRole error:', err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, []);

  useEffect(() => {
    refreshRole();
  }, [refreshRole]);

  const login = async (username: string, pass: string) => {
    const upperUser = username.toUpperCase().trim();
    if (VALID_USERS[upperUser] && pass === HARDCODED_PASSWORD) {
      const userData = {
        id: upperUser,
        email: VALID_USERS[upperUser].email,
        full_name: upperUser,
        role: VALID_USERS[upperUser].role
      };
      
      const json = JSON.stringify(userData);
      if (Platform.OS === 'web') {
        localStorage.setItem('mock_user', json);
      } else {
        await SecureStore.setItemAsync('mock_user', json);
      }

      setUser(userData);
      setRoleState(userData.role);
      return { error: null };
    }
    return { error: { message: 'Invalid Username or Password' } };
  };

  const logout = async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('mock_user');
    } else {
      await SecureStore.deleteItemAsync('mock_user');
    }
    setUser(null);
    setRoleState(null);
  };

  return { role, user, loading, error, refreshRole, login, logout };
}
