# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import base64
import logging
import os

from src.podcast.graph.state import PodcastState
from src.tools.tts import VolcengineTTS

logger = logging.getLogger(__name__)


def tts_node(state: PodcastState):
    logger.info("Generating audio chunks for podcast...")
    tts_client = _create_tts_client()
    for line in state["script"].lines:
        # tts_client.voice_type = (
        #    "BV002_streaming" if line.speaker == "male" else "BV001_streaming"
        #)
        result = tts_client.text_to_speech(line.paragraph, speed_ratio=1.05)
        if result["success"]:
            audio_data = result["audio_data"]
            audio_chunk = base64.b64decode(audio_data)
            state["audio_chunks"].append(audio_chunk)
        else:
            logger.error(result["error"])
    return {
        "audio_chunks": state["audio_chunks"],
    }


def _create_tts_client():
    app_id = os.getenv("VOLCENGINE_TTS_APPID", "")
    if not app_id:
        raise Exception("VOLCENGINE_TTS_APPID is not set")
    access_token = os.getenv("VOLCENGINE_TTS_ACCESS_TOKEN", "")
    if not access_token:
        raise Exception("VOLCENGINE_TTS_ACCESS_TOKEN is not set")
    cluster = os.getenv("VOLCENGINE_TTS_CLUSTER", "volcano_tts")
    #voice_type = "BV001_streaming"
    # 从环境变量读取音色，如果未设置，则使用 "BV001_streaming" 作为后备默认值
    voice_type = os.getenv("VOLCENGINE_TTS_VOICE_TYPE", "BV001_streaming")
    if not voice_type: # 如果环境变量设置了但为空字符串，也使用后备默认值
        logger.warning("VOLCENGINE_TTS_VOICE_TYPE is set but empty, defaulting to BV001_streaming.")
        voice_type = "BV001_streaming"
        
    logger.info(f"Initializing TTS client with voice_type: {voice_type}")
    return VolcengineTTS(
        appid=app_id,
        access_token=access_token,
        cluster=cluster,
        voice_type=voice_type,
    )
