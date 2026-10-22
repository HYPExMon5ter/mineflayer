# Java 1.8–26.3 compatibility and reliability audit

This fork starts from PrismarineJS/mineflayer commit `7b4bb8d2b56be9cdb832474af873acd37e609746`. The audit was performed on 2026-10-21/22 with Java Edition 26.3 as the current stable release. It includes source review, screening of 436 open issues and 118 open PRs, targeted regression fixes, companion dependency forks, and internal plus real vanilla-server testing. [UPSTREAM-TRIAGE.md](UPSTREAM-TRIAGE.md) preserves every screened issue/PR and distinguishes implementation from deferred or unverified reports.

The public Mineflayer API is retained apart from the additions and deliberate behavior changes listed under [Intentional API changes](#intentional-api-changes). This is not a claim that every upstream issue is fixed, every patch release has been exercised, or third-party plugins/proxies and Microsoft authentication have been validated. No upstream PRs were merged or issues closed by this work.

## Installation and reproducibility

Use Node.js 22 or newer and Git. From an application:

```sh
npm install github:HYPExMon5ter/mineflayer#audit/java-26.3
```

Pin a commit rather than the moving branch for deployment. Companion dependencies are pinned in `package.json` to commits, and minecraft-data to a built release archive because a Git install with scripts disabled does not include its generated data/submodule contents. Companion packages also pin the same data archive: root `overrides` alone do not propagate when Mineflayer is installed as a dependency.

The committed `npm-shrinkwrap.json` makes installs of this checkout (`npm ci`, CI) reproducible. It is deliberately not part of the package: the `files` allowlist excludes it (verified with `npm pack --dry-run`), so an application resolves Mineflayer's transitive dependencies through its own lockfile instead of being frozen to this graph, and keeps receiving their fixes. Packaging explicitly includes source, declarations, documentation and examples, excluding test worlds, downloaded server jars and local account data.

A Git commit pin is content-addressed; a GitHub release asset is not, because the fork owner can replace it. The tested minecraft-data archive `minecraft-data-3.117.0.tgz` has SHA-256 `6fc5137f2780c3d137c7109e4422b89f495355b33621a7af5fce5dca1b03f0a6` (npm integrity `sha512-6udiqPYYRwi4SLfSoIGokBM5vY75Dowrjv9ivP/FduuJzh0UlajidkGgUfbmt+2/lFi/37J9Fm6hTKUByfOtjA==`, recorded in the shrinkwrap). The asset downloaded on 2026-10-22 matched both. An application's lockfile records the integrity of the archive it first installed and rejects a later replacement; verify the hash before that first install if it matters.

| Dependency | Tested source |
|---|---|
| minecraft-data source | [4d6d514](https://github.com/HYPExMon5ter/minecraft-data/commit/4d6d51441f1f0017bdaa5d3511b3375d19d7d588) |
| node-minecraft-data wrapper | [2cc19a6](https://github.com/HYPExMon5ter/node-minecraft-data/commit/2cc19a6c84a9a15daec9ce53152f5814fc1b53e1), [built data release](https://github.com/HYPExMon5ter/node-minecraft-data/releases/tag/java-26.3-data-2) |
| minecraft-protocol | [cbcee01](https://github.com/HYPExMon5ter/node-minecraft-protocol/commit/cbcee01724045e770b8a441700b2781b3dc67bb6) |
| prismarine-chunk | [8446109](https://github.com/HYPExMon5ter/prismarine-chunk/commit/84461090b8f6469b7eaa0a4aea35acca023a08d7) |
| prismarine-physics | [31b5117](https://github.com/HYPExMon5ter/prismarine-physics/commit/31b5117038860844eddd5824aacaedaeaf0ff1c0) |

## Significant findings and changes

### Wire compatibility

- Upstream had started writing string action names to legacy numeric `entity_action` and `client_command` fields. On 1.8 this made waking encode as sneaking; statistics requests could encode as respawn and stall creative-slot confirmation. `lib/protocolActions.js` selects numeric values or mapper names/aliases from the actual schema. Tests serialize the real packets for all 30 versions.
- Added 26.2/26.3 data, protocol, chunk and physics support through the companion chain. Corrected unsigned lpVec3 scaling and rejected malformed empty entity-delta paths. Entity velocities already expressed in blocks/tick are no longer divided by 8000.
- Corrected 26.3 sign packet field order and front/back slot encoding against the vanilla server classes. The sign suite exercises server-echoed text, not merely successful packet serialization.
- Adapted 26.3 digging/release action IDs, movement deltas, entity animation IDs, per-axis particle speeds, and widened teleport confirmations. Strict 26.3 movement scheduling emits at most one movement packet per client tick, including queued teleports and respawns.
- Fixed modern mock-server login success packets to include a session UUID. Custom protocol overrides no longer mutate shared minecraft-data or leak between override objects. Protocols built from one `customPackets` object are cached for that object, so clients and state changes sharing it compile once; compiled and interpreted paths have isolation and reuse tests.

### State and lifecycle

- Plugin injection happens before packets can arrive. Entity-placement waits survive unrelated spawns. Bed, book and promise timeout paths clean up listeners/timers and restore state.
- Resource-pack responses use the correct ID/hash shape and acknowledgement sequence, answer each request once, and can address one of several outstanding 1.20.3+ packs. During configuration a request that no listener answers synchronously is accepted, as upstream does, so logging listeners cannot stall a transfer; this does not download or apply resource-pack assets.
- Inventory state IDs are tracked per window. Closing, respawning and re-login have explicit lifecycle handling. Unknown window types emit `unknownWindow` instead of dereferencing a missing window. Creative-slot updates compare nullable items and release locks on every exit.
- Item-use state survives unrelated entity status notifications and understands modern cooldown groups. Passenger/vehicle links are reconciled before attach/detach/mount events, including vehicle removal.
- Health distinguishes metadata bitmasks from legacy booleans; dimension transitions emit spawn without inventing a death. `player_loaded` waits for terrain or a bounded fallback and is cancelled when the session changes. World chunk ownership includes world name, not just dimension type.
- Modern score/reset packets, chat-component objective titles, cleared display slots, empty titles and overlapping chat patterns are handled. Plain-string titles, including legacy `§` formatting codes, are kept as sent. Time resolves world clocks through the registry and preserves overworld day time across dimensions.

### Correctness and test efficiency

- Cursor raycasts accept zero yaw/pitch and start at eye height. Look promises wait for both axes. Dig duration is calculated after aiming. Anvil limits use version features. Explosion exposure uses entity dimensions and handles zero-size/zero-distance samples. Empty chunk batches cannot poison the pacing average.
- Exact `MC_VERSION` selection happens before loading registries. Unit tests run independently from server suites. CI caches dependencies and server jars, retains bounded version groups, and has a stable aggregate gate; failed processes are detected by exit status, including failures before Mocha prints a summary.
- Trace-worker errors cannot make shutdown wait forever. Trace tests clean their temporary files. The cooldown test removes its thrown pearl before the next test: leaving it airborne could teleport the bot out of the Nether later. Nether tests acknowledge arrival before a second teleport and bound terrain waits with diagnostics. Empty-server pausing is disabled in the harness so modern status/login probes remain responsive. Internal teardown lets the bot's connection attempt settle before closing the server, the vanilla world reset also treats chunk resends as changes, and the Nether test accepts the arrival teleport before or after `spawn`. The villager fixture uses a stable demand-driven price rather than a reputation discount the server can reset; discounted (negative `specialPrice`) pricing is covered by a unit test of vanilla's cost formula instead.
- These are concrete reductions in redundant setup, blocked work and failure diagnosis. No general runtime throughput/CPU improvement percentage is claimed; this audit did not run a controlled application benchmark.

## Intentional API changes

- `scoreboardPositionCleared` (position, previous) is new: it reports a display slot that stopped showing an objective. `scoreboardPosition` keeps a non-null scoreboard and documents its existing third `previous` argument.
- `bot.acceptResourcePack([request])` and `bot.denyResourcePack([request])` take an optional request id (UUID or hash) or URL. Without one they answer the most recent request, as before. The `resourcePack` declaration now names its second argument `hashOrUuid`, which is what has always been passed; the never-provided third parameter remains only for source compatibility.
- During configuration a resource pack that no listener answers synchronously is accepted after the event. Upstream accepted unconditionally, even after a listener declined; an earlier revision of this fork let any listener suppress acceptance, which stalled transfers for listeners that only logged.
- `unknownWindow` also closes the unsupported menu on the server.
- On 26.3, `entitySwingArm` comes from the swing animation packet and covers main-hand swings, like older versions.
- On 1.21.2+, the bot's own teleports apply the packet velocity and its relative flags, rotate the velocity for `yawDelta`, and clamp pitch to ±90°, as vanilla does. Previously an absolute teleport always zeroed the velocity.
- On 1.21+, physics applies the soul sand/honey speed factor and climbable trapdoors above ladders, which vanilla still implements.
- `bot.writeBook` rejects with an `AggregateError` of the original and the restore error when moving the book back also fails.
- `bot.isAlive` and `bot.time.clocks` existed but were undocumented; they are now documented and typed.

## Review follow-up

An independent review of the first published revision (`216b3abd`) raised the findings below. Each was reproduced or checked against vanilla 26.3 server bytecode before changing behavior, and each change has a test that fails without it unless noted.

| Finding | Disposition |
|---|---|
| 26.3 arm swings use `swing_animation`, so `entitySwingArm` never fired | Fixed. Packet layout confirmed from `ClientboundSwingAnimationPacket`; the animation table is chosen once per bot from the schema. Unit and wire-level internal tests. |
| `dig(bedrock)` aborted the active dig and turned the bot first | Fixed. Dig time is validated before aiming and again after aiming, before the active dig is stopped; the `is Infinity` message is kept. |
| `scoreboardPosition` emitted an undefined scoreboard on clear, contrary to its types | Fixed with the separate `scoreboardPositionCleared` event; types and consumer test updated. |
| Legacy (1.8–1.12) scoreboard titles lost `§` codes | Fixed. Only genuine JSON components are converted; plain strings are kept, and JSON titles still read as text on every version, as upstream did. |
| Logging-only `resourcePack` listeners stalled configuration; wrong declaration; only the latest pack answerable | Fixed as described above. Per-request answers are an optional argument rather than a new API shape. |
| `customPackets` disabled the compiled-protocol cache (~100 ms per state per client) | Fixed in minecraft-protocol `fccbf55` with a cache keyed by the `customPackets` object; repeated state changes reuse it. Local timing: ~85 ms for the first compile, ~0.05 ms for reuse, a single observation rather than a benchmark. |
| `unknownWindow` left the menu open on the server, so later clicks time out | Confirmed: vanilla `handleContainerClick` ignores clicks for any container other than the open one. Fixed by closing it. |
| Creative `Item.equal` could reject an equivalent server echo | Confirmed with a different cause: on 1.21.3+ `Item.toNotch` drops NBT-only properties, so an echo of exactly what was sent differed from the caller's item. Echoes are compared with the item as sent. NBT key order itself is not compared on these versions. |
| `nbt.addTypesToInterpreter` may not exist in prismarine-nbt `^2.5.0` | Not a defect: 2.5.0, 2.6.0 and 2.7.0 all export `addTypesToInterpreter`; only the 2.5.0 changelog entry misspells it. The range is correct. |
| Proxy re-login without respawn never emitted `spawn` or `player_loaded` | Fixed: every login marks spawn pending; the initial spawn is emitted once. |
| Own-player 1.21.2+ teleports ignored velocity values and flags | Fixed with the vanilla `PositionMoveRotation.calculateAbsolute` rules shared with entity teleports. Internal fixtures that omitted the velocity fields (sent as NaN) were corrected. |
| Chat pattern loop crashed if a listener removed a later pattern | Fixed and tested, including deprecated patterns. |
| Physics feature lists stopped at 1.20 for `velocityBlocksOnTop` and `climbableTrapdoor` | Fixed in prismarine-physics `31b5117`: features are inclusive version ranges, checked against vanilla 26.3 (`getBlockSpeedFactor`, `trapdoorUsableAsLadder`). Only these two features changed for any version. |
| Passenger moving A→B with B's packet first never reported leaving A | Fixed: `dismount`/`entityDetach` for A precede the attach to B. |
| `bot.time.clocks` and `bot.isAlive` undocumented | Documented and typed. |
| Per-packet version comparison in the animation handler | Removed. `strictMovementTicks` remains a single inject-time 26.3 check because no data feature describes it and adding one would need a data fork change. |
| Action enum resolution repeated per packet | Cached per registry. |
| Entity relative teleports did not clamp pitch | Fixed with the shared resolver. |
| Book restore failure hid the original error | Fixed with `AggregateError`. |
| Internal logs could not be told apart; identical hashes across versions | Confirmed: the dot reporter never printed the version. New logs use the spec reporter and start with the version and exact revisions. Old logs were not relabelled. |
| Passing internal tests printed ECONNABORTED/ECONNREFUSED | Caused by tearing a test down while the bot was still connecting. Teardown now lets the connection attempt settle and disconnects the bot before the server; no error output is suppressed. |
| Negative trade-price coverage was lost | Restored as unit coverage of vanilla's cost formula, which also now uses float arithmetic like vanilla. |
| `npm-shrinkwrap.json` is not packed | Confirmed and kept: see Installation. The documentation no longer implies consumers receive it. |
| GitHub release asset is replaceable | Documented with its SHA-256 and npm integrity. |
| Found while validating: two vanilla-harness races | The world reset skipped its refill when a test changed the world only through whole-chunk resends (fishing's water fill), so the next test built on water; column loads now mark the world dirty. The Nether test waited for the arrival teleport only after `spawn`, although the server sends it first; it now waits for both after the dimension change. Both were reproduced with event traces before the fix. |

## Validation

The exact supported test points are in `lib/version.js`: 1.8.8, 1.9.4, 1.10.2, 1.11.2, 1.12.2, 1.13.2, 1.14.4, 1.15.2, 1.16.5, 1.17.1, 1.18.2, 1.19, 1.19.2, 1.19.3, 1.19.4, 1.20.1, 1.20.2, 1.20.4, 1.20.6, 1.21.1, 1.21.3, 1.21.4, 1.21.5, 1.21.6, 1.21.8, 1.21.9, 1.21.11, 26.1, 26.2 and 26.3.

Local validation uses Windows, Node.js 26.12.0 and Java 25, isolated offline vanilla servers, and the upstream external suite. Coverage includes login, chunks, movement, digging/placing, inventory/crafting/furnaces, trading, signs, dimension travel, entity behavior, chat and example bots. Existing exclusions (`digEverything`, `anvil`, `placeEntity`) remain excluded from the external harness; they are not implied to have passed. Authentication and production/proxy acceptance remain separate.

Final result details are recorded in [VALIDATION.md](VALIDATION.md). Commands for a checkout:

```sh
npm ci --ignore-scripts
npm run lint
npm run test:unit
npm run test:types
# Set MC_VERSION to an exact version or a comma/space-separated list.
MC_VERSION=26.3 npm run mocha_test -- test/internalTest.js test/externalTest.js
```

On PowerShell, use `$env:MC_VERSION='26.3'` before the test command. Put Java 25 on PATH for modern servers. CI separately checks Node.js 22 and 24; local results do not establish hosted CI success.

## Remaining limitations

- `npx tsc --noEmit` over the complete declaration graph fails in existing prismarine-chat, prismarine-nbt, prismarine-windows and protodef declarations (and a chunk interop setting). `test:types` compiles a real consumer of the changed APIs with `skipLibCheck`; it validates consumer usage but does not certify dependency declarations.
- The dependency audit reports known transitive advisories, including uuid under the authentication chain and older development tooling. Suggested automatic fixes include downgrades and unrelated API changes. They were not blindly applied; see VALIDATION.md for recorded counts. This is not a clean security audit.
- Minecraft resources and server caches are local test inputs, not redistributed in the package. No Microsoft account credentials or existing user server settings were changed.
- Anti-cheat/proxy-specific behavior, relighting, additional GUI plugins, major movement/digging rewrites and unverified feature requests remain explicitly deferred in the triage. A passing vanilla suite does not prove those environments.

## Attribution

Adapted upstream work is linked individually in [UPSTREAM-TRIAGE.md](UPSTREAM-TRIAGE.md); this fork does not claim those proposals as original work. Major adopted/adapted Mineflayer sources include #4191, #4184, #4182, #4181, #4177, #4157, #4156, #4155, #4154, #4153, #4152, #4151, #4149, #4146, #4144, #4140, #4138, #4133, #4130, #4112, #4103, #4087, #4062, #4053, #3971, #3946, #3937 and #3922, with overlapping alternatives identified in the inventory. Companion foundations include minecraft-data #1300/#1301, node-minecraft-protocol #1538/#1542, prismarine-chunk #334 and merged prismarine-physics #138. Additional fixes and tests described above were developed while validating these changes.
