import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { getColorForValue } from '../lib/DecisionTree';
import './D3TreeVisualization.css';

const D3TreeVisualization = ({
  treeBuilder,
  mode = 'standard',
  onNodeClick,
  currentScale,
  showTooltips = true,
  nodeSize = 120,
  animationSpeed = 500
}) => {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });

  useEffect(() => {
    if (!treeBuilder || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const rootNode = treeBuilder.getRootNode();
    if (!rootNode) return;

    switch (mode) {
      case 'standard':
        renderStandardTree(svg, rootNode, dimensions, nodeSize, animationSpeed, currentScale, onNodeClick, showTooltips);
        break;
      case 'radial':
        renderRadialTree(svg, rootNode, dimensions, nodeSize, animationSpeed, currentScale, onNodeClick);
        break;
      case 'distribution':
        renderDistribution(svg, treeBuilder, dimensions, currentScale);
        break;
      case 'heatmap':
        renderHeatmap(svg, treeBuilder, dimensions, currentScale);
        break;
      case 'tanh':
        renderTanhCurve(svg, currentScale, dimensions);
        break;
      case 'clustering':
        renderClustering(svg, treeBuilder, dimensions, currentScale);
        break;
      default:
        renderStandardTree(svg, rootNode, dimensions, nodeSize, animationSpeed, currentScale, onNodeClick, showTooltips);
    }
  }, [treeBuilder, mode, dimensions, nodeSize, animationSpeed, currentScale, onNodeClick, showTooltips]);

  return (
    <div className="d3-tree-container">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
    </div>
  );
};

function renderStandardTree(svg, rootNode, dimensions, nodeSize, animationSpeed, currentScale, onNodeClick, showTooltips) {
  const { width, height } = dimensions;

  const treeLayout = d3.tree().size([width - 200, height - 200]);

  const root = d3.hierarchy(rootNode, d => {
    const children = [];
    if (d.left) children.push(d.left);
    if (d.right) children.push(d.right);
    return children.length > 0 ? children : null;
  });

  const treeData = treeLayout(root);

  const g = svg.append('g').attr('transform', `translate(100, 100)`);

  // Links
  g.selectAll('.link')
    .data(treeData.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', d3.linkVertical()
      .x(d => d.x)
      .y(d => d.y))
    .style('fill', 'none')
    .style('stroke', '#999')
    .style('stroke-width', 2)
    .style('stroke-dasharray', '5,5');

  // Nodes
  const nodes = g.selectAll('.node')
    .data(treeData.descendants())
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.x}, ${d.y})`)
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      if (onNodeClick) onNodeClick(d.data);
    });

  nodes.append('rect')
    .attr('x', -nodeSize / 2)
    .attr('y', -40)
    .attr('width', nodeSize)
    .attr('height', 80)
    .attr('rx', 10)
    .style('fill', d => getColorForValue(d.data.score, currentScale))
    .style('stroke', '#fff')
    .style('stroke-width', 2)
    .style('opacity', 0)
    .transition()
    .duration(animationSpeed)
    .style('opacity', 1);

  nodes.append('text')
    .attr('dy', -10)
    .attr('text-anchor', 'middle')
    .style('fill', 'white')
    .style('font-weight', '600')
    .style('font-size', '12px')
    .text(d => d.data.question.length > 15 ? d.data.question.substring(0, 15) + '...' : d.data.question);

  nodes.append('text')
    .attr('dy', 10)
    .attr('text-anchor', 'middle')
    .style('fill', 'white')
    .style('font-weight', 'bold')
    .style('font-size', '14px')
    .text(d => `Score: ${d.data.score.toFixed(1)}`);

  nodes.append('text')
    .attr('dy', 28)
    .attr('text-anchor', 'middle')
    .style('fill', 'rgba(255,255,255,0.8)')
    .style('font-size', '10px')
    .text(d => `Threshold: ${d.data.threshold.toFixed(1)}`);

  if (showTooltips) {
    nodes.append('title')
      .text(d => `${d.data.question}\nScore: ${d.data.score}\nThreshold: ${d.data.threshold}\nDepth: ${d.data.depth}`);
  }
}

function renderRadialTree(svg, rootNode, dimensions, nodeSize, animationSpeed, currentScale, onNodeClick) {
  const { width, height } = dimensions;
  const radius = Math.min(width, height) / 2 - 100;

  const tree = d3.tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

  const root = d3.hierarchy(rootNode, d => {
    const children = [];
    if (d.left) children.push(d.left);
    if (d.right) children.push(d.right);
    return children.length > 0 ? children : null;
  });

  const treeData = tree(root);

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`);

  // Links
  g.selectAll('.link')
    .data(treeData.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', d3.linkRadial()
      .angle(d => d.x)
      .radius(d => d.y))
    .style('fill', 'none')
    .style('stroke', '#999')
    .style('stroke-width', 2);

  // Nodes
  const nodes = g.selectAll('.node')
    .data(treeData.descendants())
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y}, 0)`)
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      if (onNodeClick) onNodeClick(d.data);
    });

  nodes.append('circle')
    .attr('r', 30)
    .style('fill', d => getColorForValue(d.data.score, currentScale))
    .style('stroke', '#fff')
    .style('stroke-width', 2);

  nodes.append('text')
    .attr('dy', 5)
    .attr('x', d => d.x < Math.PI === !d.children ? 40 : -40)
    .attr('text-anchor', d => d.x < Math.PI === !d.children ? 'start' : 'end')
    .attr('transform', d => d.x >= Math.PI ? 'rotate(180)' : null)
    .style('fill', 'white')
    .style('font-size', '12px')
    .text(d => d.data.question);
}

function renderDistribution(svg, treeBuilder, dimensions, currentScale) {
  const { width, height } = dimensions;
  const allNodes = treeBuilder.getAllNodes();
  const scores = allNodes.map(n => n.score);

  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // Create histogram
  const histogram = d3.histogram()
    .domain([currentScale.min, currentScale.max])
    .thresholds(20);

  const bins = histogram(scores);

  const x = d3.scaleLinear()
    .domain([currentScale.min, currentScale.max])
    .range([0, chartWidth]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)])
    .range([chartHeight, 0]);

  // Draw bars
  g.selectAll('rect')
    .data(bins)
    .enter()
    .append('rect')
    .attr('x', d => x(d.x0) + 1)
    .attr('y', d => y(d.length))
    .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 2))
    .attr('height', d => chartHeight - y(d.length))
    .style('fill', d => getColorForValue((d.x0 + d.x1) / 2, currentScale))
    .style('opacity', 0.7);

  // X axis
  g.append('g')
    .attr('transform', `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(x))
    .style('color', '#666');

  // Y axis
  g.append('g')
    .call(d3.axisLeft(y))
    .style('color', '#666');

  // Title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#333')
    .text('Score Distribution');
}

