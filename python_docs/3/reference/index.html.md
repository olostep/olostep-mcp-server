---
url: "https://docs.python.org/3/reference/index.html"
---

The Python Language Reference — Python 3.14.5rc1 documentation               

### Navigation

*   [index](../genindex.html "General Index")
*   [modules](../py-modindex.html "Python Module Index") |
*   [next](introduction.html "1. Introduction") |
*   [previous](../using/editors.html "8. Editors and IDEs") |
*   ![Python logo](../_static/py.svg)
*   [Python](https://www.python.org/) »
*   Greek | ΕλληνικάEnglishSpanish | españolFrench | françaisItalian | italianoJapanese | 日本語Korean | 한국어Polish | polskiBrazilian Portuguese | Português brasileiroRomanian | RomâneșteTurkish | TürkçeSimplified Chinese | 简体中文Traditional Chinese | 繁體中文
    
    dev (3.16)pre (3.15)3.14.5rc13.133.123.113.103.93.83.73.63.53.43.33.23.13.02.72.6
    

*   [3.14.5rc1 Documentation](../index.html) »
*   The Python Language Reference
*    
    
    |
*   Theme Auto Light Dark |

The Python Language Reference[¶](#the-python-language-reference "Link to this heading")
=======================================================================================

This reference manual describes the syntax and “core semantics” of the language. It is terse, but attempts to be exact and complete. The semantics of non-essential built-in object types and of the built-in functions and modules are described in [The Python Standard Library](../library/index.html#library-index). For an informal introduction to the language, see [The Python Tutorial](../tutorial/index.html#tutorial-index). For C or C++ programmers, two additional manuals exist: [Extending and Embedding the Python Interpreter](../extending/index.html#extending-index) describes the high-level picture of how to write a Python extension module, and the [Python/C API reference manual](../c-api/index.html#c-api-index) describes the interfaces available to C/C++ programmers in detail.

*   [1\. Introduction](introduction.html)
    *   [1.1. Alternate Implementations](introduction.html#alternate-implementations)
    *   [1.2. Notation](introduction.html#notation)
*   [2\. Lexical analysis](lexical_analysis.html)
    *   [2.1. Line structure](lexical_analysis.html#line-structure)
    *   [2.2. Other tokens](lexical_analysis.html#other-tokens)
    *   [2.3. Names (identifiers and keywords)](lexical_analysis.html#names-identifiers-and-keywords)
    *   [2.4. Literals](lexical_analysis.html#literals)
    *   [2.5. String and Bytes literals](lexical_analysis.html#string-and-bytes-literals)
    *   [2.6. Numeric literals](lexical_analysis.html#numeric-literals)
    *   [2.7. Operators and delimiters](lexical_analysis.html#operators-and-delimiters)
*   [3\. Data model](datamodel.html)
    *   [3.1. Objects, values and types](datamodel.html#objects-values-and-types)
    *   [3.2. The standard type hierarchy](datamodel.html#the-standard-type-hierarchy)
    *   [3.3. Special method names](datamodel.html#special-method-names)
    *   [3.4. Coroutines](datamodel.html#coroutines)
*   [4\. Execution model](executionmodel.html)
    *   [4.1. Structure of a program](executionmodel.html#structure-of-a-program)
    *   [4.2. Naming and binding](executionmodel.html#naming-and-binding)
    *   [4.3. Exceptions](executionmodel.html#exceptions)
    *   [4.4. Runtime Components](executionmodel.html#runtime-components)
*   [5\. The import system](import.html)
    *   [5.1. `importlib`](import.html#importlib)
    *   [5.2. Packages](import.html#packages)
    *   [5.3. Searching](import.html#searching)
    *   [5.4. Loading](import.html#loading)
    *   [5.5. The Path Based Finder](import.html#the-path-based-finder)
    *   [5.6. Replacing the standard import system](import.html#replacing-the-standard-import-system)
    *   [5.7. Package Relative Imports](import.html#package-relative-imports)
    *   [5.8. Special considerations for \_\_main\_\_](import.html#special-considerations-for-main)
    *   [5.9. References](import.html#references)
*   [6\. Expressions](expressions.html)
    *   [6.1. Arithmetic conversions](expressions.html#arithmetic-conversions)
    *   [6.2. Atoms](expressions.html#atoms)
    *   [6.3. Primaries](expressions.html#primaries)
    *   [6.4. Await expression](expressions.html#await-expression)
    *   [6.5. The power operator](expressions.html#the-power-operator)
    *   [6.6. Unary arithmetic and bitwise operations](expressions.html#unary-arithmetic-and-bitwise-operations)
    *   [6.7. Binary arithmetic operations](expressions.html#binary-arithmetic-operations)
    *   [6.8. Shifting operations](expressions.html#shifting-operations)
    *   [6.9. Binary bitwise operations](expressions.html#binary-bitwise-operations)
    *   [6.10. Comparisons](expressions.html#comparisons)
    *   [6.11. Boolean operations](expressions.html#boolean-operations)
    *   [6.12. Assignment expressions](expressions.html#assignment-expressions)
    *   [6.13. Conditional expressions](expressions.html#conditional-expressions)
    *   [6.14. Lambdas](expressions.html#lambda)
    *   [6.15. Expression lists](expressions.html#expression-lists)
    *   [6.16. Evaluation order](expressions.html#evaluation-order)
    *   [6.17. Operator precedence](expressions.html#operator-precedence)
*   [7\. Simple statements](simple_stmts.html)
    *   [7.1. Expression statements](simple_stmts.html#expression-statements)
    *   [7.2. Assignment statements](simple_stmts.html#assignment-statements)
    *   [7.3. The `assert` statement](simple_stmts.html#the-assert-statement)
    *   [7.4. The `pass` statement](simple_stmts.html#the-pass-statement)
    *   [7.5. The `del` statement](simple_stmts.html#the-del-statement)
    *   [7.6. The `return` statement](simple_stmts.html#the-return-statement)
    *   [7.7. The `yield` statement](simple_stmts.html#the-yield-statement)
    *   [7.8. The `raise` statement](simple_stmts.html#the-raise-statement)
    *   [7.9. The `break` statement](simple_stmts.html#the-break-statement)
    *   [7.10. The `continue` statement](simple_stmts.html#the-continue-statement)
    *   [7.11. The `import` statement](simple_stmts.html#the-import-statement)
    *   [7.12. The `global` statement](simple_stmts.html#the-global-statement)
    *   [7.13. The `nonlocal` statement](simple_stmts.html#the-nonlocal-statement)
    *   [7.14. The `type` statement](simple_stmts.html#the-type-statement)
*   [8\. Compound statements](compound_stmts.html)
    *   [8.1. The `if` statement](compound_stmts.html#the-if-statement)
    *   [8.2. The `while` statement](compound_stmts.html#the-while-statement)
    *   [8.3. The `for` statement](compound_stmts.html#the-for-statement)
    *   [8.4. The `try` statement](compound_stmts.html#the-try-statement)
    *   [8.5. The `with` statement](compound_stmts.html#the-with-statement)
    *   [8.6. The `match` statement](compound_stmts.html#the-match-statement)
    *   [8.7. Function definitions](compound_stmts.html#function-definitions)
    *   [8.8. Class definitions](compound_stmts.html#class-definitions)
    *   [8.9. Coroutines](compound_stmts.html#coroutines)
    *   [8.10. Type parameter lists](compound_stmts.html#type-parameter-lists)
    *   [8.11. Annotations](compound_stmts.html#annotations)
*   [9\. Top-level components](toplevel_components.html)
    *   [9.1. Complete Python programs](toplevel_components.html#complete-python-programs)
    *   [9.2. File input](toplevel_components.html#file-input)
    *   [9.3. Interactive input](toplevel_components.html#interactive-input)
    *   [9.4. Expression input](toplevel_components.html#expression-input)
*   [10\. Full Grammar specification](grammar.html)

#### Previous topic

[8\. Editors and IDEs](../using/editors.html "previous chapter")

#### Next topic

[1\. Introduction](introduction.html "next chapter")

### This page

*   [Report a bug](../bugs.html)
*   [Improve this page](https://docs.python.org/3/improve-page.html?pagetitle=The+Python+Language+Reference&pageurl=https%3A%2F%2Fdocs.python.org%2F3%2Freference%2Findex.html&pagesource=reference%2Findex.rst)
*   [Show source](https://github.com/python/cpython/blob/main/Doc/reference/index.rst?plain=1)

«

### Navigation

*   [index](../genindex.html "General Index")
*   [modules](../py-modindex.html "Python Module Index") |
*   [next](introduction.html "1. Introduction") |
*   [previous](../using/editors.html "8. Editors and IDEs") |
*   ![Python logo](../_static/py.svg)
*   [Python](https://www.python.org/) »
*   Greek | ΕλληνικάEnglishSpanish | españolFrench | françaisItalian | italianoJapanese | 日本語Korean | 한국어Polish | polskiBrazilian Portuguese | Português brasileiroRomanian | RomâneșteTurkish | TürkçeSimplified Chinese | 简体中文Traditional Chinese | 繁體中文
    
    dev (3.16)pre (3.15)3.14.5rc13.133.123.113.103.93.83.73.63.53.43.33.23.13.02.72.6
    

*   [3.14.5rc1 Documentation](../index.html) »
*   The Python Language Reference
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