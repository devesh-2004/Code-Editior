"use client";
import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { FaDownload, FaPlay, FaTrash } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Plus, Folder, Code, Settings, MessageSquare, Zap } from "lucide-react";
import ProtectedRoute from "../../../components/ProtectedRoute";

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
  icon: any;
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

export default function CodePage() {
  // auth
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);

  // files state
  type FileItem = { name: string; content: string };
  const [files, setFiles] = useState<FileItem[]>(() => {
    // initial fallback
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
  const editorRef = useRef<any>(null);

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
    } catch (err: any) {
      setOutput("❌ Network Error: " + (err?.message ?? String(err)));
    }
  }

  // when Add File clicked we open the inline input and focus it
  useEffect(() => {
    if (showNewFileInput && newFileInputRef.current) {
      newFileInputRef.current.focus();
    }
  }, [showNewFileInput]);

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
              onChange={(val) =>
                setFiles((prev) =>
                  prev.map((p) =>
                    p.name === currentFile.name
                      ? { ...p, content: val ?? "" }
                      : p
                  )
                )
              }
              onMount={(editor) => (editorRef.current = editor)}
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
                  <p>
                    Ask the AI to explain code, suggest improvements, or fix
                    bugs!
                  </p>
                  <textarea
                    className="w-full h-24 mt-4 p-2 bg-gray-700 rounded text-white resize-none"
                    placeholder="How can I optimize this code?"
                  ></textarea>
                  <button className="mt-2 px-4 py-1 bg-blue-600 rounded text-white hover:bg-blue-700">
                    Ask
                  </button>
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
