"""Draw.io XML Generator Service

This service generates draw.io XML format diagrams from text descriptions.
"""
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Dict, List, Optional
import uuid


class DrawioXMLGenerator:
    """Generator for draw.io XML format diagrams"""

    def __init__(self):
        self.cell_counter = 2  # 0 and 1 are reserved for root cells

    def create_empty_diagram(self, title: str = "Diagram") -> str:
        """Create an empty draw.io diagram"""
        root = self._create_root()
        mxfile = root
        diagram = ET.SubElement(mxfile, "diagram", {
            "name": title,
            "id": str(uuid.uuid4())
        })

        mxGraphModel = ET.SubElement(diagram, "mxGraphModel", {
            "dx": "800",
            "dy": "600",
            "grid": "1",
            "gridSize": "10",
            "guides": "1",
            "tooltips": "1",
            "connect": "1",
            "arrows": "1",
            "fold": "1",
            "page": "1",
            "pageScale": "1",
            "pageWidth": "827",
            "pageHeight": "1169",
            "math": "0",
            "shadow": "0"
        })

        root_elem = ET.SubElement(mxGraphModel, "root")
        ET.SubElement(root_elem, "mxCell", {"id": "0"})
        ET.SubElement(root_elem, "mxCell", {"id": "1", "parent": "0"})

        return self._to_string(mxfile)

    def create_flowchart(self, nodes: List[Dict], connections: List[Dict]) -> str:
        """Create a flowchart diagram

        Args:
            nodes: List of node dictionaries with keys: label, shape, x, y
            connections: List of connection dictionaries with keys: from, to, label
        """
        root = self._create_root()
        mxfile = root
        diagram = ET.SubElement(mxfile, "diagram", {
            "name": "Flowchart",
            "id": str(uuid.uuid4())
        })

        mxGraphModel = ET.SubElement(diagram, "mxGraphModel", {
            "dx": "800",
            "dy": "600",
            "grid": "1",
            "gridSize": "10",
            "guides": "1",
            "tooltips": "1",
            "connect": "1",
            "arrows": "1",
            "fold": "1",
            "page": "1",
            "pageScale": "1",
            "pageWidth": "827",
            "pageHeight": "1169"
        })

        root_elem = ET.SubElement(mxGraphModel, "root")
        ET.SubElement(root_elem, "mxCell", {"id": "0"})
        ET.SubElement(root_elem, "mxCell", {"id": "1", "parent": "0"})

        # Add nodes
        node_ids = {}
        for node in nodes:
            node_id = str(self.cell_counter)
            self.cell_counter += 1
            node_ids[node.get('id', node['label'])] = node_id

            shape_style = self._get_shape_style(node.get('shape', 'rectangle'))
            x = node.get('x', 100)
            y = node.get('y', 100)
            width = node.get('width', 120)
            height = node.get('height', 60)

            cell = ET.SubElement(root_elem, "mxCell", {
                "id": node_id,
                "value": node['label'],
                "style": shape_style,
                "vertex": "1",
                "parent": "1"
            })
            ET.SubElement(cell, "mxGeometry", {
                "x": str(x),
                "y": str(y),
                "width": str(width),
                "height": str(height),
                "as": "geometry"
            })

        # Add connections
        for conn in connections:
            conn_id = str(self.cell_counter)
            self.cell_counter += 1

            source_id = node_ids.get(conn['from'], '1')
            target_id = node_ids.get(conn['to'], '1')

            cell = ET.SubElement(root_elem, "mxCell", {
                "id": conn_id,
                "value": conn.get('label', ''),
                "style": "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;endArrow=classic;",
                "edge": "1",
                "parent": "1",
                "source": source_id,
                "target": target_id
            })
            ET.SubElement(cell, "mxGeometry", {
                "relative": "1",
                "as": "geometry"
            })

        return self._to_string(mxfile)

    def create_sequence_diagram(self, actors: List[str], messages: List[Dict]) -> str:
        """Create a sequence diagram

        Args:
            actors: List of actor names
            messages: List of message dictionaries with keys: from, to, label, type
        """
        root = self._create_root()
        mxfile = root
        diagram = ET.SubElement(mxfile, "diagram", {
            "name": "Sequence Diagram",
            "id": str(uuid.uuid4())
        })

        mxGraphModel = ET.SubElement(diagram, "mxGraphModel", {
            "dx": "1000",
            "dy": "800",
            "grid": "1",
            "gridSize": "10"
        })

        root_elem = ET.SubElement(mxGraphModel, "root")
        ET.SubElement(root_elem, "mxCell", {"id": "0"})
        ET.SubElement(root_elem, "mxCell", {"id": "1", "parent": "0"})

        # Create actors (lifelines)
        actor_ids = {}
        x_pos = 100
        for actor in actors:
            actor_id = str(self.cell_counter)
            self.cell_counter += 1
            actor_ids[actor] = actor_id

            # Actor box
            cell = ET.SubElement(root_elem, "mxCell", {
                "id": actor_id,
                "value": actor,
                "style": "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;",
                "vertex": "1",
                "parent": "1"
            })
            ET.SubElement(cell, "mxGeometry", {
                "x": str(x_pos),
                "y": "40",
                "width": "30",
                "height": "60",
                "as": "geometry"
            })

            # Lifeline
            lifeline_id = str(self.cell_counter)
            self.cell_counter += 1

            cell = ET.SubElement(root_elem, "mxCell", {
                "id": lifeline_id,
                "value": "",
                "style": "html=1;points=[];perimeter=orthogonalPerimeter;",
                "vertex": "1",
                "parent": actor_id
            })
            ET.SubElement(cell, "mxGeometry", {
                "x": "10",
                "y": "70",
                "width": "10",
                "height": "400",
                "as": "geometry"
            })

            x_pos += 200

        # Add messages
        y_pos = 150
        for msg in messages:
            msg_id = str(self.cell_counter)
            self.cell_counter += 1

            source_id = actor_ids.get(msg['from'], '1')
            target_id = actor_ids.get(msg['to'], '1')

            arrow_type = "endArrow=block;endFill=1;"
            if msg.get('type') == 'return':
                arrow_type = "endArrow=open;endFill=0;dashed=1;"

            cell = ET.SubElement(root_elem, "mxCell", {
                "id": msg_id,
                "value": msg['label'],
                "style": f"html=1;verticalAlign=bottom;{arrow_type}",
                "edge": "1",
                "parent": "1",
                "source": source_id,
                "target": target_id
            })
            geometry = ET.SubElement(cell, "mxGeometry", {
                "relative": "1",
                "as": "geometry"
            })
            ET.SubElement(geometry, "mxPoint", {
                "x": "0",
                "y": str(y_pos),
                "as": "sourcePoint"
            })
            ET.SubElement(geometry, "mxPoint", {
                "x": "200",
                "y": str(y_pos),
                "as": "targetPoint"
            })

            y_pos += 50

        return self._to_string(mxfile)

    def _create_root(self) -> ET.Element:
        """Create root mxfile element"""
        return ET.Element("mxfile", {
            "host": "embed.diagrams.net",
            "modified": datetime.utcnow().isoformat(),
            "agent": "AI Generator",
            "version": "21.0.0",
            "etag": str(uuid.uuid4()),
            "type": "embed"
        })

    def _get_shape_style(self, shape: str) -> str:
        """Get style string for different shapes"""
        styles = {
            'rectangle': 'rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;',
            'rounded': 'rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;',
            'diamond': 'rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;',
            'ellipse': 'ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;',
            'parallelogram': 'shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#e1d5e7;strokeColor=#9673a6;',
            'hexagon': 'shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#d5e8d4;strokeColor=#82b366;',
            'cylinder': 'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#dae8fc;strokeColor=#6c8ebf;',
        }
        return styles.get(shape, styles['rectangle'])

    def _to_string(self, element: ET.Element) -> str:
        """Convert XML element to formatted string"""
        ET.indent(element, space="  ")
        return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(
            element, encoding='unicode'
        )


# Helper function to create simple diagrams
def create_simple_flowchart(title: str, steps: List[str]) -> str:
    """Create a simple linear flowchart

    Args:
        title: Diagram title
        steps: List of step labels
    """
    generator = DrawioXMLGenerator()

    nodes = []
    connections = []

    y_pos = 50
    for i, step in enumerate(steps):
        nodes.append({
            'id': f'step_{i}',
            'label': step,
            'shape': 'rectangle',
            'x': 300,
            'y': y_pos,
            'width': 200,
            'height': 60
        })

        if i > 0:
            connections.append({
                'from': f'step_{i-1}',
                'to': f'step_{i}'
            })

        y_pos += 120

    return generator.create_flowchart(nodes, connections)
