import { spawn } from "node:child_process";

/**
 * Executes a command safely using child_process.spawn with arguments array.
 * Prevents shell injection by enforcing shell: false.
 *
 * @param {string} cmd - Executable binary or path
 * @param {string[]} args - Command arguments array
 * @param {object} opts - Additional spawn options
 * @returns {Promise<{ stdout: string, stderr: string, code: number }>}
 */
export function run(cmd, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const timeout = opts.timeout ?? 60000; // Default 60s timeout
    const child = spawn(cmd, args, {
      shell: false,
      timeout,
      ...opts,
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('error', (err) => {
      reject(err);
    });

    child.on('close', (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code: code ?? 0,
      });
    });
  });
}

/**
 * Spawns a detached, unref'd child process for long-running background tasks.
 *
 * @param {string} cmd - Executable binary or path
 * @param {string[]} args - Command arguments array
 * @param {object} opts - Additional spawn options
 * @returns {import("node:child_process").ChildProcess}
 */
export function spawnDetached(cmd, args = [], opts = {}) {
  const child = spawn(cmd, args, {
    detached: true,
    stdio: 'ignore',
    shell: false,
    ...opts,
  });

  child.unref();
  return child;
}
