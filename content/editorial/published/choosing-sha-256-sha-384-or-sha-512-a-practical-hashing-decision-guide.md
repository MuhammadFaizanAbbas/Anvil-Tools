# Choosing SHA-256, SHA-384, or SHA-512: A Practical Hashing Decision Guide

When a tool offers SHA-256, SHA-384, and SHA-512, it is easy to assume that the choice is simple:

**larger number = stronger choice.**

That is not a useful rule.

The right choice depends first on what the hash is supposed to accomplish.

Are you checking whether content changed? Following an API specification? Verifying a downloaded file? Authenticating a message? Storing passwords? Creating a stable fingerprint for text?

Those tasks can all involve hashing, but they do not require the same construction.

The best way to choose is to start with the job and work backward to the algorithm or mechanism that actually provides the property you need.

## Start with the job, not the algorithm

Use this map before choosing a SHA variant.

| Your goal | What you actually need |
| --- | --- |
| Detect whether ordinary text changed | SHA-256 is usually sufficient |
| Create a reproducible content fingerprint | SHA-256 is a practical default |
| Follow a protocol requiring SHA-384 | Use SHA-384 exactly as specified |
| Follow a protocol requiring SHA-512 | Use SHA-512 exactly as specified |
| Verify a downloaded file | Hash the actual file bytes and compare with a trusted digest |
| Authenticate a message using a shared secret | HMAC or the protocol's required authentication mechanism |
| Store user passwords | A dedicated password-hashing scheme |
| Protect data that must later be recovered | Encryption, not hashing |
| Verify a digital signature | Use the required signature-verification process |
| Check whether two exact inputs are identical | Hash the same bytes on both sides |

The important idea is simple:

**A hash algorithm cannot provide a security property that the surrounding system was never designed to provide.**

## What a cryptographic hash actually gives you

A cryptographic hash function accepts input and produces a fixed-length result called a digest.

For example, the SHA-256 digest of:

```text
abc
```

is:

```text
ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
```

Change the input and the digest changes.

That makes hashes useful as fingerprints.

If two independently calculated digests match and both sides hashed the same bytes with the same algorithm, you have strong evidence that the compared data matched.

But a plain hash has an important limitation:

**it tells you about the data, not who created the data.**

That distinction is critical when we move from simple integrity checks to authentication.

## What changes between SHA-256, SHA-384, and SHA-512?

The most obvious difference is digest length.

| Algorithm | Digest size | Hexadecimal length |
| --- | ---: | ---: |
| SHA-256 | 256 bits | 64 characters |
| SHA-384 | 384 bits | 96 characters |
| SHA-512 | 512 bits | 128 characters |

A longer digest provides a larger output space, but that does not mean every application benefits from choosing the longest available output.

The digest bytes can also be represented in different formats.

For example:

```text
hexadecimal
Base64
```

Changing the representation does not change the hashing algorithm.

These are two separate questions:

```text
Which hash function generated the digest?
```

and:

```text
How are the resulting digest bytes displayed?
```

Do not confuse the representation with the algorithm.

## Rule one: if a specification chooses the algorithm, your decision is already made

Suppose an API says:

```text
Compute SHA-256 over the UTF-8 request body.
```

Do not replace it with SHA-512 simply because SHA-512 has a longer digest.

Your implementation would no longer follow the protocol.

Likewise, if a specification requires SHA-384, a SHA-256 digest of the same data is not interchangeable.

Interoperability depends on both systems performing the same operation.

When implementing:

- an API
- a webhook
- a standardized protocol
- a signature format
- a compatibility test
- a data-exchange specification

start with the documentation.

If the specification chooses SHA-256, SHA-384, or SHA-512, follow it exactly.

## If nothing specifies an algorithm, SHA-256 is a strong practical default

For ordinary content fingerprinting and integrity checks, SHA-256 is usually a sensible starting point.

It is widely supported, produces a compact 256-bit digest, and belongs to the SHA-2 family.

That does not make SHA-384 or SHA-512 poor choices.

