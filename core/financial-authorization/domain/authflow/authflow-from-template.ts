import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Action } from '../action/action';
import { stepsFromTemplates } from '../step/step-template';
import { Authflow, createAuthflow } from './authflow';
import { AuthflowTemplate } from './authflow-template';

export const authflowFromTemplate = (
    action: Action,
    template: AuthflowTemplate
): Result<DomainError, Authflow> =>
    stepsFromTemplates(template.steps).flatMap((steps) =>
        createAuthflow({ action, range: template.range, steps })
    );
