function gettext(s) {
    return `##gettext##${s}`;
}

function gettext_noop(s) {
    return `##gettext_noop##${s}`;
}

function ngettext(singular, plural, count) {
    if (count === 1) {
        return `##ngettext##${singular}`;
    } else {
        return `##ngettext##${plural}`;
    }
}

function pgettext(context, s) {
    return `##pgettext##${context}##${s}`;
}

function npgettext(context, singular, plural, count) {
    if (count === 1) {
        return `##npgettext##${context}##${singular}`;
    } else {
        return `##npgettext##${context}##${plural}`;
    }
}


/* This is the same logic and matching as interpolate from Django. */
function interpolate(fmt, obj, named) {
    if (named) {
        return fmt.replace(/%\(\w+\)s/g,
                           match => String(obj[match.slice(2, -2)]));
    } else {
        return fmt.replace(/%s/g, m => String(obj.shift()));
    }
}


describe('Calls', function() {
    describe('_', function() {
        it('Ignored by plugin', function() {
            function _(s) {
                return `##ignored##${s}`;
            }

            expect(_('this is a test')).toEqual('##ignored##this is a test');
        });
    });

    describe('gettext', function() {
        it('String literal', function() {
            expect(gettext('\n\nthis is a    test\n\n'))
                .toEqual('##gettext##this is a test');
        });

        it('Template literal', function() {
            expect(gettext(`

                this is a
                test

                `)
            ).toEqual('##gettext##this is a test');
        });

        it('Template literal with interpolation', function() {
            const greeting = 'hello';
            const subject = 'world';

            expect(
                gettext(`

                Oh,
                ${greeting} ${subject + "!"}

                `)
            ).toEqual('##gettext##Oh, hello world!');
        });
    });

    describe('gettext_raw', function() {
        it('String literal', function() {
            expect(gettext_raw('\n\nthis is a    test\n\n'))
                .toEqual('##gettext##\n\nthis is a    test\n\n');
        });

        it('Template literal', function() {
            expect(gettext_raw(`

                this is a
                test

                `)
            ).toEqual(
                `##gettext##

                this is a
                test

                `
            );
        });

        it('Template literal with interpolation', function() {
            const greeting = 'hello';
            const subject = 'world';

            expect(
                gettext_raw(`

                Oh,
                ${greeting} ${subject + "!"}

                `)
            ).toEqual(
                `##gettext##

                Oh,
                hello world!

                `
            );
        });
    });

    describe('gettext_noop', function() {
        it('String literal', function() {
            expect(gettext_noop('\n\nthis is a    test\n\n'))
                .toEqual('##gettext_noop##this is a test');
        });

        it('Template literal', function() {
            expect(gettext_noop(`

                this is a
                test

                `)
            ).toEqual('##gettext_noop##this is a test');
        });

        it('Template literal with interpolation', function() {
            const greeting = 'hello';
            const subject = 'world';

            expect(
                gettext_noop(`

                Oh,
                ${greeting} ${subject + "!"}

                `)
            ).toEqual('##gettext_noop##Oh, hello world!');
        });
    });

    describe('gettext_noop_raw', function() {
        it('String literal', function() {
            expect(gettext_noop_raw('\n\nthis is a    test\n\n'))
                .toEqual('##gettext_noop##\n\nthis is a    test\n\n');
        });

        it('Template literal', function() {
            expect(gettext_noop_raw(`

                this is a
                test

                `)
            ).toEqual(
                `##gettext_noop##

                this is a
                test

                `
            );
        });

        it('Template literal with interpolation', function() {
            const greeting = 'hello';
            const subject = 'world';

            expect(
                gettext_noop_raw(`

                Oh,
                ${greeting} ${subject + "!"}

                `)
            ).toEqual(
                `##gettext_noop##

                Oh,
                hello world!

                `
            );
        });
    });

    describe('N_', function() {
        it('String literals', function() {
            expect(
                N_('\n\nthere is a single\nvalue \n\n',
                   '\nthere are many\nvalues \n',
                   1)
            ).toEqual('##ngettext##there is a single value');

            expect(
                interpolate(N_('\n\nthere is %(count)s\nvalue \n\n',
                               '\nthere are %(count)s\nvalues \n',
                               2),
                            {'count': 2},
                            true)
            ).toEqual('##ngettext##there are 2 values');
        });

        it('Template literal', function() {
            expect(
                N_(
                    `

                    there is a single
                    value

                    `,
                    `

                    there are many
                    values

                    `,
                    1)
            ).toEqual('##ngettext##there is a single value');

            expect(
                interpolate(
                    N_(
                        `

                        there is %(count)s
                        value

                        `,
                        `

                        there are %(count)s
                        values

                        `,
                        2),
                    {'count': 2},
                    true)
            ).toEqual('##ngettext##there are 2 values');
        });

        it('Template literal with interpolation', function() {
            const count = 1;

            expect(
                N_(
                    `

                    there is ${count}
                    value

                    `,
                    `

                    there are ${count}
                    values

                    `,
                    count)
            ).toEqual('##ngettext##there is 1 value');
        });
    });

    describe('ngettext', function() {
        it('String literals', function() {
            expect(
                ngettext('\n\nthere is a single\nvalue \n\n',
                         '\nthere are many\nvalues \n',
                         1)
            ).toEqual('##ngettext##there is a single value');

            expect(
                interpolate(ngettext('\n\nthere is %(count)s\nvalue \n\n',
                                     '\nthere are %(count)s\nvalues \n',
                                     2),
                            {'count': 2},
                            true)
            ).toEqual('##ngettext##there are 2 values');
        });

        it('Template literal', function() {
            expect(
                ngettext(
                    `

                    there is a single
                    value

                    `,
                    `

                    there are many
                    values

                    `,
                    1)
            ).toEqual('##ngettext##there is a single value');

            expect(
                interpolate(
                    ngettext(
                        `

                        there is %(count)s
                        value

                        `,
                        `

                        there are %(count)s
                        values

                        `,
                        2),
                    {'count': 2},
                    true)
            ).toEqual('##ngettext##there are 2 values');
        });

        it('Template literal with interpolation', function() {
            const count = 1;

            expect(
                ngettext(
                    `

                    there is ${count}
                    value

                    `,
                    `

                    there are ${count}
                    values

                    `,
                    count)
            ).toEqual('##ngettext##there is 1 value');
        });
    });

    describe('ngettext_raw', function() {
        it('String literals', function() {
            expect(
                ngettext_raw('\n\nthere is a single\nvalue \n\n',
                             '\nthere are many\nvalues \n',
                             1)
            ).toEqual('##ngettext##\n\nthere is a single\nvalue \n\n');

            expect(
                interpolate(ngettext_raw('\n\nthere is %(count)s\nvalue \n\n',
                                         '\nthere are %(count)s\nvalues \n',
                                         2),
                            {'count': 2},
                            true)
            ).toEqual('##ngettext##\nthere are 2\nvalues \n');
        });

        it('Template literal', function() {
            expect(
                ngettext_raw(
                    `

                    there is a single
                    value

                    `,
                    `

                    there are many
                    values

                    `,
                    1)
            ).toEqual(`##ngettext##

                    there is a single
                    value

                    `
            );

            expect(
                interpolate(
                    ngettext_raw(
                        `

                        there is %(count)s
                        value

                        `,
                        `

                        there are %(count)s
                        values

                        `,
                        2),
                    {'count': 2},
                    true)
            ).toEqual(`##ngettext##

                        there are 2
                        values

                        `
            );
        });

        it('Template literal with interpolation', function() {
            const count = 2;

            expect(
                ngettext_raw(
                    `

                    there is ${count}
                    value

                    `,
                    `

                    there are ${count}
                    values

                    `,
                    count)
            ).toEqual(
                    `##ngettext##

                    there are 2
                    values

                    `
            );
        });
    });

    describe('pgettext', function() {
        it('String literal', function() {
            expect(pgettext('mycontext', '\n\nthis is a    test\n\n'))
                .toEqual('##pgettext##mycontext##this is a test');
        });

        it('Template literal', function() {
            expect(pgettext('mycontext', `

                this is a
                test

                `)
            ).toEqual('##pgettext##mycontext##this is a test');
        });

        it('Template literal with interpolation', function() {
            const greeting = 'hello';
            const subject = 'world';

            expect(
                pgettext('mycontext', `

                Oh,
                ${greeting} ${subject + "!"}

                `)
            ).toEqual('##pgettext##mycontext##Oh, hello world!');
        });
    });

    describe('pgettext_raw', function() {
        it('String literal', function() {
            expect(pgettext_raw('mycontext', '\n\nthis is a    test\n\n'))
                .toEqual('##pgettext##mycontext##\n\nthis is a    test\n\n');
        });

        it('Template literal', function() {
            expect(pgettext_raw('mycontext', `

                this is a
                test

                `)
            ).toEqual(
                `##pgettext##mycontext##

                this is a
                test

                `
            );
        });

        it('Template literal with interpolation', function() {
            const greeting = 'hello';
            const subject = 'world';

            expect(
                pgettext_raw('mycontext', `

                Oh,
                ${greeting} ${subject + "!"}

                `)
            ).toEqual(
                `##pgettext##mycontext##

                Oh,
                hello world!

                `
            );
        });
    });

    describe('npgettext', function() {
        it('String literals', function() {
            expect(
                npgettext('mycontext',
                          '\n\nthere is a single\nvalue \n\n',
                          '\nthere are many\nvalues \n',
                          1)
            ).toEqual('##npgettext##mycontext##there is a single value');

            expect(
                interpolate(npgettext('mycontext',
                                      '\n\nthere is %(count)s\nvalue \n\n',
                                      '\nthere are %(count)s\nvalues \n',
                                      2),
                            {'count': 2},
                            true)
            ).toEqual('##npgettext##mycontext##there are 2 values');
        });

        it('Template literal', function() {
            expect(
                npgettext(
                    'mycontext',
                    `

                    there is a single
                    value

                    `,
                    `

                    there are many
                    values

                    `,
                    1)
            ).toEqual('##npgettext##mycontext##there is a single value');

            expect(
                interpolate(
                    npgettext(
                        'mycontext',
                        `

                        there is %(count)s
                        value

                        `,
                        `

                        there are %(count)s
                        values

                        `,
                        2),
                    {'count': 2},
                    true)
            ).toEqual('##npgettext##mycontext##there are 2 values');
        });

        it('Template literal with interpolation', function() {
            const count = 1;

            expect(
                npgettext(
                    'mycontext',
                    `

                    there is ${count}
                    value

                    `,
                    `

                    there are ${count}
                    values

                    `,
                    count)
            ).toEqual('##npgettext##mycontext##there is 1 value');
        });
    });

    describe('npgettext_raw', function() {
        it('String literals', function() {
            expect(
                npgettext_raw('mycontext',
                              '\n\nthere is a single\nvalue \n\n',
                              '\nthere are many\nvalues \n',
                              1)
            ).toEqual(
                '##npgettext##mycontext##\n\nthere is a single\nvalue \n\n'
            );

            expect(
                interpolate(npgettext_raw('mycontext',
                                          '\n\nthere is %(count)s\nvalue \n\n',
                                          '\nthere are %(count)s\nvalues \n',
                                          2),
                            {'count': 2},
                            true)
            ).toEqual('##npgettext##mycontext##\nthere are 2\nvalues \n');
        });

        it('Template literal', function() {
            expect(
                npgettext_raw(
                    'mycontext',
                    `

                    there is a single
                    value

                    `,
                    `

                    there are many
                    values

                    `,
                    1)
            ).toEqual(`##npgettext##mycontext##

                    there is a single
                    value

                    `
            );

            expect(
                interpolate(
                    npgettext_raw(
                        'mycontext',
                        `

                        there is %(count)s
                        value

                        `,
                        `

                        there are %(count)s
                        values

                        `,
                        2),
                    {'count': 2},
                    true)
            ).toEqual(`##npgettext##mycontext##

                        there are 2
                        values

                        `
            );
        });

        it('Template literal with interpolation', function() {
            const count = 2;

            expect(
                npgettext_raw(
                    'mycontext',
                    `

                    there is ${count}
                    value

                    `,
                    `

                    there are ${count}
                    values

                    `,
                    count)
            ).toEqual(
                    `##npgettext##mycontext##

                    there are 2
                    values

                    `
            );
        });
    });
});

