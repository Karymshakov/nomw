// Settings page — Instagram integration + AI config + pipeline stages
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useRef, useCallback, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, GripVerticalIcon, PlugIcon, CheckCircleIcon, BrainCircuitIcon, SparklesIcon, Building2Icon, EyeIcon, EyeOffIcon, Loader2Icon, UsersIcon, BuildingIcon, CrownIcon, ShieldCheckIcon, UserCircleIcon, DownloadIcon, DatabaseIcon, AlertTriangleIcon, PauseCircleIcon, PlayCircleIcon } from 'lucide-react'
import { ApiError } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  fetchPipelineStages,
  createPipelineStage,
  updatePipelineStage,
  deletePipelineStage,
  fetchSegments,
  createSegment,
  updateSegment,
  deleteSegment,
  fetchTelegramIntegrationStatus,
  saveTelegramToken,
  disconnectTelegram,
  fetchInstagramStatus,
  disconnectInstagram,
  fetchWhatsAppIntegrationStatus,
  disconnectWhatsApp,
  connectWhatsAppManual,
  fetchAIConfig,
  updateAIConfig,
  runAgentNow,
  registerTelegramWebhook,
  fetchOrganizations,
  fetchOrgMembers,
  inviteOrgMember,
  updateOrgMemberRole,
  removeOrgMember,
  updateOrganization,
  deleteOrganization,
  exportDevDatabase,
  type PipelineStage,
  type Segment,
  type UpdateAIConfigData,
} from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useLanguage } from '@/contexts/language-context'
import { type Language } from '@/lib/translations'
import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  buildInternalToolsVisibilityOrgSettings,
  getDefaultInternalToolsVisibility,
  getInternalToolsVisibilitySettings,
  type InternalToolsVisibilitySettings,
} from '@/lib/org-settings'

const INSTAGRAM_OAUTH_RESULT_STORAGE_KEY = 'cayu.instagram.oauth.result'
const INSTAGRAM_OAUTH_RESULT_MAX_AGE_MS = 5 * 60 * 1000
const INSTAGRAM_OAUTH_RESULT_SYNC_RETRY_DELAY_MS = 1000
const INSTAGRAM_OAUTH_POPUP_CLOSE_GRACE_MS = 1500
const INSTAGRAM_POST_CLOSE_SYNC_TIMEOUT_MS = 20000

type InstagramConnectStage =
  | 'idle'
  | 'waiting_for_login'
  | 'authorization_in_progress'
  | 'connected'
  | 'failed'
  | 'cancelled'

type InstagramOAuthResult = {
  event?: 'instagram_connected' | 'instagram_error'
  instagram_username?: string
  error?: string
  created_at?: number
}

type InstagramSyncSource = 'popup_open' | 'popup_closed' | 'message' | 'storage' | 'visibility'

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

// Settings page
export const Route = createFileRoute('/_app/settings')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) ?? 'general',
  }),
  component: SettingsPage,
})

