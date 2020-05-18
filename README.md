# babel-plugin-django-gettext

This plugin simplifies gettext-based localization in your
[Django](https://www.djangoproject.com/)-backed JavaScript codebases, giving
you the ability to use word wrapping, template literals, and string
interpolation, avoiding the mess of overly-long strings and sprinkled
`interpolate()` calls.


## Installation

```
$ npm install babel babel-plugin-django-gettext
$ babel --plugins django-gettext script.js
```


## Usage

There are two ways to work with this enhanced gettext support:

1. You can call functions (like `_(...)`, `gettext(...)`, `ngettext(...)`,
   etc.) and pass in strings or template literals, as you did before, like:

    ```javascript
    const str = _('Ready to have fun?');
    ```

2. You can use tagged templates, which looks cooler. See?

    ```javascript
    const str = _`Ready to have fun?`;
    ```

In either case, you'll get automatic interpolation and controlled whitespace
support for free. We'll go over that in a minute.


### Gettext functions

First, let's cover all the gettext functions that can be directly called:

* `_` (alias for `gettext`)
* `N_` (alias for `ngettext`)
* `gettext`
* `gettext_raw`
* `gettext_noop`
* `gettext_noop_raw`
* `ngettext`
* `ngettext_raw`
* `pgettext`
* `pgettext_raw`
* `npgettext`
* `npgettext_raw`

And here's what you can use for a tagged template literal:

* `_` (alias for `gettext`)
* `N_` (alias for `ngettext`)
* `gettext`
* `gettext_raw`
* `gettext_noop`
* `gettext_noop_raw`


### Whitespace Rules

The `_raw` versions will preserve any and all whitespace. For example:

```javascript
// So  this:
const str = gettext_raw('   This  has  some\n    whitespace\n    going on ');

// Or   maybe   this:
const str = gettext_raw(`   This  has  some
    whitespace
    going on `);

// Turns    into:
const str = gettext("   This  has  some\n    whitespace\n    going on ");
```

Pretty obvious. Works the way you're used to today.

The non-raw versions will collapse down whitespace and trim all leading and
trailing whitespace:

```javascript
// So  this:
const str = gettext('   This  has  some\n    whitespace\n    going on ');

// Or   maybe   this:
const str = gettext(`   This  has  some
    whitespace
    going on `);

// Turns into:
const str = gettext("This has some whitespace going on");
```

Much cleaner, and probably want you usually want in your message files.

The non-raw versions make it really easy to carefully compose your message
across multiple lines without affecting the resulting string. The raw versions
are there if that whitespace matters.


### Automatic Interpolation

Whenever you use a template literal containing referenced variables or
expressions, an `interpolate(...)` call will be made for you.

For example:

```javascript
const subject = 'world';

// These are equivalent:
const str = _`Hello ${subject}!`;
const str = gettext(`Hello ${subject}!`);

// That becomes:
var subject = 'world';
var str = interpolate(gettext("Hello %(subject)s!"),
                      {subject: subject},
                      true);
```

This even works for `ngettext()` calls:

```javascript
const count = 2;
const str = ngettext(`The button was only clicked ${count} time!`,
                     `The button was clicked ${count} times!`,
                     count);

// That becomes:
var count = 4;
var str = interpolate(ngettext("The button was only clicked %(count)s time!",
                               "The button was clicked %(count)s times!",
                               count),
                      {count: count},
                      true);
```

For everything but the `ngettext`/`pngettext` variants, you can also
use expressions:

```javascript
const count = 4;
const str = _`There are ${count + 1} lights!`;

// Giving us:
var count = 4;
var str = interpolate(gettext("There are %(value1)s lights!"),
                      {value1: count + 1},
                      true);
```


### Works With Other Tagged Templates

Fan of the [dedent](https://www.npmjs.com/package/babel-plugin-dedent)
tagged template plugin? Combine it with any of the raw gettext functions,
like so:

```javascript
const n = 4;
const str = gettext_raw(dedent`
    Here we've got lots of text, which may have
    newlines and
        ${n} space indentation
`);


// That becomes:
var n = 4;
var str = interpolate(
    gettext("Here we've got lots of text, which may have\nnewlines and\n    %(n)s space indentation"),
    {n: n},
    true);
```

Isn't that much nicer to maintain?

It's not just that one, either. Most tagged templates should be compatible
(as long as they don't need to manage their own expressions/variable references,
because this plugin will be preparing them for interpolation first).


# Examples

Let's cover just a few more real-world examples, using the most common
gettext methods:


## `_`, `gettext`

```javascript
// These are all equivalent:
const s = _`Let's localize!`;
const s = _`
      Let's  localize!
    `;
const s = _(`Let's localize!`);
const s = _("Let's localize!");
const s = gettext`Let's localize!`;
const s = gettext(`Let's localize!`);
const s = gettext("Let's localize!");

// So are these:
const s = _`i = ${i}`;
const s = _(`i = ${i}`);
const s = gettext`i = ${i}`;
const s = gettext(`i = ${i}`);
const s = interpolate(gettext("i = %(i)s"), {i: i}, true);
```


## `gettext_raw`

```javascript
// These are all equivalent:
const s = gettext_raw`  Let's
  localize!`;
const s = gettext_raw("  Let's\n  localize!");

// So are these:
const s = gettext_raw`  i  =  ${i}
`;
const s = gettext_raw("  i  =  ${i}\n");
const s = interpolate(gettext_raw("  i  =  %(i)s\n"),
                      {i: i},
                      true);
```


## `N_`, `ngettext`

```javascript
// These are all equivalent:
const s = N_('There is only one',
             'There are many',
             count);
const s = ngettext('There is only one',
                   'There are many',
                   count);

// So are these:
const s = N_(`There is only ${i}`,
             `There are ${i}`,
             count);
const s = ngettext(`There is only ${i}`,
                   `There are ${i}`,
                   count);
const s = interpolate(ngettext("There is only %(i)s",
                               "There are %(i)s",
                               count),
                      {i: i},
                      true);
```


# Where is this used?

We use `babel-plugin-django-gettext` at [Beanbag](http://www.beanbaginc.com/)
for our [Review Board](http://www.reviewboard.org/) and
[RBCommons](https://rbcommons.com/) products, along with many of our other
[open source projects](https://www.beanbaginc.com/opensource/).

If you use this plugin, let us know and we'll add your project to this section!


# License

Copyright (C) 2020 Beanbag, Inc. Released under the MIT license.
