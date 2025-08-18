import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { TabData, ProtoFile, ProtoMethod, GrpcResponse, FavoriteEndpoint } from '@/types'
import { ServiceInfo } from '@/utils/protoParser'

interface GrpcContextType {
  tabs: TabData[]
  activeTabId: string | null
  currentTab: TabData | null
  favoriteEndpoints: FavoriteEndpoint[]
  addTab: (title?: string) => string
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTab: (tabId: string, updates: Partial<TabData>) => void
  addFavoriteEndpoint: (name: string, url: string) => void
  removeFavoriteEndpoint: (id: string) => void
  loadFavoriteEndpoint: (endpoint: FavoriteEndpoint) => void
  // Legacy methods for current tab (for backward compatibility)
  protoFile: ProtoFile | null
  packageName: string
  services: ServiceInfo[]
  methods: ProtoMethod[]
  loading: boolean
  error: string | null
  response: GrpcResponse | null
  setProtoFile: (file: ProtoFile | null) => void
  setPackageName: (packageName: string) => void
  setServices: (services: ServiceInfo[]) => void
  setMethods: (methods: ProtoMethod[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setResponse: (response: GrpcResponse | null) => void
}

const GrpcContext = createContext<GrpcContextType | undefined>(undefined)

export const useGrpc = () => {
  const context = useContext(GrpcContext)
  if (context === undefined) {
    throw new Error('useGrpc must be used within a GrpcProvider')
  }
  return context
}

interface GrpcProviderProps {
  children: ReactNode
}

const createNewTab = (title?: string, id?: string): TabData => ({
  id: id || `tab-${Date.now()}-${Math.random()}`,
  title: title || '1',
  protoFile: null,
  packageName: '',
  services: [],
  methods: [],
  selectedMethod: null,
  endpoint: '',
  requestData: '{}',
  response: null,
  loading: false,
  error: null,
})

export const GrpcProvider: React.FC<GrpcProviderProps> = ({ children }) => {
  const [tabs, setTabs] = useState<TabData[]>([createNewTab('1', 'tab-1')])
  const [activeTabId, setActiveTabId] = useState<string>('tab-1')
  const [favoriteEndpoints, setFavoriteEndpoints] = useState<FavoriteEndpoint[]>([])
  
  const currentTab = tabs.find(tab => tab.id === activeTabId) || null

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('grpc-favorites')
    if (savedFavorites) {
      try {
        setFavoriteEndpoints(JSON.parse(savedFavorites))
      } catch (error) {
        console.error('Failed to load favorite endpoints:', error)
      }
    }
  }, [])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('grpc-favorites', JSON.stringify(favoriteEndpoints))
  }, [favoriteEndpoints])

  const addTab = (title?: string): string => {
    const newTab = createNewTab(title || `${(tabs || []).length + 1}`)
    setTabs(prev => [...(prev || []), newTab])
    setActiveTabId(newTab.id)
    return newTab.id
  }

  const closeTab = (tabId: string) => {
    if (!tabs || tabs.length <= 1) return // Don't close last tab
    
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId)
      if (activeTabId === tabId) {
        const index = prev.findIndex(tab => tab.id === tabId)
        const nextTab = newTabs[index] || newTabs[index - 1] || newTabs[0]
        setActiveTabId(nextTab.id)
      }
      return newTabs
    })
  }

  const setActiveTab = (tabId: string) => {
    setActiveTabId(tabId)
  }

  const updateTab = (tabId: string, updates: Partial<TabData>) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, ...updates } : tab
    ))
  }

  const addFavoriteEndpoint = (name: string, url: string) => {
    const newEndpoint: FavoriteEndpoint = {
      id: `fav-${Date.now()}-${Math.random()}`,
      name,
      url,
      createdAt: new Date().toISOString(),
    }
    setFavoriteEndpoints(prev => [...prev, newEndpoint])
  }

  const removeFavoriteEndpoint = (id: string) => {
    setFavoriteEndpoints(prev => prev.filter(endpoint => endpoint.id !== id))
  }

  const loadFavoriteEndpoint = (endpoint: FavoriteEndpoint) => {
    if (currentTab) {
      updateTab(currentTab.id, { endpoint: endpoint.url })
    }
  }

  // Legacy methods that operate on current tab
  const setProtoFile = (file: ProtoFile | null) => {
    if (currentTab) updateTab(currentTab.id, { protoFile: file })
  }

  const setPackageName = (packageName: string) => {
    if (currentTab) updateTab(currentTab.id, { packageName })
  }

  const setServices = (services: ServiceInfo[]) => {
    if (currentTab) updateTab(currentTab.id, { services })
  }

  const setMethods = (methods: ProtoMethod[]) => {
    if (currentTab) updateTab(currentTab.id, { methods })
  }

  const setLoading = (loading: boolean) => {
    if (currentTab) updateTab(currentTab.id, { loading })
  }

  const setError = (error: string | null) => {
    if (currentTab) updateTab(currentTab.id, { error })
  }

  const setResponse = (response: GrpcResponse | null) => {
    if (currentTab) updateTab(currentTab.id, { response })
  }

  const value: GrpcContextType = {
    tabs,
    activeTabId,
    currentTab,
    favoriteEndpoints,
    addTab,
    closeTab,
    setActiveTab,
    updateTab,
    addFavoriteEndpoint,
    removeFavoriteEndpoint,
    loadFavoriteEndpoint,
    // Legacy properties
    protoFile: currentTab?.protoFile || null,
    packageName: currentTab?.packageName || '',
    services: currentTab?.services || [],
    methods: currentTab?.methods || [],
    loading: currentTab?.loading || false,
    error: currentTab?.error || null,
    response: currentTab?.response || null,
    setProtoFile,
    setPackageName,
    setServices,
    setMethods,
    setLoading,
    setError,
    setResponse,
  }

  return <GrpcContext.Provider value={value}>{children}</GrpcContext.Provider>
}