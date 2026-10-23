# Validation record

Executed locally on 2026-10-22 and 2026-10-23 with Windows, Node.js 26.12.1 and Java 25 (OpenJDK 25.0.3). See [AUDIT.md](AUDIT.md) for scope, exclusions, dependency revisions and limitations. The [machine-readable record](validation-results.json) lists every log with its SHA-256; the logs themselves are local and not published.

This record replaces the one for `0ebe4c7a`. It covers Mineflayer `a26a40f9` with the dependency revisions in AUDIT.md, installed from the pinned published commits and the `java-26.3-data-8` release. All Mineflayer server-suite logs were produced at that one commit from a separate clean worktree, and the `digEverything` logs at that commit; companion logs each name their clean commit.

## Evidence format

Every log uses the spec reporter and starts with a header naming its revision, Node.js and Java versions and the installed minecraft-data archive and integrity (Mineflayer logs also name `MC_VERSION` and every companion revision). The generator rejects a log whose header or suite title does not match, a failing or unclean log, a log reporting undecoded packets, and duplicate log contents. Old logs were not relabelled; runs that were discarded are listed below.

## Hosted CI

Hosted CI [39754758116](https://github.com/HYPExMon5ter/mineflayer/actions/runs/39754758116) passed at `ffc2bb45`: all 30 version jobs, lint, and Node.js 22/24 unit and type checks, with the required gate green. The earlier run [39740140539](https://github.com/HYPExMon5ter/mineflayer/actions/runs/39740140539) at `216b3abd` failed only the 26.3 delayed-respawn transfer test, whose observation window started before the client received `start_configuration`; `ffc2bb45` fixed that. The commits of the second follow-up have not been run on hosted CI.

## Results

- Internal protocol-server matrix: **2273 passing, 292 pending, zero failures across 30 versions**. Pending tests are version/feature skips.
- Internal + vanilla server suites: **4193 passing, 292 pending, zero failures across 30 versions** (two versions that failed one upstream test each were rerun alone; see below), now including `anvil` (4 tests) and `placeEntity` (4 tests), and failing a version on any undecodable packet.
- `digEverything` (opt-in, run separately on every version): **24124 blocks dug, zero failures across 30 versions** (1.17.1 was rerun alone; see below). Each dig is checked against the server: after the server has handled the dig (from 1.19 its acknowledgement, before that a command round trip) the block it left must be gone, and from 1.19 `/execute unless block` must confirm it. Skipped by name: blocks that break at once without support the flat world lacks, bubble columns, and on 1.19.3, 1.19.4, 1.20.4, 1.20.6 and 1.21.3 the blocks those releases only have behind an experimental feature flag.
- Standalone unit/regression suite: **85 passing**. Lint and the TypeScript consumer check (`test:types`) pass.
- Clean application install of the packed tarball (184 files, no shrinkwrap) without `overrides`: one minecraft-data (`data-8`, documented integrity) and one forked prismarine-item serve every package; the corrected 26.3 packet table and particles, 1.20.5+ enchantments, dig times, attribute IDs and the protocol reader fix are present.
- npm audit snapshot at the evidence commit: development graph 18 findings (9 high, 8 moderate, 1 low; the earlier snapshot had 29), clean consumer 6 moderate. Nothing was changed to address them; they are not represented as fixed.

### Companion packages

| Package | Commit | Result |
|---|---|---|
| minecraft-protocol lint | `842c681` | passes |
| minecraft-protocol focused suites | `842c681` | 1143 passing, 15 pending |
| minecraft-protocol packet round trip (32 versions) | `842c681` | 5680 passing |
| minecraft-protocol server suite (32 versions) | `842c681` | 384 passing |
| minecraft-protocol client suite against real vanilla servers (32 versions) | `842c681` | 128 passing, 64 pending |
| prismarine-chunk | `25895d1` | 333 passing |
| prismarine-physics | `dd981f5` | 57 passing |
| prismarine-item | `7a7b72d` | 152 passing |
| minecraft-data schema and audit suite | `2f86c42` | 1906 passing, 1 pending, 1 failing (every test passed; the suite's wall-clock guard reported 50 s against 40 s) |
| node-minecraft-data wrapper | `51ee6d1` | 902 passing |

The protocol `clientTest` (real vanilla servers, all 32 protocol versions) skips its upstream online-mode block, which needs Mojang credentials; it now also fails a version on any packet it cannot decode. minecraft-data's suite includes a wall-clock guard (under 40 s from process start) against a return of its old three-minute runtime; this machine misses it with or without the changes, so its log records every test passing and that one failure.

### Data checked against vanilla

The packet tables of 26.1–26.3 were compared entry by entry with the servers' registration order (bytecode), and item, block, block-state, entity, sound, particle, effect, attribute, command-argument and recipe-serializer IDs with the servers' own registry reports (`--reports`) for 1.20.6–26.3. Mismatches found are fixed in data-5 and listed in AUDIT.md. Block hardness, tools and names that made a vanilla server refuse or delay a `digEverything` dig were checked against each server's block registration bytecode (1.8–1.16, 1.18) or its `mineable` tags (1.17–26.3) and are fixed in data-6 and data-7; a vibration particle a 1.20.4 server sent during a dig could not be decoded and is fixed in data-8; 1.18 was also compared with 1.17 and 1.19, where its hardness of 79 blocks with copied properties was 0. Packets that real servers sent but the data could not decode fully (1.20.3/1.20.4/1.21.3/26.3 explosion, 26.3 teams, 1.20.5/1.21.1 declare_recipes, 1.21.3 set_player_inventory) were captured and decode to their full length with the fixed schemas.

## Proxy and authentication

Live local runs with Velocity 4.3.0 (build 44, SHA-256 `85be73b90f295acd8d5d45a00ad10bac791d4b72b7554172612a89565ebaaa8f`), real Paper and vanilla server processes in fresh directories on loopback ports, and Mineflayer `a26a40f9`. Clients log in through the proxy, settle, chat, walk, switch to a second backend with `/server` and back where two backends of their version exist; each backend's own log must show the login. Velocity does not translate versions, so each client version uses a backend of its own.

| Scenario | Proxy | Backends | Clients | Refusals checked |
|---|---|---|---|---|
| legacy-offline | Velocity, legacy forwarding, offline mode | Paper 1.8.8, Paper 1.8.8, Paper 1.12.2 | 1.8.8 (switch and back): pass; 1.12.2: pass | – |
| modern-offline | Velocity, modern forwarding, offline mode | Paper 26.3, Paper 26.3, Paper 1.21.11, Paper 1.20.4 | 26.3 (switch and back): pass; 1.21.11: pass; 1.20.4: pass | – |
| legacy-online | Velocity, legacy forwarding, online mode | Paper 1.8.8, Paper 1.8.8 | 1.8.8 (switch and back): pass | no session (offline client): refused as expected; rejected access token: refused as expected |
| modern-online | Velocity, modern forwarding, online mode | Paper 26.3, Paper 26.3 | 26.3 (switch and back): pass | no session (offline client): refused as expected; rejected access token: refused as expected |
| vanilla-online-direct | none (direct, online mode) | vanilla 1.20.4 | 1.20.4: pass | no session (offline client): refused as expected; rejected access token: refused as expected |

Online-mode scenarios authenticate against a local stub of the Mojang session service (3 client joins, 3 server-side verifications, 6 refusals): the encryption handshake, the client's join and the proxy's or server's `hasJoined` check are real, the account authority is not. Each online scenario also confirms two refusals with their expected cause: an offline client without a session, and a client whose access token the session service rejects. **Real Microsoft/Mojang sign-in was not performed**; it needs the account owner, and `audit-artifacts/live-auth/run.js` is prepared for it.

## Failures investigated

- The first evidence matrix at `80ba9731` failed `useChests` on 1.18.2 and 1.21.6 and `enchanting` on 1.21.3 (`Server rejected`) while other test processes loaded the machine. The reset's `/clear` is confirmed while the command is handled, but its emptied slots are broadcast later in that tick, so the next test could set a slot and then receive the stale clear. `f611b8c9` waited for an empty client inventory, which then failed every reset after `furnace` on 1.21.9+: after items moved into the player inventory through a container window, a later `/clear` removes them on the server without sending those slots, so the client keeps them. `9b89b7ed` instead sent a second `/clear` after the first was confirmed, expecting a later tick to handle it (not true on 26.x, see below). The run at `9b89b7ed` then failed only `anvil using anvil.rename` on 1.16.5: the output was clicked before the result for the final name arrived and the server refused the click; `f4048dd7` waits for that result. The run at `f4048dd7` failed only `useChests` on 1.21.5 with `2x rotten_flesh` left in the hotbar: the zombie that `placeEntity` kills dropped it and the bot picked it up later; `003726a8` disables mob drops in the test world. All four runs are kept as superseded, not counted. The client keeping cleared items after a container transfer is recorded as a limitation.
- A discovery matrix before the evidence runs found the packet decode failures and test defects listed in AUDIT.md (particle listener, item and block waits, anvil enchantment order). `placeEntity place armor stand` failed once on 1.10.2 under a six-way parallel load and passed three isolated reruns; it did not recur in the evidence run.
- Full `digEverything` runs at `f4048dd7` failed on 1.8.8 once (a silverfish released by the infested block killed the bot during a later dig) and on 26.3 repeatedly (blocks created by `/setblock` never reached the client). On 26.3 a command sent right after a finished dig still found the block on the server: 26.3 queues digging packets for its next tick but runs commands at once, so the late break removed the next test's block within the same tick. `b059e52b` removes the silverfish and `503a49d9` waits for the server's block update. Both `f4048dd7` runs are kept as superseded.
- Discovery runs of `digEverything` on every version (`6d2aa438` and the old data) then found the 1.8–1.12, 1.13–1.16 and 1.18 block data fixed in data-6, that 1.14–1.18 refused breaks stayed predicted as air (`b4f7aa9f`), and test defects: an acknowledgement wait that missed one already received (`72655213`), a drop picked up after the world reset that made the next test's slot change look rejected, and blocks that cannot stay or exist in the test world (`4c0cfcd7`). A run of every version at `4c0cfcd7` then failed only the 1.16 crimson and warped pressure plates (data, fixed in data-7), the conduit on 1.16.5 and 1.17.1, whose water pushed the bot (`42761353` creates it dry), and a bubble column, which timed out once on 1.21.9 and is now skipped with water and lava (`4c14f398`). A run of the remaining versions at `42761353` found the 1.21 tuff and copper blocks that 1.20.3–1.20.6 only have behind an experimental flag (`fbaa8b63` skips them) and 1.20.1 jungle leaves that decayed in the tick they were set (`9e4766f0` creates leaves persistent). A run of every version at `63c3191d` (data-7) failed only 1.20.4, on that undecodable vibration particle; it is kept as superseded. From 1.19 a too-early finish is delayed rather than refused, so `9c740428` asks the server; a negative control with a forced zero dig time on 26.3 failed with "the server still has oak_planks after the dig". These runs are not counted.
- In an earlier `digEverything` run (`3914aced`) the 1.20.1 server once disconnected the bot during a world reset for out-of-order chat (`flatbot sent out-of-order chat: 'fill ...'`): one command of six sent in the same synchronous loop carried an earlier timestamp than the one before it. No system time change was logged, and `Date.now()` did not go backwards in 1.6 billion reads over 150 s on this machine, so the cause was not established; minecraft-protocol takes each signed chat timestamp from `Date.now()` when the message is sent. The version was rerun at the same commit and passed; the kicked log is kept as superseded.
- The server-suite matrix at `3914aced` failed only `placeEntity place boat` on 1.12.2: the test emptied its water pool one block at a time, and water next to an emptied block, turned into flowing water, can refill it five ticks later, in the tick it was emptied, so the client never saw air. It passed six isolated reruns; `8871e8e9` empties the pool with one `/fill`. The matrix rerun at `8871e8e9` then failed only `enchanting` on 26.1 with `Server rejected`: the reset's second `/clear` was meant to be handled after the first one's slot broadcast, but 26.x runs commands as they arrive, so both ran before that tick. `a26a40f9` waits until the game time advances instead, and every Mineflayer log, `digEverything` included, was rerun at that commit. The `3914aced` and `8871e8e9` logs are kept as superseded.
- The companion run at `3914aced` failed the protocol `serverTest` case "supports bundle packet" on 26.3 once: it required both bundled packets within 1 ms and they arrived 2 ms apart. `842c681` asserts that no queued tick ran between them instead (a negative control that delays the second packet by one turn fails); all protocol logs are from that commit, which only changes the test. minecraft-data's suite passes every test but misses its 40 s wall-clock guard on this machine (43–50 s); it misses it the same way at `8a56597`, before the data changes of this follow-up, and the record lists that failure.
- The server-suite matrix at the evidence commit failed two tests once each, in upstream tests unrelated to the changes: `furnace` on 1.13.2 (its 500 ms wait for the smelted output expired) and `exampleDigger` on 1.21.3 (the example bot did not answer `build` within 5 s). Both versions passed when rerun alone at the same commit; the failed logs and the original results file are kept as superseded. Across the evidence runs of this follow-up, a run of all 30 versions has usually shown one such single failure in a different test.
- In the `digEverything` run at the evidence commit, 1.17.1 failed once on `dirt_path`: the server's digging acknowledgement still reported the block after the bot's 975 ms dig, so the server had counted fewer than the 14 ticks it needs to accept that finish, with seven servers digging in parallel. The check stays strict on purpose, since a break a few ticks early is how the data errors showed up; the version was rerun alone at the same commit and the failed log is kept as superseded.
- The protocol `serverTest` keepalive kick intermittently ended with `LoginTimeout`: the test's 100 ms `kickTimeout` is also the login deadline. It now uses 1 s.
- Earlier failures recorded for `216b3abd` and `0ebe4c7a` remain fixed as described in AUDIT.md.

This covers the listed test points, not every patch release.

## Matrix

| Java version | Internal passing | Internal pending | Internal + vanilla passing | Internal + vanilla pending | digEverything passing |
|---|---:|---:|---:|---:|---:|
| 1.8.8 | 65 | 20 | 129 | 20 | 150 |
| 1.9.4 | 67 | 18 | 131 | 18 | 160 |
| 1.10.2 | 67 | 18 | 131 | 18 | 160 |
| 1.11.2 | 67 | 18 | 131 | 18 | 182 |
| 1.12.2 | 67 | 18 | 131 | 18 | 200 |
| 1.13.2 | 67 | 18 | 131 | 18 | 547 |
| 1.14.4 | 67 | 18 | 131 | 18 | 624 |
| 1.15.2 | 67 | 18 | 131 | 18 | 628 |
| 1.16.5 | 67 | 18 | 131 | 18 | 707 |
| 1.17.1 | 71 | 14 | 135 | 14 | 838 |
| 1.18.2 | 71 | 14 | 135 | 14 | 838 |
| 1.19 | 74 | 11 | 138 | 11 | 873 |
| 1.19.2 | 74 | 11 | 138 | 11 | 873 |
| 1.19.3 | 74 | 11 | 138 | 11 | 873 |
| 1.19.4 | 75 | 10 | 139 | 10 | 873 |
| 1.20.1 | 75 | 10 | 139 | 10 | 943 |
| 1.20.2 | 78 | 7 | 142 | 7 | 943 |
| 1.20.4 | 79 | 6 | 143 | 6 | 943 |
| 1.20.6 | 78 | 7 | 142 | 7 | 943 |
| 1.21.1 | 79 | 6 | 143 | 6 | 1000 |
| 1.21.3 | 81 | 4 | 145 | 4 | 1000 |
| 1.21.4 | 83 | 2 | 147 | 2 | 1034 |
| 1.21.5 | 83 | 2 | 147 | 2 | 1041 |
| 1.21.6 | 83 | 2 | 147 | 2 | 1042 |
| 1.21.8 | 83 | 2 | 147 | 2 | 1042 |
| 1.21.9 | 83 | 2 | 147 | 2 | 1103 |
| 1.21.11 | 83 | 2 | 147 | 2 | 1103 |
| 26.1 | 88 | 2 | 152 | 2 | 1105 |
| 26.2 | 88 | 2 | 152 | 2 | 1133 |
| 26.3 | 89 | 1 | 153 | 1 | 1223 |
