'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-3 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">My Profile</h1>
            <button
              onClick={() => router.push('/')}
              className="px-3 sm:px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 font-semibold text-sm sm:text-base"
            >
              Back to Home
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-green-500"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-600 text-white flex items-center justify-center text-3xl sm:text-4xl font-bold">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
              )}
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                  {user?.displayName || 'Anonymous User'}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 break-all">{user?.email}</p>
                <div className="flex gap-2 mt-2 justify-center sm:justify-start">
                  {user?.emailVerified ? (
                    <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs sm:text-sm font-semibold">
                      Not Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">User ID</h3>
                <p className="text-xs sm:text-sm text-gray-800 font-mono break-all">{user?.uid}</p>
              </div>

              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Email</h3>
                <p className="text-xs sm:text-sm text-gray-800 break-all">{user?.email}</p>
              </div>

              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Provider</h3>
                <p className="text-xs sm:text-sm text-gray-800">
                  {user?.providerData.map(p => p.providerId).join(', ')}
                </p>
              </div>

              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Created At</h3>
                <p className="text-xs sm:text-sm text-gray-800">
                  {user?.metadata.creationTime 
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>

              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Last Sign In</h3>
                <p className="text-xs sm:text-sm text-gray-800">
                  {user?.metadata.lastSignInTime
                    ? new Date(user.metadata.lastSignInTime).toLocaleString()
                    : 'N/A'}
                </p>
              </div>

              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Phone Number</h3>
                <p className="text-xs sm:text-sm text-gray-800">{user?.phoneNumber || 'Not provided'}</p>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
                Edit Profile
              </button>
              <button className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold">
                Change Password
              </button>
            </div>
          </div>

          {/* {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 sm:mt-6 bg-gray-900 text-green-400 rounded-lg p-3 sm:p-4">
              <h3 className="text-xs sm:text-sm font-bold mb-2">DEBUG INFO:</h3>
              <pre className="text-[10px] sm:text-xs overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )} */}
        </div>
      </div>
    </ProtectedRoute>
  );
}
