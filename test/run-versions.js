// Runs the internal and external (vanilla server) suites of every tested version, one mocha
// process per suite and version, in parallel. The internal suites mostly wait on timers, so
// they all run at once; the external suites each start a vanilla server, so --jobs limits them.
// The internal suites run first, on their own: their timing tests failed under the CPU load
// of several vanilla servers booting at once.
//
// usage: node test/run-versions.js [options] [version...] [-- mocha options]
//   --suite internal|external  run only that suite (default: both)
//   --jobs N                   external suites (vanilla servers) at once (default: one per 3 CPUs)
//   --internal-jobs N          internal suites at once (default: one per CPU)
//   --logs DIR                 where logs, durations and traces go (default test-results)
//   --keep-traces              keep the packet traces of passing external suites too
// Versions default to MC_VERSION, else every tested version.
//
// Each suite writes <logs>/<suite>-<version>.log and durations-<suite>-<version>.json; an
// external suite also writes trace-<version>.jsonl, deleted when it passes (traces run to
// ~100 MB per version). A failing suite's mocha report is printed at the end.
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawn } = require('child_process')
const { parseArgs } = require('util')

const SUITES = ['internal', 'external']

function parseOptions (argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      suite: { type: 'string' },
      // A booting server keeps about three cores busy; 8 at once on 24 cores ran clean.
      jobs: { type: 'string', default: String(Math.max(1, Math.floor(os.availableParallelism() / 3))) },
      'internal-jobs': { type: 'string', default: String(os.availableParallelism()) },
      logs: { type: 'string', default: 'test-results' },
      'keep-traces': { type: 'boolean', default: false }
    }
  })
  if (values.suite && !SUITES.includes(values.suite)) throw new Error(`unknown suite ${values.suite}`)
  const limit = name => {
    const n = Number(values[name])
    if (!Number.isInteger(n) || n < 1) throw new Error(`--${name} must be a positive integer`)
    return n
  }
  // parseArgs returns everything after -- as positionals too
  const separator = argv.indexOf('--')
  const mochaArgs = separator === -1 ? [] : argv.slice(separator + 1)
  return {
    suites: values.suite ? [values.suite] : SUITES,
    limits: { internal: limit('internal-jobs'), external: limit('jobs') },
    logDir: path.resolve(values.logs),
    keepTraces: values['keep-traces'],
    versionArgs: positionals.slice(0, positionals.length - mochaArgs.length),
    mochaArgs
  }
}

function main () {
  const options = parseOptions(process.argv.slice(2))
  if (options.versionArgs.length) process.env.MC_VERSION = options.versionArgs.join(' ')
  const versions = require('./common/versions').getTestVersions()
  fs.mkdirSync(options.logDir, { recursive: true })

  const mocha = require.resolve('mocha/bin/mocha.js')
  const started = Date.now()
  const seconds = since => ((Date.now() - since) / 1000).toFixed(0)

  function run (suite, version) {
    const log = path.join(options.logDir, `${suite}-${version}.log`)
    const trace = path.join(options.logDir, `trace-${version}.jsonl`)
    const env = { ...process.env, MC_VERSION: version, DURATIONS: path.join(options.logDir, `durations-${suite}-${version}.json`) }
    if (suite === 'external') env.TRACE = trace
    const args = [mocha, '--reporter', path.join(__dirname, 'common/durationsReporter.js'), '--exit', path.join(__dirname, `${suite}Test.js`), ...options.mochaArgs]
    const out = fs.openSync(log, 'w')
    const child = spawn(process.execPath, args, { env, stdio: ['ignore', out, out] })
    fs.closeSync(out)
    const begun = Date.now()
    return new Promise(resolve => {
      child.on('error', err => {
        fs.appendFileSync(log, `\n${err.stack}\n`)
        resolve(1)
      })
      child.on('exit', (code, signal) => resolve(code ?? signal))
    }).then(code => {
      const text = fs.readFileSync(log, 'utf8')
      const counts = ['passing', 'pending', 'failing']
        .map(kind => text.match(new RegExp(`^\\s+\\d+ ${kind}`, 'm'))?.[0].trim())
        .filter(Boolean).join(', ')
      if (code === 0 && suite === 'external' && !options.keepTraces) fs.rmSync(trace, { force: true })
      console.log(`[${seconds(started).padStart(4)}s] ${code === 0 ? 'ok  ' : 'FAIL'} ${suite} ${version} in ${seconds(begun)}s (${counts || `exit ${code}`})`)
      return { suite, version, code, log, text }
    })
  }

  // One queue per suite, drained by that suite's number of workers.
  async function pool (suite) {
    const queue = [...versions]
    const results = []
    const worker = async () => {
      while (queue.length) results.push(await run(suite, queue.shift()))
    }
    await Promise.all(Array.from({ length: Math.min(options.limits[suite], queue.length) }, worker))
    return results
  }

  async function runSuites () {
    const results = []
    for (const suite of options.suites) results.push(...await pool(suite))
    return results
  }

  return runSuites().then(results => {
    const failed = results.filter(result => result.code !== 0)
    for (const { suite, version, log, text } of failed) {
      // mocha's report of the failures follows its "N passing" summary line
      const summary = text.search(/^\s+\d+ passing/m)
      console.log(`\n===== FAILED: ${suite} ${version} (${log})\n${summary === -1 ? text.slice(-20000) : text.slice(summary)}`)
    }
    console.log(`\n${results.length - failed.length} of ${results.length} suites passed in ${seconds(started)}s; logs in ${options.logDir}`)
    process.exitCode = failed.length ? 1 : 0
  })
}

// mocha's default spec (test/*.js) loads this file too when it is given no files
if (require.main === module) main()
