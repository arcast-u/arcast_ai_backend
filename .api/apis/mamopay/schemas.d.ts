declare const DeleteWebhooksWebhookid: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly webhookId: {
                    readonly type: "string";
                    readonly default: "MPB-WH-09B9214B61";
                    readonly examples: readonly ["MPB-WH-09B9214B61"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Webhook ID";
                };
            };
            readonly required: readonly ["webhookId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "Content-Type": {
                    readonly type: "string";
                    readonly examples: readonly ["application/json"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly Authorization: {
                    readonly type: "string";
                    readonly examples: readonly ["Bearer <your sandbox api key>"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly examples: readonly [true];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly type: "object";
            readonly properties: {
                readonly messages: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["Unauthorized"];
                    };
                };
                readonly error_code: {
                    readonly type: "string";
                    readonly examples: readonly ["UNAUTHORIZED"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetWebhooks: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "Content-Type": {
                    readonly type: "string";
                    readonly examples: readonly ["application/json"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly Authorization: {
                    readonly type: "string";
                    readonly examples: readonly ["Bearer <your sandbox api key>"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                        readonly default: "MB-WH-D8B07FB8D7";
                        readonly description: "The identifier of webhook";
                    };
                    readonly url: {
                        readonly type: "string";
                        readonly format: "uri";
                        readonly default: "https://webhook.site/e9145367-01cc-45f9-bebb-69775badb883";
                        readonly description: "The URL of webhook which customer will be recieved the notification";
                    };
                    readonly enabled_events: {
                        readonly type: "array";
                        readonly default: readonly ["charge.failed", "charge.succeeded", "charge.refund_initiated", "charge.refunded", "charge.refund_failed", "subscription.failed", "subscription.succeeded"];
                        readonly description: "the options for notifying";
                        readonly items: {};
                    };
                    readonly auth_header: {
                        readonly type: "string";
                        readonly minLength: 1;
                        readonly maxLength: 50;
                        readonly description: "authentication header";
                        readonly default: "header";
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly type: "object";
            readonly properties: {
                readonly messages: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["Unauthorized"];
                    };
                };
                readonly error_code: {
                    readonly type: "string";
                    readonly examples: readonly ["UNAUTHORIZED"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PatchWebhooksWebhookid: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly url: {
                readonly type: "string";
                readonly format: "uri";
                readonly description: "The URL which the customer will be redirected to after a successful payment.";
                readonly default: "https://webhook.site/e9145367-01cc-45f9-bebb-69775badb883";
                readonly examples: readonly ["https://webhook.site/e9145367-01cc-45f9-bebb-69775badb883"];
            };
            readonly enabled_events: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                    readonly examples: readonly ["charge.failed"];
                };
                readonly description: "The URL of webhook which customer will be recieved the notification:\n charge.failed: Notification for failed one-off payments\n charge.succeeded: Notification for successful one-off payments\n charge.refund_initiated: Notification for initializing the refund\n charge.refunded: Notification for the successful refund\n charge.refund_failed: Notification for the failed refund\n charge.card_verified: Notification for card verification payment\n subscription.failed: Notification for failed subscription payments\n subscription.succeeded: Notification for successful subscription payments\n payment_link.create: Notification for successfully create payment link\n payout.processed: Notification for settled payout\n payout.failed: Notification for rejected payout\n ";
                readonly default: readonly ["charge.failed", "charge.succeeded", "charge.refund_initiated", "charge.refunded", "charge.refund_failed", "subscription.failed", "subscription.succeeded", "payment_link.create"];
            };
            readonly auth_header: {
                readonly type: "string";
                readonly minLength: 1;
                readonly maxLength: 50;
                readonly description: "authentication header";
                readonly default: "authentication header";
                readonly examples: readonly ["authentication header"];
            };
        };
        readonly required: readonly ["url", "enabled_events"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly webhookId: {
                    readonly type: "string";
                    readonly default: "MPB-WH-FBA601A8DA";
                    readonly examples: readonly ["MPB-WH-FBA601A8DA"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Webhook ID";
                };
            };
            readonly required: readonly ["webhookId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "Content-Type": {
                    readonly type: "string";
                    readonly examples: readonly ["application/json"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly Authorization: {
                    readonly type: "string";
                    readonly examples: readonly ["Bearer <your sandbox api key>"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly default: "MB-WH-FBA601A8DA";
                    readonly description: "The identifier of webhook";
                    readonly examples: readonly ["MB-WH-FBA601A8DA"];
                };
                readonly url: {
                    readonly type: "string";
                    readonly format: "uri";
                    readonly default: "https://webhook.site/e9145367-01cc-45f9-bebb-69775badb883";
                    readonly description: "The URL which the customer will be redirected to after a successful payment.";
                    readonly examples: readonly ["https://webhook.site/e9145367-01cc-45f9-bebb-69775badb883"];
                };
                readonly enabled_events: {
                    readonly type: "array";
                    readonly default: readonly ["charge.failed"];
                    readonly description: "the options for notifying";
                    readonly items: {};
                };
                readonly auth_header: {
                    readonly type: "string";
                    readonly minLength: 1;
                    readonly maxLength: 50;
                    readonly description: "authentication header";
                    readonly default: "test";
                    readonly examples: readonly ["test"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly type: "object";
            readonly properties: {
                readonly messages: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["Unauthorized"];
                    };
                };
                readonly error_code: {
                    readonly type: "string";
                    readonly examples: readonly ["UNAUTHORIZED"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostWebhooks: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly url: {
                readonly type: "string";
                readonly format: "uri";
                readonly description: "The URL of webhook which customer will be recieved the notification";
                readonly default: "https://webhook.site/e9145367-01cc-45f9-bebb-69775badb883";
                readonly examples: readonly ["https://webhook.site/e9145367-01cc-45f9-bebb-69775badb883"];
            };
            readonly enabled_events: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                    readonly examples: readonly ["charge.failed"];
                };
                readonly description: "Event types details:\n charge.failed: Notification for failed one-off payments\n charge.succeeded: Notification for successful one-off payments\n charge.refund_initiated: Notification for initializing the refund\n charge.refunded: Notification for the successful refund\n charge.refund_failed: Notification for the failed refund\n charge.card_verified: Notification for card verification payment\n charge.authorized: Notification for when a charge is placed on hold\n subscription.failed: Notification for failed subscription payments\n subscription.succeeded: Notification for successful subscription payments\n payment_link.create: Notification for successfully create payment link\n payout.processed: Notification for settled payout\n payout.failed: Notification for rejected payout\n ";
                readonly default: readonly ["charge.failed", "charge.succeeded", "charge.refund_initiated", "charge.refunded", "charge.refund_failed", "subscription.failed", "subscription.succeeded", "payment_link.create"];
            };
            readonly auth_header: {
                readonly type: "string";
                readonly minLength: 1;
                readonly maxLength: 50;
                readonly description: "authentication header";
                readonly default: "authentication header";
                readonly examples: readonly ["authentication header"];
            };
        };
        readonly required: readonly ["url", "enabled_events"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "Content-Type": {
                    readonly type: "string";
                    readonly examples: readonly ["application/json"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly Authorization: {
                    readonly type: "string";
                    readonly examples: readonly ["Bearer <your sandbox api key>"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly examples: readonly ["MB-WH-D8B07FB8D7"];
                };
                readonly url: {
                    readonly type: "string";
                    readonly format: "uri";
                    readonly examples: readonly ["https://webhook.site/e9145367-01cc-45f9-bebb-69775badb883"];
                };
                readonly enabled_events: {
                    readonly type: "array";
                    readonly items: {};
                };
                readonly auth_header: {
                    readonly type: "string";
                    readonly examples: readonly ["authentication header"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly type: "object";
            readonly properties: {
                readonly messages: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["Unauthorized"];
                    };
                };
                readonly error_code: {
                    readonly type: "string";
                    readonly examples: readonly ["UNAUTHORIZED"];
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "422": {
            readonly type: "object";
            readonly properties: {
                readonly messages: {
                    readonly type: "array";
                    readonly items: {};
                };
                readonly error_code: {
                    readonly type: "string";
                    readonly examples: readonly ["VALIDATION_FAILED"];
                };
                readonly errors: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
export { DeleteWebhooksWebhookid, GetWebhooks, PatchWebhooksWebhookid, PostWebhooks };
