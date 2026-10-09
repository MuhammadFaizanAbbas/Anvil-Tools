# Why HTML Emails Look Different Across Inboxes: Plain Text, Images, CSS, and MIME

An application sends a confirmation email.

The message arrives in the intended mailbox, the subject line is correct, and the sender address looks familiar.

But something is wrong.

The logo is missing. The blue confirmation button appears as an ordinary text link. On another device, the layout is narrower and the text wraps differently.

A developer opens the original email template in a browser, where everything looks perfect.

Why doesn't the email look the same?

Because **receiving an email successfully and displaying its design correctly are two different operations**.

Email applications do not all use the same rendering engine, support the same CSS features, or apply the same security restrictions.

Some also choose between different representations of the message.

Understanding these differences helps developers, designers, and website owners build emails that remain useful even when their original visual design cannot be reproduced exactly.

## The email that passed delivery but failed the design review

Consider a fictional company preparing an order-confirmation email.

The design contains five elements:

| Element | Intended appearance |
|---|---|
| Company logo | Displayed above the message |
| Greeting | Personalized text |
| Order summary | Product name and order reference |
| Action button | Blue button labeled "View order" |
| Footer | Support contact and company information |

The developer sends a harmless test message to several controlled mailboxes.

The results are different.

| Test environment | Observed appearance in this illustrative scenario |
|---|---|
| Mailbox A | Full design with logo and blue button |
| Mailbox B | Text and button visible, but logo hidden |
| Mailbox C | Content visible with simplified spacing and button styling |
| Plain-text view | No visual button; the destination appears as a written link |

These are hypothetical observations designed to demonstrate the review process. They are not results from a test performed on Anvil Tools, Gmail, or Outlook.

The differences do not necessarily mean the sending system failed.

Each recipient environment may have successfully received the same message while displaying it differently.

To understand what happened, start with the message's structure.

## An email can contain more than one version of its body

Email is not limited to a single block of visible text.

MIME, which stands for Multipurpose Internet Mail Extensions, provides mechanisms for representing different content types and multipart messages.

One common format is `multipart/alternative`.

This structure allows a sender to include different representations of substantially the same message.

A typical example contains:

- A `text/plain` version.
- A `text/html` version.

The plain-text version communicates the message using ordinary text.

The HTML version can provide styled headings, tables, buttons, images, and other presentation elements supported by the receiving application.

RFC 2046 defines `multipart/alternative` and explains the significance of the order of its parts.

In general, alternatives are arranged from the least elaborate representation to the preferred richer representation, with the plain-text part commonly appearing before HTML.

A compatible receiving client chooses an appropriate supported representation.

This means the user may see only one version of a message even when the original email contains both.

**The plain-text and HTML versions are alternatives, not two separate messages that must both appear on screen.**

## Plain text is not a broken HTML email

Imagine an order-confirmation message.

Its HTML presentation shows a large heading, a summary table, and a blue "View order" button.

The plain-text version could communicate the same essential information this way:

| Content | Plain-text representation |
|---|---|
| Greeting | Your order is confirmed. |
| Order | Order reference: DEMO-1042 |
| Action | View your order: https://example.com/orders/demo-1042 |
| Support | Questions? Contact support@example.com |

The domain and order number are illustrative.

The plain-text version does not reproduce the button's shape or the table's visual styling.

It preserves the purpose of the message.

That is the correct objective.

A plain-text alternative should not simply be a collection of unexplained labels or an empty fallback.

Someone reading it should still understand what happened, what information matters, and what action is available.

For an order confirmation, the critical content includes the order reference and instructions for obtaining further information.

For a password-reset message, the critical content must be presented securely, and any real recovery link must be handled as a sensitive credential.

Different message types need different fallback details.

## Why the plain-text version matters

A well-written plain-text version provides resilience when rich formatting is unavailable or deliberately disabled.

It may also improve readability in applications and environments that prefer text.

However, providing a plain-text alternative does not guarantee inbox placement or prove that an email is safe.

It is a content-compatibility measure, not a substitute for authentication, sender reputation, or other delivery requirements.

The useful test is whether the plain-text and HTML versions communicate the same important facts.

Consider a message where the HTML version says an offer ends on Friday, but the text version says Thursday.

Both versions may render correctly.

The email is still inconsistent.

That is a content problem, not a formatting problem.

Before sending an important message, compare its meaningful information across every representation the system generates.

## Why HTML email behaves differently from a normal webpage

A browser-rendered HTML page usually runs within a website whose developer controls the page environment.

Email HTML arrives from an outside sender.

