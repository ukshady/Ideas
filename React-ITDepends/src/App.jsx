import React, { useState, useMemo } from 'react'
import Graph from './components/Graph'
import data from './data/sample.json'

export default function App() {
  const [failedSet, setFailedSet] = useState(new Set())

  const [nodes, setNodes] = useState(() => {
    try {
      const raw = localStorage.getItem('itdepends_nodes')
      return raw ? JSON.parse(raw) : data.nodes
    } catch (e) { return data.nodes }
  })

  const [links, setLinks] = useState(() => {
    try {
      const raw = localStorage.getItem('itdepends_links')
      return raw ? JSON.parse(raw) : data.links
    } catch (e) { return data.links }
  })

  const persist = (nextNodes, nextLinks) => {
    try {
      localStorage.setItem('itdepends_nodes', JSON.stringify(nextNodes))
      localStorage.setItem('itdepends_links', JSON.stringify(nextLinks))
    } catch (e) { }
  }

  const toggleFailure = (id) => {
    setFailedSet(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const impacted = useMemo(() => {
    const impactMap = new Map()
    const queue = [...failedSet].map(id => ({ id, severity: 'moderate' }))

    while (queue.length) {
      const { id: cur, severity: parentSeverity } = queue.shift()
      for (const l of links) {
        if (l.source !== cur) continue
        if (failedSet.has(l.target)) continue

        const dependencySeverity = l.critical ? 'severe' : 'moderate'
        const nextSeverity = parentSeverity === 'severe' || dependencySeverity === 'severe' ? 'severe' : 'moderate'
        const previous = impactMap.get(l.target)
        if (previous === 'severe') continue
        if (previous === 'moderate' && nextSeverity === 'moderate') continue

        impactMap.set(l.target, nextSeverity)
        queue.push({ id: l.target, severity: nextSeverity })
      }
    }

    return impactMap
  }, [failedSet, links])

  const impactedBusiness = nodes.filter(n => n.type === 'business' && impacted.has(n.id))

  // form state for adding nodes/links
  const [newId, setNewId] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState('infra')

  const [linkSource, setLinkSource] = useState('')
  const [linkTarget, setLinkTarget] = useState('')
  const [linkCritical, setLinkCritical] = useState('critical')

  const addNode = () => {
    const id = newId.trim()
    const label = newLabel.trim() || id
    if (!id) return alert('Please enter an id')
    if (nodes.find(n => n.id === id)) return alert('id already exists')
    const next = [...nodes, { id, label, type: newType }]
    setNodes(next)
    persist(next, links)
    setNewId('')
    setNewLabel('')
  }

  const addLink = () => {
    const s = linkSource.trim()
    const t = linkTarget.trim()
    if (!s || !t) return alert('Please select source and target')
    if (!nodes.find(n => n.id === s) || !nodes.find(n => n.id === t)) return alert('source/target must exist')
    if (links.find(l => l.source === s && l.target === t)) return alert('link already exists')
    const next = [...links, { source: s, target: t, critical: linkCritical === 'critical' }]
    setLinks(next)
    persist(nodes, next)
    setLinkSource('')
    setLinkTarget('')
    setLinkCritical('critical')
  }

  const removeLink = (source, target) => {
    const next = links.filter(l => !(l.source === source && l.target === target))
    setLinks(next)
    persist(nodes, next)
  }

  const removeNode = (id) => {
    const nextNodes = nodes.filter(n => n.id !== id)
    const nextLinks = links.filter(l => l.source !== id && l.target !== id)
    setNodes(nextNodes)
    setLinks(nextLinks)
    persist(nextNodes, nextLinks)
    setFailedSet(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const [search, setSearch] = useState('')

  const filteredNodes = useMemo(() => {
    if (!search.trim()) return nodes
    const query = search.toLowerCase()
    const matched = nodes.filter(n => n.id.toLowerCase().includes(query) || n.label.toLowerCase().includes(query))
    
    // Expand to include upstream and downstream dependencies
    const expanded = new Set(matched.map(n => n.id))
    const queue = [...expanded]
    
    while (queue.length) {
      const current = queue.shift()
      // Add upstream (nodes that current depends on)
      for (const l of links) {
        if (l.target === current && !expanded.has(l.source)) {
          expanded.add(l.source)
          queue.push(l.source)
        }
      }
      // Add downstream (nodes that depend on current)
      for (const l of links) {
        if (l.source === current && !expanded.has(l.target)) {
          expanded.add(l.target)
          queue.push(l.target)
        }
      }
    }
    
    return nodes.filter(n => expanded.has(n.id))
  }, [search, nodes, links])

  const filteredLinks = useMemo(() => {
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id))
    return links.filter(l => filteredNodeIds.has(l.source) && filteredNodeIds.has(l.target))
  }, [filteredNodes, links])

  return (
    <div style={{ padding: 16, fontFamily: 'Arial, sans-serif' }}>
      <h1>IT Depends — Dependency Simulator</h1>
      <p>Click a node to toggle an outage. Grey = failed, orange = impacted by non-critical dependency, red = severely impacted by critical dependency, green = healthy.</p>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h3>Add Service</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input placeholder="id" value={newId} onChange={e => setNewId(e.target.value)} />
            <input placeholder="label" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
            <select value={newType} onChange={e => setNewType(e.target.value)}>
              <option value="infra">infra</option>
              <option value="business">business</option>
            </select>
            <button onClick={addNode}>Add</button>
          </div>

          <h3>Add Dependency</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <select value={linkSource} onChange={e => setLinkSource(e.target.value)}>
              <option value="">source</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.id})</option>)}
            </select>
            <select value={linkTarget} onChange={e => setLinkTarget(e.target.value)}>
              <option value="">target</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.id})</option>)}
            </select>
            <select value={linkCritical} onChange={e => setLinkCritical(e.target.value)}>
              <option value="critical">critical</option>
              <option value="non-critical">non-critical</option>
            </select>
            <button onClick={addLink}>Add link</button>
          </div>

          <div style={{ marginTop: 12 }}>
            <h3>Existing Services</h3>
            <ul style={{ paddingLeft: 18, margin: '8px 0', maxHeight: 150, overflow: 'auto' }}>
              {nodes.length === 0 ? <li style={{ fontStyle: 'italic' }}>none</li> : nodes.map(n => (
                <li key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span>{n.label} ({n.id}) [{n.type}]</span>
                  <button onClick={() => removeNode(n.id)}>Remove</button>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: 12 }}>
            <h3>Existing Dependencies</h3>
            <ul style={{ paddingLeft: 18, margin: '8px 0' }}>
              {links.length === 0 ? <li style={{ fontStyle: 'italic' }}>none</li> : links.map((l, index) => (
                <li key={`${l.source}-${l.target}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span>{l.source} → {l.target} ({l.critical ? 'critical' : 'non-critical'})</span>
                  <button onClick={() => removeLink(l.source, l.target)}>Remove</button>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: 12 }}>
            <h3>Search/Filter</h3>
            <input 
              placeholder="Search by service id or name..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: 6 }}
            />
            {search && <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>Showing {filteredNodes.length} of {nodes.length} services</div>}
          </div>

          <div style={{ marginTop: 12 }}>
            <h3>Controls & Results</h3>
            <div><strong>Failed:</strong> {Array.from(failedSet).join(', ') || 'none'}</div>
            <div><strong>Impacted business services:</strong> {impactedBusiness.map(n => n.label).join(', ') || 'none'}</div>
          </div>
        </div>

        <div style={{ flex: 3 }}>
          <Graph nodes={filteredNodes} links={filteredLinks} failedSet={failedSet} impactedMap={impacted} onToggle={toggleFailure} />
        </div>
      </div>
    </div>
  )
}
