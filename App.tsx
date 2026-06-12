import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ActivityIndicator, BackHandler, Platform, TextInput, Alert, Image, Modal } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { LayoutDashboard, Package, Scan, History, Users, Settings, Lock, Eye, EyeOff, User as UserIcon, RefreshCw, ShoppingBag } from 'lucide-react-native';
import { useRole } from './src/hooks/useRole';
import { Theme } from './src/theme';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import ScanScreen from './src/screens/ScanScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import VendorScreen from './src/screens/VendorScreen';
import GoldRateScreen from './src/screens/GoldRateScreen';
import StoneMasterScreen from './src/screens/StoneMasterScreen';
import EstimationScreen from './src/screens/EstimationScreen';
import SalesScreen from './src/screens/SalesScreen';
import ErrorBoundary from './src/components/ErrorBoundary';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    ...Platform.select({
      web: {
        width: '100%',
        alignSelf: 'stretch',
      }
    })
  },
  header: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  logo: {
    fontSize: Theme.typography.size.lg,
    fontWeight: '900',
    color: Theme.colors.primary,
    letterSpacing: -0.5,
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  roleBadge: {
    fontSize: Theme.typography.size.xs,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  userEmail: {
    fontSize: Theme.typography.size.xs,
    color: Theme.colors.text.secondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 25 : Theme.spacing.sm,
    backgroundColor: Theme.colors.background,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: Theme.typography.size.xs,
    fontWeight: '500',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.background,
  },
  // Login Styles
  loginContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  loginContent: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  loginLogo: {
    width: 80,
    height: 80,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Theme.spacing.md,
  },
  loginTitle: {
    fontSize: Theme.typography.size.xl,
    fontWeight: '900',
    color: Theme.colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: Theme.typography.size.md,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    marginBottom: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
  },
  inputIcon: {
    marginRight: Theme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    fontSize: Theme.typography.size.md,
    color: Theme.colors.text.primary,
    fontWeight: '600',
  },
  eyeIcon: {
    padding: 10,
  },
  loginBtn: {
    borderRadius: Theme.radius.md,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 4px 8px ${Theme.colors.primary}33`,
      }
    })
  },
  loginBtnText: {
    color: Theme.colors.text.black,
    fontSize: Theme.typography.size.md,
    fontWeight: '700',
  },
});

const NavItem = React.memo(({ name, icon: Icon, label, isActive, onPress }: any) => (
  <TouchableOpacity 
    style={styles.navItem} 
    onPress={() => onPress(name)}
  >
    <Icon size={24} color={isActive ? Theme.colors.primary : Theme.colors.text.secondary} />
    <Text style={[styles.navLabel, { color: isActive ? Theme.colors.primary : Theme.colors.text.secondary }]}>
      {label}
    </Text>
  </TouchableOpacity>
));

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [estimationItem, setEstimationItem] = useState<any>(null);
  const [showGoldRate, setShowGoldRate] = useState(false);
  const [showStoneMaster, setShowStoneMaster] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { role, user, loading, login } = useRole();

  useEffect(() => {
    // Web specific history handling
    if (Platform.OS === 'web') {
      const handlePopState = (event: PopStateEvent) => {
        if (event.state) {
          if (event.state.tab && event.state.tab !== activeTab) {
            setActiveTab(event.state.tab);
          } else if (event.state.type === 'folder') {
            setActiveTab('inventory');
          }
        } else {
          const params = new URLSearchParams(window.location.search);
          const tab = params.get('tab');
          if (tab && tab !== activeTab) setActiveTab(tab);
          else if (!tab) setActiveTab('dashboard');
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [activeTab]);

  const changeTab = useCallback((tab: string) => {
    if (tab === activeTab) return;
    
    setActiveTab(tab);
    setEstimationItem(null);
    setShowGoldRate(false);
    setShowStoneMaster(false);
    
    if (Platform.OS === 'web') {
      const url = new URL(window.location.href);
      const currentTab = url.searchParams.get('tab');
      if (currentTab !== tab) {
        url.searchParams.set('tab', tab);
        url.searchParams.delete('folderId'); // Clear folderId when changing tabs
        window.history.pushState({ tab }, '', url.search);
      }
    }
  }, [activeTab]);

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

  const renderLogin = () => (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <SafeAreaView style={styles.loginContainer}>
          <StatusBar barStyle="light-content" />
          <View style={styles.loginContent}>
            <View style={styles.loginLogo}>
              <Image source={require('./assets/logo.png')} style={{ width: 80, height: 80, borderRadius: 16 }} resizeMode="contain" />
            </View>
            <Text style={styles.loginTitle}>Moksha Jewels</Text>
            <Text style={styles.loginSubtitle}>VJA Inventory Manager</Text>
            
            <View style={styles.inputContainer}>
              <UserIcon size={20} color={Theme.colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username (e.g. C1)"
                placeholderTextColor={Theme.colors.text.muted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color={Theme.colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Theme.colors.text.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? <EyeOff size={20} color={Theme.colors.text.secondary} /> : <Eye size={20} color={Theme.colors.text.secondary} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.loginBtn, { backgroundColor: Theme.colors.primary }, isLoggingIn && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator color={Theme.colors.text.black} />
              ) : (
                <Text style={styles.loginBtnText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );

  const handleEstimation = useCallback((item: any) => setEstimationItem(item), []);
  const handleUpdateGoldRate = useCallback(() => setShowGoldRate(true), []);
  const handleManageStones = useCallback(() => setShowStoneMaster(true), []);
  const handleSalesBack = useCallback(() => changeTab('dashboard'), [changeTab]);

  const renderContent = () => {
    if (showGoldRate) {
      return <GoldRateScreen onBack={() => setShowGoldRate(false)} />;
    }

    if (showStoneMaster) {
      return <StoneMasterScreen onBack={() => setShowStoneMaster(false)} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen 
          onNavigate={changeTab} 
          onEstimation={handleEstimation}
          onUpdateGoldRate={handleUpdateGoldRate}
          onManageStones={handleManageStones}
        />;
      case 'inventory':
        return <InventoryScreen onEstimation={handleEstimation} />;
      case 'scan':
        return <ScanScreen onEstimation={handleEstimation} />;
      case 'history':
        return <HistoryScreen />;
      case 'vendor':
        return <VendorScreen />;
      case 'sales':
        return <SalesScreen onBack={handleSalesBack} />;
      default:
        return <DashboardScreen 
          onNavigate={changeTab} 
          onEstimation={handleEstimation} 
          onUpdateGoldRate={handleUpdateGoldRate} 
          onManageStones={handleManageStones} 
        />;
    }
  };

  const renderApp = () => (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
          <StatusBar barStyle="light-content" />
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image source={require('./assets/logo.png')} style={{ width: 32, height: 32, borderRadius: 6 }} resizeMode="contain" />
              <View>
                <Text style={styles.logo}>MOKSHA JEWELS VJA</Text>
                <View style={styles.roleBadgeContainer}>
                  <Text style={styles.roleBadge}>{(role || 'STAFF').toUpperCase()} MODE</Text>
                  <Text style={styles.userEmail}>{user?.id}</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.content}>
            {renderContent()}
          </View>

          <View style={styles.tabBar}>
            <NavItem name="dashboard" icon={LayoutDashboard} label="Home" isActive={activeTab === 'dashboard'} onPress={changeTab} />
            <NavItem name="inventory" icon={Package} label="Items" isActive={activeTab === 'inventory'} onPress={changeTab} />
            <NavItem name="scan" icon={Scan} label="Scan" isActive={activeTab === 'scan'} onPress={changeTab} />
            {role === 'admin' && <NavItem name="sales" icon={ShoppingBag} label="Sales" isActive={activeTab === 'sales'} onPress={changeTab} />}
            {role === 'admin' && <NavItem name="vendor" icon={Users} label="Vendors" isActive={activeTab === 'vendor'} onPress={changeTab} />}
            {role !== 'admin' && <NavItem name="history" icon={History} label="History" isActive={activeTab === 'history'} onPress={changeTab} />}
          </View>
        </SafeAreaView>
      </View>
      
      <Modal 
        visible={!!estimationItem} 
        animationType="slide" 
        onRequestClose={() => setEstimationItem(null)}
      >
        {estimationItem && (
          <EstimationScreen 
            route={{ params: { item: estimationItem } }} 
            navigation={{ goBack: () => setEstimationItem(null) }} 
          />
        )}
      </Modal>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        {user ? renderApp() : renderLogin()}
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
