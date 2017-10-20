# soraka
超星 Mooc 视频助手脚本

## 功能
- [x] 自动观看视频
- [x] 自动完成视频中的问题
- [ ] 自动完成课后作业（未完成）

## 使用方法
### 自动加载脚本
自动加载脚本需要安装 [tampermonkey](http://tampermonkey.net/)，仅适用于 Chrome, Microsoft Edge, Safari, Opera Next, 和 Firefox。

脚本添加步骤：
- 打开 [soraka.js](https://raw.githubusercontent.com/ahonn/soraka/master/soraka.js)，并全选复制脚本
- 打开浏览器
- 进入 Tampermonkey 管理界面
- 选择添加脚本
- 将代码粘贴后保存即可

登陆 Mooc 网站，进入到视频页面即可自动观看。
**注意：该脚本不需要点击播放视频，在自动观看过程中也不会播放视频，脚本执行后视频自动完成**

在浏览器中按 F12，点击控制台课查看到以下信息：
![](http://ouv0frko5.bkt.clouddn.com/2017-10-20-Jietu20171020-130934.jpg)

(**由于百度文库中的作业答案与真实课后作业顺序不符，暂时需要自行手动完成**)

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


