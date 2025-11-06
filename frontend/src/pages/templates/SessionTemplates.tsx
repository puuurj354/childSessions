import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  Users,
  Tag,
  BookOpen,
  Target,
  Settings,
  Copy,
  Play,
  Filter,
} from "lucide-react"
import {
  GetAllSessionTemplates,
  GetTemplateCategories,
  CreateSessionTemplate,
  UpdateSessionTemplate,
  DeleteSessionTemplate,
  SearchSessionTemplates,
  CreateSessionFromTemplate,
} from "../../../wailsjs/go/main/App"
import { model } from "../../../wailsjs/go/models"
import { toast } from "sonner"

export function SessionTemplates() {
  const [templates, setTemplates] = useState<model.SessionTemplate[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<model.SessionTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    category: "",
    durationMinutes: 60,
    objectives: "",
    instructions: "",
    materials: "",
    tags: "",
    ageRangeMin: 2,
    ageRangeMax: 18,
    activitiesJSON: "",
    goalsJSON: "",
    notesTemplate: "",
  })

  useEffect(() => {
    loadTemplates()
    loadCategories()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      handleSearch()
    } else {
      loadTemplates()
    }
  }, [searchTerm, selectedCategory])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await GetAllSessionTemplates()
      let filteredData = data
      
      if (selectedCategory && selectedCategory !== "all") {
        filteredData = data.filter((t) => t.Category === selectedCategory)
      }
      
      setTemplates(filteredData)
      setError(null)
    } catch (err) {
      console.error("Error loading templates:", err)
      setError("Gagal memuat template sesi")
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await GetTemplateCategories()
      setCategories(data)
    } catch (err) {
      console.error("Error loading categories:", err)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadTemplates()
      return
    }

    try {
      setLoading(true)
      const data = await SearchSessionTemplates(searchTerm)
      let filteredData = data
      
      if (selectedCategory && selectedCategory !== "all") {
        filteredData = data.filter((t) => t.Category === selectedCategory)
      }
      
      setTemplates(filteredData)
    } catch (err) {
      console.error("Error searching templates:", err)
      setError("Gagal mencari template")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTemplateForm({
      name: "",
      description: "",
      category: "",
      durationMinutes: 60,
      objectives: "",
      instructions: "",
      materials: "",
      tags: "",
      ageRangeMin: 2,
      ageRangeMax: 18,
      activitiesJSON: "",
      goalsJSON: "",
      notesTemplate: "",
    })
    setEditingTemplate(null)
    setShowCreateForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!templateForm.name.trim() || !templateForm.category.trim()) {
      toast.error("Nama dan kategori template harus diisi")
      return
    }

    try {
      setLoading(true)
      
      if (editingTemplate) {
        await UpdateSessionTemplate(
          editingTemplate.ID,
          templateForm.name,
          templateForm.description,
          templateForm.category,
          templateForm.durationMinutes,
          templateForm.objectives,
          templateForm.instructions,
          templateForm.materials,
          templateForm.tags,
          templateForm.ageRangeMin,
          templateForm.ageRangeMax,
          templateForm.activitiesJSON,
          templateForm.goalsJSON,
          templateForm.notesTemplate
        )
        toast.success("Template berhasil diperbarui!")
      } else {
        await CreateSessionTemplate(
          templateForm.name,
          templateForm.description,
          templateForm.category,
          templateForm.durationMinutes,
          templateForm.objectives,
          templateForm.instructions,
          templateForm.materials,
          "therapist", // CreatedBy - could be dynamic
          templateForm.tags,
          templateForm.ageRangeMin,
          templateForm.ageRangeMax,
          templateForm.activitiesJSON,
          templateForm.goalsJSON,
          templateForm.notesTemplate
        )
        toast.success("Template berhasil dibuat!")
      }

      resetForm()
      loadTemplates()
      loadCategories()
    } catch (err) {
      console.error("Error saving template:", err)
      toast.error("Gagal menyimpan template")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (template: model.SessionTemplate) => {
    setTemplateForm({
      name: template.Name,
      description: template.Description,
      category: template.Category,
      durationMinutes: template.DurationMinutes,
      objectives: template.Objectives,
      instructions: template.Instructions,
      materials: template.Materials,
      tags: template.Tags,
      ageRangeMin: template.AgeRangeMin,
      ageRangeMax: template.AgeRangeMax,
      activitiesJSON: template.ActivitiesJSON,
      goalsJSON: template.GoalsJSON,
      notesTemplate: template.NotesTemplate,
    })
    setEditingTemplate(template)
    setShowCreateForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus template ini?")) return

    try {
      setLoading(true)
      await DeleteSessionTemplate(id)
      toast.success("Template berhasil dihapus!")
      loadTemplates()
    } catch (err) {
      console.error("Error deleting template:", err)
      toast.error("Gagal menghapus template")
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "assessment": return <Target className="h-4 w-4" />
      case "social": return <Users className="h-4 w-4" />
      case "behavioral": return <Settings className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "assessment": return "text-blue-600 bg-blue-50"
      case "social": return "text-green-600 bg-green-50"
      case "behavioral": return "text-purple-600 bg-purple-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
            <FileText className="text-blue-600" />
            Template Sesi
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola template sesi terapi untuk standardisasi workflow
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Buat Template
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Cari template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border rounded-md px-3 py-2 min-w-[120px]"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Memuat template...</p>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={loadTemplates} className="mt-4">
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              {searchTerm ? "Tidak ada template yang ditemukan" : "Belum ada template sesi"}
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus size={16} className="mr-2" />
              Buat Template Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.ID} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{template.Name}</CardTitle>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.Category)}`}>
                      {getCategoryIcon(template.Category)}
                      {template.Category.charAt(0).toUpperCase() + template.Category.slice(1)}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(template.ID)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {template.Description || "Tidak ada deskripsi"}
                </p>
                
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock size={12} />
                    <span>{template.DurationMinutes} menit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={12} />
                    <span>Usia {template.AgeRangeMin}-{template.AgeRangeMax} tahun</span>
                  </div>
                  {template.Tags && (
                    <div className="flex items-center gap-2">
                      <Tag size={12} />
                      <span className="truncate">{template.Tags}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Digunakan {template.UsageCount} kali
                  </span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="text-xs">
                      <Copy size={12} className="mr-1" />
                      Duplikasi
                    </Button>
                    <Button size="sm" className="text-xs">
                      <Play size={12} className="mr-1" />
                      Gunakan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Template Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingTemplate ? "Edit Template" : "Buat Template Baru"}
              </CardTitle>
              <CardDescription>
                Template akan membantu standardisasi sesi terapi Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nama Template *
                    </label>
                    <Input
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      placeholder="Nama template sesi"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Kategori *
                    </label>
                    <select
                      value={templateForm.category}
                      onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                      className="w-full border rounded-md px-3 py-2"
                      required
                    >
                      <option value="">Pilih kategori</option>
                      <option value="assessment">Assessment</option>
                      <option value="social">Social Skills</option>
                      <option value="behavioral">Behavioral</option>
                      <option value="communication">Communication</option>
                      <option value="academic">Academic</option>
                      <option value="motor">Motor Skills</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    placeholder="Deskripsi singkat template ini"
                    className="w-full border rounded-md px-3 py-2 h-20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Durasi (menit)
                    </label>
                    <Input
                      type="number"
                      value={templateForm.durationMinutes}
                      onChange={(e) => setTemplateForm({ ...templateForm, durationMinutes: parseInt(e.target.value) || 60 })}
                      min="15"
                      max="180"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Usia Min (tahun)
                    </label>
                    <Input
                      type="number"
                      value={templateForm.ageRangeMin}
                      onChange={(e) => setTemplateForm({ ...templateForm, ageRangeMin: parseInt(e.target.value) || 2 })}
                      min="1"
                      max="18"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Usia Max (tahun)
                    </label>
                    <Input
                      type="number"
                      value={templateForm.ageRangeMax}
                      onChange={(e) => setTemplateForm({ ...templateForm, ageRangeMax: parseInt(e.target.value) || 18 })}
                      min="1"
                      max="25"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tujuan & Objektif
                    </label>
                    <textarea
                      value={templateForm.objectives}
                      onChange={(e) => setTemplateForm({ ...templateForm, objectives: e.target.value })}
                      placeholder="Tujuan utama dan objektif yang ingin dicapai..."
                      className="w-full border rounded-md px-3 py-2 h-24 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Instruksi Langkah-demi-Langkah
                    </label>
                    <textarea
                      value={templateForm.instructions}
                      onChange={(e) => setTemplateForm({ ...templateForm, instructions: e.target.value })}
                      placeholder="1. Langkah pertama...&#10;2. Langkah kedua...&#10;3. Dan seterusnya..."
                      className="w-full border rounded-md px-3 py-2 h-32 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Materi & Peralatan
                    </label>
                    <textarea
                      value={templateForm.materials}
                      onChange={(e) => setTemplateForm({ ...templateForm, materials: e.target.value })}
                      placeholder="Daftar materi dan peralatan yang diperlukan..."
                      className="w-full border rounded-md px-3 py-2 h-20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tags (pisahkan dengan koma)
                    </label>
                    <Input
                      value={templateForm.tags}
                      onChange={(e) => setTemplateForm({ ...templateForm, tags: e.target.value })}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Menyimpan..." : editingTemplate ? "Perbarui" : "Buat Template"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}