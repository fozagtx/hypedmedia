# Ray-Ban Metadata

Add Meta Ray-Ban smart glasses metadata to video files with **FFmpeg integration** for advanced video processing. This package adds realistic EXIF/metadata tags to simulate recordings from Meta Ray-Ban smart glasses, while providing comprehensive video optimization features.

## Installation

```bash
# Install globally
npm install -g rayban-metadata

# Or use without installation
npx rayban-metadata <command>
```

## Prerequisites

- **Node.js 14+** (required)
- **FFmpeg** (required for video processing features)

### Installing FFmpeg

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS (with Homebrew)
brew install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html

# Verify installation
ffmpeg -version
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

## Quick Start

```bash
# Add metadata to a video file
rayban-meta add video.mp4

# Use front camera with video processing
rayban-meta add video.mp4 --front --process --quality high --stabilize

# Optimize video for Ray-Ban format
rayban-meta optimize video.mp4 --front

# Analyze video compatibility
rayban-meta analyze video.mp4

# Check FFmpeg installation
rayban-meta check-ffmpeg
```

## Enhanced Features with FFmpeg

### 🎬 **Video Processing Integration**
- **Quality Optimization**: Ultra, high, medium, low presets
- **Video Stabilization**: Electronic stabilization for smooth footage
- **Format Conversion**: Optimize for Ray-Ban specifications
- **Watermarking**: Optional Ray-Ban branding overlay
- **Progress Tracking**: Real-time processing progress

### 📊 **Video Analysis**
- **Compatibility Assessment**: Ray-Ban format compatibility scoring
- **Technical Analysis**: Resolution, bitrate, codec information
- **Optimization Recommendations**: Automatic suggestions for improvements
- **Frame Rate Analysis**: FPS optimization for Ray-Ban playback

### 🔧 **Advanced Processing**
- **Video Merging**: Combine multiple clips with metadata
- **Thumbnail Generation**: Extract preview images
- **Frame Extraction**: Export individual frames
- **Audio Processing**: Multi-channel audio optimization
- **Batch Optimization**: Process entire directories

## Complete Command Reference

### Core Commands

```bash
# Basic metadata addition
rayban-meta add <input> [options]

# Video processing with optimization
rayban-meta add <input> --process --quality <level> [options]

# Ray-Ban format optimization
rayban-meta optimize <input> [options]

# Video analysis and recommendations
rayban-meta analyze <input>

# Merge multiple videos
rayban-meta merge <file1> <file2> ... -o <output>

# Extract thumbnail
rayban-meta thumbnail <input> [options]

# Extract frames
rayban-meta frames <input> [options]

# Get video information
rayban-meta info <input>

# Check FFmpeg availability
rayban-meta check-ffmpeg

# Interactive mode
rayban-meta interactive
```

### Enhanced Add Command Options

```bash
rayban-meta add video.mp4 [options]

Core Options:
  -o, --output <path>     Output file path
  -f, --front            Use front-facing camera metadata
  -m, --mute             No audio (mute recording)
  -d, --date <date>      Custom recording date
  -l, --location <name>  Preset location
  --lat <latitude>       Custom latitude
  --lon <longitude>      Custom longitude
  --alt <altitude>       Custom altitude
  -c, --comment <text>   Custom comment

FFmpeg Processing:
  --process              Enable video processing
  --quality <level>      Quality: low|medium|high|ultra
  --stabilize            Apply video stabilization
  --watermark            Add Ray-Ban watermark
```

### Optimization Command

```bash
rayban-meta optimize input.mp4 [options]

Options:
  -o, --output <path>     Output file path
  -f, --front            Front camera optimization
  -l, --location <name>  Preset location
```

### Analysis Command

```bash
rayban-meta analyze input.mp4

Output:
  📹 Video Information
  🎯 Ray-Ban Compatibility Score
  💡 Optimization Recommendations
```

### Merge Command

```bash
rayban-meta merge video1.mp4 video2.mp4 video3.mp4 -o merged.mp4 [options]

Options:
  -o, --output <path>     Output file path (required)
  -f, --front            Front camera metadata
  -l, --location <name>  Preset location
```

