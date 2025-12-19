// "use client";
// import React, { useEffect, useRef, useState } from "react";
// import Editor from "@monaco-editor/react";
// import { FaDownload, FaPlay, FaTrash } from "react-icons/fa";
// import { CgProfile } from "react-icons/cg";
// import Image from "next/image";
// import { useSession, signOut } from "next-auth/react";
// import { Plus, Folder, Code, Settings, MessageSquare, Zap } from "lucide-react";
// import ProtectedRoute from "../../../components/ProtectedRoute";


// // ---- extension -> monaco/piston language mapping (expandable) ----
// const extensionToLang: Record<string, string> = {
//   ".js": "javascript",
//   ".jsx": "javascript",
//   ".ts": "typescript",
//   ".tsx": "typescript",
//   ".py": "python",
//   ".java": "java",
//   ".c": "c",
//   ".cpp": "cpp",
//   ".cc": "cpp",
//   ".hpp": "cpp",
//   ".cs": "csharp",
//   ".go": "go",
//   ".rs": "rust",
//   ".rb": "ruby",
//   ".php": "php",
//   ".kt": "kotlin",
//   ".swift": "swift",
//   ".dart": "dart",
//   ".sh": "bash",
//   ".scala": "scala",
//   ".lua": "lua",
//   ".pl": "perl",
//   ".r": "r",
//   ".html": "html",
//   ".css": "css",
//   ".json": "json",
//   ".txt": "plaintext",
// };

// const NavItem = ({
//   icon: Icon,
//   label,
//   isActive,
//   onClick,
//   onDelete,
// }: {
//   icon: any;
//   label: string;
//   isActive?: boolean;
//   onClick?: () => void;
//   onDelete?: () => void;
// }) => (
//   <div
//     className={`flex items-center justify-between text-sm px-4 py-2 cursor-pointer transition ${
//       isActive
//         ? "bg-gray-700 text-white border-l-4 border-blue-500 font-semibold"
//         : "text-gray-400 hover:bg-gray-700 hover:text-white"
//     }`}
//   >
//     <div className="flex items-center" onClick={onClick}>
//       <Icon className="w-5 h-5 mr-3" />
//       <span className="truncate max-w-[160px]">{label}</span>
//     </div>
//     {onDelete && (
//       <FaTrash
//         onClick={(e) => {
//           e.stopPropagation();
//           onDelete();
//         }}
//         className="w-4 h-4 text-red-500 hover:text-red-700"
//       />
//     )}
//   </div>
// );

// const RightPanelTab = ({
//   label,
//   icon: Icon,
//   isActive,
//   onClick,
// }: {
//   label: string;
//   icon: any;
//   isActive: boolean;
//   onClick: () => void;
// }) => (
//   <button
//     onClick={onClick}
//     className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition ${
//       isActive
//         ? "text-white border-b-2 border-blue-500"
//         : "text-gray-400 hover:text-white"
//     }`}
//   >
//     <Icon className="w-4 h-4" />
//     {label}
//   </button>
// );

// export default function CodePage() {
//   // auth
//   const { data: session, status } = useSession();
//   const [showDropdown, setShowDropdown] = useState(false);

//   // files state
//   type FileItem = { name: string; content: string };
//   const [files, setFiles] = useState<FileItem[]>(() => {
//     // initial fallback
//     return [{ name: "main.py", content: "print('Hello, Nexus!')" }];
//   });
//   const [activeFile, setActiveFile] = useState<string>("main.py");

//   // new-file UI
//   const [showNewFileInput, setShowNewFileInput] = useState(false);
//   const [newFileName, setNewFileName] = useState("");
//   const newFileInputRef = useRef<HTMLInputElement | null>(null);

//   // other UI
//   const [notes, setNotes] = useState("");
//   const [theme, setTheme] = useState("vs-dark");
//   const [fontSize, setFontSize] = useState(14);
//   const [activeRightTab, setActiveRightTab] = useState("Console");
//   const [output, setOutput] = useState("");
//   const editorRef = useRef<any>(null);

//   // AI panel state
//   const [aiPrompt, setAiPrompt] = useState("");
//   const [aiLoading, setAiLoading] = useState(false);
//   const [aiResponse, setAiResponse] = useState("");

//   // - load from localStorage on mount
//   useEffect(() => {
//     try {
//       const storedFiles = localStorage.getItem("nexus-files");
//       const storedNotes = localStorage.getItem("nexus-notes");
//       const storedActive = localStorage.getItem("nexus-activeFile");
//       if (storedFiles) setFiles(JSON.parse(storedFiles));
//       if (storedNotes) setNotes(storedNotes);
//       if (storedActive) setActiveFile(storedActive);
//     } catch (err) {
//       console.warn("Failed to load persisted state", err);
//     }
//   }, []);

//   // - persist changes
//   useEffect(() => {
//     localStorage.setItem("nexus-files", JSON.stringify(files));
//   }, [files]);

//   useEffect(() => {
//     localStorage.setItem("nexus-notes", notes);
//   }, [notes]);

//   useEffect(() => {
//     localStorage.setItem("nexus-activeFile", activeFile);
//   }, [activeFile]);

//   // helpers
//   const inferLanguageFromName = (filename: string) => {
//     const dot = filename.lastIndexOf(".");
//     if (dot === -1) return "plaintext";
//     const ext = filename.slice(dot).toLowerCase();
//     return extensionToLang[ext] ?? "plaintext";
//   };

//   const ensureUniqueName = (name: string) => {
//     return !files.some((f) => f.name === name);
//   };

