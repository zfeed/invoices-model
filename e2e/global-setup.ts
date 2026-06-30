import { AddressInfo } from 'net';
import { TestProject } from 'vitest/node';
import { init } from '../src/platform/application/init.ts';

export default async function setup(project: TestProject) {
    const { app } = await init();

    await app.start(0);

    const { port } = app.http.server.address() as AddressInfo;
    const baseUrl = `http://localhost:${port}`;
    project.provide('e2eBaseUrl', baseUrl);

    const res = await fetch(`${baseUrl}/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'E2E Org',
            member: { firstName: 'E2E', lastName: 'Member' },
        }),
    });
    const { data } = (await res.json()) as {
        data: { organization: { id: string }; member: { id: string } };
    };
    project.provide('e2eOrganizationId', data.organization.id);
    project.provide('e2eMemberId', data.member.id);

    return async () => {
        await app.stop();
    };
}
