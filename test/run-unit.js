const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

// mocha's default spec (test/*.js) loads this file too when it is given no files
if (require.main === module) {
  const files = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('Test.js') && !['internalTest.js', 'externalTest.js'].includes(file))
    .sort()
    .map(file => path.join(__dirname, file))
  // Each file runs in its own worker process, so one file's slow test no longer delays the rest.
  const result = spawnSync(process.execPath, [require.resolve('mocha/bin/mocha.js'), '--parallel', ...files, ...process.argv.slice(2)], { stdio: 'inherit' })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
}
