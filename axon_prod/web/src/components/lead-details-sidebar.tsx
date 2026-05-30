import { Lead, fetchLeadNotes } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, CalendarDays, Users, BedDouble, Utensils, ChevronRight } from 'lucide-react'

interface LeadDetailsSidebarProps {
  lead: Lead | null
  open: boolean
  onClose: () => void
  onEdit: (lead: Lead) => void
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  attempted: 'Attempted',
  contacted: 'Contacted',
  unqualified: 'Unqualified',
  nurturing: 'Nurturing',
  converted: 'Converted',
}

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'default',
  attempted: 'secondary',
  contacted: 'outline',
  unqualified: 'destructive',
  nurturing: 'secondary',
  converted: 'default',
}

export function LeadDetailsSidebar({ lead, open, onClose, onEdit }: LeadDetailsSidebarProps) {
  const { data: notes = [] } = useQuery({
    queryKey: ['lead-notes', lead?.id],
    queryFn: () => fetchLeadNotes(lead!.id),
    enabled: open && !!lead?.id,
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Don't render Sheet until we have a lead to avoid React 19 static flag errors
  if (!lead) {
    return null
  }

  const telegramDisplay = lead.telegram_username
    ? `@${lead.telegram_username}`
    : lead.telegram_user_id || null
  const instagramDisplay = lead.instagram_username
    ? `@${lead.instagram_username}`
    : lead.instagram_user_id || null

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto px-6">
        <SheetHeader>
          <div className="flex items-center justify-between gap-4">
            <SheetTitle className="flex-1">{lead.contact_person || 'Unnamed Lead'}</SheetTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(lead)}
                data-cayu="Button:edit-lead"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <SheetDescription>{lead.email || ''}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">

          {/* 1. Summary */}
          {lead.problem_description ? (
            <div>
              <div className="text-sm font-medium mb-1">Summary</div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap rounded-md border p-3 bg-muted/30">
                {lead.problem_description}
              </div>
            </div>
          ) : null}

          {/* 2. Booking Details */}
          {(lead.check_in_date || lead.check_out_date || lead.guest_count || lead.room_type_preference || lead.meal_plan) ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                <BedDouble className="h-4 w-4" />
                Booking Details
              </div>

              {(lead.check_in_date || lead.check_out_date) ? (
                <div className="flex items-start gap-2">
                  <CalendarDays className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                  <div className="text-sm">
                    <span className="text-muted-foreground">Dates: </span>
                    <span className="font-medium">
                      {lead.check_in_date ? formatDate(lead.check_in_date) : '?'}
                      {' — '}
                      {lead.check_out_date ? formatDate(lead.check_out_date) : '?'}
                    </span>
                    {lead.check_in_date && lead.check_out_date ? (
                      <span className="ml-2 text-xs text-blue-600 font-medium">
                        {Math.round((new Date(lead.check_out_date).getTime() - new Date(lead.check_in_date).getTime()) / 86400000)} nights
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {lead.guest_count ? (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">Guests: </span>
                    <span className="font-medium">{lead.guest_count}</span>
                  </span>
                </div>
              ) : null}

              {lead.room_type_preference ? (
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">Room: </span>
                    <span className="font-medium">{lead.room_type_preference}</span>
                  </span>
                </div>
              ) : null}

              {lead.meal_plan && lead.meal_plan !== 'none' ? (
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">Meals: </span>
                    <span className="font-medium">
                      {lead.meal_plan === 'breakfast' ? 'Breakfast only' :
                       lead.meal_plan === 'lunch' ? 'Lunch only' :
                       lead.meal_plan === 'dinner' ? 'Dinner only' :
                       lead.meal_plan === 'half_board_bl' ? 'Half-board (Breakfast + Lunch)' :
                       lead.meal_plan === 'half_board_bd' ? 'Half-board (Breakfast + Dinner)' :
                       lead.meal_plan === 'full_board' ? 'Full board' : lead.meal_plan}
                    </span>
                  </span>
                </div>
              ) : null}

              {[lead.check_in_date, lead.check_out_date, lead.guest_count, lead.room_type_preference, lead.meal_plan].filter(Boolean).length < 5 ? (
                <div className="flex items-center gap-1.5 pt-1 border-t border-blue-200">
                  <ChevronRight className="h-3 w-3 text-blue-400" />
                  <span className="text-xs text-blue-500">
                    {5 - [lead.check_in_date, lead.check_out_date, lead.guest_count, lead.room_type_preference, lead.meal_plan].filter(Boolean).length} detail(s) still needed
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* 3. Next Steps */}
          {lead.next_steps ? (
            <div>
              <div className="text-sm font-medium mb-1">Next Steps</div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap rounded-md border p-3 bg-muted/30">
                {lead.next_steps}
              </div>
            </div>
          ) : null}

          {/* 4. Contact Info */}
          <div className="rounded-md border divide-y text-sm">
            {lead.contact_person ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="font-medium text-muted-foreground">Contact</span>
                <span>{lead.contact_person}</span>
              </div>
            ) : null}
            {lead.phone ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="font-medium text-muted-foreground">Phone</span>
                <span>{lead.phone}</span>
              </div>
            ) : null}
            {lead.email ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="font-medium text-muted-foreground">Email</span>
                <a href={`mailto:${lead.email}`} className="text-primary hover:underline truncate max-w-[60%]">{lead.email}</a>
              </div>
            ) : null}
            {telegramDisplay ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="font-medium text-muted-foreground">Telegram</span>
                <span>{telegramDisplay}</span>
              </div>
            ) : null}
            {lead.whatsapp_phone ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="font-medium text-muted-foreground">WhatsApp</span>
                <span>{lead.whatsapp_phone}</span>
              </div>
            ) : null}
            {instagramDisplay ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="font-medium text-muted-foreground">Instagram</span>
                <span>{instagramDisplay}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="font-medium text-muted-foreground">Client Type</span>
              <Badge variant="outline">{lead.segment_display}</Badge>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="font-medium text-muted-foreground">Status</span>
              <Badge variant={STATUS_COLORS[lead.status]}>{STATUS_LABELS[lead.status]}</Badge>
            </div>
          </div>

          {/* Notes History */}
          {notes.length > 0 ? (
            <div className="space-y-3 pt-4 border-t">
              <div className="text-sm font-medium">Notes History</div>
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-md border p-3 space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(note.created_at)}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{note.content}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Timestamps */}
          <div className="space-y-2 pt-4 border-t">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Created: {formatDate(lead.created_at)}</div>
              <div>Updated: {formatDate(lead.updated_at)}</div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
