"""Run with Blender --background <source.blend> --python scripts/export-island.py.
Only the in-memory scene is changed; the source file is never saved.
"""
import bpy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'models'
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'island-palette.json').write_text(json.dumps({m.name: list(m.diffuse_color) for m in bpy.data.materials}, indent=2))
IDS = dict(zip(
    'Articuno,Zapdos,Moltres,Mewtwo,Mew,Raikou,Entei,Suicune,Lugia,Ho-Oh,Celebi,Regirock,Regice,Registeel,Latias,Latios,Kyogre,Groudon,Rayquaza,Jirachi,Deoxys,Uxie,Mesprit,Azelf,Dialga,Palkia,Heatran,Regigigas,Giratina,Cresselia,Manaphy,Darkrai,Shaymin,Arceus'.split(','),
    [144,145,146,150,151,243,244,245,249,250,251,377,378,379,380,381,382,383,384,385,386,480,481,482,483,484,485,486,487,488,490,491,492,493]))

# Capture the authored camera for consistent web framing (Blender Z-up -> glTF Y-up).
camera = bpy.context.scene.camera
camera_position = [camera.location.x, camera.location.z, -camera.location.y]
groups = {}
for obj in list(bpy.context.scene.objects):
    if obj.type not in {'MESH', 'CURVE'} or obj.hide_render:
        continue
    species = next((c.name for c in obj.users_collection if c.name in IDS), None)
    groups.setdefault(species or 'Island scenery', []).append(obj)
    # Shared primitive datablocks must be independent before conversion/joining.
    obj.data = obj.data.copy()
    for modifier in obj.modifiers:
        if modifier.type == 'SUBSURF':
            modifier.levels = min(modifier.levels, 1)
            modifier.render_levels = min(modifier.render_levels, 1)
        elif modifier.type == 'BEVEL':
            modifier.segments = min(modifier.segments, 2)

# Convert curves/modifiers, bake world transforms and merge thousands of tiny objects.
exported = []
for name, objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.hide_set(False)
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.convert(target='MESH')
    # Clear parenting without moving any geometry.
    for obj in bpy.context.selected_objects:
        world = obj.matrix_world.copy()
        obj.parent = None
        obj.matrix_world = world
    bpy.ops.object.join()
    joined = bpy.context.object
    joined.name = name
    if name in IDS:
        joined['pokemonId'] = IDS[name]
        joined['pokemonName'] = name
    exported.append(joined)

bpy.ops.object.select_all(action='DESELECT')
for obj in exported:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT / 'pokemon-island.raw.glb'),
    export_format='GLB', use_selection=True, export_extras=True,
    export_cameras=False, export_lights=False, export_animations=False,
    export_yup=True)
(OUT / 'island-manifest.json').write_text(json.dumps({
    'source': 'pokemon_island_arceus_redesigned.blend',
    'camera': camera_position,
    'pokemon': [{'id': id, 'name': name} for name, id in sorted(IDS.items())]
}, indent=2))
print('EXPORT_COMPLETE', len(exported), 'merged objects', flush=True)

# A real render of the source provides a useful loading / WebGL fallback image.
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.render.resolution_x = 1400
scene.render.resolution_y = 850
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = str(OUT / 'island-poster.png')
bpy.ops.render.render(write_still=True)
