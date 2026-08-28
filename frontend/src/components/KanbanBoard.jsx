import React, { useMemo, useState } from 'react'
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCorners, DragOverlay
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Flag, Clock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { TaskAPI } from '../api/client'

const COLUMNS = [
  { id: 'TODO', label: 'To Do', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' },
  { id: 'COMPLETED', label: 'Completed', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' },
]

const priorityColor = {
  HIGH: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
  MEDIUM: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  LOW: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

function TaskCard({ task, dragging, readOnly = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id, disabled: readOnly })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(readOnly ? {} : attributes)}
      {...(readOnly ? {} : listeners)}
      className={`card p-3.5 space-y-2 ${readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} ${isDragging ? 'opacity-40' : ''} ${dragging ? 'rotate-2 shadow-2xl' : ''}`}
    >
      <p className="font-semibold text-sm leading-snug">{task.title}</p>
      {task.description && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{task.description}</p>}
      <div className="flex items-center justify-between pt-1">
        <span className={`badge ${priorityColor[task.priority] || priorityColor.MEDIUM}`}>
          <Flag className="h-3 w-3" /> {task.priority || 'MEDIUM'}
        </span>
        {task.deadline && (
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
            <Clock className="h-3 w-3" /> {new Date(task.deadline).toLocaleDateString()}
          </span>
        )}
      </div>
      {task.assignedTo?.name && (
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
          <User className="h-3 w-3" /> {task.assignedTo.name}
        </span>
      )}
    </div>
  )
}

function Column({ id, label, color, tasks, readOnly }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: readOnly })
  return (
    <div className={`rounded-2xl p-3 flex-1 min-w-[280px] border-2 border-dashed transition-colors ${isOver ? 'border-brand-400 bg-brand-50/40 dark:bg-brand-950/20' : 'border-transparent bg-gray-50 dark:bg-gray-900/50'}`}>
      <div className={`badge ${color} mb-3`}>{label} · {tasks.length}</div>
      <div ref={setNodeRef} className="space-y-2.5 min-h-[120px]">
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => <TaskCard key={t._id} task={t} readOnly={readOnly} />)}
        </SortableContext>
        {tasks.length === 0 && <p className="text-xs text-gray-400 text-center py-6">{readOnly ? 'No tasks in this stage' : 'Drop tasks here'}</p>}
      </div>
    </div>
  )
}

export default function KanbanBoard({ tasks, setTasks, readOnly = false }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const [activeId, setActiveId] = useState(null)

  const grouped = useMemo(() => {
    const g = { TODO: [], IN_PROGRESS: [], COMPLETED: [] }
    for (const t of tasks) {
      const s = (t.status || 'TODO').toUpperCase()
      if (g[s]) g[s].push(t)
    }
    return g
  }, [tasks])

  const findTask = (id) => tasks.find((t) => t._id === id)

  const handleDragStart = (e) => { if (!readOnly) setActiveId(e.active.id) }

  const handleDragEnd = async (e) => {
    if (readOnly) return
    const { active, over } = e
    setActiveId(null)
    if (!over) return

    const activeTask = findTask(active.id)
    if (!activeTask) return

    let newStatus = over.id
    if (!COLUMNS.find((c) => c.id === over.id)) {
      const overTask = findTask(over.id)
      newStatus = overTask?.status || activeTask.status
    }

    if (newStatus === activeTask.status) return

    const prevTasks = tasks
    setTasks((prev) => prev.map((t) => (t._id === active.id ? { ...t, status: newStatus } : t)))

    try {
      await TaskAPI.updateStatus(active.id, newStatus)
      toast.success('Task updated')
    } catch (err) {
      setTasks(prevTasks)
      toast.error(err?.response?.data?.message || 'Failed to update task')
    }
  }

  const activeTask = activeId ? findTask(activeId) : null

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((col) => (
          <Column key={col.id} id={col.id} label={col.label} color={col.color} tasks={grouped[col.id]} readOnly={readOnly} />
        ))}
      </div>
      <DragOverlay>{activeTask && <TaskCard task={activeTask} dragging />}</DragOverlay>
    </DndContext>
  )
}
