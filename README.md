# 这是来自字节跳动的开源项目deerflow

学习中：
我在使用原有的项目代码的过程中无法直接运行，使用GitHub copilot发现了几个问题：
第一个：项目中使用的组件与环境版本之间有冲突，导致启动会一直报错；
       解决办法：直接手动修改组件版本
第二个：项目中使用PPT组件生成的PPT，导出后无法直接编辑；
       解决办法：重写PPT生成服务，当前使用了一个Python的PPT生成库代替原来的PPT生成服务；
第三个：原有的语音功能无法正常使用，因为原项目把声音的配音音色写死了，而官方没有更新和指引，直接使用apikey是无法正常运行的；
      解决办法：重写语音功能的配置，更换正确的音色（需要到火山引擎官网开通服务）

在原来项目的基础上，使用AI coding修改。根据不同的场景，切换使用Gemini 2.5 Pro和Claude 3.7 sonnet thinking为主

## demo video


https://github.com/user-attachments/assets/ba779601-a422-4dac-9ba3-80ee49d84f3e



## 原项目：
https://github.com/bytedance/deer-flow
