var app = require('http').createServer(handler), io = require('socket.io').listen(app), fs = require('fs');

var renderFPS = 60;
var worldFPS = 180;
var fieldState;
var beyList = new Array();
var maxBeys = 10;
var fieldSize = 500;
var speed = 3;
var repulse = 100;
var friction = 1;
var restCoeff = 1; //�����W��

//�x�C�I�u�W�F�N�g
var BeyObject = function (point, size, session) {
    this.point = point;
    this.size = size;
    this.session = session;
    this.accel = [0, 0];
    this.sensor = { 'x': 0, 'y': 0, 'z': 0 };
    this.weight = 100;
}

function sessionExistsInBeyList(session) {
    for (i = 0; i < beyList.length; i++) {
        if (session == beyList[i].session) {
            return true;
        }
    }
    return false;
}

//�x�C���o��������
function createBey(session, size) {
    var emergePoint = false;
    if (beyList.length >= maxBeys || sessionExistsInBeyList(session)) {
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

//�x�C����������
function removeBey(session) {
    for (i = 0; i < beyList.length; i++) {
        if (session == beyList[i].session) {
            beyList.splice(i, 1);
            return true;
        }
    }
    return false;
}

//�Z���T���̍X�V
function updateSensorInfo(session, sensor) {
    for (i = 0; i < beyList.length; i++) {
        if (session == beyList[i].session) {
            beyList[i].sensor = sensor;
            return true;
        }
    }
    return false;
}

function distanceBetween(p1, p2) {
    return Math.sqrt((p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]));
}

function vectorAddition(v1, v2, weight) {
    return [v1[0] + v2[0] * weight, v1[1] + v2[1] * weight];
}

function polarToRect(r, theta) {
    return [r * Math.sin(theta), r * Math.cos(theta)];
}

function rectToPolar(point) {
    return { "r": distanceBetween(point, [0, 0]), "theta": (point[1] == 0) ? 0 : ((point[1] > 0) ? Math.atan(point[0] / point[1]) : (Math.atan(point[0] / point[1]) + Math.PI)) };
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
    //�������N�G�X�g
    socket.on('exit', function (message) {
        console.log('sender: ' + socket.id + ': exit request: ' + JSON.stringify(message));
        if (removeBey(socket.id)) {
            console.log('sender: ' + socket.id + ': exit request accepted: ' + JSON.stringify(message));
            socket.emit('responce', true);
        } else {
            console.log('sender: ' + socket.id + ': exit request denied: ' + JSON.stringify(message));
            socket.emit('responce', false);
        }
    });
    //�Z���T���̍X�V
    socket.on('sensor', function (sensor) {
        //console.log('sender: ' + socket.id + ': recieved sensor info: ' + JSON.stringify(sensor));
        updateSensorInfo(socket.id, JSON.parse(sensor));
    })
    //�ؒf
    socket.on('disconnect', function () {
        console.log('sender: ' + socket.id + ': disconnected');
        removeBey(socket.id);
    });
});

//���j�^�[
io.of('/monitor').on('connection', function (socket) {
    console.log('monitor: ' + socket.id + ': connected');
    //�ėp���b�Z�[�W
    socket.on('info', function (message) {
        //console.log('monitor: ' + socket.id + ': ' + JSON.stringify(message));
    });
    //�ؒf
    socket.on('disconnect', function () {
        console.log('monitor: ' + socket.id + ': disconnected');
    });
});

//���M���[�v
var renderRoop = function () {
    setInterval(function () {
        sendToMonitor();
    }, 1000.0 / renderFPS);
};

//�x�C�X�V���[�v
var worldRoop = function () {
    setInterval(function () {
        updateBeys();
    }, 1000.0 / worldFPS);
};


