/**
 * 字母音频播放�?
 * 支持26个字母的多种发音
 */
class LetterAudioPlayer {
    constructor() {
        this.audioCache = new Map();
        this.isPlaying = false;
        
        // 字母到音频文件的映射
        this.letterAudioMap = {
            'a': ['a.mp3', 'ae.mp3'],  // 字母名称 A, 音素 /æ/ (ah.mp3 暂时缺失)
            'b': ['b.mp3', 'b_sound.mp3'],  // 字母名称 B, 音素 /b/
            'c': ['c.mp3', 'k.mp3', 's.mp3'],  // 字母名称 C, 音素 /k/, 音素 /s/
            'd': ['d.mp3', 'd_sound.mp3'],  // 字母名称 D, 音素 /d/
            'e': ['e.mp3', 'e_short.mp3', 'e_long.mp3'],  // 字母名称 E, 音素 /e/, 音素 /iː/
            'f': ['f.mp3', 'f_sound.mp3'],  // 字母名称 F, 音素 /f/
            'g': ['g.mp3', 'g_hard.mp3', 'g_soft.mp3'],  // 字母名称 G, 音素 /g/, 音素 /dʒ/
            'h': ['h.mp3', 'h_sound.mp3'],  // 字母名称 H, 音素 /h/
            'i': ['i.mp3', 'i_short.mp3', 'i_long.mp3'],  // 字母名称 I, 音素 /ɪ/, 音素 /aɪ/ (i_long.mp3不存�?
            'j': ['j.MP3', 'dj.MP3'],  // 字母名称 J, 音素 /dʒ/
            'k': ['k.MP3', 'k_sound.MP3'],  // 字母名称 K, 音素 /k/
            'l': ['l.MP3', 'l_sound.MP3'],  // 字母名称 L, 音素 /l/
            'm': ['m.MP3', 'm_sound.MP3'],  // 字母名称 M, 音素 /m/
            'n': ['n.MP3', 'n_sound.MP3'],  // 字母名称 N, 音素 /n/
            'o': ['o.MP3', 'o_a_sound.MP3', 'o_long.MP3'],  // 字母名称 O, 音素 /ɒ/, 音素 /oʊ/ (o_long.MP3不存在)
            'p': ['p.MP3', 'p_sound.MP3'],  // 字母名称 P, 音素 /p/
            'q': ['q.MP3', 'q_sound.MP3'],  // 字母名称 Q, 音素 /k/
            'r': ['r.MP3', 'r_sound.MP3'],  // 字母名称 R, 音素 /r/
            's': ['s.MP3', 's_sound.MP3'],  // 字母名称 S, 音素 /s/
            't': ['t.MP3', 't_sound.MP3'],  // 字母名称 T, 音素 /t/
            'u': ['u.MP3', 'u_sound.MP3', 'u_long.MP3'],   // 字母名称 U, 音素 /ʌ/, 音素 /juː/ (u_long.MP3不存在)
            'v': ['v.MP3', 'v_sound.MP3'],   // 字母名称 V, 音素 /v/
            'w': ['w.MP3', 'w_sound.MP3'],   // 字母名称 W, 音素 /w/
            'x': ['x.MP3', 'x_sound.MP3'],   // 字母名称 X, 音素 /ks/
            'y': ['y.MP3', 'y_sound.MP3'],   // 字母名称 Y, 音素 /j/
            'z': ['z.MP3', 'z_sound.MP3']    // 字母名称 Z, 音素 /z/
        };
        

    }
    
    /**
     * 播放字母的发�?
     * @param {string} letter - 字母 (a-z)
     * @param {number} pronunciationIndex - 发音索引 (0为第一种发�?
     */
    async playLetter(letter, pronunciationIndex = 0) {
        if (this.isPlaying) {

            return;
        }
        
        const lowerLetter = letter.toLowerCase();
        
        if (!this.letterAudioMap[lowerLetter]) {
            console.warn(`No audio mapping found for letter: ${letter}`);
            this.fallbackToSpeechSynthesis(letter);
            return;
        }
        
        const audioFiles = this.letterAudioMap[lowerLetter];
        const audioFile = audioFiles[pronunciationIndex] || audioFiles[0];
        const audioPath = `/audio/letters/${lowerLetter}/${audioFile}`;
        

        
        try {
            await this.playAudioFile(audioPath);
        } catch (error) {
            console.warn(`Failed to play audio file: ${audioPath}`, error);
            this.fallbackToSpeechSynthesis(letter);
        }
    }
    
    /**
     * 播放音频文件
     * @param {string} audioPath - 音频文件路径
     */
    async playAudioFile(audioPath) {
        return new Promise((resolve, reject) => {
            // 检查缓�?
            if (this.audioCache.has(audioPath)) {
                const audio = this.audioCache.get(audioPath);
                this.playAudio(audio, resolve, reject);
                return;
            }
            
            // 创建新的音频对象
            const audio = new Audio(audioPath);
            
            audio.addEventListener('canplaythrough', () => {
                this.audioCache.set(audioPath, audio);
                this.playAudio(audio, resolve, reject);
            }, { once: true });
            
            audio.addEventListener('error', (e) => {
                console.error(`Audio load error for ${audioPath}:`, e);
                reject(e);
            }, { once: true });
            
            audio.load();
        });
    }
    
    /**
     * 播放音频对象
     * @param {HTMLAudioElement} audio - 音频对象
     * @param {Function} resolve - 成功回调
     * @param {Function} reject - 失败回调
     */
    playAudio(audio, resolve, reject) {
        this.isPlaying = true;
        
        const onEnded = () => {
            this.isPlaying = false;
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            resolve();
        };
        
        const onError = (e) => {
            this.isPlaying = false;
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            reject(e);
        };
        
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);
        
        audio.currentTime = 0;
        audio.play().catch(reject);
    }
    
    /**
     * 语音合成回退方案
     * @param {string} letter - 字母
     */
    fallbackToSpeechSynthesis(letter) {
        if (!window.speechSynthesis) {
            console.warn('Speech synthesis not supported');
            return;
        }
        

        
        const utterance = new SpeechSynthesisUtterance(letter);
        utterance.rate = 0.7;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        utterance.lang = 'en-US';
        
        utterance.onstart = () => {
            this.isPlaying = true;
        };
        
        utterance.onend = () => {
            this.isPlaying = false;
        };
        
        utterance.onerror = () => {
            this.isPlaying = false;
            console.error('Speech synthesis error');
        };
        
        window.speechSynthesis.speak(utterance);
    }
    
    /**
     * 获取字母的可用发音数�?
     * @param {string} letter - 字母
     * @returns {number} 发音数量
     */
    getPronunciationCount(letter) {
        const lowerLetter = letter.toLowerCase();
        return this.letterAudioMap[lowerLetter]?.length || 0;
    }
    
    /**
     * 获取字母的所有发音文件名
     * @param {string} letter - 字母
     * @returns {Array} 发音文件名数�?
     */
    getPronunciationFiles(letter) {
        const lowerLetter = letter.toLowerCase();
        return this.letterAudioMap[lowerLetter] || [];
    }
    
    /**
     * 停止当前播放
     */
    stop() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        this.isPlaying = false;
    }
}

// 创建全局实例
window.letterAudioPlayer = new LetterAudioPlayer(); 
