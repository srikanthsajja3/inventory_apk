import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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
        setRoleState(mockUser.role as 'admin' | 'staff');
      } else {
        setUser(null);
        setRoleState(null);
      }
    } catch (err) {
      console.error('[useRole] refreshRole error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRole();
  }, [refreshRole]);

  const login = async (username: string, pass: string) => {
    const upperUser = username.toUpperCase().trim();
    
    try {
      // 1. Fetch user from app_users table
      const { data: appUser, error: userError } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', upperUser)
        .eq('is_active', true)
        .single();

      if (userError || !appUser) {
        return { error: { message: 'Invalid Username or User Inactive' } };
      }

      // 2. Validate password
      if (pass !== appUser.password) {
        return { error: { message: 'Invalid Password' } };
      }

      const userData = {
        id: appUser.username,
        email: appUser.email,
        full_name: appUser.username,
        role: appUser.role
      };
      
      const json = JSON.stringify(userData);
      if (Platform.OS === 'web') {
        localStorage.setItem('mock_user', json);
      } else {
        await SecureStore.setItemAsync('mock_user', json);
      }

      setUser(userData);
      setRoleState(userData.role as 'admin' | 'staff');
      return { error: null };

    } catch (err: any) {
      console.error('[useRole] login error:', err);
      return { error: { message: 'Database connection failed. Please ensure app_users table exists.' } };
    }
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
