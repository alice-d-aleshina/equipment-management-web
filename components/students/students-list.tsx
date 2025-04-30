import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { CheckCircle, XCircle, Search, Filter, UserPlus, X, CreditCard, Trash2 } from "lucide-react"
import type { Student } from "@/lib/types"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface StudentsListProps {
  students: Student[]
  onToggleAccess: (studentId: string) => void
  onAddStudent?: (student: Omit<Student, "id">) => void
  onDeleteStudent?: (studentId: string) => void
  scannedCardId?: string
}

export default function StudentsList({ students, onToggleAccess, onAddStudent, onDeleteStudent, scannedCardId }: StudentsListProps) {
  const [showMobileView, setShowMobileView] = useState(window.innerWidth < 768);
  const [filterAccess, setFilterAccess] = useState<'all' | 'granted' | 'denied'>('all');
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [studentsWithVerification, setStudentsWithVerification] = useState<(Student & { cardVerified: boolean })[]>([]);

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

  // Mobile view
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
            <Button 
              size="sm" 
              variant="outline" 
              className="text-blue-600 ml-2 h-9 w-9 p-0 flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-0"
              onClick={() => setIsAddPanelOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
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
                    
                    {onDeleteStudent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        onClick={() => {
                          if (window.confirm('Вы уверены, что хотите удалить этого студента?')) {
                            onDeleteStudent(student.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
      </div>
    );
  }

  // Desktop view
  return (
    <div className="bg-white">
      {scannedCardId && (
        <div className="bg-blue-50 p-6 mb-4 border border-blue-100 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-blue-800">Последняя отсканированная карта</h3>
              <p className="text-2xl font-bold text-blue-900 mt-1">{scannedCardId}</p>
              <p className="text-sm text-blue-600 mt-1">Карта отсканирована и готова к верификации</p>
            </div>
            <div className="bg-white p-4 rounded-full border border-blue-200">
              <CreditCard className="h-10 w-10 text-blue-500" />
            </div>
          </div>
        </div>
      )}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={filterAccess === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterAccess('all')}
              className="focus:outline-none focus-visible:ring-0"
            >
              Все студенты
            </Button>
            <Button 
              size="sm" 
              variant={filterAccess === 'granted' ? 'default' : 'outline'}
              onClick={() => setFilterAccess('granted')}
              className="bg-green-600 hover:bg-green-700 text-white focus:outline-none focus-visible:ring-0"
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Доступ разрешен
            </Button>
            <Button 
              size="sm" 
              variant={filterAccess === 'denied' ? 'default' : 'outline'}
              onClick={() => setFilterAccess('denied')}
              className="bg-red-600 hover:bg-red-700 text-white focus:outline-none focus-visible:ring-0"
            >
              <XCircle className="mr-1 h-4 w-4" />
              Доступ запрещен
            </Button>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-blue-600 focus:outline-none focus-visible:ring-0"
            onClick={() => setIsAddPanelOpen(true)}
          >
            <UserPlus className="mr-1 h-4 w-4" />
            Добавить студента
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Поиск по ФИО студента..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[300px]"
            />
          </div>
          
          <Select 
            value={groupFilter} 
            onValueChange={setGroupFilter}
          >
            <SelectTrigger className="w-[200px]">
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
      {filteredStudents.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Студенты не найдены</h3>
          <p className="mt-1 text-sm text-gray-500">Попробуйте изменить параметры поиска</p>
        </div>
      ) : (
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
                <TableCell>{student.card_id || "—"}</TableCell>
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
                    {onDeleteStudent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        title="Удалить студента"
                        onClick={() => {
                          if (window.confirm('Вы уверены, что хотите удалить этого студента?')) {
                            onDeleteStudent(student.id);
                          }
                        }}
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
      )}

      {isAddPanelOpen && (
        <AddStudentPanel
          onClose={() => setIsAddPanelOpen(false)}
          onAddStudent={handleAddStudent}
        />
      )}
    </div>
  );
}

