# Calculator

A small calculator built with Next.js (App Router), TypeScript and Tailwind CSS.

- Chained operations evaluate step by step, like a pocket calculator (`2 + 3 × 4 = 20`)
- `AC`, `±`, `%`, backspace, decimals, divide-by-zero shows `Error`
- Keyboard support: digits, `+ - * /`, `Enter`, `Backspace`, `Esc`

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

The calculation logic lives in `src/lib/calc.ts` as a pure reducer.
