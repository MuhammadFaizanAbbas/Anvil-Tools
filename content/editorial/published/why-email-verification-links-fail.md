# Why Email Verification Links Fail: Expiration, Security Scanners, and One-Time Tokens

The verification email arrived.

The subject is correct, the sender looks familiar, and the message contains a button labeled "Verify email."

But clicking it produces an error:

**This link is invalid or has expired.**

The obvious explanation is that the message arrived too late. Sometimes that is correct.

In other cases, the link was already used, a newer request replaced it, an email-security system accessed it automatically, or the application mishandled the verification process.

The important distinction is simple:

**Successful email delivery does not guarantee successful email verification.**

A verification flow involves several systems and several decisions. Understanding where each decision occurs is the most reliable way to diagnose a failure.

This guide explains those stages, the less obvious causes of verification errors, and how developers and testers can investigate them safely in applications they control.

## One email, several independent stages

An email verification process commonly involves five stages.

| Stage | What should happen | What can go wrong |
|---|---|---|
| Request | The application accepts a verification request | Request rejected, rate-limited, or linked to the wrong account |
| Generation | A verification token or code is created | Incorrect token state, premature invalidation, or unsuitable lifetime |
| Delivery | The message reaches the intended mailbox | Delays, filtering, rejection, or delivery failure |
| Opening | The recipient accesses the verification page | Modified URL, link-scanning behavior, or browser-session issues |
| Confirmation | The application validates the token and updates account state | Expiration, reuse, race conditions, or incorrect state transitions |

The stages are connected, but they do not prove one another.

A message appearing in an inbox confirms that a message was received there. It does not prove that the token is valid.

A successful page load confirms that a web resource opened. It does not prove that verification completed.

A verification success message should correspond to a completed, authorized change in the application's account state.

Keeping these outcomes separate makes error reports much more useful.

## An expired link and an already-used link are different failures

Many systems implement email verification through a time-limited token.

The application generates a token, associates it with an account or pending operation, and gives it an expiration time.

For example, an application might issue a link at 10:00 with a validity period of 15 minutes.

In that illustrative design, a confirmation attempted at 10:20 would be too late.

That is an expiration failure.

Now imagine the same link is successfully consumed at 10:03.

A second attempt at 10:05 may fail even though the original time limit has not elapsed.

That is a reuse failure.

These are separate conditions:

| Condition | Meaning |
|---|---|
| Expired | The permitted time window has passed |
| Used | The token has already completed its permitted operation |
| Superseded | A newer request has replaced the earlier token, if the system uses that policy |
| Invalid | The submitted token cannot be accepted for the requested operation |
| Already verified | The account may already be in the intended state |

An application may combine some of these into one public error message for security or simplicity.

Its internal diagnostics should still distinguish the underlying causes where appropriate.

The example timing above is illustrative. There is no universal 15-minute expiration period that applies to every email verification system.

## Why a fresh email can contain an expired link

The expiration clock often begins when the server issues the token, not when the recipient opens the message.

Suppose a verification token is generated at 10:00.

The sender's email service queues the message.

The recipient's mailbox receives it at 10:18.

If the token expires 15 minutes after issuance, the message contains a link that has already expired by the time it arrives.

This can look confusing from the user's perspective because the email appears new.

The inbox arrival time alone does not reveal when the token was created.

For an application team, the useful timestamps are:

- When the verification request was accepted.
- When the token was issued.
- When the message was accepted by the sending provider.
- When delivery was reported, if that information is available.
- When the verification endpoint was accessed.
- When confirmation was attempted.

These timestamps need a consistent time reference.

Use unambiguous server-side timestamps, ideally recorded in UTC, rather than depending on an operator's local clock.

A message's displayed date is not a reliable substitute for the application's token-expiration record.

## The surprising failure: a link is visited before the user clicks

Not every request to a link comes from a person intentionally opening it.

Email-security products may inspect URLs in incoming messages to identify malicious destinations.

Some systems rewrite links or examine them when a message is delivered or opened.

Others evaluate a URL when the user clicks it.

These protective systems serve a legitimate purpose.

However, automated access can interfere with applications that treat opening a verification URL as a final, state-changing action.

