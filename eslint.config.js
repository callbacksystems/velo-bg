import base from "@callbacksystems/eslint-config/base"
import browser from "@callbacksystems/eslint-config/browser"

// Browsers resolve relative imports literally, so a no-build package keeps the `.js` extension.
export default [
  ...base,
  ...browser,
  { ignores: [ "dist/" ] },
  { rules: { "import-x/extensions": [ "error", "always", { ignorePackages: true } ] } }
]
