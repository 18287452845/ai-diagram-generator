# DeepSeek R1 Integration Guide

## Overview

This project now supports DeepSeek R1 (deepseek-reasoner) as an AI provider for diagram generation, alongside Claude and OpenAI.

## Setup Instructions

### 1. Get DeepSeek API Key

1. Visit [DeepSeek Platform](https://platform.deepseek.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (it will only be shown once)

### 2. Configure the Backend

1. Open the `.env` file in the `backend` directory
2. Add your DeepSeek API key:
   ```
   DEEPSEEK_API_KEY="your_actual_deepseek_api_key_here"
   ```

### 3. Using DeepSeek in API Requests

When making requests to the AI endpoints, specify `"deepseek"` as the `aiProvider`:

#### Generate Diagram
```json
POST /api/v1/ai/generate
{
  "description": "Create a flowchart for user login process",
  "diagramType": "flowchart",
  "format": "mermaid",
  "aiProvider": "deepseek"
}
```

#### Refine Diagram
```json
POST /api/v1/ai/refine
{
  "code": "graph TD\n  A[Start] --> B[End]",
  "instruction": "Add more steps between start and end",
  "format": "mermaid",
  "aiProvider": "deepseek"
}
```

#### Explain Diagram
```json
POST /api/v1/ai/explain
{
  "code": "graph TD\n  A[Start] --> B[End]",
  "format": "mermaid",
  "aiProvider": "deepseek"
}
```

## Supported Features

### Diagram Types
- Flowchart
- Architecture
- Sequence
- ER (Entity-Relationship)
- Gantt
- Class
- State

### Diagram Formats
- Mermaid
- Draw.io XML

## Model Information

- **Model**: `deepseek-reasoner` (DeepSeek R1)
- **API Endpoint**: `https://api.deepseek.com`
- **Max Tokens**: 4000 (for generation and refinement)

## Technical Details

### Implementation

The DeepSeek integration uses the OpenAI-compatible API client:

```python
from openai import AsyncOpenAI

client = AsyncOpenAI(
    api_key=settings.DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com"
)
```

### Files Modified/Created

1. **New File**: `backend/app/services/ai/deepseek_service.py`
   - Contains `DeepSeekService` class with methods:
     - `generate_diagram()` - Generate new diagrams
     - `refine_diagram()` - Refine existing diagrams
     - `explain_diagram()` - Explain diagram content

2. **Modified**: `backend/app/schemas/diagram.py`
   - Added `DEEPSEEK = "deepseek"` to `AIProvider` enum

3. **Modified**: `backend/app/core/config.py`
   - Added `DEEPSEEK_API_KEY` configuration

4. **Modified**: `backend/app/api/routes.py`
   - Updated all AI endpoints to support DeepSeek provider
   - Added conditional logic to route requests to appropriate service

5. **Modified**: `backend/.env.example`
   - Added `DEEPSEEK_API_KEY` placeholder

## Troubleshooting

### Error: "DEEPSEEK_API_KEY is not set"
**Solution**: Make sure you've added your DeepSeek API key to the `.env` file and restarted the backend server.

### Error: Connection refused or timeout
**Solution**:
- Check your internet connection
- Verify the DeepSeek API is accessible from your network
- Ensure the API key is valid

### Error: Invalid response format
**Solution**: The model response might contain markdown code blocks. The service automatically strips these, but if you encounter issues, check the raw response format.

## Comparison with Other Providers

| Feature | Claude | OpenAI | DeepSeek |
|---------|--------|--------|----------|
| Mermaid Support | ✅ | ✅ | ✅ |
| Draw.io Support | ✅ | ❌ | ✅ |
| Max Tokens | 4000 | 2000 | 4000 |
| Reasoning Model | ✅ | ❌ | ✅ |
| Cost | Higher | Medium | Lower |

## Best Practices

1. **Clear Descriptions**: Provide clear, detailed descriptions for better diagram generation
2. **Iterative Refinement**: Use the refine endpoint to improve diagrams incrementally
3. **Format Selection**: Choose appropriate format (Mermaid for simplicity, Draw.io for rich styling)
4. **Error Handling**: Implement proper error handling in your frontend/client code

## Example Usage in Frontend

```typescript
// Generate diagram with DeepSeek
const response = await fetch('/api/v1/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Create a system architecture for a microservices application',
    diagramType: 'architecture',
    format: 'mermaid',
    aiProvider: 'deepseek'
  })
});

const { code } = await response.json();
console.log(code); // Mermaid diagram code
```

## Additional Resources

- [DeepSeek API Documentation](https://platform.deepseek.com/docs)
- [Mermaid Documentation](https://mermaid.js.org/)
- [Draw.io Format Guide](https://www.drawio.com/doc/)

## Notes

- DeepSeek R1 is a reasoning model that may provide more thoughtful diagram structures
- The model uses the same prompts as Claude for consistency
- Response times may vary based on diagram complexity and API load
