# Changelog

## 0.2.0

### Breaking

- `jandragsbaek/no-low-value-comments` is now `jandragsbaek/no-explanatory-comments`, and it
  rejects every comment except a license header at the top of the file and tool directives
  (see README, Comments). Rename the rule in any config that names it.
- `jandragsbaek/require-suppression-reason` takes the reason only from the directive itself
  (`-- <reason>`, or the text after `@ts-expect-error`). A comment on the line above no longer
  counts.

### Added

- `jandragsbaek/max-file-lines`: a file over 500 lines (option `max`) is an error. A reasoned
  `oxlint-disable` keeps a file that must stay long.
- `jandragsbaek/max-file-lines-hard`: a file over 750 lines (option `max`) is an error that no
  disable directive silences.
- All three rules are in `recommended`.

## 0.1.0

- First release: the rules and presets from Glose.