function SettingsPage() {
  const navigate = useNavigate()
  const { tab } = Route.useSearch()
  const { language, setLanguage, t } = useLanguage()
  const [stageDialogOpen, setStageDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteDialogType, setDeleteDialogType] = useState<'stage' | 'segment'>('stage')
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null)
  const [deletingStageId, setDeletingStageId] = useState<number | null>(null)
  const [stageName, setStageName] = useState('')
  const [stageKey, setStageKey] = useState('')
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false)
  const [stageDescription, setStageDescription] = useState('')
  const [stageIsFinal, setStageIsFinal] = useState(false)
  // Segment CRUD state
  const [segmentDialogOpen, setSegmentDialogOpen] = useState(false)
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
  const [deletingSegmentId, setDeletingSegmentId] = useState<number | null>(null)
  const [segmentName, setSegmentName] = useState('')
  const [segmentKey, setSegmentKey] = useState('')
  const [isSegmentKeyManuallyEdited, setIsSegmentKeyManuallyEdited] = useState(false)
  const [telegramToken, setTelegramToken] = useState('')
  const [isSavingToken, setIsSavingToken] = useState(false)
  const [webhookBaseUrl, setWebhookBaseUrl] = useState('')
  const [isDisconnectingInstagram, setIsDisconnectingInstagram] = useState(false)
  // When the OAuth popup is open, poll status every 2s so the UI updates even
  // if postMessage fails (cross-origin iframe timing, CSP, or popup dismissed)
  const [isInstagramConnecting, setIsInstagramConnecting] = useState(false)
  const [instagramConnectStage, setInstagramConnectStage] = useState<InstagramConnectStage>('idle')
  const [instagramConnectionNotice, setInstagramConnectionNotice] = useState<string | null>(null)
  const instagramPopupCleanupRef = useRef<(() => void) | null>(null)
  const instagramOauthSyncInFlightRef = useRef(false)
  const instagramConnectStartedAtRef = useRef(0)
  const [waPhoneNumberId, setWaPhoneNumberId] = useState('')
  const [waWabaId, setWaWabaId] = useState('')
  const [waAccessToken, setWaAccessToken] = useState('')
  const [waAppId, setWaAppId] = useState('')
  const [waAppSecret, setWaAppSecret] = useState('')
  const [showWaToken, setShowWaToken] = useState(false)
  const [showWaAppSecret, setShowWaAppSecret] = useState(false)
  const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false)
  // Local state for large text fields to prevent cursor-jump on every keystroke
  const queryClient = useQueryClient()

  // Team + Org state
  const { user } = useAuth()
  const orgSlug = user?.current_organization_slug ?? ''
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [orgName, setOrgName] = useState('')
  const [orgNameSaving, setOrgNameSaving] = useState(false)
  const [isExportingDevDatabase, setIsExportingDevDatabase] = useState(false)
  const [devExportSuccessMessage, setDevExportSuccessMessage] = useState('')
  const [devExportErrorMessage, setDevExportErrorMessage] = useState('')
  const [internalToolsVisibility, setInternalToolsVisibility] = useState<InternalToolsVisibilitySettings>(
    getDefaultInternalToolsVisibility,
  )


  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: fetchPipelineStages,
  })

  const { data: segments = [], isLoading: isLoadingSegments } = useQuery({
    queryKey: ['segments'],
    queryFn: fetchSegments,
  })

  const { data: telegramStatus } = useQuery({
    queryKey: ['telegram-integration-status'],
    queryFn: fetchTelegramIntegrationStatus,
  })

  const { data: instagramStatus, refetch: refetchInstagramStatus } = useQuery({
    queryKey: ['instagram-status', orgSlug],
    queryFn: fetchInstagramStatus,
    // Poll every 2s while the OAuth popup is open — guarantees the UI catches
    // the connected state even if postMessage/popup.closed detection fails
    // (cross-origin iframe timing or CSP can silently drop postMessage).
    // Stops automatically once isInstagramConnecting is false.
    refetchInterval: isInstagramConnecting ? 2000 : false,
    enabled: !!user,
  })

  const clearInstagramOAuthResult = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.removeItem(INSTAGRAM_OAUTH_RESULT_STORAGE_KEY)
  }, [])

  const consumeInstagramOAuthResult = useCallback((): InstagramOAuthResult | null => {
    if (typeof window === 'undefined') {
      return null
    }

    const raw = window.localStorage.getItem(INSTAGRAM_OAUTH_RESULT_STORAGE_KEY)
    if (!raw) {
      return null
    }

    window.localStorage.removeItem(INSTAGRAM_OAUTH_RESULT_STORAGE_KEY)

    try {
      const parsed = JSON.parse(raw) as InstagramOAuthResult
      if (!parsed.created_at || Date.now() - parsed.created_at > INSTAGRAM_OAUTH_RESULT_MAX_AGE_MS) {
        return null
      }
      if (parsed.created_at < instagramConnectStartedAtRef.current) {
        return null
      }
      return parsed
    } catch {
      return null
    }
  }, [])

  const updateInstagramConnectStage = useCallback((stage: InstagramConnectStage, message?: string | null) => {
    setInstagramConnectStage(stage)
    if (typeof message !== 'undefined') {
      setInstagramConnectionNotice(message)
    }
  }, [])

  const finishInstagramConnect = useCallback(() => {
    setIsInstagramConnecting(false)
    instagramPopupCleanupRef.current = null
  }, [])

  const syncInstagramStatusAfterOAuth = useCallback(async (
    result?: InstagramOAuthResult | null,
    source: InstagramSyncSource = 'visibility',
  ) => {
    if (instagramOauthSyncInFlightRef.current) {
      return false
    }

    instagramOauthSyncInFlightRef.current = true
    setIsInstagramConnecting(true)
    const syncStartedAt = Date.now()
    let latestStatusResponse: Awaited<ReturnType<typeof refetchInstagramStatus>> | null = null

    try {
      while (Date.now() - syncStartedAt < INSTAGRAM_POST_CLOSE_SYNC_TIMEOUT_MS) {
        latestStatusResponse = await refetchInstagramStatus()
        const latestAttemptStartedAt = latestStatusResponse.data?.oauth_last_started_at
          ? new Date(latestStatusResponse.data.oauth_last_started_at).getTime()
          : 0
        const isCurrentAttempt = latestAttemptStartedAt >= instagramConnectStartedAtRef.current - 2000
        const latestAttemptStatus = isCurrentAttempt ? latestStatusResponse.data?.oauth_last_status : ''
        const latestAttemptError = isCurrentAttempt ? latestStatusResponse.data?.oauth_last_error : ''
        const callbackReached = isCurrentAttempt && Boolean(latestStatusResponse.data?.oauth_last_callback_at)

        if (latestStatusResponse.data?.connected) {
          updateInstagramConnectStage('connected', null)
          toast.success(
            latestStatusResponse.data.instagram_username
              ? `Connected @${latestStatusResponse.data.instagram_username}`
              : 'Instagram connected',
          )
          finishInstagramConnect()
          return true
        }

        if (latestAttemptStatus === 'error' && latestAttemptError) {
          const exactReason = latestAttemptError
          updateInstagramConnectStage('failed', exactReason)
          toast.error(exactReason)
          finishInstagramConnect()
          return false
        }

        if (source === 'popup_open') {
          updateInstagramConnectStage(
            'waiting_for_login',
            'Instagram sign-in is still open. Finish logging in and approve access in the Instagram window.',
          )
        } else {
          const statusForAttempt = latestAttemptStatus === 'pending'

          if (callbackReached || result?.event === 'instagram_connected') {
            updateInstagramConnectStage(
              'authorization_in_progress',
              'Instagram approved the request. Saving the connection and waiting for the CRM to confirm it.',
            )
          } else if (statusForAttempt) {
            updateInstagramConnectStage(
              'authorization_in_progress',
              'The Instagram window closed, but the authorization is still being checked. Please wait a few seconds for confirmation.',
            )
          } else {
            updateInstagramConnectStage(
              'authorization_in_progress',
              'Checking whether the Instagram authorization finished successfully…',
            )
          }
        }

        await wait(INSTAGRAM_OAUTH_RESULT_SYNC_RETRY_DELAY_MS)
      }

      const latestAttemptStartedAt = latestStatusResponse?.data?.oauth_last_started_at
        ? new Date(latestStatusResponse.data.oauth_last_started_at).getTime()
        : 0
      const isCurrentAttempt = latestAttemptStartedAt >= instagramConnectStartedAtRef.current - 2000
      const callbackReached = isCurrentAttempt && Boolean(latestStatusResponse?.data?.oauth_last_callback_at)
      const fallbackMessage = result?.error
        || latestStatusResponse?.data?.callback_warning
        || (isCurrentAttempt ? latestStatusResponse?.data?.oauth_last_error : '')
        || (source === 'popup_closed' && !callbackReached
          ? 'The Instagram window was closed before authorization finished, so no connection was saved. Reopen Connect Instagram and complete the login and Allow steps.'
          : result?.event === 'instagram_connected'
            ? 'Instagram approved the request, but the CRM could not confirm the saved connection. Please try again and complete the approval in one session.'
            : 'Instagram authorization did not complete. Please try again.')

      updateInstagramConnectStage(
        source === 'popup_closed' && !callbackReached ? 'cancelled' : 'failed',
        fallbackMessage,
      )
      toast.error(fallbackMessage)
      finishInstagramConnect()
      return false
    } finally {
      instagramOauthSyncInFlightRef.current = false
    }
  }, [finishInstagramConnect, refetchInstagramStatus, updateInstagramConnectStage])

  useEffect(() => {
    if (instagramStatus?.connected) {
      updateInstagramConnectStage('connected', null)
    } else if (!isInstagramConnecting && instagramConnectStage === 'connected') {
      updateInstagramConnectStage('idle')
    }
  }, [instagramConnectStage, instagramStatus?.connected, isInstagramConnecting, updateInstagramConnectStage])

  useEffect(() => {
    if (!isInstagramConnecting) {
      return
    }

    const refreshInstagramStatus = () => {
      if (document.visibilityState === 'visible') {
        const oauthResult = consumeInstagramOAuthResult()
        if (oauthResult) {
          void syncInstagramStatusAfterOAuth(oauthResult, 'visibility')
          return
        }
        void queryClient.refetchQueries({ queryKey: ['instagram-status', orgSlug] })
      }
    }

    window.addEventListener('focus', refreshInstagramStatus)
    document.addEventListener('visibilitychange', refreshInstagramStatus)

    return () => {
      window.removeEventListener('focus', refreshInstagramStatus)
      document.removeEventListener('visibilitychange', refreshInstagramStatus)
    }
  }, [consumeInstagramOAuthResult, isInstagramConnecting, orgSlug, queryClient, syncInstagramStatusAfterOAuth])

  useEffect(() => {
    if (!isInstagramConnecting) {
      return
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== INSTAGRAM_OAUTH_RESULT_STORAGE_KEY || !event.newValue) {
        return
      }

      const oauthResult = consumeInstagramOAuthResult()
      if (!oauthResult) {
        return
      }

      if (oauthResult.event === 'instagram_error') {
        const message = oauthResult.error || 'Instagram authorization failed.'
        updateInstagramConnectStage('failed', message)
        toast.error(message)
        finishInstagramConnect()
        return
      }

      void syncInstagramStatusAfterOAuth(oauthResult, 'storage')
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [consumeInstagramOAuthResult, finishInstagramConnect, isInstagramConnecting, syncInstagramStatusAfterOAuth, updateInstagramConnectStage])

  useEffect(() => {
    const oauthResult = consumeInstagramOAuthResult()
    if (!oauthResult) {
      return
    }

    if (oauthResult.event === 'instagram_error') {
      const message = oauthResult.error || 'Instagram authorization failed.'
      updateInstagramConnectStage('failed', message)
      toast.error(message)
      finishInstagramConnect()
      return
    }

    void syncInstagramStatusAfterOAuth(oauthResult, 'storage')
  }, [consumeInstagramOAuthResult, finishInstagramConnect, syncInstagramStatusAfterOAuth, updateInstagramConnectStage])

  const { data: whatsappStatus } = useQuery({
    queryKey: ['whatsapp-integration-status'],
    queryFn: fetchWhatsAppIntegrationStatus,
  })


  const { data: aiConfig } = useQuery({
    queryKey: ['ai-config'],
    queryFn: fetchAIConfig,
  })

  const updateAIConfigMutation = useMutation({
    mutationFn: updateAIConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-config'] })
      toast.success('AI configuration updated')
    },
    onError: () => {
      toast.error('Failed to update AI configuration')
    },
  })

  const handleAIConfigChange = (data: UpdateAIConfigData) => {
    updateAIConfigMutation.mutate(data)
  }

  const renderChannelAiControl = (
    channelKey: 'telegram_ai_paused' | 'instagram_ai_paused' | 'whatsapp_ai_paused',
    channelLabel: 'Telegram' | 'Instagram' | 'WhatsApp',
  ) => {
    const isPaused = aiConfig?.[channelKey] ?? false
    const isUpdatingThisChannel = updateAIConfigMutation.isPending && channelKey in (updateAIConfigMutation.variables ?? {})

    return (
      <div className={`rounded-xl border p-4 ${isPaused ? 'border-amber-300 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/20' : 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20'}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">AI Message Control</span>
              <Badge className={isPaused ? 'bg-amber-500 text-white hover:bg-amber-500' : 'bg-emerald-600 text-white hover:bg-emerald-600'}>
                {isPaused ? (
                  <><AlertTriangleIcon className="mr-1 h-3 w-3" />Paused</>
                ) : (
                  <><CheckCircleIcon className="mr-1 h-3 w-3" />Active</>
                )}
              </Badge>
            </div>
            <p className={`text-sm ${isPaused ? 'text-amber-900 dark:text-amber-100' : 'text-emerald-900 dark:text-emerald-100'}`}>
              {isPaused
                ? `${channelLabel} AI replies and AI-driven automation are disabled for all leads until you resume them.`
                : `${channelLabel} AI replies and automation are active for eligible conversations.`}
            </p>
            <p className="text-xs text-muted-foreground">
              Manual team messages continue working normally even while AI is paused for this channel.
            </p>
          </div>
          <Button
            type="button"
            variant={isPaused ? 'default' : 'outline'}
            className={isPaused ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-950/30'}
            disabled={isUpdatingThisChannel}
            onClick={() => handleAIConfigChange({ [channelKey]: !isPaused })}
          >
            {isUpdatingThisChannel ? (
              <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" />Updating...</>
            ) : isPaused ? (
              <><PlayCircleIcon className="mr-2 h-4 w-4" />Resume AI</>
            ) : (
              <><PauseCircleIcon className="mr-2 h-4 w-4" />Pause AI</>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Team + Org queries
  const { data: orgMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['org-members', orgSlug],
    queryFn: () => fetchOrgMembers(orgSlug),
    enabled: !!orgSlug,
  })

  const { data: orgs = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
    enabled: !!user,
  })
  const currentOrg = orgs.find(o => o.slug === orgSlug)

  useEffect(() => {
    if (currentOrg?.name) setOrgName(currentOrg.name)
  }, [currentOrg?.name])

  useEffect(() => {
    setInternalToolsVisibility(getInternalToolsVisibilitySettings(currentOrg?.org_settings))
  }, [currentOrg?.org_settings])

  const currentUserMember = orgMembers.find(m => m.user_email === user?.email)
  const isOwnerOrAdmin = currentUserMember?.role === 'owner' || currentUserMember?.role === 'admin'
  const isOwner = currentUserMember?.role === 'owner'
  const canManageInternalToolsVisibility = isOwnerOrAdmin
  const canAccessDevDatabaseExport = isOwnerOrAdmin && internalToolsVisibility.showDevDatabaseExport
  const activeTab = !canAccessDevDatabaseExport && tab === 'dev-database-export' ? 'general' : tab

  const updateInternalToolsVisibilityMutation = useMutation({
    mutationFn: async (nextVisibility: InternalToolsVisibilitySettings) => {
      if (!orgSlug) {
        throw new Error('Organization is required')
      }

      return updateOrganization(orgSlug, {
        org_settings: buildInternalToolsVisibilityOrgSettings(currentOrg?.org_settings, nextVisibility),
      })
    },
    onSuccess: (updatedOrganization) => {
      queryClient.setQueryData(['organizations'], (existing: typeof orgs | undefined) => {
        if (!existing) {
          return existing
        }

        return existing.map((organization) => (
          organization.slug === updatedOrganization.slug ? updatedOrganization : organization
        ))
      })
      void queryClient.invalidateQueries({ queryKey: ['organizations'] })
      toast.success('Developer tool visibility updated')
    },
  })

  const handleInvite = async () => {
    if (!inviteEmail || !orgSlug) return
    setInviteLoading(true)
    setInviteError('')
    try {
      await inviteOrgMember(orgSlug, { email: inviteEmail, role: inviteRole })
      await queryClient.invalidateQueries({ queryKey: ['org-members', orgSlug] })
      setInviteOpen(false)
      setInviteEmail('')
      setInviteRole('member')
    } catch (e: unknown) {
      const err = e as { data?: { error?: string } }
      setInviteError(err?.data?.error || 'Failed to invite member')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRoleChange = async (userId: number, role: string) => {
    if (!orgSlug) return
    await updateOrgMemberRole(orgSlug, userId, role)
    queryClient.invalidateQueries({ queryKey: ['org-members', orgSlug] })
  }

  const handleRemoveMember = async (userId: number) => {
    if (!orgSlug) return
    await removeOrgMember(orgSlug, userId)
    queryClient.invalidateQueries({ queryKey: ['org-members', orgSlug] })
  }

  const handleSaveOrgName = async () => {
    if (!orgSlug || !orgName.trim()) return
    setOrgNameSaving(true)
    try {
      await updateOrganization(orgSlug, { name: orgName })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    } finally {
      setOrgNameSaving(false)
    }
  }

  const handleDeleteOrg = async () => {
    if (!orgSlug) return
    await deleteOrganization(orgSlug)
    navigate({ to: '/login' })
  }

  const handleInternalToolsVisibilityChange = (
    key: keyof InternalToolsVisibilitySettings,
    checked: boolean,
  ) => {
    const previousVisibility = internalToolsVisibility
    const nextVisibility = { ...previousVisibility, [key]: checked }

    setInternalToolsVisibility(nextVisibility)
    updateInternalToolsVisibilityMutation.mutate(nextVisibility, {
      onError: () => {
        setInternalToolsVisibility(previousVisibility)
        toast.error('Failed to update developer tool visibility')
      },
    })
  }

  const handleExportDevDatabase = async () => {
    setIsExportingDevDatabase(true)
    setDevExportErrorMessage('')
    setDevExportSuccessMessage('')

    try {
      const result = await exportDevDatabase()
      const successMessage = `Download started: ${result.filename}`
      setDevExportSuccessMessage(successMessage)
      toast.success(successMessage)
    } catch (error) {
      let message = 'Failed to prepare the development database export. Please try again.'

      if (error instanceof ApiError && typeof error.data === 'object' && error.data !== null && 'detail' in error.data) {
        message = String((error.data as { detail?: string }).detail || message)
      }

      setDevExportErrorMessage(message)
      toast.error(message)
    } finally {
      setIsExportingDevDatabase(false)
    }
  }

  function RoleBadge({ role }: { role: string }) {
    const config: Record<string, { icon: import('react').ReactNode; label: string; className: string }> = {
      owner: { icon: <CrownIcon className="h-3 w-3" />, label: 'Owner', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
      admin: { icon: <ShieldCheckIcon className="h-3 w-3" />, label: 'Admin', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      member: { icon: <UserCircleIcon className="h-3 w-3" />, label: 'Member', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    }
    const c = config[role] || config.member
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
        {c.icon}{c.label}
      </span>
    )
  }

  const createMutation = useMutation({
    mutationFn: createPipelineStage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] })
      toast.success('Pipeline stage created')
      handleCloseStageDialog()
    },
    onError: () => {
      toast.error('Failed to create pipeline stage')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; key?: string; description?: string; is_final?: boolean } }) =>
      updatePipelineStage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] })
      toast.success('Pipeline stage updated')
      handleCloseStageDialog()
    },
    onError: () => {
      toast.error('Failed to update pipeline stage')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePipelineStage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] })
      toast.success('Pipeline stage deleted')
    },
    onError: () => {
      toast.error('Failed to delete pipeline stage')
    },
  })

  // Segment mutations
  const createSegmentMutation = useMutation({
    mutationFn: createSegment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] })
      toast.success('Segment created')
      handleCloseSegmentDialog()
    },
    onError: () => {
      toast.error('Failed to create segment')
    },
  })

  const updateSegmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; key?: string; order?: number } }) =>
      updateSegment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] })
      toast.success('Segment updated')
      handleCloseSegmentDialog()
    },
    onError: () => {
      toast.error('Failed to update segment')
    },
  })

  const deleteSegmentMutation = useMutation({
    mutationFn: deleteSegment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] })
      toast.success('Segment deleted')
    },
    onError: () => {
      toast.error('Failed to delete segment')
    },
  })

  const slugify = (value: string) =>
    value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

  const handleAddStage = () => {
    setEditingStage(null)
    setStageName('')
    setStageKey('')
    setIsKeyManuallyEdited(false)
    setStageDescription('')
    setStageIsFinal(false)
    setStageDialogOpen(true)
  }

  const handleEditStage = (stage: PipelineStage) => {
    setEditingStage(stage)
    setStageName(stage.name)
    setStageKey(stage.key)
    setStageDescription(stage.description)
    setStageIsFinal(stage.is_final)
    setStageDialogOpen(true)
  }

  const handleCloseStageDialog = () => {
    setStageDialogOpen(false)
    setEditingStage(null)
    setStageName('')
    setStageKey('')
    setIsKeyManuallyEdited(false)
    setStageDescription('')
    setStageIsFinal(false)
  }

  const handleSaveStage = () => {
    if (!stageName.trim() || !stageKey.trim()) {
      toast.error('Name and key are required')
      return
    }

    if (editingStage) {
      updateMutation.mutate({
        id: editingStage.id,
        data: {
          name: stageName,
          key: stageKey,
          description: stageDescription,
          is_final: stageIsFinal,
        },
      })
    } else {
      createMutation.mutate({
        name: stageName,
        key: stageKey,
        description: stageDescription,
        order: stages.length + 1,
        is_final: stageIsFinal,
      })
    }
  }

  const handleDeleteStage = (id: number) => {
    setDeletingStageId(id)
    setDeleteDialogType('stage')
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (deleteDialogType === 'stage' && deletingStageId !== null) {
      deleteMutation.mutate(deletingStageId)
    } else if (deleteDialogType === 'segment' && deletingSegmentId !== null) {
      deleteSegmentMutation.mutate(deletingSegmentId)
    }
    setDeleteDialogOpen(false)
    setDeletingStageId(null)
    setDeletingSegmentId(null)
  }

  // Segment handlers
  const handleAddSegment = () => {
    setEditingSegment(null)
    setSegmentName('')
    setSegmentKey('')
    setIsSegmentKeyManuallyEdited(false)
    setSegmentDialogOpen(true)
  }

  const handleEditSegment = (segment: Segment) => {
    setEditingSegment(segment)
    setSegmentName(segment.name)
    setSegmentKey(segment.key)
    setSegmentDialogOpen(true)
  }

  const handleCloseSegmentDialog = () => {
    setSegmentDialogOpen(false)
    setEditingSegment(null)
    setSegmentName('')
    setSegmentKey('')
    setIsSegmentKeyManuallyEdited(false)
  }

  const handleSaveSegment = () => {
    if (!segmentName.trim() || !segmentKey.trim()) {
      toast.error('Name and key are required')
      return
    }

    if (editingSegment) {
      updateSegmentMutation.mutate({
        id: editingSegment.id,
        data: { name: segmentName, key: segmentKey },
      })
    } else {
      createSegmentMutation.mutate({
        name: segmentName,
        key: segmentKey,
        order: segments.length + 1,
      })
    }
  }

  const handleDeleteSegment = (id: number) => {
    setDeletingSegmentId(id)
    setDeleteDialogType('segment')
    setDeleteDialogOpen(true)
  }

  const handleSaveTelegramToken = async () => {
    if (!telegramToken.trim()) {
      toast.error('Please enter a bot token')
      return
    }

    setIsSavingToken(true)
    try {
      const response = await saveTelegramToken(telegramToken)
      if (response.success) {
        toast.success(`Bot connected: @${response.bot_username}`)
        setTelegramToken('')
        queryClient.invalidateQueries({ queryKey: ['telegram-integration-status'] })
      } else {
        toast.error(response.error || 'Failed to save bot token')
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const errorData = error.data as any
        toast.error(errorData?.error || 'Failed to save bot token. Please try again.')
      } else {
        toast.error('Failed to save bot token. Please try again.')
      }
    } finally {
      setIsSavingToken(false)
    }
  }

  const handleDisconnectTelegram = async () => {
    try {
      const response = await disconnectTelegram()
      if (response.success) {
        toast.success('Telegram bot disconnected')
        queryClient.invalidateQueries({ queryKey: ['telegram-integration-status'] })
      } else {
        toast.error(response.error || 'Failed to disconnect')
      }
    } catch (error) {
      toast.error('Failed to disconnect. Please try again.')
    }
  }

  const handleConnectInstagram = useCallback(() => {
    // Clean up any previous popup/listeners before opening a new one
    if (instagramPopupCleanupRef.current) {
      instagramPopupCleanupRef.current()
      instagramPopupCleanupRef.current = null
    }

    const authorizeUrl = instagramStatus?.embed_url
    if (!authorizeUrl) {
      toast.error('Instagram setup is still loading. Please try again in a moment.')
      updateInstagramConnectStage('failed', 'Instagram setup is still loading. Please wait a moment and try again.')
      return
    }

    updateInstagramConnectStage(
      'waiting_for_login',
      'Instagram sign-in is ready. Complete login and approval in the popup window to finish connecting this account.',
    )
    instagramOauthSyncInFlightRef.current = false
    instagramConnectStartedAtRef.current = Date.now()
    clearInstagramOAuthResult()

    const popup = window.open(authorizeUrl, 'instagram_connect', 'width=600,height=700,scrollbars=yes')
    if (!popup) {
      toast.error('Popup was blocked. Please allow popups for this site.')
      updateInstagramConnectStage('failed', 'The Instagram window was blocked by your browser. Allow popups for this page and try again.')
      return
    }

    // Start polling — refetchInterval activates now
    setIsInstagramConnecting(true)

    const readResult = () => consumeInstagramOAuthResult()

    // Poll every 500ms: if popup closed without sending a message, continue syncing
    // because Meta can close the window before the parent receives postMessage.
    const pollInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollInterval)
        window.removeEventListener('message', handler)
        updateInstagramConnectStage(
          'authorization_in_progress',
          'Instagram window closed. Checking whether the authorization completed or was cancelled…',
        )
        window.setTimeout(() => {
          void syncInstagramStatusAfterOAuth(readResult(), 'popup_closed')
        }, INSTAGRAM_OAUTH_POPUP_CLOSE_GRACE_MS)
      }
    }, 500)

    const handler = (event: MessageEvent) => {
      if (event.data?.event === 'instagram_connected') {
        clearInterval(pollInterval)
        window.removeEventListener('message', handler)
        void queryClient.refetchQueries({ queryKey: ['instagram-status', orgSlug] })
        updateInstagramConnectStage(
          'authorization_in_progress',
          'Instagram approved the request. Finalizing the connection in the CRM…',
        )
        popup.close()
        void syncInstagramStatusAfterOAuth({
          event: 'instagram_connected',
          instagram_username: event.data.instagram_username,
          created_at: event.data.created_at ?? Date.now(),
        }, 'message')
      } else if (event.data?.event === 'instagram_error') {
        clearInterval(pollInterval)
        window.removeEventListener('message', handler)
        const message = event.data.error || 'Failed to connect Instagram'
        updateInstagramConnectStage('failed', message)
        toast.error(message)
        finishInstagramConnect()
        popup.close()
      }
    }
    window.addEventListener('message', handler)

    // Store cleanup so re-clicking Connect tears down the old popup
    instagramPopupCleanupRef.current = () => {
      clearInterval(pollInterval)
      window.removeEventListener('message', handler)
      finishInstagramConnect()
      popup.close()
    }
  }, [clearInstagramOAuthResult, consumeInstagramOAuthResult, finishInstagramConnect, instagramStatus?.embed_url, orgSlug, queryClient, syncInstagramStatusAfterOAuth, updateInstagramConnectStage])

  const handleDisconnectInstagram = async () => {
    setIsDisconnectingInstagram(true)
    try {
      await disconnectInstagram()
      toast.success('Instagram disconnected')
      updateInstagramConnectStage('idle', null)
      refetchInstagramStatus()
    } catch {
      toast.error('Failed to disconnect. Please try again.')
    } finally {
      setIsDisconnectingInstagram(false)
    }
  }

  const handleConnectWhatsApp = async () => {
    if (!waPhoneNumberId.trim() || !waWabaId.trim() || !waAccessToken.trim() ) {
      toast.error('All three fields are required')
      return
    }
    setIsConnectingWhatsApp(true)
    try {
      const result = await connectWhatsAppManual({
        phone_number_id: waPhoneNumberId.trim(),
        waba_id: waWabaId.trim(),
        access_token: waAccessToken.trim(),
        app_id: waAppId.trim() || undefined,
        app_secret: waAppSecret.trim() || undefined,
      })
      toast.success(`Connected ${result.display_phone_number ?? result.verified_name ?? 'WhatsApp'}`)
      setWaPhoneNumberId('')
      setWaWabaId('')
      setWaAccessToken('')
      setWaAppId('')
      setWaAppSecret('')
      queryClient.invalidateQueries({ queryKey: ['whatsapp-integration-status'] })
    } catch (e: any) {
      const msg = e?.data?.error ?? e?.message ?? 'Connection failed. Please check your credentials.'
      toast.error(msg)
    } finally {
      setIsConnectingWhatsApp(false)
    }
  }


  const handleDisconnectWhatsApp = async () => {
    try {
      await disconnectWhatsApp()
      toast.success('WhatsApp disconnected')
      queryClient.invalidateQueries({ queryKey: ['whatsapp-integration-status'] })
    } catch {
      toast.error('Failed to disconnect. Please try again.')
    }
  }

  const instagramStatusBadge = instagramStatus?.connected
    ? instagramStatus.token_expired
      ? { label: 'Token Expired', variant: 'destructive' as const, className: '' }
      : { label: 'Connected', variant: 'default' as const, className: 'bg-green-600 hover:bg-green-700' }
    : isInstagramConnecting || instagramConnectStage === 'waiting_for_login' || instagramConnectStage === 'authorization_in_progress'
      ? { label: instagramConnectStage === 'waiting_for_login' ? 'Waiting for approval' : 'Authorizing', variant: 'secondary' as const, className: 'bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-100' }
      : { label: 'Not Connected', variant: 'secondary' as const, className: '' }

  const instagramConnectButtonLabel = instagramConnectStage === 'waiting_for_login'
    ? 'Waiting for Instagram...'
    : instagramConnectStage === 'authorization_in_progress'
      ? 'Finalizing connection...'
      : 'Connect Instagram'

  const instagramProgressTone = instagramConnectStage === 'failed' || instagramConnectStage === 'cancelled'
    ? 'border-destructive/30 bg-destructive/10 text-destructive'
    : instagramConnectStage === 'connected'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100'
      : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100'

  const instagramProgressTitle = instagramConnectStage === 'waiting_for_login'
    ? 'Waiting for Instagram login and consent'
    : instagramConnectStage === 'authorization_in_progress'
      ? 'Authorization in progress'
      : instagramConnectStage === 'failed'
        ? 'Connection failed'
        : instagramConnectStage === 'cancelled'
          ? 'Connection cancelled'
          : instagramConnectStage === 'connected'
            ? 'Instagram connected'
            : null

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{t('settings.title')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('settings.subtitle')}
              </p>
            </div>
          </div>

          <div className="px-4 lg:px-6">
            <Tabs value={activeTab} onValueChange={(t) => navigate({ to: '/settings', search: { tab: t } })} className="space-y-6">
              <TabsList>
                <TabsTrigger value="general">{t('settings.tabs.general')}</TabsTrigger>
                <TabsTrigger value="integrations">
                  <PlugIcon className="h-4 w-4 mr-2" />
                  {t('settings.tabs.integrations')}
                </TabsTrigger>
                <TabsTrigger value="ai-support">
                  <BrainCircuitIcon className="h-4 w-4 mr-2" />
                  {t('settings.tabs.aiAgent')}
                </TabsTrigger>
                <TabsTrigger value="preferences">
                  {t('settings.tabs.preferences')}
                </TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="organization">Organization</TabsTrigger>
                {canAccessDevDatabaseExport && (
                  <TabsTrigger value="dev-database-export">
                    <DatabaseIcon className="mr-2 h-4 w-4" />
                    Dev Database Export
                  </TabsTrigger>
                )}

              </TabsList>

              <TabsContent value="general" className="space-y-6">
                <div className="grid gap-6 max-w-4xl">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle>Pipeline Stages</CardTitle>
                          <CardDescription>
                            Define the stages leads move through in your sales pipeline
                          </CardDescription>
                        </div>
                        <Button onClick={handleAddStage} size="sm" className="w-full sm:w-auto">
                          <PlusIcon className="h-4 w-4" />
                          Add Stage
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      ) : stages.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No pipeline stages configured yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {stages.map((stage) => (
                            <div
                              key={stage.id}
                              className="flex items-center gap-2 sm:gap-3 p-3 rounded-md bg-muted/50"
                            >
                              <GripVerticalIcon className="h-4 w-4 text-muted-foreground hidden sm:block" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm sm:text-base">{stage.name}</span>
                                  {stage.is_final && (
                                    <Badge variant="secondary" className="text-xs">Final</Badge>
                                  )}
                                </div>
                                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                                  {stage.description}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditStage(stage)}
                                  aria-label="Edit"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteStage(stage.id)}
                                  aria-label="Delete"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <CardTitle>Lead Segments</CardTitle>
                          <CardDescription>
                            Define client type categories for your leads (e.g., Individual, Business)
                          </CardDescription>
                        </div>
                        <Button onClick={handleAddSegment} size="sm" className="w-full sm:w-auto">
                          <PlusIcon className="h-4 w-4" />
                          Add Segment
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoadingSegments ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      ) : segments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No segments configured yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {segments.map((segment) => (
                            <div
                              key={segment.id}
                              className="flex items-center gap-2 sm:gap-3 p-3 rounded-md bg-muted/50"
                            >
                              <GripVerticalIcon className="h-4 w-4 text-muted-foreground hidden sm:block" />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm sm:text-base">{segment.name}</span>
                                <span className="ml-2 text-xs text-muted-foreground">({segment.key})</span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditSegment(segment)}
                                  aria-label="Edit"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteSegment(segment.id)}
                                  aria-label="Delete"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                </div>
              </TabsContent>

              <TabsContent value="integrations" className="space-y-6">
                <div className="grid gap-6 max-w-4xl">
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500">
                            <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">Telegram</h3>
                            <p className="text-sm text-muted-foreground">
                              Send and receive messages via Telegram bot
                            </p>
                          </div>
                        </div>
                        {telegramStatus?.configured ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Not Connected</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {telegramStatus?.configured ? (
                        <>
                          <div className="rounded-lg bg-muted/50 p-6 space-y-4">
                            <div className="grid gap-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Bot Username:</span>
                                <span className="font-medium">@{telegramStatus.bot_username}</span>
                              </div>
                              {telegramStatus.connected_at && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Connected:</span>
                                  <span className="font-medium">
                                    {new Date(telegramStatus.connected_at).toLocaleString('en-US', {
                                      month: 'numeric',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      second: '2-digit',
                                      hour12: true
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-900">
                            <div className="space-y-3 text-sm">
                              <p className="font-medium text-blue-900 dark:text-blue-100">Webhook URL</p>
                              <p className="text-xs text-blue-700 dark:text-blue-300">
                                This URL is automatically registered with Telegram so incoming messages reach your CRM.
                                If you are not receiving messages, enter your public URL below and click "Re-register Webhook".
                              </p>
                              <div className="space-y-1">
                                <Label htmlFor="webhook-base-url" className="text-xs text-blue-800 dark:text-blue-200">Public base URL (e.g. from ngrok or Cloudflare)</Label>
                                <Input
                                  id="webhook-base-url"
                                  placeholder="https://your-tunnel.trycloudflare.com"
                                  value={webhookBaseUrl}
                                  onChange={(e) => setWebhookBaseUrl(e.target.value)}
                                  className="text-xs bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800"
                                />
                                {webhookBaseUrl && (
                                  <code className="block p-2 bg-white dark:bg-gray-900 rounded text-xs break-all border border-blue-200 dark:border-blue-800 text-muted-foreground">
                                    {webhookBaseUrl.replace(/\/$/, '')}/api/telegram-webhook/
                                  </code>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const res = await registerTelegramWebhook(webhookBaseUrl.trim() || undefined)
                                  if (res.success) {
                                    toast.success(`Webhook registered: ${res.webhook_url ?? ''}`)
                                  } else {
                                    toast.error(res.error || "Failed to register webhook")
                                  }
                                } catch {
                                  toast.error("Failed to register webhook")
                                }
                              }}
                            >
                              Re-register Webhook
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleDisconnectTelegram}
                            >
                              Disconnect
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-4">
                            <div className="rounded-lg bg-muted p-4">
                              <h4 className="font-medium text-sm mb-2">Setup Instructions</h4>
                              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                <li>Create a new bot by chatting with <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@BotFather</a> on Telegram</li>
                                <li>Send the command <code className="bg-background px-1 py-0.5 rounded">/newbot</code> and follow the instructions</li>
                                <li>Copy the bot token provided by BotFather</li>
                                <li>Paste the token below and click "Connect Bot"</li>
                                <li>Your bot will be ready to send/receive messages</li>
                              </ol>
                            </div>
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label htmlFor="telegram-token">Bot Token</Label>
                                <Input
                                  id="telegram-token"
                                  type="password"
                                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                  value={telegramToken}
                                  onChange={(e) => setTelegramToken(e.target.value)}
                                  disabled={isSavingToken}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Enter the bot token you received from @BotFather
                                </p>
                              </div>
                              <Button
                                onClick={handleSaveTelegramToken}
                                disabled={isSavingToken || !telegramToken.trim()}
                                className="w-full sm:w-auto"
                              >
                                {isSavingToken ? 'Connecting...' : 'Connect Bot'}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                      {telegramStatus?.error && (
                        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                          {telegramStatus.error}
                        </div>
                      )}
                      {renderChannelAiControl('telegram_ai_paused', 'Telegram')}
                    </CardContent>
                  </Card>

                  {/* Instagram Integration Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-2.5">
                            <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">Instagram</h3>
                            <p className="text-sm text-muted-foreground">
                              Send and receive Instagram Direct Messages
                            </p>
                          </div>
                        </div>
                        <Badge variant={instagramStatusBadge.variant} className={instagramStatusBadge.className}>
                          {instagramStatusBadge.label === 'Connected' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                          {instagramStatusBadge.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Connected account info */}
                      {instagramStatus?.connected ? (
                        <>
                          <div className="rounded-lg bg-muted/50 p-6 space-y-4">
                            <div className="flex items-center gap-3">
                              {instagramStatus.profile_picture_url && (
                                <img
                                  src={instagramStatus.profile_picture_url}
                                  alt="profile"
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium">@{instagramStatus.instagram_username}</p>
                                {instagramStatus.connected_at && (
                                  <p className="text-xs text-muted-foreground">
                                    Connected {new Date(instagramStatus.connected_at).toLocaleString('en-US', {
                                      month: 'numeric', day: 'numeric', year: 'numeric',
                                      hour: 'numeric', minute: '2-digit', hour12: true
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                            {instagramStatus.token_expiry && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Token expires:</span>
                                <span className={instagramStatus.token_expiring_soon ? 'font-medium text-amber-600' : 'font-medium'}>
                                  {new Date(instagramStatus.token_expiry).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric'
                                  })}
                                  {instagramStatus.token_expiring_soon && !instagramStatus.token_expired && ' (expiring soon)'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              Token auto-renews every 60 days. If Instagram stops working, disconnect and reconnect to get a fresh token.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              If messages stop coming in or sending, disconnect and connect again to fix the issue.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleDisconnectInstagram}
                              disabled={isDisconnectingInstagram}
                            >
                              {isDisconnectingInstagram ? 'Disconnecting...' : 'Disconnect'}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Connect your Instagram Business account to send and receive Direct Messages directly from the CRM. You will be redirected to Instagram to authorize access.
                          </p>
                          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4 space-y-1">
                            <p className="text-xs font-medium text-amber-900 dark:text-amber-100">Account requirement</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                              Your account must be an <strong>Instagram Business or Creator account</strong> connected to a Facebook Page. Personal accounts cannot receive DMs through the API.
                            </p>
                          </div>
                          {instagramStatus?.callback_warning && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-2">
                              <p className="text-xs font-medium text-destructive">Connection setup issue detected</p>
                              <p className="text-xs text-destructive/90">
                                {instagramStatus.callback_warning}
                              </p>
                              {instagramStatus.callback_url && (
                                <p className="text-[11px] text-destructive/80 break-all">
                                  Expected callback: {instagramStatus.callback_url}
                                </p>
                              )}
                            </div>
                          )}
                          {instagramStatus?.oauth_last_status === 'error' && instagramStatus.oauth_last_error && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-1">
                              <p className="text-xs font-medium text-destructive">Last Instagram connection attempt</p>
                              <p className="text-xs text-destructive/90">{instagramStatus.oauth_last_error}</p>
                              {instagramStatus.oauth_last_callback_at && (
                                <p className="text-[11px] text-destructive/80">
                                  Callback reached the app on {new Date(instagramStatus.oauth_last_callback_at).toLocaleString('en-US', {
                                    month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
                                  })}
                                </p>
                              )}
                            </div>
                          )}
                          <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-1">
                            <p className="text-xs font-medium text-foreground">How it works</p>
                            <p className="text-xs text-muted-foreground">
                              Clicking <strong>Connect Instagram</strong> opens a small popup window. If your browser blocks popups, allow them for this page and try again. The popup will close automatically once authorization is complete.
                            </p>
                          </div>
                          {instagramProgressTitle && instagramConnectionNotice && (
                            <div className={`rounded-lg border p-4 space-y-1 ${instagramProgressTone}`}>
                              <div className="flex items-center gap-2 text-sm font-medium">
                                {(instagramConnectStage === 'waiting_for_login' || instagramConnectStage === 'authorization_in_progress') && (
                                  <Loader2Icon className="h-4 w-4 animate-spin" />
                                )}
                                {instagramProgressTitle}
                              </div>
                              <p className="text-sm opacity-90">{instagramConnectionNotice}</p>
                            </div>
                          )}
                          <Button
                            onClick={handleConnectInstagram}
                            className="w-full sm:w-auto"
                            disabled={!instagramStatus?.embed_url || isInstagramConnecting}
                          >
                            {isInstagramConnecting
                              ? instagramConnectButtonLabel
                              : instagramStatus?.embed_url
                                ? 'Connect Instagram'
                                : 'Preparing...'}
                          </Button>
                          {(instagramConnectStage === 'failed' || instagramConnectStage === 'cancelled') && instagramConnectionNotice && !instagramProgressTitle && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                              {instagramConnectionNotice}
                            </div>
                          )}
                        </>
                      )}

                      {renderChannelAiControl('instagram_ai_paused', 'Instagram')}

                    </CardContent>
                  </Card>

                  {/* WhatsApp Integration Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-green-500 p-2.5">
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">WhatsApp</h3>
                            <p className="text-sm text-muted-foreground">
                              Send and receive messages via WhatsApp Business
                            </p>
                          </div>
                        </div>
                        {whatsappStatus?.connected ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Not Connected</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {whatsappStatus?.connected ? (
                        <>
                          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                            {whatsappStatus.display_phone_number ? (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Phone Number:</span>
                                <span className="font-medium">{whatsappStatus.display_phone_number}</span>
                              </div>
                            ) : null}
                            {whatsappStatus.verified_name ? (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Business Name:</span>
                                <span className="font-medium">{whatsappStatus.verified_name}</span>
                              </div>
                            ) : null}
                            {whatsappStatus.connected_at ? (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Connected:</span>
                                <span className="font-medium">
                                  {new Date(whatsappStatus.connected_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                            ) : null}
                          </div>

                          {/* Webhook configuration instructions */}
                          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 space-y-3">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                              Paste these values into Meta App Dashboard → WhatsApp → Configuration → Webhook
                            </p>
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Webhook URL</p>
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 rounded bg-background border px-2 py-1.5 text-xs font-mono break-all">
                                    {whatsappStatus.webhook_url ?? ''}
                                  </code>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    aria-label="Copy webhook URL"
                                    onClick={() => {
                                      navigator.clipboard.writeText(whatsappStatus.webhook_url ?? '')
                                      toast.success('Webhook URL copied')
                                    }}
                                  >
                                    Copy
                                  </Button>
                                </div>
                              </div>
                              {whatsappStatus.verify_token ? (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Verify Token</p>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 rounded bg-background border px-2 py-1.5 text-xs font-mono break-all">
                                      {whatsappStatus.verify_token}
                                    </code>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      aria-label="Copy verify token"
                                      onClick={() => {
                                        navigator.clipboard.writeText(whatsappStatus.verify_token ?? '')
                                        toast.success('Verify token copied')
                                      }}
                                    >
                                      Copy
                                    </Button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                              ⚠️ Make sure your Meta App is in <strong>Live Mode</strong> (not Development Mode) — Development Mode silently drops messages from real users.
                            </p>
                          </div>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDisconnectWhatsApp}
                          >
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Enter your WhatsApp Business credentials from the Meta Developer Dashboard.
                          </p>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="wa-phone-number-id">Phone Number ID</Label>
                              <Input
                                id="wa-phone-number-id"
                                name="wa-phone-number-id"
                                value={waPhoneNumberId}
                                onChange={(e) => setWaPhoneNumberId(e.target.value)}
                                placeholder="e.g. 123456789012345"
                                disabled={isConnectingWhatsApp}
                              />
                              <p className="text-xs text-muted-foreground">
                                Found in Meta Dashboard → WhatsApp → API Setup
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="wa-waba-id">Business Account ID</Label>
                              <Input
                                id="wa-waba-id"
                                name="wa-waba-id"
                                value={waWabaId}
                                onChange={(e) => setWaWabaId(e.target.value)}
                                placeholder="e.g. 123456789012345"
                                disabled={isConnectingWhatsApp}
                              />
                              <p className="text-xs text-muted-foreground">
                                Found in Meta Dashboard → WhatsApp → API Setup
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="wa-access-token">Permanent Access Token</Label>
                              <div className="relative">
                                <Input
                                  id="wa-access-token"
                                  name="wa-access-token"
                                  type={showWaToken ? 'text' : 'password'}
                                  value={waAccessToken}
                                  onChange={(e) => setWaAccessToken(e.target.value)}
                                  placeholder="Paste your token here"
                                  disabled={isConnectingWhatsApp}
                                  className="pr-10"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label={showWaToken ? 'Hide token' : 'Show token'}
                                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                  onClick={() => setShowWaToken((v) => !v)}
                                >
                                  {showWaToken ? (
                                    <EyeOffIcon className="h-4 w-4" />
                                  ) : (
                                    <EyeIcon className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Create a System User token in Meta Business Manager → System Users
                              </p>
                            </div>

                            <Separator />
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Optional — App Credentials</p>
                            <p className="text-xs text-muted-foreground">
                              Provide your Meta App ID and Secret to enable automatic webhook subscription.
                            </p>

                            <div className="space-y-1.5">
                              <Label htmlFor="wa-app-id">App ID</Label>
                              <Input
                                id="wa-app-id"
                                name="wa-app-id"
                                value={waAppId}
                                onChange={(e) => setWaAppId(e.target.value)}
                                placeholder="e.g. 1274437444500708"
                                disabled={isConnectingWhatsApp}
                              />
                              <p className="text-xs text-muted-foreground">
                                Found in Meta App Dashboard → App Settings → Basic
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="wa-app-secret">App Secret</Label>
                              <div className="relative">
                                <Input
                                  id="wa-app-secret"
                                  name="wa-app-secret"
                                  type={showWaAppSecret ? 'text' : 'password'}
                                  value={waAppSecret}
                                  onChange={(e) => setWaAppSecret(e.target.value)}
                                  placeholder="Paste your App Secret here"
                                  disabled={isConnectingWhatsApp}
                                  className="pr-10"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label={showWaAppSecret ? 'Hide secret' : 'Show secret'}
                                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                  onClick={() => setShowWaAppSecret((v) => !v)}
                                >
                                  {showWaAppSecret ? (
                                    <EyeOffIcon className="h-4 w-4" />
                                  ) : (
                                    <EyeIcon className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Found in Meta App Dashboard → App Settings → Basic
                              </p>
                            </div>

                            <Button
                              onClick={handleConnectWhatsApp}
                              disabled={isConnectingWhatsApp || !waPhoneNumberId.trim() || !waWabaId.trim() || !waAccessToken.trim()}
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                              {isConnectingWhatsApp ? 'Connecting...' : 'Connect WhatsApp'}
                            </Button>
                          </div>
                        </div>
                      )}

                      {renderChannelAiControl('whatsapp_ai_paused', 'WhatsApp')}

                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="ai-support" className="space-y-6">
                <div className="grid gap-6 max-w-4xl">
                  {/* AI Auto-Response Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Auto-Response</CardTitle>
                      <CardDescription>
                        Configure how AI responds to incoming messages
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* AI Auto-Response Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="ai-auto-response">AI Auto-Response</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically respond to Telegram messages with AI
                          </p>
                        </div>
                        <Switch
                          id="ai-auto-response"
                          checked={aiConfig?.ai_auto_response ?? false}
                          onCheckedChange={(checked) => handleAIConfigChange({ ai_auto_response: checked })}
                        />
                      </div>

                      <Separator />

                      {/* Auto Extract Data Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="auto-extract-data">Auto Extract Data</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically extract lead information from conversations
                          </p>
                        </div>
                        <Switch
                          id="auto-extract-data"
                          checked={aiConfig?.auto_extract_data ?? false}
                          onCheckedChange={(checked) => handleAIConfigChange({ auto_extract_data: checked })}
                        />
                      </div>

                      <Separator />

                      {/* Response Delay / Message Pooling Window */}
                      <div className="space-y-2">
                        <Label htmlFor="response-delay">Message Pooling Window (seconds)</Label>
                        <Input
                          id="response-delay"
                          type="number"
                          min="0"
                          max="60"
                          value={aiConfig?.response_delay ?? 5}
                          onChange={(e) => handleAIConfigChange({ response_delay: parseInt(e.target.value) || 0 })}
                          className="max-w-xs"
                        />
                        <p className="text-sm text-muted-foreground">
                          How long to wait after receiving a message before replying. Short messages sent in quick succession are pooled into one question and answered together. Recommended: 5–10 seconds.
                        </p>
                        {(aiConfig?.response_delay ?? 5) > 15 && (
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            ⚠ Values above 15s cause Telegram to retry delivery, which can result in duplicate responses. Set to 5–10 seconds.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Proactive Outreach */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Proactive Outreach</CardTitle>
                      <CardDescription>
                        AI agent automatically follows up with leads to move them toward conversion
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Enable Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="proactive-outreach">Enable Autonomous Follow-ups</Label>
                          <p className="text-sm text-muted-foreground">
                            AI agent monitors leads and sends personalized follow-ups
                          </p>
                        </div>
                        <Switch
                          id="proactive-outreach"
                          checked={aiConfig?.proactive_outreach_enabled ?? false}
                          onCheckedChange={(checked) => handleAIConfigChange({ proactive_outreach_enabled: checked })}
                        />
                      </div>

                      {aiConfig?.proactive_outreach_enabled && (
                        <>
                          <Separator />

                          {/* Check Frequency */}
                          <div className="space-y-2">
                            <Label htmlFor="check-frequency">Check Frequency (hours)</Label>
                            <Select
                              value={String(aiConfig?.check_frequency_hours ?? 24)}
                              onValueChange={(v) => handleAIConfigChange({ check_frequency_hours: parseInt(v) })}
                            >
                              <SelectTrigger className="max-w-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="24">Every 24 hours</SelectItem>
                                <SelectItem value="48">Every 48 hours</SelectItem>
                                <SelectItem value="72">Every 72 hours</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                              How often the AI agent checks leads for follow-up needs
                            </p>
                          </div>

                          {/* Inactivity Threshold */}
                          <div className="space-y-2">
                            <Label htmlFor="inactivity-threshold">Inactivity Threshold (days)</Label>
                            <Input
                              id="inactivity-threshold"
                              type="number"
                              min="1"
                              max="30"
                              value={aiConfig?.inactivity_threshold_days ?? 2}
                              onChange={(e) => handleAIConfigChange({ inactivity_threshold_days: parseInt(e.target.value) || 2 })}
                              className="max-w-xs"
                            />
                            <p className="text-sm text-muted-foreground">
                              Days of inactivity before the agent sends a follow-up
                            </p>
                          </div>

                          {/* Max Follow-up Attempts */}
                          <div className="space-y-2">
                            <Label htmlFor="max-followups">Maximum Follow-up Attempts</Label>
                            <Input
                              id="max-followups"
                              type="number"
                              min="1"
                              max="10"
                              value={aiConfig?.max_followup_attempts ?? 3}
                              onChange={(e) => handleAIConfigChange({ max_followup_attempts: parseInt(e.target.value) || 3 })}
                              className="max-w-xs"
                            />
                            <p className="text-sm text-muted-foreground">
                              Stop following up after this many attempts per lead
                            </p>
                          </div>

                          <Separator />

                          {/* Manual Run Button */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Run Agent Now</Label>
                              <p className="text-sm text-muted-foreground">
                                Manually trigger the agent to check all leads
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const result = await runAgentNow()
                                  if (result.success && result.results) {
                                    toast.success(`Agent completed: ${result.results.messaged} messages sent, ${result.results.skipped} skipped`)
                                  } else {
                                    toast.error(result.error || 'Failed to run agent')
                                  }
                                } catch {
                                  toast.error('Failed to run agent')
                                }
                              }}
                            >
                              Run Now
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Agent Autonomy Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Agent Autonomy</CardTitle>
                      <CardDescription>
                        Control how much the AI agent can do autonomously
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Auto Status Progression */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="auto-status-progression">Auto Status Progression</Label>
                          <p className="text-sm text-muted-foreground">
                            AI automatically moves leads through stages based on conversation signals
                          </p>
                        </div>
                        <Switch
                          id="auto-status-progression"
                          checked={aiConfig?.auto_status_progression ?? false}
                          onCheckedChange={(checked) => handleAIConfigChange({ auto_status_progression: checked })}
                        />
                      </div>

                      <Separator />

                      {/* Smart Objection Handling */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="smart-objection-handling">Smart Objection Handling</Label>
                          <p className="text-sm text-muted-foreground">
                            AI detects objections and responds with knowledge base rebuttals
                          </p>
                        </div>
                        <Switch
                          id="smart-objection-handling"
                          checked={aiConfig?.smart_objection_handling ?? false}
                          onCheckedChange={(checked) => handleAIConfigChange({ smart_objection_handling: checked })}
                        />
                      </div>

                      <Separator />

                      {/* Auto Execute Tasks */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="auto-execute-tasks">Self-Completing Tasks</Label>
                          <p className="text-sm text-muted-foreground">
                            AI creates and completes tasks automatically (send messages, documents)
                          </p>
                        </div>
                        <Switch
                          id="auto-execute-tasks"
                          checked={aiConfig?.auto_execute_tasks ?? false}
                          onCheckedChange={(checked) => handleAIConfigChange({ auto_execute_tasks: checked })}
                        />
                      </div>

                      <Separator />

                      {/* Conversation Goals */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="conversation-goals">Conversation Goals</Label>
                          <p className="text-sm text-muted-foreground">
                            AI tracks and works toward goals for each lead (collect email, schedule call)
                          </p>
                        </div>
                        <Switch
                          id="conversation-goals"
                          checked={aiConfig?.conversation_goals_enabled ?? false}
                          onCheckedChange={(checked) => handleAIConfigChange({ conversation_goals_enabled: checked })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Persona — managed in Hotel Details */}
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <SparklesIcon className="h-4 w-4 text-muted-foreground" />
                        AI Persona &amp; Style
                      </CardTitle>
                      <CardDescription>
                        Managed in Hotel Details → AI Style tab
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        The AI's persona, tone, emoji use, response length, upselling behaviour, languages, and example
                        conversations are configured in the <strong>Hotel Details</strong> page under the{' '}
                        <strong>AI Style</strong> tab. Changes there take effect immediately on every response.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Company Profile — managed in Hotel Details */}
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2Icon className="h-4 w-4 text-muted-foreground" />
                        Hotel Info &amp; Policies
                      </CardTitle>
                      <CardDescription>
                        Managed in Hotel Details → Hotel Info tab
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        The hotel profile, address, directions, policies, frequently asked questions, and handover
                        contacts are configured in the <strong>Hotel Details</strong> page under the{' '}
                        <strong>Hotel Info</strong> tab. The AI automatically uses all of this context when
                        responding to guests.
                      </p>
                    </CardContent>
                  </Card>

                </div>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6">
                <div className="grid gap-6 max-w-4xl">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('settings.preferences.title')}</CardTitle>
                      <CardDescription>{t('settings.preferences.subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>{t('settings.preferences.language')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings.preferences.languageDesc')}</p>
                        <Select
                          value={language}
                          onValueChange={(val) => {
                            setLanguage(val as Language)
                            toast.success(t('settings.preferences.saved'))
                          }}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">{t('settings.preferences.english')}</SelectItem>
                            <SelectItem value="ru">{t('settings.preferences.russian')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="team" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2"><UsersIcon className="h-5 w-5" />Team Members</CardTitle>
                      <CardDescription>{orgMembers.length} member{orgMembers.length !== 1 ? 's' : ''} in {currentOrg?.name || 'your organization'}</CardDescription>
                    </div>
                    {isOwnerOrAdmin && (
                      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm"><PlusIcon className="mr-1.5 h-3.5 w-3.5" />Invite member</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Invite a team member</DialogTitle></DialogHeader>
                          <div className="space-y-4 py-2">
                            <div className="space-y-2">
                              <Label>Email address</Label>
                              <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" type="email" />
                            </div>
                            <div className="space-y-2">
                              <Label>Role</Label>
                              <Select value={inviteRole} onValueChange={v => setInviteRole(v as 'member' | 'admin')}>
                                <SelectTrigger><span>{inviteRole === 'admin' ? 'Admin — can manage settings and integrations' : 'Member — can manage leads and communications'}</span></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="member">Member — can manage leads and communications</SelectItem>
                                  <SelectItem value="admin">Admin — can manage settings and integrations</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {inviteError && <p className="text-sm text-red-500">{inviteError}</p>}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                            <Button onClick={handleInvite} disabled={inviteLoading || !inviteEmail}>
                              {inviteLoading ? <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" />Inviting...</> : 'Send invite'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardHeader>
                  <CardContent>
                    {membersLoading ? (
                      <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
                    ) : (
                      <div className="divide-y">
                        {orgMembers.map(member => (
                          <div key={member.id} className="flex items-center gap-3 py-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-xs">{(member.user_name || member.user_email).slice(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{member.user_name || member.user_email}</p>
                              <p className="text-xs text-muted-foreground truncate">{member.user_email}</p>
                            </div>
                            <RoleBadge role={member.role} />
                            {isOwnerOrAdmin && member.role !== 'owner' && (
                              <div className="flex items-center gap-1">
                                <Select value={member.role} onValueChange={v => handleRoleChange(member.user_id, v)}>
                                  <SelectTrigger className="h-7 w-24 text-xs"><span>{member.role === 'admin' ? 'Admin' : 'Member'}</span></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveMember(member.user_id)}>
                                  <TrashIcon className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="organization" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BuildingIcon className="h-5 w-5" />Organization Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Organization name</Label>
                      <div className="flex gap-2">
                        <Input value={orgName} onChange={e => setOrgName(e.target.value)} className="max-w-sm" />
                        <Button onClick={handleSaveOrgName} disabled={orgNameSaving || orgName === currentOrg?.name}>
                          {orgNameSaving ? <Loader2Icon className="h-4 w-4 animate-spin" /> : 'Save'}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <p className="text-sm font-mono text-muted-foreground bg-muted px-3 py-2 rounded w-fit">{currentOrg?.slug}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Plan</Label>
                      <p className="capitalize text-sm font-medium">{currentOrg?.plan || '—'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Created</Label>
                      <p className="text-sm text-muted-foreground">
                        {currentOrg?.created_at ? new Date(currentOrg.created_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {canManageInternalToolsVisibility && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Advanced</CardTitle>
                      <CardDescription>
                        Control whether internal operational tools are visible in the interface for this organization.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                        These controls only show or hide internal tools in the product interface. They do not block direct links in this version.
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Label htmlFor="show-ai-diagnostics" className="text-sm font-medium">Show AI Diagnostics</Label>
                              <Badge variant={internalToolsVisibility.showAiDiagnostics ? 'default' : 'secondary'}>
                                {internalToolsVisibility.showAiDiagnostics ? 'On' : 'Off'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Shows or hides the AI Diagnostics panel inside Communications.
                            </p>
                          </div>
                          <Switch
                            id="show-ai-diagnostics"
                            checked={internalToolsVisibility.showAiDiagnostics}
                            disabled={updateInternalToolsVisibilityMutation.isPending}
                            onCheckedChange={(checked) => handleInternalToolsVisibilityChange('showAiDiagnostics', checked)}
                          />
                        </div>

                        <div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Label htmlFor="show-dev-database-export" className="text-sm font-medium">Show Dev Database Export</Label>
                              <Badge variant={internalToolsVisibility.showDevDatabaseExport ? 'default' : 'secondary'}>
                                {internalToolsVisibility.showDevDatabaseExport ? 'On' : 'Off'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Shows or hides the Dev Database Export page in Settings navigation.
                            </p>
                          </div>
                          <Switch
                            id="show-dev-database-export"
                            checked={internalToolsVisibility.showDevDatabaseExport}
                            disabled={updateInternalToolsVisibilityMutation.isPending}
                            onCheckedChange={(checked) => handleInternalToolsVisibilityChange('showDevDatabaseExport', checked)}
                          />
                        </div>

                        <div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Label htmlFor="show-reset-ai-memory" className="text-sm font-medium">Show Reset AI Memory</Label>
                              <Badge variant={internalToolsVisibility.showResetAiMemory ? 'default' : 'secondary'}>
                                {internalToolsVisibility.showResetAiMemory ? 'On' : 'Off'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Shows or hides the Reset AI Memory control inside Communications.
                            </p>
                          </div>
                          <Switch
                            id="show-reset-ai-memory"
                            checked={internalToolsVisibility.showResetAiMemory}
                            disabled={updateInternalToolsVisibilityMutation.isPending}
                            onCheckedChange={(checked) => handleInternalToolsVisibilityChange('showResetAiMemory', checked)}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Changes save automatically for this organization.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {isOwner && (
                  <Card className="border-destructive/40">
                    <CardHeader>
                      <CardTitle className="text-destructive">Danger Zone</CardTitle>
                      <CardDescription>Permanently delete this organization and all its data.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">Delete organization</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {currentOrg?.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the organization and all associated data including leads, customers, and integrations. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteOrg} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete forever
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {canAccessDevDatabaseExport && (
                <TabsContent value="dev-database-export" className="space-y-6">
                  <div className="grid max-w-4xl gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DatabaseIcon className="h-5 w-5" />
                          Development Database Export
                        </CardTitle>
                        <CardDescription>
                          Create a full snapshot of the current development database for local restoration.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="rounded-xl border bg-muted/40 p-4">
                          <p className="text-sm text-muted-foreground">
                            This export packages the full development database in a restore-friendly archive so the local environment can be recreated as closely as possible to the current dev state.
                          </p>
                        </div>

                        <div className="grid gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
                          <p className="font-medium">Important note</p>
                          <p>
                            This archive includes database data only. Environment variables, API keys, and other service credentials are not exported and may still need to be configured locally.
                          </p>
                        </div>

                        <div className="grid gap-3 rounded-xl border p-4 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">What is included</p>
                          <ul className="list-disc space-y-1 pl-5">
                            <li>All current development database records</li>
                            <li>Primary keys and relationships needed for restoration</li>
                            <li>A restore guide inside the downloaded archive</li>
                          </ul>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Button
                            onClick={handleExportDevDatabase}
                            disabled={isExportingDevDatabase}
                            className="min-h-11"
                          >
                            {isExportingDevDatabase ? (
                              <>
                                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                                Preparing export...
                              </>
                            ) : (
                              <>
                                <DownloadIcon className="mr-2 h-4 w-4" />
                                Export Dev Database
                              </>
                            )}
                          </Button>
                        </div>

                        {devExportSuccessMessage && (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-100">
                            {devExportSuccessMessage}
                          </div>
                        )}

                        {devExportErrorMessage && (
                          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                            {devExportErrorMessage}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}

            </Tabs>
          </div>
        </div>
      </div>

      {/* Stage Dialog */}
      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStage ? 'Edit' : 'Add'} Pipeline Stage</DialogTitle>
            <DialogDescription>
              {editingStage ? 'Update' : 'Create'} a pipeline stage for your leads
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stage-name">Name</Label>
              <Input
                id="stage-name"
                value={stageName}
                onChange={(e) => {
                  setStageName(e.target.value)
                  if (!isKeyManuallyEdited && !editingStage) {
                    setStageKey(slugify(e.target.value))
                  }
                }}
                placeholder="e.g., Qualified"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-key">Key</Label>
              <Input
                id="stage-key"
                value={stageKey}
                onChange={(e) => {
                  setStageKey(e.target.value)
                  setIsKeyManuallyEdited(true)
                }}
                placeholder="e.g., qualified"
                disabled={!!editingStage}
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier (cannot be changed after creation)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-description">Description</Label>
              <Textarea
                id="stage-description"
                value={stageDescription}
                onChange={(e) => setStageDescription(e.target.value)}
                placeholder="Describe this stage..."
                rows={3}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="stage-is-final">Final Stage</Label>
                <p className="text-sm text-muted-foreground">
                  Mark as final (AI agent will not follow up on leads here)
                </p>
              </div>
              <Switch
                id="stage-is-final"
                checked={stageIsFinal}
                onCheckedChange={setStageIsFinal}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseStageDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveStage}>
              {editingStage ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Segment Dialog */}
      <Dialog open={segmentDialogOpen} onOpenChange={(open) => {
        if (!open) handleCloseSegmentDialog()
        else setSegmentDialogOpen(true)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSegment ? 'Edit' : 'Add'} Segment</DialogTitle>
            <DialogDescription>
              {editingSegment ? 'Update' : 'Create'} a client type segment for categorizing leads
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="segment-name">Name</Label>
              <Input
                id="segment-name"
                value={segmentName}
                onChange={(e) => {
                  setSegmentName(e.target.value)
                  if (!isSegmentKeyManuallyEdited && !editingSegment) {
                    setSegmentKey(slugify(e.target.value))
                  }
                }}
                placeholder="e.g., Enterprise"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="segment-key">Key</Label>
              <Input
                id="segment-key"
                value={segmentKey}
                onChange={(e) => {
                  setSegmentKey(e.target.value)
                  setIsSegmentKeyManuallyEdited(true)
                }}
                placeholder="e.g., enterprise"
                disabled={!!editingSegment}
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier (cannot be changed after creation)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseSegmentDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveSegment}>
              {editingSegment ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteDialogType === 'stage' ? 'Pipeline Stage' : 'Segment'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteDialogType === 'stage' ? 'stage' : 'segment'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
