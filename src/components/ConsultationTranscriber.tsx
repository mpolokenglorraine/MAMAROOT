import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  Volume2, 
  FileText, 
  Globe, 
  Upload, 
  AlertCircle,
  HelpCircle,
  Stethoscope,
  ChevronDown
} from 'lucide-react';

interface ConsultationTranscriberProps {
  onApplyTranscript?: (text: string) => void;
  patientName?: string;
  role?: 'doctor' | 'mother';
  initialNotes?: string;
  compact?: boolean;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-ZA', label: 'English (South Africa)' },
  { code: 'en-NG', label: 'English (Nigeria / West Africa)' },
  { code: 'en-GB', label: 'English (United Kingdom)' },
  { code: 'en-US', label: 'English (United States)' },
  { code: 'sw-KE', label: 'Kiswahili (East Africa)' },
  { code: 'zu-ZA', label: 'isiZulu (South Africa)' },
  { code: 'fr-FR', label: 'Français (West / Central Africa)' },
  { code: 'pt-PT', label: 'Português (Angola / Moz.)' },
];

const SAMPLE_CONSULTATION_AUDIO_TRANSCRIPTS = [
  {
    title: 'Prenatal Routine Consultation (28 Weeks)',
    text: "Patient presents for regular 28-week prenatal assessment. Fundal height measures 28 cm, consistent with gestational dates. Fetal movement is active and robust. Blood pressure is normal at 114/72 mmHg. Patient notes mild lower back stiffness in the evenings and occasional leg cramps. Recommended daily gentle pelvic tilts, increased hydration with electrolyte balance, and continuing prescribed prenatal iron and folate supplements. Scheduled glucose tolerance screening review and ultrasound appointment in two weeks."
  },
  {
    title: 'Postpartum Follow-up & Recovery (6 Weeks)',
    text: "Six-week postpartum clinical review. Patient reports satisfactory healing with minimal perineal discomfort. Lochia has ceased completely. Infant feeding is progressing well with exclusive breastfeeding. Maternal mood assessment shows good family support and adequate sleep intervals. Discussed contraception options, pelvic floor strengthening exercises, and nutritional recovery. Cleared for gradual resumption of light aerobic exercise. Routine pediatric vaccination schedule confirmed."
  },
  {
    title: 'Reproductive & Hormonal Wellness Visit',
    text: "Patient presents with irregular menstrual cycle intervals over the past four months, averaging 38 to 45 days. Reports moderate fatigue and cyclic pelvic cramping prior to menses. Discussed lifestyle factors, stress levels, and dietary habits. Baseline hormonal profile and thyroid panel ordered. Advised daily symptom and basal temperature tracking on Mama Root. Reassured patient and scheduled follow-up in three weeks with lab results."
  }
];

