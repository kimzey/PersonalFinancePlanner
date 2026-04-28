type Token =
  | { type: "number"; value: number }
  | { type: "operator"; value: "+" | "-" | "*" | "/" }
  | { type: "paren"; value: "(" | ")" };

const precedence = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
} as const;

export function parseCalculatorInput(input: string): number {
  const trimmedInput = input.trim().replaceAll(",", "");

  if (trimmedInput.length === 0) {
    throw new Error("กรุณากรอกตัวเลข");
  }

  const tokens = tokenize(trimmedInput);
  const output = toReversePolishNotation(tokens);
  const result = evaluateReversePolishNotation(output);

  if (!Number.isFinite(result)) {
    throw new Error("ผลลัพธ์ไม่ถูกต้อง");
  }

  return result;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  let expectsValue = true;

  while (index < input.length) {
    const character = input[index];

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    if (character === "(" || character === ")") {
      tokens.push({ type: "paren", value: character });
      index += 1;
      expectsValue = character === "(";
      continue;
    }

    const isSignedNumber =
      (character === "-" || character === "+") &&
      expectsValue &&
      /[\d.]/.test(input[index + 1] ?? "");

    if (/[\d.]/.test(character) || isSignedNumber) {
      const match = input.slice(index).match(/^[+-]?(?:\d+\.?\d*|\.\d+)([kKmM])?/);

      if (!match) {
        throw new Error("รูปแบบตัวเลขไม่ถูกต้อง");
      }

      const rawNumber = match[0].replace(/[kKmM]$/, "");
      const suffix = match[1]?.toLowerCase();
      const multiplier = suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : 1;
      tokens.push({ type: "number", value: Number(rawNumber) * multiplier });
      index += match[0].length;
      expectsValue = false;
      continue;
    }

    if (character === "+" || character === "-" || character === "*" || character === "/") {
      if (expectsValue) {
        throw new Error("เครื่องหมายคำนวณไม่ถูกตำแหน่ง");
      }

      tokens.push({ type: "operator", value: character });
      index += 1;
      expectsValue = true;
      continue;
    }

    throw new Error("รองรับเฉพาะตัวเลข k m และ + - * /");
  }

  if (expectsValue) {
    throw new Error("สูตรยังไม่สมบูรณ์");
  }

  return tokens;
}

function toReversePolishNotation(tokens: Token[]) {
  const output: Token[] = [];
  const operators: Token[] = [];

  for (const token of tokens) {
    if (token.type === "number") {
      output.push(token);
      continue;
    }

    if (token.type === "operator") {
      while (true) {
        const previous = operators.at(-1);

        if (
          previous?.type !== "operator" ||
          precedence[previous.value] < precedence[token.value]
        ) {
          break;
        }

        output.push(operators.pop() as Token);
      }

      operators.push(token);
      continue;
    }

    if (token.value === "(") {
      operators.push(token);
      continue;
    }

    while (operators.length > 0 && operators.at(-1)?.type !== "paren") {
      output.push(operators.pop() as Token);
    }

    if (operators.at(-1)?.type !== "paren") {
      throw new Error("วงเล็บไม่ครบ");
    }

    operators.pop();
  }

  while (operators.length > 0) {
    const operator = operators.pop() as Token;

    if (operator.type === "paren") {
      throw new Error("วงเล็บไม่ครบ");
    }

    output.push(operator);
  }

  return output;
}

function evaluateReversePolishNotation(tokens: Token[]) {
  const values: number[] = [];

  for (const token of tokens) {
    if (token.type === "number") {
      values.push(token.value);
      continue;
    }

    if (token.type !== "operator") continue;

    const right = values.pop();
    const left = values.pop();

    if (left === undefined || right === undefined) {
      throw new Error("สูตรยังไม่สมบูรณ์");
    }

    if (token.value === "/" && right === 0) {
      throw new Error("ไม่สามารถหารด้วยศูนย์");
    }

    values.push(applyOperator(left, right, token.value));
  }

  if (values.length !== 1) {
    throw new Error("สูตรยังไม่สมบูรณ์");
  }

  return values[0];
}

function applyOperator(
  left: number,
  right: number,
  operator: "+" | "-" | "*" | "/",
) {
  if (operator === "+") return left + right;
  if (operator === "-") return left - right;
  if (operator === "*") return left * right;
  return left / right;
}
