# Why Valid JSON Still Breaks APIs: Types, Nulls, Numbers, and Structure

A parser can accept every character in a JSON document and the request can still fail the moment it reaches an API.

That is because valid JSON syntax is only the first layer of correctness. The receiving system may also require a specific hierarchy, exact property names, expected data types, required fields, and application-specific meanings.

This guide walks through those failure points in a practical order so you can determine whether the problem is invalid JSON, an incorrect payload structure, a type mismatch, or data that is valid but means something different from what the API expects.

## Quick diagnosis: where should you look first?

When an API rejects a payload, the error message can often point you toward the correct layer.

| What you see | Check first |
| --- | --- |
| `Invalid JSON` or parsing error | Quotes, commas, brackets, and syntax |
| `Invalid type` | String vs number vs boolean vs null |
| `Required field missing` | Property spelling and nesting |
| Array-related error | Array vs object structure |
| Value changes after parsing | Large numbers or duplicate keys |
| `"false"` behaves unexpectedly | String vs boolean |
| Request works after removing a wrapper | Top-level structure |
| Empty value causes unexpected behavior | Missing vs `null` vs empty value |

A successful syntax check proves that the JSON can be parsed. It does not prove that the request matches the API contract.

## Valid JSON and valid API data are different things

Consider these two payloads:

```json
{
  "quantity": 5
}
```

and:

```json
{
  "quantity": "5"
}
```

Both are valid JSON.

But they contain different data.

In the first example, `quantity` is a number. In the second, it is a string containing the character `5`.

If an API contract requires a number, the second request can be rejected even though a JSON validator reports that the document is syntactically valid.

This gives us an important distinction:

**Parsing asks:** Can this JSON be read?

**Validation asks:** Does this data match what the receiving system expects?

Those are separate questions.

## Start with the actual data type

JSON has a small set of value types:

- string
- number
- object
- array
- boolean
- null

Values that look similar to a person can behave very differently in software.

Consider:

```json
{
  "enabled": true,
  "enabledText": "true",
  "count": 12,
  "countText": "12",
  "empty": null,
  "emptyText": "null"
}
```

The pairs may look related, but they are not equivalent.

`true` is a boolean.

`"true"` is a string.

`12` is a number.

`"12"` is a string.

`null` is the JSON null value.

`"null"` is four characters inside a string.

This becomes especially important when values originate from HTML forms, CSV files, environment variables, command-line arguments, spreadsheets, or other sources that may initially represent everything as text.

### A useful type-checking method

When an important field behaves unexpectedly, write down what you expect and what is actually being sent.

| Property | Expected type | Actual value | Actual type |
| --- | --- | --- | --- |
| `quantity` | number | `"5"` | string |
| `active` | boolean | `true` | boolean |
| `tags` | array | `[]` | array |
| `nickname` | string or null | `null` | null |

This simple comparison often exposes a problem faster than repeatedly editing and resending the entire request.

## Missing, null, and empty do not mean the same thing

Suppose an API accepts profile updates.

These three requests may produce completely different results.

### Property omitted

```json
{
  "displayName": "Ayesha"
}
```

There is no `bio` property.

Depending on the API, this may mean:

**Leave the existing bio unchanged.**

### Explicit null

```json
{
  "displayName": "Ayesha",
  "bio": null
}
```

This might mean:

**Remove the existing bio value.**

### Empty string

```json
{
  "displayName": "Ayesha",
  "bio": ""
}
```

This may mean:

**Set the bio to an empty string.**

JSON itself does not decide what these states mean. The receiving application does.

The same problem appears with arrays.

```json
{
  "tags": []
}
```

An empty array might mean "replace all existing tags with no tags."

Leaving `tags` out of the request might instead mean "do not modify the tags."

When debugging an API request, do not automatically replace missing values with `null`, empty strings, empty objects, or empty arrays. Check what the API documentation says each state represents.

## Numbers can cause problems even when the JSON is valid

JSON supports numbers, but it does not define application-specific meanings such as:

- integer identifier
- price
- timestamp
- percentage
- account number
- database key

Consider:

```json
{
  "userId": 9007199254740993
}
```

This is valid JSON.

However, some programming environments represent ordinary numbers using floating-point values. Very large integers can therefore lose precision after being parsed.

That matters especially for identifiers, where changing even one digit creates a completely different value.

If an API requires exact preservation of a large identifier, its documentation may recommend sending that identifier as a string:

```json
{
  "userId": "9007199254740993"
}
```

That does **not** mean every number should become a string.

The correct representation depends on the API contract.

