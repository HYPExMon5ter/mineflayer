# Validation record

Executed locally on 2026-10-23 with Windows, Node.js 26.12.1 and Java 25 (OpenJDK 25.0.3). See [AUDIT.md](AUDIT.md) for scope, exclusions, dependency revisions and limitations. The [machine-readable record](validation-results.json) lists every attempt of this round, failed ones included, with its exit status and the SHA-256 of its log; the logs themselves are local and not published.

This record replaces the one for `a26a40f9` (the second follow-up), which is superseded, not rewritten; its text and record remain in the history of this file. It covers Mineflayer `912e8ca2` with the dependency revisions in AUDIT.md, installed from the pinned published commits and the `java-26.3-data-9` release. Every Mineflayer log of this round ran that one commit from a separate clean worktree; companion logs each name their clean commit.

## Evidence format

Every attempt runs into a new run directory and is never overwritten, so a rerun sits next to the attempt it repeats. Each Mineflayer log starts with a header naming `MC_VERSION`, the kind of run, the proxy latency, the commit, Node.js, Java and every installed companion archive or commit with its integrity, and ends with the process exit status; companion logs name their repository commit, the installed minecraft-data archive and the exit status. The generator (`write-validation.js`) refuses a run directory the manifest does not list, a log whose hash, exit status or counts differ from its record, any header whose dependencies differ from the evidence commit's `npm-shrinkwrap.json`, and duplicate logs; it accepts only an attempt that exited 0 with no failing test and no undecodable packet, needs one for every version and kind, and records every other attempt as history. Its own checks are tested on altered copies of the evidence (`test-write-validation.js`).

## Hosted CI

