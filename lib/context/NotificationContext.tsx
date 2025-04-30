"use client"

import { createContext, useContext, useState, ReactNode } from 'react'
import { Notification } from '../types/common'

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (message: string, type: "success" | "error" | "info", options?: { important?: boolean }) => void
  markAsRead: (id: string) => void
  clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (
    message: string, 
    type: "success" | "error" | "info", 
    options?: { important?: boolean }
  ) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date(),
      read: false,
      important: options?.important || type === "error" // Mark all errors as important by default
    }
    
    console.log(`Adding notification: ${message} (${type})${newNotification.important ? ' - IMPORTANT' : ''}`)
    
    setNotifications((prev) => [newNotification, ...prev])
    
    // For important notifications, also show a browser alert for critical errors like deleting a student with equipment
    if (newNotification.important && type === "error" && message.includes("оборудование")) {
      // We'll let the toast component handle this
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
} 