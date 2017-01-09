# mceliece.js

## Overview

The [McEliece](https://en.wikipedia.org/wiki/McEliece_cryptosystem) post-quantum asymmetric
cipher compiled to pure JavaScript using [Emscripten](https://github.com/kripken/emscripten).
The specific implementation in use is INRIA's [HyMES](https://www.rocq.inria.fr/secret/CBCrypto/index.php?pg=hymes).
A simple wrapper is provided to make McEliece easy to use in web applications.

The parameters are configured to slightly above 128-bit strength.

## Example Usage

	const keyPair /*: {privateKey: Uint8Array; publicKey: Uint8Array} */ =
		mceliece.keyPair()
	;

	const plaintext /*: Uint8Array */ =
		new Uint8Array([104, 101, 108, 108, 111, 0]) // "hello"
	;

	const encrypted /*: Uint8Array */ =
		mceliece.encrypt(plaintext, keyPair.publicKey)
	;

	const decrypted /*: Uint8Array */ =
		mceliece.decrypt(encrypted, keyPair.privateKey) // same as plaintext
	;

Note: McEliece generally shouldn't be used to directly encrypt your data; in most cases, you'll
want to pair it with a symmetric cipher and use it to encrypt symmetric keys.

## Credits

Thanks to [Shane Curran](https://github.com/narruc) for donating the npm package name!
