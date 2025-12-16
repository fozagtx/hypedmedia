import { exiftool } from 'exiftool-vendored';
import fs from 'fs/promises';
import path from 'path';
import { RayBanConfig, VideoFile } from './types';
import { MetadataGenerator } from './metadata-generator';
import { FFmpegProcessor, ProcessingOptions, VideoInfo } from './ffmpeg-processor';

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
    config: RayBanConfig = {},
    processVideo: boolean = false,
    processingOptions?: ProcessingOptions,
    progressCallback?: (percent: number) => void
  ): Promise<boolean> {
    try {
      if (!await this.isVideoFile(inputPath)) {
        throw new Error(`File is not a supported video: ${inputPath}`);
      }

      const finalOutputPath = outputPath ||
        this.generateOutputPath(inputPath, config.frontCamera);

      // Generate metadata
      const metadata = MetadataGenerator.generateMetadata(config);

      let processingPath = inputPath;

      // Process video with FFmpeg if requested
      if (processVideo) {
        const tempOutputPath = this.generateTempPath(inputPath, 'processed');

        await FFmpegProcessor.processVideo(
          inputPath,
          tempOutputPath,
          processingOptions,
          config,
          progressCallback
        );

        processingPath = tempOutputPath;
      }

      // Copy file to final output path if different
      if (finalOutputPath !== processingPath) {
        await fs.copyFile(processingPath, finalOutputPath);
      }

      // Only write writable Ray-Ban metadata tags
      const writableTags = {
        Make: metadata.make,
        Model: metadata.model,
        Software: metadata.software,
        LensModel: metadata.lensModel,
        CreateDate: metadata.createDate,
        ModifyDate: metadata.modifyDate,
        Comment: metadata.comment,
        GPSLatitude: metadata.gpsLatitude,
        GPSLongitude: metadata.gpsLongitude,
        GPSAltitude: metadata.gpsAltitude,
        GPSLatitudeRef: metadata.gpsLatitudeRef,
        GPSLongitudeRef: metadata.gpsLongitudeRef
      };

      // Write only the Ray-Ban specific metadata
      await exiftool.write(finalOutputPath, writableTags);

      // Clean up temporary file if created
      if (processVideo && processingPath !== inputPath) {
        try {
          await fs.unlink(processingPath);
        } catch {
          // Ignore cleanup errors
        }
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

  private static generateTempPath(inputPath: string, suffix: string): string {
    const dir = path.dirname(inputPath);
    const name = path.basename(inputPath, path.extname(inputPath));
    const ext = path.extname(inputPath);
    const timestamp = Date.now();

    return path.join(dir, `${name}_${suffix}_${timestamp}${ext}`);
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

  /**
   * Get detailed video information using FFmpeg
   */
  static async getVideoInfo(filePath: string): Promise<VideoInfo> {
    return FFmpegProcessor.getVideoInfo(filePath);
  }

  /**
   * Process and optimize video for Ray-Ban with metadata
   */
  static async processAndAddMetadata(
    inputPath: string,
    outputPath?: string,
    config: RayBanConfig = {},
    processingOptions?: ProcessingOptions,
    progressCallback?: (percent: number) => void
  ): Promise<boolean> {
    return this.addMetadata(inputPath, outputPath, config, true, processingOptions, progressCallback);
  }

  /**
   * Optimize video for Ray-Ban format
   */
  static async optimizeForRayBan(
    inputPath: string,
    outputPath?: string,
    config: RayBanConfig = {},
    progressCallback?: (percent: number) => void
  ): Promise<boolean> {
    try {
      const finalOutputPath = outputPath ||
        this.generateOutputPath(inputPath, config.frontCamera, 'optimized');

      const success = await FFmpegProcessor.optimizeForRayBan(
        inputPath,
        finalOutputPath,
        config,
        progressCallback
      );

      if (success) {
        // Add metadata after optimization
        const metadata = MetadataGenerator.generateMetadata(config);
        const writableTags = {
          Make: metadata.make,
          Model: metadata.model,
          Software: metadata.software,
          LensModel: metadata.lensModel,
          CreateDate: metadata.createDate,
          ModifyDate: metadata.modifyDate,
          Comment: metadata.comment,
          GPSLatitude: metadata.gpsLatitude,
          GPSLongitude: metadata.gpsLongitude,
          GPSAltitude: metadata.gpsAltitude,
          GPSLatitudeRef: metadata.gpsLatitudeRef,
          GPSLongitudeRef: metadata.gpsLongitudeRef
        };

        await exiftool.write(finalOutputPath, writableTags);
      }

      return success;
    } catch (error) {
      console.error('Error optimizing video:', error);
      return false;
    }
  }

  /**
   * Create thumbnail from video
   */
  static async createThumbnail(
    inputPath: string,
    outputPath?: string,
    timestamp: string = '00:00:01',
    size: string = '320x240'
  ): Promise<boolean> {
    const finalOutputPath = outputPath ||
      inputPath.replace(path.extname(inputPath), '_thumb.jpg');

    return FFmpegProcessor.createThumbnail(inputPath, finalOutputPath, timestamp, size);
  }

  /**
   * Extract frames from video
   */
  static async extractFrames(
    inputPath: string,
    outputDir?: string,
    interval: number = 1,
    format: 'jpg' | 'png' = 'jpg'
  ): Promise<string[]> {
    const finalOutputDir = outputDir ||
      path.join(path.dirname(inputPath), `${path.basename(inputPath, path.extname(inputPath))}_frames`);

    return FFmpegProcessor.extractFrames(inputPath, finalOutputDir, interval, format);
  }

  /**
   * Merge multiple Ray-Ban videos
   */
  static async mergeVideos(
    inputPaths: string[],
    outputPath: string,
    config: RayBanConfig = {},
    progressCallback?: (percent: number) => void
  ): Promise<boolean> {
    try {
      // Merge videos with FFmpeg
      const success = await FFmpegProcessor.mergeVideos(
        inputPaths,
        outputPath,
        config,
        progressCallback
      );

      if (success) {
        // Add Ray-Ban metadata to merged video
        const metadata = MetadataGenerator.generateMetadata(config);
        const writableTags = {
          Make: metadata.make,
          Model: metadata.model,
          Software: metadata.software,
          LensModel: metadata.lensModel,
          CreateDate: metadata.createDate,
          ModifyDate: metadata.modifyDate,
          Comment: `${metadata.comment} - Merged from ${inputPaths.length} clips`,
          GPSLatitude: metadata.gpsLatitude,
          GPSLongitude: metadata.gpsLongitude,
          GPSAltitude: metadata.gpsAltitude,
          GPSLatitudeRef: metadata.gpsLatitudeRef,
          GPSLongitudeRef: metadata.gpsLongitudeRef
        };

        await exiftool.write(outputPath, writableTags);
      }

      return success;
    } catch (error) {
      console.error('Error merging videos:', error);
      return false;
    }
  }

  /**
   * Analyze video and provide recommendations
   */
  static async analyzeVideo(filePath: string): Promise<{
    info: VideoInfo;
    recommendations: string[];
    rayBanCompatibility: 'excellent' | 'good' | 'fair' | 'poor';
  }> {
    const info = await this.getVideoInfo(filePath);
    const recommendations: string[] = [];
    let compatibility: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';

    // Analyze resolution
    if (info.width < 1280 || info.height < 720) {
      recommendations.push('Consider upscaling to at least 720p for better Ray-Ban compatibility');
      compatibility = 'poor';
    }

    // Analyze frame rate
    if (info.fps < 24) {
      recommendations.push('Frame rate below 24fps may result in choppy playback');
      compatibility = compatibility === 'excellent' ? 'fair' : compatibility;
    }

    // Analyze bitrate
    if (info.bitrate < 1000000) { // Less than 1Mbps
      recommendations.push('Low bitrate detected, consider increasing quality');
      compatibility = compatibility === 'excellent' ? 'good' : compatibility;
    }

    // Ray-Ban specific recommendations
    if (info.width !== info.height && info.width / info.height !== 16/9) {
      recommendations.push('Consider cropping to 1:1 aspect ratio for Ray-Ban Stories compatibility');
    }

    return {
      info,
      recommendations,
      rayBanCompatibility: compatibility
    };
  }

  /**
   * Check FFmpeg availability
   */
  static async checkFFmpegAvailability(): Promise<boolean> {
    return FFmpegProcessor.checkFFmpegAvailability();
  }

  /**
   * Get FFmpeg capabilities
   */
  static async getFFmpegCapabilities(): Promise<{ codecs: string[], formats: string[] }> {
    return FFmpegProcessor.getCapabilities();
  }

  // Update generateOutputPath to handle additional suffix
  private static generateOutputPath(inputPath: string, frontCamera?: boolean, additionalSuffix?: string): string {
    const dir = path.dirname(inputPath);
    const name = path.basename(inputPath, path.extname(inputPath));
    const ext = path.extname(inputPath);
    const cameraSuffix = frontCamera ? '_rayban_front' : '_rayban';
    const fullSuffix = additionalSuffix ? `${cameraSuffix}_${additionalSuffix}` : cameraSuffix;

    return path.join(dir, `${name}${fullSuffix}${ext}`);
  }
}
