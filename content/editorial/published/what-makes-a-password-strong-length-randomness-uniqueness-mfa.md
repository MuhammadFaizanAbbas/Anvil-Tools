# What Actually Makes a Password Strong? Length, Randomness, Uniqueness, and MFA

For years, password advice often sounded like a checklist:

```text
8 characters
1 uppercase letter
1 lowercase letter
1 number
1 symbol
change every 90 days
```

A password that satisfied every box looked "strong."

But those boxes do not tell the whole story.

A predictable password such as:

```text
Summer2026!
```

can satisfy common complexity requirements while still following a pattern that attackers are likely to try.

Meanwhile, a longer, randomly generated password may be far harder to guess even if nobody could memorize it.

Modern password guidance therefore focuses less on visual complexity and more on the complete account-security problem:

**length → randomness → uniqueness → safe storage → MFA → recovery**

A good password strategy has to survive that entire chain.

## A password has more than one job

When people ask whether a password is strong, they are usually combining several different questions.

A useful password strategy should make it difficult to:

1. guess the password,
2. reuse a stolen password on another account,
3. accidentally lose or expose the password,
4. take over the account with the password alone.

Those goals are related, but one password property cannot solve all of them.

For example:

- length helps resist guessing,
- randomness reduces predictable patterns,
- uniqueness limits damage from another site's breach,
- a password manager helps store unique credentials,
- MFA provides another barrier if the password is exposed.

That is why judging a password only by whether it contains a symbol is incomplete.

## Start by separating generated passwords from memorized passwords

There are two common situations.

### Passwords you do not need to memorize

If a password manager will store the credential, there is usually little benefit in making it memorable.

You can use a long random value such as:

```text
vR7!mP2#qL9@xT4&nK6z
```

The important properties are that it is:

- generated unpredictably,
- sufficiently long,
- unique to that account,
- accepted by the website,
- saved securely before you leave the page.

This is where a browser-based password generator is especially useful.

### Passwords you really must remember

A memorable password has different usability constraints.

A long passphrase made from multiple unrelated words can be easier to remember than a short string filled with substitutions.

For example, a structure such as:

```text
word-word-word-word-word
```

can be easier for a person to remember than something shaped like:

```text
P@ssw0rd!
```

The important word is **unrelated**.

A quotation, lyric, slogan, famous phrase, birthday-based sentence, or predictable sequence is not made strong merely because it contains many characters.

Human-created passwords often contain patterns.

Random generation removes much of that predictability.

## Length matters more than the old checklist suggests

Current NIST guidance puts substantially more emphasis on password length than on forced character mixtures.

For services following NIST SP 800-63B-4, a password used as the only authentication factor must be at least 15 characters long.

When a password is used only as part of a multi-factor authentication process, NIST allows a service to set the minimum as low as eight characters.

Those are requirements for authentication systems, not a rule that users should deliberately stop at the minimum.

A generated password can usually be longer without becoming harder to use because a password manager stores it.

If a website accepts 20, 24, or more random characters, there is normally no usability reason to shorten a machine-generated password merely because the site's minimum is lower.

The receiving website's limits still matter, however.

Some services:

- impose short maximum lengths,
- reject certain symbols,
- disallow spaces,
- use outdated password rules.

A password has to satisfy the system where it will actually be used.

## Why forced complexity rules are losing importance

A requirement such as:

```text
must contain uppercase
must contain lowercase
must contain a number
must contain a symbol
```

looks mathematically sensible.

The problem is human behavior.

When forced to satisfy predictable rules, people often make predictable modifications.

A simple password might become:

```text
Password1!
```

A seasonal password might become:

```text
Autumn2026!
```

The password technically contains several character classes, but an attacker does not have to test every possible random character combination first.

Attackers can prioritize patterns that people commonly choose.

Modern NIST guidance therefore tells compliant password verifiers not to require arbitrary mixtures of character types.

That does **not** mean numbers and symbols are bad.

If they appear naturally in a randomly generated password, they increase the available character set.

The difference is between:

**randomness that happens to include many character types**

and:

