all:
	rm -rf dist HyMES libsodium 2> /dev/null
	mkdir dist

	git clone -b stable https://github.com/jedisct1/libsodium.git
	cd libsodium ; emconfigure ./configure --enable-minimal --disable-shared 

	wget https://www.rocq.inria.fr/secret/MCE/HyMES.tar.gz
	tar xzf HyMES.tar.gz
	rm HyMES.tar.gz
	sed -i 's|__inline ||g' HyMES/keypair.c
	sed -i 's|l2|precomp_l2|g' HyMES/precomp.c
	sed -i 's|is_leaf|precomp_is_leaf|g' HyMES/precomp.c

	cp config/* HyMES/

	bash -c ' \
		args="$$(echo " \
			--memory-init-file 0 \
			-s TOTAL_MEMORY=104900000 -s TOTAL_STACK=52443072 \
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
				'"'"'_mceliecejs_decrypted_bytes'"'"' \
			]\" \
			--pre-js pre.js --post-js post.js \
		" | perl -pe "s/\s+/ /g" | perl -pe "s/\[ /\[/g" | perl -pe "s/ \]/\]/g")"; \
		\
		bash -c "emcc -O3 $$args -o dist/mceliece.js"; \
		bash -c "emcc -O0 -g4 $$args -s DISABLE_EXCEPTION_CATCHING=0 -s ASSERTIONS=2 -o dist/mceliece.debug.js"; \
	'

	rm -rf HyMES libsodium

clean:
	rm -rf dist HyMES libsodium
