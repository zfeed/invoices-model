import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Commands } from '../types';
import { parse } from '../validation';
import { fromString } from '../../core/financial-authorization/domain/id/id';
import { createName } from '../../core/financial-authorization/domain/name/name';
import { createEmail } from '../../core/financial-authorization/domain/email/email';
import { Approver } from '../../core/financial-authorization/domain/approver/approver';

const approveActionSchema = z.object({
    action: z.string(),
    approver: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
    }),
});

export const approveActionOnDocumentRoute = (commands: Commands) =>
    async (app: FastifyInstance) => {
        app.post<{ Params: { referenceId: string } }>(
            '/documents/:referenceId/approve',
            async (request) => {
                const referenceId = request.params.referenceId;
                const data = parse(approveActionSchema, request.body);
                const approver: Approver = {
                    id: fromString(data.approver.id).unwrap(),
                    name: createName(data.approver.name).unwrap(),
                    email: createEmail(data.approver.email).unwrap(),
                };
                const result = await commands.approveActionOnDocument({
                    referenceId,
                    action: data.action,
                    approver,
                });
                return { data: result };
            }
        );
    };
