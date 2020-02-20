
const Test = require('tape');
const Enjoi = require('../index');
const Joi = require('@hapi/joi');

Test('directives', function (t) {
    t.test('anyOf', function (t) {
        t.plan(3);

        const schema = Enjoi.schema({
            'anyOf': [
                {
                    type: 'string'
                },
                {
                    type: 'number'
                }
            ]
        });

            t.ok(schema.validate('string').value, 'string')
            t.ok(schema.validate(10).value, 10);
            t.ok(schema.validate({}).error);
    });

    t.test('oneOf', function (t) {
        t.plan(9);

        const schema = Enjoi.schema({
            'oneOf': [
                {
                    type: 'object',
                    properties: {
                        a: {
                            type: 'string'
                        }
                    }
                },
                {
                    type: 'object',
                    properties: {
                        b: {
                            type: 'number'
                        }
                    }
                }
            ]
        });

            t.ok(schema.validate({ a: 'string' }).value, 'string');
            t.ok(schema.validate({}).value);
            t.ok(schema.validate(undefined).value === undefined);
            t.ok(schema.validate({ b: 10 }).value, { b: 10 });
            t.ok(schema.validate({ a: 'string', b: 10 }).error);
            t.ok(schema.validate({ a: 'string', b: null }).error);
            t.ok(schema.validate({ a: null, b: 10 }).error);
            t.ok(schema.validate({ a: null, b: null }).error);
            t.ok(schema.validate({ a: 'string', b: 'string' }).error);
    });

    t.test('not', function (t) {
        t.plan(8);

        const schema = Enjoi.schema({
            'not': [
                {
                    type: 'object',
                    properties: {
                        a: {
                            type: 'string'
                        }
                    }
                },
                {
                    type: 'object',
                    properties: {
                        b: {
                            type: 'number'
                        }
                    }
                }
            ]
        });

        t.ok(schema.validate({ a: 'string' }).error);
        t.ok(schema.validate({}).error);
        t.ok(schema.validate({ b: 10 }).error);
        t.deepEqual(schema.validate({ a: 'string', b: 10 }).value, { a: 'string', b: 10 });
        t.deepEqual(schema.validate({ a: 'string', b: null }).value, {a: 'string', b: null});
        t.deepEqual(schema.validate({ a: null, b: 10 }).value, {a: null, b: 10});
        t.deepEqual(schema.validate({ a: null, b: null }).value, { a: null, b: null });
        t.deepEqual(schema.validate({ a: 'string', b: 'string' }).value, { a: 'string', b: 'string' });
    });

    t.test('additionalProperties boolean', function (t) {
        t.plan(4);

        const schema = {
            type: 'object',
            properties: {
                file: {
                    type: 'string'
                }
            }
        };

        t.ok(Enjoi.schema(schema).validate({ file: 'data', consumes: 'application/json' }).error);
        schema.additionalProperties = false;
        t.ok(Enjoi.schema(schema).validate({ file: 'data', consumes: 'application/json' }).error);
        schema.additionalProperties = true;
        t.deepEqual(Enjoi.schema(schema).validate({ file: 'data', consumes: 'application/json' }).value, { "file": "data", "consumes": "application/json"});
        t.ok(Enjoi.schema(schema).validate({ file: 5, consumes: 'application/json' }).error);
    });

    t.test('default values', function (t) {
        t.plan(4);

        const schema = {
            type: 'object',
            properties: {
                user: {
                    type: 'string',
                    format: 'email'
                },
                locale: {
                    type: 'string',
                    default: 'en-US'
                },
                isSubscribed: {
                    type: 'boolean',
                    default: false
                },
                posts: {
                    type: 'number',
                    default: 0
                },
                empty: {
                    type: 'string',
                    default: ''
                }
            },
            required: ['user']
        };

        let result = Enjoi.schema(schema).validate({ user: 'test@domain.com' })
        t.ok(!result.error)
        t.equal(result.value.locale, 'en-US');
        t.equal(result.value.isSubscribed, false);
        t.equal(result.value.posts, 0);
    });

    t.test('additionalProperties false should not allow additional properties', function (t) {
        t.plan(1);

        const schema = Enjoi.schema({
            type: 'file'
        },
        {
            types: {
                file: Enjoi.schema({
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        file: {
                            type: 'string'
                        }
                    }
                })
            }
        });

        t.ok(schema.validate({ file: 'data', consumes: 'application/json' }).error);
    });

    t.test('additionalProperties true should allow additional properties', function (t) {
        t.plan(1);

        const schema = Enjoi.schema({
            type: 'file'
        },
        {
            types: {
                file: Enjoi.schema({
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                        file: {
                            type: 'string'
                        }
                    }
                })
            }
        });

        schema.validate({ file: 'data', consumes: 'application/json' }, function (error, value) {
            t.ok(!error);
        });
    });

    t.test('additionalProperties true should not affect validation of properties', function (t) {
        t.plan(1);

        const schema = Enjoi.schema({
            type: 'file'
        },
        {
            types: {
                file: Enjoi.schema({
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                        file: {
                            type: 'string'
                        }
                    }
                })
            }
        });

        schema.validate({ file: 5, consumes: 'application/json' }, function (error, value) {
            t.ok(error);
        });
    });

    t.test('additionalProperties object should not affect validation of properties', function (t) {
        t.plan(1);

        const schema = Enjoi.schema({
            type: 'file'
        },
        {
            types: {
                file: Enjoi.schema({
                    type: 'object',
                    additionalProperties: {
                        type: 'string'
                    },
                    properties: {
                        file: {
                            type: 'string'
                        }
                    }
                })
            }
        });

        schema.validate({ file: 'asdf', consumes: 'application/json' }, function (error, value) {
            t.ok(!error);
        });
    });

    t.test('additionalProperties object should add to validated properties', function (t) {
        t.plan(1);

        const schema = Enjoi.schema({
            type: 'file'
        },
        {
            types: {
                file: Enjoi.schema({
                    type: 'object',
                    additionalProperties: {
                        type: 'string'
                    },
                    properties: {
                        file: {
                            type: 'string'
                        }
                    }
                })
            }
        });

        schema.validate({ file: 'asdf', consumes: 5 }, function (error, value) {
            t.ok(error);
        });
    });

    t.test('array additionalItems', function (t) {
        t.plan(3);

        const schema = Enjoi.schema({
            type: 'array',
            items: [
                {
                    type: 'string'
                },
                {
                    type: 'number'
                }
            ],
            additionalItems: false
        });

        Joi.validate(['test'], schema, function (error, value) {
            t.ok(!error, 'no error.');
        });

        Joi.validate(['test', 123], schema, function (error, value) {
            t.ok(!error, 'no error.');
        });

        Joi.validate(['test', 123, 'foo'], schema, function (error, value) {
            t.ok(error, 'error.');
        });

    });
});

