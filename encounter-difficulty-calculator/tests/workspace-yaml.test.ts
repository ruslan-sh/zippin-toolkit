import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";

import { WorkspaceState } from "../src/workspace-state";
import { parseWorkspaceYaml, serializeWorkspaceYaml } from "../src/workspace-yaml";

test("serializes workspace YAML deterministically and round-trips source state", () => {
    const state: WorkspaceState = {
        version: 1,
        party: {
            groups: [{ playerCount: null, level: 99 }, { playerCount: 2, level: 5 }],
            modifierType: "flat",
            modifierValue: -25,
        },
        encounters: [{
            name: "Café: the #1 gate\n第二幕",
            monsters: [
                { name: "Ogre: elite #2", xp: 450, quantity: null, url: "https://example.com/ogre?a=1&b=2" },
                { name: "", xp: null, quantity: 1, url: "" },
            ],
        }],
    };

    const first = serializeWorkspaceYaml(state);
    assert.equal(serializeWorkspaceYaml(state), first);
    assert.deepEqual(parse(first), state);
    assert.match(first, /^version: 1\nparty:/);
    assert.match(first, /playerCount: null/);
    assert.match(first, /xp: 450/);
    assert.doesNotMatch(first, /xp: ["']450["']/);
    assert.doesNotMatch(first, /total|rank|validation|focus|\bid:/i);
});

test("safely parses only complete supported workspace documents", () => {
    const valid = serializeWorkspaceYaml({
        version: 1,
        party: { groups: [{ playerCount: null, level: 99 }], modifierType: "flat", modifierValue: -2 },
        encounters: [{ name: "Imported", monsters: [{ name: "Ogre", xp: 450, quantity: 0, url: "https://example.com/ogre" }] }],
    });
    assert.deepEqual(parseWorkspaceYaml(valid).party.groups[0], { playerCount: null, level: 99 });

    [
        "version: 2\nparty: {}\nencounters: []\n",
        "version: 1\nparty: { groups: [], modifierType: flat, modifierValue: 0 }\nencounters: []\n",
        "version: 1\nparty: { groups: [{ playerCount: 4, level: 5 }], modifierType: flat, modifierValue: 0 }\nencounters: [{ name: Bad, monsters: [{ name: x, xp: 1, quantity: 1, url: 'javascript:alert(1)' }] }]\n",
        "version: !custom 1\nparty: {}\nencounters: []\n",
        "version: [\n",
        "version: 1\nextra: true\nparty: { groups: [{ playerCount: 4, level: 5 }], modifierType: flat, modifierValue: 0 }\nencounters: []\n",
        "version: 1\nparty: { groups: [{ playerCount: nope, level: 5 }], modifierType: flat, modifierValue: 0 }\nencounters: []\n",
        "version: 1\nparty: { groups: [{ playerCount: .inf, level: 5 }], modifierType: flat, modifierValue: 0 }\nencounters: []\n",
        "version: 1\nversion: 1\nparty: {}\nencounters: []\n",
        "version: &version 1\nparty: { groups: [{ playerCount: *version, level: 5 }], modifierType: flat, modifierValue: 0 }\nencounters: []\n",
    ].forEach((source) => assert.throws(() => parseWorkspaceYaml(source)));

    assert.throws(
        () => parseWorkspaceYaml("version: &version 1\nparty: { groups: [{ playerCount: *version, level: 5 }], modifierType: flat, modifierValue: 0 }\nencounters: []\n"),
        /The backup is not valid YAML\./,
    );
});
