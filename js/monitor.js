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
            var beyLocate = new paper.Point(bey.point);

            Math.seedrandom(bey.session);
            var mainColor = new paper.Color({ 'hue': Math.random() * 360, 'saturation': 0.6 + Math.random() * 0.4, 'brightness': 0.6 + Math.random() * 0.4 });
            if (Math.random() > 0.5) {
                var accentColor = new paper.Color({ 'hue': mainColor.hue + Math.random() * 100 - 50, 'saturation': 0.6 + Math.random() * 0.4, 'brightness': mainColor.brightness - Math.random() * 0.4 - 0.2 })
            } else {
                var accentColor = new paper.Color({ 'hue': mainColor.hue + Math.random() * 30 + 20, 'saturation': 0.6 + Math.random() * 0.4, 'brightness': 0.6 + Math.random() * 0.4 })
            }
            if (Math.random() > 0.5) {
                baseColor = mainColor;
                designColor = accentColor;
            } else {
                baseColor = accentColor;
                designColor = mainColor;
            }

            if (bey.isCPU == true) {
                baseColor.saturation = 0;
                designColor.saturation = 0;
                baseColor.brightness = Math.max(baseColor.brightness - 0.4, 0);
                designColor.brightness = Math.max(designColor.brightness - 0.4, 0);
            }

            var tempCircle = new paper.Path.Circle(beyLocate.add(paper.view.center), bey.size);
            tempCircle.fillColor = new paper.Color(baseColor);
            beyCircles.push(tempCircle);
            var tempCircle = new paper.Path.Circle(beyLocate.add(paper.view.center), bey.size/2);
            tempCircle.fillColor = new paper.Color(designColor);
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