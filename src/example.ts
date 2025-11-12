import { parseJson, tryParseJson } from "./JsonParser.js";

// Example 1: Standard JSON
console.log("Example 1: Standard JSON");
const standard = parseJson('{"name": "John", "age": 30}');
console.log(standard);

// Example 2: JSON with trailing commas
console.log("\nExample 2: Trailing commas");
const withTrailingCommas = parseJson(`{
  "name": "Jane",
  "hobbies": ["reading", "coding",],
}`);
console.log(withTrailingCommas);

// Example 3: JSON with comments
console.log("\nExample 3: With comments");
const withComments = parseJson(`{
  // This is a comment
  "name": "Bob",
  /* Multi-line
     comment */
  "active": true
}`);
console.log(withComments);

// Example 4: JSON with single quotes
console.log("\nExample 4: Single quotes");
const singleQuotes = parseJson("{'name': 'Alice', 'age': 25}");
console.log(singleQuotes);

// Example 5: Safe parsing with tryParseJson
console.log("\nExample 5: Safe parsing");
const result = tryParseJson("invalid json {{{");
console.log("Success:", result.success);
if (!result.success) {
  console.log("Error:", result.error);
}

// Example 6: Extract JSON from text
console.log("\nExample 6: Extract from text");
const embedded = parseJson('Here is some JSON: {"status": "ok"} and more text');
console.log(embedded);

export {};
