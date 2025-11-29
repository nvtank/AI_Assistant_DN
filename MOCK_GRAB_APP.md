# 🚗 Mock Grab App - Booking System

## Overview
Mock Grab App mô phỏng toàn bộ trải nghiệm đặt xe Grab từ vị trí hiện tại đến điểm đích.

## Features

### 1. **Real-time Location Detection**
- Tự động lấy vị trí hiện tại của user làm điểm đón (pickup)
- Nhận điểm đích từ URL parameters

### 2. **Interactive Map**
- ✅ Hiển thị bản đồ với 2 markers: Pickup (xanh) và Destination (đỏ)
- ✅ Vẽ đường đi giữa 2 điểm
- ✅ Giới hạn trong phạm vi Đà Nẵng
- ✅ Auto-fit để hiển thị cả 2 điểm
- ✅ Animation driver di chuyển khi đã book

### 3. **Vehicle Selection**
Có 3 loại xe để chọn:

| Type | Icon | Description | Base Price | Per Km |
|------|------|-------------|------------|--------|
| GrabBike | 🏍️ | Fast & affordable | 10,000₫ | 5,000₫ |
| GrabCar | 🚗 | 4-seater, A/C | 20,000₫ | 10,000₫ |
| GrabCar Plus | 🚙 | 6-seater, premium | 30,000₫ | 15,000₫ |

### 4. **Booking Flow**

#### Step 1: Selecting Vehicle
- Hiển thị route info (pickup → destination)
- Show distance calculated
- List tất cả vehicle types với giá
- Estimated time: 2-5 min

#### Step 2: Confirming Booking
- Review chi tiết:
  - Base fare
  - Distance charge
  - Total price
- Cancel hoặc Confirm

#### Step 3: Finding Driver
- Loading state với animation
- "Finding a driver..." message

#### Step 4: Ride Booked
- Show driver info:
  - Name: "Driver Name"
  - Rating: ⭐ 4.9
  - Trips: 99 trips
  - License plate: 43A-123.45
- Driver marker xuất hiện trên map
- Animation: Driver di chuyển về phía pickup
- ETA: 5 minutes

## Usage

### From PlaceCard Component
Khi user click "Book Grab" button trên PlaceCard:

```typescript
// components/PlaceCard.tsx
const handleBookGrab = () => {
  openGrabApp(
    userLocation.lat,      // From (pickup)
    userLocation.lng,
    place.location.lat,    // To (destination)
    place.location.lng,
    place.name,           // Destination name
    true                  // useMockApp = true
  );
};
```

### Direct Link
```
/mock-grab?lat=16.0544&lng=108.2022&name=My%20Khe%20Beach&address=Da%20Nang
```

### URL Parameters
- `lat`: Destination latitude (required)
- `lng`: Destination longitude (required)
- `name`: Destination name (required)
- `address`: Full address (optional, defaults to name)

## Technical Details

### Components Structure
```
app/mock-grab/
├── page.tsx          # Main booking UI
└── GrabMap.tsx       # Interactive map component
```

### State Management
```typescript
bookingStep: 'selecting' | 'confirming' | 'booking' | 'booked'
```

### Price Calculation
```typescript
price = basePrice + (distance × pricePerKm)
```

Example:
- Vehicle: GrabCar
- Distance: 5km
- Price: 20,000₫ + (5 × 10,000₫) = 70,000₫

### Map Features
1. **Bounds Restriction**: Chỉ trong Đà Nẵng (15.9-16.2, 107.9-108.4)
2. **Custom Icons**:
   - Pickup: 📍 (green circle)
   - Destination: 🎯 (red circle)
   - Driver: 🏍️ (white circle with green border)
3. **Route Line**: Dashed green line giữa pickup & destination
4. **Driver Animation**: Smooth movement từ random position về pickup

## UI/UX Design

### Color Scheme
- Primary: `#00D170` (Grab Green)
- Success: `#00D170`
- Danger: `#FF0000`
- Background: White
- Text: Gray-800

### Responsive Design
- ✅ Mobile-first
- ✅ Touch-friendly buttons
- ✅ Smooth animations
- ✅ Fixed bottom panel (max 60vh)

### Loading States
1. Initial: "Loading Grab..."
2. Map loading: Spinner on gray background
3. Finding driver: Bouncing 🔍 icon
4. Booked: ✅ checkmark

## Testing

### Test Scenarios

1. **Happy Path**:
   ```
   User clicks "Book Grab" → Selects vehicle → Confirms → Driver found
   ```

2. **No Destination**:
   ```
   Open /mock-grab without params → Show error → Back to app
   ```

3. **Location Permission Denied**:
   ```
   Fallback to Da Nang center (16.0544, 108.2022)
   ```

4. **Map Interaction**:
   ```
   Zoom, pan → Restricted to Da Nang bounds
   ```

### Test URLs

**My Khe Beach**:
```
/mock-grab?lat=16.0413&lng=108.2425&name=My%20Khe%20Beach
```

**Ba Na Hills**:
```
/mock-grab?lat=15.9960&lng=107.9935&name=Ba%20Na%20Hills
```

**Dragon Bridge**:
```
/mock-grab?lat=16.0611&lng=108.2278&name=Dragon%20Bridge
```

## Future Enhancements

### Phase 2
- [ ] Multiple waypoints support
- [ ] Real-time traffic data
- [ ] Driver chat
- [ ] Payment integration
- [ ] Ride history
- [ ] Promo codes

### Phase 3
- [ ] Share ride location
- [ ] Schedule rides
- [ ] Favorite locations
- [ ] Multiple stops
- [ ] Driver tips

## Integration

### With Main App
```typescript
// lib/utils.ts
export function openGrabApp(
  fromLat, fromLng, toLat, toLng, toName,
  useMockApp = true  // Set to true for demo
)
```

### With Real Grab App
Set `useMockApp = false` to use real Grab deep links:
```
grab://open?sourceLocation=16.0544,108.2022&destinationLocation=16.0413,108.2425
```

## Performance

- **Initial Load**: < 1s
- **Map Render**: < 200ms
- **Route Calculation**: Instant
- **Driver Animation**: 50 steps @ 100ms = 5s total

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (iOS 14+)
- ✅ Mobile browsers

## Troubleshooting

### Map not showing
- Check Leaflet CSS is loaded
- Verify coordinates are valid
- Check console for errors

### Location not detected
- Check browser permissions
- Verify HTTPS (required for geolocation)
- Falls back to Da Nang center if fails

### Booking stuck
- Check console logs
- Refresh page
- Clear localStorage

## API Reference

### getCurrentLocation()
```typescript
Promise<Location>
// Returns: { lat, lng, address }
// Fallback: DA_NANG_CENTER
```

### calculateDistance()
```typescript
(lat1, lng1, lat2, lng2) => number
// Returns: distance in km
// Uses: Haversine formula
```

### formatDistance()
```typescript
(km: number) => string
// Examples: "500m", "2.5km"
```

## Credits

- **Maps**: OpenStreetMap
- **Icons**: Unicode Emoji
- **Routing**: Straight line (demo)
- **Prices**: Estimated mock data

---

**Demo App** - Not affiliated with real Grab service
Built with ❤️ using Next.js 14, Leaflet, TypeScript
