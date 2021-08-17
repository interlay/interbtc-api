import { assert } from "../chai";

export function assertRequestListsEqual(list1: { id: string }[], list2: { id: string }[]): void {
    assert.isAtLeast(
        list1.length,
        1,
        "Error in docker-compose setup. Should have at least 1 issue request"
    );
    let parsedList1 = list1.map(v => v.id);
    let parsedList2 = list2.map(v => v.id);
    for (const id of parsedList1) {
        assert.isTrue(parsedList2.includes(id), "ID mismatch between cached and actual list items");
    }
}