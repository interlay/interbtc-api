import type {Test} from "@jest/test-result";
import Sequencer from "@jest/test-sequencer";

class CustomSequencer extends Sequencer {
  /**
   * Sort test alphabetically instead of jest's default sorting
   */
  sort(tests: Test[]) {
    const copyTests = Array.from(tests);
    return copyTests.sort((testA, testB) => (testA.path > testB.path ? 1 : -1));
  }
}

module.exports = CustomSequencer;