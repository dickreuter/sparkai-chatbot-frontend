module.exports = {
    preset: "ts-jest/presets/js-with-ts-esm",
    testEnvironment: "jest-environment-jsdom",
    moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
        "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js"
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    transform: {
        "^.+\\.[tj]sx?$": ["ts-jest", {
            useESM: true,
            tsconfig: {
                module: "es2022" // Add this
            }
        }]
    },
    transformIgnorePatterns: ["node_modules/(?!(react-auth-kit|axios)/)"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    extensionsToTreatAsEsm: [".ts", ".tsx"],
    setupFiles: ["<rootDir>/.env.test"]
};