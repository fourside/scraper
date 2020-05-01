import cliProgress, { Bar } from "cli-progress";
import _colors from 'colors';

export type ProgressBar = Bar;
export const progressBar: ProgressBar = new cliProgress.SingleBar({
    format: _colors.grey(' {bar}') + ' {percentage}% | {value}/{total}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
});