### Thumbnail & Frames

```bash
# Create thumbnail
rayban-meta thumbnail input.mp4 -o thumb.jpg -t 00:00:05 -s 640x480

# Extract frames every 2 seconds
rayban-meta frames input.mp4 -o ./frames -i 2 -f jpg
```

## Usage Examples

### Basic Metadata Addition

```bash
# Simple metadata addition
rayban-meta add video.mp4

# Front camera with location
rayban-meta add video.mp4 --front --location tokyo

# Custom coordinates
rayban-meta add video.mp4 --lat 40.7128 --lon -74.0060
```

### Video Processing & Optimization

```bash
# High-quality processing with stabilization
rayban-meta add shaky-video.mp4 --process --quality high --stabilize

# Optimize for Ray-Ban Stories (front camera)
rayban-meta optimize raw-footage.mp4 --front

# Ultra quality with watermark
rayban-meta add video.mp4 --process --quality ultra --watermark
```

### Analysis & Compatibility

```bash
# Check if video is Ray-Ban compatible
rayban-meta analyze old-video.avi

# Get detailed video information
rayban-meta info video.mp4

# Check system capabilities
rayban-meta check-ffmpeg
```

### Advanced Workflows

```bash
# Multi-video workflow
rayban-meta merge clip1.mp4 clip2.mp4 clip3.mp4 -o final.mp4 --front
rayban-meta thumbnail final.mp4 -o preview.jpg -t 00:00:03
rayban-meta analyze final.mp4

# Batch processing directory
rayban-meta batch ./raw-videos --front --process --quality medium
```

## Quality Presets

| Preset | CRF | Preset Speed | Use Case |
|--------|-----|--------------|----------|
| **low** | 28 | fast | Quick processing, smaller files |
| **medium** | 23 | medium | Balanced quality/speed (default) |
| **high** | 18 | slow | High quality for sharing |
| **ultra** | 15 | veryslow | Maximum quality for archival |

## Ray-Ban Device Specifications

### Meta Ray-Ban Stories (Front Camera)
- **Resolution**: 1184x1184 (1:1 aspect ratio)
- **Lens**: 5.5mm f/2.0
- **Frame Rate**: 30fps
- **Audio**: 2-channel beamforming array
- **Field of View**: 87°

### Meta Ray-Ban Meta (Main Camera)
- **Resolution**: 1920x1080 (16:9 aspect ratio)
- **Lens**: Wide Angle 12mm f/1.8
- **Frame Rate**: 60fps
- **Audio**: 5-microphone array with noise cancellation
- **Field of View**: 120° ultra-wide

## Programmatic Usage

```javascript
const { VideoProcessor, MetadataGenerator, FFmpegProcessor } = require('rayban-metadata');

// Enhanced metadata with video processing
await VideoProcessor.processAndAddMetadata('input.mp4', 'output.mp4', {
  frontCamera: true,
  hasAudio: true,
  locationName: 'san-francisco'
}, {
  quality: 'high',
  stabilize: true,
  addWatermark: false
});

// Optimize for Ray-Ban
await VideoProcessor.optimizeForRayBan('input.mp4', 'optimized.mp4', {
  frontCamera: false
});

// Video analysis
const analysis = await VideoProcessor.analyzeVideo('video.mp4');
console.log(analysis.rayBanCompatibility); // 'excellent' | 'good' | 'fair' | 'poor'
console.log(analysis.recommendations);

// Direct FFmpeg operations
await FFmpegProcessor.processVideo('input.mp4', 'output.mp4', {
  quality: 'high',
  resolution: '1920x1080',
  fps: 60,
  stabilize: true
});

// Merge videos
await VideoProcessor.mergeVideos(['video1.mp4', 'video2.mp4'], 'merged.mp4', {
  frontCamera: true
});
```

## API Reference

### Enhanced VideoProcessor

**Core Methods:**
- `addMetadata(input, output?, config?, processVideo?, processingOptions?, progress?)`: Add metadata with optional video processing
- `processAndAddMetadata(input, output?, config?, processingOptions?, progress?)`: Process and add metadata in one step
- `optimizeForRayBan(input, output?, config?, progress?)`: Optimize video for Ray-Ban format

