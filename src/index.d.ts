/* gettext variants. */
declare module _ {
    interface UnderscoreStatic {
        <V extends TemplateStringsArray>(
            msg: V,
            ...args: any[]
        ): string;
    }
}


declare function gettext(
    msg: TemplateStringsArray | string,
): string;


declare function gettext_raw(
    msg: TemplateStringsArray | string,
): string;


declare function gettext_noop(
    msg: TemplateStringsArray | string,
): string;


declare function gettext_noop_raw(
    msg: TemplateStringsArray | string,
): string;


/* gettext variants. */
declare function ngettext(
    singular: string,
    plural: string,
    count: number,
): string;


declare function ngettext_raw(
    singular: string,
    plural: string,
    count: number,
): string;


declare function N_(
    singular: string,
    plural: string,
    count: number,
): string;


/* pgettext variants. */
declare function pgettext(
    context: string,
    msg: string,
): string;


declare function pgettext_raw(
    context: string,
    msg: string,
): string;


declare function npgettext(
    context: string,
    singular: string,
    plural: string,
    count: number,
): string;


declare function npgettext_raw(
    context: string,
    singular: string,
    plural: string,
    count: number,
): string;


declare function interpolate(
    fmt: string,
    obj: Record<string, any>,
    named?: boolean,
): string;
