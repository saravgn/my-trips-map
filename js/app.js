'use strict';

/* ======= Model ======= */
//Array containing location data
// sidneyMarkers grouped by categories

self.beaches = ko.observableArray([
    { name: "Bondi Beach", lat: -33.890542, lng:151.274856, z:4},
    { name: "Coogee Beach", lat: -33.923036, lng:151.259052, z:5},
    { name: "Cronulla, NSW", lat: -34.055286, lng:151.154942, z:3},
    { name: "Manly Beach", lat: -33.80010128657071, lng:151.28747820854187, z:2},
    { name: "Maroubra Beach", lat: -33.950198, lng:151.259302, z:1}
]);

self.parks = ko.observableArray([
    { name: "Hollywood Los Angeles, CA, USA", lat: 34.090319, lng:-118.335408, z:1},

    { name: "Beverly Hills, California, United States", lat: 34.070027, lng:-118.403907, z:2},

    { name: "Page Canyon, Kittitas County, WA, United States", lat: 47.041145, lng:-120.689498, z:3},

    { name: "Santa Monica Way, San Francisco, CA, United States", lat: 37.737687, lng:-122.466754, z:4},

    { name: "Royal Botanic Gardens", lat: -33.864362, lng:151.218335, z:5},

    { name: "Orlando, FL, United States", lat: 28.520708, lng:-81.429243, z:6},

    { name: "Las Vegas, NV, United States", lat: 36.167923, lng:-115.210768, z:7},

    { name: "Las Vegas, NV, United States", lat: 36.167923, lng:-115.210768, z:8},

    { name: "New York, NY, United States", lat: 40.776138, lng:-73.977485, z:9},

    { name: "Roma, Italy", lat: 41.893788, lng:12.398718, z:10},

    { name: "Sydney, New South Wales", lat: -33.872111, lng:151.115753, z:10},

    { name: "Toronto, ON, Canada", lat: 43.641424, lng:-79.427552, z:11},

    { name: "Niagara Falls, ON, Canada", lat: 43.099488, lng:-79.096288, z:12},

    { name: "Atlanta, GA, United States", lat: 33.759071, lng:-84.426113, z:13},

    { name: "Damascus, Damascus Governorate, Siria", lat: 33.499953, lng:36.255414, z:14},

    { name: "Parigi, France", lat: 48.851094, lng:2.333125, z:15},

    { name: "London, United Kingdom", lat: 51.494976, lng:-0.116753, z:16},

]);

self.attractions = ko.observableArray([
    { name: "Sea Life Sydney Aquarium", lat: -33.869717, lng:151.202304, z:3},
    { name: "Luna Park", lat: -33.847930, lng:151.210021, z:2},
    { name: "Madame Tussouds", lat: -33.869408, lng:151.201819, z:1}
]);


/* ======= MapViewModel ======= */
// function to add markers, filter locations, update infowindows, show data and
// run API calls to get data