Hosted CI [39754758116](https://github.com/HYPExMon5ter/mineflayer/actions/runs/39754758116) passed at `ffc2bb45`: all 30 version jobs, lint, and Node.js 22/24 unit and type checks, with the required gate green. The commits of the second and third follow-ups have not been run on hosted CI.

## Results

- Internal protocol-server matrix: **2273 passing, 292 pending, zero failures across 30 versions**. Pending tests are version/feature skips.
- Internal + vanilla server suites: **4316 passing, 292 pending, zero failures across 30 versions** in the accepted attempts (every attempt is listed below), including `toolSpeeds` (2 to 7 tests per version) and failing a version on any undecodable packet.
- `digEverything` (opt-in, run separately with at most four servers at once): **24124 blocks dug, zero failures across 30 versions** in the accepted attempts. Each dig is checked against the server: after the server has handled the dig (from 1.19 its acknowledgement, before that a command round trip) the block it left must be gone, and from 1.19 `/execute unless block` must confirm it. Skipped by name: blocks that break at once without support the flat world lacks, bubble columns, and on 1.19.3, 1.19.4, 1.20.4, 1.20.6 and 1.21.3 the blocks those releases only have behind an experimental feature flag.
- Under lag: the vanilla suites (`digEverything` excluded) through a proxy that delays each direction by 150 ms, on 1.8.8, 1.12.2, 1.16.5, 1.18.2, 1.20.4, 1.21.11, 26.3:

| Java version | Passing | Pending |
|---|---:|---:|
| 1.8.8 | 66 | 0 |
| 1.12.2 | 66 | 0 |
| 1.16.5 | 66 | 0 |
| 1.18.2 | 68 | 0 |
| 1.20.4 | 69 | 0 |
| 1.21.11 | 70 | 0 |
| 26.3 | 71 | 0 |

- Standalone unit/regression suite: **88 passing**. Lint and the TypeScript consumer check (`test:types`) pass.
- Clean application install of the packed tarball (no shrinkwrap) without `overrides`: one minecraft-data (`data-9`, documented integrity) and one forked prismarine-item serve every package; the corrected 26.3 packet table and particles, 1.20.5+ enchantments and item names, dig times and tool speeds, attribute IDs, the protocol reader fix and non-decreasing chat timestamps are present.

### Companion packages

| Package | Commit | Result |
|---|---|---|
| minecraft-protocol lint | `41e6cd2` | passes |
| minecraft-protocol focused suites | `41e6cd2` | 1153 passing, 15 pending |
| minecraft-protocol packet round trip (32 versions) | `41e6cd2` | 5680 passing |
| minecraft-protocol server suite (32 versions) | `41e6cd2` | 384 passing |
| minecraft-protocol client suite against real vanilla servers (32 versions) | `41e6cd2` | 128 passing, 64 pending |
| prismarine-chunk | `a9b77d8` | 333 passing |
| prismarine-physics | `fafa797` | 57 passing |
| prismarine-item | `fbef493` | 173 passing |
| minecraft-data schema and audit suite | `dbda901` | 1906 passing, 1 pending |
| node-minecraft-data wrapper | `fb9d5a7` | 902 passing |

The protocol `clientTest` (real vanilla servers, all 32 protocol versions) skips its upstream online-mode block, which needs Mojang credentials; it fails a version on any packet it cannot decode. minecraft-data's suite keeps its wall-clock guard (under 40 s from process start) and now passes it.

### Data checked against vanilla

The packet tables of 26.1–26.3 were compared entry by entry with the servers' registration order (bytecode), and item, block, block-state, entity, sound, particle, effect, attribute, command-argument and recipe-serializer IDs with the servers' own registry reports (`--reports`) for 1.20.6–26.3 (data-5). Block hardness, tools and names that made a vanilla server refuse or delay a `digEverything` dig were checked against each server's block registration bytecode (1.8–1.16, 1.18) or its `mineable` tags (1.17–26.3) (data-6 to data-8). For data-9, every tool's dig speed multiplier on every block was compared with what each server derives from its block tags (mineable tags, leaves, wool, sword and shears tags; tool material, shears and sword speeds checked in the 26.3 bytecode) for 1.17.1–26.3 (22 versions): no block differs (blocks behind an experimental flag excluded). Against data-8 the same comparison found 1 to 964 differing blocks per version; both runs are kept.

## Proxy and authentication

Live local runs with Velocity 4.3.0 (build 44, SHA-256 `85be73b90f295acd8d5d45a00ad10bac791d4b72b7554172612a89565ebaaa8f`), real Paper and vanilla server processes in fresh directories on loopback ports, and Mineflayer `912e8ca2`. Clients log in through the proxy, settle, chat, walk, switch to a second backend with `/server` and back where two backends of their version exist; each backend's own log must show the login. Velocity does not translate versions, so each client version uses a backend of its own.

| Scenario | Proxy | Backends | Clients | Refusals checked |
|---|---|---|---|---|
| legacy-offline | Velocity, legacy forwarding, offline mode | Paper 1.8.8, Paper 1.8.8, Paper 1.12.2 | 1.8.8 (switch and back): pass; 1.12.2: pass | – |
| modern-offline | Velocity, modern forwarding, offline mode | Paper 26.3, Paper 26.3, Paper 1.21.11, Paper 1.20.4 | 26.3 (switch and back): pass; 1.21.11: pass; 1.20.4: pass | – |
| legacy-online | Velocity, legacy forwarding, online mode | Paper 1.8.8, Paper 1.8.8 | 1.8.8 (switch and back): pass | no session (offline client): refused as expected; rejected access token: refused as expected |
| modern-online | Velocity, modern forwarding, online mode | Paper 26.3, Paper 26.3 | 26.3 (switch and back): pass | no session (offline client): refused as expected; rejected access token: refused as expected |
| vanilla-online-direct | none (direct, online mode) | vanilla 1.20.4 | 1.20.4: pass | no session (offline client): refused as expected; rejected access token: refused as expected |

Online-mode scenarios authenticate against a local stub of the Mojang session service (3 client joins, 3 server-side verifications, 6 refusals): the encryption handshake, the client's join and the proxy's or server's `hasJoined` check are real, the account authority is not. Each online scenario also confirms two refusals with their expected cause: an offline client without a session, and a client whose access token the session service rejects.

Separately, the account owner signed in once with a real Microsoft account (`audit-artifacts/live-auth/run.js`) at Mineflayer `4ff8872c` (the second follow-up's dependencies, data-8) against a fresh vanilla 26.3 server with `online-mode=true` and `enforce-secure-profile=true`: the sign-in succeeded, the server's authenticator verified the account's UUID, the bot spawned, and its signed chat message was echoed without the server's "Not Secure" mark (`result-26.3.json`, SHA-256 `fa90e94128ae84c2ea243509e574535c78675736aafaef051eb3c56de12a656c`; server log `fa6a2ffc43e4733137fb49bef8632963d83e8c61e2c91fcf3114b17745d07074`). It has not been repeated at `912e8ca2`, whose chat timestamp change applies to signed chat.

## Attempts of this round

- `suite-d22e00df` (server suites, `d22e00df`): all 30 versions passed. Superseded: the nether test changed in `912e8ca2` after the first lag run.
- `internal-d22e00df` (internal suite, `d22e00df`): all 30 versions passed. Superseded by the run at `912e8ca2`.
- `lag150-d22e00df` (server suites through the latency proxy, 150 ms each way, `d22e00df`): 6 of 7 versions passed; failed: 26.3 (nether: Error: Server did not answer the placement at (-2, 33, -9): Event blockUpdate:(-2, 33, -9) did not fire within timeout of 5000ms). The 26.3 failure was a race in the nether test under latency, fixed in `912e8ca2` (see AUDIT.md).
- `suite-912e8ca2` (server suites, `912e8ca2`): all 30 versions passed.
- `internal-912e8ca2` (internal suite, `912e8ca2`): all 30 versions passed.
- `lag150-912e8ca2` (server suites through the latency proxy, 150 ms each way, `912e8ca2`): all 7 versions passed.
- `dig-912e8ca2-a` (`digEverything`, `912e8ca2`): all 15 versions passed.
- `dig-912e8ca2-b` (`digEverything`, `912e8ca2`): all 15 versions passed.

## Failures investigated

Failures of earlier rounds and their fixes are described in AUDIT.md and in the superseded records of this file.

- The first lag run (`lag150-d22e00df`) failed `nether` on 26.3: the server sent the arrival position a second time after the client reported it had loaded, the test took that late packet for the reply to its `/tp 0 128 0`, and placed its sign against a block that the real teleport then left 96 blocks away, which the server ignored ("Server did not answer the placement"). The bot's packet trace shows the sequence. `912e8ca2` makes the test wait for the teleport to its target; because that changed a test, the server-suite and internal matrices were rerun at that commit too, and the `d22e00df` runs, otherwise clean, are kept as history.
- Development runs before the evidence runs (in `audit-artifacts/followup3/dev`, not counted): a first run of the 26.3 suites through the latency proxy failed only `creative`, whose bound on three confirmed slot sets assumed a local round trip (now allowed one round trip each); `toolSpeeds` with the old data-8 failed 5 of 7 cases on 26.3 and 2 of 5 on 1.21.4, as intended; and `exampleDigger` passed on 1.21.3 with the server slowed to 8 and to 3 ticks per second, so the failure of the second follow-up was not reproduced.

This covers the listed test points, not every patch release.

## Matrix

| Java version | Internal passing | Internal pending | Internal + vanilla passing | Internal + vanilla pending | digEverything passing |
|---|---:|---:|---:|---:|---:|
| 1.8.8 | 65 | 20 | 131 | 20 | 150 |
| 1.9.4 | 67 | 18 | 133 | 18 | 160 |
| 1.10.2 | 67 | 18 | 133 | 18 | 160 |
| 1.11.2 | 67 | 18 | 133 | 18 | 182 |
| 1.12.2 | 67 | 18 | 133 | 18 | 200 |
| 1.13.2 | 67 | 18 | 133 | 18 | 547 |
| 1.14.4 | 67 | 18 | 133 | 18 | 624 |
| 1.15.2 | 67 | 18 | 133 | 18 | 628 |
| 1.16.5 | 67 | 18 | 133 | 18 | 707 |
| 1.17.1 | 71 | 14 | 139 | 14 | 838 |
| 1.18.2 | 71 | 14 | 139 | 14 | 838 |
| 1.19 | 74 | 11 | 142 | 11 | 873 |
| 1.19.2 | 74 | 11 | 142 | 11 | 873 |
| 1.19.3 | 74 | 11 | 142 | 11 | 873 |
| 1.19.4 | 75 | 10 | 143 | 10 | 873 |
| 1.20.1 | 75 | 10 | 144 | 10 | 943 |
| 1.20.2 | 78 | 7 | 147 | 7 | 943 |
| 1.20.4 | 79 | 6 | 148 | 6 | 943 |
| 1.20.6 | 78 | 7 | 147 | 7 | 943 |
| 1.21.1 | 79 | 6 | 148 | 6 | 1000 |
| 1.21.3 | 81 | 4 | 150 | 4 | 1000 |
| 1.21.4 | 83 | 2 | 152 | 2 | 1034 |
| 1.21.5 | 83 | 2 | 152 | 2 | 1041 |
| 1.21.6 | 83 | 2 | 152 | 2 | 1042 |
| 1.21.8 | 83 | 2 | 152 | 2 | 1042 |
| 1.21.9 | 83 | 2 | 153 | 2 | 1103 |
| 1.21.11 | 83 | 2 | 153 | 2 | 1103 |
| 26.1 | 88 | 2 | 158 | 2 | 1105 |
| 26.2 | 88 | 2 | 158 | 2 | 1133 |
| 26.3 | 89 | 1 | 160 | 1 | 1223 |
