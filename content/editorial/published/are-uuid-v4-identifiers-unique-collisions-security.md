# Are UUIDs Really Unique? Version 4 Collisions, Security, and Database IDs

Imagine two independent applications creating records that will eventually be imported into the same database.

Neither application can contact the other. There is no shared sequence counter, and record IDs must be created before the data reaches the central server.

Application A creates an identifier.

Application B creates another.

How can the two systems avoid assigning the same identifier to different records?

One widely used solution is the universally unique identifier, or UUID.

A UUID can be generated independently without asking a central service for the next available number.

But that convenience raises three questions:

**Can two UUIDs ever be identical?**

**Does a random UUID make a record secure?**

**And should every database use UUIDs instead of sequential IDs?**

The answers depend on how the identifiers are generated, stored, and used.

## Why UUIDs exist

A traditional database often uses incrementing identifiers.

For example, records might be assigned IDs such as 1001, 1002, and 1003.

That works well when one database manages the sequence.

The challenge appears when multiple independent systems need to create identifiers without coordinating every new record.

Imagine an inventory application used in warehouses that sometimes work offline.

A warehouse can create hundreds of new stock records while disconnected.

When connectivity returns, those records need to be synchronized with the central database.

If every warehouse independently starts counting from 1001, duplicate identifiers are likely.

UUIDs provide another approach.

Each location can generate identifiers from a much larger space without depending on one shared sequence.

Correctly implemented UUID generation makes accidental collisions extraordinarily unlikely.

This property is useful for distributed applications, synchronization, data imports, test fixtures, and many other workflows.

However, avoiding most coordination during generation does not eliminate the need for data-integrity rules when records are finally stored.

## What a UUID actually looks like

A UUID is a 128-bit identifier.

Its familiar textual representation consists of 32 hexadecimal digits arranged into five groups, separated by four hyphens.

An example is:

`550e8400-e29b-41d4-a716-446655440000`

This is a public example identifier, not a newly generated value or a secret.

The familiar arrangement is:

| Group | Hexadecimal digits |
|---|---:|
| First | 8 |
| Second | 4 |
| Third | 4 |
| Fourth | 4 |
| Fifth | 12 |

The complete text representation contains 36 characters including hyphens.

Hexadecimal digits use the symbols 0–9 and a–f, with letter case being irrelevant to the underlying value.

The UUID's 128-bit size refers to its binary representation, not the number of characters displayed.

This distinction matters when choosing database storage types or validating identifiers received from an API.

## What makes a UUID version 4?

Not every UUID is created using the same algorithm.

UUID version 4, usually written UUIDv4, is based on random or pseudorandom values.

Under RFC 9562, UUIDv4 contains 122 bits available for randomness.

The other six bits are reserved for identifying its version and variant.

That is why a version 4 UUID does not contain 128 independently random bits, even though the complete identifier occupies 128 bits.

In the familiar text representation, two visible details help identify the format.

**Version marker:** The first hexadecimal digit in the third group is `4`.

**Variant marker:** The first hexadecimal digit in the fourth group is `8`, `9`, `a`, or `b`.

Our example identifier meets these structural conditions.

But passing a format check does not prove that the value was generated securely.

Someone could manually type a UUID-shaped string that has the correct version and variant markers.

It would look valid while providing no evidence about its origin or randomness.

**Format validation establishes structure, not authenticity or uniqueness.**

## RFC 4122 versus RFC 9562

Many generators and older technical tutorials describe UUIDv4 as an RFC 4122 identifier.

That description reflects the long-established UUID format.

However, RFC 4122 is no longer the current primary UUID specification.

In May 2024, the Internet Engineering Task Force published RFC 9562, superseding RFC 4122.

The updated standard retains UUIDv4 and defines additional versions, including the time-ordered UUIDv7.

For ordinary UUIDv4 generation, the familiar hexadecimal representation, version marker, and variant marker remain relevant.

This means a tool labeled "RFC 4122 version 4" can still produce UUIDs compatible with the version 4 format described by the current standard.

The important point is to distinguish an older standards reference from an incompatible identifier.

They are not the same thing.

