from fastapi import HTTPException
from fastapi.responses import Response
import base64
import io
import subprocess
import tempfile
import os
from pathlib import Path


class ExportService:
    """Service for exporting diagrams to various formats"""

    async def export_svg(self, mermaid_code: str) -> bytes:
        """
        Export Mermaid diagram to SVG
        Uses mermaid-cli (mmdc) to render
        """
        try:
            # Create temporary files
            with tempfile.NamedTemporaryFile(mode='w', suffix='.mmd', delete=False) as input_file:
                input_file.write(mermaid_code)
                input_path = input_file.name

            output_path = input_path.replace('.mmd', '.svg')

            # Run mermaid-cli
            result = subprocess.run(
                ['mmdc', '-i', input_path, '-o', output_path, '-b', 'transparent'],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode != 0:
                raise Exception(f"Mermaid rendering failed: {result.stderr}")

            # Read SVG output
            with open(output_path, 'rb') as f:
                svg_data = f.read()

            # Cleanup
            os.unlink(input_path)
            os.unlink(output_path)

            return svg_data

        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=500, detail="Export timeout")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

    async def export_png(self, mermaid_code: str, scale: int = 2) -> bytes:
        """
        Export Mermaid diagram to PNG
        Uses mermaid-cli (mmdc) to render
        """
        try:
            # Create temporary files
            with tempfile.NamedTemporaryFile(mode='w', suffix='.mmd', delete=False) as input_file:
                input_file.write(mermaid_code)
                input_path = input_file.name

            output_path = input_path.replace('.mmd', '.png')

            # Run mermaid-cli
            result = subprocess.run(
                [
                    'mmdc',
                    '-i', input_path,
                    '-o', output_path,
                    '-b', 'white',
                    '-s', str(scale)
                ],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode != 0:
                raise Exception(f"Mermaid rendering failed: {result.stderr}")

            # Read PNG output
            with open(output_path, 'rb') as f:
                png_data = f.read()

            # Cleanup
            os.unlink(input_path)
            os.unlink(output_path)

            return png_data

        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=500, detail="Export timeout")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

    async def export_pdf(self, mermaid_code: str) -> bytes:
        """
        Export Mermaid diagram to PDF
        First converts to PNG, then to PDF
        """
        try:
            # First get PNG
            png_data = await self.export_png(mermaid_code, scale=3)

            # Create temporary PDF using Pillow
            from PIL import Image
            import img2pdf

            # Convert PNG bytes to PDF
            pdf_bytes = img2pdf.convert(png_data)
            return pdf_bytes

        except ImportError:
            # Fallback: use WeasyPrint if available
            try:
                from weasyprint import HTML, CSS
                from io import BytesIO

                # Get SVG
                svg_data = await self.export_svg(mermaid_code)
                svg_str = svg_data.decode('utf-8')

                # Create HTML with embedded SVG
                html_content = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {{ margin: 0; padding: 20px; }}
                        svg {{ max-width: 100%; height: auto; }}
                    </style>
                </head>
                <body>
                    {svg_str}
                </body>
                </html>
                """

                # Convert to PDF
                pdf_buffer = BytesIO()
                HTML(string=html_content).write_pdf(pdf_buffer)
                return pdf_buffer.getvalue()

            except ImportError:
                raise HTTPException(
                    status_code=501,
                    detail="PDF export requires img2pdf or weasyprint to be installed"
                )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF export failed: {str(e)}")


export_service = ExportService()