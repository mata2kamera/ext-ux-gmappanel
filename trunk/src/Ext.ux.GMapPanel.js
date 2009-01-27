/**
 * @author Shea Frederick
 * http://www.vinylfox.com
 */

Ext.namespace('Ext.ux');
 
/**
 * This extension adds Google maps functionality to any panel or panel based component (ie: windows).
 * @class Ext.ux.GMapPanel
 * @extends Ext.Panel
 * @param {Object} config The config object
 */
Ext.ux.GMapPanel = Ext.extend(Ext.Panel, {
    /**
    * @cfg {String} gmapType
    * The type of map to display, options available are: 'map', 'panorama'.
    */
    /**
    * @cfg {Object} setCenter
    * A center starting point for the map. The map needs to be centered before it can be used.
    * The config can contain an address to geocode, and even a marker
    * \{
    *   geoCodeAddr: '4 Yawkey Way, Boston, MA, 02215-3409, USA',
    *   marker: \{title: 'Fenway Park'\}
    * \}
    * Or it can simply be a lat/lng. Either way, a marker is not required, all we are really looking for here is a starting center point for the map.
    * \{
    *   lat: 42.339641,
    *   lng: -71.094224
    * \}
    */
    /**
     * @cfg {Number} zoomLevel
     * The zoom level to initialize the map at, generally between 1 (whole planet) and 40 (street). Also used as the zoom level for panoramas, zero specifies no zoom at all.
     */
    /**
     * @cfg {Number} yaw
     * The Yaw, or rotational direction of the users perspective in degrees. Only applies to panoramas.
     */
    /**
     * @cfg {Number} pitch
     * The pitch, or vertical direction of the users perspective in degrees. Default is 0 (zero), straight ahead. Valid values are between +90 (straight up) and -90 (straight down). 
     */
    /**
     * @cfg {Boolean} displayGeoErrors
     * True to display geocoding errors to the end user via a message box.
     */
    /**
     * @cfg {Array} mapConfOpts
     * Array of strings representing configuration methods to call, a full list can be found here: http://code.google.com/apis/maps/documentation/reference.html#GMap2
     */
    /**
     * @cfg {Array} mapControls
     * Array of strings representing map controls to initialize, a full list can be found here: http://code.google.com/apis/maps/documentation/reference.html#GControlImpl
     */
    // private
    initComponent : function(){
        
        var defConfig = {
            plain: true,
            zoomLevel: 0,
            yaw: 180,
            pitch: 0,
            gmapType: 'map',
            border: false,
            displayGeoErrors: false
        };
        
        Ext.applyIf(this,defConfig);
        
        Ext.ux.GMapPanel.superclass.initComponent.call(this);        

    },
    // private
    afterRender : function(){
        
        var wh = this.ownerCt.getSize();
        Ext.applyIf(this, wh);
        
        Ext.ux.GMapPanel.superclass.afterRender.call(this);    
        
        if (this.gmapType === 'map'){
            this.gmap = new GMap2(this.body.dom);
        }
        
        if (this.gmapType === 'panorama'){
            this.gmap = new GStreetviewPanorama(this.body.dom);
        }

        if (typeof this.addControl == 'object' && this.gmapType === 'map') {
            this.getMap().addControl(this.addControl);
        }
        
        this.addMapControls();
        this.addOptions();
        
        if (typeof this.setCenter === 'object') {
            if (typeof this.setCenter.geoCodeAddr === 'string'){
                this.geoCodeLookup(this.setCenter.geoCodeAddr, this.setCenter.marker, false, true, this.setCenter.listeners);
            }else{
                if (this.gmapType === 'map'){
                    var point = new GLatLng(this.setCenter.lat,this.setCenter.lng);
                    this.getMap().setCenter(point, this.zoomLevel);    
                }
                if (typeof this.setCenter.marker === 'object' && typeof point === 'object'){
                    this.addMarker(point,this.setCenter.marker,this.setCenter.marker.clear);
                }
            }
            if (this.gmapType === 'panorama'){
                this.getMap().setLocationAndPOV(new GLatLng(this.setCenter.lat,this.setCenter.lng), {yaw: this.yaw, pitch: this.pitch, zoom: this.zoomLevel});
            }
        }

        GEvent.bind(this.gmap, 'load', this, function(){
            this.onMapReady();
        });

    },
    // private
    onMapReady : function(){
        
        this.addMarkers(this.markers);
        this.addKMLOverlay(this.autoLoadKML);
        
    },
    // private
    onResize : function(w, h){
        
        // check for the existance of the google map in case the onResize fires too early
        if (typeof this.getMap() == 'object') {
            this.getMap().checkResize();
        }
        
        Ext.ux.GMapPanel.superclass.onResize.call(this, w, h);

    },
    // private
    setSize : function(width, height, animate){
        
        // check for the existance of the google map in case setSize is called too early
        if (typeof this.getMap() == 'object') {
            this.getMap().checkResize();
        }
        
        Ext.ux.GMapPanel.superclass.setSize.call(this, width, height, animate);
        
    },
    /**
     * Returns the current google map
     * @return {GMap} this
     */
    getMap : function(){
        
        return this.gmap;
        
    },
    /**
     * Returns the maps center as a GLatLng object
     * @return {GLatLng} this
     */
    getCenter : function(){
        
        return this.getMap().getCenter();
        
    },
    /**
     * Returns the maps center as a simple object
     * @return {Object} this has lat and lng properties only
     */
    getCenterLatLng : function(){
        
        var ll = this.getCenter();
        return {lat: ll.lat(), lng: ll.lng()};
        
    },
    /**
     * Creates markers from the array that is passed in. Each marker must consist of at least lat and lng properties.
     * @param {Array} markers an array of marker objects
     */
    addMarkers : function(markers) {
        
        if (Ext.isArray(markers)){
            for (var i = 0; i < markers.length; i++) {
                if (typeof markers[i].geoCodeAddr == 'string') {
                    this.geoCodeLookup(markers[i].geoCodeAddr, markers[i].marker, false, markers[i].setCenter, markers[i].listeners);
                }else{
                    var mkr_point = new GLatLng(markers[i].lat, markers[i].lng);
                    this.addMarker(mkr_point, markers[i].marker, false, markers[i].setCenter, markers[i].listeners);
                }
            }
        }
        
    },
    /**
     * Creates a single marker.
     * @param {Object} point a GLatLng point
     * @param {Object} marker a marker object consisting of at least lat and lng
     * @param {Boolean} clear clear other markers before creating this marker
     * @param {Boolean} center true to center the map on this marker
     * @param {Object} listeners a listeners config
     */
    addMarker : function(point, marker, clear, center, listeners){
        
        Ext.applyIf(marker,G_DEFAULT_ICON);

        if (clear === true){
            this.getMap().clearOverlays();
        }
        if (center === true) {
            this.getMap().setCenter(point, this.zoomLevel);
        }

        var mark = new GMarker(point,marker);
        if (typeof listeners === 'object'){
            for (evt in listeners) {
                GEvent.bind(mark, evt, this, listeners[evt]);
            }
        }
        this.getMap().addOverlay(mark);

    },
    // private
    addMapControls : function(){
        
        if (this.gmapType === 'map') {
            if (Ext.isArray(this.mapControls)) {
                for(i=0;i<this.mapControls.length;i++){
                    this.addMapControl(this.mapControls[i]);
                }
            }else if(typeof this.mapControls === 'string'){
                this.addMapControl(this.mapControls);
            }else if(typeof this.mapControls === 'object'){
                this.getMap().addControl(this.mapControls);
            }
        }
        
    },
    /**
     * Adds a GMap control to the map.
     * @param {String} mc a string representation of the control to be instantiated.
     */
    addMapControl : function(mc){
        
        var mcf = window[mc];
        if (typeof mcf === 'function') {
            this.getMap().addControl(new mcf());
        }    
        
    },
    // private
    addOptions : function(){
        
        if (Ext.isArray(this.mapConfOpts)) {
            var mc;
            for(i=0;i<this.mapConfOpts.length;i++){
                this.addOption(this.mapConfOpts[i]);
            }
        }else if(typeof this.mapConfOpts === 'string'){
            this.addOption(this.mapConfOpts);
        }        
        
    },
    /**
     * Adds a GMap option to the map.
     * @param {String} mo a string representation of the option to be instantiated.
     */
    addOption : function(mo){
        
        var mof = this.getMap()[mo];
        if (typeof mof === 'function') {
            this.getMap()[mo]();
        }    
        
    },
    /**
     * Loads a KML file into the map.
     * @param {String} kmlfile a string URL to the KML file.
     */
    addKMLOverlay : function(kmlfile){
        
        if (typeof kmlfile === 'string' && kmlfile !== '') {
            var geoXml = new GGeoXml(kmlfile);
            this.getMap().addOverlay(geoXml);
        }
        
    },
    /**
     * Adds a marker to the map based on an address string (ie: "123 Fake Street, Springfield, NA, 12345, USA") or center the map on the address.
     * @param {String} addr the address to lookup.
     * @param {Object} marker the marker to add (optional).
     * @param {Boolean} clear clear other markers before creating this marker
     * @param {Boolean} center true to set this point as the center of the map.
     * @param {Object} listeners a listeners config
     */
    geoCodeLookup : function(addr, marker, clear, center, listeners) {
        
        if (!this.geocoder) {
            this.geocoder = new GClientGeocoder();
        }
        this.geocoder.getLocations(addr, this.addAddressToMap.createDelegate(this, [addr, marker, clear, center, listeners], true));
        
    },
    // private
    addAddressToMap : function(response, addr, marker, clear, center, listeners){
        if (!response || response.Status.code != 200) {
            Ext.MessageBox.alert('Error', 'Code '+response.Status.code+' Error Returned');
        }else{
            place = response.Placemark[0];
            addressinfo = place.AddressDetails;
            accuracy = addressinfo.Accuracy;
            if (accuracy === 0) {
                this.geoErrorMsg('Unable to Locate Address', 'Unable to Locate the Address you provided');
            }else{
                if (accuracy < 7) {
                    this.geoErrorMsg('Address Accuracy', 'The address provided has a low accuracy.<br><br>Level '+accuracy+' Accuracy (8 = Exact Match, 1 = Vague Match)');
                }else{
                    point = new GLatLng(place.Point.coordinates[1], place.Point.coordinates[0]);
                    if (center){
                        this.getMap().setCenter(point);
                    }
                    if (typeof marker === 'object') {
                        if (!marker.title){
                            marker.title = place.address;
                        }
                        Ext.applyIf(marker, G_DEFAULT_ICON);
                        this.addMarker(point, marker, clear, false, listeners);
                    }
                }
            }
        }
        
    },
    // private
    geoErrorMsg : function(title,msg){
        if (this.displayGeoErrors) {
            Ext.MessageBox.alert(title,msg);
        }
    }
 
});

Ext.reg('gmappanel',Ext.ux.GMapPanel); 