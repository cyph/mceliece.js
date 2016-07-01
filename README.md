# mceliece.js

## Overview

The [McEliece](https://botan.randombit.net/manual/mceliece.html) post-quantum asymmetric
cipher compiled to pure JavaScript using [Emscripten](https://github.com/kripken/emscripten).
A simple wrapper is provided to make McEliece easy to use in Web applications.

The default security level is 256-bit. To change this, modify `-DSECURITY_LEVEL=256` in Makefile
and rebuild with `make`. Allowed security levels are 256-bit, 191-bit, 147-bit, 128-bit, 107-bit,
and 80-bit.

## Example Usage

	var keyPair		= mceliece.keyPair();
	var plaintext	= new Uint8Array([104, 101, 108, 108, 111, 0]); // "hello"

	var encrypted	= mceliece.encrypt(plaintext, keyPair.publicKey);
	var decrypted	= mceliece.decrypt(encrypted, keyPair.privateKey); // same as plaintext

Note: McEliece generally shouldn't be used to directly encrypt your data; in most cases, you'll
want to pair it with a symmetric cipher and use it to encrypt symmetric keys.
