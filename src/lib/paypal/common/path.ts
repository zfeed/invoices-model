export class Path {
    protected constructor(public readonly value: string) {}

    public static create(strings: TemplateStringsArray, ...args: string[]) {
        const value = strings.reduce((accumulator, current, index) => {
            const argument = args[index];

            if (argument !== undefined) {
                return `${accumulator}${current}${encodeURIComponent(
                    argument
                )}`;
            }

            return `${accumulator}${current}`;
        }, '');

        return new Path(value);
    }
}
