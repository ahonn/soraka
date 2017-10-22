# soraka
超星 Mooc 视频助手脚本

## 功能
- [x] 自动观看视频
- [x] 自动完成视频中的问题
- [ ] 自动完成章节测试（未完成）

## 使用方法
### 自动加载脚本
自动加载脚本需要安装 [tampermonkey](http://tampermonkey.net/)，仅适用于 Chrome, Microsoft Edge, Safari, Opera Next, 和 Firefox。

脚本添加步骤：
- 点击 [Soraka](https://greasyfork.org/zh-CN/scripts/34358-soraka)，并安装脚本
- 开启 Tampermonkey 插件（具体使用方式请自行搜索）

登陆 Mooc 网站，进入到视频页面即可自动观看。
安装该浏览器插件后将自动执行脚本，并检查是否为视频播放页面。若是，则自动观看视频。

**自动观看完成并手动完成章节测试后，请刷新页面。不要点击右侧进入下一个视频！！！**

**注意：该脚本不需要点击播放视频，在自动观看过程中也不会播放视频，脚本执行后视频自动完成**

![](http://ouv0frko5.bkt.clouddn.com/2017-10-22-Jietu20171022-133518.jpg)

(**由于百度文库中的章节测试答案与真实章节测试顺序不符，暂时需要自行手动完成**)

### 手动加载脚本

- 打开浏览器按 F12（MacOs: command + option + i）
- 点击控制台
- 打开 [soraka.js](https://raw.githubusercontent.com/ahonn/soraka/master/soraka.user.js)，并全选复制脚本
- 黏贴到控制台中并回车

**手动加载脚本需要在每次进入视频播放页时重复执行以上步骤**

## 声明
Soraka 脚本仅供学习与交流，出现任何问题概不负责。

对脚本有任何意见或者建议，请在 [Greasy Fork Disscussion](https://greasyfork.org/zh-CN/forum/post/discussion?script=34358) 发起讨论。
或者通过邮件与我（[ahonn95@outlook.com](mailto:ahonn95@outlook.com)）联系。

本脚本遵循 [WTFPL](http://www.wtfpl.net/about/)