## Can two version 4 UUIDs collide?

Yes.

A collision occurs when two independently generated identifiers have exactly the same value.

UUIDv4 has an enormous space of possible random values, but that space is finite.

Therefore, accidental collisions are possible in principle.

For uniformly distributed, independently generated UUIDv4 values, there are 2^122 possible random combinations.

That is approximately 5.3 undecillion possibilities.

To estimate the probability that at least two generated UUIDs match, we can use the same reasoning associated with the birthday problem.

For a sufficiently small collision probability, the approximation is:

**Collision probability ≈ n × (n − 1) ÷ (2 × 2^122)**

Here, `n` represents the number of independently generated UUIDs.

The approximation assumes a correctly implemented generator producing uniformly distributed, independent values.

It should not be applied blindly to a broken random-number generator.

### What does that mean for large projects?

| UUIDs generated | Approximate probability of at least one collision |
|---|---|
| 1,000 | About 9.4 × 10⁻³² |
| 1,000,000 | About 9.4 × 10⁻²⁶ |
| 1,000,000,000 | About 9.4 × 10⁻²⁰ |

These are theoretical estimates under the stated assumptions, not the results of generating and testing those quantities of UUIDs.

The probabilities are extremely small.

For most ordinary applications, accidental collisions from correctly generated UUIDv4 values are not a significant day-to-day concern.

But extremely unlikely is not the same as mathematically impossible.

Nor does it guarantee that a particular software implementation is correctly generating randomness.

## The more realistic duplicate-ID problem

Consider an application importing inventory records from several warehouses.

The developer expects that every record ID is unique because UUIDs are being used.

But the import pipeline contains an unrelated error.

One data file is accidentally submitted twice.

Or a retry operation reuses an identifier from an earlier attempt.

Or the application copies an existing record but retains its original UUID.

These scenarios can produce duplicate identifiers without requiring a random UUID collision.

The problem is application logic, not a failure of the birthday-problem calculation.

This distinction is important because practical systems must protect against both categories of error.

A database should not assume that every incoming UUID is newly generated or belongs to a new record.

It should enforce the actual uniqueness requirements of the data.

## Why the database still needs a unique constraint

Suppose every inventory record has a UUID called `record_id`.

That field identifies one specific record.

The database should enforce a unique constraint or primary key on the identifier when the application's data model requires one ID per record.

That prevents two records from silently receiving the same key.

If an insert conflicts with an existing ID, the application should handle the conflict according to the operation.

For a genuine new-record creation, generating a fresh identifier and retrying may be appropriate.

For an import or synchronization operation, the same identifier may mean the system is receiving the same record again.

In that case, creating a new identifier automatically could accidentally duplicate business data.

The application may instead need to detect an existing record and apply its documented update or deduplication policy.

**An identifier collision and a repeated business operation are not necessarily the same event.**

A reliable database design accounts for both.

## Unique IDs do not make operations idempotent

An important synchronization concept is *idempotency*.

An idempotent operation can be repeated without causing additional unintended effects after the first successful application.

For example, suppose a warehouse submits a new record and the network connection drops before the confirmation arrives.

The application retries the request.

If the retry generates a completely new UUID and creates another record, the same business action may be processed twice.

Both UUIDs are unique.

The business operation is nevertheless duplicated.

One solution is to use a stable operation identifier for retries of the same logical request, combined with appropriate server-side handling.

That identifier may itself be a UUID.

But generating it correctly is only part of the solution.

The server must recognize repeated operations and apply the intended behavior.

A system can have perfect identifier uniqueness and still create duplicate orders, invoices, or inventory records.

Uniqueness and idempotency solve different problems.

## A UUID is not an access-control system

Now imagine a private document stored at an address containing a UUID.

The link looks difficult to guess.

Does that mean only authorized people can access the document?

Not necessarily.

A UUID identifies the resource. It does not inherently establish who may read, modify, download, or delete it.

An attacker might obtain another person's UUID through a leaked link, a shared message, an application response, or an unrelated disclosure.

If the application retrieves the document without checking permission, the unpredictable ID does not prevent unauthorized access once the identifier is known.

