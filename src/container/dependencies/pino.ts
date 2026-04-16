import pino, { LevelWithSilent } from 'pino';

export const createPino = (level: LevelWithSilent) =>
    pino({ level }, pino.destination('/dev/null'));
