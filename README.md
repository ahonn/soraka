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
- 点击 [soraka.js](https://github.com/ahonn/soraka/raw/master/soraka.user.js)，并安装脚本
- 开启 Tampermonkey 插件（具体使用方式请自行搜索）

登陆 Mooc 网站，进入到视频页面即可自动观看。
安装该浏览器插件后将自动执行脚本，并检查是否为视频播放页面。若是，则自动观看视频。

**注意：该脚本不需要点击播放视频，在自动观看过程中也不会播放视频，脚本执行后视频自动完成**

在浏览器中按 F12，点击控制台课查看到以下信息：
![](http://ouv0frko5.bkt.clouddn.com/2017-10-20-Jietu20171020-130934.jpg)

(**由于百度文库中的章节测试答案与真实章节测试顺序不符，暂时需要自行手动完成**)

### 手动加载脚本

- 打开浏览器按 F12
- 点击控制台
- 打开 [soraka.js](https://raw.githubusercontent.com/ahonn/soraka/master/soraka.js)，并全选复制脚本
- 黏贴到控制台中并回车

**手动加载脚本需要在每次进入视频播放页时重复执行以上步骤**

## 声明
Soraka 脚本仅供学习与交流，出现任何问题概不负责。

关于脚本学习交流相关，请联系：[ahonn95@outlook.com](mailto:ahonn95@outlook.com)

本脚本遵循 [WTFPL](http://www.wtfpl.net/about/)