This is related to an access-control vulnerability commonly called an insecure direct object reference, or IDOR.

OWASP recommends checking authorization at the object level rather than relying on complicated identifiers alone.

For private records, a safer model is:

**Request identifies the document → server authenticates the requester → server checks permission for that document → server returns or denies access.**

A random identifier can make mass enumeration more difficult, but it does not replace those checks.

Some systems intentionally use capability-style links that grant access to anyone possessing a sufficiently strong secret URL.

That is a separate security design requiring careful treatment of link disclosure, expiry, revocation, and permitted actions.

Simply putting a UUID in a URL does not automatically create a complete capability-security system.

## Should UUIDv4 replace every sequential database ID?

Not always.

A sequential integer can be a reasonable choice when records are created centrally and the database already manages uniqueness.

UUIDv4 offers advantages when identifiers need to be created independently across applications, services, or disconnected devices.

But it also has trade-offs.

| Question | Sequential ID | UUIDv4 |
|---|---|---|
| Simple to read aloud or enter manually | Usually | Less convenient |
| Easy to create across independent systems without coordination | Usually requires additional design | Yes, with correct generation |
| Reveals an obvious creation sequence | Often | Not inherently |
| Naturally ordered by creation time | Often within one sequence | No |
| Standard binary size | Depends on integer type | 128 bits |
| Needs database uniqueness enforcement | Yes | Yes |

UUIDv4 is particularly useful when global coordination would otherwise complicate the application.

Sequential IDs remain useful when simplicity, compact storage, or ordered insertion is more important.

Some systems also use both.

For example, a database may maintain an internal sequential key while exposing a separate UUID for external integrations.

There is no universal requirement to choose only one identifier type throughout an entire application.

## Why UUIDv4 can affect database indexing

Version 4 UUIDs are random.

Their values do not naturally increase in the order they are created.

In a database index organized by key order, new random values may be inserted into many different positions.

Depending on the database engine, index type, workload, and storage configuration, this can affect page locality and index maintenance compared with monotonically increasing keys.

The magnitude of the effect is workload-specific.

It should be measured rather than assumed.

Also consider storage representation.

A UUID is a 128-bit value, but its standard textual representation uses 36 characters.

Databases with a native UUID type can represent it more compactly than storing its textual form in a general-purpose string column.

For example, PostgreSQL supports a native `uuid` type.

Using that type is generally preferable to storing UUID text without a specific reason.

The database should also use appropriate indexes and enforce the application's uniqueness requirements.

## When a time-ordered UUID may be better

UUIDv4 is not the only modern UUID option.

RFC 9562 also defines UUIDv7.

Version 7 includes a timestamp component derived from Unix time, together with additional fields used for uniqueness.

This makes UUIDv7 values broadly time-ordered by design.

For systems where insertion order and database index locality matter, UUIDv7 may offer advantages.

However, it is not simply a better version of UUIDv4 in every situation.

UUIDv4 does not encode a creation timestamp into the identifier.

UUIDv7 does.

That can affect privacy and information-disclosure considerations when IDs are exposed publicly.

The choice should reflect the application's requirements for randomness, ordering, interoperability, and information exposure.

The Anvil Tools UUID Generator specifically creates **version 4** identifiers. It does not advertise UUIDv7 generation.

If your production system requires UUIDv7, use a library or runtime that explicitly supports that version.

## When you should reuse an ID instead of generating another

Generating a fresh UUID is appropriate when creating a genuinely new entity or distinct operation that requires a new identity.

It is not always appropriate when the same logical item returns.

Consider three situations.

**Creating a new product record:** A fresh identifier may be appropriate.

**Updating an existing product:** Keep the record's existing identifier.

**Retrying the same inventory-import operation:** Reuse the established operation identity if that is how your idempotency design works.

Changing the identifier every time data is edited makes record tracking unnecessarily difficult.

It may also break references from other tables, documents, or services.

A UUID is intended to identify something.

Once assigned, its lifetime should follow the identity rules of that thing.

## A practical UUIDv4 verification exercise

You can explore UUIDv4 structure without setting up a database.

Open the Anvil Tools UUID Generator.

