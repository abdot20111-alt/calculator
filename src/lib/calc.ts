export type Op = "+" | "−" | "×" | "÷";

export type CalcState = {
  /** Number currently shown (raw string, no thousands separators). */
  display: string;
  /** Left-hand operand waiting for the pending operator. */
  acc: number | null;
  op: Op | null;
  /** True when the next digit should start a new number. */
  fresh: boolean;
  /** Small line above the result, e.g. "2 + 3 ×". */
  expr: string;
  error: boolean;
};

export type CalcAction =
  | { type: "digit"; digit: string }
  | { type: "dot" }
  | { type: "op"; op: Op }
  | { type: "equals" }
  | { type: "clear" }
  | { type: "backspace" }
  | { type: "negate" }
  | { type: "percent" };

export const initialState: CalcState = {
  display: "0",
  acc: null,
  op: null,
  fresh: false,
  expr: "",
  error: false,
};

const MAX_DIGITS = 12;

const errorState: CalcState = { ...initialState, display: "Error", error: true };

/** Turn a number into a short display string, hiding float noise (0.1+0.2 → 0.3). */
export function format(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  const r = Number(n.toPrecision(MAX_DIGITS));
  const abs = Math.abs(r);
  if (abs >= 1e12 || (r !== 0 && abs < 1e-9)) {
    return r.toExponential(5).replace(/\.?0+e/, "e");
  }
  return String(r);
}

function apply(a: number, op: Op, b: number): number {
  switch (op) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
  }
}

export function reducer(state: CalcState, action: CalcAction): CalcState {
  if (action.type === "clear") return initialState;

  // After an error only AC, digits and the decimal point do anything.
  if (state.error) {
    if (action.type === "digit" || action.type === "dot") {
      return reducer(initialState, action);
    }
    return state;
  }

  switch (action.type) {
    case "digit": {
      if (state.fresh) {
        // Starting a new number; drop the old expression once a calculation finished.
        const expr = state.op ? state.expr : "";
        return { ...state, display: action.digit, fresh: false, expr };
      }
      if (state.display.replace(/[-.]/g, "").length >= MAX_DIGITS) return state;
      const display =
        state.display === "0" ? action.digit : state.display + action.digit;
      return { ...state, display };
    }

    case "dot": {
      if (state.fresh) {
        const expr = state.op ? state.expr : "";
        return { ...state, display: "0.", fresh: false, expr };
      }
      if (state.display.includes(".") || state.display.includes("e")) return state;
      return { ...state, display: state.display + "." };
    }

    case "op": {
      // Changing your mind about the operator: just swap it.
      if (state.op && state.fresh && state.acc !== null) {
        return { ...state, op: action.op, expr: `${format(state.acc)} ${action.op}` };
      }
      const current = parseFloat(state.display);
      let acc = current;
      if (state.op && state.acc !== null) {
        acc = apply(state.acc, state.op, current);
        if (!Number.isFinite(acc)) return errorState;
      }
      return {
        display: format(acc),
        acc,
        op: action.op,
        fresh: true,
        expr: `${format(acc)} ${action.op}`,
        error: false,
      };
    }

    case "equals": {
      if (!state.op || state.acc === null) return state;
      const current = parseFloat(state.display);
      const result = apply(state.acc, state.op, current);
      if (!Number.isFinite(result)) return errorState;
      return {
        display: format(result),
        acc: null,
        op: null,
        fresh: true,
        expr: `${format(state.acc)} ${state.op} ${format(current)} =`,
        error: false,
      };
    }

    case "backspace": {
      if (state.fresh) return state;
      const next = state.display.slice(0, -1);
      return { ...state, display: next === "" || next === "-" ? "0" : next };
    }

    case "negate": {
      if (state.display === "0") return state;
      const display = state.display.startsWith("-")
        ? state.display.slice(1)
        : "-" + state.display;
      return { ...state, display };
    }

    case "percent": {
      const display = format(parseFloat(state.display) / 100);
      return { ...state, display, fresh: true };
    }
  }
}

/** Add thousands separators for display only: "1234567.5" → "1,234,567.5". */
export function withCommas(display: string): string {
  if (display === "Error" || display.includes("e")) return display;
  const negative = display.startsWith("-");
  const [int, frac] = display.replace("-", "").split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (negative ? "-" : "") + grouped + (frac !== undefined ? "." + frac : "");
}
