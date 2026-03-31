import { spawn } from 'node:child_process';

export const runCommand = async ({
    command,
    args,
    env,
}: {
    command: string;
    args: string[];
    env: NodeJS.ProcessEnv;
}): Promise<number> =>
    new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            env,
            stdio: 'inherit',
        });

        child.on('error', reject);
        child.on('exit', (code, signal) => {
            if (signal) {
                resolve(1);
                return;
            }

            resolve(code ?? 1);
        });
    });