function renderHeatmap(svg, treeBuilder, dimensions, currentScale) {
  const { width, height } = dimensions;
  const allNodes = treeBuilder.getAllNodes();

  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const cellSize = 50;

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // Group by depth
  const byDepth = d3.group(allNodes, d => d.depth);
  const maxDepth = d3.max(allNodes, d => d.depth);

  byDepth.forEach((nodes, depth) => {
    nodes.forEach((node, index) => {
      g.append('rect')
        .attr('x', depth * cellSize)
        .attr('y', index * cellSize)
        .attr('width', cellSize - 2)
        .attr('height', cellSize - 2)
        .style('fill', getColorForValue(node.score, currentScale))
        .style('stroke', '#fff')
        .style('stroke-width', 1)
        .append('title')
        .text(`${node.question}\nScore: ${node.score}`);

      g.append('text')
        .attr('x', depth * cellSize + cellSize / 2)
        .attr('y', index * cellSize + cellSize / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('fill', 'white')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .text(node.score.toFixed(1));
    });
  });

  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#333')
    .text('Path Heatmap');
}

function renderTanhCurve(svg, currentScale, dimensions) {
  const { width, height } = dimensions;
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const x = d3.scaleLinear()
    .domain([currentScale.min, currentScale.max])
    .range([0, chartWidth]);

  const y = d3.scaleLinear()
    .domain([-1, 1])
    .range([chartHeight, 0]);

  const data = d3.range(currentScale.min, currentScale.max, 0.1).map(val => ({
    x: val,
    y: Math.tanh(val)
  }));

  const line = d3.line()
    .x(d => x(d.x))
    .y(d => y(d.y))
    .curve(d3.curveMonotoneX);

  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#0039A6')
    .attr('stroke-width', 3)
    .attr('d', line);

  g.append('g')
    .attr('transform', `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(x))
    .style('color', '#666');

  g.append('g')
    .call(d3.axisLeft(y))
    .style('color', '#666');

  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#333')
    .text('Tanh Transformation Curve');
}

function renderClustering(svg, treeBuilder, dimensions, currentScale) {
  const { width, height } = dimensions;
  const allNodes = treeBuilder.getAllNodes();

  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const x = d3.scaleLinear()
    .domain([0, d3.max(allNodes, d => d.depth) + 1])
    .range([0, chartWidth]);

  const y = d3.scaleLinear()
    .domain([currentScale.min, currentScale.max])
    .range([chartHeight, 0]);

  allNodes.forEach(node => {
    g.append('circle')
      .attr('cx', x(node.depth + Math.random() * 0.5))
      .attr('cy', y(node.score))
      .attr('r', 8)
      .style('fill', getColorForValue(node.score, currentScale))
      .style('opacity', 0.7)
      .style('stroke', '#fff')
      .style('stroke-width', 1)
      .append('title')
      .text(`${node.question}\nScore: ${node.score}\nDepth: ${node.depth}`);
  });

  g.append('g')
    .attr('transform', `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(x))
    .style('color', '#666');

  g.append('g')
    .call(d3.axisLeft(y))
    .style('color', '#666');

  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#333')
    .text('Node Clustering Analysis');
}

export default D3TreeVisualization;
