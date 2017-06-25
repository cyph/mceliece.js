;

function dataReturn (returnValue, result) {
	if (returnValue === 0) {
		return result;
	}
	else {
		throw new Error('McEliece error: ' + returnValue);
	}
}

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


var Module, publicKeyBytes, privateKeyBytes, cyphertextBytes, plaintextBytes;

var initiated	= moduleReady.then(function () {
	Module	= finalModule;

	Module._mceliecejs_init();

	publicKeyBytes	= Module._mceliecejs_public_key_bytes();
	privateKeyBytes	= Module._mceliecejs_private_key_bytes();
	cyphertextBytes	= Module._mceliecejs_encrypted_bytes();
	plaintextBytes	= Module._mceliecejs_decrypted_bytes();
});


var mceliece	= {
	publicKeyBytes: initiated.then(function () { return publicKeyBytes; }),
	privateKeyBytes: initiated.then(function () { return privateKeyBytes; }),
	cyphertextBytes: initiated.then(function () { return cyphertextBytes; }),
	plaintextBytes: initiated.then(function () { return plaintextBytes; }),

	keyPair: function () { return initiated.then(function () {
		var publicKeyBuffer		= Module._malloc(publicKeyBytes);
		var privateKeyBuffer	= Module._malloc(privateKeyBytes);

		try {
			var returnValue	= Module._mceliecejs_keypair(
				publicKeyBuffer,
				privateKeyBuffer
			);

			return dataReturn(returnValue, {
				publicKey: dataResult(publicKeyBuffer, publicKeyBytes),
				privateKey: dataResult(privateKeyBuffer, privateKeyBytes)
			});
		}
		finally {
			dataFree(publicKeyBuffer);
			dataFree(privateKeyBuffer);
		}
	}); },

	encrypt: function (message, publicKey) { return initiated.then(function () {
		if (message.length > plaintextBytes) {
			throw new Error('Plaintext length exceeds mceliece.plaintextBytes.');
		}

		var messageBuffer	= Module._malloc(message.length);
		var publicKeyBuffer	= Module._malloc(publicKeyBytes);
		var encryptedBuffer	= Module._malloc(cyphertextBytes);

		Module.writeArrayToMemory(message, messageBuffer);
		Module.writeArrayToMemory(publicKey, publicKeyBuffer);

		try {
			var returnValue	= Module._mceliecejs_encrypt(
				messageBuffer,
				message.length,
				publicKeyBuffer,
				encryptedBuffer
			);

			return dataReturn(
				returnValue,
				dataResult(encryptedBuffer, cyphertextBytes)
			);
		}
		finally {
			dataFree(messageBuffer);
			dataFree(publicKeyBuffer);
			dataFree(encryptedBuffer);
		}
	}); },

	decrypt: function (encrypted, privateKey) { return initiated.then(function () {
		var encryptedBuffer		= Module._malloc(cyphertextBytes);
		var privateKeyBuffer	= Module._malloc(privateKeyBytes);
		var decryptedBuffer		= Module._malloc(plaintextBytes);

		Module.writeArrayToMemory(encrypted, encryptedBuffer);
		Module.writeArrayToMemory(privateKey, privateKeyBuffer);

		try {
			var returnValue	= Module._mceliecejs_decrypt(
				encryptedBuffer,
				privateKeyBuffer,
				decryptedBuffer
			);

			if (returnValue >= 0) {
				return dataResult(decryptedBuffer, returnValue);
			}
			else {
				dataReturn(-returnValue);
			}
		}
		finally {
			dataFree(encryptedBuffer);
			dataFree(privateKeyBuffer);
			dataFree(decryptedBuffer);
		}
	}); }
};



return mceliece;

}()); }());


if (typeof module !== 'undefined' && module.exports) {
	mceliece.mceliece	= mceliece;
	module.exports		= mceliece;
}
else {
	self.mceliece		= mceliece;
}