It means that many everyday tasks do not gain a meaningful practical benefit merely by producing a longer visible fingerprint.

Suppose you want to detect whether this configuration changed:

```text
environment=production
region=eu-west
retries=3
```

SHA-256 already provides a strong fingerprint for that purpose.

Using SHA-512 may produce a longer value to store, copy, display, and compare without solving a different problem.

Choose a larger digest when the surrounding protocol, standard, application, or security design gives you a reason to do so.

## A longer digest does not repair a weak trust model

Imagine a website offers:

```text
application.zip
```

and directly below it:

```text
SHA-512: ...
```

A visitor downloads the file and compares its SHA-512 digest with the value shown on the same website.

That can help detect accidental corruption.

Now imagine an attacker can replace both the download and the displayed digest.

The attacker can simply publish the digest of the malicious replacement.

Moving from SHA-256 to SHA-512 does not solve that problem.

The missing property is not more digest bits.

The missing property is a trustworthy way to establish where the expected digest came from.

Depending on the system, that may involve:

- signed release metadata
- digital signatures
- trusted package repositories
- authenticated distribution channels
- another verification mechanism appropriate to the application

A strong primitive does not automatically create a strong trust model.

## Integrity and authenticity are different questions

Suppose Alice sends Bob:

```text
Transfer amount: 500
```

and also sends a SHA-256 digest of that message.

Bob hashes the message and obtains the same digest.

He now knows that the message matches the digest he received.

But if an attacker can replace both the message and the digest, the attacker could send:

```text
Transfer amount: 900
```

along with the valid SHA-256 digest of that altered message.

Everything still matches.

A plain hash does not prove that Alice created the message.

When systems need message authentication using a shared secret, they commonly use a keyed construction such as HMAC.

Conceptually:

```text
plain hash:
hash(message)

HMAC:
HMAC(secret key, message)
```

The key changes the security property.

If an API tells you to calculate an HMAC-SHA-256 signature, do not substitute:

```text
SHA-256(message)
```

or:

```text
SHA-256(secret + message)
```

Use the actual HMAC construction required by the protocol.

## SHA-256 and SHA-512 are not password-storage schemes

This is one of the most important boundaries in the entire topic.

General-purpose SHA functions are designed to be computed efficiently.

That is useful for ordinary hashing.

It is undesirable for password storage because password guessing should be deliberately expensive.

This:

```text
SHA-256(password)
```

is not an appropriate modern password-storage design.

Changing it to:

```text
SHA-512(password)
```

does not fix the underlying problem.

Password storage should use a purpose-built password-hashing or password-based key-derivation scheme designed to slow down large-scale guessing attempts.

Common examples include:

- Argon2id
- scrypt
- bcrypt in appropriate environments
- PBKDF2 where required by a platform or compliance requirement

These systems also use salts and configurable work factors or resource costs.

The lesson is not that SHA-256 is weak.

The lesson is:

**A strong algorithm used for the wrong job is still the wrong design.**

## Hashing is not encryption

Hashing and encryption solve different problems.

Encryption is designed around recoverability.

A simplified model is:

```text
plaintext
   ↓
encryption + key
   ↓
ciphertext
   ↓
decryption + key
   ↓
plaintext
```

Hashing works differently:

```text
input
   ↓
hash function
   ↓
fixed-length digest
```

There is no normal operation that "decrypts" a cryptographic hash back into the original input.

However, that does not mean a hash automatically hides predictable information safely.

If an input comes from a small or guessable set, an attacker can calculate hashes of possible values and compare them.

For example, hashing a six-digit PIN does not make that PIN safe to publish.

The digest may be one-way.

The original value may still be easy to guess.

## Exact input still matters

Whichever SHA-2 variant you choose, two systems can produce matching digests only when they hash the same byte sequence.

Differences in text encoding, capitalization, whitespace, line endings, Unicode representation, or normalization can therefore change the result even when two values look similar on screen.

The Anvil Tools Hash Generator converts entered text to UTF-8 before hashing it.

If you are comparing its result with another system, confirm that the other system uses:

