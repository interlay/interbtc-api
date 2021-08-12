import { assert } from "../chai";

export function assertRequestListsEqual(list1: { id: string }[], list2: { id: string }[]): void {
    assert.isAtLeast(
        list1.length,
        1,
        "Error in docker-compose setup. Should have at least 1 issue request"
    );
    assert.equal(list1[0].id, list2[0].id, "Cached issue request ID does not exist");
}