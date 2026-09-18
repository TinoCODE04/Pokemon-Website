import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

export interface IslandPokemon { id: number; name: string }
export interface IslandScene {
  dispose: () => void
  reset: () => void
  zoom: (factor: number) => void
  rotate: (enabled: boolean) => void
  select: (id: number) => void
}

export function createIslandScene(host: HTMLElement, callbacks: {
  ready: (pokemon: IslandPokemon[]) => void
  select: (pokemon: IslandPokemon) => void
  progress: (percent: number) => void
  error: () => void
}): IslandScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  const canvas = renderer.domElement
  canvas.setAttribute('aria-label', 'Interactive Pokémon island. Drag to rotate; use the controls below to zoom or select a Pokémon.')
  host.appendChild(canvas)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000)
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.enablePan = false
  // Zoom is also available through explicit controls for keyboard users.
  controls.enableZoom = true
  controls.maxPolarAngle = Math.PI * 0.48
  controls.minPolarAngle = 0.12
  controls.autoRotateSpeed = 0.45
  controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches
  scene.add(new THREE.HemisphereLight(0xd5efff, 0x718465, 1.8))
  const sun = new THREE.DirectionalLight(0xfff0d2, 2.4)
  sun.position.set(-20, 45, -30)
  scene.add(sun)
  const fill = new THREE.DirectionalLight(0x9ddcff, 0.8)
  fill.position.set(30, 15, 20)
  scene.add(fill)
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const entries = new Map<number, { pokemon: IslandPokemon; object: THREE.Object3D }>()
  let model: THREE.Group | undefined
  let disposed = false
  let visible = true
  let radius = 25
  let selected: THREE.Object3D | undefined
  const center = new THREE.Vector3()
  const modelBounds = new THREE.Box3()
  const homePosition = new THREE.Vector3()
  const destination = new THREE.Vector3()
  const targetDestination = new THREE.Vector3()
  let transitioning = false
  const highlight = new THREE.BoxHelper(new THREE.Object3D(), 0xfbbf24)
  highlight.visible = false
  scene.add(highlight)

  const resize = () => {
    const { width, height } = host.getBoundingClientRect()
    renderer.setSize(width, height)
    camera.aspect = width / Math.max(height, 1)
    camera.updateProjectionMatrix()
    if (model && !selected) reset()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
  intersection.observe(host)
  resize()

  function disposeModel(root: THREE.Object3D) {
    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()
    const textures = new Set<THREE.Texture>()
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      geometries.add(object.geometry)
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material)
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
      }
    })
    geometries.forEach((geometry) => geometry.dispose())
    materials.forEach((material) => material.dispose())
    textures.forEach((texture) => texture.dispose())
  }
  const reset = () => {
    // Flush any remaining drag momentum before restoring the overview.
    controls.enableDamping = false
    controls.update()
    const vertical = THREE.MathUtils.degToRad(camera.fov / 2)
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect)
    const direction = new THREE.Vector3(0.08, 0.8, -0.85).normalize()
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize()
    const up = new THREE.Vector3().crossVectors(direction, right).normalize()
    let distance = 0
    for (const x of [modelBounds.min.x, modelBounds.max.x]) {
      for (const y of [modelBounds.min.y, modelBounds.max.y]) {
        for (const z of [modelBounds.min.z, modelBounds.max.z]) {
          const corner = new THREE.Vector3(x, y, z).sub(center)
          distance = Math.max(distance, corner.dot(direction) + Math.abs(corner.dot(right)) / Math.tan(horizontal), corner.dot(direction) + Math.abs(corner.dot(up)) / (Math.tan(vertical) * 0.8))
        }
      }
    }
    // The scenery's tall bounding box contains empty air above its front edge.
    // A closer desktop framing makes the small inhabitants readable.
    distance *= camera.aspect > 1.2 ? 0.88 : 1.06
    homePosition.copy(center).add(direction.multiplyScalar(distance))
    camera.position.copy(homePosition)
    controls.target.copy(center)
    controls.maxDistance = distance * 1.8
    controls.minDistance = radius * 0.12
    transitioning = false
    highlight.visible = false
    selected = undefined
    controls.update()
    controls.enableDamping = true
  }
  const select = (id: number) => {
    const entry = entries.get(id)
    if (!entry) return
    selected = entry.object
    controls.autoRotate = false
    const bounds = new THREE.Box3().setFromObject(selected)
    bounds.getCenter(targetDestination)
    const size = bounds.getSize(new THREE.Vector3()).length()
    destination.copy(targetDestination).add(camera.position.clone().sub(controls.target).normalize().multiplyScalar(Math.max(size * 2, radius * 0.28)))
    transitioning = true
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      camera.position.copy(destination)
      controls.target.copy(targetDestination)
      transitioning = false
    }
    highlight.setFromObject(selected)
    highlight.visible = true
    callbacks.select(entry.pokemon)
  }
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load('/models/pokemon-island.glb', (gltf) => {
    if (disposed) { disposeModel(gltf.scene); return }
    model = gltf.scene
    scene.add(model)
    model.traverse((object) => {
      if (typeof object.userData.pokemonId === 'number') {
        entries.set(object.userData.pokemonId, { pokemon: { id: object.userData.pokemonId, name: object.userData.pokemonName }, object })
      }
    })
    const bounds = new THREE.Box3().setFromObject(model)
    modelBounds.copy(bounds)
    bounds.getCenter(center)
    radius = bounds.getBoundingSphere(new THREE.Sphere()).radius
    reset()
    callbacks.ready([...entries.values()].map((entry) => entry.pokemon).sort((a, b) => a.name.localeCompare(b.name)))
  }, (event) => {
    if (!disposed && event.total) callbacks.progress(Math.round(event.loaded / event.total * 100))
  }, () => { if (!disposed) callbacks.error() })

  const hit = (event: PointerEvent) => {
    if (!model) return undefined
    const rect = canvas.getBoundingClientRect()
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    let object: THREE.Object3D | undefined = raycaster.intersectObject(model, true)[0]?.object
    while (object) {
      if (object.userData.pokemonId) return object.userData.pokemonId as number
      object = object.parent ?? undefined
    }
  }
  let down = { x: 0, y: 0 }
  let dragging = false
  const onDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY }; dragging = true; transitioning = false }
  const onUp = (event: PointerEvent) => {
    if (dragging && Math.hypot(event.clientX - down.x, event.clientY - down.y) < 6) {
      const id = hit(event)
      if (id) select(id)
    }
    dragging = false
  }
  let lastHover = 0
  const onMove = (event: PointerEvent) => {
    if (dragging || performance.now() - lastHover < 90) return
    lastHover = performance.now()
    canvas.style.cursor = hit(event) ? 'pointer' : 'grab'
  }
  const onCancel = () => { dragging = false }
  const onLost = (event: Event) => { event.preventDefault(); callbacks.error() }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointercancel', onCancel)
  canvas.addEventListener('webglcontextlost', onLost)
  let last = 0
  renderer.setAnimationLoop((time) => {
    if (disposed || !visible || document.hidden || time - last < 30) return
    const delta = Math.min((time - last) / 1000, 0.1)
    last = time
    if (transitioning) {
      camera.position.lerp(destination, 0.12)
      controls.target.lerp(targetDestination, 0.12)
      if (camera.position.distanceTo(destination) < 0.01) transitioning = false
    }
    controls.update(delta)
    renderer.render(scene, camera)
  })
  return {
    reset,
    select,
    rotate: (enabled) => { controls.autoRotate = enabled },
    zoom: (factor) => {
      transitioning = false
      const offset = camera.position.clone().sub(controls.target)
      offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance))
      camera.position.copy(controls.target).add(offset)
      controls.update()
    },
    dispose: () => {
      disposed = true
      renderer.setAnimationLoop(null)
      observer.disconnect()
      intersection.disconnect()
      controls.dispose()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointercancel', onCancel)
      canvas.removeEventListener('webglcontextlost', onLost)
      if (model) disposeModel(model)
      highlight.geometry.dispose()
      ;(highlight.material as THREE.Material).dispose()
      renderer.dispose()
      canvas.remove()
    },
  }
}