**a human predictably modifying a weak password to satisfy a rule.**

## Randomness matters because people are predictable

Consider these two 16-character-looking approaches.

A person chooses something based on a familiar pattern:

```text
Football2026!!!
```

A cryptographically secure generator creates a fresh random value:

```text
r8@Vk2!Qm7#Lp4Zx
```

The first has visible structure.

The second is not based on a word, year, favorite team, keyboard path, or common substitution pattern.

The exact strength of any password depends on how it was generated and how an attacker is able to test guesses, so a simple "years to crack" label should not be treated as a guarantee.

But one general principle is reliable:

**A password chosen uniformly from a large set is fundamentally different from a human-selected password that merely looks complicated.**

That is why the Anvil Tools Password Generator uses the browser's cryptographically secure random number source rather than a predictable random function.

## Do not confuse randomness with appearance

A password can look random without actually being random.

For example:

```text
Qwerty!234567
```

contains:

- uppercase letters,
- lowercase letters,
- numbers,
- a symbol.

It still contains an obvious keyboard pattern.

Similarly:

```text
M1chael@1999
```

may satisfy a website's complexity checker while remaining closely related to personal information.

Visual messiness is not proof of unpredictable generation.

A genuinely random password does not need to look elegant, memorable, or meaningful.

If software will store it, memorability is unnecessary.

## Uniqueness protects you from a different attack

Suppose you create an excellent 24-character password.

Then you reuse it on:

```text
email account
shopping site
forum
cloud storage
```

The password itself may be difficult to guess.

But now every service depends on every other service keeping that same credential safe.

If one site suffers a breach and the password becomes available to attackers, the attacker does not need to guess your other passwords.

They already have one.

They can try the same email-address and password combination elsewhere.

This type of attack is known as credential stuffing.

The defense is straightforward:

**one account → one password**

If one credential is exposed, it should unlock only one account.

This is one of the strongest reasons to use a password manager: people are not expected to memorize dozens or hundreds of unrelated random strings.

## A password manager changes what a practical password can look like

Without a password manager, every new account creates pressure to:

- reuse a password,
- make small variations,
- choose something memorable,
- keep passwords short enough to type easily.

A password manager changes those constraints.

Instead of remembering:

```text
shopping password
email password
bank password
streaming password
developer account password
```

you primarily protect access to the manager itself.

The manager can then store unique generated credentials for individual services.

NIST's current guidance explicitly says password verifiers should allow password managers and autofill, and should permit paste functionality when autofill is unavailable.

That matters because blocking password managers often pushes users toward weaker behavior rather than stronger security.

## Protect the password manager differently

Using a password manager concentrates many credentials behind one account.

That makes the password manager account especially important.

Its main password should be:

- long,
- unique,
- not reused anywhere else,
- memorable enough that you do not need to keep it in an unsafe place.

Enable strong MFA for the password manager if the service supports it.

Also preserve the provider's recovery information according to its instructions.

A randomly generated password that you cannot recover is not useful if losing access to the manager means losing access to every stored account.

## MFA changes the consequences of password exposure

Imagine an attacker obtains a correct password through:

- phishing,
- malware,
- a breached service,
- accidental disclosure,
- shoulder surfing.

If that password is the account's only authentication requirement, the attacker may be able to sign in immediately.

Multi-factor authentication adds another requirement.

Depending on the service, the second factor might involve:

- an authenticator app,
- a hardware security key,
- a platform authenticator,
- another supported method.

MFA does not make weak or reused passwords acceptable.

It reduces reliance on the password as the only barrier.

A useful account-security model is therefore:

```text
unique password
      +
safe storage
      +
MFA
```

rather than trying to make one password perform every security function alone.

## Longer passwords do not stop phishing

This is another important boundary.

Suppose you use a highly random 30-character password.

If you enter that password into a convincing fake login page controlled by an attacker, its length does not prevent the attacker from receiving it.

The same applies to malware that can capture credentials on a compromised device.

NIST explicitly notes that attacks such as phishing, social engineering, and keystroke logging are not solved merely by increasing password complexity.

