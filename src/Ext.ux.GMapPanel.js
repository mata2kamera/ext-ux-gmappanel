/**
 * @author Shea Frederick
 * http://www.vinylfox.com
 */

Ext.namespace('Ext.ux');
 
/**
 * This extension adds Google maps functionality to any panel or panel based component (ie: windows).
 * @class Ext.ux.GMapPanel
 * @extends Ext.Panel
 */
Ext.ux.GMapPanel = Ext.extend(Ext.Panel, {
    // private
    initComponent : function(){
        
        var defConfig = {
            plain: true,
            zoomLevel: 3,
            yaw: 180,
            pitch: 0,
            zoom: 0,
            gmapType: 'map',
            border: false
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
                this.geoCodeLookup(this.setCenter.geoCodeAddr);
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
                this.getMap().setLocationAndPOV(new GLatLng(this.setCenter.lat,this.setCenter.lng), {yaw: this.yaw, pitch: this.pitch, zoom: this.zoom});
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
     * @return {Object} has lat and lng properties only
     */
    getCenterLatLng : function(){
        
        var ll = this.getCenter();
        return {lat: ll.lat(), lng: ll.lng()};
        
    },
    /**
     * Creates markers from the array that is passed in. Each marker must consist of at least lat and lng properties.
     * @param {Array} an array of marker objects
     */
    addMarkers : function(markers) {
        
        if (Ext.isArray(markers)){
            for (var i = 0; i < markers.length; i++) {
                var mkr_point = new GLatLng(markers[i].lat,markers[i].lng);
                this.addMarker(mkr_point,markers[i].marker,false,markers[i].setCenter, markers[i].listeners);
            }
        }
        
    },
    /**
     * Creates a single marker.
     * @param {Object} a GLatLng point
     * @param {Object} a marker object consisting of at least lat and lng
     * @param {Boolean} clear other markers before creating this marker
     * @param {Boolean} true to center the map on this marker
     * @param {Object} a listeners config
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
     * @param {String} a string representation of the control to be instantiated.
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
     * @param {String} a string representation of the option to be instantiated.
     */
    addOption : function(mc){
        
        var mcf = this.getMap()[mc];
        if (typeof mcf === 'function') {
            this.getMap()[mc]();
        }    
        
    },
    /**
     * Loads a KML file into the map.
     * @param {String} a string URL to the KML file.
     */
    addKMLOverlay : function(kmlfile){
        
        if (typeof kmlfile === 'string' && kmlfile !== '') {
            var geoXml = new GGeoXml(kmlfile);
            this.getMap().addOverlay(geoXml);
        }
        
    },
    /**
     * Adds a marker to the map based on an address string (ie: "123 Fake Street, Springfield, NA, 12345, USA").
     * @param {String} the address to lookup
     */
    geoCodeLookup : function(addr) {
        
        this.geocoder = new GClientGeocoder();
        this.geocoder.getLocations(addr, this.addAddressToMap.createDelegate(this));
        
    },
    // private
    addAddressToMap : function(response) {
        
        if (!response || response.Status.code != 200) {
            Ext.MessageBox.alert('Error', 'Code '+response.Status.code+' Error Returned');
        }else{
            place = response.Placemark[0];
            addressinfo = place.AddressDetails;
            accuracy = addressinfo.Accuracy;
            if (accuracy === 0) {
                Ext.MessageBox.alert('Unable to Locate Address', 'Unable to Locate the Address you provided');
            }else{
                if (accuracy < 7) {
                    Ext.MessageBox.alert('Address Accuracy', 'The address provided has a low accuracy.<br><br>Level '+accuracy+' Accuracy (8 = Exact Match, 1 = Vague Match)');
                }else{
                    point = new GLatLng(place.Point.coordinates[1], place.Point.coordinates[0]);
                    if (typeof this.setCenter.marker === 'object' && typeof point === 'object'){
                        this.addMarker(point,this.setCenter.marker,this.setCenter.marker.clear,true, this.setCenter.listeners);
                    }
                }
            }
        }
        
    }
 
});

Ext.reg('gmappanel',Ext.ux.GMapPanel); 