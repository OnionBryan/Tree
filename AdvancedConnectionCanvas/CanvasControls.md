This file defines the `CanvasControls` component, which provides a set of UI controls for interacting with the canvas. It includes buttons for clearing the canvas, exporting to a JSON file, exporting to the main canvas, detecting loops, executing signal flow, and resetting the view.

The `CanvasControls` component has the following key responsibilities:

*   **Clear Canvas**: Clears all nodes and connections from the canvas.
*   **Export to JSON File**: Exports the current state of the canvas (nodes, connections, and view) to a JSON file.
*   **Export to Main Canvas**: Exports the current state of the canvas to the main Logic Builder canvas.
*   **Insert Gate**: Opens a gate selector to insert a new gate onto the canvas.
*   **Advanced Logic**: Opens an advanced logic popup for a selected node.
*   **Detect Loops**: Detects and logs any loops in the current graph.
*   **Execute Signal Flow**: Executes the signal flow based on the current graph.
*   **Reset View**: Resets the canvas zoom and pan to their default values.
*   **Close**: Closes the advanced connection canvas.

**Completeness**: This component appears complete and functional based on its current implementation. There are no explicit `TODO`s or areas needing immediate work within this file.