**Analysis & Information:**
- `analyzeVideo(input)`: Comprehensive video analysis with recommendations
- `getVideoInfo(input)`: Get detailed video information using FFmpeg
- `verifyMetadata(input)`: Check for existing Ray-Ban metadata

**Advanced Processing:**
- `mergeVideos(inputs[], output, config?, progress?)`: Merge multiple videos
- `createThumbnail(input, output?, timestamp?, size?)`: Extract thumbnail image
- `extractFrames(input, outputDir?, interval?, format?)`: Extract individual frames

**System Integration:**
- `checkFFmpegAvailability()`: Verify FFmpeg installation
- `getFFmpegCapabilities()`: Get available codecs and formats

### FFmpegProcessor

**Core Processing:**
- `processVideo(input, output, options?, config?, progress?)`: Process video with full control
- `optimizeForRayBan(input, output, config?, progress?)`: Ray-Ban specific optimization
- `getVideoInfo(input)`: Detailed video information

**Utility Functions:**
- `createThumbnail(input, output, timestamp?, size?)`: Generate thumbnails
- `extractFrames(input, outputDir, interval?, format?)`: Frame extraction
- `mergeVideos(inputs[], output, config?, progress?)`: Video concatenation
- `addAudio(video, audio, output, replace?)`: Audio manipulation

**Analysis:**
- `analyzeVideo(input)`: Technical analysis with FFmpeg probe

## Error Handling

```javascript
try {
  const success = await VideoProcessor.processAndAddMetadata(
    'input.mp4', 'output.mp4',
    { frontCamera: true },
    { quality: 'high', stabilize: true }
  );

  if (success) {
    console.log('Processing completed successfully!');
  } else {
    console.error('Processing failed');
  }
} catch (error) {
  console.error('Error:', error.message);

  if (error.message.includes('FFmpeg')) {
    console.log('Make sure FFmpeg is installed and accessible');
  }
}
```

## Troubleshooting

### Common Issues

**FFmpeg not found:**
```bash
# Check installation
ffmpeg -version

# Install if missing
sudo apt install ffmpeg  # Ubuntu/Debian
brew install ffmpeg      # macOS
```

**Permission errors:**
```bash
# Check file permissions
ls -la input.mp4

# Fix permissions if needed
chmod 644 input.mp4
```

**Processing failures:**
```bash
# Check video integrity
rayban-meta info input.mp4

# Analyze compatibility
rayban-meta analyze input.mp4
```

**Memory issues with large files:**
- Use lower quality settings
- Process in smaller chunks
- Ensure adequate disk space

## Dependencies

- **Node.js 14+** (required)
- **FFmpeg** (required for video processing)
- **fluent-ffmpeg** (video processing wrapper)
- **exiftool-vendored** (metadata manipulation)
- **commander** (CLI interface)
- **inquirer** (interactive prompts)
- **ora** (progress spinners)
- **chalk** (colored output)

## Performance Tips

1. **Use appropriate quality settings** for your use case
2. **Enable hardware acceleration** in FFmpeg if available
3. **Process in batches** for multiple files
4. **Monitor system resources** during processing
5. **Use SSD storage** for faster I/O operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure FFmpeg integration works
5. Submit a pull request

## Changelog

### v2.0.0 (FFmpeg Integration)
- ✨ Added FFmpeg integration for video processing
- 🎬 Video optimization and quality presets
- 📊 Video analysis and compatibility scoring
- 🔧 Advanced processing: merge, thumbnail, frame extraction
- 📈 Real-time progress tracking
- 🎯 Ray-Ban specific optimization profiles
- 🛠️ System capability checking

### v1.0.0 (Initial Release)
- 📱 Basic Ray-Ban metadata addition
- 🎥 Front and main camera presets
- 📍 Location and GPS metadata
- 🎤 Audio metadata support
- 📁 Batch processing
- 🔍 Metadata verification

## License

MIT License - see LICENSE file for details.