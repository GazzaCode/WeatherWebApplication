"use strict";
var fs = require("fs");
var formidable = require('formidable');
var http = require('http');
var convert = require('xml2json');

//This is the function that deal with the post request from the form, this is where the server
//begins the process of processing the requested data and returns it.
async function reqData(request, response) {
    console.log("Request handler 'reqData' was called.");
    var form = new formidable.IncomingForm();

    //Parse incoming formidable form for the degree field
    form.parse(request, async (err, fields, files) => {
        if (err) {
            console.error('Error', err);
            throw err;
        }
        console.log('Fields', fields);//Log the feilds for testing

        if(JSON.stringify(fields) === '{}')  {
            console.log("No data recieved" + fields);
            //response.writeHead(204);
            clearJSON();
            fs.createReadStream('./json/monthlyAverages.json').pipe(response);
        }
        else {

            //store the values into an array for processing
            var vals = { startDate: fields.startDate, endDate: fields.endDate, dataType: fields.dataType };

            //search xml/JSON files with obtained data
            var monthlyAverages = await returnData(vals);

            if (monthlyAverages == null) {
                response.writeHead(404);
            } else {
                //save monthlyAverages JSON to client to display
                console.log("Saving JSON");
                setTimeout(function () {
                    fs.writeFileSync('./json/monthlyAverages.json', JSON.stringify(monthlyAverages))
                }, 0);


                response.writeHead(200, { "Content-Type": "text/JSON" });
                fs.createReadStream('./json/monthlyAverages.json').pipe(response);
            }
        }
    });
}

async function getWeatherData(year) {
    //create connection with http://it.murdoch.edu.au/~S900432D/ict375/data/ + year + ".format"
    var urlJSON = "http://it.murdoch.edu.au/~S900432D/ict375/data/" + year + ".json";
    var urlXML = "http://it.murdoch.edu.au/~S900432D/ict375/data/" + year + ".xml";

    return new Promise(function(resolve, reject) {
    http.get(urlJSON).on('response', function (response) {

        if (response.statusCode === 200) {
            var body = '';
            var i = 0;
            response.on('data', function (chunk) {
                i++;
                body += chunk;
            });
            response.on('end', function () {
                console.log("Found file");
                resolve(JSON.parse(body));
            });
        }
        else {
            console.log("Could no find file at : " + urlJSON + "\n ...Trying XML");
            http.get(urlXML).on('response', function (response) {

                if (response.statusCode === 200) {
                    var body = '';
                    var i = 0;
                    response.on('data', function (chunk) {
                        i++;
                        body += chunk;
                    });
                    response.on('end', function () {
                        
                        console.log("\n     ...The file format is XML");

                        //Parse XML to JSON and return it
                        console.log("\n         ...Converting XML to JSON");
                        var toJSON = convert.toJson(body);
                        resolve(JSON.parse(toJSON));
                    });
                }
                else {
                    console.log("Could not find file: " + urlXML + "No file found");
                    resolve('');
                }
            });
        
        }
    });
        
    });
}

function getWeatherDataLocally() {
     //THIS WILL GET DATA LOCALLY AS BACKUP
    //determine the format of file on server XML or JSON
    var isXML = true;
    var isJSON = true;
    var rawData;
    //NOTE: the project needs to be able to access the website with the data
    //Try load the file as .json or as .xml to determine which file type it is
    try {
        //search file
        let rawdata1 = fs.readFileSync("http://it.murdoch.edu.au/~S900432D/ict375/data/" + year + ".json");
        let json = JSON.parse(rawdata1);
        rawData = rawdata1;
    } catch(err) {
        isJSON = false;
        console.log("File is not JSON" + err);
    }

    try {
        //search file
        let rawdata2 = fs.readFileSync("http://it.murdoch.edu.au/~S900432D/ict375/data/" + year + ".xml");
        rawData = rawdata2;
        //parse XML into JSON
    } catch(err) {
        isXML = false;
        console.log("File is not XML" + err);
    }

    //Final check to see what format the file or if it exists, then routed to processJSON
    if(isXML) {
    
        //processJSON(rawData, vals.dataType);
    } else if(isJSON) {
        //processJSON(rawData, vals.dataType);
        console.log(JSON.stringify(rawData));
    } else {
        //The file doesen't exist
        console.log("Could not find file: " + year);
    }
}

