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

    // Color scale based on depth: stories are orange, comments fade from blue to purple
    const getNodeColor = (d: GraphNode): string => {
      if (d.group === 1) return '#f97316'; // Orange for stories
      // Comments: gradient from cyan to purple based on depth
      const depthColors = ['#06b6d4', '#8b5cf6', '#ec4899']; // cyan, violet, pink
      return depthColors[Math.min(d.depth - 1, depthColors.length - 1)] || '#8b5cf6';
    };

    const getNodeRadius = (d: GraphNode): number => {
      if (d.group === 1) return 14; // Stories are largest
      // Comments get smaller with depth
      return Math.max(6, 10 - d.depth * 2);
    };

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(50).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(d => getNodeRadius(d) + 3));

    const link = container.append('g')
      .attr('stroke', '#4b5563')
      .attr('stroke-opacity', 0.4)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 1);

    const node = container.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => getNodeRadius(d))
      .attr('fill', d => getNodeColor(d))
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
        const typeLabel = d.group === 1 ? 'Story' : 'Comment';
        const authorInfo = d.author ? `<div class="text-xs text-gray-400">by ${d.author}</div>` : '';
        tooltip.style('visibility', 'visible')
               .html(`<div class="text-xs text-orange-400 font-semibold">${typeLabel}</div><div class="text-sm mt-1">${d.title}</div>${authorInfo}`)
               .style('left', `${event.pageX + 10}px`)
               .style('top', `${event.pageY + 10}px`);
        
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('r', getNodeRadius(d) + 4)
          .attr('stroke', '#fefce8');
    })
    .on('mouseout', (event, d) => {
        tooltip.style('visibility', 'hidden');
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('r', getNodeRadius(d))
          .attr('stroke', '#1f2937');
    })
    .on('click', (event, d) => {
        // For stories with articleUrl, open that. Otherwise open HN page.
        const urlToOpen = (d.group === 1 && d.articleUrl) ? d.articleUrl : d.hnUrl;
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
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 shadow-lg">
          <div className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">Legend</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-orange-500 border-2 border-gray-900 inline-block"></span>
              <span className="text-sm text-gray-200">Stories</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500 border-2 border-gray-900 inline-block"></span>
              <span className="text-sm text-gray-200">Comments (Depth 1)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 border-2 border-gray-900 inline-block"></span>
              <span className="text-sm text-gray-200">Replies (Depth 2+)</span>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ForceGraph;
