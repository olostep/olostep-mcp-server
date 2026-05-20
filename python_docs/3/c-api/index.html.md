---
url: "https://docs.python.org/3/c-api/index.html"
---

Python/C API reference manual — Python 3.14.5rc1 documentation               

### Navigation

*   [index](../genindex.html "General Index")
*   [modules](../py-modindex.html "Python Module Index") |
*   [next](intro.html "Introduction") |
*   [previous](../extending/embedding.html "1. Embedding Python in Another Application") |
*   ![Python logo](../_static/py.svg)
*   [Python](https://www.python.org/) »
*   Greek | ΕλληνικάEnglishSpanish | españolFrench | françaisItalian | italianoJapanese | 日本語Korean | 한국어Polish | polskiBrazilian Portuguese | Português brasileiroRomanian | RomâneșteTurkish | TürkçeSimplified Chinese | 简体中文Traditional Chinese | 繁體中文
    
    dev (3.16)pre (3.15)3.14.5rc13.133.123.113.103.93.83.73.63.53.43.33.23.13.02.72.6
    

*   [3.14.5rc1 Documentation](../index.html) »
*   Python/C API reference manual
*    
    
    |
*   Theme Auto Light Dark |

Python/C API reference manual[¶](#python-c-api-reference-manual "Link to this heading")
=======================================================================================

This manual documents the API used by C and C++ programmers who want to write extension modules or embed Python. It is a companion to [Extending and Embedding the Python Interpreter](../extending/index.html#extending-index), which describes the general principles of extension writing but does not document the API functions in detail.

*   [Introduction](intro.html)
    *   [Language version compatibility](intro.html#language-version-compatibility)
    *   [Coding standards](intro.html#coding-standards)
    *   [Include Files](intro.html#include-files)
    *   [Useful macros](intro.html#useful-macros)
    *   [Objects, Types and Reference Counts](intro.html#objects-types-and-reference-counts)
    *   [Exceptions](intro.html#exceptions)
    *   [Embedding Python](intro.html#embedding-python)
    *   [Debugging Builds](intro.html#debugging-builds)
    *   [Recommended third party tools](intro.html#recommended-third-party-tools)
*   [C API Stability](stable.html)
    *   [Unstable C API](stable.html#unstable-c-api)
    *   [Stable Application Binary Interface](stable.html#stable-application-binary-interface)
    *   [Platform Considerations](stable.html#platform-considerations)
    *   [Contents of Limited API](stable.html#contents-of-limited-api)
*   [The Very High Level Layer](veryhigh.html)
    *   [Available start symbols](veryhigh.html#available-start-symbols)
    *   [Stack Effects](veryhigh.html#stack-effects)
*   [Reference Counting](refcounting.html)
*   [Exception Handling](exceptions.html)
    *   [Printing and clearing](exceptions.html#printing-and-clearing)
    *   [Raising exceptions](exceptions.html#raising-exceptions)
    *   [Issuing warnings](exceptions.html#issuing-warnings)
    *   [Querying the error indicator](exceptions.html#querying-the-error-indicator)
    *   [Signal Handling](exceptions.html#signal-handling)
    *   [Exception Classes](exceptions.html#exception-classes)
    *   [Exception Objects](exceptions.html#exception-objects)
    *   [Unicode Exception Objects](exceptions.html#unicode-exception-objects)
    *   [Recursion Control](exceptions.html#recursion-control)
    *   [Exception and warning types](exceptions.html#exception-and-warning-types)
    *   [Tracebacks](exceptions.html#tracebacks)
*   [Defining extension modules](extension-modules.html)
    *   [Multiple module instances](extension-modules.html#multiple-module-instances)
    *   [Initialization function](extension-modules.html#initialization-function)
    *   [Multi-phase initialization](extension-modules.html#multi-phase-initialization)
    *   [Legacy single-phase initialization](extension-modules.html#legacy-single-phase-initialization)
*   [Utilities](utilities.html)
    *   [Operating System Utilities](sys.html)
    *   [System Functions](sys.html#system-functions)
    *   [Process Control](sys.html#process-control)
    *   [Importing Modules](import.html)
    *   [Data marshalling support](marshal.html)
    *   [Parsing arguments and building values](arg.html)
    *   [String conversion and formatting](conversion.html)
    *   [Character classification and conversion](conversion.html#character-classification-and-conversion)
    *   [PyHash API](hash.html)
    *   [Reflection](reflection.html)
    *   [Codec registry and support functions](codec.html)
    *   [PyTime C API](time.html)
    *   [Support for Perf Maps](perfmaps.html)
*   [Abstract Objects Layer](abstract.html)
    *   [Object Protocol](object.html)
    *   [Call Protocol](call.html)
    *   [Number Protocol](number.html)
    *   [Sequence Protocol](sequence.html)
    *   [Mapping Protocol](mapping.html)
    *   [Iterator Protocol](iter.html)
    *   [Buffer Protocol](buffer.html)
*   [Concrete Objects Layer](concrete.html)
    *   [Fundamental Objects](concrete.html#fundamental-objects)
    *   [Numeric Objects](concrete.html#numeric-objects)
    *   [Sequence Objects](concrete.html#sequence-objects)
    *   [Container Objects](concrete.html#container-objects)
    *   [Function Objects](concrete.html#function-objects)
    *   [Other Objects](concrete.html#other-objects)
    *   [C API for extension modules](concrete.html#c-api-for-extension-modules)
*   [Interpreter initialization and finalization](interp-lifecycle.html)
    *   [Before Python initialization](interp-lifecycle.html#before-python-initialization)
    *   [Global configuration variables](interp-lifecycle.html#global-configuration-variables)
    *   [Initializing and finalizing the interpreter](interp-lifecycle.html#initializing-and-finalizing-the-interpreter)
    *   [Cautions regarding runtime finalization](interp-lifecycle.html#cautions-regarding-runtime-finalization)
    *   [Process-wide parameters](interp-lifecycle.html#process-wide-parameters)
*   [Thread states and the global interpreter lock](threads.html)
    *   [Detaching the thread state from extension code](threads.html#detaching-the-thread-state-from-extension-code)
    *   [Non-Python created threads](threads.html#non-python-created-threads)
    *   [Legacy API](threads.html#legacy-api)
    *   [Cautions about fork()](threads.html#cautions-about-fork)
    *   [High-level APIs](threads.html#high-level-apis)
    *   [GIL-state APIs](threads.html#gil-state-apis)
    *   [Low-level APIs](threads.html#low-level-apis)
*   [Asynchronous notifications](threads.html#asynchronous-notifications)
*   [Operating system thread APIs](threads.html#operating-system-thread-apis)
*   [Synchronization primitives](synchronization.html)
    *   [Python critical section API](synchronization.html#python-critical-section-api)
    *   [Legacy locking APIs](synchronization.html#legacy-locking-apis)
*   [Thread-local storage support](tls.html)
    *   [Thread-specific storage API](tls.html#thread-specific-storage-api)
    *   [Dynamic allocation](tls.html#dynamic-allocation)
    *   [Methods](tls.html#methods)
    *   [Legacy APIs](tls.html#legacy-apis)
*   [Multiple interpreters in a Python process](subinterpreters.html)
    *   [A per-interpreter GIL](subinterpreters.html#a-per-interpreter-gil)
    *   [Bugs and caveats](subinterpreters.html#bugs-and-caveats)
    *   [High-level APIs](subinterpreters.html#high-level-apis)
    *   [Low-level APIs](subinterpreters.html#low-level-apis)
    *   [Advanced debugger support](subinterpreters.html#advanced-debugger-support)
*   [Profiling and tracing](profiling.html)
*   [Reference tracing](profiling.html#reference-tracing)
*   [Python Initialization Configuration](init_config.html)
    *   [PyInitConfig C API](init_config.html#pyinitconfig-c-api)
    *   [Configuration Options](init_config.html#configuration-options)
    *   [Runtime Python configuration API](init_config.html#runtime-python-configuration-api)
    *   [PyConfig C API](init_config.html#pyconfig-c-api)
    *   [Py\_GetArgcArgv()](init_config.html#py-getargcargv)
    *   [Delaying main module execution](init_config.html#delaying-main-module-execution)
*   [Memory Management](memory.html)
    *   [Overview](memory.html#overview)
    *   [Allocator Domains](memory.html#allocator-domains)
    *   [Raw Memory Interface](memory.html#raw-memory-interface)
    *   [Memory Interface](memory.html#memory-interface)
    *   [Object allocators](memory.html#object-allocators)
    *   [Default Memory Allocators](memory.html#default-memory-allocators)
    *   [Customize Memory Allocators](memory.html#customize-memory-allocators)
    *   [Debug hooks on the Python memory allocators](memory.html#debug-hooks-on-the-python-memory-allocators)
    *   [The pymalloc allocator](memory.html#the-pymalloc-allocator)
    *   [The mimalloc allocator](memory.html#the-mimalloc-allocator)
    *   [tracemalloc C API](memory.html#tracemalloc-c-api)
    *   [Examples](memory.html#examples)
*   [Object Implementation Support](objimpl.html)
    *   [Allocating objects on the heap](allocation.html)
    *   [Object Life Cycle](lifecycle.html)
    *   [Common Object Structures](structures.html)
    *   [Type Object Structures](typeobj.html)
    *   [Supporting Cyclic Garbage Collection](gcsupport.html)
*   [API and ABI Versioning](apiabiversion.html)
    *   [Build-time version constants](apiabiversion.html#build-time-version-constants)
    *   [Run-time version](apiabiversion.html#run-time-version)
    *   [Bit-packing macros](apiabiversion.html#bit-packing-macros)
*   [Monitoring C API](monitoring.html)
*   [Generating Execution Events](monitoring.html#generating-execution-events)
    *   [Managing the Monitoring State](monitoring.html#managing-the-monitoring-state)

#### Previous topic

[1\. Embedding Python in Another Application](../extending/embedding.html "previous chapter")

#### Next topic

[Introduction](intro.html "next chapter")

### This page

*   [Report a bug](../bugs.html)
*   [Improve this page](https://docs.python.org/3/improve-page.html?pagetitle=Python%2FC+API+reference+manual&pageurl=https%3A%2F%2Fdocs.python.org%2F3%2Fc-api%2Findex.html&pagesource=c-api%2Findex.rst)
*   [Show source](https://github.com/python/cpython/blob/main/Doc/c-api/index.rst?plain=1)

«

### Navigation

*   [index](../genindex.html "General Index")
*   [modules](../py-modindex.html "Python Module Index") |
*   [next](intro.html "Introduction") |
*   [previous](../extending/embedding.html "1. Embedding Python in Another Application") |
*   ![Python logo](../_static/py.svg)
*   [Python](https://www.python.org/) »
*   Greek | ΕλληνικάEnglishSpanish | españolFrench | françaisItalian | italianoJapanese | 日本語Korean | 한국어Polish | polskiBrazilian Portuguese | Português brasileiroRomanian | RomâneșteTurkish | TürkçeSimplified Chinese | 简体中文Traditional Chinese | 繁體中文
    
    dev (3.16)pre (3.15)3.14.5rc13.133.123.113.103.93.83.73.63.53.43.33.23.13.02.72.6
    

*   [3.14.5rc1 Documentation](../index.html) »
*   Python/C API reference manual
*    
    
    |
*   Theme Auto Light Dark |

© [Copyright](../copyright.html) 2001 Python Software Foundation.  
This page is licensed under the Python Software Foundation License Version 2.  
Examples, recipes, and other code in the documentation are additionally licensed under the Zero Clause BSD License.  
See [History and License](/license.html) for more information.  
  
The Python Software Foundation is a non-profit corporation. [Please donate.](https://www.python.org/psf/donations/)  
  
Last updated on May 08, 2026 (11:15 UTC). [Found a bug](/bugs.html)?  
Created using [Sphinx](https://www.sphinx-doc.org/) 8.2.3.