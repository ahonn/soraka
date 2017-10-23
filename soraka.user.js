// ==UserScript==
// @name         Soraka
// @namespace    https://github.com/ahonn/soraka
// @version      0.5.3
// @description  超星 Mooc 视频助手 for Tampermonkey
// @author       Ahonn <ahonn95@outlook.com>
// @match        https://mooc1-2.chaoxing.com/mycourse/studentstudy?*
// @grant        GM_addStyle
// @connect      raw.githubusercontent.com
// @connect      greasyfork.org
// ==/UserScript==

////////////////////////////////////////////////////////////////////////
//                              Logger                               //
////////////////////////////////////////////////////////////////////////

class Logger {
  constructor({ prefix, repo }) {
    this.prefix = prefix;
    this.repo = repo;

    const html = `
    <div class="${prefix}-logger">
      <h1 class="${prefix}-logger-title">
        <a class="${prefix}-logger-repo" href="${repo}">
          ${prefix}
        </a>
      </h1>
      <ul class="${prefix}-logger-list">
        <li id="${prefix}-loading" class="${prefix}-logger-item"></li>
        <li id="${prefix}-version" class="${prefix}-logger-item"></li>
        <li id="${prefix}-status" class="${prefix}-logger-item"></li>
        <li id="${prefix}-progress" class="${prefix}-logger-item"></li>
      </ul>
    </div>
    `;
    document.body.innerHTML += html;
    this.addGlobalStyle();
  }

  addGlobalStyle() {
    const { prefix } = this;
    GM_addStyle(`
      #btnOpt {
        display: none;
      }

      .${prefix}-logger {
        width: 100vw;
        position: fixed;
        bottom: 0;
        background-color: #24292e;
        z-index: 999;
        0 -2px 10px #ababab;
      }

      .${prefix}-logger-title {
        padding: 3px 10px;
        border-bottom: 1px solid #666;
      }

      .${prefix}-logger-repo {
        color: #dd4c4f;
      }

      .${prefix}-logger-list {
        list-style: none;
        padding: 10px;
        color: #fafafa;
      }

      .${prefix}-logger-list a {
        color: #dd4c4f;
      }
    `);
  }

  info(type, message) {
    const { prefix } = this;
    const msg = prefix + ' > ' + message;
    const $info = document.querySelector(`#${prefix}-${type}`);
    $info.innerHTML = msg;
    console.log(msg);
  }
}

////////////////////////////////////////////////////////////////////////
//                               Soraka                               //
////////////////////////////////////////////////////////////////////////

const API_HOST = 'https://mooc1-2.chaoxing.com';
const RAW_HOST = 'https://raw.githubusercontent.com/ahonn/soraka/master';
const SCRIPT_URL = 'https://greasyfork.org/zh-CN/scripts/34358-soraka';
const JQUERY_URL = 'https://code.jquery.com/jquery-latest.min.js';

// load script message
const LOAD_SCRIPT_LOADING = '正在加载脚本...';
const LOAD_SCRIPT_FAILURE = '脚本加载失败，请刷新重试...';
const LOAD_SCRIPT_SUCCESS = '脚本加载完成...';

const NOT_SUPPORT_PAGE = '不支持非视频页面，请自行解决';

// check version message
const CHECK_VERSION_LOADING = '正在进行脚本版本检查...';
const CHECK_VERSION_FAILURE = '脚本版本检查失败，请刷新重试...';
const NOT_LAST_VERSION = (current, last) => `当前版本为 v${current}，最新版本为 v${last}，请<a href='${SCRIPT_URL}'>点击更新</a>...`;
const IS_LAST_VERSION = (current) => `当前版本为 v${current}，无需更新...`;