Decimals deserve similar attention.

```json
{
  "price": 19.99
}
```

This may be suitable for one application, while another system may require an integer number of minor currency units:

```json
{
  "priceCents": 1999
}
```

JSON can represent either structure. Only the receiving system can tell you which one is correct.

## Arrays and objects are not interchangeable

These two payloads have different structures:

```json
{
  "users": {
    "name": "Ali"
  }
}
```

and:

```json
{
  "users": [
    {
      "name": "Ali"
    }
  ]
}
```

The first makes `users` an object.

The second makes `users` an array containing one object.

An application expecting:

```javascript
users[0].name
```

cannot use the first structure in the same way.

An application expecting:

```javascript
users.name
```

cannot use the second structure in the same way.

A common debugging mistake is to inspect the values inside a payload while overlooking the container that holds them.

When an API reports a vague message such as `invalid payload`, compare the structure from the outside inward.

## One unnecessary wrapper can break the request

Suppose an endpoint expects:

```json
{
  "email": "test@example.com",
  "role": "editor"
}
```

but the client sends:

```json
{
  "user": {
    "email": "test@example.com",
    "role": "editor"
  }
}
```

Every individual value may be correct, but the request has the wrong top-level shape.

The reverse problem can also occur.

An endpoint may expect:

```json
{
  "user": {
    "email": "test@example.com"
  }
}
```

while the client sends:

```json
{
  "email": "test@example.com"
}
```

Before changing individual values, compare the entire hierarchy with the API documentation.

Thinking about the payload as a tree can help:

```text
root
└── user
    ├── email
    └── role
```

If the receiver expects `email` under `user`, putting it directly at the root changes the contract.

## Property names must match exactly

These properties are not necessarily equivalent:

```json
{
  "userId": 17
}
```

```json
{
  "userid": 17
}
```

```json
{
  "user_id": 17
}
```

```json
{
  "UserId": 17
}
```

All four are valid JSON.

Whether the API recognizes them depends entirely on its schema and implementation.

When an API behaves as though a value is missing even though you can see it in the payload, compare the property name carefully with the documented name.

Check:

- capitalization
- underscores
- hyphens
- singular vs plural
- nesting
- spelling

A formatter can make the structure easier to inspect, but it cannot know that an API expects `user_id` instead of `userId` unless a schema is supplied separately.

## Duplicate property names are dangerous

Consider this object:

```json
{
  "status": "draft",
  "status": "published"
}
```

The text contains two properties with the same name.

Different software may handle this situation differently. One parser may retain the last value, another tool may warn about the duplicate, and another processing layer may reject the data.

That makes duplicate keys unsafe to rely on.

If your JSON formatter or validator reports repeated property names, fix the source data rather than assuming which value will survive parsing.

Duplicate keys are also a reason to preserve the original input while debugging. Once a parser converts the text into an ordinary object, information about repeated keys may already have been lost.

## Formatting does not fix incorrect data

These two documents represent the same JSON structure:

```json
{"name":"Sara","roles":["author","editor"]}
```

and:

```json
{
  "name": "Sara",
  "roles": [
    "author",
    "editor"
  ]
}
```

Pretty-printing adds whitespace and indentation.

Minifying removes unnecessary whitespace.

Neither operation should change the underlying strings, numbers, booleans, arrays, objects, or null values.

Formatting is useful because it makes nesting easier to inspect, but it does not correct a wrong type or an incorrect schema.

### A practical formatting workflow

When investigating a payload:

1. Keep a copy of the original request.
2. Remove or replace sensitive information.
3. Validate the JSON syntax.
4. Pretty-print the payload.
5. Inspect the outer structure.
6. Compare property names with the API documentation.
7. Check the type of each important value.
8. Compare missing, `null`, and empty fields.
9. Only then modify the request.

You can use the **Anvil Tools JSON Formatter & Validator** during the syntax and formatting stages, but remember that successful parsing does not guarantee that the payload satisfies an API schema.

## Watch for JSON hidden inside a string

Sometimes a property contains text that looks like JSON.

For example:

```json
{
  "settings": "{\"theme\":\"dark\",\"compact\":true}"
}
```

Here, `settings` is a string.

It is not a nested JSON object.

Compare it with:

```json
{
  "settings": {
    "theme": "dark",
    "compact": true
  }
}
```

These values have different types and require different handling.

Stringified JSON can be intentional. Some systems store serialized structures inside text fields or pass them through queues and databases.

But accidental double serialization is a common source of bugs.

A useful warning sign is a value containing many escaped quotation marks such as:

