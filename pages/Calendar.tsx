
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { CalendarEvent, CaseFile } from '../types';
import { Modal, Spinner } from '../components/UI';
import { ConfirmModal } from '../components/ConfirmModal';

export const Calendar = () => {
  const user = storageService.getCurrentUser();
  const isOrgOwner = user?.subscriptionPlan === 'enterprise' && !user?.organizationOwnerId;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState('hearing');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const [eventsData, casesData] = await Promise.all([
        storageService.getEvents(),
        storageService.getCases()
      ]);
      setEvents(eventsData);
      setCases(casesData);
      setLoading(false);
    };
    loadData();
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day + 1).toISOString().split('T')[0]; 
    setNewEventDate(dateStr);
    setShowModal(true);
  };

  const handleAddEvent = async () => {
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: newEventTitle,
      date: newEventDate,
      time: newEventTime || undefined,
      type: newEventType as any,
      description: newEventDesc,
      caseId: selectedCaseId || undefined
    };
    
    // Find case title locally for immediate UI update
    if (selectedCaseId) {
       const foundCase = cases.find(c => c.id === selectedCaseId);
       if (foundCase) newEvent.caseTitle = foundCase.title;
    }
    
    await storageService.addEvent(newEvent);
    setEvents([...events, newEvent]);
    
    // Send attendance created email
    try {
      const user = storageService.getCurrentUser();
      if (user) {
        const { emailService } = await import('../services/emailService');
        await emailService.sendAttendanceCreatedEmail(
          user.email, 
          user.name, 
          newEvent.title, 
          newEvent.date
        );
      }
    } catch (emailError) {
      console.error('Failed to send attendance created email:', emailError);
    }
    
    setShowModal(false);
    // Reset form
    setNewEventTitle('');
    setNewEventTime('');
    setNewEventDesc('');
    setSelectedCaseId('');
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEventDetailsModal(true);
  };

  const handleDeleteEvent = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEventToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEvent = async () => {
    if (eventToDelete) {
      await storageService.deleteEvent(eventToDelete);
      setEvents(events.filter(ev => ev.id !== eventToDelete));
      if (selectedEvent?.id === eventToDelete) {
        setShowEventDetailsModal(false);
        setSelectedEvent(null);
      }
      setEventToDelete(null);
    }
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month); // 0 = Sunday
    
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return [...blanks, ...days].map((day, index) => {
      if (!day) return <div key={`blank-${index}`} className="h-32 bg-gray-50/50 border border-slate-100"></div>;
      
      const dateStr = new Date(year, month, day + 1).toISOString().split('T')[0];
      const dayEvents = events.filter(e => e.date.startsWith(dateStr));

      return (
        <div 
          key={day} 
          onClick={() => handleDayClick(day)}
          className="h-32 border border-slate-100 bg-white hover:bg-slate-50 transition p-2 cursor-pointer relative group overflow-hidden"
        >
          <span className={`text-sm font-bold ${dayEvents.length > 0 ? 'text-slate-800' : 'text-gray-400'}`}>{day}</span>
          <div className="mt-1 space-y-1 overflow-y-auto max-h-[90px] custom-scrollbar">
            {dayEvents.map(ev => (
              <div 
                key={ev.id} 
                onClick={(e) => handleEventClick(ev, e)}
                className={`text-xs px-2 py-1 rounded truncate flex justify-between items-center group/event cursor-pointer hover:opacity-90 transition ${
                  ev.type === 'hearing' ? 'bg-red-100 text-red-800' : 
                  ev.type === 'meeting' ? 'bg-blue-100 text-blue-800' : 'bg-gold-100 text-gold-800'
                }`}
              >
                 <div className="truncate flex-1">
                   <span className="font-bold">{ev.title}</span>
                   {ev.caseTitle && <span className="block text-[10px] opacity-75">{ev.caseTitle}</span>}
                   {isOrgOwner && ev.userName && ev.userId !== user?.id && (
                     <span className="block text-[10px] opacity-75">— {ev.userName}</span>
                   )}
                 </div>
                 <button 
                   onClick={(e) => handleDeleteEvent(ev.id, e)} 
                   className="hidden group-hover/event:block text-red-600 font-bold hover:scale-110 ml-1 flex-shrink-0"
                   title="حذف الموعد"
                 >
                   ×
                 </button>
              </div>
            ))}
          </div>
          <button className="absolute bottom-2 left-2 text-primary-500 opacity-0 group-hover:opacity-100 transition text-xl font-bold">+</button>
        </div>
      );
    });
  };

  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
         <div>
           <h2 className="text-2xl font-bold text-slate-800">الروزنامة القانونية</h2>
           {isOrgOwner && <p className="text-sm text-gray-500 mt-1">جميع مواعيد فريق المكتب</p>}
         </div>
         <div className="flex items-center space-x-4 space-x-reverse bg-white shadow-sm px-4 py-2 rounded-lg border border-slate-100">
           <button onClick={handlePrevMonth} className="text-gray-500 hover:text-slate-800 px-2">❮</button>
           <span className="font-bold text-lg min-w-[100px] text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
           <button onClick={handleNextMonth} className="text-gray-500 hover:text-slate-800 px-2">❯</button>
         </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
           {/* Weekdays Header */}
           <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
             {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(d => (
               <div key={d} className="py-3 text-center text-sm font-bold text-slate-500">{d}</div>
             ))}
           </div>
           {/* Calendar Grid */}
           <div className="grid grid-cols-7 flex-1 overflow-y-auto">
             {renderCalendarDays()}
           </div>
        </div>
      )}

      {/* Add Event Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="إضافة موعد جديد">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الموعد</label>
            <input type="text" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="جلسة محاكمة، اجتماع..." />
          </div>
          
          {/* Case Selection Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القضية المرتبطة (اختياري)</label>
            <select 
              value={selectedCaseId} 
              onChange={e => setSelectedCaseId(e.target.value)} 
              className="w-full border rounded px-3 py-2 bg-white"
            >
              <option value="">-- اختر قضية من القائمة --</option>
              {cases.filter(c => c.status === 'active').map(c => (
                <option key={c.id} value={c.id}>{c.title} - {c.clientName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
               <input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full border rounded px-3 py-2" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">الوقت (اختياري)</label>
               <input type="time" value={newEventTime} onChange={e => setNewEventTime(e.target.value)} className="w-full border rounded px-3 py-2" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
               <select value={newEventType} onChange={e => setNewEventType(e.target.value)} className="w-full border rounded px-3 py-2">
                 <option value="hearing">جلسة محكمة</option>
                 <option value="meeting">اجتماع موكل</option>
                 <option value="deadline">أجل قانوني</option>
               </select>
             </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <textarea value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} className="w-full border rounded px-3 py-2 h-20" placeholder="تفاصيل إضافية..." />
          </div>
          <button onClick={handleAddEvent} className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800">حفظ الموعد</button>
        </div>
      </Modal>

      {/* Event Details Modal */}
      <Modal 
        isOpen={showEventDetailsModal} 
        onClose={() => {
          setShowEventDetailsModal(false);
          setSelectedEvent(null);
        }} 
        title="تفاصيل الموعد"
      >
        {selectedEvent && (
          <div className="space-y-6">
            {/* Event Type Badge */}
            <div className="flex items-center justify-center">
              <div className={`px-4 py-2 rounded-lg font-bold ${
                selectedEvent.type === 'hearing' ? 'bg-red-100 text-red-800' : 
                selectedEvent.type === 'meeting' ? 'bg-blue-100 text-blue-800' : 'bg-gold-100 text-gold-800'
              }`}>
                {selectedEvent.type === 'hearing' ? 'جلسة محكمة' : 
                 selectedEvent.type === 'meeting' ? 'اجتماع موكل' : 'أجل قانوني'}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">عنوان الموعد</label>
              <p className="text-lg font-bold text-gray-900">{selectedEvent.title}</p>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">التاريخ</label>
                <p className="text-gray-900 font-medium">
                  {new Date(selectedEvent.date).toLocaleDateString('ar-TN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">الوقت</label>
                <p className="text-gray-900 font-medium">
                  {selectedEvent.time ? selectedEvent.time : 'غير محدد'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">النوع</label>
                <p className="text-gray-900 font-medium">
                  {selectedEvent.type === 'hearing' ? 'جلسة محكمة' : 
                   selectedEvent.type === 'meeting' ? 'اجتماع موكل' : 'أجل قانوني'}
                </p>
              </div>
            </div>

            {/* Created by (for org owner) */}
            {isOrgOwner && selectedEvent.userName && selectedEvent.userId !== user?.id && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">أضافه</label>
                <p className="text-gray-900 font-medium">{selectedEvent.userName}</p>
              </div>
            )}

            {/* Related Case */}
            {selectedEvent.caseTitle && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">القضية المرتبطة</label>
                <p className="text-gray-900 font-medium">{selectedEvent.caseTitle}</p>
                {selectedEvent.caseId && (
                  <p className="text-xs text-gray-500 mt-1">معرف القضية: {selectedEvent.caseId}</p>
                )}
              </div>
            )}

            {/* Description */}
            {selectedEvent.description && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">الملاحظات والتفاصيل</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedEvent.description}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 space-x-reverse pt-4 border-t">
              <button
                onClick={() => {
                  if (selectedEvent) {
                    handleDeleteEvent(selectedEvent.id);
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                حذف الموعد
              </button>
              <button
                onClick={() => {
                  setShowEventDetailsModal(false);
                  setSelectedEvent(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setEventToDelete(null);
        }}
        onConfirm={confirmDeleteEvent}
        title="حذف الموعد"
        message="هل أنت متأكد من حذف هذا الموعد؟ لا يمكن التراجع عن هذه العملية."
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
      />
    </div>
  );
};
