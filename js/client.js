$(function () {
    var socket = io.connect('http://' + location.host + '/send');
    var socketid;

    var canvas = document.getElementById('Canvas');

    paper.setup(canvas);

    var project = new paper.Project(canvas);

    var SVGURLs = ['/img/bey01.svg'];
    var SVGcache = {};

    var FPStext = new paper.PointText(new paper.Point(10, 20));
    FPStext.fillColor = 'black';

    FPS = 0;

    setInterval(function () {
        FPStext.content = 'FPS: ' + FPS;
        FPS = 0;
    }, 1000);

    nowLoadingText = new paper.PointText({
        point: paper.view.center,
        content: 'Now Loading...',
        fillColor: 'black',
        fontSize: 24,
        justification: 'center'
    });

    paper.view.draw();

    var getData = function(name)  {
        return SVGcache[name] || $.ajax(
            name, {
                success: function (data) {
                    SVGcache[name] = data;
                }
            });
    };

    deferredObjects = [];
    for (var i = 0; i < SVGURLs.length; i++) {
        deferredObjects.push(getData(SVGURLs[i]));
    }

    $.when.apply(null, deferredObjects).done(function () {
        nowLoadingText.remove();

        var beyGroup = project.importSVG(SVGcache['/img/bey01.svg']);
        beyGroup.position = paper.view.center;
        beyGroup.angle = 0; //custom property
        beyGroup.scale(Math.min(paper.view.size.width, paper.view.size.height) * 0.9 / 300);

        var baseGroup = beyGroup.children['base'];
        var designGroup = beyGroup.children['design'];
        baseGroup.transformContent = true;
        designGroup.transformContent = true;

        connectingText = new paper.PointText({
            point: paper.view.center,
            content: 'Connecting...',
            fillColor: 'white',
            fontSize: 24,
            justification: 'center'
        });

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

            connectingText.remove();

            Math.seedrandom(socketid);
            console.log(socketid);
            var mainColor = new paper.Color({ 'hue': Math.random() * 360, 'saturation': 0.6 + Math.random() * 0.4, 'brightness': 0.6 + Math.random() * 0.4 });
            if (Math.random() > 0.5) {
                var accentColor = new paper.Color({ 'hue': mainColor.hue + Math.random() * 100 - 50, 'saturation': 0.6 + Math.random() * 0.4, 'brightness': mainColor.brightness - Math.random() * 0.4 - 0.2 })
            } else {
                var accentColor = new paper.Color({ 'hue': mainColor.hue + Math.random() * 30 + 20, 'saturation': 0.6 + Math.random() * 0.4, 'brightness': 0.6 + Math.random() * 0.4 })
            }
            if (Math.random() > 0.5) {
                baseGroup.fillColor = mainColor;
                designGroup.fillColor = accentColor;
            } else {
                baseGroup.fillColor = accentColor;
                designGroup.fillColor = mainColor;
            }

            var boundSize = Math.min(paper.view.size.width, paper.view.size.height) * 0.9;
            var boundRectangle = new paper.Rectangle();
            boundRectangle.size = [boundSize, boundSize];
            boundRectangle.center = paper.view.center;

            var infoWindow = new paper.Rectangle();
            infoWindow.center = paper.view.center;
            infoWindow.size = [600, 600];
            var infoWindowRounded = new paper.Path.RoundRectangle(infoWindow, new paper.Size(20, 20));
            infoWindowRounded.fillColor = 'black';
            infoWindowRounded.opacity = 0.7;

            var connectText = [];
            for (var i = 0; i < 3; i++) {
                connectText[i] = new paper.PointText({ fillColor: 'white', justification: 'center' });
            }
            connectText[0].content = 'BayesianFighter';
            connectText[0].point = infoWindow.center.add([0, -200]);
            connectText[0].fontSize = 60;
            connectText[1].content = '本日は駒場祭2013にお越しいただきありがとうございます。';
            connectText[1].point = infoWindow.center.add([0, -120]);
            connectText[1].fontSize = 18;
            connectText[2].content = '注意(必ずご確認ください)\n\n●本コンテンツではWebSocketを使用した通信を行います。\nご利用の際の通信料は各自の負担となりますので予めご了承ください。\n\n●プレイに際しては、画面の自動回転をOFFにし、\n画面の点灯時間を長めに設定していただくと、\n快適にプレイしていただけます。';
            connectText[2].point = infoWindow.center.add([0, -40]);
            connectText[2].fontSize = 18;

            var bottun01 = new paper.Rectangle();
            bottun01.center = infoWindow.center.add([0, 220]);
            bottun01.size = [400, 100];
            var bottun01Rounded = new paper.Path.RoundRectangle(bottun01, new paper.Size(20, 20));
            bottun01Rounded.fillColor = 'white';

            var bottunText01 = new paper.PointText({
                fillColor: 'black',
                justification: 'center',
                position: bottun01Rounded.position.add([0, 20]),
                fontSize: 48,
                content: 'OK'
            })

            var message01 = new paper.Group([infoWindowRounded, connectText[0], connectText[1], connectText[2], bottun01Rounded, bottunText01]);

            message01.fitBounds(boundRectangle);

            paper.view.onMouseDown = function (event) {
                console.log(message01.remove());
            };

            paper.view.draw();
        });

        paper.view.onFrame = function (event) {
            // var destAngle = Math.sin(event.time / 2) * 3000;
            var destAngle = event.time * -5;
            beyGroup.rotate(destAngle - beyGroup.angle);
            beyGroup.angle = destAngle;
            FPS++;
        };
    });
});