- the same original input
- the same byte encoding
- the same normalization rules
- the same SHA variant
- the same digest representation

For detailed browser-tested examples involving spaces, Unicode, CRLF normalization, and visually identical text, see **Why SHA-256 Hashes Differ for Identical-Looking Text**.

That separate guide covers the byte-level mismatch problem in depth so this article can remain focused on choosing the correct hashing approach.

## Text hashing and file hashing are different operations

The Anvil Tools Hash Generator hashes UTF-8 text.

That means entering:

```text
report.pdf
```

calculates the digest of the characters:

```text
r e p o r t . p d f
```

It does **not** calculate the checksum of the actual PDF file.

If a software publisher gives you a checksum for:

```text
installer.exe
```

you need a tool that reads the bytes of `installer.exe` itself.

A text hash generator and a file checksum tool solve related but different tasks.

Always verify what the tool is actually hashing.

## Hex and Base64 can represent the same digest

Suppose one system shows a SHA-256 digest as hexadecimal while another system shows Base64.

The strings will look different.

That does not necessarily mean the underlying digest is different.

Conceptually:

```text
input
  ↓
SHA-256
  ↓
32 digest bytes
  ↙        ↘
hex       Base64
```

Before assuming two systems disagree, check:

1. Did they hash the same input?
2. Did they use the same encoding?
3. Did they use the same algorithm?
4. Are they displaying the digest using the same representation?

Comparing a hexadecimal digest directly with a Base64 digest string is not a meaningful equality test.

## Compare the complete digest

Long hexadecimal strings are awkward to inspect visually.

That makes it tempting to compare only the beginning:

```text
ba7816bf
```

instead of the complete SHA-256 value.

A short prefix can be useful for casual identification.

For an actual integrity check, compare the full digest unless the protocol explicitly defines a particular truncation rule.

If the complete value matters, let software compare it rather than relying on manual visual inspection.

## Matching hashes compare representation, not meaning

Hash functions operate on data representation.

They do not understand semantic equivalence.

Consider:

```json
{"enabled":true,"count":5}
```

and:

```json
{
  "enabled": true,
  "count": 5
}
```

An application may interpret both JSON documents as equivalent data.

Their raw text is different.

Therefore, hashing the raw text produces different digests.

If your application needs to hash the *meaning* of structured data rather than its original representation, it may need a formally defined canonicalization or normalization process first.

That process must be deliberate.

Once you normalize the input, you are no longer hashing the original representation.

You are hashing the normalized representation.

That may be exactly what a protocol requires, but it should never happen accidentally.

## SHA-384 and SHA-512 are useful when the system calls for them

SHA-384 and SHA-512 are standardized members of the SHA-2 family.

Good reasons to use them include:

- a protocol explicitly requires one
- an existing system already uses one
- compatibility with another implementation matters
- a cryptographic construction specifies a particular digest size
- an organizational or technical standard requires it
- you are testing software that must support those variants

A weak reason is:

> 512 is bigger than 256, so I should replace SHA-256 everywhere.

Cryptographic choices are part of larger systems.

Changing one piece independently may break compatibility without solving a meaningful problem.

## Performance should be measured, not assumed

Do not assume that digest length maps directly to real-world performance.

Actual speed can depend on:

- processor architecture
- hardware acceleration
- implementation
- runtime environment
- input size
- browser APIs
- server libraries

For short text entered into a browser utility, the difference will usually be irrelevant compared with the human time spent entering and reviewing the input.

For high-volume server workloads, benchmark the actual implementation on the hardware where it will run.

Do not choose a cryptographic primitive because of an unrelated benchmark from another environment.

## A practical decision tree

When you are unsure what to use, ask these questions in order.

### 1. Does a protocol specify the algorithm?

**Yes:** use that algorithm exactly as required.

**No:** continue.

### 2. Are you only checking whether ordinary data changed?

**Yes:** SHA-256 is usually a sensible general-purpose choice.

**No:** continue.

### 3. Do you need authenticated message integrity using a shared secret?

**Yes:** use the HMAC construction or authentication mechanism required by the protocol.

