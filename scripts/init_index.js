//HELLO WE ARE GLOBAL VARIABLES
let id = 0;//create a unique id for each survey response object

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

let globalZip = "this is broken!";

//declarations for turf stuff
let allLayers;
// this is the boundary layer located as a geojson in the /data/ folder 
const boundaryLayer = "./data/la_zipcodes.geojson"
let boundary; // place holder for the data
let collected; // variable for turf.js collected points 
let allPoints = []; // array for all the data points

//HTML DOM declarations
let sideBarNav = document.getElementById("sidebarnav");
let sideBarText = document.getElementById("sidebartext");

// Variable tracking current sidebar tab changes based on button clicked
// might not be the intelligent solution
// right now, currentTab is not changing at all
let currentTab = 0
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

//DATA CLEANING & SHEETS AP
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
    // step 1: turn allPoints into a turf.js featureCollection
    thePoints = turf.featureCollection(allPoints)

    // step 2: run the spatial analysis
    getBoundary(boundaryLayer)
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

    //turf requires lng,lat format other than lat,lng
    let thisPoint = turf.point([Number(data.lng),Number(data.lat)],{thisData})// create the turfJS point
    allPoints.push(thisPoint)// put all the turfJS points into `allPoints`

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
    fillOpacity: .25
}

//function for add markers & assign layer   
function addMarkers(data, group){
    group.addLayer(L.circle([data.lat,data.lng],circleOptions).addTo(map))//REMOVED 'bind popup'
}

function popMap(object){//function to populate the map
    addMarkers(object, totalResponseLayer);//add marker/layer regardless for total responses
    if(object.harassmentYN){//add markers/layer for 'have experienced harassment'
        circleOptions.fillColor = "red";//set marker color
        circleOptions.fillOpacity = ".25"
        addMarkers(object, harassmentLayer);
    }
    if(object.secureYN){//add markers/layer for 'feel housing insecure'
        circleOptions.fillColor = "red";
        circleOptions.fillOpacity = ".25"
        addMarkers(object, insecureLayer);
    }
    if(object.resources){
        circleOptions.fillColor = "red";
        circleOptions.fillOpacity = ".25"
        addMarkers(object, resourcesLayer);
    }
}

// function to create Tab Menu
function createTabMenu(id,readableName,tabIndex){
    let tabMenu = document.getElementById('sidebarnav')
    let thisTabButton = document.createElement('button')
    thisTabButton.id = id
    thisTabButton.setAttribute("tabIndex",tabIndex)
    thisTabButton.innerHTML = readableName
    // this is the event listener for the buttons
    // you will need to loop through the survey data to populate this correctly
    // let me know if you get stuck!
    thisTabButton.addEventListener('click',function(){
        currentTab = tabIndex
        // Todo: create a function to update the data here
        setContentToTab(currentTab)
        // i believe you run 
        // `if (currentTab == 0)` in getSurveyInfo()
        // which will only fire once. are you able to re-populate the survey data correctly?
        // if not, then without looking further my recommendation is:
            // 1. add the data for each of the tabs inside of the data-attribute for the button
            // 2. loop through and regenerate the content in `thisZipcode.textContent = harassmentTab`
    })
    // add this new tabButton to the tabMenu
    tabMenu.appendChild(thisTabButton)
}

const tabIndices = {
    0: "harassmentContent",
    1: "securityContent",
    2: "resourcesContent",
    3: "notRentingContent"
    // continue for all tabs, correct numbering later
}

function setContentToTab(tabindex){
    // need to filter by zipcode
    let lookUpTarget = tabIndices[tabindex]

    // creates array
    let divsToChange = document.getElementsByClassName(lookUpTarget)

        // Display current tab
    var numDivs = divsToChange.length // Number of surveys, so works for all divs
    for (i = 0; i < numDivs; i++)
    {
            divsToChange[i].style.display = "grid"
    }

    // Hide other tabs
    for (i = 0; i < 4; i++)
    {
        if (i != tabindex)
        {
            lookUpTarget = tabIndices[i]
            divsToChange = document.getElementsByClassName(lookUpTarget)
            for (j = 0; j < numDivs; j++)
            {
                divsToChange[j].style.display = "none"
            }
        }
        // else do nothing :)
        // I think this is better for readability to separate
    }
}

// create the tabMenu for the following:
createTabMenu('harassmentButton','Tenant harassment stories',0)
createTabMenu('securityButton','Housing insecurity stories',1)
createTabMenu('resourcesButton','Community solutions',2)
createTabMenu('nonRentersButton','Nonrenters',3)


