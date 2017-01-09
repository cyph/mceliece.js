var mceliece = (function () {
var sodiumUtil=function(){function from_string(str){if(typeof TextEncoder==="function"){return new TextEncoder("utf-8").encode(str)}str=unescape(encodeURIComponent(str));var bytes=new Uint8Array(str.length);for(var i=0;i<str.length;i++){bytes[i]=str.charCodeAt(i)}return bytes}function to_string(bytes){if(typeof TextDecoder==="function"){return new TextDecoder("utf-8",{fatal:true}).decode(bytes)}var toStringChunkSize=8192,numChunks=Math.ceil(bytes.length/toStringChunkSize);if(numChunks<=1){try{return decodeURIComponent(escape(String.fromCharCode.apply(null,bytes)))}catch(_){throw new TypeError("The encoded data was not valid.")}}var totalString="";var sequenceReadOffset=0;for(var i=0;i<numChunks;i++){var currentChunk=Array.prototype.slice.call(bytes,i*toStringChunkSize+sequenceReadOffset,(i+1)*toStringChunkSize+sequenceReadOffset);if(currentChunk.length==0){continue}var sequenceDetectionComplete,sequenceIndex=currentChunk.length,sequenceLength=0;do{sequenceIndex--;var currentByte=currentChunk[sequenceIndex];if(currentByte>=240){sequenceLength=4;sequenceDetectionComplete=true}else if(currentByte>=224){sequenceLength=3;sequenceDetectionComplete=true}else if(currentByte>=192){sequenceLength=2;sequenceDetectionComplete=true}else if(currentByte<128){sequenceLength=1;sequenceDetectionComplete=true}}while(!sequenceDetectionComplete);var extraBytes=sequenceLength-(currentChunk.length-sequenceIndex);for(var j=0;j<extraBytes;j++){sequenceReadOffset--;currentChunk.pop()}totalString+=to_string(currentChunk)}return totalString}function from_hex(str){if(!is_hex(str)){throw new TypeError("The provided string doesn't look like hex data")}var result=new Uint8Array(str.length/2);for(var i=0;i<str.length;i+=2){result[i>>>1]=parseInt(str.substr(i,2),16)}return result}function to_hex(bytes){var str="",b,c,x;for(var i=0;i<bytes.length;i++){c=bytes[i]&15;b=bytes[i]>>>4;x=87+c+(c-10>>8&~38)<<8|87+b+(b-10>>8&~38);str+=String.fromCharCode(x&255)+String.fromCharCode(x>>>8)}return str}function is_hex(str){return typeof str==="string"&&/^[0-9a-f]+$/i.test(str)&&str.length%2===0}function from_base64(sBase64,nBlocksSize){function _b64ToUint6(nChr){return nChr>64&&nChr<91?nChr-65:nChr>96&&nChr<123?nChr-71:nChr>47&&nChr<58?nChr+4:nChr===43?62:nChr===47?63:0}var sB64Enc=sBase64.replace(/[^A-Za-z0-9\+\/]/g,""),nInLen=sB64Enc.length,nOutLen=nBlocksSize?Math.ceil((nInLen*3+1>>2)/nBlocksSize)*nBlocksSize:nInLen*3+1>>2,taBytes=new Uint8Array(nOutLen);for(var nMod3,nMod4,nUint24=0,nOutIdx=0,nInIdx=0;nInIdx<nInLen;nInIdx++){nMod4=nInIdx&3;nUint24|=_b64ToUint6(sB64Enc.charCodeAt(nInIdx))<<18-6*nMod4;if(nMod4===3||nInLen-nInIdx===1){for(nMod3=0;nMod3<3&&nOutIdx<nOutLen;nMod3++,nOutIdx++){taBytes[nOutIdx]=nUint24>>>(16>>>nMod3&24)&255}nUint24=0}}return taBytes}function to_base64(aBytes,noNewLine){if(typeof noNewLine==="undefined"){noNewLine=true}function _uint6ToB64(nUint6){return nUint6<26?nUint6+65:nUint6<52?nUint6+71:nUint6<62?nUint6-4:nUint6===62?43:nUint6===63?47:65}if(typeof aBytes==="string"){throw new Error("input has to be an array")}var nMod3=2,sB64Enc="";for(var nLen=aBytes.length,nUint24=0,nIdx=0;nIdx<nLen;nIdx++){nMod3=nIdx%3;if(nIdx>0&&nIdx*4/3%76===0&&!noNewLine){sB64Enc+="\r\n"}nUint24|=aBytes[nIdx]<<(16>>>nMod3&24);if(nMod3===2||aBytes.length-nIdx===1){sB64Enc+=String.fromCharCode(_uint6ToB64(nUint24>>>18&63),_uint6ToB64(nUint24>>>12&63),_uint6ToB64(nUint24>>>6&63),_uint6ToB64(nUint24&63));nUint24=0}}return sB64Enc.substr(0,sB64Enc.length-2+nMod3)+(nMod3===2?"":nMod3===1?"=":"==")}function output_formats(){return["uint8array","text","hex","base64"]}function _format_output(output,optionalOutputFormat){var selectedOutputFormat=optionalOutputFormat||output_format;if(!_is_output_format(selectedOutputFormat)){throw new Error(selectedOutputFormat+" output format is not available")}if(output instanceof AllocatedBuf){if(selectedOutputFormat==="uint8array"){return output.to_Uint8Array()}else if(selectedOutputFormat==="text"){return to_string(output.to_Uint8Array())}else if(selectedOutputFormat==="hex"){return to_hex(output.to_Uint8Array())}else if(selectedOutputFormat==="base64"){return to_base64(output.to_Uint8Array())}else{throw new Error('What is output format "'+selectedOutputFormat+'"?')}}else if(typeof output==="object"){var props=Object.keys(output);var formattedOutput={};for(var i=0;i<props.length;i++){formattedOutput[props[i]]=_format_output(output[props[i]],selectedOutputFormat)}return formattedOutput}else if(typeof output==="string"){return output}else{throw new TypeError("Cannot format output")}}function _is_output_format(format){var formats=output_formats();for(var i=0;i<formats.length;i++){if(formats[i]===format){return true}}return false}function _check_output_format(format){if(!format){return}else if(typeof format!=="string"){throw new TypeError("When defined, the output format must be a string")}else if(!_is_output_format(format)){throw new Error(format+" is not a supported output format")}}function memcmp(b1,b2){if(!(b1 instanceof Uint8Array&&b2 instanceof Uint8Array)){throw new TypeError("Only Uint8Array instances can be compared")}if(b1.length!==b2.length){throw new TypeError("Only instances of identical length can be compared")}for(var d=0|0,i=0|0,j=b1.length;i<j;i++){d|=b1[i]^b2[i]}return d===0}function memzero(bytes){if(!bytes instanceof Uint8Array){throw new TypeError("Only Uint8Array instances can be wiped")}for(var i=0|0,j=bytes.length;i<j;i++){bytes[i]=0}}return{from_base64:from_base64,from_hex:from_hex,from_string:from_string,memcmp:memcmp,memzero:memzero,to_base64:to_base64,to_hex:to_hex,to_string:to_string}}();
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
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;

// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)

if (Module['ENVIRONMENT']) {
  if (Module['ENVIRONMENT'] === 'WEB') {
    ENVIRONMENT_IS_WEB = true;
  } else if (Module['ENVIRONMENT'] === 'WORKER') {
    ENVIRONMENT_IS_WORKER = true;
  } else if (Module['ENVIRONMENT'] === 'NODE') {
    ENVIRONMENT_IS_NODE = true;
  } else if (Module['ENVIRONMENT'] === 'SHELL') {
    ENVIRONMENT_IS_SHELL = true;
  } else {
    throw new Error('The provided Module[\'ENVIRONMENT\'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.');
  }
} else {
  ENVIRONMENT_IS_WEB = typeof window === 'object';
  ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
  ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
  ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
}


if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = console.log;
  if (!Module['printErr']) Module['printErr'] = console.warn;

  var nodeFS;
  var nodePath;

  Module['read'] = function read(filename, binary) {
    if (!nodeFS) nodeFS = require('fs');
    if (!nodePath) nodePath = require('path');
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    return binary ? ret : ret.toString();
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
    Module['read'] = function read() { throw 'no read() available' };
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

  Module['readAsync'] = function readAsync(url, onload, onerror) {
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
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.warn(x);
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
  abort('NO_DYNAMIC_EXECUTION=1 was set, cannot eval');
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
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = undefined;



// {{PREAMBLE_ADDITIONS}}

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
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
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
      // optimize away arguments usage in common cases
      if (sig.length === 1) {
        sigCache[func] = function dynCall_wrapper() {
          return Runtime.dynCall(sig, func);
        };
      } else if (sig.length === 2) {
        sigCache[func] = function dynCall_wrapper(arg) {
          return Runtime.dynCall(sig, func, [arg]);
        };
      } else {
        // general case
        sigCache[func] = function dynCall_wrapper() {
          return Runtime.dynCall(sig, func, Array.prototype.slice.call(arguments));
        };
      }
    }
    return sigCache[func];
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+15)&-16);(assert((((STACKTOP|0) < (STACK_MAX|0))|0))|0); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + (assert(!staticSealed),size))|0;STATICTOP = (((STATICTOP)+15)&-16); return ret; },
  dynamicAlloc: function (size) { assert(DYNAMICTOP_PTR);var ret = HEAP32[DYNAMICTOP_PTR>>2];var end = (((ret + size + 15)|0) & -16);HEAP32[DYNAMICTOP_PTR>>2] = end;if (end >= TOTAL_MEMORY) {var success = enlargeMemory();if (!success) {HEAP32[DYNAMICTOP_PTR>>2] = ret;return 0;}}return ret;},
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

var ABORT = 0; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

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
    abort('NO_DYNAMIC_EXECUTION=1 was set, cannot eval');
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
        var len = (str.length << 2) + 1;
        ret = Runtime.stackAlloc(len);
        stringToUTF8(str, ret, len);
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
    ret = [typeof _malloc === 'function' ? _malloc : Runtime.staticAlloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
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
  if (!runtimeInitialized) return Runtime.dynamicAlloc(size);
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

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;
function UTF8ArrayToString(u8Array, idx) {
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  while (u8Array[endPtr]) ++endPtr;

  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  } else {
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

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;
function UTF16ToString(ptr) {
  assert(ptr % 2 == 0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  while (HEAP16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var i = 0;

    var str = '';
    while (1) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0) return str;
      ++i;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }
  }
}


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
  assert(outPtr % 2 == 0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
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


// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}


function UTF32ToString(ptr) {
  assert(ptr % 4 == 0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
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
  assert(outPtr % 4 == 0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
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


function demangle(func) {
  var hasLibcxxabi = !!Module['___cxa_demangle'];
  if (hasLibcxxabi) {
    try {
      var s = func.substr(1);
      var len = lengthBytesUTF8(s)+1;
      var buf = _malloc(len);
      stringToUTF8(s, buf, len);
      var status = _malloc(4);
      var ret = Module['___cxa_demangle'](buf, 0, 0, status);
      if (getValue(status, 'i32') === 0 && ret) {
        return Pointer_stringify(ret);
      }
      // otherwise, libcxxabi failed
    } catch(e) {
      // ignore problems here
    } finally {
      if (buf) _free(buf);
      if (status) _free(status);
      if (ret) _free(ret);
    }
    // failure when using libcxxabi, don't demangle
    return func;
  }
  Runtime.warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
  return func;
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
  var js = jsStackTrace();
  if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
  return demangleAll(js);
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
var buffer;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBuffer(buf) {
  Module['buffer'] = buffer = buf;
}

function updateGlobalBufferViews() {
  Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
  Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
  Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
}

var STATIC_BASE, STATICTOP, staticSealed; // static area
var STACK_BASE, STACKTOP, STACK_MAX; // stack area
var DYNAMIC_BASE, DYNAMICTOP_PTR; // dynamic area handled by sbrk

  STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
  staticSealed = false;


// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  assert((STACK_MAX & 3) == 0);
  HEAPU32[(STACK_MAX >> 2)-1] = 0x02135467;
  HEAPU32[(STACK_MAX >> 2)-2] = 0x89BACDFE;
}

function checkStackCookie() {
  if (HEAPU32[(STACK_MAX >> 2)-1] != 0x02135467 || HEAPU32[(STACK_MAX >> 2)-2] != 0x89BACDFE) {
    abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x02135467, but received 0x' + HEAPU32[(STACK_MAX >> 2)-2].toString(16) + ' ' + HEAPU32[(STACK_MAX >> 2)-1].toString(16));
  }
  // Also test the global address 0 for integrity. This check is not compatible with SAFE_SPLIT_MEMORY though, since that mode already tests all address 0 accesses on its own.
  if (HEAP32[0] !== 0x63736d65 /* 'emsc' */) throw 'Runtime error: The application has corrupted its heap memory area (address zero)!';
}

function abortStackOverflow(allocSize) {
  abort('Stack overflow! Attempted to allocate ' + allocSize + ' bytes on the stack, but stack has only ' + (STACK_MAX - asm.stackSave() + allocSize) + ' bytes available!');
}

function abortOnCannotGrowMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which adjusts the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
}


function enlargeMemory() {
  abortOnCannotGrowMemory();
}


var TOTAL_STACK = Module['TOTAL_STACK'] || 2097152;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 4194304;

var WASM_PAGE_SIZE = 64 * 1024;

var totalMemory = WASM_PAGE_SIZE;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024;
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



// Use a provided buffer, if there is one, or else allocate a new one
if (Module['buffer']) {
  buffer = Module['buffer'];
  assert(buffer.byteLength === TOTAL_MEMORY, 'provided buffer should be ' + TOTAL_MEMORY + ' bytes, but it is ' + buffer.byteLength);
} else {
  // Use a WebAssembly memory where available
  {
    buffer = new ArrayBuffer(TOTAL_MEMORY);
  }
  assert(buffer.byteLength === TOTAL_MEMORY);
}
updateGlobalBufferViews();


function getTotalMemory() {
  return TOTAL_MEMORY;
}

// Endianness check (note: assumes compiler arch was little-endian)
  HEAP32[0] = 0x63736d65; /* 'emsc' */
HEAP16[1] = 0x6373;
if (HEAPU8[2] !== 0x73 || HEAPU8[3] !== 0x63) throw 'Runtime error: expected the system to be little-endian!';

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
  checkStackCookie();
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  checkStackCookie();
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  checkStackCookie();
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  checkStackCookie();
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

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
function writeStringToMemory(string, buffer, dontAddNull) {
  Runtime.warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var lastChar, end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}
Module["writeStringToMemory"] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  HEAP8.set(array, buffer);    
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

if (!Math['trunc']) Math['trunc'] = function(x) {
  return x < 0 ? Math.ceil(x) : Math.floor(x);
};
Math.trunc = Math['trunc'];

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
var Math_round = Math.round;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;

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



var /* show errors on likely calls to FS when it was not included */ FS = {
  error: function() {
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with  -s FORCE_FILESYSTEM=1');
  },
  init: function() { FS.error() },
  createDataFile: function() { FS.error() },
  createPreloadedFile: function() { FS.error() },
  createLazyFile: function() { FS.error() },
  open: function() { FS.error() },
  mkdev: function() { FS.error() },
  registerDevice: function() { FS.error() },
  analyzePath: function() { FS.error() },
  loadFilesFromDB: function() { FS.error() },

  ErrnoError: function ErrnoError() { FS.error() },
};
Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile;


// === Body ===

var ASM_CONSTS = [function() { { return Module.getRandomValue(); } },
 function() { { if (Module.getRandomValue === undefined) { try { var window_ = "object" === typeof window ? window : self, crypto_ = typeof window_.crypto !== "undefined" ? window_.crypto : window_.msCrypto, randomValuesStandard = function() { var buf = new Uint32Array(1); crypto_.getRandomValues(buf); return buf[0] >>> 0; }; randomValuesStandard(); Module.getRandomValue = randomValuesStandard; } catch (e) { try { var crypto = require('crypto'), randomValueNodeJS = function() { var buf = crypto.randomBytes(4); return (buf[0] << 24 | buf[1] << 16 | buf[2] << 8 | buf[3]) >>> 0; }; randomValueNodeJS(); Module.getRandomValue = randomValueNodeJS; } catch (e) { throw 'No secure random number generator found'; } } } } }];

function _emscripten_asm_const_i(code) {
 return ASM_CONSTS[code]();
}

function _emscripten_asm_const_v(code) {
 return ASM_CONSTS[code]();
}



STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 13072;
  /* global initializers */  __ATINIT__.push();
  

/* memory initializer */ allocate([11,0,0,0,60,0,0,0,12,0,0,0,60,0,0,0,36,0,0,0,84,0,0,0,132,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,6,0,0,0,5,0,0,0,5,0,0,0,20,0,0,0,60,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,60,2,0,0,120,2,0,0,240,2,0,0,176,3,0,0,208,4,0,0,204,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,180,0,0,0,60,1,0,0,124,1,0,0,172,1,0,0,212,1,0,0,252,1,0,0,28,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,4,0,0,0,155,0,0,0,5,0,0,0,49,2,0,0,6,0,0,0,137,1,0,0,9,0,0,0,221,0,0,0,12,0,0,0,53,3,0,0,12,0,0,0,129,2,0,0,14,0,0,0,87,3,0,0,15,0,0,0,123,0,0,0,19,0,0,0,123,0,0,0,20,0,0,0,215,0,0,0,20,0,0,0,75,1,0,0,20,0,0,0,131,3,0,0,19,0,0,0,27,2,0,0,20,0,0,0,61,2,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,63,0,0,0,5,0,0,0,139,2,0,0,6,0,0,0,155,0,0,0,12,0,0,0,209,1,0,0,14,0,0,0,143,0,0,0,19,0,0,0,37,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,127,0,0,0,6,0,0,0,77,1,0,0,10,0,0,0,139,2,0,0,14,0,0,0,63,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0,0,7,0,0,0,81,1,0,0,13,0,0,0,77,1,0,0,19,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,1,0,0,8,0,0,0,83,1,0,0,16,0,0,0,81,1,0,0,23,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,3,0,0,9,0,0,0,85,0,0,0,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,3,0,0,11,0,0,0,169,2,0,0,21,0,0,0,1,0,0,0,7,0,0,0,76,18,0,0,0,0,0,0,9,0,0,0,104,18,0,0,1,0,0,0,9,0,0,0,144,18,0,0,2,0,0,0,9,0,0,0,180,18,0,0,2,0,0,0,10,0,0,0,212,18,0,0,0,0,0,0,6,0,0,0,232,16,0,0,0,0,0,0,7,0,0,0,4,17,0,0,0,0,0,0,8,0,0,0,36,17,0,0,0,0,0,0,9,0,0,0,72,17,0,0,1,0,0,0,9,0,0,0,112,17,0,0,1,0,0,0,10,0,0,0,148,17,0,0,2,0,0,0,10,0,0,0,188,17,0,0,3,0,0,0,10,0,0,0,224,17,0,0,3,0,0,0,11,0,0,0,0,18,0,0,3,0,0,0,12,0,0,0,36,18,0,0,0,0,0,0,5,0,0,0,176,14,0,0,0,0,0,0,6,0,0,0,200,14,0,0,1,0,0,0,6,0,0,0,228,14,0,0,1,0,0,0,7,0,0,0,252,14,0,0,1,0,0,0,8,0,0,0,24,15,0,0,1,0,0,0,9,0,0,0,56,15,0,0,2,0,0,0,9,0,0,0,92,15,0,0,2,0,0,0,10,0,0,0,124,15,0,0,2,0,0,0,11,0,0,0,160,15,0,0,3,0,0,0,11,0,0,0,200,15,0,0,3,0,0,0,12,0,0,0,236,15,0,0,4,0,0,0,12,0,0,0,20,16,0,0,4,0,0,0,13,0,0,0,56,16,0,0,4,0,0,0,14,0,0,0,96,16,0,0,4,0,0,0,15,0,0,0,140,16,0,0,5,0,0,0,15,0,0,0,188,16,0,0,0,0,0,0,5,0,0,0,200,10,0,0,0,0,0,0,6,0,0,0,224,10,0,0,0,0,0,0,7,0,0,0,252,10,0,0,1,0,0,0,7,0,0,0,28,11,0,0,1,0,0,0,8,0,0,0,56,11,0,0,1,0,0,0,9,0,0,0,88,11,0,0,1,0,0,0,10,0,0,0,124,11,0,0,2,0,0,0,10,0,0,0,164,11,0,0,2,0,0,0,11,0,0,0,200,11,0,0,3,0,0,0,11,0,0,0,240,11,0,0,3,0,0,0,12,0,0,0,20,12,0,0,3,0,0,0,13,0,0,0,60,12,0,0,4,0,0,0,13,0,0,0,104,12,0,0,4,0,0,0,14,0,0,0,144,12,0,0,5,0,0,0,14,0,0,0,188,12,0,0,4,0,0,0,16,0,0,0,228,12,0,0,4,0,0,0,17,0,0,0,24,13,0,0,5,0,0,0,17,0,0,0,80,13,0,0,5,0,0,0,18,0,0,0,132,13,0,0,7,0,0,0,17,0,0,0,188,13,0,0,7,0,0,0,18,0,0,0,232,13,0,0,7,0,0,0,19,0,0,0,24,14,0,0,8,0,0,0,19,0,0,0,76,14,0,0,8,0,0,0,20,0,0,0,124,14,0,0,4,0,0,0,16,0,0,0,44,6,0,0,5,0,0,0,16,0,0,0,96,6,0,0,4,0,0,0,18,0,0,0,144,6,0,0,6,0,0,0,17,0,0,0,204,6,0,0,7,0,0,0,17,0,0,0,252,6,0,0,6,0,0,0,19,0,0,0,40,7,0,0,6,0,0,0,20,0,0,0,96,7,0,0,8,0,0,0,19,0,0,0,156,7,0,0,8,0,0,0,20,0,0,0,204,7,0,0,8,0,0,0,21,0,0,0,0,8,0,0,8,0,0,0,22,0,0,0,56,8,0,0,9,0,0,0,22,0,0,0,116,8,0,0,10,0,0,0,22,0,0,0,172,8,0,0,9,0,0,0,24,0,0,0,224,8,0,0,11,0,0,0,23,0,0,0,32,9,0,0,10,0,0,0,25,0,0,0,84,9,0,0,11,0,0,0,25,0,0,0,148,9,0,0,12,0,0,0,25,0,0,0,208,9,0,0,12,0,0,0,26,0,0,0,8,10,0,0,12,0,0,0,27,0,0,0,68,10,0,0,12,0,0,0,28,0,0,0,132,10,0,0,20,0,0,0,40,0,0,0,216,5,0,0,0,0,0,0,7,0,0,0,20,0,0,0,44,0,0,0,85,0,0,0,148,0,0,0,239,0,0,0,108,1,0,0,10,2,0,0,198,2,0,0,149,3,0,0,107,4,0,0,58,5,0,0,246,5,0,0,148,6,0,0,17,7,0,0,108,7,0,0,171,7,0,0,212,7,0,0,236,7,0,0,249,7,0,0,0,0,0,0,9,0,0,0,38,0,0,0,112,0,0,0,7,1,0,0,254,1,0,0,73,3,0,0,183,4,0,0,2,6,0,0,249,6,0,0,144,7,0,0,218,7,0,0,247,7,0,0,0,0,0,0,19,0,0,0,71,0,0,0,184,0,0,0,127,1,0,0,162,2,0,0,0,4,0,0,94,5,0,0,129,6,0,0,72,7,0,0,185,7,0,0,237,7,0,0,0,0,0,0,3,0,0,0,15,0,0,0,50,0,0,0,132,0,0,0,31,1,0,0,19,2,0,0,82,3,0,0,174,4,0,0,237,5,0,0,225,6,0,0,124,7,0,0,206,7,0,0,241,7,0,0,253,7,0,0,0,0,0,0,24,0,0,0,82,0,0,0,202,0,0,0,147,1,0,0,175,2,0,0,0,4,0,0,81,5,0,0,109,6,0,0,54,7,0,0,174,7,0,0,232,7,0,0,0,0,0,0,42,0,0,0,131,0,0,0,37,1,0,0,27,2,0,0,85,3,0,0,171,4,0,0,229,5,0,0,219,6,0,0,125,7,0,0,214,7,0,0,0,0,0,0,10,0,0,0,38,0,0,0,103,0,0,0,226,0,0,0,170,1,0,0,190,2,0,0,0,4,0,0,66,5,0,0,86,6,0,0,30,7,0,0,153,7,0,0,218,7,0,0,246,7,0,0,0,0,0,0,6,0,0,0,25,0,0,0,71,0,0,0,165,0,0,0,71,1,0,0,52,2,0,0,95,3,0,0,161,4,0,0,204,5,0,0,185,6,0,0,91,7,0,0,185,7,0,0,231,7,0,0,250,7,0,0,0,0,0,0,33,0,0,0,104,0,0,0,233,0,0,0,180,1,0,0,196,2,0,0,0,4,0,0,60,5,0,0,76,6,0,0,23,7,0,0,152,7,0,0,223,7,0,0,0,0,0,0,23,0,0,0,74,0,0,0,173,0,0,0,83,1,0,0,63,2,0,0,99,3,0,0,157,4,0,0,193,5,0,0,173,6,0,0,83,7,0,0,182,7,0,0,233,7,0,0,0,0,0,0,15,0,0,0,52,0,0,0,127,0,0,0,3,1,0,0,202,1,0,0,210,2,0,0,0,4,0,0,46,5,0,0,54,6,0,0,253,6,0,0,129,7,0,0,204,7,0,0,241,7,0,0,0,0,0,0,10,0,0,0,36,0,0,0,92,0,0,0,195,0,0,0,104,1,0,0,79,2,0,0,105,3,0,0,151,4,0,0,177,5,0,0,152,6,0,0,61,7,0,0,164,7,0,0,220,7,0,0,246,7,0,0,0,0,0,0,18,0,0,0,59,0,0,0,138,0,0,0,17,1,0,0,216,1,0,0,218,2,0,0,0,4,0,0,38,5,0,0,40,6,0,0,239,6,0,0,118,7,0,0,197,7,0,0,238,7,0,0,0,0,0,0,30,0,0,0,90,0,0,0,198,0,0,0,110,1,0,0,85,2,0,0,108,3,0,0,148,4,0,0,171,5,0,0,146,6,0,0,58,7,0,0,166,7,0,0,226,7,0,0,0,0,0,0,8,0,0,0,29,0,0,0,73,0,0,0,156,0,0,0,36,1,0,0,233,1,0,0,228,2,0,0,0,4,0,0,28,5,0,0,23,6,0,0,220,6,0,0,100,7,0,0,183,7,0,0,227,7,0,0,248,7,0,0,0,0,0,0,33,0,0,0,98,0,0,0,209,0,0,0,122,1,0,0,95,2,0,0,111,3,0,0,145,4,0,0,161,5,0,0,134,6,0,0,47,7,0,0,158,7,0,0,223,7,0,0,0,0,0,0,10,0,0,0,33,0,0,0,81,0,0,0,168,0,0,0,50,1,0,0,245,1,0,0,236,2,0,0,0,4,0,0,20,5,0,0,11,6,0,0,206,6,0,0,88,7,0,0,175,7,0,0,223,7,0,0,246,7,0,0,0,0,0,0,17,0,0,0,52,0,0,0,120,0,0,0,232,0,0,0,144,1,0,0,110,2,0,0,117,3,0,0,139,4,0,0,146,5,0,0,112,6,0,0,24,7,0,0,136,7,0,0,204,7,0,0,239,7,0,0,0,0,0,0,26,0,0,0,78,0,0,0,169,0,0,0,54,1,0,0,250,1,0,0,239,2,0,0,0,4,0,0,17,5,0,0,6,6,0,0,202,6,0,0,87,7,0,0,178,7,0,0,230,7,0,0,0,0,0,0,19,0,0,0,58,0,0,0,128,0,0,0,243,0,0,0,155,1,0,0,119,2,0,0,120,3,0,0,136,4,0,0,137,5,0,0,101,6,0,0,13,7,0,0,128,7,0,0,198,7,0,0,237,7,0,0,0,0,0,0,13,0,0,0,42,0,0,0,96,0,0,0,189,0,0,0,74,1,0,0,10,2,0,0,248,2,0,0,0,4,0,0,8,5,0,0,246,5,0,0,182,6,0,0,67,7,0,0,160,7,0,0,214,7,0,0,243,7,0,0,0,0,0,0,9,0,0,0,30,0,0,0,71,0,0,0,144,0,0,0,5,1,0,0,171,1,0,0,130,2,0,0,124,3,0,0,132,4,0,0,126,5,0,0,85,6,0,0,251,6,0,0,112,7,0,0,185,7,0,0,226,7,0,0,247,7,0,0,0,0,0,0,63,0,0,0,125,1,0,0,0,4,0,0,131,6,0,0,193,7,0,0,0,0,0,0,31,0,0,0,221,0,0,0,190,2,0,0,66,5,0,0,35,7,0,0,225,7,0,0,0,0,0,0,15,0,0,0,125,0,0,0,205,1,0,0,0,4,0,0,51,6,0,0,131,7,0,0,241,7,0,0,0,0,0,0,63,0,0,0,31,1,0,0,228,2,0,0,28,5,0,0,225,6,0,0,193,7,0,0,0,0,0,0,35,0,0,0,177,0,0,0,2,2,0,0,0,4,0,0,254,5,0,0,79,7,0,0,221,7,0,0,0,0,0,0,19,0,0,0,107,0,0,0,90,1,0,0,1,3,0,0,255,4,0,0,166,6,0,0,149,7,0,0,237,7,0,0,0,0,0,0,10,0,0,0,63,0,0,0,226,0,0,0,45,2,0,0,0,4,0,0,211,5,0,0,30,7,0,0,193,7,0,0,246,7,0,0,0,0,0,0,32,0,0,0,140,0,0,0,131,1,0,0,21,3,0,0,235,4,0,0,125,6,0,0,116,7,0,0,224,7,0,0,0,0,0,0,18,0,0,0,87,0,0,0,9,1,0,0,77,2,0,0,0,4,0,0,179,5,0,0,247,6,0,0,169,7,0,0,238,7,0,0,0,0,0,0,44,0,0,0,168,0,0,0,164,1,0,0,36,3,0,0,220,4,0,0,92,6,0,0,88,7,0,0,212,7,0,0,0,0,0,0,27,0,0,0,110,0,0,0,41,1,0,0,101,2,0,0,0,4,0,0,155,5,0,0,215,6,0,0,146,7,0,0,229,7,0,0,0,0,0,0,16,0,0,0,71,0,0,0,205,0,0,0,200,1,0,0,51,3,0,0,205,4,0,0,56,6,0,0,51,7,0,0,185,7,0,0,240,7,0,0,0,0,0,0,35,0,0,0,130,0,0,0,68,1,0,0,122,2,0,0,0,4,0,0,134,5,0,0,188,6,0,0,126,7,0,0,221,7,0,0,0,0,0,0,22,0,0,0,86,0,0,0,230,0,0,0,224,1,0,0,61,3,0,0,195,4,0,0,32,6,0,0,26,7,0,0,170,7,0,0,234,7,0,0,0,0,0,0,43,0,0,0,148,0,0,0,91,1,0,0,138,2,0,0,0,4,0,0,118,5,0,0,165,6,0,0,108,7,0,0,213,7,0,0,0,0,0,0,8,0,0,0,36,0,0,0,109,0,0,0,2,1,0,0,250,1,0,0,72,3,0,0,184,4,0,0,6,6,0,0,254,6,0,0,147,7,0,0,220,7,0,0,248,7,0,0,0,0,0,0,5,0,0,0,23,0,0,0,73,0,0,0,183,0,0,0,125,1,0,0,160,2,0,0,0,4,0,0,96,5,0,0,131,6,0,0,73,7,0,0,183,7,0,0,233,7,0,0,251,7,0,0,0,0,0,0,11,0,0,0,45,0,0,0,125,0,0,0,24,1,0,0,13,2,0,0,79,3,0,0,177,4,0,0,243,5,0,0,232,6,0,0,131,7,0,0,211,7,0,0,245,7,0,0,0,0,0,0,7,0,0,0,29,0,0,0,86,0,0,0,203,0,0,0,146,1,0,0,174,2,0,0,0,4,0,0,82,5,0,0,110,6,0,0,53,7,0,0,170,7,0,0,227,7,0,0,249,7,0,0,0,0,0,0,40,0,0,0,128,0,0,0,32,1,0,0,23,2,0,0,84,3,0,0,172,4,0,0,233,5,0,0,224,6,0,0,128,7,0,0,216,7,0,0,0,0,0,0,27,0,0,0,90,0,0,0,213,0,0,0,159,1,0,0,183,2,0,0,0,4,0,0,73,5,0,0,97,6,0,0,43,7,0,0,166,7,0,0,229,7,0,0,0,0,0,0,18,0,0,0,62,0,0,0,155,0,0,0,60,1,0,0,44,2,0,0,92,3,0,0,164,4,0,0,212,5,0,0,196,6,0,0,101,7,0,0,194,7,0,0,238,7,0,0,0,0,0,0,31,0,0,0,100,0,0,0,228,0,0,0,174,1,0,0,193,2,0,0,0,4,0,0,63,5,0,0,82,6,0,0,28,7,0,0,156,7,0,0,225,7,0,0,0,0,0,0,21,0,0,0,71,0,0,0,168,0,0,0,76,1,0,0,57,2,0,0,97,3,0,0,159,4,0,0,199,5,0,0,180,6,0,0,88,7,0,0,185,7,0,0,235,7,0,0,0,0,0,0,62,0,0,0,123,1,0,0,0,4,0,0,133,6,0,0,194,7,0,0,0,0,0,0,30,0,0,0,218,0,0,0,188,2,0,0,68,5,0,0,38,7,0,0,226,7,0,0,0,0,0,0,110,0,0,0,193,1,0,0,0,4,0,0,63,6,0,0,146,7,0,0,0,0,0,0,61,0,0,0,27,1,0,0,226,2,0,0,30,5,0,0,229,6,0,0,195,7,0,0,0,0,0,0,33,0,0,0,173,0,0,0,254,1,0,0,0,4,0,0,2,6,0,0,83,7,0,0,223,7,0,0,0,0,0,0,18,0,0,0,103,0,0,0,85,1,0,0,255,2,0,0,1,5,0,0,171,6,0,0,153,7,0,0,238,7,0,0,0,0,0,0,51,0,0,0,213,0,0,0,36,2,0,0,0,4,0,0,220,5,0,0,43,7,0,0,205,7,0,0,0,0,0,0,30,0,0,0,135,0,0,0,126,1,0,0,18,3,0,0,238,4,0,0,130,6,0,0,121,7,0,0,226,7,0,0,0,0,0,0,17,0,0,0,84,0,0,0,2,1,0,0,71,2,0,0,0,4,0,0,185,5,0,0,254,6,0,0,172,7,0,0,239,7,0,0,0,0,0,0,41,0,0,0,162,0,0,0,158,1,0,0,33,3,0,0,223,4,0,0,98,6,0,0,94,7,0,0,215,7,0,0,0,0,0,0,25,0,0,0,105,0,0,0,34,1,0,0,96,2,0,0,0,4,0,0,160,5,0,0,222,6,0,0,151,7,0,0,231,7,0,0,0,0,0,0,52,0,0,0,185,0,0,0,184,1,0,0,45,3,0,0,211,4,0,0,72,6,0,0,71,7,0,0,204,7,0,0,0,0,0,0,33,0,0,0,124,0,0,0,60,1,0,0,116,2,0,0,0,4,0,0,140,5,0,0,196,6,0,0,132,7,0,0,223,7,0,0,0,0,0,0,20,0,0,0,81,0,0,0,222,0,0,0,216,1,0,0,58,3,0,0,198,4,0,0,40,6,0,0,34,7,0,0,175,7,0,0,236,7,0,0,0,0,0,0,12,0,0,0,52,0,0,0,152,0,0,0,91,1,0,0,137,2,0,0,0,4,0,0,119,5,0,0,165,6,0,0,104,7,0,0,204,7,0,0,244,7,0,0,0,0,0,0,26,0,0,0,95,0,0,0,243,0,0,0,237,1,0,0,66,3,0,0,190,4,0,0,19,6,0,0,13,7,0,0,161,7,0,0,230,7,0,0,0,0,0,0,28,0,0,0,213,0,0,0,184,2,0,0,72,5,0,0,43,7,0,0,228,7,0,0,0,0,0,0,13,0,0,0,117,0,0,0,194,1,0,0,0,4,0,0,62,6,0,0,139,7,0,0,243,7,0,0,0,0,0,0,6,0,0,0,63,0,0,0,24,1,0,0,223,2,0,0,33,5,0,0,232,6,0,0,193,7,0,0,250,7,0,0,0,0,0,0,3,0,0,0,33,0,0,0,168,0,0,0,248,1,0,0,0,4,0,0,8,6,0,0,88,7,0,0,223,7,0,0,253,7,0,0,0,0,0,0,16,0,0,0,97,0,0,0,75,1,0,0,249,2,0,0,7,5,0,0,181,6,0,0,159,7,0,0,240,7,0,0,0,0,0,0,8,0,0,0,55,0,0,0,210,0,0,0,31,2,0,0,0,4,0,0,225,5,0,0,46,7,0,0,201,7,0,0,248,7,0,0,0,0,0,0,26,0,0,0,126,0,0,0,114,1,0,0,12,3,0,0,244,4,0,0,142,6,0,0,130,7,0,0,230,7,0,0,0,0,0,0,62,0,0,0,234,0,0,0,54,2,0,0,0,4,0,0,202,5,0,0,22,7,0,0,194,7,0,0,0,0,0,0,37,0,0,0,151,0,0,0,145,1,0,0,27,3,0,0,229,4,0,0,111,6,0,0,105,7,0,0,219,7,0,0,0,0,0,0,21,0,0,0,95,0,0,0,19,1,0,0,84,2,0,0,0,4,0,0,172,5,0,0,237,6,0,0,161,7,0,0,235,7,0,0,0,0,0,0,50,0,0,0,3,1,0,0,211,2,0,0,45,5,0,0,253,6,0,0,206,7,0,0,0,0,0,0,2,0,0,0,27,0,0,0,151,0,0,0,230,1,0,0,0,4,0,0,26,6,0,0,105,7,0,0,229,7,0,0,254,7,0,0,0,0,0,0,12,0,0,0,83,0,0,0,53,1,0,0,238,2,0,0,18,5,0,0,203,6,0,0,173,7,0,0,244,7,0,0,0,0,0,0,39,0,0,0,183,0,0,0,6,2,0,0,0,4,0,0,250,5,0,0,73,7,0,0,217,7,0,0,0,0,0,0,20,0,0,0,107,0,0,0,87,1,0,0,255,2,0,0,1,5,0,0,169,6,0,0,149,7,0,0,236,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,0,0,0,64,0,0,0,64,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,19,0,0,132,21,0,0,136,22,0,0,140,23,0,0,16,24,0,0,148,24,0,0,24,25,0,0,156,25,0,0,32,26,0,0,164,26,0,0,40,27,0,0,172,27,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,6,0,0,0,21,0,0,0,56,0,0,0,126,0,0,0,252,0,0,0,206,1,0,0,24,3,0,0,7,5,0,0,210,7,0,0,187,11,0,0,16,17,0,0,44,24,0,0,120,33,0,0,108,45,0,0,144,60,0,0,125,79,0,0,222,102,0,0,113,131,0,0,8,166,0,0,138,207,0,0,244,0,1,0,90,59,1,0,232,127,1,0,227,207,1,0,170,44,2,0,183,151,2,0,160,18,3,0,24,159,3,0,240,62,4,0,24,244,4,0,160,192,5,0,185,166,6,0,182,168,7,0,13,201,8,0,88,10,10,0,86,111,11,0,236,250,12,0,38,176,14,0,56,146,16,0,127,164,18,0,130,234,20,0,243,103,23,0,176,32,26,0,196,24,29,0,104,84,32,0,4,216,35,0,48,168,39,0,181,201,43,0,142,65,48,0,233,20,53,0,40,73,58,0,226,227,63,0,228,234,69,0,50,100,76,0,8,86,83,0,219,198,90,0,90,189,98,0,111,64,107,0,64,87,116,0,48,9,126,0,224,93,136,0,48,93,147,0,64,15,159,0,113,124,171,0,102,173,184,0,5,171,198,0,120,126,213,0,46,49,229,0,220,204,245,0,126,91,7,1,88,231,25,1,247,122,45,1,50,33,66,1,43,229,87,1,80,210,110,1,92,244,134,1,88,87,160,1,156,7,187,1,208,17,215,1,237,130,244,1,62,104,19,2,97,207,51,2,72,198,85,2,58,91,121,2,212,156,158,2,10,154,197,2,40,98,238,2,211,4,25,3,10,146,69,3,39,26,116,3,224,173,164,3,72,94,215,3,208,60,12,4,72,91,67,4,224,203,124,4,41,161,184,4,22,238,246,4,253,197,55,5,152,60,123,5,6,102,193,5,204,86,10,6,214,35,86,6,120,226,164,6,111,168,246,6,226,139,75,7,99,163,163,7,240,5,255,7,244,202,93,8,72,10,192,8,52,220,37,9,112,89,143,9,37,155,252,9,238,186,109,10,217,210,226,10,104,253,91,11,146,85,217,11,196,246,90,12,226,252,224,12,72,132,107,13,203,169,250,13,186,138,142,14,223,68,39,15,128,246,196,15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,7,0,0,0,28,0,0,0,84,0,0,0,210,0,0,0,206,1,0,0,156,3,0,0,180,6,0,0,187,11,0,0,141,19,0,0,72,31,0,0,88,48,0,0,132,72,0,0,252,105,0,0,104,151,0,0,248,211,0,0,117,35,1,0,83,138,1,0,196,13,2,0,204,179,2,0,86,131,3,0,74,132,4,0,164,191,5,0,140,63,7,0,111,15,9,0,25,60,11,0,208,211,13,0,112,230,16,0,136,133,20,0,120,196,24,0,144,184,29,0,48,121,35,0,233,31,42,0,159,200,49,0,172,145,58,0,4,156,68,0,90,11,80,0,70,6,93,0,108,182,107,0,164,72,124,0,35,237,142,0,165,215,163,0,152,63,187,0,72,96,213,0,12,121,242,0,116,205,18,1,120,165,54,1,168,77,94,1,93,23,138,1,235,88,186,1,212,109,239,1,252,182,41,2,222,154,105,2,194,133,175,2,244,233,251,2,252,63,79,3,215,6,170,3,49,196,12,4,160,4,120,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,8,0,0,0,36,0,0,0,120,0,0,0,74,1,0,0,24,3,0,0,180,6,0,0,104,13,0,0,35,25,0,0,176,44,0,0,248,75,0,0,80,124,0,0,212,196,0,0,208,46,1,0,56,198,1,0,48,154,2,0,165,189,3,0,248,71,5,0,188,85,7,0,136,9,10,0,222,140,13,0,40,17,18,0,204,208,23,0,88,16,31,0,199,31,40,0,224,91,51,0,176,47,65,0,32,22,82,0,168,155,102,0,32,96,127,0,176,24,157,0,224,145,192,0,201,177,234,0,104,122,28,1,20,12,87,1,24,168,155,1,114,179,235,1,184,185,72,2,36,112,180,2,200,184,48,3,235,165,191,3,144,125,99,4,40,189,30,5,112,29,244,5,124,150,230,6,240,99,249,7,104,9,48,9,16,87,142,10,109,110,24,12,88,199,210,13,44,53,194,15,40,236,235,17,6,135,85,20,200,12,5,23,188,246,0,26,184,54,80,29,143,61,250,32,192,1,7,37,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,9,0,0,0,45,0,0,0,165,0,0,0,239,1,0,0,7,5,0,0,187,11,0,0,35,25,0,0,70,50,0,0,246,94,0,0,238,170,0,0,62,39,1,0,18,236,1,0,226,26,3,0,26,225,4,0,74,123,7,0,239,56,11,0,231,128,16,0,163,214,23,0,43,224,33,0,9,109,47,0,49,126,65,0,253,78,89,0,85,95,120,0,28,127,160,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,10,0,0,0,55,0,0,0,220,0,0,0,203,2,0,0,210,7,0,0,141,19,0,0,176,44,0,0,246,94,0,0,236,189,0,0,218,104,1,0,24,144,2,0,42,124,4,0,12,151,7,0,38,120,12,0,112,243,19,0,95,44,31,0,70,173,47,0,233,131,71,0,20,100,105,0,29,209,152,0,78,79,218,0,75,158,51,1,160,253,171,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,11,0,0,0,66,0,0,0,30,1,0,0,233,3,0,0,187,11,0,0,72,31,0,0,248,75,0,0,238,170,0,0,218,104,1,0,180,209,2,0,204,97,5,0,246,221,9,0,2,117,17,0,40,237,29,0,152,224,49,0,247,12,81,0,61,186,128,0,38,62,200,0,58,162,49,1,87,115,202,1,165,194,164,2,240,96,216,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,12,0,0,0,78,0,0,0,108,1,0,0,85,5,0,0,16,17,0,0,88,48,0,0,80,124,0,0,62,39,1,0,24,144,2,0,204,97,5,0,152,195,10,0,142,161,20,0,144,22,38,0,184,3,68,0,80,228,117,0,71,241,198,0,132,171,71,1,170,233,15,2,228,139,65,3,59,255,11,5,224,193,176,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,13,0,0,0,91,0,0,0,199,1,0,0,28,7,0,0,44,24,0,0,132,72,0,0,212,196,0,0,18,236,1,0,42,124,4,0,246,221,9,0,142,161,20,0,28,67,41,0,172,89,79,0,100,93,147,0,180,65,9,1,251,50,208,1,127,222,23,3,41,200,39,5,13,84,105,8,72,83,117,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,14,0,0,0,105,0,0,0,48,2,0,0,76,9,0,0,120,33,0,0,252,105,0,0,208,46,1,0,226,26,3,0,12,151,7,0,2,117,17,0,144,22,38,0,172,89,79,0,88,179,158,0,188,16,50,1,112,82,59,2,107,133,11,4,234,99,35,7,19,44,75,12,32,128,180,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,15,0,0,0,120,0,0,0,168,2,0,0,244,11,0,0,108,45,0,0,104,151,0,0,56,198,1,0,26,225,4,0,38,120,12,0,40,237,29,0,184,3,68,0,100,93,147,0,188,16,50,1,120,33,100,2,232,115,159,4,83,249,170,8,61,93,206,15,80,137,25,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,16,0,0,0,136,0,0,0,48,3,0,0,36,15,0,0,144,60,0,0,248,211,0,0,48,154,2,0,74,123,7,0,112,243,19,0,152,224,49,0,80,228,117,0,180,65,9,1,112,82,59,2,232,115,159,4,208,231,62,9,35,225,233,17,96,62,184,33,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,17,0,0,0,153,0,0,0,201,3,0,0,237,18,0,0,125,79,0,0,117,35,1,0,165,189,3,0,239,56,11,0,95,44,31,0,247,12,81,0,71,241,198,0,251,50,208,1,107,133,11,4,83,249,170,8,35,225,233,17,70,194,211,35,7,0,0,0,5,0,0,0,4,0,0,0,4,0,0,0,3,0,0,0,3,0,0,0,1,0,0,0,3,0,0,0,7,0,0,0,11,0,0,0,19,0,0,0,37,0,0,0,67,0,0,0,131,0,0,0,29,1,0,0,33,2,0,0,9,4,0,0,5,8,0,0,83,16,0,0,27,32,0,0,67,68,0,0,3,128,0,0,11,16,1,0,144,28,0,0,5,0,0,0,0,0,0,0,0,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,0,0,0,19,0,0,0,8,47,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,29,0,0,5,0,0,0,0,0,0,0,0,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,0,0,0,19,0,0,0,16,47,0,0,0,4,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,132,29,0,0,3,0,0,0,0,0,0,0,45,244,81,88,207,140,177,192,70,246,181,203,41,49,3,199,4,91,112,48,180,93,253,32,120,127,139,154,216,89,41,80,104,72,137,171,167,86,3,108,255,183,205,136,63,212,119,180,43,165,163,112,241,186,228,168,252,65,131,253,217,111,225,138,122,47,45,116,150,7,31,13,9,94,3,118,44,112,247,64,165,44,167,111,87,65,168,170,116,223,160,88,100,3,74,199,196,60,83,174,175,95,24,4,21,177,227,109,40,134,171,12,164,191,67,240,233,80,129,57,87,22,82,55,123,32,114,101,116,117,114,110,32,77,111,100,117,108,101,46,103,101,116,82,97,110,100,111,109,86,97,108,117,101,40,41,59,32,125,0,123,32,105,102,32,40,77,111,100,117,108,101,46,103,101,116,82,97,110,100,111,109,86,97,108,117,101,32,61,61,61,32,117,110,100,101,102,105,110,101,100,41,32,123,32,116,114,121,32,123,32,118,97,114,32,119,105,110,100,111,119,95,32,61,32,34,111,98,106,101,99,116,34,32,61,61,61,32,116,121,112,101,111,102,32,119,105,110,100,111,119,32,63,32,119,105,110,100,111,119,32,58,32,115,101,108,102,44,32,99,114,121,112,116,111,95,32,61,32,116,121,112,101,111,102,32,119,105,110,100,111,119,95,46,99,114,121,112,116,111,32,33,61,61,32,34,117,110,100,101,102,105,110,101,100,34,32,63,32,119,105,110,100,111,119,95,46,99,114,121,112,116,111,32,58,32,119,105,110,100,111,119,95,46,109,115,67,114,121,112,116,111,44,32,114,97,110,100,111,109,86,97,108,117,101,115,83,116,97,110,100,97,114,100,32,61,32,102,117,110,99,116,105,111,110,40,41,32,123,32,118,97,114,32,98,117,102,32,61,32,110,101,119,32,85,105,110,116,51,50,65,114,114,97,121,40,49,41,59,32,99,114,121,112,116,111,95,46,103,101,116,82,97,110,100,111,109,86,97,108,117,101,115,40,98,117,102,41,59,32,114,101,116,117,114,110,32,98,117,102,91,48,93,32,62,62,62,32,48,59,32,125,59,32,114,97,110,100,111,109,86,97,108,117,101,115,83,116,97,110,100,97,114,100,40,41,59,32,77,111,100,117,108,101,46,103,101,116,82,97,110,100,111,109,86,97,108,117,101,32,61,32,114,97,110,100,111,109,86,97,108,117,101,115,83,116,97,110,100,97,114,100,59,32,125,32,99,97,116,99,104,32,40,101,41,32,123,32,116,114,121,32,123,32,118,97,114,32,99,114,121,112,116,111,32,61,32,114,101,113,117,105,114,101,40,39,99,114,121,112,116,111,39,41,44,32,114,97,110,100,111,109,86,97,108,117,101,78,111,100,101,74,83,32,61,32,102,117,110,99,116,105,111,110,40,41,32,123,32,118,97,114,32,98,117,102,32,61,32,99,114,121,112,116,111,46,114,97,110,100,111,109,66,121,116,101,115,40,52,41,59,32,114,101,116,117,114,110,32,40,98,117,102,91,48,93,32,60,60,32,50,52,32,124,32,98,117,102,91,49,93,32,60,60,32,49,54,32,124,32,98,117,102,91,50,93,32,60,60,32,56,32,124,32,98,117,102,91,51,93,41,32,62,62,62,32,48,59,32,125,59,32,114,97,110,100,111,109,86,97,108,117,101,78,111,100,101,74,83,40,41,59,32,77,111,100,117,108,101,46,103,101,116,82,97,110,100,111,109,86,97,108,117,101,32,61,32,114,97,110,100,111,109,86,97,108,117,101,78,111,100,101,74,83,59,32,125,32,99,97,116,99,104,32,40,101,41,32,123,32,116,104,114,111,119,32,39,78,111,32,115,101,99,117,114,101,32,114,97,110,100,111,109,32,110,117,109,98,101,114,32,103,101,110,101,114,97,116,111,114,32,102,111,117,110,100,39,59,32,125,32,125,32,125,32,125,0,0,1,2,2,3,3,3,3,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,105,110,99,111,110,115,105,115,116,101,110,116,32,100,97,116,97,32,102,111,114,32,99,119,44,32,114,101,114,117,110,32,103,101,110,112,97,114,97,109,115,10,0,69,120,116,101,110,115,105,111,110,32,100,101,103,114,101,101,32,37,100,32,110,111,116,32,105,109,112,108,101,109,101,110,116,101,100,32,33,10,0,17,0,10,0,17,17,17,0,0,0,0,5,0,0,0,0,0,0,9,0,0,0,0,11,0,0,0,0,0,0,0,0,17,0,15,10,17,17,17,3,10,7,0,1,19,9,11,11,0,0,9,6,11,0,0,11,0,6,17,0,0,0,17,17,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,0,17,0,10,10,17,17,17,0,10,0,0,2,0,9,11,0,0,0,9,0,11,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,12,0,0,0,0,9,12,0,0,0,0,0,12,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,4,13,0,0,0,0,9,14,0,0,0,0,0,14,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,15,0,0,0,0,15,0,0,0,0,9,16,0,0,0,0,0,16,0,0,16,0,0,18,0,0,0,18,18,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,0,0,0,18,18,18,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,0,10,0,0,0,0,9,11,0,0,0,0,0,11,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,12,0,0,0,0,9,12,0,0,0,0,0,12,0,0,12,0,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,45,43,32,32,32,48,88,48,120,0,40,110,117,108,108,41,0,45,48,88,43,48,88,32,48,88,45,48,120,43,48,120,32,48,120,0,105,110,102,0,73,78,70,0,110,97,110,0,78,65,78,0,46,0,84,33,34,25,13,1,2,3,17,75,28,12,16,4,11,29,18,30,39,104,110,111,112,113,98,32,5,6,15,19,20,21,26,8,22,7,40,36,23,24,9,10,14,27,31,37,35,131,130,125,38,42,43,60,61,62,63,67,71,74,77,88,89,90,91,92,93,94,95,96,97,99,100,101,102,103,105,106,107,108,114,115,116,121,122,123,124,0,73,108,108,101,103,97,108,32,98,121,116,101,32,115,101,113,117,101,110,99,101,0,68,111,109,97,105,110,32,101,114,114,111,114,0,82,101,115,117,108,116,32,110,111,116,32,114,101,112,114,101,115,101,110,116,97,98,108,101,0,78,111,116,32,97,32,116,116,121,0,80,101,114,109,105,115,115,105,111,110,32,100,101,110,105,101,100,0,79,112,101,114,97,116,105,111,110,32,110,111,116,32,112,101,114,109,105,116,116,101,100,0,78,111,32,115,117,99,104,32,102,105,108,101,32,111,114,32,100,105,114,101,99,116,111,114,121,0,78,111,32,115,117,99,104,32,112,114,111,99,101,115,115,0,70,105,108,101,32,101,120,105,115,116,115,0,86,97,108,117,101,32,116,111,111,32,108,97,114,103,101,32,102,111,114,32,100,97,116,97,32,116,121,112,101,0,78,111,32,115,112,97,99,101,32,108,101,102,116,32,111,110,32,100,101,118,105,99,101,0,79,117,116,32,111,102,32,109,101,109,111,114,121,0,82,101,115,111,117,114,99,101,32,98,117,115,121,0,73,110,116,101,114,114,117,112,116,101,100,32,115,121,115,116,101,109,32,99,97,108,108,0,82,101,115,111,117,114,99,101,32,116,101,109,112,111,114,97,114,105,108,121,32,117,110,97,118,97,105,108,97,98,108,101,0,73,110,118,97,108,105,100,32,115,101,101,107,0,67,114,111,115,115,45,100,101,118,105,99,101,32,108,105,110,107,0,82,101,97,100,45,111,110,108,121,32,102,105,108,101,32,115,121,115,116,101,109,0,68,105,114,101,99,116,111,114,121,32,110,111,116,32,101,109,112,116,121,0,67,111,110,110,101,99,116,105,111,110,32,114,101,115,101,116,32,98,121,32,112,101,101,114,0,79,112,101,114,97,116,105,111,110,32,116,105,109,101,100,32,111,117,116,0,67,111,110,110,101,99,116,105,111,110,32,114,101,102,117,115,101,100,0,72,111,115,116,32,105,115,32,100,111,119,110,0,72,111,115,116,32,105,115,32,117,110,114,101,97,99,104,97,98,108,101,0,65,100,100,114,101,115,115,32,105,110,32,117,115,101,0,66,114,111,107,101,110,32,112,105,112,101,0,73,47,79,32,101,114,114,111,114,0,78,111,32,115,117,99,104,32,100,101,118,105,99,101,32,111,114,32,97,100,100,114,101,115,115,0,66,108,111,99,107,32,100,101,118,105,99,101,32,114,101,113,117,105,114,101,100,0,78,111,32,115,117,99,104,32,100,101,118,105,99,101,0,78,111,116,32,97,32,100,105,114,101,99,116,111,114,121,0,73,115,32,97,32,100,105,114,101,99,116,111,114,121,0,84,101,120,116,32,102,105,108,101,32,98,117,115,121,0,69,120,101,99,32,102,111,114,109,97,116,32,101,114,114,111,114,0,73,110,118,97,108,105,100,32,97,114,103,117,109,101,110,116,0,65,114,103,117,109,101,110,116,32,108,105,115,116,32,116,111,111,32,108,111,110,103,0,83,121,109,98,111,108,105,99,32,108,105,110,107,32,108,111,111,112,0,70,105,108,101,110,97,109,101,32,116,111,111,32,108,111,110,103,0,84,111,111,32,109,97,110,121,32,111,112,101,110,32,102,105,108,101,115,32,105,110,32,115,121,115,116,101,109,0,78,111,32,102,105,108,101,32,100,101,115,99,114,105,112,116,111,114,115,32,97,118,97,105,108,97,98,108,101,0,66,97,100,32,102,105,108,101,32,100,101,115,99,114,105,112,116,111,114,0,78,111,32,99,104,105,108,100,32,112,114,111,99,101,115,115,0,66,97,100,32,97,100,100,114,101,115,115,0,70,105,108,101,32,116,111,111,32,108,97,114,103,101,0,84,111,111,32,109,97,110,121,32,108,105,110,107,115,0,78,111,32,108,111,99,107,115,32,97,118,97,105,108,97,98,108,101,0,82,101,115,111,117,114,99,101,32,100,101,97,100,108,111,99,107,32,119,111,117,108,100,32,111,99,99,117,114,0,83,116,97,116,101,32,110,111,116,32,114,101,99,111,118,101,114,97,98,108,101,0,80,114,101,118,105,111,117,115,32,111,119,110,101,114,32,100,105,101,100,0,79,112,101,114,97,116,105,111,110,32,99,97,110,99,101,108,101,100,0,70,117,110,99,116,105,111,110,32,110,111,116,32,105,109,112,108,101,109,101,110,116,101,100,0,78,111,32,109,101,115,115,97,103,101,32,111,102,32,100,101,115,105,114,101,100,32,116,121,112,101,0,73,100,101,110,116,105,102,105,101,114,32,114,101,109,111,118,101,100,0,68,101,118,105,99,101,32,110,111,116,32,97,32,115,116,114,101,97,109,0,78,111,32,100,97,116,97,32,97,118,97,105,108,97,98,108,101,0,68,101,118,105,99,101,32,116,105,109,101,111,117,116,0,79,117,116,32,111,102,32,115,116,114,101,97,109,115,32,114,101,115,111,117,114,99,101,115,0,76,105,110,107,32,104,97,115,32,98,101,101,110,32,115,101,118,101,114,101,100,0,80,114,111,116,111,99,111,108,32,101,114,114,111,114,0,66,97,100,32,109,101,115,115,97,103,101,0,70,105,108,101,32,100,101,115,99,114,105,112,116,111,114,32,105,110,32,98,97,100,32,115,116,97,116,101,0,78,111,116,32,97,32,115,111,99,107,101,116,0,68,101,115,116,105,110,97,116,105,111,110,32,97,100,100,114,101,115,115,32,114,101,113,117,105,114,101,100,0,77,101,115,115,97,103,101,32,116,111,111,32,108,97,114,103,101,0,80,114,111,116,111,99,111,108,32,119,114,111,110,103,32,116,121,112,101,32,102,111,114,32,115,111,99,107,101,116,0,80,114,111,116,111,99,111,108,32,110,111,116,32,97,118,97,105,108,97,98,108,101,0,80,114,111,116,111,99,111,108,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,83,111,99,107,101,116,32,116,121,112,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,78,111,116,32,115,117,112,112,111,114,116,101,100,0,80,114,111,116,111,99,111,108,32,102,97,109,105,108,121,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,65,100,100,114,101,115,115,32,102,97,109,105,108,121,32,110,111,116,32,115,117,112,112,111,114,116,101,100,32,98,121,32,112,114,111,116,111,99,111,108,0,65,100,100,114,101,115,115,32,110,111,116,32,97,118,97,105,108,97,98,108,101,0,78,101,116,119,111,114,107,32,105,115,32,100,111,119,110,0,78,101,116,119,111,114,107,32,117,110,114,101,97,99,104,97,98,108,101,0,67,111,110,110,101,99,116,105,111,110,32,114,101,115,101,116,32,98,121,32,110,101,116,119,111,114,107,0,67,111,110,110,101,99,116,105,111,110,32,97,98,111,114,116,101,100,0,78,111,32,98,117,102,102,101,114,32,115,112,97,99,101,32,97,118,97,105,108,97,98,108,101,0,83,111,99,107,101,116,32,105,115,32,99,111,110,110,101,99,116,101,100,0,83,111,99,107,101,116,32,110,111,116,32,99,111,110,110,101,99,116,101,100,0,67,97,110,110,111,116,32,115,101,110,100,32,97,102,116,101,114,32,115,111,99,107,101,116,32,115,104,117,116,100,111,119,110,0,79,112,101,114,97,116,105,111,110,32,97,108,114,101,97,100,121,32,105,110,32,112,114,111,103,114,101,115,115,0,79,112,101,114,97,116,105,111,110,32,105,110,32,112,114,111,103,114,101,115,115,0,83,116,97,108,101,32,102,105,108,101,32,104,97,110,100,108,101,0,82,101,109,111,116,101,32,73,47,79,32,101,114,114,111,114,0,81,117,111,116,97,32,101,120,99,101,101,100,101,100,0,78,111,32,109,101,100,105,117,109,32,102,111,117,110,100,0,87,114,111,110,103,32,109,101,100,105,117,109,32,116,121,112,101,0,78,111,32,101,114,114,111,114,32,105,110,102,111,114,109,97,116,105,111,110,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);





/* no memory initializer */
var tempDoublePtr = STATICTOP; STATICTOP += 16;

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


   
  Module["_i64Subtract"] = _i64Subtract;

   
  Module["_i64Add"] = _i64Add;

  
  
  var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_STATIC); 
  Module["_llvm_cttz_i32"] = _llvm_cttz_i32; 
  Module["___udivmoddi4"] = ___udivmoddi4; 
  Module["___udivdi3"] = ___udivdi3;

   
  Module["_memset"] = _memset;

  function _pthread_cleanup_push(routine, arg) {
      __ATEXIT__.push(function() { Runtime.dynCall('vi', routine, [arg]) })
      _pthread_cleanup_push.level = __ATEXIT__.length;
    }

   
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

  
   
  Module["___muldsi3"] = ___muldsi3; 
  Module["___muldi3"] = ___muldi3;

  
  function ___setErrNo(value) {
      if (Module['___errno_location']) HEAP32[((Module['___errno_location']())>>2)]=value;
      else Module.printErr('failed to set errno from JS');
      return value;
    } 
  Module["_sbrk"] = _sbrk;

   
  Module["___uremdi3"] = ___uremdi3;

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;

  var _emscripten_asm_const_int=true;

  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }

  function _time(ptr) {
      var ret = (Date.now()/1000)|0;
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

   
  Module["_pthread_self"] = _pthread_self;

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
      if (!___syscall146.buffer) {
        ___syscall146.buffers = [null, [], []]; // 1 => stdout, 2 => stderr
        ___syscall146.printChar = function(stream, curr) {
          var buffer = ___syscall146.buffers[stream];
          assert(buffer);
          if (curr === 0 || curr === 10) {
            (stream === 1 ? Module['print'] : Module['printErr'])(UTF8ArrayToString(buffer, 0));
            buffer.length = 0;
          } else {
            buffer.push(curr);
          }
        };
      }
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAP32[(((iov)+(i*8))>>2)];
        var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
        for (var j = 0; j < len; j++) {
          ___syscall146.printChar(stream, HEAPU8[ptr+j]);
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

   
  Module["_round"] = _round;
/* flush anything remaining in the buffer during shutdown */ __ATEXIT__.push(function() { var fflush = Module["_fflush"]; if (fflush) fflush(0); var printChar = ___syscall146.printChar; if (!printChar) return; var buffers = ___syscall146.buffers; if (buffers[1].length) printChar(1, 10); if (buffers[2].length) printChar(2, 10); });;
DYNAMICTOP_PTR = allocate(1, "i32", ALLOC_STATIC);

STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

STACK_MAX = STACK_BASE + TOTAL_STACK;

DYNAMIC_BASE = Runtime.alignMemory(STACK_MAX);

HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;

staticSealed = true; // seal the static portion of memory

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");



var debug_table_i = ["0", "jsCall_i_0", "jsCall_i_1", "jsCall_i_2", "jsCall_i_3", "jsCall_i_4", "jsCall_i_5", "jsCall_i_6", "jsCall_i_7", "0", "0", "0", "0", "0", "0", "0", "0", "0", "_u8rnd", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"];
var debug_table_ii = ["0", "jsCall_ii_0", "jsCall_ii_1", "jsCall_ii_2", "jsCall_ii_3", "jsCall_ii_4", "jsCall_ii_5", "jsCall_ii_6", "jsCall_ii_7", "0", "0", "0", "0", "0", "0", "0", "0", "0", "___stdio_close", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"];
var debug_table_iiii = ["0", "jsCall_iiii_0", "jsCall_iiii_1", "jsCall_iiii_2", "jsCall_iiii_3", "jsCall_iiii_4", "jsCall_iiii_5", "jsCall_iiii_6", "jsCall_iiii_7", "0", "0", "0", "0", "0", "0", "0", "0", "0", "___stdio_write", "___stdio_seek", "___stdout_write", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"];
var debug_table_vi = ["0", "jsCall_vi_0", "jsCall_vi_1", "jsCall_vi_2", "jsCall_vi_3", "jsCall_vi_4", "jsCall_vi_5", "jsCall_vi_6", "jsCall_vi_7", "0", "0", "0", "0", "0", "0", "0", "0", "0", "_cleanup_517", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"];
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

Module.asmLibraryArg = { "abort": abort, "assert": assert, "enlargeMemory": enlargeMemory, "getTotalMemory": getTotalMemory, "abortOnCannotGrowMemory": abortOnCannotGrowMemory, "abortStackOverflow": abortStackOverflow, "nullFunc_i": nullFunc_i, "nullFunc_ii": nullFunc_ii, "nullFunc_iiii": nullFunc_iiii, "nullFunc_vi": nullFunc_vi, "invoke_i": invoke_i, "jsCall_i": jsCall_i, "invoke_ii": invoke_ii, "jsCall_ii": jsCall_ii, "invoke_iiii": invoke_iiii, "jsCall_iiii": jsCall_iiii, "invoke_vi": invoke_vi, "jsCall_vi": jsCall_vi, "_pthread_cleanup_pop": _pthread_cleanup_pop, "_emscripten_asm_const_i": _emscripten_asm_const_i, "_emscripten_asm_const_v": _emscripten_asm_const_v, "___lock": ___lock, "_abort": _abort, "___setErrNo": ___setErrNo, "___syscall6": ___syscall6, "_time": _time, "_llvm_pow_f32": _llvm_pow_f32, "_pthread_cleanup_push": _pthread_cleanup_push, "_emscripten_memcpy_big": _emscripten_memcpy_big, "___syscall54": ___syscall54, "___unlock": ___unlock, "___syscall140": ___syscall140, "_exit": _exit, "__exit": __exit, "___syscall146": ___syscall146, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "DYNAMICTOP_PTR": DYNAMICTOP_PTR, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8 };
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
  var DYNAMICTOP_PTR=env.DYNAMICTOP_PTR|0;
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
  var Math_max=global.Math.max;
  var Math_clz32=global.Math.clz32;
  var abort=env.abort;
  var assert=env.assert;
  var enlargeMemory=env.enlargeMemory;
  var getTotalMemory=env.getTotalMemory;
  var abortOnCannotGrowMemory=env.abortOnCannotGrowMemory;
  var abortStackOverflow=env.abortStackOverflow;
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
  var _emscripten_asm_const_i=env._emscripten_asm_const_i;
  var _emscripten_asm_const_v=env._emscripten_asm_const_v;
  var ___lock=env.___lock;
  var _abort=env._abort;
  var ___setErrNo=env.___setErrNo;
  var ___syscall6=env.___syscall6;
  var _time=env._time;
  var _llvm_pow_f32=env._llvm_pow_f32;
  var _pthread_cleanup_push=env._pthread_cleanup_push;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var ___syscall54=env.___syscall54;
  var ___unlock=env.___unlock;
  var ___syscall140=env.___syscall140;
  var _exit=env._exit;
  var __exit=env.__exit;
  var ___syscall146=env.___syscall146;
  var tempFloat = 0.0;

// EMSCRIPTEN_START_FUNCS

function stackAlloc(size) {
  size = size|0;
  var ret = 0;
  ret = STACKTOP;
  STACKTOP = (STACKTOP + size)|0;
  STACKTOP = (STACKTOP + 15)&-16;
  if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(size|0);

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
 $0 = _emscripten_asm_const_i(0)|0; //@line 70 "libsodium/src/libsodium/randombytes/randombytes.c"
 return ($0|0); //@line 70 "libsodium/src/libsodium/randombytes/randombytes.c"
}
function _randombytes_stir() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 _emscripten_asm_const_v(1); //@line 85 "libsodium/src/libsodium/randombytes/randombytes.c"
 return; //@line 113 "libsodium/src/libsodium/randombytes/randombytes.c"
}
function _randombytes_buf($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $6 = $2; //@line 151 "libsodium/src/libsodium/randombytes/randombytes.c"
 $4 = $6; //@line 151 "libsodium/src/libsodium/randombytes/randombytes.c"
 $5 = 0; //@line 154 "libsodium/src/libsodium/randombytes/randombytes.c"
 while(1) {
  $7 = $5; //@line 154 "libsodium/src/libsodium/randombytes/randombytes.c"
  $8 = $3; //@line 154 "libsodium/src/libsodium/randombytes/randombytes.c"
  $9 = ($7>>>0)<($8>>>0); //@line 154 "libsodium/src/libsodium/randombytes/randombytes.c"
  if (!($9)) {
   break;
  }
  $10 = (_randombytes_random()|0); //@line 155 "libsodium/src/libsodium/randombytes/randombytes.c"
  $11 = $10&255; //@line 155 "libsodium/src/libsodium/randombytes/randombytes.c"
  $12 = $5; //@line 155 "libsodium/src/libsodium/randombytes/randombytes.c"
  $13 = $4; //@line 155 "libsodium/src/libsodium/randombytes/randombytes.c"
  $14 = (($13) + ($12)|0); //@line 155 "libsodium/src/libsodium/randombytes/randombytes.c"
  HEAP8[$14>>0] = $11; //@line 155 "libsodium/src/libsodium/randombytes/randombytes.c"
  $15 = $5; //@line 154 "libsodium/src/libsodium/randombytes/randombytes.c"
  $16 = (($15) + 1)|0; //@line 154 "libsodium/src/libsodium/randombytes/randombytes.c"
  $5 = $16; //@line 154 "libsodium/src/libsodium/randombytes/randombytes.c"
 }
 STACKTOP = sp;return; //@line 158 "libsodium/src/libsodium/randombytes/randombytes.c"
}
function _l2($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0;
 var $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $2; //@line 58 "HyMES/arith.c"
 $4 = $3 >>> 16; //@line 58 "HyMES/arith.c"
 $5 = ($4|0)!=(0); //@line 58 "HyMES/arith.c"
 $6 = $2; //@line 59 "HyMES/arith.c"
 if ($5) {
  $7 = $6 >>> 24; //@line 59 "HyMES/arith.c"
  $8 = ($7|0)!=(0); //@line 59 "HyMES/arith.c"
  $9 = $2; //@line 60 "HyMES/arith.c"
  if ($8) {
   $10 = $9 >>> 24; //@line 60 "HyMES/arith.c"
   $11 = (8423 + ($10)|0); //@line 60 "HyMES/arith.c"
   $12 = HEAP8[$11>>0]|0; //@line 60 "HyMES/arith.c"
   $13 = $12 << 24 >> 24; //@line 60 "HyMES/arith.c"
   $14 = (($13) + 24)|0; //@line 60 "HyMES/arith.c"
   $1 = $14; //@line 60 "HyMES/arith.c"
   $31 = $1; //@line 67 "HyMES/arith.c"
   STACKTOP = sp;return ($31|0); //@line 67 "HyMES/arith.c"
  } else {
   $15 = $9 >>> 16; //@line 62 "HyMES/arith.c"
   $16 = (8423 + ($15)|0); //@line 62 "HyMES/arith.c"
   $17 = HEAP8[$16>>0]|0; //@line 62 "HyMES/arith.c"
   $18 = $17 << 24 >> 24; //@line 62 "HyMES/arith.c"
   $19 = (($18) + 16)|0; //@line 62 "HyMES/arith.c"
   $1 = $19; //@line 62 "HyMES/arith.c"
   $31 = $1; //@line 67 "HyMES/arith.c"
   STACKTOP = sp;return ($31|0); //@line 67 "HyMES/arith.c"
  }
 } else {
  $20 = $6 >>> 8; //@line 63 "HyMES/arith.c"
  $21 = ($20|0)!=(0); //@line 63 "HyMES/arith.c"
  $22 = $2; //@line 64 "HyMES/arith.c"
  if ($21) {
   $23 = $22 >>> 8; //@line 64 "HyMES/arith.c"
   $24 = (8423 + ($23)|0); //@line 64 "HyMES/arith.c"
   $25 = HEAP8[$24>>0]|0; //@line 64 "HyMES/arith.c"
   $26 = $25 << 24 >> 24; //@line 64 "HyMES/arith.c"
   $27 = (($26) + 8)|0; //@line 64 "HyMES/arith.c"
   $1 = $27; //@line 64 "HyMES/arith.c"
   $31 = $1; //@line 67 "HyMES/arith.c"
   STACKTOP = sp;return ($31|0); //@line 67 "HyMES/arith.c"
  } else {
   $28 = (8423 + ($22)|0); //@line 66 "HyMES/arith.c"
   $29 = HEAP8[$28>>0]|0; //@line 66 "HyMES/arith.c"
   $30 = $29 << 24 >> 24; //@line 66 "HyMES/arith.c"
   $1 = $30; //@line 66 "HyMES/arith.c"
   $31 = $1; //@line 67 "HyMES/arith.c"
   STACKTOP = sp;return ($31|0); //@line 67 "HyMES/arith.c"
  }
 }
 return (0)|0;
}
function _arith_init($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $3 = (_malloc(16)|0); //@line 72 "HyMES/arith.c"
 $2 = $3; //@line 72 "HyMES/arith.c"
 $4 = $2; //@line 74 "HyMES/arith.c"
 $5 = ((($4)) + 4|0); //@line 74 "HyMES/arith.c"
 HEAP32[$5>>2] = 0; //@line 74 "HyMES/arith.c"
 $6 = $2; //@line 75 "HyMES/arith.c"
 $7 = ((($6)) + 8|0); //@line 75 "HyMES/arith.c"
 HEAP32[$7>>2] = 2097152; //@line 75 "HyMES/arith.c"
 $8 = $2; //@line 76 "HyMES/arith.c"
 HEAP32[$8>>2] = 0; //@line 76 "HyMES/arith.c"
 $9 = $1; //@line 77 "HyMES/arith.c"
 $10 = $2; //@line 77 "HyMES/arith.c"
 $11 = ((($10)) + 12|0); //@line 77 "HyMES/arith.c"
 HEAP32[$11>>2] = $9; //@line 77 "HyMES/arith.c"
 $12 = $2; //@line 79 "HyMES/arith.c"
 STACKTOP = sp;return ($12|0); //@line 79 "HyMES/arith.c"
}
function _ajuster($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0;
 var $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0;
 var $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0;
 var $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0;
 var $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0;
 var $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $2 = $0;
 $3 = $1;
 $7 = $2; //@line 91 "HyMES/arith.c"
 $8 = ((($7)) + 8|0); //@line 91 "HyMES/arith.c"
 $9 = HEAP32[$8>>2]|0; //@line 91 "HyMES/arith.c"
 $10 = (($9) - 1)|0; //@line 91 "HyMES/arith.c"
 $11 = $2; //@line 91 "HyMES/arith.c"
 $12 = ((($11)) + 4|0); //@line 91 "HyMES/arith.c"
 $13 = HEAP32[$12>>2]|0; //@line 91 "HyMES/arith.c"
 $14 = $10 ^ $13; //@line 91 "HyMES/arith.c"
 $6 = $14; //@line 91 "HyMES/arith.c"
 $15 = $6; //@line 92 "HyMES/arith.c"
 $16 = (_l2($15)|0); //@line 92 "HyMES/arith.c"
 $17 = (21 - ($16))|0; //@line 92 "HyMES/arith.c"
 $4 = $17; //@line 92 "HyMES/arith.c"
 $18 = $2; //@line 97 "HyMES/arith.c"
 $19 = ((($18)) + 8|0); //@line 97 "HyMES/arith.c"
 $20 = HEAP32[$19>>2]|0; //@line 97 "HyMES/arith.c"
 $21 = (($20) - 1)|0; //@line 97 "HyMES/arith.c"
 $22 = $2; //@line 97 "HyMES/arith.c"
 $23 = ((($22)) + 4|0); //@line 97 "HyMES/arith.c"
 $24 = HEAP32[$23>>2]|0; //@line 97 "HyMES/arith.c"
 $25 = (($21) - ($24))|0; //@line 97 "HyMES/arith.c"
 $6 = $25; //@line 97 "HyMES/arith.c"
 $26 = $6; //@line 98 "HyMES/arith.c"
 $27 = (_l2($26)|0); //@line 98 "HyMES/arith.c"
 $28 = (21 - ($27))|0; //@line 98 "HyMES/arith.c"
 $29 = (($28) - 1)|0; //@line 98 "HyMES/arith.c"
 $5 = $29; //@line 98 "HyMES/arith.c"
 $30 = $4; //@line 110 "HyMES/arith.c"
 $31 = $5; //@line 110 "HyMES/arith.c"
 $32 = ($30|0)>($31|0); //@line 110 "HyMES/arith.c"
 if ($32) {
  $33 = $5; //@line 111 "HyMES/arith.c"
  $4 = $33; //@line 111 "HyMES/arith.c"
 }
 $34 = $4; //@line 112 "HyMES/arith.c"
 $35 = ($34|0)>(0); //@line 112 "HyMES/arith.c"
 if ($35) {
  $36 = $3; //@line 113 "HyMES/arith.c"
  $37 = ($36|0)!=(0); //@line 113 "HyMES/arith.c"
  if ($37) {
   $38 = $2; //@line 114 "HyMES/arith.c"
   $39 = ((($38)) + 4|0); //@line 114 "HyMES/arith.c"
   $40 = HEAP32[$39>>2]|0; //@line 114 "HyMES/arith.c"
   $41 = $40 >>> 20; //@line 114 "HyMES/arith.c"
   $6 = $41; //@line 114 "HyMES/arith.c"
   $42 = $2; //@line 115 "HyMES/arith.c"
   $43 = ((($42)) + 4|0); //@line 115 "HyMES/arith.c"
   $44 = HEAP32[$43>>2]|0; //@line 115 "HyMES/arith.c"
   $45 = $44 & -1048577; //@line 115 "HyMES/arith.c"
   HEAP32[$43>>2] = $45; //@line 115 "HyMES/arith.c"
   $46 = $6; //@line 116 "HyMES/arith.c"
   $47 = $2; //@line 116 "HyMES/arith.c"
   $48 = ((($47)) + 12|0); //@line 116 "HyMES/arith.c"
   $49 = HEAP32[$48>>2]|0; //@line 116 "HyMES/arith.c"
   _bwrite_bit($46,$49); //@line 116 "HyMES/arith.c"
   $50 = $6; //@line 117 "HyMES/arith.c"
   $51 = (1 - ($50))|0; //@line 117 "HyMES/arith.c"
   $52 = $2; //@line 117 "HyMES/arith.c"
   $53 = HEAP32[$52>>2]|0; //@line 117 "HyMES/arith.c"
   $54 = $2; //@line 117 "HyMES/arith.c"
   $55 = ((($54)) + 12|0); //@line 117 "HyMES/arith.c"
   $56 = HEAP32[$55>>2]|0; //@line 117 "HyMES/arith.c"
   _bwrite_bits($51,$53,$56); //@line 117 "HyMES/arith.c"
   $57 = $2; //@line 118 "HyMES/arith.c"
   $58 = ((($57)) + 4|0); //@line 118 "HyMES/arith.c"
   $59 = HEAP32[$58>>2]|0; //@line 118 "HyMES/arith.c"
   $60 = $4; //@line 118 "HyMES/arith.c"
   $61 = (21 - ($60))|0; //@line 118 "HyMES/arith.c"
   $62 = $59 >>> $61; //@line 118 "HyMES/arith.c"
   $63 = $4; //@line 118 "HyMES/arith.c"
   $64 = (($63) - 1)|0; //@line 118 "HyMES/arith.c"
   $65 = $2; //@line 118 "HyMES/arith.c"
   $66 = ((($65)) + 12|0); //@line 118 "HyMES/arith.c"
   $67 = HEAP32[$66>>2]|0; //@line 118 "HyMES/arith.c"
   _bwrite($62,$64,$67); //@line 118 "HyMES/arith.c"
  }
  $68 = $2; //@line 120 "HyMES/arith.c"
  HEAP32[$68>>2] = 0; //@line 120 "HyMES/arith.c"
 }
 $69 = $2; //@line 122 "HyMES/arith.c"
 $70 = ((($69)) + 8|0); //@line 122 "HyMES/arith.c"
 $71 = HEAP32[$70>>2]|0; //@line 122 "HyMES/arith.c"
 $72 = $5; //@line 122 "HyMES/arith.c"
 $73 = $71 << $72; //@line 122 "HyMES/arith.c"
 $74 = $73 & 2097151; //@line 122 "HyMES/arith.c"
 $75 = $2; //@line 122 "HyMES/arith.c"
 $76 = ((($75)) + 8|0); //@line 122 "HyMES/arith.c"
 HEAP32[$76>>2] = $74; //@line 122 "HyMES/arith.c"
 $77 = $2; //@line 123 "HyMES/arith.c"
 $78 = ((($77)) + 8|0); //@line 123 "HyMES/arith.c"
 $79 = HEAP32[$78>>2]|0; //@line 123 "HyMES/arith.c"
 $80 = ($79|0)==(0); //@line 123 "HyMES/arith.c"
 if ($80) {
  $81 = $2; //@line 124 "HyMES/arith.c"
  $82 = ((($81)) + 8|0); //@line 124 "HyMES/arith.c"
  HEAP32[$82>>2] = 2097152; //@line 124 "HyMES/arith.c"
 }
 $83 = $2; //@line 125 "HyMES/arith.c"
 $84 = ((($83)) + 4|0); //@line 125 "HyMES/arith.c"
 $85 = HEAP32[$84>>2]|0; //@line 125 "HyMES/arith.c"
 $86 = $5; //@line 125 "HyMES/arith.c"
 $87 = $85 << $86; //@line 125 "HyMES/arith.c"
 $88 = $87 & 2097151; //@line 125 "HyMES/arith.c"
 $89 = $2; //@line 125 "HyMES/arith.c"
 $90 = ((($89)) + 4|0); //@line 125 "HyMES/arith.c"
 HEAP32[$90>>2] = $88; //@line 125 "HyMES/arith.c"
 $91 = $5; //@line 126 "HyMES/arith.c"
 $92 = $4; //@line 126 "HyMES/arith.c"
 $93 = (($91) - ($92))|0; //@line 126 "HyMES/arith.c"
 $94 = ($93|0)>(0); //@line 126 "HyMES/arith.c"
 if (!($94)) {
  $109 = $5; //@line 132 "HyMES/arith.c"
  STACKTOP = sp;return ($109|0); //@line 132 "HyMES/arith.c"
 }
 $95 = $2; //@line 127 "HyMES/arith.c"
 $96 = ((($95)) + 8|0); //@line 127 "HyMES/arith.c"
 $97 = HEAP32[$96>>2]|0; //@line 127 "HyMES/arith.c"
 $98 = $97 ^ 1048576; //@line 127 "HyMES/arith.c"
 HEAP32[$96>>2] = $98; //@line 127 "HyMES/arith.c"
 $99 = $2; //@line 128 "HyMES/arith.c"
 $100 = ((($99)) + 4|0); //@line 128 "HyMES/arith.c"
 $101 = HEAP32[$100>>2]|0; //@line 128 "HyMES/arith.c"
 $102 = $101 ^ 1048576; //@line 128 "HyMES/arith.c"
 HEAP32[$100>>2] = $102; //@line 128 "HyMES/arith.c"
 $103 = $5; //@line 129 "HyMES/arith.c"
 $104 = $4; //@line 129 "HyMES/arith.c"
 $105 = (($103) - ($104))|0; //@line 129 "HyMES/arith.c"
 $106 = $2; //@line 129 "HyMES/arith.c"
 $107 = HEAP32[$106>>2]|0; //@line 129 "HyMES/arith.c"
 $108 = (($107) + ($105))|0; //@line 129 "HyMES/arith.c"
 HEAP32[$106>>2] = $108; //@line 129 "HyMES/arith.c"
 $109 = $5; //@line 132 "HyMES/arith.c"
 STACKTOP = sp;return ($109|0); //@line 132 "HyMES/arith.c"
}
function _coder($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0;
 var $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $7 = 0;
 var $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $3 = $0;
 $4 = $2;
 $8 = $4; //@line 146 "HyMES/arith.c"
 $9 = ((($8)) + 8|0); //@line 146 "HyMES/arith.c"
 $10 = HEAP32[$9>>2]|0; //@line 146 "HyMES/arith.c"
 $11 = $4; //@line 146 "HyMES/arith.c"
 $12 = ((($11)) + 4|0); //@line 146 "HyMES/arith.c"
 $13 = HEAP32[$12>>2]|0; //@line 146 "HyMES/arith.c"
 $14 = (($10) - ($13))|0; //@line 146 "HyMES/arith.c"
 $6 = $14; //@line 146 "HyMES/arith.c"
 $15 = $4; //@line 149 "HyMES/arith.c"
 $16 = HEAP32[$15>>2]|0; //@line 149 "HyMES/arith.c"
 $17 = (21 + ($16))|0; //@line 149 "HyMES/arith.c"
 $18 = $4; //@line 149 "HyMES/arith.c"
 $19 = ((($18)) + 12|0); //@line 149 "HyMES/arith.c"
 $20 = HEAP32[$19>>2]|0; //@line 149 "HyMES/arith.c"
 _bwrite_lock($17,$20); //@line 149 "HyMES/arith.c"
 $21 = $3; //@line 151 "HyMES/arith.c"
 $22 = ((($1)) + 4|0); //@line 151 "HyMES/arith.c"
 $23 = HEAP32[$22>>2]|0; //@line 151 "HyMES/arith.c"
 $24 = ($21>>>0)<($23>>>0); //@line 151 "HyMES/arith.c"
 if ($24) {
  $25 = $3; //@line 152 "HyMES/arith.c"
  $26 = (($25) + 1)|0; //@line 152 "HyMES/arith.c"
  $27 = HEAP32[$1>>2]|0; //@line 152 "HyMES/arith.c"
  $28 = (($26) - ($27))|0; //@line 152 "HyMES/arith.c"
  $29 = ((($1)) + 8|0); //@line 152 "HyMES/arith.c"
  $30 = HEAP32[$29>>2]|0; //@line 152 "HyMES/arith.c"
  $31 = (($30) + ($28<<2)|0); //@line 152 "HyMES/arith.c"
  $32 = HEAP32[$31>>2]|0; //@line 152 "HyMES/arith.c"
  $5 = $32; //@line 152 "HyMES/arith.c"
  $33 = $6; //@line 153 "HyMES/arith.c"
  $34 = $5; //@line 153 "HyMES/arith.c"
  $35 = Math_imul($34, $33)|0; //@line 153 "HyMES/arith.c"
  $5 = $35; //@line 153 "HyMES/arith.c"
  $36 = $5; //@line 154 "HyMES/arith.c"
  $37 = $36 >>> 11; //@line 154 "HyMES/arith.c"
  $5 = $37; //@line 154 "HyMES/arith.c"
  $38 = $4; //@line 155 "HyMES/arith.c"
  $39 = ((($38)) + 4|0); //@line 155 "HyMES/arith.c"
  $40 = HEAP32[$39>>2]|0; //@line 155 "HyMES/arith.c"
  $41 = $5; //@line 155 "HyMES/arith.c"
  $42 = (($40) + ($41))|0; //@line 155 "HyMES/arith.c"
  $43 = $4; //@line 155 "HyMES/arith.c"
  $44 = ((($43)) + 8|0); //@line 155 "HyMES/arith.c"
  HEAP32[$44>>2] = $42; //@line 155 "HyMES/arith.c"
 }
 $45 = $3; //@line 157 "HyMES/arith.c"
 $46 = HEAP32[$1>>2]|0; //@line 157 "HyMES/arith.c"
 $47 = (($45) - ($46))|0; //@line 157 "HyMES/arith.c"
 $48 = ((($1)) + 8|0); //@line 157 "HyMES/arith.c"
 $49 = HEAP32[$48>>2]|0; //@line 157 "HyMES/arith.c"
 $50 = (($49) + ($47<<2)|0); //@line 157 "HyMES/arith.c"
 $51 = HEAP32[$50>>2]|0; //@line 157 "HyMES/arith.c"
 $5 = $51; //@line 157 "HyMES/arith.c"
 $52 = $6; //@line 158 "HyMES/arith.c"
 $53 = $5; //@line 158 "HyMES/arith.c"
 $54 = Math_imul($53, $52)|0; //@line 158 "HyMES/arith.c"
 $5 = $54; //@line 158 "HyMES/arith.c"
 $55 = $5; //@line 159 "HyMES/arith.c"
 $56 = $55 >>> 11; //@line 159 "HyMES/arith.c"
 $5 = $56; //@line 159 "HyMES/arith.c"
 $57 = $5; //@line 160 "HyMES/arith.c"
 $58 = $4; //@line 160 "HyMES/arith.c"
 $59 = ((($58)) + 4|0); //@line 160 "HyMES/arith.c"
 $60 = HEAP32[$59>>2]|0; //@line 160 "HyMES/arith.c"
 $61 = (($60) + ($57))|0; //@line 160 "HyMES/arith.c"
 HEAP32[$59>>2] = $61; //@line 160 "HyMES/arith.c"
 $62 = $4; //@line 166 "HyMES/arith.c"
 $63 = (_ajuster($62,1)|0); //@line 166 "HyMES/arith.c"
 $7 = $63; //@line 166 "HyMES/arith.c"
 $64 = $7; //@line 172 "HyMES/arith.c"
 STACKTOP = sp;return ($64|0); //@line 172 "HyMES/arith.c"
}
function _coder_uniforme($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $5 = 0;
 var $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $9 = $5; //@line 185 "HyMES/arith.c"
 $10 = ((($9)) + 8|0); //@line 185 "HyMES/arith.c"
 $11 = HEAP32[$10>>2]|0; //@line 185 "HyMES/arith.c"
 $12 = $5; //@line 185 "HyMES/arith.c"
 $13 = ((($12)) + 4|0); //@line 185 "HyMES/arith.c"
 $14 = HEAP32[$13>>2]|0; //@line 185 "HyMES/arith.c"
 $15 = (($11) - ($14))|0; //@line 185 "HyMES/arith.c"
 $7 = $15; //@line 185 "HyMES/arith.c"
 $16 = $5; //@line 188 "HyMES/arith.c"
 $17 = HEAP32[$16>>2]|0; //@line 188 "HyMES/arith.c"
 $18 = (21 + ($17))|0; //@line 188 "HyMES/arith.c"
 $19 = $5; //@line 188 "HyMES/arith.c"
 $20 = ((($19)) + 12|0); //@line 188 "HyMES/arith.c"
 $21 = HEAP32[$20>>2]|0; //@line 188 "HyMES/arith.c"
 _bwrite_lock($18,$21); //@line 188 "HyMES/arith.c"
 $22 = $3; //@line 190 "HyMES/arith.c"
 $6 = $22; //@line 190 "HyMES/arith.c"
 $23 = $7; //@line 191 "HyMES/arith.c"
 $24 = $6; //@line 191 "HyMES/arith.c"
 $25 = Math_imul($24, $23)|0; //@line 191 "HyMES/arith.c"
 $6 = $25; //@line 191 "HyMES/arith.c"
 $26 = $5; //@line 193 "HyMES/arith.c"
 $27 = ((($26)) + 4|0); //@line 193 "HyMES/arith.c"
 $28 = HEAP32[$27>>2]|0; //@line 193 "HyMES/arith.c"
 $29 = $6; //@line 193 "HyMES/arith.c"
 $30 = $7; //@line 193 "HyMES/arith.c"
 $31 = (($29) + ($30))|0; //@line 193 "HyMES/arith.c"
 $32 = $4; //@line 193 "HyMES/arith.c"
 $33 = (($31>>>0) / ($32>>>0))&-1; //@line 193 "HyMES/arith.c"
 $34 = (($28) + ($33))|0; //@line 193 "HyMES/arith.c"
 $35 = $5; //@line 193 "HyMES/arith.c"
 $36 = ((($35)) + 8|0); //@line 193 "HyMES/arith.c"
 HEAP32[$36>>2] = $34; //@line 193 "HyMES/arith.c"
 $37 = $6; //@line 194 "HyMES/arith.c"
 $38 = $4; //@line 194 "HyMES/arith.c"
 $39 = (($37>>>0) / ($38>>>0))&-1; //@line 194 "HyMES/arith.c"
 $40 = $5; //@line 194 "HyMES/arith.c"
 $41 = ((($40)) + 4|0); //@line 194 "HyMES/arith.c"
 $42 = HEAP32[$41>>2]|0; //@line 194 "HyMES/arith.c"
 $43 = (($42) + ($39))|0; //@line 194 "HyMES/arith.c"
 HEAP32[$41>>2] = $43; //@line 194 "HyMES/arith.c"
 $44 = $5; //@line 200 "HyMES/arith.c"
 $45 = (_ajuster($44,1)|0); //@line 200 "HyMES/arith.c"
 $8 = $45; //@line 200 "HyMES/arith.c"
 $46 = $8; //@line 206 "HyMES/arith.c"
 STACKTOP = sp;return ($46|0); //@line 206 "HyMES/arith.c"
}
function _chercher($0,$1,$2,$3) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $30 = 0, $31 = 0, $32 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $5 = $0;
 $6 = $1;
 $7 = $2;
 $8 = $3;
 $10 = $8; //@line 210 "HyMES/arith.c"
 $11 = $7; //@line 210 "HyMES/arith.c"
 $12 = (($10) - ($11))|0; //@line 210 "HyMES/arith.c"
 $13 = ($12|0)==(1); //@line 210 "HyMES/arith.c"
 $14 = $7; //@line 211 "HyMES/arith.c"
 if ($13) {
  $4 = $14; //@line 211 "HyMES/arith.c"
  $32 = $4; //@line 219 "HyMES/arith.c"
  STACKTOP = sp;return ($32|0); //@line 219 "HyMES/arith.c"
 }
 $15 = $8; //@line 213 "HyMES/arith.c"
 $16 = (($14) + ($15))|0; //@line 213 "HyMES/arith.c"
 $17 = (($16|0) / 2)&-1; //@line 213 "HyMES/arith.c"
 $9 = $17; //@line 213 "HyMES/arith.c"
 $18 = $9; //@line 214 "HyMES/arith.c"
 $19 = $6; //@line 214 "HyMES/arith.c"
 $20 = (($19) + ($18<<2)|0); //@line 214 "HyMES/arith.c"
 $21 = HEAP32[$20>>2]|0; //@line 214 "HyMES/arith.c"
 $22 = $5; //@line 214 "HyMES/arith.c"
 $23 = ($21>>>0)>($22>>>0); //@line 214 "HyMES/arith.c"
 $24 = $5; //@line 215 "HyMES/arith.c"
 $25 = $6; //@line 215 "HyMES/arith.c"
 if ($23) {
  $26 = $7; //@line 215 "HyMES/arith.c"
  $27 = $9; //@line 215 "HyMES/arith.c"
  $28 = (_chercher($24,$25,$26,$27)|0); //@line 215 "HyMES/arith.c"
  $4 = $28; //@line 215 "HyMES/arith.c"
  $32 = $4; //@line 219 "HyMES/arith.c"
  STACKTOP = sp;return ($32|0); //@line 219 "HyMES/arith.c"
 } else {
  $29 = $9; //@line 217 "HyMES/arith.c"
  $30 = $8; //@line 217 "HyMES/arith.c"
  $31 = (_chercher($24,$25,$29,$30)|0); //@line 217 "HyMES/arith.c"
  $4 = $31; //@line 217 "HyMES/arith.c"
  $32 = $4; //@line 219 "HyMES/arith.c"
  STACKTOP = sp;return ($32|0); //@line 219 "HyMES/arith.c"
 }
 return (0)|0;
}
function _decoder($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0;
 var $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0;
 var $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0;
 var $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0;
 var $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0;
 var $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $3 = $1;
 $4 = $2;
 $10 = $4; //@line 228 "HyMES/arith.c"
 $11 = ((($10)) + 8|0); //@line 228 "HyMES/arith.c"
 $12 = HEAP32[$11>>2]|0; //@line 228 "HyMES/arith.c"
 $13 = $4; //@line 228 "HyMES/arith.c"
 $14 = ((($13)) + 4|0); //@line 228 "HyMES/arith.c"
 $15 = HEAP32[$14>>2]|0; //@line 228 "HyMES/arith.c"
 $16 = (($12) - ($15))|0; //@line 228 "HyMES/arith.c"
 $6 = $16; //@line 228 "HyMES/arith.c"
 $17 = $4; //@line 230 "HyMES/arith.c"
 $18 = HEAP32[$17>>2]|0; //@line 230 "HyMES/arith.c"
 $19 = ($18|0)!=(0); //@line 230 "HyMES/arith.c"
 $20 = $4; //@line 231 "HyMES/arith.c"
 $21 = ((($20)) + 12|0); //@line 231 "HyMES/arith.c"
 $22 = HEAP32[$21>>2]|0; //@line 231 "HyMES/arith.c"
 $23 = (_blook(21,$22)|0); //@line 231 "HyMES/arith.c"
 if ($19) {
  $24 = $23 ^ 1048576; //@line 231 "HyMES/arith.c"
  $7 = $24; //@line 231 "HyMES/arith.c"
 } else {
  $7 = $23; //@line 233 "HyMES/arith.c"
 }
 $25 = $4; //@line 235 "HyMES/arith.c"
 $26 = ((($25)) + 12|0); //@line 235 "HyMES/arith.c"
 $27 = HEAP32[$26>>2]|0; //@line 235 "HyMES/arith.c"
 _bread_lock(21,$27); //@line 235 "HyMES/arith.c"
 $28 = $7; //@line 237 "HyMES/arith.c"
 $29 = $4; //@line 237 "HyMES/arith.c"
 $30 = ((($29)) + 4|0); //@line 237 "HyMES/arith.c"
 $31 = HEAP32[$30>>2]|0; //@line 237 "HyMES/arith.c"
 $32 = (($28) - ($31))|0; //@line 237 "HyMES/arith.c"
 $5 = $32; //@line 237 "HyMES/arith.c"
 $33 = $5; //@line 238 "HyMES/arith.c"
 $34 = $33 << 11; //@line 238 "HyMES/arith.c"
 $5 = $34; //@line 238 "HyMES/arith.c"
 $35 = $6; //@line 239 "HyMES/arith.c"
 $36 = $5; //@line 239 "HyMES/arith.c"
 $37 = (($36>>>0) / ($35>>>0))&-1; //@line 239 "HyMES/arith.c"
 $5 = $37; //@line 239 "HyMES/arith.c"
 $38 = HEAP32[$0>>2]|0; //@line 241 "HyMES/arith.c"
 $39 = $5; //@line 241 "HyMES/arith.c"
 $40 = ((($0)) + 8|0); //@line 241 "HyMES/arith.c"
 $41 = HEAP32[$40>>2]|0; //@line 241 "HyMES/arith.c"
 $42 = ((($0)) + 4|0); //@line 241 "HyMES/arith.c"
 $43 = HEAP32[$42>>2]|0; //@line 241 "HyMES/arith.c"
 $44 = HEAP32[$0>>2]|0; //@line 241 "HyMES/arith.c"
 $45 = (($43) - ($44))|0; //@line 241 "HyMES/arith.c"
 $46 = (($45) + 1)|0; //@line 241 "HyMES/arith.c"
 $47 = (_chercher($39,$41,0,$46)|0); //@line 241 "HyMES/arith.c"
 $48 = (($38) + ($47))|0; //@line 241 "HyMES/arith.c"
 $8 = $48; //@line 241 "HyMES/arith.c"
 $49 = $8; //@line 247 "HyMES/arith.c"
 $50 = ((($0)) + 4|0); //@line 247 "HyMES/arith.c"
 $51 = HEAP32[$50>>2]|0; //@line 247 "HyMES/arith.c"
 $52 = ($49>>>0)<($51>>>0); //@line 247 "HyMES/arith.c"
 do {
  if ($52) {
   $53 = $8; //@line 248 "HyMES/arith.c"
   $54 = (($53) + 1)|0; //@line 248 "HyMES/arith.c"
   $55 = HEAP32[$0>>2]|0; //@line 248 "HyMES/arith.c"
   $56 = (($54) - ($55))|0; //@line 248 "HyMES/arith.c"
   $57 = ((($0)) + 8|0); //@line 248 "HyMES/arith.c"
   $58 = HEAP32[$57>>2]|0; //@line 248 "HyMES/arith.c"
   $59 = (($58) + ($56<<2)|0); //@line 248 "HyMES/arith.c"
   $60 = HEAP32[$59>>2]|0; //@line 248 "HyMES/arith.c"
   $5 = $60; //@line 248 "HyMES/arith.c"
   $61 = $6; //@line 249 "HyMES/arith.c"
   $62 = $5; //@line 249 "HyMES/arith.c"
   $63 = Math_imul($62, $61)|0; //@line 249 "HyMES/arith.c"
   $5 = $63; //@line 249 "HyMES/arith.c"
   $64 = $5; //@line 250 "HyMES/arith.c"
   $65 = $64 >>> 11; //@line 250 "HyMES/arith.c"
   $5 = $65; //@line 250 "HyMES/arith.c"
   $66 = $4; //@line 251 "HyMES/arith.c"
   $67 = ((($66)) + 4|0); //@line 251 "HyMES/arith.c"
   $68 = HEAP32[$67>>2]|0; //@line 251 "HyMES/arith.c"
   $69 = $5; //@line 251 "HyMES/arith.c"
   $70 = (($69) + ($68))|0; //@line 251 "HyMES/arith.c"
   $5 = $70; //@line 251 "HyMES/arith.c"
   $71 = $7; //@line 252 "HyMES/arith.c"
   $72 = $5; //@line 252 "HyMES/arith.c"
   $73 = ($71>>>0)>=($72>>>0); //@line 252 "HyMES/arith.c"
   if (!($73)) {
    $100 = $5; //@line 262 "HyMES/arith.c"
    $101 = $4; //@line 262 "HyMES/arith.c"
    $102 = ((($101)) + 8|0); //@line 262 "HyMES/arith.c"
    HEAP32[$102>>2] = $100; //@line 262 "HyMES/arith.c"
    break;
   }
   $74 = $8; //@line 253 "HyMES/arith.c"
   $75 = (($74) + 1)|0; //@line 253 "HyMES/arith.c"
   $8 = $75; //@line 253 "HyMES/arith.c"
   $76 = $8; //@line 254 "HyMES/arith.c"
   $77 = ((($0)) + 4|0); //@line 254 "HyMES/arith.c"
   $78 = HEAP32[$77>>2]|0; //@line 254 "HyMES/arith.c"
   $79 = ($76>>>0)<($78>>>0); //@line 254 "HyMES/arith.c"
   if ($79) {
    $80 = $8; //@line 255 "HyMES/arith.c"
    $81 = (($80) + 1)|0; //@line 255 "HyMES/arith.c"
    $82 = HEAP32[$0>>2]|0; //@line 255 "HyMES/arith.c"
    $83 = (($81) - ($82))|0; //@line 255 "HyMES/arith.c"
    $84 = ((($0)) + 8|0); //@line 255 "HyMES/arith.c"
    $85 = HEAP32[$84>>2]|0; //@line 255 "HyMES/arith.c"
    $86 = (($85) + ($83<<2)|0); //@line 255 "HyMES/arith.c"
    $87 = HEAP32[$86>>2]|0; //@line 255 "HyMES/arith.c"
    $5 = $87; //@line 255 "HyMES/arith.c"
    $88 = $6; //@line 256 "HyMES/arith.c"
    $89 = $5; //@line 256 "HyMES/arith.c"
    $90 = Math_imul($89, $88)|0; //@line 256 "HyMES/arith.c"
    $5 = $90; //@line 256 "HyMES/arith.c"
    $91 = $5; //@line 257 "HyMES/arith.c"
    $92 = $91 >>> 11; //@line 257 "HyMES/arith.c"
    $5 = $92; //@line 257 "HyMES/arith.c"
    $93 = $4; //@line 258 "HyMES/arith.c"
    $94 = ((($93)) + 4|0); //@line 258 "HyMES/arith.c"
    $95 = HEAP32[$94>>2]|0; //@line 258 "HyMES/arith.c"
    $96 = $5; //@line 258 "HyMES/arith.c"
    $97 = (($95) + ($96))|0; //@line 258 "HyMES/arith.c"
    $98 = $4; //@line 258 "HyMES/arith.c"
    $99 = ((($98)) + 8|0); //@line 258 "HyMES/arith.c"
    HEAP32[$99>>2] = $97; //@line 258 "HyMES/arith.c"
   }
  }
 } while(0);
 $103 = $8; //@line 264 "HyMES/arith.c"
 $104 = HEAP32[$0>>2]|0; //@line 264 "HyMES/arith.c"
 $105 = (($103) - ($104))|0; //@line 264 "HyMES/arith.c"
 $106 = ((($0)) + 8|0); //@line 264 "HyMES/arith.c"
 $107 = HEAP32[$106>>2]|0; //@line 264 "HyMES/arith.c"
 $108 = (($107) + ($105<<2)|0); //@line 264 "HyMES/arith.c"
 $109 = HEAP32[$108>>2]|0; //@line 264 "HyMES/arith.c"
 $5 = $109; //@line 264 "HyMES/arith.c"
 $110 = $6; //@line 265 "HyMES/arith.c"
 $111 = $5; //@line 265 "HyMES/arith.c"
 $112 = Math_imul($111, $110)|0; //@line 265 "HyMES/arith.c"
 $5 = $112; //@line 265 "HyMES/arith.c"
 $113 = $5; //@line 266 "HyMES/arith.c"
 $114 = $113 >>> 11; //@line 266 "HyMES/arith.c"
 $5 = $114; //@line 266 "HyMES/arith.c"
 $115 = $5; //@line 267 "HyMES/arith.c"
 $116 = $4; //@line 267 "HyMES/arith.c"
 $117 = ((($116)) + 4|0); //@line 267 "HyMES/arith.c"
 $118 = HEAP32[$117>>2]|0; //@line 267 "HyMES/arith.c"
 $119 = (($118) + ($115))|0; //@line 267 "HyMES/arith.c"
 HEAP32[$117>>2] = $119; //@line 267 "HyMES/arith.c"
 $120 = $4; //@line 277 "HyMES/arith.c"
 $121 = (_ajuster($120,0)|0); //@line 277 "HyMES/arith.c"
 $9 = $121; //@line 277 "HyMES/arith.c"
 $122 = $9; //@line 278 "HyMES/arith.c"
 $123 = $4; //@line 278 "HyMES/arith.c"
 $124 = ((($123)) + 12|0); //@line 278 "HyMES/arith.c"
 $125 = HEAP32[$124>>2]|0; //@line 278 "HyMES/arith.c"
 _bstep($122,$125); //@line 278 "HyMES/arith.c"
 $126 = $8; //@line 284 "HyMES/arith.c"
 $127 = $3; //@line 284 "HyMES/arith.c"
 HEAP32[$127>>2] = $126; //@line 284 "HyMES/arith.c"
 $128 = $9; //@line 285 "HyMES/arith.c"
 STACKTOP = sp;return ($128|0); //@line 285 "HyMES/arith.c"
}
function _decoder_uniforme($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0;
 var $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0;
 var $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0;
 var $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $11 = $5; //@line 294 "HyMES/arith.c"
 $12 = ((($11)) + 8|0); //@line 294 "HyMES/arith.c"
 $13 = HEAP32[$12>>2]|0; //@line 294 "HyMES/arith.c"
 $14 = $5; //@line 294 "HyMES/arith.c"
 $15 = ((($14)) + 4|0); //@line 294 "HyMES/arith.c"
 $16 = HEAP32[$15>>2]|0; //@line 294 "HyMES/arith.c"
 $17 = (($13) - ($16))|0; //@line 294 "HyMES/arith.c"
 $7 = $17; //@line 294 "HyMES/arith.c"
 $18 = $5; //@line 296 "HyMES/arith.c"
 $19 = HEAP32[$18>>2]|0; //@line 296 "HyMES/arith.c"
 $20 = ($19|0)!=(0); //@line 296 "HyMES/arith.c"
 $21 = $5; //@line 297 "HyMES/arith.c"
 $22 = ((($21)) + 12|0); //@line 297 "HyMES/arith.c"
 $23 = HEAP32[$22>>2]|0; //@line 297 "HyMES/arith.c"
 $24 = (_blook(21,$23)|0); //@line 297 "HyMES/arith.c"
 if ($20) {
  $25 = $24 ^ 1048576; //@line 297 "HyMES/arith.c"
  $8 = $25; //@line 297 "HyMES/arith.c"
 } else {
  $8 = $24; //@line 299 "HyMES/arith.c"
 }
 $26 = $5; //@line 301 "HyMES/arith.c"
 $27 = ((($26)) + 12|0); //@line 301 "HyMES/arith.c"
 $28 = HEAP32[$27>>2]|0; //@line 301 "HyMES/arith.c"
 _bread_lock(21,$28); //@line 301 "HyMES/arith.c"
 $29 = $8; //@line 303 "HyMES/arith.c"
 $30 = $5; //@line 303 "HyMES/arith.c"
 $31 = ((($30)) + 4|0); //@line 303 "HyMES/arith.c"
 $32 = HEAP32[$31>>2]|0; //@line 303 "HyMES/arith.c"
 $33 = (($29) - ($32))|0; //@line 303 "HyMES/arith.c"
 $6 = $33; //@line 303 "HyMES/arith.c"
 $34 = $3; //@line 304 "HyMES/arith.c"
 $35 = $6; //@line 304 "HyMES/arith.c"
 $36 = Math_imul($35, $34)|0; //@line 304 "HyMES/arith.c"
 $6 = $36; //@line 304 "HyMES/arith.c"
 $37 = $7; //@line 305 "HyMES/arith.c"
 $38 = $6; //@line 305 "HyMES/arith.c"
 $39 = (($38>>>0) / ($37>>>0))&-1; //@line 305 "HyMES/arith.c"
 $6 = $39; //@line 305 "HyMES/arith.c"
 $40 = $6; //@line 306 "HyMES/arith.c"
 $9 = $40; //@line 306 "HyMES/arith.c"
 $41 = $9; //@line 312 "HyMES/arith.c"
 $6 = $41; //@line 312 "HyMES/arith.c"
 $42 = $7; //@line 313 "HyMES/arith.c"
 $43 = $6; //@line 313 "HyMES/arith.c"
 $44 = Math_imul($43, $42)|0; //@line 313 "HyMES/arith.c"
 $6 = $44; //@line 313 "HyMES/arith.c"
 $45 = $5; //@line 314 "HyMES/arith.c"
 $46 = ((($45)) + 4|0); //@line 314 "HyMES/arith.c"
 $47 = HEAP32[$46>>2]|0; //@line 314 "HyMES/arith.c"
 $48 = $6; //@line 314 "HyMES/arith.c"
 $49 = $7; //@line 314 "HyMES/arith.c"
 $50 = (($48) + ($49))|0; //@line 314 "HyMES/arith.c"
 $51 = $3; //@line 314 "HyMES/arith.c"
 $52 = (($50>>>0) / ($51>>>0))&-1; //@line 314 "HyMES/arith.c"
 $53 = (($47) + ($52))|0; //@line 314 "HyMES/arith.c"
 $54 = $5; //@line 314 "HyMES/arith.c"
 $55 = ((($54)) + 8|0); //@line 314 "HyMES/arith.c"
 HEAP32[$55>>2] = $53; //@line 314 "HyMES/arith.c"
 $56 = $8; //@line 316 "HyMES/arith.c"
 $57 = $5; //@line 316 "HyMES/arith.c"
 $58 = ((($57)) + 8|0); //@line 316 "HyMES/arith.c"
 $59 = HEAP32[$58>>2]|0; //@line 316 "HyMES/arith.c"
 $60 = ($56>>>0)>=($59>>>0); //@line 316 "HyMES/arith.c"
 if ($60) {
  $61 = $9; //@line 317 "HyMES/arith.c"
  $62 = (($61) + 1)|0; //@line 317 "HyMES/arith.c"
  $9 = $62; //@line 317 "HyMES/arith.c"
  $63 = $7; //@line 318 "HyMES/arith.c"
  $64 = $6; //@line 318 "HyMES/arith.c"
  $65 = (($64) + ($63))|0; //@line 318 "HyMES/arith.c"
  $6 = $65; //@line 318 "HyMES/arith.c"
  $66 = $5; //@line 319 "HyMES/arith.c"
  $67 = ((($66)) + 4|0); //@line 319 "HyMES/arith.c"
  $68 = HEAP32[$67>>2]|0; //@line 319 "HyMES/arith.c"
  $69 = $6; //@line 319 "HyMES/arith.c"
  $70 = $7; //@line 319 "HyMES/arith.c"
  $71 = (($69) + ($70))|0; //@line 319 "HyMES/arith.c"
  $72 = $3; //@line 319 "HyMES/arith.c"
  $73 = (($71>>>0) / ($72>>>0))&-1; //@line 319 "HyMES/arith.c"
  $74 = (($68) + ($73))|0; //@line 319 "HyMES/arith.c"
  $75 = $5; //@line 319 "HyMES/arith.c"
  $76 = ((($75)) + 8|0); //@line 319 "HyMES/arith.c"
  HEAP32[$76>>2] = $74; //@line 319 "HyMES/arith.c"
 }
 $77 = $6; //@line 321 "HyMES/arith.c"
 $78 = $3; //@line 321 "HyMES/arith.c"
 $79 = (($77>>>0) / ($78>>>0))&-1; //@line 321 "HyMES/arith.c"
 $80 = $5; //@line 321 "HyMES/arith.c"
 $81 = ((($80)) + 4|0); //@line 321 "HyMES/arith.c"
 $82 = HEAP32[$81>>2]|0; //@line 321 "HyMES/arith.c"
 $83 = (($82) + ($79))|0; //@line 321 "HyMES/arith.c"
 HEAP32[$81>>2] = $83; //@line 321 "HyMES/arith.c"
 $84 = $5; //@line 331 "HyMES/arith.c"
 $85 = (_ajuster($84,0)|0); //@line 331 "HyMES/arith.c"
 $10 = $85; //@line 331 "HyMES/arith.c"
 $86 = $10; //@line 332 "HyMES/arith.c"
 $87 = $5; //@line 332 "HyMES/arith.c"
 $88 = ((($87)) + 12|0); //@line 332 "HyMES/arith.c"
 $89 = HEAP32[$88>>2]|0; //@line 332 "HyMES/arith.c"
 _bstep($86,$89); //@line 332 "HyMES/arith.c"
 $90 = $9; //@line 338 "HyMES/arith.c"
 $91 = $4; //@line 338 "HyMES/arith.c"
 HEAP32[$91>>2] = $90; //@line 338 "HyMES/arith.c"
 $92 = $10; //@line 339 "HyMES/arith.c"
 STACKTOP = sp;return ($92|0); //@line 339 "HyMES/arith.c"
}
function _bread_getchar($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0;
 var $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $2; //@line 28 "HyMES/buff.c"
 $4 = ((($3)) + 24|0); //@line 28 "HyMES/buff.c"
 $5 = HEAP32[$4>>2]|0; //@line 28 "HyMES/buff.c"
 $6 = (($5) + 1)|0; //@line 28 "HyMES/buff.c"
 HEAP32[$4>>2] = $6; //@line 28 "HyMES/buff.c"
 $7 = $2; //@line 29 "HyMES/buff.c"
 $8 = ((($7)) + 24|0); //@line 29 "HyMES/buff.c"
 $9 = HEAP32[$8>>2]|0; //@line 29 "HyMES/buff.c"
 $10 = $2; //@line 29 "HyMES/buff.c"
 $11 = ((($10)) + 20|0); //@line 29 "HyMES/buff.c"
 $12 = HEAP32[$11>>2]|0; //@line 29 "HyMES/buff.c"
 $13 = ($9|0)<($12|0); //@line 29 "HyMES/buff.c"
 $14 = $2; //@line 30 "HyMES/buff.c"
 $15 = ((($14)) + 24|0); //@line 30 "HyMES/buff.c"
 $16 = HEAP32[$15>>2]|0; //@line 30 "HyMES/buff.c"
 $17 = $2; //@line 30 "HyMES/buff.c"
 if ($13) {
  $18 = ((($17)) + 12|0); //@line 30 "HyMES/buff.c"
  $19 = HEAP32[$18>>2]|0; //@line 30 "HyMES/buff.c"
  $20 = (($19) + ($16)|0); //@line 30 "HyMES/buff.c"
  $21 = HEAP8[$20>>0]|0; //@line 30 "HyMES/buff.c"
  $1 = $21; //@line 30 "HyMES/buff.c"
  $40 = $1; //@line 34 "HyMES/buff.c"
  STACKTOP = sp;return ($40|0); //@line 34 "HyMES/buff.c"
 }
 $22 = ((($17)) + 20|0); //@line 31 "HyMES/buff.c"
 $23 = HEAP32[$22>>2]|0; //@line 31 "HyMES/buff.c"
 $24 = ($16|0)==($23|0); //@line 31 "HyMES/buff.c"
 if ($24) {
  $25 = $2; //@line 32 "HyMES/buff.c"
  $26 = ((($25)) + 24|0); //@line 32 "HyMES/buff.c"
  $27 = HEAP32[$26>>2]|0; //@line 32 "HyMES/buff.c"
  $28 = $2; //@line 32 "HyMES/buff.c"
  $29 = ((($28)) + 12|0); //@line 32 "HyMES/buff.c"
  $30 = HEAP32[$29>>2]|0; //@line 32 "HyMES/buff.c"
  $31 = (($30) + ($27)|0); //@line 32 "HyMES/buff.c"
  $32 = HEAP8[$31>>0]|0; //@line 32 "HyMES/buff.c"
  $33 = $32&255; //@line 32 "HyMES/buff.c"
  $34 = $2; //@line 32 "HyMES/buff.c"
  $35 = ((($34)) + 8|0); //@line 32 "HyMES/buff.c"
  $36 = HEAP8[$35>>0]|0; //@line 32 "HyMES/buff.c"
  $37 = $36&255; //@line 32 "HyMES/buff.c"
  $38 = $33 & $37; //@line 32 "HyMES/buff.c"
  $39 = $38&255; //@line 32 "HyMES/buff.c"
  $1 = $39; //@line 32 "HyMES/buff.c"
  $40 = $1; //@line 34 "HyMES/buff.c"
  STACKTOP = sp;return ($40|0); //@line 34 "HyMES/buff.c"
 } else {
  $1 = 0; //@line 33 "HyMES/buff.c"
  $40 = $1; //@line 34 "HyMES/buff.c"
  STACKTOP = sp;return ($40|0); //@line 34 "HyMES/buff.c"
 }
 return (0)|0;
}
function _bwrite_putchar($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0;
 var $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $7 = 0;
 var $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3; //@line 37 "HyMES/buff.c"
 $5 = ((($4)) + 24|0); //@line 37 "HyMES/buff.c"
 $6 = HEAP32[$5>>2]|0; //@line 37 "HyMES/buff.c"
 $7 = (($6) + 1)|0; //@line 37 "HyMES/buff.c"
 HEAP32[$5>>2] = $7; //@line 37 "HyMES/buff.c"
 $8 = $3; //@line 38 "HyMES/buff.c"
 $9 = ((($8)) + 24|0); //@line 38 "HyMES/buff.c"
 $10 = HEAP32[$9>>2]|0; //@line 38 "HyMES/buff.c"
 $11 = $3; //@line 38 "HyMES/buff.c"
 $12 = ((($11)) + 20|0); //@line 38 "HyMES/buff.c"
 $13 = HEAP32[$12>>2]|0; //@line 38 "HyMES/buff.c"
 $14 = ($10|0)<($13|0); //@line 38 "HyMES/buff.c"
 if ($14) {
  $15 = $2; //@line 39 "HyMES/buff.c"
  $16 = $3; //@line 39 "HyMES/buff.c"
  $17 = ((($16)) + 24|0); //@line 39 "HyMES/buff.c"
  $18 = HEAP32[$17>>2]|0; //@line 39 "HyMES/buff.c"
  $19 = $3; //@line 39 "HyMES/buff.c"
  $20 = ((($19)) + 12|0); //@line 39 "HyMES/buff.c"
  $21 = HEAP32[$20>>2]|0; //@line 39 "HyMES/buff.c"
  $22 = (($21) + ($18)|0); //@line 39 "HyMES/buff.c"
  HEAP8[$22>>0] = $15; //@line 39 "HyMES/buff.c"
 }
 $23 = $3; //@line 40 "HyMES/buff.c"
 $24 = ((($23)) + 24|0); //@line 40 "HyMES/buff.c"
 $25 = HEAP32[$24>>2]|0; //@line 40 "HyMES/buff.c"
 $26 = $3; //@line 40 "HyMES/buff.c"
 $27 = ((($26)) + 20|0); //@line 40 "HyMES/buff.c"
 $28 = HEAP32[$27>>2]|0; //@line 40 "HyMES/buff.c"
 $29 = ($25|0)==($28|0); //@line 40 "HyMES/buff.c"
 if (!($29)) {
  STACKTOP = sp;return; //@line 44 "HyMES/buff.c"
 }
 $30 = $3; //@line 41 "HyMES/buff.c"
 $31 = ((($30)) + 8|0); //@line 41 "HyMES/buff.c"
 $32 = HEAP8[$31>>0]|0; //@line 41 "HyMES/buff.c"
 $33 = $32&255; //@line 41 "HyMES/buff.c"
 $34 = $33 ^ -1; //@line 41 "HyMES/buff.c"
 $35 = $3; //@line 41 "HyMES/buff.c"
 $36 = ((($35)) + 24|0); //@line 41 "HyMES/buff.c"
 $37 = HEAP32[$36>>2]|0; //@line 41 "HyMES/buff.c"
 $38 = $3; //@line 41 "HyMES/buff.c"
 $39 = ((($38)) + 12|0); //@line 41 "HyMES/buff.c"
 $40 = HEAP32[$39>>2]|0; //@line 41 "HyMES/buff.c"
 $41 = (($40) + ($37)|0); //@line 41 "HyMES/buff.c"
 $42 = HEAP8[$41>>0]|0; //@line 41 "HyMES/buff.c"
 $43 = $42&255; //@line 41 "HyMES/buff.c"
 $44 = $43 & $34; //@line 41 "HyMES/buff.c"
 $45 = $44&255; //@line 41 "HyMES/buff.c"
 HEAP8[$41>>0] = $45; //@line 41 "HyMES/buff.c"
 $46 = $2; //@line 42 "HyMES/buff.c"
 $47 = $46&255; //@line 42 "HyMES/buff.c"
 $48 = $3; //@line 42 "HyMES/buff.c"
 $49 = ((($48)) + 8|0); //@line 42 "HyMES/buff.c"
 $50 = HEAP8[$49>>0]|0; //@line 42 "HyMES/buff.c"
 $51 = $50&255; //@line 42 "HyMES/buff.c"
 $52 = $47 & $51; //@line 42 "HyMES/buff.c"
 $53 = $3; //@line 42 "HyMES/buff.c"
 $54 = ((($53)) + 24|0); //@line 42 "HyMES/buff.c"
 $55 = HEAP32[$54>>2]|0; //@line 42 "HyMES/buff.c"
 $56 = $3; //@line 42 "HyMES/buff.c"
 $57 = ((($56)) + 12|0); //@line 42 "HyMES/buff.c"
 $58 = HEAP32[$57>>2]|0; //@line 42 "HyMES/buff.c"
 $59 = (($58) + ($55)|0); //@line 42 "HyMES/buff.c"
 $60 = HEAP8[$59>>0]|0; //@line 42 "HyMES/buff.c"
 $61 = $60&255; //@line 42 "HyMES/buff.c"
 $62 = $61 ^ $52; //@line 42 "HyMES/buff.c"
 $63 = $62&255; //@line 42 "HyMES/buff.c"
 HEAP8[$59>>0] = $63; //@line 42 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 44 "HyMES/buff.c"
}
function _breadinit($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $5 = (_malloc(32)|0); //@line 49 "HyMES/buff.c"
 $4 = $5; //@line 49 "HyMES/buff.c"
 $6 = $2; //@line 51 "HyMES/buff.c"
 $7 = $4; //@line 51 "HyMES/buff.c"
 $8 = ((($7)) + 12|0); //@line 51 "HyMES/buff.c"
 HEAP32[$8>>2] = $6; //@line 51 "HyMES/buff.c"
 $9 = $3; //@line 52 "HyMES/buff.c"
 $10 = $4; //@line 52 "HyMES/buff.c"
 $11 = ((($10)) + 16|0); //@line 52 "HyMES/buff.c"
 HEAP32[$11>>2] = $9; //@line 52 "HyMES/buff.c"
 $12 = $3; //@line 54 "HyMES/buff.c"
 $13 = (($12) - 1)|0; //@line 54 "HyMES/buff.c"
 $14 = (($13|0) / 8)&-1; //@line 54 "HyMES/buff.c"
 $15 = $4; //@line 54 "HyMES/buff.c"
 $16 = ((($15)) + 20|0); //@line 54 "HyMES/buff.c"
 HEAP32[$16>>2] = $14; //@line 54 "HyMES/buff.c"
 $17 = $3; //@line 56 "HyMES/buff.c"
 $18 = (0 - ($17))|0; //@line 56 "HyMES/buff.c"
 $19 = $18 & 7; //@line 56 "HyMES/buff.c"
 $20 = ($19|0)==(32); //@line 56 "HyMES/buff.c"
 if ($20) {
  $26 = 0;
 } else {
  $21 = $3; //@line 56 "HyMES/buff.c"
  $22 = (0 - ($21))|0; //@line 56 "HyMES/buff.c"
  $23 = $22 & 7; //@line 56 "HyMES/buff.c"
  $24 = -1 << $23; //@line 56 "HyMES/buff.c"
  $26 = $24;
 }
 $25 = $26&255; //@line 56 "HyMES/buff.c"
 $27 = $4; //@line 56 "HyMES/buff.c"
 $28 = ((($27)) + 8|0); //@line 56 "HyMES/buff.c"
 HEAP8[$28>>0] = $25; //@line 56 "HyMES/buff.c"
 $29 = $4; //@line 58 "HyMES/buff.c"
 $30 = ((($29)) + 24|0); //@line 58 "HyMES/buff.c"
 HEAP32[$30>>2] = -1; //@line 58 "HyMES/buff.c"
 $31 = $4; //@line 59 "HyMES/buff.c"
 $32 = ((($31)) + 4|0); //@line 59 "HyMES/buff.c"
 HEAP32[$32>>2] = 0; //@line 59 "HyMES/buff.c"
 $33 = $4; //@line 60 "HyMES/buff.c"
 HEAP32[$33>>2] = 0; //@line 60 "HyMES/buff.c"
 $34 = $4; //@line 61 "HyMES/buff.c"
 $35 = ((($34)) + 28|0); //@line 61 "HyMES/buff.c"
 HEAP32[$35>>2] = 0; //@line 61 "HyMES/buff.c"
 $36 = $4; //@line 63 "HyMES/buff.c"
 STACKTOP = sp;return ($36|0); //@line 63 "HyMES/buff.c"
}
function _bwriteinit($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $5 = (_malloc(32)|0); //@line 69 "HyMES/buff.c"
 $4 = $5; //@line 69 "HyMES/buff.c"
 $6 = $2; //@line 71 "HyMES/buff.c"
 $7 = $4; //@line 71 "HyMES/buff.c"
 $8 = ((($7)) + 12|0); //@line 71 "HyMES/buff.c"
 HEAP32[$8>>2] = $6; //@line 71 "HyMES/buff.c"
 $9 = $3; //@line 72 "HyMES/buff.c"
 $10 = $4; //@line 72 "HyMES/buff.c"
 $11 = ((($10)) + 16|0); //@line 72 "HyMES/buff.c"
 HEAP32[$11>>2] = $9; //@line 72 "HyMES/buff.c"
 $12 = $3; //@line 74 "HyMES/buff.c"
 $13 = (($12) - 1)|0; //@line 74 "HyMES/buff.c"
 $14 = (($13|0) / 8)&-1; //@line 74 "HyMES/buff.c"
 $15 = $4; //@line 74 "HyMES/buff.c"
 $16 = ((($15)) + 20|0); //@line 74 "HyMES/buff.c"
 HEAP32[$16>>2] = $14; //@line 74 "HyMES/buff.c"
 $17 = $3; //@line 76 "HyMES/buff.c"
 $18 = (0 - ($17))|0; //@line 76 "HyMES/buff.c"
 $19 = $18 & 7; //@line 76 "HyMES/buff.c"
 $20 = ($19|0)==(32); //@line 76 "HyMES/buff.c"
 if ($20) {
  $26 = 0;
 } else {
  $21 = $3; //@line 76 "HyMES/buff.c"
  $22 = (0 - ($21))|0; //@line 76 "HyMES/buff.c"
  $23 = $22 & 7; //@line 76 "HyMES/buff.c"
  $24 = -1 << $23; //@line 76 "HyMES/buff.c"
  $26 = $24;
 }
 $25 = $26&255; //@line 76 "HyMES/buff.c"
 $27 = $4; //@line 76 "HyMES/buff.c"
 $28 = ((($27)) + 8|0); //@line 76 "HyMES/buff.c"
 HEAP8[$28>>0] = $25; //@line 76 "HyMES/buff.c"
 $29 = $4; //@line 78 "HyMES/buff.c"
 $30 = ((($29)) + 24|0); //@line 78 "HyMES/buff.c"
 HEAP32[$30>>2] = -1; //@line 78 "HyMES/buff.c"
 $31 = $4; //@line 79 "HyMES/buff.c"
 $32 = ((($31)) + 4|0); //@line 79 "HyMES/buff.c"
 HEAP32[$32>>2] = 0; //@line 79 "HyMES/buff.c"
 $33 = $4; //@line 80 "HyMES/buff.c"
 HEAP32[$33>>2] = 32; //@line 80 "HyMES/buff.c"
 $34 = $4; //@line 81 "HyMES/buff.c"
 $35 = ((($34)) + 28|0); //@line 81 "HyMES/buff.c"
 HEAP32[$35>>2] = 0; //@line 81 "HyMES/buff.c"
 $36 = $4; //@line 83 "HyMES/buff.c"
 STACKTOP = sp;return ($36|0); //@line 83 "HyMES/buff.c"
}
function _bfill($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = 0; //@line 90 "HyMES/buff.c"
 while(1) {
  $3 = $2; //@line 90 "HyMES/buff.c"
  $4 = ($3>>>0)<(32); //@line 90 "HyMES/buff.c"
  $5 = $1; //@line 91 "HyMES/buff.c"
  if (!($4)) {
   break;
  }
  $6 = ((($5)) + 4|0); //@line 91 "HyMES/buff.c"
  $7 = HEAP32[$6>>2]|0; //@line 91 "HyMES/buff.c"
  $8 = $7 << 8; //@line 91 "HyMES/buff.c"
  HEAP32[$6>>2] = $8; //@line 91 "HyMES/buff.c"
  $9 = $1; //@line 92 "HyMES/buff.c"
  $10 = (_bread_getchar($9)|0); //@line 92 "HyMES/buff.c"
  $11 = $10&255; //@line 92 "HyMES/buff.c"
  $12 = $1; //@line 92 "HyMES/buff.c"
  $13 = ((($12)) + 4|0); //@line 92 "HyMES/buff.c"
  $14 = HEAP32[$13>>2]|0; //@line 92 "HyMES/buff.c"
  $15 = $14 ^ $11; //@line 92 "HyMES/buff.c"
  HEAP32[$13>>2] = $15; //@line 92 "HyMES/buff.c"
  $16 = $2; //@line 90 "HyMES/buff.c"
  $17 = (($16) + 8)|0; //@line 90 "HyMES/buff.c"
  $2 = $17; //@line 90 "HyMES/buff.c"
 }
 HEAP32[$5>>2] = 32; //@line 94 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 95 "HyMES/buff.c"
}
function _bflush($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = 24; //@line 101 "HyMES/buff.c"
 while(1) {
  $3 = $2; //@line 101 "HyMES/buff.c"
  $4 = ($3|0)>=(0); //@line 101 "HyMES/buff.c"
  $5 = $1; //@line 102 "HyMES/buff.c"
  $6 = ((($5)) + 4|0); //@line 102 "HyMES/buff.c"
  if (!($4)) {
   break;
  }
  $7 = HEAP32[$6>>2]|0; //@line 102 "HyMES/buff.c"
  $8 = $2; //@line 102 "HyMES/buff.c"
  $9 = $7 >>> $8; //@line 102 "HyMES/buff.c"
  $10 = $9&255; //@line 102 "HyMES/buff.c"
  $11 = $1; //@line 102 "HyMES/buff.c"
  _bwrite_putchar($10,$11); //@line 102 "HyMES/buff.c"
  $12 = $2; //@line 101 "HyMES/buff.c"
  $13 = (($12) - 8)|0; //@line 101 "HyMES/buff.c"
  $2 = $13; //@line 101 "HyMES/buff.c"
 }
 HEAP32[$6>>2] = 0; //@line 103 "HyMES/buff.c"
 $14 = $1; //@line 104 "HyMES/buff.c"
 HEAP32[$14>>2] = 32; //@line 104 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 105 "HyMES/buff.c"
}
function _bflush_partiel($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0;
 var $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0;
 var $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0;
 var $64 = 0, $65 = 0, $66 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = 24; //@line 110 "HyMES/buff.c"
 while(1) {
  $3 = $2; //@line 110 "HyMES/buff.c"
  $4 = $1; //@line 110 "HyMES/buff.c"
  $5 = HEAP32[$4>>2]|0; //@line 110 "HyMES/buff.c"
  $6 = ($3|0)>=($5|0); //@line 110 "HyMES/buff.c"
  if (!($6)) {
   break;
  }
  $7 = $1; //@line 111 "HyMES/buff.c"
  $8 = ((($7)) + 4|0); //@line 111 "HyMES/buff.c"
  $9 = HEAP32[$8>>2]|0; //@line 111 "HyMES/buff.c"
  $10 = $2; //@line 111 "HyMES/buff.c"
  $11 = $9 >>> $10; //@line 111 "HyMES/buff.c"
  $12 = $11&255; //@line 111 "HyMES/buff.c"
  $13 = $1; //@line 111 "HyMES/buff.c"
  _bwrite_putchar($12,$13); //@line 111 "HyMES/buff.c"
  $14 = $2; //@line 110 "HyMES/buff.c"
  $15 = (($14) - 8)|0; //@line 110 "HyMES/buff.c"
  $2 = $15; //@line 110 "HyMES/buff.c"
 }
 $16 = $2; //@line 112 "HyMES/buff.c"
 $17 = $1; //@line 112 "HyMES/buff.c"
 $18 = HEAP32[$17>>2]|0; //@line 112 "HyMES/buff.c"
 $19 = (($18) - ($16))|0; //@line 112 "HyMES/buff.c"
 HEAP32[$17>>2] = $19; //@line 112 "HyMES/buff.c"
 $20 = $1; //@line 114 "HyMES/buff.c"
 $21 = HEAP32[$20>>2]|0; //@line 114 "HyMES/buff.c"
 $22 = ($21|0)<(8); //@line 114 "HyMES/buff.c"
 if (!($22)) {
  $64 = $1; //@line 130 "HyMES/buff.c"
  $65 = ((($64)) + 4|0); //@line 130 "HyMES/buff.c"
  HEAP32[$65>>2] = 0; //@line 130 "HyMES/buff.c"
  $66 = $1; //@line 131 "HyMES/buff.c"
  HEAP32[$66>>2] = 32; //@line 131 "HyMES/buff.c"
  STACKTOP = sp;return; //@line 132 "HyMES/buff.c"
 }
 $23 = $2; //@line 117 "HyMES/buff.c"
 $24 = $1; //@line 117 "HyMES/buff.c"
 $25 = ((($24)) + 4|0); //@line 117 "HyMES/buff.c"
 $26 = HEAP32[$25>>2]|0; //@line 117 "HyMES/buff.c"
 $27 = $26 >>> $23; //@line 117 "HyMES/buff.c"
 HEAP32[$25>>2] = $27; //@line 117 "HyMES/buff.c"
 $28 = $1; //@line 119 "HyMES/buff.c"
 $29 = HEAP32[$28>>2]|0; //@line 119 "HyMES/buff.c"
 $30 = ($29|0)==(32); //@line 119 "HyMES/buff.c"
 if ($30) {
  $38 = 0;
 } else {
  $31 = $1; //@line 119 "HyMES/buff.c"
  $32 = HEAP32[$31>>2]|0; //@line 119 "HyMES/buff.c"
  $33 = -1 << $32; //@line 119 "HyMES/buff.c"
  $38 = $33;
 }
 $34 = $1; //@line 119 "HyMES/buff.c"
 $35 = ((($34)) + 4|0); //@line 119 "HyMES/buff.c"
 $36 = HEAP32[$35>>2]|0; //@line 119 "HyMES/buff.c"
 $37 = $36 & $38; //@line 119 "HyMES/buff.c"
 HEAP32[$35>>2] = $37; //@line 119 "HyMES/buff.c"
 $39 = $1; //@line 125 "HyMES/buff.c"
 $40 = (_bread_getchar($39)|0); //@line 125 "HyMES/buff.c"
 $41 = $40&255; //@line 125 "HyMES/buff.c"
 $42 = $1; //@line 125 "HyMES/buff.c"
 $43 = HEAP32[$42>>2]|0; //@line 125 "HyMES/buff.c"
 $44 = ($43|0)!=(0); //@line 125 "HyMES/buff.c"
 if ($44) {
  $45 = $1; //@line 125 "HyMES/buff.c"
  $46 = HEAP32[$45>>2]|0; //@line 125 "HyMES/buff.c"
  $47 = 1 << $46; //@line 125 "HyMES/buff.c"
  $48 = (($47) - 1)|0; //@line 125 "HyMES/buff.c"
  $50 = $48;
 } else {
  $50 = 0;
 }
 $49 = $41 & $50; //@line 125 "HyMES/buff.c"
 $51 = $1; //@line 125 "HyMES/buff.c"
 $52 = ((($51)) + 4|0); //@line 125 "HyMES/buff.c"
 $53 = HEAP32[$52>>2]|0; //@line 125 "HyMES/buff.c"
 $54 = $53 ^ $49; //@line 125 "HyMES/buff.c"
 HEAP32[$52>>2] = $54; //@line 125 "HyMES/buff.c"
 $55 = $1; //@line 127 "HyMES/buff.c"
 $56 = ((($55)) + 24|0); //@line 127 "HyMES/buff.c"
 $57 = HEAP32[$56>>2]|0; //@line 127 "HyMES/buff.c"
 $58 = (($57) + -1)|0; //@line 127 "HyMES/buff.c"
 HEAP32[$56>>2] = $58; //@line 127 "HyMES/buff.c"
 $59 = $1; //@line 128 "HyMES/buff.c"
 $60 = ((($59)) + 4|0); //@line 128 "HyMES/buff.c"
 $61 = HEAP32[$60>>2]|0; //@line 128 "HyMES/buff.c"
 $62 = $61&255; //@line 128 "HyMES/buff.c"
 $63 = $1; //@line 128 "HyMES/buff.c"
 _bwrite_putchar($62,$63); //@line 128 "HyMES/buff.c"
 $64 = $1; //@line 130 "HyMES/buff.c"
 $65 = ((($64)) + 4|0); //@line 130 "HyMES/buff.c"
 HEAP32[$65>>2] = 0; //@line 130 "HyMES/buff.c"
 $66 = $1; //@line 131 "HyMES/buff.c"
 HEAP32[$66>>2] = 32; //@line 131 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 132 "HyMES/buff.c"
}
function _breadclose($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1; //@line 135 "HyMES/buff.c"
 _free($2); //@line 135 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 136 "HyMES/buff.c"
}
function _bwriteclose($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1; //@line 139 "HyMES/buff.c"
 _bflush_partiel($2); //@line 139 "HyMES/buff.c"
 $3 = $1; //@line 140 "HyMES/buff.c"
 _free($3); //@line 140 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 141 "HyMES/buff.c"
}
function _bread_unlocked($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1; //@line 161 "HyMES/buff.c"
 $3 = ((($2)) + 16|0); //@line 161 "HyMES/buff.c"
 $4 = HEAP32[$3>>2]|0; //@line 161 "HyMES/buff.c"
 $5 = $1; //@line 161 "HyMES/buff.c"
 $6 = ((($5)) + 28|0); //@line 161 "HyMES/buff.c"
 $7 = HEAP32[$6>>2]|0; //@line 161 "HyMES/buff.c"
 $8 = (($4) - ($7))|0; //@line 161 "HyMES/buff.c"
 STACKTOP = sp;return ($8|0); //@line 161 "HyMES/buff.c"
}
function _bwrite_unlocked($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1; //@line 166 "HyMES/buff.c"
 $3 = ((($2)) + 16|0); //@line 166 "HyMES/buff.c"
 $4 = HEAP32[$3>>2]|0; //@line 166 "HyMES/buff.c"
 $5 = $1; //@line 166 "HyMES/buff.c"
 $6 = ((($5)) + 28|0); //@line 166 "HyMES/buff.c"
 $7 = HEAP32[$6>>2]|0; //@line 166 "HyMES/buff.c"
 $8 = (($4) - ($7))|0; //@line 166 "HyMES/buff.c"
 STACKTOP = sp;return ($8|0); //@line 166 "HyMES/buff.c"
}
function _bread_position($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1; //@line 170 "HyMES/buff.c"
 $3 = ((($2)) + 24|0); //@line 170 "HyMES/buff.c"
 $4 = HEAP32[$3>>2]|0; //@line 170 "HyMES/buff.c"
 $5 = (($4) + 1)|0; //@line 170 "HyMES/buff.c"
 $6 = $5<<3; //@line 170 "HyMES/buff.c"
 $7 = $1; //@line 170 "HyMES/buff.c"
 $8 = HEAP32[$7>>2]|0; //@line 170 "HyMES/buff.c"
 $9 = (($6) - ($8))|0; //@line 170 "HyMES/buff.c"
 STACKTOP = sp;return ($9|0); //@line 170 "HyMES/buff.c"
}
function _bread_changer_position($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3; //@line 175 "HyMES/buff.c"
 $5 = (($4|0) / 8)&-1; //@line 175 "HyMES/buff.c"
 $6 = (($5) - 1)|0; //@line 175 "HyMES/buff.c"
 $7 = $2; //@line 175 "HyMES/buff.c"
 $8 = ((($7)) + 24|0); //@line 175 "HyMES/buff.c"
 HEAP32[$8>>2] = $6; //@line 175 "HyMES/buff.c"
 $9 = $2; //@line 177 "HyMES/buff.c"
 $10 = (_bread_getchar($9)|0); //@line 177 "HyMES/buff.c"
 $11 = $10&255; //@line 177 "HyMES/buff.c"
 $12 = $2; //@line 177 "HyMES/buff.c"
 $13 = ((($12)) + 4|0); //@line 177 "HyMES/buff.c"
 HEAP32[$13>>2] = $11; //@line 177 "HyMES/buff.c"
 $14 = $3; //@line 179 "HyMES/buff.c"
 $15 = (($14|0) % 8)&-1; //@line 179 "HyMES/buff.c"
 $16 = (8 - ($15))|0; //@line 179 "HyMES/buff.c"
 $17 = $2; //@line 179 "HyMES/buff.c"
 HEAP32[$17>>2] = $16; //@line 179 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 180 "HyMES/buff.c"
}
function _bread_decaler_fin($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3; //@line 184 "HyMES/buff.c"
 $5 = $2; //@line 184 "HyMES/buff.c"
 $6 = ((($5)) + 16|0); //@line 184 "HyMES/buff.c"
 $7 = HEAP32[$6>>2]|0; //@line 184 "HyMES/buff.c"
 $8 = (($7) + ($4))|0; //@line 184 "HyMES/buff.c"
 HEAP32[$6>>2] = $8; //@line 184 "HyMES/buff.c"
 $9 = $2; //@line 185 "HyMES/buff.c"
 $10 = ((($9)) + 16|0); //@line 185 "HyMES/buff.c"
 $11 = HEAP32[$10>>2]|0; //@line 185 "HyMES/buff.c"
 $12 = (($11) - 1)|0; //@line 185 "HyMES/buff.c"
 $13 = (($12|0) / 8)&-1; //@line 185 "HyMES/buff.c"
 $14 = $2; //@line 185 "HyMES/buff.c"
 $15 = ((($14)) + 20|0); //@line 185 "HyMES/buff.c"
 HEAP32[$15>>2] = $13; //@line 185 "HyMES/buff.c"
 $16 = $2; //@line 186 "HyMES/buff.c"
 $17 = ((($16)) + 16|0); //@line 186 "HyMES/buff.c"
 $18 = HEAP32[$17>>2]|0; //@line 186 "HyMES/buff.c"
 $19 = (0 - ($18))|0; //@line 186 "HyMES/buff.c"
 $20 = $19 & 7; //@line 186 "HyMES/buff.c"
 $21 = ($20|0)==(32); //@line 186 "HyMES/buff.c"
 if ($21) {
  $29 = 0;
 } else {
  $22 = $2; //@line 186 "HyMES/buff.c"
  $23 = ((($22)) + 16|0); //@line 186 "HyMES/buff.c"
  $24 = HEAP32[$23>>2]|0; //@line 186 "HyMES/buff.c"
  $25 = (0 - ($24))|0; //@line 186 "HyMES/buff.c"
  $26 = $25 & 7; //@line 186 "HyMES/buff.c"
  $27 = -1 << $26; //@line 186 "HyMES/buff.c"
  $29 = $27;
 }
 $28 = $29&255; //@line 186 "HyMES/buff.c"
 $30 = $2; //@line 186 "HyMES/buff.c"
 $31 = ((($30)) + 8|0); //@line 186 "HyMES/buff.c"
 HEAP8[$31>>0] = $28; //@line 186 "HyMES/buff.c"
 $32 = $2; //@line 187 "HyMES/buff.c"
 $33 = $2; //@line 187 "HyMES/buff.c"
 $34 = (_bread_position($33)|0); //@line 187 "HyMES/buff.c"
 _bread_changer_position($32,$34); //@line 187 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 188 "HyMES/buff.c"
}
function _bwrite_changer_position($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $2; //@line 195 "HyMES/buff.c"
 _bflush_partiel($4); //@line 195 "HyMES/buff.c"
 $5 = $3; //@line 198 "HyMES/buff.c"
 $6 = (($5|0) / 8)&-1; //@line 198 "HyMES/buff.c"
 $7 = (($6) - 1)|0; //@line 198 "HyMES/buff.c"
 $8 = $2; //@line 198 "HyMES/buff.c"
 $9 = ((($8)) + 24|0); //@line 198 "HyMES/buff.c"
 HEAP32[$9>>2] = $7; //@line 198 "HyMES/buff.c"
 $10 = $3; //@line 200 "HyMES/buff.c"
 $11 = (($10|0) % 8)&-1; //@line 200 "HyMES/buff.c"
 $12 = (32 - ($11))|0; //@line 200 "HyMES/buff.c"
 $13 = $2; //@line 200 "HyMES/buff.c"
 HEAP32[$13>>2] = $12; //@line 200 "HyMES/buff.c"
 $14 = $3; //@line 201 "HyMES/buff.c"
 $15 = (($14|0) % 8)&-1; //@line 201 "HyMES/buff.c"
 $16 = ($15|0)==(0); //@line 201 "HyMES/buff.c"
 if ($16) {
  $17 = $2; //@line 202 "HyMES/buff.c"
  $18 = ((($17)) + 4|0); //@line 202 "HyMES/buff.c"
  HEAP32[$18>>2] = 0; //@line 202 "HyMES/buff.c"
  STACKTOP = sp;return; //@line 209 "HyMES/buff.c"
 }
 $19 = $3; //@line 205 "HyMES/buff.c"
 $20 = (($19|0) / 8)&-1; //@line 205 "HyMES/buff.c"
 $21 = $2; //@line 205 "HyMES/buff.c"
 $22 = ((($21)) + 12|0); //@line 205 "HyMES/buff.c"
 $23 = HEAP32[$22>>2]|0; //@line 205 "HyMES/buff.c"
 $24 = (($23) + ($20)|0); //@line 205 "HyMES/buff.c"
 $25 = HEAP8[$24>>0]|0; //@line 205 "HyMES/buff.c"
 $26 = $25&255; //@line 205 "HyMES/buff.c"
 $27 = $26 << 24; //@line 205 "HyMES/buff.c"
 $28 = $2; //@line 205 "HyMES/buff.c"
 $29 = ((($28)) + 4|0); //@line 205 "HyMES/buff.c"
 HEAP32[$29>>2] = $27; //@line 205 "HyMES/buff.c"
 $30 = $2; //@line 207 "HyMES/buff.c"
 $31 = HEAP32[$30>>2]|0; //@line 207 "HyMES/buff.c"
 $32 = ($31|0)==(32); //@line 207 "HyMES/buff.c"
 if ($32) {
  $40 = 0;
 } else {
  $33 = $2; //@line 207 "HyMES/buff.c"
  $34 = HEAP32[$33>>2]|0; //@line 207 "HyMES/buff.c"
  $35 = -1 << $34; //@line 207 "HyMES/buff.c"
  $40 = $35;
 }
 $36 = $2; //@line 207 "HyMES/buff.c"
 $37 = ((($36)) + 4|0); //@line 207 "HyMES/buff.c"
 $38 = HEAP32[$37>>2]|0; //@line 207 "HyMES/buff.c"
 $39 = $38 & $40; //@line 207 "HyMES/buff.c"
 HEAP32[$37>>2] = $39; //@line 207 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 209 "HyMES/buff.c"
}
function _bwrite_decaler_fin($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3; //@line 213 "HyMES/buff.c"
 $5 = $2; //@line 213 "HyMES/buff.c"
 $6 = ((($5)) + 16|0); //@line 213 "HyMES/buff.c"
 $7 = HEAP32[$6>>2]|0; //@line 213 "HyMES/buff.c"
 $8 = (($7) + ($4))|0; //@line 213 "HyMES/buff.c"
 HEAP32[$6>>2] = $8; //@line 213 "HyMES/buff.c"
 $9 = $2; //@line 214 "HyMES/buff.c"
 $10 = ((($9)) + 16|0); //@line 214 "HyMES/buff.c"
 $11 = HEAP32[$10>>2]|0; //@line 214 "HyMES/buff.c"
 $12 = (($11) - 1)|0; //@line 214 "HyMES/buff.c"
 $13 = (($12|0) / 8)&-1; //@line 214 "HyMES/buff.c"
 $14 = $2; //@line 214 "HyMES/buff.c"
 $15 = ((($14)) + 20|0); //@line 214 "HyMES/buff.c"
 HEAP32[$15>>2] = $13; //@line 214 "HyMES/buff.c"
 $16 = $2; //@line 215 "HyMES/buff.c"
 $17 = ((($16)) + 16|0); //@line 215 "HyMES/buff.c"
 $18 = HEAP32[$17>>2]|0; //@line 215 "HyMES/buff.c"
 $19 = (0 - ($18))|0; //@line 215 "HyMES/buff.c"
 $20 = $19 & 7; //@line 215 "HyMES/buff.c"
 $21 = ($20|0)==(32); //@line 215 "HyMES/buff.c"
 if ($21) {
  $29 = 0;
  $28 = $29&255; //@line 215 "HyMES/buff.c"
  $30 = $2; //@line 215 "HyMES/buff.c"
  $31 = ((($30)) + 8|0); //@line 215 "HyMES/buff.c"
  HEAP8[$31>>0] = $28; //@line 215 "HyMES/buff.c"
  STACKTOP = sp;return; //@line 216 "HyMES/buff.c"
 }
 $22 = $2; //@line 215 "HyMES/buff.c"
 $23 = ((($22)) + 16|0); //@line 215 "HyMES/buff.c"
 $24 = HEAP32[$23>>2]|0; //@line 215 "HyMES/buff.c"
 $25 = (0 - ($24))|0; //@line 215 "HyMES/buff.c"
 $26 = $25 & 7; //@line 215 "HyMES/buff.c"
 $27 = -1 << $26; //@line 215 "HyMES/buff.c"
 $29 = $27;
 $28 = $29&255; //@line 215 "HyMES/buff.c"
 $30 = $2; //@line 215 "HyMES/buff.c"
 $31 = ((($30)) + 8|0); //@line 215 "HyMES/buff.c"
 HEAP8[$31>>0] = $28; //@line 215 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 216 "HyMES/buff.c"
}
function _bread($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0;
 var $47 = 0, $48 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = 0; //@line 220 "HyMES/buff.c"
 $5 = $3; //@line 222 "HyMES/buff.c"
 $6 = HEAP32[$5>>2]|0; //@line 222 "HyMES/buff.c"
 $7 = $2; //@line 222 "HyMES/buff.c"
 $8 = ($6|0)<($7|0); //@line 222 "HyMES/buff.c"
 if ($8) {
  $9 = $3; //@line 223 "HyMES/buff.c"
  $10 = ((($9)) + 4|0); //@line 223 "HyMES/buff.c"
  $11 = HEAP32[$10>>2]|0; //@line 223 "HyMES/buff.c"
  $12 = $3; //@line 223 "HyMES/buff.c"
  $13 = HEAP32[$12>>2]|0; //@line 223 "HyMES/buff.c"
  $14 = ($13|0)!=(0); //@line 223 "HyMES/buff.c"
  if ($14) {
   $15 = $3; //@line 223 "HyMES/buff.c"
   $16 = HEAP32[$15>>2]|0; //@line 223 "HyMES/buff.c"
   $17 = 1 << $16; //@line 223 "HyMES/buff.c"
   $18 = (($17) - 1)|0; //@line 223 "HyMES/buff.c"
   $20 = $18;
  } else {
   $20 = 0;
  }
  $19 = $11 & $20; //@line 223 "HyMES/buff.c"
  $4 = $19; //@line 223 "HyMES/buff.c"
  $21 = $3; //@line 224 "HyMES/buff.c"
  $22 = HEAP32[$21>>2]|0; //@line 224 "HyMES/buff.c"
  $23 = $2; //@line 224 "HyMES/buff.c"
  $24 = (($23) - ($22))|0; //@line 224 "HyMES/buff.c"
  $2 = $24; //@line 224 "HyMES/buff.c"
  $25 = $2; //@line 225 "HyMES/buff.c"
  $26 = $4; //@line 225 "HyMES/buff.c"
  $27 = $26 << $25; //@line 225 "HyMES/buff.c"
  $4 = $27; //@line 225 "HyMES/buff.c"
  $28 = $3; //@line 226 "HyMES/buff.c"
  _bfill($28); //@line 226 "HyMES/buff.c"
 }
 $29 = $2; //@line 228 "HyMES/buff.c"
 $30 = $3; //@line 228 "HyMES/buff.c"
 $31 = HEAP32[$30>>2]|0; //@line 228 "HyMES/buff.c"
 $32 = (($31) - ($29))|0; //@line 228 "HyMES/buff.c"
 HEAP32[$30>>2] = $32; //@line 228 "HyMES/buff.c"
 $33 = $3; //@line 229 "HyMES/buff.c"
 $34 = ((($33)) + 4|0); //@line 229 "HyMES/buff.c"
 $35 = HEAP32[$34>>2]|0; //@line 229 "HyMES/buff.c"
 $36 = $3; //@line 229 "HyMES/buff.c"
 $37 = HEAP32[$36>>2]|0; //@line 229 "HyMES/buff.c"
 $38 = $35 >>> $37; //@line 229 "HyMES/buff.c"
 $39 = $2; //@line 229 "HyMES/buff.c"
 $40 = ($39|0)!=(0); //@line 229 "HyMES/buff.c"
 if (!($40)) {
  $45 = 0;
  $44 = $38 & $45; //@line 229 "HyMES/buff.c"
  $46 = $4; //@line 229 "HyMES/buff.c"
  $47 = $46 ^ $44; //@line 229 "HyMES/buff.c"
  $4 = $47; //@line 229 "HyMES/buff.c"
  $48 = $4; //@line 231 "HyMES/buff.c"
  STACKTOP = sp;return ($48|0); //@line 231 "HyMES/buff.c"
 }
 $41 = $2; //@line 229 "HyMES/buff.c"
 $42 = 1 << $41; //@line 229 "HyMES/buff.c"
 $43 = (($42) - 1)|0; //@line 229 "HyMES/buff.c"
 $45 = $43;
 $44 = $38 & $45; //@line 229 "HyMES/buff.c"
 $46 = $4; //@line 229 "HyMES/buff.c"
 $47 = $46 ^ $44; //@line 229 "HyMES/buff.c"
 $4 = $47; //@line 229 "HyMES/buff.c"
 $48 = $4; //@line 231 "HyMES/buff.c"
 STACKTOP = sp;return ($48|0); //@line 231 "HyMES/buff.c"
}
function _bread_lock($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3; //@line 235 "HyMES/buff.c"
 $5 = ((($4)) + 24|0); //@line 235 "HyMES/buff.c"
 $6 = HEAP32[$5>>2]|0; //@line 235 "HyMES/buff.c"
 $7 = (($6) + 1)|0; //@line 235 "HyMES/buff.c"
 $8 = $7<<3; //@line 235 "HyMES/buff.c"
 $9 = $3; //@line 235 "HyMES/buff.c"
 $10 = HEAP32[$9>>2]|0; //@line 235 "HyMES/buff.c"
 $11 = (($8) - ($10))|0; //@line 235 "HyMES/buff.c"
 $12 = $2; //@line 235 "HyMES/buff.c"
 $13 = (($11) + ($12))|0; //@line 235 "HyMES/buff.c"
 $14 = $3; //@line 235 "HyMES/buff.c"
 $15 = ((($14)) + 28|0); //@line 235 "HyMES/buff.c"
 HEAP32[$15>>2] = $13; //@line 235 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 236 "HyMES/buff.c"
}
function _bwrite_lock($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3; //@line 239 "HyMES/buff.c"
 $5 = ((($4)) + 24|0); //@line 239 "HyMES/buff.c"
 $6 = HEAP32[$5>>2]|0; //@line 239 "HyMES/buff.c"
 $7 = (($6) + 1)|0; //@line 239 "HyMES/buff.c"
 $8 = $7<<3; //@line 239 "HyMES/buff.c"
 $9 = (($8) + 32)|0; //@line 239 "HyMES/buff.c"
 $10 = $3; //@line 239 "HyMES/buff.c"
 $11 = HEAP32[$10>>2]|0; //@line 239 "HyMES/buff.c"
 $12 = (($9) - ($11))|0; //@line 239 "HyMES/buff.c"
 $13 = $2; //@line 239 "HyMES/buff.c"
 $14 = (($12) + ($13))|0; //@line 239 "HyMES/buff.c"
 $15 = $3; //@line 239 "HyMES/buff.c"
 $16 = ((($15)) + 28|0); //@line 239 "HyMES/buff.c"
 HEAP32[$16>>2] = $14; //@line 239 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 240 "HyMES/buff.c"
}
function _blook($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = 0; //@line 245 "HyMES/buff.c"
 while(1) {
  $5 = $3; //@line 247 "HyMES/buff.c"
  $6 = HEAP32[$5>>2]|0; //@line 247 "HyMES/buff.c"
  $7 = $2; //@line 247 "HyMES/buff.c"
  $8 = ($6|0)<($7|0); //@line 247 "HyMES/buff.c"
  $9 = $3; //@line 248 "HyMES/buff.c"
  $10 = ((($9)) + 4|0); //@line 248 "HyMES/buff.c"
  $11 = HEAP32[$10>>2]|0; //@line 248 "HyMES/buff.c"
  if (!($8)) {
   break;
  }
  $12 = $11 << 8; //@line 248 "HyMES/buff.c"
  HEAP32[$10>>2] = $12; //@line 248 "HyMES/buff.c"
  $13 = $3; //@line 249 "HyMES/buff.c"
  $14 = (_bread_getchar($13)|0); //@line 249 "HyMES/buff.c"
  $15 = $14&255; //@line 249 "HyMES/buff.c"
  $16 = $3; //@line 249 "HyMES/buff.c"
  $17 = ((($16)) + 4|0); //@line 249 "HyMES/buff.c"
  $18 = HEAP32[$17>>2]|0; //@line 249 "HyMES/buff.c"
  $19 = $18 ^ $15; //@line 249 "HyMES/buff.c"
  HEAP32[$17>>2] = $19; //@line 249 "HyMES/buff.c"
  $20 = $3; //@line 250 "HyMES/buff.c"
  $21 = HEAP32[$20>>2]|0; //@line 250 "HyMES/buff.c"
  $22 = (($21) + 8)|0; //@line 250 "HyMES/buff.c"
  HEAP32[$20>>2] = $22; //@line 250 "HyMES/buff.c"
 }
 $23 = $3; //@line 252 "HyMES/buff.c"
 $24 = HEAP32[$23>>2]|0; //@line 252 "HyMES/buff.c"
 $25 = $2; //@line 252 "HyMES/buff.c"
 $26 = (($24) - ($25))|0; //@line 252 "HyMES/buff.c"
 $27 = $11 >>> $26; //@line 252 "HyMES/buff.c"
 $28 = $2; //@line 252 "HyMES/buff.c"
 $29 = ($28|0)!=(0); //@line 252 "HyMES/buff.c"
 if (!($29)) {
  $34 = 0;
  $33 = $27 & $34; //@line 252 "HyMES/buff.c"
  $35 = $4; //@line 252 "HyMES/buff.c"
  $36 = $35 ^ $33; //@line 252 "HyMES/buff.c"
  $4 = $36; //@line 252 "HyMES/buff.c"
  $37 = $4; //@line 254 "HyMES/buff.c"
  STACKTOP = sp;return ($37|0); //@line 254 "HyMES/buff.c"
 }
 $30 = $2; //@line 252 "HyMES/buff.c"
 $31 = 1 << $30; //@line 252 "HyMES/buff.c"
 $32 = (($31) - 1)|0; //@line 252 "HyMES/buff.c"
 $34 = $32;
 $33 = $27 & $34; //@line 252 "HyMES/buff.c"
 $35 = $4; //@line 252 "HyMES/buff.c"
 $36 = $35 ^ $33; //@line 252 "HyMES/buff.c"
 $4 = $36; //@line 252 "HyMES/buff.c"
 $37 = $4; //@line 254 "HyMES/buff.c"
 STACKTOP = sp;return ($37|0); //@line 254 "HyMES/buff.c"
}
function _bstep($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3; //@line 259 "HyMES/buff.c"
 $5 = HEAP32[$4>>2]|0; //@line 259 "HyMES/buff.c"
 $6 = $2; //@line 259 "HyMES/buff.c"
 $7 = ($5|0)<($6|0); //@line 259 "HyMES/buff.c"
 if ($7) {
  $8 = $3; //@line 260 "HyMES/buff.c"
  $9 = HEAP32[$8>>2]|0; //@line 260 "HyMES/buff.c"
  $10 = $2; //@line 260 "HyMES/buff.c"
  $11 = (($10) - ($9))|0; //@line 260 "HyMES/buff.c"
  $2 = $11; //@line 260 "HyMES/buff.c"
  $12 = $3; //@line 261 "HyMES/buff.c"
  _bfill($12); //@line 261 "HyMES/buff.c"
 }
 $13 = $2; //@line 263 "HyMES/buff.c"
 $14 = $3; //@line 263 "HyMES/buff.c"
 $15 = HEAP32[$14>>2]|0; //@line 263 "HyMES/buff.c"
 $16 = (($15) - ($13))|0; //@line 263 "HyMES/buff.c"
 HEAP32[$14>>2] = $16; //@line 263 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 264 "HyMES/buff.c"
}
function _bwrite($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5; //@line 275 "HyMES/buff.c"
 $7 = HEAP32[$6>>2]|0; //@line 275 "HyMES/buff.c"
 $8 = $4; //@line 275 "HyMES/buff.c"
 $9 = ($7|0)<($8|0); //@line 275 "HyMES/buff.c"
 if ($9) {
  $10 = $5; //@line 276 "HyMES/buff.c"
  $11 = HEAP32[$10>>2]|0; //@line 276 "HyMES/buff.c"
  $12 = $4; //@line 276 "HyMES/buff.c"
  $13 = (($12) - ($11))|0; //@line 276 "HyMES/buff.c"
  $4 = $13; //@line 276 "HyMES/buff.c"
  $14 = $3; //@line 277 "HyMES/buff.c"
  $15 = $4; //@line 277 "HyMES/buff.c"
  $16 = $14 >>> $15; //@line 277 "HyMES/buff.c"
  $17 = $5; //@line 277 "HyMES/buff.c"
  $18 = ((($17)) + 4|0); //@line 277 "HyMES/buff.c"
  $19 = HEAP32[$18>>2]|0; //@line 277 "HyMES/buff.c"
  $20 = $19 ^ $16; //@line 277 "HyMES/buff.c"
  HEAP32[$18>>2] = $20; //@line 277 "HyMES/buff.c"
  $21 = $5; //@line 278 "HyMES/buff.c"
  _bflush($21); //@line 278 "HyMES/buff.c"
  $22 = $4; //@line 279 "HyMES/buff.c"
  $23 = ($22|0)!=(0); //@line 279 "HyMES/buff.c"
  if ($23) {
   $24 = $4; //@line 279 "HyMES/buff.c"
   $25 = 1 << $24; //@line 279 "HyMES/buff.c"
   $26 = (($25) - 1)|0; //@line 279 "HyMES/buff.c"
   $29 = $26;
  } else {
   $29 = 0;
  }
  $27 = $3; //@line 279 "HyMES/buff.c"
  $28 = $27 & $29; //@line 279 "HyMES/buff.c"
  $3 = $28; //@line 279 "HyMES/buff.c"
 }
 $30 = $4; //@line 282 "HyMES/buff.c"
 $31 = $5; //@line 282 "HyMES/buff.c"
 $32 = HEAP32[$31>>2]|0; //@line 282 "HyMES/buff.c"
 $33 = (($32) - ($30))|0; //@line 282 "HyMES/buff.c"
 HEAP32[$31>>2] = $33; //@line 282 "HyMES/buff.c"
 $34 = $3; //@line 283 "HyMES/buff.c"
 $35 = $5; //@line 283 "HyMES/buff.c"
 $36 = HEAP32[$35>>2]|0; //@line 283 "HyMES/buff.c"
 $37 = $34 << $36; //@line 283 "HyMES/buff.c"
 $38 = $5; //@line 283 "HyMES/buff.c"
 $39 = ((($38)) + 4|0); //@line 283 "HyMES/buff.c"
 $40 = HEAP32[$39>>2]|0; //@line 283 "HyMES/buff.c"
 $41 = $40 ^ $37; //@line 283 "HyMES/buff.c"
 HEAP32[$39>>2] = $41; //@line 283 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 284 "HyMES/buff.c"
}
function _bwrite_bit($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3; //@line 288 "HyMES/buff.c"
 $5 = HEAP32[$4>>2]|0; //@line 288 "HyMES/buff.c"
 $6 = ($5|0)<=(0); //@line 288 "HyMES/buff.c"
 if ($6) {
  $7 = $3; //@line 289 "HyMES/buff.c"
  _bflush($7); //@line 289 "HyMES/buff.c"
 }
 $8 = $3; //@line 290 "HyMES/buff.c"
 $9 = HEAP32[$8>>2]|0; //@line 290 "HyMES/buff.c"
 $10 = (($9) + -1)|0; //@line 290 "HyMES/buff.c"
 HEAP32[$8>>2] = $10; //@line 290 "HyMES/buff.c"
 $11 = $2; //@line 291 "HyMES/buff.c"
 $12 = $3; //@line 291 "HyMES/buff.c"
 $13 = HEAP32[$12>>2]|0; //@line 291 "HyMES/buff.c"
 $14 = $11 << $13; //@line 291 "HyMES/buff.c"
 $15 = $3; //@line 291 "HyMES/buff.c"
 $16 = ((($15)) + 4|0); //@line 291 "HyMES/buff.c"
 $17 = HEAP32[$16>>2]|0; //@line 291 "HyMES/buff.c"
 $18 = $17 ^ $14; //@line 291 "HyMES/buff.c"
 HEAP32[$16>>2] = $18; //@line 291 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 292 "HyMES/buff.c"
}
function _bwrite_bits($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0;
 var $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5; //@line 296 "HyMES/buff.c"
 $7 = HEAP32[$6>>2]|0; //@line 296 "HyMES/buff.c"
 $8 = ($7|0)<=(0); //@line 296 "HyMES/buff.c"
 if ($8) {
  $9 = $5; //@line 297 "HyMES/buff.c"
  _bflush($9); //@line 297 "HyMES/buff.c"
 }
 $10 = $3; //@line 298 "HyMES/buff.c"
 $11 = ($10|0)!=(0); //@line 298 "HyMES/buff.c"
 $12 = $11 ? -1 : 0; //@line 298 "HyMES/buff.c"
 $3 = $12; //@line 298 "HyMES/buff.c"
 $13 = $4; //@line 299 "HyMES/buff.c"
 $14 = $5; //@line 299 "HyMES/buff.c"
 $15 = HEAP32[$14>>2]|0; //@line 299 "HyMES/buff.c"
 $16 = ($13|0)>($15|0); //@line 299 "HyMES/buff.c"
 L4: do {
  if ($16) {
   $17 = $3; //@line 300 "HyMES/buff.c"
   $18 = $5; //@line 300 "HyMES/buff.c"
   $19 = HEAP32[$18>>2]|0; //@line 300 "HyMES/buff.c"
   $20 = (32 - ($19))|0; //@line 300 "HyMES/buff.c"
   $21 = $17 >>> $20; //@line 300 "HyMES/buff.c"
   $22 = $5; //@line 300 "HyMES/buff.c"
   $23 = ((($22)) + 4|0); //@line 300 "HyMES/buff.c"
   $24 = HEAP32[$23>>2]|0; //@line 300 "HyMES/buff.c"
   $25 = $24 ^ $21; //@line 300 "HyMES/buff.c"
   HEAP32[$23>>2] = $25; //@line 300 "HyMES/buff.c"
   $26 = $5; //@line 301 "HyMES/buff.c"
   $27 = HEAP32[$26>>2]|0; //@line 301 "HyMES/buff.c"
   $28 = $4; //@line 301 "HyMES/buff.c"
   $29 = (($28) - ($27))|0; //@line 301 "HyMES/buff.c"
   $4 = $29; //@line 301 "HyMES/buff.c"
   $30 = $5; //@line 302 "HyMES/buff.c"
   _bflush($30); //@line 302 "HyMES/buff.c"
   while(1) {
    $31 = $4; //@line 303 "HyMES/buff.c"
    $32 = ($31>>>0)>(32); //@line 303 "HyMES/buff.c"
    if (!($32)) {
     break L4;
    }
    $33 = $3; //@line 304 "HyMES/buff.c"
    $34 = $5; //@line 304 "HyMES/buff.c"
    $35 = ((($34)) + 4|0); //@line 304 "HyMES/buff.c"
    HEAP32[$35>>2] = $33; //@line 304 "HyMES/buff.c"
    $36 = $4; //@line 305 "HyMES/buff.c"
    $37 = (($36) - 32)|0; //@line 305 "HyMES/buff.c"
    $4 = $37; //@line 305 "HyMES/buff.c"
    $38 = $5; //@line 306 "HyMES/buff.c"
    _bflush($38); //@line 306 "HyMES/buff.c"
   }
  }
 } while(0);
 $39 = $4; //@line 309 "HyMES/buff.c"
 $40 = ($39|0)>(0); //@line 309 "HyMES/buff.c"
 if (!($40)) {
  STACKTOP = sp;return; //@line 313 "HyMES/buff.c"
 }
 $41 = $4; //@line 310 "HyMES/buff.c"
 $42 = $5; //@line 310 "HyMES/buff.c"
 $43 = HEAP32[$42>>2]|0; //@line 310 "HyMES/buff.c"
 $44 = (($43) - ($41))|0; //@line 310 "HyMES/buff.c"
 HEAP32[$42>>2] = $44; //@line 310 "HyMES/buff.c"
 $45 = $3; //@line 311 "HyMES/buff.c"
 $46 = $4; //@line 311 "HyMES/buff.c"
 $47 = (32 - ($46))|0; //@line 311 "HyMES/buff.c"
 $48 = $45 >>> $47; //@line 311 "HyMES/buff.c"
 $49 = $5; //@line 311 "HyMES/buff.c"
 $50 = HEAP32[$49>>2]|0; //@line 311 "HyMES/buff.c"
 $51 = $48 << $50; //@line 311 "HyMES/buff.c"
 $52 = $5; //@line 311 "HyMES/buff.c"
 $53 = ((($52)) + 4|0); //@line 311 "HyMES/buff.c"
 $54 = HEAP32[$53>>2]|0; //@line 311 "HyMES/buff.c"
 $55 = $54 ^ $51; //@line 311 "HyMES/buff.c"
 HEAP32[$53>>2] = $55; //@line 311 "HyMES/buff.c"
 STACKTOP = sp;return; //@line 313 "HyMES/buff.c"
}
function _sk_from_string($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $3 = 0;
 var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $3 = $1; //@line 42 "HyMES/decrypt.c"
 HEAP32[2797] = $3; //@line 42 "HyMES/decrypt.c"
 $4 = $1; //@line 43 "HyMES/decrypt.c"
 $5 = ((($4)) + 376832|0); //@line 43 "HyMES/decrypt.c"
 $1 = $5; //@line 43 "HyMES/decrypt.c"
 $6 = $1; //@line 45 "HyMES/decrypt.c"
 HEAP32[2798] = $6; //@line 45 "HyMES/decrypt.c"
 $7 = $1; //@line 46 "HyMES/decrypt.c"
 $8 = ((($7)) + 8192|0); //@line 46 "HyMES/decrypt.c"
 $1 = $8; //@line 46 "HyMES/decrypt.c"
 $9 = $1; //@line 48 "HyMES/decrypt.c"
 $10 = (_poly_alloc_from_string(60,$9)|0); //@line 48 "HyMES/decrypt.c"
 HEAP32[2799] = $10; //@line 48 "HyMES/decrypt.c"
 $11 = HEAP32[2799]|0; //@line 49 "HyMES/decrypt.c"
 HEAP32[$11>>2] = 60; //@line 49 "HyMES/decrypt.c"
 $12 = $1; //@line 50 "HyMES/decrypt.c"
 $13 = ((($12)) + 122|0); //@line 50 "HyMES/decrypt.c"
 $1 = $13; //@line 50 "HyMES/decrypt.c"
 $2 = 0; //@line 52 "HyMES/decrypt.c"
 while(1) {
  $14 = $2; //@line 52 "HyMES/decrypt.c"
  $15 = ($14|0)<(60); //@line 52 "HyMES/decrypt.c"
  if (!($15)) {
   break;
  }
  $16 = $1; //@line 53 "HyMES/decrypt.c"
  $17 = (_poly_alloc_from_string(59,$16)|0); //@line 53 "HyMES/decrypt.c"
  $18 = $2; //@line 53 "HyMES/decrypt.c"
  $19 = (11200 + ($18<<2)|0); //@line 53 "HyMES/decrypt.c"
  HEAP32[$19>>2] = $17; //@line 53 "HyMES/decrypt.c"
  $20 = $2; //@line 54 "HyMES/decrypt.c"
  $21 = (11200 + ($20<<2)|0); //@line 54 "HyMES/decrypt.c"
  $22 = HEAP32[$21>>2]|0; //@line 54 "HyMES/decrypt.c"
  HEAP32[$22>>2] = 59; //@line 54 "HyMES/decrypt.c"
  $23 = $1; //@line 55 "HyMES/decrypt.c"
  $24 = ((($23)) + 120|0); //@line 55 "HyMES/decrypt.c"
  $1 = $24; //@line 55 "HyMES/decrypt.c"
  $25 = $2; //@line 52 "HyMES/decrypt.c"
  $26 = (($25) + 1)|0; //@line 52 "HyMES/decrypt.c"
  $2 = $26; //@line 52 "HyMES/decrypt.c"
 }
 STACKTOP = sp;return; //@line 57 "HyMES/decrypt.c"
}
function _sk_free() {
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = HEAP32[2799]|0; //@line 63 "HyMES/decrypt.c"
 _free($1); //@line 63 "HyMES/decrypt.c"
 $0 = 0; //@line 64 "HyMES/decrypt.c"
 while(1) {
  $2 = $0; //@line 64 "HyMES/decrypt.c"
  $3 = ($2|0)<(60); //@line 64 "HyMES/decrypt.c"
  if (!($3)) {
   break;
  }
  $4 = $0; //@line 65 "HyMES/decrypt.c"
  $5 = (11200 + ($4<<2)|0); //@line 65 "HyMES/decrypt.c"
  $6 = HEAP32[$5>>2]|0; //@line 65 "HyMES/decrypt.c"
  _free($6); //@line 65 "HyMES/decrypt.c"
  $7 = $0; //@line 64 "HyMES/decrypt.c"
  $8 = (($7) + 1)|0; //@line 64 "HyMES/decrypt.c"
  $0 = $8; //@line 64 "HyMES/decrypt.c"
 }
 STACKTOP = sp;return; //@line 67 "HyMES/decrypt.c"
}
function _xor($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = 0; //@line 72 "HyMES/decrypt.c"
 while(1) {
  $5 = $4; //@line 72 "HyMES/decrypt.c"
  $6 = ($5>>>0)<(23); //@line 72 "HyMES/decrypt.c"
  if (!($6)) {
   break;
  }
  $7 = $4; //@line 73 "HyMES/decrypt.c"
  $8 = $3; //@line 73 "HyMES/decrypt.c"
  $9 = (($8) + ($7<<2)|0); //@line 73 "HyMES/decrypt.c"
  $10 = HEAP32[$9>>2]|0; //@line 73 "HyMES/decrypt.c"
  $11 = $4; //@line 73 "HyMES/decrypt.c"
  $12 = $2; //@line 73 "HyMES/decrypt.c"
  $13 = (($12) + ($11<<2)|0); //@line 73 "HyMES/decrypt.c"
  $14 = HEAP32[$13>>2]|0; //@line 73 "HyMES/decrypt.c"
  $15 = $14 ^ $10; //@line 73 "HyMES/decrypt.c"
  HEAP32[$13>>2] = $15; //@line 73 "HyMES/decrypt.c"
  $16 = $4; //@line 72 "HyMES/decrypt.c"
  $17 = (($16) + 1)|0; //@line 72 "HyMES/decrypt.c"
  $4 = $17; //@line 72 "HyMES/decrypt.c"
 }
 STACKTOP = sp;return; //@line 74 "HyMES/decrypt.c"
}
function _syndrome($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0;
 var $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0;
 var $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0;
 var $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $8 = 0, $9 = 0, dest = 0, label = 0, sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 128|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(128|0);
 $7 = sp;
 $1 = $0;
 dest=$7; stop=dest+92|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0)); //@line 84 "HyMES/decrypt.c"
 $8 = (_poly_alloc(59)|0); //@line 86 "HyMES/decrypt.c"
 $5 = $8; //@line 86 "HyMES/decrypt.c"
 $2 = 0; //@line 87 "HyMES/decrypt.c"
 while(1) {
  $9 = $2; //@line 87 "HyMES/decrypt.c"
  $10 = ($9|0)<(4096); //@line 87 "HyMES/decrypt.c"
  if (!($10)) {
   break;
  }
  $11 = $2; //@line 89 "HyMES/decrypt.c"
  $12 = (($11|0) / 8)&-1; //@line 89 "HyMES/decrypt.c"
  $13 = $1; //@line 89 "HyMES/decrypt.c"
  $14 = (($13) + ($12)|0); //@line 89 "HyMES/decrypt.c"
  $15 = HEAP8[$14>>0]|0; //@line 89 "HyMES/decrypt.c"
  $16 = $15&255; //@line 89 "HyMES/decrypt.c"
  $17 = $2; //@line 89 "HyMES/decrypt.c"
  $18 = (($17|0) % 8)&-1; //@line 89 "HyMES/decrypt.c"
  $19 = $16 >> $18; //@line 89 "HyMES/decrypt.c"
  $20 = $19 & 1; //@line 89 "HyMES/decrypt.c"
  $21 = ($20|0)!=(0); //@line 89 "HyMES/decrypt.c"
  if ($21) {
   $22 = HEAP32[2797]|0; //@line 90 "HyMES/decrypt.c"
   $23 = $2; //@line 90 "HyMES/decrypt.c"
   $24 = ($23*23)|0; //@line 90 "HyMES/decrypt.c"
   $25 = (($22) + ($24<<2)|0); //@line 90 "HyMES/decrypt.c"
   _xor($7,$25); //@line 90 "HyMES/decrypt.c"
  }
  $26 = $2; //@line 87 "HyMES/decrypt.c"
  $27 = (($26) + 1)|0; //@line 87 "HyMES/decrypt.c"
  $2 = $27; //@line 87 "HyMES/decrypt.c"
 }
 $4 = 0; //@line 95 "HyMES/decrypt.c"
 while(1) {
  $28 = $4; //@line 95 "HyMES/decrypt.c"
  $29 = ($28|0)<(60); //@line 95 "HyMES/decrypt.c"
  if (!($29)) {
   break;
  }
  $30 = $4; //@line 96 "HyMES/decrypt.c"
  $31 = ($30*12)|0; //@line 96 "HyMES/decrypt.c"
  $32 = (($31>>>0) / 32)&-1; //@line 96 "HyMES/decrypt.c"
  $3 = $32; //@line 96 "HyMES/decrypt.c"
  $33 = $4; //@line 97 "HyMES/decrypt.c"
  $34 = ($33*12)|0; //@line 97 "HyMES/decrypt.c"
  $35 = (($34>>>0) % 32)&-1; //@line 97 "HyMES/decrypt.c"
  $2 = $35; //@line 97 "HyMES/decrypt.c"
  $36 = $3; //@line 98 "HyMES/decrypt.c"
  $37 = (($7) + ($36<<2)|0); //@line 98 "HyMES/decrypt.c"
  $38 = HEAP32[$37>>2]|0; //@line 98 "HyMES/decrypt.c"
  $39 = $2; //@line 98 "HyMES/decrypt.c"
  $40 = $38 >>> $39; //@line 98 "HyMES/decrypt.c"
  $41 = $40&65535; //@line 98 "HyMES/decrypt.c"
  $6 = $41; //@line 98 "HyMES/decrypt.c"
  $42 = $2; //@line 99 "HyMES/decrypt.c"
  $43 = (($42) + 12)|0; //@line 99 "HyMES/decrypt.c"
  $44 = ($43>>>0)>(32); //@line 99 "HyMES/decrypt.c"
  if ($44) {
   $45 = $3; //@line 100 "HyMES/decrypt.c"
   $46 = (($45) + 1)|0; //@line 100 "HyMES/decrypt.c"
   $47 = (($7) + ($46<<2)|0); //@line 100 "HyMES/decrypt.c"
   $48 = HEAP32[$47>>2]|0; //@line 100 "HyMES/decrypt.c"
   $49 = $2; //@line 100 "HyMES/decrypt.c"
   $50 = (32 - ($49))|0; //@line 100 "HyMES/decrypt.c"
   $51 = $48 << $50; //@line 100 "HyMES/decrypt.c"
   $52 = $6; //@line 100 "HyMES/decrypt.c"
   $53 = $52&65535; //@line 100 "HyMES/decrypt.c"
   $54 = $53 ^ $51; //@line 100 "HyMES/decrypt.c"
   $55 = $54&65535; //@line 100 "HyMES/decrypt.c"
   $6 = $55; //@line 100 "HyMES/decrypt.c"
  }
  $56 = $6; //@line 101 "HyMES/decrypt.c"
  $57 = $56&65535; //@line 101 "HyMES/decrypt.c"
  $58 = $57 & 4095; //@line 101 "HyMES/decrypt.c"
  $59 = $58&65535; //@line 101 "HyMES/decrypt.c"
  $6 = $59; //@line 101 "HyMES/decrypt.c"
  $60 = $6; //@line 102 "HyMES/decrypt.c"
  $61 = $4; //@line 102 "HyMES/decrypt.c"
  $62 = $5; //@line 102 "HyMES/decrypt.c"
  $63 = ((($62)) + 8|0); //@line 102 "HyMES/decrypt.c"
  $64 = HEAP32[$63>>2]|0; //@line 102 "HyMES/decrypt.c"
  $65 = (($64) + ($61<<1)|0); //@line 102 "HyMES/decrypt.c"
  HEAP16[$65>>1] = $60; //@line 102 "HyMES/decrypt.c"
  $66 = $4; //@line 95 "HyMES/decrypt.c"
  $67 = (($66) + 1)|0; //@line 95 "HyMES/decrypt.c"
  $4 = $67; //@line 95 "HyMES/decrypt.c"
 }
 $68 = $5; //@line 105 "HyMES/decrypt.c"
 (_poly_calcule_deg($68)|0); //@line 105 "HyMES/decrypt.c"
 $69 = $5; //@line 106 "HyMES/decrypt.c"
 STACKTOP = sp;return ($69|0); //@line 106 "HyMES/decrypt.c"
}
function _roots_berl_aux($0,$1,$2,$3,$4,$5) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 $5 = $5|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0;
 var $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0;
 var $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0;
 var $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0;
 var $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0;
 var $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0;
 var $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0;
 var $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $30 = 0, $31 = 0;
 var $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $50 = 0, $51 = 0;
 var $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0;
 var $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0;
 var $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(48|0);
 $7 = $0;
 $8 = $1;
 $9 = $2;
 $10 = $3;
 $11 = $4;
 $12 = $5;
 $18 = $8; //@line 114 "HyMES/decrypt.c"
 $19 = ($18|0)==(0); //@line 114 "HyMES/decrypt.c"
 if ($19) {
  $6 = 0; //@line 115 "HyMES/decrypt.c"
  $257 = $6; //@line 150 "HyMES/decrypt.c"
  STACKTOP = sp;return ($257|0); //@line 150 "HyMES/decrypt.c"
 }
 $20 = $8; //@line 118 "HyMES/decrypt.c"
 $21 = ($20|0)==(1); //@line 118 "HyMES/decrypt.c"
 if ($21) {
  $22 = $7; //@line 119 "HyMES/decrypt.c"
  $23 = ((($22)) + 8|0); //@line 119 "HyMES/decrypt.c"
  $24 = HEAP32[$23>>2]|0; //@line 119 "HyMES/decrypt.c"
  $25 = HEAP16[$24>>1]|0; //@line 119 "HyMES/decrypt.c"
  $26 = $25&65535; //@line 119 "HyMES/decrypt.c"
  $27 = ($26|0)!=(0); //@line 119 "HyMES/decrypt.c"
  if ($27) {
   $28 = $7; //@line 119 "HyMES/decrypt.c"
   $29 = ((($28)) + 8|0); //@line 119 "HyMES/decrypt.c"
   $30 = HEAP32[$29>>2]|0; //@line 119 "HyMES/decrypt.c"
   $31 = HEAP16[$30>>1]|0; //@line 119 "HyMES/decrypt.c"
   $32 = $31&65535; //@line 119 "HyMES/decrypt.c"
   $33 = HEAP32[2860]|0; //@line 119 "HyMES/decrypt.c"
   $34 = (($33) + ($32<<1)|0); //@line 119 "HyMES/decrypt.c"
   $35 = HEAP16[$34>>1]|0; //@line 119 "HyMES/decrypt.c"
   $36 = $35&65535; //@line 119 "HyMES/decrypt.c"
   $37 = $7; //@line 119 "HyMES/decrypt.c"
   $38 = ((($37)) + 8|0); //@line 119 "HyMES/decrypt.c"
   $39 = HEAP32[$38>>2]|0; //@line 119 "HyMES/decrypt.c"
   $40 = ((($39)) + 2|0); //@line 119 "HyMES/decrypt.c"
   $41 = HEAP16[$40>>1]|0; //@line 119 "HyMES/decrypt.c"
   $42 = $41&65535; //@line 119 "HyMES/decrypt.c"
   $43 = HEAP32[2860]|0; //@line 119 "HyMES/decrypt.c"
   $44 = (($43) + ($42<<1)|0); //@line 119 "HyMES/decrypt.c"
   $45 = HEAP16[$44>>1]|0; //@line 119 "HyMES/decrypt.c"
   $46 = $45&65535; //@line 119 "HyMES/decrypt.c"
   $47 = (($36) - ($46))|0; //@line 119 "HyMES/decrypt.c"
   $48 = HEAP32[2861]|0; //@line 119 "HyMES/decrypt.c"
   $49 = $47 & $48; //@line 119 "HyMES/decrypt.c"
   $50 = $7; //@line 119 "HyMES/decrypt.c"
   $51 = ((($50)) + 8|0); //@line 119 "HyMES/decrypt.c"
   $52 = HEAP32[$51>>2]|0; //@line 119 "HyMES/decrypt.c"
   $53 = HEAP16[$52>>1]|0; //@line 119 "HyMES/decrypt.c"
   $54 = $53&65535; //@line 119 "HyMES/decrypt.c"
   $55 = HEAP32[2860]|0; //@line 119 "HyMES/decrypt.c"
   $56 = (($55) + ($54<<1)|0); //@line 119 "HyMES/decrypt.c"
   $57 = HEAP16[$56>>1]|0; //@line 119 "HyMES/decrypt.c"
   $58 = $57&65535; //@line 119 "HyMES/decrypt.c"
   $59 = $7; //@line 119 "HyMES/decrypt.c"
   $60 = ((($59)) + 8|0); //@line 119 "HyMES/decrypt.c"
   $61 = HEAP32[$60>>2]|0; //@line 119 "HyMES/decrypt.c"
   $62 = ((($61)) + 2|0); //@line 119 "HyMES/decrypt.c"
   $63 = HEAP16[$62>>1]|0; //@line 119 "HyMES/decrypt.c"
   $64 = $63&65535; //@line 119 "HyMES/decrypt.c"
   $65 = HEAP32[2860]|0; //@line 119 "HyMES/decrypt.c"
   $66 = (($65) + ($64<<1)|0); //@line 119 "HyMES/decrypt.c"
   $67 = HEAP16[$66>>1]|0; //@line 119 "HyMES/decrypt.c"
   $68 = $67&65535; //@line 119 "HyMES/decrypt.c"
   $69 = (($58) - ($68))|0; //@line 119 "HyMES/decrypt.c"
   $70 = HEAP32[2862]|0; //@line 119 "HyMES/decrypt.c"
   $71 = $69 >> $70; //@line 119 "HyMES/decrypt.c"
   $72 = (($49) + ($71))|0; //@line 119 "HyMES/decrypt.c"
   $73 = HEAP32[2863]|0; //@line 119 "HyMES/decrypt.c"
   $74 = (($73) + ($72<<1)|0); //@line 119 "HyMES/decrypt.c"
   $75 = HEAP16[$74>>1]|0; //@line 119 "HyMES/decrypt.c"
   $76 = $75&65535; //@line 119 "HyMES/decrypt.c"
   $78 = $76;
  } else {
   $78 = 0;
  }
  $77 = $78&65535; //@line 119 "HyMES/decrypt.c"
  $79 = $12; //@line 119 "HyMES/decrypt.c"
  HEAP16[$79>>1] = $77; //@line 119 "HyMES/decrypt.c"
  $6 = 1; //@line 120 "HyMES/decrypt.c"
  $257 = $6; //@line 150 "HyMES/decrypt.c"
  STACKTOP = sp;return ($257|0); //@line 150 "HyMES/decrypt.c"
 }
 $80 = $11; //@line 124 "HyMES/decrypt.c"
 $81 = ($80|0)>=(12); //@line 124 "HyMES/decrypt.c"
 if ($81) {
  $6 = 0; //@line 125 "HyMES/decrypt.c"
  $257 = $6; //@line 150 "HyMES/decrypt.c"
  STACKTOP = sp;return ($257|0); //@line 150 "HyMES/decrypt.c"
 }
 $82 = $11; //@line 128 "HyMES/decrypt.c"
 $83 = $10; //@line 128 "HyMES/decrypt.c"
 $84 = (($83) + ($82<<2)|0); //@line 128 "HyMES/decrypt.c"
 $85 = HEAP32[$84>>2]|0; //@line 128 "HyMES/decrypt.c"
 $86 = ($85|0)==(0|0); //@line 128 "HyMES/decrypt.c"
 if ($86) {
  $87 = (_poly_alloc(59)|0); //@line 129 "HyMES/decrypt.c"
  $88 = $11; //@line 129 "HyMES/decrypt.c"
  $89 = $10; //@line 129 "HyMES/decrypt.c"
  $90 = (($89) + ($88<<2)|0); //@line 129 "HyMES/decrypt.c"
  HEAP32[$90>>2] = $87; //@line 129 "HyMES/decrypt.c"
  $91 = $11; //@line 130 "HyMES/decrypt.c"
  $92 = HEAP32[2863]|0; //@line 130 "HyMES/decrypt.c"
  $93 = (($92) + ($91<<1)|0); //@line 130 "HyMES/decrypt.c"
  $94 = HEAP16[$93>>1]|0; //@line 130 "HyMES/decrypt.c"
  $17 = $94; //@line 130 "HyMES/decrypt.c"
  $15 = 0; //@line 131 "HyMES/decrypt.c"
  while(1) {
   $95 = $15; //@line 131 "HyMES/decrypt.c"
   $96 = ($95|0)<(12); //@line 131 "HyMES/decrypt.c"
   if (!($96)) {
    break;
   }
   $16 = 0; //@line 132 "HyMES/decrypt.c"
   while(1) {
    $97 = $16; //@line 132 "HyMES/decrypt.c"
    $98 = ($97|0)<(60); //@line 132 "HyMES/decrypt.c"
    if (!($98)) {
     break;
    }
    $99 = $16; //@line 133 "HyMES/decrypt.c"
    $100 = $11; //@line 133 "HyMES/decrypt.c"
    $101 = $10; //@line 133 "HyMES/decrypt.c"
    $102 = (($101) + ($100<<2)|0); //@line 133 "HyMES/decrypt.c"
    $103 = HEAP32[$102>>2]|0; //@line 133 "HyMES/decrypt.c"
    $104 = ((($103)) + 8|0); //@line 133 "HyMES/decrypt.c"
    $105 = HEAP32[$104>>2]|0; //@line 133 "HyMES/decrypt.c"
    $106 = (($105) + ($99<<1)|0); //@line 133 "HyMES/decrypt.c"
    $107 = HEAP16[$106>>1]|0; //@line 133 "HyMES/decrypt.c"
    $108 = $107&65535; //@line 133 "HyMES/decrypt.c"
    $109 = $16; //@line 133 "HyMES/decrypt.c"
    $110 = $15; //@line 133 "HyMES/decrypt.c"
    $111 = $9; //@line 133 "HyMES/decrypt.c"
    $112 = (($111) + ($110<<2)|0); //@line 133 "HyMES/decrypt.c"
    $113 = HEAP32[$112>>2]|0; //@line 133 "HyMES/decrypt.c"
    $114 = ((($113)) + 8|0); //@line 133 "HyMES/decrypt.c"
    $115 = HEAP32[$114>>2]|0; //@line 133 "HyMES/decrypt.c"
    $116 = (($115) + ($109<<1)|0); //@line 133 "HyMES/decrypt.c"
    $117 = HEAP16[$116>>1]|0; //@line 133 "HyMES/decrypt.c"
    $118 = $117&65535; //@line 133 "HyMES/decrypt.c"
    $119 = ($118|0)!=(0); //@line 133 "HyMES/decrypt.c"
    if ($119) {
     $120 = $17; //@line 133 "HyMES/decrypt.c"
     $121 = $120&65535; //@line 133 "HyMES/decrypt.c"
     $122 = ($121|0)!=(0); //@line 133 "HyMES/decrypt.c"
     if ($122) {
      $123 = $16; //@line 133 "HyMES/decrypt.c"
      $124 = $15; //@line 133 "HyMES/decrypt.c"
      $125 = $9; //@line 133 "HyMES/decrypt.c"
      $126 = (($125) + ($124<<2)|0); //@line 133 "HyMES/decrypt.c"
      $127 = HEAP32[$126>>2]|0; //@line 133 "HyMES/decrypt.c"
      $128 = ((($127)) + 8|0); //@line 133 "HyMES/decrypt.c"
      $129 = HEAP32[$128>>2]|0; //@line 133 "HyMES/decrypt.c"
      $130 = (($129) + ($123<<1)|0); //@line 133 "HyMES/decrypt.c"
      $131 = HEAP16[$130>>1]|0; //@line 133 "HyMES/decrypt.c"
      $132 = $131&65535; //@line 133 "HyMES/decrypt.c"
      $133 = HEAP32[2860]|0; //@line 133 "HyMES/decrypt.c"
      $134 = (($133) + ($132<<1)|0); //@line 133 "HyMES/decrypt.c"
      $135 = HEAP16[$134>>1]|0; //@line 133 "HyMES/decrypt.c"
      $136 = $135&65535; //@line 133 "HyMES/decrypt.c"
      $137 = $17; //@line 133 "HyMES/decrypt.c"
      $138 = $137&65535; //@line 133 "HyMES/decrypt.c"
      $139 = HEAP32[2860]|0; //@line 133 "HyMES/decrypt.c"
      $140 = (($139) + ($138<<1)|0); //@line 133 "HyMES/decrypt.c"
      $141 = HEAP16[$140>>1]|0; //@line 133 "HyMES/decrypt.c"
      $142 = $141&65535; //@line 133 "HyMES/decrypt.c"
      $143 = (($136) + ($142))|0; //@line 133 "HyMES/decrypt.c"
      $144 = HEAP32[2861]|0; //@line 133 "HyMES/decrypt.c"
      $145 = $143 & $144; //@line 133 "HyMES/decrypt.c"
      $146 = $16; //@line 133 "HyMES/decrypt.c"
      $147 = $15; //@line 133 "HyMES/decrypt.c"
      $148 = $9; //@line 133 "HyMES/decrypt.c"
      $149 = (($148) + ($147<<2)|0); //@line 133 "HyMES/decrypt.c"
      $150 = HEAP32[$149>>2]|0; //@line 133 "HyMES/decrypt.c"
      $151 = ((($150)) + 8|0); //@line 133 "HyMES/decrypt.c"
      $152 = HEAP32[$151>>2]|0; //@line 133 "HyMES/decrypt.c"
      $153 = (($152) + ($146<<1)|0); //@line 133 "HyMES/decrypt.c"
      $154 = HEAP16[$153>>1]|0; //@line 133 "HyMES/decrypt.c"
      $155 = $154&65535; //@line 133 "HyMES/decrypt.c"
      $156 = HEAP32[2860]|0; //@line 133 "HyMES/decrypt.c"
      $157 = (($156) + ($155<<1)|0); //@line 133 "HyMES/decrypt.c"
      $158 = HEAP16[$157>>1]|0; //@line 133 "HyMES/decrypt.c"
      $159 = $158&65535; //@line 133 "HyMES/decrypt.c"
      $160 = $17; //@line 133 "HyMES/decrypt.c"
      $161 = $160&65535; //@line 133 "HyMES/decrypt.c"
      $162 = HEAP32[2860]|0; //@line 133 "HyMES/decrypt.c"
      $163 = (($162) + ($161<<1)|0); //@line 133 "HyMES/decrypt.c"
      $164 = HEAP16[$163>>1]|0; //@line 133 "HyMES/decrypt.c"
      $165 = $164&65535; //@line 133 "HyMES/decrypt.c"
      $166 = (($159) + ($165))|0; //@line 133 "HyMES/decrypt.c"
      $167 = HEAP32[2862]|0; //@line 133 "HyMES/decrypt.c"
      $168 = $166 >> $167; //@line 133 "HyMES/decrypt.c"
      $169 = (($145) + ($168))|0; //@line 133 "HyMES/decrypt.c"
      $170 = HEAP32[2863]|0; //@line 133 "HyMES/decrypt.c"
      $171 = (($170) + ($169<<1)|0); //@line 133 "HyMES/decrypt.c"
      $172 = HEAP16[$171>>1]|0; //@line 133 "HyMES/decrypt.c"
      $173 = $172&65535; //@line 133 "HyMES/decrypt.c"
      $175 = $173;
     } else {
      $175 = 0;
     }
    } else {
     $175 = 0;
    }
    $174 = $108 ^ $175; //@line 133 "HyMES/decrypt.c"
    $176 = $174&65535; //@line 133 "HyMES/decrypt.c"
    $177 = $16; //@line 133 "HyMES/decrypt.c"
    $178 = $11; //@line 133 "HyMES/decrypt.c"
    $179 = $10; //@line 133 "HyMES/decrypt.c"
    $180 = (($179) + ($178<<2)|0); //@line 133 "HyMES/decrypt.c"
    $181 = HEAP32[$180>>2]|0; //@line 133 "HyMES/decrypt.c"
    $182 = ((($181)) + 8|0); //@line 133 "HyMES/decrypt.c"
    $183 = HEAP32[$182>>2]|0; //@line 133 "HyMES/decrypt.c"
    $184 = (($183) + ($177<<1)|0); //@line 133 "HyMES/decrypt.c"
    HEAP16[$184>>1] = $176; //@line 133 "HyMES/decrypt.c"
    $185 = $16; //@line 132 "HyMES/decrypt.c"
    $186 = (($185) + 1)|0; //@line 132 "HyMES/decrypt.c"
    $16 = $186; //@line 132 "HyMES/decrypt.c"
   }
   $187 = $17; //@line 134 "HyMES/decrypt.c"
   $188 = $187&65535; //@line 134 "HyMES/decrypt.c"
   $189 = ($188|0)!=(0); //@line 134 "HyMES/decrypt.c"
   if ($189) {
    $190 = $17; //@line 134 "HyMES/decrypt.c"
    $191 = $190&65535; //@line 134 "HyMES/decrypt.c"
    $192 = HEAP32[2860]|0; //@line 134 "HyMES/decrypt.c"
    $193 = (($192) + ($191<<1)|0); //@line 134 "HyMES/decrypt.c"
    $194 = HEAP16[$193>>1]|0; //@line 134 "HyMES/decrypt.c"
    $195 = $194&65535; //@line 134 "HyMES/decrypt.c"
    $196 = $195 << 1; //@line 134 "HyMES/decrypt.c"
    $197 = HEAP32[2861]|0; //@line 134 "HyMES/decrypt.c"
    $198 = $196 & $197; //@line 134 "HyMES/decrypt.c"
    $199 = $17; //@line 134 "HyMES/decrypt.c"
    $200 = $199&65535; //@line 134 "HyMES/decrypt.c"
    $201 = HEAP32[2860]|0; //@line 134 "HyMES/decrypt.c"
    $202 = (($201) + ($200<<1)|0); //@line 134 "HyMES/decrypt.c"
    $203 = HEAP16[$202>>1]|0; //@line 134 "HyMES/decrypt.c"
    $204 = $203&65535; //@line 134 "HyMES/decrypt.c"
    $205 = $204 << 1; //@line 134 "HyMES/decrypt.c"
    $206 = HEAP32[2862]|0; //@line 134 "HyMES/decrypt.c"
    $207 = $205 >> $206; //@line 134 "HyMES/decrypt.c"
    $208 = (($198) + ($207))|0; //@line 134 "HyMES/decrypt.c"
    $209 = HEAP32[2863]|0; //@line 134 "HyMES/decrypt.c"
    $210 = (($209) + ($208<<1)|0); //@line 134 "HyMES/decrypt.c"
    $211 = HEAP16[$210>>1]|0; //@line 134 "HyMES/decrypt.c"
    $212 = $211&65535; //@line 134 "HyMES/decrypt.c"
    $214 = $212;
   } else {
    $214 = 0;
   }
   $213 = $214&65535; //@line 134 "HyMES/decrypt.c"
   $17 = $213; //@line 134 "HyMES/decrypt.c"
   $215 = $15; //@line 131 "HyMES/decrypt.c"
   $216 = (($215) + 1)|0; //@line 131 "HyMES/decrypt.c"
   $15 = $216; //@line 131 "HyMES/decrypt.c"
  }
  $217 = $11; //@line 136 "HyMES/decrypt.c"
  $218 = $10; //@line 136 "HyMES/decrypt.c"
  $219 = (($218) + ($217<<2)|0); //@line 136 "HyMES/decrypt.c"
  $220 = HEAP32[$219>>2]|0; //@line 136 "HyMES/decrypt.c"
  (_poly_calcule_deg($220)|0); //@line 136 "HyMES/decrypt.c"
 }
 $221 = $11; //@line 138 "HyMES/decrypt.c"
 $222 = $10; //@line 138 "HyMES/decrypt.c"
 $223 = (($222) + ($221<<2)|0); //@line 138 "HyMES/decrypt.c"
 $224 = HEAP32[$223>>2]|0; //@line 138 "HyMES/decrypt.c"
 $225 = $7; //@line 138 "HyMES/decrypt.c"
 $226 = (_poly_gcd($224,$225)|0); //@line 138 "HyMES/decrypt.c"
 $13 = $226; //@line 138 "HyMES/decrypt.c"
 $227 = $7; //@line 139 "HyMES/decrypt.c"
 $228 = $13; //@line 139 "HyMES/decrypt.c"
 $229 = (_poly_quo($227,$228)|0); //@line 139 "HyMES/decrypt.c"
 $14 = $229; //@line 139 "HyMES/decrypt.c"
 $230 = $13; //@line 141 "HyMES/decrypt.c"
 $231 = HEAP32[$230>>2]|0; //@line 141 "HyMES/decrypt.c"
 $15 = $231; //@line 141 "HyMES/decrypt.c"
 $232 = $13; //@line 143 "HyMES/decrypt.c"
 $233 = $15; //@line 143 "HyMES/decrypt.c"
 $234 = $9; //@line 143 "HyMES/decrypt.c"
 $235 = $10; //@line 143 "HyMES/decrypt.c"
 $236 = $11; //@line 143 "HyMES/decrypt.c"
 $237 = (($236) + 1)|0; //@line 143 "HyMES/decrypt.c"
 $238 = $12; //@line 143 "HyMES/decrypt.c"
 $239 = (_roots_berl_aux($232,$233,$234,$235,$237,$238)|0); //@line 143 "HyMES/decrypt.c"
 $16 = $239; //@line 143 "HyMES/decrypt.c"
 $240 = $14; //@line 144 "HyMES/decrypt.c"
 $241 = $8; //@line 144 "HyMES/decrypt.c"
 $242 = $15; //@line 144 "HyMES/decrypt.c"
 $243 = (($241) - ($242))|0; //@line 144 "HyMES/decrypt.c"
 $244 = $9; //@line 144 "HyMES/decrypt.c"
 $245 = $10; //@line 144 "HyMES/decrypt.c"
 $246 = $11; //@line 144 "HyMES/decrypt.c"
 $247 = (($246) + 1)|0; //@line 144 "HyMES/decrypt.c"
 $248 = $12; //@line 144 "HyMES/decrypt.c"
 $249 = $16; //@line 144 "HyMES/decrypt.c"
 $250 = (($248) + ($249<<1)|0); //@line 144 "HyMES/decrypt.c"
 $251 = (_roots_berl_aux($240,$243,$244,$245,$247,$250)|0); //@line 144 "HyMES/decrypt.c"
 $252 = $16; //@line 144 "HyMES/decrypt.c"
 $253 = (($252) + ($251))|0; //@line 144 "HyMES/decrypt.c"
 $16 = $253; //@line 144 "HyMES/decrypt.c"
 $254 = $13; //@line 146 "HyMES/decrypt.c"
 _poly_free($254); //@line 146 "HyMES/decrypt.c"
 $255 = $14; //@line 147 "HyMES/decrypt.c"
 _poly_free($255); //@line 147 "HyMES/decrypt.c"
 $256 = $16; //@line 149 "HyMES/decrypt.c"
 $6 = $256; //@line 149 "HyMES/decrypt.c"
 $257 = $6; //@line 150 "HyMES/decrypt.c"
 STACKTOP = sp;return ($257|0); //@line 150 "HyMES/decrypt.c"
}
function _roots_berl($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0;
 var $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0;
 var $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0;
 var $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0;
 var $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0;
 var $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $2 = $0;
 $3 = $1;
 $10 = (_malloc(240)|0); //@line 157 "HyMES/decrypt.c"
 $4 = $10; //@line 157 "HyMES/decrypt.c"
 $11 = (_malloc(48)|0); //@line 158 "HyMES/decrypt.c"
 $6 = $11; //@line 158 "HyMES/decrypt.c"
 $12 = (_malloc(48)|0); //@line 159 "HyMES/decrypt.c"
 $5 = $12; //@line 159 "HyMES/decrypt.c"
 $7 = 0; //@line 160 "HyMES/decrypt.c"
 while(1) {
  $13 = $7; //@line 160 "HyMES/decrypt.c"
  $14 = ($13|0)<(60); //@line 160 "HyMES/decrypt.c"
  if (!($14)) {
   break;
  }
  $15 = (_poly_alloc(61)|0); //@line 161 "HyMES/decrypt.c"
  $16 = $7; //@line 161 "HyMES/decrypt.c"
  $17 = $4; //@line 161 "HyMES/decrypt.c"
  $18 = (($17) + ($16<<2)|0); //@line 161 "HyMES/decrypt.c"
  HEAP32[$18>>2] = $15; //@line 161 "HyMES/decrypt.c"
  $19 = $7; //@line 160 "HyMES/decrypt.c"
  $20 = (($19) + 1)|0; //@line 160 "HyMES/decrypt.c"
  $7 = $20; //@line 160 "HyMES/decrypt.c"
 }
 $7 = 0; //@line 162 "HyMES/decrypt.c"
 while(1) {
  $21 = $7; //@line 162 "HyMES/decrypt.c"
  $22 = ($21|0)<(12); //@line 162 "HyMES/decrypt.c"
  if (!($22)) {
   break;
  }
  $23 = (_poly_alloc(59)|0); //@line 163 "HyMES/decrypt.c"
  $24 = $7; //@line 163 "HyMES/decrypt.c"
  $25 = $6; //@line 163 "HyMES/decrypt.c"
  $26 = (($25) + ($24<<2)|0); //@line 163 "HyMES/decrypt.c"
  HEAP32[$26>>2] = $23; //@line 163 "HyMES/decrypt.c"
  $27 = $7; //@line 162 "HyMES/decrypt.c"
  $28 = (($27) + 1)|0; //@line 162 "HyMES/decrypt.c"
  $7 = $28; //@line 162 "HyMES/decrypt.c"
 }
 $7 = 0; //@line 164 "HyMES/decrypt.c"
 while(1) {
  $29 = $7; //@line 164 "HyMES/decrypt.c"
  $30 = ($29|0)<(12); //@line 164 "HyMES/decrypt.c"
  if (!($30)) {
   break;
  }
  $31 = $7; //@line 165 "HyMES/decrypt.c"
  $32 = $5; //@line 165 "HyMES/decrypt.c"
  $33 = (($32) + ($31<<2)|0); //@line 165 "HyMES/decrypt.c"
  HEAP32[$33>>2] = 0; //@line 165 "HyMES/decrypt.c"
  $34 = $7; //@line 164 "HyMES/decrypt.c"
  $35 = (($34) + 1)|0; //@line 164 "HyMES/decrypt.c"
  $7 = $35; //@line 164 "HyMES/decrypt.c"
 }
 $36 = $2; //@line 167 "HyMES/decrypt.c"
 $37 = $4; //@line 167 "HyMES/decrypt.c"
 _poly_sqmod_init($36,$37); //@line 167 "HyMES/decrypt.c"
 $38 = $6; //@line 168 "HyMES/decrypt.c"
 $39 = HEAP32[$38>>2]|0; //@line 168 "HyMES/decrypt.c"
 $40 = ((($39)) + 8|0); //@line 168 "HyMES/decrypt.c"
 $41 = HEAP32[$40>>2]|0; //@line 168 "HyMES/decrypt.c"
 $42 = ((($41)) + 2|0); //@line 168 "HyMES/decrypt.c"
 HEAP16[$42>>1] = 1; //@line 168 "HyMES/decrypt.c"
 $43 = $6; //@line 169 "HyMES/decrypt.c"
 $44 = HEAP32[$43>>2]|0; //@line 169 "HyMES/decrypt.c"
 HEAP32[$44>>2] = 1; //@line 169 "HyMES/decrypt.c"
 $45 = (_poly_alloc(59)|0); //@line 170 "HyMES/decrypt.c"
 $46 = $5; //@line 170 "HyMES/decrypt.c"
 HEAP32[$46>>2] = $45; //@line 170 "HyMES/decrypt.c"
 $47 = $5; //@line 171 "HyMES/decrypt.c"
 $48 = HEAP32[$47>>2]|0; //@line 171 "HyMES/decrypt.c"
 $49 = ((($48)) + 8|0); //@line 171 "HyMES/decrypt.c"
 $50 = HEAP32[$49>>2]|0; //@line 171 "HyMES/decrypt.c"
 $51 = ((($50)) + 2|0); //@line 171 "HyMES/decrypt.c"
 HEAP16[$51>>1] = 1; //@line 171 "HyMES/decrypt.c"
 $7 = 1; //@line 172 "HyMES/decrypt.c"
 while(1) {
  $52 = $7; //@line 172 "HyMES/decrypt.c"
  $53 = ($52|0)<(12); //@line 172 "HyMES/decrypt.c"
  if (!($53)) {
   break;
  }
  $54 = $7; //@line 173 "HyMES/decrypt.c"
  $55 = $6; //@line 173 "HyMES/decrypt.c"
  $56 = (($55) + ($54<<2)|0); //@line 173 "HyMES/decrypt.c"
  $57 = HEAP32[$56>>2]|0; //@line 173 "HyMES/decrypt.c"
  $58 = $7; //@line 173 "HyMES/decrypt.c"
  $59 = (($58) - 1)|0; //@line 173 "HyMES/decrypt.c"
  $60 = $6; //@line 173 "HyMES/decrypt.c"
  $61 = (($60) + ($59<<2)|0); //@line 173 "HyMES/decrypt.c"
  $62 = HEAP32[$61>>2]|0; //@line 173 "HyMES/decrypt.c"
  $63 = $4; //@line 173 "HyMES/decrypt.c"
  _poly_sqmod($57,$62,$63,60); //@line 173 "HyMES/decrypt.c"
  $8 = 0; //@line 174 "HyMES/decrypt.c"
  while(1) {
   $64 = $8; //@line 174 "HyMES/decrypt.c"
   $65 = ($64|0)<(60); //@line 174 "HyMES/decrypt.c"
   if (!($65)) {
    break;
   }
   $66 = $8; //@line 175 "HyMES/decrypt.c"
   $67 = $5; //@line 175 "HyMES/decrypt.c"
   $68 = HEAP32[$67>>2]|0; //@line 175 "HyMES/decrypt.c"
   $69 = ((($68)) + 8|0); //@line 175 "HyMES/decrypt.c"
   $70 = HEAP32[$69>>2]|0; //@line 175 "HyMES/decrypt.c"
   $71 = (($70) + ($66<<1)|0); //@line 175 "HyMES/decrypt.c"
   $72 = HEAP16[$71>>1]|0; //@line 175 "HyMES/decrypt.c"
   $73 = $72&65535; //@line 175 "HyMES/decrypt.c"
   $74 = $8; //@line 175 "HyMES/decrypt.c"
   $75 = $7; //@line 175 "HyMES/decrypt.c"
   $76 = $6; //@line 175 "HyMES/decrypt.c"
   $77 = (($76) + ($75<<2)|0); //@line 175 "HyMES/decrypt.c"
   $78 = HEAP32[$77>>2]|0; //@line 175 "HyMES/decrypt.c"
   $79 = ((($78)) + 8|0); //@line 175 "HyMES/decrypt.c"
   $80 = HEAP32[$79>>2]|0; //@line 175 "HyMES/decrypt.c"
   $81 = (($80) + ($74<<1)|0); //@line 175 "HyMES/decrypt.c"
   $82 = HEAP16[$81>>1]|0; //@line 175 "HyMES/decrypt.c"
   $83 = $82&65535; //@line 175 "HyMES/decrypt.c"
   $84 = $73 ^ $83; //@line 175 "HyMES/decrypt.c"
   $85 = $84&65535; //@line 175 "HyMES/decrypt.c"
   $86 = $8; //@line 175 "HyMES/decrypt.c"
   $87 = $5; //@line 175 "HyMES/decrypt.c"
   $88 = HEAP32[$87>>2]|0; //@line 175 "HyMES/decrypt.c"
   $89 = ((($88)) + 8|0); //@line 175 "HyMES/decrypt.c"
   $90 = HEAP32[$89>>2]|0; //@line 175 "HyMES/decrypt.c"
   $91 = (($90) + ($86<<1)|0); //@line 175 "HyMES/decrypt.c"
   HEAP16[$91>>1] = $85; //@line 175 "HyMES/decrypt.c"
   $92 = $8; //@line 174 "HyMES/decrypt.c"
   $93 = (($92) + 1)|0; //@line 174 "HyMES/decrypt.c"
   $8 = $93; //@line 174 "HyMES/decrypt.c"
  }
  $94 = $7; //@line 172 "HyMES/decrypt.c"
  $95 = (($94) + 1)|0; //@line 172 "HyMES/decrypt.c"
  $7 = $95; //@line 172 "HyMES/decrypt.c"
 }
 $96 = $5; //@line 177 "HyMES/decrypt.c"
 $97 = HEAP32[$96>>2]|0; //@line 177 "HyMES/decrypt.c"
 (_poly_calcule_deg($97)|0); //@line 177 "HyMES/decrypt.c"
 $7 = 0; //@line 178 "HyMES/decrypt.c"
 while(1) {
  $98 = $7; //@line 178 "HyMES/decrypt.c"
  $99 = ($98|0)<(60); //@line 178 "HyMES/decrypt.c"
  if (!($99)) {
   break;
  }
  $100 = $7; //@line 179 "HyMES/decrypt.c"
  $101 = $4; //@line 179 "HyMES/decrypt.c"
  $102 = (($101) + ($100<<2)|0); //@line 179 "HyMES/decrypt.c"
  $103 = HEAP32[$102>>2]|0; //@line 179 "HyMES/decrypt.c"
  _poly_free($103); //@line 179 "HyMES/decrypt.c"
  $104 = $7; //@line 178 "HyMES/decrypt.c"
  $105 = (($104) + 1)|0; //@line 178 "HyMES/decrypt.c"
  $7 = $105; //@line 178 "HyMES/decrypt.c"
 }
 $106 = $4; //@line 180 "HyMES/decrypt.c"
 _free($106); //@line 180 "HyMES/decrypt.c"
 $107 = $2; //@line 181 "HyMES/decrypt.c"
 $108 = $6; //@line 181 "HyMES/decrypt.c"
 $109 = $5; //@line 181 "HyMES/decrypt.c"
 $110 = $3; //@line 181 "HyMES/decrypt.c"
 $111 = (_roots_berl_aux($107,60,$108,$109,0,$110)|0); //@line 181 "HyMES/decrypt.c"
 $9 = $111; //@line 181 "HyMES/decrypt.c"
 $7 = 0; //@line 182 "HyMES/decrypt.c"
 while(1) {
  $112 = $7; //@line 182 "HyMES/decrypt.c"
  $113 = ($112|0)<(12); //@line 182 "HyMES/decrypt.c"
  if (!($113)) {
   break;
  }
  $114 = $7; //@line 183 "HyMES/decrypt.c"
  $115 = $6; //@line 183 "HyMES/decrypt.c"
  $116 = (($115) + ($114<<2)|0); //@line 183 "HyMES/decrypt.c"
  $117 = HEAP32[$116>>2]|0; //@line 183 "HyMES/decrypt.c"
  _poly_free($117); //@line 183 "HyMES/decrypt.c"
  $118 = $7; //@line 182 "HyMES/decrypt.c"
  $119 = (($118) + 1)|0; //@line 182 "HyMES/decrypt.c"
  $7 = $119; //@line 182 "HyMES/decrypt.c"
 }
 $120 = $6; //@line 184 "HyMES/decrypt.c"
 _free($120); //@line 184 "HyMES/decrypt.c"
 $7 = 0; //@line 185 "HyMES/decrypt.c"
 while(1) {
  $121 = $7; //@line 185 "HyMES/decrypt.c"
  $122 = ($121|0)<(12); //@line 185 "HyMES/decrypt.c"
  if (!($122)) {
   break;
  }
  $123 = $7; //@line 186 "HyMES/decrypt.c"
  $124 = $5; //@line 186 "HyMES/decrypt.c"
  $125 = (($124) + ($123<<2)|0); //@line 186 "HyMES/decrypt.c"
  $126 = HEAP32[$125>>2]|0; //@line 186 "HyMES/decrypt.c"
  $127 = ($126|0)!=(0|0); //@line 186 "HyMES/decrypt.c"
  if ($127) {
   $128 = $7; //@line 187 "HyMES/decrypt.c"
   $129 = $5; //@line 187 "HyMES/decrypt.c"
   $130 = (($129) + ($128<<2)|0); //@line 187 "HyMES/decrypt.c"
   $131 = HEAP32[$130>>2]|0; //@line 187 "HyMES/decrypt.c"
   _poly_free($131); //@line 187 "HyMES/decrypt.c"
  }
  $132 = $7; //@line 185 "HyMES/decrypt.c"
  $133 = (($132) + 1)|0; //@line 185 "HyMES/decrypt.c"
  $7 = $133; //@line 185 "HyMES/decrypt.c"
 }
 $134 = $5; //@line 188 "HyMES/decrypt.c"
 _free($134); //@line 188 "HyMES/decrypt.c"
 $135 = $9; //@line 190 "HyMES/decrypt.c"
 STACKTOP = sp;return ($135|0); //@line 190 "HyMES/decrypt.c"
}
function _partition($0,$1,$2,$3) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $4 = $0;
 $5 = $1;
 $6 = $2;
 $7 = $3;
 $10 = $5; //@line 195 "HyMES/decrypt.c"
 $8 = $10; //@line 195 "HyMES/decrypt.c"
 while(1) {
  $11 = $8; //@line 195 "HyMES/decrypt.c"
  $12 = $6; //@line 195 "HyMES/decrypt.c"
  $13 = ($11|0)<($12|0); //@line 195 "HyMES/decrypt.c"
  if (!($13)) {
   break;
  }
  $14 = $8; //@line 196 "HyMES/decrypt.c"
  $15 = $4; //@line 196 "HyMES/decrypt.c"
  $16 = (($15) + ($14<<2)|0); //@line 196 "HyMES/decrypt.c"
  $17 = HEAP32[$16>>2]|0; //@line 196 "HyMES/decrypt.c"
  $18 = $7; //@line 196 "HyMES/decrypt.c"
  $19 = ($17|0)<=($18|0); //@line 196 "HyMES/decrypt.c"
  if ($19) {
   $20 = $8; //@line 197 "HyMES/decrypt.c"
   $21 = $4; //@line 197 "HyMES/decrypt.c"
   $22 = (($21) + ($20<<2)|0); //@line 197 "HyMES/decrypt.c"
   $23 = HEAP32[$22>>2]|0; //@line 197 "HyMES/decrypt.c"
   $9 = $23; //@line 197 "HyMES/decrypt.c"
   $24 = $5; //@line 198 "HyMES/decrypt.c"
   $25 = $4; //@line 198 "HyMES/decrypt.c"
   $26 = (($25) + ($24<<2)|0); //@line 198 "HyMES/decrypt.c"
   $27 = HEAP32[$26>>2]|0; //@line 198 "HyMES/decrypt.c"
   $28 = $8; //@line 198 "HyMES/decrypt.c"
   $29 = $4; //@line 198 "HyMES/decrypt.c"
   $30 = (($29) + ($28<<2)|0); //@line 198 "HyMES/decrypt.c"
   HEAP32[$30>>2] = $27; //@line 198 "HyMES/decrypt.c"
   $31 = $9; //@line 199 "HyMES/decrypt.c"
   $32 = $5; //@line 199 "HyMES/decrypt.c"
   $33 = $4; //@line 199 "HyMES/decrypt.c"
   $34 = (($33) + ($32<<2)|0); //@line 199 "HyMES/decrypt.c"
   HEAP32[$34>>2] = $31; //@line 199 "HyMES/decrypt.c"
   $35 = $5; //@line 200 "HyMES/decrypt.c"
   $36 = (($35) + 1)|0; //@line 200 "HyMES/decrypt.c"
   $5 = $36; //@line 200 "HyMES/decrypt.c"
  }
  $37 = $8; //@line 195 "HyMES/decrypt.c"
  $38 = (($37) + 1)|0; //@line 195 "HyMES/decrypt.c"
  $8 = $38; //@line 195 "HyMES/decrypt.c"
 }
 $39 = $5; //@line 202 "HyMES/decrypt.c"
 STACKTOP = sp;return ($39|0); //@line 202 "HyMES/decrypt.c"
}
function _quickSort($0,$1,$2,$3,$4) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $5 = $0;
 $6 = $1;
 $7 = $2;
 $8 = $3;
 $9 = $4;
 $11 = $6; //@line 206 "HyMES/decrypt.c"
 $12 = $7; //@line 206 "HyMES/decrypt.c"
 $13 = (($12) - 1)|0; //@line 206 "HyMES/decrypt.c"
 $14 = ($11|0)<($13|0); //@line 206 "HyMES/decrypt.c"
 if (!($14)) {
  STACKTOP = sp;return; //@line 211 "HyMES/decrypt.c"
 }
 $15 = $5; //@line 207 "HyMES/decrypt.c"
 $16 = $6; //@line 207 "HyMES/decrypt.c"
 $17 = $7; //@line 207 "HyMES/decrypt.c"
 $18 = $9; //@line 207 "HyMES/decrypt.c"
 $19 = $8; //@line 207 "HyMES/decrypt.c"
 $20 = (($18) + ($19))|0; //@line 207 "HyMES/decrypt.c"
 $21 = (($20|0) / 2)&-1; //@line 207 "HyMES/decrypt.c"
 $22 = (_partition($15,$16,$17,$21)|0); //@line 207 "HyMES/decrypt.c"
 $10 = $22; //@line 207 "HyMES/decrypt.c"
 $23 = $5; //@line 208 "HyMES/decrypt.c"
 $24 = $6; //@line 208 "HyMES/decrypt.c"
 $25 = $10; //@line 208 "HyMES/decrypt.c"
 $26 = $8; //@line 208 "HyMES/decrypt.c"
 $27 = $9; //@line 208 "HyMES/decrypt.c"
 $28 = $8; //@line 208 "HyMES/decrypt.c"
 $29 = (($27) + ($28))|0; //@line 208 "HyMES/decrypt.c"
 $30 = (($29|0) / 2)&-1; //@line 208 "HyMES/decrypt.c"
 _quickSort($23,$24,$25,$26,$30); //@line 208 "HyMES/decrypt.c"
 $31 = $5; //@line 209 "HyMES/decrypt.c"
 $32 = $10; //@line 209 "HyMES/decrypt.c"
 $33 = $7; //@line 209 "HyMES/decrypt.c"
 $34 = $9; //@line 209 "HyMES/decrypt.c"
 $35 = $8; //@line 209 "HyMES/decrypt.c"
 $36 = (($34) + ($35))|0; //@line 209 "HyMES/decrypt.c"
 $37 = (($36|0) / 2)&-1; //@line 209 "HyMES/decrypt.c"
 $38 = $9; //@line 209 "HyMES/decrypt.c"
 _quickSort($31,$32,$33,$37,$38); //@line 209 "HyMES/decrypt.c"
 STACKTOP = sp;return; //@line 211 "HyMES/decrypt.c"
}
function _decode($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0;
 var $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0;
 var $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0;
 var $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0;
 var $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0;
 var $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0;
 var $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0;
 var $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0;
 var $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0;
 var $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0;
 var $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0;
 var $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0;
 var $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0;
 var $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = 0, $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0, $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0;
 var $370 = 0, $371 = 0, $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0, $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0;
 var $389 = 0, $39 = 0, $390 = 0, $391 = 0, $392 = 0, $393 = 0, $394 = 0, $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0, $40 = 0, $400 = 0, $401 = 0, $402 = 0, $403 = 0, $404 = 0, $405 = 0;
 var $406 = 0, $407 = 0, $408 = 0, $409 = 0, $41 = 0, $410 = 0, $411 = 0, $412 = 0, $413 = 0, $414 = 0, $415 = 0, $416 = 0, $417 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0;
 var $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0;
 var $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0;
 var $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 192|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(192|0);
 $8 = sp + 24|0;
 $9 = sp + 20|0;
 $10 = sp + 16|0;
 $14 = sp;
 $16 = sp + 56|0;
 $3 = $0;
 $4 = $1;
 (_gf_init(12)|0); //@line 219 "HyMES/decrypt.c"
 $17 = $3; //@line 220 "HyMES/decrypt.c"
 $18 = (_syndrome($17)|0); //@line 220 "HyMES/decrypt.c"
 $12 = $18; //@line 220 "HyMES/decrypt.c"
 $19 = $12; //@line 226 "HyMES/decrypt.c"
 $20 = HEAP32[2799]|0; //@line 226 "HyMES/decrypt.c"
 _poly_eeaux($10,$14,$19,$20,1); //@line 226 "HyMES/decrypt.c"
 $21 = HEAP32[2861]|0; //@line 227 "HyMES/decrypt.c"
 $22 = HEAP32[$14>>2]|0; //@line 227 "HyMES/decrypt.c"
 $23 = ((($22)) + 8|0); //@line 227 "HyMES/decrypt.c"
 $24 = HEAP32[$23>>2]|0; //@line 227 "HyMES/decrypt.c"
 $25 = HEAP16[$24>>1]|0; //@line 227 "HyMES/decrypt.c"
 $26 = $25&65535; //@line 227 "HyMES/decrypt.c"
 $27 = HEAP32[2860]|0; //@line 227 "HyMES/decrypt.c"
 $28 = (($27) + ($26<<1)|0); //@line 227 "HyMES/decrypt.c"
 $29 = HEAP16[$28>>1]|0; //@line 227 "HyMES/decrypt.c"
 $30 = $29&65535; //@line 227 "HyMES/decrypt.c"
 $31 = (($21) - ($30))|0; //@line 227 "HyMES/decrypt.c"
 $32 = HEAP32[2863]|0; //@line 227 "HyMES/decrypt.c"
 $33 = (($32) + ($31<<1)|0); //@line 227 "HyMES/decrypt.c"
 $34 = HEAP16[$33>>1]|0; //@line 227 "HyMES/decrypt.c"
 $15 = $34; //@line 227 "HyMES/decrypt.c"
 $5 = 0; //@line 228 "HyMES/decrypt.c"
 while(1) {
  $35 = $5; //@line 228 "HyMES/decrypt.c"
  $36 = HEAP32[$10>>2]|0; //@line 228 "HyMES/decrypt.c"
  $37 = HEAP32[$36>>2]|0; //@line 228 "HyMES/decrypt.c"
  $38 = ($35|0)<=($37|0); //@line 228 "HyMES/decrypt.c"
  if (!($38)) {
   break;
  }
  $39 = $5; //@line 229 "HyMES/decrypt.c"
  $40 = HEAP32[$10>>2]|0; //@line 229 "HyMES/decrypt.c"
  $41 = ((($40)) + 8|0); //@line 229 "HyMES/decrypt.c"
  $42 = HEAP32[$41>>2]|0; //@line 229 "HyMES/decrypt.c"
  $43 = (($42) + ($39<<1)|0); //@line 229 "HyMES/decrypt.c"
  $44 = HEAP16[$43>>1]|0; //@line 229 "HyMES/decrypt.c"
  $45 = $44&65535; //@line 229 "HyMES/decrypt.c"
  $46 = ($45|0)!=(0); //@line 229 "HyMES/decrypt.c"
  if ($46) {
   $47 = $15; //@line 229 "HyMES/decrypt.c"
   $48 = $47&65535; //@line 229 "HyMES/decrypt.c"
   $49 = HEAP32[2860]|0; //@line 229 "HyMES/decrypt.c"
   $50 = (($49) + ($48<<1)|0); //@line 229 "HyMES/decrypt.c"
   $51 = HEAP16[$50>>1]|0; //@line 229 "HyMES/decrypt.c"
   $52 = $51&65535; //@line 229 "HyMES/decrypt.c"
   $53 = $5; //@line 229 "HyMES/decrypt.c"
   $54 = HEAP32[$10>>2]|0; //@line 229 "HyMES/decrypt.c"
   $55 = ((($54)) + 8|0); //@line 229 "HyMES/decrypt.c"
   $56 = HEAP32[$55>>2]|0; //@line 229 "HyMES/decrypt.c"
   $57 = (($56) + ($53<<1)|0); //@line 229 "HyMES/decrypt.c"
   $58 = HEAP16[$57>>1]|0; //@line 229 "HyMES/decrypt.c"
   $59 = $58&65535; //@line 229 "HyMES/decrypt.c"
   $60 = HEAP32[2860]|0; //@line 229 "HyMES/decrypt.c"
   $61 = (($60) + ($59<<1)|0); //@line 229 "HyMES/decrypt.c"
   $62 = HEAP16[$61>>1]|0; //@line 229 "HyMES/decrypt.c"
   $63 = $62&65535; //@line 229 "HyMES/decrypt.c"
   $64 = (($52) + ($63))|0; //@line 229 "HyMES/decrypt.c"
   $65 = HEAP32[2861]|0; //@line 229 "HyMES/decrypt.c"
   $66 = $64 & $65; //@line 229 "HyMES/decrypt.c"
   $67 = $15; //@line 229 "HyMES/decrypt.c"
   $68 = $67&65535; //@line 229 "HyMES/decrypt.c"
   $69 = HEAP32[2860]|0; //@line 229 "HyMES/decrypt.c"
   $70 = (($69) + ($68<<1)|0); //@line 229 "HyMES/decrypt.c"
   $71 = HEAP16[$70>>1]|0; //@line 229 "HyMES/decrypt.c"
   $72 = $71&65535; //@line 229 "HyMES/decrypt.c"
   $73 = $5; //@line 229 "HyMES/decrypt.c"
   $74 = HEAP32[$10>>2]|0; //@line 229 "HyMES/decrypt.c"
   $75 = ((($74)) + 8|0); //@line 229 "HyMES/decrypt.c"
   $76 = HEAP32[$75>>2]|0; //@line 229 "HyMES/decrypt.c"
   $77 = (($76) + ($73<<1)|0); //@line 229 "HyMES/decrypt.c"
   $78 = HEAP16[$77>>1]|0; //@line 229 "HyMES/decrypt.c"
   $79 = $78&65535; //@line 229 "HyMES/decrypt.c"
   $80 = HEAP32[2860]|0; //@line 229 "HyMES/decrypt.c"
   $81 = (($80) + ($79<<1)|0); //@line 229 "HyMES/decrypt.c"
   $82 = HEAP16[$81>>1]|0; //@line 229 "HyMES/decrypt.c"
   $83 = $82&65535; //@line 229 "HyMES/decrypt.c"
   $84 = (($72) + ($83))|0; //@line 229 "HyMES/decrypt.c"
   $85 = HEAP32[2862]|0; //@line 229 "HyMES/decrypt.c"
   $86 = $84 >> $85; //@line 229 "HyMES/decrypt.c"
   $87 = (($66) + ($86))|0; //@line 229 "HyMES/decrypt.c"
   $88 = HEAP32[2863]|0; //@line 229 "HyMES/decrypt.c"
   $89 = (($88) + ($87<<1)|0); //@line 229 "HyMES/decrypt.c"
   $90 = HEAP16[$89>>1]|0; //@line 229 "HyMES/decrypt.c"
   $91 = $90&65535; //@line 229 "HyMES/decrypt.c"
   $93 = $91;
  } else {
   $93 = 0;
  }
  $92 = $93&65535; //@line 229 "HyMES/decrypt.c"
  $94 = $5; //@line 229 "HyMES/decrypt.c"
  $95 = HEAP32[$10>>2]|0; //@line 229 "HyMES/decrypt.c"
  $96 = ((($95)) + 8|0); //@line 229 "HyMES/decrypt.c"
  $97 = HEAP32[$96>>2]|0; //@line 229 "HyMES/decrypt.c"
  $98 = (($97) + ($94<<1)|0); //@line 229 "HyMES/decrypt.c"
  HEAP16[$98>>1] = $92; //@line 229 "HyMES/decrypt.c"
  $99 = $5; //@line 228 "HyMES/decrypt.c"
  $100 = (($99) + 1)|0; //@line 228 "HyMES/decrypt.c"
  $5 = $100; //@line 228 "HyMES/decrypt.c"
 }
 $101 = HEAP32[$14>>2]|0; //@line 230 "HyMES/decrypt.c"
 _poly_free($101); //@line 230 "HyMES/decrypt.c"
 $102 = $12; //@line 231 "HyMES/decrypt.c"
 _poly_free($102); //@line 231 "HyMES/decrypt.c"
 $103 = HEAP32[$10>>2]|0; //@line 234 "HyMES/decrypt.c"
 $104 = ((($103)) + 8|0); //@line 234 "HyMES/decrypt.c"
 $105 = HEAP32[$104>>2]|0; //@line 234 "HyMES/decrypt.c"
 $106 = ((($105)) + 2|0); //@line 234 "HyMES/decrypt.c"
 $107 = HEAP16[$106>>1]|0; //@line 234 "HyMES/decrypt.c"
 $108 = $107&65535; //@line 234 "HyMES/decrypt.c"
 $109 = $108 ^ 1; //@line 234 "HyMES/decrypt.c"
 $110 = $109&65535; //@line 234 "HyMES/decrypt.c"
 $111 = HEAP32[$10>>2]|0; //@line 234 "HyMES/decrypt.c"
 $112 = ((($111)) + 8|0); //@line 234 "HyMES/decrypt.c"
 $113 = HEAP32[$112>>2]|0; //@line 234 "HyMES/decrypt.c"
 $114 = ((($113)) + 2|0); //@line 234 "HyMES/decrypt.c"
 HEAP16[$114>>1] = $110; //@line 234 "HyMES/decrypt.c"
 $115 = (_poly_alloc(59)|0); //@line 237 "HyMES/decrypt.c"
 $13 = $115; //@line 237 "HyMES/decrypt.c"
 $5 = 0; //@line 238 "HyMES/decrypt.c"
 while(1) {
  $116 = $5; //@line 238 "HyMES/decrypt.c"
  $117 = ($116|0)<(60); //@line 238 "HyMES/decrypt.c"
  if (!($117)) {
   break;
  }
  $118 = $5; //@line 239 "HyMES/decrypt.c"
  $119 = HEAP32[$10>>2]|0; //@line 239 "HyMES/decrypt.c"
  $120 = ((($119)) + 8|0); //@line 239 "HyMES/decrypt.c"
  $121 = HEAP32[$120>>2]|0; //@line 239 "HyMES/decrypt.c"
  $122 = (($121) + ($118<<1)|0); //@line 239 "HyMES/decrypt.c"
  $123 = HEAP16[$122>>1]|0; //@line 239 "HyMES/decrypt.c"
  $124 = $123&65535; //@line 239 "HyMES/decrypt.c"
  $125 = ($124|0)!=(0); //@line 239 "HyMES/decrypt.c"
  if ($125) {
   $126 = $5; //@line 239 "HyMES/decrypt.c"
   $127 = HEAP32[$10>>2]|0; //@line 239 "HyMES/decrypt.c"
   $128 = ((($127)) + 8|0); //@line 239 "HyMES/decrypt.c"
   $129 = HEAP32[$128>>2]|0; //@line 239 "HyMES/decrypt.c"
   $130 = (($129) + ($126<<1)|0); //@line 239 "HyMES/decrypt.c"
   $131 = HEAP16[$130>>1]|0; //@line 239 "HyMES/decrypt.c"
   $132 = $131&65535; //@line 239 "HyMES/decrypt.c"
   $133 = HEAP32[2860]|0; //@line 239 "HyMES/decrypt.c"
   $134 = (($133) + ($132<<1)|0); //@line 239 "HyMES/decrypt.c"
   $135 = HEAP16[$134>>1]|0; //@line 239 "HyMES/decrypt.c"
   $136 = $135&65535; //@line 239 "HyMES/decrypt.c"
   $137 = HEAP32[2862]|0; //@line 239 "HyMES/decrypt.c"
   $138 = (($137) - 1)|0; //@line 239 "HyMES/decrypt.c"
   $139 = $136 << $138; //@line 239 "HyMES/decrypt.c"
   $140 = HEAP32[2861]|0; //@line 239 "HyMES/decrypt.c"
   $141 = $139 & $140; //@line 239 "HyMES/decrypt.c"
   $142 = $5; //@line 239 "HyMES/decrypt.c"
   $143 = HEAP32[$10>>2]|0; //@line 239 "HyMES/decrypt.c"
   $144 = ((($143)) + 8|0); //@line 239 "HyMES/decrypt.c"
   $145 = HEAP32[$144>>2]|0; //@line 239 "HyMES/decrypt.c"
   $146 = (($145) + ($142<<1)|0); //@line 239 "HyMES/decrypt.c"
   $147 = HEAP16[$146>>1]|0; //@line 239 "HyMES/decrypt.c"
   $148 = $147&65535; //@line 239 "HyMES/decrypt.c"
   $149 = HEAP32[2860]|0; //@line 239 "HyMES/decrypt.c"
   $150 = (($149) + ($148<<1)|0); //@line 239 "HyMES/decrypt.c"
   $151 = HEAP16[$150>>1]|0; //@line 239 "HyMES/decrypt.c"
   $152 = $151&65535; //@line 239 "HyMES/decrypt.c"
   $153 = HEAP32[2862]|0; //@line 239 "HyMES/decrypt.c"
   $154 = (($153) - 1)|0; //@line 239 "HyMES/decrypt.c"
   $155 = $152 << $154; //@line 239 "HyMES/decrypt.c"
   $156 = HEAP32[2862]|0; //@line 239 "HyMES/decrypt.c"
   $157 = $155 >> $156; //@line 239 "HyMES/decrypt.c"
   $158 = (($141) + ($157))|0; //@line 239 "HyMES/decrypt.c"
   $159 = HEAP32[2863]|0; //@line 239 "HyMES/decrypt.c"
   $160 = (($159) + ($158<<1)|0); //@line 239 "HyMES/decrypt.c"
   $161 = HEAP16[$160>>1]|0; //@line 239 "HyMES/decrypt.c"
   $162 = $161&65535; //@line 239 "HyMES/decrypt.c"
   $164 = $162;
  } else {
   $164 = 0;
  }
  $163 = $164&65535; //@line 239 "HyMES/decrypt.c"
  $15 = $163; //@line 239 "HyMES/decrypt.c"
  $165 = $15; //@line 240 "HyMES/decrypt.c"
  $166 = $165&65535; //@line 240 "HyMES/decrypt.c"
  $167 = ($166|0)!=(0); //@line 240 "HyMES/decrypt.c"
  L14: do {
   if ($167) {
    $168 = $5; //@line 241 "HyMES/decrypt.c"
    $169 = $168 & 1; //@line 241 "HyMES/decrypt.c"
    $170 = ($169|0)!=(0); //@line 241 "HyMES/decrypt.c"
    if (!($170)) {
     $249 = $5; //@line 246 "HyMES/decrypt.c"
     $250 = (($249|0) / 2)&-1; //@line 246 "HyMES/decrypt.c"
     $251 = $13; //@line 246 "HyMES/decrypt.c"
     $252 = ((($251)) + 8|0); //@line 246 "HyMES/decrypt.c"
     $253 = HEAP32[$252>>2]|0; //@line 246 "HyMES/decrypt.c"
     $254 = (($253) + ($250<<1)|0); //@line 246 "HyMES/decrypt.c"
     $255 = HEAP16[$254>>1]|0; //@line 246 "HyMES/decrypt.c"
     $256 = $255&65535; //@line 246 "HyMES/decrypt.c"
     $257 = $15; //@line 246 "HyMES/decrypt.c"
     $258 = $257&65535; //@line 246 "HyMES/decrypt.c"
     $259 = $256 ^ $258; //@line 246 "HyMES/decrypt.c"
     $260 = $259&65535; //@line 246 "HyMES/decrypt.c"
     $261 = $5; //@line 246 "HyMES/decrypt.c"
     $262 = (($261|0) / 2)&-1; //@line 246 "HyMES/decrypt.c"
     $263 = $13; //@line 246 "HyMES/decrypt.c"
     $264 = ((($263)) + 8|0); //@line 246 "HyMES/decrypt.c"
     $265 = HEAP32[$264>>2]|0; //@line 246 "HyMES/decrypt.c"
     $266 = (($265) + ($262<<1)|0); //@line 246 "HyMES/decrypt.c"
     HEAP16[$266>>1] = $260; //@line 246 "HyMES/decrypt.c"
     break;
    }
    $6 = 0; //@line 242 "HyMES/decrypt.c"
    while(1) {
     $171 = $6; //@line 242 "HyMES/decrypt.c"
     $172 = ($171|0)<(60); //@line 242 "HyMES/decrypt.c"
     if (!($172)) {
      break L14;
     }
     $173 = $6; //@line 243 "HyMES/decrypt.c"
     $174 = $13; //@line 243 "HyMES/decrypt.c"
     $175 = ((($174)) + 8|0); //@line 243 "HyMES/decrypt.c"
     $176 = HEAP32[$175>>2]|0; //@line 243 "HyMES/decrypt.c"
     $177 = (($176) + ($173<<1)|0); //@line 243 "HyMES/decrypt.c"
     $178 = HEAP16[$177>>1]|0; //@line 243 "HyMES/decrypt.c"
     $179 = $178&65535; //@line 243 "HyMES/decrypt.c"
     $180 = $6; //@line 243 "HyMES/decrypt.c"
     $181 = $5; //@line 243 "HyMES/decrypt.c"
     $182 = (11200 + ($181<<2)|0); //@line 243 "HyMES/decrypt.c"
     $183 = HEAP32[$182>>2]|0; //@line 243 "HyMES/decrypt.c"
     $184 = ((($183)) + 8|0); //@line 243 "HyMES/decrypt.c"
     $185 = HEAP32[$184>>2]|0; //@line 243 "HyMES/decrypt.c"
     $186 = (($185) + ($180<<1)|0); //@line 243 "HyMES/decrypt.c"
     $187 = HEAP16[$186>>1]|0; //@line 243 "HyMES/decrypt.c"
     $188 = $187&65535; //@line 243 "HyMES/decrypt.c"
     $189 = ($188|0)!=(0); //@line 243 "HyMES/decrypt.c"
     if ($189) {
      $190 = $15; //@line 243 "HyMES/decrypt.c"
      $191 = $190&65535; //@line 243 "HyMES/decrypt.c"
      $192 = HEAP32[2860]|0; //@line 243 "HyMES/decrypt.c"
      $193 = (($192) + ($191<<1)|0); //@line 243 "HyMES/decrypt.c"
      $194 = HEAP16[$193>>1]|0; //@line 243 "HyMES/decrypt.c"
      $195 = $194&65535; //@line 243 "HyMES/decrypt.c"
      $196 = $6; //@line 243 "HyMES/decrypt.c"
      $197 = $5; //@line 243 "HyMES/decrypt.c"
      $198 = (11200 + ($197<<2)|0); //@line 243 "HyMES/decrypt.c"
      $199 = HEAP32[$198>>2]|0; //@line 243 "HyMES/decrypt.c"
      $200 = ((($199)) + 8|0); //@line 243 "HyMES/decrypt.c"
      $201 = HEAP32[$200>>2]|0; //@line 243 "HyMES/decrypt.c"
      $202 = (($201) + ($196<<1)|0); //@line 243 "HyMES/decrypt.c"
      $203 = HEAP16[$202>>1]|0; //@line 243 "HyMES/decrypt.c"
      $204 = $203&65535; //@line 243 "HyMES/decrypt.c"
      $205 = HEAP32[2860]|0; //@line 243 "HyMES/decrypt.c"
      $206 = (($205) + ($204<<1)|0); //@line 243 "HyMES/decrypt.c"
      $207 = HEAP16[$206>>1]|0; //@line 243 "HyMES/decrypt.c"
      $208 = $207&65535; //@line 243 "HyMES/decrypt.c"
      $209 = (($195) + ($208))|0; //@line 243 "HyMES/decrypt.c"
      $210 = HEAP32[2861]|0; //@line 243 "HyMES/decrypt.c"
      $211 = $209 & $210; //@line 243 "HyMES/decrypt.c"
      $212 = $15; //@line 243 "HyMES/decrypt.c"
      $213 = $212&65535; //@line 243 "HyMES/decrypt.c"
      $214 = HEAP32[2860]|0; //@line 243 "HyMES/decrypt.c"
      $215 = (($214) + ($213<<1)|0); //@line 243 "HyMES/decrypt.c"
      $216 = HEAP16[$215>>1]|0; //@line 243 "HyMES/decrypt.c"
      $217 = $216&65535; //@line 243 "HyMES/decrypt.c"
      $218 = $6; //@line 243 "HyMES/decrypt.c"
      $219 = $5; //@line 243 "HyMES/decrypt.c"
      $220 = (11200 + ($219<<2)|0); //@line 243 "HyMES/decrypt.c"
      $221 = HEAP32[$220>>2]|0; //@line 243 "HyMES/decrypt.c"
      $222 = ((($221)) + 8|0); //@line 243 "HyMES/decrypt.c"
      $223 = HEAP32[$222>>2]|0; //@line 243 "HyMES/decrypt.c"
      $224 = (($223) + ($218<<1)|0); //@line 243 "HyMES/decrypt.c"
      $225 = HEAP16[$224>>1]|0; //@line 243 "HyMES/decrypt.c"
      $226 = $225&65535; //@line 243 "HyMES/decrypt.c"
      $227 = HEAP32[2860]|0; //@line 243 "HyMES/decrypt.c"
      $228 = (($227) + ($226<<1)|0); //@line 243 "HyMES/decrypt.c"
      $229 = HEAP16[$228>>1]|0; //@line 243 "HyMES/decrypt.c"
      $230 = $229&65535; //@line 243 "HyMES/decrypt.c"
      $231 = (($217) + ($230))|0; //@line 243 "HyMES/decrypt.c"
      $232 = HEAP32[2862]|0; //@line 243 "HyMES/decrypt.c"
      $233 = $231 >> $232; //@line 243 "HyMES/decrypt.c"
      $234 = (($211) + ($233))|0; //@line 243 "HyMES/decrypt.c"
      $235 = HEAP32[2863]|0; //@line 243 "HyMES/decrypt.c"
      $236 = (($235) + ($234<<1)|0); //@line 243 "HyMES/decrypt.c"
      $237 = HEAP16[$236>>1]|0; //@line 243 "HyMES/decrypt.c"
      $238 = $237&65535; //@line 243 "HyMES/decrypt.c"
      $240 = $238;
     } else {
      $240 = 0;
     }
     $239 = $179 ^ $240; //@line 243 "HyMES/decrypt.c"
     $241 = $239&65535; //@line 243 "HyMES/decrypt.c"
     $242 = $6; //@line 243 "HyMES/decrypt.c"
     $243 = $13; //@line 243 "HyMES/decrypt.c"
     $244 = ((($243)) + 8|0); //@line 243 "HyMES/decrypt.c"
     $245 = HEAP32[$244>>2]|0; //@line 243 "HyMES/decrypt.c"
     $246 = (($245) + ($242<<1)|0); //@line 243 "HyMES/decrypt.c"
     HEAP16[$246>>1] = $241; //@line 243 "HyMES/decrypt.c"
     $247 = $6; //@line 242 "HyMES/decrypt.c"
     $248 = (($247) + 1)|0; //@line 242 "HyMES/decrypt.c"
     $6 = $248; //@line 242 "HyMES/decrypt.c"
    }
   }
  } while(0);
  $267 = $5; //@line 238 "HyMES/decrypt.c"
  $268 = (($267) + 1)|0; //@line 238 "HyMES/decrypt.c"
  $5 = $268; //@line 238 "HyMES/decrypt.c"
 }
 $269 = $13; //@line 249 "HyMES/decrypt.c"
 (_poly_calcule_deg($269)|0); //@line 249 "HyMES/decrypt.c"
 $270 = HEAP32[$10>>2]|0; //@line 250 "HyMES/decrypt.c"
 _poly_free($270); //@line 250 "HyMES/decrypt.c"
 $271 = $13; //@line 253 "HyMES/decrypt.c"
 $272 = HEAP32[2799]|0; //@line 253 "HyMES/decrypt.c"
 _poly_eeaux($9,$8,$271,$272,31); //@line 253 "HyMES/decrypt.c"
 $273 = $13; //@line 254 "HyMES/decrypt.c"
 _poly_free($273); //@line 254 "HyMES/decrypt.c"
 $274 = (_poly_alloc(60)|0); //@line 257 "HyMES/decrypt.c"
 $11 = $274; //@line 257 "HyMES/decrypt.c"
 $5 = 0; //@line 258 "HyMES/decrypt.c"
 while(1) {
  $275 = $5; //@line 258 "HyMES/decrypt.c"
  $276 = HEAP32[$8>>2]|0; //@line 258 "HyMES/decrypt.c"
  $277 = HEAP32[$276>>2]|0; //@line 258 "HyMES/decrypt.c"
  $278 = ($275|0)<=($277|0); //@line 258 "HyMES/decrypt.c"
  if (!($278)) {
   break;
  }
  $279 = $5; //@line 259 "HyMES/decrypt.c"
  $280 = HEAP32[$8>>2]|0; //@line 259 "HyMES/decrypt.c"
  $281 = ((($280)) + 8|0); //@line 259 "HyMES/decrypt.c"
  $282 = HEAP32[$281>>2]|0; //@line 259 "HyMES/decrypt.c"
  $283 = (($282) + ($279<<1)|0); //@line 259 "HyMES/decrypt.c"
  $284 = HEAP16[$283>>1]|0; //@line 259 "HyMES/decrypt.c"
  $285 = $284&65535; //@line 259 "HyMES/decrypt.c"
  $286 = ($285|0)!=(0); //@line 259 "HyMES/decrypt.c"
  if ($286) {
   $287 = $5; //@line 259 "HyMES/decrypt.c"
   $288 = HEAP32[$8>>2]|0; //@line 259 "HyMES/decrypt.c"
   $289 = ((($288)) + 8|0); //@line 259 "HyMES/decrypt.c"
   $290 = HEAP32[$289>>2]|0; //@line 259 "HyMES/decrypt.c"
   $291 = (($290) + ($287<<1)|0); //@line 259 "HyMES/decrypt.c"
   $292 = HEAP16[$291>>1]|0; //@line 259 "HyMES/decrypt.c"
   $293 = $292&65535; //@line 259 "HyMES/decrypt.c"
   $294 = HEAP32[2860]|0; //@line 259 "HyMES/decrypt.c"
   $295 = (($294) + ($293<<1)|0); //@line 259 "HyMES/decrypt.c"
   $296 = HEAP16[$295>>1]|0; //@line 259 "HyMES/decrypt.c"
   $297 = $296&65535; //@line 259 "HyMES/decrypt.c"
   $298 = $297 << 1; //@line 259 "HyMES/decrypt.c"
   $299 = HEAP32[2861]|0; //@line 259 "HyMES/decrypt.c"
   $300 = $298 & $299; //@line 259 "HyMES/decrypt.c"
   $301 = $5; //@line 259 "HyMES/decrypt.c"
   $302 = HEAP32[$8>>2]|0; //@line 259 "HyMES/decrypt.c"
   $303 = ((($302)) + 8|0); //@line 259 "HyMES/decrypt.c"
   $304 = HEAP32[$303>>2]|0; //@line 259 "HyMES/decrypt.c"
   $305 = (($304) + ($301<<1)|0); //@line 259 "HyMES/decrypt.c"
   $306 = HEAP16[$305>>1]|0; //@line 259 "HyMES/decrypt.c"
   $307 = $306&65535; //@line 259 "HyMES/decrypt.c"
   $308 = HEAP32[2860]|0; //@line 259 "HyMES/decrypt.c"
   $309 = (($308) + ($307<<1)|0); //@line 259 "HyMES/decrypt.c"
   $310 = HEAP16[$309>>1]|0; //@line 259 "HyMES/decrypt.c"
   $311 = $310&65535; //@line 259 "HyMES/decrypt.c"
   $312 = $311 << 1; //@line 259 "HyMES/decrypt.c"
   $313 = HEAP32[2862]|0; //@line 259 "HyMES/decrypt.c"
   $314 = $312 >> $313; //@line 259 "HyMES/decrypt.c"
   $315 = (($300) + ($314))|0; //@line 259 "HyMES/decrypt.c"
   $316 = HEAP32[2863]|0; //@line 259 "HyMES/decrypt.c"
   $317 = (($316) + ($315<<1)|0); //@line 259 "HyMES/decrypt.c"
   $318 = HEAP16[$317>>1]|0; //@line 259 "HyMES/decrypt.c"
   $319 = $318&65535; //@line 259 "HyMES/decrypt.c"
   $321 = $319;
  } else {
   $321 = 0;
  }
  $320 = $321&65535; //@line 259 "HyMES/decrypt.c"
  $322 = $5; //@line 259 "HyMES/decrypt.c"
  $323 = $322<<1; //@line 259 "HyMES/decrypt.c"
  $324 = $11; //@line 259 "HyMES/decrypt.c"
  $325 = ((($324)) + 8|0); //@line 259 "HyMES/decrypt.c"
  $326 = HEAP32[$325>>2]|0; //@line 259 "HyMES/decrypt.c"
  $327 = (($326) + ($323<<1)|0); //@line 259 "HyMES/decrypt.c"
  HEAP16[$327>>1] = $320; //@line 259 "HyMES/decrypt.c"
  $328 = $5; //@line 258 "HyMES/decrypt.c"
  $329 = (($328) + 1)|0; //@line 258 "HyMES/decrypt.c"
  $5 = $329; //@line 258 "HyMES/decrypt.c"
 }
 $5 = 0; //@line 261 "HyMES/decrypt.c"
 while(1) {
  $330 = $5; //@line 261 "HyMES/decrypt.c"
  $331 = HEAP32[$9>>2]|0; //@line 261 "HyMES/decrypt.c"
  $332 = HEAP32[$331>>2]|0; //@line 261 "HyMES/decrypt.c"
  $333 = ($330|0)<=($332|0); //@line 261 "HyMES/decrypt.c"
  if (!($333)) {
   break;
  }
  $334 = $5; //@line 262 "HyMES/decrypt.c"
  $335 = HEAP32[$9>>2]|0; //@line 262 "HyMES/decrypt.c"
  $336 = ((($335)) + 8|0); //@line 262 "HyMES/decrypt.c"
  $337 = HEAP32[$336>>2]|0; //@line 262 "HyMES/decrypt.c"
  $338 = (($337) + ($334<<1)|0); //@line 262 "HyMES/decrypt.c"
  $339 = HEAP16[$338>>1]|0; //@line 262 "HyMES/decrypt.c"
  $340 = $339&65535; //@line 262 "HyMES/decrypt.c"
  $341 = ($340|0)!=(0); //@line 262 "HyMES/decrypt.c"
  if ($341) {
   $342 = $5; //@line 262 "HyMES/decrypt.c"
   $343 = HEAP32[$9>>2]|0; //@line 262 "HyMES/decrypt.c"
   $344 = ((($343)) + 8|0); //@line 262 "HyMES/decrypt.c"
   $345 = HEAP32[$344>>2]|0; //@line 262 "HyMES/decrypt.c"
   $346 = (($345) + ($342<<1)|0); //@line 262 "HyMES/decrypt.c"
   $347 = HEAP16[$346>>1]|0; //@line 262 "HyMES/decrypt.c"
   $348 = $347&65535; //@line 262 "HyMES/decrypt.c"
   $349 = HEAP32[2860]|0; //@line 262 "HyMES/decrypt.c"
   $350 = (($349) + ($348<<1)|0); //@line 262 "HyMES/decrypt.c"
   $351 = HEAP16[$350>>1]|0; //@line 262 "HyMES/decrypt.c"
   $352 = $351&65535; //@line 262 "HyMES/decrypt.c"
   $353 = $352 << 1; //@line 262 "HyMES/decrypt.c"
   $354 = HEAP32[2861]|0; //@line 262 "HyMES/decrypt.c"
   $355 = $353 & $354; //@line 262 "HyMES/decrypt.c"
   $356 = $5; //@line 262 "HyMES/decrypt.c"
   $357 = HEAP32[$9>>2]|0; //@line 262 "HyMES/decrypt.c"
   $358 = ((($357)) + 8|0); //@line 262 "HyMES/decrypt.c"
   $359 = HEAP32[$358>>2]|0; //@line 262 "HyMES/decrypt.c"
   $360 = (($359) + ($356<<1)|0); //@line 262 "HyMES/decrypt.c"
   $361 = HEAP16[$360>>1]|0; //@line 262 "HyMES/decrypt.c"
   $362 = $361&65535; //@line 262 "HyMES/decrypt.c"
   $363 = HEAP32[2860]|0; //@line 262 "HyMES/decrypt.c"
   $364 = (($363) + ($362<<1)|0); //@line 262 "HyMES/decrypt.c"
   $365 = HEAP16[$364>>1]|0; //@line 262 "HyMES/decrypt.c"
   $366 = $365&65535; //@line 262 "HyMES/decrypt.c"
   $367 = $366 << 1; //@line 262 "HyMES/decrypt.c"
   $368 = HEAP32[2862]|0; //@line 262 "HyMES/decrypt.c"
   $369 = $367 >> $368; //@line 262 "HyMES/decrypt.c"
   $370 = (($355) + ($369))|0; //@line 262 "HyMES/decrypt.c"
   $371 = HEAP32[2863]|0; //@line 262 "HyMES/decrypt.c"
   $372 = (($371) + ($370<<1)|0); //@line 262 "HyMES/decrypt.c"
   $373 = HEAP16[$372>>1]|0; //@line 262 "HyMES/decrypt.c"
   $374 = $373&65535; //@line 262 "HyMES/decrypt.c"
   $376 = $374;
  } else {
   $376 = 0;
  }
  $375 = $376&65535; //@line 262 "HyMES/decrypt.c"
  $377 = $5; //@line 262 "HyMES/decrypt.c"
  $378 = $377<<1; //@line 262 "HyMES/decrypt.c"
  $379 = (($378) + 1)|0; //@line 262 "HyMES/decrypt.c"
  $380 = $11; //@line 262 "HyMES/decrypt.c"
  $381 = ((($380)) + 8|0); //@line 262 "HyMES/decrypt.c"
  $382 = HEAP32[$381>>2]|0; //@line 262 "HyMES/decrypt.c"
  $383 = (($382) + ($379<<1)|0); //@line 262 "HyMES/decrypt.c"
  HEAP16[$383>>1] = $375; //@line 262 "HyMES/decrypt.c"
  $384 = $5; //@line 261 "HyMES/decrypt.c"
  $385 = (($384) + 1)|0; //@line 261 "HyMES/decrypt.c"
  $5 = $385; //@line 261 "HyMES/decrypt.c"
 }
 $386 = HEAP32[$8>>2]|0; //@line 264 "HyMES/decrypt.c"
 _poly_free($386); //@line 264 "HyMES/decrypt.c"
 $387 = HEAP32[$9>>2]|0; //@line 265 "HyMES/decrypt.c"
 _poly_free($387); //@line 265 "HyMES/decrypt.c"
 $388 = $11; //@line 267 "HyMES/decrypt.c"
 (_poly_calcule_deg($388)|0); //@line 267 "HyMES/decrypt.c"
 $389 = $11; //@line 269 "HyMES/decrypt.c"
 $390 = HEAP32[$389>>2]|0; //@line 269 "HyMES/decrypt.c"
 $7 = $390; //@line 269 "HyMES/decrypt.c"
 $391 = $7; //@line 270 "HyMES/decrypt.c"
 $392 = ($391|0)!=(60); //@line 270 "HyMES/decrypt.c"
 $393 = $11; //@line 271 "HyMES/decrypt.c"
 if ($392) {
  _poly_free($393); //@line 271 "HyMES/decrypt.c"
  $2 = -1; //@line 272 "HyMES/decrypt.c"
  $417 = $2; //@line 290 "HyMES/decrypt.c"
  STACKTOP = sp;return ($417|0); //@line 290 "HyMES/decrypt.c"
 }
 $394 = (_roots_berl($393,$16)|0); //@line 275 "HyMES/decrypt.c"
 $7 = $394; //@line 275 "HyMES/decrypt.c"
 $395 = $7; //@line 276 "HyMES/decrypt.c"
 $396 = ($395|0)!=(60); //@line 276 "HyMES/decrypt.c"
 if ($396) {
  $397 = $11; //@line 277 "HyMES/decrypt.c"
  _poly_free($397); //@line 277 "HyMES/decrypt.c"
  $2 = -1; //@line 278 "HyMES/decrypt.c"
  $417 = $2; //@line 290 "HyMES/decrypt.c"
  STACKTOP = sp;return ($417|0); //@line 290 "HyMES/decrypt.c"
 }
 $5 = 0; //@line 281 "HyMES/decrypt.c"
 while(1) {
  $398 = $5; //@line 281 "HyMES/decrypt.c"
  $399 = $7; //@line 281 "HyMES/decrypt.c"
  $400 = ($398|0)<($399|0); //@line 281 "HyMES/decrypt.c"
  if (!($400)) {
   break;
  }
  $401 = $5; //@line 282 "HyMES/decrypt.c"
  $402 = (($16) + ($401<<1)|0); //@line 282 "HyMES/decrypt.c"
  $403 = HEAP16[$402>>1]|0; //@line 282 "HyMES/decrypt.c"
  $404 = $403&65535; //@line 282 "HyMES/decrypt.c"
  $405 = HEAP32[2798]|0; //@line 282 "HyMES/decrypt.c"
  $406 = (($405) + ($404<<1)|0); //@line 282 "HyMES/decrypt.c"
  $407 = HEAP16[$406>>1]|0; //@line 282 "HyMES/decrypt.c"
  $408 = $407&65535; //@line 282 "HyMES/decrypt.c"
  $409 = $5; //@line 282 "HyMES/decrypt.c"
  $410 = $4; //@line 282 "HyMES/decrypt.c"
  $411 = (($410) + ($409<<2)|0); //@line 282 "HyMES/decrypt.c"
  HEAP32[$411>>2] = $408; //@line 282 "HyMES/decrypt.c"
  $412 = $5; //@line 281 "HyMES/decrypt.c"
  $413 = (($412) + 1)|0; //@line 281 "HyMES/decrypt.c"
  $5 = $413; //@line 281 "HyMES/decrypt.c"
 }
 $414 = $4; //@line 285 "HyMES/decrypt.c"
 _quickSort($414,0,60,0,4096); //@line 285 "HyMES/decrypt.c"
 $415 = $11; //@line 287 "HyMES/decrypt.c"
 _poly_free($415); //@line 287 "HyMES/decrypt.c"
 $416 = $7; //@line 289 "HyMES/decrypt.c"
 $2 = $416; //@line 289 "HyMES/decrypt.c"
 $417 = $2; //@line 290 "HyMES/decrypt.c"
 STACKTOP = sp;return ($417|0); //@line 290 "HyMES/decrypt.c"
}
function _decrypt_block($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $cwdata$byval_copy = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 288|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(288|0);
 $cwdata$byval_copy = sp + 260|0;
 $8 = sp;
 $4 = $0;
 $5 = $1;
 $6 = $2;
 $9 = $6; //@line 297 "HyMES/decrypt.c"
 _sk_from_string($9); //@line 297 "HyMES/decrypt.c"
 $10 = $5; //@line 300 "HyMES/decrypt.c"
 $11 = (_decode($10,$8)|0); //@line 300 "HyMES/decrypt.c"
 $7 = $11; //@line 300 "HyMES/decrypt.c"
 _sk_free(); //@line 301 "HyMES/decrypt.c"
 $12 = $7; //@line 303 "HyMES/decrypt.c"
 $13 = ($12|0)<(0); //@line 303 "HyMES/decrypt.c"
 if ($13) {
  $3 = -1; //@line 304 "HyMES/decrypt.c"
  $39 = $3; //@line 325 "HyMES/decrypt.c"
  STACKTOP = sp;return ($39|0); //@line 325 "HyMES/decrypt.c"
 }
 $7 = 0; //@line 307 "HyMES/decrypt.c"
 while(1) {
  $14 = $7; //@line 307 "HyMES/decrypt.c"
  $15 = ($14|0)<(60); //@line 307 "HyMES/decrypt.c"
  if (!($15)) {
   break;
  }
  $16 = $7; //@line 308 "HyMES/decrypt.c"
  $17 = (($8) + ($16<<2)|0); //@line 308 "HyMES/decrypt.c"
  $18 = HEAP32[$17>>2]|0; //@line 308 "HyMES/decrypt.c"
  $19 = (($18|0) % 8)&-1; //@line 308 "HyMES/decrypt.c"
  $20 = 1 << $19; //@line 308 "HyMES/decrypt.c"
  $21 = $7; //@line 308 "HyMES/decrypt.c"
  $22 = (($8) + ($21<<2)|0); //@line 308 "HyMES/decrypt.c"
  $23 = HEAP32[$22>>2]|0; //@line 308 "HyMES/decrypt.c"
  $24 = (($23|0) / 8)&-1; //@line 308 "HyMES/decrypt.c"
  $25 = $5; //@line 308 "HyMES/decrypt.c"
  $26 = (($25) + ($24)|0); //@line 308 "HyMES/decrypt.c"
  $27 = HEAP8[$26>>0]|0; //@line 308 "HyMES/decrypt.c"
  $28 = $27&255; //@line 308 "HyMES/decrypt.c"
  $29 = $28 ^ $20; //@line 308 "HyMES/decrypt.c"
  $30 = $29&255; //@line 308 "HyMES/decrypt.c"
  HEAP8[$26>>0] = $30; //@line 308 "HyMES/decrypt.c"
  $31 = $7; //@line 307 "HyMES/decrypt.c"
  $32 = (($31) + 1)|0; //@line 307 "HyMES/decrypt.c"
  $7 = $32; //@line 307 "HyMES/decrypt.c"
 }
 $33 = $4; //@line 310 "HyMES/decrypt.c"
 $34 = $5; //@line 310 "HyMES/decrypt.c"
 _memcpy(($33|0),($34|0),422)|0; //@line 310 "HyMES/decrypt.c"
 $35 = $4; //@line 315 "HyMES/decrypt.c"
 ;HEAP32[$cwdata$byval_copy>>2]=HEAP32[8>>2]|0;HEAP32[$cwdata$byval_copy+4>>2]=HEAP32[8+4>>2]|0;HEAP32[$cwdata$byval_copy+8>>2]=HEAP32[8+8>>2]|0;HEAP32[$cwdata$byval_copy+12>>2]=HEAP32[8+12>>2]|0;HEAP32[$cwdata$byval_copy+16>>2]=HEAP32[8+16>>2]|0;HEAP32[$cwdata$byval_copy+20>>2]=HEAP32[8+20>>2]|0;HEAP32[$cwdata$byval_copy+24>>2]=HEAP32[8+24>>2]|0; //@line 315 "HyMES/decrypt.c"
 $36 = (_dicho_cw2b($8,$35,3376,446,12,60,$cwdata$byval_copy)|0); //@line 315 "HyMES/decrypt.c"
 $7 = $36; //@line 315 "HyMES/decrypt.c"
 $37 = $7; //@line 321 "HyMES/decrypt.c"
 $38 = ($37|0)<(0); //@line 321 "HyMES/decrypt.c"
 if ($38) {
  $3 = -1; //@line 322 "HyMES/decrypt.c"
  $39 = $3; //@line 325 "HyMES/decrypt.c"
  STACKTOP = sp;return ($39|0); //@line 325 "HyMES/decrypt.c"
 } else {
  $3 = 1; //@line 324 "HyMES/decrypt.c"
  $39 = $3; //@line 325 "HyMES/decrypt.c"
  STACKTOP = sp;return ($39|0); //@line 325 "HyMES/decrypt.c"
 }
 return (0)|0;
}
function _liste_alloc($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $3 = (_malloc(28)|0); //@line 45 "HyMES/dicho.c"
 $2 = $3; //@line 45 "HyMES/dicho.c"
 $4 = $1; //@line 46 "HyMES/dicho.c"
 $5 = $2; //@line 46 "HyMES/dicho.c"
 $6 = ((($5)) + 24|0); //@line 46 "HyMES/dicho.c"
 HEAP32[$6>>2] = $4; //@line 46 "HyMES/dicho.c"
 $7 = $2; //@line 47 "HyMES/dicho.c"
 STACKTOP = sp;return ($7|0); //@line 47 "HyMES/dicho.c"
}
function _liste_free($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1; //@line 51 "HyMES/dicho.c"
 $3 = ($2|0)!=(0|0); //@line 51 "HyMES/dicho.c"
 if ($3) {
  $4 = $1; //@line 52 "HyMES/dicho.c"
  $5 = ((($4)) + 24|0); //@line 52 "HyMES/dicho.c"
  $6 = HEAP32[$5>>2]|0; //@line 52 "HyMES/dicho.c"
  _liste_free($6); //@line 52 "HyMES/dicho.c"
 }
 $7 = $1; //@line 53 "HyMES/dicho.c"
 _free($7); //@line 53 "HyMES/dicho.c"
 STACKTOP = sp;return; //@line 54 "HyMES/dicho.c"
}
function _is_leaf($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $3 = 0;
 var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $3; //@line 58 "HyMES/dicho.c"
 $6 = ($5|0)<(6); //@line 58 "HyMES/dicho.c"
 do {
  if ($6) {
   $7 = $4; //@line 59 "HyMES/dicho.c"
   $8 = ($7|0)<=(32); //@line 59 "HyMES/dicho.c"
   $9 = $8&1; //@line 59 "HyMES/dicho.c"
   $2 = $9; //@line 59 "HyMES/dicho.c"
  } else {
   $10 = $3; //@line 60 "HyMES/dicho.c"
   $11 = ($10|0)>(16); //@line 60 "HyMES/dicho.c"
   if ($11) {
    $12 = $4; //@line 61 "HyMES/dicho.c"
    $13 = ($12|0)<=(1); //@line 61 "HyMES/dicho.c"
    $14 = $13&1; //@line 61 "HyMES/dicho.c"
    $2 = $14; //@line 61 "HyMES/dicho.c"
    break;
   }
   $15 = $3; //@line 62 "HyMES/dicho.c"
   $16 = ($15|0)>(11); //@line 62 "HyMES/dicho.c"
   if ($16) {
    $17 = $4; //@line 63 "HyMES/dicho.c"
    $18 = ($17|0)<=(2); //@line 63 "HyMES/dicho.c"
    $19 = $18&1; //@line 63 "HyMES/dicho.c"
    $2 = $19; //@line 63 "HyMES/dicho.c"
    break;
   } else {
    $20 = $3; //@line 65 "HyMES/dicho.c"
    $21 = (($20) - 6)|0; //@line 65 "HyMES/dicho.c"
    $22 = (7216 + ($21<<2)|0); //@line 65 "HyMES/dicho.c"
    $23 = HEAP32[$22>>2]|0; //@line 65 "HyMES/dicho.c"
    $24 = $4; //@line 65 "HyMES/dicho.c"
    $25 = ($23|0)>=($24|0); //@line 65 "HyMES/dicho.c"
    $26 = $25&1; //@line 65 "HyMES/dicho.c"
    $2 = $26; //@line 65 "HyMES/dicho.c"
    break;
   }
  }
 } while(0);
 $27 = $2; //@line 66 "HyMES/dicho.c"
 STACKTOP = sp;return ($27|0); //@line 66 "HyMES/dicho.c"
}
function _cw_coder($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0;
 var $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0;
 var $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0;
 var $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = 0; //@line 169 "HyMES/dicho.c"
 $5 = $3; //@line 171 "HyMES/dicho.c"
 switch ($5|0) {
 case 4:  {
  label = 2;
  break;
 }
 case 3:  {
  label = 7;
  break;
 }
 case 2:  {
  label = 8;
  break;
 }
 case 1:  {
  break;
 }
 default: {
  $78 = $3; //@line 198 "HyMES/dicho.c"
  $79 = (($78) - 1)|0; //@line 198 "HyMES/dicho.c"
  $80 = $2; //@line 198 "HyMES/dicho.c"
  $81 = (($80) + ($79<<2)|0); //@line 198 "HyMES/dicho.c"
  $82 = HEAP32[$81>>2]|0; //@line 198 "HyMES/dicho.c"
  $83 = $3; //@line 198 "HyMES/dicho.c"
  $84 = (4924 + ($83<<2)|0); //@line 198 "HyMES/dicho.c"
  $85 = HEAP32[$84>>2]|0; //@line 198 "HyMES/dicho.c"
  $86 = (($85) + ($82<<2)|0); //@line 198 "HyMES/dicho.c"
  $87 = HEAP32[$86>>2]|0; //@line 198 "HyMES/dicho.c"
  $88 = $2; //@line 198 "HyMES/dicho.c"
  $89 = $3; //@line 198 "HyMES/dicho.c"
  $90 = (($89) - 1)|0; //@line 198 "HyMES/dicho.c"
  $91 = (_cw_coder($88,$90)|0); //@line 198 "HyMES/dicho.c"
  $92 = (($87) + ($91))|0; //@line 198 "HyMES/dicho.c"
  $4 = $92; //@line 198 "HyMES/dicho.c"
  $93 = $4; //@line 202 "HyMES/dicho.c"
  STACKTOP = sp;return ($93|0); //@line 202 "HyMES/dicho.c"
 }
 }
 L4: do {
  if ((label|0) == 2) {
   $6 = $2; //@line 173 "HyMES/dicho.c"
   $7 = ((($6)) + 12|0); //@line 173 "HyMES/dicho.c"
   $8 = HEAP32[$7>>2]|0; //@line 173 "HyMES/dicho.c"
   $9 = $2; //@line 173 "HyMES/dicho.c"
   $10 = ((($9)) + 12|0); //@line 173 "HyMES/dicho.c"
   $11 = HEAP32[$10>>2]|0; //@line 173 "HyMES/dicho.c"
   $12 = (($11) - 1)|0; //@line 173 "HyMES/dicho.c"
   $13 = Math_imul($8, $12)|0; //@line 173 "HyMES/dicho.c"
   $14 = $2; //@line 173 "HyMES/dicho.c"
   $15 = ((($14)) + 12|0); //@line 173 "HyMES/dicho.c"
   $16 = HEAP32[$15>>2]|0; //@line 173 "HyMES/dicho.c"
   $17 = (($16) - 2)|0; //@line 173 "HyMES/dicho.c"
   $18 = Math_imul($13, $17)|0; //@line 173 "HyMES/dicho.c"
   $19 = (($18|0) / 6)&-1; //@line 173 "HyMES/dicho.c"
   $4 = $19; //@line 173 "HyMES/dicho.c"
   $20 = $4; //@line 176 "HyMES/dicho.c"
   $21 = $20 & 3; //@line 176 "HyMES/dicho.c"
   switch ($21|0) {
   case 0:  {
    $22 = $4; //@line 178 "HyMES/dicho.c"
    $23 = $22 >>> 2; //@line 178 "HyMES/dicho.c"
    $4 = $23; //@line 178 "HyMES/dicho.c"
    $24 = $2; //@line 179 "HyMES/dicho.c"
    $25 = ((($24)) + 12|0); //@line 179 "HyMES/dicho.c"
    $26 = HEAP32[$25>>2]|0; //@line 179 "HyMES/dicho.c"
    $27 = (($26) - 3)|0; //@line 179 "HyMES/dicho.c"
    $28 = $4; //@line 179 "HyMES/dicho.c"
    $29 = Math_imul($28, $27)|0; //@line 179 "HyMES/dicho.c"
    $4 = $29; //@line 179 "HyMES/dicho.c"
    label = 7;
    break L4;
    break;
   }
   case 3: case 1:  {
    $30 = $2; //@line 183 "HyMES/dicho.c"
    $31 = ((($30)) + 12|0); //@line 183 "HyMES/dicho.c"
    $32 = HEAP32[$31>>2]|0; //@line 183 "HyMES/dicho.c"
    $33 = (($32) - 3)|0; //@line 183 "HyMES/dicho.c"
    $34 = $33 >> 2; //@line 183 "HyMES/dicho.c"
    $35 = $4; //@line 183 "HyMES/dicho.c"
    $36 = Math_imul($35, $34)|0; //@line 183 "HyMES/dicho.c"
    $4 = $36; //@line 183 "HyMES/dicho.c"
    label = 7;
    break L4;
    break;
   }
   case 2:  {
    $37 = $4; //@line 186 "HyMES/dicho.c"
    $38 = $37 >>> 1; //@line 186 "HyMES/dicho.c"
    $4 = $38; //@line 186 "HyMES/dicho.c"
    $39 = $2; //@line 187 "HyMES/dicho.c"
    $40 = ((($39)) + 12|0); //@line 187 "HyMES/dicho.c"
    $41 = HEAP32[$40>>2]|0; //@line 187 "HyMES/dicho.c"
    $42 = (($41) - 3)|0; //@line 187 "HyMES/dicho.c"
    $43 = $42 >> 1; //@line 187 "HyMES/dicho.c"
    $44 = $4; //@line 187 "HyMES/dicho.c"
    $45 = Math_imul($44, $43)|0; //@line 187 "HyMES/dicho.c"
    $4 = $45; //@line 187 "HyMES/dicho.c"
    label = 7;
    break L4;
    break;
   }
   default: {
    // unreachable;
   }
   }
  }
 } while(0);
 if ((label|0) == 7) {
  $46 = $2; //@line 191 "HyMES/dicho.c"
  $47 = ((($46)) + 8|0); //@line 191 "HyMES/dicho.c"
  $48 = HEAP32[$47>>2]|0; //@line 191 "HyMES/dicho.c"
  $49 = $2; //@line 191 "HyMES/dicho.c"
  $50 = ((($49)) + 8|0); //@line 191 "HyMES/dicho.c"
  $51 = HEAP32[$50>>2]|0; //@line 191 "HyMES/dicho.c"
  $52 = (($51) - 1)|0; //@line 191 "HyMES/dicho.c"
  $53 = Math_imul($48, $52)|0; //@line 191 "HyMES/dicho.c"
  $54 = (($53|0) / 2)&-1; //@line 191 "HyMES/dicho.c"
  $55 = $2; //@line 191 "HyMES/dicho.c"
  $56 = ((($55)) + 8|0); //@line 191 "HyMES/dicho.c"
  $57 = HEAP32[$56>>2]|0; //@line 191 "HyMES/dicho.c"
  $58 = (($57) - 2)|0; //@line 191 "HyMES/dicho.c"
  $59 = Math_imul($54, $58)|0; //@line 191 "HyMES/dicho.c"
  $60 = (($59>>>0) / 3)&-1; //@line 191 "HyMES/dicho.c"
  $61 = $4; //@line 191 "HyMES/dicho.c"
  $62 = (($61) + ($60))|0; //@line 191 "HyMES/dicho.c"
  $4 = $62; //@line 191 "HyMES/dicho.c"
  label = 8;
 }
 if ((label|0) == 8) {
  $63 = $2; //@line 193 "HyMES/dicho.c"
  $64 = ((($63)) + 4|0); //@line 193 "HyMES/dicho.c"
  $65 = HEAP32[$64>>2]|0; //@line 193 "HyMES/dicho.c"
  $66 = $2; //@line 193 "HyMES/dicho.c"
  $67 = ((($66)) + 4|0); //@line 193 "HyMES/dicho.c"
  $68 = HEAP32[$67>>2]|0; //@line 193 "HyMES/dicho.c"
  $69 = (($68) - 1)|0; //@line 193 "HyMES/dicho.c"
  $70 = Math_imul($65, $69)|0; //@line 193 "HyMES/dicho.c"
  $71 = (($70>>>0) / 2)&-1; //@line 193 "HyMES/dicho.c"
  $72 = $4; //@line 193 "HyMES/dicho.c"
  $73 = (($72) + ($71))|0; //@line 193 "HyMES/dicho.c"
  $4 = $73; //@line 193 "HyMES/dicho.c"
 }
 $74 = $2; //@line 195 "HyMES/dicho.c"
 $75 = HEAP32[$74>>2]|0; //@line 195 "HyMES/dicho.c"
 $76 = $4; //@line 195 "HyMES/dicho.c"
 $77 = (($76) + ($75))|0; //@line 195 "HyMES/dicho.c"
 $4 = $77; //@line 195 "HyMES/dicho.c"
 $93 = $4; //@line 202 "HyMES/dicho.c"
 STACKTOP = sp;return ($93|0); //@line 202 "HyMES/dicho.c"
}
function _inv_bino($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $2 = $0;
 $3 = $1;
 $7 = $3; //@line 210 "HyMES/dicho.c"
 $8 = (($7) - 1)|0; //@line 210 "HyMES/dicho.c"
 $4 = $8; //@line 210 "HyMES/dicho.c"
 $9 = $3; //@line 211 "HyMES/dicho.c"
 $10 = (4856 + ($9<<2)|0); //@line 211 "HyMES/dicho.c"
 $11 = HEAP32[$10>>2]|0; //@line 211 "HyMES/dicho.c"
 $5 = $11; //@line 211 "HyMES/dicho.c"
 $12 = $5; //@line 212 "HyMES/dicho.c"
 $13 = $4; //@line 212 "HyMES/dicho.c"
 $14 = (($12) + ($13))|0; //@line 212 "HyMES/dicho.c"
 $15 = (($14|0) / 2)&-1; //@line 212 "HyMES/dicho.c"
 $6 = $15; //@line 212 "HyMES/dicho.c"
 while(1) {
  $16 = $6; //@line 217 "HyMES/dicho.c"
  $17 = $4; //@line 217 "HyMES/dicho.c"
  $18 = ($16|0)>($17|0); //@line 217 "HyMES/dicho.c"
  if (!($18)) {
   break;
  }
  $19 = $2; //@line 218 "HyMES/dicho.c"
  $20 = $6; //@line 218 "HyMES/dicho.c"
  $21 = $3; //@line 218 "HyMES/dicho.c"
  $22 = (4924 + ($21<<2)|0); //@line 218 "HyMES/dicho.c"
  $23 = HEAP32[$22>>2]|0; //@line 218 "HyMES/dicho.c"
  $24 = (($23) + ($20<<2)|0); //@line 218 "HyMES/dicho.c"
  $25 = HEAP32[$24>>2]|0; //@line 218 "HyMES/dicho.c"
  $26 = ($19>>>0)<($25>>>0); //@line 218 "HyMES/dicho.c"
  $27 = $6; //@line 219 "HyMES/dicho.c"
  if ($26) {
   $5 = $27; //@line 219 "HyMES/dicho.c"
  } else {
   $4 = $27; //@line 221 "HyMES/dicho.c"
  }
  $28 = $5; //@line 222 "HyMES/dicho.c"
  $29 = $4; //@line 222 "HyMES/dicho.c"
  $30 = (($28) + ($29))|0; //@line 222 "HyMES/dicho.c"
  $31 = (($30|0) / 2)&-1; //@line 222 "HyMES/dicho.c"
  $6 = $31; //@line 222 "HyMES/dicho.c"
 }
 $32 = $4; //@line 226 "HyMES/dicho.c"
 STACKTOP = sp;return ($32|0); //@line 226 "HyMES/dicho.c"
}
function _cw_decoder($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0;
 var $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0;
 var $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0;
 var $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = +0, $27 = +0, $28 = +0, $29 = +0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0;
 var $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = +0, $49 = +0, $5 = 0, $50 = +0, $51 = +0, $52 = 0, $53 = 0, $54 = 0;
 var $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0;
 var $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = +0, $89 = +0, $9 = 0, $90 = +0;
 var $91 = +0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $8 = $3; //@line 230 "HyMES/dicho.c"
 $9 = ($8|0)==(0); //@line 230 "HyMES/dicho.c"
 if ($9) {
  while(1) {
   $10 = $4; //@line 231 "HyMES/dicho.c"
   $11 = ($10|0)>(0); //@line 231 "HyMES/dicho.c"
   if (!($11)) {
    break;
   }
   $12 = $4; //@line 232 "HyMES/dicho.c"
   $13 = (($12) + -1)|0; //@line 232 "HyMES/dicho.c"
   $4 = $13; //@line 232 "HyMES/dicho.c"
   $14 = $4; //@line 233 "HyMES/dicho.c"
   $15 = $4; //@line 233 "HyMES/dicho.c"
   $16 = $5; //@line 233 "HyMES/dicho.c"
   $17 = (($16) + ($15<<2)|0); //@line 233 "HyMES/dicho.c"
   HEAP32[$17>>2] = $14; //@line 233 "HyMES/dicho.c"
  }
  STACKTOP = sp;return; //@line 284 "HyMES/dicho.c"
 }
 $18 = $4; //@line 236 "HyMES/dicho.c"
 $19 = ($18|0)==(1); //@line 236 "HyMES/dicho.c"
 if ($19) {
  $20 = $3; //@line 237 "HyMES/dicho.c"
  $21 = $5; //@line 237 "HyMES/dicho.c"
  HEAP32[$21>>2] = $20; //@line 237 "HyMES/dicho.c"
  STACKTOP = sp;return; //@line 284 "HyMES/dicho.c"
 }
 $22 = $4; //@line 239 "HyMES/dicho.c"
 $23 = ($22|0)==(2); //@line 239 "HyMES/dicho.c"
 if ($23) {
  $24 = $3; //@line 240 "HyMES/dicho.c"
  $25 = $24<<1; //@line 240 "HyMES/dicho.c"
  $26 = (+($25>>>0)); //@line 240 "HyMES/dicho.c"
  $27 = $26 + +0.25; //@line 240 "HyMES/dicho.c"
  $28 = (+Math_sqrt((+$27))); //@line 240 "HyMES/dicho.c"
  $29 = (+_round((+$28))); //@line 240 "HyMES/dicho.c"
  $30 = (~~(($29))); //@line 240 "HyMES/dicho.c"
  $31 = $5; //@line 240 "HyMES/dicho.c"
  $32 = ((($31)) + 4|0); //@line 240 "HyMES/dicho.c"
  HEAP32[$32>>2] = $30; //@line 240 "HyMES/dicho.c"
  $33 = $3; //@line 241 "HyMES/dicho.c"
  $34 = $5; //@line 241 "HyMES/dicho.c"
  $35 = ((($34)) + 4|0); //@line 241 "HyMES/dicho.c"
  $36 = HEAP32[$35>>2]|0; //@line 241 "HyMES/dicho.c"
  $37 = $5; //@line 241 "HyMES/dicho.c"
  $38 = ((($37)) + 4|0); //@line 241 "HyMES/dicho.c"
  $39 = HEAP32[$38>>2]|0; //@line 241 "HyMES/dicho.c"
  $40 = (($39) - 1)|0; //@line 241 "HyMES/dicho.c"
  $41 = Math_imul($36, $40)|0; //@line 241 "HyMES/dicho.c"
  $42 = (($41|0) / 2)&-1; //@line 241 "HyMES/dicho.c"
  $43 = (($33) - ($42))|0; //@line 241 "HyMES/dicho.c"
  $44 = $5; //@line 241 "HyMES/dicho.c"
  HEAP32[$44>>2] = $43; //@line 241 "HyMES/dicho.c"
  STACKTOP = sp;return; //@line 284 "HyMES/dicho.c"
 }
 $45 = $4; //@line 243 "HyMES/dicho.c"
 $46 = ($45|0)==(3); //@line 243 "HyMES/dicho.c"
 if ($46) {
  $47 = $3; //@line 245 "HyMES/dicho.c"
  $48 = (+($47>>>0)); //@line 245 "HyMES/dicho.c"
  $49 = +6 * $48; //@line 245 "HyMES/dicho.c"
  $50 = (+_cbrtf($49)); //@line 245 "HyMES/dicho.c"
  $51 = +1 + $50; //@line 245 "HyMES/dicho.c"
  $52 = (~~(($51))); //@line 245 "HyMES/dicho.c"
  $53 = $5; //@line 245 "HyMES/dicho.c"
  $54 = ((($53)) + 8|0); //@line 245 "HyMES/dicho.c"
  HEAP32[$54>>2] = $52; //@line 245 "HyMES/dicho.c"
  $55 = $5; //@line 246 "HyMES/dicho.c"
  $56 = ((($55)) + 8|0); //@line 246 "HyMES/dicho.c"
  $57 = HEAP32[$56>>2]|0; //@line 246 "HyMES/dicho.c"
  $58 = $5; //@line 246 "HyMES/dicho.c"
  $59 = ((($58)) + 8|0); //@line 246 "HyMES/dicho.c"
  $60 = HEAP32[$59>>2]|0; //@line 246 "HyMES/dicho.c"
  $61 = (($60) - 1)|0; //@line 246 "HyMES/dicho.c"
  $62 = Math_imul($57, $61)|0; //@line 246 "HyMES/dicho.c"
  $63 = (($62|0) / 2)&-1; //@line 246 "HyMES/dicho.c"
  $6 = $63; //@line 246 "HyMES/dicho.c"
  $64 = $6; //@line 249 "HyMES/dicho.c"
  $65 = $5; //@line 249 "HyMES/dicho.c"
  $66 = ((($65)) + 8|0); //@line 249 "HyMES/dicho.c"
  $67 = HEAP32[$66>>2]|0; //@line 249 "HyMES/dicho.c"
  $68 = (($67) - 2)|0; //@line 249 "HyMES/dicho.c"
  $69 = Math_imul($64, $68)|0; //@line 249 "HyMES/dicho.c"
  $70 = (($69>>>0) / 3)&-1; //@line 249 "HyMES/dicho.c"
  $71 = $3; //@line 249 "HyMES/dicho.c"
  $72 = (($71) - ($70))|0; //@line 249 "HyMES/dicho.c"
  $3 = $72; //@line 249 "HyMES/dicho.c"
  $73 = $3; //@line 250 "HyMES/dicho.c"
  $74 = $6; //@line 250 "HyMES/dicho.c"
  $75 = ($73>>>0)>=($74>>>0); //@line 250 "HyMES/dicho.c"
  if ($75) {
   $76 = $5; //@line 251 "HyMES/dicho.c"
   $77 = ((($76)) + 8|0); //@line 251 "HyMES/dicho.c"
   $78 = HEAP32[$77>>2]|0; //@line 251 "HyMES/dicho.c"
   $79 = (($78) + 1)|0; //@line 251 "HyMES/dicho.c"
   HEAP32[$77>>2] = $79; //@line 251 "HyMES/dicho.c"
   $80 = $6; //@line 252 "HyMES/dicho.c"
   $81 = $3; //@line 252 "HyMES/dicho.c"
   $82 = (($81) - ($80))|0; //@line 252 "HyMES/dicho.c"
   $3 = $82; //@line 252 "HyMES/dicho.c"
  }
  $83 = $3; //@line 254 "HyMES/dicho.c"
  $84 = $5; //@line 254 "HyMES/dicho.c"
  _cw_decoder($83,2,$84); //@line 254 "HyMES/dicho.c"
  STACKTOP = sp;return; //@line 284 "HyMES/dicho.c"
 }
 $85 = $4; //@line 256 "HyMES/dicho.c"
 $86 = ($85|0)==(4); //@line 256 "HyMES/dicho.c"
 $87 = $3; //@line 258 "HyMES/dicho.c"
 if (!($86)) {
  $151 = $4; //@line 281 "HyMES/dicho.c"
  $152 = (_inv_bino($87,$151)|0); //@line 281 "HyMES/dicho.c"
  $153 = $4; //@line 281 "HyMES/dicho.c"
  $154 = (($153) - 1)|0; //@line 281 "HyMES/dicho.c"
  $155 = $5; //@line 281 "HyMES/dicho.c"
  $156 = (($155) + ($154<<2)|0); //@line 281 "HyMES/dicho.c"
  HEAP32[$156>>2] = $152; //@line 281 "HyMES/dicho.c"
  $157 = $3; //@line 282 "HyMES/dicho.c"
  $158 = $4; //@line 282 "HyMES/dicho.c"
  $159 = (($158) - 1)|0; //@line 282 "HyMES/dicho.c"
  $160 = $5; //@line 282 "HyMES/dicho.c"
  $161 = (($160) + ($159<<2)|0); //@line 282 "HyMES/dicho.c"
  $162 = HEAP32[$161>>2]|0; //@line 282 "HyMES/dicho.c"
  $163 = $4; //@line 282 "HyMES/dicho.c"
  $164 = (4924 + ($163<<2)|0); //@line 282 "HyMES/dicho.c"
  $165 = HEAP32[$164>>2]|0; //@line 282 "HyMES/dicho.c"
  $166 = (($165) + ($162<<2)|0); //@line 282 "HyMES/dicho.c"
  $167 = HEAP32[$166>>2]|0; //@line 282 "HyMES/dicho.c"
  $168 = (($157) - ($167))|0; //@line 282 "HyMES/dicho.c"
  $169 = $4; //@line 282 "HyMES/dicho.c"
  $170 = (($169) - 1)|0; //@line 282 "HyMES/dicho.c"
  $171 = $5; //@line 282 "HyMES/dicho.c"
  _cw_decoder($168,$170,$171); //@line 282 "HyMES/dicho.c"
  STACKTOP = sp;return; //@line 284 "HyMES/dicho.c"
 }
 $88 = (+($87>>>0)); //@line 258 "HyMES/dicho.c"
 $89 = +24 * $88; //@line 258 "HyMES/dicho.c"
 $90 = (+Math_pow((+$89),+0.25)); //@line 258 "HyMES/dicho.c"
 $91 = +1 + $90; //@line 258 "HyMES/dicho.c"
 $92 = (~~(($91))); //@line 258 "HyMES/dicho.c"
 $93 = $5; //@line 258 "HyMES/dicho.c"
 $94 = ((($93)) + 12|0); //@line 258 "HyMES/dicho.c"
 HEAP32[$94>>2] = $92; //@line 258 "HyMES/dicho.c"
 $95 = $5; //@line 259 "HyMES/dicho.c"
 $96 = ((($95)) + 12|0); //@line 259 "HyMES/dicho.c"
 $97 = HEAP32[$96>>2]|0; //@line 259 "HyMES/dicho.c"
 $98 = $5; //@line 259 "HyMES/dicho.c"
 $99 = ((($98)) + 12|0); //@line 259 "HyMES/dicho.c"
 $100 = HEAP32[$99>>2]|0; //@line 259 "HyMES/dicho.c"
 $101 = (($100) - 1)|0; //@line 259 "HyMES/dicho.c"
 $102 = Math_imul($97, $101)|0; //@line 259 "HyMES/dicho.c"
 $103 = $5; //@line 259 "HyMES/dicho.c"
 $104 = ((($103)) + 12|0); //@line 259 "HyMES/dicho.c"
 $105 = HEAP32[$104>>2]|0; //@line 259 "HyMES/dicho.c"
 $106 = (($105) - 2)|0; //@line 259 "HyMES/dicho.c"
 $107 = Math_imul($102, $106)|0; //@line 259 "HyMES/dicho.c"
 $108 = (($107|0) / 6)&-1; //@line 259 "HyMES/dicho.c"
 $7 = $108; //@line 259 "HyMES/dicho.c"
 $109 = $7; //@line 262 "HyMES/dicho.c"
 $110 = $109 & 3; //@line 262 "HyMES/dicho.c"
 switch ($110|0) {
 case 0:  {
  $111 = $7; //@line 264 "HyMES/dicho.c"
  $112 = $111 >>> 2; //@line 264 "HyMES/dicho.c"
  $113 = $5; //@line 264 "HyMES/dicho.c"
  $114 = ((($113)) + 12|0); //@line 264 "HyMES/dicho.c"
  $115 = HEAP32[$114>>2]|0; //@line 264 "HyMES/dicho.c"
  $116 = (($115) - 3)|0; //@line 264 "HyMES/dicho.c"
  $117 = Math_imul($112, $116)|0; //@line 264 "HyMES/dicho.c"
  $118 = $3; //@line 264 "HyMES/dicho.c"
  $119 = (($118) - ($117))|0; //@line 264 "HyMES/dicho.c"
  $3 = $119; //@line 264 "HyMES/dicho.c"
  break;
 }
 case 3: case 1:  {
  $120 = $7; //@line 268 "HyMES/dicho.c"
  $121 = $5; //@line 268 "HyMES/dicho.c"
  $122 = ((($121)) + 12|0); //@line 268 "HyMES/dicho.c"
  $123 = HEAP32[$122>>2]|0; //@line 268 "HyMES/dicho.c"
  $124 = (($123) - 3)|0; //@line 268 "HyMES/dicho.c"
  $125 = $124 >> 2; //@line 268 "HyMES/dicho.c"
  $126 = Math_imul($120, $125)|0; //@line 268 "HyMES/dicho.c"
  $127 = $3; //@line 268 "HyMES/dicho.c"
  $128 = (($127) - ($126))|0; //@line 268 "HyMES/dicho.c"
  $3 = $128; //@line 268 "HyMES/dicho.c"
  break;
 }
 case 2:  {
  $129 = $7; //@line 271 "HyMES/dicho.c"
  $130 = $129 >>> 1; //@line 271 "HyMES/dicho.c"
  $131 = $5; //@line 271 "HyMES/dicho.c"
  $132 = ((($131)) + 12|0); //@line 271 "HyMES/dicho.c"
  $133 = HEAP32[$132>>2]|0; //@line 271 "HyMES/dicho.c"
  $134 = (($133) - 3)|0; //@line 271 "HyMES/dicho.c"
  $135 = $134 >> 1; //@line 271 "HyMES/dicho.c"
  $136 = Math_imul($130, $135)|0; //@line 271 "HyMES/dicho.c"
  $137 = $3; //@line 271 "HyMES/dicho.c"
  $138 = (($137) - ($136))|0; //@line 271 "HyMES/dicho.c"
  $3 = $138; //@line 271 "HyMES/dicho.c"
  break;
 }
 default: {
  // unreachable;
 }
 }
 $139 = $3; //@line 274 "HyMES/dicho.c"
 $140 = $7; //@line 274 "HyMES/dicho.c"
 $141 = ($139>>>0)>=($140>>>0); //@line 274 "HyMES/dicho.c"
 if ($141) {
  $142 = $5; //@line 275 "HyMES/dicho.c"
  $143 = ((($142)) + 12|0); //@line 275 "HyMES/dicho.c"
  $144 = HEAP32[$143>>2]|0; //@line 275 "HyMES/dicho.c"
  $145 = (($144) + 1)|0; //@line 275 "HyMES/dicho.c"
  HEAP32[$143>>2] = $145; //@line 275 "HyMES/dicho.c"
  $146 = $7; //@line 276 "HyMES/dicho.c"
  $147 = $3; //@line 276 "HyMES/dicho.c"
  $148 = (($147) - ($146))|0; //@line 276 "HyMES/dicho.c"
  $3 = $148; //@line 276 "HyMES/dicho.c"
 }
 $149 = $3; //@line 278 "HyMES/dicho.c"
 $150 = $5; //@line 278 "HyMES/dicho.c"
 _cw_decoder($149,3,$150); //@line 278 "HyMES/dicho.c"
 STACKTOP = sp;return; //@line 284 "HyMES/dicho.c"
}
function _dicho_rec($0,$1,$2,$3,$4) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 var $$byval_copy = 0, $$byval_copy1 = 0, $$byval_copy2 = 0, $$byval_copy3 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0;
 var $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0;
 var $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0;
 var $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0;
 var $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0;
 var $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0;
 var $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $40 = 0;
 var $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0;
 var $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0;
 var $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0;
 var $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 144|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(144|0);
 $$byval_copy3 = sp + 108|0;
 $$byval_copy2 = sp + 80|0;
 $$byval_copy1 = sp + 68|0;
 $$byval_copy = sp + 40|0;
 $6 = $0;
 $7 = $1;
 $8 = $2;
 $9 = $3;
 $15 = $7; //@line 290 "HyMES/dicho.c"
 $16 = ($15|0)==(0); //@line 290 "HyMES/dicho.c"
 if ($16) {
  $5 = 0; //@line 291 "HyMES/dicho.c"
  $204 = $5; //@line 344 "HyMES/dicho.c"
  STACKTOP = sp;return ($204|0); //@line 344 "HyMES/dicho.c"
 }
 $17 = $7; //@line 293 "HyMES/dicho.c"
 $18 = $8; //@line 293 "HyMES/dicho.c"
 $19 = 1 << $18; //@line 293 "HyMES/dicho.c"
 $20 = $7; //@line 293 "HyMES/dicho.c"
 $21 = (($19) - ($20))|0; //@line 293 "HyMES/dicho.c"
 $22 = ($17|0)>($21|0); //@line 293 "HyMES/dicho.c"
 if ($22) {
  $23 = $8; //@line 294 "HyMES/dicho.c"
  $24 = 1 << $23; //@line 294 "HyMES/dicho.c"
  $25 = $7; //@line 294 "HyMES/dicho.c"
  $26 = (($24) - ($25))|0; //@line 294 "HyMES/dicho.c"
  $27 = $26<<2; //@line 294 "HyMES/dicho.c"
  $28 = (_malloc($27)|0); //@line 294 "HyMES/dicho.c"
  $14 = $28; //@line 294 "HyMES/dicho.c"
  $29 = $6; //@line 295 "HyMES/dicho.c"
  $30 = HEAP32[$29>>2]|0; //@line 295 "HyMES/dicho.c"
  $31 = $8; //@line 295 "HyMES/dicho.c"
  $32 = -1 << $31; //@line 295 "HyMES/dicho.c"
  $33 = $30 & $32; //@line 295 "HyMES/dicho.c"
  $13 = $33; //@line 295 "HyMES/dicho.c"
  $11 = 0; //@line 296 "HyMES/dicho.c"
  $12 = 0; //@line 296 "HyMES/dicho.c"
  while(1) {
   $34 = $12; //@line 296 "HyMES/dicho.c"
   $35 = $8; //@line 296 "HyMES/dicho.c"
   $36 = 1 << $35; //@line 296 "HyMES/dicho.c"
   $37 = $7; //@line 296 "HyMES/dicho.c"
   $38 = (($36) - ($37))|0; //@line 296 "HyMES/dicho.c"
   $39 = ($34|0)<($38|0); //@line 296 "HyMES/dicho.c"
   if (!($39)) {
    break;
   }
   $40 = $11; //@line 296 "HyMES/dicho.c"
   $41 = $7; //@line 296 "HyMES/dicho.c"
   $42 = ($40|0)<($41|0); //@line 296 "HyMES/dicho.c"
   if (!($42)) {
    break;
   }
   $43 = $11; //@line 297 "HyMES/dicho.c"
   $44 = $6; //@line 297 "HyMES/dicho.c"
   $45 = (($44) + ($43<<2)|0); //@line 297 "HyMES/dicho.c"
   $46 = HEAP32[$45>>2]|0; //@line 297 "HyMES/dicho.c"
   $47 = $13; //@line 297 "HyMES/dicho.c"
   $48 = ($46|0)==($47|0); //@line 297 "HyMES/dicho.c"
   if ($48) {
    $49 = $11; //@line 298 "HyMES/dicho.c"
    $50 = (($49) + 1)|0; //@line 298 "HyMES/dicho.c"
    $11 = $50; //@line 298 "HyMES/dicho.c"
   } else {
    $51 = $13; //@line 300 "HyMES/dicho.c"
    $52 = $12; //@line 300 "HyMES/dicho.c"
    $53 = $14; //@line 300 "HyMES/dicho.c"
    $54 = (($53) + ($52<<2)|0); //@line 300 "HyMES/dicho.c"
    HEAP32[$54>>2] = $51; //@line 300 "HyMES/dicho.c"
    $55 = $12; //@line 301 "HyMES/dicho.c"
    $56 = (($55) + 1)|0; //@line 301 "HyMES/dicho.c"
    $12 = $56; //@line 301 "HyMES/dicho.c"
   }
   $57 = $13; //@line 296 "HyMES/dicho.c"
   $58 = (($57) + 1)|0; //@line 296 "HyMES/dicho.c"
   $13 = $58; //@line 296 "HyMES/dicho.c"
  }
  while(1) {
   $59 = $12; //@line 303 "HyMES/dicho.c"
   $60 = $8; //@line 303 "HyMES/dicho.c"
   $61 = 1 << $60; //@line 303 "HyMES/dicho.c"
   $62 = $7; //@line 303 "HyMES/dicho.c"
   $63 = (($61) - ($62))|0; //@line 303 "HyMES/dicho.c"
   $64 = ($59|0)<($63|0); //@line 303 "HyMES/dicho.c"
   if (!($64)) {
    break;
   }
   $65 = $13; //@line 304 "HyMES/dicho.c"
   $66 = $12; //@line 304 "HyMES/dicho.c"
   $67 = $14; //@line 304 "HyMES/dicho.c"
   $68 = (($67) + ($66<<2)|0); //@line 304 "HyMES/dicho.c"
   HEAP32[$68>>2] = $65; //@line 304 "HyMES/dicho.c"
   $69 = $12; //@line 303 "HyMES/dicho.c"
   $70 = (($69) + 1)|0; //@line 303 "HyMES/dicho.c"
   $12 = $70; //@line 303 "HyMES/dicho.c"
   $71 = $13; //@line 303 "HyMES/dicho.c"
   $72 = (($71) + 1)|0; //@line 303 "HyMES/dicho.c"
   $13 = $72; //@line 303 "HyMES/dicho.c"
  }
  $73 = $14; //@line 305 "HyMES/dicho.c"
  $74 = $12; //@line 305 "HyMES/dicho.c"
  $75 = $8; //@line 305 "HyMES/dicho.c"
  $76 = $9; //@line 305 "HyMES/dicho.c"
  ;HEAP32[$$byval_copy>>2]=HEAP32[$4>>2]|0;HEAP32[$$byval_copy+4>>2]=HEAP32[$4+4>>2]|0;HEAP32[$$byval_copy+8>>2]=HEAP32[$4+8>>2]|0;HEAP32[$$byval_copy+12>>2]=HEAP32[$4+12>>2]|0;HEAP32[$$byval_copy+16>>2]=HEAP32[$4+16>>2]|0;HEAP32[$$byval_copy+20>>2]=HEAP32[$4+20>>2]|0;HEAP32[$$byval_copy+24>>2]=HEAP32[$4+24>>2]|0; //@line 305 "HyMES/dicho.c"
  $77 = (_dicho_rec($73,$74,$75,$76,$$byval_copy)|0); //@line 305 "HyMES/dicho.c"
  $13 = $77; //@line 305 "HyMES/dicho.c"
  $78 = $14; //@line 306 "HyMES/dicho.c"
  _free($78); //@line 306 "HyMES/dicho.c"
  $79 = $13; //@line 307 "HyMES/dicho.c"
  $5 = $79; //@line 307 "HyMES/dicho.c"
  $204 = $5; //@line 344 "HyMES/dicho.c"
  STACKTOP = sp;return ($204|0); //@line 344 "HyMES/dicho.c"
 }
 $80 = $7; //@line 310 "HyMES/dicho.c"
 $81 = ($80|0)==(1); //@line 310 "HyMES/dicho.c"
 if ($81) {
  $82 = HEAP32[2865]|0; //@line 311 "HyMES/dicho.c"
  $83 = (_liste_alloc($82)|0); //@line 311 "HyMES/dicho.c"
  HEAP32[2865] = $83; //@line 311 "HyMES/dicho.c"
  $84 = $8; //@line 312 "HyMES/dicho.c"
  $85 = HEAP32[2865]|0; //@line 312 "HyMES/dicho.c"
  $86 = ((($85)) + 4|0); //@line 312 "HyMES/dicho.c"
  HEAP32[$86>>2] = $84; //@line 312 "HyMES/dicho.c"
  $87 = HEAP32[2865]|0; //@line 313 "HyMES/dicho.c"
  $88 = ((($87)) + 8|0); //@line 313 "HyMES/dicho.c"
  HEAP32[$88>>2] = 1; //@line 313 "HyMES/dicho.c"
  $89 = $6; //@line 314 "HyMES/dicho.c"
  $90 = HEAP32[$89>>2]|0; //@line 314 "HyMES/dicho.c"
  $91 = $8; //@line 314 "HyMES/dicho.c"
  $92 = 1 << $91; //@line 314 "HyMES/dicho.c"
  $93 = (($92) - 1)|0; //@line 314 "HyMES/dicho.c"
  $94 = $90 & $93; //@line 314 "HyMES/dicho.c"
  $95 = HEAP32[2865]|0; //@line 314 "HyMES/dicho.c"
  $96 = ((($95)) + 16|0); //@line 314 "HyMES/dicho.c"
  HEAP32[$96>>2] = $94; //@line 314 "HyMES/dicho.c"
  $97 = $8; //@line 315 "HyMES/dicho.c"
  $98 = 1 << $97; //@line 315 "HyMES/dicho.c"
  $99 = HEAP32[2865]|0; //@line 315 "HyMES/dicho.c"
  $100 = ((($99)) + 20|0); //@line 315 "HyMES/dicho.c"
  HEAP32[$100>>2] = $98; //@line 315 "HyMES/dicho.c"
  $5 = 0; //@line 316 "HyMES/dicho.c"
  $204 = $5; //@line 344 "HyMES/dicho.c"
  STACKTOP = sp;return ($204|0); //@line 344 "HyMES/dicho.c"
 }
 $101 = $8; //@line 319 "HyMES/dicho.c"
 $102 = $7; //@line 319 "HyMES/dicho.c"
 $103 = (_is_leaf($101,$102)|0); //@line 319 "HyMES/dicho.c"
 $104 = ($103|0)!=(0); //@line 319 "HyMES/dicho.c"
 if ($104) {
  $105 = $8; //@line 320 "HyMES/dicho.c"
  $106 = -1 << $105; //@line 320 "HyMES/dicho.c"
  $107 = $106 ^ -1; //@line 320 "HyMES/dicho.c"
  $10 = $107; //@line 320 "HyMES/dicho.c"
  $11 = 0; //@line 321 "HyMES/dicho.c"
  while(1) {
   $108 = $11; //@line 321 "HyMES/dicho.c"
   $109 = $7; //@line 321 "HyMES/dicho.c"
   $110 = ($108|0)<($109|0); //@line 321 "HyMES/dicho.c"
   if (!($110)) {
    break;
   }
   $111 = $11; //@line 322 "HyMES/dicho.c"
   $112 = $6; //@line 322 "HyMES/dicho.c"
   $113 = (($112) + ($111<<2)|0); //@line 322 "HyMES/dicho.c"
   $114 = HEAP32[$113>>2]|0; //@line 322 "HyMES/dicho.c"
   $115 = $10; //@line 322 "HyMES/dicho.c"
   $116 = $114 & $115; //@line 322 "HyMES/dicho.c"
   $117 = $11; //@line 322 "HyMES/dicho.c"
   $118 = HEAP32[2866]|0; //@line 322 "HyMES/dicho.c"
   $119 = (($118) + ($117<<2)|0); //@line 322 "HyMES/dicho.c"
   HEAP32[$119>>2] = $116; //@line 322 "HyMES/dicho.c"
   $120 = $11; //@line 321 "HyMES/dicho.c"
   $121 = (($120) + 1)|0; //@line 321 "HyMES/dicho.c"
   $11 = $121; //@line 321 "HyMES/dicho.c"
  }
  $122 = HEAP32[2865]|0; //@line 323 "HyMES/dicho.c"
  $123 = (_liste_alloc($122)|0); //@line 323 "HyMES/dicho.c"
  HEAP32[2865] = $123; //@line 323 "HyMES/dicho.c"
  $124 = $7; //@line 324 "HyMES/dicho.c"
  $125 = HEAP32[2865]|0; //@line 324 "HyMES/dicho.c"
  $126 = ((($125)) + 8|0); //@line 324 "HyMES/dicho.c"
  HEAP32[$126>>2] = $124; //@line 324 "HyMES/dicho.c"
  $127 = HEAP32[2866]|0; //@line 325 "HyMES/dicho.c"
  $128 = $7; //@line 325 "HyMES/dicho.c"
  $129 = (_cw_coder($127,$128)|0); //@line 325 "HyMES/dicho.c"
  $130 = HEAP32[2865]|0; //@line 325 "HyMES/dicho.c"
  $131 = ((($130)) + 16|0); //@line 325 "HyMES/dicho.c"
  HEAP32[$131>>2] = $129; //@line 325 "HyMES/dicho.c"
  $132 = $7; //@line 326 "HyMES/dicho.c"
  $133 = $8; //@line 326 "HyMES/dicho.c"
  $134 = ((($4)) + 24|0); //@line 326 "HyMES/dicho.c"
  $135 = HEAP32[$134>>2]|0; //@line 326 "HyMES/dicho.c"
  $136 = (($135) + ($133<<2)|0); //@line 326 "HyMES/dicho.c"
  $137 = HEAP32[$136>>2]|0; //@line 326 "HyMES/dicho.c"
  $138 = (($137) + ($132<<3)|0); //@line 326 "HyMES/dicho.c"
  $139 = HEAP32[$138>>2]|0; //@line 326 "HyMES/dicho.c"
  $140 = HEAP32[2865]|0; //@line 326 "HyMES/dicho.c"
  $141 = ((($140)) + 20|0); //@line 326 "HyMES/dicho.c"
  HEAP32[$141>>2] = $139; //@line 326 "HyMES/dicho.c"
  $142 = $7; //@line 327 "HyMES/dicho.c"
  $143 = $8; //@line 327 "HyMES/dicho.c"
  $144 = ((($4)) + 24|0); //@line 327 "HyMES/dicho.c"
  $145 = HEAP32[$144>>2]|0; //@line 327 "HyMES/dicho.c"
  $146 = (($145) + ($143<<2)|0); //@line 327 "HyMES/dicho.c"
  $147 = HEAP32[$146>>2]|0; //@line 327 "HyMES/dicho.c"
  $148 = (($147) + ($142<<3)|0); //@line 327 "HyMES/dicho.c"
  $149 = ((($148)) + 4|0); //@line 327 "HyMES/dicho.c"
  $150 = HEAP32[$149>>2]|0; //@line 327 "HyMES/dicho.c"
  $151 = HEAP32[2865]|0; //@line 327 "HyMES/dicho.c"
  $152 = ((($151)) + 4|0); //@line 327 "HyMES/dicho.c"
  HEAP32[$152>>2] = $150; //@line 327 "HyMES/dicho.c"
  $5 = 0; //@line 328 "HyMES/dicho.c"
  $204 = $5; //@line 344 "HyMES/dicho.c"
  STACKTOP = sp;return ($204|0); //@line 344 "HyMES/dicho.c"
 }
 $12 = 0; //@line 331 "HyMES/dicho.c"
 while(1) {
  $153 = $12; //@line 331 "HyMES/dicho.c"
  $154 = $7; //@line 331 "HyMES/dicho.c"
  $155 = ($153|0)<($154|0); //@line 331 "HyMES/dicho.c"
  if (!($155)) {
   break;
  }
  $156 = $12; //@line 332 "HyMES/dicho.c"
  $157 = $6; //@line 332 "HyMES/dicho.c"
  $158 = (($157) + ($156<<2)|0); //@line 332 "HyMES/dicho.c"
  $159 = HEAP32[$158>>2]|0; //@line 332 "HyMES/dicho.c"
  $160 = $8; //@line 332 "HyMES/dicho.c"
  $161 = (($160) - 1)|0; //@line 332 "HyMES/dicho.c"
  $162 = 1 << $161; //@line 332 "HyMES/dicho.c"
  $163 = $159 & $162; //@line 332 "HyMES/dicho.c"
  $164 = ($163|0)!=(0); //@line 332 "HyMES/dicho.c"
  if ($164) {
   break;
  }
  $165 = $12; //@line 331 "HyMES/dicho.c"
  $166 = (($165) + 1)|0; //@line 331 "HyMES/dicho.c"
  $12 = $166; //@line 331 "HyMES/dicho.c"
 }
 $167 = $12; //@line 334 "HyMES/dicho.c"
 $168 = $7; //@line 334 "HyMES/dicho.c"
 $169 = $8; //@line 334 "HyMES/dicho.c"
 $170 = ((($4)) + 16|0); //@line 334 "HyMES/dicho.c"
 $171 = HEAP32[$170>>2]|0; //@line 334 "HyMES/dicho.c"
 $172 = (($171) + ($169<<2)|0); //@line 334 "HyMES/dicho.c"
 $173 = HEAP32[$172>>2]|0; //@line 334 "HyMES/dicho.c"
 $174 = (($168) - ($173))|0; //@line 334 "HyMES/dicho.c"
 $175 = $8; //@line 334 "HyMES/dicho.c"
 $176 = ((($4)) + 20|0); //@line 334 "HyMES/dicho.c"
 $177 = HEAP32[$176>>2]|0; //@line 334 "HyMES/dicho.c"
 $178 = (($177) + ($175<<2)|0); //@line 334 "HyMES/dicho.c"
 $179 = HEAP32[$178>>2]|0; //@line 334 "HyMES/dicho.c"
 $180 = (($179) + (($174*12)|0)|0); //@line 334 "HyMES/dicho.c"
 $181 = $9; //@line 334 "HyMES/dicho.c"
 ;HEAP32[$$byval_copy1>>2]=HEAP32[$180>>2]|0;HEAP32[$$byval_copy1+4>>2]=HEAP32[$180+4>>2]|0;HEAP32[$$byval_copy1+8>>2]=HEAP32[$180+8>>2]|0; //@line 334 "HyMES/dicho.c"
 $182 = (_coder($167,$$byval_copy1,$181)|0); //@line 334 "HyMES/dicho.c"
 $13 = $182; //@line 334 "HyMES/dicho.c"
 $183 = $6; //@line 340 "HyMES/dicho.c"
 $184 = $12; //@line 340 "HyMES/dicho.c"
 $185 = $8; //@line 340 "HyMES/dicho.c"
 $186 = (($185) - 1)|0; //@line 340 "HyMES/dicho.c"
 $187 = $9; //@line 340 "HyMES/dicho.c"
 ;HEAP32[$$byval_copy2>>2]=HEAP32[$4>>2]|0;HEAP32[$$byval_copy2+4>>2]=HEAP32[$4+4>>2]|0;HEAP32[$$byval_copy2+8>>2]=HEAP32[$4+8>>2]|0;HEAP32[$$byval_copy2+12>>2]=HEAP32[$4+12>>2]|0;HEAP32[$$byval_copy2+16>>2]=HEAP32[$4+16>>2]|0;HEAP32[$$byval_copy2+20>>2]=HEAP32[$4+20>>2]|0;HEAP32[$$byval_copy2+24>>2]=HEAP32[$4+24>>2]|0; //@line 340 "HyMES/dicho.c"
 $188 = (_dicho_rec($183,$184,$186,$187,$$byval_copy2)|0); //@line 340 "HyMES/dicho.c"
 $189 = $13; //@line 340 "HyMES/dicho.c"
 $190 = (($189) + ($188))|0; //@line 340 "HyMES/dicho.c"
 $13 = $190; //@line 340 "HyMES/dicho.c"
 $191 = $6; //@line 341 "HyMES/dicho.c"
 $192 = $12; //@line 341 "HyMES/dicho.c"
 $193 = (($191) + ($192<<2)|0); //@line 341 "HyMES/dicho.c"
 $194 = $7; //@line 341 "HyMES/dicho.c"
 $195 = $12; //@line 341 "HyMES/dicho.c"
 $196 = (($194) - ($195))|0; //@line 341 "HyMES/dicho.c"
 $197 = $8; //@line 341 "HyMES/dicho.c"
 $198 = (($197) - 1)|0; //@line 341 "HyMES/dicho.c"
 $199 = $9; //@line 341 "HyMES/dicho.c"
 ;HEAP32[$$byval_copy3>>2]=HEAP32[$4>>2]|0;HEAP32[$$byval_copy3+4>>2]=HEAP32[$4+4>>2]|0;HEAP32[$$byval_copy3+8>>2]=HEAP32[$4+8>>2]|0;HEAP32[$$byval_copy3+12>>2]=HEAP32[$4+12>>2]|0;HEAP32[$$byval_copy3+16>>2]=HEAP32[$4+16>>2]|0;HEAP32[$$byval_copy3+20>>2]=HEAP32[$4+20>>2]|0;HEAP32[$$byval_copy3+24>>2]=HEAP32[$4+24>>2]|0; //@line 341 "HyMES/dicho.c"
 $200 = (_dicho_rec($193,$196,$198,$199,$$byval_copy3)|0); //@line 341 "HyMES/dicho.c"
 $201 = $13; //@line 341 "HyMES/dicho.c"
 $202 = (($201) + ($200))|0; //@line 341 "HyMES/dicho.c"
 $13 = $202; //@line 341 "HyMES/dicho.c"
 $203 = $13; //@line 343 "HyMES/dicho.c"
 $5 = $203; //@line 343 "HyMES/dicho.c"
 $204 = $5; //@line 344 "HyMES/dicho.c"
 STACKTOP = sp;return ($204|0); //@line 344 "HyMES/dicho.c"
}
function _dicho($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$byval_copy = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0;
 var $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0;
 var $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0;
 var $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0;
 var $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0;
 var $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0;
 var $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0;
 var $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0;
 var $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(64|0);
 $$byval_copy = sp + 32|0;
 $3 = $0;
 $4 = $1;
 $11 = HEAP32[$2>>2]|0; //@line 351 "HyMES/dicho.c"
 $5 = $11; //@line 351 "HyMES/dicho.c"
 $12 = ((($2)) + 4|0); //@line 352 "HyMES/dicho.c"
 $13 = HEAP32[$12>>2]|0; //@line 352 "HyMES/dicho.c"
 $6 = $13; //@line 352 "HyMES/dicho.c"
 $14 = $6; //@line 354 "HyMES/dicho.c"
 $15 = (($14) + 1)|0; //@line 354 "HyMES/dicho.c"
 $16 = $15<<2; //@line 354 "HyMES/dicho.c"
 $17 = (_malloc($16)|0); //@line 354 "HyMES/dicho.c"
 HEAP32[2866] = $17; //@line 354 "HyMES/dicho.c"
 HEAP32[2865] = 0; //@line 355 "HyMES/dicho.c"
 $18 = $3; //@line 357 "HyMES/dicho.c"
 $19 = $6; //@line 357 "HyMES/dicho.c"
 $20 = $5; //@line 357 "HyMES/dicho.c"
 $21 = $4; //@line 357 "HyMES/dicho.c"
 ;HEAP32[$$byval_copy>>2]=HEAP32[$2>>2]|0;HEAP32[$$byval_copy+4>>2]=HEAP32[$2+4>>2]|0;HEAP32[$$byval_copy+8>>2]=HEAP32[$2+8>>2]|0;HEAP32[$$byval_copy+12>>2]=HEAP32[$2+12>>2]|0;HEAP32[$$byval_copy+16>>2]=HEAP32[$2+16>>2]|0;HEAP32[$$byval_copy+20>>2]=HEAP32[$2+20>>2]|0;HEAP32[$$byval_copy+24>>2]=HEAP32[$2+24>>2]|0; //@line 357 "HyMES/dicho.c"
 $22 = (_dicho_rec($18,$19,$20,$21,$$byval_copy)|0); //@line 357 "HyMES/dicho.c"
 $7 = $22; //@line 357 "HyMES/dicho.c"
 $8 = 0; //@line 366 "HyMES/dicho.c"
 $23 = HEAP32[2865]|0; //@line 366 "HyMES/dicho.c"
 $10 = $23; //@line 366 "HyMES/dicho.c"
 while(1) {
  $24 = $10; //@line 366 "HyMES/dicho.c"
  $25 = ($24|0)!=(0|0); //@line 366 "HyMES/dicho.c"
  if (!($25)) {
   break;
  }
  $26 = $10; //@line 367 "HyMES/dicho.c"
  $27 = ((($26)) + 4|0); //@line 367 "HyMES/dicho.c"
  $28 = HEAP32[$27>>2]|0; //@line 367 "HyMES/dicho.c"
  $29 = $8; //@line 367 "HyMES/dicho.c"
  $30 = (($29) + ($28))|0; //@line 367 "HyMES/dicho.c"
  $8 = $30; //@line 367 "HyMES/dicho.c"
  $31 = $10; //@line 366 "HyMES/dicho.c"
  $32 = ((($31)) + 24|0); //@line 366 "HyMES/dicho.c"
  $33 = HEAP32[$32>>2]|0; //@line 366 "HyMES/dicho.c"
  $10 = $33; //@line 366 "HyMES/dicho.c"
 }
 $34 = $4; //@line 376 "HyMES/dicho.c"
 $35 = ((($34)) + 12|0); //@line 376 "HyMES/dicho.c"
 $36 = HEAP32[$35>>2]|0; //@line 376 "HyMES/dicho.c"
 $37 = (_bwrite_unlocked($36)|0); //@line 376 "HyMES/dicho.c"
 $38 = $8; //@line 376 "HyMES/dicho.c"
 $39 = ($37|0)>=($38|0); //@line 376 "HyMES/dicho.c"
 $40 = $39&1; //@line 376 "HyMES/dicho.c"
 $9 = $40; //@line 376 "HyMES/dicho.c"
 $41 = $9; //@line 383 "HyMES/dicho.c"
 $42 = ($41|0)!=(0); //@line 383 "HyMES/dicho.c"
 if ($42) {
  $43 = $4; //@line 385 "HyMES/dicho.c"
  $44 = ((($43)) + 12|0); //@line 385 "HyMES/dicho.c"
  $45 = HEAP32[$44>>2]|0; //@line 385 "HyMES/dicho.c"
  $46 = $8; //@line 385 "HyMES/dicho.c"
  $47 = (0 - ($46))|0; //@line 385 "HyMES/dicho.c"
  _bwrite_decaler_fin($45,$47); //@line 385 "HyMES/dicho.c"
 }
 $48 = HEAP32[2865]|0; //@line 387 "HyMES/dicho.c"
 $10 = $48; //@line 387 "HyMES/dicho.c"
 while(1) {
  $49 = $10; //@line 387 "HyMES/dicho.c"
  $50 = ($49|0)!=(0|0); //@line 387 "HyMES/dicho.c"
  if (!($50)) {
   break;
  }
  $51 = $10; //@line 388 "HyMES/dicho.c"
  $52 = ((($51)) + 8|0); //@line 388 "HyMES/dicho.c"
  $53 = HEAP32[$52>>2]|0; //@line 388 "HyMES/dicho.c"
  $54 = ($53|0)>(1); //@line 388 "HyMES/dicho.c"
  if ($54) {
   $55 = $10; //@line 389 "HyMES/dicho.c"
   $56 = ((($55)) + 16|0); //@line 389 "HyMES/dicho.c"
   $57 = HEAP32[$56>>2]|0; //@line 389 "HyMES/dicho.c"
   $58 = $10; //@line 389 "HyMES/dicho.c"
   $59 = ((($58)) + 4|0); //@line 389 "HyMES/dicho.c"
   $60 = HEAP32[$59>>2]|0; //@line 389 "HyMES/dicho.c"
   $61 = $57 >>> $60; //@line 389 "HyMES/dicho.c"
   $62 = $10; //@line 389 "HyMES/dicho.c"
   $63 = ((($62)) + 20|0); //@line 389 "HyMES/dicho.c"
   $64 = HEAP32[$63>>2]|0; //@line 389 "HyMES/dicho.c"
   $65 = $4; //@line 389 "HyMES/dicho.c"
   $66 = (_coder_uniforme($61,$64,$65)|0); //@line 389 "HyMES/dicho.c"
   $67 = $7; //@line 389 "HyMES/dicho.c"
   $68 = (($67) + ($66))|0; //@line 389 "HyMES/dicho.c"
   $7 = $68; //@line 389 "HyMES/dicho.c"
   $69 = $10; //@line 390 "HyMES/dicho.c"
   $70 = ((($69)) + 4|0); //@line 390 "HyMES/dicho.c"
   $71 = HEAP32[$70>>2]|0; //@line 390 "HyMES/dicho.c"
   $72 = 1 << $71; //@line 390 "HyMES/dicho.c"
   $73 = (($72) - 1)|0; //@line 390 "HyMES/dicho.c"
   $74 = $10; //@line 390 "HyMES/dicho.c"
   $75 = ((($74)) + 16|0); //@line 390 "HyMES/dicho.c"
   $76 = HEAP32[$75>>2]|0; //@line 390 "HyMES/dicho.c"
   $77 = $76 & $73; //@line 390 "HyMES/dicho.c"
   HEAP32[$75>>2] = $77; //@line 390 "HyMES/dicho.c"
  }
  $78 = $10; //@line 387 "HyMES/dicho.c"
  $79 = ((($78)) + 24|0); //@line 387 "HyMES/dicho.c"
  $80 = HEAP32[$79>>2]|0; //@line 387 "HyMES/dicho.c"
  $10 = $80; //@line 387 "HyMES/dicho.c"
 }
 $81 = $9; //@line 398 "HyMES/dicho.c"
 $82 = ($81|0)!=(0); //@line 398 "HyMES/dicho.c"
 L15: do {
  if (!($82)) {
   $83 = HEAP32[2865]|0; //@line 399 "HyMES/dicho.c"
   $10 = $83; //@line 399 "HyMES/dicho.c"
   while(1) {
    $84 = $10; //@line 399 "HyMES/dicho.c"
    $85 = ($84|0)!=(0|0); //@line 399 "HyMES/dicho.c"
    if (!($85)) {
     break L15;
    }
    while(1) {
     $86 = $10; //@line 400 "HyMES/dicho.c"
     $87 = ((($86)) + 4|0); //@line 400 "HyMES/dicho.c"
     $88 = HEAP32[$87>>2]|0; //@line 400 "HyMES/dicho.c"
     $89 = ($88|0)>(11); //@line 400 "HyMES/dicho.c"
     $90 = $10; //@line 401 "HyMES/dicho.c"
     if (!($89)) {
      break;
     }
     $91 = ((($90)) + 4|0); //@line 401 "HyMES/dicho.c"
     $92 = HEAP32[$91>>2]|0; //@line 401 "HyMES/dicho.c"
     $93 = (($92) - 11)|0; //@line 401 "HyMES/dicho.c"
     HEAP32[$91>>2] = $93; //@line 401 "HyMES/dicho.c"
     $94 = $10; //@line 402 "HyMES/dicho.c"
     $95 = ((($94)) + 16|0); //@line 402 "HyMES/dicho.c"
     $96 = HEAP32[$95>>2]|0; //@line 402 "HyMES/dicho.c"
     $97 = $10; //@line 402 "HyMES/dicho.c"
     $98 = ((($97)) + 4|0); //@line 402 "HyMES/dicho.c"
     $99 = HEAP32[$98>>2]|0; //@line 402 "HyMES/dicho.c"
     $100 = $96 >>> $99; //@line 402 "HyMES/dicho.c"
     $101 = $4; //@line 402 "HyMES/dicho.c"
     $102 = (_coder_uniforme($100,2048,$101)|0); //@line 402 "HyMES/dicho.c"
     $103 = $7; //@line 402 "HyMES/dicho.c"
     $104 = (($103) + ($102))|0; //@line 402 "HyMES/dicho.c"
     $7 = $104; //@line 402 "HyMES/dicho.c"
     $105 = $10; //@line 403 "HyMES/dicho.c"
     $106 = ((($105)) + 4|0); //@line 403 "HyMES/dicho.c"
     $107 = HEAP32[$106>>2]|0; //@line 403 "HyMES/dicho.c"
     $108 = 1 << $107; //@line 403 "HyMES/dicho.c"
     $109 = (($108) - 1)|0; //@line 403 "HyMES/dicho.c"
     $110 = $10; //@line 403 "HyMES/dicho.c"
     $111 = ((($110)) + 16|0); //@line 403 "HyMES/dicho.c"
     $112 = HEAP32[$111>>2]|0; //@line 403 "HyMES/dicho.c"
     $113 = $112 & $109; //@line 403 "HyMES/dicho.c"
     HEAP32[$111>>2] = $113; //@line 403 "HyMES/dicho.c"
    }
    $114 = ((($90)) + 16|0); //@line 405 "HyMES/dicho.c"
    $115 = HEAP32[$114>>2]|0; //@line 405 "HyMES/dicho.c"
    $116 = $10; //@line 405 "HyMES/dicho.c"
    $117 = ((($116)) + 4|0); //@line 405 "HyMES/dicho.c"
    $118 = HEAP32[$117>>2]|0; //@line 405 "HyMES/dicho.c"
    $119 = 1 << $118; //@line 405 "HyMES/dicho.c"
    $120 = $4; //@line 405 "HyMES/dicho.c"
    $121 = (_coder_uniforme($115,$119,$120)|0); //@line 405 "HyMES/dicho.c"
    $122 = $7; //@line 405 "HyMES/dicho.c"
    $123 = (($122) + ($121))|0; //@line 405 "HyMES/dicho.c"
    $7 = $123; //@line 405 "HyMES/dicho.c"
    $124 = $10; //@line 399 "HyMES/dicho.c"
    $125 = ((($124)) + 24|0); //@line 399 "HyMES/dicho.c"
    $126 = HEAP32[$125>>2]|0; //@line 399 "HyMES/dicho.c"
    $10 = $126; //@line 399 "HyMES/dicho.c"
   }
  }
 } while(0);
 $127 = $4; //@line 409 "HyMES/dicho.c"
 $128 = ((($127)) + 4|0); //@line 409 "HyMES/dicho.c"
 $129 = HEAP32[$128>>2]|0; //@line 409 "HyMES/dicho.c"
 $130 = ($129|0)==(0); //@line 409 "HyMES/dicho.c"
 $131 = $4; //@line 410 "HyMES/dicho.c"
 $132 = ((($131)) + 12|0); //@line 410 "HyMES/dicho.c"
 $133 = HEAP32[$132>>2]|0; //@line 410 "HyMES/dicho.c"
 if ($130) {
  _bwrite_bit(0,$133); //@line 410 "HyMES/dicho.c"
 } else {
  _bwrite_bit(1,$133); //@line 412 "HyMES/dicho.c"
  $134 = $4; //@line 413 "HyMES/dicho.c"
  $135 = HEAP32[$134>>2]|0; //@line 413 "HyMES/dicho.c"
  $136 = $4; //@line 413 "HyMES/dicho.c"
  $137 = ((($136)) + 12|0); //@line 413 "HyMES/dicho.c"
  $138 = HEAP32[$137>>2]|0; //@line 413 "HyMES/dicho.c"
  _bwrite_bits(0,$135,$138); //@line 413 "HyMES/dicho.c"
 }
 $139 = $7; //@line 415 "HyMES/dicho.c"
 $140 = (($139) + 1)|0; //@line 415 "HyMES/dicho.c"
 $7 = $140; //@line 415 "HyMES/dicho.c"
 $141 = $9; //@line 417 "HyMES/dicho.c"
 $142 = ($141|0)!=(0); //@line 417 "HyMES/dicho.c"
 if (!($142)) {
  $175 = HEAP32[2866]|0; //@line 436 "HyMES/dicho.c"
  _free($175); //@line 436 "HyMES/dicho.c"
  $176 = HEAP32[2865]|0; //@line 437 "HyMES/dicho.c"
  _liste_free($176); //@line 437 "HyMES/dicho.c"
  $177 = $7; //@line 439 "HyMES/dicho.c"
  STACKTOP = sp;return ($177|0); //@line 439 "HyMES/dicho.c"
 }
 $143 = $4; //@line 419 "HyMES/dicho.c"
 $144 = ((($143)) + 12|0); //@line 419 "HyMES/dicho.c"
 $145 = HEAP32[$144>>2]|0; //@line 419 "HyMES/dicho.c"
 $146 = $8; //@line 419 "HyMES/dicho.c"
 _bwrite_decaler_fin($145,$146); //@line 419 "HyMES/dicho.c"
 $147 = $4; //@line 422 "HyMES/dicho.c"
 $148 = ((($147)) + 12|0); //@line 422 "HyMES/dicho.c"
 $149 = HEAP32[$148>>2]|0; //@line 422 "HyMES/dicho.c"
 $150 = $4; //@line 422 "HyMES/dicho.c"
 $151 = ((($150)) + 12|0); //@line 422 "HyMES/dicho.c"
 $152 = HEAP32[$151>>2]|0; //@line 422 "HyMES/dicho.c"
 $153 = ((($152)) + 16|0); //@line 422 "HyMES/dicho.c"
 $154 = HEAP32[$153>>2]|0; //@line 422 "HyMES/dicho.c"
 $155 = $8; //@line 422 "HyMES/dicho.c"
 $156 = (($154) - ($155))|0; //@line 422 "HyMES/dicho.c"
 _bwrite_changer_position($149,$156); //@line 422 "HyMES/dicho.c"
 $157 = HEAP32[2865]|0; //@line 424 "HyMES/dicho.c"
 $10 = $157; //@line 424 "HyMES/dicho.c"
 while(1) {
  $158 = $10; //@line 424 "HyMES/dicho.c"
  $159 = ($158|0)!=(0|0); //@line 424 "HyMES/dicho.c"
  if (!($159)) {
   break;
  }
  $160 = $10; //@line 425 "HyMES/dicho.c"
  $161 = ((($160)) + 16|0); //@line 425 "HyMES/dicho.c"
  $162 = HEAP32[$161>>2]|0; //@line 425 "HyMES/dicho.c"
  $163 = $10; //@line 425 "HyMES/dicho.c"
  $164 = ((($163)) + 4|0); //@line 425 "HyMES/dicho.c"
  $165 = HEAP32[$164>>2]|0; //@line 425 "HyMES/dicho.c"
  $166 = $4; //@line 425 "HyMES/dicho.c"
  $167 = ((($166)) + 12|0); //@line 425 "HyMES/dicho.c"
  $168 = HEAP32[$167>>2]|0; //@line 425 "HyMES/dicho.c"
  _bwrite($162,$165,$168); //@line 425 "HyMES/dicho.c"
  $169 = $10; //@line 424 "HyMES/dicho.c"
  $170 = ((($169)) + 24|0); //@line 424 "HyMES/dicho.c"
  $171 = HEAP32[$170>>2]|0; //@line 424 "HyMES/dicho.c"
  $10 = $171; //@line 424 "HyMES/dicho.c"
 }
 $172 = $8; //@line 427 "HyMES/dicho.c"
 $173 = $7; //@line 427 "HyMES/dicho.c"
 $174 = (($173) + ($172))|0; //@line 427 "HyMES/dicho.c"
 $7 = $174; //@line 427 "HyMES/dicho.c"
 $175 = HEAP32[2866]|0; //@line 436 "HyMES/dicho.c"
 _free($175); //@line 436 "HyMES/dicho.c"
 $176 = HEAP32[2865]|0; //@line 437 "HyMES/dicho.c"
 _liste_free($176); //@line 437 "HyMES/dicho.c"
 $177 = $7; //@line 439 "HyMES/dicho.c"
 STACKTOP = sp;return ($177|0); //@line 439 "HyMES/dicho.c"
}
function _dichoinv_rec($0,$1,$2,$3,$4,$5) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 $5 = $5|0;
 var $$byval_copy = 0, $$byval_copy1 = 0, $$byval_copy2 = 0, $$byval_copy3 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0;
 var $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0;
 var $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0;
 var $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0;
 var $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0;
 var $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 128|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(128|0);
 $$byval_copy3 = sp + 100|0;
 $$byval_copy2 = sp + 72|0;
 $$byval_copy1 = sp + 60|0;
 $$byval_copy = sp + 32|0;
 $12 = sp + 4|0;
 $7 = $0;
 $8 = $1;
 $9 = $2;
 $10 = $3;
 $11 = $4;
 $14 = $8; //@line 445 "HyMES/dicho.c"
 $15 = ($14|0)==(0); //@line 445 "HyMES/dicho.c"
 if ($15) {
  $6 = 0; //@line 446 "HyMES/dicho.c"
  $141 = $6; //@line 487 "HyMES/dicho.c"
  STACKTOP = sp;return ($141|0); //@line 487 "HyMES/dicho.c"
 }
 $16 = $8; //@line 448 "HyMES/dicho.c"
 $17 = $9; //@line 448 "HyMES/dicho.c"
 $18 = 1 << $17; //@line 448 "HyMES/dicho.c"
 $19 = $8; //@line 448 "HyMES/dicho.c"
 $20 = (($18) - ($19))|0; //@line 448 "HyMES/dicho.c"
 $21 = ($16|0)>($20|0); //@line 448 "HyMES/dicho.c"
 if ($21) {
  $22 = HEAP32[2867]|0; //@line 449 "HyMES/dicho.c"
  $23 = (_liste_alloc($22)|0); //@line 449 "HyMES/dicho.c"
  HEAP32[2867] = $23; //@line 449 "HyMES/dicho.c"
  $24 = $8; //@line 450 "HyMES/dicho.c"
  $25 = HEAP32[2867]|0; //@line 450 "HyMES/dicho.c"
  $26 = ((($25)) + 8|0); //@line 450 "HyMES/dicho.c"
  HEAP32[$26>>2] = $24; //@line 450 "HyMES/dicho.c"
  $27 = $7; //@line 451 "HyMES/dicho.c"
  $28 = HEAP32[2867]|0; //@line 451 "HyMES/dicho.c"
  HEAP32[$28>>2] = $27; //@line 451 "HyMES/dicho.c"
  $29 = $9; //@line 452 "HyMES/dicho.c"
  $30 = HEAP32[2867]|0; //@line 452 "HyMES/dicho.c"
  $31 = ((($30)) + 4|0); //@line 452 "HyMES/dicho.c"
  HEAP32[$31>>2] = $29; //@line 452 "HyMES/dicho.c"
  $32 = $10; //@line 453 "HyMES/dicho.c"
  $33 = HEAP32[2867]|0; //@line 453 "HyMES/dicho.c"
  $34 = ((($33)) + 12|0); //@line 453 "HyMES/dicho.c"
  HEAP32[$34>>2] = $32; //@line 453 "HyMES/dicho.c"
  $35 = $7; //@line 454 "HyMES/dicho.c"
  $36 = $9; //@line 454 "HyMES/dicho.c"
  $37 = 1 << $36; //@line 454 "HyMES/dicho.c"
  $38 = $8; //@line 454 "HyMES/dicho.c"
  $39 = (($37) - ($38))|0; //@line 454 "HyMES/dicho.c"
  $40 = $9; //@line 454 "HyMES/dicho.c"
  $41 = $10; //@line 454 "HyMES/dicho.c"
  $42 = $11; //@line 454 "HyMES/dicho.c"
  ;HEAP32[$$byval_copy>>2]=HEAP32[$5>>2]|0;HEAP32[$$byval_copy+4>>2]=HEAP32[$5+4>>2]|0;HEAP32[$$byval_copy+8>>2]=HEAP32[$5+8>>2]|0;HEAP32[$$byval_copy+12>>2]=HEAP32[$5+12>>2]|0;HEAP32[$$byval_copy+16>>2]=HEAP32[$5+16>>2]|0;HEAP32[$$byval_copy+20>>2]=HEAP32[$5+20>>2]|0;HEAP32[$$byval_copy+24>>2]=HEAP32[$5+24>>2]|0; //@line 454 "HyMES/dicho.c"
  $43 = (_dichoinv_rec($35,$39,$40,$41,$42,$$byval_copy)|0); //@line 454 "HyMES/dicho.c"
  $6 = $43; //@line 454 "HyMES/dicho.c"
  $141 = $6; //@line 487 "HyMES/dicho.c"
  STACKTOP = sp;return ($141|0); //@line 487 "HyMES/dicho.c"
 }
 $44 = $8; //@line 457 "HyMES/dicho.c"
 $45 = ($44|0)==(1); //@line 457 "HyMES/dicho.c"
 if ($45) {
  $46 = HEAP32[2865]|0; //@line 458 "HyMES/dicho.c"
  $47 = (_liste_alloc($46)|0); //@line 458 "HyMES/dicho.c"
  HEAP32[2865] = $47; //@line 458 "HyMES/dicho.c"
  $48 = $7; //@line 459 "HyMES/dicho.c"
  $49 = HEAP32[2865]|0; //@line 459 "HyMES/dicho.c"
  HEAP32[$49>>2] = $48; //@line 459 "HyMES/dicho.c"
  $50 = HEAP32[2865]|0; //@line 460 "HyMES/dicho.c"
  $51 = ((($50)) + 8|0); //@line 460 "HyMES/dicho.c"
  HEAP32[$51>>2] = 1; //@line 460 "HyMES/dicho.c"
  $52 = $9; //@line 461 "HyMES/dicho.c"
  $53 = HEAP32[2865]|0; //@line 461 "HyMES/dicho.c"
  $54 = ((($53)) + 4|0); //@line 461 "HyMES/dicho.c"
  HEAP32[$54>>2] = $52; //@line 461 "HyMES/dicho.c"
  $55 = HEAP32[2865]|0; //@line 462 "HyMES/dicho.c"
  $56 = ((($55)) + 16|0); //@line 462 "HyMES/dicho.c"
  HEAP32[$56>>2] = 0; //@line 462 "HyMES/dicho.c"
  $57 = $10; //@line 463 "HyMES/dicho.c"
  $58 = HEAP32[2865]|0; //@line 463 "HyMES/dicho.c"
  $59 = ((($58)) + 12|0); //@line 463 "HyMES/dicho.c"
  HEAP32[$59>>2] = $57; //@line 463 "HyMES/dicho.c"
  $60 = $9; //@line 464 "HyMES/dicho.c"
  $61 = 1 << $60; //@line 464 "HyMES/dicho.c"
  $62 = HEAP32[2865]|0; //@line 464 "HyMES/dicho.c"
  $63 = ((($62)) + 20|0); //@line 464 "HyMES/dicho.c"
  HEAP32[$63>>2] = $61; //@line 464 "HyMES/dicho.c"
  $6 = 0; //@line 465 "HyMES/dicho.c"
  $141 = $6; //@line 487 "HyMES/dicho.c"
  STACKTOP = sp;return ($141|0); //@line 487 "HyMES/dicho.c"
 }
 $64 = $9; //@line 468 "HyMES/dicho.c"
 $65 = $8; //@line 468 "HyMES/dicho.c"
 $66 = (_is_leaf($64,$65)|0); //@line 468 "HyMES/dicho.c"
 $67 = ($66|0)!=(0); //@line 468 "HyMES/dicho.c"
 if ($67) {
  $68 = HEAP32[2865]|0; //@line 469 "HyMES/dicho.c"
  $69 = (_liste_alloc($68)|0); //@line 469 "HyMES/dicho.c"
  HEAP32[2865] = $69; //@line 469 "HyMES/dicho.c"
  $70 = $7; //@line 470 "HyMES/dicho.c"
  $71 = HEAP32[2865]|0; //@line 470 "HyMES/dicho.c"
  HEAP32[$71>>2] = $70; //@line 470 "HyMES/dicho.c"
  $72 = $8; //@line 471 "HyMES/dicho.c"
  $73 = HEAP32[2865]|0; //@line 471 "HyMES/dicho.c"
  $74 = ((($73)) + 8|0); //@line 471 "HyMES/dicho.c"
  HEAP32[$74>>2] = $72; //@line 471 "HyMES/dicho.c"
  $75 = $10; //@line 472 "HyMES/dicho.c"
  $76 = HEAP32[2865]|0; //@line 472 "HyMES/dicho.c"
  $77 = ((($76)) + 12|0); //@line 472 "HyMES/dicho.c"
  HEAP32[$77>>2] = $75; //@line 472 "HyMES/dicho.c"
  $78 = $8; //@line 473 "HyMES/dicho.c"
  $79 = $9; //@line 473 "HyMES/dicho.c"
  $80 = ((($5)) + 24|0); //@line 473 "HyMES/dicho.c"
  $81 = HEAP32[$80>>2]|0; //@line 473 "HyMES/dicho.c"
  $82 = (($81) + ($79<<2)|0); //@line 473 "HyMES/dicho.c"
  $83 = HEAP32[$82>>2]|0; //@line 473 "HyMES/dicho.c"
  $84 = (($83) + ($78<<3)|0); //@line 473 "HyMES/dicho.c"
  $85 = HEAP32[$84>>2]|0; //@line 473 "HyMES/dicho.c"
  $86 = HEAP32[2865]|0; //@line 473 "HyMES/dicho.c"
  $87 = ((($86)) + 20|0); //@line 473 "HyMES/dicho.c"
  HEAP32[$87>>2] = $85; //@line 473 "HyMES/dicho.c"
  $88 = $8; //@line 474 "HyMES/dicho.c"
  $89 = $9; //@line 474 "HyMES/dicho.c"
  $90 = ((($5)) + 24|0); //@line 474 "HyMES/dicho.c"
  $91 = HEAP32[$90>>2]|0; //@line 474 "HyMES/dicho.c"
  $92 = (($91) + ($89<<2)|0); //@line 474 "HyMES/dicho.c"
  $93 = HEAP32[$92>>2]|0; //@line 474 "HyMES/dicho.c"
  $94 = (($93) + ($88<<3)|0); //@line 474 "HyMES/dicho.c"
  $95 = ((($94)) + 4|0); //@line 474 "HyMES/dicho.c"
  $96 = HEAP32[$95>>2]|0; //@line 474 "HyMES/dicho.c"
  $97 = HEAP32[2865]|0; //@line 474 "HyMES/dicho.c"
  $98 = ((($97)) + 4|0); //@line 474 "HyMES/dicho.c"
  HEAP32[$98>>2] = $96; //@line 474 "HyMES/dicho.c"
  $6 = 0; //@line 475 "HyMES/dicho.c"
  $141 = $6; //@line 487 "HyMES/dicho.c"
  STACKTOP = sp;return ($141|0); //@line 487 "HyMES/dicho.c"
 } else {
  $99 = $8; //@line 478 "HyMES/dicho.c"
  $100 = $9; //@line 478 "HyMES/dicho.c"
  $101 = ((($5)) + 16|0); //@line 478 "HyMES/dicho.c"
  $102 = HEAP32[$101>>2]|0; //@line 478 "HyMES/dicho.c"
  $103 = (($102) + ($100<<2)|0); //@line 478 "HyMES/dicho.c"
  $104 = HEAP32[$103>>2]|0; //@line 478 "HyMES/dicho.c"
  $105 = (($99) - ($104))|0; //@line 478 "HyMES/dicho.c"
  $106 = $9; //@line 478 "HyMES/dicho.c"
  $107 = ((($5)) + 20|0); //@line 478 "HyMES/dicho.c"
  $108 = HEAP32[$107>>2]|0; //@line 478 "HyMES/dicho.c"
  $109 = (($108) + ($106<<2)|0); //@line 478 "HyMES/dicho.c"
  $110 = HEAP32[$109>>2]|0; //@line 478 "HyMES/dicho.c"
  $111 = (($110) + (($105*12)|0)|0); //@line 478 "HyMES/dicho.c"
  $112 = $11; //@line 478 "HyMES/dicho.c"
  ;HEAP32[$$byval_copy1>>2]=HEAP32[$111>>2]|0;HEAP32[$$byval_copy1+4>>2]=HEAP32[$111+4>>2]|0;HEAP32[$$byval_copy1+8>>2]=HEAP32[$111+8>>2]|0; //@line 478 "HyMES/dicho.c"
  $113 = (_decoder($$byval_copy1,$12,$112)|0); //@line 478 "HyMES/dicho.c"
  $13 = $113; //@line 478 "HyMES/dicho.c"
  $114 = $7; //@line 483 "HyMES/dicho.c"
  $115 = HEAP32[$12>>2]|0; //@line 483 "HyMES/dicho.c"
  $116 = $9; //@line 483 "HyMES/dicho.c"
  $117 = (($116) - 1)|0; //@line 483 "HyMES/dicho.c"
  $118 = $10; //@line 483 "HyMES/dicho.c"
  $119 = $11; //@line 483 "HyMES/dicho.c"
  ;HEAP32[$$byval_copy2>>2]=HEAP32[$5>>2]|0;HEAP32[$$byval_copy2+4>>2]=HEAP32[$5+4>>2]|0;HEAP32[$$byval_copy2+8>>2]=HEAP32[$5+8>>2]|0;HEAP32[$$byval_copy2+12>>2]=HEAP32[$5+12>>2]|0;HEAP32[$$byval_copy2+16>>2]=HEAP32[$5+16>>2]|0;HEAP32[$$byval_copy2+20>>2]=HEAP32[$5+20>>2]|0;HEAP32[$$byval_copy2+24>>2]=HEAP32[$5+24>>2]|0; //@line 483 "HyMES/dicho.c"
  $120 = (_dichoinv_rec($114,$115,$117,$118,$119,$$byval_copy2)|0); //@line 483 "HyMES/dicho.c"
  $121 = $13; //@line 483 "HyMES/dicho.c"
  $122 = (($121) + ($120))|0; //@line 483 "HyMES/dicho.c"
  $13 = $122; //@line 483 "HyMES/dicho.c"
  $123 = $7; //@line 484 "HyMES/dicho.c"
  $124 = HEAP32[$12>>2]|0; //@line 484 "HyMES/dicho.c"
  $125 = (($123) + ($124<<2)|0); //@line 484 "HyMES/dicho.c"
  $126 = $8; //@line 484 "HyMES/dicho.c"
  $127 = HEAP32[$12>>2]|0; //@line 484 "HyMES/dicho.c"
  $128 = (($126) - ($127))|0; //@line 484 "HyMES/dicho.c"
  $129 = $9; //@line 484 "HyMES/dicho.c"
  $130 = (($129) - 1)|0; //@line 484 "HyMES/dicho.c"
  $131 = $10; //@line 484 "HyMES/dicho.c"
  $132 = $9; //@line 484 "HyMES/dicho.c"
  $133 = (($132) - 1)|0; //@line 484 "HyMES/dicho.c"
  $134 = 1 << $133; //@line 484 "HyMES/dicho.c"
  $135 = $131 ^ $134; //@line 484 "HyMES/dicho.c"
  $136 = $11; //@line 484 "HyMES/dicho.c"
  ;HEAP32[$$byval_copy3>>2]=HEAP32[$5>>2]|0;HEAP32[$$byval_copy3+4>>2]=HEAP32[$5+4>>2]|0;HEAP32[$$byval_copy3+8>>2]=HEAP32[$5+8>>2]|0;HEAP32[$$byval_copy3+12>>2]=HEAP32[$5+12>>2]|0;HEAP32[$$byval_copy3+16>>2]=HEAP32[$5+16>>2]|0;HEAP32[$$byval_copy3+20>>2]=HEAP32[$5+20>>2]|0;HEAP32[$$byval_copy3+24>>2]=HEAP32[$5+24>>2]|0; //@line 484 "HyMES/dicho.c"
  $137 = (_dichoinv_rec($125,$128,$130,$135,$136,$$byval_copy3)|0); //@line 484 "HyMES/dicho.c"
  $138 = $13; //@line 484 "HyMES/dicho.c"
  $139 = (($138) + ($137))|0; //@line 484 "HyMES/dicho.c"
  $13 = $139; //@line 484 "HyMES/dicho.c"
  $140 = $13; //@line 486 "HyMES/dicho.c"
  $6 = $140; //@line 486 "HyMES/dicho.c"
  $141 = $6; //@line 487 "HyMES/dicho.c"
  STACKTOP = sp;return ($141|0); //@line 487 "HyMES/dicho.c"
 }
 return (0)|0;
}
function _dichoinv($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$byval_copy = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0;
 var $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0;
 var $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0;
 var $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0;
 var $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0;
 var $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0;
 var $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0;
 var $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0;
 var $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0;
 var $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0;
 var $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0;
 var $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(80|0);
 $$byval_copy = sp + 48|0;
 $10 = sp + 16|0;
 $3 = $0;
 $4 = $1;
 $15 = HEAP32[$2>>2]|0; //@line 495 "HyMES/dicho.c"
 $5 = $15; //@line 495 "HyMES/dicho.c"
 $16 = ((($2)) + 4|0); //@line 496 "HyMES/dicho.c"
 $17 = HEAP32[$16>>2]|0; //@line 496 "HyMES/dicho.c"
 $6 = $17; //@line 496 "HyMES/dicho.c"
 HEAP32[2865] = 0; //@line 498 "HyMES/dicho.c"
 HEAP32[2867] = 0; //@line 499 "HyMES/dicho.c"
 $18 = $3; //@line 501 "HyMES/dicho.c"
 $19 = $6; //@line 501 "HyMES/dicho.c"
 $20 = $5; //@line 501 "HyMES/dicho.c"
 $21 = $4; //@line 501 "HyMES/dicho.c"
 ;HEAP32[$$byval_copy>>2]=HEAP32[$2>>2]|0;HEAP32[$$byval_copy+4>>2]=HEAP32[$2+4>>2]|0;HEAP32[$$byval_copy+8>>2]=HEAP32[$2+8>>2]|0;HEAP32[$$byval_copy+12>>2]=HEAP32[$2+12>>2]|0;HEAP32[$$byval_copy+16>>2]=HEAP32[$2+16>>2]|0;HEAP32[$$byval_copy+20>>2]=HEAP32[$2+20>>2]|0;HEAP32[$$byval_copy+24>>2]=HEAP32[$2+24>>2]|0; //@line 501 "HyMES/dicho.c"
 $22 = (_dichoinv_rec($18,$19,$20,0,$21,$$byval_copy)|0); //@line 501 "HyMES/dicho.c"
 $7 = $22; //@line 501 "HyMES/dicho.c"
 $8 = 0; //@line 510 "HyMES/dicho.c"
 $23 = HEAP32[2865]|0; //@line 510 "HyMES/dicho.c"
 $11 = $23; //@line 510 "HyMES/dicho.c"
 while(1) {
  $24 = $11; //@line 510 "HyMES/dicho.c"
  $25 = ($24|0)!=(0|0); //@line 510 "HyMES/dicho.c"
  if (!($25)) {
   break;
  }
  $26 = $11; //@line 511 "HyMES/dicho.c"
  $27 = ((($26)) + 4|0); //@line 511 "HyMES/dicho.c"
  $28 = HEAP32[$27>>2]|0; //@line 511 "HyMES/dicho.c"
  $29 = $8; //@line 511 "HyMES/dicho.c"
  $30 = (($29) + ($28))|0; //@line 511 "HyMES/dicho.c"
  $8 = $30; //@line 511 "HyMES/dicho.c"
  $31 = $11; //@line 510 "HyMES/dicho.c"
  $32 = ((($31)) + 24|0); //@line 510 "HyMES/dicho.c"
  $33 = HEAP32[$32>>2]|0; //@line 510 "HyMES/dicho.c"
  $11 = $33; //@line 510 "HyMES/dicho.c"
 }
 $34 = $4; //@line 514 "HyMES/dicho.c"
 $35 = ((($34)) + 12|0); //@line 514 "HyMES/dicho.c"
 $36 = HEAP32[$35>>2]|0; //@line 514 "HyMES/dicho.c"
 $37 = (_bread_unlocked($36)|0); //@line 514 "HyMES/dicho.c"
 $38 = $8; //@line 514 "HyMES/dicho.c"
 $39 = ($37|0)>=($38|0); //@line 514 "HyMES/dicho.c"
 $40 = $39&1; //@line 514 "HyMES/dicho.c"
 $9 = $40; //@line 514 "HyMES/dicho.c"
 $41 = $9; //@line 521 "HyMES/dicho.c"
 $42 = ($41|0)!=(0); //@line 521 "HyMES/dicho.c"
 if ($42) {
  $43 = $4; //@line 523 "HyMES/dicho.c"
  $44 = ((($43)) + 12|0); //@line 523 "HyMES/dicho.c"
  $45 = HEAP32[$44>>2]|0; //@line 523 "HyMES/dicho.c"
  $46 = $8; //@line 523 "HyMES/dicho.c"
  $47 = (0 - ($46))|0; //@line 523 "HyMES/dicho.c"
  _bread_decaler_fin($45,$47); //@line 523 "HyMES/dicho.c"
 }
 $48 = HEAP32[2865]|0; //@line 525 "HyMES/dicho.c"
 $11 = $48; //@line 525 "HyMES/dicho.c"
 while(1) {
  $49 = $11; //@line 525 "HyMES/dicho.c"
  $50 = ($49|0)!=(0|0); //@line 525 "HyMES/dicho.c"
  if (!($50)) {
   break;
  }
  $51 = $11; //@line 526 "HyMES/dicho.c"
  $52 = ((($51)) + 8|0); //@line 526 "HyMES/dicho.c"
  $53 = HEAP32[$52>>2]|0; //@line 526 "HyMES/dicho.c"
  $54 = ($53|0)>(1); //@line 526 "HyMES/dicho.c"
  if ($54) {
   $55 = $11; //@line 527 "HyMES/dicho.c"
   $56 = ((($55)) + 20|0); //@line 527 "HyMES/dicho.c"
   $57 = HEAP32[$56>>2]|0; //@line 527 "HyMES/dicho.c"
   $58 = $4; //@line 527 "HyMES/dicho.c"
   $59 = (_decoder_uniforme($57,$10,$58)|0); //@line 527 "HyMES/dicho.c"
   $60 = $7; //@line 527 "HyMES/dicho.c"
   $61 = (($60) + ($59))|0; //@line 527 "HyMES/dicho.c"
   $7 = $61; //@line 527 "HyMES/dicho.c"
   $62 = HEAP32[$10>>2]|0; //@line 528 "HyMES/dicho.c"
   $63 = $11; //@line 528 "HyMES/dicho.c"
   $64 = ((($63)) + 4|0); //@line 528 "HyMES/dicho.c"
   $65 = HEAP32[$64>>2]|0; //@line 528 "HyMES/dicho.c"
   $66 = $62 << $65; //@line 528 "HyMES/dicho.c"
   $67 = $11; //@line 528 "HyMES/dicho.c"
   $68 = ((($67)) + 16|0); //@line 528 "HyMES/dicho.c"
   HEAP32[$68>>2] = $66; //@line 528 "HyMES/dicho.c"
  }
  $69 = $11; //@line 525 "HyMES/dicho.c"
  $70 = ((($69)) + 24|0); //@line 525 "HyMES/dicho.c"
  $71 = HEAP32[$70>>2]|0; //@line 525 "HyMES/dicho.c"
  $11 = $71; //@line 525 "HyMES/dicho.c"
 }
 $72 = $9; //@line 535 "HyMES/dicho.c"
 $73 = ($72|0)!=(0); //@line 535 "HyMES/dicho.c"
 L15: do {
  if ($73) {
   $74 = $4; //@line 537 "HyMES/dicho.c"
   $75 = ((($74)) + 12|0); //@line 537 "HyMES/dicho.c"
   $76 = HEAP32[$75>>2]|0; //@line 537 "HyMES/dicho.c"
   $77 = $8; //@line 537 "HyMES/dicho.c"
   _bread_decaler_fin($76,$77); //@line 537 "HyMES/dicho.c"
   $78 = $4; //@line 540 "HyMES/dicho.c"
   $79 = ((($78)) + 12|0); //@line 540 "HyMES/dicho.c"
   $80 = HEAP32[$79>>2]|0; //@line 540 "HyMES/dicho.c"
   $81 = $4; //@line 540 "HyMES/dicho.c"
   $82 = ((($81)) + 12|0); //@line 540 "HyMES/dicho.c"
   $83 = HEAP32[$82>>2]|0; //@line 540 "HyMES/dicho.c"
   $84 = ((($83)) + 16|0); //@line 540 "HyMES/dicho.c"
   $85 = HEAP32[$84>>2]|0; //@line 540 "HyMES/dicho.c"
   $86 = $8; //@line 540 "HyMES/dicho.c"
   $87 = (($85) - ($86))|0; //@line 540 "HyMES/dicho.c"
   _bread_changer_position($80,$87); //@line 540 "HyMES/dicho.c"
   $88 = HEAP32[2865]|0; //@line 542 "HyMES/dicho.c"
   $11 = $88; //@line 542 "HyMES/dicho.c"
   while(1) {
    $89 = $11; //@line 542 "HyMES/dicho.c"
    $90 = ($89|0)!=(0|0); //@line 542 "HyMES/dicho.c"
    if (!($90)) {
     break;
    }
    $91 = $11; //@line 543 "HyMES/dicho.c"
    $92 = ((($91)) + 4|0); //@line 543 "HyMES/dicho.c"
    $93 = HEAP32[$92>>2]|0; //@line 543 "HyMES/dicho.c"
    $94 = $4; //@line 543 "HyMES/dicho.c"
    $95 = ((($94)) + 12|0); //@line 543 "HyMES/dicho.c"
    $96 = HEAP32[$95>>2]|0; //@line 543 "HyMES/dicho.c"
    $97 = (_bread($93,$96)|0); //@line 543 "HyMES/dicho.c"
    $98 = $11; //@line 543 "HyMES/dicho.c"
    $99 = ((($98)) + 16|0); //@line 543 "HyMES/dicho.c"
    $100 = HEAP32[$99>>2]|0; //@line 543 "HyMES/dicho.c"
    $101 = $100 ^ $97; //@line 543 "HyMES/dicho.c"
    HEAP32[$99>>2] = $101; //@line 543 "HyMES/dicho.c"
    $102 = $11; //@line 542 "HyMES/dicho.c"
    $103 = ((($102)) + 24|0); //@line 542 "HyMES/dicho.c"
    $104 = HEAP32[$103>>2]|0; //@line 542 "HyMES/dicho.c"
    $11 = $104; //@line 542 "HyMES/dicho.c"
   }
   $105 = $8; //@line 545 "HyMES/dicho.c"
   $106 = $7; //@line 545 "HyMES/dicho.c"
   $107 = (($106) + ($105))|0; //@line 545 "HyMES/dicho.c"
   $7 = $107; //@line 545 "HyMES/dicho.c"
  } else {
   $108 = HEAP32[2865]|0; //@line 548 "HyMES/dicho.c"
   $11 = $108; //@line 548 "HyMES/dicho.c"
   while(1) {
    $109 = $11; //@line 548 "HyMES/dicho.c"
    $110 = ($109|0)!=(0|0); //@line 548 "HyMES/dicho.c"
    if (!($110)) {
     break L15;
    }
    while(1) {
     $111 = $11; //@line 549 "HyMES/dicho.c"
     $112 = ((($111)) + 4|0); //@line 549 "HyMES/dicho.c"
     $113 = HEAP32[$112>>2]|0; //@line 549 "HyMES/dicho.c"
     $114 = ($113|0)>(11); //@line 549 "HyMES/dicho.c"
     if (!($114)) {
      break;
     }
     $115 = $4; //@line 550 "HyMES/dicho.c"
     $116 = (_decoder_uniforme(2048,$10,$115)|0); //@line 550 "HyMES/dicho.c"
     $117 = $7; //@line 550 "HyMES/dicho.c"
     $118 = (($117) + ($116))|0; //@line 550 "HyMES/dicho.c"
     $7 = $118; //@line 550 "HyMES/dicho.c"
     $119 = $11; //@line 551 "HyMES/dicho.c"
     $120 = ((($119)) + 4|0); //@line 551 "HyMES/dicho.c"
     $121 = HEAP32[$120>>2]|0; //@line 551 "HyMES/dicho.c"
     $122 = (($121) - 11)|0; //@line 551 "HyMES/dicho.c"
     HEAP32[$120>>2] = $122; //@line 551 "HyMES/dicho.c"
     $123 = HEAP32[$10>>2]|0; //@line 552 "HyMES/dicho.c"
     $124 = $11; //@line 552 "HyMES/dicho.c"
     $125 = ((($124)) + 4|0); //@line 552 "HyMES/dicho.c"
     $126 = HEAP32[$125>>2]|0; //@line 552 "HyMES/dicho.c"
     $127 = $123 << $126; //@line 552 "HyMES/dicho.c"
     $128 = $11; //@line 552 "HyMES/dicho.c"
     $129 = ((($128)) + 16|0); //@line 552 "HyMES/dicho.c"
     $130 = HEAP32[$129>>2]|0; //@line 552 "HyMES/dicho.c"
     $131 = $130 ^ $127; //@line 552 "HyMES/dicho.c"
     HEAP32[$129>>2] = $131; //@line 552 "HyMES/dicho.c"
    }
    $132 = $11; //@line 554 "HyMES/dicho.c"
    $133 = ((($132)) + 4|0); //@line 554 "HyMES/dicho.c"
    $134 = HEAP32[$133>>2]|0; //@line 554 "HyMES/dicho.c"
    $135 = 1 << $134; //@line 554 "HyMES/dicho.c"
    $136 = $4; //@line 554 "HyMES/dicho.c"
    $137 = (_decoder_uniforme($135,$10,$136)|0); //@line 554 "HyMES/dicho.c"
    $138 = $7; //@line 554 "HyMES/dicho.c"
    $139 = (($138) + ($137))|0; //@line 554 "HyMES/dicho.c"
    $7 = $139; //@line 554 "HyMES/dicho.c"
    $140 = HEAP32[$10>>2]|0; //@line 555 "HyMES/dicho.c"
    $141 = $11; //@line 555 "HyMES/dicho.c"
    $142 = ((($141)) + 16|0); //@line 555 "HyMES/dicho.c"
    $143 = HEAP32[$142>>2]|0; //@line 555 "HyMES/dicho.c"
    $144 = $143 ^ $140; //@line 555 "HyMES/dicho.c"
    HEAP32[$142>>2] = $144; //@line 555 "HyMES/dicho.c"
    $145 = $11; //@line 548 "HyMES/dicho.c"
    $146 = ((($145)) + 24|0); //@line 548 "HyMES/dicho.c"
    $147 = HEAP32[$146>>2]|0; //@line 548 "HyMES/dicho.c"
    $11 = $147; //@line 548 "HyMES/dicho.c"
   }
  }
 } while(0);
 $148 = $7; //@line 566 "HyMES/dicho.c"
 $149 = (($148) + 1)|0; //@line 566 "HyMES/dicho.c"
 $7 = $149; //@line 566 "HyMES/dicho.c"
 $150 = HEAP32[2865]|0; //@line 574 "HyMES/dicho.c"
 $11 = $150; //@line 574 "HyMES/dicho.c"
 while(1) {
  $151 = $11; //@line 574 "HyMES/dicho.c"
  $152 = ($151|0)!=(0|0); //@line 574 "HyMES/dicho.c"
  if (!($152)) {
   break;
  }
  $153 = $11; //@line 575 "HyMES/dicho.c"
  $154 = ((($153)) + 16|0); //@line 575 "HyMES/dicho.c"
  $155 = HEAP32[$154>>2]|0; //@line 575 "HyMES/dicho.c"
  $156 = $11; //@line 575 "HyMES/dicho.c"
  $157 = ((($156)) + 8|0); //@line 575 "HyMES/dicho.c"
  $158 = HEAP32[$157>>2]|0; //@line 575 "HyMES/dicho.c"
  $159 = $11; //@line 575 "HyMES/dicho.c"
  $160 = HEAP32[$159>>2]|0; //@line 575 "HyMES/dicho.c"
  _cw_decoder($155,$158,$160); //@line 575 "HyMES/dicho.c"
  $8 = 0; //@line 576 "HyMES/dicho.c"
  while(1) {
   $161 = $8; //@line 576 "HyMES/dicho.c"
   $162 = $11; //@line 576 "HyMES/dicho.c"
   $163 = ((($162)) + 8|0); //@line 576 "HyMES/dicho.c"
   $164 = HEAP32[$163>>2]|0; //@line 576 "HyMES/dicho.c"
   $165 = ($161|0)<($164|0); //@line 576 "HyMES/dicho.c"
   $166 = $11; //@line 577 "HyMES/dicho.c"
   if (!($165)) {
    break;
   }
   $167 = ((($166)) + 12|0); //@line 577 "HyMES/dicho.c"
   $168 = HEAP32[$167>>2]|0; //@line 577 "HyMES/dicho.c"
   $169 = $8; //@line 577 "HyMES/dicho.c"
   $170 = $11; //@line 577 "HyMES/dicho.c"
   $171 = HEAP32[$170>>2]|0; //@line 577 "HyMES/dicho.c"
   $172 = (($171) + ($169<<2)|0); //@line 577 "HyMES/dicho.c"
   $173 = HEAP32[$172>>2]|0; //@line 577 "HyMES/dicho.c"
   $174 = $173 ^ $168; //@line 577 "HyMES/dicho.c"
   HEAP32[$172>>2] = $174; //@line 577 "HyMES/dicho.c"
   $175 = $8; //@line 576 "HyMES/dicho.c"
   $176 = (($175) + 1)|0; //@line 576 "HyMES/dicho.c"
   $8 = $176; //@line 576 "HyMES/dicho.c"
  }
  $177 = ((($166)) + 24|0); //@line 574 "HyMES/dicho.c"
  $178 = HEAP32[$177>>2]|0; //@line 574 "HyMES/dicho.c"
  $11 = $178; //@line 574 "HyMES/dicho.c"
 }
 $179 = HEAP32[2867]|0; //@line 586 "HyMES/dicho.c"
 $11 = $179; //@line 586 "HyMES/dicho.c"
 while(1) {
  $180 = $11; //@line 586 "HyMES/dicho.c"
  $181 = ($180|0)!=(0|0); //@line 586 "HyMES/dicho.c"
  if (!($181)) {
   break;
  }
  $182 = $11; //@line 589 "HyMES/dicho.c"
  $183 = ((($182)) + 4|0); //@line 589 "HyMES/dicho.c"
  $184 = HEAP32[$183>>2]|0; //@line 589 "HyMES/dicho.c"
  $185 = 1 << $184; //@line 589 "HyMES/dicho.c"
  $186 = $11; //@line 589 "HyMES/dicho.c"
  $187 = ((($186)) + 8|0); //@line 589 "HyMES/dicho.c"
  $188 = HEAP32[$187>>2]|0; //@line 589 "HyMES/dicho.c"
  $189 = (($185) - ($188))|0; //@line 589 "HyMES/dicho.c"
  $190 = $189<<2; //@line 589 "HyMES/dicho.c"
  $191 = (_malloc($190)|0); //@line 589 "HyMES/dicho.c"
  $14 = $191; //@line 589 "HyMES/dicho.c"
  $192 = $14; //@line 590 "HyMES/dicho.c"
  $193 = $11; //@line 590 "HyMES/dicho.c"
  $194 = HEAP32[$193>>2]|0; //@line 590 "HyMES/dicho.c"
  $195 = $11; //@line 590 "HyMES/dicho.c"
  $196 = ((($195)) + 4|0); //@line 590 "HyMES/dicho.c"
  $197 = HEAP32[$196>>2]|0; //@line 590 "HyMES/dicho.c"
  $198 = 1 << $197; //@line 590 "HyMES/dicho.c"
  $199 = $11; //@line 590 "HyMES/dicho.c"
  $200 = ((($199)) + 8|0); //@line 590 "HyMES/dicho.c"
  $201 = HEAP32[$200>>2]|0; //@line 590 "HyMES/dicho.c"
  $202 = (($198) - ($201))|0; //@line 590 "HyMES/dicho.c"
  $203 = $202<<2; //@line 590 "HyMES/dicho.c"
  _memcpy(($192|0),($194|0),($203|0))|0; //@line 590 "HyMES/dicho.c"
  $204 = $11; //@line 591 "HyMES/dicho.c"
  $205 = ((($204)) + 12|0); //@line 591 "HyMES/dicho.c"
  $206 = HEAP32[$205>>2]|0; //@line 591 "HyMES/dicho.c"
  $8 = $206; //@line 591 "HyMES/dicho.c"
  $12 = 0; //@line 592 "HyMES/dicho.c"
  $13 = 0; //@line 592 "HyMES/dicho.c"
  while(1) {
   $207 = $13; //@line 592 "HyMES/dicho.c"
   $208 = $11; //@line 592 "HyMES/dicho.c"
   $209 = ((($208)) + 4|0); //@line 592 "HyMES/dicho.c"
   $210 = HEAP32[$209>>2]|0; //@line 592 "HyMES/dicho.c"
   $211 = 1 << $210; //@line 592 "HyMES/dicho.c"
   $212 = $11; //@line 592 "HyMES/dicho.c"
   $213 = ((($212)) + 8|0); //@line 592 "HyMES/dicho.c"
   $214 = HEAP32[$213>>2]|0; //@line 592 "HyMES/dicho.c"
   $215 = (($211) - ($214))|0; //@line 592 "HyMES/dicho.c"
   $216 = ($207|0)<($215|0); //@line 592 "HyMES/dicho.c"
   if (!($216)) {
    break;
   }
   $217 = $12; //@line 592 "HyMES/dicho.c"
   $218 = $11; //@line 592 "HyMES/dicho.c"
   $219 = ((($218)) + 8|0); //@line 592 "HyMES/dicho.c"
   $220 = HEAP32[$219>>2]|0; //@line 592 "HyMES/dicho.c"
   $221 = ($217|0)<($220|0); //@line 592 "HyMES/dicho.c"
   if (!($221)) {
    break;
   }
   $222 = $13; //@line 593 "HyMES/dicho.c"
   $223 = $14; //@line 593 "HyMES/dicho.c"
   $224 = (($223) + ($222<<2)|0); //@line 593 "HyMES/dicho.c"
   $225 = HEAP32[$224>>2]|0; //@line 593 "HyMES/dicho.c"
   $226 = $8; //@line 593 "HyMES/dicho.c"
   $227 = ($225|0)==($226|0); //@line 593 "HyMES/dicho.c"
   if ($227) {
    $228 = $13; //@line 594 "HyMES/dicho.c"
    $229 = (($228) + 1)|0; //@line 594 "HyMES/dicho.c"
    $13 = $229; //@line 594 "HyMES/dicho.c"
   } else {
    $230 = $8; //@line 596 "HyMES/dicho.c"
    $231 = $12; //@line 596 "HyMES/dicho.c"
    $232 = $11; //@line 596 "HyMES/dicho.c"
    $233 = HEAP32[$232>>2]|0; //@line 596 "HyMES/dicho.c"
    $234 = (($233) + ($231<<2)|0); //@line 596 "HyMES/dicho.c"
    HEAP32[$234>>2] = $230; //@line 596 "HyMES/dicho.c"
    $235 = $12; //@line 597 "HyMES/dicho.c"
    $236 = (($235) + 1)|0; //@line 597 "HyMES/dicho.c"
    $12 = $236; //@line 597 "HyMES/dicho.c"
   }
   $237 = $8; //@line 592 "HyMES/dicho.c"
   $238 = (($237) + 1)|0; //@line 592 "HyMES/dicho.c"
   $8 = $238; //@line 592 "HyMES/dicho.c"
  }
  while(1) {
   $239 = $12; //@line 599 "HyMES/dicho.c"
   $240 = $11; //@line 599 "HyMES/dicho.c"
   $241 = ((($240)) + 8|0); //@line 599 "HyMES/dicho.c"
   $242 = HEAP32[$241>>2]|0; //@line 599 "HyMES/dicho.c"
   $243 = ($239|0)<($242|0); //@line 599 "HyMES/dicho.c"
   if (!($243)) {
    break;
   }
   $244 = $8; //@line 600 "HyMES/dicho.c"
   $245 = $12; //@line 600 "HyMES/dicho.c"
   $246 = $11; //@line 600 "HyMES/dicho.c"
   $247 = HEAP32[$246>>2]|0; //@line 600 "HyMES/dicho.c"
   $248 = (($247) + ($245<<2)|0); //@line 600 "HyMES/dicho.c"
   HEAP32[$248>>2] = $244; //@line 600 "HyMES/dicho.c"
   $249 = $12; //@line 599 "HyMES/dicho.c"
   $250 = (($249) + 1)|0; //@line 599 "HyMES/dicho.c"
   $12 = $250; //@line 599 "HyMES/dicho.c"
   $251 = $8; //@line 599 "HyMES/dicho.c"
   $252 = (($251) + 1)|0; //@line 599 "HyMES/dicho.c"
   $8 = $252; //@line 599 "HyMES/dicho.c"
  }
  $253 = $14; //@line 601 "HyMES/dicho.c"
  _free($253); //@line 601 "HyMES/dicho.c"
  $254 = $11; //@line 586 "HyMES/dicho.c"
  $255 = ((($254)) + 24|0); //@line 586 "HyMES/dicho.c"
  $256 = HEAP32[$255>>2]|0; //@line 586 "HyMES/dicho.c"
  $11 = $256; //@line 586 "HyMES/dicho.c"
 }
 $257 = HEAP32[2865]|0; //@line 608 "HyMES/dicho.c"
 _liste_free($257); //@line 608 "HyMES/dicho.c"
 $258 = HEAP32[2867]|0; //@line 609 "HyMES/dicho.c"
 _liste_free($258); //@line 609 "HyMES/dicho.c"
 $259 = $7; //@line 611 "HyMES/dicho.c"
 STACKTOP = sp;return ($259|0); //@line 611 "HyMES/dicho.c"
}
function _dicho_b2cw($0,$1,$2,$3,$4,$5,$6) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 $5 = $5|0;
 $6 = $6|0;
 var $$byval_copy = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0;
 var $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0;
 var $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0;
 var $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0;
 var $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0;
 var $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0;
 var $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $30 = 0, $31 = 0, $32 = 0;
 var $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $50 = 0, $51 = 0, $52 = 0;
 var $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0;
 var $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0;
 var $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 96|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(96|0);
 $$byval_copy = sp + 64|0;
 $vararg_buffer = sp;
 $8 = $0;
 $9 = $1;
 $10 = $2;
 $11 = $3;
 $12 = $4;
 $13 = $5;
 $24 = $13; //@line 634 "HyMES/dicho.c"
 $25 = ((($6)) + 12|0); //@line 634 "HyMES/dicho.c"
 $26 = HEAP32[$25>>2]|0; //@line 634 "HyMES/dicho.c"
 $27 = ($24|0)!=($26|0); //@line 634 "HyMES/dicho.c"
 if ($27) {
  (_printf(8679,$vararg_buffer)|0); //@line 635 "HyMES/dicho.c"
  _exit(0); //@line 636 "HyMES/dicho.c"
  // unreachable; //@line 636 "HyMES/dicho.c"
 }
 $28 = $12; //@line 634 "HyMES/dicho.c"
 $29 = ((($6)) + 8|0); //@line 634 "HyMES/dicho.c"
 $30 = HEAP32[$29>>2]|0; //@line 634 "HyMES/dicho.c"
 $31 = ($28|0)!=($30|0); //@line 634 "HyMES/dicho.c"
 if ($31) {
  (_printf(8679,$vararg_buffer)|0); //@line 635 "HyMES/dicho.c"
  _exit(0); //@line 636 "HyMES/dicho.c"
  // unreachable; //@line 636 "HyMES/dicho.c"
 }
 $32 = $10; //@line 639 "HyMES/dicho.c"
 $33 = (($32|0) % 8)&-1; //@line 639 "HyMES/dicho.c"
 $34 = ($33|0)!=(0); //@line 639 "HyMES/dicho.c"
 if ($34) {
  $35 = $10; //@line 640 "HyMES/dicho.c"
  $36 = (($35|0) / 8)&-1; //@line 640 "HyMES/dicho.c"
  $37 = $8; //@line 640 "HyMES/dicho.c"
  $38 = (($37) + ($36)|0); //@line 640 "HyMES/dicho.c"
  $39 = HEAP8[$38>>0]|0; //@line 640 "HyMES/dicho.c"
  $21 = $39; //@line 640 "HyMES/dicho.c"
  $40 = $10; //@line 641 "HyMES/dicho.c"
  $41 = (($40|0) % 8)&-1; //@line 641 "HyMES/dicho.c"
  $42 = $10; //@line 641 "HyMES/dicho.c"
  $43 = (($42|0) / 8)&-1; //@line 641 "HyMES/dicho.c"
  $44 = $8; //@line 641 "HyMES/dicho.c"
  $45 = (($44) + ($43)|0); //@line 641 "HyMES/dicho.c"
  $46 = HEAP8[$45>>0]|0; //@line 641 "HyMES/dicho.c"
  $47 = $46&255; //@line 641 "HyMES/dicho.c"
  $48 = $47 >> $41; //@line 641 "HyMES/dicho.c"
  $49 = $48&255; //@line 641 "HyMES/dicho.c"
  HEAP8[$45>>0] = $49; //@line 641 "HyMES/dicho.c"
 }
 $50 = $10; //@line 643 "HyMES/dicho.c"
 $51 = $11; //@line 643 "HyMES/dicho.c"
 $52 = (($50) + ($51))|0; //@line 643 "HyMES/dicho.c"
 $18 = $52; //@line 643 "HyMES/dicho.c"
 $53 = $18; //@line 644 "HyMES/dicho.c"
 $54 = (($53|0) % 8)&-1; //@line 644 "HyMES/dicho.c"
 $55 = ($54|0)!=(0); //@line 644 "HyMES/dicho.c"
 if ($55) {
  $56 = $18; //@line 645 "HyMES/dicho.c"
  $57 = (($56|0) / 8)&-1; //@line 645 "HyMES/dicho.c"
  $58 = $8; //@line 645 "HyMES/dicho.c"
  $59 = (($58) + ($57)|0); //@line 645 "HyMES/dicho.c"
  $60 = HEAP8[$59>>0]|0; //@line 645 "HyMES/dicho.c"
  $22 = $60; //@line 645 "HyMES/dicho.c"
  $61 = $18; //@line 646 "HyMES/dicho.c"
  $62 = (($61|0) % 8)&-1; //@line 646 "HyMES/dicho.c"
  $63 = (8 - ($62))|0; //@line 646 "HyMES/dicho.c"
  $64 = $18; //@line 646 "HyMES/dicho.c"
  $65 = (($64|0) / 8)&-1; //@line 646 "HyMES/dicho.c"
  $66 = $8; //@line 646 "HyMES/dicho.c"
  $67 = (($66) + ($65)|0); //@line 646 "HyMES/dicho.c"
  $68 = HEAP8[$67>>0]|0; //@line 646 "HyMES/dicho.c"
  $69 = $68&255; //@line 646 "HyMES/dicho.c"
  $70 = $69 << $63; //@line 646 "HyMES/dicho.c"
  $71 = $70&255; //@line 646 "HyMES/dicho.c"
  HEAP8[$67>>0] = $71; //@line 646 "HyMES/dicho.c"
 }
 $72 = $8; //@line 649 "HyMES/dicho.c"
 $73 = $18; //@line 649 "HyMES/dicho.c"
 $74 = (_breadinit($72,$73)|0); //@line 649 "HyMES/dicho.c"
 $75 = (_arith_init($74)|0); //@line 649 "HyMES/dicho.c"
 $20 = $75; //@line 649 "HyMES/dicho.c"
 $76 = $12; //@line 662 "HyMES/dicho.c"
 $77 = HEAP32[$6>>2]|0; //@line 662 "HyMES/dicho.c"
 $78 = (($76) - ($77))|0; //@line 662 "HyMES/dicho.c"
 $19 = $78; //@line 662 "HyMES/dicho.c"
 $79 = $20; //@line 663 "HyMES/dicho.c"
 $80 = ((($79)) + 12|0); //@line 663 "HyMES/dicho.c"
 $81 = HEAP32[$80>>2]|0; //@line 663 "HyMES/dicho.c"
 $82 = $10; //@line 663 "HyMES/dicho.c"
 $83 = $19; //@line 663 "HyMES/dicho.c"
 $84 = $13; //@line 663 "HyMES/dicho.c"
 $85 = Math_imul($83, $84)|0; //@line 663 "HyMES/dicho.c"
 $86 = (($82) + ($85))|0; //@line 663 "HyMES/dicho.c"
 _bread_changer_position($81,$86); //@line 663 "HyMES/dicho.c"
 $87 = ((($6)) + 4|0); //@line 665 "HyMES/dicho.c"
 $88 = HEAP32[$87>>2]|0; //@line 665 "HyMES/dicho.c"
 $89 = $88<<2; //@line 665 "HyMES/dicho.c"
 $90 = (_malloc($89)|0); //@line 665 "HyMES/dicho.c"
 $23 = $90; //@line 665 "HyMES/dicho.c"
 $91 = $23; //@line 667 "HyMES/dicho.c"
 $92 = $20; //@line 667 "HyMES/dicho.c"
 ;HEAP32[$$byval_copy>>2]=HEAP32[$6>>2]|0;HEAP32[$$byval_copy+4>>2]=HEAP32[$6+4>>2]|0;HEAP32[$$byval_copy+8>>2]=HEAP32[$6+8>>2]|0;HEAP32[$$byval_copy+12>>2]=HEAP32[$6+12>>2]|0;HEAP32[$$byval_copy+16>>2]=HEAP32[$6+16>>2]|0;HEAP32[$$byval_copy+20>>2]=HEAP32[$6+20>>2]|0;HEAP32[$$byval_copy+24>>2]=HEAP32[$6+24>>2]|0; //@line 667 "HyMES/dicho.c"
 $93 = (_dichoinv($91,$92,$$byval_copy)|0); //@line 667 "HyMES/dicho.c"
 $17 = $93; //@line 667 "HyMES/dicho.c"
 $94 = ((($6)) + 4|0); //@line 669 "HyMES/dicho.c"
 $95 = HEAP32[$94>>2]|0; //@line 669 "HyMES/dicho.c"
 $96 = $13; //@line 669 "HyMES/dicho.c"
 $97 = ($95|0)==($96|0); //@line 669 "HyMES/dicho.c"
 L13: do {
  if ($97) {
   $98 = $9; //@line 670 "HyMES/dicho.c"
   $99 = $23; //@line 670 "HyMES/dicho.c"
   $100 = $13; //@line 670 "HyMES/dicho.c"
   $101 = $100<<2; //@line 670 "HyMES/dicho.c"
   _memcpy(($98|0),($99|0),($101|0))|0; //@line 670 "HyMES/dicho.c"
  } else {
   $16 = 0; //@line 672 "HyMES/dicho.c"
   $15 = 0; //@line 673 "HyMES/dicho.c"
   while(1) {
    $102 = $15; //@line 673 "HyMES/dicho.c"
    $103 = $23; //@line 673 "HyMES/dicho.c"
    $104 = HEAP32[$103>>2]|0; //@line 673 "HyMES/dicho.c"
    $105 = ($102|0)<($104|0); //@line 673 "HyMES/dicho.c"
    if (!($105)) {
     break;
    }
    $106 = $15; //@line 674 "HyMES/dicho.c"
    $107 = $16; //@line 674 "HyMES/dicho.c"
    $108 = $9; //@line 674 "HyMES/dicho.c"
    $109 = (($108) + ($107<<2)|0); //@line 674 "HyMES/dicho.c"
    HEAP32[$109>>2] = $106; //@line 674 "HyMES/dicho.c"
    $110 = $16; //@line 673 "HyMES/dicho.c"
    $111 = (($110) + 1)|0; //@line 673 "HyMES/dicho.c"
    $16 = $111; //@line 673 "HyMES/dicho.c"
    $112 = $15; //@line 673 "HyMES/dicho.c"
    $113 = (($112) + 1)|0; //@line 673 "HyMES/dicho.c"
    $15 = $113; //@line 673 "HyMES/dicho.c"
   }
   $14 = 1; //@line 675 "HyMES/dicho.c"
   while(1) {
    $114 = $14; //@line 675 "HyMES/dicho.c"
    $115 = ((($6)) + 4|0); //@line 675 "HyMES/dicho.c"
    $116 = HEAP32[$115>>2]|0; //@line 675 "HyMES/dicho.c"
    $117 = ($114|0)<($116|0); //@line 675 "HyMES/dicho.c"
    if (!($117)) {
     break;
    }
    $118 = $14; //@line 676 "HyMES/dicho.c"
    $119 = (($118) - 1)|0; //@line 676 "HyMES/dicho.c"
    $120 = $23; //@line 676 "HyMES/dicho.c"
    $121 = (($120) + ($119<<2)|0); //@line 676 "HyMES/dicho.c"
    $122 = HEAP32[$121>>2]|0; //@line 676 "HyMES/dicho.c"
    $123 = (($122) + 1)|0; //@line 676 "HyMES/dicho.c"
    $15 = $123; //@line 676 "HyMES/dicho.c"
    while(1) {
     $124 = $15; //@line 676 "HyMES/dicho.c"
     $125 = $14; //@line 676 "HyMES/dicho.c"
     $126 = $23; //@line 676 "HyMES/dicho.c"
     $127 = (($126) + ($125<<2)|0); //@line 676 "HyMES/dicho.c"
     $128 = HEAP32[$127>>2]|0; //@line 676 "HyMES/dicho.c"
     $129 = ($124|0)<($128|0); //@line 676 "HyMES/dicho.c"
     if (!($129)) {
      break;
     }
     $130 = $15; //@line 677 "HyMES/dicho.c"
     $131 = $16; //@line 677 "HyMES/dicho.c"
     $132 = $9; //@line 677 "HyMES/dicho.c"
     $133 = (($132) + ($131<<2)|0); //@line 677 "HyMES/dicho.c"
     HEAP32[$133>>2] = $130; //@line 677 "HyMES/dicho.c"
     $134 = $16; //@line 676 "HyMES/dicho.c"
     $135 = (($134) + 1)|0; //@line 676 "HyMES/dicho.c"
     $16 = $135; //@line 676 "HyMES/dicho.c"
     $136 = $15; //@line 676 "HyMES/dicho.c"
     $137 = (($136) + 1)|0; //@line 676 "HyMES/dicho.c"
     $15 = $137; //@line 676 "HyMES/dicho.c"
    }
    $138 = $14; //@line 675 "HyMES/dicho.c"
    $139 = (($138) + 1)|0; //@line 675 "HyMES/dicho.c"
    $14 = $139; //@line 675 "HyMES/dicho.c"
   }
   $140 = ((($6)) + 4|0); //@line 679 "HyMES/dicho.c"
   $141 = HEAP32[$140>>2]|0; //@line 679 "HyMES/dicho.c"
   $142 = (($141) - 1)|0; //@line 679 "HyMES/dicho.c"
   $143 = $23; //@line 679 "HyMES/dicho.c"
   $144 = (($143) + ($142<<2)|0); //@line 679 "HyMES/dicho.c"
   $145 = HEAP32[$144>>2]|0; //@line 679 "HyMES/dicho.c"
   $146 = (($145) + 1)|0; //@line 679 "HyMES/dicho.c"
   $15 = $146; //@line 679 "HyMES/dicho.c"
   while(1) {
    $147 = $15; //@line 679 "HyMES/dicho.c"
    $148 = $12; //@line 679 "HyMES/dicho.c"
    $149 = 1 << $148; //@line 679 "HyMES/dicho.c"
    $150 = ($147|0)<($149|0); //@line 679 "HyMES/dicho.c"
    if (!($150)) {
     break L13;
    }
    $151 = $15; //@line 680 "HyMES/dicho.c"
    $152 = $16; //@line 680 "HyMES/dicho.c"
    $153 = $9; //@line 680 "HyMES/dicho.c"
    $154 = (($153) + ($152<<2)|0); //@line 680 "HyMES/dicho.c"
    HEAP32[$154>>2] = $151; //@line 680 "HyMES/dicho.c"
    $155 = $16; //@line 679 "HyMES/dicho.c"
    $156 = (($155) + 1)|0; //@line 679 "HyMES/dicho.c"
    $16 = $156; //@line 679 "HyMES/dicho.c"
    $157 = $15; //@line 679 "HyMES/dicho.c"
    $158 = (($157) + 1)|0; //@line 679 "HyMES/dicho.c"
    $15 = $158; //@line 679 "HyMES/dicho.c"
   }
  }
 } while(0);
 $159 = $23; //@line 682 "HyMES/dicho.c"
 _free($159); //@line 682 "HyMES/dicho.c"
 $160 = $19; //@line 684 "HyMES/dicho.c"
 $161 = ($160|0)>(0); //@line 684 "HyMES/dicho.c"
 if ($161) {
  $162 = $20; //@line 686 "HyMES/dicho.c"
  $163 = ((($162)) + 12|0); //@line 686 "HyMES/dicho.c"
  $164 = HEAP32[$163>>2]|0; //@line 686 "HyMES/dicho.c"
  $165 = $10; //@line 686 "HyMES/dicho.c"
  _bread_changer_position($164,$165); //@line 686 "HyMES/dicho.c"
  $15 = 0; //@line 687 "HyMES/dicho.c"
  while(1) {
   $166 = $15; //@line 687 "HyMES/dicho.c"
   $167 = $13; //@line 687 "HyMES/dicho.c"
   $168 = ($166|0)<($167|0); //@line 687 "HyMES/dicho.c"
   if (!($168)) {
    break;
   }
   $169 = $15; //@line 688 "HyMES/dicho.c"
   $170 = $9; //@line 688 "HyMES/dicho.c"
   $171 = (($170) + ($169<<2)|0); //@line 688 "HyMES/dicho.c"
   $172 = HEAP32[$171>>2]|0; //@line 688 "HyMES/dicho.c"
   $173 = $19; //@line 688 "HyMES/dicho.c"
   $174 = $172 << $173; //@line 688 "HyMES/dicho.c"
   $175 = $19; //@line 688 "HyMES/dicho.c"
   $176 = $20; //@line 688 "HyMES/dicho.c"
   $177 = ((($176)) + 12|0); //@line 688 "HyMES/dicho.c"
   $178 = HEAP32[$177>>2]|0; //@line 688 "HyMES/dicho.c"
   $179 = (_bread($175,$178)|0); //@line 688 "HyMES/dicho.c"
   $180 = $174 ^ $179; //@line 688 "HyMES/dicho.c"
   $181 = $15; //@line 688 "HyMES/dicho.c"
   $182 = $9; //@line 688 "HyMES/dicho.c"
   $183 = (($182) + ($181<<2)|0); //@line 688 "HyMES/dicho.c"
   HEAP32[$183>>2] = $180; //@line 688 "HyMES/dicho.c"
   $184 = $15; //@line 687 "HyMES/dicho.c"
   $185 = (($184) + 1)|0; //@line 687 "HyMES/dicho.c"
   $15 = $185; //@line 687 "HyMES/dicho.c"
  }
  $186 = $19; //@line 689 "HyMES/dicho.c"
  $187 = $13; //@line 689 "HyMES/dicho.c"
  $188 = Math_imul($186, $187)|0; //@line 689 "HyMES/dicho.c"
  $189 = $17; //@line 689 "HyMES/dicho.c"
  $190 = (($189) + ($188))|0; //@line 689 "HyMES/dicho.c"
  $17 = $190; //@line 689 "HyMES/dicho.c"
 }
 $191 = $20; //@line 692 "HyMES/dicho.c"
 $192 = ((($191)) + 12|0); //@line 692 "HyMES/dicho.c"
 $193 = HEAP32[$192>>2]|0; //@line 692 "HyMES/dicho.c"
 _breadclose($193); //@line 692 "HyMES/dicho.c"
 $194 = $20; //@line 693 "HyMES/dicho.c"
 _free($194); //@line 693 "HyMES/dicho.c"
 $195 = $10; //@line 695 "HyMES/dicho.c"
 $196 = (($195|0) % 8)&-1; //@line 695 "HyMES/dicho.c"
 $197 = ($196|0)!=(0); //@line 695 "HyMES/dicho.c"
 if ($197) {
  $198 = $21; //@line 696 "HyMES/dicho.c"
  $199 = $10; //@line 696 "HyMES/dicho.c"
  $200 = (($199|0) / 8)&-1; //@line 696 "HyMES/dicho.c"
  $201 = $8; //@line 696 "HyMES/dicho.c"
  $202 = (($201) + ($200)|0); //@line 696 "HyMES/dicho.c"
  HEAP8[$202>>0] = $198; //@line 696 "HyMES/dicho.c"
 }
 $203 = $18; //@line 698 "HyMES/dicho.c"
 $204 = (($203|0) % 8)&-1; //@line 698 "HyMES/dicho.c"
 $205 = ($204|0)!=(0); //@line 698 "HyMES/dicho.c"
 if ($205) {
  $206 = $22; //@line 699 "HyMES/dicho.c"
  $207 = $18; //@line 699 "HyMES/dicho.c"
  $208 = (($207|0) / 8)&-1; //@line 699 "HyMES/dicho.c"
  $209 = $8; //@line 699 "HyMES/dicho.c"
  $210 = (($209) + ($208)|0); //@line 699 "HyMES/dicho.c"
  HEAP8[$210>>0] = $206; //@line 699 "HyMES/dicho.c"
 }
 $211 = $17; //@line 702 "HyMES/dicho.c"
 $212 = $11; //@line 702 "HyMES/dicho.c"
 $213 = ($211|0)<($212|0); //@line 702 "HyMES/dicho.c"
 if ($213) {
  $7 = -1; //@line 703 "HyMES/dicho.c"
  $215 = $7; //@line 706 "HyMES/dicho.c"
  STACKTOP = sp;return ($215|0); //@line 706 "HyMES/dicho.c"
 } else {
  $214 = $17; //@line 705 "HyMES/dicho.c"
  $7 = $214; //@line 705 "HyMES/dicho.c"
  $215 = $7; //@line 706 "HyMES/dicho.c"
  STACKTOP = sp;return ($215|0); //@line 706 "HyMES/dicho.c"
 }
 return (0)|0;
}
function _dicho_cw2b($0,$1,$2,$3,$4,$5,$6) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 $5 = $5|0;
 $6 = $6|0;
 var $$byval_copy = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0;
 var $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0;
 var $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0;
 var $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0;
 var $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0;
 var $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0;
 var $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0;
 var $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0;
 var $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $vararg_buffer = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 112|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(112|0);
 $$byval_copy = sp + 68|0;
 $vararg_buffer = sp;
 $8 = $0;
 $9 = $1;
 $10 = $2;
 $11 = $3;
 $12 = $4;
 $13 = $5;
 $24 = $13; //@line 729 "HyMES/dicho.c"
 $25 = ((($6)) + 12|0); //@line 729 "HyMES/dicho.c"
 $26 = HEAP32[$25>>2]|0; //@line 729 "HyMES/dicho.c"
 $27 = ($24|0)!=($26|0); //@line 729 "HyMES/dicho.c"
 if ($27) {
  (_printf(8679,$vararg_buffer)|0); //@line 730 "HyMES/dicho.c"
  _exit(0); //@line 731 "HyMES/dicho.c"
  // unreachable; //@line 731 "HyMES/dicho.c"
 }
 $28 = $12; //@line 729 "HyMES/dicho.c"
 $29 = ((($6)) + 8|0); //@line 729 "HyMES/dicho.c"
 $30 = HEAP32[$29>>2]|0; //@line 729 "HyMES/dicho.c"
 $31 = ($28|0)!=($30|0); //@line 729 "HyMES/dicho.c"
 if ($31) {
  (_printf(8679,$vararg_buffer)|0); //@line 730 "HyMES/dicho.c"
  _exit(0); //@line 731 "HyMES/dicho.c"
  // unreachable; //@line 731 "HyMES/dicho.c"
 }
 $32 = $10; //@line 734 "HyMES/dicho.c"
 $33 = (($32|0) % 8)&-1; //@line 734 "HyMES/dicho.c"
 $34 = ($33|0)!=(0); //@line 734 "HyMES/dicho.c"
 if ($34) {
  $35 = $10; //@line 735 "HyMES/dicho.c"
  $36 = (($35|0) / 8)&-1; //@line 735 "HyMES/dicho.c"
  $37 = $9; //@line 735 "HyMES/dicho.c"
  $38 = (($37) + ($36)|0); //@line 735 "HyMES/dicho.c"
  $39 = HEAP8[$38>>0]|0; //@line 735 "HyMES/dicho.c"
  $40 = $39&255; //@line 735 "HyMES/dicho.c"
  $41 = $10; //@line 735 "HyMES/dicho.c"
  $42 = (($41|0) % 8)&-1; //@line 735 "HyMES/dicho.c"
  $43 = 1 << $42; //@line 735 "HyMES/dicho.c"
  $44 = (($43) - 1)|0; //@line 735 "HyMES/dicho.c"
  $45 = $40 & $44; //@line 735 "HyMES/dicho.c"
  $46 = $45&255; //@line 735 "HyMES/dicho.c"
  $23 = $46; //@line 735 "HyMES/dicho.c"
  $47 = $10; //@line 736 "HyMES/dicho.c"
  $48 = (($47|0) / 8)&-1; //@line 736 "HyMES/dicho.c"
  $49 = $9; //@line 736 "HyMES/dicho.c"
  $50 = (($49) + ($48)|0); //@line 736 "HyMES/dicho.c"
  HEAP8[$50>>0] = 0; //@line 736 "HyMES/dicho.c"
 }
 $51 = $10; //@line 738 "HyMES/dicho.c"
 $52 = $11; //@line 738 "HyMES/dicho.c"
 $53 = (($51) + ($52))|0; //@line 738 "HyMES/dicho.c"
 $18 = $53; //@line 738 "HyMES/dicho.c"
 $54 = $9; //@line 740 "HyMES/dicho.c"
 $55 = $18; //@line 740 "HyMES/dicho.c"
 $56 = (_bwriteinit($54,$55)|0); //@line 740 "HyMES/dicho.c"
 $57 = (_arith_init($56)|0); //@line 740 "HyMES/dicho.c"
 $21 = $57; //@line 740 "HyMES/dicho.c"
 $58 = $21; //@line 742 "HyMES/dicho.c"
 $59 = ((($58)) + 12|0); //@line 742 "HyMES/dicho.c"
 $60 = HEAP32[$59>>2]|0; //@line 742 "HyMES/dicho.c"
 $61 = $10; //@line 742 "HyMES/dicho.c"
 _bwrite_changer_position($60,$61); //@line 742 "HyMES/dicho.c"
 $62 = $12; //@line 753 "HyMES/dicho.c"
 $63 = HEAP32[$6>>2]|0; //@line 753 "HyMES/dicho.c"
 $64 = (($62) - ($63))|0; //@line 753 "HyMES/dicho.c"
 $19 = $64; //@line 753 "HyMES/dicho.c"
 $65 = $19; //@line 754 "HyMES/dicho.c"
 $66 = ($65|0)>(0); //@line 754 "HyMES/dicho.c"
 L10: do {
  if ($66) {
   $67 = $19; //@line 756 "HyMES/dicho.c"
   $68 = 1 << $67; //@line 756 "HyMES/dicho.c"
   $69 = (($68) - 1)|0; //@line 756 "HyMES/dicho.c"
   $20 = $69; //@line 756 "HyMES/dicho.c"
   $15 = 0; //@line 757 "HyMES/dicho.c"
   while(1) {
    $70 = $15; //@line 757 "HyMES/dicho.c"
    $71 = $13; //@line 757 "HyMES/dicho.c"
    $72 = ($70|0)<($71|0); //@line 757 "HyMES/dicho.c"
    if (!($72)) {
     break L10;
    }
    $73 = $15; //@line 758 "HyMES/dicho.c"
    $74 = $8; //@line 758 "HyMES/dicho.c"
    $75 = (($74) + ($73<<2)|0); //@line 758 "HyMES/dicho.c"
    $76 = HEAP32[$75>>2]|0; //@line 758 "HyMES/dicho.c"
    $77 = $20; //@line 758 "HyMES/dicho.c"
    $78 = $76 & $77; //@line 758 "HyMES/dicho.c"
    $79 = $19; //@line 758 "HyMES/dicho.c"
    $80 = $21; //@line 758 "HyMES/dicho.c"
    $81 = ((($80)) + 12|0); //@line 758 "HyMES/dicho.c"
    $82 = HEAP32[$81>>2]|0; //@line 758 "HyMES/dicho.c"
    _bwrite($78,$79,$82); //@line 758 "HyMES/dicho.c"
    $83 = $15; //@line 757 "HyMES/dicho.c"
    $84 = (($83) + 1)|0; //@line 757 "HyMES/dicho.c"
    $15 = $84; //@line 757 "HyMES/dicho.c"
   }
  }
 } while(0);
 $85 = ((($6)) + 4|0); //@line 761 "HyMES/dicho.c"
 $86 = HEAP32[$85>>2]|0; //@line 761 "HyMES/dicho.c"
 $87 = $86<<2; //@line 761 "HyMES/dicho.c"
 $88 = (_malloc($87)|0); //@line 761 "HyMES/dicho.c"
 $22 = $88; //@line 761 "HyMES/dicho.c"
 $89 = $13; //@line 763 "HyMES/dicho.c"
 $90 = ((($6)) + 4|0); //@line 763 "HyMES/dicho.c"
 $91 = HEAP32[$90>>2]|0; //@line 763 "HyMES/dicho.c"
 $92 = ($89|0)==($91|0); //@line 763 "HyMES/dicho.c"
 L16: do {
  if ($92) {
   $15 = 0; //@line 764 "HyMES/dicho.c"
   while(1) {
    $93 = $15; //@line 764 "HyMES/dicho.c"
    $94 = $13; //@line 764 "HyMES/dicho.c"
    $95 = ($93|0)<($94|0); //@line 764 "HyMES/dicho.c"
    if (!($95)) {
     break L16;
    }
    $96 = $15; //@line 765 "HyMES/dicho.c"
    $97 = $8; //@line 765 "HyMES/dicho.c"
    $98 = (($97) + ($96<<2)|0); //@line 765 "HyMES/dicho.c"
    $99 = HEAP32[$98>>2]|0; //@line 765 "HyMES/dicho.c"
    $100 = $19; //@line 765 "HyMES/dicho.c"
    $101 = $99 >> $100; //@line 765 "HyMES/dicho.c"
    $102 = $15; //@line 765 "HyMES/dicho.c"
    $103 = $22; //@line 765 "HyMES/dicho.c"
    $104 = (($103) + ($102<<2)|0); //@line 765 "HyMES/dicho.c"
    HEAP32[$104>>2] = $101; //@line 765 "HyMES/dicho.c"
    $105 = $15; //@line 764 "HyMES/dicho.c"
    $106 = (($105) + 1)|0; //@line 764 "HyMES/dicho.c"
    $15 = $106; //@line 764 "HyMES/dicho.c"
   }
  } else {
   $16 = 0; //@line 768 "HyMES/dicho.c"
   $15 = 0; //@line 769 "HyMES/dicho.c"
   while(1) {
    $107 = $15; //@line 769 "HyMES/dicho.c"
    $108 = $8; //@line 769 "HyMES/dicho.c"
    $109 = HEAP32[$108>>2]|0; //@line 769 "HyMES/dicho.c"
    $110 = $19; //@line 769 "HyMES/dicho.c"
    $111 = $109 >> $110; //@line 769 "HyMES/dicho.c"
    $112 = ($107|0)<($111|0); //@line 769 "HyMES/dicho.c"
    if (!($112)) {
     break;
    }
    $113 = $15; //@line 770 "HyMES/dicho.c"
    $114 = $16; //@line 770 "HyMES/dicho.c"
    $115 = $22; //@line 770 "HyMES/dicho.c"
    $116 = (($115) + ($114<<2)|0); //@line 770 "HyMES/dicho.c"
    HEAP32[$116>>2] = $113; //@line 770 "HyMES/dicho.c"
    $117 = $16; //@line 769 "HyMES/dicho.c"
    $118 = (($117) + 1)|0; //@line 769 "HyMES/dicho.c"
    $16 = $118; //@line 769 "HyMES/dicho.c"
    $119 = $15; //@line 769 "HyMES/dicho.c"
    $120 = (($119) + 1)|0; //@line 769 "HyMES/dicho.c"
    $15 = $120; //@line 769 "HyMES/dicho.c"
   }
   $14 = 1; //@line 771 "HyMES/dicho.c"
   while(1) {
    $121 = $14; //@line 771 "HyMES/dicho.c"
    $122 = $13; //@line 771 "HyMES/dicho.c"
    $123 = ($121|0)<($122|0); //@line 771 "HyMES/dicho.c"
    if (!($123)) {
     break;
    }
    $124 = $14; //@line 772 "HyMES/dicho.c"
    $125 = (($124) - 1)|0; //@line 772 "HyMES/dicho.c"
    $126 = $8; //@line 772 "HyMES/dicho.c"
    $127 = (($126) + ($125<<2)|0); //@line 772 "HyMES/dicho.c"
    $128 = HEAP32[$127>>2]|0; //@line 772 "HyMES/dicho.c"
    $129 = $19; //@line 772 "HyMES/dicho.c"
    $130 = $128 >> $129; //@line 772 "HyMES/dicho.c"
    $131 = (($130) + 1)|0; //@line 772 "HyMES/dicho.c"
    $15 = $131; //@line 772 "HyMES/dicho.c"
    while(1) {
     $132 = $15; //@line 772 "HyMES/dicho.c"
     $133 = $14; //@line 772 "HyMES/dicho.c"
     $134 = $8; //@line 772 "HyMES/dicho.c"
     $135 = (($134) + ($133<<2)|0); //@line 772 "HyMES/dicho.c"
     $136 = HEAP32[$135>>2]|0; //@line 772 "HyMES/dicho.c"
     $137 = $19; //@line 772 "HyMES/dicho.c"
     $138 = $136 >> $137; //@line 772 "HyMES/dicho.c"
     $139 = ($132|0)<($138|0); //@line 772 "HyMES/dicho.c"
     if (!($139)) {
      break;
     }
     $140 = $15; //@line 773 "HyMES/dicho.c"
     $141 = $16; //@line 773 "HyMES/dicho.c"
     $142 = $22; //@line 773 "HyMES/dicho.c"
     $143 = (($142) + ($141<<2)|0); //@line 773 "HyMES/dicho.c"
     HEAP32[$143>>2] = $140; //@line 773 "HyMES/dicho.c"
     $144 = $16; //@line 772 "HyMES/dicho.c"
     $145 = (($144) + 1)|0; //@line 772 "HyMES/dicho.c"
     $16 = $145; //@line 772 "HyMES/dicho.c"
     $146 = $15; //@line 772 "HyMES/dicho.c"
     $147 = (($146) + 1)|0; //@line 772 "HyMES/dicho.c"
     $15 = $147; //@line 772 "HyMES/dicho.c"
    }
    $148 = $14; //@line 771 "HyMES/dicho.c"
    $149 = (($148) + 1)|0; //@line 771 "HyMES/dicho.c"
    $14 = $149; //@line 771 "HyMES/dicho.c"
   }
   $150 = $13; //@line 775 "HyMES/dicho.c"
   $151 = (($150) - 1)|0; //@line 775 "HyMES/dicho.c"
   $152 = $8; //@line 775 "HyMES/dicho.c"
   $153 = (($152) + ($151<<2)|0); //@line 775 "HyMES/dicho.c"
   $154 = HEAP32[$153>>2]|0; //@line 775 "HyMES/dicho.c"
   $155 = $19; //@line 775 "HyMES/dicho.c"
   $156 = $154 >> $155; //@line 775 "HyMES/dicho.c"
   $157 = (($156) + 1)|0; //@line 775 "HyMES/dicho.c"
   $15 = $157; //@line 775 "HyMES/dicho.c"
   while(1) {
    $158 = $15; //@line 775 "HyMES/dicho.c"
    $159 = $12; //@line 775 "HyMES/dicho.c"
    $160 = 1 << $159; //@line 775 "HyMES/dicho.c"
    $161 = ($158|0)<($160|0); //@line 775 "HyMES/dicho.c"
    if (!($161)) {
     break L16;
    }
    $162 = $15; //@line 776 "HyMES/dicho.c"
    $163 = $16; //@line 776 "HyMES/dicho.c"
    $164 = $22; //@line 776 "HyMES/dicho.c"
    $165 = (($164) + ($163<<2)|0); //@line 776 "HyMES/dicho.c"
    HEAP32[$165>>2] = $162; //@line 776 "HyMES/dicho.c"
    $166 = $16; //@line 775 "HyMES/dicho.c"
    $167 = (($166) + 1)|0; //@line 775 "HyMES/dicho.c"
    $16 = $167; //@line 775 "HyMES/dicho.c"
    $168 = $15; //@line 775 "HyMES/dicho.c"
    $169 = (($168) + 1)|0; //@line 775 "HyMES/dicho.c"
    $15 = $169; //@line 775 "HyMES/dicho.c"
   }
  }
 } while(0);
 $170 = $19; //@line 779 "HyMES/dicho.c"
 $171 = $13; //@line 779 "HyMES/dicho.c"
 $172 = Math_imul($170, $171)|0; //@line 779 "HyMES/dicho.c"
 $173 = $22; //@line 779 "HyMES/dicho.c"
 $174 = $21; //@line 779 "HyMES/dicho.c"
 ;HEAP32[$$byval_copy>>2]=HEAP32[$6>>2]|0;HEAP32[$$byval_copy+4>>2]=HEAP32[$6+4>>2]|0;HEAP32[$$byval_copy+8>>2]=HEAP32[$6+8>>2]|0;HEAP32[$$byval_copy+12>>2]=HEAP32[$6+12>>2]|0;HEAP32[$$byval_copy+16>>2]=HEAP32[$6+16>>2]|0;HEAP32[$$byval_copy+20>>2]=HEAP32[$6+20>>2]|0;HEAP32[$$byval_copy+24>>2]=HEAP32[$6+24>>2]|0; //@line 779 "HyMES/dicho.c"
 $175 = (_dicho($173,$174,$$byval_copy)|0); //@line 779 "HyMES/dicho.c"
 $176 = (($172) + ($175))|0; //@line 779 "HyMES/dicho.c"
 $17 = $176; //@line 779 "HyMES/dicho.c"
 $177 = $22; //@line 781 "HyMES/dicho.c"
 _free($177); //@line 781 "HyMES/dicho.c"
 $178 = $21; //@line 783 "HyMES/dicho.c"
 $179 = ((($178)) + 12|0); //@line 783 "HyMES/dicho.c"
 $180 = HEAP32[$179>>2]|0; //@line 783 "HyMES/dicho.c"
 _bwriteclose($180); //@line 783 "HyMES/dicho.c"
 $181 = $21; //@line 784 "HyMES/dicho.c"
 _free($181); //@line 784 "HyMES/dicho.c"
 $182 = $10; //@line 786 "HyMES/dicho.c"
 $183 = (($182|0) % 8)&-1; //@line 786 "HyMES/dicho.c"
 $184 = ($183|0)!=(0); //@line 786 "HyMES/dicho.c"
 if ($184) {
  $185 = $10; //@line 787 "HyMES/dicho.c"
  $186 = (($185|0) % 8)&-1; //@line 787 "HyMES/dicho.c"
  $187 = $10; //@line 787 "HyMES/dicho.c"
  $188 = (($187|0) / 8)&-1; //@line 787 "HyMES/dicho.c"
  $189 = $9; //@line 787 "HyMES/dicho.c"
  $190 = (($189) + ($188)|0); //@line 787 "HyMES/dicho.c"
  $191 = HEAP8[$190>>0]|0; //@line 787 "HyMES/dicho.c"
  $192 = $191&255; //@line 787 "HyMES/dicho.c"
  $193 = $192 << $186; //@line 787 "HyMES/dicho.c"
  $194 = $193&255; //@line 787 "HyMES/dicho.c"
  HEAP8[$190>>0] = $194; //@line 787 "HyMES/dicho.c"
  $195 = $23; //@line 788 "HyMES/dicho.c"
  $196 = $195&255; //@line 788 "HyMES/dicho.c"
  $197 = $10; //@line 788 "HyMES/dicho.c"
  $198 = (($197|0) / 8)&-1; //@line 788 "HyMES/dicho.c"
  $199 = $9; //@line 788 "HyMES/dicho.c"
  $200 = (($199) + ($198)|0); //@line 788 "HyMES/dicho.c"
  $201 = HEAP8[$200>>0]|0; //@line 788 "HyMES/dicho.c"
  $202 = $201&255; //@line 788 "HyMES/dicho.c"
  $203 = $202 ^ $196; //@line 788 "HyMES/dicho.c"
  $204 = $203&255; //@line 788 "HyMES/dicho.c"
  HEAP8[$200>>0] = $204; //@line 788 "HyMES/dicho.c"
 }
 $205 = $18; //@line 790 "HyMES/dicho.c"
 $206 = (($205|0) % 8)&-1; //@line 790 "HyMES/dicho.c"
 $207 = ($206|0)!=(0); //@line 790 "HyMES/dicho.c"
 if ($207) {
  $208 = $18; //@line 791 "HyMES/dicho.c"
  $209 = (($208|0) % 8)&-1; //@line 791 "HyMES/dicho.c"
  $210 = (8 - ($209))|0; //@line 791 "HyMES/dicho.c"
  $211 = $18; //@line 791 "HyMES/dicho.c"
  $212 = (($211|0) / 8)&-1; //@line 791 "HyMES/dicho.c"
  $213 = $9; //@line 791 "HyMES/dicho.c"
  $214 = (($213) + ($212)|0); //@line 791 "HyMES/dicho.c"
  $215 = HEAP8[$214>>0]|0; //@line 791 "HyMES/dicho.c"
  $216 = $215&255; //@line 791 "HyMES/dicho.c"
  $217 = $216 >> $210; //@line 791 "HyMES/dicho.c"
  $218 = $217&255; //@line 791 "HyMES/dicho.c"
  HEAP8[$214>>0] = $218; //@line 791 "HyMES/dicho.c"
 }
 $219 = $17; //@line 794 "HyMES/dicho.c"
 $220 = $11; //@line 794 "HyMES/dicho.c"
 $221 = ($219|0)<($220|0); //@line 794 "HyMES/dicho.c"
 if ($221) {
  $7 = -1; //@line 795 "HyMES/dicho.c"
  $223 = $7; //@line 798 "HyMES/dicho.c"
  STACKTOP = sp;return ($223|0); //@line 798 "HyMES/dicho.c"
 } else {
  $222 = $17; //@line 797 "HyMES/dicho.c"
  $7 = $222; //@line 797 "HyMES/dicho.c"
  $223 = $7; //@line 798 "HyMES/dicho.c"
  STACKTOP = sp;return ($223|0); //@line 798 "HyMES/dicho.c"
 }
 return (0)|0;
}
function _vec_concat($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, dest = 0, label = 0, sp = 0, src = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $3; //@line 36 "HyMES/encrypt.c"
 $7 = $4; //@line 36 "HyMES/encrypt.c"
 _memcpy(($6|0),($7|0),422)|0; //@line 36 "HyMES/encrypt.c"
 $8 = $3; //@line 37 "HyMES/encrypt.c"
 $9 = ((($8)) + 422|0); //@line 37 "HyMES/encrypt.c"
 $10 = $5; //@line 37 "HyMES/encrypt.c"
 dest=$9; src=$10; stop=dest+90|0; do { HEAP8[dest>>0]=HEAP8[src>>0]|0; dest=dest+1|0; src=src+1|0; } while ((dest|0) < (stop|0)); //@line 37 "HyMES/encrypt.c"
 STACKTOP = sp;return; //@line 53 "HyMES/encrypt.c"
}
function _addto($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = 0; //@line 58 "HyMES/encrypt.c"
 while(1) {
  $5 = $4; //@line 58 "HyMES/encrypt.c"
  $6 = ($5>>>0)<(23); //@line 58 "HyMES/encrypt.c"
  if (!($6)) {
   break;
  }
  $7 = $4; //@line 59 "HyMES/encrypt.c"
  $8 = $3; //@line 59 "HyMES/encrypt.c"
  $9 = (($8) + ($7<<2)|0); //@line 59 "HyMES/encrypt.c"
  $10 = HEAP32[$9>>2]|0; //@line 59 "HyMES/encrypt.c"
  $11 = $4; //@line 59 "HyMES/encrypt.c"
  $12 = $2; //@line 59 "HyMES/encrypt.c"
  $13 = (($12) + ($11<<2)|0); //@line 59 "HyMES/encrypt.c"
  $14 = HEAP32[$13>>2]|0; //@line 59 "HyMES/encrypt.c"
  $15 = $14 ^ $10; //@line 59 "HyMES/encrypt.c"
  HEAP32[$13>>2] = $15; //@line 59 "HyMES/encrypt.c"
  $16 = $4; //@line 58 "HyMES/encrypt.c"
  $17 = (($16) + 1)|0; //@line 58 "HyMES/encrypt.c"
  $4 = $17; //@line 58 "HyMES/encrypt.c"
 }
 STACKTOP = sp;return; //@line 60 "HyMES/encrypt.c"
}
function _encrypt_block($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0;
 var $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0;
 var $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $8 = 0, $9 = 0, $cwdata$byval_copy = 0, dest = 0, label = 0, sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 400|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(400|0);
 $cwdata$byval_copy = sp + 360|0;
 $9 = sp + 244|0;
 $11 = sp;
 $4 = $0;
 $5 = $1;
 $6 = $2;
 $12 = $6; //@line 69 "HyMES/encrypt.c"
 $10 = $12; //@line 69 "HyMES/encrypt.c"
 dest=$9; stop=dest+92|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0)); //@line 70 "HyMES/encrypt.c"
 $7 = 0; //@line 71 "HyMES/encrypt.c"
 while(1) {
  $13 = $7; //@line 71 "HyMES/encrypt.c"
  $14 = ($13|0)<(422); //@line 71 "HyMES/encrypt.c"
  $8 = 0; //@line 72 "HyMES/encrypt.c"
  if (!($14)) {
   break;
  }
  while(1) {
   $15 = $8; //@line 72 "HyMES/encrypt.c"
   $16 = ($15|0)<(8); //@line 72 "HyMES/encrypt.c"
   $17 = $7; //@line 73 "HyMES/encrypt.c"
   if (!($16)) {
    break;
   }
   $18 = $5; //@line 73 "HyMES/encrypt.c"
   $19 = (($18) + ($17)|0); //@line 73 "HyMES/encrypt.c"
   $20 = HEAP8[$19>>0]|0; //@line 73 "HyMES/encrypt.c"
   $21 = $20&255; //@line 73 "HyMES/encrypt.c"
   $22 = $8; //@line 73 "HyMES/encrypt.c"
   $23 = 1 << $22; //@line 73 "HyMES/encrypt.c"
   $24 = $21 & $23; //@line 73 "HyMES/encrypt.c"
   $25 = ($24|0)!=(0); //@line 73 "HyMES/encrypt.c"
   if ($25) {
    $26 = $10; //@line 74 "HyMES/encrypt.c"
    _addto($9,$26); //@line 74 "HyMES/encrypt.c"
   }
   $27 = $10; //@line 75 "HyMES/encrypt.c"
   $28 = ((($27)) + 92|0); //@line 75 "HyMES/encrypt.c"
   $10 = $28; //@line 75 "HyMES/encrypt.c"
   $29 = $8; //@line 72 "HyMES/encrypt.c"
   $30 = (($29) + 1)|0; //@line 72 "HyMES/encrypt.c"
   $8 = $30; //@line 72 "HyMES/encrypt.c"
  }
  $31 = (($17) + 1)|0; //@line 71 "HyMES/encrypt.c"
  $7 = $31; //@line 71 "HyMES/encrypt.c"
 }
 while(1) {
  $32 = $8; //@line 78 "HyMES/encrypt.c"
  $33 = ($32|0)<(0); //@line 78 "HyMES/encrypt.c"
  if (!($33)) {
   break;
  }
  $34 = $7; //@line 79 "HyMES/encrypt.c"
  $35 = $5; //@line 79 "HyMES/encrypt.c"
  $36 = (($35) + ($34)|0); //@line 79 "HyMES/encrypt.c"
  $37 = HEAP8[$36>>0]|0; //@line 79 "HyMES/encrypt.c"
  $38 = $37&255; //@line 79 "HyMES/encrypt.c"
  $39 = $8; //@line 79 "HyMES/encrypt.c"
  $40 = 1 << $39; //@line 79 "HyMES/encrypt.c"
  $41 = $38 & $40; //@line 79 "HyMES/encrypt.c"
  $42 = ($41|0)!=(0); //@line 79 "HyMES/encrypt.c"
  if ($42) {
   $43 = $10; //@line 80 "HyMES/encrypt.c"
   _addto($9,$43); //@line 80 "HyMES/encrypt.c"
  }
  $44 = $10; //@line 81 "HyMES/encrypt.c"
  $45 = ((($44)) + 92|0); //@line 81 "HyMES/encrypt.c"
  $10 = $45; //@line 81 "HyMES/encrypt.c"
  $46 = $8; //@line 78 "HyMES/encrypt.c"
  $47 = (($46) + 1)|0; //@line 78 "HyMES/encrypt.c"
  $8 = $47; //@line 78 "HyMES/encrypt.c"
 }
 $48 = $5; //@line 86 "HyMES/encrypt.c"
 ;HEAP32[$cwdata$byval_copy>>2]=HEAP32[8>>2]|0;HEAP32[$cwdata$byval_copy+4>>2]=HEAP32[8+4>>2]|0;HEAP32[$cwdata$byval_copy+8>>2]=HEAP32[8+8>>2]|0;HEAP32[$cwdata$byval_copy+12>>2]=HEAP32[8+12>>2]|0;HEAP32[$cwdata$byval_copy+16>>2]=HEAP32[8+16>>2]|0;HEAP32[$cwdata$byval_copy+20>>2]=HEAP32[8+20>>2]|0;HEAP32[$cwdata$byval_copy+24>>2]=HEAP32[8+24>>2]|0; //@line 86 "HyMES/encrypt.c"
 $49 = (_dicho_b2cw($48,$11,3376,446,12,60,$cwdata$byval_copy)|0); //@line 86 "HyMES/encrypt.c"
 $7 = $49; //@line 86 "HyMES/encrypt.c"
 $50 = $7; //@line 92 "HyMES/encrypt.c"
 $51 = ($50|0)<(0); //@line 92 "HyMES/encrypt.c"
 if ($51) {
  $3 = -1; //@line 93 "HyMES/encrypt.c"
  $73 = $3; //@line 104 "HyMES/encrypt.c"
  STACKTOP = sp;return ($73|0); //@line 104 "HyMES/encrypt.c"
 }
 $52 = $4; //@line 96 "HyMES/encrypt.c"
 $53 = $5; //@line 96 "HyMES/encrypt.c"
 _vec_concat($52,$53,$9); //@line 96 "HyMES/encrypt.c"
 $7 = 0; //@line 99 "HyMES/encrypt.c"
 while(1) {
  $54 = $7; //@line 99 "HyMES/encrypt.c"
  $55 = ($54|0)<(60); //@line 99 "HyMES/encrypt.c"
  if (!($55)) {
   break;
  }
  $56 = $7; //@line 100 "HyMES/encrypt.c"
  $57 = (($11) + ($56<<2)|0); //@line 100 "HyMES/encrypt.c"
  $58 = HEAP32[$57>>2]|0; //@line 100 "HyMES/encrypt.c"
  $59 = (($58|0) % 8)&-1; //@line 100 "HyMES/encrypt.c"
  $60 = 1 << $59; //@line 100 "HyMES/encrypt.c"
  $61 = $7; //@line 100 "HyMES/encrypt.c"
  $62 = (($11) + ($61<<2)|0); //@line 100 "HyMES/encrypt.c"
  $63 = HEAP32[$62>>2]|0; //@line 100 "HyMES/encrypt.c"
  $64 = (($63|0) / 8)&-1; //@line 100 "HyMES/encrypt.c"
  $65 = $4; //@line 100 "HyMES/encrypt.c"
  $66 = (($65) + ($64)|0); //@line 100 "HyMES/encrypt.c"
  $67 = HEAP8[$66>>0]|0; //@line 100 "HyMES/encrypt.c"
  $68 = $67&255; //@line 100 "HyMES/encrypt.c"
  $69 = $68 ^ $60; //@line 100 "HyMES/encrypt.c"
  $70 = $69&255; //@line 100 "HyMES/encrypt.c"
  HEAP8[$66>>0] = $70; //@line 100 "HyMES/encrypt.c"
  $71 = $7; //@line 99 "HyMES/encrypt.c"
  $72 = (($71) + 1)|0; //@line 99 "HyMES/encrypt.c"
  $7 = $72; //@line 99 "HyMES/encrypt.c"
 }
 $3 = 1; //@line 103 "HyMES/encrypt.c"
 $73 = $3; //@line 104 "HyMES/encrypt.c"
 STACKTOP = sp;return ($73|0); //@line 104 "HyMES/encrypt.c"
}
function _gf_init_exp() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = HEAP32[2862]|0; //@line 57 "HyMES/gf.c"
 $2 = 1 << $1; //@line 57 "HyMES/gf.c"
 $3 = $2<<1; //@line 57 "HyMES/gf.c"
 $4 = (_malloc($3)|0); //@line 57 "HyMES/gf.c"
 HEAP32[2863] = $4; //@line 57 "HyMES/gf.c"
 $5 = HEAP32[2863]|0; //@line 59 "HyMES/gf.c"
 HEAP16[$5>>1] = 1; //@line 59 "HyMES/gf.c"
 $0 = 1; //@line 60 "HyMES/gf.c"
 while(1) {
  $6 = $0; //@line 60 "HyMES/gf.c"
  $7 = HEAP32[2861]|0; //@line 60 "HyMES/gf.c"
  $8 = ($6|0)<($7|0); //@line 60 "HyMES/gf.c"
  if (!($8)) {
   break;
  }
  $9 = $0; //@line 61 "HyMES/gf.c"
  $10 = (($9) - 1)|0; //@line 61 "HyMES/gf.c"
  $11 = HEAP32[2863]|0; //@line 61 "HyMES/gf.c"
  $12 = (($11) + ($10<<1)|0); //@line 61 "HyMES/gf.c"
  $13 = HEAP16[$12>>1]|0; //@line 61 "HyMES/gf.c"
  $14 = $13&65535; //@line 61 "HyMES/gf.c"
  $15 = $14 << 1; //@line 61 "HyMES/gf.c"
  $16 = $15&65535; //@line 61 "HyMES/gf.c"
  $17 = $0; //@line 61 "HyMES/gf.c"
  $18 = HEAP32[2863]|0; //@line 61 "HyMES/gf.c"
  $19 = (($18) + ($17<<1)|0); //@line 61 "HyMES/gf.c"
  HEAP16[$19>>1] = $16; //@line 61 "HyMES/gf.c"
  $20 = $0; //@line 62 "HyMES/gf.c"
  $21 = (($20) - 1)|0; //@line 62 "HyMES/gf.c"
  $22 = HEAP32[2863]|0; //@line 62 "HyMES/gf.c"
  $23 = (($22) + ($21<<1)|0); //@line 62 "HyMES/gf.c"
  $24 = HEAP16[$23>>1]|0; //@line 62 "HyMES/gf.c"
  $25 = $24&65535; //@line 62 "HyMES/gf.c"
  $26 = HEAP32[2862]|0; //@line 62 "HyMES/gf.c"
  $27 = (($26) - 1)|0; //@line 62 "HyMES/gf.c"
  $28 = 1 << $27; //@line 62 "HyMES/gf.c"
  $29 = $25 & $28; //@line 62 "HyMES/gf.c"
  $30 = ($29|0)!=(0); //@line 62 "HyMES/gf.c"
  if ($30) {
   $31 = HEAP32[2862]|0; //@line 63 "HyMES/gf.c"
   $32 = (7240 + ($31<<2)|0); //@line 63 "HyMES/gf.c"
   $33 = HEAP32[$32>>2]|0; //@line 63 "HyMES/gf.c"
   $34 = $0; //@line 63 "HyMES/gf.c"
   $35 = HEAP32[2863]|0; //@line 63 "HyMES/gf.c"
   $36 = (($35) + ($34<<1)|0); //@line 63 "HyMES/gf.c"
   $37 = HEAP16[$36>>1]|0; //@line 63 "HyMES/gf.c"
   $38 = $37&65535; //@line 63 "HyMES/gf.c"
   $39 = $38 ^ $33; //@line 63 "HyMES/gf.c"
   $40 = $39&65535; //@line 63 "HyMES/gf.c"
   HEAP16[$36>>1] = $40; //@line 63 "HyMES/gf.c"
  }
  $41 = $0; //@line 60 "HyMES/gf.c"
  $42 = (($41) + 1)|0; //@line 60 "HyMES/gf.c"
  $0 = $42; //@line 60 "HyMES/gf.c"
 }
 $43 = HEAP32[2861]|0; //@line 66 "HyMES/gf.c"
 $44 = HEAP32[2863]|0; //@line 66 "HyMES/gf.c"
 $45 = (($44) + ($43<<1)|0); //@line 66 "HyMES/gf.c"
 HEAP16[$45>>1] = 1; //@line 66 "HyMES/gf.c"
 STACKTOP = sp;return; //@line 67 "HyMES/gf.c"
}
function _gf_init_log() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = HEAP32[2862]|0; //@line 74 "HyMES/gf.c"
 $2 = 1 << $1; //@line 74 "HyMES/gf.c"
 $3 = $2<<1; //@line 74 "HyMES/gf.c"
 $4 = (_malloc($3)|0); //@line 74 "HyMES/gf.c"
 HEAP32[2860] = $4; //@line 74 "HyMES/gf.c"
 $5 = HEAP32[2861]|0; //@line 76 "HyMES/gf.c"
 $6 = $5&65535; //@line 76 "HyMES/gf.c"
 $7 = HEAP32[2860]|0; //@line 76 "HyMES/gf.c"
 HEAP16[$7>>1] = $6; //@line 76 "HyMES/gf.c"
 $0 = 0; //@line 77 "HyMES/gf.c"
 while(1) {
  $8 = $0; //@line 77 "HyMES/gf.c"
  $9 = HEAP32[2861]|0; //@line 77 "HyMES/gf.c"
  $10 = ($8|0)<($9|0); //@line 77 "HyMES/gf.c"
  if (!($10)) {
   break;
  }
  $11 = $0; //@line 78 "HyMES/gf.c"
  $12 = $11&65535; //@line 78 "HyMES/gf.c"
  $13 = $0; //@line 78 "HyMES/gf.c"
  $14 = HEAP32[2863]|0; //@line 78 "HyMES/gf.c"
  $15 = (($14) + ($13<<1)|0); //@line 78 "HyMES/gf.c"
  $16 = HEAP16[$15>>1]|0; //@line 78 "HyMES/gf.c"
  $17 = $16&65535; //@line 78 "HyMES/gf.c"
  $18 = HEAP32[2860]|0; //@line 78 "HyMES/gf.c"
  $19 = (($18) + ($17<<1)|0); //@line 78 "HyMES/gf.c"
  HEAP16[$19>>1] = $12; //@line 78 "HyMES/gf.c"
  $20 = $0; //@line 77 "HyMES/gf.c"
  $21 = (($20) + 1)|0; //@line 77 "HyMES/gf.c"
  $0 = $21; //@line 77 "HyMES/gf.c"
 }
 STACKTOP = sp;return; //@line 79 "HyMES/gf.c"
}
function _gf_init($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $vararg_buffer = sp;
 $1 = $0;
 $2 = $1; //@line 85 "HyMES/gf.c"
 $3 = ($2|0)>(16); //@line 85 "HyMES/gf.c"
 if ($3) {
  $4 = HEAP32[1827]|0; //@line 86 "HyMES/gf.c"
  $5 = $1; //@line 86 "HyMES/gf.c"
  HEAP32[$vararg_buffer>>2] = $5; //@line 86 "HyMES/gf.c"
  (_fprintf($4,8722,$vararg_buffer)|0); //@line 86 "HyMES/gf.c"
  _exit(0); //@line 87 "HyMES/gf.c"
  // unreachable; //@line 87 "HyMES/gf.c"
 }
 $6 = HEAP32[2868]|0; //@line 89 "HyMES/gf.c"
 $7 = $1; //@line 89 "HyMES/gf.c"
 $8 = ($6|0)!=($7|0); //@line 89 "HyMES/gf.c"
 if (!($8)) {
  STACKTOP = sp;return 1; //@line 101 "HyMES/gf.c"
 }
 $9 = HEAP32[2868]|0; //@line 90 "HyMES/gf.c"
 $10 = ($9|0)!=(0); //@line 90 "HyMES/gf.c"
 if ($10) {
  $11 = HEAP32[2863]|0; //@line 91 "HyMES/gf.c"
  _free($11); //@line 91 "HyMES/gf.c"
  $12 = HEAP32[2860]|0; //@line 92 "HyMES/gf.c"
  _free($12); //@line 92 "HyMES/gf.c"
 }
 $13 = $1; //@line 94 "HyMES/gf.c"
 HEAP32[2862] = $13; //@line 94 "HyMES/gf.c"
 HEAP32[2868] = $13; //@line 94 "HyMES/gf.c"
 $14 = $1; //@line 95 "HyMES/gf.c"
 $15 = 1 << $14; //@line 95 "HyMES/gf.c"
 HEAP32[2864] = $15; //@line 95 "HyMES/gf.c"
 $16 = HEAP32[2864]|0; //@line 96 "HyMES/gf.c"
 $17 = (($16) - 1)|0; //@line 96 "HyMES/gf.c"
 HEAP32[2861] = $17; //@line 96 "HyMES/gf.c"
 _gf_init_exp(); //@line 97 "HyMES/gf.c"
 _gf_init_log(); //@line 98 "HyMES/gf.c"
 STACKTOP = sp;return 1; //@line 101 "HyMES/gf.c"
}
function _gf_rand($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1; //@line 123 "HyMES/gf.c"
 $3 = (FUNCTION_TABLE_i[$2 & 31]()|0); //@line 123 "HyMES/gf.c"
 $4 = $1; //@line 123 "HyMES/gf.c"
 $5 = (FUNCTION_TABLE_i[$4 & 31]()|0); //@line 123 "HyMES/gf.c"
 $6 = $5 << 8; //@line 123 "HyMES/gf.c"
 $7 = $3 ^ $6; //@line 123 "HyMES/gf.c"
 $8 = HEAP32[2861]|0; //@line 123 "HyMES/gf.c"
 $9 = $7 & $8; //@line 123 "HyMES/gf.c"
 $10 = $9&65535; //@line 123 "HyMES/gf.c"
 STACKTOP = sp;return ($10|0); //@line 123 "HyMES/gf.c"
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
function _gop_supr($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $2 = $0;
 $3 = $1;
 $4 = 0; //@line 43 "HyMES/keypair.c"
 while(1) {
  $7 = $4; //@line 43 "HyMES/keypair.c"
  $8 = $2; //@line 43 "HyMES/keypair.c"
  $9 = ($7>>>0)<($8>>>0); //@line 43 "HyMES/keypair.c"
  if (!($9)) {
   break;
  }
  $10 = $4; //@line 45 "HyMES/keypair.c"
  $11 = (_u32rnd()|0); //@line 45 "HyMES/keypair.c"
  $12 = $2; //@line 45 "HyMES/keypair.c"
  $13 = $4; //@line 45 "HyMES/keypair.c"
  $14 = (($12) - ($13))|0; //@line 45 "HyMES/keypair.c"
  $15 = (($11>>>0) % ($14>>>0))&-1; //@line 45 "HyMES/keypair.c"
  $16 = (($10) + ($15))|0; //@line 45 "HyMES/keypair.c"
  $5 = $16; //@line 45 "HyMES/keypair.c"
  $17 = $5; //@line 47 "HyMES/keypair.c"
  $18 = $3; //@line 47 "HyMES/keypair.c"
  $19 = (($18) + ($17<<1)|0); //@line 47 "HyMES/keypair.c"
  $20 = HEAP16[$19>>1]|0; //@line 47 "HyMES/keypair.c"
  $6 = $20; //@line 47 "HyMES/keypair.c"
  $21 = $4; //@line 48 "HyMES/keypair.c"
  $22 = $3; //@line 48 "HyMES/keypair.c"
  $23 = (($22) + ($21<<1)|0); //@line 48 "HyMES/keypair.c"
  $24 = HEAP16[$23>>1]|0; //@line 48 "HyMES/keypair.c"
  $25 = $5; //@line 48 "HyMES/keypair.c"
  $26 = $3; //@line 48 "HyMES/keypair.c"
  $27 = (($26) + ($25<<1)|0); //@line 48 "HyMES/keypair.c"
  HEAP16[$27>>1] = $24; //@line 48 "HyMES/keypair.c"
  $28 = $6; //@line 49 "HyMES/keypair.c"
  $29 = $4; //@line 49 "HyMES/keypair.c"
  $30 = $3; //@line 49 "HyMES/keypair.c"
  $31 = (($30) + ($29<<1)|0); //@line 49 "HyMES/keypair.c"
  HEAP16[$31>>1] = $28; //@line 49 "HyMES/keypair.c"
  $32 = $4; //@line 43 "HyMES/keypair.c"
  $33 = (($32) + 1)|0; //@line 43 "HyMES/keypair.c"
  $4 = $33; //@line 43 "HyMES/keypair.c"
 }
 STACKTOP = sp;return; //@line 51 "HyMES/keypair.c"
}
function _key_genmat($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0;
 var $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0;
 var $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0;
 var $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0;
 var $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0;
 var $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0;
 var $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0;
 var $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0;
 var $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0;
 var $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0;
 var $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16432|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16432|0);
 $15 = sp;
 $3 = $0;
 $4 = $1;
 $13 = 4096; //@line 66 "HyMES/keypair.c"
 $12 = 720; //@line 67 "HyMES/keypair.c"
 $16 = $12; //@line 69 "HyMES/keypair.c"
 $17 = $13; //@line 69 "HyMES/keypair.c"
 $18 = (_mat_ini($16,$17)|0); //@line 69 "HyMES/keypair.c"
 $7 = $18; //@line 69 "HyMES/keypair.c"
 $19 = $7; //@line 70 "HyMES/keypair.c"
 $20 = ((($19)) + 16|0); //@line 70 "HyMES/keypair.c"
 $21 = HEAP32[$20>>2]|0; //@line 70 "HyMES/keypair.c"
 $22 = $7; //@line 70 "HyMES/keypair.c"
 $23 = ((($22)) + 12|0); //@line 70 "HyMES/keypair.c"
 $24 = HEAP32[$23>>2]|0; //@line 70 "HyMES/keypair.c"
 _memset(($21|0),0,($24|0))|0; //@line 70 "HyMES/keypair.c"
 $9 = 0; //@line 72 "HyMES/keypair.c"
 while(1) {
  $25 = $9; //@line 72 "HyMES/keypair.c"
  $26 = $13; //@line 72 "HyMES/keypair.c"
  $27 = ($25|0)<($26|0); //@line 72 "HyMES/keypair.c"
  if (!($27)) {
   break;
  }
  $28 = $4; //@line 74 "HyMES/keypair.c"
  $29 = $9; //@line 74 "HyMES/keypair.c"
  $30 = $3; //@line 74 "HyMES/keypair.c"
  $31 = (($30) + ($29<<1)|0); //@line 74 "HyMES/keypair.c"
  $32 = HEAP16[$31>>1]|0; //@line 74 "HyMES/keypair.c"
  $33 = (_poly_eval($28,$32)|0); //@line 74 "HyMES/keypair.c"
  $5 = $33; //@line 74 "HyMES/keypair.c"
  $34 = HEAP32[2861]|0; //@line 75 "HyMES/keypair.c"
  $35 = $5; //@line 75 "HyMES/keypair.c"
  $36 = $35&65535; //@line 75 "HyMES/keypair.c"
  $37 = HEAP32[2860]|0; //@line 75 "HyMES/keypair.c"
  $38 = (($37) + ($36<<1)|0); //@line 75 "HyMES/keypair.c"
  $39 = HEAP16[$38>>1]|0; //@line 75 "HyMES/keypair.c"
  $40 = $39&65535; //@line 75 "HyMES/keypair.c"
  $41 = (($34) - ($40))|0; //@line 75 "HyMES/keypair.c"
  $42 = HEAP32[2863]|0; //@line 75 "HyMES/keypair.c"
  $43 = (($42) + ($41<<1)|0); //@line 75 "HyMES/keypair.c"
  $44 = HEAP16[$43>>1]|0; //@line 75 "HyMES/keypair.c"
  $5 = $44; //@line 75 "HyMES/keypair.c"
  $45 = $5; //@line 76 "HyMES/keypair.c"
  $6 = $45; //@line 76 "HyMES/keypair.c"
  $10 = 0; //@line 77 "HyMES/keypair.c"
  while(1) {
   $46 = $10; //@line 77 "HyMES/keypair.c"
   $47 = ($46|0)<(60); //@line 77 "HyMES/keypair.c"
   if (!($47)) {
    break;
   }
   $11 = 0; //@line 79 "HyMES/keypair.c"
   while(1) {
    $48 = $11; //@line 79 "HyMES/keypair.c"
    $49 = ($48|0)<(12); //@line 79 "HyMES/keypair.c"
    $50 = $6; //@line 81 "HyMES/keypair.c"
    $51 = $50&65535; //@line 81 "HyMES/keypair.c"
    if (!($49)) {
     break;
    }
    $52 = $11; //@line 81 "HyMES/keypair.c"
    $53 = 1 << $52; //@line 81 "HyMES/keypair.c"
    $54 = $51 & $53; //@line 81 "HyMES/keypair.c"
    $55 = ($54|0)!=(0); //@line 81 "HyMES/keypair.c"
    if ($55) {
     $56 = $9; //@line 82 "HyMES/keypair.c"
     $57 = (($56>>>0) % 32)&-1; //@line 82 "HyMES/keypair.c"
     $58 = 1 << $57; //@line 82 "HyMES/keypair.c"
     $59 = $10; //@line 82 "HyMES/keypair.c"
     $60 = ($59*12)|0; //@line 82 "HyMES/keypair.c"
     $61 = $11; //@line 82 "HyMES/keypair.c"
     $62 = (($60) + ($61))|0; //@line 82 "HyMES/keypair.c"
     $63 = $7; //@line 82 "HyMES/keypair.c"
     $64 = ((($63)) + 8|0); //@line 82 "HyMES/keypair.c"
     $65 = HEAP32[$64>>2]|0; //@line 82 "HyMES/keypair.c"
     $66 = Math_imul($62, $65)|0; //@line 82 "HyMES/keypair.c"
     $67 = $9; //@line 82 "HyMES/keypair.c"
     $68 = (($67>>>0) / 32)&-1; //@line 82 "HyMES/keypair.c"
     $69 = (($66) + ($68))|0; //@line 82 "HyMES/keypair.c"
     $70 = $7; //@line 82 "HyMES/keypair.c"
     $71 = ((($70)) + 16|0); //@line 82 "HyMES/keypair.c"
     $72 = HEAP32[$71>>2]|0; //@line 82 "HyMES/keypair.c"
     $73 = (($72) + ($69<<2)|0); //@line 82 "HyMES/keypair.c"
     $74 = HEAP32[$73>>2]|0; //@line 82 "HyMES/keypair.c"
     $75 = $74 | $58; //@line 82 "HyMES/keypair.c"
     HEAP32[$73>>2] = $75; //@line 82 "HyMES/keypair.c"
    }
    $76 = $11; //@line 79 "HyMES/keypair.c"
    $77 = (($76) + 1)|0; //@line 79 "HyMES/keypair.c"
    $11 = $77; //@line 79 "HyMES/keypair.c"
   }
   $78 = ($51|0)!=(0); //@line 84 "HyMES/keypair.c"
   if ($78) {
    $79 = $9; //@line 84 "HyMES/keypair.c"
    $80 = $3; //@line 84 "HyMES/keypair.c"
    $81 = (($80) + ($79<<1)|0); //@line 84 "HyMES/keypair.c"
    $82 = HEAP16[$81>>1]|0; //@line 84 "HyMES/keypair.c"
    $83 = $82&65535; //@line 84 "HyMES/keypair.c"
    $84 = ($83|0)!=(0); //@line 84 "HyMES/keypair.c"
    if ($84) {
     $85 = $6; //@line 84 "HyMES/keypair.c"
     $86 = $85&65535; //@line 84 "HyMES/keypair.c"
     $87 = HEAP32[2860]|0; //@line 84 "HyMES/keypair.c"
     $88 = (($87) + ($86<<1)|0); //@line 84 "HyMES/keypair.c"
     $89 = HEAP16[$88>>1]|0; //@line 84 "HyMES/keypair.c"
     $90 = $89&65535; //@line 84 "HyMES/keypair.c"
     $91 = $9; //@line 84 "HyMES/keypair.c"
     $92 = $3; //@line 84 "HyMES/keypair.c"
     $93 = (($92) + ($91<<1)|0); //@line 84 "HyMES/keypair.c"
     $94 = HEAP16[$93>>1]|0; //@line 84 "HyMES/keypair.c"
     $95 = $94&65535; //@line 84 "HyMES/keypair.c"
     $96 = HEAP32[2860]|0; //@line 84 "HyMES/keypair.c"
     $97 = (($96) + ($95<<1)|0); //@line 84 "HyMES/keypair.c"
     $98 = HEAP16[$97>>1]|0; //@line 84 "HyMES/keypair.c"
     $99 = $98&65535; //@line 84 "HyMES/keypair.c"
     $100 = (($90) + ($99))|0; //@line 84 "HyMES/keypair.c"
     $101 = HEAP32[2861]|0; //@line 84 "HyMES/keypair.c"
     $102 = $100 & $101; //@line 84 "HyMES/keypair.c"
     $103 = $6; //@line 84 "HyMES/keypair.c"
     $104 = $103&65535; //@line 84 "HyMES/keypair.c"
     $105 = HEAP32[2860]|0; //@line 84 "HyMES/keypair.c"
     $106 = (($105) + ($104<<1)|0); //@line 84 "HyMES/keypair.c"
     $107 = HEAP16[$106>>1]|0; //@line 84 "HyMES/keypair.c"
     $108 = $107&65535; //@line 84 "HyMES/keypair.c"
     $109 = $9; //@line 84 "HyMES/keypair.c"
     $110 = $3; //@line 84 "HyMES/keypair.c"
     $111 = (($110) + ($109<<1)|0); //@line 84 "HyMES/keypair.c"
     $112 = HEAP16[$111>>1]|0; //@line 84 "HyMES/keypair.c"
     $113 = $112&65535; //@line 84 "HyMES/keypair.c"
     $114 = HEAP32[2860]|0; //@line 84 "HyMES/keypair.c"
     $115 = (($114) + ($113<<1)|0); //@line 84 "HyMES/keypair.c"
     $116 = HEAP16[$115>>1]|0; //@line 84 "HyMES/keypair.c"
     $117 = $116&65535; //@line 84 "HyMES/keypair.c"
     $118 = (($108) + ($117))|0; //@line 84 "HyMES/keypair.c"
     $119 = HEAP32[2862]|0; //@line 84 "HyMES/keypair.c"
     $120 = $118 >> $119; //@line 84 "HyMES/keypair.c"
     $121 = (($102) + ($120))|0; //@line 84 "HyMES/keypair.c"
     $122 = HEAP32[2863]|0; //@line 84 "HyMES/keypair.c"
     $123 = (($122) + ($121<<1)|0); //@line 84 "HyMES/keypair.c"
     $124 = HEAP16[$123>>1]|0; //@line 84 "HyMES/keypair.c"
     $125 = $124&65535; //@line 84 "HyMES/keypair.c"
     $127 = $125;
    } else {
     $127 = 0;
    }
   } else {
    $127 = 0;
   }
   $126 = $127&65535; //@line 84 "HyMES/keypair.c"
   $6 = $126; //@line 84 "HyMES/keypair.c"
   $128 = $10; //@line 77 "HyMES/keypair.c"
   $129 = (($128) + 1)|0; //@line 77 "HyMES/keypair.c"
   $10 = $129; //@line 77 "HyMES/keypair.c"
  }
  $130 = $9; //@line 72 "HyMES/keypair.c"
  $131 = (($130) + 1)|0; //@line 72 "HyMES/keypair.c"
  $9 = $131; //@line 72 "HyMES/keypair.c"
 }
 $132 = $7; //@line 88 "HyMES/keypair.c"
 $133 = (_mat_rref($132)|0); //@line 88 "HyMES/keypair.c"
 $14 = $133; //@line 88 "HyMES/keypair.c"
 $134 = $14; //@line 89 "HyMES/keypair.c"
 $135 = ($134|0)==(0|0); //@line 89 "HyMES/keypair.c"
 if ($135) {
  $136 = $7; //@line 90 "HyMES/keypair.c"
  _mat_free($136); //@line 90 "HyMES/keypair.c"
  $2 = 0; //@line 91 "HyMES/keypair.c"
  $230 = $2; //@line 110 "HyMES/keypair.c"
  STACKTOP = sp;return ($230|0); //@line 110 "HyMES/keypair.c"
 }
 $137 = $13; //@line 94 "HyMES/keypair.c"
 $138 = $12; //@line 94 "HyMES/keypair.c"
 $139 = (($137) - ($138))|0; //@line 94 "HyMES/keypair.c"
 $140 = $12; //@line 94 "HyMES/keypair.c"
 $141 = (_mat_ini($139,$140)|0); //@line 94 "HyMES/keypair.c"
 $8 = $141; //@line 94 "HyMES/keypair.c"
 $142 = $8; //@line 95 "HyMES/keypair.c"
 $143 = ((($142)) + 16|0); //@line 95 "HyMES/keypair.c"
 $144 = HEAP32[$143>>2]|0; //@line 95 "HyMES/keypair.c"
 $145 = $8; //@line 95 "HyMES/keypair.c"
 $146 = ((($145)) + 12|0); //@line 95 "HyMES/keypair.c"
 $147 = HEAP32[$146>>2]|0; //@line 95 "HyMES/keypair.c"
 _memset(($144|0),0,($147|0))|0; //@line 95 "HyMES/keypair.c"
 $9 = 0; //@line 96 "HyMES/keypair.c"
 while(1) {
  $148 = $9; //@line 96 "HyMES/keypair.c"
  $149 = $8; //@line 96 "HyMES/keypair.c"
  $150 = HEAP32[$149>>2]|0; //@line 96 "HyMES/keypair.c"
  $151 = ($148|0)<($150|0); //@line 96 "HyMES/keypair.c"
  if (!($151)) {
   break;
  }
  $10 = 0; //@line 97 "HyMES/keypair.c"
  while(1) {
   $152 = $10; //@line 97 "HyMES/keypair.c"
   $153 = $8; //@line 97 "HyMES/keypair.c"
   $154 = ((($153)) + 4|0); //@line 97 "HyMES/keypair.c"
   $155 = HEAP32[$154>>2]|0; //@line 97 "HyMES/keypair.c"
   $156 = ($152|0)<($155|0); //@line 97 "HyMES/keypair.c"
   if (!($156)) {
    break;
   }
   $157 = $10; //@line 98 "HyMES/keypair.c"
   $158 = $7; //@line 98 "HyMES/keypair.c"
   $159 = ((($158)) + 8|0); //@line 98 "HyMES/keypair.c"
   $160 = HEAP32[$159>>2]|0; //@line 98 "HyMES/keypair.c"
   $161 = Math_imul($157, $160)|0; //@line 98 "HyMES/keypair.c"
   $162 = $9; //@line 98 "HyMES/keypair.c"
   $163 = $14; //@line 98 "HyMES/keypair.c"
   $164 = (($163) + ($162<<2)|0); //@line 98 "HyMES/keypair.c"
   $165 = HEAP32[$164>>2]|0; //@line 98 "HyMES/keypair.c"
   $166 = (($165>>>0) / 32)&-1; //@line 98 "HyMES/keypair.c"
   $167 = (($161) + ($166))|0; //@line 98 "HyMES/keypair.c"
   $168 = $7; //@line 98 "HyMES/keypair.c"
   $169 = ((($168)) + 16|0); //@line 98 "HyMES/keypair.c"
   $170 = HEAP32[$169>>2]|0; //@line 98 "HyMES/keypair.c"
   $171 = (($170) + ($167<<2)|0); //@line 98 "HyMES/keypair.c"
   $172 = HEAP32[$171>>2]|0; //@line 98 "HyMES/keypair.c"
   $173 = $9; //@line 98 "HyMES/keypair.c"
   $174 = $14; //@line 98 "HyMES/keypair.c"
   $175 = (($174) + ($173<<2)|0); //@line 98 "HyMES/keypair.c"
   $176 = HEAP32[$175>>2]|0; //@line 98 "HyMES/keypair.c"
   $177 = (($176>>>0) % 32)&-1; //@line 98 "HyMES/keypair.c"
   $178 = $172 >>> $177; //@line 98 "HyMES/keypair.c"
   $179 = $178 & 1; //@line 98 "HyMES/keypair.c"
   $180 = ($179|0)!=(0); //@line 98 "HyMES/keypair.c"
   if ($180) {
    $181 = $10; //@line 99 "HyMES/keypair.c"
    $182 = (($181>>>0) % 32)&-1; //@line 99 "HyMES/keypair.c"
    $183 = 1 << $182; //@line 99 "HyMES/keypair.c"
    $184 = $9; //@line 99 "HyMES/keypair.c"
    $185 = $8; //@line 99 "HyMES/keypair.c"
    $186 = ((($185)) + 8|0); //@line 99 "HyMES/keypair.c"
    $187 = HEAP32[$186>>2]|0; //@line 99 "HyMES/keypair.c"
    $188 = Math_imul($184, $187)|0; //@line 99 "HyMES/keypair.c"
    $189 = $10; //@line 99 "HyMES/keypair.c"
    $190 = (($189>>>0) / 32)&-1; //@line 99 "HyMES/keypair.c"
    $191 = (($188) + ($190))|0; //@line 99 "HyMES/keypair.c"
    $192 = $8; //@line 99 "HyMES/keypair.c"
    $193 = ((($192)) + 16|0); //@line 99 "HyMES/keypair.c"
    $194 = HEAP32[$193>>2]|0; //@line 99 "HyMES/keypair.c"
    $195 = (($194) + ($191<<2)|0); //@line 99 "HyMES/keypair.c"
    $196 = HEAP32[$195>>2]|0; //@line 99 "HyMES/keypair.c"
    $197 = $196 ^ $183; //@line 99 "HyMES/keypair.c"
    HEAP32[$195>>2] = $197; //@line 99 "HyMES/keypair.c"
   }
   $198 = $10; //@line 97 "HyMES/keypair.c"
   $199 = (($198) + 1)|0; //@line 97 "HyMES/keypair.c"
   $10 = $199; //@line 97 "HyMES/keypair.c"
  }
  $200 = $9; //@line 96 "HyMES/keypair.c"
  $201 = (($200) + 1)|0; //@line 96 "HyMES/keypair.c"
  $9 = $201; //@line 96 "HyMES/keypair.c"
 }
 $9 = 0; //@line 101 "HyMES/keypair.c"
 while(1) {
  $202 = $9; //@line 101 "HyMES/keypair.c"
  $203 = ($202|0)<(4096); //@line 101 "HyMES/keypair.c"
  if (!($203)) {
   break;
  }
  $204 = $9; //@line 102 "HyMES/keypair.c"
  $205 = $14; //@line 102 "HyMES/keypair.c"
  $206 = (($205) + ($204<<2)|0); //@line 102 "HyMES/keypair.c"
  $207 = HEAP32[$206>>2]|0; //@line 102 "HyMES/keypair.c"
  $208 = $3; //@line 102 "HyMES/keypair.c"
  $209 = (($208) + ($207<<1)|0); //@line 102 "HyMES/keypair.c"
  $210 = HEAP16[$209>>1]|0; //@line 102 "HyMES/keypair.c"
  $211 = $210&65535; //@line 102 "HyMES/keypair.c"
  $212 = $9; //@line 102 "HyMES/keypair.c"
  $213 = (($15) + ($212<<2)|0); //@line 102 "HyMES/keypair.c"
  HEAP32[$213>>2] = $211; //@line 102 "HyMES/keypair.c"
  $214 = $9; //@line 101 "HyMES/keypair.c"
  $215 = (($214) + 1)|0; //@line 101 "HyMES/keypair.c"
  $9 = $215; //@line 101 "HyMES/keypair.c"
 }
 $9 = 0; //@line 103 "HyMES/keypair.c"
 while(1) {
  $216 = $9; //@line 103 "HyMES/keypair.c"
  $217 = ($216|0)<(4096); //@line 103 "HyMES/keypair.c"
  if (!($217)) {
   break;
  }
  $218 = $9; //@line 104 "HyMES/keypair.c"
  $219 = (($15) + ($218<<2)|0); //@line 104 "HyMES/keypair.c"
  $220 = HEAP32[$219>>2]|0; //@line 104 "HyMES/keypair.c"
  $221 = $220&65535; //@line 104 "HyMES/keypair.c"
  $222 = $9; //@line 104 "HyMES/keypair.c"
  $223 = $3; //@line 104 "HyMES/keypair.c"
  $224 = (($223) + ($222<<1)|0); //@line 104 "HyMES/keypair.c"
  HEAP16[$224>>1] = $221; //@line 104 "HyMES/keypair.c"
  $225 = $9; //@line 103 "HyMES/keypair.c"
  $226 = (($225) + 1)|0; //@line 103 "HyMES/keypair.c"
  $9 = $226; //@line 103 "HyMES/keypair.c"
 }
 $227 = $7; //@line 106 "HyMES/keypair.c"
 _mat_free($227); //@line 106 "HyMES/keypair.c"
 $228 = $14; //@line 107 "HyMES/keypair.c"
 _free($228); //@line 107 "HyMES/keypair.c"
 $229 = $8; //@line 109 "HyMES/keypair.c"
 $2 = $229; //@line 109 "HyMES/keypair.c"
 $230 = $2; //@line 110 "HyMES/keypair.c"
 STACKTOP = sp;return ($230|0); //@line 110 "HyMES/keypair.c"
}
function _keypair($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0;
 var $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0;
 var $154 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0;
 var $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0;
 var $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0;
 var $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0;
 var $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, dest = 0, label = 0, sp = 0, src = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(64|0);
 $2 = $0;
 $3 = $1;
 (_gf_init(12)|0); //@line 120 "HyMES/keypair.c"
 $15 = (_malloc(8192)|0); //@line 123 "HyMES/keypair.c"
 $9 = $15; //@line 123 "HyMES/keypair.c"
 $4 = 0; //@line 125 "HyMES/keypair.c"
 while(1) {
  $16 = $4; //@line 125 "HyMES/keypair.c"
  $17 = ($16|0)<(4096); //@line 125 "HyMES/keypair.c"
  if (!($17)) {
   break;
  }
  $18 = $4; //@line 126 "HyMES/keypair.c"
  $19 = $18&65535; //@line 126 "HyMES/keypair.c"
  $20 = $4; //@line 126 "HyMES/keypair.c"
  $21 = $9; //@line 126 "HyMES/keypair.c"
  $22 = (($21) + ($20<<1)|0); //@line 126 "HyMES/keypair.c"
  HEAP16[$22>>1] = $19; //@line 126 "HyMES/keypair.c"
  $23 = $4; //@line 125 "HyMES/keypair.c"
  $24 = (($23) + 1)|0; //@line 125 "HyMES/keypair.c"
  $4 = $24; //@line 125 "HyMES/keypair.c"
 }
 $25 = $9; //@line 127 "HyMES/keypair.c"
 _gop_supr(4096,$25); //@line 127 "HyMES/keypair.c"
 while(1) {
  $26 = (_poly_randgen_irred(60,18)|0); //@line 131 "HyMES/keypair.c"
  $11 = $26; //@line 131 "HyMES/keypair.c"
  $27 = $9; //@line 132 "HyMES/keypair.c"
  $28 = $11; //@line 132 "HyMES/keypair.c"
  $29 = (_key_genmat($27,$28)|0); //@line 132 "HyMES/keypair.c"
  $14 = $29; //@line 132 "HyMES/keypair.c"
  $30 = $14; //@line 133 "HyMES/keypair.c"
  $31 = ($30|0)==(0|0); //@line 133 "HyMES/keypair.c"
  if ($31) {
   $32 = $11; //@line 134 "HyMES/keypair.c"
   _poly_free($32); //@line 134 "HyMES/keypair.c"
  }
  $33 = $14; //@line 135 "HyMES/keypair.c"
  $34 = ($33|0)==(0|0); //@line 135 "HyMES/keypair.c"
  if (!($34)) {
   break;
  }
 }
 $35 = $11; //@line 137 "HyMES/keypair.c"
 $36 = (_poly_sqrtmod_init($35)|0); //@line 137 "HyMES/keypair.c"
 $12 = $36; //@line 137 "HyMES/keypair.c"
 $37 = $11; //@line 138 "HyMES/keypair.c"
 $38 = $9; //@line 138 "HyMES/keypair.c"
 $39 = (_poly_syndrome_init($37,$38,4096)|0); //@line 138 "HyMES/keypair.c"
 $13 = $39; //@line 138 "HyMES/keypair.c"
 $4 = 0; //@line 145 "HyMES/keypair.c"
 while(1) {
  $40 = $4; //@line 145 "HyMES/keypair.c"
  $41 = ($40|0)<(4096); //@line 145 "HyMES/keypair.c"
  if (!($41)) {
   break;
  }
  $42 = $2; //@line 146 "HyMES/keypair.c"
  dest=$42; stop=dest+92|0; do { HEAP8[dest>>0]=0|0; dest=dest+1|0; } while ((dest|0) < (stop|0)); //@line 146 "HyMES/keypair.c"
  $43 = $2; //@line 147 "HyMES/keypair.c"
  $8 = $43; //@line 147 "HyMES/keypair.c"
  $7 = 0; //@line 148 "HyMES/keypair.c"
  while(1) {
   $44 = $7; //@line 148 "HyMES/keypair.c"
   $45 = ($44|0)<(60); //@line 148 "HyMES/keypair.c"
   if (!($45)) {
    break;
   }
   $46 = $7; //@line 149 "HyMES/keypair.c"
   $47 = ($46*12)|0; //@line 149 "HyMES/keypair.c"
   $48 = (($47>>>0) / 32)&-1; //@line 149 "HyMES/keypair.c"
   $6 = $48; //@line 149 "HyMES/keypair.c"
   $49 = $7; //@line 150 "HyMES/keypair.c"
   $50 = ($49*12)|0; //@line 150 "HyMES/keypair.c"
   $51 = (($50>>>0) % 32)&-1; //@line 150 "HyMES/keypair.c"
   $5 = $51; //@line 150 "HyMES/keypair.c"
   $52 = $7; //@line 151 "HyMES/keypair.c"
   $53 = $4; //@line 151 "HyMES/keypair.c"
   $54 = $13; //@line 151 "HyMES/keypair.c"
   $55 = (($54) + ($53<<2)|0); //@line 151 "HyMES/keypair.c"
   $56 = HEAP32[$55>>2]|0; //@line 151 "HyMES/keypair.c"
   $57 = ((($56)) + 8|0); //@line 151 "HyMES/keypair.c"
   $58 = HEAP32[$57>>2]|0; //@line 151 "HyMES/keypair.c"
   $59 = (($58) + ($52<<1)|0); //@line 151 "HyMES/keypair.c"
   $60 = HEAP16[$59>>1]|0; //@line 151 "HyMES/keypair.c"
   $61 = $60&65535; //@line 151 "HyMES/keypair.c"
   $62 = $5; //@line 151 "HyMES/keypair.c"
   $63 = $61 << $62; //@line 151 "HyMES/keypair.c"
   $64 = $6; //@line 151 "HyMES/keypair.c"
   $65 = $8; //@line 151 "HyMES/keypair.c"
   $66 = (($65) + ($64<<2)|0); //@line 151 "HyMES/keypair.c"
   $67 = HEAP32[$66>>2]|0; //@line 151 "HyMES/keypair.c"
   $68 = $67 ^ $63; //@line 151 "HyMES/keypair.c"
   HEAP32[$66>>2] = $68; //@line 151 "HyMES/keypair.c"
   $69 = $5; //@line 152 "HyMES/keypair.c"
   $70 = (($69) + 12)|0; //@line 152 "HyMES/keypair.c"
   $71 = ($70>>>0)>(32); //@line 152 "HyMES/keypair.c"
   if ($71) {
    $72 = $7; //@line 153 "HyMES/keypair.c"
    $73 = $4; //@line 153 "HyMES/keypair.c"
    $74 = $13; //@line 153 "HyMES/keypair.c"
    $75 = (($74) + ($73<<2)|0); //@line 153 "HyMES/keypair.c"
    $76 = HEAP32[$75>>2]|0; //@line 153 "HyMES/keypair.c"
    $77 = ((($76)) + 8|0); //@line 153 "HyMES/keypair.c"
    $78 = HEAP32[$77>>2]|0; //@line 153 "HyMES/keypair.c"
    $79 = (($78) + ($72<<1)|0); //@line 153 "HyMES/keypair.c"
    $80 = HEAP16[$79>>1]|0; //@line 153 "HyMES/keypair.c"
    $81 = $80&65535; //@line 153 "HyMES/keypair.c"
    $82 = $5; //@line 153 "HyMES/keypair.c"
    $83 = (32 - ($82))|0; //@line 153 "HyMES/keypair.c"
    $84 = $81 >> $83; //@line 153 "HyMES/keypair.c"
    $85 = $6; //@line 153 "HyMES/keypair.c"
    $86 = (($85) + 1)|0; //@line 153 "HyMES/keypair.c"
    $87 = $8; //@line 153 "HyMES/keypair.c"
    $88 = (($87) + ($86<<2)|0); //@line 153 "HyMES/keypair.c"
    $89 = HEAP32[$88>>2]|0; //@line 153 "HyMES/keypair.c"
    $90 = $89 ^ $84; //@line 153 "HyMES/keypair.c"
    HEAP32[$88>>2] = $90; //@line 153 "HyMES/keypair.c"
   }
   $91 = $7; //@line 148 "HyMES/keypair.c"
   $92 = (($91) + 1)|0; //@line 148 "HyMES/keypair.c"
   $7 = $92; //@line 148 "HyMES/keypair.c"
  }
  $93 = $2; //@line 155 "HyMES/keypair.c"
  $94 = ((($93)) + 92|0); //@line 155 "HyMES/keypair.c"
  $2 = $94; //@line 155 "HyMES/keypair.c"
  $95 = $4; //@line 156 "HyMES/keypair.c"
  $96 = $13; //@line 156 "HyMES/keypair.c"
  $97 = (($96) + ($95<<2)|0); //@line 156 "HyMES/keypair.c"
  $98 = HEAP32[$97>>2]|0; //@line 156 "HyMES/keypair.c"
  _poly_free($98); //@line 156 "HyMES/keypair.c"
  $99 = $4; //@line 145 "HyMES/keypair.c"
  $100 = (($99) + 1)|0; //@line 145 "HyMES/keypair.c"
  $4 = $100; //@line 145 "HyMES/keypair.c"
 }
 $101 = $13; //@line 158 "HyMES/keypair.c"
 _free($101); //@line 158 "HyMES/keypair.c"
 $102 = (_malloc(8192)|0); //@line 162 "HyMES/keypair.c"
 $10 = $102; //@line 162 "HyMES/keypair.c"
 $4 = 0; //@line 163 "HyMES/keypair.c"
 while(1) {
  $103 = $4; //@line 163 "HyMES/keypair.c"
  $104 = ($103|0)<(4096); //@line 163 "HyMES/keypair.c"
  if (!($104)) {
   break;
  }
  $105 = $4; //@line 164 "HyMES/keypair.c"
  $106 = $105&65535; //@line 164 "HyMES/keypair.c"
  $107 = $4; //@line 164 "HyMES/keypair.c"
  $108 = $9; //@line 164 "HyMES/keypair.c"
  $109 = (($108) + ($107<<1)|0); //@line 164 "HyMES/keypair.c"
  $110 = HEAP16[$109>>1]|0; //@line 164 "HyMES/keypair.c"
  $111 = $110&65535; //@line 164 "HyMES/keypair.c"
  $112 = $10; //@line 164 "HyMES/keypair.c"
  $113 = (($112) + ($111<<1)|0); //@line 164 "HyMES/keypair.c"
  HEAP16[$113>>1] = $106; //@line 164 "HyMES/keypair.c"
  $114 = $4; //@line 163 "HyMES/keypair.c"
  $115 = (($114) + 1)|0; //@line 163 "HyMES/keypair.c"
  $4 = $115; //@line 163 "HyMES/keypair.c"
 }
 $116 = $2; //@line 165 "HyMES/keypair.c"
 $117 = $10; //@line 165 "HyMES/keypair.c"
 _memcpy(($116|0),($117|0),8192)|0; //@line 165 "HyMES/keypair.c"
 $118 = $2; //@line 166 "HyMES/keypair.c"
 $119 = ((($118)) + 8192|0); //@line 166 "HyMES/keypair.c"
 $2 = $119; //@line 166 "HyMES/keypair.c"
 $120 = $9; //@line 167 "HyMES/keypair.c"
 _free($120); //@line 167 "HyMES/keypair.c"
 $121 = $10; //@line 168 "HyMES/keypair.c"
 _free($121); //@line 168 "HyMES/keypair.c"
 $122 = $2; //@line 170 "HyMES/keypair.c"
 $123 = $11; //@line 170 "HyMES/keypair.c"
 $124 = ((($123)) + 8|0); //@line 170 "HyMES/keypair.c"
 $125 = HEAP32[$124>>2]|0; //@line 170 "HyMES/keypair.c"
 dest=$122; src=$125; stop=dest+122|0; do { HEAP8[dest>>0]=HEAP8[src>>0]|0; dest=dest+1|0; src=src+1|0; } while ((dest|0) < (stop|0)); //@line 170 "HyMES/keypair.c"
 $126 = $2; //@line 171 "HyMES/keypair.c"
 $127 = ((($126)) + 122|0); //@line 171 "HyMES/keypair.c"
 $2 = $127; //@line 171 "HyMES/keypair.c"
 $128 = $11; //@line 172 "HyMES/keypair.c"
 _poly_free($128); //@line 172 "HyMES/keypair.c"
 $4 = 0; //@line 174 "HyMES/keypair.c"
 while(1) {
  $129 = $4; //@line 174 "HyMES/keypair.c"
  $130 = ($129|0)<(60); //@line 174 "HyMES/keypair.c"
  if (!($130)) {
   break;
  }
  $131 = $2; //@line 175 "HyMES/keypair.c"
  $132 = $4; //@line 175 "HyMES/keypair.c"
  $133 = $12; //@line 175 "HyMES/keypair.c"
  $134 = (($133) + ($132<<2)|0); //@line 175 "HyMES/keypair.c"
  $135 = HEAP32[$134>>2]|0; //@line 175 "HyMES/keypair.c"
  $136 = ((($135)) + 8|0); //@line 175 "HyMES/keypair.c"
  $137 = HEAP32[$136>>2]|0; //@line 175 "HyMES/keypair.c"
  dest=$131; src=$137; stop=dest+120|0; do { HEAP8[dest>>0]=HEAP8[src>>0]|0; dest=dest+1|0; src=src+1|0; } while ((dest|0) < (stop|0)); //@line 175 "HyMES/keypair.c"
  $138 = $2; //@line 176 "HyMES/keypair.c"
  $139 = ((($138)) + 120|0); //@line 176 "HyMES/keypair.c"
  $2 = $139; //@line 176 "HyMES/keypair.c"
  $140 = $4; //@line 177 "HyMES/keypair.c"
  $141 = $12; //@line 177 "HyMES/keypair.c"
  $142 = (($141) + ($140<<2)|0); //@line 177 "HyMES/keypair.c"
  $143 = HEAP32[$142>>2]|0; //@line 177 "HyMES/keypair.c"
  _poly_free($143); //@line 177 "HyMES/keypair.c"
  $144 = $4; //@line 174 "HyMES/keypair.c"
  $145 = (($144) + 1)|0; //@line 174 "HyMES/keypair.c"
  $4 = $145; //@line 174 "HyMES/keypair.c"
 }
 $146 = $12; //@line 179 "HyMES/keypair.c"
 _free($146); //@line 179 "HyMES/keypair.c"
 $147 = $3; //@line 181 "HyMES/keypair.c"
 $148 = $14; //@line 181 "HyMES/keypair.c"
 $149 = ((($148)) + 16|0); //@line 181 "HyMES/keypair.c"
 $150 = HEAP32[$149>>2]|0; //@line 181 "HyMES/keypair.c"
 $151 = $14; //@line 181 "HyMES/keypair.c"
 $152 = ((($151)) + 12|0); //@line 181 "HyMES/keypair.c"
 $153 = HEAP32[$152>>2]|0; //@line 181 "HyMES/keypair.c"
 _memcpy(($147|0),($150|0),($153|0))|0; //@line 181 "HyMES/keypair.c"
 $154 = $14; //@line 182 "HyMES/keypair.c"
 _mat_free($154); //@line 182 "HyMES/keypair.c"
 STACKTOP = sp;return 1; //@line 184 "HyMES/keypair.c"
}
function _mat_ini($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $5 = (_malloc(20)|0); //@line 37 "HyMES/mat.c"
 $4 = $5; //@line 37 "HyMES/mat.c"
 $6 = $3; //@line 38 "HyMES/mat.c"
 $7 = $4; //@line 38 "HyMES/mat.c"
 $8 = ((($7)) + 4|0); //@line 38 "HyMES/mat.c"
 HEAP32[$8>>2] = $6; //@line 38 "HyMES/mat.c"
 $9 = $2; //@line 39 "HyMES/mat.c"
 $10 = $4; //@line 39 "HyMES/mat.c"
 HEAP32[$10>>2] = $9; //@line 39 "HyMES/mat.c"
 $11 = $3; //@line 40 "HyMES/mat.c"
 $12 = (($11) - 1)|0; //@line 40 "HyMES/mat.c"
 $13 = (($12>>>0) / 32)&-1; //@line 40 "HyMES/mat.c"
 $14 = (1 + ($13))|0; //@line 40 "HyMES/mat.c"
 $15 = $4; //@line 40 "HyMES/mat.c"
 $16 = ((($15)) + 8|0); //@line 40 "HyMES/mat.c"
 HEAP32[$16>>2] = $14; //@line 40 "HyMES/mat.c"
 $17 = $2; //@line 41 "HyMES/mat.c"
 $18 = $4; //@line 41 "HyMES/mat.c"
 $19 = ((($18)) + 8|0); //@line 41 "HyMES/mat.c"
 $20 = HEAP32[$19>>2]|0; //@line 41 "HyMES/mat.c"
 $21 = Math_imul($17, $20)|0; //@line 41 "HyMES/mat.c"
 $22 = $21<<2; //@line 41 "HyMES/mat.c"
 $23 = $4; //@line 41 "HyMES/mat.c"
 $24 = ((($23)) + 12|0); //@line 41 "HyMES/mat.c"
 HEAP32[$24>>2] = $22; //@line 41 "HyMES/mat.c"
 $25 = $4; //@line 42 "HyMES/mat.c"
 $26 = ((($25)) + 12|0); //@line 42 "HyMES/mat.c"
 $27 = HEAP32[$26>>2]|0; //@line 42 "HyMES/mat.c"
 $28 = (_malloc($27)|0); //@line 42 "HyMES/mat.c"
 $29 = $4; //@line 42 "HyMES/mat.c"
 $30 = ((($29)) + 16|0); //@line 42 "HyMES/mat.c"
 HEAP32[$30>>2] = $28; //@line 42 "HyMES/mat.c"
 $31 = $4; //@line 43 "HyMES/mat.c"
 STACKTOP = sp;return ($31|0); //@line 43 "HyMES/mat.c"
}
function _mat_free($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1; //@line 62 "HyMES/mat.c"
 $3 = ((($2)) + 16|0); //@line 62 "HyMES/mat.c"
 $4 = HEAP32[$3>>2]|0; //@line 62 "HyMES/mat.c"
 _free($4); //@line 62 "HyMES/mat.c"
 $5 = $1; //@line 63 "HyMES/mat.c"
 _free($5); //@line 63 "HyMES/mat.c"
 STACKTOP = sp;return; //@line 64 "HyMES/mat.c"
}
function _mat_rowxor($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = 0; //@line 81 "HyMES/mat.c"
 while(1) {
  $7 = $6; //@line 81 "HyMES/mat.c"
  $8 = $3; //@line 81 "HyMES/mat.c"
  $9 = ((($8)) + 8|0); //@line 81 "HyMES/mat.c"
  $10 = HEAP32[$9>>2]|0; //@line 81 "HyMES/mat.c"
  $11 = ($7|0)<($10|0); //@line 81 "HyMES/mat.c"
  if (!($11)) {
   break;
  }
  $12 = $5; //@line 83 "HyMES/mat.c"
  $13 = $3; //@line 83 "HyMES/mat.c"
  $14 = ((($13)) + 8|0); //@line 83 "HyMES/mat.c"
  $15 = HEAP32[$14>>2]|0; //@line 83 "HyMES/mat.c"
  $16 = Math_imul($12, $15)|0; //@line 83 "HyMES/mat.c"
  $17 = $6; //@line 83 "HyMES/mat.c"
  $18 = (($16) + ($17))|0; //@line 83 "HyMES/mat.c"
  $19 = $3; //@line 83 "HyMES/mat.c"
  $20 = ((($19)) + 16|0); //@line 83 "HyMES/mat.c"
  $21 = HEAP32[$20>>2]|0; //@line 83 "HyMES/mat.c"
  $22 = (($21) + ($18<<2)|0); //@line 83 "HyMES/mat.c"
  $23 = HEAP32[$22>>2]|0; //@line 83 "HyMES/mat.c"
  $24 = $4; //@line 83 "HyMES/mat.c"
  $25 = $3; //@line 83 "HyMES/mat.c"
  $26 = ((($25)) + 8|0); //@line 83 "HyMES/mat.c"
  $27 = HEAP32[$26>>2]|0; //@line 83 "HyMES/mat.c"
  $28 = Math_imul($24, $27)|0; //@line 83 "HyMES/mat.c"
  $29 = $6; //@line 83 "HyMES/mat.c"
  $30 = (($28) + ($29))|0; //@line 83 "HyMES/mat.c"
  $31 = $3; //@line 83 "HyMES/mat.c"
  $32 = ((($31)) + 16|0); //@line 83 "HyMES/mat.c"
  $33 = HEAP32[$32>>2]|0; //@line 83 "HyMES/mat.c"
  $34 = (($33) + ($30<<2)|0); //@line 83 "HyMES/mat.c"
  $35 = HEAP32[$34>>2]|0; //@line 83 "HyMES/mat.c"
  $36 = $35 ^ $23; //@line 83 "HyMES/mat.c"
  HEAP32[$34>>2] = $36; //@line 83 "HyMES/mat.c"
  $37 = $6; //@line 81 "HyMES/mat.c"
  $38 = (($37) + 1)|0; //@line 81 "HyMES/mat.c"
  $6 = $38; //@line 81 "HyMES/mat.c"
 }
 $39 = $3; //@line 85 "HyMES/mat.c"
 STACKTOP = sp;return ($39|0); //@line 85 "HyMES/mat.c"
}
function _mat_rref($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0;
 var $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0;
 var $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0;
 var $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0;
 var $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0;
 var $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0;
 var $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $2 = $0;
 $9 = $2; //@line 93 "HyMES/mat.c"
 $10 = ((($9)) + 4|0); //@line 93 "HyMES/mat.c"
 $11 = HEAP32[$10>>2]|0; //@line 93 "HyMES/mat.c"
 $12 = (($11) - 1)|0; //@line 93 "HyMES/mat.c"
 $7 = $12; //@line 93 "HyMES/mat.c"
 $13 = $2; //@line 96 "HyMES/mat.c"
 $14 = ((($13)) + 4|0); //@line 96 "HyMES/mat.c"
 $15 = HEAP32[$14>>2]|0; //@line 96 "HyMES/mat.c"
 $16 = $15<<2; //@line 96 "HyMES/mat.c"
 $17 = (_malloc($16)|0); //@line 96 "HyMES/mat.c"
 $8 = $17; //@line 96 "HyMES/mat.c"
 $3 = 0; //@line 98 "HyMES/mat.c"
 while(1) {
  $18 = $3; //@line 98 "HyMES/mat.c"
  $19 = $2; //@line 98 "HyMES/mat.c"
  $20 = ((($19)) + 4|0); //@line 98 "HyMES/mat.c"
  $21 = HEAP32[$20>>2]|0; //@line 98 "HyMES/mat.c"
  $22 = ($18|0)<($21|0); //@line 98 "HyMES/mat.c"
  if (!($22)) {
   break;
  }
  $23 = $3; //@line 99 "HyMES/mat.c"
  $24 = $3; //@line 99 "HyMES/mat.c"
  $25 = $8; //@line 99 "HyMES/mat.c"
  $26 = (($25) + ($24<<2)|0); //@line 99 "HyMES/mat.c"
  HEAP32[$26>>2] = $23; //@line 99 "HyMES/mat.c"
  $27 = $3; //@line 98 "HyMES/mat.c"
  $28 = (($27) + 1)|0; //@line 98 "HyMES/mat.c"
  $3 = $28; //@line 98 "HyMES/mat.c"
 }
 $5 = 0; //@line 100 "HyMES/mat.c"
 $3 = 0; //@line 102 "HyMES/mat.c"
 L5: while(1) {
  $29 = $3; //@line 102 "HyMES/mat.c"
  $30 = $2; //@line 102 "HyMES/mat.c"
  $31 = HEAP32[$30>>2]|0; //@line 102 "HyMES/mat.c"
  $32 = ($29|0)<($31|0); //@line 102 "HyMES/mat.c"
  if (!($32)) {
   label = 28;
   break;
  }
  $6 = 0; //@line 104 "HyMES/mat.c"
  $33 = $3; //@line 105 "HyMES/mat.c"
  $4 = $33; //@line 105 "HyMES/mat.c"
  while(1) {
   $34 = $4; //@line 105 "HyMES/mat.c"
   $35 = $2; //@line 105 "HyMES/mat.c"
   $36 = HEAP32[$35>>2]|0; //@line 105 "HyMES/mat.c"
   $37 = ($34|0)<($36|0); //@line 105 "HyMES/mat.c"
   if (!($37)) {
    break;
   }
   $38 = $4; //@line 107 "HyMES/mat.c"
   $39 = $2; //@line 107 "HyMES/mat.c"
   $40 = ((($39)) + 8|0); //@line 107 "HyMES/mat.c"
   $41 = HEAP32[$40>>2]|0; //@line 107 "HyMES/mat.c"
   $42 = Math_imul($38, $41)|0; //@line 107 "HyMES/mat.c"
   $43 = $7; //@line 107 "HyMES/mat.c"
   $44 = (($43>>>0) / 32)&-1; //@line 107 "HyMES/mat.c"
   $45 = (($42) + ($44))|0; //@line 107 "HyMES/mat.c"
   $46 = $2; //@line 107 "HyMES/mat.c"
   $47 = ((($46)) + 16|0); //@line 107 "HyMES/mat.c"
   $48 = HEAP32[$47>>2]|0; //@line 107 "HyMES/mat.c"
   $49 = (($48) + ($45<<2)|0); //@line 107 "HyMES/mat.c"
   $50 = HEAP32[$49>>2]|0; //@line 107 "HyMES/mat.c"
   $51 = $7; //@line 107 "HyMES/mat.c"
   $52 = (($51>>>0) % 32)&-1; //@line 107 "HyMES/mat.c"
   $53 = $50 >>> $52; //@line 107 "HyMES/mat.c"
   $54 = $53 & 1; //@line 107 "HyMES/mat.c"
   $55 = ($54|0)!=(0); //@line 107 "HyMES/mat.c"
   if ($55) {
    label = 9;
    break;
   }
   $63 = $4; //@line 105 "HyMES/mat.c"
   $64 = (($63) + 1)|0; //@line 105 "HyMES/mat.c"
   $4 = $64; //@line 105 "HyMES/mat.c"
  }
  if ((label|0) == 9) {
   label = 0;
   $56 = $3; //@line 110 "HyMES/mat.c"
   $57 = $4; //@line 110 "HyMES/mat.c"
   $58 = ($56|0)!=($57|0); //@line 110 "HyMES/mat.c"
   if ($58) {
    $59 = $2; //@line 111 "HyMES/mat.c"
    $60 = $3; //@line 111 "HyMES/mat.c"
    $61 = $4; //@line 111 "HyMES/mat.c"
    $62 = (_mat_rowxor($59,$60,$61)|0); //@line 111 "HyMES/mat.c"
    $2 = $62; //@line 111 "HyMES/mat.c"
   }
   $6 = 1; //@line 112 "HyMES/mat.c"
  }
  $65 = $6; //@line 118 "HyMES/mat.c"
  $66 = ($65|0)!=(0); //@line 118 "HyMES/mat.c"
  $67 = $7; //@line 130 "HyMES/mat.c"
  L18: do {
   if ($66) {
    $85 = $3; //@line 130 "HyMES/mat.c"
    $86 = $2; //@line 130 "HyMES/mat.c"
    $87 = ((($86)) + 4|0); //@line 130 "HyMES/mat.c"
    $88 = HEAP32[$87>>2]|0; //@line 130 "HyMES/mat.c"
    $89 = (($85) + ($88))|0; //@line 130 "HyMES/mat.c"
    $90 = $2; //@line 130 "HyMES/mat.c"
    $91 = HEAP32[$90>>2]|0; //@line 130 "HyMES/mat.c"
    $92 = (($89) - ($91))|0; //@line 130 "HyMES/mat.c"
    $93 = $8; //@line 130 "HyMES/mat.c"
    $94 = (($93) + ($92<<2)|0); //@line 130 "HyMES/mat.c"
    HEAP32[$94>>2] = $67; //@line 130 "HyMES/mat.c"
    $95 = $3; //@line 131 "HyMES/mat.c"
    $96 = (($95) + 1)|0; //@line 131 "HyMES/mat.c"
    $4 = $96; //@line 131 "HyMES/mat.c"
    while(1) {
     $97 = $4; //@line 131 "HyMES/mat.c"
     $98 = $2; //@line 131 "HyMES/mat.c"
     $99 = HEAP32[$98>>2]|0; //@line 131 "HyMES/mat.c"
     $100 = ($97|0)<($99|0); //@line 131 "HyMES/mat.c"
     if (!($100)) {
      break;
     }
     $101 = $4; //@line 133 "HyMES/mat.c"
     $102 = $2; //@line 133 "HyMES/mat.c"
     $103 = ((($102)) + 8|0); //@line 133 "HyMES/mat.c"
     $104 = HEAP32[$103>>2]|0; //@line 133 "HyMES/mat.c"
     $105 = Math_imul($101, $104)|0; //@line 133 "HyMES/mat.c"
     $106 = $7; //@line 133 "HyMES/mat.c"
     $107 = (($106>>>0) / 32)&-1; //@line 133 "HyMES/mat.c"
     $108 = (($105) + ($107))|0; //@line 133 "HyMES/mat.c"
     $109 = $2; //@line 133 "HyMES/mat.c"
     $110 = ((($109)) + 16|0); //@line 133 "HyMES/mat.c"
     $111 = HEAP32[$110>>2]|0; //@line 133 "HyMES/mat.c"
     $112 = (($111) + ($108<<2)|0); //@line 133 "HyMES/mat.c"
     $113 = HEAP32[$112>>2]|0; //@line 133 "HyMES/mat.c"
     $114 = $7; //@line 133 "HyMES/mat.c"
     $115 = (($114>>>0) % 32)&-1; //@line 133 "HyMES/mat.c"
     $116 = $113 >>> $115; //@line 133 "HyMES/mat.c"
     $117 = $116 & 1; //@line 133 "HyMES/mat.c"
     $118 = ($117|0)!=(0); //@line 133 "HyMES/mat.c"
     if ($118) {
      $119 = $2; //@line 134 "HyMES/mat.c"
      $120 = $4; //@line 134 "HyMES/mat.c"
      $121 = $3; //@line 134 "HyMES/mat.c"
      $122 = (_mat_rowxor($119,$120,$121)|0); //@line 134 "HyMES/mat.c"
      $2 = $122; //@line 134 "HyMES/mat.c"
     }
     $123 = $4; //@line 131 "HyMES/mat.c"
     $124 = (($123) + 1)|0; //@line 131 "HyMES/mat.c"
     $4 = $124; //@line 131 "HyMES/mat.c"
    }
    $125 = $3; //@line 137 "HyMES/mat.c"
    $126 = (($125) - 1)|0; //@line 137 "HyMES/mat.c"
    $4 = $126; //@line 137 "HyMES/mat.c"
    while(1) {
     $127 = $4; //@line 137 "HyMES/mat.c"
     $128 = ($127|0)>=(0); //@line 137 "HyMES/mat.c"
     if (!($128)) {
      break L18;
     }
     $129 = $4; //@line 139 "HyMES/mat.c"
     $130 = $2; //@line 139 "HyMES/mat.c"
     $131 = ((($130)) + 8|0); //@line 139 "HyMES/mat.c"
     $132 = HEAP32[$131>>2]|0; //@line 139 "HyMES/mat.c"
     $133 = Math_imul($129, $132)|0; //@line 139 "HyMES/mat.c"
     $134 = $7; //@line 139 "HyMES/mat.c"
     $135 = (($134>>>0) / 32)&-1; //@line 139 "HyMES/mat.c"
     $136 = (($133) + ($135))|0; //@line 139 "HyMES/mat.c"
     $137 = $2; //@line 139 "HyMES/mat.c"
     $138 = ((($137)) + 16|0); //@line 139 "HyMES/mat.c"
     $139 = HEAP32[$138>>2]|0; //@line 139 "HyMES/mat.c"
     $140 = (($139) + ($136<<2)|0); //@line 139 "HyMES/mat.c"
     $141 = HEAP32[$140>>2]|0; //@line 139 "HyMES/mat.c"
     $142 = $7; //@line 139 "HyMES/mat.c"
     $143 = (($142>>>0) % 32)&-1; //@line 139 "HyMES/mat.c"
     $144 = $141 >>> $143; //@line 139 "HyMES/mat.c"
     $145 = $144 & 1; //@line 139 "HyMES/mat.c"
     $146 = ($145|0)!=(0); //@line 139 "HyMES/mat.c"
     if ($146) {
      $147 = $2; //@line 140 "HyMES/mat.c"
      $148 = $4; //@line 140 "HyMES/mat.c"
      $149 = $3; //@line 140 "HyMES/mat.c"
      $150 = (_mat_rowxor($147,$148,$149)|0); //@line 140 "HyMES/mat.c"
      $2 = $150; //@line 140 "HyMES/mat.c"
     }
     $151 = $4; //@line 137 "HyMES/mat.c"
     $152 = (($151) + -1)|0; //@line 137 "HyMES/mat.c"
     $4 = $152; //@line 137 "HyMES/mat.c"
    }
   } else {
    $68 = $2; //@line 120 "HyMES/mat.c"
    $69 = ((($68)) + 4|0); //@line 120 "HyMES/mat.c"
    $70 = HEAP32[$69>>2]|0; //@line 120 "HyMES/mat.c"
    $71 = $2; //@line 120 "HyMES/mat.c"
    $72 = HEAP32[$71>>2]|0; //@line 120 "HyMES/mat.c"
    $73 = (($70) - ($72))|0; //@line 120 "HyMES/mat.c"
    $74 = (($73) - 1)|0; //@line 120 "HyMES/mat.c"
    $75 = $5; //@line 120 "HyMES/mat.c"
    $76 = (($74) - ($75))|0; //@line 120 "HyMES/mat.c"
    $77 = $8; //@line 120 "HyMES/mat.c"
    $78 = (($77) + ($76<<2)|0); //@line 120 "HyMES/mat.c"
    HEAP32[$78>>2] = $67; //@line 120 "HyMES/mat.c"
    $79 = $5; //@line 121 "HyMES/mat.c"
    $80 = (($79) + 1)|0; //@line 121 "HyMES/mat.c"
    $5 = $80; //@line 121 "HyMES/mat.c"
    $81 = $7; //@line 122 "HyMES/mat.c"
    $82 = ($81|0)!=(0); //@line 122 "HyMES/mat.c"
    if (!($82)) {
     label = 15;
     break L5;
    }
    $83 = $3; //@line 126 "HyMES/mat.c"
    $84 = (($83) + -1)|0; //@line 126 "HyMES/mat.c"
    $3 = $84; //@line 126 "HyMES/mat.c"
   }
  } while(0);
  $153 = $3; //@line 102 "HyMES/mat.c"
  $154 = (($153) + 1)|0; //@line 102 "HyMES/mat.c"
  $3 = $154; //@line 102 "HyMES/mat.c"
  $155 = $7; //@line 102 "HyMES/mat.c"
  $156 = (($155) + -1)|0; //@line 102 "HyMES/mat.c"
  $7 = $156; //@line 102 "HyMES/mat.c"
 }
 if ((label|0) == 15) {
  $1 = 0; //@line 124 "HyMES/mat.c"
  $158 = $1; //@line 146 "HyMES/mat.c"
  STACKTOP = sp;return ($158|0); //@line 146 "HyMES/mat.c"
 }
 else if ((label|0) == 28) {
  $157 = $8; //@line 145 "HyMES/mat.c"
  $1 = $157; //@line 145 "HyMES/mat.c"
  $158 = $1; //@line 146 "HyMES/mat.c"
  STACKTOP = sp;return ($158|0); //@line 146 "HyMES/mat.c"
 }
 return (0)|0;
}
function _poly_alloc($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $3 = (_malloc(12)|0); //@line 35 "HyMES/poly.c"
 $2 = $3; //@line 35 "HyMES/poly.c"
 $4 = $2; //@line 36 "HyMES/poly.c"
 HEAP32[$4>>2] = -1; //@line 36 "HyMES/poly.c"
 $5 = $1; //@line 37 "HyMES/poly.c"
 $6 = (($5) + 1)|0; //@line 37 "HyMES/poly.c"
 $7 = $2; //@line 37 "HyMES/poly.c"
 $8 = ((($7)) + 4|0); //@line 37 "HyMES/poly.c"
 HEAP32[$8>>2] = $6; //@line 37 "HyMES/poly.c"
 $9 = $2; //@line 38 "HyMES/poly.c"
 $10 = ((($9)) + 4|0); //@line 38 "HyMES/poly.c"
 $11 = HEAP32[$10>>2]|0; //@line 38 "HyMES/poly.c"
 $12 = (_calloc($11,2)|0); //@line 38 "HyMES/poly.c"
 $13 = $2; //@line 38 "HyMES/poly.c"
 $14 = ((($13)) + 8|0); //@line 38 "HyMES/poly.c"
 HEAP32[$14>>2] = $12; //@line 38 "HyMES/poly.c"
 $15 = $2; //@line 39 "HyMES/poly.c"
 STACKTOP = sp;return ($15|0); //@line 39 "HyMES/poly.c"
}
function _poly_alloc_from_string($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $5 = (_malloc(12)|0); //@line 46 "HyMES/poly.c"
 $4 = $5; //@line 46 "HyMES/poly.c"
 $6 = $4; //@line 47 "HyMES/poly.c"
 HEAP32[$6>>2] = -1; //@line 47 "HyMES/poly.c"
 $7 = $2; //@line 48 "HyMES/poly.c"
 $8 = (($7) + 1)|0; //@line 48 "HyMES/poly.c"
 $9 = $4; //@line 48 "HyMES/poly.c"
 $10 = ((($9)) + 4|0); //@line 48 "HyMES/poly.c"
 HEAP32[$10>>2] = $8; //@line 48 "HyMES/poly.c"
 $11 = $3; //@line 49 "HyMES/poly.c"
 $12 = $4; //@line 49 "HyMES/poly.c"
 $13 = ((($12)) + 8|0); //@line 49 "HyMES/poly.c"
 HEAP32[$13>>2] = $11; //@line 49 "HyMES/poly.c"
 $14 = $4; //@line 50 "HyMES/poly.c"
 STACKTOP = sp;return ($14|0); //@line 50 "HyMES/poly.c"
}
function _poly_copy($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0;
 var $28 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $3 = (_malloc(12)|0); //@line 56 "HyMES/poly.c"
 $2 = $3; //@line 56 "HyMES/poly.c"
 $4 = $1; //@line 57 "HyMES/poly.c"
 $5 = HEAP32[$4>>2]|0; //@line 57 "HyMES/poly.c"
 $6 = $2; //@line 57 "HyMES/poly.c"
 HEAP32[$6>>2] = $5; //@line 57 "HyMES/poly.c"
 $7 = $1; //@line 58 "HyMES/poly.c"
 $8 = ((($7)) + 4|0); //@line 58 "HyMES/poly.c"
 $9 = HEAP32[$8>>2]|0; //@line 58 "HyMES/poly.c"
 $10 = $2; //@line 58 "HyMES/poly.c"
 $11 = ((($10)) + 4|0); //@line 58 "HyMES/poly.c"
 HEAP32[$11>>2] = $9; //@line 58 "HyMES/poly.c"
 $12 = $2; //@line 59 "HyMES/poly.c"
 $13 = ((($12)) + 4|0); //@line 59 "HyMES/poly.c"
 $14 = HEAP32[$13>>2]|0; //@line 59 "HyMES/poly.c"
 $15 = (_calloc($14,2)|0); //@line 59 "HyMES/poly.c"
 $16 = $2; //@line 59 "HyMES/poly.c"
 $17 = ((($16)) + 8|0); //@line 59 "HyMES/poly.c"
 HEAP32[$17>>2] = $15; //@line 59 "HyMES/poly.c"
 $18 = $2; //@line 60 "HyMES/poly.c"
 $19 = ((($18)) + 8|0); //@line 60 "HyMES/poly.c"
 $20 = HEAP32[$19>>2]|0; //@line 60 "HyMES/poly.c"
 $21 = $1; //@line 60 "HyMES/poly.c"
 $22 = ((($21)) + 8|0); //@line 60 "HyMES/poly.c"
 $23 = HEAP32[$22>>2]|0; //@line 60 "HyMES/poly.c"
 $24 = $1; //@line 60 "HyMES/poly.c"
 $25 = ((($24)) + 4|0); //@line 60 "HyMES/poly.c"
 $26 = HEAP32[$25>>2]|0; //@line 60 "HyMES/poly.c"
 $27 = $26<<1; //@line 60 "HyMES/poly.c"
 _memcpy(($20|0),($23|0),($27|0))|0; //@line 60 "HyMES/poly.c"
 $28 = $2; //@line 61 "HyMES/poly.c"
 STACKTOP = sp;return ($28|0); //@line 61 "HyMES/poly.c"
}
function _poly_free($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1; //@line 65 "HyMES/poly.c"
 $3 = ((($2)) + 8|0); //@line 65 "HyMES/poly.c"
 $4 = HEAP32[$3>>2]|0; //@line 65 "HyMES/poly.c"
 _free($4); //@line 65 "HyMES/poly.c"
 $5 = $1; //@line 66 "HyMES/poly.c"
 _free($5); //@line 66 "HyMES/poly.c"
 STACKTOP = sp;return; //@line 67 "HyMES/poly.c"
}
function _poly_set_to_zero($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $2 = $1; //@line 70 "HyMES/poly.c"
 $3 = ((($2)) + 8|0); //@line 70 "HyMES/poly.c"
 $4 = HEAP32[$3>>2]|0; //@line 70 "HyMES/poly.c"
 $5 = $1; //@line 70 "HyMES/poly.c"
 $6 = ((($5)) + 4|0); //@line 70 "HyMES/poly.c"
 $7 = HEAP32[$6>>2]|0; //@line 70 "HyMES/poly.c"
 $8 = $7<<1; //@line 70 "HyMES/poly.c"
 _memset(($4|0),0,($8|0))|0; //@line 70 "HyMES/poly.c"
 $9 = $1; //@line 71 "HyMES/poly.c"
 HEAP32[$9>>2] = -1; //@line 71 "HyMES/poly.c"
 STACKTOP = sp;return; //@line 72 "HyMES/poly.c"
}
function _poly_calcule_deg($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = $0;
 $3 = $1; //@line 75 "HyMES/poly.c"
 $4 = ((($3)) + 4|0); //@line 75 "HyMES/poly.c"
 $5 = HEAP32[$4>>2]|0; //@line 75 "HyMES/poly.c"
 $6 = (($5) - 1)|0; //@line 75 "HyMES/poly.c"
 $2 = $6; //@line 75 "HyMES/poly.c"
 while(1) {
  $7 = $2; //@line 76 "HyMES/poly.c"
  $8 = ($7|0)>=(0); //@line 76 "HyMES/poly.c"
  if ($8) {
   $9 = $2; //@line 76 "HyMES/poly.c"
   $10 = $1; //@line 76 "HyMES/poly.c"
   $11 = ((($10)) + 8|0); //@line 76 "HyMES/poly.c"
   $12 = HEAP32[$11>>2]|0; //@line 76 "HyMES/poly.c"
   $13 = (($12) + ($9<<1)|0); //@line 76 "HyMES/poly.c"
   $14 = HEAP16[$13>>1]|0; //@line 76 "HyMES/poly.c"
   $15 = $14&65535; //@line 76 "HyMES/poly.c"
   $16 = ($15|0)==(0); //@line 76 "HyMES/poly.c"
   $21 = $16;
  } else {
   $21 = 0;
  }
  $17 = $2; //@line 77 "HyMES/poly.c"
  if (!($21)) {
   break;
  }
  $18 = (($17) + -1)|0; //@line 77 "HyMES/poly.c"
  $2 = $18; //@line 77 "HyMES/poly.c"
 }
 $19 = $1; //@line 78 "HyMES/poly.c"
 HEAP32[$19>>2] = $17; //@line 78 "HyMES/poly.c"
 $20 = $2; //@line 79 "HyMES/poly.c"
 STACKTOP = sp;return ($20|0); //@line 79 "HyMES/poly.c"
}
function _poly_set($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $5 = $2; //@line 84 "HyMES/poly.c"
 $6 = ((($5)) + 4|0); //@line 84 "HyMES/poly.c"
 $7 = HEAP32[$6>>2]|0; //@line 84 "HyMES/poly.c"
 $8 = $3; //@line 84 "HyMES/poly.c"
 $9 = ((($8)) + 4|0); //@line 84 "HyMES/poly.c"
 $10 = HEAP32[$9>>2]|0; //@line 84 "HyMES/poly.c"
 $11 = (($7) - ($10))|0; //@line 84 "HyMES/poly.c"
 $4 = $11; //@line 84 "HyMES/poly.c"
 $12 = $4; //@line 85 "HyMES/poly.c"
 $13 = ($12|0)<(0); //@line 85 "HyMES/poly.c"
 $14 = $2; //@line 86 "HyMES/poly.c"
 $15 = ((($14)) + 8|0); //@line 86 "HyMES/poly.c"
 $16 = HEAP32[$15>>2]|0; //@line 86 "HyMES/poly.c"
 $17 = $3; //@line 86 "HyMES/poly.c"
 $18 = ((($17)) + 8|0); //@line 86 "HyMES/poly.c"
 $19 = HEAP32[$18>>2]|0; //@line 86 "HyMES/poly.c"
 if ($13) {
  $20 = $2; //@line 86 "HyMES/poly.c"
  $21 = ((($20)) + 4|0); //@line 86 "HyMES/poly.c"
  $22 = HEAP32[$21>>2]|0; //@line 86 "HyMES/poly.c"
  $23 = $22<<1; //@line 86 "HyMES/poly.c"
  _memcpy(($16|0),($19|0),($23|0))|0; //@line 86 "HyMES/poly.c"
  $24 = $2; //@line 87 "HyMES/poly.c"
  (_poly_calcule_deg($24)|0); //@line 87 "HyMES/poly.c"
  STACKTOP = sp;return; //@line 94 "HyMES/poly.c"
 } else {
  $25 = $3; //@line 90 "HyMES/poly.c"
  $26 = ((($25)) + 4|0); //@line 90 "HyMES/poly.c"
  $27 = HEAP32[$26>>2]|0; //@line 90 "HyMES/poly.c"
  $28 = $27<<1; //@line 90 "HyMES/poly.c"
  _memcpy(($16|0),($19|0),($28|0))|0; //@line 90 "HyMES/poly.c"
  $29 = $2; //@line 91 "HyMES/poly.c"
  $30 = ((($29)) + 8|0); //@line 91 "HyMES/poly.c"
  $31 = HEAP32[$30>>2]|0; //@line 91 "HyMES/poly.c"
  $32 = $3; //@line 91 "HyMES/poly.c"
  $33 = ((($32)) + 4|0); //@line 91 "HyMES/poly.c"
  $34 = HEAP32[$33>>2]|0; //@line 91 "HyMES/poly.c"
  $35 = (($31) + ($34<<1)|0); //@line 91 "HyMES/poly.c"
  $36 = $4; //@line 91 "HyMES/poly.c"
  $37 = $36<<1; //@line 91 "HyMES/poly.c"
  _memset(($35|0),0,($37|0))|0; //@line 91 "HyMES/poly.c"
  $38 = $3; //@line 92 "HyMES/poly.c"
  $39 = HEAP32[$38>>2]|0; //@line 92 "HyMES/poly.c"
  $40 = $2; //@line 92 "HyMES/poly.c"
  HEAP32[$40>>2] = $39; //@line 92 "HyMES/poly.c"
  STACKTOP = sp;return; //@line 94 "HyMES/poly.c"
 }
}
function _poly_eval_aux($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0;
 var $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0;
 var $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $7 = $5; //@line 99 "HyMES/poly.c"
 $8 = (($7) + -1)|0; //@line 99 "HyMES/poly.c"
 $5 = $8; //@line 99 "HyMES/poly.c"
 $9 = $3; //@line 99 "HyMES/poly.c"
 $10 = (($9) + ($7<<1)|0); //@line 99 "HyMES/poly.c"
 $11 = HEAP16[$10>>1]|0; //@line 99 "HyMES/poly.c"
 $6 = $11; //@line 99 "HyMES/poly.c"
 while(1) {
  $12 = $5; //@line 100 "HyMES/poly.c"
  $13 = ($12|0)>=(0); //@line 100 "HyMES/poly.c"
  $14 = $6; //@line 101 "HyMES/poly.c"
  if (!($13)) {
   break;
  }
  $15 = $14&65535; //@line 101 "HyMES/poly.c"
  $16 = ($15|0)!=(0); //@line 101 "HyMES/poly.c"
  if ($16) {
   $17 = $6; //@line 102 "HyMES/poly.c"
   $18 = $17&65535; //@line 102 "HyMES/poly.c"
   $19 = ($18|0)!=(0); //@line 102 "HyMES/poly.c"
   if ($19) {
    $20 = $4; //@line 102 "HyMES/poly.c"
    $21 = $20&65535; //@line 102 "HyMES/poly.c"
    $22 = ($21|0)!=(0); //@line 102 "HyMES/poly.c"
    if ($22) {
     $23 = $6; //@line 102 "HyMES/poly.c"
     $24 = $23&65535; //@line 102 "HyMES/poly.c"
     $25 = HEAP32[2860]|0; //@line 102 "HyMES/poly.c"
     $26 = (($25) + ($24<<1)|0); //@line 102 "HyMES/poly.c"
     $27 = HEAP16[$26>>1]|0; //@line 102 "HyMES/poly.c"
     $28 = $27&65535; //@line 102 "HyMES/poly.c"
     $29 = $4; //@line 102 "HyMES/poly.c"
     $30 = $29&65535; //@line 102 "HyMES/poly.c"
     $31 = HEAP32[2860]|0; //@line 102 "HyMES/poly.c"
     $32 = (($31) + ($30<<1)|0); //@line 102 "HyMES/poly.c"
     $33 = HEAP16[$32>>1]|0; //@line 102 "HyMES/poly.c"
     $34 = $33&65535; //@line 102 "HyMES/poly.c"
     $35 = (($28) + ($34))|0; //@line 102 "HyMES/poly.c"
     $36 = HEAP32[2861]|0; //@line 102 "HyMES/poly.c"
     $37 = $35 & $36; //@line 102 "HyMES/poly.c"
     $38 = $6; //@line 102 "HyMES/poly.c"
     $39 = $38&65535; //@line 102 "HyMES/poly.c"
     $40 = HEAP32[2860]|0; //@line 102 "HyMES/poly.c"
     $41 = (($40) + ($39<<1)|0); //@line 102 "HyMES/poly.c"
     $42 = HEAP16[$41>>1]|0; //@line 102 "HyMES/poly.c"
     $43 = $42&65535; //@line 102 "HyMES/poly.c"
     $44 = $4; //@line 102 "HyMES/poly.c"
     $45 = $44&65535; //@line 102 "HyMES/poly.c"
     $46 = HEAP32[2860]|0; //@line 102 "HyMES/poly.c"
     $47 = (($46) + ($45<<1)|0); //@line 102 "HyMES/poly.c"
     $48 = HEAP16[$47>>1]|0; //@line 102 "HyMES/poly.c"
     $49 = $48&65535; //@line 102 "HyMES/poly.c"
     $50 = (($43) + ($49))|0; //@line 102 "HyMES/poly.c"
     $51 = HEAP32[2862]|0; //@line 102 "HyMES/poly.c"
     $52 = $50 >> $51; //@line 102 "HyMES/poly.c"
     $53 = (($37) + ($52))|0; //@line 102 "HyMES/poly.c"
     $54 = HEAP32[2863]|0; //@line 102 "HyMES/poly.c"
     $55 = (($54) + ($53<<1)|0); //@line 102 "HyMES/poly.c"
     $56 = HEAP16[$55>>1]|0; //@line 102 "HyMES/poly.c"
     $57 = $56&65535; //@line 102 "HyMES/poly.c"
     $64 = $57;
    } else {
     $64 = 0;
    }
   } else {
    $64 = 0;
   }
   $58 = $5; //@line 102 "HyMES/poly.c"
   $59 = $3; //@line 102 "HyMES/poly.c"
   $60 = (($59) + ($58<<1)|0); //@line 102 "HyMES/poly.c"
   $61 = HEAP16[$60>>1]|0; //@line 102 "HyMES/poly.c"
   $62 = $61&65535; //@line 102 "HyMES/poly.c"
   $63 = $64 ^ $62; //@line 102 "HyMES/poly.c"
   $65 = $63&65535; //@line 102 "HyMES/poly.c"
   $6 = $65; //@line 102 "HyMES/poly.c"
  } else {
   $66 = $5; //@line 104 "HyMES/poly.c"
   $67 = $3; //@line 104 "HyMES/poly.c"
   $68 = (($67) + ($66<<1)|0); //@line 104 "HyMES/poly.c"
   $69 = HEAP16[$68>>1]|0; //@line 104 "HyMES/poly.c"
   $6 = $69; //@line 104 "HyMES/poly.c"
  }
  $70 = $5; //@line 100 "HyMES/poly.c"
  $71 = (($70) + -1)|0; //@line 100 "HyMES/poly.c"
  $5 = $71; //@line 100 "HyMES/poly.c"
 }
 STACKTOP = sp;return ($14|0); //@line 105 "HyMES/poly.c"
}
function _poly_eval($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $2; //@line 126 "HyMES/poly.c"
 $5 = ((($4)) + 8|0); //@line 126 "HyMES/poly.c"
 $6 = HEAP32[$5>>2]|0; //@line 126 "HyMES/poly.c"
 $7 = $3; //@line 126 "HyMES/poly.c"
 $8 = $2; //@line 126 "HyMES/poly.c"
 $9 = HEAP32[$8>>2]|0; //@line 126 "HyMES/poly.c"
 $10 = (_poly_eval_aux($6,$7,$9)|0); //@line 126 "HyMES/poly.c"
 STACKTOP = sp;return ($10|0); //@line 126 "HyMES/poly.c"
}
function _poly_rem($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0;
 var $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0;
 var $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0;
 var $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0;
 var $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $21 = 0;
 var $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0;
 var $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0;
 var $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0;
 var $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0;
 var $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $2 = $0;
 $3 = $1;
 $9 = $2; //@line 134 "HyMES/poly.c"
 $10 = HEAP32[$9>>2]|0; //@line 134 "HyMES/poly.c"
 $11 = $3; //@line 134 "HyMES/poly.c"
 $12 = HEAP32[$11>>2]|0; //@line 134 "HyMES/poly.c"
 $13 = (($10) - ($12))|0; //@line 134 "HyMES/poly.c"
 $6 = $13; //@line 134 "HyMES/poly.c"
 $14 = $6; //@line 135 "HyMES/poly.c"
 $15 = ($14|0)>=(0); //@line 135 "HyMES/poly.c"
 if (!($15)) {
  STACKTOP = sp;return; //@line 149 "HyMES/poly.c"
 }
 $16 = HEAP32[2861]|0; //@line 136 "HyMES/poly.c"
 $17 = $3; //@line 136 "HyMES/poly.c"
 $18 = HEAP32[$17>>2]|0; //@line 136 "HyMES/poly.c"
 $19 = $3; //@line 136 "HyMES/poly.c"
 $20 = ((($19)) + 8|0); //@line 136 "HyMES/poly.c"
 $21 = HEAP32[$20>>2]|0; //@line 136 "HyMES/poly.c"
 $22 = (($21) + ($18<<1)|0); //@line 136 "HyMES/poly.c"
 $23 = HEAP16[$22>>1]|0; //@line 136 "HyMES/poly.c"
 $24 = $23&65535; //@line 136 "HyMES/poly.c"
 $25 = HEAP32[2860]|0; //@line 136 "HyMES/poly.c"
 $26 = (($25) + ($24<<1)|0); //@line 136 "HyMES/poly.c"
 $27 = HEAP16[$26>>1]|0; //@line 136 "HyMES/poly.c"
 $28 = $27&65535; //@line 136 "HyMES/poly.c"
 $29 = (($16) - ($28))|0; //@line 136 "HyMES/poly.c"
 $30 = HEAP32[2863]|0; //@line 136 "HyMES/poly.c"
 $31 = (($30) + ($29<<1)|0); //@line 136 "HyMES/poly.c"
 $32 = HEAP16[$31>>1]|0; //@line 136 "HyMES/poly.c"
 $7 = $32; //@line 136 "HyMES/poly.c"
 $33 = $2; //@line 137 "HyMES/poly.c"
 $34 = HEAP32[$33>>2]|0; //@line 137 "HyMES/poly.c"
 $4 = $34; //@line 137 "HyMES/poly.c"
 while(1) {
  $35 = $6; //@line 137 "HyMES/poly.c"
  $36 = ($35|0)>=(0); //@line 137 "HyMES/poly.c"
  if (!($36)) {
   break;
  }
  $37 = $4; //@line 138 "HyMES/poly.c"
  $38 = $2; //@line 138 "HyMES/poly.c"
  $39 = ((($38)) + 8|0); //@line 138 "HyMES/poly.c"
  $40 = HEAP32[$39>>2]|0; //@line 138 "HyMES/poly.c"
  $41 = (($40) + ($37<<1)|0); //@line 138 "HyMES/poly.c"
  $42 = HEAP16[$41>>1]|0; //@line 138 "HyMES/poly.c"
  $43 = $42&65535; //@line 138 "HyMES/poly.c"
  $44 = ($43|0)!=(0); //@line 138 "HyMES/poly.c"
  if ($44) {
   $45 = $4; //@line 139 "HyMES/poly.c"
   $46 = $2; //@line 139 "HyMES/poly.c"
   $47 = ((($46)) + 8|0); //@line 139 "HyMES/poly.c"
   $48 = HEAP32[$47>>2]|0; //@line 139 "HyMES/poly.c"
   $49 = (($48) + ($45<<1)|0); //@line 139 "HyMES/poly.c"
   $50 = HEAP16[$49>>1]|0; //@line 139 "HyMES/poly.c"
   $51 = $50&65535; //@line 139 "HyMES/poly.c"
   $52 = ($51|0)!=(0); //@line 139 "HyMES/poly.c"
   if ($52) {
    $53 = $7; //@line 139 "HyMES/poly.c"
    $54 = $53&65535; //@line 139 "HyMES/poly.c"
    $55 = HEAP32[2860]|0; //@line 139 "HyMES/poly.c"
    $56 = (($55) + ($54<<1)|0); //@line 139 "HyMES/poly.c"
    $57 = HEAP16[$56>>1]|0; //@line 139 "HyMES/poly.c"
    $58 = $57&65535; //@line 139 "HyMES/poly.c"
    $59 = $4; //@line 139 "HyMES/poly.c"
    $60 = $2; //@line 139 "HyMES/poly.c"
    $61 = ((($60)) + 8|0); //@line 139 "HyMES/poly.c"
    $62 = HEAP32[$61>>2]|0; //@line 139 "HyMES/poly.c"
    $63 = (($62) + ($59<<1)|0); //@line 139 "HyMES/poly.c"
    $64 = HEAP16[$63>>1]|0; //@line 139 "HyMES/poly.c"
    $65 = $64&65535; //@line 139 "HyMES/poly.c"
    $66 = HEAP32[2860]|0; //@line 139 "HyMES/poly.c"
    $67 = (($66) + ($65<<1)|0); //@line 139 "HyMES/poly.c"
    $68 = HEAP16[$67>>1]|0; //@line 139 "HyMES/poly.c"
    $69 = $68&65535; //@line 139 "HyMES/poly.c"
    $70 = (($58) + ($69))|0; //@line 139 "HyMES/poly.c"
    $71 = HEAP32[2861]|0; //@line 139 "HyMES/poly.c"
    $72 = $70 & $71; //@line 139 "HyMES/poly.c"
    $73 = $7; //@line 139 "HyMES/poly.c"
    $74 = $73&65535; //@line 139 "HyMES/poly.c"
    $75 = HEAP32[2860]|0; //@line 139 "HyMES/poly.c"
    $76 = (($75) + ($74<<1)|0); //@line 139 "HyMES/poly.c"
    $77 = HEAP16[$76>>1]|0; //@line 139 "HyMES/poly.c"
    $78 = $77&65535; //@line 139 "HyMES/poly.c"
    $79 = $4; //@line 139 "HyMES/poly.c"
    $80 = $2; //@line 139 "HyMES/poly.c"
    $81 = ((($80)) + 8|0); //@line 139 "HyMES/poly.c"
    $82 = HEAP32[$81>>2]|0; //@line 139 "HyMES/poly.c"
    $83 = (($82) + ($79<<1)|0); //@line 139 "HyMES/poly.c"
    $84 = HEAP16[$83>>1]|0; //@line 139 "HyMES/poly.c"
    $85 = $84&65535; //@line 139 "HyMES/poly.c"
    $86 = HEAP32[2860]|0; //@line 139 "HyMES/poly.c"
    $87 = (($86) + ($85<<1)|0); //@line 139 "HyMES/poly.c"
    $88 = HEAP16[$87>>1]|0; //@line 139 "HyMES/poly.c"
    $89 = $88&65535; //@line 139 "HyMES/poly.c"
    $90 = (($78) + ($89))|0; //@line 139 "HyMES/poly.c"
    $91 = HEAP32[2862]|0; //@line 139 "HyMES/poly.c"
    $92 = $90 >> $91; //@line 139 "HyMES/poly.c"
    $93 = (($72) + ($92))|0; //@line 139 "HyMES/poly.c"
    $94 = HEAP32[2863]|0; //@line 139 "HyMES/poly.c"
    $95 = (($94) + ($93<<1)|0); //@line 139 "HyMES/poly.c"
    $96 = HEAP16[$95>>1]|0; //@line 139 "HyMES/poly.c"
    $97 = $96&65535; //@line 139 "HyMES/poly.c"
    $99 = $97;
   } else {
    $99 = 0;
   }
   $98 = $99&65535; //@line 139 "HyMES/poly.c"
   $8 = $98; //@line 139 "HyMES/poly.c"
   $5 = 0; //@line 140 "HyMES/poly.c"
   while(1) {
    $100 = $5; //@line 140 "HyMES/poly.c"
    $101 = $3; //@line 140 "HyMES/poly.c"
    $102 = HEAP32[$101>>2]|0; //@line 140 "HyMES/poly.c"
    $103 = ($100|0)<($102|0); //@line 140 "HyMES/poly.c"
    if (!($103)) {
     break;
    }
    $104 = $5; //@line 141 "HyMES/poly.c"
    $105 = $6; //@line 141 "HyMES/poly.c"
    $106 = (($104) + ($105))|0; //@line 141 "HyMES/poly.c"
    $107 = $2; //@line 141 "HyMES/poly.c"
    $108 = ((($107)) + 8|0); //@line 141 "HyMES/poly.c"
    $109 = HEAP32[$108>>2]|0; //@line 141 "HyMES/poly.c"
    $110 = (($109) + ($106<<1)|0); //@line 141 "HyMES/poly.c"
    $111 = HEAP16[$110>>1]|0; //@line 141 "HyMES/poly.c"
    $112 = $111&65535; //@line 141 "HyMES/poly.c"
    $113 = $5; //@line 141 "HyMES/poly.c"
    $114 = $3; //@line 141 "HyMES/poly.c"
    $115 = ((($114)) + 8|0); //@line 141 "HyMES/poly.c"
    $116 = HEAP32[$115>>2]|0; //@line 141 "HyMES/poly.c"
    $117 = (($116) + ($113<<1)|0); //@line 141 "HyMES/poly.c"
    $118 = HEAP16[$117>>1]|0; //@line 141 "HyMES/poly.c"
    $119 = $118&65535; //@line 141 "HyMES/poly.c"
    $120 = ($119|0)!=(0); //@line 141 "HyMES/poly.c"
    if ($120) {
     $121 = $8; //@line 141 "HyMES/poly.c"
     $122 = $121&65535; //@line 141 "HyMES/poly.c"
     $123 = HEAP32[2860]|0; //@line 141 "HyMES/poly.c"
     $124 = (($123) + ($122<<1)|0); //@line 141 "HyMES/poly.c"
     $125 = HEAP16[$124>>1]|0; //@line 141 "HyMES/poly.c"
     $126 = $125&65535; //@line 141 "HyMES/poly.c"
     $127 = $5; //@line 141 "HyMES/poly.c"
     $128 = $3; //@line 141 "HyMES/poly.c"
     $129 = ((($128)) + 8|0); //@line 141 "HyMES/poly.c"
     $130 = HEAP32[$129>>2]|0; //@line 141 "HyMES/poly.c"
     $131 = (($130) + ($127<<1)|0); //@line 141 "HyMES/poly.c"
     $132 = HEAP16[$131>>1]|0; //@line 141 "HyMES/poly.c"
     $133 = $132&65535; //@line 141 "HyMES/poly.c"
     $134 = HEAP32[2860]|0; //@line 141 "HyMES/poly.c"
     $135 = (($134) + ($133<<1)|0); //@line 141 "HyMES/poly.c"
     $136 = HEAP16[$135>>1]|0; //@line 141 "HyMES/poly.c"
     $137 = $136&65535; //@line 141 "HyMES/poly.c"
     $138 = (($126) + ($137))|0; //@line 141 "HyMES/poly.c"
     $139 = HEAP32[2861]|0; //@line 141 "HyMES/poly.c"
     $140 = $138 & $139; //@line 141 "HyMES/poly.c"
     $141 = $8; //@line 141 "HyMES/poly.c"
     $142 = $141&65535; //@line 141 "HyMES/poly.c"
     $143 = HEAP32[2860]|0; //@line 141 "HyMES/poly.c"
     $144 = (($143) + ($142<<1)|0); //@line 141 "HyMES/poly.c"
     $145 = HEAP16[$144>>1]|0; //@line 141 "HyMES/poly.c"
     $146 = $145&65535; //@line 141 "HyMES/poly.c"
     $147 = $5; //@line 141 "HyMES/poly.c"
     $148 = $3; //@line 141 "HyMES/poly.c"
     $149 = ((($148)) + 8|0); //@line 141 "HyMES/poly.c"
     $150 = HEAP32[$149>>2]|0; //@line 141 "HyMES/poly.c"
     $151 = (($150) + ($147<<1)|0); //@line 141 "HyMES/poly.c"
     $152 = HEAP16[$151>>1]|0; //@line 141 "HyMES/poly.c"
     $153 = $152&65535; //@line 141 "HyMES/poly.c"
     $154 = HEAP32[2860]|0; //@line 141 "HyMES/poly.c"
     $155 = (($154) + ($153<<1)|0); //@line 141 "HyMES/poly.c"
     $156 = HEAP16[$155>>1]|0; //@line 141 "HyMES/poly.c"
     $157 = $156&65535; //@line 141 "HyMES/poly.c"
     $158 = (($146) + ($157))|0; //@line 141 "HyMES/poly.c"
     $159 = HEAP32[2862]|0; //@line 141 "HyMES/poly.c"
     $160 = $158 >> $159; //@line 141 "HyMES/poly.c"
     $161 = (($140) + ($160))|0; //@line 141 "HyMES/poly.c"
     $162 = HEAP32[2863]|0; //@line 141 "HyMES/poly.c"
     $163 = (($162) + ($161<<1)|0); //@line 141 "HyMES/poly.c"
     $164 = HEAP16[$163>>1]|0; //@line 141 "HyMES/poly.c"
     $165 = $164&65535; //@line 141 "HyMES/poly.c"
     $167 = $165;
    } else {
     $167 = 0;
    }
    $166 = $112 ^ $167; //@line 141 "HyMES/poly.c"
    $168 = $166&65535; //@line 141 "HyMES/poly.c"
    $169 = $5; //@line 141 "HyMES/poly.c"
    $170 = $6; //@line 141 "HyMES/poly.c"
    $171 = (($169) + ($170))|0; //@line 141 "HyMES/poly.c"
    $172 = $2; //@line 141 "HyMES/poly.c"
    $173 = ((($172)) + 8|0); //@line 141 "HyMES/poly.c"
    $174 = HEAP32[$173>>2]|0; //@line 141 "HyMES/poly.c"
    $175 = (($174) + ($171<<1)|0); //@line 141 "HyMES/poly.c"
    HEAP16[$175>>1] = $168; //@line 141 "HyMES/poly.c"
    $176 = $5; //@line 140 "HyMES/poly.c"
    $177 = (($176) + 1)|0; //@line 140 "HyMES/poly.c"
    $5 = $177; //@line 140 "HyMES/poly.c"
   }
   $178 = $4; //@line 142 "HyMES/poly.c"
   $179 = $2; //@line 142 "HyMES/poly.c"
   $180 = ((($179)) + 8|0); //@line 142 "HyMES/poly.c"
   $181 = HEAP32[$180>>2]|0; //@line 142 "HyMES/poly.c"
   $182 = (($181) + ($178<<1)|0); //@line 142 "HyMES/poly.c"
   HEAP16[$182>>1] = 0; //@line 142 "HyMES/poly.c"
  }
  $183 = $4; //@line 137 "HyMES/poly.c"
  $184 = (($183) + -1)|0; //@line 137 "HyMES/poly.c"
  $4 = $184; //@line 137 "HyMES/poly.c"
  $185 = $6; //@line 137 "HyMES/poly.c"
  $186 = (($185) + -1)|0; //@line 137 "HyMES/poly.c"
  $6 = $186; //@line 137 "HyMES/poly.c"
 }
 $187 = $3; //@line 145 "HyMES/poly.c"
 $188 = HEAP32[$187>>2]|0; //@line 145 "HyMES/poly.c"
 $189 = (($188) - 1)|0; //@line 145 "HyMES/poly.c"
 $190 = $2; //@line 145 "HyMES/poly.c"
 HEAP32[$190>>2] = $189; //@line 145 "HyMES/poly.c"
 while(1) {
  $191 = $2; //@line 146 "HyMES/poly.c"
  $192 = HEAP32[$191>>2]|0; //@line 146 "HyMES/poly.c"
  $193 = ($192|0)>=(0); //@line 146 "HyMES/poly.c"
  if (!($193)) {
   label = 18;
   break;
  }
  $194 = $2; //@line 146 "HyMES/poly.c"
  $195 = HEAP32[$194>>2]|0; //@line 146 "HyMES/poly.c"
  $196 = $2; //@line 146 "HyMES/poly.c"
  $197 = ((($196)) + 8|0); //@line 146 "HyMES/poly.c"
  $198 = HEAP32[$197>>2]|0; //@line 146 "HyMES/poly.c"
  $199 = (($198) + ($195<<1)|0); //@line 146 "HyMES/poly.c"
  $200 = HEAP16[$199>>1]|0; //@line 146 "HyMES/poly.c"
  $201 = $200&65535; //@line 146 "HyMES/poly.c"
  $202 = ($201|0)==(0); //@line 146 "HyMES/poly.c"
  if (!($202)) {
   label = 18;
   break;
  }
  $203 = $2; //@line 147 "HyMES/poly.c"
  $204 = HEAP32[$203>>2]|0; //@line 147 "HyMES/poly.c"
  $205 = (($204) - 1)|0; //@line 147 "HyMES/poly.c"
  $206 = $2; //@line 147 "HyMES/poly.c"
  HEAP32[$206>>2] = $205; //@line 147 "HyMES/poly.c"
 }
 if ((label|0) == 18) {
  STACKTOP = sp;return; //@line 149 "HyMES/poly.c"
 }
}
function _poly_sqmod_init($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0;
 var $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0;
 var $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $6 = $2; //@line 154 "HyMES/poly.c"
 $7 = HEAP32[$6>>2]|0; //@line 154 "HyMES/poly.c"
 $5 = $7; //@line 154 "HyMES/poly.c"
 $4 = 0; //@line 156 "HyMES/poly.c"
 while(1) {
  $8 = $4; //@line 156 "HyMES/poly.c"
  $9 = $5; //@line 156 "HyMES/poly.c"
  $10 = (($9|0) / 2)&-1; //@line 156 "HyMES/poly.c"
  $11 = ($8|0)<($10|0); //@line 156 "HyMES/poly.c"
  if (!($11)) {
   break;
  }
  $12 = $4; //@line 158 "HyMES/poly.c"
  $13 = $3; //@line 158 "HyMES/poly.c"
  $14 = (($13) + ($12<<2)|0); //@line 158 "HyMES/poly.c"
  $15 = HEAP32[$14>>2]|0; //@line 158 "HyMES/poly.c"
  _poly_set_to_zero($15); //@line 158 "HyMES/poly.c"
  $16 = $4; //@line 159 "HyMES/poly.c"
  $17 = $16<<1; //@line 159 "HyMES/poly.c"
  $18 = $4; //@line 159 "HyMES/poly.c"
  $19 = $3; //@line 159 "HyMES/poly.c"
  $20 = (($19) + ($18<<2)|0); //@line 159 "HyMES/poly.c"
  $21 = HEAP32[$20>>2]|0; //@line 159 "HyMES/poly.c"
  HEAP32[$21>>2] = $17; //@line 159 "HyMES/poly.c"
  $22 = $4; //@line 160 "HyMES/poly.c"
  $23 = $22<<1; //@line 160 "HyMES/poly.c"
  $24 = $4; //@line 160 "HyMES/poly.c"
  $25 = $3; //@line 160 "HyMES/poly.c"
  $26 = (($25) + ($24<<2)|0); //@line 160 "HyMES/poly.c"
  $27 = HEAP32[$26>>2]|0; //@line 160 "HyMES/poly.c"
  $28 = ((($27)) + 8|0); //@line 160 "HyMES/poly.c"
  $29 = HEAP32[$28>>2]|0; //@line 160 "HyMES/poly.c"
  $30 = (($29) + ($23<<1)|0); //@line 160 "HyMES/poly.c"
  HEAP16[$30>>1] = 1; //@line 160 "HyMES/poly.c"
  $31 = $4; //@line 156 "HyMES/poly.c"
  $32 = (($31) + 1)|0; //@line 156 "HyMES/poly.c"
  $4 = $32; //@line 156 "HyMES/poly.c"
 }
 while(1) {
  $33 = $4; //@line 163 "HyMES/poly.c"
  $34 = $5; //@line 163 "HyMES/poly.c"
  $35 = ($33|0)<($34|0); //@line 163 "HyMES/poly.c"
  if (!($35)) {
   break;
  }
  $36 = $4; //@line 165 "HyMES/poly.c"
  $37 = $3; //@line 165 "HyMES/poly.c"
  $38 = (($37) + ($36<<2)|0); //@line 165 "HyMES/poly.c"
  $39 = HEAP32[$38>>2]|0; //@line 165 "HyMES/poly.c"
  $40 = ((($39)) + 8|0); //@line 165 "HyMES/poly.c"
  $41 = HEAP32[$40>>2]|0; //@line 165 "HyMES/poly.c"
  ;HEAP16[$41>>1]=0|0;HEAP16[$41+2>>1]=0|0; //@line 165 "HyMES/poly.c"
  $42 = $4; //@line 166 "HyMES/poly.c"
  $43 = $3; //@line 166 "HyMES/poly.c"
  $44 = (($43) + ($42<<2)|0); //@line 166 "HyMES/poly.c"
  $45 = HEAP32[$44>>2]|0; //@line 166 "HyMES/poly.c"
  $46 = ((($45)) + 8|0); //@line 166 "HyMES/poly.c"
  $47 = HEAP32[$46>>2]|0; //@line 166 "HyMES/poly.c"
  $48 = ((($47)) + 4|0); //@line 166 "HyMES/poly.c"
  $49 = $4; //@line 166 "HyMES/poly.c"
  $50 = (($49) - 1)|0; //@line 166 "HyMES/poly.c"
  $51 = $3; //@line 166 "HyMES/poly.c"
  $52 = (($51) + ($50<<2)|0); //@line 166 "HyMES/poly.c"
  $53 = HEAP32[$52>>2]|0; //@line 166 "HyMES/poly.c"
  $54 = ((($53)) + 8|0); //@line 166 "HyMES/poly.c"
  $55 = HEAP32[$54>>2]|0; //@line 166 "HyMES/poly.c"
  $56 = $5; //@line 166 "HyMES/poly.c"
  $57 = $56<<1; //@line 166 "HyMES/poly.c"
  _memcpy(($48|0),($55|0),($57|0))|0; //@line 166 "HyMES/poly.c"
  $58 = $4; //@line 167 "HyMES/poly.c"
  $59 = (($58) - 1)|0; //@line 167 "HyMES/poly.c"
  $60 = $3; //@line 167 "HyMES/poly.c"
  $61 = (($60) + ($59<<2)|0); //@line 167 "HyMES/poly.c"
  $62 = HEAP32[$61>>2]|0; //@line 167 "HyMES/poly.c"
  $63 = HEAP32[$62>>2]|0; //@line 167 "HyMES/poly.c"
  $64 = (($63) + 2)|0; //@line 167 "HyMES/poly.c"
  $65 = $4; //@line 167 "HyMES/poly.c"
  $66 = $3; //@line 167 "HyMES/poly.c"
  $67 = (($66) + ($65<<2)|0); //@line 167 "HyMES/poly.c"
  $68 = HEAP32[$67>>2]|0; //@line 167 "HyMES/poly.c"
  HEAP32[$68>>2] = $64; //@line 167 "HyMES/poly.c"
  $69 = $4; //@line 168 "HyMES/poly.c"
  $70 = $3; //@line 168 "HyMES/poly.c"
  $71 = (($70) + ($69<<2)|0); //@line 168 "HyMES/poly.c"
  $72 = HEAP32[$71>>2]|0; //@line 168 "HyMES/poly.c"
  $73 = $2; //@line 168 "HyMES/poly.c"
  _poly_rem($72,$73); //@line 168 "HyMES/poly.c"
  $74 = $4; //@line 163 "HyMES/poly.c"
  $75 = (($74) + 1)|0; //@line 163 "HyMES/poly.c"
  $4 = $75; //@line 163 "HyMES/poly.c"
 }
 STACKTOP = sp;return; //@line 170 "HyMES/poly.c"
}
function _poly_sqmod($0,$1,$2,$3) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0;
 var $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0;
 var $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0;
 var $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0;
 var $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0;
 var $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0;
 var $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $4 = $0;
 $5 = $1;
 $6 = $2;
 $7 = $3;
 $11 = $4; //@line 180 "HyMES/poly.c"
 _poly_set_to_zero($11); //@line 180 "HyMES/poly.c"
 $8 = 0; //@line 183 "HyMES/poly.c"
 while(1) {
  $12 = $8; //@line 183 "HyMES/poly.c"
  $13 = $7; //@line 183 "HyMES/poly.c"
  $14 = (($13|0) / 2)&-1; //@line 183 "HyMES/poly.c"
  $15 = ($12|0)<($14|0); //@line 183 "HyMES/poly.c"
  if (!($15)) {
   break;
  }
  $16 = $8; //@line 184 "HyMES/poly.c"
  $17 = $5; //@line 184 "HyMES/poly.c"
  $18 = ((($17)) + 8|0); //@line 184 "HyMES/poly.c"
  $19 = HEAP32[$18>>2]|0; //@line 184 "HyMES/poly.c"
  $20 = (($19) + ($16<<1)|0); //@line 184 "HyMES/poly.c"
  $21 = HEAP16[$20>>1]|0; //@line 184 "HyMES/poly.c"
  $22 = $21&65535; //@line 184 "HyMES/poly.c"
  $23 = ($22|0)!=(0); //@line 184 "HyMES/poly.c"
  if ($23) {
   $24 = $8; //@line 184 "HyMES/poly.c"
   $25 = $5; //@line 184 "HyMES/poly.c"
   $26 = ((($25)) + 8|0); //@line 184 "HyMES/poly.c"
   $27 = HEAP32[$26>>2]|0; //@line 184 "HyMES/poly.c"
   $28 = (($27) + ($24<<1)|0); //@line 184 "HyMES/poly.c"
   $29 = HEAP16[$28>>1]|0; //@line 184 "HyMES/poly.c"
   $30 = $29&65535; //@line 184 "HyMES/poly.c"
   $31 = HEAP32[2860]|0; //@line 184 "HyMES/poly.c"
   $32 = (($31) + ($30<<1)|0); //@line 184 "HyMES/poly.c"
   $33 = HEAP16[$32>>1]|0; //@line 184 "HyMES/poly.c"
   $34 = $33&65535; //@line 184 "HyMES/poly.c"
   $35 = $34 << 1; //@line 184 "HyMES/poly.c"
   $36 = HEAP32[2861]|0; //@line 184 "HyMES/poly.c"
   $37 = $35 & $36; //@line 184 "HyMES/poly.c"
   $38 = $8; //@line 184 "HyMES/poly.c"
   $39 = $5; //@line 184 "HyMES/poly.c"
   $40 = ((($39)) + 8|0); //@line 184 "HyMES/poly.c"
   $41 = HEAP32[$40>>2]|0; //@line 184 "HyMES/poly.c"
   $42 = (($41) + ($38<<1)|0); //@line 184 "HyMES/poly.c"
   $43 = HEAP16[$42>>1]|0; //@line 184 "HyMES/poly.c"
   $44 = $43&65535; //@line 184 "HyMES/poly.c"
   $45 = HEAP32[2860]|0; //@line 184 "HyMES/poly.c"
   $46 = (($45) + ($44<<1)|0); //@line 184 "HyMES/poly.c"
   $47 = HEAP16[$46>>1]|0; //@line 184 "HyMES/poly.c"
   $48 = $47&65535; //@line 184 "HyMES/poly.c"
   $49 = $48 << 1; //@line 184 "HyMES/poly.c"
   $50 = HEAP32[2862]|0; //@line 184 "HyMES/poly.c"
   $51 = $49 >> $50; //@line 184 "HyMES/poly.c"
   $52 = (($37) + ($51))|0; //@line 184 "HyMES/poly.c"
   $53 = HEAP32[2863]|0; //@line 184 "HyMES/poly.c"
   $54 = (($53) + ($52<<1)|0); //@line 184 "HyMES/poly.c"
   $55 = HEAP16[$54>>1]|0; //@line 184 "HyMES/poly.c"
   $56 = $55&65535; //@line 184 "HyMES/poly.c"
   $58 = $56;
  } else {
   $58 = 0;
  }
  $57 = $58&65535; //@line 184 "HyMES/poly.c"
  $59 = $8; //@line 184 "HyMES/poly.c"
  $60 = $59<<1; //@line 184 "HyMES/poly.c"
  $61 = $4; //@line 184 "HyMES/poly.c"
  $62 = ((($61)) + 8|0); //@line 184 "HyMES/poly.c"
  $63 = HEAP32[$62>>2]|0; //@line 184 "HyMES/poly.c"
  $64 = (($63) + ($60<<1)|0); //@line 184 "HyMES/poly.c"
  HEAP16[$64>>1] = $57; //@line 184 "HyMES/poly.c"
  $65 = $8; //@line 183 "HyMES/poly.c"
  $66 = (($65) + 1)|0; //@line 183 "HyMES/poly.c"
  $8 = $66; //@line 183 "HyMES/poly.c"
 }
 while(1) {
  $67 = $8; //@line 187 "HyMES/poly.c"
  $68 = $7; //@line 187 "HyMES/poly.c"
  $69 = ($67|0)<($68|0); //@line 187 "HyMES/poly.c"
  if (!($69)) {
   break;
  }
  $70 = $8; //@line 188 "HyMES/poly.c"
  $71 = $5; //@line 188 "HyMES/poly.c"
  $72 = ((($71)) + 8|0); //@line 188 "HyMES/poly.c"
  $73 = HEAP32[$72>>2]|0; //@line 188 "HyMES/poly.c"
  $74 = (($73) + ($70<<1)|0); //@line 188 "HyMES/poly.c"
  $75 = HEAP16[$74>>1]|0; //@line 188 "HyMES/poly.c"
  $76 = $75&65535; //@line 188 "HyMES/poly.c"
  $77 = ($76|0)!=(0); //@line 188 "HyMES/poly.c"
  L10: do {
   if ($77) {
    $78 = $8; //@line 189 "HyMES/poly.c"
    $79 = $5; //@line 189 "HyMES/poly.c"
    $80 = ((($79)) + 8|0); //@line 189 "HyMES/poly.c"
    $81 = HEAP32[$80>>2]|0; //@line 189 "HyMES/poly.c"
    $82 = (($81) + ($78<<1)|0); //@line 189 "HyMES/poly.c"
    $83 = HEAP16[$82>>1]|0; //@line 189 "HyMES/poly.c"
    $84 = $83&65535; //@line 189 "HyMES/poly.c"
    $85 = ($84|0)!=(0); //@line 189 "HyMES/poly.c"
    if ($85) {
     $86 = $8; //@line 189 "HyMES/poly.c"
     $87 = $5; //@line 189 "HyMES/poly.c"
     $88 = ((($87)) + 8|0); //@line 189 "HyMES/poly.c"
     $89 = HEAP32[$88>>2]|0; //@line 189 "HyMES/poly.c"
     $90 = (($89) + ($86<<1)|0); //@line 189 "HyMES/poly.c"
     $91 = HEAP16[$90>>1]|0; //@line 189 "HyMES/poly.c"
     $92 = $91&65535; //@line 189 "HyMES/poly.c"
     $93 = HEAP32[2860]|0; //@line 189 "HyMES/poly.c"
     $94 = (($93) + ($92<<1)|0); //@line 189 "HyMES/poly.c"
     $95 = HEAP16[$94>>1]|0; //@line 189 "HyMES/poly.c"
     $96 = $95&65535; //@line 189 "HyMES/poly.c"
     $97 = $96 << 1; //@line 189 "HyMES/poly.c"
     $98 = HEAP32[2861]|0; //@line 189 "HyMES/poly.c"
     $99 = $97 & $98; //@line 189 "HyMES/poly.c"
     $100 = $8; //@line 189 "HyMES/poly.c"
     $101 = $5; //@line 189 "HyMES/poly.c"
     $102 = ((($101)) + 8|0); //@line 189 "HyMES/poly.c"
     $103 = HEAP32[$102>>2]|0; //@line 189 "HyMES/poly.c"
     $104 = (($103) + ($100<<1)|0); //@line 189 "HyMES/poly.c"
     $105 = HEAP16[$104>>1]|0; //@line 189 "HyMES/poly.c"
     $106 = $105&65535; //@line 189 "HyMES/poly.c"
     $107 = HEAP32[2860]|0; //@line 189 "HyMES/poly.c"
     $108 = (($107) + ($106<<1)|0); //@line 189 "HyMES/poly.c"
     $109 = HEAP16[$108>>1]|0; //@line 189 "HyMES/poly.c"
     $110 = $109&65535; //@line 189 "HyMES/poly.c"
     $111 = $110 << 1; //@line 189 "HyMES/poly.c"
     $112 = HEAP32[2862]|0; //@line 189 "HyMES/poly.c"
     $113 = $111 >> $112; //@line 189 "HyMES/poly.c"
     $114 = (($99) + ($113))|0; //@line 189 "HyMES/poly.c"
     $115 = HEAP32[2863]|0; //@line 189 "HyMES/poly.c"
     $116 = (($115) + ($114<<1)|0); //@line 189 "HyMES/poly.c"
     $117 = HEAP16[$116>>1]|0; //@line 189 "HyMES/poly.c"
     $118 = $117&65535; //@line 189 "HyMES/poly.c"
     $120 = $118;
    } else {
     $120 = 0;
    }
    $119 = $120&65535; //@line 189 "HyMES/poly.c"
    $10 = $119; //@line 189 "HyMES/poly.c"
    $9 = 0; //@line 190 "HyMES/poly.c"
    while(1) {
     $121 = $9; //@line 190 "HyMES/poly.c"
     $122 = $7; //@line 190 "HyMES/poly.c"
     $123 = ($121|0)<($122|0); //@line 190 "HyMES/poly.c"
     if (!($123)) {
      break L10;
     }
     $124 = $9; //@line 191 "HyMES/poly.c"
     $125 = $4; //@line 191 "HyMES/poly.c"
     $126 = ((($125)) + 8|0); //@line 191 "HyMES/poly.c"
     $127 = HEAP32[$126>>2]|0; //@line 191 "HyMES/poly.c"
     $128 = (($127) + ($124<<1)|0); //@line 191 "HyMES/poly.c"
     $129 = HEAP16[$128>>1]|0; //@line 191 "HyMES/poly.c"
     $130 = $129&65535; //@line 191 "HyMES/poly.c"
     $131 = $9; //@line 191 "HyMES/poly.c"
     $132 = $8; //@line 191 "HyMES/poly.c"
     $133 = $6; //@line 191 "HyMES/poly.c"
     $134 = (($133) + ($132<<2)|0); //@line 191 "HyMES/poly.c"
     $135 = HEAP32[$134>>2]|0; //@line 191 "HyMES/poly.c"
     $136 = ((($135)) + 8|0); //@line 191 "HyMES/poly.c"
     $137 = HEAP32[$136>>2]|0; //@line 191 "HyMES/poly.c"
     $138 = (($137) + ($131<<1)|0); //@line 191 "HyMES/poly.c"
     $139 = HEAP16[$138>>1]|0; //@line 191 "HyMES/poly.c"
     $140 = $139&65535; //@line 191 "HyMES/poly.c"
     $141 = ($140|0)!=(0); //@line 191 "HyMES/poly.c"
     if ($141) {
      $142 = $10; //@line 191 "HyMES/poly.c"
      $143 = $142&65535; //@line 191 "HyMES/poly.c"
      $144 = HEAP32[2860]|0; //@line 191 "HyMES/poly.c"
      $145 = (($144) + ($143<<1)|0); //@line 191 "HyMES/poly.c"
      $146 = HEAP16[$145>>1]|0; //@line 191 "HyMES/poly.c"
      $147 = $146&65535; //@line 191 "HyMES/poly.c"
      $148 = $9; //@line 191 "HyMES/poly.c"
      $149 = $8; //@line 191 "HyMES/poly.c"
      $150 = $6; //@line 191 "HyMES/poly.c"
      $151 = (($150) + ($149<<2)|0); //@line 191 "HyMES/poly.c"
      $152 = HEAP32[$151>>2]|0; //@line 191 "HyMES/poly.c"
      $153 = ((($152)) + 8|0); //@line 191 "HyMES/poly.c"
      $154 = HEAP32[$153>>2]|0; //@line 191 "HyMES/poly.c"
      $155 = (($154) + ($148<<1)|0); //@line 191 "HyMES/poly.c"
      $156 = HEAP16[$155>>1]|0; //@line 191 "HyMES/poly.c"
      $157 = $156&65535; //@line 191 "HyMES/poly.c"
      $158 = HEAP32[2860]|0; //@line 191 "HyMES/poly.c"
      $159 = (($158) + ($157<<1)|0); //@line 191 "HyMES/poly.c"
      $160 = HEAP16[$159>>1]|0; //@line 191 "HyMES/poly.c"
      $161 = $160&65535; //@line 191 "HyMES/poly.c"
      $162 = (($147) + ($161))|0; //@line 191 "HyMES/poly.c"
      $163 = HEAP32[2861]|0; //@line 191 "HyMES/poly.c"
      $164 = $162 & $163; //@line 191 "HyMES/poly.c"
      $165 = $10; //@line 191 "HyMES/poly.c"
      $166 = $165&65535; //@line 191 "HyMES/poly.c"
      $167 = HEAP32[2860]|0; //@line 191 "HyMES/poly.c"
      $168 = (($167) + ($166<<1)|0); //@line 191 "HyMES/poly.c"
      $169 = HEAP16[$168>>1]|0; //@line 191 "HyMES/poly.c"
      $170 = $169&65535; //@line 191 "HyMES/poly.c"
      $171 = $9; //@line 191 "HyMES/poly.c"
      $172 = $8; //@line 191 "HyMES/poly.c"
      $173 = $6; //@line 191 "HyMES/poly.c"
      $174 = (($173) + ($172<<2)|0); //@line 191 "HyMES/poly.c"
      $175 = HEAP32[$174>>2]|0; //@line 191 "HyMES/poly.c"
      $176 = ((($175)) + 8|0); //@line 191 "HyMES/poly.c"
      $177 = HEAP32[$176>>2]|0; //@line 191 "HyMES/poly.c"
      $178 = (($177) + ($171<<1)|0); //@line 191 "HyMES/poly.c"
      $179 = HEAP16[$178>>1]|0; //@line 191 "HyMES/poly.c"
      $180 = $179&65535; //@line 191 "HyMES/poly.c"
      $181 = HEAP32[2860]|0; //@line 191 "HyMES/poly.c"
      $182 = (($181) + ($180<<1)|0); //@line 191 "HyMES/poly.c"
      $183 = HEAP16[$182>>1]|0; //@line 191 "HyMES/poly.c"
      $184 = $183&65535; //@line 191 "HyMES/poly.c"
      $185 = (($170) + ($184))|0; //@line 191 "HyMES/poly.c"
      $186 = HEAP32[2862]|0; //@line 191 "HyMES/poly.c"
      $187 = $185 >> $186; //@line 191 "HyMES/poly.c"
      $188 = (($164) + ($187))|0; //@line 191 "HyMES/poly.c"
      $189 = HEAP32[2863]|0; //@line 191 "HyMES/poly.c"
      $190 = (($189) + ($188<<1)|0); //@line 191 "HyMES/poly.c"
      $191 = HEAP16[$190>>1]|0; //@line 191 "HyMES/poly.c"
      $192 = $191&65535; //@line 191 "HyMES/poly.c"
      $194 = $192;
     } else {
      $194 = 0;
     }
     $193 = $130 ^ $194; //@line 191 "HyMES/poly.c"
     $195 = $193&65535; //@line 191 "HyMES/poly.c"
     $196 = $9; //@line 191 "HyMES/poly.c"
     $197 = $4; //@line 191 "HyMES/poly.c"
     $198 = ((($197)) + 8|0); //@line 191 "HyMES/poly.c"
     $199 = HEAP32[$198>>2]|0; //@line 191 "HyMES/poly.c"
     $200 = (($199) + ($196<<1)|0); //@line 191 "HyMES/poly.c"
     HEAP16[$200>>1] = $195; //@line 191 "HyMES/poly.c"
     $201 = $9; //@line 190 "HyMES/poly.c"
     $202 = (($201) + 1)|0; //@line 190 "HyMES/poly.c"
     $9 = $202; //@line 190 "HyMES/poly.c"
    }
   }
  } while(0);
  $203 = $8; //@line 187 "HyMES/poly.c"
  $204 = (($203) + 1)|0; //@line 187 "HyMES/poly.c"
  $8 = $204; //@line 187 "HyMES/poly.c"
 }
 $205 = $7; //@line 196 "HyMES/poly.c"
 $206 = (($205) - 1)|0; //@line 196 "HyMES/poly.c"
 $207 = $4; //@line 196 "HyMES/poly.c"
 HEAP32[$207>>2] = $206; //@line 196 "HyMES/poly.c"
 while(1) {
  $208 = $4; //@line 197 "HyMES/poly.c"
  $209 = HEAP32[$208>>2]|0; //@line 197 "HyMES/poly.c"
  $210 = ($209|0)>=(0); //@line 197 "HyMES/poly.c"
  if (!($210)) {
   label = 20;
   break;
  }
  $211 = $4; //@line 197 "HyMES/poly.c"
  $212 = HEAP32[$211>>2]|0; //@line 197 "HyMES/poly.c"
  $213 = $4; //@line 197 "HyMES/poly.c"
  $214 = ((($213)) + 8|0); //@line 197 "HyMES/poly.c"
  $215 = HEAP32[$214>>2]|0; //@line 197 "HyMES/poly.c"
  $216 = (($215) + ($212<<1)|0); //@line 197 "HyMES/poly.c"
  $217 = HEAP16[$216>>1]|0; //@line 197 "HyMES/poly.c"
  $218 = $217&65535; //@line 197 "HyMES/poly.c"
  $219 = ($218|0)==(0); //@line 197 "HyMES/poly.c"
  if (!($219)) {
   label = 20;
   break;
  }
  $220 = $4; //@line 198 "HyMES/poly.c"
  $221 = HEAP32[$220>>2]|0; //@line 198 "HyMES/poly.c"
  $222 = (($221) - 1)|0; //@line 198 "HyMES/poly.c"
  $223 = $4; //@line 198 "HyMES/poly.c"
  HEAP32[$223>>2] = $222; //@line 198 "HyMES/poly.c"
 }
 if ((label|0) == 20) {
  STACKTOP = sp;return; //@line 199 "HyMES/poly.c"
 }
}
function _poly_gcd_aux($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $4; //@line 203 "HyMES/poly.c"
 $6 = HEAP32[$5>>2]|0; //@line 203 "HyMES/poly.c"
 $7 = ($6|0)==(-1); //@line 203 "HyMES/poly.c"
 $8 = $3; //@line 204 "HyMES/poly.c"
 if ($7) {
  $2 = $8; //@line 204 "HyMES/poly.c"
  $13 = $2; //@line 209 "HyMES/poly.c"
  STACKTOP = sp;return ($13|0); //@line 209 "HyMES/poly.c"
 } else {
  $9 = $4; //@line 206 "HyMES/poly.c"
  _poly_rem($8,$9); //@line 206 "HyMES/poly.c"
  $10 = $4; //@line 207 "HyMES/poly.c"
  $11 = $3; //@line 207 "HyMES/poly.c"
  $12 = (_poly_gcd_aux($10,$11)|0); //@line 207 "HyMES/poly.c"
  $2 = $12; //@line 207 "HyMES/poly.c"
  $13 = $2; //@line 209 "HyMES/poly.c"
  STACKTOP = sp;return ($13|0); //@line 209 "HyMES/poly.c"
 }
 return (0)|0;
}
function _poly_gcd($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $2 = $0;
 $3 = $1;
 $7 = $2; //@line 214 "HyMES/poly.c"
 $8 = (_poly_copy($7)|0); //@line 214 "HyMES/poly.c"
 $4 = $8; //@line 214 "HyMES/poly.c"
 $9 = $3; //@line 215 "HyMES/poly.c"
 $10 = (_poly_copy($9)|0); //@line 215 "HyMES/poly.c"
 $5 = $10; //@line 215 "HyMES/poly.c"
 $11 = $4; //@line 216 "HyMES/poly.c"
 $12 = HEAP32[$11>>2]|0; //@line 216 "HyMES/poly.c"
 $13 = $5; //@line 216 "HyMES/poly.c"
 $14 = HEAP32[$13>>2]|0; //@line 216 "HyMES/poly.c"
 $15 = ($12|0)<($14|0); //@line 216 "HyMES/poly.c"
 if ($15) {
  $16 = $5; //@line 217 "HyMES/poly.c"
  $17 = $4; //@line 217 "HyMES/poly.c"
  $18 = (_poly_gcd_aux($16,$17)|0); //@line 217 "HyMES/poly.c"
  $19 = (_poly_copy($18)|0); //@line 217 "HyMES/poly.c"
  $6 = $19; //@line 217 "HyMES/poly.c"
 } else {
  $20 = $4; //@line 219 "HyMES/poly.c"
  $21 = $5; //@line 219 "HyMES/poly.c"
  $22 = (_poly_gcd_aux($20,$21)|0); //@line 219 "HyMES/poly.c"
  $23 = (_poly_copy($22)|0); //@line 219 "HyMES/poly.c"
  $6 = $23; //@line 219 "HyMES/poly.c"
 }
 $24 = $4; //@line 220 "HyMES/poly.c"
 _poly_free($24); //@line 220 "HyMES/poly.c"
 $25 = $5; //@line 221 "HyMES/poly.c"
 _poly_free($25); //@line 221 "HyMES/poly.c"
 $26 = $6; //@line 222 "HyMES/poly.c"
 STACKTOP = sp;return ($26|0); //@line 222 "HyMES/poly.c"
}
function _poly_quo($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0;
 var $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0;
 var $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0;
 var $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0;
 var $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0;
 var $208 = 0, $209 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0;
 var $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0;
 var $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0;
 var $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0;
 var $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(48|0);
 $2 = $0;
 $3 = $1;
 $12 = $3; //@line 230 "HyMES/poly.c"
 $13 = (_poly_calcule_deg($12)|0); //@line 230 "HyMES/poly.c"
 $6 = $13; //@line 230 "HyMES/poly.c"
 $14 = $2; //@line 231 "HyMES/poly.c"
 $15 = (_poly_calcule_deg($14)|0); //@line 231 "HyMES/poly.c"
 $7 = $15; //@line 231 "HyMES/poly.c"
 $16 = $2; //@line 232 "HyMES/poly.c"
 $17 = (_poly_copy($16)|0); //@line 232 "HyMES/poly.c"
 $11 = $17; //@line 232 "HyMES/poly.c"
 $18 = $7; //@line 233 "HyMES/poly.c"
 $19 = $6; //@line 233 "HyMES/poly.c"
 $20 = (($18) - ($19))|0; //@line 233 "HyMES/poly.c"
 $21 = (_poly_alloc($20)|0); //@line 233 "HyMES/poly.c"
 $10 = $21; //@line 233 "HyMES/poly.c"
 $22 = $7; //@line 234 "HyMES/poly.c"
 $23 = $6; //@line 234 "HyMES/poly.c"
 $24 = (($22) - ($23))|0; //@line 234 "HyMES/poly.c"
 $25 = $10; //@line 234 "HyMES/poly.c"
 HEAP32[$25>>2] = $24; //@line 234 "HyMES/poly.c"
 $26 = HEAP32[2861]|0; //@line 235 "HyMES/poly.c"
 $27 = $6; //@line 235 "HyMES/poly.c"
 $28 = $3; //@line 235 "HyMES/poly.c"
 $29 = ((($28)) + 8|0); //@line 235 "HyMES/poly.c"
 $30 = HEAP32[$29>>2]|0; //@line 235 "HyMES/poly.c"
 $31 = (($30) + ($27<<1)|0); //@line 235 "HyMES/poly.c"
 $32 = HEAP16[$31>>1]|0; //@line 235 "HyMES/poly.c"
 $33 = $32&65535; //@line 235 "HyMES/poly.c"
 $34 = HEAP32[2860]|0; //@line 235 "HyMES/poly.c"
 $35 = (($34) + ($33<<1)|0); //@line 235 "HyMES/poly.c"
 $36 = HEAP16[$35>>1]|0; //@line 235 "HyMES/poly.c"
 $37 = $36&65535; //@line 235 "HyMES/poly.c"
 $38 = (($26) - ($37))|0; //@line 235 "HyMES/poly.c"
 $39 = HEAP32[2863]|0; //@line 235 "HyMES/poly.c"
 $40 = (($39) + ($38<<1)|0); //@line 235 "HyMES/poly.c"
 $41 = HEAP16[$40>>1]|0; //@line 235 "HyMES/poly.c"
 $8 = $41; //@line 235 "HyMES/poly.c"
 $42 = $7; //@line 236 "HyMES/poly.c"
 $4 = $42; //@line 236 "HyMES/poly.c"
 while(1) {
  $43 = $4; //@line 236 "HyMES/poly.c"
  $44 = $6; //@line 236 "HyMES/poly.c"
  $45 = ($43|0)>=($44|0); //@line 236 "HyMES/poly.c"
  if (!($45)) {
   break;
  }
  $46 = $4; //@line 237 "HyMES/poly.c"
  $47 = $11; //@line 237 "HyMES/poly.c"
  $48 = ((($47)) + 8|0); //@line 237 "HyMES/poly.c"
  $49 = HEAP32[$48>>2]|0; //@line 237 "HyMES/poly.c"
  $50 = (($49) + ($46<<1)|0); //@line 237 "HyMES/poly.c"
  $51 = HEAP16[$50>>1]|0; //@line 237 "HyMES/poly.c"
  $52 = $51&65535; //@line 237 "HyMES/poly.c"
  $53 = ($52|0)!=(0); //@line 237 "HyMES/poly.c"
  if ($53) {
   $54 = $8; //@line 237 "HyMES/poly.c"
   $55 = $54&65535; //@line 237 "HyMES/poly.c"
   $56 = HEAP32[2860]|0; //@line 237 "HyMES/poly.c"
   $57 = (($56) + ($55<<1)|0); //@line 237 "HyMES/poly.c"
   $58 = HEAP16[$57>>1]|0; //@line 237 "HyMES/poly.c"
   $59 = $58&65535; //@line 237 "HyMES/poly.c"
   $60 = $4; //@line 237 "HyMES/poly.c"
   $61 = $11; //@line 237 "HyMES/poly.c"
   $62 = ((($61)) + 8|0); //@line 237 "HyMES/poly.c"
   $63 = HEAP32[$62>>2]|0; //@line 237 "HyMES/poly.c"
   $64 = (($63) + ($60<<1)|0); //@line 237 "HyMES/poly.c"
   $65 = HEAP16[$64>>1]|0; //@line 237 "HyMES/poly.c"
   $66 = $65&65535; //@line 237 "HyMES/poly.c"
   $67 = HEAP32[2860]|0; //@line 237 "HyMES/poly.c"
   $68 = (($67) + ($66<<1)|0); //@line 237 "HyMES/poly.c"
   $69 = HEAP16[$68>>1]|0; //@line 237 "HyMES/poly.c"
   $70 = $69&65535; //@line 237 "HyMES/poly.c"
   $71 = (($59) + ($70))|0; //@line 237 "HyMES/poly.c"
   $72 = HEAP32[2861]|0; //@line 237 "HyMES/poly.c"
   $73 = $71 & $72; //@line 237 "HyMES/poly.c"
   $74 = $8; //@line 237 "HyMES/poly.c"
   $75 = $74&65535; //@line 237 "HyMES/poly.c"
   $76 = HEAP32[2860]|0; //@line 237 "HyMES/poly.c"
   $77 = (($76) + ($75<<1)|0); //@line 237 "HyMES/poly.c"
   $78 = HEAP16[$77>>1]|0; //@line 237 "HyMES/poly.c"
   $79 = $78&65535; //@line 237 "HyMES/poly.c"
   $80 = $4; //@line 237 "HyMES/poly.c"
   $81 = $11; //@line 237 "HyMES/poly.c"
   $82 = ((($81)) + 8|0); //@line 237 "HyMES/poly.c"
   $83 = HEAP32[$82>>2]|0; //@line 237 "HyMES/poly.c"
   $84 = (($83) + ($80<<1)|0); //@line 237 "HyMES/poly.c"
   $85 = HEAP16[$84>>1]|0; //@line 237 "HyMES/poly.c"
   $86 = $85&65535; //@line 237 "HyMES/poly.c"
   $87 = HEAP32[2860]|0; //@line 237 "HyMES/poly.c"
   $88 = (($87) + ($86<<1)|0); //@line 237 "HyMES/poly.c"
   $89 = HEAP16[$88>>1]|0; //@line 237 "HyMES/poly.c"
   $90 = $89&65535; //@line 237 "HyMES/poly.c"
   $91 = (($79) + ($90))|0; //@line 237 "HyMES/poly.c"
   $92 = HEAP32[2862]|0; //@line 237 "HyMES/poly.c"
   $93 = $91 >> $92; //@line 237 "HyMES/poly.c"
   $94 = (($73) + ($93))|0; //@line 237 "HyMES/poly.c"
   $95 = HEAP32[2863]|0; //@line 237 "HyMES/poly.c"
   $96 = (($95) + ($94<<1)|0); //@line 237 "HyMES/poly.c"
   $97 = HEAP16[$96>>1]|0; //@line 237 "HyMES/poly.c"
   $98 = $97&65535; //@line 237 "HyMES/poly.c"
   $100 = $98;
  } else {
   $100 = 0;
  }
  $99 = $100&65535; //@line 237 "HyMES/poly.c"
  $9 = $99; //@line 237 "HyMES/poly.c"
  $101 = $9; //@line 238 "HyMES/poly.c"
  $102 = $4; //@line 238 "HyMES/poly.c"
  $103 = $6; //@line 238 "HyMES/poly.c"
  $104 = (($102) - ($103))|0; //@line 238 "HyMES/poly.c"
  $105 = $10; //@line 238 "HyMES/poly.c"
  $106 = ((($105)) + 8|0); //@line 238 "HyMES/poly.c"
  $107 = HEAP32[$106>>2]|0; //@line 238 "HyMES/poly.c"
  $108 = (($107) + ($104<<1)|0); //@line 238 "HyMES/poly.c"
  HEAP16[$108>>1] = $101; //@line 238 "HyMES/poly.c"
  $109 = $9; //@line 239 "HyMES/poly.c"
  $110 = $109&65535; //@line 239 "HyMES/poly.c"
  $111 = ($110|0)!=(0); //@line 239 "HyMES/poly.c"
  L7: do {
   if ($111) {
    $112 = $4; //@line 240 "HyMES/poly.c"
    $113 = $11; //@line 240 "HyMES/poly.c"
    $114 = ((($113)) + 8|0); //@line 240 "HyMES/poly.c"
    $115 = HEAP32[$114>>2]|0; //@line 240 "HyMES/poly.c"
    $116 = (($115) + ($112<<1)|0); //@line 240 "HyMES/poly.c"
    HEAP16[$116>>1] = 0; //@line 240 "HyMES/poly.c"
    $117 = $4; //@line 241 "HyMES/poly.c"
    $118 = (($117) - 1)|0; //@line 241 "HyMES/poly.c"
    $5 = $118; //@line 241 "HyMES/poly.c"
    while(1) {
     $119 = $5; //@line 241 "HyMES/poly.c"
     $120 = $4; //@line 241 "HyMES/poly.c"
     $121 = $6; //@line 241 "HyMES/poly.c"
     $122 = (($120) - ($121))|0; //@line 241 "HyMES/poly.c"
     $123 = ($119|0)>=($122|0); //@line 241 "HyMES/poly.c"
     if (!($123)) {
      break L7;
     }
     $124 = $5; //@line 242 "HyMES/poly.c"
     $125 = $11; //@line 242 "HyMES/poly.c"
     $126 = ((($125)) + 8|0); //@line 242 "HyMES/poly.c"
     $127 = HEAP32[$126>>2]|0; //@line 242 "HyMES/poly.c"
     $128 = (($127) + ($124<<1)|0); //@line 242 "HyMES/poly.c"
     $129 = HEAP16[$128>>1]|0; //@line 242 "HyMES/poly.c"
     $130 = $129&65535; //@line 242 "HyMES/poly.c"
     $131 = $6; //@line 242 "HyMES/poly.c"
     $132 = $4; //@line 242 "HyMES/poly.c"
     $133 = (($131) - ($132))|0; //@line 242 "HyMES/poly.c"
     $134 = $5; //@line 242 "HyMES/poly.c"
     $135 = (($133) + ($134))|0; //@line 242 "HyMES/poly.c"
     $136 = $3; //@line 242 "HyMES/poly.c"
     $137 = ((($136)) + 8|0); //@line 242 "HyMES/poly.c"
     $138 = HEAP32[$137>>2]|0; //@line 242 "HyMES/poly.c"
     $139 = (($138) + ($135<<1)|0); //@line 242 "HyMES/poly.c"
     $140 = HEAP16[$139>>1]|0; //@line 242 "HyMES/poly.c"
     $141 = $140&65535; //@line 242 "HyMES/poly.c"
     $142 = ($141|0)!=(0); //@line 242 "HyMES/poly.c"
     if ($142) {
      $143 = $9; //@line 242 "HyMES/poly.c"
      $144 = $143&65535; //@line 242 "HyMES/poly.c"
      $145 = HEAP32[2860]|0; //@line 242 "HyMES/poly.c"
      $146 = (($145) + ($144<<1)|0); //@line 242 "HyMES/poly.c"
      $147 = HEAP16[$146>>1]|0; //@line 242 "HyMES/poly.c"
      $148 = $147&65535; //@line 242 "HyMES/poly.c"
      $149 = $6; //@line 242 "HyMES/poly.c"
      $150 = $4; //@line 242 "HyMES/poly.c"
      $151 = (($149) - ($150))|0; //@line 242 "HyMES/poly.c"
      $152 = $5; //@line 242 "HyMES/poly.c"
      $153 = (($151) + ($152))|0; //@line 242 "HyMES/poly.c"
      $154 = $3; //@line 242 "HyMES/poly.c"
      $155 = ((($154)) + 8|0); //@line 242 "HyMES/poly.c"
      $156 = HEAP32[$155>>2]|0; //@line 242 "HyMES/poly.c"
      $157 = (($156) + ($153<<1)|0); //@line 242 "HyMES/poly.c"
      $158 = HEAP16[$157>>1]|0; //@line 242 "HyMES/poly.c"
      $159 = $158&65535; //@line 242 "HyMES/poly.c"
      $160 = HEAP32[2860]|0; //@line 242 "HyMES/poly.c"
      $161 = (($160) + ($159<<1)|0); //@line 242 "HyMES/poly.c"
      $162 = HEAP16[$161>>1]|0; //@line 242 "HyMES/poly.c"
      $163 = $162&65535; //@line 242 "HyMES/poly.c"
      $164 = (($148) + ($163))|0; //@line 242 "HyMES/poly.c"
      $165 = HEAP32[2861]|0; //@line 242 "HyMES/poly.c"
      $166 = $164 & $165; //@line 242 "HyMES/poly.c"
      $167 = $9; //@line 242 "HyMES/poly.c"
      $168 = $167&65535; //@line 242 "HyMES/poly.c"
      $169 = HEAP32[2860]|0; //@line 242 "HyMES/poly.c"
      $170 = (($169) + ($168<<1)|0); //@line 242 "HyMES/poly.c"
      $171 = HEAP16[$170>>1]|0; //@line 242 "HyMES/poly.c"
      $172 = $171&65535; //@line 242 "HyMES/poly.c"
      $173 = $6; //@line 242 "HyMES/poly.c"
      $174 = $4; //@line 242 "HyMES/poly.c"
      $175 = (($173) - ($174))|0; //@line 242 "HyMES/poly.c"
      $176 = $5; //@line 242 "HyMES/poly.c"
      $177 = (($175) + ($176))|0; //@line 242 "HyMES/poly.c"
      $178 = $3; //@line 242 "HyMES/poly.c"
      $179 = ((($178)) + 8|0); //@line 242 "HyMES/poly.c"
      $180 = HEAP32[$179>>2]|0; //@line 242 "HyMES/poly.c"
      $181 = (($180) + ($177<<1)|0); //@line 242 "HyMES/poly.c"
      $182 = HEAP16[$181>>1]|0; //@line 242 "HyMES/poly.c"
      $183 = $182&65535; //@line 242 "HyMES/poly.c"
      $184 = HEAP32[2860]|0; //@line 242 "HyMES/poly.c"
      $185 = (($184) + ($183<<1)|0); //@line 242 "HyMES/poly.c"
      $186 = HEAP16[$185>>1]|0; //@line 242 "HyMES/poly.c"
      $187 = $186&65535; //@line 242 "HyMES/poly.c"
      $188 = (($172) + ($187))|0; //@line 242 "HyMES/poly.c"
      $189 = HEAP32[2862]|0; //@line 242 "HyMES/poly.c"
      $190 = $188 >> $189; //@line 242 "HyMES/poly.c"
      $191 = (($166) + ($190))|0; //@line 242 "HyMES/poly.c"
      $192 = HEAP32[2863]|0; //@line 242 "HyMES/poly.c"
      $193 = (($192) + ($191<<1)|0); //@line 242 "HyMES/poly.c"
      $194 = HEAP16[$193>>1]|0; //@line 242 "HyMES/poly.c"
      $195 = $194&65535; //@line 242 "HyMES/poly.c"
      $197 = $195;
     } else {
      $197 = 0;
     }
     $196 = $130 ^ $197; //@line 242 "HyMES/poly.c"
     $198 = $196&65535; //@line 242 "HyMES/poly.c"
     $199 = $5; //@line 242 "HyMES/poly.c"
     $200 = $11; //@line 242 "HyMES/poly.c"
     $201 = ((($200)) + 8|0); //@line 242 "HyMES/poly.c"
     $202 = HEAP32[$201>>2]|0; //@line 242 "HyMES/poly.c"
     $203 = (($202) + ($199<<1)|0); //@line 242 "HyMES/poly.c"
     HEAP16[$203>>1] = $198; //@line 242 "HyMES/poly.c"
     $204 = $5; //@line 241 "HyMES/poly.c"
     $205 = (($204) + -1)|0; //@line 241 "HyMES/poly.c"
     $5 = $205; //@line 241 "HyMES/poly.c"
    }
   }
  } while(0);
  $206 = $4; //@line 236 "HyMES/poly.c"
  $207 = (($206) + -1)|0; //@line 236 "HyMES/poly.c"
  $4 = $207; //@line 236 "HyMES/poly.c"
 }
 $208 = $11; //@line 245 "HyMES/poly.c"
 _poly_free($208); //@line 245 "HyMES/poly.c"
 $209 = $10; //@line 247 "HyMES/poly.c"
 STACKTOP = sp;return ($209|0); //@line 247 "HyMES/poly.c"
}
function _poly_degppf($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0;
 var $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0;
 var $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0;
 var $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0;
 var $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0;
 var $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $1 = $0;
 $9 = $1; //@line 255 "HyMES/poly.c"
 $10 = HEAP32[$9>>2]|0; //@line 255 "HyMES/poly.c"
 $3 = $10; //@line 255 "HyMES/poly.c"
 $11 = $3; //@line 256 "HyMES/poly.c"
 $12 = $11<<2; //@line 256 "HyMES/poly.c"
 $13 = (_malloc($12)|0); //@line 256 "HyMES/poly.c"
 $5 = $13; //@line 256 "HyMES/poly.c"
 $2 = 0; //@line 257 "HyMES/poly.c"
 while(1) {
  $14 = $2; //@line 257 "HyMES/poly.c"
  $15 = $3; //@line 257 "HyMES/poly.c"
  $16 = ($14|0)<($15|0); //@line 257 "HyMES/poly.c"
  if (!($16)) {
   break;
  }
  $17 = $3; //@line 258 "HyMES/poly.c"
  $18 = (($17) + 1)|0; //@line 258 "HyMES/poly.c"
  $19 = (_poly_alloc($18)|0); //@line 258 "HyMES/poly.c"
  $20 = $2; //@line 258 "HyMES/poly.c"
  $21 = $5; //@line 258 "HyMES/poly.c"
  $22 = (($21) + ($20<<2)|0); //@line 258 "HyMES/poly.c"
  HEAP32[$22>>2] = $19; //@line 258 "HyMES/poly.c"
  $23 = $2; //@line 257 "HyMES/poly.c"
  $24 = (($23) + 1)|0; //@line 257 "HyMES/poly.c"
  $2 = $24; //@line 257 "HyMES/poly.c"
 }
 $25 = $1; //@line 259 "HyMES/poly.c"
 $26 = $5; //@line 259 "HyMES/poly.c"
 _poly_sqmod_init($25,$26); //@line 259 "HyMES/poly.c"
 $27 = $3; //@line 261 "HyMES/poly.c"
 $28 = (($27) - 1)|0; //@line 261 "HyMES/poly.c"
 $29 = (_poly_alloc($28)|0); //@line 261 "HyMES/poly.c"
 $6 = $29; //@line 261 "HyMES/poly.c"
 $30 = $6; //@line 262 "HyMES/poly.c"
 HEAP32[$30>>2] = 1; //@line 262 "HyMES/poly.c"
 $31 = $6; //@line 263 "HyMES/poly.c"
 $32 = ((($31)) + 8|0); //@line 263 "HyMES/poly.c"
 $33 = HEAP32[$32>>2]|0; //@line 263 "HyMES/poly.c"
 $34 = ((($33)) + 2|0); //@line 263 "HyMES/poly.c"
 HEAP16[$34>>1] = 1; //@line 263 "HyMES/poly.c"
 $35 = $3; //@line 264 "HyMES/poly.c"
 $36 = (($35) - 1)|0; //@line 264 "HyMES/poly.c"
 $37 = (_poly_alloc($36)|0); //@line 264 "HyMES/poly.c"
 $7 = $37; //@line 264 "HyMES/poly.c"
 $38 = $3; //@line 265 "HyMES/poly.c"
 $4 = $38; //@line 265 "HyMES/poly.c"
 $2 = 1; //@line 266 "HyMES/poly.c"
 while(1) {
  $39 = $2; //@line 266 "HyMES/poly.c"
  $40 = $3; //@line 266 "HyMES/poly.c"
  $41 = (($40|0) / 2)&-1; //@line 266 "HyMES/poly.c"
  $42 = HEAP32[2862]|0; //@line 266 "HyMES/poly.c"
  $43 = Math_imul($41, $42)|0; //@line 266 "HyMES/poly.c"
  $44 = ($39|0)<=($43|0); //@line 266 "HyMES/poly.c"
  if (!($44)) {
   break;
  }
  $45 = $7; //@line 267 "HyMES/poly.c"
  $46 = $6; //@line 267 "HyMES/poly.c"
  $47 = $5; //@line 267 "HyMES/poly.c"
  $48 = $3; //@line 267 "HyMES/poly.c"
  _poly_sqmod($45,$46,$47,$48); //@line 267 "HyMES/poly.c"
  $49 = $2; //@line 269 "HyMES/poly.c"
  $50 = HEAP32[2862]|0; //@line 269 "HyMES/poly.c"
  $51 = (($49|0) % ($50|0))&-1; //@line 269 "HyMES/poly.c"
  $52 = ($51|0)==(0); //@line 269 "HyMES/poly.c"
  if ($52) {
   $53 = $7; //@line 270 "HyMES/poly.c"
   $54 = ((($53)) + 8|0); //@line 270 "HyMES/poly.c"
   $55 = HEAP32[$54>>2]|0; //@line 270 "HyMES/poly.c"
   $56 = ((($55)) + 2|0); //@line 270 "HyMES/poly.c"
   $57 = HEAP16[$56>>1]|0; //@line 270 "HyMES/poly.c"
   $58 = $57&65535; //@line 270 "HyMES/poly.c"
   $59 = $58 ^ 1; //@line 270 "HyMES/poly.c"
   $60 = $59&65535; //@line 270 "HyMES/poly.c"
   $61 = $7; //@line 270 "HyMES/poly.c"
   $62 = ((($61)) + 8|0); //@line 270 "HyMES/poly.c"
   $63 = HEAP32[$62>>2]|0; //@line 270 "HyMES/poly.c"
   $64 = ((($63)) + 2|0); //@line 270 "HyMES/poly.c"
   HEAP16[$64>>1] = $60; //@line 270 "HyMES/poly.c"
   $65 = $7; //@line 271 "HyMES/poly.c"
   (_poly_calcule_deg($65)|0); //@line 271 "HyMES/poly.c"
   $66 = $1; //@line 272 "HyMES/poly.c"
   $67 = $7; //@line 272 "HyMES/poly.c"
   $68 = (_poly_gcd($66,$67)|0); //@line 272 "HyMES/poly.c"
   $8 = $68; //@line 272 "HyMES/poly.c"
   $69 = $8; //@line 273 "HyMES/poly.c"
   $70 = HEAP32[$69>>2]|0; //@line 273 "HyMES/poly.c"
   $71 = ($70|0)>(0); //@line 273 "HyMES/poly.c"
   $72 = $8; //@line 274 "HyMES/poly.c"
   _poly_free($72); //@line 274 "HyMES/poly.c"
   if ($71) {
    label = 8;
    break;
   }
   $76 = $7; //@line 279 "HyMES/poly.c"
   $77 = ((($76)) + 8|0); //@line 279 "HyMES/poly.c"
   $78 = HEAP32[$77>>2]|0; //@line 279 "HyMES/poly.c"
   $79 = ((($78)) + 2|0); //@line 279 "HyMES/poly.c"
   $80 = HEAP16[$79>>1]|0; //@line 279 "HyMES/poly.c"
   $81 = $80&65535; //@line 279 "HyMES/poly.c"
   $82 = $81 ^ 1; //@line 279 "HyMES/poly.c"
   $83 = $82&65535; //@line 279 "HyMES/poly.c"
   $84 = $7; //@line 279 "HyMES/poly.c"
   $85 = ((($84)) + 8|0); //@line 279 "HyMES/poly.c"
   $86 = HEAP32[$85>>2]|0; //@line 279 "HyMES/poly.c"
   $87 = ((($86)) + 2|0); //@line 279 "HyMES/poly.c"
   HEAP16[$87>>1] = $83; //@line 279 "HyMES/poly.c"
   $88 = $7; //@line 280 "HyMES/poly.c"
   (_poly_calcule_deg($88)|0); //@line 280 "HyMES/poly.c"
  }
  $89 = $6; //@line 283 "HyMES/poly.c"
  $8 = $89; //@line 283 "HyMES/poly.c"
  $90 = $7; //@line 284 "HyMES/poly.c"
  $6 = $90; //@line 284 "HyMES/poly.c"
  $91 = $8; //@line 285 "HyMES/poly.c"
  $7 = $91; //@line 285 "HyMES/poly.c"
  $92 = $2; //@line 266 "HyMES/poly.c"
  $93 = (($92) + 1)|0; //@line 266 "HyMES/poly.c"
  $2 = $93; //@line 266 "HyMES/poly.c"
 }
 if ((label|0) == 8) {
  $73 = $2; //@line 275 "HyMES/poly.c"
  $74 = HEAP32[2862]|0; //@line 275 "HyMES/poly.c"
  $75 = (($73|0) / ($74|0))&-1; //@line 275 "HyMES/poly.c"
  $4 = $75; //@line 275 "HyMES/poly.c"
 }
 $94 = $6; //@line 288 "HyMES/poly.c"
 _poly_free($94); //@line 288 "HyMES/poly.c"
 $95 = $7; //@line 289 "HyMES/poly.c"
 _poly_free($95); //@line 289 "HyMES/poly.c"
 $2 = 0; //@line 290 "HyMES/poly.c"
 while(1) {
  $96 = $2; //@line 290 "HyMES/poly.c"
  $97 = $3; //@line 290 "HyMES/poly.c"
  $98 = ($96|0)<($97|0); //@line 290 "HyMES/poly.c"
  if (!($98)) {
   break;
  }
  $99 = $2; //@line 291 "HyMES/poly.c"
  $100 = $5; //@line 291 "HyMES/poly.c"
  $101 = (($100) + ($99<<2)|0); //@line 291 "HyMES/poly.c"
  $102 = HEAP32[$101>>2]|0; //@line 291 "HyMES/poly.c"
  _poly_free($102); //@line 291 "HyMES/poly.c"
  $103 = $2; //@line 290 "HyMES/poly.c"
  $104 = (($103) + 1)|0; //@line 290 "HyMES/poly.c"
  $2 = $104; //@line 290 "HyMES/poly.c"
 }
 $105 = $5; //@line 293 "HyMES/poly.c"
 _free($105); //@line 293 "HyMES/poly.c"
 $106 = $4; //@line 295 "HyMES/poly.c"
 STACKTOP = sp;return ($106|0); //@line 295 "HyMES/poly.c"
}
function _poly_eeaux($0,$1,$2,$3,$4) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0;
 var $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0;
 var $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0;
 var $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0;
 var $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0;
 var $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0;
 var $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0;
 var $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0;
 var $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0;
 var $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0;
 var $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0;
 var $318 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0;
 var $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0;
 var $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0;
 var $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(64|0);
 $5 = $0;
 $6 = $1;
 $7 = $2;
 $8 = $3;
 $9 = $4;
 $21 = $8; //@line 306 "HyMES/poly.c"
 $22 = HEAP32[$21>>2]|0; //@line 306 "HyMES/poly.c"
 $12 = $22; //@line 306 "HyMES/poly.c"
 $23 = $12; //@line 308 "HyMES/poly.c"
 $24 = (_poly_alloc($23)|0); //@line 308 "HyMES/poly.c"
 $17 = $24; //@line 308 "HyMES/poly.c"
 $25 = $12; //@line 309 "HyMES/poly.c"
 $26 = (($25) - 1)|0; //@line 309 "HyMES/poly.c"
 $27 = (_poly_alloc($26)|0); //@line 309 "HyMES/poly.c"
 $18 = $27; //@line 309 "HyMES/poly.c"
 $28 = $12; //@line 310 "HyMES/poly.c"
 $29 = (($28) - 1)|0; //@line 310 "HyMES/poly.c"
 $30 = (_poly_alloc($29)|0); //@line 310 "HyMES/poly.c"
 $19 = $30; //@line 310 "HyMES/poly.c"
 $31 = $12; //@line 311 "HyMES/poly.c"
 $32 = (($31) - 1)|0; //@line 311 "HyMES/poly.c"
 $33 = (_poly_alloc($32)|0); //@line 311 "HyMES/poly.c"
 $20 = $33; //@line 311 "HyMES/poly.c"
 $34 = $17; //@line 312 "HyMES/poly.c"
 $35 = $8; //@line 312 "HyMES/poly.c"
 _poly_set($34,$35); //@line 312 "HyMES/poly.c"
 $36 = $18; //@line 313 "HyMES/poly.c"
 $37 = $7; //@line 313 "HyMES/poly.c"
 _poly_set($36,$37); //@line 313 "HyMES/poly.c"
 $38 = $19; //@line 314 "HyMES/poly.c"
 _poly_set_to_zero($38); //@line 314 "HyMES/poly.c"
 $39 = $20; //@line 315 "HyMES/poly.c"
 _poly_set_to_zero($39); //@line 315 "HyMES/poly.c"
 $40 = $20; //@line 316 "HyMES/poly.c"
 $41 = ((($40)) + 8|0); //@line 316 "HyMES/poly.c"
 $42 = HEAP32[$41>>2]|0; //@line 316 "HyMES/poly.c"
 HEAP16[$42>>1] = 1; //@line 316 "HyMES/poly.c"
 $43 = $20; //@line 317 "HyMES/poly.c"
 HEAP32[$43>>2] = 0; //@line 317 "HyMES/poly.c"
 $13 = 0; //@line 325 "HyMES/poly.c"
 $44 = $18; //@line 326 "HyMES/poly.c"
 $45 = HEAP32[$44>>2]|0; //@line 326 "HyMES/poly.c"
 $12 = $45; //@line 326 "HyMES/poly.c"
 $46 = $17; //@line 327 "HyMES/poly.c"
 $47 = HEAP32[$46>>2]|0; //@line 327 "HyMES/poly.c"
 $48 = $12; //@line 327 "HyMES/poly.c"
 $49 = (($47) - ($48))|0; //@line 327 "HyMES/poly.c"
 $14 = $49; //@line 327 "HyMES/poly.c"
 while(1) {
  $50 = $12; //@line 329 "HyMES/poly.c"
  $51 = $9; //@line 329 "HyMES/poly.c"
  $52 = ($50|0)>=($51|0); //@line 329 "HyMES/poly.c"
  if (!($52)) {
   break;
  }
  $53 = $14; //@line 330 "HyMES/poly.c"
  $11 = $53; //@line 330 "HyMES/poly.c"
  while(1) {
   $54 = $11; //@line 330 "HyMES/poly.c"
   $55 = ($54|0)>=(0); //@line 330 "HyMES/poly.c"
   if (!($55)) {
    break;
   }
   $56 = $12; //@line 331 "HyMES/poly.c"
   $57 = $11; //@line 331 "HyMES/poly.c"
   $58 = (($56) + ($57))|0; //@line 331 "HyMES/poly.c"
   $59 = $17; //@line 331 "HyMES/poly.c"
   $60 = ((($59)) + 8|0); //@line 331 "HyMES/poly.c"
   $61 = HEAP32[$60>>2]|0; //@line 331 "HyMES/poly.c"
   $62 = (($61) + ($58<<1)|0); //@line 331 "HyMES/poly.c"
   $63 = HEAP16[$62>>1]|0; //@line 331 "HyMES/poly.c"
   $64 = $63&65535; //@line 331 "HyMES/poly.c"
   $65 = ($64|0)!=(0); //@line 331 "HyMES/poly.c"
   if ($65) {
    $66 = $12; //@line 331 "HyMES/poly.c"
    $67 = $11; //@line 331 "HyMES/poly.c"
    $68 = (($66) + ($67))|0; //@line 331 "HyMES/poly.c"
    $69 = $17; //@line 331 "HyMES/poly.c"
    $70 = ((($69)) + 8|0); //@line 331 "HyMES/poly.c"
    $71 = HEAP32[$70>>2]|0; //@line 331 "HyMES/poly.c"
    $72 = (($71) + ($68<<1)|0); //@line 331 "HyMES/poly.c"
    $73 = HEAP16[$72>>1]|0; //@line 331 "HyMES/poly.c"
    $74 = $73&65535; //@line 331 "HyMES/poly.c"
    $75 = HEAP32[2860]|0; //@line 331 "HyMES/poly.c"
    $76 = (($75) + ($74<<1)|0); //@line 331 "HyMES/poly.c"
    $77 = HEAP16[$76>>1]|0; //@line 331 "HyMES/poly.c"
    $78 = $77&65535; //@line 331 "HyMES/poly.c"
    $79 = $12; //@line 331 "HyMES/poly.c"
    $80 = $18; //@line 331 "HyMES/poly.c"
    $81 = ((($80)) + 8|0); //@line 331 "HyMES/poly.c"
    $82 = HEAP32[$81>>2]|0; //@line 331 "HyMES/poly.c"
    $83 = (($82) + ($79<<1)|0); //@line 331 "HyMES/poly.c"
    $84 = HEAP16[$83>>1]|0; //@line 331 "HyMES/poly.c"
    $85 = $84&65535; //@line 331 "HyMES/poly.c"
    $86 = HEAP32[2860]|0; //@line 331 "HyMES/poly.c"
    $87 = (($86) + ($85<<1)|0); //@line 331 "HyMES/poly.c"
    $88 = HEAP16[$87>>1]|0; //@line 331 "HyMES/poly.c"
    $89 = $88&65535; //@line 331 "HyMES/poly.c"
    $90 = (($78) - ($89))|0; //@line 331 "HyMES/poly.c"
    $91 = HEAP32[2861]|0; //@line 331 "HyMES/poly.c"
    $92 = $90 & $91; //@line 331 "HyMES/poly.c"
    $93 = $12; //@line 331 "HyMES/poly.c"
    $94 = $11; //@line 331 "HyMES/poly.c"
    $95 = (($93) + ($94))|0; //@line 331 "HyMES/poly.c"
    $96 = $17; //@line 331 "HyMES/poly.c"
    $97 = ((($96)) + 8|0); //@line 331 "HyMES/poly.c"
    $98 = HEAP32[$97>>2]|0; //@line 331 "HyMES/poly.c"
    $99 = (($98) + ($95<<1)|0); //@line 331 "HyMES/poly.c"
    $100 = HEAP16[$99>>1]|0; //@line 331 "HyMES/poly.c"
    $101 = $100&65535; //@line 331 "HyMES/poly.c"
    $102 = HEAP32[2860]|0; //@line 331 "HyMES/poly.c"
    $103 = (($102) + ($101<<1)|0); //@line 331 "HyMES/poly.c"
    $104 = HEAP16[$103>>1]|0; //@line 331 "HyMES/poly.c"
    $105 = $104&65535; //@line 331 "HyMES/poly.c"
    $106 = $12; //@line 331 "HyMES/poly.c"
    $107 = $18; //@line 331 "HyMES/poly.c"
    $108 = ((($107)) + 8|0); //@line 331 "HyMES/poly.c"
    $109 = HEAP32[$108>>2]|0; //@line 331 "HyMES/poly.c"
    $110 = (($109) + ($106<<1)|0); //@line 331 "HyMES/poly.c"
    $111 = HEAP16[$110>>1]|0; //@line 331 "HyMES/poly.c"
    $112 = $111&65535; //@line 331 "HyMES/poly.c"
    $113 = HEAP32[2860]|0; //@line 331 "HyMES/poly.c"
    $114 = (($113) + ($112<<1)|0); //@line 331 "HyMES/poly.c"
    $115 = HEAP16[$114>>1]|0; //@line 331 "HyMES/poly.c"
    $116 = $115&65535; //@line 331 "HyMES/poly.c"
    $117 = (($105) - ($116))|0; //@line 331 "HyMES/poly.c"
    $118 = HEAP32[2862]|0; //@line 331 "HyMES/poly.c"
    $119 = $117 >> $118; //@line 331 "HyMES/poly.c"
    $120 = (($92) + ($119))|0; //@line 331 "HyMES/poly.c"
    $121 = HEAP32[2863]|0; //@line 331 "HyMES/poly.c"
    $122 = (($121) + ($120<<1)|0); //@line 331 "HyMES/poly.c"
    $123 = HEAP16[$122>>1]|0; //@line 331 "HyMES/poly.c"
    $124 = $123&65535; //@line 331 "HyMES/poly.c"
    $126 = $124;
   } else {
    $126 = 0;
   }
   $125 = $126&65535; //@line 331 "HyMES/poly.c"
   $15 = $125; //@line 331 "HyMES/poly.c"
   $127 = $15; //@line 332 "HyMES/poly.c"
   $128 = $127&65535; //@line 332 "HyMES/poly.c"
   $129 = ($128|0)!=(0); //@line 332 "HyMES/poly.c"
   L10: do {
    if ($129) {
     $10 = 0; //@line 334 "HyMES/poly.c"
     while(1) {
      $130 = $10; //@line 334 "HyMES/poly.c"
      $131 = $13; //@line 334 "HyMES/poly.c"
      $132 = ($130|0)<=($131|0); //@line 334 "HyMES/poly.c"
      if (!($132)) {
       break;
      }
      $133 = $10; //@line 335 "HyMES/poly.c"
      $134 = $11; //@line 335 "HyMES/poly.c"
      $135 = (($133) + ($134))|0; //@line 335 "HyMES/poly.c"
      $136 = $19; //@line 335 "HyMES/poly.c"
      $137 = ((($136)) + 8|0); //@line 335 "HyMES/poly.c"
      $138 = HEAP32[$137>>2]|0; //@line 335 "HyMES/poly.c"
      $139 = (($138) + ($135<<1)|0); //@line 335 "HyMES/poly.c"
      $140 = HEAP16[$139>>1]|0; //@line 335 "HyMES/poly.c"
      $141 = $140&65535; //@line 335 "HyMES/poly.c"
      $142 = $10; //@line 335 "HyMES/poly.c"
      $143 = $20; //@line 335 "HyMES/poly.c"
      $144 = ((($143)) + 8|0); //@line 335 "HyMES/poly.c"
      $145 = HEAP32[$144>>2]|0; //@line 335 "HyMES/poly.c"
      $146 = (($145) + ($142<<1)|0); //@line 335 "HyMES/poly.c"
      $147 = HEAP16[$146>>1]|0; //@line 335 "HyMES/poly.c"
      $148 = $147&65535; //@line 335 "HyMES/poly.c"
      $149 = ($148|0)!=(0); //@line 335 "HyMES/poly.c"
      if ($149) {
       $150 = $15; //@line 335 "HyMES/poly.c"
       $151 = $150&65535; //@line 335 "HyMES/poly.c"
       $152 = HEAP32[2860]|0; //@line 335 "HyMES/poly.c"
       $153 = (($152) + ($151<<1)|0); //@line 335 "HyMES/poly.c"
       $154 = HEAP16[$153>>1]|0; //@line 335 "HyMES/poly.c"
       $155 = $154&65535; //@line 335 "HyMES/poly.c"
       $156 = $10; //@line 335 "HyMES/poly.c"
       $157 = $20; //@line 335 "HyMES/poly.c"
       $158 = ((($157)) + 8|0); //@line 335 "HyMES/poly.c"
       $159 = HEAP32[$158>>2]|0; //@line 335 "HyMES/poly.c"
       $160 = (($159) + ($156<<1)|0); //@line 335 "HyMES/poly.c"
       $161 = HEAP16[$160>>1]|0; //@line 335 "HyMES/poly.c"
       $162 = $161&65535; //@line 335 "HyMES/poly.c"
       $163 = HEAP32[2860]|0; //@line 335 "HyMES/poly.c"
       $164 = (($163) + ($162<<1)|0); //@line 335 "HyMES/poly.c"
       $165 = HEAP16[$164>>1]|0; //@line 335 "HyMES/poly.c"
       $166 = $165&65535; //@line 335 "HyMES/poly.c"
       $167 = (($155) + ($166))|0; //@line 335 "HyMES/poly.c"
       $168 = HEAP32[2861]|0; //@line 335 "HyMES/poly.c"
       $169 = $167 & $168; //@line 335 "HyMES/poly.c"
       $170 = $15; //@line 335 "HyMES/poly.c"
       $171 = $170&65535; //@line 335 "HyMES/poly.c"
       $172 = HEAP32[2860]|0; //@line 335 "HyMES/poly.c"
       $173 = (($172) + ($171<<1)|0); //@line 335 "HyMES/poly.c"
       $174 = HEAP16[$173>>1]|0; //@line 335 "HyMES/poly.c"
       $175 = $174&65535; //@line 335 "HyMES/poly.c"
       $176 = $10; //@line 335 "HyMES/poly.c"
       $177 = $20; //@line 335 "HyMES/poly.c"
       $178 = ((($177)) + 8|0); //@line 335 "HyMES/poly.c"
       $179 = HEAP32[$178>>2]|0; //@line 335 "HyMES/poly.c"
       $180 = (($179) + ($176<<1)|0); //@line 335 "HyMES/poly.c"
       $181 = HEAP16[$180>>1]|0; //@line 335 "HyMES/poly.c"
       $182 = $181&65535; //@line 335 "HyMES/poly.c"
       $183 = HEAP32[2860]|0; //@line 335 "HyMES/poly.c"
       $184 = (($183) + ($182<<1)|0); //@line 335 "HyMES/poly.c"
       $185 = HEAP16[$184>>1]|0; //@line 335 "HyMES/poly.c"
       $186 = $185&65535; //@line 335 "HyMES/poly.c"
       $187 = (($175) + ($186))|0; //@line 335 "HyMES/poly.c"
       $188 = HEAP32[2862]|0; //@line 335 "HyMES/poly.c"
       $189 = $187 >> $188; //@line 335 "HyMES/poly.c"
       $190 = (($169) + ($189))|0; //@line 335 "HyMES/poly.c"
       $191 = HEAP32[2863]|0; //@line 335 "HyMES/poly.c"
       $192 = (($191) + ($190<<1)|0); //@line 335 "HyMES/poly.c"
       $193 = HEAP16[$192>>1]|0; //@line 335 "HyMES/poly.c"
       $194 = $193&65535; //@line 335 "HyMES/poly.c"
       $196 = $194;
      } else {
       $196 = 0;
      }
      $195 = $141 ^ $196; //@line 335 "HyMES/poly.c"
      $197 = $195&65535; //@line 335 "HyMES/poly.c"
      $198 = $10; //@line 335 "HyMES/poly.c"
      $199 = $11; //@line 335 "HyMES/poly.c"
      $200 = (($198) + ($199))|0; //@line 335 "HyMES/poly.c"
      $201 = $19; //@line 335 "HyMES/poly.c"
      $202 = ((($201)) + 8|0); //@line 335 "HyMES/poly.c"
      $203 = HEAP32[$202>>2]|0; //@line 335 "HyMES/poly.c"
      $204 = (($203) + ($200<<1)|0); //@line 335 "HyMES/poly.c"
      HEAP16[$204>>1] = $197; //@line 335 "HyMES/poly.c"
      $205 = $10; //@line 334 "HyMES/poly.c"
      $206 = (($205) + 1)|0; //@line 334 "HyMES/poly.c"
      $10 = $206; //@line 334 "HyMES/poly.c"
     }
     $10 = 0; //@line 338 "HyMES/poly.c"
     while(1) {
      $207 = $10; //@line 338 "HyMES/poly.c"
      $208 = $12; //@line 338 "HyMES/poly.c"
      $209 = ($207|0)<=($208|0); //@line 338 "HyMES/poly.c"
      if (!($209)) {
       break L10;
      }
      $210 = $10; //@line 339 "HyMES/poly.c"
      $211 = $11; //@line 339 "HyMES/poly.c"
      $212 = (($210) + ($211))|0; //@line 339 "HyMES/poly.c"
      $213 = $17; //@line 339 "HyMES/poly.c"
      $214 = ((($213)) + 8|0); //@line 339 "HyMES/poly.c"
      $215 = HEAP32[$214>>2]|0; //@line 339 "HyMES/poly.c"
      $216 = (($215) + ($212<<1)|0); //@line 339 "HyMES/poly.c"
      $217 = HEAP16[$216>>1]|0; //@line 339 "HyMES/poly.c"
      $218 = $217&65535; //@line 339 "HyMES/poly.c"
      $219 = $10; //@line 339 "HyMES/poly.c"
      $220 = $18; //@line 339 "HyMES/poly.c"
      $221 = ((($220)) + 8|0); //@line 339 "HyMES/poly.c"
      $222 = HEAP32[$221>>2]|0; //@line 339 "HyMES/poly.c"
      $223 = (($222) + ($219<<1)|0); //@line 339 "HyMES/poly.c"
      $224 = HEAP16[$223>>1]|0; //@line 339 "HyMES/poly.c"
      $225 = $224&65535; //@line 339 "HyMES/poly.c"
      $226 = ($225|0)!=(0); //@line 339 "HyMES/poly.c"
      if ($226) {
       $227 = $15; //@line 339 "HyMES/poly.c"
       $228 = $227&65535; //@line 339 "HyMES/poly.c"
       $229 = HEAP32[2860]|0; //@line 339 "HyMES/poly.c"
       $230 = (($229) + ($228<<1)|0); //@line 339 "HyMES/poly.c"
       $231 = HEAP16[$230>>1]|0; //@line 339 "HyMES/poly.c"
       $232 = $231&65535; //@line 339 "HyMES/poly.c"
       $233 = $10; //@line 339 "HyMES/poly.c"
       $234 = $18; //@line 339 "HyMES/poly.c"
       $235 = ((($234)) + 8|0); //@line 339 "HyMES/poly.c"
       $236 = HEAP32[$235>>2]|0; //@line 339 "HyMES/poly.c"
       $237 = (($236) + ($233<<1)|0); //@line 339 "HyMES/poly.c"
       $238 = HEAP16[$237>>1]|0; //@line 339 "HyMES/poly.c"
       $239 = $238&65535; //@line 339 "HyMES/poly.c"
       $240 = HEAP32[2860]|0; //@line 339 "HyMES/poly.c"
       $241 = (($240) + ($239<<1)|0); //@line 339 "HyMES/poly.c"
       $242 = HEAP16[$241>>1]|0; //@line 339 "HyMES/poly.c"
       $243 = $242&65535; //@line 339 "HyMES/poly.c"
       $244 = (($232) + ($243))|0; //@line 339 "HyMES/poly.c"
       $245 = HEAP32[2861]|0; //@line 339 "HyMES/poly.c"
       $246 = $244 & $245; //@line 339 "HyMES/poly.c"
       $247 = $15; //@line 339 "HyMES/poly.c"
       $248 = $247&65535; //@line 339 "HyMES/poly.c"
       $249 = HEAP32[2860]|0; //@line 339 "HyMES/poly.c"
       $250 = (($249) + ($248<<1)|0); //@line 339 "HyMES/poly.c"
       $251 = HEAP16[$250>>1]|0; //@line 339 "HyMES/poly.c"
       $252 = $251&65535; //@line 339 "HyMES/poly.c"
       $253 = $10; //@line 339 "HyMES/poly.c"
       $254 = $18; //@line 339 "HyMES/poly.c"
       $255 = ((($254)) + 8|0); //@line 339 "HyMES/poly.c"
       $256 = HEAP32[$255>>2]|0; //@line 339 "HyMES/poly.c"
       $257 = (($256) + ($253<<1)|0); //@line 339 "HyMES/poly.c"
       $258 = HEAP16[$257>>1]|0; //@line 339 "HyMES/poly.c"
       $259 = $258&65535; //@line 339 "HyMES/poly.c"
       $260 = HEAP32[2860]|0; //@line 339 "HyMES/poly.c"
       $261 = (($260) + ($259<<1)|0); //@line 339 "HyMES/poly.c"
       $262 = HEAP16[$261>>1]|0; //@line 339 "HyMES/poly.c"
       $263 = $262&65535; //@line 339 "HyMES/poly.c"
       $264 = (($252) + ($263))|0; //@line 339 "HyMES/poly.c"
       $265 = HEAP32[2862]|0; //@line 339 "HyMES/poly.c"
       $266 = $264 >> $265; //@line 339 "HyMES/poly.c"
       $267 = (($246) + ($266))|0; //@line 339 "HyMES/poly.c"
       $268 = HEAP32[2863]|0; //@line 339 "HyMES/poly.c"
       $269 = (($268) + ($267<<1)|0); //@line 339 "HyMES/poly.c"
       $270 = HEAP16[$269>>1]|0; //@line 339 "HyMES/poly.c"
       $271 = $270&65535; //@line 339 "HyMES/poly.c"
       $273 = $271;
      } else {
       $273 = 0;
      }
      $272 = $218 ^ $273; //@line 339 "HyMES/poly.c"
      $274 = $272&65535; //@line 339 "HyMES/poly.c"
      $275 = $10; //@line 339 "HyMES/poly.c"
      $276 = $11; //@line 339 "HyMES/poly.c"
      $277 = (($275) + ($276))|0; //@line 339 "HyMES/poly.c"
      $278 = $17; //@line 339 "HyMES/poly.c"
      $279 = ((($278)) + 8|0); //@line 339 "HyMES/poly.c"
      $280 = HEAP32[$279>>2]|0; //@line 339 "HyMES/poly.c"
      $281 = (($280) + ($277<<1)|0); //@line 339 "HyMES/poly.c"
      HEAP16[$281>>1] = $274; //@line 339 "HyMES/poly.c"
      $282 = $10; //@line 338 "HyMES/poly.c"
      $283 = (($282) + 1)|0; //@line 338 "HyMES/poly.c"
      $10 = $283; //@line 338 "HyMES/poly.c"
     }
    }
   } while(0);
   $284 = $11; //@line 330 "HyMES/poly.c"
   $285 = (($284) + -1)|0; //@line 330 "HyMES/poly.c"
   $11 = $285; //@line 330 "HyMES/poly.c"
  }
  $286 = $17; //@line 343 "HyMES/poly.c"
  $16 = $286; //@line 343 "HyMES/poly.c"
  $287 = $18; //@line 343 "HyMES/poly.c"
  $17 = $287; //@line 343 "HyMES/poly.c"
  $288 = $16; //@line 343 "HyMES/poly.c"
  $18 = $288; //@line 343 "HyMES/poly.c"
  $289 = $19; //@line 344 "HyMES/poly.c"
  $16 = $289; //@line 344 "HyMES/poly.c"
  $290 = $20; //@line 344 "HyMES/poly.c"
  $19 = $290; //@line 344 "HyMES/poly.c"
  $291 = $16; //@line 344 "HyMES/poly.c"
  $20 = $291; //@line 344 "HyMES/poly.c"
  $292 = $13; //@line 346 "HyMES/poly.c"
  $293 = $14; //@line 346 "HyMES/poly.c"
  $294 = (($292) + ($293))|0; //@line 346 "HyMES/poly.c"
  $13 = $294; //@line 346 "HyMES/poly.c"
  $14 = 1; //@line 347 "HyMES/poly.c"
  while(1) {
   $295 = $12; //@line 348 "HyMES/poly.c"
   $296 = $14; //@line 348 "HyMES/poly.c"
   $297 = (($295) - ($296))|0; //@line 348 "HyMES/poly.c"
   $298 = $18; //@line 348 "HyMES/poly.c"
   $299 = ((($298)) + 8|0); //@line 348 "HyMES/poly.c"
   $300 = HEAP32[$299>>2]|0; //@line 348 "HyMES/poly.c"
   $301 = (($300) + ($297<<1)|0); //@line 348 "HyMES/poly.c"
   $302 = HEAP16[$301>>1]|0; //@line 348 "HyMES/poly.c"
   $303 = $302&65535; //@line 348 "HyMES/poly.c"
   $304 = ($303|0)==(0); //@line 348 "HyMES/poly.c"
   $305 = $14; //@line 349 "HyMES/poly.c"
   if (!($304)) {
    break;
   }
   $306 = (($305) + 1)|0; //@line 349 "HyMES/poly.c"
   $14 = $306; //@line 349 "HyMES/poly.c"
  }
  $307 = $12; //@line 350 "HyMES/poly.c"
  $308 = (($307) - ($305))|0; //@line 350 "HyMES/poly.c"
  $12 = $308; //@line 350 "HyMES/poly.c"
 }
 $309 = $13; //@line 353 "HyMES/poly.c"
 $310 = $20; //@line 353 "HyMES/poly.c"
 HEAP32[$310>>2] = $309; //@line 353 "HyMES/poly.c"
 $311 = $12; //@line 354 "HyMES/poly.c"
 $312 = $18; //@line 354 "HyMES/poly.c"
 HEAP32[$312>>2] = $311; //@line 354 "HyMES/poly.c"
 $313 = $20; //@line 356 "HyMES/poly.c"
 $314 = $5; //@line 356 "HyMES/poly.c"
 HEAP32[$314>>2] = $313; //@line 356 "HyMES/poly.c"
 $315 = $18; //@line 357 "HyMES/poly.c"
 $316 = $6; //@line 357 "HyMES/poly.c"
 HEAP32[$316>>2] = $315; //@line 357 "HyMES/poly.c"
 $317 = $17; //@line 359 "HyMES/poly.c"
 _poly_free($317); //@line 359 "HyMES/poly.c"
 $318 = $19; //@line 360 "HyMES/poly.c"
 _poly_free($318); //@line 360 "HyMES/poly.c"
 STACKTOP = sp;return; //@line 361 "HyMES/poly.c"
}
function _poly_randgen_irred($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $6 = $2; //@line 369 "HyMES/poly.c"
 $7 = (_poly_alloc($6)|0); //@line 369 "HyMES/poly.c"
 $5 = $7; //@line 369 "HyMES/poly.c"
 $8 = $2; //@line 370 "HyMES/poly.c"
 $9 = $5; //@line 370 "HyMES/poly.c"
 HEAP32[$9>>2] = $8; //@line 370 "HyMES/poly.c"
 $10 = $2; //@line 371 "HyMES/poly.c"
 $11 = $5; //@line 371 "HyMES/poly.c"
 $12 = ((($11)) + 8|0); //@line 371 "HyMES/poly.c"
 $13 = HEAP32[$12>>2]|0; //@line 371 "HyMES/poly.c"
 $14 = (($13) + ($10<<1)|0); //@line 371 "HyMES/poly.c"
 HEAP16[$14>>1] = 1; //@line 371 "HyMES/poly.c"
 $4 = 0; //@line 373 "HyMES/poly.c"
 while(1) {
  $4 = 0; //@line 375 "HyMES/poly.c"
  while(1) {
   $15 = $4; //@line 375 "HyMES/poly.c"
   $16 = $2; //@line 375 "HyMES/poly.c"
   $17 = ($15|0)<($16|0); //@line 375 "HyMES/poly.c"
   if (!($17)) {
    break;
   }
   $18 = $3; //@line 376 "HyMES/poly.c"
   $19 = (_gf_rand($18)|0); //@line 376 "HyMES/poly.c"
   $20 = $4; //@line 376 "HyMES/poly.c"
   $21 = $5; //@line 376 "HyMES/poly.c"
   $22 = ((($21)) + 8|0); //@line 376 "HyMES/poly.c"
   $23 = HEAP32[$22>>2]|0; //@line 376 "HyMES/poly.c"
   $24 = (($23) + ($20<<1)|0); //@line 376 "HyMES/poly.c"
   HEAP16[$24>>1] = $19; //@line 376 "HyMES/poly.c"
   $25 = $4; //@line 375 "HyMES/poly.c"
   $26 = (($25) + 1)|0; //@line 375 "HyMES/poly.c"
   $4 = $26; //@line 375 "HyMES/poly.c"
  }
  $27 = $5; //@line 377 "HyMES/poly.c"
  $28 = (_poly_degppf($27)|0); //@line 377 "HyMES/poly.c"
  $29 = $2; //@line 377 "HyMES/poly.c"
  $30 = ($28|0)<($29|0); //@line 377 "HyMES/poly.c"
  if (!($30)) {
   break;
  }
 }
 $31 = $5; //@line 379 "HyMES/poly.c"
 STACKTOP = sp;return ($31|0); //@line 379 "HyMES/poly.c"
}
function _poly_shiftmod($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0;
 var $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0;
 var $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0;
 var $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0;
 var $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0;
 var $208 = 0, $209 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0;
 var $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0;
 var $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0;
 var $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0;
 var $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $2 = $0;
 $3 = $1;
 $7 = $3; //@line 389 "HyMES/poly.c"
 $8 = HEAP32[$7>>2]|0; //@line 389 "HyMES/poly.c"
 $5 = $8; //@line 389 "HyMES/poly.c"
 $9 = $5; //@line 390 "HyMES/poly.c"
 $10 = (($9) - 1)|0; //@line 390 "HyMES/poly.c"
 $11 = $2; //@line 390 "HyMES/poly.c"
 $12 = ((($11)) + 8|0); //@line 390 "HyMES/poly.c"
 $13 = HEAP32[$12>>2]|0; //@line 390 "HyMES/poly.c"
 $14 = (($13) + ($10<<1)|0); //@line 390 "HyMES/poly.c"
 $15 = HEAP16[$14>>1]|0; //@line 390 "HyMES/poly.c"
 $16 = $15&65535; //@line 390 "HyMES/poly.c"
 $17 = ($16|0)!=(0); //@line 390 "HyMES/poly.c"
 if ($17) {
  $18 = $5; //@line 390 "HyMES/poly.c"
  $19 = (($18) - 1)|0; //@line 390 "HyMES/poly.c"
  $20 = $2; //@line 390 "HyMES/poly.c"
  $21 = ((($20)) + 8|0); //@line 390 "HyMES/poly.c"
  $22 = HEAP32[$21>>2]|0; //@line 390 "HyMES/poly.c"
  $23 = (($22) + ($19<<1)|0); //@line 390 "HyMES/poly.c"
  $24 = HEAP16[$23>>1]|0; //@line 390 "HyMES/poly.c"
  $25 = $24&65535; //@line 390 "HyMES/poly.c"
  $26 = HEAP32[2860]|0; //@line 390 "HyMES/poly.c"
  $27 = (($26) + ($25<<1)|0); //@line 390 "HyMES/poly.c"
  $28 = HEAP16[$27>>1]|0; //@line 390 "HyMES/poly.c"
  $29 = $28&65535; //@line 390 "HyMES/poly.c"
  $30 = $5; //@line 390 "HyMES/poly.c"
  $31 = $3; //@line 390 "HyMES/poly.c"
  $32 = ((($31)) + 8|0); //@line 390 "HyMES/poly.c"
  $33 = HEAP32[$32>>2]|0; //@line 390 "HyMES/poly.c"
  $34 = (($33) + ($30<<1)|0); //@line 390 "HyMES/poly.c"
  $35 = HEAP16[$34>>1]|0; //@line 390 "HyMES/poly.c"
  $36 = $35&65535; //@line 390 "HyMES/poly.c"
  $37 = HEAP32[2860]|0; //@line 390 "HyMES/poly.c"
  $38 = (($37) + ($36<<1)|0); //@line 390 "HyMES/poly.c"
  $39 = HEAP16[$38>>1]|0; //@line 390 "HyMES/poly.c"
  $40 = $39&65535; //@line 390 "HyMES/poly.c"
  $41 = (($29) - ($40))|0; //@line 390 "HyMES/poly.c"
  $42 = HEAP32[2861]|0; //@line 390 "HyMES/poly.c"
  $43 = $41 & $42; //@line 390 "HyMES/poly.c"
  $44 = $5; //@line 390 "HyMES/poly.c"
  $45 = (($44) - 1)|0; //@line 390 "HyMES/poly.c"
  $46 = $2; //@line 390 "HyMES/poly.c"
  $47 = ((($46)) + 8|0); //@line 390 "HyMES/poly.c"
  $48 = HEAP32[$47>>2]|0; //@line 390 "HyMES/poly.c"
  $49 = (($48) + ($45<<1)|0); //@line 390 "HyMES/poly.c"
  $50 = HEAP16[$49>>1]|0; //@line 390 "HyMES/poly.c"
  $51 = $50&65535; //@line 390 "HyMES/poly.c"
  $52 = HEAP32[2860]|0; //@line 390 "HyMES/poly.c"
  $53 = (($52) + ($51<<1)|0); //@line 390 "HyMES/poly.c"
  $54 = HEAP16[$53>>1]|0; //@line 390 "HyMES/poly.c"
  $55 = $54&65535; //@line 390 "HyMES/poly.c"
  $56 = $5; //@line 390 "HyMES/poly.c"
  $57 = $3; //@line 390 "HyMES/poly.c"
  $58 = ((($57)) + 8|0); //@line 390 "HyMES/poly.c"
  $59 = HEAP32[$58>>2]|0; //@line 390 "HyMES/poly.c"
  $60 = (($59) + ($56<<1)|0); //@line 390 "HyMES/poly.c"
  $61 = HEAP16[$60>>1]|0; //@line 390 "HyMES/poly.c"
  $62 = $61&65535; //@line 390 "HyMES/poly.c"
  $63 = HEAP32[2860]|0; //@line 390 "HyMES/poly.c"
  $64 = (($63) + ($62<<1)|0); //@line 390 "HyMES/poly.c"
  $65 = HEAP16[$64>>1]|0; //@line 390 "HyMES/poly.c"
  $66 = $65&65535; //@line 390 "HyMES/poly.c"
  $67 = (($55) - ($66))|0; //@line 390 "HyMES/poly.c"
  $68 = HEAP32[2862]|0; //@line 390 "HyMES/poly.c"
  $69 = $67 >> $68; //@line 390 "HyMES/poly.c"
  $70 = (($43) + ($69))|0; //@line 390 "HyMES/poly.c"
  $71 = HEAP32[2863]|0; //@line 390 "HyMES/poly.c"
  $72 = (($71) + ($70<<1)|0); //@line 390 "HyMES/poly.c"
  $73 = HEAP16[$72>>1]|0; //@line 390 "HyMES/poly.c"
  $74 = $73&65535; //@line 390 "HyMES/poly.c"
  $76 = $74;
 } else {
  $76 = 0;
 }
 $75 = $76&65535; //@line 390 "HyMES/poly.c"
 $6 = $75; //@line 390 "HyMES/poly.c"
 $77 = $5; //@line 391 "HyMES/poly.c"
 $78 = (($77) - 1)|0; //@line 391 "HyMES/poly.c"
 $4 = $78; //@line 391 "HyMES/poly.c"
 while(1) {
  $79 = $4; //@line 391 "HyMES/poly.c"
  $80 = ($79|0)>(0); //@line 391 "HyMES/poly.c"
  if (!($80)) {
   break;
  }
  $81 = $4; //@line 392 "HyMES/poly.c"
  $82 = (($81) - 1)|0; //@line 392 "HyMES/poly.c"
  $83 = $2; //@line 392 "HyMES/poly.c"
  $84 = ((($83)) + 8|0); //@line 392 "HyMES/poly.c"
  $85 = HEAP32[$84>>2]|0; //@line 392 "HyMES/poly.c"
  $86 = (($85) + ($82<<1)|0); //@line 392 "HyMES/poly.c"
  $87 = HEAP16[$86>>1]|0; //@line 392 "HyMES/poly.c"
  $88 = $87&65535; //@line 392 "HyMES/poly.c"
  $89 = $6; //@line 392 "HyMES/poly.c"
  $90 = $89&65535; //@line 392 "HyMES/poly.c"
  $91 = ($90|0)!=(0); //@line 392 "HyMES/poly.c"
  if ($91) {
   $92 = $4; //@line 392 "HyMES/poly.c"
   $93 = $3; //@line 392 "HyMES/poly.c"
   $94 = ((($93)) + 8|0); //@line 392 "HyMES/poly.c"
   $95 = HEAP32[$94>>2]|0; //@line 392 "HyMES/poly.c"
   $96 = (($95) + ($92<<1)|0); //@line 392 "HyMES/poly.c"
   $97 = HEAP16[$96>>1]|0; //@line 392 "HyMES/poly.c"
   $98 = $97&65535; //@line 392 "HyMES/poly.c"
   $99 = ($98|0)!=(0); //@line 392 "HyMES/poly.c"
   if ($99) {
    $100 = $6; //@line 392 "HyMES/poly.c"
    $101 = $100&65535; //@line 392 "HyMES/poly.c"
    $102 = HEAP32[2860]|0; //@line 392 "HyMES/poly.c"
    $103 = (($102) + ($101<<1)|0); //@line 392 "HyMES/poly.c"
    $104 = HEAP16[$103>>1]|0; //@line 392 "HyMES/poly.c"
    $105 = $104&65535; //@line 392 "HyMES/poly.c"
    $106 = $4; //@line 392 "HyMES/poly.c"
    $107 = $3; //@line 392 "HyMES/poly.c"
    $108 = ((($107)) + 8|0); //@line 392 "HyMES/poly.c"
    $109 = HEAP32[$108>>2]|0; //@line 392 "HyMES/poly.c"
    $110 = (($109) + ($106<<1)|0); //@line 392 "HyMES/poly.c"
    $111 = HEAP16[$110>>1]|0; //@line 392 "HyMES/poly.c"
    $112 = $111&65535; //@line 392 "HyMES/poly.c"
    $113 = HEAP32[2860]|0; //@line 392 "HyMES/poly.c"
    $114 = (($113) + ($112<<1)|0); //@line 392 "HyMES/poly.c"
    $115 = HEAP16[$114>>1]|0; //@line 392 "HyMES/poly.c"
    $116 = $115&65535; //@line 392 "HyMES/poly.c"
    $117 = (($105) + ($116))|0; //@line 392 "HyMES/poly.c"
    $118 = HEAP32[2861]|0; //@line 392 "HyMES/poly.c"
    $119 = $117 & $118; //@line 392 "HyMES/poly.c"
    $120 = $6; //@line 392 "HyMES/poly.c"
    $121 = $120&65535; //@line 392 "HyMES/poly.c"
    $122 = HEAP32[2860]|0; //@line 392 "HyMES/poly.c"
    $123 = (($122) + ($121<<1)|0); //@line 392 "HyMES/poly.c"
    $124 = HEAP16[$123>>1]|0; //@line 392 "HyMES/poly.c"
    $125 = $124&65535; //@line 392 "HyMES/poly.c"
    $126 = $4; //@line 392 "HyMES/poly.c"
    $127 = $3; //@line 392 "HyMES/poly.c"
    $128 = ((($127)) + 8|0); //@line 392 "HyMES/poly.c"
    $129 = HEAP32[$128>>2]|0; //@line 392 "HyMES/poly.c"
    $130 = (($129) + ($126<<1)|0); //@line 392 "HyMES/poly.c"
    $131 = HEAP16[$130>>1]|0; //@line 392 "HyMES/poly.c"
    $132 = $131&65535; //@line 392 "HyMES/poly.c"
    $133 = HEAP32[2860]|0; //@line 392 "HyMES/poly.c"
    $134 = (($133) + ($132<<1)|0); //@line 392 "HyMES/poly.c"
    $135 = HEAP16[$134>>1]|0; //@line 392 "HyMES/poly.c"
    $136 = $135&65535; //@line 392 "HyMES/poly.c"
    $137 = (($125) + ($136))|0; //@line 392 "HyMES/poly.c"
    $138 = HEAP32[2862]|0; //@line 392 "HyMES/poly.c"
    $139 = $137 >> $138; //@line 392 "HyMES/poly.c"
    $140 = (($119) + ($139))|0; //@line 392 "HyMES/poly.c"
    $141 = HEAP32[2863]|0; //@line 392 "HyMES/poly.c"
    $142 = (($141) + ($140<<1)|0); //@line 392 "HyMES/poly.c"
    $143 = HEAP16[$142>>1]|0; //@line 392 "HyMES/poly.c"
    $144 = $143&65535; //@line 392 "HyMES/poly.c"
    $146 = $144;
   } else {
    $146 = 0;
   }
  } else {
   $146 = 0;
  }
  $145 = $88 ^ $146; //@line 392 "HyMES/poly.c"
  $147 = $145&65535; //@line 392 "HyMES/poly.c"
  $148 = $4; //@line 392 "HyMES/poly.c"
  $149 = $2; //@line 392 "HyMES/poly.c"
  $150 = ((($149)) + 8|0); //@line 392 "HyMES/poly.c"
  $151 = HEAP32[$150>>2]|0; //@line 392 "HyMES/poly.c"
  $152 = (($151) + ($148<<1)|0); //@line 392 "HyMES/poly.c"
  HEAP16[$152>>1] = $147; //@line 392 "HyMES/poly.c"
  $153 = $4; //@line 391 "HyMES/poly.c"
  $154 = (($153) + -1)|0; //@line 391 "HyMES/poly.c"
  $4 = $154; //@line 391 "HyMES/poly.c"
 }
 $155 = $6; //@line 393 "HyMES/poly.c"
 $156 = $155&65535; //@line 393 "HyMES/poly.c"
 $157 = ($156|0)!=(0); //@line 393 "HyMES/poly.c"
 if (!($157)) {
  $206 = 0;
  $205 = $206&65535; //@line 393 "HyMES/poly.c"
  $207 = $2; //@line 393 "HyMES/poly.c"
  $208 = ((($207)) + 8|0); //@line 393 "HyMES/poly.c"
  $209 = HEAP32[$208>>2]|0; //@line 393 "HyMES/poly.c"
  HEAP16[$209>>1] = $205; //@line 393 "HyMES/poly.c"
  STACKTOP = sp;return; //@line 394 "HyMES/poly.c"
 }
 $158 = $3; //@line 393 "HyMES/poly.c"
 $159 = ((($158)) + 8|0); //@line 393 "HyMES/poly.c"
 $160 = HEAP32[$159>>2]|0; //@line 393 "HyMES/poly.c"
 $161 = HEAP16[$160>>1]|0; //@line 393 "HyMES/poly.c"
 $162 = $161&65535; //@line 393 "HyMES/poly.c"
 $163 = ($162|0)!=(0); //@line 393 "HyMES/poly.c"
 if (!($163)) {
  $206 = 0;
  $205 = $206&65535; //@line 393 "HyMES/poly.c"
  $207 = $2; //@line 393 "HyMES/poly.c"
  $208 = ((($207)) + 8|0); //@line 393 "HyMES/poly.c"
  $209 = HEAP32[$208>>2]|0; //@line 393 "HyMES/poly.c"
  HEAP16[$209>>1] = $205; //@line 393 "HyMES/poly.c"
  STACKTOP = sp;return; //@line 394 "HyMES/poly.c"
 }
 $164 = $6; //@line 393 "HyMES/poly.c"
 $165 = $164&65535; //@line 393 "HyMES/poly.c"
 $166 = HEAP32[2860]|0; //@line 393 "HyMES/poly.c"
 $167 = (($166) + ($165<<1)|0); //@line 393 "HyMES/poly.c"
 $168 = HEAP16[$167>>1]|0; //@line 393 "HyMES/poly.c"
 $169 = $168&65535; //@line 393 "HyMES/poly.c"
 $170 = $3; //@line 393 "HyMES/poly.c"
 $171 = ((($170)) + 8|0); //@line 393 "HyMES/poly.c"
 $172 = HEAP32[$171>>2]|0; //@line 393 "HyMES/poly.c"
 $173 = HEAP16[$172>>1]|0; //@line 393 "HyMES/poly.c"
 $174 = $173&65535; //@line 393 "HyMES/poly.c"
 $175 = HEAP32[2860]|0; //@line 393 "HyMES/poly.c"
 $176 = (($175) + ($174<<1)|0); //@line 393 "HyMES/poly.c"
 $177 = HEAP16[$176>>1]|0; //@line 393 "HyMES/poly.c"
 $178 = $177&65535; //@line 393 "HyMES/poly.c"
 $179 = (($169) + ($178))|0; //@line 393 "HyMES/poly.c"
 $180 = HEAP32[2861]|0; //@line 393 "HyMES/poly.c"
 $181 = $179 & $180; //@line 393 "HyMES/poly.c"
 $182 = $6; //@line 393 "HyMES/poly.c"
 $183 = $182&65535; //@line 393 "HyMES/poly.c"
 $184 = HEAP32[2860]|0; //@line 393 "HyMES/poly.c"
 $185 = (($184) + ($183<<1)|0); //@line 393 "HyMES/poly.c"
 $186 = HEAP16[$185>>1]|0; //@line 393 "HyMES/poly.c"
 $187 = $186&65535; //@line 393 "HyMES/poly.c"
 $188 = $3; //@line 393 "HyMES/poly.c"
 $189 = ((($188)) + 8|0); //@line 393 "HyMES/poly.c"
 $190 = HEAP32[$189>>2]|0; //@line 393 "HyMES/poly.c"
 $191 = HEAP16[$190>>1]|0; //@line 393 "HyMES/poly.c"
 $192 = $191&65535; //@line 393 "HyMES/poly.c"
 $193 = HEAP32[2860]|0; //@line 393 "HyMES/poly.c"
 $194 = (($193) + ($192<<1)|0); //@line 393 "HyMES/poly.c"
 $195 = HEAP16[$194>>1]|0; //@line 393 "HyMES/poly.c"
 $196 = $195&65535; //@line 393 "HyMES/poly.c"
 $197 = (($187) + ($196))|0; //@line 393 "HyMES/poly.c"
 $198 = HEAP32[2862]|0; //@line 393 "HyMES/poly.c"
 $199 = $197 >> $198; //@line 393 "HyMES/poly.c"
 $200 = (($181) + ($199))|0; //@line 393 "HyMES/poly.c"
 $201 = HEAP32[2863]|0; //@line 393 "HyMES/poly.c"
 $202 = (($201) + ($200<<1)|0); //@line 393 "HyMES/poly.c"
 $203 = HEAP16[$202>>1]|0; //@line 393 "HyMES/poly.c"
 $204 = $203&65535; //@line 393 "HyMES/poly.c"
 $206 = $204;
 $205 = $206&65535; //@line 393 "HyMES/poly.c"
 $207 = $2; //@line 393 "HyMES/poly.c"
 $208 = ((($207)) + 8|0); //@line 393 "HyMES/poly.c"
 $209 = HEAP32[$208>>2]|0; //@line 393 "HyMES/poly.c"
 HEAP16[$209>>1] = $205; //@line 393 "HyMES/poly.c"
 STACKTOP = sp;return; //@line 394 "HyMES/poly.c"
}
function _poly_sqrtmod_init($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0;
 var $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $14 = 0;
 var $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0;
 var $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0;
 var $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0;
 var $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0;
 var $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $1 = $0;
 $9 = $1; //@line 400 "HyMES/poly.c"
 $10 = HEAP32[$9>>2]|0; //@line 400 "HyMES/poly.c"
 $3 = $10; //@line 400 "HyMES/poly.c"
 $11 = $3; //@line 402 "HyMES/poly.c"
 $12 = $11<<2; //@line 402 "HyMES/poly.c"
 $13 = (_malloc($12)|0); //@line 402 "HyMES/poly.c"
 $8 = $13; //@line 402 "HyMES/poly.c"
 $2 = 0; //@line 403 "HyMES/poly.c"
 while(1) {
  $14 = $2; //@line 403 "HyMES/poly.c"
  $15 = $3; //@line 403 "HyMES/poly.c"
  $16 = ($14|0)<($15|0); //@line 403 "HyMES/poly.c"
  if (!($16)) {
   break;
  }
  $17 = $3; //@line 404 "HyMES/poly.c"
  $18 = (($17) + 1)|0; //@line 404 "HyMES/poly.c"
  $19 = (_poly_alloc($18)|0); //@line 404 "HyMES/poly.c"
  $20 = $2; //@line 404 "HyMES/poly.c"
  $21 = $8; //@line 404 "HyMES/poly.c"
  $22 = (($21) + ($20<<2)|0); //@line 404 "HyMES/poly.c"
  HEAP32[$22>>2] = $19; //@line 404 "HyMES/poly.c"
  $23 = $2; //@line 403 "HyMES/poly.c"
  $24 = (($23) + 1)|0; //@line 403 "HyMES/poly.c"
  $2 = $24; //@line 403 "HyMES/poly.c"
 }
 $25 = $1; //@line 405 "HyMES/poly.c"
 $26 = $8; //@line 405 "HyMES/poly.c"
 _poly_sqmod_init($25,$26); //@line 405 "HyMES/poly.c"
 $27 = $3; //@line 407 "HyMES/poly.c"
 $28 = (($27) - 1)|0; //@line 407 "HyMES/poly.c"
 $29 = (_poly_alloc($28)|0); //@line 407 "HyMES/poly.c"
 $7 = $29; //@line 407 "HyMES/poly.c"
 $30 = $3; //@line 408 "HyMES/poly.c"
 $31 = (($30) - 1)|0; //@line 408 "HyMES/poly.c"
 $32 = (_poly_alloc($31)|0); //@line 408 "HyMES/poly.c"
 $6 = $32; //@line 408 "HyMES/poly.c"
 $33 = $6; //@line 409 "HyMES/poly.c"
 HEAP32[$33>>2] = 1; //@line 409 "HyMES/poly.c"
 $34 = $6; //@line 411 "HyMES/poly.c"
 $35 = ((($34)) + 8|0); //@line 411 "HyMES/poly.c"
 $36 = HEAP32[$35>>2]|0; //@line 411 "HyMES/poly.c"
 $37 = ((($36)) + 2|0); //@line 411 "HyMES/poly.c"
 HEAP16[$37>>1] = 1; //@line 411 "HyMES/poly.c"
 $2 = 0; //@line 413 "HyMES/poly.c"
 while(1) {
  $38 = $2; //@line 413 "HyMES/poly.c"
  $39 = $3; //@line 413 "HyMES/poly.c"
  $40 = HEAP32[2862]|0; //@line 413 "HyMES/poly.c"
  $41 = Math_imul($39, $40)|0; //@line 413 "HyMES/poly.c"
  $42 = (($41) - 1)|0; //@line 413 "HyMES/poly.c"
  $43 = ($38|0)<($42|0); //@line 413 "HyMES/poly.c"
  if (!($43)) {
   break;
  }
  $44 = $7; //@line 415 "HyMES/poly.c"
  $45 = $6; //@line 415 "HyMES/poly.c"
  $46 = $8; //@line 415 "HyMES/poly.c"
  $47 = $3; //@line 415 "HyMES/poly.c"
  _poly_sqmod($44,$45,$46,$47); //@line 415 "HyMES/poly.c"
  $48 = $7; //@line 417 "HyMES/poly.c"
  $5 = $48; //@line 417 "HyMES/poly.c"
  $49 = $6; //@line 417 "HyMES/poly.c"
  $7 = $49; //@line 417 "HyMES/poly.c"
  $50 = $5; //@line 417 "HyMES/poly.c"
  $6 = $50; //@line 417 "HyMES/poly.c"
  $51 = $2; //@line 413 "HyMES/poly.c"
  $52 = (($51) + 1)|0; //@line 413 "HyMES/poly.c"
  $2 = $52; //@line 413 "HyMES/poly.c"
 }
 $53 = $3; //@line 421 "HyMES/poly.c"
 $54 = $53<<2; //@line 421 "HyMES/poly.c"
 $55 = (_malloc($54)|0); //@line 421 "HyMES/poly.c"
 $4 = $55; //@line 421 "HyMES/poly.c"
 $2 = 0; //@line 422 "HyMES/poly.c"
 while(1) {
  $56 = $2; //@line 422 "HyMES/poly.c"
  $57 = $3; //@line 422 "HyMES/poly.c"
  $58 = ($56|0)<($57|0); //@line 422 "HyMES/poly.c"
  if (!($58)) {
   break;
  }
  $59 = $3; //@line 423 "HyMES/poly.c"
  $60 = (($59) - 1)|0; //@line 423 "HyMES/poly.c"
  $61 = (_poly_alloc($60)|0); //@line 423 "HyMES/poly.c"
  $62 = $2; //@line 423 "HyMES/poly.c"
  $63 = $4; //@line 423 "HyMES/poly.c"
  $64 = (($63) + ($62<<2)|0); //@line 423 "HyMES/poly.c"
  HEAP32[$64>>2] = $61; //@line 423 "HyMES/poly.c"
  $65 = $2; //@line 422 "HyMES/poly.c"
  $66 = (($65) + 1)|0; //@line 422 "HyMES/poly.c"
  $2 = $66; //@line 422 "HyMES/poly.c"
 }
 $67 = $4; //@line 425 "HyMES/poly.c"
 $68 = ((($67)) + 4|0); //@line 425 "HyMES/poly.c"
 $69 = HEAP32[$68>>2]|0; //@line 425 "HyMES/poly.c"
 $70 = $6; //@line 425 "HyMES/poly.c"
 _poly_set($69,$70); //@line 425 "HyMES/poly.c"
 $71 = $4; //@line 426 "HyMES/poly.c"
 $72 = ((($71)) + 4|0); //@line 426 "HyMES/poly.c"
 $73 = HEAP32[$72>>2]|0; //@line 426 "HyMES/poly.c"
 (_poly_calcule_deg($73)|0); //@line 426 "HyMES/poly.c"
 $2 = 3; //@line 427 "HyMES/poly.c"
 while(1) {
  $74 = $2; //@line 427 "HyMES/poly.c"
  $75 = $3; //@line 427 "HyMES/poly.c"
  $76 = ($74|0)<($75|0); //@line 427 "HyMES/poly.c"
  if (!($76)) {
   break;
  }
  $77 = $2; //@line 428 "HyMES/poly.c"
  $78 = $4; //@line 428 "HyMES/poly.c"
  $79 = (($78) + ($77<<2)|0); //@line 428 "HyMES/poly.c"
  $80 = HEAP32[$79>>2]|0; //@line 428 "HyMES/poly.c"
  $81 = $2; //@line 428 "HyMES/poly.c"
  $82 = (($81) - 2)|0; //@line 428 "HyMES/poly.c"
  $83 = $4; //@line 428 "HyMES/poly.c"
  $84 = (($83) + ($82<<2)|0); //@line 428 "HyMES/poly.c"
  $85 = HEAP32[$84>>2]|0; //@line 428 "HyMES/poly.c"
  _poly_set($80,$85); //@line 428 "HyMES/poly.c"
  $86 = $2; //@line 429 "HyMES/poly.c"
  $87 = $4; //@line 429 "HyMES/poly.c"
  $88 = (($87) + ($86<<2)|0); //@line 429 "HyMES/poly.c"
  $89 = HEAP32[$88>>2]|0; //@line 429 "HyMES/poly.c"
  $90 = $1; //@line 429 "HyMES/poly.c"
  _poly_shiftmod($89,$90); //@line 429 "HyMES/poly.c"
  $91 = $2; //@line 430 "HyMES/poly.c"
  $92 = $4; //@line 430 "HyMES/poly.c"
  $93 = (($92) + ($91<<2)|0); //@line 430 "HyMES/poly.c"
  $94 = HEAP32[$93>>2]|0; //@line 430 "HyMES/poly.c"
  (_poly_calcule_deg($94)|0); //@line 430 "HyMES/poly.c"
  $95 = $2; //@line 427 "HyMES/poly.c"
  $96 = (($95) + 2)|0; //@line 427 "HyMES/poly.c"
  $2 = $96; //@line 427 "HyMES/poly.c"
 }
 $2 = 0; //@line 433 "HyMES/poly.c"
 while(1) {
  $97 = $2; //@line 433 "HyMES/poly.c"
  $98 = $3; //@line 433 "HyMES/poly.c"
  $99 = ($97|0)<($98|0); //@line 433 "HyMES/poly.c"
  if (!($99)) {
   break;
  }
  $100 = $2; //@line 434 "HyMES/poly.c"
  $101 = $4; //@line 434 "HyMES/poly.c"
  $102 = (($101) + ($100<<2)|0); //@line 434 "HyMES/poly.c"
  $103 = HEAP32[$102>>2]|0; //@line 434 "HyMES/poly.c"
  _poly_set_to_zero($103); //@line 434 "HyMES/poly.c"
  $104 = $2; //@line 435 "HyMES/poly.c"
  $105 = (($104|0) / 2)&-1; //@line 435 "HyMES/poly.c"
  $106 = $2; //@line 435 "HyMES/poly.c"
  $107 = $4; //@line 435 "HyMES/poly.c"
  $108 = (($107) + ($106<<2)|0); //@line 435 "HyMES/poly.c"
  $109 = HEAP32[$108>>2]|0; //@line 435 "HyMES/poly.c"
  $110 = ((($109)) + 8|0); //@line 435 "HyMES/poly.c"
  $111 = HEAP32[$110>>2]|0; //@line 435 "HyMES/poly.c"
  $112 = (($111) + ($105<<1)|0); //@line 435 "HyMES/poly.c"
  HEAP16[$112>>1] = 1; //@line 435 "HyMES/poly.c"
  $113 = $2; //@line 436 "HyMES/poly.c"
  $114 = (($113|0) / 2)&-1; //@line 436 "HyMES/poly.c"
  $115 = $2; //@line 436 "HyMES/poly.c"
  $116 = $4; //@line 436 "HyMES/poly.c"
  $117 = (($116) + ($115<<2)|0); //@line 436 "HyMES/poly.c"
  $118 = HEAP32[$117>>2]|0; //@line 436 "HyMES/poly.c"
  HEAP32[$118>>2] = $114; //@line 436 "HyMES/poly.c"
  $119 = $2; //@line 433 "HyMES/poly.c"
  $120 = (($119) + 2)|0; //@line 433 "HyMES/poly.c"
  $2 = $120; //@line 433 "HyMES/poly.c"
 }
 $2 = 0; //@line 439 "HyMES/poly.c"
 while(1) {
  $121 = $2; //@line 439 "HyMES/poly.c"
  $122 = $3; //@line 439 "HyMES/poly.c"
  $123 = ($121|0)<($122|0); //@line 439 "HyMES/poly.c"
  if (!($123)) {
   break;
  }
  $124 = $2; //@line 440 "HyMES/poly.c"
  $125 = $8; //@line 440 "HyMES/poly.c"
  $126 = (($125) + ($124<<2)|0); //@line 440 "HyMES/poly.c"
  $127 = HEAP32[$126>>2]|0; //@line 440 "HyMES/poly.c"
  _poly_free($127); //@line 440 "HyMES/poly.c"
  $128 = $2; //@line 439 "HyMES/poly.c"
  $129 = (($128) + 1)|0; //@line 439 "HyMES/poly.c"
  $2 = $129; //@line 439 "HyMES/poly.c"
 }
 $130 = $8; //@line 441 "HyMES/poly.c"
 _free($130); //@line 441 "HyMES/poly.c"
 $131 = $6; //@line 442 "HyMES/poly.c"
 _poly_free($131); //@line 442 "HyMES/poly.c"
 $132 = $7; //@line 443 "HyMES/poly.c"
 _poly_free($132); //@line 443 "HyMES/poly.c"
 $133 = $4; //@line 445 "HyMES/poly.c"
 STACKTOP = sp;return ($133|0); //@line 445 "HyMES/poly.c"
}
function _poly_syndrome_init($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0;
 var $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0;
 var $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0;
 var $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0;
 var $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0;
 var $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0;
 var $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0;
 var $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0;
 var $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0;
 var $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0;
 var $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0;
 var $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0;
 var $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0;
 var $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $11 = $5; //@line 454 "HyMES/poly.c"
 $12 = $11<<2; //@line 454 "HyMES/poly.c"
 $13 = (_malloc($12)|0); //@line 454 "HyMES/poly.c"
 $10 = $13; //@line 454 "HyMES/poly.c"
 $14 = $3; //@line 455 "HyMES/poly.c"
 $15 = HEAP32[$14>>2]|0; //@line 455 "HyMES/poly.c"
 $8 = $15; //@line 455 "HyMES/poly.c"
 $7 = 0; //@line 460 "HyMES/poly.c"
 while(1) {
  $16 = $7; //@line 460 "HyMES/poly.c"
  $17 = $5; //@line 460 "HyMES/poly.c"
  $18 = ($16|0)<($17|0); //@line 460 "HyMES/poly.c"
  if (!($18)) {
   break;
  }
  $19 = $8; //@line 462 "HyMES/poly.c"
  $20 = (($19) - 1)|0; //@line 462 "HyMES/poly.c"
  $21 = (_poly_alloc($20)|0); //@line 462 "HyMES/poly.c"
  $22 = $7; //@line 462 "HyMES/poly.c"
  $23 = $10; //@line 462 "HyMES/poly.c"
  $24 = (($23) + ($22<<2)|0); //@line 462 "HyMES/poly.c"
  HEAP32[$24>>2] = $21; //@line 462 "HyMES/poly.c"
  $25 = $8; //@line 463 "HyMES/poly.c"
  $26 = (($25) - 1)|0; //@line 463 "HyMES/poly.c"
  $27 = $7; //@line 463 "HyMES/poly.c"
  $28 = $10; //@line 463 "HyMES/poly.c"
  $29 = (($28) + ($27<<2)|0); //@line 463 "HyMES/poly.c"
  $30 = HEAP32[$29>>2]|0; //@line 463 "HyMES/poly.c"
  $31 = ((($30)) + 8|0); //@line 463 "HyMES/poly.c"
  $32 = HEAP32[$31>>2]|0; //@line 463 "HyMES/poly.c"
  $33 = (($32) + ($26<<1)|0); //@line 463 "HyMES/poly.c"
  HEAP16[$33>>1] = 1; //@line 463 "HyMES/poly.c"
  $34 = $8; //@line 464 "HyMES/poly.c"
  $35 = (($34) - 2)|0; //@line 464 "HyMES/poly.c"
  $6 = $35; //@line 464 "HyMES/poly.c"
  while(1) {
   $36 = $6; //@line 464 "HyMES/poly.c"
   $37 = ($36|0)>=(0); //@line 464 "HyMES/poly.c"
   if (!($37)) {
    break;
   }
   $38 = $6; //@line 466 "HyMES/poly.c"
   $39 = (($38) + 1)|0; //@line 466 "HyMES/poly.c"
   $40 = $3; //@line 466 "HyMES/poly.c"
   $41 = ((($40)) + 8|0); //@line 466 "HyMES/poly.c"
   $42 = HEAP32[$41>>2]|0; //@line 466 "HyMES/poly.c"
   $43 = (($42) + ($39<<1)|0); //@line 466 "HyMES/poly.c"
   $44 = HEAP16[$43>>1]|0; //@line 466 "HyMES/poly.c"
   $45 = $44&65535; //@line 466 "HyMES/poly.c"
   $46 = $7; //@line 466 "HyMES/poly.c"
   $47 = $4; //@line 466 "HyMES/poly.c"
   $48 = (($47) + ($46<<1)|0); //@line 466 "HyMES/poly.c"
   $49 = HEAP16[$48>>1]|0; //@line 466 "HyMES/poly.c"
   $50 = $49&65535; //@line 466 "HyMES/poly.c"
   $51 = ($50|0)!=(0); //@line 466 "HyMES/poly.c"
   if ($51) {
    $52 = $6; //@line 466 "HyMES/poly.c"
    $53 = (($52) + 1)|0; //@line 466 "HyMES/poly.c"
    $54 = $7; //@line 466 "HyMES/poly.c"
    $55 = $10; //@line 466 "HyMES/poly.c"
    $56 = (($55) + ($54<<2)|0); //@line 466 "HyMES/poly.c"
    $57 = HEAP32[$56>>2]|0; //@line 466 "HyMES/poly.c"
    $58 = ((($57)) + 8|0); //@line 466 "HyMES/poly.c"
    $59 = HEAP32[$58>>2]|0; //@line 466 "HyMES/poly.c"
    $60 = (($59) + ($53<<1)|0); //@line 466 "HyMES/poly.c"
    $61 = HEAP16[$60>>1]|0; //@line 466 "HyMES/poly.c"
    $62 = $61&65535; //@line 466 "HyMES/poly.c"
    $63 = ($62|0)!=(0); //@line 466 "HyMES/poly.c"
    if ($63) {
     $64 = $7; //@line 466 "HyMES/poly.c"
     $65 = $4; //@line 466 "HyMES/poly.c"
     $66 = (($65) + ($64<<1)|0); //@line 466 "HyMES/poly.c"
     $67 = HEAP16[$66>>1]|0; //@line 466 "HyMES/poly.c"
     $68 = $67&65535; //@line 466 "HyMES/poly.c"
     $69 = HEAP32[2860]|0; //@line 466 "HyMES/poly.c"
     $70 = (($69) + ($68<<1)|0); //@line 466 "HyMES/poly.c"
     $71 = HEAP16[$70>>1]|0; //@line 466 "HyMES/poly.c"
     $72 = $71&65535; //@line 466 "HyMES/poly.c"
     $73 = $6; //@line 466 "HyMES/poly.c"
     $74 = (($73) + 1)|0; //@line 466 "HyMES/poly.c"
     $75 = $7; //@line 466 "HyMES/poly.c"
     $76 = $10; //@line 466 "HyMES/poly.c"
     $77 = (($76) + ($75<<2)|0); //@line 466 "HyMES/poly.c"
     $78 = HEAP32[$77>>2]|0; //@line 466 "HyMES/poly.c"
     $79 = ((($78)) + 8|0); //@line 466 "HyMES/poly.c"
     $80 = HEAP32[$79>>2]|0; //@line 466 "HyMES/poly.c"
     $81 = (($80) + ($74<<1)|0); //@line 466 "HyMES/poly.c"
     $82 = HEAP16[$81>>1]|0; //@line 466 "HyMES/poly.c"
     $83 = $82&65535; //@line 466 "HyMES/poly.c"
     $84 = HEAP32[2860]|0; //@line 466 "HyMES/poly.c"
     $85 = (($84) + ($83<<1)|0); //@line 466 "HyMES/poly.c"
     $86 = HEAP16[$85>>1]|0; //@line 466 "HyMES/poly.c"
     $87 = $86&65535; //@line 466 "HyMES/poly.c"
     $88 = (($72) + ($87))|0; //@line 466 "HyMES/poly.c"
     $89 = HEAP32[2861]|0; //@line 466 "HyMES/poly.c"
     $90 = $88 & $89; //@line 466 "HyMES/poly.c"
     $91 = $7; //@line 466 "HyMES/poly.c"
     $92 = $4; //@line 466 "HyMES/poly.c"
     $93 = (($92) + ($91<<1)|0); //@line 466 "HyMES/poly.c"
     $94 = HEAP16[$93>>1]|0; //@line 466 "HyMES/poly.c"
     $95 = $94&65535; //@line 466 "HyMES/poly.c"
     $96 = HEAP32[2860]|0; //@line 466 "HyMES/poly.c"
     $97 = (($96) + ($95<<1)|0); //@line 466 "HyMES/poly.c"
     $98 = HEAP16[$97>>1]|0; //@line 466 "HyMES/poly.c"
     $99 = $98&65535; //@line 466 "HyMES/poly.c"
     $100 = $6; //@line 466 "HyMES/poly.c"
     $101 = (($100) + 1)|0; //@line 466 "HyMES/poly.c"
     $102 = $7; //@line 466 "HyMES/poly.c"
     $103 = $10; //@line 466 "HyMES/poly.c"
     $104 = (($103) + ($102<<2)|0); //@line 466 "HyMES/poly.c"
     $105 = HEAP32[$104>>2]|0; //@line 466 "HyMES/poly.c"
     $106 = ((($105)) + 8|0); //@line 466 "HyMES/poly.c"
     $107 = HEAP32[$106>>2]|0; //@line 466 "HyMES/poly.c"
     $108 = (($107) + ($101<<1)|0); //@line 466 "HyMES/poly.c"
     $109 = HEAP16[$108>>1]|0; //@line 466 "HyMES/poly.c"
     $110 = $109&65535; //@line 466 "HyMES/poly.c"
     $111 = HEAP32[2860]|0; //@line 466 "HyMES/poly.c"
     $112 = (($111) + ($110<<1)|0); //@line 466 "HyMES/poly.c"
     $113 = HEAP16[$112>>1]|0; //@line 466 "HyMES/poly.c"
     $114 = $113&65535; //@line 466 "HyMES/poly.c"
     $115 = (($99) + ($114))|0; //@line 466 "HyMES/poly.c"
     $116 = HEAP32[2862]|0; //@line 466 "HyMES/poly.c"
     $117 = $115 >> $116; //@line 466 "HyMES/poly.c"
     $118 = (($90) + ($117))|0; //@line 466 "HyMES/poly.c"
     $119 = HEAP32[2863]|0; //@line 466 "HyMES/poly.c"
     $120 = (($119) + ($118<<1)|0); //@line 466 "HyMES/poly.c"
     $121 = HEAP16[$120>>1]|0; //@line 466 "HyMES/poly.c"
     $122 = $121&65535; //@line 466 "HyMES/poly.c"
     $124 = $122;
    } else {
     $124 = 0;
    }
   } else {
    $124 = 0;
   }
   $123 = $45 ^ $124; //@line 466 "HyMES/poly.c"
   $125 = $123&65535; //@line 466 "HyMES/poly.c"
   $126 = $6; //@line 466 "HyMES/poly.c"
   $127 = $7; //@line 466 "HyMES/poly.c"
   $128 = $10; //@line 466 "HyMES/poly.c"
   $129 = (($128) + ($127<<2)|0); //@line 466 "HyMES/poly.c"
   $130 = HEAP32[$129>>2]|0; //@line 466 "HyMES/poly.c"
   $131 = ((($130)) + 8|0); //@line 466 "HyMES/poly.c"
   $132 = HEAP32[$131>>2]|0; //@line 466 "HyMES/poly.c"
   $133 = (($132) + ($126<<1)|0); //@line 466 "HyMES/poly.c"
   HEAP16[$133>>1] = $125; //@line 466 "HyMES/poly.c"
   $134 = $6; //@line 464 "HyMES/poly.c"
   $135 = (($134) + -1)|0; //@line 464 "HyMES/poly.c"
   $6 = $135; //@line 464 "HyMES/poly.c"
  }
  $136 = $3; //@line 469 "HyMES/poly.c"
  $137 = ((($136)) + 8|0); //@line 469 "HyMES/poly.c"
  $138 = HEAP32[$137>>2]|0; //@line 469 "HyMES/poly.c"
  $139 = HEAP16[$138>>1]|0; //@line 469 "HyMES/poly.c"
  $140 = $139&65535; //@line 469 "HyMES/poly.c"
  $141 = $7; //@line 469 "HyMES/poly.c"
  $142 = $4; //@line 469 "HyMES/poly.c"
  $143 = (($142) + ($141<<1)|0); //@line 469 "HyMES/poly.c"
  $144 = HEAP16[$143>>1]|0; //@line 469 "HyMES/poly.c"
  $145 = $144&65535; //@line 469 "HyMES/poly.c"
  $146 = ($145|0)!=(0); //@line 469 "HyMES/poly.c"
  if ($146) {
   $147 = $7; //@line 469 "HyMES/poly.c"
   $148 = $10; //@line 469 "HyMES/poly.c"
   $149 = (($148) + ($147<<2)|0); //@line 469 "HyMES/poly.c"
   $150 = HEAP32[$149>>2]|0; //@line 469 "HyMES/poly.c"
   $151 = ((($150)) + 8|0); //@line 469 "HyMES/poly.c"
   $152 = HEAP32[$151>>2]|0; //@line 469 "HyMES/poly.c"
   $153 = HEAP16[$152>>1]|0; //@line 469 "HyMES/poly.c"
   $154 = $153&65535; //@line 469 "HyMES/poly.c"
   $155 = ($154|0)!=(0); //@line 469 "HyMES/poly.c"
   if ($155) {
    $156 = $7; //@line 469 "HyMES/poly.c"
    $157 = $4; //@line 469 "HyMES/poly.c"
    $158 = (($157) + ($156<<1)|0); //@line 469 "HyMES/poly.c"
    $159 = HEAP16[$158>>1]|0; //@line 469 "HyMES/poly.c"
    $160 = $159&65535; //@line 469 "HyMES/poly.c"
    $161 = HEAP32[2860]|0; //@line 469 "HyMES/poly.c"
    $162 = (($161) + ($160<<1)|0); //@line 469 "HyMES/poly.c"
    $163 = HEAP16[$162>>1]|0; //@line 469 "HyMES/poly.c"
    $164 = $163&65535; //@line 469 "HyMES/poly.c"
    $165 = $7; //@line 469 "HyMES/poly.c"
    $166 = $10; //@line 469 "HyMES/poly.c"
    $167 = (($166) + ($165<<2)|0); //@line 469 "HyMES/poly.c"
    $168 = HEAP32[$167>>2]|0; //@line 469 "HyMES/poly.c"
    $169 = ((($168)) + 8|0); //@line 469 "HyMES/poly.c"
    $170 = HEAP32[$169>>2]|0; //@line 469 "HyMES/poly.c"
    $171 = HEAP16[$170>>1]|0; //@line 469 "HyMES/poly.c"
    $172 = $171&65535; //@line 469 "HyMES/poly.c"
    $173 = HEAP32[2860]|0; //@line 469 "HyMES/poly.c"
    $174 = (($173) + ($172<<1)|0); //@line 469 "HyMES/poly.c"
    $175 = HEAP16[$174>>1]|0; //@line 469 "HyMES/poly.c"
    $176 = $175&65535; //@line 469 "HyMES/poly.c"
    $177 = (($164) + ($176))|0; //@line 469 "HyMES/poly.c"
    $178 = HEAP32[2861]|0; //@line 469 "HyMES/poly.c"
    $179 = $177 & $178; //@line 469 "HyMES/poly.c"
    $180 = $7; //@line 469 "HyMES/poly.c"
    $181 = $4; //@line 469 "HyMES/poly.c"
    $182 = (($181) + ($180<<1)|0); //@line 469 "HyMES/poly.c"
    $183 = HEAP16[$182>>1]|0; //@line 469 "HyMES/poly.c"
    $184 = $183&65535; //@line 469 "HyMES/poly.c"
    $185 = HEAP32[2860]|0; //@line 469 "HyMES/poly.c"
    $186 = (($185) + ($184<<1)|0); //@line 469 "HyMES/poly.c"
    $187 = HEAP16[$186>>1]|0; //@line 469 "HyMES/poly.c"
    $188 = $187&65535; //@line 469 "HyMES/poly.c"
    $189 = $7; //@line 469 "HyMES/poly.c"
    $190 = $10; //@line 469 "HyMES/poly.c"
    $191 = (($190) + ($189<<2)|0); //@line 469 "HyMES/poly.c"
    $192 = HEAP32[$191>>2]|0; //@line 469 "HyMES/poly.c"
    $193 = ((($192)) + 8|0); //@line 469 "HyMES/poly.c"
    $194 = HEAP32[$193>>2]|0; //@line 469 "HyMES/poly.c"
    $195 = HEAP16[$194>>1]|0; //@line 469 "HyMES/poly.c"
    $196 = $195&65535; //@line 469 "HyMES/poly.c"
    $197 = HEAP32[2860]|0; //@line 469 "HyMES/poly.c"
    $198 = (($197) + ($196<<1)|0); //@line 469 "HyMES/poly.c"
    $199 = HEAP16[$198>>1]|0; //@line 469 "HyMES/poly.c"
    $200 = $199&65535; //@line 469 "HyMES/poly.c"
    $201 = (($188) + ($200))|0; //@line 469 "HyMES/poly.c"
    $202 = HEAP32[2862]|0; //@line 469 "HyMES/poly.c"
    $203 = $201 >> $202; //@line 469 "HyMES/poly.c"
    $204 = (($179) + ($203))|0; //@line 469 "HyMES/poly.c"
    $205 = HEAP32[2863]|0; //@line 469 "HyMES/poly.c"
    $206 = (($205) + ($204<<1)|0); //@line 469 "HyMES/poly.c"
    $207 = HEAP16[$206>>1]|0; //@line 469 "HyMES/poly.c"
    $208 = $207&65535; //@line 469 "HyMES/poly.c"
    $210 = $208;
   } else {
    $210 = 0;
   }
  } else {
   $210 = 0;
  }
  $209 = $140 ^ $210; //@line 469 "HyMES/poly.c"
  $211 = $209&65535; //@line 469 "HyMES/poly.c"
  $9 = $211; //@line 469 "HyMES/poly.c"
  $6 = 0; //@line 470 "HyMES/poly.c"
  while(1) {
   $212 = $6; //@line 470 "HyMES/poly.c"
   $213 = $8; //@line 470 "HyMES/poly.c"
   $214 = ($212|0)<($213|0); //@line 470 "HyMES/poly.c"
   if (!($214)) {
    break;
   }
   $215 = $6; //@line 472 "HyMES/poly.c"
   $216 = $7; //@line 472 "HyMES/poly.c"
   $217 = $10; //@line 472 "HyMES/poly.c"
   $218 = (($217) + ($216<<2)|0); //@line 472 "HyMES/poly.c"
   $219 = HEAP32[$218>>2]|0; //@line 472 "HyMES/poly.c"
   $220 = ((($219)) + 8|0); //@line 472 "HyMES/poly.c"
   $221 = HEAP32[$220>>2]|0; //@line 472 "HyMES/poly.c"
   $222 = (($221) + ($215<<1)|0); //@line 472 "HyMES/poly.c"
   $223 = HEAP16[$222>>1]|0; //@line 472 "HyMES/poly.c"
   $224 = $223&65535; //@line 472 "HyMES/poly.c"
   $225 = ($224|0)!=(0); //@line 472 "HyMES/poly.c"
   if ($225) {
    $226 = $6; //@line 472 "HyMES/poly.c"
    $227 = $7; //@line 472 "HyMES/poly.c"
    $228 = $10; //@line 472 "HyMES/poly.c"
    $229 = (($228) + ($227<<2)|0); //@line 472 "HyMES/poly.c"
    $230 = HEAP32[$229>>2]|0; //@line 472 "HyMES/poly.c"
    $231 = ((($230)) + 8|0); //@line 472 "HyMES/poly.c"
    $232 = HEAP32[$231>>2]|0; //@line 472 "HyMES/poly.c"
    $233 = (($232) + ($226<<1)|0); //@line 472 "HyMES/poly.c"
    $234 = HEAP16[$233>>1]|0; //@line 472 "HyMES/poly.c"
    $235 = $234&65535; //@line 472 "HyMES/poly.c"
    $236 = HEAP32[2860]|0; //@line 472 "HyMES/poly.c"
    $237 = (($236) + ($235<<1)|0); //@line 472 "HyMES/poly.c"
    $238 = HEAP16[$237>>1]|0; //@line 472 "HyMES/poly.c"
    $239 = $238&65535; //@line 472 "HyMES/poly.c"
    $240 = $9; //@line 472 "HyMES/poly.c"
    $241 = $240&65535; //@line 472 "HyMES/poly.c"
    $242 = HEAP32[2860]|0; //@line 472 "HyMES/poly.c"
    $243 = (($242) + ($241<<1)|0); //@line 472 "HyMES/poly.c"
    $244 = HEAP16[$243>>1]|0; //@line 472 "HyMES/poly.c"
    $245 = $244&65535; //@line 472 "HyMES/poly.c"
    $246 = (($239) - ($245))|0; //@line 472 "HyMES/poly.c"
    $247 = HEAP32[2861]|0; //@line 472 "HyMES/poly.c"
    $248 = $246 & $247; //@line 472 "HyMES/poly.c"
    $249 = $6; //@line 472 "HyMES/poly.c"
    $250 = $7; //@line 472 "HyMES/poly.c"
    $251 = $10; //@line 472 "HyMES/poly.c"
    $252 = (($251) + ($250<<2)|0); //@line 472 "HyMES/poly.c"
    $253 = HEAP32[$252>>2]|0; //@line 472 "HyMES/poly.c"
    $254 = ((($253)) + 8|0); //@line 472 "HyMES/poly.c"
    $255 = HEAP32[$254>>2]|0; //@line 472 "HyMES/poly.c"
    $256 = (($255) + ($249<<1)|0); //@line 472 "HyMES/poly.c"
    $257 = HEAP16[$256>>1]|0; //@line 472 "HyMES/poly.c"
    $258 = $257&65535; //@line 472 "HyMES/poly.c"
    $259 = HEAP32[2860]|0; //@line 472 "HyMES/poly.c"
    $260 = (($259) + ($258<<1)|0); //@line 472 "HyMES/poly.c"
    $261 = HEAP16[$260>>1]|0; //@line 472 "HyMES/poly.c"
    $262 = $261&65535; //@line 472 "HyMES/poly.c"
    $263 = $9; //@line 472 "HyMES/poly.c"
    $264 = $263&65535; //@line 472 "HyMES/poly.c"
    $265 = HEAP32[2860]|0; //@line 472 "HyMES/poly.c"
    $266 = (($265) + ($264<<1)|0); //@line 472 "HyMES/poly.c"
    $267 = HEAP16[$266>>1]|0; //@line 472 "HyMES/poly.c"
    $268 = $267&65535; //@line 472 "HyMES/poly.c"
    $269 = (($262) - ($268))|0; //@line 472 "HyMES/poly.c"
    $270 = HEAP32[2862]|0; //@line 472 "HyMES/poly.c"
    $271 = $269 >> $270; //@line 472 "HyMES/poly.c"
    $272 = (($248) + ($271))|0; //@line 472 "HyMES/poly.c"
    $273 = HEAP32[2863]|0; //@line 472 "HyMES/poly.c"
    $274 = (($273) + ($272<<1)|0); //@line 472 "HyMES/poly.c"
    $275 = HEAP16[$274>>1]|0; //@line 472 "HyMES/poly.c"
    $276 = $275&65535; //@line 472 "HyMES/poly.c"
    $278 = $276;
   } else {
    $278 = 0;
   }
   $277 = $278&65535; //@line 472 "HyMES/poly.c"
   $279 = $6; //@line 472 "HyMES/poly.c"
   $280 = $7; //@line 472 "HyMES/poly.c"
   $281 = $10; //@line 472 "HyMES/poly.c"
   $282 = (($281) + ($280<<2)|0); //@line 472 "HyMES/poly.c"
   $283 = HEAP32[$282>>2]|0; //@line 472 "HyMES/poly.c"
   $284 = ((($283)) + 8|0); //@line 472 "HyMES/poly.c"
   $285 = HEAP32[$284>>2]|0; //@line 472 "HyMES/poly.c"
   $286 = (($285) + ($279<<1)|0); //@line 472 "HyMES/poly.c"
   HEAP16[$286>>1] = $277; //@line 472 "HyMES/poly.c"
   $287 = $6; //@line 470 "HyMES/poly.c"
   $288 = (($287) + 1)|0; //@line 470 "HyMES/poly.c"
   $6 = $288; //@line 470 "HyMES/poly.c"
  }
  $289 = $7; //@line 460 "HyMES/poly.c"
  $290 = (($289) + 1)|0; //@line 460 "HyMES/poly.c"
  $7 = $290; //@line 460 "HyMES/poly.c"
 }
 $291 = $10; //@line 476 "HyMES/poly.c"
 STACKTOP = sp;return ($291|0); //@line 476 "HyMES/poly.c"
}
function _mceliecejs_init() {
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $0 = 256; //@line 9 "mceliece.c"
 $2 = $0; //@line 10 "mceliece.c"
 $3 = (_malloc($2)|0); //@line 10 "mceliece.c"
 $1 = $3; //@line 10 "mceliece.c"
 _randombytes_stir(); //@line 12 "mceliece.c"
 $4 = $1; //@line 13 "mceliece.c"
 $5 = $0; //@line 13 "mceliece.c"
 _randombytes_buf($4,$5); //@line 13 "mceliece.c"
 $6 = (_time((0|0))|0); //@line 14 "mceliece.c"
 $7 = $1; //@line 14 "mceliece.c"
 $8 = $0; //@line 14 "mceliece.c"
 (_initstate($6,$7,$8)|0); //@line 14 "mceliece.c"
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
function _mceliecejs_message_bytes() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 472; //@line 34 "mceliece.c"
}
function _mceliecejs_keypair($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = $0;
 $3 = $1;
 $4 = $3; //@line 41 "mceliece.c"
 $5 = $2; //@line 41 "mceliece.c"
 (_keypair($4,$5)|0); //@line 41 "mceliece.c"
 STACKTOP = sp;return; //@line 42 "mceliece.c"
}
function _mceliecejs_encrypt($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5; //@line 49 "mceliece.c"
 $7 = $3; //@line 49 "mceliece.c"
 $8 = $4; //@line 49 "mceliece.c"
 (_encrypt_block($6,$7,$8)|0); //@line 49 "mceliece.c"
 STACKTOP = sp;return; //@line 50 "mceliece.c"
}
function _mceliecejs_decrypt($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $3 = $0;
 $4 = $1;
 $5 = $2;
 $6 = $5; //@line 57 "mceliece.c"
 $7 = $3; //@line 57 "mceliece.c"
 $8 = $4; //@line 57 "mceliece.c"
 (_decrypt_block($6,$7,$8)|0); //@line 57 "mceliece.c"
 STACKTOP = sp;return; //@line 58 "mceliece.c"
}
function ___stdio_close($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $vararg_buffer = sp;
 $1 = ((($0)) + 60|0);
 $2 = HEAP32[$1>>2]|0;
 HEAP32[$vararg_buffer>>2] = $2;
 $3 = (___syscall6(6,($vararg_buffer|0))|0);
 $4 = (___syscall_ret($3)|0);
 STACKTOP = sp;return ($4|0);
}
function ___stdio_write($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$0 = 0, $$056 = 0, $$058 = 0, $$059 = 0, $$061 = 0, $$1 = 0, $$157 = 0, $$160 = 0, $$phi$trans$insert = 0, $$pre = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0;
 var $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0;
 var $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, $vararg_buffer = 0, $vararg_buffer3 = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, $vararg_ptr6 = 0, $vararg_ptr7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(48|0);
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer = sp;
 $3 = sp + 32|0;
 $4 = ((($0)) + 28|0);
 $5 = HEAP32[$4>>2]|0;
 HEAP32[$3>>2] = $5;
 $6 = ((($3)) + 4|0);
 $7 = ((($0)) + 20|0);
 $8 = HEAP32[$7>>2]|0;
 $9 = (($8) - ($5))|0;
 HEAP32[$6>>2] = $9;
 $10 = ((($3)) + 8|0);
 HEAP32[$10>>2] = $1;
 $11 = ((($3)) + 12|0);
 HEAP32[$11>>2] = $2;
 $12 = (($9) + ($2))|0;
 $13 = ((($0)) + 60|0);
 $14 = ((($0)) + 44|0);
 $$056 = 2;$$058 = $12;$$059 = $3;
 while(1) {
  $15 = HEAP32[2869]|0;
  $16 = ($15|0)==(0|0);
  if ($16) {
   $20 = HEAP32[$13>>2]|0;
   HEAP32[$vararg_buffer3>>2] = $20;
   $vararg_ptr6 = ((($vararg_buffer3)) + 4|0);
   HEAP32[$vararg_ptr6>>2] = $$059;
   $vararg_ptr7 = ((($vararg_buffer3)) + 8|0);
   HEAP32[$vararg_ptr7>>2] = $$056;
   $21 = (___syscall146(146,($vararg_buffer3|0))|0);
   $22 = (___syscall_ret($21)|0);
   $$0 = $22;
  } else {
   _pthread_cleanup_push((18|0),($0|0));
   $17 = HEAP32[$13>>2]|0;
   HEAP32[$vararg_buffer>>2] = $17;
   $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
   HEAP32[$vararg_ptr1>>2] = $$059;
   $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
   HEAP32[$vararg_ptr2>>2] = $$056;
   $18 = (___syscall146(146,($vararg_buffer|0))|0);
   $19 = (___syscall_ret($18)|0);
   _pthread_cleanup_pop(0);
   $$0 = $19;
  }
  $23 = ($$058|0)==($$0|0);
  if ($23) {
   label = 6;
   break;
  }
  $30 = ($$0|0)<(0);
  if ($30) {
   label = 8;
   break;
  }
  $38 = (($$058) - ($$0))|0;
  $39 = ((($$059)) + 4|0);
  $40 = HEAP32[$39>>2]|0;
  $41 = ($$0>>>0)>($40>>>0);
  if ($41) {
   $42 = HEAP32[$14>>2]|0;
   HEAP32[$4>>2] = $42;
   HEAP32[$7>>2] = $42;
   $43 = (($$0) - ($40))|0;
   $44 = ((($$059)) + 8|0);
   $45 = (($$056) + -1)|0;
   $$phi$trans$insert = ((($$059)) + 12|0);
   $$pre = HEAP32[$$phi$trans$insert>>2]|0;
   $$1 = $43;$$157 = $45;$$160 = $44;$53 = $$pre;
  } else {
   $46 = ($$056|0)==(2);
   if ($46) {
    $47 = HEAP32[$4>>2]|0;
    $48 = (($47) + ($$0)|0);
    HEAP32[$4>>2] = $48;
    $$1 = $$0;$$157 = 2;$$160 = $$059;$53 = $40;
   } else {
    $$1 = $$0;$$157 = $$056;$$160 = $$059;$53 = $40;
   }
  }
  $49 = HEAP32[$$160>>2]|0;
  $50 = (($49) + ($$1)|0);
  HEAP32[$$160>>2] = $50;
  $51 = ((($$160)) + 4|0);
  $52 = (($53) - ($$1))|0;
  HEAP32[$51>>2] = $52;
  $$056 = $$157;$$058 = $38;$$059 = $$160;
 }
 if ((label|0) == 6) {
  $24 = HEAP32[$14>>2]|0;
  $25 = ((($0)) + 48|0);
  $26 = HEAP32[$25>>2]|0;
  $27 = (($24) + ($26)|0);
  $28 = ((($0)) + 16|0);
  HEAP32[$28>>2] = $27;
  $29 = $24;
  HEAP32[$4>>2] = $29;
  HEAP32[$7>>2] = $29;
  $$061 = $2;
 }
 else if ((label|0) == 8) {
  $31 = ((($0)) + 16|0);
  HEAP32[$31>>2] = 0;
  HEAP32[$4>>2] = 0;
  HEAP32[$7>>2] = 0;
  $32 = HEAP32[$0>>2]|0;
  $33 = $32 | 32;
  HEAP32[$0>>2] = $33;
  $34 = ($$056|0)==(2);
  if ($34) {
   $$061 = 0;
  } else {
   $35 = ((($$059)) + 4|0);
   $36 = HEAP32[$35>>2]|0;
   $37 = (($2) - ($36))|0;
   $$061 = $37;
  }
 }
 STACKTOP = sp;return ($$061|0);
}
function ___stdio_seek($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$pre = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, $vararg_ptr3 = 0, $vararg_ptr4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(32|0);
 $vararg_buffer = sp;
 $3 = sp + 20|0;
 $4 = ((($0)) + 60|0);
 $5 = HEAP32[$4>>2]|0;
 HEAP32[$vararg_buffer>>2] = $5;
 $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
 HEAP32[$vararg_ptr1>>2] = 0;
 $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
 HEAP32[$vararg_ptr2>>2] = $1;
 $vararg_ptr3 = ((($vararg_buffer)) + 12|0);
 HEAP32[$vararg_ptr3>>2] = $3;
 $vararg_ptr4 = ((($vararg_buffer)) + 16|0);
 HEAP32[$vararg_ptr4>>2] = $2;
 $6 = (___syscall140(140,($vararg_buffer|0))|0);
 $7 = (___syscall_ret($6)|0);
 $8 = ($7|0)<(0);
 if ($8) {
  HEAP32[$3>>2] = -1;
  $9 = -1;
 } else {
  $$pre = HEAP32[$3>>2]|0;
  $9 = $$pre;
 }
 STACKTOP = sp;return ($9|0);
}
function ___syscall_ret($0) {
 $0 = $0|0;
 var $$0 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = ($0>>>0)>(4294963200);
 if ($1) {
  $2 = (0 - ($0))|0;
  $3 = (___errno_location()|0);
  HEAP32[$3>>2] = $2;
  $$0 = -1;
 } else {
  $$0 = $0;
 }
 return ($$0|0);
}
function ___errno_location() {
 var $$0 = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[2869]|0;
 $1 = ($0|0)==(0|0);
 if ($1) {
  $$0 = 11520;
 } else {
  $2 = (_pthread_self()|0);
  $3 = ((($2)) + 64|0);
  $4 = HEAP32[$3>>2]|0;
  $$0 = $4;
 }
 return ($$0|0);
}
function _cleanup_517($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = ((($0)) + 68|0);
 $2 = HEAP32[$1>>2]|0;
 $3 = ($2|0)==(0);
 if ($3) {
  ___unlockfile($0);
 }
 return;
}
function ___unlockfile($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function ___stdout_write($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $10 = 0, $11 = 0, $12 = 0, $13 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(80|0);
 $vararg_buffer = sp;
 $3 = sp + 12|0;
 $4 = ((($0)) + 36|0);
 HEAP32[$4>>2] = 18;
 $5 = HEAP32[$0>>2]|0;
 $6 = $5 & 64;
 $7 = ($6|0)==(0);
 if ($7) {
  $8 = ((($0)) + 60|0);
  $9 = HEAP32[$8>>2]|0;
  HEAP32[$vararg_buffer>>2] = $9;
  $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
  HEAP32[$vararg_ptr1>>2] = 21505;
  $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
  HEAP32[$vararg_ptr2>>2] = $3;
  $10 = (___syscall54(54,($vararg_buffer|0))|0);
  $11 = ($10|0)==(0);
  if (!($11)) {
   $12 = ((($0)) + 75|0);
   HEAP8[$12>>0] = -1;
  }
 }
 $13 = (___stdio_write($0,$1,$2)|0);
 STACKTOP = sp;return ($13|0);
}
function _vfprintf($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$ = 0, $$0 = 0, $$1 = 0, $$1$ = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $vacopy_currentptr = 0, dest = 0, label = 0, sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 224|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(224|0);
 $3 = sp + 120|0;
 $4 = sp + 80|0;
 $5 = sp;
 $6 = sp + 136|0;
 dest=$4; stop=dest+40|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0));
 $vacopy_currentptr = HEAP32[$2>>2]|0;
 HEAP32[$3>>2] = $vacopy_currentptr;
 $7 = (_printf_core(0,$1,$3,$5,$4)|0);
 $8 = ($7|0)<(0);
 if ($8) {
  $$0 = -1;
 } else {
  $9 = ((($0)) + 76|0);
  $10 = HEAP32[$9>>2]|0;
  $11 = ($10|0)>(-1);
  if ($11) {
   $12 = (___lockfile($0)|0);
   $39 = $12;
  } else {
   $39 = 0;
  }
  $13 = HEAP32[$0>>2]|0;
  $14 = $13 & 32;
  $15 = ((($0)) + 74|0);
  $16 = HEAP8[$15>>0]|0;
  $17 = ($16<<24>>24)<(1);
  if ($17) {
   $18 = $13 & -33;
   HEAP32[$0>>2] = $18;
  }
  $19 = ((($0)) + 48|0);
  $20 = HEAP32[$19>>2]|0;
  $21 = ($20|0)==(0);
  if ($21) {
   $23 = ((($0)) + 44|0);
   $24 = HEAP32[$23>>2]|0;
   HEAP32[$23>>2] = $6;
   $25 = ((($0)) + 28|0);
   HEAP32[$25>>2] = $6;
   $26 = ((($0)) + 20|0);
   HEAP32[$26>>2] = $6;
   HEAP32[$19>>2] = 80;
   $27 = ((($6)) + 80|0);
   $28 = ((($0)) + 16|0);
   HEAP32[$28>>2] = $27;
   $29 = (_printf_core($0,$1,$3,$5,$4)|0);
   $30 = ($24|0)==(0|0);
   if ($30) {
    $$1 = $29;
   } else {
    $31 = ((($0)) + 36|0);
    $32 = HEAP32[$31>>2]|0;
    (FUNCTION_TABLE_iiii[$32 & 31]($0,0,0)|0);
    $33 = HEAP32[$26>>2]|0;
    $34 = ($33|0)==(0|0);
    $$ = $34 ? -1 : $29;
    HEAP32[$23>>2] = $24;
    HEAP32[$19>>2] = 0;
    HEAP32[$28>>2] = 0;
    HEAP32[$25>>2] = 0;
    HEAP32[$26>>2] = 0;
    $$1 = $$;
   }
  } else {
   $22 = (_printf_core($0,$1,$3,$5,$4)|0);
   $$1 = $22;
  }
  $35 = HEAP32[$0>>2]|0;
  $36 = $35 & 32;
  $37 = ($36|0)==(0);
  $$1$ = $37 ? $$1 : -1;
  $38 = $35 | $14;
  HEAP32[$0>>2] = $38;
  $40 = ($39|0)==(0);
  if (!($40)) {
   ___unlockfile($0);
  }
  $$0 = $$1$;
 }
 STACKTOP = sp;return ($$0|0);
}
function _printf_core($0,$1,$2,$3,$4) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 var $$ = 0, $$$0259 = 0, $$$0262 = 0, $$$0269 = 0, $$$3484$i = 0, $$$3484705$i = 0, $$$3484706$i = 0, $$$3501$i = 0, $$$4266 = 0, $$$4502$i = 0, $$$5 = 0, $$$i = 0, $$0 = 0, $$0$i = 0, $$0$lcssa$i300 = 0, $$0228 = 0, $$0229396 = 0, $$0232 = 0, $$0235 = 0, $$0237 = 0;
 var $$0240$lcssa = 0, $$0240$lcssa460 = 0, $$0240395 = 0, $$0243 = 0, $$0247 = 0, $$0249$lcssa = 0, $$0249383 = 0, $$0252 = 0, $$0253 = 0, $$0254 = 0, $$0254$ = 0, $$0259 = 0, $$0262342 = 0, $$0262390 = 0, $$0269 = 0, $$0269$phi = 0, $$0321 = 0, $$0463$lcssa$i = 0, $$0463594$i = 0, $$0464603$i = 0;
 var $$0466$i = +0, $$0470$i = 0, $$0471$i = +0, $$0479$i = 0, $$0487652$i = 0, $$0488$i = 0, $$0488663$i = 0, $$0488665$i = 0, $$0496$$9$i = 0, $$0497664$i = 0, $$0498$i = 0, $$05$lcssa$i = 0, $$0509592$i = +0, $$0510$i = 0, $$0511$i = 0, $$0514647$i = 0, $$0520$i = 0, $$0522$$i = 0, $$0522$i = 0, $$0524$i = 0;
 var $$0526$i = 0, $$0528$i = 0, $$0528639$i = 0, $$0528641$i = 0, $$0531646$i = 0, $$056$i = 0, $$06$i = 0, $$06$i290 = 0, $$06$i298 = 0, $$1 = 0, $$1230407 = 0, $$1233 = 0, $$1236 = 0, $$1238 = 0, $$1241406 = 0, $$1244394 = 0, $$1248 = 0, $$1250 = 0, $$1255 = 0, $$1260 = 0;
 var $$1263 = 0, $$1263$ = 0, $$1270 = 0, $$1322 = 0, $$1465$i = 0, $$1467$i = +0, $$1469$i = +0, $$1472$i = +0, $$1480$i = 0, $$1482$lcssa$i = 0, $$1482671$i = 0, $$1489651$i = 0, $$1499$lcssa$i = 0, $$1499670$i = 0, $$1508593$i = 0, $$1512$lcssa$i = 0, $$1512617$i = 0, $$1515$i = 0, $$1521$i = 0, $$1525$i = 0;
 var $$1527$i = 0, $$1529624$i = 0, $$1532$lcssa$i = 0, $$1532640$i = 0, $$1607$i = 0, $$2 = 0, $$2$i = 0, $$2234 = 0, $$2239 = 0, $$2242381 = 0, $$2245 = 0, $$2251 = 0, $$2256 = 0, $$2256$ = 0, $$2261 = 0, $$2271 = 0, $$2323$lcssa = 0, $$2323382 = 0, $$2473$i = +0, $$2476$$545$i = 0;
 var $$2476$$547$i = 0, $$2476$i = 0, $$2483$ph$i = 0, $$2490$lcssa$i = 0, $$2490632$i = 0, $$2500$i = 0, $$2513$i = 0, $$2516628$i = 0, $$2530$i = 0, $$2533627$i = 0, $$3$i = +0, $$3257 = 0, $$3265 = 0, $$3272 = 0, $$331 = 0, $$332 = 0, $$333 = 0, $$3379 = 0, $$3477$i = 0, $$3484$lcssa$i = 0;
 var $$3484658$i = 0, $$3501$lcssa$i = 0, $$3501657$i = 0, $$3534623$i = 0, $$4$i = +0, $$4258458 = 0, $$4266 = 0, $$4325 = 0, $$4478$lcssa$i = 0, $$4478600$i = 0, $$4492$i = 0, $$4502$i = 0, $$4518$i = 0, $$5 = 0, $$5$lcssa$i = 0, $$537$i = 0, $$538$$i = 0, $$538$i = 0, $$541$i = +0, $$544$i = 0;
 var $$546$i = 0, $$5486$lcssa$i = 0, $$5486633$i = 0, $$5493606$i = 0, $$5519$ph$i = 0, $$553$i = 0, $$554$i = 0, $$557$i = +0, $$5611$i = 0, $$6 = 0, $$6$i = 0, $$6268 = 0, $$6494599$i = 0, $$7 = 0, $$7495610$i = 0, $$7505$$i = 0, $$7505$i = 0, $$7505$ph$i = 0, $$8$i = 0, $$9$ph$i = 0;
 var $$lcssa683$i = 0, $$neg$i = 0, $$neg572$i = 0, $$pn$i = 0, $$pr = 0, $$pr$i = 0, $$pr571$i = 0, $$pre = 0, $$pre$i = 0, $$pre$phi704$iZ2D = 0, $$pre452 = 0, $$pre453 = 0, $$pre454 = 0, $$pre697$i = 0, $$pre700$i = 0, $$pre703$i = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0;
 var $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0;
 var $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0;
 var $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0;
 var $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0;
 var $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0;
 var $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0;
 var $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0;
 var $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0;
 var $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0;
 var $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0;
 var $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0;
 var $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0;
 var $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0;
 var $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0;
 var $358 = 0, $359 = 0, $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0, $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = +0, $372 = 0, $373 = 0, $374 = 0, $375 = +0;
 var $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0, $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0, $390 = 0, $391 = 0, $392 = 0, $393 = 0;
 var $394 = 0, $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $40 = 0, $400 = 0, $401 = 0, $402 = 0, $403 = +0, $404 = +0, $405 = 0, $406 = 0, $407 = 0, $408 = 0, $409 = 0, $41 = 0, $410 = 0, $411 = 0;
 var $412 = 0, $413 = 0, $414 = 0, $415 = 0, $416 = 0, $417 = 0, $418 = 0, $419 = +0, $42 = 0, $420 = 0, $421 = 0, $422 = 0, $423 = +0, $424 = +0, $425 = +0, $426 = +0, $427 = +0, $428 = +0, $429 = 0, $43 = 0;
 var $430 = 0, $431 = 0, $432 = 0, $433 = 0, $434 = 0, $435 = 0, $436 = 0, $437 = 0, $438 = 0, $439 = 0, $44 = 0, $440 = 0, $441 = 0, $442 = 0, $443 = 0, $444 = 0, $445 = 0, $446 = 0, $447 = 0, $448 = 0;
 var $449 = 0, $45 = 0, $450 = 0, $451 = 0, $452 = 0, $453 = 0, $454 = +0, $455 = +0, $456 = +0, $457 = 0, $458 = 0, $459 = 0, $46 = 0, $460 = 0, $461 = 0, $462 = 0, $463 = 0, $464 = 0, $465 = 0, $466 = 0;
 var $467 = 0, $468 = 0, $469 = 0, $47 = 0, $470 = 0, $471 = 0, $472 = 0, $473 = 0, $474 = 0, $475 = 0, $476 = 0, $477 = 0, $478 = 0, $479 = 0, $48 = 0, $480 = 0, $481 = 0, $482 = 0, $483 = 0, $484 = 0;
 var $485 = 0, $486 = 0, $487 = +0, $488 = 0, $489 = 0, $49 = 0, $490 = 0, $491 = 0, $492 = 0, $493 = +0, $494 = +0, $495 = +0, $496 = 0, $497 = 0, $498 = 0, $499 = 0, $5 = 0, $50 = 0, $500 = 0, $501 = 0;
 var $502 = 0, $503 = 0, $504 = 0, $505 = 0, $506 = 0, $507 = 0, $508 = 0, $509 = 0, $51 = 0, $510 = 0, $511 = 0, $512 = 0, $513 = 0, $514 = 0, $515 = 0, $516 = 0, $517 = 0, $518 = 0, $519 = 0, $52 = 0;
 var $520 = 0, $521 = 0, $522 = 0, $523 = 0, $524 = 0, $525 = 0, $526 = 0, $527 = 0, $528 = 0, $529 = 0, $53 = 0, $530 = 0, $531 = 0, $532 = 0, $533 = 0, $534 = 0, $535 = 0, $536 = 0, $537 = 0, $538 = 0;
 var $539 = 0, $54 = 0, $540 = 0, $541 = 0, $542 = 0, $543 = 0, $544 = 0, $545 = 0, $546 = 0, $547 = 0, $548 = 0, $549 = 0, $55 = 0, $550 = 0, $551 = 0, $552 = 0, $553 = 0, $554 = 0, $555 = 0, $556 = 0;
 var $557 = 0, $558 = 0, $559 = 0, $56 = 0, $560 = 0, $561 = 0, $562 = 0, $563 = 0, $564 = 0, $565 = 0, $566 = 0, $567 = 0, $568 = 0, $569 = 0, $57 = 0, $570 = 0, $571 = 0, $572 = 0, $573 = 0, $574 = 0;
 var $575 = 0, $576 = 0, $577 = 0, $578 = 0, $579 = 0, $58 = 0, $580 = 0, $581 = 0, $582 = 0, $583 = 0, $584 = 0, $585 = 0, $586 = 0, $587 = 0, $588 = 0, $589 = 0, $59 = 0, $590 = 0, $591 = 0, $592 = 0;
 var $593 = 0, $594 = 0, $595 = 0, $596 = 0, $597 = 0, $598 = 0, $599 = 0, $6 = 0, $60 = 0, $600 = 0, $601 = 0, $602 = 0, $603 = 0, $604 = 0, $605 = +0, $606 = +0, $607 = 0, $608 = +0, $609 = 0, $61 = 0;
 var $610 = 0, $611 = 0, $612 = 0, $613 = 0, $614 = 0, $615 = 0, $616 = 0, $617 = 0, $618 = 0, $619 = 0, $62 = 0, $620 = 0, $621 = 0, $622 = 0, $623 = 0, $624 = 0, $625 = 0, $626 = 0, $627 = 0, $628 = 0;
 var $629 = 0, $63 = 0, $630 = 0, $631 = 0, $632 = 0, $633 = 0, $634 = 0, $635 = 0, $636 = 0, $637 = 0, $638 = 0, $639 = 0, $64 = 0, $640 = 0, $641 = 0, $642 = 0, $643 = 0, $644 = 0, $645 = 0, $646 = 0;
 var $647 = 0, $648 = 0, $649 = 0, $65 = 0, $650 = 0, $651 = 0, $652 = 0, $653 = 0, $654 = 0, $655 = 0, $656 = 0, $657 = 0, $658 = 0, $659 = 0, $66 = 0, $660 = 0, $661 = 0, $662 = 0, $663 = 0, $664 = 0;
 var $665 = 0, $666 = 0, $667 = 0, $668 = 0, $669 = 0, $67 = 0, $670 = 0, $671 = 0, $672 = 0, $673 = 0, $674 = 0, $675 = 0, $676 = 0, $677 = 0, $678 = 0, $679 = 0, $68 = 0, $680 = 0, $681 = 0, $682 = 0;
 var $683 = 0, $684 = 0, $685 = 0, $686 = 0, $687 = 0, $688 = 0, $689 = 0, $69 = 0, $690 = 0, $691 = 0, $692 = 0, $693 = 0, $694 = 0, $695 = 0, $696 = 0, $697 = 0, $698 = 0, $699 = 0, $7 = 0, $70 = 0;
 var $700 = 0, $701 = 0, $702 = 0, $703 = 0, $704 = 0, $705 = 0, $706 = 0, $707 = 0, $708 = 0, $709 = 0, $71 = 0, $710 = 0, $711 = 0, $712 = 0, $713 = 0, $714 = 0, $715 = 0, $716 = 0, $717 = 0, $718 = 0;
 var $719 = 0, $72 = 0, $720 = 0, $721 = 0, $722 = 0, $723 = 0, $724 = 0, $725 = 0, $726 = 0, $727 = 0, $728 = 0, $729 = 0, $73 = 0, $730 = 0, $731 = 0, $732 = 0, $733 = 0, $734 = 0, $735 = 0, $736 = 0;
 var $737 = 0, $738 = 0, $739 = 0, $74 = 0, $740 = 0, $741 = 0, $742 = 0, $743 = 0, $744 = 0, $745 = 0, $746 = 0, $747 = 0, $748 = 0, $749 = 0, $75 = 0, $750 = 0, $751 = 0, $752 = 0, $753 = 0, $754 = 0;
 var $755 = 0, $756 = 0, $757 = 0, $758 = 0, $759 = 0, $76 = 0, $760 = 0, $761 = 0, $762 = 0, $763 = 0, $764 = 0, $765 = 0, $766 = 0, $767 = 0, $768 = 0, $769 = 0, $77 = 0, $770 = 0, $771 = 0, $772 = 0;
 var $773 = 0, $774 = 0, $775 = 0, $776 = 0, $777 = 0, $778 = 0, $779 = 0, $78 = 0, $780 = 0, $781 = 0, $782 = 0, $783 = 0, $784 = 0, $785 = 0, $786 = 0, $787 = 0, $788 = 0, $789 = 0, $79 = 0, $790 = 0;
 var $791 = 0, $792 = 0, $793 = 0, $794 = 0, $795 = 0, $796 = 0, $797 = 0, $798 = 0, $799 = 0, $8 = 0, $80 = 0, $800 = 0, $801 = 0, $802 = 0, $803 = 0, $804 = 0, $805 = 0, $806 = 0, $807 = 0, $808 = 0;
 var $809 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0;
 var $99 = 0, $arglist_current = 0, $arglist_current2 = 0, $arglist_next = 0, $arglist_next3 = 0, $exitcond$i = 0, $expanded = 0, $expanded10 = 0, $expanded11 = 0, $expanded13 = 0, $expanded14 = 0, $expanded15 = 0, $expanded4 = 0, $expanded6 = 0, $expanded7 = 0, $expanded8 = 0, $isdigit = 0, $isdigit$i = 0, $isdigit$i292 = 0, $isdigit275 = 0;
 var $isdigit277 = 0, $isdigit5$i = 0, $isdigit5$i288 = 0, $isdigittmp = 0, $isdigittmp$ = 0, $isdigittmp$i = 0, $isdigittmp$i291 = 0, $isdigittmp274 = 0, $isdigittmp276 = 0, $isdigittmp4$i = 0, $isdigittmp4$i287 = 0, $isdigittmp7$i = 0, $isdigittmp7$i289 = 0, $notlhs$i = 0, $notrhs$i = 0, $or$cond = 0, $or$cond$i = 0, $or$cond280 = 0, $or$cond282 = 0, $or$cond285 = 0;
 var $or$cond3$not$i = 0, $or$cond412 = 0, $or$cond540$i = 0, $or$cond543$i = 0, $or$cond552$i = 0, $or$cond6$i = 0, $scevgep694$i = 0, $scevgep694695$i = 0, $storemerge = 0, $storemerge273345 = 0, $storemerge273389 = 0, $storemerge278 = 0, $sum = 0, $trunc = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 624|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(624|0);
 $5 = sp + 24|0;
 $6 = sp + 16|0;
 $7 = sp + 588|0;
 $8 = sp + 576|0;
 $9 = sp;
 $10 = sp + 536|0;
 $11 = sp + 8|0;
 $12 = sp + 528|0;
 $13 = ($0|0)!=(0|0);
 $14 = ((($10)) + 40|0);
 $15 = $14;
 $16 = ((($10)) + 39|0);
 $17 = ((($11)) + 4|0);
 $18 = $7;
 $19 = (0 - ($18))|0;
 $20 = ((($8)) + 12|0);
 $21 = ((($8)) + 11|0);
 $22 = $20;
 $23 = (($22) - ($18))|0;
 $24 = (-2 - ($18))|0;
 $25 = (($22) + 2)|0;
 $26 = ((($5)) + 288|0);
 $27 = ((($7)) + 9|0);
 $28 = $27;
 $29 = ((($7)) + 8|0);
 $$0243 = 0;$$0247 = 0;$$0269 = 0;$$0321 = $1;
 L1: while(1) {
  $30 = ($$0247|0)>(-1);
  do {
   if ($30) {
    $31 = (2147483647 - ($$0247))|0;
    $32 = ($$0243|0)>($31|0);
    if ($32) {
     $33 = (___errno_location()|0);
     HEAP32[$33>>2] = 75;
     $$1248 = -1;
     break;
    } else {
     $34 = (($$0243) + ($$0247))|0;
     $$1248 = $34;
     break;
    }
   } else {
    $$1248 = $$0247;
   }
  } while(0);
  $35 = HEAP8[$$0321>>0]|0;
  $36 = ($35<<24>>24)==(0);
  if ($36) {
   label = 243;
   break;
  } else {
   $$1322 = $$0321;$37 = $35;
  }
  L9: while(1) {
   switch ($37<<24>>24) {
   case 37:  {
    $$0249383 = $$1322;$$2323382 = $$1322;
    label = 9;
    break L9;
    break;
   }
   case 0:  {
    $$0249$lcssa = $$1322;$$2323$lcssa = $$1322;
    break L9;
    break;
   }
   default: {
   }
   }
   $38 = ((($$1322)) + 1|0);
   $$pre = HEAP8[$38>>0]|0;
   $$1322 = $38;$37 = $$pre;
  }
  L12: do {
   if ((label|0) == 9) {
    while(1) {
     label = 0;
     $39 = ((($$2323382)) + 1|0);
     $40 = HEAP8[$39>>0]|0;
     $41 = ($40<<24>>24)==(37);
     if (!($41)) {
      $$0249$lcssa = $$0249383;$$2323$lcssa = $$2323382;
      break L12;
     }
     $42 = ((($$0249383)) + 1|0);
     $43 = ((($$2323382)) + 2|0);
     $44 = HEAP8[$43>>0]|0;
     $45 = ($44<<24>>24)==(37);
     if ($45) {
      $$0249383 = $42;$$2323382 = $43;
      label = 9;
     } else {
      $$0249$lcssa = $42;$$2323$lcssa = $43;
      break;
     }
    }
   }
  } while(0);
  $46 = $$0249$lcssa;
  $47 = $$0321;
  $48 = (($46) - ($47))|0;
  if ($13) {
   $49 = HEAP32[$0>>2]|0;
   $50 = $49 & 32;
   $51 = ($50|0)==(0);
   if ($51) {
    (___fwritex($$0321,$48,$0)|0);
   }
  }
  $52 = ($48|0)==(0);
  if (!($52)) {
   $$0269$phi = $$0269;$$0243 = $48;$$0247 = $$1248;$$0321 = $$2323$lcssa;$$0269 = $$0269$phi;
   continue;
  }
  $53 = ((($$2323$lcssa)) + 1|0);
  $54 = HEAP8[$53>>0]|0;
  $55 = $54 << 24 >> 24;
  $isdigittmp = (($55) + -48)|0;
  $isdigit = ($isdigittmp>>>0)<(10);
  if ($isdigit) {
   $56 = ((($$2323$lcssa)) + 2|0);
   $57 = HEAP8[$56>>0]|0;
   $58 = ($57<<24>>24)==(36);
   $59 = ((($$2323$lcssa)) + 3|0);
   $$331 = $58 ? $59 : $53;
   $$$0269 = $58 ? 1 : $$0269;
   $isdigittmp$ = $58 ? $isdigittmp : -1;
   $$pre452 = HEAP8[$$331>>0]|0;
   $$0253 = $isdigittmp$;$$1270 = $$$0269;$61 = $$pre452;$storemerge = $$331;
  } else {
   $$0253 = -1;$$1270 = $$0269;$61 = $54;$storemerge = $53;
  }
  $60 = $61 << 24 >> 24;
  $62 = (($60) + -32)|0;
  $63 = ($62>>>0)<(32);
  L25: do {
   if ($63) {
    $$0262390 = 0;$65 = $62;$69 = $61;$storemerge273389 = $storemerge;
    while(1) {
     $64 = 1 << $65;
     $66 = $64 & 75913;
     $67 = ($66|0)==(0);
     if ($67) {
      $$0262342 = $$0262390;$78 = $69;$storemerge273345 = $storemerge273389;
      break L25;
     }
     $68 = $69 << 24 >> 24;
     $70 = (($68) + -32)|0;
     $71 = 1 << $70;
     $72 = $71 | $$0262390;
     $73 = ((($storemerge273389)) + 1|0);
     $74 = HEAP8[$73>>0]|0;
     $75 = $74 << 24 >> 24;
     $76 = (($75) + -32)|0;
     $77 = ($76>>>0)<(32);
     if ($77) {
      $$0262390 = $72;$65 = $76;$69 = $74;$storemerge273389 = $73;
     } else {
      $$0262342 = $72;$78 = $74;$storemerge273345 = $73;
      break;
     }
    }
   } else {
    $$0262342 = 0;$78 = $61;$storemerge273345 = $storemerge;
   }
  } while(0);
  $79 = ($78<<24>>24)==(42);
  do {
   if ($79) {
    $80 = ((($storemerge273345)) + 1|0);
    $81 = HEAP8[$80>>0]|0;
    $82 = $81 << 24 >> 24;
    $isdigittmp276 = (($82) + -48)|0;
    $isdigit277 = ($isdigittmp276>>>0)<(10);
    if ($isdigit277) {
     $83 = ((($storemerge273345)) + 2|0);
     $84 = HEAP8[$83>>0]|0;
     $85 = ($84<<24>>24)==(36);
     if ($85) {
      $86 = (($4) + ($isdigittmp276<<2)|0);
      HEAP32[$86>>2] = 10;
      $87 = HEAP8[$80>>0]|0;
      $88 = $87 << 24 >> 24;
      $89 = (($88) + -48)|0;
      $90 = (($3) + ($89<<3)|0);
      $91 = $90;
      $92 = $91;
      $93 = HEAP32[$92>>2]|0;
      $94 = (($91) + 4)|0;
      $95 = $94;
      $96 = HEAP32[$95>>2]|0;
      $97 = ((($storemerge273345)) + 3|0);
      $$0259 = $93;$$2271 = 1;$storemerge278 = $97;
     } else {
      label = 24;
     }
    } else {
     label = 24;
    }
    if ((label|0) == 24) {
     label = 0;
     $98 = ($$1270|0)==(0);
     if (!($98)) {
      $$0 = -1;
      break L1;
     }
     if (!($13)) {
      $$1260 = 0;$$1263 = $$0262342;$$3272 = 0;$$4325 = $80;$$pr = $81;
      break;
     }
     $arglist_current = HEAP32[$2>>2]|0;
     $99 = $arglist_current;
     $100 = ((0) + 4|0);
     $expanded4 = $100;
     $expanded = (($expanded4) - 1)|0;
     $101 = (($99) + ($expanded))|0;
     $102 = ((0) + 4|0);
     $expanded8 = $102;
     $expanded7 = (($expanded8) - 1)|0;
     $expanded6 = $expanded7 ^ -1;
     $103 = $101 & $expanded6;
     $104 = $103;
     $105 = HEAP32[$104>>2]|0;
     $arglist_next = ((($104)) + 4|0);
     HEAP32[$2>>2] = $arglist_next;
     $$0259 = $105;$$2271 = 0;$storemerge278 = $80;
    }
    $106 = ($$0259|0)<(0);
    $107 = $$0262342 | 8192;
    $108 = (0 - ($$0259))|0;
    $$$0262 = $106 ? $107 : $$0262342;
    $$$0259 = $106 ? $108 : $$0259;
    $$pre453 = HEAP8[$storemerge278>>0]|0;
    $$1260 = $$$0259;$$1263 = $$$0262;$$3272 = $$2271;$$4325 = $storemerge278;$$pr = $$pre453;
   } else {
    $109 = $78 << 24 >> 24;
    $isdigittmp4$i = (($109) + -48)|0;
    $isdigit5$i = ($isdigittmp4$i>>>0)<(10);
    if ($isdigit5$i) {
     $$06$i = 0;$113 = $storemerge273345;$isdigittmp7$i = $isdigittmp4$i;
     while(1) {
      $110 = ($$06$i*10)|0;
      $111 = (($110) + ($isdigittmp7$i))|0;
      $112 = ((($113)) + 1|0);
      $114 = HEAP8[$112>>0]|0;
      $115 = $114 << 24 >> 24;
      $isdigittmp$i = (($115) + -48)|0;
      $isdigit$i = ($isdigittmp$i>>>0)<(10);
      if ($isdigit$i) {
       $$06$i = $111;$113 = $112;$isdigittmp7$i = $isdigittmp$i;
      } else {
       break;
      }
     }
     $116 = ($111|0)<(0);
     if ($116) {
      $$0 = -1;
      break L1;
     } else {
      $$1260 = $111;$$1263 = $$0262342;$$3272 = $$1270;$$4325 = $112;$$pr = $114;
     }
    } else {
     $$1260 = 0;$$1263 = $$0262342;$$3272 = $$1270;$$4325 = $storemerge273345;$$pr = $78;
    }
   }
  } while(0);
  $117 = ($$pr<<24>>24)==(46);
  L45: do {
   if ($117) {
    $118 = ((($$4325)) + 1|0);
    $119 = HEAP8[$118>>0]|0;
    $120 = ($119<<24>>24)==(42);
    if (!($120)) {
     $147 = $119 << 24 >> 24;
     $isdigittmp4$i287 = (($147) + -48)|0;
     $isdigit5$i288 = ($isdigittmp4$i287>>>0)<(10);
     if ($isdigit5$i288) {
      $$06$i290 = 0;$151 = $118;$isdigittmp7$i289 = $isdigittmp4$i287;
     } else {
      $$0254 = 0;$$6 = $118;
      break;
     }
     while(1) {
      $148 = ($$06$i290*10)|0;
      $149 = (($148) + ($isdigittmp7$i289))|0;
      $150 = ((($151)) + 1|0);
      $152 = HEAP8[$150>>0]|0;
      $153 = $152 << 24 >> 24;
      $isdigittmp$i291 = (($153) + -48)|0;
      $isdigit$i292 = ($isdigittmp$i291>>>0)<(10);
      if ($isdigit$i292) {
       $$06$i290 = $149;$151 = $150;$isdigittmp7$i289 = $isdigittmp$i291;
      } else {
       $$0254 = $149;$$6 = $150;
       break L45;
      }
     }
    }
    $121 = ((($$4325)) + 2|0);
    $122 = HEAP8[$121>>0]|0;
    $123 = $122 << 24 >> 24;
    $isdigittmp274 = (($123) + -48)|0;
    $isdigit275 = ($isdigittmp274>>>0)<(10);
    if ($isdigit275) {
     $124 = ((($$4325)) + 3|0);
     $125 = HEAP8[$124>>0]|0;
     $126 = ($125<<24>>24)==(36);
     if ($126) {
      $127 = (($4) + ($isdigittmp274<<2)|0);
      HEAP32[$127>>2] = 10;
      $128 = HEAP8[$121>>0]|0;
      $129 = $128 << 24 >> 24;
      $130 = (($129) + -48)|0;
      $131 = (($3) + ($130<<3)|0);
      $132 = $131;
      $133 = $132;
      $134 = HEAP32[$133>>2]|0;
      $135 = (($132) + 4)|0;
      $136 = $135;
      $137 = HEAP32[$136>>2]|0;
      $138 = ((($$4325)) + 4|0);
      $$0254 = $134;$$6 = $138;
      break;
     }
    }
    $139 = ($$3272|0)==(0);
    if (!($139)) {
     $$0 = -1;
     break L1;
    }
    if ($13) {
     $arglist_current2 = HEAP32[$2>>2]|0;
     $140 = $arglist_current2;
     $141 = ((0) + 4|0);
     $expanded11 = $141;
     $expanded10 = (($expanded11) - 1)|0;
     $142 = (($140) + ($expanded10))|0;
     $143 = ((0) + 4|0);
     $expanded15 = $143;
     $expanded14 = (($expanded15) - 1)|0;
     $expanded13 = $expanded14 ^ -1;
     $144 = $142 & $expanded13;
     $145 = $144;
     $146 = HEAP32[$145>>2]|0;
     $arglist_next3 = ((($145)) + 4|0);
     HEAP32[$2>>2] = $arglist_next3;
     $$0254 = $146;$$6 = $121;
    } else {
     $$0254 = 0;$$6 = $121;
    }
   } else {
    $$0254 = -1;$$6 = $$4325;
   }
  } while(0);
  $$0252 = 0;$$7 = $$6;
  while(1) {
   $154 = HEAP8[$$7>>0]|0;
   $155 = $154 << 24 >> 24;
   $156 = (($155) + -65)|0;
   $157 = ($156>>>0)>(57);
   if ($157) {
    $$0 = -1;
    break L1;
   }
   $158 = ((($$7)) + 1|0);
   $159 = ((8761 + (($$0252*58)|0)|0) + ($156)|0);
   $160 = HEAP8[$159>>0]|0;
   $161 = $160&255;
   $162 = (($161) + -1)|0;
   $163 = ($162>>>0)<(8);
   if ($163) {
    $$0252 = $161;$$7 = $158;
   } else {
    break;
   }
  }
  $164 = ($160<<24>>24)==(0);
  if ($164) {
   $$0 = -1;
   break;
  }
  $165 = ($160<<24>>24)==(19);
  $166 = ($$0253|0)>(-1);
  do {
   if ($165) {
    if ($166) {
     $$0 = -1;
     break L1;
    } else {
     label = 51;
    }
   } else {
    if ($166) {
     $167 = (($4) + ($$0253<<2)|0);
     HEAP32[$167>>2] = $161;
     $168 = (($3) + ($$0253<<3)|0);
     $169 = $168;
     $170 = $169;
     $171 = HEAP32[$170>>2]|0;
     $172 = (($169) + 4)|0;
     $173 = $172;
     $174 = HEAP32[$173>>2]|0;
     $175 = $9;
     $176 = $175;
     HEAP32[$176>>2] = $171;
     $177 = (($175) + 4)|0;
     $178 = $177;
     HEAP32[$178>>2] = $174;
     label = 51;
     break;
    }
    if (!($13)) {
     $$0 = 0;
     break L1;
    }
    _pop_arg($9,$161,$2);
   }
  } while(0);
  if ((label|0) == 51) {
   label = 0;
   if (!($13)) {
    $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$$0321 = $158;
    continue;
   }
  }
  $179 = HEAP8[$$7>>0]|0;
  $180 = $179 << 24 >> 24;
  $181 = ($$0252|0)!=(0);
  $182 = $180 & 15;
  $183 = ($182|0)==(3);
  $or$cond280 = $181 & $183;
  $184 = $180 & -33;
  $$0235 = $or$cond280 ? $184 : $180;
  $185 = $$1263 & 8192;
  $186 = ($185|0)==(0);
  $187 = $$1263 & -65537;
  $$1263$ = $186 ? $$1263 : $187;
  L74: do {
   switch ($$0235|0) {
   case 110:  {
    $trunc = $$0252&255;
    switch ($trunc<<24>>24) {
    case 0:  {
     $194 = HEAP32[$9>>2]|0;
     HEAP32[$194>>2] = $$1248;
     $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$$0321 = $158;
     continue L1;
     break;
    }
    case 1:  {
     $195 = HEAP32[$9>>2]|0;
     HEAP32[$195>>2] = $$1248;
     $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$$0321 = $158;
     continue L1;
     break;
    }
    case 2:  {
     $196 = ($$1248|0)<(0);
     $197 = $196 << 31 >> 31;
     $198 = HEAP32[$9>>2]|0;
     $199 = $198;
     $200 = $199;
     HEAP32[$200>>2] = $$1248;
     $201 = (($199) + 4)|0;
     $202 = $201;
     HEAP32[$202>>2] = $197;
     $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$$0321 = $158;
     continue L1;
     break;
    }
    case 3:  {
     $203 = $$1248&65535;
     $204 = HEAP32[$9>>2]|0;
     HEAP16[$204>>1] = $203;
     $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$$0321 = $158;
     continue L1;
     break;
    }
    case 4:  {
     $205 = $$1248&255;
     $206 = HEAP32[$9>>2]|0;
     HEAP8[$206>>0] = $205;
     $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$$0321 = $158;
     continue L1;
     break;
    }
    case 6:  {
     $207 = HEAP32[$9>>2]|0;
     HEAP32[$207>>2] = $$1248;
     $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$$0321 = $158;
     continue L1;
     break;
    }
    case 7:  {
     $208 = ($$1248|0)<(0);
     $209 = $208 << 31 >> 31;
     $210 = HEAP32[$9>>2]|0;
     $211 = $210;
     $212 = $211;
     HEAP32[$212>>2] = $$1248;
     $213 = (($211) + 4)|0;
     $214 = $213;
     HEAP32[$214>>2] = $209;
     $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$$0321 = $158;
     continue L1;
     break;
    }
    default: {
     $$0243 = 0;$$0247 = $$1248;$$0269 = $$3272;$$0321 = $158;
     continue L1;
    }
    }
    break;
   }
   case 112:  {
    $215 = ($$0254>>>0)>(8);
    $216 = $215 ? $$0254 : 8;
    $217 = $$1263$ | 8;
    $$1236 = 120;$$1255 = $216;$$3265 = $217;
    label = 63;
    break;
   }
   case 88: case 120:  {
    $$1236 = $$0235;$$1255 = $$0254;$$3265 = $$1263$;
    label = 63;
    break;
   }
   case 111:  {
    $257 = $9;
    $258 = $257;
    $259 = HEAP32[$258>>2]|0;
    $260 = (($257) + 4)|0;
    $261 = $260;
    $262 = HEAP32[$261>>2]|0;
    $263 = ($259|0)==(0);
    $264 = ($262|0)==(0);
    $265 = $263 & $264;
    if ($265) {
     $$0$lcssa$i300 = $14;
    } else {
     $$06$i298 = $14;$267 = $259;$271 = $262;
     while(1) {
      $266 = $267 & 7;
      $268 = $266 | 48;
      $269 = $268&255;
      $270 = ((($$06$i298)) + -1|0);
      HEAP8[$270>>0] = $269;
      $272 = (_bitshift64Lshr(($267|0),($271|0),3)|0);
      $273 = tempRet0;
      $274 = ($272|0)==(0);
      $275 = ($273|0)==(0);
      $276 = $274 & $275;
      if ($276) {
       $$0$lcssa$i300 = $270;
       break;
      } else {
       $$06$i298 = $270;$267 = $272;$271 = $273;
      }
     }
    }
    $277 = $$1263$ & 8;
    $278 = ($277|0)==(0);
    if ($278) {
     $$0228 = $$0$lcssa$i300;$$1233 = 0;$$1238 = 9241;$$2256 = $$0254;$$4266 = $$1263$;
     label = 76;
    } else {
     $279 = $$0$lcssa$i300;
     $280 = (($15) - ($279))|0;
     $281 = ($$0254|0)>($280|0);
     $282 = (($280) + 1)|0;
     $$0254$ = $281 ? $$0254 : $282;
     $$0228 = $$0$lcssa$i300;$$1233 = 0;$$1238 = 9241;$$2256 = $$0254$;$$4266 = $$1263$;
     label = 76;
    }
    break;
   }
   case 105: case 100:  {
    $283 = $9;
    $284 = $283;
    $285 = HEAP32[$284>>2]|0;
    $286 = (($283) + 4)|0;
    $287 = $286;
    $288 = HEAP32[$287>>2]|0;
    $289 = ($288|0)<(0);
    if ($289) {
     $290 = (_i64Subtract(0,0,($285|0),($288|0))|0);
     $291 = tempRet0;
     $292 = $9;
     $293 = $292;
     HEAP32[$293>>2] = $290;
     $294 = (($292) + 4)|0;
     $295 = $294;
     HEAP32[$295>>2] = $291;
     $$0232 = 1;$$0237 = 9241;$300 = $290;$301 = $291;
     label = 75;
     break L74;
    }
    $296 = $$1263$ & 2048;
    $297 = ($296|0)==(0);
    if ($297) {
     $298 = $$1263$ & 1;
     $299 = ($298|0)==(0);
     $$ = $299 ? 9241 : (9243);
     $$0232 = $298;$$0237 = $$;$300 = $285;$301 = $288;
     label = 75;
    } else {
     $$0232 = 1;$$0237 = (9242);$300 = $285;$301 = $288;
     label = 75;
    }
    break;
   }
   case 117:  {
    $188 = $9;
    $189 = $188;
    $190 = HEAP32[$189>>2]|0;
    $191 = (($188) + 4)|0;
    $192 = $191;
    $193 = HEAP32[$192>>2]|0;
    $$0232 = 0;$$0237 = 9241;$300 = $190;$301 = $193;
    label = 75;
    break;
   }
   case 99:  {
    $321 = $9;
    $322 = $321;
    $323 = HEAP32[$322>>2]|0;
    $324 = (($321) + 4)|0;
    $325 = $324;
    $326 = HEAP32[$325>>2]|0;
    $327 = $323&255;
    HEAP8[$16>>0] = $327;
    $$2 = $16;$$2234 = 0;$$2239 = 9241;$$2251 = $14;$$5 = 1;$$6268 = $187;
    break;
   }
   case 109:  {
    $328 = (___errno_location()|0);
    $329 = HEAP32[$328>>2]|0;
    $330 = (_strerror($329)|0);
    $$1 = $330;
    label = 81;
    break;
   }
   case 115:  {
    $331 = HEAP32[$9>>2]|0;
    $332 = ($331|0)!=(0|0);
    $333 = $332 ? $331 : 9251;
    $$1 = $333;
    label = 81;
    break;
   }
   case 67:  {
    $340 = $9;
    $341 = $340;
    $342 = HEAP32[$341>>2]|0;
    $343 = (($340) + 4)|0;
    $344 = $343;
    $345 = HEAP32[$344>>2]|0;
    HEAP32[$11>>2] = $342;
    HEAP32[$17>>2] = 0;
    HEAP32[$9>>2] = $11;
    $$4258458 = -1;$809 = $11;
    label = 85;
    break;
   }
   case 83:  {
    $$pre454 = HEAP32[$9>>2]|0;
    $346 = ($$0254|0)==(0);
    if ($346) {
     _pad($0,32,$$1260,0,$$1263$);
     $$0240$lcssa460 = 0;
     label = 96;
    } else {
     $$4258458 = $$0254;$809 = $$pre454;
     label = 85;
    }
    break;
   }
   case 65: case 71: case 70: case 69: case 97: case 103: case 102: case 101:  {
    $371 = +HEAPF64[$9>>3];
    HEAP32[$6>>2] = 0;
    HEAPF64[tempDoublePtr>>3] = $371;$372 = HEAP32[tempDoublePtr>>2]|0;
    $373 = HEAP32[tempDoublePtr+4>>2]|0;
    $374 = ($373|0)<(0);
    if ($374) {
     $375 = -$371;
     $$0471$i = $375;$$0520$i = 1;$$0522$i = 9258;
    } else {
     $376 = $$1263$ & 2048;
     $377 = ($376|0)==(0);
     $378 = $$1263$ & 1;
     if ($377) {
      $379 = ($378|0)==(0);
      $$$i = $379 ? (9259) : (9264);
      $$0471$i = $371;$$0520$i = $378;$$0522$i = $$$i;
     } else {
      $$0471$i = $371;$$0520$i = 1;$$0522$i = (9261);
     }
    }
    HEAPF64[tempDoublePtr>>3] = $$0471$i;$380 = HEAP32[tempDoublePtr>>2]|0;
    $381 = HEAP32[tempDoublePtr+4>>2]|0;
    $382 = $381 & 2146435072;
    $383 = ($382>>>0)<(2146435072);
    $384 = (0)<(0);
    $385 = ($382|0)==(2146435072);
    $386 = $385 & $384;
    $387 = $383 | $386;
    do {
     if ($387) {
      $403 = (+_frexpl($$0471$i,$6));
      $404 = $403 * +2;
      $405 = $404 != +0;
      if ($405) {
       $406 = HEAP32[$6>>2]|0;
       $407 = (($406) + -1)|0;
       HEAP32[$6>>2] = $407;
      }
      $408 = $$0235 | 32;
      $409 = ($408|0)==(97);
      if ($409) {
       $410 = $$0235 & 32;
       $411 = ($410|0)==(0);
       $412 = ((($$0522$i)) + 9|0);
       $$0522$$i = $411 ? $$0522$i : $412;
       $413 = $$0520$i | 2;
       $414 = ($$0254>>>0)>(11);
       $415 = (12 - ($$0254))|0;
       $416 = ($415|0)==(0);
       $417 = $414 | $416;
       do {
        if ($417) {
         $$1472$i = $404;
        } else {
         $$0509592$i = +8;$$1508593$i = $415;
         while(1) {
          $418 = (($$1508593$i) + -1)|0;
          $419 = $$0509592$i * +16;
          $420 = ($418|0)==(0);
          if ($420) {
           break;
          } else {
           $$0509592$i = $419;$$1508593$i = $418;
          }
         }
         $421 = HEAP8[$$0522$$i>>0]|0;
         $422 = ($421<<24>>24)==(45);
         if ($422) {
          $423 = -$404;
          $424 = $423 - $419;
          $425 = $419 + $424;
          $426 = -$425;
          $$1472$i = $426;
          break;
         } else {
          $427 = $404 + $419;
          $428 = $427 - $419;
          $$1472$i = $428;
          break;
         }
        }
       } while(0);
       $429 = HEAP32[$6>>2]|0;
       $430 = ($429|0)<(0);
       $431 = (0 - ($429))|0;
       $432 = $430 ? $431 : $429;
       $433 = ($432|0)<(0);
       $434 = $433 << 31 >> 31;
       $435 = (_fmt_u($432,$434,$20)|0);
       $436 = ($435|0)==($20|0);
       if ($436) {
        HEAP8[$21>>0] = 48;
        $$0511$i = $21;
       } else {
        $$0511$i = $435;
       }
       $437 = $429 >> 31;
       $438 = $437 & 2;
       $439 = (($438) + 43)|0;
       $440 = $439&255;
       $441 = ((($$0511$i)) + -1|0);
       HEAP8[$441>>0] = $440;
       $442 = (($$0235) + 15)|0;
       $443 = $442&255;
       $444 = ((($$0511$i)) + -2|0);
       HEAP8[$444>>0] = $443;
       $notrhs$i = ($$0254|0)<(1);
       $445 = $$1263$ & 8;
       $446 = ($445|0)==(0);
       $$0524$i = $7;$$2473$i = $$1472$i;
       while(1) {
        $447 = (~~(($$2473$i)));
        $448 = (9225 + ($447)|0);
        $449 = HEAP8[$448>>0]|0;
        $450 = $449&255;
        $451 = $450 | $410;
        $452 = $451&255;
        $453 = ((($$0524$i)) + 1|0);
        HEAP8[$$0524$i>>0] = $452;
        $454 = (+($447|0));
        $455 = $$2473$i - $454;
        $456 = $455 * +16;
        $457 = $453;
        $458 = (($457) - ($18))|0;
        $459 = ($458|0)==(1);
        do {
         if ($459) {
          $notlhs$i = $456 == +0;
          $or$cond3$not$i = $notrhs$i & $notlhs$i;
          $or$cond$i = $446 & $or$cond3$not$i;
          if ($or$cond$i) {
           $$1525$i = $453;
           break;
          }
          $460 = ((($$0524$i)) + 2|0);
          HEAP8[$453>>0] = 46;
          $$1525$i = $460;
         } else {
          $$1525$i = $453;
         }
        } while(0);
        $461 = $456 != +0;
        if ($461) {
         $$0524$i = $$1525$i;$$2473$i = $456;
        } else {
         break;
        }
       }
       $462 = ($$0254|0)!=(0);
       $$pre700$i = $$1525$i;
       $463 = (($24) + ($$pre700$i))|0;
       $464 = ($463|0)<($$0254|0);
       $or$cond412 = $462 & $464;
       $465 = $444;
       $466 = (($25) + ($$0254))|0;
       $467 = (($466) - ($465))|0;
       $468 = (($23) - ($465))|0;
       $469 = (($468) + ($$pre700$i))|0;
       $$0526$i = $or$cond412 ? $467 : $469;
       $470 = (($$0526$i) + ($413))|0;
       _pad($0,32,$$1260,$470,$$1263$);
       $471 = HEAP32[$0>>2]|0;
       $472 = $471 & 32;
       $473 = ($472|0)==(0);
       if ($473) {
        (___fwritex($$0522$$i,$413,$0)|0);
       }
       $474 = $$1263$ ^ 65536;
       _pad($0,48,$$1260,$470,$474);
       $475 = (($$pre700$i) - ($18))|0;
       $476 = HEAP32[$0>>2]|0;
       $477 = $476 & 32;
       $478 = ($477|0)==(0);
       if ($478) {
        (___fwritex($7,$475,$0)|0);
       }
       $479 = (($22) - ($465))|0;
       $sum = (($475) + ($479))|0;
       $480 = (($$0526$i) - ($sum))|0;
       _pad($0,48,$480,0,0);
       $481 = HEAP32[$0>>2]|0;
       $482 = $481 & 32;
       $483 = ($482|0)==(0);
       if ($483) {
        (___fwritex($444,$479,$0)|0);
       }
       $484 = $$1263$ ^ 8192;
       _pad($0,32,$$1260,$470,$484);
       $485 = ($470|0)<($$1260|0);
       $$537$i = $485 ? $$1260 : $470;
       $$0470$i = $$537$i;
       break;
      }
      $486 = ($$0254|0)<(0);
      $$538$i = $486 ? 6 : $$0254;
      if ($405) {
       $487 = $404 * +268435456;
       $488 = HEAP32[$6>>2]|0;
       $489 = (($488) + -28)|0;
       HEAP32[$6>>2] = $489;
       $$3$i = $487;$$pr$i = $489;
      } else {
       $$pre697$i = HEAP32[$6>>2]|0;
       $$3$i = $404;$$pr$i = $$pre697$i;
      }
      $490 = ($$pr$i|0)<(0);
      $$554$i = $490 ? $5 : $26;
      $$0498$i = $$554$i;$$4$i = $$3$i;
      while(1) {
       $491 = (~~(($$4$i))>>>0);
       HEAP32[$$0498$i>>2] = $491;
       $492 = ((($$0498$i)) + 4|0);
       $493 = (+($491>>>0));
       $494 = $$4$i - $493;
       $495 = $494 * +1.0E+9;
       $496 = $495 != +0;
       if ($496) {
        $$0498$i = $492;$$4$i = $495;
       } else {
        break;
       }
      }
      $497 = ($$pr$i|0)>(0);
      if ($497) {
       $$1482671$i = $$554$i;$$1499670$i = $492;$498 = $$pr$i;
       while(1) {
        $499 = ($498|0)>(29);
        $500 = $499 ? 29 : $498;
        $$0488663$i = ((($$1499670$i)) + -4|0);
        $501 = ($$0488663$i>>>0)<($$1482671$i>>>0);
        do {
         if ($501) {
          $$2483$ph$i = $$1482671$i;
         } else {
          $$0488665$i = $$0488663$i;$$0497664$i = 0;
          while(1) {
           $502 = HEAP32[$$0488665$i>>2]|0;
           $503 = (_bitshift64Shl(($502|0),0,($500|0))|0);
           $504 = tempRet0;
           $505 = (_i64Add(($503|0),($504|0),($$0497664$i|0),0)|0);
           $506 = tempRet0;
           $507 = (___uremdi3(($505|0),($506|0),1000000000,0)|0);
           $508 = tempRet0;
           HEAP32[$$0488665$i>>2] = $507;
           $509 = (___udivdi3(($505|0),($506|0),1000000000,0)|0);
           $510 = tempRet0;
           $$0488$i = ((($$0488665$i)) + -4|0);
           $511 = ($$0488$i>>>0)<($$1482671$i>>>0);
           if ($511) {
            break;
           } else {
            $$0488665$i = $$0488$i;$$0497664$i = $509;
           }
          }
          $512 = ($509|0)==(0);
          if ($512) {
           $$2483$ph$i = $$1482671$i;
           break;
          }
          $513 = ((($$1482671$i)) + -4|0);
          HEAP32[$513>>2] = $509;
          $$2483$ph$i = $513;
         }
        } while(0);
        $$2500$i = $$1499670$i;
        while(1) {
         $514 = ($$2500$i>>>0)>($$2483$ph$i>>>0);
         if (!($514)) {
          break;
         }
         $515 = ((($$2500$i)) + -4|0);
         $516 = HEAP32[$515>>2]|0;
         $517 = ($516|0)==(0);
         if ($517) {
          $$2500$i = $515;
         } else {
          break;
         }
        }
        $518 = HEAP32[$6>>2]|0;
        $519 = (($518) - ($500))|0;
        HEAP32[$6>>2] = $519;
        $520 = ($519|0)>(0);
        if ($520) {
         $$1482671$i = $$2483$ph$i;$$1499670$i = $$2500$i;$498 = $519;
        } else {
         $$1482$lcssa$i = $$2483$ph$i;$$1499$lcssa$i = $$2500$i;$$pr571$i = $519;
         break;
        }
       }
      } else {
       $$1482$lcssa$i = $$554$i;$$1499$lcssa$i = $492;$$pr571$i = $$pr$i;
      }
      $521 = ($$pr571$i|0)<(0);
      if ($521) {
       $522 = (($$538$i) + 25)|0;
       $523 = (($522|0) / 9)&-1;
       $524 = (($523) + 1)|0;
       $525 = ($408|0)==(102);
       $$3484658$i = $$1482$lcssa$i;$$3501657$i = $$1499$lcssa$i;$527 = $$pr571$i;
       while(1) {
        $526 = (0 - ($527))|0;
        $528 = ($526|0)>(9);
        $529 = $528 ? 9 : $526;
        $530 = ($$3484658$i>>>0)<($$3501657$i>>>0);
        do {
         if ($530) {
          $534 = 1 << $529;
          $535 = (($534) + -1)|0;
          $536 = 1000000000 >>> $529;
          $$0487652$i = 0;$$1489651$i = $$3484658$i;
          while(1) {
           $537 = HEAP32[$$1489651$i>>2]|0;
           $538 = $537 & $535;
           $539 = $537 >>> $529;
           $540 = (($539) + ($$0487652$i))|0;
           HEAP32[$$1489651$i>>2] = $540;
           $541 = Math_imul($538, $536)|0;
           $542 = ((($$1489651$i)) + 4|0);
           $543 = ($542>>>0)<($$3501657$i>>>0);
           if ($543) {
            $$0487652$i = $541;$$1489651$i = $542;
           } else {
            break;
           }
          }
          $544 = HEAP32[$$3484658$i>>2]|0;
          $545 = ($544|0)==(0);
          $546 = ((($$3484658$i)) + 4|0);
          $$$3484$i = $545 ? $546 : $$3484658$i;
          $547 = ($541|0)==(0);
          if ($547) {
           $$$3484706$i = $$$3484$i;$$4502$i = $$3501657$i;
           break;
          }
          $548 = ((($$3501657$i)) + 4|0);
          HEAP32[$$3501657$i>>2] = $541;
          $$$3484706$i = $$$3484$i;$$4502$i = $548;
         } else {
          $531 = HEAP32[$$3484658$i>>2]|0;
          $532 = ($531|0)==(0);
          $533 = ((($$3484658$i)) + 4|0);
          $$$3484705$i = $532 ? $533 : $$3484658$i;
          $$$3484706$i = $$$3484705$i;$$4502$i = $$3501657$i;
         }
        } while(0);
        $549 = $525 ? $$554$i : $$$3484706$i;
        $550 = $$4502$i;
        $551 = $549;
        $552 = (($550) - ($551))|0;
        $553 = $552 >> 2;
        $554 = ($553|0)>($524|0);
        $555 = (($549) + ($524<<2)|0);
        $$$4502$i = $554 ? $555 : $$4502$i;
        $556 = HEAP32[$6>>2]|0;
        $557 = (($556) + ($529))|0;
        HEAP32[$6>>2] = $557;
        $558 = ($557|0)<(0);
        if ($558) {
         $$3484658$i = $$$3484706$i;$$3501657$i = $$$4502$i;$527 = $557;
        } else {
         $$3484$lcssa$i = $$$3484706$i;$$3501$lcssa$i = $$$4502$i;
         break;
        }
       }
      } else {
       $$3484$lcssa$i = $$1482$lcssa$i;$$3501$lcssa$i = $$1499$lcssa$i;
      }
      $559 = ($$3484$lcssa$i>>>0)<($$3501$lcssa$i>>>0);
      $560 = $$554$i;
      do {
       if ($559) {
        $561 = $$3484$lcssa$i;
        $562 = (($560) - ($561))|0;
        $563 = $562 >> 2;
        $564 = ($563*9)|0;
        $565 = HEAP32[$$3484$lcssa$i>>2]|0;
        $566 = ($565>>>0)<(10);
        if ($566) {
         $$1515$i = $564;
         break;
        } else {
         $$0514647$i = $564;$$0531646$i = 10;
        }
        while(1) {
         $567 = ($$0531646$i*10)|0;
         $568 = (($$0514647$i) + 1)|0;
         $569 = ($565>>>0)<($567>>>0);
         if ($569) {
          $$1515$i = $568;
          break;
         } else {
          $$0514647$i = $568;$$0531646$i = $567;
         }
        }
       } else {
        $$1515$i = 0;
       }
      } while(0);
      $570 = ($408|0)!=(102);
      $571 = $570 ? $$1515$i : 0;
      $572 = (($$538$i) - ($571))|0;
      $573 = ($408|0)==(103);
      $574 = ($$538$i|0)!=(0);
      $575 = $574 & $573;
      $$neg$i = $575 << 31 >> 31;
      $576 = (($572) + ($$neg$i))|0;
      $577 = $$3501$lcssa$i;
      $578 = (($577) - ($560))|0;
      $579 = $578 >> 2;
      $580 = ($579*9)|0;
      $581 = (($580) + -9)|0;
      $582 = ($576|0)<($581|0);
      if ($582) {
       $583 = ((($$554$i)) + 4|0);
       $584 = (($576) + 9216)|0;
       $585 = (($584|0) / 9)&-1;
       $586 = (($585) + -1024)|0;
       $587 = (($583) + ($586<<2)|0);
       $588 = (($584|0) % 9)&-1;
       $$0528639$i = (($588) + 1)|0;
       $589 = ($$0528639$i|0)<(9);
       if ($589) {
        $$0528641$i = $$0528639$i;$$1532640$i = 10;
        while(1) {
         $590 = ($$1532640$i*10)|0;
         $$0528$i = (($$0528641$i) + 1)|0;
         $exitcond$i = ($$0528$i|0)==(9);
         if ($exitcond$i) {
          $$1532$lcssa$i = $590;
          break;
         } else {
          $$0528641$i = $$0528$i;$$1532640$i = $590;
         }
        }
       } else {
        $$1532$lcssa$i = 10;
       }
       $591 = HEAP32[$587>>2]|0;
       $592 = (($591>>>0) % ($$1532$lcssa$i>>>0))&-1;
       $593 = ($592|0)==(0);
       $594 = ((($587)) + 4|0);
       $595 = ($594|0)==($$3501$lcssa$i|0);
       $or$cond540$i = $595 & $593;
       do {
        if ($or$cond540$i) {
         $$4492$i = $587;$$4518$i = $$1515$i;$$8$i = $$3484$lcssa$i;
        } else {
         $596 = (($591>>>0) / ($$1532$lcssa$i>>>0))&-1;
         $597 = $596 & 1;
         $598 = ($597|0)==(0);
         $$541$i = $598 ? +9007199254740992 : +9007199254740994;
         $599 = (($$1532$lcssa$i|0) / 2)&-1;
         $600 = ($592>>>0)<($599>>>0);
         if ($600) {
          $$0466$i = +0.5;
         } else {
          $601 = ($592|0)==($599|0);
          $or$cond543$i = $595 & $601;
          $$557$i = $or$cond543$i ? +1 : +1.5;
          $$0466$i = $$557$i;
         }
         $602 = ($$0520$i|0)==(0);
         do {
          if ($602) {
           $$1467$i = $$0466$i;$$1469$i = $$541$i;
          } else {
           $603 = HEAP8[$$0522$i>>0]|0;
           $604 = ($603<<24>>24)==(45);
           if (!($604)) {
            $$1467$i = $$0466$i;$$1469$i = $$541$i;
            break;
           }
           $605 = -$$541$i;
           $606 = -$$0466$i;
           $$1467$i = $606;$$1469$i = $605;
          }
         } while(0);
         $607 = (($591) - ($592))|0;
         HEAP32[$587>>2] = $607;
         $608 = $$1469$i + $$1467$i;
         $609 = $608 != $$1469$i;
         if (!($609)) {
          $$4492$i = $587;$$4518$i = $$1515$i;$$8$i = $$3484$lcssa$i;
          break;
         }
         $610 = (($607) + ($$1532$lcssa$i))|0;
         HEAP32[$587>>2] = $610;
         $611 = ($610>>>0)>(999999999);
         if ($611) {
          $$2490632$i = $587;$$5486633$i = $$3484$lcssa$i;
          while(1) {
           $612 = ((($$2490632$i)) + -4|0);
           HEAP32[$$2490632$i>>2] = 0;
           $613 = ($612>>>0)<($$5486633$i>>>0);
           if ($613) {
            $614 = ((($$5486633$i)) + -4|0);
            HEAP32[$614>>2] = 0;
            $$6$i = $614;
           } else {
            $$6$i = $$5486633$i;
           }
           $615 = HEAP32[$612>>2]|0;
           $616 = (($615) + 1)|0;
           HEAP32[$612>>2] = $616;
           $617 = ($616>>>0)>(999999999);
           if ($617) {
            $$2490632$i = $612;$$5486633$i = $$6$i;
           } else {
            $$2490$lcssa$i = $612;$$5486$lcssa$i = $$6$i;
            break;
           }
          }
         } else {
          $$2490$lcssa$i = $587;$$5486$lcssa$i = $$3484$lcssa$i;
         }
         $618 = $$5486$lcssa$i;
         $619 = (($560) - ($618))|0;
         $620 = $619 >> 2;
         $621 = ($620*9)|0;
         $622 = HEAP32[$$5486$lcssa$i>>2]|0;
         $623 = ($622>>>0)<(10);
         if ($623) {
          $$4492$i = $$2490$lcssa$i;$$4518$i = $621;$$8$i = $$5486$lcssa$i;
          break;
         } else {
          $$2516628$i = $621;$$2533627$i = 10;
         }
         while(1) {
          $624 = ($$2533627$i*10)|0;
          $625 = (($$2516628$i) + 1)|0;
          $626 = ($622>>>0)<($624>>>0);
          if ($626) {
           $$4492$i = $$2490$lcssa$i;$$4518$i = $625;$$8$i = $$5486$lcssa$i;
           break;
          } else {
           $$2516628$i = $625;$$2533627$i = $624;
          }
         }
        }
       } while(0);
       $627 = ((($$4492$i)) + 4|0);
       $628 = ($$3501$lcssa$i>>>0)>($627>>>0);
       $$$3501$i = $628 ? $627 : $$3501$lcssa$i;
       $$5519$ph$i = $$4518$i;$$7505$ph$i = $$$3501$i;$$9$ph$i = $$8$i;
      } else {
       $$5519$ph$i = $$1515$i;$$7505$ph$i = $$3501$lcssa$i;$$9$ph$i = $$3484$lcssa$i;
      }
      $629 = (0 - ($$5519$ph$i))|0;
      $$7505$i = $$7505$ph$i;
      while(1) {
       $630 = ($$7505$i>>>0)>($$9$ph$i>>>0);
       if (!($630)) {
        $$lcssa683$i = 0;
        break;
       }
       $631 = ((($$7505$i)) + -4|0);
       $632 = HEAP32[$631>>2]|0;
       $633 = ($632|0)==(0);
       if ($633) {
        $$7505$i = $631;
       } else {
        $$lcssa683$i = 1;
        break;
       }
      }
      do {
       if ($573) {
        $634 = $574&1;
        $635 = $634 ^ 1;
        $$538$$i = (($635) + ($$538$i))|0;
        $636 = ($$538$$i|0)>($$5519$ph$i|0);
        $637 = ($$5519$ph$i|0)>(-5);
        $or$cond6$i = $636 & $637;
        if ($or$cond6$i) {
         $638 = (($$0235) + -1)|0;
         $$neg572$i = (($$538$$i) + -1)|0;
         $639 = (($$neg572$i) - ($$5519$ph$i))|0;
         $$0479$i = $638;$$2476$i = $639;
        } else {
         $640 = (($$0235) + -2)|0;
         $641 = (($$538$$i) + -1)|0;
         $$0479$i = $640;$$2476$i = $641;
        }
        $642 = $$1263$ & 8;
        $643 = ($642|0)==(0);
        if (!($643)) {
         $$1480$i = $$0479$i;$$3477$i = $$2476$i;$$pre$phi704$iZ2D = $642;
         break;
        }
        do {
         if ($$lcssa683$i) {
          $644 = ((($$7505$i)) + -4|0);
          $645 = HEAP32[$644>>2]|0;
          $646 = ($645|0)==(0);
          if ($646) {
           $$2530$i = 9;
           break;
          }
          $647 = (($645>>>0) % 10)&-1;
          $648 = ($647|0)==(0);
          if ($648) {
           $$1529624$i = 0;$$3534623$i = 10;
          } else {
           $$2530$i = 0;
           break;
          }
          while(1) {
           $649 = ($$3534623$i*10)|0;
           $650 = (($$1529624$i) + 1)|0;
           $651 = (($645>>>0) % ($649>>>0))&-1;
           $652 = ($651|0)==(0);
           if ($652) {
            $$1529624$i = $650;$$3534623$i = $649;
           } else {
            $$2530$i = $650;
            break;
           }
          }
         } else {
          $$2530$i = 9;
         }
        } while(0);
        $653 = $$0479$i | 32;
        $654 = ($653|0)==(102);
        $655 = $$7505$i;
        $656 = (($655) - ($560))|0;
        $657 = $656 >> 2;
        $658 = ($657*9)|0;
        $659 = (($658) + -9)|0;
        if ($654) {
         $660 = (($659) - ($$2530$i))|0;
         $661 = ($660|0)<(0);
         $$544$i = $661 ? 0 : $660;
         $662 = ($$2476$i|0)<($$544$i|0);
         $$2476$$545$i = $662 ? $$2476$i : $$544$i;
         $$1480$i = $$0479$i;$$3477$i = $$2476$$545$i;$$pre$phi704$iZ2D = 0;
         break;
        } else {
         $663 = (($659) + ($$5519$ph$i))|0;
         $664 = (($663) - ($$2530$i))|0;
         $665 = ($664|0)<(0);
         $$546$i = $665 ? 0 : $664;
         $666 = ($$2476$i|0)<($$546$i|0);
         $$2476$$547$i = $666 ? $$2476$i : $$546$i;
         $$1480$i = $$0479$i;$$3477$i = $$2476$$547$i;$$pre$phi704$iZ2D = 0;
         break;
        }
       } else {
        $$pre703$i = $$1263$ & 8;
        $$1480$i = $$0235;$$3477$i = $$538$i;$$pre$phi704$iZ2D = $$pre703$i;
       }
      } while(0);
      $667 = $$3477$i | $$pre$phi704$iZ2D;
      $668 = ($667|0)!=(0);
      $669 = $668&1;
      $670 = $$1480$i | 32;
      $671 = ($670|0)==(102);
      if ($671) {
       $672 = ($$5519$ph$i|0)>(0);
       $673 = $672 ? $$5519$ph$i : 0;
       $$2513$i = 0;$$pn$i = $673;
      } else {
       $674 = ($$5519$ph$i|0)<(0);
       $675 = $674 ? $629 : $$5519$ph$i;
       $676 = ($675|0)<(0);
       $677 = $676 << 31 >> 31;
       $678 = (_fmt_u($675,$677,$20)|0);
       $679 = $678;
       $680 = (($22) - ($679))|0;
       $681 = ($680|0)<(2);
       if ($681) {
        $$1512617$i = $678;
        while(1) {
         $682 = ((($$1512617$i)) + -1|0);
         HEAP8[$682>>0] = 48;
         $683 = $682;
         $684 = (($22) - ($683))|0;
         $685 = ($684|0)<(2);
         if ($685) {
          $$1512617$i = $682;
         } else {
          $$1512$lcssa$i = $682;
          break;
         }
        }
       } else {
        $$1512$lcssa$i = $678;
       }
       $686 = $$5519$ph$i >> 31;
       $687 = $686 & 2;
       $688 = (($687) + 43)|0;
       $689 = $688&255;
       $690 = ((($$1512$lcssa$i)) + -1|0);
       HEAP8[$690>>0] = $689;
       $691 = $$1480$i&255;
       $692 = ((($$1512$lcssa$i)) + -2|0);
       HEAP8[$692>>0] = $691;
       $693 = $692;
       $694 = (($22) - ($693))|0;
       $$2513$i = $692;$$pn$i = $694;
      }
      $695 = (($$0520$i) + 1)|0;
      $696 = (($695) + ($$3477$i))|0;
      $$1527$i = (($696) + ($669))|0;
      $697 = (($$1527$i) + ($$pn$i))|0;
      _pad($0,32,$$1260,$697,$$1263$);
      $698 = HEAP32[$0>>2]|0;
      $699 = $698 & 32;
      $700 = ($699|0)==(0);
      if ($700) {
       (___fwritex($$0522$i,$$0520$i,$0)|0);
      }
      $701 = $$1263$ ^ 65536;
      _pad($0,48,$$1260,$697,$701);
      do {
       if ($671) {
        $702 = ($$9$ph$i>>>0)>($$554$i>>>0);
        $$0496$$9$i = $702 ? $$554$i : $$9$ph$i;
        $$5493606$i = $$0496$$9$i;
        while(1) {
         $703 = HEAP32[$$5493606$i>>2]|0;
         $704 = (_fmt_u($703,0,$27)|0);
         $705 = ($$5493606$i|0)==($$0496$$9$i|0);
         do {
          if ($705) {
           $711 = ($704|0)==($27|0);
           if (!($711)) {
            $$1465$i = $704;
            break;
           }
           HEAP8[$29>>0] = 48;
           $$1465$i = $29;
          } else {
           $706 = ($704>>>0)>($7>>>0);
           if (!($706)) {
            $$1465$i = $704;
            break;
           }
           $707 = $704;
           $708 = (($707) - ($18))|0;
           _memset(($7|0),48,($708|0))|0;
           $$0464603$i = $704;
           while(1) {
            $709 = ((($$0464603$i)) + -1|0);
            $710 = ($709>>>0)>($7>>>0);
            if ($710) {
             $$0464603$i = $709;
            } else {
             $$1465$i = $709;
             break;
            }
           }
          }
         } while(0);
         $712 = HEAP32[$0>>2]|0;
         $713 = $712 & 32;
         $714 = ($713|0)==(0);
         if ($714) {
          $715 = $$1465$i;
          $716 = (($28) - ($715))|0;
          (___fwritex($$1465$i,$716,$0)|0);
         }
         $717 = ((($$5493606$i)) + 4|0);
         $718 = ($717>>>0)>($$554$i>>>0);
         if ($718) {
          break;
         } else {
          $$5493606$i = $717;
         }
        }
        $719 = ($667|0)==(0);
        do {
         if (!($719)) {
          $720 = HEAP32[$0>>2]|0;
          $721 = $720 & 32;
          $722 = ($721|0)==(0);
          if (!($722)) {
           break;
          }
          (___fwritex(9293,1,$0)|0);
         }
        } while(0);
        $723 = ($717>>>0)<($$7505$i>>>0);
        $724 = ($$3477$i|0)>(0);
        $725 = $724 & $723;
        if ($725) {
         $$4478600$i = $$3477$i;$$6494599$i = $717;
         while(1) {
          $726 = HEAP32[$$6494599$i>>2]|0;
          $727 = (_fmt_u($726,0,$27)|0);
          $728 = ($727>>>0)>($7>>>0);
          if ($728) {
           $729 = $727;
           $730 = (($729) - ($18))|0;
           _memset(($7|0),48,($730|0))|0;
           $$0463594$i = $727;
           while(1) {
            $731 = ((($$0463594$i)) + -1|0);
            $732 = ($731>>>0)>($7>>>0);
            if ($732) {
             $$0463594$i = $731;
            } else {
             $$0463$lcssa$i = $731;
             break;
            }
           }
          } else {
           $$0463$lcssa$i = $727;
          }
          $733 = HEAP32[$0>>2]|0;
          $734 = $733 & 32;
          $735 = ($734|0)==(0);
          if ($735) {
           $736 = ($$4478600$i|0)>(9);
           $737 = $736 ? 9 : $$4478600$i;
           (___fwritex($$0463$lcssa$i,$737,$0)|0);
          }
          $738 = ((($$6494599$i)) + 4|0);
          $739 = (($$4478600$i) + -9)|0;
          $740 = ($738>>>0)<($$7505$i>>>0);
          $741 = ($$4478600$i|0)>(9);
          $742 = $741 & $740;
          if ($742) {
           $$4478600$i = $739;$$6494599$i = $738;
          } else {
           $$4478$lcssa$i = $739;
           break;
          }
         }
        } else {
         $$4478$lcssa$i = $$3477$i;
        }
        $743 = (($$4478$lcssa$i) + 9)|0;
        _pad($0,48,$743,9,0);
       } else {
        $744 = ((($$9$ph$i)) + 4|0);
        $$7505$$i = $$lcssa683$i ? $$7505$i : $744;
        $745 = ($$3477$i|0)>(-1);
        if ($745) {
         $746 = ($$pre$phi704$iZ2D|0)==(0);
         $$5611$i = $$3477$i;$$7495610$i = $$9$ph$i;
         while(1) {
          $747 = HEAP32[$$7495610$i>>2]|0;
          $748 = (_fmt_u($747,0,$27)|0);
          $749 = ($748|0)==($27|0);
          if ($749) {
           HEAP8[$29>>0] = 48;
           $$0$i = $29;
          } else {
           $$0$i = $748;
          }
          $750 = ($$7495610$i|0)==($$9$ph$i|0);
          do {
           if ($750) {
            $754 = ((($$0$i)) + 1|0);
            $755 = HEAP32[$0>>2]|0;
            $756 = $755 & 32;
            $757 = ($756|0)==(0);
            if ($757) {
             (___fwritex($$0$i,1,$0)|0);
            }
            $758 = ($$5611$i|0)<(1);
            $or$cond552$i = $746 & $758;
            if ($or$cond552$i) {
             $$2$i = $754;
             break;
            }
            $759 = HEAP32[$0>>2]|0;
            $760 = $759 & 32;
            $761 = ($760|0)==(0);
            if (!($761)) {
             $$2$i = $754;
             break;
            }
            (___fwritex(9293,1,$0)|0);
            $$2$i = $754;
           } else {
            $751 = ($$0$i>>>0)>($7>>>0);
            if (!($751)) {
             $$2$i = $$0$i;
             break;
            }
            $scevgep694$i = (($$0$i) + ($19)|0);
            $scevgep694695$i = $scevgep694$i;
            _memset(($7|0),48,($scevgep694695$i|0))|0;
            $$1607$i = $$0$i;
            while(1) {
             $752 = ((($$1607$i)) + -1|0);
             $753 = ($752>>>0)>($7>>>0);
             if ($753) {
              $$1607$i = $752;
             } else {
              $$2$i = $752;
              break;
             }
            }
           }
          } while(0);
          $762 = $$2$i;
          $763 = (($28) - ($762))|0;
          $764 = HEAP32[$0>>2]|0;
          $765 = $764 & 32;
          $766 = ($765|0)==(0);
          if ($766) {
           $767 = ($$5611$i|0)>($763|0);
           $768 = $767 ? $763 : $$5611$i;
           (___fwritex($$2$i,$768,$0)|0);
          }
          $769 = (($$5611$i) - ($763))|0;
          $770 = ((($$7495610$i)) + 4|0);
          $771 = ($770>>>0)<($$7505$$i>>>0);
          $772 = ($769|0)>(-1);
          $773 = $771 & $772;
          if ($773) {
           $$5611$i = $769;$$7495610$i = $770;
          } else {
           $$5$lcssa$i = $769;
           break;
          }
         }
        } else {
         $$5$lcssa$i = $$3477$i;
        }
        $774 = (($$5$lcssa$i) + 18)|0;
        _pad($0,48,$774,18,0);
        $775 = HEAP32[$0>>2]|0;
        $776 = $775 & 32;
        $777 = ($776|0)==(0);
        if (!($777)) {
         break;
        }
        $778 = $$2513$i;
        $779 = (($22) - ($778))|0;
        (___fwritex($$2513$i,$779,$0)|0);
       }
      } while(0);
      $780 = $$1263$ ^ 8192;
      _pad($0,32,$$1260,$697,$780);
      $781 = ($697|0)<($$1260|0);
      $$553$i = $781 ? $$1260 : $697;
      $$0470$i = $$553$i;
     } else {
      $388 = $$0235 & 32;
      $389 = ($388|0)!=(0);
      $390 = $389 ? 9277 : 9281;
      $391 = ($$0471$i != $$0471$i) | (+0 != +0);
      $392 = $389 ? 9285 : 9289;
      $$1521$i = $391 ? 0 : $$0520$i;
      $$0510$i = $391 ? $392 : $390;
      $393 = (($$1521$i) + 3)|0;
      _pad($0,32,$$1260,$393,$187);
      $394 = HEAP32[$0>>2]|0;
      $395 = $394 & 32;
      $396 = ($395|0)==(0);
      if ($396) {
       (___fwritex($$0522$i,$$1521$i,$0)|0);
       $$pre$i = HEAP32[$0>>2]|0;
       $398 = $$pre$i;
      } else {
       $398 = $394;
      }
      $397 = $398 & 32;
      $399 = ($397|0)==(0);
      if ($399) {
       (___fwritex($$0510$i,3,$0)|0);
      }
      $400 = $$1263$ ^ 8192;
      _pad($0,32,$$1260,$393,$400);
      $401 = ($393|0)<($$1260|0);
      $402 = $401 ? $$1260 : $393;
      $$0470$i = $402;
     }
    } while(0);
    $$0243 = $$0470$i;$$0247 = $$1248;$$0269 = $$3272;$$0321 = $158;
    continue L1;
    break;
   }
   default: {
    $$2 = $$0321;$$2234 = 0;$$2239 = 9241;$$2251 = $14;$$5 = $$0254;$$6268 = $$1263$;
   }
   }
  } while(0);
  L310: do {
   if ((label|0) == 63) {
    label = 0;
    $218 = $9;
    $219 = $218;
    $220 = HEAP32[$219>>2]|0;
    $221 = (($218) + 4)|0;
    $222 = $221;
    $223 = HEAP32[$222>>2]|0;
    $224 = $$1236 & 32;
    $225 = ($220|0)==(0);
    $226 = ($223|0)==(0);
    $227 = $225 & $226;
    if ($227) {
     $$05$lcssa$i = $14;$248 = 0;$250 = 0;
    } else {
     $$056$i = $14;$229 = $220;$236 = $223;
     while(1) {
      $228 = $229 & 15;
      $230 = (9225 + ($228)|0);
      $231 = HEAP8[$230>>0]|0;
      $232 = $231&255;
      $233 = $232 | $224;
      $234 = $233&255;
      $235 = ((($$056$i)) + -1|0);
      HEAP8[$235>>0] = $234;
      $237 = (_bitshift64Lshr(($229|0),($236|0),4)|0);
      $238 = tempRet0;
      $239 = ($237|0)==(0);
      $240 = ($238|0)==(0);
      $241 = $239 & $240;
      if ($241) {
       break;
      } else {
       $$056$i = $235;$229 = $237;$236 = $238;
      }
     }
     $242 = $9;
     $243 = $242;
     $244 = HEAP32[$243>>2]|0;
     $245 = (($242) + 4)|0;
     $246 = $245;
     $247 = HEAP32[$246>>2]|0;
     $$05$lcssa$i = $235;$248 = $244;$250 = $247;
    }
    $249 = ($248|0)==(0);
    $251 = ($250|0)==(0);
    $252 = $249 & $251;
    $253 = $$3265 & 8;
    $254 = ($253|0)==(0);
    $or$cond282 = $254 | $252;
    $255 = $$1236 >> 4;
    $256 = (9241 + ($255)|0);
    $$332 = $or$cond282 ? 9241 : $256;
    $$333 = $or$cond282 ? 0 : 2;
    $$0228 = $$05$lcssa$i;$$1233 = $$333;$$1238 = $$332;$$2256 = $$1255;$$4266 = $$3265;
    label = 76;
   }
   else if ((label|0) == 75) {
    label = 0;
    $302 = (_fmt_u($300,$301,$14)|0);
    $$0228 = $302;$$1233 = $$0232;$$1238 = $$0237;$$2256 = $$0254;$$4266 = $$1263$;
    label = 76;
   }
   else if ((label|0) == 81) {
    label = 0;
    $334 = (_memchr($$1,0,$$0254)|0);
    $335 = ($334|0)==(0|0);
    $336 = $334;
    $337 = $$1;
    $338 = (($336) - ($337))|0;
    $339 = (($$1) + ($$0254)|0);
    $$3257 = $335 ? $$0254 : $338;
    $$1250 = $335 ? $339 : $334;
    $$2 = $$1;$$2234 = 0;$$2239 = 9241;$$2251 = $$1250;$$5 = $$3257;$$6268 = $187;
   }
   else if ((label|0) == 85) {
    label = 0;
    $$0229396 = $809;$$0240395 = 0;$$1244394 = 0;
    while(1) {
     $347 = HEAP32[$$0229396>>2]|0;
     $348 = ($347|0)==(0);
     if ($348) {
      $$0240$lcssa = $$0240395;$$2245 = $$1244394;
      break;
     }
     $349 = (_wctomb($12,$347)|0);
     $350 = ($349|0)<(0);
     $351 = (($$4258458) - ($$0240395))|0;
     $352 = ($349>>>0)>($351>>>0);
     $or$cond285 = $350 | $352;
     if ($or$cond285) {
      $$0240$lcssa = $$0240395;$$2245 = $349;
      break;
     }
     $353 = ((($$0229396)) + 4|0);
     $354 = (($349) + ($$0240395))|0;
     $355 = ($$4258458>>>0)>($354>>>0);
     if ($355) {
      $$0229396 = $353;$$0240395 = $354;$$1244394 = $349;
     } else {
      $$0240$lcssa = $354;$$2245 = $349;
      break;
     }
    }
    $356 = ($$2245|0)<(0);
    if ($356) {
     $$0 = -1;
     break L1;
    }
    _pad($0,32,$$1260,$$0240$lcssa,$$1263$);
    $357 = ($$0240$lcssa|0)==(0);
    if ($357) {
     $$0240$lcssa460 = 0;
     label = 96;
    } else {
     $$1230407 = $809;$$1241406 = 0;
     while(1) {
      $358 = HEAP32[$$1230407>>2]|0;
      $359 = ($358|0)==(0);
      if ($359) {
       $$0240$lcssa460 = $$0240$lcssa;
       label = 96;
       break L310;
      }
      $360 = ((($$1230407)) + 4|0);
      $361 = (_wctomb($12,$358)|0);
      $362 = (($361) + ($$1241406))|0;
      $363 = ($362|0)>($$0240$lcssa|0);
      if ($363) {
       $$0240$lcssa460 = $$0240$lcssa;
       label = 96;
       break L310;
      }
      $364 = HEAP32[$0>>2]|0;
      $365 = $364 & 32;
      $366 = ($365|0)==(0);
      if ($366) {
       (___fwritex($12,$361,$0)|0);
      }
      $367 = ($362>>>0)<($$0240$lcssa>>>0);
      if ($367) {
       $$1230407 = $360;$$1241406 = $362;
      } else {
       $$0240$lcssa460 = $$0240$lcssa;
       label = 96;
       break;
      }
     }
    }
   }
  } while(0);
  if ((label|0) == 96) {
   label = 0;
   $368 = $$1263$ ^ 8192;
   _pad($0,32,$$1260,$$0240$lcssa460,$368);
   $369 = ($$1260|0)>($$0240$lcssa460|0);
   $370 = $369 ? $$1260 : $$0240$lcssa460;
   $$0243 = $370;$$0247 = $$1248;$$0269 = $$3272;$$0321 = $158;
   continue;
  }
  if ((label|0) == 76) {
   label = 0;
   $303 = ($$2256|0)>(-1);
   $304 = $$4266 & -65537;
   $$$4266 = $303 ? $304 : $$4266;
   $305 = $9;
   $306 = $305;
   $307 = HEAP32[$306>>2]|0;
   $308 = (($305) + 4)|0;
   $309 = $308;
   $310 = HEAP32[$309>>2]|0;
   $311 = ($307|0)!=(0);
   $312 = ($310|0)!=(0);
   $313 = $311 | $312;
   $314 = ($$2256|0)!=(0);
   $or$cond = $314 | $313;
   if ($or$cond) {
    $315 = $$0228;
    $316 = (($15) - ($315))|0;
    $317 = $313&1;
    $318 = $317 ^ 1;
    $319 = (($318) + ($316))|0;
    $320 = ($$2256|0)>($319|0);
    $$2256$ = $320 ? $$2256 : $319;
    $$2 = $$0228;$$2234 = $$1233;$$2239 = $$1238;$$2251 = $14;$$5 = $$2256$;$$6268 = $$$4266;
   } else {
    $$2 = $14;$$2234 = $$1233;$$2239 = $$1238;$$2251 = $14;$$5 = 0;$$6268 = $$$4266;
   }
  }
  $782 = $$2251;
  $783 = $$2;
  $784 = (($782) - ($783))|0;
  $785 = ($$5|0)<($784|0);
  $$$5 = $785 ? $784 : $$5;
  $786 = (($$$5) + ($$2234))|0;
  $787 = ($$1260|0)<($786|0);
  $$2261 = $787 ? $786 : $$1260;
  _pad($0,32,$$2261,$786,$$6268);
  $788 = HEAP32[$0>>2]|0;
  $789 = $788 & 32;
  $790 = ($789|0)==(0);
  if ($790) {
   (___fwritex($$2239,$$2234,$0)|0);
  }
  $791 = $$6268 ^ 65536;
  _pad($0,48,$$2261,$786,$791);
  _pad($0,48,$$$5,$784,0);
  $792 = HEAP32[$0>>2]|0;
  $793 = $792 & 32;
  $794 = ($793|0)==(0);
  if ($794) {
   (___fwritex($$2,$784,$0)|0);
  }
  $795 = $$6268 ^ 8192;
  _pad($0,32,$$2261,$786,$795);
  $$0243 = $$2261;$$0247 = $$1248;$$0269 = $$3272;$$0321 = $158;
 }
 L345: do {
  if ((label|0) == 243) {
   $796 = ($0|0)==(0|0);
   if ($796) {
    $797 = ($$0269|0)==(0);
    if ($797) {
     $$0 = 0;
    } else {
     $$2242381 = 1;
     while(1) {
      $798 = (($4) + ($$2242381<<2)|0);
      $799 = HEAP32[$798>>2]|0;
      $800 = ($799|0)==(0);
      if ($800) {
       $$3379 = $$2242381;
       break;
      }
      $801 = (($3) + ($$2242381<<3)|0);
      _pop_arg($801,$799,$2);
      $802 = (($$2242381) + 1)|0;
      $803 = ($802|0)<(10);
      if ($803) {
       $$2242381 = $802;
      } else {
       $$0 = 1;
       break L345;
      }
     }
     while(1) {
      $806 = (($4) + ($$3379<<2)|0);
      $807 = HEAP32[$806>>2]|0;
      $808 = ($807|0)==(0);
      $804 = (($$3379) + 1)|0;
      if (!($808)) {
       $$0 = -1;
       break L345;
      }
      $805 = ($804|0)<(10);
      if ($805) {
       $$3379 = $804;
      } else {
       $$0 = 1;
       break;
      }
     }
    }
   } else {
    $$0 = $$1248;
   }
  }
 } while(0);
 STACKTOP = sp;return ($$0|0);
}
function ___lockfile($0) {
 $0 = $0|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 0;
}
function ___fwritex($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$0 = 0, $$032 = 0, $$033 = 0, $$034 = 0, $$1 = 0, $$pre = 0, $$pre38 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 $3 = ((($2)) + 16|0);
 $4 = HEAP32[$3>>2]|0;
 $5 = ($4|0)==(0|0);
 if ($5) {
  $7 = (___towrite($2)|0);
  $8 = ($7|0)==(0);
  if ($8) {
   $$pre = HEAP32[$3>>2]|0;
   $12 = $$pre;
   label = 5;
  } else {
   $$032 = 0;
  }
 } else {
  $6 = $4;
  $12 = $6;
  label = 5;
 }
 L5: do {
  if ((label|0) == 5) {
   $9 = ((($2)) + 20|0);
   $10 = HEAP32[$9>>2]|0;
   $11 = (($12) - ($10))|0;
   $13 = ($11>>>0)<($1>>>0);
   $14 = $10;
   if ($13) {
    $15 = ((($2)) + 36|0);
    $16 = HEAP32[$15>>2]|0;
    $17 = (FUNCTION_TABLE_iiii[$16 & 31]($2,$0,$1)|0);
    $$032 = $17;
    break;
   }
   $18 = ((($2)) + 75|0);
   $19 = HEAP8[$18>>0]|0;
   $20 = ($19<<24>>24)>(-1);
   L10: do {
    if ($20) {
     $$0 = $1;
     while(1) {
      $21 = ($$0|0)==(0);
      if ($21) {
       $$033 = $1;$$034 = $0;$$1 = 0;$32 = $14;
       break L10;
      }
      $22 = (($$0) + -1)|0;
      $23 = (($0) + ($22)|0);
      $24 = HEAP8[$23>>0]|0;
      $25 = ($24<<24>>24)==(10);
      if ($25) {
       break;
      } else {
       $$0 = $22;
      }
     }
     $26 = ((($2)) + 36|0);
     $27 = HEAP32[$26>>2]|0;
     $28 = (FUNCTION_TABLE_iiii[$27 & 31]($2,$0,$$0)|0);
     $29 = ($28>>>0)<($$0>>>0);
     if ($29) {
      $$032 = $$0;
      break L5;
     }
     $30 = (($0) + ($$0)|0);
     $31 = (($1) - ($$0))|0;
     $$pre38 = HEAP32[$9>>2]|0;
     $$033 = $31;$$034 = $30;$$1 = $$0;$32 = $$pre38;
    } else {
     $$033 = $1;$$034 = $0;$$1 = 0;$32 = $14;
    }
   } while(0);
   _memcpy(($32|0),($$034|0),($$033|0))|0;
   $33 = HEAP32[$9>>2]|0;
   $34 = (($33) + ($$033)|0);
   HEAP32[$9>>2] = $34;
   $35 = (($$1) + ($$033))|0;
   $$032 = $35;
  }
 } while(0);
 return ($$032|0);
}
function _pop_arg($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$mask = 0, $$mask31 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = +0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
 var $116 = +0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0;
 var $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0;
 var $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0;
 var $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0;
 var $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $arglist_current = 0, $arglist_current11 = 0, $arglist_current14 = 0, $arglist_current17 = 0;
 var $arglist_current2 = 0, $arglist_current20 = 0, $arglist_current23 = 0, $arglist_current26 = 0, $arglist_current5 = 0, $arglist_current8 = 0, $arglist_next = 0, $arglist_next12 = 0, $arglist_next15 = 0, $arglist_next18 = 0, $arglist_next21 = 0, $arglist_next24 = 0, $arglist_next27 = 0, $arglist_next3 = 0, $arglist_next6 = 0, $arglist_next9 = 0, $expanded = 0, $expanded28 = 0, $expanded30 = 0, $expanded31 = 0;
 var $expanded32 = 0, $expanded34 = 0, $expanded35 = 0, $expanded37 = 0, $expanded38 = 0, $expanded39 = 0, $expanded41 = 0, $expanded42 = 0, $expanded44 = 0, $expanded45 = 0, $expanded46 = 0, $expanded48 = 0, $expanded49 = 0, $expanded51 = 0, $expanded52 = 0, $expanded53 = 0, $expanded55 = 0, $expanded56 = 0, $expanded58 = 0, $expanded59 = 0;
 var $expanded60 = 0, $expanded62 = 0, $expanded63 = 0, $expanded65 = 0, $expanded66 = 0, $expanded67 = 0, $expanded69 = 0, $expanded70 = 0, $expanded72 = 0, $expanded73 = 0, $expanded74 = 0, $expanded76 = 0, $expanded77 = 0, $expanded79 = 0, $expanded80 = 0, $expanded81 = 0, $expanded83 = 0, $expanded84 = 0, $expanded86 = 0, $expanded87 = 0;
 var $expanded88 = 0, $expanded90 = 0, $expanded91 = 0, $expanded93 = 0, $expanded94 = 0, $expanded95 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $3 = ($1>>>0)>(20);
 L1: do {
  if (!($3)) {
   do {
    switch ($1|0) {
    case 9:  {
     $arglist_current = HEAP32[$2>>2]|0;
     $4 = $arglist_current;
     $5 = ((0) + 4|0);
     $expanded28 = $5;
     $expanded = (($expanded28) - 1)|0;
     $6 = (($4) + ($expanded))|0;
     $7 = ((0) + 4|0);
     $expanded32 = $7;
     $expanded31 = (($expanded32) - 1)|0;
     $expanded30 = $expanded31 ^ -1;
     $8 = $6 & $expanded30;
     $9 = $8;
     $10 = HEAP32[$9>>2]|0;
     $arglist_next = ((($9)) + 4|0);
     HEAP32[$2>>2] = $arglist_next;
     HEAP32[$0>>2] = $10;
     break L1;
     break;
    }
    case 10:  {
     $arglist_current2 = HEAP32[$2>>2]|0;
     $11 = $arglist_current2;
     $12 = ((0) + 4|0);
     $expanded35 = $12;
     $expanded34 = (($expanded35) - 1)|0;
     $13 = (($11) + ($expanded34))|0;
     $14 = ((0) + 4|0);
     $expanded39 = $14;
     $expanded38 = (($expanded39) - 1)|0;
     $expanded37 = $expanded38 ^ -1;
     $15 = $13 & $expanded37;
     $16 = $15;
     $17 = HEAP32[$16>>2]|0;
     $arglist_next3 = ((($16)) + 4|0);
     HEAP32[$2>>2] = $arglist_next3;
     $18 = ($17|0)<(0);
     $19 = $18 << 31 >> 31;
     $20 = $0;
     $21 = $20;
     HEAP32[$21>>2] = $17;
     $22 = (($20) + 4)|0;
     $23 = $22;
     HEAP32[$23>>2] = $19;
     break L1;
     break;
    }
    case 11:  {
     $arglist_current5 = HEAP32[$2>>2]|0;
     $24 = $arglist_current5;
     $25 = ((0) + 4|0);
     $expanded42 = $25;
     $expanded41 = (($expanded42) - 1)|0;
     $26 = (($24) + ($expanded41))|0;
     $27 = ((0) + 4|0);
     $expanded46 = $27;
     $expanded45 = (($expanded46) - 1)|0;
     $expanded44 = $expanded45 ^ -1;
     $28 = $26 & $expanded44;
     $29 = $28;
     $30 = HEAP32[$29>>2]|0;
     $arglist_next6 = ((($29)) + 4|0);
     HEAP32[$2>>2] = $arglist_next6;
     $31 = $0;
     $32 = $31;
     HEAP32[$32>>2] = $30;
     $33 = (($31) + 4)|0;
     $34 = $33;
     HEAP32[$34>>2] = 0;
     break L1;
     break;
    }
    case 12:  {
     $arglist_current8 = HEAP32[$2>>2]|0;
     $35 = $arglist_current8;
     $36 = ((0) + 8|0);
     $expanded49 = $36;
     $expanded48 = (($expanded49) - 1)|0;
     $37 = (($35) + ($expanded48))|0;
     $38 = ((0) + 8|0);
     $expanded53 = $38;
     $expanded52 = (($expanded53) - 1)|0;
     $expanded51 = $expanded52 ^ -1;
     $39 = $37 & $expanded51;
     $40 = $39;
     $41 = $40;
     $42 = $41;
     $43 = HEAP32[$42>>2]|0;
     $44 = (($41) + 4)|0;
     $45 = $44;
     $46 = HEAP32[$45>>2]|0;
     $arglist_next9 = ((($40)) + 8|0);
     HEAP32[$2>>2] = $arglist_next9;
     $47 = $0;
     $48 = $47;
     HEAP32[$48>>2] = $43;
     $49 = (($47) + 4)|0;
     $50 = $49;
     HEAP32[$50>>2] = $46;
     break L1;
     break;
    }
    case 13:  {
     $arglist_current11 = HEAP32[$2>>2]|0;
     $51 = $arglist_current11;
     $52 = ((0) + 4|0);
     $expanded56 = $52;
     $expanded55 = (($expanded56) - 1)|0;
     $53 = (($51) + ($expanded55))|0;
     $54 = ((0) + 4|0);
     $expanded60 = $54;
     $expanded59 = (($expanded60) - 1)|0;
     $expanded58 = $expanded59 ^ -1;
     $55 = $53 & $expanded58;
     $56 = $55;
     $57 = HEAP32[$56>>2]|0;
     $arglist_next12 = ((($56)) + 4|0);
     HEAP32[$2>>2] = $arglist_next12;
     $58 = $57&65535;
     $59 = $58 << 16 >> 16;
     $60 = ($59|0)<(0);
     $61 = $60 << 31 >> 31;
     $62 = $0;
     $63 = $62;
     HEAP32[$63>>2] = $59;
     $64 = (($62) + 4)|0;
     $65 = $64;
     HEAP32[$65>>2] = $61;
     break L1;
     break;
    }
    case 14:  {
     $arglist_current14 = HEAP32[$2>>2]|0;
     $66 = $arglist_current14;
     $67 = ((0) + 4|0);
     $expanded63 = $67;
     $expanded62 = (($expanded63) - 1)|0;
     $68 = (($66) + ($expanded62))|0;
     $69 = ((0) + 4|0);
     $expanded67 = $69;
     $expanded66 = (($expanded67) - 1)|0;
     $expanded65 = $expanded66 ^ -1;
     $70 = $68 & $expanded65;
     $71 = $70;
     $72 = HEAP32[$71>>2]|0;
     $arglist_next15 = ((($71)) + 4|0);
     HEAP32[$2>>2] = $arglist_next15;
     $$mask31 = $72 & 65535;
     $73 = $0;
     $74 = $73;
     HEAP32[$74>>2] = $$mask31;
     $75 = (($73) + 4)|0;
     $76 = $75;
     HEAP32[$76>>2] = 0;
     break L1;
     break;
    }
    case 15:  {
     $arglist_current17 = HEAP32[$2>>2]|0;
     $77 = $arglist_current17;
     $78 = ((0) + 4|0);
     $expanded70 = $78;
     $expanded69 = (($expanded70) - 1)|0;
     $79 = (($77) + ($expanded69))|0;
     $80 = ((0) + 4|0);
     $expanded74 = $80;
     $expanded73 = (($expanded74) - 1)|0;
     $expanded72 = $expanded73 ^ -1;
     $81 = $79 & $expanded72;
     $82 = $81;
     $83 = HEAP32[$82>>2]|0;
     $arglist_next18 = ((($82)) + 4|0);
     HEAP32[$2>>2] = $arglist_next18;
     $84 = $83&255;
     $85 = $84 << 24 >> 24;
     $86 = ($85|0)<(0);
     $87 = $86 << 31 >> 31;
     $88 = $0;
     $89 = $88;
     HEAP32[$89>>2] = $85;
     $90 = (($88) + 4)|0;
     $91 = $90;
     HEAP32[$91>>2] = $87;
     break L1;
     break;
    }
    case 16:  {
     $arglist_current20 = HEAP32[$2>>2]|0;
     $92 = $arglist_current20;
     $93 = ((0) + 4|0);
     $expanded77 = $93;
     $expanded76 = (($expanded77) - 1)|0;
     $94 = (($92) + ($expanded76))|0;
     $95 = ((0) + 4|0);
     $expanded81 = $95;
     $expanded80 = (($expanded81) - 1)|0;
     $expanded79 = $expanded80 ^ -1;
     $96 = $94 & $expanded79;
     $97 = $96;
     $98 = HEAP32[$97>>2]|0;
     $arglist_next21 = ((($97)) + 4|0);
     HEAP32[$2>>2] = $arglist_next21;
     $$mask = $98 & 255;
     $99 = $0;
     $100 = $99;
     HEAP32[$100>>2] = $$mask;
     $101 = (($99) + 4)|0;
     $102 = $101;
     HEAP32[$102>>2] = 0;
     break L1;
     break;
    }
    case 17:  {
     $arglist_current23 = HEAP32[$2>>2]|0;
     $103 = $arglist_current23;
     $104 = ((0) + 8|0);
     $expanded84 = $104;
     $expanded83 = (($expanded84) - 1)|0;
     $105 = (($103) + ($expanded83))|0;
     $106 = ((0) + 8|0);
     $expanded88 = $106;
     $expanded87 = (($expanded88) - 1)|0;
     $expanded86 = $expanded87 ^ -1;
     $107 = $105 & $expanded86;
     $108 = $107;
     $109 = +HEAPF64[$108>>3];
     $arglist_next24 = ((($108)) + 8|0);
     HEAP32[$2>>2] = $arglist_next24;
     HEAPF64[$0>>3] = $109;
     break L1;
     break;
    }
    case 18:  {
     $arglist_current26 = HEAP32[$2>>2]|0;
     $110 = $arglist_current26;
     $111 = ((0) + 8|0);
     $expanded91 = $111;
     $expanded90 = (($expanded91) - 1)|0;
     $112 = (($110) + ($expanded90))|0;
     $113 = ((0) + 8|0);
     $expanded95 = $113;
     $expanded94 = (($expanded95) - 1)|0;
     $expanded93 = $expanded94 ^ -1;
     $114 = $112 & $expanded93;
     $115 = $114;
     $116 = +HEAPF64[$115>>3];
     $arglist_next27 = ((($115)) + 8|0);
     HEAP32[$2>>2] = $arglist_next27;
     HEAPF64[$0>>3] = $116;
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
function _fmt_u($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$010$lcssa$off0 = 0, $$012 = 0, $$09$lcssa = 0, $$0914 = 0, $$1$lcssa = 0, $$111 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0;
 var $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $3 = ($1>>>0)>(0);
 $4 = ($0>>>0)>(4294967295);
 $5 = ($1|0)==(0);
 $6 = $5 & $4;
 $7 = $3 | $6;
 if ($7) {
  $$0914 = $2;$8 = $0;$9 = $1;
  while(1) {
   $10 = (___uremdi3(($8|0),($9|0),10,0)|0);
   $11 = tempRet0;
   $12 = $10 | 48;
   $13 = $12&255;
   $14 = ((($$0914)) + -1|0);
   HEAP8[$14>>0] = $13;
   $15 = (___udivdi3(($8|0),($9|0),10,0)|0);
   $16 = tempRet0;
   $17 = ($9>>>0)>(9);
   $18 = ($8>>>0)>(4294967295);
   $19 = ($9|0)==(9);
   $20 = $19 & $18;
   $21 = $17 | $20;
   if ($21) {
    $$0914 = $14;$8 = $15;$9 = $16;
   } else {
    break;
   }
  }
  $$010$lcssa$off0 = $15;$$09$lcssa = $14;
 } else {
  $$010$lcssa$off0 = $0;$$09$lcssa = $2;
 }
 $22 = ($$010$lcssa$off0|0)==(0);
 if ($22) {
  $$1$lcssa = $$09$lcssa;
 } else {
  $$012 = $$010$lcssa$off0;$$111 = $$09$lcssa;
  while(1) {
   $23 = (($$012>>>0) % 10)&-1;
   $24 = $23 | 48;
   $25 = $24&255;
   $26 = ((($$111)) + -1|0);
   HEAP8[$26>>0] = $25;
   $27 = (($$012>>>0) / 10)&-1;
   $28 = ($$012>>>0)<(10);
   if ($28) {
    $$1$lcssa = $26;
    break;
   } else {
    $$012 = $27;$$111 = $26;
   }
  }
 }
 return ($$1$lcssa|0);
}
function _strerror($0) {
 $0 = $0|0;
 var $$011$lcssa = 0, $$01113 = 0, $$015 = 0, $$112 = 0, $$114 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $$015 = 0;
 while(1) {
  $2 = (9295 + ($$015)|0);
  $3 = HEAP8[$2>>0]|0;
  $4 = $3&255;
  $5 = ($4|0)==($0|0);
  if ($5) {
   label = 2;
   break;
  }
  $6 = (($$015) + 1)|0;
  $7 = ($6|0)==(87);
  if ($7) {
   $$01113 = 9383;$$114 = 87;
   label = 5;
   break;
  } else {
   $$015 = $6;
  }
 }
 if ((label|0) == 2) {
  $1 = ($$015|0)==(0);
  if ($1) {
   $$011$lcssa = 9383;
  } else {
   $$01113 = 9383;$$114 = $$015;
   label = 5;
  }
 }
 if ((label|0) == 5) {
  while(1) {
   label = 0;
   $$112 = $$01113;
   while(1) {
    $8 = HEAP8[$$112>>0]|0;
    $9 = ($8<<24>>24)==(0);
    $10 = ((($$112)) + 1|0);
    if ($9) {
     break;
    } else {
     $$112 = $10;
    }
   }
   $11 = (($$114) + -1)|0;
   $12 = ($11|0)==(0);
   if ($12) {
    $$011$lcssa = $10;
    break;
   } else {
    $$01113 = $10;$$114 = $11;
    label = 5;
   }
  }
 }
 return ($$011$lcssa|0);
}
function _memchr($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$0$lcssa = 0, $$035$lcssa = 0, $$035$lcssa65 = 0, $$03555 = 0, $$036$lcssa = 0, $$036$lcssa64 = 0, $$03654 = 0, $$046 = 0, $$137$lcssa = 0, $$13745 = 0, $$140 = 0, $$2 = 0, $$23839 = 0, $$3 = 0, $$lcssa = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0;
 var $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0;
 var $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $or$cond53 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $3 = $1 & 255;
 $4 = $0;
 $5 = $4 & 3;
 $6 = ($5|0)!=(0);
 $7 = ($2|0)!=(0);
 $or$cond53 = $7 & $6;
 L1: do {
  if ($or$cond53) {
   $8 = $1&255;
   $$03555 = $0;$$03654 = $2;
   while(1) {
    $9 = HEAP8[$$03555>>0]|0;
    $10 = ($9<<24>>24)==($8<<24>>24);
    if ($10) {
     $$035$lcssa65 = $$03555;$$036$lcssa64 = $$03654;
     label = 6;
     break L1;
    }
    $11 = ((($$03555)) + 1|0);
    $12 = (($$03654) + -1)|0;
    $13 = $11;
    $14 = $13 & 3;
    $15 = ($14|0)!=(0);
    $16 = ($12|0)!=(0);
    $or$cond = $16 & $15;
    if ($or$cond) {
     $$03555 = $11;$$03654 = $12;
    } else {
     $$035$lcssa = $11;$$036$lcssa = $12;$$lcssa = $16;
     label = 5;
     break;
    }
   }
  } else {
   $$035$lcssa = $0;$$036$lcssa = $2;$$lcssa = $7;
   label = 5;
  }
 } while(0);
 if ((label|0) == 5) {
  if ($$lcssa) {
   $$035$lcssa65 = $$035$lcssa;$$036$lcssa64 = $$036$lcssa;
   label = 6;
  } else {
   $$2 = $$035$lcssa;$$3 = 0;
  }
 }
 L8: do {
  if ((label|0) == 6) {
   $17 = HEAP8[$$035$lcssa65>>0]|0;
   $18 = $1&255;
   $19 = ($17<<24>>24)==($18<<24>>24);
   if ($19) {
    $$2 = $$035$lcssa65;$$3 = $$036$lcssa64;
   } else {
    $20 = Math_imul($3, 16843009)|0;
    $21 = ($$036$lcssa64>>>0)>(3);
    L11: do {
     if ($21) {
      $$046 = $$035$lcssa65;$$13745 = $$036$lcssa64;
      while(1) {
       $22 = HEAP32[$$046>>2]|0;
       $23 = $22 ^ $20;
       $24 = (($23) + -16843009)|0;
       $25 = $23 & -2139062144;
       $26 = $25 ^ -2139062144;
       $27 = $26 & $24;
       $28 = ($27|0)==(0);
       if (!($28)) {
        break;
       }
       $29 = ((($$046)) + 4|0);
       $30 = (($$13745) + -4)|0;
       $31 = ($30>>>0)>(3);
       if ($31) {
        $$046 = $29;$$13745 = $30;
       } else {
        $$0$lcssa = $29;$$137$lcssa = $30;
        label = 11;
        break L11;
       }
      }
      $$140 = $$046;$$23839 = $$13745;
     } else {
      $$0$lcssa = $$035$lcssa65;$$137$lcssa = $$036$lcssa64;
      label = 11;
     }
    } while(0);
    if ((label|0) == 11) {
     $32 = ($$137$lcssa|0)==(0);
     if ($32) {
      $$2 = $$0$lcssa;$$3 = 0;
      break;
     } else {
      $$140 = $$0$lcssa;$$23839 = $$137$lcssa;
     }
    }
    while(1) {
     $33 = HEAP8[$$140>>0]|0;
     $34 = ($33<<24>>24)==($18<<24>>24);
     if ($34) {
      $$2 = $$140;$$3 = $$23839;
      break L8;
     }
     $35 = ((($$140)) + 1|0);
     $36 = (($$23839) + -1)|0;
     $37 = ($36|0)==(0);
     if ($37) {
      $$2 = $35;$$3 = 0;
      break;
     } else {
      $$140 = $35;$$23839 = $36;
     }
    }
   }
  }
 } while(0);
 $38 = ($$3|0)!=(0);
 $39 = $38 ? $$2 : 0;
 return ($39|0);
}
function _pad($0,$1,$2,$3,$4) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 $3 = $3|0;
 $4 = $4|0;
 var $$0$lcssa16 = 0, $$012 = 0, $$pre = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $5 = 0, $6 = 0;
 var $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 256|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(256|0);
 $5 = sp;
 $6 = $4 & 73728;
 $7 = ($6|0)==(0);
 $8 = ($2|0)>($3|0);
 $or$cond = $8 & $7;
 do {
  if ($or$cond) {
   $9 = (($2) - ($3))|0;
   $10 = ($9>>>0)>(256);
   $11 = $10 ? 256 : $9;
   _memset(($5|0),($1|0),($11|0))|0;
   $12 = ($9>>>0)>(255);
   $13 = HEAP32[$0>>2]|0;
   $14 = $13 & 32;
   $15 = ($14|0)==(0);
   if ($12) {
    $16 = (($2) - ($3))|0;
    $$012 = $9;$23 = $13;$24 = $15;
    while(1) {
     if ($24) {
      (___fwritex($5,256,$0)|0);
      $$pre = HEAP32[$0>>2]|0;
      $20 = $$pre;
     } else {
      $20 = $23;
     }
     $17 = (($$012) + -256)|0;
     $18 = ($17>>>0)>(255);
     $19 = $20 & 32;
     $21 = ($19|0)==(0);
     if ($18) {
      $$012 = $17;$23 = $20;$24 = $21;
     } else {
      break;
     }
    }
    $22 = $16 & 255;
    if ($21) {
     $$0$lcssa16 = $22;
    } else {
     break;
    }
   } else {
    if ($15) {
     $$0$lcssa16 = $9;
    } else {
     break;
    }
   }
   (___fwritex($5,$$0$lcssa16,$0)|0);
  }
 } while(0);
 STACKTOP = sp;return;
}
function _wctomb($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$0 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $2 = ($0|0)==(0|0);
 if ($2) {
  $$0 = 0;
 } else {
  $3 = (_wcrtomb($0,$1,0)|0);
  $$0 = $3;
 }
 return ($$0|0);
}
function _frexpl($0,$1) {
 $0 = +$0;
 $1 = $1|0;
 var $2 = +0, label = 0, sp = 0;
 sp = STACKTOP;
 $2 = (+_frexp($0,$1));
 return (+$2);
}
function _frexp($0,$1) {
 $0 = +$0;
 $1 = $1|0;
 var $$0 = +0, $$016 = +0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = +0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = +0, $9 = +0, $storemerge = 0, $trunc$clear = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 HEAPF64[tempDoublePtr>>3] = $0;$2 = HEAP32[tempDoublePtr>>2]|0;
 $3 = HEAP32[tempDoublePtr+4>>2]|0;
 $4 = (_bitshift64Lshr(($2|0),($3|0),52)|0);
 $5 = tempRet0;
 $6 = $4&65535;
 $trunc$clear = $6 & 2047;
 switch ($trunc$clear<<16>>16) {
 case 0:  {
  $7 = $0 != +0;
  if ($7) {
   $8 = $0 * +1.8446744073709552E+19;
   $9 = (+_frexp($8,$1));
   $10 = HEAP32[$1>>2]|0;
   $11 = (($10) + -64)|0;
   $$016 = $9;$storemerge = $11;
  } else {
   $$016 = $0;$storemerge = 0;
  }
  HEAP32[$1>>2] = $storemerge;
  $$0 = $$016;
  break;
 }
 case 2047:  {
  $$0 = $0;
  break;
 }
 default: {
  $12 = $4 & 2047;
  $13 = (($12) + -1022)|0;
  HEAP32[$1>>2] = $13;
  $14 = $3 & -2146435073;
  $15 = $14 | 1071644672;
  HEAP32[tempDoublePtr>>2] = $2;HEAP32[tempDoublePtr+4>>2] = $15;$16 = +HEAPF64[tempDoublePtr>>3];
  $$0 = $16;
 }
 }
 return (+$$0);
}
function _wcrtomb($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$0 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0;
 var $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0;
 var $47 = 0, $48 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $3 = ($0|0)==(0|0);
 do {
  if ($3) {
   $$0 = 1;
  } else {
   $4 = ($1>>>0)<(128);
   if ($4) {
    $5 = $1&255;
    HEAP8[$0>>0] = $5;
    $$0 = 1;
    break;
   }
   $6 = ($1>>>0)<(2048);
   if ($6) {
    $7 = $1 >>> 6;
    $8 = $7 | 192;
    $9 = $8&255;
    $10 = ((($0)) + 1|0);
    HEAP8[$0>>0] = $9;
    $11 = $1 & 63;
    $12 = $11 | 128;
    $13 = $12&255;
    HEAP8[$10>>0] = $13;
    $$0 = 2;
    break;
   }
   $14 = ($1>>>0)<(55296);
   $15 = $1 & -8192;
   $16 = ($15|0)==(57344);
   $or$cond = $14 | $16;
   if ($or$cond) {
    $17 = $1 >>> 12;
    $18 = $17 | 224;
    $19 = $18&255;
    $20 = ((($0)) + 1|0);
    HEAP8[$0>>0] = $19;
    $21 = $1 >>> 6;
    $22 = $21 & 63;
    $23 = $22 | 128;
    $24 = $23&255;
    $25 = ((($0)) + 2|0);
    HEAP8[$20>>0] = $24;
    $26 = $1 & 63;
    $27 = $26 | 128;
    $28 = $27&255;
    HEAP8[$25>>0] = $28;
    $$0 = 3;
    break;
   }
   $29 = (($1) + -65536)|0;
   $30 = ($29>>>0)<(1048576);
   if ($30) {
    $31 = $1 >>> 18;
    $32 = $31 | 240;
    $33 = $32&255;
    $34 = ((($0)) + 1|0);
    HEAP8[$0>>0] = $33;
    $35 = $1 >>> 12;
    $36 = $35 & 63;
    $37 = $36 | 128;
    $38 = $37&255;
    $39 = ((($0)) + 2|0);
    HEAP8[$34>>0] = $38;
    $40 = $1 >>> 6;
    $41 = $40 & 63;
    $42 = $41 | 128;
    $43 = $42&255;
    $44 = ((($0)) + 3|0);
    HEAP8[$39>>0] = $43;
    $45 = $1 & 63;
    $46 = $45 | 128;
    $47 = $46&255;
    HEAP8[$44>>0] = $47;
    $$0 = 4;
    break;
   } else {
    $48 = (___errno_location()|0);
    HEAP32[$48>>2] = 84;
    $$0 = -1;
    break;
   }
  }
 } while(0);
 return ($$0|0);
}
function ___towrite($0) {
 $0 = $0|0;
 var $$0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = ((($0)) + 74|0);
 $2 = HEAP8[$1>>0]|0;
 $3 = $2 << 24 >> 24;
 $4 = (($3) + 255)|0;
 $5 = $4 | $3;
 $6 = $5&255;
 HEAP8[$1>>0] = $6;
 $7 = HEAP32[$0>>2]|0;
 $8 = $7 & 8;
 $9 = ($8|0)==(0);
 if ($9) {
  $11 = ((($0)) + 8|0);
  HEAP32[$11>>2] = 0;
  $12 = ((($0)) + 4|0);
  HEAP32[$12>>2] = 0;
  $13 = ((($0)) + 44|0);
  $14 = HEAP32[$13>>2]|0;
  $15 = ((($0)) + 28|0);
  HEAP32[$15>>2] = $14;
  $16 = ((($0)) + 20|0);
  HEAP32[$16>>2] = $14;
  $17 = $14;
  $18 = ((($0)) + 48|0);
  $19 = HEAP32[$18>>2]|0;
  $20 = (($17) + ($19)|0);
  $21 = ((($0)) + 16|0);
  HEAP32[$21>>2] = $20;
  $$0 = 0;
 } else {
  $10 = $7 | 32;
  HEAP32[$0>>2] = $10;
  $$0 = -1;
 }
 return ($$0|0);
}
function _fprintf($0,$1,$varargs) {
 $0 = $0|0;
 $1 = $1|0;
 $varargs = $varargs|0;
 var $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $2 = sp;
 HEAP32[$2>>2] = $varargs;
 $3 = (_vfprintf($0,$1,$2)|0);
 STACKTOP = sp;return ($3|0);
}
function _cbrtf($0) {
 $0 = +$0;
 var $$0 = 0, $$039 = +0, $$sroa$0$0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = +0, $17 = +0, $18 = +0, $19 = +0, $2 = 0, $20 = +0, $21 = +0, $22 = +0, $23 = +0, $24 = +0;
 var $25 = +0, $26 = +0, $27 = +0, $28 = +0, $29 = +0, $3 = 0, $30 = +0, $31 = +0, $32 = +0, $33 = +0, $34 = +0, $4 = +0, $5 = 0, $6 = 0, $7 = +0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = (HEAPF32[tempDoublePtr>>2]=$0,HEAP32[tempDoublePtr>>2]|0);
 $2 = $1 & 2147483647;
 $3 = ($2>>>0)>(2139095039);
 do {
  if ($3) {
   $4 = $0 + $0;
   $$039 = $4;
  } else {
   $5 = ($2>>>0)<(8388608);
   if ($5) {
    $6 = ($2|0)==(0);
    if ($6) {
     $$039 = $0;
     break;
    }
    $7 = $0 * +16777216;
    $8 = (HEAPF32[tempDoublePtr>>2]=$7,HEAP32[tempDoublePtr>>2]|0);
    $9 = $8 & 2147483647;
    $10 = (($9>>>0) / 3)&-1;
    $11 = (($10) + 642849266)|0;
    $$0 = $11;$$sroa$0$0 = $8;
   } else {
    $12 = (($2>>>0) / 3)&-1;
    $13 = (($12) + 709958130)|0;
    $$0 = $13;$$sroa$0$0 = $1;
   }
   $14 = $$sroa$0$0 & -2147483648;
   $15 = $14 | $$0;
   $16 = (HEAP32[tempDoublePtr>>2]=$15,+HEAPF32[tempDoublePtr>>2]);
   $17 = $16;
   $18 = $17 * $17;
   $19 = $17 * $18;
   $20 = $0;
   $21 = $20 + $20;
   $22 = $21 + $19;
   $23 = $17 * $22;
   $24 = $20 + $19;
   $25 = $19 + $24;
   $26 = $23 / $25;
   $27 = $26 * $26;
   $28 = $26 * $27;
   $29 = $21 + $28;
   $30 = $26 * $29;
   $31 = $20 + $28;
   $32 = $28 + $31;
   $33 = $30 / $32;
   $34 = $33;
   $$039 = $34;
  }
 } while(0);
 return (+$$039);
}
function ___srandom($0) {
 $0 = $0|0;
 var $$01011 = 0, $$pre = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0;
 var $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = HEAP32[1885]|0;
 $2 = ($1|0)==(0);
 if ($2) {
  $3 = HEAP32[1886]|0;
  HEAP32[$3>>2] = $0;
 } else {
  $4 = ($1|0)==(31);
  $5 = ($1|0)==(7);
  $6 = $4 | $5;
  $7 = $6 ? 3 : 1;
  HEAP32[1887] = $7;
  HEAP32[2883] = 0;
  $8 = ($1|0)>(0);
  if ($8) {
   $9 = HEAP32[1886]|0;
   $$01011 = 0;$10 = $0;$11 = 0;
   while(1) {
    $12 = (___muldi3(($10|0),($11|0),1284865837,1481765933)|0);
    $13 = tempRet0;
    $14 = (_i64Add(($12|0),($13|0),1,0)|0);
    $15 = tempRet0;
    $16 = (($9) + ($$01011<<2)|0);
    HEAP32[$16>>2] = $15;
    $17 = (($$01011) + 1)|0;
    $18 = ($17|0)<($1|0);
    if ($18) {
     $$01011 = $17;$10 = $14;$11 = $15;
    } else {
     $20 = $9;
     break;
    }
   }
  } else {
   $$pre = HEAP32[1886]|0;
   $20 = $$pre;
  }
  $19 = HEAP32[$20>>2]|0;
  $21 = $19 | 1;
  HEAP32[$20>>2] = $21;
 }
 return;
}
function _initstate($0,$1,$2) {
 $0 = $0|0;
 $1 = $1|0;
 $2 = $2|0;
 var $$0 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $3 = ($2>>>0)<(8);
 if ($3) {
  $$0 = 0;
 } else {
  ___lock((11524|0));
  $4 = HEAP32[1885]|0;
  $5 = $4 << 16;
  $6 = HEAP32[1887]|0;
  $7 = $6 << 8;
  $8 = $7 | $5;
  $9 = HEAP32[2883]|0;
  $10 = $8 | $9;
  $11 = HEAP32[1886]|0;
  $12 = ((($11)) + -4|0);
  HEAP32[$12>>2] = $10;
  $13 = ($2>>>0)<(32);
  do {
   if ($13) {
    HEAP32[1885] = 0;
    $21 = 0;
   } else {
    $14 = ($2>>>0)<(64);
    if ($14) {
     HEAP32[1885] = 7;
     $21 = 458752;
     break;
    }
    $15 = ($2>>>0)<(128);
    if ($15) {
     HEAP32[1885] = 15;
     $21 = 983040;
     break;
    }
    $16 = ($2>>>0)<(256);
    if ($16) {
     HEAP32[1885] = 31;
     $21 = 2031616;
     break;
    } else {
     HEAP32[1885] = 63;
     $21 = 4128768;
     break;
    }
   }
  } while(0);
  $17 = ((($1)) + 4|0);
  HEAP32[1886] = $17;
  ___srandom($0);
  $18 = HEAP32[1887]|0;
  $19 = $18 << 8;
  $20 = $19 | $21;
  $22 = HEAP32[2883]|0;
  $23 = $20 | $22;
  HEAP32[$1>>2] = $23;
  ___unlock((11524|0));
  $$0 = $12;
 }
 return ($$0|0);
}
function _random() {
 var $$ = 0, $$0 = 0, $$1 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0;
 var $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 ___lock((11524|0));
 $0 = HEAP32[1885]|0;
 $1 = ($0|0)==(0);
 if ($1) {
  $2 = HEAP32[1886]|0;
  $3 = HEAP32[$2>>2]|0;
  $4 = Math_imul($3, 1103515245)|0;
  $5 = (($4) + 12345)|0;
  $6 = $5 & 2147483647;
  HEAP32[$2>>2] = $6;
  $$0 = $6;
 } else {
  $7 = HEAP32[2883]|0;
  $8 = HEAP32[1886]|0;
  $9 = (($8) + ($7<<2)|0);
  $10 = HEAP32[$9>>2]|0;
  $11 = HEAP32[1887]|0;
  $12 = (($8) + ($11<<2)|0);
  $13 = HEAP32[$12>>2]|0;
  $14 = (($13) + ($10))|0;
  HEAP32[$12>>2] = $14;
  $15 = $14 >>> 1;
  $16 = (($11) + 1)|0;
  $17 = ($16|0)==($0|0);
  $$ = $17 ? 0 : $16;
  HEAP32[1887] = $$;
  $18 = (($7) + 1)|0;
  $19 = ($18|0)==($0|0);
  $$1 = $19 ? 0 : $18;
  HEAP32[2883] = $$1;
  $$0 = $15;
 }
 ___unlock((11524|0));
 return ($$0|0);
}
function _printf($0,$varargs) {
 $0 = $0|0;
 $varargs = $varargs|0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = sp;
 HEAP32[$1>>2] = $varargs;
 $2 = HEAP32[1856]|0;
 $3 = (_vfprintf($2,$0,$1)|0);
 STACKTOP = sp;return ($3|0);
}
function _malloc($0) {
 $0 = $0|0;
 var $$$0190$i = 0, $$$0191$i = 0, $$$4349$i = 0, $$$i = 0, $$0 = 0, $$0$i$i = 0, $$0$i$i$i = 0, $$0$i17$i = 0, $$0$i18$i = 0, $$01$i$i = 0, $$0187$i = 0, $$0189$i = 0, $$0190$i = 0, $$0191$i = 0, $$0197 = 0, $$0199 = 0, $$0206$i$i = 0, $$0207$i$i = 0, $$0211$i$i = 0, $$0212$i$i = 0;
 var $$024370$i = 0, $$0286$i$i = 0, $$0287$i$i = 0, $$0288$i$i = 0, $$0294$i$i = 0, $$0295$i$i = 0, $$0340$i = 0, $$0342$i = 0, $$0343$i = 0, $$0345$i = 0, $$0351$i = 0, $$0356$i = 0, $$0357$$i = 0, $$0357$i = 0, $$0359$i = 0, $$0360$i = 0, $$0366$i = 0, $$1194$i = 0, $$1196$i = 0, $$124469$i = 0;
 var $$1290$i$i = 0, $$1292$i$i = 0, $$1341$i = 0, $$1346$i = 0, $$1361$i = 0, $$1368$i = 0, $$1372$i = 0, $$2247$ph$i = 0, $$2253$ph$i = 0, $$2353$i = 0, $$3$i = 0, $$3$i$i = 0, $$3$i201 = 0, $$3348$i = 0, $$3370$i = 0, $$4$lcssa$i = 0, $$413$i = 0, $$4349$lcssa$i = 0, $$434912$i = 0, $$4355$$4$i = 0;
 var $$4355$ph$i = 0, $$435511$i = 0, $$5256$i = 0, $$723947$i = 0, $$748$i = 0, $$not$i = 0, $$pre = 0, $$pre$i = 0, $$pre$i$i = 0, $$pre$i19$i = 0, $$pre$i205 = 0, $$pre$i208 = 0, $$pre$phi$i$iZ2D = 0, $$pre$phi$i20$iZ2D = 0, $$pre$phi$i206Z2D = 0, $$pre$phi$iZ2D = 0, $$pre$phi10$i$iZ2D = 0, $$pre$phiZ2D = 0, $$pre9$i$i = 0, $1 = 0;
 var $10 = 0, $100 = 0, $1000 = 0, $1001 = 0, $1002 = 0, $1003 = 0, $1004 = 0, $1005 = 0, $1006 = 0, $1007 = 0, $1008 = 0, $1009 = 0, $101 = 0, $1010 = 0, $1011 = 0, $1012 = 0, $1013 = 0, $1014 = 0, $1015 = 0, $1016 = 0;
 var $1017 = 0, $1018 = 0, $1019 = 0, $102 = 0, $1020 = 0, $1021 = 0, $1022 = 0, $1023 = 0, $1024 = 0, $1025 = 0, $1026 = 0, $1027 = 0, $1028 = 0, $1029 = 0, $103 = 0, $1030 = 0, $1031 = 0, $1032 = 0, $1033 = 0, $1034 = 0;
 var $1035 = 0, $1036 = 0, $1037 = 0, $1038 = 0, $1039 = 0, $104 = 0, $1040 = 0, $1041 = 0, $1042 = 0, $1043 = 0, $1044 = 0, $1045 = 0, $1046 = 0, $1047 = 0, $1048 = 0, $1049 = 0, $105 = 0, $1050 = 0, $1051 = 0, $1052 = 0;
 var $1053 = 0, $1054 = 0, $1055 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0;
 var $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0;
 var $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0;
 var $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0;
 var $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0;
 var $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0;
 var $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0;
 var $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0;
 var $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0;
 var $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0;
 var $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0;
 var $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0;
 var $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0;
 var $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0;
 var $356 = 0, $357 = 0, $358 = 0, $359 = 0, $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0, $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0, $372 = 0, $373 = 0;
 var $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0, $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0, $390 = 0, $391 = 0;
 var $392 = 0, $393 = 0, $394 = 0, $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0, $40 = 0, $400 = 0, $401 = 0, $402 = 0, $403 = 0, $404 = 0, $405 = 0, $406 = 0, $407 = 0, $408 = 0, $409 = 0;
 var $41 = 0, $410 = 0, $411 = 0, $412 = 0, $413 = 0, $414 = 0, $415 = 0, $416 = 0, $417 = 0, $418 = 0, $419 = 0, $42 = 0, $420 = 0, $421 = 0, $422 = 0, $423 = 0, $424 = 0, $425 = 0, $426 = 0, $427 = 0;
 var $428 = 0, $429 = 0, $43 = 0, $430 = 0, $431 = 0, $432 = 0, $433 = 0, $434 = 0, $435 = 0, $436 = 0, $437 = 0, $438 = 0, $439 = 0, $44 = 0, $440 = 0, $441 = 0, $442 = 0, $443 = 0, $444 = 0, $445 = 0;
 var $446 = 0, $447 = 0, $448 = 0, $449 = 0, $45 = 0, $450 = 0, $451 = 0, $452 = 0, $453 = 0, $454 = 0, $455 = 0, $456 = 0, $457 = 0, $458 = 0, $459 = 0, $46 = 0, $460 = 0, $461 = 0, $462 = 0, $463 = 0;
 var $464 = 0, $465 = 0, $466 = 0, $467 = 0, $468 = 0, $469 = 0, $47 = 0, $470 = 0, $471 = 0, $472 = 0, $473 = 0, $474 = 0, $475 = 0, $476 = 0, $477 = 0, $478 = 0, $479 = 0, $48 = 0, $480 = 0, $481 = 0;
 var $482 = 0, $483 = 0, $484 = 0, $485 = 0, $486 = 0, $487 = 0, $488 = 0, $489 = 0, $49 = 0, $490 = 0, $491 = 0, $492 = 0, $493 = 0, $494 = 0, $495 = 0, $496 = 0, $497 = 0, $498 = 0, $499 = 0, $5 = 0;
 var $50 = 0, $500 = 0, $501 = 0, $502 = 0, $503 = 0, $504 = 0, $505 = 0, $506 = 0, $507 = 0, $508 = 0, $509 = 0, $51 = 0, $510 = 0, $511 = 0, $512 = 0, $513 = 0, $514 = 0, $515 = 0, $516 = 0, $517 = 0;
 var $518 = 0, $519 = 0, $52 = 0, $520 = 0, $521 = 0, $522 = 0, $523 = 0, $524 = 0, $525 = 0, $526 = 0, $527 = 0, $528 = 0, $529 = 0, $53 = 0, $530 = 0, $531 = 0, $532 = 0, $533 = 0, $534 = 0, $535 = 0;
 var $536 = 0, $537 = 0, $538 = 0, $539 = 0, $54 = 0, $540 = 0, $541 = 0, $542 = 0, $543 = 0, $544 = 0, $545 = 0, $546 = 0, $547 = 0, $548 = 0, $549 = 0, $55 = 0, $550 = 0, $551 = 0, $552 = 0, $553 = 0;
 var $554 = 0, $555 = 0, $556 = 0, $557 = 0, $558 = 0, $559 = 0, $56 = 0, $560 = 0, $561 = 0, $562 = 0, $563 = 0, $564 = 0, $565 = 0, $566 = 0, $567 = 0, $568 = 0, $569 = 0, $57 = 0, $570 = 0, $571 = 0;
 var $572 = 0, $573 = 0, $574 = 0, $575 = 0, $576 = 0, $577 = 0, $578 = 0, $579 = 0, $58 = 0, $580 = 0, $581 = 0, $582 = 0, $583 = 0, $584 = 0, $585 = 0, $586 = 0, $587 = 0, $588 = 0, $589 = 0, $59 = 0;
 var $590 = 0, $591 = 0, $592 = 0, $593 = 0, $594 = 0, $595 = 0, $596 = 0, $597 = 0, $598 = 0, $599 = 0, $6 = 0, $60 = 0, $600 = 0, $601 = 0, $602 = 0, $603 = 0, $604 = 0, $605 = 0, $606 = 0, $607 = 0;
 var $608 = 0, $609 = 0, $61 = 0, $610 = 0, $611 = 0, $612 = 0, $613 = 0, $614 = 0, $615 = 0, $616 = 0, $617 = 0, $618 = 0, $619 = 0, $62 = 0, $620 = 0, $621 = 0, $622 = 0, $623 = 0, $624 = 0, $625 = 0;
 var $626 = 0, $627 = 0, $628 = 0, $629 = 0, $63 = 0, $630 = 0, $631 = 0, $632 = 0, $633 = 0, $634 = 0, $635 = 0, $636 = 0, $637 = 0, $638 = 0, $639 = 0, $64 = 0, $640 = 0, $641 = 0, $642 = 0, $643 = 0;
 var $644 = 0, $645 = 0, $646 = 0, $647 = 0, $648 = 0, $649 = 0, $65 = 0, $650 = 0, $651 = 0, $652 = 0, $653 = 0, $654 = 0, $655 = 0, $656 = 0, $657 = 0, $658 = 0, $659 = 0, $66 = 0, $660 = 0, $661 = 0;
 var $662 = 0, $663 = 0, $664 = 0, $665 = 0, $666 = 0, $667 = 0, $668 = 0, $669 = 0, $67 = 0, $670 = 0, $671 = 0, $672 = 0, $673 = 0, $674 = 0, $675 = 0, $676 = 0, $677 = 0, $678 = 0, $679 = 0, $68 = 0;
 var $680 = 0, $681 = 0, $682 = 0, $683 = 0, $684 = 0, $685 = 0, $686 = 0, $687 = 0, $688 = 0, $689 = 0, $69 = 0, $690 = 0, $691 = 0, $692 = 0, $693 = 0, $694 = 0, $695 = 0, $696 = 0, $697 = 0, $698 = 0;
 var $699 = 0, $7 = 0, $70 = 0, $700 = 0, $701 = 0, $702 = 0, $703 = 0, $704 = 0, $705 = 0, $706 = 0, $707 = 0, $708 = 0, $709 = 0, $71 = 0, $710 = 0, $711 = 0, $712 = 0, $713 = 0, $714 = 0, $715 = 0;
 var $716 = 0, $717 = 0, $718 = 0, $719 = 0, $72 = 0, $720 = 0, $721 = 0, $722 = 0, $723 = 0, $724 = 0, $725 = 0, $726 = 0, $727 = 0, $728 = 0, $729 = 0, $73 = 0, $730 = 0, $731 = 0, $732 = 0, $733 = 0;
 var $734 = 0, $735 = 0, $736 = 0, $737 = 0, $738 = 0, $739 = 0, $74 = 0, $740 = 0, $741 = 0, $742 = 0, $743 = 0, $744 = 0, $745 = 0, $746 = 0, $747 = 0, $748 = 0, $749 = 0, $75 = 0, $750 = 0, $751 = 0;
 var $752 = 0, $753 = 0, $754 = 0, $755 = 0, $756 = 0, $757 = 0, $758 = 0, $759 = 0, $76 = 0, $760 = 0, $761 = 0, $762 = 0, $763 = 0, $764 = 0, $765 = 0, $766 = 0, $767 = 0, $768 = 0, $769 = 0, $77 = 0;
 var $770 = 0, $771 = 0, $772 = 0, $773 = 0, $774 = 0, $775 = 0, $776 = 0, $777 = 0, $778 = 0, $779 = 0, $78 = 0, $780 = 0, $781 = 0, $782 = 0, $783 = 0, $784 = 0, $785 = 0, $786 = 0, $787 = 0, $788 = 0;
 var $789 = 0, $79 = 0, $790 = 0, $791 = 0, $792 = 0, $793 = 0, $794 = 0, $795 = 0, $796 = 0, $797 = 0, $798 = 0, $799 = 0, $8 = 0, $80 = 0, $800 = 0, $801 = 0, $802 = 0, $803 = 0, $804 = 0, $805 = 0;
 var $806 = 0, $807 = 0, $808 = 0, $809 = 0, $81 = 0, $810 = 0, $811 = 0, $812 = 0, $813 = 0, $814 = 0, $815 = 0, $816 = 0, $817 = 0, $818 = 0, $819 = 0, $82 = 0, $820 = 0, $821 = 0, $822 = 0, $823 = 0;
 var $824 = 0, $825 = 0, $826 = 0, $827 = 0, $828 = 0, $829 = 0, $83 = 0, $830 = 0, $831 = 0, $832 = 0, $833 = 0, $834 = 0, $835 = 0, $836 = 0, $837 = 0, $838 = 0, $839 = 0, $84 = 0, $840 = 0, $841 = 0;
 var $842 = 0, $843 = 0, $844 = 0, $845 = 0, $846 = 0, $847 = 0, $848 = 0, $849 = 0, $85 = 0, $850 = 0, $851 = 0, $852 = 0, $853 = 0, $854 = 0, $855 = 0, $856 = 0, $857 = 0, $858 = 0, $859 = 0, $86 = 0;
 var $860 = 0, $861 = 0, $862 = 0, $863 = 0, $864 = 0, $865 = 0, $866 = 0, $867 = 0, $868 = 0, $869 = 0, $87 = 0, $870 = 0, $871 = 0, $872 = 0, $873 = 0, $874 = 0, $875 = 0, $876 = 0, $877 = 0, $878 = 0;
 var $879 = 0, $88 = 0, $880 = 0, $881 = 0, $882 = 0, $883 = 0, $884 = 0, $885 = 0, $886 = 0, $887 = 0, $888 = 0, $889 = 0, $89 = 0, $890 = 0, $891 = 0, $892 = 0, $893 = 0, $894 = 0, $895 = 0, $896 = 0;
 var $897 = 0, $898 = 0, $899 = 0, $9 = 0, $90 = 0, $900 = 0, $901 = 0, $902 = 0, $903 = 0, $904 = 0, $905 = 0, $906 = 0, $907 = 0, $908 = 0, $909 = 0, $91 = 0, $910 = 0, $911 = 0, $912 = 0, $913 = 0;
 var $914 = 0, $915 = 0, $916 = 0, $917 = 0, $918 = 0, $919 = 0, $92 = 0, $920 = 0, $921 = 0, $922 = 0, $923 = 0, $924 = 0, $925 = 0, $926 = 0, $927 = 0, $928 = 0, $929 = 0, $93 = 0, $930 = 0, $931 = 0;
 var $932 = 0, $933 = 0, $934 = 0, $935 = 0, $936 = 0, $937 = 0, $938 = 0, $939 = 0, $94 = 0, $940 = 0, $941 = 0, $942 = 0, $943 = 0, $944 = 0, $945 = 0, $946 = 0, $947 = 0, $948 = 0, $949 = 0, $95 = 0;
 var $950 = 0, $951 = 0, $952 = 0, $953 = 0, $954 = 0, $955 = 0, $956 = 0, $957 = 0, $958 = 0, $959 = 0, $96 = 0, $960 = 0, $961 = 0, $962 = 0, $963 = 0, $964 = 0, $965 = 0, $966 = 0, $967 = 0, $968 = 0;
 var $969 = 0, $97 = 0, $970 = 0, $971 = 0, $972 = 0, $973 = 0, $974 = 0, $975 = 0, $976 = 0, $977 = 0, $978 = 0, $979 = 0, $98 = 0, $980 = 0, $981 = 0, $982 = 0, $983 = 0, $984 = 0, $985 = 0, $986 = 0;
 var $987 = 0, $988 = 0, $989 = 0, $99 = 0, $990 = 0, $991 = 0, $992 = 0, $993 = 0, $994 = 0, $995 = 0, $996 = 0, $997 = 0, $998 = 0, $999 = 0, $cond$i = 0, $cond$i$i = 0, $cond$i204 = 0, $exitcond$i$i = 0, $not$$i$i = 0, $not$$i22$i = 0;
 var $not$7$i = 0, $or$cond$i = 0, $or$cond$i211 = 0, $or$cond1$i = 0, $or$cond1$i210 = 0, $or$cond10$i = 0, $or$cond11$i = 0, $or$cond12$i = 0, $or$cond2$i = 0, $or$cond5$i = 0, $or$cond50$i = 0, $or$cond7$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abortStackOverflow(16|0);
 $1 = sp;
 $2 = ($0>>>0)<(245);
 do {
  if ($2) {
   $3 = ($0>>>0)<(11);
   $4 = (($0) + 11)|0;
   $5 = $4 & -8;
   $6 = $3 ? 16 : $5;
   $7 = $6 >>> 3;
   $8 = HEAP32[2884]|0;
   $9 = $8 >>> $7;
   $10 = $9 & 3;
   $11 = ($10|0)==(0);
   if (!($11)) {
    $12 = $9 & 1;
    $13 = $12 ^ 1;
    $14 = (($13) + ($7))|0;
    $15 = $14 << 1;
    $16 = (11576 + ($15<<2)|0);
    $17 = ((($16)) + 8|0);
    $18 = HEAP32[$17>>2]|0;
    $19 = ((($18)) + 8|0);
    $20 = HEAP32[$19>>2]|0;
    $21 = ($16|0)==($20|0);
    do {
     if ($21) {
      $22 = 1 << $14;
      $23 = $22 ^ -1;
      $24 = $8 & $23;
      HEAP32[2884] = $24;
     } else {
      $25 = HEAP32[(11552)>>2]|0;
      $26 = ($20>>>0)<($25>>>0);
      if ($26) {
       _abort();
       // unreachable;
      }
      $27 = ((($20)) + 12|0);
      $28 = HEAP32[$27>>2]|0;
      $29 = ($28|0)==($18|0);
      if ($29) {
       HEAP32[$27>>2] = $16;
       HEAP32[$17>>2] = $20;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    } while(0);
    $30 = $14 << 3;
    $31 = $30 | 3;
    $32 = ((($18)) + 4|0);
    HEAP32[$32>>2] = $31;
    $33 = (($18) + ($30)|0);
    $34 = ((($33)) + 4|0);
    $35 = HEAP32[$34>>2]|0;
    $36 = $35 | 1;
    HEAP32[$34>>2] = $36;
    $$0 = $19;
    STACKTOP = sp;return ($$0|0);
   }
   $37 = HEAP32[(11544)>>2]|0;
   $38 = ($6>>>0)>($37>>>0);
   if ($38) {
    $39 = ($9|0)==(0);
    if (!($39)) {
     $40 = $9 << $7;
     $41 = 2 << $7;
     $42 = (0 - ($41))|0;
     $43 = $41 | $42;
     $44 = $40 & $43;
     $45 = (0 - ($44))|0;
     $46 = $44 & $45;
     $47 = (($46) + -1)|0;
     $48 = $47 >>> 12;
     $49 = $48 & 16;
     $50 = $47 >>> $49;
     $51 = $50 >>> 5;
     $52 = $51 & 8;
     $53 = $52 | $49;
     $54 = $50 >>> $52;
     $55 = $54 >>> 2;
     $56 = $55 & 4;
     $57 = $53 | $56;
     $58 = $54 >>> $56;
     $59 = $58 >>> 1;
     $60 = $59 & 2;
     $61 = $57 | $60;
     $62 = $58 >>> $60;
     $63 = $62 >>> 1;
     $64 = $63 & 1;
     $65 = $61 | $64;
     $66 = $62 >>> $64;
     $67 = (($65) + ($66))|0;
     $68 = $67 << 1;
     $69 = (11576 + ($68<<2)|0);
     $70 = ((($69)) + 8|0);
     $71 = HEAP32[$70>>2]|0;
     $72 = ((($71)) + 8|0);
     $73 = HEAP32[$72>>2]|0;
     $74 = ($69|0)==($73|0);
     do {
      if ($74) {
       $75 = 1 << $67;
       $76 = $75 ^ -1;
       $77 = $8 & $76;
       HEAP32[2884] = $77;
       $98 = $77;
      } else {
       $78 = HEAP32[(11552)>>2]|0;
       $79 = ($73>>>0)<($78>>>0);
       if ($79) {
        _abort();
        // unreachable;
       }
       $80 = ((($73)) + 12|0);
       $81 = HEAP32[$80>>2]|0;
       $82 = ($81|0)==($71|0);
       if ($82) {
        HEAP32[$80>>2] = $69;
        HEAP32[$70>>2] = $73;
        $98 = $8;
        break;
       } else {
        _abort();
        // unreachable;
       }
      }
     } while(0);
     $83 = $67 << 3;
     $84 = (($83) - ($6))|0;
     $85 = $6 | 3;
     $86 = ((($71)) + 4|0);
     HEAP32[$86>>2] = $85;
     $87 = (($71) + ($6)|0);
     $88 = $84 | 1;
     $89 = ((($87)) + 4|0);
     HEAP32[$89>>2] = $88;
     $90 = (($87) + ($84)|0);
     HEAP32[$90>>2] = $84;
     $91 = ($37|0)==(0);
     if (!($91)) {
      $92 = HEAP32[(11556)>>2]|0;
      $93 = $37 >>> 3;
      $94 = $93 << 1;
      $95 = (11576 + ($94<<2)|0);
      $96 = 1 << $93;
      $97 = $98 & $96;
      $99 = ($97|0)==(0);
      if ($99) {
       $100 = $98 | $96;
       HEAP32[2884] = $100;
       $$pre = ((($95)) + 8|0);
       $$0199 = $95;$$pre$phiZ2D = $$pre;
      } else {
       $101 = ((($95)) + 8|0);
       $102 = HEAP32[$101>>2]|0;
       $103 = HEAP32[(11552)>>2]|0;
       $104 = ($102>>>0)<($103>>>0);
       if ($104) {
        _abort();
        // unreachable;
       } else {
        $$0199 = $102;$$pre$phiZ2D = $101;
       }
      }
      HEAP32[$$pre$phiZ2D>>2] = $92;
      $105 = ((($$0199)) + 12|0);
      HEAP32[$105>>2] = $92;
      $106 = ((($92)) + 8|0);
      HEAP32[$106>>2] = $$0199;
      $107 = ((($92)) + 12|0);
      HEAP32[$107>>2] = $95;
     }
     HEAP32[(11544)>>2] = $84;
     HEAP32[(11556)>>2] = $87;
     $$0 = $72;
     STACKTOP = sp;return ($$0|0);
    }
    $108 = HEAP32[(11540)>>2]|0;
    $109 = ($108|0)==(0);
    if ($109) {
     $$0197 = $6;
    } else {
     $110 = (0 - ($108))|0;
     $111 = $108 & $110;
     $112 = (($111) + -1)|0;
     $113 = $112 >>> 12;
     $114 = $113 & 16;
     $115 = $112 >>> $114;
     $116 = $115 >>> 5;
     $117 = $116 & 8;
     $118 = $117 | $114;
     $119 = $115 >>> $117;
     $120 = $119 >>> 2;
     $121 = $120 & 4;
     $122 = $118 | $121;
     $123 = $119 >>> $121;
     $124 = $123 >>> 1;
     $125 = $124 & 2;
     $126 = $122 | $125;
     $127 = $123 >>> $125;
     $128 = $127 >>> 1;
     $129 = $128 & 1;
     $130 = $126 | $129;
     $131 = $127 >>> $129;
     $132 = (($130) + ($131))|0;
     $133 = (11840 + ($132<<2)|0);
     $134 = HEAP32[$133>>2]|0;
     $135 = ((($134)) + 4|0);
     $136 = HEAP32[$135>>2]|0;
     $137 = $136 & -8;
     $138 = (($137) - ($6))|0;
     $$0189$i = $134;$$0190$i = $134;$$0191$i = $138;
     while(1) {
      $139 = ((($$0189$i)) + 16|0);
      $140 = HEAP32[$139>>2]|0;
      $141 = ($140|0)==(0|0);
      if ($141) {
       $142 = ((($$0189$i)) + 20|0);
       $143 = HEAP32[$142>>2]|0;
       $144 = ($143|0)==(0|0);
       if ($144) {
        break;
       } else {
        $146 = $143;
       }
      } else {
       $146 = $140;
      }
      $145 = ((($146)) + 4|0);
      $147 = HEAP32[$145>>2]|0;
      $148 = $147 & -8;
      $149 = (($148) - ($6))|0;
      $150 = ($149>>>0)<($$0191$i>>>0);
      $$$0191$i = $150 ? $149 : $$0191$i;
      $$$0190$i = $150 ? $146 : $$0190$i;
      $$0189$i = $146;$$0190$i = $$$0190$i;$$0191$i = $$$0191$i;
     }
     $151 = HEAP32[(11552)>>2]|0;
     $152 = ($$0190$i>>>0)<($151>>>0);
     if ($152) {
      _abort();
      // unreachable;
     }
     $153 = (($$0190$i) + ($6)|0);
     $154 = ($$0190$i>>>0)<($153>>>0);
     if (!($154)) {
      _abort();
      // unreachable;
     }
     $155 = ((($$0190$i)) + 24|0);
     $156 = HEAP32[$155>>2]|0;
     $157 = ((($$0190$i)) + 12|0);
     $158 = HEAP32[$157>>2]|0;
     $159 = ($158|0)==($$0190$i|0);
     do {
      if ($159) {
       $169 = ((($$0190$i)) + 20|0);
       $170 = HEAP32[$169>>2]|0;
       $171 = ($170|0)==(0|0);
       if ($171) {
        $172 = ((($$0190$i)) + 16|0);
        $173 = HEAP32[$172>>2]|0;
        $174 = ($173|0)==(0|0);
        if ($174) {
         $$3$i = 0;
         break;
        } else {
         $$1194$i = $173;$$1196$i = $172;
        }
       } else {
        $$1194$i = $170;$$1196$i = $169;
       }
       while(1) {
        $175 = ((($$1194$i)) + 20|0);
        $176 = HEAP32[$175>>2]|0;
        $177 = ($176|0)==(0|0);
        if (!($177)) {
         $$1194$i = $176;$$1196$i = $175;
         continue;
        }
        $178 = ((($$1194$i)) + 16|0);
        $179 = HEAP32[$178>>2]|0;
        $180 = ($179|0)==(0|0);
        if ($180) {
         break;
        } else {
         $$1194$i = $179;$$1196$i = $178;
        }
       }
       $181 = ($$1196$i>>>0)<($151>>>0);
       if ($181) {
        _abort();
        // unreachable;
       } else {
        HEAP32[$$1196$i>>2] = 0;
        $$3$i = $$1194$i;
        break;
       }
      } else {
       $160 = ((($$0190$i)) + 8|0);
       $161 = HEAP32[$160>>2]|0;
       $162 = ($161>>>0)<($151>>>0);
       if ($162) {
        _abort();
        // unreachable;
       }
       $163 = ((($161)) + 12|0);
       $164 = HEAP32[$163>>2]|0;
       $165 = ($164|0)==($$0190$i|0);
       if (!($165)) {
        _abort();
        // unreachable;
       }
       $166 = ((($158)) + 8|0);
       $167 = HEAP32[$166>>2]|0;
       $168 = ($167|0)==($$0190$i|0);
       if ($168) {
        HEAP32[$163>>2] = $158;
        HEAP32[$166>>2] = $161;
        $$3$i = $158;
        break;
       } else {
        _abort();
        // unreachable;
       }
      }
     } while(0);
     $182 = ($156|0)==(0|0);
     do {
      if (!($182)) {
       $183 = ((($$0190$i)) + 28|0);
       $184 = HEAP32[$183>>2]|0;
       $185 = (11840 + ($184<<2)|0);
       $186 = HEAP32[$185>>2]|0;
       $187 = ($$0190$i|0)==($186|0);
       if ($187) {
        HEAP32[$185>>2] = $$3$i;
        $cond$i = ($$3$i|0)==(0|0);
        if ($cond$i) {
         $188 = 1 << $184;
         $189 = $188 ^ -1;
         $190 = $108 & $189;
         HEAP32[(11540)>>2] = $190;
         break;
        }
       } else {
        $191 = HEAP32[(11552)>>2]|0;
        $192 = ($156>>>0)<($191>>>0);
        if ($192) {
         _abort();
         // unreachable;
        }
        $193 = ((($156)) + 16|0);
        $194 = HEAP32[$193>>2]|0;
        $195 = ($194|0)==($$0190$i|0);
        if ($195) {
         HEAP32[$193>>2] = $$3$i;
        } else {
         $196 = ((($156)) + 20|0);
         HEAP32[$196>>2] = $$3$i;
        }
        $197 = ($$3$i|0)==(0|0);
        if ($197) {
         break;
        }
       }
       $198 = HEAP32[(11552)>>2]|0;
       $199 = ($$3$i>>>0)<($198>>>0);
       if ($199) {
        _abort();
        // unreachable;
       }
       $200 = ((($$3$i)) + 24|0);
       HEAP32[$200>>2] = $156;
       $201 = ((($$0190$i)) + 16|0);
       $202 = HEAP32[$201>>2]|0;
       $203 = ($202|0)==(0|0);
       do {
        if (!($203)) {
         $204 = ($202>>>0)<($198>>>0);
         if ($204) {
          _abort();
          // unreachable;
         } else {
          $205 = ((($$3$i)) + 16|0);
          HEAP32[$205>>2] = $202;
          $206 = ((($202)) + 24|0);
          HEAP32[$206>>2] = $$3$i;
          break;
         }
        }
       } while(0);
       $207 = ((($$0190$i)) + 20|0);
       $208 = HEAP32[$207>>2]|0;
       $209 = ($208|0)==(0|0);
       if (!($209)) {
        $210 = HEAP32[(11552)>>2]|0;
        $211 = ($208>>>0)<($210>>>0);
        if ($211) {
         _abort();
         // unreachable;
        } else {
         $212 = ((($$3$i)) + 20|0);
         HEAP32[$212>>2] = $208;
         $213 = ((($208)) + 24|0);
         HEAP32[$213>>2] = $$3$i;
         break;
        }
       }
      }
     } while(0);
     $214 = ($$0191$i>>>0)<(16);
     if ($214) {
      $215 = (($$0191$i) + ($6))|0;
      $216 = $215 | 3;
      $217 = ((($$0190$i)) + 4|0);
      HEAP32[$217>>2] = $216;
      $218 = (($$0190$i) + ($215)|0);
      $219 = ((($218)) + 4|0);
      $220 = HEAP32[$219>>2]|0;
      $221 = $220 | 1;
      HEAP32[$219>>2] = $221;
     } else {
      $222 = $6 | 3;
      $223 = ((($$0190$i)) + 4|0);
      HEAP32[$223>>2] = $222;
      $224 = $$0191$i | 1;
      $225 = ((($153)) + 4|0);
      HEAP32[$225>>2] = $224;
      $226 = (($153) + ($$0191$i)|0);
      HEAP32[$226>>2] = $$0191$i;
      $227 = ($37|0)==(0);
      if (!($227)) {
       $228 = HEAP32[(11556)>>2]|0;
       $229 = $37 >>> 3;
       $230 = $229 << 1;
       $231 = (11576 + ($230<<2)|0);
       $232 = 1 << $229;
       $233 = $8 & $232;
       $234 = ($233|0)==(0);
       if ($234) {
        $235 = $8 | $232;
        HEAP32[2884] = $235;
        $$pre$i = ((($231)) + 8|0);
        $$0187$i = $231;$$pre$phi$iZ2D = $$pre$i;
       } else {
        $236 = ((($231)) + 8|0);
        $237 = HEAP32[$236>>2]|0;
        $238 = HEAP32[(11552)>>2]|0;
        $239 = ($237>>>0)<($238>>>0);
        if ($239) {
         _abort();
         // unreachable;
        } else {
         $$0187$i = $237;$$pre$phi$iZ2D = $236;
        }
       }
       HEAP32[$$pre$phi$iZ2D>>2] = $228;
       $240 = ((($$0187$i)) + 12|0);
       HEAP32[$240>>2] = $228;
       $241 = ((($228)) + 8|0);
       HEAP32[$241>>2] = $$0187$i;
       $242 = ((($228)) + 12|0);
       HEAP32[$242>>2] = $231;
      }
      HEAP32[(11544)>>2] = $$0191$i;
      HEAP32[(11556)>>2] = $153;
     }
     $243 = ((($$0190$i)) + 8|0);
     $$0 = $243;
     STACKTOP = sp;return ($$0|0);
    }
   } else {
    $$0197 = $6;
   }
  } else {
   $244 = ($0>>>0)>(4294967231);
   if ($244) {
    $$0197 = -1;
   } else {
    $245 = (($0) + 11)|0;
    $246 = $245 & -8;
    $247 = HEAP32[(11540)>>2]|0;
    $248 = ($247|0)==(0);
    if ($248) {
     $$0197 = $246;
    } else {
     $249 = (0 - ($246))|0;
     $250 = $245 >>> 8;
     $251 = ($250|0)==(0);
     if ($251) {
      $$0356$i = 0;
     } else {
      $252 = ($246>>>0)>(16777215);
      if ($252) {
       $$0356$i = 31;
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
       $$0356$i = $274;
      }
     }
     $275 = (11840 + ($$0356$i<<2)|0);
     $276 = HEAP32[$275>>2]|0;
     $277 = ($276|0)==(0|0);
     L123: do {
      if ($277) {
       $$2353$i = 0;$$3$i201 = 0;$$3348$i = $249;
       label = 86;
      } else {
       $278 = ($$0356$i|0)==(31);
       $279 = $$0356$i >>> 1;
       $280 = (25 - ($279))|0;
       $281 = $278 ? 0 : $280;
       $282 = $246 << $281;
       $$0340$i = 0;$$0345$i = $249;$$0351$i = $276;$$0357$i = $282;$$0360$i = 0;
       while(1) {
        $283 = ((($$0351$i)) + 4|0);
        $284 = HEAP32[$283>>2]|0;
        $285 = $284 & -8;
        $286 = (($285) - ($246))|0;
        $287 = ($286>>>0)<($$0345$i>>>0);
        if ($287) {
         $288 = ($286|0)==(0);
         if ($288) {
          $$413$i = $$0351$i;$$434912$i = 0;$$435511$i = $$0351$i;
          label = 90;
          break L123;
         } else {
          $$1341$i = $$0351$i;$$1346$i = $286;
         }
        } else {
         $$1341$i = $$0340$i;$$1346$i = $$0345$i;
        }
        $289 = ((($$0351$i)) + 20|0);
        $290 = HEAP32[$289>>2]|0;
        $291 = $$0357$i >>> 31;
        $292 = (((($$0351$i)) + 16|0) + ($291<<2)|0);
        $293 = HEAP32[$292>>2]|0;
        $294 = ($290|0)==(0|0);
        $295 = ($290|0)==($293|0);
        $or$cond1$i = $294 | $295;
        $$1361$i = $or$cond1$i ? $$0360$i : $290;
        $296 = ($293|0)==(0|0);
        $297 = $296&1;
        $298 = $297 ^ 1;
        $$0357$$i = $$0357$i << $298;
        if ($296) {
         $$2353$i = $$1361$i;$$3$i201 = $$1341$i;$$3348$i = $$1346$i;
         label = 86;
         break;
        } else {
         $$0340$i = $$1341$i;$$0345$i = $$1346$i;$$0351$i = $293;$$0357$i = $$0357$$i;$$0360$i = $$1361$i;
        }
       }
      }
     } while(0);
     if ((label|0) == 86) {
      $299 = ($$2353$i|0)==(0|0);
      $300 = ($$3$i201|0)==(0|0);
      $or$cond$i = $299 & $300;
      if ($or$cond$i) {
       $301 = 2 << $$0356$i;
       $302 = (0 - ($301))|0;
       $303 = $301 | $302;
       $304 = $247 & $303;
       $305 = ($304|0)==(0);
       if ($305) {
        $$0197 = $246;
        break;
       }
       $306 = (0 - ($304))|0;
       $307 = $304 & $306;
       $308 = (($307) + -1)|0;
       $309 = $308 >>> 12;
       $310 = $309 & 16;
       $311 = $308 >>> $310;
       $312 = $311 >>> 5;
       $313 = $312 & 8;
       $314 = $313 | $310;
       $315 = $311 >>> $313;
       $316 = $315 >>> 2;
       $317 = $316 & 4;
       $318 = $314 | $317;
       $319 = $315 >>> $317;
       $320 = $319 >>> 1;
       $321 = $320 & 2;
       $322 = $318 | $321;
       $323 = $319 >>> $321;
       $324 = $323 >>> 1;
       $325 = $324 & 1;
       $326 = $322 | $325;
       $327 = $323 >>> $325;
       $328 = (($326) + ($327))|0;
       $329 = (11840 + ($328<<2)|0);
       $330 = HEAP32[$329>>2]|0;
       $$4355$ph$i = $330;
      } else {
       $$4355$ph$i = $$2353$i;
      }
      $331 = ($$4355$ph$i|0)==(0|0);
      if ($331) {
       $$4$lcssa$i = $$3$i201;$$4349$lcssa$i = $$3348$i;
      } else {
       $$413$i = $$3$i201;$$434912$i = $$3348$i;$$435511$i = $$4355$ph$i;
       label = 90;
      }
     }
     if ((label|0) == 90) {
      while(1) {
       label = 0;
       $332 = ((($$435511$i)) + 4|0);
       $333 = HEAP32[$332>>2]|0;
       $334 = $333 & -8;
       $335 = (($334) - ($246))|0;
       $336 = ($335>>>0)<($$434912$i>>>0);
       $$$4349$i = $336 ? $335 : $$434912$i;
       $$4355$$4$i = $336 ? $$435511$i : $$413$i;
       $337 = ((($$435511$i)) + 16|0);
       $338 = HEAP32[$337>>2]|0;
       $339 = ($338|0)==(0|0);
       if (!($339)) {
        $$413$i = $$4355$$4$i;$$434912$i = $$$4349$i;$$435511$i = $338;
        label = 90;
        continue;
       }
       $340 = ((($$435511$i)) + 20|0);
       $341 = HEAP32[$340>>2]|0;
       $342 = ($341|0)==(0|0);
       if ($342) {
        $$4$lcssa$i = $$4355$$4$i;$$4349$lcssa$i = $$$4349$i;
        break;
       } else {
        $$413$i = $$4355$$4$i;$$434912$i = $$$4349$i;$$435511$i = $341;
        label = 90;
       }
      }
     }
     $343 = ($$4$lcssa$i|0)==(0|0);
     if ($343) {
      $$0197 = $246;
     } else {
      $344 = HEAP32[(11544)>>2]|0;
      $345 = (($344) - ($246))|0;
      $346 = ($$4349$lcssa$i>>>0)<($345>>>0);
      if ($346) {
       $347 = HEAP32[(11552)>>2]|0;
       $348 = ($$4$lcssa$i>>>0)<($347>>>0);
       if ($348) {
        _abort();
        // unreachable;
       }
       $349 = (($$4$lcssa$i) + ($246)|0);
       $350 = ($$4$lcssa$i>>>0)<($349>>>0);
       if (!($350)) {
        _abort();
        // unreachable;
       }
       $351 = ((($$4$lcssa$i)) + 24|0);
       $352 = HEAP32[$351>>2]|0;
       $353 = ((($$4$lcssa$i)) + 12|0);
       $354 = HEAP32[$353>>2]|0;
       $355 = ($354|0)==($$4$lcssa$i|0);
       do {
        if ($355) {
         $365 = ((($$4$lcssa$i)) + 20|0);
         $366 = HEAP32[$365>>2]|0;
         $367 = ($366|0)==(0|0);
         if ($367) {
          $368 = ((($$4$lcssa$i)) + 16|0);
          $369 = HEAP32[$368>>2]|0;
          $370 = ($369|0)==(0|0);
          if ($370) {
           $$3370$i = 0;
           break;
          } else {
           $$1368$i = $369;$$1372$i = $368;
          }
         } else {
          $$1368$i = $366;$$1372$i = $365;
         }
         while(1) {
          $371 = ((($$1368$i)) + 20|0);
          $372 = HEAP32[$371>>2]|0;
          $373 = ($372|0)==(0|0);
          if (!($373)) {
           $$1368$i = $372;$$1372$i = $371;
           continue;
          }
          $374 = ((($$1368$i)) + 16|0);
          $375 = HEAP32[$374>>2]|0;
          $376 = ($375|0)==(0|0);
          if ($376) {
           break;
          } else {
           $$1368$i = $375;$$1372$i = $374;
          }
         }
         $377 = ($$1372$i>>>0)<($347>>>0);
         if ($377) {
          _abort();
          // unreachable;
         } else {
          HEAP32[$$1372$i>>2] = 0;
          $$3370$i = $$1368$i;
          break;
         }
        } else {
         $356 = ((($$4$lcssa$i)) + 8|0);
         $357 = HEAP32[$356>>2]|0;
         $358 = ($357>>>0)<($347>>>0);
         if ($358) {
          _abort();
          // unreachable;
         }
         $359 = ((($357)) + 12|0);
         $360 = HEAP32[$359>>2]|0;
         $361 = ($360|0)==($$4$lcssa$i|0);
         if (!($361)) {
          _abort();
          // unreachable;
         }
         $362 = ((($354)) + 8|0);
         $363 = HEAP32[$362>>2]|0;
         $364 = ($363|0)==($$4$lcssa$i|0);
         if ($364) {
          HEAP32[$359>>2] = $354;
          HEAP32[$362>>2] = $357;
          $$3370$i = $354;
          break;
         } else {
          _abort();
          // unreachable;
         }
        }
       } while(0);
       $378 = ($352|0)==(0|0);
       do {
        if ($378) {
         $470 = $247;
        } else {
         $379 = ((($$4$lcssa$i)) + 28|0);
         $380 = HEAP32[$379>>2]|0;
         $381 = (11840 + ($380<<2)|0);
         $382 = HEAP32[$381>>2]|0;
         $383 = ($$4$lcssa$i|0)==($382|0);
         if ($383) {
          HEAP32[$381>>2] = $$3370$i;
          $cond$i204 = ($$3370$i|0)==(0|0);
          if ($cond$i204) {
           $384 = 1 << $380;
           $385 = $384 ^ -1;
           $386 = $247 & $385;
           HEAP32[(11540)>>2] = $386;
           $470 = $386;
           break;
          }
         } else {
          $387 = HEAP32[(11552)>>2]|0;
          $388 = ($352>>>0)<($387>>>0);
          if ($388) {
           _abort();
           // unreachable;
          }
          $389 = ((($352)) + 16|0);
          $390 = HEAP32[$389>>2]|0;
          $391 = ($390|0)==($$4$lcssa$i|0);
          if ($391) {
           HEAP32[$389>>2] = $$3370$i;
          } else {
           $392 = ((($352)) + 20|0);
           HEAP32[$392>>2] = $$3370$i;
          }
          $393 = ($$3370$i|0)==(0|0);
          if ($393) {
           $470 = $247;
           break;
          }
         }
         $394 = HEAP32[(11552)>>2]|0;
         $395 = ($$3370$i>>>0)<($394>>>0);
         if ($395) {
          _abort();
          // unreachable;
         }
         $396 = ((($$3370$i)) + 24|0);
         HEAP32[$396>>2] = $352;
         $397 = ((($$4$lcssa$i)) + 16|0);
         $398 = HEAP32[$397>>2]|0;
         $399 = ($398|0)==(0|0);
         do {
          if (!($399)) {
           $400 = ($398>>>0)<($394>>>0);
           if ($400) {
            _abort();
            // unreachable;
           } else {
            $401 = ((($$3370$i)) + 16|0);
            HEAP32[$401>>2] = $398;
            $402 = ((($398)) + 24|0);
            HEAP32[$402>>2] = $$3370$i;
            break;
           }
          }
         } while(0);
         $403 = ((($$4$lcssa$i)) + 20|0);
         $404 = HEAP32[$403>>2]|0;
         $405 = ($404|0)==(0|0);
         if ($405) {
          $470 = $247;
         } else {
          $406 = HEAP32[(11552)>>2]|0;
          $407 = ($404>>>0)<($406>>>0);
          if ($407) {
           _abort();
           // unreachable;
          } else {
           $408 = ((($$3370$i)) + 20|0);
           HEAP32[$408>>2] = $404;
           $409 = ((($404)) + 24|0);
           HEAP32[$409>>2] = $$3370$i;
           $470 = $247;
           break;
          }
         }
        }
       } while(0);
       $410 = ($$4349$lcssa$i>>>0)<(16);
       do {
        if ($410) {
         $411 = (($$4349$lcssa$i) + ($246))|0;
         $412 = $411 | 3;
         $413 = ((($$4$lcssa$i)) + 4|0);
         HEAP32[$413>>2] = $412;
         $414 = (($$4$lcssa$i) + ($411)|0);
         $415 = ((($414)) + 4|0);
         $416 = HEAP32[$415>>2]|0;
         $417 = $416 | 1;
         HEAP32[$415>>2] = $417;
        } else {
         $418 = $246 | 3;
         $419 = ((($$4$lcssa$i)) + 4|0);
         HEAP32[$419>>2] = $418;
         $420 = $$4349$lcssa$i | 1;
         $421 = ((($349)) + 4|0);
         HEAP32[$421>>2] = $420;
         $422 = (($349) + ($$4349$lcssa$i)|0);
         HEAP32[$422>>2] = $$4349$lcssa$i;
         $423 = $$4349$lcssa$i >>> 3;
         $424 = ($$4349$lcssa$i>>>0)<(256);
         if ($424) {
          $425 = $423 << 1;
          $426 = (11576 + ($425<<2)|0);
          $427 = HEAP32[2884]|0;
          $428 = 1 << $423;
          $429 = $427 & $428;
          $430 = ($429|0)==(0);
          if ($430) {
           $431 = $427 | $428;
           HEAP32[2884] = $431;
           $$pre$i205 = ((($426)) + 8|0);
           $$0366$i = $426;$$pre$phi$i206Z2D = $$pre$i205;
          } else {
           $432 = ((($426)) + 8|0);
           $433 = HEAP32[$432>>2]|0;
           $434 = HEAP32[(11552)>>2]|0;
           $435 = ($433>>>0)<($434>>>0);
           if ($435) {
            _abort();
            // unreachable;
           } else {
            $$0366$i = $433;$$pre$phi$i206Z2D = $432;
           }
          }
          HEAP32[$$pre$phi$i206Z2D>>2] = $349;
          $436 = ((($$0366$i)) + 12|0);
          HEAP32[$436>>2] = $349;
          $437 = ((($349)) + 8|0);
          HEAP32[$437>>2] = $$0366$i;
          $438 = ((($349)) + 12|0);
          HEAP32[$438>>2] = $426;
          break;
         }
         $439 = $$4349$lcssa$i >>> 8;
         $440 = ($439|0)==(0);
         if ($440) {
          $$0359$i = 0;
         } else {
          $441 = ($$4349$lcssa$i>>>0)>(16777215);
          if ($441) {
           $$0359$i = 31;
          } else {
           $442 = (($439) + 1048320)|0;
           $443 = $442 >>> 16;
           $444 = $443 & 8;
           $445 = $439 << $444;
           $446 = (($445) + 520192)|0;
           $447 = $446 >>> 16;
           $448 = $447 & 4;
           $449 = $448 | $444;
           $450 = $445 << $448;
           $451 = (($450) + 245760)|0;
           $452 = $451 >>> 16;
           $453 = $452 & 2;
           $454 = $449 | $453;
           $455 = (14 - ($454))|0;
           $456 = $450 << $453;
           $457 = $456 >>> 15;
           $458 = (($455) + ($457))|0;
           $459 = $458 << 1;
           $460 = (($458) + 7)|0;
           $461 = $$4349$lcssa$i >>> $460;
           $462 = $461 & 1;
           $463 = $462 | $459;
           $$0359$i = $463;
          }
         }
         $464 = (11840 + ($$0359$i<<2)|0);
         $465 = ((($349)) + 28|0);
         HEAP32[$465>>2] = $$0359$i;
         $466 = ((($349)) + 16|0);
         $467 = ((($466)) + 4|0);
         HEAP32[$467>>2] = 0;
         HEAP32[$466>>2] = 0;
         $468 = 1 << $$0359$i;
         $469 = $470 & $468;
         $471 = ($469|0)==(0);
         if ($471) {
          $472 = $470 | $468;
          HEAP32[(11540)>>2] = $472;
          HEAP32[$464>>2] = $349;
          $473 = ((($349)) + 24|0);
          HEAP32[$473>>2] = $464;
          $474 = ((($349)) + 12|0);
          HEAP32[$474>>2] = $349;
          $475 = ((($349)) + 8|0);
          HEAP32[$475>>2] = $349;
          break;
         }
         $476 = HEAP32[$464>>2]|0;
         $477 = ($$0359$i|0)==(31);
         $478 = $$0359$i >>> 1;
         $479 = (25 - ($478))|0;
         $480 = $477 ? 0 : $479;
         $481 = $$4349$lcssa$i << $480;
         $$0342$i = $481;$$0343$i = $476;
         while(1) {
          $482 = ((($$0343$i)) + 4|0);
          $483 = HEAP32[$482>>2]|0;
          $484 = $483 & -8;
          $485 = ($484|0)==($$4349$lcssa$i|0);
          if ($485) {
           label = 148;
           break;
          }
          $486 = $$0342$i >>> 31;
          $487 = (((($$0343$i)) + 16|0) + ($486<<2)|0);
          $488 = $$0342$i << 1;
          $489 = HEAP32[$487>>2]|0;
          $490 = ($489|0)==(0|0);
          if ($490) {
           label = 145;
           break;
          } else {
           $$0342$i = $488;$$0343$i = $489;
          }
         }
         if ((label|0) == 145) {
          $491 = HEAP32[(11552)>>2]|0;
          $492 = ($487>>>0)<($491>>>0);
          if ($492) {
           _abort();
           // unreachable;
          } else {
           HEAP32[$487>>2] = $349;
           $493 = ((($349)) + 24|0);
           HEAP32[$493>>2] = $$0343$i;
           $494 = ((($349)) + 12|0);
           HEAP32[$494>>2] = $349;
           $495 = ((($349)) + 8|0);
           HEAP32[$495>>2] = $349;
           break;
          }
         }
         else if ((label|0) == 148) {
          $496 = ((($$0343$i)) + 8|0);
          $497 = HEAP32[$496>>2]|0;
          $498 = HEAP32[(11552)>>2]|0;
          $499 = ($497>>>0)>=($498>>>0);
          $not$7$i = ($$0343$i>>>0)>=($498>>>0);
          $500 = $499 & $not$7$i;
          if ($500) {
           $501 = ((($497)) + 12|0);
           HEAP32[$501>>2] = $349;
           HEAP32[$496>>2] = $349;
           $502 = ((($349)) + 8|0);
           HEAP32[$502>>2] = $497;
           $503 = ((($349)) + 12|0);
           HEAP32[$503>>2] = $$0343$i;
           $504 = ((($349)) + 24|0);
           HEAP32[$504>>2] = 0;
           break;
          } else {
           _abort();
           // unreachable;
          }
         }
        }
       } while(0);
       $505 = ((($$4$lcssa$i)) + 8|0);
       $$0 = $505;
       STACKTOP = sp;return ($$0|0);
      } else {
       $$0197 = $246;
      }
     }
    }
   }
  }
 } while(0);
 $506 = HEAP32[(11544)>>2]|0;
 $507 = ($506>>>0)<($$0197>>>0);
 if (!($507)) {
  $508 = (($506) - ($$0197))|0;
  $509 = HEAP32[(11556)>>2]|0;
  $510 = ($508>>>0)>(15);
  if ($510) {
   $511 = (($509) + ($$0197)|0);
   HEAP32[(11556)>>2] = $511;
   HEAP32[(11544)>>2] = $508;
   $512 = $508 | 1;
   $513 = ((($511)) + 4|0);
   HEAP32[$513>>2] = $512;
   $514 = (($511) + ($508)|0);
   HEAP32[$514>>2] = $508;
   $515 = $$0197 | 3;
   $516 = ((($509)) + 4|0);
   HEAP32[$516>>2] = $515;
  } else {
   HEAP32[(11544)>>2] = 0;
   HEAP32[(11556)>>2] = 0;
   $517 = $506 | 3;
   $518 = ((($509)) + 4|0);
   HEAP32[$518>>2] = $517;
   $519 = (($509) + ($506)|0);
   $520 = ((($519)) + 4|0);
   $521 = HEAP32[$520>>2]|0;
   $522 = $521 | 1;
   HEAP32[$520>>2] = $522;
  }
  $523 = ((($509)) + 8|0);
  $$0 = $523;
  STACKTOP = sp;return ($$0|0);
 }
 $524 = HEAP32[(11548)>>2]|0;
 $525 = ($524>>>0)>($$0197>>>0);
 if ($525) {
  $526 = (($524) - ($$0197))|0;
  HEAP32[(11548)>>2] = $526;
  $527 = HEAP32[(11560)>>2]|0;
  $528 = (($527) + ($$0197)|0);
  HEAP32[(11560)>>2] = $528;
  $529 = $526 | 1;
  $530 = ((($528)) + 4|0);
  HEAP32[$530>>2] = $529;
  $531 = $$0197 | 3;
  $532 = ((($527)) + 4|0);
  HEAP32[$532>>2] = $531;
  $533 = ((($527)) + 8|0);
  $$0 = $533;
  STACKTOP = sp;return ($$0|0);
 }
 $534 = HEAP32[3002]|0;
 $535 = ($534|0)==(0);
 if ($535) {
  HEAP32[(12016)>>2] = 4096;
  HEAP32[(12012)>>2] = 4096;
  HEAP32[(12020)>>2] = -1;
  HEAP32[(12024)>>2] = -1;
  HEAP32[(12028)>>2] = 0;
  HEAP32[(11980)>>2] = 0;
  $536 = $1;
  $537 = $536 & -16;
  $538 = $537 ^ 1431655768;
  HEAP32[$1>>2] = $538;
  HEAP32[3002] = $538;
  $542 = 4096;
 } else {
  $$pre$i208 = HEAP32[(12016)>>2]|0;
  $542 = $$pre$i208;
 }
 $539 = (($$0197) + 48)|0;
 $540 = (($$0197) + 47)|0;
 $541 = (($542) + ($540))|0;
 $543 = (0 - ($542))|0;
 $544 = $541 & $543;
 $545 = ($544>>>0)>($$0197>>>0);
 if (!($545)) {
  $$0 = 0;
  STACKTOP = sp;return ($$0|0);
 }
 $546 = HEAP32[(11976)>>2]|0;
 $547 = ($546|0)==(0);
 if (!($547)) {
  $548 = HEAP32[(11968)>>2]|0;
  $549 = (($548) + ($544))|0;
  $550 = ($549>>>0)<=($548>>>0);
  $551 = ($549>>>0)>($546>>>0);
  $or$cond1$i210 = $550 | $551;
  if ($or$cond1$i210) {
   $$0 = 0;
   STACKTOP = sp;return ($$0|0);
  }
 }
 $552 = HEAP32[(11980)>>2]|0;
 $553 = $552 & 4;
 $554 = ($553|0)==(0);
 L255: do {
  if ($554) {
   $555 = HEAP32[(11560)>>2]|0;
   $556 = ($555|0)==(0|0);
   L257: do {
    if ($556) {
     label = 172;
    } else {
     $$0$i17$i = (11984);
     while(1) {
      $557 = HEAP32[$$0$i17$i>>2]|0;
      $558 = ($557>>>0)>($555>>>0);
      if (!($558)) {
       $559 = ((($$0$i17$i)) + 4|0);
       $560 = HEAP32[$559>>2]|0;
       $561 = (($557) + ($560)|0);
       $562 = ($561>>>0)>($555>>>0);
       if ($562) {
        break;
       }
      }
      $563 = ((($$0$i17$i)) + 8|0);
      $564 = HEAP32[$563>>2]|0;
      $565 = ($564|0)==(0|0);
      if ($565) {
       label = 172;
       break L257;
      } else {
       $$0$i17$i = $564;
      }
     }
     $588 = (($541) - ($524))|0;
     $589 = $588 & $543;
     $590 = ($589>>>0)<(2147483647);
     if ($590) {
      $591 = (_sbrk(($589|0))|0);
      $592 = HEAP32[$$0$i17$i>>2]|0;
      $593 = HEAP32[$559>>2]|0;
      $594 = (($592) + ($593)|0);
      $595 = ($591|0)==($594|0);
      if ($595) {
       $596 = ($591|0)==((-1)|0);
       if (!($596)) {
        $$723947$i = $589;$$748$i = $591;
        label = 190;
        break L255;
       }
      } else {
       $$2247$ph$i = $591;$$2253$ph$i = $589;
       label = 180;
      }
     }
    }
   } while(0);
   do {
    if ((label|0) == 172) {
     $566 = (_sbrk(0)|0);
     $567 = ($566|0)==((-1)|0);
     if (!($567)) {
      $568 = $566;
      $569 = HEAP32[(12012)>>2]|0;
      $570 = (($569) + -1)|0;
      $571 = $570 & $568;
      $572 = ($571|0)==(0);
      $573 = (($570) + ($568))|0;
      $574 = (0 - ($569))|0;
      $575 = $573 & $574;
      $576 = (($575) - ($568))|0;
      $577 = $572 ? 0 : $576;
      $$$i = (($577) + ($544))|0;
      $578 = HEAP32[(11968)>>2]|0;
      $579 = (($$$i) + ($578))|0;
      $580 = ($$$i>>>0)>($$0197>>>0);
      $581 = ($$$i>>>0)<(2147483647);
      $or$cond$i211 = $580 & $581;
      if ($or$cond$i211) {
       $582 = HEAP32[(11976)>>2]|0;
       $583 = ($582|0)==(0);
       if (!($583)) {
        $584 = ($579>>>0)<=($578>>>0);
        $585 = ($579>>>0)>($582>>>0);
        $or$cond2$i = $584 | $585;
        if ($or$cond2$i) {
         break;
        }
       }
       $586 = (_sbrk(($$$i|0))|0);
       $587 = ($586|0)==($566|0);
       if ($587) {
        $$723947$i = $$$i;$$748$i = $566;
        label = 190;
        break L255;
       } else {
        $$2247$ph$i = $586;$$2253$ph$i = $$$i;
        label = 180;
       }
      }
     }
    }
   } while(0);
   L274: do {
    if ((label|0) == 180) {
     $597 = (0 - ($$2253$ph$i))|0;
     $598 = ($$2247$ph$i|0)!=((-1)|0);
     $599 = ($$2253$ph$i>>>0)<(2147483647);
     $or$cond7$i = $599 & $598;
     $600 = ($539>>>0)>($$2253$ph$i>>>0);
     $or$cond10$i = $600 & $or$cond7$i;
     do {
      if ($or$cond10$i) {
       $601 = HEAP32[(12016)>>2]|0;
       $602 = (($540) - ($$2253$ph$i))|0;
       $603 = (($602) + ($601))|0;
       $604 = (0 - ($601))|0;
       $605 = $603 & $604;
       $606 = ($605>>>0)<(2147483647);
       if ($606) {
        $607 = (_sbrk(($605|0))|0);
        $608 = ($607|0)==((-1)|0);
        if ($608) {
         (_sbrk(($597|0))|0);
         break L274;
        } else {
         $609 = (($605) + ($$2253$ph$i))|0;
         $$5256$i = $609;
         break;
        }
       } else {
        $$5256$i = $$2253$ph$i;
       }
      } else {
       $$5256$i = $$2253$ph$i;
      }
     } while(0);
     $610 = ($$2247$ph$i|0)==((-1)|0);
     if (!($610)) {
      $$723947$i = $$5256$i;$$748$i = $$2247$ph$i;
      label = 190;
      break L255;
     }
    }
   } while(0);
   $611 = HEAP32[(11980)>>2]|0;
   $612 = $611 | 4;
   HEAP32[(11980)>>2] = $612;
   label = 187;
  } else {
   label = 187;
  }
 } while(0);
 if ((label|0) == 187) {
  $613 = ($544>>>0)<(2147483647);
  if ($613) {
   $614 = (_sbrk(($544|0))|0);
   $615 = (_sbrk(0)|0);
   $616 = ($614|0)!=((-1)|0);
   $617 = ($615|0)!=((-1)|0);
   $or$cond5$i = $616 & $617;
   $618 = ($614>>>0)<($615>>>0);
   $or$cond11$i = $618 & $or$cond5$i;
   if ($or$cond11$i) {
    $619 = $615;
    $620 = $614;
    $621 = (($619) - ($620))|0;
    $622 = (($$0197) + 40)|0;
    $$not$i = ($621>>>0)>($622>>>0);
    if ($$not$i) {
     $$723947$i = $621;$$748$i = $614;
     label = 190;
    }
   }
  }
 }
 if ((label|0) == 190) {
  $623 = HEAP32[(11968)>>2]|0;
  $624 = (($623) + ($$723947$i))|0;
  HEAP32[(11968)>>2] = $624;
  $625 = HEAP32[(11972)>>2]|0;
  $626 = ($624>>>0)>($625>>>0);
  if ($626) {
   HEAP32[(11972)>>2] = $624;
  }
  $627 = HEAP32[(11560)>>2]|0;
  $628 = ($627|0)==(0|0);
  do {
   if ($628) {
    $629 = HEAP32[(11552)>>2]|0;
    $630 = ($629|0)==(0|0);
    $631 = ($$748$i>>>0)<($629>>>0);
    $or$cond12$i = $630 | $631;
    if ($or$cond12$i) {
     HEAP32[(11552)>>2] = $$748$i;
    }
    HEAP32[(11984)>>2] = $$748$i;
    HEAP32[(11988)>>2] = $$723947$i;
    HEAP32[(11996)>>2] = 0;
    $632 = HEAP32[3002]|0;
    HEAP32[(11572)>>2] = $632;
    HEAP32[(11568)>>2] = -1;
    $$01$i$i = 0;
    while(1) {
     $633 = $$01$i$i << 1;
     $634 = (11576 + ($633<<2)|0);
     $635 = ((($634)) + 12|0);
     HEAP32[$635>>2] = $634;
     $636 = ((($634)) + 8|0);
     HEAP32[$636>>2] = $634;
     $637 = (($$01$i$i) + 1)|0;
     $exitcond$i$i = ($637|0)==(32);
     if ($exitcond$i$i) {
      break;
     } else {
      $$01$i$i = $637;
     }
    }
    $638 = (($$723947$i) + -40)|0;
    $639 = ((($$748$i)) + 8|0);
    $640 = $639;
    $641 = $640 & 7;
    $642 = ($641|0)==(0);
    $643 = (0 - ($640))|0;
    $644 = $643 & 7;
    $645 = $642 ? 0 : $644;
    $646 = (($$748$i) + ($645)|0);
    $647 = (($638) - ($645))|0;
    HEAP32[(11560)>>2] = $646;
    HEAP32[(11548)>>2] = $647;
    $648 = $647 | 1;
    $649 = ((($646)) + 4|0);
    HEAP32[$649>>2] = $648;
    $650 = (($646) + ($647)|0);
    $651 = ((($650)) + 4|0);
    HEAP32[$651>>2] = 40;
    $652 = HEAP32[(12024)>>2]|0;
    HEAP32[(11564)>>2] = $652;
   } else {
    $$024370$i = (11984);
    while(1) {
     $653 = HEAP32[$$024370$i>>2]|0;
     $654 = ((($$024370$i)) + 4|0);
     $655 = HEAP32[$654>>2]|0;
     $656 = (($653) + ($655)|0);
     $657 = ($$748$i|0)==($656|0);
     if ($657) {
      label = 200;
      break;
     }
     $658 = ((($$024370$i)) + 8|0);
     $659 = HEAP32[$658>>2]|0;
     $660 = ($659|0)==(0|0);
     if ($660) {
      break;
     } else {
      $$024370$i = $659;
     }
    }
    if ((label|0) == 200) {
     $661 = ((($$024370$i)) + 12|0);
     $662 = HEAP32[$661>>2]|0;
     $663 = $662 & 8;
     $664 = ($663|0)==(0);
     if ($664) {
      $665 = ($627>>>0)>=($653>>>0);
      $666 = ($627>>>0)<($$748$i>>>0);
      $or$cond50$i = $666 & $665;
      if ($or$cond50$i) {
       $667 = (($655) + ($$723947$i))|0;
       HEAP32[$654>>2] = $667;
       $668 = HEAP32[(11548)>>2]|0;
       $669 = ((($627)) + 8|0);
       $670 = $669;
       $671 = $670 & 7;
       $672 = ($671|0)==(0);
       $673 = (0 - ($670))|0;
       $674 = $673 & 7;
       $675 = $672 ? 0 : $674;
       $676 = (($627) + ($675)|0);
       $677 = (($$723947$i) - ($675))|0;
       $678 = (($677) + ($668))|0;
       HEAP32[(11560)>>2] = $676;
       HEAP32[(11548)>>2] = $678;
       $679 = $678 | 1;
       $680 = ((($676)) + 4|0);
       HEAP32[$680>>2] = $679;
       $681 = (($676) + ($678)|0);
       $682 = ((($681)) + 4|0);
       HEAP32[$682>>2] = 40;
       $683 = HEAP32[(12024)>>2]|0;
       HEAP32[(11564)>>2] = $683;
       break;
      }
     }
    }
    $684 = HEAP32[(11552)>>2]|0;
    $685 = ($$748$i>>>0)<($684>>>0);
    if ($685) {
     HEAP32[(11552)>>2] = $$748$i;
     $749 = $$748$i;
    } else {
     $749 = $684;
    }
    $686 = (($$748$i) + ($$723947$i)|0);
    $$124469$i = (11984);
    while(1) {
     $687 = HEAP32[$$124469$i>>2]|0;
     $688 = ($687|0)==($686|0);
     if ($688) {
      label = 208;
      break;
     }
     $689 = ((($$124469$i)) + 8|0);
     $690 = HEAP32[$689>>2]|0;
     $691 = ($690|0)==(0|0);
     if ($691) {
      $$0$i$i$i = (11984);
      break;
     } else {
      $$124469$i = $690;
     }
    }
    if ((label|0) == 208) {
     $692 = ((($$124469$i)) + 12|0);
     $693 = HEAP32[$692>>2]|0;
     $694 = $693 & 8;
     $695 = ($694|0)==(0);
     if ($695) {
      HEAP32[$$124469$i>>2] = $$748$i;
      $696 = ((($$124469$i)) + 4|0);
      $697 = HEAP32[$696>>2]|0;
      $698 = (($697) + ($$723947$i))|0;
      HEAP32[$696>>2] = $698;
      $699 = ((($$748$i)) + 8|0);
      $700 = $699;
      $701 = $700 & 7;
      $702 = ($701|0)==(0);
      $703 = (0 - ($700))|0;
      $704 = $703 & 7;
      $705 = $702 ? 0 : $704;
      $706 = (($$748$i) + ($705)|0);
      $707 = ((($686)) + 8|0);
      $708 = $707;
      $709 = $708 & 7;
      $710 = ($709|0)==(0);
      $711 = (0 - ($708))|0;
      $712 = $711 & 7;
      $713 = $710 ? 0 : $712;
      $714 = (($686) + ($713)|0);
      $715 = $714;
      $716 = $706;
      $717 = (($715) - ($716))|0;
      $718 = (($706) + ($$0197)|0);
      $719 = (($717) - ($$0197))|0;
      $720 = $$0197 | 3;
      $721 = ((($706)) + 4|0);
      HEAP32[$721>>2] = $720;
      $722 = ($714|0)==($627|0);
      do {
       if ($722) {
        $723 = HEAP32[(11548)>>2]|0;
        $724 = (($723) + ($719))|0;
        HEAP32[(11548)>>2] = $724;
        HEAP32[(11560)>>2] = $718;
        $725 = $724 | 1;
        $726 = ((($718)) + 4|0);
        HEAP32[$726>>2] = $725;
       } else {
        $727 = HEAP32[(11556)>>2]|0;
        $728 = ($714|0)==($727|0);
        if ($728) {
         $729 = HEAP32[(11544)>>2]|0;
         $730 = (($729) + ($719))|0;
         HEAP32[(11544)>>2] = $730;
         HEAP32[(11556)>>2] = $718;
         $731 = $730 | 1;
         $732 = ((($718)) + 4|0);
         HEAP32[$732>>2] = $731;
         $733 = (($718) + ($730)|0);
         HEAP32[$733>>2] = $730;
         break;
        }
        $734 = ((($714)) + 4|0);
        $735 = HEAP32[$734>>2]|0;
        $736 = $735 & 3;
        $737 = ($736|0)==(1);
        if ($737) {
         $738 = $735 & -8;
         $739 = $735 >>> 3;
         $740 = ($735>>>0)<(256);
         L326: do {
          if ($740) {
           $741 = ((($714)) + 8|0);
           $742 = HEAP32[$741>>2]|0;
           $743 = ((($714)) + 12|0);
           $744 = HEAP32[$743>>2]|0;
           $745 = $739 << 1;
           $746 = (11576 + ($745<<2)|0);
           $747 = ($742|0)==($746|0);
           do {
            if (!($747)) {
             $748 = ($742>>>0)<($749>>>0);
             if ($748) {
              _abort();
              // unreachable;
             }
             $750 = ((($742)) + 12|0);
             $751 = HEAP32[$750>>2]|0;
             $752 = ($751|0)==($714|0);
             if ($752) {
              break;
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $753 = ($744|0)==($742|0);
           if ($753) {
            $754 = 1 << $739;
            $755 = $754 ^ -1;
            $756 = HEAP32[2884]|0;
            $757 = $756 & $755;
            HEAP32[2884] = $757;
            break;
           }
           $758 = ($744|0)==($746|0);
           do {
            if ($758) {
             $$pre9$i$i = ((($744)) + 8|0);
             $$pre$phi10$i$iZ2D = $$pre9$i$i;
            } else {
             $759 = ($744>>>0)<($749>>>0);
             if ($759) {
              _abort();
              // unreachable;
             }
             $760 = ((($744)) + 8|0);
             $761 = HEAP32[$760>>2]|0;
             $762 = ($761|0)==($714|0);
             if ($762) {
              $$pre$phi10$i$iZ2D = $760;
              break;
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $763 = ((($742)) + 12|0);
           HEAP32[$763>>2] = $744;
           HEAP32[$$pre$phi10$i$iZ2D>>2] = $742;
          } else {
           $764 = ((($714)) + 24|0);
           $765 = HEAP32[$764>>2]|0;
           $766 = ((($714)) + 12|0);
           $767 = HEAP32[$766>>2]|0;
           $768 = ($767|0)==($714|0);
           do {
            if ($768) {
             $778 = ((($714)) + 16|0);
             $779 = ((($778)) + 4|0);
             $780 = HEAP32[$779>>2]|0;
             $781 = ($780|0)==(0|0);
             if ($781) {
              $782 = HEAP32[$778>>2]|0;
              $783 = ($782|0)==(0|0);
              if ($783) {
               $$3$i$i = 0;
               break;
              } else {
               $$1290$i$i = $782;$$1292$i$i = $778;
              }
             } else {
              $$1290$i$i = $780;$$1292$i$i = $779;
             }
             while(1) {
              $784 = ((($$1290$i$i)) + 20|0);
              $785 = HEAP32[$784>>2]|0;
              $786 = ($785|0)==(0|0);
              if (!($786)) {
               $$1290$i$i = $785;$$1292$i$i = $784;
               continue;
              }
              $787 = ((($$1290$i$i)) + 16|0);
              $788 = HEAP32[$787>>2]|0;
              $789 = ($788|0)==(0|0);
              if ($789) {
               break;
              } else {
               $$1290$i$i = $788;$$1292$i$i = $787;
              }
             }
             $790 = ($$1292$i$i>>>0)<($749>>>0);
             if ($790) {
              _abort();
              // unreachable;
             } else {
              HEAP32[$$1292$i$i>>2] = 0;
              $$3$i$i = $$1290$i$i;
              break;
             }
            } else {
             $769 = ((($714)) + 8|0);
             $770 = HEAP32[$769>>2]|0;
             $771 = ($770>>>0)<($749>>>0);
             if ($771) {
              _abort();
              // unreachable;
             }
             $772 = ((($770)) + 12|0);
             $773 = HEAP32[$772>>2]|0;
             $774 = ($773|0)==($714|0);
             if (!($774)) {
              _abort();
              // unreachable;
             }
             $775 = ((($767)) + 8|0);
             $776 = HEAP32[$775>>2]|0;
             $777 = ($776|0)==($714|0);
             if ($777) {
              HEAP32[$772>>2] = $767;
              HEAP32[$775>>2] = $770;
              $$3$i$i = $767;
              break;
             } else {
              _abort();
              // unreachable;
             }
            }
           } while(0);
           $791 = ($765|0)==(0|0);
           if ($791) {
            break;
           }
           $792 = ((($714)) + 28|0);
           $793 = HEAP32[$792>>2]|0;
           $794 = (11840 + ($793<<2)|0);
           $795 = HEAP32[$794>>2]|0;
           $796 = ($714|0)==($795|0);
           do {
            if ($796) {
             HEAP32[$794>>2] = $$3$i$i;
             $cond$i$i = ($$3$i$i|0)==(0|0);
             if (!($cond$i$i)) {
              break;
             }
             $797 = 1 << $793;
             $798 = $797 ^ -1;
             $799 = HEAP32[(11540)>>2]|0;
             $800 = $799 & $798;
             HEAP32[(11540)>>2] = $800;
             break L326;
            } else {
             $801 = HEAP32[(11552)>>2]|0;
             $802 = ($765>>>0)<($801>>>0);
             if ($802) {
              _abort();
              // unreachable;
             }
             $803 = ((($765)) + 16|0);
             $804 = HEAP32[$803>>2]|0;
             $805 = ($804|0)==($714|0);
             if ($805) {
              HEAP32[$803>>2] = $$3$i$i;
             } else {
              $806 = ((($765)) + 20|0);
              HEAP32[$806>>2] = $$3$i$i;
             }
             $807 = ($$3$i$i|0)==(0|0);
             if ($807) {
              break L326;
             }
            }
           } while(0);
           $808 = HEAP32[(11552)>>2]|0;
           $809 = ($$3$i$i>>>0)<($808>>>0);
           if ($809) {
            _abort();
            // unreachable;
           }
           $810 = ((($$3$i$i)) + 24|0);
           HEAP32[$810>>2] = $765;
           $811 = ((($714)) + 16|0);
           $812 = HEAP32[$811>>2]|0;
           $813 = ($812|0)==(0|0);
           do {
            if (!($813)) {
             $814 = ($812>>>0)<($808>>>0);
             if ($814) {
              _abort();
              // unreachable;
             } else {
              $815 = ((($$3$i$i)) + 16|0);
              HEAP32[$815>>2] = $812;
              $816 = ((($812)) + 24|0);
              HEAP32[$816>>2] = $$3$i$i;
              break;
             }
            }
           } while(0);
           $817 = ((($811)) + 4|0);
           $818 = HEAP32[$817>>2]|0;
           $819 = ($818|0)==(0|0);
           if ($819) {
            break;
           }
           $820 = HEAP32[(11552)>>2]|0;
           $821 = ($818>>>0)<($820>>>0);
           if ($821) {
            _abort();
            // unreachable;
           } else {
            $822 = ((($$3$i$i)) + 20|0);
            HEAP32[$822>>2] = $818;
            $823 = ((($818)) + 24|0);
            HEAP32[$823>>2] = $$3$i$i;
            break;
           }
          }
         } while(0);
         $824 = (($714) + ($738)|0);
         $825 = (($738) + ($719))|0;
         $$0$i18$i = $824;$$0286$i$i = $825;
        } else {
         $$0$i18$i = $714;$$0286$i$i = $719;
        }
        $826 = ((($$0$i18$i)) + 4|0);
        $827 = HEAP32[$826>>2]|0;
        $828 = $827 & -2;
        HEAP32[$826>>2] = $828;
        $829 = $$0286$i$i | 1;
        $830 = ((($718)) + 4|0);
        HEAP32[$830>>2] = $829;
        $831 = (($718) + ($$0286$i$i)|0);
        HEAP32[$831>>2] = $$0286$i$i;
        $832 = $$0286$i$i >>> 3;
        $833 = ($$0286$i$i>>>0)<(256);
        if ($833) {
         $834 = $832 << 1;
         $835 = (11576 + ($834<<2)|0);
         $836 = HEAP32[2884]|0;
         $837 = 1 << $832;
         $838 = $836 & $837;
         $839 = ($838|0)==(0);
         do {
          if ($839) {
           $840 = $836 | $837;
           HEAP32[2884] = $840;
           $$pre$i19$i = ((($835)) + 8|0);
           $$0294$i$i = $835;$$pre$phi$i20$iZ2D = $$pre$i19$i;
          } else {
           $841 = ((($835)) + 8|0);
           $842 = HEAP32[$841>>2]|0;
           $843 = HEAP32[(11552)>>2]|0;
           $844 = ($842>>>0)<($843>>>0);
           if (!($844)) {
            $$0294$i$i = $842;$$pre$phi$i20$iZ2D = $841;
            break;
           }
           _abort();
           // unreachable;
          }
         } while(0);
         HEAP32[$$pre$phi$i20$iZ2D>>2] = $718;
         $845 = ((($$0294$i$i)) + 12|0);
         HEAP32[$845>>2] = $718;
         $846 = ((($718)) + 8|0);
         HEAP32[$846>>2] = $$0294$i$i;
         $847 = ((($718)) + 12|0);
         HEAP32[$847>>2] = $835;
         break;
        }
        $848 = $$0286$i$i >>> 8;
        $849 = ($848|0)==(0);
        do {
         if ($849) {
          $$0295$i$i = 0;
         } else {
          $850 = ($$0286$i$i>>>0)>(16777215);
          if ($850) {
           $$0295$i$i = 31;
           break;
          }
          $851 = (($848) + 1048320)|0;
          $852 = $851 >>> 16;
          $853 = $852 & 8;
          $854 = $848 << $853;
          $855 = (($854) + 520192)|0;
          $856 = $855 >>> 16;
          $857 = $856 & 4;
          $858 = $857 | $853;
          $859 = $854 << $857;
          $860 = (($859) + 245760)|0;
          $861 = $860 >>> 16;
          $862 = $861 & 2;
          $863 = $858 | $862;
          $864 = (14 - ($863))|0;
          $865 = $859 << $862;
          $866 = $865 >>> 15;
          $867 = (($864) + ($866))|0;
          $868 = $867 << 1;
          $869 = (($867) + 7)|0;
          $870 = $$0286$i$i >>> $869;
          $871 = $870 & 1;
          $872 = $871 | $868;
          $$0295$i$i = $872;
         }
        } while(0);
        $873 = (11840 + ($$0295$i$i<<2)|0);
        $874 = ((($718)) + 28|0);
        HEAP32[$874>>2] = $$0295$i$i;
        $875 = ((($718)) + 16|0);
        $876 = ((($875)) + 4|0);
        HEAP32[$876>>2] = 0;
        HEAP32[$875>>2] = 0;
        $877 = HEAP32[(11540)>>2]|0;
        $878 = 1 << $$0295$i$i;
        $879 = $877 & $878;
        $880 = ($879|0)==(0);
        if ($880) {
         $881 = $877 | $878;
         HEAP32[(11540)>>2] = $881;
         HEAP32[$873>>2] = $718;
         $882 = ((($718)) + 24|0);
         HEAP32[$882>>2] = $873;
         $883 = ((($718)) + 12|0);
         HEAP32[$883>>2] = $718;
         $884 = ((($718)) + 8|0);
         HEAP32[$884>>2] = $718;
         break;
        }
        $885 = HEAP32[$873>>2]|0;
        $886 = ($$0295$i$i|0)==(31);
        $887 = $$0295$i$i >>> 1;
        $888 = (25 - ($887))|0;
        $889 = $886 ? 0 : $888;
        $890 = $$0286$i$i << $889;
        $$0287$i$i = $890;$$0288$i$i = $885;
        while(1) {
         $891 = ((($$0288$i$i)) + 4|0);
         $892 = HEAP32[$891>>2]|0;
         $893 = $892 & -8;
         $894 = ($893|0)==($$0286$i$i|0);
         if ($894) {
          label = 278;
          break;
         }
         $895 = $$0287$i$i >>> 31;
         $896 = (((($$0288$i$i)) + 16|0) + ($895<<2)|0);
         $897 = $$0287$i$i << 1;
         $898 = HEAP32[$896>>2]|0;
         $899 = ($898|0)==(0|0);
         if ($899) {
          label = 275;
          break;
         } else {
          $$0287$i$i = $897;$$0288$i$i = $898;
         }
        }
        if ((label|0) == 275) {
         $900 = HEAP32[(11552)>>2]|0;
         $901 = ($896>>>0)<($900>>>0);
         if ($901) {
          _abort();
          // unreachable;
         } else {
          HEAP32[$896>>2] = $718;
          $902 = ((($718)) + 24|0);
          HEAP32[$902>>2] = $$0288$i$i;
          $903 = ((($718)) + 12|0);
          HEAP32[$903>>2] = $718;
          $904 = ((($718)) + 8|0);
          HEAP32[$904>>2] = $718;
          break;
         }
        }
        else if ((label|0) == 278) {
         $905 = ((($$0288$i$i)) + 8|0);
         $906 = HEAP32[$905>>2]|0;
         $907 = HEAP32[(11552)>>2]|0;
         $908 = ($906>>>0)>=($907>>>0);
         $not$$i22$i = ($$0288$i$i>>>0)>=($907>>>0);
         $909 = $908 & $not$$i22$i;
         if ($909) {
          $910 = ((($906)) + 12|0);
          HEAP32[$910>>2] = $718;
          HEAP32[$905>>2] = $718;
          $911 = ((($718)) + 8|0);
          HEAP32[$911>>2] = $906;
          $912 = ((($718)) + 12|0);
          HEAP32[$912>>2] = $$0288$i$i;
          $913 = ((($718)) + 24|0);
          HEAP32[$913>>2] = 0;
          break;
         } else {
          _abort();
          // unreachable;
         }
        }
       }
      } while(0);
      $1044 = ((($706)) + 8|0);
      $$0 = $1044;
      STACKTOP = sp;return ($$0|0);
     } else {
      $$0$i$i$i = (11984);
     }
    }
    while(1) {
     $914 = HEAP32[$$0$i$i$i>>2]|0;
     $915 = ($914>>>0)>($627>>>0);
     if (!($915)) {
      $916 = ((($$0$i$i$i)) + 4|0);
      $917 = HEAP32[$916>>2]|0;
      $918 = (($914) + ($917)|0);
      $919 = ($918>>>0)>($627>>>0);
      if ($919) {
       break;
      }
     }
     $920 = ((($$0$i$i$i)) + 8|0);
     $921 = HEAP32[$920>>2]|0;
     $$0$i$i$i = $921;
    }
    $922 = ((($918)) + -47|0);
    $923 = ((($922)) + 8|0);
    $924 = $923;
    $925 = $924 & 7;
    $926 = ($925|0)==(0);
    $927 = (0 - ($924))|0;
    $928 = $927 & 7;
    $929 = $926 ? 0 : $928;
    $930 = (($922) + ($929)|0);
    $931 = ((($627)) + 16|0);
    $932 = ($930>>>0)<($931>>>0);
    $933 = $932 ? $627 : $930;
    $934 = ((($933)) + 8|0);
    $935 = ((($933)) + 24|0);
    $936 = (($$723947$i) + -40)|0;
    $937 = ((($$748$i)) + 8|0);
    $938 = $937;
    $939 = $938 & 7;
    $940 = ($939|0)==(0);
    $941 = (0 - ($938))|0;
    $942 = $941 & 7;
    $943 = $940 ? 0 : $942;
    $944 = (($$748$i) + ($943)|0);
    $945 = (($936) - ($943))|0;
    HEAP32[(11560)>>2] = $944;
    HEAP32[(11548)>>2] = $945;
    $946 = $945 | 1;
    $947 = ((($944)) + 4|0);
    HEAP32[$947>>2] = $946;
    $948 = (($944) + ($945)|0);
    $949 = ((($948)) + 4|0);
    HEAP32[$949>>2] = 40;
    $950 = HEAP32[(12024)>>2]|0;
    HEAP32[(11564)>>2] = $950;
    $951 = ((($933)) + 4|0);
    HEAP32[$951>>2] = 27;
    ;HEAP32[$934>>2]=HEAP32[(11984)>>2]|0;HEAP32[$934+4>>2]=HEAP32[(11984)+4>>2]|0;HEAP32[$934+8>>2]=HEAP32[(11984)+8>>2]|0;HEAP32[$934+12>>2]=HEAP32[(11984)+12>>2]|0;
    HEAP32[(11984)>>2] = $$748$i;
    HEAP32[(11988)>>2] = $$723947$i;
    HEAP32[(11996)>>2] = 0;
    HEAP32[(11992)>>2] = $934;
    $$0$i$i = $935;
    while(1) {
     $952 = ((($$0$i$i)) + 4|0);
     HEAP32[$952>>2] = 7;
     $953 = ((($952)) + 4|0);
     $954 = ($953>>>0)<($918>>>0);
     if ($954) {
      $$0$i$i = $952;
     } else {
      break;
     }
    }
    $955 = ($933|0)==($627|0);
    if (!($955)) {
     $956 = $933;
     $957 = $627;
     $958 = (($956) - ($957))|0;
     $959 = HEAP32[$951>>2]|0;
     $960 = $959 & -2;
     HEAP32[$951>>2] = $960;
     $961 = $958 | 1;
     $962 = ((($627)) + 4|0);
     HEAP32[$962>>2] = $961;
     HEAP32[$933>>2] = $958;
     $963 = $958 >>> 3;
     $964 = ($958>>>0)<(256);
     if ($964) {
      $965 = $963 << 1;
      $966 = (11576 + ($965<<2)|0);
      $967 = HEAP32[2884]|0;
      $968 = 1 << $963;
      $969 = $967 & $968;
      $970 = ($969|0)==(0);
      if ($970) {
       $971 = $967 | $968;
       HEAP32[2884] = $971;
       $$pre$i$i = ((($966)) + 8|0);
       $$0211$i$i = $966;$$pre$phi$i$iZ2D = $$pre$i$i;
      } else {
       $972 = ((($966)) + 8|0);
       $973 = HEAP32[$972>>2]|0;
       $974 = HEAP32[(11552)>>2]|0;
       $975 = ($973>>>0)<($974>>>0);
       if ($975) {
        _abort();
        // unreachable;
       } else {
        $$0211$i$i = $973;$$pre$phi$i$iZ2D = $972;
       }
      }
      HEAP32[$$pre$phi$i$iZ2D>>2] = $627;
      $976 = ((($$0211$i$i)) + 12|0);
      HEAP32[$976>>2] = $627;
      $977 = ((($627)) + 8|0);
      HEAP32[$977>>2] = $$0211$i$i;
      $978 = ((($627)) + 12|0);
      HEAP32[$978>>2] = $966;
      break;
     }
     $979 = $958 >>> 8;
     $980 = ($979|0)==(0);
     if ($980) {
      $$0212$i$i = 0;
     } else {
      $981 = ($958>>>0)>(16777215);
      if ($981) {
       $$0212$i$i = 31;
      } else {
       $982 = (($979) + 1048320)|0;
       $983 = $982 >>> 16;
       $984 = $983 & 8;
       $985 = $979 << $984;
       $986 = (($985) + 520192)|0;
       $987 = $986 >>> 16;
       $988 = $987 & 4;
       $989 = $988 | $984;
       $990 = $985 << $988;
       $991 = (($990) + 245760)|0;
       $992 = $991 >>> 16;
       $993 = $992 & 2;
       $994 = $989 | $993;
       $995 = (14 - ($994))|0;
       $996 = $990 << $993;
       $997 = $996 >>> 15;
       $998 = (($995) + ($997))|0;
       $999 = $998 << 1;
       $1000 = (($998) + 7)|0;
       $1001 = $958 >>> $1000;
       $1002 = $1001 & 1;
       $1003 = $1002 | $999;
       $$0212$i$i = $1003;
      }
     }
     $1004 = (11840 + ($$0212$i$i<<2)|0);
     $1005 = ((($627)) + 28|0);
     HEAP32[$1005>>2] = $$0212$i$i;
     $1006 = ((($627)) + 20|0);
     HEAP32[$1006>>2] = 0;
     HEAP32[$931>>2] = 0;
     $1007 = HEAP32[(11540)>>2]|0;
     $1008 = 1 << $$0212$i$i;
     $1009 = $1007 & $1008;
     $1010 = ($1009|0)==(0);
     if ($1010) {
      $1011 = $1007 | $1008;
      HEAP32[(11540)>>2] = $1011;
      HEAP32[$1004>>2] = $627;
      $1012 = ((($627)) + 24|0);
      HEAP32[$1012>>2] = $1004;
      $1013 = ((($627)) + 12|0);
      HEAP32[$1013>>2] = $627;
      $1014 = ((($627)) + 8|0);
      HEAP32[$1014>>2] = $627;
      break;
     }
     $1015 = HEAP32[$1004>>2]|0;
     $1016 = ($$0212$i$i|0)==(31);
     $1017 = $$0212$i$i >>> 1;
     $1018 = (25 - ($1017))|0;
     $1019 = $1016 ? 0 : $1018;
     $1020 = $958 << $1019;
     $$0206$i$i = $1020;$$0207$i$i = $1015;
     while(1) {
      $1021 = ((($$0207$i$i)) + 4|0);
      $1022 = HEAP32[$1021>>2]|0;
      $1023 = $1022 & -8;
      $1024 = ($1023|0)==($958|0);
      if ($1024) {
       label = 304;
       break;
      }
      $1025 = $$0206$i$i >>> 31;
      $1026 = (((($$0207$i$i)) + 16|0) + ($1025<<2)|0);
      $1027 = $$0206$i$i << 1;
      $1028 = HEAP32[$1026>>2]|0;
      $1029 = ($1028|0)==(0|0);
      if ($1029) {
       label = 301;
       break;
      } else {
       $$0206$i$i = $1027;$$0207$i$i = $1028;
      }
     }
     if ((label|0) == 301) {
      $1030 = HEAP32[(11552)>>2]|0;
      $1031 = ($1026>>>0)<($1030>>>0);
      if ($1031) {
       _abort();
       // unreachable;
      } else {
       HEAP32[$1026>>2] = $627;
       $1032 = ((($627)) + 24|0);
       HEAP32[$1032>>2] = $$0207$i$i;
       $1033 = ((($627)) + 12|0);
       HEAP32[$1033>>2] = $627;
       $1034 = ((($627)) + 8|0);
       HEAP32[$1034>>2] = $627;
       break;
      }
     }
     else if ((label|0) == 304) {
      $1035 = ((($$0207$i$i)) + 8|0);
      $1036 = HEAP32[$1035>>2]|0;
      $1037 = HEAP32[(11552)>>2]|0;
      $1038 = ($1036>>>0)>=($1037>>>0);
      $not$$i$i = ($$0207$i$i>>>0)>=($1037>>>0);
      $1039 = $1038 & $not$$i$i;
      if ($1039) {
       $1040 = ((($1036)) + 12|0);
       HEAP32[$1040>>2] = $627;
       HEAP32[$1035>>2] = $627;
       $1041 = ((($627)) + 8|0);
       HEAP32[$1041>>2] = $1036;
       $1042 = ((($627)) + 12|0);
       HEAP32[$1042>>2] = $$0207$i$i;
       $1043 = ((($627)) + 24|0);
       HEAP32[$1043>>2] = 0;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    }
   }
  } while(0);
  $1045 = HEAP32[(11548)>>2]|0;
  $1046 = ($1045>>>0)>($$0197>>>0);
  if ($1046) {
   $1047 = (($1045) - ($$0197))|0;
   HEAP32[(11548)>>2] = $1047;
   $1048 = HEAP32[(11560)>>2]|0;
   $1049 = (($1048) + ($$0197)|0);
   HEAP32[(11560)>>2] = $1049;
   $1050 = $1047 | 1;
   $1051 = ((($1049)) + 4|0);
   HEAP32[$1051>>2] = $1050;
   $1052 = $$0197 | 3;
   $1053 = ((($1048)) + 4|0);
   HEAP32[$1053>>2] = $1052;
   $1054 = ((($1048)) + 8|0);
   $$0 = $1054;
   STACKTOP = sp;return ($$0|0);
  }
 }
 $1055 = (___errno_location()|0);
 HEAP32[$1055>>2] = 12;
 $$0 = 0;
 STACKTOP = sp;return ($$0|0);
}
function _free($0) {
 $0 = $0|0;
 var $$0211$i = 0, $$0211$in$i = 0, $$0381 = 0, $$0382 = 0, $$0394 = 0, $$0401 = 0, $$1 = 0, $$1380 = 0, $$1385 = 0, $$1388 = 0, $$1396 = 0, $$1400 = 0, $$2 = 0, $$3 = 0, $$3398 = 0, $$pre = 0, $$pre$phi439Z2D = 0, $$pre$phi441Z2D = 0, $$pre$phiZ2D = 0, $$pre438 = 0;
 var $$pre440 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0;
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
 var $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0;
 var $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0;
 var $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0;
 var $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0;
 var $99 = 0, $cond418 = 0, $cond419 = 0, $not$ = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $1 = ($0|0)==(0|0);
 if ($1) {
  return;
 }
 $2 = ((($0)) + -8|0);
 $3 = HEAP32[(11552)>>2]|0;
 $4 = ($2>>>0)<($3>>>0);
 if ($4) {
  _abort();
  // unreachable;
 }
 $5 = ((($0)) + -4|0);
 $6 = HEAP32[$5>>2]|0;
 $7 = $6 & 3;
 $8 = ($7|0)==(1);
 if ($8) {
  _abort();
  // unreachable;
 }
 $9 = $6 & -8;
 $10 = (($2) + ($9)|0);
 $11 = $6 & 1;
 $12 = ($11|0)==(0);
 do {
  if ($12) {
   $13 = HEAP32[$2>>2]|0;
   $14 = ($7|0)==(0);
   if ($14) {
    return;
   }
   $15 = (0 - ($13))|0;
   $16 = (($2) + ($15)|0);
   $17 = (($13) + ($9))|0;
   $18 = ($16>>>0)<($3>>>0);
   if ($18) {
    _abort();
    // unreachable;
   }
   $19 = HEAP32[(11556)>>2]|0;
   $20 = ($16|0)==($19|0);
   if ($20) {
    $105 = ((($10)) + 4|0);
    $106 = HEAP32[$105>>2]|0;
    $107 = $106 & 3;
    $108 = ($107|0)==(3);
    if (!($108)) {
     $$1 = $16;$$1380 = $17;
     break;
    }
    HEAP32[(11544)>>2] = $17;
    $109 = $106 & -2;
    HEAP32[$105>>2] = $109;
    $110 = $17 | 1;
    $111 = ((($16)) + 4|0);
    HEAP32[$111>>2] = $110;
    $112 = (($16) + ($17)|0);
    HEAP32[$112>>2] = $17;
    return;
   }
   $21 = $13 >>> 3;
   $22 = ($13>>>0)<(256);
   if ($22) {
    $23 = ((($16)) + 8|0);
    $24 = HEAP32[$23>>2]|0;
    $25 = ((($16)) + 12|0);
    $26 = HEAP32[$25>>2]|0;
    $27 = $21 << 1;
    $28 = (11576 + ($27<<2)|0);
    $29 = ($24|0)==($28|0);
    if (!($29)) {
     $30 = ($24>>>0)<($3>>>0);
     if ($30) {
      _abort();
      // unreachable;
     }
     $31 = ((($24)) + 12|0);
     $32 = HEAP32[$31>>2]|0;
     $33 = ($32|0)==($16|0);
     if (!($33)) {
      _abort();
      // unreachable;
     }
    }
    $34 = ($26|0)==($24|0);
    if ($34) {
     $35 = 1 << $21;
     $36 = $35 ^ -1;
     $37 = HEAP32[2884]|0;
     $38 = $37 & $36;
     HEAP32[2884] = $38;
     $$1 = $16;$$1380 = $17;
     break;
    }
    $39 = ($26|0)==($28|0);
    if ($39) {
     $$pre440 = ((($26)) + 8|0);
     $$pre$phi441Z2D = $$pre440;
    } else {
     $40 = ($26>>>0)<($3>>>0);
     if ($40) {
      _abort();
      // unreachable;
     }
     $41 = ((($26)) + 8|0);
     $42 = HEAP32[$41>>2]|0;
     $43 = ($42|0)==($16|0);
     if ($43) {
      $$pre$phi441Z2D = $41;
     } else {
      _abort();
      // unreachable;
     }
    }
    $44 = ((($24)) + 12|0);
    HEAP32[$44>>2] = $26;
    HEAP32[$$pre$phi441Z2D>>2] = $24;
    $$1 = $16;$$1380 = $17;
    break;
   }
   $45 = ((($16)) + 24|0);
   $46 = HEAP32[$45>>2]|0;
   $47 = ((($16)) + 12|0);
   $48 = HEAP32[$47>>2]|0;
   $49 = ($48|0)==($16|0);
   do {
    if ($49) {
     $59 = ((($16)) + 16|0);
     $60 = ((($59)) + 4|0);
     $61 = HEAP32[$60>>2]|0;
     $62 = ($61|0)==(0|0);
     if ($62) {
      $63 = HEAP32[$59>>2]|0;
      $64 = ($63|0)==(0|0);
      if ($64) {
       $$3 = 0;
       break;
      } else {
       $$1385 = $63;$$1388 = $59;
      }
     } else {
      $$1385 = $61;$$1388 = $60;
     }
     while(1) {
      $65 = ((($$1385)) + 20|0);
      $66 = HEAP32[$65>>2]|0;
      $67 = ($66|0)==(0|0);
      if (!($67)) {
       $$1385 = $66;$$1388 = $65;
       continue;
      }
      $68 = ((($$1385)) + 16|0);
      $69 = HEAP32[$68>>2]|0;
      $70 = ($69|0)==(0|0);
      if ($70) {
       break;
      } else {
       $$1385 = $69;$$1388 = $68;
      }
     }
     $71 = ($$1388>>>0)<($3>>>0);
     if ($71) {
      _abort();
      // unreachable;
     } else {
      HEAP32[$$1388>>2] = 0;
      $$3 = $$1385;
      break;
     }
    } else {
     $50 = ((($16)) + 8|0);
     $51 = HEAP32[$50>>2]|0;
     $52 = ($51>>>0)<($3>>>0);
     if ($52) {
      _abort();
      // unreachable;
     }
     $53 = ((($51)) + 12|0);
     $54 = HEAP32[$53>>2]|0;
     $55 = ($54|0)==($16|0);
     if (!($55)) {
      _abort();
      // unreachable;
     }
     $56 = ((($48)) + 8|0);
     $57 = HEAP32[$56>>2]|0;
     $58 = ($57|0)==($16|0);
     if ($58) {
      HEAP32[$53>>2] = $48;
      HEAP32[$56>>2] = $51;
      $$3 = $48;
      break;
     } else {
      _abort();
      // unreachable;
     }
    }
   } while(0);
   $72 = ($46|0)==(0|0);
   if ($72) {
    $$1 = $16;$$1380 = $17;
   } else {
    $73 = ((($16)) + 28|0);
    $74 = HEAP32[$73>>2]|0;
    $75 = (11840 + ($74<<2)|0);
    $76 = HEAP32[$75>>2]|0;
    $77 = ($16|0)==($76|0);
    if ($77) {
     HEAP32[$75>>2] = $$3;
     $cond418 = ($$3|0)==(0|0);
     if ($cond418) {
      $78 = 1 << $74;
      $79 = $78 ^ -1;
      $80 = HEAP32[(11540)>>2]|0;
      $81 = $80 & $79;
      HEAP32[(11540)>>2] = $81;
      $$1 = $16;$$1380 = $17;
      break;
     }
    } else {
     $82 = HEAP32[(11552)>>2]|0;
     $83 = ($46>>>0)<($82>>>0);
     if ($83) {
      _abort();
      // unreachable;
     }
     $84 = ((($46)) + 16|0);
     $85 = HEAP32[$84>>2]|0;
     $86 = ($85|0)==($16|0);
     if ($86) {
      HEAP32[$84>>2] = $$3;
     } else {
      $87 = ((($46)) + 20|0);
      HEAP32[$87>>2] = $$3;
     }
     $88 = ($$3|0)==(0|0);
     if ($88) {
      $$1 = $16;$$1380 = $17;
      break;
     }
    }
    $89 = HEAP32[(11552)>>2]|0;
    $90 = ($$3>>>0)<($89>>>0);
    if ($90) {
     _abort();
     // unreachable;
    }
    $91 = ((($$3)) + 24|0);
    HEAP32[$91>>2] = $46;
    $92 = ((($16)) + 16|0);
    $93 = HEAP32[$92>>2]|0;
    $94 = ($93|0)==(0|0);
    do {
     if (!($94)) {
      $95 = ($93>>>0)<($89>>>0);
      if ($95) {
       _abort();
       // unreachable;
      } else {
       $96 = ((($$3)) + 16|0);
       HEAP32[$96>>2] = $93;
       $97 = ((($93)) + 24|0);
       HEAP32[$97>>2] = $$3;
       break;
      }
     }
    } while(0);
    $98 = ((($92)) + 4|0);
    $99 = HEAP32[$98>>2]|0;
    $100 = ($99|0)==(0|0);
    if ($100) {
     $$1 = $16;$$1380 = $17;
    } else {
     $101 = HEAP32[(11552)>>2]|0;
     $102 = ($99>>>0)<($101>>>0);
     if ($102) {
      _abort();
      // unreachable;
     } else {
      $103 = ((($$3)) + 20|0);
      HEAP32[$103>>2] = $99;
      $104 = ((($99)) + 24|0);
      HEAP32[$104>>2] = $$3;
      $$1 = $16;$$1380 = $17;
      break;
     }
    }
   }
  } else {
   $$1 = $2;$$1380 = $9;
  }
 } while(0);
 $113 = ($$1>>>0)<($10>>>0);
 if (!($113)) {
  _abort();
  // unreachable;
 }
 $114 = ((($10)) + 4|0);
 $115 = HEAP32[$114>>2]|0;
 $116 = $115 & 1;
 $117 = ($116|0)==(0);
 if ($117) {
  _abort();
  // unreachable;
 }
 $118 = $115 & 2;
 $119 = ($118|0)==(0);
 if ($119) {
  $120 = HEAP32[(11560)>>2]|0;
  $121 = ($10|0)==($120|0);
  if ($121) {
   $122 = HEAP32[(11548)>>2]|0;
   $123 = (($122) + ($$1380))|0;
   HEAP32[(11548)>>2] = $123;
   HEAP32[(11560)>>2] = $$1;
   $124 = $123 | 1;
   $125 = ((($$1)) + 4|0);
   HEAP32[$125>>2] = $124;
   $126 = HEAP32[(11556)>>2]|0;
   $127 = ($$1|0)==($126|0);
   if (!($127)) {
    return;
   }
   HEAP32[(11556)>>2] = 0;
   HEAP32[(11544)>>2] = 0;
   return;
  }
  $128 = HEAP32[(11556)>>2]|0;
  $129 = ($10|0)==($128|0);
  if ($129) {
   $130 = HEAP32[(11544)>>2]|0;
   $131 = (($130) + ($$1380))|0;
   HEAP32[(11544)>>2] = $131;
   HEAP32[(11556)>>2] = $$1;
   $132 = $131 | 1;
   $133 = ((($$1)) + 4|0);
   HEAP32[$133>>2] = $132;
   $134 = (($$1) + ($131)|0);
   HEAP32[$134>>2] = $131;
   return;
  }
  $135 = $115 & -8;
  $136 = (($135) + ($$1380))|0;
  $137 = $115 >>> 3;
  $138 = ($115>>>0)<(256);
  do {
   if ($138) {
    $139 = ((($10)) + 8|0);
    $140 = HEAP32[$139>>2]|0;
    $141 = ((($10)) + 12|0);
    $142 = HEAP32[$141>>2]|0;
    $143 = $137 << 1;
    $144 = (11576 + ($143<<2)|0);
    $145 = ($140|0)==($144|0);
    if (!($145)) {
     $146 = HEAP32[(11552)>>2]|0;
     $147 = ($140>>>0)<($146>>>0);
     if ($147) {
      _abort();
      // unreachable;
     }
     $148 = ((($140)) + 12|0);
     $149 = HEAP32[$148>>2]|0;
     $150 = ($149|0)==($10|0);
     if (!($150)) {
      _abort();
      // unreachable;
     }
    }
    $151 = ($142|0)==($140|0);
    if ($151) {
     $152 = 1 << $137;
     $153 = $152 ^ -1;
     $154 = HEAP32[2884]|0;
     $155 = $154 & $153;
     HEAP32[2884] = $155;
     break;
    }
    $156 = ($142|0)==($144|0);
    if ($156) {
     $$pre438 = ((($142)) + 8|0);
     $$pre$phi439Z2D = $$pre438;
    } else {
     $157 = HEAP32[(11552)>>2]|0;
     $158 = ($142>>>0)<($157>>>0);
     if ($158) {
      _abort();
      // unreachable;
     }
     $159 = ((($142)) + 8|0);
     $160 = HEAP32[$159>>2]|0;
     $161 = ($160|0)==($10|0);
     if ($161) {
      $$pre$phi439Z2D = $159;
     } else {
      _abort();
      // unreachable;
     }
    }
    $162 = ((($140)) + 12|0);
    HEAP32[$162>>2] = $142;
    HEAP32[$$pre$phi439Z2D>>2] = $140;
   } else {
    $163 = ((($10)) + 24|0);
    $164 = HEAP32[$163>>2]|0;
    $165 = ((($10)) + 12|0);
    $166 = HEAP32[$165>>2]|0;
    $167 = ($166|0)==($10|0);
    do {
     if ($167) {
      $178 = ((($10)) + 16|0);
      $179 = ((($178)) + 4|0);
      $180 = HEAP32[$179>>2]|0;
      $181 = ($180|0)==(0|0);
      if ($181) {
       $182 = HEAP32[$178>>2]|0;
       $183 = ($182|0)==(0|0);
       if ($183) {
        $$3398 = 0;
        break;
       } else {
        $$1396 = $182;$$1400 = $178;
       }
      } else {
       $$1396 = $180;$$1400 = $179;
      }
      while(1) {
       $184 = ((($$1396)) + 20|0);
       $185 = HEAP32[$184>>2]|0;
       $186 = ($185|0)==(0|0);
       if (!($186)) {
        $$1396 = $185;$$1400 = $184;
        continue;
       }
       $187 = ((($$1396)) + 16|0);
       $188 = HEAP32[$187>>2]|0;
       $189 = ($188|0)==(0|0);
       if ($189) {
        break;
       } else {
        $$1396 = $188;$$1400 = $187;
       }
      }
      $190 = HEAP32[(11552)>>2]|0;
      $191 = ($$1400>>>0)<($190>>>0);
      if ($191) {
       _abort();
       // unreachable;
      } else {
       HEAP32[$$1400>>2] = 0;
       $$3398 = $$1396;
       break;
      }
     } else {
      $168 = ((($10)) + 8|0);
      $169 = HEAP32[$168>>2]|0;
      $170 = HEAP32[(11552)>>2]|0;
      $171 = ($169>>>0)<($170>>>0);
      if ($171) {
       _abort();
       // unreachable;
      }
      $172 = ((($169)) + 12|0);
      $173 = HEAP32[$172>>2]|0;
      $174 = ($173|0)==($10|0);
      if (!($174)) {
       _abort();
       // unreachable;
      }
      $175 = ((($166)) + 8|0);
      $176 = HEAP32[$175>>2]|0;
      $177 = ($176|0)==($10|0);
      if ($177) {
       HEAP32[$172>>2] = $166;
       HEAP32[$175>>2] = $169;
       $$3398 = $166;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    } while(0);
    $192 = ($164|0)==(0|0);
    if (!($192)) {
     $193 = ((($10)) + 28|0);
     $194 = HEAP32[$193>>2]|0;
     $195 = (11840 + ($194<<2)|0);
     $196 = HEAP32[$195>>2]|0;
     $197 = ($10|0)==($196|0);
     if ($197) {
      HEAP32[$195>>2] = $$3398;
      $cond419 = ($$3398|0)==(0|0);
      if ($cond419) {
       $198 = 1 << $194;
       $199 = $198 ^ -1;
       $200 = HEAP32[(11540)>>2]|0;
       $201 = $200 & $199;
       HEAP32[(11540)>>2] = $201;
       break;
      }
     } else {
      $202 = HEAP32[(11552)>>2]|0;
      $203 = ($164>>>0)<($202>>>0);
      if ($203) {
       _abort();
       // unreachable;
      }
      $204 = ((($164)) + 16|0);
      $205 = HEAP32[$204>>2]|0;
      $206 = ($205|0)==($10|0);
      if ($206) {
       HEAP32[$204>>2] = $$3398;
      } else {
       $207 = ((($164)) + 20|0);
       HEAP32[$207>>2] = $$3398;
      }
      $208 = ($$3398|0)==(0|0);
      if ($208) {
       break;
      }
     }
     $209 = HEAP32[(11552)>>2]|0;
     $210 = ($$3398>>>0)<($209>>>0);
     if ($210) {
      _abort();
      // unreachable;
     }
     $211 = ((($$3398)) + 24|0);
     HEAP32[$211>>2] = $164;
     $212 = ((($10)) + 16|0);
     $213 = HEAP32[$212>>2]|0;
     $214 = ($213|0)==(0|0);
     do {
      if (!($214)) {
       $215 = ($213>>>0)<($209>>>0);
       if ($215) {
        _abort();
        // unreachable;
       } else {
        $216 = ((($$3398)) + 16|0);
        HEAP32[$216>>2] = $213;
        $217 = ((($213)) + 24|0);
        HEAP32[$217>>2] = $$3398;
        break;
       }
      }
     } while(0);
     $218 = ((($212)) + 4|0);
     $219 = HEAP32[$218>>2]|0;
     $220 = ($219|0)==(0|0);
     if (!($220)) {
      $221 = HEAP32[(11552)>>2]|0;
      $222 = ($219>>>0)<($221>>>0);
      if ($222) {
       _abort();
       // unreachable;
      } else {
       $223 = ((($$3398)) + 20|0);
       HEAP32[$223>>2] = $219;
       $224 = ((($219)) + 24|0);
       HEAP32[$224>>2] = $$3398;
       break;
      }
     }
    }
   }
  } while(0);
  $225 = $136 | 1;
  $226 = ((($$1)) + 4|0);
  HEAP32[$226>>2] = $225;
  $227 = (($$1) + ($136)|0);
  HEAP32[$227>>2] = $136;
  $228 = HEAP32[(11556)>>2]|0;
  $229 = ($$1|0)==($228|0);
  if ($229) {
   HEAP32[(11544)>>2] = $136;
   return;
  } else {
   $$2 = $136;
  }
 } else {
  $230 = $115 & -2;
  HEAP32[$114>>2] = $230;
  $231 = $$1380 | 1;
  $232 = ((($$1)) + 4|0);
  HEAP32[$232>>2] = $231;
  $233 = (($$1) + ($$1380)|0);
  HEAP32[$233>>2] = $$1380;
  $$2 = $$1380;
 }
 $234 = $$2 >>> 3;
 $235 = ($$2>>>0)<(256);
 if ($235) {
  $236 = $234 << 1;
  $237 = (11576 + ($236<<2)|0);
  $238 = HEAP32[2884]|0;
  $239 = 1 << $234;
  $240 = $238 & $239;
  $241 = ($240|0)==(0);
  if ($241) {
   $242 = $238 | $239;
   HEAP32[2884] = $242;
   $$pre = ((($237)) + 8|0);
   $$0401 = $237;$$pre$phiZ2D = $$pre;
  } else {
   $243 = ((($237)) + 8|0);
   $244 = HEAP32[$243>>2]|0;
   $245 = HEAP32[(11552)>>2]|0;
   $246 = ($244>>>0)<($245>>>0);
   if ($246) {
    _abort();
    // unreachable;
   } else {
    $$0401 = $244;$$pre$phiZ2D = $243;
   }
  }
  HEAP32[$$pre$phiZ2D>>2] = $$1;
  $247 = ((($$0401)) + 12|0);
  HEAP32[$247>>2] = $$1;
  $248 = ((($$1)) + 8|0);
  HEAP32[$248>>2] = $$0401;
  $249 = ((($$1)) + 12|0);
  HEAP32[$249>>2] = $237;
  return;
 }
 $250 = $$2 >>> 8;
 $251 = ($250|0)==(0);
 if ($251) {
  $$0394 = 0;
 } else {
  $252 = ($$2>>>0)>(16777215);
  if ($252) {
   $$0394 = 31;
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
   $272 = $$2 >>> $271;
   $273 = $272 & 1;
   $274 = $273 | $270;
   $$0394 = $274;
  }
 }
 $275 = (11840 + ($$0394<<2)|0);
 $276 = ((($$1)) + 28|0);
 HEAP32[$276>>2] = $$0394;
 $277 = ((($$1)) + 16|0);
 $278 = ((($$1)) + 20|0);
 HEAP32[$278>>2] = 0;
 HEAP32[$277>>2] = 0;
 $279 = HEAP32[(11540)>>2]|0;
 $280 = 1 << $$0394;
 $281 = $279 & $280;
 $282 = ($281|0)==(0);
 do {
  if ($282) {
   $283 = $279 | $280;
   HEAP32[(11540)>>2] = $283;
   HEAP32[$275>>2] = $$1;
   $284 = ((($$1)) + 24|0);
   HEAP32[$284>>2] = $275;
   $285 = ((($$1)) + 12|0);
   HEAP32[$285>>2] = $$1;
   $286 = ((($$1)) + 8|0);
   HEAP32[$286>>2] = $$1;
  } else {
   $287 = HEAP32[$275>>2]|0;
   $288 = ($$0394|0)==(31);
   $289 = $$0394 >>> 1;
   $290 = (25 - ($289))|0;
   $291 = $288 ? 0 : $290;
   $292 = $$2 << $291;
   $$0381 = $292;$$0382 = $287;
   while(1) {
    $293 = ((($$0382)) + 4|0);
    $294 = HEAP32[$293>>2]|0;
    $295 = $294 & -8;
    $296 = ($295|0)==($$2|0);
    if ($296) {
     label = 130;
     break;
    }
    $297 = $$0381 >>> 31;
    $298 = (((($$0382)) + 16|0) + ($297<<2)|0);
    $299 = $$0381 << 1;
    $300 = HEAP32[$298>>2]|0;
    $301 = ($300|0)==(0|0);
    if ($301) {
     label = 127;
     break;
    } else {
     $$0381 = $299;$$0382 = $300;
    }
   }
   if ((label|0) == 127) {
    $302 = HEAP32[(11552)>>2]|0;
    $303 = ($298>>>0)<($302>>>0);
    if ($303) {
     _abort();
     // unreachable;
    } else {
     HEAP32[$298>>2] = $$1;
     $304 = ((($$1)) + 24|0);
     HEAP32[$304>>2] = $$0382;
     $305 = ((($$1)) + 12|0);
     HEAP32[$305>>2] = $$1;
     $306 = ((($$1)) + 8|0);
     HEAP32[$306>>2] = $$1;
     break;
    }
   }
   else if ((label|0) == 130) {
    $307 = ((($$0382)) + 8|0);
    $308 = HEAP32[$307>>2]|0;
    $309 = HEAP32[(11552)>>2]|0;
    $310 = ($308>>>0)>=($309>>>0);
    $not$ = ($$0382>>>0)>=($309>>>0);
    $311 = $310 & $not$;
    if ($311) {
     $312 = ((($308)) + 12|0);
     HEAP32[$312>>2] = $$1;
     HEAP32[$307>>2] = $$1;
     $313 = ((($$1)) + 8|0);
     HEAP32[$313>>2] = $308;
     $314 = ((($$1)) + 12|0);
     HEAP32[$314>>2] = $$0382;
     $315 = ((($$1)) + 24|0);
     HEAP32[$315>>2] = 0;
     break;
    } else {
     _abort();
     // unreachable;
    }
   }
  }
 } while(0);
 $316 = HEAP32[(11568)>>2]|0;
 $317 = (($316) + -1)|0;
 HEAP32[(11568)>>2] = $317;
 $318 = ($317|0)==(0);
 if ($318) {
  $$0211$in$i = (11992);
 } else {
  return;
 }
 while(1) {
  $$0211$i = HEAP32[$$0211$in$i>>2]|0;
  $319 = ($$0211$i|0)==(0|0);
  $320 = ((($$0211$i)) + 8|0);
  if ($319) {
   break;
  } else {
   $$0211$in$i = $320;
  }
 }
 HEAP32[(11568)>>2] = -1;
 return;
}
function _calloc($0,$1) {
 $0 = $0|0;
 $1 = $1|0;
 var $$ = 0, $$0 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $2 = ($0|0)==(0);
 if ($2) {
  $$0 = 0;
 } else {
  $3 = Math_imul($1, $0)|0;
  $4 = $1 | $0;
  $5 = ($4>>>0)>(65535);
  if ($5) {
   $6 = (($3>>>0) / ($0>>>0))&-1;
   $7 = ($6|0)==($1|0);
   $$ = $7 ? $3 : -1;
   $$0 = $$;
  } else {
   $$0 = $3;
  }
 }
 $8 = (_malloc($$0)|0);
 $9 = ($8|0)==(0|0);
 if ($9) {
  return ($8|0);
 }
 $10 = ((($8)) + -4|0);
 $11 = HEAP32[$10>>2]|0;
 $12 = $11 & 3;
 $13 = ($12|0)==(0);
 if ($13) {
  return ($8|0);
 }
 _memset(($8|0),0,($$0|0))|0;
 return ($8|0);
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
        _i64Subtract($137$0 | 0, $137$1 | 0, $r_sroa_0_0_insert_insert42$0 | 0, $r_sroa_0_0_insert_insert42$1 | 0) | 0;
        $150$1 = tempRet0;
        $151$0 = $150$1 >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1;
        $152 = $151$0 & 1;
        $154$0 = _i64Subtract($r_sroa_0_0_insert_insert42$0 | 0, $r_sroa_0_0_insert_insert42$1 | 0, $151$0 & $d_sroa_0_0_insert_insert99$0 | 0, ((($150$1 | 0) < 0 ? -1 : 0) >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1) & $d_sroa_0_0_insert_insert99$1 | 0) | 0;
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
function ___udivdi3($a$0, $a$1, $b$0, $b$1) {
    $a$0 = $a$0 | 0;
    $a$1 = $a$1 | 0;
    $b$0 = $b$0 | 0;
    $b$1 = $b$1 | 0;
    var $1$0 = 0;
    $1$0 = ___udivmoddi4($a$0, $a$1, $b$0, $b$1, 0) | 0;
    return $1$0 | 0;
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
function _sbrk(increment) {
    increment = increment|0;
    var oldDynamicTop = 0;
    var oldDynamicTopOnChange = 0;
    var newDynamicTop = 0;
    var totalMemory = 0;
    increment = ((increment + 15) & -16)|0;
    oldDynamicTop = HEAP32[DYNAMICTOP_PTR>>2]|0;
    newDynamicTop = oldDynamicTop + increment | 0;

    if (((increment|0) > 0 & (newDynamicTop|0) < (oldDynamicTop|0)) // Detect and fail if we would wrap around signed 32-bit int.
      | (newDynamicTop|0) < 0) { // Also underflow, sbrk() should be able to be used to subtract.
      abortOnCannotGrowMemory()|0;
      ___setErrNo(12);
      return -1;
    }

    HEAP32[DYNAMICTOP_PTR>>2] = newDynamicTop;
    totalMemory = getTotalMemory()|0;
    if ((newDynamicTop|0) > (totalMemory|0)) {
      if ((enlargeMemory()|0) == 0) {
        ___setErrNo(12);
        HEAP32[DYNAMICTOP_PTR>>2] = oldDynamicTop;
        return -1;
      }
    }
    return oldDynamicTop|0;
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
function _pthread_self() {
    return 0;
}
function _round(d) {
    d = +d;
    return d >= +0 ? +Math_floor(d + +0.5) : +Math_ceil(d - +0.5);
}

  
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
var FUNCTION_TABLE_vi = [b71,jsCall_vi_0,jsCall_vi_1,jsCall_vi_2,jsCall_vi_3,jsCall_vi_4,jsCall_vi_5,jsCall_vi_6,jsCall_vi_7,b72,b73,b74,b75,b76,b77,b78,b79,b80,_cleanup_517,b81,b82,b83,b84,b85,b86,b87,b88,b89,b90
,b91,b92,b93];

  return { _memset: _memset, _mceliecejs_public_key_bytes: _mceliecejs_public_key_bytes, _bitshift64Lshr: _bitshift64Lshr, _mceliecejs_message_bytes: _mceliecejs_message_bytes, _mceliecejs_encrypted_bytes: _mceliecejs_encrypted_bytes, _bitshift64Shl: _bitshift64Shl, _mceliecejs_encrypt: _mceliecejs_encrypt, _mceliecejs_keypair: _mceliecejs_keypair, _llvm_cttz_i32: _llvm_cttz_i32, _sbrk: _sbrk, _memcpy: _memcpy, ___muldi3: ___muldi3, ___uremdi3: ___uremdi3, _mceliecejs_init: _mceliecejs_init, _i64Subtract: _i64Subtract, ___udivmoddi4: ___udivmoddi4, _i64Add: _i64Add, _pthread_self: _pthread_self, _mceliecejs_decrypted_bytes: _mceliecejs_decrypted_bytes, ___udivdi3: ___udivdi3, _mceliecejs_decrypt: _mceliecejs_decrypt, ___muldsi3: ___muldsi3, _free: _free, _mceliecejs_private_key_bytes: _mceliecejs_private_key_bytes, _round: _round, _malloc: _malloc, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, establishStackSpace: establishStackSpace, setThrew: setThrew, setTempRet0: setTempRet0, getTempRet0: getTempRet0, dynCall_i: dynCall_i, dynCall_ii: dynCall_ii, dynCall_iiii: dynCall_iiii, dynCall_vi: dynCall_vi };
})
// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);

var real__llvm_cttz_i32 = asm["_llvm_cttz_i32"]; asm["_llvm_cttz_i32"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__llvm_cttz_i32.apply(null, arguments);
};

var real__mceliecejs_public_key_bytes = asm["_mceliecejs_public_key_bytes"]; asm["_mceliecejs_public_key_bytes"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__mceliecejs_public_key_bytes.apply(null, arguments);
};

var real__bitshift64Lshr = asm["_bitshift64Lshr"]; asm["_bitshift64Lshr"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__bitshift64Lshr.apply(null, arguments);
};

var real__mceliecejs_message_bytes = asm["_mceliecejs_message_bytes"]; asm["_mceliecejs_message_bytes"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__mceliecejs_message_bytes.apply(null, arguments);
};

var real__mceliecejs_encrypted_bytes = asm["_mceliecejs_encrypted_bytes"]; asm["_mceliecejs_encrypted_bytes"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__mceliecejs_encrypted_bytes.apply(null, arguments);
};

var real__bitshift64Shl = asm["_bitshift64Shl"]; asm["_bitshift64Shl"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__bitshift64Shl.apply(null, arguments);
};

var real__mceliecejs_encrypt = asm["_mceliecejs_encrypt"]; asm["_mceliecejs_encrypt"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__mceliecejs_encrypt.apply(null, arguments);
};

var real__mceliecejs_keypair = asm["_mceliecejs_keypair"]; asm["_mceliecejs_keypair"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__mceliecejs_keypair.apply(null, arguments);
};

var real__sbrk = asm["_sbrk"]; asm["_sbrk"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__sbrk.apply(null, arguments);
};

var real____muldi3 = asm["___muldi3"]; asm["___muldi3"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real____muldi3.apply(null, arguments);
};

var real____uremdi3 = asm["___uremdi3"]; asm["___uremdi3"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real____uremdi3.apply(null, arguments);
};

var real__mceliecejs_init = asm["_mceliecejs_init"]; asm["_mceliecejs_init"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__mceliecejs_init.apply(null, arguments);
};

var real__i64Subtract = asm["_i64Subtract"]; asm["_i64Subtract"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__i64Subtract.apply(null, arguments);
};

var real____udivmoddi4 = asm["___udivmoddi4"]; asm["___udivmoddi4"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real____udivmoddi4.apply(null, arguments);
};

var real__i64Add = asm["_i64Add"]; asm["_i64Add"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__i64Add.apply(null, arguments);
};

var real__pthread_self = asm["_pthread_self"]; asm["_pthread_self"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__pthread_self.apply(null, arguments);
};

var real__mceliecejs_decrypted_bytes = asm["_mceliecejs_decrypted_bytes"]; asm["_mceliecejs_decrypted_bytes"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__mceliecejs_decrypted_bytes.apply(null, arguments);
};

var real____udivdi3 = asm["___udivdi3"]; asm["___udivdi3"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real____udivdi3.apply(null, arguments);
};

var real__mceliecejs_decrypt = asm["_mceliecejs_decrypt"]; asm["_mceliecejs_decrypt"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__mceliecejs_decrypt.apply(null, arguments);
};

var real____muldsi3 = asm["___muldsi3"]; asm["___muldsi3"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real____muldsi3.apply(null, arguments);
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

var real__round = asm["_round"]; asm["_round"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__round.apply(null, arguments);
};

var real__malloc = asm["_malloc"]; asm["_malloc"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__malloc.apply(null, arguments);
};
var _llvm_cttz_i32 = Module["_llvm_cttz_i32"] = asm["_llvm_cttz_i32"];
var _mceliecejs_public_key_bytes = Module["_mceliecejs_public_key_bytes"] = asm["_mceliecejs_public_key_bytes"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var _mceliecejs_message_bytes = Module["_mceliecejs_message_bytes"] = asm["_mceliecejs_message_bytes"];
var _mceliecejs_encrypted_bytes = Module["_mceliecejs_encrypted_bytes"] = asm["_mceliecejs_encrypted_bytes"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var _mceliecejs_encrypt = Module["_mceliecejs_encrypt"] = asm["_mceliecejs_encrypt"];
var _mceliecejs_keypair = Module["_mceliecejs_keypair"] = asm["_mceliecejs_keypair"];
var _memset = Module["_memset"] = asm["_memset"];
var _sbrk = Module["_sbrk"] = asm["_sbrk"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var ___muldi3 = Module["___muldi3"] = asm["___muldi3"];
var ___uremdi3 = Module["___uremdi3"] = asm["___uremdi3"];
var _mceliecejs_init = Module["_mceliecejs_init"] = asm["_mceliecejs_init"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var ___udivmoddi4 = Module["___udivmoddi4"] = asm["___udivmoddi4"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _pthread_self = Module["_pthread_self"] = asm["_pthread_self"];
var _mceliecejs_decrypted_bytes = Module["_mceliecejs_decrypted_bytes"] = asm["_mceliecejs_decrypted_bytes"];
var ___udivdi3 = Module["___udivdi3"] = asm["___udivdi3"];
var _mceliecejs_decrypt = Module["_mceliecejs_decrypt"] = asm["_mceliecejs_decrypt"];
var ___muldsi3 = Module["___muldsi3"] = asm["___muldsi3"];
var _free = Module["_free"] = asm["_free"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var _mceliecejs_private_key_bytes = Module["_mceliecejs_private_key_bytes"] = asm["_mceliecejs_private_key_bytes"];
var _round = Module["_round"] = asm["_round"];
var _malloc = Module["_malloc"] = asm["_malloc"];
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

  writeStackCookie();

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
  checkStackCookie();
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
    process['exit'](status);
  } else if (ENVIRONMENT_IS_SHELL && typeof quit === 'function') {
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


// EMSCRIPTEN_GENERATED_FUNCTIONS: ["_i64Subtract","_i64Add","_llvm_cttz_i32","___udivmoddi4","___udivdi3","_memset","_bitshift64Lshr","_bitshift64Shl","___muldsi3","___muldi3","_sbrk","___uremdi3","_memcpy","_pthread_self","_round"]


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


var decryptedBytes	= Module._mceliecejs_decrypted_bytes();

var mceliece	= {
	publicKeyBytes: Module._mceliecejs_public_key_bytes(),
	privateKeyBytes: Module._mceliecejs_private_key_bytes(),
	cyphertextBytes: Module._mceliecejs_encrypted_bytes(),
	plaintextBytes: Module._mceliecejs_message_bytes(),

	/* Backwards compatibility */
	publicKeyLength: Module._mceliecejs_public_key_bytes(),
	privateKeyLength: Module._mceliecejs_private_key_bytes(),
	encryptedDataLength: Module._mceliecejs_encrypted_bytes(),
	decryptedDataLength: Module._mceliecejs_message_bytes(),

	keyPair: function () {
		var publicKeyBuffer		= Module._malloc(mceliece.publicKeyBytes);
		var privateKeyBuffer	= Module._malloc(mceliece.privateKeyBytes);

		try {
			Module._mceliecejs_keypair(
				publicKeyBuffer,
				privateKeyBuffer
			);

			return {
				publicKey: dataResult(publicKeyBuffer, mceliece.publicKeyBytes),
				privateKey: dataResult(privateKeyBuffer, mceliece.privateKeyBytes)
			};
		}
		finally {
			dataFree(publicKeyBuffer);
			dataFree(privateKeyBuffer);
		}
	},

	encrypt: function (message, publicKey) {
		var messageBuffer	= Module._malloc(message.length + 4);
		var publicKeyBuffer	= Module._malloc(mceliece.publicKeyBytes);
		var encryptedBuffer	= Module._malloc(mceliece.cyphertextBytes);

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

			return dataResult(encryptedBuffer, mceliece.cyphertextBytes);
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
		var decryptedBuffer		= Module._malloc(decryptedBytes);

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
	},

	/** For compatibility with narruc/node-mceliece. */
	stringToUTF8Array: function (s) {
		return Array.prototype.slice.apply(sodiumUtil.from_string(s));
	},

	/** For compatibility with narruc/node-mceliece. */
	UTF8ArraytoString: function (a) {
		return sodiumUtil.to_string(new Uint8Array(a));
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

//# sourceMappingURL=mceliece.debug.js.map