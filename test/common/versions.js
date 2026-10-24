const { testedVersions } = require('../../lib/version')

// Filter before constructing registries and suites, not after Mocha has
// initialized all versions. A typo must fail instead of running zero tests.
function getTestVersions () {
  if (!process.env.MC_VERSION) return testedVersions
  const requested = [...new Set(process.env.MC_VERSION.split(/[\s,]+/).filter(Boolean))]
  for (const version of requested) {
    if (!testedVersions.includes(version)) throw new Error(`Unsupported test version: ${version}`)
  }
  if (!requested.length) throw new Error('MC_VERSION must contain at least one version')
  return requested
}

module.exports = { getTestVersions }
