//variable declarations
let id = 0;//create a unique id for each survey response object
//let objectArray = [];//create an array to store the objects
    //^i don't think we ever use this array

//-----------------------------------------
//--------------------MAP LAYERS----------
//-----------------------------------------
//create Leaflet feature group layers
let totalResponseLayer = L.featureGroup();
let harassmentLayer = L.featureGroup();
let insecureLayer = L.featureGroup();
let resourcesLayer = L.featureGroup();

// define layers
let layers = {
    "All Responses": totalResponseLayer,
    "Stories about tenant harassment": harassmentLayer,
    "Stories about housing insecurity": insecureLayer,
    "Community solutions": resourcesLayer
}

//-----------------------------------------
//--------------------MAP SCRIPTS----------
//-----------------------------------------
//create leaflet map and set params
const map = L.map('map', {
    center: [33.9, -118.2437],
    zoom: 10,
    //LEAFLET SLEEP OPTIONS
    // true by default, false if you want a wild map
    sleep: true,
    // time(ms) for the map to fall asleep upon mouseout
    sleepTime: 750,
    // time(ms) until map wakes on mouseover
    wakeTime: 750,
    // defines whether or not the user is prompted oh how to wake map
    sleepNote: true,
    // should hovering wake the map? (clicking always will)
    hoverToWake: false
    //scrollWheelZoom: false//added leaflet sleep instead
});
//get basemap
let CartoDB_Positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 19
});
//set basemap
CartoDB_Positron.addTo(map);

//-----------------------------------------
//--------------DATA CLEANING/SHEETS API---
//-----------------------------------------
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
    //console.log(objectArray)//log the objects
}

//create survey response object
function createObject(data, id){
    let thisData = {
        "id": id + 1,//object IDs start at '1'
        "lat": data.lat,
        "lng": data.lng,
        "time":data.timestamp,
        "address1": data.whatisyourcurrentormostrecentaddress,
        "renter": data.areyoucurrentlyarenter,
        "currentZipYN": data.didtheseexperiencestakeplaceatyourcurrentormostrecentaddress,
        "harassmentYN": data.doyoufeelthatyouhavefacedanytypeoftenantharassment,
        "secureYN": data.doyoufeelthatyourhousingsituationissecure,
        "resources": data.isthereanythingyouwouldliketosharethathashelpedyouinyourhousingharassmentsituationthatyouwouldrecommendtosomeoneelse,
        "insecurity": data.pleaseshareyourexperiencerelatingtohousinginsecurity,
        "harassment": data.pleaseshareyourexperiencerelatingtotenantharassment,
        "reasons": data.whatareyourreasonsfornotrenting,
        "address2": data.whatisthezipcodeoftheaddresswhereyourexperiencestookplace,
        "addressCurrent": data.atwhataddressdidyourexperiencestakeplace,
        "email": data.pleaseenteryouremailaddress
    }//THIS IS THE SURVEY DATA OBJECT

    // step 1: turn allPoints into a turf.js featureCollection
    thePoints = turf.featureCollection(allPoints)
    // console.log(thePoints)

    // step 2: run the spatial analysis
    getBoundary(boundaryLayer)

    //turf requires lng,lat format other than lat,lng
    let thisPoint = turf.point([Number(data.lng),Number(data.lat)],{thisData})// create the turfJS point
    allPoints.push(thisPoint)// put all the turfJS points into `allPoints`

    //objectArray.push(thisData);//add object to global array objectArray
    //^i don't think we ever use this array
    popMap(thisData);
}

//-----------------------------------------
//--------------------POPULATE MAP---------
//-----------------------------------------
//create circle marker
let circleOptions = {
    radius: 300,
    fillColor: "red",
    color: "#FFCAB1",
    weight: 1,
    opacity: 1,
    fillOpacity: .3
}
//function for add markers & assign layer   
function addMarkers(data, group){
    group.addLayer(L.circle([data.lat,data.lng],circleOptions).addTo(map))//REMOVED 'bind popup'
}
function popMap(object){//function to populate the map
    addMarkers(object, totalResponseLayer);//add marker/layer regardless for total responses
    if(object.harassmentYN){//add markers/layer for 'have experienced harassment'
        circleOptions.fillColor = "red";//set marker color
        circleOptions.fillOpacity = ".3"
        addMarkers(object, harassmentLayer);
    }
    if(object.secureYN){//add markers/layer for 'feel housing insecure'
        circleOptions.fillColor = "red";
        circleOptions.fillOpacity = ".3"
        addMarkers(object, insecureLayer);
    }
}

//-----------------------------------------
//--------------------ZIPCode Boundary Layer
//-----------------------------------------
//declarations for turf stuff
let allLayers;
// this is the boundary layer located as a geojson in the /data/ folder 
const boundaryLayer = "../data/la_zipcodes.geojson"
let boundary; // place holder for the data
let collected; // variable for turf.js collected points 
let allPoints = []; // array for all the data points

//HTML DOM declarations
let sideBarNav = document.getElementById("sidebarnav");
let sideBarText = document.getElementById("sidebartext");