describe('Tagged template literals', function() {
    describe('_', function() {
        it('Plain text', function() {
            expect(
                _`

                this is a
                test

                `
            ).toEqual('##gettext##this is a test');
        });

        it('Interpolation', function() {
            const greeting = 'hello';
            const subject = 'world';

            expect(
                _`

                Oh,
                ${greeting} ${subject + "!"}

                `
            ).toEqual('##gettext##Oh, hello world!');
        });
    });

    describe('gettext', function() {
        it('Plain text', function() {
            expect(
                gettext`

                this is a
                test

                `
            ).toEqual('##gettext##this is a test');
        });

        it('Interpolation', function() {
            const greeting = 'hello';
            const subject = 'world';

            expect(
                gettext`

                Oh,
                ${greeting} ${subject + "!"}

                `
            ).toEqual('##gettext##Oh, hello world!');
        });
    });

    describe('gettext_raw', function() {
        it('Plain text', function() {
            expect(
                gettext_raw`

                this is a
                test

                `
            ).toEqual(
                `##gettext##

                this is a
                test

                `
            );
        });

        it('Interpolation', function() {
            const greeting = 'hello';
            const subject = 'world';

            expect(
                gettext_raw`

                Oh,
                ${greeting} ${subject + "!"}

                `
            ).toEqual(
                `##gettext##

                Oh,
                hello world!

                `
            );
        });
    });

    describe('gettext_noop', function() {
        it('Plain text', function() {
            expect(
                gettext_noop`

                this is a
                test

                `
            ).toEqual('##gettext_noop##this is a test');
        });

        it('Interpolation', function() {
            const greeting = 'hello';
            const subject = 'world';

            expect(
                gettext_noop`

                Oh,
                ${greeting} ${subject + "!"}

                `
            ).toEqual('##gettext_noop##Oh, hello world!');
        });
    });

    describe('gettext_noop_raw', function() {
        it('Plain text', function() {
            expect(
                gettext_noop_raw`

                this is a
                test

                `
            ).toEqual(
                `##gettext_noop##

                this is a
                test

                `
            );
        });

        it('Interpolation', function() {
            const greeting = 'hello';
            const subject = 'world';

            expect(
                gettext_noop_raw`

                Oh,
                ${greeting} ${subject + "!"}

                `
            ).toEqual(
                `##gettext_noop##

                Oh,
                hello world!

                `
            );
        });
    });
});