**No:** continue.

### 4. Are you storing user passwords?

**Yes:** use a dedicated password-hashing scheme such as Argon2id, scrypt, bcrypt where appropriate, or PBKDF2 when required.

**No:** continue.

### 5. Do you need to recover the original information later?

**Yes:** you need encryption or another reversible protection mechanism, not a hash.

**No:** continue.

### 6. Are you verifying a file?

Hash the actual file bytes using a file-capable checksum tool and compare the result with a digest obtained from a source you trust.

Do not hash the filename or copied visible text from the file.

## Before comparing two digests

If hashes unexpectedly disagree, verify these items before changing algorithms.

| Check | Question |
| --- | --- |
| Input | Is the exact original data identical? |
| Scope | Did both sides hash the same thing? |
| Encoding | Was text converted to bytes in the same way? |
| Normalization | Was either side transformed before hashing? |
| Algorithm | Are both sides using the same SHA variant? |
| Representation | Are you comparing hex with hex or Base64 with Base64? |
| Source | Is the expected digest coming from a trusted place? |

Switching from SHA-256 to SHA-512 will not correct a mismatch caused by different inputs.

## Choosing among the three algorithms

For a simple practical summary:

### Choose SHA-256 when:

- you need a general-purpose content fingerprint
- you are checking ordinary text integrity
- no protocol requires another SHA-2 variant
- you want broad compatibility and compact output

### Choose SHA-384 when:

- the specification requires SHA-384
- an existing system or cryptographic construction already uses it
- compatibility with that system matters

### Choose SHA-512 when:

- the specification requires SHA-512
- the surrounding system is designed around SHA-512
- interoperability or organizational requirements call for it

Do not choose SHA-512 merely because the number is larger.

The surrounding system matters more than the visual length of the digest.

## Using the Anvil Tools Hash Generator

For a straightforward text-integrity check:

1. Keep the exact source text.
2. Open the Hash Generator.
3. Select SHA-256 unless your test or protocol requires another supported algorithm.
4. Paste the text exactly as intended.
5. Generate the digest.
6. Note whether you are using hexadecimal or Base64.
7. Repeat with the comparison input.
8. Compare the complete digest values.

For a reproducible test, enter:

```text
abc
```

with SHA-256.

The hexadecimal result should be:

```text
ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
```

The Anvil Tools Hash Generator is appropriate for:

- UTF-8 text fingerprints
- comparing exact text inputs
- generating SHA-256 values
- generating SHA-384 values
- generating SHA-512 values
- viewing digest output in supported representations

It is not intended to replace:

- password-hashing systems
- HMAC implementations
- encryption
- digital-signature verification
- file-checksum utilities
- protocol-specific authentication code

Knowing those boundaries is part of choosing the correct tool.

## The shortest useful rule

Choosing between SHA-256, SHA-384, and SHA-512 becomes much easier when you stop asking:

**Which number is strongest?**

and instead ask:

**What property does this system need?**

If a specification chooses the algorithm, follow the specification.

If you need a general fingerprint for ordinary content, SHA-256 is a strong practical default.

If you need message authentication, use the required HMAC or signature mechanism.

If you need password protection, use a dedicated password-hashing scheme.

If you need reversible confidentiality, use encryption.

If you need to verify a file, hash the actual file bytes.

And if two expected hashes do not match, investigate the exact input and surrounding process before assuming the algorithm is the problem.

The digest length is only one part of the system.

Choosing the right mechanism for the job matters more.

## Try it yourself

Want to generate and compare SHA-256, SHA-384, or SHA-512 digests from UTF-8 text?

Try the [Anvil Tools Hash Generator](/tools/hash-generator.html).

## Further reading

For authoritative technical reference:

- [NIST Secure Hash Standard — FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/final)
- [NIST Policy on Hash Functions](https://csrc.nist.gov/projects/hash-functions/nist-policy-on-hash-functions)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [RFC 2104 — HMAC: Keyed-Hashing for Message Authentication](https://www.rfc-editor.org/rfc/rfc2104)
