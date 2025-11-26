import React, { useState, useEffect } from 'react';
import UploadZone from './components/UploadZone';
import CompareSlider from './components/CompareSlider';
import StyleSelector from './components/StyleSelector';
import ChatInterface from './components/ChatInterface';
import { generateRoomDesign, sendChatMessage } from './services/geminiService';
import { AppPhase, DesignStyle, GeneratedDesign, Message } from './types';
import { DESIGN_STYLES } from './constants';
import { Sparkles, ArrowLeft, Download, RotateCcw, Camera } from 'lucide-react';

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>('upload');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedDesigns, setGeneratedDesigns] = useState<GeneratedDesign[]>([]);
  const [selectedDesignIndex, setSelectedDesignIndex] = useState<number>(0);
  const [selectedStyleId, setSelectedStyleId] = useState<string>('modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Handle Initial Upload
  const handleImageUpload = (base64: string) => {
    setOriginalImage(base64);
    setPhase('analyzing');
    // Simulate short analysis delay for effect
    setTimeout(() => {
        setPhase('visualizing');
        // Trigger initial generation with default style
        generateDesign(base64, DESIGN_STYLES[0]);
    }, 1500);
  };

  // Generate Design Logic
  const generateDesign = async (baseImage: string, style: DesignStyle) => {
    setIsGenerating(true);
    try {
      // isRefinement = false for initial style transfer
      const generatedImageBase64 = await generateRoomDesign(baseImage, style.promptModifier, false);
      
      const newDesign: GeneratedDesign = {
        id: Date.now().toString(),
        imageUrl: generatedImageBase64,
        styleId: style.id,
        timestamp: Date.now(),
      };

      setGeneratedDesigns(prev => {
          const updated = [...prev, newDesign];
          setSelectedDesignIndex(updated.length - 1);
          return updated;
      });
      
      setSelectedStyleId(style.id);

      // Add system message about new design
      addMessage({
        id: Date.now().toString(),
        role: 'model',
        text: `Ho reimmaginato la tua stanza nello stile ${style.name}. Ti piace?`
      });

    } catch (error) {
      console.error(error);
      alert("Impossibile generare il design. Riprova.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Chat Logic
  const handleSendMessage = async (text: string) => {
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text };
    addMessage(newUserMsg);
    setIsChatLoading(true);

    try {
        const currentDesign = generatedDesigns[selectedDesignIndex];
        const currentImage = currentDesign ? currentDesign.imageUrl : originalImage;

        const response = await sendChatMessage(text, currentImage);
        
        // Handle Tool Call (Refinement)
        if (response.toolCall && response.toolCall.name === 'refine_design') {
             const instructions = response.toolCall.args.instructions;
             addMessage({
                 id: (Date.now() + 1).toString(),
                 role: 'model',
                 text: `Sto generando una nuova versione: "${instructions}"...`
             });
             
             // Trigger Refinement
             const baseForRefinement = currentImage || originalImage;
             if (baseForRefinement) {
                 setIsGenerating(true);
                 // isRefinement = true for specific edits
                 const refinedImage = await generateRoomDesign(baseForRefinement, instructions, true);
                 
                 const newDesign: GeneratedDesign = {
                    id: Date.now().toString(),
                    imageUrl: refinedImage,
                    styleId: 'custom',
                    timestamp: Date.now(),
                 };
                 
                 setGeneratedDesigns(prev => {
                    const updated = [...prev, newDesign];
                    setSelectedDesignIndex(updated.length - 1);
                    return updated;
                 });
                 setIsGenerating(false);

                 addMessage({
                    id: (Date.now() + 2).toString(),
                    role: 'model',
                    text: "Ecco il design aggiornato in base al tuo feedback."
                 });
             }
        } else {
            // Normal Text Response
            addMessage({
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: response.text,
                groundingLinks: response.groundingLinks
            });
        }

    } catch (error) {
        addMessage({ id: Date.now().toString(), role: 'system', text: "Errore di connessione all'assistente AI." });
    } finally {
        setIsChatLoading(false);
    }
  };

  const addMessage = (msg: Message) => {
      setChatMessages(prev => [...prev, msg]);
  };

  const handleStyleSelect = (style: DesignStyle) => {
      if (originalImage && !isGenerating) {
          setSelectedStyleId(style.id);
          generateDesign(originalImage, style);
      }
  };

  const handleReset = () => {
      setPhase('upload');
      setOriginalImage(null);
      setGeneratedDesigns([]);
      setChatMessages([]);
  };

  const handleDownload = () => {
    if (generatedDesigns.length > 0) {
      const design = generatedDesigns[selectedDesignIndex];
      const link = document.createElement('a');
      link.href = design.imageUrl;
      link.download = `reimagine-${design.styleId}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-indigo-900">ReImagine</span>
          </div>
          {phase === 'visualizing' && (
              <button onClick={handleReset} className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                  <RotateCcw className="w-4 h-4" /> Ricomincia
              </button>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
        
        {phase === 'upload' && (
            <div className="flex-1 flex flex-col items-center justify-center fade-in">
                <div className="max-w-2xl w-full text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                        Riprogetta la tua stanza in <span className="text-indigo-600">pochi secondi</span>.
                    </h1>
                    <p className="text-lg text-slate-600">
                        Carica una foto del tuo spazio e lascia che il nostro consulente d'interni AI generi trasformazioni straordinarie. 
                        Confronta stili, perfeziona i dettagli e acquista il look.
                    </p>
                </div>
                <div className="w-full max-w-xl">
                    <UploadZone onImageSelected={handleImageUpload} />
                </div>
            </div>
        )}

        {phase === 'analyzing' && (
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                    <Camera className="absolute inset-0 m-auto text-indigo-600 w-8 h-8 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Analisi del tuo spazio...</h2>
                <p className="text-slate-500 mt-2">Identificazione di layout, mobili e luci.</p>
            </div>
        )}

        {phase === 'visualizing' && originalImage && (
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] min-h-[600px]">
                
                {/* Left Column: Visualizer */}
                <div className="lg:w-2/3 flex flex-col gap-4 h-full">
                    
                    {/* Main Canvas */}
                    <div className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative group">
                        {generatedDesigns.length > 0 ? (
                            <CompareSlider 
                                originalImage={originalImage}
                                generatedImage={generatedDesigns[selectedDesignIndex].imageUrl}
                            />
                        ) : (
                             // Fallback loading state for first generation
                            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="font-medium text-slate-500">Creazione del tuo primo design...</p>
                                </div>
                            </div>
                        )}

                        {/* Download Button */}
                        {generatedDesigns.length > 0 && !isGenerating && (
                          <button
                            onClick={handleDownload}
                            className="absolute bottom-6 right-6 z-30 bg-white text-indigo-900 p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-medium"
                            title="Scarica il design generato"
                          >
                            <Download className="w-5 h-5" />
                            <span className="hidden sm:inline">Scarica</span>
                          </button>
                        )}

                        {/* Loading Overlay for subsequent generations */}
                        {isGenerating && generatedDesigns.length > 0 && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-30 flex items-center justify-center">
                                <div className="bg-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="font-semibold text-indigo-900">Rendering del nuovo stile...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Style Carousel */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Scegli uno stile</h3>
                        <StyleSelector 
                            selectedStyleId={selectedStyleId}
                            onSelectStyle={handleStyleSelect}
                            disabled={isGenerating}
                        />
                    </div>
                </div>

                {/* Right Column: Chat & Tools */}
                <div className="lg:w-1/3 h-full">
                    <ChatInterface 
                        messages={chatMessages}
                        onSendMessage={handleSendMessage}
                        isLoading={isChatLoading}
                    />
                </div>

            </div>
        )}

      </main>
    </div>
  );
};

export default App;