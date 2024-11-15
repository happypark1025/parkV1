$(document).ready(function() {
    // 確保 geojsonData 已經載入
    console.log(geojsonData);

    // 初始化地圖
    var map = L.map('map').setView([25.085, 121.57], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 定義根據狀態和類別設定顏色的函數
    function getColor(status, category) {
        if (status === '修復中') {
            return 'red';
        } else if (status === '已修復') {
            return 'green';
        } else if (category === '公園') {
            return 'darkgreen';
        } else if (category === '鄰里公園') {
            return 'lightgreen';
        } else {
            return 'gray';
        }
    }

    // 從 Local Storage 加載資料
    function loadFromLocalStorage() {
        var storedData = localStorage.getItem('geojsonData');
        if (storedData) {
            geojsonData = JSON.parse(storedData);
        }
    }

    // 保存資料到 Local Storage
    function saveToLocalStorage() {
        localStorage.setItem('geojsonData', JSON.stringify(geojsonData));
    }

    // 添加GeoJSON資料到地圖
    function addGeoJSONToMap() {
        L.geoJSON(geojsonData, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 8,
                    fillColor: getColor(feature.properties.status, feature.properties.category),
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                });
            },
            onEachFeature: function (feature, layer) {
                layer.on('click', function () {
                    var popupContent = `
                        <b>${feature.properties.name}</b><br>
                        狀態: <select id="statusSelect" onchange="updateStatus('${feature.properties.name}', this.value)">
                            <option value="無災情" ${feature.properties.status === '無災情' ? 'selected' : ''}>無災情</option>
                            <option value="修復中" ${feature.properties.status === '修復中' ? 'selected' : ''}>修復中</option>
                            <option value="已修復" ${feature.properties.status === '已修復' ? 'selected' : ''}>已修復</option>
                        </select>
                    `;
                    layer.bindPopup(popupContent).openPopup();
                });
            }
        }).addTo(map);
    }

    // 初始化ApexCharts
    var parkOptions = {
        series: [],
        chart: {
            type: 'pie'
        },
        labels: [],
        title: {
            text: "公園狀態比例"
        }
    };
    var neighborhoodParkOptions = {
        series: [],
        chart: {
            type: 'pie'
        },
        labels: [],
        title: {
            text: "鄰里公園狀態比例"
        }
    };
    var parkChart = new ApexCharts(document.querySelector("#park-chart"), parkOptions);
    var neighborhoodParkChart = new ApexCharts(document.querySelector("#neighborhood-park-chart"), neighborhoodParkOptions);
    parkChart.render();
    neighborhoodParkChart.render();

    // 更新圖表資料的函數
    function updateChartData() {
        var parkStatusCounts = { "無災情": 0, "修復中": 0, "已修復": 0 };
        var neighborhoodParkStatusCounts = { "無災情": 0, "修復中": 0, "已修復": 0 };

        geojsonData.features.forEach(function (feature) {
            if (feature.properties.category === "公園") {
                parkStatusCounts[feature.properties.status]++;
            } else if (feature.properties.category === "鄰里公園") {
                neighborhoodParkStatusCounts[feature.properties.status]++;
            }
        });

        parkChart.updateOptions({
            series: Object.values(parkStatusCounts),
            labels: Object.keys(parkStatusCounts)
        });

        neighborhoodParkChart.updateOptions({
            series: Object.values(neighborhoodParkStatusCounts),
            labels: Object.keys(neighborhoodParkStatusCounts)
        });
    }

    // 初始圖表資料
    updateChartData();

    // 更新公園清單的函數
    function updateParkList() {
        var parkList = document.getElementById('park-list');
        parkList.innerHTML = '';
        geojsonData.features.forEach(function (feature) {
            var parkItem = document.createElement('div');
            parkItem.innerHTML = `
                <b>${feature.properties.name}</b><br>
                狀態: <select onchange="updateStatus('${feature.properties.name}', this.value)">
                    <option value="無災情" ${feature.properties.status === '無災情' ? 'selected' : ''}>無災情</option>
                    <option value="修復中" ${feature.properties.status === '修復中' ? 'selected' : ''}>修復中</option>
                    <option value="已修復" ${feature.properties.status === '已修復' ? 'selected' : ''}>已修復</option>
                </select>
            `;
            parkList.appendChild(parkItem);
        });
    }

    // 更新公園狀態的函數
    window.updateStatus = function(parkName, newStatus) {
        geojsonData.features.forEach(function (feature) {
            if (feature.properties.name === parkName) {
                feature.properties.status = newStatus;
            }
        });
        saveToLocalStorage(); // 保存資料到 Local Storage
        updateChartData(); // 更新圖表資料
        updateParkList(); // 更新公園清單
        map.eachLayer(function (layer) {
            if (layer instanceof L.CircleMarker) {
                map.removeLayer(layer);
            }
        });
        addGeoJSONToMap(); // 重新添加更新後的GeoJSON資料到地圖
    }

    // 從 Local Storage 加載資料
    loadFromLocalStorage();

    // 初始公園清單和地圖
    updateParkList();
    addGeoJSONToMap();
});
