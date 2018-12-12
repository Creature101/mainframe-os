// @flow

import type { RecordInstance } from 'immutable'
import { BehaviorSubject } from 'rxjs'

export default class Repository<
  T: RecordInstance<*>,
> extends BehaviorSubject<T> {
  update(updater: (value: T) => void) {
    const updated = this.value.withMutations(updater)
    if (updated !== this.value) {
      this.next(updated)
    }
  }
}
