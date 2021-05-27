// TODO: Should set view to LA/Socal area!


//create leaflet map and set params

const map = L.map('map').setView([33.9, -118.2437], 10);
//openstreetmap attribution
//L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//}).addTo(map);

//get basemap

let Stadia_AlidadeSmooth = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
	maxZoom: 20,
	attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
});

//set basemap
Stadia_AlidadeSmooth.addTo(map);

//create Leaflet feature group layers
let currentRenterLayer = L.featureGroup();
let notRenterLayer = L.featureGroup();
let harrassmentLayer = L.featureGroup();
let insecureLayer = L.featureGroup();
let hasResourceLayer = L.featureGroup();

// define layers
let layers = {
    "Currently renting": currentRenterLayer,
    "Not currently renting": notRenterLayer,
    "Stories about tenant harassment": harrassmentLayer,
    "Stories about housing insecurity": insecureLayer,
    "Has resource to share": hasResourceLayer
}

//get the datas as json
const url = "https://spreadsheets.google.com/feeds/list/16F-aIZ0PutDur9tXTy92JD7rFrHd3YHZB1wCsh9Gs04/on8014x/public/values?alt=json"
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

    //make the map zoom to the extent of markers
    let allLayers = L.featureGroup([currentRenterLayer, notRenterLayer, harrassmentLayer, insecureLayer, hasResourceLayer]);
    // Initially check all of the layers!
    currentRenterLayer.addTo(map);
    notRenterLayer.addTo(map);
    harrassmentLayer.addTo(map);
    insecureLayer.addTo(map);
    hasResourceLayer.addTo(map);
    
    map.fitBounds(allLayers.getBounds());
}

// function to sort out old data from 1st survey iteration
function sortOldData(data){
    if (data.timestamp != ''){
        //send to function to sort based on response, add marker and popup
        addDataBasedonField(data);
        //make a button
        createButtons(data.lat,data.lng,data.location)
        return data.timestamp
    }
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


//function to sort data based on response and
//create a marker with a pop up containing relevant info

function addDataBasedonField(data){

    //turn data values into variables
    let time = data.timestamp
    let zip = data.whatisyourcurrentormostrecentzipcode
    let renter = data.areyoucurrentlyarenter
    let addr = data.didtheseexperiencestakeplaceatyourcurrentormostrecentaddress
    let harassment = data.doyoufeelthatyouhavefacedanytypeoftenantharassment
    let secure = data.doyoufeelthatyourhousingsituationissecure
    let resources = data.isthereanythingyouwouldliketosharethathashelpedyouinyourhousingharassmentsituationthatyouwouldrecommendtosomeoneelse
    let latitude = data.lat
    let longitude = data.lng
    let insecurity = data.pleaseshareyourexperiencerelatingtohousinginsecurity
    let harassment_story = data.pleaseshareyourexperiencerelatingtotenantharassment
    let reasons = data.whatareyourreasonsfornotrenting
    let event_address = data.whatisthezipcodeoftheaddresswhereyourexperiencestookplace
    let current_zip = data.whatisyourcurrentormostrecentzipcode

    //determine if user is renter
    if (renter == "Yes"){
        //set marker color
        circleOptions.fillColor = "cyan";
        //use leaflet API to add marker w/ info in popup
        addPop(data, currentRenterLayer,
            '<h2>Timestamp</h2>' +
            time +
            '<h2>Do you feel that you have faced any type of tenant harassment?</h2>' +
            harassment + ". " + harassment_story +
            '<h2>Do you feel that your housing situation is secure?</h2>' +
            secure + ". " + insecurity +
            '<h2>Is there anything you would like to share that has helped you in your housing/harassment situation that you would recommend to someone else?</h2>' +
            resources
        )

        if (harassment == "Yes")
        {
            addPop(data, harrassmentLayer,
                '<h2>Timestamp</h2>' +
                time +
                '<h2>Tenant harassment story</h2>' +
                harassment_story
            )
        }

        if (secure == "No")
        {
            addPop(data, insecureLayer,
                '<h2>Timestamp</h2>' +
                time +
                '<h2>Housing insecurity story</h2>' +
                insecure
            )
        }

        if (resources.length != 0)
        {
            addPop(data, hasResourceLayer,
                '<h2>Timestamp</h2>' +
                time +
                '<h2>Resource</h2>' +
                resources
            )
        }

    } 
    //if user is not currently a renter, share their reasons for not renting
    else { // renter == "No"
        //set marker color
        circleOptions.fillColor = "magenta";
        //use leaflet API to add marker w/ info in popup
        addPop(data, notRenterLayer,
            '<h2>Timestamp</h2>' +
            time +
            '<h2>What are your reasons for not renting?</h2>' +
            reasons
        ) 
    }
    
}

//add layer control box
L.control.layers(null,layers, {collapsed: false}).addTo(map);
