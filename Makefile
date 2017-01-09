all:
	rm -rf dist HyMES libsodium sodiumutil pre.tmp.js 2> /dev/null
	mkdir dist

	git clone -b stable https://github.com/jedisct1/libsodium.git
	cd libsodium ; emconfigure ./configure --enable-minimal --disable-shared

	git clone https://github.com/cyph/sodiumutil.git
	cp pre.js pre.tmp.js
	cat sodiumutil/dist/sodiumutil.js | perl -pe 's/if\(typeof module!=="undefined".*//g' >> pre.tmp.js

	wget https://www.rocq.inria.fr/secret/MCE/HyMES.tar.gz
	tar xzf HyMES.tar.gz
	rm HyMES.tar.gz
	sed -i 's|__inline ||g' HyMES/keypair.c
	rm HyMES/precomp.c

	cp config/* HyMES/

	bash -c ' \
		args="$$(echo " \
			--memory-init-file 0 \
			-s TOTAL_MEMORY=4194304 -s TOTAL_STACK=2097152 \
			-s NO_DYNAMIC_EXECUTION=1 -s RUNNING_JS_OPTS=1 -s ASSERTIONS=0 \
			-s AGGRESSIVE_VARIABLE_ELIMINATION=1 -s ALIASING_FUNCTION_POINTERS=1 \
			-s FUNCTION_POINTER_ALIGNMENT=1 -s DISABLE_EXCEPTION_CATCHING=1 \
			-s RESERVED_FUNCTION_POINTERS=8 -s NO_FILESYSTEM=1 \
			-Ilibsodium/src/libsodium/include/sodium \
			-IHyMES \
			libsodium/src/libsodium/randombytes/randombytes.c \
			$$(ls HyMES/*.c | grep -v main) \
			mceliece.c \
			-s EXPORTED_FUNCTIONS=\"[ \
				'"'"'_mceliecejs_init'"'"', \
				'"'"'_mceliecejs_keypair'"'"', \
				'"'"'_mceliecejs_encrypt'"'"', \
				'"'"'_mceliecejs_decrypt'"'"', \
				'"'"'_mceliecejs_public_key_bytes'"'"', \
				'"'"'_mceliecejs_private_key_bytes'"'"', \
				'"'"'_mceliecejs_encrypted_bytes'"'"', \
				'"'"'_mceliecejs_decrypted_bytes'"'"', \
				'"'"'_mceliecejs_message_bytes'"'"' \
			]\" \
			--pre-js pre.tmp.js --post-js post.js \
		" | perl -pe "s/\s+/ /g" | perl -pe "s/\[ /\[/g" | perl -pe "s/ \]/\]/g")"; \
		\
		bash -c "emcc -O3 $$args -o dist/mceliece.js"; \
		bash -c "emcc -O0 -g4 $$args -s DISABLE_EXCEPTION_CATCHING=0 -s ASSERTIONS=2 -o dist/mceliece.debug.js"; \
	'

	sed -i 's|require(|eval("require")(|g' dist/mceliece.js

	rm -rf HyMES libsodium sodiumutil pre.tmp.js

clean:
	rm -rf dist HyMES libsodium sodiumutil pre.tmp.js
