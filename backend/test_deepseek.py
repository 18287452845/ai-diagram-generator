"""Test script to verify DeepSeek integration"""
import asyncio
import os
from app.services.ai.deepseek_service import deepseek_service
from app.schemas.diagram import DiagramType, DiagramFormat


async def test_deepseek_integration():
    """Test DeepSeek service with a simple diagram generation"""
    print("Testing DeepSeek R1 Integration...\n")

    # Check if API key is set
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        print("❌ DEEPSEEK_API_KEY is not set in environment")
        print("Please set it in .env file or export it as environment variable")
        return False

    print(f"✅ API key found (starts with: {api_key[:10]}...)\n")

    try:
        # Test 1: Generate a simple flowchart
        print("Test 1: Generating a simple flowchart...")
        description = "Create a simple login process flowchart with username, password, and authentication steps"
        code = await deepseek_service.generate_diagram(
            description=description,
            diagram_type=DiagramType.FLOWCHART,
            diagram_format=DiagramFormat.MERMAID
        )
        print(f"✅ Generated diagram (length: {len(code)} characters)")
        print(f"First 200 chars: {code[:200]}...\n")

        # Test 2: Refine the diagram
        print("Test 2: Refining the diagram...")
        instruction = "Add error handling steps"
        refined_code = await deepseek_service.refine_diagram(
            code=code,
            instruction=instruction,
            diagram_format=DiagramFormat.MERMAID
        )
        print(f"✅ Refined diagram (length: {len(refined_code)} characters)")
        print(f"First 200 chars: {refined_code[:200]}...\n")

        # Test 3: Explain the diagram
        print("Test 3: Explaining the diagram...")
        explanation = await deepseek_service.explain_diagram(
            code=refined_code,
            diagram_format=DiagramFormat.MERMAID
        )
        print(f"✅ Generated explanation (length: {len(explanation)} characters)")
        print(f"Explanation: {explanation[:300]}...\n")

        print("\n" + "="*50)
        print("✅ All tests passed! DeepSeek integration is working correctly.")
        print("="*50)
        return True

    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()

    # Run the test
    success = asyncio.run(test_deepseek_integration())
    exit(0 if success else 1)
