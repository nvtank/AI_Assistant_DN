'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 font-semibold"
            >
              Back to Home
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-6 mb-8">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-24 h-24 rounded-full border-4 border-green-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-green-600 text-white flex items-center justify-center text-4xl font-bold">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {user?.displayName || 'Anonymous User'}
                </h2>
                <p className="text-gray-600">{user?.email}</p>
                <div className="flex gap-2 mt-2">
                  {user?.emailVerified ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                      Not Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">User ID</h3>
                <p className="text-gray-800 font-mono text-sm break-all">{user?.uid}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Email</h3>
                <p className="text-gray-800">{user?.email}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Provider</h3>
                <p className="text-gray-800">
                  {user?.providerData.map(p => p.providerId).join(', ')}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Created At</h3>
                <p className="text-gray-800">
                  {user?.metadata.creationTime 
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Last Sign In</h3>
                <p className="text-gray-800">
                  {user?.metadata.lastSignInTime
                    ? new Date(user.metadata.lastSignInTime).toLocaleString()
                    : 'N/A'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Phone Number</h3>
                <p className="text-gray-800">{user?.phoneNumber || 'Not provided'}</p>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
                Edit Profile
              </button>
              <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold">
                Change Password
              </button>
            </div>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 bg-gray-900 text-green-400 rounded-lg p-4">
              <h3 className="text-sm font-bold mb-2">DEBUG INFO:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
