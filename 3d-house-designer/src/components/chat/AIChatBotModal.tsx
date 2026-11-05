import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { analyzeBlueprintWithAI, AIAnalysisResult } from '../../utils/detection/aiBlueprintAnalyzer';
import { calculateOverlayBounds } from '../../utils/geometry';
import { validateUploadedFloorPlanFile } from '../../services/imagePreprocessing';
import { AIScanMessageAttachment, Message, Wall, Room, Door, WindowItem } from '../../types/floorplan';
import {
  Sparkles,
  Send,
  Upload,
  Paperclip,
  X,
  Bot,
  User,
  RefreshCw,
  Box,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AIChatBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEditor?: (projectId: string, view?: '2D' | '3D') => void;
  onOpenValidationView?: () => void;
}

interface ChatBotMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  attachment?: {
    name: string;
    sizeFormatted: string;
    dataUrl: string;
  };
  isAnalyzing?: boolean;
  aiScanResult?: AIScanMessageAttachment;
  createdAt: string;
}

export const AIChatBotModal: React.FC<AIChatBotModalProps> = ({
  isOpen,
  onClose,
  onOpenEditor,
  onOpenValidationView
}) => {
  const { currentProject, applyConvertedFloorPlan } = useProject();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [inputMessage, setInputMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStageText, setScanStageText] = useState('');

  const [messages, setMessages] = useState<ChatBotMessage[]>([
    {
      id: 'bot_welcome',
      sender: 'bot',
      text: '👋 Hello! I am your **AI Architect Assistant & Blueprint Scanner Bot**.\n\nUpload any 2D floor plan blueprint (PNG, JPG, PDF, SVG) using the clip icon below, and I will scan it, extract structural walls, rooms, doors & windows, and convert it into an **exact editable 2D vector model**!',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, isScanning]);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    const validation = await validateUploadedFloorPlanFile(file);
    if (!validation.isValid) {
      setMessages(prev => [
        ...prev,
        {
          id: 'error_' + Date.now(),
          sender: 'bot',
          text: `⚠️ **File Validation Error**: ${validation.errorMessage || 'Invalid file format.'}`,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      return;
    }

    const reader = new FileReader();
    reader.onload = async ev => {
      const dataUrl = (ev.target?.result as string) || '';
      const userMsgId = 'user_msg_' + Date.now();

      // Add user message with attached blueprint file
      setMessages(prev => [
        ...prev,
        {
          id: userMsgId,
          sender: 'user',
          text: `Uploaded floor plan blueprint: **${file.name}** for AI scanning and 2D vector conversion.`,
          attachment: {
            name: file.name,
            sizeFormatted: validation.fileDetails?.sizeFormatted || '1.5 MB',
            dataUrl
          },
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      // Start AI Vision Scanning
      setIsScanning(true);
      setScanStageText('AI Vision scanning blueprint canvas pixels...');

      try {
        setTimeout(() => setScanStageText('Detecting exterior load-bearing & partition walls...'), 400);
        setTimeout(() => setScanStageText('Extracting closed room polygons & OCR text labels...'), 900);
        setTimeout(() => setScanStageText('Placing door swing arcs & window glass assemblies...'), 1400);

        const options = {
          sensitivity: 50,
          wallThickness: 0.75,
          wallHeight: 9.5,
          plotWidth: currentProject?.plotWidth || 40,
          plotLength: currentProject?.plotLength || 30,
          unit: currentProject?.unit || 'feet',
          enhanceWithFurniture: true
        };

        const aiResult: AIAnalysisResult = await analyzeBlueprintWithAI(dataUrl, options);

        setIsScanning(false);

        const attachmentData: AIScanMessageAttachment = {
          imageUrl: dataUrl,
          fileName: file.name,
          fileSizeFormatted: validation.fileDetails?.sizeFormatted,
          confidenceScore: aiResult.aiConfidenceScore,
          extractedWallsCount: aiResult.detectedWallCount,
          extractedRoomsCount: aiResult.detectedRoomCount,
          extractedDoorsCount: aiResult.doors.length,
          extractedWindowsCount: aiResult.windows.length,
          estimatedLivingArea: aiResult.estimatedLivingArea,
          aiInsights: aiResult.aiInsights,
          walls: aiResult.walls,
          rooms: aiResult.rooms,
          doors: aiResult.doors,
          windows: aiResult.windows,
          furniture: aiResult.furniture
        };

        // Append Bot Response with AI Conversion Data & Interactive Buttons
        setMessages(prev => [
          ...prev,
          {
            id: 'bot_ai_res_' + Date.now(),
            sender: 'bot',
            text: `✨ **AI Blueprint Scan Complete!**\n\nI have successfully scanned **${file.name}** and converted it into an **exact structured, editable 2D vector model**.`,
            aiScanResult: attachmentData,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } catch (err) {
        setIsScanning(false);
        setMessages(prev => [
          ...prev,
          {
            id: 'bot_err_' + Date.now(),
            sender: 'bot',
            text: '⚠️ An error occurred while running AI vision recognition on this floor plan image. Please ensure the blueprint has clear wall lines and try again.',
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isScanning) return;

    const query = inputMessage.trim();
    setInputMessage('');

    setMessages(prev => [
      ...prev,
      {
        id: 'usr_' + Date.now(),
        sender: 'user',
        text: query,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Handle bot response based on user input
    setTimeout(() => {
      let botReply = '';
      const qLower = query.toLowerCase();

      if (qLower.includes('upload') || qLower.includes('scan') || qLower.includes('convert')) {
        botReply = 'Please click the **clip/upload button** below to attach your 2D floor plan image or PDF, and I will scan and convert it immediately!';
      } else if (qLower.includes('bedroom') || qLower.includes('bed')) {
        botReply = 'Based on architectural standards, I can detect master bedrooms, guest suites, and children bedrooms directly from OCR labels on the blueprint. Upload your plan to analyze exact room boundaries!';
      } else if (qLower.includes('cost') || qLower.includes('price') || qLower.includes('estimate')) {
        const sqFt = currentProject?.plotWidth ? currentProject.plotWidth * currentProject.plotLength : 2000;
        const estCostMin = (sqFt * 120).toLocaleString();
        const estCostMax = (sqFt * 180).toLocaleString();
        botReply = `Based on your current plan area of **${sqFt} sq.ft**, estimated construction cost ranges between **$${estCostMin}** and **$${estCostMax}** (approx $120–$180 per sq.ft depending on finishes).`;
      } else if (qLower.includes('3d') || qLower.includes('model')) {
        botReply = 'Once you scan your uploaded blueprint, click **[✨ Load Editable 2D Model]** or **[🧊 View 3D Model]** to generate high-resolution 3D walls, floors, doors, and windows!';
      } else {
        botReply = 'I am your **AI Architect Assistant**. I can scan uploaded floor plan blueprints, detect room boundaries, place doors & windows, and output exact editable 2D vector models!';
      }

      setMessages(prev => [
        ...prev,
        {
          id: 'bot_ans_' + Date.now(),
          sender: 'bot',
          text: botReply,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 600);
  };

  const handleApplyTo2DCanvas = (res: AIScanMessageAttachment) => {
    const plotW = currentProject?.plotWidth || 40;
    const plotL = currentProject?.plotLength || 30;

    applyConvertedFloorPlan(
      res.walls,
      res.rooms,
      res.doors,
      res.windows,
      {
        imageUrl: res.imageUrl,
        originalFileName: res.fileName,
        visible: true,
        opacity: 0.5
      },
      false // Stay in 2D view
    );

    confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 } });
    if (onOpenEditor && currentProject) {
      onOpenEditor(currentProject.id, '2D');
    }
    onClose();
  };

  const handleGenerate3DModel = (res: AIScanMessageAttachment) => {
    applyConvertedFloorPlan(
      res.walls,
      res.rooms,
      res.doors,
      res.windows,
      {
        imageUrl: res.imageUrl,
        originalFileName: res.fileName,
        visible: true,
        opacity: 0.5
      },
      true // Switch to 3D view
    );

    confetti({ particleCount: 90, spread: 70, origin: { y: 0.4 } });
    if (onOpenEditor && currentProject) {
      onOpenEditor(currentProject.id, '3D');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-100 flex flex-col h-[85vh]">
        {/* Header Bar */}
        <div className="p-4 px-6 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Architect AI Blueprint Scanner Bot</span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  AI VISION 2.0
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Upload any 2D blueprint to convert into an exact editable 2D vector model
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin bg-slate-950">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-1 ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? <User size={14} /> : <Bot size={15} />}
              </div>

              {/* Message Bubble Container */}
              <div className={`space-y-2 max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Attached Blueprint Image Card */}
                  {msg.attachment && (
                    <div className="mt-3 p-2 bg-slate-900 border border-slate-700 rounded-xl flex items-center gap-3">
                      <img
                        src={msg.attachment.dataUrl}
                        alt="Uploaded blueprint preview"
                        className="w-16 h-14 object-cover rounded-lg border border-slate-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-100 truncate text-[11px]">
                          {msg.attachment.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {msg.attachment.sizeFormatted} • Blueprint Reference
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI SCAN RESULT CARD INLINE IN CHAT THREAD */}
                {msg.aiScanResult && (
                  <div className="bg-slate-900 border border-emerald-800/80 rounded-2xl p-4 text-xs space-y-3 shadow-xl text-slate-200 animate-in fade-in duration-300">
                    {/* Header Score Badge */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-emerald-400" />
                        <span className="font-bold text-slate-100 text-xs">
                          AI Vectorization &amp; Recognition Results
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        ✨ ACCURACY: {msg.aiScanResult.confidenceScore}%
                      </span>
                    </div>

                    {/* Image Thumbnail & Extracted Spec Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <img
                        src={msg.aiScanResult.imageUrl}
                        alt="Scanned blueprint"
                        className="sm:col-span-4 h-24 w-full object-contain bg-slate-950 rounded-xl border border-slate-800 p-1"
                      />

                      <div className="sm:col-span-8 grid grid-cols-2 gap-2 text-center text-[11px]">
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Extracted Walls</div>
                          <div className="font-bold text-emerald-400 font-mono text-sm">
                            {msg.aiScanResult.extractedWallsCount} Walls
                          </div>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Enclosed Rooms</div>
                          <div className="font-bold text-teal-400 font-mono text-sm">
                            {msg.aiScanResult.extractedRoomsCount} Rooms
                          </div>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Doors &amp; Windows</div>
                          <div className="font-bold text-amber-400 font-mono text-sm">
                            {msg.aiScanResult.extractedDoorsCount + msg.aiScanResult.extractedWindowsCount} Openings
                          </div>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                          <div className="text-slate-400 text-[10px]">Living Space</div>
                          <div className="font-bold text-sky-400 font-mono text-sm">
                            {msg.aiScanResult.estimatedLivingArea} sq.ft
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Insights List */}
                    <div className="space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                      <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">
                        AI Architectural Insights:
                      </div>
                      {msg.aiScanResult.aiInsights.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>

                    {/* Interactive CTAs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                      <button
                        onClick={() => handleApplyTo2DCanvas(msg.aiScanResult!)}
                        className="py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Layers size={14} />
                        <span>✨ Load Editable 2D Plan</span>
                      </button>

                      <button
                        onClick={() => handleGenerate3DModel(msg.aiScanResult!)}
                        className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Box size={14} className="text-teal-400" />
                        <span>🧊 View 3D Building</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Active AI Scanning Indicator */}
          {isScanning && (
            <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center gap-3 animate-pulse text-xs">
              <RefreshCw size={16} className="text-emerald-400 animate-spin" />
              <div>
                <div className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span>AI Multimodal Scanner Processing...</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">Scanning</span>
                </div>
                <div className="text-[11px] text-slate-400">{scanStageText}</div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Inquiry Pills */}
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-bold uppercase tracking-wider shrink-0 text-[10px]">
            AI Prompt:
          </span>
          {[
            'Scan my uploaded blueprint',
            'Estimate construction cost for plan',
            'How many bedrooms detected?'
          ].map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => setInputMessage(promptText)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-medium whitespace-nowrap transition cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Input Bar with File Upload Attachment Button */}
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              accept="image/png, image/jpeg, image/webp, image/svg+xml, application/pdf, .dxf"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl shadow-md transition shrink-0 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Upload Floor Plan Blueprint"
            >
              <Paperclip size={15} />
              <span className="hidden sm:inline">Upload Plan</span>
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Ask AI Bot or upload a blueprint plan to scan..."
              disabled={isScanning}
              className="flex-1 py-2.5 px-4 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isScanning}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl shadow-md transition shrink-0 cursor-pointer"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
