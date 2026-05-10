import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { IndianRupee, Save, ArrowLeft, TrendingUp, History } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { Theme } from '../theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 15 },
  backBtn: { padding: 8, backgroundColor: Theme.colors.surface, borderRadius: 12, elevation: 2, borderWidth: 1, borderColor: Theme.colors.border },
  title: { fontSize: 24, fontWeight: '800', color: Theme.colors.text.primary },
  card: { 
    backgroundColor: Theme.colors.surface, 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: Theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      }
    })
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 25, backgroundColor: Theme.colors.background, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Theme.colors.border },
  infoText: { fontSize: 14, fontWeight: '600', color: Theme.colors.primary },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: Theme.colors.text.secondary, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.background, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 15 },
  input: { flex: 1, paddingVertical: 15, paddingHorizontal: 10, fontSize: 18, fontWeight: '800', color: Theme.colors.text.primary },
  unit: { fontSize: 12, fontWeight: '600', color: Theme.colors.text.secondary },
  saveBtn: { backgroundColor: Theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 18, gap: 10, marginTop: 10 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: Theme.colors.background, fontSize: 16, fontWeight: '700' },
  historyCard: { marginTop: 20, alignItems: 'center', gap: 5 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyTitle: { fontSize: 12, fontWeight: '600', color: Theme.colors.text.secondary },
  historyDate: { fontSize: 12, color: Theme.colors.text.muted }
});

const RateInput = ({ label, value, onChange, color }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, { borderColor: color + '40' }]}>
      <IndianRupee size={18} color={color} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0.00"
        placeholderTextColor={Theme.colors.text.muted}
      />
      <Text style={styles.unit}>/ gram</Text>
    </View>
  </View>
);

export default function GoldRateScreen({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rates, setRates] = useState({
    gold_24kt: '',
    gold_22kt: '',
    gold_18kt: ''
  });
  const [rateMap, setRateMap] = useState<any>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => { fetchRates(); }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('master_rates').select('*');
      if (error) throw error;
      const newRateMap: any = {};
      let latestDate: string | null = null;
      data?.forEach(r => {
        newRateMap[r.key] = r.value;
        if (r.updated_at && (!latestDate || new Date(r.updated_at) > new Date(latestDate))) { latestDate = r.updated_at; }
      });
      setRateMap(newRateMap);
      setLastUpdated(latestDate);
      setRates({
        gold_24kt: String(newRateMap.gold_24kt || '0'),
        gold_22kt: String(newRateMap.gold_22kt || '0'),
        gold_18kt: String(newRateMap.gold_18kt || '0')
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load rates: ' + error.message);
    } finally { setLoading(false); }
  };

  const handle24KChange = (value: string) => {
    const rate24k = parseFloat(value) || 0;
    if (rate24k === 0 && value === '') {
       setRates({ gold_24kt: '', gold_22kt: '', gold_18kt: '' });
       return;
    }
    const mult22 = rateMap.gold_22kt_multiplier || 0.92;
    const mult18 = rateMap.gold_18kt_multiplier || 0.75;
    setRates({
      gold_24kt: value,
      gold_22kt: Math.round(rate24k * mult22).toString(),
      gold_18kt: Math.round(rate24k * mult18).toString()
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = Object.entries(rates).map(([key, value]) => ({
        key,
        value: parseFloat(String(value)) || 0,
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabase.from('master_rates').upsert(updates, { onConflict: 'key' });
      if (error) throw error;
      Alert.alert('Success', 'Gold rates updated successfully!');
      fetchRates(); 
    } catch (error: any) {
      Alert.alert('Update Failed', error.message);
    } finally { setSaving(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}><ArrowLeft size={24} color={Theme.colors.text.primary} /></TouchableOpacity>
          <Text style={styles.title}>Update Gold Rates</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.infoRow}><TrendingUp size={20} color={Theme.colors.primary} /><Text style={styles.infoText}>Enter rates per gram (₹)</Text></View>
          <RateInput label="24K Gold Rate" value={rates.gold_24kt} onChange={handle24KChange} color={Theme.colors.status.info} />
          <RateInput label="22K Gold Rate" value={rates.gold_22kt} onChange={(v: string) => setRates({...rates, gold_22kt: v})} color={Theme.colors.primary} />
          <RateInput label="18K Gold Rate" value={rates.gold_18kt} onChange={(v: string) => setRates({...rates, gold_18kt: v})} color="#ca8a04" />
          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={Theme.colors.background} /> : <><Save size={20} color={Theme.colors.background} /><Text style={styles.saveBtnText}>Update Rates</Text></>}
          </TouchableOpacity>
        </View>
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}><History size={18} color={Theme.colors.text.secondary} /><Text style={styles.historyTitle}>Last Updated</Text></View>
          <Text style={styles.historyDate}>{lastUpdated ? `${new Date(lastUpdated).toLocaleDateString()} at ${new Date(lastUpdated).toLocaleTimeString()}` : 'Never updated'}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
