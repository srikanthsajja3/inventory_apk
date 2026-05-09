import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Image, ScrollView, Platform, TextInput, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Scan, X, Package, Plus, Minus, Info, PlusCircle, Scale, Tag, Hash, FileText, Keyboard, IndianRupee, Calculator, Edit3, User, Clock, ShoppingBag, Gem  } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { useRole } from '../hooks/useRole';
import { useJewelryCalc } from '../hooks/useJewelryCalc';
import StoneEntryModal from '../components/StoneEntryModal';

import { Theme } from '../theme';

const DetailBadge = ({ label, value, icon: Icon, color = Theme.colors.primary }: any) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.detailBadge}>
      <View style={[styles.badgeIcon, { backgroundColor: `${color}15` }]}>
        <Icon size={14} color={color} />
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

  return (
    <View style={styles.container}>
      {!scanned ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />
          <View style={styles.overlay}>
            <View style={styles.scanTarget} />
            <Text style={styles.hint}>Align QR Code within the frame</Text>
            
            <View style={styles.manualEntryContainer}>
              <View style={styles.manualInputWrapper}>
                <Keyboard size={20} color="#94a3b8" style={styles.manualIcon} />
                <TextInput
                  style={styles.manualInput}
                  placeholder="Manual SKU Entry"
                  placeholderTextColor="#94a3b8"
                  value={manualSku}
                  onChangeText={setManualSku}
                  autoCapitalize="characters"
                />
                <TouchableOpacity 
                  style={styles.manualBtn}
                  onPress={handleManualSearch}
                >
                  <Text style={styles.manualBtnText}>Find</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
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
                            <Image source={{ uri: url }} style={styles.itemImage} />
                          </View>
                        ))}
                      </ScrollView>
                    ) : itemFound.image_url ? (
                      <View style={styles.imageContainer}>
                        <Image source={{ uri: itemFound.image_url }} style={styles.itemImage} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  cameraContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  scanTarget: { width: 260, height: 260, borderWidth: 4, borderColor: Theme.colors.primary, borderRadius: 30, backgroundColor: 'transparent' },
  hint: { color: '#fff', marginTop: 30, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  manualEntryContainer: { width: '80%', marginTop: 40 },
  manualInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, borderRadius: 15, paddingHorizontal: 12, height: 54, borderWidth: 1, borderColor: Theme.colors.border },
  manualIcon: { marginRight: 10 },
  manualInput: { flex: 1, height: '100%', color: Theme.colors.text.primary, fontSize: 16, fontWeight: '600' },
  manualBtn: { backgroundColor: Theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  manualBtnText: { color: Theme.colors.background, fontWeight: '700', fontSize: 14 },
  message: { textAlign: 'center', marginBottom: 20, fontSize: 16, color: Theme.colors.text.secondary },
  button: { backgroundColor: Theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: Theme.colors.background, fontWeight: '700' },
  resultContainer: { flex: 1, backgroundColor: Theme.colors.background, justifyContent: 'flex-end' },
  fullWidthCard: { backgroundColor: Theme.colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%', width: '100%', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 5 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.text.primary },
  closeBtn: { padding: 8, backgroundColor: Theme.colors.background, borderRadius: 12 },
  resultScroll: { flex: 1, padding: 24 },
  itemTopSection: { flexDirection: 'row', gap: 20, marginBottom: 24 },
  imageSection: { width: 100, height: 100 },
  multiImageContainer: { width: 100, height: 100 },
  imageWrapper: { width: 100, height: 100, borderRadius: 20, backgroundColor: Theme.colors.background, overflow: 'hidden', borderWidth: 1, borderColor: Theme.colors.border, marginRight: 8 },
  imageContainer: { width: 100, height: 100, borderRadius: 20, backgroundColor: Theme.colors.background, overflow: 'hidden', borderWidth: 1, borderColor: Theme.colors.border },
  itemImage: { width: '100%', height: '100%' },
  imagePlaceholder: { width: 100, height: 100, backgroundColor: Theme.colors.background, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  itemBasicInfo: { flex: 1, justifyContent: 'center' },
  itemName: { fontSize: 20, fontWeight: '800', color: Theme.colors.text.primary },
  itemSku: { fontSize: 14, color: Theme.colors.text.secondary, marginTop: 4, fontWeight: '600' },
  vendorBadge: { backgroundColor: Theme.colors.background, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8 },
  vendorText: { fontSize: 11, fontWeight: '700', color: Theme.colors.text.secondary },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailBadge: { width: '48%', flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.background, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: Theme.colors.border, gap: 10 },
  badgeIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeLabel: { fontSize: 10, color: Theme.colors.text.secondary, fontWeight: '600' },
  badgeValue: { fontSize: 13, color: Theme.colors.text.primary, fontWeight: '800' },
  stickyControls: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, backgroundColor: Theme.colors.surface, borderTopWidth: 1, borderTopColor: Theme.colors.border },
  stockControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  qtyDisplay: { alignItems: 'center' },
  qtyValue: { fontSize: 32, fontWeight: '900', color: Theme.colors.text.primary },
  qtyLabel: { fontSize: 10, color: Theme.colors.text.secondary, fontWeight: '700', textTransform: 'uppercase' },
  actionRow: { flexDirection: 'row', gap: 12 },
  estimateBtn: { flex: 1, backgroundColor: Theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 10 },
  doneBtn: { flex: 1, backgroundColor: Theme.colors.muted, paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  notFoundCard: { backgroundColor: Theme.colors.surface, borderRadius: 32, padding: 30, margin: 20, alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  notFoundTitle: { fontSize: 24, fontWeight: '800', color: Theme.colors.text.primary, marginTop: 15 },
  notFoundText: { textAlign: 'center', color: Theme.colors.text.secondary, marginTop: 10, fontSize: 16, lineHeight: 24 },
  scannedDataText: { fontWeight: '700', color: Theme.colors.primary },
  notFoundActions: { width: '100%', marginTop: 30, gap: 12 },
  addBtn: { backgroundColor: Theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 18, gap: 10 },
  addBtnText: { color: Theme.colors.background, fontWeight: '800', fontSize: 16 },
  retryBtn: { paddingVertical: 16, borderRadius: 18, alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  retryBtnText: { color: Theme.colors.text.secondary, fontWeight: '700', fontSize: 16 },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 16, gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Theme.colors.text.secondary, textTransform: 'uppercase', letterSpacing: 1 },
  sectionLine: { flex: 1, height: 1, backgroundColor: Theme.colors.border },
  stoneListContainer: { gap: 8, marginTop: 0, marginBottom: 16 },
  stoneCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  stoneCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingBottom: 12,
  },
  stoneIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  stoneNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  stoneCategoryText: {
    fontSize: 10,
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
    fontSize: 9,
    color: Theme.colors.text.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  stoneGridValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  sellModalContent: { 
    backgroundColor: Theme.colors.background, 
    borderRadius: 32, 
    width: '100%',
    maxWidth: 340,
    aspectRatio: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    justifyContent: 'center'
  },
  sellHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12,
    borderBottomWidth: 1, 
    borderBottomColor: Theme.colors.border 
  },
  sellBody: { padding: 20, flex: 1, justifyContent: 'center' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.muted, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: Theme.colors.border },
  sellInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 16, color: Theme.colors.text.primary },
  staffSelectBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: Theme.colors.border, gap: 6 },
  staffSelectBtnActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  staffSelectText: { fontSize: 12, fontWeight: '700', color: Theme.colors.text.secondary },
  staffSelectTextActive: { color: Theme.colors.background },
  saveButton: { backgroundColor: Theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 8 },
  saveButtonText: { color: Theme.colors.background, fontSize: 16, fontWeight: '700' },
});