The receiving application must treat that content cautiously.

Allowing arbitrary incoming email code to behave like a normal webpage would create serious security and privacy problems.

Email clients therefore restrict or modify parts of incoming HTML.

Exactly what is allowed varies across products, versions, and rendering environments.

Some CSS features work consistently.

Others behave differently or are unsupported in particular clients.

JavaScript should not be relied upon as a functional part of ordinary HTML email.

The Email Markup Consortium documents how email sanitization and different rendering environments contribute to inconsistent results.

That leads to a practical rule:

**A layout working in your browser does not prove it will work in the recipient's email application.**

The finished email must be tested as an email.

## Why CSS layouts can break

Modern websites frequently use sophisticated CSS layouts, responsive design techniques, and interactive components.

Email clients support different subsets of those features.

As a result, a design can look correct in a browser preview but change after delivery.

Potential symptoms include:

| Symptom | Possible reason |
|---|---|
| Two columns become stacked | Responsive rules or layout features are handled differently |
| Text spacing changes | CSS declarations are modified or unsupported |
| A button loses its background | Its styling is not applied as intended |
| Fonts appear different | The specified font is unavailable or unsupported |
| Content extends beyond the screen | Width or layout assumptions do not fit the recipient's viewport |
| Dark backgrounds or text colors change | Dark-mode processing or client-specific styling behavior |

These are possible causes rather than universal rules.

Different versions of the same email application may have different levels of support.

For that reason, avoid assuming that a feature either works everywhere or fails everywhere.

