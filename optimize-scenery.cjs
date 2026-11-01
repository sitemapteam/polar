const vm = require('node:vm');

// Only background photogrammetry rocks use this optimization. Train, carriage,
// character, texture and audio assets are untouched. Error is limited to 0.2%
// of each source mesh's extent; retained vertices keep their original UVs.
async function optimizeSceneryScript(bytes) {
  const { MeshoptSimplifier } = await import('meshoptimizer');
  await MeshoptSimplifier.ready;
  const context = { window: {} };
  vm.runInNewContext(bytes.toString('utf8'), context, { timeout: 5000 });
  const [global, gltf] = Object.entries(context.window)[0];
  const buffers = gltf.buffers.map(buffer => Buffer.from(buffer.uri.split(',')[1], 'base64'));
  function read(accessorId, components) {
    const accessor = gltf.accessors[accessorId], view = gltf.bufferViews[accessor.bufferView];
    const buffer = buffers[view.buffer], data = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const width = accessor.componentType === 5123 ? 2 : 4;
    const stride = view.byteStride || width * components;
    const output = accessor.componentType === 5126 ? new Float32Array(accessor.count * components) : new Uint32Array(accessor.count * components);
    for (let i = 0; i < accessor.count; i++) for (let j = 0; j < components; j++) {
      const offset = (view.byteOffset || 0) + (accessor.byteOffset || 0) + i * stride + j * width;
      output[i * components + j] = accessor.componentType === 5126 ? data.getFloat32(offset, true) : width === 2 ? data.getUint16(offset, true) : data.getUint32(offset, true);
    }
    return output;
  }
  let before = 0, after = 0;
  for (const mesh of gltf.meshes) for (const primitive of mesh.primitives) {
    if (primitive.indices === undefined || (primitive.mode !== undefined && primitive.mode !== 4)) continue;
    const positions = read(primitive.attributes.POSITION, 3), indices = read(primitive.indices, 1);
    const [simplified] = MeshoptSimplifier.simplify(indices, positions, 3, Math.floor(indices.length / 12) * 3, 0.002, ['LockBorder']);
    before += indices.length / 3; after += simplified.length / 3;
    const packed = Buffer.from(simplified.buffer, simplified.byteOffset, simplified.byteLength);
    const bufferIndex = gltf.buffers.length, viewIndex = gltf.bufferViews.length, accessorIndex = gltf.accessors.length;
    gltf.buffers.push({ byteLength: packed.length, uri: 'data:application/octet-stream;base64,' + packed.toString('base64') });
    gltf.bufferViews.push({ buffer: bufferIndex, byteOffset: 0, byteLength: packed.length, target: 34963 });
    gltf.accessors.push({ bufferView: viewIndex, byteOffset: 0, componentType: 5125, count: simplified.length, type: 'SCALAR' });
    primitive.indices = accessorIndex;
  }
  console.log(`${global}: ${before} → ${after} background rock triangles`);
  return Buffer.from(`window.${global}=${JSON.stringify(gltf)};`);
}

module.exports = { optimizeSceneryScript };