//�x�C�̈ʒu�X�V
var updateBeys = function () {
    beyList.forEach(function (bey) {
        var accelPolar = rectToPolar(bey.accel);
        //���C�ɂ�錸��
        if (accelPolar.r >= friction) bey.accel = polarToRect(accelPolar.r - friction, accelPolar.theta);
        else bey.accel = [0, 0];
        //�Z���T�[�l�𔽉f���ĉ���
        bey.accel[0] += -bey.sensor.x * speed;
        bey.accel[1] += bey.sensor.y * speed;
        bey.point[0] += bey.accel[0] / worldFPS;
        bey.point[1] += bey.accel[1] / worldFPS;

        //�Փˏ���
        beyList.forEach(function (objBey) {
            if (bey.session > objBey.session) {
                if (distanceBetween(bey.point, objBey.point) < bey.size + objBey.size) {
                    // bey���猩��objBey�̈ʒu
                    var objDirection = rectToPolar([objBey.point[0] - bey.point[0], objBey.point[1] - bey.point[1]]);
                    //���x��@�������ƕ��s�����ɕ���
                    var resolvedBeyAcc = polarToRect(rectToPolar(bey.accel).r, rectToPolar(bey.accel).theta - objDirection.theta);
                    var resolvedObjAcc = polarToRect(rectToPolar(objBey.accel).r, rectToPolar(objBey.accel).theta - objDirection.theta);
                    //������
                    var repulsePower = polarToRect(repulse, objDirection.theta);

                    //objBey�������̂��ďd����Ԃ�����
                    objBey.point = [bey.point[0] + (objBey.point[0] - bey.point[0]) / objDirection.r * (bey.size + objBey.size) * 1.02,
                        bey.point[1] + (objBey.point[1] - bey.point[1]) / objDirection.r * (bey.size + objBey.size) * 1.02];

                    /*
                    �Փˌ�̑��x���ȉ��̐����ŉ��Z�B
                    \[\begin{cases}m_{1}v_{1}'+m_{2}v_{2}'=m_{1}v_{1}+m_{2}v_{2}\\\left(v_{1}'-v_{2}'\right)=-e\left(v_{1}-v_{2}\right)\end{cases}\]
                    \[\begin{cases}v_{1}'=v_{1}-\left(v_{1}-v_{2}\right)\left(1+e\right)\frac{m_{2}}{m_{1}+m_{2}}\\v_{2}'=v_{2}+\left(v_{1}-v_{2}\right)\left(1+e\right)\frac{m_{1}}{m_{1}+m_{2}}\end{cases}\]
                    */

                    var newResolvedBeyAccY = resolvedBeyAcc[1] - (resolvedBeyAcc[1] - resolvedObjAcc[1]) * (1 + restCoeff) * (objBey.weight / (bey.weight + objBey.weight));
                    var newResolvedObjAccY = resolvedObjAcc[1] + (resolvedBeyAcc[1] - resolvedObjAcc[1]) * (1 + restCoeff) * (bey.weight / (bey.weight + objBey.weight));

                    resolvedBeyAcc[1] = newResolvedBeyAccY;
                    resolvedObjAcc[1] = newResolvedObjAccY;

                    bey.accel = polarToRect(rectToPolar(resolvedBeyAcc).r, rectToPolar(resolvedBeyAcc).theta + objDirection.theta);
                    objBey.accel = polarToRect(rectToPolar(resolvedObjAcc).r, rectToPolar(resolvedObjAcc).theta + objDirection.theta);
                }
            }
        })
        if (distanceBetween(bey.point, [0, 0]) > fieldSize - bey.size) {
            bey.point = polarToRect((fieldSize - bey.size) * 2 - distanceBetween(bey.point, [0, 0]), rectToPolar(bey.point).theta);
            bey.accel = polarToRect(distanceBetween(bey.accel, [0, 0]), 2 * rectToPolar(bey.point).theta - rectToPolar(bey.accel).theta + Math.PI);
        }
    })
};

//���j�^�ɑ��M
var sendToMonitor = function () {
    io.of('/monitor').emit('StageInfo', beyList);
    //console.log('sent to monitor: ' + JSON.stringify(beyList));
};

createBey("a", 30);
createBey("b", 30);
createBey("c", 30);
createBey("d", 30);
createBey("e", 30);

//�N��
renderRoop();
worldRoop();