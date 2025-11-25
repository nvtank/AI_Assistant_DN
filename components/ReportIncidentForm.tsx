'use client';

import { useState, useRef } from 'react';
import { Incident, INCIDENT_TYPES, Location, SEVERITY_LEVELS } from '@/lib/types';
import { broadcastIncident, uploadImage } from '@/lib/pusher';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  const [type, setType] = useState<keyof typeof INCIDENT_TYPES>('flooding');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
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

    try {
      // Request notification permission when user interacts (submits report)
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      let imageUrl = '';

      // Upload image if exists (via Firebase Storage API)
      if (image) {
        console.log('📤 Uploading image...');
        imageUrl = await uploadImage(image);
        console.log('✅ Image uploaded:', imageUrl);
      }

      // Prepare incident data
      const incidentData: Partial<Incident> = {
        type,
        severity,
        description,
        location,
        imageUrl,
        status: 'pending',
        createdAt: new Date(),
      };

      // Save to Firestore
      console.log('💾 Saving incident to Firestore...');
      const docRef = await addDoc(collection(db, 'incidents'), incidentData);
      
      const savedIncident: Incident = {
        ...incidentData as Incident,
        id: docRef.id,
      };

      // Broadcast to all clients via Pusher
      console.log('📡 Broadcasting incident...');
      await broadcastIncident(savedIncident);

      setLoading(false);
      alert('✅ Incident reported successfully! We will verify and notify other users.');
      onSuccess?.();

    } catch (error: any) {
      console.error('❌ Error reporting incident:', error);
      alert('❌ An error occurred: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      <h2 className="text-2xl font-bold mb-4 text-grab-dark">
        📍 Report Incident
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Incident Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Incident Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(INCIDENT_TYPES).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => setType(key as keyof typeof INCIDENT_TYPES)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  type === key
                    ? 'border-grab-green bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{value.icon}</div>
                <div className="text-sm font-medium">{value.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Severity Level
          </label>
          <div className="flex gap-2">
            {Object.entries(SEVERITY_LEVELS).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSeverity(key as 'low' | 'medium' | 'high')}
                className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                  severity === key
                    ? `border-2`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  borderColor: severity === key ? value.color : undefined,
                  backgroundColor: severity === key ? `${value.color}20` : undefined,
                }}
              >
                <div className="text-sm font-medium">{value.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-grab-green focus:border-transparent"
            placeholder="Example: Flooded 30cm deep, impassable..."
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-grab-green transition-colors"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded" />
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-2">📸</div>
                <div className="text-sm text-gray-600">Click to capture/select image</div>
              </div>
            )}
          </button>
        </div>

        {/* Location Info */}
        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
          📍 Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !description}
            className="flex-1 px-4 py-2 bg-grab-green text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Submitting...' : '✅ Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
