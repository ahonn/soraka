// ==UserScript==
// @name         Soraka
// @namespace    http://tampermonkey.net/
// @version      0.4.0
// @description  超星 Mooc 视频助手 for Tampermonkey
// @author       Ahonn <ahonn95@outlook.com>
// @match        https://mooc1-2.chaoxing.com/mycourse/studentstudy?*
// @grant        none
// @connect     raw.githubusercontent.com
// @connect     greasyfork.org
// ==/UserScript==

class Soraka {
  constructor() {
    this.iframe = null;
    this.chapter = null;
    this.config = {};
    this.host = 'https://mooc1-2.chaoxing.com';

    this.script = document.createElement('script');
    this.script.src = "//code.jquery.com/jquery-latest.min.js";
    this.script.onload = this.load;

    window.soraka = this;
  }

  /**
   * 初始化脚本，当视频 iframe 加载完毕时加载脚本
   * (通过视频 iframe 下是否含有 config 方法判断)
   *
   * @returns {undefined}
   */
  init() {
    var times = 0;
    var id = setInterval(() => {
      // 超过 30 秒取消定时器，避免死循环
      if (times >= 30) {
        clearInterval(id);
        alert('加载失败，请刷新重试...');
      } else {
        times ++;
      }

      try {
        // 获取内容 iframe body
        var wrapper = window.iframe.contentWindow.document.body;
        // 获取视频 iframe window 对象，并保持到 this.iframe 中
        this.iframe = wrapper.getElementsByTagName('iframe')[0].contentWindow;

        this.info('正在加载脚本...');
        if (this.iframe.config !== undefined) {
          clearInterval(id);
          document.head.append(this.script);

          this.info('脚本加载完成...');
        }
      } catch (e) {}
    }, 500);
  }

  /**
   * 格式化日志输出
   * 
   * @param {string} message 日志文字
   */
  info(message) {
    console.info(`Soraka: ${message}`);
  }

  /**
   * 获取 dtoken 与 duration 参数，用于后面的请求
   *
   * @returns {promise}
   */
  getStatus(objectid) {
    var k = this.iframe.getCookie('fid') || '';
    var _dc = Date.now();
    const url = `${this.host}/ananas/status/${objectid}?k=${k}&_dc=${_dc}`;

    this.info('正在获取课程信息...');
    return new Promise(resolve => {
      $.ajax({
        url,
        success: data => resolve(data),
      });
    });
  }

  /**
   * 获取视频问题的具体内容
   *
   * @param {string} mid mid 通过 this.iframe.config 获取
   * @returns {promise}
   */
  getQuestion(mid) {
    const url = `${this.host}/richvideo/initdatawithviewer?&start=undefined&mid=${mid}`;
    return new Promise(resolve => {
      $.ajax({
        url,
        success: data => {
          const datas = (data & data[0]) ? data[0].datas : [];
          resolve(datas);
        },
      });
    });
  }

  /**
   * 获取当前能够观看的所有章节
   *
   * @returns {promise}
   */
  getChapters() {
    const url = $('.goback a').attr('href');
    return new Promise(resolve => {
      $.ajax({
        url,
        success: data => {
          const $dom = $(data);
          const $chapters = $dom.find('.leveltwo');

          const chapters = $chapters.map((i, el) => {
            const $link = $(el).find('.articlename a');
            if ($link.attr('href')) {
              return {
                number: $(el).find('span.icon').text().replace(/\s+/g, ' ').trim().split(' ')[0],
                title: $link.attr('title'),
                href: $link.attr('href'),
              };
            }
          }).toArray();
          resolve(chapters);
        },
      });
    });
  }

  /**
   * 跳转到最新的章节
   *
   * @returns {boolean} 是否跳转到最新的章节
   */
  jumpToLastChapter() {
    return this.getChapters().then(chapters => {
      const lastActiveChapter = this.chapter = chapters.pop();

      const last = this.host + lastActiveChapter.href;
      const current = window.location.href;

      if (last !== current) {
        this.info('正在跳转到最新课程...');
        window.location.replace(last);
        return false;
      }
      this.number = lastActiveChapter.number;
      return true;
    });
  }

  /**
   * 回答视频问题，随机选择答案
   * (当回答错误时将会发生请求，为了模拟正常操作，答案随机)
   *
   * @param {object} question 获取的问题详情
   * @returns {undefined}
   */
  answerVideoQuestion(question) {
    const randomId = Math.floor(Math.random() * question.options.length);
    // 回答错误时发送请求
    if (!question.options[randomId].isRight) {
      const resourceid = question.resourceId;
      const answer = question.options[randomId].name;
      const url = `https://mooc1-2.chaoxing.com/richvideo/qv?resourceid=${resourceid}&answer='${answer}'`;
      $.ajax({
        url,
        success: _ => this.info(`自动回答问题【${question.description}】`),
      });
    }
  }

