'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  getPendingIncidents, 
  getVerifiedIncidents, 
  approveIncident, 
  rejectIncident,
  deleteIncident,
  getIncidentStats 
} from '@/lib/incidentService';
import { Incident, INCIDENT_TYPES, SEVERITY_LEVELS } from '@/lib/types';

// Helper function to format time
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
};

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [pendingIncidents, setPendingIncidents] = useState<Incident[]>([]);
  const [verifiedIncidents, setVerifiedIncidents] = useState<Incident[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');
  const [stats, setStats] = useState<any>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = () => {
    setPendingIncidents(getPendingIncidents());
    setVerifiedIncidents(getVerifiedIncidents());
    setStats(getIncidentStats());
  };

  const handleApprove = (incidentId: string) => {
    if (confirm('Approve this incident?')) {
      approveIncident(incidentId);
      loadData();
      setSelectedIncident(null);
      alert('✅ Incident approved! It is now displayed on the map.');
    }
  };

  const handleReject = (incidentId: string) => {
    if (confirm('Reject this incident?')) {
      rejectIncident(incidentId);
      loadData();
      setSelectedIncident(null);
      alert('✅ Incident rejected!');
    }
  };

  const handleDelete = (incidentId: string) => {
    if (confirm('Delete this incident from the map?')) {
      deleteIncident(incidentId);
      loadData();
      setSelectedIncident(null);
      alert('✅ Incident deleted!');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentIncidents = activeTab === 'pending' ? pendingIncidents : verifiedIncidents;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">🛡️ Admin</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Manage Incident Reports</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-medium text-gray-900">{user.displayName || user.email}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Admin</p>
              </div>
              {user.photoURL ? (
                <img src={user.photoURL} alt="Admin" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-green-500" />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-sm sm:text-base font-semibold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg sm:text-2xl">⏳</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Verified</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.verified}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg sm:text-2xl">✅</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg sm:text-2xl">📊</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Critical</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.bySeverity.high}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg sm:text-2xl">🚨</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                ⏳ Pending ({pendingIncidents.length})
              </button>
              <button
                onClick={() => setActiveTab('verified')}
                className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold transition-colors ${
                  activeTab === 'verified'
                    ? 'bg-green-50 text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                ✅ Verified ({verifiedIncidents.length})
              </button>
            </div>
          </div>

          {/* Incident List */}
          <div className="p-3 sm:p-6">
            {currentIncidents.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-4xl sm:text-6xl mb-4">
                  {activeTab === 'pending' ? '📭' : '🎉'}
                </div>
                <p className="text-gray-600 text-sm sm:text-lg">
                  {activeTab === 'pending' 
                    ? 'No incidents pending review' 
                    : 'No verified incidents yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                {currentIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="bg-white rounded-lg border-2 border-gray-200 hover:border-green-500 transition-all overflow-hidden cursor-pointer group"
                    onClick={() => setSelectedIncident(incident)}
                  >
                    {/* Image */}
                    {incident.imageUrl && (
                      <div className="h-32 sm:h-48 overflow-hidden bg-gray-100">
                        <img
                          src={incident.imageUrl}
                          alt="Incident"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl sm:text-2xl">
                            {INCIDENT_TYPES[incident.type].icon}
                          </span>
                          <div>
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                              {INCIDENT_TYPES[incident.type].label}
                            </h3>
                            <p className="text-[10px] sm:text-xs text-gray-500">
                              {formatTimeAgo(incident.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                            incident.severity === 'high'
                              ? 'bg-red-100 text-red-700'
                              : incident.severity === 'medium'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {SEVERITY_LEVELS[incident.severity].label}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 line-clamp-2">
                        {incident.description}
                      </p>

                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3">
                        <span>📍</span>
                        <span className="line-clamp-1">
                          {incident.location.address || `${incident.location.lat.toFixed(4)}, ${incident.location.lng.toFixed(4)}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 mb-3 sm:mb-4">
                        <span>👤</span>
                        <span className="truncate">{incident.reportedBy || 'Anonymous'}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {activeTab === 'pending' ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(incident.id!);
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors text-xs sm:text-sm"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(incident.id!);
                              }}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors text-xs sm:text-sm"
                            >
                              ✕ Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(incident.id!);
                            }}
                            className="w-full bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors text-xs sm:text-sm"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={() => setSelectedIncident(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedIncident.imageUrl && (
              <div className="h-48 sm:h-64 overflow-hidden bg-gray-100">
                <img
                  src={selectedIncident.imageUrl}
                  alt="Incident"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-3xl sm:text-4xl">
                    {INCIDENT_TYPES[selectedIncident.type].icon}
                  </span>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {INCIDENT_TYPES[selectedIncident.type].label}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {formatTimeAgo(selectedIncident.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700">Severity Level</label>
                  <p
                    className={`inline-block mt-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                      selectedIncident.severity === 'high'
                        ? 'bg-red-100 text-red-700'
                        : selectedIncident.severity === 'medium'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {SEVERITY_LEVELS[selectedIncident.severity].label}
                  </p>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700">Description</label>
                  <p className="mt-1 text-sm sm:text-base text-gray-900">{selectedIncident.description}</p>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700">Location</label>
                  <p className="mt-1 text-sm sm:text-base text-gray-900 break-all">
                    {selectedIncident.location.address || 
                      `${selectedIncident.location.lat.toFixed(6)}, ${selectedIncident.location.lng.toFixed(6)}`}
                  </p>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700">Reported By</label>
                  <p className="mt-1 text-sm sm:text-base text-gray-900">{selectedIncident.reportedBy || 'Anonymous'}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                {activeTab === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleApprove(selectedIncident.id!)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg font-semibold transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(selectedIncident.id!)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg font-semibold transition-colors"
                    >
                      ✕ Reject
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleDelete(selectedIncident.id!)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg font-semibold transition-colors"
                  >
                    🗑️ Delete from Map
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
