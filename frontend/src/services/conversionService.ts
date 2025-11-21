/**
 * Conversion Service for Mermaid ↔ Draw.io
 *
 * This service provides basic conversion between Mermaid and Draw.io formats.
 * Note: Conversions are best-effort and may not preserve all formatting/styling.
 */

import { DiagramFormat } from '../types/diagram'

interface MermaidNode {
  id: string
  label: string
  shape: 'rectangle' | 'rounded' | 'diamond' | 'ellipse'
}

interface MermaidEdge {
  from: string
  to: string
  label?: string
}

export const conversionService = {
  /**
   * Parse simple Mermaid flowchart syntax
   * This is a basic parser for demonstration - a full parser would be more complex
   */
  parseMermaidFlowchart(mermaidCode: string): { nodes: MermaidNode[]; edges: MermaidEdge[] } {
    const nodes: MermaidNode[] = []
    const edges: MermaidEdge[] = []
    const lines = mermaidCode.split('\n').map((l) => l.trim())

    const nodeMap = new Map<string, MermaidNode>()

    // Helper function to extract node info from a node reference like "A[Label]" or "B{Decision}"
    const extractNode = (nodeRef: string): { id: string; label: string; shape: MermaidNode['shape'] } | null => {
      // Match patterns like: A[Label], B{Decision}, C([Rounded]), D((Circle))
      const match = nodeRef.match(/^([A-Za-z0-9_]+)(\[|\{|\(\[|\(\()(.*?)(\]|\}|\]\)|\)\))$/)
      if (match) {
        const [, id, leftBracket, label] = match
        let shape: MermaidNode['shape'] = 'rectangle'

        if (leftBracket === '((' ) shape = 'ellipse'
        else if (leftBracket === '{') shape = 'diamond'
        else if (leftBracket === '([') shape = 'rounded'
        else shape = 'rectangle'

        return { id, label, shape }
      }
      return null
    }

    for (const line of lines) {
      if (!line || line.startsWith('flowchart') || line.startsWith('graph')) continue

      // Parse edges with inline node definitions: A[Label] --> B[Label2] or A -->|EdgeLabel| B
      // This regex handles: NodeDef Arrow NodeDef or NodeDef Arrow|Label| NodeDef
      const edgeMatch = line.match(/^([A-Za-z0-9_]+(?:\[.*?\]|\{.*?\}|\(\[.*?\]\)|\(\(.*?\)\))?)\s*(-->|->)(?:\|([^|]+)\|)?\s*([A-Za-z0-9_]+(?:\[.*?\]|\{.*?\}|\(\[.*?\]\)|\(\(.*?\)\))?)$/)

      if (edgeMatch) {
        const [, fromRef, , edgeLabel, toRef] = edgeMatch

        // Extract from node
        let fromNode = extractNode(fromRef)
        if (!fromNode) {
          // If no brackets, it's just an ID
          const idMatch = fromRef.match(/^([A-Za-z0-9_]+)$/)
          if (idMatch) {
            fromNode = { id: idMatch[1], label: idMatch[1], shape: 'rectangle' }
          }
        }

        // Extract to node
        let toNode = extractNode(toRef)
        if (!toNode) {
          // If no brackets, it's just an ID
          const idMatch = toRef.match(/^([A-Za-z0-9_]+)$/)
          if (idMatch) {
            toNode = { id: idMatch[1], label: idMatch[1], shape: 'rectangle' }
          }
        }

        if (fromNode && toNode) {
          // Add nodes if they don't exist
          if (!nodeMap.has(fromNode.id)) {
            nodes.push(fromNode)
            nodeMap.set(fromNode.id, fromNode)
          }
          if (!nodeMap.has(toNode.id)) {
            nodes.push(toNode)
            nodeMap.set(toNode.id, toNode)
          }

          // Add edge
          edges.push({
            from: fromNode.id,
            to: toNode.id,
            label: edgeLabel?.trim() || undefined
          })
        }
        continue
      }

      // Parse standalone node definitions like: A[Label] (without arrows)
      const nodeInfo = extractNode(line)
      if (nodeInfo && !nodeMap.has(nodeInfo.id)) {
        nodes.push(nodeInfo)
        nodeMap.set(nodeInfo.id, nodeInfo)
      }
    }

    return { nodes, edges }
  },

  /**
   * Convert Mermaid flowchart to Draw.io XML
   */
  mermaidToDrawio(mermaidCode: string): string {
    try {
      const { nodes, edges } = this.parseMermaidFlowchart(mermaidCode)

      let cellId = 2
      const nodeIdMap = new Map<string, number>()

      // Generate XML
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
      xml += `<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="ConversionService" version="21.0.0">\n`
      xml += `  <diagram name="Converted Diagram" id="diagram-1">\n`
      xml += `    <mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169">\n`
      xml += `      <root>\n`
      xml += `        <mxCell id="0" />\n`
      xml += `        <mxCell id="1" parent="0" />\n`

      // Add nodes
      let yPos = 100
      for (const node of nodes) {
        const nodeId = cellId++
        nodeIdMap.set(node.id, nodeId)

        const style = this.getDrawioStyle(node.shape)
        const width = 120
        const height = node.shape === 'diamond' ? 80 : 60
        const xPos = 300

        xml += `        <mxCell id="${nodeId}" value="${this.escapeXml(node.label)}" style="${style}" vertex="1" parent="1">\n`
        xml += `          <mxGeometry x="${xPos}" y="${yPos}" width="${width}" height="${height}" as="geometry" />\n`
        xml += `        </mxCell>\n`

        yPos += 120
      }

      // Add edges
      for (const edge of edges) {
        const sourceId = nodeIdMap.get(edge.from)
        const targetId = nodeIdMap.get(edge.to)

        if (sourceId && targetId) {
          const edgeId = cellId++
          const edgeStyle =
            'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;endArrow=classic;'

          xml += `        <mxCell id="${edgeId}" value="${this.escapeXml(edge.label || '')}" style="${edgeStyle}" edge="1" parent="1" source="${sourceId}" target="${targetId}">\n`
          xml += `          <mxGeometry relative="1" as="geometry" />\n`
          xml += `        </mxCell>\n`
        }
      }

      xml += `      </root>\n`
      xml += `    </mxGraphModel>\n`
      xml += `  </diagram>\n`
      xml += `</mxfile>`

      return xml
    } catch (error) {
      throw new Error(`Mermaid to Draw.io conversion failed: ${error}`)
    }
  },

  /**
   * Convert Draw.io XML to Mermaid flowchart
   * This is a basic converter - full conversion would require XML parsing library
   */
  drawioToMermaid(drawioXml: string): string {
    try {
      // This is a simplified conversion
      // In production, use DOMParser to parse XML properly
      const parser = new DOMParser()
      const doc = parser.parseFromString(drawioXml, 'text/xml')

      const cells = doc.querySelectorAll('mxCell[vertex="1"]')
      const edges = doc.querySelectorAll('mxCell[edge="1"]')

      let mermaid = 'flowchart TD\n'

      // Extract nodes
      const nodeMap = new Map<string, string>()
      cells.forEach((cell) => {
        const id = cell.getAttribute('id')
        const value = cell.getAttribute('value') || `Node${id}`
        const style = cell.getAttribute('style') || ''

        if (id) {
          const nodeId = `N${id}`
          nodeMap.set(id, nodeId)

          // Determine shape from style
          let bracket = '[]'
          if (style.includes('rhombus') || style.includes('diamond')) {
            bracket = '{}'
          } else if (style.includes('ellipse') || style.includes('rounded')) {
            bracket = '([])'
          }

          mermaid += `    ${nodeId}${bracket[0]}${value}${bracket[bracket.length - 1]}\n`
        }
      })

      // Extract edges
      edges.forEach((edge) => {
        const source = edge.getAttribute('source')
        const target = edge.getAttribute('target')
        const value = edge.getAttribute('value')

        if (source && target) {
          const sourceNode = nodeMap.get(source)
          const targetNode = nodeMap.get(target)

          if (sourceNode && targetNode) {
            if (value && value.trim()) {
              mermaid += `    ${sourceNode} -->|${value}| ${targetNode}\n`
            } else {
              mermaid += `    ${sourceNode} --> ${targetNode}\n`
            }
          }
        }
      })

      return mermaid
    } catch (error) {
      throw new Error(`Draw.io to Mermaid conversion failed: ${error}`)
    }
  },

  /**
   * Convert between formats
   */
  convert(code: string, fromFormat: DiagramFormat, toFormat: DiagramFormat): string {
    if (fromFormat === toFormat) return code

    if (fromFormat === DiagramFormat.MERMAID && toFormat === DiagramFormat.DRAWIO) {
      return this.mermaidToDrawio(code)
    } else if (fromFormat === DiagramFormat.DRAWIO && toFormat === DiagramFormat.MERMAID) {
      return this.drawioToMermaid(code)
    }

    throw new Error(`Unsupported conversion: ${fromFormat} to ${toFormat}`)
  },

  /**
   * Get Draw.io style based on shape
   */
  getDrawioStyle(shape: string): string {
    const styles: Record<string, string> = {
      rectangle: 'rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;',
      rounded: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;',
      diamond: 'rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;',
      ellipse: 'ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;',
    }
    return styles[shape] || styles.rectangle
  },

  /**
   * Escape XML special characters
   */
  escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  },
}

export default conversionService