  /**
   * 生成视频心跳请求中的 enc 参数
   *
   * @param {number} playingTime 视频播放时长
   * @returns {string} 加密字符串
   */
  encodeEnc(playingTime) {
    // 反编译 player.swf 文件，加密字符串位于: com.chaoxing.player.comp.ExternalComp:L235
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

  /**
   * 观看视频时发送的心跳请求
   *
   * @param {number} playingTime 视频播放时长
   * @returns {promise}
   */
  sendVideoLog(playingTime) {
    const { dtoken, userid, jobid, objectId, duration, otherInfo, clazzId } = this.config;

    let url = this.host + `/multimedia/log/${dtoken}`;
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
      const percentum = Math.floor(playingTime / duration * 100);
      this.info(`正在自动观看【${this.chapter.title}】${percentum}% `);
      $.ajax({
        url,
        dataType: 'json',
        success: data => resolve(data),
      });
    });
  }

  /**
   * 自动观看视频，定时发送 log 请求
   *
   * @returns {promise}
   */
  watchVideo() {
    let now = 0;
    const { duration } = this.config;
    const { questions } = this.config;

    this.info(`开始自动观看【${this.chapter.title}】`);
    return new Promise(resolve => {
      (function loop(res) {
        // 视频观看完毕时执行下一个部分
        if (now >= duration) {
          this.sendVideoLog(duration).then(_ => {
            this.info(`完成自动观看【${this.chapter.title}】`);
            resolve();
          });
          return;
        }

        // 当到达视频问题的时间点时，回答视频问题，并发送心跳请求
        // 将当前播放时间调整为弹出问题时的时间
        for(let i = 0; i < questions.length; i++) {
          if (now >= questions[i].startTime) {
            const question = questions.shift();
            now = question.startTime;
            this.answerVideoQuestion(question);
            break;
          }
        }

        // 发送心跳请求
        // 当前部分之前看过时，间隔 5 秒发送新请求
        // 当前部分之前未看过时，间隔 120 秒发送请求
        new Promise(_resolve => {
          this.sendVideoLog(now)
            .then(res => {
              if (res && res.isPassed) {
                this.info(`完成自动观看【${this.chapter.title}】`);
                resolve();
              } else {
                setTimeout(_ => _resolve(res), 120 * 1000);
              }
            });
        }).then(loop.bind(this));

        now += 120;
      }).call(this);
    });
  }

  /**
   * 获取课后作业相关参数
   *
   * @returns {promise}
   */
  getHomeWorkConfig() {
    const { clazzId, courseid, knowledgeid } = this.config;
    const url = `${this.host}/knowledge/cards?clazzid=${clazzId}&courseid=${courseid}&knowledgeid=${knowledgeid}&num=1&v=20160407-1`;
    return new Promise(resolve => {
      $.ajax({
        url,
        success: data => resolve(data),
      });
    }).then(data => {
      // 获取 script 中定义参数的语句，执行
      const argsDefine = $(data)[19].innerText.split("\n")[6];
      let mArg = null;
      eval(argsDefine);

      this.config.work = mArg.attachments[0];
      this.config.work.workid = this.config.work.property.workid;
      this.config.work.utEnc = window.utEnc;
      return this.config;
    });
  }

  /**
   * 完成课后作业
   * (获取课后作业 iframe，获取问题并自动作答)
   *
   * @returns {promise}
   */
  doHomeWork() {
    this.getHomeWorkConfig()
      .then(config => {
        const { knowledgeid, clazzId, courseid } = config;
        const { jobid, workid, utEnc, enc } = config.work;
        const url = `https://mooc1-2.chaoxing.com/api/work?api=1&workId=${workid}&jobid=${jobid}&needRedirect=true&knowledgeid=${knowledgeid}&ut=s&clazzId=${clazzId}&type=&enc=${enc}&utEnc=${utEnc}&courseid=${courseid}`;

        $.ajax({
          url,
          success: data => {
            const $data = $(data);
            config.work.problemId = $data.find('input[name^=answertype]').map((i, el) => {
              return $(el).attr('name').match(/\d+$/)[0];
            }).toArray();
            const answerwqbid = config.work.problemId.join(',') + ',';
            const answer = Answer[this.number];

            const $form = $data.find("#form1");
            $form.find('input#answerwqbid').val(answerwqbid);
            config.work.problemId.forEach((el, i) => {
              const thisAns = answer[i];
              $form.find(`input[name=answer${el}][value=${thisAns}]`).prop('checked', true);
            });

            const postData = $form.serialize();

            $.ajax({
              url: '/work/' + $form.attr('action'),
              type: $form.attr('method'),
              data: postData,
              success: data => {
                console.log(data);
              },
            });
          },
        });
      });
  }

  /**
   * 当脚本加载道页面后执行脚本内容
   *
   * @returns {undefined}
   */
  load() {
    // 获取 soraka 对象，该函数在 script 标签中，上下文不在对象内
    const self = window.soraka;

    // 从页面中获取需要的参数
    const settings = self.iframe.parent.AttachmentSetting;
    const config = self.config = {
      mid: self.iframe.config('mid'),
      objectId: self.iframe.config('objectid'),
      clazzId: settings.defaults.clazzId,
      userid: settings.defaults.userid,
      knowledgeid: settings.defaults.knowledgeid,
      courseid: settings.defaults.courseid,
      otherInfo: settings.attachments[0].otherInfo,
      jobid: settings.attachments[0].jobid,
    };

    self.jumpToLastChapter()
      .then((isLast) => {
        if (isLast) {
          Promise.all([
            self.getQuestion(config.mid),
            self.getStatus(config.objectId),
          ]).then(data => {
            const questions = data[0];
            config.questions = questions;

            const status = data[1];
            config.duration = status.duration;
            config.dtoken = status.dtoken;
          }).then(_ => {
            self.watchVideo()
              .then(_ => {
                // if (self.config.courseid == '200311273') {
                  // self.doHomeWork();
                // }
                alert('自动观看完毕，请完成章节测试～');
              });
          });
        }
      });
  }
}

