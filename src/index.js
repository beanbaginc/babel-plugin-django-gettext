module.exports = function babelPluginDjangoGettext(babel) {
    const t = babel.types;

    /**
     * Build a CallExpression, given a function name and argument nods.
     *
     * This is just a convenience around building manually.
     *
     * Args:
     *     funcName (string):
     *         The name of the function.
     *
     *     argNodes (Array of Node):
     *         The nodes to provide as arguments to the function call.
     *
     * Returns:
     *     Node<CallExpression>:
     *     The resulting CallExpression.
     */
    function buildCallExpression(funcName, argNodes) {
        return t.callExpression(t.Identifier(funcName), argNodes);
    }

    /**
     * Build a a text node containing processed text.
     *
     * If working off a gettext call that uses raw strings, the provided text
     * will be used as-is for the new node. Otherwise, leading and trailing
     * whitespace will be trimmed, and any other whitespace will be collapsed.
     *
     * Args:
     *     gettextOptions (object):
     *         The options for the gettext processing.
     *
     *     text (string):
     *         The text to use as the basis for the node.
     *
     *     tagName (string, optional):
     *         The name of a tagged template to build in place of a text node.
     *         If provided, the result will be a
     *         :js:class:Node<TaggedTemplateExpression>` that contains the
     *         text.
     *
     * Returns:
     *     Node<StringLiteral> or Node<TaggedTemplateExpression>:
     *     The resulting text node or tagged template.
     */
    function buildTextNode(gettextOptions, text, tagName) {
        if (!gettextOptions.raw) {
            text = text.replace(/\s+/g, ' ').trim();
        }

        if (tagName) {
            return t.taggedTemplateExpression(
                t.identifier(tagName),
                t.templateLiteral(
                    [
                        t.templateElement(
                            {
                                cooked: text,
                                raw: text,
                            },
                            true),
                    ],
                    []));
        }

        return t.stringLiteral(text);
    }

    /**
     * Transform a text node into a new, processed text node.
     *
     * Args:
     *     gettextOptions (object):
     *         The options for the gettext processing.
     *
     *     textNode (Node<StringLiteral> or
     *               Node<TemplateElement>):
     *         The text node to transform.
     *
     *     tagName (string, optional):
     *         The name of a tagged template to build in place of a text node.
     *         If provided, the result will be a
     *         :js:class:Node<TaggedTemplateExpression>` that contains the
     *         text.
     *
     * Returns:
     *     Node<StringLiteral> or Node<TaggedTemplateExpression>:
     *     The new, processed node.
     */
    function transformTextNode(gettextOptions, textNode, tagName) {
        let text;

        if (t.isTemplateElement(textNode)) {
            text = textNode.value.cooked;
        } else if (t.isStringLiteral(textNode)) {
            text = textNode.value;
        } else {
            console.assert(false, `Unexpected text node type: ${textNode}`);
        }

        return buildTextNode(gettextOptions, text, tagName);
    }

    /**
     * Return processed information from a text-based node.
     *
     * This will result in a text node that can be used in calls, and
     * information on any variables/expressions used in a template literal (if
     * working with those).
     *
     * Args:
     *     gettextOptions (object):
     *         The options for the gettext processing.
     *
     *     node (Node<StringLiteral> or
     *           Node<TemplateLiteral> or
     *           Node<TaggedTemplateExpression>):
     *         The node to process.
     *
     *     allowVarExpressions (boolean, optional):
     *         Whether to allow expressions (e..g, ``${x + 1}`` or
     *         ``${a[b]}``) in any template literals. If ``false``, only
     *         direct variable references will be allowed.
     *
     *  Returns:
     *     object:
     *     The following keys will be provided:
     *
     *     ``textNode`` (:js:class:`Node<StringLiteral>`):
     *         The text node containing the processed text. This can be safely
     *         included in any call expressions.
     *
     *     ``varValues`` (:js:class:`Array of Node<ObjectProperty>`):
     *         All values used in a template literal. These may represent
     *         variable names or expressions (unless passing
     *         ``allowVarExpressions=false``).
     */
    function getTextNodeInfo(gettextOptions, node, allowVarExpressions=true) {
        const varNames = [];
        const varValues = [];
        let textNode;

        if (t.isStringLiteral(node)) {
            /*
             * String literals are easy. We just need to process the text
             * and return a transformed node.
             */
            textNode = transformTextNode(gettextOptions, node);
        } else {
            /*
             * Template literals and tagged template expressions are more
             * complex. They may reference variables, so we'll need to
             * extract information on them and provide them to the caller.
             */
            let expressions;
            let quasis;
            let tagName;

            if (t.isTemplateLiteral(node)) {
                expressions = node.expressions;
                quasis = node.quasis;
            } else if (t.isTaggedTemplateExpression(node)) {
                expressions = node.quasi.expressions;
                quasis = node.quasi.quasis;

                if (allGettextOptions[node.tag.name] === undefined) {
                    /*
                     * This isn't a tagged template provided by this function,
                     * so we can safely reconstruct it as a parameter. Babel
                     * will further traverse and transform this after we've
                     * finished building the resulting nodes.
                     */
                    tagName = node.tag.name;
                }
            } else {
                console.assert(
                    false,
                    `Unexpected node type ${node.type} passed`);
            }

            if (expressions.length > 0) {
                /*
                 * This needs interpolation. We'll be looking up any plain
                 * identifiers for use in the format string, and generating
                 * our own variable names for any that end up being more
                 * complicated expressions.
                 *
                 * We'll then transform the string to be compatible with
                 * interpolate().
                 */
                expressions.forEach((expr, i) => {
                    if (!allowVarExpressions) {
                        t.assertIdentifier(expr);
                    }

                    const varName = (t.isIdentifier(expr)
                                     ? expr.name
                                     : `value${i + 1}`);

                    varNames.push(varName);
                    varValues.push(t.objectProperty(
                        t.stringLiteral(varName),
                        expr));
                });

                /*
                 * Build the new string, combining text nodes and expressions.
                 */
                const textParts = [];

                quasis.forEach((node, i) => {
                    textParts.push(node.value.cooked);

                    if (!node.tail) {
                        textParts.push(`%(${varNames[i]})s`);
                    }
                });

                textNode = buildTextNode(gettextOptions, textParts.join(''),
                                         tagName);
            } else {
                /*
                 * This ended up being pretty simple. We just have a plain
                 * string to work with.
                 */
                textNode = transformTextNode(gettextOptions, quasis[0],
                                             tagName);
            }
        }

        return {
            textNode: textNode,
            varValues: varValues,
        };
    }

    /**
     * Merge arrays of varValues together.
     *
     * This will generate a new array containing all varValues from the
     * lists, deduplicated. It expects that any two varValues with the same
     * key will have the same value.
     *
     * varValues are generated by :js:func:`getTextNodeInfo`.
     *
     * Args:
     *     varValuesLists (Array of Array of Node<ObjectProperty>):
     *         The lists of varValues.
     *
     * Returns:
     *     Array of Node<ObjectProperty>:
     *     The merged, deduplicated list of varValues.
     */
    function mergeVarValues(varValuesList) {
        const usedKeys = {};
        const merged = [];

        varValuesList.forEach(varValues => {
            varValues.forEach(varValue => {
                const key = varValue.key.value;

                if (!usedKeys.hasOwnProperty(key)) {
                    usedKeys[key] = true;
                    merged.push(varValue);
                }
            });
        });

        return merged;
    }

    /**
     * Mark a node as transformed by this plugin.
     *
     * This will set an internal flag that prevents the plugin from
     * attempting to further process it in another transformation pass.
     *
     * By using this flag, we can allow Babel to continue processing the
     * children of the node (further transforming other tagged template
     * literals, like ``dedent``) without going into a loop and transforming
     * the same gettext calls over and over.
     *
     * Args:
     *     node (Node):
     *         The node to mark as transformed.
     *
     * Returns:
     *     Node:
     *     The provided node.
     */
    function markTransformed(node) {
        node._gettextTransformed = true;

        return node;
    }

    /**
     * Return whether a node has been transformed by this plugin.
     *
     * See :js:func:`markTransformed` for the reasons behind marking nodes
     * as transformed.
     *
     * Args:
     *     node (Node):
     *         The node to check.
     *
     * Returns:
     *     ``true`` if the node has been transformed. ``false`` if it has not.
     */
    function isTransformed(node) {
        return !!node._gettextTransformed;
    }

    /**
     * Common logic for building a call to a gettext function.
     *
     * This will determine if we can call the function directly or if it
     * requires variable interpolation, and will generate the necessary nodes
     * accordingly.
     *
     * The function to call is based on the computed gettext options for the
     * current node path being processed.
     *
     * Args:
     *     gettextOptions (object):
     *         The options for the gettext processing.
     *
     *     argNodes (Array of Node):
     *         The arguments to pass to the gettext function.
     *
     *     varValues (Array of Node<ObjectProperty>):
     *         An array of zero or more values that require interpolation.
     *
     * Returns:
     *     Node<CallExpression>:
     *     The new node for the function call.
     */
    function buildCommonGettextCallExpression(gettextOptions, argNodes,
                                              varValues) {
        const gettextCallExpression = buildCallExpression(
            gettextOptions.funcName, argNodes);

        if (varValues.length > 0) {
            return buildCallExpression(
                'interpolate',
                [
                    markTransformed(gettextCallExpression),
                    t.objectExpression(varValues),
                    t.booleanLiteral(true),
                ]);
        } else {
            return markTransformed(gettextCallExpression);
        }
    }

    /**
     * Transform a node for calling gettext().
     *
     * This will check for required arguments to the function and build
     * a new node for calling :js:func:`gettext`, possibly with a call to
     * :js:func:`interpolate`.
     *
     * Args:
     *     gettextOptions (object):
     *         The options for the gettext processing.
     *
     *     pathNode (Node<CallExpression>):
     *         The existing call being replaced.
     *
     * Returns:
     *     Node<CallExpression>:
     *     The new node for the function call.
     */
    function transformGettextCall(gettextOptions, pathNode) {
        t.assertCallExpression(pathNode);

        const childNodes = pathNode.arguments;

        console.assert(
            childNodes.length === 1,
            `Expecting 1 argument passed to ${pathNode.callee.name}`);

        const info = getTextNodeInfo(gettextOptions, childNodes[0]);

        return buildCommonGettextCallExpression(gettextOptions,
                                                [info.textNode],
                                                info.varValues);
    }

    /**
     * Transform a node for calling pgettext().
     *
     * This will check for required arguments to the function and build
     * a new node for calling :js:func:`pgettext`, possibly with a call to
     * :js:func:`interpolate`.
     *
     * Args:
     *     gettextOptions (object):
     *         The options for the gettext processing.
     *
     *     pathNode (Node<CallExpression>):
     *         The existing call being replaced.
     *
     * Returns:
     *     Node<CallExpression>:
     *     The new node for the function call.
     */
    function transformPGettextCall(gettextOptions, pathNode) {
        t.assertCallExpression(pathNode);

        const childNodes = pathNode.arguments;

        console.assert(
            childNodes.length === 2,
            `Expecting 2 arguments passed to ${pathNode.callee.name}`);

        const info = getTextNodeInfo(gettextOptions, childNodes[1]);

        return buildCommonGettextCallExpression(
            gettextOptions,
            [
                childNodes[0],
                info.textNode,
            ],
            info.varValues);
    }

    /**
     * Transform a node for calling ngettext().
     *
     * This will check for required arguments to the function and build
     * a new node for calling :js:func:`ngettext`, possibly with a call to
     * :js:func:`interpolate`.
     *
     * Args:
     *     gettextOptions (object):
     *         The options for the gettext processing.
     *
     *     pathNode (Node<CallExpression>):
     *         The existing call being replaced.
     *
     * Returns:
     *     Node<CallExpression>:
     *     The new node for the function call.
     */
    function transformNGettextCall(gettextOptions, pathNode) {
        t.assertCallExpression(pathNode);

        const childNodes = pathNode.arguments;

        console.assert(
            childNodes.length === 3,
            `Expecting 3 arguments passed to ${pathNode.callee.name}`);

        const info1 = getTextNodeInfo(gettextOptions, childNodes[0], false);
        const info2 = getTextNodeInfo(gettextOptions, childNodes[1], false);
        const varValues = mergeVarValues([info1.varValues, info2.varValues]);

        return buildCommonGettextCallExpression(
            gettextOptions,
            [
                info1.textNode,
                info2.textNode,
                childNodes[2],
            ],
            varValues);
    }

    /**
     * Transform a node for calling npgettext().
     *
     * This will check for required arguments to the function and build
     * a new node for calling :js:func:`npgettext`, possibly with a call to
     * :js:func:`interpolate`.
     *
     * Args:
     *     gettextOptions (object):
     *         The options for the gettext processing.
     *
     *     pathNode (Node<CallExpression>):
     *         The existing call being replaced.
     *
     * Returns:
     *     Node<CallExpression>:
     *     The new node for the function call.
     */
    function transformNPGettextCall(gettextOptions, pathNode) {
        t.assertCallExpression(pathNode);

        const childNodes = pathNode.arguments;

        console.assert(
            childNodes.length === 4,
            `Expecting 4 arguments passed to ${pathNode.callee.name}`);

        const info1 = getTextNodeInfo(gettextOptions, childNodes[1], false);
        const info2 = getTextNodeInfo(gettextOptions, childNodes[2], false);
        const varValues = mergeVarValues([info1.varValues, info2.varValues]);

        return buildCommonGettextCallExpression(
            gettextOptions,
            [
                childNodes[0],
                info1.textNode,
                info2.textNode,
                childNodes[3],
            ],
            varValues);
    }

    /**
     * Transform a template expression into a gettext call.
     *
     * This will take a template expression that can be mapped to a gettext
     * function and turn it into a call.
     *
     * Only gettext functions that take a single string argument can be
     * supported.
     *
     * Args:
     *     gettextOptions (object):
     *         The options for the gettext processing.
     *
     *     pathNode (Node<TaggedTemplateExpression>):
     *         The existing call being replaced.
     *
     * Returns:
     *     Node<CallExpression>:
     *     The new node for the function call.
     */
    function transformGettextTemplate(gettextOptions, pathNode) {
        t.assertTaggedTemplateExpression(pathNode);

        const info = getTextNodeInfo(gettextOptions, pathNode);

        return buildCommonGettextCallExpression(
            gettextOptions,
            [info.textNode],
            info.varValues);
    }

    /**
     * Transform a path.
     *
     * This will handle any transformation needed for a path (representing a
     * call or a taggted template).
     *
     * It will take care to ensure a node is not transformed more than once
     * (attempting to utilize both Babel-supplied skip support, which isn't
     * particularly reliable locally, and an internal flag).
     *
     * Args:
     *     path (NodePath):
     *         The path containing the node to replace.
     *
     *     name (string):
     *         The name of the tag or callee from the node being processed.
     *
     *     transformFuncKey (string):
     *         The name of the key in the gettext options for this call.
     */
    function transformPath(path, name, transformFuncKey) {
        const pathNode = path.node;

        /*
         * Make sure this isn't a gettext() call or something that's the
         * result of a previous transformation. We'll want to let Babel
         * continue processing the children, but we don't want to transform
         * anything we've already transformed.
         */
        if (isTransformed(pathNode)) {
            return;
        }

        const gettextOptions = allGettextOptions[name];

        if (gettextOptions) {
            const transformFunc = gettextOptions[transformFuncKey];

            if (transformFunc) {
                const expr = transformFunc(gettextOptions, pathNode);

                if (expr) {
                    path.replaceWith(expr);
                }
            }
        }
    }

    /**
     * All available available gettext-related functions/template literals tags.
     *
     * Each entry maps an available function/template literal tag to a set of
     * options, which specify the normalized name of the actual gettext function
     * to call and builders for transforming function calls and template
     * literals.
     */
    const allGettextOptions = {
        /* gettext variants */
        _: {
            funcName: 'gettext',
            transformTaggedTemplateFunc: transformGettextTemplate,
        },
        gettext: {
            funcName: 'gettext',
            transformCallFunc: transformGettextCall,
            transformTaggedTemplateFunc: transformGettextTemplate,
        },
        gettext_raw: {
            funcName: 'gettext',
            raw: true,
            transformCallFunc: transformGettextCall,
            transformTaggedTemplateFunc: transformGettextTemplate,
        },

        /* gettext_noop variants */
        gettext_noop: {
            funcName: 'gettext_noop',
            transformCallFunc: transformGettextCall,
            transformTaggedTemplateFunc: transformGettextTemplate,
        },
        gettext_noop_raw: {
            funcName: 'gettext_noop',
            raw: true,
            transformCallFunc: transformGettextCall,
            transformTaggedTemplateFunc: transformGettextTemplate,
        },

        /* ngettext variants */
        N_: {
            funcName: 'ngettext',
            transformCallFunc: transformNGettextCall,
        },
        ngettext: {
            funcName: 'ngettext',
            transformCallFunc: transformNGettextCall,
        },
        ngettext_raw: {
            funcName: 'ngettext',
            raw: true,
            transformCallFunc: transformNGettextCall,
        },

        /* pgettext variants */
        pgettext: {
            funcName: 'pgettext',
            transformCallFunc: transformPGettextCall,
        },
        pgettext_raw: {
            funcName: 'pgettext',
            raw: true,
            transformCallFunc: transformPGettextCall,
        },

        /* npgettext variants */
        npgettext: {
            funcName: 'npgettext',
            transformCallFunc: transformNPGettextCall,
        },
        npgettext_raw: {
            funcName: 'npgettext',
            raw: true,
            transformCallFunc: transformNPGettextCall,
        },
    };

    return {
        visitor: {
            CallExpression(path) {
                transformPath(path,
                              path.node.callee.name,
                              'transformCallFunc',
                              'function call');
            },

            TaggedTemplateExpression(path) {
                transformPath(path,
                              path.node.tag.name,
                              'transformTaggedTemplateFunc',
                              'tagged template literal');
            },
        },
    };
};