//   // create file (from inline input)
//   const handleCreateFile = () => {
//     const name = newFileName?.trim();
//     if (!name) {
//       alert("Please enter a file name (including extension), e.g. main.py");
//       return;
//     }
//     if (!name.includes(".")) {
//       alert("Please include a file extension, e.g. .py, .js");
//       return;
//     }
//     const ext = "." + name.split(".").pop()!.toLowerCase();
//     if (!extensionToLang[ext]) {
//       alert(
//         "Unsupported extension. Supported: " +
//           Object.keys(extensionToLang).join(", ")
//       );
//       return;
//     }
//     if (!ensureUniqueName(name)) {
//       alert("File already exists");
//       return;
//     }
//     const newFile: FileItem = { name, content: "" };
//     setFiles((prev) => [...prev, newFile]);
//     setActiveFile(name);
//     setNewFileName("");
//     setShowNewFileInput(false);
//   };

//   // delete file
//   const handleDeleteFile = (name: string) => {
//     if (files.length === 1) {
//       alert("You must keep at least one file.");
//       return;
//     }
//     if (!confirm(`Delete file "${name}"?`)) return;
//     const updated = files.filter((f) => f.name !== name);
//     setFiles(updated);
//     if (activeFile === name) setActiveFile(updated[0].name);
//   };

//   // save active file locally (download)
//   const saveCodeFile = () => {
//     const file = files.find((f) => f.name === activeFile);
//     if (!file) return;
//     const content = editorRef.current?.getValue() ?? file.content;
//     const blob = new Blob([content], { type: "text/plain" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = file.name;
//     document.body.appendChild(a);
//     a.click();
//     a.remove();
//     URL.revokeObjectURL(url);
//   };

//   const saveNotesFile = () => {
//     const blob = new Blob([notes], { type: "text/plain" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "notes.txt";
//     document.body.appendChild(a);
//     a.click();
//     a.remove();
//     URL.revokeObjectURL(url);
//   };

//   // run code using Piston endpoint (sends the active file)
//   async function handleRunCode() {
//     const file = files.find((f) => f.name === activeFile);
//     if (!file) {
//       setOutput("No active file to run");
//       return;
//     }
//     const codeToRun = editorRef.current?.getValue() ?? file.content;
//     const language = inferLanguageFromName(file.name);
//     setOutput("⏳ Running...");
//     setActiveRightTab("Console");

//     try {
//       const res = await fetch("https://emkc.org/api/v2/piston/execute", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           language,
//           version: "*",
//           files: [{ name: file.name, content: codeToRun }],
//         }),
//       });
//       const data = await res.json();
//       if (data.run?.stderr) setOutput(`❌ Error:\n${data.run.stderr}`);
//       else setOutput(data.run?.output ?? "⚠️ No output");
//     } catch (err: any) {
//       setOutput("❌ Network Error: " + (err?.message ?? String(err)));
//     }
//   }

//   // when Add File clicked we open the inline input and focus it
//   useEffect(() => {
//     if (showNewFileInput && newFileInputRef.current) {
//       newFileInputRef.current.focus();
//     }
//   }, [showNewFileInput]);

//   // get current file + language for editor
//   const currentFile = files.find((f) => f.name === activeFile) ?? files[0];
//   const currentLanguage = inferLanguageFromName(currentFile.name);
//   async function handleAskAI() {
//     try {
//       setAiLoading(true);
//       setAiResponse("");

//       // Backend URL: prefer NEXT_PUBLIC_BACKEND_API_URL (set in client env), fallback to same origin
//       const backendBase =
//         (process.env.NEXT_PUBLIC_BACKEND_API_URL &&
//           process.env.NEXT_PUBLIC_BACKEND_API_URL.replace(/\/$/, "")) ||
//         "";

//       const endpoint = backendBase
//         ? `${backendBase}/ai/generate`
//         : "/api/ai/generate";

//       const resp = await fetch(endpoint, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt: aiPrompt }),
//         credentials: "include", // optional if your backend requires cookies
//       });

//       if (!resp.ok) {
//         const body = await resp.json().catch(() => ({ error: "unknown" }));
//         setAiResponse(`Error: ${body?.error ?? resp.statusText}`);
//         return;
//       }

//       const data = await resp.json();
//       if (data?.text) {
//         setAiResponse(data.text);
//       } else if (data?.error) {
//         setAiResponse(`Error: ${JSON.stringify(data.error)}`);
//       } else {
//         setAiResponse(JSON.stringify(data));
//       }
//     } catch (err: any) {
//       setAiResponse("Network error: " + (err?.message ?? String(err)));
//     } finally {
//       setAiLoading(false);
//     }
//   }

//   return (
//     <ProtectedRoute>
//       <div className="h-screen w-screen flex flex-col bg-gray-900 overflow-hidden">
//         {/* TOP BAR */}
//         <div className="flex justify-between items-center px-4 h-12 bg-gray-800 border-b border-gray-700">
//           <div className="flex items-center gap-4 text-white">
//             <h1 className="text-xl font-bold text-blue-500">NexusCode</h1>
//             <div className="flex items-center text-sm text-gray-400 ml-6">
//               <Code className="w-4 h-4 mr-1" />
//               <span className="mr-2 truncate">{currentFile.name}</span>
//               <span className="mx-2 text-gray-600">|</span>
//               <span className="text-green-400">{currentLanguage}</span>
//             </div>
//           </div>

//           <div className="flex items-center gap-4 text-white">
//             <button
//               onClick={handleRunCode}
//               className="flex items-center gap-1 px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 transition font-semibold"
//             >
//               <FaPlay className="w-3 h-3" /> Run
//             </button>

//             <button
//               onClick={saveCodeFile}
//               className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 border border-gray-600 text-sm"
//             >
//               <FaDownload className="inline mr-1" /> Save Code
//             </button>

//             <button
//               onClick={saveNotesFile}
//               className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 border border-gray-600 text-sm"
//             >
//               <FaDownload className="inline mr-1" /> Save Notes
//             </button>

