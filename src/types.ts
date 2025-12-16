export interface RayBanMetadataOptions {
  make?: string;
  model?: string;
  software?: string;
  lensModel?: string;
  createDate?: string;
  modifyDate?: string;
  cameraModelName?: string;
  deviceType?: string;
  captureMode?: string;
  audioChannels?: number;
  microphone?: string;
  fieldOfView?: string;
  imageStabilization?: string;
  comment?: string;
  gpsLatitude?: string;
  gpsLongitude?: string;
  gpsAltitude?: string;
  gpsLatitudeRef?: 'N' | 'S';
  gpsLongitudeRef?: 'E' | 'W';
}

export interface RayBanConfig {
  frontCamera?: boolean;
  hasAudio?: boolean;
  customDate?: string;
  latitude?: string;
  longitude?: string;
  altitude?: string;
  locationName?: string;
  customComment?: string;
}

export interface VideoFile {
  path: string;
  name: string;
  size: number;
  extension: string;
}
