import os
import shutil
from pathlib import Path
import geopandas as gpd

# Paths
HYDRO_GPKG = Path(r"D:\anti\hydro\hydro.gpkg")
DEST_DIR = Path(r"D:\anti\projects\flood_web_viewer2")
DATA_DIR = DEST_DIR / "data"
BASIN_IDS = [4120003910, 4120003930]

DATA_DIR.mkdir(parents=True, exist_ok=True)

# Extract Basin GeoJSONs for both (Projected to 4326 for Leaflet)
print("Extracting Basin boundaries from GPKG...")
try:
    gdf = gpd.read_file(HYDRO_GPKG, layer="hybas_as_lev12_v1c")
    for bid in BASIN_IDS:
        basin = gdf[gdf["HYBAS_ID"] == bid]
        if not basin.empty:
            # Important: Reproject to WGS84 for standard Leaflet usage
            basin_4326 = basin.to_crs("EPSG:4326")
            geojson_path = DATA_DIR / f"basin_{bid}.geojson"
            basin_4326.to_file(geojson_path, driver="GeoJSON")
            print(f"  Extracted basin_{bid}.geojson (EPSG:4326)")
        else:
            print(f"  Warning: Basin {bid} not found in GPKG")
except Exception as e:
    print(f"  Error extracting GeoJSON: {e}")

# Copy GeoTIFFs into subfolders
for bid in BASIN_IDS:
    bid_str = str(bid)
    src_dir = Path(f"D:\\anti\\hydro\\flood_output_basins\\{bid_str}")
    target_dir = DATA_DIR / bid_str
    target_dir.mkdir(exist_ok=True)
    
    print(f"Copying GeoTIFFs for {bid_str}...")
    for hr in range(1, 49):
        filename = f"flood_{bid_str}_hr{hr:02d}.tif"
        src_path = src_dir / filename
        if src_path.exists():
            shutil.copy(src_path, target_dir / filename)
            if hr % 12 == 0:
                print(f"  Copied {hr}/48")

print("Done preparing data for multiple basins.")
