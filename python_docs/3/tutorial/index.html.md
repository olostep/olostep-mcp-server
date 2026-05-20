---
url: "https://docs.python.org/3/tutorial/index.html"
---

The Python Tutorial — Python 3.14.5rc1 documentation               

### Navigation

*   [index](../genindex.html "General Index")
*   [modules](../py-modindex.html "Python Module Index") |
*   [next](appetite.html "1. Whetting Your Appetite") |
*   [previous](../whatsnew/changelog.html "Changelog") |
*   ![Python logo](../_static/py.svg)
*   [Python](https://www.python.org/) »
*   Greek | ΕλληνικάEnglishSpanish | españolFrench | françaisItalian | italianoJapanese | 日本語Korean | 한국어Polish | polskiBrazilian Portuguese | Português brasileiroRomanian | RomâneșteTurkish | TürkçeSimplified Chinese | 简体中文Traditional Chinese | 繁體中文
    
    dev (3.16)pre (3.15)3.14.5rc13.133.123.113.103.93.83.73.63.53.43.33.23.13.02.72.6
    

*   [3.14.5rc1 Documentation](../index.html) »
*   The Python Tutorial
*    
    
    |
*   Theme Auto Light Dark |

The Python Tutorial[¶](#the-python-tutorial "Link to this heading")
===================================================================

Tip

This tutorial is designed for _programmers_ that are new to the Python language, **not** _beginners_ who are new to programming.

Python is an easy to learn, powerful programming language. It has efficient high-level data structures and a simple but effective approach to object-oriented programming. Python’s elegant syntax and dynamic typing, together with its interpreted nature, make it an ideal language for scripting and rapid application development in many areas on most platforms.

The Python interpreter and the extensive standard library are freely available in source or binary form for all major platforms from the Python website, [https://www.python.org/](https://www.python.org/), and may be freely distributed. The same site also contains distributions of and pointers to many free third party Python modules, programs and tools, and additional documentation.

The Python interpreter is easily extended with new functions and data types implemented in C or C++ (or other languages callable from C). Python is also suitable as an extension language for customizable applications.

This tutorial introduces the reader informally to the basic concepts and features of the Python language and system. Be aware that it expects you to have a basic understanding of programming in general. It helps to have a Python interpreter handy for hands-on experience, but all examples are self-contained, so the tutorial can be read off-line as well.

For a description of standard objects and modules, see [The Python Standard Library](../library/index.html#library-index). [The Python Language Reference](../reference/index.html#reference-index) gives a more formal definition of the language. To write extensions in C or C++, read [Extending and Embedding the Python Interpreter](../extending/index.html#extending-index) and [Python/C API reference manual](../c-api/index.html#c-api-index). There are also several books covering Python in depth.

This tutorial does not attempt to be comprehensive and cover every single feature, or even every commonly used feature. Instead, it introduces many of Python’s most noteworthy features, and will give you a good idea of the language’s flavor and style. After reading it, you will be able to read and write Python modules and programs, and you will be ready to learn more about the various Python library modules described in [The Python Standard Library](../library/index.html#library-index).

The [Glossary](../glossary.html#glossary) is also worth going through.

*   [1\. Whetting Your Appetite](appetite.html)
*   [2\. Using the Python Interpreter](interpreter.html)
    *   [2.1. Invoking the Interpreter](interpreter.html#invoking-the-interpreter)
        *   [2.1.1. Argument Passing](interpreter.html#argument-passing)
        *   [2.1.2. Interactive Mode](interpreter.html#interactive-mode)
    *   [2.2. The Interpreter and Its Environment](interpreter.html#the-interpreter-and-its-environment)
        *   [2.2.1. Source Code Encoding](interpreter.html#source-code-encoding)
*   [3\. An Informal Introduction to Python](introduction.html)
    *   [3.1. Using Python as a Calculator](introduction.html#using-python-as-a-calculator)
        *   [3.1.1. Numbers](introduction.html#numbers)
        *   [3.1.2. Text](introduction.html#text)
        *   [3.1.3. Lists](introduction.html#lists)
    *   [3.2. First Steps Towards Programming](introduction.html#first-steps-towards-programming)
*   [4\. More Control Flow Tools](controlflow.html)
    *   [4.1. `if` Statements](controlflow.html#if-statements)
    *   [4.2. `for` Statements](controlflow.html#for-statements)
    *   [4.3. The `range()` Function](controlflow.html#the-range-function)
    *   [4.4. `break` and `continue` Statements](controlflow.html#break-and-continue-statements)
    *   [4.5. `else` Clauses on Loops](controlflow.html#else-clauses-on-loops)
    *   [4.6. `pass` Statements](controlflow.html#pass-statements)
    *   [4.7. `match` Statements](controlflow.html#match-statements)
    *   [4.8. Defining Functions](controlflow.html#defining-functions)
    *   [4.9. More on Defining Functions](controlflow.html#more-on-defining-functions)
        *   [4.9.1. Default Argument Values](controlflow.html#default-argument-values)
        *   [4.9.2. Keyword Arguments](controlflow.html#keyword-arguments)
        *   [4.9.3. Special parameters](controlflow.html#special-parameters)
            *   [4.9.3.1. Positional-or-Keyword Arguments](controlflow.html#positional-or-keyword-arguments)
            *   [4.9.3.2. Positional-Only Parameters](controlflow.html#positional-only-parameters)
            *   [4.9.3.3. Keyword-Only Arguments](controlflow.html#keyword-only-arguments)
            *   [4.9.3.4. Function Examples](controlflow.html#function-examples)
            *   [4.9.3.5. Recap](controlflow.html#recap)
        *   [4.9.4. Arbitrary Argument Lists](controlflow.html#arbitrary-argument-lists)
        *   [4.9.5. Unpacking Argument Lists](controlflow.html#unpacking-argument-lists)
        *   [4.9.6. Lambda Expressions](controlflow.html#lambda-expressions)
        *   [4.9.7. Documentation Strings](controlflow.html#documentation-strings)
        *   [4.9.8. Function Annotations](controlflow.html#function-annotations)
    *   [4.10. Intermezzo: Coding Style](controlflow.html#intermezzo-coding-style)
*   [5\. Data Structures](datastructures.html)
    *   [5.1. More on Lists](datastructures.html#more-on-lists)
        *   [5.1.1. Using Lists as Stacks](datastructures.html#using-lists-as-stacks)
        *   [5.1.2. Using Lists as Queues](datastructures.html#using-lists-as-queues)
        *   [5.1.3. List Comprehensions](datastructures.html#list-comprehensions)
        *   [5.1.4. Nested List Comprehensions](datastructures.html#nested-list-comprehensions)
    *   [5.2. The `del` statement](datastructures.html#the-del-statement)
    *   [5.3. Tuples and Sequences](datastructures.html#tuples-and-sequences)
    *   [5.4. Sets](datastructures.html#sets)
    *   [5.5. Dictionaries](datastructures.html#dictionaries)
    *   [5.6. Looping Techniques](datastructures.html#looping-techniques)
    *   [5.7. More on Conditions](datastructures.html#more-on-conditions)
    *   [5.8. Comparing Sequences and Other Types](datastructures.html#comparing-sequences-and-other-types)
*   [6\. Modules](modules.html)
    *   [6.1. More on Modules](modules.html#more-on-modules)
        *   [6.1.1. Executing modules as scripts](modules.html#executing-modules-as-scripts)
        *   [6.1.2. The Module Search Path](modules.html#the-module-search-path)
        *   [6.1.3. “Compiled” Python files](modules.html#compiled-python-files)
    *   [6.2. Standard Modules](modules.html#standard-modules)
    *   [6.3. The `dir()` Function](modules.html#the-dir-function)
    *   [6.4. Packages](modules.html#packages)
        *   [6.4.1. Importing \* From a Package](modules.html#importing-from-a-package)
        *   [6.4.2. Intra-package References](modules.html#intra-package-references)
        *   [6.4.3. Packages in Multiple Directories](modules.html#packages-in-multiple-directories)
*   [7\. Input and Output](inputoutput.html)
    *   [7.1. Fancier Output Formatting](inputoutput.html#fancier-output-formatting)
        *   [7.1.1. Formatted String Literals](inputoutput.html#formatted-string-literals)
        *   [7.1.2. The String format() Method](inputoutput.html#the-string-format-method)
        *   [7.1.3. Manual String Formatting](inputoutput.html#manual-string-formatting)
        *   [7.1.4. Old string formatting](inputoutput.html#old-string-formatting)
    *   [7.2. Reading and Writing Files](inputoutput.html#reading-and-writing-files)
        *   [7.2.1. Methods of File Objects](inputoutput.html#methods-of-file-objects)
        *   [7.2.2. Saving structured data with `json`](inputoutput.html#saving-structured-data-with-json)
*   [8\. Errors and Exceptions](errors.html)
    *   [8.1. Syntax Errors](errors.html#syntax-errors)
    *   [8.2. Exceptions](errors.html#exceptions)
    *   [8.3. Handling Exceptions](errors.html#handling-exceptions)
    *   [8.4. Raising Exceptions](errors.html#raising-exceptions)
    *   [8.5. Exception Chaining](errors.html#exception-chaining)
    *   [8.6. User-defined Exceptions](errors.html#user-defined-exceptions)
    *   [8.7. Defining Clean-up Actions](errors.html#defining-clean-up-actions)
    *   [8.8. Predefined Clean-up Actions](errors.html#predefined-clean-up-actions)
    *   [8.9. Raising and Handling Multiple Unrelated Exceptions](errors.html#raising-and-handling-multiple-unrelated-exceptions)
    *   [8.10. Enriching Exceptions with Notes](errors.html#enriching-exceptions-with-notes)
*   [9\. Classes](classes.html)
    *   [9.1. A Word About Names and Objects](classes.html#a-word-about-names-and-objects)
    *   [9.2. Python Scopes and Namespaces](classes.html#python-scopes-and-namespaces)
        *   [9.2.1. Scopes and Namespaces Example](classes.html#scopes-and-namespaces-example)
    *   [9.3. A First Look at Classes](classes.html#a-first-look-at-classes)
        *   [9.3.1. Class Definition Syntax](classes.html#class-definition-syntax)
        *   [9.3.2. Class Objects](classes.html#class-objects)
        *   [9.3.3. Instance Objects](classes.html#instance-objects)
        *   [9.3.4. Method Objects](classes.html#method-objects)
        *   [9.3.5. Class and Instance Variables](classes.html#class-and-instance-variables)
    *   [9.4. Random Remarks](classes.html#random-remarks)
    *   [9.5. Inheritance](classes.html#inheritance)
        *   [9.5.1. Multiple Inheritance](classes.html#multiple-inheritance)
    *   [9.6. Private Variables](classes.html#private-variables)
    *   [9.7. Odds and Ends](classes.html#odds-and-ends)
    *   [9.8. Iterators](classes.html#iterators)
    *   [9.9. Generators](classes.html#generators)
    *   [9.10. Generator Expressions](classes.html#generator-expressions)
*   [10\. Brief tour of the standard library](stdlib.html)
    *   [10.1. Operating system interface](stdlib.html#operating-system-interface)
    *   [10.2. File wildcards](stdlib.html#file-wildcards)
    *   [10.3. Command-line arguments](stdlib.html#command-line-arguments)
    *   [10.4. Error output redirection and program termination](stdlib.html#error-output-redirection-and-program-termination)
    *   [10.5. String pattern matching](stdlib.html#string-pattern-matching)
    *   [10.6. Mathematics](stdlib.html#mathematics)
    *   [10.7. Internet access](stdlib.html#internet-access)
    *   [10.8. Dates and times](stdlib.html#dates-and-times)
    *   [10.9. Data compression](stdlib.html#data-compression)
    *   [10.10. Performance measurement](stdlib.html#performance-measurement)
    *   [10.11. Quality control](stdlib.html#quality-control)
    *   [10.12. Batteries included](stdlib.html#batteries-included)
*   [11\. Brief tour of the standard library — part II](stdlib2.html)
    *   [11.1. Output formatting](stdlib2.html#output-formatting)
    *   [11.2. Templating](stdlib2.html#templating)
    *   [11.3. Working with binary data record layouts](stdlib2.html#working-with-binary-data-record-layouts)
    *   [11.4. Multi-threading](stdlib2.html#multi-threading)
    *   [11.5. Logging](stdlib2.html#logging)
    *   [11.6. Weak references](stdlib2.html#weak-references)
    *   [11.7. Tools for working with lists](stdlib2.html#tools-for-working-with-lists)
    *   [11.8. Decimal floating-point arithmetic](stdlib2.html#decimal-floating-point-arithmetic)
*   [12\. Virtual Environments and Packages](venv.html)
    *   [12.1. Introduction](venv.html#introduction)
    *   [12.2. Creating Virtual Environments](venv.html#creating-virtual-environments)
    *   [12.3. Managing Packages with pip](venv.html#managing-packages-with-pip)
*   [13\. What Now?](whatnow.html)
*   [14\. Interactive Input Editing and History Substitution](interactive.html)
    *   [14.1. Tab Completion and History Editing](interactive.html#tab-completion-and-history-editing)
    *   [14.2. Alternatives to the Interactive Interpreter](interactive.html#alternatives-to-the-interactive-interpreter)
*   [15\. Floating-Point Arithmetic: Issues and Limitations](floatingpoint.html)
    *   [15.1. Representation Error](floatingpoint.html#representation-error)
*   [16\. Appendix](appendix.html)
    *   [16.1. Interactive Mode](appendix.html#interactive-mode)
        *   [16.1.1. Error Handling](appendix.html#error-handling)
        *   [16.1.2. Executable Python Scripts](appendix.html#executable-python-scripts)
        *   [16.1.3. The Interactive Startup File](appendix.html#the-interactive-startup-file)
        *   [16.1.4. The Customization Modules](appendix.html#the-customization-modules)

#### Previous topic

[Changelog](../whatsnew/changelog.html "previous chapter")

#### Next topic

[1\. Whetting Your Appetite](appetite.html "next chapter")

### This page

*   [Report a bug](../bugs.html)
*   [Improve this page](https://docs.python.org/3/improve-page.html?pagetitle=The+Python+Tutorial&pageurl=https%3A%2F%2Fdocs.python.org%2F3%2Ftutorial%2Findex.html&pagesource=tutorial%2Findex.rst)
*   [Show source](https://github.com/python/cpython/blob/main/Doc/tutorial/index.rst?plain=1)

«

### Navigation

*   [index](../genindex.html "General Index")
*   [modules](../py-modindex.html "Python Module Index") |
*   [next](appetite.html "1. Whetting Your Appetite") |
*   [previous](../whatsnew/changelog.html "Changelog") |
*   ![Python logo](../_static/py.svg)
*   [Python](https://www.python.org/) »
*   Greek | ΕλληνικάEnglishSpanish | españolFrench | françaisItalian | italianoJapanese | 日本語Korean | 한국어Polish | polskiBrazilian Portuguese | Português brasileiroRomanian | RomâneșteTurkish | TürkçeSimplified Chinese | 简体中文Traditional Chinese | 繁體中文
    
    dev (3.16)pre (3.15)3.14.5rc13.133.123.113.103.93.83.73.63.53.43.33.23.13.02.72.6
    

*   [3.14.5rc1 Documentation](../index.html) »
*   The Python Tutorial
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