var MapViewModel = function() {

    self.infowindow = null;
    self.wikiName = ko.observable();
    self.wikiLink = ko.observable();
    self.wikiArrResults = ko.observableArray();
    self.visWikiErr = ko.observable(true);

    // icon for markers: beach, parks, attractions

    self.imageBeaches = {
        url: 'https://discoverycove.com/~/media/upload/icon-star-red.ashx?h=38&la=en&w=37',
    };

    self.imageParks = {
        // url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        url: 'https://discoverycove.com/~/media/upload/icon-star-red.ashx?h=38&la=en&w=37',

        scaledSize: new google.maps.Size(55, 55)
    };

    self.imageAttractions = {
        url: 'http://365psd.com/images/previews/8c4/waving-flag-icon-psd-image-2361flag-icon-512.png',
        scaledSize: new google.maps.Size(40, 40)
    };

    // Shapes define the clickable region of the icon.

    self.shape = {
        // coords: [1, 1, 1, 20, 18, 20, 18, 1],
        coords: [2, 2, 2, 40, 38, 40, 38, 3],
        type: 'poly'
    };

    self.marker;
    self.sidneyMarkers = ko.observableArray();
    self.currentMarkerName = ko.observable('Choose a marker to see ʘ‿ʘ');
    self.wikiError = ko.observable();

    // function to set infowindows
    function setInfoWindow(currentmarker){

        var streetviewUrl = 'http://maps.googleapis.com/maps/api/streetview?size=300x200&location=' + currentmarker.title + '';

        self.infowindow = new google.maps.InfoWindow({
        content: '<div id="content">'+
            '<div id="siteNotice">'+
            '<h2 id="firstHeading" class="firstHeading">City: ' + currentmarker.title + '</h2>' +
            '</div>'+
            '<div id="bodyContent">'+
            '<img class="bgimg" src="' + streetviewUrl + '">'+
            '<br>'+
            '<h1>' + 'Position: ' + '<br>'+ currentmarker.position + '</h1>'+
            '</div>'+
            '</div>',
        maxWidth: 200
        });
        self.infowindow.open(map, currentmarker);

        //Wikipedia API for search documents relative to the current marker
        self.wikiArrResults([]);

        var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + currentmarker.title + '&format=json&callback=wikiCallback';
            var timeout = setTimeout(function(){
                self.wikiError("Ops, wikepedia resourses not found");
            }, 3000);
            self.wikiError("");
            // Wikipedia Api to retrive wiki links about the marker
            $.ajax({
               url: wikiUrl,
               dataType: "jsonp",
               jsonp: "callback",
               }).done(function(response) {
                    var docswiki = response[1];
                    for (var i = 0; i < docswiki.length; i++) {
                        var namedoc = docswiki[i];
                        var url = 'https://en.wikipedia.org/wiki/' + namedoc;
                        self.wikiLink(url);
                        self.wikiName(namedoc);
                        self.wikiArrResults.push(
                            {
                                wikiLink : self.wikiLink(),
                                wikiName : self.wikiName(),
                            }
                        )
                    };
                    clearTimeout(timeout);
            });
    };

    // add markers to the map

    function setIconsidneyMarkers(sidneyMarkersArray,image){
        for (var i = 0; i < sidneyMarkersArray().length; i++) {
            var beach = sidneyMarkersArray()[i];
            self.marker = new google.maps.Marker({
                position: {lat: beach.lat, lng: beach.lng},
                map: self.map,
                icon: image,
                shape: shape,
                title: beach.name,
                zIndex: beach.z,
                mark_id: beach.name
            });

            //click on marker action with closure

            marker.addListener('click', (function(markerCopy) {
                return function(){
                    if(self.infowindow){
                        self.infowindow.close();
                    }
                    markerCopy.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(function() {
                            markerCopy.setAnimation("");
                    }, 1500);
                    self.currentMarkerName(markerCopy.title);

                    setInfoWindow(markerCopy);

                    self.animate(this.name, this);
                };
            })(marker));
            self.sidneyMarkers.push(self.marker);
        };
    };
    setIconsidneyMarkers(beaches, imageBeaches);
    setIconsidneyMarkers(parks, imageParks);
    setIconsidneyMarkers(attractions, imageAttractions);

    //search menu

    self.search = ko.observable('');
    var selectedMarker = null;

    self.onClickMarker = function(searchId) {

        if(self.infowindow){
            self.infowindow.close();
        }

        self.animate(searchId, null);
    };

    self.animate = function(searchId, marker) {
            self.sidneyMarkers().forEach(function(currentmarker) {
                if (currentmarker.mark_id === searchId) {
                    setInfoWindow(currentmarker);
                    // set animation on marker click
                    selectedMarker = currentmarker;
                    currentmarker.setAnimation(google.maps.Animation.BOUNCE);
                    var currentIcon = currentmarker.getIcon();
                    currentmarker.setIcon('http://img03.deviantart.net/a031/i/2004/311/3/c/taz_by_abovetheflames.gif');
                    self.map.setCenter(currentmarker.getPosition());
                    setTimeout(function() {
                            currentmarker.setAnimation("");
                            currentmarker.setIcon(currentIcon);
                    }, 2500);
                }
            });
    };

    self.visibleBeaches = ko.observable(true);
    self.visibleParks = ko.observable(true);
    self.visibleAttractions = ko.observable(true);

    self.search.subscribe(function(chosenMarkerName) {
        if(self.infowindow){
            self.infowindow.close();
        }
        chosenMarkerName = chosenMarkerName.toLowerCase();
        var mod = false;
        ko.utils.arrayForEach(self.sidneyMarkers(), function(sidneyMarker) {
            var markerTitleLC = sidneyMarker.title.toLowerCase();
            if (markerTitleLC.search(chosenMarkerName) === -1) {
                if (sidneyMarker.getVisible() === true) {
                    mod = true;
                }
                sidneyMarker.setVisible(false);
            } else {
                if (sidneyMarker.getVisible() === false) {
                    mod = true;
                }
                sidneyMarker.setVisible(true);
            }
        });
        if (mod === true) {
            var smarkers = self.sidneyMarkers().slice(0);
            self.sidneyMarkers([]);
            self.sidneyMarkers(smarkers);
        }
    });
};

function errorScript(){
    alert("Ops, there has been a problem with Google")
}


/* ======= Initialize ======= */
// function to load map and start up app

function init() {

    // Load google maps

    //map options
    self = this;
    self.mapOptions = {
        zoom: 10,
        center: {lat: -33.861212, lng: 151.210691},
        // Adding Controls to the Map
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: true,
        rotateControl: true,
        fullscreenControl: true
    };
    self.map = new google.maps.Map(document.getElementById("map"), mapOptions);

    // Instantiate View Model
    self.mapview = new MapViewModel();

    // Apply knockout bindings
    ko.applyBindings(self.mapview);
};
