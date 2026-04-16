import pino, { LevelWithSilent } from 'pino';

type Options = {
    stdout: boolean;
    level: LevelWithSilent;
};

export const createPino = ({ stdout, level }: Options) =>
    stdout
        ? pino({
              level,
              transport: {
                  target: 'pino-pretty',
                  options: { destination: 1 },
              },
          })
        : pino({ level }, pino.destination('/dev/null'));
