// lib/plugins.ts
export type PluginCategoryId =
  | 'connections'
  | 'communication'
  | 'productivity'
  | 'games'

export type PluginStatus =
  | 'active'
  | 'inactive'
  | 'pending_config'
  | 'plan_restricted'

export interface PluginDefinition {
  id: string
  category: PluginCategoryId
  iconName: 'Users' | 'Languages' | 'Sparkles' | 'Gamepad2'
  isFree: boolean
  defaultActive: boolean
  href?: string
}

export const PLUGIN_CATEGORIES: {
  id: PluginCategoryId
  labelKey:
    | 'appsCategoryConnections'
    | 'appsCategoryCommunication'
    | 'appsCategoryProductivity'
    | 'appsCategoryGames'
}[] = [
  { id: 'connections', labelKey: 'appsCategoryConnections' },
  { id: 'communication', labelKey: 'appsCategoryCommunication' },
  { id: 'productivity', labelKey: 'appsCategoryProductivity' },
  { id: 'games', labelKey: 'appsCategoryGames' },
]

export const PLUGINS_REGISTRY: PluginDefinition[] = [
  {
    id: 'bridges',
    category: 'connections',
    iconName: 'Users',
    isFree: true,
    defaultActive: true,
    href: '/dashboard/bridges',
  },
  {
    id: 'multilingual_chat',
    category: 'communication',
    iconName: 'Languages',
    isFree: false,
    defaultActive: false,
  },
]