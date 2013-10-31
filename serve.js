var app = require('http').createServer(handler), io = require('socket.io').listen(app), fs = require('fs');

var fps = 30;
var fieldState;
var beyList = new Array();
var maxBeys = 10;
var fieldSize = 500;
var speed = 3;
var repulse = 100;
var friction = 1;

//ベイオブジェクト
var BeyObject = function (point, size, session) {
    this.point = point;
    this.size = size;
    this.session = session;
    this.accel = [0, 0];
    this.sensor = { 'x': 0, 'y': 0, 'z': 0 };
}

function sessionExistsInBeyList(session) {
    for (i = 0; i < beyList.length; i++) {
        if (session == beyList[i].session) {
            return true;
        }
    }
    return false;
}

//ベイを出現させる
function createBey(session, size) {
    var emergePoint = false;
    if (beyList.length >= maxBeys || sessionExistsInBeyList(session)) {
        return false;
    }
    //乱択して他のベイとぶつからない位置なら続行
    //n回試行してダメなら諦める
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

//ベイを消去する
function removeBey(session) {
    for (i = 0; i < beyList.length; i++) {
        if (session == beyList[i].session) {
            beyList.splice(i, 1);
            return true;
        }
    }
    return false;
}

//センサ情報の更新
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

//ファイルから読み込んでレスポンス
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

//必要なファイルを提供
function handler (req, res) {
    var urlinfo = require('url').parse(req.url, true);
    if (urlinfo.pathname === "/") writeFromFile(req, res, "/index.html");
    else if (urlinfo.pathname === "/js/client.js") writeFromFile(req, res, "/js/client.js");
    else if (urlinfo.pathname === "/monitor") writeFromFile(req, res, "/monitor.html");
    else if (urlinfo.pathname === "/js/monitor.js") writeFromFile(req, res, "/js/monitor.js");
}

//接続時処理

//センダー
io.of('/send').on('connection', function (socket) {
    console.log('sender: ' + socket.id + ': connected');
    //汎用メッセージ
    socket.on('info', function (message) {
        console.log('sender: ' + socket.id + ': ' + JSON.stringify(message));
    });
    //出現リクエスト
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
    //消去リクエスト
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
    //センサ情報の更新
    socket.on('sensor', function (sensor) {
        //console.log('sender: ' + socket.id + ': recieved sensor info: ' + JSON.stringify(sensor));
        updateSensorInfo(socket.id, sensor);
    })
    //切断
    socket.on('disconnect', function () {
        console.log('sender: ' + socket.id + ': disconnected');
        removeBey(socket.id);
    });
});

//モニター
io.of('/monitor').on('connection', function (socket) {
    console.log('monitor: ' + socket.id + ': connected');
    //汎用メッセージ
    socket.on('info', function (message) {
        //console.log('monitor: ' + socket.id + ': ' + JSON.stringify(message));
    });
    //切断
    socket.on('disconnect', function () {
        console.log('monitor: ' + socket.id + ': disconnected');
    });
});

//メインループ
var roop = function () {
    setInterval(function () {
        updateBeys();
        sendToMonitor();
    }, 1000.0 / fps);
};

//ベイの位置更新
var updateBeys = function () {
    beyList.forEach(function (bey) {
        var accelPolar = rectToPolar(bey.accel);
        if (accelPolar.r >= friction / fps) bey.accel = polarToRect(accelPolar.r - friction / fps, accelPolar.theta);
        else bey.accel = [0, 0];
        bey.accel[0] += -bey.sensor.x * (speed / fps);
        bey.accel[1] += bey.sensor.y * (speed / fps);
        bey.point[0] += bey.accel[0];
        bey.point[1] += bey.accel[1];
        beyList.forEach(function (objBey) {
            if (bey.session > objBey.session) {
                if (distanceBetween(bey.point, objBey.point) < bey.size + objBey.size) {
                    var objDirection = rectToPolar([objBey.point[0] - bey.point[0], objBey.point[1] - bey.point[1]]); // beyから見たobjBeyの位置
                    var repulsePower = polarToRect(repulse / fps, objDirection.theta);

                    bey.accel = polarToRect(distanceBetween(bey.accel, [0, 0]), 2 * objDirection.theta - rectToPolar(bey.accel).theta + Math.PI);
                    bey.accel = [bey.accel[0] - repulsePower[0], bey.accel[1] - repulsePower[1]];

                    objBey.accel = polarToRect(distanceBetween(objBey.accel, [0, 0]), 2 * objDirection.theta - rectToPolar(objBey.accel).theta + Math.PI);
                    objBey.accel = [objBey.accel[0] + repulsePower[0], objBey.accel[1] + repulsePower[1]];
                }
            }
        })
        if (distanceBetween(bey.point, [0, 0]) > fieldSize - bey.size) {
            bey.point = polarToRect((fieldSize - bey.size) * 2 - distanceBetween(bey.point, [0, 0]), rectToPolar(bey.point).theta);
            bey.accel = polarToRect(distanceBetween(bey.accel, [0, 0]), 2 * rectToPolar(bey.point).theta - rectToPolar(bey.accel).theta + Math.PI);
        }
    })
};

//モニタに送信
var sendToMonitor = function () {
    io.of('/monitor').emit('StageInfo', beyList);
    //console.log('sent to monitor: ' + JSON.stringify(beyList));
};

beyList[0] = new BeyObject([0, 0], 30, '');

//起動
roop();