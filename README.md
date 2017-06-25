# mceliece.js

## Overview

The [McEliece](https://en.wikipedia.org/wiki/McEliece_cryptosystem) post-quantum asymmetric
cipher compiled to WebAssembly using [Emscripten](https://github.com/kripken/emscripten).
A simple JavaScript wrapper is provided to make McEliece easy to use in web applications.

The parameters are configured to slightly above 128-bit strength.

The underlying cipher implementation in use is [McBits](https://www.win.tue.nl/~tchou/mcbits).

## Example Usage

	(async () => {
		const keyPair /*: {privateKey: Uint8Array; publicKey: Uint8Array} */ =
			await mceliece.keyPair()
		;

		const plaintext /*: Uint8Array */ =
			new Uint8Array([104, 101, 108, 108, 111, 0]) // "hello"
		;

		const encrypted /*: Uint8Array */ =
			await mceliece.encrypt(plaintext, keyPair.publicKey)
		;

		const decrypted /*: Uint8Array */ =
			await mceliece.decrypt(encrypted, keyPair.privateKey) // same as plaintext
		;

		console.log(keyPair);
		console.log(plaintext);
		console.log(encrypted);
		console.log(decrypted);
	})();

Note: McEliece generally shouldn't be used to directly encrypt your data; in most cases, you'll
want to pair it with a symmetric cipher and use it to encrypt symmetric keys.

## Changelog

Breaking changes in major versions:

3.0.0:

* As part of upgrading from asm.js to WebAssembly (with asm.js included as a fallback),
the API is fully asynchronous.

2.0.0:

* Switched to McBits from [HyMES](https://www.rocq.inria.fr/secret/CBCrypto/index.php?pg=hymes).

* Removed some undocumented functions as part of minor API cleanup.

## Credits

Thanks to [Shane Curran](https://github.com/narruc) for donating the npm package name!
