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

    var beys = [];

    var SVGURLs = ['/img/bey01.svg', '/img/img01.svg'];
    var SVGcache = {};

    var beyObjects = {};

    nowLoadingText = new paper.PointText({
        point: paper.view.center,
        content: 'Now Loading...',
        fillColor: 'black',
        fontSize: 24,
        justification: 'center'
    });

    paper.view.draw();

    var getData = function (name) {
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

    var setup = function () {
        //フィールド円描画
        var fieldShape = new paper.Path.Circle(viewPoint.add(paper.view.center), fieldSize);
        fieldShape.fillColor = '#ddd';

        paper.view.draw();

        //リサイズ時処理
        paper.view.onResize = function (event) {
            canvasSize = paper.view.size;
            fieldShape.position = paper.view.center;
        }

        //情報更新
        socket.on('StageInfo', function (message) {
            beys = message;
            socketFPS++;
        });

        //描画
        setInterval(function () {
            beys.forEach(function (bey) {
                var beyLocate = new paper.Point(bey.point);

                for (var beyObject in beyObjects) {
                    beyObject.called = false; // custom property
                }

                if (beyObjects[bey.session]) {
                    beyObjects[bey.session].position = beyLocate.add(paper.view.center);
                    beyObjects[bey.session].called = true;
                } else {
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

                    var baseCircle = new paper.Path.Circle(beyLocate.add(paper.view.center), bey.size);
                    baseCircle.fillColor = new paper.Color(baseColor);
                    beyCircles.push(baseCircle);
                    var designCircle = new paper.Path.Circle(beyLocate.add(paper.view.center), bey.size / 2);
                    designCircle.fillColor = new paper.Color(designColor);
                    beyCircles.push(designCircle);

                    var beyObject = new paper.Group([baseCircle, designCircle]);

                    beyObjects[bey.session] = beyObject;
                    beyObjects[bey.session].called = true;
                }

                for (var beyObject in beyObjects) {
                    if (beyObject.called == false) beyObject.remove();
                }
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
    }

    $.when.apply(null, deferredObjects).done(setup);
});