Imagine a verification endpoint that marks an account as verified immediately upon receiving a request to the link.

If an automated scanner accesses that URL first, the application may consume the token before the recipient intentionally confirms anything.

When the user subsequently clicks the button, the application reports that the link has already been used.

The email was delivered correctly.

The token may have been generated correctly.

The failure occurred because **the application treated a link visit as proof of deliberate user confirmation**.

This behavior is sufficiently important that authentication providers document scanner-related problems with verification and login links.

It should not be diagnosed simply by assuming that the user double-clicked.

## Why a GET request should not silently complete a sensitive operation

On the web, an HTTP GET request is intended to retrieve information rather than request a state-changing action.

That distinction allows browsers, crawlers, caches, and other automated systems to retrieve pages without being responsible for initiating meaningful changes.

The HTTP specification describes GET as a safe method.

A verification link normally opens through a GET request.

If merely loading that page irreversibly consumes a token or changes sensitive account state, automated link access may trigger an action the user did not intend.

One safer design is to separate viewing from confirmation.

The initial link opens a verification page.

The page explains the action.

The person selects an explicit confirmation control.

The server then validates and consumes the token through an appropriately protected state-changing request.

This does not automatically make every verification workflow secure. Token handling, request protection, session design, and the application's threat model still matter.

But separating page retrieval from confirmation reduces the chance that an automated link preview will complete the operation.

Another option in supported authentication systems is an emailed one-time code that the user enters into the application.

A code-entry flow can avoid the particular problem of a scanner automatically activating a confirmation link, although it still needs strong token controls and protection against abuse.

## Security scanners are not the same as malicious visitors

A request arriving before the user clicks does not automatically indicate an attack.

It may be generated by:

- A protective email gateway.
- A corporate link-analysis service.
- An automated URL reputation checker.
- A link-preview feature.
- A user interaction that opened the destination earlier.

Microsoft's Safe Links documentation, for example, describes email-link scanning and URL rewriting in supported Microsoft 365 environments.

The exact behavior depends on the product, configuration, and circumstances.

A developer should not assume that every security product visits every link or that every automated visit consumes a token.

Instead, inspect the application's authorized test logs and the reported account state.

The important question is whether the verification operation was completed before the intended user submitted it.

A security scanner should not have to be disabled merely to make an application perform a normal confirmation correctly.

## Link rewriting adds another layer

Some email platforms replace an original destination URL with a tracking or security URL.

When the recipient selects the link, the intermediate service processes the request and redirects it to the destination.

This is commonly called link rewriting.

Rewriting does not automatically mean the destination is broken.

Properly implemented redirect chains can preserve the intended destination and its parameters.

However, application teams should test whether their verification URLs survive the actual environment in which recipients open messages.

Potential issues include:

- An incorrectly generated destination URL.
- Lost or altered query parameters.
- Invalid encoding of special characters.
- An intermediate redirect that changes the expected flow.
- A destination that depends on a browser session unavailable in the recipient's environment.

Do not diagnose all such failures as email-delivery problems.

The message can arrive while a separate URL-handling error prevents confirmation.

For security-sensitive links, avoid adding unnecessary marketing click-tracking redirects. Use an authentication workflow suited to the required assurance level.

## What a double-click can reveal

Suppose a user selects the verification button twice in quick succession.

Two requests may reach the server.

A secure one-time token should not authorize the same operation repeatedly.

However, the application still needs to handle concurrent requests predictably.

Consider these possible results:

**Result A:** The first request succeeds and the second receives a clear already-completed response.

**Result B:** Both requests attempt to change state because token consumption is not enforced atomically.

**Result C:** The first request succeeds, but the interface reports a generic error after receiving the second response.

Result A can be an acceptable design.

Result B may indicate a concurrency problem.

Result C can create a confusing user experience even when the account is actually verified.

The server should enforce token consumption and the intended state transition safely, including when requests arrive nearly simultaneously.

The interface should avoid telling users that verification failed when the intended operation has already succeeded.

## Resending an email does not always preserve the first link

A "Resend verification email" button introduces another design choice.

Some applications invalidate the previous token whenever a new one is issued.

