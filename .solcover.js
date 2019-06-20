module.exports = {
  norpc: true,
  copyPackages: ['@aragon/os', '@aragon/test-helpers'],
  skipFiles: [
    'test',
    '@aragon/os',
    '@aragon/test-helpers/contracts/TimeHelpersMock.sol',
  ]
}
