# CaféChain — Web frontend

Next.js app for the CaféChain traceability program. See the [root README](../README.md) for setup and the demo walkthrough.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

The cluster and program ID are set in `lib/solana/constants.ts`. The program IDL lives in `types/` (`traza.json` for runtime, `traza.ts` for types); refresh both after changing the program.
