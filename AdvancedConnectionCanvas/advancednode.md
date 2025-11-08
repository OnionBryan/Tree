This file defines the `AdvancedNode`, `Edge`, and `LogicGraph` classes, which are the core components of the advanced connection canvas system. It also includes a variety of helper classes and functions for working with fuzzy logic and logic gates.

The `AdvancedNode` class represents a node in the logic graph. It can be a decision node, a logic gate, a fuzzy gate, a probabilistic node, a multi-valued node, a hybrid node, or a statistical node. It has a variety of properties, such as its name, its position, its type, its logic type, its branch count, its branch labels, its branch conditions, its truth table, its fuzzy membership function, its probability distribution, and its custom logic function.

The `Edge` class represents a connection between two nodes in the logic graph. It has a variety of properties, such as its source, its target, its weight, its condition, its label, its operator, and its visual style.

The `LogicGraph` class manages the overall graph structure. It has a variety of properties, such as its name, its version, its type, its execution mode, and its cache results. It also provides a variety of methods for working with the graph, such as methods for adding and removing nodes and edges, detecting cycles, and executing the graph.

The file also includes a variety of helper classes and functions for working with fuzzy logic and logic gates. These include:

*   **`MembershipFunctions`**: This class provides a variety of fuzzy membership functions, such as the triangular membership function, the trapezoidal membership function, and the Gaussian membership function.
*   **`TNorms`**: This class provides a variety of T-norms, which are used for fuzzy AND operations.
*   **`SNorms`**: This class provides a variety of S-norms, which are used for fuzzy OR operations.
*   **`FuzzyComplements`**: This class provides a variety of fuzzy complement operations.
*   **`FuzzyImplications`**: This class provides a variety of fuzzy implication operations.
*   **`FuzzyAggregation`**: This class provides a variety of fuzzy aggregation operations.
*   **`FuzzySet`**: This class provides a variety of fuzzy set operations.
*   **`FuzzyInferenceSystem`**: This class provides a Mamdani-style fuzzy inference system.
*   **`FuzzyGateEvaluator`**: This class provides a fuzzy gate evaluator that integrates with the `AdvancedNode` class.
*   **`LogicGates`**: This class provides a variety of standard Boolean logic gates.
*   **`ThresholdGates`**: This class provides a variety of threshold and majority gates.
*   **`MultiValuedGates`**: This class provides a variety of multi-valued logic gates.
*   **`SpecialGates`**: This class provides a variety of special purpose gates.