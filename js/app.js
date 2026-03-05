// Register EPSG:5186
proj4.defs("EPSG:5186", "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs");

const basinData = {
    "부산": ["4120003910", "4120003930"],
    "울산": ["4120596810", "4120596690", "4120003870", "4120003880"],
    "진주": ["4120609720", "4120609790", "4120609360", "4120608250", "4120609240"],
    "서울": ["4120533490", "4120533590", "4120533030", "4120532870", "4120532720", "4120005050", "4120532860", "4120005040", "4120005060"],
    "안양": ["4121343840"]
};

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

const map = L.map('map').setView([37.5665, 126.9780], 11);

const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
}).addTo(map);

function updateBasinList(region) {
    const basinSelect = document.getElementById('basinSelect');
    basinSelect.innerHTML = '';

    basinData[region].forEach((bid, index) => {
        const option = document.createElement('option');
        option.value = bid;
        option.text = bid;
        if (index === 0 && config.selectedBasin !== bid) {
            // Keep default if first load, else set to first of new region
        }
        basinSelect.appendChild(option);
    });
}

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

            if (config.layers.basin.getBounds().isValid()) {
                map.fitBounds(config.layers.basin.getBounds(), { padding: [50, 50] });
            }
        })
        .catch(err => console.error(`Error loading basin ${basinId}:`, err));
}

async function updateFloodLayer() {
    const basinId = config.selectedBasin;
    const hour = config.currentHour;

    if (!document.getElementById('btn-flood').classList.contains('active')) return;

    const loading = document.getElementById('loading');
    loading.style.display = 'flex';

    if (config.layers.flood) {
        map.removeLayer(config.layers.flood);
        config.layers.flood = null;
    }

    const hourStr = String(hour).padStart(2, '0');
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
const regionSelect = document.getElementById('regionSelect');
const basinSelect = document.getElementById('basinSelect');

regionSelect.addEventListener('change', async (e) => {
    updateBasinList(e.target.value);
    config.selectedBasin = basinSelect.value;
    await loadBasin(config.selectedBasin);
    updateFloodLayer();
});

basinSelect.addEventListener('change', async (e) => {
    config.selectedBasin = e.target.value;
    await loadBasin(config.selectedBasin);
    updateFloodLayer();
});

slider.addEventListener('change', (e) => {
    config.currentHour = parseInt(e.target.value);
    hourDisplay.innerText = String(config.currentHour).padStart(2, '0');
    updateFloodLayer();
});

slider.addEventListener('input', (e) => {
    hourDisplay.innerText = String(e.target.value).padStart(2, '0');
});

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
    updateBasinList('부산');
    basinSelect.value = '4120003910';
    await loadBasin(config.selectedBasin);
    updateFloodLayer();
})();
