# AGENTS.md

Oxlint rules and presets shared by Jan's projects. A rule learned in a project goes here, so
every project gets it. README.md says how to add one.

- Each rule has a test file next to it that runs real Oxlint on fixtures (`test/utils.ts`).
- Presets in `src/presets.ts` hold the rule choices. A rule that fits only some projects goes in
  a preset those projects opt into, or takes options; it never names one project.
- `pnpm check` runs what CI runs.
- Release: bump `version` in `package.json`, merge, then push tag `v<version>`; `release.yml` publishes
  to npm through trusted publishing (no token). Projects get a rule once they bump to that version.