//             <nav className="flex items-center gap-2 relative">
//               {status === "loading" ? (
//                 <CgProfile className="size-6 opacity-60" />
//               ) : session?.user ? (
//                 <div className="relative flex items-center gap-2">
//                   <p className="text-sm font-medium hidden sm:inline text-gray-300">
//                     {session.user.name?.split(" ")[0] ?? "User"}
//                   </p>
//                   <button
//                     onClick={() => setShowDropdown((p) => !p)}
//                     className="flex items-center focus:outline-none"
//                   >
//                     {session.user.image ? (
//                       <Image
//                         src={session.user.image}
//                         alt={session.user.name ?? "Profile"}
//                         width={30}
//                         height={30}
//                         className="rounded-full cursor-pointer border border-gray-600"
//                       />
//                     ) : (
//                       <CgProfile className="size-6 cursor-pointer text-gray-400 hover:text-white transition" />
//                     )}
//                   </button>

//                   {showDropdown && (
//                     <div className="absolute right-0 top-8 mt-2 bg-gray-700 text-white rounded-md shadow-lg border border-gray-600 p-1 min-w-[150px] z-10">
//                       <p className="px-3 py-1 text-sm border-b border-gray-600 truncate">
//                         {session.user.name ?? "User"}
//                       </p>
//                       <button
//                         onClick={() => signOut({ callbackUrl: "/" })}
//                         className="w-full text-left px-3 py-1 text-sm rounded-sm hover:bg-red-600 transition"
//                       >
//                         Logout
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 <div></div>
//               )}
//             </nav>
//           </div>
//         </div>

//         {/* MAIN: left sidebar, editor, right panel */}
//         <div className="flex flex-row h-[calc(100vh-3rem)]">
//           {/* LEFT SIDEBAR */}
//           <div className="w-60 bg-gray-900 border-r border-gray-700 flex flex-col justify-between">
//             <div className="flex flex-col">
//               <h3 className="px-4 py-3 text-xs font-semibold uppercase text-gray-400 border-b border-gray-800">
//                 Files
//               </h3>

//               {/* file list */}
//               <div className="overflow-auto">
//                 {files.map((f) => (
//                   <NavItem
//                     key={f.name}
//                     icon={Folder}
//                     label={f.name}
//                     isActive={f.name === activeFile}
//                     onClick={() => setActiveFile(f.name)}
//                     onDelete={() => handleDeleteFile(f.name)}
//                   />
//                 ))}
//               </div>

//               {/* Add new file inline */}
//               <div className="px-3 py-2 border-t border-gray-800">
//                 {!showNewFileInput ? (
//                   <button
//                     onClick={() => setShowNewFileInput(true)}
//                     className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800 rounded text-sm text-gray-200 hover:bg-gray-700"
//                   >
//                     <Plus className="w-4 h-4" />
//                     Add File
//                   </button>
//                 ) : (
//                   <div className="flex gap-2">
//                     <input
//                       ref={newFileInputRef}
//                       value={newFileName}
//                       onChange={(e) => setNewFileName(e.target.value)}
//                       onKeyDown={(e) => {
//                         if (e.key === "Enter") handleCreateFile();
//                         if (e.key === "Escape") {
//                           setShowNewFileInput(false);
//                           setNewFileName("");
//                         }
//                       }}
//                       placeholder="eg. script.py"
//                       className="flex-1 p-2 text-sm bg-gray-800 rounded border border-gray-600 outline-none text-white"
//                     />
//                     <button
//                       onClick={handleCreateFile}
//                       className="px-3 py-2 bg-blue-600 rounded text-sm"
//                     >
//                       Create
//                     </button>
//                     <button
//                       onClick={() => {
//                         setShowNewFileInput(false);
//                         setNewFileName("");
//                       }}
//                       className="px-2 py-2 bg-gray-700 rounded text-sm"
//                       title="Cancel"
//                     >
//                       ✕
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* bottom quick nav */}
//             <div className="flex flex-col border-t border-gray-800">
//               <NavItem
//                 icon={Settings}
//                 label="Settings"
//                 onClick={() => setActiveRightTab("Settings")}
//               />
//               <NavItem
//                 icon={Zap}
//                 label="AI Assistant"
//                 onClick={() => setActiveRightTab("AI")}
//               />
//               <NavItem
//                 icon={MessageSquare}
//                 label="Notes"
//                 onClick={() => setActiveRightTab("Notes")}
//               />
//             </div>
//           </div>

//           {/* EDITOR */}
//           {/* RIGHT PANEL */}
//           <div className="w-[30%] min-w-[300px] bg-gray-800 border-l border-gray-700 flex flex-col">
//             <div className="flex border-b border-gray-700 bg-gray-900 p-2">
//               <RightPanelTab
//                 label="Console"
//                 icon={Code}
//                 isActive={activeRightTab === "Console"}
//                 onClick={() => setActiveRightTab("Console")}
//               />
//               <RightPanelTab
//                 label="AI"
//                 icon={Zap}
//                 isActive={activeRightTab === "AI"}
//                 onClick={() => setActiveRightTab("AI")}
//               />
//               <RightPanelTab
//                 label="Notes"
//                 icon={MessageSquare}
//                 isActive={activeRightTab === "Notes"}
//                 onClick={() => setActiveRightTab("Notes")}
//               />
//               <RightPanelTab
//                 label="Settings"
//                 icon={Settings}
//                 isActive={activeRightTab === "Settings"}
//                 onClick={() => setActiveRightTab("Settings")}
//               />
//             </div>

//             <div className="flex-grow overflow-y-auto p-4 relative">
//               {activeRightTab === "Console" && (
//                 <>
//                   <pre className="text-sm whitespace-pre-wrap text-white font-mono h-full">
//                     {output}
//                   </pre>
//                   <button
//                     onClick={() => setOutput("")}
//                     className="absolute bottom-2 right-4 text-xs text-gray-400 hover:text-white"
//                   >
//                     Clear Log
//                   </button>
//                 </>
//               )}

