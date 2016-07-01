all:
	rm -rf dist botan libsodium 2> /dev/null
	mkdir dist

	git clone -b stable https://github.com/jedisct1/libsodium.git
	sed -i 's|= buf|= (unsigned char*) buf|g' libsodium/src/libsodium/randombytes/randombytes.c
	cd libsodium ; emconfigure ./configure --enable-minimal --disable-shared 

	git clone https://github.com/randombit/botan.git
	rm -rf $$(find botan/src/lib -type d -name '*x86*')
	sed -i 's|BOTAN_HAS_LOCKING_ALLOCATOR|disabled_BOTAN_HAS_LOCKING_ALLOCATOR|g' botan/src/lib/base/secmem.h
	cd botan ; emconfigure ./configure.py --enable-modules=mce --minimized-build --cpu=i386 --os=nacl --cc=clang --cc-bin=emcc
	sed -i 's|BOTAN_USE_GCC_INLINE_ASM|disabled_BOTAN_USE_GCC_INLINE_ASM|g' botan/build/build.h
	sed -i 's|BOTAN_TARGET_CPU_IS_X86_FAMILY|disabled_BOTAN_TARGET_CPU_IS_X86_FAMILY|g' botan/build/build.h
	cd botan ; emmake make || echo

	bash -c ' \
		args="$$(echo " \
			--memory-init-file 0 \
			-DSECURITY_LEVEL=80 \
			-s TOTAL_MEMORY=104900000 -s TOTAL_STACK=52443072 \
			-s NO_DYNAMIC_EXECUTION=1 -s RUNNING_JS_OPTS=1 -s ASSERTIONS=0 \
			-s AGGRESSIVE_VARIABLE_ELIMINATION=1 -s ALIASING_FUNCTION_POINTERS=1 \
			-s FUNCTION_POINTER_ALIGNMENT=1 -s DISABLE_EXCEPTION_CATCHING=1 \
			-s RESERVED_FUNCTION_POINTERS=8 -s NO_FILESYSTEM=1 \
			-xc++ -std=c++1y \
			-Ilibsodium/src/libsodium/include/sodium \
			-Ibotan/build/include \
			libsodium/src/libsodium/randombytes/randombytes.c \
			$$(ls botan/build/obj/lib/*.o) \
			mceliece.cpp \
			-s EXPORTED_FUNCTIONS=\"[ \
				'"'"'_mceliecejs_init'"'"', \
				'"'"'_mceliecejs_keypair'"'"', \
				'"'"'_mceliecejs_encrypt'"'"', \
				'"'"'_mceliecejs_decrypt'"'"', \
				'"'"'_mceliecejs_public_key_bytes'"'"', \
				'"'"'_mceliecejs_secret_key_bytes'"'"', \
				'"'"'_mceliecejs_encrypted_bytes'"'"', \
				'"'"'_mceliecejs_decrypted_bytes'"'"' \
			]\" \
			--pre-js pre.js --post-js post.js \
		" | perl -pe "s/\s+/ /g" | perl -pe "s/\[ /\[/g" | perl -pe "s/ \]/\]/g")"; \
		\
		bash -c "emcc -O3 $$args -o dist/mceliece.js"; \
		bash -c "emcc -O0 -g4 $$args -s DISABLE_EXCEPTION_CATCHING=0 -s ASSERTIONS=2 -o dist/mceliece.debug.js"; \
	'

	rm -rf botan libsodium

clean:
	rm -rf dist botan libsodium
