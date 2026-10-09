# SPF, DKIM, and DMARC Explained: Why an Authenticated Email Can Still Fail

An email leaves your application successfully.

The sending service reports that it accepted the message. Your domain has an SPF record, DKIM signing is enabled, and you have published a DMARC policy.

Yet the recipient's system reports an authentication failure.

How can that happen?

The answer is that **SPF, DKIM, and DMARC do not all verify the same identity**.

An email can pass SPF and DKIM individually while still failing DMARC. Even when all three pass, the message is not guaranteed to reach the inbox.

To understand why, we will examine three illustrative messages sent from the same fictional business domain. Each produces a different authentication outcome, and each reveals something that ordinary inbox testing cannot establish.

## The three questions email authentication answers

Before examining the examples, separate the jobs of the three mechanisms.

| Mechanism | Main question | What it checks |
|---|---|---|
| SPF | Is this server authorized to send using the relevant SMTP domain? | Sending IP address against a domain's published authorization policy |
| DKIM | Does a cryptographic signature verify for the signing domain? | Selected signed message headers and body content, using a public key in DNS |
| DMARC | Does a passing SPF or DKIM identity align with the visible sender domain? | Authentication results, domain alignment, and the domain owner's published policy |

These mechanisms work together, but none is a complete substitute for the others.

SPF focuses on authorized sending infrastructure.

DKIM provides domain-associated cryptographic message authentication.

DMARC connects authentication to the domain readers see in the message's From address.

That final connection is especially important because email systems can use different domains for different purposes.

## The sender address is not the only identity in an email

Imagine receiving a promotional message from:

**From:** `offers@example.com`

That is the visible sender address.

However, the system delivering the message may use a separate address for delivery errors.

For example:

**Envelope sender:** `bounce@mailer.example.net`

The message may also include a DKIM signature made on behalf of:

**DKIM signing domain:** `mailer.example.net`

These addresses are illustrative. The example domains are used only to explain the authentication mechanism.

The receiving server therefore sees several identities associated with the same message.

The visible From domain is `example.com`.

The envelope-sender domain is `mailer.example.net`.

The DKIM signing domain is also `mailer.example.net`.

Those differences are not automatically suspicious. Organizations commonly use third-party services to send newsletters, receipts, and notifications.

But they become important when the receiving system evaluates DMARC.

## Message 1: SPF passes, DKIM passes, but DMARC fails

Our first fictional message uses these identities:

| Property | Value |
|---|---|
| Visible From | `offers@example.com` |
| Envelope sender domain | `mailer.example.net` |
| DKIM signing domain | `mailer.example.net` |
| SPF result | Pass |
| DKIM result | Pass |
| DMARC result | Fail |

At first, this seems contradictory.

Two checks pass, but the third fails.

The explanation is **domain alignment**.

SPF has established that the sending server was authorized for the envelope-sender domain, `mailer.example.net`.

DKIM has established that a signature associated with `mailer.example.net` verified.

Neither successful result is aligned with the visible From domain, `example.com`.

As a result, neither mechanism supplies an aligned pass for DMARC.

This is a simplified illustrative outcome, assuming the shown identities and ordinary alignment rules. It is not a report from an actual email server.

The crucial lesson is that a successful authentication result belongs to a particular identity.

It does not automatically authenticate every domain appearing in the message.

## What SPF really checks

SPF stands for Sender Policy Framework.

It allows a domain owner to publish which sending systems are authorized to use that domain in the relevant SMTP identities.

During message delivery, the receiving server can evaluate the connecting IP address against the applicable SPF policy.

For ordinary messages, SPF commonly evaluates the SMTP envelope-sender domain.

That domain is not necessarily the same as the address shown to the recipient.

SPF also has special handling for the SMTP HELO/EHLO identity and messages with an empty reverse path.

This matters because many people assume SPF simply verifies the From address displayed in the email application.

It does not work that way.

A message can pass SPF for a legitimate third-party mailing domain while displaying a different organizational domain in From.

Whether that SPF result helps satisfy DMARC depends on alignment.

### What an SPF pass does not prove

An SPF pass does not independently prove that:

- The visible From domain is authenticated.
- The message body is harmless.
- The sender's business claims are truthful.
- The recipient consented to receive the message.
- The email will reach the inbox.

It establishes a narrower result: the sending infrastructure is authorized for the domain evaluated by SPF.

That result is useful, but its meaning should not be exaggerated.

## What DKIM adds

DKIM stands for DomainKeys Identified Mail.

It uses cryptographic signatures to associate a message with a signing domain.

A sending system signs selected message headers and the message body according to the DKIM specification.

The recipient can retrieve the appropriate public key through DNS and verify the signature.

A valid signature helps establish that the signed content has not been altered in a way that breaks the verification process.

The signing domain is identified by the DKIM `d=` tag.

