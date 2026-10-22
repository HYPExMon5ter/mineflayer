# Validation record

Executed locally on 2026-10-22 with Windows, Node.js v26.12.0 and Java 25 (OpenJDK 25.0.3). See [AUDIT.md](AUDIT.md) for scope, exclusions, dependency revisions and limitations. The [machine-readable record](validation-results.json) lists every log with its SHA-256; the logs themselves are local and not published.

This record replaces the one for `216b3abd`. It covers Mineflayer `0ebe4c7a` with minecraft-protocol `cbcee01` and prismarine-physics `31b5117` installed from the pinned published commits. All server-suite logs below were produced at that one commit with a clean working tree.

## Evidence format

Earlier internal logs used Mocha's dot reporter, which never prints the Minecraft version; several of them were byte-identical across versions (for example 26.1, 26.2 and 26.3), so their hashes could not identify a run. Every log here uses the spec reporter, so suite titles name the version, and starts with a header recording `MC_VERSION`, the test files, Node.js and Java versions, the Mineflayer commit (flagged if the tree had uncommitted changes) and the resolved companion packages. The generator rejects a log whose header or suite title does not match its version or commit, any failing log, and duplicate log contents. Old logs were not relabelled.

Passing internal tests used to print `ECONNABORTED`/`ECONNREFUSED` traces: a test that finished before the bot's TCP connection had completed closed the server underneath the handshake. Teardown now waits for the connection attempt to settle and disconnects the bot before closing the server. No error output is filtered; the logs below contain no such traces.

## Results

