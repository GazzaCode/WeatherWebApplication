'use strict';

const studentsBody = document.querySelector("#dataTable > tbody");
var findStudentBtn = document.getElementById('submitData');
var form = document.getElementById('main');

// Formatting function for row details 
function format(d) {
  // 'd' is the original data object for the row

  var str = '<table cellpadding="5" width="100%" cellspacing="0" border="0" style="padding-left:50px;">' +
    '<th>date:</th>' +
    '<th>time:</th>' +
    '<th>ws:</th>' +
    '<th>sr:</th>';

  for (var i = 0; i < d.data.length; i++) {
    str = str + '<tr>' + '<td>' + JSON.stringify(d.data[i].date) + '</td>' +
      '<td>' + JSON.stringify(d.data[i].time) + '</td>' +
      '<td>' + JSON.stringify(d.data[i].ws) + '</td>' +
      '<td>' + JSON.stringify(d.data[i].sr) + '</td>' + '</tr>';
  }

  str = str + '</tr>' +
    '</table>';

  return str;
}

$(document).ready(function () {
  var table = $('#example').DataTable({
    "ajax": {
      "url": "/getAverageJSON",
    },
    "columns": [
      {
        "className": 'details-control',
        "orderable": false,
        "data": null,
        "defaultContent": ''
      },
      { "data": "date" },
      { "data": "sr" },
      { "data": "ws" }
    ]

  });

  //code for drop down option to see all data of a month
  // Add event listener for opening and closing details
  $('#example tbody').on('click', 'td.details-control', function () {
    var tr = $(this).closest('tr');
    var row = table.row(tr);

    if (row.child.isShown()) {
      // This row is already open - close it
      row.child.hide();
      tr.removeClass('shown');
    }
    else {
      // Open this row
      row.child(format(row.data())).show();
      tr.addClass('shown');
    }
  });

  //Form submit
  $('#contact').on('submit', function (e) {
    e.preventDefault();

    //The post request for when the form is submitted
    $.post("/reqData", $("#contact").serializeArray(), function (data, status) {
      $('#example').DataTable().ajax.reload();

      //Check if the show graph option is selected
      if ($('#disGraph').is(':checked')) {
        //CanvasJS requires a specific format of JSON for graphs, the following function
        //will make neccasary changes to suite canvasJS
        var graphData = parseGraphData(data);

        //code for dealing with graphs
        $(function () {
          $("#chartContainer").CanvasJSChart({ //Pass chart options
            animationEnabled: true,
            axisX: {
              title: "Months",
              titleFontSize: 18
            },
            axisY: [
              {
                title: "Wind Speed (km/h)",
                includeZero: false,
                titleFontSize: 18
              }],
              //secondary axis
            axisY2: [
              {
                opposite: true,
                
                title: "Solar Radiation(kWh)",
                includeZero: false,
                showInLegend: true,
                titleFontSize: 18,
                opposite: true
              }],
            data: [
              {
                name: "Wind speed(km/h)",
                showInLegend: true,
                type: "line", //change it to column, spline, line, pie, etc
                dataPoints: graphData[1]
              },
              {
                name: "Solar Radiation(kWh)",
                axisYIndex: 1,
                type: "line", //change it to column, spline, line, pie, etc
                showInLegend: true,
                axisYType: "secondary",
                dataPoints: graphData[0]
              }
            ]
          })

        });
      }
    });
  });
});


function parseGraphData(data) {
  var dataPoints = [];
  var dataPoints2 = [];
  var returnVals = [];
  data = data.substring(8, data.length - 1);
  console.log(data);
  data = JSON.parse(data);


  switch ($('#dataType option:selected').text()) {
    case 'Solar Radiation':
      for (var i = 0; i < data.length; i++) {
        //console.log(data[i].sr);
        dataPoints.push({
          x: i,
          y: data[i].sr
        });
        dataPoints2.push({
          x: i,
          y: 0
        });
        console.log(dataPoints);
      }
      returnVals.push(dataPoints);
      returnVals.push(dataPoints2);
      return returnVals;
    case 'Wind Speed':
      for (var i = 0; i < data.length; i++) {
        //console.log(data[i].sr);
        dataPoints.push({
          x: i,
          y: 0
        });
        dataPoints2.push({
          x: i,
          y: data[i].ws
        });
      }
      returnVals.push(dataPoints);
      returnVals.push(dataPoints2);
      return returnVals;
    case 'Both':
      for (var i = 0; i < data.length; i++) {
        //console.log(data[i].sr);
        dataPoints.push({
          x: i,
          y: data[i].sr
        });
        dataPoints2.push({
          x: i,
          y: data[i].ws
        });
      }

      returnVals.push(dataPoints);
      returnVals.push(dataPoints2);
      console.log(returnVals);
      return returnVals;
  }


}

//BACK TO TOP BUTTON CODE
//Get the button
var mybutton = document.getElementById("myBtn");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () { scrollFunction() };

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}