Test('allOf', function (t) {

    t.test('allOf simple types', function (t) {
        t.plan(2);

        const schema = Enjoi.schema({
            allOf: [
                {
                    type: 'string'
                },
                {
                    type: 'string',
                    maxLength: 3
                }
            ]
        });

        Joi.validate('abc', schema, function (error) {
            t.ok(!error, 'no error.');
        });

        Joi.validate('abcd', schema, function (error) {
            t.ok(error, 'error.');
        });
    });

    t.test('allOf object', function (t) {
        t.plan(3);

        const schema = Enjoi.schema({
            'allOf': [
                {
                    type: 'object',
                    properties: {
                        a: {
                            type: 'string'
                        }
                    }
                },
                {
                    type: 'object',
                    properties: {
                        b: {
                            type: 'number'
                        }
                    }
                }
            ]
        });

        Joi.validate({ a: 'string', b: 10 }, schema, function (error, value) {
            t.ok(!error, 'no error.');
        });

        Joi.validate({ a: 'string', b: 'string' }, schema, function (error, value) {
            t.ok(error, 'error.');
            t.equal(error.details[0].message, '\"b\" must be a number');
        });
    });

    t.test('allOf array with conflicting needs', function (t) {
        t.plan(1);

        //This should never validate due to all criteria being required to pass
        const schema = Enjoi.schema({
            'allOf': [
                {
                    type: 'array',
                    items: [
                        {
                            type: 'string'
                        }
                    ]
                },
                {
                    type: 'array',
                    items: [
                        {
                            type: 'number'
                        }
                    ]
                }
            ]
        });

        Joi.validate([ 'string', 10 ], schema, function (error, value) {
            t.ok(error, 'error.');
        });
    });

    t.test('allOf nested', function (t) {
        t.plan(2);

        const schema = Enjoi.schema({
            title: "Organization Input",
            allOf: [
                {
                    title: "Organization Common",
                    allOf: [
                        {
                            type: "object",
                            properties: {
                                name: { type: "string", maxLength: 40 },
                                billingAddress: { type: "string", maxLength: 100 }
                            },
                            required: ["name"]
                        },
                        {
                            type: "object",
                            title: "Phone Number",
                            properties: { phoneCountryCode: { type: "string", minLength: 1 } },
                            required: ["phoneCountryCode"]
                        }
                    ]
                }
            ]
        });

        Joi.validate({ name: 'test', phoneCountryCode: 'US' }, schema, function (error, value) {
            t.ok(!error, 'no error.');
        });

        Joi.validate({ name: 'test' }, schema, function (error, value) {
            t.ok(error, 'error.');
        });
    });

});
