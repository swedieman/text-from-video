import { execCmd } from '@/utils/misc';
import fs from 'fs';

const SUBS_TEXT_DIR = '/tmp/texts';

export async function GET() {
  try {
    // Make sure we always have text directory so that readdirSync() doesn't fail.
    await execCmd(`mkdir -p ${SUBS_TEXT_DIR}`);

    const files = fs.readdirSync(SUBS_TEXT_DIR);

    if (!Array.isArray(files)) {
      return Response.json({ error: `Error listing files in directory: ${SUBS_TEXT_DIR}` });
    }

    return Response.json({ files: files.filter(filename => filename.endsWith('.txt')) });
  } catch (e) {
    console.error(e);
    return Response.json({ error: `Couldn't list text files in directory: ${SUBS_TEXT_DIR}. ${e.message}` });
  }
};
