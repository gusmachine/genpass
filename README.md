# genpass
A password generator implemented in JS/HTML.
[You can try this on github.io](https://gusmachine.github.io/genpass/genpass.html).

## Features
- Generates host-specific passwords from a master password.
- No network connection is needed. Everything is calculated within the browser.
- Secure password generation using pbkdf2-sha256 with 6,000 iterations.
- Several character sets to choose from to meet the password requirements.
- Passwords in invisible text to avoid shoulder hacking. You can still copy-paste.

## Warning
- Still WIP. I'll change the algorithm at any time, which results in
  unexpected password string changes.

## How to use
TBA

## How to contribute
TBA

## TODOes
- Clarify what libraries are used.
- Not-broken CSS.
- Mobile-friendly UI.
- Better UI than copy-paste.
- Choose better password generation algorithm. Argon2?
- Generate salt string automatically.
