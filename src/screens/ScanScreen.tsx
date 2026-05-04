import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Image, ScrollView, Platform, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Scan, X, Package, Plus, Minus, Info, PlusCircle, Scale, Tag, Hash, FileText, Keyboard, IndianRupee, Calculator, Edit3, User, Clock  } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { useRole } from '../hooks/useRole';
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

export default function ScanScreen({ onEstimation }: { onEstimation?: (item: any) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [itemFound, setItemFound] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [manualSku, setManualSku] = useState('');
  const { role, user } = useRole();

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
                  <DetailBadge label="Wastage" value={itemFound.wastage ? `${itemFound.wastage}g` : '0g'} icon={Scale} color="#f59e0b" />
                  <DetailBadge label="Making" value={itemFound.labour_amt ? `₹${itemFound.labour_amt}` : '₹0'} icon={IndianRupee} color="#6366f1" />
                  <DetailBadge label="Purity" value={itemFound.purity} icon={Tag} color="#f59e0b" />
                  <DetailBadge label="HUID" value={itemFound.huid} icon={FileText} color="#ef4444" />
                  <DetailBadge label="Label No" value={itemFound.label_no} icon={Hash} color="#64748b" />
                  <DetailBadge label="Stones Detail" value={itemFound.stones_in_detail} icon={Info} color="#8b5cf6" />
                  <DetailBadge label="Last Scanned By" value={itemFound.last_scanned_by} icon={User} color="#6366f1" />
                  <DetailBadge label="Last Scanned At" value={itemFound.last_scanned_at ? new Date(itemFound.last_scanned_at).toLocaleString() : null} icon={Clock} color="#64748b" />
                </View>
                
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
                    <Text style={styles.doneBtnText}>Estimate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.doneBtn}
                    onPress={() => { setScanned(false); setItemFound(null); }}
                  >
                    <Text style={styles.doneBtnText}>Done</Text>
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
});
