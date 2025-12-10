import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { FileText, Upload, CheckCircle } from 'lucide-react-native';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

export default function DocumentsScreen() {
  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: STATUS_BAR_HEIGHT }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documents</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Documents</Text>
          <Text style={styles.sectionSubtitle}>
            Upload and manage your business documents
          </Text>

          <View style={styles.documentList}>
            <TouchableOpacity style={styles.documentCard}>
              <View style={styles.documentIcon}>
                <FileText size={24} color="#000" />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>PAN Card</Text>
                <Text style={styles.documentStatus}>Not uploaded</Text>
              </View>
              <Upload size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.documentCard}>
              <View style={styles.documentIcon}>
                <FileText size={24} color="#000" />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>GST Certificate</Text>
                <Text style={styles.documentStatus}>Not uploaded</Text>
              </View>
              <Upload size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.documentCard}>
              <View style={styles.documentIcon}>
                <FileText size={24} color="#000" />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>FSSAI License</Text>
                <Text style={styles.documentStatus}>Not uploaded</Text>
              </View>
              <Upload size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.documentCard}>
              <View style={styles.documentIcon}>
                <FileText size={24} color="#000" />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>Shop License</Text>
                <Text style={styles.documentStatus}>Not uploaded</Text>
              </View>
              <Upload size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.documentCard}>
              <View style={styles.documentIcon}>
                <FileText size={24} color="#000" />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>Aadhaar Card</Text>
                <Text style={styles.documentStatus}>Not uploaded</Text>
              </View>
              <Upload size={20} color="#666" />
            </TouchableOpacity>
          </View>
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
});