function getSurveyInfo(survey){
    console.log('survey')
    console.log(survey)
    // let result = survey.resources
    let result;
    let thisZipcode = document.createElement('div')
    if (survey.resources){
        result = survey.resources
    }
    else{
        // result = "no resources"
    }
    thisZipcode.innerHTML = result
    console.log('thisZipcode')
    console.log(thisZipcode)
    // console.log(thisZipcode.innerHTML)
    sideBarText.appendChild(thisZipcode)
    return result
}
//function for clicking on polygons
function onEachFeature(feature, layer) {
    // console.log(feature.properties)
    let text;
    // do this only if there is survey data in a zipcode
    if (feature.properties.values.length > 0) {//within this if statement onEachFeature loops thru everything 
        let zipcode = feature.properties.zcta
        let surveyData = feature.properties.values //array of all the survey data in a zipcode
        //TO GET INDV DATA IT MUST HAPPEN IN THIS FOLLOWING LOOP>>>
        surveyData.forEach(survey => getSurveyInfo(survey))
        //count the values within the polygon by using .length on the values array created from turf.js collect
        let count = feature.properties.values.length
        // console.log(count) // see what the count is on click
        //this is thesurvey data/zip
    }
    else{
        text = "We don't have any data for this zipcode yet--please fill out the <a href='survey.html'> survey!</a>"
        // text = count.toString() // convert it to a string
        //THIS WILL HAVE TO CHANGE IF WE'RE NOT USING POPUPS
         //bind the pop up to the number
        layer.bindPopup(text);
        }
}

//turf.js geoprocessing and polygons
function getBoundary(layer){
    fetch(layer)
    .then(response => {
        return response.json();
        })
    .then(data =>{
                //set the boundary to data
                boundary = data
                // run the turf collect geoprocessing
                collected = turf.collect(boundary, thePoints, 'thisData', 'values');
                // console.log('collected')
                // console.log(collected)
                // here is the geoJson of the `collected` result:                
                L.geoJson(collected,{onEachFeature: onEachFeature,style:function(feature){
                    // console.log(feature)
                    if (feature.properties.values.length > 0) {
                        return {
                            color: "orange",stroke: true
                        };
                    }
                    else{
                        // make the polygon gray and blend in with basemap if it doesn't have any values
                        return{
                            opacity:0,color:"#efefef"
                        }
                    }
                }
                // add the geojson to the map
                    }).addTo(map)
        }
    )   
}
//console.log(boundary)
//-----------------------------------------
//--------------------SIDEBAR--------------
//-----------------------------------------

//THIS IS ALL PSEUDOCODE...
//function to determine which id story to display
// function getStoryID(zipcode?, object array?){
//     for(item in objectArray){
//         if(item.zipcode){    
//     }
// }
// //send each object thru sidebar function?
// function createSidebar(objectArray, index){
//     objectArray.forEach(popSidebar);
// }
// //
// function popSidebar(object){
//     if(object.insecurity){
//         //add tab & text
//     }
//     if(object.harassment){ 
//         //add tab & text
//     }
//     if(object.reasons){
//         //add tab & text + upvote/downvote
//     }
// }

// //--------------------------ALBERT'S UPVOTE FUNCTION
// function getUpvotes(zipField,communityResourceID){
//     let url = 'https://docs.google.com/forms/d/e/1FAIpQLSevye7kmOaEeC879skTARFepAwyCus66WqQHEha0_FzY88Z-A/viewform?usp=pp_url'
//     let param1 = '&entry.1155798845='+zipField
//     let param2 = `&entry.725289503=kfHDJKhdsjkhfdjkf=`+communityResourceID
//     let iframeUrl = url + param1 + param2
//     // someone clicks on CR
//     // then show them the up vote form
// }

//-----------------------------------------
//--------------------LAYER CONTROL----------
//-----------------------------------------
//add layer control box
allLayers = L.featureGroup([totalResponseLayer, harassmentLayer, insecureLayer, resourcesLayer]);
function layerControl(layerGroup){
    totalResponseLayer.addTo(map);
    insecureLayer.addTo(map);
    harassmentLayer.addTo(map);
    resourcesLayer.addTo(map);
    L.control.layers(null,layers, {collapsed: false}).addTo(map);
}
layerControl(allLayers);

//-----------------------------------------
//--------------------Geocode Search--------
//-----------------------------------------
//this search bar will allow the user to put in their address and fly them to their zipcode
//if there are resources they will pop up in the sidebar
//if more than one, sorted by up/down vote
//this will work by an eventhandler assoc. w/ the search fly to function
// same function to display sidebar will also execute on each zipcode onclick
// IF there is no survey filled out for that zipcode, display a message that says something like:
// ~~"there is no survey data for this zip yet, please fill out the survey"~~

const search = new GeoSearch.GeoSearchControl({
    provider: new GeoSearch.OpenStreetMapProvider(),
  });

map.addControl(search);
//console.log(GeoSearch.OpenStreetMapProvider)

//-----------------------------------------
//--------------------MODAL----------
//-----------------------------------------
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