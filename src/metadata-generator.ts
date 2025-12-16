import { RayBanMetadataOptions, RayBanConfig } from './types';
import { RAYBAN_PRESETS } from './constants';

export class MetadataGenerator {
  static generateMetadata(config: RayBanConfig = {}): RayBanMetadataOptions {
    const {
      frontCamera = false,
      hasAudio = true,
      customDate,
      latitude,
      longitude,
      altitude,
      locationName,
      customComment
    } = config;

    const preset = frontCamera ? RAYBAN_PRESETS.FRONT_CAMERA : RAYBAN_PRESETS.MAIN_CAMERA;
    const date = customDate || new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Use custom location or preset location
    let location;
    if (latitude && longitude) {
      location = { lat: latitude, lon: longitude, alt: altitude || '5' };
    } else if (locationName && RAYBAN_PRESETS.LOCATIONS[locationName as keyof typeof RAYBAN_PRESETS.LOCATIONS]) {
      location = RAYBAN_PRESETS.LOCATIONS[locationName as keyof typeof RAYBAN_PRESETS.LOCATIONS];
    } else {
      location = frontCamera ? 
        RAYBAN_PRESETS.LOCATIONS['new-york'] : 
        RAYBAN_PRESETS.LOCATIONS['san-francisco'];
    }

    const metadata: RayBanMetadataOptions = {
      make: preset.make,
      model: preset.model,
      software: preset.software,
      lensModel: preset.lensModel,
      createDate: date,
      modifyDate: date,
      cameraModelName: preset.cameraModelName,
      deviceType: preset.deviceType,
      captureMode: preset.captureMode,
      audioChannels: hasAudio ? preset.audioChannels : 0,
      microphone: hasAudio ? preset.microphone : 'None',
      fieldOfView: preset.fieldOfView,
      imageStabilization: preset.imageStabilization,
      comment: customComment || preset.defaultComment,
      gpsLatitude: location.lat,
      gpsLongitude: location.lon,
      gpsAltitude: location.alt,
      gpsLatitudeRef: preset.gpsLatitudeRef,
      gpsLongitudeRef: preset.gpsLongitudeRef
    };

    return metadata;
  }

  static getMetadataAsExifArgs(metadata: RayBanMetadataOptions): string[] {
    const args: string[] = [];
    
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convert camelCase to PascalCase for EXIF tags
        const exifKey = key.replace(/([A-Z])/g, '-$1').toUpperCase();
        args.push(`-${exifKey}=${value}`);
      }
    });

    return args;
  }

  static generateSummary(metadata: RayBanMetadataOptions): string {
    return `
📱 Device: ${metadata.make} ${metadata.model}
📸 Lens: ${metadata.lensModel}
🎥 Mode: ${metadata.captureMode}
🎤 Audio: ${metadata.audioChannels} channels (${metadata.microphone})
👁️ FOV: ${metadata.fieldOfView}
📍 Location: ${metadata.gpsLatitude}, ${metadata.gpsLongitude}
🗓️ Date: ${metadata.createDate}
📝 Note: ${metadata.comment}
    `.trim();
  }
}
