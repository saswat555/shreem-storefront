"use client"

import { updateCustomer } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import { useMemo, useState, useTransition } from "react"

type FamilyMember = {
  id: string
  name: string
  birth_date: string
  birth_time: string
  birth_place: string
}

const normalizeMembers = (metadata: Record<string, unknown> | null | undefined) => {
  const raw = metadata?.family_members

  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map((item) => (item && typeof item === "object" ? (item as Partial<FamilyMember>) : null))
    .filter(Boolean)
    .map((item, index) => ({
      id: String(item?.id || `family-${index}`),
      name: String(item?.name || ""),
      birth_date: String(item?.birth_date || ""),
      birth_time: String(item?.birth_time || ""),
      birth_place: String(item?.birth_place || ""),
    }))
    .filter((item) => item.name || item.birth_date || item.birth_time || item.birth_place)
}

const emptyMember = (): FamilyMember => ({
  id: `family-${Date.now()}`,
  name: "",
  birth_date: "",
  birth_time: "",
  birth_place: "",
})

const FamilyMembersManager = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const initialMembers = useMemo(
    () => normalizeMembers(customer?.metadata as Record<string, unknown>),
    [customer?.metadata]
  )
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers)
  const [draft, setDraft] = useState<FamilyMember>(emptyMember)
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  const saveMembers = (nextMembers: FamilyMember[]) => {
    setMessage("")
    setMembers(nextMembers)
    startTransition(async () => {
      try {
        await updateCustomer({
          metadata: {
            ...(customer?.metadata || {}),
            family_members: nextMembers,
          },
        } as any)
        setMessage("Saved")
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not save family members")
      }
    })
  }

  const addMember = () => {
    if (!draft.name.trim() || !draft.birth_date || !draft.birth_time || !draft.birth_place.trim()) {
      setMessage("Add name, date, time and place.")
      return
    }

    saveMembers([...members, { ...draft, name: draft.name.trim(), birth_place: draft.birth_place.trim() }])
    setDraft(emptyMember())
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-[rgba(13,129,126,0.22)] bg-white/80 px-3 py-2 text-sm font-semibold text-[var(--shreem-accent-dark)]"
      >
        <span aria-hidden="true">+</span>
        Family kundli details
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/42 px-4 py-6">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-5 shadow-2xl small:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="brand-kicker">Family profiles</p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--shreem-ink)]">
                  Save birth details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[var(--shreem-border)] px-3 py-1.5 text-sm font-semibold text-[var(--shreem-ink)]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="grid gap-3 small:grid-cols-2">
                <input
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  placeholder="Name"
                  className="h-12 rounded-[16px] border border-[var(--shreem-border)] px-3 text-sm outline-none"
                />
                <input
                  value={draft.birth_place}
                  onChange={(event) => setDraft({ ...draft, birth_place: event.target.value })}
                  placeholder="Birth place"
                  className="h-12 rounded-[16px] border border-[var(--shreem-border)] px-3 text-sm outline-none"
                />
                <input
                  type="date"
                  value={draft.birth_date}
                  onChange={(event) => setDraft({ ...draft, birth_date: event.target.value })}
                  className="h-12 rounded-[16px] border border-[var(--shreem-border)] px-3 text-sm outline-none"
                />
                <input
                  type="time"
                  value={draft.birth_time}
                  onChange={(event) => setDraft({ ...draft, birth_time: event.target.value })}
                  className="h-12 rounded-[16px] border border-[var(--shreem-border)] px-3 text-sm outline-none"
                />
              </div>
              <button
                type="button"
                onClick={addMember}
                disabled={isPending}
                className="rounded-full bg-[linear-gradient(135deg,#0d817e_0%,#123f63_52%,#6f211f_100%)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Add family member
              </button>
              {message && (
                <p className="text-xs font-semibold text-[var(--shreem-muted)]">{message}</p>
              )}
            </div>

            <div className="mt-5 grid gap-2">
              {members.length ? (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col gap-2 rounded-[16px] border border-[var(--shreem-border)] bg-[rgba(255,248,233,0.58)] px-4 py-3 small:flex-row small:items-center small:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-[var(--shreem-ink)]">{member.name}</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--shreem-muted)]">
                        {member.birth_date} · {member.birth_time} · {member.birth_place}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveMembers(members.filter((item) => item.id !== member.id))}
                      className="text-left text-xs font-semibold text-[var(--shreem-accent-dark)]"
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-[var(--shreem-muted)]">
                  Add family details once and reuse them during astrology readings.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FamilyMembersManager
