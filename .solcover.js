module.exports = {
  norpc: true,
  copyPackages: ['@aragon/os', '@aragon/test-helpers'],
  skipFiles: [
    'test',
    'examples',
    '@aragon/os',
    '@aragon/test-helpers/contracts/TimeHelpersMock.sol',
  ]
}
