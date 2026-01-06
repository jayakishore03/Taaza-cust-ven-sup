import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import {
  FileText,
  CircleCheck as CheckCircle,
  Clock,
  Circle as XCircle,
  Upload,
} from 'lucide-react-native';

interface Document {
  id: string;
  document_type: string;
  verification_status: string;
  uploaded_at: string;
}

interface RiderData {
  verification_status: string;
}

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [riderData, setRiderData] = useState<RiderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiderData();
    fetchDocuments();
  }, []);

  const fetchRiderData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('delivery_agents')
          .select('verification_status')
          .eq('user_id', user.id)
          .single();
        
        if (data && !error) {
          setRiderData(data);
        }
      }
    } catch (error) {
      console.error('Error fetching rider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('delivery_agents')
          .select('driving_license_url, aadhar_url, pan_url, selfie_url')
          .eq('user_id', user.id)
          .single();
        
        if (data && !error) {
          const docs: Document[] = [];
          if (data.driving_license_url) {
            docs.push({ 
              id: 'driving_license', 
              document_type: 'driving_license', 
              verification_status: 'verified',
              uploaded_at: new Date().toISOString()
            });
          }
          if (data.aadhar_url) {
            docs.push({ 
              id: 'aadhar', 
              document_type: 'aadhar', 
              verification_status: 'verified',
              uploaded_at: new Date().toISOString()
            });
          }
          if (data.pan_url) {
            docs.push({ 
              id: 'pan', 
              document_type: 'pan', 
              verification_status: 'verified',
              uploaded_at: new Date().toISOString()
            });
          }
          setDocuments(docs);
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const documentTypes = [
    { id: 'aadhar', label: 'Aadhar Card' },
    { id: 'pan', label: 'PAN Card' },
    { id: 'driving_license', label: 'Driving License' },
  ];

  const handleUpload = async (documentType: string) => {
    try {
      // Import image picker
      const ImagePicker = await import('expo-image-picker');
      
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload documents');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        Alert.alert('Uploading', 'Please wait while we upload your document...');
        
        // Upload to Supabase Storage
        const { uploadAgentDocument } = await import('@/services/imageUpload');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const documentUrl = await uploadAgentDocument(result.assets[0].uri, user.id, documentType);
          
          // Update database
          const updateData: any = {};
          updateData[`${documentType}_url`] = documentUrl;
          
          await supabase
            .from('delivery_agents')
            .update(updateData)
            .eq('user_id', user.id);
          
          Alert.alert('Success', 'Document uploaded successfully!');
          fetchDocuments();
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload document');
    }
  };

  const getDocumentStatus = (documentType: string) =>
    documents.find((d) => d.document_type === documentType);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle size={24} color="#000" />;
      case 'pending':
        return <Clock size={24} color="#555" />;
      case 'rejected':
        return <XCircle size={24} color="#333" />;
      default:
        return <Upload size={24} color="#888" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'verified':
        return '#000';
      case 'pending':
        return '#555';
      case 'rejected':
        return '#333';
      default:
        return '#888';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Under Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Not Uploaded';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documents</Text>
        <Text style={styles.headerSubtitle}>Upload your verification documents</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {riderData?.verification_status === 'verified' && (
          <View style={styles.statusBanner}>
            <CheckCircle size={24} color="#000" />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>Account Verified</Text>
              <Text style={styles.statusText}>You can now accept deliveries</Text>
            </View>
          </View>
        )}

        <View style={styles.documentList}>
          {documentTypes.map((docType) => {
            const doc = getDocumentStatus(docType.id);
            const status = doc?.verification_status;
            return (
              <View key={docType.id} style={styles.documentCard}>
                <View style={styles.documentHeader}>
                  <Text style={styles.documentLabel}>{docType.label}</Text>
                  <View style={styles.statusContainer}>
                    {getStatusIcon(status)}
                    <Text style={[styles.statusLabel, { color: getStatusColor(status) }]}>
                      {getStatusText(status)}
                    </Text>
                  </View>
                </View>

                {!doc && (
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => handleUpload(docType.id)}
                  >
                    <Upload size={18} color="#FFF" />
                    <Text style={styles.uploadButtonText}>Upload</Text>
                  </TouchableOpacity>
                )}

                {doc && status === 'rejected' && (
                  <TouchableOpacity
                    style={styles.reuploadButton}
                    onPress={() => handleUpload(docType.id)}
                  >
                    <Upload size={18} color="#FF6B35" />
                    <Text style={styles.reuploadButtonText}>Re-upload</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <FileText size={24} color="#000" />
          <Text style={styles.infoTitle}>Document Requirements</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Clear and readable photos</Text>
            <Text style={styles.infoItem}>• All corners visible</Text>
            <Text style={styles.infoItem}>• Valid and not expired</Text>
            <Text style={styles.infoItem}>• Name should match registration</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#000' },
  headerSubtitle: { fontSize: 16, color: '#444', marginTop: 4 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: '#EEE',
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  statusTextContainer: { flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: '700', color: '#000' },
  statusText: { fontSize: 14, color: '#000', marginTop: 2 },
  documentList: { paddingHorizontal: 24, gap: 16 },
  documentCard: {
    backgroundColor: '#F7F7F7',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  documentHeader: { marginBottom: 12 },
  documentLabel: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 6 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusLabel: { fontSize: 14, fontWeight: '600' },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  reuploadButton: {
    flexDirection: 'row',
    backgroundColor: '#FFF0F0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  reuploadButtonText: { color: '#FF6B35', fontSize: 16, fontWeight: '600' },
  infoCard: {
    margin: 24,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#000',
  },
  infoTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginTop: 12, marginBottom: 12 },
  infoList: { gap: 8 },
  infoItem: { fontSize: 14, color: '#444', lineHeight: 20 },
  scrollContent: { paddingBottom: 80 },
});