```text
\"
```

Do not automatically parse a string again simply because it resembles JSON. First confirm whether the receiving application expects an object or a serialized string.

## Boolean values are not strings

JSON booleans are written as:

```json
true
```

and:

```json
false
```

without quotation marks.

These values are strings:

```json
"true"
"false"
"yes"
"no"
"1"
"0"
```

Some APIs deliberately convert those strings. Others reject them.

Consider:

```json
{
  "notifications": "false"
}
```

The intention may be to disable notifications, but the value is still a non-empty string.

In programming environments where non-empty strings are considered truthy, careless conversion can even produce the opposite behavior from what the developer intended.

If the API expects a boolean, send an actual boolean:

```json
{
  "notifications": false
}
```

## A complete example: valid JSON, invalid API payload

Consider this request:

```json
{
  "user": {
    "age": "28",
    "active": "false",
    "roles": {
      "name": "editor"
    }
  }
}
```

The JSON syntax is valid.

Suppose the API expects this contract:

```text
age     → number
active  → boolean
roles   → array of strings
```

The payload contains three separate problems.

### Problem 1: age is a string

Received:

```json
"age": "28"
```

Expected:

```json
"age": 28
```

### Problem 2: active is a string

Received:

```json
"active": "false"
```

Expected:

```json
"active": false
```

### Problem 3: roles is an object

Received:

```json
"roles": {
  "name": "editor"
}
```

Expected:

```json
"roles": ["editor"]
```

The corrected payload becomes:

```json
{
  "user": {
    "age": 28,
    "active": false,
    "roles": ["editor"]
  }
}
```

All of the original values were readable to a person, and the original document was valid JSON. The problem was not syntax.

The problem was that the actual JSON types did not match the receiving contract.

This is why an error such as `invalid payload` cannot always be solved by changing commas or quotation marks.

## Reduce large payloads instead of changing everything at once

Large requests make debugging harder because many fields can fail independently.

Suppose this payload produces an error:

```json
{
  "customer": {
    "name": "Mina",
    "age": "28",
    "marketing": "false",
    "tags": null
  },
  "items": [
    {
      "id": 104,
      "quantity": "2"
    }
  ]
}
```

Instead of modifying several properties at once, start with the smallest request that the API documentation says should be valid.

For example:

```json
{
  "customer": {
    "name": "Mina"
  }
}
```

If that succeeds, add one field:

```json
{
  "customer": {
    "name": "Mina",
    "age": 28
  }
}
```

Test again.

Then add the next field.

Continue until the failure returns.

This method isolates the field or structure responsible for the problem and avoids introducing several new changes simultaneously.

A minimal reproducible payload is also easier to share in documentation, support tickets, and bug reports.

## Syntax errors still need to be eliminated first

Structural debugging becomes useful only after the input is valid JSON.

Several common formats look similar to JSON but are not valid standard JSON.

### Trailing commas

Invalid:

```json
{
  "name": "Ali",
}
```

### Single quotation marks

Invalid JSON:

```text
{'name': 'Ali'}
```

JSON strings and object property names use double quotation marks.

### JavaScript comments

Invalid JSON:

```text
{
  "name": "Ali" // user name
}
```

### Unquoted property names

Invalid JSON:

```text
{
  name: "Ali"
}
```

These forms may work in JavaScript source code or configuration formats that resemble JSON, but they are not standard JSON documents.

This is where a JSON validator is especially useful: first eliminate syntax problems, then investigate types and schema.

## Do not expose secrets while debugging

API requests often contain information that should never appear in screenshots, public issue trackers, shared documents, or examples pasted into third-party services.

Before sharing a payload, remove or replace:

- API keys
- access tokens
- bearer tokens
- passwords
- session identifiers
- authentication cookies
- private customer information
- personal email addresses
- internal URLs containing credentials
- database connection values

For example, instead of sharing:

```json
{
  "email": "real-customer@example.com",
  "token": "real-secret-token",
  "quantity": "5"
}
```

create a sanitized reproduction:

```json
{
  "email": "user@example.com",
  "token": "example-token",
  "quantity": "5"
}
```

The important structure remains visible without exposing real credentials or personal information.

## Build objects first instead of manually building JSON strings

Manually assembling JSON text creates unnecessary opportunities for quoting, escaping, and type errors.

For example:

```javascript
const body =
  '{"quantity":"' + quantity + '","active":"' + active + '"}';
```

This approach can easily turn values into strings.

Instead, construct a normal object first:

```javascript
const body = {
  quantity: Number(quantity),
  active: true
};

const json = JSON.stringify(body);
```

