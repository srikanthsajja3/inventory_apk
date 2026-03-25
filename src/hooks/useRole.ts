import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export function useRole() {
  const [role, setRoleState] = useState<'admin' | 'staff' | null>(null);
  const [loading, setLoading] = useState(true);

  const setRole = async (newRole: 'admin' | 'staff' | null) => {
    try {
      setRoleState(newRole);
      if (newRole) {
        if (Platform.OS === 'web') {
          localStorage.setItem('mock_role', newRole);
        } else {
          await SecureStore.setItemAsync('mock_role', newRole);
        }
      } else {
        if (Platform.OS === 'web') {
          localStorage.removeItem('mock_role');
        } else {
          await SecureStore.deleteItemAsync('mock_role');
        }
      }
    } catch (e) {
      console.warn('Role storage error:', e);
    }
  };

  useEffect(() => {
    async function initRole() {
      try {
        setLoading(true);
        // 1. Check Mock Role (Local Storage)
        let savedRole = null;
        if (Platform.OS === 'web') {
          savedRole = localStorage.getItem('mock_role');
        } else {
          savedRole = await SecureStore.getItemAsync('mock_role');
        }
        
        if (savedRole === 'admin' || savedRole === 'staff') {
          setRoleState(savedRole as 'admin' | 'staff');
          setLoading(false);
          return;
        }

        // 2. Check Auth and Database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (data && !error) {
            setRoleState(data.role as 'admin' | 'staff');
          } else {
            // Default to admin if no profile exists yet (for easy development)
            setRoleState('admin');
          }
        } else {
            // For unauthenticated local development, default to admin
            setRoleState('admin');
        }
      } catch (error) {
        console.error('useRole Init Error:', error);
      } finally {
        setLoading(false);
      }
    }

    initRole();
  }, []);

  return { role, setRole, loading };
}
