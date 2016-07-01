#include "randombytes.h"
#include "botan/rng.h"
#include "botan/mceliece.h"
#include "botan/internal/mce_internal.h"


class Sodium_RNG : public Botan::RandomNumberGenerator {
public:
	void randomize (uint8_t out[], size_t num_bytes) override {
		randombytes_buf(out, num_bytes);
	}

	void clear () override {}

	std::string name () const override {
		return "Sodium_RNG";
	}

	size_t reseed_with_sources (
		Botan::Entropy_Sources&,
		size_t,
		std::chrono::milliseconds
	) override {
		return 0;
	}

	bool is_seeded () const override {
		return true;
	}

	void add_entropy (const uint8_t[], size_t) override {}

	Sodium_RNG () {
		randombytes_stir();
	}
};


uint16_t public_key_len;
uint16_t private_key_len;
uint16_t cyphertext_len;
uint16_t plaintext_len;
size_t params_n;
size_t params_t;
Sodium_RNG rng;


extern "C" {


void mceliecejs_init () {
	switch (SECURITY_LEVEL) {
		case 256:
			params_n	= 6624;
			params_t	= 115;
			break;

		case 191:
			params_n	= 4624;
			params_t	= 95;
			break;

		case 147:
			params_n	= 3408;
			params_t	= 67;
			break;

		case 128:
			params_n	= 2960;
			params_t	= 57;
			break;

		case 107:
			params_n	= 2480;
			params_t	= 45;
			break;

		case 80:
			params_n	= 1632;
			params_t	= 33;
			break;

		default:
			throw SECURITY_LEVEL;
	}

	Botan::McEliece_PrivateKey private_key(rng, params_n, params_t);
	Botan::McEliece_PublicKey public_key(*dynamic_cast<Botan::McEliece_PublicKey*>(&private_key));

	public_key_len	= public_key.x509_subject_public_key().size();
	private_key_len	= private_key.pkcs8_private_key().size();
	plaintext_len	= public_key.max_input_bits() / 8;

	Botan::secure_vector<uint8_t> cyphertext;
	Botan::secure_vector<uint8_t> plaintext(plaintext_len);
	Botan::secure_vector<uint8_t> error_mask;

	rng.randomize(&plaintext[0], plaintext_len);

	Botan::mceliece_encrypt(cyphertext, error_mask, plaintext, public_key, rng);

	cyphertext_len	= cyphertext.size();
}

long mceliecejs_public_key_bytes () {
	return public_key_len;
}

long mceliecejs_secret_key_bytes () {
	return private_key_len;
}

long mceliecejs_encrypted_bytes () {
	return cyphertext_len;
}

long mceliecejs_decrypted_bytes () {
	return plaintext_len;
}

void mceliecejs_keypair (
	uint8_t* public_key,
	uint8_t* private_key
) {
	Botan::McEliece_PrivateKey sk(rng, params_n, params_t);
	Botan::McEliece_PublicKey pk(*dynamic_cast<Botan::McEliece_PublicKey*>(&sk));

	auto pk_enc	= pk.x509_subject_public_key();
	auto sk_enc	= sk.pkcs8_private_key();

	memcpy(public_key, &pk_enc[0], public_key_len);
	memcpy(private_key, &sk_enc[0], private_key_len);
}

void mceliecejs_encrypt (
	uint8_t* message,
	long message_len,
	uint8_t* public_key,
	uint8_t* cyphertext
) {
	Botan::secure_vector<uint8_t> pt(message_len);
	std::vector<uint8_t> pk_enc(public_key_len);
	Botan::secure_vector<uint8_t> ct;
	Botan::secure_vector<uint8_t> error_mask;

	memcpy(&pt[0], message, message_len);
	memcpy(&pk_enc[0], public_key, public_key_len);

	Botan::McEliece_PublicKey pk(pk_enc);
	Botan::mceliece_encrypt(ct, error_mask, pt, pk, rng);

	memcpy(cyphertext, &ct[0], cyphertext_len);
}

void mceliecejs_decrypt (
	uint8_t* cyphertext,
	uint8_t* private_key,
	uint8_t* decrypted
) {
	Botan::secure_vector<uint8_t> ct(cyphertext_len);
	Botan::secure_vector<uint8_t> sk_enc(private_key_len);
	Botan::secure_vector<uint8_t> pt;
	Botan::secure_vector<uint8_t> error_mask;

	memcpy(&ct[0], cyphertext, cyphertext_len);
	memcpy(&sk_enc[0], private_key, private_key_len);

	Botan::McEliece_PrivateKey sk(sk_enc);
	Botan::mceliece_decrypt(pt, error_mask, ct, sk);

	memcpy(decrypted, &pt[0], plaintext_len);
}


}