// course message
const LOAD_CHAPTERS_INFO = '正在获取章节信息...';
const JUMP_TO_LAST_CHAPTER = '正在跳转到最新章节...';
const LOAD_CHAPTERS_VIDEO_INFO = '正在获取章节视频信息...';
const LOAD_CHAPTERS_QUESTION_INFO = '正在获取视频问题信息...';
const BEGIN_WATCH_CHAPTER_VIDEO = (title, duration) => `开始自动观看视频: ${title}，时长: ${duration}s`;
const END_WATCH_CHAPTER_VIDEO = (title, duration) => `完成自动观看视频: ${title}`;
const WATCH_CHAPTER_VIDEO_PROGRESS = (progress, percentum) => `观看进度: ${progress} ${percentum}%`;
const AUTO_ANSWER_QUESTION = (question) => `自动回答视频问题: ${question}`;
const ALERT_CHAPTER_TEST = '已完成自动观看，请完成章节测试';

const NETWORK_ERROR = '网络错误，请刷新重试';

class Soraka {
  constructor() {
    this.iframe = null;
    this.config = {};
    this.logger = new Logger({
      prefix: 'Soraka',
      repo: GM_info.script.namespace,
    });

    this.script = document.createElement('script');
    this.script.src = JQUERY_URL;
    this.script.onload = this.onload.bind(this);
  }

  init() {
    let times = 0;
    let id = setInterval(() => {
      if (times >= 30) {
        clearInterval(id);
        this.logger.info('loading', LOAD_SCRIPT_FAILURE);
        alert(LOAD_SCRIPT_FAILURE);
      } else {
        times ++;
      }

      this.logger.info('loading', LOAD_SCRIPT_LOADING);
      try {
        let wrapper = document.querySelector('#iframe').contentWindow.document.body;
        this.iframe = wrapper.querySelector('iframe').contentWindow;

        if (this.iframe.data && this.iframe.data.read) {
          clearInterval(id);
          this.logger.info('loading', NOT_SUPPORT_PAGE);
        }

        if (this.iframe.config) {
          clearInterval(id);
          document.head.append(this.script);
          this.logger.info('loading', LOAD_SCRIPT_SUCCESS);
        }
      } catch (e) {}
    }, 500);
  }

  checkVersion() {
    const current = GM_info.script.version;
    this.logger.info('version', CHECK_VERSION_LOADING);
    return new Promise(resolve => {
      $.ajax({
        url: `${RAW_HOST}/package.json`,
        success: data => {
          const info = JSON.parse(data);
          const last = info.version;
          if (current >= last) {
            this.logger.info('version', IS_LAST_VERSION(current));
          } else {
            this.logger.info('version', NOT_LAST_VERSION(current, last));
          }
          resolve();
        },
        error: _ => {
          this.logger.info('version', CHECK_VERSION_FAILURE);
        }
      });
    });
  }

  getStatus(objectid) {
    var k = this.iframe.getCookie('fid') || '';
    var _dc = Date.now();
    const url = `${API_HOST}/ananas/status/${objectid}?k=${k}&_dc=${_dc}`;

    this.logger.info('status', LOAD_CHAPTERS_VIDEO_INFO);
    return new Promise(resolve => {
      $.ajax({
        url,
        success: data => resolve(data),
        error: _ => alert(NETWORK_ERROR),
      });
    });
  }

  getQuestion(mid) {
    const url = `${API_HOST}/richvideo/initdatawithviewer?&start=undefined&mid=${mid}`;

    this.logger.info('status', LOAD_CHAPTERS_QUESTION_INFO);
    return new Promise(resolve => {
      $.ajax({
        url,
        success: data => {
          const datas = (data && data[0]) ? data[0].datas : [];
          resolve(datas);
        },
        error: _ => alert(NETWORK_ERROR),
      });
    });
  }

  getConfig() {
    const settings = this.iframe.parent.AttachmentSetting;
    const config = {
      mid: this.iframe.config('mid'),
      objectId: this.iframe.config('objectid'),
      clazzId: settings.defaults.clazzId,
      userid: settings.defaults.userid,
      knowledgeid: settings.defaults.knowledgeid,
      courseid: settings.defaults.courseid,
      otherInfo: settings.attachments[0].otherInfo,
      jobid: settings.attachments[0].jobid,
    };

    return Promise.all([
      this.getStatus(config.objectId),
      this.getQuestion(config.mid),
    ]).then(data => {
      const status = data[0];
      config.duration = status.duration;
      config.dtoken = status.dtoken;

      const questions = data[1];
      config.questions = questions;

      this.config = Object.assign(this.config, config);
    });
  }

