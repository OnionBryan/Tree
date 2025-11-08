
// ============================================================================
// Layout Algorithms
// ============================================================================

/**
 * Tree layout algorithms for different graph types
 */
class TreeLayout {
    /**
     * Hierarchical layout using Sugiyama algorithm
     */
    static hierarchical(graph, options = {}) {
        const defaults = {
            levelSeparation: 150,
            nodeSeparation: 100,
            direction: 'TB', // TB, BT, LR, RL
            centerRoot: true
        };
        const config = { ...defaults, ...options };

        // Layer assignment using longest path
        const layers = this.assignLayers(graph);

        // Position nodes within layers
        const positions = new Map();

        layers.forEach((nodeIds, layer) => {
            const count = nodeIds.length;
            const startX = -(count - 1) * config.nodeSeparation / 2;

            nodeIds.forEach((nodeId, index) => {
                const x = startX + index * config.nodeSeparation;
                const y = layer * config.levelSeparation;

                // Apply direction transformation
                let finalX = x, finalY = y;
                switch(config.direction) {
                    case 'BT': finalY = -y; break;
                    case 'LR': [finalX, finalY] = [y, x]; break;
                    case 'RL': [finalX, finalY] = [-y, x]; break;
                }

                positions.set(nodeId, { x: finalX, y: finalY });

                // Update node position
                const node = graph.nodes.get(nodeId);
                if (node) {
                    node.position = { x: finalX, y: finalY };
                }
            });
        });

        return positions;
    }

    /**
     * Radial tree layout
     */
    static radial(graph, options = {}) {
        const defaults = {
            radius: 100,
            startAngle: 0,
            endAngle: 2 * Math.PI,
            centerX: 0,
            centerY: 0
        };
        const config = { ...defaults, ...options };

        const positions = new Map();
        const layers = this.assignLayers(graph);

        layers.forEach((nodeIds, layer) => {
            if (layer === 0) {
                // Root at center
                nodeIds.forEach(nodeId => {
                    positions.set(nodeId, {
                        x: config.centerX,
                        y: config.centerY
                    });
                });
            } else {
                // Distribute nodes around circle
                const r = layer * config.radius;
                const angleStep = (config.endAngle - config.startAngle) / nodeIds.length;

                nodeIds.forEach((nodeId, index) => {
                    const angle = config.startAngle + index * angleStep;
                    positions.set(nodeId, {
                        x: config.centerX + r * Math.cos(angle),
                        y: config.centerY + r * Math.sin(angle)
                    });
                });
            }
        });

        return positions;
    }

    /**
     * Force-directed layout using Fruchterman-Reingold algorithm
     */
    static forceDirected(graph, options = {}) {
        const defaults = {
            iterations: 500,
            idealLength: 100,
            temperature: 100,
            cooling: 0.95,
            minTemp: 0.01
        };
        const config = { ...defaults, ...options };

        // Initialize random positions
        const positions = new Map();
        for (const [nodeId] of graph.nodes) {
            positions.set(nodeId, {
                x: Math.random() * 500 - 250,
                y: Math.random() * 500 - 250
            });
        }

        let temp = config.temperature;

        for (let iter = 0; iter < config.iterations && temp > config.minTemp; iter++) {
            const forces = new Map();

            // Calculate repulsive forces between all nodes
            for (const [id1, pos1] of positions) {
                let fx = 0, fy = 0;

                for (const [id2, pos2] of positions) {
                    if (id1 === id2) continue;

                    const dx = pos1.x - pos2.x;
                    const dy = pos1.y - pos2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;

                    const repulsion = (config.idealLength * config.idealLength) / dist;
                    fx += (dx / dist) * repulsion;
                    fy += (dy / dist) * repulsion;
                }

                forces.set(id1, { x: fx, y: fy });
            }

            // Calculate attractive forces for edges
            for (const [, edge] of graph.edges) {
                const pos1 = positions.get(edge.source);
                const pos2 = positions.get(edge.target);
                if (!pos1 || !pos2) continue;

                const dx = pos2.x - pos1.x;
                const dy = pos2.y - pos1.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;

                const attraction = (dist * dist) / config.idealLength;
                const fx = (dx / dist) * attraction;
                const fy = (dy / dist) * attraction;

                const f1 = forces.get(edge.source);
                const f2 = forces.get(edge.target);

                f1.x += fx;
                f1.y += fy;
                f2.x -= fx;
                f2.y -= fy;
            }

            // Apply forces with temperature
            for (const [nodeId, force] of forces) {
                const pos = positions.get(nodeId);
                const fMag = Math.sqrt(force.x * force.x + force.y * force.y) || 0.01;
                const scale = Math.min(temp, fMag) / fMag;

                pos.x += force.x * scale;
                pos.y += force.y * scale;
            }

            temp *= config.cooling;
        }

        return positions;
    }

    /**
     * Assign nodes to layers for hierarchical layout
     */
    static assignLayers(graph) {
        const layers = new Map();
        const visited = new Set();

        // Find root nodes (no parents)
        const roots = [];
        for (const [nodeId, node] of graph.nodes) {
            if (node.parents.length === 0) {
                roots.push(nodeId);
            }
        }

        // BFS to assign layers
        const queue = roots.map(id => ({ id, layer: 0 }));

        while (queue.length > 0) {
            const { id, layer } = queue.shift();

            if (visited.has(id)) continue;
            visited.add(id);

            if (!layers.has(layer)) {
                layers.set(layer, []);
            }
            layers.get(layer).push(id);

            const node = graph.nodes.get(id);
            if (node) {
                for (const childId of node.children) {
                    if (!visited.has(childId)) {
                        queue.push({ id: childId, layer: layer + 1 });
                    }
                }
            }
        }

        return layers;
    }
}
