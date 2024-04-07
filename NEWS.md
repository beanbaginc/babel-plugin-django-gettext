# Releases

## Version 1.2.1 (7-April-2024)

* Fixed a packaging issue with 1.2.0.


## Version 1.2 (1-April-2024)

* Added type hints for TypeScript.

  Consuming projects will want to include the following line in a
  `global.d.ts` file:

  ```typescript
  /// <reference types="babel-plugin-django-gettext"/>
  ```

* Added typing compatibility when used in the same project as Underscore.js.


## Version 1.1.1 (9-June-2020)

* Fixed a packaging issue with 1.1.0.


## Version 1.1 (9-June-2020)

* Fixed `ngettext` and variants when using different sets of interpolated
  variables in format strings.

* Added support for using tagged templates as string arguments to all `gettext`
  functions.

* Whitespace normalization in tagged templates now preserves paragraphs,
  separated by one or more blank lines.


## Version 1.0 (10-April-2020)

* Initial public release
