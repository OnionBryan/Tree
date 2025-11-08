// ============================================================================
// Configuration Panel Builder
// ============================================================================

class TreeConfigPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentNode = null;
        this.currentGraph = null;
        this.callbacks = {};

        // Golden ratio for UI spacing
        this.phi = 1.618033988749895;

        this.initializePanel();
    }

    /**
     * Initialize the configuration panel
     */
    initializePanel() {
        if (!this.container) {
            console.error('Container not found for config panel');
            return;
        }

        // Create panel structure
        this.container.innerHTML = `
            <div class="tree-config-panel">
                <!-- Header -->
                <div class="config-header">
                    <h3>Node Configuration</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.style.display='none'">×</button>
                </div>

                <!-- Node Info Section -->
                <div class="config-section node-info-section">
                    <h4>Node Information</h4>
                    <div class="form-group">
                        <label for="node-name">Name:</label>
                        <input type="text" id="node-name" class="node-input" />
                    </div>
                    <div class="form-group">
                        <label for="node-description">Description:</label>
                        <textarea id="node-description" class="node-textarea" rows="3"></textarea>
                    </div>
                </div>

                <!-- Node Type Section -->
                <div class="config-section node-type-section">
                    <h4>Node Type</h4>
                    <div class="radio-group">
                        <label><input type="radio" name="node-type" value="decision" checked> Decision</label>
                        <label><input type="radio" name="node-type" value="logic_gate"> Logic Gate</label>
                        <label><input type="radio" name="node-type" value="fuzzy_gate"> Fuzzy Gate</label>
                        <label><input type="radio" name="node-type" value="probabilistic"> Probabilistic</label>
                        <label><input type="radio" name="node-type" value="multi_valued"> Multi-Valued</label>
                        <label><input type="radio" name="node-type" value="statistical"> Statistical</label>
                    </div>
                </div>

                <!-- Logic Type Section -->
                <div class="config-section logic-type-section">
                    <h4>Logic Operation</h4>
                    <select id="logic-type" class="logic-select">
                        <optgroup label="Basic Gates">
                            <option value="and">AND</option>
                            <option value="or">OR</option>
                            <option value="not">NOT</option>
                            <option value="nand">NAND</option>
                            <option value="nor">NOR</option>
                            <option value="xor">XOR</option>
                            <option value="xnor">XNOR</option>
                        </optgroup>
                        <optgroup label="Threshold Gates">
                            <option value="majority">MAJORITY</option>
                            <option value="threshold">THRESHOLD-K</option>
                            <option value="exactly">EXACTLY-K</option>
                            <option value="at_most">AT-MOST-K</option>
                        </optgroup>
                        <optgroup label="Fuzzy Operations">
                            <option value="fuzzy_min">Fuzzy MIN (Zadeh)</option>
                            <option value="fuzzy_max">Fuzzy MAX (Zadeh)</option>
                            <option value="fuzzy_product">Fuzzy Product</option>
                            <option value="fuzzy_sum">Fuzzy Sum</option>
                            <option value="fuzzy_average">Fuzzy Average</option>
                        </optgroup>
                        <optgroup label="Multi-Valued Logic">
                            <option value="ternary_and">Ternary AND</option>
                            <option value="ternary_or">Ternary OR</option>
                            <option value="consensus">Consensus</option>
                            <option value="lukasiewicz_and">Łukasiewicz AND</option>
                            <option value="lukasiewicz_or">Łukasiewicz OR</option>
                        </optgroup>
                        <optgroup label="Special">
                            <option value="custom">Custom Function</option>
                            <option value="truth_table">Truth Table</option>
                        </optgroup>
                    </select>
                </div>

                <!-- Branch Configuration -->
                <div class="config-section branch-config-section">
                    <h4>Branches</h4>
                    <div class="form-group">
                        <label for="branch-count">Number of Branches:</label>
                        <input type="number" id="branch-count" min="2" max="16" value="2" class="branch-input" />
                    </div>
                    <div id="branch-labels" class="branch-labels">
                        <!-- Dynamically generated branch labels -->
                    </div>
                </div>

                <!-- Advanced Settings -->
                <div class="config-section advanced-section" style="display: none;">
                    <h4>Advanced Settings</h4>

                    <!-- Threshold Configuration -->
                    <div class="threshold-config" style="display: none;">
                        <label for="threshold-k">K Value:</label>
                        <input type="number" id="threshold-k" min="1" value="1" class="threshold-input" />
                    </div>

                    <!-- Fuzzy Parameters -->
                    <div class="fuzzy-params" style="display: none;">
                        <label for="fuzzy-threshold">Fuzzy Threshold:</label>
                        <input type="range" id="fuzzy-threshold" min="0" max="1" step="0.01" value="0.5" />
                        <span id="fuzzy-threshold-value">0.5</span>
                    </div>

                    <!-- Probability Distribution -->
                    <div class="probability-config" style="display: none;">
                        <h5>Probability Distribution</h5>
                        <div id="probability-inputs">
                            <!-- Dynamically generated probability inputs -->
                        </div>
                    </div>

                    <!-- Truth Table Editor -->
                    <div class="truth-table-editor" style="display: none;">
                        <h5>Truth Table</h5>
                        <div id="truth-table-grid">
                            <!-- Dynamically generated truth table -->
                        </div>
                    </div>

                    <!-- Custom Function -->
                    <div class="custom-function-editor" style="display: none;">
                        <h5>Custom Logic Function</h5>
                        <textarea id="custom-function" class="code-editor" rows="10"
                                  placeholder="// JavaScript function
// Parameters: inputs (array)
// Return: output value (0-1 for fuzzy, integer for multi-branch)
function(inputs) {
    // Your logic here
    return 0;
}"></textarea>
                    </div>
                </div>

                <!-- Visual Settings -->
                <div class="config-section visual-section">
                    <h4>Visual Settings</h4>
                    <div class="form-group">
                        <label for="node-color">Color:</label>
                        <input type="color" id="node-color" value="#4A90E2" />
                    </div>
                    <div class="form-group">
                        <label for="node-icon">Icon:</label>
                        <input type="text" id="node-icon" placeholder="Enter symbol or emoji" />
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="config-actions">
                    <button class="btn btn-primary" onclick="treeConfig.saveNode()">Save Changes</button>
                    <button class="btn btn-secondary" onclick="treeConfig.resetForm()">Reset</button>
                    <button class="btn btn-danger" onclick="treeConfig.deleteNode()">Delete Node</button>
                </div>
            </div>
        `;

        this.attachEventListeners();
        this.applyStyles();
    }

    /**
     * Attach event listeners to form elements
     */
    attachEventListeners() {
        // Node type change
        const nodeTypeRadios = document.querySelectorAll('input[name="node-type"]');
        nodeTypeRadios.forEach(radio => {
            radio.addEventListener('change', () => this.onNodeTypeChange(radio.value));
        });

        // Logic type change
        const logicSelect = document.getElementById('logic-type');
        if (logicSelect) {
            logicSelect.addEventListener('change', () => this.onLogicTypeChange(logicSelect.value));
        }

        // Branch count change
        const branchCount = document.getElementById('branch-count');
        if (branchCount) {
            branchCount.addEventListener('change', () => this.updateBranchLabels(branchCount.value));
        }

        // Fuzzy threshold slider
        const fuzzyThreshold = document.getElementById('fuzzy-threshold');
        if (fuzzyThreshold) {
            fuzzyThreshold.addEventListener('input', () => {
                document.getElementById('fuzzy-threshold-value').textContent = fuzzyThreshold.value;
            });
        }
    }

    /**
     * Apply golden ratio based styles
     */
    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .tree-config-panel {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                padding: 2px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 400px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }

            .tree-config-panel > * {
                background: white;
                border-radius: 10px;
            }

            .config-header {
                padding: ${16 * this.phi}px;
                border-bottom: 1px solid #e0e0e0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .config-header h3 {
                margin: 0;
                font-size: ${16 * this.phi}px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                transition: transform 0.2s;
            }

            .close-btn:hover {
                transform: rotate(90deg);
            }

            .config-section {
                padding: ${10 * this.phi}px ${16 * this.phi}px;
                border-bottom: 1px solid #f0f0f0;
            }

            .config-section h4 {
                margin: 0 0 ${10}px 0;
                font-size: 14px;
                color: #333;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .form-group {
                margin-bottom: ${8 * this.phi}px;
            }

            .form-group label {
                display: block;
                margin-bottom: 4px;
                font-size: 13px;
                color: #666;
            }

            .node-input, .node-textarea, .logic-select, .branch-input, .threshold-input {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                transition: border-color 0.2s;
            }

            .node-input:focus, .node-textarea:focus, .logic-select:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .radio-group {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            .radio-group label {
                display: flex;
                align-items: center;
                padding: 8px;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .radio-group label:hover {
                background: #f8f8f8;
            }

            .radio-group input[type="radio"]:checked + label,
            .radio-group label:has(input:checked) {
                background: linear-gradient(135deg, #667eea20, #764ba220);
                border-color: #667eea;
            }

            .branch-labels {
                display: grid;
                gap: 8px;
            }

            .branch-label-input {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .branch-label-input span {
                min-width: 60px;
                font-size: 13px;
                color: #666;
            }

            .code-editor {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 12px;
                background: #f8f8f8;
            }

            .config-actions {
                padding: ${16 * this.phi}px;
                display: flex;
                gap: 8px;
            }

            .btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
                flex: 1;
            }

            .btn-primary {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }

            .btn-secondary {
                background: #f0f0f0;
                color: #333;
            }

            .btn-danger {
                background: #ff4757;
                color: white;
            }

            .truth-table-grid {
                display: grid;
                gap: 4px;
                margin-top: 8px;
            }

            .truth-table-row {
                display: flex;
                gap: 4px;
            }

            .truth-table-cell {
                width: 30px;
                height: 30px;
                border: 1px solid #ddd;
                text-align: center;
                line-height: 30px;
                font-size: 12px;
                cursor: pointer;
            }

            .truth-table-cell.header {
                background: #f0f0f0;
                font-weight: bold;
            }

            .truth-table-cell.editable:hover {
                background: #e8f4ff;
            }

            .probability-input-row {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
            }

            .probability-input-row label {
                min-width: 80px;
                font-size: 13px;
            }

            .probability-input-row input {
                flex: 1;
            }

            .probability-value {
                min-width: 40px;
                text-align: right;
                font-size: 12px;
                color: #666;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Load node configuration into the panel
     */
    loadNode(node, graph) {
        this.currentNode = node;
        this.currentGraph = graph;

        // Basic info
        document.getElementById('node-name').value = node.name || '';
        document.getElementById('node-description').value = node.description || '';

        // Node type
        const nodeTypeRadio = document.querySelector(`input[name="node-type"][value="${node.nodeType}"]`);
        if (nodeTypeRadio) nodeTypeRadio.checked = true;

        // Logic type
        document.getElementById('logic-type').value = node.logicType || 'threshold';

        // Branches
        document.getElementById('branch-count').value = node.branchCount || 2;
        this.updateBranchLabels(node.branchCount);

        // Load branch labels
        if (node.branchLabels) {
            node.branchLabels.forEach((label, index) => {
                const input = document.getElementById(`branch-label-${index}`);
                if (input) input.value = label;
            });
        }

        // Visual settings
        document.getElementById('node-color').value = node.visual?.color || '#4A90E2';
        document.getElementById('node-icon').value = node.visual?.icon || '';

        // Update advanced settings visibility
        this.onNodeTypeChange(node.nodeType);
        this.onLogicTypeChange(node.logicType);

        // Show panel
        this.container.style.display = 'block';
    }

    /**
     * Save node configuration
     */
    saveNode() {
        if (!this.currentNode) return;

        // Update node properties
        this.currentNode.name = document.getElementById('node-name').value;
        this.currentNode.description = document.getElementById('node-description').value;

        // Node type
        const nodeType = document.querySelector('input[name="node-type"]:checked').value;
        this.currentNode.nodeType = nodeType;

        // Logic type
        this.currentNode.logicType = document.getElementById('logic-type').value;

        // Branch configuration
        const branchCount = parseInt(document.getElementById('branch-count').value);
        this.currentNode.branchCount = branchCount;

        // Branch labels
        const branchLabels = [];
        for (let i = 0; i < branchCount; i++) {
            const input = document.getElementById(`branch-label-${i}`);
            if (input) {
                branchLabels.push(input.value);
            }
        }
        this.currentNode.branchLabels = branchLabels;

        // Visual settings
        this.currentNode.visual.color = document.getElementById('node-color').value;
        this.currentNode.visual.icon = document.getElementById('node-icon').value;

        // Advanced settings based on type
        if (nodeType === 'logic_gate' && this.currentNode.logicType.includes('threshold')) {
            const k = document.getElementById('threshold-k');
            if (k) {
                this.currentNode.metadata.threshold = parseInt(k.value);
            }
        }

        if (nodeType === 'fuzzy_gate') {
            const threshold = document.getElementById('fuzzy-threshold');
            if (threshold) {
                this.currentNode.metadata.fuzzyThreshold = parseFloat(threshold.value);
            }
        }

        if (nodeType === 'probabilistic') {
            this.saveProbabilityDistribution();
        }

        if (this.currentNode.logicType === 'truth_table') {
            this.saveTruthTable();
        }

        if (this.currentNode.logicType === 'custom') {
            this.saveCustomFunction();
        }

        // Update visual shape
        this.currentNode.visual.shape = this.currentNode.determineShape();

        // Trigger update callback
        if (this.callbacks.onSave) {
            this.callbacks.onSave(this.currentNode);
        }

        // Show success feedback
        this.showFeedback('Node configuration saved successfully!', 'success');
    }

    /**
     * Delete current node
     */
    deleteNode() {
        if (!this.currentNode || !this.currentGraph) return;

        if (confirm(`Are you sure you want to delete node "${this.currentNode.name}"?`)) {
            this.currentGraph.removeNode(this.currentNode.id);

            if (this.callbacks.onDelete) {
                this.callbacks.onDelete(this.currentNode);
            }

            this.container.style.display = 'none';
            this.currentNode = null;
        }
    }

    /**
     * Reset form to original values
     */
    resetForm() {
        if (this.currentNode && this.currentGraph) {
            this.loadNode(this.currentNode, this.currentGraph);
        }
    }

    /**
     * Handle node type change
     */
    onNodeTypeChange(nodeType) {
        const advancedSection = document.querySelector('.advanced-section');
        const probabilityConfig = document.querySelector('.probability-config');
        const fuzzyParams = document.querySelector('.fuzzy-params');

        // Show/hide relevant sections
        advancedSection.style.display =
            ['logic_gate', 'fuzzy_gate', 'probabilistic'].includes(nodeType) ? 'block' : 'none';

        probabilityConfig.style.display = nodeType === 'probabilistic' ? 'block' : 'none';
        fuzzyParams.style.display = nodeType === 'fuzzy_gate' ? 'block' : 'none';

        // Update logic type options based on node type
        this.updateLogicTypeOptions(nodeType);
    }

    /**
     * Handle logic type change
     */
    onLogicTypeChange(logicType) {
        const thresholdConfig = document.querySelector('.threshold-config');
        const truthTableEditor = document.querySelector('.truth-table-editor');
        const customEditor = document.querySelector('.custom-function-editor');

        // Show/hide relevant configurations
        thresholdConfig.style.display =
            ['threshold', 'exactly', 'at_most'].includes(logicType) ? 'block' : 'none';

        truthTableEditor.style.display = logicType === 'truth_table' ? 'block' : 'none';
        customEditor.style.display = logicType === 'custom' ? 'block' : 'none';

        // Generate truth table if needed
        if (logicType === 'truth_table') {
            this.generateTruthTableEditor();
        }
    }

    /**
     * Update branch labels based on count
     */
    updateBranchLabels(count) {
        const container = document.getElementById('branch-labels');
        if (!container) return;

        let html = '';
        for (let i = 0; i < count; i++) {
            const defaultLabel = this.getDefaultBranchLabel(count, i);
            html += `
                <div class="branch-label-input">
                    <span>Branch ${i + 1}:</span>
                    <input type="text" id="branch-label-${i}"
                           value="${defaultLabel}"
                           class="node-input" />
                </div>
            `;
        }
        container.innerHTML = html;

        // Update probability distribution if needed
        if (this.currentNode?.nodeType === 'probabilistic') {
            this.updateProbabilityInputs(count);
        }
    }

    /**
     * Get default branch label
     */
    getDefaultBranchLabel(count, index) {
        if (count === 2) {
            return index === 0 ? 'False' : 'True';
        } else if (count === 3) {
            return ['Low', 'Medium', 'High'][index];
        } else if (count === 4) {
            return ['Very Low', 'Low', 'High', 'Very High'][index];
        }
        return `Branch ${index + 1}`;
    }

    /**
     * Update logic type options based on node type
     */
    updateLogicTypeOptions(nodeType) {
        const logicSelect = document.getElementById('logic-type');
        if (!logicSelect) return;

        // This would dynamically update options based on node type
        // For now, all options remain available
    }

    /**
     * Generate truth table editor
     */
    generateTruthTableEditor() {
        const container = document.getElementById('truth-table-grid');
        if (!container) return;

        const inputCount = this.currentNode?.inputs?.length || 2;
        const rows = Math.pow(2, inputCount);

        let html = '<div class="truth-table-grid">';

        // Header row
        html += '<div class="truth-table-row">';
        for (let i = 0; i < inputCount; i++) {
            html += `<div class="truth-table-cell header">I${i}</div>`;
        }
        html += '<div class="truth-table-cell header">OUT</div>';
        html += '</div>';

        // Data rows
        for (let row = 0; row < rows; row++) {
            html += '<div class="truth-table-row">';
            for (let col = 0; col < inputCount; col++) {
                const bit = (row >> col) & 1;
                html += `<div class="truth-table-cell">${bit}</div>`;
            }
            html += `<div class="truth-table-cell editable"
                         data-row="${row}"
                         onclick="treeConfig.toggleTruthTableCell(this)">0</div>`;
            html += '</div>';
        }

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Toggle truth table cell value
     */
    toggleTruthTableCell(cell) {
        cell.textContent = cell.textContent === '0' ? '1' : '0';
    }

    /**
     * Update probability distribution inputs
     */
    updateProbabilityInputs(count) {
        const container = document.getElementById('probability-inputs');
        if (!container) return;

        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="probability-input-row">
                    <label>Branch ${i + 1}:</label>
                    <input type="range" id="prob-${i}"
                           min="0" max="1" step="0.01" value="${1/count}"
                           oninput="treeConfig.updateProbabilityDisplay(${i})"/>
                    <span class="probability-value" id="prob-value-${i}">${(1/count).toFixed(2)}</span>
                </div>
            `;
        }
        container.innerHTML = html;
    }

    /**
     * Update probability display
     */
    updateProbabilityDisplay(index) {
        const slider = document.getElementById(`prob-${index}`);
        const display = document.getElementById(`prob-value-${index}`);
        if (slider && display) {
            display.textContent = parseFloat(slider.value).toFixed(2);
            this.normalizeProbabilities();
        }
    }

    /**
     * Normalize probability values to sum to 1
     */
    normalizeProbabilities() {
        const count = this.currentNode?.branchCount || 2;
        const values = [];
        let sum = 0;

        for (let i = 0; i < count; i++) {
            const slider = document.getElementById(`prob-${i}`);
            if (slider) {
                values.push(parseFloat(slider.value));
                sum += parseFloat(slider.value);
            }
        }

        if (sum > 0) {
            for (let i = 0; i < count; i++) {
                const normalized = values[i] / sum;
                const display = document.getElementById(`prob-value-${i}`);
                if (display) {
                    display.textContent = normalized.toFixed(2);
                }
            }
        }
    }

    /**
     * Save probability distribution
     */
    saveProbabilityDistribution() {
        if (!this.currentNode) return;

        const distribution = [];
        const count = this.currentNode.branchCount;
        let sum = 0;

        for (let i = 0; i < count; i++) {
            const slider = document.getElementById(`prob-${i}`);
            if (slider) {
                const value = parseFloat(slider.value);
                distribution.push(value);
                sum += value;
            }
        }

        // Normalize
        if (sum > 0) {
            this.currentNode.probabilityDistribution = distribution.map(v => v / sum);
        }
    }

    /**
     * Save truth table
     */
    saveTruthTable() {
        if (!this.currentNode) return;

        const truthTable = {};
        const cells = document.querySelectorAll('.truth-table-cell.editable');

        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const inputCount = this.currentNode.inputs?.length || 2;

            let key = '';
            for (let i = 0; i < inputCount; i++) {
                key += ((row >> i) & 1) ? '1' : '0';
            }

            truthTable[key] = cell.textContent === '1';
        });

        this.currentNode.truthTable = truthTable;
    }

    /**
     * Save custom function
     */
    saveCustomFunction() {
        if (!this.currentNode) return;

        const codeEditor = document.getElementById('custom-function');
        if (codeEditor) {
            try {
                // Evaluate the function string
                const funcStr = codeEditor.value;
                const func = eval(`(${funcStr})`);

                if (typeof func === 'function') {
                    this.currentNode.customLogicFunction = func;
                    this.currentNode.metadata.customFunctionString = funcStr;
                } else {
                    throw new Error('Invalid function');
                }
            } catch (error) {
                this.showFeedback('Error in custom function: ' + error.message, 'error');
            }
        }
    }

    /**
     * Show feedback message
     */
    showFeedback(message, type = 'info') {
        const feedback = document.createElement('div');
        feedback.className = `feedback feedback-${type}`;
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => feedback.remove(), 300);
        }, 3000);
    }

    /**
     * Register callback
     */
    on(event, callback) {
        this.callbacks[event] = callback;
    }
}

// Create global instance
window.treeConfig = new TreeConfigPanel('tree-config-container');
