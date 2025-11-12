# JSON Parser

A flexible and forgiving JSON parser for TypeScript/JavaScript that handles non-standard JSON formats commonly encountered in real-world scenarios.

## Features

- **Lenient Parsing**: Handles common JSON variations and non-standard formats
- **Trailing Commas**: Automatically removes trailing commas from objects and arrays
- **Comments Support**: Strips single-line (`//`) and multi-line (`/* */`) comments
- **Single Quotes**: Converts single quotes to double quotes
- **Unquoted Keys**: Supports JavaScript-style unquoted object keys
- **Special Values**: Handles `NaN`, `Infinity`, and `-Infinity`
- **BOM Handling**: Automatically strips Byte Order Mark (BOM) characters
- **Control Characters**: Properly escapes control characters in strings
- **Markdown Extraction**: Extracts JSON from markdown code blocks (` ```json ... ``` `)
- **Unicode Support**: Full support for Unicode characters including emoji and Chinese characters (中文)
- **Smart Extraction**: Automatically finds and extracts JSON from surrounding text

## Installation

```bash
npm install
```

## Usage

### Basic Usage

```typescript
import { parseJson, tryParseJson } from './JsonParser';

// Parse standard JSON
const data = parseJson('{"name": "Alice", "age": 30}');
console.log(data); // { name: "Alice", age: 30 }

// Parse JSON with trailing commas
const data2 = parseJson('{"name": "Bob", "age": 25,}');
console.log(data2); // { name: "Bob", age: 25 }

// Parse JSON with comments
const data3 = parseJson(`{
  // User information
  "name": "Charlie",
  /* Age field */
  "age": 35
}`);
console.log(data3); // { name: "Charlie", age: 35 }
```

### Safe Parsing with tryParseJson

```typescript
const result = tryParseJson('{"name": "Dave"}');
if (result.success) {
  console.log(result.data); // { name: "Dave" }
} else {
  console.error(result.error);
}
```

### Parsing Options

```typescript
const options = {
  allowTrailingCommas: true,   // Default: true
  allowComments: true,          // Default: true
  allowSingleQuotes: true,      // Default: true
  allowUnquotedKeys: false,     // Default: false
  allowNaN: true,               // Default: true
  allowInfinity: true,          // Default: true
  stripBOM: true                // Default: true
};

const data = parseJson(jsonString, options);
```

### Extract from Markdown

```typescript
const markdown = `
Here is the configuration:
\`\`\`json
{
  "server": "localhost",
  "port": 3000
}
\`\`\`
`;

const config = parseJson(markdown);
console.log(config); // { server: "localhost", port: 3000 }
```

### Unicode and Chinese Support

```typescript
// Chinese characters
const data = parseJson(`{
  "姓名": "王小明",
  "年齡": 25,
  "城市": "台北"
}`);
console.log(data); // { 姓名: "王小明", 年齡: 25, 城市: "台北" }

// Emoji support
const data2 = parseJson('{"emoji": "👋", "message": "Hello!"}');
console.log(data2); // { emoji: "👋", message: "Hello!" }
```

### TypeScript Type Inference

```typescript
interface User {
  name: string;
  age: number;
}

const user = parseJson<User>('{"name": "Alice", "age": 30}');
// user is typed as User
```

## API Reference

### `parseJson<T>(content: string, options?: JsonParseOptions): T`

Parses JSON content with fallback strategies for non-standard formats.

- **Parameters:**
  - `content`: The string content to parse
  - `options`: Optional parsing configuration
- **Returns:** Parsed JSON data
- **Throws:** Error if parsing fails after all attempts

### `tryParseJson<T>(content: string, options?: JsonParseOptions): JsonParseResult<T>`

Safe version that returns a result object instead of throwing errors.

- **Parameters:**
  - `content`: The string content to parse
  - `options`: Optional parsing configuration
- **Returns:** Result object with `success`, `data`, and `error` properties

### `JsonParseOptions`

```typescript
interface JsonParseOptions {
  allowTrailingCommas?: boolean;   // Remove trailing commas
  allowComments?: boolean;          // Strip comments
  allowSingleQuotes?: boolean;      // Convert single to double quotes
  allowUnquotedKeys?: boolean;      // Add quotes to unquoted keys
  allowNaN?: boolean;               // Parse NaN values
  allowInfinity?: boolean;          // Parse Infinity values
  stripBOM?: boolean;               // Remove BOM character
}
```

### `JsonParseResult<T>`

```typescript
interface JsonParseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Development mode with auto-rebuild
npm run dev
```

## Testing

The project includes comprehensive test coverage for:

- Standard JSON parsing
- Trailing commas handling
- Comments (single-line and multi-line)
- Single quotes conversion
- Whitespace handling
- BOM character stripping
- Special numeric values (NaN, Infinity)
- Unquoted keys
- JSON extraction from text
- Markdown code blocks
- Unicode and Chinese characters
- Complex nested structures
- Error handling

Run the test suite:

```bash
npm test
```

## License

ISC
