// Demo script to add sample incidents for testing
// Run this in browser console: copy and paste the entire code

const sampleIncidents = [
  {
    type: 'flooding',
    severity: 'high',
    description: 'Ngập nước nghiêm trọng sau cơn mưa lớn, nước ngập cao tới 50cm',
    location: {
      lat: 16.0544,
      lng: 108.2022,
      address: 'Đường Trần Phú, Hải Châu, Đà Nẵng'
    },
    reportedBy: 'user@example.com'
  },
  {
    type: 'pothole',
    severity: 'medium',
    description: 'Ổ gà lớn trên đường, nguy hiểm cho xe máy',
    location: {
      lat: 16.0678,
      lng: 108.2208,
      address: 'Đường Lê Duẩn, Thanh Khê, Đà Nẵng'
    },
    reportedBy: 'user@example.com'
  },
  {
    type: 'construction',
    severity: 'low',
    description: 'Đang thi công sửa chữa đường, giao thông bị ảnh hưởng nhẹ',
    location: {
      lat: 16.0471,
      lng: 108.2068,
      address: 'Đường Nguyễn Văn Linh, Hải Châu, Đà Nẵng'
    },
    reportedBy: 'user@example.com'
  },
  {
    type: 'traffic',
    severity: 'high',
    description: 'Tắc đường nghiêm trọng vào giờ cao điểm',
    location: {
      lat: 16.0735,
      lng: 108.2230,
      address: 'Cầu Rồng, Hải Châu, Đà Nẵng'
    },
    reportedBy: 'user@example.com'
  },
  {
    type: 'flooding',
    severity: 'medium',
    description: 'Nước đọng sau mưa, ảnh hưởng giao thông',
    location: {
      lat: 16.0611,
      lng: 108.2228,
      address: 'Đường 2 Tháng 9, Hải Châu, Đà Nẵng'
    },
    reportedBy: 'admin@example.com'
  }
];

// Function to add sample incidents
function addSampleIncidents() {
  const PENDING_INCIDENTS_KEY = 'grab_pending_incidents';
  
  const existingPending = localStorage.getItem(PENDING_INCIDENTS_KEY);
  const pendingIncidents = existingPending ? JSON.parse(existingPending) : [];
  
  sampleIncidents.forEach((incident, index) => {
    const newIncident = {
      ...incident,
      id: `incident_demo_${Date.now()}_${index}`,
      status: 'pending',
      createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() // Random time in last 24h
    };
    pendingIncidents.push(newIncident);
  });
  
  localStorage.setItem(PENDING_INCIDENTS_KEY, JSON.stringify(pendingIncidents));
  
  console.log('✅ Added', sampleIncidents.length, 'sample incidents!');
  console.log('Go to /admin to approve them');
}

// Function to clear all incidents
function clearAllIncidents() {
  localStorage.removeItem('grab_pending_incidents');
  localStorage.removeItem('grab_incidents');
  console.log('✅ Cleared all incidents!');
}

// Add sample incidents
console.log('🚀 Demo Data Script Loaded!');
console.log('Commands:');
console.log('  addSampleIncidents() - Add 5 sample incidents');
console.log('  clearAllIncidents() - Clear all data');
console.log('');
console.log('Run: addSampleIncidents()');
