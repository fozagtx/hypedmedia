export const RAYBAN_PRESETS = {
  FRONT_CAMERA: {
    make: 'Meta',
    model: 'Ray-Ban Stories',
    software: 'Meta Camera v2.1.4',
    lensModel: 'Ray-Ban Stories Front Camera 5.5mm f/2.0',
    cameraModelName: 'Meta Ray-Ban Stories',
    deviceType: 'Smart Glasses',
    captureMode: 'Video',
    audioChannels: 2,
    microphone: 'Beamforming Array',
    fieldOfView: '87°',
    imageStabilization: 'Electronic',
    gpsLatitude: '40.7128',
    gpsLongitude: '-74.0060',
    gpsAltitude: '10',
    gpsLatitudeRef: 'N' as const,
    gpsLongitudeRef: 'W' as const,
    defaultComment: 'Recorded on Meta Ray-Ban Smart Glasses - First-person perspective'
  },
  MAIN_CAMERA: {
    make: 'Meta',
    model: 'Ray-Ban Meta',
    software: 'Meta Camera v3.0.1',
    lensModel: 'Ray-Ban Stories Wide Angle 12mm f/1.8',
    cameraModelName: 'Meta Ray-Ban',
    deviceType: 'Smart Glasses Camera',
    captureMode: 'Hands-free Video',
    audioChannels: 4,
    microphone: '5-microphone array with noise cancellation',
    fieldOfView: '120° ultra-wide',
    imageStabilization: 'Optical + Electronic',
    gpsLatitude: '37.7749',
    gpsLongitude: '-122.4194',
    gpsAltitude: '5',
    gpsLatitudeRef: 'N' as const,
    gpsLongitudeRef: 'W' as const,
    defaultComment: 'Captured with Meta Ray-Ban Smart Glasses - Hands-free recording'
  },
  LOCATIONS: {
    'new-york': { lat: '40.7128', lon: '-74.0060', alt: '10' },
    'san-francisco': { lat: '37.7749', lon: '-122.4194', alt: '5' },
    'london': { lat: '51.5074', lon: '-0.1278', alt: '15' },
    'tokyo': { lat: '35.6762', lon: '139.6503', alt: '20' },
    'paris': { lat: '48.8566', lon: '2.3522', alt: '35' },
    'default': { lat: '37.7749', lon: '-122.4194', alt: '5' }
  }
} as const;
