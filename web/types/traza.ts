/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/traza.json`.
 */
export type Traza = {
  "address": "f5HoQ1phkhNxGkWZbkttQF334ZHpN2PRL7RaqSoesDX",
  "metadata": {
    "name": "traza",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "acceptTransfer",
      "discriminator": [
        94,
        249,
        171,
        62,
        208,
        120,
        49,
        110
      ],
      "accounts": [
        {
          "name": "traceToken",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  99,
                  101,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "trace_token.mint",
                "account": "traceToken"
              }
            ]
          }
        },
        {
          "name": "pendingTransfer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  101,
                  110,
                  100,
                  105,
                  110,
                  103,
                  95,
                  116,
                  114,
                  97,
                  110,
                  115,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "trace_token.mint",
                "account": "traceToken"
              },
              {
                "kind": "account",
                "path": "pending_transfer.from",
                "account": "pendingTransfer"
              },
              {
                "kind": "account",
                "path": "to"
              }
            ]
          }
        },
        {
          "name": "fromBalance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "trace_token.mint",
                "account": "traceToken"
              },
              {
                "kind": "account",
                "path": "pending_transfer.from",
                "account": "pendingTransfer"
              }
            ]
          }
        },
        {
          "name": "toBalance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "trace_token.mint",
                "account": "traceToken"
              },
              {
                "kind": "account",
                "path": "to"
              }
            ]
          }
        },
        {
          "name": "roleRegistry",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  108,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "to"
              }
            ]
          }
        },
        {
          "name": "to",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "addTraceEvent",
      "discriminator": [
        91,
        3,
        150,
        170,
        123,
        166,
        9,
        82
      ],
      "accounts": [
        {
          "name": "traceToken",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  99,
                  101,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "trace_token.mint",
                "account": "traceToken"
              }
            ]
          }
        },
        {
          "name": "recorderBalance",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "trace_token.mint",
                "account": "traceToken"
              },
              {
                "kind": "account",
                "path": "recorder"
              }
            ]
          }
        },
        {
          "name": "traceEvent",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  99,
                  101,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "trace_token.mint",
                "account": "traceToken"
              },
              {
                "kind": "arg",
                "path": "index"
              }
            ]
          }
        },
        {
          "name": "roleRegistry",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  108,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "recorder"
              }
            ]
          }
        },
        {
          "name": "recorder",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "eventType",
          "type": {
            "defined": {
              "name": "eventType"
            }
          }
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "temperature",
          "type": {
            "option": "i16"
          }
        },
        {
          "name": "humidity",
          "type": {
            "option": "u16"
          }
        },
        {
          "name": "index",
          "type": "u32"
        }
      ]
    },
    {
      "name": "createToken",
      "discriminator": [
        84,
        52,
        204,
        228,
        24,
        140,
        234,
        75
      ],
      "accounts": [
        {
          "name": "traceToken",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  99,
                  101,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "creatorBalance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "creator"
              }
            ]
          }
        },
        {
          "name": "mint",
          "signer": true
        },
        {
          "name": "roleRegistry",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  108,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "metadata",
          "type": "string"
        },
        {
          "name": "coffeeType",
          "type": "string"
        },
        {
          "name": "farmName",
          "type": "string"
        },
        {
          "name": "harvestDate",
          "type": "i64"
        },
        {
          "name": "originCountry",
          "type": "string"
        },
        {
          "name": "altitudeMeters",
          "type": "u16"
        },
        {
          "name": "temperature",
          "type": {
            "option": "i16"
          }
        },
        {
          "name": "humidity",
          "type": {
            "option": "u16"
          }
        },
        {
          "name": "latitude",
          "type": "f64"
        },
        {
          "name": "longitude",
          "type": "f64"
        }
      ]
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "programConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initiateTransfer",
      "discriminator": [
        128,
        229,
        77,
        5,
        65,
        234,
        228,
        75
      ],
      "accounts": [
        {
          "name": "traceToken",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  99,
                  101,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "trace_token.mint",
                "account": "traceToken"
              }
            ]
          }
        },
        {
          "name": "fromBalance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "trace_token.mint",
                "account": "traceToken"
              },
              {
                "kind": "account",
                "path": "from"
              }
            ]
          }
        },
        {
          "name": "pendingTransfer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  101,
                  110,
                  100,
                  105,
                  110,
                  103,
                  95,
                  116,
                  114,
                  97,
                  110,
                  115,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "trace_token.mint",
                "account": "traceToken"
              },
              {
                "kind": "account",
                "path": "from"
              },
              {
                "kind": "account",
                "path": "to"
              }
            ]
          }
        },
        {
          "name": "fromRoleRegistry",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  108,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "from"
              }
            ]
          }
        },
        {
          "name": "to"
        },
        {
          "name": "toRoleRegistry",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  108,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "to"
              }
            ]
          }
        },
        {
          "name": "from",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "registerRole",
      "discriminator": [
        120,
        142,
        192,
        194,
        84,
        145,
        95,
        167
      ],
      "accounts": [
        {
          "name": "pendingRole",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  101,
                  110,
                  100,
                  105,
                  110,
                  103,
                  95,
                  114,
                  111,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "wallet"
              }
            ]
          }
        },
        {
          "name": "roleRegistry"
        },
        {
          "name": "wallet",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "requestedRole",
          "type": {
            "defined": {
              "name": "role"
            }
          }
        }
      ]
    },
    {
      "name": "requestCertificate",
      "discriminator": [
        6,
        1,
        173,
        120,
        12,
        222,
        8,
        234
      ],
      "accounts": [
        {
          "name": "traceToken",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  99,
                  101,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "trace_token.mint",
                "account": "traceToken"
              }
            ]
          }
        },
        {
          "name": "requesterBalance",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  98,
                  97,
                  108,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "trace_token.mint",
                "account": "traceToken"
              },
              {
                "kind": "account",
                "path": "requester"
              }
            ]
          }
        },
        {
          "name": "certificate",
          "writable": true
        },
        {
          "name": "roleRegistry",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  108,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "requester"
              }
            ]
          }
        },
        {
          "name": "programConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "requester",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "certType",
          "type": {
            "defined": {
              "name": "certType"
            }
          }
        },
        {
          "name": "notes",
          "type": "string"
        }
      ]
    },
    {
      "name": "resolveCertificate",
      "discriminator": [
        255,
        154,
        247,
        21,
        79,
        115,
        167,
        38
      ],
      "accounts": [
        {
          "name": "certificate",
          "writable": true
        },
        {
          "name": "programConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "certType",
          "type": {
            "defined": {
              "name": "certType"
            }
          }
        },
        {
          "name": "approved",
          "type": "bool"
        },
        {
          "name": "notes",
          "type": "string"
        }
      ]
    },
    {
      "name": "validateRole",
      "discriminator": [
        255,
        49,
        156,
        62,
        44,
        3,
        111,
        255
      ],
      "accounts": [
        {
          "name": "programConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "pendingRole",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  101,
                  110,
                  100,
                  105,
                  110,
                  103,
                  95,
                  114,
                  111,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "pending_role.wallet",
                "account": "pendingRoleRegistration"
              }
            ]
          }
        },
        {
          "name": "roleRegistry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  108,
                  101,
                  95,
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "pending_role.wallet",
                "account": "pendingRoleRegistration"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "certificate",
      "discriminator": [
        202,
        229,
        222,
        220,
        116,
        20,
        74,
        67
      ]
    },
    {
      "name": "pendingRoleRegistration",
      "discriminator": [
        236,
        117,
        246,
        164,
        40,
        59,
        33,
        52
      ]
    },
    {
      "name": "pendingTransfer",
      "discriminator": [
        136,
        107,
        78,
        115,
        95,
        81,
        142,
        155
      ]
    },
    {
      "name": "programConfig",
      "discriminator": [
        196,
        210,
        90,
        231,
        144,
        149,
        140,
        63
      ]
    },
    {
      "name": "roleRegistry",
      "discriminator": [
        173,
        129,
        34,
        250,
        223,
        92,
        0,
        232
      ]
    },
    {
      "name": "tokenBalance",
      "discriminator": [
        93,
        240,
        34,
        89,
        188,
        248,
        120,
        201
      ]
    },
    {
      "name": "traceEvent",
      "discriminator": [
        51,
        144,
        87,
        63,
        144,
        220,
        30,
        230
      ]
    },
    {
      "name": "traceToken",
      "discriminator": [
        251,
        80,
        55,
        49,
        147,
        24,
        218,
        201
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorizedAuthority",
      "msg": "Only the program authority can validate roles"
    },
    {
      "code": 6001,
      "name": "roleAlreadyValidated",
      "msg": "User already has a validated role"
    },
    {
      "code": 6002,
      "name": "invalidRoleRegistryAccount",
      "msg": "Invalid role registry account"
    },
    {
      "code": 6003,
      "name": "pendingRoleAlreadyExists",
      "msg": "User already has a pending role registration"
    },
    {
      "code": 6004,
      "name": "invalidCreatorRole",
      "msg": "Invalid role: only Producer or Factory can create tokens"
    },
    {
      "code": 6005,
      "name": "factoryRequiresSourceTokens",
      "msg": "Factory must provide at least one source token from a Producer"
    },
    {
      "code": 6006,
      "name": "invalidSourceTokenCreator",
      "msg": "Source token must be created by a Producer"
    },
    {
      "code": 6007,
      "name": "invalidAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6008,
      "name": "transferAmountExceedsTokenAmount",
      "msg": "Transfer amount exceeds token amount"
    },
    {
      "code": 6009,
      "name": "invalidTransferPath",
      "msg": "Invalid transfer: only Producer->Factory, Factory->Retailer, Retailer->Consumer allowed"
    },
    {
      "code": 6010,
      "name": "tokenAlreadyInTransfer",
      "msg": "Token is already in transfer"
    },
    {
      "code": 6011,
      "name": "tokenNotInTransfer",
      "msg": "Token is not in transfer status"
    },
    {
      "code": 6012,
      "name": "insufficientBalance",
      "msg": "Insufficient balance for transfer"
    },
    {
      "code": 6013,
      "name": "transferToSelf",
      "msg": "Cannot transfer to the same account"
    },
    {
      "code": 6014,
      "name": "metadataTooLong",
      "msg": "Metadata exceeds maximum length"
    },
    {
      "code": 6015,
      "name": "certificateAlreadyExists",
      "msg": "Certificate of this type already exists for this token"
    },
    {
      "code": 6016,
      "name": "certificateNotPending",
      "msg": "Certificate is not in Pending status"
    },
    {
      "code": 6017,
      "name": "descriptionTooLong",
      "msg": "Description exceeds maximum length of 200 characters"
    },
    {
      "code": 6018,
      "name": "unauthorizedCertifier",
      "msg": "Only the program authority can resolve certificates"
    },
    {
      "code": 6019,
      "name": "invalidEventIndex",
      "msg": "Event index must match the current event count of the token"
    }
  ],
  "types": [
    {
      "name": "certStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "approved"
          },
          {
            "name": "rejected"
          }
        ]
      }
    },
    {
      "name": "certType",
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "sanitary"
          },
          {
            "name": "quality"
          },
          {
            "name": "organic"
          }
        ]
      }
    },
    {
      "name": "certificate",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "certType",
            "type": {
              "defined": {
                "name": "certType"
              }
            }
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "certStatus"
              }
            }
          },
          {
            "name": "requester",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "requestedAt",
            "type": "i64"
          },
          {
            "name": "resolvedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "notes",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "eventType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "harvest"
          },
          {
            "name": "processing"
          },
          {
            "name": "roasting"
          },
          {
            "name": "packaging"
          },
          {
            "name": "qualityCheck"
          },
          {
            "name": "transport"
          },
          {
            "name": "storage"
          }
        ]
      }
    },
    {
      "name": "pendingRoleRegistration",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "requestedRole",
            "type": {
              "defined": {
                "name": "role"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "pendingTransfer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "from",
            "type": "pubkey"
          },
          {
            "name": "to",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "initiatedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "programConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "initialized",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "role",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "producer"
          },
          {
            "name": "factory"
          },
          {
            "name": "retailer"
          },
          {
            "name": "consumer"
          }
        ]
      }
    },
    {
      "name": "roleRegistry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "role",
            "type": {
              "defined": {
                "name": "role"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "validatedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "tokenBalance",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "balance",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "lastUpdated",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "tokenStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "created"
          },
          {
            "name": "inTransfer"
          },
          {
            "name": "accepted"
          }
        ]
      }
    },
    {
      "name": "traceEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "recorder",
            "type": "pubkey"
          },
          {
            "name": "eventType",
            "type": {
              "defined": {
                "name": "eventType"
              }
            }
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "temperature",
            "type": {
              "option": "i16"
            }
          },
          {
            "name": "humidity",
            "type": {
              "option": "u16"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "index",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "traceToken",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "creatorRole",
            "type": {
              "defined": {
                "name": "role"
              }
            }
          },
          {
            "name": "totalSupply",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "tokenStatus"
              }
            }
          },
          {
            "name": "sourceTokens",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "metadata",
            "type": "string"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "coffeeType",
            "type": "string"
          },
          {
            "name": "farmName",
            "type": "string"
          },
          {
            "name": "harvestDate",
            "type": "i64"
          },
          {
            "name": "originCountry",
            "type": "string"
          },
          {
            "name": "altitudeMeters",
            "type": "u16"
          },
          {
            "name": "temperature",
            "type": {
              "option": "i16"
            }
          },
          {
            "name": "humidity",
            "type": {
              "option": "u16"
            }
          },
          {
            "name": "eventCount",
            "type": "u32"
          },
          {
            "name": "oracleVerified",
            "type": "bool"
          },
          {
            "name": "latitude",
            "type": "f64"
          },
          {
            "name": "longitude",
            "type": "f64"
          }
        ]
      }
    }
  ]
};
