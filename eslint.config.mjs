import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { globalIgnores } from "eslint/config";

const eslintConfig = [
  globalIgnores([
    "cloudflare/quiz-worker/.wrangler/**",
    "cloudflare/quiz-worker/node_modules/**",
    "exports/**",
    "static-export-app/out/**",
    "static-export-app/.next/**",
  ]),
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;
