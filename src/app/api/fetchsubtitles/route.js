import fs from 'fs';
import { execCmd } from '@/utils/misc';

const SUBS_TEMP_DIR = '/tmp/subs';  // Subtitles extracted from video is put in this directory before the text is cleaned up.
const SUBS_TEXT_DIR = '/tmp/texts'; // Directory where thee cleaned up (text only) subtitles end up as text files.

// To make yt-dlp work on production environment we need to pass cookie info exported from a logged YouTube/Google
// account. The IP series used on most production env providers is semi-blocked by YouTube (to prevent scraping).
const SECRET_YDL_COOKIE_FILE_PATH = '/ydl_cookies.txt';

const getSubTitlesFromVideo = async (url, useAutoSubs) => {
  const autoSubsStr = useAutoSubs ? ' --write-auto-subs' : '';
  const args = `--skip-download --write-subs --sub-langs "en" --output "${SUBS_TEMP_DIR}/%(title)s.%(ext)s"`;

  // Only include cookie arg if cookie file exists. yt-dlp works without cookie file locally and need to be set up
  // as a "secret file" on production server.
  const cookieFileExists = fs.existsSync(SECRET_YDL_COOKIE_FILE_PATH);
  const cookieArg = cookieFileExists ? ` --cookies ${SECRET_YDL_COOKIE_FILE_PATH}` : '';

  if (cookieFileExists) {
    console.log('YT cookie file found.');
  } else {
    console.log('No YT cookie found. Running without.')
  }

  // TODO: Will below work locally if we don't run ~/.local/bin/yt-dlp ?
  //       - How can we make it work on both?
  const command = `yt-dlp ${args}${cookieArg}${autoSubsStr} ${url}`;
  const stdout = await execCmd(command);

  // Seems like there's no good way to check if a "normally" translated language exist before trying to download it.
  // So right now we check if stdout contains exactly 'There are no subtitles for the requested languages',
  // which is not very pretty.
  if (stdout.includes('There are no subtitles for the requested languages')) {
    return false;
  }

  return true;
};

const convertToText = async () => {
  // Below will convert "all" subtitle files in SUBS_TEMP_DIR, but there should only be one file.
  await execCmd(`python3 subtotxt.py -o -d ${SUBS_TEMP_DIR}`);

  // Move all (but there should be only one) .txt files to /SUBS_TEXT_DIR.
  await execCmd(`mv ${SUBS_TEMP_DIR}/*.txt ${SUBS_TEXT_DIR}/`);
};

// Extract video subtitles to files and then convert to text files.
const extractText = async (url) => {
  try {
    if (!await getSubTitlesFromVideo(url, false)) {
      console.log('No regular English subtitles found. Tries to fetch auto generated.');
      await getSubTitlesFromVideo(url, true);
    }

    await convertToText();
  } catch (e) {
    console.error(e.message);
  }
};

const deleteSubtitleFiles = async () => {
  try {
    await execCmd(`rm ${SUBS_TEMP_DIR}/*`);
  } catch (e) {
    // Just print error otherwise ignoring it since it's probably just due to that no files exist in directory.
    console.error(e.message);
  }
};

const createFolders = async () => {
  await execCmd(`mkdir -p ${SUBS_TEMP_DIR}`);
  await execCmd(`mkdir -p ${SUBS_TEXT_DIR}`);
};

export async function POST(request) {
  const res = await request.json();

  if (!res.url) {
    console.error('Could not find URL in POST request.');
    return Response.json({ error: 'Could not find URL in POST request.' });
  }

  try {
    await createFolders();
    await deleteSubtitleFiles();
    await extractText(res.url);
    return Response.json({ message: 'OK' });
  } catch (e) {
    console.error(e.message);
    return Response.json({ error: e.message });
  }
};
