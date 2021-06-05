// TODO: Should set view to LA/Socal area!

//---------------------------------------MAP SCRIPTS
//create leaflet map and set params
const map = L.map('map', {
    center: [33.9, -118.2437],
    zoom: 10,
    scrollWheelZoom: false
});
//get basemap
let CartoDB_Positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 19
});
//set basemap
CartoDB_Positron.addTo(map);


//-----------------------------------------------LAYERS
//create Leaflet feature group layers
let totalResponseLayer = L.featureGroup();
let harrassmentLayer = L.featureGroup();
let insecureLayer = L.featureGroup();

// define layers
let layers = {
    "All Responses": totalResponseLayer,
    "Stories about tenant harassment": harrassmentLayer,
    "Stories about housing insecurity": insecureLayer,
}

//----------------------------------------DATA CLEANING/SHEETS API
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
    formattedData.forEach(createObject)//create object and send to global array
    console.log(objectArray)//log the objects
}

let id = 0;//create a unique id for each survey response object
let objectArray = [];//create an array to store the objects

//create survey response object
function createObject(data, id){
    let thisData = {
        "id": id + 1,
        "lat": data.lat,
        "lng": data.lng,
        "time":data.timestamp,
        "address1": data.whatisyourcurrentormostrecentzipcode,
        "renter": data.areyoucurrentlyarenter,
        "currentZipYN": data.didtheseexperiencestakeplaceatyourcurrentormostrecentaddress,
        "harassmentYN": data.doyoufeelthatyouhavefacedanytypeoftenantharassment,
        "secureYN": data.doyoufeelthatyourhousingsituationissecure,
        "resources": data.isthereanythingyouwouldliketosharethathashelpedyouinyourhousingharassmentsituationthatyouwouldrecommendtosomeoneelse,
        "insecurity": data.pleaseshareyourexperiencerelatingtohousinginsecurity,
        "harassment": data.pleaseshareyourexperiencerelatingtotenantharassment,
        "reasons": data.whatareyourreasonsfornotrenting,
        "address2": data.whatisthezipcodeoftheaddresswhereyourexperiencestookplace,
        "addressCurrent": data.inwhatzipcodedidyourexperiencestakeplace,
        "email": data.pleaseenteryouremailaddress
    }
    objectArray.push(thisData);//add object to global array objectArray
    //popMap(thisData);
}


//-----------------------------------------SIDEBAR
function createSidebar(objectArray){
    objectArray.forEach(popSidebar);
}
function popSidebar(object){
    if(object.insecurity){
        //add tab & text
    }
    if(object.harassment){ 
        //add tab & text
    }
    if(object.reasons){
        //add tab & text + upvote/downvote
    }
}

//ALBERT'S UPVOTE FUNCTION
function getUpvotes(zipField,communityResourceID){
    let url = 'https://docs.google.com/forms/d/e/1FAIpQLSevye7kmOaEeC879skTARFepAwyCus66WqQHEha0_FzY88Z-A/viewform?usp=pp_url'
    let param1 = '&entry.1155798845='+zipField
    let param2 = `&entry.725289503=kfHDJKhdsjkhfdjkf=`+communityResourceID
    let iframeUrl = url + param1 + param2
    // someone clicks on CR
    // then show them the up vote form

}














//-----------------------------------------POULATE MAP
//create circle marker
// let circleOptions = {
//     radius: 7,
//     fillColor: "yellow",
//     color: "#000",
//     weight: 1,
//     opacity: 1,
//     fillOpacity: 0.8
// }
// //function for add markers & assign layer   
// function addMarkers(data, group){
//     group.addLayer(L.circleMarker([data.lat,data.lng],circleOptions).addTo(map))//REMOVED 'bind popup'
// }
// function popMap(object){//function to populate the map
//     addMarkers(object, totalResponseLayer);//add marker/layer regardless for total responses
//     if(object.harassmentYN){//add markers/layer for 'have experienced harassment'
//         circleOptions.fillColor = "orange";//set marker color
//         addMarkers(object, harrassmentLayer);
//     }
//     if(object.secureYN){//add markers/layer for 'feel housing insecure'
//         circleOptions.fillColor = "red";
//         addMarkers(object, insecureLayer);
//     }
// }

//-----------------------------------------------------LAYER CONTROL BOX
// //add layer control box
//     //allLayers is never used?
//     let allLayers = L.featureGroup([currentRenterLayer, notRenterLayer, harrassmentLayer, insecureLayer, hasResourceLayer]);
//     // Initially check all of the layers!
//     currentRenterLayer.addTo(map);
//     notRenterLayer.addTo(map);
//     harrassmentLayer.addTo(map);
//     insecureLayer.addTo(map);
//     hasResourceLayer.addTo(map);
//     L.control.layers(null,layers, {collapsed: false}).addTo(map);

// //-----------------------------------------------------MODAL SCRIPT
// // Get the modal
// var modal = document.getElementById("myModal");

// // Get the button that opens the modal
// var btn = document.getElementById("myBtn");

// // Get the <span> element that closes the modal
// var span = document.getElementsByClassName("close")[0];

// // When the user clicks on the button, open the modal
// window.addEventListener('load', (event) => {
//   modal.style.display = "block";
// });

// // When the user clicks on <span> (x), close the modal
// span.onclick = function() {
//   modal.style.display = "none";
// }

// // When the user clicks anywhere outside of the modal, close it
// window.onclick = function(event) {
//   if (event.target == modal) {
//     modal.style.display = "none";
//   }
// }