import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { FileText, Upload, CheckCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { uploadDocument } from '@/services/imageUpload';
import { updateShopDocument } from '@/services/shops';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

export default function DocumentsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [docs, setDocs] = useState<{
    pan?: string | null;
    gst?: string | null;
    fssai?: string | null;
    shopLicense?: string | null;
    aadhaar?: string | null;
  }>({});

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        const vendorDataStr = await AsyncStorage.getItem('vendor_data');
        if (!vendorDataStr) {
          setError('Vendor data not found. Please log out and log in again.');
          return;
        }

        const vendorData = JSON.parse(vendorDataStr);
        const id = vendorData?.shop?.id || vendorData?.shop_id;

        if (!id) {
          setError('Shop details not found. Please log out and log in again.');
          return;
        }

        setShopId(id);

        const { data, error: dbError } = await supabase
          .from('shops')
          .select('pan_document, gst_document, fssai_document, shop_license_document, aadhaar_document')
          .eq('id', id)
          .single();

        if (dbError) {
          console.error('[DocumentsScreen] Error loading shop documents:', dbError);
          setError('Unable to load documents from server. Please try again later.');
          return;
        }

        setDocs({
          pan: data?.pan_document || null,
          gst: data?.gst_document || null,
          fssai: data?.fssai_document || null,
          shopLicense: data?.shop_license_document || null,
          aadhaar: data?.aadhaar_document || null,
        });
      } catch (e: any) {
        console.error('[DocumentsScreen] Unexpected error:', e);
        setError(e?.message || 'Something went wrong while loading documents.');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);

  const handleView = async (url?: string | null) => {
    if (!url) {
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      // Silently ignore, user just won't see the document
    }
  };

  const pickAndUpload = async (
    docKey: keyof typeof docs,
    documentType: 'pan' | 'gst' | 'fssai' | 'shopLicense' | 'aadhaar',
    source: 'camera' | 'gallery' | 'document'
  ) => {
    if (!shopId) {
      return;
    }

    let uri: string | null = null;

    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          uri = result.assets[0].uri;
        }
      } else if (source === 'gallery') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          uri = result.assets[0].uri;
        }
      } else if (source === 'document') {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });
        if (result.type === 'success') {
          uri = result.uri;
        }
      }

      if (!uri) {
        return;
      }

      // 1. Upload to Supabase Storage
      const uploadResult = await uploadDocument(uri, shopId, documentType);
      if (!uploadResult.success || !uploadResult.url) {
        return;
      }

      // 2. Save URL in shops table so Super Admin and apps see it
      const updateResult = await updateShopDocument(shopId, documentType, uploadResult.url);
      if (!updateResult.success) {
        return;
      }

      // 3. Update local state so UI reflects new doc
      setDocs((prev) => ({
        ...prev,
        [docKey]: uploadResult.url,
      }));
    } catch {
      // swallow error; could add toast in future
    }
  };

  const handleUpdate = (docKey: keyof typeof docs) => {
    // Map UI key to backend documentType
    const typeMap: Record<keyof typeof docs, 'pan' | 'gst' | 'fssai' | 'shopLicense' | 'aadhaar'> = {
      pan: 'pan',
      gst: 'gst',
      fssai: 'fssai',
      shopLicense: 'shopLicense',
      aadhaar: 'aadhaar',
    };
    const documentType = typeMap[docKey];

    Alert.alert(
      'Update Document',
      'Choose how you want to upload the document',
      [
        {
          text: 'Camera',
          onPress: () => pickAndUpload(docKey, documentType, 'camera'),
        },
        {
          text: 'Gallery',
          onPress: () => pickAndUpload(docKey, documentType, 'gallery'),
        },
        {
          text: 'Files',
          onPress: () => pickAndUpload(docKey, documentType, 'document'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documents</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Documents</Text>
          <Text style={styles.sectionSubtitle}>
            Documents you uploaded during registration. Tap "View Document" to open from secure storage.
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Upload size={24} color="#000" />
              <Text style={styles.loadingText}>Loading documents...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.documentList}>
              <TouchableOpacity style={styles.documentCard}>
                <View style={styles.documentIcon}>
                  <FileText size={24} color="#000" />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>PAN Card</Text>
                  <Text style={styles.documentStatus}>
                    {docs.pan ? 'Uploaded' : 'Not uploaded'}
                  </Text>
                  {docs.pan && (
                    <TouchableOpacity onPress={() => handleView(docs.pan)}>
                      <Text style={styles.viewLink}>View Document</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity style={styles.updatePill} onPress={() => handleUpdate('pan')}>
                  <Text style={styles.updatePillText}>Update</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              <TouchableOpacity style={styles.documentCard}>
                <View style={styles.documentIcon}>
                  <FileText size={24} color="#000" />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>GST Certificate</Text>
                  <Text style={styles.documentStatus}>
                    {docs.gst ? 'Uploaded' : 'Not uploaded'}
                  </Text>
                  {docs.gst && (
                    <TouchableOpacity onPress={() => handleView(docs.gst)}>
                      <Text style={styles.viewLink}>View Document</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity style={styles.updatePill} onPress={() => handleUpdate('gst')}>
                  <Text style={styles.updatePillText}>Update</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              <TouchableOpacity style={styles.documentCard}>
                <View style={styles.documentIcon}>
                  <FileText size={24} color="#000" />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>FSSAI License</Text>
                  <Text style={styles.documentStatus}>
                    {docs.fssai ? 'Uploaded' : 'Not uploaded'}
                  </Text>
                  {docs.fssai && (
                    <TouchableOpacity onPress={() => handleView(docs.fssai)}>
                      <Text style={styles.viewLink}>View Document</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity style={styles.updatePill} onPress={() => handleUpdate('fssai')}>
                  <Text style={styles.updatePillText}>Update</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              <TouchableOpacity style={styles.documentCard}>
                <View style={styles.documentIcon}>
                  <FileText size={24} color="#000" />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>Shop License</Text>
                  <Text style={styles.documentStatus}>
                    {docs.shopLicense ? 'Uploaded' : 'Not uploaded'}
                  </Text>
                  {docs.shopLicense && (
                    <TouchableOpacity onPress={() => handleView(docs.shopLicense)}>
                      <Text style={styles.viewLink}>View Document</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity style={styles.updatePill} onPress={() => handleUpdate('shopLicense')}>
                  <Text style={styles.updatePillText}>Update</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              <TouchableOpacity style={styles.documentCard}>
                <View style={styles.documentIcon}>
                  <FileText size={24} color="#000" />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>Aadhaar Card</Text>
                  <Text style={styles.documentStatus}>
                    {docs.aadhaar ? 'Uploaded' : 'Not uploaded'}
                  </Text>
                  {docs.aadhaar && (
                    <TouchableOpacity onPress={() => handleView(docs.aadhaar)}>
                      <Text style={styles.viewLink}>View Document</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity style={styles.updatePill} onPress={() => handleUpdate('aadhaar')}>
                  <Text style={styles.updatePillText}>Update</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#DC2626',
  },
  documentList: {
    gap: 12,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  documentStatus: {
    fontSize: 14,
    color: '#666',
  },
  viewLink: {
    marginTop: 4,
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
  },
  updatePill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#111827',
  },
  updatePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
});

