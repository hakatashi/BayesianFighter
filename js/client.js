$(function () {
    var socket = io.connect('http://' + location.host + '/hakatashi/BayesianFighter/send');
    var socketid;

    var canvas = document.getElementById('Canvas');

    paper.setup(canvas);

    var project = new paper.Project(canvas);

    var SVGURLs = ['/img/bey01.svg', '/img/img01.svg'];
    var SVGcache = {};

    var FPStext = new paper.PointText(new paper.Point(10, 20));
    FPStext.fillColor = 'black';

    var direction = 0;

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

    var setup = function () {
        nowLoadingText.remove();

        beyGroup = project.importSVG(SVGcache['/img/bey01.svg']);
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

        var onResponce = function (message) {
            if (message) {
                $("#res").html('Request Accepted.<br>' + $("#res").html());
            } else {
                $("#res").html('Request Denied.<br>' + $("#res").html());
            }
            socket.removeListener('responce', onResponce);
        }

        socket.on('establish', function (message) {
            var data = JSON.parse(message);
            socketid = data.id;

            connectingText.remove();

            Math.seedrandom(socketid);
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

            window01setup();

            paper.view.draw();

            socket.removeAllListeners('establish');
        });

        socket.on('disconnect', function (message) {
            project.activeLayer.removeChildren();
            window06setup();
        });

        paper.view.onFrame = function (event) {
            // var destAngle = Math.sin(event.time / 2) * 300 - event.time * 1000;
            var destAngle = event.time * -5;
            beyGroup.rotate(destAngle - beyGroup.angle);
            beyGroup.angle = destAngle;
            FPS++;
        };
    };

    var window01setup = function () {
        var boundSize = Math.min(paper.view.size.width, paper.view.size.height) * 0.85;
        var boundRectangle = new paper.Rectangle();
        boundRectangle.size = [boundSize, boundSize];
        boundRectangle.center = paper.view.center;

        var infoWindow = new paper.Rectangle();
        infoWindow.center = paper.view.center;
        infoWindow.size = [600, 600];
        var infoWindowRounded = new paper.Path.RoundRectangle(infoWindow, new paper.Size(20, 20));
        infoWindowRounded.fillColor = 'black';
        infoWindowRounded.opacity = 0.6;

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

        var button01 = new paper.Rectangle();
        button01.center = infoWindow.center.add([0, 220]);
        button01.size = [400, 100];
        var button01Rounded = new paper.Path.RoundRectangle(button01, new paper.Size(20, 20));
        button01Rounded.fillColor = 'white';

        var buttonText01 = new paper.PointText({
            fillColor: 'black',
            justification: 'center',
            position: button01Rounded.position.add([0, 20]),
            fontSize: 48,
            content: 'OK'
        })

        var buttonGroup = new paper.Group([button01Rounded, buttonText01]);

        var message01 = new paper.Group([infoWindowRounded, connectText[0], connectText[1], connectText[2], buttonGroup]);

        message01.fitBounds(boundRectangle);

        buttonGroup.onMouseDown = function (event) {
            message01.remove();
            window02setup();
        };
    };

    var window02setup = function () {
        var windowCreatedTime = (new Date);

        var boundSize = Math.min(paper.view.size.width, paper.view.size.height) * 0.85;
        var boundRectangle = new paper.Rectangle();
        boundRectangle.size = [boundSize, boundSize];
        boundRectangle.center = paper.view.center;

        var infoWindow = new paper.Rectangle();
        infoWindow.center = paper.view.center;
        infoWindow.size = [600, 600];
        var infoWindowRounded = new paper.Path.RoundRectangle(infoWindow, new paper.Size(20, 20));
        infoWindowRounded.fillColor = 'black';
        infoWindowRounded.opacity = 0.6;

        var connectText = [];
        for (var i = 0; i < 1; i++) {
            connectText[i] = new paper.PointText({ fillColor: 'white', justification: 'center' });
        }
        connectText[0].content = '端末の向きを判定します。\n端末を地面に垂直に持ってOKボタンを押してください。';
        connectText[0].point = infoWindow.center.add([0, -250]);
        connectText[0].fontSize = 20;

        var img01 = project.importSVG(SVGcache['/img/img01.svg']);
        img01.fillColor = 'white';
        img01.scale(350 / 600);
        img01.position = infoWindow.center.add([0, -30]);

        var button02 = new paper.Rectangle();
        button02.center = infoWindow.center.add([0, 220]);
        button02.size = [400, 100];
        var button02Rounded = new paper.Path.RoundRectangle(button02, new paper.Size(20, 20));
        button02Rounded.fillColor = 'white';

        var buttonText01 = new paper.PointText({
            fillColor: 'black',
            justification: 'center',
            position: button02Rounded.position.add([0, 20]),
            fontSize: 48,
            content: 'OK'
        })

        var buttonGroup = new paper.Group([button02Rounded, buttonText01]);

        var message02 = new paper.Group([infoWindowRounded, connectText[0], buttonGroup, img01]);

        message02.fitBounds(boundRectangle);

        buttonGroup.onMouseDown = function (event) {
            if ((new Date) - windowCreatedTime > 1000) {
                message02.remove();

                processingText = new paper.PointText({
                    point: paper.view.center,
                    content: 'Processing...',
                    fillColor: 'red',
                    fontSize: 24,
                    justification: 'center'
                });

                paper.view.draw();
                window.addEventListener('devicemotion', judgeDirection);
            }
        };
    };

    var window03setup = function () {
        var windowCreatedTime = (new Date);

        var boundSize = Math.min(paper.view.size.width, paper.view.size.height) * 0.85;
        var boundRectangle = new paper.Rectangle();
        boundRectangle.size = [boundSize, boundSize];
        boundRectangle.center = paper.view.center;

        var infoWindow = new paper.Rectangle();
        infoWindow.center = paper.view.center;
        infoWindow.size = [600, 600];
        var infoWindowRounded = new paper.Path.RoundRectangle(infoWindow, new paper.Size(20, 20));
        infoWindowRounded.fillColor = 'black';
        infoWindowRounded.opacity = 0.6;

        var connectText = [];
        for (var i = 0; i < 2; i++) {
            connectText[i] = new paper.PointText({ fillColor: 'white', justification: 'center' });
        }
        connectText[0].content = '端末の向き判定が完了しました！(dir=' + direction + ')\n端末を水平に戻してください。';
        connectText[0].point = infoWindow.center.add([0, -250]);
        connectText[0].fontSize = 28;
        connectText[1].content = 'ゲームに参加する準備が完了しました。\n以下の開始ボタンを押すとゲームに参加できます。';
        connectText[1].point = infoWindow.center.add([0, 0]);
        connectText[1].fontSize = 24;

        var button03 = new paper.Rectangle();
        button03.center = infoWindow.center.add([0, 220]);
        button03.size = [400, 100];
        var button03Rounded = new paper.Path.RoundRectangle(button03, new paper.Size(20, 20));
        button03Rounded.fillColor = 'white';

        var buttonText03 = new paper.PointText({
            fillColor: 'black',
            justification: 'center',
            position: button03Rounded.position.add([0, 20]),
            fontSize: 48,
            content: '開始'
        })

        var buttonGroup = new paper.Group([button03Rounded, buttonText03]);

        var message03 = new paper.Group([infoWindowRounded, connectText[0], connectText[1], buttonGroup]);

        message03.fitBounds(boundRectangle);

        buttonGroup.onMouseDown = function (event) {
            if ((new Date) - windowCreatedTime > 1000) {
                message03.remove();
                emergeRequest();
            }
        };
    };

    var judgeDirection = function (e) {
        var gravity = e.accelerationIncludingGravity;
        var maxDirection = Math.max(Math.abs(gravity.x), Math.abs(gravity.y), Math.abs(gravity.z));
        if (Math.abs(gravity.x) >= Math.abs(gravity.y) && Math.abs(gravity.x) >= Math.abs(gravity.z)) {
            if (gravity.x > 0) direction = 3;
            else direction = 1;
        } else if (Math.abs(gravity.y) >= Math.abs(gravity.z)) {
            if (gravity.y > 0) direction = 0;
            else direction = 2;
        } else if (maxDirection == Math.abs(gravity.z)) {
            if (gravity.z > 0) direction = 4;
            else direction = 5;
        }
        window.removeEventListener('devicemotion', judgeDirection);
        processingText.remove();
        window03setup();
    };

    var emergeRequest = function () {
        window.addEventListener('devicemotion', onDevicemotion);

        socket.emit('emerge');
        socket.on('responce', function (message) {
            var data = JSON.parse(message);
            if (data != true) {
                window.removeEventListener('devicemotion', onDevicemotion);
                window04setup();
            } else {
                socket.on('dead', onDead);
            }
            socket.removeAllListeners('responce');
        });
    };

    var onDevicemotion = function (e) {
        var gravity = e.accelerationIncludingGravity;

        var sensor = {};

        switch (direction) {
            case 0:
                sensor.x = -gravity.x;
                sensor.y = gravity.y;
                break;
            case 1:
                sensor.x = -gravity.y;
                sensor.y = -gravity.x;
                break;
            case 2:
                sensor.x = gravity.x;
                sensor.y = -gravity.y;
                break;
            case 3:
                sensor.x = gravity.y;
                sensor.y = gravity.x;
                break;
            case 4:
                sensor.x = -gravity.x;
                sensor.y = gravity.y;
                break;
            case 5:
                sensor.x = -gravity.x;
                sensor.y = gravity.y;
                break;
        }

        socket.emit('sensor', JSON.stringify(sensor));

        var minScreen = Math.min(paper.view.size.width, paper.view.size.height);
        beyGroup.position = paper.view.center.add([minScreen / 2 / 10 * sensor.x, minScreen / 2 / 10 * sensor.y]);

        paper.view.draw();
    };

    var onDead = function (message) {
        var data = JSON.parse(message);
        socket.removeListener('dead', onDead);
        window.removeEventListener('devicemotion', onDevicemotion);
        window05setup(data);
    };

    var window04setup = function () {
        var windowCreatedTime = (new Date);

        var boundSize = Math.min(paper.view.size.width, paper.view.size.height) * 0.85;
        var boundRectangle = new paper.Rectangle();
        boundRectangle.size = [boundSize, boundSize];
        boundRectangle.center = paper.view.center;

        var infoWindow = new paper.Rectangle();
        infoWindow.center = paper.view.center;
        infoWindow.size = [600, 600];
        var infoWindowRounded = new paper.Path.RoundRectangle(infoWindow, new paper.Size(20, 20));
        infoWindowRounded.fillColor = 'black';
        infoWindowRounded.opacity = 0.6;

        var connectText = [];
        for (var i = 0; i < 1; i++) {
            connectText[i] = new paper.PointText({ fillColor: 'white', justification: 'center' });
        }
        connectText[0].content = 'システムが混雑しています。\n空いてる時間を見計らってもう一度お試しください。';
        connectText[0].point = infoWindow.center.add([0, -50]);
        connectText[0].fontSize = 20;

        var button = new paper.Rectangle();
        button.center = infoWindow.center.add([0, 220]);
        button.size = [400, 100];
        var buttonRounded = new paper.Path.RoundRectangle(button, new paper.Size(20, 20));
        buttonRounded.fillColor = 'white';

        var buttonText = new paper.PointText({
            fillColor: 'black',
            justification: 'center',
            position: buttonRounded.position.add([0, 20]),
            fontSize: 48,
            content: '開始'
        });

        var buttonGroup = new paper.Group([buttonRounded, buttonText]);

        var message = new paper.Group([infoWindowRounded, connectText[0], buttonGroup]);

        message.fitBounds(boundRectangle);

        buttonGroup.onMouseDown = function (event) {
            if ((new Date) - windowCreatedTime > 1000) {
                message.remove();
                emergeRequest();
            }
        };
    };

    var window05setup = function (data) {
        var windowCreatedTime = (new Date);

        var boundSize = Math.min(paper.view.size.width, paper.view.size.height) * 0.85;
        var boundRectangle = new paper.Rectangle();
        boundRectangle.size = [boundSize, boundSize];
        boundRectangle.center = paper.view.center;

        var infoWindow = new paper.Rectangle();
        infoWindow.center = paper.view.center;
        infoWindow.size = [600, 600];
        var infoWindowRounded = new paper.Path.RoundRectangle(infoWindow, new paper.Size(20, 20));
        infoWindowRounded.fillColor = 'black';
        infoWindowRounded.opacity = 0.6;

        var connectText = [];
        for (var i = 0; i < 2; i++) {
            connectText[i] = new paper.PointText({ fillColor: 'white', justification: 'center' });
        }
        connectText[0].content = '残念！やられてしまいました。';
        connectText[0].point = infoWindow.center.add([0, -200]);
        connectText[0].fontSize = 36;
        connectText[1].content = data.surviveTime.toFixed(1) + '秒間、生存しました。\n' + data.bastedBeys + '個のベイを倒しました。';
        connectText[1].point = infoWindow.center.add([0, 0]);
        connectText[1].fontSize = 24;

        var button = new paper.Rectangle();
        button.center = infoWindow.center.add([0, 220]);
        button.size = [400, 100];
        var buttonRounded = new paper.Path.RoundRectangle(button, new paper.Size(20, 20));
        buttonRounded.fillColor = 'white';

        var buttonText = new paper.PointText({
            fillColor: 'black',
            justification: 'center',
            position: infoWindow.center.add([0, 240]),
            fontSize: 48,
            content: 'もう一度開始'
        });

        var buttonGroup = new paper.Group([buttonRounded, buttonText]);

        var message = new paper.Group([infoWindowRounded, connectText[0], connectText[1], buttonGroup]);

        message.fitBounds(boundRectangle);

        buttonGroup.onMouseDown = function (event) {
            if ((new Date) - windowCreatedTime > 1000) {
                message.remove();
                emergeRequest();
            }
        };
    };

    var window06setup = function () {
        var boundSize = Math.min(paper.view.size.width, paper.view.size.height) * 0.85;
        var boundRectangle = new paper.Rectangle();
        boundRectangle.size = [boundSize, boundSize];
        boundRectangle.center = paper.view.center;

        var infoWindow = new paper.Rectangle();
        infoWindow.center = paper.view.center;
        infoWindow.size = [600, 600];
        var infoWindowRounded = new paper.Path.RoundRectangle(infoWindow, new paper.Size(20, 20));
        infoWindowRounded.fillColor = 'black';
        infoWindowRounded.opacity = 0.6;

        var connectText = [];
        for (var i = 0; i < 1; i++) {
            connectText[i] = new paper.PointText({ fillColor: 'white', justification: 'center' });
        }
        connectText[0].content = '接続が切断されました。\n電波状況を確認してもう一度お試しください。';
        connectText[0].point = infoWindow.center.add([0, 0]);
        connectText[0].fontSize = 24;

        var message = new paper.Group([infoWindowRounded, connectText[0]]);

        message.fitBounds(boundRectangle);

        paper.view.draw();
    };

    deferredObjects = [];
    for (var i = 0; i < SVGURLs.length; i++) {
        deferredObjects.push(getData(SVGURLs[i]));
    }

    $.when.apply(null, deferredObjects).done(setup);
});
