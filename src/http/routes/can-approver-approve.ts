import { FastifyInstance } from 'fastify';
import { Commands } from '../types';

export const canApproverApproveRoute = (commands: Commands) =>
    async (app: FastifyInstance) => {
        app.get<{
            Params: { referenceId: string };
            Querystring: { approverId: string; action: string };
        }>(
            '/documents/:referenceId/can-approve',
            async (request) => {
                const { referenceId } = request.params;
                const { approverId, action } = request.query;
                const answer = await commands.canApproverApprove
                    .can(approverId)
                    .perform(action)
                    .on(referenceId)
                    .ask();
                return { data: { answer } };
            }
        );
    };