//Function to seperate weather data into monthly arrays
//Returns monthlyData[[]]
function seperateToMonths(json, months) {
    var count = 0;
    var tempMonth = []; //Used to temporaraly store a month of data
    var monthlyData = []; //Where the months of data will be held
    //Loop through each record
    json.weather.record.forEach(function(record) {
        //Check if it is the last record, if it is store the last month and skip the rest of processing
        if(count === json.weather.record.length-1)
        {
            //Stop an empty record being entered
            if((parseInt(json.weather.record[count].date.substring(json.weather.record[count].date.length-7, 
                json.weather.record[count].date.length - 5)) == months[months.length-1])) {
                    monthlyData.push(tempMonth);
                    tempMonth = [];
                    console.log("reached end of data: " + json.weather.record.length);
                } 
                
        } else {
            //Keep record of current month
            var currentMonth = parseInt(record.date.substring(record.date.length-7, record.date.length - 5));
            count++; //This keep track of which record the loop is up to.
            //If the current month is part of the selected months
            if(months.includes(currentMonth)) {
                //Keep record of previous month to see when a month of data ends
                var previousMonth = parseInt(json.weather.record[count].date.substring(json.weather.record[count].date.length-7, 
                    json.weather.record[count].date.length - 5));
                
                //If the current month and previousMonth do not match, this means it is the start of a new month
                if(currentMonth != previousMonth) {
                    monthlyData.push(tempMonth);
                    tempMonth = [];
                // tempMonth.push(record);
                console.log("Creating new object to inset into monthlyData");
                } else {
                    tempMonth.push(record);
                }
            }
        }
    });
    return monthlyData;
}

//Function used to determine weather solar, wind or both options were selected by the user,
//then routes the program to the respective funtion. (calculateWindMonthlyAverages, calculateSolarMonthlyAverages,
//calculateSolarMonthlyAverages).
function selectDataType(monthlyData, sMonth, dataType) {
    var monthlyAverages = [];

    switch(dataType) {
        case 'both': monthlyAverages = calculateBothMonthlyAverages(monthlyData, sMonth);
        break;
        case 'solar' : monthlyAverages = calculateSolarMonthlyAverages(monthlyData, sMonth);
        break;
        case 'wind' : monthlyAverages = calculateWindMonthlyAverages(monthlyData, sMonth);
        break;
        default:
        return null;
    }
    return monthlyAverages;
}

//Calculate monthly averages for wind speed
//returns JSON data in the format the client will expect with the selected data
function calculateWindMonthlyAverages(monthlyData, sMonth) {
    var monthlyAverages = {};
    var wsAverage = 0;
    var count = 0;
    var temp = [];
    var month = parseInt(sMonth);
    
    monthlyData.forEach(function(entry) {
        var rawData = [];
        entry.forEach(function(data) {
            //calculate average on each month
            //Wind speed
            var ms = data.ws;
            var kmh = ((ms*60*60)/1000);
            wsAverage = wsAverage + kmh;
            count++;

            rawData.push(data);
        });
        
        wsAverage = wsAverage / count;
        //store averages into an object
        
        temp.push({date: month, sr: 0, ws:wsAverage, data:rawData});
        //monthlyAverages.push(temp);
        month++;
        count = 0;
    });
    monthlyAverages['data'] = temp;
    return monthlyAverages;
}

//Calculate monthly averages for solar radiation
//returns JSON data in the format the client will expect with the selected data
function calculateSolarMonthlyAverages(monthlyData, sMonth) {
    var monthlyAverages = {};
    var srAverage = 0; 
    var count = 0;
    var temp = [];
    var month = parseInt(sMonth);
    
    monthlyData.forEach(function(entry) {
        var rawData = [];
        entry.forEach(function(data) {
            //calculate average on each month
            //Solar radiation
            if(data.sr >= 100) {
                var Wh = data.sr * (1/6);
                var kWh = Wh/1000;
                srAverage = srAverage + kWh;
                count++;
            }

            rawData.push(data);
        });
      
        srAverage = srAverage / count;

        //store averages into an object
        temp.push({date:month, sr:srAverage, ws:0, data:rawData});

        month++;
        count = 0;
    });
    monthlyAverages['data'] = temp;
    return monthlyAverages;
}

