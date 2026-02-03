import { execCmd } from '@/utils/misc';
import fs from 'fs';

const SUBS_TEXT_DIR = '/tmp/texts';

export async function POST(request) {
  const res = await request.json();

  if (!res.filename) {
    console.error('Could not find filename in POST request.');
    return Response.json({ error: 'Could not find filename in POST request.' });
  }

  try {
    // Make sure we always have text directory so that readFileSync() doesn't fail.
    await execCmd(`mkdir -p ${SUBS_TEXT_DIR}`);

    const data = fs.readFileSync(`${SUBS_TEXT_DIR}/${res.filename}`, 'utf8');
    const headers = new Headers();

    // Clean up unicode characters in filename.
    // It would be nicer to do this on download where the files are created but it's more tricky there since
    // the download/text extraction/file move is done by tools not having direct access to the filename.
    const filename = res.filename.replace(/[^\x00-\x7F]/g, '');
    headers.append('Content-Disposition', `attachment; filename="${filename}"`);
    headers.append('Content-Type', 'application/text');

    return new Response(data, { headers });
  } catch (e) {
    console.error(e);
    return Response.json({ error: `Couldn't list text files in directory: ${SUBS_TEXT_DIR}. ${e.message}` });
  }
};
