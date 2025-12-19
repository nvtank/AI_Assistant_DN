'use client';

import React, { useState, useRef } from 'react';
import { Incident, INCIDENT_TYPES, Location, SEVERITY_LEVELS } from '@/lib/types';
import { reportIncident } from '@/lib/incidentServiceFirebase';
import { uploadToCloudinary, fileToBase64 } from '@/lib/cloudinaryService';
import { useAuth } from '../auth/AuthProvider';

interface ReportIncidentFormProps {
  location: Location;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReportIncidentForm({
  location,
  onSuccess,
  onCancel,
}: ReportIncidentFormProps) {
  const { user } = useAuth();
  const [type, setType] = useState<keyof typeof INCIDENT_TYPES>('flooding');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'critical'>('medium');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);

    try {
      let imageUrl = '';

      // Upload image to Cloudinary if provided
      if (image) {
        setUploadProgress(50);
        try {
          imageUrl = await uploadToCloudinary(image);
        } catch (cloudError) {
          // Fallback to base64 if Cloudinary fails
          imageUrl = imagePreview;
        }
      }

      setUploadProgress(75);

      // Report incident to Firebase
      const newIncident = await reportIncident({
        type,
        severity_level: severity,
        description,
        location,
        imageUrl,
        user: user?.email || 'Anonymous',
        status: 'pending',
      });

      setUploadProgress(100);
      setLoading(false);

      // Show success message
      alert('Report submitted successfully. Your report is pending admin approval.');

      onSuccess?.();

    } catch (error: any) {
      alert('An error occurred while submitting your report. Please try again.');
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="glass rounded-3xl shadow-2xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/30 backdrop-blur-xl">
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900">
        Report Incident
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {/* Incident Type */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Incident Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(INCIDENT_TYPES).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => setType(key as keyof typeof INCIDENT_TYPES)}
                className={`p-2 sm:p-3 rounded-xl border-2 transition-all ${
                  type === key
                    ? 'border-grab-green bg-grab-green/10 shadow-md'
                    : 'glass border-white/30 hover:border-grab-green/50 hover:bg-white/60'
                }`}
              >
                <div className="text-xl sm:text-2xl mb-1">{value.icon}</div>
                <div className="text-xs sm:text-sm font-medium text-gray-800">{value.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Severity Level
          </label>
          <div className="flex gap-2">
            {Object.entries(SEVERITY_LEVELS).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSeverity(key as 'low' | 'medium' | 'critical')}
                className={`flex-1 p-2 rounded-xl border-2 transition-all ${
                  severity === key
                    ? `shadow-md`
                    : 'glass border-white/30 hover:bg-white/60'
                }`}
                style={{
                  borderColor: severity === key ? value.color : undefined,
                  backgroundColor: severity === key ? `${value.color}20` : undefined,
                }}
              >
                <div className="text-xs sm:text-sm font-medium text-gray-800">{value.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Detailed Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="w-full px-3 py-2 text-sm sm:text-base glass border border-white/30 rounded-xl focus:ring-2 focus:ring-grab-green focus:border-grab-green outline-none text-gray-800"
            placeholder="Example: Flooded 30cm deep..."
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Image (optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-3 sm:p-4 border-2 border-dashed glass border-white/30 rounded-xl hover:border-grab-green/50 transition-all"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="max-h-32 sm:max-h-40 mx-auto rounded-xl" />
            ) : (
              <div className="text-center">
                <div className="text-3xl sm:text-4xl mb-2">📸</div>
                <div className="text-xs sm:text-sm text-gray-600">Click to capture/select image</div>
              </div>
            )}
          </button>
        </div>

        {/* Location Info */}
        <div className="glass p-2 sm:p-3 rounded-xl text-xs sm:text-sm text-gray-600 border border-white/30">
          📍 Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
        </div>

        {/* Progress Bar */}
        {loading && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-grab-green h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base glass border border-white/30 rounded-xl hover:bg-white/60 transition-colors disabled:opacity-50 text-gray-700 font-medium"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !description}
            className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-grab-green text-white rounded-xl hover:bg-[#009640] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
          >
            {loading ? `⏳ Uploading... ${uploadProgress}%` : '✅ Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
