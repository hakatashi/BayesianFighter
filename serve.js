var app = require('http').createServer(handler), io = require('socket.io').listen(app), fs = require('fs');

//�t�@�C������ǂݍ���Ń��X�|���X
var writeFromFile = function (req, res, locate) {
    fs.readFile(__dirname + locate, function (err, data) {
        if (err) {
            res.writeHead(500, {
                'Content-Type': 'text/plain'
            });
            res.write('Error loading ' + locate);
            res.end();
            console.log("not found " + locate);
            return;
        }

        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8'
        });
        res.write(data);
        res.end();
        console.log("served " + locate);
    });
};

app.listen(8080);

//�K�v�ȃt�@�C�����

function handler(req, res) {
    var urlinfo = require('url').parse(req.url, true);
    if (urlinfo.pathname === "/") writeFromFile(req, res, "/index.html");
    else if (urlinfo.pathname === "/js/client.js") writeFromFile(req, res, "/js/client.js");
}

io.sockets.on('connection', function(client){
	client.on('message', function(message) {
	    console.log(JSON.stringify(message));
	});
});