import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { GraphData, GraphNode, GraphLink } from '../types';

interface ForceGraphProps {
  data: GraphData;
}

const ForceGraph: React.FC<ForceGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const parent = svg.node()!.parentElement!;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    svg.attr('width', width).attr('height', height).attr('viewBox', [0, 0, width, height]);

    // Make copies to avoid mutating props
    const nodes = data.nodes.map(d => ({ ...d }));
    const links = data.links.map(d => ({ ...d }));
    
    const container = svg.append("g");

    const color = d3.scaleOrdinal()
      .domain(['1', '2', '3']) // 1: Story, 2: Author, 3: Domain
      .range(['#f97316', '#3b82f6', '#22c55e']); // Orange, Blue, Green

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(60).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(d => {
        if (d.group === 1) return 12 + 2; // Story
        if (d.group === 3) return 8 + 2;  // Domain
        return 5 + 2; // Author
      }));

    const link = container.append('g')
      .attr('stroke', '#4b5563')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 1);

    const node = container.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => {
        if (d.group === 1) return 12; // Story
        if (d.group === 3) return 8;  // Domain
        return 5;  // Author
      })
      .attr('fill', d => color(d.group.toString()) as string)
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2);
    
    node.append('title').text(d => d.title);

    // Drag functionality
    const drag = <T extends d3.SimulationNodeDatum,>(simulation: d3.Simulation<T, undefined>) => {
      function dragstarted(event: d3.D3DragEvent<Element, T, T>, d: T) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      function dragged(event: d3.D3DragEvent<Element, T, T>, d: T) {
        d.fx = event.x;
        d.fy = event.y;
      }
      function dragended(event: d3.D3DragEvent<Element, T, T>, d: T) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      return d3.drag<any, T>().on('start', dragstarted).on('drag', dragged).on('end', dragended);
    }
    
    node.call(drag(simulation));

    // Tooltip
    const tooltip = d3.select(tooltipRef.current);
    node.on('mouseover', (event, d) => {
        tooltip.style('visibility', 'visible')
               .html(`<div class="text-sm">${d.title}</div>`)
               .style('left', `${event.pageX + 10}px`)
               .style('top', `${event.pageY + 10}px`);
        
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('r', (d.group === 1 ? 18 : (d.group === 3 ? 12 : 9)))
          .attr('stroke', '#fefce8');
    })
    .on('mouseout', (event, d) => {
        tooltip.style('visibility', 'hidden');
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('r', (d.group === 1 ? 12 : (d.group === 3 ? 8 : 5)))
          .attr('stroke', '#1f2937');
    })
    .on('click', (event, d) => {
        // For stories and domains, open articleUrl. For authors, open hnUrl.
        const urlToOpen = d.group === 2 ? d.hnUrl : d.articleUrl;
        if (urlToOpen) {
            window.open(urlToOpen, '_blank');
        }
    });

    // Zoom functionality
    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 8])
        .on('zoom', (event) => {
            container.attr('transform', event.transform);
        });
    
    svg.call(zoom);

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as unknown as GraphNode).x!)
        .attr('y1', d => (d.source as unknown as GraphNode).y!)
        .attr('x2', d => (d.target as unknown as GraphNode).x!)
        .attr('y2', d => (d.target as unknown as GraphNode).y!);

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);
    });

  }, [data]);

  return (
    <div className="w-full h-full relative">
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>
        <div 
            ref={tooltipRef} 
            className="absolute p-2 text-white bg-gray-800 border border-gray-600 rounded-md shadow-lg pointer-events-none"
            style={{ visibility: 'hidden', maxWidth: '300px' }}
        ></div>
    </div>
  );
};

export default ForceGraph;