Other systems may allow more than one outstanding token for a limited time.

Neither behavior should be assumed without checking the application's implementation.

A common confusing sequence is:

1. The user requests a verification message.
2. Delivery is delayed.
3. The user requests another message.
4. The second message arrives first.
5. The original message arrives later.
6. The user opens the older message.

If issuing a new token invalidated the previous one, the link in the older email may fail.

This can happen even if both messages arrived recently.

The interface should help users identify the latest valid verification method without exposing sensitive token details.

For testing, create a controlled resend case and record which tokens are expected to remain valid.

Do not repeatedly request messages from a third-party service just to work around restrictions or rate limits.

## Different devices can produce different outcomes

A recipient may request verification on a laptop and open the email on a phone.

Some flows support that naturally because the token contains the information needed to associate the confirmation with the correct pending action.

Others depend on an existing browser session or additional state.

If a workflow requires the original session, opening the link on another device can fail even though the token itself has not expired.

This is a design decision worth testing.

For a cross-device flow, establish whether the application intends to allow confirmation independently of the originating browser.

If it does, test that path.

If additional authentication or session binding is required, explain that requirement rather than presenting every mismatch as an invalid token.

A successful cross-device test should confirm the correct account was verified, not merely that a success page appeared.

## A practical verification test matrix

The most useful test suite separates delivery from token behavior.

The following matrix is intended for an application you own or are explicitly authorized to test.

Use synthetic accounts, a controlled environment, and a private test mailbox for any links that can grant real access.

| Test case | Expected result |
|---|---|
| Valid token, first confirmation | Correct account becomes verified |
| Same token, second confirmation | No second state-changing action |
| Token after configured expiry | Rejected without verifying the account |
| Altered token | Rejected |
| Older token after resend | Behaves according to the documented supersession policy |
| Two nearly simultaneous confirmations | At most one authorized state transition |
| Link opened without final confirmation | No unintended verification if the design requires explicit confirmation |
| Link opened on another device | Follows the supported cross-device policy |
| Verification page refreshed | Does not repeat a sensitive state-changing operation |
| Wrong or unrelated account context | Cannot verify another account |
| Expired link followed by a legitimate new request | New, authorized path works without reactivating the old token |

These are expected outcomes for testing, not a claim that the cases have been run on Anvil Tools or any external service.

When a test fails, capture the test-case identifier, the relevant application state, and sanitized timestamps.

Avoid storing raw tokens or complete authentication URLs in bug reports.

## What to record when a user reports a broken link

A report saying "verification doesn't work" provides little diagnostic detail.

A stronger report identifies the last successful stage.

For example:

**Message received:** Yes.

**Link opened:** Yes.

**Confirmation page displayed:** Yes.

**Confirmation submitted:** No.

**Application error:** Link already used.

That record suggests a different investigation from one where the email never arrives.

For a reproducible test, it is useful to capture:

- Which workflow was tested.
- Which synthetic account or internal test identifier was used.
- The approximate request and receipt times.
- Whether a resend occurred.
- Whether the link was opened on another device.
- Whether the verification page was accessed before deliberate confirmation.
- The final account state.

The exact token is usually unnecessary in a shared report.

Where deeper server-side investigation is required, authorized operators can correlate events using protected internal records without exposing the secret in ordinary logs.

## Avoid leaking verification tokens while debugging

Verification links often contain bearer-like secrets: anyone possessing a valid link may be able to complete the associated action.

Their handling therefore deserves care.

Do not paste real verification links into public issue trackers, screenshots, shared documents, or general-purpose text-processing tools.

Application logs should not routinely record full verification URLs or raw token values.

Be cautious with third-party scripts and external resources loaded on pages containing sensitive link parameters.

Use appropriate referrer controls, such as a restrictive `Referrer-Policy`, and avoid unnecessary exposure of the token in client-side analytics.

For production authentication workflows, follow established application-security guidance on secure token generation, expiration, storage, validation, and invalidation.

A troubleshooting process should not weaken the feature it is investigating.

## Where the Anvil Tools Temporary Email Generator fits

The [Anvil Tools Temporary Email Generator](/tools/temp-mail.html) receives messages through Guerrilla Mail using the site's backend.