  getChapters() {
    const url = $('.goback a').attr('href');
    this.logger.info('status', LOAD_CHAPTERS_INFO);

    return new Promise(resolve => {
      $.ajax({
        url,
        success: data => {
          const $dom = $(data);
          const $chapters = $dom.find('.leveltwo');

          const chapters = $chapters.map((i, el) => {
            const $link = $(el).find('.articlename a');
            const $number = $(el).find('span.icon');
            if ($link.attr('href')) {
              return {
                number: $number.text().replace(/\s+/g, ' ').trim().split(' ')[0],
                title: $link.attr('title'),
                href: $link.attr('href'),
              };
            }
          }).toArray();
          resolve(chapters);
        },
        error: _ => alert(NETWORK_ERROR),
      });
    });
  }

  jumpToLastChapter() {
    return this.getChapters().then(chapters => {
      const lastActiveChapter = chapters.pop();
      this.config.chapter = lastActiveChapter;

      const last = API_HOST + lastActiveChapter.href;
      const current = window.location.href;

      if (last !== current) {
        this.logger.info('status', JUMP_TO_LAST_CHAPTER);
        window.location.replace(last);
        return false;
      }
      return true;
    });
  }

  answerVideoQuestion(question) {
    const randomId = Math.floor(Math.random() * question.options.length);
    if (!question.options[randomId].isRight) {
      const resourceid = question.resourceId;
      const answer = question.options[randomId].name;
      const url = `${API_HOST}/richvideo/qv?resourceid=${resourceid}&answer='${answer}'`;
      $.ajax({
        url,
        success: _ => {
          this.logger.info('status', AUTO_ANSWER_QUESTION(question.description));
        }
      });
    }
  }

  encodeEnc(playingTime) {
    // player.swf: com.chaoxing.player.comp.ExternalComp:L235
    const salt = 'd_yHJ!$pdA~5';

    const { clazzId, userid, jobid, objectId, duration } = this.config;
    const playingSecond = playingTime * 1000;
    const duration1000 = duration * 1000;
    let encStr = `[${clazzId}]`;
    encStr += `[${userid}]`;
    encStr += `[${jobid}]`;
    encStr += `[${objectId}]`;
    encStr += `[${playingSecond}]`;
    encStr += `[${salt}]`;
    encStr += `[${duration1000}]`;
    encStr += `[0_${duration}]`;

    return MD5(encStr);
  }

  sendVideoLog(playingTime) {
    const { dtoken, userid, jobid, objectId, duration, otherInfo, clazzId } = this.config;

    let url = API_HOST + `/multimedia/log/${dtoken}`;
    url += `?userid=${userid}`;
    url += `&rt=0.9`;
    url += `&jobid=${jobid}`;
    url += `&objectId=${objectId}`;
    url += `&dtype=Video`;
    url += `&clipTime=0_${duration}`;
    url += `&otherInfo=${otherInfo}`;
    url += `&clazzId=${clazzId}`;
    url += `&duration=${duration}`;
    url += `&view=pc`;
    url += `&playingTime=${playingTime}`;
    url += `&isdrag=3`;
    url += `&enc=` + this.encodeEnc(playingTime);

    return new Promise(resolve => {
      $.ajax({
        url,
        dataType: 'json',
        success: data => resolve(data),
        error: _ => alert(NETWORK_ERROR),
      });
    });
  }

