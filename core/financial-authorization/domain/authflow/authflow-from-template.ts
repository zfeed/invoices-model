import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { stepsFromTemplates } from '../step/step-template';
import { Authflow, createAuthflow } from './authflow';
import { AuthflowTemplate } from './authflow-template';

export const authflowFromTemplate = (
    template: AuthflowTemplate
): Result<DomainError, Authflow> =>
    stepsFromTemplates(template.steps).flatMap((steps) =>
        createAuthflow({ action: template.action, steps })
    );
