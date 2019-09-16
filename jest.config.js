const esModules = ['crc'].join('|');

module.exports = {
    verbose: true,
    setupTestFrameworkScriptFile: "<rootDir>/src/browser/js/jest/setup.js",
    testMatch: [
      "**/**/__tests__/**/*.(js)"
    ],
    testURL: "https://localhost:8080",
    moduleNameMapper: {
      "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/src/browser/js/jest/__mocks__/fileMock.js",
      "\\.(css|scss)$": "identity-obj-proxy"
    },
    transformIgnorePatterns: [`/node_modules/(?!${esModules})`]
}