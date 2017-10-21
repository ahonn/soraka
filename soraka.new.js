// ==UserScript==
// @name         Soraka
// @namespace    https://github.com/ahonn/soraka
// @version      0.4.2
// @description  超星 Mooc 视频助手 for Tampermonkey
// @author       Ahonn <ahonn95@outlook.com>
// @match        https://mooc1-2.chaoxing.com/mycourse/studentstudy?*
// @grant        GM_addStyle
// @connect      raw.githubusercontent.com
// @connect      greasyfork.org
// ==/UserScript==

const API_HOST = 'https://mooc1-2.chaoxing.com';

// Message
const LOAD_SCRIPT_FAILURE = '脚本加载失败，请刷新重试...';

class Console {
  constructor() {
    const html = `
      <div class="console">console</div>
    `;

    document.body.innerHTML += html;
    this.addGlobalStyle();
  }

  addGlobalStyle() {
    GM_addStyle(`
      .console {
        width: 100%;
        height: 100px;
        position: fixed;
        bottom: 0;
        background-color: #eee;
        index: 999;
      }
    `);
  }
}

class Soraka {
  constructor() {
    this.iframe = null;
    this.config = {};
    this.console = new Console();

    this.script = document.createElement('script');
    this.script.src = "//code.jquery.com/jquery-latest.min.js";
    this.script.onload = this.onload.bind(this);
  }

  init() {
    var times = 0;
    var id = setInterval(() => {
      if (times >= 30) {
        clearInterval(id);
        alert(LOAD_SCRIPT_FAILURE);
      } else {
        times ++;
      }

      try {
        var wrapper = window.iframe.contentWindow.document.body;
        this.iframe = wrapper.getElementsByTagName('iframe')[0].contentWindow;

        console.info('正在加载脚本...');
        if (this.iframe.config !== undefined) {
          clearInterval(id);
          document.head.append(this.script);

          console.info('脚本加载完成...');
        }
      } catch (e) {}
    }, 500);
  }

  onload() {
    console.log(this);
  }
}

const soraka = new Soraka();
soraka.init();
