import { DomainError } from '../../../../building-blocks/errors/domain/domain.error';
import { Result } from '../../../../building-blocks/result';
import { Action } from '../action/action';
import { Authflow } from './authflow';
import { AuthflowTemplate } from './authflow-template';

export const authflowFromTemplate = (
    action: Action,
    template: AuthflowTemplate
): Result<DomainError, Authflow> => template.toAuthflow(action);
