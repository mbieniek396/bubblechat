///// IMPORTS /////
const wessa = require('ws');
const fs = require('fs');
///// Creating Server HTTP ////////////
// const server = http.createServer((req, res) => {
//  //res.end("I am connected");
//  /// Set header and others ////
//  res.setHeader('Content-Type', 'text/html');
// //  let path = "public/html/";
//  let filePath = path.join(__dirname, 'public', req.url);
//  console.log(filePath)
//  filePath+="html\\"

//  switch(req.url){
//     case '/':
//         filePath+='index.html';
//         res.statusCode = 200;
//         break;
//     case '/chat':
//         filePath+='client.html';
//         res.statusCode = 200;
//         break;
//     case '/heheheh': //Redirect
//         res.statusCode = 301;
//         res.setHeader('Location', "/")
//         res.end()
//         break;
//     default:
//         filePath+='404.html';
//         res.statusCode = 404;
//         break;
//  }

//  fs.readFile(filePath, (err, data) =>{
//     if (err){
//         console.log(err);
//     }else{
//         res.write(data);
//     }
//     res.end();
//  });
// });

////////// Listening on 8000 /////////////
console.log('Listening on http://localhost:8000 ...');

/////// HTTP requestes ////////
var express = require('express');
var cors = require('cors');
const multer = require('multer');
var app2 = express();
app2.use(cors())
app2.listen(8001);

app2.get('/can/:name/:create', (req, resp) =>{
    roomsList = Object.keys(rooms)
    if (roomsList.includes(req.params.name)){
        resp.write(JSON.stringify({error: "Już jest taka nazwa"}));
    }else{
        resp.write(JSON.stringify({server: req.params.name}))
    }
    resp.send()
});

var app = express();
app.use(express.static('public'));

app.get('/', (req, res) =>{
    // res.statusCode = 200;
    // fs.readFile("public/html/index.html", (err, data) =>{
    //     if (err){
    //         console.log(err);
    //     }else{
    //         res.write(data);
    //     }
    //     res.send();
    // });
    res.status(200).sendFile("public/html/index.html", {root:__dirname});
});

app.get('/chat', (req, res) =>{
    // res.statusCode = 200;
    // fs.readFile("public/html/client.html", (err, data) =>{
    //     if (err){
    //         console.log(err);
    //     }else{
    //         res.write(data);
    //     }
    //     res.send();
    // });
    res.sendFile("public/html/client.html", {root:__dirname});
});

app.get('/redirectMe', (req, res) =>{
    res.redirect('/');
});



const storage = multer.diskStorage({
    destination: function(req, file, callback){
        callback(null, __dirname+ "/public/img")
    },
    filename: function(req, file, callback){
        callback(null, file.originalname);
    } 
});
const uploads = multer({storage: storage});

app.post('/image', uploads.array("files"), (req, res) =>{
    res.status(200).send(JSON.stringify({git:"git"}))
});


/////////////////////////////////////////////////////////////////
////////////////// END OF app Use with defualt /////////////////
///////////////////////////////////////////////////////////////

app.use((req, res) =>{
    res.status(404).sendFile("public/html/404.html", {root:__dirname});
});

//creating wessa server
const wss = new wessa.Server({ server: app.listen(8000) });

///// Rooms /////
var rooms = {};
var nicknames = {};

//////////////// EVENTS /////////////////
//Event: 'headers'
wss.on('headers', (headers, req) => {
    //logging the header
    console.log('WebSocket.on headers:\n');
    console.log(headers);
   });
//Event: 'connection'
wss.on('connection', (ws, req) => {
    //receive the message from client on Event: 'message'
    ws.on('message', (msg) => {
        console.log('Received message from client:');
        message = JSON.parse(msg)
        console.log(message)
        if (message.serverAdd){
            if (message.serverAdd === undefined){
                req.redirect("http://localhost:8000/")
            }
            nicknames[ws] = message.nickname
            if (!rooms[message.serverAdd]){
                rooms[message.serverAdd] = [];
            }
            rooms[message.serverAdd].forEach( (client) => {
                client.send(JSON.stringify({nickname: message.nickname, join: "join"}))
            });
            rooms[message.serverAdd].push(ws);
        }else if (message.typing){ //// TYPING ///
            rooms[message.server].forEach( (client) =>{
                if (client !== ws) {
                    client.send(JSON.stringify({typing: message.nickname}))
                }
            });
        }else if (message.Nottyping){
            rooms[message.server].forEach( (client) =>{
                if (client !== ws) {
                    client.send(JSON.stringify({nottyping: message.nickname}))
                }
            });
        }else{
            rooms[message.server].forEach( (client) => {
                console.log("sending")
                client.send(JSON.stringify(message));
            }); 
            // wss.clients.forEach( (client) => {
                //     if (client !== ws){
                //         client.send("Ktoś dołączył do chatu!");
                //     }
                // });
        }
    });

    ws.onclose = (event) => {
        var server;
        // for (var [key, value] of Object.entries(rooms)) {
        //     for (var i = value.length - 1; i >= 0; i--) {
        //         if (value[i] === ws) {
        //             rooms[key] = value.splice(i, 1);
        //             server = key
        //         }
        //     }
        //     console.log(value.length);
        //     if (value.length === 0){
        //         console.log("deleted");
        //         delete rooms[key];
        //         console.log(rooms);
        //     }
        // }

        for (const key in rooms) {
            // check if the array includes the value
            if (rooms[key].includes(ws)) {
              // remove the value from the array
              server = key
              const index = rooms[key].indexOf(ws);
              rooms[key].splice(index, 1);
            }
        }
        if (rooms[server].length == 0){
            delete rooms[server]
        }
        else {
            rooms[server].forEach( (client) => {
                client.send(JSON.stringify({nickname: nicknames[ws], leave: "leave"}))
            });
        }
        delete nicknames[ws];

    };

}); 
   
