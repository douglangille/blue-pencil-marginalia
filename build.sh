#!/bin/sh
# Generates main.js: compromise (vendored UMD) wrapped as nlpMod, then rules.js, then plugin.js.
cd "$(dirname "$0")" || exit 1
{
  echo 'const nlpMod = { exports: {} };'
  echo '(function (module, exports) {'
  cat vendor/compromise.js
  echo ''
  echo '}).call(nlpMod.exports, nlpMod, nlpMod.exports);'
  cat rules.js
  cat plugin.js
} > main.js
