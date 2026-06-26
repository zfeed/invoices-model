import { AddressInfo } from 'net';
import { TestProject } from 'vitest/node';
import { init } from '../src/platform/application/init.ts';

export default async function setup(project: TestProject) {
    const { app } = await init();

    await app.start(0);

    const { port } = app.http.server.address() as AddressInfo;
    project.provide('e2eBaseUrl', `http://localhost:${port}`);

    return async () => {
        await app.stop();
    };
}
