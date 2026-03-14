# File: index.js
# Warning Outdated and discontinued, docs need rewrites
## Functions

### createNexaState
- **Description:** Creates a state container with a getter, setter, and subscription mechanism. Returns an array of three functions to interact with the state.
- **Parameters:**
  - `initialValue` (`any`): The initial value of the state.
- **Returns:**  
  `Array` – An array containing three functions:
    1. `get()` – Returns the current state value.
    2. `set(newValue)` – Updates the state and notifies all subscribers.
    3. `subscribe(fn)` – Adds a subscriber function that is called immediately with the current value and on every update. Returns an unsubscribe function.

## Returned Functions

### get
- **Description:** Returns the current state value.
- **Parameters:** None
- **Returns:**  
  `any` – The current value stored in the state.

### set
- **Description:** Updates the state value to `newValue` and calls all subscriber functions with the new value.
- **Parameters:**
  - `newValue` (`any`): The new value to set.
- **Returns:** `undefined`

### subscribe
- **Description:** Adds a subscriber function that will be called whenever the state changes. The subscriber is called immediately with the current value.
- **Parameters:**
  - `fn` (`function`): A function that accepts the current state value as its argument.
- **Returns:**  
  `function` – An unsubscribe function that, when called, removes the subscriber from the notification list.