"""Read the authored camera and write clickable poster coordinates. Never save the blend."""
import bpy
import json
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'public/models/island-manifest.json').read_text())
scene = bpy.context.scene
camera = scene.camera
scene.render.resolution_x = 1400
scene.render.resolution_y = 850
scene.render.resolution_percentage = 100
bpy.context.view_layer.update()
entries = []
for pokemon in manifest['pokemon']:
    collection = bpy.data.collections.get(pokemon['name'])
    objects = [obj for obj in collection.all_objects if obj.type in {'MESH', 'CURVE'} and not obj.hide_render]
    corners = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    minimum = Vector(tuple(min(point[i] for point in corners) for i in range(3)))
    maximum = Vector(tuple(max(point[i] for point in corners) for i in range(3)))
    point = world_to_camera_view(scene, camera, (minimum + maximum) / 2)
    entries.append({**pokemon, 'x': round(point.x * 100, 3), 'y': round((1 - point.y) * 100, 3)})
data = {'width': 1400, 'height': 850, 'pokemon': entries}
(root / 'src/data/islandPreview.ts').write_text('// Generated from the source camera by scripts/export-island-preview.py.\nexport const ISLAND_PREVIEW = ' + json.dumps(data, indent=2) + ' as const\n', encoding='utf-8')
print('PREVIEW_EXPORTED', len(entries), flush=True)