const soraka = new Soraka();
soraka.init();

////////////////////////////////////////////////////////////////////////
//                          Homework Answer                           //
////////////////////////////////////////////////////////////////////////
// const Answer = {
  // '1.1': ['D', 'A', 'true'],
  // '1.2': ['C', 'C', 'D', 'true'],
  // '1.3': ['C', 'B', 'true'],
  // '1.4': ['D', 'D', 'false'],
  // '1.5': ['true', 'true'],
  // '1.6': ['C', 'B', 'D'],
  // '2.1': ['D', 'C', 'B'],
  // '2.2': ['B', 'B', 'A'],
  // '2.3': ['B', 'D', 'false'],
  // '2.4': ['C', 'D', 'true'],
  // '2.5': ['D', 'A', 'false'],
  // '2.6': ['C', 'D', 'true'],
  // '2.7': ['D'],
  // '2.8': ['D', 'A', 'true'],
  // '2.9': ['D'],
  // '3.1': ['B', 'D', 'false', 'true'],
  // '3.2': ['D', 'D', 'C', 'true', 'false'],
  // '3.3': ['B', 'C', 'D', 'true'],
  // '3.4': ['C', 'B', 'false'],
  // '3.5': ['D', 'true', 'false'],
  // '3.6': ['A', 'C', 'true', 'true'],
  // '3.7': ['true'],
  // '4.1': ['B', 'true', 'true'],
  // '4.2': ['B', 'D', 'false'],
  // '4.3': ['C', 'false', 'true'],
  // '4.4': ['D', 'D', 'true'],
  // '4.5': ['true', 'true'],
// };



////////////////////////////////////////////////////////////////////////
//                            MD5 Library                             //
////////////////////////////////////////////////////////////////////////

