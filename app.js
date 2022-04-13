const http = require('http');
const fs = require('fs');
const ejs = require('ejs');
const url = require('url');
const qs = require('querystring');

const index = fs.readFileSync('./index.ejs', 'utf8');
const style_css = fs.readFileSync('./style.css', 'utf8');

const PORT = 8084;
const HOST = '0.0.0.0';
var server = http.createServer(getFromClient);
server.listen(PORT, HOST);
console.log('Server start!');

function getFromClient(req, res) {

  var url_parts = url.parse(req.url, true);

  switch (url_parts.pathname) {
    case '/':
      response_index(req, res);
      break;

    case '/style.css':
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.write(style_css);
      res.end();
      break;
    default:
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('no page...');
      break;
  }
}

const audio_path = "./sounds/greeting.wav"

function response_index(req, res) {
  var message = 'Input Text.'
  if (req.method == 'POST') {
    var body = '';

    req.on('data', (data) => {
      body += data;

    });
    req.on('end', () => {
      var post_data = qs.parse(body);
      msg = 'You said to me, "' + post_data.msg + '."';

      genAudio(post_data.msg, audio_path);

      var content = ejs.render(index, {
        title: "Voicevox TEST",
        message: msg,
      });
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(content);
      res.end();
    });

  } else {
    var content = ejs.render(index, {
      title: 'Voicevox TEST',
      message: message,
    });

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(content);
    res.end();
  }
}

const { default: axios } = require("axios");
const rpc = axios.create({ baseURL: "http://voicevox-engine:50021", proxy: false });

//text:喋ってもらいたい言葉
//filepath:保存先
//ex:genAudio("こんにちは","./greeting.wav");
async function genAudio(text, filepath) {

  /* まずtextを渡してsynthesis宛のパラメータを生成する、textはURLに付けるのでencodeURIで変換しておく。*/
  const audio_query = await rpc.post('audio_query?text=' + encodeURI(text) + '&speaker=1');

  //audio_queryで受け取った結果がaudio_query.dataに入っている。
  //このデータをメソッド:synthesisに渡すことで音声データを作ってもらえる
  //audio_query.dataはObjectで、synthesisに送る為にはstringで送る必要があるのでJSON.stringifyでstringに変換する
  const synthesis = await rpc.post("synthesis?speaker=1", JSON.stringify(audio_query.data), {
    responseType: 'arraybuffer',
    headers: {
      "accept": "audio/wav",
      "Content-Type": "application/json"
    }
  });

  //受け取った後、Bufferに変換して書き出す
  fs.writeFileSync(filepath, new Buffer.from(synthesis.data), 'binary');
}
