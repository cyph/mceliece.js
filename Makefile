all:
	rm -rf dist libsodium mcbits sodiumutil pre.tmp.js 2> /dev/null
	mkdir dist

	git clone --depth 1 -b stable https://github.com/jedisct1/libsodium
	cd libsodium ; emconfigure ./configure --enable-minimal --disable-shared

	git clone --depth 1 https://github.com/cyph/sodiumutil
	cp pre.js pre.tmp.js
	cat sodiumutil/dist/sodiumutil.js | perl -pe 's/if\(typeof module!=="undefined".*//g' >> pre.tmp.js

	wget https://www.win.tue.nl/~tchou/code/mcbits_new.tar.gz
	tar xzf mcbits_new.tar.gz
	mv crypto_encrypt/mcbits/new mcbits
	rm -rf crypto_encrypt mcbits_new.tar.gz
	grep -rl crypt mcbits | xargs -I% sed -i 's|crypt(|crypt_mcbits(|g' %
	sed -i 's|crypto_encrypt_mcbits|crypto_encrypt|g' mcbits/operations.c
	sed -i 's|_keccakc1024||g' mcbits/operations.c
	sed -i 's|salsa20_ref|salsa20|g' mcbits/operations.c

	wget https://bench.cr.yp.to/supercop/supercop-20170228.tar.xz
	unxz < supercop-20170228.tar.xz | tar -xf -
	mv supercop-20170228/crypto_hash/keccakc1024/simple/Keccak-simple* mcbits/
	rm -rf supercop*

	bash -c ' \
		args="$$(echo " \
			--memory-init-file 0 \
			-DCYPHERTEXT_LEN=512 \
			-s TOTAL_MEMORY=16777216 -s TOTAL_STACK=8388608 \
			-s NO_DYNAMIC_EXECUTION=1 -s RUNNING_JS_OPTS=1 -s ASSERTIONS=0 \
			-s AGGRESSIVE_VARIABLE_ELIMINATION=1 -s ALIASING_FUNCTION_POINTERS=1 \
			-s FUNCTION_POINTER_ALIGNMENT=1 -s DISABLE_EXCEPTION_CATCHING=1 \
			-s RESERVED_FUNCTION_POINTERS=8 -s NO_FILESYSTEM=1 \
			-Ilibsodium/src/libsodium/include/sodium \
			-Imcbits \
			-I. \
			libsodium/src/libsodium/randombytes/randombytes.c \
			libsodium/src/libsodium/sodium/utils.c \
			$$(find libsodium/src/libsodium/crypto_core/salsa -type f -name "*.c" | tr "\n" " ") \
			$$(find libsodium/src/libsodium/crypto_onetimeauth/poly1305 -type f -name "*.c" | tr "\n" " ") \
			$$(find libsodium/src/libsodium/crypto_stream/salsa20 -type f -name "*.c" | tr "\n" " ") \
			$$(find libsodium/src/libsodium/crypto_verify -type f -name "*.c" | tr "\n" " ") \
			$$(ls mcbits/*.c) \
			mceliece.c \
			-s EXPORTED_FUNCTIONS=\"[ \
				'"'"'_mceliecejs_init'"'"', \
				'"'"'_mceliecejs_keypair'"'"', \
				'"'"'_mceliecejs_encrypt'"'"', \
				'"'"'_mceliecejs_decrypt'"'"', \
				'"'"'_mceliecejs_public_key_bytes'"'"', \
				'"'"'_mceliecejs_private_key_bytes'"'"', \
				'"'"'_mceliecejs_encrypted_bytes'"'"', \
				'"'"'_mceliecejs_decrypted_bytes'"'"' \
			]\" \
			--pre-js pre.tmp.js --post-js post.js \
		" | perl -pe "s/\s+/ /g" | perl -pe "s/\[ /\[/g" | perl -pe "s/ \]/\]/g")"; \
		\
		bash -c "emcc -O3 $$args -o dist/mceliece.js"; \
		bash -c "emcc -O0 -g4 $$args -s DISABLE_EXCEPTION_CATCHING=0 -s ASSERTIONS=2 -o dist/mceliece.debug.js"; \
	'

	sed -i 's|require(|eval("require")(|g' dist/mceliece.js

	rm -rf libsodium mcbits sodiumutil pre.tmp.js

clean:
	rm -rf dist libsodium mcbits sodiumutil pre.tmp.js
