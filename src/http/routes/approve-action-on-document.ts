import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Commands } from '../types';
import { parse } from '../validation';
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
                const approver = Approver.fromPlain({
                    id: data.approver.id,
                    name: data.approver.name,
                    email: data.approver.email,
                });
                const result = await commands.approveActionOnDocument.execute({
                    referenceId,
                    action: data.action,
                    approver,
                });
                return { data: result };
            }
        );
    };
