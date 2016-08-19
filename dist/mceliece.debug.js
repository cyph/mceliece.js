var mceliece = (function () {

// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_WEB = typeof window === 'object';
// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) {
    var ret = Module['read'](filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  if (!Module['thisProgram']) {
    if (process['argv'].length > 1) {
      Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
    } else {
      Module['thisProgram'] = 'unknown-program';
    }
  }

  Module['arguments'] = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });

  Module['inspect'] = function () { return '[Emscripten Module object]'; };
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    var data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WORKER) {
    Module['load'] = importScripts;
  }

  if (typeof Module['setWindowTitle'] === 'undefined') {
    Module['setWindowTitle'] = function(title) { document.title = title };
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  throw 'NO_DYNAMIC_EXECUTION was set, cannot eval';
}
if (!Module['load'] && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
if (!Module['thisProgram']) {
  Module['thisProgram'] = './this.program';
}

// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in: 
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at: 
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  setTempRet0: function (value) {
    tempRet0 = value;
  },
  getTempRet0: function () {
    return tempRet0;
  },
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  STACK_ALIGN: 16,
  prepVararg: function (ptr, type) {
    if (type === 'double' || type === 'i64') {
      // move so the load is aligned
      if (ptr & 7) {
        assert((ptr & 7) === 4);
        ptr += 4;
      }
    } else {
      assert((ptr & 3) === 0);
    }
    return ptr;
  },
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      assert(args.length == sig.length-1);
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      assert(sig.length == 1);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [null,null,null,null,null,null,null,null],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 1*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-1)/1] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[sig]) {
      Runtime.funcWrappers[sig] = {};
    }
    var sigCache = Runtime.funcWrappers[sig];
    if (!sigCache[func]) {
      sigCache[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return sigCache[func];
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+15)&-16);(assert((((STACKTOP|0) < (STACK_MAX|0))|0))|0); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + (assert(!staticSealed),size))|0;STATICTOP = (((STATICTOP)+15)&-16); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + (assert(DYNAMICTOP > 0),size))|0;DYNAMICTOP = (((DYNAMICTOP)+15)&-16); if (DYNAMICTOP >= TOTAL_MEMORY) { var success = enlargeMemory(); if (!success) { DYNAMICTOP = ret;  return 0; } }; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 16))*(quantum ? quantum : 16); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}



Module["Runtime"] = Runtime;



//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  if (!func) {
    abort('NO_DYNAMIC_EXECUTION was set, cannot eval - ccall/cwrap are not functional');
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

var cwrap, ccall;
(function(){
  var JSfuncs = {
    // Helpers for cwrap -- it can't refer to Runtime directly because it might
    // be renamed by closure, instead it calls JSfuncs['stackSave'].body to find
    // out what the minified function name is.
    'stackSave': function() {
      Runtime.stackSave()
    },
    'stackRestore': function() {
      Runtime.stackRestore()
    },
    // type conversion from js to c
    'arrayToC' : function(arr) {
      var ret = Runtime.stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    },
    'stringToC' : function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        ret = Runtime.stackAlloc((str.length << 2) + 1);
        writeStringToMemory(str, ret);
      }
      return ret;
    }
  };
  // For fast lookup of conversion functions
  var toC = {'string' : JSfuncs['stringToC'], 'array' : JSfuncs['arrayToC']};

  // C calling interface. 
  ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    assert(returnType !== 'array', 'Return type should not be "array".');
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = Runtime.stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func.apply(null, cArgs);
    if ((!opts || !opts.async) && typeof EmterpreterAsync === 'object') {
      assert(!EmterpreterAsync.state, 'cannot start async op with normal JS calling ccall');
    }
    if (opts && opts.async) assert(!returnType, 'async ccalls cannot return values');
    if (returnType === 'string') ret = Pointer_stringify(ret);
    if (stack !== 0) {
      if (opts && opts.async) {
        EmterpreterAsync.asyncFinalizers.push(function() {
          Runtime.stackRestore(stack);
        });
        return;
      }
      Runtime.stackRestore(stack);
    }
    return ret;
  }

  // NO_DYNAMIC_EXECUTION is on, so we can't use the fast version of cwrap.
  // Fall back to returning a bound version of ccall.
  cwrap = function cwrap(ident, returnType, argTypes) {
    return function() {
      Runtime.warnOnce('NO_DYNAMIC_EXECUTION was set, '
                     + 'using slow cwrap implementation');
      return ccall(ident, returnType, argTypes, arguments);
    }
  }
})();
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;

function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module["setValue"] = setValue;


function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module["getValue"] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module["allocate"] = allocate;

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!staticSealed) return Runtime.staticAlloc(size);
  if ((typeof _sbrk !== 'undefined' && !_sbrk.called) || !runtimeInitialized) return Runtime.dynamicAlloc(size);
  return _malloc(size);
}
Module["getMemory"] = getMemory;

function Pointer_stringify(ptr, /* optional */ length) {
  if (length === 0 || !ptr) return '';
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = 0;
  var t;
  var i = 0;
  while (1) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))>>0)];
    hasUtf |= t;
    if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (hasUtf < 128) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  return Module['UTF8ToString'](ptr);
}
Module["Pointer_stringify"] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAP8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}
Module["AsciiToString"] = AsciiToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}
Module["stringToAscii"] = stringToAscii;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

function UTF8ArrayToString(u8Array, idx) {
  var u0, u1, u2, u3, u4, u5;

  var str = '';
  while (1) {
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    u0 = u8Array[idx++];
    if (!u0) return str;
    if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
    u1 = u8Array[idx++] & 63;
    if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
    u2 = u8Array[idx++] & 63;
    if ((u0 & 0xF0) == 0xE0) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      u3 = u8Array[idx++] & 63;
      if ((u0 & 0xF8) == 0xF0) {
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
      } else {
        u4 = u8Array[idx++] & 63;
        if ((u0 & 0xFC) == 0xF8) {
          u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4;
        } else {
          u5 = u8Array[idx++] & 63;
          u0 = ((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | u5;
        }
      }
    }
    if (u0 < 0x10000) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    }
  }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF8ToString(ptr) {
  return UTF8ArrayToString(HEAPU8,ptr);
}
Module["UTF8ToString"] = UTF8ToString;

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x1FFFFF) {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x3FFFFFF) {
      if (outIdx + 4 >= endIdx) break;
      outU8Array[outIdx++] = 0xF8 | (u >> 24);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 5 >= endIdx) break;
      outU8Array[outIdx++] = 0xFC | (u >> 30);
      outU8Array[outIdx++] = 0x80 | ((u >> 24) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}
Module["stringToUTF8Array"] = stringToUTF8Array;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}
Module["stringToUTF8"] = stringToUTF8;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      ++len;
    } else if (u <= 0x7FF) {
      len += 2;
    } else if (u <= 0xFFFF) {
      len += 3;
    } else if (u <= 0x1FFFFF) {
      len += 4;
    } else if (u <= 0x3FFFFFF) {
      len += 5;
    } else {
      len += 6;
    }
  }
  return len;
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module["UTF16ToString"] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}
Module["stringToUTF16"] = stringToUTF16;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}
Module["lengthBytesUTF16"] = lengthBytesUTF16;

function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module["UTF32ToString"] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}
Module["stringToUTF32"] = stringToUTF32;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}
Module["lengthBytesUTF32"] = lengthBytesUTF32;

function demangle(func) {
  var hasLibcxxabi = !!Module['___cxa_demangle'];
  if (hasLibcxxabi) {
    try {
      var buf = _malloc(func.length);
      writeStringToMemory(func.substr(1), buf);
      var status = _malloc(4);
      var ret = Module['___cxa_demangle'](buf, 0, 0, status);
      if (getValue(status, 'i32') === 0 && ret) {
        return Pointer_stringify(ret);
      }
      // otherwise, libcxxabi failed, we can try ours which may return a partial result
    } catch(e) {
      // failure when using libcxxabi, we can try ours which may return a partial result
    } finally {
      if (buf) _free(buf);
      if (status) _free(status);
      if (ret) _free(ret);
    }
  }
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    if (rawList) {
      if (ret) {
        list.push(ret + '?');
      }
      return list;
    } else {
      return ret + flushList();
    }
  }
  var parsed = func;
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    parsed = parse();
  } catch(e) {
    parsed += '?';
  }
  if (parsed.indexOf('?') >= 0 && !hasLibcxxabi) {
    Runtime.warnOnce('warning: a problem occurred in builtin C++ name demangling; build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
  }
  return parsed;
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error(0);
    } catch(e) {
      err = e;
    }
    if (!err.stack) {
      return '(no stack trace available)';
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  return demangleAll(jsStackTrace());
}
Module["stackTrace"] = stackTrace;

// Memory management

var PAGE_SIZE = 4096;

function alignMemoryPage(x) {
  if (x % 4096 > 0) {
    x += (4096 - (x % 4096));
  }
  return x;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk


function abortOnCannotGrowMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which adjusts the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
}

function enlargeMemory() {
  abortOnCannotGrowMemory();
}


var TOTAL_STACK = Module['TOTAL_STACK'] || 52443072;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 104900000;

var totalMemory = 64*1024;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be compliant with the asm.js spec (and given that TOTAL_STACK=' + TOTAL_STACK + ')');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer;



buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);


// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['buffer'] = buffer;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module["addOnPreRun"] = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module["addOnInit"] = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module["addOnPreMain"] = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module["addOnExit"] = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module["addOnPostRun"] = addOnPostRun;

// Tools


function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}
Module["intArrayFromString"] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module["intArrayToString"] = intArrayToString;

function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))>>0)]=chr;
    i = i + 1;
  }
}
Module["writeStringToMemory"] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[((buffer++)>>0)]=array[i];
  }
}
Module["writeArrayToMemory"] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}


// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


if (!Math['clz32']) Math['clz32'] = function(x) {
  x = x >>> 0;
  for (var i = 0; i < 32; i++) {
    if (x & (1 << (31 - i))) return i;
  }
  return 32;
};
Math.clz32 = Math['clz32']

var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
  return id;
}

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 10000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module["addRunDependency"] = addRunDependency;

function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module["removeRunDependency"] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data



var memoryInitializer = null;



// === Body ===

var ASM_CONSTS = [function() { { return Module.getRandomValue(); } },
 function() { { if (Module.getRandomValue === undefined) { try { var window_ = "object" === typeof window ? window : self, crypto_ = typeof window_.crypto !== "undefined" ? window_.crypto : window_.msCrypto, randomValuesStandard = function() { var buf = new Uint32Array(1); crypto_.getRandomValues(buf); return buf[0] >>> 0; }; randomValuesStandard(); Module.getRandomValue = randomValuesStandard; } catch (e) { try { var crypto = require('crypto'), randomValueNodeJS = function() { var buf = crypto.randomBytes(4); return (buf[0] << 24 | buf[1] << 16 | buf[2] << 8 | buf[3]) >>> 0; }; randomValueNodeJS(); Module.getRandomValue = randomValueNodeJS; } catch (e) { throw 'No secure random number generator found'; } } } } }];

function _emscripten_asm_const_0(code) {
 return ASM_CONSTS[code]();
}



STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 13088;
  /* global initializers */  __ATINIT__.push();
  

/* memory initializer */ allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,4,0,0,0,155,0,0,0,5,0,0,0,49,2,0,0,6,0,0,0,137,1,0,0,9,0,0,0,221,0,0,0,12,0,0,0,53,3,0,0,12,0,0,0,129,2,0,0,14,0,0,0,87,3,0,0,15,0,0,0,123,0,0,0,19,0,0,0,123,0,0,0,20,0,0,0,215,0,0,0,20,0,0,0,75,1,0,0,20,0,0,0,131,3,0,0,19,0,0,0,27,2,0,0,20,0,0,0,61,2,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,63,0,0,0,5,0,0,0,139,2,0,0,6,0,0,0,155,0,0,0,12,0,0,0,209,1,0,0,14,0,0,0,143,0,0,0,19,0,0,0,37,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,127,0,0,0,6,0,0,0,77,1,0,0,10,0,0,0,139,2,0,0,14,0,0,0,63,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0,0,7,0,0,0,81,1,0,0,13,0,0,0,77,1,0,0,19,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,1,0,0,8,0,0,0,83,1,0,0,16,0,0,0,81,1,0,0,23,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,3,0,0,9,0,0,0,85,0,0,0,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,3,0,0,11,0,0,0,169,2,0,0,21,0,0,0,1,0,0,0,7,0,0,0,88,18,0,0,0,0,0,0,9,0,0,0,116,18,0,0,1,0,0,0,9,0,0,0,156,18,0,0,2,0,0,0,9,0,0,0,192,18,0,0,2,0,0,0,10,0,0,0,224,18,0,0,0,0,0,0,0,0,0,0,6,0,0,0,244,16,0,0,0,0,0,0,7,0,0,0,16,17,0,0,0,0,0,0,8,0,0,0,48,17,0,0,0,0,0,0,9,0,0,0,84,17,0,0,1,0,0,0,9,0,0,0,124,17,0,0,1,0,0,0,10,0,0,0,160,17,0,0,2,0,0,0,10,0,0,0,200,17,0,0,3,0,0,0,10,0,0,0,236,17,0,0,3,0,0,0,11,0,0,0,12,18,0,0,3,0,0,0,12,0,0,0,48,18,0,0,0,0,0,0,5,0,0,0,188,14,0,0,0,0,0,0,6,0,0,0,212,14,0,0,1,0,0,0,6,0,0,0,240,14,0,0,1,0,0,0,7,0,0,0,8,15,0,0,1,0,0,0,8,0,0,0,36,15,0,0,1,0,0,0,9,0,0,0,68,15,0,0,2,0,0,0,9,0,0,0,104,15,0,0,2,0,0,0,10,0,0,0,136,15,0,0,2,0,0,0,11,0,0,0,172,15,0,0,3,0,0,0,11,0,0,0,212,15,0,0,3,0,0,0,12,0,0,0,248,15,0,0,4,0,0,0,12,0,0,0,32,16,0,0,4,0,0,0,13,0,0,0,68,16,0,0,4,0,0,0,14,0,0,0,108,16,0,0,4,0,0,0,15,0,0,0,152,16,0,0,5,0,0,0,15,0,0,0,200,16,0,0,0,0,0,0,5,0,0,0,212,10,0,0,0,0,0,0,6,0,0,0,236,10,0,0,0,0,0,0,7,0,0,0,8,11,0,0,1,0,0,0,7,0,0,0,40,11,0,0,1,0,0,0,8,0,0,0,68,11,0,0,1,0,0,0,9,0,0,0,100,11,0,0,1,0,0,0,10,0,0,0,136,11,0,0,2,0,0,0,10,0,0,0,176,11,0,0,2,0,0,0,11,0,0,0,212,11,0,0,3,0,0,0,11,0,0,0,252,11,0,0,3,0,0,0,12,0,0,0,32,12,0,0,3,0,0,0,13,0,0,0,72,12,0,0,4,0,0,0,13,0,0,0,116,12,0,0,4,0,0,0,14,0,0,0,156,12,0,0,5,0,0,0,14,0,0,0,200,12,0,0,4,0,0,0,16,0,0,0,240,12,0,0,4,0,0,0,17,0,0,0,36,13,0,0,5,0,0,0,17,0,0,0,92,13,0,0,5,0,0,0,18,0,0,0,144,13,0,0,7,0,0,0,17,0,0,0,200,13,0,0,7,0,0,0,18,0,0,0,244,13,0,0,7,0,0,0,19,0,0,0,36,14,0,0,8,0,0,0,19,0,0,0,88,14,0,0,8,0,0,0,20,0,0,0,136,14,0,0,4,0,0,0,16,0,0,0,56,6,0,0,5,0,0,0,16,0,0,0,108,6,0,0,4,0,0,0,18,0,0,0,156,6,0,0,6,0,0,0,17,0,0,0,216,6,0,0,7,0,0,0,17,0,0,0,8,7,0,0,6,0,0,0,19,0,0,0,52,7,0,0,6,0,0,0,20,0,0,0,108,7,0,0,8,0,0,0,19,0,0,0,168,7,0,0,8,0,0,0,20,0,0,0,216,7,0,0,8,0,0,0,21,0,0,0,12,8,0,0,8,0,0,0,22,0,0,0,68,8,0,0,9,0,0,0,22,0,0,0,128,8,0,0,10,0,0,0,22,0,0,0,184,8,0,0,9,0,0,0,24,0,0,0,236,8,0,0,11,0,0,0,23,0,0,0,44,9,0,0,10,0,0,0,25,0,0,0,96,9,0,0,11,0,0,0,25,0,0,0,160,9,0,0,12,0,0,0,25,0,0,0,220,9,0,0,12,0,0,0,26,0,0,0,20,10,0,0,12,0,0,0,27,0,0,0,80,10,0,0,12,0,0,0,28,0,0,0,144,10,0,0,0,0,0,0,20,0,0,0,40,0,0,0,228,5,0,0,0,0,0,0,11,0,0,0,60,0,0,0,12,0,0,0,60,0,0,0,84,5,0,0,132,5,0,0,180,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,6,0,0,0,5,0,0,0,5,0,0,0,20,0,0,0,60,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,1,0,0,208,1,0,0,72,2,0,0,8,3,0,0,40,4,0,0,40,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,144,0,0,0,208,0,0,0,0,1,0,0,40,1,0,0,80,1,0,0,112,1,0,0,0,0,0,0,7,0,0,0,20,0,0,0,44,0,0,0,85,0,0,0,148,0,0,0,239,0,0,0,108,1,0,0,10,2,0,0,198,2,0,0,149,3,0,0,107,4,0,0,58,5,0,0,246,5,0,0,148,6,0,0,17,7,0,0,108,7,0,0,171,7,0,0,212,7,0,0,236,7,0,0,249,7,0,0,0,0,0,0,9,0,0,0,38,0,0,0,112,0,0,0,7,1,0,0,254,1,0,0,73,3,0,0,183,4,0,0,2,6,0,0,249,6,0,0,144,7,0,0,218,7,0,0,247,7,0,0,0,0,0,0,19,0,0,0,71,0,0,0,184,0,0,0,127,1,0,0,162,2,0,0,0,4,0,0,94,5,0,0,129,6,0,0,72,7,0,0,185,7,0,0,237,7,0,0,0,0,0,0,3,0,0,0,15,0,0,0,50,0,0,0,132,0,0,0,31,1,0,0,19,2,0,0,82,3,0,0,174,4,0,0,237,5,0,0,225,6,0,0,124,7,0,0,206,7,0,0,241,7,0,0,253,7,0,0,0,0,0,0,24,0,0,0,82,0,0,0,202,0,0,0,147,1,0,0,175,2,0,0,0,4,0,0,81,5,0,0,109,6,0,0,54,7,0,0,174,7,0,0,232,7,0,0,0,0,0,0,42,0,0,0,131,0,0,0,37,1,0,0,27,2,0,0,85,3,0,0,171,4,0,0,229,5,0,0,219,6,0,0,125,7,0,0,214,7,0,0,0,0,0,0,10,0,0,0,38,0,0,0,103,0,0,0,226,0,0,0,170,1,0,0,190,2,0,0,0,4,0,0,66,5,0,0,86,6,0,0,30,7,0,0,153,7,0,0,218,7,0,0,246,7,0,0,0,0,0,0,6,0,0,0,25,0,0,0,71,0,0,0,165,0,0,0,71,1,0,0,52,2,0,0,95,3,0,0,161,4,0,0,204,5,0,0,185,6,0,0,91,7,0,0,185,7,0,0,231,7,0,0,250,7,0,0,0,0,0,0,33,0,0,0,104,0,0,0,233,0,0,0,180,1,0,0,196,2,0,0,0,4,0,0,60,5,0,0,76,6,0,0,23,7,0,0,152,7,0,0,223,7,0,0,0,0,0,0,23,0,0,0,74,0,0,0,173,0,0,0,83,1,0,0,63,2,0,0,99,3,0,0,157,4,0,0,193,5,0,0,173,6,0,0,83,7,0,0,182,7,0,0,233,7,0,0,0,0,0,0,15,0,0,0,52,0,0,0,127,0,0,0,3,1,0,0,202,1,0,0,210,2,0,0,0,4,0,0,46,5,0,0,54,6,0,0,253,6,0,0,129,7,0,0,204,7,0,0,241,7,0,0,0,0,0,0,10,0,0,0,36,0,0,0,92,0,0,0,195,0,0,0,104,1,0,0,79,2,0,0,105,3,0,0,151,4,0,0,177,5,0,0,152,6,0,0,61,7,0,0,164,7,0,0,220,7,0,0,246,7,0,0,0,0,0,0,18,0,0,0,59,0,0,0,138,0,0,0,17,1,0,0,216,1,0,0,218,2,0,0,0,4,0,0,38,5,0,0,40,6,0,0,239,6,0,0,118,7,0,0,197,7,0,0,238,7,0,0,0,0,0,0,30,0,0,0,90,0,0,0,198,0,0,0,110,1,0,0,85,2,0,0,108,3,0,0,148,4,0,0,171,5,0,0,146,6,0,0,58,7,0,0,166,7,0,0,226,7,0,0,0,0,0,0,8,0,0,0,29,0,0,0,73,0,0,0,156,0,0,0,36,1,0,0,233,1,0,0,228,2,0,0,0,4,0,0,28,5,0,0,23,6,0,0,220,6,0,0,100,7,0,0,183,7,0,0,227,7,0,0,248,7,0,0,0,0,0,0,33,0,0,0,98,0,0,0,209,0,0,0,122,1,0,0,95,2,0,0,111,3,0,0,145,4,0,0,161,5,0,0,134,6,0,0,47,7,0,0,158,7,0,0,223,7,0,0,0,0,0,0,10,0,0,0,33,0,0,0,81,0,0,0,168,0,0,0,50,1,0,0,245,1,0,0,236,2,0,0,0,4,0,0,20,5,0,0,11,6,0,0,206,6,0,0,88,7,0,0,175,7,0,0,223,7,0,0,246,7,0,0,0,0,0,0,17,0,0,0,52,0,0,0,120,0,0,0,232,0,0,0,144,1,0,0,110,2,0,0,117,3,0,0,139,4,0,0,146,5,0,0,112,6,0,0,24,7,0,0,136,7,0,0,204,7,0,0,239,7,0,0,0,0,0,0,26,0,0,0,78,0,0,0,169,0,0,0,54,1,0,0,250,1,0,0,239,2,0,0,0,4,0,0,17,5,0,0,6,6,0,0,202,6,0,0,87,7,0,0,178,7,0,0,230,7,0,0,0,0,0,0,19,0,0,0,58,0,0,0,128,0,0,0,243,0,0,0,155,1,0,0,119,2,0,0,120,3,0,0,136,4,0,0,137,5,0,0,101,6,0,0,13,7,0,0,128,7,0,0,198,7,0,0,237,7,0,0,0,0,0,0,13,0,0,0,42,0,0,0,96,0,0,0,189,0,0,0,74,1,0,0,10,2,0,0,248,2,0,0,0,4,0,0,8,5,0,0,246,5,0,0,182,6,0,0,67,7,0,0,160,7,0,0,214,7,0,0,243,7,0,0,0,0,0,0,9,0,0,0,30,0,0,0,71,0,0,0,144,0,0,0,5,1,0,0,171,1,0,0,130,2,0,0,124,3,0,0,132,4,0,0,126,5,0,0,85,6,0,0,251,6,0,0,112,7,0,0,185,7,0,0,226,7,0,0,247,7,0,0,0,0,0,0,63,0,0,0,125,1,0,0,0,4,0,0,131,6,0,0,193,7,0,0,0,0,0,0,31,0,0,0,221,0,0,0,190,2,0,0,66,5,0,0,35,7,0,0,225,7,0,0,0,0,0,0,15,0,0,0,125,0,0,0,205,1,0,0,0,4,0,0,51,6,0,0,131,7,0,0,241,7,0,0,0,0,0,0,63,0,0,0,31,1,0,0,228,2,0,0,28,5,0,0,225,6,0,0,193,7,0,0,0,0,0,0,35,0,0,0,177,0,0,0,2,2,0,0,0,4,0,0,254,5,0,0,79,7,0,0,221,7,0,0,0,0,0,0,19,0,0,0,107,0,0,0,90,1,0,0,1,3,0,0,255,4,0,0,166,6,0,0,149,7,0,0,237,7,0,0,0,0,0,0,10,0,0,0,63,0,0,0,226,0,0,0,45,2,0,0,0,4,0,0,211,5,0,0,30,7,0,0,193,7,0,0,246,7,0,0,0,0,0,0,32,0,0,0,140,0,0,0,131,1,0,0,21,3,0,0,235,4,0,0,125,6,0,0,116,7,0,0,224,7,0,0,0,0,0,0,18,0,0,0,87,0,0,0,9,1,0,0,77,2,0,0,0,4,0,0,179,5,0,0,247,6,0,0,169,7,0,0,238,7,0,0,0,0,0,0,44,0,0,0,168,0,0,0,164,1,0,0,36,3,0,0,220,4,0,0,92,6,0,0,88,7,0,0,212,7,0,0,0,0,0,0,27,0,0,0,110,0,0,0,41,1,0,0,101,2,0,0,0,4,0,0,155,5,0,0,215,6,0,0,146,7,0,0,229,7,0,0,0,0,0,0,16,0,0,0,71,0,0,0,205,0,0,0,200,1,0,0,51,3,0,0,205,4,0,0,56,6,0,0,51,7,0,0,185,7,0,0,240,7,0,0,0,0,0,0,35,0,0,0,130,0,0,0,68,1,0,0,122,2,0,0,0,4,0,0,134,5,0,0,188,6,0,0,126,7,0,0,221,7,0,0,0,0,0,0,22,0,0,0,86,0,0,0,230,0,0,0,224,1,0,0,61,3,0,0,195,4,0,0,32,6,0,0,26,7,0,0,170,7,0,0,234,7,0,0,0,0,0,0,43,0,0,0,148,0,0,0,91,1,0,0,138,2,0,0,0,4,0,0,118,5,0,0,165,6,0,0,108,7,0,0,213,7,0,0,0,0,0,0,8,0,0,0,36,0,0,0,109,0,0,0,2,1,0,0,250,1,0,0,72,3,0,0,184,4,0,0,6,6,0,0,254,6,0,0,147,7,0,0,220,7,0,0,248,7,0,0,0,0,0,0,5,0,0,0,23,0,0,0,73,0,0,0,183,0,0,0,125,1,0,0,160,2,0,0,0,4,0,0,96,5,0,0,131,6,0,0,73,7,0,0,183,7,0,0,233,7,0,0,251,7,0,0,0,0,0,0,11,0,0,0,45,0,0,0,125,0,0,0,24,1,0,0,13,2,0,0,79,3,0,0,177,4,0,0,243,5,0,0,232,6,0,0,131,7,0,0,211,7,0,0,245,7,0,0,0,0,0,0,7,0,0,0,29,0,0,0,86,0,0,0,203,0,0,0,146,1,0,0,174,2,0,0,0,4,0,0,82,5,0,0,110,6,0,0,53,7,0,0,170,7,0,0,227,7,0,0,249,7,0,0,0,0,0,0,40,0,0,0,128,0,0,0,32,1,0,0,23,2,0,0,84,3,0,0,172,4,0,0,233,5,0,0,224,6,0,0,128,7,0,0,216,7,0,0,0,0,0,0,27,0,0,0,90,0,0,0,213,0,0,0,159,1,0,0,183,2,0,0,0,4,0,0,73,5,0,0,97,6,0,0,43,7,0,0,166,7,0,0,229,7,0,0,0,0,0,0,18,0,0,0,62,0,0,0,155,0,0,0,60,1,0,0,44,2,0,0,92,3,0,0,164,4,0,0,212,5,0,0,196,6,0,0,101,7,0,0,194,7,0,0,238,7,0,0,0,0,0,0,31,0,0,0,100,0,0,0,228,0,0,0,174,1,0,0,193,2,0,0,0,4,0,0,63,5,0,0,82,6,0,0,28,7,0,0,156,7,0,0,225,7,0,0,0,0,0,0,21,0,0,0,71,0,0,0,168,0,0,0,76,1,0,0,57,2,0,0,97,3,0,0,159,4,0,0,199,5,0,0,180,6,0,0,88,7,0,0,185,7,0,0,235,7,0,0,0,0,0,0,62,0,0,0,123,1,0,0,0,4,0,0,133,6,0,0,194,7,0,0,0,0,0,0,30,0,0,0,218,0,0,0,188,2,0,0,68,5,0,0,38,7,0,0,226,7,0,0,0,0,0,0,110,0,0,0,193,1,0,0,0,4,0,0,63,6,0,0,146,7,0,0,0,0,0,0,61,0,0,0,27,1,0,0,226,2,0,0,30,5,0,0,229,6,0,0,195,7,0,0,0,0,0,0,33,0,0,0,173,0,0,0,254,1,0,0,0,4,0,0,2,6,0,0,83,7,0,0,223,7,0,0,0,0,0,0,18,0,0,0,103,0,0,0,85,1,0,0,255,2,0,0,1,5,0,0,171,6,0,0,153,7,0,0,238,7,0,0,0,0,0,0,51,0,0,0,213,0,0,0,36,2,0,0,0,4,0,0,220,5,0,0,43,7,0,0,205,7,0,0,0,0,0,0,30,0,0,0,135,0,0,0,126,1,0,0,18,3,0,0,238,4,0,0,130,6,0,0,121,7,0,0,226,7,0,0,0,0,0,0,17,0,0,0,84,0,0,0,2,1,0,0,71,2,0,0,0,4,0,0,185,5,0,0,254,6,0,0,172,7,0,0,239,7,0,0,0,0,0,0,41,0,0,0,162,0,0,0,158,1,0,0,33,3,0,0,223,4,0,0,98,6,0,0,94,7,0,0,215,7,0,0,0,0,0,0,25,0,0,0,105,0,0,0,34,1,0,0,96,2,0,0,0,4,0,0,160,5,0,0,222,6,0,0,151,7,0,0,231,7,0,0,0,0,0,0,52,0,0,0,185,0,0,0,184,1,0,0,45,3,0,0,211,4,0,0,72,6,0,0,71,7,0,0,204,7,0,0,0,0,0,0,33,0,0,0,124,0,0,0,60,1,0,0,116,2,0,0,0,4,0,0,140,5,0,0,196,6,0,0,132,7,0,0,223,7,0,0,0,0,0,0,20,0,0,0,81,0,0,0,222,0,0,0,216,1,0,0,58,3,0,0,198,4,0,0,40,6,0,0,34,7,0,0,175,7,0,0,236,7,0,0,0,0,0,0,12,0,0,0,52,0,0,0,152,0,0,0,91,1,0,0,137,2,0,0,0,4,0,0,119,5,0,0,165,6,0,0,104,7,0,0,204,7,0,0,244,7,0,0,0,0,0,0,26,0,0,0,95,0,0,0,243,0,0,0,237,1,0,0,66,3,0,0,190,4,0,0,19,6,0,0,13,7,0,0,161,7,0,0,230,7,0,0,0,0,0,0,28,0,0,0,213,0,0,0,184,2,0,0,72,5,0,0,43,7,0,0,228,7,0,0,0,0,0,0,13,0,0,0,117,0,0,0,194,1,0,0,0,4,0,0,62,6,0,0,139,7,0,0,243,7,0,0,0,0,0,0,6,0,0,0,63,0,0,0,24,1,0,0,223,2,0,0,33,5,0,0,232,6,0,0,193,7,0,0,250,7,0,0,0,0,0,0,3,0,0,0,33,0,0,0,168,0,0,0,248,1,0,0,0,4,0,0,8,6,0,0,88,7,0,0,223,7,0,0,253,7,0,0,0,0,0,0,16,0,0,0,97,0,0,0,75,1,0,0,249,2,0,0,7,5,0,0,181,6,0,0,159,7,0,0,240,7,0,0,0,0,0,0,8,0,0,0,55,0,0,0,210,0,0,0,31,2,0,0,0,4,0,0,225,5,0,0,46,7,0,0,201,7,0,0,248,7,0,0,0,0,0,0,26,0,0,0,126,0,0,0,114,1,0,0,12,3,0,0,244,4,0,0,142,6,0,0,130,7,0,0,230,7,0,0,0,0,0,0,62,0,0,0,234,0,0,0,54,2,0,0,0,4,0,0,202,5,0,0,22,7,0,0,194,7,0,0,0,0,0,0,37,0,0,0,151,0,0,0,145,1,0,0,27,3,0,0,229,4,0,0,111,6,0,0,105,7,0,0,219,7,0,0,0,0,0,0,21,0,0,0,95,0,0,0,19,1,0,0,84,2,0,0,0,4,0,0,172,5,0,0,237,6,0,0,161,7,0,0,235,7,0,0,0,0,0,0,50,0,0,0,3,1,0,0,211,2,0,0,45,5,0,0,253,6,0,0,206,7,0,0,0,0,0,0,2,0,0,0,27,0,0,0,151,0,0,0,230,1,0,0,0,4,0,0,26,6,0,0,105,7,0,0,229,7,0,0,254,7,0,0,0,0,0,0,12,0,0,0,83,0,0,0,53,1,0,0,238,2,0,0,18,5,0,0,203,6,0,0,173,7,0,0,244,7,0,0,0,0,0,0,39,0,0,0,183,0,0,0,6,2,0,0,0,4,0,0,250,5,0,0,73,7,0,0,217,7,0,0,0,0,0,0,20,0,0,0,107,0,0,0,87,1,0,0,255,2,0,0,1,5,0,0,169,6,0,0,149,7,0,0,236,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,0,0,0,64,0,0,0,64,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,20,0,0,196,22,0,0,200,23,0,0,204,24,0,0,80,25,0,0,212,25,0,0,88,26,0,0,220,26,0,0,96,27,0,0,228,27,0,0,104,28,0,0,236,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,5,0,0,0,4,0,0,0,4,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,6,0,0,0,21,0,0,0,56,0,0,0,126,0,0,0,252,0,0,0,206,1,0,0,24,3,0,0,7,5,0,0,210,7,0,0,187,11,0,0,16,17,0,0,44,24,0,0,120,33,0,0,108,45,0,0,144,60,0,0,125,79,0,0,222,102,0,0,113,131,0,0,8,166,0,0,138,207,0,0,244,0,1,0,90,59,1,0,232,127,1,0,227,207,1,0,170,44,2,0,183,151,2,0,160,18,3,0,24,159,3,0,240,62,4,0,24,244,4,0,160,192,5,0,185,166,6,0,182,168,7,0,13,201,8,0,88,10,10,0,86,111,11,0,236,250,12,0,38,176,14,0,56,146,16,0,127,164,18,0,130,234,20,0,243,103,23,0,176,32,26,0,196,24,29,0,104,84,32,0,4,216,35,0,48,168,39,0,181,201,43,0,142,65,48,0,233,20,53,0,40,73,58,0,226,227,63,0,228,234,69,0,50,100,76,0,8,86,83,0,219,198,90,0,90,189,98,0,111,64,107,0,64,87,116,0,48,9,126,0,224,93,136,0,48,93,147,0,64,15,159,0,113,124,171,0,102,173,184,0,5,171,198,0,120,126,213,0,46,49,229,0,220,204,245,0,126,91,7,1,88,231,25,1,247,122,45,1,50,33,66,1,43,229,87,1,80,210,110,1,92,244,134,1,88,87,160,1,156,7,187,1,208,17,215,1,237,130,244,1,62,104,19,2,97,207,51,2,72,198,85,2,58,91,121,2,212,156,158,2,10,154,197,2,40,98,238,2,211,4,25,3,10,146,69,3,39,26,116,3,224,173,164,3,72,94,215,3,208,60,12,4,72,91,67,4,224,203,124,4,41,161,184,4,22,238,246,4,253,197,55,5,152,60,123,5,6,102,193,5,204,86,10,6,214,35,86,6,120,226,164,6,111,168,246,6,226,139,75,7,99,163,163,7,240,5,255,7,244,202,93,8,72,10,192,8,52,220,37,9,112,89,143,9,37,155,252,9,238,186,109,10,217,210,226,10,104,253,91,11,146,85,217,11,196,246,90,12,226,252,224,12,72,132,107,13,203,169,250,13,186,138,142,14,223,68,39,15,128,246,196,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,7,0,0,0,28,0,0,0,84,0,0,0,210,0,0,0,206,1,0,0,156,3,0,0,180,6,0,0,187,11,0,0,141,19,0,0,72,31,0,0,88,48,0,0,132,72,0,0,252,105,0,0,104,151,0,0,248,211,0,0,117,35,1,0,83,138,1,0,196,13,2,0,204,179,2,0,86,131,3,0,74,132,4,0,164,191,5,0,140,63,7,0,111,15,9,0,25,60,11,0,208,211,13,0,112,230,16,0,136,133,20,0,120,196,24,0,144,184,29,0,48,121,35,0,233,31,42,0,159,200,49,0,172,145,58,0,4,156,68,0,90,11,80,0,70,6,93,0,108,182,107,0,164,72,124,0,35,237,142,0,165,215,163,0,152,63,187,0,72,96,213,0,12,121,242,0,116,205,18,1,120,165,54,1,168,77,94,1,93,23,138,1,235,88,186,1,212,109,239,1,252,182,41,2,222,154,105,2,194,133,175,2,244,233,251,2,252,63,79,3,215,6,170,3,49,196,12,4,160,4,120,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,8,0,0,0,36,0,0,0,120,0,0,0,74,1,0,0,24,3,0,0,180,6,0,0,104,13,0,0,35,25,0,0,176,44,0,0,248,75,0,0,80,124,0,0,212,196,0,0,208,46,1,0,56,198,1,0,48,154,2,0,165,189,3,0,248,71,5,0,188,85,7,0,136,9,10,0,222,140,13,0,40,17,18,0,204,208,23,0,88,16,31,0,199,31,40,0,224,91,51,0,176,47,65,0,32,22,82,0,168,155,102,0,32,96,127,0,176,24,157,0,224,145,192,0,201,177,234,0,104,122,28,1,20,12,87,1,24,168,155,1,114,179,235,1,184,185,72,2,36,112,180,2,200,184,48,3,235,165,191,3,144,125,99,4,40,189,30,5,112,29,244,5,124,150,230,6,240,99,249,7,104,9,48,9,16,87,142,10,109,110,24,12,88,199,210,13,44,53,194,15,40,236,235,17,6,135,85,20,200,12,5,23,188,246,0,26,184,54,80,29,143,61,250,32,192,1,7,37,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,9,0,0,0,45,0,0,0,165,0,0,0,239,1,0,0,7,5,0,0,187,11,0,0,35,25,0,0,70,50,0,0,246,94,0,0,238,170,0,0,62,39,1,0,18,236,1,0,226,26,3,0,26,225,4,0,74,123,7,0,239,56,11,0,231,128,16,0,163,214,23,0,43,224,33,0,9,109,47,0,49,126,65,0,253,78,89,0,85,95,120,0,28,127,160,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,10,0,0,0,55,0,0,0,220,0,0,0,203,2,0,0,210,7,0,0,141,19,0,0,176,44,0,0,246,94,0,0,236,189,0,0,218,104,1,0,24,144,2,0,42,124,4,0,12,151,7,0,38,120,12,0,112,243,19,0,95,44,31,0,70,173,47,0,233,131,71,0,20,100,105,0,29,209,152,0,78,79,218,0,75,158,51,1,160,253,171,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,66,0,0,0,30,1,0,0,233,3,0,0,187,11,0,0,72,31,0,0,248,75,0,0,238,170,0,0,218,104,1,0,180,209,2,0,204,97,5,0,246,221,9,0,2,117,17,0,40,237,29,0,152,224,49,0,247,12,81,0,61,186,128,0,38,62,200,0,58,162,49,1,87,115,202,1,165,194,164,2,240,96,216,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,12,0,0,0,78,0,0,0,108,1,0,0,85,5,0,0,16,17,0,0,88,48,0,0,80,124,0,0,62,39,1,0,24,144,2,0,204,97,5,0,152,195,10,0,142,161,20,0,144,22,38,0,184,3,68,0,80,228,117,0,71,241,198,0,132,171,71,1,170,233,15,2,228,139,65,3,59,255,11,5,224,193,176,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,13,0,0,0,91,0,0,0,199,1,0,0,28,7,0,0,44,24,0,0,132,72,0,0,212,196,0,0,18,236,1,0,42,124,4,0,246,221,9,0,142,161,20,0,28,67,41,0,172,89,79,0,100,93,147,0,180,65,9,1,251,50,208,1,127,222,23,3,41,200,39,5,13,84,105,8,72,83,117,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,14,0,0,0,105,0,0,0,48,2,0,0,76,9,0,0,120,33,0,0,252,105,0,0,208,46,1,0,226,26,3,0,12,151,7,0,2,117,17,0,144,22,38,0,172,89,79,0,88,179,158,0,188,16,50,1,112,82,59,2,107,133,11,4,234,99,35,7,19,44,75,12,32,128,180,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,15,0,0,0,120,0,0,0,168,2,0,0,244,11,0,0,108,45,0,0,104,151,0,0,56,198,1,0,26,225,4,0,38,120,12,0,40,237,29,0,184,3,68,0,100,93,147,0,188,16,50,1,120,33,100,2,232,115,159,4,83,249,170,8,61,93,206,15,80,137,25,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,16,0,0,0,136,0,0,0,48,3,0,0,36,15,0,0,144,60,0,0,248,211,0,0,48,154,2,0,74,123,7,0,112,243,19,0,152,224,49,0,80,228,117,0,180,65,9,1,112,82,59,2,232,115,159,4,208,231,62,9,35,225,233,17,96,62,184,33,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,17,0,0,0,153,0,0,0,201,3,0,0,237,18,0,0,125,79,0,0,117,35,1,0,165,189,3,0,239,56,11,0,95,44,31,0,247,12,81,0,71,241,198,0,251,50,208,1,107,133,11,4,83,249,170,8,35,225,233,17,70,194,211,35,0,0,0,0,1,0,0,0,3,0,0,0,7,0,0,0,11,0,0,0,19,0,0,0,37,0,0,0,67,0,0,0,131,0,0,0,29,1,0,0,33,2,0,0,9,4,0,0,5,8,0,0,83,16,0,0,27,32,0,0,67,68,0,0,3,128,0,0,11,16,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,30,0,0,120,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,3,0,0,0,0,0,0,0,236,30,0,0,5,0,0,0,0,0,0,0,0,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,0,0,0,19,0,0,0,5,49,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,0,0,0,19,0,0,0,253,44,0,0,0,4,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,45,244,81,88,207,140,177,192,70,246,181,203,41,49,3,199,4,91,112,48,180,93,253,32,120,127,139,154,216,89,41,80,104,72,137,171,167,86,3,108,255,183,205,136,63,212,119,180,43,165,163,112,241,186,228,168,252,65,131,253,217,111,225,138,122,47,45,116,150,7,31,13,9,94,3,118,44,112,247,64,165,44,167,111,87,65,168,170,116,223,160,88,100,3,74,199,196,60,83,174,175,95,24,4,21,177,227,109,40,134,171,12,164,191,67,240,233,80,129,57,87,22,82,55,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,123,32,114,101,116,117,114,110,32,77,111,100,117,108,101,46,103,101,116,82,97,110,100,111,109,86,97,108,117,101,40,41,59,32,125,0,123,32,105,102,32,40,77,111,100,117,108,101,46,103,101,116,82,97,110,100,111,109,86,97,108,117,101,32,61,61,61,32,117,110,100,101,102,105,110,101,100,41,32,123,32,116,114,121,32,123,32,118,97,114,32,119,105,110,100,111,119,95,32,61,32,34,111,98,106,101,99,116,34,32,61,61,61,32,116,121,112,101,111,102,32,119,105,110,100,111,119,32,63,32,119,105,110,100,111,119,32,58,32,115,101,108,102,44,32,99,114,121,112,116,111,95,32,61,32,116,121,112,101,111,102,32,119,105,110,100,111,119,95,46,99,114,121,112,116,111,32,33,61,61,32,34,117,110,100,101,102,105,110,101,100,34,32,63,32,119,105,110,100,111,119,95,46,99,114,121,112,116,111,32,58,32,119,105,110,100,111,119,95,46,109,115,67,114,121,112,116,111,44,32,114,97,110,100,111,109,86,97,108,117,101,115,83,116,97,110,100,97,114,100,32,61,32,102,117,110,99,116,105,111,110,40,41,32,123,32,118,97,114,32,98,117,102,32,61,32,110,101,119,32,85,105,110,116,51,50,65,114,114,97,121,40,49,41,59,32,99,114,121,112,116,111,95,46,103,101,116,82,97,110,100,111,109,86,97,108,117,101,115,40,98,117,102,41,59,32,114,101,116,117,114,110,32,98,117,102,91,48,93,32,62,62,62,32,48,59,32,125,59,32,114,97,110,100,111,109,86,97,108,117,101,115,83,116,97,110,100,97,114,100,40,41,59,32,77,111,100,117,108,101,46,103,101,116,82,97,110,100,111,109,86,97,108,117,101,32,61,32,114,97,110,100,111,109,86,97,108,117,101,115,83,116,97,110,100,97,114,100,59,32,125,32,99,97,116,99,104,32,40,101,41,32,123,32,116,114,121,32,123,32,118,97,114,32,99,114,121,112,116,111,32,61,32,114,101,113,117,105,114,101,40,39,99,114,121,112,116,111,39,41,44,32,114,97,110,100,111,109,86,97,108,117,101,78,111,100,101,74,83,32,61,32,102,117,110,99,116,105,111,110,40,41,32,123,32,118,97,114,32,98,117,102,32,61,32,99,114,121,112,116,111,46,114,97,110,100,111,109,66,121,116,101,115,40,52,41,59,32,114,101,116,117,114,110,32,40,98,117,102,91,48,93,32,60,60,32,50,52,32,124,32,98,117,102,91,49,93,32,60,60,32,49,54,32,124,32,98,117,102,91,50,93,32,60,60,32,56,32,124,32,98,117,102,91,51,93,41,32,62,62,62,32,48,59,32,125,59,32,114,97,110,100,111,109,86,97,108,117,101,78,111,100,101,74,83,40,41,59,32,77,111,100,117,108,101,46,103,101,116,82,97,110,100,111,109,86,97,108,117,101,32,61,32,114,97,110,100,111,109,86,97,108,117,101,78,111,100,101,74,83,59,32,125,32,99,97,116,99,104,32,40,101,41,32,123,32,116,104,114,111,119,32,39,78,111,32,115,101,99,117,114,101,32,114,97,110,100,111,109,32,110,117,109,98,101,114,32,103,101,110,101,114,97,116,111,114,32,102,111,117,110,100,39,59,32,125,32,125,32,125,32,125,0,0,1,2,2,3,3,3,3,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,105,110,99,111,110,115,105,115,116,101,110,116,32,100,97,116,97,32,102,111,114,32,99,119,44,32,114,101,114,117,110,32,103,101,110,112,97,114,97,109,115,10,0,69,120,116,101,110,115,105,111,110,32,100,101,103,114,101,101,32,37,100,32,110,111,116,32,105,109,112,108,101,109,101,110,116,101,100,32,33,10,0,84,33,34,25,13,1,2,3,17,75,28,12,16,4,11,29,18,30,39,104,110,111,112,113,98,32,5,6,15,19,20,21,26,8,22,7,40,36,23,24,9,10,14,27,31,37,35,131,130,125,38,42,43,60,61,62,63,67,71,74,77,88,89,90,91,92,93,94,95,96,97,99,100,101,102,103,105,106,107,108,114,115,116,121,122,123,124,0,73,108,108,101,103,97,108,32,98,121,116,101,32,115,101,113,117,101,110,99,101,0,68,111,109,97,105,110,32,101,114,114,111,114,0,82,101,115,117,108,116,32,110,111,116,32,114,101,112,114,101,115,101,110,116,97,98,108,101,0,78,111,116,32,97,32,116,116,121,0,80,101,114,109,105,115,115,105,111,110,32,100,101,110,105,101,100,0,79,112,101,114,97,116,105,111,110,32,110,111,116,32,112,101,114,109,105,116,116,101,100,0,78,111,32,115,117,99,104,32,102,105,108,101,32,111,114,32,100,105,114,101,99,116,111,114,121,0,78,111,32,115,117,99,104,32,112,114,111,99,101,115,115,0,70,105,108,101,32,101,120,105,115,116,115,0,86,97,108,117,101,32,116,111,111,32,108,97,114,103,101,32,102,111,114,32,100,97,116,97,32,116,121,112,101,0,78,111,32,115,112,97,99,101,32,108,101,102,116,32,111,110,32,100,101,118,105,99,101,0,79,117,116,32,111,102,32,109,101,109,111,114,121,0,82,101,115,111,117,114,99,101,32,98,117,115,121,0,73,110,116,101,114,114,117,112,116,101,100,32,115,121,115,116,101,109,32,99,97,108,108,0,82,101,115,111,117,114,99,101,32,116,101,109,112,111,114,97,114,105,108,121,32,117,110,97,118,97,105,108,97,98,108,101,0,73,110,118,97,108,105,100,32,115,101,101,107,0,67,114,111,115,115,45,100,101,118,105,99,101,32,108,105,110,107,0,82,101,97,100,45,111,110,108,121,32,102,105,108,101,32,115,121,115,116,101,109,0,68,105,114,101,99,116,111,114,121,32,110,111,116,32,101,109,112,116,121,0,67,111,110,110,101,99,116,105,111,110,32,114,101,115,101,116,32,98,121,32,112,101,101,114,0,79,112,101,114,97,116,105,111,110,32,116,105,109,101,100,32,111,117,116,0,67,111,110,110,101,99,116,105,111,110,32,114,101,102,117,115,101,100,0,72,111,115,116,32,105,115,32,100,111,119,110,0,72,111,115,116,32,105,115,32,117,110,114,101,97,99,104,97,98,108,101,0,65,100,100,114,101,115,115,32,105,110,32,117,115,101,0,66,114,111,107,101,110,32,112,105,112,101,0,73,47,79,32,101,114,114,111,114,0,78,111,32,115,117,99,104,32,100,101,118,105,99,101,32,111,114,32,97,100,100,114,101,115,115,0,66,108,111,99,107,32,100,101,118,105,99,101,32,114,101,113,117,105,114,101,100,0,78,111,32,115,117,99,104,32,100,101,118,105,99,101,0,78,111,116,32,97,32,100,105,114,101,99,116,111,114,121,0,73,115,32,97,32,100,105,114,101,99,116,111,114,121,0,84,101,120,116,32,102,105,108,101,32,98,117,115,121,0,69,120,101,99,32,102,111,114,109,97,116,32,101,114,114,111,114,0,73,110,118,97,108,105,100,32,97,114,103,117,109,101,110,116,0,65,114,103,117,109,101,110,116,32,108,105,115,116,32,116,111,111,32,108,111,110,103,0,83,121,109,98,111,108,105,99,32,108,105,110,107,32,108,111,111,112,0,70,105,108,101,110,97,109,101,32,116,111,111,32,108,111,110,103,0,84,111,111,32,109,97,110,121,32,111,112,101,110,32,102,105,108,101,115,32,105,110,32,115,121,115,116,101,109,0,78,111,32,102,105,108,101,32,100,101,115,99,114,105,112,116,111,114,115,32,97,118,97,105,108,97,98,108,101,0,66,97,100,32,102,105,108,101,32,100,101,115,99,114,105,112,116,111,114,0,78,111,32,99,104,105,108,100,32,112,114,111,99,101,115,115,0,66,97,100,32,97,100,100,114,101,115,115,0,70,105,108,101,32,116,111,111,32,108,97,114,103,101,0,84,111,111,32,109,97,110,121,32,108,105,110,107,115,0,78,111,32,108,111,99,107,115,32,97,118,97,105,108,97,98,108,101,0,82,101,115,111,117,114,99,101,32,100,101,97,100,108,111,99,107,32,119,111,117,108,100,32,111,99,99,117,114,0,83,116,97,116,101,32,110,111,116,32,114,101,99,111,118,101,114,97,98,108,101,0,80,114,101,118,105,111,117,115,32,111,119,110,101,114,32,100,105,101,100,0,79,112,101,114,97,116,105,111,110,32,99,97,110,99,101,108,101,100,0,70,117,110,99,116,105,111,110,32,110,111,116,32,105,109,112,108,101,109,101,110,116,101,100,0,78,111,32,109,101,115,115,97,103,101,32,111,102,32,100,101,115,105,114,101,100,32,116,121,112,101,0,73,100,101,110,116,105,102,105,101,114,32,114,101,109,111,118,101,100,0,68,101,118,105,99,101,32,110,111,116,32,97,32,115,116,114,101,97,109,0,78,111,32,100,97,116,97,32,97,118,97,105,108,97,98,108,101,0,68,101,118,105,99,101,32,116,105,109,101,111,117,116,0,79,117,116,32,111,102,32,115,116,114,101,97,109,115,32,114,101,115,111,117,114,99,101,115,0,76,105,110,107,32,104,97,115,32,98,101,101,110,32,115,101,118,101,114,101,100,0,80,114,111,116,111,99,111,108,32,101,114,114,111,114,0,66,97,100,32,109,101,115,115,97,103,101,0,70,105,108,101,32,100,101,115,99,114,105,112,116,111,114,32,105,110,32,98,97,100,32,115,116,97,116,101,0,78,111,116,32,97,32,115,111,99,107,101,116,0,68,101,115,116,105,110,97,116,105,111,110,32,97,100,100,114,101,115,115,32,114,101,113,117,105,114,101,100,0,77,101,115,115,97,103,101,32,116,111,111,32,108,97,114,103,101,0,80,114,111,116,111,99,111,108,32,119,114,111,110,103,32,116,121,112,101,32,102,111,114,32,115,111,99,107,101,116,0,80,114,111,116,111,99,111,108,32,110,111,116,32,97,118,97,105,108,97,98,108,101,0,80,114,111,116,111,99,111,108,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,83,111,99,107,101,116,32,116,121,112,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,78,111,116,32,115,117,112,112,111,114,116,101,100,0,80,114,111,116,111,99,111,108,32,102,97,109,105,108,121,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,65,100,100,114,101,115,115,32,102,97,109,105,108,121,32,110,111,116,32,115,117,112,112,111,114,116,101,100,32,98,121,32,112,114,111,116,111,99,111,108,0,65,100,100,114,101,115,115,32,110,111,116,32,97,118,97,105,108,97,98,108,101,0,78,101,116,119,111,114,107,32,105,115,32,100,111,119,110,0,78,101,116,119,111,114,107,32,117,110,114,101,97,99,104,97,98,108,101,0,67,111,110,110,101,99,116,105,111,110,32,114,101,115,101,116,32,98,121,32,110,101,116,119,111,114,107,0,67,111,110,110,101,99,116,105,111,110,32,97,98,111,114,116,101,100,0,78,111,32,98,117,102,102,101,114,32,115,112,97,99,101,32,97,118,97,105,108,97,98,108,101,0,83,111,99,107,101,116,32,105,115,32,99,111,110,110,101,99,116,101,100,0,83,111,99,107,101,116,32,110,111,116,32,99,111,110,110,101,99,116,101,100,0,67,97,110,110,111,116,32,115,101,110,100,32,97,102,116,101,114,32,115,111,99,107,101,116,32,115,104,117,116,100,111,119,110,0,79,112,101,114,97,116,105,111,110,32,97,108,114,101,97,100,121,32,105,110,32,112,114,111,103,114,101,115,115,0,79,112,101,114,97,116,105,111,110,32,105,110,32,112,114,111,103,114,101,115,115,0,83,116,97,108,101,32,102,105,108,101,32,104,97,110,100,108,101,0,82,101,109,111,116,101,32,73,47,79,32,101,114,114,111,114,0,81,117,111,116,97,32,101,120,99,101,101,100,101,100,0,78,111,32,109,101,100,105,117,109,32,102,111,117,110,100,0,87,114,111,110,103,32,109,101,100,105,117,109,32,116,121,112,101,0,78,111,32,101,114,114,111,114,32,105,110,102,111,114,109,97,116,105,111,110,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,0,10,0,17,17,17,0,0,0,0,5,0,0,0,0,0,0,9,0,0,0,0,11,0,0,0,0,0,0,0,0,17,0,15,10,17,17,17,3,10,7,0,1,19,9,11,11,0,0,9,6,11,0,0,11,0,6,17,0,0,0,17,17,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,0,17,0,10,10,17,17,17,0,10,0,0,2,0,9,11,0,0,0,9,0,11,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,12,0,0,0,0,9,12,0,0,0,0,0,12,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,4,13,0,0,0,0,9,14,0,0,0,0,0,14,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,15,0,0,0,0,15,0,0,0,0,9,16,0,0,0,0,0,16,0,0,16,0,0,18,0,0,0,18,18,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,0,0,0,18,18,18,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,0,10,0,0,0,0,9,11,0,0,0,0,0,11,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,12,0,0,0,0,9,12,0,0,0,0,0,12,0,0,12,0,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,45,43,32,32,32,48,88,48,120,0,40,110,117,108,108,41,0,45,48,88,43,48,88,32,48,88,45,48,120,43,48,120,32,48,120,0,105,110,102,0,73,78,70,0,110,97,110,0,78,65,78,0,46,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);





/* no memory initializer */
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}

// {{PRE_LIBRARY}}


  var _BDtoIHigh=true;

   
  Module["_i64Subtract"] = _i64Subtract;

  
  function ___setErrNo(value) {
      if (Module['___errno_location']) HEAP32[((Module['___errno_location']())>>2)]=value;
      else Module.printErr('failed to set errno from JS');
      return value;
    }
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 85: return totalMemory / PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 79:
          return 0;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: {
          if (typeof navigator === 'object') return navigator['hardwareConcurrency'] || 1;
          return 1;
        }
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  function _pthread_cleanup_push(routine, arg) {
      __ATEXIT__.push(function() { Runtime.dynCall('vi', routine, [arg]) })
      _pthread_cleanup_push.level = __ATEXIT__.length;
    }

   
  Module["_memset"] = _memset;

  var _BDtoILow=true;

   
  Module["_bitshift64Lshr"] = _bitshift64Lshr;

   
  Module["_bitshift64Shl"] = _bitshift64Shl;

  function _pthread_cleanup_pop() {
      assert(_pthread_cleanup_push.level == __ATEXIT__.length, 'cannot pop if something else added meanwhile!');
      __ATEXIT__.pop();
      _pthread_cleanup_push.level = __ATEXIT__.length;
    }

  function _abort() {
      Module['abort']();
    }

  function _pthread_self() {
      //FIXME: assumes only a single thread
      return 0;
    }

  function ___lock() {}

  function ___unlock() {}

  
  var SYSCALLS={varargs:0,get:function (varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function () {
        var ret = Pointer_stringify(SYSCALLS.get());
        return ret;
      },get64:function () {
        var low = SYSCALLS.get(), high = SYSCALLS.get();
        if (low >= 0) assert(high === 0);
        else assert(high === -1);
        return low;
      },getZero:function () {
        assert(SYSCALLS.get() === 0);
      }};function ___syscall6(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // close
      var stream = SYSCALLS.getStreamFromFD();
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  var _llvm_pow_f32=Math_pow;

  var _emscripten_asm_const=true;

   
  Module["_i64Add"] = _i64Add;

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) {
        var success = self.alloc(bytes);
        if (!success) return -1 >>> 0; // sbrk failure code
      }
      return ret;  // Previous break location.
    }

  var _BItoD=true;

  var _sqrt=Math_sqrt;

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;

  var _emscripten_asm_const_int=true;

  
  var PATH=undefined;
  
  
  function _emscripten_set_main_loop_timing(mode, value) {
      Browser.mainLoop.timingMode = mode;
      Browser.mainLoop.timingValue = value;
  
      if (!Browser.mainLoop.func) {
        console.error('emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist! Call emscripten_set_main_loop first to set one up.');
        return 1; // Return non-zero on failure, can't set timing mode when there is no main loop.
      }
  
      if (mode == 0 /*EM_TIMING_SETTIMEOUT*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
          setTimeout(Browser.mainLoop.runner, value); // doing this each time means that on exception, we stop
        };
        Browser.mainLoop.method = 'timeout';
      } else if (mode == 1 /*EM_TIMING_RAF*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'rAF';
      } else if (mode == 2 /*EM_TIMING_SETIMMEDIATE*/) {
        if (!window['setImmediate']) {
          // Emulate setImmediate. (note: not a complete polyfill, we don't emulate clearImmediate() to keep code size to minimum, since not needed)
          var setImmediates = [];
          var emscriptenMainLoopMessageId = '__emcc';
          function Browser_setImmediate_messageHandler(event) {
            if (event.source === window && event.data === emscriptenMainLoopMessageId) {
              event.stopPropagation();
              setImmediates.shift()();
            }
          }
          window.addEventListener("message", Browser_setImmediate_messageHandler, true);
          window['setImmediate'] = function Browser_emulated_setImmediate(func) {
            setImmediates.push(func);
            window.postMessage(emscriptenMainLoopMessageId, "*");
          }
        }
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
          window['setImmediate'](Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'immediate';
      }
      return 0;
    }function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
      Module['noExitRuntime'] = true;
  
      assert(!Browser.mainLoop.func, 'emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.');
  
      Browser.mainLoop.func = func;
      Browser.mainLoop.arg = arg;
  
      var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
  
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              Browser.mainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + ' ms'); //, left: ' + Browser.mainLoop.remainingBlockers);
          Browser.mainLoop.updateStatus();
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
  
        // catch pauses from non-main loop sources
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Implement very basic swap interval control
        Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
        if (Browser.mainLoop.timingMode == 1/*EM_TIMING_RAF*/ && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
          // Not the scheduled time to render this frame - skip.
          Browser.mainLoop.scheduler();
          return;
        }
  
        // Signal GL rendering layer that processing of a new frame is about to start. This helps it optimize
        // VBO double-buffering and reduce GPU stalls.
  
        if (Browser.mainLoop.method === 'timeout' && Module.ctx) {
          Module.printErr('Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!');
          Browser.mainLoop.method = ''; // just warn once per call to set main loop
        }
  
        Browser.mainLoop.runIter(function() {
          if (typeof arg !== 'undefined') {
            Runtime.dynCall('vi', func, [arg]);
          } else {
            Runtime.dynCall('v', func);
          }
        });
  
        // catch pauses from the main loop itself
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Queue new audio data. This is important to be right after the main loop invocation, so that we will immediately be able
        // to queue the newest produced audio samples.
        // TODO: Consider adding pre- and post- rAF callbacks so that GL.newRenderingFrameStarted() and SDL.audio.queueNewAudioData()
        //       do not need to be hardcoded into this function, but can be more generic.
        if (typeof SDL === 'object' && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  
        Browser.mainLoop.scheduler();
      }
  
      if (!noSetTiming) {
        if (fps && fps > 0) _emscripten_set_main_loop_timing(0/*EM_TIMING_SETTIMEOUT*/, 1000.0 / fps);
        else _emscripten_set_main_loop_timing(1/*EM_TIMING_RAF*/, 1); // Do rAF by rendering each frame (no decimating)
  
        Browser.mainLoop.scheduler();
      }
  
      if (simulateInfiniteLoop) {
        throw 'SimulateInfiniteLoop';
      }
    }var Browser={mainLoop:{scheduler:null,method:"",currentlyRunningMainloop:0,func:null,arg:0,timingMode:0,timingValue:0,currentFrameNumber:0,queue:[],pause:function () {
          Browser.mainLoop.scheduler = null;
          Browser.mainLoop.currentlyRunningMainloop++; // Incrementing this signals the previous main loop that it's now become old, and it must return.
        },resume:function () {
          Browser.mainLoop.currentlyRunningMainloop++;
          var timingMode = Browser.mainLoop.timingMode;
          var timingValue = Browser.mainLoop.timingValue;
          var func = Browser.mainLoop.func;
          Browser.mainLoop.func = null;
          _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true /* do not set timing and call scheduler, we will do it on the next lines */);
          _emscripten_set_main_loop_timing(timingMode, timingValue);
          Browser.mainLoop.scheduler();
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        },runIter:function (func) {
          if (ABORT) return;
          if (Module['preMainLoop']) {
            var preRet = Module['preMainLoop']();
            if (preRet === false) {
              return; // |return false| skips a frame
            }
          }
          try {
            func();
          } catch (e) {
            if (e instanceof ExitStatus) {
              return;
            } else {
              if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
              throw e;
            }
          }
          if (Module['postMainLoop']) Module['postMainLoop']();
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          assert(typeof url == 'string', 'createObjectURL must return a url as a string');
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            assert(typeof url == 'string', 'createObjectURL must return a url as a string');
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas ||
                                document['msPointerLockElement'] === canvas;
        }
        if (canvas) {
          // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
          // Module['forcedAspectRatio'] = 4 / 3;
          
          canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                      canvas['mozRequestPointerLock'] ||
                                      canvas['webkitRequestPointerLock'] ||
                                      canvas['msRequestPointerLock'] ||
                                      function(){};
          canvas.exitPointerLock = document['exitPointerLock'] ||
                                   document['mozExitPointerLock'] ||
                                   document['webkitExitPointerLock'] ||
                                   document['msExitPointerLock'] ||
                                   function(){}; // no-op if function does not exist
          canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
  
          document.addEventListener('pointerlockchange', pointerLockChange, false);
          document.addEventListener('mozpointerlockchange', pointerLockChange, false);
          document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
          document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
          if (Module['elementPointerLock']) {
            canvas.addEventListener("click", function(ev) {
              if (!Browser.pointerLock && canvas.requestPointerLock) {
                canvas.requestPointerLock();
                ev.preventDefault();
              }
            }, false);
          }
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx; // no need to recreate GL context if it's already been created for this canvas.
  
        var ctx;
        var contextHandle;
        if (useWebGL) {
          // For GLES2/desktop GL compatibility, adjust a few defaults to be different to WebGL defaults, so that they align better with the desktop defaults.
          var contextAttributes = {
            antialias: false,
            alpha: false
          };
  
          if (webGLContextAttributes) {
            for (var attribute in webGLContextAttributes) {
              contextAttributes[attribute] = webGLContextAttributes[attribute];
            }
          }
  
          contextHandle = GL.createContext(canvas, contextAttributes);
          if (contextHandle) {
            ctx = GL.getContext(contextHandle).GLctx;
          }
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
        } else {
          ctx = canvas.getContext('2d');
        }
  
        if (!ctx) return null;
  
        if (setInModule) {
          if (!useWebGL) assert(typeof GLctx === 'undefined', 'cannot set in module if GLctx is used, but we are a non-GL context that would replace it');
  
          Module.ctx = ctx;
          if (useWebGL) GL.makeContextCurrent(contextHandle);
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas, vrDevice) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        Browser.vrDevice = vrDevice;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        if (typeof Browser.vrDevice === 'undefined') Browser.vrDevice = null;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
  
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
  
        if (vrDevice) {
          canvasContainer.requestFullScreen({ vrDisplay: vrDevice });
        } else {
          canvasContainer.requestFullScreen();
        }
      },nextRAF:0,fakeRequestAnimationFrame:function (func) {
        // try to keep 60fps between calls to here
        var now = Date.now();
        if (Browser.nextRAF === 0) {
          Browser.nextRAF = now + 1000/60;
        } else {
          while (now + 2 >= Browser.nextRAF) { // fudge a little, to avoid timer jitter causing us to do lots of delay:0
            Browser.nextRAF += 1000/60;
          }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay);
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          Browser.fakeRequestAnimationFrame(func);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           Browser.fakeRequestAnimationFrame;
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },allowAsyncCallbacks:true,queuedAsyncCallbacks:[],pauseAsyncCallbacks:function () {
        Browser.allowAsyncCallbacks = false;
      },resumeAsyncCallbacks:function () { // marks future callbacks as ok to execute, and synchronously runs any remaining ones right now
        Browser.allowAsyncCallbacks = true;
        if (Browser.queuedAsyncCallbacks.length > 0) {
          var callbacks = Browser.queuedAsyncCallbacks;
          Browser.queuedAsyncCallbacks = [];
          callbacks.forEach(function(func) {
            func();
          });
        }
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        });
      },safeSetTimeout:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setTimeout(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setInterval(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } // drop it on the floor otherwise, next interval will kick in
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        var delta = 0;
        switch (event.type) {
          case 'DOMMouseScroll': 
            delta = event.detail;
            break;
          case 'mousewheel': 
            delta = event.wheelDelta;
            break;
          case 'wheel': 
            delta = event['deltaY'];
            break;
          default:
            throw 'unrecognized mouse wheel event: ' + event.type;
        }
        return delta;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          // If this assert lands, it's likely because the browser doesn't support scrollX or pageXOffset
          // and we have no viable fallback.
          assert((typeof scrollX !== 'undefined') && (typeof scrollY !== 'undefined'), 'Unable to retrieve scroll position, mouse positions likely broken.');
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              var last = Browser.touches[touch.identifier];
              if (!last) last = coords;
              Browser.lastTouches[touch.identifier] = last;
              Browser.touches[touch.identifier] = coords;
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      },wgetRequests:{},nextWgetRequestHandle:0,getNextWgetRequestHandle:function () {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle;
      }};

  function _time(ptr) {
      var ret = (Date.now()/1000)|0;
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }

  function ___syscall140(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // llseek
      var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
      var offset = offset_low;
      assert(offset_high === 0);
      FS.llseek(stream, offset, whence);
      HEAP32[((result)>>2)]=stream.position;
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall146(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // writev
      // hack to support printf in NO_FILESYSTEM
      var stream = SYSCALLS.get(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
      var ret = 0;
      if (!___syscall146.buffer) ___syscall146.buffer = [];
      var buffer = ___syscall146.buffer;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAP32[(((iov)+(i*8))>>2)];
        var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
        for (var j = 0; j < len; j++) {
          var curr = HEAPU8[ptr+j];
          if (curr === 0 || curr === 10) {
            Module['print'](UTF8ArrayToString(buffer, 0));
            buffer.length = 0;
          } else {
            buffer.push(curr);
          }
        }
        ret += len;
      }
      return ret;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall54(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // ioctl
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas, vrDevice) { Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
  Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) { return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes) }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + TOTAL_STACK;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);


var debug_table_i = ["0", "jsCall_i_0", "jsCall_i_1", "jsCall_i_2", "jsCall_i_3", "jsCall_i_4", "jsCall_i_5", "jsCall_i_6", "jsCall_i_7", "0", "0", "0", "0", "0", "0", "0", "0", "0", "_u8rnd", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"];
var debug_table_ii = ["0", "jsCall_ii_0", "jsCall_ii_1", "jsCall_ii_2", "jsCall_ii_3", "jsCall_ii_4", "jsCall_ii_5", "jsCall_ii_6", "jsCall_ii_7", "0", "0", "0", "0", "0", "0", "0", "0", "0", "___stdio_close", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"];
var debug_table_iiii = ["0", "jsCall_iiii_0", "jsCall_iiii_1", "jsCall_iiii_2", "jsCall_iiii_3", "jsCall_iiii_4", "jsCall_iiii_5", "jsCall_iiii_6", "jsCall_iiii_7", "0", "0", "0", "0", "0", "0", "0", "0", "0", "___stdio_write", "___stdio_seek", "___stdout_write", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"];
var debug_table_vi = ["0", "jsCall_vi_0", "jsCall_vi_1", "jsCall_vi_2", "jsCall_vi_3", "jsCall_vi_4", "jsCall_vi_5", "jsCall_vi_6", "jsCall_vi_7", "0", "0", "0", "0", "0", "0", "0", "0", "0", "_cleanup392", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"];
function nullFunc_i(x) { Module["printErr"]("Invalid function pointer '" + x + "' called with signature 'i'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("This pointer might make sense in another type signature: ii: " + debug_table_ii[x] + "  iiii: " + debug_table_iiii[x] + "  vi: " + debug_table_vi[x] + "  "); abort(x) }

function nullFunc_ii(x) { Module["printErr"]("Invalid function pointer '" + x + "' called with signature 'ii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("This pointer might make sense in another type signature: i: " + debug_table_i[x] + "  iiii: " + debug_table_iiii[x] + "  vi: " + debug_table_vi[x] + "  "); abort(x) }

function nullFunc_iiii(x) { Module["printErr"]("Invalid function pointer '" + x + "' called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("This pointer might make sense in another type signature: ii: " + debug_table_ii[x] + "  i: " + debug_table_i[x] + "  vi: " + debug_table_vi[x] + "  "); abort(x) }

function nullFunc_vi(x) { Module["printErr"]("Invalid function pointer '" + x + "' called with signature 'vi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("This pointer might make sense in another type signature: i: " + debug_table_i[x] + "  ii: " + debug_table_ii[x] + "  iiii: " + debug_table_iiii[x] + "  "); abort(x) }

function invoke_i(index) {
  try {
    return Module["dynCall_i"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function jsCall_i(index) {
    return Runtime.functionPointers[index]();
}

function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function jsCall_ii(index,a1) {
    return Runtime.functionPointers[index](a1);
}

function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function jsCall_iiii(index,a1,a2,a3) {
    return Runtime.functionPointers[index](a1,a2,a3);
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function jsCall_vi(index,a1) {
    Runtime.functionPointers[index](a1);
}

Module.asmGlobalArg = { "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array, "NaN": NaN, "Infinity": Infinity };

Module.asmLibraryArg = { "abort": abort, "assert": assert, "nullFunc_i": nullFunc_i, "nullFunc_ii": nullFunc_ii, "nullFunc_iiii": nullFunc_iiii, "nullFunc_vi": nullFunc_vi, "invoke_i": invoke_i, "jsCall_i": jsCall_i, "invoke_ii": invoke_ii, "jsCall_ii": jsCall_ii, "invoke_iiii": invoke_iiii, "jsCall_iiii": jsCall_iiii, "invoke_vi": invoke_vi, "jsCall_vi": jsCall_vi, "_pthread_cleanup_pop": _pthread_cleanup_pop, "_abort": _abort, "___setErrNo": ___setErrNo, "_emscripten_set_main_loop_timing": _emscripten_set_main_loop_timing, "_sbrk": _sbrk, "_llvm_pow_f32": _llvm_pow_f32, "_emscripten_memcpy_big": _emscripten_memcpy_big, "__exit": __exit, "_pthread_self": _pthread_self, "___syscall140": ___syscall140, "___syscall54": ___syscall54, "___unlock": ___unlock, "_emscripten_set_main_loop": _emscripten_set_main_loop, "_sysconf": _sysconf, "___lock": ___lock, "___syscall6": ___syscall6, "_pthread_cleanup_push": _pthread_cleanup_push, "_time": _time, "_sqrt": _sqrt, "_exit": _exit, "___syscall146": ___syscall146, "_emscripten_asm_const_0": _emscripten_asm_const_0, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8 };
// EMSCRIPTEN_START_ASM
var asm = (function(global, env, buffer) {
  'almost asm';
  
  
  var HEAP8 = new global.Int8Array(buffer);
  var HEAP16 = new global.Int16Array(buffer);
  var HEAP32 = new global.Int32Array(buffer);
  var HEAPU8 = new global.Uint8Array(buffer);
  var HEAPU16 = new global.Uint16Array(buffer);
  var HEAPU32 = new global.Uint32Array(buffer);
  var HEAPF32 = new global.Float32Array(buffer);
  var HEAPF64 = new global.Float64Array(buffer);


  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var cttz_i8=env.cttz_i8|0;

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var nan = global.NaN, inf = global.Infinity;
  var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;

  var tempRet0 = 0;
  var tempRet1 = 0;
  var tempRet2 = 0;
  var tempRet3 = 0;
  var tempRet4 = 0;
  var tempRet5 = 0;
  var tempRet6 = 0;
  var tempRet7 = 0;
  var tempRet8 = 0;
  var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var Math_min=global.Math.min;
  var Math_clz32=global.Math.clz32;
  var abort=env.abort;
  var assert=env.assert;
  var nullFunc_i=env.nullFunc_i;
  var nullFunc_ii=env.nullFunc_ii;
  var nullFunc_iiii=env.nullFunc_iiii;
  var nullFunc_vi=env.nullFunc_vi;
  var invoke_i=env.invoke_i;
  var jsCall_i=env.jsCall_i;
  var invoke_ii=env.invoke_ii;
  var jsCall_ii=env.jsCall_ii;
  var invoke_iiii=env.invoke_iiii;
  var jsCall_iiii=env.jsCall_iiii;
  var invoke_vi=env.invoke_vi;
  var jsCall_vi=env.jsCall_vi;
  var _pthread_cleanup_pop=env._pthread_cleanup_pop;
  var _abort=env._abort;
  var ___setErrNo=env.___setErrNo;
  var _emscripten_set_main_loop_timing=env._emscripten_set_main_loop_timing;
  var _sbrk=env._sbrk;
  var _llvm_pow_f32=env._llvm_pow_f32;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var __exit=env.__exit;
  var _pthread_self=env._pthread_self;
  var ___syscall140=env.___syscall140;
  var ___syscall54=env.___syscall54;
  var ___unlock=env.___unlock;
  var _emscripten_set_main_loop=env._emscripten_set_main_loop;
  var _sysconf=env._sysconf;
  var ___lock=env.___lock;
  var ___syscall6=env.___syscall6;
  var _pthread_cleanup_push=env._pthread_cleanup_push;
  var _time=env._time;
  var _sqrt=env._sqrt;
  var _exit=env._exit;
  var ___syscall146=env.___syscall146;
  var _emscripten_asm_const_0=env._emscripten_asm_const_0;
  var tempFloat = 0.0;

// EMSCRIPTEN_START_FUNCS
function stackAlloc(size) {
  size = size|0;
  var ret = 0;
  ret = STACKTOP;
  STACKTOP = (STACKTOP + size)|0;
  STACKTOP = (STACKTOP + 15)&-16;
if ((STACKTOP|0) >= (STACK_MAX|0)) abort();

  return ret|0;
}
function stackSave() {
  return STACKTOP|0;
}
function stackRestore(top) {
  top = top|0;
  STACKTOP = top;
}
function establishStackSpace(stackBase, stackMax) {
  stackBase = stackBase|0;
  stackMax = stackMax|0;
  STACKTOP = stackBase;
  STACK_MAX = stackMax;
}

function setThrew(threw, value) {
  threw = threw|0;
  value = value|0;
  if ((__THREW__|0) == 0) {
    __THREW__ = threw;
    threwValue = value;
  }
}
function copyTempFloat(ptr) {
  ptr = ptr|0;
  HEAP8[tempDoublePtr>>0] = HEAP8[ptr>>0];
  HEAP8[tempDoublePtr+1>>0] = HEAP8[ptr+1>>0];
  HEAP8[tempDoublePtr+2>>0] = HEAP8[ptr+2>>0];
  HEAP8[tempDoublePtr+3>>0] = HEAP8[ptr+3>>0];
}
function copyTempDouble(ptr) {
  ptr = ptr|0;
  HEAP8[tempDoublePtr>>0] = HEAP8[ptr>>0];
  HEAP8[tempDoublePtr+1>>0] = HEAP8[ptr+1>>0];
  HEAP8[tempDoublePtr+2>>0] = HEAP8[ptr+2>>0];
  HEAP8[tempDoublePtr+3>>0] = HEAP8[ptr+3>>0];
  HEAP8[tempDoublePtr+4>>0] = HEAP8[ptr+4>>0];
  HEAP8[tempDoublePtr+5>>0] = HEAP8[ptr+5>>0];
  HEAP8[tempDoublePtr+6>>0] = HEAP8[ptr+6>>0];
  HEAP8[tempDoublePtr+7>>0] = HEAP8[ptr+7>>0];
}

function setTempRet0(value) {
  value = value|0;
  tempRet0 = value;
}
function getTempRet0() {
  return tempRet0|0;
}

function _randombytes_random() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = _emscripten_asm_const_0(0)|0; //@line 70 "libsodium/src/libsodium/randombytes/randombytes.c"
 return ($0|0); //@line 70 "libsodium/src/libsodium/randombytes/randombytes.c"
}
function _randombytes_stir() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 _emscripten_asm_const_0(1); //@line 85 "libsodium/src/libsodium/randombytes/randombytes.c"
 return; //@line 113 "libsodium/src/libsodium/randombytes/randombytes.c"
}
function _randombytes_buf($buf,$size) {
 $buf = $buf|0;
 $size = $size|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, $p = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $buf;
 $1 = $size;
 $2 = $0; //@line 151 "libsodium/src/libsodium/randombytes/randombytes.c"
 $p = $2; //@line 151 "libsodium/src/libsodium/randombytes/randombytes.c"
 $i = 0; //@line 154 "libsodium/src/libsodium/randombytes/randombytes.c"
 while(1) {
  $3 = $i; //@line 154 "libsodium/src/libsodium/randombytes/randombytes.c"
  $4 = $1; //@line 154 "libsodium/src/libsodium/randombytes/randombytes.c"
  $5 = ($3>>>0)<($4>>>0); //@line 154 "libsodium/src/libsodium/randombytes/randombytes.c"
  if (!($5)) {
   break;
  }
  $6 = (_randombytes_random()|0); //@line 155 "libsodium/src/libsodium/randombytes/randombytes.c"
  $7 = $6&255; //@line 155 "libsodium/src/libsodium/randombytes/randombytes.c"
  $8 = $i; //@line 155 "libsodium/src/libsodium/randombytes/randombytes.c"
  $9 = $p; //@line 155 "libsodium/src/libsodium/randombytes/randombytes.c"
  $10 = (($9) + ($8)|0); //@line 155 "libsodium/src/libsodium/randombytes/randombytes.c"
  HEAP8[$10>>0] = $7; //@line 155 "libsodium/src/libsodium/randombytes/randombytes.c"
  $11 = $i; //@line 154 "libsodium/src/libsodium/randombytes/randombytes.c"
  $12 = (($11) + 1)|0; //@line 154 "libsodium/src/libsodium/randombytes/randombytes.c"
  $i = $12; //@line 154 "libsodium/src/libsodium/randombytes/randombytes.c"
 }
 STACKTOP = sp;return; //@line 158 "libsodium/src/libsodium/randombytes/randombytes.c"
}
function _l2($x) {
 $x = $x|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $x;
 $2 = $1; //@line 58 "HyMES/arith.c"
 $3 = $2 >>> 16; //@line 58 "HyMES/arith.c"
 $4 = ($3|0)!=(0); //@line 58 "HyMES/arith.c"
 $5 = $1; //@line 59 "HyMES/arith.c"
 if ($4) {
  $6 = $5 >>> 24; //@line 59 "HyMES/arith.c"
  $7 = ($6|0)!=(0); //@line 59 "HyMES/arith.c"
  $8 = $1; //@line 60 "HyMES/arith.c"
  if ($7) {
   $9 = $8 >>> 24; //@line 60 "HyMES/arith.c"
   $10 = (9279 + ($9)|0); //@line 60 "HyMES/arith.c"
   $11 = HEAP8[$10>>0]|0; //@line 60 "HyMES/arith.c"
   $12 = $11 << 24 >> 24; //@line 60 "HyMES/arith.c"
   $13 = (($12) + 24)|0; //@line 60 "HyMES/arith.c"
   $0 = $13; //@line 60 "HyMES/arith.c"
   $30 = $0; //@line 67 "HyMES/arith.c"
   STACKTOP = sp;return ($30|0); //@line 67 "HyMES/arith.c"
  } else {
   $14 = $8 >>> 16; //@line 62 "HyMES/arith.c"
   $15 = (9279 + ($14)|0); //@line 62 "HyMES/arith.c"
   $16 = HEAP8[$15>>0]|0; //@line 62 "HyMES/arith.c"
   $17 = $16 << 24 >> 24; //@line 62 "HyMES/arith.c"
   $18 = (($17) + 16)|0; //@line 62 "HyMES/arith.c"
   $0 = $18; //@line 62 "HyMES/arith.c"
   $30 = $0; //@line 67 "HyMES/arith.c"
   STACKTOP = sp;return ($30|0); //@line 67 "HyMES/arith.c"
  }
 } else {
  $19 = $5 >>> 8; //@line 63 "HyMES/arith.c"
  $20 = ($19|0)!=(0); //@line 63 "HyMES/arith.c"
  $21 = $1; //@line 64 "HyMES/arith.c"
  if ($20) {
   $22 = $21 >>> 8; //@line 64 "HyMES/arith.c"
   $23 = (9279 + ($22)|0); //@line 64 "HyMES/arith.c"
   $24 = HEAP8[$23>>0]|0; //@line 64 "HyMES/arith.c"
   $25 = $24 << 24 >> 24; //@line 64 "HyMES/arith.c"
   $26 = (($25) + 8)|0; //@line 64 "HyMES/arith.c"
   $0 = $26; //@line 64 "HyMES/arith.c"
   $30 = $0; //@line 67 "HyMES/arith.c"
   STACKTOP = sp;return ($30|0); //@line 67 "HyMES/arith.c"
  } else {
   $27 = (9279 + ($21)|0); //@line 66 "HyMES/arith.c"
   $28 = HEAP8[$27>>0]|0; //@line 66 "HyMES/arith.c"
   $29 = $28 << 24 >> 24; //@line 66 "HyMES/arith.c"
   $0 = $29; //@line 66 "HyMES/arith.c"
   $30 = $0; //@line 67 "HyMES/arith.c"
   STACKTOP = sp;return ($30|0); //@line 67 "HyMES/arith.c"
  }
 }
 return (0)|0;
}
function _arith_init($b) {
 $b = $b|0;
 var $0 = 0, $1 = 0, $10 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $state = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $b;
 $1 = (_malloc(16)|0); //@line 72 "HyMES/arith.c"
 $state = $1; //@line 72 "HyMES/arith.c"
 $2 = $state; //@line 74 "HyMES/arith.c"
 $3 = ((($2)) + 4|0); //@line 74 "HyMES/arith.c"
 HEAP32[$3>>2] = 0; //@line 74 "HyMES/arith.c"
 $4 = $state; //@line 75 "HyMES/arith.c"
 $5 = ((($4)) + 8|0); //@line 75 "HyMES/arith.c"
 HEAP32[$5>>2] = 2097152; //@line 75 "HyMES/arith.c"
 $6 = $state; //@line 76 "HyMES/arith.c"
 HEAP32[$6>>2] = 0; //@line 76 "HyMES/arith.c"
 $7 = $0; //@line 77 "HyMES/arith.c"
 $8 = $state; //@line 77 "HyMES/arith.c"
 $9 = ((($8)) + 12|0); //@line 77 "HyMES/arith.c"
 HEAP32[$9>>2] = $7; //@line 77 "HyMES/arith.c"
 $10 = $state; //@line 79 "HyMES/arith.c"
 STACKTOP = sp;return ($10|0); //@line 79 "HyMES/arith.c"
}
function _ajuster($state,$coder) {
 $state = $state|0;
 $coder = $coder|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0;
 var $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0;
 var $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0;
 var $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0;
 var $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0;
 var $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $i = 0, $j = 0, $x = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $state;
 $1 = $coder;
 $2 = $0; //@line 91 "HyMES/arith.c"
 $3 = ((($2)) + 8|0); //@line 91 "HyMES/arith.c"
 $4 = HEAP32[$3>>2]|0; //@line 91 "HyMES/arith.c"
 $5 = (($4) - 1)|0; //@line 91 "HyMES/arith.c"
 $6 = $0; //@line 91 "HyMES/arith.c"
 $7 = ((($6)) + 4|0); //@line 91 "HyMES/arith.c"
 $8 = HEAP32[$7>>2]|0; //@line 91 "HyMES/arith.c"
 $9 = $5 ^ $8; //@line 91 "HyMES/arith.c"
 $x = $9; //@line 91 "HyMES/arith.c"
 $10 = $x; //@line 92 "HyMES/arith.c"
 $11 = (_l2($10)|0); //@line 92 "HyMES/arith.c"
 $12 = (21 - ($11))|0; //@line 92 "HyMES/arith.c"
 $i = $12; //@line 92 "HyMES/arith.c"
 $13 = $0; //@line 97 "HyMES/arith.c"
 $14 = ((($13)) + 8|0); //@line 97 "HyMES/arith.c"
 $15 = HEAP32[$14>>2]|0; //@line 97 "HyMES/arith.c"
 $16 = (($15) - 1)|0; //@line 97 "HyMES/arith.c"
 $17 = $0; //@line 97 "HyMES/arith.c"
 $18 = ((($17)) + 4|0); //@line 97 "HyMES/arith.c"
 $19 = HEAP32[$18>>2]|0; //@line 97 "HyMES/arith.c"
 $20 = (($16) - ($19))|0; //@line 97 "HyMES/arith.c"
 $x = $20; //@line 97 "HyMES/arith.c"
 $21 = $x; //@line 98 "HyMES/arith.c"
 $22 = (_l2($21)|0); //@line 98 "HyMES/arith.c"
 $23 = (21 - ($22))|0; //@line 98 "HyMES/arith.c"
 $24 = (($23) - 1)|0; //@line 98 "HyMES/arith.c"
 $j = $24; //@line 98 "HyMES/arith.c"
 $25 = $i; //@line 110 "HyMES/arith.c"
 $26 = $j; //@line 110 "HyMES/arith.c"
 $27 = ($25|0)>($26|0); //@line 110 "HyMES/arith.c"
 if ($27) {
  $28 = $j; //@line 111 "HyMES/arith.c"
  $i = $28; //@line 111 "HyMES/arith.c"
 }
 $29 = $i; //@line 112 "HyMES/arith.c"
 $30 = ($29|0)>(0); //@line 112 "HyMES/arith.c"
 if ($30) {
  $31 = $1; //@line 113 "HyMES/arith.c"
  $32 = ($31|0)!=(0); //@line 113 "HyMES/arith.c"
  if ($32) {
   $33 = $0; //@line 114 "HyMES/arith.c"
   $34 = ((($33)) + 4|0); //@line 114 "HyMES/arith.c"
   $35 = HEAP32[$34>>2]|0; //@line 114 "HyMES/arith.c"
   $36 = $35 >>> 20; //@line 114 "HyMES/arith.c"
   $x = $36; //@line 114 "HyMES/arith.c"
   $37 = $0; //@line 115 "HyMES/arith.c"
   $38 = ((($37)) + 4|0); //@line 115 "HyMES/arith.c"
   $39 = HEAP32[$38>>2]|0; //@line 115 "HyMES/arith.c"
   $40 = $39 & -1048577; //@line 115 "HyMES/arith.c"
   HEAP32[$38>>2] = $40; //@line 115 "HyMES/arith.c"
   $41 = $x; //@line 116 "HyMES/arith.c"
   $42 = $0; //@line 116 "HyMES/arith.c"
   $43 = ((($42)) + 12|0); //@line 116 "HyMES/arith.c"
   $44 = HEAP32[$43>>2]|0; //@line 116 "HyMES/arith.c"
   _bwrite_bit($41,$44); //@line 116 "HyMES/arith.c"
   $45 = $x; //@line 117 "HyMES/arith.c"
   $46 = (1 - ($45))|0; //@line 117 "HyMES/arith.c"
   $47 = $0; //@line 117 "HyMES/arith.c"
   $48 = HEAP32[$47>>2]|0; //@line 117 "HyMES/arith.c"
   $49 = $0; //@line 117 "HyMES/arith.c"
   $50 = ((($49)) + 12|0); //@line 117 "HyMES/arith.c"
   $51 = HEAP32[$50>>2]|0; //@line 117 "HyMES/arith.c"
   _bwrite_bits($46,$48,$51); //@line 117 "HyMES/arith.c"
   $52 = $0; //@line 118 "HyMES/arith.c"
   $53 = ((($52)) + 4|0); //@line 118 "HyMES/arith.c"
   $54 = HEAP32[$53>>2]|0; //@line 118 "HyMES/arith.c"
   $55 = $i; //@line 118 "HyMES/arith.c"
   $56 = (21 - ($55))|0; //@line 118 "HyMES/arith.c"
   $57 = $54 >>> $56; //@line 118 "HyMES/arith.c"
   $58 = $i; //@line 118 "HyMES/arith.c"
   $59 = (($58) - 1)|0; //@line 118 "HyMES/arith.c"
   $60 = $0; //@line 118 "HyMES/arith.c"
   $61 = ((($60)) + 12|0); //@line 118 "HyMES/arith.c"
   $62 = HEAP32[$61>>2]|0; //@line 118 "HyMES/arith.c"
   _bwrite($57,$59,$62); //@line 118 "HyMES/arith.c"
  }
  $63 = $0; //@line 120 "HyMES/arith.c"
  HEAP32[$63>>2] = 0; //@line 120 "HyMES/arith.c"
 }
 $64 = $0; //@line 122 "HyMES/arith.c"
 $65 = ((($64)) + 8|0); //@line 122 "HyMES/arith.c"
 $66 = HEAP32[$65>>2]|0; //@line 122 "HyMES/arith.c"
 $67 = $j; //@line 122 "HyMES/arith.c"
 $68 = $66 << $67; //@line 122 "HyMES/arith.c"
 $69 = $68 & 2097151; //@line 122 "HyMES/arith.c"
 $70 = $0; //@line 122 "HyMES/arith.c"
 $71 = ((($70)) + 8|0); //@line 122 "HyMES/arith.c"
 HEAP32[$71>>2] = $69; //@line 122 "HyMES/arith.c"
 $72 = $0; //@line 123 "HyMES/arith.c"
 $73 = ((($72)) + 8|0); //@line 123 "HyMES/arith.c"
 $74 = HEAP32[$73>>2]|0; //@line 123 "HyMES/arith.c"
 $75 = ($74|0)==(0); //@line 123 "HyMES/arith.c"
 if ($75) {
  $76 = $0; //@line 124 "HyMES/arith.c"
  $77 = ((($76)) + 8|0); //@line 124 "HyMES/arith.c"
  HEAP32[$77>>2] = 2097152; //@line 124 "HyMES/arith.c"
 }
 $78 = $0; //@line 125 "HyMES/arith.c"
 $79 = ((($78)) + 4|0); //@line 125 "HyMES/arith.c"
 $80 = HEAP32[$79>>2]|0; //@line 125 "HyMES/arith.c"
 $81 = $j; //@line 125 "HyMES/arith.c"
 $82 = $80 << $81; //@line 125 "HyMES/arith.c"
 $83 = $82 & 2097151; //@line 125 "HyMES/arith.c"
 $84 = $0; //@line 125 "HyMES/arith.c"
 $85 = ((($84)) + 4|0); //@line 125 "HyMES/arith.c"
 HEAP32[$85>>2] = $83; //@line 125 "HyMES/arith.c"
 $86 = $j; //@line 126 "HyMES/arith.c"
 $87 = $i; //@line 126 "HyMES/arith.c"
 $88 = (($86) - ($87))|0; //@line 126 "HyMES/arith.c"
 $89 = ($88|0)>(0); //@line 126 "HyMES/arith.c"
 if (!($89)) {
  $104 = $j; //@line 132 "HyMES/arith.c"
  STACKTOP = sp;return ($104|0); //@line 132 "HyMES/arith.c"
 }
 $90 = $0; //@line 127 "HyMES/arith.c"
 $91 = ((($90)) + 8|0); //@line 127 "HyMES/arith.c"
 $92 = HEAP32[$91>>2]|0; //@line 127 "HyMES/arith.c"
 $93 = $92 ^ 1048576; //@line 127 "HyMES/arith.c"
 HEAP32[$91>>2] = $93; //@line 127 "HyMES/arith.c"
 $94 = $0; //@line 128 "HyMES/arith.c"
 $95 = ((($94)) + 4|0); //@line 128 "HyMES/arith.c"
 $96 = HEAP32[$95>>2]|0; //@line 128 "HyMES/arith.c"
 $97 = $96 ^ 1048576; //@line 128 "HyMES/arith.c"
 HEAP32[$95>>2] = $97; //@line 128 "HyMES/arith.c"
 $98 = $j; //@line 129 "HyMES/arith.c"
 $99 = $i; //@line 129 "HyMES/arith.c"
 $100 = (($98) - ($99))|0; //@line 129 "HyMES/arith.c"
 $101 = $0; //@line 129 "HyMES/arith.c"
 $102 = HEAP32[$101>>2]|0; //@line 129 "HyMES/arith.c"
 $103 = (($102) + ($100))|0; //@line 129 "HyMES/arith.c"
 HEAP32[$101>>2] = $103; //@line 129 "HyMES/arith.c"
 $104 = $j; //@line 132 "HyMES/arith.c"
 STACKTOP = sp;return ($104|0); //@line 132 "HyMES/arith.c"
}
function _coder($i,$d,$state) {
 $i = $i|0;
 $d = $d|0;
 $state = $state|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $delta = 0;
 var $l = 0, $x = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $i;
 $1 = $state;
 $2 = $1; //@line 146 "HyMES/arith.c"
 $3 = ((($2)) + 8|0); //@line 146 "HyMES/arith.c"
 $4 = HEAP32[$3>>2]|0; //@line 146 "HyMES/arith.c"
 $5 = $1; //@line 146 "HyMES/arith.c"
 $6 = ((($5)) + 4|0); //@line 146 "HyMES/arith.c"
 $7 = HEAP32[$6>>2]|0; //@line 146 "HyMES/arith.c"
 $8 = (($4) - ($7))|0; //@line 146 "HyMES/arith.c"
 $delta = $8; //@line 146 "HyMES/arith.c"
 $9 = $1; //@line 149 "HyMES/arith.c"
 $10 = HEAP32[$9>>2]|0; //@line 149 "HyMES/arith.c"
 $11 = (21 + ($10))|0; //@line 149 "HyMES/arith.c"
 $12 = $1; //@line 149 "HyMES/arith.c"
 $13 = ((($12)) + 12|0); //@line 149 "HyMES/arith.c"
 $14 = HEAP32[$13>>2]|0; //@line 149 "HyMES/arith.c"
 _bwrite_lock($11,$14); //@line 149 "HyMES/arith.c"
 $15 = $0; //@line 151 "HyMES/arith.c"
 $16 = ((($d)) + 4|0); //@line 151 "HyMES/arith.c"
 $17 = HEAP32[$16>>2]|0; //@line 151 "HyMES/arith.c"
 $18 = ($15>>>0)<($17>>>0); //@line 151 "HyMES/arith.c"
 if ($18) {
  $19 = $0; //@line 152 "HyMES/arith.c"
  $20 = (($19) + 1)|0; //@line 152 "HyMES/arith.c"
  $21 = HEAP32[$d>>2]|0; //@line 152 "HyMES/arith.c"
  $22 = (($20) - ($21))|0; //@line 152 "HyMES/arith.c"
  $23 = ((($d)) + 8|0); //@line 152 "HyMES/arith.c"
  $24 = HEAP32[$23>>2]|0; //@line 152 "HyMES/arith.c"
  $25 = (($24) + ($22<<2)|0); //@line 152 "HyMES/arith.c"
  $26 = HEAP32[$25>>2]|0; //@line 152 "HyMES/arith.c"
  $x = $26; //@line 152 "HyMES/arith.c"
  $27 = $delta; //@line 153 "HyMES/arith.c"
  $28 = $x; //@line 153 "HyMES/arith.c"
  $29 = Math_imul($28, $27)|0; //@line 153 "HyMES/arith.c"
  $x = $29; //@line 153 "HyMES/arith.c"
  $30 = $x; //@line 154 "HyMES/arith.c"
  $31 = $30 >>> 11; //@line 154 "HyMES/arith.c"
  $x = $31; //@line 154 "HyMES/arith.c"
  $32 = $1; //@line 155 "HyMES/arith.c"
  $33 = ((($32)) + 4|0); //@line 155 "HyMES/arith.c"
  $34 = HEAP32[$33>>2]|0; //@line 155 "HyMES/arith.c"
  $35 = $x; //@line 155 "HyMES/arith.c"
  $36 = (($34) + ($35))|0; //@line 155 "HyMES/arith.c"
  $37 = $1; //@line 155 "HyMES/arith.c"
  $38 = ((($37)) + 8|0); //@line 155 "HyMES/arith.c"
  HEAP32[$38>>2] = $36; //@line 155 "HyMES/arith.c"
 }
 $39 = $0; //@line 157 "HyMES/arith.c"
 $40 = HEAP32[$d>>2]|0; //@line 157 "HyMES/arith.c"
 $41 = (($39) - ($40))|0; //@line 157 "HyMES/arith.c"
 $42 = ((($d)) + 8|0); //@line 157 "HyMES/arith.c"
 $43 = HEAP32[$42>>2]|0; //@line 157 "HyMES/arith.c"
 $44 = (($43) + ($41<<2)|0); //@line 157 "HyMES/arith.c"
 $45 = HEAP32[$44>>2]|0; //@line 157 "HyMES/arith.c"
 $x = $45; //@line 157 "HyMES/arith.c"
 $46 = $delta; //@line 158 "HyMES/arith.c"
 $47 = $x; //@line 158 "HyMES/arith.c"
 $48 = Math_imul($47, $46)|0; //@line 158 "HyMES/arith.c"
 $x = $48; //@line 158 "HyMES/arith.c"
 $49 = $x; //@line 159 "HyMES/arith.c"
 $50 = $49 >>> 11; //@line 159 "HyMES/arith.c"
 $x = $50; //@line 159 "HyMES/arith.c"
 $51 = $x; //@line 160 "HyMES/arith.c"
 $52 = $1; //@line 160 "HyMES/arith.c"
 $53 = ((($52)) + 4|0); //@line 160 "HyMES/arith.c"
 $54 = HEAP32[$53>>2]|0; //@line 160 "HyMES/arith.c"
 $55 = (($54) + ($51))|0; //@line 160 "HyMES/arith.c"
 HEAP32[$53>>2] = $55; //@line 160 "HyMES/arith.c"
 $56 = $1; //@line 166 "HyMES/arith.c"
 $57 = (_ajuster($56,1)|0); //@line 166 "HyMES/arith.c"
 $l = $57; //@line 166 "HyMES/arith.c"
 $58 = $l; //@line 172 "HyMES/arith.c"
 STACKTOP = sp;return ($58|0); //@line 172 "HyMES/arith.c"
}
function _coder_uniforme($i,$n,$state) {
 $i = $i|0;
 $n = $n|0;
 $state = $state|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, $delta = 0, $l = 0, $x = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $i;
 $1 = $n;
 $2 = $state;
 $3 = $2; //@line 185 "HyMES/arith.c"
 $4 = ((($3)) + 8|0); //@line 185 "HyMES/arith.c"
 $5 = HEAP32[$4>>2]|0; //@line 185 "HyMES/arith.c"
 $6 = $2; //@line 185 "HyMES/arith.c"
 $7 = ((($6)) + 4|0); //@line 185 "HyMES/arith.c"
 $8 = HEAP32[$7>>2]|0; //@line 185 "HyMES/arith.c"
 $9 = (($5) - ($8))|0; //@line 185 "HyMES/arith.c"
 $delta = $9; //@line 185 "HyMES/arith.c"
 $10 = $2; //@line 188 "HyMES/arith.c"
 $11 = HEAP32[$10>>2]|0; //@line 188 "HyMES/arith.c"
 $12 = (21 + ($11))|0; //@line 188 "HyMES/arith.c"
 $13 = $2; //@line 188 "HyMES/arith.c"
 $14 = ((($13)) + 12|0); //@line 188 "HyMES/arith.c"
 $15 = HEAP32[$14>>2]|0; //@line 188 "HyMES/arith.c"
 _bwrite_lock($12,$15); //@line 188 "HyMES/arith.c"
 $16 = $0; //@line 190 "HyMES/arith.c"
 $x = $16; //@line 190 "HyMES/arith.c"
 $17 = $delta; //@line 191 "HyMES/arith.c"
 $18 = $x; //@line 191 "HyMES/arith.c"
 $19 = Math_imul($18, $17)|0; //@line 191 "HyMES/arith.c"
 $x = $19; //@line 191 "HyMES/arith.c"
 $20 = $2; //@line 193 "HyMES/arith.c"
 $21 = ((($20)) + 4|0); //@line 193 "HyMES/arith.c"
 $22 = HEAP32[$21>>2]|0; //@line 193 "HyMES/arith.c"
 $23 = $x; //@line 193 "HyMES/arith.c"
 $24 = $delta; //@line 193 "HyMES/arith.c"
 $25 = (($23) + ($24))|0; //@line 193 "HyMES/arith.c"
 $26 = $1; //@line 193 "HyMES/arith.c"
 $27 = (($25>>>0) / ($26>>>0))&-1; //@line 193 "HyMES/arith.c"
 $28 = (($22) + ($27))|0; //@line 193 "HyMES/arith.c"
 $29 = $2; //@line 193 "HyMES/arith.c"
 $30 = ((($29)) + 8|0); //@line 193 "HyMES/arith.c"
 HEAP32[$30>>2] = $28; //@line 193 "HyMES/arith.c"
 $31 = $x; //@line 194 "HyMES/arith.c"
 $32 = $1; //@line 194 "HyMES/arith.c"
 $33 = (($31>>>0) / ($32>>>0))&-1; //@line 194 "HyMES/arith.c"
 $34 = $2; //@line 194 "HyMES/arith.c"
 $35 = ((($34)) + 4|0); //@line 194 "HyMES/arith.c"
 $36 = HEAP32[$35>>2]|0; //@line 194 "HyMES/arith.c"
 $37 = (($36) + ($33))|0; //@line 194 "HyMES/arith.c"
 HEAP32[$35>>2] = $37; //@line 194 "HyMES/arith.c"
 $38 = $2; //@line 200 "HyMES/arith.c"
 $39 = (_ajuster($38,1)|0); //@line 200 "HyMES/arith.c"
 $l = $39; //@line 200 "HyMES/arith.c"
 $40 = $l; //@line 206 "HyMES/arith.c"
 STACKTOP = sp;return ($40|0); //@line 206 "HyMES/arith.c"
}
function _chercher($valeur,$sprob,$a,$b) {
 $valeur = $valeur|0;
 $sprob = $sprob|0;
 $a = $a|0;
 $b = $b|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $m = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $valeur;
 $2 = $sprob;
 $3 = $a;
 $4 = $b;
 $5 = $4; //@line 210 "HyMES/arith.c"
 $6 = $3; //@line 210 "HyMES/arith.c"
 $7 = (($5) - ($6))|0; //@line 210 "HyMES/arith.c"
 $8 = ($7|0)==(1); //@line 210 "HyMES/arith.c"
 $9 = $3; //@line 211 "HyMES/arith.c"
 if ($8) {
  $0 = $9; //@line 211 "HyMES/arith.c"
  $27 = $0; //@line 219 "HyMES/arith.c"
  STACKTOP = sp;return ($27|0); //@line 219 "HyMES/arith.c"
 }
 $10 = $4; //@line 213 "HyMES/arith.c"
 $11 = (($9) + ($10))|0; //@line 213 "HyMES/arith.c"
 $12 = (($11|0) / 2)&-1; //@line 213 "HyMES/arith.c"
 $m = $12; //@line 213 "HyMES/arith.c"
 $13 = $m; //@line 214 "HyMES/arith.c"
 $14 = $2; //@line 214 "HyMES/arith.c"
 $15 = (($14) + ($13<<2)|0); //@line 214 "HyMES/arith.c"
 $16 = HEAP32[$15>>2]|0; //@line 214 "HyMES/arith.c"
 $17 = $1; //@line 214 "HyMES/arith.c"
 $18 = ($16>>>0)>($17>>>0); //@line 214 "HyMES/arith.c"
 $19 = $1; //@line 215 "HyMES/arith.c"
 $20 = $2; //@line 215 "HyMES/arith.c"
 if ($18) {
  $21 = $3; //@line 215 "HyMES/arith.c"
  $22 = $m; //@line 215 "HyMES/arith.c"
  $23 = (_chercher($19,$20,$21,$22)|0); //@line 215 "HyMES/arith.c"
  $0 = $23; //@line 215 "HyMES/arith.c"
  $27 = $0; //@line 219 "HyMES/arith.c"
  STACKTOP = sp;return ($27|0); //@line 219 "HyMES/arith.c"
 } else {
  $24 = $m; //@line 217 "HyMES/arith.c"
  $25 = $4; //@line 217 "HyMES/arith.c"
  $26 = (_chercher($19,$20,$24,$25)|0); //@line 217 "HyMES/arith.c"
  $0 = $26; //@line 217 "HyMES/arith.c"
  $27 = $0; //@line 219 "HyMES/arith.c"
  STACKTOP = sp;return ($27|0); //@line 219 "HyMES/arith.c"
 }
 return (0)|0;
}
function _decoder($d,$lettre,$state) {
 $d = $d|0;
 $lettre = $lettre|0;
 $state = $state|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0;
 var $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0;
 var $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0;
 var $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0;
 var $99 = 0, $delta = 0, $i = 0, $r = 0, $valeur = 0, $x = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $lettre;
 $1 = $state;
 $2 = $1; //@line 228 "HyMES/arith.c"
 $3 = ((($2)) + 8|0); //@line 228 "HyMES/arith.c"
 $4 = HEAP32[$3>>2]|0; //@line 228 "HyMES/arith.c"
 $5 = $1; //@line 228 "HyMES/arith.c"
 $6 = ((($5)) + 4|0); //@line 228 "HyMES/arith.c"
 $7 = HEAP32[$6>>2]|0; //@line 228 "HyMES/arith.c"
 $8 = (($4) - ($7))|0; //@line 228 "HyMES/arith.c"
 $delta = $8; //@line 228 "HyMES/arith.c"
 $9 = $1; //@line 230 "HyMES/arith.c"
 $10 = HEAP32[$9>>2]|0; //@line 230 "HyMES/arith.c"
 $11 = ($10|0)!=(0); //@line 230 "HyMES/arith.c"
 $12 = $1; //@line 231 "HyMES/arith.c"
 $13 = ((($12)) + 12|0); //@line 231 "HyMES/arith.c"
 $14 = HEAP32[$13>>2]|0; //@line 231 "HyMES/arith.c"
 $15 = (_blook(21,$14)|0); //@line 231 "HyMES/arith.c"
 if ($11) {
  $16 = $15 ^ 1048576; //@line 231 "HyMES/arith.c"
  $valeur = $16; //@line 231 "HyMES/arith.c"
 } else {
  $valeur = $15; //@line 233 "HyMES/arith.c"
 }
 $17 = $1; //@line 235 "HyMES/arith.c"
 $18 = ((($17)) + 12|0); //@line 235 "HyMES/arith.c"
 $19 = HEAP32[$18>>2]|0; //@line 235 "HyMES/arith.c"
 _bread_lock(21,$19); //@line 235 "HyMES/arith.c"
 $20 = $valeur; //@line 237 "HyMES/arith.c"
 $21 = $1; //@line 237 "HyMES/arith.c"
 $22 = ((($21)) + 4|0); //@line 237 "HyMES/arith.c"
 $23 = HEAP32[$22>>2]|0; //@line 237 "HyMES/arith.c"
 $24 = (($20) - ($23))|0; //@line 237 "HyMES/arith.c"
 $x = $24; //@line 237 "HyMES/arith.c"
 $25 = $x; //@line 238 "HyMES/arith.c"
 $26 = $25 << 11; //@line 238 "HyMES/arith.c"
 $x = $26; //@line 238 "HyMES/arith.c"
 $27 = $delta; //@line 239 "HyMES/arith.c"
 $28 = $x; //@line 239 "HyMES/arith.c"
 $29 = (($28>>>0) / ($27>>>0))&-1; //@line 239 "HyMES/arith.c"
 $x = $29; //@line 239 "HyMES/arith.c"
 $30 = HEAP32[$d>>2]|0; //@line 241 "HyMES/arith.c"
 $31 = $x; //@line 241 "HyMES/arith.c"
 $32 = ((($d)) + 8|0); //@line 241 "HyMES/arith.c"
 $33 = HEAP32[$32>>2]|0; //@line 241 "HyMES/arith.c"
 $34 = ((($d)) + 4|0); //@line 241 "HyMES/arith.c"
 $35 = HEAP32[$34>>2]|0; //@line 241 "HyMES/arith.c"
 $36 = HEAP32[$d>>2]|0; //@line 241 "HyMES/arith.c"
 $37 = (($35) - ($36))|0; //@line 241 "HyMES/arith.c"
 $38 = (($37) + 1)|0; //@line 241 "HyMES/arith.c"
 $39 = (_chercher($31,$33,0,$38)|0); //@line 241 "HyMES/arith.c"
 $40 = (($30) + ($39))|0; //@line 241 "HyMES/arith.c"
 $i = $40; //@line 241 "HyMES/arith.c"
 $41 = $i; //@line 247 "HyMES/arith.c"
 $42 = ((($d)) + 4|0); //@line 247 "HyMES/arith.c"
 $43 = HEAP32[$42>>2]|0; //@line 247 "HyMES/arith.c"
 $44 = ($41>>>0)<($43>>>0); //@line 247 "HyMES/arith.c"
 do {
  if ($44) {
   $45 = $i; //@line 248 "HyMES/arith.c"
   $46 = (($45) + 1)|0; //@line 248 "HyMES/arith.c"
   $47 = HEAP32[$d>>2]|0; //@line 248 "HyMES/arith.c"
   $48 = (($46) - ($47))|0; //@line 248 "HyMES/arith.c"
   $49 = ((($d)) + 8|0); //@line 248 "HyMES/arith.c"
   $50 = HEAP32[$49>>2]|0; //@line 248 "HyMES/arith.c"
   $51 = (($50) + ($48<<2)|0); //@line 248 "HyMES/arith.c"
   $52 = HEAP32[$51>>2]|0; //@line 248 "HyMES/arith.c"
   $x = $52; //@line 248 "HyMES/arith.c"
   $53 = $delta; //@line 249 "HyMES/arith.c"
   $54 = $x; //@line 249 "HyMES/arith.c"
   $55 = Math_imul($54, $53)|0; //@line 249 "HyMES/arith.c"
   $x = $55; //@line 249 "HyMES/arith.c"
   $56 = $x; //@line 250 "HyMES/arith.c"
   $57 = $56 >>> 11; //@line 250 "HyMES/arith.c"
   $x = $57; //@line 250 "HyMES/arith.c"
   $58 = $1; //@line 251 "HyMES/arith.c"
   $59 = ((($58)) + 4|0); //@line 251 "HyMES/arith.c"
   $60 = HEAP32[$59>>2]|0; //@line 251 "HyMES/arith.c"
   $61 = $x; //@line 251 "HyMES/arith.c"
   $62 = (($61) + ($60))|0; //@line 251 "HyMES/arith.c"
   $x = $62; //@line 251 "HyMES/arith.c"
   $63 = $valeur; //@line 252 "HyMES/arith.c"
   $64 = $x; //@line 252 "HyMES/arith.c"
   $65 = ($63>>>0)>=($64>>>0); //@line 252 "HyMES/arith.c"
   if (!($65)) {
    $92 = $x; //@line 262 "HyMES/arith.c"
    $93 = $1; //@line 262 "HyMES/arith.c"
    $94 = ((($93)) + 8|0); //@line 262 "HyMES/arith.c"
    HEAP32[$94>>2] = $92; //@line 262 "HyMES/arith.c"
    break;
   }
   $66 = $i; //@line 253 "HyMES/arith.c"
   $67 = (($66) + 1)|0; //@line 253 "HyMES/arith.c"
   $i = $67; //@line 253 "HyMES/arith.c"
   $68 = $i; //@line 254 "HyMES/arith.c"
   $69 = ((($d)) + 4|0); //@line 254 "HyMES/arith.c"
   $70 = HEAP32[$69>>2]|0; //@line 254 "HyMES/arith.c"
   $71 = ($68>>>0)<($70>>>0); //@line 254 "HyMES/arith.c"
   if ($71) {
    $72 = $i; //@line 255 "HyMES/arith.c"
    $73 = (($72) + 1)|0; //@line 255 "HyMES/arith.c"
    $74 = HEAP32[$d>>2]|0; //@line 255 "HyMES/arith.c"
    $75 = (($73) - ($74))|0; //@line 255 "HyMES/arith.c"
    $76 = ((($d)) + 8|0); //@line 255 "HyMES/arith.c"
    $77 = HEAP32[$76>>2]|0; //@line 255 "HyMES/arith.c"
    $78 = (($77) + ($75<<2)|0); //@line 255 "HyMES/arith.c"
    $79 = HEAP32[$78>>2]|0; //@line 255 "HyMES/arith.c"
    $x = $79; //@line 255 "HyMES/arith.c"
    $80 = $delta; //@line 256 "HyMES/arith.c"
    $81 = $x; //@line 256 "HyMES/arith.c"
    $82 = Math_imul($81, $80)|0; //@line 256 "HyMES/arith.c"
    $x = $82; //@line 256 "HyMES/arith.c"
    $83 = $x; //@line 257 "HyMES/arith.c"
    $84 = $83 >>> 11; //@line 257 "HyMES/arith.c"
    $x = $84; //@line 257 "HyMES/arith.c"
    $85 = $1; //@line 258 "HyMES/arith.c"
    $86 = ((($85)) + 4|0); //@line 258 "HyMES/arith.c"
    $87 = HEAP32[$86>>2]|0; //@line 258 "HyMES/arith.c"
    $88 = $x; //@line 258 "HyMES/arith.c"
    $89 = (($87) + ($88))|0; //@line 258 "HyMES/arith.c"
    $90 = $1; //@line 258 "HyMES/arith.c"
    $91 = ((($90)) + 8|0); //@line 258 "HyMES/arith.c"
    HEAP32[$91>>2] = $89; //@line 258 "HyMES/arith.c"
   }
  }
 } while(0);
 $95 = $i; //@line 264 "HyMES/arith.c"
 $96 = HEAP32[$d>>2]|0; //@line 264 "HyMES/arith.c"
 $97 = (($95) - ($96))|0; //@line 264 "HyMES/arith.c"
 $98 = ((($d)) + 8|0); //@line 264 "HyMES/arith.c"
 $99 = HEAP32[$98>>2]|0; //@line 264 "HyMES/arith.c"
 $100 = (($99) + ($97<<2)|0); //@line 264 "HyMES/arith.c"
 $101 = HEAP32[$100>>2]|0; //@line 264 "HyMES/arith.c"
 $x = $101; //@line 264 "HyMES/arith.c"
 $102 = $delta; //@line 265 "HyMES/arith.c"
 $103 = $x; //@line 265 "HyMES/arith.c"
 $104 = Math_imul($103, $102)|0; //@line 265 "HyMES/arith.c"
 $x = $104; //@line 265 "HyMES/arith.c"
 $105 = $x; //@line 266 "HyMES/arith.c"
 $106 = $105 >>> 11; //@line 266 "HyMES/arith.c"
 $x = $106; //@line 266 "HyMES/arith.c"
 $107 = $x; //@line 267 "HyMES/arith.c"
 $108 = $1; //@line 267 "HyMES/arith.c"
 $109 = ((($108)) + 4|0); //@line 267 "HyMES/arith.c"
 $110 = HEAP32[$109>>2]|0; //@line 267 "HyMES/arith.c"
 $111 = (($110) + ($107))|0; //@line 267 "HyMES/arith.c"
 HEAP32[$109>>2] = $111; //@line 267 "HyMES/arith.c"
 $112 = $1; //@line 277 "HyMES/arith.c"
 $113 = (_ajuster($112,0)|0); //@line 277 "HyMES/arith.c"
 $r = $113; //@line 277 "HyMES/arith.c"
 $114 = $r; //@line 278 "HyMES/arith.c"
 $115 = $1; //@line 278 "HyMES/arith.c"
 $116 = ((($115)) + 12|0); //@line 278 "HyMES/arith.c"
 $117 = HEAP32[$116>>2]|0; //@line 278 "HyMES/arith.c"
 _bstep($114,$117); //@line 278 "HyMES/arith.c"
 $118 = $i; //@line 284 "HyMES/arith.c"
 $119 = $0; //@line 284 "HyMES/arith.c"
 HEAP32[$119>>2] = $118; //@line 284 "HyMES/arith.c"
 $120 = $r; //@line 285 "HyMES/arith.c"
 STACKTOP = sp;return ($120|0); //@line 285 "HyMES/arith.c"
}
function _decoder_uniforme($n,$lettre,$state) {
 $n = $n|0;
 $lettre = $lettre|0;
 $state = $state|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0;
 var $81 = 0, $82 = 0, $83 = 0, $84 = 0, $9 = 0, $delta = 0, $i = 0, $r = 0, $valeur = 0, $x = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $n;
 $1 = $lettre;
 $2 = $state;
 $3 = $2; //@line 294 "HyMES/arith.c"
 $4 = ((($3)) + 8|0); //@line 294 "HyMES/arith.c"
 $5 = HEAP32[$4>>2]|0; //@line 294 "HyMES/arith.c"
 $6 = $2; //@line 294 "HyMES/arith.c"
 $7 = ((($6)) + 4|0); //@line 294 "HyMES/arith.c"
 $8 = HEAP32[$7>>2]|0; //@line 294 "HyMES/arith.c"
 $9 = (($5) - ($8))|0; //@line 294 "HyMES/arith.c"
 $delta = $9; //@line 294 "HyMES/arith.c"
 $10 = $2; //@line 296 "HyMES/arith.c"
 $11 = HEAP32[$10>>2]|0; //@line 296 "HyMES/arith.c"
 $12 = ($11|0)!=(0); //@line 296 "HyMES/arith.c"
 $13 = $2; //@line 297 "HyMES/arith.c"
 $14 = ((($13)) + 12|0); //@line 297 "HyMES/arith.c"
 $15 = HEAP32[$14>>2]|0; //@line 297 "HyMES/arith.c"
 $16 = (_blook(21,$15)|0); //@line 297 "HyMES/arith.c"
 if ($12) {
  $17 = $16 ^ 1048576; //@line 297 "HyMES/arith.c"
  $valeur = $17; //@line 297 "HyMES/arith.c"
 } else {
  $valeur = $16; //@line 299 "HyMES/arith.c"
 }
 $18 = $2; //@line 301 "HyMES/arith.c"
 $19 = ((($18)) + 12|0); //@line 301 "HyMES/arith.c"
 $20 = HEAP32[$19>>2]|0; //@line 301 "HyMES/arith.c"
 _bread_lock(21,$20); //@line 301 "HyMES/arith.c"
 $21 = $valeur; //@line 303 "HyMES/arith.c"
 $22 = $2; //@line 303 "HyMES/arith.c"
 $23 = ((($22)) + 4|0); //@line 303 "HyMES/arith.c"
 $24 = HEAP32[$23>>2]|0; //@line 303 "HyMES/arith.c"
 $25 = (($21) - ($24))|0; //@line 303 "HyMES/arith.c"
 $x = $25; //@line 303 "HyMES/arith.c"
 $26 = $0; //@line 304 "HyMES/arith.c"
 $27 = $x; //@line 304 "HyMES/arith.c"
 $28 = Math_imul($27, $26)|0; //@line 304 "HyMES/arith.c"
 $x = $28; //@line 304 "HyMES/arith.c"
 $29 = $delta; //@line 305 "HyMES/arith.c"
 $30 = $x; //@line 305 "HyMES/arith.c"
 $31 = (($30>>>0) / ($29>>>0))&-1; //@line 305 "HyMES/arith.c"
 $x = $31; //@line 305 "HyMES/arith.c"
 $32 = $x; //@line 306 "HyMES/arith.c"
 $i = $32; //@line 306 "HyMES/arith.c"
 $33 = $i; //@line 312 "HyMES/arith.c"
 $x = $33; //@line 312 "HyMES/arith.c"
 $34 = $delta; //@line 313 "HyMES/arith.c"
 $35 = $x; //@line 313 "HyMES/arith.c"
 $36 = Math_imul($35, $34)|0; //@line 313 "HyMES/arith.c"
 $x = $36; //@line 313 "HyMES/arith.c"
 $37 = $2; //@line 314 "HyMES/arith.c"
 $38 = ((($37)) + 4|0); //@line 314 "HyMES/arith.c"
 $39 = HEAP32[$38>>2]|0; //@line 314 "HyMES/arith.c"
 $40 = $x; //@line 314 "HyMES/arith.c"
 $41 = $delta; //@line 314 "HyMES/arith.c"
 $42 = (($40) + ($41))|0; //@line 314 "HyMES/arith.c"
 $43 = $0; //@line 314 "HyMES/arith.c"
 $44 = (($42>>>0) / ($43>>>0))&-1; //@line 314 "HyMES/arith.c"
 $45 = (($39) + ($44))|0; //@line 314 "HyMES/arith.c"
 $46 = $2; //@line 314 "HyMES/arith.c"
 $47 = ((($46)) + 8|0); //@line 314 "HyMES/arith.c"
 HEAP32[$47>>2] = $45; //@line 314 "HyMES/arith.c"
 $48 = $valeur; //@line 316 "HyMES/arith.c"
 $49 = $2; //@line 316 "HyMES/arith.c"
 $50 = ((($49)) + 8|0); //@line 316 "HyMES/arith.c"
 $51 = HEAP32[$50>>2]|0; //@line 316 "HyMES/arith.c"
 $52 = ($48>>>0)>=($51>>>0); //@line 316 "HyMES/arith.c"
 if ($52) {
  $53 = $i; //@line 317 "HyMES/arith.c"
  $54 = (($53) + 1)|0; //@line 317 "HyMES/arith.c"
  $i = $54; //@line 317 "HyMES/arith.c"
  $55 = $delta; //@line 318 "HyMES/arith.c"
  $56 = $x; //@line 318 "HyMES/arith.c"
  $57 = (($56) + ($55))|0; //@line 318 "HyMES/arith.c"
  $x = $57; //@line 318 "HyMES/arith.c"
  $58 = $2; //@line 319 "HyMES/arith.c"
  $59 = ((($58)) + 4|0); //@line 319 "HyMES/arith.c"
  $60 = HEAP32[$59>>2]|0; //@line 319 "HyMES/arith.c"
  $61 = $x; //@line 319 "HyMES/arith.c"
  $62 = $delta; //@line 319 "HyMES/arith.c"
  $63 = (($61) + ($62))|0; //@line 319 "HyMES/arith.c"
  $64 = $0; //@line 319 "HyMES/arith.c"
  $65 = (($63>>>0) / ($64>>>0))&-1; //@line 319 "HyMES/arith.c"
  $66 = (($60) + ($65))|0; //@line 319 "HyMES/arith.c"
  $67 = $2; //@line 319 "HyMES/arith.c"
  $68 = ((($67)) + 8|0); //@line 319 "HyMES/arith.c"
  HEAP32[$68>>2] = $66; //@line 319 "HyMES/arith.c"
 }
 $69 = $x; //@line 321 "HyMES/arith.c"
 $70 = $0; //@line 321 "HyMES/arith.c"
 $71 = (($69>>>0) / ($70>>>0))&-1; //@line 321 "HyMES/arith.c"
 $72 = $2; //@line 321 "HyMES/arith.c"
 $73 = ((($72)) + 4|0); //@line 321 "HyMES/arith.c"
 $74 = HEAP32[$73>>2]|0; //@line 321 "HyMES/arith.c"
 $75 = (($74) + ($71))|0; //@line 321 "HyMES/arith.c"
 HEAP32[$73>>2] = $75; //@line 321 "HyMES/arith.c"
 $76 = $2; //@line 331 "HyMES/arith.c"
 $77 = (_ajuster($76,0)|0); //@line 331 "HyMES/arith.c"
 $r = $77; //@line 331 "HyMES/arith.c"
 $78 = $r; //@line 332 "HyMES/arith.c"
 $79 = $2; //@line 332 "HyMES/arith.c"
 $80 = ((($79)) + 12|0); //@line 332 "HyMES/arith.c"
 $81 = HEAP32[$80>>2]|0; //@line 332 "HyMES/arith.c"
 _bstep($78,$81); //@line 332 "HyMES/arith.c"
 $82 = $i; //@line 338 "HyMES/arith.c"
 $83 = $1; //@line 338 "HyMES/arith.c"
 HEAP32[$83>>2] = $82; //@line 338 "HyMES/arith.c"
 $84 = $r; //@line 339 "HyMES/arith.c"
 STACKTOP = sp;return ($84|0); //@line 339 "HyMES/arith.c"
}
function _bread_getchar($bin) {
 $bin = $bin|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $bin;
 $2 = $1; //@line 28 "HyMES/buff.c"
 $3 = ((($2)) + 24|0); //@line 28 "HyMES/buff.c"
 $4 = HEAP32[$3>>2]|0; //@line 28 "HyMES/buff.c"
 $5 = (($4) + 1)|0; //@line 28 "HyMES/buff.c"
 HEAP32[$3>>2] = $5; //@line 28 "HyMES/buff.c"
 $6 = $1; //@line 29 "HyMES/buff.c"
 $7 = ((($6)) + 24|0); //@line 29 "HyMES/buff.c"
 $8 = HEAP32[$7>>2]|0; //@line 29 "HyMES/buff.c"
 $9 = $1; //@line 29 "HyMES/buff.c"
 $10 = ((($9)) + 20|0); //@line 29 "HyMES/buff.c"
 $11 = HEAP32[$10>>2]|0; //@line 29 "HyMES/buff.c"
 $12 = ($8|0)<($11|0); //@line 29 "HyMES/buff.c"
 $13 = $1; //@line 30 "HyMES/buff.c"
 $14 = ((($13)) + 24|0); //@line 30 "HyMES/buff.c"
 $15 = HEAP32[$14>>2]|0; //@line 30 "HyMES/buff.c"
 $16 = $1; //@line 30 "HyMES/buff.c"
 if ($12) {
  $17 = ((($16)) + 12|0); //@line 30 "HyMES/buff.c"
  $18 = HEAP32[$17>>2]|0; //@line 30 "HyMES/buff.c"
  $19 = (($18) + ($15)|0); //@line 30 "HyMES/buff.c"
  $20 = HEAP8[$19>>0]|0; //@line 30 "HyMES/buff.c"
  $0 = $20; //@line 30 "HyMES/buff.c"
  $39 = $0; //@line 34 "HyMES/buff.c"
  STACKTOP = sp;return ($39|0); //@line 34 "HyMES/buff.c"
 }
 $21 = ((($16)) + 20|0); //@line 31 "HyMES/buff.c"
 $22 = HEAP32[$21>>2]|0; //@line 31 "HyMES/buff.c"
 $23 = ($15|0)==($22|0); //@line 31 "HyMES/buff.c"
 if ($23) {
  $24 = $1; //@line 32 "HyMES/buff.c"
  $25 = ((($24)) + 24|0); //@line 32 "HyMES/buff.c"
  $26 = HEAP32[$25>>2]|0; //@line 32 "HyMES/buff.c"
  $27 = $1; //@line 32 "HyMES/buff.c"
  $28 = ((($27)) + 12|0); //@line 32 "HyMES/buff.c"
  $29 = HEAP32[$28>>2]|0; //@line 32 "HyMES/buff.c"
  $30 = (($29) + ($26)|0); //@line 32 "HyMES/buff.c"
  $31 = HEAP8[$30>>0]|0; //@line 32 "HyMES/buff.c"
  $32 = $31&255; //@line 32 "HyMES/buff.c"
  $33 = $1; //@line 32 "HyMES/buff.c"
  $34 = ((($33)) + 8|0); //@line 32 "HyMES/buff.c"
  $35 = HEAP8[$34>>0]|0; //@line 32 "HyMES/buff.c"
  $36 = $35&255; //@line 32 "HyMES/buff.c"
  $37 = $32 & $36; //@line 32 "HyMES/buff.c"
  $38 = $37&255; //@line 32 "HyMES/buff.c"
  $0 = $38; //@line 32 "HyMES/buff.c"
  $39 = $0; //@line 34 "HyMES/buff.c"
  STACKTOP = sp;return ($39|0); //@line 34 "HyMES/buff.c"
 } else {
  $0 = 0; //@line 33 "HyMES/buff.c"
  $39 = $0; //@line 34 "HyMES/buff.c"
  STACKTOP = sp;return ($39|0); //@line 34 "HyMES/buff.c"
 }
 return (0)|0;
}
function _bwrite_putchar($c,$bout) {
 $c = $c|0;
 $bout = $bout|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $7 = 0;
 var $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $c;
 $1 = $bout;
 $2 = $1; //@line 37 "HyMES/buff.c"
 $3 = ((($2)) + 24|0); //@line 37 "HyMES/buff.c"
 $4 = HEAP32[$3>>2]|0; //@line 37 "HyMES/buff.c"
 $5 = (($4) + 1)|0; //@line 37 "HyMES/buff.c"
 HEAP32[$3>>2] = $5; //@line 37 "HyMES/buff.c"
 $6 = $1; //@line 38 "HyMES/buff.c"
 $7 = ((($6)) + 24|0); //@line 38 "HyMES/buff.c"
 $8 = HEAP32[$7>>2]|0; //@line 38 "HyMES/buff.c"
 $9 = $1; //@line 38 "HyMES/buff.c"
 $10 = ((($9)) + 20|0); //@line 38 "HyMES/buff.c"
 $11 = HEAP32[$10>>2]|0; //@line 38 "HyMES/buff.c"
 $12 = ($8|0)<($11|0); //@line 38 "HyMES/buff.c"
 if ($12) {
  $13 = $0; //@line 39 "HyMES/buff.c"
  $14 = $1; //@line 39 "HyMES/buff.c"
  $15 = ((($14)) + 24|0); //@line 39 "HyMES/buff.c"
  $16 = HEAP32[$15>>2]|0; //@line 39 "HyMES/buff.c"
  $17 = $1; //@line 39 "HyMES/buff.c"
  $18 = ((($17)) + 12|0); //@line 39 "HyMES/buff.c"
  $19 = HEAP32[$18>>2]|0; //@line 39 "HyMES/buff.c"
  $20 = (($19) + ($16)|0); //@line 39 "HyMES/buff.c"
  HEAP8[$20>>0] = $13; //@line 39 "HyMES/buff.c"
 }
 $21 = $1; //@line 40 "HyMES/buff.c"
 $22 = ((($21)) + 24|0); //@line 40 "HyMES/buff.c"
 $23 = HEAP32[$22>>2]|0; //@line 40 "HyMES/buff.c"
 $24 = $1; //@line 40 "HyMES/buff.c"
 $25 = ((($24)) + 20|0); //@line 40 "HyMES/buff.c"
 $26 = HEAP32[$25>>2]|0; //@line 40 "HyMES/buff.c"
 $27 = ($23|0)==($26|0); //@line 40 "HyMES/buff.c"
 if (!($27)) {
  STACKTOP = sp;return; //@line 44 "HyMES/buff.c"
 }
 $28 = $1; //@line 41 "HyMES/buff.c"
 $29 = ((($28)) + 8|0); //@line 41 "HyMES/buff.c"
 $30 = HEAP8[$29>>0]|0; //@line 41 "HyMES/buff.c"
 $31 = $30&255; //@line 41 "HyMES/buff.c"
 $32 = $31 ^ -1; //@line 41 "HyMES/buff.c"
 $33 = $1; //@line 41 "HyMES/buff.c"
 $34 = ((($33)) + 24|0); //@line 41 "HyMES/buff.c"
 $35 = HEAP32[$34>>2]|0; //@line 41 "HyMES/buff.c"
 $36 = $1; //@line 41 "HyMES/buff.c"
 $37 = ((($36)) + 12|0); //@line 41 "HyMES/buff.c"
 $38 = HEAP32[$37>>2]|0; //@line 41 "HyMES/buff.c"
 $39 = (($38) + ($35)|0); //@line 41 "HyMES/buff.c"
 $40 = HEAP8[$39>>0]|0; //@line 41 "HyMES/buff.c"
 $41 = $40&255; //@line 41 "HyMES/buff.c"
 $42 = $41 & $32; //@line 41 "HyMES/buff.c"
 $43 = $42&255; //@line 41 "HyMES/buff.c"
 HEAP8[$39>>0] = $43; //@line 41 "HyMES/buff.c"
 $44 = $0; //@line 42 "HyMES/buff.c"
 $45 = $44&255; //@line 42 "HyMES/buff.c"
 $46 = $1; //@line 42 "HyMES/buff.c"
 $47 = ((($46)) + 8|0); //@line 42 "HyMES/buff.c"
 $48 = HEAP8[$47>>0]|0; //@line 42 "HyMES/buff.c"
 $49 = $48&255; //@line 42 "HyMES/buff.c"
 $50 = $45 & $49; //@line 42 "HyMES/buff.c"
 $51 = $1; //@line 42 "HyMES/buff.c"
 $52 = ((($51)) + 24|0); //@line 42 "HyMES/buff.c"
 $53 = HEAP32[$52>>2]|0; //@line 42 "HyMES/buff.c"
 $54 = $1; //@line 42 "HyMES/buff.c"
 $55 = ((($54)) + 12|0); //@line 42 "HyMES/buff.c"
 $56 = HEAP32[$55>>2]|0; //@line 42 "HyMES/buff.c"
 $57 = (($56) + ($53)|0); //@line 42 "HyMES/buff.c"
 $58 = HEAP8[$57>>0]|0; //@line 42 "HyMES/buff.c"
 $59 = $58&255; //@line 42 "HyMES/buff.c"
 $60 = $59 ^ $50; //@line 42 "HyMES/buff.c"
 $61 = $60&255; //@line 42 "HyMES/buff.c"
 HEAP8[$57>>0] = $61; //@line 42 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 44 "HyMES/buff.c"
}
function _breadinit($message,$fin) {
 $message = $message|0;
 $fin = $fin|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $bin = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $message;
 $1 = $fin;
 $2 = (_malloc(32)|0); //@line 49 "HyMES/buff.c"
 $bin = $2; //@line 49 "HyMES/buff.c"
 $3 = $0; //@line 51 "HyMES/buff.c"
 $4 = $bin; //@line 51 "HyMES/buff.c"
 $5 = ((($4)) + 12|0); //@line 51 "HyMES/buff.c"
 HEAP32[$5>>2] = $3; //@line 51 "HyMES/buff.c"
 $6 = $1; //@line 52 "HyMES/buff.c"
 $7 = $bin; //@line 52 "HyMES/buff.c"
 $8 = ((($7)) + 16|0); //@line 52 "HyMES/buff.c"
 HEAP32[$8>>2] = $6; //@line 52 "HyMES/buff.c"
 $9 = $1; //@line 54 "HyMES/buff.c"
 $10 = (($9) - 1)|0; //@line 54 "HyMES/buff.c"
 $11 = (($10|0) / 8)&-1; //@line 54 "HyMES/buff.c"
 $12 = $bin; //@line 54 "HyMES/buff.c"
 $13 = ((($12)) + 20|0); //@line 54 "HyMES/buff.c"
 HEAP32[$13>>2] = $11; //@line 54 "HyMES/buff.c"
 $14 = $1; //@line 56 "HyMES/buff.c"
 $15 = (0 - ($14))|0; //@line 56 "HyMES/buff.c"
 $16 = $15 & 7; //@line 56 "HyMES/buff.c"
 $17 = ($16|0)==(32); //@line 56 "HyMES/buff.c"
 if ($17) {
  $23 = 0;
 } else {
  $18 = $1; //@line 56 "HyMES/buff.c"
  $19 = (0 - ($18))|0; //@line 56 "HyMES/buff.c"
  $20 = $19 & 7; //@line 56 "HyMES/buff.c"
  $21 = -1 << $20; //@line 56 "HyMES/buff.c"
  $23 = $21;
 }
 $22 = $23&255; //@line 56 "HyMES/buff.c"
 $24 = $bin; //@line 56 "HyMES/buff.c"
 $25 = ((($24)) + 8|0); //@line 56 "HyMES/buff.c"
 HEAP8[$25>>0] = $22; //@line 56 "HyMES/buff.c"
 $26 = $bin; //@line 58 "HyMES/buff.c"
 $27 = ((($26)) + 24|0); //@line 58 "HyMES/buff.c"
 HEAP32[$27>>2] = -1; //@line 58 "HyMES/buff.c"
 $28 = $bin; //@line 59 "HyMES/buff.c"
 $29 = ((($28)) + 4|0); //@line 59 "HyMES/buff.c"
 HEAP32[$29>>2] = 0; //@line 59 "HyMES/buff.c"
 $30 = $bin; //@line 60 "HyMES/buff.c"
 HEAP32[$30>>2] = 0; //@line 60 "HyMES/buff.c"
 $31 = $bin; //@line 61 "HyMES/buff.c"
 $32 = ((($31)) + 28|0); //@line 61 "HyMES/buff.c"
 HEAP32[$32>>2] = 0; //@line 61 "HyMES/buff.c"
 $33 = $bin; //@line 63 "HyMES/buff.c"
 STACKTOP = sp;return ($33|0); //@line 63 "HyMES/buff.c"
}
function _bwriteinit($message,$fin) {
 $message = $message|0;
 $fin = $fin|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $bout = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $message;
 $1 = $fin;
 $2 = (_malloc(32)|0); //@line 69 "HyMES/buff.c"
 $bout = $2; //@line 69 "HyMES/buff.c"
 $3 = $0; //@line 71 "HyMES/buff.c"
 $4 = $bout; //@line 71 "HyMES/buff.c"
 $5 = ((($4)) + 12|0); //@line 71 "HyMES/buff.c"
 HEAP32[$5>>2] = $3; //@line 71 "HyMES/buff.c"
 $6 = $1; //@line 72 "HyMES/buff.c"
 $7 = $bout; //@line 72 "HyMES/buff.c"
 $8 = ((($7)) + 16|0); //@line 72 "HyMES/buff.c"
 HEAP32[$8>>2] = $6; //@line 72 "HyMES/buff.c"
 $9 = $1; //@line 74 "HyMES/buff.c"
 $10 = (($9) - 1)|0; //@line 74 "HyMES/buff.c"
 $11 = (($10|0) / 8)&-1; //@line 74 "HyMES/buff.c"
 $12 = $bout; //@line 74 "HyMES/buff.c"
 $13 = ((($12)) + 20|0); //@line 74 "HyMES/buff.c"
 HEAP32[$13>>2] = $11; //@line 74 "HyMES/buff.c"
 $14 = $1; //@line 76 "HyMES/buff.c"
 $15 = (0 - ($14))|0; //@line 76 "HyMES/buff.c"
 $16 = $15 & 7; //@line 76 "HyMES/buff.c"
 $17 = ($16|0)==(32); //@line 76 "HyMES/buff.c"
 if ($17) {
  $23 = 0;
 } else {
  $18 = $1; //@line 76 "HyMES/buff.c"
  $19 = (0 - ($18))|0; //@line 76 "HyMES/buff.c"
  $20 = $19 & 7; //@line 76 "HyMES/buff.c"
  $21 = -1 << $20; //@line 76 "HyMES/buff.c"
  $23 = $21;
 }
 $22 = $23&255; //@line 76 "HyMES/buff.c"
 $24 = $bout; //@line 76 "HyMES/buff.c"
 $25 = ((($24)) + 8|0); //@line 76 "HyMES/buff.c"
 HEAP8[$25>>0] = $22; //@line 76 "HyMES/buff.c"
 $26 = $bout; //@line 78 "HyMES/buff.c"
 $27 = ((($26)) + 24|0); //@line 78 "HyMES/buff.c"
 HEAP32[$27>>2] = -1; //@line 78 "HyMES/buff.c"
 $28 = $bout; //@line 79 "HyMES/buff.c"
 $29 = ((($28)) + 4|0); //@line 79 "HyMES/buff.c"
 HEAP32[$29>>2] = 0; //@line 79 "HyMES/buff.c"
 $30 = $bout; //@line 80 "HyMES/buff.c"
 HEAP32[$30>>2] = 32; //@line 80 "HyMES/buff.c"
 $31 = $bout; //@line 81 "HyMES/buff.c"
 $32 = ((($31)) + 28|0); //@line 81 "HyMES/buff.c"
 HEAP32[$32>>2] = 0; //@line 81 "HyMES/buff.c"
 $33 = $bout; //@line 83 "HyMES/buff.c"
 STACKTOP = sp;return ($33|0); //@line 83 "HyMES/buff.c"
}
function _bfill($bin) {
 $bin = $bin|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $bin;
 $i = 0; //@line 90 "HyMES/buff.c"
 while(1) {
  $1 = $i; //@line 90 "HyMES/buff.c"
  $2 = ($1>>>0)<(32); //@line 90 "HyMES/buff.c"
  $3 = $0; //@line 91 "HyMES/buff.c"
  if (!($2)) {
   break;
  }
  $4 = ((($3)) + 4|0); //@line 91 "HyMES/buff.c"
  $5 = HEAP32[$4>>2]|0; //@line 91 "HyMES/buff.c"
  $6 = $5 << 8; //@line 91 "HyMES/buff.c"
  HEAP32[$4>>2] = $6; //@line 91 "HyMES/buff.c"
  $7 = $0; //@line 92 "HyMES/buff.c"
  $8 = (_bread_getchar($7)|0); //@line 92 "HyMES/buff.c"
  $9 = $8&255; //@line 92 "HyMES/buff.c"
  $10 = $0; //@line 92 "HyMES/buff.c"
  $11 = ((($10)) + 4|0); //@line 92 "HyMES/buff.c"
  $12 = HEAP32[$11>>2]|0; //@line 92 "HyMES/buff.c"
  $13 = $12 ^ $9; //@line 92 "HyMES/buff.c"
  HEAP32[$11>>2] = $13; //@line 92 "HyMES/buff.c"
  $14 = $i; //@line 90 "HyMES/buff.c"
  $15 = (($14) + 8)|0; //@line 90 "HyMES/buff.c"
  $i = $15; //@line 90 "HyMES/buff.c"
 }
 HEAP32[$3>>2] = 32; //@line 94 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 95 "HyMES/buff.c"
}
function _bflush($bout) {
 $bout = $bout|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $bout;
 $i = 24; //@line 101 "HyMES/buff.c"
 while(1) {
  $1 = $i; //@line 101 "HyMES/buff.c"
  $2 = ($1|0)>=(0); //@line 101 "HyMES/buff.c"
  $3 = $0; //@line 102 "HyMES/buff.c"
  $4 = ((($3)) + 4|0); //@line 102 "HyMES/buff.c"
  if (!($2)) {
   break;
  }
  $5 = HEAP32[$4>>2]|0; //@line 102 "HyMES/buff.c"
  $6 = $i; //@line 102 "HyMES/buff.c"
  $7 = $5 >>> $6; //@line 102 "HyMES/buff.c"
  $8 = $7&255; //@line 102 "HyMES/buff.c"
  $9 = $0; //@line 102 "HyMES/buff.c"
  _bwrite_putchar($8,$9); //@line 102 "HyMES/buff.c"
  $10 = $i; //@line 101 "HyMES/buff.c"
  $11 = (($10) - 8)|0; //@line 101 "HyMES/buff.c"
  $i = $11; //@line 101 "HyMES/buff.c"
 }
 HEAP32[$4>>2] = 0; //@line 103 "HyMES/buff.c"
 $12 = $0; //@line 104 "HyMES/buff.c"
 HEAP32[$12>>2] = 32; //@line 104 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 105 "HyMES/buff.c"
}
function _bflush_partiel($bout) {
 $bout = $bout|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $bout;
 $i = 24; //@line 110 "HyMES/buff.c"
 while(1) {
  $1 = $i; //@line 110 "HyMES/buff.c"
  $2 = $0; //@line 110 "HyMES/buff.c"
  $3 = HEAP32[$2>>2]|0; //@line 110 "HyMES/buff.c"
  $4 = ($1|0)>=($3|0); //@line 110 "HyMES/buff.c"
  if (!($4)) {
   break;
  }
  $5 = $0; //@line 111 "HyMES/buff.c"
  $6 = ((($5)) + 4|0); //@line 111 "HyMES/buff.c"
  $7 = HEAP32[$6>>2]|0; //@line 111 "HyMES/buff.c"
  $8 = $i; //@line 111 "HyMES/buff.c"
  $9 = $7 >>> $8; //@line 111 "HyMES/buff.c"
  $10 = $9&255; //@line 111 "HyMES/buff.c"
  $11 = $0; //@line 111 "HyMES/buff.c"
  _bwrite_putchar($10,$11); //@line 111 "HyMES/buff.c"
  $12 = $i; //@line 110 "HyMES/buff.c"
  $13 = (($12) - 8)|0; //@line 110 "HyMES/buff.c"
  $i = $13; //@line 110 "HyMES/buff.c"
 }
 $14 = $i; //@line 112 "HyMES/buff.c"
 $15 = $0; //@line 112 "HyMES/buff.c"
 $16 = HEAP32[$15>>2]|0; //@line 112 "HyMES/buff.c"
 $17 = (($16) - ($14))|0; //@line 112 "HyMES/buff.c"
 HEAP32[$15>>2] = $17; //@line 112 "HyMES/buff.c"
 $18 = $0; //@line 114 "HyMES/buff.c"
 $19 = HEAP32[$18>>2]|0; //@line 114 "HyMES/buff.c"
 $20 = ($19|0)<(8); //@line 114 "HyMES/buff.c"
 if (!($20)) {
  $62 = $0; //@line 130 "HyMES/buff.c"
  $63 = ((($62)) + 4|0); //@line 130 "HyMES/buff.c"
  HEAP32[$63>>2] = 0; //@line 130 "HyMES/buff.c"
  $64 = $0; //@line 131 "HyMES/buff.c"
  HEAP32[$64>>2] = 32; //@line 131 "HyMES/buff.c"
  STACKTOP = sp;return; //@line 132 "HyMES/buff.c"
 }
 $21 = $i; //@line 117 "HyMES/buff.c"
 $22 = $0; //@line 117 "HyMES/buff.c"
 $23 = ((($22)) + 4|0); //@line 117 "HyMES/buff.c"
 $24 = HEAP32[$23>>2]|0; //@line 117 "HyMES/buff.c"
 $25 = $24 >>> $21; //@line 117 "HyMES/buff.c"
 HEAP32[$23>>2] = $25; //@line 117 "HyMES/buff.c"
 $26 = $0; //@line 119 "HyMES/buff.c"
 $27 = HEAP32[$26>>2]|0; //@line 119 "HyMES/buff.c"
 $28 = ($27|0)==(32); //@line 119 "HyMES/buff.c"
 if ($28) {
  $36 = 0;
 } else {
  $29 = $0; //@line 119 "HyMES/buff.c"
  $30 = HEAP32[$29>>2]|0; //@line 119 "HyMES/buff.c"
  $31 = -1 << $30; //@line 119 "HyMES/buff.c"
  $36 = $31;
 }
 $32 = $0; //@line 119 "HyMES/buff.c"
 $33 = ((($32)) + 4|0); //@line 119 "HyMES/buff.c"
 $34 = HEAP32[$33>>2]|0; //@line 119 "HyMES/buff.c"
 $35 = $34 & $36; //@line 119 "HyMES/buff.c"
 HEAP32[$33>>2] = $35; //@line 119 "HyMES/buff.c"
 $37 = $0; //@line 125 "HyMES/buff.c"
 $38 = (_bread_getchar($37)|0); //@line 125 "HyMES/buff.c"
 $39 = $38&255; //@line 125 "HyMES/buff.c"
 $40 = $0; //@line 125 "HyMES/buff.c"
 $41 = HEAP32[$40>>2]|0; //@line 125 "HyMES/buff.c"
 $42 = ($41|0)!=(0); //@line 125 "HyMES/buff.c"
 if ($42) {
  $43 = $0; //@line 125 "HyMES/buff.c"
  $44 = HEAP32[$43>>2]|0; //@line 125 "HyMES/buff.c"
  $45 = 1 << $44; //@line 125 "HyMES/buff.c"
  $46 = (($45) - 1)|0; //@line 125 "HyMES/buff.c"
  $48 = $46;
 } else {
  $48 = 0;
 }
 $47 = $39 & $48; //@line 125 "HyMES/buff.c"
 $49 = $0; //@line 125 "HyMES/buff.c"
 $50 = ((($49)) + 4|0); //@line 125 "HyMES/buff.c"
 $51 = HEAP32[$50>>2]|0; //@line 125 "HyMES/buff.c"
 $52 = $51 ^ $47; //@line 125 "HyMES/buff.c"
 HEAP32[$50>>2] = $52; //@line 125 "HyMES/buff.c"
 $53 = $0; //@line 127 "HyMES/buff.c"
 $54 = ((($53)) + 24|0); //@line 127 "HyMES/buff.c"
 $55 = HEAP32[$54>>2]|0; //@line 127 "HyMES/buff.c"
 $56 = (($55) + -1)|0; //@line 127 "HyMES/buff.c"
 HEAP32[$54>>2] = $56; //@line 127 "HyMES/buff.c"
 $57 = $0; //@line 128 "HyMES/buff.c"
 $58 = ((($57)) + 4|0); //@line 128 "HyMES/buff.c"
 $59 = HEAP32[$58>>2]|0; //@line 128 "HyMES/buff.c"
 $60 = $59&255; //@line 128 "HyMES/buff.c"
 $61 = $0; //@line 128 "HyMES/buff.c"
 _bwrite_putchar($60,$61); //@line 128 "HyMES/buff.c"
 $62 = $0; //@line 130 "HyMES/buff.c"
 $63 = ((($62)) + 4|0); //@line 130 "HyMES/buff.c"
 HEAP32[$63>>2] = 0; //@line 130 "HyMES/buff.c"
 $64 = $0; //@line 131 "HyMES/buff.c"
 HEAP32[$64>>2] = 32; //@line 131 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 132 "HyMES/buff.c"
}
function _breadclose($bin) {
 $bin = $bin|0;
 var $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $bin;
 $1 = $0; //@line 135 "HyMES/buff.c"
 _free($1); //@line 135 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 136 "HyMES/buff.c"
}
function _bwriteclose($bout) {
 $bout = $bout|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $bout;
 $1 = $0; //@line 139 "HyMES/buff.c"
 _bflush_partiel($1); //@line 139 "HyMES/buff.c"
 $2 = $0; //@line 140 "HyMES/buff.c"
 _free($2); //@line 140 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 141 "HyMES/buff.c"
}
function _bread_unlocked($bin) {
 $bin = $bin|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $bin;
 $1 = $0; //@line 161 "HyMES/buff.c"
 $2 = ((($1)) + 16|0); //@line 161 "HyMES/buff.c"
 $3 = HEAP32[$2>>2]|0; //@line 161 "HyMES/buff.c"
 $4 = $0; //@line 161 "HyMES/buff.c"
 $5 = ((($4)) + 28|0); //@line 161 "HyMES/buff.c"
 $6 = HEAP32[$5>>2]|0; //@line 161 "HyMES/buff.c"
 $7 = (($3) - ($6))|0; //@line 161 "HyMES/buff.c"
 STACKTOP = sp;return ($7|0); //@line 161 "HyMES/buff.c"
}
function _bwrite_unlocked($bout) {
 $bout = $bout|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $bout;
 $1 = $0; //@line 166 "HyMES/buff.c"
 $2 = ((($1)) + 16|0); //@line 166 "HyMES/buff.c"
 $3 = HEAP32[$2>>2]|0; //@line 166 "HyMES/buff.c"
 $4 = $0; //@line 166 "HyMES/buff.c"
 $5 = ((($4)) + 28|0); //@line 166 "HyMES/buff.c"
 $6 = HEAP32[$5>>2]|0; //@line 166 "HyMES/buff.c"
 $7 = (($3) - ($6))|0; //@line 166 "HyMES/buff.c"
 STACKTOP = sp;return ($7|0); //@line 166 "HyMES/buff.c"
}
function _bread_position($bin) {
 $bin = $bin|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $bin;
 $1 = $0; //@line 170 "HyMES/buff.c"
 $2 = ((($1)) + 24|0); //@line 170 "HyMES/buff.c"
 $3 = HEAP32[$2>>2]|0; //@line 170 "HyMES/buff.c"
 $4 = (($3) + 1)|0; //@line 170 "HyMES/buff.c"
 $5 = $4<<3; //@line 170 "HyMES/buff.c"
 $6 = $0; //@line 170 "HyMES/buff.c"
 $7 = HEAP32[$6>>2]|0; //@line 170 "HyMES/buff.c"
 $8 = (($5) - ($7))|0; //@line 170 "HyMES/buff.c"
 STACKTOP = sp;return ($8|0); //@line 170 "HyMES/buff.c"
}
function _bread_changer_position($bin,$i) {
 $bin = $bin|0;
 $i = $i|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $bin;
 $1 = $i;
 $2 = $1; //@line 175 "HyMES/buff.c"
 $3 = (($2|0) / 8)&-1; //@line 175 "HyMES/buff.c"
 $4 = (($3) - 1)|0; //@line 175 "HyMES/buff.c"
 $5 = $0; //@line 175 "HyMES/buff.c"
 $6 = ((($5)) + 24|0); //@line 175 "HyMES/buff.c"
 HEAP32[$6>>2] = $4; //@line 175 "HyMES/buff.c"
 $7 = $0; //@line 177 "HyMES/buff.c"
 $8 = (_bread_getchar($7)|0); //@line 177 "HyMES/buff.c"
 $9 = $8&255; //@line 177 "HyMES/buff.c"
 $10 = $0; //@line 177 "HyMES/buff.c"
 $11 = ((($10)) + 4|0); //@line 177 "HyMES/buff.c"
 HEAP32[$11>>2] = $9; //@line 177 "HyMES/buff.c"
 $12 = $1; //@line 179 "HyMES/buff.c"
 $13 = (($12|0) % 8)&-1; //@line 179 "HyMES/buff.c"
 $14 = (8 - ($13))|0; //@line 179 "HyMES/buff.c"
 $15 = $0; //@line 179 "HyMES/buff.c"
 HEAP32[$15>>2] = $14; //@line 179 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 180 "HyMES/buff.c"
}
function _bread_decaler_fin($bin,$i) {
 $bin = $bin|0;
 $i = $i|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $bin;
 $1 = $i;
 $2 = $1; //@line 184 "HyMES/buff.c"
 $3 = $0; //@line 184 "HyMES/buff.c"
 $4 = ((($3)) + 16|0); //@line 184 "HyMES/buff.c"
 $5 = HEAP32[$4>>2]|0; //@line 184 "HyMES/buff.c"
 $6 = (($5) + ($2))|0; //@line 184 "HyMES/buff.c"
 HEAP32[$4>>2] = $6; //@line 184 "HyMES/buff.c"
 $7 = $0; //@line 185 "HyMES/buff.c"
 $8 = ((($7)) + 16|0); //@line 185 "HyMES/buff.c"
 $9 = HEAP32[$8>>2]|0; //@line 185 "HyMES/buff.c"
 $10 = (($9) - 1)|0; //@line 185 "HyMES/buff.c"
 $11 = (($10|0) / 8)&-1; //@line 185 "HyMES/buff.c"
 $12 = $0; //@line 185 "HyMES/buff.c"
 $13 = ((($12)) + 20|0); //@line 185 "HyMES/buff.c"
 HEAP32[$13>>2] = $11; //@line 185 "HyMES/buff.c"
 $14 = $0; //@line 186 "HyMES/buff.c"
 $15 = ((($14)) + 16|0); //@line 186 "HyMES/buff.c"
 $16 = HEAP32[$15>>2]|0; //@line 186 "HyMES/buff.c"
 $17 = (0 - ($16))|0; //@line 186 "HyMES/buff.c"
 $18 = $17 & 7; //@line 186 "HyMES/buff.c"
 $19 = ($18|0)==(32); //@line 186 "HyMES/buff.c"
 if ($19) {
  $27 = 0;
 } else {
  $20 = $0; //@line 186 "HyMES/buff.c"
  $21 = ((($20)) + 16|0); //@line 186 "HyMES/buff.c"
  $22 = HEAP32[$21>>2]|0; //@line 186 "HyMES/buff.c"
  $23 = (0 - ($22))|0; //@line 186 "HyMES/buff.c"
  $24 = $23 & 7; //@line 186 "HyMES/buff.c"
  $25 = -1 << $24; //@line 186 "HyMES/buff.c"
  $27 = $25;
 }
 $26 = $27&255; //@line 186 "HyMES/buff.c"
 $28 = $0; //@line 186 "HyMES/buff.c"
 $29 = ((($28)) + 8|0); //@line 186 "HyMES/buff.c"
 HEAP8[$29>>0] = $26; //@line 186 "HyMES/buff.c"
 $30 = $0; //@line 187 "HyMES/buff.c"
 $31 = $0; //@line 187 "HyMES/buff.c"
 $32 = (_bread_position($31)|0); //@line 187 "HyMES/buff.c"
 _bread_changer_position($30,$32); //@line 187 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 188 "HyMES/buff.c"
}
function _bwrite_changer_position($bout,$i) {
 $bout = $bout|0;
 $i = $i|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $bout;
 $1 = $i;
 $2 = $0; //@line 195 "HyMES/buff.c"
 _bflush_partiel($2); //@line 195 "HyMES/buff.c"
 $3 = $1; //@line 198 "HyMES/buff.c"
 $4 = (($3|0) / 8)&-1; //@line 198 "HyMES/buff.c"
 $5 = (($4) - 1)|0; //@line 198 "HyMES/buff.c"
 $6 = $0; //@line 198 "HyMES/buff.c"
 $7 = ((($6)) + 24|0); //@line 198 "HyMES/buff.c"
 HEAP32[$7>>2] = $5; //@line 198 "HyMES/buff.c"
 $8 = $1; //@line 200 "HyMES/buff.c"
 $9 = (($8|0) % 8)&-1; //@line 200 "HyMES/buff.c"
 $10 = (32 - ($9))|0; //@line 200 "HyMES/buff.c"
 $11 = $0; //@line 200 "HyMES/buff.c"
 HEAP32[$11>>2] = $10; //@line 200 "HyMES/buff.c"
 $12 = $1; //@line 201 "HyMES/buff.c"
 $13 = (($12|0) % 8)&-1; //@line 201 "HyMES/buff.c"
 $14 = ($13|0)==(0); //@line 201 "HyMES/buff.c"
 if ($14) {
  $15 = $0; //@line 202 "HyMES/buff.c"
  $16 = ((($15)) + 4|0); //@line 202 "HyMES/buff.c"
  HEAP32[$16>>2] = 0; //@line 202 "HyMES/buff.c"
  STACKTOP = sp;return; //@line 209 "HyMES/buff.c"
 }
 $17 = $1; //@line 205 "HyMES/buff.c"
 $18 = (($17|0) / 8)&-1; //@line 205 "HyMES/buff.c"
 $19 = $0; //@line 205 "HyMES/buff.c"
 $20 = ((($19)) + 12|0); //@line 205 "HyMES/buff.c"
 $21 = HEAP32[$20>>2]|0; //@line 205 "HyMES/buff.c"
 $22 = (($21) + ($18)|0); //@line 205 "HyMES/buff.c"
 $23 = HEAP8[$22>>0]|0; //@line 205 "HyMES/buff.c"
 $24 = $23&255; //@line 205 "HyMES/buff.c"
 $25 = $24 << 24; //@line 205 "HyMES/buff.c"
 $26 = $0; //@line 205 "HyMES/buff.c"
 $27 = ((($26)) + 4|0); //@line 205 "HyMES/buff.c"
 HEAP32[$27>>2] = $25; //@line 205 "HyMES/buff.c"
 $28 = $0; //@line 207 "HyMES/buff.c"
 $29 = HEAP32[$28>>2]|0; //@line 207 "HyMES/buff.c"
 $30 = ($29|0)==(32); //@line 207 "HyMES/buff.c"
 if ($30) {
  $38 = 0;
 } else {
  $31 = $0; //@line 207 "HyMES/buff.c"
  $32 = HEAP32[$31>>2]|0; //@line 207 "HyMES/buff.c"
  $33 = -1 << $32; //@line 207 "HyMES/buff.c"
  $38 = $33;
 }
 $34 = $0; //@line 207 "HyMES/buff.c"
 $35 = ((($34)) + 4|0); //@line 207 "HyMES/buff.c"
 $36 = HEAP32[$35>>2]|0; //@line 207 "HyMES/buff.c"
 $37 = $36 & $38; //@line 207 "HyMES/buff.c"
 HEAP32[$35>>2] = $37; //@line 207 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 209 "HyMES/buff.c"
}
function _bwrite_decaler_fin($bout,$i) {
 $bout = $bout|0;
 $i = $i|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $bout;
 $1 = $i;
 $2 = $1; //@line 213 "HyMES/buff.c"
 $3 = $0; //@line 213 "HyMES/buff.c"
 $4 = ((($3)) + 16|0); //@line 213 "HyMES/buff.c"
 $5 = HEAP32[$4>>2]|0; //@line 213 "HyMES/buff.c"
 $6 = (($5) + ($2))|0; //@line 213 "HyMES/buff.c"
 HEAP32[$4>>2] = $6; //@line 213 "HyMES/buff.c"
 $7 = $0; //@line 214 "HyMES/buff.c"
 $8 = ((($7)) + 16|0); //@line 214 "HyMES/buff.c"
 $9 = HEAP32[$8>>2]|0; //@line 214 "HyMES/buff.c"
 $10 = (($9) - 1)|0; //@line 214 "HyMES/buff.c"
 $11 = (($10|0) / 8)&-1; //@line 214 "HyMES/buff.c"
 $12 = $0; //@line 214 "HyMES/buff.c"
 $13 = ((($12)) + 20|0); //@line 214 "HyMES/buff.c"
 HEAP32[$13>>2] = $11; //@line 214 "HyMES/buff.c"
 $14 = $0; //@line 215 "HyMES/buff.c"
 $15 = ((($14)) + 16|0); //@line 215 "HyMES/buff.c"
 $16 = HEAP32[$15>>2]|0; //@line 215 "HyMES/buff.c"
 $17 = (0 - ($16))|0; //@line 215 "HyMES/buff.c"
 $18 = $17 & 7; //@line 215 "HyMES/buff.c"
 $19 = ($18|0)==(32); //@line 215 "HyMES/buff.c"
 if ($19) {
  $27 = 0;
  $26 = $27&255; //@line 215 "HyMES/buff.c"
  $28 = $0; //@line 215 "HyMES/buff.c"
  $29 = ((($28)) + 8|0); //@line 215 "HyMES/buff.c"
  HEAP8[$29>>0] = $26; //@line 215 "HyMES/buff.c"
  STACKTOP = sp;return; //@line 216 "HyMES/buff.c"
 }
 $20 = $0; //@line 215 "HyMES/buff.c"
 $21 = ((($20)) + 16|0); //@line 215 "HyMES/buff.c"
 $22 = HEAP32[$21>>2]|0; //@line 215 "HyMES/buff.c"
 $23 = (0 - ($22))|0; //@line 215 "HyMES/buff.c"
 $24 = $23 & 7; //@line 215 "HyMES/buff.c"
 $25 = -1 << $24; //@line 215 "HyMES/buff.c"
 $27 = $25;
 $26 = $27&255; //@line 215 "HyMES/buff.c"
 $28 = $0; //@line 215 "HyMES/buff.c"
 $29 = ((($28)) + 8|0); //@line 215 "HyMES/buff.c"
 HEAP8[$29>>0] = $26; //@line 215 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 216 "HyMES/buff.c"
}
function _bread($i,$bin) {
 $i = $i|0;
 $bin = $bin|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $res = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $i;
 $1 = $bin;
 $res = 0; //@line 220 "HyMES/buff.c"
 $2 = $1; //@line 222 "HyMES/buff.c"
 $3 = HEAP32[$2>>2]|0; //@line 222 "HyMES/buff.c"
 $4 = $0; //@line 222 "HyMES/buff.c"
 $5 = ($3|0)<($4|0); //@line 222 "HyMES/buff.c"
 if ($5) {
  $6 = $1; //@line 223 "HyMES/buff.c"
  $7 = ((($6)) + 4|0); //@line 223 "HyMES/buff.c"
  $8 = HEAP32[$7>>2]|0; //@line 223 "HyMES/buff.c"
  $9 = $1; //@line 223 "HyMES/buff.c"
  $10 = HEAP32[$9>>2]|0; //@line 223 "HyMES/buff.c"
  $11 = ($10|0)!=(0); //@line 223 "HyMES/buff.c"
  if ($11) {
   $12 = $1; //@line 223 "HyMES/buff.c"
   $13 = HEAP32[$12>>2]|0; //@line 223 "HyMES/buff.c"
   $14 = 1 << $13; //@line 223 "HyMES/buff.c"
   $15 = (($14) - 1)|0; //@line 223 "HyMES/buff.c"
   $17 = $15;
  } else {
   $17 = 0;
  }
  $16 = $8 & $17; //@line 223 "HyMES/buff.c"
  $res = $16; //@line 223 "HyMES/buff.c"
  $18 = $1; //@line 224 "HyMES/buff.c"
  $19 = HEAP32[$18>>2]|0; //@line 224 "HyMES/buff.c"
  $20 = $0; //@line 224 "HyMES/buff.c"
  $21 = (($20) - ($19))|0; //@line 224 "HyMES/buff.c"
  $0 = $21; //@line 224 "HyMES/buff.c"
  $22 = $0; //@line 225 "HyMES/buff.c"
  $23 = $res; //@line 225 "HyMES/buff.c"
  $24 = $23 << $22; //@line 225 "HyMES/buff.c"
  $res = $24; //@line 225 "HyMES/buff.c"
  $25 = $1; //@line 226 "HyMES/buff.c"
  _bfill($25); //@line 226 "HyMES/buff.c"
 }
 $26 = $0; //@line 228 "HyMES/buff.c"
 $27 = $1; //@line 228 "HyMES/buff.c"
 $28 = HEAP32[$27>>2]|0; //@line 228 "HyMES/buff.c"
 $29 = (($28) - ($26))|0; //@line 228 "HyMES/buff.c"
 HEAP32[$27>>2] = $29; //@line 228 "HyMES/buff.c"
 $30 = $1; //@line 229 "HyMES/buff.c"
 $31 = ((($30)) + 4|0); //@line 229 "HyMES/buff.c"
 $32 = HEAP32[$31>>2]|0; //@line 229 "HyMES/buff.c"
 $33 = $1; //@line 229 "HyMES/buff.c"
 $34 = HEAP32[$33>>2]|0; //@line 229 "HyMES/buff.c"
 $35 = $32 >>> $34; //@line 229 "HyMES/buff.c"
 $36 = $0; //@line 229 "HyMES/buff.c"
 $37 = ($36|0)!=(0); //@line 229 "HyMES/buff.c"
 if (!($37)) {
  $42 = 0;
  $41 = $35 & $42; //@line 229 "HyMES/buff.c"
  $43 = $res; //@line 229 "HyMES/buff.c"
  $44 = $43 ^ $41; //@line 229 "HyMES/buff.c"
  $res = $44; //@line 229 "HyMES/buff.c"
  $45 = $res; //@line 231 "HyMES/buff.c"
  STACKTOP = sp;return ($45|0); //@line 231 "HyMES/buff.c"
 }
 $38 = $0; //@line 229 "HyMES/buff.c"
 $39 = 1 << $38; //@line 229 "HyMES/buff.c"
 $40 = (($39) - 1)|0; //@line 229 "HyMES/buff.c"
 $42 = $40;
 $41 = $35 & $42; //@line 229 "HyMES/buff.c"
 $43 = $res; //@line 229 "HyMES/buff.c"
 $44 = $43 ^ $41; //@line 229 "HyMES/buff.c"
 $res = $44; //@line 229 "HyMES/buff.c"
 $45 = $res; //@line 231 "HyMES/buff.c"
 STACKTOP = sp;return ($45|0); //@line 231 "HyMES/buff.c"
}
function _bread_lock($i,$bin) {
 $i = $i|0;
 $bin = $bin|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $i;
 $1 = $bin;
 $2 = $1; //@line 235 "HyMES/buff.c"
 $3 = ((($2)) + 24|0); //@line 235 "HyMES/buff.c"
 $4 = HEAP32[$3>>2]|0; //@line 235 "HyMES/buff.c"
 $5 = (($4) + 1)|0; //@line 235 "HyMES/buff.c"
 $6 = $5<<3; //@line 235 "HyMES/buff.c"
 $7 = $1; //@line 235 "HyMES/buff.c"
 $8 = HEAP32[$7>>2]|0; //@line 235 "HyMES/buff.c"
 $9 = (($6) - ($8))|0; //@line 235 "HyMES/buff.c"
 $10 = $0; //@line 235 "HyMES/buff.c"
 $11 = (($9) + ($10))|0; //@line 235 "HyMES/buff.c"
 $12 = $1; //@line 235 "HyMES/buff.c"
 $13 = ((($12)) + 28|0); //@line 235 "HyMES/buff.c"
 HEAP32[$13>>2] = $11; //@line 235 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 236 "HyMES/buff.c"
}
function _bwrite_lock($i,$bout) {
 $i = $i|0;
 $bout = $bout|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $i;
 $1 = $bout;
 $2 = $1; //@line 239 "HyMES/buff.c"
 $3 = ((($2)) + 24|0); //@line 239 "HyMES/buff.c"
 $4 = HEAP32[$3>>2]|0; //@line 239 "HyMES/buff.c"
 $5 = (($4) + 1)|0; //@line 239 "HyMES/buff.c"
 $6 = $5<<3; //@line 239 "HyMES/buff.c"
 $7 = (($6) + 32)|0; //@line 239 "HyMES/buff.c"
 $8 = $1; //@line 239 "HyMES/buff.c"
 $9 = HEAP32[$8>>2]|0; //@line 239 "HyMES/buff.c"
 $10 = (($7) - ($9))|0; //@line 239 "HyMES/buff.c"
 $11 = $0; //@line 239 "HyMES/buff.c"
 $12 = (($10) + ($11))|0; //@line 239 "HyMES/buff.c"
 $13 = $1; //@line 239 "HyMES/buff.c"
 $14 = ((($13)) + 28|0); //@line 239 "HyMES/buff.c"
 HEAP32[$14>>2] = $12; //@line 239 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 240 "HyMES/buff.c"
}
function _blook($i,$bin) {
 $i = $i|0;
 $bin = $bin|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $res = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $i;
 $1 = $bin;
 $res = 0; //@line 245 "HyMES/buff.c"
 while(1) {
  $2 = $1; //@line 247 "HyMES/buff.c"
  $3 = HEAP32[$2>>2]|0; //@line 247 "HyMES/buff.c"
  $4 = $0; //@line 247 "HyMES/buff.c"
  $5 = ($3|0)<($4|0); //@line 247 "HyMES/buff.c"
  $6 = $1; //@line 248 "HyMES/buff.c"
  $7 = ((($6)) + 4|0); //@line 248 "HyMES/buff.c"
  $8 = HEAP32[$7>>2]|0; //@line 248 "HyMES/buff.c"
  if (!($5)) {
   break;
  }
  $9 = $8 << 8; //@line 248 "HyMES/buff.c"
  HEAP32[$7>>2] = $9; //@line 248 "HyMES/buff.c"
  $10 = $1; //@line 249 "HyMES/buff.c"
  $11 = (_bread_getchar($10)|0); //@line 249 "HyMES/buff.c"
  $12 = $11&255; //@line 249 "HyMES/buff.c"
  $13 = $1; //@line 249 "HyMES/buff.c"
  $14 = ((($13)) + 4|0); //@line 249 "HyMES/buff.c"
  $15 = HEAP32[$14>>2]|0; //@line 249 "HyMES/buff.c"
  $16 = $15 ^ $12; //@line 249 "HyMES/buff.c"
  HEAP32[$14>>2] = $16; //@line 249 "HyMES/buff.c"
  $17 = $1; //@line 250 "HyMES/buff.c"
  $18 = HEAP32[$17>>2]|0; //@line 250 "HyMES/buff.c"
  $19 = (($18) + 8)|0; //@line 250 "HyMES/buff.c"
  HEAP32[$17>>2] = $19; //@line 250 "HyMES/buff.c"
 }
 $20 = $1; //@line 252 "HyMES/buff.c"
 $21 = HEAP32[$20>>2]|0; //@line 252 "HyMES/buff.c"
 $22 = $0; //@line 252 "HyMES/buff.c"
 $23 = (($21) - ($22))|0; //@line 252 "HyMES/buff.c"
 $24 = $8 >>> $23; //@line 252 "HyMES/buff.c"
 $25 = $0; //@line 252 "HyMES/buff.c"
 $26 = ($25|0)!=(0); //@line 252 "HyMES/buff.c"
 if (!($26)) {
  $31 = 0;
  $30 = $24 & $31; //@line 252 "HyMES/buff.c"
  $32 = $res; //@line 252 "HyMES/buff.c"
  $33 = $32 ^ $30; //@line 252 "HyMES/buff.c"
  $res = $33; //@line 252 "HyMES/buff.c"
  $34 = $res; //@line 254 "HyMES/buff.c"
  STACKTOP = sp;return ($34|0); //@line 254 "HyMES/buff.c"
 }
 $27 = $0; //@line 252 "HyMES/buff.c"
 $28 = 1 << $27; //@line 252 "HyMES/buff.c"
 $29 = (($28) - 1)|0; //@line 252 "HyMES/buff.c"
 $31 = $29;
 $30 = $24 & $31; //@line 252 "HyMES/buff.c"
 $32 = $res; //@line 252 "HyMES/buff.c"
 $33 = $32 ^ $30; //@line 252 "HyMES/buff.c"
 $res = $33; //@line 252 "HyMES/buff.c"
 $34 = $res; //@line 254 "HyMES/buff.c"
 STACKTOP = sp;return ($34|0); //@line 254 "HyMES/buff.c"
}
function _bstep($i,$bin) {
 $i = $i|0;
 $bin = $bin|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $i;
 $1 = $bin;
 $2 = $1; //@line 259 "HyMES/buff.c"
 $3 = HEAP32[$2>>2]|0; //@line 259 "HyMES/buff.c"
 $4 = $0; //@line 259 "HyMES/buff.c"
 $5 = ($3|0)<($4|0); //@line 259 "HyMES/buff.c"
 if ($5) {
  $6 = $1; //@line 260 "HyMES/buff.c"
  $7 = HEAP32[$6>>2]|0; //@line 260 "HyMES/buff.c"
  $8 = $0; //@line 260 "HyMES/buff.c"
  $9 = (($8) - ($7))|0; //@line 260 "HyMES/buff.c"
  $0 = $9; //@line 260 "HyMES/buff.c"
  $10 = $1; //@line 261 "HyMES/buff.c"
  _bfill($10); //@line 261 "HyMES/buff.c"
 }
 $11 = $0; //@line 263 "HyMES/buff.c"
 $12 = $1; //@line 263 "HyMES/buff.c"
 $13 = HEAP32[$12>>2]|0; //@line 263 "HyMES/buff.c"
 $14 = (($13) - ($11))|0; //@line 263 "HyMES/buff.c"
 HEAP32[$12>>2] = $14; //@line 263 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 264 "HyMES/buff.c"
}
function _bwrite($x,$i,$bout) {
 $x = $x|0;
 $i = $i|0;
 $bout = $bout|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $x;
 $1 = $i;
 $2 = $bout;
 $3 = $2; //@line 275 "HyMES/buff.c"
 $4 = HEAP32[$3>>2]|0; //@line 275 "HyMES/buff.c"
 $5 = $1; //@line 275 "HyMES/buff.c"
 $6 = ($4|0)<($5|0); //@line 275 "HyMES/buff.c"
 if ($6) {
  $7 = $2; //@line 276 "HyMES/buff.c"
  $8 = HEAP32[$7>>2]|0; //@line 276 "HyMES/buff.c"
  $9 = $1; //@line 276 "HyMES/buff.c"
  $10 = (($9) - ($8))|0; //@line 276 "HyMES/buff.c"
  $1 = $10; //@line 276 "HyMES/buff.c"
  $11 = $0; //@line 277 "HyMES/buff.c"
  $12 = $1; //@line 277 "HyMES/buff.c"
  $13 = $11 >>> $12; //@line 277 "HyMES/buff.c"
  $14 = $2; //@line 277 "HyMES/buff.c"
  $15 = ((($14)) + 4|0); //@line 277 "HyMES/buff.c"
  $16 = HEAP32[$15>>2]|0; //@line 277 "HyMES/buff.c"
  $17 = $16 ^ $13; //@line 277 "HyMES/buff.c"
  HEAP32[$15>>2] = $17; //@line 277 "HyMES/buff.c"
  $18 = $2; //@line 278 "HyMES/buff.c"
  _bflush($18); //@line 278 "HyMES/buff.c"
  $19 = $1; //@line 279 "HyMES/buff.c"
  $20 = ($19|0)!=(0); //@line 279 "HyMES/buff.c"
  if ($20) {
   $21 = $1; //@line 279 "HyMES/buff.c"
   $22 = 1 << $21; //@line 279 "HyMES/buff.c"
   $23 = (($22) - 1)|0; //@line 279 "HyMES/buff.c"
   $26 = $23;
  } else {
   $26 = 0;
  }
  $24 = $0; //@line 279 "HyMES/buff.c"
  $25 = $24 & $26; //@line 279 "HyMES/buff.c"
  $0 = $25; //@line 279 "HyMES/buff.c"
 }
 $27 = $1; //@line 282 "HyMES/buff.c"
 $28 = $2; //@line 282 "HyMES/buff.c"
 $29 = HEAP32[$28>>2]|0; //@line 282 "HyMES/buff.c"
 $30 = (($29) - ($27))|0; //@line 282 "HyMES/buff.c"
 HEAP32[$28>>2] = $30; //@line 282 "HyMES/buff.c"
 $31 = $0; //@line 283 "HyMES/buff.c"
 $32 = $2; //@line 283 "HyMES/buff.c"
 $33 = HEAP32[$32>>2]|0; //@line 283 "HyMES/buff.c"
 $34 = $31 << $33; //@line 283 "HyMES/buff.c"
 $35 = $2; //@line 283 "HyMES/buff.c"
 $36 = ((($35)) + 4|0); //@line 283 "HyMES/buff.c"
 $37 = HEAP32[$36>>2]|0; //@line 283 "HyMES/buff.c"
 $38 = $37 ^ $34; //@line 283 "HyMES/buff.c"
 HEAP32[$36>>2] = $38; //@line 283 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 284 "HyMES/buff.c"
}
function _bwrite_bit($x,$bout) {
 $x = $x|0;
 $bout = $bout|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $x;
 $1 = $bout;
 $2 = $1; //@line 288 "HyMES/buff.c"
 $3 = HEAP32[$2>>2]|0; //@line 288 "HyMES/buff.c"
 $4 = ($3|0)<=(0); //@line 288 "HyMES/buff.c"
 if ($4) {
  $5 = $1; //@line 289 "HyMES/buff.c"
  _bflush($5); //@line 289 "HyMES/buff.c"
 }
 $6 = $1; //@line 290 "HyMES/buff.c"
 $7 = HEAP32[$6>>2]|0; //@line 290 "HyMES/buff.c"
 $8 = (($7) + -1)|0; //@line 290 "HyMES/buff.c"
 HEAP32[$6>>2] = $8; //@line 290 "HyMES/buff.c"
 $9 = $0; //@line 291 "HyMES/buff.c"
 $10 = $1; //@line 291 "HyMES/buff.c"
 $11 = HEAP32[$10>>2]|0; //@line 291 "HyMES/buff.c"
 $12 = $9 << $11; //@line 291 "HyMES/buff.c"
 $13 = $1; //@line 291 "HyMES/buff.c"
 $14 = ((($13)) + 4|0); //@line 291 "HyMES/buff.c"
 $15 = HEAP32[$14>>2]|0; //@line 291 "HyMES/buff.c"
 $16 = $15 ^ $12; //@line 291 "HyMES/buff.c"
 HEAP32[$14>>2] = $16; //@line 291 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 292 "HyMES/buff.c"
}
function _bwrite_bits($x,$n,$bout) {
 $x = $x|0;
 $n = $n|0;
 $bout = $bout|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $x;
 $1 = $n;
 $2 = $bout;
 $3 = $2; //@line 296 "HyMES/buff.c"
 $4 = HEAP32[$3>>2]|0; //@line 296 "HyMES/buff.c"
 $5 = ($4|0)<=(0); //@line 296 "HyMES/buff.c"
 if ($5) {
  $6 = $2; //@line 297 "HyMES/buff.c"
  _bflush($6); //@line 297 "HyMES/buff.c"
 }
 $7 = $0; //@line 298 "HyMES/buff.c"
 $8 = ($7|0)!=(0); //@line 298 "HyMES/buff.c"
 $9 = $8 ? -1 : 0; //@line 298 "HyMES/buff.c"
 $0 = $9; //@line 298 "HyMES/buff.c"
 $10 = $1; //@line 299 "HyMES/buff.c"
 $11 = $2; //@line 299 "HyMES/buff.c"
 $12 = HEAP32[$11>>2]|0; //@line 299 "HyMES/buff.c"
 $13 = ($10|0)>($12|0); //@line 299 "HyMES/buff.c"
 L4: do {
  if ($13) {
   $14 = $0; //@line 300 "HyMES/buff.c"
   $15 = $2; //@line 300 "HyMES/buff.c"
   $16 = HEAP32[$15>>2]|0; //@line 300 "HyMES/buff.c"
   $17 = (32 - ($16))|0; //@line 300 "HyMES/buff.c"
   $18 = $14 >>> $17; //@line 300 "HyMES/buff.c"
   $19 = $2; //@line 300 "HyMES/buff.c"
   $20 = ((($19)) + 4|0); //@line 300 "HyMES/buff.c"
   $21 = HEAP32[$20>>2]|0; //@line 300 "HyMES/buff.c"
   $22 = $21 ^ $18; //@line 300 "HyMES/buff.c"
   HEAP32[$20>>2] = $22; //@line 300 "HyMES/buff.c"
   $23 = $2; //@line 301 "HyMES/buff.c"
   $24 = HEAP32[$23>>2]|0; //@line 301 "HyMES/buff.c"
   $25 = $1; //@line 301 "HyMES/buff.c"
   $26 = (($25) - ($24))|0; //@line 301 "HyMES/buff.c"
   $1 = $26; //@line 301 "HyMES/buff.c"
   $27 = $2; //@line 302 "HyMES/buff.c"
   _bflush($27); //@line 302 "HyMES/buff.c"
   while(1) {
    $28 = $1; //@line 303 "HyMES/buff.c"
    $29 = ($28>>>0)>(32); //@line 303 "HyMES/buff.c"
    if (!($29)) {
     break L4;
    }
    $30 = $0; //@line 304 "HyMES/buff.c"
    $31 = $2; //@line 304 "HyMES/buff.c"
    $32 = ((($31)) + 4|0); //@line 304 "HyMES/buff.c"
    HEAP32[$32>>2] = $30; //@line 304 "HyMES/buff.c"
    $33 = $1; //@line 305 "HyMES/buff.c"
    $34 = (($33) - 32)|0; //@line 305 "HyMES/buff.c"
    $1 = $34; //@line 305 "HyMES/buff.c"
    $35 = $2; //@line 306 "HyMES/buff.c"
    _bflush($35); //@line 306 "HyMES/buff.c"
   }
  }
 } while(0);
 $36 = $1; //@line 309 "HyMES/buff.c"
 $37 = ($36|0)>(0); //@line 309 "HyMES/buff.c"
 if (!($37)) {
  STACKTOP = sp;return; //@line 313 "HyMES/buff.c"
 }
 $38 = $1; //@line 310 "HyMES/buff.c"
 $39 = $2; //@line 310 "HyMES/buff.c"
 $40 = HEAP32[$39>>2]|0; //@line 310 "HyMES/buff.c"
 $41 = (($40) - ($38))|0; //@line 310 "HyMES/buff.c"
 HEAP32[$39>>2] = $41; //@line 310 "HyMES/buff.c"
 $42 = $0; //@line 311 "HyMES/buff.c"
 $43 = $1; //@line 311 "HyMES/buff.c"
 $44 = (32 - ($43))|0; //@line 311 "HyMES/buff.c"
 $45 = $42 >>> $44; //@line 311 "HyMES/buff.c"
 $46 = $2; //@line 311 "HyMES/buff.c"
 $47 = HEAP32[$46>>2]|0; //@line 311 "HyMES/buff.c"
 $48 = $45 << $47; //@line 311 "HyMES/buff.c"
 $49 = $2; //@line 311 "HyMES/buff.c"
 $50 = ((($49)) + 4|0); //@line 311 "HyMES/buff.c"
 $51 = HEAP32[$50>>2]|0; //@line 311 "HyMES/buff.c"
 $52 = $51 ^ $48; //@line 311 "HyMES/buff.c"
 HEAP32[$50>>2] = $52; //@line 311 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 313 "HyMES/buff.c"
}
function _sk_from_string($sk) {
 $sk = $sk|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $sk;
 $1 = $0; //@line 42 "HyMES/decrypt.c"
 HEAP32[4868>>2] = $1; //@line 42 "HyMES/decrypt.c"
 $2 = $0; //@line 43 "HyMES/decrypt.c"
 $3 = ((($2)) + 376832|0); //@line 43 "HyMES/decrypt.c"
 $0 = $3; //@line 43 "HyMES/decrypt.c"
 $4 = $0; //@line 45 "HyMES/decrypt.c"
 HEAP32[4872>>2] = $4; //@line 45 "HyMES/decrypt.c"
 $5 = $0; //@line 46 "HyMES/decrypt.c"
 $6 = ((($5)) + 8192|0); //@line 46 "HyMES/decrypt.c"
 $0 = $6; //@line 46 "HyMES/decrypt.c"
 $7 = $0; //@line 48 "HyMES/decrypt.c"
 $8 = (_poly_alloc_from_string(60,$7)|0); //@line 48 "HyMES/decrypt.c"
 HEAP32[4876>>2] = $8; //@line 48 "HyMES/decrypt.c"
 $9 = HEAP32[4876>>2]|0; //@line 49 "HyMES/decrypt.c"
 HEAP32[$9>>2] = 60; //@line 49 "HyMES/decrypt.c"
 $10 = $0; //@line 50 "HyMES/decrypt.c"
 $11 = ((($10)) + 122|0); //@line 50 "HyMES/decrypt.c"
 $0 = $11; //@line 50 "HyMES/decrypt.c"
 $i = 0; //@line 52 "HyMES/decrypt.c"
 while(1) {
  $12 = $i; //@line 52 "HyMES/decrypt.c"
  $13 = ($12|0)<(60); //@line 52 "HyMES/decrypt.c"
  if (!($13)) {
   break;
  }
  $14 = $0; //@line 53 "HyMES/decrypt.c"
  $15 = (_poly_alloc_from_string(59,$14)|0); //@line 53 "HyMES/decrypt.c"
  $16 = $i; //@line 53 "HyMES/decrypt.c"
  $17 = (4880 + ($16<<2)|0); //@line 53 "HyMES/decrypt.c"
  HEAP32[$17>>2] = $15; //@line 53 "HyMES/decrypt.c"
  $18 = $i; //@line 54 "HyMES/decrypt.c"
  $19 = (4880 + ($18<<2)|0); //@line 54 "HyMES/decrypt.c"
  $20 = HEAP32[$19>>2]|0; //@line 54 "HyMES/decrypt.c"
  HEAP32[$20>>2] = 59; //@line 54 "HyMES/decrypt.c"
  $21 = $0; //@line 55 "HyMES/decrypt.c"
  $22 = ((($21)) + 120|0); //@line 55 "HyMES/decrypt.c"
  $0 = $22; //@line 55 "HyMES/decrypt.c"
  $23 = $i; //@line 52 "HyMES/decrypt.c"
  $24 = (($23) + 1)|0; //@line 52 "HyMES/decrypt.c"
  $i = $24; //@line 52 "HyMES/decrypt.c"
 }
 STACKTOP = sp;return; //@line 57 "HyMES/decrypt.c"
}
function _sk_free() {
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = HEAP32[4876>>2]|0; //@line 63 "HyMES/decrypt.c"
 _free($0); //@line 63 "HyMES/decrypt.c"
 $i = 0; //@line 64 "HyMES/decrypt.c"
 while(1) {
  $1 = $i; //@line 64 "HyMES/decrypt.c"
  $2 = ($1|0)<(60); //@line 64 "HyMES/decrypt.c"
  if (!($2)) {
   break;
  }
  $3 = $i; //@line 65 "HyMES/decrypt.c"
  $4 = (4880 + ($3<<2)|0); //@line 65 "HyMES/decrypt.c"
  $5 = HEAP32[$4>>2]|0; //@line 65 "HyMES/decrypt.c"
  _free($5); //@line 65 "HyMES/decrypt.c"
  $6 = $i; //@line 64 "HyMES/decrypt.c"
  $7 = (($6) + 1)|0; //@line 64 "HyMES/decrypt.c"
  $i = $7; //@line 64 "HyMES/decrypt.c"
 }
 STACKTOP = sp;return; //@line 67 "HyMES/decrypt.c"
}
function _xor($a,$b) {
 $a = $a|0;
 $b = $b|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $a;
 $1 = $b;
 $i = 0; //@line 72 "HyMES/decrypt.c"
 while(1) {
  $2 = $i; //@line 72 "HyMES/decrypt.c"
  $3 = ($2>>>0)<(23); //@line 72 "HyMES/decrypt.c"
  if (!($3)) {
   break;
  }
  $4 = $i; //@line 73 "HyMES/decrypt.c"
  $5 = $1; //@line 73 "HyMES/decrypt.c"
  $6 = (($5) + ($4<<2)|0); //@line 73 "HyMES/decrypt.c"
  $7 = HEAP32[$6>>2]|0; //@line 73 "HyMES/decrypt.c"
  $8 = $i; //@line 73 "HyMES/decrypt.c"
  $9 = $0; //@line 73 "HyMES/decrypt.c"
  $10 = (($9) + ($8<<2)|0); //@line 73 "HyMES/decrypt.c"
  $11 = HEAP32[$10>>2]|0; //@line 73 "HyMES/decrypt.c"
  $12 = $11 ^ $7; //@line 73 "HyMES/decrypt.c"
  HEAP32[$10>>2] = $12; //@line 73 "HyMES/decrypt.c"
  $13 = $i; //@line 72 "HyMES/decrypt.c"
  $14 = (($13) + 1)|0; //@line 72 "HyMES/decrypt.c"
  $i = $14; //@line 72 "HyMES/decrypt.c"
 }
 STACKTOP = sp;return; //@line 74 "HyMES/decrypt.c"
}
function _syndrome($b) {
 $b = $b|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $7 = 0, $8 = 0, $9 = 0, $R = 0, $a = 0, $c = 0, $j = 0, $k = 0, $l = 0, dest = 0, label = 0, sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 128|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $c = sp;
 $0 = $b;
 dest=$c; stop=dest+92|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0)); //@line 84 "HyMES/decrypt.c"
 $1 = (_poly_alloc(59)|0); //@line 86 "HyMES/decrypt.c"
 $R = $1; //@line 86 "HyMES/decrypt.c"
 $j = 0; //@line 87 "HyMES/decrypt.c"
 while(1) {
  $2 = $j; //@line 87 "HyMES/decrypt.c"
  $3 = ($2|0)<(4096); //@line 87 "HyMES/decrypt.c"
  if (!($3)) {
   break;
  }
  $4 = $j; //@line 89 "HyMES/decrypt.c"
  $5 = (($4|0) / 8)&-1; //@line 89 "HyMES/decrypt.c"
  $6 = $0; //@line 89 "HyMES/decrypt.c"
  $7 = (($6) + ($5)|0); //@line 89 "HyMES/decrypt.c"
  $8 = HEAP8[$7>>0]|0; //@line 89 "HyMES/decrypt.c"
  $9 = $8&255; //@line 89 "HyMES/decrypt.c"
  $10 = $j; //@line 89 "HyMES/decrypt.c"
  $11 = (($10|0) % 8)&-1; //@line 89 "HyMES/decrypt.c"
  $12 = $9 >> $11; //@line 89 "HyMES/decrypt.c"
  $13 = $12 & 1; //@line 89 "HyMES/decrypt.c"
  $14 = ($13|0)!=(0); //@line 89 "HyMES/decrypt.c"
  if ($14) {
   $15 = HEAP32[4868>>2]|0; //@line 90 "HyMES/decrypt.c"
   $16 = $j; //@line 90 "HyMES/decrypt.c"
   $17 = ($16*23)|0; //@line 90 "HyMES/decrypt.c"
   $18 = (($15) + ($17<<2)|0); //@line 90 "HyMES/decrypt.c"
   _xor($c,$18); //@line 90 "HyMES/decrypt.c"
  }
  $19 = $j; //@line 87 "HyMES/decrypt.c"
  $20 = (($19) + 1)|0; //@line 87 "HyMES/decrypt.c"
  $j = $20; //@line 87 "HyMES/decrypt.c"
 }
 $l = 0; //@line 95 "HyMES/decrypt.c"
 while(1) {
  $21 = $l; //@line 95 "HyMES/decrypt.c"
  $22 = ($21|0)<(60); //@line 95 "HyMES/decrypt.c"
  if (!($22)) {
   break;
  }
  $23 = $l; //@line 96 "HyMES/decrypt.c"
  $24 = ($23*12)|0; //@line 96 "HyMES/decrypt.c"
  $25 = (($24>>>0) / 32)&-1; //@line 96 "HyMES/decrypt.c"
  $k = $25; //@line 96 "HyMES/decrypt.c"
  $26 = $l; //@line 97 "HyMES/decrypt.c"
  $27 = ($26*12)|0; //@line 97 "HyMES/decrypt.c"
  $28 = (($27>>>0) % 32)&-1; //@line 97 "HyMES/decrypt.c"
  $j = $28; //@line 97 "HyMES/decrypt.c"
  $29 = $k; //@line 98 "HyMES/decrypt.c"
  $30 = (($c) + ($29<<2)|0); //@line 98 "HyMES/decrypt.c"
  $31 = HEAP32[$30>>2]|0; //@line 98 "HyMES/decrypt.c"
  $32 = $j; //@line 98 "HyMES/decrypt.c"
  $33 = $31 >>> $32; //@line 98 "HyMES/decrypt.c"
  $34 = $33&65535; //@line 98 "HyMES/decrypt.c"
  $a = $34; //@line 98 "HyMES/decrypt.c"
  $35 = $j; //@line 99 "HyMES/decrypt.c"
  $36 = (($35) + 12)|0; //@line 99 "HyMES/decrypt.c"
  $37 = ($36>>>0)>(32); //@line 99 "HyMES/decrypt.c"
  if ($37) {
   $38 = $k; //@line 100 "HyMES/decrypt.c"
   $39 = (($38) + 1)|0; //@line 100 "HyMES/decrypt.c"
   $40 = (($c) + ($39<<2)|0); //@line 100 "HyMES/decrypt.c"
   $41 = HEAP32[$40>>2]|0; //@line 100 "HyMES/decrypt.c"
   $42 = $j; //@line 100 "HyMES/decrypt.c"
   $43 = (32 - ($42))|0; //@line 100 "HyMES/decrypt.c"
   $44 = $41 << $43; //@line 100 "HyMES/decrypt.c"
   $45 = $a; //@line 100 "HyMES/decrypt.c"
   $46 = $45&65535; //@line 100 "HyMES/decrypt.c"
   $47 = $46 ^ $44; //@line 100 "HyMES/decrypt.c"
   $48 = $47&65535; //@line 100 "HyMES/decrypt.c"
   $a = $48; //@line 100 "HyMES/decrypt.c"
  }
  $49 = $a; //@line 101 "HyMES/decrypt.c"
  $50 = $49&65535; //@line 101 "HyMES/decrypt.c"
  $51 = $50 & 4095; //@line 101 "HyMES/decrypt.c"
  $52 = $51&65535; //@line 101 "HyMES/decrypt.c"
  $a = $52; //@line 101 "HyMES/decrypt.c"
  $53 = $a; //@line 102 "HyMES/decrypt.c"
  $54 = $l; //@line 102 "HyMES/decrypt.c"
  $55 = $R; //@line 102 "HyMES/decrypt.c"
  $56 = ((($55)) + 8|0); //@line 102 "HyMES/decrypt.c"
  $57 = HEAP32[$56>>2]|0; //@line 102 "HyMES/decrypt.c"
  $58 = (($57) + ($54<<1)|0); //@line 102 "HyMES/decrypt.c"
  HEAP16[$58>>1] = $53; //@line 102 "HyMES/decrypt.c"
  $59 = $l; //@line 95 "HyMES/decrypt.c"
  $60 = (($59) + 1)|0; //@line 95 "HyMES/decrypt.c"
  $l = $60; //@line 95 "HyMES/decrypt.c"
 }
 $61 = $R; //@line 105 "HyMES/decrypt.c"
 (_poly_calcule_deg($61)|0); //@line 105 "HyMES/decrypt.c"
 $62 = $R; //@line 106 "HyMES/decrypt.c"
 STACKTOP = sp;return ($62|0); //@line 106 "HyMES/decrypt.c"
}
function _roots_berl_aux($sigma,$d,$tr_aux,$tr,$e,$res) {
 $sigma = $sigma|0;
 $d = $d|0;
 $tr_aux = $tr_aux|0;
 $tr = $tr|0;
 $e = $e|0;
 $res = $res|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0;
 var $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0;
 var $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0;
 var $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0;
 var $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0;
 var $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0;
 var $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0;
 var $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $a = 0, $gcd1 = 0, $gcd2 = 0, $i = 0, $j = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $sigma;
 $2 = $d;
 $3 = $tr_aux;
 $4 = $tr;
 $5 = $e;
 $6 = $res;
 $7 = $2; //@line 114 "HyMES/decrypt.c"
 $8 = ($7|0)==(0); //@line 114 "HyMES/decrypt.c"
 if ($8) {
  $0 = 0; //@line 115 "HyMES/decrypt.c"
  $246 = $0; //@line 150 "HyMES/decrypt.c"
  STACKTOP = sp;return ($246|0); //@line 150 "HyMES/decrypt.c"
 }
 $9 = $2; //@line 118 "HyMES/decrypt.c"
 $10 = ($9|0)==(1); //@line 118 "HyMES/decrypt.c"
 if ($10) {
  $11 = $1; //@line 119 "HyMES/decrypt.c"
  $12 = ((($11)) + 8|0); //@line 119 "HyMES/decrypt.c"
  $13 = HEAP32[$12>>2]|0; //@line 119 "HyMES/decrypt.c"
  $14 = HEAP16[$13>>1]|0; //@line 119 "HyMES/decrypt.c"
  $15 = $14&65535; //@line 119 "HyMES/decrypt.c"
  $16 = ($15|0)!=(0); //@line 119 "HyMES/decrypt.c"
  if ($16) {
   $17 = $1; //@line 119 "HyMES/decrypt.c"
   $18 = ((($17)) + 8|0); //@line 119 "HyMES/decrypt.c"
   $19 = HEAP32[$18>>2]|0; //@line 119 "HyMES/decrypt.c"
   $20 = HEAP16[$19>>1]|0; //@line 119 "HyMES/decrypt.c"
   $21 = $20&65535; //@line 119 "HyMES/decrypt.c"
   $22 = HEAP32[5120>>2]|0; //@line 119 "HyMES/decrypt.c"
   $23 = (($22) + ($21<<1)|0); //@line 119 "HyMES/decrypt.c"
   $24 = HEAP16[$23>>1]|0; //@line 119 "HyMES/decrypt.c"
   $25 = $24&65535; //@line 119 "HyMES/decrypt.c"
   $26 = $1; //@line 119 "HyMES/decrypt.c"
   $27 = ((($26)) + 8|0); //@line 119 "HyMES/decrypt.c"
   $28 = HEAP32[$27>>2]|0; //@line 119 "HyMES/decrypt.c"
   $29 = ((($28)) + 2|0); //@line 119 "HyMES/decrypt.c"
   $30 = HEAP16[$29>>1]|0; //@line 119 "HyMES/decrypt.c"
   $31 = $30&65535; //@line 119 "HyMES/decrypt.c"
   $32 = HEAP32[5120>>2]|0; //@line 119 "HyMES/decrypt.c"
   $33 = (($32) + ($31<<1)|0); //@line 119 "HyMES/decrypt.c"
   $34 = HEAP16[$33>>1]|0; //@line 119 "HyMES/decrypt.c"
   $35 = $34&65535; //@line 119 "HyMES/decrypt.c"
   $36 = (($25) - ($35))|0; //@line 119 "HyMES/decrypt.c"
   $37 = HEAP32[5124>>2]|0; //@line 119 "HyMES/decrypt.c"
   $38 = $36 & $37; //@line 119 "HyMES/decrypt.c"
   $39 = $1; //@line 119 "HyMES/decrypt.c"
   $40 = ((($39)) + 8|0); //@line 119 "HyMES/decrypt.c"
   $41 = HEAP32[$40>>2]|0; //@line 119 "HyMES/decrypt.c"
   $42 = HEAP16[$41>>1]|0; //@line 119 "HyMES/decrypt.c"
   $43 = $42&65535; //@line 119 "HyMES/decrypt.c"
   $44 = HEAP32[5120>>2]|0; //@line 119 "HyMES/decrypt.c"
   $45 = (($44) + ($43<<1)|0); //@line 119 "HyMES/decrypt.c"
   $46 = HEAP16[$45>>1]|0; //@line 119 "HyMES/decrypt.c"
   $47 = $46&65535; //@line 119 "HyMES/decrypt.c"
   $48 = $1; //@line 119 "HyMES/decrypt.c"
   $49 = ((($48)) + 8|0); //@line 119 "HyMES/decrypt.c"
   $50 = HEAP32[$49>>2]|0; //@line 119 "HyMES/decrypt.c"
   $51 = ((($50)) + 2|0); //@line 119 "HyMES/decrypt.c"
   $52 = HEAP16[$51>>1]|0; //@line 119 "HyMES/decrypt.c"
   $53 = $52&65535; //@line 119 "HyMES/decrypt.c"
   $54 = HEAP32[5120>>2]|0; //@line 119 "HyMES/decrypt.c"
   $55 = (($54) + ($53<<1)|0); //@line 119 "HyMES/decrypt.c"
   $56 = HEAP16[$55>>1]|0; //@line 119 "HyMES/decrypt.c"
   $57 = $56&65535; //@line 119 "HyMES/decrypt.c"
   $58 = (($47) - ($57))|0; //@line 119 "HyMES/decrypt.c"
   $59 = HEAP32[5128>>2]|0; //@line 119 "HyMES/decrypt.c"
   $60 = $58 >> $59; //@line 119 "HyMES/decrypt.c"
   $61 = (($38) + ($60))|0; //@line 119 "HyMES/decrypt.c"
   $62 = HEAP32[5132>>2]|0; //@line 119 "HyMES/decrypt.c"
   $63 = (($62) + ($61<<1)|0); //@line 119 "HyMES/decrypt.c"
   $64 = HEAP16[$63>>1]|0; //@line 119 "HyMES/decrypt.c"
   $65 = $64&65535; //@line 119 "HyMES/decrypt.c"
   $67 = $65;
  } else {
   $67 = 0;
  }
  $66 = $67&65535; //@line 119 "HyMES/decrypt.c"
  $68 = $6; //@line 119 "HyMES/decrypt.c"
  HEAP16[$68>>1] = $66; //@line 119 "HyMES/decrypt.c"
  $0 = 1; //@line 120 "HyMES/decrypt.c"
  $246 = $0; //@line 150 "HyMES/decrypt.c"
  STACKTOP = sp;return ($246|0); //@line 150 "HyMES/decrypt.c"
 }
 $69 = $5; //@line 124 "HyMES/decrypt.c"
 $70 = ($69|0)>=(12); //@line 124 "HyMES/decrypt.c"
 if ($70) {
  $0 = 0; //@line 125 "HyMES/decrypt.c"
  $246 = $0; //@line 150 "HyMES/decrypt.c"
  STACKTOP = sp;return ($246|0); //@line 150 "HyMES/decrypt.c"
 }
 $71 = $5; //@line 128 "HyMES/decrypt.c"
 $72 = $4; //@line 128 "HyMES/decrypt.c"
 $73 = (($72) + ($71<<2)|0); //@line 128 "HyMES/decrypt.c"
 $74 = HEAP32[$73>>2]|0; //@line 128 "HyMES/decrypt.c"
 $75 = ($74|0)==(0|0); //@line 128 "HyMES/decrypt.c"
 if ($75) {
  $76 = (_poly_alloc(59)|0); //@line 129 "HyMES/decrypt.c"
  $77 = $5; //@line 129 "HyMES/decrypt.c"
  $78 = $4; //@line 129 "HyMES/decrypt.c"
  $79 = (($78) + ($77<<2)|0); //@line 129 "HyMES/decrypt.c"
  HEAP32[$79>>2] = $76; //@line 129 "HyMES/decrypt.c"
  $80 = $5; //@line 130 "HyMES/decrypt.c"
  $81 = HEAP32[5132>>2]|0; //@line 130 "HyMES/decrypt.c"
  $82 = (($81) + ($80<<1)|0); //@line 130 "HyMES/decrypt.c"
  $83 = HEAP16[$82>>1]|0; //@line 130 "HyMES/decrypt.c"
  $a = $83; //@line 130 "HyMES/decrypt.c"
  $i = 0; //@line 131 "HyMES/decrypt.c"
  while(1) {
   $84 = $i; //@line 131 "HyMES/decrypt.c"
   $85 = ($84|0)<(12); //@line 131 "HyMES/decrypt.c"
   if (!($85)) {
    break;
   }
   $j = 0; //@line 132 "HyMES/decrypt.c"
   while(1) {
    $86 = $j; //@line 132 "HyMES/decrypt.c"
    $87 = ($86|0)<(60); //@line 132 "HyMES/decrypt.c"
    if (!($87)) {
     break;
    }
    $88 = $j; //@line 133 "HyMES/decrypt.c"
    $89 = $5; //@line 133 "HyMES/decrypt.c"
    $90 = $4; //@line 133 "HyMES/decrypt.c"
    $91 = (($90) + ($89<<2)|0); //@line 133 "HyMES/decrypt.c"
    $92 = HEAP32[$91>>2]|0; //@line 133 "HyMES/decrypt.c"
    $93 = ((($92)) + 8|0); //@line 133 "HyMES/decrypt.c"
    $94 = HEAP32[$93>>2]|0; //@line 133 "HyMES/decrypt.c"
    $95 = (($94) + ($88<<1)|0); //@line 133 "HyMES/decrypt.c"
    $96 = HEAP16[$95>>1]|0; //@line 133 "HyMES/decrypt.c"
    $97 = $96&65535; //@line 133 "HyMES/decrypt.c"
    $98 = $j; //@line 133 "HyMES/decrypt.c"
    $99 = $i; //@line 133 "HyMES/decrypt.c"
    $100 = $3; //@line 133 "HyMES/decrypt.c"
    $101 = (($100) + ($99<<2)|0); //@line 133 "HyMES/decrypt.c"
    $102 = HEAP32[$101>>2]|0; //@line 133 "HyMES/decrypt.c"
    $103 = ((($102)) + 8|0); //@line 133 "HyMES/decrypt.c"
    $104 = HEAP32[$103>>2]|0; //@line 133 "HyMES/decrypt.c"
    $105 = (($104) + ($98<<1)|0); //@line 133 "HyMES/decrypt.c"
    $106 = HEAP16[$105>>1]|0; //@line 133 "HyMES/decrypt.c"
    $107 = $106&65535; //@line 133 "HyMES/decrypt.c"
    $108 = ($107|0)!=(0); //@line 133 "HyMES/decrypt.c"
    if ($108) {
     $109 = $a; //@line 133 "HyMES/decrypt.c"
     $110 = $109&65535; //@line 133 "HyMES/decrypt.c"
     $111 = ($110|0)!=(0); //@line 133 "HyMES/decrypt.c"
     if ($111) {
      $112 = $j; //@line 133 "HyMES/decrypt.c"
      $113 = $i; //@line 133 "HyMES/decrypt.c"
      $114 = $3; //@line 133 "HyMES/decrypt.c"
      $115 = (($114) + ($113<<2)|0); //@line 133 "HyMES/decrypt.c"
      $116 = HEAP32[$115>>2]|0; //@line 133 "HyMES/decrypt.c"
      $117 = ((($116)) + 8|0); //@line 133 "HyMES/decrypt.c"
      $118 = HEAP32[$117>>2]|0; //@line 133 "HyMES/decrypt.c"
      $119 = (($118) + ($112<<1)|0); //@line 133 "HyMES/decrypt.c"
      $120 = HEAP16[$119>>1]|0; //@line 133 "HyMES/decrypt.c"
      $121 = $120&65535; //@line 133 "HyMES/decrypt.c"
      $122 = HEAP32[5120>>2]|0; //@line 133 "HyMES/decrypt.c"
      $123 = (($122) + ($121<<1)|0); //@line 133 "HyMES/decrypt.c"
      $124 = HEAP16[$123>>1]|0; //@line 133 "HyMES/decrypt.c"
      $125 = $124&65535; //@line 133 "HyMES/decrypt.c"
      $126 = $a; //@line 133 "HyMES/decrypt.c"
      $127 = $126&65535; //@line 133 "HyMES/decrypt.c"
      $128 = HEAP32[5120>>2]|0; //@line 133 "HyMES/decrypt.c"
      $129 = (($128) + ($127<<1)|0); //@line 133 "HyMES/decrypt.c"
      $130 = HEAP16[$129>>1]|0; //@line 133 "HyMES/decrypt.c"
      $131 = $130&65535; //@line 133 "HyMES/decrypt.c"
      $132 = (($125) + ($131))|0; //@line 133 "HyMES/decrypt.c"
      $133 = HEAP32[5124>>2]|0; //@line 133 "HyMES/decrypt.c"
      $134 = $132 & $133; //@line 133 "HyMES/decrypt.c"
      $135 = $j; //@line 133 "HyMES/decrypt.c"
      $136 = $i; //@line 133 "HyMES/decrypt.c"
      $137 = $3; //@line 133 "HyMES/decrypt.c"
      $138 = (($137) + ($136<<2)|0); //@line 133 "HyMES/decrypt.c"
      $139 = HEAP32[$138>>2]|0; //@line 133 "HyMES/decrypt.c"
      $140 = ((($139)) + 8|0); //@line 133 "HyMES/decrypt.c"
      $141 = HEAP32[$140>>2]|0; //@line 133 "HyMES/decrypt.c"
      $142 = (($141) + ($135<<1)|0); //@line 133 "HyMES/decrypt.c"
      $143 = HEAP16[$142>>1]|0; //@line 133 "HyMES/decrypt.c"
      $144 = $143&65535; //@line 133 "HyMES/decrypt.c"
      $145 = HEAP32[5120>>2]|0; //@line 133 "HyMES/decrypt.c"
      $146 = (($145) + ($144<<1)|0); //@line 133 "HyMES/decrypt.c"
      $147 = HEAP16[$146>>1]|0; //@line 133 "HyMES/decrypt.c"
      $148 = $147&65535; //@line 133 "HyMES/decrypt.c"
      $149 = $a; //@line 133 "HyMES/decrypt.c"
      $150 = $149&65535; //@line 133 "HyMES/decrypt.c"
      $151 = HEAP32[5120>>2]|0; //@line 133 "HyMES/decrypt.c"
      $152 = (($151) + ($150<<1)|0); //@line 133 "HyMES/decrypt.c"
      $153 = HEAP16[$152>>1]|0; //@line 133 "HyMES/decrypt.c"
      $154 = $153&65535; //@line 133 "HyMES/decrypt.c"
      $155 = (($148) + ($154))|0; //@line 133 "HyMES/decrypt.c"
      $156 = HEAP32[5128>>2]|0; //@line 133 "HyMES/decrypt.c"
      $157 = $155 >> $156; //@line 133 "HyMES/decrypt.c"
      $158 = (($134) + ($157))|0; //@line 133 "HyMES/decrypt.c"
      $159 = HEAP32[5132>>2]|0; //@line 133 "HyMES/decrypt.c"
      $160 = (($159) + ($158<<1)|0); //@line 133 "HyMES/decrypt.c"
      $161 = HEAP16[$160>>1]|0; //@line 133 "HyMES/decrypt.c"
      $162 = $161&65535; //@line 133 "HyMES/decrypt.c"
      $164 = $162;
     } else {
      $164 = 0;
     }
    } else {
     $164 = 0;
    }
    $163 = $97 ^ $164; //@line 133 "HyMES/decrypt.c"
    $165 = $163&65535; //@line 133 "HyMES/decrypt.c"
    $166 = $j; //@line 133 "HyMES/decrypt.c"
    $167 = $5; //@line 133 "HyMES/decrypt.c"
    $168 = $4; //@line 133 "HyMES/decrypt.c"
    $169 = (($168) + ($167<<2)|0); //@line 133 "HyMES/decrypt.c"
    $170 = HEAP32[$169>>2]|0; //@line 133 "HyMES/decrypt.c"
    $171 = ((($170)) + 8|0); //@line 133 "HyMES/decrypt.c"
    $172 = HEAP32[$171>>2]|0; //@line 133 "HyMES/decrypt.c"
    $173 = (($172) + ($166<<1)|0); //@line 133 "HyMES/decrypt.c"
    HEAP16[$173>>1] = $165; //@line 133 "HyMES/decrypt.c"
    $174 = $j; //@line 132 "HyMES/decrypt.c"
    $175 = (($174) + 1)|0; //@line 132 "HyMES/decrypt.c"
    $j = $175; //@line 132 "HyMES/decrypt.c"
   }
   $176 = $a; //@line 134 "HyMES/decrypt.c"
   $177 = $176&65535; //@line 134 "HyMES/decrypt.c"
   $178 = ($177|0)!=(0); //@line 134 "HyMES/decrypt.c"
   if ($178) {
    $179 = $a; //@line 134 "HyMES/decrypt.c"
    $180 = $179&65535; //@line 134 "HyMES/decrypt.c"
    $181 = HEAP32[5120>>2]|0; //@line 134 "HyMES/decrypt.c"
    $182 = (($181) + ($180<<1)|0); //@line 134 "HyMES/decrypt.c"
    $183 = HEAP16[$182>>1]|0; //@line 134 "HyMES/decrypt.c"
    $184 = $183&65535; //@line 134 "HyMES/decrypt.c"
    $185 = $184 << 1; //@line 134 "HyMES/decrypt.c"
    $186 = HEAP32[5124>>2]|0; //@line 134 "HyMES/decrypt.c"
    $187 = $185 & $186; //@line 134 "HyMES/decrypt.c"
    $188 = $a; //@line 134 "HyMES/decrypt.c"
    $189 = $188&65535; //@line 134 "HyMES/decrypt.c"
    $190 = HEAP32[5120>>2]|0; //@line 134 "HyMES/decrypt.c"
    $191 = (($190) + ($189<<1)|0); //@line 134 "HyMES/decrypt.c"
    $192 = HEAP16[$191>>1]|0; //@line 134 "HyMES/decrypt.c"
    $193 = $192&65535; //@line 134 "HyMES/decrypt.c"
    $194 = $193 << 1; //@line 134 "HyMES/decrypt.c"
    $195 = HEAP32[5128>>2]|0; //@line 134 "HyMES/decrypt.c"
    $196 = $194 >> $195; //@line 134 "HyMES/decrypt.c"
    $197 = (($187) + ($196))|0; //@line 134 "HyMES/decrypt.c"
    $198 = HEAP32[5132>>2]|0; //@line 134 "HyMES/decrypt.c"
    $199 = (($198) + ($197<<1)|0); //@line 134 "HyMES/decrypt.c"
    $200 = HEAP16[$199>>1]|0; //@line 134 "HyMES/decrypt.c"
    $201 = $200&65535; //@line 134 "HyMES/decrypt.c"
    $203 = $201;
   } else {
    $203 = 0;
   }
   $202 = $203&65535; //@line 134 "HyMES/decrypt.c"
   $a = $202; //@line 134 "HyMES/decrypt.c"
   $204 = $i; //@line 131 "HyMES/decrypt.c"
   $205 = (($204) + 1)|0; //@line 131 "HyMES/decrypt.c"
   $i = $205; //@line 131 "HyMES/decrypt.c"
  }
  $206 = $5; //@line 136 "HyMES/decrypt.c"
  $207 = $4; //@line 136 "HyMES/decrypt.c"
  $208 = (($207) + ($206<<2)|0); //@line 136 "HyMES/decrypt.c"
  $209 = HEAP32[$208>>2]|0; //@line 136 "HyMES/decrypt.c"
  (_poly_calcule_deg($209)|0); //@line 136 "HyMES/decrypt.c"
 }
 $210 = $5; //@line 138 "HyMES/decrypt.c"
 $211 = $4; //@line 138 "HyMES/decrypt.c"
 $212 = (($211) + ($210<<2)|0); //@line 138 "HyMES/decrypt.c"
 $213 = HEAP32[$212>>2]|0; //@line 138 "HyMES/decrypt.c"
 $214 = $1; //@line 138 "HyMES/decrypt.c"
 $215 = (_poly_gcd($213,$214)|0); //@line 138 "HyMES/decrypt.c"
 $gcd1 = $215; //@line 138 "HyMES/decrypt.c"
 $216 = $1; //@line 139 "HyMES/decrypt.c"
 $217 = $gcd1; //@line 139 "HyMES/decrypt.c"
 $218 = (_poly_quo($216,$217)|0); //@line 139 "HyMES/decrypt.c"
 $gcd2 = $218; //@line 139 "HyMES/decrypt.c"
 $219 = $gcd1; //@line 141 "HyMES/decrypt.c"
 $220 = HEAP32[$219>>2]|0; //@line 141 "HyMES/decrypt.c"
 $i = $220; //@line 141 "HyMES/decrypt.c"
 $221 = $gcd1; //@line 143 "HyMES/decrypt.c"
 $222 = $i; //@line 143 "HyMES/decrypt.c"
 $223 = $3; //@line 143 "HyMES/decrypt.c"
 $224 = $4; //@line 143 "HyMES/decrypt.c"
 $225 = $5; //@line 143 "HyMES/decrypt.c"
 $226 = (($225) + 1)|0; //@line 143 "HyMES/decrypt.c"
 $227 = $6; //@line 143 "HyMES/decrypt.c"
 $228 = (_roots_berl_aux($221,$222,$223,$224,$226,$227)|0); //@line 143 "HyMES/decrypt.c"
 $j = $228; //@line 143 "HyMES/decrypt.c"
 $229 = $gcd2; //@line 144 "HyMES/decrypt.c"
 $230 = $2; //@line 144 "HyMES/decrypt.c"
 $231 = $i; //@line 144 "HyMES/decrypt.c"
 $232 = (($230) - ($231))|0; //@line 144 "HyMES/decrypt.c"
 $233 = $3; //@line 144 "HyMES/decrypt.c"
 $234 = $4; //@line 144 "HyMES/decrypt.c"
 $235 = $5; //@line 144 "HyMES/decrypt.c"
 $236 = (($235) + 1)|0; //@line 144 "HyMES/decrypt.c"
 $237 = $6; //@line 144 "HyMES/decrypt.c"
 $238 = $j; //@line 144 "HyMES/decrypt.c"
 $239 = (($237) + ($238<<1)|0); //@line 144 "HyMES/decrypt.c"
 $240 = (_roots_berl_aux($229,$232,$233,$234,$236,$239)|0); //@line 144 "HyMES/decrypt.c"
 $241 = $j; //@line 144 "HyMES/decrypt.c"
 $242 = (($241) + ($240))|0; //@line 144 "HyMES/decrypt.c"
 $j = $242; //@line 144 "HyMES/decrypt.c"
 $243 = $gcd1; //@line 146 "HyMES/decrypt.c"
 _poly_free($243); //@line 146 "HyMES/decrypt.c"
 $244 = $gcd2; //@line 147 "HyMES/decrypt.c"
 _poly_free($244); //@line 147 "HyMES/decrypt.c"
 $245 = $j; //@line 149 "HyMES/decrypt.c"
 $0 = $245; //@line 149 "HyMES/decrypt.c"
 $246 = $0; //@line 150 "HyMES/decrypt.c"
 STACKTOP = sp;return ($246|0); //@line 150 "HyMES/decrypt.c"
}
function _roots_berl($sigma,$res) {
 $sigma = $sigma|0;
 $res = $res|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0;
 var $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0;
 var $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0;
 var $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0;
 var $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0;
 var $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $d = 0, $i = 0, $j = 0, $sq_aux = 0, $tr = 0, $tr_aux = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $sigma;
 $1 = $res;
 $2 = (_malloc(240)|0); //@line 157 "HyMES/decrypt.c"
 $sq_aux = $2; //@line 157 "HyMES/decrypt.c"
 $3 = (_malloc(48)|0); //@line 158 "HyMES/decrypt.c"
 $tr_aux = $3; //@line 158 "HyMES/decrypt.c"
 $4 = (_malloc(48)|0); //@line 159 "HyMES/decrypt.c"
 $tr = $4; //@line 159 "HyMES/decrypt.c"
 $i = 0; //@line 160 "HyMES/decrypt.c"
 while(1) {
  $5 = $i; //@line 160 "HyMES/decrypt.c"
  $6 = ($5|0)<(60); //@line 160 "HyMES/decrypt.c"
  if (!($6)) {
   break;
  }
  $7 = (_poly_alloc(61)|0); //@line 161 "HyMES/decrypt.c"
  $8 = $i; //@line 161 "HyMES/decrypt.c"
  $9 = $sq_aux; //@line 161 "HyMES/decrypt.c"
  $10 = (($9) + ($8<<2)|0); //@line 161 "HyMES/decrypt.c"
  HEAP32[$10>>2] = $7; //@line 161 "HyMES/decrypt.c"
  $11 = $i; //@line 160 "HyMES/decrypt.c"
  $12 = (($11) + 1)|0; //@line 160 "HyMES/decrypt.c"
  $i = $12; //@line 160 "HyMES/decrypt.c"
 }
 $i = 0; //@line 162 "HyMES/decrypt.c"
 while(1) {
  $13 = $i; //@line 162 "HyMES/decrypt.c"
  $14 = ($13|0)<(12); //@line 162 "HyMES/decrypt.c"
  if (!($14)) {
   break;
  }
  $15 = (_poly_alloc(59)|0); //@line 163 "HyMES/decrypt.c"
  $16 = $i; //@line 163 "HyMES/decrypt.c"
  $17 = $tr_aux; //@line 163 "HyMES/decrypt.c"
  $18 = (($17) + ($16<<2)|0); //@line 163 "HyMES/decrypt.c"
  HEAP32[$18>>2] = $15; //@line 163 "HyMES/decrypt.c"
  $19 = $i; //@line 162 "HyMES/decrypt.c"
  $20 = (($19) + 1)|0; //@line 162 "HyMES/decrypt.c"
  $i = $20; //@line 162 "HyMES/decrypt.c"
 }
 $i = 0; //@line 164 "HyMES/decrypt.c"
 while(1) {
  $21 = $i; //@line 164 "HyMES/decrypt.c"
  $22 = ($21|0)<(12); //@line 164 "HyMES/decrypt.c"
  if (!($22)) {
   break;
  }
  $23 = $i; //@line 165 "HyMES/decrypt.c"
  $24 = $tr; //@line 165 "HyMES/decrypt.c"
  $25 = (($24) + ($23<<2)|0); //@line 165 "HyMES/decrypt.c"
  HEAP32[$25>>2] = 0; //@line 165 "HyMES/decrypt.c"
  $26 = $i; //@line 164 "HyMES/decrypt.c"
  $27 = (($26) + 1)|0; //@line 164 "HyMES/decrypt.c"
  $i = $27; //@line 164 "HyMES/decrypt.c"
 }
 $28 = $0; //@line 167 "HyMES/decrypt.c"
 $29 = $sq_aux; //@line 167 "HyMES/decrypt.c"
 _poly_sqmod_init($28,$29); //@line 167 "HyMES/decrypt.c"
 $30 = $tr_aux; //@line 168 "HyMES/decrypt.c"
 $31 = HEAP32[$30>>2]|0; //@line 168 "HyMES/decrypt.c"
 $32 = ((($31)) + 8|0); //@line 168 "HyMES/decrypt.c"
 $33 = HEAP32[$32>>2]|0; //@line 168 "HyMES/decrypt.c"
 $34 = ((($33)) + 2|0); //@line 168 "HyMES/decrypt.c"
 HEAP16[$34>>1] = 1; //@line 168 "HyMES/decrypt.c"
 $35 = $tr_aux; //@line 169 "HyMES/decrypt.c"
 $36 = HEAP32[$35>>2]|0; //@line 169 "HyMES/decrypt.c"
 HEAP32[$36>>2] = 1; //@line 169 "HyMES/decrypt.c"
 $37 = (_poly_alloc(59)|0); //@line 170 "HyMES/decrypt.c"
 $38 = $tr; //@line 170 "HyMES/decrypt.c"
 HEAP32[$38>>2] = $37; //@line 170 "HyMES/decrypt.c"
 $39 = $tr; //@line 171 "HyMES/decrypt.c"
 $40 = HEAP32[$39>>2]|0; //@line 171 "HyMES/decrypt.c"
 $41 = ((($40)) + 8|0); //@line 171 "HyMES/decrypt.c"
 $42 = HEAP32[$41>>2]|0; //@line 171 "HyMES/decrypt.c"
 $43 = ((($42)) + 2|0); //@line 171 "HyMES/decrypt.c"
 HEAP16[$43>>1] = 1; //@line 171 "HyMES/decrypt.c"
 $i = 1; //@line 172 "HyMES/decrypt.c"
 while(1) {
  $44 = $i; //@line 172 "HyMES/decrypt.c"
  $45 = ($44|0)<(12); //@line 172 "HyMES/decrypt.c"
  if (!($45)) {
   break;
  }
  $46 = $i; //@line 173 "HyMES/decrypt.c"
  $47 = $tr_aux; //@line 173 "HyMES/decrypt.c"
  $48 = (($47) + ($46<<2)|0); //@line 173 "HyMES/decrypt.c"
  $49 = HEAP32[$48>>2]|0; //@line 173 "HyMES/decrypt.c"
  $50 = $i; //@line 173 "HyMES/decrypt.c"
  $51 = (($50) - 1)|0; //@line 173 "HyMES/decrypt.c"
  $52 = $tr_aux; //@line 173 "HyMES/decrypt.c"
  $53 = (($52) + ($51<<2)|0); //@line 173 "HyMES/decrypt.c"
  $54 = HEAP32[$53>>2]|0; //@line 173 "HyMES/decrypt.c"
  $55 = $sq_aux; //@line 173 "HyMES/decrypt.c"
  _poly_sqmod($49,$54,$55,60); //@line 173 "HyMES/decrypt.c"
  $j = 0; //@line 174 "HyMES/decrypt.c"
  while(1) {
   $56 = $j; //@line 174 "HyMES/decrypt.c"
   $57 = ($56|0)<(60); //@line 174 "HyMES/decrypt.c"
   if (!($57)) {
    break;
   }
   $58 = $j; //@line 175 "HyMES/decrypt.c"
   $59 = $tr; //@line 175 "HyMES/decrypt.c"
   $60 = HEAP32[$59>>2]|0; //@line 175 "HyMES/decrypt.c"
   $61 = ((($60)) + 8|0); //@line 175 "HyMES/decrypt.c"
   $62 = HEAP32[$61>>2]|0; //@line 175 "HyMES/decrypt.c"
   $63 = (($62) + ($58<<1)|0); //@line 175 "HyMES/decrypt.c"
   $64 = HEAP16[$63>>1]|0; //@line 175 "HyMES/decrypt.c"
   $65 = $64&65535; //@line 175 "HyMES/decrypt.c"
   $66 = $j; //@line 175 "HyMES/decrypt.c"
   $67 = $i; //@line 175 "HyMES/decrypt.c"
   $68 = $tr_aux; //@line 175 "HyMES/decrypt.c"
   $69 = (($68) + ($67<<2)|0); //@line 175 "HyMES/decrypt.c"
   $70 = HEAP32[$69>>2]|0; //@line 175 "HyMES/decrypt.c"
   $71 = ((($70)) + 8|0); //@line 175 "HyMES/decrypt.c"
   $72 = HEAP32[$71>>2]|0; //@line 175 "HyMES/decrypt.c"
   $73 = (($72) + ($66<<1)|0); //@line 175 "HyMES/decrypt.c"
   $74 = HEAP16[$73>>1]|0; //@line 175 "HyMES/decrypt.c"
   $75 = $74&65535; //@line 175 "HyMES/decrypt.c"
   $76 = $65 ^ $75; //@line 175 "HyMES/decrypt.c"
   $77 = $76&65535; //@line 175 "HyMES/decrypt.c"
   $78 = $j; //@line 175 "HyMES/decrypt.c"
   $79 = $tr; //@line 175 "HyMES/decrypt.c"
   $80 = HEAP32[$79>>2]|0; //@line 175 "HyMES/decrypt.c"
   $81 = ((($80)) + 8|0); //@line 175 "HyMES/decrypt.c"
   $82 = HEAP32[$81>>2]|0; //@line 175 "HyMES/decrypt.c"
   $83 = (($82) + ($78<<1)|0); //@line 175 "HyMES/decrypt.c"
   HEAP16[$83>>1] = $77; //@line 175 "HyMES/decrypt.c"
   $84 = $j; //@line 174 "HyMES/decrypt.c"
   $85 = (($84) + 1)|0; //@line 174 "HyMES/decrypt.c"
   $j = $85; //@line 174 "HyMES/decrypt.c"
  }
  $86 = $i; //@line 172 "HyMES/decrypt.c"
  $87 = (($86) + 1)|0; //@line 172 "HyMES/decrypt.c"
  $i = $87; //@line 172 "HyMES/decrypt.c"
 }
 $88 = $tr; //@line 177 "HyMES/decrypt.c"
 $89 = HEAP32[$88>>2]|0; //@line 177 "HyMES/decrypt.c"
 (_poly_calcule_deg($89)|0); //@line 177 "HyMES/decrypt.c"
 $i = 0; //@line 178 "HyMES/decrypt.c"
 while(1) {
  $90 = $i; //@line 178 "HyMES/decrypt.c"
  $91 = ($90|0)<(60); //@line 178 "HyMES/decrypt.c"
  if (!($91)) {
   break;
  }
  $92 = $i; //@line 179 "HyMES/decrypt.c"
  $93 = $sq_aux; //@line 179 "HyMES/decrypt.c"
  $94 = (($93) + ($92<<2)|0); //@line 179 "HyMES/decrypt.c"
  $95 = HEAP32[$94>>2]|0; //@line 179 "HyMES/decrypt.c"
  _poly_free($95); //@line 179 "HyMES/decrypt.c"
  $96 = $i; //@line 178 "HyMES/decrypt.c"
  $97 = (($96) + 1)|0; //@line 178 "HyMES/decrypt.c"
  $i = $97; //@line 178 "HyMES/decrypt.c"
 }
 $98 = $sq_aux; //@line 180 "HyMES/decrypt.c"
 _free($98); //@line 180 "HyMES/decrypt.c"
 $99 = $0; //@line 181 "HyMES/decrypt.c"
 $100 = $tr_aux; //@line 181 "HyMES/decrypt.c"
 $101 = $tr; //@line 181 "HyMES/decrypt.c"
 $102 = $1; //@line 181 "HyMES/decrypt.c"
 $103 = (_roots_berl_aux($99,60,$100,$101,0,$102)|0); //@line 181 "HyMES/decrypt.c"
 $d = $103; //@line 181 "HyMES/decrypt.c"
 $i = 0; //@line 182 "HyMES/decrypt.c"
 while(1) {
  $104 = $i; //@line 182 "HyMES/decrypt.c"
  $105 = ($104|0)<(12); //@line 182 "HyMES/decrypt.c"
  if (!($105)) {
   break;
  }
  $106 = $i; //@line 183 "HyMES/decrypt.c"
  $107 = $tr_aux; //@line 183 "HyMES/decrypt.c"
  $108 = (($107) + ($106<<2)|0); //@line 183 "HyMES/decrypt.c"
  $109 = HEAP32[$108>>2]|0; //@line 183 "HyMES/decrypt.c"
  _poly_free($109); //@line 183 "HyMES/decrypt.c"
  $110 = $i; //@line 182 "HyMES/decrypt.c"
  $111 = (($110) + 1)|0; //@line 182 "HyMES/decrypt.c"
  $i = $111; //@line 182 "HyMES/decrypt.c"
 }
 $112 = $tr_aux; //@line 184 "HyMES/decrypt.c"
 _free($112); //@line 184 "HyMES/decrypt.c"
 $i = 0; //@line 185 "HyMES/decrypt.c"
 while(1) {
  $113 = $i; //@line 185 "HyMES/decrypt.c"
  $114 = ($113|0)<(12); //@line 185 "HyMES/decrypt.c"
  if (!($114)) {
   break;
  }
  $115 = $i; //@line 186 "HyMES/decrypt.c"
  $116 = $tr; //@line 186 "HyMES/decrypt.c"
  $117 = (($116) + ($115<<2)|0); //@line 186 "HyMES/decrypt.c"
  $118 = HEAP32[$117>>2]|0; //@line 186 "HyMES/decrypt.c"
  $119 = ($118|0)!=(0|0); //@line 186 "HyMES/decrypt.c"
  if ($119) {
   $120 = $i; //@line 187 "HyMES/decrypt.c"
   $121 = $tr; //@line 187 "HyMES/decrypt.c"
   $122 = (($121) + ($120<<2)|0); //@line 187 "HyMES/decrypt.c"
   $123 = HEAP32[$122>>2]|0; //@line 187 "HyMES/decrypt.c"
   _poly_free($123); //@line 187 "HyMES/decrypt.c"
  }
  $124 = $i; //@line 185 "HyMES/decrypt.c"
  $125 = (($124) + 1)|0; //@line 185 "HyMES/decrypt.c"
  $i = $125; //@line 185 "HyMES/decrypt.c"
 }
 $126 = $tr; //@line 188 "HyMES/decrypt.c"
 _free($126); //@line 188 "HyMES/decrypt.c"
 $127 = $d; //@line 190 "HyMES/decrypt.c"
 STACKTOP = sp;return ($127|0); //@line 190 "HyMES/decrypt.c"
}
function _partition($tableau,$gauche,$droite,$pivot) {
 $tableau = $tableau|0;
 $gauche = $gauche|0;
 $droite = $droite|0;
 $pivot = $pivot|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, $temp = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $tableau;
 $1 = $gauche;
 $2 = $droite;
 $3 = $pivot;
 $4 = $1; //@line 195 "HyMES/decrypt.c"
 $i = $4; //@line 195 "HyMES/decrypt.c"
 while(1) {
  $5 = $i; //@line 195 "HyMES/decrypt.c"
  $6 = $2; //@line 195 "HyMES/decrypt.c"
  $7 = ($5|0)<($6|0); //@line 195 "HyMES/decrypt.c"
  if (!($7)) {
   break;
  }
  $8 = $i; //@line 196 "HyMES/decrypt.c"
  $9 = $0; //@line 196 "HyMES/decrypt.c"
  $10 = (($9) + ($8<<2)|0); //@line 196 "HyMES/decrypt.c"
  $11 = HEAP32[$10>>2]|0; //@line 196 "HyMES/decrypt.c"
  $12 = $3; //@line 196 "HyMES/decrypt.c"
  $13 = ($11|0)<=($12|0); //@line 196 "HyMES/decrypt.c"
  if ($13) {
   $14 = $i; //@line 197 "HyMES/decrypt.c"
   $15 = $0; //@line 197 "HyMES/decrypt.c"
   $16 = (($15) + ($14<<2)|0); //@line 197 "HyMES/decrypt.c"
   $17 = HEAP32[$16>>2]|0; //@line 197 "HyMES/decrypt.c"
   $temp = $17; //@line 197 "HyMES/decrypt.c"
   $18 = $1; //@line 198 "HyMES/decrypt.c"
   $19 = $0; //@line 198 "HyMES/decrypt.c"
   $20 = (($19) + ($18<<2)|0); //@line 198 "HyMES/decrypt.c"
   $21 = HEAP32[$20>>2]|0; //@line 198 "HyMES/decrypt.c"
   $22 = $i; //@line 198 "HyMES/decrypt.c"
   $23 = $0; //@line 198 "HyMES/decrypt.c"
   $24 = (($23) + ($22<<2)|0); //@line 198 "HyMES/decrypt.c"
   HEAP32[$24>>2] = $21; //@line 198 "HyMES/decrypt.c"
   $25 = $temp; //@line 199 "HyMES/decrypt.c"
   $26 = $1; //@line 199 "HyMES/decrypt.c"
   $27 = $0; //@line 199 "HyMES/decrypt.c"
   $28 = (($27) + ($26<<2)|0); //@line 199 "HyMES/decrypt.c"
   HEAP32[$28>>2] = $25; //@line 199 "HyMES/decrypt.c"
   $29 = $1; //@line 200 "HyMES/decrypt.c"
   $30 = (($29) + 1)|0; //@line 200 "HyMES/decrypt.c"
   $1 = $30; //@line 200 "HyMES/decrypt.c"
  }
  $31 = $i; //@line 195 "HyMES/decrypt.c"
  $32 = (($31) + 1)|0; //@line 195 "HyMES/decrypt.c"
  $i = $32; //@line 195 "HyMES/decrypt.c"
 }
 $33 = $1; //@line 202 "HyMES/decrypt.c"
 STACKTOP = sp;return ($33|0); //@line 202 "HyMES/decrypt.c"
}
function _quickSort($tableau,$gauche,$droite,$min,$max) {
 $tableau = $tableau|0;
 $gauche = $gauche|0;
 $droite = $droite|0;
 $min = $min|0;
 $max = $max|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $milieu = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $tableau;
 $1 = $gauche;
 $2 = $droite;
 $3 = $min;
 $4 = $max;
 $5 = $1; //@line 206 "HyMES/decrypt.c"
 $6 = $2; //@line 206 "HyMES/decrypt.c"
 $7 = (($6) - 1)|0; //@line 206 "HyMES/decrypt.c"
 $8 = ($5|0)<($7|0); //@line 206 "HyMES/decrypt.c"
 if (!($8)) {
  STACKTOP = sp;return; //@line 211 "HyMES/decrypt.c"
 }
 $9 = $0; //@line 207 "HyMES/decrypt.c"
 $10 = $1; //@line 207 "HyMES/decrypt.c"
 $11 = $2; //@line 207 "HyMES/decrypt.c"
 $12 = $4; //@line 207 "HyMES/decrypt.c"
 $13 = $3; //@line 207 "HyMES/decrypt.c"
 $14 = (($12) + ($13))|0; //@line 207 "HyMES/decrypt.c"
 $15 = (($14|0) / 2)&-1; //@line 207 "HyMES/decrypt.c"
 $16 = (_partition($9,$10,$11,$15)|0); //@line 207 "HyMES/decrypt.c"
 $milieu = $16; //@line 207 "HyMES/decrypt.c"
 $17 = $0; //@line 208 "HyMES/decrypt.c"
 $18 = $1; //@line 208 "HyMES/decrypt.c"
 $19 = $milieu; //@line 208 "HyMES/decrypt.c"
 $20 = $3; //@line 208 "HyMES/decrypt.c"
 $21 = $4; //@line 208 "HyMES/decrypt.c"
 $22 = $3; //@line 208 "HyMES/decrypt.c"
 $23 = (($21) + ($22))|0; //@line 208 "HyMES/decrypt.c"
 $24 = (($23|0) / 2)&-1; //@line 208 "HyMES/decrypt.c"
 _quickSort($17,$18,$19,$20,$24); //@line 208 "HyMES/decrypt.c"
 $25 = $0; //@line 209 "HyMES/decrypt.c"
 $26 = $milieu; //@line 209 "HyMES/decrypt.c"
 $27 = $2; //@line 209 "HyMES/decrypt.c"
 $28 = $4; //@line 209 "HyMES/decrypt.c"
 $29 = $3; //@line 209 "HyMES/decrypt.c"
 $30 = (($28) + ($29))|0; //@line 209 "HyMES/decrypt.c"
 $31 = (($30|0) / 2)&-1; //@line 209 "HyMES/decrypt.c"
 $32 = $4; //@line 209 "HyMES/decrypt.c"
 _quickSort($25,$26,$27,$31,$32); //@line 209 "HyMES/decrypt.c"
 STACKTOP = sp;return; //@line 211 "HyMES/decrypt.c"
}
function _decode($b,$e) {
 $b = $b|0;
 $e = $e|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0;
 var $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0;
 var $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0;
 var $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0;
 var $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0;
 var $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0;
 var $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0;
 var $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0;
 var $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0, $348 = 0, $349 = 0, $35 = 0;
 var $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = 0, $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0, $365 = 0, $366 = 0, $367 = 0, $368 = 0;
 var $369 = 0, $37 = 0, $370 = 0, $371 = 0, $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0, $383 = 0, $384 = 0, $385 = 0, $386 = 0;
 var $387 = 0, $388 = 0, $389 = 0, $39 = 0, $390 = 0, $391 = 0, $392 = 0, $393 = 0, $394 = 0, $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0, $40 = 0, $400 = 0, $401 = 0, $402 = 0, $403 = 0;
 var $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0;
 var $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0;
 var $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0;
 var $96 = 0, $97 = 0, $98 = 0, $99 = 0, $R = 0, $S = 0, $a = 0, $aux = 0, $d = 0, $h = 0, $i = 0, $j = 0, $res = 0, $sigma = 0, $u = 0, $v = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 192|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $u = sp + 24|0;
 $v = sp + 20|0;
 $h = sp + 16|0;
 $aux = sp;
 $res = sp + 56|0;
 $1 = $b;
 $2 = $e;
 (_gf_init(12)|0); //@line 219 "HyMES/decrypt.c"
 $3 = $1; //@line 220 "HyMES/decrypt.c"
 $4 = (_syndrome($3)|0); //@line 220 "HyMES/decrypt.c"
 $R = $4; //@line 220 "HyMES/decrypt.c"
 $5 = $R; //@line 226 "HyMES/decrypt.c"
 $6 = HEAP32[4876>>2]|0; //@line 226 "HyMES/decrypt.c"
 _poly_eeaux($h,$aux,$5,$6,1); //@line 226 "HyMES/decrypt.c"
 $7 = HEAP32[5124>>2]|0; //@line 227 "HyMES/decrypt.c"
 $8 = HEAP32[$aux>>2]|0; //@line 227 "HyMES/decrypt.c"
 $9 = ((($8)) + 8|0); //@line 227 "HyMES/decrypt.c"
 $10 = HEAP32[$9>>2]|0; //@line 227 "HyMES/decrypt.c"
 $11 = HEAP16[$10>>1]|0; //@line 227 "HyMES/decrypt.c"
 $12 = $11&65535; //@line 227 "HyMES/decrypt.c"
 $13 = HEAP32[5120>>2]|0; //@line 227 "HyMES/decrypt.c"
 $14 = (($13) + ($12<<1)|0); //@line 227 "HyMES/decrypt.c"
 $15 = HEAP16[$14>>1]|0; //@line 227 "HyMES/decrypt.c"
 $16 = $15&65535; //@line 227 "HyMES/decrypt.c"
 $17 = (($7) - ($16))|0; //@line 227 "HyMES/decrypt.c"
 $18 = HEAP32[5132>>2]|0; //@line 227 "HyMES/decrypt.c"
 $19 = (($18) + ($17<<1)|0); //@line 227 "HyMES/decrypt.c"
 $20 = HEAP16[$19>>1]|0; //@line 227 "HyMES/decrypt.c"
 $a = $20; //@line 227 "HyMES/decrypt.c"
 $i = 0; //@line 228 "HyMES/decrypt.c"
 while(1) {
  $21 = $i; //@line 228 "HyMES/decrypt.c"
  $22 = HEAP32[$h>>2]|0; //@line 228 "HyMES/decrypt.c"
  $23 = HEAP32[$22>>2]|0; //@line 228 "HyMES/decrypt.c"
  $24 = ($21|0)<=($23|0); //@line 228 "HyMES/decrypt.c"
  if (!($24)) {
   break;
  }
  $25 = $i; //@line 229 "HyMES/decrypt.c"
  $26 = HEAP32[$h>>2]|0; //@line 229 "HyMES/decrypt.c"
  $27 = ((($26)) + 8|0); //@line 229 "HyMES/decrypt.c"
  $28 = HEAP32[$27>>2]|0; //@line 229 "HyMES/decrypt.c"
  $29 = (($28) + ($25<<1)|0); //@line 229 "HyMES/decrypt.c"
  $30 = HEAP16[$29>>1]|0; //@line 229 "HyMES/decrypt.c"
  $31 = $30&65535; //@line 229 "HyMES/decrypt.c"
  $32 = ($31|0)!=(0); //@line 229 "HyMES/decrypt.c"
  if ($32) {
   $33 = $a; //@line 229 "HyMES/decrypt.c"
   $34 = $33&65535; //@line 229 "HyMES/decrypt.c"
   $35 = HEAP32[5120>>2]|0; //@line 229 "HyMES/decrypt.c"
   $36 = (($35) + ($34<<1)|0); //@line 229 "HyMES/decrypt.c"
   $37 = HEAP16[$36>>1]|0; //@line 229 "HyMES/decrypt.c"
   $38 = $37&65535; //@line 229 "HyMES/decrypt.c"
   $39 = $i; //@line 229 "HyMES/decrypt.c"
   $40 = HEAP32[$h>>2]|0; //@line 229 "HyMES/decrypt.c"
   $41 = ((($40)) + 8|0); //@line 229 "HyMES/decrypt.c"
   $42 = HEAP32[$41>>2]|0; //@line 229 "HyMES/decrypt.c"
   $43 = (($42) + ($39<<1)|0); //@line 229 "HyMES/decrypt.c"
   $44 = HEAP16[$43>>1]|0; //@line 229 "HyMES/decrypt.c"
   $45 = $44&65535; //@line 229 "HyMES/decrypt.c"
   $46 = HEAP32[5120>>2]|0; //@line 229 "HyMES/decrypt.c"
   $47 = (($46) + ($45<<1)|0); //@line 229 "HyMES/decrypt.c"
   $48 = HEAP16[$47>>1]|0; //@line 229 "HyMES/decrypt.c"
   $49 = $48&65535; //@line 229 "HyMES/decrypt.c"
   $50 = (($38) + ($49))|0; //@line 229 "HyMES/decrypt.c"
   $51 = HEAP32[5124>>2]|0; //@line 229 "HyMES/decrypt.c"
   $52 = $50 & $51; //@line 229 "HyMES/decrypt.c"
   $53 = $a; //@line 229 "HyMES/decrypt.c"
   $54 = $53&65535; //@line 229 "HyMES/decrypt.c"
   $55 = HEAP32[5120>>2]|0; //@line 229 "HyMES/decrypt.c"
   $56 = (($55) + ($54<<1)|0); //@line 229 "HyMES/decrypt.c"
   $57 = HEAP16[$56>>1]|0; //@line 229 "HyMES/decrypt.c"
   $58 = $57&65535; //@line 229 "HyMES/decrypt.c"
   $59 = $i; //@line 229 "HyMES/decrypt.c"
   $60 = HEAP32[$h>>2]|0; //@line 229 "HyMES/decrypt.c"
   $61 = ((($60)) + 8|0); //@line 229 "HyMES/decrypt.c"
   $62 = HEAP32[$61>>2]|0; //@line 229 "HyMES/decrypt.c"
   $63 = (($62) + ($59<<1)|0); //@line 229 "HyMES/decrypt.c"
   $64 = HEAP16[$63>>1]|0; //@line 229 "HyMES/decrypt.c"
   $65 = $64&65535; //@line 229 "HyMES/decrypt.c"
   $66 = HEAP32[5120>>2]|0; //@line 229 "HyMES/decrypt.c"
   $67 = (($66) + ($65<<1)|0); //@line 229 "HyMES/decrypt.c"
   $68 = HEAP16[$67>>1]|0; //@line 229 "HyMES/decrypt.c"
   $69 = $68&65535; //@line 229 "HyMES/decrypt.c"
   $70 = (($58) + ($69))|0; //@line 229 "HyMES/decrypt.c"
   $71 = HEAP32[5128>>2]|0; //@line 229 "HyMES/decrypt.c"
   $72 = $70 >> $71; //@line 229 "HyMES/decrypt.c"
   $73 = (($52) + ($72))|0; //@line 229 "HyMES/decrypt.c"
   $74 = HEAP32[5132>>2]|0; //@line 229 "HyMES/decrypt.c"
   $75 = (($74) + ($73<<1)|0); //@line 229 "HyMES/decrypt.c"
   $76 = HEAP16[$75>>1]|0; //@line 229 "HyMES/decrypt.c"
   $77 = $76&65535; //@line 229 "HyMES/decrypt.c"
   $79 = $77;
  } else {
   $79 = 0;
  }
  $78 = $79&65535; //@line 229 "HyMES/decrypt.c"
  $80 = $i; //@line 229 "HyMES/decrypt.c"
  $81 = HEAP32[$h>>2]|0; //@line 229 "HyMES/decrypt.c"
  $82 = ((($81)) + 8|0); //@line 229 "HyMES/decrypt.c"
  $83 = HEAP32[$82>>2]|0; //@line 229 "HyMES/decrypt.c"
  $84 = (($83) + ($80<<1)|0); //@line 229 "HyMES/decrypt.c"
  HEAP16[$84>>1] = $78; //@line 229 "HyMES/decrypt.c"
  $85 = $i; //@line 228 "HyMES/decrypt.c"
  $86 = (($85) + 1)|0; //@line 228 "HyMES/decrypt.c"
  $i = $86; //@line 228 "HyMES/decrypt.c"
 }
 $87 = HEAP32[$aux>>2]|0; //@line 230 "HyMES/decrypt.c"
 _poly_free($87); //@line 230 "HyMES/decrypt.c"
 $88 = $R; //@line 231 "HyMES/decrypt.c"
 _poly_free($88); //@line 231 "HyMES/decrypt.c"
 $89 = HEAP32[$h>>2]|0; //@line 234 "HyMES/decrypt.c"
 $90 = ((($89)) + 8|0); //@line 234 "HyMES/decrypt.c"
 $91 = HEAP32[$90>>2]|0; //@line 234 "HyMES/decrypt.c"
 $92 = ((($91)) + 2|0); //@line 234 "HyMES/decrypt.c"
 $93 = HEAP16[$92>>1]|0; //@line 234 "HyMES/decrypt.c"
 $94 = $93&65535; //@line 234 "HyMES/decrypt.c"
 $95 = $94 ^ 1; //@line 234 "HyMES/decrypt.c"
 $96 = $95&65535; //@line 234 "HyMES/decrypt.c"
 $97 = HEAP32[$h>>2]|0; //@line 234 "HyMES/decrypt.c"
 $98 = ((($97)) + 8|0); //@line 234 "HyMES/decrypt.c"
 $99 = HEAP32[$98>>2]|0; //@line 234 "HyMES/decrypt.c"
 $100 = ((($99)) + 2|0); //@line 234 "HyMES/decrypt.c"
 HEAP16[$100>>1] = $96; //@line 234 "HyMES/decrypt.c"
 $101 = (_poly_alloc(59)|0); //@line 237 "HyMES/decrypt.c"
 $S = $101; //@line 237 "HyMES/decrypt.c"
 $i = 0; //@line 238 "HyMES/decrypt.c"
 while(1) {
  $102 = $i; //@line 238 "HyMES/decrypt.c"
  $103 = ($102|0)<(60); //@line 238 "HyMES/decrypt.c"
  if (!($103)) {
   break;
  }
  $104 = $i; //@line 239 "HyMES/decrypt.c"
  $105 = HEAP32[$h>>2]|0; //@line 239 "HyMES/decrypt.c"
  $106 = ((($105)) + 8|0); //@line 239 "HyMES/decrypt.c"
  $107 = HEAP32[$106>>2]|0; //@line 239 "HyMES/decrypt.c"
  $108 = (($107) + ($104<<1)|0); //@line 239 "HyMES/decrypt.c"
  $109 = HEAP16[$108>>1]|0; //@line 239 "HyMES/decrypt.c"
  $110 = $109&65535; //@line 239 "HyMES/decrypt.c"
  $111 = ($110|0)!=(0); //@line 239 "HyMES/decrypt.c"
  if ($111) {
   $112 = $i; //@line 239 "HyMES/decrypt.c"
   $113 = HEAP32[$h>>2]|0; //@line 239 "HyMES/decrypt.c"
   $114 = ((($113)) + 8|0); //@line 239 "HyMES/decrypt.c"
   $115 = HEAP32[$114>>2]|0; //@line 239 "HyMES/decrypt.c"
   $116 = (($115) + ($112<<1)|0); //@line 239 "HyMES/decrypt.c"
   $117 = HEAP16[$116>>1]|0; //@line 239 "HyMES/decrypt.c"
   $118 = $117&65535; //@line 239 "HyMES/decrypt.c"
   $119 = HEAP32[5120>>2]|0; //@line 239 "HyMES/decrypt.c"
   $120 = (($119) + ($118<<1)|0); //@line 239 "HyMES/decrypt.c"
   $121 = HEAP16[$120>>1]|0; //@line 239 "HyMES/decrypt.c"
   $122 = $121&65535; //@line 239 "HyMES/decrypt.c"
   $123 = HEAP32[5128>>2]|0; //@line 239 "HyMES/decrypt.c"
   $124 = (($123) - 1)|0; //@line 239 "HyMES/decrypt.c"
   $125 = $122 << $124; //@line 239 "HyMES/decrypt.c"
   $126 = HEAP32[5124>>2]|0; //@line 239 "HyMES/decrypt.c"
   $127 = $125 & $126; //@line 239 "HyMES/decrypt.c"
   $128 = $i; //@line 239 "HyMES/decrypt.c"
   $129 = HEAP32[$h>>2]|0; //@line 239 "HyMES/decrypt.c"
   $130 = ((($129)) + 8|0); //@line 239 "HyMES/decrypt.c"
   $131 = HEAP32[$130>>2]|0; //@line 239 "HyMES/decrypt.c"
   $132 = (($131) + ($128<<1)|0); //@line 239 "HyMES/decrypt.c"
   $133 = HEAP16[$132>>1]|0; //@line 239 "HyMES/decrypt.c"
   $134 = $133&65535; //@line 239 "HyMES/decrypt.c"
   $135 = HEAP32[5120>>2]|0; //@line 239 "HyMES/decrypt.c"
   $136 = (($135) + ($134<<1)|0); //@line 239 "HyMES/decrypt.c"
   $137 = HEAP16[$136>>1]|0; //@line 239 "HyMES/decrypt.c"
   $138 = $137&65535; //@line 239 "HyMES/decrypt.c"
   $139 = HEAP32[5128>>2]|0; //@line 239 "HyMES/decrypt.c"
   $140 = (($139) - 1)|0; //@line 239 "HyMES/decrypt.c"
   $141 = $138 << $140; //@line 239 "HyMES/decrypt.c"
   $142 = HEAP32[5128>>2]|0; //@line 239 "HyMES/decrypt.c"
   $143 = $141 >> $142; //@line 239 "HyMES/decrypt.c"
   $144 = (($127) + ($143))|0; //@line 239 "HyMES/decrypt.c"
   $145 = HEAP32[5132>>2]|0; //@line 239 "HyMES/decrypt.c"
   $146 = (($145) + ($144<<1)|0); //@line 239 "HyMES/decrypt.c"
   $147 = HEAP16[$146>>1]|0; //@line 239 "HyMES/decrypt.c"
   $148 = $147&65535; //@line 239 "HyMES/decrypt.c"
   $150 = $148;
  } else {
   $150 = 0;
  }
  $149 = $150&65535; //@line 239 "HyMES/decrypt.c"
  $a = $149; //@line 239 "HyMES/decrypt.c"
  $151 = $a; //@line 240 "HyMES/decrypt.c"
  $152 = $151&65535; //@line 240 "HyMES/decrypt.c"
  $153 = ($152|0)!=(0); //@line 240 "HyMES/decrypt.c"
  L14: do {
   if ($153) {
    $154 = $i; //@line 241 "HyMES/decrypt.c"
    $155 = $154 & 1; //@line 241 "HyMES/decrypt.c"
    $156 = ($155|0)!=(0); //@line 241 "HyMES/decrypt.c"
    if (!($156)) {
     $235 = $i; //@line 246 "HyMES/decrypt.c"
     $236 = (($235|0) / 2)&-1; //@line 246 "HyMES/decrypt.c"
     $237 = $S; //@line 246 "HyMES/decrypt.c"
     $238 = ((($237)) + 8|0); //@line 246 "HyMES/decrypt.c"
     $239 = HEAP32[$238>>2]|0; //@line 246 "HyMES/decrypt.c"
     $240 = (($239) + ($236<<1)|0); //@line 246 "HyMES/decrypt.c"
     $241 = HEAP16[$240>>1]|0; //@line 246 "HyMES/decrypt.c"
     $242 = $241&65535; //@line 246 "HyMES/decrypt.c"
     $243 = $a; //@line 246 "HyMES/decrypt.c"
     $244 = $243&65535; //@line 246 "HyMES/decrypt.c"
     $245 = $242 ^ $244; //@line 246 "HyMES/decrypt.c"
     $246 = $245&65535; //@line 246 "HyMES/decrypt.c"
     $247 = $i; //@line 246 "HyMES/decrypt.c"
     $248 = (($247|0) / 2)&-1; //@line 246 "HyMES/decrypt.c"
     $249 = $S; //@line 246 "HyMES/decrypt.c"
     $250 = ((($249)) + 8|0); //@line 246 "HyMES/decrypt.c"
     $251 = HEAP32[$250>>2]|0; //@line 246 "HyMES/decrypt.c"
     $252 = (($251) + ($248<<1)|0); //@line 246 "HyMES/decrypt.c"
     HEAP16[$252>>1] = $246; //@line 246 "HyMES/decrypt.c"
     break;
    }
    $j = 0; //@line 242 "HyMES/decrypt.c"
    while(1) {
     $157 = $j; //@line 242 "HyMES/decrypt.c"
     $158 = ($157|0)<(60); //@line 242 "HyMES/decrypt.c"
     if (!($158)) {
      break L14;
     }
     $159 = $j; //@line 243 "HyMES/decrypt.c"
     $160 = $S; //@line 243 "HyMES/decrypt.c"
     $161 = ((($160)) + 8|0); //@line 243 "HyMES/decrypt.c"
     $162 = HEAP32[$161>>2]|0; //@line 243 "HyMES/decrypt.c"
     $163 = (($162) + ($159<<1)|0); //@line 243 "HyMES/decrypt.c"
     $164 = HEAP16[$163>>1]|0; //@line 243 "HyMES/decrypt.c"
     $165 = $164&65535; //@line 243 "HyMES/decrypt.c"
     $166 = $j; //@line 243 "HyMES/decrypt.c"
     $167 = $i; //@line 243 "HyMES/decrypt.c"
     $168 = (4880 + ($167<<2)|0); //@line 243 "HyMES/decrypt.c"
     $169 = HEAP32[$168>>2]|0; //@line 243 "HyMES/decrypt.c"
     $170 = ((($169)) + 8|0); //@line 243 "HyMES/decrypt.c"
     $171 = HEAP32[$170>>2]|0; //@line 243 "HyMES/decrypt.c"
     $172 = (($171) + ($166<<1)|0); //@line 243 "HyMES/decrypt.c"
     $173 = HEAP16[$172>>1]|0; //@line 243 "HyMES/decrypt.c"
     $174 = $173&65535; //@line 243 "HyMES/decrypt.c"
     $175 = ($174|0)!=(0); //@line 243 "HyMES/decrypt.c"
     if ($175) {
      $176 = $a; //@line 243 "HyMES/decrypt.c"
      $177 = $176&65535; //@line 243 "HyMES/decrypt.c"
      $178 = HEAP32[5120>>2]|0; //@line 243 "HyMES/decrypt.c"
      $179 = (($178) + ($177<<1)|0); //@line 243 "HyMES/decrypt.c"
      $180 = HEAP16[$179>>1]|0; //@line 243 "HyMES/decrypt.c"
      $181 = $180&65535; //@line 243 "HyMES/decrypt.c"
      $182 = $j; //@line 243 "HyMES/decrypt.c"
      $183 = $i; //@line 243 "HyMES/decrypt.c"
      $184 = (4880 + ($183<<2)|0); //@line 243 "HyMES/decrypt.c"
      $185 = HEAP32[$184>>2]|0; //@line 243 "HyMES/decrypt.c"
      $186 = ((($185)) + 8|0); //@line 243 "HyMES/decrypt.c"
      $187 = HEAP32[$186>>2]|0; //@line 243 "HyMES/decrypt.c"
      $188 = (($187) + ($182<<1)|0); //@line 243 "HyMES/decrypt.c"
      $189 = HEAP16[$188>>1]|0; //@line 243 "HyMES/decrypt.c"
      $190 = $189&65535; //@line 243 "HyMES/decrypt.c"
      $191 = HEAP32[5120>>2]|0; //@line 243 "HyMES/decrypt.c"
      $192 = (($191) + ($190<<1)|0); //@line 243 "HyMES/decrypt.c"
      $193 = HEAP16[$192>>1]|0; //@line 243 "HyMES/decrypt.c"
      $194 = $193&65535; //@line 243 "HyMES/decrypt.c"
      $195 = (($181) + ($194))|0; //@line 243 "HyMES/decrypt.c"
      $196 = HEAP32[5124>>2]|0; //@line 243 "HyMES/decrypt.c"
      $197 = $195 & $196; //@line 243 "HyMES/decrypt.c"
      $198 = $a; //@line 243 "HyMES/decrypt.c"
      $199 = $198&65535; //@line 243 "HyMES/decrypt.c"
      $200 = HEAP32[5120>>2]|0; //@line 243 "HyMES/decrypt.c"
      $201 = (($200) + ($199<<1)|0); //@line 243 "HyMES/decrypt.c"
      $202 = HEAP16[$201>>1]|0; //@line 243 "HyMES/decrypt.c"
      $203 = $202&65535; //@line 243 "HyMES/decrypt.c"
      $204 = $j; //@line 243 "HyMES/decrypt.c"
      $205 = $i; //@line 243 "HyMES/decrypt.c"
      $206 = (4880 + ($205<<2)|0); //@line 243 "HyMES/decrypt.c"
      $207 = HEAP32[$206>>2]|0; //@line 243 "HyMES/decrypt.c"
      $208 = ((($207)) + 8|0); //@line 243 "HyMES/decrypt.c"
      $209 = HEAP32[$208>>2]|0; //@line 243 "HyMES/decrypt.c"
      $210 = (($209) + ($204<<1)|0); //@line 243 "HyMES/decrypt.c"
      $211 = HEAP16[$210>>1]|0; //@line 243 "HyMES/decrypt.c"
      $212 = $211&65535; //@line 243 "HyMES/decrypt.c"
      $213 = HEAP32[5120>>2]|0; //@line 243 "HyMES/decrypt.c"
      $214 = (($213) + ($212<<1)|0); //@line 243 "HyMES/decrypt.c"
      $215 = HEAP16[$214>>1]|0; //@line 243 "HyMES/decrypt.c"
      $216 = $215&65535; //@line 243 "HyMES/decrypt.c"
      $217 = (($203) + ($216))|0; //@line 243 "HyMES/decrypt.c"
      $218 = HEAP32[5128>>2]|0; //@line 243 "HyMES/decrypt.c"
      $219 = $217 >> $218; //@line 243 "HyMES/decrypt.c"
      $220 = (($197) + ($219))|0; //@line 243 "HyMES/decrypt.c"
      $221 = HEAP32[5132>>2]|0; //@line 243 "HyMES/decrypt.c"
      $222 = (($221) + ($220<<1)|0); //@line 243 "HyMES/decrypt.c"
      $223 = HEAP16[$222>>1]|0; //@line 243 "HyMES/decrypt.c"
      $224 = $223&65535; //@line 243 "HyMES/decrypt.c"
      $226 = $224;
     } else {
      $226 = 0;
     }
     $225 = $165 ^ $226; //@line 243 "HyMES/decrypt.c"
     $227 = $225&65535; //@line 243 "HyMES/decrypt.c"
     $228 = $j; //@line 243 "HyMES/decrypt.c"
     $229 = $S; //@line 243 "HyMES/decrypt.c"
     $230 = ((($229)) + 8|0); //@line 243 "HyMES/decrypt.c"
     $231 = HEAP32[$230>>2]|0; //@line 243 "HyMES/decrypt.c"
     $232 = (($231) + ($228<<1)|0); //@line 243 "HyMES/decrypt.c"
     HEAP16[$232>>1] = $227; //@line 243 "HyMES/decrypt.c"
     $233 = $j; //@line 242 "HyMES/decrypt.c"
     $234 = (($233) + 1)|0; //@line 242 "HyMES/decrypt.c"
     $j = $234; //@line 242 "HyMES/decrypt.c"
    }
   }
  } while(0);
  $253 = $i; //@line 238 "HyMES/decrypt.c"
  $254 = (($253) + 1)|0; //@line 238 "HyMES/decrypt.c"
  $i = $254; //@line 238 "HyMES/decrypt.c"
 }
 $255 = $S; //@line 249 "HyMES/decrypt.c"
 (_poly_calcule_deg($255)|0); //@line 249 "HyMES/decrypt.c"
 $256 = HEAP32[$h>>2]|0; //@line 250 "HyMES/decrypt.c"
 _poly_free($256); //@line 250 "HyMES/decrypt.c"
 $257 = $S; //@line 253 "HyMES/decrypt.c"
 $258 = HEAP32[4876>>2]|0; //@line 253 "HyMES/decrypt.c"
 _poly_eeaux($v,$u,$257,$258,31); //@line 253 "HyMES/decrypt.c"
 $259 = $S; //@line 254 "HyMES/decrypt.c"
 _poly_free($259); //@line 254 "HyMES/decrypt.c"
 $260 = (_poly_alloc(60)|0); //@line 257 "HyMES/decrypt.c"
 $sigma = $260; //@line 257 "HyMES/decrypt.c"
 $i = 0; //@line 258 "HyMES/decrypt.c"
 while(1) {
  $261 = $i; //@line 258 "HyMES/decrypt.c"
  $262 = HEAP32[$u>>2]|0; //@line 258 "HyMES/decrypt.c"
  $263 = HEAP32[$262>>2]|0; //@line 258 "HyMES/decrypt.c"
  $264 = ($261|0)<=($263|0); //@line 258 "HyMES/decrypt.c"
  if (!($264)) {
   break;
  }
  $265 = $i; //@line 259 "HyMES/decrypt.c"
  $266 = HEAP32[$u>>2]|0; //@line 259 "HyMES/decrypt.c"
  $267 = ((($266)) + 8|0); //@line 259 "HyMES/decrypt.c"
  $268 = HEAP32[$267>>2]|0; //@line 259 "HyMES/decrypt.c"
  $269 = (($268) + ($265<<1)|0); //@line 259 "HyMES/decrypt.c"
  $270 = HEAP16[$269>>1]|0; //@line 259 "HyMES/decrypt.c"
  $271 = $270&65535; //@line 259 "HyMES/decrypt.c"
  $272 = ($271|0)!=(0); //@line 259 "HyMES/decrypt.c"
  if ($272) {
   $273 = $i; //@line 259 "HyMES/decrypt.c"
   $274 = HEAP32[$u>>2]|0; //@line 259 "HyMES/decrypt.c"
   $275 = ((($274)) + 8|0); //@line 259 "HyMES/decrypt.c"
   $276 = HEAP32[$275>>2]|0; //@line 259 "HyMES/decrypt.c"
   $277 = (($276) + ($273<<1)|0); //@line 259 "HyMES/decrypt.c"
   $278 = HEAP16[$277>>1]|0; //@line 259 "HyMES/decrypt.c"
   $279 = $278&65535; //@line 259 "HyMES/decrypt.c"
   $280 = HEAP32[5120>>2]|0; //@line 259 "HyMES/decrypt.c"
   $281 = (($280) + ($279<<1)|0); //@line 259 "HyMES/decrypt.c"
   $282 = HEAP16[$281>>1]|0; //@line 259 "HyMES/decrypt.c"
   $283 = $282&65535; //@line 259 "HyMES/decrypt.c"
   $284 = $283 << 1; //@line 259 "HyMES/decrypt.c"
   $285 = HEAP32[5124>>2]|0; //@line 259 "HyMES/decrypt.c"
   $286 = $284 & $285; //@line 259 "HyMES/decrypt.c"
   $287 = $i; //@line 259 "HyMES/decrypt.c"
   $288 = HEAP32[$u>>2]|0; //@line 259 "HyMES/decrypt.c"
   $289 = ((($288)) + 8|0); //@line 259 "HyMES/decrypt.c"
   $290 = HEAP32[$289>>2]|0; //@line 259 "HyMES/decrypt.c"
   $291 = (($290) + ($287<<1)|0); //@line 259 "HyMES/decrypt.c"
   $292 = HEAP16[$291>>1]|0; //@line 259 "HyMES/decrypt.c"
   $293 = $292&65535; //@line 259 "HyMES/decrypt.c"
   $294 = HEAP32[5120>>2]|0; //@line 259 "HyMES/decrypt.c"
   $295 = (($294) + ($293<<1)|0); //@line 259 "HyMES/decrypt.c"
   $296 = HEAP16[$295>>1]|0; //@line 259 "HyMES/decrypt.c"
   $297 = $296&65535; //@line 259 "HyMES/decrypt.c"
   $298 = $297 << 1; //@line 259 "HyMES/decrypt.c"
   $299 = HEAP32[5128>>2]|0; //@line 259 "HyMES/decrypt.c"
   $300 = $298 >> $299; //@line 259 "HyMES/decrypt.c"
   $301 = (($286) + ($300))|0; //@line 259 "HyMES/decrypt.c"
   $302 = HEAP32[5132>>2]|0; //@line 259 "HyMES/decrypt.c"
   $303 = (($302) + ($301<<1)|0); //@line 259 "HyMES/decrypt.c"
   $304 = HEAP16[$303>>1]|0; //@line 259 "HyMES/decrypt.c"
   $305 = $304&65535; //@line 259 "HyMES/decrypt.c"
   $307 = $305;
  } else {
   $307 = 0;
  }
  $306 = $307&65535; //@line 259 "HyMES/decrypt.c"
  $308 = $i; //@line 259 "HyMES/decrypt.c"
  $309 = $308<<1; //@line 259 "HyMES/decrypt.c"
  $310 = $sigma; //@line 259 "HyMES/decrypt.c"
  $311 = ((($310)) + 8|0); //@line 259 "HyMES/decrypt.c"
  $312 = HEAP32[$311>>2]|0; //@line 259 "HyMES/decrypt.c"
  $313 = (($312) + ($309<<1)|0); //@line 259 "HyMES/decrypt.c"
  HEAP16[$313>>1] = $306; //@line 259 "HyMES/decrypt.c"
  $314 = $i; //@line 258 "HyMES/decrypt.c"
  $315 = (($314) + 1)|0; //@line 258 "HyMES/decrypt.c"
  $i = $315; //@line 258 "HyMES/decrypt.c"
 }
 $i = 0; //@line 261 "HyMES/decrypt.c"
 while(1) {
  $316 = $i; //@line 261 "HyMES/decrypt.c"
  $317 = HEAP32[$v>>2]|0; //@line 261 "HyMES/decrypt.c"
  $318 = HEAP32[$317>>2]|0; //@line 261 "HyMES/decrypt.c"
  $319 = ($316|0)<=($318|0); //@line 261 "HyMES/decrypt.c"
  if (!($319)) {
   break;
  }
  $320 = $i; //@line 262 "HyMES/decrypt.c"
  $321 = HEAP32[$v>>2]|0; //@line 262 "HyMES/decrypt.c"
  $322 = ((($321)) + 8|0); //@line 262 "HyMES/decrypt.c"
  $323 = HEAP32[$322>>2]|0; //@line 262 "HyMES/decrypt.c"
  $324 = (($323) + ($320<<1)|0); //@line 262 "HyMES/decrypt.c"
  $325 = HEAP16[$324>>1]|0; //@line 262 "HyMES/decrypt.c"
  $326 = $325&65535; //@line 262 "HyMES/decrypt.c"
  $327 = ($326|0)!=(0); //@line 262 "HyMES/decrypt.c"
  if ($327) {
   $328 = $i; //@line 262 "HyMES/decrypt.c"
   $329 = HEAP32[$v>>2]|0; //@line 262 "HyMES/decrypt.c"
   $330 = ((($329)) + 8|0); //@line 262 "HyMES/decrypt.c"
   $331 = HEAP32[$330>>2]|0; //@line 262 "HyMES/decrypt.c"
   $332 = (($331) + ($328<<1)|0); //@line 262 "HyMES/decrypt.c"
   $333 = HEAP16[$332>>1]|0; //@line 262 "HyMES/decrypt.c"
   $334 = $333&65535; //@line 262 "HyMES/decrypt.c"
   $335 = HEAP32[5120>>2]|0; //@line 262 "HyMES/decrypt.c"
   $336 = (($335) + ($334<<1)|0); //@line 262 "HyMES/decrypt.c"
   $337 = HEAP16[$336>>1]|0; //@line 262 "HyMES/decrypt.c"
   $338 = $337&65535; //@line 262 "HyMES/decrypt.c"
   $339 = $338 << 1; //@line 262 "HyMES/decrypt.c"
   $340 = HEAP32[5124>>2]|0; //@line 262 "HyMES/decrypt.c"
   $341 = $339 & $340; //@line 262 "HyMES/decrypt.c"
   $342 = $i; //@line 262 "HyMES/decrypt.c"
   $343 = HEAP32[$v>>2]|0; //@line 262 "HyMES/decrypt.c"
   $344 = ((($343)) + 8|0); //@line 262 "HyMES/decrypt.c"
   $345 = HEAP32[$344>>2]|0; //@line 262 "HyMES/decrypt.c"
   $346 = (($345) + ($342<<1)|0); //@line 262 "HyMES/decrypt.c"
   $347 = HEAP16[$346>>1]|0; //@line 262 "HyMES/decrypt.c"
   $348 = $347&65535; //@line 262 "HyMES/decrypt.c"
   $349 = HEAP32[5120>>2]|0; //@line 262 "HyMES/decrypt.c"
   $350 = (($349) + ($348<<1)|0); //@line 262 "HyMES/decrypt.c"
   $351 = HEAP16[$350>>1]|0; //@line 262 "HyMES/decrypt.c"
   $352 = $351&65535; //@line 262 "HyMES/decrypt.c"
   $353 = $352 << 1; //@line 262 "HyMES/decrypt.c"
   $354 = HEAP32[5128>>2]|0; //@line 262 "HyMES/decrypt.c"
   $355 = $353 >> $354; //@line 262 "HyMES/decrypt.c"
   $356 = (($341) + ($355))|0; //@line 262 "HyMES/decrypt.c"
   $357 = HEAP32[5132>>2]|0; //@line 262 "HyMES/decrypt.c"
   $358 = (($357) + ($356<<1)|0); //@line 262 "HyMES/decrypt.c"
   $359 = HEAP16[$358>>1]|0; //@line 262 "HyMES/decrypt.c"
   $360 = $359&65535; //@line 262 "HyMES/decrypt.c"
   $362 = $360;
  } else {
   $362 = 0;
  }
  $361 = $362&65535; //@line 262 "HyMES/decrypt.c"
  $363 = $i; //@line 262 "HyMES/decrypt.c"
  $364 = $363<<1; //@line 262 "HyMES/decrypt.c"
  $365 = (($364) + 1)|0; //@line 262 "HyMES/decrypt.c"
  $366 = $sigma; //@line 262 "HyMES/decrypt.c"
  $367 = ((($366)) + 8|0); //@line 262 "HyMES/decrypt.c"
  $368 = HEAP32[$367>>2]|0; //@line 262 "HyMES/decrypt.c"
  $369 = (($368) + ($365<<1)|0); //@line 262 "HyMES/decrypt.c"
  HEAP16[$369>>1] = $361; //@line 262 "HyMES/decrypt.c"
  $370 = $i; //@line 261 "HyMES/decrypt.c"
  $371 = (($370) + 1)|0; //@line 261 "HyMES/decrypt.c"
  $i = $371; //@line 261 "HyMES/decrypt.c"
 }
 $372 = HEAP32[$u>>2]|0; //@line 264 "HyMES/decrypt.c"
 _poly_free($372); //@line 264 "HyMES/decrypt.c"
 $373 = HEAP32[$v>>2]|0; //@line 265 "HyMES/decrypt.c"
 _poly_free($373); //@line 265 "HyMES/decrypt.c"
 $374 = $sigma; //@line 267 "HyMES/decrypt.c"
 (_poly_calcule_deg($374)|0); //@line 267 "HyMES/decrypt.c"
 $375 = $sigma; //@line 269 "HyMES/decrypt.c"
 $376 = HEAP32[$375>>2]|0; //@line 269 "HyMES/decrypt.c"
 $d = $376; //@line 269 "HyMES/decrypt.c"
 $377 = $d; //@line 270 "HyMES/decrypt.c"
 $378 = ($377|0)!=(60); //@line 270 "HyMES/decrypt.c"
 $379 = $sigma; //@line 271 "HyMES/decrypt.c"
 if ($378) {
  _poly_free($379); //@line 271 "HyMES/decrypt.c"
  $0 = -1; //@line 272 "HyMES/decrypt.c"
  $403 = $0; //@line 290 "HyMES/decrypt.c"
  STACKTOP = sp;return ($403|0); //@line 290 "HyMES/decrypt.c"
 }
 $380 = (_roots_berl($379,$res)|0); //@line 275 "HyMES/decrypt.c"
 $d = $380; //@line 275 "HyMES/decrypt.c"
 $381 = $d; //@line 276 "HyMES/decrypt.c"
 $382 = ($381|0)!=(60); //@line 276 "HyMES/decrypt.c"
 if ($382) {
  $383 = $sigma; //@line 277 "HyMES/decrypt.c"
  _poly_free($383); //@line 277 "HyMES/decrypt.c"
  $0 = -1; //@line 278 "HyMES/decrypt.c"
  $403 = $0; //@line 290 "HyMES/decrypt.c"
  STACKTOP = sp;return ($403|0); //@line 290 "HyMES/decrypt.c"
 }
 $i = 0; //@line 281 "HyMES/decrypt.c"
 while(1) {
  $384 = $i; //@line 281 "HyMES/decrypt.c"
  $385 = $d; //@line 281 "HyMES/decrypt.c"
  $386 = ($384|0)<($385|0); //@line 281 "HyMES/decrypt.c"
  if (!($386)) {
   break;
  }
  $387 = $i; //@line 282 "HyMES/decrypt.c"
  $388 = (($res) + ($387<<1)|0); //@line 282 "HyMES/decrypt.c"
  $389 = HEAP16[$388>>1]|0; //@line 282 "HyMES/decrypt.c"
  $390 = $389&65535; //@line 282 "HyMES/decrypt.c"
  $391 = HEAP32[4872>>2]|0; //@line 282 "HyMES/decrypt.c"
  $392 = (($391) + ($390<<1)|0); //@line 282 "HyMES/decrypt.c"
  $393 = HEAP16[$392>>1]|0; //@line 282 "HyMES/decrypt.c"
  $394 = $393&65535; //@line 282 "HyMES/decrypt.c"
  $395 = $i; //@line 282 "HyMES/decrypt.c"
  $396 = $2; //@line 282 "HyMES/decrypt.c"
  $397 = (($396) + ($395<<2)|0); //@line 282 "HyMES/decrypt.c"
  HEAP32[$397>>2] = $394; //@line 282 "HyMES/decrypt.c"
  $398 = $i; //@line 281 "HyMES/decrypt.c"
  $399 = (($398) + 1)|0; //@line 281 "HyMES/decrypt.c"
  $i = $399; //@line 281 "HyMES/decrypt.c"
 }
 $400 = $2; //@line 285 "HyMES/decrypt.c"
 _quickSort($400,0,60,0,4096); //@line 285 "HyMES/decrypt.c"
 $401 = $sigma; //@line 287 "HyMES/decrypt.c"
 _poly_free($401); //@line 287 "HyMES/decrypt.c"
 $402 = $d; //@line 289 "HyMES/decrypt.c"
 $0 = $402; //@line 289 "HyMES/decrypt.c"
 $403 = $0; //@line 290 "HyMES/decrypt.c"
 STACKTOP = sp;return ($403|0); //@line 290 "HyMES/decrypt.c"
}
function _decrypt_block($cleartext,$ciphertext,$sk) {
 $cleartext = $cleartext|0;
 $ciphertext = $ciphertext|0;
 $sk = $sk|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $cwdata$byval_copy = 0, $e = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 288|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $cwdata$byval_copy = sp + 260|0;
 $e = sp;
 $1 = $cleartext;
 $2 = $ciphertext;
 $3 = $sk;
 $4 = $3; //@line 297 "HyMES/decrypt.c"
 _sk_from_string($4); //@line 297 "HyMES/decrypt.c"
 $5 = $2; //@line 300 "HyMES/decrypt.c"
 $6 = (_decode($5,$e)|0); //@line 300 "HyMES/decrypt.c"
 $i = $6; //@line 300 "HyMES/decrypt.c"
 _sk_free(); //@line 301 "HyMES/decrypt.c"
 $7 = $i; //@line 303 "HyMES/decrypt.c"
 $8 = ($7|0)<(0); //@line 303 "HyMES/decrypt.c"
 if ($8) {
  $0 = -1; //@line 304 "HyMES/decrypt.c"
  $34 = $0; //@line 325 "HyMES/decrypt.c"
  STACKTOP = sp;return ($34|0); //@line 325 "HyMES/decrypt.c"
 }
 $i = 0; //@line 307 "HyMES/decrypt.c"
 while(1) {
  $9 = $i; //@line 307 "HyMES/decrypt.c"
  $10 = ($9|0)<(60); //@line 307 "HyMES/decrypt.c"
  if (!($10)) {
   break;
  }
  $11 = $i; //@line 308 "HyMES/decrypt.c"
  $12 = (($e) + ($11<<2)|0); //@line 308 "HyMES/decrypt.c"
  $13 = HEAP32[$12>>2]|0; //@line 308 "HyMES/decrypt.c"
  $14 = (($13|0) % 8)&-1; //@line 308 "HyMES/decrypt.c"
  $15 = 1 << $14; //@line 308 "HyMES/decrypt.c"
  $16 = $i; //@line 308 "HyMES/decrypt.c"
  $17 = (($e) + ($16<<2)|0); //@line 308 "HyMES/decrypt.c"
  $18 = HEAP32[$17>>2]|0; //@line 308 "HyMES/decrypt.c"
  $19 = (($18|0) / 8)&-1; //@line 308 "HyMES/decrypt.c"
  $20 = $2; //@line 308 "HyMES/decrypt.c"
  $21 = (($20) + ($19)|0); //@line 308 "HyMES/decrypt.c"
  $22 = HEAP8[$21>>0]|0; //@line 308 "HyMES/decrypt.c"
  $23 = $22&255; //@line 308 "HyMES/decrypt.c"
  $24 = $23 ^ $15; //@line 308 "HyMES/decrypt.c"
  $25 = $24&255; //@line 308 "HyMES/decrypt.c"
  HEAP8[$21>>0] = $25; //@line 308 "HyMES/decrypt.c"
  $26 = $i; //@line 307 "HyMES/decrypt.c"
  $27 = (($26) + 1)|0; //@line 307 "HyMES/decrypt.c"
  $i = $27; //@line 307 "HyMES/decrypt.c"
 }
 $28 = $1; //@line 310 "HyMES/decrypt.c"
 $29 = $2; //@line 310 "HyMES/decrypt.c"
 _memcpy(($28|0),($29|0),422)|0; //@line 310 "HyMES/decrypt.c"
 $30 = $1; //@line 315 "HyMES/decrypt.c"
 ;HEAP32[$cwdata$byval_copy>>2]=HEAP32[1336>>2]|0;HEAP32[$cwdata$byval_copy+4>>2]=HEAP32[1336+4>>2]|0;HEAP32[$cwdata$byval_copy+8>>2]=HEAP32[1336+8>>2]|0;HEAP32[$cwdata$byval_copy+12>>2]=HEAP32[1336+12>>2]|0;HEAP32[$cwdata$byval_copy+16>>2]=HEAP32[1336+16>>2]|0;HEAP32[$cwdata$byval_copy+20>>2]=HEAP32[1336+20>>2]|0;HEAP32[$cwdata$byval_copy+24>>2]=HEAP32[1336+24>>2]|0; //@line 315 "HyMES/decrypt.c"
 $31 = (_dicho_cw2b($e,$30,3376,446,12,60,$cwdata$byval_copy)|0); //@line 315 "HyMES/decrypt.c"
 $i = $31; //@line 315 "HyMES/decrypt.c"
 $32 = $i; //@line 321 "HyMES/decrypt.c"
 $33 = ($32|0)<(0); //@line 321 "HyMES/decrypt.c"
 if ($33) {
  $0 = -1; //@line 322 "HyMES/decrypt.c"
  $34 = $0; //@line 325 "HyMES/decrypt.c"
  STACKTOP = sp;return ($34|0); //@line 325 "HyMES/decrypt.c"
 } else {
  $0 = 1; //@line 324 "HyMES/decrypt.c"
  $34 = $0; //@line 325 "HyMES/decrypt.c"
  STACKTOP = sp;return ($34|0); //@line 325 "HyMES/decrypt.c"
 }
 return (0)|0;
}
function _liste_alloc($s) {
 $s = $s|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $l = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $s;
 $1 = (_malloc(28)|0); //@line 45 "HyMES/dicho.c"
 $l = $1; //@line 45 "HyMES/dicho.c"
 $2 = $0; //@line 46 "HyMES/dicho.c"
 $3 = $l; //@line 46 "HyMES/dicho.c"
 $4 = ((($3)) + 24|0); //@line 46 "HyMES/dicho.c"
 HEAP32[$4>>2] = $2; //@line 46 "HyMES/dicho.c"
 $5 = $l; //@line 47 "HyMES/dicho.c"
 STACKTOP = sp;return ($5|0); //@line 47 "HyMES/dicho.c"
}
function _liste_free($l) {
 $l = $l|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $l;
 $1 = $0; //@line 51 "HyMES/dicho.c"
 $2 = ($1|0)!=(0|0); //@line 51 "HyMES/dicho.c"
 if ($2) {
  $3 = $0; //@line 52 "HyMES/dicho.c"
  $4 = ((($3)) + 24|0); //@line 52 "HyMES/dicho.c"
  $5 = HEAP32[$4>>2]|0; //@line 52 "HyMES/dicho.c"
  _liste_free($5); //@line 52 "HyMES/dicho.c"
 }
 $6 = $0; //@line 53 "HyMES/dicho.c"
 _free($6); //@line 53 "HyMES/dicho.c"
 STACKTOP = sp;return; //@line 54 "HyMES/dicho.c"
}
function _is_leaf($m,$t) {
 $m = $m|0;
 $t = $t|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $3 = 0;
 var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $m;
 $2 = $t;
 $3 = $1; //@line 58 "HyMES/dicho.c"
 $4 = ($3|0)<(6); //@line 58 "HyMES/dicho.c"
 do {
  if ($4) {
   $5 = $2; //@line 59 "HyMES/dicho.c"
   $6 = ($5|0)<=(32); //@line 59 "HyMES/dicho.c"
   $7 = $6&1; //@line 59 "HyMES/dicho.c"
   $0 = $7; //@line 59 "HyMES/dicho.c"
  } else {
   $8 = $1; //@line 60 "HyMES/dicho.c"
   $9 = ($8|0)>(16); //@line 60 "HyMES/dicho.c"
   if ($9) {
    $10 = $2; //@line 61 "HyMES/dicho.c"
    $11 = ($10|0)<=(1); //@line 61 "HyMES/dicho.c"
    $12 = $11&1; //@line 61 "HyMES/dicho.c"
    $0 = $12; //@line 61 "HyMES/dicho.c"
    break;
   }
   $13 = $1; //@line 62 "HyMES/dicho.c"
   $14 = ($13|0)>(11); //@line 62 "HyMES/dicho.c"
   if ($14) {
    $15 = $2; //@line 63 "HyMES/dicho.c"
    $16 = ($15|0)<=(2); //@line 63 "HyMES/dicho.c"
    $17 = $16&1; //@line 63 "HyMES/dicho.c"
    $0 = $17; //@line 63 "HyMES/dicho.c"
    break;
   } else {
    $18 = $1; //@line 65 "HyMES/dicho.c"
    $19 = (($18) - 6)|0; //@line 65 "HyMES/dicho.c"
    $20 = (5288 + ($19<<2)|0); //@line 65 "HyMES/dicho.c"
    $21 = HEAP32[$20>>2]|0; //@line 65 "HyMES/dicho.c"
    $22 = $2; //@line 65 "HyMES/dicho.c"
    $23 = ($21|0)>=($22|0); //@line 65 "HyMES/dicho.c"
    $24 = $23&1; //@line 65 "HyMES/dicho.c"
    $0 = $24; //@line 65 "HyMES/dicho.c"
    break;
   }
  }
 } while(0);
 $25 = $0; //@line 66 "HyMES/dicho.c"
 STACKTOP = sp;return ($25|0); //@line 66 "HyMES/dicho.c"
}
function _cw_coder($res,$t) {
 $res = $res|0;
 $t = $t|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0;
 var $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $x = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $res;
 $1 = $t;
 $x = 0; //@line 169 "HyMES/dicho.c"
 $2 = $1; //@line 171 "HyMES/dicho.c"
 switch ($2|0) {
 case 4:  {
  label = 2;
  break;
 }
 case 3:  {
  label = 6;
  break;
 }
 case 2:  {
  label = 7;
  break;
 }
 case 1:  {
  break;
 }
 default: {
  $75 = $1; //@line 198 "HyMES/dicho.c"
  $76 = (($75) - 1)|0; //@line 198 "HyMES/dicho.c"
  $77 = $0; //@line 198 "HyMES/dicho.c"
  $78 = (($77) + ($76<<2)|0); //@line 198 "HyMES/dicho.c"
  $79 = HEAP32[$78>>2]|0; //@line 198 "HyMES/dicho.c"
  $80 = $1; //@line 198 "HyMES/dicho.c"
  $81 = (5208 + ($80<<2)|0); //@line 198 "HyMES/dicho.c"
  $82 = HEAP32[$81>>2]|0; //@line 198 "HyMES/dicho.c"
  $83 = (($82) + ($79<<2)|0); //@line 198 "HyMES/dicho.c"
  $84 = HEAP32[$83>>2]|0; //@line 198 "HyMES/dicho.c"
  $85 = $0; //@line 198 "HyMES/dicho.c"
  $86 = $1; //@line 198 "HyMES/dicho.c"
  $87 = (($86) - 1)|0; //@line 198 "HyMES/dicho.c"
  $88 = (_cw_coder($85,$87)|0); //@line 198 "HyMES/dicho.c"
  $89 = (($84) + ($88))|0; //@line 198 "HyMES/dicho.c"
  $x = $89; //@line 198 "HyMES/dicho.c"
  $90 = $x; //@line 202 "HyMES/dicho.c"
  STACKTOP = sp;return ($90|0); //@line 202 "HyMES/dicho.c"
 }
 }
 L4: do {
  if ((label|0) == 2) {
   $3 = $0; //@line 173 "HyMES/dicho.c"
   $4 = ((($3)) + 12|0); //@line 173 "HyMES/dicho.c"
   $5 = HEAP32[$4>>2]|0; //@line 173 "HyMES/dicho.c"
   $6 = $0; //@line 173 "HyMES/dicho.c"
   $7 = ((($6)) + 12|0); //@line 173 "HyMES/dicho.c"
   $8 = HEAP32[$7>>2]|0; //@line 173 "HyMES/dicho.c"
   $9 = (($8) - 1)|0; //@line 173 "HyMES/dicho.c"
   $10 = Math_imul($5, $9)|0; //@line 173 "HyMES/dicho.c"
   $11 = $0; //@line 173 "HyMES/dicho.c"
   $12 = ((($11)) + 12|0); //@line 173 "HyMES/dicho.c"
   $13 = HEAP32[$12>>2]|0; //@line 173 "HyMES/dicho.c"
   $14 = (($13) - 2)|0; //@line 173 "HyMES/dicho.c"
   $15 = Math_imul($10, $14)|0; //@line 173 "HyMES/dicho.c"
   $16 = (($15|0) / 6)&-1; //@line 173 "HyMES/dicho.c"
   $x = $16; //@line 173 "HyMES/dicho.c"
   $17 = $x; //@line 176 "HyMES/dicho.c"
   $18 = $17 & 3; //@line 176 "HyMES/dicho.c"
   switch ($18|0) {
   case 0:  {
    $19 = $x; //@line 178 "HyMES/dicho.c"
    $20 = $19 >>> 2; //@line 178 "HyMES/dicho.c"
    $x = $20; //@line 178 "HyMES/dicho.c"
    $21 = $0; //@line 179 "HyMES/dicho.c"
    $22 = ((($21)) + 12|0); //@line 179 "HyMES/dicho.c"
    $23 = HEAP32[$22>>2]|0; //@line 179 "HyMES/dicho.c"
    $24 = (($23) - 3)|0; //@line 179 "HyMES/dicho.c"
    $25 = $x; //@line 179 "HyMES/dicho.c"
    $26 = Math_imul($25, $24)|0; //@line 179 "HyMES/dicho.c"
    $x = $26; //@line 179 "HyMES/dicho.c"
    label = 6;
    break L4;
    break;
   }
   case 3: case 1:  {
    $27 = $0; //@line 183 "HyMES/dicho.c"
    $28 = ((($27)) + 12|0); //@line 183 "HyMES/dicho.c"
    $29 = HEAP32[$28>>2]|0; //@line 183 "HyMES/dicho.c"
    $30 = (($29) - 3)|0; //@line 183 "HyMES/dicho.c"
    $31 = $30 >> 2; //@line 183 "HyMES/dicho.c"
    $32 = $x; //@line 183 "HyMES/dicho.c"
    $33 = Math_imul($32, $31)|0; //@line 183 "HyMES/dicho.c"
    $x = $33; //@line 183 "HyMES/dicho.c"
    label = 6;
    break L4;
    break;
   }
   case 2:  {
    $34 = $x; //@line 186 "HyMES/dicho.c"
    $35 = $34 >>> 1; //@line 186 "HyMES/dicho.c"
    $x = $35; //@line 186 "HyMES/dicho.c"
    $36 = $0; //@line 187 "HyMES/dicho.c"
    $37 = ((($36)) + 12|0); //@line 187 "HyMES/dicho.c"
    $38 = HEAP32[$37>>2]|0; //@line 187 "HyMES/dicho.c"
    $39 = (($38) - 3)|0; //@line 187 "HyMES/dicho.c"
    $40 = $39 >> 1; //@line 187 "HyMES/dicho.c"
    $41 = $x; //@line 187 "HyMES/dicho.c"
    $42 = Math_imul($41, $40)|0; //@line 187 "HyMES/dicho.c"
    $x = $42; //@line 187 "HyMES/dicho.c"
    label = 6;
    break L4;
    break;
   }
   default: {
    label = 6;
    break L4;
   }
   }
  }
 } while(0);
 if ((label|0) == 6) {
  $43 = $0; //@line 191 "HyMES/dicho.c"
  $44 = ((($43)) + 8|0); //@line 191 "HyMES/dicho.c"
  $45 = HEAP32[$44>>2]|0; //@line 191 "HyMES/dicho.c"
  $46 = $0; //@line 191 "HyMES/dicho.c"
  $47 = ((($46)) + 8|0); //@line 191 "HyMES/dicho.c"
  $48 = HEAP32[$47>>2]|0; //@line 191 "HyMES/dicho.c"
  $49 = (($48) - 1)|0; //@line 191 "HyMES/dicho.c"
  $50 = Math_imul($45, $49)|0; //@line 191 "HyMES/dicho.c"
  $51 = (($50|0) / 2)&-1; //@line 191 "HyMES/dicho.c"
  $52 = $0; //@line 191 "HyMES/dicho.c"
  $53 = ((($52)) + 8|0); //@line 191 "HyMES/dicho.c"
  $54 = HEAP32[$53>>2]|0; //@line 191 "HyMES/dicho.c"
  $55 = (($54) - 2)|0; //@line 191 "HyMES/dicho.c"
  $56 = Math_imul($51, $55)|0; //@line 191 "HyMES/dicho.c"
  $57 = (($56>>>0) / 3)&-1; //@line 191 "HyMES/dicho.c"
  $58 = $x; //@line 191 "HyMES/dicho.c"
  $59 = (($58) + ($57))|0; //@line 191 "HyMES/dicho.c"
  $x = $59; //@line 191 "HyMES/dicho.c"
  label = 7;
 }
 if ((label|0) == 7) {
  $60 = $0; //@line 193 "HyMES/dicho.c"
  $61 = ((($60)) + 4|0); //@line 193 "HyMES/dicho.c"
  $62 = HEAP32[$61>>2]|0; //@line 193 "HyMES/dicho.c"
  $63 = $0; //@line 193 "HyMES/dicho.c"
  $64 = ((($63)) + 4|0); //@line 193 "HyMES/dicho.c"
  $65 = HEAP32[$64>>2]|0; //@line 193 "HyMES/dicho.c"
  $66 = (($65) - 1)|0; //@line 193 "HyMES/dicho.c"
  $67 = Math_imul($62, $66)|0; //@line 193 "HyMES/dicho.c"
  $68 = (($67>>>0) / 2)&-1; //@line 193 "HyMES/dicho.c"
  $69 = $x; //@line 193 "HyMES/dicho.c"
  $70 = (($69) + ($68))|0; //@line 193 "HyMES/dicho.c"
  $x = $70; //@line 193 "HyMES/dicho.c"
 }
 $71 = $0; //@line 195 "HyMES/dicho.c"
 $72 = HEAP32[$71>>2]|0; //@line 195 "HyMES/dicho.c"
 $73 = $x; //@line 195 "HyMES/dicho.c"
 $74 = (($73) + ($72))|0; //@line 195 "HyMES/dicho.c"
 $x = $74; //@line 195 "HyMES/dicho.c"
 $90 = $x; //@line 202 "HyMES/dicho.c"
 STACKTOP = sp;return ($90|0); //@line 202 "HyMES/dicho.c"
}
function _inv_bino($x,$t) {
 $x = $x|0;
 $t = $t|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $debut = 0, $fin = 0, $milieu = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $x;
 $1 = $t;
 $2 = $1; //@line 210 "HyMES/dicho.c"
 $3 = (($2) - 1)|0; //@line 210 "HyMES/dicho.c"
 $debut = $3; //@line 210 "HyMES/dicho.c"
 $4 = $1; //@line 211 "HyMES/dicho.c"
 $5 = (5140 + ($4<<2)|0); //@line 211 "HyMES/dicho.c"
 $6 = HEAP32[$5>>2]|0; //@line 211 "HyMES/dicho.c"
 $fin = $6; //@line 211 "HyMES/dicho.c"
 $7 = $fin; //@line 212 "HyMES/dicho.c"
 $8 = $debut; //@line 212 "HyMES/dicho.c"
 $9 = (($7) + ($8))|0; //@line 212 "HyMES/dicho.c"
 $10 = (($9|0) / 2)&-1; //@line 212 "HyMES/dicho.c"
 $milieu = $10; //@line 212 "HyMES/dicho.c"
 while(1) {
  $11 = $milieu; //@line 217 "HyMES/dicho.c"
  $12 = $debut; //@line 217 "HyMES/dicho.c"
  $13 = ($11|0)>($12|0); //@line 217 "HyMES/dicho.c"
  if (!($13)) {
   break;
  }
  $14 = $0; //@line 218 "HyMES/dicho.c"
  $15 = $milieu; //@line 218 "HyMES/dicho.c"
  $16 = $1; //@line 218 "HyMES/dicho.c"
  $17 = (5208 + ($16<<2)|0); //@line 218 "HyMES/dicho.c"
  $18 = HEAP32[$17>>2]|0; //@line 218 "HyMES/dicho.c"
  $19 = (($18) + ($15<<2)|0); //@line 218 "HyMES/dicho.c"
  $20 = HEAP32[$19>>2]|0; //@line 218 "HyMES/dicho.c"
  $21 = ($14>>>0)<($20>>>0); //@line 218 "HyMES/dicho.c"
  $22 = $milieu; //@line 219 "HyMES/dicho.c"
  if ($21) {
   $fin = $22; //@line 219 "HyMES/dicho.c"
  } else {
   $debut = $22; //@line 221 "HyMES/dicho.c"
  }
  $23 = $fin; //@line 222 "HyMES/dicho.c"
  $24 = $debut; //@line 222 "HyMES/dicho.c"
  $25 = (($23) + ($24))|0; //@line 222 "HyMES/dicho.c"
  $26 = (($25|0) / 2)&-1; //@line 222 "HyMES/dicho.c"
  $milieu = $26; //@line 222 "HyMES/dicho.c"
 }
 $27 = $debut; //@line 226 "HyMES/dicho.c"
 STACKTOP = sp;return ($27|0); //@line 226 "HyMES/dicho.c"
}
function _cw_decoder($x,$t,$res) {
 $x = $x|0;
 $t = $t|0;
 $res = $res|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0;
 var $20 = 0, $21 = +0, $22 = +0, $23 = +0, $24 = +0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0;
 var $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = +0, $44 = +0, $45 = +0, $46 = +0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0;
 var $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0;
 var $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = +0, $84 = +0, $85 = +0, $86 = +0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0;
 var $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $b = 0, $b1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $x;
 $1 = $t;
 $2 = $res;
 $3 = $0; //@line 230 "HyMES/dicho.c"
 $4 = ($3|0)==(0); //@line 230 "HyMES/dicho.c"
 if ($4) {
  while(1) {
   $5 = $1; //@line 231 "HyMES/dicho.c"
   $6 = ($5|0)>(0); //@line 231 "HyMES/dicho.c"
   if (!($6)) {
    break;
   }
   $7 = $1; //@line 232 "HyMES/dicho.c"
   $8 = (($7) + -1)|0; //@line 232 "HyMES/dicho.c"
   $1 = $8; //@line 232 "HyMES/dicho.c"
   $9 = $1; //@line 233 "HyMES/dicho.c"
   $10 = $1; //@line 233 "HyMES/dicho.c"
   $11 = $2; //@line 233 "HyMES/dicho.c"
   $12 = (($11) + ($10<<2)|0); //@line 233 "HyMES/dicho.c"
   HEAP32[$12>>2] = $9; //@line 233 "HyMES/dicho.c"
  }
  STACKTOP = sp;return; //@line 284 "HyMES/dicho.c"
 }
 $13 = $1; //@line 236 "HyMES/dicho.c"
 $14 = ($13|0)==(1); //@line 236 "HyMES/dicho.c"
 if ($14) {
  $15 = $0; //@line 237 "HyMES/dicho.c"
  $16 = $2; //@line 237 "HyMES/dicho.c"
  HEAP32[$16>>2] = $15; //@line 237 "HyMES/dicho.c"
  STACKTOP = sp;return; //@line 284 "HyMES/dicho.c"
 }
 $17 = $1; //@line 239 "HyMES/dicho.c"
 $18 = ($17|0)==(2); //@line 239 "HyMES/dicho.c"
 if ($18) {
  $19 = $0; //@line 240 "HyMES/dicho.c"
  $20 = $19<<1; //@line 240 "HyMES/dicho.c"
  $21 = (+($20>>>0)); //@line 240 "HyMES/dicho.c"
  $22 = $21 + +0.25; //@line 240 "HyMES/dicho.c"
  $23 = (+Math_sqrt((+$22))); //@line 240 "HyMES/dicho.c"
  $24 = (+_round($23)); //@line 240 "HyMES/dicho.c"
  $25 = (~~(($24))); //@line 240 "HyMES/dicho.c"
  $26 = $2; //@line 240 "HyMES/dicho.c"
  $27 = ((($26)) + 4|0); //@line 240 "HyMES/dicho.c"
  HEAP32[$27>>2] = $25; //@line 240 "HyMES/dicho.c"
  $28 = $0; //@line 241 "HyMES/dicho.c"
  $29 = $2; //@line 241 "HyMES/dicho.c"
  $30 = ((($29)) + 4|0); //@line 241 "HyMES/dicho.c"
  $31 = HEAP32[$30>>2]|0; //@line 241 "HyMES/dicho.c"
  $32 = $2; //@line 241 "HyMES/dicho.c"
  $33 = ((($32)) + 4|0); //@line 241 "HyMES/dicho.c"
  $34 = HEAP32[$33>>2]|0; //@line 241 "HyMES/dicho.c"
  $35 = (($34) - 1)|0; //@line 241 "HyMES/dicho.c"
  $36 = Math_imul($31, $35)|0; //@line 241 "HyMES/dicho.c"
  $37 = (($36|0) / 2)&-1; //@line 241 "HyMES/dicho.c"
  $38 = (($28) - ($37))|0; //@line 241 "HyMES/dicho.c"
  $39 = $2; //@line 241 "HyMES/dicho.c"
  HEAP32[$39>>2] = $38; //@line 241 "HyMES/dicho.c"
  STACKTOP = sp;return; //@line 284 "HyMES/dicho.c"
 }
 $40 = $1; //@line 243 "HyMES/dicho.c"
 $41 = ($40|0)==(3); //@line 243 "HyMES/dicho.c"
 if ($41) {
  $42 = $0; //@line 245 "HyMES/dicho.c"
  $43 = (+($42>>>0)); //@line 245 "HyMES/dicho.c"
  $44 = +6 * $43; //@line 245 "HyMES/dicho.c"
  $45 = (+_cbrtf($44)); //@line 245 "HyMES/dicho.c"
  $46 = +1 + $45; //@line 245 "HyMES/dicho.c"
  $47 = (~~(($46))); //@line 245 "HyMES/dicho.c"
  $48 = $2; //@line 245 "HyMES/dicho.c"
  $49 = ((($48)) + 8|0); //@line 245 "HyMES/dicho.c"
  HEAP32[$49>>2] = $47; //@line 245 "HyMES/dicho.c"
  $50 = $2; //@line 246 "HyMES/dicho.c"
  $51 = ((($50)) + 8|0); //@line 246 "HyMES/dicho.c"
  $52 = HEAP32[$51>>2]|0; //@line 246 "HyMES/dicho.c"
  $53 = $2; //@line 246 "HyMES/dicho.c"
  $54 = ((($53)) + 8|0); //@line 246 "HyMES/dicho.c"
  $55 = HEAP32[$54>>2]|0; //@line 246 "HyMES/dicho.c"
  $56 = (($55) - 1)|0; //@line 246 "HyMES/dicho.c"
  $57 = Math_imul($52, $56)|0; //@line 246 "HyMES/dicho.c"
  $58 = (($57|0) / 2)&-1; //@line 246 "HyMES/dicho.c"
  $b = $58; //@line 246 "HyMES/dicho.c"
  $59 = $b; //@line 249 "HyMES/dicho.c"
  $60 = $2; //@line 249 "HyMES/dicho.c"
  $61 = ((($60)) + 8|0); //@line 249 "HyMES/dicho.c"
  $62 = HEAP32[$61>>2]|0; //@line 249 "HyMES/dicho.c"
  $63 = (($62) - 2)|0; //@line 249 "HyMES/dicho.c"
  $64 = Math_imul($59, $63)|0; //@line 249 "HyMES/dicho.c"
  $65 = (($64>>>0) / 3)&-1; //@line 249 "HyMES/dicho.c"
  $66 = $0; //@line 249 "HyMES/dicho.c"
  $67 = (($66) - ($65))|0; //@line 249 "HyMES/dicho.c"
  $0 = $67; //@line 249 "HyMES/dicho.c"
  $68 = $0; //@line 250 "HyMES/dicho.c"
  $69 = $b; //@line 250 "HyMES/dicho.c"
  $70 = ($68>>>0)>=($69>>>0); //@line 250 "HyMES/dicho.c"
  if ($70) {
   $71 = $2; //@line 251 "HyMES/dicho.c"
   $72 = ((($71)) + 8|0); //@line 251 "HyMES/dicho.c"
   $73 = HEAP32[$72>>2]|0; //@line 251 "HyMES/dicho.c"
   $74 = (($73) + 1)|0; //@line 251 "HyMES/dicho.c"
   HEAP32[$72>>2] = $74; //@line 251 "HyMES/dicho.c"
   $75 = $b; //@line 252 "HyMES/dicho.c"
   $76 = $0; //@line 252 "HyMES/dicho.c"
   $77 = (($76) - ($75))|0; //@line 252 "HyMES/dicho.c"
   $0 = $77; //@line 252 "HyMES/dicho.c"
  }
  $78 = $0; //@line 254 "HyMES/dicho.c"
  $79 = $2; //@line 254 "HyMES/dicho.c"
  _cw_decoder($78,2,$79); //@line 254 "HyMES/dicho.c"
  STACKTOP = sp;return; //@line 284 "HyMES/dicho.c"
 }
 $80 = $1; //@line 256 "HyMES/dicho.c"
 $81 = ($80|0)==(4); //@line 256 "HyMES/dicho.c"
 $82 = $0; //@line 258 "HyMES/dicho.c"
 if (!($81)) {
  $146 = $1; //@line 281 "HyMES/dicho.c"
  $147 = (_inv_bino($82,$146)|0); //@line 281 "HyMES/dicho.c"
  $148 = $1; //@line 281 "HyMES/dicho.c"
  $149 = (($148) - 1)|0; //@line 281 "HyMES/dicho.c"
  $150 = $2; //@line 281 "HyMES/dicho.c"
  $151 = (($150) + ($149<<2)|0); //@line 281 "HyMES/dicho.c"
  HEAP32[$151>>2] = $147; //@line 281 "HyMES/dicho.c"
  $152 = $0; //@line 282 "HyMES/dicho.c"
  $153 = $1; //@line 282 "HyMES/dicho.c"
  $154 = (($153) - 1)|0; //@line 282 "HyMES/dicho.c"
  $155 = $2; //@line 282 "HyMES/dicho.c"
  $156 = (($155) + ($154<<2)|0); //@line 282 "HyMES/dicho.c"
  $157 = HEAP32[$156>>2]|0; //@line 282 "HyMES/dicho.c"
  $158 = $1; //@line 282 "HyMES/dicho.c"
  $159 = (5208 + ($158<<2)|0); //@line 282 "HyMES/dicho.c"
  $160 = HEAP32[$159>>2]|0; //@line 282 "HyMES/dicho.c"
  $161 = (($160) + ($157<<2)|0); //@line 282 "HyMES/dicho.c"
  $162 = HEAP32[$161>>2]|0; //@line 282 "HyMES/dicho.c"
  $163 = (($152) - ($162))|0; //@line 282 "HyMES/dicho.c"
  $164 = $1; //@line 282 "HyMES/dicho.c"
  $165 = (($164) - 1)|0; //@line 282 "HyMES/dicho.c"
  $166 = $2; //@line 282 "HyMES/dicho.c"
  _cw_decoder($163,$165,$166); //@line 282 "HyMES/dicho.c"
  STACKTOP = sp;return; //@line 284 "HyMES/dicho.c"
 }
 $83 = (+($82>>>0)); //@line 258 "HyMES/dicho.c"
 $84 = +24 * $83; //@line 258 "HyMES/dicho.c"
 $85 = (+Math_pow((+$84),+0.25)); //@line 258 "HyMES/dicho.c"
 $86 = +1 + $85; //@line 258 "HyMES/dicho.c"
 $87 = (~~(($86))); //@line 258 "HyMES/dicho.c"
 $88 = $2; //@line 258 "HyMES/dicho.c"
 $89 = ((($88)) + 12|0); //@line 258 "HyMES/dicho.c"
 HEAP32[$89>>2] = $87; //@line 258 "HyMES/dicho.c"
 $90 = $2; //@line 259 "HyMES/dicho.c"
 $91 = ((($90)) + 12|0); //@line 259 "HyMES/dicho.c"
 $92 = HEAP32[$91>>2]|0; //@line 259 "HyMES/dicho.c"
 $93 = $2; //@line 259 "HyMES/dicho.c"
 $94 = ((($93)) + 12|0); //@line 259 "HyMES/dicho.c"
 $95 = HEAP32[$94>>2]|0; //@line 259 "HyMES/dicho.c"
 $96 = (($95) - 1)|0; //@line 259 "HyMES/dicho.c"
 $97 = Math_imul($92, $96)|0; //@line 259 "HyMES/dicho.c"
 $98 = $2; //@line 259 "HyMES/dicho.c"
 $99 = ((($98)) + 12|0); //@line 259 "HyMES/dicho.c"
 $100 = HEAP32[$99>>2]|0; //@line 259 "HyMES/dicho.c"
 $101 = (($100) - 2)|0; //@line 259 "HyMES/dicho.c"
 $102 = Math_imul($97, $101)|0; //@line 259 "HyMES/dicho.c"
 $103 = (($102|0) / 6)&-1; //@line 259 "HyMES/dicho.c"
 $b1 = $103; //@line 259 "HyMES/dicho.c"
 $104 = $b1; //@line 262 "HyMES/dicho.c"
 $105 = $104 & 3; //@line 262 "HyMES/dicho.c"
 switch ($105|0) {
 case 0:  {
  $106 = $b1; //@line 264 "HyMES/dicho.c"
  $107 = $106 >>> 2; //@line 264 "HyMES/dicho.c"
  $108 = $2; //@line 264 "HyMES/dicho.c"
  $109 = ((($108)) + 12|0); //@line 264 "HyMES/dicho.c"
  $110 = HEAP32[$109>>2]|0; //@line 264 "HyMES/dicho.c"
  $111 = (($110) - 3)|0; //@line 264 "HyMES/dicho.c"
  $112 = Math_imul($107, $111)|0; //@line 264 "HyMES/dicho.c"
  $113 = $0; //@line 264 "HyMES/dicho.c"
  $114 = (($113) - ($112))|0; //@line 264 "HyMES/dicho.c"
  $0 = $114; //@line 264 "HyMES/dicho.c"
  break;
 }
 case 3: case 1:  {
  $115 = $b1; //@line 268 "HyMES/dicho.c"
  $116 = $2; //@line 268 "HyMES/dicho.c"
  $117 = ((($116)) + 12|0); //@line 268 "HyMES/dicho.c"
  $118 = HEAP32[$117>>2]|0; //@line 268 "HyMES/dicho.c"
  $119 = (($118) - 3)|0; //@line 268 "HyMES/dicho.c"
  $120 = $119 >> 2; //@line 268 "HyMES/dicho.c"
  $121 = Math_imul($115, $120)|0; //@line 268 "HyMES/dicho.c"
  $122 = $0; //@line 268 "HyMES/dicho.c"
  $123 = (($122) - ($121))|0; //@line 268 "HyMES/dicho.c"
  $0 = $123; //@line 268 "HyMES/dicho.c"
  break;
 }
 case 2:  {
  $124 = $b1; //@line 271 "HyMES/dicho.c"
  $125 = $124 >>> 1; //@line 271 "HyMES/dicho.c"
  $126 = $2; //@line 271 "HyMES/dicho.c"
  $127 = ((($126)) + 12|0); //@line 271 "HyMES/dicho.c"
  $128 = HEAP32[$127>>2]|0; //@line 271 "HyMES/dicho.c"
  $129 = (($128) - 3)|0; //@line 271 "HyMES/dicho.c"
  $130 = $129 >> 1; //@line 271 "HyMES/dicho.c"
  $131 = Math_imul($125, $130)|0; //@line 271 "HyMES/dicho.c"
  $132 = $0; //@line 271 "HyMES/dicho.c"
  $133 = (($132) - ($131))|0; //@line 271 "HyMES/dicho.c"
  $0 = $133; //@line 271 "HyMES/dicho.c"
  break;
 }
 default: {
 }
 }
 $134 = $0; //@line 274 "HyMES/dicho.c"
 $135 = $b1; //@line 274 "HyMES/dicho.c"
 $136 = ($134>>>0)>=($135>>>0); //@line 274 "HyMES/dicho.c"
 if ($136) {
  $137 = $2; //@line 275 "HyMES/dicho.c"
  $138 = ((($137)) + 12|0); //@line 275 "HyMES/dicho.c"
  $139 = HEAP32[$138>>2]|0; //@line 275 "HyMES/dicho.c"
  $140 = (($139) + 1)|0; //@line 275 "HyMES/dicho.c"
  HEAP32[$138>>2] = $140; //@line 275 "HyMES/dicho.c"
  $141 = $b1; //@line 276 "HyMES/dicho.c"
  $142 = $0; //@line 276 "HyMES/dicho.c"
  $143 = (($142) - ($141))|0; //@line 276 "HyMES/dicho.c"
  $0 = $143; //@line 276 "HyMES/dicho.c"
 }
 $144 = $0; //@line 278 "HyMES/dicho.c"
 $145 = $2; //@line 278 "HyMES/dicho.c"
 _cw_decoder($144,3,$145); //@line 278 "HyMES/dicho.c"
 STACKTOP = sp;return; //@line 284 "HyMES/dicho.c"
}
function _dicho_rec($cw,$i,$s,$state,$p) {
 $cw = $cw|0;
 $i = $i|0;
 $s = $s|0;
 $state = $state|0;
 $p = $p|0;
 var $$byval_copy = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0;
 var $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0;
 var $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0;
 var $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0;
 var $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0;
 var $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0;
 var $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0;
 var $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0;
 var $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0;
 var $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $cw2 = 0, $j = 0, $l = 0, $p$byval_copy = 0;
 var $p$byval_copy1 = 0, $p$byval_copy2 = 0, $r = 0, $u = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 144|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $p$byval_copy2 = sp + 108|0;
 $p$byval_copy1 = sp + 80|0;
 $$byval_copy = sp + 68|0;
 $p$byval_copy = sp + 40|0;
 $1 = $cw;
 $2 = $i;
 $3 = $s;
 $4 = $state;
 $5 = $2; //@line 290 "HyMES/dicho.c"
 $6 = ($5|0)==(0); //@line 290 "HyMES/dicho.c"
 if ($6) {
  $0 = 0; //@line 291 "HyMES/dicho.c"
  $194 = $0; //@line 344 "HyMES/dicho.c"
  STACKTOP = sp;return ($194|0); //@line 344 "HyMES/dicho.c"
 }
 $7 = $2; //@line 293 "HyMES/dicho.c"
 $8 = $3; //@line 293 "HyMES/dicho.c"
 $9 = 1 << $8; //@line 293 "HyMES/dicho.c"
 $10 = $2; //@line 293 "HyMES/dicho.c"
 $11 = (($9) - ($10))|0; //@line 293 "HyMES/dicho.c"
 $12 = ($7|0)>($11|0); //@line 293 "HyMES/dicho.c"
 if ($12) {
  $13 = $3; //@line 294 "HyMES/dicho.c"
  $14 = 1 << $13; //@line 294 "HyMES/dicho.c"
  $15 = $2; //@line 294 "HyMES/dicho.c"
  $16 = (($14) - ($15))|0; //@line 294 "HyMES/dicho.c"
  $17 = $16<<2; //@line 294 "HyMES/dicho.c"
  $18 = (_malloc($17)|0); //@line 294 "HyMES/dicho.c"
  $cw2 = $18; //@line 294 "HyMES/dicho.c"
  $19 = $1; //@line 295 "HyMES/dicho.c"
  $20 = HEAP32[$19>>2]|0; //@line 295 "HyMES/dicho.c"
  $21 = $3; //@line 295 "HyMES/dicho.c"
  $22 = -1 << $21; //@line 295 "HyMES/dicho.c"
  $23 = $20 & $22; //@line 295 "HyMES/dicho.c"
  $r = $23; //@line 295 "HyMES/dicho.c"
  $j = 0; //@line 296 "HyMES/dicho.c"
  $l = 0; //@line 296 "HyMES/dicho.c"
  while(1) {
   $24 = $l; //@line 296 "HyMES/dicho.c"
   $25 = $3; //@line 296 "HyMES/dicho.c"
   $26 = 1 << $25; //@line 296 "HyMES/dicho.c"
   $27 = $2; //@line 296 "HyMES/dicho.c"
   $28 = (($26) - ($27))|0; //@line 296 "HyMES/dicho.c"
   $29 = ($24|0)<($28|0); //@line 296 "HyMES/dicho.c"
   if (!($29)) {
    break;
   }
   $30 = $j; //@line 296 "HyMES/dicho.c"
   $31 = $2; //@line 296 "HyMES/dicho.c"
   $32 = ($30|0)<($31|0); //@line 296 "HyMES/dicho.c"
   if (!($32)) {
    break;
   }
   $33 = $j; //@line 297 "HyMES/dicho.c"
   $34 = $1; //@line 297 "HyMES/dicho.c"
   $35 = (($34) + ($33<<2)|0); //@line 297 "HyMES/dicho.c"
   $36 = HEAP32[$35>>2]|0; //@line 297 "HyMES/dicho.c"
   $37 = $r; //@line 297 "HyMES/dicho.c"
   $38 = ($36|0)==($37|0); //@line 297 "HyMES/dicho.c"
   if ($38) {
    $39 = $j; //@line 298 "HyMES/dicho.c"
    $40 = (($39) + 1)|0; //@line 298 "HyMES/dicho.c"
    $j = $40; //@line 298 "HyMES/dicho.c"
   } else {
    $41 = $r; //@line 300 "HyMES/dicho.c"
    $42 = $l; //@line 300 "HyMES/dicho.c"
    $43 = $cw2; //@line 300 "HyMES/dicho.c"
    $44 = (($43) + ($42<<2)|0); //@line 300 "HyMES/dicho.c"
    HEAP32[$44>>2] = $41; //@line 300 "HyMES/dicho.c"
    $45 = $l; //@line 301 "HyMES/dicho.c"
    $46 = (($45) + 1)|0; //@line 301 "HyMES/dicho.c"
    $l = $46; //@line 301 "HyMES/dicho.c"
   }
   $47 = $r; //@line 296 "HyMES/dicho.c"
   $48 = (($47) + 1)|0; //@line 296 "HyMES/dicho.c"
   $r = $48; //@line 296 "HyMES/dicho.c"
  }
  while(1) {
   $49 = $l; //@line 303 "HyMES/dicho.c"
   $50 = $3; //@line 303 "HyMES/dicho.c"
   $51 = 1 << $50; //@line 303 "HyMES/dicho.c"
   $52 = $2; //@line 303 "HyMES/dicho.c"
   $53 = (($51) - ($52))|0; //@line 303 "HyMES/dicho.c"
   $54 = ($49|0)<($53|0); //@line 303 "HyMES/dicho.c"
   if (!($54)) {
    break;
   }
   $55 = $r; //@line 304 "HyMES/dicho.c"
   $56 = $l; //@line 304 "HyMES/dicho.c"
   $57 = $cw2; //@line 304 "HyMES/dicho.c"
   $58 = (($57) + ($56<<2)|0); //@line 304 "HyMES/dicho.c"
   HEAP32[$58>>2] = $55; //@line 304 "HyMES/dicho.c"
   $59 = $l; //@line 303 "HyMES/dicho.c"
   $60 = (($59) + 1)|0; //@line 303 "HyMES/dicho.c"
   $l = $60; //@line 303 "HyMES/dicho.c"
   $61 = $r; //@line 303 "HyMES/dicho.c"
   $62 = (($61) + 1)|0; //@line 303 "HyMES/dicho.c"
   $r = $62; //@line 303 "HyMES/dicho.c"
  }
  $63 = $cw2; //@line 305 "HyMES/dicho.c"
  $64 = $l; //@line 305 "HyMES/dicho.c"
  $65 = $3; //@line 305 "HyMES/dicho.c"
  $66 = $4; //@line 305 "HyMES/dicho.c"
  ;HEAP32[$p$byval_copy>>2]=HEAP32[$p>>2]|0;HEAP32[$p$byval_copy+4>>2]=HEAP32[$p+4>>2]|0;HEAP32[$p$byval_copy+8>>2]=HEAP32[$p+8>>2]|0;HEAP32[$p$byval_copy+12>>2]=HEAP32[$p+12>>2]|0;HEAP32[$p$byval_copy+16>>2]=HEAP32[$p+16>>2]|0;HEAP32[$p$byval_copy+20>>2]=HEAP32[$p+20>>2]|0;HEAP32[$p$byval_copy+24>>2]=HEAP32[$p+24>>2]|0; //@line 305 "HyMES/dicho.c"
  $67 = (_dicho_rec($63,$64,$65,$66,$p$byval_copy)|0); //@line 305 "HyMES/dicho.c"
  $r = $67; //@line 305 "HyMES/dicho.c"
  $68 = $cw2; //@line 306 "HyMES/dicho.c"
  _free($68); //@line 306 "HyMES/dicho.c"
  $69 = $r; //@line 307 "HyMES/dicho.c"
  $0 = $69; //@line 307 "HyMES/dicho.c"
  $194 = $0; //@line 344 "HyMES/dicho.c"
  STACKTOP = sp;return ($194|0); //@line 344 "HyMES/dicho.c"
 }
 $70 = $2; //@line 310 "HyMES/dicho.c"
 $71 = ($70|0)==(1); //@line 310 "HyMES/dicho.c"
 if ($71) {
  $72 = HEAP32[5276>>2]|0; //@line 311 "HyMES/dicho.c"
  $73 = (_liste_alloc($72)|0); //@line 311 "HyMES/dicho.c"
  HEAP32[5276>>2] = $73; //@line 311 "HyMES/dicho.c"
  $74 = $3; //@line 312 "HyMES/dicho.c"
  $75 = HEAP32[5276>>2]|0; //@line 312 "HyMES/dicho.c"
  $76 = ((($75)) + 4|0); //@line 312 "HyMES/dicho.c"
  HEAP32[$76>>2] = $74; //@line 312 "HyMES/dicho.c"
  $77 = HEAP32[5276>>2]|0; //@line 313 "HyMES/dicho.c"
  $78 = ((($77)) + 8|0); //@line 313 "HyMES/dicho.c"
  HEAP32[$78>>2] = 1; //@line 313 "HyMES/dicho.c"
  $79 = $1; //@line 314 "HyMES/dicho.c"
  $80 = HEAP32[$79>>2]|0; //@line 314 "HyMES/dicho.c"
  $81 = $3; //@line 314 "HyMES/dicho.c"
  $82 = 1 << $81; //@line 314 "HyMES/dicho.c"
  $83 = (($82) - 1)|0; //@line 314 "HyMES/dicho.c"
  $84 = $80 & $83; //@line 314 "HyMES/dicho.c"
  $85 = HEAP32[5276>>2]|0; //@line 314 "HyMES/dicho.c"
  $86 = ((($85)) + 16|0); //@line 314 "HyMES/dicho.c"
  HEAP32[$86>>2] = $84; //@line 314 "HyMES/dicho.c"
  $87 = $3; //@line 315 "HyMES/dicho.c"
  $88 = 1 << $87; //@line 315 "HyMES/dicho.c"
  $89 = HEAP32[5276>>2]|0; //@line 315 "HyMES/dicho.c"
  $90 = ((($89)) + 20|0); //@line 315 "HyMES/dicho.c"
  HEAP32[$90>>2] = $88; //@line 315 "HyMES/dicho.c"
  $0 = 0; //@line 316 "HyMES/dicho.c"
  $194 = $0; //@line 344 "HyMES/dicho.c"
  STACKTOP = sp;return ($194|0); //@line 344 "HyMES/dicho.c"
 }
 $91 = $3; //@line 319 "HyMES/dicho.c"
 $92 = $2; //@line 319 "HyMES/dicho.c"
 $93 = (_is_leaf($91,$92)|0); //@line 319 "HyMES/dicho.c"
 $94 = ($93|0)!=(0); //@line 319 "HyMES/dicho.c"
 if ($94) {
  $95 = $3; //@line 320 "HyMES/dicho.c"
  $96 = -1 << $95; //@line 320 "HyMES/dicho.c"
  $97 = $96 ^ -1; //@line 320 "HyMES/dicho.c"
  $u = $97; //@line 320 "HyMES/dicho.c"
  $j = 0; //@line 321 "HyMES/dicho.c"
  while(1) {
   $98 = $j; //@line 321 "HyMES/dicho.c"
   $99 = $2; //@line 321 "HyMES/dicho.c"
   $100 = ($98|0)<($99|0); //@line 321 "HyMES/dicho.c"
   if (!($100)) {
    break;
   }
   $101 = $j; //@line 322 "HyMES/dicho.c"
   $102 = $1; //@line 322 "HyMES/dicho.c"
   $103 = (($102) + ($101<<2)|0); //@line 322 "HyMES/dicho.c"
   $104 = HEAP32[$103>>2]|0; //@line 322 "HyMES/dicho.c"
   $105 = $u; //@line 322 "HyMES/dicho.c"
   $106 = $104 & $105; //@line 322 "HyMES/dicho.c"
   $107 = $j; //@line 322 "HyMES/dicho.c"
   $108 = HEAP32[5280>>2]|0; //@line 322 "HyMES/dicho.c"
   $109 = (($108) + ($107<<2)|0); //@line 322 "HyMES/dicho.c"
   HEAP32[$109>>2] = $106; //@line 322 "HyMES/dicho.c"
   $110 = $j; //@line 321 "HyMES/dicho.c"
   $111 = (($110) + 1)|0; //@line 321 "HyMES/dicho.c"
   $j = $111; //@line 321 "HyMES/dicho.c"
  }
  $112 = HEAP32[5276>>2]|0; //@line 323 "HyMES/dicho.c"
  $113 = (_liste_alloc($112)|0); //@line 323 "HyMES/dicho.c"
  HEAP32[5276>>2] = $113; //@line 323 "HyMES/dicho.c"
  $114 = $2; //@line 324 "HyMES/dicho.c"
  $115 = HEAP32[5276>>2]|0; //@line 324 "HyMES/dicho.c"
  $116 = ((($115)) + 8|0); //@line 324 "HyMES/dicho.c"
  HEAP32[$116>>2] = $114; //@line 324 "HyMES/dicho.c"
  $117 = HEAP32[5280>>2]|0; //@line 325 "HyMES/dicho.c"
  $118 = $2; //@line 325 "HyMES/dicho.c"
  $119 = (_cw_coder($117,$118)|0); //@line 325 "HyMES/dicho.c"
  $120 = HEAP32[5276>>2]|0; //@line 325 "HyMES/dicho.c"
  $121 = ((($120)) + 16|0); //@line 325 "HyMES/dicho.c"
  HEAP32[$121>>2] = $119; //@line 325 "HyMES/dicho.c"
  $122 = $2; //@line 326 "HyMES/dicho.c"
  $123 = $3; //@line 326 "HyMES/dicho.c"
  $124 = ((($p)) + 24|0); //@line 326 "HyMES/dicho.c"
  $125 = HEAP32[$124>>2]|0; //@line 326 "HyMES/dicho.c"
  $126 = (($125) + ($123<<2)|0); //@line 326 "HyMES/dicho.c"
  $127 = HEAP32[$126>>2]|0; //@line 326 "HyMES/dicho.c"
  $128 = (($127) + ($122<<3)|0); //@line 326 "HyMES/dicho.c"
  $129 = HEAP32[$128>>2]|0; //@line 326 "HyMES/dicho.c"
  $130 = HEAP32[5276>>2]|0; //@line 326 "HyMES/dicho.c"
  $131 = ((($130)) + 20|0); //@line 326 "HyMES/dicho.c"
  HEAP32[$131>>2] = $129; //@line 326 "HyMES/dicho.c"
  $132 = $2; //@line 327 "HyMES/dicho.c"
  $133 = $3; //@line 327 "HyMES/dicho.c"
  $134 = ((($p)) + 24|0); //@line 327 "HyMES/dicho.c"
  $135 = HEAP32[$134>>2]|0; //@line 327 "HyMES/dicho.c"
  $136 = (($135) + ($133<<2)|0); //@line 327 "HyMES/dicho.c"
  $137 = HEAP32[$136>>2]|0; //@line 327 "HyMES/dicho.c"
  $138 = (($137) + ($132<<3)|0); //@line 327 "HyMES/dicho.c"
  $139 = ((($138)) + 4|0); //@line 327 "HyMES/dicho.c"
  $140 = HEAP32[$139>>2]|0; //@line 327 "HyMES/dicho.c"
  $141 = HEAP32[5276>>2]|0; //@line 327 "HyMES/dicho.c"
  $142 = ((($141)) + 4|0); //@line 327 "HyMES/dicho.c"
  HEAP32[$142>>2] = $140; //@line 327 "HyMES/dicho.c"
  $0 = 0; //@line 328 "HyMES/dicho.c"
  $194 = $0; //@line 344 "HyMES/dicho.c"
  STACKTOP = sp;return ($194|0); //@line 344 "HyMES/dicho.c"
 }
 $l = 0; //@line 331 "HyMES/dicho.c"
 while(1) {
  $143 = $l; //@line 331 "HyMES/dicho.c"
  $144 = $2; //@line 331 "HyMES/dicho.c"
  $145 = ($143|0)<($144|0); //@line 331 "HyMES/dicho.c"
  if (!($145)) {
   break;
  }
  $146 = $l; //@line 332 "HyMES/dicho.c"
  $147 = $1; //@line 332 "HyMES/dicho.c"
  $148 = (($147) + ($146<<2)|0); //@line 332 "HyMES/dicho.c"
  $149 = HEAP32[$148>>2]|0; //@line 332 "HyMES/dicho.c"
  $150 = $3; //@line 332 "HyMES/dicho.c"
  $151 = (($150) - 1)|0; //@line 332 "HyMES/dicho.c"
  $152 = 1 << $151; //@line 332 "HyMES/dicho.c"
  $153 = $149 & $152; //@line 332 "HyMES/dicho.c"
  $154 = ($153|0)!=(0); //@line 332 "HyMES/dicho.c"
  if ($154) {
   break;
  }
  $155 = $l; //@line 331 "HyMES/dicho.c"
  $156 = (($155) + 1)|0; //@line 331 "HyMES/dicho.c"
  $l = $156; //@line 331 "HyMES/dicho.c"
 }
 $157 = $l; //@line 334 "HyMES/dicho.c"
 $158 = $2; //@line 334 "HyMES/dicho.c"
 $159 = $3; //@line 334 "HyMES/dicho.c"
 $160 = ((($p)) + 16|0); //@line 334 "HyMES/dicho.c"
 $161 = HEAP32[$160>>2]|0; //@line 334 "HyMES/dicho.c"
 $162 = (($161) + ($159<<2)|0); //@line 334 "HyMES/dicho.c"
 $163 = HEAP32[$162>>2]|0; //@line 334 "HyMES/dicho.c"
 $164 = (($158) - ($163))|0; //@line 334 "HyMES/dicho.c"
 $165 = $3; //@line 334 "HyMES/dicho.c"
 $166 = ((($p)) + 20|0); //@line 334 "HyMES/dicho.c"
 $167 = HEAP32[$166>>2]|0; //@line 334 "HyMES/dicho.c"
 $168 = (($167) + ($165<<2)|0); //@line 334 "HyMES/dicho.c"
 $169 = HEAP32[$168>>2]|0; //@line 334 "HyMES/dicho.c"
 $170 = (($169) + (($164*12)|0)|0); //@line 334 "HyMES/dicho.c"
 $171 = $4; //@line 334 "HyMES/dicho.c"
 ;HEAP32[$$byval_copy>>2]=HEAP32[$170>>2]|0;HEAP32[$$byval_copy+4>>2]=HEAP32[$170+4>>2]|0;HEAP32[$$byval_copy+8>>2]=HEAP32[$170+8>>2]|0; //@line 334 "HyMES/dicho.c"
 $172 = (_coder($157,$$byval_copy,$171)|0); //@line 334 "HyMES/dicho.c"
 $r = $172; //@line 334 "HyMES/dicho.c"
 $173 = $1; //@line 340 "HyMES/dicho.c"
 $174 = $l; //@line 340 "HyMES/dicho.c"
 $175 = $3; //@line 340 "HyMES/dicho.c"
 $176 = (($175) - 1)|0; //@line 340 "HyMES/dicho.c"
 $177 = $4; //@line 340 "HyMES/dicho.c"
 ;HEAP32[$p$byval_copy1>>2]=HEAP32[$p>>2]|0;HEAP32[$p$byval_copy1+4>>2]=HEAP32[$p+4>>2]|0;HEAP32[$p$byval_copy1+8>>2]=HEAP32[$p+8>>2]|0;HEAP32[$p$byval_copy1+12>>2]=HEAP32[$p+12>>2]|0;HEAP32[$p$byval_copy1+16>>2]=HEAP32[$p+16>>2]|0;HEAP32[$p$byval_copy1+20>>2]=HEAP32[$p+20>>2]|0;HEAP32[$p$byval_copy1+24>>2]=HEAP32[$p+24>>2]|0; //@line 340 "HyMES/dicho.c"
 $178 = (_dicho_rec($173,$174,$176,$177,$p$byval_copy1)|0); //@line 340 "HyMES/dicho.c"
 $179 = $r; //@line 340 "HyMES/dicho.c"
 $180 = (($179) + ($178))|0; //@line 340 "HyMES/dicho.c"
 $r = $180; //@line 340 "HyMES/dicho.c"
 $181 = $1; //@line 341 "HyMES/dicho.c"
 $182 = $l; //@line 341 "HyMES/dicho.c"
 $183 = (($181) + ($182<<2)|0); //@line 341 "HyMES/dicho.c"
 $184 = $2; //@line 341 "HyMES/dicho.c"
 $185 = $l; //@line 341 "HyMES/dicho.c"
 $186 = (($184) - ($185))|0; //@line 341 "HyMES/dicho.c"
 $187 = $3; //@line 341 "HyMES/dicho.c"
 $188 = (($187) - 1)|0; //@line 341 "HyMES/dicho.c"
 $189 = $4; //@line 341 "HyMES/dicho.c"
 ;HEAP32[$p$byval_copy2>>2]=HEAP32[$p>>2]|0;HEAP32[$p$byval_copy2+4>>2]=HEAP32[$p+4>>2]|0;HEAP32[$p$byval_copy2+8>>2]=HEAP32[$p+8>>2]|0;HEAP32[$p$byval_copy2+12>>2]=HEAP32[$p+12>>2]|0;HEAP32[$p$byval_copy2+16>>2]=HEAP32[$p+16>>2]|0;HEAP32[$p$byval_copy2+20>>2]=HEAP32[$p+20>>2]|0;HEAP32[$p$byval_copy2+24>>2]=HEAP32[$p+24>>2]|0; //@line 341 "HyMES/dicho.c"
 $190 = (_dicho_rec($183,$186,$188,$189,$p$byval_copy2)|0); //@line 341 "HyMES/dicho.c"
 $191 = $r; //@line 341 "HyMES/dicho.c"
 $192 = (($191) + ($190))|0; //@line 341 "HyMES/dicho.c"
 $r = $192; //@line 341 "HyMES/dicho.c"
 $193 = $r; //@line 343 "HyMES/dicho.c"
 $0 = $193; //@line 343 "HyMES/dicho.c"
 $194 = $0; //@line 344 "HyMES/dicho.c"
 STACKTOP = sp;return ($194|0); //@line 344 "HyMES/dicho.c"
}
function _dicho($cw,$state,$p) {
 $cw = $cw|0;
 $state = $state|0;
 $p = $p|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $17 = 0, $18 = 0;
 var $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0;
 var $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0;
 var $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0;
 var $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0;
 var $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $accel = 0, $i = 0, $l = 0, $m = 0, $p$byval_copy = 0, $r = 0, $t = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $p$byval_copy = sp + 32|0;
 $0 = $cw;
 $1 = $state;
 $2 = HEAP32[$p>>2]|0; //@line 351 "HyMES/dicho.c"
 $m = $2; //@line 351 "HyMES/dicho.c"
 $3 = ((($p)) + 4|0); //@line 352 "HyMES/dicho.c"
 $4 = HEAP32[$3>>2]|0; //@line 352 "HyMES/dicho.c"
 $t = $4; //@line 352 "HyMES/dicho.c"
 $5 = $t; //@line 354 "HyMES/dicho.c"
 $6 = (($5) + 1)|0; //@line 354 "HyMES/dicho.c"
 $7 = $6<<2; //@line 354 "HyMES/dicho.c"
 $8 = (_malloc($7)|0); //@line 354 "HyMES/dicho.c"
 HEAP32[5280>>2] = $8; //@line 354 "HyMES/dicho.c"
 HEAP32[5276>>2] = 0; //@line 355 "HyMES/dicho.c"
 $9 = $0; //@line 357 "HyMES/dicho.c"
 $10 = $t; //@line 357 "HyMES/dicho.c"
 $11 = $m; //@line 357 "HyMES/dicho.c"
 $12 = $1; //@line 357 "HyMES/dicho.c"
 ;HEAP32[$p$byval_copy>>2]=HEAP32[$p>>2]|0;HEAP32[$p$byval_copy+4>>2]=HEAP32[$p+4>>2]|0;HEAP32[$p$byval_copy+8>>2]=HEAP32[$p+8>>2]|0;HEAP32[$p$byval_copy+12>>2]=HEAP32[$p+12>>2]|0;HEAP32[$p$byval_copy+16>>2]=HEAP32[$p+16>>2]|0;HEAP32[$p$byval_copy+20>>2]=HEAP32[$p+20>>2]|0;HEAP32[$p$byval_copy+24>>2]=HEAP32[$p+24>>2]|0; //@line 357 "HyMES/dicho.c"
 $13 = (_dicho_rec($9,$10,$11,$12,$p$byval_copy)|0); //@line 357 "HyMES/dicho.c"
 $r = $13; //@line 357 "HyMES/dicho.c"
 $i = 0; //@line 366 "HyMES/dicho.c"
 $14 = HEAP32[5276>>2]|0; //@line 366 "HyMES/dicho.c"
 $l = $14; //@line 366 "HyMES/dicho.c"
 while(1) {
  $15 = $l; //@line 366 "HyMES/dicho.c"
  $16 = ($15|0)!=(0|0); //@line 366 "HyMES/dicho.c"
  if (!($16)) {
   break;
  }
  $17 = $l; //@line 367 "HyMES/dicho.c"
  $18 = ((($17)) + 4|0); //@line 367 "HyMES/dicho.c"
  $19 = HEAP32[$18>>2]|0; //@line 367 "HyMES/dicho.c"
  $20 = $i; //@line 367 "HyMES/dicho.c"
  $21 = (($20) + ($19))|0; //@line 367 "HyMES/dicho.c"
  $i = $21; //@line 367 "HyMES/dicho.c"
  $22 = $l; //@line 366 "HyMES/dicho.c"
  $23 = ((($22)) + 24|0); //@line 366 "HyMES/dicho.c"
  $24 = HEAP32[$23>>2]|0; //@line 366 "HyMES/dicho.c"
  $l = $24; //@line 366 "HyMES/dicho.c"
 }
 $25 = $1; //@line 376 "HyMES/dicho.c"
 $26 = ((($25)) + 12|0); //@line 376 "HyMES/dicho.c"
 $27 = HEAP32[$26>>2]|0; //@line 376 "HyMES/dicho.c"
 $28 = (_bwrite_unlocked($27)|0); //@line 376 "HyMES/dicho.c"
 $29 = $i; //@line 376 "HyMES/dicho.c"
 $30 = ($28|0)>=($29|0); //@line 376 "HyMES/dicho.c"
 $31 = $30&1; //@line 376 "HyMES/dicho.c"
 $accel = $31; //@line 376 "HyMES/dicho.c"
 $32 = $accel; //@line 383 "HyMES/dicho.c"
 $33 = ($32|0)!=(0); //@line 383 "HyMES/dicho.c"
 if ($33) {
  $34 = $1; //@line 385 "HyMES/dicho.c"
  $35 = ((($34)) + 12|0); //@line 385 "HyMES/dicho.c"
  $36 = HEAP32[$35>>2]|0; //@line 385 "HyMES/dicho.c"
  $37 = $i; //@line 385 "HyMES/dicho.c"
  $38 = (0 - ($37))|0; //@line 385 "HyMES/dicho.c"
  _bwrite_decaler_fin($36,$38); //@line 385 "HyMES/dicho.c"
 }
 $39 = HEAP32[5276>>2]|0; //@line 387 "HyMES/dicho.c"
 $l = $39; //@line 387 "HyMES/dicho.c"
 while(1) {
  $40 = $l; //@line 387 "HyMES/dicho.c"
  $41 = ($40|0)!=(0|0); //@line 387 "HyMES/dicho.c"
  if (!($41)) {
   break;
  }
  $42 = $l; //@line 388 "HyMES/dicho.c"
  $43 = ((($42)) + 8|0); //@line 388 "HyMES/dicho.c"
  $44 = HEAP32[$43>>2]|0; //@line 388 "HyMES/dicho.c"
  $45 = ($44|0)>(1); //@line 388 "HyMES/dicho.c"
  if ($45) {
   $46 = $l; //@line 389 "HyMES/dicho.c"
   $47 = ((($46)) + 16|0); //@line 389 "HyMES/dicho.c"
   $48 = HEAP32[$47>>2]|0; //@line 389 "HyMES/dicho.c"
   $49 = $l; //@line 389 "HyMES/dicho.c"
   $50 = ((($49)) + 4|0); //@line 389 "HyMES/dicho.c"
   $51 = HEAP32[$50>>2]|0; //@line 389 "HyMES/dicho.c"
   $52 = $48 >>> $51; //@line 389 "HyMES/dicho.c"
   $53 = $l; //@line 389 "HyMES/dicho.c"
   $54 = ((($53)) + 20|0); //@line 389 "HyMES/dicho.c"
   $55 = HEAP32[$54>>2]|0; //@line 389 "HyMES/dicho.c"
   $56 = $1; //@line 389 "HyMES/dicho.c"
   $57 = (_coder_uniforme($52,$55,$56)|0); //@line 389 "HyMES/dicho.c"
   $58 = $r; //@line 389 "HyMES/dicho.c"
   $59 = (($58) + ($57))|0; //@line 389 "HyMES/dicho.c"
   $r = $59; //@line 389 "HyMES/dicho.c"
   $60 = $l; //@line 390 "HyMES/dicho.c"
   $61 = ((($60)) + 4|0); //@line 390 "HyMES/dicho.c"
   $62 = HEAP32[$61>>2]|0; //@line 390 "HyMES/dicho.c"
   $63 = 1 << $62; //@line 390 "HyMES/dicho.c"
   $64 = (($63) - 1)|0; //@line 390 "HyMES/dicho.c"
   $65 = $l; //@line 390 "HyMES/dicho.c"
   $66 = ((($65)) + 16|0); //@line 390 "HyMES/dicho.c"
   $67 = HEAP32[$66>>2]|0; //@line 390 "HyMES/dicho.c"
   $68 = $67 & $64; //@line 390 "HyMES/dicho.c"
   HEAP32[$66>>2] = $68; //@line 390 "HyMES/dicho.c"
  }
  $69 = $l; //@line 387 "HyMES/dicho.c"
  $70 = ((($69)) + 24|0); //@line 387 "HyMES/dicho.c"
  $71 = HEAP32[$70>>2]|0; //@line 387 "HyMES/dicho.c"
  $l = $71; //@line 387 "HyMES/dicho.c"
 }
 $72 = $accel; //@line 398 "HyMES/dicho.c"
 $73 = ($72|0)!=(0); //@line 398 "HyMES/dicho.c"
 L15: do {
  if (!($73)) {
   $74 = HEAP32[5276>>2]|0; //@line 399 "HyMES/dicho.c"
   $l = $74; //@line 399 "HyMES/dicho.c"
   while(1) {
    $75 = $l; //@line 399 "HyMES/dicho.c"
    $76 = ($75|0)!=(0|0); //@line 399 "HyMES/dicho.c"
    if (!($76)) {
     break L15;
    }
    while(1) {
     $77 = $l; //@line 400 "HyMES/dicho.c"
     $78 = ((($77)) + 4|0); //@line 400 "HyMES/dicho.c"
     $79 = HEAP32[$78>>2]|0; //@line 400 "HyMES/dicho.c"
     $80 = ($79|0)>(11); //@line 400 "HyMES/dicho.c"
     $81 = $l; //@line 401 "HyMES/dicho.c"
     if (!($80)) {
      break;
     }
     $82 = ((($81)) + 4|0); //@line 401 "HyMES/dicho.c"
     $83 = HEAP32[$82>>2]|0; //@line 401 "HyMES/dicho.c"
     $84 = (($83) - 11)|0; //@line 401 "HyMES/dicho.c"
     HEAP32[$82>>2] = $84; //@line 401 "HyMES/dicho.c"
     $85 = $l; //@line 402 "HyMES/dicho.c"
     $86 = ((($85)) + 16|0); //@line 402 "HyMES/dicho.c"
     $87 = HEAP32[$86>>2]|0; //@line 402 "HyMES/dicho.c"
     $88 = $l; //@line 402 "HyMES/dicho.c"
     $89 = ((($88)) + 4|0); //@line 402 "HyMES/dicho.c"
     $90 = HEAP32[$89>>2]|0; //@line 402 "HyMES/dicho.c"
     $91 = $87 >>> $90; //@line 402 "HyMES/dicho.c"
     $92 = $1; //@line 402 "HyMES/dicho.c"
     $93 = (_coder_uniforme($91,2048,$92)|0); //@line 402 "HyMES/dicho.c"
     $94 = $r; //@line 402 "HyMES/dicho.c"
     $95 = (($94) + ($93))|0; //@line 402 "HyMES/dicho.c"
     $r = $95; //@line 402 "HyMES/dicho.c"
     $96 = $l; //@line 403 "HyMES/dicho.c"
     $97 = ((($96)) + 4|0); //@line 403 "HyMES/dicho.c"
     $98 = HEAP32[$97>>2]|0; //@line 403 "HyMES/dicho.c"
     $99 = 1 << $98; //@line 403 "HyMES/dicho.c"
     $100 = (($99) - 1)|0; //@line 403 "HyMES/dicho.c"
     $101 = $l; //@line 403 "HyMES/dicho.c"
     $102 = ((($101)) + 16|0); //@line 403 "HyMES/dicho.c"
     $103 = HEAP32[$102>>2]|0; //@line 403 "HyMES/dicho.c"
     $104 = $103 & $100; //@line 403 "HyMES/dicho.c"
     HEAP32[$102>>2] = $104; //@line 403 "HyMES/dicho.c"
    }
    $105 = ((($81)) + 16|0); //@line 405 "HyMES/dicho.c"
    $106 = HEAP32[$105>>2]|0; //@line 405 "HyMES/dicho.c"
    $107 = $l; //@line 405 "HyMES/dicho.c"
    $108 = ((($107)) + 4|0); //@line 405 "HyMES/dicho.c"
    $109 = HEAP32[$108>>2]|0; //@line 405 "HyMES/dicho.c"
    $110 = 1 << $109; //@line 405 "HyMES/dicho.c"
    $111 = $1; //@line 405 "HyMES/dicho.c"
    $112 = (_coder_uniforme($106,$110,$111)|0); //@line 405 "HyMES/dicho.c"
    $113 = $r; //@line 405 "HyMES/dicho.c"
    $114 = (($113) + ($112))|0; //@line 405 "HyMES/dicho.c"
    $r = $114; //@line 405 "HyMES/dicho.c"
    $115 = $l; //@line 399 "HyMES/dicho.c"
    $116 = ((($115)) + 24|0); //@line 399 "HyMES/dicho.c"
    $117 = HEAP32[$116>>2]|0; //@line 399 "HyMES/dicho.c"
    $l = $117; //@line 399 "HyMES/dicho.c"
   }
  }
 } while(0);
 $118 = $1; //@line 409 "HyMES/dicho.c"
 $119 = ((($118)) + 4|0); //@line 409 "HyMES/dicho.c"
 $120 = HEAP32[$119>>2]|0; //@line 409 "HyMES/dicho.c"
 $121 = ($120|0)==(0); //@line 409 "HyMES/dicho.c"
 $122 = $1; //@line 410 "HyMES/dicho.c"
 $123 = ((($122)) + 12|0); //@line 410 "HyMES/dicho.c"
 $124 = HEAP32[$123>>2]|0; //@line 410 "HyMES/dicho.c"
 if ($121) {
  _bwrite_bit(0,$124); //@line 410 "HyMES/dicho.c"
 } else {
  _bwrite_bit(1,$124); //@line 412 "HyMES/dicho.c"
  $125 = $1; //@line 413 "HyMES/dicho.c"
  $126 = HEAP32[$125>>2]|0; //@line 413 "HyMES/dicho.c"
  $127 = $1; //@line 413 "HyMES/dicho.c"
  $128 = ((($127)) + 12|0); //@line 413 "HyMES/dicho.c"
  $129 = HEAP32[$128>>2]|0; //@line 413 "HyMES/dicho.c"
  _bwrite_bits(0,$126,$129); //@line 413 "HyMES/dicho.c"
 }
 $130 = $r; //@line 415 "HyMES/dicho.c"
 $131 = (($130) + 1)|0; //@line 415 "HyMES/dicho.c"
 $r = $131; //@line 415 "HyMES/dicho.c"
 $132 = $accel; //@line 417 "HyMES/dicho.c"
 $133 = ($132|0)!=(0); //@line 417 "HyMES/dicho.c"
 if (!($133)) {
  $166 = HEAP32[5280>>2]|0; //@line 436 "HyMES/dicho.c"
  _free($166); //@line 436 "HyMES/dicho.c"
  $167 = HEAP32[5276>>2]|0; //@line 437 "HyMES/dicho.c"
  _liste_free($167); //@line 437 "HyMES/dicho.c"
  $168 = $r; //@line 439 "HyMES/dicho.c"
  STACKTOP = sp;return ($168|0); //@line 439 "HyMES/dicho.c"
 }
 $134 = $1; //@line 419 "HyMES/dicho.c"
 $135 = ((($134)) + 12|0); //@line 419 "HyMES/dicho.c"
 $136 = HEAP32[$135>>2]|0; //@line 419 "HyMES/dicho.c"
 $137 = $i; //@line 419 "HyMES/dicho.c"
 _bwrite_decaler_fin($136,$137); //@line 419 "HyMES/dicho.c"
 $138 = $1; //@line 422 "HyMES/dicho.c"
 $139 = ((($138)) + 12|0); //@line 422 "HyMES/dicho.c"
 $140 = HEAP32[$139>>2]|0; //@line 422 "HyMES/dicho.c"
 $141 = $1; //@line 422 "HyMES/dicho.c"
 $142 = ((($141)) + 12|0); //@line 422 "HyMES/dicho.c"
 $143 = HEAP32[$142>>2]|0; //@line 422 "HyMES/dicho.c"
 $144 = ((($143)) + 16|0); //@line 422 "HyMES/dicho.c"
 $145 = HEAP32[$144>>2]|0; //@line 422 "HyMES/dicho.c"
 $146 = $i; //@line 422 "HyMES/dicho.c"
 $147 = (($145) - ($146))|0; //@line 422 "HyMES/dicho.c"
 _bwrite_changer_position($140,$147); //@line 422 "HyMES/dicho.c"
 $148 = HEAP32[5276>>2]|0; //@line 424 "HyMES/dicho.c"
 $l = $148; //@line 424 "HyMES/dicho.c"
 while(1) {
  $149 = $l; //@line 424 "HyMES/dicho.c"
  $150 = ($149|0)!=(0|0); //@line 424 "HyMES/dicho.c"
  if (!($150)) {
   break;
  }
  $151 = $l; //@line 425 "HyMES/dicho.c"
  $152 = ((($151)) + 16|0); //@line 425 "HyMES/dicho.c"
  $153 = HEAP32[$152>>2]|0; //@line 425 "HyMES/dicho.c"
  $154 = $l; //@line 425 "HyMES/dicho.c"
  $155 = ((($154)) + 4|0); //@line 425 "HyMES/dicho.c"
  $156 = HEAP32[$155>>2]|0; //@line 425 "HyMES/dicho.c"
  $157 = $1; //@line 425 "HyMES/dicho.c"
  $158 = ((($157)) + 12|0); //@line 425 "HyMES/dicho.c"
  $159 = HEAP32[$158>>2]|0; //@line 425 "HyMES/dicho.c"
  _bwrite($153,$156,$159); //@line 425 "HyMES/dicho.c"
  $160 = $l; //@line 424 "HyMES/dicho.c"
  $161 = ((($160)) + 24|0); //@line 424 "HyMES/dicho.c"
  $162 = HEAP32[$161>>2]|0; //@line 424 "HyMES/dicho.c"
  $l = $162; //@line 424 "HyMES/dicho.c"
 }
 $163 = $i; //@line 427 "HyMES/dicho.c"
 $164 = $r; //@line 427 "HyMES/dicho.c"
 $165 = (($164) + ($163))|0; //@line 427 "HyMES/dicho.c"
 $r = $165; //@line 427 "HyMES/dicho.c"
 $166 = HEAP32[5280>>2]|0; //@line 436 "HyMES/dicho.c"
 _free($166); //@line 436 "HyMES/dicho.c"
 $167 = HEAP32[5276>>2]|0; //@line 437 "HyMES/dicho.c"
 _liste_free($167); //@line 437 "HyMES/dicho.c"
 $168 = $r; //@line 439 "HyMES/dicho.c"
 STACKTOP = sp;return ($168|0); //@line 439 "HyMES/dicho.c"
}
function _dichoinv_rec($cw,$i,$s,$x,$state,$p) {
 $cw = $cw|0;
 $i = $i|0;
 $s = $s|0;
 $x = $x|0;
 $state = $state|0;
 $p = $p|0;
 var $$byval_copy = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0;
 var $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0;
 var $133 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0;
 var $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0;
 var $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0;
 var $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0;
 var $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $l = 0, $p$byval_copy = 0, $p$byval_copy1 = 0, $p$byval_copy2 = 0, $r = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 128|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $p$byval_copy2 = sp + 100|0;
 $p$byval_copy1 = sp + 72|0;
 $$byval_copy = sp + 60|0;
 $p$byval_copy = sp + 32|0;
 $l = sp + 4|0;
 $1 = $cw;
 $2 = $i;
 $3 = $s;
 $4 = $x;
 $5 = $state;
 $6 = $2; //@line 445 "HyMES/dicho.c"
 $7 = ($6|0)==(0); //@line 445 "HyMES/dicho.c"
 if ($7) {
  $0 = 0; //@line 446 "HyMES/dicho.c"
  $133 = $0; //@line 487 "HyMES/dicho.c"
  STACKTOP = sp;return ($133|0); //@line 487 "HyMES/dicho.c"
 }
 $8 = $2; //@line 448 "HyMES/dicho.c"
 $9 = $3; //@line 448 "HyMES/dicho.c"
 $10 = 1 << $9; //@line 448 "HyMES/dicho.c"
 $11 = $2; //@line 448 "HyMES/dicho.c"
 $12 = (($10) - ($11))|0; //@line 448 "HyMES/dicho.c"
 $13 = ($8|0)>($12|0); //@line 448 "HyMES/dicho.c"
 if ($13) {
  $14 = HEAP32[5284>>2]|0; //@line 449 "HyMES/dicho.c"
  $15 = (_liste_alloc($14)|0); //@line 449 "HyMES/dicho.c"
  HEAP32[5284>>2] = $15; //@line 449 "HyMES/dicho.c"
  $16 = $2; //@line 450 "HyMES/dicho.c"
  $17 = HEAP32[5284>>2]|0; //@line 450 "HyMES/dicho.c"
  $18 = ((($17)) + 8|0); //@line 450 "HyMES/dicho.c"
  HEAP32[$18>>2] = $16; //@line 450 "HyMES/dicho.c"
  $19 = $1; //@line 451 "HyMES/dicho.c"
  $20 = HEAP32[5284>>2]|0; //@line 451 "HyMES/dicho.c"
  HEAP32[$20>>2] = $19; //@line 451 "HyMES/dicho.c"
  $21 = $3; //@line 452 "HyMES/dicho.c"
  $22 = HEAP32[5284>>2]|0; //@line 452 "HyMES/dicho.c"
  $23 = ((($22)) + 4|0); //@line 452 "HyMES/dicho.c"
  HEAP32[$23>>2] = $21; //@line 452 "HyMES/dicho.c"
  $24 = $4; //@line 453 "HyMES/dicho.c"
  $25 = HEAP32[5284>>2]|0; //@line 453 "HyMES/dicho.c"
  $26 = ((($25)) + 12|0); //@line 453 "HyMES/dicho.c"
  HEAP32[$26>>2] = $24; //@line 453 "HyMES/dicho.c"
  $27 = $1; //@line 454 "HyMES/dicho.c"
  $28 = $3; //@line 454 "HyMES/dicho.c"
  $29 = 1 << $28; //@line 454 "HyMES/dicho.c"
  $30 = $2; //@line 454 "HyMES/dicho.c"
  $31 = (($29) - ($30))|0; //@line 454 "HyMES/dicho.c"
  $32 = $3; //@line 454 "HyMES/dicho.c"
  $33 = $4; //@line 454 "HyMES/dicho.c"
  $34 = $5; //@line 454 "HyMES/dicho.c"
  ;HEAP32[$p$byval_copy>>2]=HEAP32[$p>>2]|0;HEAP32[$p$byval_copy+4>>2]=HEAP32[$p+4>>2]|0;HEAP32[$p$byval_copy+8>>2]=HEAP32[$p+8>>2]|0;HEAP32[$p$byval_copy+12>>2]=HEAP32[$p+12>>2]|0;HEAP32[$p$byval_copy+16>>2]=HEAP32[$p+16>>2]|0;HEAP32[$p$byval_copy+20>>2]=HEAP32[$p+20>>2]|0;HEAP32[$p$byval_copy+24>>2]=HEAP32[$p+24>>2]|0; //@line 454 "HyMES/dicho.c"
  $35 = (_dichoinv_rec($27,$31,$32,$33,$34,$p$byval_copy)|0); //@line 454 "HyMES/dicho.c"
  $0 = $35; //@line 454 "HyMES/dicho.c"
  $133 = $0; //@line 487 "HyMES/dicho.c"
  STACKTOP = sp;return ($133|0); //@line 487 "HyMES/dicho.c"
 }
 $36 = $2; //@line 457 "HyMES/dicho.c"
 $37 = ($36|0)==(1); //@line 457 "HyMES/dicho.c"
 if ($37) {
  $38 = HEAP32[5276>>2]|0; //@line 458 "HyMES/dicho.c"
  $39 = (_liste_alloc($38)|0); //@line 458 "HyMES/dicho.c"
  HEAP32[5276>>2] = $39; //@line 458 "HyMES/dicho.c"
  $40 = $1; //@line 459 "HyMES/dicho.c"
  $41 = HEAP32[5276>>2]|0; //@line 459 "HyMES/dicho.c"
  HEAP32[$41>>2] = $40; //@line 459 "HyMES/dicho.c"
  $42 = HEAP32[5276>>2]|0; //@line 460 "HyMES/dicho.c"
  $43 = ((($42)) + 8|0); //@line 460 "HyMES/dicho.c"
  HEAP32[$43>>2] = 1; //@line 460 "HyMES/dicho.c"
  $44 = $3; //@line 461 "HyMES/dicho.c"
  $45 = HEAP32[5276>>2]|0; //@line 461 "HyMES/dicho.c"
  $46 = ((($45)) + 4|0); //@line 461 "HyMES/dicho.c"
  HEAP32[$46>>2] = $44; //@line 461 "HyMES/dicho.c"
  $47 = HEAP32[5276>>2]|0; //@line 462 "HyMES/dicho.c"
  $48 = ((($47)) + 16|0); //@line 462 "HyMES/dicho.c"
  HEAP32[$48>>2] = 0; //@line 462 "HyMES/dicho.c"
  $49 = $4; //@line 463 "HyMES/dicho.c"
  $50 = HEAP32[5276>>2]|0; //@line 463 "HyMES/dicho.c"
  $51 = ((($50)) + 12|0); //@line 463 "HyMES/dicho.c"
  HEAP32[$51>>2] = $49; //@line 463 "HyMES/dicho.c"
  $52 = $3; //@line 464 "HyMES/dicho.c"
  $53 = 1 << $52; //@line 464 "HyMES/dicho.c"
  $54 = HEAP32[5276>>2]|0; //@line 464 "HyMES/dicho.c"
  $55 = ((($54)) + 20|0); //@line 464 "HyMES/dicho.c"
  HEAP32[$55>>2] = $53; //@line 464 "HyMES/dicho.c"
  $0 = 0; //@line 465 "HyMES/dicho.c"
  $133 = $0; //@line 487 "HyMES/dicho.c"
  STACKTOP = sp;return ($133|0); //@line 487 "HyMES/dicho.c"
 }
 $56 = $3; //@line 468 "HyMES/dicho.c"
 $57 = $2; //@line 468 "HyMES/dicho.c"
 $58 = (_is_leaf($56,$57)|0); //@line 468 "HyMES/dicho.c"
 $59 = ($58|0)!=(0); //@line 468 "HyMES/dicho.c"
 if ($59) {
  $60 = HEAP32[5276>>2]|0; //@line 469 "HyMES/dicho.c"
  $61 = (_liste_alloc($60)|0); //@line 469 "HyMES/dicho.c"
  HEAP32[5276>>2] = $61; //@line 469 "HyMES/dicho.c"
  $62 = $1; //@line 470 "HyMES/dicho.c"
  $63 = HEAP32[5276>>2]|0; //@line 470 "HyMES/dicho.c"
  HEAP32[$63>>2] = $62; //@line 470 "HyMES/dicho.c"
  $64 = $2; //@line 471 "HyMES/dicho.c"
  $65 = HEAP32[5276>>2]|0; //@line 471 "HyMES/dicho.c"
  $66 = ((($65)) + 8|0); //@line 471 "HyMES/dicho.c"
  HEAP32[$66>>2] = $64; //@line 471 "HyMES/dicho.c"
  $67 = $4; //@line 472 "HyMES/dicho.c"
  $68 = HEAP32[5276>>2]|0; //@line 472 "HyMES/dicho.c"
  $69 = ((($68)) + 12|0); //@line 472 "HyMES/dicho.c"
  HEAP32[$69>>2] = $67; //@line 472 "HyMES/dicho.c"
  $70 = $2; //@line 473 "HyMES/dicho.c"
  $71 = $3; //@line 473 "HyMES/dicho.c"
  $72 = ((($p)) + 24|0); //@line 473 "HyMES/dicho.c"
  $73 = HEAP32[$72>>2]|0; //@line 473 "HyMES/dicho.c"
  $74 = (($73) + ($71<<2)|0); //@line 473 "HyMES/dicho.c"
  $75 = HEAP32[$74>>2]|0; //@line 473 "HyMES/dicho.c"
  $76 = (($75) + ($70<<3)|0); //@line 473 "HyMES/dicho.c"
  $77 = HEAP32[$76>>2]|0; //@line 473 "HyMES/dicho.c"
  $78 = HEAP32[5276>>2]|0; //@line 473 "HyMES/dicho.c"
  $79 = ((($78)) + 20|0); //@line 473 "HyMES/dicho.c"
  HEAP32[$79>>2] = $77; //@line 473 "HyMES/dicho.c"
  $80 = $2; //@line 474 "HyMES/dicho.c"
  $81 = $3; //@line 474 "HyMES/dicho.c"
  $82 = ((($p)) + 24|0); //@line 474 "HyMES/dicho.c"
  $83 = HEAP32[$82>>2]|0; //@line 474 "HyMES/dicho.c"
  $84 = (($83) + ($81<<2)|0); //@line 474 "HyMES/dicho.c"
  $85 = HEAP32[$84>>2]|0; //@line 474 "HyMES/dicho.c"
  $86 = (($85) + ($80<<3)|0); //@line 474 "HyMES/dicho.c"
  $87 = ((($86)) + 4|0); //@line 474 "HyMES/dicho.c"
  $88 = HEAP32[$87>>2]|0; //@line 474 "HyMES/dicho.c"
  $89 = HEAP32[5276>>2]|0; //@line 474 "HyMES/dicho.c"
  $90 = ((($89)) + 4|0); //@line 474 "HyMES/dicho.c"
  HEAP32[$90>>2] = $88; //@line 474 "HyMES/dicho.c"
  $0 = 0; //@line 475 "HyMES/dicho.c"
  $133 = $0; //@line 487 "HyMES/dicho.c"
  STACKTOP = sp;return ($133|0); //@line 487 "HyMES/dicho.c"
 } else {
  $91 = $2; //@line 478 "HyMES/dicho.c"
  $92 = $3; //@line 478 "HyMES/dicho.c"
  $93 = ((($p)) + 16|0); //@line 478 "HyMES/dicho.c"
  $94 = HEAP32[$93>>2]|0; //@line 478 "HyMES/dicho.c"
  $95 = (($94) + ($92<<2)|0); //@line 478 "HyMES/dicho.c"
  $96 = HEAP32[$95>>2]|0; //@line 478 "HyMES/dicho.c"
  $97 = (($91) - ($96))|0; //@line 478 "HyMES/dicho.c"
  $98 = $3; //@line 478 "HyMES/dicho.c"
  $99 = ((($p)) + 20|0); //@line 478 "HyMES/dicho.c"
  $100 = HEAP32[$99>>2]|0; //@line 478 "HyMES/dicho.c"
  $101 = (($100) + ($98<<2)|0); //@line 478 "HyMES/dicho.c"
  $102 = HEAP32[$101>>2]|0; //@line 478 "HyMES/dicho.c"
  $103 = (($102) + (($97*12)|0)|0); //@line 478 "HyMES/dicho.c"
  $104 = $5; //@line 478 "HyMES/dicho.c"
  ;HEAP32[$$byval_copy>>2]=HEAP32[$103>>2]|0;HEAP32[$$byval_copy+4>>2]=HEAP32[$103+4>>2]|0;HEAP32[$$byval_copy+8>>2]=HEAP32[$103+8>>2]|0; //@line 478 "HyMES/dicho.c"
  $105 = (_decoder($$byval_copy,$l,$104)|0); //@line 478 "HyMES/dicho.c"
  $r = $105; //@line 478 "HyMES/dicho.c"
  $106 = $1; //@line 483 "HyMES/dicho.c"
  $107 = HEAP32[$l>>2]|0; //@line 483 "HyMES/dicho.c"
  $108 = $3; //@line 483 "HyMES/dicho.c"
  $109 = (($108) - 1)|0; //@line 483 "HyMES/dicho.c"
  $110 = $4; //@line 483 "HyMES/dicho.c"
  $111 = $5; //@line 483 "HyMES/dicho.c"
  ;HEAP32[$p$byval_copy1>>2]=HEAP32[$p>>2]|0;HEAP32[$p$byval_copy1+4>>2]=HEAP32[$p+4>>2]|0;HEAP32[$p$byval_copy1+8>>2]=HEAP32[$p+8>>2]|0;HEAP32[$p$byval_copy1+12>>2]=HEAP32[$p+12>>2]|0;HEAP32[$p$byval_copy1+16>>2]=HEAP32[$p+16>>2]|0;HEAP32[$p$byval_copy1+20>>2]=HEAP32[$p+20>>2]|0;HEAP32[$p$byval_copy1+24>>2]=HEAP32[$p+24>>2]|0; //@line 483 "HyMES/dicho.c"
  $112 = (_dichoinv_rec($106,$107,$109,$110,$111,$p$byval_copy1)|0); //@line 483 "HyMES/dicho.c"
  $113 = $r; //@line 483 "HyMES/dicho.c"
  $114 = (($113) + ($112))|0; //@line 483 "HyMES/dicho.c"
  $r = $114; //@line 483 "HyMES/dicho.c"
  $115 = $1; //@line 484 "HyMES/dicho.c"
  $116 = HEAP32[$l>>2]|0; //@line 484 "HyMES/dicho.c"
  $117 = (($115) + ($116<<2)|0); //@line 484 "HyMES/dicho.c"
  $118 = $2; //@line 484 "HyMES/dicho.c"
  $119 = HEAP32[$l>>2]|0; //@line 484 "HyMES/dicho.c"
  $120 = (($118) - ($119))|0; //@line 484 "HyMES/dicho.c"
  $121 = $3; //@line 484 "HyMES/dicho.c"
  $122 = (($121) - 1)|0; //@line 484 "HyMES/dicho.c"
  $123 = $4; //@line 484 "HyMES/dicho.c"
  $124 = $3; //@line 484 "HyMES/dicho.c"
  $125 = (($124) - 1)|0; //@line 484 "HyMES/dicho.c"
  $126 = 1 << $125; //@line 484 "HyMES/dicho.c"
  $127 = $123 ^ $126; //@line 484 "HyMES/dicho.c"
  $128 = $5; //@line 484 "HyMES/dicho.c"
  ;HEAP32[$p$byval_copy2>>2]=HEAP32[$p>>2]|0;HEAP32[$p$byval_copy2+4>>2]=HEAP32[$p+4>>2]|0;HEAP32[$p$byval_copy2+8>>2]=HEAP32[$p+8>>2]|0;HEAP32[$p$byval_copy2+12>>2]=HEAP32[$p+12>>2]|0;HEAP32[$p$byval_copy2+16>>2]=HEAP32[$p+16>>2]|0;HEAP32[$p$byval_copy2+20>>2]=HEAP32[$p+20>>2]|0;HEAP32[$p$byval_copy2+24>>2]=HEAP32[$p+24>>2]|0; //@line 484 "HyMES/dicho.c"
  $129 = (_dichoinv_rec($117,$120,$122,$127,$128,$p$byval_copy2)|0); //@line 484 "HyMES/dicho.c"
  $130 = $r; //@line 484 "HyMES/dicho.c"
  $131 = (($130) + ($129))|0; //@line 484 "HyMES/dicho.c"
  $r = $131; //@line 484 "HyMES/dicho.c"
  $132 = $r; //@line 486 "HyMES/dicho.c"
  $0 = $132; //@line 486 "HyMES/dicho.c"
  $133 = $0; //@line 487 "HyMES/dicho.c"
  STACKTOP = sp;return ($133|0); //@line 487 "HyMES/dicho.c"
 }
 return (0)|0;
}
function _dichoinv($cw,$state,$p) {
 $cw = $cw|0;
 $state = $state|0;
 $p = $p|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0;
 var $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0;
 var $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0;
 var $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0;
 var $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0;
 var $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0;
 var $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0;
 var $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $accel = 0, $cw2 = 0, $i = 0, $j = 0, $k = 0, $l = 0, $m = 0, $p$byval_copy = 0, $r = 0, $t = 0, $x = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $p$byval_copy = sp + 48|0;
 $x = sp + 16|0;
 $0 = $cw;
 $1 = $state;
 $2 = HEAP32[$p>>2]|0; //@line 495 "HyMES/dicho.c"
 $m = $2; //@line 495 "HyMES/dicho.c"
 $3 = ((($p)) + 4|0); //@line 496 "HyMES/dicho.c"
 $4 = HEAP32[$3>>2]|0; //@line 496 "HyMES/dicho.c"
 $t = $4; //@line 496 "HyMES/dicho.c"
 HEAP32[5276>>2] = 0; //@line 498 "HyMES/dicho.c"
 HEAP32[5284>>2] = 0; //@line 499 "HyMES/dicho.c"
 $5 = $0; //@line 501 "HyMES/dicho.c"
 $6 = $t; //@line 501 "HyMES/dicho.c"
 $7 = $m; //@line 501 "HyMES/dicho.c"
 $8 = $1; //@line 501 "HyMES/dicho.c"
 ;HEAP32[$p$byval_copy>>2]=HEAP32[$p>>2]|0;HEAP32[$p$byval_copy+4>>2]=HEAP32[$p+4>>2]|0;HEAP32[$p$byval_copy+8>>2]=HEAP32[$p+8>>2]|0;HEAP32[$p$byval_copy+12>>2]=HEAP32[$p+12>>2]|0;HEAP32[$p$byval_copy+16>>2]=HEAP32[$p+16>>2]|0;HEAP32[$p$byval_copy+20>>2]=HEAP32[$p+20>>2]|0;HEAP32[$p$byval_copy+24>>2]=HEAP32[$p+24>>2]|0; //@line 501 "HyMES/dicho.c"
 $9 = (_dichoinv_rec($5,$6,$7,0,$8,$p$byval_copy)|0); //@line 501 "HyMES/dicho.c"
 $r = $9; //@line 501 "HyMES/dicho.c"
 $i = 0; //@line 510 "HyMES/dicho.c"
 $10 = HEAP32[5276>>2]|0; //@line 510 "HyMES/dicho.c"
 $l = $10; //@line 510 "HyMES/dicho.c"
 while(1) {
  $11 = $l; //@line 510 "HyMES/dicho.c"
  $12 = ($11|0)!=(0|0); //@line 510 "HyMES/dicho.c"
  if (!($12)) {
   break;
  }
  $13 = $l; //@line 511 "HyMES/dicho.c"
  $14 = ((($13)) + 4|0); //@line 511 "HyMES/dicho.c"
  $15 = HEAP32[$14>>2]|0; //@line 511 "HyMES/dicho.c"
  $16 = $i; //@line 511 "HyMES/dicho.c"
  $17 = (($16) + ($15))|0; //@line 511 "HyMES/dicho.c"
  $i = $17; //@line 511 "HyMES/dicho.c"
  $18 = $l; //@line 510 "HyMES/dicho.c"
  $19 = ((($18)) + 24|0); //@line 510 "HyMES/dicho.c"
  $20 = HEAP32[$19>>2]|0; //@line 510 "HyMES/dicho.c"
  $l = $20; //@line 510 "HyMES/dicho.c"
 }
 $21 = $1; //@line 514 "HyMES/dicho.c"
 $22 = ((($21)) + 12|0); //@line 514 "HyMES/dicho.c"
 $23 = HEAP32[$22>>2]|0; //@line 514 "HyMES/dicho.c"
 $24 = (_bread_unlocked($23)|0); //@line 514 "HyMES/dicho.c"
 $25 = $i; //@line 514 "HyMES/dicho.c"
 $26 = ($24|0)>=($25|0); //@line 514 "HyMES/dicho.c"
 $27 = $26&1; //@line 514 "HyMES/dicho.c"
 $accel = $27; //@line 514 "HyMES/dicho.c"
 $28 = $accel; //@line 521 "HyMES/dicho.c"
 $29 = ($28|0)!=(0); //@line 521 "HyMES/dicho.c"
 if ($29) {
  $30 = $1; //@line 523 "HyMES/dicho.c"
  $31 = ((($30)) + 12|0); //@line 523 "HyMES/dicho.c"
  $32 = HEAP32[$31>>2]|0; //@line 523 "HyMES/dicho.c"
  $33 = $i; //@line 523 "HyMES/dicho.c"
  $34 = (0 - ($33))|0; //@line 523 "HyMES/dicho.c"
  _bread_decaler_fin($32,$34); //@line 523 "HyMES/dicho.c"
 }
 $35 = HEAP32[5276>>2]|0; //@line 525 "HyMES/dicho.c"
 $l = $35; //@line 525 "HyMES/dicho.c"
 while(1) {
  $36 = $l; //@line 525 "HyMES/dicho.c"
  $37 = ($36|0)!=(0|0); //@line 525 "HyMES/dicho.c"
  if (!($37)) {
   break;
  }
  $38 = $l; //@line 526 "HyMES/dicho.c"
  $39 = ((($38)) + 8|0); //@line 526 "HyMES/dicho.c"
  $40 = HEAP32[$39>>2]|0; //@line 526 "HyMES/dicho.c"
  $41 = ($40|0)>(1); //@line 526 "HyMES/dicho.c"
  if ($41) {
   $42 = $l; //@line 527 "HyMES/dicho.c"
   $43 = ((($42)) + 20|0); //@line 527 "HyMES/dicho.c"
   $44 = HEAP32[$43>>2]|0; //@line 527 "HyMES/dicho.c"
   $45 = $1; //@line 527 "HyMES/dicho.c"
   $46 = (_decoder_uniforme($44,$x,$45)|0); //@line 527 "HyMES/dicho.c"
   $47 = $r; //@line 527 "HyMES/dicho.c"
   $48 = (($47) + ($46))|0; //@line 527 "HyMES/dicho.c"
   $r = $48; //@line 527 "HyMES/dicho.c"
   $49 = HEAP32[$x>>2]|0; //@line 528 "HyMES/dicho.c"
   $50 = $l; //@line 528 "HyMES/dicho.c"
   $51 = ((($50)) + 4|0); //@line 528 "HyMES/dicho.c"
   $52 = HEAP32[$51>>2]|0; //@line 528 "HyMES/dicho.c"
   $53 = $49 << $52; //@line 528 "HyMES/dicho.c"
   $54 = $l; //@line 528 "HyMES/dicho.c"
   $55 = ((($54)) + 16|0); //@line 528 "HyMES/dicho.c"
   HEAP32[$55>>2] = $53; //@line 528 "HyMES/dicho.c"
  }
  $56 = $l; //@line 525 "HyMES/dicho.c"
  $57 = ((($56)) + 24|0); //@line 525 "HyMES/dicho.c"
  $58 = HEAP32[$57>>2]|0; //@line 525 "HyMES/dicho.c"
  $l = $58; //@line 525 "HyMES/dicho.c"
 }
 $59 = $accel; //@line 535 "HyMES/dicho.c"
 $60 = ($59|0)!=(0); //@line 535 "HyMES/dicho.c"
 L15: do {
  if ($60) {
   $61 = $1; //@line 537 "HyMES/dicho.c"
   $62 = ((($61)) + 12|0); //@line 537 "HyMES/dicho.c"
   $63 = HEAP32[$62>>2]|0; //@line 537 "HyMES/dicho.c"
   $64 = $i; //@line 537 "HyMES/dicho.c"
   _bread_decaler_fin($63,$64); //@line 537 "HyMES/dicho.c"
   $65 = $1; //@line 540 "HyMES/dicho.c"
   $66 = ((($65)) + 12|0); //@line 540 "HyMES/dicho.c"
   $67 = HEAP32[$66>>2]|0; //@line 540 "HyMES/dicho.c"
   $68 = $1; //@line 540 "HyMES/dicho.c"
   $69 = ((($68)) + 12|0); //@line 540 "HyMES/dicho.c"
   $70 = HEAP32[$69>>2]|0; //@line 540 "HyMES/dicho.c"
   $71 = ((($70)) + 16|0); //@line 540 "HyMES/dicho.c"
   $72 = HEAP32[$71>>2]|0; //@line 540 "HyMES/dicho.c"
   $73 = $i; //@line 540 "HyMES/dicho.c"
   $74 = (($72) - ($73))|0; //@line 540 "HyMES/dicho.c"
   _bread_changer_position($67,$74); //@line 540 "HyMES/dicho.c"
   $75 = HEAP32[5276>>2]|0; //@line 542 "HyMES/dicho.c"
   $l = $75; //@line 542 "HyMES/dicho.c"
   while(1) {
    $76 = $l; //@line 542 "HyMES/dicho.c"
    $77 = ($76|0)!=(0|0); //@line 542 "HyMES/dicho.c"
    if (!($77)) {
     break;
    }
    $78 = $l; //@line 543 "HyMES/dicho.c"
    $79 = ((($78)) + 4|0); //@line 543 "HyMES/dicho.c"
    $80 = HEAP32[$79>>2]|0; //@line 543 "HyMES/dicho.c"
    $81 = $1; //@line 543 "HyMES/dicho.c"
    $82 = ((($81)) + 12|0); //@line 543 "HyMES/dicho.c"
    $83 = HEAP32[$82>>2]|0; //@line 543 "HyMES/dicho.c"
    $84 = (_bread($80,$83)|0); //@line 543 "HyMES/dicho.c"
    $85 = $l; //@line 543 "HyMES/dicho.c"
    $86 = ((($85)) + 16|0); //@line 543 "HyMES/dicho.c"
    $87 = HEAP32[$86>>2]|0; //@line 543 "HyMES/dicho.c"
    $88 = $87 ^ $84; //@line 543 "HyMES/dicho.c"
    HEAP32[$86>>2] = $88; //@line 543 "HyMES/dicho.c"
    $89 = $l; //@line 542 "HyMES/dicho.c"
    $90 = ((($89)) + 24|0); //@line 542 "HyMES/dicho.c"
    $91 = HEAP32[$90>>2]|0; //@line 542 "HyMES/dicho.c"
    $l = $91; //@line 542 "HyMES/dicho.c"
   }
   $92 = $i; //@line 545 "HyMES/dicho.c"
   $93 = $r; //@line 545 "HyMES/dicho.c"
   $94 = (($93) + ($92))|0; //@line 545 "HyMES/dicho.c"
   $r = $94; //@line 545 "HyMES/dicho.c"
  } else {
   $95 = HEAP32[5276>>2]|0; //@line 548 "HyMES/dicho.c"
   $l = $95; //@line 548 "HyMES/dicho.c"
   while(1) {
    $96 = $l; //@line 548 "HyMES/dicho.c"
    $97 = ($96|0)!=(0|0); //@line 548 "HyMES/dicho.c"
    if (!($97)) {
     break L15;
    }
    while(1) {
     $98 = $l; //@line 549 "HyMES/dicho.c"
     $99 = ((($98)) + 4|0); //@line 549 "HyMES/dicho.c"
     $100 = HEAP32[$99>>2]|0; //@line 549 "HyMES/dicho.c"
     $101 = ($100|0)>(11); //@line 549 "HyMES/dicho.c"
     if (!($101)) {
      break;
     }
     $102 = $1; //@line 550 "HyMES/dicho.c"
     $103 = (_decoder_uniforme(2048,$x,$102)|0); //@line 550 "HyMES/dicho.c"
     $104 = $r; //@line 550 "HyMES/dicho.c"
     $105 = (($104) + ($103))|0; //@line 550 "HyMES/dicho.c"
     $r = $105; //@line 550 "HyMES/dicho.c"
     $106 = $l; //@line 551 "HyMES/dicho.c"
     $107 = ((($106)) + 4|0); //@line 551 "HyMES/dicho.c"
     $108 = HEAP32[$107>>2]|0; //@line 551 "HyMES/dicho.c"
     $109 = (($108) - 11)|0; //@line 551 "HyMES/dicho.c"
     HEAP32[$107>>2] = $109; //@line 551 "HyMES/dicho.c"
     $110 = HEAP32[$x>>2]|0; //@line 552 "HyMES/dicho.c"
     $111 = $l; //@line 552 "HyMES/dicho.c"
     $112 = ((($111)) + 4|0); //@line 552 "HyMES/dicho.c"
     $113 = HEAP32[$112>>2]|0; //@line 552 "HyMES/dicho.c"
     $114 = $110 << $113; //@line 552 "HyMES/dicho.c"
     $115 = $l; //@line 552 "HyMES/dicho.c"
     $116 = ((($115)) + 16|0); //@line 552 "HyMES/dicho.c"
     $117 = HEAP32[$116>>2]|0; //@line 552 "HyMES/dicho.c"
     $118 = $117 ^ $114; //@line 552 "HyMES/dicho.c"
     HEAP32[$116>>2] = $118; //@line 552 "HyMES/dicho.c"
    }
    $119 = $l; //@line 554 "HyMES/dicho.c"
    $120 = ((($119)) + 4|0); //@line 554 "HyMES/dicho.c"
    $121 = HEAP32[$120>>2]|0; //@line 554 "HyMES/dicho.c"
    $122 = 1 << $121; //@line 554 "HyMES/dicho.c"
    $123 = $1; //@line 554 "HyMES/dicho.c"
    $124 = (_decoder_uniforme($122,$x,$123)|0); //@line 554 "HyMES/dicho.c"
    $125 = $r; //@line 554 "HyMES/dicho.c"
    $126 = (($125) + ($124))|0; //@line 554 "HyMES/dicho.c"
    $r = $126; //@line 554 "HyMES/dicho.c"
    $127 = HEAP32[$x>>2]|0; //@line 555 "HyMES/dicho.c"
    $128 = $l; //@line 555 "HyMES/dicho.c"
    $129 = ((($128)) + 16|0); //@line 555 "HyMES/dicho.c"
    $130 = HEAP32[$129>>2]|0; //@line 555 "HyMES/dicho.c"
    $131 = $130 ^ $127; //@line 555 "HyMES/dicho.c"
    HEAP32[$129>>2] = $131; //@line 555 "HyMES/dicho.c"
    $132 = $l; //@line 548 "HyMES/dicho.c"
    $133 = ((($132)) + 24|0); //@line 548 "HyMES/dicho.c"
    $134 = HEAP32[$133>>2]|0; //@line 548 "HyMES/dicho.c"
    $l = $134; //@line 548 "HyMES/dicho.c"
   }
  }
 } while(0);
 $135 = $r; //@line 566 "HyMES/dicho.c"
 $136 = (($135) + 1)|0; //@line 566 "HyMES/dicho.c"
 $r = $136; //@line 566 "HyMES/dicho.c"
 $137 = HEAP32[5276>>2]|0; //@line 574 "HyMES/dicho.c"
 $l = $137; //@line 574 "HyMES/dicho.c"
 while(1) {
  $138 = $l; //@line 574 "HyMES/dicho.c"
  $139 = ($138|0)!=(0|0); //@line 574 "HyMES/dicho.c"
  if (!($139)) {
   break;
  }
  $140 = $l; //@line 575 "HyMES/dicho.c"
  $141 = ((($140)) + 16|0); //@line 575 "HyMES/dicho.c"
  $142 = HEAP32[$141>>2]|0; //@line 575 "HyMES/dicho.c"
  $143 = $l; //@line 575 "HyMES/dicho.c"
  $144 = ((($143)) + 8|0); //@line 575 "HyMES/dicho.c"
  $145 = HEAP32[$144>>2]|0; //@line 575 "HyMES/dicho.c"
  $146 = $l; //@line 575 "HyMES/dicho.c"
  $147 = HEAP32[$146>>2]|0; //@line 575 "HyMES/dicho.c"
  _cw_decoder($142,$145,$147); //@line 575 "HyMES/dicho.c"
  $i = 0; //@line 576 "HyMES/dicho.c"
  while(1) {
   $148 = $i; //@line 576 "HyMES/dicho.c"
   $149 = $l; //@line 576 "HyMES/dicho.c"
   $150 = ((($149)) + 8|0); //@line 576 "HyMES/dicho.c"
   $151 = HEAP32[$150>>2]|0; //@line 576 "HyMES/dicho.c"
   $152 = ($148|0)<($151|0); //@line 576 "HyMES/dicho.c"
   $153 = $l; //@line 577 "HyMES/dicho.c"
   if (!($152)) {
    break;
   }
   $154 = ((($153)) + 12|0); //@line 577 "HyMES/dicho.c"
   $155 = HEAP32[$154>>2]|0; //@line 577 "HyMES/dicho.c"
   $156 = $i; //@line 577 "HyMES/dicho.c"
   $157 = $l; //@line 577 "HyMES/dicho.c"
   $158 = HEAP32[$157>>2]|0; //@line 577 "HyMES/dicho.c"
   $159 = (($158) + ($156<<2)|0); //@line 577 "HyMES/dicho.c"
   $160 = HEAP32[$159>>2]|0; //@line 577 "HyMES/dicho.c"
   $161 = $160 ^ $155; //@line 577 "HyMES/dicho.c"
   HEAP32[$159>>2] = $161; //@line 577 "HyMES/dicho.c"
   $162 = $i; //@line 576 "HyMES/dicho.c"
   $163 = (($162) + 1)|0; //@line 576 "HyMES/dicho.c"
   $i = $163; //@line 576 "HyMES/dicho.c"
  }
  $164 = ((($153)) + 24|0); //@line 574 "HyMES/dicho.c"
  $165 = HEAP32[$164>>2]|0; //@line 574 "HyMES/dicho.c"
  $l = $165; //@line 574 "HyMES/dicho.c"
 }
 $166 = HEAP32[5284>>2]|0; //@line 586 "HyMES/dicho.c"
 $l = $166; //@line 586 "HyMES/dicho.c"
 while(1) {
  $167 = $l; //@line 586 "HyMES/dicho.c"
  $168 = ($167|0)!=(0|0); //@line 586 "HyMES/dicho.c"
  if (!($168)) {
   break;
  }
  $169 = $l; //@line 589 "HyMES/dicho.c"
  $170 = ((($169)) + 4|0); //@line 589 "HyMES/dicho.c"
  $171 = HEAP32[$170>>2]|0; //@line 589 "HyMES/dicho.c"
  $172 = 1 << $171; //@line 589 "HyMES/dicho.c"
  $173 = $l; //@line 589 "HyMES/dicho.c"
  $174 = ((($173)) + 8|0); //@line 589 "HyMES/dicho.c"
  $175 = HEAP32[$174>>2]|0; //@line 589 "HyMES/dicho.c"
  $176 = (($172) - ($175))|0; //@line 589 "HyMES/dicho.c"
  $177 = $176<<2; //@line 589 "HyMES/dicho.c"
  $178 = (_malloc($177)|0); //@line 589 "HyMES/dicho.c"
  $cw2 = $178; //@line 589 "HyMES/dicho.c"
  $179 = $cw2; //@line 590 "HyMES/dicho.c"
  $180 = $l; //@line 590 "HyMES/dicho.c"
  $181 = HEAP32[$180>>2]|0; //@line 590 "HyMES/dicho.c"
  $182 = $l; //@line 590 "HyMES/dicho.c"
  $183 = ((($182)) + 4|0); //@line 590 "HyMES/dicho.c"
  $184 = HEAP32[$183>>2]|0; //@line 590 "HyMES/dicho.c"
  $185 = 1 << $184; //@line 590 "HyMES/dicho.c"
  $186 = $l; //@line 590 "HyMES/dicho.c"
  $187 = ((($186)) + 8|0); //@line 590 "HyMES/dicho.c"
  $188 = HEAP32[$187>>2]|0; //@line 590 "HyMES/dicho.c"
  $189 = (($185) - ($188))|0; //@line 590 "HyMES/dicho.c"
  $190 = $189<<2; //@line 590 "HyMES/dicho.c"
  _memcpy(($179|0),($181|0),($190|0))|0; //@line 590 "HyMES/dicho.c"
  $191 = $l; //@line 591 "HyMES/dicho.c"
  $192 = ((($191)) + 12|0); //@line 591 "HyMES/dicho.c"
  $193 = HEAP32[$192>>2]|0; //@line 591 "HyMES/dicho.c"
  $i = $193; //@line 591 "HyMES/dicho.c"
  $j = 0; //@line 592 "HyMES/dicho.c"
  $k = 0; //@line 592 "HyMES/dicho.c"
  while(1) {
   $194 = $k; //@line 592 "HyMES/dicho.c"
   $195 = $l; //@line 592 "HyMES/dicho.c"
   $196 = ((($195)) + 4|0); //@line 592 "HyMES/dicho.c"
   $197 = HEAP32[$196>>2]|0; //@line 592 "HyMES/dicho.c"
   $198 = 1 << $197; //@line 592 "HyMES/dicho.c"
   $199 = $l; //@line 592 "HyMES/dicho.c"
   $200 = ((($199)) + 8|0); //@line 592 "HyMES/dicho.c"
   $201 = HEAP32[$200>>2]|0; //@line 592 "HyMES/dicho.c"
   $202 = (($198) - ($201))|0; //@line 592 "HyMES/dicho.c"
   $203 = ($194|0)<($202|0); //@line 592 "HyMES/dicho.c"
   if (!($203)) {
    break;
   }
   $204 = $j; //@line 592 "HyMES/dicho.c"
   $205 = $l; //@line 592 "HyMES/dicho.c"
   $206 = ((($205)) + 8|0); //@line 592 "HyMES/dicho.c"
   $207 = HEAP32[$206>>2]|0; //@line 592 "HyMES/dicho.c"
   $208 = ($204|0)<($207|0); //@line 592 "HyMES/dicho.c"
   if (!($208)) {
    break;
   }
   $209 = $k; //@line 593 "HyMES/dicho.c"
   $210 = $cw2; //@line 593 "HyMES/dicho.c"
   $211 = (($210) + ($209<<2)|0); //@line 593 "HyMES/dicho.c"
   $212 = HEAP32[$211>>2]|0; //@line 593 "HyMES/dicho.c"
   $213 = $i; //@line 593 "HyMES/dicho.c"
   $214 = ($212|0)==($213|0); //@line 593 "HyMES/dicho.c"
   if ($214) {
    $215 = $k; //@line 594 "HyMES/dicho.c"
    $216 = (($215) + 1)|0; //@line 594 "HyMES/dicho.c"
    $k = $216; //@line 594 "HyMES/dicho.c"
   } else {
    $217 = $i; //@line 596 "HyMES/dicho.c"
    $218 = $j; //@line 596 "HyMES/dicho.c"
    $219 = $l; //@line 596 "HyMES/dicho.c"
    $220 = HEAP32[$219>>2]|0; //@line 596 "HyMES/dicho.c"
    $221 = (($220) + ($218<<2)|0); //@line 596 "HyMES/dicho.c"
    HEAP32[$221>>2] = $217; //@line 596 "HyMES/dicho.c"
    $222 = $j; //@line 597 "HyMES/dicho.c"
    $223 = (($222) + 1)|0; //@line 597 "HyMES/dicho.c"
    $j = $223; //@line 597 "HyMES/dicho.c"
   }
   $224 = $i; //@line 592 "HyMES/dicho.c"
   $225 = (($224) + 1)|0; //@line 592 "HyMES/dicho.c"
   $i = $225; //@line 592 "HyMES/dicho.c"
  }
  while(1) {
   $226 = $j; //@line 599 "HyMES/dicho.c"
   $227 = $l; //@line 599 "HyMES/dicho.c"
   $228 = ((($227)) + 8|0); //@line 599 "HyMES/dicho.c"
   $229 = HEAP32[$228>>2]|0; //@line 599 "HyMES/dicho.c"
   $230 = ($226|0)<($229|0); //@line 599 "HyMES/dicho.c"
   if (!($230)) {
    break;
   }
   $231 = $i; //@line 600 "HyMES/dicho.c"
   $232 = $j; //@line 600 "HyMES/dicho.c"
   $233 = $l; //@line 600 "HyMES/dicho.c"
   $234 = HEAP32[$233>>2]|0; //@line 600 "HyMES/dicho.c"
   $235 = (($234) + ($232<<2)|0); //@line 600 "HyMES/dicho.c"
   HEAP32[$235>>2] = $231; //@line 600 "HyMES/dicho.c"
   $236 = $j; //@line 599 "HyMES/dicho.c"
   $237 = (($236) + 1)|0; //@line 599 "HyMES/dicho.c"
   $j = $237; //@line 599 "HyMES/dicho.c"
   $238 = $i; //@line 599 "HyMES/dicho.c"
   $239 = (($238) + 1)|0; //@line 599 "HyMES/dicho.c"
   $i = $239; //@line 599 "HyMES/dicho.c"
  }
  $240 = $cw2; //@line 601 "HyMES/dicho.c"
  _free($240); //@line 601 "HyMES/dicho.c"
  $241 = $l; //@line 586 "HyMES/dicho.c"
  $242 = ((($241)) + 24|0); //@line 586 "HyMES/dicho.c"
  $243 = HEAP32[$242>>2]|0; //@line 586 "HyMES/dicho.c"
  $l = $243; //@line 586 "HyMES/dicho.c"
 }
 $244 = HEAP32[5276>>2]|0; //@line 608 "HyMES/dicho.c"
 _liste_free($244); //@line 608 "HyMES/dicho.c"
 $245 = HEAP32[5284>>2]|0; //@line 609 "HyMES/dicho.c"
 _liste_free($245); //@line 609 "HyMES/dicho.c"
 $246 = $r; //@line 611 "HyMES/dicho.c"
 STACKTOP = sp;return ($246|0); //@line 611 "HyMES/dicho.c"
}
function _dicho_b2cw($input_message,$cw,$start,$len,$m,$t,$p) {
 $input_message = $input_message|0;
 $cw = $cw|0;
 $start = $start|0;
 $len = $len|0;
 $m = $m|0;
 $t = $t|0;
 $p = $p|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0;
 var $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0;
 var $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0;
 var $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0;
 var $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $c = 0;
 var $cw2 = 0, $d = 0, $end = 0, $i = 0, $j = 0, $k = 0, $l = 0, $p$byval_copy = 0, $reduc = 0, $state = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 96|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $p$byval_copy = sp + 64|0;
 $vararg_buffer = sp;
 $1 = $input_message;
 $2 = $cw;
 $3 = $start;
 $4 = $len;
 $5 = $m;
 $6 = $t;
 $7 = $6; //@line 634 "HyMES/dicho.c"
 $8 = ((($p)) + 12|0); //@line 634 "HyMES/dicho.c"
 $9 = HEAP32[$8>>2]|0; //@line 634 "HyMES/dicho.c"
 $10 = ($7|0)!=($9|0); //@line 634 "HyMES/dicho.c"
 if ($10) {
  (_printf(9535,$vararg_buffer)|0); //@line 635 "HyMES/dicho.c"
  _exit(0); //@line 636 "HyMES/dicho.c"
  // unreachable; //@line 636 "HyMES/dicho.c"
 }
 $11 = $5; //@line 634 "HyMES/dicho.c"
 $12 = ((($p)) + 8|0); //@line 634 "HyMES/dicho.c"
 $13 = HEAP32[$12>>2]|0; //@line 634 "HyMES/dicho.c"
 $14 = ($11|0)!=($13|0); //@line 634 "HyMES/dicho.c"
 if ($14) {
  (_printf(9535,$vararg_buffer)|0); //@line 635 "HyMES/dicho.c"
  _exit(0); //@line 636 "HyMES/dicho.c"
  // unreachable; //@line 636 "HyMES/dicho.c"
 }
 $15 = $3; //@line 639 "HyMES/dicho.c"
 $16 = (($15|0) % 8)&-1; //@line 639 "HyMES/dicho.c"
 $17 = ($16|0)!=(0); //@line 639 "HyMES/dicho.c"
 if ($17) {
  $18 = $3; //@line 640 "HyMES/dicho.c"
  $19 = (($18|0) / 8)&-1; //@line 640 "HyMES/dicho.c"
  $20 = $1; //@line 640 "HyMES/dicho.c"
  $21 = (($20) + ($19)|0); //@line 640 "HyMES/dicho.c"
  $22 = HEAP8[$21>>0]|0; //@line 640 "HyMES/dicho.c"
  $c = $22; //@line 640 "HyMES/dicho.c"
  $23 = $3; //@line 641 "HyMES/dicho.c"
  $24 = (($23|0) % 8)&-1; //@line 641 "HyMES/dicho.c"
  $25 = $3; //@line 641 "HyMES/dicho.c"
  $26 = (($25|0) / 8)&-1; //@line 641 "HyMES/dicho.c"
  $27 = $1; //@line 641 "HyMES/dicho.c"
  $28 = (($27) + ($26)|0); //@line 641 "HyMES/dicho.c"
  $29 = HEAP8[$28>>0]|0; //@line 641 "HyMES/dicho.c"
  $30 = $29&255; //@line 641 "HyMES/dicho.c"
  $31 = $30 >> $24; //@line 641 "HyMES/dicho.c"
  $32 = $31&255; //@line 641 "HyMES/dicho.c"
  HEAP8[$28>>0] = $32; //@line 641 "HyMES/dicho.c"
 }
 $33 = $3; //@line 643 "HyMES/dicho.c"
 $34 = $4; //@line 643 "HyMES/dicho.c"
 $35 = (($33) + ($34))|0; //@line 643 "HyMES/dicho.c"
 $end = $35; //@line 643 "HyMES/dicho.c"
 $36 = $end; //@line 644 "HyMES/dicho.c"
 $37 = (($36|0) % 8)&-1; //@line 644 "HyMES/dicho.c"
 $38 = ($37|0)!=(0); //@line 644 "HyMES/dicho.c"
 if ($38) {
  $39 = $end; //@line 645 "HyMES/dicho.c"
  $40 = (($39|0) / 8)&-1; //@line 645 "HyMES/dicho.c"
  $41 = $1; //@line 645 "HyMES/dicho.c"
  $42 = (($41) + ($40)|0); //@line 645 "HyMES/dicho.c"
  $43 = HEAP8[$42>>0]|0; //@line 645 "HyMES/dicho.c"
  $d = $43; //@line 645 "HyMES/dicho.c"
  $44 = $end; //@line 646 "HyMES/dicho.c"
  $45 = (($44|0) % 8)&-1; //@line 646 "HyMES/dicho.c"
  $46 = (8 - ($45))|0; //@line 646 "HyMES/dicho.c"
  $47 = $end; //@line 646 "HyMES/dicho.c"
  $48 = (($47|0) / 8)&-1; //@line 646 "HyMES/dicho.c"
  $49 = $1; //@line 646 "HyMES/dicho.c"
  $50 = (($49) + ($48)|0); //@line 646 "HyMES/dicho.c"
  $51 = HEAP8[$50>>0]|0; //@line 646 "HyMES/dicho.c"
  $52 = $51&255; //@line 646 "HyMES/dicho.c"
  $53 = $52 << $46; //@line 646 "HyMES/dicho.c"
  $54 = $53&255; //@line 646 "HyMES/dicho.c"
  HEAP8[$50>>0] = $54; //@line 646 "HyMES/dicho.c"
 }
 $55 = $1; //@line 649 "HyMES/dicho.c"
 $56 = $end; //@line 649 "HyMES/dicho.c"
 $57 = (_breadinit($55,$56)|0); //@line 649 "HyMES/dicho.c"
 $58 = (_arith_init($57)|0); //@line 649 "HyMES/dicho.c"
 $state = $58; //@line 649 "HyMES/dicho.c"
 $59 = $5; //@line 662 "HyMES/dicho.c"
 $60 = HEAP32[$p>>2]|0; //@line 662 "HyMES/dicho.c"
 $61 = (($59) - ($60))|0; //@line 662 "HyMES/dicho.c"
 $reduc = $61; //@line 662 "HyMES/dicho.c"
 $62 = $state; //@line 663 "HyMES/dicho.c"
 $63 = ((($62)) + 12|0); //@line 663 "HyMES/dicho.c"
 $64 = HEAP32[$63>>2]|0; //@line 663 "HyMES/dicho.c"
 $65 = $3; //@line 663 "HyMES/dicho.c"
 $66 = $reduc; //@line 663 "HyMES/dicho.c"
 $67 = $6; //@line 663 "HyMES/dicho.c"
 $68 = Math_imul($66, $67)|0; //@line 663 "HyMES/dicho.c"
 $69 = (($65) + ($68))|0; //@line 663 "HyMES/dicho.c"
 _bread_changer_position($64,$69); //@line 663 "HyMES/dicho.c"
 $70 = ((($p)) + 4|0); //@line 665 "HyMES/dicho.c"
 $71 = HEAP32[$70>>2]|0; //@line 665 "HyMES/dicho.c"
 $72 = $71<<2; //@line 665 "HyMES/dicho.c"
 $73 = (_malloc($72)|0); //@line 665 "HyMES/dicho.c"
 $cw2 = $73; //@line 665 "HyMES/dicho.c"
 $74 = $cw2; //@line 667 "HyMES/dicho.c"
 $75 = $state; //@line 667 "HyMES/dicho.c"
 ;HEAP32[$p$byval_copy>>2]=HEAP32[$p>>2]|0;HEAP32[$p$byval_copy+4>>2]=HEAP32[$p+4>>2]|0;HEAP32[$p$byval_copy+8>>2]=HEAP32[$p+8>>2]|0;HEAP32[$p$byval_copy+12>>2]=HEAP32[$p+12>>2]|0;HEAP32[$p$byval_copy+16>>2]=HEAP32[$p+16>>2]|0;HEAP32[$p$byval_copy+20>>2]=HEAP32[$p+20>>2]|0;HEAP32[$p$byval_copy+24>>2]=HEAP32[$p+24>>2]|0; //@line 667 "HyMES/dicho.c"
 $76 = (_dichoinv($74,$75,$p$byval_copy)|0); //@line 667 "HyMES/dicho.c"
 $l = $76; //@line 667 "HyMES/dicho.c"
 $77 = ((($p)) + 4|0); //@line 669 "HyMES/dicho.c"
 $78 = HEAP32[$77>>2]|0; //@line 669 "HyMES/dicho.c"
 $79 = $6; //@line 669 "HyMES/dicho.c"
 $80 = ($78|0)==($79|0); //@line 669 "HyMES/dicho.c"
 L13: do {
  if ($80) {
   $81 = $2; //@line 670 "HyMES/dicho.c"
   $82 = $cw2; //@line 670 "HyMES/dicho.c"
   $83 = $6; //@line 670 "HyMES/dicho.c"
   $84 = $83<<2; //@line 670 "HyMES/dicho.c"
   _memcpy(($81|0),($82|0),($84|0))|0; //@line 670 "HyMES/dicho.c"
  } else {
   $k = 0; //@line 672 "HyMES/dicho.c"
   $j = 0; //@line 673 "HyMES/dicho.c"
   while(1) {
    $85 = $j; //@line 673 "HyMES/dicho.c"
    $86 = $cw2; //@line 673 "HyMES/dicho.c"
    $87 = HEAP32[$86>>2]|0; //@line 673 "HyMES/dicho.c"
    $88 = ($85|0)<($87|0); //@line 673 "HyMES/dicho.c"
    if (!($88)) {
     break;
    }
    $89 = $j; //@line 674 "HyMES/dicho.c"
    $90 = $k; //@line 674 "HyMES/dicho.c"
    $91 = $2; //@line 674 "HyMES/dicho.c"
    $92 = (($91) + ($90<<2)|0); //@line 674 "HyMES/dicho.c"
    HEAP32[$92>>2] = $89; //@line 674 "HyMES/dicho.c"
    $93 = $k; //@line 673 "HyMES/dicho.c"
    $94 = (($93) + 1)|0; //@line 673 "HyMES/dicho.c"
    $k = $94; //@line 673 "HyMES/dicho.c"
    $95 = $j; //@line 673 "HyMES/dicho.c"
    $96 = (($95) + 1)|0; //@line 673 "HyMES/dicho.c"
    $j = $96; //@line 673 "HyMES/dicho.c"
   }
   $i = 1; //@line 675 "HyMES/dicho.c"
   while(1) {
    $97 = $i; //@line 675 "HyMES/dicho.c"
    $98 = ((($p)) + 4|0); //@line 675 "HyMES/dicho.c"
    $99 = HEAP32[$98>>2]|0; //@line 675 "HyMES/dicho.c"
    $100 = ($97|0)<($99|0); //@line 675 "HyMES/dicho.c"
    if (!($100)) {
     break;
    }
    $101 = $i; //@line 676 "HyMES/dicho.c"
    $102 = (($101) - 1)|0; //@line 676 "HyMES/dicho.c"
    $103 = $cw2; //@line 676 "HyMES/dicho.c"
    $104 = (($103) + ($102<<2)|0); //@line 676 "HyMES/dicho.c"
    $105 = HEAP32[$104>>2]|0; //@line 676 "HyMES/dicho.c"
    $106 = (($105) + 1)|0; //@line 676 "HyMES/dicho.c"
    $j = $106; //@line 676 "HyMES/dicho.c"
    while(1) {
     $107 = $j; //@line 676 "HyMES/dicho.c"
     $108 = $i; //@line 676 "HyMES/dicho.c"
     $109 = $cw2; //@line 676 "HyMES/dicho.c"
     $110 = (($109) + ($108<<2)|0); //@line 676 "HyMES/dicho.c"
     $111 = HEAP32[$110>>2]|0; //@line 676 "HyMES/dicho.c"
     $112 = ($107|0)<($111|0); //@line 676 "HyMES/dicho.c"
     if (!($112)) {
      break;
     }
     $113 = $j; //@line 677 "HyMES/dicho.c"
     $114 = $k; //@line 677 "HyMES/dicho.c"
     $115 = $2; //@line 677 "HyMES/dicho.c"
     $116 = (($115) + ($114<<2)|0); //@line 677 "HyMES/dicho.c"
     HEAP32[$116>>2] = $113; //@line 677 "HyMES/dicho.c"
     $117 = $k; //@line 676 "HyMES/dicho.c"
     $118 = (($117) + 1)|0; //@line 676 "HyMES/dicho.c"
     $k = $118; //@line 676 "HyMES/dicho.c"
     $119 = $j; //@line 676 "HyMES/dicho.c"
     $120 = (($119) + 1)|0; //@line 676 "HyMES/dicho.c"
     $j = $120; //@line 676 "HyMES/dicho.c"
    }
    $121 = $i; //@line 675 "HyMES/dicho.c"
    $122 = (($121) + 1)|0; //@line 675 "HyMES/dicho.c"
    $i = $122; //@line 675 "HyMES/dicho.c"
   }
   $123 = ((($p)) + 4|0); //@line 679 "HyMES/dicho.c"
   $124 = HEAP32[$123>>2]|0; //@line 679 "HyMES/dicho.c"
   $125 = (($124) - 1)|0; //@line 679 "HyMES/dicho.c"
   $126 = $cw2; //@line 679 "HyMES/dicho.c"
   $127 = (($126) + ($125<<2)|0); //@line 679 "HyMES/dicho.c"
   $128 = HEAP32[$127>>2]|0; //@line 679 "HyMES/dicho.c"
   $129 = (($128) + 1)|0; //@line 679 "HyMES/dicho.c"
   $j = $129; //@line 679 "HyMES/dicho.c"
   while(1) {
    $130 = $j; //@line 679 "HyMES/dicho.c"
    $131 = $5; //@line 679 "HyMES/dicho.c"
    $132 = 1 << $131; //@line 679 "HyMES/dicho.c"
    $133 = ($130|0)<($132|0); //@line 679 "HyMES/dicho.c"
    if (!($133)) {
     break L13;
    }
    $134 = $j; //@line 680 "HyMES/dicho.c"
    $135 = $k; //@line 680 "HyMES/dicho.c"
    $136 = $2; //@line 680 "HyMES/dicho.c"
    $137 = (($136) + ($135<<2)|0); //@line 680 "HyMES/dicho.c"
    HEAP32[$137>>2] = $134; //@line 680 "HyMES/dicho.c"
    $138 = $k; //@line 679 "HyMES/dicho.c"
    $139 = (($138) + 1)|0; //@line 679 "HyMES/dicho.c"
    $k = $139; //@line 679 "HyMES/dicho.c"
    $140 = $j; //@line 679 "HyMES/dicho.c"
    $141 = (($140) + 1)|0; //@line 679 "HyMES/dicho.c"
    $j = $141; //@line 679 "HyMES/dicho.c"
   }
  }
 } while(0);
 $142 = $cw2; //@line 682 "HyMES/dicho.c"
 _free($142); //@line 682 "HyMES/dicho.c"
 $143 = $reduc; //@line 684 "HyMES/dicho.c"
 $144 = ($143|0)>(0); //@line 684 "HyMES/dicho.c"
 if ($144) {
  $145 = $state; //@line 686 "HyMES/dicho.c"
  $146 = ((($145)) + 12|0); //@line 686 "HyMES/dicho.c"
  $147 = HEAP32[$146>>2]|0; //@line 686 "HyMES/dicho.c"
  $148 = $3; //@line 686 "HyMES/dicho.c"
  _bread_changer_position($147,$148); //@line 686 "HyMES/dicho.c"
  $j = 0; //@line 687 "HyMES/dicho.c"
  while(1) {
   $149 = $j; //@line 687 "HyMES/dicho.c"
   $150 = $6; //@line 687 "HyMES/dicho.c"
   $151 = ($149|0)<($150|0); //@line 687 "HyMES/dicho.c"
   if (!($151)) {
    break;
   }
   $152 = $j; //@line 688 "HyMES/dicho.c"
   $153 = $2; //@line 688 "HyMES/dicho.c"
   $154 = (($153) + ($152<<2)|0); //@line 688 "HyMES/dicho.c"
   $155 = HEAP32[$154>>2]|0; //@line 688 "HyMES/dicho.c"
   $156 = $reduc; //@line 688 "HyMES/dicho.c"
   $157 = $155 << $156; //@line 688 "HyMES/dicho.c"
   $158 = $reduc; //@line 688 "HyMES/dicho.c"
   $159 = $state; //@line 688 "HyMES/dicho.c"
   $160 = ((($159)) + 12|0); //@line 688 "HyMES/dicho.c"
   $161 = HEAP32[$160>>2]|0; //@line 688 "HyMES/dicho.c"
   $162 = (_bread($158,$161)|0); //@line 688 "HyMES/dicho.c"
   $163 = $157 ^ $162; //@line 688 "HyMES/dicho.c"
   $164 = $j; //@line 688 "HyMES/dicho.c"
   $165 = $2; //@line 688 "HyMES/dicho.c"
   $166 = (($165) + ($164<<2)|0); //@line 688 "HyMES/dicho.c"
   HEAP32[$166>>2] = $163; //@line 688 "HyMES/dicho.c"
   $167 = $j; //@line 687 "HyMES/dicho.c"
   $168 = (($167) + 1)|0; //@line 687 "HyMES/dicho.c"
   $j = $168; //@line 687 "HyMES/dicho.c"
  }
  $169 = $reduc; //@line 689 "HyMES/dicho.c"
  $170 = $6; //@line 689 "HyMES/dicho.c"
  $171 = Math_imul($169, $170)|0; //@line 689 "HyMES/dicho.c"
  $172 = $l; //@line 689 "HyMES/dicho.c"
  $173 = (($172) + ($171))|0; //@line 689 "HyMES/dicho.c"
  $l = $173; //@line 689 "HyMES/dicho.c"
 }
 $174 = $state; //@line 692 "HyMES/dicho.c"
 $175 = ((($174)) + 12|0); //@line 692 "HyMES/dicho.c"
 $176 = HEAP32[$175>>2]|0; //@line 692 "HyMES/dicho.c"
 _breadclose($176); //@line 692 "HyMES/dicho.c"
 $177 = $state; //@line 693 "HyMES/dicho.c"
 _free($177); //@line 693 "HyMES/dicho.c"
 $178 = $3; //@line 695 "HyMES/dicho.c"
 $179 = (($178|0) % 8)&-1; //@line 695 "HyMES/dicho.c"
 $180 = ($179|0)!=(0); //@line 695 "HyMES/dicho.c"
 if ($180) {
  $181 = $c; //@line 696 "HyMES/dicho.c"
  $182 = $3; //@line 696 "HyMES/dicho.c"
  $183 = (($182|0) / 8)&-1; //@line 696 "HyMES/dicho.c"
  $184 = $1; //@line 696 "HyMES/dicho.c"
  $185 = (($184) + ($183)|0); //@line 696 "HyMES/dicho.c"
  HEAP8[$185>>0] = $181; //@line 696 "HyMES/dicho.c"
 }
 $186 = $end; //@line 698 "HyMES/dicho.c"
 $187 = (($186|0) % 8)&-1; //@line 698 "HyMES/dicho.c"
 $188 = ($187|0)!=(0); //@line 698 "HyMES/dicho.c"
 if ($188) {
  $189 = $d; //@line 699 "HyMES/dicho.c"
  $190 = $end; //@line 699 "HyMES/dicho.c"
  $191 = (($190|0) / 8)&-1; //@line 699 "HyMES/dicho.c"
  $192 = $1; //@line 699 "HyMES/dicho.c"
  $193 = (($192) + ($191)|0); //@line 699 "HyMES/dicho.c"
  HEAP8[$193>>0] = $189; //@line 699 "HyMES/dicho.c"
 }
 $194 = $l; //@line 702 "HyMES/dicho.c"
 $195 = $4; //@line 702 "HyMES/dicho.c"
 $196 = ($194|0)<($195|0); //@line 702 "HyMES/dicho.c"
 if ($196) {
  $0 = -1; //@line 703 "HyMES/dicho.c"
  $198 = $0; //@line 706 "HyMES/dicho.c"
  STACKTOP = sp;return ($198|0); //@line 706 "HyMES/dicho.c"
 } else {
  $197 = $l; //@line 705 "HyMES/dicho.c"
  $0 = $197; //@line 705 "HyMES/dicho.c"
  $198 = $0; //@line 706 "HyMES/dicho.c"
  STACKTOP = sp;return ($198|0); //@line 706 "HyMES/dicho.c"
 }
 return (0)|0;
}
function _dicho_cw2b($cw,$output_message,$start,$len,$m,$t,$p) {
 $cw = $cw|0;
 $output_message = $output_message|0;
 $start = $start|0;
 $len = $len|0;
 $m = $m|0;
 $t = $t|0;
 $p = $p|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0;
 var $206 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0;
 var $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0;
 var $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0;
 var $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0;
 var $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $c = 0, $cw2 = 0, $end = 0, $i = 0, $j = 0, $k = 0, $l = 0, $mask = 0, $p$byval_copy = 0, $reduc = 0, $state = 0, $vararg_buffer = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 112|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $p$byval_copy = sp + 68|0;
 $vararg_buffer = sp;
 $1 = $cw;
 $2 = $output_message;
 $3 = $start;
 $4 = $len;
 $5 = $m;
 $6 = $t;
 $7 = $6; //@line 729 "HyMES/dicho.c"
 $8 = ((($p)) + 12|0); //@line 729 "HyMES/dicho.c"
 $9 = HEAP32[$8>>2]|0; //@line 729 "HyMES/dicho.c"
 $10 = ($7|0)!=($9|0); //@line 729 "HyMES/dicho.c"
 if ($10) {
  (_printf(9535,$vararg_buffer)|0); //@line 730 "HyMES/dicho.c"
  _exit(0); //@line 731 "HyMES/dicho.c"
  // unreachable; //@line 731 "HyMES/dicho.c"
 }
 $11 = $5; //@line 729 "HyMES/dicho.c"
 $12 = ((($p)) + 8|0); //@line 729 "HyMES/dicho.c"
 $13 = HEAP32[$12>>2]|0; //@line 729 "HyMES/dicho.c"
 $14 = ($11|0)!=($13|0); //@line 729 "HyMES/dicho.c"
 if ($14) {
  (_printf(9535,$vararg_buffer)|0); //@line 730 "HyMES/dicho.c"
  _exit(0); //@line 731 "HyMES/dicho.c"
  // unreachable; //@line 731 "HyMES/dicho.c"
 }
 $15 = $3; //@line 734 "HyMES/dicho.c"
 $16 = (($15|0) % 8)&-1; //@line 734 "HyMES/dicho.c"
 $17 = ($16|0)!=(0); //@line 734 "HyMES/dicho.c"
 if ($17) {
  $18 = $3; //@line 735 "HyMES/dicho.c"
  $19 = (($18|0) / 8)&-1; //@line 735 "HyMES/dicho.c"
  $20 = $2; //@line 735 "HyMES/dicho.c"
  $21 = (($20) + ($19)|0); //@line 735 "HyMES/dicho.c"
  $22 = HEAP8[$21>>0]|0; //@line 735 "HyMES/dicho.c"
  $23 = $22&255; //@line 735 "HyMES/dicho.c"
  $24 = $3; //@line 735 "HyMES/dicho.c"
  $25 = (($24|0) % 8)&-1; //@line 735 "HyMES/dicho.c"
  $26 = 1 << $25; //@line 735 "HyMES/dicho.c"
  $27 = (($26) - 1)|0; //@line 735 "HyMES/dicho.c"
  $28 = $23 & $27; //@line 735 "HyMES/dicho.c"
  $29 = $28&255; //@line 735 "HyMES/dicho.c"
  $c = $29; //@line 735 "HyMES/dicho.c"
  $30 = $3; //@line 736 "HyMES/dicho.c"
  $31 = (($30|0) / 8)&-1; //@line 736 "HyMES/dicho.c"
  $32 = $2; //@line 736 "HyMES/dicho.c"
  $33 = (($32) + ($31)|0); //@line 736 "HyMES/dicho.c"
  HEAP8[$33>>0] = 0; //@line 736 "HyMES/dicho.c"
 }
 $34 = $3; //@line 738 "HyMES/dicho.c"
 $35 = $4; //@line 738 "HyMES/dicho.c"
 $36 = (($34) + ($35))|0; //@line 738 "HyMES/dicho.c"
 $end = $36; //@line 738 "HyMES/dicho.c"
 $37 = $2; //@line 740 "HyMES/dicho.c"
 $38 = $end; //@line 740 "HyMES/dicho.c"
 $39 = (_bwriteinit($37,$38)|0); //@line 740 "HyMES/dicho.c"
 $40 = (_arith_init($39)|0); //@line 740 "HyMES/dicho.c"
 $state = $40; //@line 740 "HyMES/dicho.c"
 $41 = $state; //@line 742 "HyMES/dicho.c"
 $42 = ((($41)) + 12|0); //@line 742 "HyMES/dicho.c"
 $43 = HEAP32[$42>>2]|0; //@line 742 "HyMES/dicho.c"
 $44 = $3; //@line 742 "HyMES/dicho.c"
 _bwrite_changer_position($43,$44); //@line 742 "HyMES/dicho.c"
 $45 = $5; //@line 753 "HyMES/dicho.c"
 $46 = HEAP32[$p>>2]|0; //@line 753 "HyMES/dicho.c"
 $47 = (($45) - ($46))|0; //@line 753 "HyMES/dicho.c"
 $reduc = $47; //@line 753 "HyMES/dicho.c"
 $48 = $reduc; //@line 754 "HyMES/dicho.c"
 $49 = ($48|0)>(0); //@line 754 "HyMES/dicho.c"
 L10: do {
  if ($49) {
   $50 = $reduc; //@line 756 "HyMES/dicho.c"
   $51 = 1 << $50; //@line 756 "HyMES/dicho.c"
   $52 = (($51) - 1)|0; //@line 756 "HyMES/dicho.c"
   $mask = $52; //@line 756 "HyMES/dicho.c"
   $j = 0; //@line 757 "HyMES/dicho.c"
   while(1) {
    $53 = $j; //@line 757 "HyMES/dicho.c"
    $54 = $6; //@line 757 "HyMES/dicho.c"
    $55 = ($53|0)<($54|0); //@line 757 "HyMES/dicho.c"
    if (!($55)) {
     break L10;
    }
    $56 = $j; //@line 758 "HyMES/dicho.c"
    $57 = $1; //@line 758 "HyMES/dicho.c"
    $58 = (($57) + ($56<<2)|0); //@line 758 "HyMES/dicho.c"
    $59 = HEAP32[$58>>2]|0; //@line 758 "HyMES/dicho.c"
    $60 = $mask; //@line 758 "HyMES/dicho.c"
    $61 = $59 & $60; //@line 758 "HyMES/dicho.c"
    $62 = $reduc; //@line 758 "HyMES/dicho.c"
    $63 = $state; //@line 758 "HyMES/dicho.c"
    $64 = ((($63)) + 12|0); //@line 758 "HyMES/dicho.c"
    $65 = HEAP32[$64>>2]|0; //@line 758 "HyMES/dicho.c"
    _bwrite($61,$62,$65); //@line 758 "HyMES/dicho.c"
    $66 = $j; //@line 757 "HyMES/dicho.c"
    $67 = (($66) + 1)|0; //@line 757 "HyMES/dicho.c"
    $j = $67; //@line 757 "HyMES/dicho.c"
   }
  }
 } while(0);
 $68 = ((($p)) + 4|0); //@line 761 "HyMES/dicho.c"
 $69 = HEAP32[$68>>2]|0; //@line 761 "HyMES/dicho.c"
 $70 = $69<<2; //@line 761 "HyMES/dicho.c"
 $71 = (_malloc($70)|0); //@line 761 "HyMES/dicho.c"
 $cw2 = $71; //@line 761 "HyMES/dicho.c"
 $72 = $6; //@line 763 "HyMES/dicho.c"
 $73 = ((($p)) + 4|0); //@line 763 "HyMES/dicho.c"
 $74 = HEAP32[$73>>2]|0; //@line 763 "HyMES/dicho.c"
 $75 = ($72|0)==($74|0); //@line 763 "HyMES/dicho.c"
 L16: do {
  if ($75) {
   $j = 0; //@line 764 "HyMES/dicho.c"
   while(1) {
    $76 = $j; //@line 764 "HyMES/dicho.c"
    $77 = $6; //@line 764 "HyMES/dicho.c"
    $78 = ($76|0)<($77|0); //@line 764 "HyMES/dicho.c"
    if (!($78)) {
     break L16;
    }
    $79 = $j; //@line 765 "HyMES/dicho.c"
    $80 = $1; //@line 765 "HyMES/dicho.c"
    $81 = (($80) + ($79<<2)|0); //@line 765 "HyMES/dicho.c"
    $82 = HEAP32[$81>>2]|0; //@line 765 "HyMES/dicho.c"
    $83 = $reduc; //@line 765 "HyMES/dicho.c"
    $84 = $82 >> $83; //@line 765 "HyMES/dicho.c"
    $85 = $j; //@line 765 "HyMES/dicho.c"
    $86 = $cw2; //@line 765 "HyMES/dicho.c"
    $87 = (($86) + ($85<<2)|0); //@line 765 "HyMES/dicho.c"
    HEAP32[$87>>2] = $84; //@line 765 "HyMES/dicho.c"
    $88 = $j; //@line 764 "HyMES/dicho.c"
    $89 = (($88) + 1)|0; //@line 764 "HyMES/dicho.c"
    $j = $89; //@line 764 "HyMES/dicho.c"
   }
  } else {
   $k = 0; //@line 768 "HyMES/dicho.c"
   $j = 0; //@line 769 "HyMES/dicho.c"
   while(1) {
    $90 = $j; //@line 769 "HyMES/dicho.c"
    $91 = $1; //@line 769 "HyMES/dicho.c"
    $92 = HEAP32[$91>>2]|0; //@line 769 "HyMES/dicho.c"
    $93 = $reduc; //@line 769 "HyMES/dicho.c"
    $94 = $92 >> $93; //@line 769 "HyMES/dicho.c"
    $95 = ($90|0)<($94|0); //@line 769 "HyMES/dicho.c"
    if (!($95)) {
     break;
    }
    $96 = $j; //@line 770 "HyMES/dicho.c"
    $97 = $k; //@line 770 "HyMES/dicho.c"
    $98 = $cw2; //@line 770 "HyMES/dicho.c"
    $99 = (($98) + ($97<<2)|0); //@line 770 "HyMES/dicho.c"
    HEAP32[$99>>2] = $96; //@line 770 "HyMES/dicho.c"
    $100 = $k; //@line 769 "HyMES/dicho.c"
    $101 = (($100) + 1)|0; //@line 769 "HyMES/dicho.c"
    $k = $101; //@line 769 "HyMES/dicho.c"
    $102 = $j; //@line 769 "HyMES/dicho.c"
    $103 = (($102) + 1)|0; //@line 769 "HyMES/dicho.c"
    $j = $103; //@line 769 "HyMES/dicho.c"
   }
   $i = 1; //@line 771 "HyMES/dicho.c"
   while(1) {
    $104 = $i; //@line 771 "HyMES/dicho.c"
    $105 = $6; //@line 771 "HyMES/dicho.c"
    $106 = ($104|0)<($105|0); //@line 771 "HyMES/dicho.c"
    if (!($106)) {
     break;
    }
    $107 = $i; //@line 772 "HyMES/dicho.c"
    $108 = (($107) - 1)|0; //@line 772 "HyMES/dicho.c"
    $109 = $1; //@line 772 "HyMES/dicho.c"
    $110 = (($109) + ($108<<2)|0); //@line 772 "HyMES/dicho.c"
    $111 = HEAP32[$110>>2]|0; //@line 772 "HyMES/dicho.c"
    $112 = $reduc; //@line 772 "HyMES/dicho.c"
    $113 = $111 >> $112; //@line 772 "HyMES/dicho.c"
    $114 = (($113) + 1)|0; //@line 772 "HyMES/dicho.c"
    $j = $114; //@line 772 "HyMES/dicho.c"
    while(1) {
     $115 = $j; //@line 772 "HyMES/dicho.c"
     $116 = $i; //@line 772 "HyMES/dicho.c"
     $117 = $1; //@line 772 "HyMES/dicho.c"
     $118 = (($117) + ($116<<2)|0); //@line 772 "HyMES/dicho.c"
     $119 = HEAP32[$118>>2]|0; //@line 772 "HyMES/dicho.c"
     $120 = $reduc; //@line 772 "HyMES/dicho.c"
     $121 = $119 >> $120; //@line 772 "HyMES/dicho.c"
     $122 = ($115|0)<($121|0); //@line 772 "HyMES/dicho.c"
     if (!($122)) {
      break;
     }
     $123 = $j; //@line 773 "HyMES/dicho.c"
     $124 = $k; //@line 773 "HyMES/dicho.c"
     $125 = $cw2; //@line 773 "HyMES/dicho.c"
     $126 = (($125) + ($124<<2)|0); //@line 773 "HyMES/dicho.c"
     HEAP32[$126>>2] = $123; //@line 773 "HyMES/dicho.c"
     $127 = $k; //@line 772 "HyMES/dicho.c"
     $128 = (($127) + 1)|0; //@line 772 "HyMES/dicho.c"
     $k = $128; //@line 772 "HyMES/dicho.c"
     $129 = $j; //@line 772 "HyMES/dicho.c"
     $130 = (($129) + 1)|0; //@line 772 "HyMES/dicho.c"
     $j = $130; //@line 772 "HyMES/dicho.c"
    }
    $131 = $i; //@line 771 "HyMES/dicho.c"
    $132 = (($131) + 1)|0; //@line 771 "HyMES/dicho.c"
    $i = $132; //@line 771 "HyMES/dicho.c"
   }
   $133 = $6; //@line 775 "HyMES/dicho.c"
   $134 = (($133) - 1)|0; //@line 775 "HyMES/dicho.c"
   $135 = $1; //@line 775 "HyMES/dicho.c"
   $136 = (($135) + ($134<<2)|0); //@line 775 "HyMES/dicho.c"
   $137 = HEAP32[$136>>2]|0; //@line 775 "HyMES/dicho.c"
   $138 = $reduc; //@line 775 "HyMES/dicho.c"
   $139 = $137 >> $138; //@line 775 "HyMES/dicho.c"
   $140 = (($139) + 1)|0; //@line 775 "HyMES/dicho.c"
   $j = $140; //@line 775 "HyMES/dicho.c"
   while(1) {
    $141 = $j; //@line 775 "HyMES/dicho.c"
    $142 = $5; //@line 775 "HyMES/dicho.c"
    $143 = 1 << $142; //@line 775 "HyMES/dicho.c"
    $144 = ($141|0)<($143|0); //@line 775 "HyMES/dicho.c"
    if (!($144)) {
     break L16;
    }
    $145 = $j; //@line 776 "HyMES/dicho.c"
    $146 = $k; //@line 776 "HyMES/dicho.c"
    $147 = $cw2; //@line 776 "HyMES/dicho.c"
    $148 = (($147) + ($146<<2)|0); //@line 776 "HyMES/dicho.c"
    HEAP32[$148>>2] = $145; //@line 776 "HyMES/dicho.c"
    $149 = $k; //@line 775 "HyMES/dicho.c"
    $150 = (($149) + 1)|0; //@line 775 "HyMES/dicho.c"
    $k = $150; //@line 775 "HyMES/dicho.c"
    $151 = $j; //@line 775 "HyMES/dicho.c"
    $152 = (($151) + 1)|0; //@line 775 "HyMES/dicho.c"
    $j = $152; //@line 775 "HyMES/dicho.c"
   }
  }
 } while(0);
 $153 = $reduc; //@line 779 "HyMES/dicho.c"
 $154 = $6; //@line 779 "HyMES/dicho.c"
 $155 = Math_imul($153, $154)|0; //@line 779 "HyMES/dicho.c"
 $156 = $cw2; //@line 779 "HyMES/dicho.c"
 $157 = $state; //@line 779 "HyMES/dicho.c"
 ;HEAP32[$p$byval_copy>>2]=HEAP32[$p>>2]|0;HEAP32[$p$byval_copy+4>>2]=HEAP32[$p+4>>2]|0;HEAP32[$p$byval_copy+8>>2]=HEAP32[$p+8>>2]|0;HEAP32[$p$byval_copy+12>>2]=HEAP32[$p+12>>2]|0;HEAP32[$p$byval_copy+16>>2]=HEAP32[$p+16>>2]|0;HEAP32[$p$byval_copy+20>>2]=HEAP32[$p+20>>2]|0;HEAP32[$p$byval_copy+24>>2]=HEAP32[$p+24>>2]|0; //@line 779 "HyMES/dicho.c"
 $158 = (_dicho($156,$157,$p$byval_copy)|0); //@line 779 "HyMES/dicho.c"
 $159 = (($155) + ($158))|0; //@line 779 "HyMES/dicho.c"
 $l = $159; //@line 779 "HyMES/dicho.c"
 $160 = $cw2; //@line 781 "HyMES/dicho.c"
 _free($160); //@line 781 "HyMES/dicho.c"
 $161 = $state; //@line 783 "HyMES/dicho.c"
 $162 = ((($161)) + 12|0); //@line 783 "HyMES/dicho.c"
 $163 = HEAP32[$162>>2]|0; //@line 783 "HyMES/dicho.c"
 _bwriteclose($163); //@line 783 "HyMES/dicho.c"
 $164 = $state; //@line 784 "HyMES/dicho.c"
 _free($164); //@line 784 "HyMES/dicho.c"
 $165 = $3; //@line 786 "HyMES/dicho.c"
 $166 = (($165|0) % 8)&-1; //@line 786 "HyMES/dicho.c"
 $167 = ($166|0)!=(0); //@line 786 "HyMES/dicho.c"
 if ($167) {
  $168 = $3; //@line 787 "HyMES/dicho.c"
  $169 = (($168|0) % 8)&-1; //@line 787 "HyMES/dicho.c"
  $170 = $3; //@line 787 "HyMES/dicho.c"
  $171 = (($170|0) / 8)&-1; //@line 787 "HyMES/dicho.c"
  $172 = $2; //@line 787 "HyMES/dicho.c"
  $173 = (($172) + ($171)|0); //@line 787 "HyMES/dicho.c"
  $174 = HEAP8[$173>>0]|0; //@line 787 "HyMES/dicho.c"
  $175 = $174&255; //@line 787 "HyMES/dicho.c"
  $176 = $175 << $169; //@line 787 "HyMES/dicho.c"
  $177 = $176&255; //@line 787 "HyMES/dicho.c"
  HEAP8[$173>>0] = $177; //@line 787 "HyMES/dicho.c"
  $178 = $c; //@line 788 "HyMES/dicho.c"
  $179 = $178&255; //@line 788 "HyMES/dicho.c"
  $180 = $3; //@line 788 "HyMES/dicho.c"
  $181 = (($180|0) / 8)&-1; //@line 788 "HyMES/dicho.c"
  $182 = $2; //@line 788 "HyMES/dicho.c"
  $183 = (($182) + ($181)|0); //@line 788 "HyMES/dicho.c"
  $184 = HEAP8[$183>>0]|0; //@line 788 "HyMES/dicho.c"
  $185 = $184&255; //@line 788 "HyMES/dicho.c"
  $186 = $185 ^ $179; //@line 788 "HyMES/dicho.c"
  $187 = $186&255; //@line 788 "HyMES/dicho.c"
  HEAP8[$183>>0] = $187; //@line 788 "HyMES/dicho.c"
 }
 $188 = $end; //@line 790 "HyMES/dicho.c"
 $189 = (($188|0) % 8)&-1; //@line 790 "HyMES/dicho.c"
 $190 = ($189|0)!=(0); //@line 790 "HyMES/dicho.c"
 if ($190) {
  $191 = $end; //@line 791 "HyMES/dicho.c"
  $192 = (($191|0) % 8)&-1; //@line 791 "HyMES/dicho.c"
  $193 = (8 - ($192))|0; //@line 791 "HyMES/dicho.c"
  $194 = $end; //@line 791 "HyMES/dicho.c"
  $195 = (($194|0) / 8)&-1; //@line 791 "HyMES/dicho.c"
  $196 = $2; //@line 791 "HyMES/dicho.c"
  $197 = (($196) + ($195)|0); //@line 791 "HyMES/dicho.c"
  $198 = HEAP8[$197>>0]|0; //@line 791 "HyMES/dicho.c"
  $199 = $198&255; //@line 791 "HyMES/dicho.c"
  $200 = $199 >> $193; //@line 791 "HyMES/dicho.c"
  $201 = $200&255; //@line 791 "HyMES/dicho.c"
  HEAP8[$197>>0] = $201; //@line 791 "HyMES/dicho.c"
 }
 $202 = $l; //@line 794 "HyMES/dicho.c"
 $203 = $4; //@line 794 "HyMES/dicho.c"
 $204 = ($202|0)<($203|0); //@line 794 "HyMES/dicho.c"
 if ($204) {
  $0 = -1; //@line 795 "HyMES/dicho.c"
  $206 = $0; //@line 798 "HyMES/dicho.c"
  STACKTOP = sp;return ($206|0); //@line 798 "HyMES/dicho.c"
 } else {
  $205 = $l; //@line 797 "HyMES/dicho.c"
  $0 = $205; //@line 797 "HyMES/dicho.c"
  $206 = $0; //@line 798 "HyMES/dicho.c"
  STACKTOP = sp;return ($206|0); //@line 798 "HyMES/dicho.c"
 }
 return (0)|0;
}
function _vec_concat($x,$a,$b) {
 $x = $x|0;
 $a = $a|0;
 $b = $b|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, dest = 0, label = 0, sp = 0, src = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $x;
 $1 = $a;
 $2 = $b;
 $3 = $0; //@line 36 "HyMES/encrypt.c"
 $4 = $1; //@line 36 "HyMES/encrypt.c"
 _memcpy(($3|0),($4|0),422)|0; //@line 36 "HyMES/encrypt.c"
 $5 = $0; //@line 37 "HyMES/encrypt.c"
 $6 = ((($5)) + 422|0); //@line 37 "HyMES/encrypt.c"
 $7 = $2; //@line 37 "HyMES/encrypt.c"
 dest=$6; src=$7; stop=dest+90|0; do { HEAP8[dest>>0]=HEAP8[src>>0]|0; dest=dest+1|0; src=src+1|0; } while ((dest|0) < (stop|0)); //@line 37 "HyMES/encrypt.c"
 STACKTOP = sp;return; //@line 53 "HyMES/encrypt.c"
}
function _addto($a,$b) {
 $a = $a|0;
 $b = $b|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $a;
 $1 = $b;
 $i = 0; //@line 58 "HyMES/encrypt.c"
 while(1) {
  $2 = $i; //@line 58 "HyMES/encrypt.c"
  $3 = ($2>>>0)<(23); //@line 58 "HyMES/encrypt.c"
  if (!($3)) {
   break;
  }
  $4 = $i; //@line 59 "HyMES/encrypt.c"
  $5 = $1; //@line 59 "HyMES/encrypt.c"
  $6 = (($5) + ($4<<2)|0); //@line 59 "HyMES/encrypt.c"
  $7 = HEAP32[$6>>2]|0; //@line 59 "HyMES/encrypt.c"
  $8 = $i; //@line 59 "HyMES/encrypt.c"
  $9 = $0; //@line 59 "HyMES/encrypt.c"
  $10 = (($9) + ($8<<2)|0); //@line 59 "HyMES/encrypt.c"
  $11 = HEAP32[$10>>2]|0; //@line 59 "HyMES/encrypt.c"
  $12 = $11 ^ $7; //@line 59 "HyMES/encrypt.c"
  HEAP32[$10>>2] = $12; //@line 59 "HyMES/encrypt.c"
  $13 = $i; //@line 58 "HyMES/encrypt.c"
  $14 = (($13) + 1)|0; //@line 58 "HyMES/encrypt.c"
  $i = $14; //@line 58 "HyMES/encrypt.c"
 }
 STACKTOP = sp;return; //@line 60 "HyMES/encrypt.c"
}
function _encrypt_block($ciphertext,$cleartext,$pk) {
 $ciphertext = $ciphertext|0;
 $cleartext = $cleartext|0;
 $pk = $pk|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $7 = 0, $8 = 0, $9 = 0, $cR = 0, $cwdata$byval_copy = 0, $e = 0, $i = 0, $j = 0, $pt = 0, dest = 0, label = 0, sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 400|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $cwdata$byval_copy = sp + 360|0;
 $cR = sp + 244|0;
 $e = sp;
 $1 = $ciphertext;
 $2 = $cleartext;
 $3 = $pk;
 $4 = $3; //@line 69 "HyMES/encrypt.c"
 $pt = $4; //@line 69 "HyMES/encrypt.c"
 dest=$cR; stop=dest+92|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0)); //@line 70 "HyMES/encrypt.c"
 $i = 0; //@line 71 "HyMES/encrypt.c"
 while(1) {
  $5 = $i; //@line 71 "HyMES/encrypt.c"
  $6 = ($5|0)<(422); //@line 71 "HyMES/encrypt.c"
  $j = 0; //@line 72 "HyMES/encrypt.c"
  if (!($6)) {
   break;
  }
  while(1) {
   $7 = $j; //@line 72 "HyMES/encrypt.c"
   $8 = ($7|0)<(8); //@line 72 "HyMES/encrypt.c"
   $9 = $i; //@line 73 "HyMES/encrypt.c"
   if (!($8)) {
    break;
   }
   $10 = $2; //@line 73 "HyMES/encrypt.c"
   $11 = (($10) + ($9)|0); //@line 73 "HyMES/encrypt.c"
   $12 = HEAP8[$11>>0]|0; //@line 73 "HyMES/encrypt.c"
   $13 = $12&255; //@line 73 "HyMES/encrypt.c"
   $14 = $j; //@line 73 "HyMES/encrypt.c"
   $15 = 1 << $14; //@line 73 "HyMES/encrypt.c"
   $16 = $13 & $15; //@line 73 "HyMES/encrypt.c"
   $17 = ($16|0)!=(0); //@line 73 "HyMES/encrypt.c"
   if ($17) {
    $18 = $pt; //@line 74 "HyMES/encrypt.c"
    _addto($cR,$18); //@line 74 "HyMES/encrypt.c"
   }
   $19 = $pt; //@line 75 "HyMES/encrypt.c"
   $20 = ((($19)) + 92|0); //@line 75 "HyMES/encrypt.c"
   $pt = $20; //@line 75 "HyMES/encrypt.c"
   $21 = $j; //@line 72 "HyMES/encrypt.c"
   $22 = (($21) + 1)|0; //@line 72 "HyMES/encrypt.c"
   $j = $22; //@line 72 "HyMES/encrypt.c"
  }
  $23 = (($9) + 1)|0; //@line 71 "HyMES/encrypt.c"
  $i = $23; //@line 71 "HyMES/encrypt.c"
 }
 while(1) {
  $24 = $j; //@line 78 "HyMES/encrypt.c"
  $25 = ($24|0)<(0); //@line 78 "HyMES/encrypt.c"
  if (!($25)) {
   break;
  }
  $26 = $i; //@line 79 "HyMES/encrypt.c"
  $27 = $2; //@line 79 "HyMES/encrypt.c"
  $28 = (($27) + ($26)|0); //@line 79 "HyMES/encrypt.c"
  $29 = HEAP8[$28>>0]|0; //@line 79 "HyMES/encrypt.c"
  $30 = $29&255; //@line 79 "HyMES/encrypt.c"
  $31 = $j; //@line 79 "HyMES/encrypt.c"
  $32 = 1 << $31; //@line 79 "HyMES/encrypt.c"
  $33 = $30 & $32; //@line 79 "HyMES/encrypt.c"
  $34 = ($33|0)!=(0); //@line 79 "HyMES/encrypt.c"
  if ($34) {
   $35 = $pt; //@line 80 "HyMES/encrypt.c"
   _addto($cR,$35); //@line 80 "HyMES/encrypt.c"
  }
  $36 = $pt; //@line 81 "HyMES/encrypt.c"
  $37 = ((($36)) + 92|0); //@line 81 "HyMES/encrypt.c"
  $pt = $37; //@line 81 "HyMES/encrypt.c"
  $38 = $j; //@line 78 "HyMES/encrypt.c"
  $39 = (($38) + 1)|0; //@line 78 "HyMES/encrypt.c"
  $j = $39; //@line 78 "HyMES/encrypt.c"
 }
 $40 = $2; //@line 86 "HyMES/encrypt.c"
 ;HEAP32[$cwdata$byval_copy>>2]=HEAP32[1336>>2]|0;HEAP32[$cwdata$byval_copy+4>>2]=HEAP32[1336+4>>2]|0;HEAP32[$cwdata$byval_copy+8>>2]=HEAP32[1336+8>>2]|0;HEAP32[$cwdata$byval_copy+12>>2]=HEAP32[1336+12>>2]|0;HEAP32[$cwdata$byval_copy+16>>2]=HEAP32[1336+16>>2]|0;HEAP32[$cwdata$byval_copy+20>>2]=HEAP32[1336+20>>2]|0;HEAP32[$cwdata$byval_copy+24>>2]=HEAP32[1336+24>>2]|0; //@line 86 "HyMES/encrypt.c"
 $41 = (_dicho_b2cw($40,$e,3376,446,12,60,$cwdata$byval_copy)|0); //@line 86 "HyMES/encrypt.c"
 $i = $41; //@line 86 "HyMES/encrypt.c"
 $42 = $i; //@line 92 "HyMES/encrypt.c"
 $43 = ($42|0)<(0); //@line 92 "HyMES/encrypt.c"
 if ($43) {
  $0 = -1; //@line 93 "HyMES/encrypt.c"
  $65 = $0; //@line 104 "HyMES/encrypt.c"
  STACKTOP = sp;return ($65|0); //@line 104 "HyMES/encrypt.c"
 }
 $44 = $1; //@line 96 "HyMES/encrypt.c"
 $45 = $2; //@line 96 "HyMES/encrypt.c"
 _vec_concat($44,$45,$cR); //@line 96 "HyMES/encrypt.c"
 $i = 0; //@line 99 "HyMES/encrypt.c"
 while(1) {
  $46 = $i; //@line 99 "HyMES/encrypt.c"
  $47 = ($46|0)<(60); //@line 99 "HyMES/encrypt.c"
  if (!($47)) {
   break;
  }
  $48 = $i; //@line 100 "HyMES/encrypt.c"
  $49 = (($e) + ($48<<2)|0); //@line 100 "HyMES/encrypt.c"
  $50 = HEAP32[$49>>2]|0; //@line 100 "HyMES/encrypt.c"
  $51 = (($50|0) % 8)&-1; //@line 100 "HyMES/encrypt.c"
  $52 = 1 << $51; //@line 100 "HyMES/encrypt.c"
  $53 = $i; //@line 100 "HyMES/encrypt.c"
  $54 = (($e) + ($53<<2)|0); //@line 100 "HyMES/encrypt.c"
  $55 = HEAP32[$54>>2]|0; //@line 100 "HyMES/encrypt.c"
  $56 = (($55|0) / 8)&-1; //@line 100 "HyMES/encrypt.c"
  $57 = $1; //@line 100 "HyMES/encrypt.c"
  $58 = (($57) + ($56)|0); //@line 100 "HyMES/encrypt.c"
  $59 = HEAP8[$58>>0]|0; //@line 100 "HyMES/encrypt.c"
  $60 = $59&255; //@line 100 "HyMES/encrypt.c"
  $61 = $60 ^ $52; //@line 100 "HyMES/encrypt.c"
  $62 = $61&255; //@line 100 "HyMES/encrypt.c"
  HEAP8[$58>>0] = $62; //@line 100 "HyMES/encrypt.c"
  $63 = $i; //@line 99 "HyMES/encrypt.c"
  $64 = (($63) + 1)|0; //@line 99 "HyMES/encrypt.c"
  $i = $64; //@line 99 "HyMES/encrypt.c"
 }
 $0 = 1; //@line 103 "HyMES/encrypt.c"
 $65 = $0; //@line 104 "HyMES/encrypt.c"
 STACKTOP = sp;return ($65|0); //@line 104 "HyMES/encrypt.c"
}
function _gf_init_exp() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = HEAP32[5128>>2]|0; //@line 57 "HyMES/gf.c"
 $1 = 1 << $0; //@line 57 "HyMES/gf.c"
 $2 = $1<<1; //@line 57 "HyMES/gf.c"
 $3 = (_malloc($2)|0); //@line 57 "HyMES/gf.c"
 HEAP32[5132>>2] = $3; //@line 57 "HyMES/gf.c"
 $4 = HEAP32[5132>>2]|0; //@line 59 "HyMES/gf.c"
 HEAP16[$4>>1] = 1; //@line 59 "HyMES/gf.c"
 $i = 1; //@line 60 "HyMES/gf.c"
 while(1) {
  $5 = $i; //@line 60 "HyMES/gf.c"
  $6 = HEAP32[5124>>2]|0; //@line 60 "HyMES/gf.c"
  $7 = ($5|0)<($6|0); //@line 60 "HyMES/gf.c"
  if (!($7)) {
   break;
  }
  $8 = $i; //@line 61 "HyMES/gf.c"
  $9 = (($8) - 1)|0; //@line 61 "HyMES/gf.c"
  $10 = HEAP32[5132>>2]|0; //@line 61 "HyMES/gf.c"
  $11 = (($10) + ($9<<1)|0); //@line 61 "HyMES/gf.c"
  $12 = HEAP16[$11>>1]|0; //@line 61 "HyMES/gf.c"
  $13 = $12&65535; //@line 61 "HyMES/gf.c"
  $14 = $13 << 1; //@line 61 "HyMES/gf.c"
  $15 = $14&65535; //@line 61 "HyMES/gf.c"
  $16 = $i; //@line 61 "HyMES/gf.c"
  $17 = HEAP32[5132>>2]|0; //@line 61 "HyMES/gf.c"
  $18 = (($17) + ($16<<1)|0); //@line 61 "HyMES/gf.c"
  HEAP16[$18>>1] = $15; //@line 61 "HyMES/gf.c"
  $19 = $i; //@line 62 "HyMES/gf.c"
  $20 = (($19) - 1)|0; //@line 62 "HyMES/gf.c"
  $21 = HEAP32[5132>>2]|0; //@line 62 "HyMES/gf.c"
  $22 = (($21) + ($20<<1)|0); //@line 62 "HyMES/gf.c"
  $23 = HEAP16[$22>>1]|0; //@line 62 "HyMES/gf.c"
  $24 = $23&65535; //@line 62 "HyMES/gf.c"
  $25 = HEAP32[5128>>2]|0; //@line 62 "HyMES/gf.c"
  $26 = (($25) - 1)|0; //@line 62 "HyMES/gf.c"
  $27 = 1 << $26; //@line 62 "HyMES/gf.c"
  $28 = $24 & $27; //@line 62 "HyMES/gf.c"
  $29 = ($28|0)!=(0); //@line 62 "HyMES/gf.c"
  if ($29) {
   $30 = HEAP32[5128>>2]|0; //@line 63 "HyMES/gf.c"
   $31 = (7540 + ($30<<2)|0); //@line 63 "HyMES/gf.c"
   $32 = HEAP32[$31>>2]|0; //@line 63 "HyMES/gf.c"
   $33 = $i; //@line 63 "HyMES/gf.c"
   $34 = HEAP32[5132>>2]|0; //@line 63 "HyMES/gf.c"
   $35 = (($34) + ($33<<1)|0); //@line 63 "HyMES/gf.c"
   $36 = HEAP16[$35>>1]|0; //@line 63 "HyMES/gf.c"
   $37 = $36&65535; //@line 63 "HyMES/gf.c"
   $38 = $37 ^ $32; //@line 63 "HyMES/gf.c"
   $39 = $38&65535; //@line 63 "HyMES/gf.c"
   HEAP16[$35>>1] = $39; //@line 63 "HyMES/gf.c"
  }
  $40 = $i; //@line 60 "HyMES/gf.c"
  $41 = (($40) + 1)|0; //@line 60 "HyMES/gf.c"
  $i = $41; //@line 60 "HyMES/gf.c"
 }
 $42 = HEAP32[5124>>2]|0; //@line 66 "HyMES/gf.c"
 $43 = HEAP32[5132>>2]|0; //@line 66 "HyMES/gf.c"
 $44 = (($43) + ($42<<1)|0); //@line 66 "HyMES/gf.c"
 HEAP16[$44>>1] = 1; //@line 66 "HyMES/gf.c"
 STACKTOP = sp;return; //@line 67 "HyMES/gf.c"
}
function _gf_init_log() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = HEAP32[5128>>2]|0; //@line 74 "HyMES/gf.c"
 $1 = 1 << $0; //@line 74 "HyMES/gf.c"
 $2 = $1<<1; //@line 74 "HyMES/gf.c"
 $3 = (_malloc($2)|0); //@line 74 "HyMES/gf.c"
 HEAP32[5120>>2] = $3; //@line 74 "HyMES/gf.c"
 $4 = HEAP32[5124>>2]|0; //@line 76 "HyMES/gf.c"
 $5 = $4&65535; //@line 76 "HyMES/gf.c"
 $6 = HEAP32[5120>>2]|0; //@line 76 "HyMES/gf.c"
 HEAP16[$6>>1] = $5; //@line 76 "HyMES/gf.c"
 $i = 0; //@line 77 "HyMES/gf.c"
 while(1) {
  $7 = $i; //@line 77 "HyMES/gf.c"
  $8 = HEAP32[5124>>2]|0; //@line 77 "HyMES/gf.c"
  $9 = ($7|0)<($8|0); //@line 77 "HyMES/gf.c"
  if (!($9)) {
   break;
  }
  $10 = $i; //@line 78 "HyMES/gf.c"
  $11 = $10&65535; //@line 78 "HyMES/gf.c"
  $12 = $i; //@line 78 "HyMES/gf.c"
  $13 = HEAP32[5132>>2]|0; //@line 78 "HyMES/gf.c"
  $14 = (($13) + ($12<<1)|0); //@line 78 "HyMES/gf.c"
  $15 = HEAP16[$14>>1]|0; //@line 78 "HyMES/gf.c"
  $16 = $15&65535; //@line 78 "HyMES/gf.c"
  $17 = HEAP32[5120>>2]|0; //@line 78 "HyMES/gf.c"
  $18 = (($17) + ($16<<1)|0); //@line 78 "HyMES/gf.c"
  HEAP16[$18>>1] = $11; //@line 78 "HyMES/gf.c"
  $19 = $i; //@line 77 "HyMES/gf.c"
  $20 = (($19) + 1)|0; //@line 77 "HyMES/gf.c"
  $i = $20; //@line 77 "HyMES/gf.c"
 }
 STACKTOP = sp;return; //@line 79 "HyMES/gf.c"
}
function _gf_init($extdeg) {
 $extdeg = $extdeg|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $0 = $extdeg;
 $1 = $0; //@line 85 "HyMES/gf.c"
 $2 = ($1|0)>(16); //@line 85 "HyMES/gf.c"
 if ($2) {
  $3 = HEAP32[7652>>2]|0; //@line 86 "HyMES/gf.c"
  $4 = $0; //@line 86 "HyMES/gf.c"
  HEAP32[$vararg_buffer>>2] = $4; //@line 86 "HyMES/gf.c"
  (_fprintf($3,9578,$vararg_buffer)|0); //@line 86 "HyMES/gf.c"
  _exit(0); //@line 87 "HyMES/gf.c"
  // unreachable; //@line 87 "HyMES/gf.c"
 }
 $5 = HEAP32[7536>>2]|0; //@line 89 "HyMES/gf.c"
 $6 = $0; //@line 89 "HyMES/gf.c"
 $7 = ($5|0)!=($6|0); //@line 89 "HyMES/gf.c"
 if (!($7)) {
  STACKTOP = sp;return 1; //@line 101 "HyMES/gf.c"
 }
 $8 = HEAP32[7536>>2]|0; //@line 90 "HyMES/gf.c"
 $9 = ($8|0)!=(0); //@line 90 "HyMES/gf.c"
 if ($9) {
  $10 = HEAP32[5132>>2]|0; //@line 91 "HyMES/gf.c"
  _free($10); //@line 91 "HyMES/gf.c"
  $11 = HEAP32[5120>>2]|0; //@line 92 "HyMES/gf.c"
  _free($11); //@line 92 "HyMES/gf.c"
 }
 $12 = $0; //@line 94 "HyMES/gf.c"
 HEAP32[5128>>2] = $12; //@line 94 "HyMES/gf.c"
 HEAP32[7536>>2] = $12; //@line 94 "HyMES/gf.c"
 $13 = $0; //@line 95 "HyMES/gf.c"
 $14 = 1 << $13; //@line 95 "HyMES/gf.c"
 HEAP32[5136>>2] = $14; //@line 95 "HyMES/gf.c"
 $15 = HEAP32[5136>>2]|0; //@line 96 "HyMES/gf.c"
 $16 = (($15) - 1)|0; //@line 96 "HyMES/gf.c"
 HEAP32[5124>>2] = $16; //@line 96 "HyMES/gf.c"
 _gf_init_exp(); //@line 97 "HyMES/gf.c"
 _gf_init_log(); //@line 98 "HyMES/gf.c"
 STACKTOP = sp;return 1; //@line 101 "HyMES/gf.c"
}
function _gf_rand($u8rnd) {
 $u8rnd = $u8rnd|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $u8rnd;
 $1 = $0; //@line 123 "HyMES/gf.c"
 $2 = (FUNCTION_TABLE_i[$1 & 31]()|0); //@line 123 "HyMES/gf.c"
 $3 = $0; //@line 123 "HyMES/gf.c"
 $4 = (FUNCTION_TABLE_i[$3 & 31]()|0); //@line 123 "HyMES/gf.c"
 $5 = $4 << 8; //@line 123 "HyMES/gf.c"
 $6 = $2 ^ $5; //@line 123 "HyMES/gf.c"
 $7 = HEAP32[5124>>2]|0; //@line 123 "HyMES/gf.c"
 $8 = $6 & $7; //@line 123 "HyMES/gf.c"
 $9 = $8&65535; //@line 123 "HyMES/gf.c"
 STACKTOP = sp;return ($9|0); //@line 123 "HyMES/gf.c"
}
function _u8rnd() {
 var $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_random()|0); //@line 28 "HyMES/keypair.c"
 $1 = $0 & 255; //@line 28 "HyMES/keypair.c"
 return ($1|0); //@line 28 "HyMES/keypair.c"
}
function _u32rnd() {
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_u8rnd()|0); //@line 30 "HyMES/keypair.c"
 $1 = (_u8rnd()|0); //@line 30 "HyMES/keypair.c"
 $2 = $1 << 8; //@line 30 "HyMES/keypair.c"
 $3 = $0 ^ $2; //@line 30 "HyMES/keypair.c"
 $4 = (_u8rnd()|0); //@line 30 "HyMES/keypair.c"
 $5 = $4 << 16; //@line 30 "HyMES/keypair.c"
 $6 = $3 ^ $5; //@line 30 "HyMES/keypair.c"
 $7 = (_u8rnd()|0); //@line 30 "HyMES/keypair.c"
 $8 = $7 << 24; //@line 30 "HyMES/keypair.c"
 $9 = $6 ^ $8; //@line 30 "HyMES/keypair.c"
 return ($9|0); //@line 30 "HyMES/keypair.c"
}
function _gop_supr($n,$L) {
 $n = $n|0;
 $L = $L|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, $j = 0, $tmp = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $n;
 $1 = $L;
 $i = 0; //@line 43 "HyMES/keypair.c"
 while(1) {
  $2 = $i; //@line 43 "HyMES/keypair.c"
  $3 = $0; //@line 43 "HyMES/keypair.c"
  $4 = ($2>>>0)<($3>>>0); //@line 43 "HyMES/keypair.c"
  if (!($4)) {
   break;
  }
  $5 = $i; //@line 45 "HyMES/keypair.c"
  $6 = (_u32rnd()|0); //@line 45 "HyMES/keypair.c"
  $7 = $0; //@line 45 "HyMES/keypair.c"
  $8 = $i; //@line 45 "HyMES/keypair.c"
  $9 = (($7) - ($8))|0; //@line 45 "HyMES/keypair.c"
  $10 = (($6>>>0) % ($9>>>0))&-1; //@line 45 "HyMES/keypair.c"
  $11 = (($5) + ($10))|0; //@line 45 "HyMES/keypair.c"
  $j = $11; //@line 45 "HyMES/keypair.c"
  $12 = $j; //@line 47 "HyMES/keypair.c"
  $13 = $1; //@line 47 "HyMES/keypair.c"
  $14 = (($13) + ($12<<1)|0); //@line 47 "HyMES/keypair.c"
  $15 = HEAP16[$14>>1]|0; //@line 47 "HyMES/keypair.c"
  $tmp = $15; //@line 47 "HyMES/keypair.c"
  $16 = $i; //@line 48 "HyMES/keypair.c"
  $17 = $1; //@line 48 "HyMES/keypair.c"
  $18 = (($17) + ($16<<1)|0); //@line 48 "HyMES/keypair.c"
  $19 = HEAP16[$18>>1]|0; //@line 48 "HyMES/keypair.c"
  $20 = $j; //@line 48 "HyMES/keypair.c"
  $21 = $1; //@line 48 "HyMES/keypair.c"
  $22 = (($21) + ($20<<1)|0); //@line 48 "HyMES/keypair.c"
  HEAP16[$22>>1] = $19; //@line 48 "HyMES/keypair.c"
  $23 = $tmp; //@line 49 "HyMES/keypair.c"
  $24 = $i; //@line 49 "HyMES/keypair.c"
  $25 = $1; //@line 49 "HyMES/keypair.c"
  $26 = (($25) + ($24<<1)|0); //@line 49 "HyMES/keypair.c"
  HEAP16[$26>>1] = $23; //@line 49 "HyMES/keypair.c"
  $27 = $i; //@line 43 "HyMES/keypair.c"
  $28 = (($27) + 1)|0; //@line 43 "HyMES/keypair.c"
  $i = $28; //@line 43 "HyMES/keypair.c"
 }
 STACKTOP = sp;return; //@line 51 "HyMES/keypair.c"
}
function _key_genmat($L,$g) {
 $L = $L|0;
 $g = $g|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0;
 var $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0;
 var $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0;
 var $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0;
 var $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $H = 0, $Laux = 0;
 var $R = 0, $i = 0, $j = 0, $k = 0, $n = 0, $perm = 0, $r = 0, $x = 0, $y = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16432|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $Laux = sp;
 $1 = $L;
 $2 = $g;
 $n = 4096; //@line 66 "HyMES/keypair.c"
 $r = 720; //@line 67 "HyMES/keypair.c"
 $3 = $r; //@line 69 "HyMES/keypair.c"
 $4 = $n; //@line 69 "HyMES/keypair.c"
 $5 = (_mat_ini($3,$4)|0); //@line 69 "HyMES/keypair.c"
 $H = $5; //@line 69 "HyMES/keypair.c"
 $6 = $H; //@line 70 "HyMES/keypair.c"
 $7 = ((($6)) + 16|0); //@line 70 "HyMES/keypair.c"
 $8 = HEAP32[$7>>2]|0; //@line 70 "HyMES/keypair.c"
 $9 = $H; //@line 70 "HyMES/keypair.c"
 $10 = ((($9)) + 12|0); //@line 70 "HyMES/keypair.c"
 $11 = HEAP32[$10>>2]|0; //@line 70 "HyMES/keypair.c"
 _memset(($8|0),0,($11|0))|0; //@line 70 "HyMES/keypair.c"
 $i = 0; //@line 72 "HyMES/keypair.c"
 while(1) {
  $12 = $i; //@line 72 "HyMES/keypair.c"
  $13 = $n; //@line 72 "HyMES/keypair.c"
  $14 = ($12|0)<($13|0); //@line 72 "HyMES/keypair.c"
  if (!($14)) {
   break;
  }
  $15 = $2; //@line 74 "HyMES/keypair.c"
  $16 = $i; //@line 74 "HyMES/keypair.c"
  $17 = $1; //@line 74 "HyMES/keypair.c"
  $18 = (($17) + ($16<<1)|0); //@line 74 "HyMES/keypair.c"
  $19 = HEAP16[$18>>1]|0; //@line 74 "HyMES/keypair.c"
  $20 = (_poly_eval($15,$19)|0); //@line 74 "HyMES/keypair.c"
  $x = $20; //@line 74 "HyMES/keypair.c"
  $21 = HEAP32[5124>>2]|0; //@line 75 "HyMES/keypair.c"
  $22 = $x; //@line 75 "HyMES/keypair.c"
  $23 = $22&65535; //@line 75 "HyMES/keypair.c"
  $24 = HEAP32[5120>>2]|0; //@line 75 "HyMES/keypair.c"
  $25 = (($24) + ($23<<1)|0); //@line 75 "HyMES/keypair.c"
  $26 = HEAP16[$25>>1]|0; //@line 75 "HyMES/keypair.c"
  $27 = $26&65535; //@line 75 "HyMES/keypair.c"
  $28 = (($21) - ($27))|0; //@line 75 "HyMES/keypair.c"
  $29 = HEAP32[5132>>2]|0; //@line 75 "HyMES/keypair.c"
  $30 = (($29) + ($28<<1)|0); //@line 75 "HyMES/keypair.c"
  $31 = HEAP16[$30>>1]|0; //@line 75 "HyMES/keypair.c"
  $x = $31; //@line 75 "HyMES/keypair.c"
  $32 = $x; //@line 76 "HyMES/keypair.c"
  $y = $32; //@line 76 "HyMES/keypair.c"
  $j = 0; //@line 77 "HyMES/keypair.c"
  while(1) {
   $33 = $j; //@line 77 "HyMES/keypair.c"
   $34 = ($33|0)<(60); //@line 77 "HyMES/keypair.c"
   if (!($34)) {
    break;
   }
   $k = 0; //@line 79 "HyMES/keypair.c"
   while(1) {
    $35 = $k; //@line 79 "HyMES/keypair.c"
    $36 = ($35|0)<(12); //@line 79 "HyMES/keypair.c"
    $37 = $y; //@line 81 "HyMES/keypair.c"
    $38 = $37&65535; //@line 81 "HyMES/keypair.c"
    if (!($36)) {
     break;
    }
    $39 = $k; //@line 81 "HyMES/keypair.c"
    $40 = 1 << $39; //@line 81 "HyMES/keypair.c"
    $41 = $38 & $40; //@line 81 "HyMES/keypair.c"
    $42 = ($41|0)!=(0); //@line 81 "HyMES/keypair.c"
    if ($42) {
     $43 = $i; //@line 82 "HyMES/keypair.c"
     $44 = (($43>>>0) % 32)&-1; //@line 82 "HyMES/keypair.c"
     $45 = 1 << $44; //@line 82 "HyMES/keypair.c"
     $46 = $j; //@line 82 "HyMES/keypair.c"
     $47 = ($46*12)|0; //@line 82 "HyMES/keypair.c"
     $48 = $k; //@line 82 "HyMES/keypair.c"
     $49 = (($47) + ($48))|0; //@line 82 "HyMES/keypair.c"
     $50 = $H; //@line 82 "HyMES/keypair.c"
     $51 = ((($50)) + 8|0); //@line 82 "HyMES/keypair.c"
     $52 = HEAP32[$51>>2]|0; //@line 82 "HyMES/keypair.c"
     $53 = Math_imul($49, $52)|0; //@line 82 "HyMES/keypair.c"
     $54 = $i; //@line 82 "HyMES/keypair.c"
     $55 = (($54>>>0) / 32)&-1; //@line 82 "HyMES/keypair.c"
     $56 = (($53) + ($55))|0; //@line 82 "HyMES/keypair.c"
     $57 = $H; //@line 82 "HyMES/keypair.c"
     $58 = ((($57)) + 16|0); //@line 82 "HyMES/keypair.c"
     $59 = HEAP32[$58>>2]|0; //@line 82 "HyMES/keypair.c"
     $60 = (($59) + ($56<<2)|0); //@line 82 "HyMES/keypair.c"
     $61 = HEAP32[$60>>2]|0; //@line 82 "HyMES/keypair.c"
     $62 = $61 | $45; //@line 82 "HyMES/keypair.c"
     HEAP32[$60>>2] = $62; //@line 82 "HyMES/keypair.c"
    }
    $63 = $k; //@line 79 "HyMES/keypair.c"
    $64 = (($63) + 1)|0; //@line 79 "HyMES/keypair.c"
    $k = $64; //@line 79 "HyMES/keypair.c"
   }
   $65 = ($38|0)!=(0); //@line 84 "HyMES/keypair.c"
   if ($65) {
    $66 = $i; //@line 84 "HyMES/keypair.c"
    $67 = $1; //@line 84 "HyMES/keypair.c"
    $68 = (($67) + ($66<<1)|0); //@line 84 "HyMES/keypair.c"
    $69 = HEAP16[$68>>1]|0; //@line 84 "HyMES/keypair.c"
    $70 = $69&65535; //@line 84 "HyMES/keypair.c"
    $71 = ($70|0)!=(0); //@line 84 "HyMES/keypair.c"
    if ($71) {
     $72 = $y; //@line 84 "HyMES/keypair.c"
     $73 = $72&65535; //@line 84 "HyMES/keypair.c"
     $74 = HEAP32[5120>>2]|0; //@line 84 "HyMES/keypair.c"
     $75 = (($74) + ($73<<1)|0); //@line 84 "HyMES/keypair.c"
     $76 = HEAP16[$75>>1]|0; //@line 84 "HyMES/keypair.c"
     $77 = $76&65535; //@line 84 "HyMES/keypair.c"
     $78 = $i; //@line 84 "HyMES/keypair.c"
     $79 = $1; //@line 84 "HyMES/keypair.c"
     $80 = (($79) + ($78<<1)|0); //@line 84 "HyMES/keypair.c"
     $81 = HEAP16[$80>>1]|0; //@line 84 "HyMES/keypair.c"
     $82 = $81&65535; //@line 84 "HyMES/keypair.c"
     $83 = HEAP32[5120>>2]|0; //@line 84 "HyMES/keypair.c"
     $84 = (($83) + ($82<<1)|0); //@line 84 "HyMES/keypair.c"
     $85 = HEAP16[$84>>1]|0; //@line 84 "HyMES/keypair.c"
     $86 = $85&65535; //@line 84 "HyMES/keypair.c"
     $87 = (($77) + ($86))|0; //@line 84 "HyMES/keypair.c"
     $88 = HEAP32[5124>>2]|0; //@line 84 "HyMES/keypair.c"
     $89 = $87 & $88; //@line 84 "HyMES/keypair.c"
     $90 = $y; //@line 84 "HyMES/keypair.c"
     $91 = $90&65535; //@line 84 "HyMES/keypair.c"
     $92 = HEAP32[5120>>2]|0; //@line 84 "HyMES/keypair.c"
     $93 = (($92) + ($91<<1)|0); //@line 84 "HyMES/keypair.c"
     $94 = HEAP16[$93>>1]|0; //@line 84 "HyMES/keypair.c"
     $95 = $94&65535; //@line 84 "HyMES/keypair.c"
     $96 = $i; //@line 84 "HyMES/keypair.c"
     $97 = $1; //@line 84 "HyMES/keypair.c"
     $98 = (($97) + ($96<<1)|0); //@line 84 "HyMES/keypair.c"
     $99 = HEAP16[$98>>1]|0; //@line 84 "HyMES/keypair.c"
     $100 = $99&65535; //@line 84 "HyMES/keypair.c"
     $101 = HEAP32[5120>>2]|0; //@line 84 "HyMES/keypair.c"
     $102 = (($101) + ($100<<1)|0); //@line 84 "HyMES/keypair.c"
     $103 = HEAP16[$102>>1]|0; //@line 84 "HyMES/keypair.c"
     $104 = $103&65535; //@line 84 "HyMES/keypair.c"
     $105 = (($95) + ($104))|0; //@line 84 "HyMES/keypair.c"
     $106 = HEAP32[5128>>2]|0; //@line 84 "HyMES/keypair.c"
     $107 = $105 >> $106; //@line 84 "HyMES/keypair.c"
     $108 = (($89) + ($107))|0; //@line 84 "HyMES/keypair.c"
     $109 = HEAP32[5132>>2]|0; //@line 84 "HyMES/keypair.c"
     $110 = (($109) + ($108<<1)|0); //@line 84 "HyMES/keypair.c"
     $111 = HEAP16[$110>>1]|0; //@line 84 "HyMES/keypair.c"
     $112 = $111&65535; //@line 84 "HyMES/keypair.c"
     $114 = $112;
    } else {
     $114 = 0;
    }
   } else {
    $114 = 0;
   }
   $113 = $114&65535; //@line 84 "HyMES/keypair.c"
   $y = $113; //@line 84 "HyMES/keypair.c"
   $115 = $j; //@line 77 "HyMES/keypair.c"
   $116 = (($115) + 1)|0; //@line 77 "HyMES/keypair.c"
   $j = $116; //@line 77 "HyMES/keypair.c"
  }
  $117 = $i; //@line 72 "HyMES/keypair.c"
  $118 = (($117) + 1)|0; //@line 72 "HyMES/keypair.c"
  $i = $118; //@line 72 "HyMES/keypair.c"
 }
 $119 = $H; //@line 88 "HyMES/keypair.c"
 $120 = (_mat_rref($119)|0); //@line 88 "HyMES/keypair.c"
 $perm = $120; //@line 88 "HyMES/keypair.c"
 $121 = $perm; //@line 89 "HyMES/keypair.c"
 $122 = ($121|0)==(0|0); //@line 89 "HyMES/keypair.c"
 if ($122) {
  $123 = $H; //@line 90 "HyMES/keypair.c"
  _mat_free($123); //@line 90 "HyMES/keypair.c"
  $0 = 0; //@line 91 "HyMES/keypair.c"
  $217 = $0; //@line 110 "HyMES/keypair.c"
  STACKTOP = sp;return ($217|0); //@line 110 "HyMES/keypair.c"
 }
 $124 = $n; //@line 94 "HyMES/keypair.c"
 $125 = $r; //@line 94 "HyMES/keypair.c"
 $126 = (($124) - ($125))|0; //@line 94 "HyMES/keypair.c"
 $127 = $r; //@line 94 "HyMES/keypair.c"
 $128 = (_mat_ini($126,$127)|0); //@line 94 "HyMES/keypair.c"
 $R = $128; //@line 94 "HyMES/keypair.c"
 $129 = $R; //@line 95 "HyMES/keypair.c"
 $130 = ((($129)) + 16|0); //@line 95 "HyMES/keypair.c"
 $131 = HEAP32[$130>>2]|0; //@line 95 "HyMES/keypair.c"
 $132 = $R; //@line 95 "HyMES/keypair.c"
 $133 = ((($132)) + 12|0); //@line 95 "HyMES/keypair.c"
 $134 = HEAP32[$133>>2]|0; //@line 95 "HyMES/keypair.c"
 _memset(($131|0),0,($134|0))|0; //@line 95 "HyMES/keypair.c"
 $i = 0; //@line 96 "HyMES/keypair.c"
 while(1) {
  $135 = $i; //@line 96 "HyMES/keypair.c"
  $136 = $R; //@line 96 "HyMES/keypair.c"
  $137 = HEAP32[$136>>2]|0; //@line 96 "HyMES/keypair.c"
  $138 = ($135|0)<($137|0); //@line 96 "HyMES/keypair.c"
  if (!($138)) {
   break;
  }
  $j = 0; //@line 97 "HyMES/keypair.c"
  while(1) {
   $139 = $j; //@line 97 "HyMES/keypair.c"
   $140 = $R; //@line 97 "HyMES/keypair.c"
   $141 = ((($140)) + 4|0); //@line 97 "HyMES/keypair.c"
   $142 = HEAP32[$141>>2]|0; //@line 97 "HyMES/keypair.c"
   $143 = ($139|0)<($142|0); //@line 97 "HyMES/keypair.c"
   if (!($143)) {
    break;
   }
   $144 = $j; //@line 98 "HyMES/keypair.c"
   $145 = $H; //@line 98 "HyMES/keypair.c"
   $146 = ((($145)) + 8|0); //@line 98 "HyMES/keypair.c"
   $147 = HEAP32[$146>>2]|0; //@line 98 "HyMES/keypair.c"
   $148 = Math_imul($144, $147)|0; //@line 98 "HyMES/keypair.c"
   $149 = $i; //@line 98 "HyMES/keypair.c"
   $150 = $perm; //@line 98 "HyMES/keypair.c"
   $151 = (($150) + ($149<<2)|0); //@line 98 "HyMES/keypair.c"
   $152 = HEAP32[$151>>2]|0; //@line 98 "HyMES/keypair.c"
   $153 = (($152>>>0) / 32)&-1; //@line 98 "HyMES/keypair.c"
   $154 = (($148) + ($153))|0; //@line 98 "HyMES/keypair.c"
   $155 = $H; //@line 98 "HyMES/keypair.c"
   $156 = ((($155)) + 16|0); //@line 98 "HyMES/keypair.c"
   $157 = HEAP32[$156>>2]|0; //@line 98 "HyMES/keypair.c"
   $158 = (($157) + ($154<<2)|0); //@line 98 "HyMES/keypair.c"
   $159 = HEAP32[$158>>2]|0; //@line 98 "HyMES/keypair.c"
   $160 = $i; //@line 98 "HyMES/keypair.c"
   $161 = $perm; //@line 98 "HyMES/keypair.c"
   $162 = (($161) + ($160<<2)|0); //@line 98 "HyMES/keypair.c"
   $163 = HEAP32[$162>>2]|0; //@line 98 "HyMES/keypair.c"
   $164 = (($163>>>0) % 32)&-1; //@line 98 "HyMES/keypair.c"
   $165 = $159 >>> $164; //@line 98 "HyMES/keypair.c"
   $166 = $165 & 1; //@line 98 "HyMES/keypair.c"
   $167 = ($166|0)!=(0); //@line 98 "HyMES/keypair.c"
   if ($167) {
    $168 = $j; //@line 99 "HyMES/keypair.c"
    $169 = (($168>>>0) % 32)&-1; //@line 99 "HyMES/keypair.c"
    $170 = 1 << $169; //@line 99 "HyMES/keypair.c"
    $171 = $i; //@line 99 "HyMES/keypair.c"
    $172 = $R; //@line 99 "HyMES/keypair.c"
    $173 = ((($172)) + 8|0); //@line 99 "HyMES/keypair.c"
    $174 = HEAP32[$173>>2]|0; //@line 99 "HyMES/keypair.c"
    $175 = Math_imul($171, $174)|0; //@line 99 "HyMES/keypair.c"
    $176 = $j; //@line 99 "HyMES/keypair.c"
    $177 = (($176>>>0) / 32)&-1; //@line 99 "HyMES/keypair.c"
    $178 = (($175) + ($177))|0; //@line 99 "HyMES/keypair.c"
    $179 = $R; //@line 99 "HyMES/keypair.c"
    $180 = ((($179)) + 16|0); //@line 99 "HyMES/keypair.c"
    $181 = HEAP32[$180>>2]|0; //@line 99 "HyMES/keypair.c"
    $182 = (($181) + ($178<<2)|0); //@line 99 "HyMES/keypair.c"
    $183 = HEAP32[$182>>2]|0; //@line 99 "HyMES/keypair.c"
    $184 = $183 ^ $170; //@line 99 "HyMES/keypair.c"
    HEAP32[$182>>2] = $184; //@line 99 "HyMES/keypair.c"
   }
   $185 = $j; //@line 97 "HyMES/keypair.c"
   $186 = (($185) + 1)|0; //@line 97 "HyMES/keypair.c"
   $j = $186; //@line 97 "HyMES/keypair.c"
  }
  $187 = $i; //@line 96 "HyMES/keypair.c"
  $188 = (($187) + 1)|0; //@line 96 "HyMES/keypair.c"
  $i = $188; //@line 96 "HyMES/keypair.c"
 }
 $i = 0; //@line 101 "HyMES/keypair.c"
 while(1) {
  $189 = $i; //@line 101 "HyMES/keypair.c"
  $190 = ($189|0)<(4096); //@line 101 "HyMES/keypair.c"
  if (!($190)) {
   break;
  }
  $191 = $i; //@line 102 "HyMES/keypair.c"
  $192 = $perm; //@line 102 "HyMES/keypair.c"
  $193 = (($192) + ($191<<2)|0); //@line 102 "HyMES/keypair.c"
  $194 = HEAP32[$193>>2]|0; //@line 102 "HyMES/keypair.c"
  $195 = $1; //@line 102 "HyMES/keypair.c"
  $196 = (($195) + ($194<<1)|0); //@line 102 "HyMES/keypair.c"
  $197 = HEAP16[$196>>1]|0; //@line 102 "HyMES/keypair.c"
  $198 = $197&65535; //@line 102 "HyMES/keypair.c"
  $199 = $i; //@line 102 "HyMES/keypair.c"
  $200 = (($Laux) + ($199<<2)|0); //@line 102 "HyMES/keypair.c"
  HEAP32[$200>>2] = $198; //@line 102 "HyMES/keypair.c"
  $201 = $i; //@line 101 "HyMES/keypair.c"
  $202 = (($201) + 1)|0; //@line 101 "HyMES/keypair.c"
  $i = $202; //@line 101 "HyMES/keypair.c"
 }
 $i = 0; //@line 103 "HyMES/keypair.c"
 while(1) {
  $203 = $i; //@line 103 "HyMES/keypair.c"
  $204 = ($203|0)<(4096); //@line 103 "HyMES/keypair.c"
  if (!($204)) {
   break;
  }
  $205 = $i; //@line 104 "HyMES/keypair.c"
  $206 = (($Laux) + ($205<<2)|0); //@line 104 "HyMES/keypair.c"
  $207 = HEAP32[$206>>2]|0; //@line 104 "HyMES/keypair.c"
  $208 = $207&65535; //@line 104 "HyMES/keypair.c"
  $209 = $i; //@line 104 "HyMES/keypair.c"
  $210 = $1; //@line 104 "HyMES/keypair.c"
  $211 = (($210) + ($209<<1)|0); //@line 104 "HyMES/keypair.c"
  HEAP16[$211>>1] = $208; //@line 104 "HyMES/keypair.c"
  $212 = $i; //@line 103 "HyMES/keypair.c"
  $213 = (($212) + 1)|0; //@line 103 "HyMES/keypair.c"
  $i = $213; //@line 103 "HyMES/keypair.c"
 }
 $214 = $H; //@line 106 "HyMES/keypair.c"
 _mat_free($214); //@line 106 "HyMES/keypair.c"
 $215 = $perm; //@line 107 "HyMES/keypair.c"
 _free($215); //@line 107 "HyMES/keypair.c"
 $216 = $R; //@line 109 "HyMES/keypair.c"
 $0 = $216; //@line 109 "HyMES/keypair.c"
 $217 = $0; //@line 110 "HyMES/keypair.c"
 STACKTOP = sp;return ($217|0); //@line 110 "HyMES/keypair.c"
}
function _keypair($sk,$pk) {
 $sk = $sk|0;
 $pk = $pk|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0;
 var $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0;
 var $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0;
 var $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0;
 var $98 = 0, $99 = 0, $F = 0, $L = 0, $Linv = 0, $R = 0, $g = 0, $i = 0, $j = 0, $k = 0, $l = 0, $pt = 0, $sqrtmod = 0, dest = 0, label = 0, sp = 0, src = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $sk;
 $1 = $pk;
 (_gf_init(12)|0); //@line 120 "HyMES/keypair.c"
 $2 = (_malloc(8192)|0); //@line 123 "HyMES/keypair.c"
 $L = $2; //@line 123 "HyMES/keypair.c"
 $i = 0; //@line 125 "HyMES/keypair.c"
 while(1) {
  $3 = $i; //@line 125 "HyMES/keypair.c"
  $4 = ($3|0)<(4096); //@line 125 "HyMES/keypair.c"
  if (!($4)) {
   break;
  }
  $5 = $i; //@line 126 "HyMES/keypair.c"
  $6 = $5&65535; //@line 126 "HyMES/keypair.c"
  $7 = $i; //@line 126 "HyMES/keypair.c"
  $8 = $L; //@line 126 "HyMES/keypair.c"
  $9 = (($8) + ($7<<1)|0); //@line 126 "HyMES/keypair.c"
  HEAP16[$9>>1] = $6; //@line 126 "HyMES/keypair.c"
  $10 = $i; //@line 125 "HyMES/keypair.c"
  $11 = (($10) + 1)|0; //@line 125 "HyMES/keypair.c"
  $i = $11; //@line 125 "HyMES/keypair.c"
 }
 $12 = $L; //@line 127 "HyMES/keypair.c"
 _gop_supr(4096,$12); //@line 127 "HyMES/keypair.c"
 while(1) {
  $13 = (_poly_randgen_irred(60,18)|0); //@line 131 "HyMES/keypair.c"
  $g = $13; //@line 131 "HyMES/keypair.c"
  $14 = $L; //@line 132 "HyMES/keypair.c"
  $15 = $g; //@line 132 "HyMES/keypair.c"
  $16 = (_key_genmat($14,$15)|0); //@line 132 "HyMES/keypair.c"
  $R = $16; //@line 132 "HyMES/keypair.c"
  $17 = $R; //@line 133 "HyMES/keypair.c"
  $18 = ($17|0)==(0|0); //@line 133 "HyMES/keypair.c"
  if ($18) {
   $19 = $g; //@line 134 "HyMES/keypair.c"
   _poly_free($19); //@line 134 "HyMES/keypair.c"
  }
  $20 = $R; //@line 135 "HyMES/keypair.c"
  $21 = ($20|0)==(0|0); //@line 135 "HyMES/keypair.c"
  if (!($21)) {
   break;
  }
 }
 $22 = $g; //@line 137 "HyMES/keypair.c"
 $23 = (_poly_sqrtmod_init($22)|0); //@line 137 "HyMES/keypair.c"
 $sqrtmod = $23; //@line 137 "HyMES/keypair.c"
 $24 = $g; //@line 138 "HyMES/keypair.c"
 $25 = $L; //@line 138 "HyMES/keypair.c"
 $26 = (_poly_syndrome_init($24,$25,4096)|0); //@line 138 "HyMES/keypair.c"
 $F = $26; //@line 138 "HyMES/keypair.c"
 $i = 0; //@line 145 "HyMES/keypair.c"
 while(1) {
  $27 = $i; //@line 145 "HyMES/keypair.c"
  $28 = ($27|0)<(4096); //@line 145 "HyMES/keypair.c"
  if (!($28)) {
   break;
  }
  $29 = $0; //@line 146 "HyMES/keypair.c"
  dest=$29; stop=dest+92|0; do { HEAP8[dest>>0]=0|0; dest=dest+1|0; } while ((dest|0) < (stop|0)); //@line 146 "HyMES/keypair.c"
  $30 = $0; //@line 147 "HyMES/keypair.c"
  $pt = $30; //@line 147 "HyMES/keypair.c"
  $l = 0; //@line 148 "HyMES/keypair.c"
  while(1) {
   $31 = $l; //@line 148 "HyMES/keypair.c"
   $32 = ($31|0)<(60); //@line 148 "HyMES/keypair.c"
   if (!($32)) {
    break;
   }
   $33 = $l; //@line 149 "HyMES/keypair.c"
   $34 = ($33*12)|0; //@line 149 "HyMES/keypair.c"
   $35 = (($34>>>0) / 32)&-1; //@line 149 "HyMES/keypair.c"
   $k = $35; //@line 149 "HyMES/keypair.c"
   $36 = $l; //@line 150 "HyMES/keypair.c"
   $37 = ($36*12)|0; //@line 150 "HyMES/keypair.c"
   $38 = (($37>>>0) % 32)&-1; //@line 150 "HyMES/keypair.c"
   $j = $38; //@line 150 "HyMES/keypair.c"
   $39 = $l; //@line 151 "HyMES/keypair.c"
   $40 = $i; //@line 151 "HyMES/keypair.c"
   $41 = $F; //@line 151 "HyMES/keypair.c"
   $42 = (($41) + ($40<<2)|0); //@line 151 "HyMES/keypair.c"
   $43 = HEAP32[$42>>2]|0; //@line 151 "HyMES/keypair.c"
   $44 = ((($43)) + 8|0); //@line 151 "HyMES/keypair.c"
   $45 = HEAP32[$44>>2]|0; //@line 151 "HyMES/keypair.c"
   $46 = (($45) + ($39<<1)|0); //@line 151 "HyMES/keypair.c"
   $47 = HEAP16[$46>>1]|0; //@line 151 "HyMES/keypair.c"
   $48 = $47&65535; //@line 151 "HyMES/keypair.c"
   $49 = $j; //@line 151 "HyMES/keypair.c"
   $50 = $48 << $49; //@line 151 "HyMES/keypair.c"
   $51 = $k; //@line 151 "HyMES/keypair.c"
   $52 = $pt; //@line 151 "HyMES/keypair.c"
   $53 = (($52) + ($51<<2)|0); //@line 151 "HyMES/keypair.c"
   $54 = HEAP32[$53>>2]|0; //@line 151 "HyMES/keypair.c"
   $55 = $54 ^ $50; //@line 151 "HyMES/keypair.c"
   HEAP32[$53>>2] = $55; //@line 151 "HyMES/keypair.c"
   $56 = $j; //@line 152 "HyMES/keypair.c"
   $57 = (($56) + 12)|0; //@line 152 "HyMES/keypair.c"
   $58 = ($57>>>0)>(32); //@line 152 "HyMES/keypair.c"
   if ($58) {
    $59 = $l; //@line 153 "HyMES/keypair.c"
    $60 = $i; //@line 153 "HyMES/keypair.c"
    $61 = $F; //@line 153 "HyMES/keypair.c"
    $62 = (($61) + ($60<<2)|0); //@line 153 "HyMES/keypair.c"
    $63 = HEAP32[$62>>2]|0; //@line 153 "HyMES/keypair.c"
    $64 = ((($63)) + 8|0); //@line 153 "HyMES/keypair.c"
    $65 = HEAP32[$64>>2]|0; //@line 153 "HyMES/keypair.c"
    $66 = (($65) + ($59<<1)|0); //@line 153 "HyMES/keypair.c"
    $67 = HEAP16[$66>>1]|0; //@line 153 "HyMES/keypair.c"
    $68 = $67&65535; //@line 153 "HyMES/keypair.c"
    $69 = $j; //@line 153 "HyMES/keypair.c"
    $70 = (32 - ($69))|0; //@line 153 "HyMES/keypair.c"
    $71 = $68 >> $70; //@line 153 "HyMES/keypair.c"
    $72 = $k; //@line 153 "HyMES/keypair.c"
    $73 = (($72) + 1)|0; //@line 153 "HyMES/keypair.c"
    $74 = $pt; //@line 153 "HyMES/keypair.c"
    $75 = (($74) + ($73<<2)|0); //@line 153 "HyMES/keypair.c"
    $76 = HEAP32[$75>>2]|0; //@line 153 "HyMES/keypair.c"
    $77 = $76 ^ $71; //@line 153 "HyMES/keypair.c"
    HEAP32[$75>>2] = $77; //@line 153 "HyMES/keypair.c"
   }
   $78 = $l; //@line 148 "HyMES/keypair.c"
   $79 = (($78) + 1)|0; //@line 148 "HyMES/keypair.c"
   $l = $79; //@line 148 "HyMES/keypair.c"
  }
  $80 = $0; //@line 155 "HyMES/keypair.c"
  $81 = ((($80)) + 92|0); //@line 155 "HyMES/keypair.c"
  $0 = $81; //@line 155 "HyMES/keypair.c"
  $82 = $i; //@line 156 "HyMES/keypair.c"
  $83 = $F; //@line 156 "HyMES/keypair.c"
  $84 = (($83) + ($82<<2)|0); //@line 156 "HyMES/keypair.c"
  $85 = HEAP32[$84>>2]|0; //@line 156 "HyMES/keypair.c"
  _poly_free($85); //@line 156 "HyMES/keypair.c"
  $86 = $i; //@line 145 "HyMES/keypair.c"
  $87 = (($86) + 1)|0; //@line 145 "HyMES/keypair.c"
  $i = $87; //@line 145 "HyMES/keypair.c"
 }
 $88 = $F; //@line 158 "HyMES/keypair.c"
 _free($88); //@line 158 "HyMES/keypair.c"
 $89 = (_malloc(8192)|0); //@line 162 "HyMES/keypair.c"
 $Linv = $89; //@line 162 "HyMES/keypair.c"
 $i = 0; //@line 163 "HyMES/keypair.c"
 while(1) {
  $90 = $i; //@line 163 "HyMES/keypair.c"
  $91 = ($90|0)<(4096); //@line 163 "HyMES/keypair.c"
  if (!($91)) {
   break;
  }
  $92 = $i; //@line 164 "HyMES/keypair.c"
  $93 = $92&65535; //@line 164 "HyMES/keypair.c"
  $94 = $i; //@line 164 "HyMES/keypair.c"
  $95 = $L; //@line 164 "HyMES/keypair.c"
  $96 = (($95) + ($94<<1)|0); //@line 164 "HyMES/keypair.c"
  $97 = HEAP16[$96>>1]|0; //@line 164 "HyMES/keypair.c"
  $98 = $97&65535; //@line 164 "HyMES/keypair.c"
  $99 = $Linv; //@line 164 "HyMES/keypair.c"
  $100 = (($99) + ($98<<1)|0); //@line 164 "HyMES/keypair.c"
  HEAP16[$100>>1] = $93; //@line 164 "HyMES/keypair.c"
  $101 = $i; //@line 163 "HyMES/keypair.c"
  $102 = (($101) + 1)|0; //@line 163 "HyMES/keypair.c"
  $i = $102; //@line 163 "HyMES/keypair.c"
 }
 $103 = $0; //@line 165 "HyMES/keypair.c"
 $104 = $Linv; //@line 165 "HyMES/keypair.c"
 _memcpy(($103|0),($104|0),8192)|0; //@line 165 "HyMES/keypair.c"
 $105 = $0; //@line 166 "HyMES/keypair.c"
 $106 = ((($105)) + 8192|0); //@line 166 "HyMES/keypair.c"
 $0 = $106; //@line 166 "HyMES/keypair.c"
 $107 = $L; //@line 167 "HyMES/keypair.c"
 _free($107); //@line 167 "HyMES/keypair.c"
 $108 = $Linv; //@line 168 "HyMES/keypair.c"
 _free($108); //@line 168 "HyMES/keypair.c"
 $109 = $0; //@line 170 "HyMES/keypair.c"
 $110 = $g; //@line 170 "HyMES/keypair.c"
 $111 = ((($110)) + 8|0); //@line 170 "HyMES/keypair.c"
 $112 = HEAP32[$111>>2]|0; //@line 170 "HyMES/keypair.c"
 dest=$109; src=$112; stop=dest+122|0; do { HEAP8[dest>>0]=HEAP8[src>>0]|0; dest=dest+1|0; src=src+1|0; } while ((dest|0) < (stop|0)); //@line 170 "HyMES/keypair.c"
 $113 = $0; //@line 171 "HyMES/keypair.c"
 $114 = ((($113)) + 122|0); //@line 171 "HyMES/keypair.c"
 $0 = $114; //@line 171 "HyMES/keypair.c"
 $115 = $g; //@line 172 "HyMES/keypair.c"
 _poly_free($115); //@line 172 "HyMES/keypair.c"
 $i = 0; //@line 174 "HyMES/keypair.c"
 while(1) {
  $116 = $i; //@line 174 "HyMES/keypair.c"
  $117 = ($116|0)<(60); //@line 174 "HyMES/keypair.c"
  if (!($117)) {
   break;
  }
  $118 = $0; //@line 175 "HyMES/keypair.c"
  $119 = $i; //@line 175 "HyMES/keypair.c"
  $120 = $sqrtmod; //@line 175 "HyMES/keypair.c"
  $121 = (($120) + ($119<<2)|0); //@line 175 "HyMES/keypair.c"
  $122 = HEAP32[$121>>2]|0; //@line 175 "HyMES/keypair.c"
  $123 = ((($122)) + 8|0); //@line 175 "HyMES/keypair.c"
  $124 = HEAP32[$123>>2]|0; //@line 175 "HyMES/keypair.c"
  dest=$118; src=$124; stop=dest+120|0; do { HEAP8[dest>>0]=HEAP8[src>>0]|0; dest=dest+1|0; src=src+1|0; } while ((dest|0) < (stop|0)); //@line 175 "HyMES/keypair.c"
  $125 = $0; //@line 176 "HyMES/keypair.c"
  $126 = ((($125)) + 120|0); //@line 176 "HyMES/keypair.c"
  $0 = $126; //@line 176 "HyMES/keypair.c"
  $127 = $i; //@line 177 "HyMES/keypair.c"
  $128 = $sqrtmod; //@line 177 "HyMES/keypair.c"
  $129 = (($128) + ($127<<2)|0); //@line 177 "HyMES/keypair.c"
  $130 = HEAP32[$129>>2]|0; //@line 177 "HyMES/keypair.c"
  _poly_free($130); //@line 177 "HyMES/keypair.c"
  $131 = $i; //@line 174 "HyMES/keypair.c"
  $132 = (($131) + 1)|0; //@line 174 "HyMES/keypair.c"
  $i = $132; //@line 174 "HyMES/keypair.c"
 }
 $133 = $sqrtmod; //@line 179 "HyMES/keypair.c"
 _free($133); //@line 179 "HyMES/keypair.c"
 $134 = $1; //@line 181 "HyMES/keypair.c"
 $135 = $R; //@line 181 "HyMES/keypair.c"
 $136 = ((($135)) + 16|0); //@line 181 "HyMES/keypair.c"
 $137 = HEAP32[$136>>2]|0; //@line 181 "HyMES/keypair.c"
 $138 = $R; //@line 181 "HyMES/keypair.c"
 $139 = ((($138)) + 12|0); //@line 181 "HyMES/keypair.c"
 $140 = HEAP32[$139>>2]|0; //@line 181 "HyMES/keypair.c"
 _memcpy(($134|0),($137|0),($140|0))|0; //@line 181 "HyMES/keypair.c"
 $141 = $R; //@line 182 "HyMES/keypair.c"
 _mat_free($141); //@line 182 "HyMES/keypair.c"
 STACKTOP = sp;return 1; //@line 184 "HyMES/keypair.c"
}
function _mat_ini($rown,$coln) {
 $rown = $rown|0;
 $coln = $coln|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $A = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $rown;
 $1 = $coln;
 $2 = (_malloc(20)|0); //@line 37 "HyMES/mat.c"
 $A = $2; //@line 37 "HyMES/mat.c"
 $3 = $1; //@line 38 "HyMES/mat.c"
 $4 = $A; //@line 38 "HyMES/mat.c"
 $5 = ((($4)) + 4|0); //@line 38 "HyMES/mat.c"
 HEAP32[$5>>2] = $3; //@line 38 "HyMES/mat.c"
 $6 = $0; //@line 39 "HyMES/mat.c"
 $7 = $A; //@line 39 "HyMES/mat.c"
 HEAP32[$7>>2] = $6; //@line 39 "HyMES/mat.c"
 $8 = $1; //@line 40 "HyMES/mat.c"
 $9 = (($8) - 1)|0; //@line 40 "HyMES/mat.c"
 $10 = (($9>>>0) / 32)&-1; //@line 40 "HyMES/mat.c"
 $11 = (1 + ($10))|0; //@line 40 "HyMES/mat.c"
 $12 = $A; //@line 40 "HyMES/mat.c"
 $13 = ((($12)) + 8|0); //@line 40 "HyMES/mat.c"
 HEAP32[$13>>2] = $11; //@line 40 "HyMES/mat.c"
 $14 = $0; //@line 41 "HyMES/mat.c"
 $15 = $A; //@line 41 "HyMES/mat.c"
 $16 = ((($15)) + 8|0); //@line 41 "HyMES/mat.c"
 $17 = HEAP32[$16>>2]|0; //@line 41 "HyMES/mat.c"
 $18 = Math_imul($14, $17)|0; //@line 41 "HyMES/mat.c"
 $19 = $18<<2; //@line 41 "HyMES/mat.c"
 $20 = $A; //@line 41 "HyMES/mat.c"
 $21 = ((($20)) + 12|0); //@line 41 "HyMES/mat.c"
 HEAP32[$21>>2] = $19; //@line 41 "HyMES/mat.c"
 $22 = $A; //@line 42 "HyMES/mat.c"
 $23 = ((($22)) + 12|0); //@line 42 "HyMES/mat.c"
 $24 = HEAP32[$23>>2]|0; //@line 42 "HyMES/mat.c"
 $25 = (_malloc($24)|0); //@line 42 "HyMES/mat.c"
 $26 = $A; //@line 42 "HyMES/mat.c"
 $27 = ((($26)) + 16|0); //@line 42 "HyMES/mat.c"
 HEAP32[$27>>2] = $25; //@line 42 "HyMES/mat.c"
 $28 = $A; //@line 43 "HyMES/mat.c"
 STACKTOP = sp;return ($28|0); //@line 43 "HyMES/mat.c"
}
function _mat_free($A) {
 $A = $A|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $A;
 $1 = $0; //@line 62 "HyMES/mat.c"
 $2 = ((($1)) + 16|0); //@line 62 "HyMES/mat.c"
 $3 = HEAP32[$2>>2]|0; //@line 62 "HyMES/mat.c"
 _free($3); //@line 62 "HyMES/mat.c"
 $4 = $0; //@line 63 "HyMES/mat.c"
 _free($4); //@line 63 "HyMES/mat.c"
 STACKTOP = sp;return; //@line 64 "HyMES/mat.c"
}
function _mat_rowxor($A,$a,$b) {
 $A = $A|0;
 $a = $a|0;
 $b = $b|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $A;
 $1 = $a;
 $2 = $b;
 $i = 0; //@line 81 "HyMES/mat.c"
 while(1) {
  $3 = $i; //@line 81 "HyMES/mat.c"
  $4 = $0; //@line 81 "HyMES/mat.c"
  $5 = ((($4)) + 8|0); //@line 81 "HyMES/mat.c"
  $6 = HEAP32[$5>>2]|0; //@line 81 "HyMES/mat.c"
  $7 = ($3|0)<($6|0); //@line 81 "HyMES/mat.c"
  if (!($7)) {
   break;
  }
  $8 = $2; //@line 83 "HyMES/mat.c"
  $9 = $0; //@line 83 "HyMES/mat.c"
  $10 = ((($9)) + 8|0); //@line 83 "HyMES/mat.c"
  $11 = HEAP32[$10>>2]|0; //@line 83 "HyMES/mat.c"
  $12 = Math_imul($8, $11)|0; //@line 83 "HyMES/mat.c"
  $13 = $i; //@line 83 "HyMES/mat.c"
  $14 = (($12) + ($13))|0; //@line 83 "HyMES/mat.c"
  $15 = $0; //@line 83 "HyMES/mat.c"
  $16 = ((($15)) + 16|0); //@line 83 "HyMES/mat.c"
  $17 = HEAP32[$16>>2]|0; //@line 83 "HyMES/mat.c"
  $18 = (($17) + ($14<<2)|0); //@line 83 "HyMES/mat.c"
  $19 = HEAP32[$18>>2]|0; //@line 83 "HyMES/mat.c"
  $20 = $1; //@line 83 "HyMES/mat.c"
  $21 = $0; //@line 83 "HyMES/mat.c"
  $22 = ((($21)) + 8|0); //@line 83 "HyMES/mat.c"
  $23 = HEAP32[$22>>2]|0; //@line 83 "HyMES/mat.c"
  $24 = Math_imul($20, $23)|0; //@line 83 "HyMES/mat.c"
  $25 = $i; //@line 83 "HyMES/mat.c"
  $26 = (($24) + ($25))|0; //@line 83 "HyMES/mat.c"
  $27 = $0; //@line 83 "HyMES/mat.c"
  $28 = ((($27)) + 16|0); //@line 83 "HyMES/mat.c"
  $29 = HEAP32[$28>>2]|0; //@line 83 "HyMES/mat.c"
  $30 = (($29) + ($26<<2)|0); //@line 83 "HyMES/mat.c"
  $31 = HEAP32[$30>>2]|0; //@line 83 "HyMES/mat.c"
  $32 = $31 ^ $19; //@line 83 "HyMES/mat.c"
  HEAP32[$30>>2] = $32; //@line 83 "HyMES/mat.c"
  $33 = $i; //@line 81 "HyMES/mat.c"
  $34 = (($33) + 1)|0; //@line 81 "HyMES/mat.c"
  $i = $34; //@line 81 "HyMES/mat.c"
 }
 $35 = $0; //@line 85 "HyMES/mat.c"
 STACKTOP = sp;return ($35|0); //@line 85 "HyMES/mat.c"
}
function _mat_rref($A) {
 $A = $A|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0;
 var $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0;
 var $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0;
 var $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0;
 var $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $failcnt = 0, $findrow = 0, $i = 0, $j = 0, $max = 0, $perm = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $A;
 $2 = $1; //@line 93 "HyMES/mat.c"
 $3 = ((($2)) + 4|0); //@line 93 "HyMES/mat.c"
 $4 = HEAP32[$3>>2]|0; //@line 93 "HyMES/mat.c"
 $5 = (($4) - 1)|0; //@line 93 "HyMES/mat.c"
 $max = $5; //@line 93 "HyMES/mat.c"
 $6 = $1; //@line 96 "HyMES/mat.c"
 $7 = ((($6)) + 4|0); //@line 96 "HyMES/mat.c"
 $8 = HEAP32[$7>>2]|0; //@line 96 "HyMES/mat.c"
 $9 = $8<<2; //@line 96 "HyMES/mat.c"
 $10 = (_malloc($9)|0); //@line 96 "HyMES/mat.c"
 $perm = $10; //@line 96 "HyMES/mat.c"
 $i = 0; //@line 98 "HyMES/mat.c"
 while(1) {
  $11 = $i; //@line 98 "HyMES/mat.c"
  $12 = $1; //@line 98 "HyMES/mat.c"
  $13 = ((($12)) + 4|0); //@line 98 "HyMES/mat.c"
  $14 = HEAP32[$13>>2]|0; //@line 98 "HyMES/mat.c"
  $15 = ($11|0)<($14|0); //@line 98 "HyMES/mat.c"
  if (!($15)) {
   break;
  }
  $16 = $i; //@line 99 "HyMES/mat.c"
  $17 = $i; //@line 99 "HyMES/mat.c"
  $18 = $perm; //@line 99 "HyMES/mat.c"
  $19 = (($18) + ($17<<2)|0); //@line 99 "HyMES/mat.c"
  HEAP32[$19>>2] = $16; //@line 99 "HyMES/mat.c"
  $20 = $i; //@line 98 "HyMES/mat.c"
  $21 = (($20) + 1)|0; //@line 98 "HyMES/mat.c"
  $i = $21; //@line 98 "HyMES/mat.c"
 }
 $failcnt = 0; //@line 100 "HyMES/mat.c"
 $i = 0; //@line 102 "HyMES/mat.c"
 L5: while(1) {
  $22 = $i; //@line 102 "HyMES/mat.c"
  $23 = $1; //@line 102 "HyMES/mat.c"
  $24 = HEAP32[$23>>2]|0; //@line 102 "HyMES/mat.c"
  $25 = ($22|0)<($24|0); //@line 102 "HyMES/mat.c"
  if (!($25)) {
   label = 28;
   break;
  }
  $findrow = 0; //@line 104 "HyMES/mat.c"
  $26 = $i; //@line 105 "HyMES/mat.c"
  $j = $26; //@line 105 "HyMES/mat.c"
  while(1) {
   $27 = $j; //@line 105 "HyMES/mat.c"
   $28 = $1; //@line 105 "HyMES/mat.c"
   $29 = HEAP32[$28>>2]|0; //@line 105 "HyMES/mat.c"
   $30 = ($27|0)<($29|0); //@line 105 "HyMES/mat.c"
   if (!($30)) {
    break;
   }
   $31 = $j; //@line 107 "HyMES/mat.c"
   $32 = $1; //@line 107 "HyMES/mat.c"
   $33 = ((($32)) + 8|0); //@line 107 "HyMES/mat.c"
   $34 = HEAP32[$33>>2]|0; //@line 107 "HyMES/mat.c"
   $35 = Math_imul($31, $34)|0; //@line 107 "HyMES/mat.c"
   $36 = $max; //@line 107 "HyMES/mat.c"
   $37 = (($36>>>0) / 32)&-1; //@line 107 "HyMES/mat.c"
   $38 = (($35) + ($37))|0; //@line 107 "HyMES/mat.c"
   $39 = $1; //@line 107 "HyMES/mat.c"
   $40 = ((($39)) + 16|0); //@line 107 "HyMES/mat.c"
   $41 = HEAP32[$40>>2]|0; //@line 107 "HyMES/mat.c"
   $42 = (($41) + ($38<<2)|0); //@line 107 "HyMES/mat.c"
   $43 = HEAP32[$42>>2]|0; //@line 107 "HyMES/mat.c"
   $44 = $max; //@line 107 "HyMES/mat.c"
   $45 = (($44>>>0) % 32)&-1; //@line 107 "HyMES/mat.c"
   $46 = $43 >>> $45; //@line 107 "HyMES/mat.c"
   $47 = $46 & 1; //@line 107 "HyMES/mat.c"
   $48 = ($47|0)!=(0); //@line 107 "HyMES/mat.c"
   if ($48) {
    label = 9;
    break;
   }
   $56 = $j; //@line 105 "HyMES/mat.c"
   $57 = (($56) + 1)|0; //@line 105 "HyMES/mat.c"
   $j = $57; //@line 105 "HyMES/mat.c"
  }
  if ((label|0) == 9) {
   label = 0;
   $49 = $i; //@line 110 "HyMES/mat.c"
   $50 = $j; //@line 110 "HyMES/mat.c"
   $51 = ($49|0)!=($50|0); //@line 110 "HyMES/mat.c"
   if ($51) {
    $52 = $1; //@line 111 "HyMES/mat.c"
    $53 = $i; //@line 111 "HyMES/mat.c"
    $54 = $j; //@line 111 "HyMES/mat.c"
    $55 = (_mat_rowxor($52,$53,$54)|0); //@line 111 "HyMES/mat.c"
    $1 = $55; //@line 111 "HyMES/mat.c"
   }
   $findrow = 1; //@line 112 "HyMES/mat.c"
  }
  $58 = $findrow; //@line 118 "HyMES/mat.c"
  $59 = ($58|0)!=(0); //@line 118 "HyMES/mat.c"
  $60 = $max; //@line 130 "HyMES/mat.c"
  L18: do {
   if ($59) {
    $78 = $i; //@line 130 "HyMES/mat.c"
    $79 = $1; //@line 130 "HyMES/mat.c"
    $80 = ((($79)) + 4|0); //@line 130 "HyMES/mat.c"
    $81 = HEAP32[$80>>2]|0; //@line 130 "HyMES/mat.c"
    $82 = (($78) + ($81))|0; //@line 130 "HyMES/mat.c"
    $83 = $1; //@line 130 "HyMES/mat.c"
    $84 = HEAP32[$83>>2]|0; //@line 130 "HyMES/mat.c"
    $85 = (($82) - ($84))|0; //@line 130 "HyMES/mat.c"
    $86 = $perm; //@line 130 "HyMES/mat.c"
    $87 = (($86) + ($85<<2)|0); //@line 130 "HyMES/mat.c"
    HEAP32[$87>>2] = $60; //@line 130 "HyMES/mat.c"
    $88 = $i; //@line 131 "HyMES/mat.c"
    $89 = (($88) + 1)|0; //@line 131 "HyMES/mat.c"
    $j = $89; //@line 131 "HyMES/mat.c"
    while(1) {
     $90 = $j; //@line 131 "HyMES/mat.c"
     $91 = $1; //@line 131 "HyMES/mat.c"
     $92 = HEAP32[$91>>2]|0; //@line 131 "HyMES/mat.c"
     $93 = ($90|0)<($92|0); //@line 131 "HyMES/mat.c"
     if (!($93)) {
      break;
     }
     $94 = $j; //@line 133 "HyMES/mat.c"
     $95 = $1; //@line 133 "HyMES/mat.c"
     $96 = ((($95)) + 8|0); //@line 133 "HyMES/mat.c"
     $97 = HEAP32[$96>>2]|0; //@line 133 "HyMES/mat.c"
     $98 = Math_imul($94, $97)|0; //@line 133 "HyMES/mat.c"
     $99 = $max; //@line 133 "HyMES/mat.c"
     $100 = (($99>>>0) / 32)&-1; //@line 133 "HyMES/mat.c"
     $101 = (($98) + ($100))|0; //@line 133 "HyMES/mat.c"
     $102 = $1; //@line 133 "HyMES/mat.c"
     $103 = ((($102)) + 16|0); //@line 133 "HyMES/mat.c"
     $104 = HEAP32[$103>>2]|0; //@line 133 "HyMES/mat.c"
     $105 = (($104) + ($101<<2)|0); //@line 133 "HyMES/mat.c"
     $106 = HEAP32[$105>>2]|0; //@line 133 "HyMES/mat.c"
     $107 = $max; //@line 133 "HyMES/mat.c"
     $108 = (($107>>>0) % 32)&-1; //@line 133 "HyMES/mat.c"
     $109 = $106 >>> $108; //@line 133 "HyMES/mat.c"
     $110 = $109 & 1; //@line 133 "HyMES/mat.c"
     $111 = ($110|0)!=(0); //@line 133 "HyMES/mat.c"
     if ($111) {
      $112 = $1; //@line 134 "HyMES/mat.c"
      $113 = $j; //@line 134 "HyMES/mat.c"
      $114 = $i; //@line 134 "HyMES/mat.c"
      $115 = (_mat_rowxor($112,$113,$114)|0); //@line 134 "HyMES/mat.c"
      $1 = $115; //@line 134 "HyMES/mat.c"
     }
     $116 = $j; //@line 131 "HyMES/mat.c"
     $117 = (($116) + 1)|0; //@line 131 "HyMES/mat.c"
     $j = $117; //@line 131 "HyMES/mat.c"
    }
    $118 = $i; //@line 137 "HyMES/mat.c"
    $119 = (($118) - 1)|0; //@line 137 "HyMES/mat.c"
    $j = $119; //@line 137 "HyMES/mat.c"
    while(1) {
     $120 = $j; //@line 137 "HyMES/mat.c"
     $121 = ($120|0)>=(0); //@line 137 "HyMES/mat.c"
     if (!($121)) {
      break L18;
     }
     $122 = $j; //@line 139 "HyMES/mat.c"
     $123 = $1; //@line 139 "HyMES/mat.c"
     $124 = ((($123)) + 8|0); //@line 139 "HyMES/mat.c"
     $125 = HEAP32[$124>>2]|0; //@line 139 "HyMES/mat.c"
     $126 = Math_imul($122, $125)|0; //@line 139 "HyMES/mat.c"
     $127 = $max; //@line 139 "HyMES/mat.c"
     $128 = (($127>>>0) / 32)&-1; //@line 139 "HyMES/mat.c"
     $129 = (($126) + ($128))|0; //@line 139 "HyMES/mat.c"
     $130 = $1; //@line 139 "HyMES/mat.c"
     $131 = ((($130)) + 16|0); //@line 139 "HyMES/mat.c"
     $132 = HEAP32[$131>>2]|0; //@line 139 "HyMES/mat.c"
     $133 = (($132) + ($129<<2)|0); //@line 139 "HyMES/mat.c"
     $134 = HEAP32[$133>>2]|0; //@line 139 "HyMES/mat.c"
     $135 = $max; //@line 139 "HyMES/mat.c"
     $136 = (($135>>>0) % 32)&-1; //@line 139 "HyMES/mat.c"
     $137 = $134 >>> $136; //@line 139 "HyMES/mat.c"
     $138 = $137 & 1; //@line 139 "HyMES/mat.c"
     $139 = ($138|0)!=(0); //@line 139 "HyMES/mat.c"
     if ($139) {
      $140 = $1; //@line 140 "HyMES/mat.c"
      $141 = $j; //@line 140 "HyMES/mat.c"
      $142 = $i; //@line 140 "HyMES/mat.c"
      $143 = (_mat_rowxor($140,$141,$142)|0); //@line 140 "HyMES/mat.c"
      $1 = $143; //@line 140 "HyMES/mat.c"
     }
     $144 = $j; //@line 137 "HyMES/mat.c"
     $145 = (($144) + -1)|0; //@line 137 "HyMES/mat.c"
     $j = $145; //@line 137 "HyMES/mat.c"
    }
   } else {
    $61 = $1; //@line 120 "HyMES/mat.c"
    $62 = ((($61)) + 4|0); //@line 120 "HyMES/mat.c"
    $63 = HEAP32[$62>>2]|0; //@line 120 "HyMES/mat.c"
    $64 = $1; //@line 120 "HyMES/mat.c"
    $65 = HEAP32[$64>>2]|0; //@line 120 "HyMES/mat.c"
    $66 = (($63) - ($65))|0; //@line 120 "HyMES/mat.c"
    $67 = (($66) - 1)|0; //@line 120 "HyMES/mat.c"
    $68 = $failcnt; //@line 120 "HyMES/mat.c"
    $69 = (($67) - ($68))|0; //@line 120 "HyMES/mat.c"
    $70 = $perm; //@line 120 "HyMES/mat.c"
    $71 = (($70) + ($69<<2)|0); //@line 120 "HyMES/mat.c"
    HEAP32[$71>>2] = $60; //@line 120 "HyMES/mat.c"
    $72 = $failcnt; //@line 121 "HyMES/mat.c"
    $73 = (($72) + 1)|0; //@line 121 "HyMES/mat.c"
    $failcnt = $73; //@line 121 "HyMES/mat.c"
    $74 = $max; //@line 122 "HyMES/mat.c"
    $75 = ($74|0)!=(0); //@line 122 "HyMES/mat.c"
    if (!($75)) {
     label = 15;
     break L5;
    }
    $76 = $i; //@line 126 "HyMES/mat.c"
    $77 = (($76) + -1)|0; //@line 126 "HyMES/mat.c"
    $i = $77; //@line 126 "HyMES/mat.c"
   }
  } while(0);
  $146 = $i; //@line 102 "HyMES/mat.c"
  $147 = (($146) + 1)|0; //@line 102 "HyMES/mat.c"
  $i = $147; //@line 102 "HyMES/mat.c"
  $148 = $max; //@line 102 "HyMES/mat.c"
  $149 = (($148) + -1)|0; //@line 102 "HyMES/mat.c"
  $max = $149; //@line 102 "HyMES/mat.c"
 }
 if ((label|0) == 15) {
  $0 = 0; //@line 124 "HyMES/mat.c"
  $151 = $0; //@line 146 "HyMES/mat.c"
  STACKTOP = sp;return ($151|0); //@line 146 "HyMES/mat.c"
 }
 else if ((label|0) == 28) {
  $150 = $perm; //@line 145 "HyMES/mat.c"
  $0 = $150; //@line 145 "HyMES/mat.c"
  $151 = $0; //@line 146 "HyMES/mat.c"
  STACKTOP = sp;return ($151|0); //@line 146 "HyMES/mat.c"
 }
 return (0)|0;
}
function _poly_alloc($d) {
 $d = $d|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $p = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $d;
 $1 = (_malloc(12)|0); //@line 35 "HyMES/poly.c"
 $p = $1; //@line 35 "HyMES/poly.c"
 $2 = $p; //@line 36 "HyMES/poly.c"
 HEAP32[$2>>2] = -1; //@line 36 "HyMES/poly.c"
 $3 = $0; //@line 37 "HyMES/poly.c"
 $4 = (($3) + 1)|0; //@line 37 "HyMES/poly.c"
 $5 = $p; //@line 37 "HyMES/poly.c"
 $6 = ((($5)) + 4|0); //@line 37 "HyMES/poly.c"
 HEAP32[$6>>2] = $4; //@line 37 "HyMES/poly.c"
 $7 = $p; //@line 38 "HyMES/poly.c"
 $8 = ((($7)) + 4|0); //@line 38 "HyMES/poly.c"
 $9 = HEAP32[$8>>2]|0; //@line 38 "HyMES/poly.c"
 $10 = (_calloc($9,2)|0); //@line 38 "HyMES/poly.c"
 $11 = $p; //@line 38 "HyMES/poly.c"
 $12 = ((($11)) + 8|0); //@line 38 "HyMES/poly.c"
 HEAP32[$12>>2] = $10; //@line 38 "HyMES/poly.c"
 $13 = $p; //@line 39 "HyMES/poly.c"
 STACKTOP = sp;return ($13|0); //@line 39 "HyMES/poly.c"
}
function _poly_alloc_from_string($d,$s) {
 $d = $d|0;
 $s = $s|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $p = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $d;
 $1 = $s;
 $2 = (_malloc(12)|0); //@line 46 "HyMES/poly.c"
 $p = $2; //@line 46 "HyMES/poly.c"
 $3 = $p; //@line 47 "HyMES/poly.c"
 HEAP32[$3>>2] = -1; //@line 47 "HyMES/poly.c"
 $4 = $0; //@line 48 "HyMES/poly.c"
 $5 = (($4) + 1)|0; //@line 48 "HyMES/poly.c"
 $6 = $p; //@line 48 "HyMES/poly.c"
 $7 = ((($6)) + 4|0); //@line 48 "HyMES/poly.c"
 HEAP32[$7>>2] = $5; //@line 48 "HyMES/poly.c"
 $8 = $1; //@line 49 "HyMES/poly.c"
 $9 = $p; //@line 49 "HyMES/poly.c"
 $10 = ((($9)) + 8|0); //@line 49 "HyMES/poly.c"
 HEAP32[$10>>2] = $8; //@line 49 "HyMES/poly.c"
 $11 = $p; //@line 50 "HyMES/poly.c"
 STACKTOP = sp;return ($11|0); //@line 50 "HyMES/poly.c"
}
function _poly_copy($p) {
 $p = $p|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $q = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $p;
 $1 = (_malloc(12)|0); //@line 56 "HyMES/poly.c"
 $q = $1; //@line 56 "HyMES/poly.c"
 $2 = $0; //@line 57 "HyMES/poly.c"
 $3 = HEAP32[$2>>2]|0; //@line 57 "HyMES/poly.c"
 $4 = $q; //@line 57 "HyMES/poly.c"
 HEAP32[$4>>2] = $3; //@line 57 "HyMES/poly.c"
 $5 = $0; //@line 58 "HyMES/poly.c"
 $6 = ((($5)) + 4|0); //@line 58 "HyMES/poly.c"
 $7 = HEAP32[$6>>2]|0; //@line 58 "HyMES/poly.c"
 $8 = $q; //@line 58 "HyMES/poly.c"
 $9 = ((($8)) + 4|0); //@line 58 "HyMES/poly.c"
 HEAP32[$9>>2] = $7; //@line 58 "HyMES/poly.c"
 $10 = $q; //@line 59 "HyMES/poly.c"
 $11 = ((($10)) + 4|0); //@line 59 "HyMES/poly.c"
 $12 = HEAP32[$11>>2]|0; //@line 59 "HyMES/poly.c"
 $13 = (_calloc($12,2)|0); //@line 59 "HyMES/poly.c"
 $14 = $q; //@line 59 "HyMES/poly.c"
 $15 = ((($14)) + 8|0); //@line 59 "HyMES/poly.c"
 HEAP32[$15>>2] = $13; //@line 59 "HyMES/poly.c"
 $16 = $q; //@line 60 "HyMES/poly.c"
 $17 = ((($16)) + 8|0); //@line 60 "HyMES/poly.c"
 $18 = HEAP32[$17>>2]|0; //@line 60 "HyMES/poly.c"
 $19 = $0; //@line 60 "HyMES/poly.c"
 $20 = ((($19)) + 8|0); //@line 60 "HyMES/poly.c"
 $21 = HEAP32[$20>>2]|0; //@line 60 "HyMES/poly.c"
 $22 = $0; //@line 60 "HyMES/poly.c"
 $23 = ((($22)) + 4|0); //@line 60 "HyMES/poly.c"
 $24 = HEAP32[$23>>2]|0; //@line 60 "HyMES/poly.c"
 $25 = $24<<1; //@line 60 "HyMES/poly.c"
 _memcpy(($18|0),($21|0),($25|0))|0; //@line 60 "HyMES/poly.c"
 $26 = $q; //@line 61 "HyMES/poly.c"
 STACKTOP = sp;return ($26|0); //@line 61 "HyMES/poly.c"
}
function _poly_free($p) {
 $p = $p|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $p;
 $1 = $0; //@line 65 "HyMES/poly.c"
 $2 = ((($1)) + 8|0); //@line 65 "HyMES/poly.c"
 $3 = HEAP32[$2>>2]|0; //@line 65 "HyMES/poly.c"
 _free($3); //@line 65 "HyMES/poly.c"
 $4 = $0; //@line 66 "HyMES/poly.c"
 _free($4); //@line 66 "HyMES/poly.c"
 STACKTOP = sp;return; //@line 67 "HyMES/poly.c"
}
function _poly_set_to_zero($p) {
 $p = $p|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $p;
 $1 = $0; //@line 70 "HyMES/poly.c"
 $2 = ((($1)) + 8|0); //@line 70 "HyMES/poly.c"
 $3 = HEAP32[$2>>2]|0; //@line 70 "HyMES/poly.c"
 $4 = $0; //@line 70 "HyMES/poly.c"
 $5 = ((($4)) + 4|0); //@line 70 "HyMES/poly.c"
 $6 = HEAP32[$5>>2]|0; //@line 70 "HyMES/poly.c"
 $7 = $6<<1; //@line 70 "HyMES/poly.c"
 _memset(($3|0),0,($7|0))|0; //@line 70 "HyMES/poly.c"
 $8 = $0; //@line 71 "HyMES/poly.c"
 HEAP32[$8>>2] = -1; //@line 71 "HyMES/poly.c"
 STACKTOP = sp;return; //@line 72 "HyMES/poly.c"
}
function _poly_calcule_deg($p) {
 $p = $p|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var $d = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $p;
 $1 = $0; //@line 75 "HyMES/poly.c"
 $2 = ((($1)) + 4|0); //@line 75 "HyMES/poly.c"
 $3 = HEAP32[$2>>2]|0; //@line 75 "HyMES/poly.c"
 $4 = (($3) - 1)|0; //@line 75 "HyMES/poly.c"
 $d = $4; //@line 75 "HyMES/poly.c"
 while(1) {
  $5 = $d; //@line 76 "HyMES/poly.c"
  $6 = ($5|0)>=(0); //@line 76 "HyMES/poly.c"
  if ($6) {
   $7 = $d; //@line 76 "HyMES/poly.c"
   $8 = $0; //@line 76 "HyMES/poly.c"
   $9 = ((($8)) + 8|0); //@line 76 "HyMES/poly.c"
   $10 = HEAP32[$9>>2]|0; //@line 76 "HyMES/poly.c"
   $11 = (($10) + ($7<<1)|0); //@line 76 "HyMES/poly.c"
   $12 = HEAP16[$11>>1]|0; //@line 76 "HyMES/poly.c"
   $13 = $12&65535; //@line 76 "HyMES/poly.c"
   $14 = ($13|0)==(0); //@line 76 "HyMES/poly.c"
   $19 = $14;
  } else {
   $19 = 0;
  }
  $15 = $d; //@line 77 "HyMES/poly.c"
  if (!($19)) {
   break;
  }
  $16 = (($15) + -1)|0; //@line 77 "HyMES/poly.c"
  $d = $16; //@line 77 "HyMES/poly.c"
 }
 $17 = $0; //@line 78 "HyMES/poly.c"
 HEAP32[$17>>2] = $15; //@line 78 "HyMES/poly.c"
 $18 = $d; //@line 79 "HyMES/poly.c"
 STACKTOP = sp;return ($18|0); //@line 79 "HyMES/poly.c"
}
function _poly_set($p,$q) {
 $p = $p|0;
 $q = $q|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $d = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $p;
 $1 = $q;
 $2 = $0; //@line 84 "HyMES/poly.c"
 $3 = ((($2)) + 4|0); //@line 84 "HyMES/poly.c"
 $4 = HEAP32[$3>>2]|0; //@line 84 "HyMES/poly.c"
 $5 = $1; //@line 84 "HyMES/poly.c"
 $6 = ((($5)) + 4|0); //@line 84 "HyMES/poly.c"
 $7 = HEAP32[$6>>2]|0; //@line 84 "HyMES/poly.c"
 $8 = (($4) - ($7))|0; //@line 84 "HyMES/poly.c"
 $d = $8; //@line 84 "HyMES/poly.c"
 $9 = $d; //@line 85 "HyMES/poly.c"
 $10 = ($9|0)<(0); //@line 85 "HyMES/poly.c"
 $11 = $0; //@line 86 "HyMES/poly.c"
 $12 = ((($11)) + 8|0); //@line 86 "HyMES/poly.c"
 $13 = HEAP32[$12>>2]|0; //@line 86 "HyMES/poly.c"
 $14 = $1; //@line 86 "HyMES/poly.c"
 $15 = ((($14)) + 8|0); //@line 86 "HyMES/poly.c"
 $16 = HEAP32[$15>>2]|0; //@line 86 "HyMES/poly.c"
 if ($10) {
  $17 = $0; //@line 86 "HyMES/poly.c"
  $18 = ((($17)) + 4|0); //@line 86 "HyMES/poly.c"
  $19 = HEAP32[$18>>2]|0; //@line 86 "HyMES/poly.c"
  $20 = $19<<1; //@line 86 "HyMES/poly.c"
  _memcpy(($13|0),($16|0),($20|0))|0; //@line 86 "HyMES/poly.c"
  $21 = $0; //@line 87 "HyMES/poly.c"
  (_poly_calcule_deg($21)|0); //@line 87 "HyMES/poly.c"
  STACKTOP = sp;return; //@line 94 "HyMES/poly.c"
 } else {
  $22 = $1; //@line 90 "HyMES/poly.c"
  $23 = ((($22)) + 4|0); //@line 90 "HyMES/poly.c"
  $24 = HEAP32[$23>>2]|0; //@line 90 "HyMES/poly.c"
  $25 = $24<<1; //@line 90 "HyMES/poly.c"
  _memcpy(($13|0),($16|0),($25|0))|0; //@line 90 "HyMES/poly.c"
  $26 = $0; //@line 91 "HyMES/poly.c"
  $27 = ((($26)) + 8|0); //@line 91 "HyMES/poly.c"
  $28 = HEAP32[$27>>2]|0; //@line 91 "HyMES/poly.c"
  $29 = $1; //@line 91 "HyMES/poly.c"
  $30 = ((($29)) + 4|0); //@line 91 "HyMES/poly.c"
  $31 = HEAP32[$30>>2]|0; //@line 91 "HyMES/poly.c"
  $32 = (($28) + ($31<<1)|0); //@line 91 "HyMES/poly.c"
  $33 = $d; //@line 91 "HyMES/poly.c"
  $34 = $33<<1; //@line 91 "HyMES/poly.c"
  _memset(($32|0),0,($34|0))|0; //@line 91 "HyMES/poly.c"
  $35 = $1; //@line 92 "HyMES/poly.c"
  $36 = HEAP32[$35>>2]|0; //@line 92 "HyMES/poly.c"
  $37 = $0; //@line 92 "HyMES/poly.c"
  HEAP32[$37>>2] = $36; //@line 92 "HyMES/poly.c"
  STACKTOP = sp;return; //@line 94 "HyMES/poly.c"
 }
}
function _poly_eval_aux($coeff,$a,$d) {
 $coeff = $coeff|0;
 $a = $a|0;
 $d = $d|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $7 = 0, $8 = 0, $9 = 0, $b = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $coeff;
 $1 = $a;
 $2 = $d;
 $3 = $2; //@line 99 "HyMES/poly.c"
 $4 = (($3) + -1)|0; //@line 99 "HyMES/poly.c"
 $2 = $4; //@line 99 "HyMES/poly.c"
 $5 = $0; //@line 99 "HyMES/poly.c"
 $6 = (($5) + ($3<<1)|0); //@line 99 "HyMES/poly.c"
 $7 = HEAP16[$6>>1]|0; //@line 99 "HyMES/poly.c"
 $b = $7; //@line 99 "HyMES/poly.c"
 while(1) {
  $8 = $2; //@line 100 "HyMES/poly.c"
  $9 = ($8|0)>=(0); //@line 100 "HyMES/poly.c"
  $10 = $b; //@line 101 "HyMES/poly.c"
  if (!($9)) {
   break;
  }
  $11 = $10&65535; //@line 101 "HyMES/poly.c"
  $12 = ($11|0)!=(0); //@line 101 "HyMES/poly.c"
  if ($12) {
   $13 = $b; //@line 102 "HyMES/poly.c"
   $14 = $13&65535; //@line 102 "HyMES/poly.c"
   $15 = ($14|0)!=(0); //@line 102 "HyMES/poly.c"
   if ($15) {
    $16 = $1; //@line 102 "HyMES/poly.c"
    $17 = $16&65535; //@line 102 "HyMES/poly.c"
    $18 = ($17|0)!=(0); //@line 102 "HyMES/poly.c"
    if ($18) {
     $19 = $b; //@line 102 "HyMES/poly.c"
     $20 = $19&65535; //@line 102 "HyMES/poly.c"
     $21 = HEAP32[5120>>2]|0; //@line 102 "HyMES/poly.c"
     $22 = (($21) + ($20<<1)|0); //@line 102 "HyMES/poly.c"
     $23 = HEAP16[$22>>1]|0; //@line 102 "HyMES/poly.c"
     $24 = $23&65535; //@line 102 "HyMES/poly.c"
     $25 = $1; //@line 102 "HyMES/poly.c"
     $26 = $25&65535; //@line 102 "HyMES/poly.c"
     $27 = HEAP32[5120>>2]|0; //@line 102 "HyMES/poly.c"
     $28 = (($27) + ($26<<1)|0); //@line 102 "HyMES/poly.c"
     $29 = HEAP16[$28>>1]|0; //@line 102 "HyMES/poly.c"
     $30 = $29&65535; //@line 102 "HyMES/poly.c"
     $31 = (($24) + ($30))|0; //@line 102 "HyMES/poly.c"
     $32 = HEAP32[5124>>2]|0; //@line 102 "HyMES/poly.c"
     $33 = $31 & $32; //@line 102 "HyMES/poly.c"
     $34 = $b; //@line 102 "HyMES/poly.c"
     $35 = $34&65535; //@line 102 "HyMES/poly.c"
     $36 = HEAP32[5120>>2]|0; //@line 102 "HyMES/poly.c"
     $37 = (($36) + ($35<<1)|0); //@line 102 "HyMES/poly.c"
     $38 = HEAP16[$37>>1]|0; //@line 102 "HyMES/poly.c"
     $39 = $38&65535; //@line 102 "HyMES/poly.c"
     $40 = $1; //@line 102 "HyMES/poly.c"
     $41 = $40&65535; //@line 102 "HyMES/poly.c"
     $42 = HEAP32[5120>>2]|0; //@line 102 "HyMES/poly.c"
     $43 = (($42) + ($41<<1)|0); //@line 102 "HyMES/poly.c"
     $44 = HEAP16[$43>>1]|0; //@line 102 "HyMES/poly.c"
     $45 = $44&65535; //@line 102 "HyMES/poly.c"
     $46 = (($39) + ($45))|0; //@line 102 "HyMES/poly.c"
     $47 = HEAP32[5128>>2]|0; //@line 102 "HyMES/poly.c"
     $48 = $46 >> $47; //@line 102 "HyMES/poly.c"
     $49 = (($33) + ($48))|0; //@line 102 "HyMES/poly.c"
     $50 = HEAP32[5132>>2]|0; //@line 102 "HyMES/poly.c"
     $51 = (($50) + ($49<<1)|0); //@line 102 "HyMES/poly.c"
     $52 = HEAP16[$51>>1]|0; //@line 102 "HyMES/poly.c"
     $53 = $52&65535; //@line 102 "HyMES/poly.c"
     $60 = $53;
    } else {
     $60 = 0;
    }
   } else {
    $60 = 0;
   }
   $54 = $2; //@line 102 "HyMES/poly.c"
   $55 = $0; //@line 102 "HyMES/poly.c"
   $56 = (($55) + ($54<<1)|0); //@line 102 "HyMES/poly.c"
   $57 = HEAP16[$56>>1]|0; //@line 102 "HyMES/poly.c"
   $58 = $57&65535; //@line 102 "HyMES/poly.c"
   $59 = $60 ^ $58; //@line 102 "HyMES/poly.c"
   $61 = $59&65535; //@line 102 "HyMES/poly.c"
   $b = $61; //@line 102 "HyMES/poly.c"
  } else {
   $62 = $2; //@line 104 "HyMES/poly.c"
   $63 = $0; //@line 104 "HyMES/poly.c"
   $64 = (($63) + ($62<<1)|0); //@line 104 "HyMES/poly.c"
   $65 = HEAP16[$64>>1]|0; //@line 104 "HyMES/poly.c"
   $b = $65; //@line 104 "HyMES/poly.c"
  }
  $66 = $2; //@line 100 "HyMES/poly.c"
  $67 = (($66) + -1)|0; //@line 100 "HyMES/poly.c"
  $2 = $67; //@line 100 "HyMES/poly.c"
 }
 STACKTOP = sp;return ($10|0); //@line 105 "HyMES/poly.c"
}
function _poly_eval($p,$a) {
 $p = $p|0;
 $a = $a|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $p;
 $1 = $a;
 $2 = $0; //@line 126 "HyMES/poly.c"
 $3 = ((($2)) + 8|0); //@line 126 "HyMES/poly.c"
 $4 = HEAP32[$3>>2]|0; //@line 126 "HyMES/poly.c"
 $5 = $1; //@line 126 "HyMES/poly.c"
 $6 = $0; //@line 126 "HyMES/poly.c"
 $7 = HEAP32[$6>>2]|0; //@line 126 "HyMES/poly.c"
 $8 = (_poly_eval_aux($4,$5,$7)|0); //@line 126 "HyMES/poly.c"
 STACKTOP = sp;return ($8|0); //@line 126 "HyMES/poly.c"
}
function _poly_rem($p,$g) {
 $p = $p|0;
 $g = $g|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0;
 var $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0;
 var $a = 0, $b = 0, $d = 0, $i = 0, $j = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $p;
 $1 = $g;
 $2 = $0; //@line 134 "HyMES/poly.c"
 $3 = HEAP32[$2>>2]|0; //@line 134 "HyMES/poly.c"
 $4 = $1; //@line 134 "HyMES/poly.c"
 $5 = HEAP32[$4>>2]|0; //@line 134 "HyMES/poly.c"
 $6 = (($3) - ($5))|0; //@line 134 "HyMES/poly.c"
 $d = $6; //@line 134 "HyMES/poly.c"
 $7 = $d; //@line 135 "HyMES/poly.c"
 $8 = ($7|0)>=(0); //@line 135 "HyMES/poly.c"
 if (!($8)) {
  STACKTOP = sp;return; //@line 149 "HyMES/poly.c"
 }
 $9 = HEAP32[5124>>2]|0; //@line 136 "HyMES/poly.c"
 $10 = $1; //@line 136 "HyMES/poly.c"
 $11 = HEAP32[$10>>2]|0; //@line 136 "HyMES/poly.c"
 $12 = $1; //@line 136 "HyMES/poly.c"
 $13 = ((($12)) + 8|0); //@line 136 "HyMES/poly.c"
 $14 = HEAP32[$13>>2]|0; //@line 136 "HyMES/poly.c"
 $15 = (($14) + ($11<<1)|0); //@line 136 "HyMES/poly.c"
 $16 = HEAP16[$15>>1]|0; //@line 136 "HyMES/poly.c"
 $17 = $16&65535; //@line 136 "HyMES/poly.c"
 $18 = HEAP32[5120>>2]|0; //@line 136 "HyMES/poly.c"
 $19 = (($18) + ($17<<1)|0); //@line 136 "HyMES/poly.c"
 $20 = HEAP16[$19>>1]|0; //@line 136 "HyMES/poly.c"
 $21 = $20&65535; //@line 136 "HyMES/poly.c"
 $22 = (($9) - ($21))|0; //@line 136 "HyMES/poly.c"
 $23 = HEAP32[5132>>2]|0; //@line 136 "HyMES/poly.c"
 $24 = (($23) + ($22<<1)|0); //@line 136 "HyMES/poly.c"
 $25 = HEAP16[$24>>1]|0; //@line 136 "HyMES/poly.c"
 $a = $25; //@line 136 "HyMES/poly.c"
 $26 = $0; //@line 137 "HyMES/poly.c"
 $27 = HEAP32[$26>>2]|0; //@line 137 "HyMES/poly.c"
 $i = $27; //@line 137 "HyMES/poly.c"
 while(1) {
  $28 = $d; //@line 137 "HyMES/poly.c"
  $29 = ($28|0)>=(0); //@line 137 "HyMES/poly.c"
  if (!($29)) {
   break;
  }
  $30 = $i; //@line 138 "HyMES/poly.c"
  $31 = $0; //@line 138 "HyMES/poly.c"
  $32 = ((($31)) + 8|0); //@line 138 "HyMES/poly.c"
  $33 = HEAP32[$32>>2]|0; //@line 138 "HyMES/poly.c"
  $34 = (($33) + ($30<<1)|0); //@line 138 "HyMES/poly.c"
  $35 = HEAP16[$34>>1]|0; //@line 138 "HyMES/poly.c"
  $36 = $35&65535; //@line 138 "HyMES/poly.c"
  $37 = ($36|0)!=(0); //@line 138 "HyMES/poly.c"
  if ($37) {
   $38 = $i; //@line 139 "HyMES/poly.c"
   $39 = $0; //@line 139 "HyMES/poly.c"
   $40 = ((($39)) + 8|0); //@line 139 "HyMES/poly.c"
   $41 = HEAP32[$40>>2]|0; //@line 139 "HyMES/poly.c"
   $42 = (($41) + ($38<<1)|0); //@line 139 "HyMES/poly.c"
   $43 = HEAP16[$42>>1]|0; //@line 139 "HyMES/poly.c"
   $44 = $43&65535; //@line 139 "HyMES/poly.c"
   $45 = ($44|0)!=(0); //@line 139 "HyMES/poly.c"
   if ($45) {
    $46 = $a; //@line 139 "HyMES/poly.c"
    $47 = $46&65535; //@line 139 "HyMES/poly.c"
    $48 = HEAP32[5120>>2]|0; //@line 139 "HyMES/poly.c"
    $49 = (($48) + ($47<<1)|0); //@line 139 "HyMES/poly.c"
    $50 = HEAP16[$49>>1]|0; //@line 139 "HyMES/poly.c"
    $51 = $50&65535; //@line 139 "HyMES/poly.c"
    $52 = $i; //@line 139 "HyMES/poly.c"
    $53 = $0; //@line 139 "HyMES/poly.c"
    $54 = ((($53)) + 8|0); //@line 139 "HyMES/poly.c"
    $55 = HEAP32[$54>>2]|0; //@line 139 "HyMES/poly.c"
    $56 = (($55) + ($52<<1)|0); //@line 139 "HyMES/poly.c"
    $57 = HEAP16[$56>>1]|0; //@line 139 "HyMES/poly.c"
    $58 = $57&65535; //@line 139 "HyMES/poly.c"
    $59 = HEAP32[5120>>2]|0; //@line 139 "HyMES/poly.c"
    $60 = (($59) + ($58<<1)|0); //@line 139 "HyMES/poly.c"
    $61 = HEAP16[$60>>1]|0; //@line 139 "HyMES/poly.c"
    $62 = $61&65535; //@line 139 "HyMES/poly.c"
    $63 = (($51) + ($62))|0; //@line 139 "HyMES/poly.c"
    $64 = HEAP32[5124>>2]|0; //@line 139 "HyMES/poly.c"
    $65 = $63 & $64; //@line 139 "HyMES/poly.c"
    $66 = $a; //@line 139 "HyMES/poly.c"
    $67 = $66&65535; //@line 139 "HyMES/poly.c"
    $68 = HEAP32[5120>>2]|0; //@line 139 "HyMES/poly.c"
    $69 = (($68) + ($67<<1)|0); //@line 139 "HyMES/poly.c"
    $70 = HEAP16[$69>>1]|0; //@line 139 "HyMES/poly.c"
    $71 = $70&65535; //@line 139 "HyMES/poly.c"
    $72 = $i; //@line 139 "HyMES/poly.c"
    $73 = $0; //@line 139 "HyMES/poly.c"
    $74 = ((($73)) + 8|0); //@line 139 "HyMES/poly.c"
    $75 = HEAP32[$74>>2]|0; //@line 139 "HyMES/poly.c"
    $76 = (($75) + ($72<<1)|0); //@line 139 "HyMES/poly.c"
    $77 = HEAP16[$76>>1]|0; //@line 139 "HyMES/poly.c"
    $78 = $77&65535; //@line 139 "HyMES/poly.c"
    $79 = HEAP32[5120>>2]|0; //@line 139 "HyMES/poly.c"
    $80 = (($79) + ($78<<1)|0); //@line 139 "HyMES/poly.c"
    $81 = HEAP16[$80>>1]|0; //@line 139 "HyMES/poly.c"
    $82 = $81&65535; //@line 139 "HyMES/poly.c"
    $83 = (($71) + ($82))|0; //@line 139 "HyMES/poly.c"
    $84 = HEAP32[5128>>2]|0; //@line 139 "HyMES/poly.c"
    $85 = $83 >> $84; //@line 139 "HyMES/poly.c"
    $86 = (($65) + ($85))|0; //@line 139 "HyMES/poly.c"
    $87 = HEAP32[5132>>2]|0; //@line 139 "HyMES/poly.c"
    $88 = (($87) + ($86<<1)|0); //@line 139 "HyMES/poly.c"
    $89 = HEAP16[$88>>1]|0; //@line 139 "HyMES/poly.c"
    $90 = $89&65535; //@line 139 "HyMES/poly.c"
    $92 = $90;
   } else {
    $92 = 0;
   }
   $91 = $92&65535; //@line 139 "HyMES/poly.c"
   $b = $91; //@line 139 "HyMES/poly.c"
   $j = 0; //@line 140 "HyMES/poly.c"
   while(1) {
    $93 = $j; //@line 140 "HyMES/poly.c"
    $94 = $1; //@line 140 "HyMES/poly.c"
    $95 = HEAP32[$94>>2]|0; //@line 140 "HyMES/poly.c"
    $96 = ($93|0)<($95|0); //@line 140 "HyMES/poly.c"
    if (!($96)) {
     break;
    }
    $97 = $j; //@line 141 "HyMES/poly.c"
    $98 = $d; //@line 141 "HyMES/poly.c"
    $99 = (($97) + ($98))|0; //@line 141 "HyMES/poly.c"
    $100 = $0; //@line 141 "HyMES/poly.c"
    $101 = ((($100)) + 8|0); //@line 141 "HyMES/poly.c"
    $102 = HEAP32[$101>>2]|0; //@line 141 "HyMES/poly.c"
    $103 = (($102) + ($99<<1)|0); //@line 141 "HyMES/poly.c"
    $104 = HEAP16[$103>>1]|0; //@line 141 "HyMES/poly.c"
    $105 = $104&65535; //@line 141 "HyMES/poly.c"
    $106 = $j; //@line 141 "HyMES/poly.c"
    $107 = $1; //@line 141 "HyMES/poly.c"
    $108 = ((($107)) + 8|0); //@line 141 "HyMES/poly.c"
    $109 = HEAP32[$108>>2]|0; //@line 141 "HyMES/poly.c"
    $110 = (($109) + ($106<<1)|0); //@line 141 "HyMES/poly.c"
    $111 = HEAP16[$110>>1]|0; //@line 141 "HyMES/poly.c"
    $112 = $111&65535; //@line 141 "HyMES/poly.c"
    $113 = ($112|0)!=(0); //@line 141 "HyMES/poly.c"
    if ($113) {
     $114 = $b; //@line 141 "HyMES/poly.c"
     $115 = $114&65535; //@line 141 "HyMES/poly.c"
     $116 = HEAP32[5120>>2]|0; //@line 141 "HyMES/poly.c"
     $117 = (($116) + ($115<<1)|0); //@line 141 "HyMES/poly.c"
     $118 = HEAP16[$117>>1]|0; //@line 141 "HyMES/poly.c"
     $119 = $118&65535; //@line 141 "HyMES/poly.c"
     $120 = $j; //@line 141 "HyMES/poly.c"
     $121 = $1; //@line 141 "HyMES/poly.c"
     $122 = ((($121)) + 8|0); //@line 141 "HyMES/poly.c"
     $123 = HEAP32[$122>>2]|0; //@line 141 "HyMES/poly.c"
     $124 = (($123) + ($120<<1)|0); //@line 141 "HyMES/poly.c"
     $125 = HEAP16[$124>>1]|0; //@line 141 "HyMES/poly.c"
     $126 = $125&65535; //@line 141 "HyMES/poly.c"
     $127 = HEAP32[5120>>2]|0; //@line 141 "HyMES/poly.c"
     $128 = (($127) + ($126<<1)|0); //@line 141 "HyMES/poly.c"
     $129 = HEAP16[$128>>1]|0; //@line 141 "HyMES/poly.c"
     $130 = $129&65535; //@line 141 "HyMES/poly.c"
     $131 = (($119) + ($130))|0; //@line 141 "HyMES/poly.c"
     $132 = HEAP32[5124>>2]|0; //@line 141 "HyMES/poly.c"
     $133 = $131 & $132; //@line 141 "HyMES/poly.c"
     $134 = $b; //@line 141 "HyMES/poly.c"
     $135 = $134&65535; //@line 141 "HyMES/poly.c"
     $136 = HEAP32[5120>>2]|0; //@line 141 "HyMES/poly.c"
     $137 = (($136) + ($135<<1)|0); //@line 141 "HyMES/poly.c"
     $138 = HEAP16[$137>>1]|0; //@line 141 "HyMES/poly.c"
     $139 = $138&65535; //@line 141 "HyMES/poly.c"
     $140 = $j; //@line 141 "HyMES/poly.c"
     $141 = $1; //@line 141 "HyMES/poly.c"
     $142 = ((($141)) + 8|0); //@line 141 "HyMES/poly.c"
     $143 = HEAP32[$142>>2]|0; //@line 141 "HyMES/poly.c"
     $144 = (($143) + ($140<<1)|0); //@line 141 "HyMES/poly.c"
     $145 = HEAP16[$144>>1]|0; //@line 141 "HyMES/poly.c"
     $146 = $145&65535; //@line 141 "HyMES/poly.c"
     $147 = HEAP32[5120>>2]|0; //@line 141 "HyMES/poly.c"
     $148 = (($147) + ($146<<1)|0); //@line 141 "HyMES/poly.c"
     $149 = HEAP16[$148>>1]|0; //@line 141 "HyMES/poly.c"
     $150 = $149&65535; //@line 141 "HyMES/poly.c"
     $151 = (($139) + ($150))|0; //@line 141 "HyMES/poly.c"
     $152 = HEAP32[5128>>2]|0; //@line 141 "HyMES/poly.c"
     $153 = $151 >> $152; //@line 141 "HyMES/poly.c"
     $154 = (($133) + ($153))|0; //@line 141 "HyMES/poly.c"
     $155 = HEAP32[5132>>2]|0; //@line 141 "HyMES/poly.c"
     $156 = (($155) + ($154<<1)|0); //@line 141 "HyMES/poly.c"
     $157 = HEAP16[$156>>1]|0; //@line 141 "HyMES/poly.c"
     $158 = $157&65535; //@line 141 "HyMES/poly.c"
     $160 = $158;
    } else {
     $160 = 0;
    }
    $159 = $105 ^ $160; //@line 141 "HyMES/poly.c"
    $161 = $159&65535; //@line 141 "HyMES/poly.c"
    $162 = $j; //@line 141 "HyMES/poly.c"
    $163 = $d; //@line 141 "HyMES/poly.c"
    $164 = (($162) + ($163))|0; //@line 141 "HyMES/poly.c"
    $165 = $0; //@line 141 "HyMES/poly.c"
    $166 = ((($165)) + 8|0); //@line 141 "HyMES/poly.c"
    $167 = HEAP32[$166>>2]|0; //@line 141 "HyMES/poly.c"
    $168 = (($167) + ($164<<1)|0); //@line 141 "HyMES/poly.c"
    HEAP16[$168>>1] = $161; //@line 141 "HyMES/poly.c"
    $169 = $j; //@line 140 "HyMES/poly.c"
    $170 = (($169) + 1)|0; //@line 140 "HyMES/poly.c"
    $j = $170; //@line 140 "HyMES/poly.c"
   }
   $171 = $i; //@line 142 "HyMES/poly.c"
   $172 = $0; //@line 142 "HyMES/poly.c"
   $173 = ((($172)) + 8|0); //@line 142 "HyMES/poly.c"
   $174 = HEAP32[$173>>2]|0; //@line 142 "HyMES/poly.c"
   $175 = (($174) + ($171<<1)|0); //@line 142 "HyMES/poly.c"
   HEAP16[$175>>1] = 0; //@line 142 "HyMES/poly.c"
  }
  $176 = $i; //@line 137 "HyMES/poly.c"
  $177 = (($176) + -1)|0; //@line 137 "HyMES/poly.c"
  $i = $177; //@line 137 "HyMES/poly.c"
  $178 = $d; //@line 137 "HyMES/poly.c"
  $179 = (($178) + -1)|0; //@line 137 "HyMES/poly.c"
  $d = $179; //@line 137 "HyMES/poly.c"
 }
 $180 = $1; //@line 145 "HyMES/poly.c"
 $181 = HEAP32[$180>>2]|0; //@line 145 "HyMES/poly.c"
 $182 = (($181) - 1)|0; //@line 145 "HyMES/poly.c"
 $183 = $0; //@line 145 "HyMES/poly.c"
 HEAP32[$183>>2] = $182; //@line 145 "HyMES/poly.c"
 while(1) {
  $184 = $0; //@line 146 "HyMES/poly.c"
  $185 = HEAP32[$184>>2]|0; //@line 146 "HyMES/poly.c"
  $186 = ($185|0)>=(0); //@line 146 "HyMES/poly.c"
  if (!($186)) {
   label = 18;
   break;
  }
  $187 = $0; //@line 146 "HyMES/poly.c"
  $188 = HEAP32[$187>>2]|0; //@line 146 "HyMES/poly.c"
  $189 = $0; //@line 146 "HyMES/poly.c"
  $190 = ((($189)) + 8|0); //@line 146 "HyMES/poly.c"
  $191 = HEAP32[$190>>2]|0; //@line 146 "HyMES/poly.c"
  $192 = (($191) + ($188<<1)|0); //@line 146 "HyMES/poly.c"
  $193 = HEAP16[$192>>1]|0; //@line 146 "HyMES/poly.c"
  $194 = $193&65535; //@line 146 "HyMES/poly.c"
  $195 = ($194|0)==(0); //@line 146 "HyMES/poly.c"
  if (!($195)) {
   label = 18;
   break;
  }
  $196 = $0; //@line 147 "HyMES/poly.c"
  $197 = HEAP32[$196>>2]|0; //@line 147 "HyMES/poly.c"
  $198 = (($197) - 1)|0; //@line 147 "HyMES/poly.c"
  $199 = $0; //@line 147 "HyMES/poly.c"
  HEAP32[$199>>2] = $198; //@line 147 "HyMES/poly.c"
 }
 if ((label|0) == 18) {
  STACKTOP = sp;return; //@line 149 "HyMES/poly.c"
 }
}
function _poly_sqmod_init($g,$sq) {
 $g = $g|0;
 $sq = $sq|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $8 = 0, $9 = 0, $d = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $g;
 $1 = $sq;
 $2 = $0; //@line 154 "HyMES/poly.c"
 $3 = HEAP32[$2>>2]|0; //@line 154 "HyMES/poly.c"
 $d = $3; //@line 154 "HyMES/poly.c"
 $i = 0; //@line 156 "HyMES/poly.c"
 while(1) {
  $4 = $i; //@line 156 "HyMES/poly.c"
  $5 = $d; //@line 156 "HyMES/poly.c"
  $6 = (($5|0) / 2)&-1; //@line 156 "HyMES/poly.c"
  $7 = ($4|0)<($6|0); //@line 156 "HyMES/poly.c"
  if (!($7)) {
   break;
  }
  $8 = $i; //@line 158 "HyMES/poly.c"
  $9 = $1; //@line 158 "HyMES/poly.c"
  $10 = (($9) + ($8<<2)|0); //@line 158 "HyMES/poly.c"
  $11 = HEAP32[$10>>2]|0; //@line 158 "HyMES/poly.c"
  _poly_set_to_zero($11); //@line 158 "HyMES/poly.c"
  $12 = $i; //@line 159 "HyMES/poly.c"
  $13 = $12<<1; //@line 159 "HyMES/poly.c"
  $14 = $i; //@line 159 "HyMES/poly.c"
  $15 = $1; //@line 159 "HyMES/poly.c"
  $16 = (($15) + ($14<<2)|0); //@line 159 "HyMES/poly.c"
  $17 = HEAP32[$16>>2]|0; //@line 159 "HyMES/poly.c"
  HEAP32[$17>>2] = $13; //@line 159 "HyMES/poly.c"
  $18 = $i; //@line 160 "HyMES/poly.c"
  $19 = $18<<1; //@line 160 "HyMES/poly.c"
  $20 = $i; //@line 160 "HyMES/poly.c"
  $21 = $1; //@line 160 "HyMES/poly.c"
  $22 = (($21) + ($20<<2)|0); //@line 160 "HyMES/poly.c"
  $23 = HEAP32[$22>>2]|0; //@line 160 "HyMES/poly.c"
  $24 = ((($23)) + 8|0); //@line 160 "HyMES/poly.c"
  $25 = HEAP32[$24>>2]|0; //@line 160 "HyMES/poly.c"
  $26 = (($25) + ($19<<1)|0); //@line 160 "HyMES/poly.c"
  HEAP16[$26>>1] = 1; //@line 160 "HyMES/poly.c"
  $27 = $i; //@line 156 "HyMES/poly.c"
  $28 = (($27) + 1)|0; //@line 156 "HyMES/poly.c"
  $i = $28; //@line 156 "HyMES/poly.c"
 }
 while(1) {
  $29 = $i; //@line 163 "HyMES/poly.c"
  $30 = $d; //@line 163 "HyMES/poly.c"
  $31 = ($29|0)<($30|0); //@line 163 "HyMES/poly.c"
  if (!($31)) {
   break;
  }
  $32 = $i; //@line 165 "HyMES/poly.c"
  $33 = $1; //@line 165 "HyMES/poly.c"
  $34 = (($33) + ($32<<2)|0); //@line 165 "HyMES/poly.c"
  $35 = HEAP32[$34>>2]|0; //@line 165 "HyMES/poly.c"
  $36 = ((($35)) + 8|0); //@line 165 "HyMES/poly.c"
  $37 = HEAP32[$36>>2]|0; //@line 165 "HyMES/poly.c"
  ;HEAP16[$37>>1]=0|0;HEAP16[$37+2>>1]=0|0; //@line 165 "HyMES/poly.c"
  $38 = $i; //@line 166 "HyMES/poly.c"
  $39 = $1; //@line 166 "HyMES/poly.c"
  $40 = (($39) + ($38<<2)|0); //@line 166 "HyMES/poly.c"
  $41 = HEAP32[$40>>2]|0; //@line 166 "HyMES/poly.c"
  $42 = ((($41)) + 8|0); //@line 166 "HyMES/poly.c"
  $43 = HEAP32[$42>>2]|0; //@line 166 "HyMES/poly.c"
  $44 = ((($43)) + 4|0); //@line 166 "HyMES/poly.c"
  $45 = $i; //@line 166 "HyMES/poly.c"
  $46 = (($45) - 1)|0; //@line 166 "HyMES/poly.c"
  $47 = $1; //@line 166 "HyMES/poly.c"
  $48 = (($47) + ($46<<2)|0); //@line 166 "HyMES/poly.c"
  $49 = HEAP32[$48>>2]|0; //@line 166 "HyMES/poly.c"
  $50 = ((($49)) + 8|0); //@line 166 "HyMES/poly.c"
  $51 = HEAP32[$50>>2]|0; //@line 166 "HyMES/poly.c"
  $52 = $d; //@line 166 "HyMES/poly.c"
  $53 = $52<<1; //@line 166 "HyMES/poly.c"
  _memcpy(($44|0),($51|0),($53|0))|0; //@line 166 "HyMES/poly.c"
  $54 = $i; //@line 167 "HyMES/poly.c"
  $55 = (($54) - 1)|0; //@line 167 "HyMES/poly.c"
  $56 = $1; //@line 167 "HyMES/poly.c"
  $57 = (($56) + ($55<<2)|0); //@line 167 "HyMES/poly.c"
  $58 = HEAP32[$57>>2]|0; //@line 167 "HyMES/poly.c"
  $59 = HEAP32[$58>>2]|0; //@line 167 "HyMES/poly.c"
  $60 = (($59) + 2)|0; //@line 167 "HyMES/poly.c"
  $61 = $i; //@line 167 "HyMES/poly.c"
  $62 = $1; //@line 167 "HyMES/poly.c"
  $63 = (($62) + ($61<<2)|0); //@line 167 "HyMES/poly.c"
  $64 = HEAP32[$63>>2]|0; //@line 167 "HyMES/poly.c"
  HEAP32[$64>>2] = $60; //@line 167 "HyMES/poly.c"
  $65 = $i; //@line 168 "HyMES/poly.c"
  $66 = $1; //@line 168 "HyMES/poly.c"
  $67 = (($66) + ($65<<2)|0); //@line 168 "HyMES/poly.c"
  $68 = HEAP32[$67>>2]|0; //@line 168 "HyMES/poly.c"
  $69 = $0; //@line 168 "HyMES/poly.c"
  _poly_rem($68,$69); //@line 168 "HyMES/poly.c"
  $70 = $i; //@line 163 "HyMES/poly.c"
  $71 = (($70) + 1)|0; //@line 163 "HyMES/poly.c"
  $i = $71; //@line 163 "HyMES/poly.c"
 }
 STACKTOP = sp;return; //@line 170 "HyMES/poly.c"
}
function _poly_sqmod($res,$p,$sq,$d) {
 $res = $res|0;
 $p = $p|0;
 $sq = $sq|0;
 $d = $d|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0;
 var $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0;
 var $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0;
 var $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0;
 var $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $a = 0, $i = 0, $j = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $res;
 $1 = $p;
 $2 = $sq;
 $3 = $d;
 $4 = $0; //@line 180 "HyMES/poly.c"
 _poly_set_to_zero($4); //@line 180 "HyMES/poly.c"
 $i = 0; //@line 183 "HyMES/poly.c"
 while(1) {
  $5 = $i; //@line 183 "HyMES/poly.c"
  $6 = $3; //@line 183 "HyMES/poly.c"
  $7 = (($6|0) / 2)&-1; //@line 183 "HyMES/poly.c"
  $8 = ($5|0)<($7|0); //@line 183 "HyMES/poly.c"
  if (!($8)) {
   break;
  }
  $9 = $i; //@line 184 "HyMES/poly.c"
  $10 = $1; //@line 184 "HyMES/poly.c"
  $11 = ((($10)) + 8|0); //@line 184 "HyMES/poly.c"
  $12 = HEAP32[$11>>2]|0; //@line 184 "HyMES/poly.c"
  $13 = (($12) + ($9<<1)|0); //@line 184 "HyMES/poly.c"
  $14 = HEAP16[$13>>1]|0; //@line 184 "HyMES/poly.c"
  $15 = $14&65535; //@line 184 "HyMES/poly.c"
  $16 = ($15|0)!=(0); //@line 184 "HyMES/poly.c"
  if ($16) {
   $17 = $i; //@line 184 "HyMES/poly.c"
   $18 = $1; //@line 184 "HyMES/poly.c"
   $19 = ((($18)) + 8|0); //@line 184 "HyMES/poly.c"
   $20 = HEAP32[$19>>2]|0; //@line 184 "HyMES/poly.c"
   $21 = (($20) + ($17<<1)|0); //@line 184 "HyMES/poly.c"
   $22 = HEAP16[$21>>1]|0; //@line 184 "HyMES/poly.c"
   $23 = $22&65535; //@line 184 "HyMES/poly.c"
   $24 = HEAP32[5120>>2]|0; //@line 184 "HyMES/poly.c"
   $25 = (($24) + ($23<<1)|0); //@line 184 "HyMES/poly.c"
   $26 = HEAP16[$25>>1]|0; //@line 184 "HyMES/poly.c"
   $27 = $26&65535; //@line 184 "HyMES/poly.c"
   $28 = $27 << 1; //@line 184 "HyMES/poly.c"
   $29 = HEAP32[5124>>2]|0; //@line 184 "HyMES/poly.c"
   $30 = $28 & $29; //@line 184 "HyMES/poly.c"
   $31 = $i; //@line 184 "HyMES/poly.c"
   $32 = $1; //@line 184 "HyMES/poly.c"
   $33 = ((($32)) + 8|0); //@line 184 "HyMES/poly.c"
   $34 = HEAP32[$33>>2]|0; //@line 184 "HyMES/poly.c"
   $35 = (($34) + ($31<<1)|0); //@line 184 "HyMES/poly.c"
   $36 = HEAP16[$35>>1]|0; //@line 184 "HyMES/poly.c"
   $37 = $36&65535; //@line 184 "HyMES/poly.c"
   $38 = HEAP32[5120>>2]|0; //@line 184 "HyMES/poly.c"
   $39 = (($38) + ($37<<1)|0); //@line 184 "HyMES/poly.c"
   $40 = HEAP16[$39>>1]|0; //@line 184 "HyMES/poly.c"
   $41 = $40&65535; //@line 184 "HyMES/poly.c"
   $42 = $41 << 1; //@line 184 "HyMES/poly.c"
   $43 = HEAP32[5128>>2]|0; //@line 184 "HyMES/poly.c"
   $44 = $42 >> $43; //@line 184 "HyMES/poly.c"
   $45 = (($30) + ($44))|0; //@line 184 "HyMES/poly.c"
   $46 = HEAP32[5132>>2]|0; //@line 184 "HyMES/poly.c"
   $47 = (($46) + ($45<<1)|0); //@line 184 "HyMES/poly.c"
   $48 = HEAP16[$47>>1]|0; //@line 184 "HyMES/poly.c"
   $49 = $48&65535; //@line 184 "HyMES/poly.c"
   $51 = $49;
  } else {
   $51 = 0;
  }
  $50 = $51&65535; //@line 184 "HyMES/poly.c"
  $52 = $i; //@line 184 "HyMES/poly.c"
  $53 = $52<<1; //@line 184 "HyMES/poly.c"
  $54 = $0; //@line 184 "HyMES/poly.c"
  $55 = ((($54)) + 8|0); //@line 184 "HyMES/poly.c"
  $56 = HEAP32[$55>>2]|0; //@line 184 "HyMES/poly.c"
  $57 = (($56) + ($53<<1)|0); //@line 184 "HyMES/poly.c"
  HEAP16[$57>>1] = $50; //@line 184 "HyMES/poly.c"
  $58 = $i; //@line 183 "HyMES/poly.c"
  $59 = (($58) + 1)|0; //@line 183 "HyMES/poly.c"
  $i = $59; //@line 183 "HyMES/poly.c"
 }
 while(1) {
  $60 = $i; //@line 187 "HyMES/poly.c"
  $61 = $3; //@line 187 "HyMES/poly.c"
  $62 = ($60|0)<($61|0); //@line 187 "HyMES/poly.c"
  if (!($62)) {
   break;
  }
  $63 = $i; //@line 188 "HyMES/poly.c"
  $64 = $1; //@line 188 "HyMES/poly.c"
  $65 = ((($64)) + 8|0); //@line 188 "HyMES/poly.c"
  $66 = HEAP32[$65>>2]|0; //@line 188 "HyMES/poly.c"
  $67 = (($66) + ($63<<1)|0); //@line 188 "HyMES/poly.c"
  $68 = HEAP16[$67>>1]|0; //@line 188 "HyMES/poly.c"
  $69 = $68&65535; //@line 188 "HyMES/poly.c"
  $70 = ($69|0)!=(0); //@line 188 "HyMES/poly.c"
  L10: do {
   if ($70) {
    $71 = $i; //@line 189 "HyMES/poly.c"
    $72 = $1; //@line 189 "HyMES/poly.c"
    $73 = ((($72)) + 8|0); //@line 189 "HyMES/poly.c"
    $74 = HEAP32[$73>>2]|0; //@line 189 "HyMES/poly.c"
    $75 = (($74) + ($71<<1)|0); //@line 189 "HyMES/poly.c"
    $76 = HEAP16[$75>>1]|0; //@line 189 "HyMES/poly.c"
    $77 = $76&65535; //@line 189 "HyMES/poly.c"
    $78 = ($77|0)!=(0); //@line 189 "HyMES/poly.c"
    if ($78) {
     $79 = $i; //@line 189 "HyMES/poly.c"
     $80 = $1; //@line 189 "HyMES/poly.c"
     $81 = ((($80)) + 8|0); //@line 189 "HyMES/poly.c"
     $82 = HEAP32[$81>>2]|0; //@line 189 "HyMES/poly.c"
     $83 = (($82) + ($79<<1)|0); //@line 189 "HyMES/poly.c"
     $84 = HEAP16[$83>>1]|0; //@line 189 "HyMES/poly.c"
     $85 = $84&65535; //@line 189 "HyMES/poly.c"
     $86 = HEAP32[5120>>2]|0; //@line 189 "HyMES/poly.c"
     $87 = (($86) + ($85<<1)|0); //@line 189 "HyMES/poly.c"
     $88 = HEAP16[$87>>1]|0; //@line 189 "HyMES/poly.c"
     $89 = $88&65535; //@line 189 "HyMES/poly.c"
     $90 = $89 << 1; //@line 189 "HyMES/poly.c"
     $91 = HEAP32[5124>>2]|0; //@line 189 "HyMES/poly.c"
     $92 = $90 & $91; //@line 189 "HyMES/poly.c"
     $93 = $i; //@line 189 "HyMES/poly.c"
     $94 = $1; //@line 189 "HyMES/poly.c"
     $95 = ((($94)) + 8|0); //@line 189 "HyMES/poly.c"
     $96 = HEAP32[$95>>2]|0; //@line 189 "HyMES/poly.c"
     $97 = (($96) + ($93<<1)|0); //@line 189 "HyMES/poly.c"
     $98 = HEAP16[$97>>1]|0; //@line 189 "HyMES/poly.c"
     $99 = $98&65535; //@line 189 "HyMES/poly.c"
     $100 = HEAP32[5120>>2]|0; //@line 189 "HyMES/poly.c"
     $101 = (($100) + ($99<<1)|0); //@line 189 "HyMES/poly.c"
     $102 = HEAP16[$101>>1]|0; //@line 189 "HyMES/poly.c"
     $103 = $102&65535; //@line 189 "HyMES/poly.c"
     $104 = $103 << 1; //@line 189 "HyMES/poly.c"
     $105 = HEAP32[5128>>2]|0; //@line 189 "HyMES/poly.c"
     $106 = $104 >> $105; //@line 189 "HyMES/poly.c"
     $107 = (($92) + ($106))|0; //@line 189 "HyMES/poly.c"
     $108 = HEAP32[5132>>2]|0; //@line 189 "HyMES/poly.c"
     $109 = (($108) + ($107<<1)|0); //@line 189 "HyMES/poly.c"
     $110 = HEAP16[$109>>1]|0; //@line 189 "HyMES/poly.c"
     $111 = $110&65535; //@line 189 "HyMES/poly.c"
     $113 = $111;
    } else {
     $113 = 0;
    }
    $112 = $113&65535; //@line 189 "HyMES/poly.c"
    $a = $112; //@line 189 "HyMES/poly.c"
    $j = 0; //@line 190 "HyMES/poly.c"
    while(1) {
     $114 = $j; //@line 190 "HyMES/poly.c"
     $115 = $3; //@line 190 "HyMES/poly.c"
     $116 = ($114|0)<($115|0); //@line 190 "HyMES/poly.c"
     if (!($116)) {
      break L10;
     }
     $117 = $j; //@line 191 "HyMES/poly.c"
     $118 = $0; //@line 191 "HyMES/poly.c"
     $119 = ((($118)) + 8|0); //@line 191 "HyMES/poly.c"
     $120 = HEAP32[$119>>2]|0; //@line 191 "HyMES/poly.c"
     $121 = (($120) + ($117<<1)|0); //@line 191 "HyMES/poly.c"
     $122 = HEAP16[$121>>1]|0; //@line 191 "HyMES/poly.c"
     $123 = $122&65535; //@line 191 "HyMES/poly.c"
     $124 = $j; //@line 191 "HyMES/poly.c"
     $125 = $i; //@line 191 "HyMES/poly.c"
     $126 = $2; //@line 191 "HyMES/poly.c"
     $127 = (($126) + ($125<<2)|0); //@line 191 "HyMES/poly.c"
     $128 = HEAP32[$127>>2]|0; //@line 191 "HyMES/poly.c"
     $129 = ((($128)) + 8|0); //@line 191 "HyMES/poly.c"
     $130 = HEAP32[$129>>2]|0; //@line 191 "HyMES/poly.c"
     $131 = (($130) + ($124<<1)|0); //@line 191 "HyMES/poly.c"
     $132 = HEAP16[$131>>1]|0; //@line 191 "HyMES/poly.c"
     $133 = $132&65535; //@line 191 "HyMES/poly.c"
     $134 = ($133|0)!=(0); //@line 191 "HyMES/poly.c"
     if ($134) {
      $135 = $a; //@line 191 "HyMES/poly.c"
      $136 = $135&65535; //@line 191 "HyMES/poly.c"
      $137 = HEAP32[5120>>2]|0; //@line 191 "HyMES/poly.c"
      $138 = (($137) + ($136<<1)|0); //@line 191 "HyMES/poly.c"
      $139 = HEAP16[$138>>1]|0; //@line 191 "HyMES/poly.c"
      $140 = $139&65535; //@line 191 "HyMES/poly.c"
      $141 = $j; //@line 191 "HyMES/poly.c"
      $142 = $i; //@line 191 "HyMES/poly.c"
      $143 = $2; //@line 191 "HyMES/poly.c"
      $144 = (($143) + ($142<<2)|0); //@line 191 "HyMES/poly.c"
      $145 = HEAP32[$144>>2]|0; //@line 191 "HyMES/poly.c"
      $146 = ((($145)) + 8|0); //@line 191 "HyMES/poly.c"
      $147 = HEAP32[$146>>2]|0; //@line 191 "HyMES/poly.c"
      $148 = (($147) + ($141<<1)|0); //@line 191 "HyMES/poly.c"
      $149 = HEAP16[$148>>1]|0; //@line 191 "HyMES/poly.c"
      $150 = $149&65535; //@line 191 "HyMES/poly.c"
      $151 = HEAP32[5120>>2]|0; //@line 191 "HyMES/poly.c"
      $152 = (($151) + ($150<<1)|0); //@line 191 "HyMES/poly.c"
      $153 = HEAP16[$152>>1]|0; //@line 191 "HyMES/poly.c"
      $154 = $153&65535; //@line 191 "HyMES/poly.c"
      $155 = (($140) + ($154))|0; //@line 191 "HyMES/poly.c"
      $156 = HEAP32[5124>>2]|0; //@line 191 "HyMES/poly.c"
      $157 = $155 & $156; //@line 191 "HyMES/poly.c"
      $158 = $a; //@line 191 "HyMES/poly.c"
      $159 = $158&65535; //@line 191 "HyMES/poly.c"
      $160 = HEAP32[5120>>2]|0; //@line 191 "HyMES/poly.c"
      $161 = (($160) + ($159<<1)|0); //@line 191 "HyMES/poly.c"
      $162 = HEAP16[$161>>1]|0; //@line 191 "HyMES/poly.c"
      $163 = $162&65535; //@line 191 "HyMES/poly.c"
      $164 = $j; //@line 191 "HyMES/poly.c"
      $165 = $i; //@line 191 "HyMES/poly.c"
      $166 = $2; //@line 191 "HyMES/poly.c"
      $167 = (($166) + ($165<<2)|0); //@line 191 "HyMES/poly.c"
      $168 = HEAP32[$167>>2]|0; //@line 191 "HyMES/poly.c"
      $169 = ((($168)) + 8|0); //@line 191 "HyMES/poly.c"
      $170 = HEAP32[$169>>2]|0; //@line 191 "HyMES/poly.c"
      $171 = (($170) + ($164<<1)|0); //@line 191 "HyMES/poly.c"
      $172 = HEAP16[$171>>1]|0; //@line 191 "HyMES/poly.c"
      $173 = $172&65535; //@line 191 "HyMES/poly.c"
      $174 = HEAP32[5120>>2]|0; //@line 191 "HyMES/poly.c"
      $175 = (($174) + ($173<<1)|0); //@line 191 "HyMES/poly.c"
      $176 = HEAP16[$175>>1]|0; //@line 191 "HyMES/poly.c"
      $177 = $176&65535; //@line 191 "HyMES/poly.c"
      $178 = (($163) + ($177))|0; //@line 191 "HyMES/poly.c"
      $179 = HEAP32[5128>>2]|0; //@line 191 "HyMES/poly.c"
      $180 = $178 >> $179; //@line 191 "HyMES/poly.c"
      $181 = (($157) + ($180))|0; //@line 191 "HyMES/poly.c"
      $182 = HEAP32[5132>>2]|0; //@line 191 "HyMES/poly.c"
      $183 = (($182) + ($181<<1)|0); //@line 191 "HyMES/poly.c"
      $184 = HEAP16[$183>>1]|0; //@line 191 "HyMES/poly.c"
      $185 = $184&65535; //@line 191 "HyMES/poly.c"
      $187 = $185;
     } else {
      $187 = 0;
     }
     $186 = $123 ^ $187; //@line 191 "HyMES/poly.c"
     $188 = $186&65535; //@line 191 "HyMES/poly.c"
     $189 = $j; //@line 191 "HyMES/poly.c"
     $190 = $0; //@line 191 "HyMES/poly.c"
     $191 = ((($190)) + 8|0); //@line 191 "HyMES/poly.c"
     $192 = HEAP32[$191>>2]|0; //@line 191 "HyMES/poly.c"
     $193 = (($192) + ($189<<1)|0); //@line 191 "HyMES/poly.c"
     HEAP16[$193>>1] = $188; //@line 191 "HyMES/poly.c"
     $194 = $j; //@line 190 "HyMES/poly.c"
     $195 = (($194) + 1)|0; //@line 190 "HyMES/poly.c"
     $j = $195; //@line 190 "HyMES/poly.c"
    }
   }
  } while(0);
  $196 = $i; //@line 187 "HyMES/poly.c"
  $197 = (($196) + 1)|0; //@line 187 "HyMES/poly.c"
  $i = $197; //@line 187 "HyMES/poly.c"
 }
 $198 = $3; //@line 196 "HyMES/poly.c"
 $199 = (($198) - 1)|0; //@line 196 "HyMES/poly.c"
 $200 = $0; //@line 196 "HyMES/poly.c"
 HEAP32[$200>>2] = $199; //@line 196 "HyMES/poly.c"
 while(1) {
  $201 = $0; //@line 197 "HyMES/poly.c"
  $202 = HEAP32[$201>>2]|0; //@line 197 "HyMES/poly.c"
  $203 = ($202|0)>=(0); //@line 197 "HyMES/poly.c"
  if (!($203)) {
   label = 20;
   break;
  }
  $204 = $0; //@line 197 "HyMES/poly.c"
  $205 = HEAP32[$204>>2]|0; //@line 197 "HyMES/poly.c"
  $206 = $0; //@line 197 "HyMES/poly.c"
  $207 = ((($206)) + 8|0); //@line 197 "HyMES/poly.c"
  $208 = HEAP32[$207>>2]|0; //@line 197 "HyMES/poly.c"
  $209 = (($208) + ($205<<1)|0); //@line 197 "HyMES/poly.c"
  $210 = HEAP16[$209>>1]|0; //@line 197 "HyMES/poly.c"
  $211 = $210&65535; //@line 197 "HyMES/poly.c"
  $212 = ($211|0)==(0); //@line 197 "HyMES/poly.c"
  if (!($212)) {
   label = 20;
   break;
  }
  $213 = $0; //@line 198 "HyMES/poly.c"
  $214 = HEAP32[$213>>2]|0; //@line 198 "HyMES/poly.c"
  $215 = (($214) - 1)|0; //@line 198 "HyMES/poly.c"
  $216 = $0; //@line 198 "HyMES/poly.c"
  HEAP32[$216>>2] = $215; //@line 198 "HyMES/poly.c"
 }
 if ((label|0) == 20) {
  STACKTOP = sp;return; //@line 199 "HyMES/poly.c"
 }
}
function _poly_gcd_aux($p1,$p2) {
 $p1 = $p1|0;
 $p2 = $p2|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $1 = $p1;
 $2 = $p2;
 $3 = $2; //@line 203 "HyMES/poly.c"
 $4 = HEAP32[$3>>2]|0; //@line 203 "HyMES/poly.c"
 $5 = ($4|0)==(-1); //@line 203 "HyMES/poly.c"
 $6 = $1; //@line 204 "HyMES/poly.c"
 if ($5) {
  $0 = $6; //@line 204 "HyMES/poly.c"
  $11 = $0; //@line 209 "HyMES/poly.c"
  STACKTOP = sp;return ($11|0); //@line 209 "HyMES/poly.c"
 } else {
  $7 = $2; //@line 206 "HyMES/poly.c"
  _poly_rem($6,$7); //@line 206 "HyMES/poly.c"
  $8 = $2; //@line 207 "HyMES/poly.c"
  $9 = $1; //@line 207 "HyMES/poly.c"
  $10 = (_poly_gcd_aux($8,$9)|0); //@line 207 "HyMES/poly.c"
  $0 = $10; //@line 207 "HyMES/poly.c"
  $11 = $0; //@line 209 "HyMES/poly.c"
  STACKTOP = sp;return ($11|0); //@line 209 "HyMES/poly.c"
 }
 return (0)|0;
}
function _poly_gcd($p1,$p2) {
 $p1 = $p1|0;
 $p2 = $p2|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $a = 0, $b = 0, $c = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $p1;
 $1 = $p2;
 $2 = $0; //@line 214 "HyMES/poly.c"
 $3 = (_poly_copy($2)|0); //@line 214 "HyMES/poly.c"
 $a = $3; //@line 214 "HyMES/poly.c"
 $4 = $1; //@line 215 "HyMES/poly.c"
 $5 = (_poly_copy($4)|0); //@line 215 "HyMES/poly.c"
 $b = $5; //@line 215 "HyMES/poly.c"
 $6 = $a; //@line 216 "HyMES/poly.c"
 $7 = HEAP32[$6>>2]|0; //@line 216 "HyMES/poly.c"
 $8 = $b; //@line 216 "HyMES/poly.c"
 $9 = HEAP32[$8>>2]|0; //@line 216 "HyMES/poly.c"
 $10 = ($7|0)<($9|0); //@line 216 "HyMES/poly.c"
 if ($10) {
  $11 = $b; //@line 217 "HyMES/poly.c"
  $12 = $a; //@line 217 "HyMES/poly.c"
  $13 = (_poly_gcd_aux($11,$12)|0); //@line 217 "HyMES/poly.c"
  $14 = (_poly_copy($13)|0); //@line 217 "HyMES/poly.c"
  $c = $14; //@line 217 "HyMES/poly.c"
 } else {
  $15 = $a; //@line 219 "HyMES/poly.c"
  $16 = $b; //@line 219 "HyMES/poly.c"
  $17 = (_poly_gcd_aux($15,$16)|0); //@line 219 "HyMES/poly.c"
  $18 = (_poly_copy($17)|0); //@line 219 "HyMES/poly.c"
  $c = $18; //@line 219 "HyMES/poly.c"
 }
 $19 = $a; //@line 220 "HyMES/poly.c"
 _poly_free($19); //@line 220 "HyMES/poly.c"
 $20 = $b; //@line 221 "HyMES/poly.c"
 _poly_free($20); //@line 221 "HyMES/poly.c"
 $21 = $c; //@line 222 "HyMES/poly.c"
 STACKTOP = sp;return ($21|0); //@line 222 "HyMES/poly.c"
}
function _poly_quo($p,$d) {
 $p = $p|0;
 $d = $d|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0;
 var $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0;
 var $a = 0, $b = 0, $dd = 0, $dp = 0, $i = 0, $j = 0, $quo = 0, $rem = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $p;
 $1 = $d;
 $2 = $1; //@line 230 "HyMES/poly.c"
 $3 = (_poly_calcule_deg($2)|0); //@line 230 "HyMES/poly.c"
 $dd = $3; //@line 230 "HyMES/poly.c"
 $4 = $0; //@line 231 "HyMES/poly.c"
 $5 = (_poly_calcule_deg($4)|0); //@line 231 "HyMES/poly.c"
 $dp = $5; //@line 231 "HyMES/poly.c"
 $6 = $0; //@line 232 "HyMES/poly.c"
 $7 = (_poly_copy($6)|0); //@line 232 "HyMES/poly.c"
 $rem = $7; //@line 232 "HyMES/poly.c"
 $8 = $dp; //@line 233 "HyMES/poly.c"
 $9 = $dd; //@line 233 "HyMES/poly.c"
 $10 = (($8) - ($9))|0; //@line 233 "HyMES/poly.c"
 $11 = (_poly_alloc($10)|0); //@line 233 "HyMES/poly.c"
 $quo = $11; //@line 233 "HyMES/poly.c"
 $12 = $dp; //@line 234 "HyMES/poly.c"
 $13 = $dd; //@line 234 "HyMES/poly.c"
 $14 = (($12) - ($13))|0; //@line 234 "HyMES/poly.c"
 $15 = $quo; //@line 234 "HyMES/poly.c"
 HEAP32[$15>>2] = $14; //@line 234 "HyMES/poly.c"
 $16 = HEAP32[5124>>2]|0; //@line 235 "HyMES/poly.c"
 $17 = $dd; //@line 235 "HyMES/poly.c"
 $18 = $1; //@line 235 "HyMES/poly.c"
 $19 = ((($18)) + 8|0); //@line 235 "HyMES/poly.c"
 $20 = HEAP32[$19>>2]|0; //@line 235 "HyMES/poly.c"
 $21 = (($20) + ($17<<1)|0); //@line 235 "HyMES/poly.c"
 $22 = HEAP16[$21>>1]|0; //@line 235 "HyMES/poly.c"
 $23 = $22&65535; //@line 235 "HyMES/poly.c"
 $24 = HEAP32[5120>>2]|0; //@line 235 "HyMES/poly.c"
 $25 = (($24) + ($23<<1)|0); //@line 235 "HyMES/poly.c"
 $26 = HEAP16[$25>>1]|0; //@line 235 "HyMES/poly.c"
 $27 = $26&65535; //@line 235 "HyMES/poly.c"
 $28 = (($16) - ($27))|0; //@line 235 "HyMES/poly.c"
 $29 = HEAP32[5132>>2]|0; //@line 235 "HyMES/poly.c"
 $30 = (($29) + ($28<<1)|0); //@line 235 "HyMES/poly.c"
 $31 = HEAP16[$30>>1]|0; //@line 235 "HyMES/poly.c"
 $a = $31; //@line 235 "HyMES/poly.c"
 $32 = $dp; //@line 236 "HyMES/poly.c"
 $i = $32; //@line 236 "HyMES/poly.c"
 while(1) {
  $33 = $i; //@line 236 "HyMES/poly.c"
  $34 = $dd; //@line 236 "HyMES/poly.c"
  $35 = ($33|0)>=($34|0); //@line 236 "HyMES/poly.c"
  if (!($35)) {
   break;
  }
  $36 = $i; //@line 237 "HyMES/poly.c"
  $37 = $rem; //@line 237 "HyMES/poly.c"
  $38 = ((($37)) + 8|0); //@line 237 "HyMES/poly.c"
  $39 = HEAP32[$38>>2]|0; //@line 237 "HyMES/poly.c"
  $40 = (($39) + ($36<<1)|0); //@line 237 "HyMES/poly.c"
  $41 = HEAP16[$40>>1]|0; //@line 237 "HyMES/poly.c"
  $42 = $41&65535; //@line 237 "HyMES/poly.c"
  $43 = ($42|0)!=(0); //@line 237 "HyMES/poly.c"
  if ($43) {
   $44 = $a; //@line 237 "HyMES/poly.c"
   $45 = $44&65535; //@line 237 "HyMES/poly.c"
   $46 = HEAP32[5120>>2]|0; //@line 237 "HyMES/poly.c"
   $47 = (($46) + ($45<<1)|0); //@line 237 "HyMES/poly.c"
   $48 = HEAP16[$47>>1]|0; //@line 237 "HyMES/poly.c"
   $49 = $48&65535; //@line 237 "HyMES/poly.c"
   $50 = $i; //@line 237 "HyMES/poly.c"
   $51 = $rem; //@line 237 "HyMES/poly.c"
   $52 = ((($51)) + 8|0); //@line 237 "HyMES/poly.c"
   $53 = HEAP32[$52>>2]|0; //@line 237 "HyMES/poly.c"
   $54 = (($53) + ($50<<1)|0); //@line 237 "HyMES/poly.c"
   $55 = HEAP16[$54>>1]|0; //@line 237 "HyMES/poly.c"
   $56 = $55&65535; //@line 237 "HyMES/poly.c"
   $57 = HEAP32[5120>>2]|0; //@line 237 "HyMES/poly.c"
   $58 = (($57) + ($56<<1)|0); //@line 237 "HyMES/poly.c"
   $59 = HEAP16[$58>>1]|0; //@line 237 "HyMES/poly.c"
   $60 = $59&65535; //@line 237 "HyMES/poly.c"
   $61 = (($49) + ($60))|0; //@line 237 "HyMES/poly.c"
   $62 = HEAP32[5124>>2]|0; //@line 237 "HyMES/poly.c"
   $63 = $61 & $62; //@line 237 "HyMES/poly.c"
   $64 = $a; //@line 237 "HyMES/poly.c"
   $65 = $64&65535; //@line 237 "HyMES/poly.c"
   $66 = HEAP32[5120>>2]|0; //@line 237 "HyMES/poly.c"
   $67 = (($66) + ($65<<1)|0); //@line 237 "HyMES/poly.c"
   $68 = HEAP16[$67>>1]|0; //@line 237 "HyMES/poly.c"
   $69 = $68&65535; //@line 237 "HyMES/poly.c"
   $70 = $i; //@line 237 "HyMES/poly.c"
   $71 = $rem; //@line 237 "HyMES/poly.c"
   $72 = ((($71)) + 8|0); //@line 237 "HyMES/poly.c"
   $73 = HEAP32[$72>>2]|0; //@line 237 "HyMES/poly.c"
   $74 = (($73) + ($70<<1)|0); //@line 237 "HyMES/poly.c"
   $75 = HEAP16[$74>>1]|0; //@line 237 "HyMES/poly.c"
   $76 = $75&65535; //@line 237 "HyMES/poly.c"
   $77 = HEAP32[5120>>2]|0; //@line 237 "HyMES/poly.c"
   $78 = (($77) + ($76<<1)|0); //@line 237 "HyMES/poly.c"
   $79 = HEAP16[$78>>1]|0; //@line 237 "HyMES/poly.c"
   $80 = $79&65535; //@line 237 "HyMES/poly.c"
   $81 = (($69) + ($80))|0; //@line 237 "HyMES/poly.c"
   $82 = HEAP32[5128>>2]|0; //@line 237 "HyMES/poly.c"
   $83 = $81 >> $82; //@line 237 "HyMES/poly.c"
   $84 = (($63) + ($83))|0; //@line 237 "HyMES/poly.c"
   $85 = HEAP32[5132>>2]|0; //@line 237 "HyMES/poly.c"
   $86 = (($85) + ($84<<1)|0); //@line 237 "HyMES/poly.c"
   $87 = HEAP16[$86>>1]|0; //@line 237 "HyMES/poly.c"
   $88 = $87&65535; //@line 237 "HyMES/poly.c"
   $90 = $88;
  } else {
   $90 = 0;
  }
  $89 = $90&65535; //@line 237 "HyMES/poly.c"
  $b = $89; //@line 237 "HyMES/poly.c"
  $91 = $b; //@line 238 "HyMES/poly.c"
  $92 = $i; //@line 238 "HyMES/poly.c"
  $93 = $dd; //@line 238 "HyMES/poly.c"
  $94 = (($92) - ($93))|0; //@line 238 "HyMES/poly.c"
  $95 = $quo; //@line 238 "HyMES/poly.c"
  $96 = ((($95)) + 8|0); //@line 238 "HyMES/poly.c"
  $97 = HEAP32[$96>>2]|0; //@line 238 "HyMES/poly.c"
  $98 = (($97) + ($94<<1)|0); //@line 238 "HyMES/poly.c"
  HEAP16[$98>>1] = $91; //@line 238 "HyMES/poly.c"
  $99 = $b; //@line 239 "HyMES/poly.c"
  $100 = $99&65535; //@line 239 "HyMES/poly.c"
  $101 = ($100|0)!=(0); //@line 239 "HyMES/poly.c"
  L7: do {
   if ($101) {
    $102 = $i; //@line 240 "HyMES/poly.c"
    $103 = $rem; //@line 240 "HyMES/poly.c"
    $104 = ((($103)) + 8|0); //@line 240 "HyMES/poly.c"
    $105 = HEAP32[$104>>2]|0; //@line 240 "HyMES/poly.c"
    $106 = (($105) + ($102<<1)|0); //@line 240 "HyMES/poly.c"
    HEAP16[$106>>1] = 0; //@line 240 "HyMES/poly.c"
    $107 = $i; //@line 241 "HyMES/poly.c"
    $108 = (($107) - 1)|0; //@line 241 "HyMES/poly.c"
    $j = $108; //@line 241 "HyMES/poly.c"
    while(1) {
     $109 = $j; //@line 241 "HyMES/poly.c"
     $110 = $i; //@line 241 "HyMES/poly.c"
     $111 = $dd; //@line 241 "HyMES/poly.c"
     $112 = (($110) - ($111))|0; //@line 241 "HyMES/poly.c"
     $113 = ($109|0)>=($112|0); //@line 241 "HyMES/poly.c"
     if (!($113)) {
      break L7;
     }
     $114 = $j; //@line 242 "HyMES/poly.c"
     $115 = $rem; //@line 242 "HyMES/poly.c"
     $116 = ((($115)) + 8|0); //@line 242 "HyMES/poly.c"
     $117 = HEAP32[$116>>2]|0; //@line 242 "HyMES/poly.c"
     $118 = (($117) + ($114<<1)|0); //@line 242 "HyMES/poly.c"
     $119 = HEAP16[$118>>1]|0; //@line 242 "HyMES/poly.c"
     $120 = $119&65535; //@line 242 "HyMES/poly.c"
     $121 = $dd; //@line 242 "HyMES/poly.c"
     $122 = $i; //@line 242 "HyMES/poly.c"
     $123 = (($121) - ($122))|0; //@line 242 "HyMES/poly.c"
     $124 = $j; //@line 242 "HyMES/poly.c"
     $125 = (($123) + ($124))|0; //@line 242 "HyMES/poly.c"
     $126 = $1; //@line 242 "HyMES/poly.c"
     $127 = ((($126)) + 8|0); //@line 242 "HyMES/poly.c"
     $128 = HEAP32[$127>>2]|0; //@line 242 "HyMES/poly.c"
     $129 = (($128) + ($125<<1)|0); //@line 242 "HyMES/poly.c"
     $130 = HEAP16[$129>>1]|0; //@line 242 "HyMES/poly.c"
     $131 = $130&65535; //@line 242 "HyMES/poly.c"
     $132 = ($131|0)!=(0); //@line 242 "HyMES/poly.c"
     if ($132) {
      $133 = $b; //@line 242 "HyMES/poly.c"
      $134 = $133&65535; //@line 242 "HyMES/poly.c"
      $135 = HEAP32[5120>>2]|0; //@line 242 "HyMES/poly.c"
      $136 = (($135) + ($134<<1)|0); //@line 242 "HyMES/poly.c"
      $137 = HEAP16[$136>>1]|0; //@line 242 "HyMES/poly.c"
      $138 = $137&65535; //@line 242 "HyMES/poly.c"
      $139 = $dd; //@line 242 "HyMES/poly.c"
      $140 = $i; //@line 242 "HyMES/poly.c"
      $141 = (($139) - ($140))|0; //@line 242 "HyMES/poly.c"
      $142 = $j; //@line 242 "HyMES/poly.c"
      $143 = (($141) + ($142))|0; //@line 242 "HyMES/poly.c"
      $144 = $1; //@line 242 "HyMES/poly.c"
      $145 = ((($144)) + 8|0); //@line 242 "HyMES/poly.c"
      $146 = HEAP32[$145>>2]|0; //@line 242 "HyMES/poly.c"
      $147 = (($146) + ($143<<1)|0); //@line 242 "HyMES/poly.c"
      $148 = HEAP16[$147>>1]|0; //@line 242 "HyMES/poly.c"
      $149 = $148&65535; //@line 242 "HyMES/poly.c"
      $150 = HEAP32[5120>>2]|0; //@line 242 "HyMES/poly.c"
      $151 = (($150) + ($149<<1)|0); //@line 242 "HyMES/poly.c"
      $152 = HEAP16[$151>>1]|0; //@line 242 "HyMES/poly.c"
      $153 = $152&65535; //@line 242 "HyMES/poly.c"
      $154 = (($138) + ($153))|0; //@line 242 "HyMES/poly.c"
      $155 = HEAP32[5124>>2]|0; //@line 242 "HyMES/poly.c"
      $156 = $154 & $155; //@line 242 "HyMES/poly.c"
      $157 = $b; //@line 242 "HyMES/poly.c"
      $158 = $157&65535; //@line 242 "HyMES/poly.c"
      $159 = HEAP32[5120>>2]|0; //@line 242 "HyMES/poly.c"
      $160 = (($159) + ($158<<1)|0); //@line 242 "HyMES/poly.c"
      $161 = HEAP16[$160>>1]|0; //@line 242 "HyMES/poly.c"
      $162 = $161&65535; //@line 242 "HyMES/poly.c"
      $163 = $dd; //@line 242 "HyMES/poly.c"
      $164 = $i; //@line 242 "HyMES/poly.c"
      $165 = (($163) - ($164))|0; //@line 242 "HyMES/poly.c"
      $166 = $j; //@line 242 "HyMES/poly.c"
      $167 = (($165) + ($166))|0; //@line 242 "HyMES/poly.c"
      $168 = $1; //@line 242 "HyMES/poly.c"
      $169 = ((($168)) + 8|0); //@line 242 "HyMES/poly.c"
      $170 = HEAP32[$169>>2]|0; //@line 242 "HyMES/poly.c"
      $171 = (($170) + ($167<<1)|0); //@line 242 "HyMES/poly.c"
      $172 = HEAP16[$171>>1]|0; //@line 242 "HyMES/poly.c"
      $173 = $172&65535; //@line 242 "HyMES/poly.c"
      $174 = HEAP32[5120>>2]|0; //@line 242 "HyMES/poly.c"
      $175 = (($174) + ($173<<1)|0); //@line 242 "HyMES/poly.c"
      $176 = HEAP16[$175>>1]|0; //@line 242 "HyMES/poly.c"
      $177 = $176&65535; //@line 242 "HyMES/poly.c"
      $178 = (($162) + ($177))|0; //@line 242 "HyMES/poly.c"
      $179 = HEAP32[5128>>2]|0; //@line 242 "HyMES/poly.c"
      $180 = $178 >> $179; //@line 242 "HyMES/poly.c"
      $181 = (($156) + ($180))|0; //@line 242 "HyMES/poly.c"
      $182 = HEAP32[5132>>2]|0; //@line 242 "HyMES/poly.c"
      $183 = (($182) + ($181<<1)|0); //@line 242 "HyMES/poly.c"
      $184 = HEAP16[$183>>1]|0; //@line 242 "HyMES/poly.c"
      $185 = $184&65535; //@line 242 "HyMES/poly.c"
      $187 = $185;
     } else {
      $187 = 0;
     }
     $186 = $120 ^ $187; //@line 242 "HyMES/poly.c"
     $188 = $186&65535; //@line 242 "HyMES/poly.c"
     $189 = $j; //@line 242 "HyMES/poly.c"
     $190 = $rem; //@line 242 "HyMES/poly.c"
     $191 = ((($190)) + 8|0); //@line 242 "HyMES/poly.c"
     $192 = HEAP32[$191>>2]|0; //@line 242 "HyMES/poly.c"
     $193 = (($192) + ($189<<1)|0); //@line 242 "HyMES/poly.c"
     HEAP16[$193>>1] = $188; //@line 242 "HyMES/poly.c"
     $194 = $j; //@line 241 "HyMES/poly.c"
     $195 = (($194) + -1)|0; //@line 241 "HyMES/poly.c"
     $j = $195; //@line 241 "HyMES/poly.c"
    }
   }
  } while(0);
  $196 = $i; //@line 236 "HyMES/poly.c"
  $197 = (($196) + -1)|0; //@line 236 "HyMES/poly.c"
  $i = $197; //@line 236 "HyMES/poly.c"
 }
 $198 = $rem; //@line 245 "HyMES/poly.c"
 _poly_free($198); //@line 245 "HyMES/poly.c"
 $199 = $quo; //@line 247 "HyMES/poly.c"
 STACKTOP = sp;return ($199|0); //@line 247 "HyMES/poly.c"
}
function _poly_degppf($g) {
 $g = $g|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0;
 var $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $d = 0;
 var $i = 0, $p = 0, $r = 0, $res = 0, $s = 0, $u = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $g;
 $1 = $0; //@line 255 "HyMES/poly.c"
 $2 = HEAP32[$1>>2]|0; //@line 255 "HyMES/poly.c"
 $d = $2; //@line 255 "HyMES/poly.c"
 $3 = $d; //@line 256 "HyMES/poly.c"
 $4 = $3<<2; //@line 256 "HyMES/poly.c"
 $5 = (_malloc($4)|0); //@line 256 "HyMES/poly.c"
 $u = $5; //@line 256 "HyMES/poly.c"
 $i = 0; //@line 257 "HyMES/poly.c"
 while(1) {
  $6 = $i; //@line 257 "HyMES/poly.c"
  $7 = $d; //@line 257 "HyMES/poly.c"
  $8 = ($6|0)<($7|0); //@line 257 "HyMES/poly.c"
  if (!($8)) {
   break;
  }
  $9 = $d; //@line 258 "HyMES/poly.c"
  $10 = (($9) + 1)|0; //@line 258 "HyMES/poly.c"
  $11 = (_poly_alloc($10)|0); //@line 258 "HyMES/poly.c"
  $12 = $i; //@line 258 "HyMES/poly.c"
  $13 = $u; //@line 258 "HyMES/poly.c"
  $14 = (($13) + ($12<<2)|0); //@line 258 "HyMES/poly.c"
  HEAP32[$14>>2] = $11; //@line 258 "HyMES/poly.c"
  $15 = $i; //@line 257 "HyMES/poly.c"
  $16 = (($15) + 1)|0; //@line 257 "HyMES/poly.c"
  $i = $16; //@line 257 "HyMES/poly.c"
 }
 $17 = $0; //@line 259 "HyMES/poly.c"
 $18 = $u; //@line 259 "HyMES/poly.c"
 _poly_sqmod_init($17,$18); //@line 259 "HyMES/poly.c"
 $19 = $d; //@line 261 "HyMES/poly.c"
 $20 = (($19) - 1)|0; //@line 261 "HyMES/poly.c"
 $21 = (_poly_alloc($20)|0); //@line 261 "HyMES/poly.c"
 $p = $21; //@line 261 "HyMES/poly.c"
 $22 = $p; //@line 262 "HyMES/poly.c"
 HEAP32[$22>>2] = 1; //@line 262 "HyMES/poly.c"
 $23 = $p; //@line 263 "HyMES/poly.c"
 $24 = ((($23)) + 8|0); //@line 263 "HyMES/poly.c"
 $25 = HEAP32[$24>>2]|0; //@line 263 "HyMES/poly.c"
 $26 = ((($25)) + 2|0); //@line 263 "HyMES/poly.c"
 HEAP16[$26>>1] = 1; //@line 263 "HyMES/poly.c"
 $27 = $d; //@line 264 "HyMES/poly.c"
 $28 = (($27) - 1)|0; //@line 264 "HyMES/poly.c"
 $29 = (_poly_alloc($28)|0); //@line 264 "HyMES/poly.c"
 $r = $29; //@line 264 "HyMES/poly.c"
 $30 = $d; //@line 265 "HyMES/poly.c"
 $res = $30; //@line 265 "HyMES/poly.c"
 $i = 1; //@line 266 "HyMES/poly.c"
 while(1) {
  $31 = $i; //@line 266 "HyMES/poly.c"
  $32 = $d; //@line 266 "HyMES/poly.c"
  $33 = (($32|0) / 2)&-1; //@line 266 "HyMES/poly.c"
  $34 = HEAP32[5128>>2]|0; //@line 266 "HyMES/poly.c"
  $35 = Math_imul($33, $34)|0; //@line 266 "HyMES/poly.c"
  $36 = ($31|0)<=($35|0); //@line 266 "HyMES/poly.c"
  if (!($36)) {
   break;
  }
  $37 = $r; //@line 267 "HyMES/poly.c"
  $38 = $p; //@line 267 "HyMES/poly.c"
  $39 = $u; //@line 267 "HyMES/poly.c"
  $40 = $d; //@line 267 "HyMES/poly.c"
  _poly_sqmod($37,$38,$39,$40); //@line 267 "HyMES/poly.c"
  $41 = $i; //@line 269 "HyMES/poly.c"
  $42 = HEAP32[5128>>2]|0; //@line 269 "HyMES/poly.c"
  $43 = (($41|0) % ($42|0))&-1; //@line 269 "HyMES/poly.c"
  $44 = ($43|0)==(0); //@line 269 "HyMES/poly.c"
  if ($44) {
   $45 = $r; //@line 270 "HyMES/poly.c"
   $46 = ((($45)) + 8|0); //@line 270 "HyMES/poly.c"
   $47 = HEAP32[$46>>2]|0; //@line 270 "HyMES/poly.c"
   $48 = ((($47)) + 2|0); //@line 270 "HyMES/poly.c"
   $49 = HEAP16[$48>>1]|0; //@line 270 "HyMES/poly.c"
   $50 = $49&65535; //@line 270 "HyMES/poly.c"
   $51 = $50 ^ 1; //@line 270 "HyMES/poly.c"
   $52 = $51&65535; //@line 270 "HyMES/poly.c"
   $53 = $r; //@line 270 "HyMES/poly.c"
   $54 = ((($53)) + 8|0); //@line 270 "HyMES/poly.c"
   $55 = HEAP32[$54>>2]|0; //@line 270 "HyMES/poly.c"
   $56 = ((($55)) + 2|0); //@line 270 "HyMES/poly.c"
   HEAP16[$56>>1] = $52; //@line 270 "HyMES/poly.c"
   $57 = $r; //@line 271 "HyMES/poly.c"
   (_poly_calcule_deg($57)|0); //@line 271 "HyMES/poly.c"
   $58 = $0; //@line 272 "HyMES/poly.c"
   $59 = $r; //@line 272 "HyMES/poly.c"
   $60 = (_poly_gcd($58,$59)|0); //@line 272 "HyMES/poly.c"
   $s = $60; //@line 272 "HyMES/poly.c"
   $61 = $s; //@line 273 "HyMES/poly.c"
   $62 = HEAP32[$61>>2]|0; //@line 273 "HyMES/poly.c"
   $63 = ($62|0)>(0); //@line 273 "HyMES/poly.c"
   $64 = $s; //@line 274 "HyMES/poly.c"
   _poly_free($64); //@line 274 "HyMES/poly.c"
   if ($63) {
    label = 8;
    break;
   }
   $68 = $r; //@line 279 "HyMES/poly.c"
   $69 = ((($68)) + 8|0); //@line 279 "HyMES/poly.c"
   $70 = HEAP32[$69>>2]|0; //@line 279 "HyMES/poly.c"
   $71 = ((($70)) + 2|0); //@line 279 "HyMES/poly.c"
   $72 = HEAP16[$71>>1]|0; //@line 279 "HyMES/poly.c"
   $73 = $72&65535; //@line 279 "HyMES/poly.c"
   $74 = $73 ^ 1; //@line 279 "HyMES/poly.c"
   $75 = $74&65535; //@line 279 "HyMES/poly.c"
   $76 = $r; //@line 279 "HyMES/poly.c"
   $77 = ((($76)) + 8|0); //@line 279 "HyMES/poly.c"
   $78 = HEAP32[$77>>2]|0; //@line 279 "HyMES/poly.c"
   $79 = ((($78)) + 2|0); //@line 279 "HyMES/poly.c"
   HEAP16[$79>>1] = $75; //@line 279 "HyMES/poly.c"
   $80 = $r; //@line 280 "HyMES/poly.c"
   (_poly_calcule_deg($80)|0); //@line 280 "HyMES/poly.c"
  }
  $81 = $p; //@line 283 "HyMES/poly.c"
  $s = $81; //@line 283 "HyMES/poly.c"
  $82 = $r; //@line 284 "HyMES/poly.c"
  $p = $82; //@line 284 "HyMES/poly.c"
  $83 = $s; //@line 285 "HyMES/poly.c"
  $r = $83; //@line 285 "HyMES/poly.c"
  $84 = $i; //@line 266 "HyMES/poly.c"
  $85 = (($84) + 1)|0; //@line 266 "HyMES/poly.c"
  $i = $85; //@line 266 "HyMES/poly.c"
 }
 if ((label|0) == 8) {
  $65 = $i; //@line 275 "HyMES/poly.c"
  $66 = HEAP32[5128>>2]|0; //@line 275 "HyMES/poly.c"
  $67 = (($65|0) / ($66|0))&-1; //@line 275 "HyMES/poly.c"
  $res = $67; //@line 275 "HyMES/poly.c"
 }
 $86 = $p; //@line 288 "HyMES/poly.c"
 _poly_free($86); //@line 288 "HyMES/poly.c"
 $87 = $r; //@line 289 "HyMES/poly.c"
 _poly_free($87); //@line 289 "HyMES/poly.c"
 $i = 0; //@line 290 "HyMES/poly.c"
 while(1) {
  $88 = $i; //@line 290 "HyMES/poly.c"
  $89 = $d; //@line 290 "HyMES/poly.c"
  $90 = ($88|0)<($89|0); //@line 290 "HyMES/poly.c"
  if (!($90)) {
   break;
  }
  $91 = $i; //@line 291 "HyMES/poly.c"
  $92 = $u; //@line 291 "HyMES/poly.c"
  $93 = (($92) + ($91<<2)|0); //@line 291 "HyMES/poly.c"
  $94 = HEAP32[$93>>2]|0; //@line 291 "HyMES/poly.c"
  _poly_free($94); //@line 291 "HyMES/poly.c"
  $95 = $i; //@line 290 "HyMES/poly.c"
  $96 = (($95) + 1)|0; //@line 290 "HyMES/poly.c"
  $i = $96; //@line 290 "HyMES/poly.c"
 }
 $97 = $u; //@line 293 "HyMES/poly.c"
 _free($97); //@line 293 "HyMES/poly.c"
 $98 = $res; //@line 295 "HyMES/poly.c"
 STACKTOP = sp;return ($98|0); //@line 295 "HyMES/poly.c"
}
function _poly_eeaux($u,$v,$p,$g,$t) {
 $u = $u|0;
 $v = $v|0;
 $p = $p|0;
 $g = $g|0;
 $t = $t|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0;
 var $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0;
 var $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0;
 var $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0;
 var $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0;
 var $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0;
 var $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0;
 var $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0;
 var $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0;
 var $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0;
 var $97 = 0, $98 = 0, $99 = 0, $a = 0, $aux = 0, $delta = 0, $dr = 0, $du = 0, $i = 0, $j = 0, $r0 = 0, $r1 = 0, $u0 = 0, $u1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $u;
 $1 = $v;
 $2 = $p;
 $3 = $g;
 $4 = $t;
 $5 = $3; //@line 306 "HyMES/poly.c"
 $6 = HEAP32[$5>>2]|0; //@line 306 "HyMES/poly.c"
 $dr = $6; //@line 306 "HyMES/poly.c"
 $7 = $dr; //@line 308 "HyMES/poly.c"
 $8 = (_poly_alloc($7)|0); //@line 308 "HyMES/poly.c"
 $r0 = $8; //@line 308 "HyMES/poly.c"
 $9 = $dr; //@line 309 "HyMES/poly.c"
 $10 = (($9) - 1)|0; //@line 309 "HyMES/poly.c"
 $11 = (_poly_alloc($10)|0); //@line 309 "HyMES/poly.c"
 $r1 = $11; //@line 309 "HyMES/poly.c"
 $12 = $dr; //@line 310 "HyMES/poly.c"
 $13 = (($12) - 1)|0; //@line 310 "HyMES/poly.c"
 $14 = (_poly_alloc($13)|0); //@line 310 "HyMES/poly.c"
 $u0 = $14; //@line 310 "HyMES/poly.c"
 $15 = $dr; //@line 311 "HyMES/poly.c"
 $16 = (($15) - 1)|0; //@line 311 "HyMES/poly.c"
 $17 = (_poly_alloc($16)|0); //@line 311 "HyMES/poly.c"
 $u1 = $17; //@line 311 "HyMES/poly.c"
 $18 = $r0; //@line 312 "HyMES/poly.c"
 $19 = $3; //@line 312 "HyMES/poly.c"
 _poly_set($18,$19); //@line 312 "HyMES/poly.c"
 $20 = $r1; //@line 313 "HyMES/poly.c"
 $21 = $2; //@line 313 "HyMES/poly.c"
 _poly_set($20,$21); //@line 313 "HyMES/poly.c"
 $22 = $u0; //@line 314 "HyMES/poly.c"
 _poly_set_to_zero($22); //@line 314 "HyMES/poly.c"
 $23 = $u1; //@line 315 "HyMES/poly.c"
 _poly_set_to_zero($23); //@line 315 "HyMES/poly.c"
 $24 = $u1; //@line 316 "HyMES/poly.c"
 $25 = ((($24)) + 8|0); //@line 316 "HyMES/poly.c"
 $26 = HEAP32[$25>>2]|0; //@line 316 "HyMES/poly.c"
 HEAP16[$26>>1] = 1; //@line 316 "HyMES/poly.c"
 $27 = $u1; //@line 317 "HyMES/poly.c"
 HEAP32[$27>>2] = 0; //@line 317 "HyMES/poly.c"
 $du = 0; //@line 325 "HyMES/poly.c"
 $28 = $r1; //@line 326 "HyMES/poly.c"
 $29 = HEAP32[$28>>2]|0; //@line 326 "HyMES/poly.c"
 $dr = $29; //@line 326 "HyMES/poly.c"
 $30 = $r0; //@line 327 "HyMES/poly.c"
 $31 = HEAP32[$30>>2]|0; //@line 327 "HyMES/poly.c"
 $32 = $dr; //@line 327 "HyMES/poly.c"
 $33 = (($31) - ($32))|0; //@line 327 "HyMES/poly.c"
 $delta = $33; //@line 327 "HyMES/poly.c"
 while(1) {
  $34 = $dr; //@line 329 "HyMES/poly.c"
  $35 = $4; //@line 329 "HyMES/poly.c"
  $36 = ($34|0)>=($35|0); //@line 329 "HyMES/poly.c"
  if (!($36)) {
   break;
  }
  $37 = $delta; //@line 330 "HyMES/poly.c"
  $j = $37; //@line 330 "HyMES/poly.c"
  while(1) {
   $38 = $j; //@line 330 "HyMES/poly.c"
   $39 = ($38|0)>=(0); //@line 330 "HyMES/poly.c"
   if (!($39)) {
    break;
   }
   $40 = $dr; //@line 331 "HyMES/poly.c"
   $41 = $j; //@line 331 "HyMES/poly.c"
   $42 = (($40) + ($41))|0; //@line 331 "HyMES/poly.c"
   $43 = $r0; //@line 331 "HyMES/poly.c"
   $44 = ((($43)) + 8|0); //@line 331 "HyMES/poly.c"
   $45 = HEAP32[$44>>2]|0; //@line 331 "HyMES/poly.c"
   $46 = (($45) + ($42<<1)|0); //@line 331 "HyMES/poly.c"
   $47 = HEAP16[$46>>1]|0; //@line 331 "HyMES/poly.c"
   $48 = $47&65535; //@line 331 "HyMES/poly.c"
   $49 = ($48|0)!=(0); //@line 331 "HyMES/poly.c"
   if ($49) {
    $50 = $dr; //@line 331 "HyMES/poly.c"
    $51 = $j; //@line 331 "HyMES/poly.c"
    $52 = (($50) + ($51))|0; //@line 331 "HyMES/poly.c"
    $53 = $r0; //@line 331 "HyMES/poly.c"
    $54 = ((($53)) + 8|0); //@line 331 "HyMES/poly.c"
    $55 = HEAP32[$54>>2]|0; //@line 331 "HyMES/poly.c"
    $56 = (($55) + ($52<<1)|0); //@line 331 "HyMES/poly.c"
    $57 = HEAP16[$56>>1]|0; //@line 331 "HyMES/poly.c"
    $58 = $57&65535; //@line 331 "HyMES/poly.c"
    $59 = HEAP32[5120>>2]|0; //@line 331 "HyMES/poly.c"
    $60 = (($59) + ($58<<1)|0); //@line 331 "HyMES/poly.c"
    $61 = HEAP16[$60>>1]|0; //@line 331 "HyMES/poly.c"
    $62 = $61&65535; //@line 331 "HyMES/poly.c"
    $63 = $dr; //@line 331 "HyMES/poly.c"
    $64 = $r1; //@line 331 "HyMES/poly.c"
    $65 = ((($64)) + 8|0); //@line 331 "HyMES/poly.c"
    $66 = HEAP32[$65>>2]|0; //@line 331 "HyMES/poly.c"
    $67 = (($66) + ($63<<1)|0); //@line 331 "HyMES/poly.c"
    $68 = HEAP16[$67>>1]|0; //@line 331 "HyMES/poly.c"
    $69 = $68&65535; //@line 331 "HyMES/poly.c"
    $70 = HEAP32[5120>>2]|0; //@line 331 "HyMES/poly.c"
    $71 = (($70) + ($69<<1)|0); //@line 331 "HyMES/poly.c"
    $72 = HEAP16[$71>>1]|0; //@line 331 "HyMES/poly.c"
    $73 = $72&65535; //@line 331 "HyMES/poly.c"
    $74 = (($62) - ($73))|0; //@line 331 "HyMES/poly.c"
    $75 = HEAP32[5124>>2]|0; //@line 331 "HyMES/poly.c"
    $76 = $74 & $75; //@line 331 "HyMES/poly.c"
    $77 = $dr; //@line 331 "HyMES/poly.c"
    $78 = $j; //@line 331 "HyMES/poly.c"
    $79 = (($77) + ($78))|0; //@line 331 "HyMES/poly.c"
    $80 = $r0; //@line 331 "HyMES/poly.c"
    $81 = ((($80)) + 8|0); //@line 331 "HyMES/poly.c"
    $82 = HEAP32[$81>>2]|0; //@line 331 "HyMES/poly.c"
    $83 = (($82) + ($79<<1)|0); //@line 331 "HyMES/poly.c"
    $84 = HEAP16[$83>>1]|0; //@line 331 "HyMES/poly.c"
    $85 = $84&65535; //@line 331 "HyMES/poly.c"
    $86 = HEAP32[5120>>2]|0; //@line 331 "HyMES/poly.c"
    $87 = (($86) + ($85<<1)|0); //@line 331 "HyMES/poly.c"
    $88 = HEAP16[$87>>1]|0; //@line 331 "HyMES/poly.c"
    $89 = $88&65535; //@line 331 "HyMES/poly.c"
    $90 = $dr; //@line 331 "HyMES/poly.c"
    $91 = $r1; //@line 331 "HyMES/poly.c"
    $92 = ((($91)) + 8|0); //@line 331 "HyMES/poly.c"
    $93 = HEAP32[$92>>2]|0; //@line 331 "HyMES/poly.c"
    $94 = (($93) + ($90<<1)|0); //@line 331 "HyMES/poly.c"
    $95 = HEAP16[$94>>1]|0; //@line 331 "HyMES/poly.c"
    $96 = $95&65535; //@line 331 "HyMES/poly.c"
    $97 = HEAP32[5120>>2]|0; //@line 331 "HyMES/poly.c"
    $98 = (($97) + ($96<<1)|0); //@line 331 "HyMES/poly.c"
    $99 = HEAP16[$98>>1]|0; //@line 331 "HyMES/poly.c"
    $100 = $99&65535; //@line 331 "HyMES/poly.c"
    $101 = (($89) - ($100))|0; //@line 331 "HyMES/poly.c"
    $102 = HEAP32[5128>>2]|0; //@line 331 "HyMES/poly.c"
    $103 = $101 >> $102; //@line 331 "HyMES/poly.c"
    $104 = (($76) + ($103))|0; //@line 331 "HyMES/poly.c"
    $105 = HEAP32[5132>>2]|0; //@line 331 "HyMES/poly.c"
    $106 = (($105) + ($104<<1)|0); //@line 331 "HyMES/poly.c"
    $107 = HEAP16[$106>>1]|0; //@line 331 "HyMES/poly.c"
    $108 = $107&65535; //@line 331 "HyMES/poly.c"
    $110 = $108;
   } else {
    $110 = 0;
   }
   $109 = $110&65535; //@line 331 "HyMES/poly.c"
   $a = $109; //@line 331 "HyMES/poly.c"
   $111 = $a; //@line 332 "HyMES/poly.c"
   $112 = $111&65535; //@line 332 "HyMES/poly.c"
   $113 = ($112|0)!=(0); //@line 332 "HyMES/poly.c"
   L10: do {
    if ($113) {
     $i = 0; //@line 334 "HyMES/poly.c"
     while(1) {
      $114 = $i; //@line 334 "HyMES/poly.c"
      $115 = $du; //@line 334 "HyMES/poly.c"
      $116 = ($114|0)<=($115|0); //@line 334 "HyMES/poly.c"
      if (!($116)) {
       break;
      }
      $117 = $i; //@line 335 "HyMES/poly.c"
      $118 = $j; //@line 335 "HyMES/poly.c"
      $119 = (($117) + ($118))|0; //@line 335 "HyMES/poly.c"
      $120 = $u0; //@line 335 "HyMES/poly.c"
      $121 = ((($120)) + 8|0); //@line 335 "HyMES/poly.c"
      $122 = HEAP32[$121>>2]|0; //@line 335 "HyMES/poly.c"
      $123 = (($122) + ($119<<1)|0); //@line 335 "HyMES/poly.c"
      $124 = HEAP16[$123>>1]|0; //@line 335 "HyMES/poly.c"
      $125 = $124&65535; //@line 335 "HyMES/poly.c"
      $126 = $i; //@line 335 "HyMES/poly.c"
      $127 = $u1; //@line 335 "HyMES/poly.c"
      $128 = ((($127)) + 8|0); //@line 335 "HyMES/poly.c"
      $129 = HEAP32[$128>>2]|0; //@line 335 "HyMES/poly.c"
      $130 = (($129) + ($126<<1)|0); //@line 335 "HyMES/poly.c"
      $131 = HEAP16[$130>>1]|0; //@line 335 "HyMES/poly.c"
      $132 = $131&65535; //@line 335 "HyMES/poly.c"
      $133 = ($132|0)!=(0); //@line 335 "HyMES/poly.c"
      if ($133) {
       $134 = $a; //@line 335 "HyMES/poly.c"
       $135 = $134&65535; //@line 335 "HyMES/poly.c"
       $136 = HEAP32[5120>>2]|0; //@line 335 "HyMES/poly.c"
       $137 = (($136) + ($135<<1)|0); //@line 335 "HyMES/poly.c"
       $138 = HEAP16[$137>>1]|0; //@line 335 "HyMES/poly.c"
       $139 = $138&65535; //@line 335 "HyMES/poly.c"
       $140 = $i; //@line 335 "HyMES/poly.c"
       $141 = $u1; //@line 335 "HyMES/poly.c"
       $142 = ((($141)) + 8|0); //@line 335 "HyMES/poly.c"
       $143 = HEAP32[$142>>2]|0; //@line 335 "HyMES/poly.c"
       $144 = (($143) + ($140<<1)|0); //@line 335 "HyMES/poly.c"
       $145 = HEAP16[$144>>1]|0; //@line 335 "HyMES/poly.c"
       $146 = $145&65535; //@line 335 "HyMES/poly.c"
       $147 = HEAP32[5120>>2]|0; //@line 335 "HyMES/poly.c"
       $148 = (($147) + ($146<<1)|0); //@line 335 "HyMES/poly.c"
       $149 = HEAP16[$148>>1]|0; //@line 335 "HyMES/poly.c"
       $150 = $149&65535; //@line 335 "HyMES/poly.c"
       $151 = (($139) + ($150))|0; //@line 335 "HyMES/poly.c"
       $152 = HEAP32[5124>>2]|0; //@line 335 "HyMES/poly.c"
       $153 = $151 & $152; //@line 335 "HyMES/poly.c"
       $154 = $a; //@line 335 "HyMES/poly.c"
       $155 = $154&65535; //@line 335 "HyMES/poly.c"
       $156 = HEAP32[5120>>2]|0; //@line 335 "HyMES/poly.c"
       $157 = (($156) + ($155<<1)|0); //@line 335 "HyMES/poly.c"
       $158 = HEAP16[$157>>1]|0; //@line 335 "HyMES/poly.c"
       $159 = $158&65535; //@line 335 "HyMES/poly.c"
       $160 = $i; //@line 335 "HyMES/poly.c"
       $161 = $u1; //@line 335 "HyMES/poly.c"
       $162 = ((($161)) + 8|0); //@line 335 "HyMES/poly.c"
       $163 = HEAP32[$162>>2]|0; //@line 335 "HyMES/poly.c"
       $164 = (($163) + ($160<<1)|0); //@line 335 "HyMES/poly.c"
       $165 = HEAP16[$164>>1]|0; //@line 335 "HyMES/poly.c"
       $166 = $165&65535; //@line 335 "HyMES/poly.c"
       $167 = HEAP32[5120>>2]|0; //@line 335 "HyMES/poly.c"
       $168 = (($167) + ($166<<1)|0); //@line 335 "HyMES/poly.c"
       $169 = HEAP16[$168>>1]|0; //@line 335 "HyMES/poly.c"
       $170 = $169&65535; //@line 335 "HyMES/poly.c"
       $171 = (($159) + ($170))|0; //@line 335 "HyMES/poly.c"
       $172 = HEAP32[5128>>2]|0; //@line 335 "HyMES/poly.c"
       $173 = $171 >> $172; //@line 335 "HyMES/poly.c"
       $174 = (($153) + ($173))|0; //@line 335 "HyMES/poly.c"
       $175 = HEAP32[5132>>2]|0; //@line 335 "HyMES/poly.c"
       $176 = (($175) + ($174<<1)|0); //@line 335 "HyMES/poly.c"
       $177 = HEAP16[$176>>1]|0; //@line 335 "HyMES/poly.c"
       $178 = $177&65535; //@line 335 "HyMES/poly.c"
       $180 = $178;
      } else {
       $180 = 0;
      }
      $179 = $125 ^ $180; //@line 335 "HyMES/poly.c"
      $181 = $179&65535; //@line 335 "HyMES/poly.c"
      $182 = $i; //@line 335 "HyMES/poly.c"
      $183 = $j; //@line 335 "HyMES/poly.c"
      $184 = (($182) + ($183))|0; //@line 335 "HyMES/poly.c"
      $185 = $u0; //@line 335 "HyMES/poly.c"
      $186 = ((($185)) + 8|0); //@line 335 "HyMES/poly.c"
      $187 = HEAP32[$186>>2]|0; //@line 335 "HyMES/poly.c"
      $188 = (($187) + ($184<<1)|0); //@line 335 "HyMES/poly.c"
      HEAP16[$188>>1] = $181; //@line 335 "HyMES/poly.c"
      $189 = $i; //@line 334 "HyMES/poly.c"
      $190 = (($189) + 1)|0; //@line 334 "HyMES/poly.c"
      $i = $190; //@line 334 "HyMES/poly.c"
     }
     $i = 0; //@line 338 "HyMES/poly.c"
     while(1) {
      $191 = $i; //@line 338 "HyMES/poly.c"
      $192 = $dr; //@line 338 "HyMES/poly.c"
      $193 = ($191|0)<=($192|0); //@line 338 "HyMES/poly.c"
      if (!($193)) {
       break L10;
      }
      $194 = $i; //@line 339 "HyMES/poly.c"
      $195 = $j; //@line 339 "HyMES/poly.c"
      $196 = (($194) + ($195))|0; //@line 339 "HyMES/poly.c"
      $197 = $r0; //@line 339 "HyMES/poly.c"
      $198 = ((($197)) + 8|0); //@line 339 "HyMES/poly.c"
      $199 = HEAP32[$198>>2]|0; //@line 339 "HyMES/poly.c"
      $200 = (($199) + ($196<<1)|0); //@line 339 "HyMES/poly.c"
      $201 = HEAP16[$200>>1]|0; //@line 339 "HyMES/poly.c"
      $202 = $201&65535; //@line 339 "HyMES/poly.c"
      $203 = $i; //@line 339 "HyMES/poly.c"
      $204 = $r1; //@line 339 "HyMES/poly.c"
      $205 = ((($204)) + 8|0); //@line 339 "HyMES/poly.c"
      $206 = HEAP32[$205>>2]|0; //@line 339 "HyMES/poly.c"
      $207 = (($206) + ($203<<1)|0); //@line 339 "HyMES/poly.c"
      $208 = HEAP16[$207>>1]|0; //@line 339 "HyMES/poly.c"
      $209 = $208&65535; //@line 339 "HyMES/poly.c"
      $210 = ($209|0)!=(0); //@line 339 "HyMES/poly.c"
      if ($210) {
       $211 = $a; //@line 339 "HyMES/poly.c"
       $212 = $211&65535; //@line 339 "HyMES/poly.c"
       $213 = HEAP32[5120>>2]|0; //@line 339 "HyMES/poly.c"
       $214 = (($213) + ($212<<1)|0); //@line 339 "HyMES/poly.c"
       $215 = HEAP16[$214>>1]|0; //@line 339 "HyMES/poly.c"
       $216 = $215&65535; //@line 339 "HyMES/poly.c"
       $217 = $i; //@line 339 "HyMES/poly.c"
       $218 = $r1; //@line 339 "HyMES/poly.c"
       $219 = ((($218)) + 8|0); //@line 339 "HyMES/poly.c"
       $220 = HEAP32[$219>>2]|0; //@line 339 "HyMES/poly.c"
       $221 = (($220) + ($217<<1)|0); //@line 339 "HyMES/poly.c"
       $222 = HEAP16[$221>>1]|0; //@line 339 "HyMES/poly.c"
       $223 = $222&65535; //@line 339 "HyMES/poly.c"
       $224 = HEAP32[5120>>2]|0; //@line 339 "HyMES/poly.c"
       $225 = (($224) + ($223<<1)|0); //@line 339 "HyMES/poly.c"
       $226 = HEAP16[$225>>1]|0; //@line 339 "HyMES/poly.c"
       $227 = $226&65535; //@line 339 "HyMES/poly.c"
       $228 = (($216) + ($227))|0; //@line 339 "HyMES/poly.c"
       $229 = HEAP32[5124>>2]|0; //@line 339 "HyMES/poly.c"
       $230 = $228 & $229; //@line 339 "HyMES/poly.c"
       $231 = $a; //@line 339 "HyMES/poly.c"
       $232 = $231&65535; //@line 339 "HyMES/poly.c"
       $233 = HEAP32[5120>>2]|0; //@line 339 "HyMES/poly.c"
       $234 = (($233) + ($232<<1)|0); //@line 339 "HyMES/poly.c"
       $235 = HEAP16[$234>>1]|0; //@line 339 "HyMES/poly.c"
       $236 = $235&65535; //@line 339 "HyMES/poly.c"
       $237 = $i; //@line 339 "HyMES/poly.c"
       $238 = $r1; //@line 339 "HyMES/poly.c"
       $239 = ((($238)) + 8|0); //@line 339 "HyMES/poly.c"
       $240 = HEAP32[$239>>2]|0; //@line 339 "HyMES/poly.c"
       $241 = (($240) + ($237<<1)|0); //@line 339 "HyMES/poly.c"
       $242 = HEAP16[$241>>1]|0; //@line 339 "HyMES/poly.c"
       $243 = $242&65535; //@line 339 "HyMES/poly.c"
       $244 = HEAP32[5120>>2]|0; //@line 339 "HyMES/poly.c"
       $245 = (($244) + ($243<<1)|0); //@line 339 "HyMES/poly.c"
       $246 = HEAP16[$245>>1]|0; //@line 339 "HyMES/poly.c"
       $247 = $246&65535; //@line 339 "HyMES/poly.c"
       $248 = (($236) + ($247))|0; //@line 339 "HyMES/poly.c"
       $249 = HEAP32[5128>>2]|0; //@line 339 "HyMES/poly.c"
       $250 = $248 >> $249; //@line 339 "HyMES/poly.c"
       $251 = (($230) + ($250))|0; //@line 339 "HyMES/poly.c"
       $252 = HEAP32[5132>>2]|0; //@line 339 "HyMES/poly.c"
       $253 = (($252) + ($251<<1)|0); //@line 339 "HyMES/poly.c"
       $254 = HEAP16[$253>>1]|0; //@line 339 "HyMES/poly.c"
       $255 = $254&65535; //@line 339 "HyMES/poly.c"
       $257 = $255;
      } else {
       $257 = 0;
      }
      $256 = $202 ^ $257; //@line 339 "HyMES/poly.c"
      $258 = $256&65535; //@line 339 "HyMES/poly.c"
      $259 = $i; //@line 339 "HyMES/poly.c"
      $260 = $j; //@line 339 "HyMES/poly.c"
      $261 = (($259) + ($260))|0; //@line 339 "HyMES/poly.c"
      $262 = $r0; //@line 339 "HyMES/poly.c"
      $263 = ((($262)) + 8|0); //@line 339 "HyMES/poly.c"
      $264 = HEAP32[$263>>2]|0; //@line 339 "HyMES/poly.c"
      $265 = (($264) + ($261<<1)|0); //@line 339 "HyMES/poly.c"
      HEAP16[$265>>1] = $258; //@line 339 "HyMES/poly.c"
      $266 = $i; //@line 338 "HyMES/poly.c"
      $267 = (($266) + 1)|0; //@line 338 "HyMES/poly.c"
      $i = $267; //@line 338 "HyMES/poly.c"
     }
    }
   } while(0);
   $268 = $j; //@line 330 "HyMES/poly.c"
   $269 = (($268) + -1)|0; //@line 330 "HyMES/poly.c"
   $j = $269; //@line 330 "HyMES/poly.c"
  }
  $270 = $r0; //@line 343 "HyMES/poly.c"
  $aux = $270; //@line 343 "HyMES/poly.c"
  $271 = $r1; //@line 343 "HyMES/poly.c"
  $r0 = $271; //@line 343 "HyMES/poly.c"
  $272 = $aux; //@line 343 "HyMES/poly.c"
  $r1 = $272; //@line 343 "HyMES/poly.c"
  $273 = $u0; //@line 344 "HyMES/poly.c"
  $aux = $273; //@line 344 "HyMES/poly.c"
  $274 = $u1; //@line 344 "HyMES/poly.c"
  $u0 = $274; //@line 344 "HyMES/poly.c"
  $275 = $aux; //@line 344 "HyMES/poly.c"
  $u1 = $275; //@line 344 "HyMES/poly.c"
  $276 = $du; //@line 346 "HyMES/poly.c"
  $277 = $delta; //@line 346 "HyMES/poly.c"
  $278 = (($276) + ($277))|0; //@line 346 "HyMES/poly.c"
  $du = $278; //@line 346 "HyMES/poly.c"
  $delta = 1; //@line 347 "HyMES/poly.c"
  while(1) {
   $279 = $dr; //@line 348 "HyMES/poly.c"
   $280 = $delta; //@line 348 "HyMES/poly.c"
   $281 = (($279) - ($280))|0; //@line 348 "HyMES/poly.c"
   $282 = $r1; //@line 348 "HyMES/poly.c"
   $283 = ((($282)) + 8|0); //@line 348 "HyMES/poly.c"
   $284 = HEAP32[$283>>2]|0; //@line 348 "HyMES/poly.c"
   $285 = (($284) + ($281<<1)|0); //@line 348 "HyMES/poly.c"
   $286 = HEAP16[$285>>1]|0; //@line 348 "HyMES/poly.c"
   $287 = $286&65535; //@line 348 "HyMES/poly.c"
   $288 = ($287|0)==(0); //@line 348 "HyMES/poly.c"
   $289 = $delta; //@line 349 "HyMES/poly.c"
   if (!($288)) {
    break;
   }
   $290 = (($289) + 1)|0; //@line 349 "HyMES/poly.c"
   $delta = $290; //@line 349 "HyMES/poly.c"
  }
  $291 = $dr; //@line 350 "HyMES/poly.c"
  $292 = (($291) - ($289))|0; //@line 350 "HyMES/poly.c"
  $dr = $292; //@line 350 "HyMES/poly.c"
 }
 $293 = $du; //@line 353 "HyMES/poly.c"
 $294 = $u1; //@line 353 "HyMES/poly.c"
 HEAP32[$294>>2] = $293; //@line 353 "HyMES/poly.c"
 $295 = $dr; //@line 354 "HyMES/poly.c"
 $296 = $r1; //@line 354 "HyMES/poly.c"
 HEAP32[$296>>2] = $295; //@line 354 "HyMES/poly.c"
 $297 = $u1; //@line 356 "HyMES/poly.c"
 $298 = $0; //@line 356 "HyMES/poly.c"
 HEAP32[$298>>2] = $297; //@line 356 "HyMES/poly.c"
 $299 = $r1; //@line 357 "HyMES/poly.c"
 $300 = $1; //@line 357 "HyMES/poly.c"
 HEAP32[$300>>2] = $299; //@line 357 "HyMES/poly.c"
 $301 = $r0; //@line 359 "HyMES/poly.c"
 _poly_free($301); //@line 359 "HyMES/poly.c"
 $302 = $u0; //@line 360 "HyMES/poly.c"
 _poly_free($302); //@line 360 "HyMES/poly.c"
 STACKTOP = sp;return; //@line 361 "HyMES/poly.c"
}
function _poly_randgen_irred($t,$u8rnd) {
 $t = $t|0;
 $u8rnd = $u8rnd|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $g = 0, $i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $t;
 $1 = $u8rnd;
 $2 = $0; //@line 369 "HyMES/poly.c"
 $3 = (_poly_alloc($2)|0); //@line 369 "HyMES/poly.c"
 $g = $3; //@line 369 "HyMES/poly.c"
 $4 = $0; //@line 370 "HyMES/poly.c"
 $5 = $g; //@line 370 "HyMES/poly.c"
 HEAP32[$5>>2] = $4; //@line 370 "HyMES/poly.c"
 $6 = $0; //@line 371 "HyMES/poly.c"
 $7 = $g; //@line 371 "HyMES/poly.c"
 $8 = ((($7)) + 8|0); //@line 371 "HyMES/poly.c"
 $9 = HEAP32[$8>>2]|0; //@line 371 "HyMES/poly.c"
 $10 = (($9) + ($6<<1)|0); //@line 371 "HyMES/poly.c"
 HEAP16[$10>>1] = 1; //@line 371 "HyMES/poly.c"
 $i = 0; //@line 373 "HyMES/poly.c"
 while(1) {
  $i = 0; //@line 375 "HyMES/poly.c"
  while(1) {
   $11 = $i; //@line 375 "HyMES/poly.c"
   $12 = $0; //@line 375 "HyMES/poly.c"
   $13 = ($11|0)<($12|0); //@line 375 "HyMES/poly.c"
   if (!($13)) {
    break;
   }
   $14 = $1; //@line 376 "HyMES/poly.c"
   $15 = (_gf_rand($14)|0); //@line 376 "HyMES/poly.c"
   $16 = $i; //@line 376 "HyMES/poly.c"
   $17 = $g; //@line 376 "HyMES/poly.c"
   $18 = ((($17)) + 8|0); //@line 376 "HyMES/poly.c"
   $19 = HEAP32[$18>>2]|0; //@line 376 "HyMES/poly.c"
   $20 = (($19) + ($16<<1)|0); //@line 376 "HyMES/poly.c"
   HEAP16[$20>>1] = $15; //@line 376 "HyMES/poly.c"
   $21 = $i; //@line 375 "HyMES/poly.c"
   $22 = (($21) + 1)|0; //@line 375 "HyMES/poly.c"
   $i = $22; //@line 375 "HyMES/poly.c"
  }
  $23 = $g; //@line 377 "HyMES/poly.c"
  $24 = (_poly_degppf($23)|0); //@line 377 "HyMES/poly.c"
  $25 = $0; //@line 377 "HyMES/poly.c"
  $26 = ($24|0)<($25|0); //@line 377 "HyMES/poly.c"
  if (!($26)) {
   break;
  }
 }
 $27 = $g; //@line 379 "HyMES/poly.c"
 STACKTOP = sp;return ($27|0); //@line 379 "HyMES/poly.c"
}
function _poly_shiftmod($p,$g) {
 $p = $p|0;
 $g = $g|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $21 = 0;
 var $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0;
 var $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0;
 var $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0;
 var $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0;
 var $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $a = 0, $i = 0, $t = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $p;
 $1 = $g;
 $2 = $1; //@line 389 "HyMES/poly.c"
 $3 = HEAP32[$2>>2]|0; //@line 389 "HyMES/poly.c"
 $t = $3; //@line 389 "HyMES/poly.c"
 $4 = $t; //@line 390 "HyMES/poly.c"
 $5 = (($4) - 1)|0; //@line 390 "HyMES/poly.c"
 $6 = $0; //@line 390 "HyMES/poly.c"
 $7 = ((($6)) + 8|0); //@line 390 "HyMES/poly.c"
 $8 = HEAP32[$7>>2]|0; //@line 390 "HyMES/poly.c"
 $9 = (($8) + ($5<<1)|0); //@line 390 "HyMES/poly.c"
 $10 = HEAP16[$9>>1]|0; //@line 390 "HyMES/poly.c"
 $11 = $10&65535; //@line 390 "HyMES/poly.c"
 $12 = ($11|0)!=(0); //@line 390 "HyMES/poly.c"
 if ($12) {
  $13 = $t; //@line 390 "HyMES/poly.c"
  $14 = (($13) - 1)|0; //@line 390 "HyMES/poly.c"
  $15 = $0; //@line 390 "HyMES/poly.c"
  $16 = ((($15)) + 8|0); //@line 390 "HyMES/poly.c"
  $17 = HEAP32[$16>>2]|0; //@line 390 "HyMES/poly.c"
  $18 = (($17) + ($14<<1)|0); //@line 390 "HyMES/poly.c"
  $19 = HEAP16[$18>>1]|0; //@line 390 "HyMES/poly.c"
  $20 = $19&65535; //@line 390 "HyMES/poly.c"
  $21 = HEAP32[5120>>2]|0; //@line 390 "HyMES/poly.c"
  $22 = (($21) + ($20<<1)|0); //@line 390 "HyMES/poly.c"
  $23 = HEAP16[$22>>1]|0; //@line 390 "HyMES/poly.c"
  $24 = $23&65535; //@line 390 "HyMES/poly.c"
  $25 = $t; //@line 390 "HyMES/poly.c"
  $26 = $1; //@line 390 "HyMES/poly.c"
  $27 = ((($26)) + 8|0); //@line 390 "HyMES/poly.c"
  $28 = HEAP32[$27>>2]|0; //@line 390 "HyMES/poly.c"
  $29 = (($28) + ($25<<1)|0); //@line 390 "HyMES/poly.c"
  $30 = HEAP16[$29>>1]|0; //@line 390 "HyMES/poly.c"
  $31 = $30&65535; //@line 390 "HyMES/poly.c"
  $32 = HEAP32[5120>>2]|0; //@line 390 "HyMES/poly.c"
  $33 = (($32) + ($31<<1)|0); //@line 390 "HyMES/poly.c"
  $34 = HEAP16[$33>>1]|0; //@line 390 "HyMES/poly.c"
  $35 = $34&65535; //@line 390 "HyMES/poly.c"
  $36 = (($24) - ($35))|0; //@line 390 "HyMES/poly.c"
  $37 = HEAP32[5124>>2]|0; //@line 390 "HyMES/poly.c"
  $38 = $36 & $37; //@line 390 "HyMES/poly.c"
  $39 = $t; //@line 390 "HyMES/poly.c"
  $40 = (($39) - 1)|0; //@line 390 "HyMES/poly.c"
  $41 = $0; //@line 390 "HyMES/poly.c"
  $42 = ((($41)) + 8|0); //@line 390 "HyMES/poly.c"
  $43 = HEAP32[$42>>2]|0; //@line 390 "HyMES/poly.c"
  $44 = (($43) + ($40<<1)|0); //@line 390 "HyMES/poly.c"
  $45 = HEAP16[$44>>1]|0; //@line 390 "HyMES/poly.c"
  $46 = $45&65535; //@line 390 "HyMES/poly.c"
  $47 = HEAP32[5120>>2]|0; //@line 390 "HyMES/poly.c"
  $48 = (($47) + ($46<<1)|0); //@line 390 "HyMES/poly.c"
  $49 = HEAP16[$48>>1]|0; //@line 390 "HyMES/poly.c"
  $50 = $49&65535; //@line 390 "HyMES/poly.c"
  $51 = $t; //@line 390 "HyMES/poly.c"
  $52 = $1; //@line 390 "HyMES/poly.c"
  $53 = ((($52)) + 8|0); //@line 390 "HyMES/poly.c"
  $54 = HEAP32[$53>>2]|0; //@line 390 "HyMES/poly.c"
  $55 = (($54) + ($51<<1)|0); //@line 390 "HyMES/poly.c"
  $56 = HEAP16[$55>>1]|0; //@line 390 "HyMES/poly.c"
  $57 = $56&65535; //@line 390 "HyMES/poly.c"
  $58 = HEAP32[5120>>2]|0; //@line 390 "HyMES/poly.c"
  $59 = (($58) + ($57<<1)|0); //@line 390 "HyMES/poly.c"
  $60 = HEAP16[$59>>1]|0; //@line 390 "HyMES/poly.c"
  $61 = $60&65535; //@line 390 "HyMES/poly.c"
  $62 = (($50) - ($61))|0; //@line 390 "HyMES/poly.c"
  $63 = HEAP32[5128>>2]|0; //@line 390 "HyMES/poly.c"
  $64 = $62 >> $63; //@line 390 "HyMES/poly.c"
  $65 = (($38) + ($64))|0; //@line 390 "HyMES/poly.c"
  $66 = HEAP32[5132>>2]|0; //@line 390 "HyMES/poly.c"
  $67 = (($66) + ($65<<1)|0); //@line 390 "HyMES/poly.c"
  $68 = HEAP16[$67>>1]|0; //@line 390 "HyMES/poly.c"
  $69 = $68&65535; //@line 390 "HyMES/poly.c"
  $71 = $69;
 } else {
  $71 = 0;
 }
 $70 = $71&65535; //@line 390 "HyMES/poly.c"
 $a = $70; //@line 390 "HyMES/poly.c"
 $72 = $t; //@line 391 "HyMES/poly.c"
 $73 = (($72) - 1)|0; //@line 391 "HyMES/poly.c"
 $i = $73; //@line 391 "HyMES/poly.c"
 while(1) {
  $74 = $i; //@line 391 "HyMES/poly.c"
  $75 = ($74|0)>(0); //@line 391 "HyMES/poly.c"
  if (!($75)) {
   break;
  }
  $76 = $i; //@line 392 "HyMES/poly.c"
  $77 = (($76) - 1)|0; //@line 392 "HyMES/poly.c"
  $78 = $0; //@line 392 "HyMES/poly.c"
  $79 = ((($78)) + 8|0); //@line 392 "HyMES/poly.c"
  $80 = HEAP32[$79>>2]|0; //@line 392 "HyMES/poly.c"
  $81 = (($80) + ($77<<1)|0); //@line 392 "HyMES/poly.c"
  $82 = HEAP16[$81>>1]|0; //@line 392 "HyMES/poly.c"
  $83 = $82&65535; //@line 392 "HyMES/poly.c"
  $84 = $a; //@line 392 "HyMES/poly.c"
  $85 = $84&65535; //@line 392 "HyMES/poly.c"
  $86 = ($85|0)!=(0); //@line 392 "HyMES/poly.c"
  if ($86) {
   $87 = $i; //@line 392 "HyMES/poly.c"
   $88 = $1; //@line 392 "HyMES/poly.c"
   $89 = ((($88)) + 8|0); //@line 392 "HyMES/poly.c"
   $90 = HEAP32[$89>>2]|0; //@line 392 "HyMES/poly.c"
   $91 = (($90) + ($87<<1)|0); //@line 392 "HyMES/poly.c"
   $92 = HEAP16[$91>>1]|0; //@line 392 "HyMES/poly.c"
   $93 = $92&65535; //@line 392 "HyMES/poly.c"
   $94 = ($93|0)!=(0); //@line 392 "HyMES/poly.c"
   if ($94) {
    $95 = $a; //@line 392 "HyMES/poly.c"
    $96 = $95&65535; //@line 392 "HyMES/poly.c"
    $97 = HEAP32[5120>>2]|0; //@line 392 "HyMES/poly.c"
    $98 = (($97) + ($96<<1)|0); //@line 392 "HyMES/poly.c"
    $99 = HEAP16[$98>>1]|0; //@line 392 "HyMES/poly.c"
    $100 = $99&65535; //@line 392 "HyMES/poly.c"
    $101 = $i; //@line 392 "HyMES/poly.c"
    $102 = $1; //@line 392 "HyMES/poly.c"
    $103 = ((($102)) + 8|0); //@line 392 "HyMES/poly.c"
    $104 = HEAP32[$103>>2]|0; //@line 392 "HyMES/poly.c"
    $105 = (($104) + ($101<<1)|0); //@line 392 "HyMES/poly.c"
    $106 = HEAP16[$105>>1]|0; //@line 392 "HyMES/poly.c"
    $107 = $106&65535; //@line 392 "HyMES/poly.c"
    $108 = HEAP32[5120>>2]|0; //@line 392 "HyMES/poly.c"
    $109 = (($108) + ($107<<1)|0); //@line 392 "HyMES/poly.c"
    $110 = HEAP16[$109>>1]|0; //@line 392 "HyMES/poly.c"
    $111 = $110&65535; //@line 392 "HyMES/poly.c"
    $112 = (($100) + ($111))|0; //@line 392 "HyMES/poly.c"
    $113 = HEAP32[5124>>2]|0; //@line 392 "HyMES/poly.c"
    $114 = $112 & $113; //@line 392 "HyMES/poly.c"
    $115 = $a; //@line 392 "HyMES/poly.c"
    $116 = $115&65535; //@line 392 "HyMES/poly.c"
    $117 = HEAP32[5120>>2]|0; //@line 392 "HyMES/poly.c"
    $118 = (($117) + ($116<<1)|0); //@line 392 "HyMES/poly.c"
    $119 = HEAP16[$118>>1]|0; //@line 392 "HyMES/poly.c"
    $120 = $119&65535; //@line 392 "HyMES/poly.c"
    $121 = $i; //@line 392 "HyMES/poly.c"
    $122 = $1; //@line 392 "HyMES/poly.c"
    $123 = ((($122)) + 8|0); //@line 392 "HyMES/poly.c"
    $124 = HEAP32[$123>>2]|0; //@line 392 "HyMES/poly.c"
    $125 = (($124) + ($121<<1)|0); //@line 392 "HyMES/poly.c"
    $126 = HEAP16[$125>>1]|0; //@line 392 "HyMES/poly.c"
    $127 = $126&65535; //@line 392 "HyMES/poly.c"
    $128 = HEAP32[5120>>2]|0; //@line 392 "HyMES/poly.c"
    $129 = (($128) + ($127<<1)|0); //@line 392 "HyMES/poly.c"
    $130 = HEAP16[$129>>1]|0; //@line 392 "HyMES/poly.c"
    $131 = $130&65535; //@line 392 "HyMES/poly.c"
    $132 = (($120) + ($131))|0; //@line 392 "HyMES/poly.c"
    $133 = HEAP32[5128>>2]|0; //@line 392 "HyMES/poly.c"
    $134 = $132 >> $133; //@line 392 "HyMES/poly.c"
    $135 = (($114) + ($134))|0; //@line 392 "HyMES/poly.c"
    $136 = HEAP32[5132>>2]|0; //@line 392 "HyMES/poly.c"
    $137 = (($136) + ($135<<1)|0); //@line 392 "HyMES/poly.c"
    $138 = HEAP16[$137>>1]|0; //@line 392 "HyMES/poly.c"
    $139 = $138&65535; //@line 392 "HyMES/poly.c"
    $141 = $139;
   } else {
    $141 = 0;
   }
  } else {
   $141 = 0;
  }
  $140 = $83 ^ $141; //@line 392 "HyMES/poly.c"
  $142 = $140&65535; //@line 392 "HyMES/poly.c"
  $143 = $i; //@line 392 "HyMES/poly.c"
  $144 = $0; //@line 392 "HyMES/poly.c"
  $145 = ((($144)) + 8|0); //@line 392 "HyMES/poly.c"
  $146 = HEAP32[$145>>2]|0; //@line 392 "HyMES/poly.c"
  $147 = (($146) + ($143<<1)|0); //@line 392 "HyMES/poly.c"
  HEAP16[$147>>1] = $142; //@line 392 "HyMES/poly.c"
  $148 = $i; //@line 391 "HyMES/poly.c"
  $149 = (($148) + -1)|0; //@line 391 "HyMES/poly.c"
  $i = $149; //@line 391 "HyMES/poly.c"
 }
 $150 = $a; //@line 393 "HyMES/poly.c"
 $151 = $150&65535; //@line 393 "HyMES/poly.c"
 $152 = ($151|0)!=(0); //@line 393 "HyMES/poly.c"
 if (!($152)) {
  $201 = 0;
  $200 = $201&65535; //@line 393 "HyMES/poly.c"
  $202 = $0; //@line 393 "HyMES/poly.c"
  $203 = ((($202)) + 8|0); //@line 393 "HyMES/poly.c"
  $204 = HEAP32[$203>>2]|0; //@line 393 "HyMES/poly.c"
  HEAP16[$204>>1] = $200; //@line 393 "HyMES/poly.c"
  STACKTOP = sp;return; //@line 394 "HyMES/poly.c"
 }
 $153 = $1; //@line 393 "HyMES/poly.c"
 $154 = ((($153)) + 8|0); //@line 393 "HyMES/poly.c"
 $155 = HEAP32[$154>>2]|0; //@line 393 "HyMES/poly.c"
 $156 = HEAP16[$155>>1]|0; //@line 393 "HyMES/poly.c"
 $157 = $156&65535; //@line 393 "HyMES/poly.c"
 $158 = ($157|0)!=(0); //@line 393 "HyMES/poly.c"
 if (!($158)) {
  $201 = 0;
  $200 = $201&65535; //@line 393 "HyMES/poly.c"
  $202 = $0; //@line 393 "HyMES/poly.c"
  $203 = ((($202)) + 8|0); //@line 393 "HyMES/poly.c"
  $204 = HEAP32[$203>>2]|0; //@line 393 "HyMES/poly.c"
  HEAP16[$204>>1] = $200; //@line 393 "HyMES/poly.c"
  STACKTOP = sp;return; //@line 394 "HyMES/poly.c"
 }
 $159 = $a; //@line 393 "HyMES/poly.c"
 $160 = $159&65535; //@line 393 "HyMES/poly.c"
 $161 = HEAP32[5120>>2]|0; //@line 393 "HyMES/poly.c"
 $162 = (($161) + ($160<<1)|0); //@line 393 "HyMES/poly.c"
 $163 = HEAP16[$162>>1]|0; //@line 393 "HyMES/poly.c"
 $164 = $163&65535; //@line 393 "HyMES/poly.c"
 $165 = $1; //@line 393 "HyMES/poly.c"
 $166 = ((($165)) + 8|0); //@line 393 "HyMES/poly.c"
 $167 = HEAP32[$166>>2]|0; //@line 393 "HyMES/poly.c"
 $168 = HEAP16[$167>>1]|0; //@line 393 "HyMES/poly.c"
 $169 = $168&65535; //@line 393 "HyMES/poly.c"
 $170 = HEAP32[5120>>2]|0; //@line 393 "HyMES/poly.c"
 $171 = (($170) + ($169<<1)|0); //@line 393 "HyMES/poly.c"
 $172 = HEAP16[$171>>1]|0; //@line 393 "HyMES/poly.c"
 $173 = $172&65535; //@line 393 "HyMES/poly.c"
 $174 = (($164) + ($173))|0; //@line 393 "HyMES/poly.c"
 $175 = HEAP32[5124>>2]|0; //@line 393 "HyMES/poly.c"
 $176 = $174 & $175; //@line 393 "HyMES/poly.c"
 $177 = $a; //@line 393 "HyMES/poly.c"
 $178 = $177&65535; //@line 393 "HyMES/poly.c"
 $179 = HEAP32[5120>>2]|0; //@line 393 "HyMES/poly.c"
 $180 = (($179) + ($178<<1)|0); //@line 393 "HyMES/poly.c"
 $181 = HEAP16[$180>>1]|0; //@line 393 "HyMES/poly.c"
 $182 = $181&65535; //@line 393 "HyMES/poly.c"
 $183 = $1; //@line 393 "HyMES/poly.c"
 $184 = ((($183)) + 8|0); //@line 393 "HyMES/poly.c"
 $185 = HEAP32[$184>>2]|0; //@line 393 "HyMES/poly.c"
 $186 = HEAP16[$185>>1]|0; //@line 393 "HyMES/poly.c"
 $187 = $186&65535; //@line 393 "HyMES/poly.c"
 $188 = HEAP32[5120>>2]|0; //@line 393 "HyMES/poly.c"
 $189 = (($188) + ($187<<1)|0); //@line 393 "HyMES/poly.c"
 $190 = HEAP16[$189>>1]|0; //@line 393 "HyMES/poly.c"
 $191 = $190&65535; //@line 393 "HyMES/poly.c"
 $192 = (($182) + ($191))|0; //@line 393 "HyMES/poly.c"
 $193 = HEAP32[5128>>2]|0; //@line 393 "HyMES/poly.c"
 $194 = $192 >> $193; //@line 393 "HyMES/poly.c"
 $195 = (($176) + ($194))|0; //@line 393 "HyMES/poly.c"
 $196 = HEAP32[5132>>2]|0; //@line 393 "HyMES/poly.c"
 $197 = (($196) + ($195<<1)|0); //@line 393 "HyMES/poly.c"
 $198 = HEAP16[$197>>1]|0; //@line 393 "HyMES/poly.c"
 $199 = $198&65535; //@line 393 "HyMES/poly.c"
 $201 = $199;
 $200 = $201&65535; //@line 393 "HyMES/poly.c"
 $202 = $0; //@line 393 "HyMES/poly.c"
 $203 = ((($202)) + 8|0); //@line 393 "HyMES/poly.c"
 $204 = HEAP32[$203>>2]|0; //@line 393 "HyMES/poly.c"
 HEAP16[$204>>1] = $200; //@line 393 "HyMES/poly.c"
 STACKTOP = sp;return; //@line 394 "HyMES/poly.c"
}
function _poly_sqrtmod_init($g) {
 $g = $g|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0;
 var $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0;
 var $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0;
 var $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0;
 var $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0;
 var $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $aux = 0, $i = 0, $p = 0, $q = 0, $sq_aux = 0, $sqrt = 0, $t = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $g;
 $1 = $0; //@line 400 "HyMES/poly.c"
 $2 = HEAP32[$1>>2]|0; //@line 400 "HyMES/poly.c"
 $t = $2; //@line 400 "HyMES/poly.c"
 $3 = $t; //@line 402 "HyMES/poly.c"
 $4 = $3<<2; //@line 402 "HyMES/poly.c"
 $5 = (_malloc($4)|0); //@line 402 "HyMES/poly.c"
 $sq_aux = $5; //@line 402 "HyMES/poly.c"
 $i = 0; //@line 403 "HyMES/poly.c"
 while(1) {
  $6 = $i; //@line 403 "HyMES/poly.c"
  $7 = $t; //@line 403 "HyMES/poly.c"
  $8 = ($6|0)<($7|0); //@line 403 "HyMES/poly.c"
  if (!($8)) {
   break;
  }
  $9 = $t; //@line 404 "HyMES/poly.c"
  $10 = (($9) + 1)|0; //@line 404 "HyMES/poly.c"
  $11 = (_poly_alloc($10)|0); //@line 404 "HyMES/poly.c"
  $12 = $i; //@line 404 "HyMES/poly.c"
  $13 = $sq_aux; //@line 404 "HyMES/poly.c"
  $14 = (($13) + ($12<<2)|0); //@line 404 "HyMES/poly.c"
  HEAP32[$14>>2] = $11; //@line 404 "HyMES/poly.c"
  $15 = $i; //@line 403 "HyMES/poly.c"
  $16 = (($15) + 1)|0; //@line 403 "HyMES/poly.c"
  $i = $16; //@line 403 "HyMES/poly.c"
 }
 $17 = $0; //@line 405 "HyMES/poly.c"
 $18 = $sq_aux; //@line 405 "HyMES/poly.c"
 _poly_sqmod_init($17,$18); //@line 405 "HyMES/poly.c"
 $19 = $t; //@line 407 "HyMES/poly.c"
 $20 = (($19) - 1)|0; //@line 407 "HyMES/poly.c"
 $21 = (_poly_alloc($20)|0); //@line 407 "HyMES/poly.c"
 $q = $21; //@line 407 "HyMES/poly.c"
 $22 = $t; //@line 408 "HyMES/poly.c"
 $23 = (($22) - 1)|0; //@line 408 "HyMES/poly.c"
 $24 = (_poly_alloc($23)|0); //@line 408 "HyMES/poly.c"
 $p = $24; //@line 408 "HyMES/poly.c"
 $25 = $p; //@line 409 "HyMES/poly.c"
 HEAP32[$25>>2] = 1; //@line 409 "HyMES/poly.c"
 $26 = $p; //@line 411 "HyMES/poly.c"
 $27 = ((($26)) + 8|0); //@line 411 "HyMES/poly.c"
 $28 = HEAP32[$27>>2]|0; //@line 411 "HyMES/poly.c"
 $29 = ((($28)) + 2|0); //@line 411 "HyMES/poly.c"
 HEAP16[$29>>1] = 1; //@line 411 "HyMES/poly.c"
 $i = 0; //@line 413 "HyMES/poly.c"
 while(1) {
  $30 = $i; //@line 413 "HyMES/poly.c"
  $31 = $t; //@line 413 "HyMES/poly.c"
  $32 = HEAP32[5128>>2]|0; //@line 413 "HyMES/poly.c"
  $33 = Math_imul($31, $32)|0; //@line 413 "HyMES/poly.c"
  $34 = (($33) - 1)|0; //@line 413 "HyMES/poly.c"
  $35 = ($30|0)<($34|0); //@line 413 "HyMES/poly.c"
  if (!($35)) {
   break;
  }
  $36 = $q; //@line 415 "HyMES/poly.c"
  $37 = $p; //@line 415 "HyMES/poly.c"
  $38 = $sq_aux; //@line 415 "HyMES/poly.c"
  $39 = $t; //@line 415 "HyMES/poly.c"
  _poly_sqmod($36,$37,$38,$39); //@line 415 "HyMES/poly.c"
  $40 = $q; //@line 417 "HyMES/poly.c"
  $aux = $40; //@line 417 "HyMES/poly.c"
  $41 = $p; //@line 417 "HyMES/poly.c"
  $q = $41; //@line 417 "HyMES/poly.c"
  $42 = $aux; //@line 417 "HyMES/poly.c"
  $p = $42; //@line 417 "HyMES/poly.c"
  $43 = $i; //@line 413 "HyMES/poly.c"
  $44 = (($43) + 1)|0; //@line 413 "HyMES/poly.c"
  $i = $44; //@line 413 "HyMES/poly.c"
 }
 $45 = $t; //@line 421 "HyMES/poly.c"
 $46 = $45<<2; //@line 421 "HyMES/poly.c"
 $47 = (_malloc($46)|0); //@line 421 "HyMES/poly.c"
 $sqrt = $47; //@line 421 "HyMES/poly.c"
 $i = 0; //@line 422 "HyMES/poly.c"
 while(1) {
  $48 = $i; //@line 422 "HyMES/poly.c"
  $49 = $t; //@line 422 "HyMES/poly.c"
  $50 = ($48|0)<($49|0); //@line 422 "HyMES/poly.c"
  if (!($50)) {
   break;
  }
  $51 = $t; //@line 423 "HyMES/poly.c"
  $52 = (($51) - 1)|0; //@line 423 "HyMES/poly.c"
  $53 = (_poly_alloc($52)|0); //@line 423 "HyMES/poly.c"
  $54 = $i; //@line 423 "HyMES/poly.c"
  $55 = $sqrt; //@line 423 "HyMES/poly.c"
  $56 = (($55) + ($54<<2)|0); //@line 423 "HyMES/poly.c"
  HEAP32[$56>>2] = $53; //@line 423 "HyMES/poly.c"
  $57 = $i; //@line 422 "HyMES/poly.c"
  $58 = (($57) + 1)|0; //@line 422 "HyMES/poly.c"
  $i = $58; //@line 422 "HyMES/poly.c"
 }
 $59 = $sqrt; //@line 425 "HyMES/poly.c"
 $60 = ((($59)) + 4|0); //@line 425 "HyMES/poly.c"
 $61 = HEAP32[$60>>2]|0; //@line 425 "HyMES/poly.c"
 $62 = $p; //@line 425 "HyMES/poly.c"
 _poly_set($61,$62); //@line 425 "HyMES/poly.c"
 $63 = $sqrt; //@line 426 "HyMES/poly.c"
 $64 = ((($63)) + 4|0); //@line 426 "HyMES/poly.c"
 $65 = HEAP32[$64>>2]|0; //@line 426 "HyMES/poly.c"
 (_poly_calcule_deg($65)|0); //@line 426 "HyMES/poly.c"
 $i = 3; //@line 427 "HyMES/poly.c"
 while(1) {
  $66 = $i; //@line 427 "HyMES/poly.c"
  $67 = $t; //@line 427 "HyMES/poly.c"
  $68 = ($66|0)<($67|0); //@line 427 "HyMES/poly.c"
  if (!($68)) {
   break;
  }
  $69 = $i; //@line 428 "HyMES/poly.c"
  $70 = $sqrt; //@line 428 "HyMES/poly.c"
  $71 = (($70) + ($69<<2)|0); //@line 428 "HyMES/poly.c"
  $72 = HEAP32[$71>>2]|0; //@line 428 "HyMES/poly.c"
  $73 = $i; //@line 428 "HyMES/poly.c"
  $74 = (($73) - 2)|0; //@line 428 "HyMES/poly.c"
  $75 = $sqrt; //@line 428 "HyMES/poly.c"
  $76 = (($75) + ($74<<2)|0); //@line 428 "HyMES/poly.c"
  $77 = HEAP32[$76>>2]|0; //@line 428 "HyMES/poly.c"
  _poly_set($72,$77); //@line 428 "HyMES/poly.c"
  $78 = $i; //@line 429 "HyMES/poly.c"
  $79 = $sqrt; //@line 429 "HyMES/poly.c"
  $80 = (($79) + ($78<<2)|0); //@line 429 "HyMES/poly.c"
  $81 = HEAP32[$80>>2]|0; //@line 429 "HyMES/poly.c"
  $82 = $0; //@line 429 "HyMES/poly.c"
  _poly_shiftmod($81,$82); //@line 429 "HyMES/poly.c"
  $83 = $i; //@line 430 "HyMES/poly.c"
  $84 = $sqrt; //@line 430 "HyMES/poly.c"
  $85 = (($84) + ($83<<2)|0); //@line 430 "HyMES/poly.c"
  $86 = HEAP32[$85>>2]|0; //@line 430 "HyMES/poly.c"
  (_poly_calcule_deg($86)|0); //@line 430 "HyMES/poly.c"
  $87 = $i; //@line 427 "HyMES/poly.c"
  $88 = (($87) + 2)|0; //@line 427 "HyMES/poly.c"
  $i = $88; //@line 427 "HyMES/poly.c"
 }
 $i = 0; //@line 433 "HyMES/poly.c"
 while(1) {
  $89 = $i; //@line 433 "HyMES/poly.c"
  $90 = $t; //@line 433 "HyMES/poly.c"
  $91 = ($89|0)<($90|0); //@line 433 "HyMES/poly.c"
  if (!($91)) {
   break;
  }
  $92 = $i; //@line 434 "HyMES/poly.c"
  $93 = $sqrt; //@line 434 "HyMES/poly.c"
  $94 = (($93) + ($92<<2)|0); //@line 434 "HyMES/poly.c"
  $95 = HEAP32[$94>>2]|0; //@line 434 "HyMES/poly.c"
  _poly_set_to_zero($95); //@line 434 "HyMES/poly.c"
  $96 = $i; //@line 435 "HyMES/poly.c"
  $97 = (($96|0) / 2)&-1; //@line 435 "HyMES/poly.c"
  $98 = $i; //@line 435 "HyMES/poly.c"
  $99 = $sqrt; //@line 435 "HyMES/poly.c"
  $100 = (($99) + ($98<<2)|0); //@line 435 "HyMES/poly.c"
  $101 = HEAP32[$100>>2]|0; //@line 435 "HyMES/poly.c"
  $102 = ((($101)) + 8|0); //@line 435 "HyMES/poly.c"
  $103 = HEAP32[$102>>2]|0; //@line 435 "HyMES/poly.c"
  $104 = (($103) + ($97<<1)|0); //@line 435 "HyMES/poly.c"
  HEAP16[$104>>1] = 1; //@line 435 "HyMES/poly.c"
  $105 = $i; //@line 436 "HyMES/poly.c"
  $106 = (($105|0) / 2)&-1; //@line 436 "HyMES/poly.c"
  $107 = $i; //@line 436 "HyMES/poly.c"
  $108 = $sqrt; //@line 436 "HyMES/poly.c"
  $109 = (($108) + ($107<<2)|0); //@line 436 "HyMES/poly.c"
  $110 = HEAP32[$109>>2]|0; //@line 436 "HyMES/poly.c"
  HEAP32[$110>>2] = $106; //@line 436 "HyMES/poly.c"
  $111 = $i; //@line 433 "HyMES/poly.c"
  $112 = (($111) + 2)|0; //@line 433 "HyMES/poly.c"
  $i = $112; //@line 433 "HyMES/poly.c"
 }
 $i = 0; //@line 439 "HyMES/poly.c"
 while(1) {
  $113 = $i; //@line 439 "HyMES/poly.c"
  $114 = $t; //@line 439 "HyMES/poly.c"
  $115 = ($113|0)<($114|0); //@line 439 "HyMES/poly.c"
  if (!($115)) {
   break;
  }
  $116 = $i; //@line 440 "HyMES/poly.c"
  $117 = $sq_aux; //@line 440 "HyMES/poly.c"
  $118 = (($117) + ($116<<2)|0); //@line 440 "HyMES/poly.c"
  $119 = HEAP32[$118>>2]|0; //@line 440 "HyMES/poly.c"
  _poly_free($119); //@line 440 "HyMES/poly.c"
  $120 = $i; //@line 439 "HyMES/poly.c"
  $121 = (($120) + 1)|0; //@line 439 "HyMES/poly.c"
  $i = $121; //@line 439 "HyMES/poly.c"
 }
 $122 = $sq_aux; //@line 441 "HyMES/poly.c"
 _free($122); //@line 441 "HyMES/poly.c"
 $123 = $p; //@line 442 "HyMES/poly.c"
 _poly_free($123); //@line 442 "HyMES/poly.c"
 $124 = $q; //@line 443 "HyMES/poly.c"
 _poly_free($124); //@line 443 "HyMES/poly.c"
 $125 = $sqrt; //@line 445 "HyMES/poly.c"
 STACKTOP = sp;return ($125|0); //@line 445 "HyMES/poly.c"
}
function _poly_syndrome_init($generator,$support,$n) {
 $generator = $generator|0;
 $support = $support|0;
 $n = $n|0;
 var $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0;
 var $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0;
 var $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0;
 var $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0;
 var $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0;
 var $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0;
 var $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0;
 var $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0;
 var $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0;
 var $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0;
 var $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0;
 var $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0;
 var $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0;
 var $96 = 0, $97 = 0, $98 = 0, $99 = 0, $F = 0, $a = 0, $i = 0, $j = 0, $t = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $generator;
 $1 = $support;
 $2 = $n;
 $3 = $2; //@line 454 "HyMES/poly.c"
 $4 = $3<<2; //@line 454 "HyMES/poly.c"
 $5 = (_malloc($4)|0); //@line 454 "HyMES/poly.c"
 $F = $5; //@line 454 "HyMES/poly.c"
 $6 = $0; //@line 455 "HyMES/poly.c"
 $7 = HEAP32[$6>>2]|0; //@line 455 "HyMES/poly.c"
 $t = $7; //@line 455 "HyMES/poly.c"
 $j = 0; //@line 460 "HyMES/poly.c"
 while(1) {
  $8 = $j; //@line 460 "HyMES/poly.c"
  $9 = $2; //@line 460 "HyMES/poly.c"
  $10 = ($8|0)<($9|0); //@line 460 "HyMES/poly.c"
  if (!($10)) {
   break;
  }
  $11 = $t; //@line 462 "HyMES/poly.c"
  $12 = (($11) - 1)|0; //@line 462 "HyMES/poly.c"
  $13 = (_poly_alloc($12)|0); //@line 462 "HyMES/poly.c"
  $14 = $j; //@line 462 "HyMES/poly.c"
  $15 = $F; //@line 462 "HyMES/poly.c"
  $16 = (($15) + ($14<<2)|0); //@line 462 "HyMES/poly.c"
  HEAP32[$16>>2] = $13; //@line 462 "HyMES/poly.c"
  $17 = $t; //@line 463 "HyMES/poly.c"
  $18 = (($17) - 1)|0; //@line 463 "HyMES/poly.c"
  $19 = $j; //@line 463 "HyMES/poly.c"
  $20 = $F; //@line 463 "HyMES/poly.c"
  $21 = (($20) + ($19<<2)|0); //@line 463 "HyMES/poly.c"
  $22 = HEAP32[$21>>2]|0; //@line 463 "HyMES/poly.c"
  $23 = ((($22)) + 8|0); //@line 463 "HyMES/poly.c"
  $24 = HEAP32[$23>>2]|0; //@line 463 "HyMES/poly.c"
  $25 = (($24) + ($18<<1)|0); //@line 463 "HyMES/poly.c"
  HEAP16[$25>>1] = 1; //@line 463 "HyMES/poly.c"
  $26 = $t; //@line 464 "HyMES/poly.c"
  $27 = (($26) - 2)|0; //@line 464 "HyMES/poly.c"
  $i = $27; //@line 464 "HyMES/poly.c"
  while(1) {
   $28 = $i; //@line 464 "HyMES/poly.c"
   $29 = ($28|0)>=(0); //@line 464 "HyMES/poly.c"
   if (!($29)) {
    break;
   }
   $30 = $i; //@line 466 "HyMES/poly.c"
   $31 = (($30) + 1)|0; //@line 466 "HyMES/poly.c"
   $32 = $0; //@line 466 "HyMES/poly.c"
   $33 = ((($32)) + 8|0); //@line 466 "HyMES/poly.c"
   $34 = HEAP32[$33>>2]|0; //@line 466 "HyMES/poly.c"
   $35 = (($34) + ($31<<1)|0); //@line 466 "HyMES/poly.c"
   $36 = HEAP16[$35>>1]|0; //@line 466 "HyMES/poly.c"
   $37 = $36&65535; //@line 466 "HyMES/poly.c"
   $38 = $j; //@line 466 "HyMES/poly.c"
   $39 = $1; //@line 466 "HyMES/poly.c"
   $40 = (($39) + ($38<<1)|0); //@line 466 "HyMES/poly.c"
   $41 = HEAP16[$40>>1]|0; //@line 466 "HyMES/poly.c"
   $42 = $41&65535; //@line 466 "HyMES/poly.c"
   $43 = ($42|0)!=(0); //@line 466 "HyMES/poly.c"
   if ($43) {
    $44 = $i; //@line 466 "HyMES/poly.c"
    $45 = (($44) + 1)|0; //@line 466 "HyMES/poly.c"
    $46 = $j; //@line 466 "HyMES/poly.c"
    $47 = $F; //@line 466 "HyMES/poly.c"
    $48 = (($47) + ($46<<2)|0); //@line 466 "HyMES/poly.c"
    $49 = HEAP32[$48>>2]|0; //@line 466 "HyMES/poly.c"
    $50 = ((($49)) + 8|0); //@line 466 "HyMES/poly.c"
    $51 = HEAP32[$50>>2]|0; //@line 466 "HyMES/poly.c"
    $52 = (($51) + ($45<<1)|0); //@line 466 "HyMES/poly.c"
    $53 = HEAP16[$52>>1]|0; //@line 466 "HyMES/poly.c"
    $54 = $53&65535; //@line 466 "HyMES/poly.c"
    $55 = ($54|0)!=(0); //@line 466 "HyMES/poly.c"
    if ($55) {
     $56 = $j; //@line 466 "HyMES/poly.c"
     $57 = $1; //@line 466 "HyMES/poly.c"
     $58 = (($57) + ($56<<1)|0); //@line 466 "HyMES/poly.c"
     $59 = HEAP16[$58>>1]|0; //@line 466 "HyMES/poly.c"
     $60 = $59&65535; //@line 466 "HyMES/poly.c"
     $61 = HEAP32[5120>>2]|0; //@line 466 "HyMES/poly.c"
     $62 = (($61) + ($60<<1)|0); //@line 466 "HyMES/poly.c"
     $63 = HEAP16[$62>>1]|0; //@line 466 "HyMES/poly.c"
     $64 = $63&65535; //@line 466 "HyMES/poly.c"
     $65 = $i; //@line 466 "HyMES/poly.c"
     $66 = (($65) + 1)|0; //@line 466 "HyMES/poly.c"
     $67 = $j; //@line 466 "HyMES/poly.c"
     $68 = $F; //@line 466 "HyMES/poly.c"
     $69 = (($68) + ($67<<2)|0); //@line 466 "HyMES/poly.c"
     $70 = HEAP32[$69>>2]|0; //@line 466 "HyMES/poly.c"
     $71 = ((($70)) + 8|0); //@line 466 "HyMES/poly.c"
     $72 = HEAP32[$71>>2]|0; //@line 466 "HyMES/poly.c"
     $73 = (($72) + ($66<<1)|0); //@line 466 "HyMES/poly.c"
     $74 = HEAP16[$73>>1]|0; //@line 466 "HyMES/poly.c"
     $75 = $74&65535; //@line 466 "HyMES/poly.c"
     $76 = HEAP32[5120>>2]|0; //@line 466 "HyMES/poly.c"
     $77 = (($76) + ($75<<1)|0); //@line 466 "HyMES/poly.c"
     $78 = HEAP16[$77>>1]|0; //@line 466 "HyMES/poly.c"
     $79 = $78&65535; //@line 466 "HyMES/poly.c"
     $80 = (($64) + ($79))|0; //@line 466 "HyMES/poly.c"
     $81 = HEAP32[5124>>2]|0; //@line 466 "HyMES/poly.c"
     $82 = $80 & $81; //@line 466 "HyMES/poly.c"
     $83 = $j; //@line 466 "HyMES/poly.c"
     $84 = $1; //@line 466 "HyMES/poly.c"
     $85 = (($84) + ($83<<1)|0); //@line 466 "HyMES/poly.c"
     $86 = HEAP16[$85>>1]|0; //@line 466 "HyMES/poly.c"
     $87 = $86&65535; //@line 466 "HyMES/poly.c"
     $88 = HEAP32[5120>>2]|0; //@line 466 "HyMES/poly.c"
     $89 = (($88) + ($87<<1)|0); //@line 466 "HyMES/poly.c"
     $90 = HEAP16[$89>>1]|0; //@line 466 "HyMES/poly.c"
     $91 = $90&65535; //@line 466 "HyMES/poly.c"
     $92 = $i; //@line 466 "HyMES/poly.c"
     $93 = (($92) + 1)|0; //@line 466 "HyMES/poly.c"
     $94 = $j; //@line 466 "HyMES/poly.c"
     $95 = $F; //@line 466 "HyMES/poly.c"
     $96 = (($95) + ($94<<2)|0); //@line 466 "HyMES/poly.c"
     $97 = HEAP32[$96>>2]|0; //@line 466 "HyMES/poly.c"
     $98 = ((($97)) + 8|0); //@line 466 "HyMES/poly.c"
     $99 = HEAP32[$98>>2]|0; //@line 466 "HyMES/poly.c"
     $100 = (($99) + ($93<<1)|0); //@line 466 "HyMES/poly.c"
     $101 = HEAP16[$100>>1]|0; //@line 466 "HyMES/poly.c"
     $102 = $101&65535; //@line 466 "HyMES/poly.c"
     $103 = HEAP32[5120>>2]|0; //@line 466 "HyMES/poly.c"
     $104 = (($103) + ($102<<1)|0); //@line 466 "HyMES/poly.c"
     $105 = HEAP16[$104>>1]|0; //@line 466 "HyMES/poly.c"
     $106 = $105&65535; //@line 466 "HyMES/poly.c"
     $107 = (($91) + ($106))|0; //@line 466 "HyMES/poly.c"
     $108 = HEAP32[5128>>2]|0; //@line 466 "HyMES/poly.c"
     $109 = $107 >> $108; //@line 466 "HyMES/poly.c"
     $110 = (($82) + ($109))|0; //@line 466 "HyMES/poly.c"
     $111 = HEAP32[5132>>2]|0; //@line 466 "HyMES/poly.c"
     $112 = (($111) + ($110<<1)|0); //@line 466 "HyMES/poly.c"
     $113 = HEAP16[$112>>1]|0; //@line 466 "HyMES/poly.c"
     $114 = $113&65535; //@line 466 "HyMES/poly.c"
     $116 = $114;
    } else {
     $116 = 0;
    }
   } else {
    $116 = 0;
   }
   $115 = $37 ^ $116; //@line 466 "HyMES/poly.c"
   $117 = $115&65535; //@line 466 "HyMES/poly.c"
   $118 = $i; //@line 466 "HyMES/poly.c"
   $119 = $j; //@line 466 "HyMES/poly.c"
   $120 = $F; //@line 466 "HyMES/poly.c"
   $121 = (($120) + ($119<<2)|0); //@line 466 "HyMES/poly.c"
   $122 = HEAP32[$121>>2]|0; //@line 466 "HyMES/poly.c"
   $123 = ((($122)) + 8|0); //@line 466 "HyMES/poly.c"
   $124 = HEAP32[$123>>2]|0; //@line 466 "HyMES/poly.c"
   $125 = (($124) + ($118<<1)|0); //@line 466 "HyMES/poly.c"
   HEAP16[$125>>1] = $117; //@line 466 "HyMES/poly.c"
   $126 = $i; //@line 464 "HyMES/poly.c"
   $127 = (($126) + -1)|0; //@line 464 "HyMES/poly.c"
   $i = $127; //@line 464 "HyMES/poly.c"
  }
  $128 = $0; //@line 469 "HyMES/poly.c"
  $129 = ((($128)) + 8|0); //@line 469 "HyMES/poly.c"
  $130 = HEAP32[$129>>2]|0; //@line 469 "HyMES/poly.c"
  $131 = HEAP16[$130>>1]|0; //@line 469 "HyMES/poly.c"
  $132 = $131&65535; //@line 469 "HyMES/poly.c"
  $133 = $j; //@line 469 "HyMES/poly.c"
  $134 = $1; //@line 469 "HyMES/poly.c"
  $135 = (($134) + ($133<<1)|0); //@line 469 "HyMES/poly.c"
  $136 = HEAP16[$135>>1]|0; //@line 469 "HyMES/poly.c"
  $137 = $136&65535; //@line 469 "HyMES/poly.c"
  $138 = ($137|0)!=(0); //@line 469 "HyMES/poly.c"
  if ($138) {
   $139 = $j; //@line 469 "HyMES/poly.c"
   $140 = $F; //@line 469 "HyMES/poly.c"
   $141 = (($140) + ($139<<2)|0); //@line 469 "HyMES/poly.c"
   $142 = HEAP32[$141>>2]|0; //@line 469 "HyMES/poly.c"
   $143 = ((($142)) + 8|0); //@line 469 "HyMES/poly.c"
   $144 = HEAP32[$143>>2]|0; //@line 469 "HyMES/poly.c"
   $145 = HEAP16[$144>>1]|0; //@line 469 "HyMES/poly.c"
   $146 = $145&65535; //@line 469 "HyMES/poly.c"
   $147 = ($146|0)!=(0); //@line 469 "HyMES/poly.c"
   if ($147) {
    $148 = $j; //@line 469 "HyMES/poly.c"
    $149 = $1; //@line 469 "HyMES/poly.c"
    $150 = (($149) + ($148<<1)|0); //@line 469 "HyMES/poly.c"
    $151 = HEAP16[$150>>1]|0; //@line 469 "HyMES/poly.c"
    $152 = $151&65535; //@line 469 "HyMES/poly.c"
    $153 = HEAP32[5120>>2]|0; //@line 469 "HyMES/poly.c"
    $154 = (($153) + ($152<<1)|0); //@line 469 "HyMES/poly.c"
    $155 = HEAP16[$154>>1]|0; //@line 469 "HyMES/poly.c"
    $156 = $155&65535; //@line 469 "HyMES/poly.c"
    $157 = $j; //@line 469 "HyMES/poly.c"
    $158 = $F; //@line 469 "HyMES/poly.c"
    $159 = (($158) + ($157<<2)|0); //@line 469 "HyMES/poly.c"
    $160 = HEAP32[$159>>2]|0; //@line 469 "HyMES/poly.c"
    $161 = ((($160)) + 8|0); //@line 469 "HyMES/poly.c"
    $162 = HEAP32[$161>>2]|0; //@line 469 "HyMES/poly.c"
    $163 = HEAP16[$162>>1]|0; //@line 469 "HyMES/poly.c"
    $164 = $163&65535; //@line 469 "HyMES/poly.c"
    $165 = HEAP32[5120>>2]|0; //@line 469 "HyMES/poly.c"
    $166 = (($165) + ($164<<1)|0); //@line 469 "HyMES/poly.c"
    $167 = HEAP16[$166>>1]|0; //@line 469 "HyMES/poly.c"
    $168 = $167&65535; //@line 469 "HyMES/poly.c"
    $169 = (($156) + ($168))|0; //@line 469 "HyMES/poly.c"
    $170 = HEAP32[5124>>2]|0; //@line 469 "HyMES/poly.c"
    $171 = $169 & $170; //@line 469 "HyMES/poly.c"
    $172 = $j; //@line 469 "HyMES/poly.c"
    $173 = $1; //@line 469 "HyMES/poly.c"
    $174 = (($173) + ($172<<1)|0); //@line 469 "HyMES/poly.c"
    $175 = HEAP16[$174>>1]|0; //@line 469 "HyMES/poly.c"
    $176 = $175&65535; //@line 469 "HyMES/poly.c"
    $177 = HEAP32[5120>>2]|0; //@line 469 "HyMES/poly.c"
    $178 = (($177) + ($176<<1)|0); //@line 469 "HyMES/poly.c"
    $179 = HEAP16[$178>>1]|0; //@line 469 "HyMES/poly.c"
    $180 = $179&65535; //@line 469 "HyMES/poly.c"
    $181 = $j; //@line 469 "HyMES/poly.c"
    $182 = $F; //@line 469 "HyMES/poly.c"
    $183 = (($182) + ($181<<2)|0); //@line 469 "HyMES/poly.c"
    $184 = HEAP32[$183>>2]|0; //@line 469 "HyMES/poly.c"
    $185 = ((($184)) + 8|0); //@line 469 "HyMES/poly.c"
    $186 = HEAP32[$185>>2]|0; //@line 469 "HyMES/poly.c"
    $187 = HEAP16[$186>>1]|0; //@line 469 "HyMES/poly.c"
    $188 = $187&65535; //@line 469 "HyMES/poly.c"
    $189 = HEAP32[5120>>2]|0; //@line 469 "HyMES/poly.c"
    $190 = (($189) + ($188<<1)|0); //@line 469 "HyMES/poly.c"
    $191 = HEAP16[$190>>1]|0; //@line 469 "HyMES/poly.c"
    $192 = $191&65535; //@line 469 "HyMES/poly.c"
    $193 = (($180) + ($192))|0; //@line 469 "HyMES/poly.c"
    $194 = HEAP32[5128>>2]|0; //@line 469 "HyMES/poly.c"
    $195 = $193 >> $194; //@line 469 "HyMES/poly.c"
    $196 = (($171) + ($195))|0; //@line 469 "HyMES/poly.c"
    $197 = HEAP32[5132>>2]|0; //@line 469 "HyMES/poly.c"
    $198 = (($197) + ($196<<1)|0); //@line 469 "HyMES/poly.c"
    $199 = HEAP16[$198>>1]|0; //@line 469 "HyMES/poly.c"
    $200 = $199&65535; //@line 469 "HyMES/poly.c"
    $202 = $200;
   } else {
    $202 = 0;
   }
  } else {
   $202 = 0;
  }
  $201 = $132 ^ $202; //@line 469 "HyMES/poly.c"
  $203 = $201&65535; //@line 469 "HyMES/poly.c"
  $a = $203; //@line 469 "HyMES/poly.c"
  $i = 0; //@line 470 "HyMES/poly.c"
  while(1) {
   $204 = $i; //@line 470 "HyMES/poly.c"
   $205 = $t; //@line 470 "HyMES/poly.c"
   $206 = ($204|0)<($205|0); //@line 470 "HyMES/poly.c"
   if (!($206)) {
    break;
   }
   $207 = $i; //@line 472 "HyMES/poly.c"
   $208 = $j; //@line 472 "HyMES/poly.c"
   $209 = $F; //@line 472 "HyMES/poly.c"
   $210 = (($209) + ($208<<2)|0); //@line 472 "HyMES/poly.c"
   $211 = HEAP32[$210>>2]|0; //@line 472 "HyMES/poly.c"
   $212 = ((($211)) + 8|0); //@line 472 "HyMES/poly.c"
   $213 = HEAP32[$212>>2]|0; //@line 472 "HyMES/poly.c"
   $214 = (($213) + ($207<<1)|0); //@line 472 "HyMES/poly.c"
   $215 = HEAP16[$214>>1]|0; //@line 472 "HyMES/poly.c"
   $216 = $215&65535; //@line 472 "HyMES/poly.c"
   $217 = ($216|0)!=(0); //@line 472 "HyMES/poly.c"
   if ($217) {
    $218 = $i; //@line 472 "HyMES/poly.c"
    $219 = $j; //@line 472 "HyMES/poly.c"
    $220 = $F; //@line 472 "HyMES/poly.c"
    $221 = (($220) + ($219<<2)|0); //@line 472 "HyMES/poly.c"
    $222 = HEAP32[$221>>2]|0; //@line 472 "HyMES/poly.c"
    $223 = ((($222)) + 8|0); //@line 472 "HyMES/poly.c"
    $224 = HEAP32[$223>>2]|0; //@line 472 "HyMES/poly.c"
    $225 = (($224) + ($218<<1)|0); //@line 472 "HyMES/poly.c"
    $226 = HEAP16[$225>>1]|0; //@line 472 "HyMES/poly.c"
    $227 = $226&65535; //@line 472 "HyMES/poly.c"
    $228 = HEAP32[5120>>2]|0; //@line 472 "HyMES/poly.c"
    $229 = (($228) + ($227<<1)|0); //@line 472 "HyMES/poly.c"
    $230 = HEAP16[$229>>1]|0; //@line 472 "HyMES/poly.c"
    $231 = $230&65535; //@line 472 "HyMES/poly.c"
    $232 = $a; //@line 472 "HyMES/poly.c"
    $233 = $232&65535; //@line 472 "HyMES/poly.c"
    $234 = HEAP32[5120>>2]|0; //@line 472 "HyMES/poly.c"
    $235 = (($234) + ($233<<1)|0); //@line 472 "HyMES/poly.c"
    $236 = HEAP16[$235>>1]|0; //@line 472 "HyMES/poly.c"
    $237 = $236&65535; //@line 472 "HyMES/poly.c"
    $238 = (($231) - ($237))|0; //@line 472 "HyMES/poly.c"
    $239 = HEAP32[5124>>2]|0; //@line 472 "HyMES/poly.c"
    $240 = $238 & $239; //@line 472 "HyMES/poly.c"
    $241 = $i; //@line 472 "HyMES/poly.c"
    $242 = $j; //@line 472 "HyMES/poly.c"
    $243 = $F; //@line 472 "HyMES/poly.c"
    $244 = (($243) + ($242<<2)|0); //@line 472 "HyMES/poly.c"
    $245 = HEAP32[$244>>2]|0; //@line 472 "HyMES/poly.c"
    $246 = ((($245)) + 8|0); //@line 472 "HyMES/poly.c"
    $247 = HEAP32[$246>>2]|0; //@line 472 "HyMES/poly.c"
    $248 = (($247) + ($241<<1)|0); //@line 472 "HyMES/poly.c"
    $249 = HEAP16[$248>>1]|0; //@line 472 "HyMES/poly.c"
    $250 = $249&65535; //@line 472 "HyMES/poly.c"
    $251 = HEAP32[5120>>2]|0; //@line 472 "HyMES/poly.c"
    $252 = (($251) + ($250<<1)|0); //@line 472 "HyMES/poly.c"
    $253 = HEAP16[$252>>1]|0; //@line 472 "HyMES/poly.c"
    $254 = $253&65535; //@line 472 "HyMES/poly.c"
    $255 = $a; //@line 472 "HyMES/poly.c"
    $256 = $255&65535; //@line 472 "HyMES/poly.c"
    $257 = HEAP32[5120>>2]|0; //@line 472 "HyMES/poly.c"
    $258 = (($257) + ($256<<1)|0); //@line 472 "HyMES/poly.c"
    $259 = HEAP16[$258>>1]|0; //@line 472 "HyMES/poly.c"
    $260 = $259&65535; //@line 472 "HyMES/poly.c"
    $261 = (($254) - ($260))|0; //@line 472 "HyMES/poly.c"
    $262 = HEAP32[5128>>2]|0; //@line 472 "HyMES/poly.c"
    $263 = $261 >> $262; //@line 472 "HyMES/poly.c"
    $264 = (($240) + ($263))|0; //@line 472 "HyMES/poly.c"
    $265 = HEAP32[5132>>2]|0; //@line 472 "HyMES/poly.c"
    $266 = (($265) + ($264<<1)|0); //@line 472 "HyMES/poly.c"
    $267 = HEAP16[$266>>1]|0; //@line 472 "HyMES/poly.c"
    $268 = $267&65535; //@line 472 "HyMES/poly.c"
    $270 = $268;
   } else {
    $270 = 0;
   }
   $269 = $270&65535; //@line 472 "HyMES/poly.c"
   $271 = $i; //@line 472 "HyMES/poly.c"
   $272 = $j; //@line 472 "HyMES/poly.c"
   $273 = $F; //@line 472 "HyMES/poly.c"
   $274 = (($273) + ($272<<2)|0); //@line 472 "HyMES/poly.c"
   $275 = HEAP32[$274>>2]|0; //@line 472 "HyMES/poly.c"
   $276 = ((($275)) + 8|0); //@line 472 "HyMES/poly.c"
   $277 = HEAP32[$276>>2]|0; //@line 472 "HyMES/poly.c"
   $278 = (($277) + ($271<<1)|0); //@line 472 "HyMES/poly.c"
   HEAP16[$278>>1] = $269; //@line 472 "HyMES/poly.c"
   $279 = $i; //@line 470 "HyMES/poly.c"
   $280 = (($279) + 1)|0; //@line 470 "HyMES/poly.c"
   $i = $280; //@line 470 "HyMES/poly.c"
  }
  $281 = $j; //@line 460 "HyMES/poly.c"
  $282 = (($281) + 1)|0; //@line 460 "HyMES/poly.c"
  $j = $282; //@line 460 "HyMES/poly.c"
 }
 $283 = $F; //@line 476 "HyMES/poly.c"
 STACKTOP = sp;return ($283|0); //@line 476 "HyMES/poly.c"
}
function _mceliecejs_init() {
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $randomstate = 0, $randomstate_len = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $randomstate_len = 256; //@line 9 "mceliece.c"
 $0 = $randomstate_len; //@line 10 "mceliece.c"
 $1 = (_malloc($0)|0); //@line 10 "mceliece.c"
 $randomstate = $1; //@line 10 "mceliece.c"
 _randombytes_stir(); //@line 12 "mceliece.c"
 $2 = $randomstate; //@line 13 "mceliece.c"
 $3 = $randomstate_len; //@line 13 "mceliece.c"
 _randombytes_buf($2,$3); //@line 13 "mceliece.c"
 $4 = (_time((0|0))|0); //@line 14 "mceliece.c"
 $5 = $randomstate; //@line 14 "mceliece.c"
 $6 = $randomstate_len; //@line 14 "mceliece.c"
 (_initstate($4,$5,$6)|0); //@line 14 "mceliece.c"
 STACKTOP = sp;return; //@line 15 "mceliece.c"
}
function _mceliecejs_public_key_bytes() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 310592; //@line 18 "mceliece.c"
}
function _mceliecejs_private_key_bytes() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 392346; //@line 22 "mceliece.c"
}
function _mceliecejs_encrypted_bytes() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 512; //@line 26 "mceliece.c"
}
function _mceliecejs_decrypted_bytes() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 478; //@line 30 "mceliece.c"
}
function _mceliecejs_keypair($public_key,$private_key) {
 $public_key = $public_key|0;
 $private_key = $private_key|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $public_key;
 $1 = $private_key;
 $2 = $1; //@line 37 "mceliece.c"
 $3 = $0; //@line 37 "mceliece.c"
 (_keypair($2,$3)|0); //@line 37 "mceliece.c"
 STACKTOP = sp;return; //@line 38 "mceliece.c"
}
function _mceliecejs_encrypt($message,$public_key,$cyphertext) {
 $message = $message|0;
 $public_key = $public_key|0;
 $cyphertext = $cyphertext|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $message;
 $1 = $public_key;
 $2 = $cyphertext;
 $3 = $2; //@line 45 "mceliece.c"
 $4 = $0; //@line 45 "mceliece.c"
 $5 = $1; //@line 45 "mceliece.c"
 (_encrypt_block($3,$4,$5)|0); //@line 45 "mceliece.c"
 STACKTOP = sp;return; //@line 46 "mceliece.c"
}
function _mceliecejs_decrypt($cyphertext,$private_key,$decrypted) {
 $cyphertext = $cyphertext|0;
 $private_key = $private_key|0;
 $decrypted = $decrypted|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = $cyphertext;
 $1 = $private_key;
 $2 = $decrypted;
 $3 = $2; //@line 53 "mceliece.c"
 $4 = $0; //@line 53 "mceliece.c"
 $5 = $1; //@line 53 "mceliece.c"
 (_decrypt_block($3,$4,$5)|0); //@line 53 "mceliece.c"
 STACKTOP = sp;return; //@line 54 "mceliece.c"
}
function ___errno_location() {
 var $$0 = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[7608>>2]|0;
 $1 = ($0|0)==(0|0);
 if ($1) {
  $$0 = 7660;
 } else {
  $2 = (_pthread_self()|0);
  $3 = ((($2)) + 60|0);
  $4 = HEAP32[$3>>2]|0;
  $$0 = $4;
 }
 return ($$0|0);
}
function _strerror($e) {
 $e = $e|0;
 var $$lcssa = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i$03 = 0, $i$03$lcssa = 0, $i$12 = 0, $s$0$lcssa = 0, $s$01 = 0, $s$1 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 $i$03 = 0;
 while(1) {
  $1 = (9617 + ($i$03)|0);
  $2 = HEAP8[$1>>0]|0;
  $3 = $2&255;
  $4 = ($3|0)==($e|0);
  if ($4) {
   $i$03$lcssa = $i$03;
   label = 2;
   break;
  }
  $5 = (($i$03) + 1)|0;
  $6 = ($5|0)==(87);
  if ($6) {
   $i$12 = 87;$s$01 = 9705;
   label = 5;
   break;
  } else {
   $i$03 = $5;
  }
 }
 if ((label|0) == 2) {
  $0 = ($i$03$lcssa|0)==(0);
  if ($0) {
   $s$0$lcssa = 9705;
  } else {
   $i$12 = $i$03$lcssa;$s$01 = 9705;
   label = 5;
  }
 }
 if ((label|0) == 5) {
  while(1) {
   label = 0;
   $s$1 = $s$01;
   while(1) {
    $7 = HEAP8[$s$1>>0]|0;
    $8 = ($7<<24>>24)==(0);
    $9 = ((($s$1)) + 1|0);
    if ($8) {
     $$lcssa = $9;
     break;
    } else {
     $s$1 = $9;
    }
   }
   $10 = (($i$12) + -1)|0;
   $11 = ($10|0)==(0);
   if ($11) {
    $s$0$lcssa = $$lcssa;
    break;
   } else {
    $i$12 = $10;$s$01 = $$lcssa;
    label = 5;
   }
  }
 }
 return ($s$0$lcssa|0);
}
function ___syscall_ret($r) {
 $r = $r|0;
 var $$0 = 0, $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($r>>>0)>(4294963200);
 if ($0) {
  $1 = (0 - ($r))|0;
  $2 = (___errno_location()|0);
  HEAP32[$2>>2] = $1;
  $$0 = -1;
 } else {
  $$0 = $r;
 }
 return ($$0|0);
}
function _cbrtf($x) {
 $x = +$x;
 var $$0 = +0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = +0, $16 = +0, $17 = +0, $18 = +0, $19 = +0, $2 = 0, $20 = +0, $21 = +0, $22 = +0, $23 = +0, $24 = +0, $25 = +0;
 var $26 = +0, $27 = +0, $28 = +0, $29 = +0, $3 = +0, $30 = +0, $31 = +0, $32 = +0, $33 = +0, $4 = 0, $5 = 0, $6 = +0, $7 = 0, $8 = 0, $9 = 0, $hx$0 = 0, $u$sroa$0$0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (HEAPF32[tempDoublePtr>>2]=$x,HEAP32[tempDoublePtr>>2]|0);
 $1 = $0 & 2147483647;
 $2 = ($1>>>0)>(2139095039);
 do {
  if ($2) {
   $3 = $x + $x;
   $$0 = $3;
  } else {
   $4 = ($1>>>0)<(8388608);
   if ($4) {
    $5 = ($1|0)==(0);
    if ($5) {
     $$0 = $x;
     break;
    }
    $6 = $x * +16777216;
    $7 = (HEAPF32[tempDoublePtr>>2]=$6,HEAP32[tempDoublePtr>>2]|0);
    $8 = $7 & 2147483647;
    $9 = (($8>>>0) / 3)&-1;
    $10 = (($9) + 642849266)|0;
    $hx$0 = $10;$u$sroa$0$0 = $7;
   } else {
    $11 = (($1>>>0) / 3)&-1;
    $12 = (($11) + 709958130)|0;
    $hx$0 = $12;$u$sroa$0$0 = $0;
   }
   $13 = $u$sroa$0$0 & -2147483648;
   $14 = $13 | $hx$0;
   $15 = (HEAP32[tempDoublePtr>>2]=$14,+HEAPF32[tempDoublePtr>>2]);
   $16 = $15;
   $17 = $16 * $16;
   $18 = $16 * $17;
   $19 = $x;
   $20 = $19 + $19;
   $21 = $20 + $18;
   $22 = $16 * $21;
   $23 = $19 + $18;
   $24 = $18 + $23;
   $25 = $22 / $24;
   $26 = $25 * $25;
   $27 = $25 * $26;
   $28 = $20 + $27;
   $29 = $25 * $28;
   $30 = $19 + $27;
   $31 = $27 + $30;
   $32 = $29 / $31;
   $33 = $32;
   $$0 = $33;
  }
 } while(0);
 return (+$$0);
}
function _frexp($x,$e) {
 $x = +$x;
 $e = $e|0;
 var $$0 = +0, $$01 = +0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = +0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = +0, $7 = +0, $8 = 0, $9 = 0, $storemerge = 0, label = 0, sp = 0;
 sp = STACKTOP;
 HEAPF64[tempDoublePtr>>3] = $x;$0 = HEAP32[tempDoublePtr>>2]|0;
 $1 = HEAP32[tempDoublePtr+4>>2]|0;
 $2 = (_bitshift64Lshr(($0|0),($1|0),52)|0);
 $3 = tempRet0;
 $4 = $2 & 2047;
 switch ($4|0) {
 case 0:  {
  $5 = $x != +0;
  if ($5) {
   $6 = $x * +1.8446744073709552E+19;
   $7 = (+_frexp($6,$e));
   $8 = HEAP32[$e>>2]|0;
   $9 = (($8) + -64)|0;
   $$01 = $7;$storemerge = $9;
  } else {
   $$01 = $x;$storemerge = 0;
  }
  HEAP32[$e>>2] = $storemerge;
  $$0 = $$01;
  break;
 }
 case 2047:  {
  $$0 = $x;
  break;
 }
 default: {
  $10 = (($4) + -1022)|0;
  HEAP32[$e>>2] = $10;
  $11 = $1 & -2146435073;
  $12 = $11 | 1071644672;
  HEAP32[tempDoublePtr>>2] = $0;HEAP32[tempDoublePtr+4>>2] = $12;$13 = +HEAPF64[tempDoublePtr>>3];
  $$0 = $13;
 }
 }
 return (+$$0);
}
function _frexpl($x,$e) {
 $x = +$x;
 $e = $e|0;
 var $0 = +0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (+_frexp($x,$e));
 return (+$0);
}
function _round($x) {
 $x = +$x;
 var $$0 = +0, $$x = +0, $$y$0 = +0, $0 = 0, $1 = 0, $10 = +0, $11 = +0, $12 = +0, $13 = 0, $14 = +0, $15 = +0, $16 = 0, $17 = +0, $18 = +0, $19 = +0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0;
 var $7 = +0, $8 = 0, $9 = +0, $y$0 = +0, label = 0, sp = 0;
 sp = STACKTOP;
 HEAPF64[tempDoublePtr>>3] = $x;$0 = HEAP32[tempDoublePtr>>2]|0;
 $1 = HEAP32[tempDoublePtr+4>>2]|0;
 $2 = (_bitshift64Lshr(($0|0),($1|0),52)|0);
 $3 = tempRet0;
 $4 = $2 & 2047;
 $5 = ($4>>>0)>(1074);
 do {
  if ($5) {
   $$0 = $x;
  } else {
   $6 = ($1|0)<(0);
   $7 = -$x;
   $$x = $6 ? $7 : $x;
   $8 = ($4>>>0)<(1022);
   if ($8) {
    $9 = $x * +0;
    $$0 = $9;
    break;
   }
   $10 = $$x + +4503599627370496;
   $11 = $10 + +-4503599627370496;
   $12 = $11 - $$x;
   $13 = $12 > +0.5;
   if ($13) {
    $14 = $$x + $12;
    $15 = $14 + +-1;
    $y$0 = $15;
   } else {
    $16 = !($12 <= +-0.5);
    $17 = $$x + $12;
    if ($16) {
     $y$0 = $17;
    } else {
     $18 = $17 + +1;
     $y$0 = $18;
    }
   }
   $19 = -$y$0;
   $$y$0 = $6 ? $19 : $y$0;
   $$0 = $$y$0;
  }
 } while(0);
 return (+$$0);
}
function _wcrtomb($s,$wc,$st) {
 $s = $s|0;
 $wc = $wc|0;
 $st = $st|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0;
 var $44 = 0, $45 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($s|0)==(0|0);
 do {
  if ($0) {
   $$0 = 1;
  } else {
   $1 = ($wc>>>0)<(128);
   if ($1) {
    $2 = $wc&255;
    HEAP8[$s>>0] = $2;
    $$0 = 1;
    break;
   }
   $3 = ($wc>>>0)<(2048);
   if ($3) {
    $4 = $wc >>> 6;
    $5 = $4 | 192;
    $6 = $5&255;
    $7 = ((($s)) + 1|0);
    HEAP8[$s>>0] = $6;
    $8 = $wc & 63;
    $9 = $8 | 128;
    $10 = $9&255;
    HEAP8[$7>>0] = $10;
    $$0 = 2;
    break;
   }
   $11 = ($wc>>>0)<(55296);
   $12 = $wc & -8192;
   $13 = ($12|0)==(57344);
   $or$cond = $11 | $13;
   if ($or$cond) {
    $14 = $wc >>> 12;
    $15 = $14 | 224;
    $16 = $15&255;
    $17 = ((($s)) + 1|0);
    HEAP8[$s>>0] = $16;
    $18 = $wc >>> 6;
    $19 = $18 & 63;
    $20 = $19 | 128;
    $21 = $20&255;
    $22 = ((($s)) + 2|0);
    HEAP8[$17>>0] = $21;
    $23 = $wc & 63;
    $24 = $23 | 128;
    $25 = $24&255;
    HEAP8[$22>>0] = $25;
    $$0 = 3;
    break;
   }
   $26 = (($wc) + -65536)|0;
   $27 = ($26>>>0)<(1048576);
   if ($27) {
    $28 = $wc >>> 18;
    $29 = $28 | 240;
    $30 = $29&255;
    $31 = ((($s)) + 1|0);
    HEAP8[$s>>0] = $30;
    $32 = $wc >>> 12;
    $33 = $32 & 63;
    $34 = $33 | 128;
    $35 = $34&255;
    $36 = ((($s)) + 2|0);
    HEAP8[$31>>0] = $35;
    $37 = $wc >>> 6;
    $38 = $37 & 63;
    $39 = $38 | 128;
    $40 = $39&255;
    $41 = ((($s)) + 3|0);
    HEAP8[$36>>0] = $40;
    $42 = $wc & 63;
    $43 = $42 | 128;
    $44 = $43&255;
    HEAP8[$41>>0] = $44;
    $$0 = 4;
    break;
   } else {
    $45 = (___errno_location()|0);
    HEAP32[$45>>2] = 84;
    $$0 = -1;
    break;
   }
  }
 } while(0);
 return ($$0|0);
}
function _wctomb($s,$wc) {
 $s = $s|0;
 $wc = $wc|0;
 var $$0 = 0, $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($s|0)==(0|0);
 if ($0) {
  $$0 = 0;
 } else {
  $1 = (_wcrtomb($s,$wc,0)|0);
  $$0 = $1;
 }
 return ($$0|0);
}
function _initstate($seed,$state,$size) {
 $seed = $seed|0;
 $state = $state|0;
 $size = $size|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($size>>>0)<(8);
 if ($0) {
  $$0 = 0;
 } else {
  ___lock((7664|0));
  $1 = HEAP32[7672>>2]|0;
  $2 = $1 << 16;
  $3 = HEAP32[7676>>2]|0;
  $4 = $3 << 8;
  $5 = $4 | $2;
  $6 = HEAP32[7680>>2]|0;
  $7 = $5 | $6;
  $8 = HEAP32[7684>>2]|0;
  $9 = ((($8)) + -4|0);
  HEAP32[$9>>2] = $7;
  $10 = ($size>>>0)<(32);
  do {
   if ($10) {
    HEAP32[7672>>2] = 0;
   } else {
    $11 = ($size>>>0)<(64);
    if ($11) {
     HEAP32[7672>>2] = 7;
     break;
    }
    $12 = ($size>>>0)<(128);
    if ($12) {
     HEAP32[7672>>2] = 15;
     break;
    }
    $13 = ($size>>>0)<(256);
    if ($13) {
     HEAP32[7672>>2] = 31;
     break;
    } else {
     HEAP32[7672>>2] = 63;
     break;
    }
   }
  } while(0);
  $14 = ((($state)) + 4|0);
  HEAP32[7684>>2] = $14;
  ___srandom($seed);
  $15 = HEAP32[7672>>2]|0;
  $16 = $15 << 16;
  $17 = HEAP32[7676>>2]|0;
  $18 = $17 << 8;
  $19 = $18 | $16;
  $20 = HEAP32[7680>>2]|0;
  $21 = $19 | $20;
  $22 = HEAP32[7684>>2]|0;
  $23 = ((($22)) + -4|0);
  HEAP32[$23>>2] = $21;
  ___unlock((7664|0));
  $$0 = $9;
 }
 return ($$0|0);
}
function _random() {
 var $$ = 0, $$1 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $k$0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 ___lock((7664|0));
 $0 = HEAP32[7672>>2]|0;
 $1 = ($0|0)==(0);
 if ($1) {
  $2 = HEAP32[7684>>2]|0;
  $3 = HEAP32[$2>>2]|0;
  $4 = Math_imul($3, 1103515245)|0;
  $5 = (($4) + 12345)|0;
  $6 = $5 & 2147483647;
  HEAP32[$2>>2] = $6;
  $k$0 = $6;
 } else {
  $7 = HEAP32[7680>>2]|0;
  $8 = HEAP32[7684>>2]|0;
  $9 = (($8) + ($7<<2)|0);
  $10 = HEAP32[$9>>2]|0;
  $11 = HEAP32[7676>>2]|0;
  $12 = (($8) + ($11<<2)|0);
  $13 = HEAP32[$12>>2]|0;
  $14 = (($13) + ($10))|0;
  HEAP32[$12>>2] = $14;
  $15 = HEAP32[7676>>2]|0;
  $16 = (($8) + ($15<<2)|0);
  $17 = HEAP32[$16>>2]|0;
  $18 = $17 >>> 1;
  $19 = (($15) + 1)|0;
  $20 = HEAP32[7672>>2]|0;
  $21 = ($19|0)==($20|0);
  $$ = $21 ? 0 : $19;
  HEAP32[7676>>2] = $$;
  $22 = HEAP32[7680>>2]|0;
  $23 = (($22) + 1)|0;
  $24 = ($23|0)==($20|0);
  $$1 = $24 ? 0 : $23;
  HEAP32[7680>>2] = $$1;
  $k$0 = $18;
 }
 ___unlock((7664|0));
 return ($k$0|0);
}
function ___lockfile($f) {
 $f = $f|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 0;
}
function ___unlockfile($f) {
 $f = $f|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function ___stdio_close($f) {
 $f = $f|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $0 = ((($f)) + 60|0);
 $1 = HEAP32[$0>>2]|0;
 HEAP32[$vararg_buffer>>2] = $1;
 $2 = (___syscall6(6,($vararg_buffer|0))|0);
 $3 = (___syscall_ret($2)|0);
 STACKTOP = sp;return ($3|0);
}
function ___stdio_seek($f,$off,$whence) {
 $f = $f|0;
 $off = $off|0;
 $whence = $whence|0;
 var $$pre = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $ret = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, $vararg_ptr3 = 0, $vararg_ptr4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $ret = sp + 20|0;
 $0 = ((($f)) + 60|0);
 $1 = HEAP32[$0>>2]|0;
 HEAP32[$vararg_buffer>>2] = $1;
 $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
 HEAP32[$vararg_ptr1>>2] = 0;
 $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
 HEAP32[$vararg_ptr2>>2] = $off;
 $vararg_ptr3 = ((($vararg_buffer)) + 12|0);
 HEAP32[$vararg_ptr3>>2] = $ret;
 $vararg_ptr4 = ((($vararg_buffer)) + 16|0);
 HEAP32[$vararg_ptr4>>2] = $whence;
 $2 = (___syscall140(140,($vararg_buffer|0))|0);
 $3 = (___syscall_ret($2)|0);
 $4 = ($3|0)<(0);
 if ($4) {
  HEAP32[$ret>>2] = -1;
  $5 = -1;
 } else {
  $$pre = HEAP32[$ret>>2]|0;
  $5 = $$pre;
 }
 STACKTOP = sp;return ($5|0);
}
function ___stdio_write($f,$buf,$len) {
 $f = $f|0;
 $buf = $buf|0;
 $len = $len|0;
 var $$0 = 0, $$phi$trans$insert = 0, $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0;
 var $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0;
 var $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $cnt$0 = 0, $cnt$1 = 0, $iov$0 = 0, $iov$0$lcssa11 = 0, $iov$1 = 0, $iovcnt$0 = 0;
 var $iovcnt$0$lcssa12 = 0, $iovcnt$1 = 0, $iovs = 0, $rem$0 = 0, $vararg_buffer = 0, $vararg_buffer3 = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, $vararg_ptr6 = 0, $vararg_ptr7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer = sp;
 $iovs = sp + 32|0;
 $0 = ((($f)) + 28|0);
 $1 = HEAP32[$0>>2]|0;
 HEAP32[$iovs>>2] = $1;
 $2 = ((($iovs)) + 4|0);
 $3 = ((($f)) + 20|0);
 $4 = HEAP32[$3>>2]|0;
 $5 = $4;
 $6 = (($5) - ($1))|0;
 HEAP32[$2>>2] = $6;
 $7 = ((($iovs)) + 8|0);
 HEAP32[$7>>2] = $buf;
 $8 = ((($iovs)) + 12|0);
 HEAP32[$8>>2] = $len;
 $9 = (($6) + ($len))|0;
 $10 = ((($f)) + 60|0);
 $11 = ((($f)) + 44|0);
 $iov$0 = $iovs;$iovcnt$0 = 2;$rem$0 = $9;
 while(1) {
  $12 = HEAP32[7608>>2]|0;
  $13 = ($12|0)==(0|0);
  if ($13) {
   $17 = HEAP32[$10>>2]|0;
   HEAP32[$vararg_buffer3>>2] = $17;
   $vararg_ptr6 = ((($vararg_buffer3)) + 4|0);
   HEAP32[$vararg_ptr6>>2] = $iov$0;
   $vararg_ptr7 = ((($vararg_buffer3)) + 8|0);
   HEAP32[$vararg_ptr7>>2] = $iovcnt$0;
   $18 = (___syscall146(146,($vararg_buffer3|0))|0);
   $19 = (___syscall_ret($18)|0);
   $cnt$0 = $19;
  } else {
   _pthread_cleanup_push((18|0),($f|0));
   $14 = HEAP32[$10>>2]|0;
   HEAP32[$vararg_buffer>>2] = $14;
   $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
   HEAP32[$vararg_ptr1>>2] = $iov$0;
   $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
   HEAP32[$vararg_ptr2>>2] = $iovcnt$0;
   $15 = (___syscall146(146,($vararg_buffer|0))|0);
   $16 = (___syscall_ret($15)|0);
   _pthread_cleanup_pop(0);
   $cnt$0 = $16;
  }
  $20 = ($rem$0|0)==($cnt$0|0);
  if ($20) {
   label = 6;
   break;
  }
  $27 = ($cnt$0|0)<(0);
  if ($27) {
   $iov$0$lcssa11 = $iov$0;$iovcnt$0$lcssa12 = $iovcnt$0;
   label = 8;
   break;
  }
  $35 = (($rem$0) - ($cnt$0))|0;
  $36 = ((($iov$0)) + 4|0);
  $37 = HEAP32[$36>>2]|0;
  $38 = ($cnt$0>>>0)>($37>>>0);
  if ($38) {
   $39 = HEAP32[$11>>2]|0;
   HEAP32[$0>>2] = $39;
   HEAP32[$3>>2] = $39;
   $40 = (($cnt$0) - ($37))|0;
   $41 = ((($iov$0)) + 8|0);
   $42 = (($iovcnt$0) + -1)|0;
   $$phi$trans$insert = ((($iov$0)) + 12|0);
   $$pre = HEAP32[$$phi$trans$insert>>2]|0;
   $50 = $$pre;$cnt$1 = $40;$iov$1 = $41;$iovcnt$1 = $42;
  } else {
   $43 = ($iovcnt$0|0)==(2);
   if ($43) {
    $44 = HEAP32[$0>>2]|0;
    $45 = (($44) + ($cnt$0)|0);
    HEAP32[$0>>2] = $45;
    $50 = $37;$cnt$1 = $cnt$0;$iov$1 = $iov$0;$iovcnt$1 = 2;
   } else {
    $50 = $37;$cnt$1 = $cnt$0;$iov$1 = $iov$0;$iovcnt$1 = $iovcnt$0;
   }
  }
  $46 = HEAP32[$iov$1>>2]|0;
  $47 = (($46) + ($cnt$1)|0);
  HEAP32[$iov$1>>2] = $47;
  $48 = ((($iov$1)) + 4|0);
  $49 = (($50) - ($cnt$1))|0;
  HEAP32[$48>>2] = $49;
  $iov$0 = $iov$1;$iovcnt$0 = $iovcnt$1;$rem$0 = $35;
 }
 if ((label|0) == 6) {
  $21 = HEAP32[$11>>2]|0;
  $22 = ((($f)) + 48|0);
  $23 = HEAP32[$22>>2]|0;
  $24 = (($21) + ($23)|0);
  $25 = ((($f)) + 16|0);
  HEAP32[$25>>2] = $24;
  $26 = $21;
  HEAP32[$0>>2] = $26;
  HEAP32[$3>>2] = $26;
  $$0 = $len;
 }
 else if ((label|0) == 8) {
  $28 = ((($f)) + 16|0);
  HEAP32[$28>>2] = 0;
  HEAP32[$0>>2] = 0;
  HEAP32[$3>>2] = 0;
  $29 = HEAP32[$f>>2]|0;
  $30 = $29 | 32;
  HEAP32[$f>>2] = $30;
  $31 = ($iovcnt$0$lcssa12|0)==(2);
  if ($31) {
   $$0 = 0;
  } else {
   $32 = ((($iov$0$lcssa11)) + 4|0);
   $33 = HEAP32[$32>>2]|0;
   $34 = (($len) - ($33))|0;
   $$0 = $34;
  }
 }
 STACKTOP = sp;return ($$0|0);
}
function ___stdout_write($f,$buf,$len) {
 $f = $f|0;
 $buf = $buf|0;
 $len = $len|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $tio = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $tio = sp + 12|0;
 $0 = ((($f)) + 36|0);
 HEAP32[$0>>2] = 18;
 $1 = HEAP32[$f>>2]|0;
 $2 = $1 & 64;
 $3 = ($2|0)==(0);
 if ($3) {
  $4 = ((($f)) + 60|0);
  $5 = HEAP32[$4>>2]|0;
  HEAP32[$vararg_buffer>>2] = $5;
  $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
  HEAP32[$vararg_ptr1>>2] = 21505;
  $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
  HEAP32[$vararg_ptr2>>2] = $tio;
  $6 = (___syscall54(54,($vararg_buffer|0))|0);
  $7 = ($6|0)==(0);
  if (!($7)) {
   $8 = ((($f)) + 75|0);
   HEAP8[$8>>0] = -1;
  }
 }
 $9 = (___stdio_write($f,$buf,$len)|0);
 STACKTOP = sp;return ($9|0);
}
function ___towrite($f) {
 $f = $f|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 74|0);
 $1 = HEAP8[$0>>0]|0;
 $2 = $1 << 24 >> 24;
 $3 = (($2) + 255)|0;
 $4 = $3 | $2;
 $5 = $4&255;
 HEAP8[$0>>0] = $5;
 $6 = HEAP32[$f>>2]|0;
 $7 = $6 & 8;
 $8 = ($7|0)==(0);
 if ($8) {
  $10 = ((($f)) + 8|0);
  HEAP32[$10>>2] = 0;
  $11 = ((($f)) + 4|0);
  HEAP32[$11>>2] = 0;
  $12 = ((($f)) + 44|0);
  $13 = HEAP32[$12>>2]|0;
  $14 = ((($f)) + 28|0);
  HEAP32[$14>>2] = $13;
  $15 = ((($f)) + 20|0);
  HEAP32[$15>>2] = $13;
  $16 = $13;
  $17 = ((($f)) + 48|0);
  $18 = HEAP32[$17>>2]|0;
  $19 = (($16) + ($18)|0);
  $20 = ((($f)) + 16|0);
  HEAP32[$20>>2] = $19;
  $$0 = 0;
 } else {
  $9 = $6 | 32;
  HEAP32[$f>>2] = $9;
  $$0 = -1;
 }
 return ($$0|0);
}
function _fprintf($f,$fmt,$varargs) {
 $f = $f|0;
 $fmt = $fmt|0;
 $varargs = $varargs|0;
 var $0 = 0, $ap = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $ap = sp;
 HEAP32[$ap>>2] = $varargs;
 $0 = (_vfprintf($f,$fmt,$ap)|0);
 STACKTOP = sp;return ($0|0);
}
function ___fwritex($s,$l,$f) {
 $s = $s|0;
 $l = $l|0;
 $f = $f|0;
 var $$0 = 0, $$01 = 0, $$02 = 0, $$pre = 0, $$pre6 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0;
 var $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i$0 = 0, $i$0$lcssa10 = 0;
 var $i$1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 16|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)==(0|0);
 if ($2) {
  $3 = (___towrite($f)|0);
  $4 = ($3|0)==(0);
  if ($4) {
   $$pre = HEAP32[$0>>2]|0;
   $8 = $$pre;
   label = 4;
  } else {
   $$0 = 0;
  }
 } else {
  $8 = $1;
  label = 4;
 }
 L4: do {
  if ((label|0) == 4) {
   $5 = ((($f)) + 20|0);
   $6 = HEAP32[$5>>2]|0;
   $7 = $8;
   $9 = $6;
   $10 = (($7) - ($9))|0;
   $11 = ($10>>>0)<($l>>>0);
   if ($11) {
    $12 = ((($f)) + 36|0);
    $13 = HEAP32[$12>>2]|0;
    $14 = (FUNCTION_TABLE_iiii[$13 & 31]($f,$s,$l)|0);
    $$0 = $14;
    break;
   }
   $15 = ((($f)) + 75|0);
   $16 = HEAP8[$15>>0]|0;
   $17 = ($16<<24>>24)>(-1);
   L9: do {
    if ($17) {
     $i$0 = $l;
     while(1) {
      $18 = ($i$0|0)==(0);
      if ($18) {
       $$01 = $l;$$02 = $s;$29 = $6;$i$1 = 0;
       break L9;
      }
      $19 = (($i$0) + -1)|0;
      $20 = (($s) + ($19)|0);
      $21 = HEAP8[$20>>0]|0;
      $22 = ($21<<24>>24)==(10);
      if ($22) {
       $i$0$lcssa10 = $i$0;
       break;
      } else {
       $i$0 = $19;
      }
     }
     $23 = ((($f)) + 36|0);
     $24 = HEAP32[$23>>2]|0;
     $25 = (FUNCTION_TABLE_iiii[$24 & 31]($f,$s,$i$0$lcssa10)|0);
     $26 = ($25>>>0)<($i$0$lcssa10>>>0);
     if ($26) {
      $$0 = $i$0$lcssa10;
      break L4;
     }
     $27 = (($s) + ($i$0$lcssa10)|0);
     $28 = (($l) - ($i$0$lcssa10))|0;
     $$pre6 = HEAP32[$5>>2]|0;
     $$01 = $28;$$02 = $27;$29 = $$pre6;$i$1 = $i$0$lcssa10;
    } else {
     $$01 = $l;$$02 = $s;$29 = $6;$i$1 = 0;
    }
   } while(0);
   _memcpy(($29|0),($$02|0),($$01|0))|0;
   $30 = HEAP32[$5>>2]|0;
   $31 = (($30) + ($$01)|0);
   HEAP32[$5>>2] = $31;
   $32 = (($i$1) + ($$01))|0;
   $$0 = $32;
  }
 } while(0);
 return ($$0|0);
}
function _printf($fmt,$varargs) {
 $fmt = $fmt|0;
 $varargs = $varargs|0;
 var $0 = 0, $1 = 0, $ap = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $ap = sp;
 HEAP32[$ap>>2] = $varargs;
 $0 = HEAP32[7656>>2]|0;
 $1 = (_vfprintf($0,$fmt,$ap)|0);
 STACKTOP = sp;return ($1|0);
}
function _vfprintf($f,$fmt,$ap) {
 $f = $f|0;
 $fmt = $fmt|0;
 $ap = $ap|0;
 var $$ = 0, $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $ap2 = 0, $internal_buf = 0, $nl_arg = 0, $nl_type = 0;
 var $ret$1 = 0, $ret$1$ = 0, $vacopy_currentptr = 0, dest = 0, label = 0, sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 224|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $ap2 = sp + 120|0;
 $nl_type = sp + 80|0;
 $nl_arg = sp;
 $internal_buf = sp + 136|0;
 dest=$nl_type; stop=dest+40|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0));
 $vacopy_currentptr = HEAP32[$ap>>2]|0;
 HEAP32[$ap2>>2] = $vacopy_currentptr;
 $0 = (_printf_core(0,$fmt,$ap2,$nl_arg,$nl_type)|0);
 $1 = ($0|0)<(0);
 if ($1) {
  $$0 = -1;
 } else {
  $2 = ((($f)) + 76|0);
  $3 = HEAP32[$2>>2]|0;
  $4 = ($3|0)>(-1);
  if ($4) {
   $5 = (___lockfile($f)|0);
   $33 = $5;
  } else {
   $33 = 0;
  }
  $6 = HEAP32[$f>>2]|0;
  $7 = $6 & 32;
  $8 = ((($f)) + 74|0);
  $9 = HEAP8[$8>>0]|0;
  $10 = ($9<<24>>24)<(1);
  if ($10) {
   $11 = $6 & -33;
   HEAP32[$f>>2] = $11;
  }
  $12 = ((($f)) + 48|0);
  $13 = HEAP32[$12>>2]|0;
  $14 = ($13|0)==(0);
  if ($14) {
   $16 = ((($f)) + 44|0);
   $17 = HEAP32[$16>>2]|0;
   HEAP32[$16>>2] = $internal_buf;
   $18 = ((($f)) + 28|0);
   HEAP32[$18>>2] = $internal_buf;
   $19 = ((($f)) + 20|0);
   HEAP32[$19>>2] = $internal_buf;
   HEAP32[$12>>2] = 80;
   $20 = ((($internal_buf)) + 80|0);
   $21 = ((($f)) + 16|0);
   HEAP32[$21>>2] = $20;
   $22 = (_printf_core($f,$fmt,$ap2,$nl_arg,$nl_type)|0);
   $23 = ($17|0)==(0|0);
   if ($23) {
    $ret$1 = $22;
   } else {
    $24 = ((($f)) + 36|0);
    $25 = HEAP32[$24>>2]|0;
    (FUNCTION_TABLE_iiii[$25 & 31]($f,0,0)|0);
    $26 = HEAP32[$19>>2]|0;
    $27 = ($26|0)==(0|0);
    $$ = $27 ? -1 : $22;
    HEAP32[$16>>2] = $17;
    HEAP32[$12>>2] = 0;
    HEAP32[$21>>2] = 0;
    HEAP32[$18>>2] = 0;
    HEAP32[$19>>2] = 0;
    $ret$1 = $$;
   }
  } else {
   $15 = (_printf_core($f,$fmt,$ap2,$nl_arg,$nl_type)|0);
   $ret$1 = $15;
  }
  $28 = HEAP32[$f>>2]|0;
  $29 = $28 & 32;
  $30 = ($29|0)==(0);
  $ret$1$ = $30 ? $ret$1 : -1;
  $31 = $28 | $7;
  HEAP32[$f>>2] = $31;
  $32 = ($33|0)==(0);
  if (!($32)) {
   ___unlockfile($f);
  }
  $$0 = $ret$1$;
 }
 STACKTOP = sp;return ($$0|0);
}
function _memchr($src,$c,$n) {
 $src = $src|0;
 $c = $c|0;
 $n = $n|0;
 var $$0$lcssa = 0, $$0$lcssa44 = 0, $$019 = 0, $$1$lcssa = 0, $$110 = 0, $$110$lcssa = 0, $$24 = 0, $$3 = 0, $$lcssa = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0;
 var $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0;
 var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $or$cond18 = 0, $s$0$lcssa = 0, $s$0$lcssa43 = 0, $s$020 = 0, $s$15 = 0, $s$2 = 0, $w$0$lcssa = 0, $w$011 = 0, $w$011$lcssa = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = $c & 255;
 $1 = $src;
 $2 = $1 & 3;
 $3 = ($2|0)!=(0);
 $4 = ($n|0)!=(0);
 $or$cond18 = $4 & $3;
 L1: do {
  if ($or$cond18) {
   $5 = $c&255;
   $$019 = $n;$s$020 = $src;
   while(1) {
    $6 = HEAP8[$s$020>>0]|0;
    $7 = ($6<<24>>24)==($5<<24>>24);
    if ($7) {
     $$0$lcssa44 = $$019;$s$0$lcssa43 = $s$020;
     label = 6;
     break L1;
    }
    $8 = ((($s$020)) + 1|0);
    $9 = (($$019) + -1)|0;
    $10 = $8;
    $11 = $10 & 3;
    $12 = ($11|0)!=(0);
    $13 = ($9|0)!=(0);
    $or$cond = $13 & $12;
    if ($or$cond) {
     $$019 = $9;$s$020 = $8;
    } else {
     $$0$lcssa = $9;$$lcssa = $13;$s$0$lcssa = $8;
     label = 5;
     break;
    }
   }
  } else {
   $$0$lcssa = $n;$$lcssa = $4;$s$0$lcssa = $src;
   label = 5;
  }
 } while(0);
 if ((label|0) == 5) {
  if ($$lcssa) {
   $$0$lcssa44 = $$0$lcssa;$s$0$lcssa43 = $s$0$lcssa;
   label = 6;
  } else {
   $$3 = 0;$s$2 = $s$0$lcssa;
  }
 }
 L8: do {
  if ((label|0) == 6) {
   $14 = HEAP8[$s$0$lcssa43>>0]|0;
   $15 = $c&255;
   $16 = ($14<<24>>24)==($15<<24>>24);
   if ($16) {
    $$3 = $$0$lcssa44;$s$2 = $s$0$lcssa43;
   } else {
    $17 = Math_imul($0, 16843009)|0;
    $18 = ($$0$lcssa44>>>0)>(3);
    L11: do {
     if ($18) {
      $$110 = $$0$lcssa44;$w$011 = $s$0$lcssa43;
      while(1) {
       $19 = HEAP32[$w$011>>2]|0;
       $20 = $19 ^ $17;
       $21 = (($20) + -16843009)|0;
       $22 = $20 & -2139062144;
       $23 = $22 ^ -2139062144;
       $24 = $23 & $21;
       $25 = ($24|0)==(0);
       if (!($25)) {
        $$110$lcssa = $$110;$w$011$lcssa = $w$011;
        break;
       }
       $26 = ((($w$011)) + 4|0);
       $27 = (($$110) + -4)|0;
       $28 = ($27>>>0)>(3);
       if ($28) {
        $$110 = $27;$w$011 = $26;
       } else {
        $$1$lcssa = $27;$w$0$lcssa = $26;
        label = 11;
        break L11;
       }
      }
      $$24 = $$110$lcssa;$s$15 = $w$011$lcssa;
     } else {
      $$1$lcssa = $$0$lcssa44;$w$0$lcssa = $s$0$lcssa43;
      label = 11;
     }
    } while(0);
    if ((label|0) == 11) {
     $29 = ($$1$lcssa|0)==(0);
     if ($29) {
      $$3 = 0;$s$2 = $w$0$lcssa;
      break;
     } else {
      $$24 = $$1$lcssa;$s$15 = $w$0$lcssa;
     }
    }
    while(1) {
     $30 = HEAP8[$s$15>>0]|0;
     $31 = ($30<<24>>24)==($15<<24>>24);
     if ($31) {
      $$3 = $$24;$s$2 = $s$15;
      break L8;
     }
     $32 = ((($s$15)) + 1|0);
     $33 = (($$24) + -1)|0;
     $34 = ($33|0)==(0);
     if ($34) {
      $$3 = 0;$s$2 = $32;
      break;
     } else {
      $$24 = $33;$s$15 = $32;
     }
    }
   }
  }
 } while(0);
 $35 = ($$3|0)!=(0);
 $36 = $35 ? $s$2 : 0;
 return ($36|0);
}
function ___srandom($seed) {
 $seed = $seed|0;
 var $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0;
 var $7 = 0, $8 = 0, $9 = 0, $k$01 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[7672>>2]|0;
 $1 = ($0|0)==(0);
 if ($1) {
  $2 = HEAP32[7684>>2]|0;
  HEAP32[$2>>2] = $seed;
 } else {
  $3 = ($0|0)==(31);
  $4 = ($0|0)==(7);
  $5 = $3 | $4;
  $6 = $5 ? 3 : 1;
  HEAP32[7676>>2] = $6;
  HEAP32[7680>>2] = 0;
  $7 = ($0|0)>(0);
  if ($7) {
   $8 = HEAP32[7684>>2]|0;
   $10 = 0;$9 = $seed;$k$01 = 0;
   while(1) {
    $11 = (___muldi3(($9|0),($10|0),1284865837,1481765933)|0);
    $12 = tempRet0;
    $13 = (_i64Add(($11|0),($12|0),1,0)|0);
    $14 = tempRet0;
    $15 = (($8) + ($k$01<<2)|0);
    HEAP32[$15>>2] = $14;
    $16 = (($k$01) + 1)|0;
    $17 = HEAP32[7672>>2]|0;
    $18 = ($16|0)<($17|0);
    if ($18) {
     $10 = $14;$9 = $13;$k$01 = $16;
    } else {
     $20 = $8;
     break;
    }
   }
  } else {
   $$pre = HEAP32[7684>>2]|0;
   $20 = $$pre;
  }
  $19 = HEAP32[$20>>2]|0;
  $21 = $19 | 1;
  HEAP32[$20>>2] = $21;
 }
 return;
}
function _cleanup392($p) {
 $p = $p|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($p)) + 68|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)==(0);
 if ($2) {
  ___unlockfile($p);
 }
 return;
}
function _printf_core($f,$fmt,$ap,$nl_arg,$nl_type) {
 $f = $f|0;
 $fmt = $fmt|0;
 $ap = $ap|0;
 $nl_arg = $nl_arg|0;
 $nl_type = $nl_type|0;
 var $$ = 0, $$$i = 0, $$0 = 0, $$0$i = 0, $$0$lcssa$i = 0, $$012$i = 0, $$013$i = 0, $$03$i33 = 0, $$07$i = +0, $$1$i = +0, $$114$i = 0, $$2$i = +0, $$20$i = +0, $$21$i = 0, $$210$$22$i = 0, $$210$$24$i = 0, $$210$i = 0, $$23$i = 0, $$3$i = +0, $$31$i = 0;
 var $$311$i = 0, $$4$i = +0, $$412$lcssa$i = 0, $$41276$i = 0, $$5$lcssa$i = 0, $$51 = 0, $$587$i = 0, $$a$3$i = 0, $$a$3185$i = 0, $$a$3186$i = 0, $$fl$4 = 0, $$l10n$0 = 0, $$lcssa = 0, $$lcssa159$i = 0, $$lcssa318 = 0, $$lcssa323 = 0, $$lcssa324 = 0, $$lcssa325 = 0, $$lcssa326 = 0, $$lcssa327 = 0;
 var $$lcssa329 = 0, $$lcssa339 = 0, $$lcssa342 = +0, $$lcssa344 = 0, $$neg52$i = 0, $$neg53$i = 0, $$p$$i = 0, $$p$0 = 0, $$p$5 = 0, $$p$i = 0, $$pn$i = 0, $$pr$i = 0, $$pr47$i = 0, $$pre = 0, $$pre$i = 0, $$pre$phi184$iZ2D = 0, $$pre179$i = 0, $$pre182$i = 0, $$pre183$i = 0, $$pre193 = 0;
 var $$sum$i = 0, $$sum15$i = 0, $$sum16$i = 0, $$z$3$i = 0, $$z$4$i = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0;
 var $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0;
 var $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0;
 var $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0;
 var $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0;
 var $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0;
 var $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0;
 var $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0;
 var $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0;
 var $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0;
 var $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0;
 var $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0;
 var $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0;
 var $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0;
 var $346 = 0, $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = +0, $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = +0;
 var $364 = 0, $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0, $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0;
 var $382 = 0, $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0, $390 = 0, $391 = +0, $392 = +0, $393 = 0, $394 = 0, $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0;
 var $40 = 0, $400 = 0, $401 = 0, $402 = 0, $403 = 0, $404 = 0, $405 = 0, $406 = 0, $407 = +0, $408 = 0, $409 = 0, $41 = 0, $410 = 0, $411 = +0, $412 = +0, $413 = +0, $414 = +0, $415 = +0, $416 = +0, $417 = 0;
 var $418 = 0, $419 = 0, $42 = 0, $420 = 0, $421 = 0, $422 = 0, $423 = 0, $424 = 0, $425 = 0, $426 = 0, $427 = 0, $428 = 0, $429 = 0, $43 = 0, $430 = 0, $431 = 0, $432 = 0, $433 = 0, $434 = 0, $435 = 0;
 var $436 = 0, $437 = 0, $438 = 0, $439 = 0, $44 = 0, $440 = 0, $441 = 0, $442 = +0, $443 = +0, $444 = +0, $445 = 0, $446 = 0, $447 = 0, $448 = 0, $449 = 0, $45 = 0, $450 = 0, $451 = 0, $452 = 0, $453 = 0;
 var $454 = 0, $455 = 0, $456 = 0, $457 = 0, $458 = 0, $459 = 0, $46 = 0, $460 = 0, $461 = 0, $462 = 0, $463 = 0, $464 = 0, $465 = 0, $466 = 0, $467 = 0, $468 = 0, $469 = 0, $47 = 0, $470 = 0, $471 = 0;
 var $472 = 0, $473 = 0, $474 = 0, $475 = 0, $476 = 0, $477 = +0, $478 = 0, $479 = 0, $48 = 0, $480 = 0, $481 = 0, $482 = 0, $483 = 0, $484 = 0, $485 = +0, $486 = +0, $487 = +0, $488 = 0, $489 = 0, $49 = 0;
 var $490 = 0, $491 = 0, $492 = 0, $493 = 0, $494 = 0, $495 = 0, $496 = 0, $497 = 0, $498 = 0, $499 = 0, $5 = 0, $50 = 0, $500 = 0, $501 = 0, $502 = 0, $503 = 0, $504 = 0, $505 = 0, $506 = 0, $507 = 0;
 var $508 = 0, $509 = 0, $51 = 0, $510 = 0, $511 = 0, $512 = 0, $513 = 0, $514 = 0, $515 = 0, $516 = 0, $517 = 0, $518 = 0, $519 = 0, $52 = 0, $520 = 0, $521 = 0, $522 = 0, $523 = 0, $524 = 0, $525 = 0;
 var $526 = 0, $527 = 0, $528 = 0, $529 = 0, $53 = 0, $530 = 0, $531 = 0, $532 = 0, $533 = 0, $534 = 0, $535 = 0, $536 = 0, $537 = 0, $538 = 0, $539 = 0, $54 = 0, $540 = 0, $541 = 0, $542 = 0, $543 = 0;
 var $544 = 0, $545 = 0, $546 = 0, $547 = 0, $548 = 0, $549 = 0, $55 = 0, $550 = 0, $551 = 0, $552 = 0, $553 = 0, $554 = 0, $555 = 0, $556 = 0, $557 = 0, $558 = 0, $559 = 0, $56 = 0, $560 = 0, $561 = 0;
 var $562 = 0, $563 = 0, $564 = 0, $565 = 0, $566 = 0, $567 = 0, $568 = 0, $569 = 0, $57 = 0, $570 = 0, $571 = 0, $572 = 0, $573 = 0, $574 = 0, $575 = 0, $576 = 0, $577 = 0, $578 = 0, $579 = 0, $58 = 0;
 var $580 = 0, $581 = 0, $582 = 0, $583 = 0, $584 = 0, $585 = 0, $586 = 0, $587 = 0, $588 = 0, $589 = 0, $59 = 0, $590 = 0, $591 = 0, $592 = 0, $593 = 0, $594 = 0, $595 = 0, $596 = +0, $597 = +0, $598 = 0;
 var $599 = +0, $6 = 0, $60 = 0, $600 = 0, $601 = 0, $602 = 0, $603 = 0, $604 = 0, $605 = 0, $606 = 0, $607 = 0, $608 = 0, $609 = 0, $61 = 0, $610 = 0, $611 = 0, $612 = 0, $613 = 0, $614 = 0, $615 = 0;
 var $616 = 0, $617 = 0, $618 = 0, $619 = 0, $62 = 0, $620 = 0, $621 = 0, $622 = 0, $623 = 0, $624 = 0, $625 = 0, $626 = 0, $627 = 0, $628 = 0, $629 = 0, $63 = 0, $630 = 0, $631 = 0, $632 = 0, $633 = 0;
 var $634 = 0, $635 = 0, $636 = 0, $637 = 0, $638 = 0, $639 = 0, $64 = 0, $640 = 0, $641 = 0, $642 = 0, $643 = 0, $644 = 0, $645 = 0, $646 = 0, $647 = 0, $648 = 0, $649 = 0, $65 = 0, $650 = 0, $651 = 0;
 var $652 = 0, $653 = 0, $654 = 0, $655 = 0, $656 = 0, $657 = 0, $658 = 0, $659 = 0, $66 = 0, $660 = 0, $661 = 0, $662 = 0, $663 = 0, $664 = 0, $665 = 0, $666 = 0, $667 = 0, $668 = 0, $669 = 0, $67 = 0;
 var $670 = 0, $671 = 0, $672 = 0, $673 = 0, $674 = 0, $675 = 0, $676 = 0, $677 = 0, $678 = 0, $679 = 0, $68 = 0, $680 = 0, $681 = 0, $682 = 0, $683 = 0, $684 = 0, $685 = 0, $686 = 0, $687 = 0, $688 = 0;
 var $689 = 0, $69 = 0, $690 = 0, $691 = 0, $692 = 0, $693 = 0, $694 = 0, $695 = 0, $696 = 0, $697 = 0, $698 = 0, $699 = 0, $7 = 0, $70 = 0, $700 = 0, $701 = 0, $702 = 0, $703 = 0, $704 = 0, $705 = 0;
 var $706 = 0, $707 = 0, $708 = 0, $709 = 0, $71 = 0, $710 = 0, $711 = 0, $712 = 0, $713 = 0, $714 = 0, $715 = 0, $716 = 0, $717 = 0, $718 = 0, $719 = 0, $72 = 0, $720 = 0, $721 = 0, $722 = 0, $723 = 0;
 var $724 = 0, $725 = 0, $726 = 0, $727 = 0, $728 = 0, $729 = 0, $73 = 0, $730 = 0, $731 = 0, $732 = 0, $733 = 0, $734 = 0, $735 = 0, $736 = 0, $737 = 0, $738 = 0, $739 = 0, $74 = 0, $740 = 0, $741 = 0;
 var $742 = 0, $743 = 0, $744 = 0, $745 = 0, $746 = 0, $747 = 0, $748 = 0, $749 = 0, $75 = 0, $750 = 0, $751 = 0, $752 = 0, $753 = 0, $754 = 0, $755 = 0, $756 = 0, $757 = 0, $758 = 0, $759 = 0, $76 = 0;
 var $760 = 0, $761 = 0, $762 = 0, $763 = 0, $764 = 0, $765 = 0, $766 = 0, $767 = 0, $768 = 0, $769 = 0, $77 = 0, $770 = 0, $771 = 0, $772 = 0, $773 = 0, $774 = 0, $775 = 0, $776 = 0, $777 = 0, $778 = 0;
 var $779 = 0, $78 = 0, $780 = 0, $781 = 0, $782 = 0, $783 = 0, $784 = 0, $785 = 0, $786 = 0, $787 = 0, $788 = 0, $789 = 0, $79 = 0, $790 = 0, $791 = 0, $792 = 0, $793 = 0, $794 = 0, $795 = 0, $796 = 0;
 var $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0;
 var $98 = 0, $99 = 0, $a$0 = 0, $a$1 = 0, $a$1$lcssa$i = 0, $a$1147$i = 0, $a$2 = 0, $a$2$ph$i = 0, $a$3$lcssa$i = 0, $a$3134$i = 0, $a$5$lcssa$i = 0, $a$5109$i = 0, $a$6$i = 0, $a$7$i = 0, $a$8$ph$i = 0, $arg = 0, $arglist_current = 0, $arglist_current2 = 0, $arglist_next = 0, $arglist_next3 = 0;
 var $argpos$0 = 0, $big$i = 0, $buf = 0, $buf$i = 0, $carry$0140$i = 0, $carry3$0128$i = 0, $cnt$0 = 0, $cnt$1 = 0, $cnt$1$lcssa = 0, $d$0$i = 0, $d$0139$i = 0, $d$0141$i = 0, $d$1127$i = 0, $d$2$lcssa$i = 0, $d$2108$i = 0, $d$3$i = 0, $d$482$i = 0, $d$575$i = 0, $d$686$i = 0, $e$0123$i = 0;
 var $e$1$i = 0, $e$2104$i = 0, $e$3$i = 0, $e$4$ph$i = 0, $e2$i = 0, $ebuf0$i = 0, $estr$0$i = 0, $estr$1$lcssa$i = 0, $estr$193$i = 0, $estr$2$i = 0, $exitcond$i = 0, $expanded = 0, $expanded10 = 0, $expanded11 = 0, $expanded13 = 0, $expanded14 = 0, $expanded15 = 0, $expanded4 = 0, $expanded6 = 0, $expanded7 = 0;
 var $expanded8 = 0, $fl$0109 = 0, $fl$062 = 0, $fl$1 = 0, $fl$1$ = 0, $fl$3 = 0, $fl$4 = 0, $fl$6 = 0, $fmt39$lcssa = 0, $fmt39101 = 0, $fmt40 = 0, $fmt41 = 0, $fmt42 = 0, $fmt44 = 0, $fmt44$lcssa321 = 0, $fmt45 = 0, $i$0$lcssa = 0, $i$0$lcssa200 = 0, $i$0114 = 0, $i$0122$i = 0;
 var $i$03$i = 0, $i$03$i25 = 0, $i$1$lcssa$i = 0, $i$1116$i = 0, $i$1125 = 0, $i$2100 = 0, $i$2100$lcssa = 0, $i$2103$i = 0, $i$398 = 0, $i$399$i = 0, $isdigit = 0, $isdigit$i = 0, $isdigit$i27 = 0, $isdigit10 = 0, $isdigit12 = 0, $isdigit2$i = 0, $isdigit2$i23 = 0, $isdigittmp = 0, $isdigittmp$ = 0, $isdigittmp$i = 0;
 var $isdigittmp$i26 = 0, $isdigittmp1$i = 0, $isdigittmp1$i22 = 0, $isdigittmp11 = 0, $isdigittmp4$i = 0, $isdigittmp4$i24 = 0, $isdigittmp9 = 0, $j$0$i = 0, $j$0115$i = 0, $j$0117$i = 0, $j$1100$i = 0, $j$2$i = 0, $l$0 = 0, $l$0$i = 0, $l$1$i = 0, $l$1113 = 0, $l$2 = 0, $l10n$0 = 0, $l10n$0$lcssa = 0, $l10n$0$phi = 0;
 var $l10n$1 = 0, $l10n$2 = 0, $l10n$3 = 0, $mb = 0, $notlhs$i = 0, $notrhs$i = 0, $or$cond = 0, $or$cond$i = 0, $or$cond15 = 0, $or$cond17 = 0, $or$cond20 = 0, $or$cond240 = 0, $or$cond29$i = 0, $or$cond3$not$i = 0, $or$cond6$i = 0, $p$0 = 0, $p$1 = 0, $p$2 = 0, $p$2$ = 0, $p$3 = 0;
 var $p$4198 = 0, $p$5 = 0, $pl$0 = 0, $pl$0$i = 0, $pl$1 = 0, $pl$1$i = 0, $pl$2 = 0, $prefix$0 = 0, $prefix$0$$i = 0, $prefix$0$i = 0, $prefix$1 = 0, $prefix$2 = 0, $r$0$a$8$i = 0, $re$169$i = 0, $round$068$i = +0, $round6$1$i = +0, $s$0$i = 0, $s$1$i = 0, $s$1$i$lcssa = 0, $s1$0$i = 0;
 var $s7$079$i = 0, $s7$1$i = 0, $s8$0$lcssa$i = 0, $s8$070$i = 0, $s9$0$i = 0, $s9$183$i = 0, $s9$2$i = 0, $small$0$i = +0, $small$1$i = +0, $st$0 = 0, $st$0$lcssa322 = 0, $storemerge = 0, $storemerge13 = 0, $storemerge8108 = 0, $storemerge860 = 0, $sum = 0, $t$0 = 0, $t$1 = 0, $w$$i = 0, $w$0 = 0;
 var $w$1 = 0, $w$2 = 0, $w$30$i = 0, $wc = 0, $ws$0115 = 0, $ws$1126 = 0, $z$0$i = 0, $z$0$lcssa = 0, $z$0102 = 0, $z$1 = 0, $z$1$lcssa$i = 0, $z$1146$i = 0, $z$2 = 0, $z$2$i = 0, $z$2$i$lcssa = 0, $z$3$lcssa$i = 0, $z$3133$i = 0, $z$4$i = 0, $z$6$$i = 0, $z$6$i = 0;
 var $z$6$i$lcssa = 0, $z$6$ph$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 624|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $big$i = sp + 24|0;
 $e2$i = sp + 16|0;
 $buf$i = sp + 588|0;
 $ebuf0$i = sp + 576|0;
 $arg = sp;
 $buf = sp + 536|0;
 $wc = sp + 8|0;
 $mb = sp + 528|0;
 $0 = ($f|0)!=(0|0);
 $1 = ((($buf)) + 40|0);
 $2 = $1;
 $3 = ((($buf)) + 39|0);
 $4 = ((($wc)) + 4|0);
 $5 = ((($ebuf0$i)) + 12|0);
 $6 = ((($ebuf0$i)) + 11|0);
 $7 = $buf$i;
 $8 = $5;
 $9 = (($8) - ($7))|0;
 $10 = (-2 - ($7))|0;
 $11 = (($8) + 2)|0;
 $12 = ((($big$i)) + 288|0);
 $13 = ((($buf$i)) + 9|0);
 $14 = $13;
 $15 = ((($buf$i)) + 8|0);
 $cnt$0 = 0;$fmt41 = $fmt;$l$0 = 0;$l10n$0 = 0;
 L1: while(1) {
  $16 = ($cnt$0|0)>(-1);
  do {
   if ($16) {
    $17 = (2147483647 - ($cnt$0))|0;
    $18 = ($l$0|0)>($17|0);
    if ($18) {
     $19 = (___errno_location()|0);
     HEAP32[$19>>2] = 75;
     $cnt$1 = -1;
     break;
    } else {
     $20 = (($l$0) + ($cnt$0))|0;
     $cnt$1 = $20;
     break;
    }
   } else {
    $cnt$1 = $cnt$0;
   }
  } while(0);
  $21 = HEAP8[$fmt41>>0]|0;
  $22 = ($21<<24>>24)==(0);
  if ($22) {
   $cnt$1$lcssa = $cnt$1;$l10n$0$lcssa = $l10n$0;
   label = 245;
   break;
  } else {
   $23 = $21;$fmt40 = $fmt41;
  }
  L9: while(1) {
   switch ($23<<24>>24) {
   case 37:  {
    $fmt39101 = $fmt40;$z$0102 = $fmt40;
    label = 9;
    break L9;
    break;
   }
   case 0:  {
    $fmt39$lcssa = $fmt40;$z$0$lcssa = $fmt40;
    break L9;
    break;
   }
   default: {
   }
   }
   $24 = ((($fmt40)) + 1|0);
   $$pre = HEAP8[$24>>0]|0;
   $23 = $$pre;$fmt40 = $24;
  }
  L12: do {
   if ((label|0) == 9) {
    while(1) {
     label = 0;
     $25 = ((($fmt39101)) + 1|0);
     $26 = HEAP8[$25>>0]|0;
     $27 = ($26<<24>>24)==(37);
     if (!($27)) {
      $fmt39$lcssa = $fmt39101;$z$0$lcssa = $z$0102;
      break L12;
     }
     $28 = ((($z$0102)) + 1|0);
     $29 = ((($fmt39101)) + 2|0);
     $30 = HEAP8[$29>>0]|0;
     $31 = ($30<<24>>24)==(37);
     if ($31) {
      $fmt39101 = $29;$z$0102 = $28;
      label = 9;
     } else {
      $fmt39$lcssa = $29;$z$0$lcssa = $28;
      break;
     }
    }
   }
  } while(0);
  $32 = $z$0$lcssa;
  $33 = $fmt41;
  $34 = (($32) - ($33))|0;
  if ($0) {
   $35 = HEAP32[$f>>2]|0;
   $36 = $35 & 32;
   $37 = ($36|0)==(0);
   if ($37) {
    (___fwritex($fmt41,$34,$f)|0);
   }
  }
  $38 = ($z$0$lcssa|0)==($fmt41|0);
  if (!($38)) {
   $l10n$0$phi = $l10n$0;$cnt$0 = $cnt$1;$fmt41 = $fmt39$lcssa;$l$0 = $34;$l10n$0 = $l10n$0$phi;
   continue;
  }
  $39 = ((($fmt39$lcssa)) + 1|0);
  $40 = HEAP8[$39>>0]|0;
  $41 = $40 << 24 >> 24;
  $isdigittmp = (($41) + -48)|0;
  $isdigit = ($isdigittmp>>>0)<(10);
  if ($isdigit) {
   $42 = ((($fmt39$lcssa)) + 2|0);
   $43 = HEAP8[$42>>0]|0;
   $44 = ($43<<24>>24)==(36);
   $45 = ((($fmt39$lcssa)) + 3|0);
   $$51 = $44 ? $45 : $39;
   $$l10n$0 = $44 ? 1 : $l10n$0;
   $isdigittmp$ = $44 ? $isdigittmp : -1;
   $$pre193 = HEAP8[$$51>>0]|0;
   $47 = $$pre193;$argpos$0 = $isdigittmp$;$l10n$1 = $$l10n$0;$storemerge = $$51;
  } else {
   $47 = $40;$argpos$0 = -1;$l10n$1 = $l10n$0;$storemerge = $39;
  }
  $46 = $47 << 24 >> 24;
  $48 = $46 & -32;
  $49 = ($48|0)==(32);
  L25: do {
   if ($49) {
    $51 = $46;$56 = $47;$fl$0109 = 0;$storemerge8108 = $storemerge;
    while(1) {
     $50 = (($51) + -32)|0;
     $52 = 1 << $50;
     $53 = $52 & 75913;
     $54 = ($53|0)==(0);
     if ($54) {
      $66 = $56;$fl$062 = $fl$0109;$storemerge860 = $storemerge8108;
      break L25;
     }
     $55 = $56 << 24 >> 24;
     $57 = (($55) + -32)|0;
     $58 = 1 << $57;
     $59 = $58 | $fl$0109;
     $60 = ((($storemerge8108)) + 1|0);
     $61 = HEAP8[$60>>0]|0;
     $62 = $61 << 24 >> 24;
     $63 = $62 & -32;
     $64 = ($63|0)==(32);
     if ($64) {
      $51 = $62;$56 = $61;$fl$0109 = $59;$storemerge8108 = $60;
     } else {
      $66 = $61;$fl$062 = $59;$storemerge860 = $60;
      break;
     }
    }
   } else {
    $66 = $47;$fl$062 = 0;$storemerge860 = $storemerge;
   }
  } while(0);
  $65 = ($66<<24>>24)==(42);
  do {
   if ($65) {
    $67 = ((($storemerge860)) + 1|0);
    $68 = HEAP8[$67>>0]|0;
    $69 = $68 << 24 >> 24;
    $isdigittmp11 = (($69) + -48)|0;
    $isdigit12 = ($isdigittmp11>>>0)<(10);
    if ($isdigit12) {
     $70 = ((($storemerge860)) + 2|0);
     $71 = HEAP8[$70>>0]|0;
     $72 = ($71<<24>>24)==(36);
     if ($72) {
      $73 = (($nl_type) + ($isdigittmp11<<2)|0);
      HEAP32[$73>>2] = 10;
      $74 = HEAP8[$67>>0]|0;
      $75 = $74 << 24 >> 24;
      $76 = (($75) + -48)|0;
      $77 = (($nl_arg) + ($76<<3)|0);
      $78 = $77;
      $79 = $78;
      $80 = HEAP32[$79>>2]|0;
      $81 = (($78) + 4)|0;
      $82 = $81;
      $83 = HEAP32[$82>>2]|0;
      $84 = ((($storemerge860)) + 3|0);
      $l10n$2 = 1;$storemerge13 = $84;$w$0 = $80;
     } else {
      label = 24;
     }
    } else {
     label = 24;
    }
    if ((label|0) == 24) {
     label = 0;
     $85 = ($l10n$1|0)==(0);
     if (!($85)) {
      $$0 = -1;
      break L1;
     }
     if (!($0)) {
      $fl$1 = $fl$062;$fmt42 = $67;$l10n$3 = 0;$w$1 = 0;
      break;
     }
     $arglist_current = HEAP32[$ap>>2]|0;
     $86 = $arglist_current;
     $87 = ((0) + 4|0);
     $expanded4 = $87;
     $expanded = (($expanded4) - 1)|0;
     $88 = (($86) + ($expanded))|0;
     $89 = ((0) + 4|0);
     $expanded8 = $89;
     $expanded7 = (($expanded8) - 1)|0;
     $expanded6 = $expanded7 ^ -1;
     $90 = $88 & $expanded6;
     $91 = $90;
     $92 = HEAP32[$91>>2]|0;
     $arglist_next = ((($91)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next;
     $l10n$2 = 0;$storemerge13 = $67;$w$0 = $92;
    }
    $93 = ($w$0|0)<(0);
    if ($93) {
     $94 = $fl$062 | 8192;
     $95 = (0 - ($w$0))|0;
     $fl$1 = $94;$fmt42 = $storemerge13;$l10n$3 = $l10n$2;$w$1 = $95;
    } else {
     $fl$1 = $fl$062;$fmt42 = $storemerge13;$l10n$3 = $l10n$2;$w$1 = $w$0;
    }
   } else {
    $96 = $66 << 24 >> 24;
    $isdigittmp1$i = (($96) + -48)|0;
    $isdigit2$i = ($isdigittmp1$i>>>0)<(10);
    if ($isdigit2$i) {
     $100 = $storemerge860;$i$03$i = 0;$isdigittmp4$i = $isdigittmp1$i;
     while(1) {
      $97 = ($i$03$i*10)|0;
      $98 = (($97) + ($isdigittmp4$i))|0;
      $99 = ((($100)) + 1|0);
      $101 = HEAP8[$99>>0]|0;
      $102 = $101 << 24 >> 24;
      $isdigittmp$i = (($102) + -48)|0;
      $isdigit$i = ($isdigittmp$i>>>0)<(10);
      if ($isdigit$i) {
       $100 = $99;$i$03$i = $98;$isdigittmp4$i = $isdigittmp$i;
      } else {
       $$lcssa = $98;$$lcssa318 = $99;
       break;
      }
     }
     $103 = ($$lcssa|0)<(0);
     if ($103) {
      $$0 = -1;
      break L1;
     } else {
      $fl$1 = $fl$062;$fmt42 = $$lcssa318;$l10n$3 = $l10n$1;$w$1 = $$lcssa;
     }
    } else {
     $fl$1 = $fl$062;$fmt42 = $storemerge860;$l10n$3 = $l10n$1;$w$1 = 0;
    }
   }
  } while(0);
  $104 = HEAP8[$fmt42>>0]|0;
  $105 = ($104<<24>>24)==(46);
  L46: do {
   if ($105) {
    $106 = ((($fmt42)) + 1|0);
    $107 = HEAP8[$106>>0]|0;
    $108 = ($107<<24>>24)==(42);
    if (!($108)) {
     $135 = $107 << 24 >> 24;
     $isdigittmp1$i22 = (($135) + -48)|0;
     $isdigit2$i23 = ($isdigittmp1$i22>>>0)<(10);
     if ($isdigit2$i23) {
      $139 = $106;$i$03$i25 = 0;$isdigittmp4$i24 = $isdigittmp1$i22;
     } else {
      $fmt45 = $106;$p$0 = 0;
      break;
     }
     while(1) {
      $136 = ($i$03$i25*10)|0;
      $137 = (($136) + ($isdigittmp4$i24))|0;
      $138 = ((($139)) + 1|0);
      $140 = HEAP8[$138>>0]|0;
      $141 = $140 << 24 >> 24;
      $isdigittmp$i26 = (($141) + -48)|0;
      $isdigit$i27 = ($isdigittmp$i26>>>0)<(10);
      if ($isdigit$i27) {
       $139 = $138;$i$03$i25 = $137;$isdigittmp4$i24 = $isdigittmp$i26;
      } else {
       $fmt45 = $138;$p$0 = $137;
       break L46;
      }
     }
    }
    $109 = ((($fmt42)) + 2|0);
    $110 = HEAP8[$109>>0]|0;
    $111 = $110 << 24 >> 24;
    $isdigittmp9 = (($111) + -48)|0;
    $isdigit10 = ($isdigittmp9>>>0)<(10);
    if ($isdigit10) {
     $112 = ((($fmt42)) + 3|0);
     $113 = HEAP8[$112>>0]|0;
     $114 = ($113<<24>>24)==(36);
     if ($114) {
      $115 = (($nl_type) + ($isdigittmp9<<2)|0);
      HEAP32[$115>>2] = 10;
      $116 = HEAP8[$109>>0]|0;
      $117 = $116 << 24 >> 24;
      $118 = (($117) + -48)|0;
      $119 = (($nl_arg) + ($118<<3)|0);
      $120 = $119;
      $121 = $120;
      $122 = HEAP32[$121>>2]|0;
      $123 = (($120) + 4)|0;
      $124 = $123;
      $125 = HEAP32[$124>>2]|0;
      $126 = ((($fmt42)) + 4|0);
      $fmt45 = $126;$p$0 = $122;
      break;
     }
    }
    $127 = ($l10n$3|0)==(0);
    if (!($127)) {
     $$0 = -1;
     break L1;
    }
    if ($0) {
     $arglist_current2 = HEAP32[$ap>>2]|0;
     $128 = $arglist_current2;
     $129 = ((0) + 4|0);
     $expanded11 = $129;
     $expanded10 = (($expanded11) - 1)|0;
     $130 = (($128) + ($expanded10))|0;
     $131 = ((0) + 4|0);
     $expanded15 = $131;
     $expanded14 = (($expanded15) - 1)|0;
     $expanded13 = $expanded14 ^ -1;
     $132 = $130 & $expanded13;
     $133 = $132;
     $134 = HEAP32[$133>>2]|0;
     $arglist_next3 = ((($133)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next3;
     $fmt45 = $109;$p$0 = $134;
    } else {
     $fmt45 = $109;$p$0 = 0;
    }
   } else {
    $fmt45 = $fmt42;$p$0 = -1;
   }
  } while(0);
  $fmt44 = $fmt45;$st$0 = 0;
  while(1) {
   $142 = HEAP8[$fmt44>>0]|0;
   $143 = $142 << 24 >> 24;
   $144 = (($143) + -65)|0;
   $145 = ($144>>>0)>(57);
   if ($145) {
    $$0 = -1;
    break L1;
   }
   $146 = ((($fmt44)) + 1|0);
   $147 = ((12549 + (($st$0*58)|0)|0) + ($144)|0);
   $148 = HEAP8[$147>>0]|0;
   $149 = $148&255;
   $150 = (($149) + -1)|0;
   $151 = ($150>>>0)<(8);
   if ($151) {
    $fmt44 = $146;$st$0 = $149;
   } else {
    $$lcssa323 = $146;$$lcssa324 = $148;$$lcssa325 = $149;$fmt44$lcssa321 = $fmt44;$st$0$lcssa322 = $st$0;
    break;
   }
  }
  $152 = ($$lcssa324<<24>>24)==(0);
  if ($152) {
   $$0 = -1;
   break;
  }
  $153 = ($$lcssa324<<24>>24)==(19);
  $154 = ($argpos$0|0)>(-1);
  do {
   if ($153) {
    if ($154) {
     $$0 = -1;
     break L1;
    } else {
     label = 52;
    }
   } else {
    if ($154) {
     $155 = (($nl_type) + ($argpos$0<<2)|0);
     HEAP32[$155>>2] = $$lcssa325;
     $156 = (($nl_arg) + ($argpos$0<<3)|0);
     $157 = $156;
     $158 = $157;
     $159 = HEAP32[$158>>2]|0;
     $160 = (($157) + 4)|0;
     $161 = $160;
     $162 = HEAP32[$161>>2]|0;
     $163 = $arg;
     $164 = $163;
     HEAP32[$164>>2] = $159;
     $165 = (($163) + 4)|0;
     $166 = $165;
     HEAP32[$166>>2] = $162;
     label = 52;
     break;
    }
    if (!($0)) {
     $$0 = 0;
     break L1;
    }
    _pop_arg($arg,$$lcssa325,$ap);
   }
  } while(0);
  if ((label|0) == 52) {
   label = 0;
   if (!($0)) {
    $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
    continue;
   }
  }
  $167 = HEAP8[$fmt44$lcssa321>>0]|0;
  $168 = $167 << 24 >> 24;
  $169 = ($st$0$lcssa322|0)!=(0);
  $170 = $168 & 15;
  $171 = ($170|0)==(3);
  $or$cond15 = $169 & $171;
  $172 = $168 & -33;
  $t$0 = $or$cond15 ? $172 : $168;
  $173 = $fl$1 & 8192;
  $174 = ($173|0)==(0);
  $175 = $fl$1 & -65537;
  $fl$1$ = $174 ? $fl$1 : $175;
  L75: do {
   switch ($t$0|0) {
   case 110:  {
    switch ($st$0$lcssa322|0) {
    case 0:  {
     $182 = HEAP32[$arg>>2]|0;
     HEAP32[$182>>2] = $cnt$1;
     $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
     continue L1;
     break;
    }
    case 1:  {
     $183 = HEAP32[$arg>>2]|0;
     HEAP32[$183>>2] = $cnt$1;
     $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
     continue L1;
     break;
    }
    case 2:  {
     $184 = ($cnt$1|0)<(0);
     $185 = $184 << 31 >> 31;
     $186 = HEAP32[$arg>>2]|0;
     $187 = $186;
     $188 = $187;
     HEAP32[$188>>2] = $cnt$1;
     $189 = (($187) + 4)|0;
     $190 = $189;
     HEAP32[$190>>2] = $185;
     $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
     continue L1;
     break;
    }
    case 3:  {
     $191 = $cnt$1&65535;
     $192 = HEAP32[$arg>>2]|0;
     HEAP16[$192>>1] = $191;
     $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
     continue L1;
     break;
    }
    case 4:  {
     $193 = $cnt$1&255;
     $194 = HEAP32[$arg>>2]|0;
     HEAP8[$194>>0] = $193;
     $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
     continue L1;
     break;
    }
    case 6:  {
     $195 = HEAP32[$arg>>2]|0;
     HEAP32[$195>>2] = $cnt$1;
     $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
     continue L1;
     break;
    }
    case 7:  {
     $196 = ($cnt$1|0)<(0);
     $197 = $196 << 31 >> 31;
     $198 = HEAP32[$arg>>2]|0;
     $199 = $198;
     $200 = $199;
     HEAP32[$200>>2] = $cnt$1;
     $201 = (($199) + 4)|0;
     $202 = $201;
     HEAP32[$202>>2] = $197;
     $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
     continue L1;
     break;
    }
    default: {
     $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
     continue L1;
    }
    }
    break;
   }
   case 112:  {
    $203 = ($p$0>>>0)>(8);
    $204 = $203 ? $p$0 : 8;
    $205 = $fl$1$ | 8;
    $fl$3 = $205;$p$1 = $204;$t$1 = 120;
    label = 64;
    break;
   }
   case 88: case 120:  {
    $fl$3 = $fl$1$;$p$1 = $p$0;$t$1 = $t$0;
    label = 64;
    break;
   }
   case 111:  {
    $243 = $arg;
    $244 = $243;
    $245 = HEAP32[$244>>2]|0;
    $246 = (($243) + 4)|0;
    $247 = $246;
    $248 = HEAP32[$247>>2]|0;
    $249 = ($245|0)==(0);
    $250 = ($248|0)==(0);
    $251 = $249 & $250;
    if ($251) {
     $$0$lcssa$i = $1;
    } else {
     $$03$i33 = $1;$253 = $245;$257 = $248;
     while(1) {
      $252 = $253 & 7;
      $254 = $252 | 48;
      $255 = $254&255;
      $256 = ((($$03$i33)) + -1|0);
      HEAP8[$256>>0] = $255;
      $258 = (_bitshift64Lshr(($253|0),($257|0),3)|0);
      $259 = tempRet0;
      $260 = ($258|0)==(0);
      $261 = ($259|0)==(0);
      $262 = $260 & $261;
      if ($262) {
       $$0$lcssa$i = $256;
       break;
      } else {
       $$03$i33 = $256;$253 = $258;$257 = $259;
      }
     }
    }
    $263 = $fl$1$ & 8;
    $264 = ($263|0)==(0);
    if ($264) {
     $a$0 = $$0$lcssa$i;$fl$4 = $fl$1$;$p$2 = $p$0;$pl$1 = 0;$prefix$1 = 13029;
     label = 77;
    } else {
     $265 = $$0$lcssa$i;
     $266 = (($2) - ($265))|0;
     $267 = (($266) + 1)|0;
     $268 = ($p$0|0)<($267|0);
     $$p$0 = $268 ? $267 : $p$0;
     $a$0 = $$0$lcssa$i;$fl$4 = $fl$1$;$p$2 = $$p$0;$pl$1 = 0;$prefix$1 = 13029;
     label = 77;
    }
    break;
   }
   case 105: case 100:  {
    $269 = $arg;
    $270 = $269;
    $271 = HEAP32[$270>>2]|0;
    $272 = (($269) + 4)|0;
    $273 = $272;
    $274 = HEAP32[$273>>2]|0;
    $275 = ($274|0)<(0);
    if ($275) {
     $276 = (_i64Subtract(0,0,($271|0),($274|0))|0);
     $277 = tempRet0;
     $278 = $arg;
     $279 = $278;
     HEAP32[$279>>2] = $276;
     $280 = (($278) + 4)|0;
     $281 = $280;
     HEAP32[$281>>2] = $277;
     $286 = $276;$287 = $277;$pl$0 = 1;$prefix$0 = 13029;
     label = 76;
     break L75;
    }
    $282 = $fl$1$ & 2048;
    $283 = ($282|0)==(0);
    if ($283) {
     $284 = $fl$1$ & 1;
     $285 = ($284|0)==(0);
     $$ = $285 ? 13029 : (13031);
     $286 = $271;$287 = $274;$pl$0 = $284;$prefix$0 = $$;
     label = 76;
    } else {
     $286 = $271;$287 = $274;$pl$0 = 1;$prefix$0 = (13030);
     label = 76;
    }
    break;
   }
   case 117:  {
    $176 = $arg;
    $177 = $176;
    $178 = HEAP32[$177>>2]|0;
    $179 = (($176) + 4)|0;
    $180 = $179;
    $181 = HEAP32[$180>>2]|0;
    $286 = $178;$287 = $181;$pl$0 = 0;$prefix$0 = 13029;
    label = 76;
    break;
   }
   case 99:  {
    $307 = $arg;
    $308 = $307;
    $309 = HEAP32[$308>>2]|0;
    $310 = (($307) + 4)|0;
    $311 = $310;
    $312 = HEAP32[$311>>2]|0;
    $313 = $309&255;
    HEAP8[$3>>0] = $313;
    $a$2 = $3;$fl$6 = $175;$p$5 = 1;$pl$2 = 0;$prefix$2 = 13029;$z$2 = $1;
    break;
   }
   case 109:  {
    $314 = (___errno_location()|0);
    $315 = HEAP32[$314>>2]|0;
    $316 = (_strerror($315)|0);
    $a$1 = $316;
    label = 82;
    break;
   }
   case 115:  {
    $317 = HEAP32[$arg>>2]|0;
    $318 = ($317|0)!=(0|0);
    $319 = $318 ? $317 : 13039;
    $a$1 = $319;
    label = 82;
    break;
   }
   case 67:  {
    $326 = $arg;
    $327 = $326;
    $328 = HEAP32[$327>>2]|0;
    $329 = (($326) + 4)|0;
    $330 = $329;
    $331 = HEAP32[$330>>2]|0;
    HEAP32[$wc>>2] = $328;
    HEAP32[$4>>2] = 0;
    HEAP32[$arg>>2] = $wc;
    $p$4198 = -1;
    label = 86;
    break;
   }
   case 83:  {
    $332 = ($p$0|0)==(0);
    if ($332) {
     _pad($f,32,$w$1,0,$fl$1$);
     $i$0$lcssa200 = 0;
     label = 98;
    } else {
     $p$4198 = $p$0;
     label = 86;
    }
    break;
   }
   case 65: case 71: case 70: case 69: case 97: case 103: case 102: case 101:  {
    $359 = +HEAPF64[$arg>>3];
    HEAP32[$e2$i>>2] = 0;
    HEAPF64[tempDoublePtr>>3] = $359;$360 = HEAP32[tempDoublePtr>>2]|0;
    $361 = HEAP32[tempDoublePtr+4>>2]|0;
    $362 = ($361|0)<(0);
    if ($362) {
     $363 = -$359;
     $$07$i = $363;$pl$0$i = 1;$prefix$0$i = 13046;
    } else {
     $364 = $fl$1$ & 2048;
     $365 = ($364|0)==(0);
     if ($365) {
      $366 = $fl$1$ & 1;
      $367 = ($366|0)==(0);
      $$$i = $367 ? (13047) : (13052);
      $$07$i = $359;$pl$0$i = $366;$prefix$0$i = $$$i;
     } else {
      $$07$i = $359;$pl$0$i = 1;$prefix$0$i = (13049);
     }
    }
    HEAPF64[tempDoublePtr>>3] = $$07$i;$368 = HEAP32[tempDoublePtr>>2]|0;
    $369 = HEAP32[tempDoublePtr+4>>2]|0;
    $370 = $369 & 2146435072;
    $371 = ($370>>>0)<(2146435072);
    $372 = (0)<(0);
    $373 = ($370|0)==(2146435072);
    $374 = $373 & $372;
    $375 = $371 | $374;
    do {
     if ($375) {
      $391 = (+_frexpl($$07$i,$e2$i));
      $392 = $391 * +2;
      $393 = $392 != +0;
      if ($393) {
       $394 = HEAP32[$e2$i>>2]|0;
       $395 = (($394) + -1)|0;
       HEAP32[$e2$i>>2] = $395;
      }
      $396 = $t$0 | 32;
      $397 = ($396|0)==(97);
      if ($397) {
       $398 = $t$0 & 32;
       $399 = ($398|0)==(0);
       $400 = ((($prefix$0$i)) + 9|0);
       $prefix$0$$i = $399 ? $prefix$0$i : $400;
       $401 = $pl$0$i | 2;
       $402 = ($p$0>>>0)>(11);
       $403 = (12 - ($p$0))|0;
       $404 = ($403|0)==(0);
       $405 = $402 | $404;
       do {
        if ($405) {
         $$1$i = $392;
        } else {
         $re$169$i = $403;$round$068$i = +8;
         while(1) {
          $406 = (($re$169$i) + -1)|0;
          $407 = $round$068$i * +16;
          $408 = ($406|0)==(0);
          if ($408) {
           $$lcssa342 = $407;
           break;
          } else {
           $re$169$i = $406;$round$068$i = $407;
          }
         }
         $409 = HEAP8[$prefix$0$$i>>0]|0;
         $410 = ($409<<24>>24)==(45);
         if ($410) {
          $411 = -$392;
          $412 = $411 - $$lcssa342;
          $413 = $$lcssa342 + $412;
          $414 = -$413;
          $$1$i = $414;
          break;
         } else {
          $415 = $392 + $$lcssa342;
          $416 = $415 - $$lcssa342;
          $$1$i = $416;
          break;
         }
        }
       } while(0);
       $417 = HEAP32[$e2$i>>2]|0;
       $418 = ($417|0)<(0);
       $419 = (0 - ($417))|0;
       $420 = $418 ? $419 : $417;
       $421 = ($420|0)<(0);
       $422 = $421 << 31 >> 31;
       $423 = (_fmt_u($420,$422,$5)|0);
       $424 = ($423|0)==($5|0);
       if ($424) {
        HEAP8[$6>>0] = 48;
        $estr$0$i = $6;
       } else {
        $estr$0$i = $423;
       }
       $425 = $417 >> 31;
       $426 = $425 & 2;
       $427 = (($426) + 43)|0;
       $428 = $427&255;
       $429 = ((($estr$0$i)) + -1|0);
       HEAP8[$429>>0] = $428;
       $430 = (($t$0) + 15)|0;
       $431 = $430&255;
       $432 = ((($estr$0$i)) + -2|0);
       HEAP8[$432>>0] = $431;
       $notrhs$i = ($p$0|0)<(1);
       $433 = $fl$1$ & 8;
       $434 = ($433|0)==(0);
       $$2$i = $$1$i;$s$0$i = $buf$i;
       while(1) {
        $435 = (~~(($$2$i)));
        $436 = (13013 + ($435)|0);
        $437 = HEAP8[$436>>0]|0;
        $438 = $437&255;
        $439 = $438 | $398;
        $440 = $439&255;
        $441 = ((($s$0$i)) + 1|0);
        HEAP8[$s$0$i>>0] = $440;
        $442 = (+($435|0));
        $443 = $$2$i - $442;
        $444 = $443 * +16;
        $445 = $441;
        $446 = (($445) - ($7))|0;
        $447 = ($446|0)==(1);
        do {
         if ($447) {
          $notlhs$i = $444 == +0;
          $or$cond3$not$i = $notrhs$i & $notlhs$i;
          $or$cond$i = $434 & $or$cond3$not$i;
          if ($or$cond$i) {
           $s$1$i = $441;
           break;
          }
          $448 = ((($s$0$i)) + 2|0);
          HEAP8[$441>>0] = 46;
          $s$1$i = $448;
         } else {
          $s$1$i = $441;
         }
        } while(0);
        $449 = $444 != +0;
        if ($449) {
         $$2$i = $444;$s$0$i = $s$1$i;
        } else {
         $s$1$i$lcssa = $s$1$i;
         break;
        }
       }
       $450 = ($p$0|0)!=(0);
       $$pre182$i = $s$1$i$lcssa;
       $451 = (($10) + ($$pre182$i))|0;
       $452 = ($451|0)<($p$0|0);
       $or$cond240 = $450 & $452;
       $453 = $432;
       $454 = (($11) + ($p$0))|0;
       $455 = (($454) - ($453))|0;
       $456 = $432;
       $457 = (($9) - ($456))|0;
       $458 = (($457) + ($$pre182$i))|0;
       $l$0$i = $or$cond240 ? $455 : $458;
       $459 = (($l$0$i) + ($401))|0;
       _pad($f,32,$w$1,$459,$fl$1$);
       $460 = HEAP32[$f>>2]|0;
       $461 = $460 & 32;
       $462 = ($461|0)==(0);
       if ($462) {
        (___fwritex($prefix$0$$i,$401,$f)|0);
       }
       $463 = $fl$1$ ^ 65536;
       _pad($f,48,$w$1,$459,$463);
       $464 = (($$pre182$i) - ($7))|0;
       $465 = HEAP32[$f>>2]|0;
       $466 = $465 & 32;
       $467 = ($466|0)==(0);
       if ($467) {
        (___fwritex($buf$i,$464,$f)|0);
       }
       $468 = $432;
       $469 = (($8) - ($468))|0;
       $sum = (($464) + ($469))|0;
       $470 = (($l$0$i) - ($sum))|0;
       _pad($f,48,$470,0,0);
       $471 = HEAP32[$f>>2]|0;
       $472 = $471 & 32;
       $473 = ($472|0)==(0);
       if ($473) {
        (___fwritex($432,$469,$f)|0);
       }
       $474 = $fl$1$ ^ 8192;
       _pad($f,32,$w$1,$459,$474);
       $475 = ($459|0)<($w$1|0);
       $w$$i = $475 ? $w$1 : $459;
       $$0$i = $w$$i;
       break;
      }
      $476 = ($p$0|0)<(0);
      $$p$i = $476 ? 6 : $p$0;
      if ($393) {
       $477 = $392 * +268435456;
       $478 = HEAP32[$e2$i>>2]|0;
       $479 = (($478) + -28)|0;
       HEAP32[$e2$i>>2] = $479;
       $$3$i = $477;$481 = $479;
      } else {
       $$pre179$i = HEAP32[$e2$i>>2]|0;
       $$3$i = $392;$481 = $$pre179$i;
      }
      $480 = ($481|0)<(0);
      $$31$i = $480 ? $big$i : $12;
      $482 = $$31$i;
      $$4$i = $$3$i;$z$0$i = $$31$i;
      while(1) {
       $483 = (~~(($$4$i))>>>0);
       HEAP32[$z$0$i>>2] = $483;
       $484 = ((($z$0$i)) + 4|0);
       $485 = (+($483>>>0));
       $486 = $$4$i - $485;
       $487 = $486 * +1.0E+9;
       $488 = $487 != +0;
       if ($488) {
        $$4$i = $487;$z$0$i = $484;
       } else {
        $$lcssa326 = $484;
        break;
       }
      }
      $$pr$i = HEAP32[$e2$i>>2]|0;
      $489 = ($$pr$i|0)>(0);
      if ($489) {
       $491 = $$pr$i;$a$1147$i = $$31$i;$z$1146$i = $$lcssa326;
       while(1) {
        $490 = ($491|0)>(29);
        $492 = $490 ? 29 : $491;
        $d$0139$i = ((($z$1146$i)) + -4|0);
        $493 = ($d$0139$i>>>0)<($a$1147$i>>>0);
        do {
         if ($493) {
          $a$2$ph$i = $a$1147$i;
         } else {
          $carry$0140$i = 0;$d$0141$i = $d$0139$i;
          while(1) {
           $494 = HEAP32[$d$0141$i>>2]|0;
           $495 = (_bitshift64Shl(($494|0),0,($492|0))|0);
           $496 = tempRet0;
           $497 = (_i64Add(($495|0),($496|0),($carry$0140$i|0),0)|0);
           $498 = tempRet0;
           $499 = (___uremdi3(($497|0),($498|0),1000000000,0)|0);
           $500 = tempRet0;
           HEAP32[$d$0141$i>>2] = $499;
           $501 = (___udivdi3(($497|0),($498|0),1000000000,0)|0);
           $502 = tempRet0;
           $d$0$i = ((($d$0141$i)) + -4|0);
           $503 = ($d$0$i>>>0)<($a$1147$i>>>0);
           if ($503) {
            $$lcssa327 = $501;
            break;
           } else {
            $carry$0140$i = $501;$d$0141$i = $d$0$i;
           }
          }
          $504 = ($$lcssa327|0)==(0);
          if ($504) {
           $a$2$ph$i = $a$1147$i;
           break;
          }
          $505 = ((($a$1147$i)) + -4|0);
          HEAP32[$505>>2] = $$lcssa327;
          $a$2$ph$i = $505;
         }
        } while(0);
        $z$2$i = $z$1146$i;
        while(1) {
         $506 = ($z$2$i>>>0)>($a$2$ph$i>>>0);
         if (!($506)) {
          $z$2$i$lcssa = $z$2$i;
          break;
         }
         $507 = ((($z$2$i)) + -4|0);
         $508 = HEAP32[$507>>2]|0;
         $509 = ($508|0)==(0);
         if ($509) {
          $z$2$i = $507;
         } else {
          $z$2$i$lcssa = $z$2$i;
          break;
         }
        }
        $510 = HEAP32[$e2$i>>2]|0;
        $511 = (($510) - ($492))|0;
        HEAP32[$e2$i>>2] = $511;
        $512 = ($511|0)>(0);
        if ($512) {
         $491 = $511;$a$1147$i = $a$2$ph$i;$z$1146$i = $z$2$i$lcssa;
        } else {
         $$pr47$i = $511;$a$1$lcssa$i = $a$2$ph$i;$z$1$lcssa$i = $z$2$i$lcssa;
         break;
        }
       }
      } else {
       $$pr47$i = $$pr$i;$a$1$lcssa$i = $$31$i;$z$1$lcssa$i = $$lcssa326;
      }
      $513 = ($$pr47$i|0)<(0);
      if ($513) {
       $514 = (($$p$i) + 25)|0;
       $515 = (($514|0) / 9)&-1;
       $516 = (($515) + 1)|0;
       $517 = ($396|0)==(102);
       $519 = $$pr47$i;$a$3134$i = $a$1$lcssa$i;$z$3133$i = $z$1$lcssa$i;
       while(1) {
        $518 = (0 - ($519))|0;
        $520 = ($518|0)>(9);
        $521 = $520 ? 9 : $518;
        $522 = ($a$3134$i>>>0)<($z$3133$i>>>0);
        do {
         if ($522) {
          $526 = 1 << $521;
          $527 = (($526) + -1)|0;
          $528 = 1000000000 >>> $521;
          $carry3$0128$i = 0;$d$1127$i = $a$3134$i;
          while(1) {
           $529 = HEAP32[$d$1127$i>>2]|0;
           $530 = $529 & $527;
           $531 = $529 >>> $521;
           $532 = (($531) + ($carry3$0128$i))|0;
           HEAP32[$d$1127$i>>2] = $532;
           $533 = Math_imul($530, $528)|0;
           $534 = ((($d$1127$i)) + 4|0);
           $535 = ($534>>>0)<($z$3133$i>>>0);
           if ($535) {
            $carry3$0128$i = $533;$d$1127$i = $534;
           } else {
            $$lcssa329 = $533;
            break;
           }
          }
          $536 = HEAP32[$a$3134$i>>2]|0;
          $537 = ($536|0)==(0);
          $538 = ((($a$3134$i)) + 4|0);
          $$a$3$i = $537 ? $538 : $a$3134$i;
          $539 = ($$lcssa329|0)==(0);
          if ($539) {
           $$a$3186$i = $$a$3$i;$z$4$i = $z$3133$i;
           break;
          }
          $540 = ((($z$3133$i)) + 4|0);
          HEAP32[$z$3133$i>>2] = $$lcssa329;
          $$a$3186$i = $$a$3$i;$z$4$i = $540;
         } else {
          $523 = HEAP32[$a$3134$i>>2]|0;
          $524 = ($523|0)==(0);
          $525 = ((($a$3134$i)) + 4|0);
          $$a$3185$i = $524 ? $525 : $a$3134$i;
          $$a$3186$i = $$a$3185$i;$z$4$i = $z$3133$i;
         }
        } while(0);
        $541 = $517 ? $$31$i : $$a$3186$i;
        $542 = $z$4$i;
        $543 = $541;
        $544 = (($542) - ($543))|0;
        $545 = $544 >> 2;
        $546 = ($545|0)>($516|0);
        $547 = (($541) + ($516<<2)|0);
        $$z$4$i = $546 ? $547 : $z$4$i;
        $548 = HEAP32[$e2$i>>2]|0;
        $549 = (($548) + ($521))|0;
        HEAP32[$e2$i>>2] = $549;
        $550 = ($549|0)<(0);
        if ($550) {
         $519 = $549;$a$3134$i = $$a$3186$i;$z$3133$i = $$z$4$i;
        } else {
         $a$3$lcssa$i = $$a$3186$i;$z$3$lcssa$i = $$z$4$i;
         break;
        }
       }
      } else {
       $a$3$lcssa$i = $a$1$lcssa$i;$z$3$lcssa$i = $z$1$lcssa$i;
      }
      $551 = ($a$3$lcssa$i>>>0)<($z$3$lcssa$i>>>0);
      do {
       if ($551) {
        $552 = $a$3$lcssa$i;
        $553 = (($482) - ($552))|0;
        $554 = $553 >> 2;
        $555 = ($554*9)|0;
        $556 = HEAP32[$a$3$lcssa$i>>2]|0;
        $557 = ($556>>>0)<(10);
        if ($557) {
         $e$1$i = $555;
         break;
        } else {
         $e$0123$i = $555;$i$0122$i = 10;
        }
        while(1) {
         $558 = ($i$0122$i*10)|0;
         $559 = (($e$0123$i) + 1)|0;
         $560 = ($556>>>0)<($558>>>0);
         if ($560) {
          $e$1$i = $559;
          break;
         } else {
          $e$0123$i = $559;$i$0122$i = $558;
         }
        }
       } else {
        $e$1$i = 0;
       }
      } while(0);
      $561 = ($396|0)!=(102);
      $562 = $561 ? $e$1$i : 0;
      $563 = (($$p$i) - ($562))|0;
      $564 = ($396|0)==(103);
      $565 = ($$p$i|0)!=(0);
      $566 = $565 & $564;
      $$neg52$i = $566 << 31 >> 31;
      $567 = (($563) + ($$neg52$i))|0;
      $568 = $z$3$lcssa$i;
      $569 = (($568) - ($482))|0;
      $570 = $569 >> 2;
      $571 = ($570*9)|0;
      $572 = (($571) + -9)|0;
      $573 = ($567|0)<($572|0);
      if ($573) {
       $574 = (($567) + 9216)|0;
       $575 = (($574|0) / 9)&-1;
       $$sum$i = (($575) + -1023)|0;
       $576 = (($$31$i) + ($$sum$i<<2)|0);
       $577 = (($574|0) % 9)&-1;
       $j$0115$i = (($577) + 1)|0;
       $578 = ($j$0115$i|0)<(9);
       if ($578) {
        $i$1116$i = 10;$j$0117$i = $j$0115$i;
        while(1) {
         $579 = ($i$1116$i*10)|0;
         $j$0$i = (($j$0117$i) + 1)|0;
         $exitcond$i = ($j$0$i|0)==(9);
         if ($exitcond$i) {
          $i$1$lcssa$i = $579;
          break;
         } else {
          $i$1116$i = $579;$j$0117$i = $j$0$i;
         }
        }
       } else {
        $i$1$lcssa$i = 10;
       }
       $580 = HEAP32[$576>>2]|0;
       $581 = (($580>>>0) % ($i$1$lcssa$i>>>0))&-1;
       $582 = ($581|0)==(0);
       if ($582) {
        $$sum15$i = (($575) + -1022)|0;
        $583 = (($$31$i) + ($$sum15$i<<2)|0);
        $584 = ($583|0)==($z$3$lcssa$i|0);
        if ($584) {
         $a$7$i = $a$3$lcssa$i;$d$3$i = $576;$e$3$i = $e$1$i;
        } else {
         label = 163;
        }
       } else {
        label = 163;
       }
       do {
        if ((label|0) == 163) {
         label = 0;
         $585 = (($580>>>0) / ($i$1$lcssa$i>>>0))&-1;
         $586 = $585 & 1;
         $587 = ($586|0)==(0);
         $$20$i = $587 ? +9007199254740992 : +9007199254740994;
         $588 = (($i$1$lcssa$i|0) / 2)&-1;
         $589 = ($581>>>0)<($588>>>0);
         do {
          if ($589) {
           $small$0$i = +0.5;
          } else {
           $590 = ($581|0)==($588|0);
           if ($590) {
            $$sum16$i = (($575) + -1022)|0;
            $591 = (($$31$i) + ($$sum16$i<<2)|0);
            $592 = ($591|0)==($z$3$lcssa$i|0);
            if ($592) {
             $small$0$i = +1;
             break;
            }
           }
           $small$0$i = +1.5;
          }
         } while(0);
         $593 = ($pl$0$i|0)==(0);
         do {
          if ($593) {
           $round6$1$i = $$20$i;$small$1$i = $small$0$i;
          } else {
           $594 = HEAP8[$prefix$0$i>>0]|0;
           $595 = ($594<<24>>24)==(45);
           if (!($595)) {
            $round6$1$i = $$20$i;$small$1$i = $small$0$i;
            break;
           }
           $596 = -$$20$i;
           $597 = -$small$0$i;
           $round6$1$i = $596;$small$1$i = $597;
          }
         } while(0);
         $598 = (($580) - ($581))|0;
         HEAP32[$576>>2] = $598;
         $599 = $round6$1$i + $small$1$i;
         $600 = $599 != $round6$1$i;
         if (!($600)) {
          $a$7$i = $a$3$lcssa$i;$d$3$i = $576;$e$3$i = $e$1$i;
          break;
         }
         $601 = (($598) + ($i$1$lcssa$i))|0;
         HEAP32[$576>>2] = $601;
         $602 = ($601>>>0)>(999999999);
         if ($602) {
          $a$5109$i = $a$3$lcssa$i;$d$2108$i = $576;
          while(1) {
           $603 = ((($d$2108$i)) + -4|0);
           HEAP32[$d$2108$i>>2] = 0;
           $604 = ($603>>>0)<($a$5109$i>>>0);
           if ($604) {
            $605 = ((($a$5109$i)) + -4|0);
            HEAP32[$605>>2] = 0;
            $a$6$i = $605;
           } else {
            $a$6$i = $a$5109$i;
           }
           $606 = HEAP32[$603>>2]|0;
           $607 = (($606) + 1)|0;
           HEAP32[$603>>2] = $607;
           $608 = ($607>>>0)>(999999999);
           if ($608) {
            $a$5109$i = $a$6$i;$d$2108$i = $603;
           } else {
            $a$5$lcssa$i = $a$6$i;$d$2$lcssa$i = $603;
            break;
           }
          }
         } else {
          $a$5$lcssa$i = $a$3$lcssa$i;$d$2$lcssa$i = $576;
         }
         $609 = $a$5$lcssa$i;
         $610 = (($482) - ($609))|0;
         $611 = $610 >> 2;
         $612 = ($611*9)|0;
         $613 = HEAP32[$a$5$lcssa$i>>2]|0;
         $614 = ($613>>>0)<(10);
         if ($614) {
          $a$7$i = $a$5$lcssa$i;$d$3$i = $d$2$lcssa$i;$e$3$i = $612;
          break;
         } else {
          $e$2104$i = $612;$i$2103$i = 10;
         }
         while(1) {
          $615 = ($i$2103$i*10)|0;
          $616 = (($e$2104$i) + 1)|0;
          $617 = ($613>>>0)<($615>>>0);
          if ($617) {
           $a$7$i = $a$5$lcssa$i;$d$3$i = $d$2$lcssa$i;$e$3$i = $616;
           break;
          } else {
           $e$2104$i = $616;$i$2103$i = $615;
          }
         }
        }
       } while(0);
       $618 = ((($d$3$i)) + 4|0);
       $619 = ($z$3$lcssa$i>>>0)>($618>>>0);
       $$z$3$i = $619 ? $618 : $z$3$lcssa$i;
       $a$8$ph$i = $a$7$i;$e$4$ph$i = $e$3$i;$z$6$ph$i = $$z$3$i;
      } else {
       $a$8$ph$i = $a$3$lcssa$i;$e$4$ph$i = $e$1$i;$z$6$ph$i = $z$3$lcssa$i;
      }
      $620 = (0 - ($e$4$ph$i))|0;
      $z$6$i = $z$6$ph$i;
      while(1) {
       $621 = ($z$6$i>>>0)>($a$8$ph$i>>>0);
       if (!($621)) {
        $$lcssa159$i = 0;$z$6$i$lcssa = $z$6$i;
        break;
       }
       $622 = ((($z$6$i)) + -4|0);
       $623 = HEAP32[$622>>2]|0;
       $624 = ($623|0)==(0);
       if ($624) {
        $z$6$i = $622;
       } else {
        $$lcssa159$i = 1;$z$6$i$lcssa = $z$6$i;
        break;
       }
      }
      do {
       if ($564) {
        $625 = $565&1;
        $626 = $625 ^ 1;
        $$p$$i = (($626) + ($$p$i))|0;
        $627 = ($$p$$i|0)>($e$4$ph$i|0);
        $628 = ($e$4$ph$i|0)>(-5);
        $or$cond6$i = $627 & $628;
        if ($or$cond6$i) {
         $629 = (($t$0) + -1)|0;
         $$neg53$i = (($$p$$i) + -1)|0;
         $630 = (($$neg53$i) - ($e$4$ph$i))|0;
         $$013$i = $629;$$210$i = $630;
        } else {
         $631 = (($t$0) + -2)|0;
         $632 = (($$p$$i) + -1)|0;
         $$013$i = $631;$$210$i = $632;
        }
        $633 = $fl$1$ & 8;
        $634 = ($633|0)==(0);
        if (!($634)) {
         $$114$i = $$013$i;$$311$i = $$210$i;$$pre$phi184$iZ2D = $633;
         break;
        }
        do {
         if ($$lcssa159$i) {
          $635 = ((($z$6$i$lcssa)) + -4|0);
          $636 = HEAP32[$635>>2]|0;
          $637 = ($636|0)==(0);
          if ($637) {
           $j$2$i = 9;
           break;
          }
          $638 = (($636>>>0) % 10)&-1;
          $639 = ($638|0)==(0);
          if ($639) {
           $i$399$i = 10;$j$1100$i = 0;
          } else {
           $j$2$i = 0;
           break;
          }
          while(1) {
           $640 = ($i$399$i*10)|0;
           $641 = (($j$1100$i) + 1)|0;
           $642 = (($636>>>0) % ($640>>>0))&-1;
           $643 = ($642|0)==(0);
           if ($643) {
            $i$399$i = $640;$j$1100$i = $641;
           } else {
            $j$2$i = $641;
            break;
           }
          }
         } else {
          $j$2$i = 9;
         }
        } while(0);
        $644 = $$013$i | 32;
        $645 = ($644|0)==(102);
        $646 = $z$6$i$lcssa;
        $647 = (($646) - ($482))|0;
        $648 = $647 >> 2;
        $649 = ($648*9)|0;
        $650 = (($649) + -9)|0;
        if ($645) {
         $651 = (($650) - ($j$2$i))|0;
         $652 = ($651|0)<(0);
         $$21$i = $652 ? 0 : $651;
         $653 = ($$210$i|0)<($$21$i|0);
         $$210$$22$i = $653 ? $$210$i : $$21$i;
         $$114$i = $$013$i;$$311$i = $$210$$22$i;$$pre$phi184$iZ2D = 0;
         break;
        } else {
         $654 = (($650) + ($e$4$ph$i))|0;
         $655 = (($654) - ($j$2$i))|0;
         $656 = ($655|0)<(0);
         $$23$i = $656 ? 0 : $655;
         $657 = ($$210$i|0)<($$23$i|0);
         $$210$$24$i = $657 ? $$210$i : $$23$i;
         $$114$i = $$013$i;$$311$i = $$210$$24$i;$$pre$phi184$iZ2D = 0;
         break;
        }
       } else {
        $$pre183$i = $fl$1$ & 8;
        $$114$i = $t$0;$$311$i = $$p$i;$$pre$phi184$iZ2D = $$pre183$i;
       }
      } while(0);
      $658 = $$311$i | $$pre$phi184$iZ2D;
      $659 = ($658|0)!=(0);
      $660 = $659&1;
      $661 = $$114$i | 32;
      $662 = ($661|0)==(102);
      if ($662) {
       $663 = ($e$4$ph$i|0)>(0);
       $664 = $663 ? $e$4$ph$i : 0;
       $$pn$i = $664;$estr$2$i = 0;
      } else {
       $665 = ($e$4$ph$i|0)<(0);
       $666 = $665 ? $620 : $e$4$ph$i;
       $667 = ($666|0)<(0);
       $668 = $667 << 31 >> 31;
       $669 = (_fmt_u($666,$668,$5)|0);
       $670 = $669;
       $671 = (($8) - ($670))|0;
       $672 = ($671|0)<(2);
       if ($672) {
        $estr$193$i = $669;
        while(1) {
         $673 = ((($estr$193$i)) + -1|0);
         HEAP8[$673>>0] = 48;
         $674 = $673;
         $675 = (($8) - ($674))|0;
         $676 = ($675|0)<(2);
         if ($676) {
          $estr$193$i = $673;
         } else {
          $estr$1$lcssa$i = $673;
          break;
         }
        }
       } else {
        $estr$1$lcssa$i = $669;
       }
       $677 = $e$4$ph$i >> 31;
       $678 = $677 & 2;
       $679 = (($678) + 43)|0;
       $680 = $679&255;
       $681 = ((($estr$1$lcssa$i)) + -1|0);
       HEAP8[$681>>0] = $680;
       $682 = $$114$i&255;
       $683 = ((($estr$1$lcssa$i)) + -2|0);
       HEAP8[$683>>0] = $682;
       $684 = $683;
       $685 = (($8) - ($684))|0;
       $$pn$i = $685;$estr$2$i = $683;
      }
      $686 = (($pl$0$i) + 1)|0;
      $687 = (($686) + ($$311$i))|0;
      $l$1$i = (($687) + ($660))|0;
      $688 = (($l$1$i) + ($$pn$i))|0;
      _pad($f,32,$w$1,$688,$fl$1$);
      $689 = HEAP32[$f>>2]|0;
      $690 = $689 & 32;
      $691 = ($690|0)==(0);
      if ($691) {
       (___fwritex($prefix$0$i,$pl$0$i,$f)|0);
      }
      $692 = $fl$1$ ^ 65536;
      _pad($f,48,$w$1,$688,$692);
      do {
       if ($662) {
        $693 = ($a$8$ph$i>>>0)>($$31$i>>>0);
        $r$0$a$8$i = $693 ? $$31$i : $a$8$ph$i;
        $d$482$i = $r$0$a$8$i;
        while(1) {
         $694 = HEAP32[$d$482$i>>2]|0;
         $695 = (_fmt_u($694,0,$13)|0);
         $696 = ($d$482$i|0)==($r$0$a$8$i|0);
         do {
          if ($696) {
           $700 = ($695|0)==($13|0);
           if (!($700)) {
            $s7$1$i = $695;
            break;
           }
           HEAP8[$15>>0] = 48;
           $s7$1$i = $15;
          } else {
           $697 = ($695>>>0)>($buf$i>>>0);
           if ($697) {
            $s7$079$i = $695;
           } else {
            $s7$1$i = $695;
            break;
           }
           while(1) {
            $698 = ((($s7$079$i)) + -1|0);
            HEAP8[$698>>0] = 48;
            $699 = ($698>>>0)>($buf$i>>>0);
            if ($699) {
             $s7$079$i = $698;
            } else {
             $s7$1$i = $698;
             break;
            }
           }
          }
         } while(0);
         $701 = HEAP32[$f>>2]|0;
         $702 = $701 & 32;
         $703 = ($702|0)==(0);
         if ($703) {
          $704 = $s7$1$i;
          $705 = (($14) - ($704))|0;
          (___fwritex($s7$1$i,$705,$f)|0);
         }
         $706 = ((($d$482$i)) + 4|0);
         $707 = ($706>>>0)>($$31$i>>>0);
         if ($707) {
          $$lcssa339 = $706;
          break;
         } else {
          $d$482$i = $706;
         }
        }
        $708 = ($658|0)==(0);
        do {
         if (!($708)) {
          $709 = HEAP32[$f>>2]|0;
          $710 = $709 & 32;
          $711 = ($710|0)==(0);
          if (!($711)) {
           break;
          }
          (___fwritex(13081,1,$f)|0);
         }
        } while(0);
        $712 = ($$lcssa339>>>0)<($z$6$i$lcssa>>>0);
        $713 = ($$311$i|0)>(0);
        $714 = $713 & $712;
        if ($714) {
         $$41276$i = $$311$i;$d$575$i = $$lcssa339;
         while(1) {
          $715 = HEAP32[$d$575$i>>2]|0;
          $716 = (_fmt_u($715,0,$13)|0);
          $717 = ($716>>>0)>($buf$i>>>0);
          if ($717) {
           $s8$070$i = $716;
           while(1) {
            $718 = ((($s8$070$i)) + -1|0);
            HEAP8[$718>>0] = 48;
            $719 = ($718>>>0)>($buf$i>>>0);
            if ($719) {
             $s8$070$i = $718;
            } else {
             $s8$0$lcssa$i = $718;
             break;
            }
           }
          } else {
           $s8$0$lcssa$i = $716;
          }
          $720 = HEAP32[$f>>2]|0;
          $721 = $720 & 32;
          $722 = ($721|0)==(0);
          if ($722) {
           $723 = ($$41276$i|0)>(9);
           $724 = $723 ? 9 : $$41276$i;
           (___fwritex($s8$0$lcssa$i,$724,$f)|0);
          }
          $725 = ((($d$575$i)) + 4|0);
          $726 = (($$41276$i) + -9)|0;
          $727 = ($725>>>0)<($z$6$i$lcssa>>>0);
          $728 = ($$41276$i|0)>(9);
          $729 = $728 & $727;
          if ($729) {
           $$41276$i = $726;$d$575$i = $725;
          } else {
           $$412$lcssa$i = $726;
           break;
          }
         }
        } else {
         $$412$lcssa$i = $$311$i;
        }
        $730 = (($$412$lcssa$i) + 9)|0;
        _pad($f,48,$730,9,0);
       } else {
        $731 = ((($a$8$ph$i)) + 4|0);
        $z$6$$i = $$lcssa159$i ? $z$6$i$lcssa : $731;
        $732 = ($$311$i|0)>(-1);
        if ($732) {
         $733 = ($$pre$phi184$iZ2D|0)==(0);
         $$587$i = $$311$i;$d$686$i = $a$8$ph$i;
         while(1) {
          $734 = HEAP32[$d$686$i>>2]|0;
          $735 = (_fmt_u($734,0,$13)|0);
          $736 = ($735|0)==($13|0);
          if ($736) {
           HEAP8[$15>>0] = 48;
           $s9$0$i = $15;
          } else {
           $s9$0$i = $735;
          }
          $737 = ($d$686$i|0)==($a$8$ph$i|0);
          do {
           if ($737) {
            $741 = ((($s9$0$i)) + 1|0);
            $742 = HEAP32[$f>>2]|0;
            $743 = $742 & 32;
            $744 = ($743|0)==(0);
            if ($744) {
             (___fwritex($s9$0$i,1,$f)|0);
            }
            $745 = ($$587$i|0)<(1);
            $or$cond29$i = $733 & $745;
            if ($or$cond29$i) {
             $s9$2$i = $741;
             break;
            }
            $746 = HEAP32[$f>>2]|0;
            $747 = $746 & 32;
            $748 = ($747|0)==(0);
            if (!($748)) {
             $s9$2$i = $741;
             break;
            }
            (___fwritex(13081,1,$f)|0);
            $s9$2$i = $741;
           } else {
            $738 = ($s9$0$i>>>0)>($buf$i>>>0);
            if ($738) {
             $s9$183$i = $s9$0$i;
            } else {
             $s9$2$i = $s9$0$i;
             break;
            }
            while(1) {
             $739 = ((($s9$183$i)) + -1|0);
             HEAP8[$739>>0] = 48;
             $740 = ($739>>>0)>($buf$i>>>0);
             if ($740) {
              $s9$183$i = $739;
             } else {
              $s9$2$i = $739;
              break;
             }
            }
           }
          } while(0);
          $749 = $s9$2$i;
          $750 = (($14) - ($749))|0;
          $751 = HEAP32[$f>>2]|0;
          $752 = $751 & 32;
          $753 = ($752|0)==(0);
          if ($753) {
           $754 = ($$587$i|0)>($750|0);
           $755 = $754 ? $750 : $$587$i;
           (___fwritex($s9$2$i,$755,$f)|0);
          }
          $756 = (($$587$i) - ($750))|0;
          $757 = ((($d$686$i)) + 4|0);
          $758 = ($757>>>0)<($z$6$$i>>>0);
          $759 = ($756|0)>(-1);
          $760 = $758 & $759;
          if ($760) {
           $$587$i = $756;$d$686$i = $757;
          } else {
           $$5$lcssa$i = $756;
           break;
          }
         }
        } else {
         $$5$lcssa$i = $$311$i;
        }
        $761 = (($$5$lcssa$i) + 18)|0;
        _pad($f,48,$761,18,0);
        $762 = HEAP32[$f>>2]|0;
        $763 = $762 & 32;
        $764 = ($763|0)==(0);
        if (!($764)) {
         break;
        }
        $765 = $estr$2$i;
        $766 = (($8) - ($765))|0;
        (___fwritex($estr$2$i,$766,$f)|0);
       }
      } while(0);
      $767 = $fl$1$ ^ 8192;
      _pad($f,32,$w$1,$688,$767);
      $768 = ($688|0)<($w$1|0);
      $w$30$i = $768 ? $w$1 : $688;
      $$0$i = $w$30$i;
     } else {
      $376 = $t$0 & 32;
      $377 = ($376|0)!=(0);
      $378 = $377 ? 13065 : 13069;
      $379 = ($$07$i != $$07$i) | (+0 != +0);
      $380 = $377 ? 13073 : 13077;
      $pl$1$i = $379 ? 0 : $pl$0$i;
      $s1$0$i = $379 ? $380 : $378;
      $381 = (($pl$1$i) + 3)|0;
      _pad($f,32,$w$1,$381,$175);
      $382 = HEAP32[$f>>2]|0;
      $383 = $382 & 32;
      $384 = ($383|0)==(0);
      if ($384) {
       (___fwritex($prefix$0$i,$pl$1$i,$f)|0);
       $$pre$i = HEAP32[$f>>2]|0;
       $386 = $$pre$i;
      } else {
       $386 = $382;
      }
      $385 = $386 & 32;
      $387 = ($385|0)==(0);
      if ($387) {
       (___fwritex($s1$0$i,3,$f)|0);
      }
      $388 = $fl$1$ ^ 8192;
      _pad($f,32,$w$1,$381,$388);
      $389 = ($381|0)<($w$1|0);
      $390 = $389 ? $w$1 : $381;
      $$0$i = $390;
     }
    } while(0);
    $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $$0$i;$l10n$0 = $l10n$3;
    continue L1;
    break;
   }
   default: {
    $a$2 = $fmt41;$fl$6 = $fl$1$;$p$5 = $p$0;$pl$2 = 0;$prefix$2 = 13029;$z$2 = $1;
   }
   }
  } while(0);
  L313: do {
   if ((label|0) == 64) {
    label = 0;
    $206 = $arg;
    $207 = $206;
    $208 = HEAP32[$207>>2]|0;
    $209 = (($206) + 4)|0;
    $210 = $209;
    $211 = HEAP32[$210>>2]|0;
    $212 = $t$1 & 32;
    $213 = ($208|0)==(0);
    $214 = ($211|0)==(0);
    $215 = $213 & $214;
    if ($215) {
     $a$0 = $1;$fl$4 = $fl$3;$p$2 = $p$1;$pl$1 = 0;$prefix$1 = 13029;
     label = 77;
    } else {
     $$012$i = $1;$217 = $208;$224 = $211;
     while(1) {
      $216 = $217 & 15;
      $218 = (13013 + ($216)|0);
      $219 = HEAP8[$218>>0]|0;
      $220 = $219&255;
      $221 = $220 | $212;
      $222 = $221&255;
      $223 = ((($$012$i)) + -1|0);
      HEAP8[$223>>0] = $222;
      $225 = (_bitshift64Lshr(($217|0),($224|0),4)|0);
      $226 = tempRet0;
      $227 = ($225|0)==(0);
      $228 = ($226|0)==(0);
      $229 = $227 & $228;
      if ($229) {
       $$lcssa344 = $223;
       break;
      } else {
       $$012$i = $223;$217 = $225;$224 = $226;
      }
     }
     $230 = $arg;
     $231 = $230;
     $232 = HEAP32[$231>>2]|0;
     $233 = (($230) + 4)|0;
     $234 = $233;
     $235 = HEAP32[$234>>2]|0;
     $236 = ($232|0)==(0);
     $237 = ($235|0)==(0);
     $238 = $236 & $237;
     $239 = $fl$3 & 8;
     $240 = ($239|0)==(0);
     $or$cond17 = $240 | $238;
     if ($or$cond17) {
      $a$0 = $$lcssa344;$fl$4 = $fl$3;$p$2 = $p$1;$pl$1 = 0;$prefix$1 = 13029;
      label = 77;
     } else {
      $241 = $t$1 >> 4;
      $242 = (13029 + ($241)|0);
      $a$0 = $$lcssa344;$fl$4 = $fl$3;$p$2 = $p$1;$pl$1 = 2;$prefix$1 = $242;
      label = 77;
     }
    }
   }
   else if ((label|0) == 76) {
    label = 0;
    $288 = (_fmt_u($286,$287,$1)|0);
    $a$0 = $288;$fl$4 = $fl$1$;$p$2 = $p$0;$pl$1 = $pl$0;$prefix$1 = $prefix$0;
    label = 77;
   }
   else if ((label|0) == 82) {
    label = 0;
    $320 = (_memchr($a$1,0,$p$0)|0);
    $321 = ($320|0)==(0|0);
    $322 = $320;
    $323 = $a$1;
    $324 = (($322) - ($323))|0;
    $325 = (($a$1) + ($p$0)|0);
    $z$1 = $321 ? $325 : $320;
    $p$3 = $321 ? $p$0 : $324;
    $a$2 = $a$1;$fl$6 = $175;$p$5 = $p$3;$pl$2 = 0;$prefix$2 = 13029;$z$2 = $z$1;
   }
   else if ((label|0) == 86) {
    label = 0;
    $333 = HEAP32[$arg>>2]|0;
    $i$0114 = 0;$l$1113 = 0;$ws$0115 = $333;
    while(1) {
     $334 = HEAP32[$ws$0115>>2]|0;
     $335 = ($334|0)==(0);
     if ($335) {
      $i$0$lcssa = $i$0114;$l$2 = $l$1113;
      break;
     }
     $336 = (_wctomb($mb,$334)|0);
     $337 = ($336|0)<(0);
     $338 = (($p$4198) - ($i$0114))|0;
     $339 = ($336>>>0)>($338>>>0);
     $or$cond20 = $337 | $339;
     if ($or$cond20) {
      $i$0$lcssa = $i$0114;$l$2 = $336;
      break;
     }
     $340 = ((($ws$0115)) + 4|0);
     $341 = (($336) + ($i$0114))|0;
     $342 = ($p$4198>>>0)>($341>>>0);
     if ($342) {
      $i$0114 = $341;$l$1113 = $336;$ws$0115 = $340;
     } else {
      $i$0$lcssa = $341;$l$2 = $336;
      break;
     }
    }
    $343 = ($l$2|0)<(0);
    if ($343) {
     $$0 = -1;
     break L1;
    }
    _pad($f,32,$w$1,$i$0$lcssa,$fl$1$);
    $344 = ($i$0$lcssa|0)==(0);
    if ($344) {
     $i$0$lcssa200 = 0;
     label = 98;
    } else {
     $345 = HEAP32[$arg>>2]|0;
     $i$1125 = 0;$ws$1126 = $345;
     while(1) {
      $346 = HEAP32[$ws$1126>>2]|0;
      $347 = ($346|0)==(0);
      if ($347) {
       $i$0$lcssa200 = $i$0$lcssa;
       label = 98;
       break L313;
      }
      $348 = ((($ws$1126)) + 4|0);
      $349 = (_wctomb($mb,$346)|0);
      $350 = (($349) + ($i$1125))|0;
      $351 = ($350|0)>($i$0$lcssa|0);
      if ($351) {
       $i$0$lcssa200 = $i$0$lcssa;
       label = 98;
       break L313;
      }
      $352 = HEAP32[$f>>2]|0;
      $353 = $352 & 32;
      $354 = ($353|0)==(0);
      if ($354) {
       (___fwritex($mb,$349,$f)|0);
      }
      $355 = ($350>>>0)<($i$0$lcssa>>>0);
      if ($355) {
       $i$1125 = $350;$ws$1126 = $348;
      } else {
       $i$0$lcssa200 = $i$0$lcssa;
       label = 98;
       break;
      }
     }
    }
   }
  } while(0);
  if ((label|0) == 98) {
   label = 0;
   $356 = $fl$1$ ^ 8192;
   _pad($f,32,$w$1,$i$0$lcssa200,$356);
   $357 = ($w$1|0)>($i$0$lcssa200|0);
   $358 = $357 ? $w$1 : $i$0$lcssa200;
   $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $358;$l10n$0 = $l10n$3;
   continue;
  }
  if ((label|0) == 77) {
   label = 0;
   $289 = ($p$2|0)>(-1);
   $290 = $fl$4 & -65537;
   $$fl$4 = $289 ? $290 : $fl$4;
   $291 = $arg;
   $292 = $291;
   $293 = HEAP32[$292>>2]|0;
   $294 = (($291) + 4)|0;
   $295 = $294;
   $296 = HEAP32[$295>>2]|0;
   $297 = ($293|0)!=(0);
   $298 = ($296|0)!=(0);
   $299 = $297 | $298;
   $300 = ($p$2|0)!=(0);
   $or$cond = $300 | $299;
   if ($or$cond) {
    $301 = $a$0;
    $302 = (($2) - ($301))|0;
    $303 = $299&1;
    $304 = $303 ^ 1;
    $305 = (($304) + ($302))|0;
    $306 = ($p$2|0)>($305|0);
    $p$2$ = $306 ? $p$2 : $305;
    $a$2 = $a$0;$fl$6 = $$fl$4;$p$5 = $p$2$;$pl$2 = $pl$1;$prefix$2 = $prefix$1;$z$2 = $1;
   } else {
    $a$2 = $1;$fl$6 = $$fl$4;$p$5 = 0;$pl$2 = $pl$1;$prefix$2 = $prefix$1;$z$2 = $1;
   }
  }
  $769 = $z$2;
  $770 = $a$2;
  $771 = (($769) - ($770))|0;
  $772 = ($p$5|0)<($771|0);
  $$p$5 = $772 ? $771 : $p$5;
  $773 = (($pl$2) + ($$p$5))|0;
  $774 = ($w$1|0)<($773|0);
  $w$2 = $774 ? $773 : $w$1;
  _pad($f,32,$w$2,$773,$fl$6);
  $775 = HEAP32[$f>>2]|0;
  $776 = $775 & 32;
  $777 = ($776|0)==(0);
  if ($777) {
   (___fwritex($prefix$2,$pl$2,$f)|0);
  }
  $778 = $fl$6 ^ 65536;
  _pad($f,48,$w$2,$773,$778);
  _pad($f,48,$$p$5,$771,0);
  $779 = HEAP32[$f>>2]|0;
  $780 = $779 & 32;
  $781 = ($780|0)==(0);
  if ($781) {
   (___fwritex($a$2,$771,$f)|0);
  }
  $782 = $fl$6 ^ 8192;
  _pad($f,32,$w$2,$773,$782);
  $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $w$2;$l10n$0 = $l10n$3;
 }
 L348: do {
  if ((label|0) == 245) {
   $783 = ($f|0)==(0|0);
   if ($783) {
    $784 = ($l10n$0$lcssa|0)==(0);
    if ($784) {
     $$0 = 0;
    } else {
     $i$2100 = 1;
     while(1) {
      $785 = (($nl_type) + ($i$2100<<2)|0);
      $786 = HEAP32[$785>>2]|0;
      $787 = ($786|0)==(0);
      if ($787) {
       $i$2100$lcssa = $i$2100;
       break;
      }
      $789 = (($nl_arg) + ($i$2100<<3)|0);
      _pop_arg($789,$786,$ap);
      $790 = (($i$2100) + 1)|0;
      $791 = ($790|0)<(10);
      if ($791) {
       $i$2100 = $790;
      } else {
       $$0 = 1;
       break L348;
      }
     }
     $788 = ($i$2100$lcssa|0)<(10);
     if ($788) {
      $i$398 = $i$2100$lcssa;
      while(1) {
       $794 = (($nl_type) + ($i$398<<2)|0);
       $795 = HEAP32[$794>>2]|0;
       $796 = ($795|0)==(0);
       $793 = (($i$398) + 1)|0;
       if (!($796)) {
        $$0 = -1;
        break L348;
       }
       $792 = ($793|0)<(10);
       if ($792) {
        $i$398 = $793;
       } else {
        $$0 = 1;
        break;
       }
      }
     } else {
      $$0 = 1;
     }
    }
   } else {
    $$0 = $cnt$1$lcssa;
   }
  }
 } while(0);
 STACKTOP = sp;return ($$0|0);
}
function _pop_arg($arg,$type,$ap) {
 $arg = $arg|0;
 $type = $type|0;
 $ap = $ap|0;
 var $$mask = 0, $$mask1 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = +0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = +0;
 var $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0;
 var $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0;
 var $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0;
 var $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0;
 var $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $arglist_current = 0, $arglist_current11 = 0, $arglist_current14 = 0, $arglist_current17 = 0;
 var $arglist_current2 = 0, $arglist_current20 = 0, $arglist_current23 = 0, $arglist_current26 = 0, $arglist_current5 = 0, $arglist_current8 = 0, $arglist_next = 0, $arglist_next12 = 0, $arglist_next15 = 0, $arglist_next18 = 0, $arglist_next21 = 0, $arglist_next24 = 0, $arglist_next27 = 0, $arglist_next3 = 0, $arglist_next6 = 0, $arglist_next9 = 0, $expanded = 0, $expanded28 = 0, $expanded30 = 0, $expanded31 = 0;
 var $expanded32 = 0, $expanded34 = 0, $expanded35 = 0, $expanded37 = 0, $expanded38 = 0, $expanded39 = 0, $expanded41 = 0, $expanded42 = 0, $expanded44 = 0, $expanded45 = 0, $expanded46 = 0, $expanded48 = 0, $expanded49 = 0, $expanded51 = 0, $expanded52 = 0, $expanded53 = 0, $expanded55 = 0, $expanded56 = 0, $expanded58 = 0, $expanded59 = 0;
 var $expanded60 = 0, $expanded62 = 0, $expanded63 = 0, $expanded65 = 0, $expanded66 = 0, $expanded67 = 0, $expanded69 = 0, $expanded70 = 0, $expanded72 = 0, $expanded73 = 0, $expanded74 = 0, $expanded76 = 0, $expanded77 = 0, $expanded79 = 0, $expanded80 = 0, $expanded81 = 0, $expanded83 = 0, $expanded84 = 0, $expanded86 = 0, $expanded87 = 0;
 var $expanded88 = 0, $expanded90 = 0, $expanded91 = 0, $expanded93 = 0, $expanded94 = 0, $expanded95 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($type>>>0)>(20);
 L1: do {
  if (!($0)) {
   do {
    switch ($type|0) {
    case 9:  {
     $arglist_current = HEAP32[$ap>>2]|0;
     $1 = $arglist_current;
     $2 = ((0) + 4|0);
     $expanded28 = $2;
     $expanded = (($expanded28) - 1)|0;
     $3 = (($1) + ($expanded))|0;
     $4 = ((0) + 4|0);
     $expanded32 = $4;
     $expanded31 = (($expanded32) - 1)|0;
     $expanded30 = $expanded31 ^ -1;
     $5 = $3 & $expanded30;
     $6 = $5;
     $7 = HEAP32[$6>>2]|0;
     $arglist_next = ((($6)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next;
     HEAP32[$arg>>2] = $7;
     break L1;
     break;
    }
    case 10:  {
     $arglist_current2 = HEAP32[$ap>>2]|0;
     $8 = $arglist_current2;
     $9 = ((0) + 4|0);
     $expanded35 = $9;
     $expanded34 = (($expanded35) - 1)|0;
     $10 = (($8) + ($expanded34))|0;
     $11 = ((0) + 4|0);
     $expanded39 = $11;
     $expanded38 = (($expanded39) - 1)|0;
     $expanded37 = $expanded38 ^ -1;
     $12 = $10 & $expanded37;
     $13 = $12;
     $14 = HEAP32[$13>>2]|0;
     $arglist_next3 = ((($13)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next3;
     $15 = ($14|0)<(0);
     $16 = $15 << 31 >> 31;
     $17 = $arg;
     $18 = $17;
     HEAP32[$18>>2] = $14;
     $19 = (($17) + 4)|0;
     $20 = $19;
     HEAP32[$20>>2] = $16;
     break L1;
     break;
    }
    case 11:  {
     $arglist_current5 = HEAP32[$ap>>2]|0;
     $21 = $arglist_current5;
     $22 = ((0) + 4|0);
     $expanded42 = $22;
     $expanded41 = (($expanded42) - 1)|0;
     $23 = (($21) + ($expanded41))|0;
     $24 = ((0) + 4|0);
     $expanded46 = $24;
     $expanded45 = (($expanded46) - 1)|0;
     $expanded44 = $expanded45 ^ -1;
     $25 = $23 & $expanded44;
     $26 = $25;
     $27 = HEAP32[$26>>2]|0;
     $arglist_next6 = ((($26)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next6;
     $28 = $arg;
     $29 = $28;
     HEAP32[$29>>2] = $27;
     $30 = (($28) + 4)|0;
     $31 = $30;
     HEAP32[$31>>2] = 0;
     break L1;
     break;
    }
    case 12:  {
     $arglist_current8 = HEAP32[$ap>>2]|0;
     $32 = $arglist_current8;
     $33 = ((0) + 8|0);
     $expanded49 = $33;
     $expanded48 = (($expanded49) - 1)|0;
     $34 = (($32) + ($expanded48))|0;
     $35 = ((0) + 8|0);
     $expanded53 = $35;
     $expanded52 = (($expanded53) - 1)|0;
     $expanded51 = $expanded52 ^ -1;
     $36 = $34 & $expanded51;
     $37 = $36;
     $38 = $37;
     $39 = $38;
     $40 = HEAP32[$39>>2]|0;
     $41 = (($38) + 4)|0;
     $42 = $41;
     $43 = HEAP32[$42>>2]|0;
     $arglist_next9 = ((($37)) + 8|0);
     HEAP32[$ap>>2] = $arglist_next9;
     $44 = $arg;
     $45 = $44;
     HEAP32[$45>>2] = $40;
     $46 = (($44) + 4)|0;
     $47 = $46;
     HEAP32[$47>>2] = $43;
     break L1;
     break;
    }
    case 13:  {
     $arglist_current11 = HEAP32[$ap>>2]|0;
     $48 = $arglist_current11;
     $49 = ((0) + 4|0);
     $expanded56 = $49;
     $expanded55 = (($expanded56) - 1)|0;
     $50 = (($48) + ($expanded55))|0;
     $51 = ((0) + 4|0);
     $expanded60 = $51;
     $expanded59 = (($expanded60) - 1)|0;
     $expanded58 = $expanded59 ^ -1;
     $52 = $50 & $expanded58;
     $53 = $52;
     $54 = HEAP32[$53>>2]|0;
     $arglist_next12 = ((($53)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next12;
     $55 = $54&65535;
     $56 = $55 << 16 >> 16;
     $57 = ($56|0)<(0);
     $58 = $57 << 31 >> 31;
     $59 = $arg;
     $60 = $59;
     HEAP32[$60>>2] = $56;
     $61 = (($59) + 4)|0;
     $62 = $61;
     HEAP32[$62>>2] = $58;
     break L1;
     break;
    }
    case 14:  {
     $arglist_current14 = HEAP32[$ap>>2]|0;
     $63 = $arglist_current14;
     $64 = ((0) + 4|0);
     $expanded63 = $64;
     $expanded62 = (($expanded63) - 1)|0;
     $65 = (($63) + ($expanded62))|0;
     $66 = ((0) + 4|0);
     $expanded67 = $66;
     $expanded66 = (($expanded67) - 1)|0;
     $expanded65 = $expanded66 ^ -1;
     $67 = $65 & $expanded65;
     $68 = $67;
     $69 = HEAP32[$68>>2]|0;
     $arglist_next15 = ((($68)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next15;
     $$mask1 = $69 & 65535;
     $70 = $arg;
     $71 = $70;
     HEAP32[$71>>2] = $$mask1;
     $72 = (($70) + 4)|0;
     $73 = $72;
     HEAP32[$73>>2] = 0;
     break L1;
     break;
    }
    case 15:  {
     $arglist_current17 = HEAP32[$ap>>2]|0;
     $74 = $arglist_current17;
     $75 = ((0) + 4|0);
     $expanded70 = $75;
     $expanded69 = (($expanded70) - 1)|0;
     $76 = (($74) + ($expanded69))|0;
     $77 = ((0) + 4|0);
     $expanded74 = $77;
     $expanded73 = (($expanded74) - 1)|0;
     $expanded72 = $expanded73 ^ -1;
     $78 = $76 & $expanded72;
     $79 = $78;
     $80 = HEAP32[$79>>2]|0;
     $arglist_next18 = ((($79)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next18;
     $81 = $80&255;
     $82 = $81 << 24 >> 24;
     $83 = ($82|0)<(0);
     $84 = $83 << 31 >> 31;
     $85 = $arg;
     $86 = $85;
     HEAP32[$86>>2] = $82;
     $87 = (($85) + 4)|0;
     $88 = $87;
     HEAP32[$88>>2] = $84;
     break L1;
     break;
    }
    case 16:  {
     $arglist_current20 = HEAP32[$ap>>2]|0;
     $89 = $arglist_current20;
     $90 = ((0) + 4|0);
     $expanded77 = $90;
     $expanded76 = (($expanded77) - 1)|0;
     $91 = (($89) + ($expanded76))|0;
     $92 = ((0) + 4|0);
     $expanded81 = $92;
     $expanded80 = (($expanded81) - 1)|0;
     $expanded79 = $expanded80 ^ -1;
     $93 = $91 & $expanded79;
     $94 = $93;
     $95 = HEAP32[$94>>2]|0;
     $arglist_next21 = ((($94)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next21;
     $$mask = $95 & 255;
     $96 = $arg;
     $97 = $96;
     HEAP32[$97>>2] = $$mask;
     $98 = (($96) + 4)|0;
     $99 = $98;
     HEAP32[$99>>2] = 0;
     break L1;
     break;
    }
    case 17:  {
     $arglist_current23 = HEAP32[$ap>>2]|0;
     $100 = $arglist_current23;
     $101 = ((0) + 8|0);
     $expanded84 = $101;
     $expanded83 = (($expanded84) - 1)|0;
     $102 = (($100) + ($expanded83))|0;
     $103 = ((0) + 8|0);
     $expanded88 = $103;
     $expanded87 = (($expanded88) - 1)|0;
     $expanded86 = $expanded87 ^ -1;
     $104 = $102 & $expanded86;
     $105 = $104;
     $106 = +HEAPF64[$105>>3];
     $arglist_next24 = ((($105)) + 8|0);
     HEAP32[$ap>>2] = $arglist_next24;
     HEAPF64[$arg>>3] = $106;
     break L1;
     break;
    }
    case 18:  {
     $arglist_current26 = HEAP32[$ap>>2]|0;
     $107 = $arglist_current26;
     $108 = ((0) + 8|0);
     $expanded91 = $108;
     $expanded90 = (($expanded91) - 1)|0;
     $109 = (($107) + ($expanded90))|0;
     $110 = ((0) + 8|0);
     $expanded95 = $110;
     $expanded94 = (($expanded95) - 1)|0;
     $expanded93 = $expanded94 ^ -1;
     $111 = $109 & $expanded93;
     $112 = $111;
     $113 = +HEAPF64[$112>>3];
     $arglist_next27 = ((($112)) + 8|0);
     HEAP32[$ap>>2] = $arglist_next27;
     HEAPF64[$arg>>3] = $113;
     break L1;
     break;
    }
    default: {
     break L1;
    }
    }
   } while(0);
  }
 } while(0);
 return;
}
function _fmt_u($0,$1,$s) {
 $0 = $0|0;
 $1 = $1|0;
 $s = $s|0;
 var $$0$lcssa = 0, $$01$lcssa$off0 = 0, $$05 = 0, $$1$lcssa = 0, $$12 = 0, $$lcssa20 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $y$03 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $2 = ($1>>>0)>(0);
 $3 = ($0>>>0)>(4294967295);
 $4 = ($1|0)==(0);
 $5 = $4 & $3;
 $6 = $2 | $5;
 if ($6) {
  $$05 = $s;$7 = $0;$8 = $1;
  while(1) {
   $9 = (___uremdi3(($7|0),($8|0),10,0)|0);
   $10 = tempRet0;
   $11 = $9 | 48;
   $12 = $11&255;
   $13 = ((($$05)) + -1|0);
   HEAP8[$13>>0] = $12;
   $14 = (___udivdi3(($7|0),($8|0),10,0)|0);
   $15 = tempRet0;
   $16 = ($8>>>0)>(9);
   $17 = ($7>>>0)>(4294967295);
   $18 = ($8|0)==(9);
   $19 = $18 & $17;
   $20 = $16 | $19;
   if ($20) {
    $$05 = $13;$7 = $14;$8 = $15;
   } else {
    $$lcssa20 = $13;$28 = $14;$29 = $15;
    break;
   }
  }
  $$0$lcssa = $$lcssa20;$$01$lcssa$off0 = $28;
 } else {
  $$0$lcssa = $s;$$01$lcssa$off0 = $0;
 }
 $21 = ($$01$lcssa$off0|0)==(0);
 if ($21) {
  $$1$lcssa = $$0$lcssa;
 } else {
  $$12 = $$0$lcssa;$y$03 = $$01$lcssa$off0;
  while(1) {
   $22 = (($y$03>>>0) % 10)&-1;
   $23 = $22 | 48;
   $24 = $23&255;
   $25 = ((($$12)) + -1|0);
   HEAP8[$25>>0] = $24;
   $26 = (($y$03>>>0) / 10)&-1;
   $27 = ($y$03>>>0)<(10);
   if ($27) {
    $$1$lcssa = $25;
    break;
   } else {
    $$12 = $25;$y$03 = $26;
   }
  }
 }
 return ($$1$lcssa|0);
}
function _pad($f,$c,$w,$l,$fl) {
 $f = $f|0;
 $c = $c|0;
 $w = $w|0;
 $l = $l|0;
 $fl = $fl|0;
 var $$0$lcssa6 = 0, $$02 = 0, $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $or$cond = 0, $pad = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 256|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $pad = sp;
 $0 = $fl & 73728;
 $1 = ($0|0)==(0);
 $2 = ($w|0)>($l|0);
 $or$cond = $2 & $1;
 do {
  if ($or$cond) {
   $3 = (($w) - ($l))|0;
   $4 = ($3>>>0)>(256);
   $5 = $4 ? 256 : $3;
   _memset(($pad|0),($c|0),($5|0))|0;
   $6 = ($3>>>0)>(255);
   $7 = HEAP32[$f>>2]|0;
   $8 = $7 & 32;
   $9 = ($8|0)==(0);
   if ($6) {
    $10 = (($w) - ($l))|0;
    $$02 = $3;$17 = $7;$18 = $9;
    while(1) {
     if ($18) {
      (___fwritex($pad,256,$f)|0);
      $$pre = HEAP32[$f>>2]|0;
      $14 = $$pre;
     } else {
      $14 = $17;
     }
     $11 = (($$02) + -256)|0;
     $12 = ($11>>>0)>(255);
     $13 = $14 & 32;
     $15 = ($13|0)==(0);
     if ($12) {
      $$02 = $11;$17 = $14;$18 = $15;
     } else {
      break;
     }
    }
    $16 = $10 & 255;
    if ($15) {
     $$0$lcssa6 = $16;
    } else {
     break;
    }
   } else {
    if ($9) {
     $$0$lcssa6 = $3;
    } else {
     break;
    }
   }
   (___fwritex($pad,$$0$lcssa6,$f)|0);
  }
 } while(0);
 STACKTOP = sp;return;
}
function _malloc($bytes) {
 $bytes = $bytes|0;
 var $$3$i = 0, $$lcssa = 0, $$lcssa211 = 0, $$lcssa215 = 0, $$lcssa216 = 0, $$lcssa217 = 0, $$lcssa219 = 0, $$lcssa222 = 0, $$lcssa224 = 0, $$lcssa226 = 0, $$lcssa228 = 0, $$lcssa230 = 0, $$lcssa232 = 0, $$pre = 0, $$pre$i = 0, $$pre$i$i = 0, $$pre$i22$i = 0, $$pre$i25 = 0, $$pre$phi$i$iZ2D = 0, $$pre$phi$i23$iZ2D = 0;
 var $$pre$phi$i26Z2D = 0, $$pre$phi$iZ2D = 0, $$pre$phi58$i$iZ2D = 0, $$pre$phiZ2D = 0, $$pre105 = 0, $$pre106 = 0, $$pre14$i$i = 0, $$pre43$i = 0, $$pre56$i$i = 0, $$pre57$i$i = 0, $$pre8$i = 0, $$rsize$0$i = 0, $$rsize$3$i = 0, $$sum = 0, $$sum$i$i = 0, $$sum$i$i$i = 0, $$sum$i13$i = 0, $$sum$i14$i = 0, $$sum$i17$i = 0, $$sum$i19$i = 0;
 var $$sum$i2334 = 0, $$sum$i32 = 0, $$sum$i35 = 0, $$sum1 = 0, $$sum1$i = 0, $$sum1$i$i = 0, $$sum1$i15$i = 0, $$sum1$i20$i = 0, $$sum1$i24 = 0, $$sum10 = 0, $$sum10$i = 0, $$sum10$i$i = 0, $$sum11$i = 0, $$sum11$i$i = 0, $$sum1112 = 0, $$sum112$i = 0, $$sum113$i = 0, $$sum114$i = 0, $$sum115$i = 0, $$sum116$i = 0;
 var $$sum117$i = 0, $$sum118$i = 0, $$sum119$i = 0, $$sum12$i = 0, $$sum12$i$i = 0, $$sum120$i = 0, $$sum121$i = 0, $$sum122$i = 0, $$sum123$i = 0, $$sum124$i = 0, $$sum125$i = 0, $$sum13$i = 0, $$sum13$i$i = 0, $$sum14$i$i = 0, $$sum15$i = 0, $$sum15$i$i = 0, $$sum16$i = 0, $$sum16$i$i = 0, $$sum17$i = 0, $$sum17$i$i = 0;
 var $$sum18$i = 0, $$sum1819$i$i = 0, $$sum2 = 0, $$sum2$i = 0, $$sum2$i$i = 0, $$sum2$i$i$i = 0, $$sum2$i16$i = 0, $$sum2$i18$i = 0, $$sum2$i21$i = 0, $$sum20$i$i = 0, $$sum21$i$i = 0, $$sum22$i$i = 0, $$sum23$i$i = 0, $$sum24$i$i = 0, $$sum25$i$i = 0, $$sum27$i$i = 0, $$sum28$i$i = 0, $$sum29$i$i = 0, $$sum3$i = 0, $$sum3$i27 = 0;
 var $$sum30$i$i = 0, $$sum3132$i$i = 0, $$sum34$i$i = 0, $$sum3536$i$i = 0, $$sum3738$i$i = 0, $$sum39$i$i = 0, $$sum4 = 0, $$sum4$i = 0, $$sum4$i$i = 0, $$sum4$i28 = 0, $$sum40$i$i = 0, $$sum41$i$i = 0, $$sum42$i$i = 0, $$sum5$i = 0, $$sum5$i$i = 0, $$sum56 = 0, $$sum6$i = 0, $$sum67$i$i = 0, $$sum7$i = 0, $$sum8$i = 0;
 var $$sum9 = 0, $$sum9$i = 0, $$sum9$i$i = 0, $$tsize$1$i = 0, $$v$0$i = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $1000 = 0, $1001 = 0, $1002 = 0, $1003 = 0, $1004 = 0, $1005 = 0, $1006 = 0, $1007 = 0, $1008 = 0, $1009 = 0, $101 = 0;
 var $1010 = 0, $1011 = 0, $1012 = 0, $1013 = 0, $1014 = 0, $1015 = 0, $1016 = 0, $1017 = 0, $1018 = 0, $1019 = 0, $102 = 0, $1020 = 0, $1021 = 0, $1022 = 0, $1023 = 0, $1024 = 0, $1025 = 0, $1026 = 0, $1027 = 0, $1028 = 0;
 var $1029 = 0, $103 = 0, $1030 = 0, $1031 = 0, $1032 = 0, $1033 = 0, $1034 = 0, $1035 = 0, $1036 = 0, $1037 = 0, $1038 = 0, $1039 = 0, $104 = 0, $1040 = 0, $1041 = 0, $1042 = 0, $1043 = 0, $1044 = 0, $1045 = 0, $1046 = 0;
 var $1047 = 0, $1048 = 0, $1049 = 0, $105 = 0, $1050 = 0, $1051 = 0, $1052 = 0, $1053 = 0, $1054 = 0, $1055 = 0, $1056 = 0, $1057 = 0, $1058 = 0, $1059 = 0, $106 = 0, $1060 = 0, $1061 = 0, $1062 = 0, $1063 = 0, $1064 = 0;
 var $1065 = 0, $1066 = 0, $1067 = 0, $1068 = 0, $1069 = 0, $107 = 0, $1070 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0;
 var $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0;
 var $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0;
 var $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0;
 var $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0;
 var $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0;
 var $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0;
 var $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0;
 var $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0;
 var $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0;
 var $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0;
 var $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0;
 var $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0;
 var $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0;
 var $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = 0, $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0, $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0;
 var $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0, $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0;
 var $390 = 0, $391 = 0, $392 = 0, $393 = 0, $394 = 0, $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0, $40 = 0, $400 = 0, $401 = 0, $402 = 0, $403 = 0, $404 = 0, $405 = 0, $406 = 0, $407 = 0;
 var $408 = 0, $409 = 0, $41 = 0, $410 = 0, $411 = 0, $412 = 0, $413 = 0, $414 = 0, $415 = 0, $416 = 0, $417 = 0, $418 = 0, $419 = 0, $42 = 0, $420 = 0, $421 = 0, $422 = 0, $423 = 0, $424 = 0, $425 = 0;
 var $426 = 0, $427 = 0, $428 = 0, $429 = 0, $43 = 0, $430 = 0, $431 = 0, $432 = 0, $433 = 0, $434 = 0, $435 = 0, $436 = 0, $437 = 0, $438 = 0, $439 = 0, $44 = 0, $440 = 0, $441 = 0, $442 = 0, $443 = 0;
 var $444 = 0, $445 = 0, $446 = 0, $447 = 0, $448 = 0, $449 = 0, $45 = 0, $450 = 0, $451 = 0, $452 = 0, $453 = 0, $454 = 0, $455 = 0, $456 = 0, $457 = 0, $458 = 0, $459 = 0, $46 = 0, $460 = 0, $461 = 0;
 var $462 = 0, $463 = 0, $464 = 0, $465 = 0, $466 = 0, $467 = 0, $468 = 0, $469 = 0, $47 = 0, $470 = 0, $471 = 0, $472 = 0, $473 = 0, $474 = 0, $475 = 0, $476 = 0, $477 = 0, $478 = 0, $479 = 0, $48 = 0;
 var $480 = 0, $481 = 0, $482 = 0, $483 = 0, $484 = 0, $485 = 0, $486 = 0, $487 = 0, $488 = 0, $489 = 0, $49 = 0, $490 = 0, $491 = 0, $492 = 0, $493 = 0, $494 = 0, $495 = 0, $496 = 0, $497 = 0, $498 = 0;
 var $499 = 0, $5 = 0, $50 = 0, $500 = 0, $501 = 0, $502 = 0, $503 = 0, $504 = 0, $505 = 0, $506 = 0, $507 = 0, $508 = 0, $509 = 0, $51 = 0, $510 = 0, $511 = 0, $512 = 0, $513 = 0, $514 = 0, $515 = 0;
 var $516 = 0, $517 = 0, $518 = 0, $519 = 0, $52 = 0, $520 = 0, $521 = 0, $522 = 0, $523 = 0, $524 = 0, $525 = 0, $526 = 0, $527 = 0, $528 = 0, $529 = 0, $53 = 0, $530 = 0, $531 = 0, $532 = 0, $533 = 0;
 var $534 = 0, $535 = 0, $536 = 0, $537 = 0, $538 = 0, $539 = 0, $54 = 0, $540 = 0, $541 = 0, $542 = 0, $543 = 0, $544 = 0, $545 = 0, $546 = 0, $547 = 0, $548 = 0, $549 = 0, $55 = 0, $550 = 0, $551 = 0;
 var $552 = 0, $553 = 0, $554 = 0, $555 = 0, $556 = 0, $557 = 0, $558 = 0, $559 = 0, $56 = 0, $560 = 0, $561 = 0, $562 = 0, $563 = 0, $564 = 0, $565 = 0, $566 = 0, $567 = 0, $568 = 0, $569 = 0, $57 = 0;
 var $570 = 0, $571 = 0, $572 = 0, $573 = 0, $574 = 0, $575 = 0, $576 = 0, $577 = 0, $578 = 0, $579 = 0, $58 = 0, $580 = 0, $581 = 0, $582 = 0, $583 = 0, $584 = 0, $585 = 0, $586 = 0, $587 = 0, $588 = 0;
 var $589 = 0, $59 = 0, $590 = 0, $591 = 0, $592 = 0, $593 = 0, $594 = 0, $595 = 0, $596 = 0, $597 = 0, $598 = 0, $599 = 0, $6 = 0, $60 = 0, $600 = 0, $601 = 0, $602 = 0, $603 = 0, $604 = 0, $605 = 0;
 var $606 = 0, $607 = 0, $608 = 0, $609 = 0, $61 = 0, $610 = 0, $611 = 0, $612 = 0, $613 = 0, $614 = 0, $615 = 0, $616 = 0, $617 = 0, $618 = 0, $619 = 0, $62 = 0, $620 = 0, $621 = 0, $622 = 0, $623 = 0;
 var $624 = 0, $625 = 0, $626 = 0, $627 = 0, $628 = 0, $629 = 0, $63 = 0, $630 = 0, $631 = 0, $632 = 0, $633 = 0, $634 = 0, $635 = 0, $636 = 0, $637 = 0, $638 = 0, $639 = 0, $64 = 0, $640 = 0, $641 = 0;
 var $642 = 0, $643 = 0, $644 = 0, $645 = 0, $646 = 0, $647 = 0, $648 = 0, $649 = 0, $65 = 0, $650 = 0, $651 = 0, $652 = 0, $653 = 0, $654 = 0, $655 = 0, $656 = 0, $657 = 0, $658 = 0, $659 = 0, $66 = 0;
 var $660 = 0, $661 = 0, $662 = 0, $663 = 0, $664 = 0, $665 = 0, $666 = 0, $667 = 0, $668 = 0, $669 = 0, $67 = 0, $670 = 0, $671 = 0, $672 = 0, $673 = 0, $674 = 0, $675 = 0, $676 = 0, $677 = 0, $678 = 0;
 var $679 = 0, $68 = 0, $680 = 0, $681 = 0, $682 = 0, $683 = 0, $684 = 0, $685 = 0, $686 = 0, $687 = 0, $688 = 0, $689 = 0, $69 = 0, $690 = 0, $691 = 0, $692 = 0, $693 = 0, $694 = 0, $695 = 0, $696 = 0;
 var $697 = 0, $698 = 0, $699 = 0, $7 = 0, $70 = 0, $700 = 0, $701 = 0, $702 = 0, $703 = 0, $704 = 0, $705 = 0, $706 = 0, $707 = 0, $708 = 0, $709 = 0, $71 = 0, $710 = 0, $711 = 0, $712 = 0, $713 = 0;
 var $714 = 0, $715 = 0, $716 = 0, $717 = 0, $718 = 0, $719 = 0, $72 = 0, $720 = 0, $721 = 0, $722 = 0, $723 = 0, $724 = 0, $725 = 0, $726 = 0, $727 = 0, $728 = 0, $729 = 0, $73 = 0, $730 = 0, $731 = 0;
 var $732 = 0, $733 = 0, $734 = 0, $735 = 0, $736 = 0, $737 = 0, $738 = 0, $739 = 0, $74 = 0, $740 = 0, $741 = 0, $742 = 0, $743 = 0, $744 = 0, $745 = 0, $746 = 0, $747 = 0, $748 = 0, $749 = 0, $75 = 0;
 var $750 = 0, $751 = 0, $752 = 0, $753 = 0, $754 = 0, $755 = 0, $756 = 0, $757 = 0, $758 = 0, $759 = 0, $76 = 0, $760 = 0, $761 = 0, $762 = 0, $763 = 0, $764 = 0, $765 = 0, $766 = 0, $767 = 0, $768 = 0;
 var $769 = 0, $77 = 0, $770 = 0, $771 = 0, $772 = 0, $773 = 0, $774 = 0, $775 = 0, $776 = 0, $777 = 0, $778 = 0, $779 = 0, $78 = 0, $780 = 0, $781 = 0, $782 = 0, $783 = 0, $784 = 0, $785 = 0, $786 = 0;
 var $787 = 0, $788 = 0, $789 = 0, $79 = 0, $790 = 0, $791 = 0, $792 = 0, $793 = 0, $794 = 0, $795 = 0, $796 = 0, $797 = 0, $798 = 0, $799 = 0, $8 = 0, $80 = 0, $800 = 0, $801 = 0, $802 = 0, $803 = 0;
 var $804 = 0, $805 = 0, $806 = 0, $807 = 0, $808 = 0, $809 = 0, $81 = 0, $810 = 0, $811 = 0, $812 = 0, $813 = 0, $814 = 0, $815 = 0, $816 = 0, $817 = 0, $818 = 0, $819 = 0, $82 = 0, $820 = 0, $821 = 0;
 var $822 = 0, $823 = 0, $824 = 0, $825 = 0, $826 = 0, $827 = 0, $828 = 0, $829 = 0, $83 = 0, $830 = 0, $831 = 0, $832 = 0, $833 = 0, $834 = 0, $835 = 0, $836 = 0, $837 = 0, $838 = 0, $839 = 0, $84 = 0;
 var $840 = 0, $841 = 0, $842 = 0, $843 = 0, $844 = 0, $845 = 0, $846 = 0, $847 = 0, $848 = 0, $849 = 0, $85 = 0, $850 = 0, $851 = 0, $852 = 0, $853 = 0, $854 = 0, $855 = 0, $856 = 0, $857 = 0, $858 = 0;
 var $859 = 0, $86 = 0, $860 = 0, $861 = 0, $862 = 0, $863 = 0, $864 = 0, $865 = 0, $866 = 0, $867 = 0, $868 = 0, $869 = 0, $87 = 0, $870 = 0, $871 = 0, $872 = 0, $873 = 0, $874 = 0, $875 = 0, $876 = 0;
 var $877 = 0, $878 = 0, $879 = 0, $88 = 0, $880 = 0, $881 = 0, $882 = 0, $883 = 0, $884 = 0, $885 = 0, $886 = 0, $887 = 0, $888 = 0, $889 = 0, $89 = 0, $890 = 0, $891 = 0, $892 = 0, $893 = 0, $894 = 0;
 var $895 = 0, $896 = 0, $897 = 0, $898 = 0, $899 = 0, $9 = 0, $90 = 0, $900 = 0, $901 = 0, $902 = 0, $903 = 0, $904 = 0, $905 = 0, $906 = 0, $907 = 0, $908 = 0, $909 = 0, $91 = 0, $910 = 0, $911 = 0;
 var $912 = 0, $913 = 0, $914 = 0, $915 = 0, $916 = 0, $917 = 0, $918 = 0, $919 = 0, $92 = 0, $920 = 0, $921 = 0, $922 = 0, $923 = 0, $924 = 0, $925 = 0, $926 = 0, $927 = 0, $928 = 0, $929 = 0, $93 = 0;
 var $930 = 0, $931 = 0, $932 = 0, $933 = 0, $934 = 0, $935 = 0, $936 = 0, $937 = 0, $938 = 0, $939 = 0, $94 = 0, $940 = 0, $941 = 0, $942 = 0, $943 = 0, $944 = 0, $945 = 0, $946 = 0, $947 = 0, $948 = 0;
 var $949 = 0, $95 = 0, $950 = 0, $951 = 0, $952 = 0, $953 = 0, $954 = 0, $955 = 0, $956 = 0, $957 = 0, $958 = 0, $959 = 0, $96 = 0, $960 = 0, $961 = 0, $962 = 0, $963 = 0, $964 = 0, $965 = 0, $966 = 0;
 var $967 = 0, $968 = 0, $969 = 0, $97 = 0, $970 = 0, $971 = 0, $972 = 0, $973 = 0, $974 = 0, $975 = 0, $976 = 0, $977 = 0, $978 = 0, $979 = 0, $98 = 0, $980 = 0, $981 = 0, $982 = 0, $983 = 0, $984 = 0;
 var $985 = 0, $986 = 0, $987 = 0, $988 = 0, $989 = 0, $99 = 0, $990 = 0, $991 = 0, $992 = 0, $993 = 0, $994 = 0, $995 = 0, $996 = 0, $997 = 0, $998 = 0, $999 = 0, $F$0$i$i = 0, $F1$0$i = 0, $F4$0 = 0, $F4$0$i$i = 0;
 var $F5$0$i = 0, $I1$0$i$i = 0, $I7$0$i = 0, $I7$0$i$i = 0, $K12$029$i = 0, $K2$07$i$i = 0, $K8$051$i$i = 0, $R$0$i = 0, $R$0$i$i = 0, $R$0$i$i$lcssa = 0, $R$0$i$lcssa = 0, $R$0$i18 = 0, $R$0$i18$lcssa = 0, $R$1$i = 0, $R$1$i$i = 0, $R$1$i20 = 0, $RP$0$i = 0, $RP$0$i$i = 0, $RP$0$i$i$lcssa = 0, $RP$0$i$lcssa = 0;
 var $RP$0$i17 = 0, $RP$0$i17$lcssa = 0, $T$0$lcssa$i = 0, $T$0$lcssa$i$i = 0, $T$0$lcssa$i25$i = 0, $T$028$i = 0, $T$028$i$lcssa = 0, $T$050$i$i = 0, $T$050$i$i$lcssa = 0, $T$06$i$i = 0, $T$06$i$i$lcssa = 0, $br$0$ph$i = 0, $cond$i = 0, $cond$i$i = 0, $cond$i21 = 0, $exitcond$i$i = 0, $i$02$i$i = 0, $idx$0$i = 0, $mem$0 = 0, $nb$0 = 0;
 var $not$$i = 0, $not$$i$i = 0, $not$$i26$i = 0, $oldfirst$0$i$i = 0, $or$cond$i = 0, $or$cond$i30 = 0, $or$cond1$i = 0, $or$cond19$i = 0, $or$cond2$i = 0, $or$cond3$i = 0, $or$cond5$i = 0, $or$cond57$i = 0, $or$cond6$i = 0, $or$cond8$i = 0, $or$cond9$i = 0, $qsize$0$i$i = 0, $rsize$0$i = 0, $rsize$0$i$lcssa = 0, $rsize$0$i15 = 0, $rsize$1$i = 0;
 var $rsize$2$i = 0, $rsize$3$lcssa$i = 0, $rsize$331$i = 0, $rst$0$i = 0, $rst$1$i = 0, $sizebits$0$i = 0, $sp$0$i$i = 0, $sp$0$i$i$i = 0, $sp$084$i = 0, $sp$084$i$lcssa = 0, $sp$183$i = 0, $sp$183$i$lcssa = 0, $ssize$0$$i = 0, $ssize$0$i = 0, $ssize$1$ph$i = 0, $ssize$2$i = 0, $t$0$i = 0, $t$0$i14 = 0, $t$1$i = 0, $t$2$ph$i = 0;
 var $t$2$v$3$i = 0, $t$230$i = 0, $tbase$255$i = 0, $tsize$0$ph$i = 0, $tsize$0323944$i = 0, $tsize$1$i = 0, $tsize$254$i = 0, $v$0$i = 0, $v$0$i$lcssa = 0, $v$0$i16 = 0, $v$1$i = 0, $v$2$i = 0, $v$3$lcssa$i = 0, $v$3$ph$i = 0, $v$332$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($bytes>>>0)<(245);
 do {
  if ($0) {
   $1 = ($bytes>>>0)<(11);
   $2 = (($bytes) + 11)|0;
   $3 = $2 & -8;
   $4 = $1 ? 16 : $3;
   $5 = $4 >>> 3;
   $6 = HEAP32[8040>>2]|0;
   $7 = $6 >>> $5;
   $8 = $7 & 3;
   $9 = ($8|0)==(0);
   if (!($9)) {
    $10 = $7 & 1;
    $11 = $10 ^ 1;
    $12 = (($11) + ($5))|0;
    $13 = $12 << 1;
    $14 = (8080 + ($13<<2)|0);
    $$sum10 = (($13) + 2)|0;
    $15 = (8080 + ($$sum10<<2)|0);
    $16 = HEAP32[$15>>2]|0;
    $17 = ((($16)) + 8|0);
    $18 = HEAP32[$17>>2]|0;
    $19 = ($14|0)==($18|0);
    do {
     if ($19) {
      $20 = 1 << $12;
      $21 = $20 ^ -1;
      $22 = $6 & $21;
      HEAP32[8040>>2] = $22;
     } else {
      $23 = HEAP32[(8056)>>2]|0;
      $24 = ($18>>>0)<($23>>>0);
      if ($24) {
       _abort();
       // unreachable;
      }
      $25 = ((($18)) + 12|0);
      $26 = HEAP32[$25>>2]|0;
      $27 = ($26|0)==($16|0);
      if ($27) {
       HEAP32[$25>>2] = $14;
       HEAP32[$15>>2] = $18;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    } while(0);
    $28 = $12 << 3;
    $29 = $28 | 3;
    $30 = ((($16)) + 4|0);
    HEAP32[$30>>2] = $29;
    $$sum1112 = $28 | 4;
    $31 = (($16) + ($$sum1112)|0);
    $32 = HEAP32[$31>>2]|0;
    $33 = $32 | 1;
    HEAP32[$31>>2] = $33;
    $mem$0 = $17;
    return ($mem$0|0);
   }
   $34 = HEAP32[(8048)>>2]|0;
   $35 = ($4>>>0)>($34>>>0);
   if ($35) {
    $36 = ($7|0)==(0);
    if (!($36)) {
     $37 = $7 << $5;
     $38 = 2 << $5;
     $39 = (0 - ($38))|0;
     $40 = $38 | $39;
     $41 = $37 & $40;
     $42 = (0 - ($41))|0;
     $43 = $41 & $42;
     $44 = (($43) + -1)|0;
     $45 = $44 >>> 12;
     $46 = $45 & 16;
     $47 = $44 >>> $46;
     $48 = $47 >>> 5;
     $49 = $48 & 8;
     $50 = $49 | $46;
     $51 = $47 >>> $49;
     $52 = $51 >>> 2;
     $53 = $52 & 4;
     $54 = $50 | $53;
     $55 = $51 >>> $53;
     $56 = $55 >>> 1;
     $57 = $56 & 2;
     $58 = $54 | $57;
     $59 = $55 >>> $57;
     $60 = $59 >>> 1;
     $61 = $60 & 1;
     $62 = $58 | $61;
     $63 = $59 >>> $61;
     $64 = (($62) + ($63))|0;
     $65 = $64 << 1;
     $66 = (8080 + ($65<<2)|0);
     $$sum4 = (($65) + 2)|0;
     $67 = (8080 + ($$sum4<<2)|0);
     $68 = HEAP32[$67>>2]|0;
     $69 = ((($68)) + 8|0);
     $70 = HEAP32[$69>>2]|0;
     $71 = ($66|0)==($70|0);
     do {
      if ($71) {
       $72 = 1 << $64;
       $73 = $72 ^ -1;
       $74 = $6 & $73;
       HEAP32[8040>>2] = $74;
       $89 = $34;
      } else {
       $75 = HEAP32[(8056)>>2]|0;
       $76 = ($70>>>0)<($75>>>0);
       if ($76) {
        _abort();
        // unreachable;
       }
       $77 = ((($70)) + 12|0);
       $78 = HEAP32[$77>>2]|0;
       $79 = ($78|0)==($68|0);
       if ($79) {
        HEAP32[$77>>2] = $66;
        HEAP32[$67>>2] = $70;
        $$pre = HEAP32[(8048)>>2]|0;
        $89 = $$pre;
        break;
       } else {
        _abort();
        // unreachable;
       }
      }
     } while(0);
     $80 = $64 << 3;
     $81 = (($80) - ($4))|0;
     $82 = $4 | 3;
     $83 = ((($68)) + 4|0);
     HEAP32[$83>>2] = $82;
     $84 = (($68) + ($4)|0);
     $85 = $81 | 1;
     $$sum56 = $4 | 4;
     $86 = (($68) + ($$sum56)|0);
     HEAP32[$86>>2] = $85;
     $87 = (($68) + ($80)|0);
     HEAP32[$87>>2] = $81;
     $88 = ($89|0)==(0);
     if (!($88)) {
      $90 = HEAP32[(8060)>>2]|0;
      $91 = $89 >>> 3;
      $92 = $91 << 1;
      $93 = (8080 + ($92<<2)|0);
      $94 = HEAP32[8040>>2]|0;
      $95 = 1 << $91;
      $96 = $94 & $95;
      $97 = ($96|0)==(0);
      if ($97) {
       $98 = $94 | $95;
       HEAP32[8040>>2] = $98;
       $$pre105 = (($92) + 2)|0;
       $$pre106 = (8080 + ($$pre105<<2)|0);
       $$pre$phiZ2D = $$pre106;$F4$0 = $93;
      } else {
       $$sum9 = (($92) + 2)|0;
       $99 = (8080 + ($$sum9<<2)|0);
       $100 = HEAP32[$99>>2]|0;
       $101 = HEAP32[(8056)>>2]|0;
       $102 = ($100>>>0)<($101>>>0);
       if ($102) {
        _abort();
        // unreachable;
       } else {
        $$pre$phiZ2D = $99;$F4$0 = $100;
       }
      }
      HEAP32[$$pre$phiZ2D>>2] = $90;
      $103 = ((($F4$0)) + 12|0);
      HEAP32[$103>>2] = $90;
      $104 = ((($90)) + 8|0);
      HEAP32[$104>>2] = $F4$0;
      $105 = ((($90)) + 12|0);
      HEAP32[$105>>2] = $93;
     }
     HEAP32[(8048)>>2] = $81;
     HEAP32[(8060)>>2] = $84;
     $mem$0 = $69;
     return ($mem$0|0);
    }
    $106 = HEAP32[(8044)>>2]|0;
    $107 = ($106|0)==(0);
    if ($107) {
     $nb$0 = $4;
    } else {
     $108 = (0 - ($106))|0;
     $109 = $106 & $108;
     $110 = (($109) + -1)|0;
     $111 = $110 >>> 12;
     $112 = $111 & 16;
     $113 = $110 >>> $112;
     $114 = $113 >>> 5;
     $115 = $114 & 8;
     $116 = $115 | $112;
     $117 = $113 >>> $115;
     $118 = $117 >>> 2;
     $119 = $118 & 4;
     $120 = $116 | $119;
     $121 = $117 >>> $119;
     $122 = $121 >>> 1;
     $123 = $122 & 2;
     $124 = $120 | $123;
     $125 = $121 >>> $123;
     $126 = $125 >>> 1;
     $127 = $126 & 1;
     $128 = $124 | $127;
     $129 = $125 >>> $127;
     $130 = (($128) + ($129))|0;
     $131 = (8344 + ($130<<2)|0);
     $132 = HEAP32[$131>>2]|0;
     $133 = ((($132)) + 4|0);
     $134 = HEAP32[$133>>2]|0;
     $135 = $134 & -8;
     $136 = (($135) - ($4))|0;
     $rsize$0$i = $136;$t$0$i = $132;$v$0$i = $132;
     while(1) {
      $137 = ((($t$0$i)) + 16|0);
      $138 = HEAP32[$137>>2]|0;
      $139 = ($138|0)==(0|0);
      if ($139) {
       $140 = ((($t$0$i)) + 20|0);
       $141 = HEAP32[$140>>2]|0;
       $142 = ($141|0)==(0|0);
       if ($142) {
        $rsize$0$i$lcssa = $rsize$0$i;$v$0$i$lcssa = $v$0$i;
        break;
       } else {
        $144 = $141;
       }
      } else {
       $144 = $138;
      }
      $143 = ((($144)) + 4|0);
      $145 = HEAP32[$143>>2]|0;
      $146 = $145 & -8;
      $147 = (($146) - ($4))|0;
      $148 = ($147>>>0)<($rsize$0$i>>>0);
      $$rsize$0$i = $148 ? $147 : $rsize$0$i;
      $$v$0$i = $148 ? $144 : $v$0$i;
      $rsize$0$i = $$rsize$0$i;$t$0$i = $144;$v$0$i = $$v$0$i;
     }
     $149 = HEAP32[(8056)>>2]|0;
     $150 = ($v$0$i$lcssa>>>0)<($149>>>0);
     if ($150) {
      _abort();
      // unreachable;
     }
     $151 = (($v$0$i$lcssa) + ($4)|0);
     $152 = ($v$0$i$lcssa>>>0)<($151>>>0);
     if (!($152)) {
      _abort();
      // unreachable;
     }
     $153 = ((($v$0$i$lcssa)) + 24|0);
     $154 = HEAP32[$153>>2]|0;
     $155 = ((($v$0$i$lcssa)) + 12|0);
     $156 = HEAP32[$155>>2]|0;
     $157 = ($156|0)==($v$0$i$lcssa|0);
     do {
      if ($157) {
       $167 = ((($v$0$i$lcssa)) + 20|0);
       $168 = HEAP32[$167>>2]|0;
       $169 = ($168|0)==(0|0);
       if ($169) {
        $170 = ((($v$0$i$lcssa)) + 16|0);
        $171 = HEAP32[$170>>2]|0;
        $172 = ($171|0)==(0|0);
        if ($172) {
         $R$1$i = 0;
         break;
        } else {
         $R$0$i = $171;$RP$0$i = $170;
        }
       } else {
        $R$0$i = $168;$RP$0$i = $167;
       }
       while(1) {
        $173 = ((($R$0$i)) + 20|0);
        $174 = HEAP32[$173>>2]|0;
        $175 = ($174|0)==(0|0);
        if (!($175)) {
         $R$0$i = $174;$RP$0$i = $173;
         continue;
        }
        $176 = ((($R$0$i)) + 16|0);
        $177 = HEAP32[$176>>2]|0;
        $178 = ($177|0)==(0|0);
        if ($178) {
         $R$0$i$lcssa = $R$0$i;$RP$0$i$lcssa = $RP$0$i;
         break;
        } else {
         $R$0$i = $177;$RP$0$i = $176;
        }
       }
       $179 = ($RP$0$i$lcssa>>>0)<($149>>>0);
       if ($179) {
        _abort();
        // unreachable;
       } else {
        HEAP32[$RP$0$i$lcssa>>2] = 0;
        $R$1$i = $R$0$i$lcssa;
        break;
       }
      } else {
       $158 = ((($v$0$i$lcssa)) + 8|0);
       $159 = HEAP32[$158>>2]|0;
       $160 = ($159>>>0)<($149>>>0);
       if ($160) {
        _abort();
        // unreachable;
       }
       $161 = ((($159)) + 12|0);
       $162 = HEAP32[$161>>2]|0;
       $163 = ($162|0)==($v$0$i$lcssa|0);
       if (!($163)) {
        _abort();
        // unreachable;
       }
       $164 = ((($156)) + 8|0);
       $165 = HEAP32[$164>>2]|0;
       $166 = ($165|0)==($v$0$i$lcssa|0);
       if ($166) {
        HEAP32[$161>>2] = $156;
        HEAP32[$164>>2] = $159;
        $R$1$i = $156;
        break;
       } else {
        _abort();
        // unreachable;
       }
      }
     } while(0);
     $180 = ($154|0)==(0|0);
     do {
      if (!($180)) {
       $181 = ((($v$0$i$lcssa)) + 28|0);
       $182 = HEAP32[$181>>2]|0;
       $183 = (8344 + ($182<<2)|0);
       $184 = HEAP32[$183>>2]|0;
       $185 = ($v$0$i$lcssa|0)==($184|0);
       if ($185) {
        HEAP32[$183>>2] = $R$1$i;
        $cond$i = ($R$1$i|0)==(0|0);
        if ($cond$i) {
         $186 = 1 << $182;
         $187 = $186 ^ -1;
         $188 = HEAP32[(8044)>>2]|0;
         $189 = $188 & $187;
         HEAP32[(8044)>>2] = $189;
         break;
        }
       } else {
        $190 = HEAP32[(8056)>>2]|0;
        $191 = ($154>>>0)<($190>>>0);
        if ($191) {
         _abort();
         // unreachable;
        }
        $192 = ((($154)) + 16|0);
        $193 = HEAP32[$192>>2]|0;
        $194 = ($193|0)==($v$0$i$lcssa|0);
        if ($194) {
         HEAP32[$192>>2] = $R$1$i;
        } else {
         $195 = ((($154)) + 20|0);
         HEAP32[$195>>2] = $R$1$i;
        }
        $196 = ($R$1$i|0)==(0|0);
        if ($196) {
         break;
        }
       }
       $197 = HEAP32[(8056)>>2]|0;
       $198 = ($R$1$i>>>0)<($197>>>0);
       if ($198) {
        _abort();
        // unreachable;
       }
       $199 = ((($R$1$i)) + 24|0);
       HEAP32[$199>>2] = $154;
       $200 = ((($v$0$i$lcssa)) + 16|0);
       $201 = HEAP32[$200>>2]|0;
       $202 = ($201|0)==(0|0);
       do {
        if (!($202)) {
         $203 = ($201>>>0)<($197>>>0);
         if ($203) {
          _abort();
          // unreachable;
         } else {
          $204 = ((($R$1$i)) + 16|0);
          HEAP32[$204>>2] = $201;
          $205 = ((($201)) + 24|0);
          HEAP32[$205>>2] = $R$1$i;
          break;
         }
        }
       } while(0);
       $206 = ((($v$0$i$lcssa)) + 20|0);
       $207 = HEAP32[$206>>2]|0;
       $208 = ($207|0)==(0|0);
       if (!($208)) {
        $209 = HEAP32[(8056)>>2]|0;
        $210 = ($207>>>0)<($209>>>0);
        if ($210) {
         _abort();
         // unreachable;
        } else {
         $211 = ((($R$1$i)) + 20|0);
         HEAP32[$211>>2] = $207;
         $212 = ((($207)) + 24|0);
         HEAP32[$212>>2] = $R$1$i;
         break;
        }
       }
      }
     } while(0);
     $213 = ($rsize$0$i$lcssa>>>0)<(16);
     if ($213) {
      $214 = (($rsize$0$i$lcssa) + ($4))|0;
      $215 = $214 | 3;
      $216 = ((($v$0$i$lcssa)) + 4|0);
      HEAP32[$216>>2] = $215;
      $$sum4$i = (($214) + 4)|0;
      $217 = (($v$0$i$lcssa) + ($$sum4$i)|0);
      $218 = HEAP32[$217>>2]|0;
      $219 = $218 | 1;
      HEAP32[$217>>2] = $219;
     } else {
      $220 = $4 | 3;
      $221 = ((($v$0$i$lcssa)) + 4|0);
      HEAP32[$221>>2] = $220;
      $222 = $rsize$0$i$lcssa | 1;
      $$sum$i35 = $4 | 4;
      $223 = (($v$0$i$lcssa) + ($$sum$i35)|0);
      HEAP32[$223>>2] = $222;
      $$sum1$i = (($rsize$0$i$lcssa) + ($4))|0;
      $224 = (($v$0$i$lcssa) + ($$sum1$i)|0);
      HEAP32[$224>>2] = $rsize$0$i$lcssa;
      $225 = HEAP32[(8048)>>2]|0;
      $226 = ($225|0)==(0);
      if (!($226)) {
       $227 = HEAP32[(8060)>>2]|0;
       $228 = $225 >>> 3;
       $229 = $228 << 1;
       $230 = (8080 + ($229<<2)|0);
       $231 = HEAP32[8040>>2]|0;
       $232 = 1 << $228;
       $233 = $231 & $232;
       $234 = ($233|0)==(0);
       if ($234) {
        $235 = $231 | $232;
        HEAP32[8040>>2] = $235;
        $$pre$i = (($229) + 2)|0;
        $$pre8$i = (8080 + ($$pre$i<<2)|0);
        $$pre$phi$iZ2D = $$pre8$i;$F1$0$i = $230;
       } else {
        $$sum3$i = (($229) + 2)|0;
        $236 = (8080 + ($$sum3$i<<2)|0);
        $237 = HEAP32[$236>>2]|0;
        $238 = HEAP32[(8056)>>2]|0;
        $239 = ($237>>>0)<($238>>>0);
        if ($239) {
         _abort();
         // unreachable;
        } else {
         $$pre$phi$iZ2D = $236;$F1$0$i = $237;
        }
       }
       HEAP32[$$pre$phi$iZ2D>>2] = $227;
       $240 = ((($F1$0$i)) + 12|0);
       HEAP32[$240>>2] = $227;
       $241 = ((($227)) + 8|0);
       HEAP32[$241>>2] = $F1$0$i;
       $242 = ((($227)) + 12|0);
       HEAP32[$242>>2] = $230;
      }
      HEAP32[(8048)>>2] = $rsize$0$i$lcssa;
      HEAP32[(8060)>>2] = $151;
     }
     $243 = ((($v$0$i$lcssa)) + 8|0);
     $mem$0 = $243;
     return ($mem$0|0);
    }
   } else {
    $nb$0 = $4;
   }
  } else {
   $244 = ($bytes>>>0)>(4294967231);
   if ($244) {
    $nb$0 = -1;
   } else {
    $245 = (($bytes) + 11)|0;
    $246 = $245 & -8;
    $247 = HEAP32[(8044)>>2]|0;
    $248 = ($247|0)==(0);
    if ($248) {
     $nb$0 = $246;
    } else {
     $249 = (0 - ($246))|0;
     $250 = $245 >>> 8;
     $251 = ($250|0)==(0);
     if ($251) {
      $idx$0$i = 0;
     } else {
      $252 = ($246>>>0)>(16777215);
      if ($252) {
       $idx$0$i = 31;
      } else {
       $253 = (($250) + 1048320)|0;
       $254 = $253 >>> 16;
       $255 = $254 & 8;
       $256 = $250 << $255;
       $257 = (($256) + 520192)|0;
       $258 = $257 >>> 16;
       $259 = $258 & 4;
       $260 = $259 | $255;
       $261 = $256 << $259;
       $262 = (($261) + 245760)|0;
       $263 = $262 >>> 16;
       $264 = $263 & 2;
       $265 = $260 | $264;
       $266 = (14 - ($265))|0;
       $267 = $261 << $264;
       $268 = $267 >>> 15;
       $269 = (($266) + ($268))|0;
       $270 = $269 << 1;
       $271 = (($269) + 7)|0;
       $272 = $246 >>> $271;
       $273 = $272 & 1;
       $274 = $273 | $270;
       $idx$0$i = $274;
      }
     }
     $275 = (8344 + ($idx$0$i<<2)|0);
     $276 = HEAP32[$275>>2]|0;
     $277 = ($276|0)==(0|0);
     L123: do {
      if ($277) {
       $rsize$2$i = $249;$t$1$i = 0;$v$2$i = 0;
       label = 86;
      } else {
       $278 = ($idx$0$i|0)==(31);
       $279 = $idx$0$i >>> 1;
       $280 = (25 - ($279))|0;
       $281 = $278 ? 0 : $280;
       $282 = $246 << $281;
       $rsize$0$i15 = $249;$rst$0$i = 0;$sizebits$0$i = $282;$t$0$i14 = $276;$v$0$i16 = 0;
       while(1) {
        $283 = ((($t$0$i14)) + 4|0);
        $284 = HEAP32[$283>>2]|0;
        $285 = $284 & -8;
        $286 = (($285) - ($246))|0;
        $287 = ($286>>>0)<($rsize$0$i15>>>0);
        if ($287) {
         $288 = ($285|0)==($246|0);
         if ($288) {
          $rsize$331$i = $286;$t$230$i = $t$0$i14;$v$332$i = $t$0$i14;
          label = 90;
          break L123;
         } else {
          $rsize$1$i = $286;$v$1$i = $t$0$i14;
         }
        } else {
         $rsize$1$i = $rsize$0$i15;$v$1$i = $v$0$i16;
        }
        $289 = ((($t$0$i14)) + 20|0);
        $290 = HEAP32[$289>>2]|0;
        $291 = $sizebits$0$i >>> 31;
        $292 = (((($t$0$i14)) + 16|0) + ($291<<2)|0);
        $293 = HEAP32[$292>>2]|0;
        $294 = ($290|0)==(0|0);
        $295 = ($290|0)==($293|0);
        $or$cond19$i = $294 | $295;
        $rst$1$i = $or$cond19$i ? $rst$0$i : $290;
        $296 = ($293|0)==(0|0);
        $297 = $sizebits$0$i << 1;
        if ($296) {
         $rsize$2$i = $rsize$1$i;$t$1$i = $rst$1$i;$v$2$i = $v$1$i;
         label = 86;
         break;
        } else {
         $rsize$0$i15 = $rsize$1$i;$rst$0$i = $rst$1$i;$sizebits$0$i = $297;$t$0$i14 = $293;$v$0$i16 = $v$1$i;
        }
       }
      }
     } while(0);
     if ((label|0) == 86) {
      $298 = ($t$1$i|0)==(0|0);
      $299 = ($v$2$i|0)==(0|0);
      $or$cond$i = $298 & $299;
      if ($or$cond$i) {
       $300 = 2 << $idx$0$i;
       $301 = (0 - ($300))|0;
       $302 = $300 | $301;
       $303 = $247 & $302;
       $304 = ($303|0)==(0);
       if ($304) {
        $nb$0 = $246;
        break;
       }
       $305 = (0 - ($303))|0;
       $306 = $303 & $305;
       $307 = (($306) + -1)|0;
       $308 = $307 >>> 12;
       $309 = $308 & 16;
       $310 = $307 >>> $309;
       $311 = $310 >>> 5;
       $312 = $311 & 8;
       $313 = $312 | $309;
       $314 = $310 >>> $312;
       $315 = $314 >>> 2;
       $316 = $315 & 4;
       $317 = $313 | $316;
       $318 = $314 >>> $316;
       $319 = $318 >>> 1;
       $320 = $319 & 2;
       $321 = $317 | $320;
       $322 = $318 >>> $320;
       $323 = $322 >>> 1;
       $324 = $323 & 1;
       $325 = $321 | $324;
       $326 = $322 >>> $324;
       $327 = (($325) + ($326))|0;
       $328 = (8344 + ($327<<2)|0);
       $329 = HEAP32[$328>>2]|0;
       $t$2$ph$i = $329;$v$3$ph$i = 0;
      } else {
       $t$2$ph$i = $t$1$i;$v$3$ph$i = $v$2$i;
      }
      $330 = ($t$2$ph$i|0)==(0|0);
      if ($330) {
       $rsize$3$lcssa$i = $rsize$2$i;$v$3$lcssa$i = $v$3$ph$i;
      } else {
       $rsize$331$i = $rsize$2$i;$t$230$i = $t$2$ph$i;$v$332$i = $v$3$ph$i;
       label = 90;
      }
     }
     if ((label|0) == 90) {
      while(1) {
       label = 0;
       $331 = ((($t$230$i)) + 4|0);
       $332 = HEAP32[$331>>2]|0;
       $333 = $332 & -8;
       $334 = (($333) - ($246))|0;
       $335 = ($334>>>0)<($rsize$331$i>>>0);
       $$rsize$3$i = $335 ? $334 : $rsize$331$i;
       $t$2$v$3$i = $335 ? $t$230$i : $v$332$i;
       $336 = ((($t$230$i)) + 16|0);
       $337 = HEAP32[$336>>2]|0;
       $338 = ($337|0)==(0|0);
       if (!($338)) {
        $rsize$331$i = $$rsize$3$i;$t$230$i = $337;$v$332$i = $t$2$v$3$i;
        label = 90;
        continue;
       }
       $339 = ((($t$230$i)) + 20|0);
       $340 = HEAP32[$339>>2]|0;
       $341 = ($340|0)==(0|0);
       if ($341) {
        $rsize$3$lcssa$i = $$rsize$3$i;$v$3$lcssa$i = $t$2$v$3$i;
        break;
       } else {
        $rsize$331$i = $$rsize$3$i;$t$230$i = $340;$v$332$i = $t$2$v$3$i;
        label = 90;
       }
      }
     }
     $342 = ($v$3$lcssa$i|0)==(0|0);
     if ($342) {
      $nb$0 = $246;
     } else {
      $343 = HEAP32[(8048)>>2]|0;
      $344 = (($343) - ($246))|0;
      $345 = ($rsize$3$lcssa$i>>>0)<($344>>>0);
      if ($345) {
       $346 = HEAP32[(8056)>>2]|0;
       $347 = ($v$3$lcssa$i>>>0)<($346>>>0);
       if ($347) {
        _abort();
        // unreachable;
       }
       $348 = (($v$3$lcssa$i) + ($246)|0);
       $349 = ($v$3$lcssa$i>>>0)<($348>>>0);
       if (!($349)) {
        _abort();
        // unreachable;
       }
       $350 = ((($v$3$lcssa$i)) + 24|0);
       $351 = HEAP32[$350>>2]|0;
       $352 = ((($v$3$lcssa$i)) + 12|0);
       $353 = HEAP32[$352>>2]|0;
       $354 = ($353|0)==($v$3$lcssa$i|0);
       do {
        if ($354) {
         $364 = ((($v$3$lcssa$i)) + 20|0);
         $365 = HEAP32[$364>>2]|0;
         $366 = ($365|0)==(0|0);
         if ($366) {
          $367 = ((($v$3$lcssa$i)) + 16|0);
          $368 = HEAP32[$367>>2]|0;
          $369 = ($368|0)==(0|0);
          if ($369) {
           $R$1$i20 = 0;
           break;
          } else {
           $R$0$i18 = $368;$RP$0$i17 = $367;
          }
         } else {
          $R$0$i18 = $365;$RP$0$i17 = $364;
         }
         while(1) {
          $370 = ((($R$0$i18)) + 20|0);
          $371 = HEAP32[$370>>2]|0;
          $372 = ($371|0)==(0|0);
          if (!($372)) {
           $R$0$i18 = $371;$RP$0$i17 = $370;
           continue;
          }
          $373 = ((($R$0$i18)) + 16|0);
          $374 = HEAP32[$373>>2]|0;
          $375 = ($374|0)==(0|0);
          if ($375) {
           $R$0$i18$lcssa = $R$0$i18;$RP$0$i17$lcssa = $RP$0$i17;
           break;
          } else {
           $R$0$i18 = $374;$RP$0$i17 = $373;
          }
         }
         $376 = ($RP$0$i17$lcssa>>>0)<($346>>>0);
         if ($376) {
          _abort();
          // unreachable;
         } else {
          HEAP32[$RP$0$i17$lcssa>>2] = 0;
          $R$1$i20 = $R$0$i18$lcssa;
          break;
         }
        } else {
         $355 = ((($v$3$lcssa$i)) + 8|0);
         $356 = HEAP32[$355>>2]|0;
         $357 = ($356>>>0)<($346>>>0);
         if ($357) {
          _abort();
          // unreachable;
         }
         $358 = ((($356)) + 12|0);
         $359 = HEAP32[$358>>2]|0;
         $360 = ($359|0)==($v$3$lcssa$i|0);
         if (!($360)) {
          _abort();
          // unreachable;
         }
         $361 = ((($353)) + 8|0);
         $362 = HEAP32[$361>>2]|0;
         $363 = ($362|0)==($v$3$lcssa$i|0);
         if ($363) {
          HEAP32[$358>>2] = $353;
          HEAP32[$361>>2] = $356;
          $R$1$i20 = $353;
          break;
         } else {
          _abort();
          // unreachable;
         }
        }
       } while(0);
       $377 = ($351|0)==(0|0);
       do {
        if (!($377)) {
         $378 = ((($v$3$lcssa$i)) + 28|0);
         $379 = HEAP32[$378>>2]|0;
         $380 = (8344 + ($379<<2)|0);
         $381 = HEAP32[$380>>2]|0;
         $382 = ($v$3$lcssa$i|0)==($381|0);
         if ($382) {
          HEAP32[$380>>2] = $R$1$i20;
          $cond$i21 = ($R$1$i20|0)==(0|0);
          if ($cond$i21) {
           $383 = 1 << $379;
           $384 = $383 ^ -1;
           $385 = HEAP32[(8044)>>2]|0;
           $386 = $385 & $384;
           HEAP32[(8044)>>2] = $386;
           break;
          }
         } else {
          $387 = HEAP32[(8056)>>2]|0;
          $388 = ($351>>>0)<($387>>>0);
          if ($388) {
           _abort();
           // unreachable;
          }
          $389 = ((($351)) + 16|0);
          $390 = HEAP32[$389>>2]|0;
          $391 = ($390|0)==($v$3$lcssa$i|0);
          if ($391) {
           HEAP32[$389>>2] = $R$1$i20;
          } else {
           $392 = ((($351)) + 20|0);
           HEAP32[$392>>2] = $R$1$i20;
          }
          $393 = ($R$1$i20|0)==(0|0);
          if ($393) {
           break;
          }
         }
         $394 = HEAP32[(8056)>>2]|0;
         $395 = ($R$1$i20>>>0)<($394>>>0);
         if ($395) {
          _abort();
          // unreachable;
         }
         $396 = ((($R$1$i20)) + 24|0);
         HEAP32[$396>>2] = $351;
         $397 = ((($v$3$lcssa$i)) + 16|0);
         $398 = HEAP32[$397>>2]|0;
         $399 = ($398|0)==(0|0);
         do {
          if (!($399)) {
           $400 = ($398>>>0)<($394>>>0);
           if ($400) {
            _abort();
            // unreachable;
           } else {
            $401 = ((($R$1$i20)) + 16|0);
            HEAP32[$401>>2] = $398;
            $402 = ((($398)) + 24|0);
            HEAP32[$402>>2] = $R$1$i20;
            break;
           }
          }
         } while(0);
         $403 = ((($v$3$lcssa$i)) + 20|0);
         $404 = HEAP32[$403>>2]|0;
         $405 = ($404|0)==(0|0);
         if (!($405)) {
          $406 = HEAP32[(8056)>>2]|0;
          $407 = ($404>>>0)<($406>>>0);
          if ($407) {
           _abort();
           // unreachable;
          } else {
           $408 = ((($R$1$i20)) + 20|0);
           HEAP32[$408>>2] = $404;
           $409 = ((($404)) + 24|0);
           HEAP32[$409>>2] = $R$1$i20;
           break;
          }
         }
        }
       } while(0);
       $410 = ($rsize$3$lcssa$i>>>0)<(16);
       L199: do {
        if ($410) {
         $411 = (($rsize$3$lcssa$i) + ($246))|0;
         $412 = $411 | 3;
         $413 = ((($v$3$lcssa$i)) + 4|0);
         HEAP32[$413>>2] = $412;
         $$sum18$i = (($411) + 4)|0;
         $414 = (($v$3$lcssa$i) + ($$sum18$i)|0);
         $415 = HEAP32[$414>>2]|0;
         $416 = $415 | 1;
         HEAP32[$414>>2] = $416;
        } else {
         $417 = $246 | 3;
         $418 = ((($v$3$lcssa$i)) + 4|0);
         HEAP32[$418>>2] = $417;
         $419 = $rsize$3$lcssa$i | 1;
         $$sum$i2334 = $246 | 4;
         $420 = (($v$3$lcssa$i) + ($$sum$i2334)|0);
         HEAP32[$420>>2] = $419;
         $$sum1$i24 = (($rsize$3$lcssa$i) + ($246))|0;
         $421 = (($v$3$lcssa$i) + ($$sum1$i24)|0);
         HEAP32[$421>>2] = $rsize$3$lcssa$i;
         $422 = $rsize$3$lcssa$i >>> 3;
         $423 = ($rsize$3$lcssa$i>>>0)<(256);
         if ($423) {
          $424 = $422 << 1;
          $425 = (8080 + ($424<<2)|0);
          $426 = HEAP32[8040>>2]|0;
          $427 = 1 << $422;
          $428 = $426 & $427;
          $429 = ($428|0)==(0);
          if ($429) {
           $430 = $426 | $427;
           HEAP32[8040>>2] = $430;
           $$pre$i25 = (($424) + 2)|0;
           $$pre43$i = (8080 + ($$pre$i25<<2)|0);
           $$pre$phi$i26Z2D = $$pre43$i;$F5$0$i = $425;
          } else {
           $$sum17$i = (($424) + 2)|0;
           $431 = (8080 + ($$sum17$i<<2)|0);
           $432 = HEAP32[$431>>2]|0;
           $433 = HEAP32[(8056)>>2]|0;
           $434 = ($432>>>0)<($433>>>0);
           if ($434) {
            _abort();
            // unreachable;
           } else {
            $$pre$phi$i26Z2D = $431;$F5$0$i = $432;
           }
          }
          HEAP32[$$pre$phi$i26Z2D>>2] = $348;
          $435 = ((($F5$0$i)) + 12|0);
          HEAP32[$435>>2] = $348;
          $$sum15$i = (($246) + 8)|0;
          $436 = (($v$3$lcssa$i) + ($$sum15$i)|0);
          HEAP32[$436>>2] = $F5$0$i;
          $$sum16$i = (($246) + 12)|0;
          $437 = (($v$3$lcssa$i) + ($$sum16$i)|0);
          HEAP32[$437>>2] = $425;
          break;
         }
         $438 = $rsize$3$lcssa$i >>> 8;
         $439 = ($438|0)==(0);
         if ($439) {
          $I7$0$i = 0;
         } else {
          $440 = ($rsize$3$lcssa$i>>>0)>(16777215);
          if ($440) {
           $I7$0$i = 31;
          } else {
           $441 = (($438) + 1048320)|0;
           $442 = $441 >>> 16;
           $443 = $442 & 8;
           $444 = $438 << $443;
           $445 = (($444) + 520192)|0;
           $446 = $445 >>> 16;
           $447 = $446 & 4;
           $448 = $447 | $443;
           $449 = $444 << $447;
           $450 = (($449) + 245760)|0;
           $451 = $450 >>> 16;
           $452 = $451 & 2;
           $453 = $448 | $452;
           $454 = (14 - ($453))|0;
           $455 = $449 << $452;
           $456 = $455 >>> 15;
           $457 = (($454) + ($456))|0;
           $458 = $457 << 1;
           $459 = (($457) + 7)|0;
           $460 = $rsize$3$lcssa$i >>> $459;
           $461 = $460 & 1;
           $462 = $461 | $458;
           $I7$0$i = $462;
          }
         }
         $463 = (8344 + ($I7$0$i<<2)|0);
         $$sum2$i = (($246) + 28)|0;
         $464 = (($v$3$lcssa$i) + ($$sum2$i)|0);
         HEAP32[$464>>2] = $I7$0$i;
         $$sum3$i27 = (($246) + 16)|0;
         $465 = (($v$3$lcssa$i) + ($$sum3$i27)|0);
         $$sum4$i28 = (($246) + 20)|0;
         $466 = (($v$3$lcssa$i) + ($$sum4$i28)|0);
         HEAP32[$466>>2] = 0;
         HEAP32[$465>>2] = 0;
         $467 = HEAP32[(8044)>>2]|0;
         $468 = 1 << $I7$0$i;
         $469 = $467 & $468;
         $470 = ($469|0)==(0);
         if ($470) {
          $471 = $467 | $468;
          HEAP32[(8044)>>2] = $471;
          HEAP32[$463>>2] = $348;
          $$sum5$i = (($246) + 24)|0;
          $472 = (($v$3$lcssa$i) + ($$sum5$i)|0);
          HEAP32[$472>>2] = $463;
          $$sum6$i = (($246) + 12)|0;
          $473 = (($v$3$lcssa$i) + ($$sum6$i)|0);
          HEAP32[$473>>2] = $348;
          $$sum7$i = (($246) + 8)|0;
          $474 = (($v$3$lcssa$i) + ($$sum7$i)|0);
          HEAP32[$474>>2] = $348;
          break;
         }
         $475 = HEAP32[$463>>2]|0;
         $476 = ((($475)) + 4|0);
         $477 = HEAP32[$476>>2]|0;
         $478 = $477 & -8;
         $479 = ($478|0)==($rsize$3$lcssa$i|0);
         L217: do {
          if ($479) {
           $T$0$lcssa$i = $475;
          } else {
           $480 = ($I7$0$i|0)==(31);
           $481 = $I7$0$i >>> 1;
           $482 = (25 - ($481))|0;
           $483 = $480 ? 0 : $482;
           $484 = $rsize$3$lcssa$i << $483;
           $K12$029$i = $484;$T$028$i = $475;
           while(1) {
            $491 = $K12$029$i >>> 31;
            $492 = (((($T$028$i)) + 16|0) + ($491<<2)|0);
            $487 = HEAP32[$492>>2]|0;
            $493 = ($487|0)==(0|0);
            if ($493) {
             $$lcssa232 = $492;$T$028$i$lcssa = $T$028$i;
             break;
            }
            $485 = $K12$029$i << 1;
            $486 = ((($487)) + 4|0);
            $488 = HEAP32[$486>>2]|0;
            $489 = $488 & -8;
            $490 = ($489|0)==($rsize$3$lcssa$i|0);
            if ($490) {
             $T$0$lcssa$i = $487;
             break L217;
            } else {
             $K12$029$i = $485;$T$028$i = $487;
            }
           }
           $494 = HEAP32[(8056)>>2]|0;
           $495 = ($$lcssa232>>>0)<($494>>>0);
           if ($495) {
            _abort();
            // unreachable;
           } else {
            HEAP32[$$lcssa232>>2] = $348;
            $$sum11$i = (($246) + 24)|0;
            $496 = (($v$3$lcssa$i) + ($$sum11$i)|0);
            HEAP32[$496>>2] = $T$028$i$lcssa;
            $$sum12$i = (($246) + 12)|0;
            $497 = (($v$3$lcssa$i) + ($$sum12$i)|0);
            HEAP32[$497>>2] = $348;
            $$sum13$i = (($246) + 8)|0;
            $498 = (($v$3$lcssa$i) + ($$sum13$i)|0);
            HEAP32[$498>>2] = $348;
            break L199;
           }
          }
         } while(0);
         $499 = ((($T$0$lcssa$i)) + 8|0);
         $500 = HEAP32[$499>>2]|0;
         $501 = HEAP32[(8056)>>2]|0;
         $502 = ($500>>>0)>=($501>>>0);
         $not$$i = ($T$0$lcssa$i>>>0)>=($501>>>0);
         $503 = $502 & $not$$i;
         if ($503) {
          $504 = ((($500)) + 12|0);
          HEAP32[$504>>2] = $348;
          HEAP32[$499>>2] = $348;
          $$sum8$i = (($246) + 8)|0;
          $505 = (($v$3$lcssa$i) + ($$sum8$i)|0);
          HEAP32[$505>>2] = $500;
          $$sum9$i = (($246) + 12)|0;
          $506 = (($v$3$lcssa$i) + ($$sum9$i)|0);
          HEAP32[$506>>2] = $T$0$lcssa$i;
          $$sum10$i = (($246) + 24)|0;
          $507 = (($v$3$lcssa$i) + ($$sum10$i)|0);
          HEAP32[$507>>2] = 0;
          break;
         } else {
          _abort();
          // unreachable;
         }
        }
       } while(0);
       $508 = ((($v$3$lcssa$i)) + 8|0);
       $mem$0 = $508;
       return ($mem$0|0);
      } else {
       $nb$0 = $246;
      }
     }
    }
   }
  }
 } while(0);
 $509 = HEAP32[(8048)>>2]|0;
 $510 = ($509>>>0)<($nb$0>>>0);
 if (!($510)) {
  $511 = (($509) - ($nb$0))|0;
  $512 = HEAP32[(8060)>>2]|0;
  $513 = ($511>>>0)>(15);
  if ($513) {
   $514 = (($512) + ($nb$0)|0);
   HEAP32[(8060)>>2] = $514;
   HEAP32[(8048)>>2] = $511;
   $515 = $511 | 1;
   $$sum2 = (($nb$0) + 4)|0;
   $516 = (($512) + ($$sum2)|0);
   HEAP32[$516>>2] = $515;
   $517 = (($512) + ($509)|0);
   HEAP32[$517>>2] = $511;
   $518 = $nb$0 | 3;
   $519 = ((($512)) + 4|0);
   HEAP32[$519>>2] = $518;
  } else {
   HEAP32[(8048)>>2] = 0;
   HEAP32[(8060)>>2] = 0;
   $520 = $509 | 3;
   $521 = ((($512)) + 4|0);
   HEAP32[$521>>2] = $520;
   $$sum1 = (($509) + 4)|0;
   $522 = (($512) + ($$sum1)|0);
   $523 = HEAP32[$522>>2]|0;
   $524 = $523 | 1;
   HEAP32[$522>>2] = $524;
  }
  $525 = ((($512)) + 8|0);
  $mem$0 = $525;
  return ($mem$0|0);
 }
 $526 = HEAP32[(8052)>>2]|0;
 $527 = ($526>>>0)>($nb$0>>>0);
 if ($527) {
  $528 = (($526) - ($nb$0))|0;
  HEAP32[(8052)>>2] = $528;
  $529 = HEAP32[(8064)>>2]|0;
  $530 = (($529) + ($nb$0)|0);
  HEAP32[(8064)>>2] = $530;
  $531 = $528 | 1;
  $$sum = (($nb$0) + 4)|0;
  $532 = (($529) + ($$sum)|0);
  HEAP32[$532>>2] = $531;
  $533 = $nb$0 | 3;
  $534 = ((($529)) + 4|0);
  HEAP32[$534>>2] = $533;
  $535 = ((($529)) + 8|0);
  $mem$0 = $535;
  return ($mem$0|0);
 }
 $536 = HEAP32[8512>>2]|0;
 $537 = ($536|0)==(0);
 do {
  if ($537) {
   $538 = (_sysconf(30)|0);
   $539 = (($538) + -1)|0;
   $540 = $539 & $538;
   $541 = ($540|0)==(0);
   if ($541) {
    HEAP32[(8520)>>2] = $538;
    HEAP32[(8516)>>2] = $538;
    HEAP32[(8524)>>2] = -1;
    HEAP32[(8528)>>2] = -1;
    HEAP32[(8532)>>2] = 0;
    HEAP32[(8484)>>2] = 0;
    $542 = (_time((0|0))|0);
    $543 = $542 & -16;
    $544 = $543 ^ 1431655768;
    HEAP32[8512>>2] = $544;
    break;
   } else {
    _abort();
    // unreachable;
   }
  }
 } while(0);
 $545 = (($nb$0) + 48)|0;
 $546 = HEAP32[(8520)>>2]|0;
 $547 = (($nb$0) + 47)|0;
 $548 = (($546) + ($547))|0;
 $549 = (0 - ($546))|0;
 $550 = $548 & $549;
 $551 = ($550>>>0)>($nb$0>>>0);
 if (!($551)) {
  $mem$0 = 0;
  return ($mem$0|0);
 }
 $552 = HEAP32[(8480)>>2]|0;
 $553 = ($552|0)==(0);
 if (!($553)) {
  $554 = HEAP32[(8472)>>2]|0;
  $555 = (($554) + ($550))|0;
  $556 = ($555>>>0)<=($554>>>0);
  $557 = ($555>>>0)>($552>>>0);
  $or$cond1$i = $556 | $557;
  if ($or$cond1$i) {
   $mem$0 = 0;
   return ($mem$0|0);
  }
 }
 $558 = HEAP32[(8484)>>2]|0;
 $559 = $558 & 4;
 $560 = ($559|0)==(0);
 L258: do {
  if ($560) {
   $561 = HEAP32[(8064)>>2]|0;
   $562 = ($561|0)==(0|0);
   L260: do {
    if ($562) {
     label = 174;
    } else {
     $sp$0$i$i = (8488);
     while(1) {
      $563 = HEAP32[$sp$0$i$i>>2]|0;
      $564 = ($563>>>0)>($561>>>0);
      if (!($564)) {
       $565 = ((($sp$0$i$i)) + 4|0);
       $566 = HEAP32[$565>>2]|0;
       $567 = (($563) + ($566)|0);
       $568 = ($567>>>0)>($561>>>0);
       if ($568) {
        $$lcssa228 = $sp$0$i$i;$$lcssa230 = $565;
        break;
       }
      }
      $569 = ((($sp$0$i$i)) + 8|0);
      $570 = HEAP32[$569>>2]|0;
      $571 = ($570|0)==(0|0);
      if ($571) {
       label = 174;
       break L260;
      } else {
       $sp$0$i$i = $570;
      }
     }
     $594 = HEAP32[(8052)>>2]|0;
     $595 = (($548) - ($594))|0;
     $596 = $595 & $549;
     $597 = ($596>>>0)<(2147483647);
     if ($597) {
      $598 = (_sbrk(($596|0))|0);
      $599 = HEAP32[$$lcssa228>>2]|0;
      $600 = HEAP32[$$lcssa230>>2]|0;
      $601 = (($599) + ($600)|0);
      $602 = ($598|0)==($601|0);
      $$3$i = $602 ? $596 : 0;
      if ($602) {
       $603 = ($598|0)==((-1)|0);
       if ($603) {
        $tsize$0323944$i = $$3$i;
       } else {
        $tbase$255$i = $598;$tsize$254$i = $$3$i;
        label = 194;
        break L258;
       }
      } else {
       $br$0$ph$i = $598;$ssize$1$ph$i = $596;$tsize$0$ph$i = $$3$i;
       label = 184;
      }
     } else {
      $tsize$0323944$i = 0;
     }
    }
   } while(0);
   do {
    if ((label|0) == 174) {
     $572 = (_sbrk(0)|0);
     $573 = ($572|0)==((-1)|0);
     if ($573) {
      $tsize$0323944$i = 0;
     } else {
      $574 = $572;
      $575 = HEAP32[(8516)>>2]|0;
      $576 = (($575) + -1)|0;
      $577 = $576 & $574;
      $578 = ($577|0)==(0);
      if ($578) {
       $ssize$0$i = $550;
      } else {
       $579 = (($576) + ($574))|0;
       $580 = (0 - ($575))|0;
       $581 = $579 & $580;
       $582 = (($550) - ($574))|0;
       $583 = (($582) + ($581))|0;
       $ssize$0$i = $583;
      }
      $584 = HEAP32[(8472)>>2]|0;
      $585 = (($584) + ($ssize$0$i))|0;
      $586 = ($ssize$0$i>>>0)>($nb$0>>>0);
      $587 = ($ssize$0$i>>>0)<(2147483647);
      $or$cond$i30 = $586 & $587;
      if ($or$cond$i30) {
       $588 = HEAP32[(8480)>>2]|0;
       $589 = ($588|0)==(0);
       if (!($589)) {
        $590 = ($585>>>0)<=($584>>>0);
        $591 = ($585>>>0)>($588>>>0);
        $or$cond2$i = $590 | $591;
        if ($or$cond2$i) {
         $tsize$0323944$i = 0;
         break;
        }
       }
       $592 = (_sbrk(($ssize$0$i|0))|0);
       $593 = ($592|0)==($572|0);
       $ssize$0$$i = $593 ? $ssize$0$i : 0;
       if ($593) {
        $tbase$255$i = $572;$tsize$254$i = $ssize$0$$i;
        label = 194;
        break L258;
       } else {
        $br$0$ph$i = $592;$ssize$1$ph$i = $ssize$0$i;$tsize$0$ph$i = $ssize$0$$i;
        label = 184;
       }
      } else {
       $tsize$0323944$i = 0;
      }
     }
    }
   } while(0);
   L280: do {
    if ((label|0) == 184) {
     $604 = (0 - ($ssize$1$ph$i))|0;
     $605 = ($br$0$ph$i|0)!=((-1)|0);
     $606 = ($ssize$1$ph$i>>>0)<(2147483647);
     $or$cond5$i = $606 & $605;
     $607 = ($545>>>0)>($ssize$1$ph$i>>>0);
     $or$cond6$i = $607 & $or$cond5$i;
     do {
      if ($or$cond6$i) {
       $608 = HEAP32[(8520)>>2]|0;
       $609 = (($547) - ($ssize$1$ph$i))|0;
       $610 = (($609) + ($608))|0;
       $611 = (0 - ($608))|0;
       $612 = $610 & $611;
       $613 = ($612>>>0)<(2147483647);
       if ($613) {
        $614 = (_sbrk(($612|0))|0);
        $615 = ($614|0)==((-1)|0);
        if ($615) {
         (_sbrk(($604|0))|0);
         $tsize$0323944$i = $tsize$0$ph$i;
         break L280;
        } else {
         $616 = (($612) + ($ssize$1$ph$i))|0;
         $ssize$2$i = $616;
         break;
        }
       } else {
        $ssize$2$i = $ssize$1$ph$i;
       }
      } else {
       $ssize$2$i = $ssize$1$ph$i;
      }
     } while(0);
     $617 = ($br$0$ph$i|0)==((-1)|0);
     if ($617) {
      $tsize$0323944$i = $tsize$0$ph$i;
     } else {
      $tbase$255$i = $br$0$ph$i;$tsize$254$i = $ssize$2$i;
      label = 194;
      break L258;
     }
    }
   } while(0);
   $618 = HEAP32[(8484)>>2]|0;
   $619 = $618 | 4;
   HEAP32[(8484)>>2] = $619;
   $tsize$1$i = $tsize$0323944$i;
   label = 191;
  } else {
   $tsize$1$i = 0;
   label = 191;
  }
 } while(0);
 if ((label|0) == 191) {
  $620 = ($550>>>0)<(2147483647);
  if ($620) {
   $621 = (_sbrk(($550|0))|0);
   $622 = (_sbrk(0)|0);
   $623 = ($621|0)!=((-1)|0);
   $624 = ($622|0)!=((-1)|0);
   $or$cond3$i = $623 & $624;
   $625 = ($621>>>0)<($622>>>0);
   $or$cond8$i = $625 & $or$cond3$i;
   if ($or$cond8$i) {
    $626 = $622;
    $627 = $621;
    $628 = (($626) - ($627))|0;
    $629 = (($nb$0) + 40)|0;
    $630 = ($628>>>0)>($629>>>0);
    $$tsize$1$i = $630 ? $628 : $tsize$1$i;
    if ($630) {
     $tbase$255$i = $621;$tsize$254$i = $$tsize$1$i;
     label = 194;
    }
   }
  }
 }
 if ((label|0) == 194) {
  $631 = HEAP32[(8472)>>2]|0;
  $632 = (($631) + ($tsize$254$i))|0;
  HEAP32[(8472)>>2] = $632;
  $633 = HEAP32[(8476)>>2]|0;
  $634 = ($632>>>0)>($633>>>0);
  if ($634) {
   HEAP32[(8476)>>2] = $632;
  }
  $635 = HEAP32[(8064)>>2]|0;
  $636 = ($635|0)==(0|0);
  L299: do {
   if ($636) {
    $637 = HEAP32[(8056)>>2]|0;
    $638 = ($637|0)==(0|0);
    $639 = ($tbase$255$i>>>0)<($637>>>0);
    $or$cond9$i = $638 | $639;
    if ($or$cond9$i) {
     HEAP32[(8056)>>2] = $tbase$255$i;
    }
    HEAP32[(8488)>>2] = $tbase$255$i;
    HEAP32[(8492)>>2] = $tsize$254$i;
    HEAP32[(8500)>>2] = 0;
    $640 = HEAP32[8512>>2]|0;
    HEAP32[(8076)>>2] = $640;
    HEAP32[(8072)>>2] = -1;
    $i$02$i$i = 0;
    while(1) {
     $641 = $i$02$i$i << 1;
     $642 = (8080 + ($641<<2)|0);
     $$sum$i$i = (($641) + 3)|0;
     $643 = (8080 + ($$sum$i$i<<2)|0);
     HEAP32[$643>>2] = $642;
     $$sum1$i$i = (($641) + 2)|0;
     $644 = (8080 + ($$sum1$i$i<<2)|0);
     HEAP32[$644>>2] = $642;
     $645 = (($i$02$i$i) + 1)|0;
     $exitcond$i$i = ($645|0)==(32);
     if ($exitcond$i$i) {
      break;
     } else {
      $i$02$i$i = $645;
     }
    }
    $646 = (($tsize$254$i) + -40)|0;
    $647 = ((($tbase$255$i)) + 8|0);
    $648 = $647;
    $649 = $648 & 7;
    $650 = ($649|0)==(0);
    $651 = (0 - ($648))|0;
    $652 = $651 & 7;
    $653 = $650 ? 0 : $652;
    $654 = (($tbase$255$i) + ($653)|0);
    $655 = (($646) - ($653))|0;
    HEAP32[(8064)>>2] = $654;
    HEAP32[(8052)>>2] = $655;
    $656 = $655 | 1;
    $$sum$i13$i = (($653) + 4)|0;
    $657 = (($tbase$255$i) + ($$sum$i13$i)|0);
    HEAP32[$657>>2] = $656;
    $$sum2$i$i = (($tsize$254$i) + -36)|0;
    $658 = (($tbase$255$i) + ($$sum2$i$i)|0);
    HEAP32[$658>>2] = 40;
    $659 = HEAP32[(8528)>>2]|0;
    HEAP32[(8068)>>2] = $659;
   } else {
    $sp$084$i = (8488);
    while(1) {
     $660 = HEAP32[$sp$084$i>>2]|0;
     $661 = ((($sp$084$i)) + 4|0);
     $662 = HEAP32[$661>>2]|0;
     $663 = (($660) + ($662)|0);
     $664 = ($tbase$255$i|0)==($663|0);
     if ($664) {
      $$lcssa222 = $660;$$lcssa224 = $661;$$lcssa226 = $662;$sp$084$i$lcssa = $sp$084$i;
      label = 204;
      break;
     }
     $665 = ((($sp$084$i)) + 8|0);
     $666 = HEAP32[$665>>2]|0;
     $667 = ($666|0)==(0|0);
     if ($667) {
      break;
     } else {
      $sp$084$i = $666;
     }
    }
    if ((label|0) == 204) {
     $668 = ((($sp$084$i$lcssa)) + 12|0);
     $669 = HEAP32[$668>>2]|0;
     $670 = $669 & 8;
     $671 = ($670|0)==(0);
     if ($671) {
      $672 = ($635>>>0)>=($$lcssa222>>>0);
      $673 = ($635>>>0)<($tbase$255$i>>>0);
      $or$cond57$i = $673 & $672;
      if ($or$cond57$i) {
       $674 = (($$lcssa226) + ($tsize$254$i))|0;
       HEAP32[$$lcssa224>>2] = $674;
       $675 = HEAP32[(8052)>>2]|0;
       $676 = (($675) + ($tsize$254$i))|0;
       $677 = ((($635)) + 8|0);
       $678 = $677;
       $679 = $678 & 7;
       $680 = ($679|0)==(0);
       $681 = (0 - ($678))|0;
       $682 = $681 & 7;
       $683 = $680 ? 0 : $682;
       $684 = (($635) + ($683)|0);
       $685 = (($676) - ($683))|0;
       HEAP32[(8064)>>2] = $684;
       HEAP32[(8052)>>2] = $685;
       $686 = $685 | 1;
       $$sum$i17$i = (($683) + 4)|0;
       $687 = (($635) + ($$sum$i17$i)|0);
       HEAP32[$687>>2] = $686;
       $$sum2$i18$i = (($676) + 4)|0;
       $688 = (($635) + ($$sum2$i18$i)|0);
       HEAP32[$688>>2] = 40;
       $689 = HEAP32[(8528)>>2]|0;
       HEAP32[(8068)>>2] = $689;
       break;
      }
     }
    }
    $690 = HEAP32[(8056)>>2]|0;
    $691 = ($tbase$255$i>>>0)<($690>>>0);
    if ($691) {
     HEAP32[(8056)>>2] = $tbase$255$i;
     $755 = $tbase$255$i;
    } else {
     $755 = $690;
    }
    $692 = (($tbase$255$i) + ($tsize$254$i)|0);
    $sp$183$i = (8488);
    while(1) {
     $693 = HEAP32[$sp$183$i>>2]|0;
     $694 = ($693|0)==($692|0);
     if ($694) {
      $$lcssa219 = $sp$183$i;$sp$183$i$lcssa = $sp$183$i;
      label = 212;
      break;
     }
     $695 = ((($sp$183$i)) + 8|0);
     $696 = HEAP32[$695>>2]|0;
     $697 = ($696|0)==(0|0);
     if ($697) {
      $sp$0$i$i$i = (8488);
      break;
     } else {
      $sp$183$i = $696;
     }
    }
    if ((label|0) == 212) {
     $698 = ((($sp$183$i$lcssa)) + 12|0);
     $699 = HEAP32[$698>>2]|0;
     $700 = $699 & 8;
     $701 = ($700|0)==(0);
     if ($701) {
      HEAP32[$$lcssa219>>2] = $tbase$255$i;
      $702 = ((($sp$183$i$lcssa)) + 4|0);
      $703 = HEAP32[$702>>2]|0;
      $704 = (($703) + ($tsize$254$i))|0;
      HEAP32[$702>>2] = $704;
      $705 = ((($tbase$255$i)) + 8|0);
      $706 = $705;
      $707 = $706 & 7;
      $708 = ($707|0)==(0);
      $709 = (0 - ($706))|0;
      $710 = $709 & 7;
      $711 = $708 ? 0 : $710;
      $712 = (($tbase$255$i) + ($711)|0);
      $$sum112$i = (($tsize$254$i) + 8)|0;
      $713 = (($tbase$255$i) + ($$sum112$i)|0);
      $714 = $713;
      $715 = $714 & 7;
      $716 = ($715|0)==(0);
      $717 = (0 - ($714))|0;
      $718 = $717 & 7;
      $719 = $716 ? 0 : $718;
      $$sum113$i = (($719) + ($tsize$254$i))|0;
      $720 = (($tbase$255$i) + ($$sum113$i)|0);
      $721 = $720;
      $722 = $712;
      $723 = (($721) - ($722))|0;
      $$sum$i19$i = (($711) + ($nb$0))|0;
      $724 = (($tbase$255$i) + ($$sum$i19$i)|0);
      $725 = (($723) - ($nb$0))|0;
      $726 = $nb$0 | 3;
      $$sum1$i20$i = (($711) + 4)|0;
      $727 = (($tbase$255$i) + ($$sum1$i20$i)|0);
      HEAP32[$727>>2] = $726;
      $728 = ($720|0)==($635|0);
      L324: do {
       if ($728) {
        $729 = HEAP32[(8052)>>2]|0;
        $730 = (($729) + ($725))|0;
        HEAP32[(8052)>>2] = $730;
        HEAP32[(8064)>>2] = $724;
        $731 = $730 | 1;
        $$sum42$i$i = (($$sum$i19$i) + 4)|0;
        $732 = (($tbase$255$i) + ($$sum42$i$i)|0);
        HEAP32[$732>>2] = $731;
       } else {
        $733 = HEAP32[(8060)>>2]|0;
        $734 = ($720|0)==($733|0);
        if ($734) {
         $735 = HEAP32[(8048)>>2]|0;
         $736 = (($735) + ($725))|0;
         HEAP32[(8048)>>2] = $736;
         HEAP32[(8060)>>2] = $724;
         $737 = $736 | 1;
         $$sum40$i$i = (($$sum$i19$i) + 4)|0;
         $738 = (($tbase$255$i) + ($$sum40$i$i)|0);
         HEAP32[$738>>2] = $737;
         $$sum41$i$i = (($736) + ($$sum$i19$i))|0;
         $739 = (($tbase$255$i) + ($$sum41$i$i)|0);
         HEAP32[$739>>2] = $736;
         break;
        }
        $$sum2$i21$i = (($tsize$254$i) + 4)|0;
        $$sum114$i = (($$sum2$i21$i) + ($719))|0;
        $740 = (($tbase$255$i) + ($$sum114$i)|0);
        $741 = HEAP32[$740>>2]|0;
        $742 = $741 & 3;
        $743 = ($742|0)==(1);
        if ($743) {
         $744 = $741 & -8;
         $745 = $741 >>> 3;
         $746 = ($741>>>0)<(256);
         L332: do {
          if ($746) {
           $$sum3738$i$i = $719 | 8;
           $$sum124$i = (($$sum3738$i$i) + ($tsize$254$i))|0;
           $747 = (($tbase$255$i) + ($$sum124$i)|0);
           $748 = HEAP32[$747>>2]|0;
           $$sum39$i$i = (($tsize$254$i) + 12)|0;
           $$sum125$i = (($$sum39$i$i) + ($719))|0;
           $749 = (($tbase$255$i) + ($$sum125$i)|0);
           $750 = HEAP32[$749>>2]|0;
           $751 = $745 << 1;
           $752 = (8080 + ($751<<2)|0);
           $753 = ($748|0)==($752|0);
           do {
            if (!($753)) {
             $754 = ($748>>>0)<($755>>>0);
             if ($754) {
              _abort();
              // unreachable;
             }
             $756 = ((($748)) + 12|0);
             $757 = HEAP32[$756>>2]|0;
             $758 = ($757|0)==($720|0);
             if ($758) {
              break;
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $759 = ($750|0)==($748|0);
           if ($759) {
            $760 = 1 << $745;
            $761 = $760 ^ -1;
            $762 = HEAP32[8040>>2]|0;
            $763 = $762 & $761;
            HEAP32[8040>>2] = $763;
            break;
           }
           $764 = ($750|0)==($752|0);
           do {
            if ($764) {
             $$pre57$i$i = ((($750)) + 8|0);
             $$pre$phi58$i$iZ2D = $$pre57$i$i;
            } else {
             $765 = ($750>>>0)<($755>>>0);
             if ($765) {
              _abort();
              // unreachable;
             }
             $766 = ((($750)) + 8|0);
             $767 = HEAP32[$766>>2]|0;
             $768 = ($767|0)==($720|0);
             if ($768) {
              $$pre$phi58$i$iZ2D = $766;
              break;
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $769 = ((($748)) + 12|0);
           HEAP32[$769>>2] = $750;
           HEAP32[$$pre$phi58$i$iZ2D>>2] = $748;
          } else {
           $$sum34$i$i = $719 | 24;
           $$sum115$i = (($$sum34$i$i) + ($tsize$254$i))|0;
           $770 = (($tbase$255$i) + ($$sum115$i)|0);
           $771 = HEAP32[$770>>2]|0;
           $$sum5$i$i = (($tsize$254$i) + 12)|0;
           $$sum116$i = (($$sum5$i$i) + ($719))|0;
           $772 = (($tbase$255$i) + ($$sum116$i)|0);
           $773 = HEAP32[$772>>2]|0;
           $774 = ($773|0)==($720|0);
           do {
            if ($774) {
             $$sum67$i$i = $719 | 16;
             $$sum122$i = (($$sum2$i21$i) + ($$sum67$i$i))|0;
             $784 = (($tbase$255$i) + ($$sum122$i)|0);
             $785 = HEAP32[$784>>2]|0;
             $786 = ($785|0)==(0|0);
             if ($786) {
              $$sum123$i = (($$sum67$i$i) + ($tsize$254$i))|0;
              $787 = (($tbase$255$i) + ($$sum123$i)|0);
              $788 = HEAP32[$787>>2]|0;
              $789 = ($788|0)==(0|0);
              if ($789) {
               $R$1$i$i = 0;
               break;
              } else {
               $R$0$i$i = $788;$RP$0$i$i = $787;
              }
             } else {
              $R$0$i$i = $785;$RP$0$i$i = $784;
             }
             while(1) {
              $790 = ((($R$0$i$i)) + 20|0);
              $791 = HEAP32[$790>>2]|0;
              $792 = ($791|0)==(0|0);
              if (!($792)) {
               $R$0$i$i = $791;$RP$0$i$i = $790;
               continue;
              }
              $793 = ((($R$0$i$i)) + 16|0);
              $794 = HEAP32[$793>>2]|0;
              $795 = ($794|0)==(0|0);
              if ($795) {
               $R$0$i$i$lcssa = $R$0$i$i;$RP$0$i$i$lcssa = $RP$0$i$i;
               break;
              } else {
               $R$0$i$i = $794;$RP$0$i$i = $793;
              }
             }
             $796 = ($RP$0$i$i$lcssa>>>0)<($755>>>0);
             if ($796) {
              _abort();
              // unreachable;
             } else {
              HEAP32[$RP$0$i$i$lcssa>>2] = 0;
              $R$1$i$i = $R$0$i$i$lcssa;
              break;
             }
            } else {
             $$sum3536$i$i = $719 | 8;
             $$sum117$i = (($$sum3536$i$i) + ($tsize$254$i))|0;
             $775 = (($tbase$255$i) + ($$sum117$i)|0);
             $776 = HEAP32[$775>>2]|0;
             $777 = ($776>>>0)<($755>>>0);
             if ($777) {
              _abort();
              // unreachable;
             }
             $778 = ((($776)) + 12|0);
             $779 = HEAP32[$778>>2]|0;
             $780 = ($779|0)==($720|0);
             if (!($780)) {
              _abort();
              // unreachable;
             }
             $781 = ((($773)) + 8|0);
             $782 = HEAP32[$781>>2]|0;
             $783 = ($782|0)==($720|0);
             if ($783) {
              HEAP32[$778>>2] = $773;
              HEAP32[$781>>2] = $776;
              $R$1$i$i = $773;
              break;
             } else {
              _abort();
              // unreachable;
             }
            }
           } while(0);
           $797 = ($771|0)==(0|0);
           if ($797) {
            break;
           }
           $$sum30$i$i = (($tsize$254$i) + 28)|0;
           $$sum118$i = (($$sum30$i$i) + ($719))|0;
           $798 = (($tbase$255$i) + ($$sum118$i)|0);
           $799 = HEAP32[$798>>2]|0;
           $800 = (8344 + ($799<<2)|0);
           $801 = HEAP32[$800>>2]|0;
           $802 = ($720|0)==($801|0);
           do {
            if ($802) {
             HEAP32[$800>>2] = $R$1$i$i;
             $cond$i$i = ($R$1$i$i|0)==(0|0);
             if (!($cond$i$i)) {
              break;
             }
             $803 = 1 << $799;
             $804 = $803 ^ -1;
             $805 = HEAP32[(8044)>>2]|0;
             $806 = $805 & $804;
             HEAP32[(8044)>>2] = $806;
             break L332;
            } else {
             $807 = HEAP32[(8056)>>2]|0;
             $808 = ($771>>>0)<($807>>>0);
             if ($808) {
              _abort();
              // unreachable;
             }
             $809 = ((($771)) + 16|0);
             $810 = HEAP32[$809>>2]|0;
             $811 = ($810|0)==($720|0);
             if ($811) {
              HEAP32[$809>>2] = $R$1$i$i;
             } else {
              $812 = ((($771)) + 20|0);
              HEAP32[$812>>2] = $R$1$i$i;
             }
             $813 = ($R$1$i$i|0)==(0|0);
             if ($813) {
              break L332;
             }
            }
           } while(0);
           $814 = HEAP32[(8056)>>2]|0;
           $815 = ($R$1$i$i>>>0)<($814>>>0);
           if ($815) {
            _abort();
            // unreachable;
           }
           $816 = ((($R$1$i$i)) + 24|0);
           HEAP32[$816>>2] = $771;
           $$sum3132$i$i = $719 | 16;
           $$sum119$i = (($$sum3132$i$i) + ($tsize$254$i))|0;
           $817 = (($tbase$255$i) + ($$sum119$i)|0);
           $818 = HEAP32[$817>>2]|0;
           $819 = ($818|0)==(0|0);
           do {
            if (!($819)) {
             $820 = ($818>>>0)<($814>>>0);
             if ($820) {
              _abort();
              // unreachable;
             } else {
              $821 = ((($R$1$i$i)) + 16|0);
              HEAP32[$821>>2] = $818;
              $822 = ((($818)) + 24|0);
              HEAP32[$822>>2] = $R$1$i$i;
              break;
             }
            }
           } while(0);
           $$sum120$i = (($$sum2$i21$i) + ($$sum3132$i$i))|0;
           $823 = (($tbase$255$i) + ($$sum120$i)|0);
           $824 = HEAP32[$823>>2]|0;
           $825 = ($824|0)==(0|0);
           if ($825) {
            break;
           }
           $826 = HEAP32[(8056)>>2]|0;
           $827 = ($824>>>0)<($826>>>0);
           if ($827) {
            _abort();
            // unreachable;
           } else {
            $828 = ((($R$1$i$i)) + 20|0);
            HEAP32[$828>>2] = $824;
            $829 = ((($824)) + 24|0);
            HEAP32[$829>>2] = $R$1$i$i;
            break;
           }
          }
         } while(0);
         $$sum9$i$i = $744 | $719;
         $$sum121$i = (($$sum9$i$i) + ($tsize$254$i))|0;
         $830 = (($tbase$255$i) + ($$sum121$i)|0);
         $831 = (($744) + ($725))|0;
         $oldfirst$0$i$i = $830;$qsize$0$i$i = $831;
        } else {
         $oldfirst$0$i$i = $720;$qsize$0$i$i = $725;
        }
        $832 = ((($oldfirst$0$i$i)) + 4|0);
        $833 = HEAP32[$832>>2]|0;
        $834 = $833 & -2;
        HEAP32[$832>>2] = $834;
        $835 = $qsize$0$i$i | 1;
        $$sum10$i$i = (($$sum$i19$i) + 4)|0;
        $836 = (($tbase$255$i) + ($$sum10$i$i)|0);
        HEAP32[$836>>2] = $835;
        $$sum11$i$i = (($qsize$0$i$i) + ($$sum$i19$i))|0;
        $837 = (($tbase$255$i) + ($$sum11$i$i)|0);
        HEAP32[$837>>2] = $qsize$0$i$i;
        $838 = $qsize$0$i$i >>> 3;
        $839 = ($qsize$0$i$i>>>0)<(256);
        if ($839) {
         $840 = $838 << 1;
         $841 = (8080 + ($840<<2)|0);
         $842 = HEAP32[8040>>2]|0;
         $843 = 1 << $838;
         $844 = $842 & $843;
         $845 = ($844|0)==(0);
         do {
          if ($845) {
           $846 = $842 | $843;
           HEAP32[8040>>2] = $846;
           $$pre$i22$i = (($840) + 2)|0;
           $$pre56$i$i = (8080 + ($$pre$i22$i<<2)|0);
           $$pre$phi$i23$iZ2D = $$pre56$i$i;$F4$0$i$i = $841;
          } else {
           $$sum29$i$i = (($840) + 2)|0;
           $847 = (8080 + ($$sum29$i$i<<2)|0);
           $848 = HEAP32[$847>>2]|0;
           $849 = HEAP32[(8056)>>2]|0;
           $850 = ($848>>>0)<($849>>>0);
           if (!($850)) {
            $$pre$phi$i23$iZ2D = $847;$F4$0$i$i = $848;
            break;
           }
           _abort();
           // unreachable;
          }
         } while(0);
         HEAP32[$$pre$phi$i23$iZ2D>>2] = $724;
         $851 = ((($F4$0$i$i)) + 12|0);
         HEAP32[$851>>2] = $724;
         $$sum27$i$i = (($$sum$i19$i) + 8)|0;
         $852 = (($tbase$255$i) + ($$sum27$i$i)|0);
         HEAP32[$852>>2] = $F4$0$i$i;
         $$sum28$i$i = (($$sum$i19$i) + 12)|0;
         $853 = (($tbase$255$i) + ($$sum28$i$i)|0);
         HEAP32[$853>>2] = $841;
         break;
        }
        $854 = $qsize$0$i$i >>> 8;
        $855 = ($854|0)==(0);
        do {
         if ($855) {
          $I7$0$i$i = 0;
         } else {
          $856 = ($qsize$0$i$i>>>0)>(16777215);
          if ($856) {
           $I7$0$i$i = 31;
           break;
          }
          $857 = (($854) + 1048320)|0;
          $858 = $857 >>> 16;
          $859 = $858 & 8;
          $860 = $854 << $859;
          $861 = (($860) + 520192)|0;
          $862 = $861 >>> 16;
          $863 = $862 & 4;
          $864 = $863 | $859;
          $865 = $860 << $863;
          $866 = (($865) + 245760)|0;
          $867 = $866 >>> 16;
          $868 = $867 & 2;
          $869 = $864 | $868;
          $870 = (14 - ($869))|0;
          $871 = $865 << $868;
          $872 = $871 >>> 15;
          $873 = (($870) + ($872))|0;
          $874 = $873 << 1;
          $875 = (($873) + 7)|0;
          $876 = $qsize$0$i$i >>> $875;
          $877 = $876 & 1;
          $878 = $877 | $874;
          $I7$0$i$i = $878;
         }
        } while(0);
        $879 = (8344 + ($I7$0$i$i<<2)|0);
        $$sum12$i$i = (($$sum$i19$i) + 28)|0;
        $880 = (($tbase$255$i) + ($$sum12$i$i)|0);
        HEAP32[$880>>2] = $I7$0$i$i;
        $$sum13$i$i = (($$sum$i19$i) + 16)|0;
        $881 = (($tbase$255$i) + ($$sum13$i$i)|0);
        $$sum14$i$i = (($$sum$i19$i) + 20)|0;
        $882 = (($tbase$255$i) + ($$sum14$i$i)|0);
        HEAP32[$882>>2] = 0;
        HEAP32[$881>>2] = 0;
        $883 = HEAP32[(8044)>>2]|0;
        $884 = 1 << $I7$0$i$i;
        $885 = $883 & $884;
        $886 = ($885|0)==(0);
        if ($886) {
         $887 = $883 | $884;
         HEAP32[(8044)>>2] = $887;
         HEAP32[$879>>2] = $724;
         $$sum15$i$i = (($$sum$i19$i) + 24)|0;
         $888 = (($tbase$255$i) + ($$sum15$i$i)|0);
         HEAP32[$888>>2] = $879;
         $$sum16$i$i = (($$sum$i19$i) + 12)|0;
         $889 = (($tbase$255$i) + ($$sum16$i$i)|0);
         HEAP32[$889>>2] = $724;
         $$sum17$i$i = (($$sum$i19$i) + 8)|0;
         $890 = (($tbase$255$i) + ($$sum17$i$i)|0);
         HEAP32[$890>>2] = $724;
         break;
        }
        $891 = HEAP32[$879>>2]|0;
        $892 = ((($891)) + 4|0);
        $893 = HEAP32[$892>>2]|0;
        $894 = $893 & -8;
        $895 = ($894|0)==($qsize$0$i$i|0);
        L418: do {
         if ($895) {
          $T$0$lcssa$i25$i = $891;
         } else {
          $896 = ($I7$0$i$i|0)==(31);
          $897 = $I7$0$i$i >>> 1;
          $898 = (25 - ($897))|0;
          $899 = $896 ? 0 : $898;
          $900 = $qsize$0$i$i << $899;
          $K8$051$i$i = $900;$T$050$i$i = $891;
          while(1) {
           $907 = $K8$051$i$i >>> 31;
           $908 = (((($T$050$i$i)) + 16|0) + ($907<<2)|0);
           $903 = HEAP32[$908>>2]|0;
           $909 = ($903|0)==(0|0);
           if ($909) {
            $$lcssa = $908;$T$050$i$i$lcssa = $T$050$i$i;
            break;
           }
           $901 = $K8$051$i$i << 1;
           $902 = ((($903)) + 4|0);
           $904 = HEAP32[$902>>2]|0;
           $905 = $904 & -8;
           $906 = ($905|0)==($qsize$0$i$i|0);
           if ($906) {
            $T$0$lcssa$i25$i = $903;
            break L418;
           } else {
            $K8$051$i$i = $901;$T$050$i$i = $903;
           }
          }
          $910 = HEAP32[(8056)>>2]|0;
          $911 = ($$lcssa>>>0)<($910>>>0);
          if ($911) {
           _abort();
           // unreachable;
          } else {
           HEAP32[$$lcssa>>2] = $724;
           $$sum23$i$i = (($$sum$i19$i) + 24)|0;
           $912 = (($tbase$255$i) + ($$sum23$i$i)|0);
           HEAP32[$912>>2] = $T$050$i$i$lcssa;
           $$sum24$i$i = (($$sum$i19$i) + 12)|0;
           $913 = (($tbase$255$i) + ($$sum24$i$i)|0);
           HEAP32[$913>>2] = $724;
           $$sum25$i$i = (($$sum$i19$i) + 8)|0;
           $914 = (($tbase$255$i) + ($$sum25$i$i)|0);
           HEAP32[$914>>2] = $724;
           break L324;
          }
         }
        } while(0);
        $915 = ((($T$0$lcssa$i25$i)) + 8|0);
        $916 = HEAP32[$915>>2]|0;
        $917 = HEAP32[(8056)>>2]|0;
        $918 = ($916>>>0)>=($917>>>0);
        $not$$i26$i = ($T$0$lcssa$i25$i>>>0)>=($917>>>0);
        $919 = $918 & $not$$i26$i;
        if ($919) {
         $920 = ((($916)) + 12|0);
         HEAP32[$920>>2] = $724;
         HEAP32[$915>>2] = $724;
         $$sum20$i$i = (($$sum$i19$i) + 8)|0;
         $921 = (($tbase$255$i) + ($$sum20$i$i)|0);
         HEAP32[$921>>2] = $916;
         $$sum21$i$i = (($$sum$i19$i) + 12)|0;
         $922 = (($tbase$255$i) + ($$sum21$i$i)|0);
         HEAP32[$922>>2] = $T$0$lcssa$i25$i;
         $$sum22$i$i = (($$sum$i19$i) + 24)|0;
         $923 = (($tbase$255$i) + ($$sum22$i$i)|0);
         HEAP32[$923>>2] = 0;
         break;
        } else {
         _abort();
         // unreachable;
        }
       }
      } while(0);
      $$sum1819$i$i = $711 | 8;
      $924 = (($tbase$255$i) + ($$sum1819$i$i)|0);
      $mem$0 = $924;
      return ($mem$0|0);
     } else {
      $sp$0$i$i$i = (8488);
     }
    }
    while(1) {
     $925 = HEAP32[$sp$0$i$i$i>>2]|0;
     $926 = ($925>>>0)>($635>>>0);
     if (!($926)) {
      $927 = ((($sp$0$i$i$i)) + 4|0);
      $928 = HEAP32[$927>>2]|0;
      $929 = (($925) + ($928)|0);
      $930 = ($929>>>0)>($635>>>0);
      if ($930) {
       $$lcssa215 = $925;$$lcssa216 = $928;$$lcssa217 = $929;
       break;
      }
     }
     $931 = ((($sp$0$i$i$i)) + 8|0);
     $932 = HEAP32[$931>>2]|0;
     $sp$0$i$i$i = $932;
    }
    $$sum$i14$i = (($$lcssa216) + -47)|0;
    $$sum1$i15$i = (($$lcssa216) + -39)|0;
    $933 = (($$lcssa215) + ($$sum1$i15$i)|0);
    $934 = $933;
    $935 = $934 & 7;
    $936 = ($935|0)==(0);
    $937 = (0 - ($934))|0;
    $938 = $937 & 7;
    $939 = $936 ? 0 : $938;
    $$sum2$i16$i = (($$sum$i14$i) + ($939))|0;
    $940 = (($$lcssa215) + ($$sum2$i16$i)|0);
    $941 = ((($635)) + 16|0);
    $942 = ($940>>>0)<($941>>>0);
    $943 = $942 ? $635 : $940;
    $944 = ((($943)) + 8|0);
    $945 = (($tsize$254$i) + -40)|0;
    $946 = ((($tbase$255$i)) + 8|0);
    $947 = $946;
    $948 = $947 & 7;
    $949 = ($948|0)==(0);
    $950 = (0 - ($947))|0;
    $951 = $950 & 7;
    $952 = $949 ? 0 : $951;
    $953 = (($tbase$255$i) + ($952)|0);
    $954 = (($945) - ($952))|0;
    HEAP32[(8064)>>2] = $953;
    HEAP32[(8052)>>2] = $954;
    $955 = $954 | 1;
    $$sum$i$i$i = (($952) + 4)|0;
    $956 = (($tbase$255$i) + ($$sum$i$i$i)|0);
    HEAP32[$956>>2] = $955;
    $$sum2$i$i$i = (($tsize$254$i) + -36)|0;
    $957 = (($tbase$255$i) + ($$sum2$i$i$i)|0);
    HEAP32[$957>>2] = 40;
    $958 = HEAP32[(8528)>>2]|0;
    HEAP32[(8068)>>2] = $958;
    $959 = ((($943)) + 4|0);
    HEAP32[$959>>2] = 27;
    ;HEAP32[$944>>2]=HEAP32[(8488)>>2]|0;HEAP32[$944+4>>2]=HEAP32[(8488)+4>>2]|0;HEAP32[$944+8>>2]=HEAP32[(8488)+8>>2]|0;HEAP32[$944+12>>2]=HEAP32[(8488)+12>>2]|0;
    HEAP32[(8488)>>2] = $tbase$255$i;
    HEAP32[(8492)>>2] = $tsize$254$i;
    HEAP32[(8500)>>2] = 0;
    HEAP32[(8496)>>2] = $944;
    $960 = ((($943)) + 28|0);
    HEAP32[$960>>2] = 7;
    $961 = ((($943)) + 32|0);
    $962 = ($961>>>0)<($$lcssa217>>>0);
    if ($962) {
     $964 = $960;
     while(1) {
      $963 = ((($964)) + 4|0);
      HEAP32[$963>>2] = 7;
      $965 = ((($964)) + 8|0);
      $966 = ($965>>>0)<($$lcssa217>>>0);
      if ($966) {
       $964 = $963;
      } else {
       break;
      }
     }
    }
    $967 = ($943|0)==($635|0);
    if (!($967)) {
     $968 = $943;
     $969 = $635;
     $970 = (($968) - ($969))|0;
     $971 = HEAP32[$959>>2]|0;
     $972 = $971 & -2;
     HEAP32[$959>>2] = $972;
     $973 = $970 | 1;
     $974 = ((($635)) + 4|0);
     HEAP32[$974>>2] = $973;
     HEAP32[$943>>2] = $970;
     $975 = $970 >>> 3;
     $976 = ($970>>>0)<(256);
     if ($976) {
      $977 = $975 << 1;
      $978 = (8080 + ($977<<2)|0);
      $979 = HEAP32[8040>>2]|0;
      $980 = 1 << $975;
      $981 = $979 & $980;
      $982 = ($981|0)==(0);
      if ($982) {
       $983 = $979 | $980;
       HEAP32[8040>>2] = $983;
       $$pre$i$i = (($977) + 2)|0;
       $$pre14$i$i = (8080 + ($$pre$i$i<<2)|0);
       $$pre$phi$i$iZ2D = $$pre14$i$i;$F$0$i$i = $978;
      } else {
       $$sum4$i$i = (($977) + 2)|0;
       $984 = (8080 + ($$sum4$i$i<<2)|0);
       $985 = HEAP32[$984>>2]|0;
       $986 = HEAP32[(8056)>>2]|0;
       $987 = ($985>>>0)<($986>>>0);
       if ($987) {
        _abort();
        // unreachable;
       } else {
        $$pre$phi$i$iZ2D = $984;$F$0$i$i = $985;
       }
      }
      HEAP32[$$pre$phi$i$iZ2D>>2] = $635;
      $988 = ((($F$0$i$i)) + 12|0);
      HEAP32[$988>>2] = $635;
      $989 = ((($635)) + 8|0);
      HEAP32[$989>>2] = $F$0$i$i;
      $990 = ((($635)) + 12|0);
      HEAP32[$990>>2] = $978;
      break;
     }
     $991 = $970 >>> 8;
     $992 = ($991|0)==(0);
     if ($992) {
      $I1$0$i$i = 0;
     } else {
      $993 = ($970>>>0)>(16777215);
      if ($993) {
       $I1$0$i$i = 31;
      } else {
       $994 = (($991) + 1048320)|0;
       $995 = $994 >>> 16;
       $996 = $995 & 8;
       $997 = $991 << $996;
       $998 = (($997) + 520192)|0;
       $999 = $998 >>> 16;
       $1000 = $999 & 4;
       $1001 = $1000 | $996;
       $1002 = $997 << $1000;
       $1003 = (($1002) + 245760)|0;
       $1004 = $1003 >>> 16;
       $1005 = $1004 & 2;
       $1006 = $1001 | $1005;
       $1007 = (14 - ($1006))|0;
       $1008 = $1002 << $1005;
       $1009 = $1008 >>> 15;
       $1010 = (($1007) + ($1009))|0;
       $1011 = $1010 << 1;
       $1012 = (($1010) + 7)|0;
       $1013 = $970 >>> $1012;
       $1014 = $1013 & 1;
       $1015 = $1014 | $1011;
       $I1$0$i$i = $1015;
      }
     }
     $1016 = (8344 + ($I1$0$i$i<<2)|0);
     $1017 = ((($635)) + 28|0);
     HEAP32[$1017>>2] = $I1$0$i$i;
     $1018 = ((($635)) + 20|0);
     HEAP32[$1018>>2] = 0;
     HEAP32[$941>>2] = 0;
     $1019 = HEAP32[(8044)>>2]|0;
     $1020 = 1 << $I1$0$i$i;
     $1021 = $1019 & $1020;
     $1022 = ($1021|0)==(0);
     if ($1022) {
      $1023 = $1019 | $1020;
      HEAP32[(8044)>>2] = $1023;
      HEAP32[$1016>>2] = $635;
      $1024 = ((($635)) + 24|0);
      HEAP32[$1024>>2] = $1016;
      $1025 = ((($635)) + 12|0);
      HEAP32[$1025>>2] = $635;
      $1026 = ((($635)) + 8|0);
      HEAP32[$1026>>2] = $635;
      break;
     }
     $1027 = HEAP32[$1016>>2]|0;
     $1028 = ((($1027)) + 4|0);
     $1029 = HEAP32[$1028>>2]|0;
     $1030 = $1029 & -8;
     $1031 = ($1030|0)==($970|0);
     L459: do {
      if ($1031) {
       $T$0$lcssa$i$i = $1027;
      } else {
       $1032 = ($I1$0$i$i|0)==(31);
       $1033 = $I1$0$i$i >>> 1;
       $1034 = (25 - ($1033))|0;
       $1035 = $1032 ? 0 : $1034;
       $1036 = $970 << $1035;
       $K2$07$i$i = $1036;$T$06$i$i = $1027;
       while(1) {
        $1043 = $K2$07$i$i >>> 31;
        $1044 = (((($T$06$i$i)) + 16|0) + ($1043<<2)|0);
        $1039 = HEAP32[$1044>>2]|0;
        $1045 = ($1039|0)==(0|0);
        if ($1045) {
         $$lcssa211 = $1044;$T$06$i$i$lcssa = $T$06$i$i;
         break;
        }
        $1037 = $K2$07$i$i << 1;
        $1038 = ((($1039)) + 4|0);
        $1040 = HEAP32[$1038>>2]|0;
        $1041 = $1040 & -8;
        $1042 = ($1041|0)==($970|0);
        if ($1042) {
         $T$0$lcssa$i$i = $1039;
         break L459;
        } else {
         $K2$07$i$i = $1037;$T$06$i$i = $1039;
        }
       }
       $1046 = HEAP32[(8056)>>2]|0;
       $1047 = ($$lcssa211>>>0)<($1046>>>0);
       if ($1047) {
        _abort();
        // unreachable;
       } else {
        HEAP32[$$lcssa211>>2] = $635;
        $1048 = ((($635)) + 24|0);
        HEAP32[$1048>>2] = $T$06$i$i$lcssa;
        $1049 = ((($635)) + 12|0);
        HEAP32[$1049>>2] = $635;
        $1050 = ((($635)) + 8|0);
        HEAP32[$1050>>2] = $635;
        break L299;
       }
      }
     } while(0);
     $1051 = ((($T$0$lcssa$i$i)) + 8|0);
     $1052 = HEAP32[$1051>>2]|0;
     $1053 = HEAP32[(8056)>>2]|0;
     $1054 = ($1052>>>0)>=($1053>>>0);
     $not$$i$i = ($T$0$lcssa$i$i>>>0)>=($1053>>>0);
     $1055 = $1054 & $not$$i$i;
     if ($1055) {
      $1056 = ((($1052)) + 12|0);
      HEAP32[$1056>>2] = $635;
      HEAP32[$1051>>2] = $635;
      $1057 = ((($635)) + 8|0);
      HEAP32[$1057>>2] = $1052;
      $1058 = ((($635)) + 12|0);
      HEAP32[$1058>>2] = $T$0$lcssa$i$i;
      $1059 = ((($635)) + 24|0);
      HEAP32[$1059>>2] = 0;
      break;
     } else {
      _abort();
      // unreachable;
     }
    }
   }
  } while(0);
  $1060 = HEAP32[(8052)>>2]|0;
  $1061 = ($1060>>>0)>($nb$0>>>0);
  if ($1061) {
   $1062 = (($1060) - ($nb$0))|0;
   HEAP32[(8052)>>2] = $1062;
   $1063 = HEAP32[(8064)>>2]|0;
   $1064 = (($1063) + ($nb$0)|0);
   HEAP32[(8064)>>2] = $1064;
   $1065 = $1062 | 1;
   $$sum$i32 = (($nb$0) + 4)|0;
   $1066 = (($1063) + ($$sum$i32)|0);
   HEAP32[$1066>>2] = $1065;
   $1067 = $nb$0 | 3;
   $1068 = ((($1063)) + 4|0);
   HEAP32[$1068>>2] = $1067;
   $1069 = ((($1063)) + 8|0);
   $mem$0 = $1069;
   return ($mem$0|0);
  }
 }
 $1070 = (___errno_location()|0);
 HEAP32[$1070>>2] = 12;
 $mem$0 = 0;
 return ($mem$0|0);
}
function _free($mem) {
 $mem = $mem|0;
 var $$lcssa = 0, $$pre = 0, $$pre$phi59Z2D = 0, $$pre$phi61Z2D = 0, $$pre$phiZ2D = 0, $$pre57 = 0, $$pre58 = 0, $$pre60 = 0, $$sum = 0, $$sum11 = 0, $$sum12 = 0, $$sum13 = 0, $$sum14 = 0, $$sum1718 = 0, $$sum19 = 0, $$sum2 = 0, $$sum20 = 0, $$sum22 = 0, $$sum23 = 0, $$sum24 = 0;
 var $$sum25 = 0, $$sum26 = 0, $$sum27 = 0, $$sum28 = 0, $$sum29 = 0, $$sum3 = 0, $$sum30 = 0, $$sum31 = 0, $$sum5 = 0, $$sum67 = 0, $$sum8 = 0, $$sum9 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0;
 var $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0;
 var $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0;
 var $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0;
 var $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0;
 var $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0;
 var $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0;
 var $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0;
 var $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0;
 var $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0;
 var $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0;
 var $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0;
 var $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0;
 var $321 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0;
 var $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0;
 var $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0;
 var $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $F16$0 = 0, $I18$0 = 0, $K19$052 = 0, $R$0 = 0, $R$0$lcssa = 0, $R$1 = 0;
 var $R7$0 = 0, $R7$0$lcssa = 0, $R7$1 = 0, $RP$0 = 0, $RP$0$lcssa = 0, $RP9$0 = 0, $RP9$0$lcssa = 0, $T$0$lcssa = 0, $T$051 = 0, $T$051$lcssa = 0, $cond = 0, $cond47 = 0, $not$ = 0, $p$0 = 0, $psize$0 = 0, $psize$1 = 0, $sp$0$i = 0, $sp$0$in$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($mem|0)==(0|0);
 if ($0) {
  return;
 }
 $1 = ((($mem)) + -8|0);
 $2 = HEAP32[(8056)>>2]|0;
 $3 = ($1>>>0)<($2>>>0);
 if ($3) {
  _abort();
  // unreachable;
 }
 $4 = ((($mem)) + -4|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = $5 & 3;
 $7 = ($6|0)==(1);
 if ($7) {
  _abort();
  // unreachable;
 }
 $8 = $5 & -8;
 $$sum = (($8) + -8)|0;
 $9 = (($mem) + ($$sum)|0);
 $10 = $5 & 1;
 $11 = ($10|0)==(0);
 do {
  if ($11) {
   $12 = HEAP32[$1>>2]|0;
   $13 = ($6|0)==(0);
   if ($13) {
    return;
   }
   $$sum2 = (-8 - ($12))|0;
   $14 = (($mem) + ($$sum2)|0);
   $15 = (($12) + ($8))|0;
   $16 = ($14>>>0)<($2>>>0);
   if ($16) {
    _abort();
    // unreachable;
   }
   $17 = HEAP32[(8060)>>2]|0;
   $18 = ($14|0)==($17|0);
   if ($18) {
    $$sum3 = (($8) + -4)|0;
    $103 = (($mem) + ($$sum3)|0);
    $104 = HEAP32[$103>>2]|0;
    $105 = $104 & 3;
    $106 = ($105|0)==(3);
    if (!($106)) {
     $p$0 = $14;$psize$0 = $15;
     break;
    }
    HEAP32[(8048)>>2] = $15;
    $107 = $104 & -2;
    HEAP32[$103>>2] = $107;
    $108 = $15 | 1;
    $$sum20 = (($$sum2) + 4)|0;
    $109 = (($mem) + ($$sum20)|0);
    HEAP32[$109>>2] = $108;
    HEAP32[$9>>2] = $15;
    return;
   }
   $19 = $12 >>> 3;
   $20 = ($12>>>0)<(256);
   if ($20) {
    $$sum30 = (($$sum2) + 8)|0;
    $21 = (($mem) + ($$sum30)|0);
    $22 = HEAP32[$21>>2]|0;
    $$sum31 = (($$sum2) + 12)|0;
    $23 = (($mem) + ($$sum31)|0);
    $24 = HEAP32[$23>>2]|0;
    $25 = $19 << 1;
    $26 = (8080 + ($25<<2)|0);
    $27 = ($22|0)==($26|0);
    if (!($27)) {
     $28 = ($22>>>0)<($2>>>0);
     if ($28) {
      _abort();
      // unreachable;
     }
     $29 = ((($22)) + 12|0);
     $30 = HEAP32[$29>>2]|0;
     $31 = ($30|0)==($14|0);
     if (!($31)) {
      _abort();
      // unreachable;
     }
    }
    $32 = ($24|0)==($22|0);
    if ($32) {
     $33 = 1 << $19;
     $34 = $33 ^ -1;
     $35 = HEAP32[8040>>2]|0;
     $36 = $35 & $34;
     HEAP32[8040>>2] = $36;
     $p$0 = $14;$psize$0 = $15;
     break;
    }
    $37 = ($24|0)==($26|0);
    if ($37) {
     $$pre60 = ((($24)) + 8|0);
     $$pre$phi61Z2D = $$pre60;
    } else {
     $38 = ($24>>>0)<($2>>>0);
     if ($38) {
      _abort();
      // unreachable;
     }
     $39 = ((($24)) + 8|0);
     $40 = HEAP32[$39>>2]|0;
     $41 = ($40|0)==($14|0);
     if ($41) {
      $$pre$phi61Z2D = $39;
     } else {
      _abort();
      // unreachable;
     }
    }
    $42 = ((($22)) + 12|0);
    HEAP32[$42>>2] = $24;
    HEAP32[$$pre$phi61Z2D>>2] = $22;
    $p$0 = $14;$psize$0 = $15;
    break;
   }
   $$sum22 = (($$sum2) + 24)|0;
   $43 = (($mem) + ($$sum22)|0);
   $44 = HEAP32[$43>>2]|0;
   $$sum23 = (($$sum2) + 12)|0;
   $45 = (($mem) + ($$sum23)|0);
   $46 = HEAP32[$45>>2]|0;
   $47 = ($46|0)==($14|0);
   do {
    if ($47) {
     $$sum25 = (($$sum2) + 20)|0;
     $57 = (($mem) + ($$sum25)|0);
     $58 = HEAP32[$57>>2]|0;
     $59 = ($58|0)==(0|0);
     if ($59) {
      $$sum24 = (($$sum2) + 16)|0;
      $60 = (($mem) + ($$sum24)|0);
      $61 = HEAP32[$60>>2]|0;
      $62 = ($61|0)==(0|0);
      if ($62) {
       $R$1 = 0;
       break;
      } else {
       $R$0 = $61;$RP$0 = $60;
      }
     } else {
      $R$0 = $58;$RP$0 = $57;
     }
     while(1) {
      $63 = ((($R$0)) + 20|0);
      $64 = HEAP32[$63>>2]|0;
      $65 = ($64|0)==(0|0);
      if (!($65)) {
       $R$0 = $64;$RP$0 = $63;
       continue;
      }
      $66 = ((($R$0)) + 16|0);
      $67 = HEAP32[$66>>2]|0;
      $68 = ($67|0)==(0|0);
      if ($68) {
       $R$0$lcssa = $R$0;$RP$0$lcssa = $RP$0;
       break;
      } else {
       $R$0 = $67;$RP$0 = $66;
      }
     }
     $69 = ($RP$0$lcssa>>>0)<($2>>>0);
     if ($69) {
      _abort();
      // unreachable;
     } else {
      HEAP32[$RP$0$lcssa>>2] = 0;
      $R$1 = $R$0$lcssa;
      break;
     }
    } else {
     $$sum29 = (($$sum2) + 8)|0;
     $48 = (($mem) + ($$sum29)|0);
     $49 = HEAP32[$48>>2]|0;
     $50 = ($49>>>0)<($2>>>0);
     if ($50) {
      _abort();
      // unreachable;
     }
     $51 = ((($49)) + 12|0);
     $52 = HEAP32[$51>>2]|0;
     $53 = ($52|0)==($14|0);
     if (!($53)) {
      _abort();
      // unreachable;
     }
     $54 = ((($46)) + 8|0);
     $55 = HEAP32[$54>>2]|0;
     $56 = ($55|0)==($14|0);
     if ($56) {
      HEAP32[$51>>2] = $46;
      HEAP32[$54>>2] = $49;
      $R$1 = $46;
      break;
     } else {
      _abort();
      // unreachable;
     }
    }
   } while(0);
   $70 = ($44|0)==(0|0);
   if ($70) {
    $p$0 = $14;$psize$0 = $15;
   } else {
    $$sum26 = (($$sum2) + 28)|0;
    $71 = (($mem) + ($$sum26)|0);
    $72 = HEAP32[$71>>2]|0;
    $73 = (8344 + ($72<<2)|0);
    $74 = HEAP32[$73>>2]|0;
    $75 = ($14|0)==($74|0);
    if ($75) {
     HEAP32[$73>>2] = $R$1;
     $cond = ($R$1|0)==(0|0);
     if ($cond) {
      $76 = 1 << $72;
      $77 = $76 ^ -1;
      $78 = HEAP32[(8044)>>2]|0;
      $79 = $78 & $77;
      HEAP32[(8044)>>2] = $79;
      $p$0 = $14;$psize$0 = $15;
      break;
     }
    } else {
     $80 = HEAP32[(8056)>>2]|0;
     $81 = ($44>>>0)<($80>>>0);
     if ($81) {
      _abort();
      // unreachable;
     }
     $82 = ((($44)) + 16|0);
     $83 = HEAP32[$82>>2]|0;
     $84 = ($83|0)==($14|0);
     if ($84) {
      HEAP32[$82>>2] = $R$1;
     } else {
      $85 = ((($44)) + 20|0);
      HEAP32[$85>>2] = $R$1;
     }
     $86 = ($R$1|0)==(0|0);
     if ($86) {
      $p$0 = $14;$psize$0 = $15;
      break;
     }
    }
    $87 = HEAP32[(8056)>>2]|0;
    $88 = ($R$1>>>0)<($87>>>0);
    if ($88) {
     _abort();
     // unreachable;
    }
    $89 = ((($R$1)) + 24|0);
    HEAP32[$89>>2] = $44;
    $$sum27 = (($$sum2) + 16)|0;
    $90 = (($mem) + ($$sum27)|0);
    $91 = HEAP32[$90>>2]|0;
    $92 = ($91|0)==(0|0);
    do {
     if (!($92)) {
      $93 = ($91>>>0)<($87>>>0);
      if ($93) {
       _abort();
       // unreachable;
      } else {
       $94 = ((($R$1)) + 16|0);
       HEAP32[$94>>2] = $91;
       $95 = ((($91)) + 24|0);
       HEAP32[$95>>2] = $R$1;
       break;
      }
     }
    } while(0);
    $$sum28 = (($$sum2) + 20)|0;
    $96 = (($mem) + ($$sum28)|0);
    $97 = HEAP32[$96>>2]|0;
    $98 = ($97|0)==(0|0);
    if ($98) {
     $p$0 = $14;$psize$0 = $15;
    } else {
     $99 = HEAP32[(8056)>>2]|0;
     $100 = ($97>>>0)<($99>>>0);
     if ($100) {
      _abort();
      // unreachable;
     } else {
      $101 = ((($R$1)) + 20|0);
      HEAP32[$101>>2] = $97;
      $102 = ((($97)) + 24|0);
      HEAP32[$102>>2] = $R$1;
      $p$0 = $14;$psize$0 = $15;
      break;
     }
    }
   }
  } else {
   $p$0 = $1;$psize$0 = $8;
  }
 } while(0);
 $110 = ($p$0>>>0)<($9>>>0);
 if (!($110)) {
  _abort();
  // unreachable;
 }
 $$sum19 = (($8) + -4)|0;
 $111 = (($mem) + ($$sum19)|0);
 $112 = HEAP32[$111>>2]|0;
 $113 = $112 & 1;
 $114 = ($113|0)==(0);
 if ($114) {
  _abort();
  // unreachable;
 }
 $115 = $112 & 2;
 $116 = ($115|0)==(0);
 if ($116) {
  $117 = HEAP32[(8064)>>2]|0;
  $118 = ($9|0)==($117|0);
  if ($118) {
   $119 = HEAP32[(8052)>>2]|0;
   $120 = (($119) + ($psize$0))|0;
   HEAP32[(8052)>>2] = $120;
   HEAP32[(8064)>>2] = $p$0;
   $121 = $120 | 1;
   $122 = ((($p$0)) + 4|0);
   HEAP32[$122>>2] = $121;
   $123 = HEAP32[(8060)>>2]|0;
   $124 = ($p$0|0)==($123|0);
   if (!($124)) {
    return;
   }
   HEAP32[(8060)>>2] = 0;
   HEAP32[(8048)>>2] = 0;
   return;
  }
  $125 = HEAP32[(8060)>>2]|0;
  $126 = ($9|0)==($125|0);
  if ($126) {
   $127 = HEAP32[(8048)>>2]|0;
   $128 = (($127) + ($psize$0))|0;
   HEAP32[(8048)>>2] = $128;
   HEAP32[(8060)>>2] = $p$0;
   $129 = $128 | 1;
   $130 = ((($p$0)) + 4|0);
   HEAP32[$130>>2] = $129;
   $131 = (($p$0) + ($128)|0);
   HEAP32[$131>>2] = $128;
   return;
  }
  $132 = $112 & -8;
  $133 = (($132) + ($psize$0))|0;
  $134 = $112 >>> 3;
  $135 = ($112>>>0)<(256);
  do {
   if ($135) {
    $136 = (($mem) + ($8)|0);
    $137 = HEAP32[$136>>2]|0;
    $$sum1718 = $8 | 4;
    $138 = (($mem) + ($$sum1718)|0);
    $139 = HEAP32[$138>>2]|0;
    $140 = $134 << 1;
    $141 = (8080 + ($140<<2)|0);
    $142 = ($137|0)==($141|0);
    if (!($142)) {
     $143 = HEAP32[(8056)>>2]|0;
     $144 = ($137>>>0)<($143>>>0);
     if ($144) {
      _abort();
      // unreachable;
     }
     $145 = ((($137)) + 12|0);
     $146 = HEAP32[$145>>2]|0;
     $147 = ($146|0)==($9|0);
     if (!($147)) {
      _abort();
      // unreachable;
     }
    }
    $148 = ($139|0)==($137|0);
    if ($148) {
     $149 = 1 << $134;
     $150 = $149 ^ -1;
     $151 = HEAP32[8040>>2]|0;
     $152 = $151 & $150;
     HEAP32[8040>>2] = $152;
     break;
    }
    $153 = ($139|0)==($141|0);
    if ($153) {
     $$pre58 = ((($139)) + 8|0);
     $$pre$phi59Z2D = $$pre58;
    } else {
     $154 = HEAP32[(8056)>>2]|0;
     $155 = ($139>>>0)<($154>>>0);
     if ($155) {
      _abort();
      // unreachable;
     }
     $156 = ((($139)) + 8|0);
     $157 = HEAP32[$156>>2]|0;
     $158 = ($157|0)==($9|0);
     if ($158) {
      $$pre$phi59Z2D = $156;
     } else {
      _abort();
      // unreachable;
     }
    }
    $159 = ((($137)) + 12|0);
    HEAP32[$159>>2] = $139;
    HEAP32[$$pre$phi59Z2D>>2] = $137;
   } else {
    $$sum5 = (($8) + 16)|0;
    $160 = (($mem) + ($$sum5)|0);
    $161 = HEAP32[$160>>2]|0;
    $$sum67 = $8 | 4;
    $162 = (($mem) + ($$sum67)|0);
    $163 = HEAP32[$162>>2]|0;
    $164 = ($163|0)==($9|0);
    do {
     if ($164) {
      $$sum9 = (($8) + 12)|0;
      $175 = (($mem) + ($$sum9)|0);
      $176 = HEAP32[$175>>2]|0;
      $177 = ($176|0)==(0|0);
      if ($177) {
       $$sum8 = (($8) + 8)|0;
       $178 = (($mem) + ($$sum8)|0);
       $179 = HEAP32[$178>>2]|0;
       $180 = ($179|0)==(0|0);
       if ($180) {
        $R7$1 = 0;
        break;
       } else {
        $R7$0 = $179;$RP9$0 = $178;
       }
      } else {
       $R7$0 = $176;$RP9$0 = $175;
      }
      while(1) {
       $181 = ((($R7$0)) + 20|0);
       $182 = HEAP32[$181>>2]|0;
       $183 = ($182|0)==(0|0);
       if (!($183)) {
        $R7$0 = $182;$RP9$0 = $181;
        continue;
       }
       $184 = ((($R7$0)) + 16|0);
       $185 = HEAP32[$184>>2]|0;
       $186 = ($185|0)==(0|0);
       if ($186) {
        $R7$0$lcssa = $R7$0;$RP9$0$lcssa = $RP9$0;
        break;
       } else {
        $R7$0 = $185;$RP9$0 = $184;
       }
      }
      $187 = HEAP32[(8056)>>2]|0;
      $188 = ($RP9$0$lcssa>>>0)<($187>>>0);
      if ($188) {
       _abort();
       // unreachable;
      } else {
       HEAP32[$RP9$0$lcssa>>2] = 0;
       $R7$1 = $R7$0$lcssa;
       break;
      }
     } else {
      $165 = (($mem) + ($8)|0);
      $166 = HEAP32[$165>>2]|0;
      $167 = HEAP32[(8056)>>2]|0;
      $168 = ($166>>>0)<($167>>>0);
      if ($168) {
       _abort();
       // unreachable;
      }
      $169 = ((($166)) + 12|0);
      $170 = HEAP32[$169>>2]|0;
      $171 = ($170|0)==($9|0);
      if (!($171)) {
       _abort();
       // unreachable;
      }
      $172 = ((($163)) + 8|0);
      $173 = HEAP32[$172>>2]|0;
      $174 = ($173|0)==($9|0);
      if ($174) {
       HEAP32[$169>>2] = $163;
       HEAP32[$172>>2] = $166;
       $R7$1 = $163;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    } while(0);
    $189 = ($161|0)==(0|0);
    if (!($189)) {
     $$sum12 = (($8) + 20)|0;
     $190 = (($mem) + ($$sum12)|0);
     $191 = HEAP32[$190>>2]|0;
     $192 = (8344 + ($191<<2)|0);
     $193 = HEAP32[$192>>2]|0;
     $194 = ($9|0)==($193|0);
     if ($194) {
      HEAP32[$192>>2] = $R7$1;
      $cond47 = ($R7$1|0)==(0|0);
      if ($cond47) {
       $195 = 1 << $191;
       $196 = $195 ^ -1;
       $197 = HEAP32[(8044)>>2]|0;
       $198 = $197 & $196;
       HEAP32[(8044)>>2] = $198;
       break;
      }
     } else {
      $199 = HEAP32[(8056)>>2]|0;
      $200 = ($161>>>0)<($199>>>0);
      if ($200) {
       _abort();
       // unreachable;
      }
      $201 = ((($161)) + 16|0);
      $202 = HEAP32[$201>>2]|0;
      $203 = ($202|0)==($9|0);
      if ($203) {
       HEAP32[$201>>2] = $R7$1;
      } else {
       $204 = ((($161)) + 20|0);
       HEAP32[$204>>2] = $R7$1;
      }
      $205 = ($R7$1|0)==(0|0);
      if ($205) {
       break;
      }
     }
     $206 = HEAP32[(8056)>>2]|0;
     $207 = ($R7$1>>>0)<($206>>>0);
     if ($207) {
      _abort();
      // unreachable;
     }
     $208 = ((($R7$1)) + 24|0);
     HEAP32[$208>>2] = $161;
     $$sum13 = (($8) + 8)|0;
     $209 = (($mem) + ($$sum13)|0);
     $210 = HEAP32[$209>>2]|0;
     $211 = ($210|0)==(0|0);
     do {
      if (!($211)) {
       $212 = ($210>>>0)<($206>>>0);
       if ($212) {
        _abort();
        // unreachable;
       } else {
        $213 = ((($R7$1)) + 16|0);
        HEAP32[$213>>2] = $210;
        $214 = ((($210)) + 24|0);
        HEAP32[$214>>2] = $R7$1;
        break;
       }
      }
     } while(0);
     $$sum14 = (($8) + 12)|0;
     $215 = (($mem) + ($$sum14)|0);
     $216 = HEAP32[$215>>2]|0;
     $217 = ($216|0)==(0|0);
     if (!($217)) {
      $218 = HEAP32[(8056)>>2]|0;
      $219 = ($216>>>0)<($218>>>0);
      if ($219) {
       _abort();
       // unreachable;
      } else {
       $220 = ((($R7$1)) + 20|0);
       HEAP32[$220>>2] = $216;
       $221 = ((($216)) + 24|0);
       HEAP32[$221>>2] = $R7$1;
       break;
      }
     }
    }
   }
  } while(0);
  $222 = $133 | 1;
  $223 = ((($p$0)) + 4|0);
  HEAP32[$223>>2] = $222;
  $224 = (($p$0) + ($133)|0);
  HEAP32[$224>>2] = $133;
  $225 = HEAP32[(8060)>>2]|0;
  $226 = ($p$0|0)==($225|0);
  if ($226) {
   HEAP32[(8048)>>2] = $133;
   return;
  } else {
   $psize$1 = $133;
  }
 } else {
  $227 = $112 & -2;
  HEAP32[$111>>2] = $227;
  $228 = $psize$0 | 1;
  $229 = ((($p$0)) + 4|0);
  HEAP32[$229>>2] = $228;
  $230 = (($p$0) + ($psize$0)|0);
  HEAP32[$230>>2] = $psize$0;
  $psize$1 = $psize$0;
 }
 $231 = $psize$1 >>> 3;
 $232 = ($psize$1>>>0)<(256);
 if ($232) {
  $233 = $231 << 1;
  $234 = (8080 + ($233<<2)|0);
  $235 = HEAP32[8040>>2]|0;
  $236 = 1 << $231;
  $237 = $235 & $236;
  $238 = ($237|0)==(0);
  if ($238) {
   $239 = $235 | $236;
   HEAP32[8040>>2] = $239;
   $$pre = (($233) + 2)|0;
   $$pre57 = (8080 + ($$pre<<2)|0);
   $$pre$phiZ2D = $$pre57;$F16$0 = $234;
  } else {
   $$sum11 = (($233) + 2)|0;
   $240 = (8080 + ($$sum11<<2)|0);
   $241 = HEAP32[$240>>2]|0;
   $242 = HEAP32[(8056)>>2]|0;
   $243 = ($241>>>0)<($242>>>0);
   if ($243) {
    _abort();
    // unreachable;
   } else {
    $$pre$phiZ2D = $240;$F16$0 = $241;
   }
  }
  HEAP32[$$pre$phiZ2D>>2] = $p$0;
  $244 = ((($F16$0)) + 12|0);
  HEAP32[$244>>2] = $p$0;
  $245 = ((($p$0)) + 8|0);
  HEAP32[$245>>2] = $F16$0;
  $246 = ((($p$0)) + 12|0);
  HEAP32[$246>>2] = $234;
  return;
 }
 $247 = $psize$1 >>> 8;
 $248 = ($247|0)==(0);
 if ($248) {
  $I18$0 = 0;
 } else {
  $249 = ($psize$1>>>0)>(16777215);
  if ($249) {
   $I18$0 = 31;
  } else {
   $250 = (($247) + 1048320)|0;
   $251 = $250 >>> 16;
   $252 = $251 & 8;
   $253 = $247 << $252;
   $254 = (($253) + 520192)|0;
   $255 = $254 >>> 16;
   $256 = $255 & 4;
   $257 = $256 | $252;
   $258 = $253 << $256;
   $259 = (($258) + 245760)|0;
   $260 = $259 >>> 16;
   $261 = $260 & 2;
   $262 = $257 | $261;
   $263 = (14 - ($262))|0;
   $264 = $258 << $261;
   $265 = $264 >>> 15;
   $266 = (($263) + ($265))|0;
   $267 = $266 << 1;
   $268 = (($266) + 7)|0;
   $269 = $psize$1 >>> $268;
   $270 = $269 & 1;
   $271 = $270 | $267;
   $I18$0 = $271;
  }
 }
 $272 = (8344 + ($I18$0<<2)|0);
 $273 = ((($p$0)) + 28|0);
 HEAP32[$273>>2] = $I18$0;
 $274 = ((($p$0)) + 16|0);
 $275 = ((($p$0)) + 20|0);
 HEAP32[$275>>2] = 0;
 HEAP32[$274>>2] = 0;
 $276 = HEAP32[(8044)>>2]|0;
 $277 = 1 << $I18$0;
 $278 = $276 & $277;
 $279 = ($278|0)==(0);
 L199: do {
  if ($279) {
   $280 = $276 | $277;
   HEAP32[(8044)>>2] = $280;
   HEAP32[$272>>2] = $p$0;
   $281 = ((($p$0)) + 24|0);
   HEAP32[$281>>2] = $272;
   $282 = ((($p$0)) + 12|0);
   HEAP32[$282>>2] = $p$0;
   $283 = ((($p$0)) + 8|0);
   HEAP32[$283>>2] = $p$0;
  } else {
   $284 = HEAP32[$272>>2]|0;
   $285 = ((($284)) + 4|0);
   $286 = HEAP32[$285>>2]|0;
   $287 = $286 & -8;
   $288 = ($287|0)==($psize$1|0);
   L202: do {
    if ($288) {
     $T$0$lcssa = $284;
    } else {
     $289 = ($I18$0|0)==(31);
     $290 = $I18$0 >>> 1;
     $291 = (25 - ($290))|0;
     $292 = $289 ? 0 : $291;
     $293 = $psize$1 << $292;
     $K19$052 = $293;$T$051 = $284;
     while(1) {
      $300 = $K19$052 >>> 31;
      $301 = (((($T$051)) + 16|0) + ($300<<2)|0);
      $296 = HEAP32[$301>>2]|0;
      $302 = ($296|0)==(0|0);
      if ($302) {
       $$lcssa = $301;$T$051$lcssa = $T$051;
       break;
      }
      $294 = $K19$052 << 1;
      $295 = ((($296)) + 4|0);
      $297 = HEAP32[$295>>2]|0;
      $298 = $297 & -8;
      $299 = ($298|0)==($psize$1|0);
      if ($299) {
       $T$0$lcssa = $296;
       break L202;
      } else {
       $K19$052 = $294;$T$051 = $296;
      }
     }
     $303 = HEAP32[(8056)>>2]|0;
     $304 = ($$lcssa>>>0)<($303>>>0);
     if ($304) {
      _abort();
      // unreachable;
     } else {
      HEAP32[$$lcssa>>2] = $p$0;
      $305 = ((($p$0)) + 24|0);
      HEAP32[$305>>2] = $T$051$lcssa;
      $306 = ((($p$0)) + 12|0);
      HEAP32[$306>>2] = $p$0;
      $307 = ((($p$0)) + 8|0);
      HEAP32[$307>>2] = $p$0;
      break L199;
     }
    }
   } while(0);
   $308 = ((($T$0$lcssa)) + 8|0);
   $309 = HEAP32[$308>>2]|0;
   $310 = HEAP32[(8056)>>2]|0;
   $311 = ($309>>>0)>=($310>>>0);
   $not$ = ($T$0$lcssa>>>0)>=($310>>>0);
   $312 = $311 & $not$;
   if ($312) {
    $313 = ((($309)) + 12|0);
    HEAP32[$313>>2] = $p$0;
    HEAP32[$308>>2] = $p$0;
    $314 = ((($p$0)) + 8|0);
    HEAP32[$314>>2] = $309;
    $315 = ((($p$0)) + 12|0);
    HEAP32[$315>>2] = $T$0$lcssa;
    $316 = ((($p$0)) + 24|0);
    HEAP32[$316>>2] = 0;
    break;
   } else {
    _abort();
    // unreachable;
   }
  }
 } while(0);
 $317 = HEAP32[(8072)>>2]|0;
 $318 = (($317) + -1)|0;
 HEAP32[(8072)>>2] = $318;
 $319 = ($318|0)==(0);
 if ($319) {
  $sp$0$in$i = (8496);
 } else {
  return;
 }
 while(1) {
  $sp$0$i = HEAP32[$sp$0$in$i>>2]|0;
  $320 = ($sp$0$i|0)==(0|0);
  $321 = ((($sp$0$i)) + 8|0);
  if ($320) {
   break;
  } else {
   $sp$0$in$i = $321;
  }
 }
 HEAP32[(8072)>>2] = -1;
 return;
}
function _calloc($n_elements,$elem_size) {
 $n_elements = $n_elements|0;
 $elem_size = $elem_size|0;
 var $$ = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $req$0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($n_elements|0)==(0);
 if ($0) {
  $req$0 = 0;
 } else {
  $1 = Math_imul($elem_size, $n_elements)|0;
  $2 = $elem_size | $n_elements;
  $3 = ($2>>>0)>(65535);
  if ($3) {
   $4 = (($1>>>0) / ($n_elements>>>0))&-1;
   $5 = ($4|0)==($elem_size|0);
   $$ = $5 ? $1 : -1;
   $req$0 = $$;
  } else {
   $req$0 = $1;
  }
 }
 $6 = (_malloc($req$0)|0);
 $7 = ($6|0)==(0|0);
 if ($7) {
  return ($6|0);
 }
 $8 = ((($6)) + -4|0);
 $9 = HEAP32[$8>>2]|0;
 $10 = $9 & 3;
 $11 = ($10|0)==(0);
 if ($11) {
  return ($6|0);
 }
 _memset(($6|0),0,($req$0|0))|0;
 return ($6|0);
}
function runPostSets() {
}
function _i64Subtract(a, b, c, d) {
    a = a|0; b = b|0; c = c|0; d = d|0;
    var l = 0, h = 0;
    l = (a - c)>>>0;
    h = (b - d)>>>0;
    h = (b - d - (((c>>>0) > (a>>>0))|0))>>>0; // Borrow one from high word to low word on underflow.
    return ((tempRet0 = h,l|0)|0);
}
function _memset(ptr, value, num) {
    ptr = ptr|0; value = value|0; num = num|0;
    var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
    stop = (ptr + num)|0;
    if ((num|0) >= 20) {
      // This is unaligned, but quite large, so work hard to get to aligned settings
      value = value & 0xff;
      unaligned = ptr & 3;
      value4 = value | (value << 8) | (value << 16) | (value << 24);
      stop4 = stop & ~3;
      if (unaligned) {
        unaligned = (ptr + 4 - unaligned)|0;
        while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
          HEAP8[((ptr)>>0)]=value;
          ptr = (ptr+1)|0;
        }
      }
      while ((ptr|0) < (stop4|0)) {
        HEAP32[((ptr)>>2)]=value4;
        ptr = (ptr+4)|0;
      }
    }
    while ((ptr|0) < (stop|0)) {
      HEAP8[((ptr)>>0)]=value;
      ptr = (ptr+1)|0;
    }
    return (ptr-num)|0;
}
function _bitshift64Lshr(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = high >>> bits;
      return (low >>> bits) | ((high&ander) << (32 - bits));
    }
    tempRet0 = 0;
    return (high >>> (bits - 32))|0;
}
function _bitshift64Shl(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = (high << bits) | ((low&(ander << (32 - bits))) >>> (32 - bits));
      return low << bits;
    }
    tempRet0 = low << (bits - 32);
    return 0;
}
function _i64Add(a, b, c, d) {
    /*
      x = a + b*2^32
      y = c + d*2^32
      result = l + h*2^32
    */
    a = a|0; b = b|0; c = c|0; d = d|0;
    var l = 0, h = 0;
    l = (a + c)>>>0;
    h = (b + d + (((l>>>0) < (a>>>0))|0))>>>0; // Add carry from low word to high word on overflow.
    return ((tempRet0 = h,l|0)|0);
}
function _memcpy(dest, src, num) {
    dest = dest|0; src = src|0; num = num|0;
    var ret = 0;
    if ((num|0) >= 4096) return _emscripten_memcpy_big(dest|0, src|0, num|0)|0;
    ret = dest|0;
    if ((dest&3) == (src&3)) {
      while (dest & 3) {
        if ((num|0) == 0) return ret|0;
        HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      while ((num|0) >= 4) {
        HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
        dest = (dest+4)|0;
        src = (src+4)|0;
        num = (num-4)|0;
      }
    }
    while ((num|0) > 0) {
      HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
      dest = (dest+1)|0;
      src = (src+1)|0;
      num = (num-1)|0;
    }
    return ret|0;
}
function _bitshift64Ashr(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = high >> bits;
      return (low >>> bits) | ((high&ander) << (32 - bits));
    }
    tempRet0 = (high|0) < 0 ? -1 : 0;
    return (high >> (bits - 32))|0;
  }
function _llvm_cttz_i32(x) {
    x = x|0;
    var ret = 0;
    ret = ((HEAP8[(((cttz_i8)+(x & 0xff))>>0)])|0);
    if ((ret|0) < 8) return ret|0;
    ret = ((HEAP8[(((cttz_i8)+((x >> 8)&0xff))>>0)])|0);
    if ((ret|0) < 8) return (ret + 8)|0;
    ret = ((HEAP8[(((cttz_i8)+((x >> 16)&0xff))>>0)])|0);
    if ((ret|0) < 8) return (ret + 16)|0;
    return (((HEAP8[(((cttz_i8)+(x >>> 24))>>0)])|0) + 24)|0;
  }

// ======== compiled code from system/lib/compiler-rt , see readme therein
function ___muldsi3($a, $b) {
  $a = $a | 0;
  $b = $b | 0;
  var $1 = 0, $2 = 0, $3 = 0, $6 = 0, $8 = 0, $11 = 0, $12 = 0;
  $1 = $a & 65535;
  $2 = $b & 65535;
  $3 = Math_imul($2, $1) | 0;
  $6 = $a >>> 16;
  $8 = ($3 >>> 16) + (Math_imul($2, $6) | 0) | 0;
  $11 = $b >>> 16;
  $12 = Math_imul($11, $1) | 0;
  return (tempRet0 = (($8 >>> 16) + (Math_imul($11, $6) | 0) | 0) + ((($8 & 65535) + $12 | 0) >>> 16) | 0, 0 | ($8 + $12 << 16 | $3 & 65535)) | 0;
}
function ___divdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $1$0 = 0, $1$1 = 0, $2$0 = 0, $2$1 = 0, $4$0 = 0, $4$1 = 0, $6$0 = 0, $7$0 = 0, $7$1 = 0, $8$0 = 0, $10$0 = 0;
  $1$0 = $a$1 >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $1$1 = (($a$1 | 0) < 0 ? -1 : 0) >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $2$0 = $b$1 >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $2$1 = (($b$1 | 0) < 0 ? -1 : 0) >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $4$0 = _i64Subtract($1$0 ^ $a$0, $1$1 ^ $a$1, $1$0, $1$1) | 0;
  $4$1 = tempRet0;
  $6$0 = _i64Subtract($2$0 ^ $b$0, $2$1 ^ $b$1, $2$0, $2$1) | 0;
  $7$0 = $2$0 ^ $1$0;
  $7$1 = $2$1 ^ $1$1;
  $8$0 = ___udivmoddi4($4$0, $4$1, $6$0, tempRet0, 0) | 0;
  $10$0 = _i64Subtract($8$0 ^ $7$0, tempRet0 ^ $7$1, $7$0, $7$1) | 0;
  return $10$0 | 0;
}
function ___remdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $rem = 0, $1$0 = 0, $1$1 = 0, $2$0 = 0, $2$1 = 0, $4$0 = 0, $4$1 = 0, $6$0 = 0, $10$0 = 0, $10$1 = 0, __stackBase__ = 0;
  __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 16 | 0;
  $rem = __stackBase__ | 0;
  $1$0 = $a$1 >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $1$1 = (($a$1 | 0) < 0 ? -1 : 0) >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $2$0 = $b$1 >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $2$1 = (($b$1 | 0) < 0 ? -1 : 0) >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $4$0 = _i64Subtract($1$0 ^ $a$0, $1$1 ^ $a$1, $1$0, $1$1) | 0;
  $4$1 = tempRet0;
  $6$0 = _i64Subtract($2$0 ^ $b$0, $2$1 ^ $b$1, $2$0, $2$1) | 0;
  ___udivmoddi4($4$0, $4$1, $6$0, tempRet0, $rem) | 0;
  $10$0 = _i64Subtract(HEAP32[$rem >> 2] ^ $1$0, HEAP32[$rem + 4 >> 2] ^ $1$1, $1$0, $1$1) | 0;
  $10$1 = tempRet0;
  STACKTOP = __stackBase__;
  return (tempRet0 = $10$1, $10$0) | 0;
}
function ___muldi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $x_sroa_0_0_extract_trunc = 0, $y_sroa_0_0_extract_trunc = 0, $1$0 = 0, $1$1 = 0, $2 = 0;
  $x_sroa_0_0_extract_trunc = $a$0;
  $y_sroa_0_0_extract_trunc = $b$0;
  $1$0 = ___muldsi3($x_sroa_0_0_extract_trunc, $y_sroa_0_0_extract_trunc) | 0;
  $1$1 = tempRet0;
  $2 = Math_imul($a$1, $y_sroa_0_0_extract_trunc) | 0;
  return (tempRet0 = ((Math_imul($b$1, $x_sroa_0_0_extract_trunc) | 0) + $2 | 0) + $1$1 | $1$1 & 0, 0 | $1$0 & -1) | 0;
}
function ___udivdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $1$0 = 0;
  $1$0 = ___udivmoddi4($a$0, $a$1, $b$0, $b$1, 0) | 0;
  return $1$0 | 0;
}
function ___uremdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $rem = 0, __stackBase__ = 0;
  __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 16 | 0;
  $rem = __stackBase__ | 0;
  ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) | 0;
  STACKTOP = __stackBase__;
  return (tempRet0 = HEAP32[$rem + 4 >> 2] | 0, HEAP32[$rem >> 2] | 0) | 0;
}
function ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  $rem = $rem | 0;
  var $n_sroa_0_0_extract_trunc = 0, $n_sroa_1_4_extract_shift$0 = 0, $n_sroa_1_4_extract_trunc = 0, $d_sroa_0_0_extract_trunc = 0, $d_sroa_1_4_extract_shift$0 = 0, $d_sroa_1_4_extract_trunc = 0, $4 = 0, $17 = 0, $37 = 0, $49 = 0, $51 = 0, $57 = 0, $58 = 0, $66 = 0, $78 = 0, $86 = 0, $88 = 0, $89 = 0, $91 = 0, $92 = 0, $95 = 0, $105 = 0, $117 = 0, $119 = 0, $125 = 0, $126 = 0, $130 = 0, $q_sroa_1_1_ph = 0, $q_sroa_0_1_ph = 0, $r_sroa_1_1_ph = 0, $r_sroa_0_1_ph = 0, $sr_1_ph = 0, $d_sroa_0_0_insert_insert99$0 = 0, $d_sroa_0_0_insert_insert99$1 = 0, $137$0 = 0, $137$1 = 0, $carry_0203 = 0, $sr_1202 = 0, $r_sroa_0_1201 = 0, $r_sroa_1_1200 = 0, $q_sroa_0_1199 = 0, $q_sroa_1_1198 = 0, $147 = 0, $149 = 0, $r_sroa_0_0_insert_insert42$0 = 0, $r_sroa_0_0_insert_insert42$1 = 0, $150$1 = 0, $151$0 = 0, $152 = 0, $154$0 = 0, $r_sroa_0_0_extract_trunc = 0, $r_sroa_1_4_extract_trunc = 0, $155 = 0, $carry_0_lcssa$0 = 0, $carry_0_lcssa$1 = 0, $r_sroa_0_1_lcssa = 0, $r_sroa_1_1_lcssa = 0, $q_sroa_0_1_lcssa = 0, $q_sroa_1_1_lcssa = 0, $q_sroa_0_0_insert_ext75$0 = 0, $q_sroa_0_0_insert_ext75$1 = 0, $q_sroa_0_0_insert_insert77$1 = 0, $_0$0 = 0, $_0$1 = 0;
  $n_sroa_0_0_extract_trunc = $a$0;
  $n_sroa_1_4_extract_shift$0 = $a$1;
  $n_sroa_1_4_extract_trunc = $n_sroa_1_4_extract_shift$0;
  $d_sroa_0_0_extract_trunc = $b$0;
  $d_sroa_1_4_extract_shift$0 = $b$1;
  $d_sroa_1_4_extract_trunc = $d_sroa_1_4_extract_shift$0;
  if (($n_sroa_1_4_extract_trunc | 0) == 0) {
    $4 = ($rem | 0) != 0;
    if (($d_sroa_1_4_extract_trunc | 0) == 0) {
      if ($4) {
        HEAP32[$rem >> 2] = ($n_sroa_0_0_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0);
        HEAP32[$rem + 4 >> 2] = 0;
      }
      $_0$1 = 0;
      $_0$0 = ($n_sroa_0_0_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    } else {
      if (!$4) {
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      HEAP32[$rem >> 2] = $a$0 & -1;
      HEAP32[$rem + 4 >> 2] = $a$1 & 0;
      $_0$1 = 0;
      $_0$0 = 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    }
  }
  $17 = ($d_sroa_1_4_extract_trunc | 0) == 0;
  do {
    if (($d_sroa_0_0_extract_trunc | 0) == 0) {
      if ($17) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0);
          HEAP32[$rem + 4 >> 2] = 0;
        }
        $_0$1 = 0;
        $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      if (($n_sroa_0_0_extract_trunc | 0) == 0) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = 0;
          HEAP32[$rem + 4 >> 2] = ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_1_4_extract_trunc >>> 0);
        }
        $_0$1 = 0;
        $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_1_4_extract_trunc >>> 0) >>> 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $37 = $d_sroa_1_4_extract_trunc - 1 | 0;
      if (($37 & $d_sroa_1_4_extract_trunc | 0) == 0) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = 0 | $a$0 & -1;
          HEAP32[$rem + 4 >> 2] = $37 & $n_sroa_1_4_extract_trunc | $a$1 & 0;
        }
        $_0$1 = 0;
        $_0$0 = $n_sroa_1_4_extract_trunc >>> ((_llvm_cttz_i32($d_sroa_1_4_extract_trunc | 0) | 0) >>> 0);
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $49 = Math_clz32($d_sroa_1_4_extract_trunc | 0) | 0;
      $51 = $49 - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
      if ($51 >>> 0 <= 30) {
        $57 = $51 + 1 | 0;
        $58 = 31 - $51 | 0;
        $sr_1_ph = $57;
        $r_sroa_0_1_ph = $n_sroa_1_4_extract_trunc << $58 | $n_sroa_0_0_extract_trunc >>> ($57 >>> 0);
        $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($57 >>> 0);
        $q_sroa_0_1_ph = 0;
        $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $58;
        break;
      }
      if (($rem | 0) == 0) {
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      HEAP32[$rem >> 2] = 0 | $a$0 & -1;
      HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
      $_0$1 = 0;
      $_0$0 = 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    } else {
      if (!$17) {
        $117 = Math_clz32($d_sroa_1_4_extract_trunc | 0) | 0;
        $119 = $117 - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
        if ($119 >>> 0 <= 31) {
          $125 = $119 + 1 | 0;
          $126 = 31 - $119 | 0;
          $130 = $119 - 31 >> 31;
          $sr_1_ph = $125;
          $r_sroa_0_1_ph = $n_sroa_0_0_extract_trunc >>> ($125 >>> 0) & $130 | $n_sroa_1_4_extract_trunc << $126;
          $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($125 >>> 0) & $130;
          $q_sroa_0_1_ph = 0;
          $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $126;
          break;
        }
        if (($rem | 0) == 0) {
          $_0$1 = 0;
          $_0$0 = 0;
          return (tempRet0 = $_0$1, $_0$0) | 0;
        }
        HEAP32[$rem >> 2] = 0 | $a$0 & -1;
        HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $66 = $d_sroa_0_0_extract_trunc - 1 | 0;
      if (($66 & $d_sroa_0_0_extract_trunc | 0) != 0) {
        $86 = (Math_clz32($d_sroa_0_0_extract_trunc | 0) | 0) + 33 | 0;
        $88 = $86 - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
        $89 = 64 - $88 | 0;
        $91 = 32 - $88 | 0;
        $92 = $91 >> 31;
        $95 = $88 - 32 | 0;
        $105 = $95 >> 31;
        $sr_1_ph = $88;
        $r_sroa_0_1_ph = $91 - 1 >> 31 & $n_sroa_1_4_extract_trunc >>> ($95 >>> 0) | ($n_sroa_1_4_extract_trunc << $91 | $n_sroa_0_0_extract_trunc >>> ($88 >>> 0)) & $105;
        $r_sroa_1_1_ph = $105 & $n_sroa_1_4_extract_trunc >>> ($88 >>> 0);
        $q_sroa_0_1_ph = $n_sroa_0_0_extract_trunc << $89 & $92;
        $q_sroa_1_1_ph = ($n_sroa_1_4_extract_trunc << $89 | $n_sroa_0_0_extract_trunc >>> ($95 >>> 0)) & $92 | $n_sroa_0_0_extract_trunc << $91 & $88 - 33 >> 31;
        break;
      }
      if (($rem | 0) != 0) {
        HEAP32[$rem >> 2] = $66 & $n_sroa_0_0_extract_trunc;
        HEAP32[$rem + 4 >> 2] = 0;
      }
      if (($d_sroa_0_0_extract_trunc | 0) == 1) {
        $_0$1 = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
        $_0$0 = 0 | $a$0 & -1;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      } else {
        $78 = _llvm_cttz_i32($d_sroa_0_0_extract_trunc | 0) | 0;
        $_0$1 = 0 | $n_sroa_1_4_extract_trunc >>> ($78 >>> 0);
        $_0$0 = $n_sroa_1_4_extract_trunc << 32 - $78 | $n_sroa_0_0_extract_trunc >>> ($78 >>> 0) | 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
    }
  } while (0);
  if (($sr_1_ph | 0) == 0) {
    $q_sroa_1_1_lcssa = $q_sroa_1_1_ph;
    $q_sroa_0_1_lcssa = $q_sroa_0_1_ph;
    $r_sroa_1_1_lcssa = $r_sroa_1_1_ph;
    $r_sroa_0_1_lcssa = $r_sroa_0_1_ph;
    $carry_0_lcssa$1 = 0;
    $carry_0_lcssa$0 = 0;
  } else {
    $d_sroa_0_0_insert_insert99$0 = 0 | $b$0 & -1;
    $d_sroa_0_0_insert_insert99$1 = $d_sroa_1_4_extract_shift$0 | $b$1 & 0;
    $137$0 = _i64Add($d_sroa_0_0_insert_insert99$0 | 0, $d_sroa_0_0_insert_insert99$1 | 0, -1, -1) | 0;
    $137$1 = tempRet0;
    $q_sroa_1_1198 = $q_sroa_1_1_ph;
    $q_sroa_0_1199 = $q_sroa_0_1_ph;
    $r_sroa_1_1200 = $r_sroa_1_1_ph;
    $r_sroa_0_1201 = $r_sroa_0_1_ph;
    $sr_1202 = $sr_1_ph;
    $carry_0203 = 0;
    while (1) {
      $147 = $q_sroa_0_1199 >>> 31 | $q_sroa_1_1198 << 1;
      $149 = $carry_0203 | $q_sroa_0_1199 << 1;
      $r_sroa_0_0_insert_insert42$0 = 0 | ($r_sroa_0_1201 << 1 | $q_sroa_1_1198 >>> 31);
      $r_sroa_0_0_insert_insert42$1 = $r_sroa_0_1201 >>> 31 | $r_sroa_1_1200 << 1 | 0;
      _i64Subtract($137$0, $137$1, $r_sroa_0_0_insert_insert42$0, $r_sroa_0_0_insert_insert42$1) | 0;
      $150$1 = tempRet0;
      $151$0 = $150$1 >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1;
      $152 = $151$0 & 1;
      $154$0 = _i64Subtract($r_sroa_0_0_insert_insert42$0, $r_sroa_0_0_insert_insert42$1, $151$0 & $d_sroa_0_0_insert_insert99$0, ((($150$1 | 0) < 0 ? -1 : 0) >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1) & $d_sroa_0_0_insert_insert99$1) | 0;
      $r_sroa_0_0_extract_trunc = $154$0;
      $r_sroa_1_4_extract_trunc = tempRet0;
      $155 = $sr_1202 - 1 | 0;
      if (($155 | 0) == 0) {
        break;
      } else {
        $q_sroa_1_1198 = $147;
        $q_sroa_0_1199 = $149;
        $r_sroa_1_1200 = $r_sroa_1_4_extract_trunc;
        $r_sroa_0_1201 = $r_sroa_0_0_extract_trunc;
        $sr_1202 = $155;
        $carry_0203 = $152;
      }
    }
    $q_sroa_1_1_lcssa = $147;
    $q_sroa_0_1_lcssa = $149;
    $r_sroa_1_1_lcssa = $r_sroa_1_4_extract_trunc;
    $r_sroa_0_1_lcssa = $r_sroa_0_0_extract_trunc;
    $carry_0_lcssa$1 = 0;
    $carry_0_lcssa$0 = $152;
  }
  $q_sroa_0_0_insert_ext75$0 = $q_sroa_0_1_lcssa;
  $q_sroa_0_0_insert_ext75$1 = 0;
  $q_sroa_0_0_insert_insert77$1 = $q_sroa_1_1_lcssa | $q_sroa_0_0_insert_ext75$1;
  if (($rem | 0) != 0) {
    HEAP32[$rem >> 2] = 0 | $r_sroa_0_1_lcssa;
    HEAP32[$rem + 4 >> 2] = $r_sroa_1_1_lcssa | 0;
  }
  $_0$1 = (0 | $q_sroa_0_0_insert_ext75$0) >>> 31 | $q_sroa_0_0_insert_insert77$1 << 1 | ($q_sroa_0_0_insert_ext75$1 << 1 | $q_sroa_0_0_insert_ext75$0 >>> 31) & 0 | $carry_0_lcssa$1;
  $_0$0 = ($q_sroa_0_0_insert_ext75$0 << 1 | 0 >>> 31) & -2 | $carry_0_lcssa$0;
  return (tempRet0 = $_0$1, $_0$0) | 0;
}
// =======================================================================



  
function dynCall_i(index) {
  index = index|0;
  
  return FUNCTION_TABLE_i[index&31]()|0;
}


function jsCall_i_0() {
  
  return jsCall_i(0)|0;
}



function jsCall_i_1() {
  
  return jsCall_i(1)|0;
}



function jsCall_i_2() {
  
  return jsCall_i(2)|0;
}



function jsCall_i_3() {
  
  return jsCall_i(3)|0;
}



function jsCall_i_4() {
  
  return jsCall_i(4)|0;
}



function jsCall_i_5() {
  
  return jsCall_i(5)|0;
}



function jsCall_i_6() {
  
  return jsCall_i(6)|0;
}



function jsCall_i_7() {
  
  return jsCall_i(7)|0;
}



function dynCall_ii(index,a1) {
  index = index|0;
  a1=a1|0;
  return FUNCTION_TABLE_ii[index&31](a1|0)|0;
}


function jsCall_ii_0(a1) {
  a1=a1|0;
  return jsCall_ii(0,a1|0)|0;
}



function jsCall_ii_1(a1) {
  a1=a1|0;
  return jsCall_ii(1,a1|0)|0;
}



function jsCall_ii_2(a1) {
  a1=a1|0;
  return jsCall_ii(2,a1|0)|0;
}



function jsCall_ii_3(a1) {
  a1=a1|0;
  return jsCall_ii(3,a1|0)|0;
}



function jsCall_ii_4(a1) {
  a1=a1|0;
  return jsCall_ii(4,a1|0)|0;
}



function jsCall_ii_5(a1) {
  a1=a1|0;
  return jsCall_ii(5,a1|0)|0;
}



function jsCall_ii_6(a1) {
  a1=a1|0;
  return jsCall_ii(6,a1|0)|0;
}



function jsCall_ii_7(a1) {
  a1=a1|0;
  return jsCall_ii(7,a1|0)|0;
}



function dynCall_iiii(index,a1,a2,a3) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0;
  return FUNCTION_TABLE_iiii[index&31](a1|0,a2|0,a3|0)|0;
}


function jsCall_iiii_0(a1,a2,a3) {
  a1=a1|0; a2=a2|0; a3=a3|0;
  return jsCall_iiii(0,a1|0,a2|0,a3|0)|0;
}



function jsCall_iiii_1(a1,a2,a3) {
  a1=a1|0; a2=a2|0; a3=a3|0;
  return jsCall_iiii(1,a1|0,a2|0,a3|0)|0;
}



function jsCall_iiii_2(a1,a2,a3) {
  a1=a1|0; a2=a2|0; a3=a3|0;
  return jsCall_iiii(2,a1|0,a2|0,a3|0)|0;
}



function jsCall_iiii_3(a1,a2,a3) {
  a1=a1|0; a2=a2|0; a3=a3|0;
  return jsCall_iiii(3,a1|0,a2|0,a3|0)|0;
}



function jsCall_iiii_4(a1,a2,a3) {
  a1=a1|0; a2=a2|0; a3=a3|0;
  return jsCall_iiii(4,a1|0,a2|0,a3|0)|0;
}



function jsCall_iiii_5(a1,a2,a3) {
  a1=a1|0; a2=a2|0; a3=a3|0;
  return jsCall_iiii(5,a1|0,a2|0,a3|0)|0;
}



function jsCall_iiii_6(a1,a2,a3) {
  a1=a1|0; a2=a2|0; a3=a3|0;
  return jsCall_iiii(6,a1|0,a2|0,a3|0)|0;
}



function jsCall_iiii_7(a1,a2,a3) {
  a1=a1|0; a2=a2|0; a3=a3|0;
  return jsCall_iiii(7,a1|0,a2|0,a3|0)|0;
}



function dynCall_vi(index,a1) {
  index = index|0;
  a1=a1|0;
  FUNCTION_TABLE_vi[index&31](a1|0);
}


function jsCall_vi_0(a1) {
  a1=a1|0;
  jsCall_vi(0,a1|0);
}



function jsCall_vi_1(a1) {
  a1=a1|0;
  jsCall_vi(1,a1|0);
}



function jsCall_vi_2(a1) {
  a1=a1|0;
  jsCall_vi(2,a1|0);
}



function jsCall_vi_3(a1) {
  a1=a1|0;
  jsCall_vi(3,a1|0);
}



function jsCall_vi_4(a1) {
  a1=a1|0;
  jsCall_vi(4,a1|0);
}



function jsCall_vi_5(a1) {
  a1=a1|0;
  jsCall_vi(5,a1|0);
}



function jsCall_vi_6(a1) {
  a1=a1|0;
  jsCall_vi(6,a1|0);
}



function jsCall_vi_7(a1) {
  a1=a1|0;
  jsCall_vi(7,a1|0);
}


function b1() {
 ; nullFunc_i(0);return 0;
}
function b2() {
 ; nullFunc_i(9);return 0;
}
function b3() {
 ; nullFunc_i(10);return 0;
}
function b4() {
 ; nullFunc_i(11);return 0;
}
function b5() {
 ; nullFunc_i(12);return 0;
}
function b6() {
 ; nullFunc_i(13);return 0;
}
function b7() {
 ; nullFunc_i(14);return 0;
}
function b8() {
 ; nullFunc_i(15);return 0;
}
function b9() {
 ; nullFunc_i(16);return 0;
}
function b10() {
 ; nullFunc_i(17);return 0;
}
function b11() {
 ; nullFunc_i(19);return 0;
}
function b12() {
 ; nullFunc_i(20);return 0;
}
function b13() {
 ; nullFunc_i(21);return 0;
}
function b14() {
 ; nullFunc_i(22);return 0;
}
function b15() {
 ; nullFunc_i(23);return 0;
}
function b16() {
 ; nullFunc_i(24);return 0;
}
function b17() {
 ; nullFunc_i(25);return 0;
}
function b18() {
 ; nullFunc_i(26);return 0;
}
function b19() {
 ; nullFunc_i(27);return 0;
}
function b20() {
 ; nullFunc_i(28);return 0;
}
function b21() {
 ; nullFunc_i(29);return 0;
}
function b22() {
 ; nullFunc_i(30);return 0;
}
function b23() {
 ; nullFunc_i(31);return 0;
}
function b25(p0) {
 p0 = p0|0; nullFunc_ii(0);return 0;
}
function b26(p0) {
 p0 = p0|0; nullFunc_ii(9);return 0;
}
function b27(p0) {
 p0 = p0|0; nullFunc_ii(10);return 0;
}
function b28(p0) {
 p0 = p0|0; nullFunc_ii(11);return 0;
}
function b29(p0) {
 p0 = p0|0; nullFunc_ii(12);return 0;
}
function b30(p0) {
 p0 = p0|0; nullFunc_ii(13);return 0;
}
function b31(p0) {
 p0 = p0|0; nullFunc_ii(14);return 0;
}
function b32(p0) {
 p0 = p0|0; nullFunc_ii(15);return 0;
}
function b33(p0) {
 p0 = p0|0; nullFunc_ii(16);return 0;
}
function b34(p0) {
 p0 = p0|0; nullFunc_ii(17);return 0;
}
function b35(p0) {
 p0 = p0|0; nullFunc_ii(19);return 0;
}
function b36(p0) {
 p0 = p0|0; nullFunc_ii(20);return 0;
}
function b37(p0) {
 p0 = p0|0; nullFunc_ii(21);return 0;
}
function b38(p0) {
 p0 = p0|0; nullFunc_ii(22);return 0;
}
function b39(p0) {
 p0 = p0|0; nullFunc_ii(23);return 0;
}
function b40(p0) {
 p0 = p0|0; nullFunc_ii(24);return 0;
}
function b41(p0) {
 p0 = p0|0; nullFunc_ii(25);return 0;
}
function b42(p0) {
 p0 = p0|0; nullFunc_ii(26);return 0;
}
function b43(p0) {
 p0 = p0|0; nullFunc_ii(27);return 0;
}
function b44(p0) {
 p0 = p0|0; nullFunc_ii(28);return 0;
}
function b45(p0) {
 p0 = p0|0; nullFunc_ii(29);return 0;
}
function b46(p0) {
 p0 = p0|0; nullFunc_ii(30);return 0;
}
function b47(p0) {
 p0 = p0|0; nullFunc_ii(31);return 0;
}
function b49(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(0);return 0;
}
function b50(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(9);return 0;
}
function b51(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(10);return 0;
}
function b52(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(11);return 0;
}
function b53(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(12);return 0;
}
function b54(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(13);return 0;
}
function b55(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(14);return 0;
}
function b56(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(15);return 0;
}
function b57(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(16);return 0;
}
function b58(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(17);return 0;
}
function b59(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(21);return 0;
}
function b60(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(22);return 0;
}
function b61(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(23);return 0;
}
function b62(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(24);return 0;
}
function b63(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(25);return 0;
}
function b64(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(26);return 0;
}
function b65(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(27);return 0;
}
function b66(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(28);return 0;
}
function b67(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(29);return 0;
}
function b68(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(30);return 0;
}
function b69(p0,p1,p2) {
 p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(31);return 0;
}
function b71(p0) {
 p0 = p0|0; nullFunc_vi(0);
}
function b72(p0) {
 p0 = p0|0; nullFunc_vi(9);
}
function b73(p0) {
 p0 = p0|0; nullFunc_vi(10);
}
function b74(p0) {
 p0 = p0|0; nullFunc_vi(11);
}
function b75(p0) {
 p0 = p0|0; nullFunc_vi(12);
}
function b76(p0) {
 p0 = p0|0; nullFunc_vi(13);
}
function b77(p0) {
 p0 = p0|0; nullFunc_vi(14);
}
function b78(p0) {
 p0 = p0|0; nullFunc_vi(15);
}
function b79(p0) {
 p0 = p0|0; nullFunc_vi(16);
}
function b80(p0) {
 p0 = p0|0; nullFunc_vi(17);
}
function b81(p0) {
 p0 = p0|0; nullFunc_vi(19);
}
function b82(p0) {
 p0 = p0|0; nullFunc_vi(20);
}
function b83(p0) {
 p0 = p0|0; nullFunc_vi(21);
}
function b84(p0) {
 p0 = p0|0; nullFunc_vi(22);
}
function b85(p0) {
 p0 = p0|0; nullFunc_vi(23);
}
function b86(p0) {
 p0 = p0|0; nullFunc_vi(24);
}
function b87(p0) {
 p0 = p0|0; nullFunc_vi(25);
}
function b88(p0) {
 p0 = p0|0; nullFunc_vi(26);
}
function b89(p0) {
 p0 = p0|0; nullFunc_vi(27);
}
function b90(p0) {
 p0 = p0|0; nullFunc_vi(28);
}
function b91(p0) {
 p0 = p0|0; nullFunc_vi(29);
}
function b92(p0) {
 p0 = p0|0; nullFunc_vi(30);
}
function b93(p0) {
 p0 = p0|0; nullFunc_vi(31);
}

// EMSCRIPTEN_END_FUNCS
var FUNCTION_TABLE_i = [b1,jsCall_i_0,jsCall_i_1,jsCall_i_2,jsCall_i_3,jsCall_i_4,jsCall_i_5,jsCall_i_6,jsCall_i_7,b2,b3,b4,b5,b6,b7,b8,b9,b10,_u8rnd,b11,b12,b13,b14,b15,b16,b17,b18,b19,b20
,b21,b22,b23];
var FUNCTION_TABLE_ii = [b25,jsCall_ii_0,jsCall_ii_1,jsCall_ii_2,jsCall_ii_3,jsCall_ii_4,jsCall_ii_5,jsCall_ii_6,jsCall_ii_7,b26,b27,b28,b29,b30,b31,b32,b33,b34,___stdio_close,b35,b36,b37,b38,b39,b40,b41,b42,b43,b44
,b45,b46,b47];
var FUNCTION_TABLE_iiii = [b49,jsCall_iiii_0,jsCall_iiii_1,jsCall_iiii_2,jsCall_iiii_3,jsCall_iiii_4,jsCall_iiii_5,jsCall_iiii_6,jsCall_iiii_7,b50,b51,b52,b53,b54,b55,b56,b57,b58,___stdio_write,___stdio_seek,___stdout_write,b59,b60,b61,b62,b63,b64,b65,b66
,b67,b68,b69];
var FUNCTION_TABLE_vi = [b71,jsCall_vi_0,jsCall_vi_1,jsCall_vi_2,jsCall_vi_3,jsCall_vi_4,jsCall_vi_5,jsCall_vi_6,jsCall_vi_7,b72,b73,b74,b75,b76,b77,b78,b79,b80,_cleanup392,b81,b82,b83,b84,b85,b86,b87,b88,b89,b90
,b91,b92,b93];

  return { _mceliecejs_init: _mceliecejs_init, _mceliecejs_encrypt: _mceliecejs_encrypt, _free: _free, _mceliecejs_private_key_bytes: _mceliecejs_private_key_bytes, _mceliecejs_decrypted_bytes: _mceliecejs_decrypted_bytes, _i64Add: _i64Add, _mceliecejs_keypair: _mceliecejs_keypair, _i64Subtract: _i64Subtract, _memset: _memset, _malloc: _malloc, _mceliecejs_public_key_bytes: _mceliecejs_public_key_bytes, _memcpy: _memcpy, _bitshift64Lshr: _bitshift64Lshr, _mceliecejs_encrypted_bytes: _mceliecejs_encrypted_bytes, _mceliecejs_decrypt: _mceliecejs_decrypt, _bitshift64Shl: _bitshift64Shl, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, establishStackSpace: establishStackSpace, setThrew: setThrew, setTempRet0: setTempRet0, getTempRet0: getTempRet0, dynCall_i: dynCall_i, dynCall_ii: dynCall_ii, dynCall_iiii: dynCall_iiii, dynCall_vi: dynCall_vi };
})
// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);
var real__mceliecejs_init = asm["_mceliecejs_init"]; asm["_mceliecejs_init"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__mceliecejs_init.apply(null, arguments);
};

var real__mceliecejs_encrypt = asm["_mceliecejs_encrypt"]; asm["_mceliecejs_encrypt"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__mceliecejs_encrypt.apply(null, arguments);
};

var real__free = asm["_free"]; asm["_free"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__free.apply(null, arguments);
};

var real__mceliecejs_private_key_bytes = asm["_mceliecejs_private_key_bytes"]; asm["_mceliecejs_private_key_bytes"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__mceliecejs_private_key_bytes.apply(null, arguments);
};

var real__mceliecejs_public_key_bytes = asm["_mceliecejs_public_key_bytes"]; asm["_mceliecejs_public_key_bytes"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__mceliecejs_public_key_bytes.apply(null, arguments);
};

var real__i64Add = asm["_i64Add"]; asm["_i64Add"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__i64Add.apply(null, arguments);
};

var real__mceliecejs_keypair = asm["_mceliecejs_keypair"]; asm["_mceliecejs_keypair"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__mceliecejs_keypair.apply(null, arguments);
};

var real__i64Subtract = asm["_i64Subtract"]; asm["_i64Subtract"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__i64Subtract.apply(null, arguments);
};

var real__malloc = asm["_malloc"]; asm["_malloc"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__malloc.apply(null, arguments);
};

var real__mceliecejs_decrypted_bytes = asm["_mceliecejs_decrypted_bytes"]; asm["_mceliecejs_decrypted_bytes"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__mceliecejs_decrypted_bytes.apply(null, arguments);
};

var real__bitshift64Lshr = asm["_bitshift64Lshr"]; asm["_bitshift64Lshr"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__bitshift64Lshr.apply(null, arguments);
};

var real__mceliecejs_encrypted_bytes = asm["_mceliecejs_encrypted_bytes"]; asm["_mceliecejs_encrypted_bytes"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__mceliecejs_encrypted_bytes.apply(null, arguments);
};

var real__mceliecejs_decrypt = asm["_mceliecejs_decrypt"]; asm["_mceliecejs_decrypt"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__mceliecejs_decrypt.apply(null, arguments);
};

var real__bitshift64Shl = asm["_bitshift64Shl"]; asm["_bitshift64Shl"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__bitshift64Shl.apply(null, arguments);
};
var _mceliecejs_init = Module["_mceliecejs_init"] = asm["_mceliecejs_init"];
var _mceliecejs_encrypt = Module["_mceliecejs_encrypt"] = asm["_mceliecejs_encrypt"];
var _free = Module["_free"] = asm["_free"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var _mceliecejs_private_key_bytes = Module["_mceliecejs_private_key_bytes"] = asm["_mceliecejs_private_key_bytes"];
var _mceliecejs_public_key_bytes = Module["_mceliecejs_public_key_bytes"] = asm["_mceliecejs_public_key_bytes"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _mceliecejs_keypair = Module["_mceliecejs_keypair"] = asm["_mceliecejs_keypair"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _mceliecejs_decrypted_bytes = Module["_mceliecejs_decrypted_bytes"] = asm["_mceliecejs_decrypted_bytes"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var _mceliecejs_encrypted_bytes = Module["_mceliecejs_encrypted_bytes"] = asm["_mceliecejs_encrypted_bytes"];
var _mceliecejs_decrypt = Module["_mceliecejs_decrypt"] = asm["_mceliecejs_decrypt"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
;

Runtime.stackAlloc = asm['stackAlloc'];
Runtime.stackSave = asm['stackSave'];
Runtime.stackRestore = asm['stackRestore'];
Runtime.establishStackSpace = asm['establishStackSpace'];

Runtime.setTempRet0 = asm['setTempRet0'];
Runtime.getTempRet0 = asm['getTempRet0'];



// === Auto-generated postamble setup entry stuff ===


function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun']) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString(Module['thisProgram']), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);


  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    exit(ret, /* implicit = */ true);
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    if (ABORT) return; 

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    if (Module['_main'] && shouldRunNow) Module['callMain'](args);

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status, implicit) {
  if (implicit && Module['noExitRuntime']) {
    Module.printErr('exit(' + status + ') implicitly called by end of main(), but noExitRuntime, so not exiting the runtime (you can use emscripten_force_exit, if you want to force a true shutdown)');
    return;
  }

  if (Module['noExitRuntime']) {
    Module.printErr('exit(' + status + ') called, but noExitRuntime, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)');
  } else {

    ABORT = true;
    EXITSTATUS = status;
    STACKTOP = initialStackTop;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  if (ENVIRONMENT_IS_NODE) {
    // Work around a node.js bug where stdout buffer is not flushed at process exit:
    // Instead of process.exit() directly, wait for stdout flush event.
    // See https://github.com/joyent/node/issues/1669 and https://github.com/kripken/emscripten/issues/2582
    // Workaround is based on https://github.com/RReverser/acorn/commit/50ab143cecc9ed71a2d66f78b4aec3bb2e9844f6
    process['stdout']['once']('drain', function () {
      process['exit'](status);
    });
    console.log(' '); // Make sure to print something to force the drain event to occur, in case the stdout buffer was empty.
    // Work around another node bug where sometimes 'drain' is never fired - make another effort
    // to emit the exit status, after a significant delay (if node hasn't fired drain by then, give up)
    setTimeout(function() {
      process['exit'](status);
    }, 500);
  } else
  if (ENVIRONMENT_IS_SHELL && typeof quit === 'function') {
    quit(status);
  }
  // if we reach here, we must throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

var abortDecorators = [];

function abort(what) {
  if (what !== undefined) {
    Module.print(what);
    Module.printErr(what);
    what = JSON.stringify(what)
  } else {
    what = '';
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '';

  var output = 'abort(' + what + ') at ' + stackTrace() + extra;
  if (abortDecorators) {
    abortDecorators.forEach(function(decorator) {
      output = decorator(output, what);
    });
  }
  throw output;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}


// EMSCRIPTEN_GENERATED_FUNCTIONS: ["_i64Subtract","_memset","_bitshift64Lshr","_bitshift64Shl","_i64Add","_memcpy","_bitshift64Ashr","_llvm_cttz_i32"]


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
//# sourceMappingURL=mceliece.debug.js.map