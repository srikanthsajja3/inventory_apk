import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal, FlatList, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, User, Phone, Mail, MapPin, CreditCard, Calendar, Award, Copy, Send, Trash2, CheckCircle2, ChevronRight, X, Printer, UserPlus, Info } from 'lucide-react-native';
import { supabase } from '../../supabase';
import { generateUnsignedPDF, addSignatureToPDF } from '../utils/pdfSign';
import { getShareableLink, shareToWhatsApp } from '../utils/linksSign';
import SignaturePad from '../components/SignaturePad';
import { Theme } from '../theme';

const supabaseClient = supabase as any;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '900', color: Theme.colors.primary, letterSpacing: -0.5 },
  scrollContent: { padding: 10 },
  
  card: { backgroundColor: Theme.colors.surface, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: Theme.colors.border },
  cardTitle: { fontSize: 11, fontWeight: '800', color: Theme.colors.primary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: Theme.colors.text.secondary, marginTop: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  inputGroup: { marginBottom: 8 },
  inputLabel: { fontSize: 9, color: Theme.colors.text.secondary, fontWeight: '700', marginBottom: 2, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.background, borderRadius: 6, paddingHorizontal: 8, height: 32, borderWidth: 1, borderColor: Theme.colors.border },
  inputIcon: { marginRight: 6 },
  textInput: { flex: 1, color: Theme.colors.text.primary, fontSize: 11, fontWeight: '600', paddingVertical: 2 },
  
  actionBtn: { backgroundColor: Theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, gap: 8, marginTop: 8 },
  actionBtnText: { color: Theme.colors.text.black, fontSize: 12, fontWeight: '800' },
  
  pickerContainer: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  chip: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: Theme.colors.background, flex: 1, alignItems: 'center' },
  chipSelected: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  chipText: { color: Theme.colors.text.secondary, fontSize: 9, fontWeight: '700' },
  chipTextSelected: { color: Theme.colors.text.black },

  benefitBox: { backgroundColor: Theme.colors.muted, padding: 8, borderRadius: 6, marginTop: 6 },
  benefitText: { fontSize: 9, color: Theme.colors.primary, fontStyle: 'italic', fontWeight: '600' },
  
  docCard: { backgroundColor: Theme.colors.surface, borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: Theme.colors.border },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  docName: { fontSize: 12, fontWeight: '800', color: Theme.colors.text.primary },
  docEmail: { fontSize: 9, color: Theme.colors.text.secondary },
  docDate: { fontSize: 8, color: Theme.colors.text.muted, marginTop: 2 },
  statusBadge: { fontSize: 8, fontWeight: '800', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, textTransform: 'uppercase', overflow: 'hidden' },
  pendingBadge: { backgroundColor: 'rgba(253, 126, 20, 0.15)', color: '#fd7e14' },
  signedBadge: { backgroundColor: 'rgba(40, 167, 69, 0.15)', color: '#28a745' },
  
  docActions: { flexDirection: 'row', gap: 6, borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingTop: 8, marginTop: 8 },
  smallActionBtn: { flex: 1, height: 28, borderRadius: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: Theme.colors.background, borderRadius: 12, width: '100%', maxWidth: 500, maxHeight: '90%', borderWidth: 1, borderColor: Theme.colors.border, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  modalTitle: { fontSize: 12, fontWeight: '800', color: Theme.colors.primary, textTransform: 'uppercase' },
  modalScroll: { padding: 12 },
  
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { fontSize: 10, color: Theme.colors.text.secondary, fontWeight: '600' },
  detailValue: { fontSize: 10, color: Theme.colors.text.primary, fontWeight: '700', flex: 1.5, textAlign: 'right' },
  statusRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingTop: 10, marginTop: 10 },
  
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: Theme.colors.primary },
  tabLabel: { fontSize: 11, fontWeight: '700', color: Theme.colors.text.secondary },
  tabLabelActive: { color: Theme.colors.primary }
});

const num = (v: any) => parseFloat(String(v)) || 0;

