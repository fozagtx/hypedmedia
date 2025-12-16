import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { RayBanConfig } from './types';

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  codec: string;
  size: number;
}

export interface ProcessingOptions {
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  format?: 'mp4' | 'mov' | 'webm' | 'avi';
  resolution?: string; // e.g., '1920x1080', '1280x720'
  fps?: number;
  bitrate?: string; // e.g., '2000k', '5M'
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  addWatermark?: boolean;
  stabilize?: boolean;
}

export class FFmpegProcessor {
  private static readonly QUALITY_PRESETS = {
    low: { crf: 28, preset: 'fast' as const },
    medium: { crf: 23, preset: 'medium' as const },
    high: { crf: 18, preset: 'slow' as const },
    ultra: { crf: 15, preset: 'veryslow' as const }
  };

  private static readonly RAYBAN_PRESETS = {
    stories: {
      resolution: '1184x1184',
      fps: 30,
      bitrate: '4000k',
      format: 'mp4' as const
    },
    meta: {
      resolution: '1920x1080',
      fps: 60,
      bitrate: '8000k',
      format: 'mp4' as const
    }
  };

  /**
   * Get detailed information about a video file
   */
  static async getVideoInfo(inputPath: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to probe video: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        const stats = {
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps: this.parseFps(videoStream.r_frame_rate || videoStream.avg_frame_rate),
          bitrate: metadata.format.bit_rate ? parseInt(metadata.format.bit_rate) : 0,
          codec: videoStream.codec_name || 'unknown',
          size: metadata.format.size || 0
        };

        resolve(stats);
      });
    });
  }

  /**
   * Process video with Ray-Ban optimizations
   */
  static async processVideo(
    inputPath: string,
    outputPath: string,
    options: ProcessingOptions = {},
    config: RayBanConfig = {},
    progressCallback?: (percent: number) => void
  ): Promise<boolean> {
    try {
      // Get video info for processing decisions
      const videoInfo = await this.getVideoInfo(inputPath);

      // Determine preset based on config
      const preset = config.frontCamera ? 'stories' : 'meta';
      const raybanPreset = this.RAYBAN_PRESETS[preset];

      // Merge options with Ray-Ban presets
      const finalOptions = {
        ...raybanPreset,
        ...options
      };

      return new Promise((resolve, reject) => {
        const command = ffmpeg(inputPath);

        // Video codec and quality settings
        const qualityPreset = this.QUALITY_PRESETS[finalOptions.quality || 'medium'];
        command
          .videoCodec('libx264')
          .outputOptions([
            `-crf ${qualityPreset.crf}`,
            `-preset ${finalOptions.preset || qualityPreset.preset}`,
            '-movflags +faststart', // Optimize for web playback
            '-pix_fmt yuv420p'      // Ensure compatibility
          ]);

        // Resolution and framerate
        if (finalOptions.resolution) {
          command.size(finalOptions.resolution);
        }
        if (finalOptions.fps) {
          command.fps(finalOptions.fps);
        }
        if (finalOptions.bitrate) {
          command.videoBitrate(finalOptions.bitrate);
        }

        // Audio processing
        if (config.hasAudio !== false) {
          command
            .audioCodec('aac')
            .audioBitrate('128k')
            .audioChannels(config.frontCamera ? 2 : 4);
        } else {
          command.noAudio();
        }

        // Video stabilization for Ray-Ban footage
        if (finalOptions.stabilize) {
          command.videoFilters([
            'vidstabdetect=stepsize=6:shakiness=8:accuracy=9:result=/tmp/transform_vectors.trf',
            'vidstabtransform=input=/tmp/transform_vectors.trf:zoom=1:smoothing=30'
          ]);
        }

        // Add Ray-Ban watermark if requested
        if (finalOptions.addWatermark) {
          command.videoFilters([
            `drawtext=text='Meta Ray-Ban ${config.frontCamera ? 'Stories' : 'Meta'}':fontsize=20:fontcolor=white:x=10:y=10`
          ]);
        }

        // Progress tracking
        if (progressCallback && videoInfo.duration > 0) {
          command.on('progress', (progress) => {
            const percent = (progress.timemark ? this.timeToSeconds(progress.timemark) : 0) / videoInfo.duration * 100;
            progressCallback(Math.min(percent, 100));
          });
        }

        // Error handling
        command.on('error', (err) => {
          reject(new Error(`FFmpeg processing failed: ${err.message}`));
        });

        // Success
        command.on('end', () => {
          resolve(true);
        });

        // Start processing
        command.output(outputPath).run();
      });
    } catch (error) {
      throw new Error(`Video processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert video to Ray-Ban optimized format
   */
  static async optimizeForRayBan(
    inputPath: string,
    outputPath: string,
    config: RayBanConfig = {},
    progressCallback?: (percent: number) => void
  ): Promise<boolean> {
    const options: ProcessingOptions = {
      quality: 'high',
      format: 'mp4',
      stabilize: true,
      addWatermark: false
    };

    return this.processVideo(inputPath, outputPath, options, config, progressCallback);
  }

  /**
   * Extract frames from video at specific intervals
   */
  static async extractFrames(
    inputPath: string,
    outputDir: string,
    interval: number = 1,
    format: 'jpg' | 'png' = 'jpg'
  ): Promise<string[]> {
    await fs.mkdir(outputDir, { recursive: true });

    return new Promise((resolve, reject) => {
      const outputPattern = path.join(outputDir, `frame_%04d.${format}`);
      const extractedFiles: string[] = [];

      ffmpeg(inputPath)
        .outputOptions([
          `-vf fps=1/${interval}`,  // Extract one frame every N seconds
          '-q:v 2'                  // High quality
        ])
        .output(outputPattern)
        .on('error', reject)
        .on('end', async () => {
          try {
            const files = await fs.readdir(outputDir);
            const frameFiles = files
              .filter(f => f.startsWith('frame_') && f.endsWith(`.${format}`))
              .map(f => path.join(outputDir, f));
            resolve(frameFiles);
          } catch (error) {
            reject(error);
          }
        })
        .run();
    });
  }

  /**
   * Create video thumbnail
   */
  static async createThumbnail(
    inputPath: string,
    outputPath: string,
    timestamp: string = '00:00:01',
    size: string = '320x240'
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(timestamp)
        .size(size)
        .frames(1)
        .output(outputPath)
        .on('error', reject)
        .on('end', () => resolve(true))
        .run();
    });
  }

  /**
   * Merge multiple videos with Ray-Ban metadata
   */
  static async mergeVideos(
    inputPaths: string[],
    outputPath: string,
    config: RayBanConfig = {},
    progressCallback?: (percent: number) => void
  ): Promise<boolean> {
    if (inputPaths.length < 2) {
      throw new Error('At least 2 videos required for merging');
    }

    return new Promise((resolve, reject) => {
      const command = ffmpeg();

      // Add all input files
      inputPaths.forEach(inputPath => {
        command.input(inputPath);
      });

      // Create filter complex for concatenation
      const filterInputs = inputPaths.map((_, i) => `[${i}:v][${i}:a]`).join('');
      const filterComplex = `${filterInputs}concat=n=${inputPaths.length}:v=1:a=1[outv][outa]`;

      command
        .complexFilter(filterComplex)
        .map('[outv]')
        .map('[outa]')
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions(['-preset fast', '-movflags +faststart']);

      if (progressCallback) {
        command.on('progress', (progress) => {
          const percent = progress.percent || 0;
          progressCallback(percent);
        });
      }

      command
        .on('error', reject)
        .on('end', () => resolve(true))
        .output(outputPath)
        .run();
    });
  }

  /**
   * Add audio to video or replace existing audio
   */
  static async addAudio(
    videoPath: string,
    audioPath: string,
    outputPath: string,
    replaceAudio: boolean = false
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg()
        .input(videoPath)
        .input(audioPath);

      if (replaceAudio) {
        command.outputOptions(['-c:v copy', '-c:a aac', '-map 0:v:0', '-map 1:a:0']);
      } else {
        command.outputOptions(['-c:v copy', '-c:a aac', '-filter_complex [1:a]volume=0.5[a1];[0:a][a1]amix=inputs=2[out]', '-map 0:v', '-map [out]']);
      }

      command
        .on('error', reject)
        .on('end', () => resolve(true))
        .output(outputPath)
        .run();
    });
  }

  /**
   * Get video metadata for analysis
   */
  static async analyzeVideo(inputPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, ['-show_format', '-show_streams', '-print_format', 'json'], (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  // Helper methods
  private static parseFps(frameRate?: string): number {
    if (!frameRate) return 0;
    const [num, den] = frameRate.split('/').map(Number);
    return den ? num / den : num || 0;
  }

  private static timeToSeconds(timeStr: string): number {
    const parts = timeStr.split(':').map(Number);
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  /**
   * Check if FFmpeg is available
   */
  static async checkFFmpegAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      ffmpeg()
        .getAvailableFormats((err, formats) => {
          resolve(!err && !!formats);
        });
    });
  }

  /**
   * Get available codecs and formats
   */
  static async getCapabilities(): Promise<{ codecs: string[], formats: string[] }> {
    return new Promise((resolve, reject) => {
      ffmpeg.getAvailableFormats((err, formats) => {
        if (err) {
          reject(err);
          return;
        }

        ffmpeg.getAvailableCodecs((err2, codecs) => {
          if (err2) {
            reject(err2);
            return;
          }

          resolve({
            formats: Object.keys(formats),
            codecs: Object.keys(codecs)
          });
        });
      });
    });
  }
}