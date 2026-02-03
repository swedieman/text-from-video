import { exec } from 'child_process';

const execCmd = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(error.message));
      } else if (stderr) {
        // We may get warnings we don't need to care about here, so just print it.
        console.error(`stderr for: ${stderr}`);
      }

      resolve(stdout);
    });
  });
};

export { execCmd };
