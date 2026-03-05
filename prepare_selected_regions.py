import os
import shutil
from pathlib import Path
import geopandas as gpd

# Configuration
HYDRO_GPKG = Path(r"D:\anti\hydro\hydro.gpkg")
DEST_DIR = Path(r"D:\anti\projects\flood_web_viewer2")
DATA_DIR = DEST_DIR / "data"

regions = {
    "부산": ["4120003910", "4120003930"],
    "울산": ["4120596810", "4120596690", "4120003870", "4120003880"],
    "진주": ["4120609720", "4120609790", "4120609360", "4120608250", "4120609240"],
    "서울": ["4120533490", "4120533590", "4120533030", "4120532870", "4120532720", "4120005050", "4120532860", "4120005040", "4120005060"],
    "안양": ["4121343840"]
}

all_basin_ids = [bid for region_bids in regions.values() for bid in region_bids]

DATA_DIR.mkdir(parents=True, exist_ok=True)

# 1. Extract Basin GeoJSONs (WGS84)
print("Extracting Basin boundaries...")
try:
    gdf = gpd.read_file(HYDRO_GPKG, layer="hybas_as_lev12_v1c")
    for bid in all_basin_ids:
        basin = gdf[gdf["HYBAS_ID"] == int(bid)]
        if not basin.empty:
            basin_4326 = basin.to_crs("EPSG:4326")
            geojson_path = DATA_DIR / f"basin_{bid}.geojson"
            basin_4326.to_file(geojson_path, driver="GeoJSON")
            print(f"  Extracted basin_{bid}.geojson")
except Exception as e:
    print(f"  Error extracting GeoJSON: {e}")

# 2. Copy GeoTIFFs
for bid in all_basin_ids:
    src_dir = Path(f"D:\\anti\\hydro\\flood_output_basins\\{bid}")
    target_dir = DATA_DIR / bid
    target_dir.mkdir(exist_ok=True)
    
    if src_dir.exists():
        print(f"Copying files for {bid}...")
        for hr in range(1, 49):
            filename = f"flood_{bid}_hr{hr:02d}.tif"
            src_path = src_dir / filename
            if src_path.exists():
                shutil.copy(src_path, target_dir / filename)
    else:
        print(f"  Source directory not found for {bid}")

print("Data preparation for selected regions complete.")