The [Can I Email](https://www.caniemail.com/) compatibility database can help identify support for particular HTML and CSS features.

Its information is useful when planning an email template, but an actual test in the relevant receiving environment remains valuable.

## A simpler design is often more dependable

Consider two approaches to a transactional message.

The first relies on complex positioning, special fonts, background images, and animations.

The second uses a straightforward content hierarchy, readable text, sensible spacing, and a prominent action link.

The first may look more impressive in a design preview.

The second may be easier to preserve across a wider range of email clients.

This does not mean HTML emails must be unattractive.

It means their design should support the message rather than become a requirement for understanding it.

Important information should remain available when a decorative effect disappears.

A confirmation number should not exist only inside a background image.

A warning should not depend exclusively on the color red.

A call to action should not become meaningless when its button styling is removed.

These decisions help protect the purpose of the email when rendering changes.

## Why an image disappears from an email

Images can reach an email recipient in more than one way.

One common approach is to place an image on a web server and reference its address from the HTML message.

This is a remote image.

The email client retrieves it separately when it decides to display that resource.

Another approach is to package an image within the message and refer to it using a content identifier.

The `cid:` scheme is documented in RFC 2392.

Image attachments provide another method of carrying image files, although an attachment is not automatically displayed inline merely because the file is present.

These approaches have different compatibility and privacy considerations.

A remote image may fail to display because the client blocks its loading, the resource is unavailable, or the request is rejected.

A content-ID image may fail if the receiving application does not interpret the message structure as expected.

The symptom may look identical to the user: an empty image area.

The underlying cause is not necessarily the same.

## Remote images and privacy protection

Email applications may restrict remote images because loading them can reveal information to the server hosting the resource.

For example, an externally hosted image can be used as a tracking pixel.

Microsoft documents image-blocking controls in Outlook, while Google documents Gmail's handling of external images and its image-safety protections.

Their behavior is not identical.

Gmail commonly displays external images automatically, subject to settings and security decisions.

Certain Outlook environments and configurations block remote images until the user permits them.

Therefore, a missing logo does not automatically mean the HTML template is malformed.

The receiving application may be intentionally protecting the user.

For an email designer, the appropriate response is to ensure that the message remains understandable without decorative images.

Do not instruct recipients to weaken security settings simply because a marketing layout depends on external graphics.

## Image alternative text is useful, but not a universal substitute

An HTML image can include alternative text describing its purpose.

That is valuable when the image cannot be seen or loaded and for certain assistive-technology experiences.

However, different email clients may present alternative text differently.

The presence of an `alt` attribute does not guarantee a particular visual fallback.

For a decorative image, empty alternative text may be appropriate.

For a meaningful image, provide information that communicates its purpose.

For example, a logo may use the organization's name as alternative text.

An image containing a critical deadline should not be the only place where that deadline appears.

The deadline should also be available as actual text in the message.

The broader principle is that important content must survive the loss of decorative presentation.

## Why buttons sometimes become ordinary links

An HTML email button is often implemented using styled HTML elements and a hyperlink.

When the styling is altered or unsupported, the clickable destination may remain even though the control no longer looks like a button.

This is not automatically a functional failure.

If the link still works, the action may remain available.

But the design should make sense when the visual treatment is lost.

A link labeled "Click here" provides little context on its own.

A link labeled "View your order" communicates more clearly what the recipient should expect.

The destination also needs to be correct.

A visible button label does not prove that its underlying link leads to the intended page.

For a complete review, inspect both the displayed label and the actual destination.

For security-sensitive messages, use your application's established authentication workflow. Do not test real recovery or account-verification secrets in public inboxes.

## Why a link works in one email but not another

Sometimes an email's appearance looks correct, but a button fails when selected.

That is a different problem from the button losing its styling.

Potential causes include an incorrect destination URL, a token that has expired, a link modified during processing, or a destination that requires a browser session.

An email-security product may also inspect or rewrite links.

These are application and link-handling questions.

They are not solved merely by changing the button's color or font.

For a separate explanation of one-time links, scanner access, and expiration rules, see [Why Email Verification Links Fail](/journal/why-email-verification-links-fail).

A good email review separates visual rendering from actual link behavior.

Both matter, but they require different evidence.

## Why the inbox preview can look different from the email body

Many email applications display a short preview or snippet beside the subject line.

That snippet is often based on the message's available body content.

Some email templates deliberately include introductory preview text intended to influence what appears there.

However, there is no guarantee that every application will use the same snippet-generation rule.

A client may include different portions of the body, omit hidden text, or apply its own formatting and length limits.

The preview displayed by one email application should not be treated as a universal result.

For important messages, make the opening lines meaningful even when the client ignores specialized preview-text techniques.

Also remember that the subject and body preview have different roles.

The subject is an actual email header field.

The preview snippet is generally a display feature of the receiving application.

A well-formed subject does not guarantee a particular snippet.

## The difference between sanitization and plain-text fallback

This distinction is particularly important when testing email templates.

Imagine a message containing an HTML version with a heading, styled button, logo, and footer.

A receiving system might choose the plain-text MIME part.

Alternatively, it might choose the HTML part but sanitize its contents before displaying them.

Those results are not technically equivalent.

**Plain-text fallback** means selecting a different representation supplied by the sender.

**HTML sanitization** means modifying or restricting HTML content as part of the receiving application's processing.

Both may produce a simpler-looking message.

But seeing simplified text on screen does not reveal which process occurred.

To determine that, the tester needs suitable access to the message's MIME structure and the receiving application's behavior.

A safety-focused inbox preview should not be confused with the full original HTML.

## Testing email content without sending sensitive information

A useful email-rendering test should use synthetic data and harmless destinations.

For example, a fictional order confirmation can contain:

| Field | Test value |
|---|---|
| Recipient | Controlled test mailbox |
| Subject | Order confirmation layout test |
| Order reference | DEMO-1042 |
| Product | Ceramic cup |
| Action destination | A harmless page controlled by the tester |
| Sensitive account token | None |

The goal is to test the message's structure and appearance without creating a real account-access capability.

This lets developers inspect the visible sender, subject, body, and links without exposing customer information.

If a real application workflow requires authentication tokens, test that separately in an appropriate private environment.

Do not include real password-reset or login links in a disposable mailbox.

The same caution applies to medical records, banking messages, payment information, and other sensitive correspondence.

## A test matrix that separates different failures

Rather than asking only whether an email "looks right," record which part of the message was evaluated.

| Check | What to verify | Suitable method |
|---|---|---|
| Delivery | Message reached the intended mailbox | Inbox or receiving-service logs |
| Subject | Correct subject and meaningful wording | Inbox view |
| Plain-text content | Essential information remains understandable | MIME-aware text inspection |
| HTML content | Intended layout and readable hierarchy | Representative email clients |
| Remote images | Message remains useful when images are blocked | Image-blocking test |
| Action links | Labels and destinations match the intended action | Controlled link inspection |
| Mobile layout | Text remains readable at narrow widths | Mobile email-client test |
| Accessibility | Text alternatives, reading order, and meaningful links | Accessibility review in supported clients |

Each test answers a different question.

A successful delivery check does not confirm HTML compatibility.

An attractive desktop preview does not establish mobile readability.

A successful link click does not verify the message's accessibility.

Keeping those outcomes separate makes problems easier to reproduce and resolve.

## How Anvil Tools Temporary Email Generator fits

The [Anvil Tools Temporary Email Generator](/tools/temp-mail.html) provides a short-lived receiving inbox through Guerrilla Mail.

The site's backend obtains an address and retrieves received messages.

The browser checks the inbox approximately every 15 seconds, and website inbox access lasts up to one hour.

Received content is presented through a safety-focused interface that strips scripts and tracking elements.

The tool can help with basic, permitted, non-sensitive receipt checks.

For example, you can confirm that a harmless test message arrived and inspect the sender, subject, and displayed message content.

But the tool is **not a complete HTML email rendering laboratory**.

It does not promise to reproduce the original message exactly as Gmail, Outlook, Apple Mail, or another application would display it.

It also does not advertise a raw MIME-source viewer, downloadable email files, replies, or comprehensive CSS compatibility testing.

The simplified content shown in a temporary inbox therefore should not be used as evidence that the original HTML template has no formatting.

Likewise, a message arriving successfully does not establish that its remote images, linked resources, or responsive design will work in other mail applications.

### The privacy limit matters

The Temporary Email Generator is not a permanent or private mailbox.

A new address or expired website session does not guarantee that provider-held information has been deleted.

For that reason, reserve it for permitted, non-sensitive messages.

Use a dedicated private testing environment and controlled mailbox when the message contains account-access capabilities or confidential information.

The temporary inbox is a convenience for basic receipt testing, not a replacement for a full email-quality or security-testing system.

## A better workflow for teams publishing transactional emails

For an application sending confirmations, receipts, or notifications, use three separate review stages.

### Stage 1: Validate the source message

Check that the sending system generates the intended subject, plain-text content, and HTML content.

Confirm that important information matches between the two body versions.

Review links, image references, character encoding, and the absence of unintended sensitive information.

### Stage 2: Validate delivery and structure

Send harmless messages to controlled test accounts.

Check that the messages arrive and that the receiving system reports no relevant delivery failure.

Where needed, inspect the actual MIME parts and technical headers in a suitable private mailbox or testing tool.

This establishes what was delivered, not necessarily how every client will display it.

### Stage 3: Validate presentation

Open the message in the email clients that matter to your audience.

Review images enabled and disabled, narrow-screen layouts, dark-mode behavior where relevant, and the readability of action links.

Use compatibility references to investigate features that behave differently.

Do not assume one successful preview establishes support across all email applications.

Finally, confirm that the finished message still communicates its essential purpose when optional visual elements are removed.

## What a good email must preserve

An email does not need pixel-perfect identical rendering across every client to be useful.

A readable, accessible, functional message can tolerate differences in spacing, font substitution, or decorative presentation.

What matters most is that the essential information remains intact.

For an order confirmation, the recipient should know the order was accepted and how to obtain its details.

For a service notification, the recipient should understand what changed and whether action is required.

For an educational newsletter, the text should remain readable even if some images are unavailable.

And for security-sensitive email, the authentication workflow must remain secure independently of its visual appearance.

This is a more meaningful quality standard than insisting every recipient see an identical screenshot.

## The final distinction

Email delivery, message structure, and visual presentation are separate parts of the communication process.

Delivery determines whether the message reaches its destination.

MIME determines how different representations can be packaged inside that message.

The receiving application determines how supported content is selected, sanitized, and displayed.

A message can succeed at the first stage and still have problems at the others.

The most dependable approach is to test all three, using the right tool for each job.

**An email is ready when the correct information arrives, remains understandable, and supports the intended action—not merely when the sender reports success.**

## Try the relevant email tool

Need to check whether a harmless test message reaches a short-lived inbox?

Use the [Anvil Tools Temporary Email Generator](/tools/temp-mail.html) for authorized, non-sensitive receipt testing where disposable addresses are permitted.

For detailed HTML compatibility, MIME inspection, rendering verification, or real authentication workflows, use dedicated email-testing tools and controlled private mailboxes.

## Further reading

- [RFC 2046 — MIME Media Types and Multipart Messages](https://www.rfc-editor.org/info/rfc2046/)
- [RFC 2045 — MIME Message-Body Format](https://www.rfc-editor.org/info/rfc2045/)
- [RFC 2392 — Content-ID and Message-ID URLs](https://www.rfc-editor.org/info/rfc2392/)
- [Email Markup Consortium — Email Sanitizer](https://emailmarkup.org/en/docs/sanitizer/)
- [Can I Email — HTML and CSS Support Tables](https://www.caniemail.com/)
- [Microsoft Support — Blocking Automatic Picture Downloads](https://support.microsoft.com/en-us/outlook/block-or-unblock-automatic-picture-downloads-in-classic-outlook-email-messages)
- [Gmail Help — Turn Images On or Off](https://support.google.com/mail/answer/145919)
