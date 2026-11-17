import { definePlugin } from "@oxlint/plugins";

import maxFileLines from "./rules/max-file-lines.ts";
import maxFileLinesHard from "./rules/max-file-lines-hard.ts";
import namespaceNodeImports from "./rules/namespace-node-imports.ts";
import noDomTestEnvironment from "./rules/no-dom-test-environment.ts";
import noEmDashCopy from "./rules/no-em-dash-copy.ts";
import noExplanatoryComments from "./rules/no-explanatory-comments.ts";
import noHooklessUseFunction from "./rules/no-hookless-use-function.ts";
import noInlineSchemaCompile from "./rules/no-inline-schema-compile.ts";
import noManualEffectRuntimeInTests from "./rules/no-manual-effect-runtime-in-tests.ts";
import noManualMemo from "./rules/no-manual-memo.ts";
import noRawColor from "./rules/no-raw-color.ts";
import noPollingLoopInTests from "./rules/no-polling-loop-in-tests.ts";
import noRealTimeWaitInTests from "./rules/no-real-time-wait-in-tests.ts";
import noTestInLoop from "./rules/no-test-in-loop.ts";
import noTestTimeoutOrUnreasonedSkip from "./rules/no-test-timeout-or-unreasoned-skip.ts";
import noUnreasonedStateSync from "./rules/no-unreasoned-state-sync.ts";
import noUnscopedHas from "./rules/no-unscoped-has.ts";
import noUntranslatedUiText from "./rules/no-untranslated-ui-text.ts";
import noWallClockInTests from "./rules/no-wall-clock-in-tests.ts";
import preferCatchTags from "./rules/prefer-catch-tags.ts";
import preferEffectFn from "./rules/prefer-effect-fn.ts";
import requireSuppressionReason from "./rules/require-suppression-reason.ts";

export default definePlugin({
  meta: {
    name: "jandragsbaek",
  },
  rules: {
    "max-file-lines": maxFileLines,
    "max-file-lines-hard": maxFileLinesHard,
    "namespace-node-imports": namespaceNodeImports,
    "no-dom-test-environment": noDomTestEnvironment,
    "no-em-dash-copy": noEmDashCopy,
    "no-explanatory-comments": noExplanatoryComments,
    "no-hookless-use-function": noHooklessUseFunction,
    "no-inline-schema-compile": noInlineSchemaCompile,
    "no-manual-effect-runtime-in-tests": noManualEffectRuntimeInTests,
    "no-manual-memo": noManualMemo,
    "no-polling-loop-in-tests": noPollingLoopInTests,
    "no-raw-color": noRawColor,
    "no-real-time-wait-in-tests": noRealTimeWaitInTests,
    "no-test-in-loop": noTestInLoop,
    "no-test-timeout-or-unreasoned-skip": noTestTimeoutOrUnreasonedSkip,
    "no-unreasoned-state-sync": noUnreasonedStateSync,
    "no-unscoped-has": noUnscopedHas,
    "no-untranslated-ui-text": noUntranslatedUiText,
    "no-wall-clock-in-tests": noWallClockInTests,
    "prefer-catch-tags": preferCatchTags,
    "prefer-effect-fn": preferEffectFn,
    "require-suppression-reason": requireSuppressionReason,
  },
});
