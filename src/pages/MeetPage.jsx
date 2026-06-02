import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff,
  Info, Users, MessageSquare, AlertCircle, CheckCircle2,
  Code, Play, Send, ChevronRight, BookOpen, Trophy
} from 'lucide-react';
import Editor from '@monaco-editor/react';

const staticQuestions = [
  {
    "title": "Java Stack Min Operation",
    "problemStatement": "Implement a class `MinStack` that supports push, pop, top, and retrieving the minimum element in constant time.\n\n- `void push(int x)` — Push element x onto stack.\n- `void pop()` — Removes the element on top of the stack.\n- `int top()` — Get the top element of the stack.\n- `int getMin()` — Retrieve the minimum element in the stack.",
    "difficulty": "Medium",
    "language": "java",
    "isLanguageSpecific": true,
    "starterCode": "class MinStack {\n    public MinStack() {\n        // initialize your data structure here.\n    }\n    public void push(int x) {\n        // implement push operation\n    }\n    public void pop() {\n        // implement pop operation\n    }\n    public int top() {\n        // implement top operation\n    }\n    public int getMin() {\n        // implement getMin operation\n    }\n}",
    "testCases": [
      { "input": "push(-2), push(0), push(-3), getMin(), pop(), top(), getMin()", "expected": "-3, 0, -2" }
    ]
  },
  {
    "title": "Basic Java String Compression",
    "problemStatement": "Write a method `compressString` that takes a string and returns a compressed version using the counts of repeated characters. If the compressed version would not be smaller, return the original string.\n\nInput: `aabcccccaaa` -> Output: `a2b1c5a3`",
    "difficulty": "Easy",
    "language": "java",
    "starterCode": "public String compressString(String str) {\n    // Your code here\n    return \"\";\n}",
    "testCases": [
      { "input": "aabcccccaaa", "expected": "a2b1c5a3" },
      { "input": "abcd", "expected": "abcd" }
    ]
  },
  {
    "title": "Binary Search on Rotated Sorted Array",
    "problemStatement": "Assume no duplicate exists in the array. Return the index of target in the array. If not found, return -1.\n\nInput: nums = [4,5,6,7,0,1,2], target = 0 -> Output: 4",
    "difficulty": "Medium",
    "language": "java",
    "starterCode": "public int search(int[] nums, int target) {\n    // Your code here\n    return -1;\n}",
    "testCases": [
      { "input": "nums = [4,5,6,7,0,1,2], target = 0", "expected": "4" },
      { "input": "[4,5,6,7,0,1,2], 3", "expected": "-1" }
    ]
  }
];

import { BASE_API_URL, EXTERNAL_API_URL, PROCESS_TEXT_API_URL, OPENAI_API_KEY } from '../config';

import './MeetPage.css';