//               {/* {activeRightTab === "AI" && (
//                 <div className="text-gray-400">
//                   <h4 className="text-lg font-semibold mb-2 text-white">
//                     AI Assistant
//                   </h4>
//                   <p>
//                     Ask the AI to explain code, suggest improvements, or fix
//                     bugs!
//                   </p>
//                   <textarea
//                     className="w-full h-24 mt-4 p-2 bg-gray-700 rounded text-white resize-none"
//                     placeholder="How can I optimize this code?"
//                   ></textarea>
//                   <button className="mt-2 px-4 py-1 bg-blue-600 rounded text-white hover:bg-blue-700">
//                     Ask
//                   </button>
//                 </div>
//               )} */}
//               {activeRightTab === "AI" && (
//                 <div className="text-gray-400">
//                   <h4 className="text-lg font-semibold mb-2 text-white">
//                     AI Assistant
//                   </h4>
//                   <p className="mb-3">
//                     Ask the AI to explain code, suggest improvements, or fix
//                     bugs. The model will be called securely via your backend.
//                   </p>

//                   <textarea
//                     value={aiPrompt}
//                     onChange={(e) => setAiPrompt(e.target.value)}
//                     className="w-full h-28 p-3 bg-gray-800 rounded text-white resize-none outline-none"
//                     placeholder="Example: Explain the bug in this code and suggest a fix..."
//                   />

//                   <div className="flex items-center gap-3 mt-3">
//                     <button
//                       disabled={aiLoading || !aiPrompt.trim()}
//                       onClick={async () => {
//                         // click handler — call below helper
//                         await handleAskAI();
//                       }}
//                       className={`px-4 py-2 rounded text-white font-semibold ${
//                         aiLoading
//                           ? "bg-gray-600 cursor-wait"
//                           : "bg-blue-600 hover:bg-blue-700"
//                       }`}
//                     >
//                       {aiLoading ? "Thinking..." : "Ask AI"}
//                     </button>

//                     <button
//                       onClick={() => {
//                         // Pre-fill prompt with context about the current file
//                         const context = `
// Explain the following ${currentLanguage} code and suggest improvements. Reply with a brief explanation and recommended changes.

// Code:
// ${editorRef.current?.getValue() ?? currentFile.content}
// `;
//                         setAiPrompt(context);
//                       }}
//                       className="px-3 py-2 border border-gray-600 rounded text-sm text-gray-200 hover:bg-gray-700"
//                     >
//                       Use current file as prompt
//                     </button>
//                   </div>

//                   <div className="mt-4">
//                     <h5 className="text-sm font-semibold text-white mb-2">
//                       AI Response
//                     </h5>
//                     <div className="min-h-[120px] p-3 bg-gray-900 rounded text-white font-mono text-sm whitespace-pre-wrap">
//                       {aiLoading
//                         ? "⏳ AI is generating — please wait..."
//                         : aiResponse || "No response yet."}
//                     </div>
//                     {aiResponse && (
//                       <div className="mt-2 flex gap-2">
//                         <button
//                           onClick={() => {
//                             // optionally apply suggested code changes: naive approach - append to bottom
//                             const updatedContent =
//                               (editorRef.current?.getValue() ??
//                                 currentFile.content) +
//                               "\n\n/* AI suggestions:\n" +
//                               aiResponse +
//                               "\n*/";
//                             setFiles((prev) =>
//                               prev.map((p) =>
//                                 p.name === currentFile.name
//                                   ? { ...p, content: updatedContent }
//                                   : p
//                               )
//                             );
//                             // switch to Console tab so user can see change? Not necessary.
//                             setActiveRightTab("Console");
//                           }}
//                           className="px-3 py-1 bg-green-600 rounded text-sm text-white hover:bg-green-700"
//                         >
//                           Apply as comment
//                         </button>

//                         <button
//                           onClick={() => {
//                             navigator.clipboard
//                               .writeText(aiResponse)
//                               .catch(() => alert("Copy failed"));
//                           }}
//                           className="px-3 py-1 bg-gray-700 rounded text-sm text-white hover:bg-gray-600"
//                         >
//                           Copy
//                         </button>

//                         <button
//                           onClick={() => {
//                             setAiResponse("");
//                             setAiPrompt("");
//                           }}
//                           className="px-3 py-1 bg-red-600 rounded text-sm text-white hover:bg-red-700"
//                         >
//                           Clear
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}

//               {activeRightTab === "Notes" && (
//                 <div className="flex flex-col h-full">
//                   <h4 className="text-lg font-semibold mb-2 text-white">
//                     Session Notes
//                   </h4>
//                   <textarea
//                     value={notes}
//                     onChange={(e) => setNotes(e.target.value)}
//                     className="flex-1 p-2 text-sm outline-none bg-gray-900 text-white rounded resize-none"
//                     placeholder="Write your session notes here..."
//                   />
//                 </div>
//               )}

//               {activeRightTab === "Settings" && (
//                 <div className="text-white">
//                   <h4 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
//                     Editor Settings
//                   </h4>
//                   <div className="mb-4">
//                     <label className="text-sm font-semibold block mb-1">
//                       Theme
//                     </label>
//                     <select
//                       value={theme}
//                       onChange={(e) => setTheme(e.target.value)}
//                       className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
//                     >
//                       <option value="vs-dark">Dark</option>
//                       <option value="light">Light</option>
//                       <option value="hc-black">High Contrast</option>
//                     </select>
//                   </div>
//                   <div className="mb-4">
//                     <label className="text-sm font-semibold block mb-1">
//                       Font Size
//                     </label>
//                     <input
//                       type="number"
//                       value={fontSize}
//                       onChange={(e) => setFontSize(Number(e.target.value))}
//                       className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
//                       min={12}
//                       max={30}
//                     />
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </ProtectedRoute>
//   );
// }



// app/(protected)/code-page/page.tsx  (or wherever your route file is)
"use client";
import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { FaDownload, FaPlay, FaTrash } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Plus, Folder, Code, Settings, MessageSquare, Zap } from "lucide-react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { io, Socket } from "socket.io-client";

