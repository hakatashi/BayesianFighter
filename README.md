BayesianFighter
===============

[![Greenkeeper badge](https://badges.greenkeeper.io/hakatashi/BayesianFighter.svg)](https://greenkeeper.io/)

2013年度東京大学駒場祭のTSGの展示企画で使用したプログラムです。

This game program was exhibited in TSG booth at the 64th Komaba Festival of the University of Tokyo on Nov 22-24, 2013.

大したDoS対策をしてないので間違っても実際の運用で使用しないでください。

As it lacks measures to guard you against DoS attacks, you can never run this program for real operations.

# What's this?

オンライン参加型のリアルタイムベイゴマゲームです。スマートフォンを傾けて自分のベイゴマを操作し、できるだけ多くの敵をステージから落とすのが目標です。

プログラムを起動すると、`http://hostname/`でスマートフォンからアクセスするコントロール画面を、`http://hostname/monitor`で展示画面からアクセスするモニター画面を提供します。

モニタ画面に表示されるステージには常時数個のコンピューター(灰色で表示)が存在し、互いに蹴落とし合う激しいバトルを繰り広げます。

スマートフォンからコントロール画面にアクセスするとわかりやすい導入画面が表示され、向き判定の手順を踏むように指示されたあと、ゲームに参加できるようになります。

ゲームに参加すると手元に表示されてるベイと同じ色のベイがモニタ画面に出現し、スマホを傾けて操作できるようになります。(コントロール画面にステージは表示されません。手元は見ずにモニター画面を見ながら操作します。)

# How to...

## Install

node.jsをインストールし、以下を実行

Install node.js, and execute following:

    npm install

## Run

    npm start

# License

CC0 1.0 Universal のもとで一切の著作権を放棄します。`LICENSE`をご覧ください。

I dedicate all copyright under CC0 1.0 Universal. Read `LICENSE`.

# Acknowledgements

このプログラムでは[Google Hosted Libraries](https://developers.google.com/speed/libraries/)および[cdnjs](http://cdnjs.com/)によるスクリプトホスティングを利用しています。

TSG、およびnpcaのみなさんにテストプレイに協力いただきました。

プログラム作成にあたり、以下のウェブサイトなどを参考にさせていただきました。(コードの流用はありません)

* [iOS4.2〜のSafariで傾きを取得し、socket.ioでリアルタイム通信 - テクスト讃歌](http://noumenon-th.net/text-hymn/2011/02/ios42safarisocketio.php)
* [入門　node.jsとsocket.ioの中でJSON形式を扱う例 - テクスト讃歌](http://noumenon-th.net/text-hymn/2011/02/nodejssocketiojson.php)
* [pxsta's Memo » Canvas+node.js+socket.ioで簡易オンラインゲーム作ってみた](http://www.pxsta.net/blog/?p=3208)
* [今更だけどSocket.ioについてまとめてみる | ブログ :: Web notes.log](http://blog.wnotes.net/blog/article/nodejs-socketio-summary)
* [Socket.IO API 解説 - Block Rockin’ Codes](http://d.hatena.ne.jp/Jxck/20110730/1312042603)
* [Socket.IO と Express でセッションの共有 - Block Rockin’ Codes](http://d.hatena.ne.jp/Jxck/20110809/1312847290)
* [socket.io](https://npmjs.org/package/socket.io)
* [第1回　Node.jsとは：基礎から学ぶNode.js｜gihyo.jp … 技術評論社](http://gihyo.jp/dev/serial/01/nodejs/0001)
* [pxt | node.jsに入門してみる。～インストールからHelloWorldまで編～](http://www.pxt.jp/ja/diary/article/265/index.html)
* [Node.js v0.10.22 Manual & Documentation](http://nodejs.jp/nodejs.org_ja/docs/v0.10/api/)
* [ビギナーのための Node.jsプログラミング入門](http://libro.tuyano.com/index2?id=1115003)
* [node.jsのSocket.IOを使ってiPhoneの加速度センサデータをリアルタイム転送 - Mac使いのドザ](http://d.hatena.ne.jp/tomo-ono/20110530/1306740692)
* [node.js node.jsスクリプトをforeverでデーモン化する -でじうぃき](http://onlineconsultant.jp/pukiwiki/?node.js%20node.js%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%97%E3%83%88%E3%82%92forever%E3%81%A7%E3%83%87%E3%83%BC%E3%83%A2%E3%83%B3%E5%8C%96%E3%81%99%E3%82%8B)
* [結婚式二次会用に Node.js x ブラウザでタイピング対決アプリを作ってみた - 凹みTips](http://d.hatena.ne.jp/hecomi/20131116/1384598882)
* [さくらのVPSでNode.jsを設定してみた | 水玉製作所](http://www.mztm.jp/2013/05/27/sakuranodejs/)