export default function DigitalSignScreen() {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Signature Portal Settings
  const [portalUrl, setPortalUrl] = useState('https://digital-sign-app.vercel.app');

  // Form states
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [idProofType, setIdProofType] = useState('Aadhaar');
  const [idProofNumber, setIdProofNumber] = useState('');
  
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [firstInstallmentDate, setFirstInstallmentDate] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [modeOfPayment, setModeOfPayment] = useState('CASH');

  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('');
  const [nomineeContact, setNomineeContact] = useState('');

  // Active Sign Document
  const [activeSignDoc, setActiveSignDoc] = useState<any>(null);
  const [signing, setSigning] = useState(false);

  const duration = 11;
  const monthlyVal = num(monthlyInstallment);
  const calculatedTotal = monthlyVal > 0 ? (monthlyVal * 10) + (monthlyVal * 0.75) : 0;
  const totalContribution = calculatedTotal.toString();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseClient
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (e: any) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!name.trim() || !email.trim() || !mobile.trim() || !monthlyInstallment.trim()) {
      Alert.alert('Error', 'Please fill in Name, Email, Mobile, and Installment.');
      return;
    }

    try {
      setSubmitting(true);
      const detailsObj = {
        dob: dob.trim(), mobile: mobile.trim(), address: address.trim(), idProofType, idProofNumber: idProofNumber.trim(),
        monthlyInstallment: monthlyInstallment.trim(), schemeDuration: `${duration} Months`,
        totalContribution: `₹ ${totalContribution}`,
        specialBenefit: 'ENJOY AN EXCLUSIVE 25% DISCOUNT ON YOUR FIRST MONTH INSTALLMENT AT THE TIME OF MATURITY, WITH YOUR 11TH MONTH INSTALLMENT FULLY COVERED BY MOKSHA.',
        modeOfPayment, firstInstallmentDate: firstInstallmentDate.trim(), preferredPaymentDate: preferredDate.trim(),
        nominee: { name: nomineeName.trim(), relationship: nomineeRelation.trim(), contact: nomineeContact.trim() }
      };

      // 1. Insert into Supabase
      const { data, error: dbError } = await supabaseClient
        .from('documents')
        .insert([{ 
          customer_name: name.trim(), 
          customer_email: email.trim(), 
          details: detailsObj, 
          status: 'pending' 
        }])
        .select().single();

      if (dbError) throw dbError;

      // 2. Generate PDF
      const pdfBytes = await generateUnsignedPDF(name.trim(), email.trim(), detailsObj);

      // 3. Upload Unsigned PDF to Storage
      const fileName = `unsigned_${data.id}.pdf`;
      const uploadData = Platform.OS === 'web' ? new Blob([pdfBytes as any], { type: 'application/pdf' }) : pdfBytes;

      const { error: uploadError } = await supabaseClient.storage
        .from('pdfs')
        .upload(fileName, uploadData, { 
          contentType: 'application/pdf', 
          upsert: true 
        });

      if (uploadError) throw uploadError;

      // Reset form
      setName('');
      setDob('');
      setMobile('');
      setEmail('');
      setAddress('');
      setIdProofNumber('');
      setMonthlyInstallment('');
      setFirstInstallmentDate('');
      setPreferredDate('');
      setNomineeName('');
      setNomineeRelation('');
      setNomineeContact('');

      Alert.alert('Success', 'Application created! Copy link or share via WhatsApp.', [
        { text: 'Share WhatsApp', onPress: () => shareToWhatsApp(mobile, name, getShareableLink(data.id, portalUrl)) },
        { text: 'OK' }
      ]);
      
      fetchDocuments();
      setActiveTab('list');

    } catch (e: any) {
      Alert.alert('Creation Failed', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (doc: any) => {
    const fileName = doc.status === 'signed' ? `signed_${doc.id}.pdf` : `unsigned_${doc.id}.pdf`;
    const { data, error } = await supabaseClient.storage
      .from('pdfs')
      .createSignedUrl(fileName, 3600); // 1 hour expiration
    
    if (error) {
      Alert.alert('Error', 'File not found. PDF generation may have failed.');
      return;
    }

    if (data?.signedUrl) {
      Linking.openURL(data.signedUrl);
    }
  };

  const handleCopyLink = (id: string) => {
    const link = getShareableLink(id, portalUrl);
    if (Platform.OS === 'web' && navigator.clipboard) {
      navigator.clipboard.writeText(link);
      Alert.alert('Copied', 'Portal signature link copied to clipboard!');
    } else {
      Alert.alert('Link Details', link);
    }
  };

  const handleDirectSignature = async (signatureBase64: string) => {
    if (!activeSignDoc) return;
    try {
      setSigning(true);
      const docId = activeSignDoc.id;
      const unsignedFileName = `unsigned_${docId}.pdf`;
      
      let pdfData: Blob | null = null;

      // 1. Download unsigned PDF
      const { data: downloadedData, error: downloadError } = await supabaseClient.storage
        .from('pdfs')
        .download(unsignedFileName);
      
      if (downloadError) {
        // Fallback to generating on the fly
        const regeneratedPdfBytes = await generateUnsignedPDF(activeSignDoc.customer_name, activeSignDoc.customer_email, activeSignDoc.details);
        pdfData = new Blob([regeneratedPdfBytes as any], { type: 'application/pdf' });
      } else {
        pdfData = downloadedData;
      }

      if (!pdfData) throw new Error('Could not retrieve PDF data.');

      const arrayBuffer = await pdfData.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);

      // 2. Add signature to PDF
      const signedPdfBytes = await addSignatureToPDF(pdfBytes, signatureBase64);

      // 3. Upload Signed PDF to Storage
      const signedFileName = `signed_${docId}.pdf`;
      const uploadData = Platform.OS === 'web' ? new Blob([signedPdfBytes as any], { type: 'application/pdf' }) : signedPdfBytes;
      
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(signedFileName, uploadData, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 4. Update Document Status in DB
      const { error: updateError } = await supabaseClient
        .from('documents')
        .update({ status: 'signed' })
        .eq('id', docId);

      if (updateError) throw updateError;

      // 5. Delete the unsigned PDF to save storage space
      try {
        await supabaseClient.storage
          .from('pdfs')
          .remove([unsignedFileName]);
      } catch (err) {
        console.warn('Failed to delete unsigned PDF:', err);
      }

      Alert.alert('Success', 'Document signed successfully!');
      setActiveSignDoc(null);
      fetchDocuments();

    } catch (e: any) {
      Alert.alert('Signing Failed', e.message);
    } finally {
      setSigning(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Gold Scheme Digital Signing</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'create' && styles.tabItemActive]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabLabel, activeTab === 'create' && styles.tabLabelActive]}>New Application</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'list' && styles.tabItemActive]}
          onPress={() => setActiveTab('list')}
        >
          <Text style={[styles.tabLabel, activeTab === 'list' && styles.tabLabelActive]}>Applications Log</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'create' ? (
          <View>
            {/* Configuration Setting Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Client Portal Setting</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Signature Web App Base URL</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={portalUrl}
                    onChangeText={setPortalUrl}
                    placeholder="https://moksha-sign.vercel.app"
                    placeholderTextColor={Theme.colors.text.muted}
                  />
                </View>
              </View>
            </View>

            {/* Applicant Details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Applicant Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <View style={styles.inputWrapper}>
                  <User size={14} color={Theme.colors.text.secondary} style={styles.inputIcon} />
                  <TextInput style={styles.textInput} placeholder="Full Name" placeholderTextColor={Theme.colors.text.muted} value={name} onChangeText={setName} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Date of Birth</Text>
                  <View style={styles.inputWrapper}>
                    <Calendar size={14} color={Theme.colors.text.secondary} style={styles.inputIcon} />
                    <TextInput style={styles.textInput} placeholder="DD/MM/YYYY" placeholderTextColor={Theme.colors.text.muted} value={dob} onChangeText={setDob} />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1.2 }]}>
                  <Text style={styles.inputLabel}>Mobile Number *</Text>
                  <View style={styles.inputWrapper}>
                    <Phone size={14} color={Theme.colors.text.secondary} style={styles.inputIcon} />
                    <TextInput style={styles.textInput} placeholder="Mobile" keyboardType="phone-pad" placeholderTextColor={Theme.colors.text.muted} value={mobile} onChangeText={setMobile} />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={14} color={Theme.colors.text.secondary} style={styles.inputIcon} />
                  <TextInput style={styles.textInput} placeholder="Email" keyboardType="email-address" placeholderTextColor={Theme.colors.text.muted} value={email} onChangeText={setEmail} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <View style={[styles.inputWrapper, { height: 48, alignItems: 'flex-start', paddingTop: 6 }]}>
                  <MapPin size={14} color={Theme.colors.text.secondary} style={styles.inputIcon} />
                  <TextInput style={[styles.textInput, { height: '100%' }]} placeholder="Full Address" placeholderTextColor={Theme.colors.text.muted} multiline value={address} onChangeText={setAddress} />
                </View>
              </View>

              <Text style={styles.inputLabel}>ID Proof Type</Text>
              <View style={styles.pickerContainer}>
                {['Aadhaar', 'PAN', 'Passport', 'License'].map(opt => (
                  <TouchableOpacity 
                    key={opt} 
                    style={[styles.chip, idProofType === opt && styles.chipSelected]}
                    onPress={() => setIdProofType(opt)}
                  >
                    <Text style={[styles.chipText, idProofType === opt && styles.chipTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ID Proof Number</Text>
                <View style={styles.inputWrapper}>
                  <CreditCard size={14} color={Theme.colors.text.secondary} style={styles.inputIcon} />
                  <TextInput style={styles.textInput} placeholder="ID Document Number" placeholderTextColor={Theme.colors.text.muted} value={idProofNumber} onChangeText={setIdProofNumber} />
                </View>
              </View>
            </View>

            {/* Scheme Details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Scheme & Payment</Text>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Monthly Installment *</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: Theme.colors.primary, marginRight: 4 }}>₹</Text>
                    <TextInput style={styles.textInput} placeholder="Amount" keyboardType="numeric" placeholderTextColor={Theme.colors.text.muted} value={monthlyInstallment} onChangeText={setMonthlyInstallment} />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1.2 }]}>
                  <Text style={styles.inputLabel}>Duration</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: Theme.colors.muted }]}>
                    <Text style={[styles.textInput, { color: Theme.colors.text.secondary }]}>11 Months (Covered)</Text>
                  </View>
                </View>
              </View>

              <View style={styles.benefitBox}>
                <Text style={styles.benefitText}>
                  Benefit: 10 + 0.75 Months. Total contribution: ₹{totalContribution}. Moksha covers the 11th installment fully at maturity.
                </Text>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Mode of Payment</Text>
              <View style={styles.pickerContainer}>
                {['CASH', 'UPI', 'CARD', 'BANK'].map(opt => (
                  <TouchableOpacity 
                    key={opt} 
                    style={[styles.chip, modeOfPayment === opt && styles.chipSelected]}
                    onPress={() => setModeOfPayment(opt)}
                  >
                    <Text style={[styles.chipText, modeOfPayment === opt && styles.chipTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>1st Installment Date</Text>
                  <View style={styles.inputWrapper}>
                    <Calendar size={14} color={Theme.colors.text.secondary} style={styles.inputIcon} />
                    <TextInput style={styles.textInput} placeholder="e.g. 25/06/2026" placeholderTextColor={Theme.colors.text.muted} value={firstInstallmentDate} onChangeText={setFirstInstallmentDate} />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Preferred Date</Text>
                  <View style={styles.inputWrapper}>
                    <Calendar size={14} color={Theme.colors.text.secondary} style={styles.inputIcon} />
                    <TextInput style={styles.textInput} placeholder="e.g. 5th" placeholderTextColor={Theme.colors.text.muted} value={preferredDate} onChangeText={setPreferredDate} />
                  </View>
                </View>
              </View>
            </View>

            {/* Nominee Details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Nominee Details (Optional)</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nominee Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={14} color={Theme.colors.text.secondary} style={styles.inputIcon} />
                  <TextInput style={styles.textInput} placeholder="Nominee Full Name" placeholderTextColor={Theme.colors.text.muted} value={nomineeName} onChangeText={setNomineeName} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Relationship</Text>
                  <View style={styles.inputWrapper}>
                    <Info size={14} color={Theme.colors.text.secondary} style={styles.inputIcon} />
                    <TextInput style={styles.textInput} placeholder="Relationship" placeholderTextColor={Theme.colors.text.muted} value={nomineeRelation} onChangeText={setNomineeRelation} />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1.2 }]}>
                  <Text style={styles.inputLabel}>Contact Number</Text>
                  <View style={styles.inputWrapper}>
                    <Phone size={14} color={Theme.colors.text.secondary} style={styles.inputIcon} />
                    <TextInput style={styles.textInput} placeholder="Contact" keyboardType="phone-pad" placeholderTextColor={Theme.colors.text.muted} value={nomineeContact} onChangeText={setNomineeContact} />
                  </View>
                </View>
              </View>
            </View>

            {/* Submit Action */}
            <TouchableOpacity 
              style={[styles.actionBtn, submitting && { opacity: 0.7 }]}
              onPress={handleCreateDocument}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator size="small" color="black" /> : <UserPlus size={18} color="black" />}
              <Text style={styles.actionBtnText}>{submitting ? 'Generating Scheme PDF...' : 'Create Scheme & Get Sign Link'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {loading ? (
              <View style={{ marginTop: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={{ color: Theme.colors.text.secondary, marginTop: 10, fontSize: 12 }}>Loading scheme logs...</Text>
              </View>
            ) : documents.length === 0 ? (
              <View style={{ marginTop: 40, alignItems: 'center' }}>
                <FileText size={48} color={Theme.colors.border} />
                <Text style={{ color: Theme.colors.text.secondary, marginTop: 10, fontSize: 12 }}>No applications found.</Text>
              </View>
            ) : (
              <FlatList
                data={documents}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => {
                  const isSigned = item.status === 'signed';
                  return (
                    <View style={styles.docCard}>
                      <View style={styles.docHeader}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.docName}>{item.customer_name}</Text>
                          <Text style={styles.docEmail}>{item.customer_email}</Text>
                          <Text style={styles.docDate}>
                            Created: {new Date(item.created_at).toLocaleDateString('en-IN')} | Installment: ₹{item.details.monthlyInstallment}
                          </Text>
                        </View>
                        <Text style={[styles.statusBadge, isSigned ? styles.signedBadge : styles.pendingBadge]}>
                          {item.status}
                        </Text>
                      </View>
                      
                      <View style={styles.docActions}>
                        <TouchableOpacity 
                          style={[styles.smallActionBtn, { backgroundColor: Theme.colors.border }]} 
                          onPress={() => handleCopyLink(item.id)}
                        >
                          <Copy size={12} color={Theme.colors.text.primary} />
                          <Text style={[styles.actionBtnText, { fontSize: 9, color: Theme.colors.text.primary }]}>Copy Link</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.smallActionBtn, { backgroundColor: '#25D366' }]} 
                          onPress={() => shareToWhatsApp(item.details.mobile, item.customer_name, getShareableLink(item.id, portalUrl))}
                        >
                          <Send size={12} color="white" />
                          <Text style={[styles.actionBtnText, { fontSize: 9, color: 'white' }]}>WhatsApp</Text>
                        </TouchableOpacity>

                        {!isSigned && (
                          <TouchableOpacity 
                            style={[styles.smallActionBtn, { backgroundColor: Theme.colors.primary }]} 
                            onPress={() => setActiveSignDoc(item)}
                          >
                            <User size={12} color="black" />
                            <Text style={[styles.actionBtnText, { fontSize: 9, color: 'black' }]}>Sign Screen</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity 
                          style={[styles.smallActionBtn, { backgroundColor: Theme.colors.muted }]} 
                          onPress={() => handleDownload(item)}
                        >
                          <Printer size={12} color={Theme.colors.text.secondary} />
                          <Text style={[styles.actionBtnText, { fontSize: 9, color: Theme.colors.text.secondary }]}>PDF</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Direct On-Device Customer Signing Modal */}
      <Modal visible={activeSignDoc !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {activeSignDoc && (
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Sign Application Directly</Text>
                  <Text style={{ fontSize: 9, color: Theme.colors.text.secondary, fontWeight: '700', marginTop: 2 }}>
                    Applicant: {activeSignDoc.customer_name} ({activeSignDoc.details.mobile})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setActiveSignDoc(null)} style={{ padding: 4 }}>
                  <X size={20} color={Theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                  <Text style={[styles.cardTitle, { color: Theme.colors.primary }]}>Confirm Profile Details</Text>
                  <DetailRow label="DOB" value={activeSignDoc.details.dob} />
                  <DetailRow label="Email" value={activeSignDoc.customer_email} />
                  <DetailRow label="Address" value={activeSignDoc.details.address} />
                  <DetailRow label="ID Document" value={`${activeSignDoc.details.idProofType} - ${activeSignDoc.details.idProofNumber}`} />
                  
                  <View style={{ height: 1, backgroundColor: Theme.colors.border, marginVertical: 6 }} />
                  <DetailRow label="Monthly Scheme" value={`₹ ${activeSignDoc.details.monthlyInstallment}`} />
                  <DetailRow label="Payment Mode" value={activeSignDoc.details.modeOfPayment} />
                  <DetailRow label="First Due Date" value={activeSignDoc.details.firstInstallmentDate} />
                  <DetailRow label="Nominee" value={activeSignDoc.details.nominee?.name || 'None'} />
                </View>

                <Text style={[styles.inputLabel, { textAlign: 'center', marginBottom: 6, fontSize: 10, color: Theme.colors.primary }]}>
                  Customer Signature Authorization
                </Text>
                
                <SignaturePad onOK={handleDirectSignature} descriptionText="Please guide customer to sign in the canvas box below" />
                {signing && <ActivityIndicator size="small" color={Theme.colors.primary} style={{ marginVertical: 10 }} />}
                
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value || 'N/A'}</Text>
    </View>
  );
}
