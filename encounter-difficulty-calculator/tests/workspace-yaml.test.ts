import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";

import { WorkspaceState } from "../src/workspace-state";
import { serializeWorkspaceYaml } from "../src/workspace-yaml";

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
