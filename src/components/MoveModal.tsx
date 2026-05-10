import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { X, Folder, ChevronRight, ArrowLeft, Check, Move } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { Theme } from '../theme';

interface MoveModalProps {
  isVisible: boolean;
  onClose: () => void;
  onMove: () => void;
  itemsToMove: { id: string; name: string, type: 'item' | 'folder' }[];
}

export default function MoveModal({ isVisible, onClose, onMove, itemsToMove }: MoveModalProps) {
  const [currentFolder, setCurrentFolder] = useState<any>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (isVisible) {
      fetchFolders(null);
      setHistory([]);
      setCurrentFolder(null);
    }
  }, [isVisible]);

  const fetchFolders = async (parentId: string | null) => {
    try {
      setLoading(true);
      let query = supabase.from('categories').select('id, name');
      
      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null);
      }

      // Exclude the folders being moved
      const folderIdsToMove = itemsToMove.filter(i => i.type === 'folder').map(i => i.id);
      if (folderIdsToMove.length > 0) {
        query = query.not('id', 'in', `(${folderIdsToMove.join(',')})`);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      setFolders(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (folder: any) => {
    setHistory([...history, currentFolder]);
    setCurrentFolder(folder);
    fetchFolders(folder.id);
  };

  const navigateBack = () => {
    const prev = history.pop();
    setHistory([...history]);
    setCurrentFolder(prev);
    fetchFolders(prev ? prev.id : null);
  };

  const handleMove = async () => {
    try {
      setMoving(true);
      const destinationId = currentFolder ? currentFolder.id : null;

      for (const item of itemsToMove) {
        const table = item.type === 'folder' ? 'categories' : 'items';
        const column = item.type === 'folder' ? 'parent_id' : 'category_id';
        
        const { error } = await supabase
          .from(table)
          .update({ [column]: destinationId })
          .eq('id', item.id);
        
        if (error) throw error;
      }

      Alert.alert('Success', `Moved ${itemsToMove.length} item(s)`);
      onMove();
      onClose();
    } catch (error: any) {
      Alert.alert('Move Failed', error.message);
    } finally {
      setMoving(false);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Move to...</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={Theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.breadcrumb}>
            <TouchableOpacity onPress={() => { setCurrentFolder(null); setHistory([]); fetchFolders(null); }}>
              <Text style={[styles.breadcrumbText, !currentFolder && styles.activeCrumb]}>Root</Text>
            </TouchableOpacity>
            {currentFolder && (
              <>
                <ChevronRight size={14} color={Theme.colors.text.muted} />
                <Text style={[styles.breadcrumbText, styles.activeCrumb]}>{currentFolder.name}</Text>
              </>
            )}
          </View>

          <View style={styles.listContainer}>
            {currentFolder && (
              <TouchableOpacity style={styles.backItem} onPress={navigateBack}>
                <ArrowLeft size={18} color={Theme.colors.primary} />
                <Text style={styles.backText}>Go Back</Text>
              </TouchableOpacity>
            )}

            {loading ? (
              <ActivityIndicator style={styles.loader} color={Theme.colors.primary} />
            ) : (
              <FlatList
                data={folders}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.folderItem} onPress={() => navigateTo(item)}>
                    <Folder size={20} color={Theme.colors.primary} fill={Theme.colors.surface} />
                    <Text style={styles.folderName}>{item.name}</Text>
                    <ChevronRight size={18} color={Theme.colors.text.muted} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No sub-folders here</Text>
                }
              />
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.selectionInfo}>Moving {itemsToMove.length} items to {currentFolder ? currentFolder.name : 'Root'}</Text>
            <TouchableOpacity 
              style={[styles.moveBtn, moving && { opacity: 0.7 }]} 
              onPress={handleMove}
              disabled={moving}
            >
              {moving ? <ActivityIndicator color={Theme.colors.text.black} /> : <Check size={20} color={Theme.colors.text.black} />}
              <Text style={styles.moveBtnText}>Confirm Move</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '80%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.text.primary,
  },
  closeBtn: {
    padding: 4,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  breadcrumbText: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
  },
  activeCrumb: {
    color: Theme.colors.primary,
    fontWeight: '800',
  },
  listContainer: {
    flex: 1,
  },
  backItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backText: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  folderName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: Theme.colors.text.muted,
    marginTop: 40,
    fontSize: 15,
  },
  loader: {
    marginTop: 40,
  },
  footer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  selectionInfo: {
    fontSize: 12,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '600',
  },
  moveBtn: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  moveBtnText: {
    color: Theme.colors.text.black,
    fontSize: 16,
    fontWeight: '700',
  },
});
