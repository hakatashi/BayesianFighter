var app = require('http').createServer(handle), io = require('socket.io').listen(app), fs = require('fs');

app.listen(8080);

// ���ׂẴ��N�G�X�g��index.html��Ԃ�
function handle( request, response ) {
	fs.readFile( __dirname + '/index.html', function( err, data ) {
		if (err) {
			response.writeHead( 500, {
				'Content-Type': 'text/plain'
			});
			response.write('Error loading index.html');
			return response.end();
		}

		response.writeHead( 200, {
			'Content-Type': 'text/html'
		});
		response.write(data);
		response.end();
	});
}

// Socket�̃Z�b�g�A�b�v
io.sockets.on('connection', function(client){
	client.on('message', function(message) {
		console.log(message);
	});
});