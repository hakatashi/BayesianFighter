var app = require('http').createServer(handler), io = require('socket.io').listen(app), fs = require('fs');

var renderFPS = 60;
var worldFPS = 120;
var cpuThinkFPS = 3;
var fieldState;
var beyList = new Array();
var maxBeys = 15;
var stdBeys = 10;
var cpuMinEmergeTime = 3;
var fieldSize = 500;
var speed = 1.5;
var repulse = 300;
var friction = 3;
var restCoeff = 1; //�����W��

var latestCpuEmergeFrame = 0;
var frame = 0;
var clients = {};

//�x�C�I�u�W�F�N�g
var BeyObject = function (point, size, session, isCPU) {
    this.isCPU = isCPU;
    this.point = point;
    this.size = size;
    this.session = session;
    this.speed = [0, 0];
    this.sensor = { 'x': 0, 'y': 0, 'z': 0 };
    this.weight = 100;
    this.emergeTime = frame;
}

function sessionExistsInBeyList(session) {
    for (i = 0; i < beyList.length; i++) {
        if (session == beyList[i].session) {
            return true;
        }
    }
    return false;
}

function searchEmergePoint(size) {
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
            return pointByRect;
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
    if ((emergePoint = searchEmergePoint(size)) == false) {
        return false;
    }
    var bey = new BeyObject(emergePoint, size, session, false);
    beyList.push(bey);
    return true;
}

//�x�C����������
function removeBey(session) {
    for (i = 0; i < beyList.length; i++) {
        if (session == beyList[i].session) {
            console.log(session);
            console.log(clients[session]);
            if (!(beyList[i].isCPU)) {
                clients[session].emit('dead', JSON.stringify({
                    'surviveTime': (frame - beyList[i].emergeTime) / worldFPS
                }));
            }
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

app.listen(25);

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
            clients[socket.id] = socket;
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

//���C�����[�v
var worldRoop = function () {
    setInterval(function () {
        updateCPU();
        updateBeys();
        frame++;
    }, 1000.0 / worldFPS);
}

//���M���[�v
var renderRoop = function () {
    setInterval(function () {
        sendToMonitor();
    }, 1000.0 / renderFPS);
}

//CPU���[�v
var cpuThinkRoop = function () {
    setInterval(function () {
        cpuThink();
    }, 1000.0 / cpuThinkFPS);
}

var emergeCPU = function () {
    var emergePoint;
    if ((emergePoint = searchEmergePoint(30)) == false) {
        return false;
    }
    var bey = new BeyObject(emergePoint, 30, String(Math.random()), true);
    beyList.push(bey);
    latestCpuEmergeFrame = frame;
    return true;
}

var updateCPU = function () {
    //�Ֆʂ̃x�C�̐���stdBeys�ɖ����Ȃ��ꍇ�ACPU��ǉ�
    if (beyList.length < stdBeys && frame > latestCpuEmergeFrame + cpuMinEmergeTime * worldFPS) {
        emergeCPU();
    }
}

//�x�C�̈ʒu�X�V
var updateBeys = function () {
    beyList.forEach(function (bey) {
        var speedPolar = rectToPolar(bey.speed);
        //���C�ɂ�錸��
        if (speedPolar.r >= friction) bey.speed = polarToRect(speedPolar.r - friction, speedPolar.theta);
        else bey.speed = [0, 0];
        //�Z���T�[�l�𔽉f���ĉ���
        bey.speed[0] += -bey.sensor.x * speed;
        bey.speed[1] += bey.sensor.y * speed;
        bey.point[0] += bey.speed[0] / worldFPS;
        bey.point[1] += bey.speed[1] / worldFPS;

        //�Փˏ���
        beyList.forEach(function (objBey) {
            if (bey.session > objBey.session) {
                if (distanceBetween(bey.point, objBey.point) < bey.size + objBey.size) {
                    //bey���猩��objBey�̈ʒu
                    var objDirection = rectToPolar([objBey.point[0] - bey.point[0], objBey.point[1] - bey.point[1]]);
                    //���x��@�������ƕ��s�����ɕ���
                    var resolvedBeySpd = polarToRect(rectToPolar(bey.speed).r, rectToPolar(bey.speed).theta - objDirection.theta);
                    var resolvedObjSpd = polarToRect(rectToPolar(objBey.speed).r, rectToPolar(objBey.speed).theta - objDirection.theta);
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

                    var newResolvedBeySpdY = resolvedBeySpd[1] - (resolvedBeySpd[1] - resolvedObjSpd[1]) * (1 + restCoeff) * (objBey.weight / (bey.weight + objBey.weight));
                    var newResolvedObjSpdY = resolvedObjSpd[1] + (resolvedBeySpd[1] - resolvedObjSpd[1]) * (1 + restCoeff) * (bey.weight / (bey.weight + objBey.weight));

                    resolvedBeySpd[1] = newResolvedBeySpdY;
                    resolvedObjSpd[1] = newResolvedObjSpdY;

                    bey.speed = polarToRect(rectToPolar(resolvedBeySpd).r, rectToPolar(resolvedBeySpd).theta + objDirection.theta);
                    objBey.speed = polarToRect(rectToPolar(resolvedObjSpd).r, rectToPolar(resolvedObjSpd).theta + objDirection.theta);

                    bey.speed = [bey.speed[0] - repulsePower[0], bey.speed[1] - repulsePower[1]];
                    objBey.speed = [objBey.speed[0] + repulsePower[0], objBey.speed[1] + repulsePower[1]];
                }
            }
        })
        if (distanceBetween(bey.point, [0, 0]) > fieldSize - bey.size) {
            removeBey(bey.session);
            //bey.point = polarToRect((fieldSize - bey.size) * 2 - distanceBetween(bey.point, [0, 0]), rectToPolar(bey.point).theta);
            //bey.speed = polarToRect(distanceBetween(bey.speed, [0, 0]), 2 * rectToPolar(bey.point).theta - rectToPolar(bey.speed).theta + Math.PI);
        }
    })
};

var cpuThink = function () {
    beyList.forEach(function (bey) {
        if (bey.isCPU) {
            if (distanceBetween(bey.speed, [0, 0]) > 5000) {
                var speedVector = rectToPolar(bey.speed);
                var sensorRect = polarToRect(8, speedVector.theta + Math.PI);
                bey.sensor.x = -sensorRect[0];
                bey.sensor.y = sensorRect[1];
                return;
            }
            var prospects = [bey.point[0] + bey.speed[0] * 0.5, bey.point[1] + bey.speed[1] * 0.5];
            if (distanceBetween(prospects, [0, 0]) > fieldSize || fieldSize - distanceBetween(bey.point,[0,0]) - bey.size < 100) {
                var outerVector = rectToPolar(bey.point);
                var sensorRect = polarToRect(8, outerVector.theta + Math.PI);
                bey.sensor.x = -sensorRect[0];
                bey.sensor.y = sensorRect[1];
                return;
            }
            var sensorRect = polarToRect(5, Math.random() * Math.PI * 2);
            bey.sensor.x = -sensorRect[0];
            bey.sensor.y = sensorRect[1];
        }
    });
}

//���j�^�ɑ��M
var sendToMonitor = function () {
    io.of('/monitor').emit('StageInfo', beyList);
    //console.log('sent to monitor: ' + JSON.stringify(beyList));
}

//�N��
renderRoop();
worldRoop();
cpuThinkRoop();