Choose a batch of five UUIDs.

Generate the values.

Then inspect each output.

A valid version 4 UUID in the familiar representation should have five hexadecimal groups.

The first character of its third group should be `4`.

The first character of its fourth group should be one of `8`, `9`, `a`, or `b`.

The remaining characters should follow the expected hexadecimal format.

You can copy the batch or download it as a text file.

These checks help demonstrate UUIDv4 structure.

However, inspecting five outputs cannot prove the generator's complete randomness quality or measure its real-world collision rate.

Even a much larger sample showing no duplicates would not establish an absolute uniqueness guarantee.

A valid-looking UUID can still be reused, copied, or generated by a defective implementation.

The exercise is a format inspection, not a certification of cryptographic quality.

## What the Anvil Tools UUID Generator does

The [Anvil Tools UUID Generator](/tools/uuid-generator.html) produces UUID version 4 values using browser cryptographic randomness.

According to its published implementation description, it uses `crypto.randomUUID()` where available and a `crypto.getRandomValues()` fallback with the appropriate version and variant bits.

The tool allows users to generate between 1 and 100 identifiers in a batch.

It also provides controls to copy the values or download them as a plain-text file.

That makes it convenient for tasks such as:

- Creating synthetic identifiers for a demonstration.
- Preparing development and test fixtures.
- Generating sample correlation IDs.
- Exploring the UUIDv4 format.
- Creating identifiers for a small, permitted testing workflow.

The tool does not connect to your database, check whether an ID already exists there, or create authorization rules.

It also does not register generated values in a central uniqueness service.

For production applications, generating identifiers inside the application runtime and enforcing the appropriate database constraints is usually more reliable than manually pasting IDs from a website.

Browser-based generation is a convenience, not a substitute for a complete data-integrity design.

## A decision checklist for application developers

Before choosing UUIDv4 for a new system, answer these questions.

| Question | Why it matters |
|---|---|
| Must IDs be created by multiple independent systems? | Favors decentralized generation |
| Must records sort by creation time? | May favor a time-ordered identifier |
| Will the IDs appear in public URLs? | Requires careful information-disclosure and access-control review |
| Does the database support a native UUID type? | Can simplify storage and indexing |
| Are duplicate requests possible? | Requires a separate idempotency strategy |
| Is the identifier stable for the lifetime of the record? | Prevents unnecessary identity changes |
| Is collision handling implemented? | Protects data integrity even when collisions are extremely unlikely |

This checklist avoids treating the choice as a contest between "random" and "sequential."

The best identifier is the one that fits the system's coordination, ordering, security, and storage requirements.

## The important conclusion

UUIDv4 offers a practical way to create identifiers without central coordination.

It uses 122 bits of randomness within a standardized 128-bit format.

When generated correctly, accidental collisions are extraordinarily unlikely.

But three things remain true.

**A low collision probability is not an absolute guarantee.**

**An unpredictable record ID is not proof of authorization.**

**A unique identifier does not prevent a business operation from being processed twice.**

Applications still need database constraints, appropriate object-level permissions, and reliable retry behavior.

Use UUIDv4 when independent random identifiers solve a real design problem.

Use a different identifier scheme when ordering, storage efficiency, or other requirements matter more.

And regardless of which identifier you choose, enforce the rules that make the data correct and the application secure.

## Try the relevant generator

Need a batch of random version 4 UUIDs for development, testing, or example records?

Use the [Anvil Tools UUID Generator](/tools/uuid-generator.html).

Generate up to 100 identifiers, copy them, or download a text list. Remember that generated values are identifiers, not passwords, database uniqueness guarantees, or authorization credentials.

## Further reading

- [IETF RFC 9562 — Universally Unique IDentifiers](https://www.rfc-editor.org/rfc/rfc9562.html)
- [MDN — Crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)
- [OWASP — Insecure Direct Object Reference Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)
- [PostgreSQL — UUID Data Type](https://www.postgresql.org/docs/current/datatype-uuid.html)
- [PostgreSQL — UUID Generation Functions](https://www.postgresql.org/docs/current/functions-uuid.html)