function getSurveyInfo(survey){
    // let result = survey.resources
    // let result;

    let harassmentTab, securityTab, resourcesTab, notRentingTab;
    let thisZipcode = document.createElement('div')
    thisZipcode.setAttribute('class',globalZip)
    

    // if renter
    // generate tabs for harassment story/security story/resources
    // tab selected populates text of sidebar
    if (survey.renter)
    {
        notRentingTab = ""
        if (survey.harassmentYN)
        {
            if (survey.harassment != "")
            {
                harassmentTab = survey.harassment
            }
            else
            {
                harassmentTab = "[This tenant has experienced harassment and did not share a story.]"
            }
        }
        else
        {
            harassmentTab = ""
        }
        if (survey.secureYN)
        {
            if (survey.insecurity != "")
            {
                securityTab = survey.insecurity
            }
            else
            {
                securityTab = "[This tenant has experienced housing insecurity and did not share a story.]"
            }
        }
        if (survey.resources){
            resourcesTab = survey.resources
        }
        else{
            resourcesTab = "" // empty string :)
        }
    }
    else
    {
        notRentingTab = survey.reasons
    }

    let surveyID = "survey_" + survey.id
    // Make the divs contain the data
    // how to make div id = a variable? how to make inner text a variable???
    //<div id=surveyID tab-index="0">harassmentTab</div> leads to problems
    
    // innerHTML security concerns: https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML
    // trying alternative https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
    //thisZipcode.innerHTML = result 
    let allSurveyContentDiv = document.getElementById("sidebarcontent")
    let thisSurveysDiv = document.createElement('div')
    thisSurveysDiv.id = surveyID
    allSurveyContentDiv.appendChild(thisSurveysDiv)
    let targetContainer = document.getElementById(surveyID)
    
    

    
    // harassmentTabContent corresponds w/ 0
    let harassmentTabContent = document.createElement('div')
    harassmentTabContent.className = 'harassmentContent'
    harassmentTabContent.textContent = harassmentTab
    harassmentTabContent.setAttribute("tabindex","0")
    targetContainer.appendChild(harassmentTabContent)

    // securityTabContent corresponds w/ 1
    let securityTabContent = document.createElement('div')
    securityTabContent.className = 'securityContent'
    securityTabContent.textContent = securityTab
    securityTabContent.setAttribute("tabindex","1")
    targetContainer.appendChild(securityTabContent)

    // resourcesTabContent corresponds w/ 2
    let resourcesTabContent = document.createElement('div')
    resourcesTabContent.className = 'resourcesContent'
    resourcesTabContent.textContent = resourcesTab
    resourcesTabContent.setAttribute("tabindex","2")
    targetContainer.appendChild(resourcesTabContent)

    // notRentingTabContent corresponds w/ 3
    let notRentingTabContent = document.createElement('div')
    notRentingTabContent.className = 'notRentingContent'
    notRentingTabContent.textContent = notRentingTab
    notRentingTabContent.setAttribute("tabindex","3")
    targetContainer.appendChild(notRentingTabContent)

    sideBarText.appendChild(thisZipcode)
    return thisZipcode//.textContent
}

//function for clicking on polygons
function onEachFeature(feature, layer) {
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

        layer.on('click',function(){zipCodeClick(zipcode)})
    }
    else{
        text = "We don't have any data for this zipcode yet--please fill out the <a href='survey.html'> survey!</a>"
        // text = count.toString() // convert it to a string
        //THIS WILL HAVE TO CHANGE IF WE'RE NOT USING POPUPS
         //bind the pop up to the number
        layer.bindPopup(text);
        }
}

function zipCodeClick(zipcode){
    globalZip = zipcode;
    console.log(globalZip)
}

//turf.js geoprocessing and polygons
function getBoundary(layer){
    fetch(layer)
    .then(response => {
        return response.json();
        })
    .then(boundary =>{
                //set the boundary to data
                // run the turf collect geoprocessing
                collected = turf.collect(boundary, thePoints, 'thisData', 'values');                
                 // here is the geoJson of the `collected` result:
                 L.geoJson(collected,{onEachFeature: onEachFeature,style:function(feature){
                    if (feature.properties.values.length > 0) {
                        return {color: "orange",stroke: false};
                    }
                    else{// make the polygon gray and blend in with basemap if it doesn't have any values
                        return{opacity:0,color:"#efefef"};
                    }
                }
                // add the geojson to the map
            }).addTo(map)
        })   
}

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

