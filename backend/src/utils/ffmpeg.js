const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

/**
 * Re-encodes an uploaded video into a web-friendly, "fast start" H.264/AAC
 * MP4 so it streams instantly (moov atom moved to the front) and plays
 * consistently across iOS/Android/desktop browsers.
 */
function transcodeToStreamable(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset veryfast',
        '-crf 23',
        '-movflags +faststart', // critical: enables instant playback before full download
        '-pix_fmt yuv420p',
        '-vf scale=\'min(1920,iw)\':-2', // cap at 1080p width, keep aspect ratio
      ])
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

// Standard rendition ladder. Any level taller than the source is skipped
// (no point upscaling a 480p home video to a fake 1080p file).
const LADDER = [
  { quality: '1080p', height: 1080, videoBitrate: '4500k', audioBitrate: '160k' },
  { quality: '720p', height: 720, videoBitrate: '2500k', audioBitrate: '128k' },
  { quality: '480p', height: 480, videoBitrate: '1200k', audioBitrate: '96k' },
];

/**
 * Encodes one specific rendition (resolution + bitrate) as a fast-start MP4.
 */
function transcodeRendition(inputPath, outputPath, { height, videoBitrate, audioBitrate }) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate(audioBitrate)
      .outputOptions([
        `-b:v ${videoBitrate}`,
        '-maxrate ' + videoBitrate,
        '-bufsize ' + parseInt(videoBitrate) * 2 + 'k',
        '-preset veryfast',
        '-movflags +faststart',
        '-pix_fmt yuv420p',
        `-vf scale=-2:${height}`,
      ])
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

/**
 * Builds the full rendition ladder for one source video, skipping any
 * quality level taller than the source itself. Returns an array of
 * { quality, path (filename), height } for renditions that were created.
 */
async function transcodeLadder(inputPath, outputDir, baseName, sourceHeight) {
  const levels = LADDER.filter((l) => !sourceHeight || l.height <= sourceHeight + 40); // small slack for near-matches
  // Always produce at least one rendition even for small/vertical clips.
  if (levels.length === 0) levels.push(LADDER[LADDER.length - 1]);

  const results = [];
  for (const level of levels) {
    const filename = `${baseName}_${level.quality}.mp4`;
    const outputPath = path.join(outputDir, filename);
    await transcodeRendition(inputPath, outputPath, level);
    results.push({ quality: level.quality, path: filename, height: level.height });
  }
  return results;
}

/** Extracts basic metadata (duration, width, height) for a video file. */
function probe(inputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, data) => {
      if (err) return reject(err);
      const stream = data.streams.find((s) => s.codec_type === 'video');
      resolve({
        durationSec: Math.round(data.format.duration || 0),
        width: stream?.width || null,
        height: stream?.height || null,
      });
    });
  });
}

/** Grabs a single frame as a JPEG thumbnail for carousels/hero art. */
function generateThumbnail(inputPath, outputDir, filename) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .on('end', () => resolve(path.join(outputDir, filename)))
      .on('error', (err) => reject(err))
      .screenshots({
        count: 1,
        timemarks: ['10%'],
        filename,
        folder: outputDir,
        size: '640x?',
      });
  });
}

module.exports = { transcodeToStreamable, transcodeLadder, probe, generateThumbnail };
