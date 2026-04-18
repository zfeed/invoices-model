import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';

dayjs.extend(duration);

export default dayjs;
export { type Duration } from 'dayjs/plugin/duration.js';
