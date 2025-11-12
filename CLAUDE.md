# CLAUDE.md

## Project Overview

This is a TypeScript JSON parser library that provides flexible, forgiving JSON parsing capabilities. It handles various non-standard JSON formats commonly encountered when working with LLM outputs, markdown documents, and real-world data.

## Architecture

### Core Components

1. **JsonParser.ts** - Main parsing logic with fallback strategies
2. **JsonParser.test.ts** - Comprehensive test suite with 70+ test cases

### Key Functions

#### `parseJson<T>(content: string, options?: JsonParseOptions): T`
- Main parsing function that attempts multiple strategies
- First tries standard `JSON.parse()`
- Falls back to cleaning and transformation if needed
- Extracts JSON from surrounding text if direct parsing fails
- Throws error if all strategies fail

#### `tryParseJson<T>(content: string, options?: JsonParseOptions): JsonParseResult<T>`
- Safe wrapper that returns result object instead of throwing
- Useful for scenarios where parsing failure should be handled gracefully

### Parsing Strategies

The parser applies transformations in this order:

1. **BOM Removal** - Strip UTF-8 BOM character (`\ufeff`)
2. **Control Character Escaping** - Escape unescaped control characters in strings
3. **Comment Removal** - Strip `//` and `/* */` comments
4. **Trailing Comma Removal** - Remove commas before `}` and `]`
5. **Quote Conversion** - Convert single quotes to double quotes
6. **Special Value Handling** - Convert NaN/Infinity to strings, then restore after parsing
7. **Unquoted Key Handling** - Add quotes to JavaScript-style object keys
8. **JSON Extraction** - Find and extract JSON from surrounding text using bracket matching

### Internal Utility Functions

- `convertSingleQuotesToDouble()` - Context-aware quote conversion
- `escapeControlCharacters()` - Escape control chars only within strings
- `addQuotesToKeys()` - Regex-based key quoting
- `extractJson()` - Smart JSON extraction from text
- `extractCompleteJson()` - Bracket-matching extraction algorithm
- `restoreSpecialValues()` - Recursive restoration of NaN/Infinity

## Project Structure

```
json/
├── src/
│   ├── JsonParser.ts        # Main parser implementation
│   └── JsonParser.test.ts   # Test suite (70+ tests)
├── tests/
│   ├── test.json           # Real-world test files
│   ├── test2.json
│   ├── test3.json
│   └── test4.json
├── dist/                    # Compiled output
├── package.json
├── tsconfig.json
├── README.md               # User-facing documentation
└── CLAUDE.md              # This file
```

## Development Workflow

### Building
```bash
npm run build        # Compile TypeScript
npm run dev          # Watch mode for development
```

