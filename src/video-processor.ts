import { exiftool } from 'exiftool-vendored';
import fs from 'fs/promises';
import path from 'path';
import { RayBanConfig, VideoFile } from './types';
import { MetadataGenerator } from './metadata-generator';

export class VideoProcessor {
  private static readonly VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.m4v', '.webm'];

  static async isVideoFile(filePath: string): Promise<boolean> {
    try {
      const ext = path.extname(filePath).toLowerCase();
      return this.VIDEO_EXTENSIONS.includes(ext);
    } catch {
      return false;
    }
  }

  static async getVideoFiles(directory: string): Promise<VideoFile[]> {
    const files = await fs.readdir(directory);
    const videoFiles: VideoFile[] = [];

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isFile() && await this.isVideoFile(filePath)) {
        videoFiles.push({
          path: filePath,
          name: file,
          size: stat.size,
          extension: path.extname(file)
        });
      }
    }

    return videoFiles;
  }

  static async addMetadata(
    inputPath: string,
    outputPath?: string,
    config: RayBanConfig = {}
  ): Promise<boolean> {
    try {
      if (!await this.isVideoFile(inputPath)) {
        throw new Error(`File is not a supported video: ${inputPath}`);
      }

      const finalOutputPath = outputPath || 
        this.generateOutputPath(inputPath, config.frontCamera);

      // Generate metadata
      const metadata = MetadataGenerator.generateMetadata(config);
      
      // Read existing metadata first
      const existingTags = await exiftool.read(inputPath);
      
      // Create new tags object, preserving important original tags
      const newTags = {
        ...existingTags,
        ...metadata,
        // Preserve video-specific tags
        Duration: existingTags.Duration,
        ImageSize: existingTags.ImageSize,
        FrameRate: existingTags.FrameRate,
        // Override with Ray-Ban metadata
        Make: metadata.make,
        Model: metadata.model,
        Software: metadata.software,
        LensModel: metadata.lensModel,
        CreateDate: metadata.createDate,
        ModifyDate: metadata.modifyDate,
        CameraModelName: metadata.cameraModelName,
        Comment: metadata.comment,
        GPSLatitude: metadata.gpsLatitude,
        GPSLongitude: metadata.gpsLongitude,
        GPSAltitude: metadata.gpsAltitude,
        GPSLatitudeRef: metadata.gpsLatitudeRef,
        GPSLongitudeRef: metadata.gpsLongitudeRef
      };

      // Write metadata
      await exiftool.write(finalOutputPath, newTags);
      
      // If output path is different, copy the file first
      if (finalOutputPath !== inputPath) {
        await fs.copyFile(inputPath, finalOutputPath);
        await exiftool.write(finalOutputPath, newTags);
      }

      return true;
    } catch (error) {
      console.error('Error processing video:', error);
      return false;
    }
  }

  private static generateOutputPath(inputPath: string, frontCamera?: boolean): string {
    const dir = path.dirname(inputPath);
    const name = path.basename(inputPath, path.extname(inputPath));
    const ext = path.extname(inputPath);
    const suffix = frontCamera ? '_rayban_front' : '_rayban';
    
    return path.join(dir, `${name}${suffix}${ext}`);
  }

  static async batchProcess(
    directory: string,
    outputDir?: string,
    config: RayBanConfig = {}
  ): Promise<{ success: number; failed: number; total: number }> {
    const videoFiles = await this.getVideoFiles(directory);
    const results = { success: 0, failed: 0, total: videoFiles.length };

    for (const videoFile of videoFiles) {
      try {
        const outputPath = outputDir ? 
          path.join(outputDir, `rayban_${videoFile.name}`) : 
          undefined;

        const success = await this.addMetadata(videoFile.path, outputPath, config);
        
        if (success) {
          results.success++;
          console.log(`✅ Processed: ${videoFile.name}`);
        } else {
          results.failed++;
          console.log(`❌ Failed: ${videoFile.name}`);
        }
      } catch (error) {
        results.failed++;
        console.error(`❌ Error processing ${videoFile.name}:`, error);
      }
    }

    return results;
  }

  static async verifyMetadata(filePath: string): Promise<boolean> {
    try {
      const tags = await exiftool.read(filePath);
      const requiredTags = ['Make', 'Model', 'Software', 'LensModel'];
      
      return requiredTags.every(tag => 
        tags[tag as keyof typeof tags] && 
        (tags[tag as keyof typeof tags] as string).includes('Ray-Ban') || 
        (tags[tag as keyof typeof tags] as string).includes('Meta')
      );
    } catch {
      return false;
    }
  }
}