// --- Remote Cursor Styles ---
const CURSOR_COLORS = [
  "#FF0000", "#00FF00", "#0000FF", "#FFA500", "#800080", "#00FFFF", "#FF00FF", "#FFFF00"
];

const getCursorColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
};

const injectCursorStyles = (id: string, color: string, name: string) => {
  const styleId = `cursor-style-${id}`;
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    .remote-cursor-${id} {
      border-left: 2px solid ${color};
      position: absolute;
    }
    .remote-cursor-${id}::after {
      content: "${name}";
      position: absolute;
      top: -20px;
      left: 0;
      background: ${color};
      color: #000;
      padding: 1px 4px;
      font-size: 10px;
      border-radius: 3px;
      white-space: nowrap;
      pointer-events: none;
      z-index: 100;
    }
  `;
  document.head.appendChild(style);
};

// ---- extension -> monaco/piston language mapping (expandable) ----
const extensionToLang: Record<string, string> = {
  ".js": "javascript",
  ".jsx": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".py": "python",
  ".java": "java",
  ".c": "c",
  ".cpp": "cpp",
  ".cc": "cpp",
  ".hpp": "cpp",
  ".cs": "csharp",
  ".go": "go",
  ".rs": "rust",
  ".rb": "ruby",
  ".php": "php",
  ".kt": "kotlin",
  ".swift": "swift",
  ".dart": "dart",
  ".sh": "bash",
  ".scala": "scala",
  ".lua": "lua",
  ".pl": "perl",
  ".r": "r",
  ".html": "html",
  ".css": "css",
  ".json": "json",
  ".txt": "plaintext",
};

const NavItem = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  onDelete,
}: {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}) => (
  <div
    className={`flex items-center justify-between text-sm px-4 py-2 cursor-pointer transition ${
      isActive
        ? "bg-gray-700 text-white border-l-4 border-blue-500 font-semibold"
        : "text-gray-400 hover:bg-gray-700 hover:text-white"
    }`}
  >
    <div className="flex items-center" onClick={onClick}>
      <Icon className="w-5 h-5 mr-3" />
      <span className="truncate max-w-[160px]">{label}</span>
    </div>
    {onDelete && (
      <FaTrash
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="w-4 h-4 text-red-500 hover:text-red-700"
      />
    )}
  </div>
);

const RightPanelTab = ({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: any;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition ${
      isActive
        ? "text-white border-b-2 border-blue-500"
        : "text-gray-400 hover:text-white"
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

// Fallback UUID generator if strict UUID not needed or crypto.randomUUID internal
function generateRoomId() {
  return "room-" + Math.random().toString(36).substring(2, 9);
}

export default function CodePage() {
  // auth
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

  // files state
  type FileItem = { name: string; content: string };
  const [files, setFiles] = useState<FileItem[]>(() => {
    return [{ name: "main.py", content: "print('Hello, Nexus!')" }];
  });
  const [activeFile, setActiveFile] = useState<string>("main.py");

  // new-file UI
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const newFileInputRef = useRef<HTMLInputElement | null>(null);

  // other UI
  const [notes, setNotes] = useState("");
  const [theme, setTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [activeRightTab, setActiveRightTab] = useState("Console");
  const [output, setOutput] = useState("");
  // Socket & Sync state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  
  // Remote Cursors State: socketId -> decorationId[]
  const remoteCursorsRef = useRef<Map<string, string[]>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const decorationsRef = useRef<any>(null);

  // Initialize Socket + Room Logic
  useEffect(() => {
    // 1. Connect
    const socket = io(
      process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace("/api", "") ||
        "http://localhost:5001"
    );
    socketRef.current = socket;

    socket.on("connect", () => {
      // Connected
    });

    // 2. Check URL for ?room=...
    const params = new URLSearchParams(window.location.search);
    const existingRoom = params.get("room");

    if (existingRoom) {
      setRoomId(existingRoom);
      // Join existing room -> server sends `sync_files`
      socket.emit("join_room", existingRoom);
    }

    // 3. Listeners
    socket.on("sync_files", (incomingFiles: FileItem[]) => {
      setFiles(incomingFiles);
      if (incomingFiles.length > 0) {
        // Optional: only switch if active file not in new list?
        // simple: switch to first file
         setActiveFile(incomingFiles[0].name);
      }
    });

    socket.on("code_change", ({ fileName, code }: { fileName: string; code: string }) => {
       // Update React State
       setFiles((prev) =>
        prev.map((f) => (f.name === fileName ? { ...f, content: code } : f))
      );

      // Force Update Editor if it's the active file
      // (React props sometimes don't sync fast enough or correctly while focused)
      if (fileName === activeFileRef.current && editorRef.current) {
        const model = editorRef.current.getModel();
        if (model && model.getValue() !== code) {
          // Preserve cursor
          const position = editorRef.current.getPosition();
          // Apply update (Note: this resets undo stack, but ensures sync. 
          // For truly production collaborative editing, we'd use CRDTs or operational transforms)
          model.setValue(code); 
          if (position) {
            editorRef.current.setPosition(position);
          }
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Separate effect for Cursor events to access current `activeFile` via Ref 
  const activeFileRef = useRef(activeFile);
  useEffect(() => { activeFileRef.current = activeFile; }, [activeFile]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    
    // Handler for cursor moves
    const handleCursorMove = ({ fileName, cursor, userName, socketId }: any) => {
      if (fileName !== activeFileRef.current || !editorRef.current) return;

      // Inject CSS for this user if needed
      const cleanId = socketId.replace(/[^a-zA-Z0-9-]/g, '_');
      const color = getCursorColor(cleanId);
      injectCursorStyles(cleanId, color, userName || "Anon");

      const newDecorations = [
        {
          range: {
             startLineNumber: cursor.lineNumber,
             startColumn: cursor.column,
             endLineNumber: cursor.lineNumber,
             endColumn: cursor.column
          },
          options: {
            className: `remote-cursor-${cleanId}`,
          },
        },
      ];

      const existingIds = remoteCursorsRef.current.get(socketId) || [];
      // @ts-ignore
      const newIds = editorRef.current.deltaDecorations(existingIds, newDecorations);
      remoteCursorsRef.current.set(socketId, newIds);
    };

    socket.on("cursor_move", handleCursorMove);

    return () => {
      socket.off("cursor_move", handleCursorMove);
    };
  }, [activeFile]); // Re-bind when active file changes so we are ready? Actually we use Ref so we just need listener bound once.
  // However, putting it in a separate effect that depends on `socketRef.current` (which is stable-ish) is fine.
  // To be safe we can just bind it once in the main effect? No, main effect has [] dep.
  // This is fine.


  // Sync LOCAL changes -> SERVER (if in room)
  // We need a way to only emit if it's OUR change, typically handled by not emitting on reception
  // But here we just use the handlers.

  // - load from localStorage on mount ONLY if NOT in a room (or as initial fallback)
  useEffect(() => {
    // We only load local storage if we ALREADY did. 
    // Actually, `useState(() => ...)` handles initial load.
    // We just want to ensure we don't *overwrite* server data with local stale data if we joined a room.
  }, []);

  // AI panel state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  // - load from localStorage on mount
  useEffect(() => {
    try {
      const storedFiles = localStorage.getItem("nexus-files");
      const storedNotes = localStorage.getItem("nexus-notes");
      const storedActive = localStorage.getItem("nexus-activeFile");
      if (storedFiles) setFiles(JSON.parse(storedFiles));
      if (storedNotes) setNotes(storedNotes);
      if (storedActive) setActiveFile(storedActive);
    } catch (err) {
      console.warn("Failed to load persisted state", err);
    }
  }, []);

  // - persist changes
  useEffect(() => {
    localStorage.setItem("nexus-files", JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem("nexus-notes", notes);
  }, [notes]);

  useEffect(() => {
    localStorage.setItem("nexus-activeFile", activeFile);
  }, [activeFile]);

  // helpers
  const inferLanguageFromName = (filename: string) => {
    const dot = filename.lastIndexOf(".");
    if (dot === -1) return "plaintext";
    const ext = filename.slice(dot).toLowerCase();
    return extensionToLang[ext] ?? "plaintext";
  };

  const ensureUniqueName = (name: string) => {
    return !files.some((f) => f.name === name);
  };

  // create file (from inline input)
  const handleCreateFile = () => {
    const name = newFileName?.trim();
    if (!name) {
      alert("Please enter a file name (including extension), e.g. main.py");
      return;
    }
    if (!name.includes(".")) {
      alert("Please include a file extension, e.g. .py, .js");
      return;
    }
    const ext = "." + name.split(".").pop()!.toLowerCase();
    if (!extensionToLang[ext]) {
      alert(
        "Unsupported extension. Supported: " +
          Object.keys(extensionToLang).join(", ")
      );
      return;
    }
    if (!ensureUniqueName(name)) {
      alert("File already exists");
      return;
    }
    const newFile: FileItem = { name, content: "" };
    setFiles((prev) => [...prev, newFile]);
    setActiveFile(name);
    setNewFileName("");
    setShowNewFileInput(false);
  };

  // delete file
  const handleDeleteFile = (name: string) => {
    if (files.length === 1) {
      alert("You must keep at least one file.");
      return;
    }
    if (!confirm(`Delete file "${name}"?`)) return;
    const updated = files.filter((f) => f.name !== name);
    setFiles(updated);
    if (activeFile === name) setActiveFile(updated[0].name);
  };

  // save active file locally (download)
  const saveCodeFile = () => {
    const file = files.find((f) => f.name === activeFile);
    if (!file) return;
    const content = editorRef.current?.getValue() ?? file.content;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const saveNotesFile = () => {
    const blob = new Blob([notes], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notes.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // run code using Piston endpoint (sends the active file)
  async function handleRunCode() {
    const file = files.find((f) => f.name === activeFile);
    if (!file) {
      setOutput("No active file to run");
      return;
    }
    const codeToRun = editorRef.current?.getValue() ?? file.content;
    const language = inferLanguageFromName(file.name);
    setOutput("⏳ Running...");
    setActiveRightTab("Console");

    try {
      const res = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          version: "*",
          files: [{ name: file.name, content: codeToRun }],
        }),
      });
      const data = await res.json();
      if (data.run?.stderr) setOutput(`❌ Error:\n${data.run.stderr}`);
      else setOutput(data.run?.output ?? "⚠️ No output");
    } catch (err: unknown) {
      setOutput("❌ Network Error: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  // when Add File clicked we open the inline input and focus it
  useEffect(() => {
    if (showNewFileInput && newFileInputRef.current) {
      newFileInputRef.current.focus();
    }
  }, [showNewFileInput]);

  // AI helper: call backend AI endpoint
  async function handleAskAI() {
    const prompt = aiPrompt?.trim();
    if (!prompt) {
      setAiResponse("Please enter a prompt.");
      return;
    }
    setAiLoading(true);
    setAiResponse("");

    try {
      const backendBase =
        (process.env.NEXT_PUBLIC_BACKEND_API_URL &&
          process.env.NEXT_PUBLIC_BACKEND_API_URL.replace(/\/$/, "")) ||
        "";
      const endpoint = backendBase ? `${backendBase}/ai/generate` : "/api/ai/generate";

      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        credentials: "include",
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ error: resp.statusText }));
        setAiResponse(`Error: ${body?.error ?? resp.statusText}`);
        return;
      }

      const data = await resp.json();
      if (data?.text) setAiResponse(data.text);
      else if (data?.error) setAiResponse(`Error: ${JSON.stringify(data.error)}`);
      else setAiResponse(JSON.stringify(data));
    } catch (err: unknown) {
      setAiResponse("Network error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAiLoading(false);
    }
  }

  // get current file + language for editor
  const currentFile = files.find((f) => f.name === activeFile) ?? files[0];
  const currentLanguage = inferLanguageFromName(currentFile.name);

  return (
    <ProtectedRoute>
      <div className="h-screen w-screen flex flex-col bg-gray-900 overflow-hidden">
        {/* TOP BAR */}
        <div className="flex justify-between items-center px-4 h-12 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-4 text-white">
            <h1 className="text-xl font-bold text-blue-500">NexusCode</h1>
            <div className="flex items-center text-sm text-gray-400 ml-6">
              <Code className="w-4 h-4 mr-1" />
              <span className="mr-2 truncate">{currentFile.name}</span>
              <span className="mx-2 text-gray-600">|</span>
              <span className="text-green-400">{currentLanguage}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-white">
            <button
              onClick={handleRunCode}
              className="flex items-center gap-1 px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 transition font-semibold"
            >
              <FaPlay className="w-3 h-3" /> Run
            </button>

            <button
              onClick={saveCodeFile}
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 border border-gray-600 text-sm"
            >
              <FaDownload className="inline mr-1" /> Save Code
            </button>

            <button
              onClick={() => {
                // Generate a new room ID
                const newRoomId = generateRoomId();
                setRoomId(newRoomId);
                
                // Update URL without reload
                const url = new URL(window.location.href);
                url.searchParams.set("room", newRoomId);
                window.history.pushState({}, "", url.toString());

                // Inform socket
                socketRef.current?.emit("create_room", { roomId: newRoomId, files });

                // Copy to clipboard
                navigator.clipboard.writeText(url.toString());
                alert("Share link copied! Send it to a friend.");
              }}
              className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-sm font-semibold"
            >
              Share Code
            </button> 
            
            <button
              onClick={saveNotesFile}
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 border border-gray-600 text-sm"
            >
              <FaDownload className="inline mr-1" /> Save Notes
            </button>

            <nav className="flex items-center gap-2 relative">
              {status === "loading" ? (
                <CgProfile className="size-6 opacity-60" />
              ) : session?.user ? (
                <div className="relative flex items-center gap-2">
                  <p className="text-sm font-medium hidden sm:inline text-gray-300">
                    {session.user.name?.split(" ")[0] ?? "User"}
                  </p>
                  <button
                    onClick={() => setShowDropdown((p) => !p)}
                    className="flex items-center focus:outline-none"
                  >
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name ?? "Profile"}
                        width={30}
                        height={30}
                        className="rounded-full cursor-pointer border border-gray-600"
                      />
                    ) : (
                      <CgProfile className="size-6 cursor-pointer text-gray-400 hover:text-white transition" />
                    )}
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 top-8 mt-2 bg-gray-700 text-white rounded-md shadow-lg border border-gray-600 p-1 min-w-[150px] z-10">
                      <p className="px-3 py-1 text-sm border-b border-gray-600 truncate">
                        {session.user.name ?? "User"}
                      </p>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full text-left px-3 py-1 text-sm rounded-sm hover:bg-red-600 transition"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div></div>
              )}
            </nav>
          </div>
        </div>

        {/* MAIN: left sidebar, editor, right panel */}
        <div className="flex flex-row h-[calc(100vh-3rem)]">
          {/* LEFT SIDEBAR */}
          <div className="w-60 bg-gray-900 border-r border-gray-700 flex flex-col justify-between">
            <div className="flex flex-col">
              <h3 className="px-4 py-3 text-xs font-semibold uppercase text-gray-400 border-b border-gray-800">
                Files
              </h3>

              {/* file list */}
              <div className="overflow-auto">
                {files.map((f) => (
                  <NavItem
                    key={f.name}
                    icon={Folder}
                    label={f.name}
                    isActive={f.name === activeFile}
                    onClick={() => setActiveFile(f.name)}
                    onDelete={() => handleDeleteFile(f.name)}
                  />
                ))}
              </div>

              {/* Add new file inline */}
              <div className="px-3 py-2 border-t border-gray-800">
                {!showNewFileInput ? (
                  <button
                    onClick={() => setShowNewFileInput(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800 rounded text-sm text-gray-200 hover:bg-gray-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add File
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      ref={newFileInputRef}
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateFile();
                        if (e.key === "Escape") {
                          setShowNewFileInput(false);
                          setNewFileName("");
                        }
                      }}
                      placeholder="eg. script.py"
                      className="flex-1 p-2 text-sm bg-gray-800 rounded border border-gray-600 outline-none text-white"
                    />
                    <button
                      onClick={handleCreateFile}
                      className="px-3 py-2 bg-blue-600 rounded text-sm"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowNewFileInput(false);
                        setNewFileName("");
                      }}
                      className="px-2 py-2 bg-gray-700 rounded text-sm"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* bottom quick nav */}
            <div className="flex flex-col border-t border-gray-800">
              <NavItem
                icon={Settings}
                label="Settings"
                onClick={() => setActiveRightTab("Settings")}
              />
              <NavItem
                icon={Zap}
                label="AI Assistant"
                onClick={() => setActiveRightTab("AI")}
              />
              <NavItem
                icon={MessageSquare}
                label="Notes"
                onClick={() => setActiveRightTab("Notes")}
              />
            </div>
          </div>

          {/* EDITOR */}
          <div className="flex-grow">
            <Editor
              height="100%"
              width="100%"
              theme={theme}
              language={currentLanguage}
              value={currentFile.content}
              onChange={(val) => {
                const newValue = val ?? "";
                setFiles((prev) =>
                  prev.map((p) =>
                    p.name === currentFile.name
                      ? { ...p, content: newValue }
                      : p
                  )
                );
                // Emit code change if in a room
                if (roomId && socketRef.current) {
                  socketRef.current.emit("code_change", {
                    roomId,
                    fileName: currentFile.name,
                    code: newValue,
                  });
                }
              }}
              onMount={(editor, monaco) => {
                 editorRef.current = editor;
                 // Expose monaco globally/ref for range creation if needed, or just use monaco arg
                 (window as any).monaco = monaco; 
                 
                 editor.onDidChangeCursorPosition((e: any) => {
                    if (roomId && socketRef.current) {
                      socketRef.current.emit("cursor_move", {
                        roomId,
                        fileName: currentFile.name,
                        cursor: e.position,
                        userName: session?.user?.name || "User",
                      });
                    }
                 });
              }}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize,
                padding: { top: 10, bottom: 10 },
              }}
            />
          </div>

          {/* RIGHT PANEL */}
          <div className="w-[30%] min-w-[300px] bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="flex border-b border-gray-700 bg-gray-900 p-2">
              <RightPanelTab
                label="Console"
                icon={Code}
                isActive={activeRightTab === "Console"}
                onClick={() => setActiveRightTab("Console")}
              />
              <RightPanelTab
                label="AI"
                icon={Zap}
                isActive={activeRightTab === "AI"}
                onClick={() => setActiveRightTab("AI")}
              />
              <RightPanelTab
                label="Notes"
                icon={MessageSquare}
                isActive={activeRightTab === "Notes"}
                onClick={() => setActiveRightTab("Notes")}
              />
              <RightPanelTab
                label="Settings"
                icon={Settings}
                isActive={activeRightTab === "Settings"}
                onClick={() => setActiveRightTab("Settings")}
              />
            </div>

            <div className="flex-grow overflow-y-auto p-4 relative">
              {activeRightTab === "Console" && (
                <>
                  <pre className="text-sm whitespace-pre-wrap text-white font-mono h-full">
                    {output}
                  </pre>
                  <button
                    onClick={() => setOutput("")}
                    className="absolute bottom-2 right-4 text-xs text-gray-400 hover:text-white"
                  >
                    Clear Log
                  </button>
                </>
              )}

              {activeRightTab === "AI" && (
                <div className="text-gray-400">
                  <h4 className="text-lg font-semibold mb-2 text-white">
                    AI Assistant
                  </h4>
                  <p className="mb-3">
                    Ask the AI to explain code, suggest improvements, or fix
                    bugs. The model will be called securely via your backend.
                  </p>

                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full h-28 p-3 bg-gray-800 rounded text-white resize-none outline-none"
                    placeholder="Example: Explain the bug in this code and suggest a fix..."
                  />

                  <div className="flex items-center gap-3 mt-3">
                    <button
                      disabled={aiLoading || !aiPrompt.trim()}
                      onClick={async () => {
                        await handleAskAI();
                      }}
                      className={`px-4 py-2 rounded text-white font-semibold ${
                        aiLoading
                          ? "bg-gray-600 cursor-wait"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {aiLoading ? "Thinking..." : "Ask AI"}
                    </button>

                    <button
                      onClick={() => {
                        const context = `
Explain the following ${currentLanguage} code and suggest improvements. Reply with a brief explanation and recommended changes.

Code:
${editorRef.current?.getValue() ?? currentFile.content}
`;
                        setAiPrompt(context);
                      }}
                      className="px-3 py-2 border border-gray-600 rounded text-sm text-gray-200 hover:bg-gray-700"
                    >
                      Use current file as prompt
                    </button>
                  </div>

                  <div className="mt-4">
                    <h5 className="text-sm font-semibold text-white mb-2">
                      AI Response
                    </h5>
                    <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-700 max-h-[300px] overflow-y-auto text-sm text-gray-200">
                  {aiLoading ? (
                    <span className="animate-pulse">Thinking...</span>
                  ) : aiResponse ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return match ? (
                            <SyntaxHighlighter
                              // @ts-expect-error style mismatch type
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {aiResponse}
                    </ReactMarkdown>
                  ) : (
                    <span className="text-gray-500 italic">
                      Response will appear here...
                    </span>
                  )}
                </div>
                    {aiResponse && (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => {
                            const updatedContent =
                              (editorRef.current?.getValue() ??
                                currentFile.content) +
                              "\n\n/* AI suggestions:\n" +
                              aiResponse +
                              "\n*/";
                            setFiles((prev) =>
                              prev.map((p) =>
                                p.name === currentFile.name
                                  ? { ...p, content: updatedContent }
                                  : p
                              )
                            );
                            setActiveRightTab("Console");
                          }}
                          className="px-3 py-1 bg-green-600 rounded text-sm text-white hover:bg-green-700"
                        >
                          Apply as comment
                        </button>

                        <button
                          onClick={() => {
                            navigator.clipboard
                              .writeText(aiResponse)
                              .catch(() => alert("Copy failed"));
                          }}
                          className="px-3 py-1 bg-gray-700 rounded text-sm text-white hover:bg-gray-600"
                        >
                          Copy
                        </button>

                        <button
                          onClick={() => {
                            setAiResponse("");
                            setAiPrompt("");
                          }}
                          className="px-3 py-1 bg-red-600 rounded text-sm text-white hover:bg-red-700"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeRightTab === "Notes" && (
                <div className="flex flex-col h-full">
                  <h4 className="text-lg font-semibold mb-2 text-white">
                    Session Notes
                  </h4>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="flex-1 p-2 text-sm outline-none bg-gray-900 text-white rounded resize-none"
                    placeholder="Write your session notes here..."
                  />
                </div>
              )}

              {activeRightTab === "Settings" && (
                <div className="text-white">
                  <h4 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
                    Editor Settings
                  </h4>
                  <div className="mb-4">
                    <label className="text-sm font-semibold block mb-1">
                      Theme
                    </label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                    >
                      <option value="vs-dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="hc-black">High Contrast</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="text-sm font-semibold block mb-1">
                      Font Size
                    </label>
                    <input
                      type="number"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                      min={12}
                      max={30}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}