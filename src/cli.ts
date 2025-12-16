#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import path from 'path';
import { VideoProcessor } from './video-processor';
import { MetadataGenerator } from './metadata-generator';
import { RayBanConfig } from './types';
import { RAYBAN_PRESETS } from './constants';

const program = new Command();

program
  .name('rayban-meta')
  .description('Add Meta Ray-Ban smart glasses metadata to videos')
  .version('1.0.0');

program
  .command('add <input>')
  .description('Add Ray-Ban metadata to a video file')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --front', 'Use front-facing camera metadata')
  .option('-m, --mute', 'No audio (mute recording)')
  .option('-d, --date <date>', 'Custom recording date (YYYY:MM:DD HH:MM:SS)')
  .option('-l, --location <name>', `Preset location: ${Object.keys(RAYBAN_PRESETS.LOCATIONS).join(', ')}`)
  .option('--lat <latitude>', 'Custom latitude')
  .option('--lon <longitude>', 'Custom longitude')
  .option('--alt <altitude>', 'Custom altitude')
  .option('-c, --comment <text>', 'Custom comment')
  .option('--process', 'Process video with FFmpeg optimization')
  .option('--quality <level>', 'Quality preset: low, medium, high, ultra', 'medium')
  .option('--stabilize', 'Apply video stabilization')
  .option('--watermark', 'Add Ray-Ban watermark')
  .action(async (input, options) => {
    const spinner = ora('Processing video...').start();

    try {
      const config: RayBanConfig = {
        frontCamera: options.front,
        hasAudio: !options.mute,
        customDate: options.date,
        locationName: options.location,
        latitude: options.lat,
        longitude: options.lon,
        altitude: options.alt,
        customComment: options.comment
      };

      const processingOptions = options.process ? {
        quality: options.quality as 'low' | 'medium' | 'high' | 'ultra',
        stabilize: options.stabilize,
        addWatermark: options.watermark
      } : undefined;

      const progressCallback = (percent: number) => {
        spinner.text = `Processing video... ${Math.round(percent)}%`;
      };

      const success = await VideoProcessor.addMetadata(
        input,
        options.output,
        config,
        options.process,
        processingOptions,
        progressCallback
      );

      if (success) {
        spinner.succeed(chalk.green('✓ Metadata added successfully!'));

        // Show metadata summary
        const metadata = MetadataGenerator.generateMetadata(config);
        console.log(chalk.cyan('\n📱 Added Metadata:'));
        console.log(MetadataGenerator.generateSummary(metadata));

        if (options.process) {
          console.log(chalk.yellow('\n🎬 Video Processing:'));
          console.log(`Quality: ${options.quality}`);
          if (options.stabilize) console.log('✓ Video stabilization applied');
          if (options.watermark) console.log('✓ Ray-Ban watermark added');
        }
      } else {
        spinner.fail(chalk.red('Failed to add metadata'));
      }
    } catch (error) {
      spinner.fail(chalk.red('Error processing video'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

program
  .command('batch <directory>')
  .description('Add Ray-Ban metadata to all videos in a directory')
  .option('-o, --output <path>', 'Output directory')
  .option('-f, --front', 'Use front-facing camera metadata')
  .option('-m, --mute', 'No audio (mute recording)')
  .option('-l, --location <name>', `Preset location: ${Object.keys(RAYBAN_PRESETS.LOCATIONS).join(', ')}`)
  .action(async (directory, options) => {
    const spinner = ora('Scanning directory...').start();
    
    try {
      const config: RayBanConfig = {
        frontCamera: options.front,
        hasAudio: !options.mute,
        locationName: options.location
      };

      spinner.text = 'Processing videos...';
      const results = await VideoProcessor.batchProcess(directory, options.output, config);
      
      spinner.stop();
      
      console.log(chalk.green('\n✅ Batch processing complete!'));
      console.log(chalk.cyan(`Total: ${results.total}`));
      console.log(chalk.green(`Successful: ${results.success}`));
      console.log(chalk.red(`Failed: ${results.failed}`));
    } catch (error) {
      spinner.fail(chalk.red('Error processing directory'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

program
  .command('verify <file>')
  .description('Verify if a file has Ray-Ban metadata')
  .action(async (file) => {
    const spinner = ora('Verifying metadata...').start();
    
    try {
      const hasMetadata = await VideoProcessor.verifyMetadata(file);
      
      if (hasMetadata) {
        spinner.succeed(chalk.green('✓ File has Ray-Ban metadata!'));
      } else {
        spinner.warn(chalk.yellow('⚠ File does not have Ray-Ban metadata'));
      }
    } catch (error) {
      spinner.fail(chalk.red('Error verifying file'));
    }
  });

program
  .command('presets')
  .description('Show available Ray-Ban metadata presets')
  .action(() => {
    console.log(chalk.cyan('\n📱 Ray-Ban Meta Presets:\n'));
    
    console.log(chalk.yellow('🎥 Main Camera (Outward-facing):'));
    const mainMetadata = MetadataGenerator.generateMetadata({ frontCamera: false });
    console.log(MetadataGenerator.generateSummary(mainMetadata));
    
    console.log(chalk.yellow('\n🤳 Front Camera (Selfie):'));
    const frontMetadata = MetadataGenerator.generateMetadata({ frontCamera: true });
    console.log(MetadataGenerator.generateSummary(frontMetadata));
    
    console.log(chalk.yellow('\n📍 Available Locations:'));
    Object.entries(RAYBAN_PRESETS.LOCATIONS).forEach(([name, loc]) => {
      console.log(`  ${name}: ${loc.lat}, ${loc.lon} (alt: ${loc.alt}m)`);
    });
  });

program
  .command('optimize <input>')
  .description('Optimize video for Ray-Ban format with metadata')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --front', 'Use front-facing camera metadata')
  .option('-l, --location <name>', `Preset location: ${Object.keys(RAYBAN_PRESETS.LOCATIONS).join(', ')}`)
  .action(async (input, options) => {
    const spinner = ora('Optimizing video for Ray-Ban...').start();

    try {
      const config: RayBanConfig = {
        frontCamera: options.front,
        locationName: options.location
      };

      const progressCallback = (percent: number) => {
        spinner.text = `Optimizing video... ${Math.round(percent)}%`;
      };

      const success = await VideoProcessor.optimizeForRayBan(
        input,
        options.output,
        config,
        progressCallback
      );

      if (success) {
        spinner.succeed(chalk.green('✓ Video optimized successfully!'));

        const metadata = MetadataGenerator.generateMetadata(config);
        console.log(chalk.cyan('\n📱 Added Metadata:'));
        console.log(MetadataGenerator.generateSummary(metadata));
      } else {
        spinner.fail(chalk.red('Failed to optimize video'));
      }
    } catch (error) {
      spinner.fail(chalk.red('Error optimizing video'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

program
  .command('analyze <input>')
  .description('Analyze video and provide Ray-Ban compatibility report')
  .action(async (input) => {
    const spinner = ora('Analyzing video...').start();

    try {
      const analysis = await VideoProcessor.analyzeVideo(input);

      spinner.succeed(chalk.green('✓ Analysis complete!'));

      console.log(chalk.cyan('\n📊 Video Analysis Report:'));
      console.log(chalk.yellow('\n📹 Video Information:'));
      console.log(`Resolution: ${analysis.info.width}x${analysis.info.height}`);
      console.log(`Duration: ${Math.round(analysis.info.duration)}s`);
      console.log(`Frame Rate: ${Math.round(analysis.info.fps)}fps`);
      console.log(`Bitrate: ${Math.round(analysis.info.bitrate / 1000000)}Mbps`);
      console.log(`Codec: ${analysis.info.codec}`);
      console.log(`File Size: ${Math.round(analysis.info.size / 1024 / 1024)}MB`);

      const compatibilityColor = {
        excellent: chalk.green,
        good: chalk.yellow,
        fair: chalk.yellow,
        poor: chalk.red
      }[analysis.rayBanCompatibility];

      console.log(chalk.yellow('\n🎯 Ray-Ban Compatibility:'));
      console.log(compatibilityColor(`${analysis.rayBanCompatibility.toUpperCase()}`));

      if (analysis.recommendations.length > 0) {
        console.log(chalk.yellow('\n💡 Recommendations:'));
        analysis.recommendations.forEach((rec, i) => {
          console.log(`${i + 1}. ${rec}`);
        });
      }
    } catch (error) {
      spinner.fail(chalk.red('Error analyzing video'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

program
  .command('merge <files...>')
  .description('Merge multiple videos with Ray-Ban metadata')
  .option('-o, --output <path>', 'Output file path (required)')
  .option('-f, --front', 'Use front-facing camera metadata')
  .option('-l, --location <name>', `Preset location: ${Object.keys(RAYBAN_PRESETS.LOCATIONS).join(', ')}`)
  .action(async (files, options) => {
    if (!options.output) {
      console.error(chalk.red('Error: Output path is required for merge operation'));
      process.exit(1);
    }

    const spinner = ora('Merging videos...').start();

    try {
      const config: RayBanConfig = {
        frontCamera: options.front,
        locationName: options.location
      };

      const progressCallback = (percent: number) => {
        spinner.text = `Merging videos... ${Math.round(percent)}%`;
      };

      const success = await VideoProcessor.mergeVideos(
        files,
        options.output,
        config,
        progressCallback
      );

      if (success) {
        spinner.succeed(chalk.green('✓ Videos merged successfully!'));

        const metadata = MetadataGenerator.generateMetadata(config);
        console.log(chalk.cyan('\n📱 Added Metadata:'));
        console.log(MetadataGenerator.generateSummary(metadata));
        console.log(chalk.yellow(`\n🎬 Merged ${files.length} video files`));
      } else {
        spinner.fail(chalk.red('Failed to merge videos'));
      }
    } catch (error) {
      spinner.fail(chalk.red('Error merging videos'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

program
  .command('thumbnail <input>')
  .description('Create thumbnail from video')
  .option('-o, --output <path>', 'Output image path')
  .option('-t, --time <timestamp>', 'Timestamp for thumbnail (e.g., 00:00:01)', '00:00:01')
  .option('-s, --size <size>', 'Thumbnail size (e.g., 320x240)', '320x240')
  .action(async (input, options) => {
    const spinner = ora('Creating thumbnail...').start();

    try {
      const success = await VideoProcessor.createThumbnail(
        input,
        options.output,
        options.time,
        options.size
      );

      if (success) {
        spinner.succeed(chalk.green('✓ Thumbnail created successfully!'));
        const outputPath = options.output || input.replace(path.extname(input), '_thumb.jpg');
        console.log(chalk.cyan(`📸 Thumbnail saved: ${outputPath}`));
      } else {
        spinner.fail(chalk.red('Failed to create thumbnail'));
      }
    } catch (error) {
      spinner.fail(chalk.red('Error creating thumbnail'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

program
  .command('frames <input>')
  .description('Extract frames from video')
  .option('-o, --output <dir>', 'Output directory for frames')
  .option('-i, --interval <seconds>', 'Interval between frames in seconds', '1')
  .option('-f, --format <format>', 'Frame format: jpg or png', 'jpg')
  .action(async (input, options) => {
    const spinner = ora('Extracting frames...').start();

    try {
      const frameFiles = await VideoProcessor.extractFrames(
        input,
        options.output,
        parseInt(options.interval),
        options.format as 'jpg' | 'png'
      );

      spinner.succeed(chalk.green('✓ Frames extracted successfully!'));
      console.log(chalk.cyan(`📸 Extracted ${frameFiles.length} frames`));
      console.log(chalk.yellow(`Output directory: ${frameFiles[0] ? path.dirname(frameFiles[0]) : 'N/A'}`));
    } catch (error) {
      spinner.fail(chalk.red('Error extracting frames'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

program
  .command('info <input>')
  .description('Get detailed video information')
  .action(async (input) => {
    const spinner = ora('Getting video information...').start();

    try {
      const info = await VideoProcessor.getVideoInfo(input);

      spinner.succeed(chalk.green('✓ Video information retrieved!'));

      console.log(chalk.cyan('\n📹 Video Information:'));
      console.log(`File: ${path.basename(input)}`);
      console.log(`Resolution: ${info.width}x${info.height}`);
      console.log(`Duration: ${Math.round(info.duration)}s (${Math.floor(info.duration / 60)}:${String(Math.round(info.duration % 60)).padStart(2, '0')})`);
      console.log(`Frame Rate: ${Math.round(info.fps)}fps`);
      console.log(`Bitrate: ${Math.round(info.bitrate / 1000000)}Mbps`);
      console.log(`Codec: ${info.codec}`);
      console.log(`File Size: ${Math.round(info.size / 1024 / 1024)}MB`);
    } catch (error) {
      spinner.fail(chalk.red('Error getting video information'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

program
  .command('check-ffmpeg')
  .description('Check FFmpeg availability and capabilities')
  .action(async () => {
    const spinner = ora('Checking FFmpeg...').start();

    try {
      const available = await VideoProcessor.checkFFmpegAvailability();

      if (available) {
        spinner.succeed(chalk.green('✓ FFmpeg is available!'));

        const capabilities = await VideoProcessor.getFFmpegCapabilities();
        console.log(chalk.cyan('\n🎬 FFmpeg Capabilities:'));
        console.log(`Codecs: ${capabilities.codecs.length} available`);
        console.log(`Formats: ${capabilities.formats.length} available`);

        // Show some common codecs and formats
        const commonCodecs = ['h264', 'hevc', 'av1', 'vp9', 'aac', 'mp3'];
        const commonFormats = ['mp4', 'mov', 'webm', 'avi', 'mkv'];

        console.log(chalk.yellow('\n📦 Common Codecs:'));
        commonCodecs.forEach(codec => {
          const status = capabilities.codecs.includes(codec) ? '✓' : '✗';
          const color = capabilities.codecs.includes(codec) ? chalk.green : chalk.red;
          console.log(color(`${status} ${codec}`));
        });

        console.log(chalk.yellow('\n📁 Common Formats:'));
        commonFormats.forEach(format => {
          const status = capabilities.formats.includes(format) ? '✓' : '✗';
          const color = capabilities.formats.includes(format) ? chalk.green : chalk.red;
          console.log(color(`${status} ${format}`));
        });
      } else {
        spinner.fail(chalk.red('✗ FFmpeg is not available!'));
        console.log(chalk.yellow('\n💡 To install FFmpeg:'));
        console.log('Ubuntu/Debian: sudo apt install ffmpeg');
        console.log('macOS: brew install ffmpeg');
        console.log('Windows: Download from https://ffmpeg.org/download.html');
      }
    } catch (error) {
      spinner.fail(chalk.red('Error checking FFmpeg'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

program
  .command('interactive')
  .description('Interactive mode with prompts')
  .action(async () => {
    console.log(chalk.cyan('🎬 Ray-Ban Metadata Adder - Interactive Mode\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: 'Enter video file or directory path:',
        validate: (input: string) => input.trim() !== '' || 'Path is required'
      },
      {
        type: 'list',
        name: 'cameraType',
        message: 'Select camera type:',
        choices: [
          { name: '🎥 Main Camera (Outward-facing)', value: false },
          { name: '🤳 Front Camera (Selfie)', value: true }
        ]
      },
      {
        type: 'confirm',
        name: 'hasAudio',
        message: 'Include audio metadata?',
        default: true
      },
      {
        type: 'list',
        name: 'location',
        message: 'Select location preset:',
        choices: [
          ...Object.keys(RAYBAN_PRESETS.LOCATIONS).map(name => ({
            name: `${name} (${RAYBAN_PRESETS.LOCATIONS[name as keyof typeof RAYBAN_PRESETS.LOCATIONS].lat}, ${RAYBAN_PRESETS.LOCATIONS[name as keyof typeof RAYBAN_PRESETS.LOCATIONS].lon})`,
            value: name
          })),
          { name: 'Custom location', value: 'custom' }
        ]
      },
      {
        type: 'input',
        name: 'customLat',
        message: 'Enter custom latitude:',
        when: (answers: any) => answers.location === 'custom',
        validate: (input: string) => !isNaN(parseFloat(input)) || 'Enter a valid number'
      },
      {
        type: 'input',
        name: 'customLon',
        message: 'Enter custom longitude:',
        when: (answers: any) => answers.location === 'custom',
        validate: (input: string) => !isNaN(parseFloat(input)) || 'Enter a valid number'
      },
      {
        type: 'input',
        name: 'comment',
        message: 'Custom comment (optional):',
        default: ''
      }
    ]);

    const config: RayBanConfig = {
      frontCamera: answers.cameraType,
      hasAudio: answers.hasAudio,
      locationName: answers.location === 'custom' ? undefined : answers.location,
      latitude: answers.customLat,
      longitude: answers.customLon,
      customComment: answers.comment || undefined
    };

    const spinner = ora('Processing...').start();
    
    try {
      // Check if input is file or directory
      const fs = require('fs');
      const path = require('path');
      const stat = fs.statSync(answers.input);
      
      if (stat.isDirectory()) {
        const results = await VideoProcessor.batchProcess(answers.input, undefined, config);
        spinner.succeed(chalk.green('✓ Batch processing complete!'));
        console.log(chalk.cyan(`Processed ${results.success} of ${results.total} files`));
      } else {
        const success = await VideoProcessor.addMetadata(answers.input, undefined, config);
        if (success) {
          spinner.succeed(chalk.green('✓ Metadata added successfully!'));
        } else {
          spinner.fail(chalk.red('Failed to add metadata'));
        }
      }
    } catch (error) {
      spinner.fail(chalk.red('Error processing input'));
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    }
  });

program.parse(process.argv);
