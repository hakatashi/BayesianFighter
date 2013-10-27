var app = require('http').createServer(handler), io = require('socket.io').listen(app), fs = require('fs');

var fps = 30;
var fieldState;
var beyList = new Array();
var maxBeys = 10;
var fieldSize = 500;

//�x�C�I�u�W�F�N�g
var BeyObject = function (point, size, session) {
    this.point = point;
    this.size = size;
    this.session = session;
}

//�x�C���o��������
function createBey(session, size) {
    var emergePoint = false;
    if (beyList.length >= maxBeys) {
        return false;
    }
    //�������đ��̃x�C�ƂԂ���Ȃ��ʒu�Ȃ瑱�s
    //n�񎎍s���ă_���Ȃ���߂�
    for (i = 0; i < 100; i++) {
        var radius = Math.random() * fieldSize * 0.5;
        var theta = Math.random() * Math.PI * 2;
        var pointByRect = [radius * Math.sin(theta), radius * Math.cos(theta)];
        var emergeFlag = true;
        for (j = 0; j < beyList.length; j++) {
            if (distanceBetween(beyList[j].point, pointByRect) < beyList[j].size + size) {
                emergeFlag = false;
                break;
            }
        }
        if (emergeFlag) {
            emergePoint = pointByRect;
            break;
        }
    }
    if (emergePoint == false) {
        return false;
    }
    var bey = new BeyObject(emergePoint, size, session);
    beyList.push(bey);
    return true;
}

function distanceBetween(p1, p2) {
    return Math.sqrt((p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]));
}

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
}

app.listen(8080);

//�K�v�ȃt�@�C�����
function handler (req, res) {
    var urlinfo = require('url').parse(req.url, true);
    if (urlinfo.pathname === "/") writeFromFile(req, res, "/index.html");
    else if (urlinfo.pathname === "/js/client.js") writeFromFile(req, res, "/js/client.js");
    else if (urlinfo.pathname === "/monitor") writeFromFile(req, res, "/monitor.html");
    else if (urlinfo.pathname === "/js/monitor.js") writeFromFile(req, res, "/js/monitor.js");
}

//�ڑ�������

//�Z���_�[
io.of('/send').on('connection', function (socket) {
    console.log('sender: ' + socket.id + ': connected');
    //�ėp���b�Z�[�W
    socket.on('info', function (message) {
        console.log('sender: ' + socket.id + ': ' + JSON.stringify(message));
    });
    //�o�����N�G�X�g
    socket.on('emerge', function (message) {
        console.log('sender: ' + socket.id + ': emerge request: ' + JSON.stringify(message));
        if (createBey(socket.id, 30)) {
            console.log('sender: ' + socket.id + ': emerge request accepted: ' + JSON.stringify(message));
            socket.emit('responce', true);
        } else {
            console.log('sender: ' + socket.id + ': emerge request denied: ' + JSON.stringify(message));
            socket.emit('responce', false);
        }
    });
    //�ؒf
    socket.on('disconnect', function () {
        console.log('sender: ' + socket.id + ': disconnected');
    });
});

//���j�^�[
io.of('/monitor').on('connection', function (socket) {
    console.log('monitor: ' + socket.id + ': connected');
    //�ėp���b�Z�[�W
    socket.on('info', function (message) {
        console.log('monitor: ' + socket.id + ': ' + JSON.stringify(message));
    });
    //�ؒf
    socket.on('disconnect', function () {
        console.log('monitor: ' + socket.id + ': disconnected');
    });
});

//���C�����[�v
var roop = function () {
    setInterval(function () {
        updateBeys();
        sendToMonitor();
    }, 1000.0 / fps);
};

//�x�C�̈ʒu�X�V
var updateBeys = function () {

};

//���j�^�ɑ��M
var sendToMonitor = function () {
    io.of('/monitor').emit('StageInfo', beyList);
    console.log('sent to monitor: ' + JSON.stringify(beyList));
};

//�N��
roop();