### Testing
```bash
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Test Coverage Areas

1. **Standard JSON** - Basic object/array/primitive parsing
2. **Trailing Commas** - Single, multiple, nested
3. **Comments** - Single-line, multi-line, inline, mixed
4. **Single Quotes** - Keys, values, arrays, nested
5. **Whitespace** - Extra spaces, newlines, tabs
6. **BOM Handling** - UTF-8 BOM character
7. **Special Values** - NaN, Infinity, -Infinity
8. **Unquoted Keys** - Alphanumeric, underscore, dollar sign
9. **Text Extraction** - Objects, arrays, complex structures
10. **Markdown Code Blocks** - ` ```json ... ``` ` syntax
11. **Unicode Support** - Emoji, Chinese characters (中文)
12. **Edge Cases** - Long strings, large numbers, escaped chars
13. **Error Cases** - Invalid syntax, unclosed brackets
14. **Options** - All configuration combinations
15. **Real-world Files** - Control characters, complex structures
16. **TypeScript Types** - Type inference with generics

## Design Decisions

### Why Multiple Fallback Strategies?

The parser is designed to handle LLM outputs and real-world JSON that may not be strictly valid. Common issues include:
- LLMs often generate JSON with trailing commas
- Code snippets may include comments for clarity
- Markdown documents wrap JSON in code blocks
- Copy-pasted data may include BOM characters
- Different languages and tools use varying quote styles

### Why Not Just Fix One Thing?

The transformations are applied in a specific order because:
1. Control characters must be escaped before other transformations
2. Comments might contain quote characters that shouldn't be converted
3. Special values need to be stringified before parsing, then restored
4. Each transformation assumes previous ones have been applied

### Performance Considerations

- Standard `JSON.parse()` is tried first (fast path)
- Transformations only applied if standard parsing fails
- Character-by-character processing used for context-aware transformations
- Regex used for simple pattern replacements
- Extraction uses efficient bracket-matching algorithm

## Common Use Cases

### 1. LLM Response Parsing
```typescript
// LLM might return JSON with comments or trailing commas
const llmResponse = `{
  "answer": "The result is 42",
  "confidence": 0.95, // very confident
}`;
const data = parseJson(llmResponse);
```

### 2. Markdown Document Parsing
```typescript
const markdown = await fetchMarkdownDoc();
const config = parseJson(markdown); // Extracts from ```json blocks
```

### 3. Forgiving Config File Parsing
```typescript
// Users might add comments to config files
const config = parseJson(fs.readFileSync('config.json', 'utf-8'));
```

### 4. Multilingual Data
```typescript
// Full Unicode support including CJK characters
const userData = parseJson(chineseJsonString);
```

## Testing Strategy

### Unit Tests
- Each feature has dedicated test cases
- Options are tested in isolation and combination
- Edge cases and error conditions covered

### Integration Tests
- Real-world JSON files from `tests/` directory
- Complex combinations of features
- Markdown extraction scenarios

### Type Safety Tests
- TypeScript generic type inference
- Interface compliance verification

## Future Enhancements

Potential improvements to consider:

1. **Performance Optimization**
   - Lazy transformation application
   - Caching for repeated patterns
   - Stream parsing for large files

2. **Additional Features**
   - JSONC format support
   - JSON5 compatibility
   - Source map generation for error reporting
   - Line/column error positions

3. **Configuration**
   - Custom transformation pipeline
   - Plugin system for custom handlers
   - Strict mode for validation

4. **Tooling**
   - CLI tool for file conversion
   - VS Code extension
   - ESLint plugin for validation

## Debugging Tips

### Enable Detailed Errors
The parser throws errors with both the final error and original error:
```typescript
try {
  parseJson(content);
} catch (err) {
  console.error(err.message); // Shows both transformation and original error
}
```

### Use tryParseJson for Debugging
```typescript
const result = tryParseJson(content);
if (!result.success) {
  console.log('Failed to parse:', result.error);
  console.log('Original content:', content);
}
```

### Test Against Standard Parser
```typescript
// Compare with standard parser
try {
  const standard = JSON.parse(content);
  const forgiving = parseJson(content);
  console.log('Both succeeded:', standard, forgiving);
} catch {
  console.log('Only forgiving parser worked:', parseJson(content));
}
```

## Contributing Guidelines

When adding new features:

1. Add test cases first (TDD approach)
2. Consider order of transformations
3. Handle edge cases (escaped characters, nested quotes, etc.)
4. Update both README.md and CLAUDE.md
5. Ensure all existing tests still pass
6. Add both positive and negative test cases

## Known Limitations

1. **Regex Limitations**
   - Simple regex patterns may not handle deeply nested structures perfectly
   - Complex escape sequences in strings might be edge cases

2. **Performance**
   - Character-by-character processing can be slow for very large files
   - Multiple transformation passes may have overhead

3. **Ambiguity**
   - Some malformed JSON could be interpreted multiple ways
   - Parser makes best-effort attempts but may not always guess correctly

4. **Not a Validator**
   - Focuses on successful parsing, not validation
   - Use a JSON schema validator if strict validation is needed

## Resources

- [JSON Specification](https://www.json.org/)
- [JSON5 Spec](https://json5.org/) - Similar goals but different approach
- [JSONC](https://code.visualstudio.com/docs/languages/json#_json-with-comments) - JSON with Comments
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Vitest Documentation](https://vitest.dev/)