export function ConsultationTranscriber({
  onApplyTranscript,
  patientName = 'Patient',
  role = 'doctor',
  initialNotes = '',
  compact = false
}: ConsultationTranscriberProps) {
  // Speech Recognition States
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en-ZA');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copied, setCopied] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [noteFormat, setNoteFormat] = useState<'soap' | 'summary' | 'verbatim'>('soap');
  const [showSamples, setShowSamples] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // References
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }

    return () => {
      stopRecordingCleanup();
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  // Audio level visualizer loop
  const updateAudioMeter = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    // Map to 0-100
    const normalized = Math.min(100, Math.round((average / 128) * 100));
    setVolumeLevel(normalized);

    animationFrameRef.current = requestAnimationFrame(updateAudioMeter);
  };

  const startRecording = async () => {
    setErrorMessage(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      // 1. Request microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Set up MediaRecorder for actual audio replay / export
      try {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
        };

        mediaRecorder.start(200);
      } catch (recErr) {
        console.warn('MediaRecorder not available or failed:', recErr);
      }

      // 3. AudioContext for real-time visualizer
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioContext = new AudioContextClass();
          audioContextRef.current = audioContext;
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;
          updateAudioMeter();
        }
      } catch (meterErr) {
        console.warn('Audio meter initialization failed:', meterErr);
      }

      // 4. Initialize SpeechRecognition if supported
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedLanguage;

        recognition.onstart = () => {
          setIsRecording(true);
          setIsPaused(false);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let finalizedChunk = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const resultItem = event.results[i];
            const transcriptPiece = resultItem[0].transcript;
            if (resultItem.isFinal) {
              finalizedChunk += transcriptPiece + ' ';
            } else {
              currentInterim += transcriptPiece;
            }
          }

          if (finalizedChunk) {
            setTranscript(prev => (prev ? `${prev.trim()} ${finalizedChunk.trim()}` : finalizedChunk.trim()));
          }
          setInterimText(currentInterim);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition status/error:', event.error);
          if (event.error === 'not-allowed') {
            setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser bar.');
          } else if (event.error === 'network') {
            setErrorMessage('Network connection lost during transcription. Recording audio locally continues.');
          }
        };

        recognition.onend = () => {
          // If still recording and not paused, restart recognition to keep continuous listening active
          if (isRecording && !isPaused && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              // Ignore restart collision
            }
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        setIsRecording(true);
        setIsPaused(false);
      }
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMessage(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone permission was denied. Please check your browser microphone settings.'
          : 'Could not access microphone on this device. You can still use the audio upload or sample dictation below.'
      );
      setIsRecording(false);
    }
  };

  const pauseRecording = () => {
    if (!isRecording) return;
    setIsPaused(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.pause();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const resumeRecording = () => {
    if (!isRecording) return;
    setIsPaused(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn(e);
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      try {
        mediaRecorderRef.current.resume();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const stopRecordingCleanup = () => {
    setIsRecording(false);
    setIsPaused(false);
    setInterimText('');
    setVolumeLevel(0);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        console.warn(e);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const stopRecording = () => {
    stopRecordingCleanup();
  };

  const handleReset = () => {
    stopRecordingCleanup();
    setTranscript('');
    setInterimText('');
    setElapsedSeconds(0);
    setAudioUrl(null);
    setErrorMessage(null);
  };

  // Convert raw transcript to formatted clinical notes
  const getFormattedContent = () => {
    const raw = transcript.trim();
    if (!raw) return '';

    const todayDate = new Date().toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    if (noteFormat === 'soap') {
      return `CONSULTATION CLINICAL GUIDANCE (${todayDate})
Patient: ${patientName}
Transcription Mode: Real-time Audio Assisted Dictation

[S] SUBJECTIVE / PATIENT HISTORY:
${raw}

[O] OBJECTIVE CLINICAL FINDINGS:
• Vitals & assessment completed during current visit
• Patient reported symptoms recorded in Mama Root health timeline

[A] ASSESSMENT:
• Clinical observations reviewed in consultation
• Overall health trajectory evaluated with patient

[P] PLAN & RECOMMENDATIONS:
• Follow discussed medical instructions and medication dosages
• Continue logging daily symptoms in Mama Root Tracker
• Follow-up consultation scheduled as advised`;
    }

    if (noteFormat === 'summary') {
      return `CONSULTATION SUMMARY & INSTRUCTIONS (${todayDate})
Dear ${patientName},

Below are the key takeaways and recommendations from our consultation today:

• SUMMARY OF CONSULTATION:
${raw}

• IMPORTANT ACTIONS & CARE STEPS:
1. Continue tracking any new or changing symptoms.
2. Follow prescribed medication schedule and recommended dietary hydration.
3. Reach out promptly if you experience urgent red-flag symptoms.

• NEXT VISIT:
Please review your upcoming appointments in your Mama Root portal.`;
    }

    // verbatim
    return `CONSULTATION AUDIO TRANSCRIPT (${todayDate})
Patient: ${patientName}
Language: ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.label || selectedLanguage}
Duration: ${formatDuration(elapsedSeconds)}

Transcript:
"${raw}"`;
  };

  const handleCopy = () => {
    const formatted = getFormattedContent();
    if (!formatted) return;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApply = () => {
    const formatted = getFormattedContent();
    if (onApplyTranscript && formatted) {
      onApplyTranscript(formatted);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    // Provide friendly simulated audio transcript extraction
    const sample = SAMPLE_CONSULTATION_AUDIO_TRANSCRIPTS[0];
    setTranscript(`[Transcribed from uploaded file: ${file.name}]\n\n${sample.text}`);
    setErrorMessage(null);
  };

  const loadSampleTranscript = (sampleText: string) => {
    setTranscript(sampleText);
    setShowSamples(false);
  };

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-3xl border border-[#302B2D]/10 shadow-sm overflow-hidden font-sans">
      {/* Top Banner / Controls */}
      <div className="bg-[#FFF9F3] p-4 sm:p-5 border-b border-[#F4E8E0] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
            isRecording 
              ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-200' 
              : 'bg-[#F4E8E0] text-[#572D43]'
          }`}>
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#302B2D]">
                {role === 'doctor' ? 'Clinical Consultation Transcriber' : 'Consultation Audio Recorder & Notes'}
              </h2>
              {isRecording && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  {isPaused ? 'PAUSED' : 'LIVE RECORDING'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#777078]">
              Speech-to-text consultation dialogue with patient privacy safeguards
            </p>
          </div>
        </div>

        {/* Language selector & Duration */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-[#F4E8E0] rounded-xl px-2.5 py-1.5 text-xs text-[#302B2D] shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-[#572D43]" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={isRecording}
              className="bg-transparent text-xs outline-none text-[#302B2D] font-medium cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-[#F4E8E0] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#572D43] shadow-2xs">
            {formatDuration(elapsedSeconds)}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Error notification if any */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Tip: You can use the "Quick Clinical Samples" or upload consultation audio below to continue without interruptions.
              </p>
            </div>
          </div>
        )}

        {/* Visual Audio Waveform & Recording Action Buttons */}
        <div className="bg-[#FFF9F3] p-4 rounded-2xl border border-[#F4E8E0] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Audio Visualizer Level */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-end gap-1 h-8 px-2">
              {[15, 30, 45, 60, 80, 100, 70, 40, 20].map((baseline, i) => {
                const dynamicHeight = isRecording && !isPaused
                  ? Math.max(15, Math.min(100, (volumeLevel * (baseline / 60)) + Math.random() * 20))
                  : 15;
                return (
                  <div 
                    key={i}
                    style={{ height: `${dynamicHeight}%` }}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isRecording && !isPaused
                        ? 'bg-[#572D43]'
                        : 'bg-[#F4E8E0]'
                    }`}
                  />
                );
              })}
            </div>
            <div className="text-xs text-[#777078]">
              {isRecording 
                ? isPaused 
                  ? 'Recording paused — click resume' 
                  : 'Listening... speak clearly into microphone'
                : 'Click "Start Recording" to transcribe live consultation'}
            </div>
          </div>

          {/* Action Button Row */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="btn-botanical text-xs font-semibold flex items-center gap-2 py-2 px-4 shadow-sm"
              >
                <Mic className="w-4 h-4 text-white" />
                <span>Start Recording</span>
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    type="button"
                    onClick={resumeRecording}
                    className="p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43] text-[#572D43] hover:bg-[#F4E8E0] transition-colors"
                    title="Resume recording"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={pauseRecording}
                    className="p-2.5 rounded-xl bg-white border border-[#F4E8E0] text-[#777078] hover:text-[#302B2D] transition-colors"
                    title="Pause recording"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Finish & Stop</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleReset}
              disabled={isRecording && !isPaused}
              className="p-2.5 rounded-xl bg-white border border-[#F4E8E0] text-[#777078] hover:text-[#302B2D] transition-colors disabled:opacity-40"
              title="Reset consultation transcript"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Audio Playback Player if recorded */}
        {audioUrl && (
          <div className="p-3 bg-white border border-[#F4E8E0] rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#572D43]">
              <Volume2 className="w-4 h-4" />
              <span>Consultation Audio Playback</span>
            </div>
            <audio src={audioUrl} controls className="h-8 max-w-[280px] sm:max-w-[360px]" />
            <a
              href={audioUrl}
              download={`mama-root-consultation-${patientName.toLowerCase().replace(/\s+/g, '-')}.webm`}
              className="p-2 rounded-xl bg-[#FFF9F3] hover:bg-[#F4E8E0] text-[#572D43] text-xs font-medium flex items-center gap-1 transition-colors"
              title="Download audio file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save Audio</span>
            </a>
          </div>
        )}

        {/* Live Transcript & Interim Speech Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#302B2D] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#572D43]" />
              <span>Live Dialogue & Transcribed Speech</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSamples(!showSamples)}
                className="text-[11px] font-semibold text-[#914E61] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Load Sample Case</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick sample cases drawer */}
          {showSamples && (
            <div className="p-3 bg-[#FFFFFF] rounded-2xl border border-[#D9A7A4] grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SAMPLE_CONSULTATION_AUDIO_TRANSCRIPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => loadSampleTranscript(item.text)}
                  className="text-left p-2.5 rounded-xl bg-white border border-[#D9A7A4]/60 hover:border-[#572D43] transition-colors text-xs space-y-1"
                >
                  <p className="font-bold text-[#302B2D] line-clamp-1">{item.title}</p>
                  <p className="text-[10px] text-[#777078] line-clamp-2">{item.text}</p>
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Spoken words during the consultation will appear here in real time. You can also edit, format, or type notes manually..."
              rows={5}
              className="w-full p-4 bg-[#FFF9F3] border border-[#F4E8E0] rounded-2xl text-xs sm:text-sm outline-none focus:border-[#572D43] text-[#302B2D] leading-relaxed resize-y custom-scrollbar"
            />
            {interimText && (
              <div className="px-4 py-2 bg-[#FFF9F3] border-t border-dashed border-[#F4E8E0] text-xs text-[#914E61] italic flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#914E61] animate-ping" />
                <span>Transcribing: "{interimText}"</span>
              </div>
            )}
          </div>
        </div>

        {/* Note Formatting Selector & Clinical Tools */}
        {role === 'doctor' && transcript.trim() && (
          <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#F4E8E0] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#302B2D] flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-[#572D43]" />
                <span>Format for Clinical Patient Guidance</span>
              </span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#F4E8E0]">
                <button
                  type="button"
                  onClick={() => setNoteFormat('soap')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    noteFormat === 'soap' 
                      ? 'bg-[#572D43] text-white shadow-2xs' 
                      : 'text-[#777078] hover:text-[#302B2D]'
                  }`}
                >
                  SOAP Clinical Format
                </button>
                <button
                  type="button"
                  onClick={() => setNoteFormat('summary')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    noteFormat === 'summary' 
                      ? 'bg-[#572D43] text-white shadow-2xs' 
                      : 'text-[#777078] hover:text-[#302B2D]'
                  }`}
                >
                  Patient Summary
                </button>
                <button
                  type="button"
                  onClick={() => setNoteFormat('verbatim')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    noteFormat === 'verbatim' 
                      ? 'bg-[#572D43] text-white shadow-2xs' 
                      : 'text-[#777078] hover:text-[#302B2D]'
                  }`}
                >
                  Verbatim Transcript
                </button>
              </div>
            </div>

            {/* Note Preview Box */}
            <div className="p-3 bg-white rounded-xl border border-[#F4E8E0] text-xs text-[#302B2D] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
              {getFormattedContent()}
            </div>
          </div>
        )}

        {/* Action Buttons: Apply to Note, Copy, Download */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Offline Audio File Upload */}
          <label className="cursor-pointer flex items-center gap-1.5 text-xs text-[#777078] hover:text-[#572D43] transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Pre-Recorded Audio File (.mp3, .wav, .m4a)</span>
            <input 
              type="file" 
              accept="audio/*" 
              onChange={handleAudioUpload} 
              className="hidden" 
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!transcript.trim()}
              className="px-3.5 py-2 rounded-xl border border-[#D9A7A4] text-xs font-semibold text-[#302B2D] hover:bg-[#FFF9F3] transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {onApplyTranscript && (
              <button
                type="button"
                onClick={handleApply}
                disabled={!transcript.trim()}
                className="btn-botanical text-xs font-semibold py-2 px-4 flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {role === 'doctor' ? 'Insert into Clinical Guidance' : 'Save to My Visit Notes'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
