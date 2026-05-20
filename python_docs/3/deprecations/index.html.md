---
url: "https://docs.python.org/3/deprecations/index.html"
---

Deprecations — Python 3.14.5rc1 documentation               

### Navigation

*   [index](../genindex.html "General Index")
*   [modules](../py-modindex.html "Python Module Index") |
*   [next](../glossary.html "Glossary") |
*   [previous](../faq/installed.html "“Why is Python Installed on my Computer?” FAQ") |
*   ![Python logo](../_static/py.svg)
*   [Python](https://www.python.org/) »
*   Greek | ΕλληνικάEnglishSpanish | españolFrench | françaisItalian | italianoJapanese | 日本語Korean | 한국어Polish | polskiBrazilian Portuguese | Português brasileiroRomanian | RomâneșteTurkish | TürkçeSimplified Chinese | 简体中文Traditional Chinese | 繁體中文
    
    dev (3.16)pre (3.15)3.14.5rc13.133.123.113.103.93.83.73.63.53.43.33.23.13.02.72.6
    

*   [3.14.5rc1 Documentation](../index.html) »
*   Deprecations
*    
    
    |
*   Theme Auto Light Dark |

Deprecations[¶](#deprecations "Link to this heading")
=====================================================

Pending removal in Python 3.15[¶](#pending-removal-in-python-3-15 "Link to this heading")
-----------------------------------------------------------------------------------------

*   The import system:
    
    *   Setting [`__cached__`](../reference/datamodel.html#module.__cached__ "module.__cached__") on a module while failing to set [`__spec__.cached`](../library/importlib.html#importlib.machinery.ModuleSpec.cached "importlib.machinery.ModuleSpec.cached") is deprecated. In Python 3.15, `__cached__` will cease to be set or take into consideration by the import system or standard library. ([gh-97879](https://github.com/python/cpython/issues/97879))
        
    *   Setting [`__package__`](../reference/datamodel.html#module.__package__ "module.__package__") on a module while failing to set [`__spec__.parent`](../library/importlib.html#importlib.machinery.ModuleSpec.parent "importlib.machinery.ModuleSpec.parent") is deprecated. In Python 3.15, `__package__` will cease to be set or take into consideration by the import system or standard library. ([gh-97879](https://github.com/python/cpython/issues/97879))
        
*   [`ctypes`](../library/ctypes.html#module-ctypes "ctypes: A foreign function library for Python."):
    
    *   The undocumented `ctypes.SetPointerType()` function has been deprecated since Python 3.13.
        
*   [`http.server`](../library/http.server.html#module-http.server "http.server: HTTP server and request handlers."):
    
    *   The obsolete and rarely used [`CGIHTTPRequestHandler`](../library/http.server.html#http.server.CGIHTTPRequestHandler "http.server.CGIHTTPRequestHandler") has been deprecated since Python 3.13. No direct replacement exists. _Anything_ is better than CGI to interface a web server with a request handler.
        
    *   The `--cgi` flag to the **python -m http.server** command-line interface has been deprecated since Python 3.13.
        
*   [`importlib`](../library/importlib.html#module-importlib "importlib: The implementation of the import machinery."):
    
    *   `load_module()` method: use `exec_module()` instead.
        
*   [`locale`](../library/locale.html#module-locale "locale: Internationalization services."):
    
    *   The [`getdefaultlocale()`](../library/locale.html#locale.getdefaultlocale "locale.getdefaultlocale") function has been deprecated since Python 3.11. Its removal was originally planned for Python 3.13 ([gh-90817](https://github.com/python/cpython/issues/90817)), but has been postponed to Python 3.15. Use [`getlocale()`](../library/locale.html#locale.getlocale "locale.getlocale"), [`setlocale()`](../library/locale.html#locale.setlocale "locale.setlocale"), and [`getencoding()`](../library/locale.html#locale.getencoding "locale.getencoding") instead. (Contributed by Hugo van Kemenade in [gh-111187](https://github.com/python/cpython/issues/111187).)
        
*   [`pathlib`](../library/pathlib.html#module-pathlib "pathlib: Object-oriented filesystem paths"):
    
    *   [`PurePath.is_reserved()`](../library/pathlib.html#pathlib.PurePath.is_reserved "pathlib.PurePath.is_reserved") has been deprecated since Python 3.13. Use [`os.path.isreserved()`](../library/os.path.html#os.path.isreserved "os.path.isreserved") to detect reserved paths on Windows.
        
*   [`platform`](../library/platform.html#module-platform "platform: Retrieves as much platform identifying data as possible."):
    
    *   [`java_ver()`](../library/platform.html#platform.java_ver "platform.java_ver") has been deprecated since Python 3.13. This function is only useful for Jython support, has a confusing API, and is largely untested.
        
*   [`sysconfig`](../library/sysconfig.html#module-sysconfig "sysconfig: Python's configuration information"):
    
    *   The _check\_home_ argument of [`sysconfig.is_python_build()`](../library/sysconfig.html#sysconfig.is_python_build "sysconfig.is_python_build") has been deprecated since Python 3.12.
        
*   [`threading`](../library/threading.html#module-threading "threading: Thread-based parallelism."):
    
    *   [`RLock()`](../library/threading.html#threading.RLock "threading.RLock") will take no arguments in Python 3.15. Passing any arguments has been deprecated since Python 3.14, as the Python version does not permit any arguments, but the C version allows any number of positional or keyword arguments, ignoring every argument.
        
*   [`types`](../library/types.html#module-types "types: Names for built-in types."):
    
    *   [`types.CodeType`](../library/types.html#types.CodeType "types.CodeType"): Accessing [`co_lnotab`](../reference/datamodel.html#codeobject.co_lnotab "codeobject.co_lnotab") was deprecated in [**PEP 626**](https://peps.python.org/pep-0626/) since 3.10 and was planned to be removed in 3.12, but it only got a proper [`DeprecationWarning`](../library/exceptions.html#DeprecationWarning "DeprecationWarning") in 3.12. May be removed in 3.15. (Contributed by Nikita Sobolev in [gh-101866](https://github.com/python/cpython/issues/101866).)
        
*   [`typing`](../library/typing.html#module-typing "typing: Support for type hints (see :pep:`484`)."):
    
    *   The undocumented keyword argument syntax for creating [`NamedTuple`](../library/typing.html#typing.NamedTuple "typing.NamedTuple") classes (for example, `Point = NamedTuple("Point", x=int, y=int)`) has been deprecated since Python 3.13. Use the class-based syntax or the functional syntax instead.
        
    *   When using the functional syntax of [`TypedDict`](../library/typing.html#typing.TypedDict "typing.TypedDict")s, failing to pass a value to the _fields_ parameter (`TD = TypedDict("TD")`) or passing `None` (`TD = TypedDict("TD", None)`) has been deprecated since Python 3.13. Use `class TD(TypedDict): pass` or `TD = TypedDict("TD", {})` to create a TypedDict with zero field.
        
    *   The [`typing.no_type_check_decorator()`](../library/typing.html#typing.no_type_check_decorator "typing.no_type_check_decorator") decorator function has been deprecated since Python 3.13. After eight years in the [`typing`](../library/typing.html#module-typing "typing: Support for type hints (see :pep:`484`).") module, it has yet to be supported by any major type checker.
        
*   [`wave`](../library/wave.html#module-wave "wave: Provide an interface to the WAV sound format."):
    
    *   The [`getmark()`](../library/wave.html#wave.Wave_read.getmark "wave.Wave_read.getmark"), `setmark()`, and [`getmarkers()`](../library/wave.html#wave.Wave_read.getmarkers "wave.Wave_read.getmarkers") methods of the [`Wave_read`](../library/wave.html#wave.Wave_read "wave.Wave_read") and [`Wave_write`](../library/wave.html#wave.Wave_write "wave.Wave_write") classes have been deprecated since Python 3.13.
        
*   [`zipimport`](../library/zipimport.html#module-zipimport "zipimport: Support for importing Python modules from ZIP archives."):
    
    *   [`load_module()`](../library/zipimport.html#zipimport.zipimporter.load_module "zipimport.zipimporter.load_module") has been deprecated since Python 3.10. Use [`exec_module()`](../library/zipimport.html#zipimport.zipimporter.exec_module "zipimport.zipimporter.exec_module") instead. (Contributed by Jiahao Li in [gh-125746](https://github.com/python/cpython/issues/125746).)
        

Pending removal in Python 3.16[¶](#pending-removal-in-python-3-16 "Link to this heading")
-----------------------------------------------------------------------------------------

*   The import system:
    
    *   Setting [`__loader__`](../reference/datamodel.html#module.__loader__ "module.__loader__") on a module while failing to set [`__spec__.loader`](../library/importlib.html#importlib.machinery.ModuleSpec.loader "importlib.machinery.ModuleSpec.loader") is deprecated. In Python 3.16, `__loader__` will cease to be set or taken into consideration by the import system or the standard library.
        
*   [`array`](../library/array.html#module-array "array: Space efficient arrays of uniformly typed numeric values."):
    
    *   The `'u'` format code (`wchar_t`) has been deprecated in documentation since Python 3.3 and at runtime since Python 3.13. Use the `'w'` format code ([`Py_UCS4`](../c-api/unicode.html#c.Py_UCS4 "Py_UCS4")) for Unicode characters instead.
        
*   [`asyncio`](../library/asyncio.html#module-asyncio "asyncio: Asynchronous I/O."):
    
    *   `asyncio.iscoroutinefunction()` is deprecated and will be removed in Python 3.16; use [`inspect.iscoroutinefunction()`](../library/inspect.html#inspect.iscoroutinefunction "inspect.iscoroutinefunction") instead. (Contributed by Jiahao Li and Kumar Aditya in [gh-122875](https://github.com/python/cpython/issues/122875).)
        
    *   [`asyncio`](../library/asyncio.html#module-asyncio "asyncio: Asynchronous I/O.") policy system is deprecated and will be removed in Python 3.16. In particular, the following classes and functions are deprecated:
        
        *   [`asyncio.AbstractEventLoopPolicy`](../library/asyncio-policy.html#asyncio.AbstractEventLoopPolicy "asyncio.AbstractEventLoopPolicy")
            
        *   [`asyncio.DefaultEventLoopPolicy`](../library/asyncio-policy.html#asyncio.DefaultEventLoopPolicy "asyncio.DefaultEventLoopPolicy")
            
        *   [`asyncio.WindowsSelectorEventLoopPolicy`](../library/asyncio-policy.html#asyncio.WindowsSelectorEventLoopPolicy "asyncio.WindowsSelectorEventLoopPolicy")
            
        *   [`asyncio.WindowsProactorEventLoopPolicy`](../library/asyncio-policy.html#asyncio.WindowsProactorEventLoopPolicy "asyncio.WindowsProactorEventLoopPolicy")
            
        *   [`asyncio.get_event_loop_policy()`](../library/asyncio-policy.html#asyncio.get_event_loop_policy "asyncio.get_event_loop_policy")
            
        *   [`asyncio.set_event_loop_policy()`](../library/asyncio-policy.html#asyncio.set_event_loop_policy "asyncio.set_event_loop_policy")
            
        
        Users should use [`asyncio.run()`](../library/asyncio-runner.html#asyncio.run "asyncio.run") or [`asyncio.Runner`](../library/asyncio-runner.html#asyncio.Runner "asyncio.Runner") with _loop\_factory_ to use the desired event loop implementation.
        
        For example, to use [`asyncio.SelectorEventLoop`](../library/asyncio-eventloop.html#asyncio.SelectorEventLoop "asyncio.SelectorEventLoop") on Windows:
        
        Copy
        
        import asyncio
        
        async def main():
            ...
        
        asyncio.run(main(), loop\_factory\=asyncio.SelectorEventLoop)
        
        (Contributed by Kumar Aditya in [gh-127949](https://github.com/python/cpython/issues/127949).)
        
*   [`builtins`](../library/builtins.html#module-builtins "builtins: The module that provides the built-in namespace."):
    
    *   Bitwise inversion on boolean types, `~True` or `~False` has been deprecated since Python 3.12, as it produces surprising and unintuitive results (`-2` and `-1`). Use `not x` instead for the logical negation of a Boolean. In the rare case that you need the bitwise inversion of the underlying integer, convert to `int` explicitly (`~int(x)`).
        
*   [`functools`](../library/functools.html#module-functools "functools: Higher-order functions and operations on callable objects."):
    
    *   Calling the Python implementation of [`functools.reduce()`](../library/functools.html#functools.reduce "functools.reduce") with _function_ or _sequence_ as keyword arguments has been deprecated since Python 3.14.
        
*   [`logging`](../library/logging.html#module-logging "logging: Flexible event logging system for applications."):
    
    Support for custom logging handlers with the _strm_ argument is deprecated and scheduled for removal in Python 3.16. Define handlers with the _stream_ argument instead. (Contributed by Mariusz Felisiak in [gh-115032](https://github.com/python/cpython/issues/115032).)
    
*   [`mimetypes`](../library/mimetypes.html#module-mimetypes "mimetypes: Mapping of filename extensions to MIME types."):
    
    *   Valid extensions start with a ‘.’ or are empty for [`mimetypes.MimeTypes.add_type()`](../library/mimetypes.html#mimetypes.MimeTypes.add_type "mimetypes.MimeTypes.add_type"). Undotted extensions are deprecated and will raise a [`ValueError`](../library/exceptions.html#ValueError "ValueError") in Python 3.16. (Contributed by Hugo van Kemenade in [gh-75223](https://github.com/python/cpython/issues/75223).)
        
*   [`shutil`](../library/shutil.html#module-shutil "shutil: High-level file operations, including copying."):
    
    *   The `ExecError` exception has been deprecated since Python 3.14. It has not been used by any function in `shutil` since Python 3.4, and is now an alias of [`RuntimeError`](../library/exceptions.html#RuntimeError "RuntimeError").
        
*   [`symtable`](../library/symtable.html#module-symtable "symtable: Interface to the compiler's internal symbol tables."):
    
    *   The [`Class.get_methods`](../library/symtable.html#symtable.Class.get_methods "symtable.Class.get_methods") method has been deprecated since Python 3.14.
        
*   [`sys`](../library/sys.html#module-sys "sys: Access system-specific parameters and functions."):
    
    *   The [`_enablelegacywindowsfsencoding()`](../library/sys.html#sys._enablelegacywindowsfsencoding "sys._enablelegacywindowsfsencoding") function has been deprecated since Python 3.13. Use the [`PYTHONLEGACYWINDOWSFSENCODING`](../using/cmdline.html#envvar-PYTHONLEGACYWINDOWSFSENCODING) environment variable instead.
        
*   [`sysconfig`](../library/sysconfig.html#module-sysconfig "sysconfig: Python's configuration information"):
    
    *   The `sysconfig.expand_makefile_vars()` function has been deprecated since Python 3.14. Use the `vars` argument of [`sysconfig.get_paths()`](../library/sysconfig.html#sysconfig.get_paths "sysconfig.get_paths") instead.
        
*   [`tarfile`](../library/tarfile.html#module-tarfile "tarfile: Read and write tar-format archive files."):
    
    *   The undocumented and unused `TarFile.tarfile` attribute has been deprecated since Python 3.13.
        

Pending removal in Python 3.17[¶](#pending-removal-in-python-3-17 "Link to this heading")
-----------------------------------------------------------------------------------------

*   [`collections.abc`](../library/collections.abc.html#module-collections.abc "collections.abc: Abstract base classes for containers"):
    
    *   [`collections.abc.ByteString`](../library/collections.abc.html#collections.abc.ByteString "collections.abc.ByteString") is scheduled for removal in Python 3.17.
        
        Use `isinstance(obj, collections.abc.Buffer)` to test if `obj` implements the [buffer protocol](../c-api/buffer.html#bufferobjects) at runtime. For use in type annotations, either use [`Buffer`](../library/collections.abc.html#collections.abc.Buffer "collections.abc.Buffer") or a union that explicitly specifies the types your code supports (e.g., `bytes | bytearray | memoryview`).
        
        `ByteString` was originally intended to be an abstract class that would serve as a supertype of both [`bytes`](../library/stdtypes.html#bytes "bytes") and [`bytearray`](../library/stdtypes.html#bytearray "bytearray"). However, since the ABC never had any methods, knowing that an object was an instance of `ByteString` never actually told you anything useful about the object. Other common buffer types such as [`memoryview`](../library/stdtypes.html#memoryview "memoryview") were also never understood as subtypes of `ByteString` (either at runtime or by static type checkers).
        
        See [**PEP 688**](https://peps.python.org/pep-0688/#current-options) for more details. (Contributed by Shantanu Jain in [gh-91896](https://github.com/python/cpython/issues/91896).)
        
*   [`typing`](../library/typing.html#module-typing "typing: Support for type hints (see :pep:`484`)."):
    
    *   Before Python 3.14, old-style unions were implemented using the private class `typing._UnionGenericAlias`. This class is no longer needed for the implementation, but it has been retained for backward compatibility, with removal scheduled for Python 3.17. Users should use documented introspection helpers like [`typing.get_origin()`](../library/typing.html#typing.get_origin "typing.get_origin") and [`typing.get_args()`](../library/typing.html#typing.get_args "typing.get_args") instead of relying on private implementation details.
        
    *   [`typing.ByteString`](../library/typing.html#typing.ByteString "typing.ByteString"), deprecated since Python 3.9, is scheduled for removal in Python 3.17.
        
        Use `isinstance(obj, collections.abc.Buffer)` to test if `obj` implements the [buffer protocol](../c-api/buffer.html#bufferobjects) at runtime. For use in type annotations, either use [`Buffer`](../library/collections.abc.html#collections.abc.Buffer "collections.abc.Buffer") or a union that explicitly specifies the types your code supports (e.g., `bytes | bytearray | memoryview`).
        
        `ByteString` was originally intended to be an abstract class that would serve as a supertype of both [`bytes`](../library/stdtypes.html#bytes "bytes") and [`bytearray`](../library/stdtypes.html#bytearray "bytearray"). However, since the ABC never had any methods, knowing that an object was an instance of `ByteString` never actually told you anything useful about the object. Other common buffer types such as [`memoryview`](../library/stdtypes.html#memoryview "memoryview") were also never understood as subtypes of `ByteString` (either at runtime or by static type checkers).
        
        See [**PEP 688**](https://peps.python.org/pep-0688/#current-options) for more details. (Contributed by Shantanu Jain in [gh-91896](https://github.com/python/cpython/issues/91896).)
        

Pending removal in Python 3.18[¶](#pending-removal-in-python-3-18 "Link to this heading")
-----------------------------------------------------------------------------------------

*   [`decimal`](../library/decimal.html#module-decimal "decimal: Implementation of the General Decimal Arithmetic Specification."):
    
    *   The non-standard and undocumented [`Decimal`](../library/decimal.html#decimal.Decimal "decimal.Decimal") format specifier `'N'`, which is only supported in the `decimal` module’s C implementation, has been deprecated since Python 3.13. (Contributed by Serhiy Storchaka in [gh-89902](https://github.com/python/cpython/issues/89902).)
        

Pending removal in Python 3.19[¶](#pending-removal-in-python-3-19 "Link to this heading")
-----------------------------------------------------------------------------------------

*   [`ctypes`](../library/ctypes.html#module-ctypes "ctypes: A foreign function library for Python."):
    
    *   Implicitly switching to the MSVC-compatible struct layout by setting [`_pack_`](../library/ctypes.html#ctypes.Structure._pack_ "ctypes.Structure._pack_") but not [`_layout_`](../library/ctypes.html#ctypes.Structure._layout_ "ctypes.Structure._layout_") on non-Windows platforms.
        

Pending removal in future versions[¶](#pending-removal-in-future-versions "Link to this heading")
-------------------------------------------------------------------------------------------------

The following APIs will be removed in the future, although there is currently no date scheduled for their removal.

*   [`argparse`](../library/argparse.html#module-argparse "argparse: Command-line option and argument parsing library."):
    
    *   Nesting argument groups and nesting mutually exclusive groups are deprecated.
        
    *   Passing the undocumented keyword argument _prefix\_chars_ to [`add_argument_group()`](../library/argparse.html#argparse.ArgumentParser.add_argument_group "argparse.ArgumentParser.add_argument_group") is now deprecated.
        
    *   The [`argparse.FileType`](../library/argparse.html#argparse.FileType "argparse.FileType") type converter is deprecated.
        
*   [`builtins`](../library/builtins.html#module-builtins "builtins: The module that provides the built-in namespace."):
    
    *   Generators: `throw(type, exc, tb)` and `athrow(type, exc, tb)` signature is deprecated: use `throw(exc)` and `athrow(exc)` instead, the single argument signature.
        
    *   Currently Python accepts numeric literals immediately followed by keywords, for example `0in x`, `1or x`, `0if 1else 2`. It allows confusing and ambiguous expressions like `[0x1for x in y]` (which can be interpreted as `[0x1 for x in y]` or `[0x1f or x in y]`). A syntax warning is raised if the numeric literal is immediately followed by one of keywords [`and`](../reference/expressions.html#and), [`else`](../reference/compound_stmts.html#else), [`for`](../reference/compound_stmts.html#for), [`if`](../reference/compound_stmts.html#if), [`in`](../reference/expressions.html#in), [`is`](../reference/expressions.html#is) and [`or`](../reference/expressions.html#or). In a future release it will be changed to a syntax error. ([gh-87999](https://github.com/python/cpython/issues/87999))
        
    *   Support for `__index__()` and `__int__()` method returning non-int type: these methods will be required to return an instance of a strict subclass of [`int`](../library/functions.html#int "int").
        
    *   Support for `__float__()` method returning a strict subclass of [`float`](../library/functions.html#float "float"): these methods will be required to return an instance of `float`.
        
    *   Support for `__complex__()` method returning a strict subclass of [`complex`](../library/functions.html#complex "complex"): these methods will be required to return an instance of `complex`.
        
    *   Passing a complex number as the _real_ or _imag_ argument in the [`complex()`](../library/functions.html#complex "complex") constructor is now deprecated; it should only be passed as a single positional argument. (Contributed by Serhiy Storchaka in [gh-109218](https://github.com/python/cpython/issues/109218).)
        
*   [`calendar`](../library/calendar.html#module-calendar "calendar: Functions for working with calendars, including some emulation of the Unix cal program."): `calendar.January` and `calendar.February` constants are deprecated and replaced by [`calendar.JANUARY`](../library/calendar.html#calendar.JANUARY "calendar.JANUARY") and [`calendar.FEBRUARY`](../library/calendar.html#calendar.FEBRUARY "calendar.FEBRUARY"). (Contributed by Prince Roshan in [gh-103636](https://github.com/python/cpython/issues/103636).)
    
*   [`codecs`](../library/codecs.html#module-codecs "codecs: Encode and decode data and streams."): use [`open()`](../library/functions.html#open "open") instead of [`codecs.open()`](../library/codecs.html#codecs.open "codecs.open"). ([gh-133038](https://github.com/python/cpython/issues/133038))
    
*   [`codeobject.co_lnotab`](../reference/datamodel.html#codeobject.co_lnotab "codeobject.co_lnotab"): use the [`codeobject.co_lines()`](../reference/datamodel.html#codeobject.co_lines "codeobject.co_lines") method instead.
    
*   [`datetime`](../library/datetime.html#module-datetime "datetime: Basic date and time types."):
    
    *   [`utcnow()`](../library/datetime.html#datetime.datetime.utcnow "datetime.datetime.utcnow"): use `datetime.datetime.now(tz=datetime.UTC)`.
        
    *   [`utcfromtimestamp()`](../library/datetime.html#datetime.datetime.utcfromtimestamp "datetime.datetime.utcfromtimestamp"): use `datetime.datetime.fromtimestamp(timestamp, tz=datetime.UTC)`.
        
*   [`gettext`](../library/gettext.html#module-gettext "gettext: Multilingual internationalization services."): Plural value must be an integer.
    
*   [`importlib`](../library/importlib.html#module-importlib "importlib: The implementation of the import machinery."):
    
    *   [`cache_from_source()`](../library/importlib.html#importlib.util.cache_from_source "importlib.util.cache_from_source") _debug\_override_ parameter is deprecated: use the _optimization_ parameter instead.
        
*   [`importlib.metadata`](../library/importlib.metadata.html#module-importlib.metadata "importlib.metadata: Accessing package metadata"):
    
    *   `EntryPoints` tuple interface.
        
    *   Implicit `None` on return values.
        
*   [`logging`](../library/logging.html#module-logging "logging: Flexible event logging system for applications."): the `warn()` method has been deprecated since Python 3.3, use [`warning()`](../library/logging.html#logging.warning "logging.warning") instead.
    
*   [`mailbox`](../library/mailbox.html#module-mailbox "mailbox: Manipulate mailboxes in various formats"): Use of StringIO input and text mode is deprecated, use BytesIO and binary mode instead.
    
*   [`os`](../library/os.html#module-os "os: Miscellaneous operating system interfaces."): Calling [`os.register_at_fork()`](../library/os.html#os.register_at_fork "os.register_at_fork") in multi-threaded process.
    
*   `pydoc.ErrorDuringImport`: A tuple value for _exc\_info_ parameter is deprecated, use an exception instance.
    
*   [`re`](../library/re.html#module-re "re: Regular expression operations."): More strict rules are now applied for numerical group references and group names in regular expressions. Only sequence of ASCII digits is now accepted as a numerical reference. The group name in bytes patterns and replacement strings can now only contain ASCII letters and digits and underscore. (Contributed by Serhiy Storchaka in [gh-91760](https://github.com/python/cpython/issues/91760).)
    
*   `sre_compile`, `sre_constants` and `sre_parse` modules.
    
*   [`shutil`](../library/shutil.html#module-shutil "shutil: High-level file operations, including copying."): [`rmtree()`](../library/shutil.html#shutil.rmtree "shutil.rmtree")’s _onerror_ parameter is deprecated in Python 3.12; use the _onexc_ parameter instead.
    
*   [`ssl`](../library/ssl.html#module-ssl "ssl: TLS/SSL wrapper for socket objects") options and protocols:
    
    *   [`ssl.SSLContext`](../library/ssl.html#ssl.SSLContext "ssl.SSLContext") without protocol argument is deprecated.
        
    *   [`ssl.SSLContext`](../library/ssl.html#ssl.SSLContext "ssl.SSLContext"): [`set_npn_protocols()`](../library/ssl.html#ssl.SSLContext.set_npn_protocols "ssl.SSLContext.set_npn_protocols") and `selected_npn_protocol()` are deprecated: use ALPN instead.
        
    *   `ssl.OP_NO_SSL*` options
        
    *   `ssl.OP_NO_TLS*` options
        
    *   `ssl.PROTOCOL_SSLv3`
        
    *   `ssl.PROTOCOL_TLS`
        
    *   `ssl.PROTOCOL_TLSv1`
        
    *   `ssl.PROTOCOL_TLSv1_1`
        
    *   `ssl.PROTOCOL_TLSv1_2`
        
    *   `ssl.TLSVersion.SSLv3`
        
    *   `ssl.TLSVersion.TLSv1`
        
    *   `ssl.TLSVersion.TLSv1_1`
        
*   [`threading`](../library/threading.html#module-threading "threading: Thread-based parallelism.") methods:
    
    *   `threading.Condition.notifyAll()`: use [`notify_all()`](../library/threading.html#threading.Condition.notify_all "threading.Condition.notify_all").
        
    *   `threading.Event.isSet()`: use [`is_set()`](../library/threading.html#threading.Event.is_set "threading.Event.is_set").
        
    *   `threading.Thread.isDaemon()`, [`threading.Thread.setDaemon()`](../library/threading.html#threading.Thread.setDaemon "threading.Thread.setDaemon"): use [`threading.Thread.daemon`](../library/threading.html#threading.Thread.daemon "threading.Thread.daemon") attribute.
        
    *   `threading.Thread.getName()`, [`threading.Thread.setName()`](../library/threading.html#threading.Thread.setName "threading.Thread.setName"): use [`threading.Thread.name`](../library/threading.html#threading.Thread.name "threading.Thread.name") attribute.
        
    *   `threading.currentThread()`: use [`threading.current_thread()`](../library/threading.html#threading.current_thread "threading.current_thread").
        
    *   `threading.activeCount()`: use [`threading.active_count()`](../library/threading.html#threading.active_count "threading.active_count").
        
*   [`typing.Text`](../library/typing.html#typing.Text "typing.Text") ([gh-92332](https://github.com/python/cpython/issues/92332)).
    
*   The internal class `typing._UnionGenericAlias` is no longer used to implement [`typing.Union`](../library/typing.html#typing.Union "typing.Union"). To preserve compatibility with users using this private class, a compatibility shim will be provided until at least Python 3.17. (Contributed by Jelle Zijlstra in [gh-105499](https://github.com/python/cpython/issues/105499).)
    
*   [`unittest.IsolatedAsyncioTestCase`](../library/unittest.html#unittest.IsolatedAsyncioTestCase "unittest.IsolatedAsyncioTestCase"): it is deprecated to return a value that is not `None` from a test case.
    
*   [`urllib.parse`](../library/urllib.parse.html#module-urllib.parse "urllib.parse: Parse URLs into or assemble them from components.") deprecated functions: [`urlparse()`](../library/urllib.parse.html#urllib.parse.urlparse "urllib.parse.urlparse") instead
    
    *   `splitattr()`
        
    *   `splithost()`
        
    *   `splitnport()`
        
    *   `splitpasswd()`
        
    *   `splitport()`
        
    *   `splitquery()`
        
    *   `splittag()`
        
    *   `splittype()`
        
    *   `splituser()`
        
    *   `splitvalue()`
        
    *   `to_bytes()`
        
*   [`wsgiref`](../library/wsgiref.html#module-wsgiref "wsgiref: WSGI Utilities and Reference Implementation."): `SimpleHandler.stdout.write()` should not do partial writes.
    
*   [`xml.etree.ElementTree`](../library/xml.etree.elementtree.html#module-xml.etree.ElementTree "xml.etree.ElementTree: Implementation of the ElementTree API."): Testing the truth value of an [`Element`](../library/xml.etree.elementtree.html#xml.etree.ElementTree.Element "xml.etree.ElementTree.Element") is deprecated. In a future release it will always return `True`. Prefer explicit `len(elem)` or `elem is not None` tests instead.
    
*   [`sys._clear_type_cache()`](../library/sys.html#sys._clear_type_cache "sys._clear_type_cache") is deprecated: use [`sys._clear_internal_caches()`](../library/sys.html#sys._clear_internal_caches "sys._clear_internal_caches") instead.
    

C API deprecations[¶](#c-api-deprecations "Link to this heading")
-----------------------------------------------------------------

### Pending removal in Python 3.15[¶](#id1 "Link to this heading")

*   The [`PyImport_ImportModuleNoBlock()`](../c-api/import.html#c.PyImport_ImportModuleNoBlock "PyImport_ImportModuleNoBlock"): Use [`PyImport_ImportModule()`](../c-api/import.html#c.PyImport_ImportModule "PyImport_ImportModule") instead.
    
*   [`PyWeakref_GetObject()`](../c-api/weakref.html#c.PyWeakref_GetObject "PyWeakref_GetObject") and [`PyWeakref_GET_OBJECT()`](../c-api/weakref.html#c.PyWeakref_GET_OBJECT "PyWeakref_GET_OBJECT"): Use [`PyWeakref_GetRef()`](../c-api/weakref.html#c.PyWeakref_GetRef "PyWeakref_GetRef") instead. The [pythoncapi-compat project](https://github.com/python/pythoncapi-compat/) can be used to get `PyWeakref_GetRef()` on Python 3.12 and older.
    
*   [`Py_UNICODE`](../c-api/unicode.html#c.Py_UNICODE "Py_UNICODE") type and the `Py_UNICODE_WIDE` macro: Use `wchar_t` instead.
    
*   `PyUnicode_AsDecodedObject()`: Use [`PyCodec_Decode()`](../c-api/codec.html#c.PyCodec_Decode "PyCodec_Decode") instead.
    
*   `PyUnicode_AsDecodedUnicode()`: Use [`PyCodec_Decode()`](../c-api/codec.html#c.PyCodec_Decode "PyCodec_Decode") instead; Note that some codecs (for example, “base64”) may return a type other than [`str`](../library/stdtypes.html#str "str"), such as [`bytes`](../library/stdtypes.html#bytes "bytes").
    
*   `PyUnicode_AsEncodedObject()`: Use [`PyCodec_Encode()`](../c-api/codec.html#c.PyCodec_Encode "PyCodec_Encode") instead.
    
*   `PyUnicode_AsEncodedUnicode()`: Use [`PyCodec_Encode()`](../c-api/codec.html#c.PyCodec_Encode "PyCodec_Encode") instead; Note that some codecs (for example, “base64”) may return a type other than [`bytes`](../library/stdtypes.html#bytes "bytes"), such as [`str`](../library/stdtypes.html#str "str").
    
*   Python initialization functions, deprecated in Python 3.13:
    
    *   [`Py_GetPath()`](../c-api/interp-lifecycle.html#c.Py_GetPath "Py_GetPath"): Use [`PyConfig_Get("module_search_paths")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") ([`sys.path`](../library/sys.html#sys.path "sys.path")) instead.
        
    *   [`Py_GetPrefix()`](../c-api/interp-lifecycle.html#c.Py_GetPrefix "Py_GetPrefix"): Use [`PyConfig_Get("base_prefix")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") ([`sys.base_prefix`](../library/sys.html#sys.base_prefix "sys.base_prefix")) instead. Use `PyConfig_Get("prefix")` ([`sys.prefix`](../library/sys.html#sys.prefix "sys.prefix")) if [virtual environments](../library/venv.html#venv-def) need to be handled.
        
    *   [`Py_GetExecPrefix()`](../c-api/interp-lifecycle.html#c.Py_GetExecPrefix "Py_GetExecPrefix"): Use [`PyConfig_Get("base_exec_prefix")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") ([`sys.base_exec_prefix`](../library/sys.html#sys.base_exec_prefix "sys.base_exec_prefix")) instead. Use `PyConfig_Get("exec_prefix")` ([`sys.exec_prefix`](../library/sys.html#sys.exec_prefix "sys.exec_prefix")) if [virtual environments](../library/venv.html#venv-def) need to be handled.
        
    *   [`Py_GetProgramFullPath()`](../c-api/interp-lifecycle.html#c.Py_GetProgramFullPath "Py_GetProgramFullPath"): Use [`PyConfig_Get("executable")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") ([`sys.executable`](../library/sys.html#sys.executable "sys.executable")) instead.
        
    *   [`Py_GetProgramName()`](../c-api/interp-lifecycle.html#c.Py_GetProgramName "Py_GetProgramName"): Use [`PyConfig_Get("executable")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") ([`sys.executable`](../library/sys.html#sys.executable "sys.executable")) instead.
        
    *   [`Py_GetPythonHome()`](../c-api/interp-lifecycle.html#c.Py_GetPythonHome "Py_GetPythonHome"): Use [`PyConfig_Get("home")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") or the [`PYTHONHOME`](../using/cmdline.html#envvar-PYTHONHOME) environment variable instead.
        
    
    The [pythoncapi-compat project](https://github.com/python/pythoncapi-compat/) can be used to get [`PyConfig_Get()`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") on Python 3.13 and older.
    
*   Functions to configure Python’s initialization, deprecated in Python 3.11:
    
    *   `PySys_SetArgvEx()`: Set [`PyConfig.argv`](../c-api/init_config.html#c.PyConfig.argv "PyConfig.argv") instead.
        
    *   `PySys_SetArgv()`: Set [`PyConfig.argv`](../c-api/init_config.html#c.PyConfig.argv "PyConfig.argv") instead.
        
    *   `Py_SetProgramName()`: Set [`PyConfig.program_name`](../c-api/init_config.html#c.PyConfig.program_name "PyConfig.program_name") instead.
        
    *   `Py_SetPythonHome()`: Set [`PyConfig.home`](../c-api/init_config.html#c.PyConfig.home "PyConfig.home") instead.
        
    *   [`PySys_ResetWarnOptions()`](../c-api/sys.html#c.PySys_ResetWarnOptions "PySys_ResetWarnOptions"): Clear [`sys.warnoptions`](../library/sys.html#sys.warnoptions "sys.warnoptions") and `warnings.filters` instead.
        
    
    The [`Py_InitializeFromConfig()`](../c-api/interp-lifecycle.html#c.Py_InitializeFromConfig "Py_InitializeFromConfig") API should be used with [`PyConfig`](../c-api/init_config.html#c.PyConfig "PyConfig") instead.
    
*   Global configuration variables:
    
    *   [`Py_DebugFlag`](../c-api/interp-lifecycle.html#c.Py_DebugFlag "Py_DebugFlag"): Use [`PyConfig.parser_debug`](../c-api/init_config.html#c.PyConfig.parser_debug "PyConfig.parser_debug") or [`PyConfig_Get("parser_debug")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   [`Py_VerboseFlag`](../c-api/interp-lifecycle.html#c.Py_VerboseFlag "Py_VerboseFlag"): Use [`PyConfig.verbose`](../c-api/init_config.html#c.PyConfig.verbose "PyConfig.verbose") or [`PyConfig_Get("verbose")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   [`Py_QuietFlag`](../c-api/interp-lifecycle.html#c.Py_QuietFlag "Py_QuietFlag"): Use [`PyConfig.quiet`](../c-api/init_config.html#c.PyConfig.quiet "PyConfig.quiet") or [`PyConfig_Get("quiet")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   [`Py_InteractiveFlag`](../c-api/interp-lifecycle.html#c.Py_InteractiveFlag "Py_InteractiveFlag"): Use [`PyConfig.interactive`](../c-api/init_config.html#c.PyConfig.interactive "PyConfig.interactive") or [`PyConfig_Get("interactive")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   [`Py_InspectFlag`](../c-api/interp-lifecycle.html#c.Py_InspectFlag "Py_InspectFlag"): Use [`PyConfig.inspect`](../c-api/init_config.html#c.PyConfig.inspect "PyConfig.inspect") or [`PyConfig_Get("inspect")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   [`Py_OptimizeFlag`](../c-api/interp-lifecycle.html#c.Py_OptimizeFlag "Py_OptimizeFlag"): Use [`PyConfig.optimization_level`](../c-api/init_config.html#c.PyConfig.optimization_level "PyConfig.optimization_level") or [`PyConfig_Get("optimization_level")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   [`Py_NoSiteFlag`](../c-api/interp-lifecycle.html#c.Py_NoSiteFlag "Py_NoSiteFlag"): Use [`PyConfig.site_import`](../c-api/init_config.html#c.PyConfig.site_import "PyConfig.site_import") or [`PyConfig_Get("site_import")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   [`Py_BytesWarningFlag`](../c-api/interp-lifecycle.html#c.Py_BytesWarningFlag "Py_BytesWarningFlag"): Use [`PyConfig.bytes_warning`](../c-api/init_config.html#c.PyConfig.bytes_warning "PyConfig.bytes_warning") or [`PyConfig_Get("bytes_warning")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   [`Py_FrozenFlag`](../c-api/interp-lifecycle.html#c.Py_FrozenFlag "Py_FrozenFlag"): Use [`PyConfig.pathconfig_warnings`](../c-api/init_config.html#c.PyConfig.pathconfig_warnings "PyConfig.pathconfig_warnings") or [`PyConfig_Get("pathconfig_warnings")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   [`Py_IgnoreEnvironmentFlag`](../c-api/interp-lifecycle.html#c.Py_IgnoreEnvironmentFlag "Py_IgnoreEnvironmentFlag"): Use [`PyConfig.use_environment`](../c-api/init_config.html#c.PyConfig.use_environment "PyConfig.use_environment") or [`PyConfig_Get("use_environment")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   [`Py_DontWriteBytecodeFlag`](../c-api/interp-lifecycle.html#c.Py_DontWriteBytecodeFlag "Py_DontWriteBytecodeFlag"): Use [`PyConfig.write_bytecode`](../c-api/init_config.html#c.PyConfig.write_bytecode "PyConfig.write_bytecode") or [`PyConfig_Get("write_bytecode")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   [`Py_NoUserSiteDirectory`](../c-api/interp-lifecycle.html#c.Py_NoUserSiteDirectory "Py_NoUserSiteDirectory"): Use [`PyConfig.user_site_directory`](../c-api/init_config.html#c.PyConfig.user_site_directory "PyConfig.user_site_directory") or [`PyConfig_Get("user_site_directory")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   [`Py_UnbufferedStdioFlag`](../c-api/interp-lifecycle.html#c.Py_UnbufferedStdioFlag "Py_UnbufferedStdioFlag"): Use [`PyConfig.buffered_stdio`](../c-api/init_config.html#c.PyConfig.buffered_stdio "PyConfig.buffered_stdio") or [`PyConfig_Get("buffered_stdio")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   [`Py_HashRandomizationFlag`](../c-api/interp-lifecycle.html#c.Py_HashRandomizationFlag "Py_HashRandomizationFlag"): Use [`PyConfig.use_hash_seed`](../c-api/init_config.html#c.PyConfig.use_hash_seed "PyConfig.use_hash_seed") and [`PyConfig.hash_seed`](../c-api/init_config.html#c.PyConfig.hash_seed "PyConfig.hash_seed") or [`PyConfig_Get("hash_seed")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   [`Py_IsolatedFlag`](../c-api/interp-lifecycle.html#c.Py_IsolatedFlag "Py_IsolatedFlag"): Use [`PyConfig.isolated`](../c-api/init_config.html#c.PyConfig.isolated "PyConfig.isolated") or [`PyConfig_Get("isolated")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   [`Py_LegacyWindowsFSEncodingFlag`](../c-api/interp-lifecycle.html#c.Py_LegacyWindowsFSEncodingFlag "Py_LegacyWindowsFSEncodingFlag"): Use [`PyPreConfig.legacy_windows_fs_encoding`](../c-api/init_config.html#c.PyPreConfig.legacy_windows_fs_encoding "PyPreConfig.legacy_windows_fs_encoding") or [`PyConfig_Get("legacy_windows_fs_encoding")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   [`Py_LegacyWindowsStdioFlag`](../c-api/interp-lifecycle.html#c.Py_LegacyWindowsStdioFlag "Py_LegacyWindowsStdioFlag"): Use [`PyConfig.legacy_windows_stdio`](../c-api/init_config.html#c.PyConfig.legacy_windows_stdio "PyConfig.legacy_windows_stdio") or [`PyConfig_Get("legacy_windows_stdio")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   `Py_FileSystemDefaultEncoding`, `Py_HasFileSystemDefaultEncoding`: Use [`PyConfig.filesystem_encoding`](../c-api/init_config.html#c.PyConfig.filesystem_encoding "PyConfig.filesystem_encoding") or [`PyConfig_Get("filesystem_encoding")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   `Py_FileSystemDefaultEncodeErrors`: Use [`PyConfig.filesystem_errors`](../c-api/init_config.html#c.PyConfig.filesystem_errors "PyConfig.filesystem_errors") or [`PyConfig_Get("filesystem_errors")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead.
        
    *   `Py_UTF8Mode`: Use [`PyPreConfig.utf8_mode`](../c-api/init_config.html#c.PyPreConfig.utf8_mode "PyPreConfig.utf8_mode") or [`PyConfig_Get("utf8_mode")`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") instead. (see [`Py_PreInitialize()`](../c-api/init_config.html#c.Py_PreInitialize "Py_PreInitialize"))
        
    
    The [`Py_InitializeFromConfig()`](../c-api/interp-lifecycle.html#c.Py_InitializeFromConfig "Py_InitializeFromConfig") API should be used with [`PyConfig`](../c-api/init_config.html#c.PyConfig "PyConfig") to set these options. Or [`PyConfig_Get()`](../c-api/init_config.html#c.PyConfig_Get "PyConfig_Get") can be used to get these options at runtime.
    

### Pending removal in Python 3.18[¶](#id2 "Link to this heading")

*   The following private functions are deprecated and planned for removal in Python 3.18:
    
    *   `_PyBytes_Join()`: use [`PyBytes_Join()`](../c-api/bytes.html#c.PyBytes_Join "PyBytes_Join").
        
    *   `_PyDict_GetItemStringWithError()`: use [`PyDict_GetItemStringRef()`](../c-api/dict.html#c.PyDict_GetItemStringRef "PyDict_GetItemStringRef").
        
    *   `_PyDict_Pop()`: use [`PyDict_Pop()`](../c-api/dict.html#c.PyDict_Pop "PyDict_Pop").
        
    *   `_PyLong_Sign()`: use [`PyLong_GetSign()`](../c-api/long.html#c.PyLong_GetSign "PyLong_GetSign").
        
    *   `_PyLong_FromDigits()` and `_PyLong_New()`: use [`PyLongWriter_Create()`](../c-api/long.html#c.PyLongWriter_Create "PyLongWriter_Create").
        
    *   `_PyThreadState_UncheckedGet()`: use [`PyThreadState_GetUnchecked()`](../c-api/threads.html#c.PyThreadState_GetUnchecked "PyThreadState_GetUnchecked").
        
    *   `_PyUnicode_AsString()`: use [`PyUnicode_AsUTF8()`](../c-api/unicode.html#c.PyUnicode_AsUTF8 "PyUnicode_AsUTF8").
        
    *   `_PyUnicodeWriter_Init()`: replace `_PyUnicodeWriter_Init(&writer)` with [`writer = PyUnicodeWriter_Create(0)`](../c-api/unicode.html#c.PyUnicodeWriter_Create "PyUnicodeWriter_Create").
        
    *   `_PyUnicodeWriter_Finish()`: replace `_PyUnicodeWriter_Finish(&writer)` with [`PyUnicodeWriter_Finish(writer)`](../c-api/unicode.html#c.PyUnicodeWriter_Finish "PyUnicodeWriter_Finish").
        
    *   `_PyUnicodeWriter_Dealloc()`: replace `_PyUnicodeWriter_Dealloc(&writer)` with [`PyUnicodeWriter_Discard(writer)`](../c-api/unicode.html#c.PyUnicodeWriter_Discard "PyUnicodeWriter_Discard").
        
    *   `_PyUnicodeWriter_WriteChar()`: replace `_PyUnicodeWriter_WriteChar(&writer, ch)` with [`PyUnicodeWriter_WriteChar(writer, ch)`](../c-api/unicode.html#c.PyUnicodeWriter_WriteChar "PyUnicodeWriter_WriteChar").
        
    *   `_PyUnicodeWriter_WriteStr()`: replace `_PyUnicodeWriter_WriteStr(&writer, str)` with [`PyUnicodeWriter_WriteStr(writer, str)`](../c-api/unicode.html#c.PyUnicodeWriter_WriteStr "PyUnicodeWriter_WriteStr").
        
    *   `_PyUnicodeWriter_WriteSubstring()`: replace `_PyUnicodeWriter_WriteSubstring(&writer, str, start, end)` with [`PyUnicodeWriter_WriteSubstring(writer, str, start, end)`](../c-api/unicode.html#c.PyUnicodeWriter_WriteSubstring "PyUnicodeWriter_WriteSubstring").
        
    *   `_PyUnicodeWriter_WriteASCIIString()`: replace `_PyUnicodeWriter_WriteASCIIString(&writer, str)` with [`PyUnicodeWriter_WriteASCII(writer, str)`](../c-api/unicode.html#c.PyUnicodeWriter_WriteASCII "PyUnicodeWriter_WriteASCII").
        
    *   `_PyUnicodeWriter_WriteLatin1String()`: replace `_PyUnicodeWriter_WriteLatin1String(&writer, str)` with [`PyUnicodeWriter_WriteUTF8(writer, str)`](../c-api/unicode.html#c.PyUnicodeWriter_WriteUTF8 "PyUnicodeWriter_WriteUTF8").
        
    *   `_PyUnicodeWriter_Prepare()`: (no replacement).
        
    *   `_PyUnicodeWriter_PrepareKind()`: (no replacement).
        
    *   `_Py_HashPointer()`: use [`Py_HashPointer()`](../c-api/hash.html#c.Py_HashPointer "Py_HashPointer").
        
    *   `_Py_fopen_obj()`: use [`Py_fopen()`](../c-api/sys.html#c.Py_fopen "Py_fopen").
        
    
    The [pythoncapi-compat project](https://github.com/python/pythoncapi-compat/) can be used to get these new public functions on Python 3.13 and older. (Contributed by Victor Stinner in [gh-128863](https://github.com/python/cpython/issues/128863).)
    

### Pending removal in future versions[¶](#id3 "Link to this heading")

The following APIs are deprecated and will be removed, although there is currently no date scheduled for their removal.

*   [`Py_TPFLAGS_HAVE_FINALIZE`](../c-api/typeobj.html#c.Py_TPFLAGS_HAVE_FINALIZE "Py_TPFLAGS_HAVE_FINALIZE"): Unneeded since Python 3.8.
    
*   [`PyErr_Fetch()`](../c-api/exceptions.html#c.PyErr_Fetch "PyErr_Fetch"): Use [`PyErr_GetRaisedException()`](../c-api/exceptions.html#c.PyErr_GetRaisedException "PyErr_GetRaisedException") instead.
    
*   [`PyErr_NormalizeException()`](../c-api/exceptions.html#c.PyErr_NormalizeException "PyErr_NormalizeException"): Use [`PyErr_GetRaisedException()`](../c-api/exceptions.html#c.PyErr_GetRaisedException "PyErr_GetRaisedException") instead.
    
*   [`PyErr_Restore()`](../c-api/exceptions.html#c.PyErr_Restore "PyErr_Restore"): Use [`PyErr_SetRaisedException()`](../c-api/exceptions.html#c.PyErr_SetRaisedException "PyErr_SetRaisedException") instead.
    
*   [`PyModule_GetFilename()`](../c-api/module.html#c.PyModule_GetFilename "PyModule_GetFilename"): Use [`PyModule_GetFilenameObject()`](../c-api/module.html#c.PyModule_GetFilenameObject "PyModule_GetFilenameObject") instead.
    
*   [`PyOS_AfterFork()`](../c-api/sys.html#c.PyOS_AfterFork "PyOS_AfterFork"): Use [`PyOS_AfterFork_Child()`](../c-api/sys.html#c.PyOS_AfterFork_Child "PyOS_AfterFork_Child") instead.
    
*   [`PySlice_GetIndicesEx()`](../c-api/slice.html#c.PySlice_GetIndicesEx "PySlice_GetIndicesEx"): Use [`PySlice_Unpack()`](../c-api/slice.html#c.PySlice_Unpack "PySlice_Unpack") and [`PySlice_AdjustIndices()`](../c-api/slice.html#c.PySlice_AdjustIndices "PySlice_AdjustIndices") instead.
    
*   [`PyUnicode_READY()`](../c-api/unicode.html#c.PyUnicode_READY "PyUnicode_READY"): Unneeded since Python 3.12
    
*   `PyErr_Display()`: Use [`PyErr_DisplayException()`](../c-api/exceptions.html#c.PyErr_DisplayException "PyErr_DisplayException") instead.
    
*   `_PyErr_ChainExceptions()`: Use `_PyErr_ChainExceptions1()` instead.
    
*   `PyBytesObject.ob_shash` member: call [`PyObject_Hash()`](../c-api/object.html#c.PyObject_Hash "PyObject_Hash") instead.
    
*   Thread Local Storage (TLS) API:
    
    *   [`PyThread_create_key()`](../c-api/tls.html#c.PyThread_create_key "PyThread_create_key"): Use [`PyThread_tss_alloc()`](../c-api/tls.html#c.PyThread_tss_alloc "PyThread_tss_alloc") instead.
        
    *   [`PyThread_delete_key()`](../c-api/tls.html#c.PyThread_delete_key "PyThread_delete_key"): Use [`PyThread_tss_free()`](../c-api/tls.html#c.PyThread_tss_free "PyThread_tss_free") instead.
        
    *   [`PyThread_set_key_value()`](../c-api/tls.html#c.PyThread_set_key_value "PyThread_set_key_value"): Use [`PyThread_tss_set()`](../c-api/tls.html#c.PyThread_tss_set "PyThread_tss_set") instead.
        
    *   [`PyThread_get_key_value()`](../c-api/tls.html#c.PyThread_get_key_value "PyThread_get_key_value"): Use [`PyThread_tss_get()`](../c-api/tls.html#c.PyThread_tss_get "PyThread_tss_get") instead.
        
    *   [`PyThread_delete_key_value()`](../c-api/tls.html#c.PyThread_delete_key_value "PyThread_delete_key_value"): Use [`PyThread_tss_delete()`](../c-api/tls.html#c.PyThread_tss_delete "PyThread_tss_delete") instead.
        
    *   [`PyThread_ReInitTLS()`](../c-api/tls.html#c.PyThread_ReInitTLS "PyThread_ReInitTLS"): Unneeded since Python 3.7.
        

### [Table of Contents](../contents.html)

*   [Deprecations](#)
    *   [Pending removal in Python 3.15](#pending-removal-in-python-3-15)
    *   [Pending removal in Python 3.16](#pending-removal-in-python-3-16)
    *   [Pending removal in Python 3.17](#pending-removal-in-python-3-17)
    *   [Pending removal in Python 3.18](#pending-removal-in-python-3-18)
    *   [Pending removal in Python 3.19](#pending-removal-in-python-3-19)
    *   [Pending removal in future versions](#pending-removal-in-future-versions)
    *   [C API deprecations](#c-api-deprecations)
        *   [Pending removal in Python 3.15](#id1)
        *   [Pending removal in Python 3.18](#id2)
        *   [Pending removal in future versions](#id3)

#### Previous topic

[“Why is Python Installed on my Computer?” FAQ](../faq/installed.html "previous chapter")

#### Next topic

[Glossary](../glossary.html "next chapter")

### This page

*   [Report a bug](../bugs.html)
*   [Improve this page](https://docs.python.org/3/improve-page.html?pagetitle=Deprecations&pageurl=https%3A%2F%2Fdocs.python.org%2F3%2Fdeprecations%2Findex.html&pagesource=deprecations%2Findex.rst)
*   [Show source](https://github.com/python/cpython/blob/main/Doc/deprecations/index.rst?plain=1)

«

### Navigation

*   [index](../genindex.html "General Index")
*   [modules](../py-modindex.html "Python Module Index") |
*   [next](../glossary.html "Glossary") |
*   [previous](../faq/installed.html "“Why is Python Installed on my Computer?” FAQ") |
*   ![Python logo](../_static/py.svg)
*   [Python](https://www.python.org/) »
*   Greek | ΕλληνικάEnglishSpanish | españolFrench | françaisItalian | italianoJapanese | 日本語Korean | 한국어Polish | polskiBrazilian Portuguese | Português brasileiroRomanian | RomâneșteTurkish | TürkçeSimplified Chinese | 简体中文Traditional Chinese | 繁體中文
    
    dev (3.16)pre (3.15)3.14.5rc13.133.123.113.103.93.83.73.63.53.43.33.23.13.02.72.6
    

*   [3.14.5rc1 Documentation](../index.html) »
*   Deprecations
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