import { AuthflowTemplate } from './authflow-template';
import { authflowFromTemplate } from './authflow-from-template';

describe('authflowFromTemplate', () => {
    it('should create an authflow instance from a template with empty approvals', () => {
        const template: AuthflowTemplate = {
            id: 'template-1',
            action: 'approve-invoice',
            steps: [
                {
                    id: 'step-1',
                    order: 0,
                    groups: [
                        {
                            id: 'group-1',
                            approvers: [
                                {
                                    id: '1',
                                    name: 'Alice',
                                    email: 'alice@example.com',
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const result = authflowFromTemplate(template);

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.action).toBe('approve-invoice');
        expect(authflow.isApproved).toBe(false);
        expect(authflow.steps).toHaveLength(1);
        expect(authflow.steps[0].isApproved).toBe(false);
        expect(authflow.steps[0].groups[0].isApproved).toBe(false);
        expect(authflow.steps[0].groups[0].approvals).toHaveLength(0);
        expect(authflow.steps[0].groups[0].approvers).toHaveLength(1);
    });

    it('should create a new ID for the instance (not reuse template ID)', () => {
        const template: AuthflowTemplate = {
            id: 'template-1',
            action: 'approve-invoice',
            steps: [],
        };

        const result = authflowFromTemplate(template);

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.id).toBeDefined();
        expect(authflow.id).not.toBe('template-1');
    });

    it('should handle template with multiple steps and groups', () => {
        const template: AuthflowTemplate = {
            id: 'template-1',
            action: 'approve-invoice',
            steps: [
                {
                    id: 'step-1',
                    order: 0,
                    groups: [
                        {
                            id: 'group-1',
                            approvers: [
                                {
                                    id: '1',
                                    name: 'Alice',
                                    email: 'alice@example.com',
                                },
                            ],
                        },
                        {
                            id: 'group-2',
                            approvers: [
                                {
                                    id: '2',
                                    name: 'Bob',
                                    email: 'bob@example.com',
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'step-2',
                    order: 1,
                    groups: [
                        {
                            id: 'group-3',
                            approvers: [
                                {
                                    id: '3',
                                    name: 'Charlie',
                                    email: 'charlie@example.com',
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const result = authflowFromTemplate(template);

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.isApproved).toBe(false);
        expect(authflow.steps).toHaveLength(2);
        expect(authflow.steps[0].groups).toHaveLength(2);
        expect(authflow.steps[1].groups).toHaveLength(1);
        expect(authflow.steps[0].groups[0].approvals).toHaveLength(0);
        expect(authflow.steps[0].groups[1].approvals).toHaveLength(0);
        expect(authflow.steps[1].groups[0].approvals).toHaveLength(0);
    });

    it('should handle template with empty steps', () => {
        const template: AuthflowTemplate = {
            id: 'template-1',
            action: 'approve-invoice',
            steps: [],
        };

        const result = authflowFromTemplate(template);

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.isApproved).toBe(true);
        expect(authflow.steps).toHaveLength(0);
    });

    it('should preserve approvers from the template', () => {
        const template: AuthflowTemplate = {
            id: 'template-1',
            action: 'approve-invoice',
            steps: [
                {
                    id: 'step-1',
                    order: 0,
                    groups: [
                        {
                            id: 'group-1',
                            approvers: [
                                {
                                    id: '1',
                                    name: 'Alice',
                                    email: 'alice@example.com',
                                },
                                {
                                    id: '2',
                                    name: 'Bob',
                                    email: 'bob@example.com',
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const result = authflowFromTemplate(template);

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        const approvers = authflow.steps[0].groups[0].approvers;
        expect(approvers).toHaveLength(2);
        expect(approvers[0].id).toBe('1');
        expect(approvers[0].name).toBe('Alice');
        expect(approvers[1].id).toBe('2');
        expect(approvers[1].name).toBe('Bob');
    });

    it('should preserve step order from the template', () => {
        const template: AuthflowTemplate = {
            id: 'template-1',
            action: 'approve-invoice',
            steps: [
                { id: 'step-1', order: 5, groups: [] },
                { id: 'step-2', order: 10, groups: [] },
            ],
        };

        const result = authflowFromTemplate(template);

        expect(result.isOk()).toBe(true);
        const authflow = result.unwrap();
        expect(authflow.steps[0].order).toBe(5);
        expect(authflow.steps[1].order).toBe(10);
    });
});