//Calculate monthly averages for both wind speed and solar radiation
//returns JSON data in the format the client will expect with the selected data
function calculateBothMonthlyAverages(monthlyData, sMonth) {
    var monthlyAverages = {};
    var srAverage = 0; 
    var wsAverage = 0;
    var count = 0;
    var temp = [];
    var month = parseInt(sMonth);
    
    monthlyData.forEach(function(entry) {
        var rawData = [];
        entry.forEach(function(data) {
            //calculate average on each month
            //Solar radiation
            if(data.sr >= 100) {
                var Wh = data.sr * (1/6);
                var kWh = Wh/1000;
                srAverage = srAverage + kWh;
            }
            //Wind speed
            var ms = data.ws;
            var kmh = ((ms*60*60)/1000);
            wsAverage = wsAverage + kmh;
            count++;

            rawData.push(data);
            
        });
        
        srAverage = srAverage / count;
        wsAverage = wsAverage / count;
        //store averages into an object
        
        temp.push({date: month, sr:srAverage, ws:wsAverage, data:rawData});
        //monthlyAverages.push(temp);
        month++;
        count = 0;
    });
    monthlyAverages['data'] = temp;
    return monthlyAverages;
}

//Return data to client using the submitted data vals (startDate, endDate, dataType)
//This is the main function for processing the data(uses child functions to return needed data to reqData) 
async function returnData(vals) {

    var sDate = vals.startDate;
    var eDate = vals.endDate;
    var sMonth = sDate.substring(sDate.length, sDate.length - 2);
    var eMonth = eDate.substring(eDate.length, eDate.length - 2);
    var year = sDate.substring(0, sDate.length - 3);
    var endYear = eDate.substring(0, eDate.length - 3);

    //Check if the user selected the same year
    if(parseInt(year) != parseInt(endYear)){
        console.log("start and end date must be the same year");
        return null;
    } else {
        //get the weather data from website
        try {
            var json = await getWeatherData(year);
        } catch(e) {
            console.log(e);
        }
        
        //getWeatherData() returns '' if there is no file found. In this case return null
        if(json == '') {
            console.log("could not find yearly data");
            return null;
        } else {
    
            //Create an array with the months the user selected
            var months = [];
            for(var i = parseInt(sMonth); i <= parseInt(eMonth); i++) {
                months.push(parseInt(i));
            }
            
            //Seperate the weather data into months
            var monthlyData = seperateToMonths(json, months);
            
            //Used a promis here as selectDataType() routes the data for processing (find averages etc) which could take time.
            //This block of code should no proceed until selectDataType() is complete. 
            return new Promise(function(resolve, reject) {
                var monthlyAverages = selectDataType(monthlyData, sMonth, vals.dataType);
        
                resolve(monthlyAverages);
            });
    
        }
    }
}

//Called by the client to recieve the current data in monthlyAverages.json. This JSON is where the users
//selected data is stored after processing.
async function getAverageJSON (request, response) {
    var form = new formidable.IncomingForm();
    
    //Parse incoming formidable form for the degree field
    form.parse(request, async(err, fields, files) => {
       if (err) {
        console.error('Error', err);
       throw err;
       }
       console.log('Fields', fields); //Useful to see what fields the client sent
       //Check if empty fields

       if(JSON.stringify(fields) === '{}') {
        console.log("No data recieved" + JSON.stringify(fields));
        //clearJSON(); //if so, clear the json to {data:[{date: 0, sr: 0, ws: 0}]}
        fs.createReadStream('./json/monthlyAverages.json').pipe(response);
    }
    else {
        fs.createReadStream('./json/monthlyAverages.json').pipe(response);
    }
    });
}

//Clears the JSON file to {data:[{date: 0, sr: 0, ws: 0}]}, this is the format the client is expecting.
function clearJSON() {
    fs.writeFileSync('./json/monthlyAverages.json', JSON.stringify({data:[{date: 0, sr: 0, ws: 0}]}));
}

//Function to deal with the request for the index page.
function reqStart(request, response) {

    console.log("Request handler 'start' was called.");
    fs.readFile('./html/index.html', function (err, html) {
        if (err) {
            throw err; 
    }
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(html);
    response.end();
    });
}
//Function to deal with the request for CSS
function reqCSS(request, response) {
    console.log("Request handler 'css' was called.");
   
    response.writeHead(200, {"Content-Type": "text/css"});
    fs.createReadStream("./css/style.css").pipe(response);
}

//Function to deal with the request for index.html javascript
function reqIndexJS(request, response) {
    console.log("Request handler 'reqIndexJS' was called.");
   
    response.writeHead(200, {"Content-Type": "text/javascript"});
    fs.createReadStream("./js/indexPage.js").pipe(response);
}

//Routes
exports.reqData = reqData;
exports.reqIndexJS = reqIndexJS;
exports.reqStart = reqStart;
exports.reqCSS = reqCSS;
exports.reqAvgJSON = getAverageJSON;