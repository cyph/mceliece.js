;

function dataResult (buffer, bytes) {
	return new Uint8Array(
		new Uint8Array(Module.HEAPU8.buffer, buffer, bytes)
	);
}

function dataFree (buffer) {
	try {
		Module._free(buffer);
	}
	catch (_) {}
}


Module._mceliecejs_init();


var decryptedBytes	= Module._mceliecejs_decrypted_bytes();

var mceliece	= {
	publicKeyBytes: Module._mceliecejs_public_key_bytes(),
	privateKeyBytes: Module._mceliecejs_private_key_bytes(),
	cyphertextBytes: Module._mceliecejs_encrypted_bytes(),
	plaintextBytes: Module._mceliecejs_message_bytes(),

	/* Backwards compatibility */
	publicKeyLength: Module._mceliecejs_public_key_bytes(),
	privateKeyLength: Module._mceliecejs_private_key_bytes(),
	encryptedDataLength: Module._mceliecejs_encrypted_bytes(),
	decryptedDataLength: Module._mceliecejs_message_bytes(),

	keyPair: function () {
		var publicKeyBuffer		= Module._malloc(mceliece.publicKeyBytes);
		var privateKeyBuffer	= Module._malloc(mceliece.privateKeyBytes);

		try {
			Module._mceliecejs_keypair(
				publicKeyBuffer,
				privateKeyBuffer
			);

			return {
				publicKey: dataResult(publicKeyBuffer, mceliece.publicKeyBytes),
				privateKey: dataResult(privateKeyBuffer, mceliece.privateKeyBytes)
			};
		}
		finally {
			dataFree(publicKeyBuffer);
			dataFree(privateKeyBuffer);
		}
	},

	encrypt: function (message, publicKey) {
		var messageBuffer	= Module._malloc(message.length + 4);
		var publicKeyBuffer	= Module._malloc(mceliece.publicKeyBytes);
		var encryptedBuffer	= Module._malloc(mceliece.cyphertextBytes);

		Module.writeArrayToMemory(message, messageBuffer + 4);
		Module.writeArrayToMemory(publicKey, publicKeyBuffer);

		Module.writeArrayToMemory(
			new Uint8Array(
				new Uint32Array([message.length]).buffer
			),
			messageBuffer
		);

		try {
			Module._mceliecejs_encrypt(
				messageBuffer,
				publicKeyBuffer,
				encryptedBuffer
			);

			return dataResult(encryptedBuffer, mceliece.cyphertextBytes);
		}
		finally {
			dataFree(messageBuffer);
			dataFree(publicKeyBuffer);
			dataFree(encryptedBuffer);
		}
	},

	decrypt: function (encrypted, privateKey) {
		var encryptedBuffer		= Module._malloc(mceliece.cyphertextBytes);
		var privateKeyBuffer	= Module._malloc(mceliece.privateKeyBytes);
		var decryptedBuffer		= Module._malloc(decryptedBytes);

		Module.writeArrayToMemory(encrypted, encryptedBuffer);
		Module.writeArrayToMemory(privateKey, privateKeyBuffer);

		try {
			Module._mceliecejs_decrypt(
				encryptedBuffer,
				privateKeyBuffer,
				decryptedBuffer
			);

			return dataResult(
				decryptedBuffer + 4,
				new Uint32Array(
					Module.HEAPU8.buffer,
					decryptedBuffer,
					1
				)[0]
			);
		}
		finally {
			dataFree(encryptedBuffer);
			dataFree(privateKeyBuffer);
			dataFree(decryptedBuffer);
		}
	},

	/** For compatibility with narruc/node-mceliece. */
	stringToUTF8Array: function (s) {
		return Array.prototype.slice.apply(sodiumUtil.from_string(s));
	},

	/** For compatibility with narruc/node-mceliece. */
	UTF8ArraytoString: function (a) {
		return sodiumUtil.to_string(new Uint8Array(a));
	}
};



return mceliece;

}());


if (typeof module !== 'undefined' && module.exports) {
	mceliece.mceliece	= mceliece;
	module.exports		= mceliece;
}
else {
	self.mceliece		= mceliece;
}
