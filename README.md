# Flood Web Viewer v2

Fixed version of the flood risk visualization web app.

## Improvements
1.  **Native GeoTIFF Support**: Uses `georaster` and `georaster-layer-for-leaflet` to load the original `.tif` files directly from the `data/` folder. No conversion to PNG is required, preserving data accuracy.
2.  **Coordinate System Fix**: Correctly handles `EPSG:5186` (Korea 2000 / Central Belt 2010) by registering the `proj4` definition. This ensures the flood data aligns perfectly with the base map.
3.  **Reliable Basemap**: Switched to ESRI World Imagery for a stable and high-quality satellite background.
4.  **Premium UI**: Updated with a modern glassmorphism design, smoother interaction, and responsive layout.

## How to Run
1.  Since this uses `fetch` to load GeoTIFFs, you need to run it through a local web server (e.g., Live Server in VS Code, or `python -m http.server`).
2.  Open `index.html` in your browser.

## Data Structure
- `index.html`: Main entry point.
- `js/app.js`: Application logic and coordinate system handling.
- `data/`: Contains the basin GeoJSON and 48-hour flood GeoTIFFs.