Password strength is therefore one layer of account security.

It is not protection against every way a credential can be stolen.

## Do not rotate good passwords just because the calendar changed

Another older password habit is mandatory rotation:

```text
change every 30 days
change every 60 days
change every 90 days
```

That often leads to predictable sequences such as:

```text
Office2026!01
Office2026!02
Office2026!03
```

Current NIST guidance says services should not require periodic password changes without a reason.

A password should be changed when there is evidence that it may have been compromised.

Examples include:

- the service reports a breach affecting credentials,
- you entered the password into a phishing page,
- malware may have captured it,
- you accidentally disclosed it,
- your password manager reports that a credential is compromised,
- you discover that the same password was reused elsewhere.

When replacing a compromised password, generate a completely new value rather than incrementing a number at the end.

## A breached password can be bad even when it looks strong

Consider:

```text
G7!xQ2#vM9@pL4
```

It looks random.

If that exact password has previously appeared in a breach and is now in an attacker's password list, its appearance no longer matters much.

Attackers can test known passwords before performing exhaustive guessing.

That is why modern password systems should compare proposed passwords against lists of common, expected, or compromised values.

NIST SP 800-63B-4 requires compliant verifiers to perform that kind of blocklist check when passwords are created or changed.

For users, the practical lesson is simpler:

**do not reuse an old password merely because it still looks complicated.**

## Do not paste real passwords into random strength-checking sites

A password checker may promise to tell you:

```text
Weak
Strong
Very strong
10 billion years to crack
```

Those labels can look authoritative.

But entering a real credential into an unfamiliar website creates a new disclosure risk.

If you want to understand how a password meter behaves, use a synthetic test password that is not connected to a real account.

For real credentials:

- generate them locally or through a trusted password manager,
- store them securely,
- avoid sending them through chat, email, support forms, or screenshots,
- do not publish them for "strength testing."

A password should become less exposed as the workflow progresses, not more exposed.

## Treat cracking-time estimates cautiously

Statements such as:

> This password would take 400 years to crack.

depend on assumptions that are rarely visible in a small strength meter.

The result can change dramatically depending on:

- whether the attack is online or offline,
- how the service stores password verifiers,
- how many guesses can be attempted,
- whether the password appears in known wordlists,
- whether the attacker knows something about its construction,
- available hardware.

A strength meter can be useful as a rough interface hint.

It is not a security proof.

The Anvil Tools Password Generator therefore treats its strength indicator as an estimate rather than a precise prediction of cracking time.

## Compatibility still matters

Modern guidance may discourage mandatory composition rules, but many real websites still enforce them.

You may encounter requirements such as:

```text
minimum 12 characters
maximum 20 characters
at least one uppercase letter
at least one number
at least one symbol
only these symbols: ! @ # $
```

In that situation, the password has to satisfy the receiving service.

A generator with selectable character groups can help produce a random value that fits those legacy rules.

A practical sequence is:

1. read the site's requirements,
2. choose the longest supported length you can reasonably use,
3. enable the required character groups,
4. generate a fresh value,
5. confirm the website accepts it,
6. save it immediately in your password manager.

Do not repeatedly weaken a password simply because the first generated value contains a symbol the site rejects.

Adjust the allowed character set and generate a new value.

## Recovery is part of password security

A secure login can still be undermined by weak account recovery.

Imagine:

```text
Password:
24 random characters

MFA:
enabled

Recovery:
easy-to-guess security question
```

The recovery path may become the easiest route into the account.

Review:

- recovery email addresses,
- recovery phone numbers,
- backup codes,
- trusted devices,
- security keys,
- account recovery contacts.

Remove recovery methods you no longer control.

Store backup codes somewhere appropriate and separate from the account itself.

An account is only as resilient as the paths that can reset or bypass its main credential.

## Prioritize important accounts first

If you currently reuse passwords across many services, replacing every credential at once can feel overwhelming.

Start with accounts that can unlock or reset other accounts.

A reasonable priority is:

```text
1. primary email
2. password manager
3. financial accounts
4. cloud storage
5. work or school accounts
6. social accounts
7. shopping and entertainment accounts
```

