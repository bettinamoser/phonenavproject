/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var projects = {};

var app = {

    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
      //  app.receivedEvent('deviceready');

      $('#loginScreen').show();
      $('#projectScreen').hide();

//projektnamen abrufen
/* GET?getProjects
data: none
return content: {"projects":[{"name":'',"code":''}, .... ]}
*/
      $.ajax({
        //url:'http://localhost:20001/getProjects',
        url:'http://54.209.31.24:20001/getProjects',
        type:'GET',
        success: function(data){

          data='{"projects":[{"name":"mein erstes projekt","code":"1234"}, {"name":"superprojekt","code":"4444"}]}'; //nur zum testen!!!
          console.log(data);
         projects = JSON.parse(data);

          console.log(projects.projects);
          //projekte auflisten und als option hinzufügen
          for(var i=0 in projects.projects){
            console.log('projektname ',projects.projects[i].name);
            $('<option>'+projects.projects[i].name+'</option>').appendTo('#projects');
          }



        },
        error: function(err){
          console.log('error while getting project names :'+err);
        }

      }); //ajax

      $('#login').on('click', function(e){
        //login prüfen bzw. projektdaten laden
        e.preventDefault();
        console.log('geklickt');
        var selectedProject = $('#projects :selected').html();
        var code = $('#code').val();
        console.log('selected project: '+selectedProject+', code: '+code);

        /*
        GET?getProject
          data: {"name":'',"code":''}
          return content: {"markers":[{"name":'',"lat":number,"lng":number}, .... ]}
        */


        $.ajax({
          url:'http://54.209.31.24:20001/getProject',
          type:'POST',
          data: {"name":selectedProject, "code":code},
          success: function(data){
/*
                    data='{"markers":[{"name":"zuhause","lat":"48.2","lng":"16.3"},{"name":"arbeit","lat":"48.524","lng":"17.46"}]}'; //nur für test!!!!
                    console.log(data);
                    var markers = JSON.parse(data);
                    //war code korrekt?
                    //code nicht korrekt --> fehlermeldung

                    //code korrekt --> marker auslesen und zur auswahlliste hinzufügen
                    for(var m in markers.markers){
                      console.log('marker: ',markers.markers[m]);
                        $('<option data-lat="'+markers.markers[m].lat+'" data-lng="'+markers.markers[m].lng+'">'+markers.markers[m].name+'</option>').appendTo('#marker');

                    }


                    //entfernung prüfen
                    app.checkPosition($('#marker :selected').attr('data-lat'), $('#marker :selected').attr('data-lng'), $('#distance').val() );


                    //projectScreen anzeigen

                    $('#loginScreen').hide();
                    $('#projectScreen').show();
*/

          },
          error: function(err){
            console.log('error while getting markers for project: '+err);
          }

        }); //ajax

        data='{"markers":[{"name":"zuhause","lat":"48.2","lng":"16.3"},{"name":"arbeit","lat":"48.524","lng":"17.46"}]}'; //nur für test!!!!
        console.log(data);
        var markers = JSON.parse(data);
        //war code korrekt?
        //code nicht korrekt --> fehlermeldung

        //code korrekt --> marker auslesen und zur auswahlliste hinzufügen
        for(var m in markers.markers){
          console.log('marker: ',markers.markers[m]);
            $('<option data-lat="'+markers.markers[m].lat+'" data-lng="'+markers.markers[m].lng+'">'+markers.markers[m].name+'</option>').appendTo('#marker');

        }


        //entfernung prüfen
        app.checkPosition($('#marker :selected').attr('data-lat'), $('#marker :selected').attr('data-lng'), $('#distance').val() );


        //projectScreen anzeigen

        $('#loginScreen').hide();
        $('#projectScreen').show();





      }); //click

      $(document).on('change', '#marker', function(){
          console.log('marker changed...');

      app.checkPosition();


      }); //change marker

        $(document).on('change', '#distance', function(){
          console.log('distance changed...');

          //  app.checkPosition($('#marker :selected').attr('data-lat'), $('#marker :selected').attr('data-lng'), $('#distance').val() );
          app.checkPosition();

        });

    },
    // Update DOM on a Received Event
    /*
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },
    */
    checkPosition: function(){

      navigator.geolocation.getCurrentPosition(function(position){
        var longitude = position.coords.longitude;
        var latitude = position.coords.latitude;

        var lat_marker =$('#marker :selected').attr('data-lat');
        var lng_marker = $('#marker :selected').attr('data-lng');

        console.log("lat of marker: ", lat_marker);
        console.log("lng of marker: ", lng_marker);

        console.log('aktuell latitude: ',latitude);
        console.log('aktuell longitude: ',longitude);
        var dist = PythagorasEquirectangular( lat_marker, lng_marker, latitude, longitude);

        if(dist <=  $('#distance').val() ) $('#rightPosition').css({backgroundColor: "green"});
        else $('#rightPosition').css({backgroundColor: "red"});

      }, app.onError);



  },
  onError: function(err){
    console.log('error while getting coords: '+err.message);
  }



};


function Deg2Rad( deg ) {
	return deg * Math.PI / 180;
}

function PythagorasEquirectangular( lat1, lon1, lat2, lon2 ) {
	lat1 = Deg2Rad(lat1);
	lat2 = Deg2Rad(lat2);
	lon1 = Deg2Rad(lon1);
	lon2 = Deg2Rad(lon2);
	var R = 6371; // km
	var x = (lon2-lon1) * Math.cos((lat1+lat2)/2);
	var y = (lat2-lat1);
	var d = Math.sqrt(x*x + y*y) * R;
	return d;
}






//});
