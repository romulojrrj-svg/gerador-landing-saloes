import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { globalIgnores } from "eslint/config";

const eslintConfig = [
  globalIgnores([
    "exports/**",
    "static-export-app/out/**",
    "static-export-app/.next/**",
  ]),
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;
