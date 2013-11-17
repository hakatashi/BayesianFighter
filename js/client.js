$(function () {
    var socket = io.connect('http://' + location.host + '/send');
    var socketid;

    var canvas = document.getElementById('Canvas');

    paper.setup(canvas);

    var project = new paper.Project(canvas);
    
    var bey_svg = project.importSVG(document.getElementById('bey_svg'));
    bey_svg.position = paper.view.center;
    bey_svg.angle = 0; //custom property

    var baseGroup = bey_svg.children['base'];
    var designGroup = bey_svg.children['design'];
    baseGroup.transformContent = true;
    designGroup.transformContent = true;

    setInterval(function () {
        var message = Date();
        $('#time').text(message);
        socket.emit('info', message);
        console.log(message);
    }, 1000);

    window.addEventListener('devicemotion', function (e) {
        // 重力加速度
        var gravity = e.accelerationIncludingGravity;
        $("#gravity").text('重力加速度: ' + gravity.x + ', ' + gravity.y + ', ' + gravity.z);

        socket.emit('sensor', JSON.stringify(gravity));

        // 以下は一部のデバイスでしか動かない可能性あり

        // 加速度

        if (typeof (e.acceleration.x) != "undefined") {
            $("#info").text("加速度センサが利用できます");
        }

        var accel = e.acceleration;
        $("#accel").text('加速度: ' + accel.x + ', ' + accel.y + ', ' + accel.z);

        // 回転加速度
        var rotation = e.rotationRate;
        $("#rotation").text('回転加速度: ' + rotation.x + ', ' + rotation.y + ', ' + rotation.z);

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

    socket.on('establish', function (message) {
        var data = JSON.parse(message);
        socketid = data.id;

        Math.seedrandom(socketid);
        console.log(socketid);
        if (Math.random() > 0.5) {
            baseGroup.fillColor = new paper.Color({ 'hue': Math.random() * 360, 'saturation': 0.6 + Math.random() * 0.4, 'brightness': 0.6 + Math.random() * 0.4 });
            designGroup.fillColor = new paper.Color({ 'hue': baseGroup.fillColor.hue + Math.random() * 100 - 50, 'saturation': 0.6 + Math.random() * 0.4, 'brightness': 0.1 + Math.random() * 0.5 });
        } else {
            baseGroup.fillColor = new paper.Color({ 'hue': Math.random() * 360, 'saturation': 0.6 + Math.random() * 0.4, 'brightness': 0.1 + Math.random() * 0.5 });
            designGroup.fillColor = new paper.Color({ 'hue': baseGroup.fillColor.hue + Math.random() * 100 - 50, 'saturation': 0.6 + Math.random() * 0.4, 'brightness': 0.6 + Math.random() * 0.4 });
        }

        paper.view.draw();
    });

    paper.view.onFrame = function (event) {
        var destAngle = Math.sin(event.time) * 1000;
        bey_svg.rotate(destAngle - bey_svg.angle);
        bey_svg.angle = destAngle;
    };
});