The first hosted run ([39740140539](https://github.com/HYPExMon5ter/mineflayer/actions/runs/39740140539), baseline `216b3abd`) passed lint and both unit jobs but failed the 26.3 delayed-respawn/transfer test. Its observation window started before the client received `start_configuration`, so normal movement still in play was misclassified as post-transfer movement. The test now resets the recording at receipt, before client handlers execute, and still waits beyond the delayed reply deadline. The focused test passes on 1.20.2, 1.21.11, 26.2 and 26.3; the parent also independently reran all 79 unit tests, lint and the consumer typecheck. Hosted success for the follow-up must be established separately.

- Internal protocol-server matrix: **2243 passing, 292 pending, zero failures across 30 versions**. Pending tests are version/feature skips; the new 26.3 swing animation test accounts for 29 of them.
- Internal + vanilla server suites: **3923 passing, 292 pending, zero failures across 30 versions**, with the existing exclusions (`digEverything`, `anvil`, `placeEntity`).
- Standalone unit/regression suite: **79 passing**. Lint and the TypeScript consumer check (`test:types`) pass.
- Clean application install of the packed tarball without `overrides`: passed. Mineflayer, minecraft-protocol, prismarine-chunk, prismarine-physics, prismarine-registry, prismarine-item and prismarine-block all resolve one minecraft-data with the corrected 26.3 sign schema and the documented integrity; the installed protocol and physics forks contain the new cache and feature ranges; a real sign packet round-trips; the tarball contains no shrinkwrap.
- Packaging: `npm pack --dry-run` lists 184 files and excludes `npm-shrinkwrap.json`, as intended (see AUDIT.md).
- npm audit snapshot: the development graph reports 29 findings (9 high, 19 moderate, 1 low), unchanged; the clean consumer reports 6 moderate findings, unchanged. Not represented as fixed.

### Companion packages

- minecraft-protocol `cbcee01`: lint passes. The focused suites (custom protocol isolation and reuse, entity deltas, lpVec3, modern login, packet cycling, registry holders, command trees, documentation) report 1072 passing and 15 pending. The full packet round-trip suite passes for 1.8.8 and 1.20.4. For 26.3 it fails 71 cases, identically on the unmodified `d0d97e7`: the test's packet generator cannot produce values for new 26.3 types (`PositionPath` switches, `entityDelta`, `ItemStackTemplate`, ...). That test-generator gap is not addressed here; the 26.3 wire format is covered by the focused suites and by the Mineflayer internal and vanilla suites.
- prismarine-physics `31b5117`: lint and 57 tests pass, including soul sand and ladder-trapdoor behavior on 1.16.5, 1.20.4, 1.21.11 and 26.3; those tests fail on 1.21.11 and 26.3 without the change. Comparing old and new feature applicability for every major version from 1.7 to 26.3 changes only `velocityBlocksOnTop` and `climbableTrapdoor` on 1.21–26.3.
- minecraft-data, its wrapper and prismarine-chunk were not changed; their earlier results (902 and 333 passing) still apply.

## Matrix

| Java version | Internal passing | Internal pending | Internal + vanilla passing | Internal + vanilla pending |
|---|---:|---:|---:|---:|
| 1.8.8 | 64 | 20 | 120 | 20 |
| 1.9.4 | 66 | 18 | 122 | 18 |
| 1.10.2 | 66 | 18 | 122 | 18 |
| 1.11.2 | 66 | 18 | 122 | 18 |
| 1.12.2 | 66 | 18 | 122 | 18 |
| 1.13.2 | 66 | 18 | 122 | 18 |
| 1.14.4 | 66 | 18 | 122 | 18 |
| 1.15.2 | 66 | 18 | 122 | 18 |
| 1.16.5 | 66 | 18 | 122 | 18 |
| 1.17.1 | 70 | 14 | 126 | 14 |
| 1.18.2 | 70 | 14 | 126 | 14 |
| 1.19 | 73 | 11 | 129 | 11 |
| 1.19.2 | 73 | 11 | 129 | 11 |
| 1.19.3 | 73 | 11 | 129 | 11 |
| 1.19.4 | 74 | 10 | 130 | 10 |
| 1.20.1 | 74 | 10 | 130 | 10 |
| 1.20.2 | 77 | 7 | 133 | 7 |
| 1.20.4 | 78 | 6 | 134 | 6 |
| 1.20.6 | 77 | 7 | 133 | 7 |
| 1.21.1 | 78 | 6 | 134 | 6 |
| 1.21.3 | 80 | 4 | 136 | 4 |
| 1.21.4 | 82 | 2 | 138 | 2 |
| 1.21.5 | 82 | 2 | 138 | 2 |
| 1.21.6 | 82 | 2 | 138 | 2 |
| 1.21.8 | 82 | 2 | 138 | 2 |
| 1.21.9 | 82 | 2 | 138 | 2 |
| 1.21.11 | 82 | 2 | 138 | 2 |
| 26.1 | 87 | 2 | 143 | 2 |
| 26.2 | 87 | 2 | 143 | 2 |
| 26.3 | 88 | 1 | 144 | 1 |

## Failures investigated

The first follow-up matrix (at `bcca2bd0`) failed three of 30 versions, and both causes were reproduced before anything changed:

- 1.13.2 furnace: the world reset refills only after a `blockUpdate` marks the world dirty, but fishing's 441-block water fill reaches the client only as whole-chunk resends (traced: 0 `blockUpdate`, 4–100 `chunkColumnLoad`). With fishing directly before furnace, the furnace was placed over water and refused in 2 of 2 isolated runs. Column loads now mark the world dirty; 2 of 2 runs then passed.
- 1.17.1 and 1.19.3 Nether: tracing showed the arrival teleport is sent with the respawn while `update_health`, which emits `spawn`, comes about a second later after chunk generation. The fixture waited for `forcedMove` only after `spawn`, so whenever the bot answered the teleport first it waited for a second one. It now waits for both after the dimension change.

Neither cause is in runtime code, and the failing runs are not counted.

A rerun at `0ebe4c7a` was discarded because its headers showed the servers had started with Java 8 from the inherited Windows `Path`: 1.17.1 and later could not start, and 1.12.2's `exampleBee` timed out waiting for chunks. The runner now passes one explicit search path with Java 25 first and refuses to start otherwise; `exampleBee` then passed 3 of 3 isolated 1.12.2 runs. The matrix below is the subsequent run. Of the first internal-only run (with the companion changes overlaid before publication), 1.8–1.12 failed one test that sends a JSON title on legacy versions; the title handling was changed to parse genuine JSON components on every version, as upstream did. The same run also showed a `MaxListenersExceededWarning`, caused by a new client `login` listener; that listener now uses the bot's `login` event.

Earlier failures recorded for `216b3abd` (the airborne ender pearl in the cooldown test, idle status connections on fresh modern servers) remain fixed as described in AUDIT.md.

This covers the listed test points, not every patch release. Hosted CI status is separate and must be checked for the published commit.
