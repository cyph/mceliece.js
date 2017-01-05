#include <stdlib.h>
#include <time.h>
#include "mceliece.h"
#include "randombytes.h"
#include "sizes.h"


void mceliecejs_init () {
	size_t randomstate_len	= 256;
	char* randomstate		= (char*) malloc(randomstate_len);

	randombytes_stir();
	randombytes_buf(randomstate, randomstate_len);
	initstate(time(NULL), randomstate, randomstate_len);
}

long mceliecejs_public_key_bytes () {
	return PUBLICKEY_BYTES;
}

long mceliecejs_private_key_bytes () {
	return SECRETKEY_BYTES;
}

long mceliecejs_encrypted_bytes () {
	return CIPHERTEXT_BYTES;
}

long mceliecejs_decrypted_bytes () {
	return CLEARTEXT_BYTES;
}

long mceliecejs_message_bytes () {
	return MESSAGE_BYTES - 5;
}

void mceliecejs_keypair (
	uint8_t* public_key,
	uint8_t* private_key
) {
	keypair(private_key, public_key);
}

void mceliecejs_encrypt (
	uint8_t* message,
	uint8_t* public_key,
	uint8_t* cyphertext
) {
	encrypt_block(cyphertext, message, public_key);
}

void mceliecejs_decrypt (
	uint8_t* cyphertext,
	uint8_t* private_key,
	uint8_t* decrypted
) {
	decrypt_block(decrypted, cyphertext, private_key);
}
