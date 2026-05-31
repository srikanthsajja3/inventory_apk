import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Image, ScrollView, Platform, TextInput, Modal, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Scan, X, Package, Plus, Minus, Info, PlusCircle, Scale, Tag, Hash, FileText, Keyboard, IndianRupee, Calculator, Edit3, User, Clock, ShoppingBag, Gem, Edit2  } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { useRole } from '../hooks/useRole';
import { useJewelryCalc } from '../hooks/useJewelryCalc';
import StoneEntryModal from '../components/StoneEntryModal';
import ItemFolderModal from '../components/ItemFolderModal';
import OptimizedImage from '../components/OptimizedImage';

import { Theme } from '../theme';
import { SCREEN_WIDTH } from '../utils/scaling';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  cameraContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  scanArea: { 
    width: Math.min(SCREEN_WIDTH * 0.7, 280), 
    height: Math.min(SCREEN_WIDTH * 0.7, 280), 
    borderWidth: 3, 
    borderColor: Theme.colors.primary, 
    backgroundColor: 'transparent', 
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      web: {
        boxShadow: `0 0 15px ${Theme.colors.primary}`,
      }
    })
  },
  scanText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '700', 
    marginTop: 30, 
    textAlign: 'center',
    ...Platform.select({
      ios: {
        textShadowColor: 'black', 
        textShadowOffset: { width: 0, height: 1 }, 
        textShadowRadius: 4
      },
      android: {
        textShadowColor: 'black', 
        textShadowOffset: { width: 0, height: 1 }, 
        textShadowRadius: 4
      },
      web: {
        textShadow: '0 1px 4px black'
      }
    })
  },
  controls: { position: 'absolute', bottom: 40, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 20 },
  controlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  manualEntryContainer: { width: '85%', maxWidth: 400, marginTop: 40 },
  manualInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, paddingHorizontal: 12, height: 56, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  manualIcon: { marginRight: 10 },
  manualInput: { flex: 1, height: '100%', color: 'white', fontSize: 16, fontWeight: '600' },
  manualBtn: { backgroundColor: Theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  manualBtnText: { color: Theme.colors.background, fontWeight: '700', fontSize: 14 },
  buttonText: { color: Theme.colors.background, fontWeight: '700', fontSize: Theme.typography.size.sm },
  resultContainer: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: Platform.OS === 'web' && SCREEN_WIDTH > 600 ? 'center' : 'flex-end' 
  },
  fullWidthCard: { 
    backgroundColor: Theme.colors.surface, 
    borderTopLeftRadius: Theme.radius.xl, 
    borderTopRightRadius: Theme.radius.xl, 
    borderBottomLeftRadius: Platform.OS === 'web' && SCREEN_WIDTH > 600 ? Theme.radius.xl : 0,
    borderBottomRightRadius: Platform.OS === 'web' && SCREEN_WIDTH > 600 ? Theme.radius.xl : 0,
    height: Platform.OS === 'web' && SCREEN_WIDTH > 600 ? '80%' : '90%', 
    width: Platform.OS === 'web' && SCREEN_WIDTH > 600 ? 500 : '100%',
    alignSelf: 'center',
    overflow: 'hidden'
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Theme.spacing.md, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  headerTitle: { fontSize: Theme.typography.size.lg, fontWeight: '800', color: Theme.colors.text.primary },
  closeBtn: { padding: 8, backgroundColor: Theme.colors.background, borderRadius: Theme.radius.sm },
  resultScroll: { flex: 1, padding: Theme.spacing.md },
  itemTopSection: { flexDirection: 'row', gap: Theme.spacing.md, marginBottom: Theme.spacing.md },
  imageSection: { width: 100, height: 100 },
  multiImageContainer: { width: 100, height: 100 },
  imageWrapper: { width: 100, height: 100, borderRadius: Theme.radius.md, backgroundColor: Theme.colors.background, overflow: 'hidden', marginRight: 8, borderWidth: 1, borderColor: Theme.colors.border },
  imageContainer: { width: 100, height: 100, borderRadius: Theme.radius.md, backgroundColor: Theme.colors.background, overflow: 'hidden', borderWidth: 1, borderColor: Theme.colors.border },
  itemImage: { width: '100%', height: '100%' },
  imagePlaceholder: { width: 100, height: 100, backgroundColor: Theme.colors.background, borderRadius: Theme.radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  itemBasicInfo: { flex: 1, justifyContent: 'center' },
  itemName: { fontSize: Theme.typography.size.lg, fontWeight: '800', color: Theme.colors.text.primary },
  itemSku: { fontSize: Theme.typography.size.sm, color: Theme.colors.text.secondary, marginTop: 4, fontWeight: '600' },
  vendorBadge: { backgroundColor: Theme.colors.background, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8 },
  vendorText: { fontSize: 10, fontWeight: '700', color: Theme.colors.text.secondary },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailBadge: { width: '48%', flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.background, padding: Theme.spacing.sm, borderRadius: Theme.radius.md, borderWidth: 1, borderColor: Theme.colors.border, gap: 8 },
  badgeIcon: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  badgeLabel: { fontSize: 9, color: Theme.colors.text.secondary, fontWeight: '600' },
  badgeValue: { fontSize: 12, color: Theme.colors.text.primary, fontWeight: '800' },
  stickyControls: { padding: Theme.spacing.md, paddingBottom: Platform.OS === 'ios' ? 40 : Theme.spacing.md, backgroundColor: Theme.colors.surface, borderTopWidth: 1, borderTopColor: Theme.colors.border },
  stockControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Theme.spacing.md },
  qtyDisplay: { alignItems: 'center' },
  qtyValue: { fontSize: Theme.typography.size.xl, fontWeight: '900', color: Theme.colors.text.primary },
  qtyLabel: { fontSize: 9, color: Theme.colors.text.secondary, fontWeight: '700', textTransform: 'uppercase' },
  actionRow: { flexDirection: 'row', gap: 10 },
  estimateBtn: { flex: 1, backgroundColor: Theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: Theme.radius.md, gap: 8 },
  doneBtn: { flex: 1, backgroundColor: Theme.colors.muted, paddingVertical: 14, borderRadius: Theme.radius.md, alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  doneBtnText: { color: '#fff', fontSize: Theme.typography.size.md, fontWeight: '700' },
  notFoundCard: { backgroundColor: Theme.colors.surface, borderRadius: Theme.radius.lg, padding: Theme.spacing.lg, margin: Theme.spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border, maxWidth: 500, alignSelf: 'center' },
  notFoundTitle: { fontSize: Theme.typography.size.xl, fontWeight: '800', color: Theme.colors.text.primary, marginTop: 15 },
  notFoundText: { textAlign: 'center', color: Theme.colors.text.secondary, marginTop: 10, fontSize: Theme.typography.size.md, lineHeight: 22 },
  scannedDataText: { fontWeight: '700', color: Theme.colors.primary },
  notFoundActions: { width: '100%', marginTop: Theme.spacing.lg, gap: 10 },
  addBtn: { backgroundColor: Theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: Theme.radius.md, gap: 8 },
  addBtnText: { color: Theme.colors.background, fontWeight: '800', fontSize: Theme.typography.size.md },
  retryBtn: { paddingVertical: 14, borderRadius: Theme.radius.md, alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  retryBtnText: { color: Theme.colors.text.secondary, fontWeight: '700', fontSize: Theme.typography.size.md },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: Theme.spacing.md
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: Theme.spacing.lg, marginBottom: Theme.spacing.md, gap: Theme.spacing.sm },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Theme.colors.text.secondary, textTransform: 'uppercase', letterSpacing: 1 },
  sectionLine: { flex: 1, height: 1, backgroundColor: Theme.colors.border },
  stoneListContainer: { gap: Theme.spacing.xs, marginTop: 0, marginBottom: Theme.spacing.md },
  stoneCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  stoneCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingBottom: 10,
  },
  stoneIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  stoneNameText: {
    fontSize: Theme.typography.size.md,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  stoneCategoryText: {
    fontSize: 9,
    color: Theme.colors.text.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stoneCardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stoneGridItem: {
    flex: 1,
  },
  stoneGridLabel: {
    fontSize: 8,
    color: Theme.colors.text.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  stoneGridValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  sellModalContent: { 
    backgroundColor: Theme.colors.background, 
    borderRadius: Theme.radius.xl, 
    width: '90%',
    maxWidth: 340,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center'
  },
  sellHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: Theme.spacing.md, 
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1, 
    borderBottomColor: Theme.colors.border 
  },
  sellBody: { padding: Theme.spacing.md, justifyContent: 'center' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.muted, borderRadius: Theme.radius.sm, paddingHorizontal: Theme.spacing.sm, borderWidth: 1, borderColor: Theme.colors.border },
  sellInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: Theme.typography.size.md, color: Theme.colors.text.primary },
  staffSelectBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginRight: 8, borderWidth: 1, borderColor: Theme.colors.border, gap: 6 },
  staffSelectBtnActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  staffSelectText: { fontSize: 11, fontWeight: '700', color: Theme.colors.text.secondary },
  staffSelectTextActive: { color: Theme.colors.background },
  saveButton: { backgroundColor: Theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: Theme.radius.md, gap: 8, marginTop: 15 },
  saveButtonText: { color: Theme.colors.background, fontSize: Theme.typography.size.md, fontWeight: '700' },
  message: { textAlign: 'center', fontSize: 16, color: Theme.colors.text.secondary, padding: 20 },
  button: { backgroundColor: Theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 10 },
});