For example, a signature may identify `mailer.example.net` as its signing domain.

The key distinction is that **a valid DKIM signature authenticates its signing domain, not automatically the visible From domain**.

A third-party provider can sign outgoing messages with its own domain.

That signature may verify correctly, but it will not necessarily satisfy DMARC for the business's visible From domain.

### What a DKIM pass does not prove

A valid DKIM signature does not by itself prove that the message is wanted, truthful, or safe.

Malicious senders can authenticate email from domains they control.

Likewise, a business can correctly sign a message that contains a broken link or an incorrect invoice amount.

DKIM is a message-authentication mechanism, not a general content-quality or fraud-detection certificate.

## Message 2: one aligned DKIM signature changes the result

Now consider a second illustrative message.

It still displays:

**From:** `offers@example.com`

The mailing provider still uses its own envelope-sender domain:

**Envelope sender:** `bounce@mailer.example.net`

But this time, the provider has been configured to sign the message using the business's domain:

**DKIM signing domain:** `example.com`

The results are:

| Check | Result |
|---|---|
| SPF for `mailer.example.net` | Pass |
| DKIM for `example.com` | Pass |
| SPF aligned with From | No |
| DKIM aligned with From | Yes |
| DMARC | Pass |

The DMARC outcome changes because the passing DKIM identity aligns with the visible From domain.

Notice what did not change.

The sending provider can still use its own infrastructure.

The SPF-validated envelope domain can still be different.

A passing, aligned DKIM signature is sufficient for DMARC authentication in this simplified case.

This is why third-party email services often provide instructions for configuring custom-domain DKIM signing.

The objective is not merely to produce a valid signature.

The signature also needs to use an appropriate domain for the intended From identity.

## Message 3: SPF can provide the aligned pass

DKIM is not the only way to satisfy DMARC alignment.

Consider a third message:

| Property | Value |
|---|---|
| Visible From domain | `example.com` |
| Envelope sender domain | `example.com` |
| SPF result | Pass |
| DKIM result | No passing signature available |
| DMARC result | Pass through SPF alignment |

In this case, SPF passes for the same domain used in the visible From address.

That supplies the aligned authentication result.

DMARC does not universally require both SPF and DKIM to pass on the same message.

A passing result from either mechanism can satisfy DMARC when the appropriate alignment requirement is met.

However, some mailbox providers impose additional sender requirements.

For example, Google's Gmail sender guidelines require SPF and DKIM configuration for qualifying bulk senders and specify domain-alignment expectations.

Passing the basic DMARC evaluation is therefore not a substitute for following the requirements of a particular receiving service.

## Relaxed alignment versus strict alignment

Alignment does not always require two domain names to be character-for-character identical.

Consider a message with:

**Visible From:** `updates@example.com`

**SPF-authenticated domain:** `bounce.example.com`

Under relaxed SPF alignment, these domains can align because they share the same organizational domain.

Under strict SPF alignment, the domains must match exactly.

This difference gives organizations flexibility when using subdomains for transactional mail, newsletters, and delivery-error handling.

However, relaxed alignment is not a rule that every vaguely similar domain automatically passes.

The relationship is determined using the DMARC specification's organizational-domain rules.

For instance, `example.com` and `example.net` are different domains.

A similarity in names is not sufficient.

The current DMARC standard, RFC 9989, also updates how policy discovery and organizational domains are determined, replacing the older specification's approach in important respects.

When investigating complex subdomain arrangements, use the current standard and the receiving system's actual authentication results.

## Why older DMARC guides can be misleading

DMARC documentation has changed over time.

The original widely referenced specification was RFC 7489, published in 2015.

In May 2026, the IETF published RFC 9989, which superseded RFC 7489 and updated the DMARC specification.

The essential purpose remains recognizable: connect authenticated domain identities to the visible From domain and communicate the domain owner's handling preferences.

However, some technical details changed.

The newer specification revises policy discovery and organizational-domain determination.

It also introduces or clarifies record tags and removes certain older ones, including the previous `pct` policy-percentage tag.

This matters when following a tutorial found through a search engine.

A configuration example written for the older specification may not accurately represent the current standard.

For production domain configuration, use documentation maintained by your email provider alongside the current RFC.

Avoid blindly copying DNS records from outdated examples.

## DMARC policies: none, quarantine, and reject

DMARC allows domain owners to express preferences for how receivers should treat messages that fail DMARC validation.

The three familiar policy values are:

| Policy | Meaning |
|---|---|
| `p=none` | The domain owner expresses no special handling preference based on the DMARC failure |
| `p=quarantine` | The domain owner considers failing mail suspicious |
| `p=reject` | The domain owner considers failing mail's use of the domain invalid |

The receiving system ultimately applies its own processing and policy decisions.

A published `p=reject` does not give the sender direct control over every recipient's mail server.

