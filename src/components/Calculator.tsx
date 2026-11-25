"use client";

import { useEffect, useReducer } from "react";
import {
  initialState,
  reducer,
  withCommas,
  type CalcAction,
  type Op,
} from "@/lib/calc";

type Key = {
  label: string;
  aria?: string;
  action: CalcAction;
  kind: "digit" | "fn" | "op";
  wide?: boolean;
};

const d = (digit: string): Key => ({
  label: digit,
  action: { type: "digit", digit },
  kind: "digit",
});
const o = (op: Op, aria: string): Key => ({
  label: op,
  aria,
  action: { type: "op", op },
  kind: "op",
});

const KEYS: Key[] = [
  { label: "AC", aria: "All clear", action: { type: "clear" }, kind: "fn" },
  { label: "±", aria: "Plus minus", action: { type: "negate" }, kind: "fn" },
  { label: "%", aria: "Percent", action: { type: "percent" }, kind: "fn" },
  o("÷", "Divide"),
  d("7"), d("8"), d("9"), o("×", "Multiply"),
  d("4"), d("5"), d("6"), o("−", "Subtract"),
  d("1"), d("2"), d("3"), o("+", "Add"),
  { ...d("0"), wide: true },
  { label: ".", aria: "Decimal point", action: { type: "dot" }, kind: "digit" },
  { label: "=", aria: "Equals", action: { type: "equals" }, kind: "op" },
];

const KEY_STYLES = {
  digit: "bg-key-digit text-white active:bg-key-digit-active",
  fn: "bg-key-fn text-black active:bg-key-fn-active",
  op: "bg-key-op text-white active:bg-key-op-active",
} as const;

/** Map a keyboard key to a calculator action, or null if it isn't one we handle. */
function keyToAction(e: KeyboardEvent): CalcAction | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (/^\d$/.test(e.key)) return { type: "digit", digit: e.key };
  switch (e.key) {
    case ".":
    case ",":
      return { type: "dot" };
    case "+":
      return { type: "op", op: "+" };
    case "-":
      return { type: "op", op: "−" };
    case "*":
    case "x":
    case "X":
      return { type: "op", op: "×" };
    case "/":
      return { type: "op", op: "÷" };
    case "%":
      return { type: "percent" };
    case "Enter":
    case "=":
      return { type: "equals" };
    case "Backspace":
      return { type: "backspace" };
    case "Escape":
    case "Delete":
      return { type: "clear" };
    default:
      return null;
  }
}

export default function Calculator() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const action = keyToAction(e);
      if (!action) return;
      // Stops Enter from also "clicking" a focused button, and "/" from opening quick-find.
      e.preventDefault();
      dispatch(action);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const shown = withCommas(state.display);
  // Shrink the font as the number gets longer so it never overflows.
  const size =
    shown.length > 13 ? "text-4xl" : shown.length > 9 ? "text-5xl" : "text-7xl";

  return (
    <div className="w-full max-w-xs">
      <div className="flex min-h-32 flex-col items-end justify-end px-2 pb-3">
        <div className="h-6 text-lg text-white/50" aria-hidden="true">
          {state.expr}
        </div>
        <output
          aria-live="polite"
          className={`${size} w-full overflow-hidden text-right font-light tabular-nums text-white`}
        >
          {shown}
        </output>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {KEYS.map((key) => {
          const pending =
            key.kind === "op" && state.op === key.label && state.fresh;
          return (
            <button
              key={key.label}
              type="button"
              aria-label={key.aria}
              onClick={() => dispatch(key.action)}
              className={`${
                pending
                  ? "bg-white text-key-op"
                  : KEY_STYLES[key.kind]
              } ${
                key.wide
                  ? "col-span-2 aspect-auto h-[4.5rem] justify-start pl-8"
                  : "aspect-square"
              } flex items-center justify-center rounded-full text-3xl transition-colors select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
            >
              {key.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
