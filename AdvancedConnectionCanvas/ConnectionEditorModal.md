This file defines the `ConnectionEditorModal` component, which is a full-screen modal for editing the properties of a connection in the Advanced Connection Canvas. It allows users to modify various aspects of an existing connection, such as its type, label, threshold, weight, and active status.

The `ConnectionEditorModal` component has the following key responsibilities:

*   **State Management**: Manages the form data for the connection properties, tracks whether changes have been made, and handles validation errors.
*   **Data Loading**: Loads the properties of the `connection` prop into the form when the modal is opened.
*   **Input Handling**: Provides input fields and dropdowns for users to modify connection attributes. It includes validation for numerical inputs (threshold, weight).
*   **Node and Port Display**: Displays information about the source and target nodes of the connection, and allows selection of specific input/output ports.
*   **Save and Delete Functionality**: Provides "Save Changes" and "Delete Connection" buttons. `onSave` and `onDelete` callbacks are triggered upon user action.
*   **Unsaved Changes Warning**: Prompts the user with a confirmation dialog if they attempt to close the modal with unsaved changes.
*   **Styling**: Includes styled components for a modern, dark-themed UI.

**Completeness**: This component appears complete and functional based on its current implementation. There are no explicit `TODO`s or areas needing immediate work within this file.