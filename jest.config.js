module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    testRegex: '(/__tests__/.*|(\\.|/))(test|spec)\\.[jt]s?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
