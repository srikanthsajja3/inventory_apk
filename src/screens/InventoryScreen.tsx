import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, Image, Platform, BackHandler } from 'react-native';
import { Search, Plus, Package, RefreshCcw, QrCode, X, Folder, ChevronRight, ArrowLeft, Trash2, Move, Edit2, ImageIcon, CheckCircle2, Circle, ListFilter, CheckSquare, LayoutGrid, List, MapPin, Camera } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../../supabase';
import { useRole } from '../hooks/useRole';
import ItemFolderModal from '../components/ItemFolderModal';
import ItemDetailsModal from '../components/ItemDetailsModal';
import MoveModal from '../components/MoveModal';
import OptimizedImage from '../components/OptimizedImage';
import { Theme } from '../theme';
import { SCREEN_WIDTH } from '../utils/scaling';
import { useJewelryCalc } from '../hooks/useJewelryCalc';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  backBtn: {
    padding: 8,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  title: {
    fontSize: Theme.typography.size.xl,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  subtitle: {
    fontSize: Theme.typography.size.xs,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  activeSelectionBtn: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  addButton: {
    backgroundColor: Theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: Theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.sm,
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Theme.colors.border,
  },
  summaryLabel: {
    fontSize: 8,
    color: Theme.colors.text.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: Theme.typography.size.xs,
    fontWeight: '800',
    color: Theme.colors.text.primary,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    marginHorizontal: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterRow: {
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  locationContainer: {
    paddingHorizontal: Theme.spacing.md,
  },
  locationScroll: {
    flexDirection: 'row',
  },
  locBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: Theme.radius.sm,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 6,
  },
  activeLocBadge: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  locBadgeText: {
    fontSize: Theme.typography.size.xs,
    fontWeight: '600',
    color: Theme.colors.text.secondary,
  },
  activeLocBadgeText: {
    color: Theme.colors.background,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.md,
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  selectionText: {
    fontSize: Theme.typography.size.sm,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  selectionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  selectionActionText: {
    fontSize: Theme.typography.size.xs,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  selectionCancelBtn: {
    paddingVertical: 4,
    paddingHorizontal: Theme.spacing.xs,
  },
  selectionCancelText: {
    fontSize: Theme.typography.size.xs,
    fontWeight: '600',
    color: Theme.colors.text.secondary,
  },
  input: {
    flex: 1,
    fontSize: Theme.typography.size.md,
    color: Theme.colors.text.primary,
    paddingVertical: 8,
  },
  list: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: 40,
    gap: Theme.spacing.sm,
  },
  columnWrapper: {
    gap: Theme.spacing.sm,
  },
  folderCard: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  folderCardGrid: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.sm,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  selectedCard: {
    borderColor: Theme.colors.primary,
    borderWidth: 2,
    backgroundColor: Theme.colors.muted,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
  },
  folderIcon: {
    width: 44,
    height: 44,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderIconGrid: {
    width: 40,
    height: 40,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.xs,
  },
  folderName: {
    fontSize: Theme.typography.size.sm,
    fontWeight: '700',
    color: Theme.colors.text.primary,
  },
  folderSubtext: {
    fontSize: Theme.typography.size.xs,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  itemCardGrid: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.sm,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  itemIcon: {
    width: 44,
    height: 44,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemIconGrid: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: Theme.spacing.xs,
  },
  itemThumb: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  infoGrid: {
    width: '100%',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaDivider: {
    marginHorizontal: 4,
    color: Theme.colors.text.muted,
    fontSize: Theme.typography.size.xs,
  },
  itemPurity: {
    fontSize: Theme.typography.size.xs,
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  itemName: {
    fontSize: Theme.typography.size.sm,
    fontWeight: '700',
    color: Theme.colors.text.primary,
  },
  itemSku: {
    fontSize: Theme.typography.size.xs,
    color: Theme.colors.text.secondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: 6,
    backgroundColor: Theme.colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: `${Theme.colors.status.error}22`,
    borderRadius: 6,
  },
  qrBtn: {
    padding: 6,
    backgroundColor: Theme.colors.background,
    borderRadius: 6,
  },
  qtyBadge: {
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  qtyBadgeGrid: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    zIndex: 5,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  qtyText: {
    fontSize: Theme.typography.size.sm,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: Theme.colors.text.secondary,
    marginTop: 10,
    fontSize: Theme.typography.size.md,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    width: '85%',
    maxWidth: 340,
  },
  closeBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  qrTitle: {
    fontSize: Theme.typography.size.lg,
    fontWeight: '800',
    marginBottom: Theme.spacing.md,
    color: Theme.colors.text.primary,
  },
  qrContainer: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: Theme.radius.sm,
  },
  qrHint: {
    marginTop: Theme.spacing.md,
    color: Theme.colors.text.secondary,
    fontSize: Theme.typography.size.xs,
  }
});

const FolderCard = ({ item, onNavigate, onMove, onDelete, onEdit, selectionMode, isSelected, onSelect, viewMode, role }: any) => (
  <TouchableOpacity 
    style={[
      viewMode === 'grid' ? styles.folderCardGrid : styles.folderCard, 
      isSelected && styles.selectedCard
    ]} 
    onPress={() => selectionMode ? onSelect(item) : onNavigate(item)}
  >
    {selectionMode && (
      <View style={styles.selectionIndicator}>
        {isSelected ? <CheckCircle2 size={20} color={Theme.colors.primary} fill={Theme.colors.surface} /> : <Circle size={20} color={Theme.colors.text.secondary} />}
      </View>
    )}
    <View style={viewMode === 'grid' ? styles.folderIconGrid : styles.folderIcon}>
      {item.isVirtual ? (
        <QrCode size={viewMode === 'grid' ? 32 : 24} color={Theme.colors.primary} />
      ) : (
        <Folder size={viewMode === 'grid' ? 32 : 24} color={Theme.colors.primary} fill={Theme.colors.surface} />
      )}
    </View>
    <View style={viewMode === 'grid' ? styles.infoGrid : styles.info}>
      <Text style={styles.folderName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.folderSubtext}>Folder</Text>
    </View>
    {!selectionMode && viewMode === 'list' && (
      <View style={styles.rightSection}>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)}>
            <Edit2 size={14} color={Theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onMove(item, 'folder')}>
            <Move size={14} color={Theme.colors.text.secondary} />
          </TouchableOpacity>
          {role === 'admin' && (
            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id, item.name, 'folder')}>
              <Trash2 size={14} color={Theme.colors.status.error} />
            </TouchableOpacity>
          )}
        </View>
        <ChevronRight size={16} color={Theme.colors.text.secondary} />
      </View>
    )}
  </TouchableOpacity>
);

const ItemCard = ({ item, onShowQR, onMove, onDelete, onEdit, onPress, selectionMode, isSelected, onSelect, viewMode, onMoveBack, isExhibitionFolder, role }: any) => (
  <TouchableOpacity 
    style={[
      viewMode === 'grid' ? styles.itemCardGrid : styles.itemCard, 
      isSelected && styles.selectedCard
    ]} 
    onPress={() => selectionMode ? onSelect(item) : onPress(item)}
  >
    {selectionMode && (
      <View style={styles.selectionIndicator}>
        {isSelected ? <CheckCircle2 size={20} color={Theme.colors.primary} fill={Theme.colors.surface} /> : <Circle size={20} color={Theme.colors.text.secondary} />}
      </View>
    )}
    <View style={viewMode === 'grid' ? styles.itemIconGrid : styles.itemIcon}>
      {item.image_url ? (
        <OptimizedImage url={item.image_url} width={viewMode === 'grid' ? 120 : 44} height={viewMode === 'grid' ? 120 : 44} />
      ) : (
        <Package size={viewMode === 'grid' ? 24 : 20} color={Theme.colors.text.secondary} />
      )}
    </View>
    <View style={viewMode === 'grid' ? styles.infoGrid : styles.info}>
      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
      {viewMode === 'list' ? (
        <View style={styles.itemMeta}>
          <Text style={styles.itemSku}>{item.sku || 'No SKU'}</Text>
          {item.purity && <Text style={styles.metaDivider}>•</Text>}
          {item.purity && <Text style={styles.itemPurity}>{item.purity}</Text>}
        </View>
      ) : (
        <Text style={item.sku ? styles.itemSku : {display: 'none'}} numberOfLines={1}>{item.sku}</Text>
      )}
    </View>
    
    {viewMode === 'grid' ? (
      <View style={styles.qtyBadgeGrid}>
        <Text style={styles.qtyText}>{item.quantity}</Text>
      </View>
    ) : (
      <View style={styles.rightSection}>
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyText}>{item.quantity}</Text>
        </View>

        {!selectionMode && (
          <View style={styles.controls}>
            {isExhibitionFolder && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Theme.colors.surface }]}
                onPress={() => onMoveBack(item)}
              >
                <ArrowLeft size={14} color={Theme.colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)}>
              <Edit2 size={14} color={Theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onMove(item, 'item')}>
              <Move size={14} color={Theme.colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.qrBtn} onPress={() => onShowQR(item)}>
              <QrCode size={14} color={Theme.colors.primary} />
            </TouchableOpacity>
            {role === 'admin' && (
              <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id, item.name, 'item')}>
                <Trash2 size={14} color={Theme.colors.status.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    )}
  </TouchableOpacity>
);

export default function InventoryScreen({ onEstimation }: { onEstimation: (item: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentFolder, setCurrentFolder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [itemsToMove, setItemsToMove] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [skuInput, setSkuInput] = useState('');
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [masterRates, setMasterRates] = useState<any>({});

  const [cameraActive, setCameraActive] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const { role } = useRole();
  const { calculateEstimation } = useJewelryCalc();

  const EXHIBITION_FOLDER = { 
    id: 'virtual-exhibition', 
    name: 'Exhibition', 
    isVirtual: true,
    created_at: new Date().toISOString(),
    parent_id: null as string | null
  };

  const handleBarcodeScanned = ({ data }: any) => {
    if (data) {
      setCameraActive(false);
      addToExhibition(data);
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchMasterRates();
  }, []);

  const fetchMasterRates = async () => {
    try {
      const { data, error } = await supabase.from('master_rates').select('*');
      if (error) throw error;
      if (data) {
        const rateMap: any = {};
        data.forEach(r => { rateMap[r.key] = r.value; });
        setMasterRates(rateMap);
      }
    } catch (error) {
      console.error('Error fetching master rates:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('location')
        .not('location', 'is', null);

      if (error) throw error;

      const uniqueLocations = Array.from(new Set(data.map(i => i.location).filter(Boolean) as string[])).sort();
      setLocations(['All Locations', ...uniqueLocations]);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handlePopState = (event: PopStateEvent) => {
        if (event.state && event.state.type === 'folder') {
          setCurrentFolder(event.state.folder || null);
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (selectionMode) {
        toggleSelectionMode();
        return true;
      }
      if (currentFolder) {
        navigateBack();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [currentFolder, selectionMode]);

  useEffect(() => {
    fetchContents();
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, [currentFolder]);

  const toggleSelectionMode = () => {
    if (selectionMode) setSelectedIds(new Set());
    setSelectionMode(!selectionMode);
  };

  const toggleSelect = (item: any) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(item.id)) newSelected.delete(item.id);
    else newSelected.add(item.id);
    setSelectedIds(newSelected);
    if (newSelected.size === 0) setSelectionMode(false);
  };

  const getSelectedItems = () => [...folders, ...items].filter(i => selectedIds.has(i.id));

  const calculateStats = () => {
    if (!items || items.length === 0) return { folders: folders.length, items: 0, totalQty: 0, totalValue: 0 };
    const totalItems = items.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0);
    const totalValue = items.reduce((acc, item) => {
      const qty = parseFloat(String(item.quantity)) || 0;
      if (qty <= 0) return acc;
      const itemTotal = calculateEstimation(item, masterRates);
      return acc + (itemTotal * qty);
    }, 0);
    return { folders: folders.length, items: items.length, totalQty: totalItems, totalValue: totalValue };
  };

  const stats = calculateStats();

  const fetchContents = async () => {
    try {
      setLoading(true);
      const parentId = currentFolder ? currentFolder.id : null;
      const { data: settings } = await supabase.from('master_rates').select('*');
      const timerHours = settings?.find(s => s.key === 'exhibition_timer_hours')?.value || 24;
      const timerMs = timerHours * 60 * 60 * 1000;

      if (currentFolder?.id === 'virtual-exhibition') {
        const { data: exItems, error: exError } = await supabase.from('items').select('*').eq('in_exhibition', true);
        if (exError) throw exError;
        const now = Date.now();
        const activeItems: any[] = [];
        const expiredIds: string[] = [];
        (exItems || []).forEach(item => {
          const addedAt = item.exhibition_added_at ? new Date(item.exhibition_added_at).getTime() : 0;
          if (now - addedAt < timerMs) activeItems.push(item);
          else expiredIds.push(item.id);
        });
        if (expiredIds.length > 0) await supabase.from('items').update({ in_exhibition: false, exhibition_added_at: null }).in('id', expiredIds);
        setFolders([]);
        setItems(activeItems);
        setLoading(false);
        return;
      }

      let catQuery = supabase.from('categories').select('*');
      if (parentId) catQuery = catQuery.eq('parent_id', parentId);
      else catQuery = catQuery.is('parent_id', null);
      const { data: catData, error: catError } = await catQuery.order('name');
      if (catError) throw catError;
      const combinedFolders = catData || [];
      if (!parentId) combinedFolders.unshift(EXHIBITION_FOLDER);
      setFolders(combinedFolders);

      let query = supabase.from('items').select('*');
      if (parentId) query = query.eq('category_id', parentId);
      else query = query.is('category_id', null);
      const { data: itemData, error: itemError } = await query.order('name');
      if (itemError) throw itemError;
      const now = Date.now();
      const filteredItems = (itemData || []).filter(item => {
        if (item.in_exhibition) {
          const addedAt = item.exhibition_added_at ? new Date(item.exhibition_added_at).getTime() : 0;
          return now - addedAt >= timerMs;
        }
        return true;
      });
      setItems(filteredItems);
    } catch (error: any) { console.error('Fetch Error:', error.message); } finally { setLoading(false); }
  };

  const addToExhibition = async (sku: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('items').update({ in_exhibition: true, exhibition_added_at: new Date().toISOString() }).eq('sku', sku.trim().toUpperCase()).select();
      if (error) throw error;
      if (data && data.length > 0) {
        Alert.alert('Success', `Item "${data[0].name}" added to Exhibition.`);
        fetchContents();
        setSkuInput('');
        setIsScanning(false);
      } else Alert.alert('Not Found', 'No item found with this SKU.');
    } catch (error: any) { Alert.alert('Error', error.message); } finally { setLoading(false); }
  };

  const moveBackFromExhibition = async (item: any) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('items').update({ in_exhibition: false, exhibition_added_at: null }).eq('id', item.id);
      if (error) throw error;
      Alert.alert('Success', `Item "${item.name}" moved back to its original folder.`);
      fetchContents();
    } catch (error: any) { Alert.alert('Error', error.message); } finally { setLoading(false); }
  };

  const navigateToFolder = (folder: any) => {
    setHistory([...history, currentFolder]);
    setCurrentFolder(folder);
    if (Platform.OS === 'web') window.history.pushState({ type: 'folder', folderId: folder.id, folder }, '');
  };

  const navigateBack = () => {
    const newHistory = [...history];
    const prevFolder = newHistory.pop();
    setHistory(newHistory);
    setCurrentFolder(prevFolder || null);
  };

  const showQR = (item: any) => { setSelectedItem(item); setQrModalVisible(true); };
  const showDetails = (item: any) => { setSelectedItem(item); setIsDetailsVisible(true); };
  const openMoveModal = (item: any, type: 'item' | 'folder') => { setItemsToMove([{ id: item.id, name: item.name, type }]); setMoveModalVisible(true); };
  const openEditModal = (item: any) => { setEditingItem(item); setIsModalVisible(true); };
  const openAddModal = () => { setEditingItem(null); setIsModalVisible(true); };

  const handleDelete = (id: string, name: string, type: 'item' | 'folder') => {
    const message = `Are you sure you want to delete "${name}"? ${type === 'folder' ? 'This will delete all contents!' : ''}`;
    const performDelete = async () => {
      try {
        const table = type === 'folder' ? 'categories' : 'items';
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        fetchContents();
      } catch (error: any) { Alert.alert('Error', error.message); }
    };
    if (Platform.OS === 'web') { if (window.confirm(message)) performDelete(); }
    else Alert.alert('Delete Confirmation', message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: performDelete }]);
  };

  const handleBulkDelete = () => {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) return;
    const folderCount = selectedItems.filter(i => i.sku === undefined && i.barcode === undefined).length;
    let message = `Are you sure you want to delete ${selectedItems.length} selected items?`;
    if (folderCount > 0) message += `\n\nWarning: ${folderCount} folders are selected. Deleting a folder will delete all of its contents!`;
    const performBulkDelete = async () => {
      try {
        setLoading(true);
        const folderIds = selectedItems.filter(i => i.sku === undefined && i.barcode === undefined).map(i => i.id);
        const itemIds = selectedItems.filter(i => i.sku !== undefined || i.barcode !== undefined).map(i => i.id);
        if (itemIds.length > 0) await supabase.from('items').delete().in('id', itemIds);
        if (folderIds.length > 0) await supabase.from('categories').delete().in('id', folderIds);
        toggleSelectionMode();
        fetchContents();
      } catch (error: any) { Alert.alert('Bulk Delete Error', error.message); } finally { setLoading(false); }
    };
    if (Platform.OS === 'web') { if (window.confirm(message)) performBulkDelete(); }
    else Alert.alert('Bulk Delete Confirmation', message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete All', style: 'destructive', onPress: performBulkDelete }]);
  };

  const filteredItemsList = items.filter(item => {
    const matchesSearch = search === '' || item.name?.toLowerCase().includes(search.toLowerCase()) || item.sku?.toLowerCase().includes(search.toLowerCase()) || item.label_no?.toLowerCase().includes(search.toLowerCase());
    const matchesLocation = selectedLocation === 'All Locations' || item.location === selectedLocation;
    return matchesSearch && matchesLocation;
  });

  const displayData = search ? [...folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase())), ...filteredItemsList] : [...folders, ...filteredItemsList];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          {currentFolder && <TouchableOpacity onPress={navigateBack} style={styles.backBtn}><ArrowLeft size={24} color={Theme.colors.text.primary} /></TouchableOpacity>}
          <View><Text style={styles.title}>{currentFolder ? currentFolder.name : 'Home'}</Text><Text style={styles.subtitle}>{folders.length} Folders • {items.length} Items</Text></View>
        </View>
        <View style={styles.headerActions}>
          {currentFolder?.id === 'virtual-exhibition' && <TouchableOpacity onPress={() => setIsScanning(true)} style={[styles.refreshButton, { backgroundColor: Theme.colors.primary }]}><QrCode size={20} color={Theme.colors.text.black} /></TouchableOpacity>}
          <TouchableOpacity onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} style={styles.refreshButton}>{viewMode === 'grid' ? <List size={20} color="white" /> : <LayoutGrid size={20} color="white" />}</TouchableOpacity>
          <TouchableOpacity onPress={toggleSelectionMode} style={[styles.refreshButton, selectionMode && styles.activeSelectionBtn]}><CheckSquare size={20} color={selectionMode ? Theme.colors.text.black : "white"} /></TouchableOpacity>
          <TouchableOpacity onPress={fetchContents} style={styles.refreshButton}><RefreshCcw size={20} color="white" /></TouchableOpacity>
          {role === 'admin' && <TouchableOpacity style={styles.addButton} onPress={openAddModal}><Plus size={24} color={Theme.colors.text.black} /></TouchableOpacity>}
        </View>
      </View>

      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Folders</Text><Text style={styles.summaryValue}>{stats.folders}</Text></View>
        <View style={styles.summaryDivider} /><View style={styles.summaryItem}><Text style={styles.summaryLabel}>Items</Text><Text style={styles.summaryValue}>{stats.items}</Text></View>
        <View style={styles.summaryDivider} /><View style={styles.summaryItem}><Text style={styles.summaryLabel}>Total Quantity</Text><Text style={styles.summaryValue}>{stats.totalQty} units</Text></View>
        <View style={styles.summaryDivider} /><View style={styles.summaryItem}><Text style={styles.summaryLabel}>Total Value</Text><Text style={styles.summaryValue}>₹{stats.totalValue.toLocaleString()}</Text></View>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.searchBar}><Search size={20} color={Theme.colors.text.secondary} /><TextInput style={styles.input} placeholder="Search by name, SKU, or Label..." value={search} onChangeText={setSearch} placeholderTextColor={Theme.colors.text.muted} /></View>
        <View style={styles.locationContainer}><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationScroll}>{locations.map((loc) => (<TouchableOpacity key={loc} onPress={() => setSelectedLocation(loc)} style={[styles.locBadge, selectedLocation === loc && styles.activeLocBadge]}><MapPin size={12} color={selectedLocation === loc ? Theme.colors.text.black : Theme.colors.text.secondary} /><Text style={[styles.locBadgeText, selectedLocation === loc && styles.activeLocBadgeText]}>{loc}</Text></TouchableOpacity>))}</ScrollView></View>
      </View>

      {selectionMode && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>{selectedIds.size} selected</Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity style={styles.selectionActionBtn} onPress={() => { const moveItems = getSelectedItems().map(i => ({ id: i.id, name: i.name, type: (i.sku !== undefined || i.barcode !== undefined) ? 'item' : 'folder' })); setItemsToMove(moveItems as any); setMoveModalVisible(true); }}><Move size={18} color={Theme.colors.primary} /><Text style={styles.selectionActionText}>Move</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.selectionActionBtn, { backgroundColor: Theme.colors.status.error + '20' }]} onPress={handleBulkDelete}><Trash2 size={18} color={Theme.colors.status.error} /><Text style={[styles.selectionActionText, { color: Theme.colors.status.error }]}>Delete</Text></TouchableOpacity>
            <TouchableOpacity style={styles.selectionCancelBtn} onPress={toggleSelectionMode}><Text style={styles.selectionCancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>
      ) : (
        <FlatList 
          key={viewMode}
          numColumns={viewMode === 'grid' ? (SCREEN_WIDTH > 1000 ? 6 : SCREEN_WIDTH > 600 ? 4 : 3) : 1}
          columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : null}
          data={displayData}
          extraData={[selectedIds, selectionMode, viewMode]}
          renderItem={({ item }) => {
            const isFolder = (item.sku === undefined && item.barcode === undefined);
            const isSelected = selectedIds.has(item.id);
            return isFolder ? (
              <FolderCard item={item} onNavigate={navigateToFolder} onMove={openMoveModal} onDelete={handleDelete} onEdit={openEditModal} selectionMode={selectionMode} isSelected={isSelected} onSelect={toggleSelect} viewMode={viewMode} role={role} />
            ) : (
              <ItemCard item={item} onShowQR={showQR} onMove={openMoveModal} onDelete={handleDelete} onEdit={openEditModal} onPress={showDetails} selectionMode={selectionMode} isSelected={isSelected} onSelect={toggleSelect} viewMode={viewMode} onMoveBack={moveBackFromExhibition} isExhibitionFolder={currentFolder?.id === 'virtual-exhibition'} role={role} />
            );
          }}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<View style={styles.emptyContainer}><Folder size={48} color="#e2e8f0" /><Text style={styles.emptyText}>This folder is empty</Text></View>}
        />
      )}

      <Modal visible={qrModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.qrCard}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setQrModalVisible(false)}><X size={24} color="#64748b" /></TouchableOpacity>
            <Text style={styles.qrTitle}>{selectedItem?.name}</Text>
            <View style={styles.qrContainer}>{selectedItem && <QRCode value={selectedItem.sku || selectedItem.id} size={200} />}</View>
            <Text style={styles.qrHint}>Scan to update stock</Text>
          </View>
        </View>
      </Modal>

      <ItemFolderModal isVisible={isModalVisible} onClose={() => setIsModalVisible(false)} onSave={fetchContents} currentFolderId={currentFolder ? currentFolder.id : null} initialData={editingItem} />
      <ItemDetailsModal isVisible={isDetailsVisible} onClose={() => setIsDetailsVisible(false)} item={selectedItem} onEdit={openEditModal} onEstimate={(item) => { setIsDetailsVisible(false); onEstimation(item); }} />
      <MoveModal isVisible={moveModalVisible} onClose={() => setMoveModalVisible(false)} onMove={fetchContents} itemsToMove={itemsToMove} />

      <Modal visible={isScanning} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.qrCard, { width: '90%', maxWidth: 400 }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => { setIsScanning(false); setCameraActive(false); }}><X size={24} color="#64748b" /></TouchableOpacity>
            <QrCode size={40} color="#6366f1" style={{ marginBottom: 15 }} /><Text style={styles.qrTitle}>Add to Exhibition</Text>
            {cameraActive ? (
              <View style={{ width: '100%', height: 300, borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>
                <CameraView style={{ flex: 1 }} onBarcodeScanned={handleBarcodeScanned} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} />
                <TouchableOpacity style={{ position: 'absolute', bottom: 15, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }} onPress={() => setCameraActive(false)}><Text style={{ color: 'white', fontWeight: '700' }}>Type Manually</Text></TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.qrHint, { textAlign: 'center', marginBottom: 20 }]}>Enter SKU or use camera to scan QR code</Text>
                <TextInput style={[styles.input, { width: '100%', backgroundColor: '#f1f5f9', padding: 15, borderRadius: 12, marginBottom: 15, maxHeight: 50 }]} placeholder="ENTER SKU (e.g. RING001)" value={skuInput} onChangeText={setSkuInput} autoCapitalize="characters" autoFocus />
                <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginBottom: 10 }}>
                  <TouchableOpacity style={[styles.addButton, { flex: 2, height: 50, borderRadius: 12 }]} onPress={() => addToExhibition(skuInput)}><Text style={{ color: 'white', fontWeight: '800' }}>ADD</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.addButton, { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#1e293b' }]} onPress={async () => { if (!permission?.granted) { const { granted } = await requestPermission(); if (!granted) { Alert.alert("Permission Denied", "Camera permission is required to scan QR codes."); return; } } setCameraActive(true); }}><Camera size={20} color="white" /></TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
