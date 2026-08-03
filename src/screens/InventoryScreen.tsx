import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView, Image, Platform, BackHandler, useWindowDimensions } from 'react-native';
import { Search, Plus, Package, RefreshCcw, QrCode, X, Folder, ChevronRight, ArrowLeft, Trash2, Move, Edit2, ImageIcon, CheckCircle2, Circle, ListFilter, CheckSquare, LayoutGrid, List, MapPin, Camera, MoreVertical } from 'lucide-react-native';
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
import { deleteImagesInBulk } from '../utils/images';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 4,
    backgroundColor: Theme.colors.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 9,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    padding: 6,
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
    width: 32,
    height: 32,
    borderRadius: Theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    paddingVertical: 4,
    paddingHorizontal: Theme.spacing.sm,
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  summaryDivider: {
    width: 1,
    height: '70%',
    backgroundColor: Theme.colors.border,
    alignSelf: 'center',
  },
  summaryLabel: {
    fontSize: 7,
    color: Theme.colors.text.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.text.primary,
    marginTop: 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 2,
    marginHorizontal: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterRow: {
    gap: 6,
    marginBottom: Theme.spacing.sm,
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
    paddingVertical: 4,
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
    fontSize: Theme.typography.size.sm,
    color: Theme.colors.text.primary,
    paddingVertical: 6,
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
    padding: 0,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  itemIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemIconGrid: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    padding: Theme.spacing.sm,
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
  },
  optionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  optionsContent: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.radius.xl,
    borderTopRightRadius: Theme.radius.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Theme.spacing.lg,
  },
  optionsHeader: {
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    alignItems: 'center',
  },
  optionsHeaderTitle: {
    fontSize: Theme.typography.size.md,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  optionsList: {
    padding: Theme.spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    gap: 12,
  },
  optionText: {
    fontSize: Theme.typography.size.md,
    fontWeight: '600',
    color: Theme.colors.text.primary,
  },
  deleteOption: {
    color: Theme.colors.status.error,
  },
  searchGroupContainer: {
    marginBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  searchGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    paddingBottom: Theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    gap: 8,
  },
  searchGroupTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  searchGroupItems: {
    gap: Theme.spacing.sm,
  },
  viewMoreBtn: {
    marginTop: Theme.spacing.md,
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  viewMoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

const FolderCard = React.memo(({ item, onNavigate, onShowOptions, selectionMode, isSelected, onSelect, viewMode, role }: any) => (
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
        <TouchableOpacity style={styles.actionBtn} onPress={() => onShowOptions(item, 'folder')}>
          <MoreVertical size={18} color={Theme.colors.text.secondary} />
        </TouchableOpacity>
        <ChevronRight size={16} color={Theme.colors.text.secondary} />
      </View>
    )}
  </TouchableOpacity>
), (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id &&
         prevProps.isSelected === nextProps.isSelected &&
         prevProps.selectionMode === nextProps.selectionMode &&
         prevProps.viewMode === nextProps.viewMode;
});

const ItemCard = React.memo(({ item, onShowOptions, onPress, selectionMode, isSelected, onSelect, viewMode, role, shouldLoad }: any) => (
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
      {(item.image_url || item.thumbnail_url) ? (
        <OptimizedImage 
          url={item.image_url || item.thumbnail_url} 
          width={viewMode === 'grid' ? 120 : 44} 
          height={viewMode === 'grid' ? 120 : 44} 
          shouldLoad={shouldLoad}
          resizeMode={viewMode === 'grid' ? 'cover' : 'contain'}
        />
      ) : (
        <Package size={viewMode === 'grid' ? 24 : 20} color={Theme.colors.text.secondary} />
      )}
    </View>
    <View style={viewMode === 'grid' ? styles.infoGrid : styles.info}>
      <Text style={styles.itemName} numberOfLines={1}>
        G: {item.gross_wt || 0}g | N: {item.net_wt || 0}g
      </Text>
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
    
    {viewMode !== 'grid' && !selectionMode && (
      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onShowOptions(item, 'item')}>
          <MoreVertical size={18} color={Theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>
    )}
  </TouchableOpacity>
), (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id &&
         prevProps.item.thumbnail_url === nextProps.item.thumbnail_url &&
         prevProps.item.image_url === nextProps.item.image_url &&
         prevProps.item.quantity === nextProps.item.quantity &&
         prevProps.isSelected === nextProps.isSelected &&
         prevProps.selectionMode === nextProps.selectionMode &&
         prevProps.viewMode === nextProps.viewMode &&
         prevProps.shouldLoad === nextProps.shouldLoad;
});

