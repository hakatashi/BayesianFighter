$(function () {
    var socket = io.connect('http://' + location.host + '/monitor');

    var canvas = document.getElementById('Canvas');
    paper.setup(canvas);

    var fieldSize = 500;
    var viewPoint = new paper.Point(0,0);

    var canvasSize = paper.view.size;

    var beyCircles = new Array();

    var socketFPS = 0;
    var drawFPS = 0;

    var socketFPStext = new paper.PointText(new paper.Point(10, 20));
    var drawFPStext = new paper.PointText(new paper.Point(10, 40));
    socketFPStext.fillColor = 'black';
    drawFPStext.fillColor = 'black';

    var beys;

    function removeAllCircles() {
        beyCircles.forEach(function (beyCircle) {
            beyCircle.remove();
        })
    }

    //フィールド円描画
    var fieldShape = new paper.Path.Circle(viewPoint.add(paper.view.center), fieldSize);
    fieldShape.fillColor = '#ddd';
    console.log(JSON.stringify(fieldShape));

    paper.view.draw();

    //リサイズ時処理
    paper.view.onResize = function (event) {
        canvasSize = paper.view.size;
        fieldShape.position = paper.view.center;
    }

    //情報更新
    socket.on('StageInfo', function (message) {
        //console.log(JSON.stringify(message));
        beys = message;
        socketFPS++;
    });

    //描画
    setInterval(function () {
        removeAllCircles();
        beys.forEach(function (bey) {
            Math.seedrandom(bey.session);
            bey.hue = Math.random() * 360;
            bey.saturation = 0.6 + Math.random() * 0.4;
            bey.brightness = 1.0;
            var beyLocate = new paper.Point(bey.point);
            var tempCircle = new paper.Path.Circle(beyLocate.add(paper.view.center), bey.size);
            tempCircle.fillColor = new paper.Color({ 'hue': bey.hue, 'saturation': bey.saturation, 'brightness': bey.brightness });
            beyCircles.push(tempCircle);
        })
        paper.view.draw();
        drawFPS++;
    }, 1000 / 60);

    setInterval(function () {
        socketFPStext.content = 'Socket FPS: ' + socketFPS;
        drawFPStext.content = 'Draw FPS: ' + drawFPS;
        socketFPS = 0;
        drawFPS = 0;
    }, 1000);

});