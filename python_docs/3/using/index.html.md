---
url: "https://docs.python.org/3/using/index.html"
---

Python Setup and Usage — Python 3.14.5rc1 documentation               

### Navigation

*   [index](../genindex.html "General Index")
*   [modules](../py-modindex.html "Python Module Index") |
*   [next](cmdline.html "1. Command line and environment") |
*   [previous](../tutorial/appendix.html "16. Appendix") |
*   ![Python logo](../_static/py.svg)
*   [Python](https://www.python.org/) »
*   Greek | ΕλληνικάEnglishSpanish | españolFrench | françaisItalian | italianoJapanese | 日本語Korean | 한국어Polish | polskiBrazilian Portuguese | Português brasileiroRomanian | RomâneșteTurkish | TürkçeSimplified Chinese | 简体中文Traditional Chinese | 繁體中文
    
    dev (3.16)pre (3.15)3.14.5rc13.133.123.113.103.93.83.73.63.53.43.33.23.13.02.72.6
    

*   [3.14.5rc1 Documentation](../index.html) »
*   Python Setup and Usage
*    
    
    |
*   Theme Auto Light Dark |

Python Setup and Usage[¶](#python-setup-and-usage "Link to this heading")
=========================================================================

This part of the documentation is devoted to general information on the setup of the Python environment on different platforms, the invocation of the interpreter and things that make working with Python easier.

*   [1\. Command line and environment](cmdline.html)
    *   [1.1. Command line](cmdline.html#command-line)
    *   [1.2. Environment variables](cmdline.html#environment-variables)
*   [2\. Using Python on Unix platforms](unix.html)
    *   [2.1. Getting and installing the latest version of Python](unix.html#getting-and-installing-the-latest-version-of-python)
    *   [2.2. Building Python](unix.html#building-python)
    *   [2.3. Python-related paths and files](unix.html#python-related-paths-and-files)
    *   [2.4. Miscellaneous](unix.html#miscellaneous)
    *   [2.5. Custom OpenSSL](unix.html#custom-openssl)
*   [3\. Configure Python](configure.html)
    *   [3.1. Build Requirements](configure.html#build-requirements)
    *   [3.2. Generated files](configure.html#generated-files)
    *   [3.3. Configure Options](configure.html#configure-options)
    *   [3.4. Python Build System](configure.html#python-build-system)
    *   [3.5. Compiler and linker flags](configure.html#compiler-and-linker-flags)
*   [4\. Using Python on Windows](windows.html)
    *   [4.1. Python install manager](windows.html#python-install-manager)
    *   [4.2. The embeddable package](windows.html#the-embeddable-package)
    *   [4.3. The nuget.org packages](windows.html#the-nuget-org-packages)
    *   [4.4. Alternative bundles](windows.html#alternative-bundles)
    *   [4.5. Supported Windows versions](windows.html#supported-windows-versions)
    *   [4.6. Removing the MAX\_PATH limitation](windows.html#removing-the-max-path-limitation)
    *   [4.7. UTF-8 mode](windows.html#utf-8-mode)
    *   [4.8. Finding modules](windows.html#finding-modules)
    *   [4.9. Additional modules](windows.html#additional-modules)
    *   [4.10. Compiling Python on Windows](windows.html#compiling-python-on-windows)
    *   [4.11. The full installer (deprecated)](windows.html#the-full-installer-deprecated)
    *   [4.12. Python launcher for Windows (deprecated)](windows.html#python-launcher-for-windows-deprecated)
*   [5\. Using Python on macOS](mac.html)
    *   [5.1. Using Python for macOS from `python.org`](mac.html#using-python-for-macos-from-python-org)
    *   [5.2. Alternative Distributions](mac.html#alternative-distributions)
    *   [5.3. Installing Additional Python Packages](mac.html#installing-additional-python-packages)
    *   [5.4. GUI Programming](mac.html#gui-programming)
    *   [5.5. Advanced Topics](mac.html#advanced-topics)
    *   [5.6. Other Resources](mac.html#other-resources)
*   [6\. Using Python on Android](android.html)
    *   [6.1. Adding Python to an Android app](android.html#adding-python-to-an-android-app)
    *   [6.2. Building a Python package for Android](android.html#building-a-python-package-for-android)
*   [7\. Using Python on iOS](ios.html)
    *   [7.1. Python at runtime on iOS](ios.html#python-at-runtime-on-ios)
    *   [7.2. Installing Python on iOS](ios.html#installing-python-on-ios)
    *   [7.3. App Store Compliance](ios.html#app-store-compliance)
*   [8\. Editors and IDEs](editors.html)
    *   [8.1. IDLE — Python editor and shell](editors.html#idle-python-editor-and-shell)
    *   [8.2. Other Editors and IDEs](editors.html#other-editors-and-ides)

#### Previous topic

[16\. Appendix](../tutorial/appendix.html "previous chapter")

#### Next topic

[1\. Command line and environment](cmdline.html "next chapter")

### This page

*   [Report a bug](../bugs.html)
*   [Improve this page](https://docs.python.org/3/improve-page.html?pagetitle=Python+Setup+and+Usage&pageurl=https%3A%2F%2Fdocs.python.org%2F3%2Fusing%2Findex.html&pagesource=using%2Findex.rst)
*   [Show source](https://github.com/python/cpython/blob/main/Doc/using/index.rst?plain=1)

«

### Navigation

*   [index](../genindex.html "General Index")
*   [modules](../py-modindex.html "Python Module Index") |
*   [next](cmdline.html "1. Command line and environment") |
*   [previous](../tutorial/appendix.html "16. Appendix") |
*   ![Python logo](../_static/py.svg)
*   [Python](https://www.python.org/) »
*   Greek | ΕλληνικάEnglishSpanish | españolFrench | françaisItalian | italianoJapanese | 日本語Korean | 한국어Polish | polskiBrazilian Portuguese | Português brasileiroRomanian | RomâneșteTurkish | TürkçeSimplified Chinese | 简体中文Traditional Chinese | 繁體中文
    
    dev (3.16)pre (3.15)3.14.5rc13.133.123.113.103.93.83.73.63.53.43.33.23.13.02.72.6
    

*   [3.14.5rc1 Documentation](../index.html) »
*   Python Setup and Usage
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