This file defines the `ConnectionBuilderWizard` component, which provides a step-by-step UI for creating complex connections between nodes in the Advanced Connection Canvas. It guides the user through selecting source and target nodes, configuring connection properties, and reviewing the connection before creation.

The `ConnectionBuilderWizard` component has the following key responsibilities:

*   **State Management**: Manages the current step of the wizard and the properties of the connection being built.
*   **Step Validation**: Validates the input at each step to ensure all necessary information is provided.
*   **Node Selection**: Allows users to select source and target nodes from a list of available nodes on the canvas.
*   **Property Configuration**: Provides input fields for configuring connection properties such as type, label, threshold, and weight. It also allows selection of specific input/output ports on the connected nodes.
*   **Review**: Presents a summary of the connection details for user verification before creation.
*   **Navigation**: Provides "Previous" and "Next" buttons for navigating through the wizard steps.
*   **Connection Creation**: Calls the `onCreateConnection` callback with the finalized connection object upon completion.

**Completeness**: This component appears complete and functional based on its current implementation. There are no explicit `TODO`s or areas needing immediate work within this file.