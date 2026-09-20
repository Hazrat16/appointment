import pino from 'pino';

// pino-pretty is a devDependency (not present in the production Docker image's
// node_modules), so only use it when it's actually resolvable — not just based
// on NODE_ENV, since e.g. docker-compose runs the prod-built image with
// NODE_ENV=development for verbose error stacks.
function prettyTransportIfAvailable() {
  if (process.env.NODE_ENV === 'production') return undefined;
  try {
    require.resolve('pino-pretty');
  } catch {
    return undefined;
  }
  return {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  };
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: prettyTransportIfAvailable(),
});

export default logger;
