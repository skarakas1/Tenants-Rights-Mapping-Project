//create leaflet map and set params
const map = L.map('map').setView([0, 0], 2);
//openstreetmap attribution
//L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//}).addTo(map);

//get basemap
let Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    
});
//set basemap
Esri_WorldImagery.addTo(map);

//get the datas as json
const url = "https://spreadsheets.google.com/feeds/list/1aWClrKHcuVol5z2qQ5gGsHzY98aQkMvD39fVPeXPb0Q/onpdsx9/public/values?alt=json"
fetch(url)
	.then(response => {
		return response.json();
		})
    //send to function to parse json
    .then(data =>{
        processData(data)}
        )

//clean data and make objects
function processData(theData){
    const formattedData = [] /* this array will eventually be populated with the contents of the spreadsheet's rows */
    const rows = theData.feed.entry // this is the weird Google Sheet API format we will be removing
    // we start a for..of.. loop here 
    for(const row of rows) { 
      const formattedRow = {}
      for(const key in row) {
        // time to get rid of the weird gsx$ format...
        if(key.startsWith("gsx$")) {
              formattedRow[key.replace("gsx$", "")] = row[key].$t
        }
      }
      // add the clean data
      formattedData.push(formattedRow)
    }
    // lets see what the data looks like when its clean!
    console.log(formattedData)
    //send to old data function
    formattedData.forEach(sortOldData)
}

//function to sort out old data from 1st survey iteration
function sortOldData(data){
    if (data.timestamp != ''){
        //send to function to sort based on response, add marker and popup
        addDataBasedonField(data);
        //make a button
        createButtons(data.lat,data.lng,data.location)
        return data.timestamp
    }
}

//create button function
function createButtons(lat,lng,title){
    const newButton = document.createElement("button"); // adds a new button
    newButton.id = "button"+title; // gives the button a unique id
    newButton.innerHTML = title; // gives the button a title
    newButton.setAttribute("lat",lat); // sets the latitude 
    newButton.setAttribute("lng",lng); // sets the longitude 
    newButton.addEventListener('click', function(){
        map.flyTo([lat,lng],15); //this is the flyTo from Leaflet
    })
    const spaceForButtons = document.getElementById("contents")
    spaceForButtons.appendChild(newButton); //this adds the button to our page.
}

//create circle marker
let circleOptions = {
    radius: 5,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
}

//pop up function and assign layer
function addPop(data, group, popUpInfo){
    group.addLayer(L.circleMarker([data.lat,data.lng],circleOptions).addTo(map).bindPopup(popUpInfo))
}

//create Leaflet feature group layers
let hasMoved = L.featureGroup();
let hasNotMoved = L.featureGroup();

//function to sort data based on response and
//create a marker with a pop up containing relevant info
function addDataBasedonField(data){
    //determine if user has left hometown
    //if yes display hometown and what they miss
    if (data.doyoulivesomewhereelsenow == "Yes"){
        //set marker color
        circleOptions.fillColor = "cyan";
        //use leaflet API to add marker w/ info in popup
        addPop(data, hasMoved,
            '<h2>Hometown</h2>' +
            data.location +
            '<h2>Is there anything you miss?</h2>' +
            data.isthereanythingyoumissaboutyourhometown
        )
    } 
    //if no display hometown and where they would like to move
    if (data.doyoulivesomewhereelsenow == "No") {
        //set marker color
        circleOptions.fillColor = "magenta";
        //use leaflet API to add marker w/ info in popup
        addPop(data, hasNotMoved,
            '<h2>Hometown</h2>' +
            data.location +
            '<h2>Is there anywhere you would like to move to?</h2>' +
            data.isthereanywhereyouwouldliketomoveto
        ) 
    }
}

// define layers
let layers = {
    "Has Moved": hasMoved,
    "Has Not Moved": hasNotMoved
}

//add layer control box
L.control.layers(null,layers).addTo(map)

//make the map zoom to the extent of markers
let allLayers = L.featureGroup([hasMoved,hasNotMoved]);
map.fitBounds(allLayers.getBounds());