const DetailBadge = ({ label, value, icon: Icon, color }: any) => {
  if (value === null || value === undefined || value === '') return null;
  const badgeColor = color || Theme.colors.primary;
  return (
    <View style={styles.detailBadge}>
      <View style={[styles.badgeIcon, { backgroundColor: `${badgeColor}15` }]}>
        <Icon size={14} color={badgeColor} />
      </View>
      <View>
        <Text style={styles.badgeLabel}>{label}</Text>
        <Text style={styles.badgeValue}>{value}</Text>
      </View>
    </View>
  );
};

const StoneDetailsList = ({ stonesJson }: { stonesJson: string | null }) => {
  if (!stonesJson) return null;
  
  try {
    const stones = JSON.parse(stonesJson);
    if (!Array.isArray(stones) || stones.length === 0) return null;

    return (
      <View style={styles.stoneListContainer}>
        {stones.map((stone: any, index: number) => (
          <View key={stone.id || index} style={styles.stoneCard}>
            <View style={styles.stoneCardHeader}>
              <View style={styles.stoneIconContainer}>
                <Gem size={18} color={Theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.stoneNameText}>{stone.name || 'Stone'}</Text>
                <Text style={styles.stoneCategoryText}>{stone.category || 'Detail'}</Text>
              </View>
            </View>
            <View style={styles.stoneCardGrid}>
              <View style={styles.stoneGridItem}>
                <Text style={styles.stoneGridLabel}>Weight</Text>
                <Text style={styles.stoneGridValue}>{stone.weight}g</Text>
              </View>
              <View style={styles.stoneGridItem}>
                <Text style={styles.stoneGridLabel}>Pieces</Text>
                <Text style={styles.stoneGridValue}>{stone.pcs}</Text>
              </View>
              {stone.rate && (
                <View style={styles.stoneGridItem}>
                  <Text style={styles.stoneGridLabel}>Rate</Text>
                  <Text style={styles.stoneGridValue}>₹{stone.rate}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  } catch (e) {
    return <Text style={styles.badgeValue}>{stonesJson}</Text>;
  }
};

export default function ScanScreen({ onEstimation }: { onEstimation?: (item: any) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [itemFound, setItemFound] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [manualSku, setManualSku] = useState('');
  
  const [showSellModal, setShowSellModal] = useState(false);
  const [saleAmount, setSaleAmount] = useState('');
  const [selling, setSelling] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const toggleEmployee = (name: string) => {
    setSelectedEmployees(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name) 
        : [...prev, name]
    );
  };

  const { role, user } = useRole();
  const { calculateEstimation } = useJewelryCalc();

  const [showManualInput, setShowManualInput] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (showSellModal) {
      fetchEmployees();
    }
  }, [showSellModal]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase.from('employees').select('name').eq('is_active', true).order('name');
      if (error) throw error;
      setEmployees(data || []);
    } catch (e: any) {
      console.error('Fetch Employees Error:', e.message);
    }
  };

  const handleSell = async () => {
    if (!itemFound || (itemFound.quantity || 0) <= 0) {
      Alert.alert('Error', 'This item is out of stock and cannot be sold.');
      return;
    }

    const amount = parseFloat(saleAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid sale amount');
      return;
    }

    if (selectedEmployees.length === 0) {
      Alert.alert('Error', 'Please select at least one staff member');
      return;
    }

    try {
      setSelling(true);
      
      const estimatedCost = calculateEstimation(itemFound);
      const profitLoss = amount - estimatedCost;
      const staffNames = selectedEmployees.join(', ');

      const { error: saleError } = await supabase
        .from('sales')
        .insert([{
          item_id: itemFound.id,
          sku: itemFound.sku,
          item_name: itemFound.name,
          prc_amount: estimatedCost,
          sale_amount: amount,
          profit_loss: profitLoss,
          sold_by: staffNames,
          sold_at: new Date().toISOString()
        }]);

      if (saleError) throw saleError;

      const newQty = Math.max(0, (itemFound.quantity || 1) - 1);
      const { error: itemError } = await supabase
        .from('items')
        .update({ quantity: newQty })
        .eq('id', itemFound.id);

      if (itemError) throw itemError;

      await supabase.from('transactions').insert([{
        item_id: itemFound.id,
        type: 'OUT',
        quantity_changed: 1,
        reason: `Sold for ₹${amount.toLocaleString()} by ${staffNames} (via Scan)`
      }]);

      Alert.alert('Success', `Item sold for ₹${amount.toLocaleString()} by ${staffNames}`);
      setShowSellModal(false);
      setSaleAmount('');
      setSelectedEmployees([]);
      setScanned(false);
      setItemFound(null);
      setSelling(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to record sale: ' + error.message);
      setSelling(false);
    }
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: any) => {
    if (scanned || loading) return;
    const cleanData = data.replace(/-/g, '').trim();
    searchSku(cleanData);
  };

  const searchSku = async (sku: string) => {
    setScanned(true);
    setScannedData(sku);
    setLoading(true);

    try {
      const tableName = 'items';
      const { data: item, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('sku', sku)
        .maybeSingle();

      if (error) throw error;

      if (item) {
        if (user) {
          const userName = user.full_name || user.id || 'Unknown';
          
          await supabase.from('items')
            .update({ 
              last_scanned_at: new Date().toISOString(),
              last_scanned_by: userName
            })
            .eq('id', item.id);
          
          await supabase.from('transactions').insert([{
            item_id: item.id,
            type: 'SCAN',
            quantity_changed: 0,
            reason: `Item scanned by ${userName}`
          }]);
          
          item.last_scanned_at = new Date().toISOString();
          item.last_scanned_by = userName;
        }
        setItemFound(item);
      } else {
        if (sku.length === 32 || sku.length === 36) {
          const { data: idItem, error: idError } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', sku)
            .maybeSingle();
          
          if (!idError && idItem) {
            if (user) {
              const userName = user.full_name || user.id || 'Unknown';
              
              await supabase.from('items')
                .update({ 
                  last_scanned_at: new Date().toISOString(),
                  last_scanned_by: userName
                })
                .eq('id', idItem.id);
              
              idItem.last_scanned_at = new Date().toISOString();
              idItem.last_scanned_by = userName;
            }
            setItemFound(idItem);
            return;
          }
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = () => {
    if (!manualSku.trim()) return;
    const cleanSku = manualSku.replace(/-/g, '').trim();
    searchSku(cleanSku);
    setManualSku('');
  };

  const adjustStock = async (amount: number) => {
    if (!itemFound) return;
    const newQty = Math.max(0, itemFound.quantity + amount);
    const type = amount > 0 ? 'IN' : 'OUT';

    try {
      setLoading(true);
      const userName = user?.full_name || user?.id || 'Unknown';

      const { error: updateError } = await supabase
        .from('items')
        .update({ 
          quantity: newQty,
          last_scanned_at: new Date().toISOString(),
          last_scanned_by: userName
        })
        .eq('id', itemFound.id);

      if (updateError) throw updateError;

      await supabase.from('transactions').insert([{
        item_id: itemFound.id,
        type: type,
        quantity_changed: Math.abs(amount),
        reason: `Scan update by ${userName} (${role})`
      }]);

      setItemFound({ 
        ...itemFound, 
        quantity: newQty,
        last_scanned_at: new Date().toISOString(),
        last_scanned_by: userName
      });
    } catch (error: any) {
      Alert.alert("Failed to update", error.message);
    } finally {
      setLoading(false);
    }
  };

  const onAddSuccess = () => {
    setScanned(false);
    setItemFound(null);
    setIsAddModalVisible(false);
    Alert.alert("Success", "Item updated successfully");
  };

  const onEditSuccess = () => {
    setIsEditModalVisible(false);
    if (scannedData) {
      searchSku(scannedData);
    }
    Alert.alert("Success", "Item updated successfully");
  };

  const renderCameraView = () => (
    <View style={styles.cameraContainer}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.scanText}>Align QR Code within the frame</Text>
        
        <View style={styles.manualEntryContainer}>
          <View style={styles.manualInputWrapper}>
            <Keyboard size={20} color="white" style={styles.manualIcon} />
            <TextInput
              style={styles.manualInput}
              placeholder="ENTER SKU MANUALLY"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={manualSku}
              onChangeText={(t) => setManualSku(t.toUpperCase())}
              autoCapitalize="characters"
              onSubmitEditing={handleManualSearch}
            />
            <TouchableOpacity 
              style={styles.manualBtn}
              onPress={handleManualSearch}
            >
              <Text style={styles.manualBtnText}>FIND</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderManualView = () => (
    <View style={[styles.center, { padding: 20 }]}>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Keyboard size={40} color={Theme.colors.primary} />
      </View>
      <Text style={[styles.headerTitle, { marginBottom: 10 }]}>Manual SKU Entry</Text>
      <Text style={[styles.vendorText, { textAlign: 'center', marginBottom: 30, fontSize: 14 }]}>Enter the product SKU or barcode number below</Text>
      
      <View style={[styles.manualInputWrapper, { backgroundColor: Theme.colors.surface, width: '100%', maxWidth: 400, borderColor: Theme.colors.border }]}>
        <TextInput
          style={[styles.manualInput, { color: Theme.colors.text.primary }]}
          placeholder="e.g. RING001"
          placeholderTextColor={Theme.colors.text.muted}
          value={manualSku}
          onChangeText={setManualSku}
          autoCapitalize="characters"
          autoFocus
          onSubmitEditing={handleManualSearch}
        />
        <TouchableOpacity 
          style={styles.manualBtn}
          onPress={handleManualSearch}
        >
          <Text style={styles.manualBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.retryBtn, { marginTop: 20, width: '100%', maxWidth: 400 }]}
        onPress={() => setShowManualInput(false)}
      >
        <Text style={styles.retryBtnText}>Back to Camera</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {!scanned ? (
        showManualInput ? renderManualView() : renderCameraView()
      ) : (
        <View style={styles.resultContainer}>
          {loading && !itemFound ? (
            <ActivityIndicator size="large" color="#6366f1" />
          ) : itemFound ? (
            <View style={styles.fullWidthCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.headerTitle}>Scanned Product</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => { setScanned(false); setItemFound(null); }}>
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.resultScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.itemTopSection}>
                  <View style={styles.imageSection}>
                    {itemFound.image_urls && itemFound.image_urls.length > 0 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.multiImageContainer}>
                        {itemFound.image_urls.map((url: string, index: number) => (
                          <View key={index} style={styles.imageWrapper}>
                            <OptimizedImage url={url} width={100} height={100} />
                          </View>
                        ))}
                      </ScrollView>
                    ) : itemFound.image_url ? (
                      <View style={styles.imageContainer}>
                        <OptimizedImage url={itemFound.image_url} width={100} height={100} />
                      </View>
                    ) : (
                      <View style={styles.imageContainer}>
                        <View style={styles.imagePlaceholder}>
                          <Package size={48} color="#cbd5e1" />
                        </View>
                      </View>
                    )}
                  </View>
                  <View style={styles.itemBasicInfo}>
                    <Text style={styles.itemName}>{itemFound.name}</Text>
                    <Text style={styles.itemSku}>{itemFound.sku || 'No SKU'}</Text>
                    {itemFound.supplier_name && (
                      <View style={styles.vendorBadge}>
                        <Text style={styles.vendorText}>{itemFound.supplier_name}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.detailGrid}>
                  <DetailBadge label="Net Weight" value={itemFound.net_wt ? `${itemFound.net_wt}g` : '0g'} icon={Scale} color="#6366f1" />
                  <DetailBadge label="Gross Weight" value={itemFound.gross_wt ? `${itemFound.gross_wt}g` : '0g'} icon={Scale} color="#8b5cf6" />
                  <DetailBadge label="Stone Wt" value={itemFound.clr_stone_wt ? `${itemFound.clr_stone_wt}g` : '0g'} icon={Scale} color="#10b981" />
                  <DetailBadge label="Wastage" value={itemFound.wastage ? `${itemFound.wastage}%` : '0%'} icon={Scale} color="#f59e0b" />
                  <DetailBadge label="Making" value={itemFound.labour_amt ? `₹${itemFound.labour_amt}` : '₹0'} icon={IndianRupee} color="#6366f1" />
                  <DetailBadge label="Purity" value={itemFound.purity} icon={Tag} color="#f59e0b" />
                  <DetailBadge label="HUID" value={itemFound.huid} icon={FileText} color="#ef4444" />
                  <DetailBadge label="Label No" value={itemFound.label_no} icon={Hash} color="#64748b" />
                  <DetailBadge label="Last Scanned By" value={itemFound.last_scanned_by} icon={User} color="#6366f1" />
                  <DetailBadge label="Last Scanned At" value={itemFound.last_scanned_at ? new Date(itemFound.last_scanned_at).toLocaleString() : null} icon={Clock} color="#64748b" />
                </View>

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Stones Detail</Text>
                  <View style={styles.sectionLine} />
                </View>
                <StoneDetailsList stonesJson={itemFound.stones_in_detail} />
                
                <View style={{ height: 150 }} />
              </ScrollView>

              <View style={styles.stickyControls}>
                <View style={styles.stockControl}>
                  <View style={{ flex: 1 }} />
                  <View style={styles.qtyDisplay}>
                    <Text style={styles.qtyValue}>{itemFound.quantity}</Text>
                    <Text style={styles.qtyLabel}>In Stock</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={[styles.estimateBtn, { backgroundColor: Theme.colors.status.success }]}
                    onPress={() => setShowSellModal(true)}
                    disabled={itemFound.quantity <= 0}
                  >
                    <ShoppingBag size={18} color="white" />
                    <Text style={styles.doneBtnText}>Sell</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.estimateBtn, { backgroundColor: '#1e293b' }]}
                    onPress={() => setIsAddModalVisible(true)}
                  >
                    <Edit3 size={18} color="white" />
                    <Text style={styles.doneBtnText}>Stones</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.estimateBtn, { backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.border }]}
                    onPress={() => setIsEditModalVisible(true)}
                  >
                    <Edit2 size={18} color={Theme.colors.primary} />
                    <Text style={[styles.doneBtnText, { color: Theme.colors.primary }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.estimateBtn}
                    onPress={() => onEstimation && onEstimation(itemFound)}
                  >
                    <Calculator size={18} color="white" />
                    <Text style={styles.doneBtnText}>Est</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.doneBtn}
                    onPress={() => { setScanned(false); setItemFound(null); }}
                  >
                    <Text style={styles.doneBtnText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.notFoundCard}>
              <X size={48} color="#ef4444" />
              <Text style={styles.notFoundTitle}>Not Found</Text>
              <Text style={styles.notFoundText}>
                No item found with SKU: {"\n"}
                <Text style={styles.scannedDataText}>{scannedData}</Text>
              </Text>
              
              <View style={styles.notFoundActions}>
                <TouchableOpacity 
                  style={styles.addBtn} 
                  onPress={() => setIsAddModalVisible(true)}
                >
                  <PlusCircle size={20} color="white" />
                  <Text style={styles.addBtnText}>Add as New Item</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.retryBtn} 
                  onPress={() => { setScanned(false); setScannedData(''); }}
                >
                  <Text style={styles.retryBtnText}>Scan Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      <StoneEntryModal
        isVisible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSave={onAddSuccess}
        initialSku={scannedData}
        initialData={itemFound}
      />

      <ItemFolderModal 
        isVisible={isEditModalVisible} 
        onClose={() => setIsEditModalVisible(false)} 
        onSave={onEditSuccess} 
        currentFolderId={itemFound?.category_id} 
        initialData={itemFound} 
      />

      {/* Sell Modal */}
      <Modal visible={showSellModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.sellModalContent}>
            <View style={styles.sellHeader}>
              <Text style={styles.headerTitle}>Confirm Sale</Text>
              <TouchableOpacity onPress={() => setShowSellModal(false)}><X size={24} color={Theme.colors.text.secondary} /></TouchableOpacity>
            </View>
            <View style={styles.sellBody}>
              <Text style={[styles.badgeLabel, { marginBottom: 12, fontSize: 14 }]} numberOfLines={1}>ITEM: {itemFound?.name}</Text>
              <Text style={[styles.badgeLabel, { fontSize: 12 }]}>ENTER SALE AMOUNT (₹)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: Theme.colors.surface, marginTop: 8, borderWidth: 2, borderColor: Theme.colors.primary }]}>
                <IndianRupee size={18} color={Theme.colors.primary} />
                <TextInput 
                  style={[styles.sellInput, { fontSize: 20, fontWeight: '800', color: Theme.colors.text.primary }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Theme.colors.text.muted}
                  value={saleAmount}
                  onChangeText={setSaleAmount}
                  autoFocus
                />
              </View>

              <Text style={[styles.badgeLabel, { marginTop: 15, marginBottom: 8, fontSize: 12 }]}>SELECT STAFF</Text>
              <View style={{ minHeight: 45 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {employees.length > 0 ? (
                    employees.map((emp) => (
                      <TouchableOpacity 
                        key={emp.name}
                        style={[
                          styles.staffSelectBtn, 
                          selectedEmployees.includes(emp.name) && styles.staffSelectBtnActive,
                          { paddingVertical: 6 }
                        ]}
                        onPress={() => toggleEmployee(emp.name)}
                      >
                        <User size={14} color={selectedEmployees.includes(emp.name) ? Theme.colors.background : Theme.colors.text.secondary} />
                        <Text style={[
                          styles.staffSelectText,
                          selectedEmployees.includes(emp.name) && styles.staffSelectTextActive,
                          { fontSize: 11 }
                        ]}>{emp.name}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={{ paddingVertical: 5 }}>
                      <Text style={{ color: Theme.colors.status.error, fontSize: 10, fontWeight: '700' }}>
                        ⚠️ No staff found.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: Theme.colors.primary, marginTop: 15, paddingVertical: 12 }, (selling || selectedEmployees.length === 0) && { opacity: 0.7 }]}
                onPress={handleSell}
                disabled={selling || selectedEmployees.length === 0}
              >
                {selling ? <ActivityIndicator color={Theme.colors.background} /> : <ShoppingBag size={18} color={Theme.colors.background} />}
                <Text style={[styles.saveButtonText, { fontSize: 14 }]}>Confirm Sale</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
