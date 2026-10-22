# Java 1.8–26.3 compatibility and reliability audit

This fork starts from PrismarineJS/mineflayer commit `7b4bb8d2b56be9cdb832474af873acd37e609746`. The audit was performed on 2026-10-21/22 with Java Edition 26.3 as the current stable release. It includes source review, screening of 436 open issues and 118 open PRs, targeted regression fixes, companion dependency forks, and internal plus real vanilla-server testing. [UPSTREAM-TRIAGE.md](UPSTREAM-TRIAGE.md) preserves every screened issue/PR and distinguishes implementation from deferred or unverified reports.

The public Mineflayer API is retained. This is not a claim that every upstream issue is fixed, every patch release has been exercised, or third-party plugins/proxies and Microsoft authentication have been validated. No upstream PRs were merged or issues closed by this work.

## Installation and reproducibility

Use Node.js 22 or newer and Git. From an application:

```sh
npm install github:HYPExMon5ter/mineflayer#audit/java-26.3
```

Pin a commit rather than the moving branch for deployment. The committed `npm-shrinkwrap.json` records the dependency graph. Companion dependencies are pinned to immutable commits, and minecraft-data uses a built release archive because a Git install with scripts disabled does not include its generated data/submodule contents. Companion packages also pin the same data archive: root `overrides` alone do not propagate when Mineflayer is installed as a dependency. Packaging explicitly includes source, declarations, documentation and examples, excluding test worlds, downloaded server jars and local account data.

| Dependency | Tested source |
|---|---|
| minecraft-data source | [4d6d514](https://github.com/HYPExMon5ter/minecraft-data/commit/4d6d51441f1f0017bdaa5d3511b3375d19d7d588) |
| node-minecraft-data wrapper | [2cc19a6](https://github.com/HYPExMon5ter/node-minecraft-data/commit/2cc19a6c84a9a15daec9ce53152f5814fc1b53e1), [built data release](https://github.com/HYPExMon5ter/node-minecraft-data/releases/tag/java-26.3-data-2) |
| minecraft-protocol | [d0d97e7](https://github.com/HYPExMon5ter/node-minecraft-protocol/commit/d0d97e76686aa8abcc859c91055e256a603245a5) |
| prismarine-chunk | [8446109](https://github.com/HYPExMon5ter/prismarine-chunk/commit/84461090b8f6469b7eaa0a4aea35acca023a08d7) |
| prismarine-physics | [f2b27d6](https://github.com/HYPExMon5ter/prismarine-physics/commit/f2b27d6982c246493dba56368b961115018b6abe) |

## Significant findings and changes

### Wire compatibility

- Upstream had started writing string action names to legacy numeric `entity_action` and `client_command` fields. On 1.8 this made waking encode as sneaking; statistics requests could encode as respawn and stall creative-slot confirmation. `lib/protocolActions.js` selects numeric values or mapper names/aliases from the actual schema. Tests serialize the real packets for all 30 versions.
- Added 26.2/26.3 data, protocol, chunk and physics support through the companion chain. Corrected unsigned lpVec3 scaling and rejected malformed empty entity-delta paths. Entity velocities already expressed in blocks/tick are no longer divided by 8000.
- Corrected 26.3 sign packet field order and front/back slot encoding against the vanilla server classes. The sign suite exercises server-echoed text, not merely successful packet serialization.
- Adapted 26.3 digging/release action IDs, movement deltas, entity animation IDs, per-axis particle speeds, and widened teleport confirmations. Strict 26.3 movement scheduling emits at most one movement packet per client tick, including queued teleports and respawns.
- Fixed modern mock-server login success packets to include a session UUID. Custom protocol overrides no longer mutate shared minecraft-data or leak through the compiled-protocol cache; compiled and interpreted paths have isolation tests.

### State and lifecycle

- Plugin injection happens before packets can arrive. Entity-placement waits survive unrelated spawns. Bed, book and promise timeout paths clean up listeners/timers and restore state.
- Resource-pack responses use the correct ID/hash shape and acknowledgement sequence, answer once, and expose event data before invoking listeners. Configuration without listeners is acknowledged; this does not download or apply resource-pack assets.
- Inventory state IDs are tracked per window. Closing, respawning and re-login have explicit lifecycle handling. Unknown window types emit `unknownWindow` instead of dereferencing a missing window. Creative-slot updates compare nullable items and release locks on every exit.
- Item-use state survives unrelated entity status notifications and understands modern cooldown groups. Passenger/vehicle links are reconciled before attach/detach/mount events, including vehicle removal.
- Health distinguishes metadata bitmasks from legacy booleans; dimension transitions emit spawn without inventing a death. `player_loaded` waits for terrain or a bounded fallback and is cancelled when the session changes. World chunk ownership includes world name, not just dimension type.
- Modern score/reset packets, chat-component objective titles, cleared display slots, empty titles and overlapping chat patterns are handled. Existing string scoreboard titles remain compatible. Time resolves world clocks through the registry and preserves overworld day time across dimensions.

### Correctness and test efficiency

- Cursor raycasts accept zero yaw/pitch and start at eye height. Look promises wait for both axes. Dig duration is calculated after aiming. Anvil limits use version features. Explosion exposure uses entity dimensions and handles zero-size/zero-distance samples. Empty chunk batches cannot poison the pacing average.
- Exact `MC_VERSION` selection happens before loading registries. Unit tests run independently from server suites. CI caches dependencies and server jars, retains bounded version groups, and has a stable aggregate gate; failed processes are detected by exit status, including failures before Mocha prints a summary.
- Trace-worker errors cannot make shutdown wait forever. Trace tests clean their temporary files. The cooldown test removes its thrown pearl before the next test: leaving it airborne could teleport the bot out of the Nether later. Nether tests acknowledge arrival before a second teleport and bound terrain waits with diagnostics. Empty-server pausing is disabled in the harness so modern status/login probes remain responsive. The villager fixture uses a stable demand-driven price rather than a reputation discount the server can reset.
- These are concrete reductions in redundant setup, blocked work and failure diagnosis. No general runtime throughput/CPU improvement percentage is claimed; this audit did not run a controlled application benchmark.

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
