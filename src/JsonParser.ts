export interface JsonParseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface JsonParseOptions {
  allowTrailingCommas?: boolean;
  allowComments?: boolean;
  allowSingleQuotes?: boolean;
  allowUnquotedKeys?: boolean;
  allowNaN?: boolean;
  allowInfinity?: boolean;
  stripBOM?: boolean;
}

/**
 * Attempts to parse JSON content from a string with various fallback strategies
 * @param content - The string content to parse
 * @param options - Parsing options for handling non-standard JSON
 * @returns Parsed JSON data or throws an error
 */
export function parseJson<T = any>(
  content: string,
  options: JsonParseOptions = {}
): T {
  const {
    allowTrailingCommas = true,
    allowComments = true,
    allowSingleQuotes = true,
    allowUnquotedKeys = false,
    allowNaN = true,
    allowInfinity = true,
    stripBOM = true,
  } = options;

  // Try standard JSON.parse first
  try {
    return JSON.parse(content);
  } catch (firstError) {
    // If standard parse fails, try cleaning the content
    let cleaned = content;

    // Remove BOM (Byte Order Mark)
    if (stripBOM && cleaned.charCodeAt(0) === 0xfeff) {
      cleaned = cleaned.slice(1);
    }

    // Trim whitespace
    cleaned = cleaned.trim();

    // Escape control characters in strings FIRST (before other transformations)
    cleaned = escapeControlCharacters(cleaned);

    // Remove comments
    if (allowComments) {
      // Remove single-line comments
      cleaned = cleaned.replace(/\/\/.*$/gm, "");
      // Remove multi-line comments
      cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
    }

    // Remove trailing commas
    if (allowTrailingCommas) {
      // Remove trailing commas before closing braces/brackets
      cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");
    }

    // Convert single quotes to double quotes (basic approach)
    if (allowSingleQuotes) {
      cleaned = convertSingleQuotesToDouble(cleaned);
    }

    // Handle NaN and Infinity
    if (allowNaN || allowInfinity) {
      cleaned = cleaned.replace(/:\s*NaN/g, ': "NaN"');
      cleaned = cleaned.replace(/:\s*Infinity/g, ': "Infinity"');
      cleaned = cleaned.replace(/:\s*-Infinity/g, ': "-Infinity"');
    }

    // Handle unquoted keys (basic approach)
    if (allowUnquotedKeys) {
      cleaned = addQuotesToKeys(cleaned);
    }

    // Try parsing the cleaned content
    try {
      const result = JSON.parse(cleaned);

      // Post-process to restore NaN and Infinity if needed
      if (allowNaN || allowInfinity) {
        return restoreSpecialValues(result, allowNaN, allowInfinity);
      }

      return result;
    } catch (secondError) {
      // Try to extract JSON from within the string
      const extracted = extractJson(content);
      if (extracted) {
        try {
          return JSON.parse(extracted);
        } catch {
          // Continue to final error
        }
      }

      // If all attempts fail, throw a descriptive error
      throw new Error(
        `Failed to parse JSON: ${
          secondError instanceof Error
            ? secondError.message
            : String(secondError)
        }\nOriginal error: ${
          firstError instanceof Error ? firstError.message : String(firstError)
        }`
      );
    }
  }
}

/**
 * Safe version that returns a result object instead of throwing
 */
export function tryParseJson<T = any>(
  content: string,
  options?: JsonParseOptions
): JsonParseResult<T> {
  try {
    const data = parseJson<T>(content, options);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Convert single quotes to double quotes while preserving quoted content
 */
function convertSingleQuotesToDouble(str: string): string {
  let result = "";
  let inDoubleQuote = false;
  let inSingleQuote = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    // const prevChar = i > 0 ? str[i - 1] : "";

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      result += char;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      result += char;
    } else if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      result += '"'; // Convert single quote to double quote
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Escape control characters in JSON strings
 */
function escapeControlCharacters(str: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const charCode = str.charCodeAt(i);

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      result += char;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    // If we're in a string and encounter a control character, escape it
    if (inString && charCode < 32) {
      switch (char) {
        case "\n":
          result += "\\n";
          break;
        case "\r":
          result += "\\r";
          break;
        case "\t":
          result += "\\t";
          break;
        case "\b":
          result += "\\b";
          break;
        case "\f":
          result += "\\f";
          break;
        default:
          // For other control characters, use unicode escape
          result += "\\u" + charCode.toString(16).padStart(4, "0");
          break;
      }
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Add quotes to unquoted object keys
 */
function addQuotesToKeys(str: string): string {
  // Match unquoted keys (word characters followed by colon)
  return str.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
}

/**
 * Extract JSON content from a string that might contain other text
 */
function extractJson(str: string): string | null {
  // Try to find and extract the first complete JSON object
  const objStart = str.indexOf("{");
  if (objStart !== -1) {
    const extracted = extractCompleteJson(str, objStart, "{", "}");
    if (extracted) return extracted;
  }

  // Try to find and extract the first complete JSON array
  const arrStart = str.indexOf("[");
  if (arrStart !== -1) {
    const extracted = extractCompleteJson(str, arrStart, "[", "]");
    if (extracted) return extracted;
  }

  return null;
}

/**
 * Extract a complete JSON structure starting from a given position
 */
function extractCompleteJson(
  str: string,
  startPos: number,
  openChar: string,
  closeChar: string
): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startPos; i < str.length; i++) {
    const char = str[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          return str.substring(startPos, i + 1);
        }
      }
    }
  }

  return null;
}

/**
 * Restore special numeric values (NaN, Infinity) after parsing
 */
function restoreSpecialValues(
  obj: any,
  allowNaN: boolean,
  allowInfinity: boolean
): any {
  if (obj === null || typeof obj !== "object") {
    if (typeof obj === "string") {
      if (allowNaN && obj === "NaN") return NaN;
      if (allowInfinity && obj === "Infinity") return Infinity;
      if (allowInfinity && obj === "-Infinity") return -Infinity;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      restoreSpecialValues(item, allowNaN, allowInfinity)
    );
  }

  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = restoreSpecialValues(obj[key], allowNaN, allowInfinity);
    }
  }
  return result;
}

export default parseJson;
