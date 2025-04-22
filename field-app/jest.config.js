/**
 * Jest test configuration.
 * Sets up the testing environment for the application.
 */

module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests/"],
  testMatch: ["**/*.test.js"],
  verbose: true,
};
