# YouTube video subtitle text extractor.

This is a [Next.js](https://nextjs.org) project.

English subtitles are extracted from the provided YouTube URL (expected to go to a YouTube video). If no regular
English translation is found it will try to use auto translation. Then the text from the subtitle file is extracted
and provided as pure text that can be downloaded as a file or copied to clipboard.

## Getting Started

### Prerequisite before running application:
1. Install a new stable version of yt-dlp globally. Very old versions wont work.
2. Make sure the Python3 packages send2trash and charset-normalizer is installed.
3. Make sure you have a newer version of NPM installed.

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
