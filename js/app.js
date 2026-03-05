// Register EPSG:5186 (Korea 2000 / Central Belt 2010)
proj4.defs("EPSG:5186", "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs");

const config = {
    selectedBasin: '4120003910',
    minDepth: 0.3,
    maxDepth: 5.0,
    currentHour: 1,
    layers: {
        basin: null,
        flood: null
    }
};

// Initialize Map
const map = L.map('map').setView([35.158, 129.070], 11);

// Base Map (ESRI Satellite)
const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
}).addTo(map);

// Function to load Basin GeoJSON
function loadBasin(basinId) {
    if (config.layers.basin) {
        map.removeLayer(config.layers.basin);
    }

    return fetch(`data/basin_${basinId}.geojson`)
        .then(res => res.json())
        .then(data => {
            config.layers.basin = L.geoJSON(data, {
                style: {
                    color: '#ff4444',
                    weight: 3,
                    fillOpacity: 0.1,
                    dashArray: '5, 5'
                }
            }).addTo(map);

            // Auto-zoom to basin on load
            if (config.layers.basin.getBounds().isValid()) {
                map.fitBounds(config.layers.basin.getBounds(), { padding: [50, 50] });
            }
        })
        .catch(err => console.error(`Error loading basin ${basinId}:`, err));
}

// Function to update flood layer
async function updateFloodLayer() {
    const basinId = config.selectedBasin;
    const hour = config.currentHour;

    // Check if flood display is active
    const floodBtn = document.getElementById('btn-flood');
    if (!floodBtn.classList.contains('active')) return;

    const loading = document.getElementById('loading');
    loading.style.display = 'flex';

    if (config.layers.flood) {
        map.removeLayer(config.layers.flood);
        config.layers.flood = null;
    }

    const hourStr = String(hour).padStart(2, '0');
    // Adjust data path to subfolders
    const url = `data/${basinId}/flood_${basinId}_hr${hourStr}.tif`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        const georaster = await parseGeoraster(arrayBuffer);

        config.layers.flood = new GeoRasterLayer({
            georaster: georaster,
            opacity: 0.7,
            pixelValuesToColorFn: values => {
                const val = values[0];
                if (val === null || isNaN(val) || val < config.minDepth) return null;

                let norm = (val - config.minDepth) / (config.maxDepth - config.minDepth);
                if (norm > 1) norm = 1;

                const r = Math.floor(173 * (1 - norm) + 0 * norm);
                const g = Math.floor(216 * (1 - norm) + 51 * norm);
                const b = Math.floor(230 * (1 - norm) + 102 * norm);

                return `rgb(${r},${g},${b})`;
            },
            resolution: 128
        });

        config.layers.flood.addTo(map);
    } catch (err) {
        console.warn(`Flood layer failed for ${basinId} H${hour}:`, err);
    } finally {
        loading.style.display = 'none';
    }
}

// UI Setup
const slider = document.getElementById('hourSlider');
const hourDisplay = document.getElementById('hourValue');
const basinSelect = document.getElementById('basinSelect');

// Basin Change
basinSelect.addEventListener('change', async (e) => {
    config.selectedBasin = e.target.value;
    await loadBasin(config.selectedBasin);
    updateFloodLayer();
});

// Slider Change
slider.addEventListener('change', (e) => {
    config.currentHour = parseInt(e.target.value);
    hourDisplay.innerText = String(config.currentHour).padStart(2, '0');
    updateFloodLayer();
});

slider.addEventListener('input', (e) => {
    hourDisplay.innerText = String(e.target.value).padStart(2, '0');
});

// Layer Toggles
document.getElementById('btn-basin').addEventListener('click', function () {
    this.classList.toggle('active');
    if (this.classList.contains('active')) {
        config.layers.basin && config.layers.basin.addTo(map);
    } else {
        config.layers.basin && map.removeLayer(config.layers.basin);
    }
});

document.getElementById('btn-flood').addEventListener('click', function () {
    this.classList.toggle('active');
    if (this.classList.contains('active')) {
        updateFloodLayer();
    } else {
        config.layers.flood && map.removeLayer(config.layers.flood);
        config.layers.flood = null;
    }
});

// Initial Load
(async () => {
    await loadBasin(config.selectedBasin);
    updateFloodLayer();
})();
