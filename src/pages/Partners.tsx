import { Search, Store, Phone, MapPin, Mail, User, X, Eye, Edit, Loader2, AlertCircle } from 'lucide-react';
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
}

const Partners = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [partners, setPartners] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      setPartners(data || []);
    } catch (err: any) {
      console.error('Error fetching shops:', err);
      setError(err.message || 'Failed to load shops');
    } finally {
      setLoading(false);
    }
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
                  {partner.shop_image_url ? (
                    <img
                      src={partner.shop_image_url}
                      alt={partner.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
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
                      {partner.shop_image_url ? (
                        <img
                          src={partner.shop_image_url}
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
    </div>
  );
};

export default Partners;

