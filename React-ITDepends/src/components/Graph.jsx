import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'

export default function Graph({ nodes, links, failedSet, impactedMap, onToggle }) {
  const ref = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()
    const width = 1200
    const height = 900
    svg.attr('viewBox', `0 0 ${width} ${height}`)

    // Use local copies so D3 doesn't mutate the props (links get rewritten to node objects)
    const nodesSim = nodes.map(d => ({ ...d }))
    const linksSim = links.map(l => ({ ...l }))

    // Create a container group for zoom/pan
    const g = svg.append('g')
    containerRef.current = g

    const link = g.append('g').attr('stroke-opacity', 0.8)
      .selectAll('line')
      .data(linksSim)
      .join('line')
      .attr('stroke-width', 2)
      .attr('stroke', d => d.critical ? '#c0392b' : '#e67e22')
      .attr('stroke-dasharray', d => d.critical ? '0' : '6,4')

    const node = g.append('g').selectAll('g')
      .data(nodesSim)
      .join('g')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )

    const getFill = (d) => {
      if (failedSet.has(d.id)) return '#95a5a6'
      const severity = impactedMap.get(d.id)
      if (severity === 'severe') return '#c0392b'
      if (severity === 'moderate') return '#e67e22'
      return '#2ecc71'
    }

    node.append('circle')
      .attr('r', 18)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('fill', getFill)
      .on('click', (event, d) => { onToggle(d.id) })

    node.append('text')
      .text(d => d.label)
      .attr('x', 22)
      .attr('y', 4)
      .attr('font-size', 12)

    const simulation = d3.forceSimulation(nodesSim)
      .force('link', d3.forceLink(linksSim).id(d => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source.x))
        .attr('y1', d => (d.source.y))
        .attr('x2', d => (d.target.x))
        .attr('y2', d => (d.target.y))

      node.attr('transform', d => `translate(${d.x},${d.y})`)
      node.selectAll('circle').attr('fill', getFill)
    })

    // Add zoom behavior
    const zoom = d3.zoom().on('zoom', (event) => {
      g.attr('transform', event.transform)
    })
    svg.call(zoom)

    return () => simulation.stop()
  }, [nodes, links, failedSet, impactedMap, onToggle])

  return <svg ref={ref} style={{ width: '100%', height: 900, border: '1px solid #ddd' }} />
}