Your primary email is especially important because many services send password-reset links there.

A reused password on an email account therefore creates more risk than the same mistake on an isolated low-value service.

The long-term goal remains unique credentials everywhere.

Prioritization simply gives you a practical way to reach that goal.

## A practical password strategy

For an account that supports ordinary passwords, a strong workflow looks like this:

### Step 1: check the site's rules

Look for:

- minimum length,
- maximum length,
- required character types,
- allowed symbols.

### Step 2: generate a fresh password

For passwords that will be stored in a manager, favor a long random value rather than something you can remember.

### Step 3: make it unique

Do not reuse an existing account password.

### Step 4: save it before leaving

Store the credential in your password manager before closing the registration or password-change page.

### Step 5: enable MFA

Use an additional authentication factor when available.

### Step 6: save recovery information

Preserve backup codes or recovery instructions securely.

### Step 7: change the password if compromise is suspected

Do not wait for a scheduled rotation date.

This process is stronger than attempting to invent a clever memorable password for every account.

## Using the Anvil Tools Password Generator

The Anvil Tools Password Generator creates the password locally in your browser using a cryptographically secure random source.

The current tool supports lengths from 6 to 48 characters and allows you to include:

- uppercase letters,
- lowercase letters,
- numbers,
- symbols.

For normal account creation:

1. check the destination site's password requirements,
2. choose a long supported length,
3. select the character groups the site accepts or requires,
4. generate a fresh value,
5. copy it directly into the destination and your password manager,
6. do not reuse the generated value elsewhere.

The generator does not maintain a password history.

If you generate a password and leave without saving it, you should assume that value is gone.

That is a privacy advantage, but it also means you must store the credential yourself before leaving.

## What the generator cannot do for you

Generating a strong random password does not automatically:

- enable MFA,
- detect phishing,
- secure a compromised computer,
- protect a weak recovery email,
- prevent a website from mishandling passwords,
- detect whether you reuse the password somewhere else,
- remember the password later.

Those responsibilities belong to the rest of the account-security workflow.

The generator solves one specific problem:

**creating an unpredictable credential.**

That is valuable, but it is only one layer.

## A final account checklist

Before considering an important account finished, check:

```text
[ ] The password is sufficiently long.
[ ] It was randomly generated or uses a strong memorable strategy.
[ ] It is not reused on another account.
[ ] It is stored in a trusted password manager.
[ ] MFA is enabled where available.
[ ] Recovery information is current.
[ ] Backup codes are stored safely.
[ ] The password has not been shared through screenshots or messages.
[ ] You know how to respond if the credential is exposed.
```

You do not need to memorize every rule.

The core strategy is straightforward:

**long + unpredictable + unique + securely stored + MFA**

## Strong passwords are a system, not a formatting rule

A password does not become secure merely because it contains:

```text
A
a
1
!
```

Those characters can be useful inside a random password, but satisfying a visual checklist is not the same as building a strong account.

The more useful questions are:

- Is the password long enough?
- Was it generated unpredictably?
- Is it unique to this account?
- Can I store it safely?
- Is MFA enabled?
- Is the recovery path protected?
- Will I change it if compromise occurs?

For passwords you do not need to memorize, a long random credential stored in a password manager is usually the simplest approach.

For a password you genuinely must remember, prioritize length and avoid predictable quotations, personal information, and common patterns.

And remember that even an excellent password is still only one layer of account security.

## Try it yourself

Need a fresh random password that stays on your device while it is generated?

Try the [Anvil Tools Password Generator](/tools/password-generator.html).

Generate a different password for every real account and save it in a trusted password manager before leaving the page.

## Further reading

For current password and authentication guidance:

- [NIST SP 800-63B-4: Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [NIST: How Do I Create a Good Password?](https://www.nist.gov/cybersecurity-and-privacy/how-do-i-create-good-password)
- [NIST SP 800-63-4 Implementation Resources and FAQs](https://pages.nist.gov/800-63-4-Implementation-Resources/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Credential Stuffing Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html)
