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
  const [warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningReason, setWarningReason] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [isUploading, setIsUploading] = useState(true);
  const [isCodingRoundEnabled, setIsCodingRoundEnabled] = useState(true);

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

  const codingQuestionsRef = useRef(codingQuestions);
  const currentIdxRef = useRef(currentQuestionIdx);

  useEffect(() => {
    codingQuestionsRef.current = codingQuestions;
  }, [codingQuestions]);

  useEffect(() => {
    currentIdxRef.current = currentQuestionIdx;
  }, [currentQuestionIdx]);
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
  const videoRef = useRef(null);
  const audioElRef = useRef(null);
  const convoRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const activeUploadsRef = useRef(0);
  const jobDataRef = useRef({ experience: 'N/A', mandatorySkills: '', niceToHaveSkills: '' });
  const questionsRef = useRef([]);


  // Initial Data Fetch
  useEffect(() => {
    const fetchInitialData = async () => {
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
        setErrorMessage("Connection to interview servers failed.");
        setStatus('error');
      }
    };

    if (effectiveUserId) fetchInitialData();
  }, [effectiveUserId]);

  // Countdown Timer logic
  useEffect(() => {
    if (status !== 'interviewing' || timeLeft <= 0) {
      if (timeLeft <= 0 && status === 'interviewing') {
        // GLOBAL TIMEOUT: Submit whatever is currently in the editor and end.
        if (isCodingMode) submitCode();
        else finishInterview();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeLeft, isCodingMode]);

  const formatTimeLeft = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

    const handleVisibilityChange = () => {
      if (document.hidden) triggerViolation("Candidate switched tabs.");
    };
    const handleWindowBlur = () => {
      triggerViolation("Candidate clicked outside window.");
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !showWarning) triggerViolation("Exited full-screen.");
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
    };
  }, [status, showWarning, isCodingMode]); // Re-added isCodingMode to dependencies

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
      await axios.post(`${EXTERNAL_API_URL}/analysis/ai/`, { token: effectiveUserId, analysis: JSON.stringify(res.data) });
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
      dcRef.current.send(JSON.stringify({ type: "response.create" }));
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

    try {
      const typeResponse = await axios.get(`${EXTERNAL_API_URL}/api/goodmood/interview/get/token/interview/type?token=${effectiveUserId}`);
      console.log("Interview Type Response:", typeResponse.data);

      const typeData = typeResponse.data?.data;
      if (typeData) {
        codingFlag = typeData.coding === 1;
        behavioralFlag = typeData.interviewChecking === 1;
        setIsCodingRoundEnabled(codingFlag);
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

    requestFullScreen();
    setStatus('interviewing');
    setIsCodingMode(true);
    startTimeRef.current = Date.now();

    // logics for interview type as per === 1
    if (codingFlag && !behavioralFlag) {
      setIsCodingMode(true);
    } else {
      setIsCodingMode(false);
    }

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
      const instructions = `You are a professional, warm, and conversational AI technical interviewer.
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
`;

      const sessionRes = await axios.post('https://api.openai.com/v1/realtime/sessions', {
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "cedar",
        instructions: instructions,
        modalities: ["audio", "text"],
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 2000
        },
        input_audio_transcription: { model: "whisper-1" }
      }, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      setupWebRTC(sessionRes.data.client_secret.value);
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
        remoteAudioSourceRef.current = audioCtxRef.current.createMediaStreamSource(e.streams[0]);
        remoteAudioSourceRef.current.connect(audioDestRef.current);
      }
    };

    localStreamRef.current.getTracks().forEach(t => pcRef.current.addTrack(t, localStreamRef.current));

    dcRef.current = pcRef.current.createDataChannel('oai-events');
    dcRef.current.onopen = () => {
      dcRef.current.send(JSON.stringify({ type: 'response.create' }));
    };
    dcRef.current.onmessage = handleDataChannelMessage;

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);

    const sdpRes = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
      method: 'POST', body: offer.sdp,
      headers: { 'Authorization': `Bearer ${ephemeralKey}`, 'Content-Type': 'application/sdp' }
    });
    await pcRef.current.setRemoteDescription({ type: 'answer', sdp: await sdpRes.text() });
  };

  let aiBuffer = '';
  let userBuffer = '';
  const handleDataChannelMessage = (e) => {
    const evt = JSON.parse(e.data);
    switch (evt.type) {
      case 'response.created':
        setIsAiTalking(true);
        break;
      case 'response.audio_transcript.delta':
        aiBuffer += evt.delta || '';
        setIsAiTalking(true);
        break;
      case 'response.audio_transcript.done':
        if (aiBuffer.trim()) {
          addMessage('ai', aiBuffer.trim());

          if (aiBuffer.includes('INTERVIEW_COMPLETE')) {
            setTimeout(finishInterview, 2500);
          }

          // AI Trigger Detection for Coding
          const lowerText = aiBuffer.toLowerCase();
          if (
            lowerText.includes('opened the coding editor') ||
            lowerText.includes('coding task') ||
            lowerText.includes('write a function') ||
            lowerText.includes('solve the problems')
          ) {
            const qs = codingQuestionsRef.current;
            const idx = currentIdxRef.current;
            console.log("Triggering Coding Mode with active task:", qs[idx].title);
            setCodingTask(qs[idx].problemStatement);
            setLanguage(qs[idx].language);
            setCode(qs[idx].starterCode);
            setIsCodingMode(true);
          }
        }
        aiBuffer = '';
        break;
      case 'response.done':
      case 'input_audio_buffer.speech_stopped':
        setIsAiTalking(false);
        break;
      case 'conversation.item.input_audio_transcription.completed':
        addMessage('user', evt.transcript || '');
        break;
    }
  };


  const addMessage = (who, text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { who, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setTimeout(() => { if (convoRef.current) convoRef.current.scrollTop = convoRef.current.scrollHeight; }, 100);
  };

  const finishInterview = () => {
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
        model: "gpt-4o",
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
    }
  };

  const submitCode = () => {
    // SECURITY: Generate a structured summary to prevent AI context bloating
    const summary = codingQuestions.map((q, idx) => {
      const result = tasksResults[idx];
      const savedCode = idx === currentQuestionIdx ? code : (codeCaches[`${idx}_${q.language}`] || q.starterCode);
      const isPassed = result?.passed;

      // We only send the first 1000 characters of code per task to the AI to prevent 
      // crashing the Realtime API session, while still providing enough for evaluation.
      const codeSnippet = savedCode.length > 1000 ? savedCode.substring(0, 1000) + "\n... [Code Truncated for Length]" : savedCode;

      return `Task ${idx + 1} (${q.title}): ${isPassed ? 'PASSED' : 'FAILED'} [${result?.count || '0'} Tests]
Language: ${q.language}
Solution:
${codeSnippet}`;
    }).join('\n---\n');

    addMessage('user', `Status Update: I have submitted solutions for ${codingQuestions.length} tasks.`);

    if (dcRef.current?.readyState === 'open') {
      dcRef.current.send(JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{
            type: "input_text",
            text: `[SYSTEM NOTIFICATION: CODING SUBMISSION RECEIVED]
Below are my results for the technical challenges:

${summary}

AI Interviewer Action:
1. Briefly acknowledge that I have finished the coding part.
2. Evaluate my code quality and logic based on the snippets provided.
3. Decide if I should be SHORTLISTED based on BOTH behavioral and coding performance.
4. Provide a closing statement and say "INTERVIEW_COMPLETE".`
          }]
        }
      }));
      dcRef.current.send(JSON.stringify({ type: "response.create" }));
    }

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

      {status === 'welcome' && (
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
                      <button className="submit-btn" onClick={submitCode}>
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
                    <div className={`ai-avatar-wrapper small ${isAiTalking ? 'ai-talking' : ''}`}>
                      <div className="ai-ring" />
                      <div className="ai-avatar" style={{ width: 60, height: 60, fontSize: '1.5rem' }}>🤖</div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="video-status"><span>●</span> REC</div>
                  <div className={`ai-avatar-wrapper ${isAiTalking ? 'ai-talking' : ''}`}>
                    <div className="ai-ring" />
                    <div className="ai-avatar">🤖</div>
                  </div>
                  <div className="video-badge">AI Interviewer</div>
                </>
              )}
              <div className="self-video-container">
                <video ref={videoRef} autoPlay muted playsInline />
              </div>
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
                    <div key={i} className="meet-msg">
                      <div className="meet-msg-header">
                        <span className={`meet-msg-who ${m.who}`}>{m.who === 'ai' ? 'AI Interviewer' : 'You'}</span>
                        <span className="meet-msg-time">{m.time}</span>
                      </div>
                      <div className="meet-msg-text">{m.text}</div>
                    </div>
                  ))}
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
                className={`meet-btn ${isMicMuted ? 'danger' : ''}`}
                onClick={toggleMic}
              >
                {isMicMuted ? <MicOff size={22} /> : <Mic size={22} />}
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
                  onClick={() => setIsCodingMode(!isCodingMode)}
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
          <audio ref={audioElRef} autoPlay style={{ display: 'none' }} />
        </div>
      )}
    </div>
  );
};

export default MeetPage;
