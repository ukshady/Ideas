const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
const port = process.env.PORT || 4000
const dataFile = path.join(process.cwd(), 'graph-data.json')

const defaultData = {
  nodes: [
    { id: 'entra', label: 'Entra ID', type: 'infra' },
    { id: 'sql', label: 'Azure SQL', type: 'infra' },
    { id: 'app', label: 'App Service', type: 'infra' },
    { id: 'auth-service', label: 'Auth Service', type: 'infra' },
    { id: 'customer-portal', label: 'Customer Portal', type: 'business' },
    { id: 'billing', label: 'Billing Service', type: 'business' },
    { id: 'reporting', label: 'Reporting', type: 'business' }
  ],
  links: [
    { source: 'entra', target: 'auth-service', critical: true },
    { source: 'auth-service', target: 'customer-portal', critical: true },
    { source: 'app', target: 'customer-portal', critical: false },
    { source: 'sql', target: 'billing', critical: true },
    { source: 'auth-service', target: 'billing', critical: false },
    { source: 'sql', target: 'reporting', critical: false },
    { source: 'billing', target: 'reporting', critical: true }
  ]
}

function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      return JSON.parse(fs.readFileSync(dataFile, 'utf8'))
    }
  } catch (error) {
    console.error('Failed to load graph data:', error)
  }
  return defaultData
}

function saveData(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8')
  } catch (error) {
    console.error('Failed to save graph data:', error)
  }
}

app.use(cors())
app.use(express.json())

app.get('/api/graph', (req, res) => {
  res.json(loadData())
})

app.post('/api/graph', (req, res) => {
  const { nodes, links } = req.body
  if (!Array.isArray(nodes) || !Array.isArray(links)) {
    return res.status(400).json({ error: 'nodes and links are required arrays' })
  }
  saveData({ nodes, links })
  res.json({ ok: true })
})

app.listen(port, () => {
  console.log('IT Depends backend running at http://localhost:' + port)
})
