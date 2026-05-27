/**
 * Formula Engine đơn giản cho báo cáo tuỳ biến.
 *
 * Hỗ trợ:
 * - Phép tính: +, -, *, /
 * - Dấu ngoặc: ( )
 * - Tham chiếu cột: nhãn chữ cái A, B, C, ... (khi hiển thị)
 *   hoặc [col-uuid] (khi lưu trong DB)
 *
 * Ví dụ công thức hiển thị: "A + B - C"
 * Ví dụ công thức lưu DB:  "[uuid-1] + [uuid-2] - [uuid-3]"
 */

import type { ReportColumn } from '@/types/report';

// ─── Chuyển đổi nhãn ↔ ID ────────────────────────────

/** Tạo nhãn chữ cái từ index: 0→A, 1→B, ..., 25→Z, 26→AA */
export function indexToLabel(index: number): string {
  let label = '';
  let n = index;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

/** Chuyển nhãn chữ cái về index: A→0, B→1, Z→25, AA→26 */
export function labelToIndex(label: string): number {
  let index = 0;
  for (let i = 0; i < label.length; i++) {
    index = index * 26 + (label.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * Biên dịch công thức từ nhãn chữ cái (A, B, C...) sang dạng column ID
 * dùng để lưu vào database, đảm bảo ổn định khi thay đổi thứ tự cột.
 */
export function compileFormula(
  displayFormula: string,
  columns: ReportColumn[],
): string {
  // Lấy danh sách cột không phải formula (là cột có thể tham chiếu)
  const refColumns = columns.filter((c) => c.kind === 'category' || c.kind === 'system');

  // Thay thế các nhãn chữ cái bằng [column-id]
  // Regex: tìm các chuỗi chữ cái viết hoa đứng độc lập (không nằm trong [])
  return displayFormula.replace(/\b([A-Z]+)\b/g, (match) => {
    const idx = labelToIndex(match);
    if (idx >= 0 && idx < refColumns.length) {
      return `[${refColumns[idx].id}]`;
    }
    // Không tìm thấy cột tương ứng → giữ nguyên (sẽ báo lỗi khi evaluate)
    return match;
  });
}

/**
 * Dịch ngược công thức từ dạng column ID sang nhãn chữ cái
 * để hiển thị cho người dùng.
 */
export function decompileFormula(
  storedFormula: string,
  columns: ReportColumn[],
): string {
  const refColumns = columns.filter((c) => c.kind === 'category' || c.kind === 'system');

  // Thay [col-id] bằng nhãn chữ cái tương ứng
  return storedFormula.replace(/\[([^\]]+)\]/g, (_match, colId: string) => {
    const idx = refColumns.findIndex((c) => c.id === colId);
    if (idx >= 0) {
      return indexToLabel(idx);
    }
    return '?'; // Cột đã bị xoá
  });
}

// ─── Tokenizer & Parser ──────────────────────────────

type Token =
  | { type: 'number'; value: number }
  | { type: 'op'; value: string }
  | { type: 'paren'; value: '(' | ')' }
  | { type: 'ref'; value: string }; // [col-id]

function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = formula.trim();

  while (i < s.length) {
    // Bỏ qua khoảng trắng
    if (s[i] === ' ') {
      i++;
      continue;
    }

    // Số
    if (/[0-9.]/.test(s[i])) {
      let numStr = '';
      while (i < s.length && /[0-9.]/.test(s[i])) {
        numStr += s[i];
        i++;
      }
      tokens.push({ type: 'number', value: parseFloat(numStr) });
      continue;
    }

    // Toán tử
    if ('+-*/'.includes(s[i])) {
      tokens.push({ type: 'op', value: s[i] });
      i++;
      continue;
    }

    // Dấu ngoặc
    if (s[i] === '(' || s[i] === ')') {
      tokens.push({ type: 'paren', value: s[i] as '(' | ')' });
      i++;
      continue;
    }

    // Tham chiếu cột: [col-id]
    if (s[i] === '[') {
      let ref = '';
      i++; // Bỏ [
      while (i < s.length && s[i] !== ']') {
        ref += s[i];
        i++;
      }
      i++; // Bỏ ]
      tokens.push({ type: 'ref', value: ref });
      continue;
    }

    // Ký tự không nhận diện → bỏ qua
    i++;
  }

  return tokens;
}

// ─── Evaluate (Recursive Descent Parser) ─────────────

/**
 * Tính giá trị công thức dựa trên map giá trị cột.
 * @param formula - Công thức dạng column ID: "[uuid-1] + [uuid-2]"
 * @param columnValues - Map: columnId → giá trị số
 * @returns Kết quả tính toán, hoặc null nếu lỗi
 */
export function evaluateFormula(
  formula: string,
  columnValues: Map<string, number>,
): number | null {
  try {
    const tokens = tokenize(formula);
    let pos = 0;

    function peek(): Token | undefined {
      return tokens[pos];
    }

    function consume(): Token {
      return tokens[pos++];
    }

    // Cấp ưu tiên thấp nhất: + -
    function parseExpr(): number {
      let left = parseTerm();
      while (peek()?.type === 'op' && (peek()?.value === '+' || peek()?.value === '-')) {
        const op = consume().value;
        const right = parseTerm();
        left = op === '+' ? left + right : left - right;
      }
      return left;
    }

    // Cấp ưu tiên cao hơn: * /
    function parseTerm(): number {
      let left = parseFactor();
      while (peek()?.type === 'op' && (peek()?.value === '*' || peek()?.value === '/')) {
        const op = consume().value;
        const right = parseFactor();
        left = op === '*' ? left * right : right !== 0 ? left / right : 0;
      }
      return left;
    }

    // Đơn vị nhỏ nhất: số, tham chiếu, dấu ngoặc, số âm
    function parseFactor(): number {
      const token = peek();

      if (!token) return 0;

      // Số âm: - trước factor
      if (token.type === 'op' && token.value === '-') {
        consume();
        return -parseFactor();
      }

      // Dấu ngoặc
      if (token.type === 'paren' && token.value === '(') {
        consume(); // (
        const val = parseExpr();
        if (peek()?.type === 'paren' && peek()?.value === ')') {
          consume(); // )
        }
        return val;
      }

      // Số
      if (token.type === 'number') {
        consume();
        return token.value;
      }

      // Tham chiếu cột
      if (token.type === 'ref') {
        consume();
        return columnValues.get(token.value) ?? 0;
      }

      // Fallback
      consume();
      return 0;
    }

    const result = parseExpr();
    return isNaN(result) || !isFinite(result) ? null : result;
  } catch {
    return null;
  }
}
