import { Search, Store, Phone, MapPin, Mail, User, X, Eye, Edit, Loader2, AlertCircle, Upload, Image as ImageIcon, FileText, Save, Camera } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Shop {
  id: string;
  name: string;
  owner_name: string;
  mobile_number: string;
  email: string;
  address: string;
  is_active: boolean;
  created_at: string;
  rating?: number;
  shop_image_url?: string;
  image_url?: string;
  store_photos?: string[];
  pan_document?: string;
  gst_document?: string;
  fssai_document?: string;
  shop_license_document?: string;
  aadhaar_document?: string;
  signature?: string;
  // Approval fields
  is_approved?: boolean;
  is_verified?: boolean;
  user_id?: string;
}

const Partners = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [partners, setPartners] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageViewer, setImageViewer] = useState<{show: boolean; url: string; title: string}>({show: false, url: '', title: ''});
  const [uploadModal, setUploadModal] = useState<{show: boolean; shopId: string; type: 'shop' | 'document'}>({show: false, shopId: '', type: 'shop'});
  const [uploading, setUploading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Fetch shops from Supabase
  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Debug: Log shop image data
      console.log('=== FETCHED SHOPS DEBUG ===');
      data?.forEach((shop, index) => {
        console.log(`Shop ${index + 1}: ${shop.name}`);
        console.log('  - image_url:', shop.image_url);
        console.log('  - shop_image_url:', shop.shop_image_url);
        console.log('  - store_photos:', shop.store_photos);
        console.log('---');
      });

      setPartners(data || []);
    } catch (err: any) {
      console.error('Error fetching shops:', err);
      setError(err.message || 'Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload to Supabase Storage
  const handleImageUpload = async (file: File, shopId: string, imageType: 'shop' | 'pan' | 'gst' | 'fssai' | 'license' | 'aadhaar') => {
    try {
      setUploading(true);

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${shopId}_${imageType}_${Date.now()}.${fileExt}`;
      const filePath = `shops/${shopId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('shop-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('shop-images')
        .getPublicUrl(filePath);

      // Update database based on image type
      let updateField = '';
      switch (imageType) {
        case 'shop':
          updateField = 'image_url';
          break;
        case 'pan':
          updateField = 'pan_document';
          break;
        case 'gst':
          updateField = 'gst_document';
          break;
        case 'fssai':
          updateField = 'fssai_document';
          break;
        case 'license':
          updateField = 'shop_license_document';
          break;
        case 'aadhaar':
          updateField = 'aadhaar_document';
          break;
      }

      const { error: updateError } = await supabase
        .from('shops')
        .update({ [updateField]: publicUrl })
        .eq('id', shopId);

      if (updateError) {
        throw updateError;
      }

      // Refresh shops list
      await fetchShops();
      alert(`${imageType.toUpperCase()} image uploaded successfully!`);
      setUploadModal({show: false, shopId: '', type: 'shop'});
      
    } catch (err: any) {
      console.error('Error uploading image:', err);
      alert(`Error uploading image: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // View image in modal
  const viewImage = (url: string, title: string) => {
    setImageViewer({show: true, url, title});
  };

  // Filter partners based on search
  const filteredPartners = partners.filter((partner) =>
    searchQuery === '' ||
    partner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.mobile_number?.includes(searchQuery) ||
    partner.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Partners & Shops</h1>
        <p className="text-gray-600">Manage and monitor your meat shop partners</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by shop name, owner name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={fetchShops}
            disabled={loading}
            className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg hover:from-red-700 hover:to-red-900 transition-all font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Store className="w-5 h-5" />
                Refresh
              </>
            )}
          </button>
        </div>
        {partners.length > 0 && (
          <p className="text-sm text-gray-600 mt-4">
            Total Partners: <span className="font-semibold text-gray-900">{partners.length}</span>
            {filteredPartners.length !== partners.length && (
              <> • Showing: <span className="font-semibold text-gray-900">{filteredPartners.length}</span></>
            )}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading partners...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Error Loading Partners</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchShops}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPartners.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Store className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No partners found</p>
              <p className="text-sm mt-1">
                {searchQuery ? 'Try adjusting your search criteria' : 'No partners available'}
              </p>
            </div>
          ) : (
            filteredPartners.map((partner) => (
              <div
                key={partner.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Shop Image */}
                <div className="relative h-48 bg-gradient-to-br from-red-600 to-red-800">
                  {(partner.image_url || partner.shop_image_url || (partner.store_photos && partner.store_photos.length > 0)) ? (
                    <img
                      src={partner.image_url || partner.shop_image_url || (partner.store_photos && partner.store_photos[0]) || ''}
                      alt={partner.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.error(`❌ Image failed to load for ${partner.name}:`, {
                          image_url: partner.image_url,
                          shop_image_url: partner.shop_image_url,
                          store_photos: partner.store_photos,
                          attempted_src: target.src
                        });
                        target.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log(`✅ Image loaded successfully for ${partner.name}`);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  <span
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${
                      partner.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {partner.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="p-6">
                  {/* Shop Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{partner.name || 'Unnamed Shop'}</h3>

                  {/* Owner Information */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {partner.owner_name ? partner.owner_name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {partner.owner_name || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Owner</p>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="truncate">{partner.mobile_number || 'N/A'}</span>
                    </p>
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="truncate">{partner.email || 'N/A'}</span>
                    </p>
                    <p className="text-sm text-gray-700 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{partner.address || 'No address provided'}</span>
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Joined</p>
                      <p className="text-sm font-bold text-gray-900">{formatDate(partner.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Rating</p>
                      <p className="text-sm font-bold text-gray-900">⭐ {partner.rating || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Approval Status Badge */}
                  {partner.is_approved === false && (
                    <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800 font-medium">⏳ Pending Approval</p>
                    </div>
                  )}
                  {partner.is_approved === true && (
                    <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-800 font-medium">✅ Approved</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedPartner(partner.id)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => window.open(`tel:${partner.mobile_number}`)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg hover:from-red-700 hover:to-red-900 transition-all font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* View Details Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Partner Details</h2>
                <button
                  onClick={() => setSelectedPartner(null)}
                  className="text-white hover:text-red-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {partners
                .filter((p) => p.id === selectedPartner)
                .map((partner) => (
                  <div key={partner.id} className="space-y-6">
                    {/* Shop Image */}
                    <div className="relative h-64 bg-gradient-to-br from-red-600 to-red-800 rounded-lg overflow-hidden">
                      {(partner.image_url || partner.shop_image_url || (partner.store_photos && partner.store_photos.length > 0)) ? (
                        <img
                          src={partner.image_url || partner.shop_image_url || (partner.store_photos && partner.store_photos[0]) || ''}
                          alt={partner.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store className="w-20 h-20 text-white/30" />
                        </div>
                      )}
                    </div>

                    {/* Shop Name and Status */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{partner.name}</h3>
                        <p className="text-gray-600 mt-1">Partner since {formatDate(partner.created_at)}</p>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          partner.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {partner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Owner Information */}
                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Owner Information</h4>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          {partner.owner_name ? partner.owner_name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <p className="text-xl font-bold text-gray-900">{partner.owner_name || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Shop Owner</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Phone className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-600">Phone</p>
                            <p className="text-sm font-medium text-gray-900">{partner.mobile_number || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Mail className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-600">Email</p>
                            <p className="text-sm font-medium text-gray-900">{partner.email || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                          <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-600">Address</p>
                            <p className="text-sm font-medium text-gray-900">{partner.address || 'No address provided'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Shop ID</p>
                          <p className="text-lg font-bold text-gray-900 truncate">{partner.id.slice(0, 8)}...</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Rating</p>
                          <p className="text-2xl font-bold text-gray-900">⭐ {partner.rating || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Status</p>
                          <p className="text-lg font-bold text-gray-900">{partner.is_active ? 'Active' : 'Inactive'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Documents Section */}
                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Documents</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {/* PAN Card */}
                        <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <p className="text-sm font-semibold text-gray-900">PAN Card</p>
                          </div>
                          {partner.pan_document ? (
                            <button
                              onClick={() => viewImage(partner.pan_document!, 'PAN Card')}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View Document
                            </button>
                          ) : (
                            <p className="text-xs text-gray-500">Not uploaded</p>
                          )}
                        </div>

                        {/* GST Certificate */}
                        <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <p className="text-sm font-semibold text-gray-900">GST Certificate</p>
                          </div>
                          {partner.gst_document ? (
                            <button
                              onClick={() => viewImage(partner.gst_document!, 'GST Certificate')}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View Document
                            </button>
                          ) : (
                            <p className="text-xs text-gray-500">Not uploaded</p>
                          )}
                        </div>

                        {/* FSSAI License */}
                        <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <p className="text-sm font-semibold text-gray-900">FSSAI License</p>
                          </div>
                          {partner.fssai_document ? (
                            <button
                              onClick={() => viewImage(partner.fssai_document!, 'FSSAI License')}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View Document
                            </button>
                          ) : (
                            <p className="text-xs text-gray-500">Not uploaded</p>
                          )}
                        </div>

                        {/* Shop License */}
                        <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <p className="text-sm font-semibold text-gray-900">Shop License</p>
                          </div>
                          {partner.shop_license_document ? (
                            <button
                              onClick={() => viewImage(partner.shop_license_document!, 'Shop License')}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View Document
                            </button>
                          ) : (
                            <p className="text-xs text-gray-500">Not uploaded</p>
                          )}
                        </div>

                        {/* Aadhaar Card */}
                        <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <p className="text-sm font-semibold text-gray-900">Aadhaar Card</p>
                          </div>
                          {partner.aadhaar_document ? (
                            <button
                              onClick={() => viewImage(partner.aadhaar_document!, 'Aadhaar Card')}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View Document
                            </button>
                          ) : (
                            <p className="text-xs text-gray-500">Not uploaded</p>
                          )}
                        </div>

                        {/* Contract Signature */}
                        <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <p className="text-sm font-semibold text-gray-900">Contract Signature</p>
                          </div>
                          {partner.signature ? (
                            <button
                              onClick={() => viewImage(partner.signature!, 'Contract Signature')}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View Signature
                            </button>
                          ) : (
                            <p className="text-xs text-gray-500">Not signed</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Shop Image Management */}
                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Shop Image (Customer App)</h4>
                      <div className="flex items-center gap-4">
                        {partner.image_url ? (
                          <div className="relative w-32 h-32 border border-gray-200 rounded-lg overflow-hidden cursor-pointer">
                            <img 
                              src={partner.image_url} 
                              alt="Shop" 
                              className="w-full h-full object-cover"
                              onClick={() => viewImage(partner.image_url!, 'Shop Image')}
                            />
                          </div>
                        ) : (
                          <div className="w-32 h-32 border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                            <ImageIcon className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                        <button
                          onClick={() => setUploadModal({show: true, shopId: partner.id, type: 'shop'})}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Upload Shop Image
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">This image will be displayed in the customer app</p>
                    </div>

                    {/* Approval Section */}
                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Shop Approval Status</h4>
                      <div className="space-y-4">
                        {/* Status Badges */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Approved:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              partner.is_approved 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {partner.is_approved ? '✅ Yes' : '⏳ Pending'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Verified:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              partner.is_verified 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {partner.is_verified ? '✅ Yes' : '❌ No'}
                            </span>
                          </div>
                        </div>

                        {/* Approval Actions */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800 mb-3">
                            <strong>Note:</strong> Only approved shops will be visible to customers in the mobile app.
                          </p>
                          <div className="flex gap-3 flex-wrap">
                            {!partner.is_approved ? (
                              <button
                                onClick={async () => {
                                  if (confirm(`Approve shop "${partner.name}"? This will make it visible to customers.`)) {
                                    try {
                                      const { error } = await supabase
                                        .from('shops')
                                        .update({ 
                                          is_approved: true, 
                                          is_verified: true 
                                        })
                                        .eq('id', partner.id);
                                      
                                      if (error) throw error;
                                      
                                      alert('✅ Shop approved successfully!');
                                      await fetchShops();
                                    } catch (err: any) {
                                      alert(`Error approving shop: ${err.message}`);
                                    }
                                  }
                                }}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                              >
                                ✅ Approve Shop
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  if (confirm(`Revoke approval for "${partner.name}"? This will hide it from customers.`)) {
                                    try {
                                      const { error } = await supabase
                                        .from('shops')
                                        .update({ 
                                          is_approved: false, 
                                          is_verified: false 
                                        })
                                        .eq('id', partner.id);
                                      
                                      if (error) throw error;
                                      
                                      alert('Shop approval revoked');
                                      await fetchShops();
                                    } catch (err: any) {
                                      alert(`Error: ${err.message}`);
                                    }
                                  }
                                }}
                                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium flex items-center justify-center gap-2"
                              >
                                ⏸️ Revoke Approval
                              </button>
                            )}

                            {/* Send Welcome Email Button */}
                            {partner.is_approved && (
                              <button
                                onClick={async () => {
                                  if (!partner.email) {
                                    alert('❌ No email address found for this shop');
                                    return;
                                  }
                                  
                                  if (confirm(`Send welcome email to ${partner.email}?`)) {
                                    try {
                                      setSendingEmail(true);
                                      
                                      // Call backend email API
                                      const response = await fetch(`https://taaza-customer.vercel.app/api/email/welcome/${partner.id}`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json'
                                        }
                                      });
                                      
                                      // Check if response is ok before parsing JSON
                                      if (!response.ok) {
                                        // Try to get error message from response
                                        let errorMessage = `Failed to send email (Status: ${response.status})`;
                                        try {
                                          const errorData = await response.json();
                                          errorMessage = errorData.error?.message || errorData.message || errorMessage;
                                        } catch (e) {
                                          // If response is not JSON, use status text
                                          errorMessage = response.statusText || errorMessage;
                                        }
                                        throw new Error(errorMessage);
                                      }
                                      
                                      const result = await response.json();
                                      
                                      if (result.success) {
                                        alert(`✅ Welcome email sent successfully to ${partner.email}!`);
                                      } else {
                                        throw new Error(result.error?.message || result.error || 'Failed to send email');
                                      }
                                    } catch (err: any) {
                                      // Handle different types of errors
                                      let errorMessage = 'Failed to send email';
                                      
                                      if (err.message) {
                                        errorMessage = err.message;
                                      } else if (err instanceof TypeError && err.message.includes('fetch')) {
                                        errorMessage = 'Network error: Could not connect to server. Please check your internet connection or try again later.';
                                      } else {
                                        errorMessage = err.toString();
                                      }
                                      
                                      alert(`❌ Error sending email: ${errorMessage}`);
                                      console.error('Email sending error:', err);
                                    } finally {
                                      setSendingEmail(false);
                                    }
                                  }
                                }}
                                disabled={sendingEmail || !partner.email}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                {sendingEmail ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Mail className="w-4 h-4" />
                                    Send Welcome Email
                                  </>
                                )}
                              </button>
                            )}
                            
                            <button
                              onClick={async () => {
                                if (confirm(`Reject and delete shop "${partner.name}"? This action cannot be undone.`)) {
                                  try {
                                    const { error } = await supabase
                                      .from('shops')
                                      .delete()
                                      .eq('id', partner.id);
                                    
                                    if (error) throw error;
                                    
                                    alert('❌ Shop rejected and deleted');
                                    setSelectedPartner(null);
                                    await fetchShops();
                                  } catch (err: any) {
                                    alert(`Error deleting shop: ${err.message}`);
                                  }
                                }
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                              🗑️ Delete Shop
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => window.open(`tel:${partner.mobile_number}`)}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg hover:from-red-700 hover:to-red-900 transition-all font-medium flex items-center justify-center gap-2"
                      >
                        <Phone className="w-5 h-5" />
                        Call Owner
                      </button>
                      <button
                        onClick={() => window.open(`mailto:${partner.email}`)}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Mail className="w-5 h-5" />
                        Send Email
                      </button>
                      <button
                        onClick={() => setSelectedPartner(null)}
                        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {imageViewer.show && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setImageViewer({show: false, url: '', title: ''})}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setImageViewer({show: false, url: '', title: ''})}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-4">
                <h3 className="text-xl font-bold">{imageViewer.title}</h3>
              </div>
              <div className="p-4 max-h-[70vh] overflow-auto">
                <img 
                  src={imageViewer.url} 
                  alt={imageViewer.title}
                  className="w-full h-auto rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23f3f4f6" width="400" height="300"/><text x="50%" y="50%" fill="%236b7280" font-family="Arial" font-size="18" text-anchor="middle">Image not available</text></svg>';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Image Modal */}
      {uploadModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Upload Shop Image</h2>
                <button
                  onClick={() => setUploadModal({show: false, shopId: '', type: 'shop'})}
                  className="text-white hover:text-red-100 transition-colors"
                  disabled={uploading}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file size (max 5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        alert('File size must be less than 5MB');
                        return;
                      }
                      handleImageUpload(file, uploadModal.shopId, 'shop');
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Maximum file size: 5MB. Supported formats: JPG, PNG, WEBP
                </p>
              </div>

              {uploading && (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This image will be displayed to customers in the mobile app when they browse shops.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partners;

