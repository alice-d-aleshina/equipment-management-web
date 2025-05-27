import React, { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { CheckCircle, XCircle, Search, Filter, UserPlus, X, CreditCard, Trash2, AlertCircle, LinkIcon } from "lucide-react"
import type { Student } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Add Dialog imports
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Add CardBindingDialog component
const CardBindingDialog = ({ 
  isOpen,
  onClose,
  onBind,
  students,
  scannedCardId,
  preselectedStudentId,
}: { 
  isOpen: boolean;
  onClose: () => void;
  onBind: (studentId: string, cardId: string) => void;
  students: Student[];
  scannedCardId?: string;
  preselectedStudentId?: string;
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isWaitingForScan, setIsWaitingForScan] = useState(false);
  const [manualCardId, setManualCardId] = useState("");

  // Filter students without cards
  const studentsWithoutCards = students.filter(student => !student.card_id);

  // Reset state when dialog opens and set preselected student if provided
  useEffect(() => {
    if (isOpen) {
      setSelectedStudentId(preselectedStudentId || "");
      setIsWaitingForScan(false);
      setManualCardId("");
    }
  }, [isOpen, preselectedStudentId]);

  // When a card is scanned while waiting for scan, bind it
  useEffect(() => {
    if (isWaitingForScan && scannedCardId && selectedStudentId) {
      onBind(selectedStudentId, scannedCardId);
      setIsWaitingForScan(false);
      onClose();
    }
  }, [scannedCardId, isWaitingForScan, selectedStudentId, onBind, onClose]);

  const handleStartScan = () => {
    setIsWaitingForScan(true);
  };

  const handleManualBind = () => {
    if (selectedStudentId && manualCardId) {
      onBind(selectedStudentId, manualCardId);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-blue-600">
            <LinkIcon className="h-5 w-5 mr-2" />
            Привязка карты к студенту
          </DialogTitle>
          <DialogDescription>
            {studentsWithoutCards.length > 0 
              ? "Выберите студента и отсканируйте карту для привязки или введите ID карты вручную."
              : "Все студенты уже имеют привязанные карты."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {studentsWithoutCards.length > 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="student">Выберите студента</Label>
                <Select 
                  value={selectedStudentId} 
                  onValueChange={setSelectedStudentId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите студента" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentsWithoutCards.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.group})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isWaitingForScan ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200 text-center">
                    <CreditCard className="h-12 w-12 mx-auto text-blue-500 mb-2" />
                    <p className="text-blue-700 font-medium">Ожидание сканирования карты...</p>
                    {scannedCardId && <p className="mt-2 text-green-600">Карта отсканирована: {scannedCardId}</p>}
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => setIsWaitingForScan(false)}>
                    Отменить сканирование
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cardId">ID карты (вручную)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cardId"
                        value={manualCardId}
                        onChange={(e) => setManualCardId(e.target.value)}
                        placeholder="Введите ID карты вручную"
                        className="flex-1"
                      />
                      <Button 
                        variant="outline"
                        onClick={handleManualBind}
                        disabled={!selectedStudentId || !manualCardId}
                      >
                        Привязать
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="flex-grow h-px bg-gray-200"></div>
                    <span className="px-3 text-gray-500 text-sm">или</span>
                    <div className="flex-grow h-px bg-gray-200"></div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleStartScan}
                    disabled={!selectedStudentId}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Сканировать карту
                  </Button>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-2">Нет доступных студентов</p>
              <p className="text-sm text-gray-500">Все студенты уже имеют привязанные карты</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Add Student Panel Component
const AddStudentPanel = ({ 
  onClose, 
  onAddStudent 
}: { 
  onClose: () => void; 
  onAddStudent: (student: Omit<Student, "id">) => void;
}) => {
  const [newStudent, setNewStudent] = useState<Omit<Student, "id">>({
    name: "",
    group: "",
    hasAccess: false
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewStudent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAccessChange = (value: string) => {
    setNewStudent((prev) => ({
      ...prev,
      hasAccess: value === "yes"
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddStudent(newStudent);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Добавить студента</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ФИО студента</Label>
            <Input
              id="name"
              name="name"
              value={newStudent.name}
              onChange={handleInputChange}
              placeholder="Иванов Иван Иванович"
              className="w-full h-10 rounded-xl"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="group">Группа</Label>
            <Input
              id="group"
              name="group"
              value={newStudent.group}
              onChange={handleInputChange}
              placeholder="CS-101"
              className="w-full h-10 rounded-xl"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="access">Доступ к оборудованию</Label>
            <Select 
              onValueChange={handleAccessChange} 
              defaultValue="no"
            >
              <SelectTrigger className="w-full h-10 rounded-xl">
                <SelectValue placeholder="Выберите статус доступа" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Разрешен</SelectItem>
                <SelectItem value="no">Запрещен</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className={isMobile ? "w-full rounded-xl" : "rounded-xl"}
            >
              Отмена
            </Button>
            <Button 
              type="submit" 
              className={`bg-blue-600 hover:bg-blue-700 rounded-xl ${isMobile ? "w-full" : ""}`}
            >
              Добавить
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add DeleteConfirmDialog component below AddStudentPanel
const DeleteConfirmDialog = ({ 
  isOpen,
  onClose,
  onConfirm,
  studentName,
  equipmentList,
}: { 
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  studentName: string;
  equipmentList: string[];
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            Невозможно удалить студента
          </DialogTitle>
          <DialogDescription>
            Студент <span className="font-medium">{studentName}</span> не может быть удален, так как у него есть выданное оборудование.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <h3 className="text-sm font-medium mb-2">Сначала необходимо вернуть:</h3>
          <ul className="bg-gray-50 p-3 rounded-md border border-gray-200">
            {equipmentList.map((item, index) => (
              <li key={index} className="text-sm py-1 pl-2 border-l-2 border-red-400">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface StudentsListProps {
  students: Student[]
  onToggleAccess: (studentId: string) => void
  onAddStudent?: (student: Omit<Student, "id">) => void
  onDeleteStudent?: (studentId: string) => Promise<{canDelete: boolean, equipment?: string[]}>
  scannedCardId?: string
  onBindCard?: (studentId: string, cardId: string) => void
}

export default function StudentsList({ 
  students, 
  onToggleAccess, 
  onAddStudent, 
  onDeleteStudent, 
  scannedCardId,
  onBindCard
}: StudentsListProps) {
  const [showMobileView, setShowMobileView] = useState(window.innerWidth < 768);
  const [filterAccess, setFilterAccess] = useState<'all' | 'granted' | 'denied'>('all');
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [studentsWithVerification, setStudentsWithVerification] = useState<(Student & { cardVerified: boolean })[]>([]);
  
  // Add new state for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{id: string; name: string; equipment: string[]}>({
    id: '',
    name: '',
    equipment: []
  });

  // Add new state for card binding dialog
  const [cardBindingDialogOpen, setCardBindingDialogOpen] = useState(false);
  // Add missing selectedStudentId state
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Get unique groups from students
  const studentGroups = ['all', ...Array.from(new Set(students.map(student => student.group)))];

  // Update students with verification status when scanned card changes
  useEffect(() => {
    const updatedStudents = students.map(student => ({
      ...student,
      cardVerified: student.card_id && scannedCardId 
        ? student.card_id.toUpperCase() === scannedCardId.toUpperCase()
        : false
    }));
    setStudentsWithVerification(updatedStudents);
  }, [students, scannedCardId]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setShowMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle add student
  const handleAddStudent = (studentData: Omit<Student, "id">) => {
    if (onAddStudent) {
      onAddStudent(studentData);
      setIsAddPanelOpen(false);
    }
  };

  // Filter students based on access, search query and group
  const filteredStudents = studentsWithVerification.filter(student => {
    const matchesAccess = filterAccess === 'all' || 
                        (filterAccess === 'granted' && student.hasAccess) || 
                        (filterAccess === 'denied' && !student.hasAccess);
    const matchesSearch = searchQuery === '' || 
                        student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = groupFilter === 'all' || student.group === groupFilter;
    
    return matchesAccess && matchesSearch && matchesGroup;
  });

  // Fix handleDeleteClick function
  const handleDeleteClick = async (student: Student) => {
    if (!onDeleteStudent) return;
    
    try {
      // Call the onDeleteStudent function to check if student has equipment
      const result = await onDeleteStudent(student.id);
      
      // If student has equipment, show our dialog
      if (!result.canDelete && result.equipment && result.equipment.length > 0) {
        setStudentToDelete({
          id: student.id,
          name: student.name,
          equipment: result.equipment
        });
        setDeleteDialogOpen(true);
      }
      // If student was successfully deleted, the UI is already updated by the parent component
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  // Add handleBindCard function
  const handleBindCard = (studentId: string, cardId: string) => {
    if (onBindCard) {
      onBindCard(studentId, cardId);
    }
  };

  // Mobile view with added card binding
  if (showMobileView) {
    return (
      <div className="bg-white">
        {scannedCardId && (
          <div className="bg-blue-50 p-4 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-blue-800">Последняя отсканированная карта</h3>
                <p className="text-lg font-bold text-blue-900 mt-1">{scannedCardId}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        )}
        <div className="border-b border-gray-200 p-3">
          <div className="flex justify-between items-center mb-3">
            <div className="flex gap-1 flex-1">
              <Button 
                size="sm" 
                variant={filterAccess === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterAccess('all')}
                className={`flex-1 text-sm font-medium rounded-xl focus:outline-none focus-visible:ring-0 ${
                  filterAccess === 'all' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-50 text-gray-600 hover:text-gray-800'
                }`}
              >
                Все
              </Button>
              <Button 
                size="sm" 
                variant={filterAccess === 'granted' ? 'default' : 'outline'}
                onClick={() => setFilterAccess('granted')}
                className={`flex-1 text-sm font-medium rounded-xl focus:outline-none focus-visible:ring-0 ${
                  filterAccess === 'granted' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-50 text-gray-600 hover:text-gray-800 border border-green-200'
                }`}
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Разрешен
              </Button>
              <Button 
                size="sm" 
                variant={filterAccess === 'denied' ? 'default' : 'outline'}
                onClick={() => setFilterAccess('denied')}
                className={`flex-1 text-sm font-medium rounded-xl focus:outline-none focus-visible:ring-0 ${
                  filterAccess === 'denied' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-50 text-gray-600 hover:text-gray-800 border border-red-200'
                }`}
              >
                <XCircle className="mr-1 h-3 w-3" />
                Запрещен
              </Button>
            </div>
            
          </div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex gap-1 flex-1">
              
              
              
            </div>
            <div className="flex gap-1">
              {onBindCard && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-9 p-0 w-9 flex items-center justify-center rounded-full"
                  onClick={() => setCardBindingDialogOpen(true)}
                >
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </Button>
              )}
            <Button 
              size="sm" 
              variant="outline" 
                className="h-9 p-0 w-9 flex items-center justify-center rounded-full"
              onClick={() => setIsAddPanelOpen(true)}
            >
                <UserPlus className="h-4 w-4 text-blue-600" />
            </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Поиск по ФИО студента..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 w-full h-10 rounded-xl"
              />
            </div>
            
            <Select 
              value={groupFilter} 
              onValueChange={setGroupFilter}
            >
              <SelectTrigger className="w-full h-10 rounded-xl">
                <SelectValue placeholder="Фильтр по группе" />
              </SelectTrigger>
              <SelectContent>
                {studentGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group === 'all' ? 'Все группы' : group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="border-b border-gray-200 p-3">
          

          
        </div>
        
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Студенты не найдены</h3>
            <p className="mt-1 text-sm text-gray-500">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredStudents.map((student) => (
              <div key={student.id} className="bg-white border border-gray-200 rounded-xl mb-3 overflow-hidden">
                <div className="p-4 relative">
                  {student.cardVerified && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-blue-100 text-blue-800 px-2 py-1 text-xs">Карта проверена</Badge>
                    </div>
                  )}
                  <div className="flex items-center mb-3">
                    <Avatar className="h-9 w-9 mr-3">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}`} />
                  </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-500">Группа: {student.group}</p>
                      {student.card_id && (
                        <p className="text-xs text-blue-600 flex items-center mt-1">
                          <CreditCard className="h-3 w-3 mr-1" />
                          Карта: {student.card_id}
                        </p>
                      )}
                    </div>
                      </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={student.hasAccess}
                        onCheckedChange={() => onToggleAccess(student.id)}
                        className={student.hasAccess ? "bg-green-600" : "bg-gray-200"}
                      />
                      <span className={`text-sm ${student.hasAccess ? "text-green-600" : "text-gray-500"}`}>
                        {student.hasAccess ? "Доступ разрешен" : "Доступ запрещен"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {onBindCard && !student.card_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                          onClick={() => {
                            setSelectedStudentId(student.id);
                            setCardBindingDialogOpen(true);
                          }}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                      {onDeleteStudent && (
                      <Button
                          variant="ghost"
                        size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          onClick={() => handleDeleteClick(student)}
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isAddPanelOpen && (
          <AddStudentPanel
            onClose={() => setIsAddPanelOpen(false)}
            onAddStudent={handleAddStudent}
          />
        )}

        {/* Add delete confirmation dialog */}
        <DeleteConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={() => setDeleteDialogOpen(false)}
          studentName={studentToDelete.name}
          equipmentList={studentToDelete.equipment}
        />

        {/* Add card binding dialog */}
        {onBindCard && (
          <CardBindingDialog
            isOpen={cardBindingDialogOpen}
            onClose={() => setCardBindingDialogOpen(false)}
            onBind={handleBindCard}
            students={students}
            scannedCardId={scannedCardId}
            preselectedStudentId={selectedStudentId}
          />
        )}
      </div>
    );
  }

  // Desktop view with added card binding
  return (
    <div className="bg-white">
      <div className="mb-4">
          <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Поиск студентов..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 min-w-[300px]"
              />
            </div>
            <div className="relative">
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="flex items-center gap-1 h-10 w-auto min-w-[150px]">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {groupFilter === 'all' ? 'Все группы' : `Группа: ${groupFilter}`}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все группы</SelectItem>
                  {studentGroups.filter(g => g !== 'all').map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              className="gap-2"
              onClick={() => setFilterAccess('all')}
            >
              Все
            </Button>
            <Button 
              variant={filterAccess === 'granted' ? "default" : "outline"}
              className="gap-2"
              onClick={() => setFilterAccess('granted')}
            >
              <CheckCircle className="h-4 w-4" />
              С доступом
            </Button>
            <Button 
              variant={filterAccess === 'denied' ? "default" : "outline"}
              className="gap-2"
              onClick={() => setFilterAccess('denied')}
            >
              <XCircle className="h-4 w-4" />
              Без доступа
            </Button>
            
          </div>
        </div>
      </div>
      <div className="mb-4">
          <div className="flex items-center justify-between">
          
          
          <div className="flex gap-2">
           
            {onBindCard && (
          <Button 
            variant="outline" 
                className="gap-2"
                onClick={() => setCardBindingDialogOpen(true)}
              >
                <CreditCard className="h-4 w-4" />
                Привязать карту
              </Button>
            )}
            {onAddStudent && (
              <Button
                className="gap-2"
            onClick={() => setIsAddPanelOpen(true)}
          >
                <UserPlus className="h-4 w-4" />
            Добавить студента
          </Button>
            )}
          </div>
        </div>
      </div>

        <Table>
          <TableHeader>
            <TableRow>
            <TableHead className="bg-white">Имя</TableHead>
            <TableHead className="bg-white">Группа</TableHead>
            <TableHead className="bg-white">ID карты</TableHead>
            <TableHead className="bg-white">Доступ</TableHead>
            <TableHead className="bg-white text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}`} />
                  </Avatar>
                  {student.name}
                  {student.cardVerified && (
                    <Badge className="ml-2 bg-blue-100 text-blue-800">ID проверен</Badge>
                  )}
                </div>
                </TableCell>
                <TableCell>{student.group}</TableCell>
              <TableCell>
                {student.card_id ? (
                  <span className="text-blue-600 flex items-center">
                    <CreditCard className="h-4 w-4 mr-1" />
                    {student.card_id}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
                </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Switch
                    checked={student.hasAccess}
                    onCheckedChange={() => onToggleAccess(student.id)}
                    className={student.hasAccess ? "bg-green-600" : "bg-gray-200"}
                  />
                  <span className={`ml-2 ${student.hasAccess ? "text-green-600" : "text-gray-500"}`}>
                    {student.hasAccess ? "Разрешен" : "Запрещен"}
                  </span>
                </div>
                </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  {onBindCard && !student.card_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                      title="Привязать карту"
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setCardBindingDialogOpen(true);
                      }}
                    >
                      <CreditCard className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeleteStudent && (
                  <Button
                      variant="ghost"
                    size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      title="Удалить студента"
                      onClick={() => handleDeleteClick(student)}
                  >
                      <Trash2 className="h-4 w-4" />
                  </Button>
                  )}
                </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

      {isAddPanelOpen && (
        <AddStudentPanel
          onClose={() => setIsAddPanelOpen(false)}
          onAddStudent={handleAddStudent}
        />
      )}
      
      {/* Add delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => setDeleteDialogOpen(false)}
        studentName={studentToDelete.name}
        equipmentList={studentToDelete.equipment}
      />

      {/* Add card binding dialog */}
      {onBindCard && (
        <CardBindingDialog
          isOpen={cardBindingDialogOpen}
          onClose={() => setCardBindingDialogOpen(false)}
          onBind={handleBindCard}
          students={students}
          scannedCardId={scannedCardId}
          preselectedStudentId={selectedStudentId}
        />
      )}
    </div>
  );
}

