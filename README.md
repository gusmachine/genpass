# genpass
A password generator implemented in JS/HTML.
[You can try this on github.io](https://gusmachine.github.io/genpass/genpass.html).

## Features
- Generates host-specific passwords from a master password.
- No network connection is needed. Everything is calculated within the browser.
- Secure password generation using scrypt with N=2^18. (N=2^20 took too long time)
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
- Better UI than copy-paste.
- Choose better password generation algorithm. [Argon2](https://github.com/antelle/argon2-browser)?
- Generate salt string automatically.
