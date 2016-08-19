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


var mceliece	= {
	publicKeyLength: Module._mceliecejs_public_key_bytes(),
	privateKeyLength: Module._mceliecejs_private_key_bytes(),
	encryptedDataLength: Module._mceliecejs_encrypted_bytes(),
	decryptedDataLength: Module._mceliecejs_decrypted_bytes(),

	keyPair: function () {
		var publicKeyBuffer		= Module._malloc(mceliece.publicKeyLength);
		var privateKeyBuffer	= Module._malloc(mceliece.privateKeyLength);

		try {
			Module._mceliecejs_keypair(
				publicKeyBuffer,
				privateKeyBuffer
			);

			return {
				publicKey: dataResult(publicKeyBuffer, mceliece.publicKeyLength),
				privateKey: dataResult(privateKeyBuffer, mceliece.privateKeyLength)
			};
		}
		finally {
			dataFree(publicKeyBuffer);
			dataFree(privateKeyBuffer);
		}
	},

	encrypt: function (message, publicKey) {
		var messageBuffer	= Module._malloc(message.length + 4);
		var publicKeyBuffer	= Module._malloc(mceliece.publicKeyLength);
		var encryptedBuffer	= Module._malloc(mceliece.encryptedDataLength);

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

			return dataResult(encryptedBuffer, mceliece.encryptedDataLength);
		}
		finally {
			dataFree(messageBuffer);
			dataFree(publicKeyBuffer);
			dataFree(encryptedBuffer);
		}
	},

	decrypt: function (encrypted, privateKey) {
		var encryptedBuffer		= Module._malloc(mceliece.encryptedDataLength);
		var privateKeyBuffer	= Module._malloc(mceliece.privateKeyLength);
		var decryptedBuffer		= Module._malloc(mceliece.decryptedDataLength);

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
	}
};



return mceliece;

}());

self.mceliece	= mceliece;