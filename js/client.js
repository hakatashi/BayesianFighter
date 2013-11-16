$(function () {
    var socket = io.connect('http://' + location.host + '/send');

    setInterval(function () {
        var message = Date();
        $('#time').text(message);
        socket.emit('info', message);
        console.log(message);
    }, 1000);

    // 円描画

    var canvas = document.getElementById('Canvas');

    paper.setup(canvas);
    var GravCirc = new paper.Path.Circle(new paper.Point(200, 200), 5);
    GravCirc.fillColor = "red";
    var AccCirc = new paper.Path.Circle(new paper.Point(200, 200), 5);
    AccCirc.fillColor = "blue";
    var RotCirc = new paper.Path.Circle(new paper.Point(200, 200), 5);
    RotCirc.fillColor = "black";
    var DiffCirc = new paper.Path.Circle(new paper.Point(200, 200), 5);
    DiffCirc.fillColor = "green";

    // 軸描画

    var axisX = new paper.Path();
    axisX.strokeColor = 'black';
    axisX.add([0, 200], [400, 200]);

    var axisY = new paper.Path();
    axisY.strokeColor = 'black';
    axisY.add([200, 0], [200, 400]);

    window.addEventListener('devicemotion', function (e) {
        // 重力加速度
        var gravity = e.accelerationIncludingGravity;
        $("#gravity").text('重力加速度: ' + gravity.x + ', ' + gravity.y + ', ' + gravity.z);
        GravCirc.position = [-gravity.x * 20 + 200, gravity.y * 20 + 200];
        GravCirc.scale((gravity.z + 10.0) * 2.0 / GravCirc.bounds.width);

        socket.emit('sensor', JSON.stringify(gravity));

        // 以下は一部のデバイスでしか動かない可能性あり

        // 加速度

        if (typeof (e.acceleration.x) != "undefined") {
            $("#info").text("加速度センサが利用できます");
        }

        var accel = e.acceleration;
        $("#accel").text('加速度: ' + accel.x + ', ' + accel.y + ', ' + accel.z);
        AccCirc.position = [-accel.x * 20 + 200, accel.y * 20 + 200];
        AccCirc.scale((accel.z + 10.0) * 2.0 / AccCirc.bounds.width);

        DiffCirc.position = [-(gravity.x - accel.x) * 20 + 200, (gravity.y - accel.y) * 20 + 200];
        AccCirc.scale(((gravity.z - accel.z) + 10.0) * 2.0 / AccCirc.bounds.width);

        // 回転加速度
        var rotation = e.rotationRate;
        $("#rotation").text('回転加速度: ' + rotation.x + ', ' + rotation.y + ', ' + rotation.z);
        RotCirc.position = [-rotation.x * 20 + 200, rotation.y * 20 + 200];
        RotCirc.scale((rotation.z + 10.0) * 2.0 / RotCirc.bounds.width);

        paper.view.draw();
    });

    var onResponce = function (message) {
        if (message) {
            $("#res").html('Request Accepted.<br>' + $("#res").html());
        } else {
            $("#res").html('Request Denied.<br>' + $("#res").html());
        }
        socket.removeListener('responce', onResponce);
    }

    $("#emerge").click(function () {
        socket.emit('emerge');
        socket.on('responce', onResponce);
    });

    $("#exit").click(function () {
        socket.emit('exit');
        socket.on('responce', onResponce);
    });

    socket.on('dead', function (message) {
        var data = JSON.parse(message);
        $("#res").html('Youve Died. ' + data.surviveTime.toFixed(1) + ' second survived.<br>' + $("#res").html());
    });
});