Likewise, `p=none` does not mean that all messages will be accepted or placed in an inbox.

A receiver can reject, filter, or classify mail for other reasons.

It is therefore misleading to describe `p=none` as an instruction to deliver everything.

A domain owner should introduce stronger enforcement based on an understanding of legitimate sending systems and the applicable provider configuration.

## Why an email can pass DMARC and still reach spam

Suppose the third message passes DMARC.

The email may still arrive in spam.

There is no contradiction.

Authentication answers questions about domain identity and message verification.

Spam filtering evaluates additional signals.

Depending on the receiving system, those may include sending reputation, unwanted-message reports, message characteristics, historical behavior, and recipient-specific preferences.

For example, a business might authenticate its promotional email correctly but send it to people who did not request it.

The resulting complaints can affect deliverability.

Similarly, an authenticated message containing deceptive content does not become trustworthy just because its DKIM signature verifies.

**Authentication is necessary for many reliable sending workflows, but it is not a promise of inbox placement.**

Google's email sender guidance explicitly combines authentication requirements with infrastructure, reputation, and sending-practice requirements.

Those are distinct responsibilities.

## How to inspect the actual authentication result

The most useful evidence often appears in the delivered message's technical headers.

Mail systems can add an `Authentication-Results` header reporting evaluated authentication outcomes.

A simplified illustrative result might contain:

| Field | Illustrative value |
|---|---|
| SPF | `spf=pass` |
| SPF identity | `smtp.mailfrom=mailer.example.net` |
| DKIM | `dkim=pass` |
| DKIM identity | `header.d=mailer.example.net` |
| DMARC | `dmarc=fail` |
| Visible From identity | `header.from=example.com` |

This represents the first scenario.

The individual authentication methods pass, but neither successful domain aligns with the visible From domain.

Real headers contain additional syntax and details. The table is not a verbatim header captured from a real message.

### Read the full result, not only the word "pass"

Seeing `spf=pass` is useful.

But you also need to know which domain was evaluated.

Seeing `dkim=pass` is useful.

But you also need to inspect the signing domain.

Seeing `dmarc=fail` tells you the combined domain-alignment check did not succeed.

Taken together, these fields help determine whether the problem is authorization, signature verification, or alignment.

### Be careful about trusting arbitrary headers

Technical headers can include information from multiple systems.

Not every header appearing in a message is necessarily trustworthy.

An attacker may place misleading text in an untrusted portion of a message.

For authentication decisions, rely on the results added by the receiving infrastructure you trust, rather than treating any copied `Authentication-Results` line as authoritative.

RFC 8601 describes the authentication-results header and its trust considerations.

## Checking the DNS records

If you administer a sending domain, its DNS records provide another part of the investigation.

On systems with the `dig` utility installed, you can query TXT records.

For example:

`dig TXT example.com`

This retrieves TXT records published at the example domain.

A correctly configured sending domain may include an SPF record among its TXT records.

To examine a DMARC policy for that illustrative domain:

`dig TXT _dmarc.example.com`

To inspect a DKIM public-key record, you need the actual selector configured by the signing service.

A selector named `selector1` would use a name shaped like:

`selector1._domainkey.example.com`

The selector is not universally named `selector1`. Different providers use their own selectors and configuration procedures.

These are examples of DNS lookup structure, not working configuration records for the fictional domain.

### What DNS inspection can establish

A DNS query can help confirm that a record is published and inspect its value.

It does not by itself prove that a particular message passed authentication.

To establish that, you need to examine a real message's relevant sending identity, cryptographic signature, receiving infrastructure, and authentication results.

For example, a domain may have a correct DKIM DNS record while the sending application fails to sign a particular message.

Or a provider may sign using a different domain than the one you expected.

DNS configuration and observed message authentication are related, but they are not interchangeable evidence.

## A controlled test before changing production settings

If you administer an application that sends email, test the actual sending route before changing domain policy.

Use a private test mailbox that supports inspection of the delivered message's authentication information.

Send a harmless message from the authorized service using the intended From address.

Then examine:

- The visible From address.
- The envelope-sender domain reported by the receiving system.
- The DKIM signing domain.
- The SPF result.
- The DKIM result.
- The DMARC result.
- Whether the message reached the expected folder.

Record the result for each legitimate sending service.

That last point matters.

An organization may send account notifications through one provider, invoices through another, and newsletters through a third.

Correcting the DKIM configuration for one provider does not automatically configure the others.

Similarly, changing an SPF policy without accounting for all legitimate senders can interrupt a previously working route.

The goal is to establish which systems are authorized, how each authenticates, and whether their domain identities align.

## Forwarded messages complicate the picture

Forwarding creates a special difficulty.

Suppose a message is originally sent through an authorized server and then forwarded to another mailbox.

The final receiver may see the forwarding server's IP address instead of the original sender's IP address.

