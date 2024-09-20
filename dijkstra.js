var dataLocations = "";

// Các nút và trường nhập liệu
var submitBestFirst = document.querySelector('.Best_First_Search');
var submitHillClimbing = document.querySelector('.Hill_Climbing');
var start = document.getElementById('start');
var end = document.getElementById('end');

// Lấy DATA JSON
fetch('./data.json')
  .then(response => response.json())
  .then(data => {
    dataLocations = data.locations;
    dataLocations.forEach(location => {
      const { cx, cy } = convertGPSToPixel(location.lat, location.long);

      // Tạo dấu chấm cho vị trí trên bản đồ
      var point = document.createElement('div');
      point.className = 'point';
      point.style.left = `${cx}px`;
      point.style.top = `${cy}px`;
      
      
      var label = document.createElement('span');
      label.className = 'label2';
      // label.style.left = `${cx}px`;
      // label.style.top = `${cy}px`;
      label.innerText = location.name;
      // console.log(label)
      
      point.appendChild(label);
      document.querySelector('.inner').appendChild(point);
  
    });
  })
  .catch(error => console.error('Error fetching the JSON file:', error));

// Thuật toán Hill Climbing
function hillClimbingSearch(startValue, endValue) {
  let startLocation = dataLocations.find(loc => loc.name === startValue);
  let endLocation = dataLocations.find(loc => loc.name === endValue);

  if (!startLocation || !endLocation) {
    console.log("Không tìm thấy đường đi phù hợp");
    return [];
  }

  let L = [startLocation];
  let visited = [startLocation]

  while (L.length > 0) {
    let u = L.shift();
    // console.log(u);
    visited.push(u);

    if (u.name === endValue) {
      console.log("Success! Found the end location:", u.name);
      return visited; // Trả về trạng thái kết thúc 
    }

    let L1 = u.near.map(id => dataLocations.find(loc => loc.id === id));
    L1.sort((a, b) => heuristic(a, endLocation) - heuristic(b, endLocation));

    L = [...L1, ...L]; // Chỉ giữ trạng thái tốt nhất tiếp theo
  }

  console.log("Không tìm thấy địa điểm!");
  return [];
}


// Thuật toán Best First Search
function bestFirstSearch(startValue, endValue) {
  let startLocation = dataLocations.find(loc => loc.name === startValue);
  let endLocation = dataLocations.find(loc => loc.name === endValue);

  if (!startLocation || !endLocation) {
    console.log("Không tìm thấy đường đi phù hợp");
    return [];
  }

  let openList = [startLocation];
  let closedList = [];
  let cameFrom = {};

  while (openList.length > 0) {
    openList.sort((a, b) => heuristic(a, endLocation) - heuristic(b, endLocation));

    let currentNode = openList.shift();
    if (currentNode.name === endValue) {
      console.log("Success! Found the end location:", currentNode.name);
      return reconstructPath(cameFrom, startLocation, currentNode);
    }

    closedList.push(currentNode);
    for (let neighborId of currentNode.near) {
      let neighbor = dataLocations.find(loc => loc.id === neighborId);
      if (!closedList.includes(neighbor) && !openList.includes(neighbor)) {
        openList.push(neighbor);
        cameFrom[neighbor.id] = currentNode;
      }
    }
  }

  console.log("Không tìm thấy địa điểm!");
  return [];
}


// Tính toán heuristic giữa 2 điểm
function heuristic(locationA, locationB) {
  let dx = locationA.lat - locationB.lat;
  let dy = locationA.long - locationB.long;
  return Math.sqrt(dx * dx + dy * dy);
}

// Hàm tái tạo đường đi trong Best First Search
function reconstructPath(cameFrom, start, goal) {
  let path = [goal];
  let current = goal;
  while (current.id !== start.id) {
    current = cameFrom[current.id];
    path.push(current);
  }
  return path.reverse();
}

// Kích thước bản đồ
const svgWidth = 500;
const svgHeight = 500;
const topLeft = { lat: 24.2, long: 97.34 };
const bottomRight = { lat: 7.812, long: 114.39 };

// Chuyển đổi tọa độ GPS sang tọa độ pixel
function convertGPSToPixel(lat, long) {
  const latRange = topLeft.lat - bottomRight.lat;
  const longRange = bottomRight.long - topLeft.long;

  const cx = ((long - topLeft.long) / longRange) * svgWidth;
  const cy = ((topLeft.lat - lat) / latRange) * svgHeight;

  return { cx, cy };
}

// Hàm để vẽ đường giữa các điểm
function drawLinesBetweenMarkers(locations) {
  const svgElement = document.getElementById('lines');

  // Xóa các đường cũ
  while (svgElement.firstChild) {
    svgElement.removeChild(svgElement.firstChild);
  }

  for (let i = 0; i < locations.length - 1; i++) {
    const start = convertGPSToPixel(locations[i].lat, locations[i].long);
    const end = convertGPSToPixel(locations[i + 1].lat, locations[i + 1].long);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", start.cx);
    line.setAttribute("y1", start.cy);
    line.setAttribute("x2", end.cx);
    line.setAttribute("y2", end.cy);
    line.setAttribute("class", "line");

    svgElement.appendChild(line);
  }
}

// Sự kiện cho các nút
submitBestFirst.addEventListener('click', function () {
  var startValue = start.value;
  var endValue = end.value;

  // Ẩn kết quả của Hill Climbing
  var hillClimbingResult = document.querySelector('.hill-climbing-result');
  var bestFirstResult = document.querySelector('.best-first-result');

  if (hillClimbingResult) {
    hillClimbingResult.style.display = 'none';
  }

  if (bestFirstResult) {
    bestFirstResult.style.display = 'block';
  }

  // Kiểm tra nút trước khi thay đổi thuộc tính style
  if (submitHillClimbing) {
    submitHillClimbing.style.display = 'none';
  }

  if (submitBestFirst) {
    submitBestFirst.style.display = 'block';
  }

  var dataResponse = bestFirstSearch(startValue, endValue);
  handleResponse(dataResponse);
});

submitHillClimbing.addEventListener('click', function () {
  var startValue = start.value;
  var endValue = end.value;

  // Ẩn kết quả của Best First Search
  var hillClimbingResult = document.querySelector('.hill-climbing-result');
  var bestFirstResult = document.querySelector('.best-first-result');

  if (bestFirstResult) {
    bestFirstResult.style.display = 'none';
  }

  if (hillClimbingResult) {
    hillClimbingResult.style.display = 'block';
  }

  // Kiểm tra nút trước khi thay đổi thuộc tính style
  if (submitBestFirst) {
    submitBestFirst.style.display = 'none';
  }

  if (submitHillClimbing) {
    submitHillClimbing.style.display = 'block';
  }

  var dataResponse = hillClimbingSearch(startValue, endValue);
  handleResponse(dataResponse);
});

function handleResponse(dataResponse) {
  var resElement = document.querySelector(".show-response");

  if (dataResponse.length === 0) {
    resElement.innerText = "Không tìm thấy địa điểm bạn yêu cầu!";
    return;
  }

  let path = dataResponse.map(value => value.name).join("⇢");
  resElement.innerText = path;

  document.querySelectorAll('.inner .point2').forEach(point => point.remove());
  // const lines = document.querySelector(".lines");

  dataResponse.forEach(location => {
    const { cx, cy } = convertGPSToPixel(location.lat, location.long);

    var point = document.createElement('div');
    point.className = 'point2';
    point.style.left = `${cx}px`;
    point.style.top = `${cy}px`;

    document.querySelector('.inner').appendChild(point);



  });

  drawLinesBetweenMarkers(dataResponse);
}
