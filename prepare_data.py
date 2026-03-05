import os
import shutil
from pathlib import Path

# Paths
SRC_TIFF_DIR = Path(r"D:\anti\hydro\flood_output_basins\4120003910")
SRC_GEOJSON = Path(r"D:\anti\projects\flood_web_viewer\data\basin_4120003910.geojson")
DEST_DIR = Path(r"D:\anti\projects\flood_web_viewer2")
DATA_DIR = DEST_DIR / "data"

DATA_DIR.mkdir(parents=True, exist_ok=True)

# 1. Copy Basin GeoJSON
if SRC_GEOJSON.exists():
    shutil.copy(SRC_GEOJSON, DATA_DIR / "basin.geojson")
    print("Copied basin.geojson")

# 2. Copy GeoTIFFs
print("Copying GeoTIFFs...")
for hr in range(1, 49):
    filename = f"flood_4120003910_hr{hr:02d}.tif"
    src_path = SRC_TIFF_DIR / filename
    if src_path.exists():
        shutil.copy(src_path, DATA_DIR / filename)
        if hr % 12 == 0:
            print(f"  Copied {hr}/48")

print("Done preparing data.")