If the original envelope-sender domain is retained, the forwarded message may fail SPF because the forwarder is not authorized by the original domain's SPF policy.

If the forwarder changes the envelope-sender domain, SPF may pass for the forwarder's domain but fail to align with the original visible From address.

DKIM can sometimes survive forwarding because it validates signed message content rather than the final connecting IP address.

However, mailing-list changes or content modifications can invalidate DKIM signatures.

This is one reason email authentication cannot always be diagnosed by checking only one mechanism.

Indirect email flows, forwarding arrangements, and mailing lists require additional consideration.

RFC 7960 documents the interoperability challenges associated with DMARC and indirect email delivery.

## Where the Anvil Tools Temporary Email Generator fits

The [Anvil Tools Temporary Email Generator](/tools/temp-mail.html) is a receiving utility.

It creates a temporary inbox through Guerrilla Mail, checks for incoming messages, and allows users to read permitted, non-sensitive email.

It is not a mail-sending service.

It does not configure your domain's SPF, DKIM, or DMARC records.

It is also not advertised as a raw-header analysis tool or an email-authentication validator.

That boundary is important.

For a permitted test from an application you control, the tool can help you check whether a harmless message reaches a temporary receiving address.

You can examine its visible sender, subject, and message body.

However, **receiving a message in the temporary inbox does not prove it passed DMARC**, and the tool should not be presented as providing that result.

For a complete authentication investigation, use a receiving mailbox with suitable technical-header access and inspect the trusted receiving system's authentication results.

Use private test accounts and avoid including real login links, password-reset tokens, personal data, or other sensitive information in temporary inbox testing.

The Anvil Tools inbox is intended for short-lived, non-sensitive receiving tasks. It is not a permanent or private mail archive.

## A diagnosis table worth keeping

When an email behaves unexpectedly, identify the observation before making changes.

| Observation | Likely area to investigate |
|---|---|
| SPF fails | Sending IP authorization, envelope-sender domain, or SPF evaluation |
| DKIM fails | Signing configuration, public key, selector, or changes to signed content |
| SPF and DKIM pass, DMARC fails | Alignment with the visible From domain |
| DMARC passes, message reaches spam | Reputation, content, user reports, and provider sending requirements |
| Mail works directly but fails after forwarding | Indirect-flow behavior, SPF, DKIM, and forwarding-related authentication |
| DNS records look correct but mail fails authentication | The identities and authentication results of the actual message |
| Email arrives, but its verification button fails | Application-level token, link, or session behavior |

The final row belongs to a different stage of the workflow.

For that problem, see [Why Email Verification Links Fail](/journal/why-email-verification-links-fail).

This separation prevents a team from changing DNS records to solve a problem caused by an expired verification token.

It also prevents an application team from rewriting confirmation links when the real problem is domain authentication.

## The final distinction

SPF, DKIM, and DMARC work together to improve email identity verification.

But they answer different questions.

SPF checks whether a sending system is authorized for the domain being evaluated.

DKIM verifies a cryptographic signature associated with a signing domain.

DMARC checks whether a successful authentication result aligns with the visible From domain, using the applicable policy and alignment rules.

A message can pass SPF and DKIM but fail DMARC when the authenticated domains do not align.

It can also pass DMARC and still be filtered as unwanted mail.

The practical approach is to inspect the actual message identities, check trusted authentication results, verify the relevant DNS configuration, and test each legitimate sending route separately.

**Do not treat delivery, authentication, alignment, and inbox placement as the same outcome.**

When those stages are evaluated independently, email failures become easier to diagnose without making unnecessary changes to a working system.

## Try the relevant email tool

Need to perform a permitted, non-sensitive receiving test for an application or mailbox you control?

Use the [Anvil Tools Temporary Email Generator](/tools/temp-mail.html) to check whether a test message arrives.

For SPF, DKIM, or DMARC analysis, use the appropriate DNS tools, sending-provider diagnostics, and trusted authentication headers from a suitable receiving mailbox.

## Further reading

- [RFC 7208 — Sender Policy Framework (SPF)](https://www.rfc-editor.org/info/rfc7208)
- [RFC 6376 — DomainKeys Identified Mail (DKIM)](https://www.rfc-editor.org/info/rfc6376)
- [RFC 9989 — Domain-Based Message Authentication, Reporting, and Conformance (DMARC)](https://www.rfc-editor.org/info/rfc9989)
- [RFC 8601 — Message Header Field for Indicating Message Authentication Status](https://www.rfc-editor.org/info/rfc8601)
- [RFC 7960 — DMARC and Indirect Email Flows](https://www.rfc-editor.org/info/rfc7960)
- [Google — Email Sender Guidelines](https://support.google.com/mail/answer/81126)
- [Google — Check if a Gmail Message Is Authenticated](https://support.google.com/mail/answer/180707)
