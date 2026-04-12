import pino from 'pino';

export const createPino = () => pino(pino.destination('/dev/null'));
