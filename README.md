# Ray-Ban Metadata

Add Meta Ray-Ban smart glasses metadata to video files. This package adds realistic EXIF/metadata tags to simulate recordings from Meta Ray-Ban smart glasses.

## Installation

```bash
# Install globally
npm install -g rayban-metadata

# Or use without installation
npx rayban-metadata <command>
```

## Local Development / Run Without Installation

To run directly from the source code without building or installing:

```bash
# Clone the repository
git clone <repository-url>
cd rayban-metadata

# Install dependencies
npm install

# Method 1: Direct execution (recommended)
node rayban-cli.js add /path/to/video.mp4 --front

# Method 2: Using npm scripts
npm run dev:cli -- add /path/to/video.mp4 --front

# Method 3: Build and run
npm run dev:start -- add /path/to/video.mp4 --front
```

### Key Scripts

- `npm run dev:cli` - Run CLI directly from TypeScript source using ts-node
- `npm run dev:start` - Build TypeScript then run the CLI
- `node rayban-cli.js` - Smart wrapper that detects dev vs built mode

### What This Solves

The issue was that users couldn't run `node dist/cli.js` without first building the TypeScript files. Now users can:

1. Clone the repo
2. Run `npm install`  
3. Run the CLI immediately with `node rayban-cli.js`

The wrapper automatically detects if you're in development (TypeScript source exists) and uses `ts-node`, or if built files exist and uses those.

## Quick Start

```bash
# Add metadata to a video file
rayban-meta add video.mp4

# Use front camera (selfie) metadata
rayban-meta add video.mp4 --front

# Add metadata to all videos in a directory
rayban-meta batch ./videos

# Interactive mode
rayban-meta interactive
```

## Features

- 🎥 Realistic metadata based on actual Meta Ray-Ban specifications
- 🤳 Two camera modes: Front-facing (selfie) and main camera
- 📍 Location presets (New York, San Francisco, London, Tokyo, Paris)
- 🎤 Audio metadata with microphone array specifications
- 📅 Custom date/time support
- 📝 Batch processing for multiple files
- 🔍 Verification to check metadata
- 🎨 Interactive CLI with prompts

## Usage Examples

### Basic Usage

```bash
# Add metadata to single file
rayban-meta add input.mp4

# Specify output file
rayban-meta add input.mp4 -o output.mp4

# Use front camera metadata
rayban-meta add video.mp4 --front

# Mute recording (no audio metadata)
rayban-meta add video.mp4 --mute
```

### Location Options

```bash
# Use preset location
rayban-meta add video.mp4 --location tokyo

# Custom coordinates
rayban-meta add video.mp4 --lat 40.7128 --lon -74.0060 --alt 10
```

### Batch Processing

```bash
# Process all videos in directory
rayban-meta batch ./videos

# With front camera metadata
rayban-meta batch ./videos --front --location london

# Specify output directory
rayban-meta batch ./videos -o ./processed
```

### Other Commands

```bash
# Verify metadata
rayban-meta verify video.mp4

# Show available presets
rayban-meta presets

# Interactive mode
rayban-meta interactive
```

## Programmatic Usage

```javascript
const { VideoProcessor, MetadataGenerator } = require('rayban-metadata');

// Add metadata to single file
await VideoProcessor.addMetadata('input.mp4', 'output.mp4', {
  frontCamera: false,
  hasAudio: true,
  locationName: 'san-francisco'
});

// Process directory
await VideoProcessor.batchProcess('./videos', './output', {
  frontCamera: true,
  hasAudio: false
});

// Generate metadata
const metadata = MetadataGenerator.generateMetadata({
  frontCamera: false,
  customDate: '2024:01:15 14:30:00'
});
```

## API Reference

### VideoProcessor

- `addMetadata(inputPath, outputPath?, config?)`: Add metadata to single file
- `batchProcess(directory, outputDir?, config?)`: Process all videos in directory
- `verifyMetadata(filePath)`: Check if file has Ray-Ban metadata
- `getVideoFiles(directory)`: Get all video files in directory

### MetadataGenerator

- `generateMetadata(config)`: Generate metadata object
- `getMetadataAsExifArgs(metadata)`: Convert metadata to EXIF arguments
- `generateSummary(metadata)`: Get formatted metadata summary

## Dependencies

This package requires:

- Node.js 14 or higher
- Perl (for exiftool-vendored, but it includes binaries)

## License

MIT
