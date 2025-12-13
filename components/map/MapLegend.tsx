'use client';

import React from 'react';

export default function MapLegend() {
  return (
    <div className="absolute top-4 right-4 glass rounded-2xl shadow-lg p-3 z-[400] border border-white/30">
      <h3 className="font-semibold text-xs mb-2 uppercase tracking-wider text-gray-600">Legend</h3>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div className="flex items-center gap-2 text-gray-700">
          <span>🌊</span>
          <span>Flooding</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <span>🕳️</span>
          <span>Pothole</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <span>🚧</span>
          <span>Construction</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <span>🚗</span>
          <span>Traffic Jam</span>
        </div>
      </div>
    </div>
  );
}

