---
url: "https://docs.python.org/3/extending/index.html"
---

Extending and Embedding the Python Interpreter — Python 3.14.5rc1 documentation               

### Navigation

*   [index](../genindex.html "General Index")
*   [modules](../py-modindex.html "Python Module Index") |
*   [next](extending.html "1. Extending Python with C or C++") |
*   [previous](../library/security_warnings.html "Security Considerations") |
*   ![Python logo](../_static/py.svg)
*   [Python](https://www.python.org/) »
*   Greek | ΕλληνικάEnglishSpanish | españolFrench | françaisItalian | italianoJapanese | 日本語Korean | 한국어Polish | polskiBrazilian Portuguese | Português brasileiroRomanian | RomâneșteTurkish | TürkçeSimplified Chinese | 简体中文Traditional Chinese | 繁體中文
    
    dev (3.16)pre (3.15)3.14.5rc13.133.123.113.103.93.83.73.63.53.43.33.23.13.02.72.6
    

*   [3.14.5rc1 Documentation](../index.html) »
*   Extending and Embedding the Python Interpreter
*    
    
    |
*   Theme Auto Light Dark |

Extending and Embedding the Python Interpreter[¶](#extending-and-embedding-the-python-interpreter "Link to this heading")
=========================================================================================================================

This document describes how to write modules in C or C++ to extend the Python interpreter with new modules. Those modules can not only define new functions but also new object types and their methods. The document also describes how to embed the Python interpreter in another application, for use as an extension language. Finally, it shows how to compile and link extension modules so that they can be loaded dynamically (at run time) into the interpreter, if the underlying operating system supports this feature.

This document assumes basic knowledge about Python. For an informal introduction to the language, see [The Python Tutorial](../tutorial/index.html#tutorial-index). [The Python Language Reference](../reference/index.html#reference-index) gives a more formal definition of the language. [The Python Standard Library](../library/index.html#library-index) documents the existing object types, functions and modules (both built-in and written in Python) that give the language its wide application range.

For a detailed description of the whole Python/C API, see the separate [Python/C API reference manual](../c-api/index.html#c-api-index).

Recommended third party tools[¶](#recommended-third-party-tools "Link to this heading")
---------------------------------------------------------------------------------------

This guide only covers the basic tools for creating extensions provided as part of this version of CPython. Some [third party tools](../c-api/intro.html#c-api-tools) offer both simpler and more sophisticated approaches to creating C and C++ extensions for Python.

Creating extensions without third party tools[¶](#creating-extensions-without-third-party-tools "Link to this heading")
-----------------------------------------------------------------------------------------------------------------------

This section of the guide covers creating C and C++ extensions without assistance from third party tools. It is intended primarily for creators of those tools, rather than being a recommended way to create your own C extensions.

See also

[**PEP 489**](https://peps.python.org/pep-0489/) – Multi-phase extension module initialization

*   [1\. Extending Python with C or C++](extending.html)
    *   [1.1. A Simple Example](extending.html#a-simple-example)
    *   [1.2. Intermezzo: Errors and Exceptions](extending.html#intermezzo-errors-and-exceptions)
    *   [1.3. Back to the Example](extending.html#back-to-the-example)
    *   [1.4. The Module’s Method Table and Initialization Function](extending.html#the-module-s-method-table-and-initialization-function)
    *   [1.5. Compilation and Linkage](extending.html#compilation-and-linkage)
    *   [1.6. Calling Python Functions from C](extending.html#calling-python-functions-from-c)
    *   [1.7. Extracting Parameters in Extension Functions](extending.html#extracting-parameters-in-extension-functions)
    *   [1.8. Keyword Parameters for Extension Functions](extending.html#keyword-parameters-for-extension-functions)
    *   [1.9. Building Arbitrary Values](extending.html#building-arbitrary-values)
    *   [1.10. Reference Counts](extending.html#reference-counts)
    *   [1.11. Writing Extensions in C++](extending.html#writing-extensions-in-c)
    *   [1.12. Providing a C API for an Extension Module](extending.html#providing-a-c-api-for-an-extension-module)
*   [2\. Defining Extension Types: Tutorial](newtypes_tutorial.html)
    *   [2.1. The Basics](newtypes_tutorial.html#the-basics)
    *   [2.2. Adding data and methods to the Basic example](newtypes_tutorial.html#adding-data-and-methods-to-the-basic-example)
    *   [2.3. Providing finer control over data attributes](newtypes_tutorial.html#providing-finer-control-over-data-attributes)
    *   [2.4. Supporting cyclic garbage collection](newtypes_tutorial.html#supporting-cyclic-garbage-collection)
    *   [2.5. Subclassing other types](newtypes_tutorial.html#subclassing-other-types)
*   [3\. Defining Extension Types: Assorted Topics](newtypes.html)
    *   [3.1. Finalization and De-allocation](newtypes.html#finalization-and-de-allocation)
    *   [3.2. Object Presentation](newtypes.html#object-presentation)
    *   [3.3. Attribute Management](newtypes.html#attribute-management)
    *   [3.4. Object Comparison](newtypes.html#object-comparison)
    *   [3.5. Abstract Protocol Support](newtypes.html#abstract-protocol-support)
    *   [3.6. Weak Reference Support](newtypes.html#weak-reference-support)
    *   [3.7. More Suggestions](newtypes.html#more-suggestions)
*   [4\. Building C and C++ Extensions](building.html)
    *   [4.1. Building C and C++ Extensions with setuptools](building.html#building-c-and-c-extensions-with-setuptools)
*   [5\. Building C and C++ Extensions on Windows](windows.html)
    *   [5.1. A Cookbook Approach](windows.html#a-cookbook-approach)
    *   [5.2. Differences Between Unix and Windows](windows.html#differences-between-unix-and-windows)
    *   [5.3. Using DLLs in Practice](windows.html#using-dlls-in-practice)

Embedding the CPython runtime in a larger application[¶](#embedding-the-cpython-runtime-in-a-larger-application "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------

Sometimes, rather than creating an extension that runs inside the Python interpreter as the main application, it is desirable to instead embed the CPython runtime inside a larger application. This section covers some of the details involved in doing that successfully.

*   [1\. Embedding Python in Another Application](embedding.html)
    *   [1.1. Very High Level Embedding](embedding.html#very-high-level-embedding)
    *   [1.2. Beyond Very High Level Embedding: An overview](embedding.html#beyond-very-high-level-embedding-an-overview)
    *   [1.3. Pure Embedding](embedding.html#pure-embedding)
    *   [1.4. Extending Embedded Python](embedding.html#extending-embedded-python)
    *   [1.5. Embedding Python in C++](embedding.html#embedding-python-in-c)
    *   [1.6. Compiling and Linking under Unix-like systems](embedding.html#compiling-and-linking-under-unix-like-systems)

### [Table of Contents](../contents.html)

*   [Extending and Embedding the Python Interpreter](#)
    *   [Recommended third party tools](#recommended-third-party-tools)
    *   [Creating extensions without third party tools](#creating-extensions-without-third-party-tools)
    *   [Embedding the CPython runtime in a larger application](#embedding-the-cpython-runtime-in-a-larger-application)

#### Previous topic

[Security Considerations](../library/security_warnings.html "previous chapter")

#### Next topic

[1\. Extending Python with C or C++](extending.html "next chapter")

### This page

*   [Report a bug](../bugs.html)
*   [Improve this page](https://docs.python.org/3/improve-page.html?pagetitle=Extending+and+Embedding+the+Python+Interpreter&pageurl=https%3A%2F%2Fdocs.python.org%2F3%2Fextending%2Findex.html&pagesource=extending%2Findex.rst)
*   [Show source](https://github.com/python/cpython/blob/main/Doc/extending/index.rst?plain=1)

«

### Navigation

*   [index](../genindex.html "General Index")
*   [modules](../py-modindex.html "Python Module Index") |
*   [next](extending.html "1. Extending Python with C or C++") |
*   [previous](../library/security_warnings.html "Security Considerations") |
*   ![Python logo](../_static/py.svg)
*   [Python](https://www.python.org/) »
*   Greek | ΕλληνικάEnglishSpanish | españolFrench | françaisItalian | italianoJapanese | 日本語Korean | 한국어Polish | polskiBrazilian Portuguese | Português brasileiroRomanian | RomâneșteTurkish | TürkçeSimplified Chinese | 简体中文Traditional Chinese | 繁體中文
    
    dev (3.16)pre (3.15)3.14.5rc13.133.123.113.103.93.83.73.63.53.43.33.23.13.02.72.6
    

*   [3.14.5rc1 Documentation](../index.html) »
*   Extending and Embedding the Python Interpreter
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