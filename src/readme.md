
# pool-camera

> POC with a pool of sprites for tiled renders and a camera to handle rendering what is in the camera viewport

## pool.js

`SpritePool` is a 1D array of initialised Sprite objects, best used when a container is applied so that they can automatically be attached and detached as children of the container. This point about attachment/detachment is crucial as the pool can dynamically change size using `malloc` and `free`.

`malloc` creates new Sprite objects, a large group of these can cause delays which will hit the FPS, so batching large groups into smaller groups and spreading them out based on time left in the current tick is a good idea. `free` removes children and marks those resources as available when the GC wants to kick in.

## camera.js

Most of the fun is within the `Camera` class, and most of that fun is related to the zoom functionality.

The Camera is mostly responsible for handling the viewport and translating and scaling entities from world coordinates to screen coordinates. This is the crucial functionality.

Currently it also has a concept of a pool of Sprites to use to render the tile map grid, and knows how to render the tile map. This probably isn't strictly correct and it should probably be the responsibility of something else to take the current Camera viewport and the entity data and _use_ Camera to translate from world to screen coords.

Currently Camera has no update and so translations and zooming is instantaneous, having these animated would be good, although would need some changes to how the Camera works, mostly to ensure rendering edges correctly and making sure that if the viewport ends up with floats that the underlying world coords are referenced correctly. It will also mean rendering fractional tiles, which, without overflow hiding, will be tricky.

## Performance

`index.js` contains a commented test that randomly pans the camera about each tick, which ensures a re-render of each sprite in the pool (the render pass happens each tick any way but this rules out scene caching).

256x256 (65k) was starting to push at the 60FPS desired rate, but, at 10x10 cell size that is way way bigger than the screen. Camera would normally be linked to the size of the screen and is good at reducing (or eliminating) overdraw.
