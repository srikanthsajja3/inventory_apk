import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ActivityIndicator, BackHandler, Platform } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { LayoutDashboard, Package, Scan, History, FileUp, Users } from 'lucide-react-native';

// Import Real Screens
import DashboardScreen from './src/screens/DashboardScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import ScanScreen from './src/screens/ScanScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ImportScreen from './src/screens/ImportScreen';
import VendorScreen from './src/screens/VendorScreen';
import EstimationScreen from './src/screens/EstimationScreen';
import { useRole } from './src/hooks/useRole';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [estimationItem, setEstimationItem] = useState<any>(null);
  const { role, setRole, loading } = useRole();

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
      // Initialize state
      window.history.replaceState({ tab: activeTab }, '');
      return () => window.removeEventListener('popstate', handlePopState);
    }

    const backAction = () => {
      if (estimationItem) {
        setEstimationItem(null);
        return true;
      }
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        if (Platform.OS === 'web') {
          window.history.pushState({ tab: 'dashboard' }, '');
        }
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [activeTab, estimationItem]);

  const changeTab = (name: string) => {
    setActiveTab(name);
    setEstimationItem(null);
    if (Platform.OS === 'web') {
      window.history.pushState({ tab: name }, '');
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContent, { backgroundColor: '#f8fafc' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ marginTop: 20, color: '#64748b' }}>Initializing System...</Text>
        <TouchableOpacity 
          style={{ marginTop: 40 }} 
          onPress={() => setRole('admin')}
        >
          <Text style={{ color: '#6366f1', fontWeight: '600' }}>Skip Loading (Debug)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Choose Role if not set
  if (!role) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loginContainer}>
          <View style={styles.loginContent}>
            <View style={styles.loginLogo}>
              <Package size={60} color="#6366f1" />
            </View>
            <Text style={styles.loginTitle}>MOKSHA JEWELS VJA INVENTORY</Text>
            <Text style={styles.loginSubtitle}>Select your role to start testing</Text>
            
            <TouchableOpacity 
              style={[styles.loginBtn, { backgroundColor: '#6366f1' }]} 
              onPress={() => setRole('admin')}
            >
              <LayoutDashboard size={20} color="white" />
              <Text style={styles.loginBtnText}>Login as Admin</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginBtn, { backgroundColor: '#1e293b' }]} 
              onPress={() => setRole('staff')}
            >
              <Scan size={20} color="white" />
              <Text style={styles.loginBtnText}>Login as Staff</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const renderContent = () => {
    if (estimationItem) {
      return (
        <EstimationScreen 
          route={{ params: { item: estimationItem } }} 
          navigation={{ goBack: () => setEstimationItem(null) }} 
        />
      );
    }

    switch (activeTab) {
      case 'dashboard': return <DashboardScreen />;
      case 'inventory': return <InventoryScreen />;
      case 'vendor': return <VendorScreen />;
      case 'scan': return <ScanScreen onEstimate={(item: any) => setEstimationItem(item)} />;
      case 'history': return <HistoryScreen />;
      case 'import': return <ImportScreen />;
      default: return <DashboardScreen />;
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

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>MOKSHA JEWELS VJA INVENTORY</Text>
            <Text style={styles.roleBadge}>{role.toUpperCase()} MODE</Text>
          </View>
          <TouchableOpacity onPress={() => setRole(null)} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Switch Role</Text>
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
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  logoutText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
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
