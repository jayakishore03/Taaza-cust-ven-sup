import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Alert
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useRegistration } from '@/contexts/RegistrationContext';

const TOTAL_STEPS = 7;
const CURRENT_STEP = 4;

export default function Step4Documents() {
  const router = useRouter();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [panFile, setPanFile] = useState<DocumentPicker.DocumentResult | null>(null);
  const [gstFile, setGstFile] = useState<DocumentPicker.DocumentResult | null>(null);
  const [fssaiFile, setFssaiFile] = useState<DocumentPicker.DocumentResult | null>(null);
  const [shopLicenseFile, setShopLicenseFile] = useState<DocumentPicker.DocumentResult | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<DocumentPicker.DocumentResult | null>(null);

  // Load existing documents from registration data
  useEffect(() => {
    if (registrationData.documents) {
      if (registrationData.documents.pan) {
        setPanFile({
          type: 'success',
          name: registrationData.documents.pan.name,
          uri: registrationData.documents.pan.uri,
          mimeType: registrationData.documents.pan.type,
        } as DocumentPicker.DocumentPickerSuccessResult);
      }
      if (registrationData.documents.gst) {
        setGstFile({
          type: 'success',
          name: registrationData.documents.gst.name,
          uri: registrationData.documents.gst.uri,
          mimeType: registrationData.documents.gst.type,
        } as DocumentPicker.DocumentPickerSuccessResult);
      }
      if (registrationData.documents.fssai) {
        setFssaiFile({
          type: 'success',
          name: registrationData.documents.fssai.name,
          uri: registrationData.documents.fssai.uri,
          mimeType: registrationData.documents.fssai.type,
        } as DocumentPicker.DocumentPickerSuccessResult);
      }
      if (registrationData.documents.shopLicense) {
        setShopLicenseFile({
          type: 'success',
          name: registrationData.documents.shopLicense.name,
          uri: registrationData.documents.shopLicense.uri,
          mimeType: registrationData.documents.shopLicense.type,
        } as DocumentPicker.DocumentPickerSuccessResult);
      }
      if (registrationData.documents.aadhaar) {
        setAadhaarFile({
          type: 'success',
          name: registrationData.documents.aadhaar.name,
          uri: registrationData.documents.aadhaar.uri,
          mimeType: registrationData.documents.aadhaar.type,
        } as DocumentPicker.DocumentPickerSuccessResult);
      }
    }
  }, []);

  const saveDocument = async (
    uri: string,
    name: string,
    mimeType: string,
    setter: React.Dispatch<React.SetStateAction<DocumentPicker.DocumentResult | null>>,
    documentType: 'pan' | 'gst' | 'fssai' | 'shopLicense' | 'aadhaar'
  ) => {
    // Create a document result object
    const documentResult = {
      type: 'success' as const,
      uri,
      name,
      mimeType,
    } as DocumentPicker.DocumentPickerSuccessResult;
    
    setter(documentResult);
    
    // Save document to registration context immediately
    const documentData = {
      uri,
      name,
      type: mimeType,
    };

    const currentDocuments = registrationData.documents || {};
    await updateRegistrationData({
      documents: {
        ...currentDocuments,
        [documentType]: documentData,
      },
    });
  };

  const pickFile = async (
    setter: React.Dispatch<React.SetStateAction<DocumentPicker.DocumentResult | null>>,
    documentType: 'pan' | 'gst' | 'fssai' | 'shopLicense' | 'aadhaar'
  ) => {
    try {
      // Show options: Document, Camera, Gallery
      Alert.alert(
        'Select Document',
        'Choose how you want to upload the document',
        [
          {
            text: 'Document File',
            onPress: async () => {
              const result = await DocumentPicker.getDocumentAsync({ 
                type: '*/*',
                copyToCacheDirectory: true,
              });
              
              if (result.type === 'success') {
                await saveDocument(
                  result.uri,
                  result.name,
                  result.mimeType || 'application/pdf',
                  setter,
                  documentType
                );
              }
            },
          },
          {
            text: 'Camera',
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(
                  'Permission Denied',
                  'Please allow camera access to take a photo of your document.'
                );
                return;
              }
              
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });
              
              if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                await saveDocument(
                  asset.uri,
                  `${documentType}_${Date.now()}.jpg`,
                  'image/jpeg',
                  setter,
                  documentType
                );
              }
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(
                  'Permission Denied',
                  'Please allow photo library access to select a document photo.'
                );
                return;
              }
              
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });
              
              if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                await saveDocument(
                  asset.uri,
                  asset.fileName || `${documentType}_${Date.now()}.jpg`,
                  'image/jpeg',
                  setter,
                  documentType
                );
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Step Label */}
        <Text style={styles.stepLabel}>
          {'STEP ' + CURRENT_STEP + ' / ' + TOTAL_STEPS + ': SHOP DOCUMENTS'}
        </Text>

        {/* Step Bar - positioned at the top */}
        <View style={styles.stepContainer}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const isCompleted = i < CURRENT_STEP - 1;
            const isCurrent = i === CURRENT_STEP - 1;
            const isUpcoming = i > CURRENT_STEP - 1;
            
            return (
              <React.Fragment key={i}>
                <View
                  style={[
                    styles.stepBox,
                    isCompleted && styles.completedStep,
                    isCurrent && styles.activeStep,
                    isUpcoming && styles.inactiveStep,
                  ]}
                >
                  <Text
                    style={
                      isCompleted || isCurrent
                        ? styles.stepTextActive
                        : styles.stepTextInactive
                    }
                  >
                    {i + 1}
                  </Text>
                </View>
                {i < TOTAL_STEPS - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      isCompleted && styles.stepLineCompleted,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* PAN Upload */}
        <Text style={styles.label}>🆔 Shop Owner / Business PAN</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => pickFile(setPanFile, 'pan')}>
          <Text style={panFile ? styles.fileName : styles.placeholderText}>
            {panFile ? panFile.name : 'Upload PAN document for shop'}
          </Text>
        </TouchableOpacity>

        {/* GSTIN Upload */}
        <Text style={styles.label}>🏢 Shop GSTIN Document (Optional)</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => pickFile(setGstFile, 'gst')}>
          <Text style={gstFile ? styles.fileName : styles.placeholderText}>
            {gstFile ? gstFile.name : 'Upload GSTIN document for shop (Optional)'}
          </Text>
        </TouchableOpacity>

        {/* FSSAI License Upload */}
        <Text style={styles.label}>🍗 FSSAI License for Shop (Required)</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => pickFile(setFssaiFile, 'fssai')}>
          <Text style={fssaiFile ? styles.fileName : styles.placeholderText}>
            {fssaiFile ? fssaiFile.name : 'Upload FSSAI License for meat business'}
          </Text>
        </TouchableOpacity>

        {/* Shop License Upload */}
        <Text style={styles.label}>🏪 Shop License / Trade License</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => pickFile(setShopLicenseFile, 'shopLicense')}>
          <Text style={shopLicenseFile ? styles.fileName : styles.placeholderText}>
            {shopLicenseFile ? shopLicenseFile.name : 'Upload Shop License for shop'}
          </Text>
        </TouchableOpacity>

        {/* Aadhaar Upload */}
        <Text style={styles.label}>🆔 Shop Owner Aadhaar Card</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => pickFile(setAadhaarFile, 'aadhaar')}>
          <Text style={aadhaarFile ? styles.fileName : styles.placeholderText}>
            {aadhaarFile ? aadhaarFile.name : 'Upload Owner Aadhaar Card'}
          </Text>
        </TouchableOpacity>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.buttonText}>⬅️ Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={async () => {
              // Validate required documents
              if (!panFile) {
                Alert.alert('Required Document', 'Please upload PAN document before proceeding.');
                return;
              }
              
              if (!fssaiFile) {
                Alert.alert('Required Document', 'Please upload FSSAI License before proceeding.');
                return;
              }

              if (!aadhaarFile) {
                Alert.alert('Required Document', 'Please upload Aadhaar Card before proceeding.');
                return;
              }

              // Save all documents to registration context
              const documents: any = {};
              
              if (panFile && panFile.type === 'success') {
                documents.pan = {
                  uri: panFile.uri,
                  name: panFile.name,
                  type: panFile.mimeType || 'application/pdf',
                };
              }
              
              if (gstFile && gstFile.type === 'success') {
                documents.gst = {
                  uri: gstFile.uri,
                  name: gstFile.name,
                  type: gstFile.mimeType || 'application/pdf',
                };
              }
              
              if (fssaiFile && fssaiFile.type === 'success') {
                documents.fssai = {
                  uri: fssaiFile.uri,
                  name: fssaiFile.name,
                  type: fssaiFile.mimeType || 'application/pdf',
                };
              }
              
              if (shopLicenseFile && shopLicenseFile.type === 'success') {
                documents.shopLicense = {
                  uri: shopLicenseFile.uri,
                  name: shopLicenseFile.name,
                  type: shopLicenseFile.mimeType || 'application/pdf',
                };
              }
              
              if (aadhaarFile && aadhaarFile.type === 'success') {
                documents.aadhaar = {
                  uri: aadhaarFile.uri,
                  name: aadhaarFile.name,
                  type: aadhaarFile.mimeType || 'application/pdf',
                };
              }

              // Update registration data with all documents
              await updateRegistrationData({ documents });
              
              // Navigate to next step
              router.push('/partner-registration/bank');
            }}
          >
            <Text style={styles.buttonText}>Next ➡️</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    backgroundColor: '#F5F7FA',
    paddingTop: 16,
    paddingBottom: 30,
  },

  // Step bar aligned top
  stepContainer: {
    marginTop: 12,
    marginBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  stepBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  completedStep: {
    backgroundColor: '#1F2937',
    shadowColor: '#1F2937',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  activeStep: {
    backgroundColor: '#1F2937',
    shadowColor: '#1F2937',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  inactiveStep: {
    backgroundColor: '#E5E7EB',
  },
  stepTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  stepTextInactive: {
    color: '#9CA3AF',
    fontWeight: '700',
    fontSize: 14,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
    borderRadius: 1,
  },
  stepLineCompleted: {
    backgroundColor: '#1F2937',
  },

  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  label: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
    color: '#111827',
  },

  uploadBtn: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#9CA3AF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
