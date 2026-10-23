import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const core = require('../featurePack.cjs');
export const createTasksRouter = core.createTasksRouter;
export default core;
