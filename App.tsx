import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ActivityIndicator, BackHandler, Platform, TextInput, Alert } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { LayoutDashboard, Package, Scan, History, FileUp, Users, Lock, Eye, EyeOff, User as UserIcon } from 'lucide-react-native';

// Import Real Screens
import DashboardScreen from './src/screens/DashboardScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import ScanScreen from './src/screens/ScanScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ImportScreen from './src/screens/ImportScreen';
import VendorScreen from './src/screens/VendorScreen';
import EstimationScreen from './src/screens/EstimationScreen';
import GoldRateScreen from './src/screens/GoldRateScreen';
import { useRole } from './src/hooks/useRole';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [estimationItem, setEstimationItem] = useState<any>(null);
  const [showGoldRate, setShowGoldRate] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { role, user, loading, login, logout } = useRole();

  useEffect(() => {
    // Web specific history handling
    if (Platform.OS === 'web') {
      const handlePopState = (event: PopStateEvent) => {
        if (event.state && event.state.tab) {
          setActiveTab(event.state.tab);
        } else {
          setActiveTab('dashboard');
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    setEstimationItem(null);
    setShowGoldRate(false);
    if (Platform.OS === 'web') {
      window.history.pushState({ tab }, '', `?tab=${tab}`);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter Username and Password');
      return;
    }

    setIsLoggingIn(true);
    try {
      const { error } = await login(username, password);
      if (error) {
        Alert.alert('Login Failed', error.message);
      }
    } catch (err: any) {
      console.error('Login Error:', err);
      Alert.alert('Error', 'An unexpected error occurred during login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    if (Platform.OS === 'web') {
      window.location.reload();
    }
  };

  const renderLogin = () => (
    <SafeAreaView style={styles.loginContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.loginContent}>
        <View style={styles.loginLogo}>
          <Package size={60} color="#6366f1" />
        </View>
        <Text style={styles.loginTitle}>Moksha Jewels</Text>
        <Text style={styles.loginSubtitle}>VJA Inventory Manager</Text>
        
        <View style={styles.inputContainer}>
          <UserIcon size={20} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Username (e.g. C1)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.loginBtn, { backgroundColor: '#6366f1' }, isLoggingIn && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginBtnText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderContent = () => {
    if (showGoldRate) {
      return <GoldRateScreen onBack={() => setShowGoldRate(false)} />;
    }

    if (estimationItem) {
      return <EstimationScreen route={{ params: { item: estimationItem } }} navigation={{ goBack: () => setEstimationItem(null) }} />;
    }

    switch (activeTab) {
      case 'dashboard': return <DashboardScreen onUpdateGoldRate={() => setShowGoldRate(true)} />;
      case 'inventory': return <InventoryScreen />;
      case 'vendor': return <VendorScreen />;
      case 'scan': return <ScanScreen onEstimate={(item: any) => setEstimationItem(item)} />;
      case 'history': return <HistoryScreen />;
      case 'import': return <ImportScreen />;
      default: return <DashboardScreen onUpdateGoldRate={() => setShowGoldRate(true)} />;
    }
  };

  const NavItem = ({ name, icon: Icon, label }: any) => (
    <TouchableOpacity 
      style={styles.navItem} 
      onPress={() => changeTab(name)}
    >
      <Icon size={24} color={activeTab === name ? '#6366f1' : '#94a3b8'} />
      <Text style={[styles.navLabel, { color: activeTab === name ? '#6366f1' : '#94a3b8' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderApp = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>MOKSHA JEWELS VJA</Text>
          <View style={styles.roleBadgeContainer}>
            <Text style={styles.roleBadge}>{(role || 'STAFF').toUpperCase()} MODE</Text>
            <Text style={styles.userEmail}>{user?.id}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Lock size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {renderContent()}
      </View>

      <View style={styles.tabBar}>
        <NavItem name="dashboard" icon={LayoutDashboard} label="Home" />
        <NavItem name="inventory" icon={Package} label="Items" />
        <NavItem name="scan" icon={Scan} label="Scan" />
        {role === 'admin' && <NavItem name="vendor" icon={Users} label="Vendors" />}
        <NavItem name="history" icon={History} label="History" />
        {role === 'admin' && <NavItem name="import" icon={FileUp} label="Import" />}
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, height: '100%', backgroundColor: '#f8fafc' }}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={{ marginTop: 12, color: '#1e293b', fontWeight: '700' }}>Moksha Jewels</Text>
            <Text style={{ marginTop: 4, color: '#64748b' }}>Connecting to secure server...</Text>
          </View>
        ) : !user ? (
          renderLogin()
        ) : (
          renderApp()
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  roleBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366f1',
    letterSpacing: 1,
  },
  roleBadgeContainer: {
    flexDirection: 'column',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 15,
    marginBottom: 25,
    height: 60,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1e293b',
  },
  eyeIcon: {
    padding: 8,
  },
  loginContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
  },
  loginContent: {
    padding: 30,
    alignItems: 'center',
  },
  loginLogo: {
    width: 100,
    height: 100,
    backgroundColor: '#eef2ff',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 40,
    textAlign: 'center',
  },
  loginBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  loginBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