  watchVideo() {
    let now = 0;
    let count = 0;
    const loopStep = 5;
    const logStep = 120;
    const { duration, questions, chapter } = this.config;

    this.logger.info('status', BEGIN_WATCH_CHAPTER_VIDEO(chapter.title, duration));

    const finishWatch = () => {
      this.logger.info('status', END_WATCH_CHAPTER_VIDEO(chapter.title));

      const progressBar = '|' + '█'.repeat(50) + '|';
      this.logger.info('progress', WATCH_CHAPTER_VIDEO_PROGRESS(progressBar, 100));
    };

    return new Promise(resolve => {
      (function loop(res) {
        if (now >= duration) {
          this.sendVideoLog(duration).then(_ => {
            finishWatch();
            resolve();
          });
        }

        for(let i = 0; i < questions.length; i++) {
          if (now >= questions[i].startTime) {
            const question = questions.shift();
            now = question.startTime;
            this.answerVideoQuestion(question);
            break;
          }
        }

        new Promise(_resolve => {
          const percentum = Math.floor(now / duration * 100);
          const progress = Math.floor(percentum / 2);
          const progressBar = '|' + '█'.repeat(progress) + '░'.repeat(50 - progress) + '|';
          this.logger.info('progress', WATCH_CHAPTER_VIDEO_PROGRESS(progressBar, percentum));

          if (count === logStep || now === 0) {
            count = 0;
            this.sendVideoLog(now).then(res => {
              if (res && res.isPassed) {
                finishWatch();
                resolve();
              } else {
                setTimeout(_ => _resolve(), loopStep * 1000);
              }
            });
          } else {
            setTimeout(_ => _resolve(), loopStep * 1000);
          }
        }).then(loop.bind(this));

        count += loopStep;
        now += loopStep;
      }).call(this);
    });
  }

  jumpToChapterTest() {
    const $testBtn = $('#dct2');
    $testBtn.click();
    setTimeout(_ => {
      alert(ALERT_CHAPTER_TEST);
    }, 500);
  }

  onload() {
    this.checkVersion()
      .then(this.jumpToLastChapter.bind(this))
      .then(isLast => {
        if (isLast) {
          this.getConfig().then(_ => {
            this.watchVideo().then(_ => {
              this.jumpToChapterTest();
            });
          });
        }
      });
  }
}

const soraka = new Soraka();
soraka.init();

////////////////////////////////////////////////////////////////////////
//                            MD5 Library                             //
////////////////////////////////////////////////////////////////////////