This does not automatically guarantee that the object matches an API schema, but it makes the intended types much easier to inspect.

The same principle applies in other programming languages:

**Build native data structures first, then serialize them using a JSON library.**

Avoid manually inserting quotation marks, commas, braces, and escape characters unless you have a specific reason to work with raw JSON text.

## Check what the receiver actually parsed

A payload may look correct before transmission and still change somewhere between its source and the receiving application.

A useful debugging approach is to inspect three stages:

```text
1. Source value
2. Serialized JSON
3. Parsed value at the receiving boundary
```

For example:

```text
Source quantity: number 5
Serialized JSON: {"quantity":5}
Received quantity: number 5
```

Everything remained consistent.

Now compare:

```text
Source quantity: string "5"
Serialized JSON: {"quantity":"5"}
Received quantity: string "5"
```

The serializer did nothing wrong.

The value was already a string before serialization.

This distinction prevents developers from blaming the JSON formatter, HTTP client, or API when the incorrect type originated earlier in the application.

## Use a five-layer JSON debugging check

When valid JSON behaves unexpectedly, inspect it in this order.

### 1. Syntax

Can a standard JSON parser read the document?

Check quotation marks, commas, braces, brackets, escape sequences, and other syntax.

### 2. Shape

Are objects, arrays, and nested properties positioned where the receiving system expects them?

Check the root object and every important nested level.

### 3. Names

Do property names exactly match the API contract?

Check spelling, capitalization, underscores, pluralization, and nesting.

### 4. Types

Does every important value have the expected JSON type?

Check:

- strings
- numbers
- booleans
- arrays
- objects
- null

### 5. Meaning

Does the receiving application interpret the value the way you intend?

An empty array, for example, may be syntactically valid and have the correct type while still meaning "remove all values" when you intended "leave this field unchanged."

The five layers can be remembered as:

**syntax → shape → names → types → meaning**

Following that order keeps syntax errors separate from schema and application-level problems.

## What a JSON formatter can and cannot tell you

The [Anvil Tools JSON Formatter](/tools/json-formatter.html), like other JSON formatters and validators, is useful for:

- detecting malformed JSON
- exposing nesting
- making arrays and objects easier to distinguish
- identifying some suspicious structures
- helping you inspect large payloads
- creating readable debugging examples

But it usually cannot determine:

- whether `5` should be `"5"`
- whether `null` means delete or ignore
- whether an omitted field is required
- whether an array should contain one or many items
- whether a property belongs at the root or inside another object
- whether an identifier should be represented as a string
- whether an API-specific value is semantically valid

Those questions belong to the API contract, schema, and receiving application.

Treat formatting as a diagnostic aid, not as proof that the request is correct.

## A reliable workflow for debugging rejected JSON

When you encounter a request that appears valid but fails, use this sequence:

1. Preserve the original payload.
2. Remove secrets and private information.
3. Validate the JSON syntax.
4. Pretty-print the payload.
5. Compare the top-level structure with the API documentation.
6. Inspect nested arrays and objects.
7. Verify exact property names.
8. Check each important value's type.
9. Compare missing fields, `null`, empty strings, and empty arrays.
10. Reduce the payload to the smallest valid example.
11. Add fields back one at a time.
12. Inspect the data immediately before serialization.
13. Inspect what the receiving application actually parsed.
14. Compare the final result with the documented schema.

This process is usually faster than repeatedly changing punctuation or guessing which value the API dislikes.

## The useful question is bigger than "Is this valid JSON?"

A successful parse proves that JSON syntax is readable.

It does not prove that the payload matches the receiving application's contract.

A reliable API request also requires the correct:

- hierarchy
- property names
- data types
- required fields
- optional-field behavior
- value representation
- application meaning

When a valid payload fails, debug it in five layers:

**syntax → shape → names → types → meaning**

Start with the smallest failing example, format it so the structure is visible, compare every important field with the API contract, and confirm what the receiver actually parsed.

That approach usually reveals the real problem much faster than repeatedly changing quotation marks, commas, or brackets.

## Further reading

For deeper technical reference, these primary and widely used documentation sources are useful:

- [RFC 8259: The JavaScript Object Notation (JSON) Data Interchange Format](https://www.rfc-editor.org/rfc/rfc8259)
- [MDN Web Docs: JSON.parse()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)
- [MDN Web Docs: JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)

Use standards documentation to confirm JSON behavior, and use the documentation for the specific API you are integrating with to confirm schema, required fields, accepted types, and application-specific rules.
