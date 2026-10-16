/**
 * REGION SECURITY GUARD - MOCK DATA
 * Demo data stored locally. No backend or database required.
 */

export const MOCK_GUARD = {
  name: "Muthamizh",
  id: "G-1001",
  role: "Senior Security Officer",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
};

/**
 * ============================================================================
 * SITE GEOFENCE CONFIGURATION
 * 
 * 📍 HOW TO TEST REAL GPS CLOCK-IN:
 * Replace lat and lng below with your current GPS coordinates.
 * To find your current coordinates, open Google Maps or check the GPS coordinates
 * displayed on the "Clock" tab of this app.
 * 
 * Alternatively, keep "Demo Mode" toggled ON in the app to bypass geofence checks anywhere.
 * ============================================================================
 */
export const MOCK_SITE = {
  name: "MHZ Office",
  address: "Harivardhan street,Chennai",
  lat: 12.964887, // <-- Replace with your current latitude to test real geofence
  lng: 80.249218, // <-- Replace with your current longitude to test real geofence
  radius: 100,  // Allowed clock-in perimeter in metres
};

export const MOCK_SHIFT = {
  timeLabel: "Today 18:00 - 06:00",
  startTime: "18:00",
  endTime: "06:00",
  shiftType: "Night Guard Shift",
  patrolIntervalMinutes: 60,
};

export const MOCK_CHECKPOINTS = [
  {
    id: "CP-001",
    name: "reception",
    location: "reception Area",
    order: 1,
  },
  {
    id: "CP-002",
    name: "kitchen",
    location: "kitchen Area",
    order: 2,
  },
  {
    id: "CP-003",
    name: "working space",
    location: "working space Area",
    order: 3,
  },
  {
    id: "CP-004",
    name: "meeting room",
    location: "meeting room Area",
    order: 4,
  },
];

/**
 * ============================================================================
 * SOS EMERGENCY CONTACT
 * Replace with your test telephone number (E.164 international format recommended).
 * ============================================================================
 */
export const SOS_CONTACT_NUMBER = "+919360724594";

/**
 * Control Room Details for Display
 */
export const CONTROL_ROOM = {
  name: "National Operations Control Centre",
  code: "NOCC-01",
  frequency: "CH-04 (VHF)",
};