const MeetPage = () => {
  const { userId, token } = useParams();
  const effectiveUserId = userId || token;
  const [status, setStatus] = useState('welcome'); // welcome, interviewing, done, error
  const [errorMessage, setErrorMessage] = useState('');
  const [candidateName, setCandidateName] = useState('Candidate');
  const [jobTitle, setJobTitle] = useState('the position');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(true);
  const [messages, setMessages] = useState([]);
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningReason, setWarningReason] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [isUploading, setIsUploading] = useState(true);
  const [isCodingRoundEnabled, setIsCodingRoundEnabled] = useState(true);
  const [isBehavioralRoundEnabled, setIsBehavioralRoundEnabled] = useState(true);
  const isBehavioralRoundEnabledRef = useRef(true);
  const isCodingRoundEnabledRef = useRef(true);
  const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);


  // Coding Mode State
  const boilerplates = {
    javascript: '// Write your JavaScript code here\n',
    python: '# Write your Python code here\n',
    java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your Java code here\n    }\n}\n',
    go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your Go code here\n    fmt.Println("Hello, World!")\n}\n',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ code here\n    return 0;\n}\n',
    sql: '-- Write your MySQL query here\nSELECT * FROM users;\n',
    mongodb: '// Write your MongoDB query here\ndb.users.find({});\n',
    html: '<!-- Write your HTML code here -->\n<!DOCTYPE html>\n<html>\n<head>\n  <title>App</title>\n</head>\n<body>\n  <h1>Hello</h1>\n</body>\n</html>\n',
    css: '/* Write your CSS code here */\nbody {\n  margin: 0;\n  padding: 0;\n}\n',
    csharp: 'using System;\n\nclass Program {\n    static void Main() {\n        // Write your C# code here\n        Console.WriteLine("Hello, World!");\n    }\n}\n',
    perl: "#!/usr/bin/perl\nuse strict;\nuse warnings;\n\n# Write your Perl code here\nprint \"Hello, world!\\n\";\n",
    swift: "import Foundation\n\n// Write your Swift code here\nprint(\"Hello, world!\")\n",
    kotlin: "fun main() {\n    // Write your Kotlin code here\n    println(\"Hello, world!\")\n}\n",
    php: "<?php\n\n// Write your PHP code here\necho \"Hello, world!\";\n?>\n",
    r: "# Write your R code here\nprint(\"Hello, world!\")\n",
    ruby: "# Write your Ruby code here\nputs \"Hello, world!\"\n",
    c: "#include <stdio.h>\n\nint main() {\n    // Write your C code here\n    printf(\"Hello, world!\\n\");\n    return 0;\n}\n"
  };

  const [isCodingMode, setIsCodingMode] = useState(false);
  const [isMicDisabled, setIsMicDisabled] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isUserTalking, setIsUserTalking] = useState(false);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = isMicDisabled ? false : !isMicMuted;
      });
    }
  }, [isMicDisabled, isMicMuted]);

  useEffect(() => {
    if (isUserTalking && convoRef.current) {
      convoRef.current.scrollTop = convoRef.current.scrollHeight;
    }
  }, [isUserTalking]);

  useEffect(() => {
    if (status !== 'interviewing') return;

    let animationFrameId;
    const checkVolume = () => {
      let isSpeaking = false;
      const now = Date.now();
      const last = realtimeLastMeterAtRef.current || now;
      const deltaMs = Math.max(now - last, 0);
      realtimeLastMeterAtRef.current = now;

      if (aiAnalyserRef.current) {
        const array = new Uint8Array(aiAnalyserRef.current.frequencyBinCount);
        aiAnalyserRef.current.getByteFrequencyData(array);
        
        let sum = 0;
        for (let i = 0; i < array.length; i++) {
          sum += array[i];
        }
        const average = sum / array.length;
        
        // If average volume is above a threshold, AI is speaking
        isSpeaking = average > 4;
        if (isSpeaking) {
          realtimeAiAudioMsRef.current += deltaMs;
        }
        setIsAiTalking(isSpeaking);
      }

      if (isFinalizingRef.current) {
        if (!isSpeaking) {
          silenceCounterRef.current += 1;
          // 90 frames of silence (at ~60fps) is roughly 1.5 seconds of clean silence
          if (silenceCounterRef.current > 90) {
            isFinalizingRef.current = false;
            finishInterview();
          }
        } else {
          silenceCounterRef.current = 0;
        }
      }

      animationFrameId = requestAnimationFrame(checkVolume);
    };

    animationFrameId = requestAnimationFrame(checkVolume);
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [status]);

  const [codingQuestions, setCodingQuestions] = useState(staticQuestions);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [code, setCode] = useState(staticQuestions[0].starterCode);
  const [codeCaches, setCodeCaches] = useState({});
  const [executionHistory, setExecutionHistory] = useState({});
  const [language, setLanguage] = useState(staticQuestions[0].language);
  const [codingTask, setCodingTask] = useState(staticQuestions[0].problemStatement);
  const [tasksResults, setTasksResults] = useState({}); // { index: { passed: boolean, count: number } }
  const [isRunning, setIsRunning] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [testResults, setTestResults] = useState([]); // Array of { id, status, input, expected, actual }
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showRunFirstAlert, setShowRunFirstAlert] = useState(false); // Alert: must run at least once
  const [hasRunCode, setHasRunCode] = useState({}); // { questionIdx: true } - tracks if run was done

  const codingQuestionsRef = useRef(codingQuestions);
  const currentIdxRef = useRef(currentQuestionIdx);
  const hasRunCodeRef = useRef(hasRunCode);
  const codeRef = useRef(code);
  const codeCachesRef = useRef(codeCaches);
  const timeLeftRef = useRef(timeLeft);
  const tasksResultsRef = useRef(tasksResults);
  const autoSubmitCalledRef = useRef(false); // prevent double auto-submit
  const timerStartedRef = useRef(false); // track if timer was actually counting down

  useEffect(() => {
    codingQuestionsRef.current = codingQuestions;
  }, [codingQuestions]);

  useEffect(() => {
    currentIdxRef.current = currentQuestionIdx;
  }, [currentQuestionIdx]);

  useEffect(() => {
    hasRunCodeRef.current = hasRunCode;
  }, [hasRunCode]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    codeCachesRef.current = codeCaches;
  }, [codeCaches]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    tasksResultsRef.current = tasksResults;
  }, [tasksResults]);
  // Refs for media and logic
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioCtxRef = useRef(null);
  const audioDestRef = useRef(null);
  const localAudioSourceRef = useRef(null);
  const remoteAudioSourceRef = useRef(null);
  const aiAnalyserRef = useRef(null);
  const isFinalizingRef = useRef(false);
  const silenceCounterRef = useRef(0);
  const videoRef = useRef(null);
  const audioElRef = useRef(null);
  const convoRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const activeUploadsRef = useRef(0);
  const jobDataRef = useRef({ experience: 'N/A', mandatorySkills: '', niceToHaveSkills: '' });
  const questionsRef = useRef([]);
  const aiBufferRef = useRef('');
  const userBufferRef = useRef('');

  // Realtime cost tracking
  const realtimeStartedAtRef = useRef(null);
  const realtimeEndedAtRef = useRef(null);
  const realtimeEventCountRef = useRef(0);
  const realtimeUsageEventsRef = useRef([]);
  const realtimeUsageRef = useRef({
    text_input_tokens: 0,
    text_output_tokens: 0,
    audio_input_tokens: 0,
    audio_output_tokens: 0,
    cached_input_tokens: 0
  });
  const realtimeCandidateAudioMsRef = useRef(0);
  const realtimeCandidateSpeechStartedAtRef = useRef(null);
  const realtimeAiAudioMsRef = useRef(0);
  const realtimeLastMeterAtRef = useRef(null);
  const realtimeCostFinalizedRef = useRef(false);
  const realtimeSessionMetaRef = useRef({
    model: 'gpt-realtime-mini',
    voice: 'cedar',
    transcription_model: 'gpt-4o-transcribe'
  });

  useEffect(() => {
    if (videoRef.current && localStreamRef.current) {
      videoRef.current.srcObject = localStreamRef.current;
    }
  }, [isCodingMode, status]);


  // Initial Data Fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      const checkAlreadyCompleted = (err) => {
        if (err.response && err.response.status === 400 && err.response.data && err.response.data.message === "Interview already completed") {
          setStatus('already_completed');
          return true;
        }
        return false;
      };

      // Fetch Interview Type (Coding only, behavioral only, or both) on mount
      try {
        const typeResponse = await axios.get(`${EXTERNAL_API_URL}/api/goodmood/interview/get/token/interview/type?token=${effectiveUserId}`);
        console.log("Interview Type Response on mount:", typeResponse.data);
        const typeData = typeResponse.data?.data;
        if (typeData) {
          const codingFlag = typeData.coding === 1;
          const behavioralFlag = typeData.interviewChecking === 1;
          setIsCodingRoundEnabled(codingFlag);
          isCodingRoundEnabledRef.current = codingFlag;
          setIsBehavioralRoundEnabled(behavioralFlag);
          isBehavioralRoundEnabledRef.current = behavioralFlag;
        }
      } catch (error) {
        console.error("Failed to fetch interview type on mount:", error);
      }

      // 0. Fetch Coding Question (Prioritize so it's ready)
      console.log("Checking for coding question with token:", effectiveUserId);
      try {
        const resCoding = await axios.get(`${EXTERNAL_API_URL}/api/coding/get-question/${effectiveUserId}`);
        console.log("Coding API Response Raw:", resCoding.data);

        let parsedData = resCoding.data;
        if (resCoding.data && resCoding.data.data) {
          parsedData = typeof resCoding.data.data === 'string' ? JSON.parse(resCoding.data.data) : resCoding.data.data;
        }

        const rawQuestions = parsedData.questions || [];

        // Deep unescape \n characters that come from double-stringified backend data
        const unescapeLines = (str) => typeof str === 'string' ? str.replace(/\\n/g, '\n') : str;

        const fetchedQuestions = rawQuestions.map(q => ({
          ...q,
          title: unescapeLines(q.title),
          problemStatement: unescapeLines(q.problemStatement),
          starterCode: unescapeLines(q.starterCode),
          hints: (q.hints || []).map(h => unescapeLines(h)),
          constraints: (q.constraints || []).map(c => unescapeLines(c)),
          testCases: (q.testCases || []).map(tc => ({
            ...tc,
            input: unescapeLines(tc.input),
            expectedOutput: unescapeLines(tc.expectedOutput),
            explanation: unescapeLines(tc.explanation)
          }))
        }));

        console.log("Extracted Questions List (Unescaped):", fetchedQuestions);

        if (fetchedQuestions.length > 0) {
          setCodingQuestions(fetchedQuestions);

          if (parsedData.totalInterviewTimeMinutes) {
            setTimeLeft(parsedData.totalInterviewTimeMinutes * 60);
          }

          const mainQ = fetchedQuestions[0];
          setCodingTask(mainQ.problemStatement || '');
          setLanguage(mainQ.language || 'java');
          setCode(mainQ.starterCode || '');
        } else {
          console.warn("No questions found in the API response data.");
        }
      } catch (codingErr) {
        if (checkAlreadyCompleted(codingErr)) return;
        console.error('Failed to fetch dynamic coding question:', codingErr);
      }

      try {
        // 1. Fetch Job Info
        const resJob = await axios.get(`${EXTERNAL_API_URL}/api/goodmood/interview/list-data-exp?token=${effectiveUserId}`);
        if (resJob.data.status && resJob.data.data?.interviewDto) {
          const { interviewDto } = resJob.data.data;
          setCandidateName(interviewDto.candidateName || 'Candidate');

          const jobDto = interviewDto.jobDto || {};
          jobDataRef.current = {
            experience: jobDto.experience || 'N/A',
            mandatorySkills: jobDto.mandatorySkills?.map(s => s.skillName).filter(Boolean).join(',') || '',
            niceToHaveSkills: jobDto.mustHaveSkills?.map(s => s.skillName).filter(Boolean).join(',') || ''
          };
        }

        // 1.5 Fetch Dynamic Job Role
        try {
          const resRole = await axios.get(`${EXTERNAL_API_URL}/api/goodmood/interview/job-role?token=${effectiveUserId}`);
          if (resRole.data?.status && resRole.data?.data?.role) {
            setJobTitle(resRole.data.data.role);
          }
        } catch (roleErr) {
          if (checkAlreadyCompleted(roleErr)) return;
          console.warn('Could not fetch dynamic job role:', roleErr);
        }

        // 2. Fetch Questions (Logic from app.py)
        const resQ = await axios.get(`${EXTERNAL_API_URL}/api/goodmood/question/get-question/${effectiveUserId}`);
        if (resQ.data.status) {
          const rawQ = resQ.data.questions || [];
          const extractedQ = rawQ.map(q => q.question).filter(Boolean);
          // Fixed questions like FIRST_QUESTIONS and LAST_QUESTIONS
          questionsRef.current = [
            "Hello! How are you doing today?",
            "Tell me about yourself and your professional background.",
            ...extractedQ,
            "Do you have any questions for us?"
          ];
        } else {
          setErrorMessage(resQ.data.message || "Failed to fetch questions");
          setStatus('error');
        }
      } catch (err) {
        console.error("Initial data fetch failed", err);
        if (checkAlreadyCompleted(err)) return;

        setErrorMessage("Connection to interview servers failed.");
        setStatus('error');
      }
    };

    if (effectiveUserId) fetchInitialData();
  }, [effectiveUserId]);

  // Countdown Timer logic
  useEffect(() => {
    if (status !== 'interviewing') return;

    // Only trigger timeout logic if timeLeft was actually set (> 0 at some point)
    // Prevents false-fire when timeLeft is still the default 0 on interview start
    if (timeLeft > 0) {
      timerStartedRef.current = true; // timer is running
    }

    if (timeLeft <= 0) {
      if (timerStartedRef.current) {
        // Timer genuinely expired — auto-submit or finish
        if (isCodingMode) {
          if (!autoSubmitCalledRef.current) {
            autoSubmitCalledRef.current = true;
            confirmSubmitCodeAuto();
          }
        } else {
          finishInterview();
        }
      }
      // If timerStartedRef is false, timeLeft is still the default 0 — do nothing
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeLeft, isCodingMode]);

  // const formatTimeLeft = (seconds) => {
  //   const h = Math.floor(seconds / 3600);
  //   const m = Math.floor((seconds % 3600) / 60);
  //   const s = seconds % 60;
  //   return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  // };

  const formatTimeLeft = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Proctoring Logic
  useEffect(() => {
    if (status !== 'interviewing') return;

    let blurSubmitTimer = null; // grace period timer for tab-switch auto-submit

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isCodingMode) {
          // Give a 3-second grace period — user may have accidentally switched
          blurSubmitTimer = setTimeout(() => {
            if (document.hidden && !autoSubmitCalledRef.current) {
              autoSubmitCalledRef.current = true;
              confirmSubmitCodeAuto();
            }
          }, 3000);
        } else {
          triggerViolation("Candidate switched tabs.");
        }
      } else {
        // User came back — cancel the grace period timer
        if (blurSubmitTimer) {
          clearTimeout(blurSubmitTimer);
          blurSubmitTimer = null;
        }
      }
    };

    // Window blur: in coding mode, do NOT auto-submit — too many false positives
    // (Monaco editor autocomplete, browser toolbar, etc. all trigger window blur)
    const handleWindowBlur = () => {
      if (!isCodingMode) {
        triggerViolation("Candidate clicked outside window.");
      }
      // In coding mode: no action — visibility change handles real tab-switches
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !showWarning) {
        if (isCodingMode) {
          // Fullscreen exit during coding: just warn, don't auto-submit
          // User may have accidentally pressed Escape
          triggerViolation("Exited full-screen during coding round.");
        } else {
          triggerViolation("Exited full-screen.");
        }
      }
    };

    // Updated Proctoring: Allow copy/paste specifically when in coding mode for testing.
    const preventAction = (e) => {
      if (isCodingMode) return; // Permission granted for coding
      e.preventDefault();
    };

    const handleKeydown = (e) => {
      // DevTools Protection (Always Active)
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
        e.preventDefault();
        triggerViolation("Attempted to open Developer Tools.");
      }

      // Conditional Copy/Paste/Cut
      if (!isCodingMode && e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", preventAction);
    document.addEventListener("copy", preventAction);
    document.addEventListener("paste", preventAction);
    document.addEventListener("cut", preventAction);
    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", preventAction);
      document.removeEventListener("copy", preventAction);
      document.removeEventListener("paste", preventAction);
      document.removeEventListener("cut", preventAction);
      document.removeEventListener("keydown", handleKeydown);
      if (blurSubmitTimer) clearTimeout(blurSubmitTimer);
    };
  }, [status, showWarning, isCodingMode]);

  // Transcript Syncing
  useEffect(() => {
    if (status !== 'interviewing') return;

    syncIntervalRef.current = setInterval(() => {
      const transcript = messages.map(m => `[${m.who === 'ai' ? 'Interviewer' : 'Candidate'}]: ${m.text}`).join('\n\n');
      if (transcript.trim()) syncTranscripts(transcript);

      const durationMs = Date.now() - startTimeRef.current;
      const durationStr = formatDuration(durationMs);
      axios.post(`${EXTERNAL_API_URL}/analysis/ai/duration`, { token: effectiveUserId, duration: durationStr }).catch(() => { });
    }, 10000);


    return () => clearInterval(syncIntervalRef.current);
  }, [status, messages, effectiveUserId]);

  // Helpers
  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  const getInterviewLinkForCost = () => {
    return `https://interviewfoldfrontend.interviewfold.com/${effectiveUserId}`;
  };

  const resetRealtimeCostTracking = () => {
    realtimeStartedAtRef.current = new Date().toISOString();
    realtimeEndedAtRef.current = null;
    realtimeEventCountRef.current = 0;
    realtimeUsageEventsRef.current = [];
    realtimeUsageRef.current = {
      text_input_tokens: 0,
      text_output_tokens: 0,
      audio_input_tokens: 0,
      audio_output_tokens: 0,
      cached_input_tokens: 0
    };
    realtimeCandidateAudioMsRef.current = 0;
    realtimeCandidateSpeechStartedAtRef.current = null;
    realtimeAiAudioMsRef.current = 0;
    realtimeLastMeterAtRef.current = null;
    realtimeCostFinalizedRef.current = false;
  };

  const addNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const addRealtimeUsage = (targetKey, value) => {
    const amount = addNumber(value);
    if (amount <= 0) return;
    realtimeUsageRef.current[targetKey] = (realtimeUsageRef.current[targetKey] || 0) + amount;
  };

  const captureRealtimeUsageFromEvent = (evt) => {
    realtimeEventCountRef.current += 1;

    const usage = evt?.response?.usage || evt?.usage;
    if (!usage || typeof usage !== 'object') return;

    realtimeUsageEventsRef.current.push({
      type: evt.type,
      usage,
      capturedAt: new Date().toISOString()
    });
    if (realtimeUsageEventsRef.current.length > 20) {
      realtimeUsageEventsRef.current = realtimeUsageEventsRef.current.slice(-20);
    }

    // Realtime usage payloads can vary by model/version, so this parser supports
    // both flat token fields and nested input/output token details.
    addRealtimeUsage('text_input_tokens', usage.input_text_tokens);
    addRealtimeUsage('text_output_tokens', usage.output_text_tokens);
    addRealtimeUsage('audio_input_tokens', usage.input_audio_tokens);
    addRealtimeUsage('audio_output_tokens', usage.output_audio_tokens);
    addRealtimeUsage('cached_input_tokens', usage.cached_input_tokens);

    addRealtimeUsage('text_input_tokens', usage.input_token_details?.text_tokens);
    addRealtimeUsage('audio_input_tokens', usage.input_token_details?.audio_tokens);
    addRealtimeUsage('cached_input_tokens', usage.input_token_details?.cached_tokens);
    addRealtimeUsage('text_output_tokens', usage.output_token_details?.text_tokens);
    addRealtimeUsage('audio_output_tokens', usage.output_token_details?.audio_tokens);

    // Fallback for generic usage objects.
    if (
      !usage.input_text_tokens &&
      !usage.input_audio_tokens &&
      !usage.input_token_details &&
      usage.input_tokens
    ) {
      addRealtimeUsage('text_input_tokens', usage.input_tokens);
    }

    if (
      !usage.output_text_tokens &&
      !usage.output_audio_tokens &&
      !usage.output_token_details &&
      usage.output_tokens
    ) {
      addRealtimeUsage('text_output_tokens', usage.output_tokens);
    }
  };

  const finalizeRealtimeCost = async () => {
    if (realtimeCostFinalizedRef.current || !effectiveUserId || !realtimeStartedAtRef.current) return;
    realtimeCostFinalizedRef.current = true;

    const now = new Date();
    realtimeEndedAtRef.current = now.toISOString();

    if (realtimeCandidateSpeechStartedAtRef.current) {
      realtimeCandidateAudioMsRef.current += Date.now() - realtimeCandidateSpeechStartedAtRef.current;
      realtimeCandidateSpeechStartedAtRef.current = null;
    }

    const durationSeconds = Math.max(
      Math.round((Date.now() - startTimeRef.current) / 1000),
      0
    );

    const payload = {
      token: effectiveUserId,
      interview_link: getInterviewLinkForCost(),
      model: realtimeSessionMetaRef.current.model,
      voice: realtimeSessionMetaRef.current.voice,
      transcription_model: realtimeSessionMetaRef.current.transcription_model,
      started_at: realtimeStartedAtRef.current,
      ended_at: realtimeEndedAtRef.current,
      duration_seconds: durationSeconds,
      candidate_audio_seconds: Number((realtimeCandidateAudioMsRef.current / 1000).toFixed(2)),
      ai_audio_seconds: Number((realtimeAiAudioMsRef.current / 1000).toFixed(2)),
      usage: realtimeUsageRef.current,
      usage_source: 'frontend_realtime_events_or_duration_estimate',
      event_count: realtimeEventCountRef.current,
      message_count: messages.length,
      raw_usage_events: realtimeUsageEventsRef.current
    };

    try {
      const res = await axios.post(`${PROCESS_TEXT_API_URL}/api/v1/realtime-cost/finalize`, payload);
      console.log('Realtime cost saved:', res.data);
    } catch (error) {
      console.error('Failed to save realtime cost:', error);
      realtimeCostFinalizedRef.current = false;
    }
  };

  const syncTranscripts = async (transcriptText) => {
    // 1. External Transcript API
    axios.post(`${EXTERNAL_API_URL}/transcript/ai`, { token: effectiveUserId, transcript: transcriptText }).catch(() => { });

    // Analysis
    try {
      const formData = new URLSearchParams();
      formData.append("text", transcriptText);
      formData.append("Experience", jobDataRef.current.experience);
      formData.append("Mandatory_skills", jobDataRef.current.mandatorySkills);
      formData.append("Nice_to_have_skills", jobDataRef.current.niceToHaveSkills);
      formData.append("user_id", effectiveUserId);
      const res = await axios.post(`${PROCESS_TEXT_API_URL}/api/v1/process-text`, formData);
      console.log('myRes', res)
      await axios.post(`${EXTERNAL_API_URL}/analysis/ai`, { token: effectiveUserId, analysis: JSON.stringify(res.data) });
    } catch (e) { console.error("Sync failed", e); }
  };

  const triggerViolation = (reason) => {
    if (status !== 'interviewing' || showWarning) return;

    setWarningReason(reason);
    setShowWarning(true);

    axios.post(`${BASE_API_URL}/api/log-violation/${effectiveUserId}`, { reason }).catch(() => { });
    if (dcRef.current?.readyState === 'open') {
      dcRef.current.send(JSON.stringify({ type: 'response.cancel' }));
    }

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
    }

    if (warningCount >= 1) {
      terminateInterview(reason);
    } else {
      setWarningCount(prev => prev + 1);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
    }
  };

  const terminateInterview = (reason) => {
    axios.post(`${EXTERNAL_API_URL}/api/goodmood/terminate/reason`, { reason, token: effectiveUserId }).catch(() => { });
    alert(`🛑 INTERVIEW TERMINATED\n\n${reason}\n\nYou have exceeded the allowed warnings.`);
    finishInterview();
  };

  const resumeFromWarning = () => {
    setShowWarning(false);
    requestFullScreen();
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !isMicMuted);
    }
    if (dcRef.current?.readyState === 'open') {
      dcRef.current.send(JSON.stringify({
        type: "conversation.item.create",
        item: { type: "message", role: "user", content: [{ type: "input_text", text: "System Note: The candidate was briefly interrupted. Please repeat your last question." }] }
      }));
      dcRef.current.send(JSON.stringify({
        type: "response.create",
        response: { output_modalities: ["audio"] }
      }));
    }
  };

  const requestFullScreen = () => {
    document.documentElement.requestFullscreen().catch(() => { });
  };

  const startInterview = async () => {
    try {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (videoRef.current) videoRef.current.srcObject = localStreamRef.current;
    } catch (err) {
      alert(`Camera/Microphone Error: ${err.name} - ${err.message}. Please check if you have a camera/mic connected, and close other apps (Zoom, Teams) that might be using it.`);
      return;
    }

    let codingFlag = true;
    let behavioralFlag = true;

    // Set initial ref values
    isCodingRoundEnabledRef.current = true;
    isBehavioralRoundEnabledRef.current = true;

    try {
      const typeResponse = await axios.get(`${EXTERNAL_API_URL}/api/goodmood/interview/get/token/interview/type?token=${effectiveUserId}`);
      console.log("Interview Type Response:", typeResponse.data);

      const typeData = typeResponse.data?.data;
      if (typeData) {
        codingFlag = typeData.coding === 1;
        behavioralFlag = typeData.interviewChecking === 1;
        setIsCodingRoundEnabled(codingFlag);
        isCodingRoundEnabledRef.current = codingFlag;
        setIsBehavioralRoundEnabled(behavioralFlag);
        isBehavioralRoundEnabledRef.current = behavioralFlag;
      }

    } catch (error) {
      console.error("Failed to fetch interview type:", error);
    }

    // const canvas = document.createElement('canvas');
    // canvas.width = 640; canvas.height = 480;
    // const fakeVideoTrack = canvas.getContext('2d').canvas.captureStream(30).getVideoTracks()[0];

    // const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // const fakeAudioTrack = audioCtx.createMediaStreamDestination().stream.getAudioTracks()[0];

    // localStreamRef.current = new MediaStream([fakeVideoTrack, fakeAudioTrack]);
    // if (videoRef.current) {
    //   videoRef.current.srcObject = localStreamRef.current;
    // }


    try {
      screenStreamRef.current = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "monitor" } });
      const track = screenStreamRef.current.getVideoTracks()[0];
      if (track.getSettings().displaySurface !== 'monitor') {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        throw new Error("Must share Entire Screen.");
      }
      track.onended = () => triggerViolation("Screen share stopped.");

    } catch (err) {
      alert(err.message); return;
    }

    // logics for interview type as per === 1 (Coding-only bypass)
    if (codingFlag && !behavioralFlag) {
      setIsCodingMode(true);
      setIsMicDisabled(true);
      setIsSpeakerMuted(true);

      // Play intro sound
      const audio = new Audio('/coding_intro.m4a');
      audio.play().catch(e => console.error("Failed to play intro audio:", e));

      requestFullScreen();
      setStatus('interviewing');
      startTimeRef.current = Date.now();
      resetRealtimeCostTracking();

      // Use PUT instead of POST for completion as per app.py
      axios.put(`${EXTERNAL_API_URL}/api/goodmood/question/complete/${effectiveUserId}`).catch(() => { });

      // Audio Setup for Recording
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      audioDestRef.current = audioCtxRef.current.createMediaStreamDestination();
      localAudioSourceRef.current = audioCtxRef.current.createMediaStreamSource(localStreamRef.current);
      localAudioSourceRef.current.connect(audioDestRef.current);

      // Media Recorder
      const combinedStream = new MediaStream([
        ...screenStreamRef.current.getVideoTracks(),
        ...audioDestRef.current.stream.getAudioTracks()
      ]);
      mediaRecorderRef.current = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) uploadChunk(e.data);
      };
      mediaRecorderRef.current.onstop = () => checkUploads();
      mediaRecorderRef.current.start(10000);

      return; // Early return to bypass WebRTC connection
    }

    requestFullScreen();
    setStatus('interviewing');
    setIsCodingMode(false);
    startTimeRef.current = Date.now();
    resetRealtimeCostTracking();

    // Use PUT instead of POST for completion as per app.py
    axios.put(`${EXTERNAL_API_URL}/api/goodmood/question/complete/${effectiveUserId}`).catch(() => { });


    // Audio Setup for Recording
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    audioDestRef.current = audioCtxRef.current.createMediaStreamDestination();
    localAudioSourceRef.current = audioCtxRef.current.createMediaStreamSource(localStreamRef.current);
    localAudioSourceRef.current.connect(audioDestRef.current);

    // Media Recorder
    const combinedStream = new MediaStream([
      ...screenStreamRef.current.getVideoTracks(),
      ...audioDestRef.current.stream.getAudioTracks()
    ]);
    mediaRecorderRef.current = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) uploadChunk(e.data);
    };
    mediaRecorderRef.current.onstop = () => checkUploads();
    mediaRecorderRef.current.start(10000);


    // Direct OpenAI Session Creation (Ported from start_session in app.py)
    try {
      // Build AI instructions based on interview type
      let instructions;

      if (codingFlag && !behavioralFlag) {
        // ── CODING-ONLY MODE ─────────────────────────────────────────────
        instructions = `You are an AI interviewer conducting a coding assessment.

=== STRICT BEHAVIOR ===
- Speak ONLY in English.
- Keep everything extremely brief and professional.
- Do NOT ask any behavioral, HR, or personal questions.
- Do NOT ask "tell me about yourself", "what are your strengths", or anything similar.
- Do NOT give long speeches or explanations.
- After your greeting, stay SILENT and wait. Do not speak again unless the candidate asks you something.

=== YOUR ONLY JOB ===
STEP 1 — Say this greeting EXACTLY (word for word, nothing more):
"Hello ${candidateName}, welcome to your coding assessment for the ${jobTitle} role. You have ${codingQuestions.length} coding question${codingQuestions.length > 1 ? 's' : ''} to solve. I have opened the coding editor for you. Please solve the problems there. You can switch between tasks in the sidebar. Good luck!"

STEP 2 — Stay completely silent. Do not talk again unless the candidate asks for help.

STEP 3 — When you receive the system notification that the candidate has submitted, say ONLY:
"Thank you, ${candidateName}. Your coding exam has been successfully submitted. We will review your solutions and get back to you. Best of luck! INTERVIEW_COMPLETE"

Nothing else. No evaluation. No extra feedback. No questions.
`;
      } else if (!codingFlag && behavioralFlag) {
        // ── BEHAVIORAL-ONLY MODE ─────────────────────────────────────────
        instructions = `You are a professional, warm, and conversational AI technical interviewer.
You are interviewing ${candidateName} for the role of ${jobTitle}.

=== INTERVIEW FLOW ===
1. BEHAVIORAL: Ask the following questions sequentially:
${questionsRef.current.map((q, i) => `${i + 1}. ${q}`).join('\n')}

=== YOUR BEHAVIOR RULES ===
1. GREETING: Greet ${candidateName} warmly. Mention the role (${jobTitle}). Then ask the first behavioral question.
2. LISTENING: After each answer, evaluate if it was clear. Ask follow-ups if needed.
3. ENDING: After the candidate answers the final question ("Do you have any questions for us?"), thank them warmly for their time and say exactly: "INTERVIEW_COMPLETE"
4. DO NOT read question numbers.
5. Speak only in English.
`;
      } else {
        // ── BEHAVIORAL + CODING MODE ─────────────────────────────────────
        instructions = `You are a professional, warm, and conversational AI technical interviewer.
You are interviewing ${candidateName} for the role of ${jobTitle}.

=== INTERVIEW FLOW ===
1. BEHAVIORAL: Ask the following questions first:
${questionsRef.current.map((q, i) => `${i + 1}. ${q}`).join('\n')}

2. CODING CHALLENGE: After the behavioral questions, you MUST inform the candidate that there are ${codingQuestions.length} coding tasks available for them to solve.
   
   Tasks to mention:
   ${codingQuestions.map((q, i) => `${i + 1}. ${q.title}`).join('\n')}

   - When you are ready for the candidate to write code, say exactly: "I have opened the coding editor for you. Please solve the problems there. You can switch between tasks in the sidebar."
   - Wait for them to complete the tasks.

3. EVALUATION:
   - When the candidate submits the code, evaluate their logic, correctness, and code quality.
   - Give them brief, constructive feedback on their submission.

=== YOUR BEHAVIOR RULES ===
1. GREETING: Greet ${candidateName} warmly. Mention the role (${jobTitle}). Then ask the first behavioral question.
2. LISTENING: After each answer, evaluate if it was clear. Ask follow-ups if needed.
3. TRANSITION: Move naturally between behavioral and coding sections.
4. ENDING: After giving feedback on the coding challenge, thank them for their time and say exactly: "INTERVIEW_COMPLETE"
5. DO NOT read question numbers.
6. Speak only in English.
`;
      }

      const realtimeModel = "gpt-realtime-mini";
      const realtimeVoice = "cedar";
      const realtimeTranscriptionModel = "gpt-4o-transcribe";
      realtimeSessionMetaRef.current = {
        model: realtimeModel,
        voice: realtimeVoice,
        transcription_model: realtimeTranscriptionModel
      };

      const tokenRes = await axios.post(`${PROCESS_TEXT_API_URL}/api/openai/realtime-token`, {
        instructions,
        candidateId: effectiveUserId,
        interview_link: getInterviewLinkForCost(),
        model: realtimeModel,
        voice: realtimeVoice,
        output_modalities: ["audio"],
        transcription_model: realtimeTranscriptionModel,
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 2000
        },
        additionalConfig: {}
      });

      const ephemeralKey = tokenRes.data?.value || tokenRes.data?.client_secret?.value;

      if (!ephemeralKey) {
        console.error("Realtime token response did not include a value:", tokenRes.data);
        throw new Error("No ephemeral realtime key returned from backend.");
      }

      await setupWebRTC(ephemeralKey);
    } catch (e) {
      alert("Failed to start session: " + e.message);
    }
  };

  const uploadChunk = async (blob) => {
    activeUploadsRef.current++;
    const formData = new FormData();
    formData.append('recording', blob, 'chunk.webm');
    formData.append('token', effectiveUserId);
    try {
      await axios.post(`${EXTERNAL_API_URL}/api/goodmood/recording/upload-recording`, formData);
    } catch (e) { console.error("Upload failed", e); }
    activeUploadsRef.current--;
  };

  const checkUploads = () => {
    if (activeUploadsRef.current > 0) {
      setTimeout(checkUploads, 1000);
    } else {
      setIsUploading(false);
    }
  };

  const setupWebRTC = async (ephemeralKey) => {
    pcRef.current = new RTCPeerConnection();

    pcRef.current.ontrack = (e) => {
      if (audioElRef.current) {
        audioElRef.current.srcObject = e.streams[0];

        // Mix remote AI audio into the recorded screen recording audio track.
        try {
          if (audioCtxRef.current && e.streams[0]) {
            const source = audioCtxRef.current.createMediaStreamSource(e.streams[0]);
            remoteAudioSourceRef.current = source;
            
            if (audioDestRef.current) {
              source.connect(audioDestRef.current);
            }

            // Setup Analyser
            const analyser = audioCtxRef.current.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            aiAnalyserRef.current = analyser;
          }
        } catch (err) {
          console.warn("Could not mix AI audio into recording & setup analyser:", err);
        }
      }
    };

    // GA Realtime WebRTC call should receive microphone audio.
    // Keep camera/screen for your UI, recording, and proctoring; do not send video track to Realtime here.
    localStreamRef.current.getAudioTracks().forEach((track) => {
      pcRef.current.addTrack(track, localStreamRef.current);
    });

    dcRef.current = pcRef.current.createDataChannel('oai-events');

    dcRef.current.onopen = () => {
      console.log("Realtime data channel opened");
      dcRef.current.send(JSON.stringify({
        type: 'response.create',
        response: { output_modalities: ['audio'] }
      }));
    };

    dcRef.current.onmessage = handleDataChannelMessage;

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);

    const sdpRes = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      body: offer.sdp,
      headers: {
        'Authorization': `Bearer ${ephemeralKey}`,
        'Content-Type': 'application/sdp'
      }
    });

    if (!sdpRes.ok) {
      const errorText = await sdpRes.text();
      console.error("Realtime SDP exchange failed:", errorText);
      throw new Error(`Realtime SDP exchange failed with status ${sdpRes.status}`);
    }

    const answerSdp = await sdpRes.text();
    await pcRef.current.setRemoteDescription({ type: 'answer', sdp: answerSdp });
  };

  const handleDataChannelMessage = (e) => {
    let evt;
    try {
      evt = JSON.parse(e.data);
    } catch (parseErr) {
      console.error("Could not parse Realtime event:", parseErr, e.data);
      return;
    }

    console.log("Realtime event:", evt.type, evt);
    captureRealtimeUsageFromEvent(evt);

    switch (evt.type) {
      case 'session.created':
      case 'session.updated':
        break;

      case 'response.created':
        setIsAiThinking(true);
        setIsAiTalking(false);
        setIsUserTalking(false);
        break;

      case 'response.output_audio_transcript.delta':
      case 'response.audio_transcript.delta':
      case 'response.output_text.delta':
        aiBufferRef.current += evt.delta || '';
        setIsAiTalking(true);
        setIsAiThinking(false);
        break;

      case 'response.output_audio_transcript.done':
      case 'response.audio_transcript.done':
      case 'response.output_text.done': {
        const finalText = (evt.transcript || evt.text || aiBufferRef.current || '').trim();

        if (finalText) {
          addMessage('ai', finalText);

          // Strict INTERVIEW_COMPLETE check — must be the exact signal phrase
          // Use word boundary match to avoid false triggers from phrases like
          // "complete the coding task" or "interview is complete"
          const isInterviewDone = /\bINTERVIEW_COMPLETE\b/.test(finalText);
          if (isInterviewDone) {
            isFinalizingRef.current = true;
            setTimeout(() => {
              if (isFinalizingRef.current) {
                isFinalizingRef.current = false;
                finishInterview();
              }
            }, 12000); // 12-second safety timeout
          }

          if (isCodingRoundEnabled) {
            const lowerText = finalText.toLowerCase();
            if (
              lowerText.includes('welcome to your coding assessment') ||
              lowerText.includes('opened the coding editor') ||
              lowerText.includes('coding task') ||
              lowerText.includes('write a function') ||
              lowerText.includes('solve the problems')
            ) {
              const qs = codingQuestionsRef.current;
              const idx = currentIdxRef.current;

              if (qs[idx]) {
                console.log("Triggering Coding Mode with active task:", qs[idx].title);
                setCodingTask(qs[idx].problemStatement);
                setLanguage(qs[idx].language);
                setCode(qs[idx].starterCode);
                setIsCodingMode(true);
                setIsMicDisabled(true);
                setIsSpeakerMuted(true);

                // Play intro sound
                const audio = new Audio('/coding_intro.m4a');
                audio.play().catch(e => console.error("Failed to play intro audio:", e));
              }
            }
          }
        }

        aiBufferRef.current = '';
        break;
      }

      case 'conversation.item.input_audio_transcription.completed':
      case 'input_audio_transcription.completed': {
        const transcript = (evt.transcript || evt.item?.content?.[0]?.transcript || '').trim();
        if (transcript) addMessage('user', transcript);
        if (realtimeCandidateSpeechStartedAtRef.current) {
          realtimeCandidateAudioMsRef.current += Date.now() - realtimeCandidateSpeechStartedAtRef.current;
          realtimeCandidateSpeechStartedAtRef.current = null;
        }
        setIsUserTalking(false);
        break;
      }

      case 'input_audio_buffer.speech_started':
        // Candidate started speaking; AI can be interrupted by server VAD.
        realtimeCandidateSpeechStartedAtRef.current = Date.now();
        setIsAiThinking(false);
        setIsUserTalking(true);
        break;

      case 'input_audio_buffer.speech_stopped':
        if (realtimeCandidateSpeechStartedAtRef.current) {
          realtimeCandidateAudioMsRef.current += Date.now() - realtimeCandidateSpeechStartedAtRef.current;
          realtimeCandidateSpeechStartedAtRef.current = null;
        }
        setIsAiThinking(true);
        setIsAiTalking(false);
        break;

      case 'response.done':
        setIsAiTalking(false);
        setIsAiThinking(false);
        break;

      case 'error':
        console.error("Realtime API error:", evt.error || evt);
        setErrorMessage(evt.error?.message || "Realtime API error");
        break;

      default:
        break;
    }
  };

  const addMessage = (who, text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { who, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setTimeout(() => { if (convoRef.current) convoRef.current.scrollTop = convoRef.current.scrollHeight; }, 100);
  };

  useEffect(() => {
    if (status === 'done' && isCodingRoundEnabled) {
      axios.get(`${PROCESS_TEXT_API_URL}/api/v1/coding-interview/analyze?token=${effectiveUserId}`)
        .then(response => {
          console.log("Coding interview analyze response:", response.data);
        })
        .catch(error => {
          console.error("Failed to analyze coding interview:", error);
        });
    }
  }, [status, isCodingRoundEnabled, effectiveUserId]);

  const finishInterview = () => {
    finalizeRealtimeCost();
    setStatus('done');
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current.stop();
    if (pcRef.current) pcRef.current.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
  };

  const checkLanguageLock = (q) => {
    if (!q) return false;
    if (q.isLanguageSpecific) return true;

    const text = (q.problemStatement || "").toLowerCase();
    const title = (q.title || "").toLowerCase();
    const lang = (q.language || "").toLowerCase();

    // Logic: If title contains language name AND (text contains "only" or "must")
    const lockPhrases = ["only solve in", "must use", "specifically in", "only in", "required to use", "use only"];
    const hasLockPhrase = lockPhrases.some(phrase => text.includes(phrase));

    // Heuristic: If it's a DSA question (generic titles usually don't mention a language), we allow change.
    // If the backend specifically said "java" but the description is generic, we allow change.
    return hasLockPhrase;
  };

  const isCurrentQuestionLocked = checkLanguageLock(codingQuestions[currentQuestionIdx]);

  const toggleMic = () => {
    const next = !isMicMuted;
    setIsMicMuted(next);
    localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = !next);
  };

  const toggleCamera = () => {
    const next = !isCameraActive;
    setIsCameraActive(next);
    localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = next);
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    const cacheKey = `${currentQuestionIdx}_${language}`;
    setCodeCaches(prev => ({ ...prev, [cacheKey]: code }));

    // ISOLATION: When language changes, we clear execution history for this task 
    // to prevent mixing errors from different languages.
    setExecutionHistory(prev => ({ ...prev, [`${currentQuestionIdx}_${newLang}`]: [] }));

    const nextCode = codeCaches[`${currentQuestionIdx}_${newLang}`] !== undefined
      ? codeCaches[`${currentQuestionIdx}_${newLang}`]
      : boilerplates[newLang];

    setCode(nextCode);
    setLanguage(newLang);
    setConsoleOutput(`Language switched to ${newLang.toUpperCase()}. Console reset.\n`);
  };

  const switchToQuestion = (idx) => {
    // Save current question state
    setCodeCaches(prev => ({ ...prev, [`${currentQuestionIdx}_${language}`]: code }));

    // Switch
    const nextQ = codingQuestions[idx];
    const savedCode = codeCaches[`${idx}_${nextQ.language}`];

    setCurrentQuestionIdx(idx);
    setCodingTask(nextQ.problemStatement);
    setLanguage(nextQ.language);
    setCode(savedCode !== undefined ? savedCode : nextQ.starterCode);
    setConsoleOutput('');
  };

  const runCode = async () => {
    setIsRunning(true);
    setConsoleOutput('Compiling & Running...\n');

    try {
      const currentQ = codingQuestions[currentQuestionIdx];
      const historyKey = `${currentQuestionIdx}_${language}`;
      const historyForLang = executionHistory[historyKey] || [];
      const historyContext = historyForLang.length > 0
        ? `\n\nContext - The user previously ran these commands in this exact session for this specific task:\n${historyForLang.map((h, i) => `[Execution ${i + 1}]\nCode:\n${h.code}\nOutput:\n${h.output}`).slice(-5).join('\n\n')}\n\nMaintain this state.`
        : '';

      const testCaseStr = (currentQ.testCases || []).map((tc, i) => `Test Case ${i + 1}: Input: ${tc.input}, Expected: ${tc.expected || tc.expectedOutput}`).join('\n');

      const prompt = `You are a strict, secure compiler and execution environment for ${language}. 
      Task: ${currentQ.title}

      CRITICAL PRODUCTION RULES:
      1. SYNTAX CHECK: Before running test cases, check for syntax errors. If found, return { "status": "FAIL", "explanation": "COMPILATION ERROR: [Detailed syntax error description]" }.
      2. DETECT CHEATING: If the candidate hardcodes expected values instead of an algorithm, return { "status": "FAIL", "explanation": "CHEATING DETECTED: Hardcoded results" }.
      3. TEST DATA: If syntax is correct, simulate execution against ALL provided Test Cases.

      Respond ONLY in the following JSON format:
      {
        "status": "PASS" | "FAIL",
        "passed_count": "number/total",
        "explanation": "Clear reason for pass/fail (e.g., Compilation Error vs. Logic Error)",
        "test_results": [
          { "id": 1, "status": "PASS" | "FAIL", "input": "...", "expected": "...", "actual": "..." }
        ]
      }
      
      Test Cases to satisfy:
      ${testCaseStr}
      
      Code to evaluate:
      ${code}

      ${historyContext}`;

      const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      }, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const simulatedOutput = res.data.choices[0]?.message?.content || '{}';
      let parsed;
      try {
        parsed = JSON.parse(simulatedOutput.substring(simulatedOutput.indexOf('{'), simulatedOutput.lastIndexOf('}') + 1));
      } catch (e) {
        setConsoleOutput(prev => prev + '\n' + simulatedOutput);
        return;
      }

      const isPassed = parsed.status === 'PASS';
      const passedCount = parsed.passed_count;

      setTestResults(parsed.test_results || []);
      setConsoleOutput(prev => prev + '\n' + (parsed.explanation || (isPassed ? "Tests Passed Successfully" : "Some tests failed.")));

      const total = currentQ.testCases?.length || 0;
      const passedMatch = passedCount?.split('/')[0] || 0;

      setTasksResults(prev => ({
        ...prev,
        [currentQuestionIdx]: { passed: isPassed, count: `${passedMatch}/${total}` }
      }));

      setExecutionHistory(prev => ({
        ...prev,
        [historyKey]: [...(prev[historyKey] || []), { code, output: JSON.stringify(parsed) }]
      }));
    } catch (e) {
      console.error("Execution error:", e);
      setConsoleOutput(prev => prev + '\nExecution Failed. ' + (e.response?.data?.error?.message || e.message));
    } finally {
      setIsRunning(false);
      // Mark this question as having been run at least once
      setHasRunCode(prev => ({ ...prev, [currentQuestionIdx]: true }));
    }
  };

  // Auto-submit using refs (safe to call from timers/event handlers outside React render)
  const confirmSubmitCodeAuto = async () => {
    const currentCode = codeRef.current;
    const currentIdx = currentIdxRef.current;
    const currentCaches = codeCachesRef.current;
    const currentTimeLeft = timeLeftRef.current;
    const currentTasksResults = tasksResultsRef.current;
    const questions = codingQuestionsRef.current;

    setShowSubmitConfirm(false);

    const submissionData = questions.map((q, idx) => {
      const result = currentTasksResults[idx];
      const savedCode = idx === currentIdx ? currentCode : (currentCaches[`${idx}_${q.language}`] || q.starterCode);
      return {
        question: q,
        idx,
        savedCode,
        isPassed: result?.passed,
        testCount: result?.count || '0'
      };
    });

    try {
      let accumulatedAnswers = [];
      let generatedId = null;
      for (let i = 0; i < submissionData.length; i++) {
        const data = submissionData[i];
        const currentAnswerObj = {
          taskNumber: data.idx + 1,
          questionDetails: {
            title: data.question.title,
            difficulty: data.question.difficulty,
            problemStatement: data.question.problemStatement || "N/A",
            constraints: data.question.constraints || [],
            hints: data.question.hints || []
          },
          candidateAnswer: {
            techStack: data.question.language,
            submittedCode: data.savedCode
          },
          evaluation: {
            status: data.isPassed ? "PASSED" : "FAILED",
            testCasesPassed: data.testCount,
            totalTestCases: data.question.testCases ? data.question.testCases.length : 0,
            testCasesDetails: data.question.testCases || []
          },
          timeData: {
            timeRemainingSeconds: currentTimeLeft,
            submittedAt: new Date().toLocaleString()
          }
        };
        accumulatedAnswers.push(currentAnswerObj);
        const payload = {
          token: effectiveUserId,
          questionId: data.question.id || data.question.questionId || (data.idx + 1),
          ans: JSON.stringify(accumulatedAnswers, null, 2)
        };
        if (generatedId) payload.id = generatedId;
        const response = await axios.post(`${EXTERNAL_API_URL}/api/aiinterview/coding/ans/save`, payload);
        if (i === 0) generatedId = response.data?.data?.id;
      }
      console.log("Auto-submit: All coding answers saved.");
    } catch (error) {
      console.error("Auto-submit failed to save answers:", error);
    }

    const summary = submissionData.map(data => {
      const codeSnippet = data.savedCode.length > 1000
        ? data.savedCode.substring(0, 1000) + "\n... [Code Truncated for Length]"
        : data.savedCode;
      return `Task ${data.idx + 1} (${data.question.title}): ${data.isPassed ? 'PASSED' : 'FAILED'} [${data.testCount} Tests]\nLanguage: ${data.question.language}\nSolution:\n${codeSnippet}`;
    }).join('\n---\n');

    setIsMicDisabled(true);
    setIsSpeakerMuted(true);

    // Play end sound
    const audio = new Audio('/coding_end.m4a');
    audio.play().catch(e => console.error("Failed to play end audio:", e));

    if (isCodingRoundEnabledRef.current && !isBehavioralRoundEnabledRef.current) {
      finishInterview();
      return;
    }

    if (dcRef.current?.readyState === 'open') {
      dcRef.current.send(JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message", role: "user",
          content: [{ type: "input_text", text: `[SYSTEM NOTIFICATION: CODING ROUND AUTO-SUBMITTED]
The candidate's time expired or the session was interrupted. Their code has been saved automatically.

AI Interviewer Action:
- Say ONLY this message, word for word:
  "Thank you, ${candidateName}. Your coding exam has been automatically submitted as your time has ended. We will review your solutions and get back to you. Best of luck! INTERVIEW_COMPLETE"
- Do NOT evaluate. Do NOT ask questions. Just say the message above.` }]
        }
      }));
      dcRef.current.send(JSON.stringify({ type: "response.create", response: { output_modalities: ["audio"] } }));
    }

    setIsCodingMode(false);
  };

  const confirmSubmitCode = async () => {
    setShowSubmitConfirm(false);

    // 1. Prepare data for both AI and Database
    const submissionData = codingQuestions.map((q, idx) => {
      const result = tasksResults[idx];
      const savedCode = idx === currentQuestionIdx ? code : (codeCaches[`${idx}_${q.language}`] || q.starterCode);
      const isPassed = result?.passed;

      return {
        question: q,
        idx,
        savedCode,
        isPassed,
        testCount: result?.count || '0'
      };
    });

    // 2. Save answers to the Spring Boot Backend sequentially and accumulate answers
    try {
      let accumulatedAnswers = [];
      let generatedId = null;

      for (let i = 0; i < submissionData.length; i++) {
        const data = submissionData[i];

        // 🌟 FULLY DETAILED & CLEAN JSON OBJECT FOR BACKEND DEVS 🌟
        const currentAnswerObj = {
          taskNumber: data.idx + 1,
          questionDetails: {
            title: data.question.title,
            difficulty: data.question.difficulty,
            // 👈 Etai holo asol boro question ta (Problem Statement)
            problemStatement: data.question.problemStatement || "N/A",
            constraints: data.question.constraints || [],
            hints: data.question.hints || []
          },
          candidateAnswer: {
            techStack: data.question.language,
            submittedCode: data.savedCode
          },
          evaluation: {
            status: data.isPassed ? "PASSED" : "FAILED",
            testCasesPassed: data.testCount,
            totalTestCases: data.question.testCases ? data.question.testCases.length : 0,
            // 👈 Developer er bojhar jonno full test case er list
            testCasesDetails: data.question.testCases || []
          },
          timeData: {
            timeRemainingSeconds: timeLeft,
            submittedAt: new Date().toLocaleString()
          }
        };

        // Purono answers er sathe notun clean object ta add kora hocche
        accumulatedAnswers.push(currentAnswerObj);

        // Payload toiri (JSON.stringify(..., null, 2) deway backend e dekhte sundar hobe)
        const payload = {
          token: effectiveUserId,
          questionId: data.question.id || data.question.questionId || (data.idx + 1),
          ans: JSON.stringify(accumulatedAnswers, null, 2)
        };

        // 1st call er por ID thakle seta add kora hocche
        if (generatedId) {
          payload.id = generatedId;
        }

        // API Call
        const response = await axios.post(`${EXTERNAL_API_URL}/api/aiinterview/coding/ans/save`, payload);

        // ID save
        if (i === 0) {
          generatedId = response.data?.data?.id;
          console.log("1st coding answer saved. Received ID:", generatedId);
        } else {
          console.log(`Coding answer ${i + 1} saved successfully.`);
        }
      }

      console.log("All coding answers successfully saved to DB sequentially.");
    } catch (error) {
      console.error("Failed to save coding answers:", error);
    }

    // 3. Generate summary for the AI
    const summary = submissionData.map(data => {
      const codeSnippet = data.savedCode.length > 1000
        ? data.savedCode.substring(0, 1000) + "\n... [Code Truncated for Length]"
        : data.savedCode;

      return `Task ${data.idx + 1} (${data.question.title}): ${data.isPassed ? 'PASSED' : 'FAILED'} [${data.testCount} Tests]
Language: ${data.question.language}
Solution:
${codeSnippet}`;
    }).join('\n---\n');

    addMessage('user', `Status Update: I have submitted my coding solutions.`);

    // 4. Send instructions to the AI via WebRTC Data Channel
    setIsMicDisabled(true);
    setIsSpeakerMuted(true);

    // Play end sound
    const audio = new Audio('/coding_end.m4a');
    audio.play().catch(e => console.error("Failed to play end audio:", e));

    if (isCodingRoundEnabledRef.current && !isBehavioralRoundEnabledRef.current) {
      finishInterview();
      return;
    }

    if (dcRef.current?.readyState === 'open') {
      dcRef.current.send(JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{
            type: "input_text",
            text: `[SYSTEM NOTIFICATION: CODING SUBMISSION RECEIVED]
The candidate has submitted all their coding solutions.

AI Interviewer Action:
- Say ONLY this message, word for word, nothing more:
  "Thank you, ${candidateName}. Your coding exam has been successfully submitted. We will review your solutions and get back to you. Best of luck! INTERVIEW_COMPLETE"
- Do NOT evaluate the code. Do NOT give feedback. Do NOT ask questions. Just say the message above.`
          }]
        }
      }));
      dcRef.current.send(JSON.stringify({
        type: "response.create",
        response: { output_modalities: ["audio"] }
      }));
    }

    // 5. Exit coding mode
    setIsCodingMode(false);
  };

  // Renderers
  if (status === 'error') return (
    <div className="meet-fullscreen-wrapper screen-error">
      <AlertCircle size={64} color="#ea4335" />
      <h1>Access Denied</h1>
      <p>{errorMessage}</p>
    </div>
  );

  if (status === 'already_completed') return (
    <div className="meet-fullscreen-wrapper screen-done" style={{ background: 'linear-gradient(135deg, #1e1e1e 0%, #121212 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
      <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '40px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <CheckCircle2 size={72} color="#34a853" style={{ marginBottom: '20px', filter: 'drop-shadow(0 0 10px rgba(52,168,83,0.5))' }} />
        <h1 style={{ color: '#ffffff', fontSize: '2.5rem', margin: '0 0 15px 0', fontWeight: '600' }}>Interview Completed</h1>
        <p style={{ color: '#a8c7fa', fontSize: '1.2rem', maxWidth: '500px', margin: '0 auto 30px auto', lineHeight: '1.6' }}>
          You have already successfully completed this interview session. Your responses have been recorded and are being evaluated.
        </p>
        {/* <button
          className="btn-return"
          onClick={() => window.location.href = '/'}
          style={{ padding: '12px 30px', fontSize: '1.1rem', background: '#4285f4', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(66,133,244,0.3)' }}
          onMouseOver={(e) => e.target.style.background = '#3b78e7'}
          onMouseOut={(e) => e.target.style.background = '#4285f4'}
        >
          Return Home
        </button> */}
      </div>
    </div>
  );

  if (status === 'done') return (
    <div className="meet-fullscreen-wrapper screen-done">
      <h2>Meeting Ended</h2>
      <p>Thank you, <strong>{candidateName}</strong>. Your responses have been securely recorded.</p>
      {isUploading ? (
        <>
          <p>Please wait while we finish uploading your recording...</p>
          <div className="upload-spinner" />
        </>
      ) : (
        <CheckCircle2 size={48} color="#8ab4f8" />
      )}
      <button className="btn-return" onClick={() => window.location.reload()}>Return Home</button>
    </div>
  );

  return (
    <div className="meet-fullscreen-wrapper">
      {/* --- Run First Alert Modal --- */}
      {showRunFirstAlert && (
        <div className="submit-confirm-overlay">
          <div className="submit-confirm-box run-first-alert">
            <div className="run-first-icon">🚫</div>
            <h2 style={{ color: '#ea4335' }}>Code Not Tested Yet!</h2>
            <p>
              You must click the <strong>▶ Run</strong> button at least once to test your code before submitting.
              <br /><br />
              This is required by the system — no submission will be accepted without running the code first.
            </p>
            <div className="submit-confirm-actions">
              <button
                className="btn-confirm"
                style={{ background: 'linear-gradient(135deg, #4285f4, #1a73e8)', minWidth: 160 }}
                onClick={() => setShowRunFirstAlert(false)}
              >
                Got it — Let me Run first!
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- Submit Confirmation Popup  --- */}
      {showSubmitConfirm && (
        <div className="submit-confirm-overlay">
          <div className="submit-confirm-box">
            <AlertCircle size={56} color="#fbbc04" />
            <h2>Final Submission?</h2>
            <p>
              Are you sure you want to submit your answers? <br />
              Once submitted, the coding round will end immediately and you will not be able to modify your code.
            </p>
            <div className="submit-confirm-actions">
              <button className="btn-cancel" onClick={() => setShowSubmitConfirm(false)}>
                No, Keep Coding
              </button>
              <button className="btn-confirm" onClick={confirmSubmitCode}>
                Yes, Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
      {showWarning && (
        <div className="cheat-warning-overlay">
          <AlertCircle size={64} color="#ea4335" />
          <h1 style={{ color: '#ea4335' }}>PROCTOR WARNING</h1>
          <p>{warningReason}</p>
          <p>Warning ({warningCount}/2). Another violation will end the interview.</p>
          <button className="btn-meet-join" style={{ background: '#ea4335', color: 'white' }} onClick={resumeFromWarning}>
            I Understand - Return
          </button>
        </div>
      )}

      {status === 'welcome' && !hasAcceptedRules && (
        <div className="screen-rules-intro">
          <div className="rules-card">
            <div className="rules-header">
              <h2>Important Instructions</h2>
              <p>Please review and acknowledge the guidelines below to proceed to the interview for <strong>{jobTitle}</strong>.</p>
            </div>
            
            <div className="rules-list">
              <div className="rule-item-card">
                <div className="rule-icon-box">
                  <Info size={22} />
                </div>
                <div className="rule-info">
                  <h3>Quiet Environment</h3>
                  <p>You must sit in a quiet, noise-free room with no other people present.</p>
                </div>
              </div>

              <div className="rule-item-card">
                <div className="rule-icon-box">
                  <Video size={22} />
                </div>
                <div className="rule-info">
                  <h3>Camera Visibility & Lighting</h3>
                  <p>Ensure there is sufficient lighting in the room so the camera can clearly capture your face.</p>
                </div>
              </div>

              {isBehavioralRoundEnabled && (
                <div className="rule-item-card">
                  <div className="rule-icon-box">
                    <Mic size={22} />
                  </div>
                  <div className="rule-info">
                    <h3>No Background Noise</h3>
                    <p>Apart from your voice, there should be no background noise or ambient talking.</p>
                  </div>
                </div>
              )}

              <div className="rule-item-card">
                <div className="rule-icon-box">
                  <AlertCircle size={22} color="#ea4335" />
                </div>
                <div className="rule-info">
                  <h3>Strict Tab & Screen Monitoring</h3>
                  <p>Switching tabs, exiting fullscreen, or opening another window during the exam will terminate your interview immediately.</p>
                </div>
              </div>
            </div>

            <div className="rules-agreement-section">
              <label className={`agreement-label-card ${agreedToTerms ? 'checked' : ''}`}>
                <div className="rule-checkbox-wrapper">
                  <input
                    id="chk-agreeToTerms"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <span className="checkbox-custom"></span>
                </div>
                <span className="agreement-text">
                  I have read and agree to all the instructions and guidelines listed above.
                </span>
              </label>
            </div>

            <div className="rules-actions">
              <button 
                id="btn-accept-rules"
                className="btn-accept-rules"
                disabled={!agreedToTerms}
                onClick={() => setHasAcceptedRules(true)}
              >
                Accept & Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {status === 'welcome' && hasAcceptedRules && (
        <div className="screen-welcome">
          <div className="meet-preview-box">
            <div className="avatar">👤</div>
            <div className="preview-text">Camera required for Interview</div>
          </div>
          <div className="meet-join-area">
            <h1>Ready to join?</h1>
            <p>Role: <strong>{jobTitle}</strong><br /><br />You must share your entire screen and allow Mic and Camera access to proceed.</p>
            <button className="btn-meet-join" onClick={startInterview}>Join now</button>
          </div>
        </div>
      )}

      {status === 'interviewing' && (
        <div className="screen-interview">
          <div className="meet-workspace">
            <div className="meet-main-stage">
              {isCodingMode ? (
                <div className="coding-container">
                  <div className="coding-header">
                    <div className="task-info">
                      <Code size={18} />
                      <span>Talent Fold Coding Tasks</span>
                      {timeLeft > 0 && (
                        <div className={`timer-badge ${timeLeft < 300 ? 'urgent' : ''}`}>
                          Time remaining: {formatTimeLeft(timeLeft)}
                        </div>
                      )}
                    </div>
                    <div className="language-selector">
                      <select
                        value={language}
                        onChange={handleLanguageChange}
                        disabled={isCurrentQuestionLocked}
                        title={isCurrentQuestionLocked ? `This task is restricted to ${codingQuestions[currentQuestionIdx].language}` : "Change Language"}
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="go">Golang</option>
                        <option value="cpp">C++</option>
                        <option value="c">C</option>
                        <option value="csharp">C#</option>
                        <option value="perl">Perl</option>
                        <option value="swift">Swift</option>
                        <option value="kotlin">Kotlin</option>
                        <option value="php">PHP</option>
                        <option value="ruby">Ruby</option>
                        <option value="r">R Language</option>
                        <option value="sql">MySQL</option>
                        <option value="mongodb">MongoDB</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                      </select>
                    </div>
                    <div className="coding-actions">
                      <button className="run-btn" onClick={runCode} disabled={isRunning}>
                        {isRunning ? <div className="upload-spinner" style={{ width: 14, height: 14 }} /> : <Play size={16} />}
                        Run
                      </button>
                      {/* <button className="submit-btn" onClick={submitCode}>
                        <Send size={16} />
                        Submit
                      </button> */}
                      <button
                        className="submit-btn"
                        onClick={() => {
                          // Block submit if no run has been done for ANY question
                          const anyRunDone = codingQuestions.some((_, idx) => hasRunCodeRef.current[idx]);
                          if (!anyRunDone) {
                            setShowRunFirstAlert(true);
                          } else {
                            setShowSubmitConfirm(true);
                          }
                        }}
                      >
                        <Send size={16} />
                        Submit
                      </button>
                    </div>
                  </div>
                  <div className="editor-main">
                    <div className="task-sidebar">
                      <div className="task-list-nav">
                        {codingQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            className={`task-nav-item ${idx === currentQuestionIdx ? 'active' : ''} ${tasksResults[idx]?.passed ? 'passed' : ''}`}
                            onClick={() => switchToQuestion(idx)}
                          >
                            <span className="task-num">Question {idx + 1}</span>
                            {tasksResults[idx]?.passed && <CheckCircle2 size={14} color="#34a853" />}
                          </button>
                        ))}
                      </div>

                      <div className="task-meta-header" style={{ marginTop: '15px' }}>
                        <Trophy size={16} color="#ffd700" />
                        <span>{codingQuestions[currentQuestionIdx].difficulty}</span>
                        {codingQuestions[currentQuestionIdx].language && (
                          <span className="lang-tag">{codingQuestions[currentQuestionIdx].language}</span>
                        )}
                      </div>
                      <h3>{codingQuestions[currentQuestionIdx].title}</h3>
                      <p>{codingTask || "Please solve the problem described by the interviewer."}</p>

                      {codingQuestions[currentQuestionIdx].constraints && codingQuestions[currentQuestionIdx].constraints.length > 0 && (
                        <div className="task-meta-section">
                          <h4>Constraints</h4>
                          <ul className="meta-list">
                            {codingQuestions[currentQuestionIdx].constraints.map((c, idx) => <li key={idx}>{c}</li>)}
                          </ul>
                        </div>
                      )}

                      {codingQuestions[currentQuestionIdx].hints && codingQuestions[currentQuestionIdx].hints.length > 0 && (
                        <div className="task-meta-section">
                          <h4>Hints</h4>
                          {codingQuestions[currentQuestionIdx].hints.map((h, idx) => (
                            <details key={idx} className="hint-details">
                              <summary>Hint {idx + 1}</summary>
                              <p>{h}</p>
                            </details>
                          ))}
                        </div>
                      )}

                      <div className="test-cases-hacker">
                        <div className="tc-grid-header">
                          <h4>Test Cases ({tasksResults[currentQuestionIdx]?.count || `0/${codingQuestions[currentQuestionIdx].testCases?.length || 0}`})</h4>
                          <span className="tc-mode-tag">Simulated Environment</span>
                        </div>
                        <div className="tc-grid">
                          {(testResults.length > 0 ? testResults : Array(codingQuestions[currentQuestionIdx].testCases?.length || 0).fill(null)).map((res, i) => (
                            <div
                              key={i}
                              className={`tc-box ${res === null ? 'pending' : (res.status === 'PASS' ? 'pass' : 'fail')}`}
                              title={res ? `Input: ${res.input}\nExpected: ${res.expected}\nActual: ${res.actual}` : `Test Case ${i + 1}`}
                            >
                              {i}
                            </div>
                          ))}
                        </div>
                        {consoleOutput && (
                          <div className="console-area-mini">
                            <pre className={consoleOutput.includes('FAIL') ? 'error-text' : ''}>{consoleOutput}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="editor-wrapper">
                      <Editor
                        height="100%"
                        language={language === 'mongodb' ? 'javascript' : language}
                        theme="vs-dark"
                        value={code}
                        onChange={(val) => setCode(val)}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          automaticLayout: true,
                        }}
                      />
                    </div>
                  </div>
                  {/* Floating AI Video during coding */}
                  <div className="ai-floating-pip">
                    <div className={`ai-avatar-wrapper small ${isAiTalking ? 'ai-talking' : ''} ${isAiThinking ? 'ai-thinking' : ''}`}>
                      <div className="ai-ring" />
                      <div className="ai-avatar" style={{ width: 60, height: 60, fontSize: '1.5rem' }}>🤖</div>
                    </div>
                    {isAiThinking && <div className="thinking-bubble">Thinking...</div>}
                  </div>
                </div>
              ) : (
                <>
                  <video ref={videoRef} className="full-stage-video" autoPlay muted playsInline />
                  <div className="video-status"><span>●</span> REC</div>
                  <div className="interview-fold-floating-container">
                    <div className="pip-header">
                      {isAiThinking ? (
                        <span className="pip-thinking-tag">Thinking...</span>
                      ) : (
                        <span />
                      )}
                      <Mic size={16} className="pip-mic-icon" />
                    </div>

                    <div className={`waveform ${isAiTalking || isAiThinking ? 'active' : ''}`}>
                      <span className="bar"></span>
                      <span className="bar"></span>
                      <span className="bar"></span>
                      <span className="bar"></span>
                      <span className="bar"></span>
                      <span className="bar"></span>
                      <span className="bar"></span>
                      <span className="bar"></span>
                      <span className="bar"></span>
                      <span className="bar"></span>
                      <span className="bar"></span>
                    </div>

                    <div className="interview-fold-logo">InterviewFold</div>
                  </div>
                </>
              )}
              {isCodingMode && (
                <div className="self-video-container">
                  <video ref={videoRef} autoPlay muted playsInline />
                </div>
              )}
            </div>

            {!isCodingMode && (
              <div className="meet-sidebar">
                <div className="sidebar-header">
                  In-call messages
                  <MessageSquare size={20} />
                </div>
                <div className="sidebar-notice">
                  <Info size={16} color="#8ab4f8" style={{ marginTop: 4 }} />
                  <div>
                    <strong>Continuous chat sync is ON</strong><br />
                    Transcripts are saved automatically.
                  </div>
                </div>
                <div className="convo" ref={convoRef}>
                  {messages.map((m, i) => (
                    <div key={i} className={`chat-bubble-wrapper ${m.who}`}>
                      <div className="chat-bubble-header">
                        <span className="chat-bubble-who">
                          {m.who === 'ai' ? 'Reed Stone - AI Interviewer' : candidateName}
                        </span>
                        <span className="chat-bubble-time">{m.time}</span>
                      </div>
                      <div className="chat-bubble-body">
                        {m.text}
                      </div>
                    </div>
                  ))}

                  {isUserTalking && (
                    <div className="chat-bubble-wrapper user typing">
                      <div className="chat-bubble-header">
                        <span className="chat-bubble-who">{candidateName}</span>
                        <span className="chat-bubble-time">Speaking...</span>
                      </div>
                      <div className="chat-bubble-body user-typing-bubble">
                        <div className="typing-dots-bubble">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="chat-input-area">
                  <div className="chat-fake-input">
                    Voice answers only...
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="meet-bottom-bar">
            <div className="bottom-left">
              {currentTime} | {effectiveUserId?.substring(0, 12)}
            </div>
            <div className="bottom-center">
              <button
                className={`meet-btn ${isMicMuted || isMicDisabled ? 'danger' : ''}`}
                onClick={isMicDisabled ? null : toggleMic}
                disabled={isMicDisabled}
                style={isMicDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                {isMicMuted || isMicDisabled ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <button
                className={`meet-btn ${!isCameraActive ? 'danger' : ''}`}
                onClick={toggleCamera}
              >
                {isCameraActive ? <Video size={22} /> : <VideoOff size={22} />}
              </button>
              <button className="meet-btn active">
                <ScreenShare size={20} />
              </button>
              <button className="meet-btn-end" onClick={finishInterview}>
                <PhoneOff size={26} />
              </button>
            </div>
            <div className="bottom-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {isCodingRoundEnabled && (
                <button
                  className={`meet-btn ${isCodingMode ? 'active' : ''}`}
                  onClick={() => {
                    if (isCodingRoundEnabledRef.current && !isBehavioralRoundEnabledRef.current) {
                      // Prevent toggling out of coding mode if it's coding-only
                      return;
                    }
                    const nextMode = !isCodingMode;
                    setIsCodingMode(nextMode);
                    if (!nextMode) {
                      setIsMicDisabled(false);
                      setIsSpeakerMuted(false);
                    } else {
                      setIsMicDisabled(true);
                      setIsSpeakerMuted(true);
                    }
                  }}
                  title="Toggle Coding Editor (Test Mode)"
                >
                  <Code size={20} />
                </button>
              )}
              <Info size={24} style={{ cursor: 'pointer' }} />
              <Users size={24} style={{ cursor: 'pointer' }} />
              <MessageSquare size={24} color="#8ab4f8" style={{ cursor: 'pointer' }} />
            </div>
          </div>
          <audio ref={audioElRef} autoPlay style={{ display: 'none' }} muted={isSpeakerMuted} />
        </div>
      )}
    </div>
  );
};

export default MeetPage;
