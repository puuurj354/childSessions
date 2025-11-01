import { toDate } from "@/lib/utils"
import React, { useEffect, useState, useRef } from "react"
import {
  AddNote,
  UpdateNote,
  DeleteNote,
  GetAllNoteTemplates,
} from "../../../wailsjs/go/main/App"
import { model } from "../../../wailsjs/go/models"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ArrowDownToLine,
  ArrowUpToLine,
  Tag,
  FileText,
} from "lucide-react"

interface NotesSectionProps {
  sessionId: number
  notes: model.Note[]
  loading: boolean
  onNoteAdded: () => void
}

export function NotesSection({
  sessionId,
  notes,
  loading,
  onNoteAdded,
}: NotesSectionProps) {
  const [showAddNote, setShowAddNote] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [category, setCategory] = useState("")
  const [editingNote, setEditingNote] = useState<model.Note | null>(null)
  const [editText, setEditText] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [templates, setTemplates] = useState<model.NoteTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const data = await GetAllNoteTemplates()
      setTemplates(data)
    } catch (err) {
      // Don't show error for templates as it's not critical
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    try {
      setLoadingNotes(true)
      await AddNote(sessionId, noteText.trim(), category)
      setNoteText("")
      setCategory("")
      setSelectedTemplate(null)
      setShowAddNote(false)
      setHighlightIndex(null)
      onNoteAdded()
    } catch (err) {
      setError("Gagal menambah catatan")
    } finally {
      setLoadingNotes(false)
    }
  }

  const handleUpdateNote = async (noteId: number) => {
    if (!editText.trim()) return
    try {
      setLoadingNotes(true)
      await UpdateNote(noteId, editText.trim(), editCategory)
      setEditingNote(null)
      setEditText("")
      setEditCategory("")
      onNoteAdded()
    } catch (err) {
      setError("Gagal memperbarui catatan")
    } finally {
      setLoadingNotes(false)
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    if (!window.confirm("Hapus catatan ini?")) return
    try {
      setLoadingNotes(true)
      await DeleteNote(noteId)
      onNoteAdded()
    } catch (err) {
      setError("Gagal menghapus catatan")
    } finally {
      setLoadingNotes(false)
    }
  }

  const handleTemplateSelect = (templateId: number) => {
    const template = templates.find((t) => t.ID === templateId)
    if (template) {
      setNoteText(template.TemplateText)
      setCategory(template.CategoryHint || "")
      setSelectedTemplate(templateId)
      setHighlightIndex(0)
      setTimeout(() => jumpPlaceholder("next"), 0)
    }
  }

  // Highlight placeholders in preview and textarea
  const highlightPlaceholders = (text: string) => {
    const regex = /\[([^\]]+)\]/g
    let lastIndex = 0
    let match: RegExpExecArray | null
    const elements = []
    let idx = 0
    while ((match = regex.exec(text)) !== null) {
      elements.push(text.slice(lastIndex, match.index))
      elements.push(
        <span
          key={idx}
          className={`bg-yellow-200 text-yellow-900 px-1 rounded cursor-pointer ${
            highlightIndex === idx ? "ring-2 ring-yellow-500" : ""
          }`}
          onClick={() => {
            setHighlightIndex(idx)
            if (textareaRef.current && match) {
              const pos = match.index
              textareaRef.current.focus()
              textareaRef.current.setSelectionRange(pos, pos + match[0].length)
            }
          }}
        >
          {match[0]}
        </span>
      )
      lastIndex = match.index + match[0].length
      idx++
    }
    elements.push(text.slice(lastIndex))
    return elements
  }

  // Jump to next/prev placeholder
  const jumpPlaceholder = (dir: "next" | "prev") => {
    const matches = [...noteText.matchAll(/\[([^\]]+)\]/g)]
    if (!matches.length) return
    let idx = highlightIndex ?? (dir === "next" ? -1 : matches.length)
    if (dir === "next") {
      idx = (idx + 1) % matches.length
    } else {
      idx = (idx - 1 + matches.length) % matches.length
    }
    setHighlightIndex(idx)
    if (textareaRef.current && matches[idx]) {
      const pos = matches[idx].index ?? 0
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(pos, pos + matches[idx][0].length)
    }
  }

  const categories = [
    "Perilaku",
    "Kemajuan",
    "Tantangan",
    "Komunikasi",
    "Motorik",
    "Sosial",
    "Emosi",
    "Lainnya",
  ]

  const startEdit = (note: model.Note) => {
    setEditingNote(note)
    setEditText(note.NoteText)
    setEditCategory(note.Category)
  }

  const cancelEdit = () => {
    setEditingNote(null)
    setEditText("")
    setEditCategory("")
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Catatan Sesi</h2>
        <button
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-3 py-1 rounded-md"
          onClick={() => setShowAddNote(true)}
          disabled={loadingNotes}
        >
          <Plus size={16} />
          <span>Tambah Catatan</span>
        </button>
      </div>

      {showAddNote && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah Catatan Sesi</CardTitle>
            <CardDescription>
              Pilih template untuk mempercepat penulisan, lalu isi bagian{" "}
              <span className="font-mono bg-yellow-100 px-1 rounded">
                [placeholder]
              </span>{" "}
              jika ada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Template Catatan (Opsional)
                  </label>
                  <select
                    className="w-full border rounded-md p-2 mb-2"
                    value={selectedTemplate || ""}
                    onChange={(e) => {
                      const templateId = Number(e.target.value)
                      if (templateId) {
                        handleTemplateSelect(templateId)
                      } else {
                        setSelectedTemplate(null)
                        setNoteText("")
                        setCategory("")
                        setHighlightIndex(null)
                      }
                    }}
                  >
                    <option value="">Pilih template...</option>
                    {templates.map((template) => (
                      <option key={template.ID} value={template.ID}>
                        {template.TemplateText.substring(0, 50)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium">Kategori</label>
                <select
                  className="w-full border rounded-md p-2"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Pilih kategori...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Teks Catatan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    required
                    rows={4}
                    className="w-full border rounded-md p-2 font-mono"
                    placeholder="Tulis catatan tentang sesi ini..."
                  />
                  <div className="absolute right-2 top-2 flex flex-col gap-1">
                    <button
                      type="button"
                      className="p-1 bg-yellow-100 rounded hover:bg-yellow-200"
                      title="Placeholder berikutnya"
                      onClick={() => jumpPlaceholder("next")}
                    >
                      <ArrowDownToLine size={14} />
                    </button>
                    <button
                      type="button"
                      className="p-1 bg-yellow-100 rounded hover:bg-yellow-200"
                      title="Placeholder sebelumnya"
                      onClick={() => jumpPlaceholder("prev")}
                    >
                      <ArrowUpToLine size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Klik{" "}
                  <span className="font-mono bg-yellow-100 px-1 rounded">
                    [placeholder]
                  </span>{" "}
                  di preview untuk lompat ke bagian tersebut.
                </div>
                <div className="border rounded-md p-2 bg-gray-50 font-mono text-sm mt-2 min-h-[40px]">
                  {highlightPlaceholders(noteText)}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddNote(false)
                    setNoteText("")
                    setCategory("")
                    setSelectedTemplate(null)
                    setHighlightIndex(null)
                  }}
                  className="px-4 py-2 border rounded-md"
                  disabled={loadingNotes}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                  disabled={!noteText.trim() || loadingNotes}
                >
                  Simpan
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="mx-auto mb-2" size={32} />
          Belum ada catatan untuk sesi ini.
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.ID} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {editingNote?.ID === note.ID ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="w-full border rounded-md p-2 font-mono"
                    />
                    <select
                      className="w-full border rounded-md p-2"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                    >
                      <option value="">Pilih kategori...</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1 border rounded-md"
                        disabled={loadingNotes}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateNote(note.ID)}
                        className="px-3 py-1 bg-primary text-primary-foreground rounded-md"
                        disabled={!editText.trim() || loadingNotes}
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      {note.Category && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mr-2">
                          {note.Category}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {toDate(note.Timestamp).toLocaleString("id-ID")}
                      </span>
                      <div className="mt-1 text-sm whitespace-pre-wrap font-mono">
                        {note.NoteText}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1 ml-4">
                      <button
                        onClick={() => startEdit(note)}
                        className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                        disabled={loadingNotes}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.ID)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        disabled={loadingNotes}
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
