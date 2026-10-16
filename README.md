# 🛡️ Region Security Guard — Mobile Demo App

A modern, standalone React Native mobile application built with **Expo SDK** and **React Navigation**, designed for security guard shift operations, GPS perimeter clock-ins, QR checkpoint patrols, and emergency SOS distress dispatch.

> **DEMO APPLICATION**: All operations use local mock data persisted in `@react-native-async-storage/async-storage`. No backend or database required. Compatible with **Expo Go** on iOS and Android.

---

## 📱 Features

1. **Dashboard / Home**:
   - Guard profile (`Raj Kumar`, ID: `G-1001`), assigned site (`FIEGE Birmingham - Gatehouse`), shift time (`18:00 - 06:00`).
   - Live shift timer with digital count-up (`HH:MM:SS`) after clock-in.
   - GPS perimeter status badge (`INSIDE ZONE` / `OUTSIDE ZONE` / `DEMO BYPASS`).
   - Patrol progress tracker (`X of 4 completed`) with progress bar.
   - Quick one-tap Clock In / Clock Out action.
   - High-visibility **Emergency Red SOS Button** at the bottom.

2. **Time & Attendance (Clock In/Out)**:
   - On tap, requests location permissions and fetches GPS position.
   - Computes distance to the site gatehouse using the **Haversine formula**.
   - If distance $\le 100\text{m}$, marks shift as **Clocked In** and stores timestamp.
   - If outside zone, displays exact distance away (e.g. `1240 m away`).
   - **Demo Mode Toggle**: Bypass geofence checks with 1-tap to test clock-in from any location or simulator.
   - Clock Out stops shift timer and records departure timestamp.

3. **QR Patrol Route**:
   - Guard can only scan checkpoints while clocked in on duty.
   - Displays all 4 checkpoints:
     - `CP-001`: Main gate (North Perimeter Gatehouse & Barrier)
     - `CP-002`: Warehouse entrance (Docking Bay 1-4 Personnel Door)
     - `CP-003`: Container yard (Zone C Stacking Area Lighting Mast)
     - `CP-004`: Rear boundary (South Perimeter Fence & Emergency Exit)
   - "SCAN CHECKPOINT" triggers fullscreen camera scanner using `expo-camera` (`CameraView` barcode scanner).
   - Validates QR data; prevents duplicate scans with friendly alerts; rejects invalid QRs.
   - Includes quick-test simulator buttons inside the scanner for testing without a physical camera or printout.
   - "Reset Demo Progress" button to clear checkpoints.

4. **Emergency SOS System**:
   - Tapping SOS prompts confirmation dialog: *"🚨 Send emergency alert?"*.
   - On confirmation, gets GPS coordinates and opens the native SMS app via `expo-sms` with prefilled text:
     ```text
     SOS! Guard Raj Kumar, FIEGE Birmingham, 18:35:10, location: https://maps.google.com/?q=13.0827,80.2707
     ```
   - In-app modal shows: *"Alert sent to control room..."*, then automatically updates after 3 seconds to:
     ```text
     Control room acknowledged ✓
     ```
   - Built-in button and code comment showing how to route directly to WhatsApp via `wa.me`.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies (Already Completed)

```bash
npm install
```

### 2. Start the Expo Dev Server

```bash
npx expo start
```

### 3. Open in Expo Go

- **Physical Phone**:
  - Open **Expo Go** on Android (scan QR code in terminal) or Camera app on iOS.
- **Web / Simulator**:
  - Press `w` in terminal for web preview, `a` for Android Emulator, or `i` for iOS Simulator.

---

## 🏷️ Testing QR Checkpoints

We provide a dedicated test page with high-contrast QR codes for `CP-001` through `CP-004`:

1. Open `qr-test-codes.html` in your web browser:
   - Double-click `qr-test-codes.html` in your file explorer, or open it directly in Chrome/Edge/Safari.
2. In the app, navigate to **QR Patrol** $\rightarrow$ tap **SCAN CHECKPOINT**.
3. Point your camera at the QR code displayed on your computer monitor!
4. Alternatively, use the **Quick Demo Simulator** buttons located at the bottom of the scanner modal.

---

## 📍 Testing Real GPS Geofencing

By default, **Demo Mode** is enabled so you can test clock-in anywhere in the world.

To test real geofence checking:
1. Open [`src/data/mockData.js`](file:///c:/Users/DELL/Desktop/app/src/data/mockData.js).
2. Look at the `MOCK_SITE` object:
   ```javascript
   export const MOCK_SITE = {
     name: "FIEGE Birmingham - Gatehouse",
     lat: 13.0827, // <-- Replace with your current latitude
     lng: 80.2707, // <-- Replace with your current longitude
     radius: 100,  // Radius in metres
   };
   ```
3. Open the **Clock In/Out** tab in the app and toggle **Demo Mode OFF**.
4. Tap **CLOCK IN TO SHIFT**. If you are within 100 meters, it succeeds; if farther, it shows your distance away!

---

## 💬 WhatsApp vs SMS SOS Routing

In [`src/components/SosModal.js`](file:///c:/Users/DELL/Desktop/app/src/components/SosModal.js), the default emergency alert uses `expo-sms`. 

To trigger WhatsApp automatically via `Linking`, see the commented block:
```javascript
// Open WhatsApp directly:
const cleanPhone = SOS_CONTACT_NUMBER.replace(/[^\d]/g, '');
const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
await Linking.openURL(waUrl);
```
The modal also includes a direct **"Open in WhatsApp"** button for immediate testing.

---

## 📁 Project Architecture

```text
app/
├── App.js                     # Root navigation & bottom tab configuration
├── app.json                   # Expo SDK 57 config, plugins & permissions
├── qr-test-codes.html         # Printable/screen-displayable QR codes (CP-001 to CP-004)
├── package.json               # Expo & React Native dependencies
└── src/
    ├── components/
    │   ├── CameraScannerModal.js  # CameraView QR barcode scanner with target frame
    │   ├── CheckpointCard.js      # Checkpoint card with status badge & scan trigger
    │   ├── Header.js              # Dark navy header with active duty pulse
    │   ├── ShiftTimer.js          # Live counting shift timer (HH:MM:SS)
    │   ├── SosModal.js            # Emergency SOS modal & 3s control room acknowledgment
    │   └── StatusBadge.js         # Status badge utilities (Duty, Geofence, Checkpoints)
    ├── data/
    │   └── mockData.js            # Guard, Site, Shift, Checkpoints, and SOS numbers
    ├── screens/
    │   ├── HomeScreen.js          # Dashboard with profile, live timer, patrol bar & SOS
    │   ├── ClockScreen.js         # GPS Haversine verification & Demo Mode toggle
    │   └── PatrolScreen.js        # Patrol checkpoint checklist & scanner launcher
    ├── store/
    │   └── useGuardStore.js       # Zustand state management with AsyncStorage persistence
    └── utils/
        ├── formatters.js          # Time, dates, elapsed seconds & SOS message templates
        └── haversine.js           # Haversine distance and geofence calculation formula
```

---

## ✅ Quality & Health Verification

- `npx expo-doctor` passed with **21/21 checks passing**.
- Validated with Expo SDK 57, React 19, and React Native 0.86.
