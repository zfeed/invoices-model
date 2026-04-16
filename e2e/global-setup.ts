import 'dotenv/config';
import { AddressInfo } from 'net';
import { TestProject } from 'vitest/node';
import { createApp } from '../src/http/create-app.ts';

export default async function setup(project: TestProject) {
    const app = await createApp();

    await app.listen({ port: 0 });

    const { port } = app.server.address() as AddressInfo;
    project.provide('e2eBaseUrl', `http://localhost:${port}`);

    return async () => {
        await app.close();
    };
}
