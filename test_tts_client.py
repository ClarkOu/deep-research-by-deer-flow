import os
import logging
import base64
from dotenv import load_dotenv

# 确保可以导入 src 下的模块
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.'))) # 将当前目录（deer-flow-main）添加到sys.path

from src.podcast.graph.tts_node import _create_tts_client # 从您的项目中导入函数
from src.tools.tts import VolcengineTTS # 确保这个导入路径正确

# 配置日志记录，以便看到 tts_node.py 中的 logger 输出
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main_test():
    # 加载 .env 文件中的环境变量
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env')) # 指定.env文件路径

    logger.info("开始测试 TTS 客户端创建和语音合成...")

    try:
        # 1. 测试创建 TTS 客户端
        logger.info("尝试创建 TTS 客户端...")
        tts_client = _create_tts_client()
        
        if tts_client:
            logger.info(f"TTS 客户端创建成功。使用的音色: {tts_client.voice_type}")

            # 2. 测试语音合成
            test_text = "你好，这是一个使用从项目中加载的配置进行的语音合成测试。"
            logger.info(f"尝试合成文本: '{test_text}'")
            
            result = tts_client.text_to_speech(test_text, speed_ratio=1.0) # 您可以调整 speed_ratio

            if result and result.get("success"):
                logger.info("语音合成成功！")
                audio_data_base64 = result.get("audio_data")
                if audio_data_base64:
                    audio_chunk = base64.b64decode(audio_data_base64)
                    output_filename = "test_tts_client_output.mp3"
                    with open(output_filename, "wb") as f:
                        f.write(audio_chunk)
                    logger.info(f"测试音频文件已保存为: {output_filename}")
                    # 您可以尝试播放这个文件
                    # 在 macOS 上: os.system(f"afplay {output_filename}")
                else:
                    logger.error("语音合成成功，但未返回音频数据。")
            else:
                error_message = result.get("error", "未知错误") if result else "未知错误"
                logger.error(f"语音合成失败: {error_message}")
        else:
            logger.error("TTS 客户端创建失败。")

    except Exception as e:
        logger.error(f"测试过程中发生异常: {e}", exc_info=True)

if __name__ == "__main__":
    main_test()