import Editor, { loader } from '@monaco-editor/react'

// Configure Monaco loader to use unpkg CDN (more reliable than jsDelivr in some regions)
loader.config({
  paths: {
    vs: 'https://unpkg.com/monaco-editor@0.54.0/min/vs'
  }
})

interface CodeEditorProps {
  code: string
  onChange: (code: string) => void
}

function CodeEditor({ code, onChange }: CodeEditorProps) {
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Draw.io XML 代码</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          您可以直接编辑 XML 代码，或切换到可视化编辑器进行拖拽编辑
        </p>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          language="xml"
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          loading={
            <div className="flex items-center justify-center h-full bg-gray-900">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-sm text-gray-400">Loading editor...</p>
              </div>
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on', // Enable word wrap for XML
          }}
        />
      </div>
    </div>
  )
}

export default CodeEditor