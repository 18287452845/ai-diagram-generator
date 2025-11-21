// Diagram types
export enum DiagramType {
  FLOWCHART = 'flowchart',
  ARCHITECTURE = 'architecture',
  SEQUENCE = 'sequence',
  GANTT = 'gantt',
  SWIMLANE = 'swimlane',
  ER = 'er',
  CLASS = 'class',
  STATE = 'state',
  MINDMAP = 'mindmap',
  ROADMAP = 'roadmap',
}

// AI Providers
export enum AIProvider {
  CLAUDE = 'claude',
  OPENAI = 'openai',
  DEEPSEEK = 'deepseek',
}

// Diagram data interface (Draw.io XML only)
export interface Diagram {
  id: string
  title: string
  type: DiagramType
  code: string // Draw.io XML
  aiProvider?: AIProvider
  aiPrompt?: string
  createdAt: string
  updatedAt: string
}

// AI generation request
export interface GenerateDiagramRequest {
  description: string
  diagramType: DiagramType
  aiProvider: AIProvider
  style?: string
}

// AI generation response
export interface GenerateDiagramResponse {
  code: string // Draw.io XML
  explanation?: string
}

// Export options
export interface ExportOptions {
  format: 'svg' | 'png' | 'pdf' | 'xml'
  quality?: number
  background?: string
}

// Draw.io specific options
export interface DrawioExportOptions extends ExportOptions {
  scale?: number // Scale ratio
  border?: number // Border width
  transparent?: boolean // Transparent background
}