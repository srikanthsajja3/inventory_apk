import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  X,
  FolderPlus,
  Layers,
  MapPin,
  Truck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FolderTree,
} from 'lucide-react-native';
import { supabase } from '../../supabase';
import { Theme } from '../theme';

interface AutoOrganizeModalProps {
  isVisible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type OrganizeMode = 'category' | 'location' | 'supplier';

export default function AutoOrganizeModal({
  isVisible,
  onClose,
  onComplete,
}: AutoOrganizeModalProps) {
  const [organizeMode, setOrganizeMode] = useState<OrganizeMode>('category');
  const [onlyUnassigned, setOnlyUnassigned] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState('');

  const getCategoryNameFromItem = (name: string, sku: string): string => {
    const text = (name || '').toUpperCase().trim();
    const skuUpper = (sku || '').toUpperCase().trim();

    if (text.startsWith('D TOPS') || skuUpper.startsWith('DTPS')) return 'Diamond Tops';
    if (text.startsWith('D RING') || skuUpper.startsWith('DRG')) return 'Diamond Rings';
    if (text.startsWith('D NEKLACE') || text.startsWith('D NECKLACE') || skuUpper.startsWith('DNK')) return 'Diamond Necklaces';
    if (text.startsWith('D BANAGLES') || text.startsWith('D BANGLES') || skuUpper.startsWith('DBG')) return 'Diamond Bangles';
    if (text.startsWith('D PENDANT') || skuUpper.startsWith('DPNT')) return 'Diamond Pendants';
    if (text.startsWith('D BLACK') || text.startsWith('D BB') || skuUpper.startsWith('DBB')) return 'Diamond Blackbeads';
    if (text.startsWith('D BRACELETE') || text.startsWith('D BRACELET') || skuUpper.startsWith('DBR')) return 'Diamond Bracelets';
    if (text.startsWith('D JUMKI') || skuUpper.startsWith('DJK')) return 'Diamond Jhumkas';
    if (text.startsWith('D HANGINGS') || text.startsWith('D HANGING') || skuUpper.startsWith('DHG')) return 'Diamond Hangings';
    if (text.startsWith('D VADDANAM') || skuUpper.startsWith('DVD')) return 'Diamond Vaddanam';
    if (text.startsWith('DIAMOND HARAM') || skuUpper.startsWith('DHR')) return 'Diamond Haarams';
    if (text.startsWith('D CHAIN') || skuUpper.startsWith('DCH')) return 'Diamond Chains';
    if (text.startsWith('D CHOUKER') || text.startsWith('D CHOKER') || skuUpper.startsWith('DCK')) return 'Diamond Chokers';
    if (text.startsWith('D KANTE')) return 'Diamond Kantes';
    if (text.startsWith('D BUTTALU')) return 'Diamond Buttalu';

    if (text.startsWith('G CHAIN') || skuUpper.startsWith('GCH')) return 'Gold Chains';
    if (text.startsWith('G HAARAM') || skuUpper.startsWith('GHR')) return 'Gold Haarams';
    if (text.startsWith('G NECKLACE') || skuUpper.startsWith('GNL')) return 'Gold Necklaces';
    if (text.startsWith('G PENDANT') || skuUpper.startsWith('GPD') || skuUpper.startsWith('GPN')) return 'Gold Pendants';
    if (text.startsWith('G JUMKA') || text.startsWith('G JUMKI') || skuUpper.startsWith('GJM')) return 'Gold Jhumkas';
    if (text.startsWith('G KADA') || text.startsWith('G K') || skuUpper.startsWith('GKD')) return 'Gold Kadas';
    if (text.startsWith('G BALI') || skuUpper.startsWith('GBL')) return 'Gold Balis';
    if (text.startsWith('G BANGLE') || skuUpper.startsWith('GBP')) return 'Gold Bangles';
    if (text.startsWith('G HANGING') || skuUpper.startsWith('GHG') || skuUpper.startsWith('GHKA')) return 'Gold Hangings';
    if (text.startsWith('G POLKI') || skuUpper.startsWith('GPK') || text.startsWith('PLK')) return 'Gold Polki Sets';
    if (text.startsWith('G TOPS') || text.startsWith('GTP') || skuUpper.startsWith('GTP')) return 'Gold Tops';
    if (text.startsWith('G MALA')) return 'Gold Malas';
    if (text.startsWith('G TIKKA')) return 'Gold Tikkas';
    if (text.startsWith('G BRACELETE') || text.startsWith('G BRACELET')) return 'Gold Bracelets';
    if (text.startsWith('G CHOKER')) return 'Gold Chokers';
    if (text.startsWith('G RING')) return 'Gold Rings';
    if (text.startsWith('G VADDANAM')) return 'Gold Vaddanam';

    if (text.includes('KUNDAN') || text.startsWith('GK')) return 'Kundan Jewelry';
    if (text.includes('BLACK') || text.startsWith('BBC')) return 'Blackbeads & Chains';

    const words = text.split(' ').filter(Boolean);
    if (words.length >= 2) {
      return `${words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase()} ${words[1].charAt(0).toUpperCase() + words[1].slice(1).toLowerCase()}`;
    }
    return words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase() : 'General Jewelry';
  };

  const handleAutoOrganize = async () => {
    try {
      setLoading(true);
      setProgressText('Fetching items from database...');

      // 1. Fetch items
      let query = supabase.from('items').select('id, name, sku, category_id, location, supplier_name');
      if (onlyUnassigned) {
        query = query.is('category_id', null);
      }

      const { data: fetchItems, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      if (!fetchItems || fetchItems.length === 0) {
        Alert.alert('No Items Found', 'There are no matching items to organize.');
        setLoading(false);
        return;
      }

      setProgressText(`Processing ${fetchItems.length} items...`);

      // 2. Fetch ALL existing categories (both root and sub-categories)
      const { data: existingCategories, error: catErr } = await supabase
        .from('categories')
        .select('*');
      if (catErr) throw catErr;

      const categoryMap = new Map<string, string>(); // Upper Name -> Category ID
      (existingCategories || []).forEach(c => {
        categoryMap.set(c.name.trim().toUpperCase(), c.id);
      });

      // Helper to map item to existing category ID or target name
      const mapItemToTargetFolder = (item: any): { folderId: string | null; folderName: string } => {
        const text = (item.name || '').toUpperCase().trim();
        const skuUpper = (item.sku || '').toUpperCase().trim();

        // 1. Diamonds (Matches existing database category IDs)
        if (text.startsWith('D TOPS') || skuUpper.startsWith('DTPS')) {
          const id = categoryMap.get('TOPS');
          if (id) return { folderId: id, folderName: 'TOPS' };
        }
        if (text.startsWith('D RING') || skuUpper.startsWith('DRG')) {
          const id = categoryMap.get('RING');
          if (id) return { folderId: id, folderName: 'RING' };
        }
        if (text.startsWith('D NEKLACE') || text.startsWith('D NECKLACE') || skuUpper.startsWith('DNK')) {
          const id = categoryMap.get('SHORT');
          if (id) return { folderId: id, folderName: 'SHORT' };
        }
        if (text.startsWith('D BANAGLES') || text.startsWith('D BANGLES') || skuUpper.startsWith('DBG')) {
          const id = categoryMap.get('BANGLES');
          if (id) return { folderId: id, folderName: 'BANGLES' };
        }
        if (text.startsWith('D PENDANT') || skuUpper.startsWith('DPNT')) {
          const id = categoryMap.get('PENDANT');
          if (id) return { folderId: id, folderName: 'PENDANT' };
        }
        if (text.startsWith('D BRACELETE') || text.startsWith('D BRACELET') || skuUpper.startsWith('DBR')) {
          const id = categoryMap.get('BRACLET');
          if (id) return { folderId: id, folderName: 'BRACLET' };
        }
        if (text.startsWith('D VADDANAM') || skuUpper.startsWith('DVD')) {
          const id = categoryMap.get("VADDANAM'S");
          if (id) return { folderId: id, folderName: "VADDANAM'S" };
        }
        if (text.startsWith('DIAMOND HARAM') || text.startsWith('D HARAM') || skuUpper.startsWith('DHR')) {
          const id = categoryMap.get('LONG');
          if (id) return { folderId: id, folderName: 'LONG' };
        }
        if (text.startsWith('D JUMKI') || text.startsWith('D HANGINGS') || skuUpper.startsWith('DJK') || skuUpper.startsWith('DHJ')) {
          const id = categoryMap.get('TOPS');
          if (id) return { folderId: id, folderName: 'TOPS' };
        }

        // 2. Gold (Matches unique GOLD uppercase category names)
        if (text.startsWith('G CHAIN') || skuUpper.startsWith('GCH')) {
          const id = categoryMap.get('G SHORT') || categoryMap.get('G N SHORT') || categoryMap.get('SHORT') || categoryMap.get('G CHAINS');
          if (id) return { folderId: id, folderName: 'G SHORT' };
        }
        if (text.startsWith('G HAARAM') || skuUpper.startsWith('GHR')) {
          const id = categoryMap.get('G LONG') || categoryMap.get('G N LONG') || categoryMap.get('LONG');
          if (id) return { folderId: id, folderName: 'G LONG' };
        }
        if (text.startsWith('G NECKLACE') || skuUpper.startsWith('GNL') || skuUpper.startsWith('GPN')) {
          const id = categoryMap.get('G SHORT') || categoryMap.get('G N SHORT') || categoryMap.get('G NEKLACE') || categoryMap.get('SHORT');
          if (id) return { folderId: id, folderName: 'G SHORT' };
        }
        if (text.startsWith('G PENDANT') || skuUpper.startsWith('GPD')) {
          const id = categoryMap.get('G PENDANT') || categoryMap.get('PENDANT');
          if (id) return { folderId: id, folderName: 'G PENDANT' };
        }
        if (text.startsWith('G JUMKA') || text.startsWith('G JUMKI') || skuUpper.startsWith('GJM')) {
          const id = categoryMap.get('G JHUMKI') || categoryMap.get('G JUMKI') || categoryMap.get('JHUMKI');
          if (id) return { folderId: id, folderName: 'G JHUMKI' };
        }
        if (text.startsWith('G KADA') || text.startsWith('G K ') || skuUpper.startsWith('GKD') || skuUpper.startsWith('GKB') || skuUpper.startsWith('GKC')) {
          const id = categoryMap.get('G KADA') || categoryMap.get('KADA');
          if (id) return { folderId: id, folderName: 'G KADA' };
        }
        if (text.startsWith('G BALI') || skuUpper.startsWith('GBL')) {
          const id = categoryMap.get("G BALI'S") || categoryMap.get("BALI'S");
          if (id) return { folderId: id, folderName: "G BALI'S" };
        }
        if (text.startsWith('G BANGLE') || skuUpper.startsWith('GBP')) {
          const id = categoryMap.get('G BANGLES') || categoryMap.get('BANGLES');
          if (id) return { folderId: id, folderName: 'G BANGLES' };
        }
        if (text.startsWith('G HANGING') || skuUpper.startsWith('GHG')) {
          const id = categoryMap.get('G HANGINGS') || categoryMap.get('HANGINGS');
          if (id) return { folderId: id, folderName: 'G HANGINGS' };
        }
        if (text.startsWith('G TOPS') || text.startsWith('GTP') || skuUpper.startsWith('GTP')) {
          const id = categoryMap.get('G TOPS') || categoryMap.get('TOPS');
          if (id) return { folderId: id, folderName: 'G TOPS' };
        }
        if (text.startsWith('G BRACELETE') || text.startsWith('G BRACELET') || skuUpper.startsWith('GBR')) {
          const id = categoryMap.get('G BRACLET') || categoryMap.get('G BRACELET') || categoryMap.get('BRACLET');
          if (id) return { folderId: id, folderName: 'G BRACLET' };
        }
        if (text.startsWith('G CHOKER') || skuUpper.startsWith('GCK')) {
          const id = categoryMap.get('G SHORT') || categoryMap.get('G N SHORT');
          if (id) return { folderId: id, folderName: 'G SHORT' };
        }
        if (text.startsWith('G VADDANAM') || skuUpper.startsWith('GVD')) {
          const id = categoryMap.get("G VADDANAM'S") || categoryMap.get("VADDANAM'S");
          if (id) return { folderId: id, folderName: "G VADDANAM'S" };
        }
        if (text.startsWith('G TIKKA') || skuUpper.startsWith('GTK')) {
          const id = categoryMap.get('G TIKKA') || categoryMap.get('TIKKA');
          if (id) return { folderId: id, folderName: 'G TIKKA' };
        }

        // 3. Kundan (Matches existing database category IDs)
        if (text.includes('KUNDAN') || text.startsWith('GK')) {
          if (text.includes('NECKLACE') || skuUpper.startsWith('GKNE')) {
            const id = categoryMap.get('K NECKLACE') || categoryMap.get('K NECKLECE');
            if (id) return { folderId: id, folderName: 'K Necklace' };
          }
          if (text.includes('PENDANT') || skuUpper.startsWith('GKP')) {
            const id = categoryMap.get('K PENDANT') || categoryMap.get('K PENDENT');
            if (id) return { folderId: id, folderName: 'K Pendant' };
          }
          if (text.includes('HAARAM') || skuUpper.startsWith('GKHA')) {
            const id = categoryMap.get('K HAARAM');
            if (id) return { folderId: id, folderName: 'K Haaram' };
          }
          if (text.includes('JHUMKA') || text.includes('JUMKA') || skuUpper.startsWith('GKJ')) {
            const id = categoryMap.get('K JHUMKA') || categoryMap.get('K JUMKA');
            if (id) return { folderId: id, folderName: 'K Jhumka' };
          }
          const id = categoryMap.get('KUNDAN');
          if (id) return { folderId: id, folderName: 'KUNDAN' };
        }

        // 4. Polki (Matches existing database category IDs)
        if (text.startsWith('P TOPS') || text.startsWith('PLK') || skuUpper.startsWith('PER')) {
          const id = categoryMap.get('P TOPS');
          if (id) return { folderId: id, folderName: 'P Tops' };
        }
        if (text.includes('NECKLACE') || text.includes('NECKLESE') || skuUpper.startsWith('PNE')) {
          const id = categoryMap.get('P NECKLACE') || categoryMap.get('P NECKLECE');
          if (id) return { folderId: id, folderName: 'P Necklace' };
        }

        // Fallback: Check if categoryMap has matching name
        const fallbackName = getCategoryNameFromItem(item.name || '', item.sku || '');
        const id = categoryMap.get(fallbackName.trim().toUpperCase());
        return { folderId: id || null, folderName: fallbackName };
      };

      // 3. Group items into target folders (by existing ID or new name)
      const folderGroups = new Map<string, { folderId: string | null; itemIds: string[] }>();

      fetchItems.forEach(item => {
        let key = '';
        let targetId: string | null = null;

        if (organizeMode === 'category') {
          const mapped = mapItemToTargetFolder(item);
          key = mapped.folderName;
          targetId = mapped.folderId;
        } else if (organizeMode === 'location') {
          key = item.location ? `Location: ${item.location.trim()}` : 'Location: Unassigned';
          targetId = categoryMap.get(key.toUpperCase()) || null;
        } else if (organizeMode === 'supplier') {
          key = item.supplier_name ? `Supplier: ${item.supplier_name.trim()}` : 'Supplier: Direct';
          targetId = categoryMap.get(key.toUpperCase()) || null;
        }

        if (!folderGroups.has(key)) {
          folderGroups.set(key, { folderId: targetId, itemIds: [] });
        }
        folderGroups.get(key)!.itemIds.push(item.id);
      });

      let createdFoldersCount = 0;
      let organizedItemsCount = 0;

      // 4. Assign items to folder IDs (creating missing ones if necessary)
      for (const [folderName, group] of folderGroups.entries()) {
        let finalFolderId = group.folderId;

        if (!finalFolderId) {
          setProgressText(`Creating folder "${folderName}"...`);
          const { data: newCat, error: createErr } = await supabase
            .from('categories')
            .insert({ name: folderName, parent_id: null })
            .select()
            .single();

          if (createErr) {
            console.error('Folder creation failed:', createErr);
            continue;
          }
          finalFolderId = newCat.id;
          categoryMap.set(folderName.trim().toUpperCase(), finalFolderId);
          createdFoldersCount++;
        }

        // Update items in batches of 50
        setProgressText(`Moving ${group.itemIds.length} items into "${folderName}"...`);
        const chunkSize = 50;
        for (let i = 0; i < group.itemIds.length; i += chunkSize) {
          const chunk = group.itemIds.slice(i, i + chunkSize);
          const { error: updateErr } = await supabase
            .from('items')
            .update({ category_id: finalFolderId })
            .in('id', chunk);

          if (updateErr) {
            console.error('Update items error:', updateErr);
          } else {
            organizedItemsCount += chunk.length;
          }
        }
      }

      setLoading(false);
      Alert.alert(
        'Auto-Organization Complete 🎉',
        `Successfully created ${createdFoldersCount} folder(s) and organized ${organizedItemsCount} item(s) into the file system view.`,
        [{ text: 'Great!', onPress: () => { onClose(); onComplete(); } }]
      );
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Failed to auto-organize items.');
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Sparkles size={24} color={Theme.colors.primary} />
              <View>
                <Text style={styles.title}>Auto-Adjust Products</Text>
                <Text style={styles.subtitle}>Organize items into File System folders</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading} style={styles.closeBtn}>
              <X size={20} color={Theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>ORGANIZATION RULE</Text>

            {/* Mode Option 1: By Product Category */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                organizeMode === 'category' && styles.activeOptionCard,
              ]}
              onPress={() => setOrganizeMode('category')}
              disabled={loading}
            >
              <View style={[styles.iconBox, organizeMode === 'category' && styles.activeIconBox]}>
                <FolderTree size={20} color={organizeMode === 'category' ? Theme.colors.text.black : Theme.colors.primary} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>By Product Category / Type</Text>
                <Text style={styles.optionDesc}>
                  Groups items into folders like "Diamond Tops", "Gold Chains", "Rings", "Kundan Jewelry", etc.
                </Text>
              </View>
              {organizeMode === 'category' && <CheckCircle2 size={20} color={Theme.colors.primary} />}
            </TouchableOpacity>

            {/* Mode Option 2: By Location */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                organizeMode === 'location' && styles.activeOptionCard,
              ]}
              onPress={() => setOrganizeMode('location')}
              disabled={loading}
            >
              <View style={[styles.iconBox, organizeMode === 'location' && styles.activeIconBox]}>
                <MapPin size={20} color={organizeMode === 'location' ? Theme.colors.text.black : Theme.colors.primary} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>By Location / Counter</Text>
                <Text style={styles.optionDesc}>
                  Groups items into folders by their counter location (e.g. C1, C3, C5).
                </Text>
              </View>
              {organizeMode === 'location' && <CheckCircle2 size={20} color={Theme.colors.primary} />}
            </TouchableOpacity>

            {/* Mode Option 3: By Supplier */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                organizeMode === 'supplier' && styles.activeOptionCard,
              ]}
              onPress={() => setOrganizeMode('supplier')}
              disabled={loading}
            >
              <View style={[styles.iconBox, organizeMode === 'supplier' && styles.activeIconBox]}>
                <Truck size={20} color={organizeMode === 'supplier' ? Theme.colors.text.black : Theme.colors.primary} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>By Supplier / Vendor</Text>
                <Text style={styles.optionDesc}>
                  Groups items into folders by supplier code (e.g. SHI23, YSH26, RJD21).
                </Text>
              </View>
              {organizeMode === 'supplier' && <CheckCircle2 size={20} color={Theme.colors.primary} />}
            </TouchableOpacity>

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>SCOPE</Text>

            <View style={styles.scopeRow}>
              <TouchableOpacity
                style={[styles.scopeChip, onlyUnassigned && styles.scopeChipActive]}
                onPress={() => setOnlyUnassigned(true)}
                disabled={loading}
              >
                <Text style={[styles.scopeChipText, onlyUnassigned && styles.scopeChipTextActive]}>
                  Unassigned Items Only (Root Level)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scopeChip, !onlyUnassigned && styles.scopeChipActive]}
                onPress={() => setOnlyUnassigned(false)}
                disabled={loading}
              >
                <Text style={[styles.scopeChipText, !onlyUnassigned && styles.scopeChipTextActive]}>
                  All Products in Inventory
                </Text>
              </TouchableOpacity>
            </View>

            {loading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={Theme.colors.primary} />
                <Text style={styles.loadingText}>{progressText}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, loading && styles.disabledBtn]}
              onPress={handleAutoOrganize}
              disabled={loading}
            >
              <FolderPlus size={18} color={Theme.colors.text.black} />
              <Text style={styles.confirmBtnText}>Run Auto-Adjustment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  modalCard: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.lg,
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 11,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.surface,
  },
  body: {
    marginVertical: Theme.spacing.xs,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 1,
    marginBottom: Theme.spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 12,
  },
  activeOptionCard: {
    borderColor: Theme.colors.primary,
    backgroundColor: `${Theme.colors.primary}10`,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  activeIconBox: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.text.primary,
  },
  optionDesc: {
    fontSize: 11,
    color: Theme.colors.text.secondary,
    marginTop: 2,
    lineHeight: 15,
  },
  scopeRow: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: Theme.spacing.md,
  },
  scopeChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  scopeChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  scopeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.text.secondary,
  },
  scopeChipTextActive: {
    color: Theme.colors.text.black,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    marginTop: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.text.primary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.text.secondary,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.primary,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.text.black,
  },
});
