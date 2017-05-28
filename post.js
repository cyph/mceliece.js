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


Module._mceliecejs_init();


var mceliece	= {
	publicKeyBytes: Module._mceliecejs_public_key_bytes(),
	privateKeyBytes: Module._mceliecejs_private_key_bytes(),
	cyphertextBytes: Module._mceliecejs_encrypted_bytes(),
	plaintextBytes: Module._mceliecejs_decrypted_bytes(),

	keyPair: function () {
		var publicKeyBuffer		= Module._malloc(mceliece.publicKeyBytes);
		var privateKeyBuffer	= Module._malloc(mceliece.privateKeyBytes);

		try {
			var returnValue	= Module._mceliecejs_keypair(
				publicKeyBuffer,
				privateKeyBuffer
			);

			return dataReturn(returnValue, {
				publicKey: dataResult(publicKeyBuffer, mceliece.publicKeyBytes),
				privateKey: dataResult(privateKeyBuffer, mceliece.privateKeyBytes)
			});
		}
		finally {
			dataFree(publicKeyBuffer);
			dataFree(privateKeyBuffer);
		}
	},

	encrypt: function (message, publicKey) {
		if (message.length > mceliece.plaintextBytes) {
			throw new Error('Plaintext length exceeds mceliece.plaintextBytes.');
		}

		var messageBuffer	= Module._malloc(message.length);
		var publicKeyBuffer	= Module._malloc(mceliece.publicKeyBytes);
		var encryptedBuffer	= Module._malloc(mceliece.cyphertextBytes);

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
				dataResult(encryptedBuffer, mceliece.cyphertextBytes)
			);
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
		var decryptedBuffer		= Module._malloc(mceliece.plaintextBytes);

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