function MD5(r){function n(r,n){var t,o,e,u,f;return e=2147483648&r,u=2147483648&n,t=1073741824&r,o=1073741824&n,f=(1073741823&r)+(1073741823&n),t&o?2147483648^f^e^u:t|o?1073741824&f?3221225472^f^e^u:1073741824^f^e^u:f^e^u}function t(r,t,o,e,u,f,a){return r=n(r,n(n(t&o|~t&e,u),a)),n(r<<f|r>>>32-f,t)}function o(r,t,o,e,u,f,a){return r=n(r,n(n(t&e|o&~e,u),a)),n(r<<f|r>>>32-f,t)}function e(r,t,o,e,u,f,a){return r=n(r,n(n(t^o^e,u),a)),n(r<<f|r>>>32-f,t)}function u(r,t,o,e,u,f,a){return r=n(r,n(n(o^(t|~e),u),a)),n(r<<f|r>>>32-f,t)}function f(r){var n,t="",o="";for(n=0;3>=n;n++)o=r>>>8*n&255,o="0"+o.toString(16),t+=o.substr(o.length-2,2);return t}var a,i,C,c,g,h,d,v,S=[];for(r=function(r){r=r.replace(/\r\n/g,"\n");for(var n="",t=0;t<r.length;t++){var o=r.charCodeAt(t);128>o?n+=String.fromCharCode(o):(o>127&&2048>o?n+=String.fromCharCode(o>>6|192):(n+=String.fromCharCode(o>>12|224),n+=String.fromCharCode(o>>6&63|128)),n+=String.fromCharCode(63&o|128))}return n}(r),S=function(r){var n,t=r.length;n=t+8;for(var o=16*((n-n%64)/64+1),e=Array(o-1),u=0,f=0;t>f;)n=(f-f%4)/4,u=f%4*8,e[n]|=r.charCodeAt(f)<<u,f++;return n=(f-f%4)/4,e[n]|=128<<f%4*8,e[o-2]=t<<3,e[o-1]=t>>>29,e}(r),g=1732584193,h=4023233417,d=2562383102,v=271733878,r=0;r<S.length;r+=16)a=g,i=h,C=d,c=v,g=t(g,h,d,v,S[r+0],7,3614090360),v=t(v,g,h,d,S[r+1],12,3905402710),d=t(d,v,g,h,S[r+2],17,606105819),h=t(h,d,v,g,S[r+3],22,3250441966),g=t(g,h,d,v,S[r+4],7,4118548399),v=t(v,g,h,d,S[r+5],12,1200080426),d=t(d,v,g,h,S[r+6],17,2821735955),h=t(h,d,v,g,S[r+7],22,4249261313),g=t(g,h,d,v,S[r+8],7,1770035416),v=t(v,g,h,d,S[r+9],12,2336552879),d=t(d,v,g,h,S[r+10],17,4294925233),h=t(h,d,v,g,S[r+11],22,2304563134),g=t(g,h,d,v,S[r+12],7,1804603682),v=t(v,g,h,d,S[r+13],12,4254626195),d=t(d,v,g,h,S[r+14],17,2792965006),h=t(h,d,v,g,S[r+15],22,1236535329),g=o(g,h,d,v,S[r+1],5,4129170786),v=o(v,g,h,d,S[r+6],9,3225465664),d=o(d,v,g,h,S[r+11],14,643717713),h=o(h,d,v,g,S[r+0],20,3921069994),g=o(g,h,d,v,S[r+5],5,3593408605),v=o(v,g,h,d,S[r+10],9,38016083),d=o(d,v,g,h,S[r+15],14,3634488961),h=o(h,d,v,g,S[r+4],20,3889429448),g=o(g,h,d,v,S[r+9],5,568446438),v=o(v,g,h,d,S[r+14],9,3275163606),d=o(d,v,g,h,S[r+3],14,4107603335),h=o(h,d,v,g,S[r+8],20,1163531501),g=o(g,h,d,v,S[r+13],5,2850285829),v=o(v,g,h,d,S[r+2],9,4243563512),d=o(d,v,g,h,S[r+7],14,1735328473),h=o(h,d,v,g,S[r+12],20,2368359562),g=e(g,h,d,v,S[r+5],4,4294588738),v=e(v,g,h,d,S[r+8],11,2272392833),d=e(d,v,g,h,S[r+11],16,1839030562),h=e(h,d,v,g,S[r+14],23,4259657740),g=e(g,h,d,v,S[r+1],4,2763975236),v=e(v,g,h,d,S[r+4],11,1272893353),d=e(d,v,g,h,S[r+7],16,4139469664),h=e(h,d,v,g,S[r+10],23,3200236656),g=e(g,h,d,v,S[r+13],4,681279174),v=e(v,g,h,d,S[r+0],11,3936430074),d=e(d,v,g,h,S[r+3],16,3572445317),h=e(h,d,v,g,S[r+6],23,76029189),g=e(g,h,d,v,S[r+9],4,3654602809),v=e(v,g,h,d,S[r+12],11,3873151461),d=e(d,v,g,h,S[r+15],16,530742520),h=e(h,d,v,g,S[r+2],23,3299628645),g=u(g,h,d,v,S[r+0],6,4096336452),v=u(v,g,h,d,S[r+7],10,1126891415),d=u(d,v,g,h,S[r+14],15,2878612391),h=u(h,d,v,g,S[r+5],21,4237533241),g=u(g,h,d,v,S[r+12],6,1700485571),v=u(v,g,h,d,S[r+3],10,2399980690),d=u(d,v,g,h,S[r+10],15,4293915773),h=u(h,d,v,g,S[r+1],21,2240044497),g=u(g,h,d,v,S[r+8],6,1873313359),v=u(v,g,h,d,S[r+15],10,4264355552),d=u(d,v,g,h,S[r+6],15,2734768916),h=u(h,d,v,g,S[r+13],21,1309151649),g=u(g,h,d,v,S[r+4],6,4149444226),v=u(v,g,h,d,S[r+11],10,3174756917),d=u(d,v,g,h,S[r+2],15,718787259),h=u(h,d,v,g,S[r+9],21,3951481745),g=n(g,a),h=n(h,i),d=n(d,C),v=n(v,c);return(f(g)+f(h)+f(d)+f(v)).toLowerCase()}
