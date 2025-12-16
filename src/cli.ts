#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
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

      const success = await VideoProcessor.addMetadata(input, options.output, config);
      
      if (success) {
        spinner.succeed(chalk.green('✓ Metadata added successfully!'));
        
        // Show metadata summary
        const metadata = MetadataGenerator.generateMetadata(config);
        console.log(chalk.cyan('\n📱 Added Metadata:'));
        console.log(MetadataGenerator.generateSummary(metadata));
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
  .command('interactive')
  .description('Interactive mode with prompts')
  .action(async () => {
    console.log(chalk.cyan('🎬 Ray-Ban Metadata Adder - Interactive Mode\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: 'Enter video file or directory path:',
        validate: (input) => input.trim() !== '' || 'Path is required'
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
        when: (answers) => answers.location === 'custom',
        validate: (input) => !isNaN(parseFloat(input)) || 'Enter a valid number'
      },
      {
        type: 'input',
        name: 'customLon',
        message: 'Enter custom longitude:',
        when: (answers) => answers.location === 'custom',
        validate: (input) => !isNaN(parseFloat(input)) || 'Enter a valid number'
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