It is a receiving tool, not a sender or an email-verification testing framework.

The website checks the inbox for messages approximately every 15 seconds and offers controls to copy the address, refresh the inbox, and create another address.

Website access lasts up to one hour. That access limit does not establish when the external provider deletes messages or associated records.

For a permitted, non-sensitive test, the tool can help answer questions such as:

- Did a test message arrive?
- Was the expected subject present?
- Did the message contain the expected non-sensitive text?
- Did the sender use the intended test address?

It cannot establish whether a real account-verification token is valid, whether the receiving application's backend accepted it, or whether an account changed state correctly.

The interface also sanitizes incoming content, so it should not be used as a full-fidelity replacement for testing HTML email behavior across actual email clients.

Most importantly, temporary inboxes should not receive real password-reset links, sensitive account information, or tokens that grant access to valuable accounts.

For authentication testing involving real capabilities, use a dedicated private test mailbox and an appropriately isolated test environment.

The temporary-email tool is best reserved for permitted, non-sensitive receipt checks.

## A safer way to test the message itself

If your immediate goal is only to check that an email template arrives, separate that task from authentication testing.

A non-sensitive demonstration message could contain:

**Subject:** Verification email layout check

**Body:** This is a test of message receipt and formatting. No account action is available from this message.

That lets the team inspect delivery and visible content without creating a real login or verification capability.

Once basic receipt works, test the actual authentication flow separately in a controlled environment with appropriate security and privacy protections.

This division also makes failures easier to locate.

If the harmless template arrives but a real verification flow fails in the private test environment, the investigation should move toward token issuance, URL handling, or confirmation state rather than treating basic message receipt as the only possible cause.

For guidance on selecting a suitable inbox and understanding temporary-mail limitations, see [Temporary Email for Authorized Testing and Permitted Messages](/journal/temporary-email-for-authorized-testing-and-permitted-messages).

## How to design clearer error messages

A verification system must balance useful feedback with security.

It should not disclose unnecessary account information to unauthenticated visitors.

For example, request forms should avoid making it easy to discover whether a particular email address belongs to a registered account.

At the same time, legitimate users need a way forward when verification fails.

A good recovery path can explain that a link is no longer usable and direct the user to request a fresh message through the normal application workflow.

If the account is already verified, the application should handle that state intentionally rather than leaving the user trapped in an unexplained error.

Rate limits and abuse protection should remain in place.

Clear messaging does not require revealing raw tokens, internal account identifiers, or sensitive implementation details.

## A successful test requires two proofs

Email verification testing is incomplete if it checks only the inbox.

The first proof concerns delivery:

**Did the expected message reach the intended destination?**

The second concerns application state:

**Did the intended authorized action complete exactly as designed?**

Between them sits the verification link or code, along with expiration rules, automated access, redirects, user sessions, and one-time-use enforcement.

Each can cause a failure independently.

The most dependable workflow is to test those boundaries separately, record observations without exposing secrets, and verify the final account state on the application server.

That approach turns an ambiguous "link expired" complaint into a specific, reproducible finding.

And it prevents a dangerous assumption: that because a verification email looks correct, the verification process must be correct too.

## Try the relevant email tool

Need to check delivery of a non-sensitive test message from an application or mailbox you control?

Use the [Anvil Tools Temporary Email Generator](/tools/temp-mail.html) to create a short-lived receiving address where disposable mail is permitted.

For real account verification, password recovery, or any sensitive token workflow, use a controlled private mailbox and suitable application-testing tools.

## Further reading

- [OWASP — Email Validation and Verification Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html)
- [OWASP — Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [Auth0 — Verify Emails](https://auth0.com/docs/manage-users/user-accounts/verify-emails)
- [Auth0 — Login Links and Safe Links Scanners](https://support.auth0.com/center/s/article/Login-links-in-emails-and-Safe-Links-scanners-leading-to-rate-limit-issues)
- [Microsoft Learn — Safe Links Overview](https://learn.microsoft.com/en-us/defender-office-365/safe-links-about)
- [RFC 9110 — HTTP Semantics, Safe Methods](https://www.rfc-editor.org/rfc/rfc9110.html)
