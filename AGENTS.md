# Repository Guidelines

## Project Structure & Module Organization
- Root contracts and scripts: `contracts/`, `scripts/`, Hardhat config in `hardhat.config.js`.
- Contract tests: `test/` (Mocha/Chai via Hardhat).
- Web app: `frontend/` (Vite + React, `src/`, `public/`).
- Services and bots: `t3rn-guardian/` and `t3rn-bridge-ui/` (each with its own build/test scripts).
- Docs and assets: `docs/`, `artifacts/`, `cache/` (generated), `gitbook/`.

## Build, Test, and Development Commands
- Use Node 20 and pnpm 9.x. Install deps: `pnpm install` (root or per package).
- Compile contracts: `pnpm contracts:compile`. Build ABI: `pnpm contracts:build`.
- Test contracts: `pnpm contracts:test`. Coverage: `pnpm coverage`.
- Lint Solidity: `pnpm solhint`. Format Solidity: `pnpm fmtsol`.
- Frontend dev server: `pnpm -C frontend dev`. Build: `pnpm -C frontend build`. Lint/format: `pnpm -C frontend lint`, `pnpm -C frontend format`.
- Guardian services build/test: `pnpm -C t3rn-guardian build`, `pnpm -C t3rn-guardian test`.

## Coding Style & Naming Conventions
- Solidity: format with Prettier + `prettier-plugin-solidity`; lint with `solhint` (`.solhint.json`). Contracts in `PascalCase.sol`, libraries in `LibName.sol`, interfaces `IName.sol`.
- TypeScript/JS: Prettier 3 + ESLint 9 (unicorn, prettier). Use 2‑space indentation, `camelCase` for variables/functions, `PascalCase` for React components and Types.
- Commit hooks (husky) run format, compile, and basic checks; keep the tree clean.
- Quick fix: run `npm run format` in `frontend/` to quickly fix formatting issues.

## Testing Guidelines
- Frameworks: Hardhat + Mocha/Chai for contracts; Mocha/TS for `t3rn-guardian`; frontend relies on manual/CI checks.
- Place contract tests in `test/*.ts`. Name tests descriptively: `FeatureName.spec.ts`.
- Run full suite before PRs: `pnpm contracts:test && pnpm -C t3rn-guardian test`.

## Commit & Pull Request Guidelines
- Commit style follows conventional prefixes: `feat:`, `fix:`, `refactor:`, etc. Keep messages imperative and scoped.
- PRs must include: clear description, linked issues (e.g., `Closes #123`), screenshots for UI changes, and notes on testing.
- Ensure: no secrets committed (`.env*`), all linters/formatters/tests pass, and build succeeds for touched packages.

## Security & Configuration Tips
- Copy examples to local envs (`frontend/.env.example` → `frontend/.env`). Never commit secrets.
- Prefer `pnpm` everywhere; `preinstall` blocks other managers. Use `.nvmrc` to select Node.