const EXHIBITION_FOLDER = { 
  id: 'virtual-exhibition', 
  name: 'Exhibition', 
  isVirtual: true,
  created_at: new Date(0).toISOString(), // Stable date
  parent_id: null as string | null
};

export default function InventoryScreen({ onEstimation }: { onEstimation: (item: any) => void }) {
  const { width: windowWidth } = useWindowDimensions();
  const containerWidth = windowWidth;

  const [items, setItems] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [statsItems, setStatsItems] = useState<any[]>([]);
  const [itemsPage, setItemsPage] = useState(0);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 30;
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentFolder, setCurrentFolder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const activeIdsRef = React.useRef(new Set<string>());
  const isScrolling = React.useRef(false);
  const viewableIds = React.useRef(new Set<string>());
  const lastProcessedIds = React.useRef<string>('');
  const scrollTimer = React.useRef<any>(null);
  const sequentialTimer = React.useRef<any>(null);
  const isFetching = React.useRef(false);

  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 0,
    minimumViewTime: 0,
  }).current;

  const MAX_RETAINED_IMAGES = 60;

  const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
    if (!viewableItems || viewableItems.length === 0) return;
    const visibleIds = viewableItems.map((vi: any) => vi.item?.id).filter(Boolean);
    const updated = new Set(activeIdsRef.current);
    visibleIds.forEach((id: string) => updated.add(id));

    if (updated.size > MAX_RETAINED_IMAGES) {
      const visibleSet = new Set(visibleIds);
      const activeArray = Array.from(updated);
      const toRemoveCount = updated.size - MAX_RETAINED_IMAGES;
      let removed = 0;
      for (const id of activeArray) {
        if (!visibleSet.has(id)) {
          updated.delete(id);
          removed++;
          if (removed >= toRemoveCount) break;
        }
      }
    }

    activeIdsRef.current = updated;
    setActiveIds(updated);
  }).current;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [activeItemForOptions, setActiveItemForOptions] = useState<{item: any, type: 'item' | 'folder'} | null>(null);
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

  const gridItemWidth = React.useMemo(() => {
    const columns = containerWidth > 1800 ? 12 : containerWidth > 1400 ? 10 : containerWidth > 1000 ? 8 : containerWidth > 700 ? 6 : containerWidth > 500 ? 4 : 3;
    const totalSpacing = Theme.spacing.md * 2 + (columns - 1) * Theme.spacing.sm;
    return (containerWidth - totalSpacing) / columns;
  }, [containerWidth]);

  const handleBarcodeScanned = React.useCallback(({ data }: any) => {
    if (data) {
      setCameraActive(false);
      addToExhibition(data);
    }
  }, []);

  const fetchAllCategories = React.useCallback(async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      setAllCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const getCategoryPath = React.useCallback((categoryId: string | null): string => {
    if (!categoryId) return 'Root';
    const path: string[] = [];
    let currentId: string | null = categoryId;
    
    while (currentId) {
      const cat = allCategories.find(c => c.id === currentId);
      if (cat) {
        path.unshift(cat.name);
        currentId = cat.parent_id;
      } else {
        currentId = null;
      }
    }
    
    return path.join(' > ');
  }, [allCategories]);

  const performGlobalSearch = React.useCallback(async (query: string) => {
    if (!query.trim()) {
      setGlobalSearchResults([]);
      return;
    }

    try {
      setIsSearchingGlobal(true);
      const isNumeric = !isNaN(parseFloat(query)) && isFinite(Number(query));
      const searchTerm = query.trim();

      let supabaseQuery = supabase
        .from('items')
        .select('*')
        .gt('quantity', 0);

      if (isNumeric) {
        const weight = parseFloat(searchTerm);
        let upperBound = weight + 1;
        if (searchTerm.includes('.')) {
          const decimalStr = searchTerm.split('.')[1];
          if (decimalStr.length > 0) {
            upperBound = weight + Math.pow(10, -decimalStr.length);
          }
        }
        supabaseQuery = supabaseQuery.gte('gross_wt', weight).lt('gross_wt', upperBound);
      } else {
        supabaseQuery = supabaseQuery.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,label_no.ilike.%${searchTerm}%`);
      }

      const { data, error } = await supabaseQuery.limit(50);
      
      if (error) throw error;

      // Group results by category path
      const grouped: Record<string, any[]> = {};
      (data || []).forEach(item => {
        const path = getCategoryPath(item.category_id);
        if (!grouped[path]) grouped[path] = [];
        grouped[path].push(item);
      });

      const resultList = Object.keys(grouped).map(path => ({
        path,
        items: grouped[path]
      }));

      setGlobalSearchResults(resultList);
    } catch (error) {
      console.error('Global Search Error:', error);
    } finally {
      setIsSearchingGlobal(false);
    }
  }, [getCategoryPath]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) performGlobalSearch(search);
      else setGlobalSearchResults([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, performGlobalSearch]);

  const fetchMasterRates = React.useCallback(async () => {
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
  }, []);

  const fetchLocations = React.useCallback(async () => {
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
  }, []);

  const fetchContents = React.useCallback(async () => {
    if (isFetching.current) return;
    try {
      isFetching.current = true;
      setLoading(true);
      setItemsPage(0);
      setHasMoreItems(true);
      const parentId = currentFolder ? currentFolder.id : null;
      const isVirtual = parentId === 'virtual-exhibition';
      
      const [settingsRes, catRes] = await Promise.all([
        supabase.from('master_rates').select('*'),
        isVirtual
          ? Promise.resolve({ data: [] as any[], error: null })
          : parentId 
            ? supabase.from('categories').select('*').eq('parent_id', parentId).order('name')
            : supabase.from('categories').select('*').is('parent_id', null).order('name')
      ]);

      if (catRes.error) throw catRes.error;

      const timerHours = settingsRes.data?.find(s => s.key === 'exhibition_timer_hours')?.value || 24;
      const timerMs = timerHours * 60 * 60 * 1000;
      const now = Date.now();

      if (currentFolder?.id === 'virtual-exhibition') {
        let exStatsQuery = supabase.from('items').select('name, gross_wt, net_wt, dai_wt, clr_stone_wt, clr_stone_pcs, wastage, labour_amt, labour_rate, other_charges, stones_in_detail, in_exhibition, exhibition_added_at, id').eq('in_exhibition', true);
        let exItemsQuery = supabase.from('items').select('*').eq('in_exhibition', true);

        if (selectedLocation !== 'All Locations') {
          exStatsQuery = exStatsQuery.eq('location', selectedLocation);
          exItemsQuery = exItemsQuery.eq('location', selectedLocation);
        }

        const [statsRes, itemsRes] = await Promise.all([
          exStatsQuery,
          exItemsQuery.order('name', { ascending: true }).range(0, PAGE_SIZE - 1)
        ]);

        if (statsRes.error) throw statsRes.error;
        if (itemsRes.error) throw itemsRes.error;

        const activeStatsItems: any[] = [];
        const expiredIds: string[] = [];
        (statsRes.data || []).forEach(item => {
          const addedAt = item.exhibition_added_at ? new Date(item.exhibition_added_at).getTime() : 0;
          if (now - addedAt < timerMs) activeStatsItems.push(item);
          else expiredIds.push(item.id);
        });

        if (expiredIds.length > 0) {
          await supabase.from('items').update({ in_exhibition: false, exhibition_added_at: null }).in('id', expiredIds);
        }

        const activeItems = (itemsRes.data || []).filter(item => {
          const addedAt = item.exhibition_added_at ? new Date(item.exhibition_added_at).getTime() : 0;
          return now - addedAt < timerMs;
        });

        setFolders([]);
        setStatsItems(activeStatsItems);
        setItems(activeItems);
        setHasMoreItems((itemsRes.data || []).length === PAGE_SIZE);
        return;
      }

      const combinedFolders: any[] = [...(catRes.data || [])];
      if (!parentId) combinedFolders.unshift(EXHIBITION_FOLDER);
      setFolders(combinedFolders);

      // Fetch all items (minimal columns) in normal folder for stats computation
      let statsQuery = parentId
        ? supabase.from('items').select('name, gross_wt, net_wt, dai_wt, clr_stone_wt, clr_stone_pcs, wastage, labour_amt, labour_rate, other_charges, stones_in_detail, in_exhibition, exhibition_added_at, id')
            .eq('category_id', parentId).gt('quantity', 0)
        : supabase.from('items').select('name, gross_wt, net_wt, dai_wt, clr_stone_wt, clr_stone_pcs, wastage, labour_amt, labour_rate, other_charges, stones_in_detail, in_exhibition, exhibition_added_at, id')
            .is('category_id', null).gt('quantity', 0);

      // Fetch first page of items (all columns) in normal folder for rendering
      let itemsQuery = parentId
        ? supabase.from('items').select('*').eq('category_id', parentId).gt('quantity', 0)
        : supabase.from('items').select('*').is('category_id', null).gt('quantity', 0);

      if (selectedLocation !== 'All Locations') {
        statsQuery = statsQuery.eq('location', selectedLocation);
        itemsQuery = itemsQuery.eq('location', selectedLocation);
      }

      const [statsRes, itemsRes] = await Promise.all([
        statsQuery,
        itemsQuery.order('name', { ascending: true }).range(0, PAGE_SIZE - 1)
      ]);

      if (statsRes.error) throw statsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      // Filter stats items
      const filteredStatsItems = (statsRes.data || []).filter(item => {
        if (item.in_exhibition) {
          const addedAt = item.exhibition_added_at ? new Date(item.exhibition_added_at).getTime() : 0;
          return now - addedAt >= timerMs;
        }
        return true;
      });

      // Filter page items
      const filteredPageItems = (itemsRes.data || []).filter(item => {
        if (item.in_exhibition) {
          const addedAt = item.exhibition_added_at ? new Date(item.exhibition_added_at).getTime() : 0;
          return now - addedAt >= timerMs;
        }
        return true;
      });

      setStatsItems(filteredStatsItems);
      setItems(filteredPageItems);
      setHasMoreItems((itemsRes.data || []).length === PAGE_SIZE);
    } catch (error: any) { 
      console.error('Fetch Error:', error.message || error); 
    } finally { 
      setLoading(false); 
      isFetching.current = false;
    }
  }, [currentFolder, selectedLocation]);

  const fetchMoreItems = React.useCallback(async () => {
    if (loading || loadingMore || !hasMoreItems) return;

    try {
      setLoadingMore(true);
      const nextPage = itemsPage + 1;
      const parentId = currentFolder ? currentFolder.id : null;
      const from = nextPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Fetch settings for exhibition timer
      const { data: settingsRes } = await supabase.from('master_rates').select('*');
      const timerHours = settingsRes?.find(s => s.key === 'exhibition_timer_hours')?.value || 24;
      const timerMs = timerHours * 60 * 60 * 1000;
      const now = Date.now();

      let itemsData: any[] = [];
      let error: any = null;

      if (currentFolder?.id === 'virtual-exhibition') {
        let exItemsQuery = supabase.from('items').select('*').eq('in_exhibition', true);
        if (selectedLocation !== 'All Locations') {
          exItemsQuery = exItemsQuery.eq('location', selectedLocation);
        }
        const res = await exItemsQuery
          .order('name', { ascending: true })
          .range(from, to);
        itemsData = res.data || [];
        error = res.error;
      } else {
        let itemsQuery = parentId
          ? supabase.from('items').select('*').eq('category_id', parentId).gt('quantity', 0)
          : supabase.from('items').select('*').is('category_id', null).gt('quantity', 0);

        if (selectedLocation !== 'All Locations') {
          itemsQuery = itemsQuery.eq('location', selectedLocation);
        }

        const res = await itemsQuery
          .order('name', { ascending: true })
          .range(from, to);
        itemsData = res.data || [];
        error = res.error;
      }

      if (error) throw error;

      let processedItems = itemsData;
      if (currentFolder?.id === 'virtual-exhibition') {
        const activeItems: any[] = [];
        const expiredIds: string[] = [];
        itemsData.forEach(item => {
          const addedAt = item.exhibition_added_at ? new Date(item.exhibition_added_at).getTime() : 0;
          if (now - addedAt < timerMs) activeItems.push(item);
          else expiredIds.push(item.id);
        });
        if (expiredIds.length > 0) {
          await supabase.from('items').update({ in_exhibition: false, exhibition_added_at: null }).in('id', expiredIds);
        }
        processedItems = activeItems;
      } else {
        processedItems = itemsData.filter(item => {
          if (item.in_exhibition) {
            const addedAt = item.exhibition_added_at ? new Date(item.exhibition_added_at).getTime() : 0;
            return now - addedAt >= timerMs;
          }
          return true;
        });
      }

      if (processedItems.length > 0) {
        setItems(prev => [...prev, ...processedItems]);
        setItemsPage(nextPage);
      }
      setHasMoreItems(itemsData.length === PAGE_SIZE);
    } catch (error: any) {
      console.error('Fetch More Error:', error.message);
    } finally {
      setLoadingMore(false);
    }
  }, [currentFolder, selectedLocation, itemsPage, loading, loadingMore, hasMoreItems]);

  useEffect(() => {
    fetchLocations();
    fetchMasterRates();
    fetchAllCategories();
    
    if (Platform.OS === 'web') {
      const params = new URLSearchParams(window.location.search);
      const folderId = params.get('folderId');
      if (folderId) {
        if (folderId === 'virtual-exhibition') {
          setCurrentFolder(EXHIBITION_FOLDER);
        } else {
          const fetchFolder = async () => {
            const { data } = await supabase.from('categories').select('*').eq('id', folderId).single();
            if (data) setCurrentFolder(data);
          };
          fetchFolder();
        }
      }
    }
  }, [fetchLocations, fetchMasterRates, fetchAllCategories]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handlePopState = (event: PopStateEvent) => {
        if (event.state && event.state.type === 'folder') {
          setCurrentFolder(event.state.folder || null);
        } else if (!event.state) {
           const params = new URLSearchParams(window.location.search);
           if (!params.get('folderId')) setCurrentFolder(null);
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  const navigateBack = React.useCallback(() => {
    const newHistory = [...history];
    const prevFolder = newHistory.pop();
    setHistory(newHistory);
    setCurrentFolder(prevFolder || null);
    
    if (Platform.OS === 'web' && window.history.state?.type === 'folder') {
        window.history.back();
    }
  }, [history]);

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
  }, [currentFolder, selectionMode, navigateBack]);

  useEffect(() => {
    fetchContents();
    setSelectionMode(false);
    setSelectedIds(new Set());
    setActiveIds(new Set());
    activeIdsRef.current = new Set();
    lastProcessedIds.current = '';
    
    if (Platform.OS === 'web') {
      const url = new URL(window.location.href);
      if (currentFolder) {
        url.searchParams.set('folderId', currentFolder.id);
      } else {
        url.searchParams.delete('folderId');
      }
      if (window.location.search !== url.search) {
        window.history.replaceState(window.history.state, '', url.search);
      }
    }
  }, [currentFolder, fetchContents]);

  const toggleSelectionMode = React.useCallback(() => {
    if (selectionMode) setSelectedIds(new Set());
    setSelectionMode(prev => !prev);
  }, [selectionMode]);

  const toggleSelect = React.useCallback((item: any) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }, []);

  const getSelectedItems = () => [...folders, ...items].filter(i => selectedIds.has(i.id));

  const stats = React.useMemo(() => {
    if (!statsItems || statsItems.length === 0) return { folders: folders.length, items: 0, totalValue: 0 };
    const totalValue = statsItems.reduce((acc, item) => {
      return acc + calculateEstimation(item, masterRates);
    }, 0);
    return { folders: folders.length, items: statsItems.length, totalValue: totalValue };
  }, [statsItems, folders.length, masterRates, calculateEstimation]);

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

  const navigateToFolder = React.useCallback((folder: any) => {
    setHistory(prev => [...prev, currentFolder]);
    setCurrentFolder(folder);
    if (Platform.OS === 'web') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'inventory');
      url.searchParams.set('folderId', folder.id);
      window.history.pushState({ type: 'folder', folderId: folder.id, folder, tab: 'inventory' }, '', url.search);
    }
  }, [currentFolder]);

  const showQR = React.useCallback((item: any) => { setSelectedItem(item); setQrModalVisible(true); }, []);
  const showDetails = React.useCallback((item: any) => { setSelectedItem(item); setIsDetailsVisible(true); }, []);
  const openMoveModal = React.useCallback((item: any, type: 'item' | 'folder') => { setItemsToMove([{ id: item.id, name: item.name, type }]); setMoveModalVisible(true); }, []);
  const openEditModal = React.useCallback((item: any) => { setEditingItem(item); setIsModalVisible(true); }, []);
  const openAddModal = React.useCallback(() => { setEditingItem(null); setIsModalVisible(true); }, []);

  const handleShowOptions = React.useCallback((item: any, type: 'item' | 'folder') => {
    setActiveItemForOptions({ item, type });
    setOptionsModalVisible(true);
  }, []);

  const handleDelete = (id: string, name: string, type: 'item' | 'folder') => {
    const message = `Are you sure you want to delete "${name}"? ${type === 'folder' ? 'This will delete all contents!' : ''}`;
    const performDelete = async () => {
      try {
        // Collect image details before deleting from DB
        const itemToDelete = items.find(i => i.id === id);
        let imageList: string[] = [];
        let thumbList: string[] = [];
        if (type === 'item' && itemToDelete) {
          imageList = itemToDelete.image_urls || (itemToDelete.image_url ? [itemToDelete.image_url] : []);
          thumbList = itemToDelete.thumbnail_urls || (itemToDelete.thumbnail_url ? [itemToDelete.thumbnail_url] : []);
        }

        const table = type === 'folder' ? 'categories' : 'items';
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;

        // Clean up from storage
        if (imageList.length > 0) deleteImagesInBulk(imageList, 'item-images').catch(err => console.error(err));
        if (thumbList.length > 0) deleteImagesInBulk(thumbList, 'item-thumbnails').catch(err => console.error(err));

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
        
        // Collect images for all deleted items
        const itemsToDelete = selectedItems.filter(i => i.sku !== undefined || i.barcode !== undefined);
        const allImages: string[] = [];
        const allThumbs: string[] = [];
        itemsToDelete.forEach(item => {
          const imageList = item.image_urls || (item.image_url ? [item.image_url] : []);
          const thumbList = item.thumbnail_urls || (item.thumbnail_url ? [item.thumbnail_url] : []);
          allImages.push(...imageList);
          allThumbs.push(...thumbList);
        });

        if (itemIds.length > 0) await supabase.from('items').delete().in('id', itemIds);
        if (folderIds.length > 0) await supabase.from('categories').delete().in('id', folderIds);

        // Clean up from storage
        if (allImages.length > 0) deleteImagesInBulk(allImages, 'item-images').catch(err => console.error(err));
        if (allThumbs.length > 0) deleteImagesInBulk(allThumbs, 'item-thumbnails').catch(err => console.error(err));

        toggleSelectionMode();
        fetchContents();
      } catch (error: any) { Alert.alert('Bulk Delete Error', error.message); } finally { setLoading(false); }
    };
    if (Platform.OS === 'web') { if (window.confirm(message)) performBulkDelete(); }
    else Alert.alert('Bulk Delete Confirmation', message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete All', style: 'destructive', onPress: performBulkDelete }]);
  };

  const filteredItemsList = React.useMemo(() => {
    return items.filter(item => {
      const matchesSearch = search === '' || item.name?.toLowerCase().includes(search.toLowerCase()) || item.sku?.toLowerCase().includes(search.toLowerCase()) || item.label_no?.toLowerCase().includes(search.toLowerCase());
      const matchesLocation = selectedLocation === 'All Locations' || item.location === selectedLocation;
      return matchesSearch && matchesLocation;
    });
  }, [items, search, selectedLocation]);

  const numColumns = viewMode === 'grid' ? (containerWidth > 1800 ? 12 : containerWidth > 1400 ? 10 : containerWidth > 1000 ? 8 : containerWidth > 700 ? 6 : containerWidth > 500 ? 4 : 3) : 1;

  const selectedIdsRef = React.useRef(selectedIds);
  const selectionModeRef = React.useRef(selectionMode);
  const viewModeRef = React.useRef(viewMode);
  const roleRef = React.useRef(role);

  React.useEffect(() => {
    selectedIdsRef.current = selectedIds;
    selectionModeRef.current = selectionMode;
    viewModeRef.current = viewMode;
    roleRef.current = role;
  }, [selectedIds, selectionMode, viewMode, role]);

  const renderItem = React.useCallback(({ item }: any) => {
    if (!item) return null;
    const isFolder = (item.sku === undefined && item.barcode === undefined);
    const isSelected = selectedIdsRef.current.has(item.id);
    return isFolder ? (
      <FolderCard 
        item={item} 
        onNavigate={navigateToFolder} 
        onShowOptions={handleShowOptions} 
        selectionMode={selectionModeRef.current} 
        isSelected={isSelected} 
        onSelect={toggleSelect} 
        viewMode={viewModeRef.current} 
        role={roleRef.current} 
      />
    ) : (
      <ItemCard 
        item={item} 
        onShowOptions={handleShowOptions} 
        onPress={showDetails} 
        selectionMode={selectionModeRef.current} 
        isSelected={isSelected} 
        onSelect={toggleSelect} 
        viewMode={viewModeRef.current} 
        role={roleRef.current} 
        shouldLoad={activeIds.has(item.id)}
      />
    );
  }, [navigateToFolder, handleShowOptions, toggleSelect, showDetails]);

  const combinedData = React.useMemo(() => [...folders, ...filteredItemsList], [folders, filteredItemsList]);

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
          {role !== 'cashier' && <TouchableOpacity style={styles.addButton} onPress={openAddModal}><Plus size={24} color={Theme.colors.text.black} /></TouchableOpacity>}
        </View>
      </View>

      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Folders</Text><Text style={styles.summaryValue}>{stats.folders}</Text></View>
        <View style={styles.summaryDivider} /><View style={styles.summaryItem}><Text style={styles.summaryLabel}>Items</Text><Text style={styles.summaryValue}>{stats.items}</Text></View>
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

      {loading || (search && isSearchingGlobal) ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>
      ) : search ? (
        <ScrollView 
          contentContainerStyle={styles.list} 
          showsVerticalScrollIndicator={false}
        >
          {globalSearchResults.length > 0 ? (
            globalSearchResults.map((group, idx) => {
              const isExpanded = expandedPaths.has(group.path);
              const displayItems = isExpanded ? group.items : group.items.slice(0, 3);
              
              return (
                <View key={group.path + idx} style={styles.searchGroupContainer}>
                  <View style={styles.searchGroupHeader}>
                    <Folder size={14} color={Theme.colors.primary} fill={Theme.colors.surface} />
                    <Text style={styles.searchGroupTitle}>{group.path}</Text>
                  </View>
                  <View style={[styles.searchGroupItems, viewMode === 'grid' && { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm }]}>
                    {displayItems.map((item: any) => (
                      <View key={item.id} style={viewMode === 'grid' ? { width: gridItemWidth } : undefined}>
                        <ItemCard 
                          item={item} 
                          onShowOptions={handleShowOptions} 
                          onPress={showDetails} 
                          selectionMode={selectionMode} 
                          isSelected={selectedIds.has(item.id)} 
                          onSelect={toggleSelect} 
                          viewMode={viewMode} 
                          role={role} 
                          shouldLoad={true} // Global search is small enough to load immediately
                        />
                      </View>
                    ))}
                  </View>
                  
                  {group.items.length > 3 && !isExpanded && (
                    <TouchableOpacity 
                      style={styles.viewMoreBtn} 
                      onPress={() => {
                        setExpandedPaths(prev => {
                          const next = new Set(prev);
                          next.add(group.path);
                          return next;
                        });
                      }}
                    >
                      <Text style={styles.viewMoreText}>View {group.items.length - 3} More items</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Search size={48} color="#e2e8f0" />
              <Text style={styles.emptyText}>No matching items found</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList 
          key={`${viewMode}-${numColumns}`}
          numColumns={numColumns}
          columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
          data={combinedData}
          extraData={[selectedIds, selectionMode, viewMode, activeIds]}
          initialNumToRender={6}
          maxToRenderPerBatch={20}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?.id?.toString() || `item-${index}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<View style={styles.emptyContainer}><Folder size={48} color="#e2e8f0" /><Text style={styles.emptyText}>This folder is empty</Text></View>}
          onEndReached={fetchMoreItems}
          onEndReachedThreshold={0.4}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: Theme.spacing.md, alignItems: 'center' }}>
                <ActivityIndicator color={Theme.colors.primary} />
              </View>
            ) : null
          }
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

      <Modal visible={optionsModalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.optionsModalOverlay} activeOpacity={1} onPress={() => setOptionsModalVisible(false)}>
          <View style={styles.optionsContent}>
            <View style={styles.optionsHeader}>
              <Text style={styles.optionsHeaderTitle}>{activeItemForOptions?.item?.name}</Text>
            </View>
            <View style={styles.optionsList}>
              {activeItemForOptions?.type === 'item' && currentFolder?.id === 'virtual-exhibition' && (
                <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsModalVisible(false); moveBackFromExhibition(activeItemForOptions.item); }}>
                  <ArrowLeft size={20} color={Theme.colors.primary} />
                  <Text style={styles.optionText}>Move Back to Original</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsModalVisible(false); openEditModal(activeItemForOptions?.item); }}>
                <Edit2 size={20} color={Theme.colors.primary} />
                <Text style={styles.optionText}>Edit Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsModalVisible(false); openMoveModal(activeItemForOptions?.item, activeItemForOptions?.type as any); }}>
                <Move size={20} color={Theme.colors.text.secondary} />
                <Text style={styles.optionText}>Move to Folder</Text>
              </TouchableOpacity>
              {activeItemForOptions?.type === 'item' && (
                <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsModalVisible(false); showQR(activeItemForOptions.item); }}>
                  <QrCode size={20} color={Theme.colors.primary} />
                  <Text style={styles.optionText}>Show QR Code</Text>
                </TouchableOpacity>
              )}
              {role === 'admin' && (
                <TouchableOpacity style={styles.optionItem} onPress={() => { setOptionsModalVisible(false); handleDelete(activeItemForOptions?.item.id, activeItemForOptions?.item.name, activeItemForOptions?.type as any); }}>
                  <Trash2 size={20} color={Theme.colors.status.error} />
                  <Text style={[styles.optionText, styles.deleteOption]}>Delete Permanently</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
