const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const files = fs.readdirSync(__dirname)
  .filter(file => file.endsWith('Test.js') && !['internalTest.js', 'externalTest.js'].includes(file))
  .sort()
  .map(file => path.join(__dirname, file))
const result = spawnSync(process.execPath, [require.resolve('mocha/bin/mocha'), ...files, ...process.argv.slice(2)], { stdio: 'inherit' })
if (result.error) throw result.error
process.exitCode = result.status ?? 1
