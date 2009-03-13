/**
 * @author Shea
 */

Ext.onReady(function(){

    var mapwin;
    var button = Ext.get('show-btn');

    button.on('click', function(){
        // create the window on the first click and reuse on subsequent clicks
        if(!mapwin){

            mapwin = new Ext.Window({
                layout: 'fit',
                title: 'GMap Window',
                closeAction: 'hide',
                width:400,
                height:400,
                x: 40,
                y: 60,
                items: {
                    xtype: 'gmappanel',
                    zoomLevel: 14,
                    gmapType: 'map',
                    id: 'my_map',
                    mapConfOpts: ['enableScrollWheelZoom','enableDoubleClickZoom','enableDragging'],
                    mapControls: ['GSmallMapControl','GMapTypeControl','NonExistantControl'],
                    setCenter: {
                        geoCodeAddr: '4 Yawkey Way, Boston, MA, 02215-3409, USA',
                        marker: {title: 'Fenway Park'}
                    },
					buttons: [{
						text: 'Museum of Fine Arts',
						handler: function(){
							Ext.getCmp('my_map').geoCodeLookup('465 Huntington Avenue, Boston, MA, 02215-5597, USA', undefined, false, true, undefined);
						}
					},{
						text: 'Fenway Park',
						handler: function(){
							Ext.getCmp('my_map').geoCodeLookup('4 Yawkey Way, Boston, MA, 02215-3409, USA', undefined, false, true, undefined);
						}
					},{
						text: 'Zoom Fenway Park',
						handler: function(){
							// this way will apply the zoom level to every map move
							Ext.getCmp('my_map').zoomLevel = 19;
							Ext.getCmp('my_map').geoCodeLookup('4 Yawkey Way, Boston, MA, 02215-3409, USA', undefined, false, true, undefined);
							// or you can set it just once
							// Ext.getCmp('my_map').getMap().setZoom(19);
						}
					},{
						text: '+',
						minWidth: 30,
						handler: function(){
							var c = Ext.getCmp('my_map');
							var m = c.getMap();
							m.setZoom(m.getZoom()+1);
							c.zoomLevel = m.getZoom();
						}
					},{
						text: '-',
						minWidth: 30,
						handler: function(){
							var c = Ext.getCmp('my_map');
							var m = c.getMap();
							m.setZoom(m.getZoom()-1);
							c.zoomLevel = m.getZoom();
						}
					}]
                }
            });
            
        }
        
        mapwin.show();
        
    });
    
 });