function MD5(r){function n(r,n){var t,o,e,u,f;return e=2147483648&r,u=2147483648&n,t=1073741824&r,o=1073741824&n,f=(1073741823&r)+(1073741823&n),t&o?2147483648^f^e^u:t|o?1073741824&f?3221225472^f^e^u:1073741824^f^e^u:f^e^u}function t(r,t,o,e,u,f,a){return r=n(r,n(n(t&o|~t&e,u),a)),n(r<<f|r>>>32-f,t)}function o(r,t,o,e,u,f,a){return r=n(r,n(n(t&e|o&~e,u),a)),n(r<<f|r>>>32-f,t)}function e(r,t,o,e,u,f,a){return r=n(r,n(n(t^o^e,u),a)),n(r<<f|r>>>32-f,t)}function u(r,t,o,e,u,f,a){return r=n(r,n(n(o^(t|~e),u),a)),n(r<<f|r>>>32-f,t)}function f(r){var n,t="",o="";for(n=0;3>=n;n++)o=r>>>8*n&255,o="0"+o.toString(16),t+=o.substr(o.length-2,2);return t}var a,i,C,c,g,h,d,v,S=[];for(r=function(r){r=r.replace(/\r\n/g,"\n");for(var n="",t=0;t<r.length;t++){var o=r.charCodeAt(t);128>o?n+=String.fromCharCode(o):(o>127&&2048>o?n+=String.fromCharCode(o>>6|192):(n+=String.fromCharCode(o>>12|224),n+=String.fromCharCode(o>>6&63|128)),n+=String.fromCharCode(63&o|128))}return n}(r),S=function(r){var n,t=r.length;n=t+8;for(var o=16*((n-n%64)/64+1),e=Array(o-1),u=0,f=0;t>f;)n=(f-f%4)/4,u=f%4*8,e[n]|=r.charCodeAt(f)<<u,f++;return n=(f-f%4)/4,e[n]|=128<<f%4*8,e[o-2]=t<<3,e[o-1]=t>>>29,e}(r),g=1732584193,h=4023233417,d=2562383102,v=271733878,r=0;r<S.length;r+=16)a=g,i=h,C=d,c=v,g=t(g,h,d,v,S[r+0],7,3614090360),v=t(v,g,h,d,S[r+1],12,3905402710),d=t(d,v,g,h,S[r+2],17,606105819),h=t(h,d,v,g,S[r+3],22,3250441966),g=t(g,h,d,v,S[r+4],7,4118548399),v=t(v,g,h,d,S[r+5],12,1200080426),d=t(d,v,g,h,S[r+6],17,2821735955),h=t(h,d,v,g,S[r+7],22,4249261313),g=t(g,h,d,v,S[r+8],7,1770035416),v=t(v,g,h,d,S[r+9],12,2336552879),d=t(d,v,g,h,S[r+10],17,4294925233),h=t(h,d,v,g,S[r+11],22,2304563134),g=t(g,h,d,v,S[r+12],7,1804603682),v=t(v,g,h,d,S[r+13],12,4254626195),d=t(d,v,g,h,S[r+14],17,2792965006),h=t(h,d,v,g,S[r+15],22,1236535329),g=o(g,h,d,v,S[r+1],5,4129170786),v=o(v,g,h,d,S[r+6],9,3225465664),d=o(d,v,g,h,S[r+11],14,643717713),h=o(h,d,v,g,S[r+0],20,3921069994),g=o(g,h,d,v,S[r+5],5,3593408605),v=o(v,g,h,d,S[r+10],9,38016083),d=o(d,v,g,h,S[r+15],14,3634488961),h=o(h,d,v,g,S[r+4],20,3889429448),g=o(g,h,d,v,S[r+9],5,568446438),v=o(v,g,h,d,S[r+14],9,3275163606),d=o(d,v,g,h,S[r+3],14,4107603335),h=o(h,d,v,g,S[r+8],20,1163531501),g=o(g,h,d,v,S[r+13],5,2850285829),v=o(v,g,h,d,S[r+2],9,4243563512),d=o(d,v,g,h,S[r+7],14,1735328473),h=o(h,d,v,g,S[r+12],20,2368359562),g=e(g,h,d,v,S[r+5],4,4294588738),v=e(v,g,h,d,S[r+8],11,2272392833),d=e(d,v,g,h,S[r+11],16,1839030562),h=e(h,d,v,g,S[r+14],23,4259657740),g=e(g,h,d,v,S[r+1],4,2763975236),v=e(v,g,h,d,S[r+4],11,1272893353),d=e(d,v,g,h,S[r+7],16,4139469664),h=e(h,d,v,g,S[r+10],23,3200236656),g=e(g,h,d,v,S[r+13],4,681279174),v=e(v,g,h,d,S[r+0],11,3936430074),d=e(d,v,g,h,S[r+3],16,3572445317),h=e(h,d,v,g,S[r+6],23,76029189),g=e(g,h,d,v,S[r+9],4,3654602809),v=e(v,g,h,d,S[r+12],11,3873151461),d=e(d,v,g,h,S[r+15],16,530742520),h=e(h,d,v,g,S[r+2],23,3299628645),g=u(g,h,d,v,S[r+0],6,4096336452),v=u(v,g,h,d,S[r+7],10,1126891415),d=u(d,v,g,h,S[r+14],15,2878612391),h=u(h,d,v,g,S[r+5],21,4237533241),g=u(g,h,d,v,S[r+12],6,1700485571),v=u(v,g,h,d,S[r+3],10,2399980690),d=u(d,v,g,h,S[r+10],15,4293915773),h=u(h,d,v,g,S[r+1],21,2240044497),g=u(g,h,d,v,S[r+8],6,1873313359),v=u(v,g,h,d,S[r+15],10,4264355552),d=u(d,v,g,h,S[r+6],15,2734768916),h=u(h,d,v,g,S[r+13],21,1309151649),g=u(g,h,d,v,S[r+4],6,4149444226),v=u(v,g,h,d,S[r+11],10,3174756917),d=u(d,v,g,h,S[r+2],15,718787259),h=u(h,d,v,g,S[r+9],21,3951481745),g=n(g,a),h=n(h,i),d=n(d,C),v=n(v,c);return(f(g)+f(h)+f(d)+f(v)).toLowerCase()}
